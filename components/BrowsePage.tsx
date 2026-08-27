"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import CategoryTabs from "@/components/CategoryTabs";
import { BROWSE_TABS, getEpisode, type Series, type BrowseCategory } from "@/lib/catalog";
import { buildResumeUrl } from "@/lib/resume";
import TubiHeroCarousel from "@/components/TubiHeroCarousel";
import CreatorsLanding from "@/components/CreatorsLanding";
import { MUX_MAP } from "@/lib/mux-public-map";
import { startInstantPlayer } from "@/lib/instant-player";

// Eagerly preload hls.js so it's cached before user taps a video.
// Deferred via setTimeout: a dynamic import() fired DURING module evaluation
// can deadlock the bundler's chunk loader (the promise never settles).
if (typeof window !== "undefined") {
  setTimeout(() => { import("hls.js").catch(() => {}); }, 0);
}

// Deterministic, seedable shuffle so the order is stable within one page
// load (won't reshuffle on every re-render) but fresh on each refresh.
function shuffleWithSeed<T>(arr: T[], seed: number): T[] {
  const out = arr.slice();
  let s = seed >>> 0;
  for (let i = out.length - 1; i > 0; i--) {
    // mulberry32 PRNG
    s |= 0; s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    const rnd = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    const j = Math.floor(rnd * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/* Categories whose titles live in their OWN tab and nowhere else. The Drama
   grid is the catch-all, so anything listed here is subtracted from it.
   - espanol / bollywood: language-exclusive. A Spanish or Hindi title in the
     English Drama grid is a content mismatch, not a bonus.
   - reality / red-carpet: those tabs render their own custom sections, so a
     title appearing in Drama as well would be a duplicate.
   Add a category here the moment it gets its own tab. scripts/audit-perf.ts
   asserts every tab-exclusive category is present. */
const TAB_EXCLUSIVE: BrowseCategory[] = ["espanol", "bollywood", "reality", "red-carpet"];

/* The six titles pinned to the top of the Drama grid, in this order, and the
   exact set the hero carousel rotates through. They are PINNED, not shuffled:
   the rest of Drama reshuffles every load, so without this the promoted drop
   sank into the grid and the hero showed whatever landed first.
   Order here IS display order — reorder this array to reorder the shelf.
   Every entry must be live, Drama-visible and carry categories ["new"]; they
   render the NEW badge in both placements. Kept out: the-crown, which has
   popularRank 4 and is already promoted through Hot as Trending. */
const FEATURED_NEW = [
  "lost-and-found",
  "help-im-falling-in-love-with-my-rude-ceo",
  "tied-by-fate",
  "twist-of-time",
  "the-inheritance-game",
  "billionaire-daughters-love-triangle",
] as const;
const FEATURED_NEW_SET = new Set<string>(FEATURED_NEW);

function Badge({ type, large = false }: { type: "trending" | "new"; large?: boolean }) {
  return (
    <div
      className={`absolute z-10 rounded font-bold uppercase tracking-wider ${
        large ? "top-2 left-2 px-2 py-1 text-[10px]" : "top-1.5 left-1.5 px-1.5 py-0.5 text-[8px]"
      }`}
      style={{
        background: type === "trending" ? "#E0115F" : "#8B5CF6",
        color: "#fff",
      }}
    >
      {type === "trending" ? "Trending" : "New"}
    </div>
  );
}

function Poster({ src, alt, sizes = "(max-width: 440px) 33vw, 146px" }: { src: string; alt: string; sizes?: string }) {
  const [loaded, setLoaded] = useState(false);
  if (!src) {
    return (
      <div
        className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-center px-1"
        style={{ background: "linear-gradient(135deg, #1A1A26, #12121C)", color: "#6B6B7B" }}
      >
        {alt.split(" ").slice(0, 3).join(" ")}
      </div>
    );
  }
  return (
    <>
      {/* Shimmer placeholder until the poster decodes, then a soft fade-in */}
      {!loaded && <div className="absolute inset-0 skeleton" />}
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        className="object-cover"
        onLoad={() => setLoaded(true)}
        style={{ opacity: loaded ? 1 : 0, transition: "opacity 0.35s cubic-bezier(0.22, 1, 0.36, 1)" }}
      />
    </>
  );
}

interface Props {
  allSeries: Series[];
  liveSeries: Series[];
  tabData: Record<string, Series[]>;
}

interface ContinueItem {
  seriesSlug: string;
  seriesTitle: string;
  posterUrl: string;
  episodeNumber: number;
  totalEpisodes: number;
  progressSeconds: number;
  updatedAt?: string;
}

export default function BrowsePage({ allSeries, liveSeries, tabData }: Props) {
  const activeTabs = BROWSE_TABS;

  const posterClick = useCallback((e: React.MouseEvent<HTMLElement>, slug: string, epNum = 1, resumeS = 0) => {
    // Modified clicks (open in new tab, etc.) get default browser behavior —
    // don't spin up a hidden player for a tab the user isn't watching.
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    // The tapped poster doubles as the loading state (user preference:
    // poster > black) — the episode page paints it instantly from cache.
    try {
      const img = e.currentTarget.querySelector("img") as HTMLImageElement | null;
      const src = img?.currentSrc || img?.src;
      if (src) sessionStorage.setItem("verza-transition", JSON.stringify({ src, ts: Date.now() }));
    } catch {}
    // Start the movie downloading + decoding NOW (hidden, muted). The episode
    // page adopts this already-running player, so the poster crossfades into
    // the movie the moment its first frame is ready — the wait is only the
    // real network time, nothing architectural. Skipped for mid-episode
    // resumes: the player would buffer from 0:00 while playback starts at ?t=.
    // Paid episodes are also skipped: their public IDs must not be requested or
    // exposed by the instant-player path; EpisodeFeed obtains an authorized,
    // expiring source after navigation instead.
    if (resumeS <= 2) {
      const show = allSeries.find((item) => item.slug === slug);
      const publicId =
        show && epNum <= show.freeEpisodes
          ? MUX_MAP[slug]?.find((ep) => ep.episode === epNum)?.playbackId
          : undefined;
      startInstantPlayer(publicId);
    }
  }, [allSeries]);

  const [activeTab, setActiveTab] = useState<BrowseCategory>("drama");
  // Direction of the last tab change (1 = forward/next, -1 = back/prev) so the
  // incoming tab content can slide in from the matching side.
  const [slideDir, setSlideDir] = useState<1 | -1>(1);
  const [heroIdx, setHeroIdx] = useState(0);
  const [heroPaused, setHeroPaused] = useState(false);
  const [continueWatching, setContinueWatching] = useState<ContinueItem[]>([]);
  const [showSplash] = useState<string | null>(null);

  // Shuffle seed: 0 on the server + first client render (keeps hydration in
  // sync), then a random value after mount so the catalog order is freshly
  // randomized on every page load / refresh.
  const [shuffleSeed, setShuffleSeed] = useState(0);
  useEffect(() => {
    const seed = Math.floor(Math.random() * 2147483647) + 1;
    queueMicrotask(() => setShuffleSeed(seed));
  }, []);

  // Drama shows the whole library; other tabs show their own set. Hot stays
  // ranked, everything else is shuffled fresh each load for variety.
  const filtered = useMemo(() => {
    // Drama shows the whole library EXCEPT tab-exclusive titles: Too Much Junk
    // (Music tab), red-carpet events (Red Carpet tab only), and reality titles
    // like Storage Pirates (Reality tab only — must not appear in the Drama grid).
    const base =
      activeTab === "drama"
        ? liveSeries.filter(
            (s) =>
              s.slug !== "too-much-junk" && // Music tab only
              !TAB_EXCLUSIVE.some((c) => s.categories.includes(c)),
          )
        : tabData[activeTab] ?? [];
    if (shuffleSeed === 0 || activeTab === "popular") return base;
    const shuffled = shuffleWithSeed(base, shuffleSeed + activeTab.length);
    if (activeTab !== "drama") return shuffled;
    // Pin the featured six to the top in FEATURED_NEW order; everything else
    // keeps its freshly shuffled order behind them.
    const pinned = FEATURED_NEW.map((slug) => shuffled.find((x) => x.slug === slug)).filter(
      (x): x is Series => Boolean(x),
    );
    return [...pinned, ...shuffled.filter((x) => !FEATURED_NEW_SET.has(x.slug))];
  }, [activeTab, tabData, liveSeries, shuffleSeed]);
  // The hero rotates the SAME six that are pinned at the top of Drama, so the
  // carousel and the top shelf always show the same titles and the same flyers.
  // On other tabs it falls back to that tab's first four. The Mistress Trap
  // flyer isn't full-bleed like the other posters, so it stays out either way.
  const heroSlides = useMemo(() => {
    const pool = filtered.filter((s) => s.slug !== "the-mistress-trap");
    if (activeTab !== "drama") return pool.slice(0, 4);
    const six = FEATURED_NEW.map((slug) => pool.find((x) => x.slug === slug)).filter(
      (x): x is Series => Boolean(x),
    );
    return six.length ? six : pool.slice(0, 6);
  }, [filtered, activeTab]);
  const current = heroSlides[heroIdx % Math.max(heroSlides.length, 1)];

  // Every time the active section changes, reset the hero AND scroll back to
  // the very top — so switching to a tab (or returning to one) always opens at
  // the top instead of wherever the previous section was scrolled to.
  useEffect(() => {
    queueMicrotask(() => setHeroIdx(0));
    if (typeof window !== "undefined") {
      // Every one of these MUST pass behavior:"instant". globals.css sets
      // `* { scroll-behavior: smooth }`, which applies to these scrolling
      // elements too, so a bare scrollTo(0,0) ANIMATES the reset — switching
      // tabs visibly scrolled the page up instead of opening at the top.
      const instant = { top: 0, left: 0, behavior: "instant" as ScrollBehavior };
      window.scrollTo(instant);
      document.documentElement.scrollTo(instant);
      document.body.scrollTo?.(instant);
      (document.querySelector(".device-screen") as HTMLElement | null)?.scrollTo?.(instant);
    }
  }, [activeTab]);

  // Honor a ?tab= query param on mount (e.g. returning from a red carpet event)
  useEffect(() => {
    const tab = new URLSearchParams(window.location.search).get("tab");
    if (tab && BROWSE_TABS.some((t) => t.key === tab)) {
      queueMicrotask(() => setActiveTab(tab as BrowseCategory));
    }
  }, []);

  // Tab state is ephemeral — do NOT write ?tab= to the URL.  The old
  // replaceState approach left /?tab=reality in the history so the browser
  // Back button on the home screen navigated to the reality section.
  // The only tab that writes a URL is red-carpet (via the episode page's
  // backHref="/?tab=red-carpet"); the mount effect above reads that.

  // No splash on Red Carpet — poster shows instantly

  // Reality show data (posters may not exist yet — uses styled placeholders)
  const realityShows = [
    { title: "Sugar Babies", slug: "sugar-babies", poster: "/posters/sugar-babies.jpg" },
    { title: "Buy/Sell Miami", slug: "buy-sell-miami", poster: "/posters/buy-sell-miami.png" },
    { title: "The Vertical Tea", slug: "the-vertical-tea", poster: "/posters/the-vertical-tea.png" },
    { title: "Storage Pirates", slug: "storage-pirates", poster: "/posters/storage-pirates.jpg" },
  ];

  // Fetch continue watching data
  useEffect(() => {
    fetch("/api/watch-progress")
      .then((r) => r.json())
      .then((d) => setContinueWatching(d.items ?? []))
      .catch(() => {});
  }, []);

  // Auto-rotate hero slideshow (works for Drama/New/Hot AND Reality)
  const slideCount = activeTab === "reality" ? realityShows.length : heroSlides.length;

  // Keep the shared hero index inside the active tab's range at all times. The
  // same heroIdx drives the poster hero (Drama/New/Hot) and the Reality hero,
  // whose slide counts can differ — clamping here guarantees the arrows always
  // land on a valid poster and never on a stale/out-of-range slide.
  useEffect(() => {
    if (slideCount > 0 && heroIdx >= slideCount) {
      queueMicrotask(() => setHeroIdx(0));
    }
  }, [slideCount, heroIdx]);

  useEffect(() => {
    if (slideCount <= 1 || heroPaused) return;
    const t = setInterval(() => setHeroIdx((i) => (i + 1) % slideCount), 4000);
    return () => clearInterval(t);
  }, [slideCount, heroPaused]);

  const selectTab = useCallback(
    (key: BrowseCategory) => {
      const keys = activeTabs.map((tb) => tb.key);
      const from = keys.indexOf(activeTab);
      const to = keys.indexOf(key);
      if (from !== -1 && to !== -1 && to !== from) setSlideDir(to > from ? 1 : -1);
      setActiveTab(key);
    },
    [activeTab, activeTabs],
  );

  // Swipe between tabs: swipe left → next tab, swipe right → prev tab
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    // Touches that begin inside a horizontal scroller (Continue Watching row,
    // category tabs bar) must scroll that element, not switch tabs.
    const t = e.target as HTMLElement | null;
    if (t?.closest(".overflow-x-auto, .snap-x")) {
      touchStartX.current = null;
      touchStartY.current = null;
      return;
    }
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (touchStartX.current === null || touchStartY.current === null) return;
      const dx = e.changedTouches[0].clientX - touchStartX.current;
      const dy = e.changedTouches[0].clientY - touchStartY.current;
      touchStartX.current = null;
      touchStartY.current = null;
      // Only trigger if horizontal swipe is dominant and exceeds threshold
      if (Math.abs(dx) < 50 || Math.abs(dy) > Math.abs(dx)) return;
      const keys = activeTabs.map((tb) => tb.key);
      const idx = keys.indexOf(activeTab);
      if (dx < 0 && idx < keys.length - 1) {
        // Swipe left → next tab
        selectTab(keys[idx + 1]);
      } else if (dx > 0 && idx > 0) {
        // Swipe right → prev tab
        selectTab(keys[idx - 1]);
      }
    },
    [activeTab, activeTabs, selectTab],
  );

  // Show ALL filtered series in the grid (not just the ones after the hero)
  // Espanol and Bollywood render as a 2-across grid of larger flyers rather
  // than the shared 3-column grid. Their key art is full-bleed 9:16 and reads
  // poorly at 33vw.
  const twoUp = activeTab === "espanol" || activeTab === "bollywood";
  // These are the newest drops, so every tile carries NEW. Render-time on
  // purpose: tagging the series categories:["new"] would also pull them into
  // the Hot tab and the English-only best-of lists, which are surfaces these
  // language titles are deliberately kept out of.
  const badgeAsNew = twoUp;

  // The grid grows in pages instead of mounting the whole catalogue at once.
  // A decoded bitmap costs width*height*4 in RAM regardless of file size, and
  // the Drama tab is ~78 tiles; that standing cost left a phone with no
  // headroom before the video pipelines allocated. The sentinel loads the next
  // page before the user reaches it, so scrolling still feels continuous.
  // Crawlers are unaffected: app/page.tsx renders every title in <noscript>.
  const PAGE_SIZE = 24;
  const [page, setPage] = useState(1);
  const gridItems = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = gridItems.length < filtered.length;
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  // queueMicrotask, matching the shuffleSeed/loadMe pattern elsewhere in this
  // file: a synchronous setState inside an effect cascades renders.
  useEffect(() => { queueMicrotask(() => setPage(1)); }, [activeTab]);
  useEffect(() => {
    if (!hasMore) return;
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => { if (entries.some((e) => e.isIntersecting)) setPage((prev) => prev + 1); },
      { rootMargin: "800px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, gridItems.length]);

  return (
    <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      {/* Splash screen — VERZA TV logo on black */}
      {showSplash && (
        <div
          className="fixed inset-0 flex items-center justify-center"
          style={{
            zIndex: 100,
            background: "#000",
            animation: "fadeOut 0.5s ease 1s forwards",
          }}
        >
          <div style={{ animation: "scaleIn 0.4s ease" }}>
            <Image src="/logo.png" alt="VERZA TV" width={200} height={55} />
          </div>
        </div>
      )}

      {/* Category tabs — sticky directly under the single-row header (~62px tall
          with the larger logo) so they stay pinned while scrolling */}
      <div
        className="sticky z-30"
        style={{
          // Pin directly under the header; add the top safe-area so the bar stays
          // glued to the header on notch / Dynamic Island devices (installed PWA).
          top: "calc(62px + env(safe-area-inset-top, 0px))",
          background: "rgba(7, 7, 14, 0.95)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        }}
      >
        <CategoryTabs active={activeTab} onSelect={selectTab} tabs={activeTabs} />
      </div>

      {/* Continue Watching row — hidden on the Tubi tab so the partner panel
          starts flush under the tabs and fills the fold with no scroll. */}
      {continueWatching.length > 0 && activeTab !== "tubi" && activeTab !== "creators" && (
        <section className="pb-4 animate-slideUp">
          <h2 className="text-sm font-semibold uppercase tracking-wider mb-3 px-4" style={{ color: "#8A8A9A" }}>Continue Watching</h2>
          <div
            className="flex gap-1.5 overflow-x-auto no-scrollbar px-3 snap-x snap-mandatory"
            style={{ WebkitOverflowScrolling: "touch", overscrollBehaviorY: "none", touchAction: "pan-x pinch-zoom" }}
          >
            {continueWatching.map((item) => {
              const durationS = getEpisode(item.seriesSlug, item.episodeNumber)?.durationS;
              const pct = durationS && durationS > 0 ? Math.min(96, Math.max(4, Math.round((item.progressSeconds / durationS) * 100))) : 8;
              return (
              <Link
                key={`${item.seriesSlug}-${item.episodeNumber}`}
                href={buildResumeUrl(item.seriesSlug, item.episodeNumber, item.progressSeconds)}
                className="group block no-underline flex-shrink-0 snap-start"
                style={{ width: 120 }}
                onClick={(e) => posterClick(e, item.seriesSlug, item.episodeNumber, item.progressSeconds)}
              >
                <div className="relative overflow-hidden rounded-lg" style={{ width: 120, aspectRatio: "2 / 3" }}>
                  {item.posterUrl && (
                    <Image src={item.posterUrl} alt={item.seriesTitle} fill sizes="120px" className="object-cover" />
                  )}
                  {/* Progress bar */}
                  <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: "rgba(0,0,0,0.5)" }}>
                    <div className="h-full" style={{ width: `${pct}%`, background: "linear-gradient(90deg, #E0115F, #8B5CF6)", boxShadow: "0 0 6px rgba(224,17,95,0.5)" }} />
                  </div>
                  {/* Episode badge */}
                  <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold" style={{ background: "rgba(0,0,0,0.7)", color: "#fff" }}>
                    EP {item.episodeNumber}
                  </div>
                </div>
                <div style={{ height: 36 }}>
                  <p className="mt-1.5 text-[11px] font-semibold leading-tight line-clamp-2" style={{ color: "#F5F4F8" }}>{item.seriesTitle}</p>
                </div>
              </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Swappable tab content. The keyed inner remounts on each tab change to
          replay the slide-in animation; slideDir picks which side it enters from. */}
      <div className="tab-slide">
        <div
          key={activeTab}
          className={`tab-slide-inner ${slideDir === 1 ? "tab-slide-next" : "tab-slide-prev"}`}
        >
      {/* Music tab — Too Much Junk poster → taps to native Mux player */}
      {activeTab === "music" && (
        <div>
          <div className="relative pt-4">
            <Link
              href="/series/too-much-junk/1"
              prefetch={true}
              className="block transition-transform active:scale-[0.97]"
              onClick={(e) => posterClick(e, "too-much-junk")}
            >
              <div className="relative mx-auto overflow-hidden rounded-xl" style={{ aspectRatio: "2 / 3", width: "100%", maxWidth: "min(320px, 80vw)", background: "#000" }}>
                <Image
                  src="/posters/too-much-junk.jpg"
                  alt="Too Much Junk"
                  fill
                  priority
                  sizes="(max-width: 440px) 80vw, 320px"
                  className="object-contain"
                />
              </div>
            </Link>
          </div>
        </div>
      )}

      {/* Coming Soon — for empty categories (skip Reality/Music/Red Carpet since they show inline).
          Anime & Español launch here: a branded placeholder that auto-hides the
          moment their posters exist. Other empty categories fall back to the
          generic message. Same card, icon, colors and spacing as the rest of the
          site — no new design language. */}
      {/* Tubi — authorized partner. Full, polished, high-converting promo that
          click-throughs to tubitv.com in a new tab (X-Frame-Options blocks a true
          in-site embed; native app uses a WebView). Copy is original value-prop,
          not Tubi's trademarked taglines. */}
      {activeTab === "tubi" && (
        <section
          className="relative flex flex-col items-center justify-center text-center overflow-hidden"
          style={{
            // Fill the visible band: below the sticky header+tabs (108px) and
            // above the bottom nav. Reserve 96px for the nav — the mobile fixed
            // bar is ~72px, but the desktop phone-frame's docked nav sits taller,
            // so 96 keeps the trust line clear of it in both. Content centers.
            height: "calc(100dvh - 108px - 96px - env(safe-area-inset-bottom, 0px))",
            minHeight: "400px",
            padding: "clamp(6px, 1.6dvh, 16px) 20px",
            gap: "clamp(6px, 1.4dvh, 14px)",
            background: "radial-gradient(circle at 50% 32%, rgba(116,1,203,0.22), transparent 66%)",
          }}
        >
          {/* 1. Primary CTA — the FIRST call to action, at the top of the panel. */}
          <a
            href="https://tubitv.com/"
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="tubi-glow tubi-rise block w-full max-w-[380px] rounded-2xl font-black uppercase tracking-wide no-underline transition-transform active:scale-[0.97] shrink-0"
            style={{
              animationDelay: "40ms",
              containerType: "inline-size",
              padding: "clamp(13px, 1.8dvh, 18px) 0",
              fontSize: "clamp(15px, 4.8cqi, 19px)",
              background: "linear-gradient(135deg, #4B01A5, #7401CB)",
              color: "#FFFF12",
              border: "1px solid rgba(255,255,18,0.35)",
            }}
          >
            Watch Free on Tubi →
          </a>

          {/* 2. Cinematic carousel — 6 big single-feature slides (full head +
                 title in frame). Native 1080x655 ratio; seamless infinite forward
                 loop (never rewinds at the end). */}
          <div className="tubi-rise w-full flex justify-center shrink-0" style={{ animationDelay: "120ms" }}>
            <TubiHeroCarousel
              images={[
                "/tubi-hero-1.webp",
                "/tubi-hero-2.webp",
                "/tubi-hero-3.webp",
                "/tubi-hero-4.webp",
                "/tubi-hero-5.webp",
                "/tubi-hero-6.webp",
              ]}
              aspectRatio="1080 / 600"
            />
          </div>

          {/* 3. Combined value statement — sits under the hero carousel. */}
          <div className="tubi-rise w-full max-w-[380px] shrink-0" style={{ animationDelay: "200ms", containerType: "inline-size" }}>
            <p className="font-bold leading-snug" style={{ color: "#F5F4F8", fontSize: "clamp(13px, 3.9cqi, 17px)" }}>
              Thousands of movies and shows, <span style={{ color: "#FFFF12" }}>free</span> to stream right now. No card, no account.
            </p>
          </div>

          {/* 4. Bigger Tubi wordmark at the bottom. */}
          <div
            className="tubi-rise shrink-0"
            style={{
              animationDelay: "280ms",
              padding: 2,
              borderRadius: 16,
              background: "linear-gradient(135deg, #7401CB, #FFFF12)",
              boxShadow: "0 0 42px rgba(116,1,203,0.55)",
            }}
          >
            <div style={{ borderRadius: 14, overflow: "hidden", background: "#0A0A14" }}>
              <Image
                src="/tubi-logo.png"
                alt="Tubi"
                width={760}
                height={300}
                draggable={false}
                style={{ height: "clamp(40px, 7dvh, 62px)", width: "auto", display: "block", padding: "6px 16px" }}
              />
            </div>
          </div>

          {/* 5. Trust line */}
          <p className="tubi-rise shrink-0" style={{ animationDelay: "340ms", fontSize: "11px", color: "#7A7A8A" }}>
            Streaming free on Tubi. Verza sponsored partner.
          </p>
        </section>
      )}

      {/* Creators tab — the public recruitment surface. Extracted to
          components/CreatorsLanding.tsx: it is a nine-section conversion page
          now, too large to keep inline, and it has a hard copy constraint
          (no earnings promises, no turnaround SLAs) that is easier to police
          in one file. The old inline hero and apply card live inside it. */}
      {activeTab === "creators" && <CreatorsLanding />}
      {activeTab === "reality" && (() => {
        const realityIdx = heroIdx % realityShows.length;
        const currentShow = realityShows[realityIdx];
        return (
          <div>
            {/* A centered, WIDTH-capped card (not edge-to-edge). Capping the width
                fixes the height too (2:3 box), so the whole flyer — including the
                VERZA TV logo at the bottom — always fits on screen without scrolling
                on every iPhone from SE to 17 Pro Max, independent of viewport-height
                quirks. object-cover on the 2:3 box only ever crops the sides (never
                the bottom), so the bottom logo is always visible. */}
            <div className="relative">
              <div
                className="relative mx-auto overflow-hidden rounded-xl"
                style={{ aspectRatio: "2 / 3", width: "100%", maxWidth: "min(320px, 80vw)", background: "#000" }}
              >
                <Image src={currentShow.poster} alt={currentShow.title} fill priority sizes="(max-width: 440px) 80vw, 320px" className="object-cover" />
              </div>

              {/* Arrows removed — slides change via the dots below + auto-rotate. */}
            </div>

            {/* Dot indicators */}
            <div className="flex items-center justify-center gap-1.5 py-2">
              {realityShows.map((_, i) => (
                <button key={i} onClick={() => setHeroIdx(i)} className="p-0 border-0 cursor-pointer" style={{ background: "none" }} aria-label={`Slide ${i + 1}`}>
                  <div className="rounded-full" style={{
                    width: i === realityIdx ? 20 : 6,
                    height: 6,
                    background: i === realityIdx ? "linear-gradient(90deg, #E0115F, #8B5CF6)" : "rgba(255,255,255,0.4)",
                    transition: "width 0.35s cubic-bezier(0.22, 1, 0.36, 1)",
                  }} />
                </button>
              ))}
            </div>

            {/* All Reality posters — 2×2 grid for bigger flyers.
                Only shows with real episodes are tappable; the rest are
                static flyers (their /series pages would 404). */}
            <section className="mt-2 pb-4 px-3">
              <div className="grid grid-cols-2 gap-2.5">
                {realityShows.map((show) => {
                  const playable = (MUX_MAP[show.slug]?.length ?? 0) > 0;
                  const card = (
                    <>
                      <div className="relative overflow-hidden rounded-lg" style={{ aspectRatio: "2 / 3" }}>
                        <Image src={show.poster} alt={show.title} fill sizes="(max-width: 440px) 50vw, 220px" className="object-cover" />
                        {show.title === "Storage Pirates" && (
                          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: "rotate(90deg)" }}>
                              <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                            </svg>
                            <span className="text-[9px] font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>Landscape</span>
                          </div>
                        )}
                      </div>
                      <div style={{ height: 36 }}>
                        <p className="mt-1.5 text-[12px] font-semibold leading-tight line-clamp-2" style={{ color: "#F5F4F8" }}>{show.title}</p>
                        <p className="text-[10px] mt-0.5" style={{ color: "#6B6B7B" }}>Reality</p>
                      </div>
                    </>
                  );
                  return playable ? (
                    <Link
                      key={show.title}
                      href={`/series/${show.slug}/1`}
                      className="block no-underline min-w-0 transition-transform active:scale-[0.97]"
                      prefetch={true}
                      onClick={(e) => posterClick(e, show.slug)}
                    >
                      {card}
                    </Link>
                  ) : (
                    <div key={show.title} className="block min-w-0" aria-disabled="true">
                      {card}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Sponsored Ad Ribbon */}
            <a
              href="https://www.storageblue.com"
              target="_blank"
              rel="noopener noreferrer"
              className="block mx-3 mt-3 mb-0 rounded-xl overflow-hidden transition-transform active:scale-[0.98]"
              style={{
                background: "linear-gradient(135deg, rgba(10,10,20,0.95), rgba(15,15,25,0.95))",
                border: "1px solid rgba(100,180,220,0.12)",
                boxShadow: "0 0 20px rgba(100,180,220,0.04)",
              }}
            >
              <div className="flex items-center justify-center py-2.5 px-6">
                <Image
                  src="/ads/storageblue-logo.png"
                  alt="StorageBlue"
                  width={212}
                  height={52}
                  style={{ height: 52, objectFit: "contain" }}
                />
              </div>
            </a>
          </div>
        );
      })()}

      {/* Red Carpet tab — two event posters (The Carpet). Red Carpet exclusive:
          these never appear in the Drama grid (filtered out above). */}
      {activeTab === "red-carpet" && (
        <section className="pt-4 pb-10 px-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider mb-4 text-center" style={{ color: "#8A8A9A" }}>The Carpet</h2>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { title: "Exes Premiere", poster: "/posters/exes-premiere.png", slug: "exes-premiere" },
              { title: "Love Awards", poster: "/posters/love-awards.png", slug: "love-awards" },
            ].map((event) => (
              <Link
                key={event.title}
                href={`/series/${event.slug}/1`}
                className="block no-underline min-w-0 transition-transform active:scale-[0.97]"
                prefetch={true}
                onClick={(e) => posterClick(e, event.slug)}
              >
                <div className="relative overflow-hidden rounded-lg" style={{ aspectRatio: "2 / 3" }}>
                  <Image src={event.poster} alt={event.title} fill sizes="(max-width: 440px) 50vw, 220px" className="object-cover" />
                </div>
                <div style={{ height: 36 }}>
                  <p className="mt-1.5 text-[12px] font-semibold leading-tight line-clamp-2" style={{ color: "#F5F4F8" }}>{event.title}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: "#6B6B7B" }}>Red Carpet</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Hero Slideshow — shows on Drama/New/Hot (not Reality/Red Carpet/Music) */}
      {/* Espanol and Bollywood show ONLY their title grid: no hero, no
         slideshow above it. The homepage hero is untouched and still
         rotates the pinned FEATURED_NEW six on Drama. */}
      {current && activeTab !== "reality" && activeTab !== "red-carpet" && activeTab !== "music"
        && activeTab !== "espanol" && activeTab !== "bollywood" && (
        <div
          onMouseEnter={() => setHeroPaused(true)}
          onMouseLeave={() => setHeroPaused(false)}
          onTouchStart={() => setHeroPaused(true)}
          onTouchEnd={() => setHeroPaused(false)}
          onTouchCancel={() => setHeroPaused(false)}
        >
          {/* Poster image — same centered, width-capped 2:3 card as the Reality
              section so every tab's hero is the same size. object-contain shows
              the whole 9:16 flyer (incl. the bottom VERZA logo) inside the 2:3
              card without cropping. */}
          <div className="relative">
            <Link
              href={`/series/${current.slug}/1`}
              className="block transition-transform duration-200 ease-out active:scale-[0.98]"
              onClick={(e) => posterClick(e, current.slug)}
            >
              <div
                className="relative mx-auto overflow-hidden rounded-xl"
                style={{
                  aspectRatio: "2 / 3",
                  width: "100%",
                  maxWidth: "min(320px, 80vw)",
                  background: "#07070E",
                }}
              >
                {current.posterUrl ? (
                  /* Hero posters CROSSFADE, so two layers must be mounted at
                     once — swapping a single img src hard-cut between slides.
                     But only TWO: the outgoing slide and the one coming next.
                     Mounting all of them kept ~30MB of decoded bitmap pinned in
                     the viewport, where WebKit never reclaims it because every
                     layer is technically visible, and this subtree remounts on
                     every tab switch. The incoming layer is mounted a full
                     rotation early, so it is decoded before it fades in. */
                  heroSlides.map((s, i) => {
                    const activeIdx = heroIdx % heroSlides.length;
                    const nextIdx = (activeIdx + 1) % heroSlides.length;
                    if (i !== activeIdx && i !== nextIdx) return null;
                    return s.posterUrl ? (
                      <Image
                        key={s.slug}
                        src={s.posterUrl}
                        alt={s.title}
                        fill
                        priority={i === 0}
                        sizes="(max-width: 440px) 80vw, 320px"
                        className="object-contain hero-crossfade"
                        style={{ opacity: i === activeIdx ? 1 : 0 }}
                      />
                    ) : null;
                  })
                ) : (
                  <div
                    className="absolute inset-0 flex items-center justify-center text-lg font-bold"
                    style={{ background: "linear-gradient(135deg, #1A1A26, #12121C)", color: "#6B6B7B" }}
                  >
                    {current.title}
                  </div>
                )}
              </div>
            </Link>

            {/* Hero arrows removed — slides change via the dots below + auto-rotate. */}
          </div>

          {/* Dot indicators overlaid on hero bottom */}
          {heroSlides.length > 1 && (
            <div className="flex items-center justify-center gap-1.5 pt-1 pb-0.5">
              {heroSlides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setHeroIdx(i)}
                  className="p-0 border-0 cursor-pointer"
                  style={{ background: "none" }}
                  aria-label={`Slide ${i + 1}`}
                >
                  <div
                    className="rounded-full"
                    style={{
                      width: i === heroIdx % heroSlides.length ? 20 : 6,
                      height: 6,
                      background: i === heroIdx % heroSlides.length ? "linear-gradient(90deg, #E0115F, #8B5CF6)" : "rgba(255,255,255,0.4)",
                      transition: "width 0.35s cubic-bezier(0.22, 1, 0.36, 1)",
                    }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sponsored Ad Ribbon #1 — only on Drama, New, Hot */}
      {(activeTab === "drama" || activeTab === "new" || activeTab === "popular") && (
        <a
          href="https://www.storageblue.com"
          target="_blank"
          rel="noopener noreferrer"
          className="block mx-3 mt-0 mb-4 rounded-xl overflow-hidden transition-transform active:scale-[0.98]"
          style={{
            background: "linear-gradient(135deg, rgba(10,10,20,0.95), rgba(15,15,25,0.95))",
            border: "1px solid rgba(100,180,220,0.12)",
            boxShadow: "0 0 20px rgba(100,180,220,0.04)",
          }}
        >
          <div className="flex items-center justify-center py-2.5 px-6">
            <Image
              src="/ads/storageblue-logo.png"
              alt="StorageBlue"
              width={212}
              height={52}
              style={{ height: 52, objectFit: "contain" }}
            />
          </div>
        </a>
      )}

      {/* Tab Row — 3-column grid (not on Music/Reality/Red Carpet — they have custom sections) */}
      {gridItems.length > 0 && activeTab !== "music" && activeTab !== "reality" && activeTab !== "red-carpet" && (
        <section className={twoUp ? "pt-4 pb-10 px-3" : "mt-4 pb-4 px-3"}>
          {/* .poster-grid in globals.css pins grid-template-columns to 3 with
              !important, so the 2-up grid simply opts out of that class. */}
          <div className={`stagger-children grid ${twoUp ? "grid-cols-2 gap-2.5" : "poster-grid grid-cols-3 gap-1.5"}`}>
            {/* Posters only. Sponsored products used to be injected into this
                grid every 12 tiles; they now live in the shop section of the
                footer, so browsing stays purely editorial. */}
            {gridItems.map((s) => (
                <Link
                  key={s.slug}
                  href={`/series/${s.slug}/1`}
                  className="group block no-underline min-w-0 transition-transform active:scale-[0.97]"
                  onClick={(e) => posterClick(e, s.slug)}
                >
                  <div className="relative overflow-hidden rounded-lg" style={{ aspectRatio: "2 / 3" }}>
                    <Poster src={s.posterUrl} alt={s.title} sizes={twoUp ? "(max-width: 440px) 50vw, 220px" : "(max-width: 440px) 33vw, 146px"} />
                    {s.popularRank && s.popularRank <= 5 && <Badge type="trending" large={twoUp} />}
                    {(FEATURED_NEW_SET.has(s.slug) || badgeAsNew || (!s.popularRank && s.categories.includes("new"))) && <Badge type="new" large={twoUp} />}
                    <div
                      className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"
                      style={{ background: "rgba(0,0,0,0.3)" }}
                    >
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center scale-75 group-hover:scale-100 transition-transform duration-300"
                        style={{ background: "rgba(224, 17, 95, 0.85)", backdropFilter: "blur(4px)", transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)" }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff" stroke="none">
                          <polygon points="8 5 20 12 8 19" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div style={{ height: 36 }}>
                    <p className="mt-1.5 text-[11px] font-semibold leading-tight line-clamp-2" style={{ color: "#F5F4F8" }}>{s.title}</p>
                    <p className="text-[10px] mt-0.5 line-clamp-1" style={{ color: "#6B6B7B" }}>{s.genre}</p>
                  </div>
                </Link>
            ))}
          </div>
          {/* Paging sentinel — the observer above watches this and appends the
              next page while it is still a screen below the fold, so the grid
              reads as one continuous list. Rendered only while pages remain. */}
          {hasMore && <div ref={sentinelRef} aria-hidden="true" style={{ height: 1 }} />}
        </section>
      )}
        </div>
      </div>

    </div>
  );
}
