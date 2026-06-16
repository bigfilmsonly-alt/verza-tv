"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import type HlsType from "hls.js";
import { T } from "@/lib/theme";
import { formatDuration } from "@/lib/catalog";

// Dynamic import — hls.js only needed on Chrome/Firefox, not Safari/iOS
let HlsModule: typeof HlsType | null = null;
if (typeof window !== "undefined") {
  import("hls.js").then((m) => { HlsModule = m.default; }).catch(() => {});
}

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface PlayerProps {
  posterUrl: string;
  title: string;
  episodeNumber: number;
  durationS: number;
  seriesSlug: string;
  playbackId?: string;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function Player({
  posterUrl,
  title,
  episodeNumber,
  durationS,
  seriesSlug: _seriesSlug,
  playbackId,
}: PlayerProps) {
  void _seriesSlug;

  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<HlsType | null>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(durationS);
  const [buffered, setBuffered] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hlsReady, setHlsReady] = useState(false);

  const hlsUrl = playbackId
    ? `https://stream.mux.com/${playbackId}.m3u8`
    : null;

  const muxThumb = playbackId
    ? `https://image.mux.com/${playbackId}/thumbnail.jpg?time=2&width=720`
    : "";

  /* ---- Pre-attach HLS on mount (not on play click) --------------- */

  useEffect(() => {
    if (!hlsUrl) return;

    const video = videoRef.current;
    if (!video) return;

    console.log("[Player] Attaching HLS source:", hlsUrl);

    // Native HLS support (Safari / iOS)
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      console.log("[Player] Using native HLS (Safari/iOS)");
      video.src = hlsUrl;
      setHlsReady(true);
      return;
    }

    // hls.js for other browsers
    if (HlsModule && HlsModule.isSupported()) {
      console.log("[Player] Using hls.js");
      const hls = new HlsModule({
        maxBufferLength: 60,
        maxMaxBufferLength: 120,
        startLevel: -1,
        capLevelToPlayerSize: false,
        enableWorker: true,
        lowLatencyMode: false,
      });
      hlsRef.current = hls;
      hls.loadSource(hlsUrl);
      hls.attachMedia(video);

      hls.on(HlsModule.Events.MANIFEST_PARSED, (_event: string, data: { levels: unknown[] }) => {
        console.log("[Player] HLS manifest parsed, levels:", data.levels.length);
        setHlsReady(true);
      });

      hls.on(HlsModule.Events.ERROR, (_event: string, data: { type: string; details: string; fatal: boolean }) => {
        console.error("[Player] HLS error:", data.type, data.details, data.fatal);
        if (data.fatal) {
          if (data.type === HlsModule!.ErrorTypes.NETWORK_ERROR) {
            console.log("[Player] Fatal network error, attempting recovery...");
            hls.startLoad();
          } else if (data.type === HlsModule!.ErrorTypes.MEDIA_ERROR) {
            console.log("[Player] Fatal media error, attempting recovery...");
            hls.recoverMediaError();
          } else {
            console.error("[Player] Fatal error, cannot recover:", data.type);
            setError("Video failed to load. Please try refreshing the page.");
          }
        }
      });

      return () => {
        console.log("[Player] Destroying HLS instance");
        hls.destroy();
        hlsRef.current = null;
      };
    }

    // Neither native HLS nor hls.js supported
    console.error("[Player] HLS not supported in this browser");
    setError("Your browser does not support video playback. Please try Chrome, Safari, or Firefox.");
  }, [hlsUrl]);

  /* ---- Video event listeners (always attached -- video always in DOM) */

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onTimeUpdate = () => setCurrentTime(video.currentTime);
    const onDurationChange = () => {
      if (video.duration && isFinite(video.duration)) {
        setDuration(video.duration);
      }
    };
    const onPlay = () => {
      console.log("[Player] Video play event fired");
      setPlaying(true);
      setLoading(false);
    };
    const onPause = () => setPlaying(false);
    const onWaiting = () => setLoading(true);
    const onCanPlay = () => {
      console.log("[Player] Video canplay event fired");
      setLoading(false);
    };
    const onProgress = () => {
      if (video.buffered.length > 0) {
        setBuffered(video.buffered.end(video.buffered.length - 1));
      }
    };
    const onError = () => {
      console.error("[Player] Video element error:", video.error?.message);
      if (started) {
        setError("Video playback error. Please try again.");
        setLoading(false);
      }
    };

    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("durationchange", onDurationChange);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("waiting", onWaiting);
    video.addEventListener("canplay", onCanPlay);
    video.addEventListener("progress", onProgress);
    video.addEventListener("error", onError);

    return () => {
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("durationchange", onDurationChange);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("waiting", onWaiting);
      video.removeEventListener("canplay", onCanPlay);
      video.removeEventListener("progress", onProgress);
      video.removeEventListener("error", onError);
    };
  }, []); // No dependencies -- video element is always in the DOM now

  /* ---- Controls auto-hide ---------------------------------------- */

  const scheduleHide = useCallback(() => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    setShowControls(true);
    hideTimerRef.current = setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused) {
        setShowControls(false);
      }
    }, 3000);
  }, []);

  /* ---- Interactions ---------------------------------------------- */

  const handleStart = () => {
    const video = videoRef.current;
    if (!video) return;

    console.log("[Player] Play button clicked, hlsReady:", hlsReady);
    setStarted(true);
    setLoading(true);
    setError(null);

    // HLS is already attached -- just play
    video.play()
      .then(() => {
        console.log("[Player] video.play() resolved");
      })
      .catch((err) => {
        console.error("[Player] video.play() rejected:", err);
        // Autoplay may be blocked -- try muted
        video.muted = true;
        video.play().catch((err2) => {
          console.error("[Player] Muted play also failed:", err2);
          setError("Tap to play. Your browser blocked autoplay.");
          setLoading(false);
        });
      });

    scheduleHide();
  };

  const handleTap = () => {
    if (!started) return;
    const video = videoRef.current;
    if (!video) return;

    if (showControls) {
      // Controls visible: toggle play/pause
      if (video.paused) {
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    }
    // Always show controls on tap, then auto-hide
    scheduleHide();
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    const bar = progressRef.current;
    const video = videoRef.current;
    if (!bar || !video) return;

    const rect = bar.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    video.currentTime = pct * duration;
    scheduleHide();
  };

  const handleRetry = () => {
    setError(null);
    setLoading(true);

    // Destroy and re-create HLS
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const video = videoRef.current;
    if (!video || !hlsUrl) return;

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = hlsUrl;
      video.play().catch(() => {});
      return;
    }

    if (HlsModule && HlsModule.isSupported()) {
      const hls = new HlsModule({
        maxBufferLength: 60,
        maxMaxBufferLength: 120,
        startLevel: -1,
        capLevelToPlayerSize: false,
        enableWorker: true,
        lowLatencyMode: false,
      });
      hlsRef.current = hls;
      hls.loadSource(hlsUrl);
      hls.attachMedia(video);
      hls.on(HlsModule.Events.MANIFEST_PARSED, () => {
        setHlsReady(true);
        video.play().catch(() => {});
      });
      hls.on(HlsModule.Events.ERROR, (_event: string, data: { fatal: boolean }) => {
        if (data.fatal) {
          setError("Video failed to load. Please try refreshing the page.");
          setLoading(false);
        }
      });
    }
  };

  const progress = duration > 0 ? currentTime / duration : 0;
  const bufferPct = duration > 0 ? buffered / duration : 0;

  /* ---- Render: poster-only fallback (no playbackId) -------------- */

  if (!playbackId) {
    return <PosterFallback {...{ posterUrl, title, episodeNumber, durationS }} />;
  }

  /* ---- Render: real video player --------------------------------- */

  return (
    <div className="mx-4">
      {/* Player container -- 9:16 vertical */}
      <div
        className="relative rounded-2xl overflow-hidden select-none"
        style={{ aspectRatio: "9 / 16", background: "#07070E" }}
        onClick={handleTap}
      >
        {/* Video element -- ALWAYS rendered, hidden behind poster until started */}
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            zIndex: started ? 1 : 0,
            opacity: started ? 1 : 0,
          }}
          playsInline
          muted
          preload="auto"
          poster={muxThumb || undefined}
        />

        {/* Poster overlay before start — uses local poster art for instant display */}
        {!started && posterUrl && (
          <Image
            src={posterUrl}
            alt={title}
            fill
            sizes="(max-width: 440px) 100vw, 440px"
            className="object-cover"
            style={{ filter: "brightness(0.7)", zIndex: 2 }}
            priority
          />
        )}

        {/* Gradient overlays for controls legibility */}
        {started && (
          <>
            <div
              className="absolute inset-x-0 top-0 h-24 pointer-events-none transition-opacity duration-300"
              style={{
                background: "linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)",
                opacity: showControls ? 1 : 0,
                zIndex: 5,
              }}
            />
            <div
              className="absolute inset-x-0 bottom-0 h-32 pointer-events-none transition-opacity duration-300"
              style={{
                background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)",
                opacity: showControls ? 1 : 0,
                zIndex: 5,
              }}
            />
          </>
        )}

        {/* Big play button (before start) */}
        {!started && !error && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <button
              className="w-16 h-16 rounded-full flex items-center justify-center transition-transform active:scale-90"
              style={{
                background: T.accent,
                boxShadow: `0 0 24px ${T.accent}66`,
              }}
              onClick={(e) => {
                e.stopPropagation();
                handleStart();
              }}
              aria-label="Play"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill={T.text} stroke="none">
                <polygon points="8 5 20 12 8 19" />
              </svg>
            </button>
          </div>
        )}

        {/* Error message overlay */}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-30 px-6">
            <div
              className="rounded-xl px-6 py-5 text-center max-w-xs"
              style={{
                background: "rgba(0,0,0,0.8)",
                backdropFilter: "blur(12px)",
              }}
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke={T.accent}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mx-auto mb-3"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p className="text-sm mb-4" style={{ color: T.text }}>
                {error}
              </p>
              <button
                className="px-5 py-2 rounded-full text-sm font-semibold transition-transform active:scale-95"
                style={{ background: T.accent, color: T.text }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleRetry();
                }}
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Loading spinner */}
        {loading && started && !error && (
          <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
            <div
              className="w-10 h-10 rounded-full border-2 border-transparent animate-spin"
              style={{
                borderTopColor: T.text,
                borderRightColor: T.text,
              }}
            />
          </div>
        )}

        {/* Center pause/play icon (shown briefly on tap) */}
        {started && showControls && !loading && !error && (
          <div
            className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none transition-opacity duration-200"
            style={{ opacity: showControls ? 1 : 0 }}
          >
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{
                background: "rgba(0,0,0,0.45)",
                backdropFilter: "blur(8px)",
              }}
            >
              {playing ? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill={T.text} stroke="none">
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill={T.text} stroke="none">
                  <polygon points="8 5 20 12 8 19" />
                </svg>
              )}
            </div>
          </div>
        )}

        {/* Bottom controls bar */}
        {started && (
          <div
            className="absolute inset-x-0 bottom-0 px-4 pb-4 pt-8 z-20 transition-opacity duration-300"
            style={{ opacity: showControls ? 1 : 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Progress bar */}
            <div
              ref={progressRef}
              className="relative w-full h-6 flex items-center cursor-pointer group"
              onClick={handleSeek}
              onTouchStart={handleSeek}
            >
              {/* Track */}
              <div className="absolute inset-x-0 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.15)" }}>
                {/* Buffered */}
                <div
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{
                    width: `${bufferPct * 100}%`,
                    background: "rgba(255,255,255,0.2)",
                  }}
                />
                {/* Progress */}
                <div
                  className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-100"
                  style={{
                    width: `${progress * 100}%`,
                    background: T.accent,
                  }}
                />
              </div>
              {/* Scrubber dot */}
              <div
                className="absolute w-3 h-3 rounded-full -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{
                  left: `${progress * 100}%`,
                  background: T.text,
                  boxShadow: "0 0 6px rgba(0,0,0,0.5)",
                }}
              />
            </div>

            {/* Time + info */}
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs font-medium tabular-nums" style={{ color: "rgba(255,255,255,0.8)" }}>
                {formatTime(currentTime)}
              </span>
              <span className="text-xs font-medium tabular-nums" style={{ color: "rgba(255,255,255,0.5)" }}>
                {formatTime(duration)}
              </span>
            </div>
          </div>
        )}

        {/* Episode badge (top-left) */}
        {started && showControls && (
          <div
            className="absolute top-3 left-3 z-20 px-2 py-1 rounded-md transition-opacity duration-300"
            style={{
              background: "rgba(0,0,0,0.5)",
              backdropFilter: "blur(8px)",
            }}
          >
            <span className="text-xs font-semibold" style={{ color: T.text }}>
              EP {episodeNumber}
            </span>
          </div>
        )}

        {/* Mute indicator (top-right) */}
        {started && showControls && (
          <button
            className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full flex items-center justify-center transition-opacity duration-300"
            style={{
              background: "rgba(0,0,0,0.5)",
              backdropFilter: "blur(8px)",
            }}
            onClick={(e) => {
              e.stopPropagation();
              const video = videoRef.current;
              if (video) video.muted = !video.muted;
            }}
            aria-label="Toggle mute"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <line x1="23" y1="9" x2="17" y2="15" />
              <line x1="17" y1="9" x2="23" y2="15" />
            </svg>
          </button>
        )}
      </div>

      {/* Episode info bar */}
      <div
        className="flex items-center justify-between rounded-b-xl px-4 py-3 -mt-1"
        style={{
          background: T.surface,
          borderLeft: `1px solid ${T.line}`,
          borderRight: `1px solid ${T.line}`,
          borderBottom: `1px solid ${T.line}`,
        }}
      >
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: T.text }}>
            {title}
          </p>
          <p className="text-xs" style={{ color: T.textMute }}>
            Episode {episodeNumber}
          </p>
        </div>
        <span className="text-xs font-medium flex-shrink-0 ml-3" style={{ color: T.textDim }}>
          {formatDuration(durationS)}
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Poster-only fallback (no Mux playback ID)                         */
/* ------------------------------------------------------------------ */

function PosterFallback({
  posterUrl,
  title,
  episodeNumber,
  durationS,
}: {
  posterUrl: string;
  title: string;
  episodeNumber: number;
  durationS: number;
}) {
  const [playing, setPlaying] = useState(false);

  return (
    <div className="mx-4">
      <div
        className="relative rounded-2xl overflow-hidden"
        style={{ aspectRatio: "9 / 16", background: "#07070E" }}
      >
        {posterUrl ? (
          <Image
            src={posterUrl}
            alt={title}
            fill
            sizes="(max-width: 440px) 100vw, 440px"
            className="object-cover"
            priority
            style={{
              filter: playing ? "brightness(0.15)" : "brightness(0.7)",
              transition: "filter 0.4s ease",
            }}
          />
        ) : (
          <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, #1A1A26, #07070E)" }} />
        )}

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {playing ? (
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-end gap-1 h-10">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-1.5 rounded-full"
                    style={{
                      background: T.accent,
                      height: `${20 + ((i * 17) % 30)}px`,
                      animation: `eq ${0.4 + i * 0.1}s ease-in-out infinite alternate`,
                    }}
                  />
                ))}
              </div>
              <p className="text-sm font-semibold" style={{ color: T.text }}>
                Playing...
              </p>
              <button
                className="w-12 h-12 rounded-full flex items-center justify-center transition-transform active:scale-90"
                style={{
                  background: "rgba(255,255,255,0.12)",
                  backdropFilter: "blur(8px)",
                }}
                onClick={() => setPlaying(false)}
                aria-label="Pause"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill={T.text} stroke="none">
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
              </button>
            </div>
          ) : (
            <button
              className="w-16 h-16 rounded-full flex items-center justify-center transition-transform active:scale-90"
              style={{
                background: T.accent,
                boxShadow: `0 0 24px ${T.accent}66`,
              }}
              onClick={() => setPlaying(true)}
              aria-label="Play"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill={T.text} stroke="none">
                <polygon points="8 5 20 12 8 19" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div
        className="flex items-center justify-between rounded-b-xl px-4 py-3 -mt-1"
        style={{
          background: T.surface,
          borderLeft: `1px solid ${T.line}`,
          borderRight: `1px solid ${T.line}`,
          borderBottom: `1px solid ${T.line}`,
        }}
      >
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: T.text }}>
            {title}
          </p>
          <p className="text-xs" style={{ color: T.textMute }}>
            Episode {episodeNumber}
          </p>
        </div>
        <span className="text-xs font-medium flex-shrink-0 ml-3" style={{ color: T.textDim }}>
          {formatDuration(durationS)}
        </span>
      </div>

      <style>{`
        @keyframes eq {
          from { height: 8px; }
          to { height: 32px; }
        }
      `}</style>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatTime(seconds: number): string {
  const s = Math.floor(seconds);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}
