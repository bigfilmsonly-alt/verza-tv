"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import type HlsType from "hls.js";
import type { Series } from "@/lib/catalog";

import { T } from "@/lib/theme";
import { MUX_MAP } from "@/lib/mux-map";

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
/*  ShortVideo — self-contained video player per card                  */
/*  Loads HLS + auto-plays when isActive, tears down when not.         */
/*  Only rendered for cards near the active index (max 3 in DOM).      */
/* ================================================================== */
function ShortVideo({ playbackId, isActive, muted }: {
  playbackId: string; isActive: boolean; muted: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<HlsType | null>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;

    if (!isActive) {
      /* ---- INACTIVE: pause, tear down, reset ---- */
      setStarted(false);
      if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
      vid.pause();
      vid.removeAttribute("src");
      vid.load();
      return;
    }

    /* ---- ACTIVE: attach HLS + auto-play ---- */
    let cancelled = false;
    const hlsUrl = `https://stream.mux.com/${playbackId}.m3u8`;

    function tryPlay() {
      if (cancelled || !vid) return;
      vid.muted = true; /* force muted for autoplay policy */
      vid.play().catch(() => {
        if (!cancelled) setTimeout(() => {
          if (vid) { vid.muted = true; vid.play().catch(() => {}); }
        }, 500);
      });
    }

    /* track when video actually starts rendering frames */
    function onPlaying() { setStarted(true); }
    vid.addEventListener("playing", onPlaying);

    async function attach() {
      if (cancelled || !vid) return;

      /* Safari / iOS — native HLS */
      if (vid.canPlayType("application/vnd.apple.mpegurl")) {
        vid.src = hlsUrl;
        vid.load();
        tryPlay();
        return;
      }

      /* Chrome / Firefox — hls.js */
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
      vid.pause();
      vid.removeAttribute("src");
      vid.load();
    };
  }, [isActive, playbackId]);

  /* sync muted prop (for unmute toggle) */
  useEffect(() => {
    const vid = videoRef.current;
    if (vid) vid.muted = muted;
  }, [muted]);

  function handleTap(e: React.MouseEvent) {
    e.stopPropagation();
    const vid = videoRef.current;
    if (!vid) return;
    if (vid.paused) vid.play().catch(() => {});
    else vid.pause();
  }

  return (
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
      onClick={handleTap}
    />
  );
}

/* ================================================================== */
/*  ShortCard — one card in the feed                                   */
/* ================================================================== */
function ShortCard({ series, isActive, isNearActive, muted, setMuted }: {
  series: Series; isActive: boolean; isNearActive: boolean;
  muted: boolean; setMuted: (m: boolean) => void;
}) {
  const [liked, setLiked] = useState(false);
  const likeCount = pseudoCount(series.slug, 1, 50);
  const epNum = pseudoCount(series.slug, 1, 5);
  const playbackId = MUX_MAP[series.slug]?.[0]?.playbackId ?? null;

  return (
    <div
      className="short-card relative w-full flex-shrink-0 overflow-hidden"
      style={{
        height: "calc(100dvh - 72px)",
        scrollSnapAlign: "start",
        background: "#07070E",
      }}
    >
      {/* Video — only rendered for active ± 1 cards (max 3 in DOM) */}
      {isNearActive && playbackId && (
        <ShortVideo
          key={playbackId}
          playbackId={playbackId}
          isActive={isActive}
          muted={muted}
        />
      )}

      {/* Thumbnail — always visible behind video */}
      {playbackId && (
        <img
          src={`https://image.mux.com/${playbackId}/thumbnail.jpg?time=3&width=720&height=1280`}
          alt={series.title}
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
        />
      )}

      {/* No video: show poster */}
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
      <div className="absolute top-14 left-4 z-10" style={{ maxWidth: "65%" }}>
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
        className="absolute top-14 right-4 z-10 w-10 h-10 rounded-full flex items-center justify-center no-underline"
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

        <RailButton label="List">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 2 7 12 12 22 7 12 2" />
            <polyline points="2 17 12 22 22 17" />
            <polyline points="2 12 12 17 22 12" />
          </svg>
        </RailButton>

        <RailButton label="Share">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
        </RailButton>

        <RailButton label="Sound" onClick={() => setMuted(!muted)}>
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
/*  ShortsFeed                                                         */
/* ================================================================== */
export default function ShortsFeed({ series }: { series: Series[] }) {
  const [shuffled, setShuffled] = useState<Series[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [muted, setMuted] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const withMux = series.filter((s) => MUX_MAP[s.slug]?.length > 0);
    setShuffled(shuffleArray(withMux));
  }, [series]);

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
    container.querySelectorAll(".short-card").forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, [shuffled, observerCallback]);

  if (shuffled.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className="w-full overflow-y-auto no-scrollbar"
      style={{
        height: "calc(100dvh - 72px)",
        scrollSnapType: "y mandatory",
        WebkitOverflowScrolling: "touch",
        background: "#000",
        marginTop: "-57px",
        position: "relative",
        zIndex: 30,
      }}
    >
      {shuffled.map((s, i) => (
        <div key={s.slug} data-index={i}>
          <ShortCard
            series={s}
            isActive={i === activeIndex}
            isNearActive={Math.abs(i - activeIndex) <= 1}
            muted={muted}
            setMuted={setMuted}
          />
        </div>
      ))}
    </div>
  );
}
