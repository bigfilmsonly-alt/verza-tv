"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import type HlsType from "hls.js";
import type { Series } from "@/lib/catalog";

import { T } from "@/lib/theme";
import { MUX_MAP } from "@/lib/mux-map";
import { useTranslation } from "@/components/LangProvider";

/* ---- Load hls.js once (dynamic import with typeof window guard — iOS Safari fix) ---- */
let hlsPromise: Promise<typeof HlsType | null> | null = null;
function getHls(): Promise<typeof HlsType | null> {
  if (!hlsPromise && typeof window !== "undefined") {
    hlsPromise = import("hls.js").then((m) => m.default).catch(() => null);
  }
  return hlsPromise || Promise.resolve(null);
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pseudoCount(slug: string, min: number, max: number): number {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) | 0;
  return min + (Math.abs(h) % (max - min));
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function RailButton({ children, label, onClick }: {
  children: React.ReactNode; label: string; onClick?: () => void;
}) {
  return (
    <button
      className="flex flex-col items-center gap-1"
      onClick={onClick}
      aria-label={label}
      style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
    >
      <div
        className="w-11 h-11 rounded-full flex items-center justify-center"
        style={{ background: "rgba(50,50,50,0.7)", backdropFilter: "blur(4px)" }}
      >
        {children}
      </div>
      <span className="text-[10px] font-semibold" style={{ color: "#fff", textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}>
        {label}
      </span>
    </button>
  );
}

/* ================================================================== */
/*  ShortVideo — auto-plays when isActive, tears down when not         */
/* ================================================================== */
function ShortVideo({ playbackId, isActive, muted }: {
  playbackId: string; isActive: boolean; muted: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<HlsType | null>(null);
  const mutedRef = useRef(muted);
  const [started, setStarted] = useState(false);
  const [autoplayFailed, setAutoplayFailed] = useState(false);

  // Keep ref in sync
  useEffect(() => { mutedRef.current = muted; }, [muted]);

  /* Only run when isActive — cleanup tears down everything */
  useEffect(() => {
    if (!isActive) return;

    const vid = videoRef.current;
    if (!vid) return;

    let cancelled = false;
    const hlsUrl = `https://stream.mux.com/${playbackId}.m3u8`;

    function tryPlay() {
      if (cancelled || !vid) return;
      // Always start muted for autoplay compliance, then unmute if preference allows
      vid.muted = true;
      vid.play()
        .then(() => {
          if (cancelled) return;
          setAutoplayFailed(false);
          // Restore user's mute preference after successful autoplay
          if (!mutedRef.current) vid.muted = false;
        })
        .catch(() => {
          if (!cancelled) setAutoplayFailed(true);
        });
    }

    function onPlaying() { if (!cancelled) { setStarted(true); setAutoplayFailed(false); } }
    vid.addEventListener("playing", onPlaying);

    async function attach() {
      if (cancelled || !vid) return;

      if (vid.canPlayType("application/vnd.apple.mpegurl")) {
        vid.src = hlsUrl;
        vid.addEventListener("loadeddata", () => { if (!cancelled) tryPlay(); }, { once: true });
        return;
      }

      const Hls = await getHls();
      if (cancelled || !Hls || !Hls.isSupported() || !vid) return;

      const hls = new Hls({ maxBufferLength: 30, enableWorker: true });
      hlsRef.current = hls;
      hls.loadSource(hlsUrl);
      hls.attachMedia(vid);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (!cancelled) tryPlay();
      });

      hls.on(Hls.Events.ERROR, (_e: string, data: { type: string; details: string; fatal: boolean }) => {
        if (data.fatal && hls && Hls) {
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) hls.startLoad();
          else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) hls.recoverMediaError();
        }
      });
    }

    attach();

    return () => {
      cancelled = true;
      vid.removeEventListener("playing", onPlaying);
      if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
      vid.muted = true; // Silence immediately before pause
      vid.pause();
      vid.removeAttribute("src");
      vid.load();
      setStarted(false);
      setAutoplayFailed(false);
    };
  }, [isActive, playbackId]);

  // Sync muted prop to video element instantly
  useEffect(() => {
    const vid = videoRef.current;
    if (vid) vid.muted = muted;
  }, [muted]);

  /* Fallback: tap to play if autoplay was blocked */
  function handleTap() {
    const vid = videoRef.current;
    if (!vid) return;
    vid.muted = mutedRef.current;
    vid.play().catch(() => {});
  }

  return (
    <>
      <video
        ref={videoRef}
        playsInline
        muted
        loop
        preload={isActive ? "auto" : "none"}
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          background: "#07070E",
          opacity: started ? 1 : 0,
          zIndex: started ? 2 : 0,
          transition: "opacity 0.2s ease",
        }}
      />
      {/* Tap-to-play fallback if autoplay was blocked */}
      {isActive && autoplayFailed && !started && (
        <button
          onClick={handleTap}
          className="absolute inset-0 z-10 flex items-center justify-center"
          style={{ background: "transparent", border: "none", cursor: "pointer" }}
          aria-label="Tap to play"
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{
              background: "rgba(0,0,0,0.5)",
              backdropFilter: "blur(6px)",
              border: "2px solid rgba(255,255,255,0.3)",
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="#fff">
              <path d="M8 5.14v13.72a1 1 0 0 0 1.5.86l11.04-6.86a1 1 0 0 0 0-1.72L9.5 4.28A1 1 0 0 0 8 5.14z" />
            </svg>
          </div>
        </button>
      )}
    </>
  );
}

/* ================================================================== */
/*  ShortCard — one slide in the horizontal carousel                   */
/* ================================================================== */
function ShortCard({ series, isActive, isNearActive, muted, setMuted, saved, onToggleSave }: {
  series: Series; isActive: boolean; isNearActive: boolean;
  muted: boolean; setMuted: (m: boolean) => void;
  saved: boolean; onToggleSave: (slug: string) => void;
}) {
  const { t } = useTranslation();
  const [liked, setLiked] = useState(false);
  const [showCopied, setShowCopied] = useState(false);
  const likeCount = pseudoCount(series.slug, 1, 50);
  const epNum = pseudoCount(series.slug, 1, 5);
  const playbackId = MUX_MAP[series.slug]?.[0]?.playbackId ?? null;

  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/series/${series.slug}`
    : `/series/${series.slug}`;

  function handleShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({
        title: series.title,
        text: `Watch "${series.title}" on Verza TV`,
        url: shareUrl,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareUrl).then(() => {
        setShowCopied(true);
        setTimeout(() => setShowCopied(false), 2000);
      }).catch(() => {});
    }
  }

  function handleSave() {
    onToggleSave(series.slug);
  }

  return (
    <div
      className="relative flex-shrink-0 overflow-hidden"
      style={{
        width: "100%",
        height: "100%",
        background: "#07070E",
      }}
    >
      {/* Video — only rendered for active ± 1 cards */}
      {isNearActive && playbackId && (
        <ShortVideo
          key={playbackId}
          playbackId={playbackId}
          isActive={isActive}
          muted={muted}
        />
      )}

      {/* Thumbnail — always behind video */}
      {playbackId && (
        <img
          src={`https://image.mux.com/${playbackId}/thumbnail.jpg?time=3&width=720&height=1280`}
          alt={series.title}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: "saturate(1.3) contrast(1.08) brightness(1.04)" }}
          loading="lazy"
        />
      )}

      {!playbackId && series.posterUrl && (
        <Image
          src={series.posterUrl}
          alt={series.title}
          fill
          className="absolute inset-0 object-cover"
          sizes="100vw"
        />
      )}

      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, transparent 15%, transparent 70%, rgba(0,0,0,0.3) 100%)",
        }}
      />

      {/* Top-left: title + episode chip */}
      <div className="absolute top-4 left-4 z-10" style={{ maxWidth: "65%" }}>
        <h2
          className="text-base font-bold leading-tight mb-1.5"
          style={{ color: "#fff", textShadow: "0 1px 6px rgba(0,0,0,0.8)" }}
        >
          {series.title}
        </h2>
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full"
          style={{ background: "rgba(50,50,50,0.7)", backdropFilter: "blur(4px)" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 2 7 12 12 22 7 12 2" />
            <polyline points="2 17 12 22 22 17" />
            <polyline points="2 12 12 17 22 12" />
          </svg>
          <span className="text-xs font-semibold" style={{ color: "#fff" }}>EP.{epNum} S1</span>
        </div>
      </div>

      {/* Top-right: close */}
      <Link
        href="/"
        className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full flex items-center justify-center no-underline"
        style={{ background: "rgba(50,50,50,0.7)", backdropFilter: "blur(4px)" }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </Link>

      {/* Right rail */}
      <div className="absolute right-3 flex flex-col items-center gap-4 z-10" style={{ top: "28%" }}>
        <Link href={`/series/${series.slug}`} className="block no-underline">
          <div className="relative w-12 h-16 rounded-lg overflow-hidden" style={{ border: "2px solid rgba(255,255,255,0.4)" }}>
            {series.posterUrl && (
              <Image src={series.posterUrl} alt={series.title} fill className="object-cover" sizes="48px" />
            )}
          </div>
        </Link>

        <RailButton label={formatCount(liked ? likeCount + 1 : likeCount)} onClick={() => setLiked((l) => !l)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill={liked ? T.accent : "none"} stroke={liked ? T.accent : "#fff"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </RailButton>

        <RailButton label={saved ? t("shorts.saved") : t("shorts.list")} onClick={handleSave}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill={saved ? T.accent : "none"} stroke={saved ? T.accent : "#fff"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
          </svg>
        </RailButton>

        <RailButton label={showCopied ? t("shorts.copied") : t("shorts.share")} onClick={handleShare}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={showCopied ? T.accent : "#fff"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
        </RailButton>

        <RailButton label={muted ? t("shorts.soundOff") : t("shorts.soundOn")} onClick={() => { const next = !muted; setMuted(next); localStorage.setItem("verza-muted", String(next)); }}>
          {muted ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" />
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            </svg>
          )}
        </RailButton>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  ShortsFeed — horizontal carousel with left/right arrows            */
/* ================================================================== */
export default function ShortsFeed({ series }: { series: Series[] }) {
  const [shuffled, setShuffled] = useState<Series[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [muted, setMuted] = useState(() => {
    if (typeof window !== "undefined") return localStorage.getItem("verza-muted") !== "false";
    return true;
  });
  const [savedSlugs, setSavedSlugs] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

  /* Fetch saved list on mount — API + localStorage fallback */
  useEffect(() => {
    // Load from localStorage first (works for guests)
    try {
      const local = localStorage.getItem("verza-saved");
      if (local) setSavedSlugs(new Set(JSON.parse(local)));
    } catch {}

    // Then try API (works for signed-in users)
    fetch("/api/saved-list")
      .then((r) => r.json())
      .then((data) => {
        if (data.items && data.items.length > 0) {
          const slugs = data.items.map((i: { seriesSlug: string }) => i.seriesSlug);
          setSavedSlugs(new Set(slugs));
          localStorage.setItem("verza-saved", JSON.stringify(slugs));
        }
      })
      .catch(() => {});
  }, []);

  /* Toggle save/unsave — saves to both API + localStorage */
  const handleToggleSave = useCallback((slug: string) => {
    const isSaved = savedSlugs.has(slug);

    // Optimistic update
    setSavedSlugs((prev) => {
      const next = new Set(prev);
      if (isSaved) next.delete(slug);
      else next.add(slug);
      // Persist to localStorage (always works, even for guests)
      localStorage.setItem("verza-saved", JSON.stringify([...next]));
      return next;
    });

    // Also persist to API (works if signed in)
    const method = isSaved ? "DELETE" : "POST";
    fetch("/api/saved-list", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ seriesSlug: slug }),
    }).catch(() => {});
  }, [savedSlugs]);

  useEffect(() => {
    const withMux = series.filter((s) => MUX_MAP[s.slug]?.length > 0);
    setShuffled(shuffleArray(withMux));
  }, [series]);

  /* Horizontal IntersectionObserver */
  const observerCallback = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const idx = Number(entry.target.getAttribute("data-index"));
          if (!Number.isNaN(idx)) setActiveIndex(idx);
        }
      }
    },
    [],
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container || shuffled.length === 0) return;
    const observer = new IntersectionObserver(observerCallback, {
      root: container,
      threshold: 0.6,
    });
    container.querySelectorAll("[data-index]").forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, [shuffled, observerCallback]);

  if (shuffled.length === 0) return null;

  return (
    <div
      className="episode-immersive"
      style={{
        background: "#000",
      }}
    >
      {/* Horizontal scroll container */}
      <div
        ref={containerRef}
        className="no-scrollbar"
        style={{
          display: "flex",
          overflowX: "auto",
          overflowY: "hidden",
          scrollSnapType: "x mandatory",
          WebkitOverflowScrolling: "touch",
          width: "100%",
          height: "var(--feed-h, 100dvh)",
        }}
      >
        {shuffled.map((s, i) => (
          <div
            key={s.slug}
            data-index={i}
            className="short-card"
            style={{
              flex: "0 0 100%",
              width: "100%",
              height: "100%",
              scrollSnapAlign: "center",
              position: "relative",
            }}
          >
            <ShortCard
              series={s}
              isActive={i === activeIndex}
              isNearActive={Math.abs(i - activeIndex) <= 1}
              muted={muted}
              setMuted={setMuted}
              saved={savedSlugs.has(s.slug)}
              onToggleSave={handleToggleSave}
            />
          </div>
        ))}
      </div>

      {/* Dot indicators */}
      <div
        className="absolute z-30 flex items-center gap-1.5"
        style={{ bottom: 16, left: "50%", transform: "translateX(-50%)" }}
      >
        {shuffled.slice(0, Math.min(shuffled.length, 20)).map((_, i) => (
          <div
            key={i}
            className="rounded-full transition-all duration-200"
            style={{
              width: i === activeIndex ? 16 : 6,
              height: 6,
              background: i === activeIndex
                ? "linear-gradient(90deg, #E0115F, #8B5CF6)"
                : "rgba(255,255,255,0.3)",
              borderRadius: 3,
            }}
          />
        ))}
      </div>
    </div>
  );
}
