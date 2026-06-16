"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import Hls from "hls.js";
import { T } from "@/lib/theme";
import { formatDuration } from "@/lib/catalog";

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
  const hlsRef = useRef<Hls | null>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(durationS);
  const [buffered, setBuffered] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [loading, setLoading] = useState(false);

  const hlsUrl = playbackId
    ? `https://stream.mux.com/${playbackId}.m3u8`
    : null;

  const posterThumb = playbackId
    ? `https://image.mux.com/${playbackId}/thumbnail.jpg?time=2&width=720`
    : posterUrl;

  /* ---- Attach HLS ------------------------------------------------ */

  useEffect(() => {
    if (!hlsUrl || !started) return;

    const video = videoRef.current;
    if (!video) return;

    // Native HLS support (Safari / iOS)
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = hlsUrl;
      video.play().catch(() => {});
      return;
    }

    // hls.js for other browsers
    if (Hls.isSupported()) {
      const hls = new Hls({
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        startLevel: -1, // auto quality
      });
      hlsRef.current = hls;
      hls.loadSource(hlsUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
      });
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            hls.startLoad();
          } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
            hls.recoverMediaError();
          }
        }
      });
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [hlsUrl, started]);

  /* ---- Video event listeners ------------------------------------- */

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
      setPlaying(true);
      setLoading(false);
    };
    const onPause = () => setPlaying(false);
    const onWaiting = () => setLoading(true);
    const onCanPlay = () => setLoading(false);
    const onProgress = () => {
      if (video.buffered.length > 0) {
        setBuffered(video.buffered.end(video.buffered.length - 1));
      }
    };

    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("durationchange", onDurationChange);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("waiting", onWaiting);
    video.addEventListener("canplay", onCanPlay);
    video.addEventListener("progress", onProgress);

    return () => {
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("durationchange", onDurationChange);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("waiting", onWaiting);
      video.removeEventListener("canplay", onCanPlay);
      video.removeEventListener("progress", onProgress);
    };
  }, [started]);

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
    setStarted(true);
    setPlaying(true);
    setLoading(true);
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
        style={{ aspectRatio: "9 / 16", background: T.bg }}
        onClick={handleTap}
      >
        {/* Hidden video element */}
        {started && (
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover"
            playsInline
            muted
            autoPlay
            preload="auto"
            poster={posterThumb}
          />
        )}

        {/* Poster overlay before start */}
        {!started && posterThumb && (
          <Image
            src={posterThumb}
            alt={title}
            fill
            sizes="(max-width: 440px) 100vw, 440px"
            className="object-cover"
            style={{ filter: "brightness(0.6)" }}
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
              }}
            />
            <div
              className="absolute inset-x-0 bottom-0 h-32 pointer-events-none transition-opacity duration-300"
              style={{
                background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)",
                opacity: showControls ? 1 : 0,
              }}
            />
          </>
        )}

        {/* Big play button (before start) */}
        {!started && (
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

        {/* Loading spinner */}
        {loading && started && (
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
        {started && showControls && !loading && (
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
        style={{ aspectRatio: "9 / 16", background: T.bg }}
      >
        {posterUrl ? (
          <Image
            src={posterUrl}
            alt={title}
            fill
            sizes="(max-width: 440px) 100vw, 440px"
            className="object-cover"
            style={{
              filter: playing ? "brightness(0.15)" : "brightness(0.6)",
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
