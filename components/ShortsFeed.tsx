"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import type HlsType from "hls.js";
import type { Series } from "@/lib/catalog";

import { T } from "@/lib/theme";
import { MUX_MAP } from "@/lib/mux-map";
import { useTranslation } from "@/components/LangProvider";

/* ---- Load hls.js once ---- */
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
/*  ShortCard — one slide (lightweight, NO video element)              */
/* ================================================================== */
function ShortCard({ series, isActive, muted, setMuted, saved, onToggleSave }: {
  series: Series; isActive: boolean;
  muted: boolean; setMuted: (m: boolean) => void;
  saved: boolean; onToggleSave: (slug: string) => void;
}) {
  const { t } = useTranslation();
  const [liked, setLiked] = useState(false);
  const [showCopied, setShowCopied] = useState(false);
  const likeCount = pseudoCount(series.slug, 1, 50);
  const epNum = pseudoCount(series.slug, 1, 5);

  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/series/${series.slug}`
    : `/series/${series.slug}`;

  function handleShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({ title: series.title, text: `Watch "${series.title}" on Verza TV`, url: shareUrl }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareUrl).then(() => { setShowCopied(true); setTimeout(() => setShowCopied(false), 2000); }).catch(() => {});
    }
  }

  return (
    <div
      className="relative flex-shrink-0 overflow-hidden"
      style={{ width: "100%", height: "100%", background: "transparent" }}
    >
      {/* No poster — video plays directly through from the persistent element below */}

      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, transparent 15%, transparent 70%, rgba(0,0,0,0.3) 100%)" }}
      />

      {/* Top-left: title + episode chip */}
      <div className="absolute top-4 left-4 z-40" style={{ maxWidth: "65%" }}>
        <h2 className="text-base font-bold leading-tight mb-1.5" style={{ color: "#fff", textShadow: "0 1px 6px rgba(0,0,0,0.8)" }}>
          {series.title}
        </h2>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full" style={{ background: "rgba(50,50,50,0.7)", backdropFilter: "blur(4px)" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" />
          </svg>
          <span className="text-xs font-semibold" style={{ color: "#fff" }}>EP.{epNum} S1</span>
        </div>
      </div>

      {/* Top-right: close — z-40 to be above swipe layer (z-5) */}
      <Link href="/" className="absolute top-4 right-4 z-40 w-10 h-10 rounded-full flex items-center justify-center no-underline" style={{ background: "rgba(50,50,50,0.7)", backdropFilter: "blur(4px)" }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </Link>

      {/* Right rail */}
      <div className="absolute right-3 flex flex-col items-center gap-4 z-40" style={{ top: "28%" }}>
        <Link href={`/series/${series.slug}`} className="block no-underline">
          <div className="relative w-12 h-16 rounded-lg overflow-hidden" style={{ border: "2px solid rgba(255,255,255,0.4)" }}>
            {series.posterUrl && <Image src={series.posterUrl} alt={series.title} fill className="object-cover" sizes="48px" />}
          </div>
        </Link>

        <RailButton label={formatCount(liked ? likeCount + 1 : likeCount)} onClick={() => setLiked((l) => !l)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill={liked ? T.accent : "none"} stroke={liked ? T.accent : "#fff"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </RailButton>

        <RailButton label={saved ? "Saved" : "List"} onClick={() => onToggleSave(series.slug)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill={saved ? T.accent : "none"} stroke={saved ? T.accent : "#fff"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
          </svg>
        </RailButton>

        <RailButton label={showCopied ? "Copied!" : "Share"} onClick={handleShare}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={showCopied ? T.accent : "#fff"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
        </RailButton>

        <RailButton label={muted ? "Off" : "On"} onClick={() => { const next = !muted; setMuted(next); localStorage.setItem("verza-muted", String(next)); }}>
          {muted ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" />
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            </svg>
          )}
        </RailButton>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  ShortsFeed — SINGLE persistent video element, source swapping      */
/* ================================================================== */
export default function ShortsFeed({ series }: { series: Series[] }) {
  const [shuffled, setShuffled] = useState<Series[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [muted, setMuted] = useState(false);
  const [savedSlugs, setSavedSlugs] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

  // THE single video element — never destroyed, source swapped
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<HlsType | null>(null);
  const currentPlaybackIdRef = useRef<string | null>(null);
  const mutedRef = useRef(muted);
  useEffect(() => { mutedRef.current = muted; }, [muted]);

  /* Fetch saved list */
  useEffect(() => {
    try {
      const local = localStorage.getItem("verza-saved");
      if (local) setSavedSlugs(new Set(JSON.parse(local)));
    } catch {}
    fetch("/api/saved-list").then((r) => r.json()).then((data) => {
      if (data.items?.length > 0) {
        const slugs = data.items.map((i: { seriesSlug: string }) => i.seriesSlug);
        setSavedSlugs(new Set(slugs));
        localStorage.setItem("verza-saved", JSON.stringify(slugs));
      }
    }).catch(() => {});
  }, []);

  const handleToggleSave = useCallback((slug: string) => {
    setSavedSlugs((prev) => {
      const next = new Set(prev);
      if (prev.has(slug)) next.delete(slug); else next.add(slug);
      localStorage.setItem("verza-saved", JSON.stringify([...next]));
      return next;
    });
    fetch("/api/saved-list", {
      method: savedSlugs.has(slug) ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ seriesSlug: slug }),
    }).catch(() => {});
  }, [savedSlugs]);

  useEffect(() => {
    const withMux = series.filter((s) => MUX_MAP[s.slug]?.length > 0);
    setShuffled(shuffleArray(withMux).slice(0, 15));
  }, [series]);

  /* ---- SINGLE PLAYER: swap source when activeIndex changes ---- */
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid || shuffled.length === 0) return;

    const activeSeries = shuffled[activeIndex];
    if (!activeSeries) return;
    const playbackId = MUX_MAP[activeSeries.slug]?.[0]?.playbackId;
    if (!playbackId) return;

    // Skip if already playing this source
    if (currentPlaybackIdRef.current === playbackId) return;
    currentPlaybackIdRef.current = playbackId;

    const hlsUrl = `https://stream.mux.com/${playbackId}.m3u8`;
    let cancelled = false;

    // Destroy previous HLS instance (but keep the SAME video element)
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    // Pause and clear previous source
    vid.pause();
    vid.removeAttribute("src");

    function doPlay() {
      if (cancelled || !vid) return;
      vid.muted = true;
      const p = vid.play();
      if (p) {
        p.then(() => {
          if (!cancelled && !mutedRef.current) vid.muted = false;
        }).catch(() => {});
      }
    }

    // Safari / iOS — native HLS
    if (vid.canPlayType("application/vnd.apple.mpegurl")) {
      vid.src = hlsUrl;
      vid.addEventListener("canplay", () => { if (!cancelled) doPlay(); }, { once: true });
      vid.load();
      return () => { cancelled = true; };
    }

    // Chrome / Firefox — hls.js
    getHls().then((Hls) => {
      if (cancelled || !Hls || !Hls.isSupported() || !vid) return;
      const hls = new Hls({ maxBufferLength: 15, enableWorker: true });
      hlsRef.current = hls;
      hls.loadSource(hlsUrl);
      hls.attachMedia(vid);
      hls.on(Hls.Events.MANIFEST_PARSED, () => { if (!cancelled) doPlay(); });
      hls.on(Hls.Events.ERROR, (_e: string, data: { type: string; fatal: boolean }) => {
        if (data.fatal && Hls) {
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) hls.startLoad();
          else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) hls.recoverMediaError();
        }
      });
    });

    return () => { cancelled = true; };
  }, [activeIndex, shuffled]);

  /* Sync muted */
  useEffect(() => {
    const vid = videoRef.current;
    if (vid) vid.muted = muted;
  }, [muted]);

  /* IntersectionObserver — stable, created once */
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
    <div className="episode-immersive" style={{ background: "#000" }}>
      {/* THE single persistent video element */}
      <video
        ref={videoRef}
        playsInline
        muted
        loop
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover"
        style={{ zIndex: 2, background: "#000", pointerEvents: "none" }}
      />

      {/* Overlay UI — above the video, receives touch events */}
      <div
        className="absolute inset-0"
        style={{ zIndex: 3, pointerEvents: "none" }}
      >
        {/* Active card overlays (title, buttons) */}
        {shuffled[activeIndex] && (
          <div style={{ pointerEvents: "auto", width: "100%", height: "100%", position: "relative" }}>
            <ShortCard
              series={shuffled[activeIndex]}
              isActive={true}
              muted={muted}
              setMuted={setMuted}
              saved={savedSlugs.has(shuffled[activeIndex].slug)}
              onToggleSave={handleToggleSave}
            />
          </div>
        )}
      </div>

      {/* Swipe detection layer — transparent, receives horizontal swipe */}
      <div
        ref={containerRef}
        className="absolute inset-0 no-scrollbar"
        style={{
          display: "flex",
          overflowX: "auto",
          overflowY: "hidden",
          scrollSnapType: "x mandatory",
          scrollBehavior: "auto",
          zIndex: 5,
        }}
      >
        {shuffled.map((s, i) => (
          <div
            key={s.slug}
            data-index={i}
            style={{
              flex: "0 0 100%",
              width: "100%",
              height: "100%",
              scrollSnapAlign: "center",
            }}
          />
        ))}
      </div>

      {/* Dot indicators */}
      <div
        className="absolute z-30 flex items-center gap-1.5"
        style={{ bottom: 16, left: "50%", transform: "translateX(-50%)" }}
      >
        {shuffled.slice(0, Math.min(shuffled.length, 15)).map((_, i) => (
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
