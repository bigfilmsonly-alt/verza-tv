"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import type HlsType from "hls.js";
import { HORIZONTAL_VIDEOS, type HorizontalVideo } from "@/lib/horizontal-map";

/* ---- Load hls.js once ---- */
let hlsPromise: Promise<typeof HlsType | null> | null = null;
function getHls(): Promise<typeof HlsType | null> {
  if (!hlsPromise && typeof window !== "undefined") {
    hlsPromise = import("hls.js").then((m) => m.default).catch(() => null);
  }
  return hlsPromise || Promise.resolve(null);
}

function formatDuration(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function episodeLabel(v: HorizontalVideo): string {
  if (v.season === 0) return "Promo";
  if (v.episode === 0) return "Teaser";
  return `S${v.season} E${v.episode}`;
}

function resolutionLabel(w: number): string {
  return w >= 1920 ? "1080p" : "720p";
}

/* ---- Single horizontal video card ---- */
function HorizontalCard({ video, index }: { video: HorizontalVideo; index: number }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<HlsType | null>(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [videoMuted, setVideoMuted] = useState(true);

  const hlsUrl = `https://stream.mux.com/${video.playbackId}.m3u8`;
  const thumbUrl = `https://image.mux.com/${video.playbackId}/thumbnail.jpg?time=3&width=640&height=360`;

  const attachHls = useCallback(async () => {
    const vid = videoRef.current;
    if (!vid) return;

    if (vid.canPlayType("application/vnd.apple.mpegurl")) {
      vid.src = hlsUrl;
      return;
    }

    const Hls = await getHls();
    if (!Hls || !Hls.isSupported() || !vid) return;

    if (hlsRef.current) hlsRef.current.destroy();

    const hls = new Hls({ maxBufferLength: 30, enableWorker: true });
    hlsRef.current = hls;
    hls.loadSource(hlsUrl);
    hls.attachMedia(vid);
    hls.on(Hls.Events.ERROR, (_e: string, data: { type: string; details: string; fatal: boolean }) => {
      if (data.fatal && hls && Hls) {
        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) hls.startLoad();
        else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) hls.recoverMediaError();
      }
    });
  }, [hlsUrl]);

  useEffect(() => {
    return () => {
      if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
    };
  }, []);

  function handlePlay() {
    const vid = videoRef.current;
    if (!vid) return;

    if (playing) {
      vid.pause();
      setPlaying(false);
      return;
    }

    setLoading(true);

    async function start() {
      await attachHls();
      const vid = videoRef.current;
      if (!vid) return;
      try {
        await vid.play();
        setPlaying(true);
        setLoading(false);
      } catch {
        vid.muted = true;
        try {
          await vid.play();
          setPlaying(true);
          setLoading(false);
        } catch {
          setLoading(false);
        }
      }
    }

    start();
  }

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: "#12121C" }}>
      {/* Video container */}
      <div className="relative" style={{ aspectRatio: "16 / 9" }}>
        <video
          ref={videoRef}
          playsInline
          muted
          preload="none"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: playing ? 1 : 0, zIndex: playing ? 1 : 0, background: "#07070E" }}
          onClick={() => { if (playing) { videoRef.current?.pause(); setPlaying(false); } }}
        />

        {!playing && (
          <img
            src={thumbUrl}
            alt={video.title}
            className="absolute inset-0 w-full h-full object-cover"
            loading={index < 4 ? "eager" : "lazy"}
          />
        )}

        <button
          className="absolute inset-0 z-10 flex items-center justify-center"
          style={{ background: playing ? "transparent" : "rgba(0,0,0,0.25)", border: "none", cursor: "pointer" }}
          onClick={handlePlay}
          aria-label={playing ? "Pause" : `Play ${video.title}`}
        >
          {loading ? (
            <div className="w-10 h-10 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: "#fff", borderRightColor: "#fff" }} />
          ) : !playing ? (
            <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)", border: "2px solid rgba(255,255,255,0.3)" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#fff">
                <path d="M8 5.14v13.72a1 1 0 0 0 1.5.86l11.04-6.86a1 1 0 0 0 0-1.72L9.5 4.28A1 1 0 0 0 8 5.14z" />
              </svg>
            </div>
          ) : null}
        </button>

        {/* Duration badge */}
        {!playing && (
          <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded text-xs font-medium" style={{ background: "rgba(0,0,0,0.7)", color: "#fff", zIndex: 5 }}>
            {formatDuration(video.duration)}
          </div>
        )}

        {/* Resolution badge */}
        {!playing && (
          <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ background: "rgba(0,0,0,0.6)", color: "rgba(255,255,255,0.8)", zIndex: 5 }}>
            {resolutionLabel(video.width)}
          </div>
        )}

        {/* Episode badge */}
        {!playing && (
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider" style={{ background: "rgba(224,17,95,0.85)", color: "#fff", zIndex: 5 }}>
            {episodeLabel(video)}
          </div>
        )}
      </div>

      {/* Title bar below video */}
      <div className="px-3 py-2.5 flex items-center gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: "#F5F4F8" }}>
            {video.title}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "rgba(245,244,248,0.45)" }}>
            {episodeLabel(video)} &middot; {formatDuration(video.duration)} &middot; {resolutionLabel(video.width)}
          </p>
        </div>
        <button
          onClick={() => {
            setVideoMuted((m) => !m);
            const vid = videoRef.current;
            if (vid) vid.muted = !vid.muted;
          }}
          className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.08)", border: "none", cursor: "pointer" }}
          aria-label={videoMuted ? "Unmute" : "Mute"}
        >
          {videoMuted ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}

/* ---- Main feed ---- */
export default function HorizontalFeed() {
  const season1 = HORIZONTAL_VIDEOS.filter((v) => v.season === 1);
  const season2 = HORIZONTAL_VIDEOS.filter((v) => v.season === 2);
  const bonus = HORIZONTAL_VIDEOS.filter((v) => v.season === 0);

  return (
    <div className="px-4 pt-16 pb-24">
      {/* Series header */}
      <h1 className="text-2xl font-bold mb-1" style={{ color: "#F5F4F8" }}>
        Storage Pirates
      </h1>
      <p className="text-sm mb-6" style={{ color: "rgba(245,244,248,0.5)" }}>
        Reality meets comedy. Real storage auctions, hidden treasures, bidding wars, and behind-the-scenes chaos.
      </p>

      {/* Season 1 */}
      <div className="mb-6">
        <h2 className="text-base font-bold mb-3 flex items-center gap-2" style={{ color: "#F5F4F8" }}>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider" style={{ background: "rgba(224,17,95,0.2)", color: "#E0115F" }}>
            SEASON 1
          </span>
          <span style={{ color: "rgba(245,244,248,0.4)" }}>{season1.length} episodes</span>
        </h2>
        <div className="flex flex-col gap-4">
          {season1.map((v, i) => (
            <HorizontalCard key={v.playbackId} video={v} index={i} />
          ))}
        </div>
      </div>

      {/* Season 2 */}
      <div className="mb-6">
        <h2 className="text-base font-bold mb-3 flex items-center gap-2" style={{ color: "#F5F4F8" }}>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider" style={{ background: "rgba(139,92,246,0.2)", color: "#8B5CF6" }}>
            SEASON 2
          </span>
          <span style={{ color: "rgba(245,244,248,0.4)" }}>{season2.length} episodes</span>
        </h2>
        <div className="flex flex-col gap-4">
          {season2.map((v, i) => (
            <HorizontalCard key={v.playbackId} video={v} index={season1.length + i} />
          ))}
        </div>
      </div>

      {/* Bonus */}
      {bonus.length > 0 && (
        <div>
          <h2 className="text-base font-bold mb-3 flex items-center gap-2" style={{ color: "#F5F4F8" }}>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider" style={{ background: "rgba(255,255,255,0.1)", color: "rgba(245,244,248,0.6)" }}>
              BONUS
            </span>
          </h2>
          <div className="flex flex-col gap-4">
            {bonus.map((v, i) => (
              <HorizontalCard key={v.playbackId} video={v} index={season1.length + season2.length + i} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
