"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import type HlsType from "hls.js";
import { HORIZONTAL_VIDEOS, type HorizontalVideo } from "@/lib/horizontal-map";
import VideoWatermark from "@/components/VideoWatermark";
import { useTranslation } from "@/components/LangProvider";

/* ---- Load hls.js once ---- */
let hlsPromise: Promise<typeof HlsType | null> | null = null;
function getHls(): Promise<typeof HlsType | null> {
  if (!hlsPromise && typeof window !== "undefined") {
    hlsPromise = import("hls.js").then((m) => m.default).catch(() => null);
  }
  return hlsPromise || Promise.resolve(null);
}

// Only one horizontal card may play at a time.
let pauseCurrentCard: (() => void) | null = null;

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
  /* The mute control's accessible name was English for every viewer. */
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<HlsType | null>(null);
  const pauseThisCard = useCallback(() => {
    videoRef.current?.pause();
  }, []);
  const [playing, setPlaying] = useState(false);
  // True once playback has begun; keeps the video frame visible through pauses
  // so a paused card shows its current frame instead of flashing the thumbnail.
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [videoMuted, setVideoMuted] = useState(() => {
    // Guarded: localStorage THROWS, not returns null, when site data is blocked,
    // and a throw in a useState initialiser happens during render. See the note
    // on the same read in components/EpisodeFeed.tsx.
    if (typeof window === "undefined") return true;
    try {
      return localStorage.getItem("verza-muted") !== "false";
    } catch {
      return true;
    }
  });

  const hlsUrl = `https://stream.mux.com/${video.playbackId}.m3u8`;
  const thumbUrl = `https://image.mux.com/${video.playbackId}/thumbnail.jpg?time=3&width=640&height=360`;

  const attachHls = useCallback(async () => {
    const vid = videoRef.current;
    if (!vid) return;

    // Already attached (pause → resume): keep the buffer and position.
    if (hlsRef.current || vid.currentSrc) return;

    // Prefer hls.js (MSE) whenever supported; native HLS only where hls.js
    // can't run. Some Chrome versions answer "maybe" to
    // canPlayType(HLS) but then stall forever without playing.
    // NOTE: that is NOT iOS. hls.js resolves ManagedMediaSource first and
    // iPhone Safari has shipped it since iOS 17.1, so Hls.isSupported() is
    // true there and iPhones take the MSE branch, worker and all.
    const Hls = await getHls();
    // Re-read after the await — the card may have unmounted meanwhile.
    if (!videoRef.current) return;

    if (!Hls || !Hls.isSupported()) {
      if (vid.canPlayType("application/vnd.apple.mpegurl")) {
        vid.src = hlsUrl;
      }
      return;
    }

    const hls = new Hls({
      maxBufferLength: 20,
      enableWorker: true,
      startLevel: 0,
      abrEwmaDefaultEstimate: 1_000_000,
      // Fifteen cards mount on this route and each can start its own pipeline.
      // Uncapped, every one of them is free to pull 1080p into a phone-sized
      // element; eight of the source assets are 1920x1080.
      capLevelToPlayerSize: true,
      maxDevicePixelRatio: 1,
    });
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
      if (pauseCurrentCard === pauseThisCard) pauseCurrentCard = null;
    };
  }, [pauseThisCard]);

  // Keep `playing` truthful: browsers pause videos on their own (backgrounding,
  // interruptions, end of stream) — the UI must follow the element, not memory.
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    vid.addEventListener("play", onPlay);
    vid.addEventListener("pause", onPause);
    vid.addEventListener("ended", onPause);
    return () => {
      vid.removeEventListener("play", onPlay);
      vid.removeEventListener("pause", onPause);
      vid.removeEventListener("ended", onPause);
    };
  }, []);

  // Pause when the card scrolls out of view — a hidden card kept playing
  // audio and streaming data indefinitely.
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) continue;
        if (!vid.paused) vid.pause();
        /* Pausing stops the audio but leaves the pipeline, its buffers and its
           decoder allocated. Scrolling the row therefore accumulated live hls
           instances, up to one per card, and released them only on unmount.
           Releasing here means a scrolled-past card costs nothing; handlePlay
           rebuilds it if the viewer comes back. */
        if (hlsRef.current) {
          hlsRef.current.destroy();
          hlsRef.current = null;
        }
      }
    }, { threshold: 0.1 });
    io.observe(vid);
    return () => io.disconnect();
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

    // Pause whichever card is currently playing before starting this one.
    if (pauseCurrentCard) pauseCurrentCard();
    pauseCurrentCard = pauseThisCard;

    async function start() {
      await attachHls();
      const vid = videoRef.current;
      if (!vid) return;
      vid.muted = videoMuted;
      try {
        await vid.play();
        setPlaying(true);
        setStarted(true);
        setLoading(false);
      } catch {
        vid.muted = true;
        try {
          await vid.play();
          setPlaying(true);
          setLoading(false);
          // Restore preference after autoplay succeeds
          setTimeout(() => { if (vid && !videoMuted) vid.muted = false; }, 100);
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
          preload="none"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: started ? 1 : 0, zIndex: started ? 1 : 0, background: "#07070E" }}
          onClick={() => { if (playing) { videoRef.current?.pause(); setPlaying(false); } }}
        />

        {/* VERZA watermark — top-left corner while playing */}
        <VideoWatermark videoRef={videoRef} top={8} left={8} size={50} />

        {!started && (
          <img
            src={thumbUrl}
            alt={video.title}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ filter: "saturate(1.3) contrast(1.08) brightness(1.04)" }}
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
            setVideoMuted((m) => {
              const next = !m;
              localStorage.setItem("verza-muted", String(next));
              const vid = videoRef.current;
              if (vid) vid.muted = next;
              return next;
            });
          }}
          className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.08)", border: "none", cursor: "pointer" }}
          aria-label={`${t("shorts.sound")} ${t(videoMuted ? "shorts.soundOff" : "shorts.soundOn")}`}
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
export default function HorizontalFeed({ embedded = false }: { embedded?: boolean }) {
  /* horizontal.episodes and shorts.sound* were translated into 20 languages
     and rendered in none: this player read English for every viewer. */
  const { t } = useTranslation();
  const season1 = HORIZONTAL_VIDEOS.filter((v) => v.season === 1);
  const season2 = HORIZONTAL_VIDEOS.filter((v) => v.season === 2);
  const bonus = HORIZONTAL_VIDEOS.filter((v) => v.season === 0);

  return (
    <div className={embedded ? "px-4 pt-0 pb-24" : "px-4 pt-2 pb-24"}>
      {/* Series header */}
      <h1 className="text-2xl font-bold mb-1" style={{ color: "#F5F4F8" }}>
        Storage Pirates
      </h1>
      <p className="text-sm mb-4" style={{ color: "rgba(245,244,248,0.5)" }}>
        Reality meets comedy. Real storage auctions, hidden treasures, bidding wars, and behind-the-scenes chaos.
      </p>

      {/* Rotate phone banner */}
      <div
        className="flex items-center gap-3 rounded-xl px-4 py-3 mb-6"
        style={{
          background: "linear-gradient(135deg, rgba(139,92,246,0.12), rgba(224,17,95,0.08))",
          border: "1px solid rgba(139,92,246,0.2)",
        }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, transform: "rotate(90deg)" }}>
          <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
          <line x1="12" y1="18" x2="12.01" y2="18" />
        </svg>
        <div>
          <p className="text-xs font-semibold" style={{ color: "#F5F4F8" }}>
            Horizontal Video
          </p>
          <p className="text-[11px]" style={{ color: "rgba(245,244,248,0.5)" }}>
            Rotate your phone for full-screen landscape viewing
          </p>
        </div>
      </div>

      {/* Season 1 */}
      <div className="mb-6">
        <h2 className="text-base font-bold mb-3 flex items-center gap-2" style={{ color: "#F5F4F8" }}>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider" style={{ background: "rgba(224,17,95,0.2)", color: "#E0115F" }}>
            SEASON 1
          </span>
          <span style={{ color: "rgba(245,244,248,0.4)" }}>{season1.length} {t("horizontal.episodes")}</span>
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
          <span style={{ color: "rgba(245,244,248,0.4)" }}>{season2.length} {t("horizontal.episodes")}</span>
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
