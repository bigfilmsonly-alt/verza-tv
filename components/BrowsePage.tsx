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
   Order here IS display order — reorder this array to reorder the shelf, and
   it drives both the badged top shelf and the hero, so the two always agree.
   Every entry must be live, Drama-visible and carry categories ["new"].
   Kept out: the-crown, which has popularRank 4 and is promoted through Hot. */
const FEATURED_NEW = [
  "lost-and-found",
  "help-im-falling-in-love-with-my-rude-ceo",
  "tied-by-fate",
  "twist-of-time",
  "the-inheritance-game",
  "billionaire-daughters-love-triangle",
] as const;

/* ------------------------------------------------------------------ */
/*  Badges are POSITIONAL, and the same rule runs on every browse tab.  */
/*                                                                      */
/*  The first three tiles of a tab are Trending. The first six are New. */
/*  Nothing below position six carries a badge at all.                  */
/*                                                                      */
/*  Positional, not data-driven, because the old rule read popularRank  */
/*  and categories:["new"] off individual titles and then let the grid  */
/*  shuffle scatter those tiles anywhere. Ten badges landing in random  */
/*  places on every reload is the definition of sporadic: "Trending"    */
/*  meant nothing about where a title sat, and a viewer could scroll     */
/*  past position 40 and still meet a New badge.                        */
/*                                                                      */
/*  Tying the badge to POSITION makes the top of every tab a deliberate */
/*  editorial shelf — the first row is what we are pushing, the second  */
/*  row is the rest of the drop, and everything after is catalogue. It  */
/*  also means the badge can never contradict the ordering, because it   */
/*  IS the ordering.                                                    */
/*                                                                      */
/*  Coming-soon is the one exception: it is a status, not a rank, so it  */
/*  is carried by the title wherever it sits. Those tiles always sort    */
/*  last, so they never collide with the featured block.                */
/* ------------------------------------------------------------------ */
/* Two stacked shelves, in this order, on every curated tab:
     slots 1-6  New       — the drop, two full rows of three
     slots 7-9  Trending  — the row directly beneath it
     slot 10+   nothing
   No tile ever carries both. The top row reads as one clean block of New
   rather than a stack of two badges competing in opposite corners. */
const NEW_SLOTS = 6;
const TRENDING_START = NEW_SLOTS;
const TRENDING_END = NEW_SLOTS + 3;
/* Hot is the exception, and it is not a curated shelf — it is a rank order. Its
   slot 1 genuinely is the most-watched title, so Trending belongs at the TOP
   there, not on row three, and New never applies. */
const HOT_TRENDING_SLOTS = 3;
/* New is an editorial claim about a curated shelf, so it only applies where the
   head IS hand-picked: Drama's featured six and the two language drops. Hot is
   excluded because its order is popularRank — position 1 there means "most
   watched", not "newest". Badging Hot positionally put NEW on the six
   highest-ranked titles in the catalogue while the titles actually tagged
   new sat unbadged further down, which is the label pointing at exactly the
   wrong thing. Hot still shows Trending, because on a popularity chart the top
   three genuinely are. */
const NEW_BADGE_TABS = new Set<BrowseCategory>(["drama", "espanol", "bollywood"]);

/* Tabs that render their own section instead of the shared poster grid. They
   are never empty even when tabData is, so the Coming Soon placeholder must not
   fire on them. Kept as one list because these used to be five scattered
   `activeTab === "..."` checks with no fallback, which is exactly how Anime
   ended up rendering a blank page. */
const CUSTOM_SECTION_TABS = new Set<BrowseCategory>([
  "tubi",
  "creators",
  "music",
  "reality",
  "red-carpet",
]);
/* Below this many playable titles a tab has no shelf to rank, and calling the
   top three of three "Trending" is noise dressed as editorial. Such a tab
   renders clean. */
const MIN_PLAYABLE_FOR_BADGES = 4;

/* One corner, always: top-left, on every badge and every surface. The shelves
   are mutually exclusive, so no tile can carry two badges and there is nothing
   to route around — and a badge that sits in a different corner depending on
   which shelf it belongs to is the same randomness this system removes. */
const BADGE_STYLE = {
  trending: { bg: "#E0115F", label: "Trending" },
  new: { bg: "#8B5CF6", label: "New" },
  /* Neutral slate, not brand pink/violet: Trending and New invite a tap and
     this one explicitly does not. */
  soon: { bg: "rgba(12,12,20,0.82)", label: "Coming Soon" },
} as const;

function Badge({ type, large = false }: { type: keyof typeof BADGE_STYLE; large?: boolean }) {
  const { bg, label } = BADGE_STYLE[type];
  const pos = large
    ? "top-2 left-2 px-2 py-1 text-[10px]"
    : "top-1.5 left-1.5 px-1.5 py-0.5 text-[8px]";
  return (
    <div
      className={`absolute z-10 rounded font-bold uppercase tracking-wider ${pos}`}
      style={{
        background: bg,
        color: "#fff",
        ...(type === "soon"
          ? { backdropFilter: "blur(4px)", border: "1px solid rgba(255,255,255,0.28)" }
          : null),
      }}
    >
      {label}
    </div>
  );
}

function Poster({ src, alt, sizes = "(max-width: 440px) 33vw, 146px" }: { src: string; alt: string; sizes?: string }) {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);
  /* Reveal the poster from the DOM, not from React's synthetic onLoad.
     The tile starts at opacity 0 and was revealed only by onLoad. That event is
     routinely missed: an image restored from cache finishes decoding before
     React attaches the handler, so the event fires into nothing and the tile
     stays invisible forever. Measured on the live grid, 8 of 8 posters were
     .complete while only 1 had opacity 1 — seven fully-decoded images sitting
     blank. Leaving the player reloads the document, so the viewer met a wall of
     empty tiles and read it as the app breaking.
     Reading .complete catches the cache hit, and a NATIVE load listener on the
     element itself catches the first download, including a load that lands
     between render and hydration. */
  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;
    if (img.complete) {
      setLoaded(true);
      return;
    }
    const reveal = () => setLoaded(true);
    img.addEventListener("load", reveal);
    // A poster that 404s must not leave a permanent blank tile either.
    img.addEventListener("error", reveal);
    return () => {
      img.removeEventListener("load", reveal);
      img.removeEventListener("error", reveal);
    };
  }, [src]);
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
        ref={imgRef}
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        className="object-cover"
        onLoad={() => setLoaded(true)}
        /* Never opacity-gated. The tile used to be hidden until a load event
           marked it ready, which meant any missed event stranded a fully
           decoded poster as a permanent blank square — and the events are
           missed routinely, because an image restored from cache finishes
           before React attaches a handler and Next swaps src on lazy tiles.
           After fixing the obvious races 1 of 8 posters was still stranded, so
           the gate itself is the bug: a decorative 0.35s fade is not worth a
           class of defect that shows the viewer an empty grid. The image simply
           paints when the browser has it, over the skeleton below. */
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
    // Playable titles always sort ahead of coming-soon ones. The shuffle is
    // indifferent to status, so without this the unplayable tiles scatter
    // through the grid and a viewer hits one before they have seen everything
    // they can actually watch.
    const playableFirst = (list: Series[]) => [
      ...list.filter((s) => s.status === "live"),
      ...list.filter((s) => s.status !== "live"),
    ];

    // Hot is a ranked chart; its order IS the content, so it never shuffles.
    if (activeTab === "popular") return playableFirst(base);

    // A curated tab is small enough to read as one deliberate shelf, so it
    // renders in catalogue order every time. Shuffling six Espanol titles does
    // not aid discovery, it just makes a hand-picked section look accidental —
    // and with positional badges it would move Trending onto a different title
    // on every reload. Only a tab long enough to have a genuine tail shuffles,
    // and even then only the tail.
    const CURATED_MAX = 12;
    if (base.length <= CURATED_MAX) return playableFirst(base);

    // The head is computed BEFORE the shuffle-seed check on purpose. shuffleSeed
    // is 0 on the server and on the first client render, so returning early here
    // used to paint one set of badges into the shipped HTML and a different set
    // a frame after mount — the badged shelf visibly hopped to three other
    // titles, and the hero showed something that was not tile 0. The featured
    // block is deterministic, so it must be identical in all three states;
    // only the tail is allowed to depend on the seed.
    // Drama's head is two pinned shelves: the FEATURED_NEW drop, then the three
    // highest-ranked titles in the catalogue. Slots 7-9 used to be whatever the
    // shuffle dropped there, so the Trending row named three different titles on
    // every reload — the badge was fixed but its subjects were not, which is the
    // same randomness one level down. Pinning by popularRank also makes the
    // label true, and makes Drama name the same three titles Hot ranks 1-3
    // instead of the two tabs contradicting each other.
    const head =
      activeTab === "drama"
        ? [
            ...FEATURED_NEW.map((slug) => base.find((x) => x.slug === slug)).filter(
              (x): x is Series => Boolean(x),
            ),
            ...base
              .filter((x) => x.popularRank && !FEATURED_NEW.includes(x.slug as never))
              .sort((a, b) => (a.popularRank ?? 99) - (b.popularRank ?? 99))
              .slice(0, TRENDING_END - TRENDING_START),
          ]
        : base.slice(0, NEW_SLOTS);
    const headSet = new Set(head.map((x) => x.slug));
    const rest = base.filter((x) => !headSet.has(x.slug));
    const tail = shuffleSeed === 0 ? rest : shuffleWithSeed(rest, shuffleSeed + activeTab.length);
    return [...head, ...playableFirst(tail)];
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

  /* Honor ?tab= from the URL — on mount, on browser back/forward, and whenever
     the query string changes.
     This used to be mount-only, which is why leaving an episode had to trigger
     a full document reload just to land on the right tab. A client-side return
     can restore a cached home segment instead of remounting, and a mount-only
     effect never fires in that case, so the viewer would arrive on Drama after
     watching a Spanish title. Comparing against the last applied search string
     covers all three cases and re-applies at most once per actual URL change. */
  const appliedTabSearch = useRef<string | null>(null);
  const syncTabFromUrl = useCallback(() => {
    const search = window.location.search;
    if (appliedTabSearch.current === search) return;
    appliedTabSearch.current = search;
    const tab = new URLSearchParams(search).get("tab");
    if (tab && BROWSE_TABS.some((t) => t.key === tab)) {
      queueMicrotask(() => setActiveTab(tab as BrowseCategory));
    }
  }, []);
  useEffect(() => {
    syncTabFromUrl();
    window.addEventListener("popstate", syncTabFromUrl);
    return () => window.removeEventListener("popstate", syncTabFromUrl);
  });

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

  // Display name for the current tab, for the empty-state panel. Falls back to
  // the key so a tab added without a label still reads as a section rather than
  // as "undefined is coming soon".
  const activeTabLabel =
    activeTabs.find((tb) => tb.key === activeTab)?.label ?? activeTab;

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
  // Espanol and Bollywood used to badge EVERY tile as New, on the reasoning
  // that the whole section was a fresh drop. It defeated itself: a badge on all
  // six tiles carries no information and just adds visual noise. They now run
  // the same positional rule as every other tab.
  const badgesApply =
    filtered.filter((s) => s.status === "live").length >= MIN_PLAYABLE_FOR_BADGES;

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

      {/* Coming Soon — the branded placeholder for a tab with no titles yet.
          This comment used to describe a panel that had been deleted, so Anime
          rendered nothing at all: no hero, no grid, no custom section, and
          .tab-slide sets no min-height, so the footer slid up flush under the
          tab bar and a top-level nav tab looked broken rather than unlaunched.
          Espanol and Bollywood have since launched and auto-hide from here, as
          the original comment promised. It reuses the Coming Soon badge palette
          so it introduces no new design language. */}
      {gridItems.length === 0 && !CUSTOM_SECTION_TABS.has(activeTab) && (
        <div className="px-6 pt-10 pb-16 flex flex-col items-center text-center">
          <div
            className="w-full max-w-sm rounded-2xl px-6 py-10"
            style={{
              background: BADGE_STYLE.soon.bg,
              border: "1px solid rgba(255,255,255,0.28)",
              backdropFilter: "blur(4px)",
            }}
          >
            <div
              className="mx-auto mb-4 flex items-center justify-center rounded-full"
              style={{ width: 44, height: 44, background: "rgba(255,255,255,0.08)" }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F5F4F8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <p className="text-base font-bold mb-1.5" style={{ color: "#F5F4F8" }}>
              {activeTabLabel} is coming soon
            </p>
            <p className="text-xs leading-relaxed" style={{ color: "#8A8A9A" }}>
              We&rsquo;re lining up the first titles for this section. Everything else on
              VERZA is ready to watch right now.
            </p>
            <button
              type="button"
              onClick={() => selectTab("drama")}
              className="mt-5 inline-flex items-center justify-center rounded-full px-5 py-2.5 text-xs font-bold transition-transform active:scale-95"
              style={{ background: "linear-gradient(135deg, #E0115F, #8B5CF6)", color: "#fff" }}
            >
              Browse Drama
            </button>
          </div>
        </div>
      )}
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
            {gridItems.map((s, i) => {
              // A coming-soon title has key art and no video. It still gets a
              // real detail page — art, logline, a Coming Soon pill, no player
              // and no purchase card — so the tile opens /series/<slug> rather
              // than /series/<slug>/1, which is the episode route and would have
              // nothing to play. What it must never show is the play affordance
              // or a NEW badge, both of which promise a video starts on tap.
              const soon = s.status === "coming_soon";
              // Position drives the badge, not the title's own fields. i is the
              // index into the rendered grid, so slot 0-2 is Trending and slot
              // 0-5 is New on every tab, identically. A coming-soon tile is
              // never in the featured block because it always sorts last, but
              // the guard is explicit so a future ordering change cannot put a
              // "Trending" badge on something with no video.
              const curated = NEW_BADGE_TABS.has(activeTab);
              const isNew = badgesApply && !soon && curated && i < NEW_SLOTS;
              const trending =
                badgesApply &&
                !soon &&
                (curated
                  ? i >= TRENDING_START && i < TRENDING_END
                  : activeTab === "popular" && i < HOT_TRENDING_SLOTS);
              const art = (
                <>
                  <div className="relative overflow-hidden rounded-lg" style={{ aspectRatio: "2 / 3" }}>
                    <Poster src={s.posterUrl} alt={s.title} sizes={twoUp ? "(max-width: 440px) 50vw, 220px" : "(max-width: 440px) 33vw, 146px"} />
                    {trending && <Badge type="trending" large={twoUp} />}
                    {isNew && <Badge type="new" large={twoUp} />}
                    {soon && <Badge type="soon" large={twoUp} />}
                    {/* The play affordance is the promise that a tap starts a
                        video. Coming-soon tiles make no such promise. */}
                    {!soon && (
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
                    )}
                  </div>
                  <div style={{ height: 36 }}>
                    <p className="mt-1.5 text-[11px] font-semibold leading-tight line-clamp-2" style={{ color: soon ? "#B9B5C4" : "#F5F4F8" }}>{s.title}</p>
                    <p className="text-[10px] mt-0.5 line-clamp-1" style={{ color: "#6B6B7B" }}>{s.genre}</p>
                  </div>
                </>
              );

              return soon ? (
                <Link
                  key={s.slug}
                  href={`/series/${s.slug}`}
                  className="block no-underline min-w-0 transition-transform active:scale-[0.97]"
                >
                  {art}
                </Link>
              ) : (
                <Link
                  key={s.slug}
                  href={`/series/${s.slug}/1`}
                  className="group block no-underline min-w-0 transition-transform active:scale-[0.97]"
                  onClick={(e) => posterClick(e, s.slug)}
                >
                  {art}
                </Link>
              );
            })}
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
