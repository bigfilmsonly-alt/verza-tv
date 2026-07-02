"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type HlsType from "hls.js";
import { trackEpisodeStart, trackEpisodeComplete, trackUnlockPrompt, trackUnlockClick } from "@/lib/track";
import { emit } from "@/lib/analytics";

/* ---- Load hls.js once ---- */
let hlsPromise: Promise<typeof HlsType | null> | null = null;
function getHls(): Promise<typeof HlsType | null> {
  if (!hlsPromise && typeof window !== "undefined") {
    hlsPromise = import("hls.js").then((m) => m.default).catch(() => null);
  }
  return hlsPromise || Promise.resolve(null);
}

/* ---- Haptic feedback ---- */
function haptic() {
  try { navigator.vibrate?.(10); } catch {}
}

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface FeedEpisode {
  number: number;
  title: string;
  durationS: number;
  playbackId?: string;
  isFree: boolean;
}

interface EpisodeFeedProps {
  seriesSlug: string;
  seriesTitle: string;
  posterUrl: string;
  episodes: FeedEpisode[];
  startEpisode: number;
  freeEpisodes: number;
  totalEpisodes: number;
  /** Horizontal left/right swipe instead of vertical (used for red carpet events) */
  horizontal?: boolean;
  /** Where the back button navigates (defaults to home) */
  backHref?: string;
}

/* ================================================================== */
/*  Single Episode Slide                                               */
/* ================================================================== */

function EpisodeSlide({
  episode,
  seriesSlug,
  posterUrl,
  isActive,
  isNear,
  muted,
  onEnded,
  onProgress,
  onDoubleTap,
}: {
  episode: FeedEpisode;
  seriesSlug: string;
  posterUrl: string;
  isActive: boolean;
  isNear: boolean;
  muted: boolean;
  onEnded: () => void;
  onProgress: (pct: number) => void;
  onDoubleTap: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<HlsType | null>(null);
  const attachedRef = useRef(false);
  const mutedRef = useRef(muted);
  const [sourceReady, setSourceReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPause, setShowPause] = useState(false);
  const pauseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTap = useRef(0);

  // Keep ref in sync with prop
  useEffect(() => { mutedRef.current = muted; }, [muted]);

  const hlsUrl = episode.playbackId
    ? `https://stream.mux.com/${episode.playbackId}.m3u8`
    : null;
  const thumbUrl = episode.playbackId
    ? `https://image.mux.com/${episode.playbackId}/thumbnail.jpg?time=0&width=720&height=1280`
    : "";

  /* Step 1: Attach HLS source (preload for near slides, don't tear down on active change) */
  useEffect(() => {
    if (!hlsUrl || (!isActive && !isNear)) return;
    if (attachedRef.current) return; // Already attached, don't re-attach

    const vid = videoRef.current;
    if (!vid) return;

    let cancelled = false;
    attachedRef.current = true;

    async function attach() {
      if (cancelled || !vid || !hlsUrl) return;

      if (vid.canPlayType("application/vnd.apple.mpegurl")) {
        vid.src = hlsUrl;
        vid.load();
        // Set sourceReady immediately — Safari will queue play() until data arrives
        if (!cancelled) setSourceReady(true);
        return;
      }

      const Hls = await getHls();
      if (cancelled || !Hls || !Hls.isSupported() || !vid) return;

      const hls = new Hls({
        maxBufferLength: 15,
        enableWorker: true,
        startLevel: -1,
        capLevelToPlayerSize: false,
        maxLoadingDelay: 2,
      });
      hlsRef.current = hls;
      hls.loadSource(hlsUrl);
      hls.attachMedia(vid);
      // Set sourceReady immediately — play() will queue until manifest parsed
      if (!cancelled) setSourceReady(true);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {});
      hls.on(Hls.Events.ERROR, (_e: string, data: { type: string; fatal: boolean }) => {
        if (data.fatal && Hls) {
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) hls.startLoad();
          else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) hls.recoverMediaError();
        }
      });
    }

    attach();

    return () => {
      cancelled = true;
      // Destroy on unmount (virtualization removes elements from DOM)
      if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
      const v = videoRef.current;
      if (v) { v.pause(); v.removeAttribute("src"); v.load(); }
      attachedRef.current = false;
      setSourceReady(false);
    };
  }, [hlsUrl, isActive, isNear]);

  /* Tear down HLS only when slide is far away (not near) */
  useEffect(() => {
    if (isActive || isNear) return;
    // Not near — clean up
    const vid = videoRef.current;
    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
    if (vid) { vid.pause(); vid.removeAttribute("src"); vid.load(); }
    attachedRef.current = false;
    setSourceReady(false);
    setPlaying(false);
    setLoading(false);
  }, [isActive, isNear]);

  /* Step 2: Play only when source is ready AND slide is active */
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;

    let cancelled = false;

    if (isActive && sourceReady) {
      // ALWAYS start muted — iOS requires this for autoplay
      vid.muted = true;
      vid.currentTime = 0;
      const playPromise = vid.play();
      if (playPromise) {
        playPromise
          .then(() => {
            if (cancelled) return;
            setPlaying(true);
            // Unmute AFTER successful play if user wants sound
            if (!mutedRef.current) vid.muted = false;
            trackEpisodeStart(seriesSlug, episode.number);
          })
          .catch(() => {
            // Play failed even muted — do nothing, poster holds
          });
      } else {
        // play() returned undefined (rare)
        setLoading(false);
      }
    } else if (!isActive) {
      vid.muted = true;
      vid.pause();
      setPlaying(false);
    }

    return () => { cancelled = true; };
  }, [isActive, sourceReady]);

  /* Step 3: Sync muted prop instantly to video element */
  useEffect(() => {
    const vid = videoRef.current;
    if (vid) vid.muted = muted;
  }, [muted]);

  /* Time update → progress bar + auto-advance on ended */
  useEffect(() => {
    if (!isActive) return;
    const vid = videoRef.current;
    if (!vid) return;

    function onTime() {
      if (vid && vid.duration && isFinite(vid.duration)) {
        onProgress(vid.currentTime / vid.duration);
      }
    }
    function onEnd() {
      trackEpisodeComplete(seriesSlug, episode.number);
      onProgress(1);
      onEnded();
    }

    vid.addEventListener("timeupdate", onTime);
    vid.addEventListener("ended", onEnd);
    return () => {
      vid.removeEventListener("timeupdate", onTime);
      vid.removeEventListener("ended", onEnd);
    };
  }, [isActive, seriesSlug, episode.number, onEnded, onProgress]);

  /* Tap handler: single tap = pause, double tap = like */
  function handleTap(e: React.MouseEvent) {
    e.stopPropagation();
    const now = Date.now();
    if (now - lastTap.current < 300) {
      // Double tap
      onDoubleTap();
      lastTap.current = 0;
      return;
    }
    lastTap.current = now;

    setTimeout(() => {
      if (lastTap.current === 0) return; // was double tap
      const vid = videoRef.current;
      if (!vid || !isActive) return;

      if (vid.paused) {
        vid.play().catch(() => {});
        setPlaying(true);
      } else {
        vid.pause();
        setPlaying(false);
      }

      // Show pause/play indicator briefly
      setShowPause(true);
      if (pauseTimer.current) clearTimeout(pauseTimer.current);
      pauseTimer.current = setTimeout(() => setShowPause(false), 800);
    }, 300);
  }

  return (
    <div
      className="relative w-full select-none overflow-hidden"
      style={{ height: "var(--feed-h, 100dvh)", background: "#000", margin: 0, padding: 0 }}
      onClick={handleTap}
    >
      {/* Mux thumbnail — cinematic scale settle on play */}
      {thumbUrl && (
        <img
          src={thumbUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            opacity: playing ? 0 : 1,
            transform: playing ? "scale(1)" : "scale(1.04)",
            transition: "opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
            willChange: "opacity, transform",
            zIndex: 1,
          }}
        />
      )}

      {/* Poster fallback */}
      {!thumbUrl && posterUrl && (
        <img
          src={posterUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            opacity: playing ? 0 : 1,
            transform: playing ? "scale(1)" : "scale(1.04)",
            transition: "opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
            willChange: "opacity, transform",
            filter: "brightness(0.5)",
            zIndex: 1,
          }}
        />
      )}

      {/* Video — fades in as poster settles */}
      <video
        ref={videoRef}
        playsInline
        muted
        preload={isNear || isActive ? "auto" : "none"}
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          opacity: playing ? 1 : 0,
          transition: "opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
          willChange: "opacity",
          zIndex: 2,
        }}
      />

      {/* No spinner — poster holds until video plays */}

      {/* Pause/Play indicator (animated) */}
      {showPause && (
        <div
          className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none"
          style={{ animation: "fadeOut 0.8s ease forwards" }}
        >
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{
              background: "rgba(0,0,0,0.4)",
              backdropFilter: "blur(16px)",
              animation: "scaleIn 0.15s ease-out",
            }}
          >
            {playing ? (
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg width="32" height="32" viewBox="0 0 24 24" fill="#fff">
                <polygon points="8 5 20 12 8 19" />
              </svg>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ================================================================== */
/*  Heart Animation (double-tap like)                                  */
/* ================================================================== */

function HeartBurst({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div
      className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none"
      style={{ animation: "heartBurst 0.8s ease forwards" }}
    >
      <svg width="80" height="80" viewBox="0 0 24 24" fill="#E0115F" stroke="none" style={{ filter: "drop-shadow(0 0 20px rgba(224,17,95,0.6))" }}>
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </div>
  );
}

/* ================================================================== */
/*  Episode Transition Toast                                           */
/* ================================================================== */

function EpisodeToast({ epNumber, show }: { epNumber: number; show: boolean }) {
  if (!show) return null;
  return (
    <div
      className="absolute top-1/2 left-1/2 z-40 pointer-events-none"
      style={{
        transform: "translate(-50%, -50%)",
        animation: "toastIn 0.6s ease forwards",
      }}
    >
      <div
        className="px-6 py-3 rounded-2xl"
        style={{
          background: "rgba(0,0,0,0.5)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <p className="text-2xl font-black tracking-wide text-center" style={{ color: "#fff" }}>
          EP {epNumber}
        </p>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  EpisodeFeed — vertical snap-scroll                                 */
/* ================================================================== */

export default function EpisodeFeed({
  seriesSlug,
  seriesTitle,
  posterUrl,
  episodes,
  startEpisode,
  freeEpisodes,
  totalEpisodes,
  horizontal = false,
  backHref = "/",
}: EpisodeFeedProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(() => {
    const idx = episodes.findIndex((e) => e.number === startEpisode);
    return idx >= 0 ? idx : 0;
  });
  const [muted, setMuted] = useState(() => {
    if (typeof window !== "undefined") return localStorage.getItem("verza-muted") !== "false";
    return true;
  });
  const [showUnlock, setShowUnlock] = useState(false);
  const [unlockLoading, setUnlockLoading] = useState(false);
  const [epProgress, setEpProgress] = useState(0);
  const [showToast, setShowToast] = useState(false);
  const [showHeart, setShowHeart] = useState(false);
  const [liked, setLiked] = useState<Set<number>>(new Set());
  const [showMore, setShowMore] = useState(false);
  const [actionToast, setActionToast] = useState<string | null>(null);
  // Right-side action rail (Like/Share/More) shows for 10s on each new video,
  // then fades out to keep the frame clean. Any tap brings it back for 10s more.
  const [showActionRail, setShowActionRail] = useState(true);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heartTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const actionToastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const actionRailTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const revealActionRail = useCallback(() => {
    setShowActionRail(true);
    if (actionRailTimer.current) clearTimeout(actionRailTimer.current);
    actionRailTimer.current = setTimeout(() => setShowActionRail(false), 10000);
  }, []);

  // Show the rail for 10s whenever the active video changes (and on mount).
  useEffect(() => {
    revealActionRail();
    return () => {
      if (actionRailTimer.current) clearTimeout(actionRailTimer.current);
    };
  }, [activeIndex, revealActionRail]);
  const activeIndexRef = useRef(activeIndex);
  activeIndexRef.current = activeIndex;

  /* Track whether we arrived here via in-app navigation so Back returns to
     the exact page the user was last looking at (not a hardcoded home). */
  const canGoBackRef = useRef(false);
  useEffect(() => {
    canGoBackRef.current =
      window.history.length > 1 &&
      (document.referrer === "" ||
        document.referrer.startsWith(window.location.origin));
  }, []);

  const handleBack = useCallback(() => {
    // Pause any playing video first to avoid audio bleeding into the next view
    const vids = document.querySelectorAll("video");
    vids.forEach((v) => { v.muted = true; v.pause(); });
    if (canGoBackRef.current) router.back();
    else router.push(backHref);
  }, [router, backHref]);

  const activeEp = episodes[activeIndex];

  // Virtual window: only render 5 slides max (active ± 2)
  const WINDOW = 2;
  const windowStart = Math.max(0, activeIndex - WINDOW);
  const windowEnd = Math.min(episodes.length - 1, activeIndex + WINDOW);

  /* Scroll to start episode on mount */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const startIdx = episodes.findIndex((e) => e.number === startEpisode);
    if (startIdx > 0) {
      const target = container.children[startIdx] as HTMLElement;
      if (target) target.scrollIntoView({ behavior: "instant" as ScrollBehavior });
    }
  }, []);

  /* Auto-advance: pause current, then scroll to next */
  const handleEpisodeEnded = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    // Pause the current video immediately to prevent audio overlap
    const currentSlide = container.children[activeIndexRef.current];
    const currentVid = currentSlide?.querySelector("video");
    if (currentVid) { currentVid.muted = true; currentVid.pause(); }
    const nextIdx = activeIndexRef.current + 1;
    if (nextIdx < episodes.length) {
      const target = container.children[nextIdx] as HTMLElement;
      if (target) target.scrollIntoView({ behavior: "smooth" });
    }
  }, [episodes.length]);

  /* IntersectionObserver for snap detection */
  const observerCallback = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const idx = Number(entry.target.getAttribute("data-index"));
          if (!Number.isNaN(idx)) {
            setActiveIndex((prev) => {
              if (prev !== idx) {
                // Episode changed
                haptic();
                setEpProgress(0);

                // Show toast
                setShowToast(true);
                if (toastTimer.current) clearTimeout(toastTimer.current);
                toastTimer.current = setTimeout(() => setShowToast(false), 1200);
              }
              return idx;
            });

            const ep = episodes[idx];
            window.history.replaceState(null, "", `/series/${seriesSlug}/${ep.number}`);

            if (!ep.isFree) {
              trackUnlockPrompt(seriesSlug);
              emit("paywall_viewed", { show_id: seriesSlug, episode_number: ep.number, plan_type: "series_unlock", surface: "episode_feed" });
              setShowUnlock(true);
            } else {
              setShowUnlock(false);
            }
          }
        }
      }
    },
    [episodes, seriesSlug],
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container || episodes.length === 0) return;
    const observer = new IntersectionObserver(observerCallback, {
      root: container,
      threshold: 0.6,
    });
    container.querySelectorAll("[data-index]").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [episodes, observerCallback, windowStart, windowEnd]);

  function toggleMute() {
    const next = !muted;
    setMuted(next);
    localStorage.setItem("verza-muted", String(next));
    haptic();
  }

  /* ---- Likes (persisted per series in localStorage) ---- */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(`verza-liked-${seriesSlug}`);
      if (raw) setLiked(new Set(JSON.parse(raw) as number[]));
    } catch {}
  }, [seriesSlug]);

  const persistLiked = useCallback(
    (next: Set<number>) => {
      try {
        localStorage.setItem(`verza-liked-${seriesSlug}`, JSON.stringify([...next]));
      } catch {}
    },
    [seriesSlug],
  );

  const isLiked = activeEp ? liked.has(activeEp.number) : false;

  function flashHeart() {
    setShowHeart(true);
    if (heartTimer.current) clearTimeout(heartTimer.current);
    heartTimer.current = setTimeout(() => setShowHeart(false), 800);
  }

  function toggleLike() {
    const n = activeEp?.number;
    if (n == null) return;
    setLiked((prev) => {
      const next = new Set(prev);
      if (next.has(n)) {
        next.delete(n);
      } else {
        next.add(n);
        flashHeart();
      }
      persistLiked(next);
      return next;
    });
    haptic();
  }

  function handleDoubleTap() {
    const n = activeEp?.number;
    if (n != null) {
      setLiked((prev) => {
        if (prev.has(n)) return prev;
        const next = new Set(prev);
        next.add(n);
        persistLiked(next);
        return next;
      });
    }
    flashHeart();
    haptic();
  }

  function popActionToast(msg: string) {
    setActionToast(msg);
    if (actionToastTimer.current) clearTimeout(actionToastTimer.current);
    actionToastTimer.current = setTimeout(() => setActionToast(null), 1800);
  }

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/series/${seriesSlug}/${activeEp?.number ?? 1}`
      : `https://www.verzatv.com/series/${seriesSlug}/${activeEp?.number ?? 1}`;
  const shareText = `Watch ${seriesTitle} — EP ${activeEp?.number ?? 1} on Verza TV`;

  async function shareEpisode() {
    haptic();
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: seriesTitle, text: shareText, url: shareUrl });
        return;
      }
    } catch {
      return; // user cancelled the native sheet
    }
    setShowMore(true);
  }

  async function copyShareLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      popActionToast("Link copied");
    } catch {
      popActionToast(shareUrl);
    }
    setShowMore(false);
  }

  return (
    <div className="episode-immersive" style={{ background: "#000", overflow: "hidden" }}>
      {/* Snap-scroll container — vertical by default, horizontal for red carpet */}
      <div
        ref={containerRef}
        className="no-scrollbar"
        style={
          horizontal
            ? {
                display: "flex",
                flexDirection: "row",
                width: "100%",
                height: "var(--feed-h, 100dvh)",
                overflowX: "auto",
                overflowY: "hidden",
                scrollSnapType: "x mandatory",
                scrollbarWidth: "none",
              }
            : {
                width: "100%",
                height: "var(--feed-h, 100dvh)",
                overflowY: "auto",
                overflowX: "hidden",
                scrollSnapType: "y mandatory",
                scrollbarWidth: "none",
              }
        }
      >
        {/* Leading spacer for episodes before the window */}
        {windowStart > 0 && (
          <div
            style={
              horizontal
                ? { width: `calc(100% * ${windowStart})`, flexShrink: 0 }
                : { height: `calc(var(--feed-h, 100dvh) * ${windowStart})`, flexShrink: 0 }
            }
          />
        )}

        {/* Only render visible window (max 5 slides) */}
        {episodes.slice(windowStart, windowEnd + 1).map((ep, wi) => {
          const i = windowStart + wi;
          return (
            <div
              key={ep.number}
              data-index={i}
              style={
                horizontal
                  ? {
                      flex: "0 0 100%",
                      width: "100%",
                      height: "var(--feed-h, 100dvh)",
                      scrollSnapAlign: "start",
                      scrollSnapStop: "always",
                    }
                  : {
                      width: "100%",
                      height: "var(--feed-h, 100dvh)",
                      scrollSnapAlign: "start",
                      scrollSnapStop: "always",
                    }
              }
            >
              <EpisodeSlide
                episode={ep}
                seriesSlug={seriesSlug}
                posterUrl={posterUrl}
                isActive={i === activeIndex}
                isNear={Math.abs(i - activeIndex) <= 1}
                muted={muted}
                onEnded={handleEpisodeEnded}
                onProgress={i === activeIndex ? setEpProgress : () => {}}
                onDoubleTap={handleDoubleTap}
              />
            </div>
          );
        })}

        {/* Trailing spacer for episodes after the window */}
        {windowEnd < episodes.length - 1 && (
          <div
            style={
              horizontal
                ? { width: `calc(100% * ${episodes.length - 1 - windowEnd})`, flexShrink: 0 }
                : { height: `calc(var(--feed-h, 100dvh) * ${episodes.length - 1 - windowEnd})`, flexShrink: 0 }
            }
          />
        )}
      </div>

      {/* ---- Overlays ---- */}

      {/* Episode transition toast */}
      <EpisodeToast epNumber={activeEp?.number ?? 1} show={showToast} />

      {/* Double-tap heart */}
      <HeartBurst show={showHeart} />

      {/* Back button — top-left */}
      <button
        onClick={handleBack}
        className="absolute top-4 left-4 z-50 w-10 h-10 rounded-full flex items-center justify-center border-0 cursor-pointer"
        style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(20px)" }}
        aria-label="Back"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      {/* Mute button — top-right */}
      <button
        onClick={toggleMute}
        className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full flex items-center justify-center border-0 cursor-pointer"
        style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(20px)" }}
        aria-label={muted ? "Unmute" : "Mute"}
      >
        {muted ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          </svg>
        )}
      </button>

      {/* Fullscreen button — below mute */}
      <button
        onClick={() => {
          // Find the active video element and request fullscreen
          const vids = document.querySelectorAll("video");
          for (const v of vids) {
            if (!v.paused) {
              if (v.requestFullscreen) v.requestFullscreen();
              else if ((v as any).webkitEnterFullscreen) (v as any).webkitEnterFullscreen();
              break;
            }
          }
        }}
        className="absolute top-16 right-4 z-50 w-10 h-10 rounded-full flex items-center justify-center border-0 cursor-pointer"
        style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(20px)" }}
        aria-label="Fullscreen"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 3H5a2 2 0 0 0-2 2v3" /><path d="M21 8V5a2 2 0 0 0-2-2h-3" /><path d="M3 16v3a2 2 0 0 0 2 2h3" /><path d="M16 21h3a2 2 0 0 0 2-2v-3" />
        </svg>
      </button>

      {/* Social action rail — right side. Auto-hides after 10s; taps re-reveal. */}
      <div
        className="absolute right-3 z-50 flex flex-col items-center gap-5"
        style={{
          top: "50%",
          transform: "translateY(-50%)",
          opacity: showActionRail ? 1 : 0,
          pointerEvents: showActionRail ? "auto" : "none",
          transition: "opacity 0.4s ease",
        }}
      >
        {/* Like */}
        <button
          onClick={() => { revealActionRail(); toggleLike(); }}
          aria-label={isLiked ? "Unlike" : "Like"}
          className="flex flex-col items-center gap-1 border-0 bg-transparent cursor-pointer p-0"
        >
          <span
            className="w-11 h-11 rounded-full flex items-center justify-center transition-transform active:scale-90"
            style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(20px)" }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill={isLiked ? "#E0115F" : "none"} stroke={isLiked ? "#E0115F" : "#fff"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </span>
          <span className="text-[10px] font-semibold" style={{ color: "#fff", textShadow: "0 1px 3px rgba(0,0,0,0.6)" }}>
            {isLiked ? "Liked" : "Like"}
          </span>
        </button>

        {/* Share */}
        <button
          onClick={() => { revealActionRail(); shareEpisode(); }}
          aria-label="Share"
          className="flex flex-col items-center gap-1 border-0 bg-transparent cursor-pointer p-0"
        >
          <span
            className="w-11 h-11 rounded-full flex items-center justify-center transition-transform active:scale-90"
            style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(20px)" }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
          </span>
          <span className="text-[10px] font-semibold" style={{ color: "#fff", textShadow: "0 1px 3px rgba(0,0,0,0.6)" }}>
            Share
          </span>
        </button>

        {/* More */}
        <button
          onClick={() => { revealActionRail(); setShowMore(true); haptic(); }}
          aria-label="More options"
          className="flex flex-col items-center gap-1 border-0 bg-transparent cursor-pointer p-0"
        >
          <span
            className="w-11 h-11 rounded-full flex items-center justify-center transition-transform active:scale-90"
            style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(20px)" }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff" stroke="none">
              <circle cx="12" cy="5" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="12" cy="19" r="1.6" />
            </svg>
          </span>
          <span className="text-[10px] font-semibold" style={{ color: "#fff", textShadow: "0 1px 3px rgba(0,0,0,0.6)" }}>
            More
          </span>
        </button>
      </div>

      {/* Action toast (e.g. Link copied) */}
      {actionToast && (
        <div
          className="absolute left-1/2 z-[80] -translate-x-1/2 px-4 py-2 rounded-full"
          style={{ bottom: 96, background: "rgba(0,0,0,0.72)", backdropFilter: "blur(10px)", animation: "fadeIn 0.2s ease" }}
        >
          <span className="text-xs font-semibold" style={{ color: "#fff" }}>{actionToast}</span>
        </div>
      )}

      {/* More / share sheet */}
      {showMore && (
        <div
          className="absolute inset-0 z-[70] flex items-end"
          onClick={() => setShowMore(false)}
          style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)", animation: "fadeIn 0.2s ease" }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full px-5 pt-3 pb-8"
            style={{ background: "#12121C", borderTopLeftRadius: 22, borderTopRightRadius: 22, animation: "scaleIn 0.25s ease" }}
          >
            <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: "rgba(255,255,255,0.2)" }} />
            <p className="text-sm font-bold" style={{ color: "#F5F4F8" }}>Share this episode</p>
            <p className="text-xs mb-4" style={{ color: "rgba(255,255,255,0.45)" }}>
              {seriesTitle} · EP {activeEp?.number}
            </p>
            <div className="grid grid-cols-4 gap-2 mb-1">
              <a
                href={`sms:?&body=${encodeURIComponent(`${shareText} ${shareUrl}`)}`}
                onClick={() => setShowMore(false)}
                className="flex flex-col items-center gap-1.5 no-underline py-2"
              >
                <span className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "rgba(46,204,113,0.16)" }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2ECC71" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>
                </span>
                <span className="text-[10px] font-medium" style={{ color: "#F5F4F8" }}>Messages</span>
              </a>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShowMore(false)}
                className="flex flex-col items-center gap-1.5 no-underline py-2"
              >
                <span className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "rgba(37,211,102,0.16)" }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="#25D366" stroke="none"><path d="M17.5 14.4c-.3-.1-1.8-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.7 1-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.5-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5-.1-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5 4.5.7.3 1.2.5 1.7.6.7.2 1.3.2 1.8.1.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.2-.3-.2-.6-.3zM12 2a10 10 0 0 0-8.6 15l-1.3 4.7L7 20.4A10 10 0 1 0 12 2z" /></svg>
                </span>
                <span className="text-[10px] font-medium" style={{ color: "#F5F4F8" }}>WhatsApp</span>
              </a>
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShowMore(false)}
                className="flex flex-col items-center gap-1.5 no-underline py-2"
              >
                <span className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.08)" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff" stroke="none"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                </span>
                <span className="text-[10px] font-medium" style={{ color: "#F5F4F8" }}>X</span>
              </a>
              <button
                onClick={copyShareLink}
                className="flex flex-col items-center gap-1.5 border-0 bg-transparent cursor-pointer py-2"
              >
                <span className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "rgba(139,92,246,0.18)" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
                </span>
                <span className="text-[10px] font-medium" style={{ color: "#F5F4F8" }}>Copy link</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Episode badge — bottom-left */}
      <div className="absolute bottom-6 left-4 z-50 pointer-events-none">
        <div style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(12px)", borderRadius: 12, padding: "6px 10px" }}>
          <p className="text-[10px] font-medium mb-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
            {seriesTitle}
          </p>
          <p className="text-[13px] font-bold" style={{ color: "rgba(255,255,255,0.85)" }}>
            EP {activeEp?.number} <span style={{ color: "rgba(255,255,255,0.3)", fontWeight: 400 }}>/ {totalEpisodes}</span>
          </p>
        </div>
      </div>

      {/* Live playback progress bar — very bottom */}
      <div
        className="absolute bottom-0 left-0 right-0 z-50 pointer-events-none"
        style={{ height: 4 }}
      >
        <div
          style={{
            height: "100%",
            width: `${epProgress * 100}%`,
            background: "linear-gradient(90deg, #E0115F, #8B5CF6)",
            transition: "width 0.25s linear",
            borderRadius: "0 2px 2px 0",
            boxShadow: "0 0 8px rgba(224,17,95,0.3)",
          }}
        />
      </div>

      {/* ---- Unlock overlay ---- */}
      {showUnlock && (
        <div
          className="absolute inset-0 z-[60] flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(12px)", animation: "fadeIn 0.3s ease" }}
        >
          <div className="text-center px-8 max-w-xs" style={{ animation: "scaleIn 0.3s ease" }}>
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
              style={{ background: "rgba(224,17,95,0.12)" }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#E0115F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2" style={{ color: "#fff" }}>Keep Watching</h3>
            <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.45)" }}>
              Unlock all episodes of {seriesTitle}
            </p>
            <button
              onClick={async () => {
                setUnlockLoading(true);
                trackUnlockClick(seriesSlug);
                emit("checkout_started", { show_id: seriesSlug, plan_type: "series_unlock", surface: "episode_feed" });
                try {
                  const res = await fetch("/api/unlock", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ seriesSlug }),
                  });
                  const data = await res.json();
                  if (data.url) window.location.href = data.url;
                } catch {
                  setUnlockLoading(false);
                }
              }}
              disabled={unlockLoading}
              className="glow-pulse w-full py-4 rounded-2xl text-base font-bold border-0 cursor-pointer transition-transform active:scale-[0.97]"
              style={{
                background: "linear-gradient(135deg, #E0115F, #8B5CF6)",
                color: "#fff",
                opacity: unlockLoading ? 0.7 : 1,
                boxShadow: "0 0 40px rgba(224,17,95,0.3)",
              }}
            >
              {unlockLoading ? "Loading..." : "Unlock Full Series — $1.99"}
            </button>
            <button
              onClick={handleBack}
              className="mt-4 text-sm font-medium border-0 bg-transparent cursor-pointer"
              style={{ color: "rgba(255,255,255,0.35)" }}
            >
              Go Back
            </button>
          </div>
        </div>
      )}

      {/* Animations */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeOut { 0% { opacity: 1; } 100% { opacity: 0; } }
        @keyframes scaleIn { 0% { transform: scale(0.8); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
        @keyframes heartBurst {
          0% { transform: scale(0.3); opacity: 0; }
          30% { transform: scale(1.2); opacity: 1; }
          60% { transform: scale(0.95); opacity: 1; }
          100% { transform: scale(1); opacity: 0; }
        }
        @keyframes toastIn {
          0% { transform: translate(-50%, -50%) scale(0.7); opacity: 0; }
          20% { transform: translate(-50%, -50%) scale(1.05); opacity: 1; }
          40% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(1); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
