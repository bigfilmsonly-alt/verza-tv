"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import CategoryTabs from "@/components/CategoryTabs";
import { useTranslation } from "@/components/LangProvider";
import { BROWSE_TABS, getSeriesByCategory, getEpisode, type Series, type BrowseCategory } from "@/lib/catalog";
import { buildResumeUrl } from "@/lib/resume";
import SummerSaleBadge from "@/components/SummerSaleBadge";
import TubiHeroCarousel from "@/components/TubiHeroCarousel";
import { MUX_MAP } from "@/lib/mux-map";
import { startInstantPlayer } from "@/lib/instant-player";
import HideInIOSApp from "@/components/HideInIOSApp";

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

function Badge({ type }: { type: "trending" | "new" }) {
  return (
    <div
      className="absolute top-1.5 left-1.5 z-10 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider"
      style={{
        background: type === "trending" ? "#E0115F" : "#8B5CF6",
        color: "#fff",
      }}
    >
      {type === "trending" ? "Trending" : "New"}
    </div>
  );
}

function Poster({ src, alt }: { src: string; alt: string }) {
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
        sizes="(max-width: 440px) 33vw, 146px"
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
  const { t } = useTranslation();
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
    if (resumeS <= 2) {
      startInstantPlayer(MUX_MAP[slug]?.find((ep) => ep.episode === epNum)?.playbackId);
    }
  }, []);

  const [activeTab, setActiveTab] = useState<BrowseCategory>("drama");
  // Direction of the last tab change (1 = forward/next, -1 = back/prev) so the
  // incoming tab content can slide in from the matching side.
  const [slideDir, setSlideDir] = useState<1 | -1>(1);
  const [heroIdx, setHeroIdx] = useState(0);
  const [heroPaused, setHeroPaused] = useState(false);
  const [continueWatching, setContinueWatching] = useState<ContinueItem[]>([]);
  const [showSplash, setShowSplash] = useState<string | null>(null);

  // Shuffle seed: 0 on the server + first client render (keeps hydration in
  // sync), then a random value after mount so the catalog order is freshly
  // randomized on every page load / refresh.
  const [shuffleSeed, setShuffleSeed] = useState(0);
  useEffect(() => {
    setShuffleSeed(Math.floor(Math.random() * 2147483647) + 1);
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
              s.slug !== "too-much-junk" &&
              !s.categories.includes("red-carpet") &&
              !s.categories.includes("reality"),
          )
        : tabData[activeTab] ?? [];
    if (shuffleSeed === 0 || activeTab === "popular") return base;
    return shuffleWithSeed(base, shuffleSeed + activeTab.length);
  }, [activeTab, tabData, liveSeries, shuffleSeed]);
  // The Mistress Trap flyer isn't full-bleed like the other posters, so keep it out of the hero slideshow
  const heroSlides = filtered
    .filter((s) => s.slug !== "the-mistress-trap")
    .slice(0, 4);
  const current = heroSlides[heroIdx % Math.max(heroSlides.length, 1)];

  // Every time the active section changes, reset the hero AND scroll back to
  // the very top — so switching to a tab (or returning to one) always opens at
  // the top instead of wherever the previous section was scrolled to.
  useEffect(() => {
    setHeroIdx(0);
    if (typeof window !== "undefined") {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      (document.querySelector(".device-screen") as HTMLElement | null)?.scrollTo?.(0, 0);
    }
  }, [activeTab]);

  // Honor a ?tab= query param on mount (e.g. returning from a red carpet event)
  useEffect(() => {
    const tab = new URLSearchParams(window.location.search).get("tab");
    if (tab && BROWSE_TABS.some((t) => t.key === tab)) {
      setActiveTab(tab as BrowseCategory);
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
    if (slideCount > 0 && heroIdx >= slideCount) setHeroIdx(0);
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
  const gridItems = filtered;

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
            <img src="/logo.png" alt="VERZA TV" width={200} height={55} />
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

      {/* Summer Sale $1.99 ribbon — top-level sticky + zero-height so it pins
          directly under the tabs bar and stays visible for the ENTIRE page
          scroll (not just over the hero), without pushing any content down.
          Hidden on the Tubi tab — Tubi is free, so the $1.99 unlock is off-message there. */}
      {activeTab !== "tubi" && (
        <div
          className="sticky z-20 flex justify-center pointer-events-none"
          style={{ top: "calc(108px + env(safe-area-inset-top, 0px))", height: 0 }}
        >
          <div className="pointer-events-auto mt-0">
            <HideInIOSApp>
              <SummerSaleBadge />
            </HideInIOSApp>
          </div>
        </div>
      )}

      {/* Continue Watching row */}
      {continueWatching.length > 0 && (
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
          {/* Extra top padding so the poster clears the sticky Summer Sale badge */}
          <div className="relative pt-10">
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
          className="px-5 pt-8 pb-12 flex flex-col items-center text-center"
          style={{ background: "radial-gradient(circle at 50% 28%, rgba(116,1,203,0.16), transparent 68%)" }}
        >
          {/* Hero — sliding carousel of featured free titles on Tubi */}
          <TubiHeroCarousel images={["/tubi-hero.webp", "/tubi-hero-2.webp"]} />

          {/* Polished framed logo — gradient ring + glow */}
          <div
            className="w-full max-w-[300px] mb-6"
            style={{ padding: 2, borderRadius: 22, background: "linear-gradient(135deg, #7401CB, #FFFF12)", boxShadow: "0 0 60px rgba(116,1,203,0.5)" }}
          >
            <div style={{ borderRadius: 20, overflow: "hidden" }}>
              <img src="/tubi-logo.png" alt="Tubi" style={{ width: "100%", height: "auto", display: "block" }} />
            </div>
          </div>

          {/* Headline — one line, scales to panel width */}
          <div className="w-full max-w-[360px]" style={{ containerType: "inline-size" }}>
            <h2 className="font-black leading-tight mb-2" style={{ color: "#F5F4F8", whiteSpace: "nowrap", fontSize: "clamp(14px, 4.4cqi, 22px)" }}>
              Thousands of free movies and shows
            </h2>
          </div>

          {/* High-converting statement */}
          <p className="text-sm mb-6 leading-relaxed" style={{ color: "#A0A0B0", maxWidth: 300 }}>
            Watch it all free, right now on Tubi.
          </p>

          {/* Benefit bullets */}
          <div className="flex flex-col gap-2.5 mb-7 text-left" style={{ width: "fit-content" }}>
            {[
              "Hit movies and full seasons",
              "Live TV channels, always on",
              "100% free, no subscription, no sign up",
            ].map((line) => (
              <div key={line} className="flex items-center gap-2.5">
                <span className="rounded-full shrink-0" style={{ width: 7, height: 7, background: "linear-gradient(135deg, #7401CB, #FFFF12)" }} />
                <span className="text-[13px] font-medium" style={{ color: "#D8D8E0" }}>{line}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <a
            href="https://tubitv.com/"
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="glow-pulse block w-full max-w-[320px] py-4 rounded-2xl text-base font-black uppercase tracking-wide no-underline transition-transform active:scale-[0.97]"
            style={{ background: "linear-gradient(135deg, #4B01A5, #7401CB)", color: "#FFFF12", boxShadow: "0 0 45px rgba(116,1,203,0.5)" }}
          >
            Watch Free on Tubi →
          </a>
          <p className="mt-3.5 text-[11px]" style={{ color: "#6B6B7B" }}>Streaming free on Tubi. Verza sponsored partner.</p>
        </section>
      )}

      {filtered.length === 0 && activeTab !== "reality" && activeTab !== "music" && activeTab !== "red-carpet" && activeTab !== "tubi" && (() => {
        // Per-category Coming Soon copy. Anything not listed here uses the
        // generic fallback text below.
        const COMING_SOON: Partial<Record<BrowseCategory, { name: string; subtext: string }>> = {
          anime: { name: "Anime", subtext: "Premium anime, coming soon to Verza." },
          espanol: { name: "Español", subtext: "Premium Spanish-language microdramas. Coming soon to Verza." },
          bollywood: { name: "Bollywood", subtext: "Premium Bollywood microdramas. Coming soon to Verza." },
          creators: { name: "Creators", subtext: "Original series from independent creators. Coming soon to Verza." },
        };
        const cs = COMING_SOON[activeTab];
        return (
        <section className="px-4 py-8">
          <div
            className="rounded-2xl py-16 flex flex-col items-center justify-center gap-4 text-center"
            style={{ background: "linear-gradient(135deg, #12121C, #0A0A14)", border: "1px solid rgba(224,17,95,0.15)" }}
          >
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "rgba(224,17,95,0.12)" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#E0115F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            {/* Category name above the status, per spec (Anime / Español). */}
            {cs && (
              <h2 className="text-2xl font-black uppercase tracking-wide" style={{ color: "#F5F4F8" }}>{cs.name}</h2>
            )}
            <h3 className="text-lg font-bold" style={{ color: "#F5F4F8" }}>Coming Soon</h3>
            <p className="text-sm max-w-[280px] leading-relaxed" style={{ color: "#6B6B7B" }}>
              {cs ? cs.subtext : "New content for this category is being produced. Check back soon for exclusive releases."}
            </p>
          </div>

          {/* ── POSTER GRID DROP-IN ─────────────────────────────────────────────
              Anime & Español have no shows yet (~6 Español posters land later,
              titles TBD). To go live: add each show as a live Series in
              lib/catalog.ts with categories: ["espanol"] (or ["anime"]).
              getSeriesByCategory() then fills tabData[activeTab], this whole
              Coming Soon block disappears (it is gated on filtered.length === 0),
              and the shows render in the standard 3-column poster grid further
              down — the SAME card component every other category uses. No markup
              change is needed here; the grid is already wired for these tabs. */}
        </section>
        );
      })()}

      {/* Reality tab — full-width hero slideshow */}
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
                <img src="/ads/storageblue-logo.png" alt="StorageBlue" style={{ height: 52, objectFit: "contain" }} />
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
      {current && activeTab !== "reality" && activeTab !== "red-carpet" && activeTab !== "music" && (
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
                  /* All hero posters stay mounted and CROSSFADE — swapping a
                     single img src hard-cut between slides. */
                  heroSlides.map((s, i) =>
                    s.posterUrl ? (
                      <Image
                        key={s.slug}
                        src={s.posterUrl}
                        alt={s.title}
                        fill
                        priority={i === 0}
                        sizes="(max-width: 440px) 80vw, 320px"
                        className="object-contain hero-crossfade"
                        style={{ opacity: i === heroIdx % heroSlides.length ? 1 : 0 }}
                      />
                    ) : null,
                  )
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
            <img src="/ads/storageblue-logo.png" alt="StorageBlue" style={{ height: 52, objectFit: "contain" }} />
          </div>
        </a>
      )}

      {/* Tab Row — 3-column grid (not on Music/Reality/Red Carpet — they have custom sections) */}
      {gridItems.length > 0 && activeTab !== "music" && activeTab !== "reality" && activeTab !== "red-carpet" && (
        <section className="mt-4 pb-4 px-3">
          <div className="poster-grid stagger-children grid grid-cols-3 gap-1.5">
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
                    <Poster src={s.posterUrl} alt={s.title} />
                    {s.popularRank && s.popularRank <= 5 && <Badge type="trending" />}
                    {!s.popularRank && s.categories.includes("new") && <Badge type="new" />}
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
        </section>
      )}
        </div>
      </div>

    </div>
  );
}
