"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import type HlsType from "hls.js";
import { trackEpisodeStart, trackEpisodeComplete, trackUnlockPrompt, trackUnlockClick } from "@/lib/track";
import { emit } from "@/lib/analytics";
import { requireCheckoutUser } from "@/lib/checkout-auth";
import { T } from "@/lib/theme";
import { formatDuration } from "@/lib/catalog";
import { getPlayback } from "@/lib/mux-public-map";
import VideoWatermark from "@/components/VideoWatermark";
import {
  saveLastWatching,
  notifyResume,
  clearResumeNotification,
  maybeRequestResumePermission,
  type ResumeItem,
} from "@/lib/resume";
import { recordWatchProgress } from "@/lib/watch-progress-client";
import { readGuestResume } from "@/lib/guest-storage";

// Dynamic import — hls.js drives playback everywhere MSE is available;
// native HLS is only used where hls.js can't run (iOS Safari).
let HlsModule: typeof HlsType | null = null;
let hlsLoad: Promise<typeof HlsType | null> | null = null;
function getHls(): Promise<typeof HlsType | null> {
  if (!hlsLoad && typeof window !== "undefined") {
    hlsLoad = import("hls.js")
      .then((m) => { HlsModule = m.default; return HlsModule; })
      .catch(() => { hlsLoad = null; return null; }); // transient failure → retry next call
  }
  return hlsLoad || Promise.resolve(null);
}
// Deferred warm-up (a dynamic import() fired during module evaluation can
// deadlock the bundler's chunk loader).
if (typeof window !== "undefined") setTimeout(() => { void getHls(); }, 0);

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
  totalEpisodes?: number;
  freeEpisodes?: number;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function Player({
  posterUrl,
  title,
  episodeNumber,
  durationS,
  seriesSlug,
  playbackId,
  totalEpisodes = 50,
  freeEpisodes = 5,
}: PlayerProps) {

  const searchParams = useSearchParams();

  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<HlsType | null>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Resume: seconds to seek to once metadata is available (-1 = nothing to restore)
  const resumeSeekRef = useRef<number>(-1);
  // Guard so the resume seek runs exactly once
  const didSeekRef = useRef(false);
  // Guard so the permission request fires on the first play gesture only
  const askedPermissionRef = useRef(false);

  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [showUnlockPopup, setShowUnlockPopup] = useState(false);
  const [unlockLoading, setUnlockLoading] = useState(false);
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const lastSavedRef = useRef(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(durationS);
  const [buffered, setBuffered] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hlsReady, setHlsReady] = useState(false);
  const [muted, setMuted] = useState(true);
  // Poster is HIDDEN initially — only shows after 500ms if video hasn't
  // started yet.  Eliminates the poster flash on fast connections.
  const [showPoster, setShowPoster] = useState(false);
  const posterTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (started) {
      queueMicrotask(() => setShowPoster(false));
      if (posterTimerRef.current) clearTimeout(posterTimerRef.current);
      return;
    }
    posterTimerRef.current = setTimeout(() => {
      if (!started) setShowPoster(true);
    }, 500);
    return () => { if (posterTimerRef.current) clearTimeout(posterTimerRef.current); };
  }, [started]);

  /* This dormant legacy component is deliberately public-preview-only. The
     canonical EpisodeFeed resolves paid media through /api/playback. Fail
     closed if a future caller accidentally passes a paid episode's public ID. */
  const publicPlaybackId =
    episodeNumber >= 1 && episodeNumber <= freeEpisodes
      ? playbackId
      : undefined;
  const hlsUrl = publicPlaybackId
    ? `https://stream.mux.com/${publicPlaybackId}.m3u8`
    : null;

  const muxThumb = publicPlaybackId
    ? `https://image.mux.com/${publicPlaybackId}/thumbnail.jpg?time=2&width=720`
    : "";

  /* ---- Pre-attach HLS on mount (not on play click) --------------- */

  useEffect(() => {
    if (!hlsUrl) return;

    const video = videoRef.current;
    if (!video) return;

    let cancelled = false;

    // Prefer hls.js (MSE) whenever it's supported. Some Chrome versions
    // answer "maybe" to canPlayType(HLS) but then stall forever without
    // playing — native HLS is only trustworthy on iOS Safari (no MSE).
    getHls().then((Hls) => {
      if (cancelled || !video) return;

      if (!Hls || !Hls.isSupported()) {
        if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = hlsUrl;
          setHlsReady(true);
        } else {
          setError("Your browser does not support video playback. Please try Chrome, Safari, or Firefox.");
        }
        return;
      }

      const hls = new Hls({
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        startLevel: 0,
        capLevelToPlayerSize: true,
        enableWorker: true,
        lowLatencyMode: false,
        abrEwmaDefaultEstimate: 1_000_000,
      });
      hlsRef.current = hls;
      hls.loadSource(hlsUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setHlsReady(true);
      });

      hls.on(Hls.Events.ERROR, (_event: string, data: { type: string; details: string; fatal: boolean }) => {
        if (data.fatal) {
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            hls.startLoad();
          } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
            hls.recoverMediaError();
          } else {
            setError("Video failed to load. Please try refreshing the page.");
          }
        }
      });
    });

    return () => {
      cancelled = true;
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [hlsUrl]);

  /* ---- Warm episode N+1 manifest — ONLY if it's a free episode ----- */
  /*  Never prefetch a locked episode's stream (respects the paywall).  */

  useEffect(() => {
    const nextEp = episodeNumber + 1;
    if (nextEp > freeEpisodes || nextEp > totalEpisodes) return;
    const next = getPlayback(seriesSlug, nextEp);
    if (!next?.playbackId) return;
    fetch(`https://stream.mux.com/${next.playbackId}.m3u8`, { mode: "cors" }).catch(() => {});
    const img = new window.Image();
    img.src = `https://image.mux.com/${next.playbackId}/thumbnail.jpg?time=2&width=480`;
  }, [seriesSlug, episodeNumber, freeEpisodes, totalEpisodes]);

  /* ---- Video event listeners (always attached -- video always in DOM) */

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      // Save progress every 10 seconds
      const now = Date.now();
      if (now - lastSavedRef.current > 10000 && video.currentTime > 5) {
        lastSavedRef.current = now;
        /* Device first, account second — the POST 401s for a guest. */
        recordWatchProgress({
          seriesSlug,
          episodeNumber,
          progressSeconds: video.currentTime,
          completed: false,
        });
      }
    };
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
    const onError = () => {
      if (started) {
        setError("Video playback error. Please try again.");
        setLoading(false);
      }
    };
    const onEnded = () => {
      trackEpisodeComplete(seriesSlug, episodeNumber);
      // Save completed progress
      recordWatchProgress({ seriesSlug, episodeNumber, progressSeconds: 0, completed: true });
      if (freeEpisodes < totalEpisodes && episodeNumber >= freeEpisodes) {
        /* Last free episode just ended — show unlock popup */
        trackUnlockPrompt(seriesSlug);
        emit("paywall_viewed", { show_id: seriesSlug, episode_number: episodeNumber, plan_type: "series_unlock", surface: "player_unlock_popup" });
        setShowUnlockPopup(true);
      } else if (episodeNumber < totalEpisodes) {
        /* Auto-advance to next episode */
        window.location.href = `/series/${seriesSlug}/${episodeNumber + 1}`;
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
    video.addEventListener("ended", onEnded);

    return () => {
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("durationchange", onDurationChange);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("waiting", onWaiting);
      video.removeEventListener("canplay", onCanPlay);
      video.removeEventListener("progress", onProgress);
      video.removeEventListener("error", onError);
      video.removeEventListener("ended", onEnded);
    };
  }, [episodeNumber, totalEpisodes, freeEpisodes, seriesSlug, started]);

  /* ---- Resume: restore saved position on load -------------------- */
  /*  Prefer a ?t= URL override, else the saved server progress.       */
  /*  The actual seek happens once, on 'loadedmetadata'.               */

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let cancelled = false;

    // Apply the resume seek exactly once, once we know the duration.
    const applySeek = () => {
      if (didSeekRef.current) return;
      const target = resumeSeekRef.current;
      const d = video.duration;
      if (target > 2 && Number.isFinite(d) && target < d) {
        didSeekRef.current = true;
        try {
          video.currentTime = target;
        } catch {
          /* seek not allowed yet */
        }
      }
    };

    // URL override: ?t=<integer seconds> wins over the fetched value.
    const tParam = searchParams?.get("t");
    if (tParam) {
      const tNum = Number.parseInt(tParam, 10);
      if (Number.isFinite(tNum) && tNum > 2) {
        resumeSeekRef.current = tNum;
      }
    }

    video.addEventListener("loadedmetadata", applySeek);
    // If metadata is already available (fast cache / native HLS), try now.
    if (video.readyState >= 1) applySeek();

    // Fetch saved progress only if no URL override already set the target.
    if (resumeSeekRef.current < 0) {
      fetch("/api/watch-progress")
        .then((res) => (res.ok ? res.json() : null))
        .then((data: { items?: Array<{ seriesSlug: string; episodeNumber: number; progressSeconds: number }> } | null) => {
          if (cancelled) return;
          const match = data?.items?.find(
            (it) => it.seriesSlug === seriesSlug && it.episodeNumber === episodeNumber,
          );
          // GET already filters completed=false; still apply the >2 gate at seek.
          if (match && match.progressSeconds > 2) {
            resumeSeekRef.current = match.progressSeconds;
            applySeek();
            return;
          }
          /* The account had nothing to say — either the viewer is signed out
             (GET returns {items: []} for a guest) or they watched this on this
             device before the account existed. Resume from what the device
             remembers. Without this the guest half of the free preview always
             restarted at zero. */
          const local = readGuestResume(seriesSlug);
          if (local && local.episodeNumber === episodeNumber && local.progressSeconds > 2) {
            resumeSeekRef.current = local.progressSeconds;
            applySeek();
          }
        })
        .catch(() => {});
    }

    return () => {
      cancelled = true;
      video.removeEventListener("loadedmetadata", applySeek);
    };
  }, [seriesSlug, episodeNumber, searchParams]);

  /* ---- Re-engagement reminder (visibilitychange + pagehide) ------- */
  /*  When the viewer leaves mid-episode, remember the exact spot,      */
  /*  fire a "Continue watching" notification, and flush progress.      */

  useEffect(() => {
    const buildItem = (): ResumeItem | null => {
      const video = videoRef.current;
      if (!video) return null;
      const poster = posterUrl || muxThumb || "/apple-touch-icon-180.png";
      return {
        slug: seriesSlug,
        episode: episodeNumber,
        title: title || seriesSlug,
        poster,
        positionS: video.currentTime,
        updatedAt: Date.now(),
      };
    };

    const onHidden = () => {
      const video = videoRef.current;
      if (!video) return;
      if (video.paused || video.currentTime <= 3) return;

      const item = buildItem();
      if (!item) return;

      saveLastWatching(item);
      notifyResume(item);

      // Flush a final progress write that survives the page being backgrounded.
      // The device half of this is synchronous, so it lands even if the tab
      // dies before the keepalive request leaves.
      recordWatchProgress(
        { seriesSlug, episodeNumber, progressSeconds: video.currentTime, completed: false },
        { keepalive: true },
      );
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        onHidden();
      } else if (document.visibilityState === "visible") {
        clearResumeNotification();
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", onHidden);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", onHidden);
    };
  }, [seriesSlug, episodeNumber, title, posterUrl, muxThumb]);

  /* ---- Controls auto-hide ---------------------------------------- */

  const scheduleHide = useCallback(() => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    setShowControls(true);
    hideTimerRef.current = setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused) {
        setShowControls(false);
      }
    }, 10000);
  }, []);

  /* ---- Auto-play when HLS is ready ------------------------------- */

  useEffect(() => {
    if (!hlsReady || started) return;
    const video = videoRef.current;
    if (!video) return;

    setLoading(true);
    trackEpisodeStart(seriesSlug, episodeNumber);

    // Wait for the compositor to actually paint a video frame before
    // revealing (prevents black flash between poster and first frame).
    const vid = video!;
    function revealOnFrame() {
      if ("requestVideoFrameCallback" in vid) {
        vid.requestVideoFrameCallback(() => { setStarted(true); });
      } else {
        requestAnimationFrame(() => requestAnimationFrame(() => { setStarted(true); }));
      }
    }

    // Restore mute preference — if user unmuted on previous episode, keep sound on
    const wasMuted = localStorage.getItem("verza-muted") !== "false";
    video.muted = wasMuted;
    setMuted(wasMuted);
    video.play()
      .then(() => {
        revealOnFrame();
        scheduleHide();
      })
      .catch(() => {
        // Autoplay with sound blocked — fall back to muted
        video.muted = true;
        setMuted(true);
        video.play()
          .then(() => { revealOnFrame(); scheduleHide(); })
          .catch(() => { setLoading(false); });
      });
  }, [hlsReady, started, scheduleHide, seriesSlug, episodeNumber]);

  /* ---- Interactions ---------------------------------------------- */

  const handleStart = () => {
    const video = videoRef.current;
    if (!video) return;

    // First real play gesture — ask for resume-notification permission once.
    if (!askedPermissionRef.current) {
      askedPermissionRef.current = true;
      maybeRequestResumePermission().catch(() => {});
    }

    // DON'T set started yet — keep poster visible until a real video frame
    // is composited. Loading hides the play button and shows the spinner.
    setLoading(true);
    setError(null);

    function revealOnFrame(vid: HTMLVideoElement) {
      if ("requestVideoFrameCallback" in vid) {
        vid.requestVideoFrameCallback(() => { setStarted(true); setLoading(false); });
      } else {
        requestAnimationFrame(() => requestAnimationFrame(() => { setStarted(true); setLoading(false); }));
      }
    }

    video.play()
      .then(() => {
        revealOnFrame(video);
        scheduleHide();
      })
      .catch(() => {
        video.muted = true;
        setMuted(true);
        video.play()
          .then(() => { revealOnFrame(video); scheduleHide(); })
          .catch(() => {
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

    // A tap is a user gesture too — cover the auto-play path.
    if (!askedPermissionRef.current) {
      askedPermissionRef.current = true;
      maybeRequestResumePermission().catch(() => {});
    }

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

  const handleRetry = async () => {
    setError(null);
    setLoading(true);

    // Destroy and re-create HLS
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const video = videoRef.current;
    if (!video || !hlsUrl) return;

    // Reveal the frame once retry playback actually produces pixels — the
    // mount-time reveal effect only fires on hlsReady's FIRST transition.
    const revealOnFrame = () => {
      if ("requestVideoFrameCallback" in video) {
        video.requestVideoFrameCallback(() => { setStarted(true); setLoading(false); });
      } else {
        requestAnimationFrame(() => requestAnimationFrame(() => { setStarted(true); setLoading(false); }));
      }
    };

    // AWAIT the hls.js load (retries a previously failed chunk fetch) instead
    // of reading the module variable — a null module must not route Chrome to
    // its stalling native-HLS path.
    const Hls = await getHls();
    if (!videoRef.current) return; // unmounted while loading

    if (!Hls || !Hls.isSupported()) {
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = hlsUrl;
        setHlsReady(true);
        video.play().then(revealOnFrame).catch(() => {});
      } else {
        setError("Video failed to load. Please try refreshing the page.");
        setLoading(false);
      }
      return;
    }

    const hls = new Hls({
      maxBufferLength: 30,
      maxMaxBufferLength: 60,
      startLevel: 0,
      capLevelToPlayerSize: true,
      enableWorker: true,
      lowLatencyMode: false,
      abrEwmaDefaultEstimate: 1_000_000,
    });
    hlsRef.current = hls;
    hls.loadSource(hlsUrl);
    hls.attachMedia(video);
    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      setHlsReady(true);
      video.play().then(revealOnFrame).catch(() => {});
    });
    hls.on(Hls.Events.ERROR, (_event: string, data: { fatal: boolean }) => {
      if (data.fatal) {
        setError("Video failed to load. Please try refreshing the page.");
        setLoading(false);
      }
    });
  };

  const progress = duration > 0 ? currentTime / duration : 0;
  const bufferPct = duration > 0 ? buffered / duration : 0;

  /* ---- Render: poster-only fallback (no playbackId) -------------- */

  if (!playbackId) {
    return <PosterFallback {...{ posterUrl, title, episodeNumber, durationS }} />;
  }

  /* ---- Render: real video player --------------------------------- */

  return (
    <div>
      {/* Player container -- full-screen vertical */}
      <div
        className="relative overflow-hidden select-none"
        style={{ width: "100%", height: "100dvh", background: "#07070E" }}
        onClick={handleTap}
      >
        {/* Video element -- ALWAYS rendered, fades in once first frame composited */}
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            zIndex: 1,
            opacity: started ? 1 : 0,
            transition: "opacity 0.12s ease-out",
          }}
          playsInline
          preload="auto"
        />

        {/* VERZA logo — fades in as the controls fade out after the 10s idle timer */}
        <VideoWatermark visible={started && !showControls} top={12} left={12} size={66} />

        {/* Poster overlay — HIDDEN for the first 500ms to prevent poster flash.
            Only fades in as a slow-connection fallback. On fast connections the
            video starts before the poster is ever visible. */}
        {posterUrl && (
          <Image
            src={posterUrl}
            alt={title}
            fill
            sizes="(max-width: 440px) 100vw, 440px"
            className="object-cover"
            style={{
              filter: "brightness(0.7)",
              zIndex: 2,
              opacity: showPoster && !started ? 1 : 0,
              transition: "opacity 0.35s ease-in",
              pointerEvents: started ? "none" : "auto",
            }}
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

        {/* Big play button (before start, hidden during loading) */}
        {!started && !error && !loading && (
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

        {/* Loading spinner — shown during load regardless of started state */}
        {loading && !error && (
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
            className="absolute top-3 left-12 z-20 px-2 py-1 rounded-md transition-opacity duration-300"
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
              if (video) {
                video.muted = !video.muted;
                setMuted(video.muted);
                localStorage.setItem("verza-muted", String(video.muted));
              }
            }}
            aria-label="Toggle mute"
          >
            {muted ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <line x1="23" y1="9" x2="17" y2="15" />
                <line x1="17" y1="9" x2="23" y2="15" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              </svg>
            )}
          </button>
        )}
      </div>

      {/* ---- Unlock Popup (shows after last free episode ends) ---- */}
      {showUnlockPopup && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.8)" }}
        >
          <div
            className="rounded-2xl overflow-hidden mx-4 max-w-sm w-full"
            style={{ background: T.surface, border: `1px solid ${T.line}` }}
          >
            {/* Poster peek */}
            <div className="relative" style={{ height: 120, overflow: "hidden" }}>
              {posterUrl && (
                <Image
                  src={posterUrl}
                  alt={title}
                  fill
                  className="object-cover"
                  style={{ filter: "brightness(0.4)" }}
                />
              )}
              <div className="absolute inset-0 flex items-center justify-center">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={T.accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
            </div>

            <div className="p-5 text-center">
              <h3 className="text-lg font-bold mb-1" style={{ color: T.text }}>
                Keep Watching?
              </h3>
              <p className="text-sm mb-4" style={{ color: T.textMute }}>
                You finished the free episodes! Unlock the full series to continue.
              </p>

              {/* Unlock button */}
              <button
                onClick={async () => {
                  if (!(await requireCheckoutUser())) return;
                  setUnlockLoading(true);
                  setUnlockError(null);
                  trackUnlockClick(seriesSlug);
                  emit("checkout_started", { show_id: seriesSlug, episode_number: episodeNumber, plan_type: "series_unlock", surface: "player_unlock_popup" });
                  let navigating = false;
                  try {
                    const res = await fetch("/api/unlock", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ seriesSlug }),
                    });
                    const data = (await res.json().catch(() => ({}))) as {
                      url?: unknown;
                      error?: unknown;
                      alreadyOwned?: unknown;
                    };
                    if (!res.ok) {
                      setUnlockError(
                        data.alreadyOwned
                          ? "This series is already on your account. Reload this page to continue watching."
                          : typeof data.error === "string"
                            ? data.error
                            : "Couldn’t start checkout. Please try again.",
                      );
                      return;
                    }
                    if (typeof data.url !== "string" || !data.url) {
                      setUnlockError("Checkout did not open. Please try again.");
                      return;
                    }
                    navigating = true;
                    window.location.assign(data.url);
                  } catch {
                    setUnlockError("Network error. Check your connection and try again.");
                  } finally {
                    if (!navigating) setUnlockLoading(false);
                  }
                }}
                disabled={unlockLoading}
                className="w-full py-3.5 rounded-xl text-sm font-bold border-0 cursor-pointer mb-3 transition-transform active:scale-[0.97]"
                style={{ background: T.accent, color: "#fff", opacity: unlockLoading ? 0.7 : 1 }}
              >
                {unlockLoading ? "Loading..." : "Series Unlock — $1.99 one-time"}
              </button>

              {unlockError && (
                <p
                  className="text-xs mb-3 px-3 py-2 rounded-lg"
                  style={{
                    color: "#FCA5A5",
                    background: "rgba(239,68,68,0.12)",
                    border: "1px solid rgba(239,68,68,0.35)",
                  }}
                  role="alert"
                >
                  {unlockError}
                </p>
              )}

              {/* Replay last free episode */}
              <button
                onClick={() => {
                  setShowUnlockPopup(false);
                  const vid = videoRef.current;
                  if (vid) { vid.currentTime = 0; vid.play().catch(() => {}); }
                }}
                className="text-sm font-medium border-0 bg-transparent cursor-pointer"
                style={{ color: T.textDim }}
              >
                Replay Episode {episodeNumber}
              </button>
            </div>
          </div>
        </div>
      )}
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
