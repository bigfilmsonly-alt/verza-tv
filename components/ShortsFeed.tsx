"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import type HlsType from "hls.js";
import type { Series } from "@/lib/catalog";

import { T } from "@/lib/theme";
import { MUX_MAP } from "@/lib/mux-map";

// Load hls.js dynamically — resolves a promise so we can await it
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

/* ---- Icon button with circular dark bg ---- */
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
      <span
        className="text-[10px] font-semibold"
        style={{ color: "#fff", textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}
      >
        {label}
      </span>
    </button>
  );
}

/* ---- Single Short Card ---- */
function ShortCard({ series, isActive }: { series: Series; isActive: boolean }) {
  const [liked, setLiked] = useState(false);
  const [muted, setMuted] = useState(true);
  const [videoError, setVideoError] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<HlsType | null>(null);
  const likeCount = pseudoCount(series.slug, 1, 50);
  const epNum = pseudoCount(series.slug, 1, 5);

  /* Resolve Mux playback ID for first episode (if available) */
  const muxEpisodes = MUX_MAP[series.slug];
  const playbackId = muxEpisodes?.[0]?.playbackId ?? null;

  /* Attach HLS source once — awaits hls.js module load for Chrome/Firefox */
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid || !playbackId) return;

    let destroyed = false;
    let hls: HlsType | null = null;
    const hlsUrl = `https://stream.mux.com/${playbackId}.m3u8`;

    async function attach() {
      if (!vid || destroyed) return;

      // Safari / iOS — native HLS
      if (vid.canPlayType("application/vnd.apple.mpegurl")) {
        vid.src = hlsUrl;
        if (isActive) vid.play().catch(() => {});
        return;
      }

      // Chrome / Firefox — need hls.js (await the dynamic import)
      const Hls = await getHls();
      if (destroyed || !Hls || !Hls.isSupported()) {
        setVideoError(true);
        return;
      }

      hls = new Hls({ maxBufferLength: 30, enableWorker: true });
      hls.loadSource(hlsUrl);
      hls.attachMedia(vid);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (!destroyed && isActive) {
          vid.play().catch(() => {});
        }
      });
      hls.on(Hls.Events.ERROR, (_event: string, data: { fatal: boolean }) => {
        if (data.fatal && !destroyed) setVideoError(true);
      });
      hlsRef.current = hls;
    }

    attach();

    return () => {
      destroyed = true;
      if (hls) {
        hls.destroy();
        hlsRef.current = null;
      }
    };
  }, [playbackId, isActive]);

  /* Play / pause when card becomes active or inactive — never touch the src */
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid || !playbackId) return;
    if (isActive) {
      vid.play().catch(() => {/* autoplay may be blocked */});
    } else {
      vid.pause();
      setVideoPlaying(false);
    }
  }, [isActive, playbackId]);

  /* Sync muted state to video element */
  useEffect(() => {
    const vid = videoRef.current;
    if (vid) vid.muted = muted;
  }, [muted]);

  return (
    <div
      className="short-card relative w-full flex-shrink-0 overflow-hidden"
      style={{
        height: "calc(100dvh - 56px)", /* only bottom nav */
        scrollSnapAlign: "start",
        background: "#07070E",
      }}
    >
      {/* Full-bleed LIVE video — no poster overlay, video plays directly */}
      {playbackId && !videoError ? (
        <video
          ref={videoRef}
          playsInline
          muted={muted}
          loop
          autoPlay={isActive}
          preload={isActive ? "auto" : "metadata"}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ background: "#07070E" }}
          onPlaying={() => setVideoPlaying(true)}
          onError={() => setVideoError(true)}
          poster={`https://image.mux.com/${playbackId}/thumbnail.jpg?time=3&width=720&height=1280`}
        />
      ) : (
        /* Fallback: poster image only if no video available */
        series.posterUrl ? (
          <Image
            src={series.posterUrl}
            alt={series.title}
            fill
            className="absolute inset-0 object-cover pointer-events-none"
            sizes="100vw"
            priority={isActive}
            style={{ filter: "saturate(1.12) contrast(1.04) brightness(1.02)" }}
          />
        ) : (
          <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, #1A1A26, #0A0A12)" }} />
        )
      )}

      {/* Subtle vignette for readability */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, transparent 15%, transparent 70%, rgba(0,0,0,0.3) 100%)",
        }}
      />

      {/* ---- Top-left: title + episode chip ---- */}
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
          {/* Layers icon */}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 2 7 12 12 22 7 12 2" />
            <polyline points="2 17 12 22 22 17" />
            <polyline points="2 12 12 17 22 12" />
          </svg>
          <span className="text-xs font-semibold" style={{ color: "#fff" }}>
            EP.{epNum} S1
          </span>
        </div>
      </div>

      {/* ---- Top-right: close button ---- */}
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

      {/* ---- Right rail: poster thumb + action icons ---- */}
      <div className="absolute right-3 flex flex-col items-center gap-4 z-10" style={{ top: "28%" }}>
        {/* Series poster thumbnail */}
        <Link
          href={`/series/${series.slug}`}
          className="block no-underline"
        >
          <div
            className="relative w-12 h-16 rounded-lg overflow-hidden"
            style={{ border: "2px solid rgba(255,255,255,0.4)" }}
          >
            {series.posterUrl && (
              <Image
                src={series.posterUrl}
                alt={series.title}
                fill
                className="object-cover"
                sizes="48px"
              />
            )}
          </div>
        </Link>

        {/* Heart / Like */}
        <RailButton label={formatCount(liked ? likeCount + 1 : likeCount)} onClick={() => setLiked((l) => !l)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill={liked ? T.accent : "none"} stroke={liked ? T.accent : "#fff"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </RailButton>

        {/* List */}
        <RailButton label="List">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 2 7 12 12 22 7 12 2" />
            <polyline points="2 17 12 22 22 17" />
            <polyline points="2 12 12 17 22 12" />
          </svg>
        </RailButton>

        {/* Share */}
        <RailButton label="Share">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
        </RailButton>

        {/* Sound */}
        <RailButton label={muted ? "Sound" : "Sound"} onClick={() => setMuted((m) => !m)}>
          {muted ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <line x1="23" y1="9" x2="17" y2="15" />
              <line x1="17" y1="9" x2="23" y2="15" />
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

/* ---- Main feed ---- */
export default function ShortsFeed({ series }: { series: Series[] }) {
  const [shuffled, setShuffled] = useState<Series[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const withPosters = series.filter((s) => s.posterUrl);
    setShuffled(shuffleArray(withPosters));
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
        height: "calc(100dvh - 56px)", /* only subtract bottom nav */
        scrollSnapType: "y mandatory",
        WebkitOverflowScrolling: "touch",
        background: "#000",
        /* Pull up to cover the header area */
        marginTop: "-45px",
        paddingTop: "0",
        position: "relative",
        zIndex: 30,
      }}
    >
      {shuffled.map((s, i) => (
        <div key={s.slug} data-index={i}>
          <ShortCard series={s} isActive={i === activeIndex} />
        </div>
      ))}
    </div>
  );
}
