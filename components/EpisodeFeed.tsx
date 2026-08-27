"use client";

import { useRef, useState, useEffect, useLayoutEffect, useCallback } from "react";
import Image from "next/image";
import type HlsType from "hls.js";
import { adoptInstantPlayer } from "@/lib/instant-player";
import { isIOSApp } from "@/lib/platform";
import { trackEpisodeStart, trackEpisodeComplete, trackUnlockPrompt, trackUnlockClick } from "@/lib/track";
import { emit } from "@/lib/analytics";
import { requireCheckoutUser } from "@/lib/checkout-auth";
import VideoWatermark from "@/components/VideoWatermark";
import {
  PlaybackAccessError,
  getAuthorizedPlayback,
  invalidateAuthorizedPlayback,
  subscribeAuthorizedPlaybackInvalidation,
  type AuthorizedPlaybackSource,
} from "@/lib/playback-client";
import {
  saveLastWatching,
  notifyResume,
  clearResumeNotification,
  maybeRequestResumePermission,
  type ResumeItem,
} from "@/lib/resume";

/* ---- Load hls.js once, EAGERLY ---- */
let hlsPromise: Promise<typeof HlsType | null> | null = null;
function getHls(): Promise<typeof HlsType | null> {
  if (!hlsPromise && typeof window !== "undefined") {
    hlsPromise = import("hls.js").then((m) => m.default).catch(() => { hlsPromise = null; return null; });
  }
  return hlsPromise || Promise.resolve(null);
}
// Start downloading hls.js right after this module loads — by the time the
// first video needs it, the library is already cached. Deferred via
// setTimeout: a dynamic import() fired DURING module evaluation can deadlock
// the bundler's chunk loader (the promise never settles), which leaves every
// video waiting on hls.js forever.
if (typeof window !== "undefined") setTimeout(() => { void getHls(); }, 0);

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
  /** Present only for catalog-free episodes; never expose a paid public ID. */
  playbackId?: string;
  /** Paid catalog episode: source must come from authenticated /api/playback. */
  requiresAuthorization: boolean;
  isFree: boolean;
}

interface EpisodeFeedProps {
  seriesSlug: string;
  seriesTitle: string;
  posterUrl: string;
  episodes: FeedEpisode[];
  startEpisode: number;
  /** Seconds to resume the STARTING episode at (Continue Watching). */
  startPositionS?: number;
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
  resumePositionS,
  isResumeTarget,
  onEnded,
  onProgress,
  onPosition,
  onDoubleTap,
  onReveal,
  onFirstPlayGesture,
  widescreen = false,
  transitionPoster,
  blocked = false,
  onAccessDenied,
}: {
  episode: FeedEpisode;
  seriesSlug: string;
  posterUrl: string;
  isActive: boolean;
  isNear: boolean;
  muted: boolean;
  /** Seconds to seek to on the starting episode's first activation (resume). */
  resumePositionS: number;
  /** True only for the episode that is the Continue Watching resume target. */
  isResumeTarget: boolean;
  onEnded: () => void;
  onProgress: (pct: number) => void;
  /** Report the active video's current time (seconds) up to the parent. */
  onPosition: (positionS: number) => void;
  onDoubleTap: () => void;
  onReveal: () => void;
  /** Fired once on a genuine play tap so we can ask for notification permission. */
  onFirstPlayGesture: () => void;
  /** True for 16:9 landscape content — uses object-contain instead of cover. */
  widescreen?: boolean;
  /** Exact (already-cached) poster URL the user tapped on the browse page —
      painted instantly for a seamless poster → video transition. */
  transitionPoster?: string;
  /** True when this episode is behind the paywall for this viewer — the
      video is held paused so paid content never plays under the overlay. */
  blocked?: boolean;
  /** A cached token can outlive an entitlement. A 401/402 refresh re-locks UI. */
  onAccessDenied: () => void;
}) {
  const videoBoxRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<HlsType | null>(null);
  const attachedRef = useRef(false);
  const mutedRef = useRef(muted);
  const [sourceReady, setSourceReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  // True once playback has begun; stays true through pauses so the paused frame
  // remains visible (no black poster flash on pause). Reset only on teardown.
  const [started, setStarted] = useState(false);
  const [, setLoading] = useState(false);
  const [showPause, setShowPause] = useState(false);
  const pauseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTap = useRef(0);
  const lastSavedRef = useRef(0);
  const resumeSeekedRef = useRef(false);
  // Playback self-healing: bounded recovery for fatal hls errors + a stall
  // watchdog. A video must never sit paused/black forever with no way out.
  const mediaRecoveriesRef = useRef(0);
  const audioSwappedRef = useRef(false);
  const reattachCountRef = useRef(0);
  const [attachNonce, setAttachNonce] = useState(0);
  const [authorizedSource, setAuthorizedSource] =
    useState<AuthorizedPlaybackSource | null>(null);
  const [sourceRequestNonce, setSourceRequestNonce] = useState(0);
  const forceSourceRefreshRef = useRef(false);
  const sourceRefreshInFlightRef = useRef(false);
  const protectedRefreshCountRef = useRef(0);
  const refreshResumePositionRef = useRef(0);

  // Keep refs in sync with props
  useEffect(() => { mutedRef.current = muted; }, [muted]);
  const isActiveRef = useRef(isActive);
  useEffect(() => { isActiveRef.current = isActive; }, [isActive]);
  const blockedRef = useRef(blocked);
  useEffect(() => { blockedRef.current = blocked; }, [blocked]);

  // The poster is visible from the very first paint and stays until the first
  // real video frame is composited, then crossfades out. No timers, no delayed
  // reveals — a stable placeholder makes a black flash or poster flash
  // impossible by construction, on any connection speed.

  const directFreeUrl =
    !episode.requiresAuthorization && episode.playbackId
      ? `https://stream.mux.com/${episode.playbackId}.m3u8`
      : null;
  const hlsUrl = blocked
    ? null
    : episode.requiresAuthorization
      ? (authorizedSource?.url ?? null)
      : directFreeUrl;

  /* Resolve paid sources only for the same active ±1 window that may attach a
     player. This preserves the five-slide render window and ≤3 decoder/source
     behavior while moving authorization to the server. Requests are deduped
     and expiry-aware in playback-client.ts. */
  useEffect(() => {
    if (!episode.requiresAuthorization) return;
    if (blocked) {
      queueMicrotask(() => setAuthorizedSource(null));
      invalidateAuthorizedPlayback(seriesSlug, episode.number);
      return;
    }
    if (!isActive && !isNear) return;

    let cancelled = false;
    const forceRefresh = forceSourceRefreshRef.current;
    forceSourceRefreshRef.current = false;
    getAuthorizedPlayback(seriesSlug, episode.number, { forceRefresh })
      .then((source) => {
        if (cancelled) return;
        setAuthorizedSource(source);
        sourceRefreshInFlightRef.current = false;
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        sourceRefreshInFlightRef.current = false;
        setAuthorizedSource(null);
        if (
          error instanceof PlaybackAccessError &&
          (error.status === 401 || error.status === 402)
        ) {
          onAccessDenied();
        }
      });
    return () => {
      cancelled = true;
    };
  }, [
    episode.requiresAuthorization,
    episode.number,
    seriesSlug,
    blocked,
    isActive,
    isNear,
    sourceRequestNonce,
    onAccessDenied,
  ]);

  const refreshProtectedSource = useCallback(() => {
    if (
      !episode.requiresAuthorization ||
      blockedRef.current ||
      sourceRefreshInFlightRef.current ||
      protectedRefreshCountRef.current >= 2
    ) {
      return false;
    }
    protectedRefreshCountRef.current += 1;
    sourceRefreshInFlightRef.current = true;
    const video = videoRef.current;
    if (video && Number.isFinite(video.currentTime)) {
      refreshResumePositionRef.current = Math.max(0, video.currentTime);
    }
    setAuthorizedSource(null);
    invalidateAuthorizedPlayback(seriesSlug, episode.number);
    forceSourceRefreshRef.current = true;
    setSourceRequestNonce((value) => value + 1);
    return true;
  }, [episode.requiresAuthorization, episode.number, seriesSlug]);

  // An auth transition invalidates more than the in-memory cache. Remove the
  // signed capability from hls.js/the media element immediately so an
  // in-flight response or previously attached URL cannot survive an account
  // switch in this browser tab.
  useEffect(() => {
    if (!episode.requiresAuthorization) return;
    return subscribeAuthorizedPlaybackInvalidation(() => {
      forceSourceRefreshRef.current = false;
      sourceRefreshInFlightRef.current = false;
      protectedRefreshCountRef.current = 0;
      refreshResumePositionRef.current = 0;
      if (hlsRef.current) {
        try { hlsRef.current.destroy(); } catch {}
        hlsRef.current = null;
      }
      const video = videoRef.current;
      if (video) {
        try {
          video.muted = true;
          video.pause();
          video.removeAttribute("src");
          video.load();
        } catch {}
      }
      attachedRef.current = false;
      setAuthorizedSource(null);
      setSourceReady(false);
      setPlaying(false);
      setStarted(false);
      setSourceRequestNonce((value) => value + 1);
    });
  }, [episode.requiresAuthorization]);

  /* Create — or ADOPT — the video element before the browser's first paint.
     The browse page starts a hidden muted player the instant a poster is
     clicked (lib/instant-player); by the time this page mounts, that video
     usually already has decoded frames. Adopting it here (inside
     useLayoutEffect, i.e. pre-paint) means the very first painted frame of
     this page is the MOVIE — the poster never appears at all. On cold
     navigations (direct URL, slow network) we create a fresh element and the
     poster covers the gap exactly as before. */
  const unplaceRef = useRef<(() => void) | null>(null);
  const didAdoptRef = useRef(false);

  useLayoutEffect(() => {
    const box = videoBoxRef.current;
    if (!box || videoRef.current) return;

    const adopted = isActive ? adoptInstantPlayer(episode.playbackId) : null;

    if (adopted) {
      /* CRITICAL: an MSE-attached <video> must NEVER be reparented — moving
         it in the DOM detaches its MediaSource and playback dies at
         readyState 0. The pre-started element therefore STAYS a direct child
         of <body> and is pinned over this slide's box as a fixed overlay,
         tracking it through feed scroll and window resize. */
      const vid = adopted.video;
      vid.dataset.verzaFixed = "1";
      vid.muted = true;
      // The feed root (.episode-immersive) is an OPAQUE z-50 layer that would
      // paint a black wall over this body-level z-10 video. Make the root and
      // this slide transparent so the movie shows through, while everything
      // inside the feed (posters, chrome, paywall) still paints above it.
      const feedRoot = box.closest(".episode-immersive") as HTMLElement | null;
      if (feedRoot) feedRoot.style.background = "transparent";
      didAdoptRef.current = true;
      const slideEl = box.parentElement as HTMLElement | null;
      if (slideEl) slideEl.style.background = "transparent";
      const host = box.closest(".device-frame") as HTMLElement | null;
      const radius = host ? getComputedStyle(host).borderRadius : "";
      vid.style.cssText =
        `position:fixed;z-index:10;pointer-events:none;` +
        `object-fit:${widescreen ? "contain" : "cover"};background:#000;` +
        `opacity:0;transition:opacity 0.35s cubic-bezier(0.22, 1, 0.36, 1);` +
        (radius ? `border-radius:${radius};` : "");
      const place = () => {
        const r = box.getBoundingClientRect();
        vid.style.left = `${r.left}px`;
        vid.style.top = `${r.top}px`;
        vid.style.width = `${r.width}px`;
        vid.style.height = `${r.height}px`;
      };
      place();
      const scroller = box.closest(".no-scrollbar");
      scroller?.addEventListener("scroll", place, { passive: true });
      window.addEventListener("resize", place);
      unplaceRef.current = () => {
        scroller?.removeEventListener("scroll", place);
        window.removeEventListener("resize", place);
      };

      videoRef.current = vid;
      hlsRef.current = adopted.hls;
      attachedRef.current = true;
      // The instant player only had minimal error handling — give the adopted
      // instance the same bounded fatal-error recovery as fresh attaches.
      if (adopted.hls) {
        const AdoptedHls = adopted.hls.constructor as typeof HlsType;
        const ahls = adopted.hls;
        ahls.on(AdoptedHls.Events.ERROR, (_e: string, data: { type: string; fatal: boolean }) => {
          if (!data.fatal) return;
          const resume = () => {
            const v = videoRef.current;
            if (v && isActiveRef.current && !blockedRef.current) v.play().catch(() => {});
          };
          if (data.type === AdoptedHls.ErrorTypes.NETWORK_ERROR) {
            ahls.startLoad();
            resume();
          } else if (data.type === AdoptedHls.ErrorTypes.MEDIA_ERROR && mediaRecoveriesRef.current < 2) {
            mediaRecoveriesRef.current += 1;
            ahls.recoverMediaError();
            resume();
          } else {
            fullReattach();
          }
        });
      }
      const frameAlreadyReady = vid.readyState >= 2;
      queueMicrotask(() => {
        setSourceReady(true);
        setPlaying(!vid.paused);
        if (frameAlreadyReady) setStarted(true);
      });
      // A frame is already decoded → reveal the movie in this same pre-paint
      // pass (the poster never appears). Otherwise reveal on first frame.
      if (!frameAlreadyReady) onFirstFrame(vid, () => setStarted(true));
    } else {
      const vid = document.createElement("video");
      vid.muted = true;
      vid.playsInline = true;
      vid.setAttribute("playsinline", "");
      vid.preload = "auto";
      vid.className = `absolute inset-0 w-full h-full ${widescreen ? "object-contain" : "object-cover"}`;
      vid.style.cssText = "opacity:0;transition:opacity 0.35s cubic-bezier(0.22, 1, 0.36, 1);z-index:2;";
      box.appendChild(vid);
      videoRef.current = vid;
    }

    return () => {
      // Unmount teardown. Covers the adopted player too — the attach effect
      // early-returns for adopted slides, so its cleanup never registers.
      // Only the slide that ADOPTED restores the shared feed background —
      // any slide doing it re-blacked the feed on every window shift.
      if (didAdoptRef.current) {
        const feedRootEl = document.querySelector(".episode-immersive") as HTMLElement | null;
        if (feedRootEl && feedRootEl.style.background === "transparent") feedRootEl.style.background = "";
      }
      unplaceRef.current?.();
      unplaceRef.current = null;
      if (hlsRef.current) { try { hlsRef.current.destroy(); } catch {} hlsRef.current = null; }
      const v = videoRef.current;
      if (v) { try { v.muted = true; v.pause(); v.remove(); } catch {} }
      videoRef.current = null;
      attachedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Keep the video's opacity in lock-step with `started` BEFORE paint so
     there is never a frame where both video and poster are hidden. */
  useLayoutEffect(() => {
    const vid = videoRef.current;
    if (vid) vid.style.opacity = started ? "1" : "0";
  }, [started]);

  /* preload hint follows proximity (was a JSX attribute before adoption). */
  useEffect(() => {
    const vid = videoRef.current;
    if (vid) vid.preload = isActive || isNear ? "auto" : "none";
  }, [isActive, isNear]);

  // Wait for the video compositor to actually paint a frame before revealing.
  // This prevents the black flash that happens when play() resolves but the
  // decoder hasn't presented a frame to the screen yet.
  function onFirstFrame(vid: HTMLVideoElement, cb: () => void) {
    if ("requestVideoFrameCallback" in vid) {
      vid.requestVideoFrameCallback(() => cb());
    } else {
      // Fallback: double-RAF ensures at least one compositor paint cycle
      requestAnimationFrame(() => requestAnimationFrame(() => cb()));
    }
  }

  // Fire play() on a video element — shared by attach + activation paths.
  const tryPlay = useCallback((vid: HTMLVideoElement) => {
    vid.muted = true; // iOS requires muted for autoplay
    // A token refresh reuses the same video element/source slot and restores
    // the exact playhead. It never creates an extra player or restarts a paid
    // episode from zero after an authenticated retry.
    const refreshResume = refreshResumePositionRef.current;
    const dur = vid.duration;
    const durKnown = isFinite(dur) && dur > 0;
    if (refreshResume > 0 && (!durKnown || refreshResume < dur)) {
      refreshResumePositionRef.current = 0;
      try { vid.currentTime = refreshResume; } catch {}
    } else if (
      isResumeTarget &&
      !resumeSeekedRef.current &&
      resumePositionS > 2 &&
      (!durKnown || resumePositionS < dur)
    ) {
      resumeSeekedRef.current = true;
      try { vid.currentTime = resumePositionS; } catch { vid.currentTime = 0; }
    } else if (vid.currentTime > 0.5) {
      vid.currentTime = 0;
    }
    const p = vid.play();
    if (p) {
      p.then(() => {
        setPlaying(true);
        // Don't set started yet — wait for the first actual frame to be
        // composited so the poster stays visible until real pixels are ready.
        onFirstFrame(vid, () => {
          setStarted(true);
          if (!mutedRef.current) {
            vid.muted = false;
            // iOS pauses a muted-autoplayed video when unmuted outside a user
            // gesture — if that happened, fall back to muted playback instead
            // of freezing on a paused frame.
            if (vid.paused) {
              vid.muted = true;
              vid.play().catch(() => {});
            }
          }
        });
        trackEpisodeStart(seriesSlug, episode.number);
      }).catch(() => {});
    }
  }, [isResumeTarget, resumePositionS, seriesSlug, episode.number]);

  /* Last-resort recovery: tear the player down completely and re-attach.
     Bounded (2 per slide) so a truly broken stream can't loop forever. */
  const fullReattach = useCallback(() => {
    // Never rebuild a paywalled episode's player — the user can't watch it yet,
    // and a looping reattach behind the unlock overlay reads as a "blink".
    if (blockedRef.current) return;
    if (reattachCountRef.current >= 2) return;
    reattachCountRef.current += 1;
    if (hlsRef.current) { try { hlsRef.current.destroy(); } catch {} hlsRef.current = null; }
    const v = videoRef.current;
    if (v) { try { v.pause(); v.removeAttribute("src"); v.load(); } catch {} }
    attachedRef.current = false;
    mediaRecoveriesRef.current = 0;
    setSourceReady(false);
    setStarted(false);
    setAttachNonce((n) => n + 1); // re-runs the attach effect
  }, []);

  /* Stall watchdog: if this slide is ACTIVE and a source is attached but no
     frame has been composited after 10s, the pipeline is silently dead
     (worker died, native-HLS stall, poisoned element) — rebuild it.
     Skipped when the user paused it themselves or when data is actually
     arriving (slow networks must not have an in-progress load destroyed). */
  useEffect(() => {
    if (!isActive || !sourceReady || started || blocked) return;
    const t = setInterval(() => {
      const v = videoRef.current;
      if (!v || v.readyState >= 2) return;
      if (v.paused && !playing) return; // user paused pre-frame — leave it
      if (v.buffered.length > 0) return; // data flowing — just slow, not dead
      fullReattach();
    }, 10000);
    return () => clearInterval(t);
  }, [isActive, sourceReady, started, blocked, playing, fullReattach]);

  /* Attach HLS source AND play immediately if this is the active slide.
     Depends only on shouldLoad (active OR near) — NOT isActive — so swiping
     between neighbors never destroys an already-buffered player. Activation
     of a pre-attached neighbor is handled by the play effect below. */
  const shouldLoad = isActive || isNear;
  useEffect(() => {
    if (!hlsUrl || !shouldLoad) return;
    if (attachedRef.current) return;

    const vid = videoRef.current;
    if (!vid) return;

    let cancelled = false;
    attachedRef.current = true;

    async function attach() {
      if (cancelled || !vid || !hlsUrl) return;

      // Prefer hls.js (MSE) whenever it's supported. Some Chrome versions
      // answer "maybe" to canPlayType(HLS) but then stall forever at
      // readyState 0, so native HLS is only trusted where hls.js CAN'T run.
      //
      // DO NOT assume this branch means "not iOS". hls.js resolves
      // ManagedMediaSource first and iPhone Safari has shipped it since
      // iOS 17.1, so Hls.isSupported() is TRUE on a modern iPhone and the MSE
      // path below runs there — a transmux Worker + SourceBuffer per attached
      // slide, not the single cheap native element this file used to assume.
      const Hls = await getHls();
      if (cancelled || !vid) return;

      if (!Hls || !Hls.isSupported()) {
        if (vid.canPlayType("application/vnd.apple.mpegurl")) {
          vid.src = hlsUrl;
          vid.load();
          if (!cancelled) {
            setSourceReady(true); // the play effect is the single tryPlay caller
          }
        }
        return;
      }

      const hls = new Hls({
        maxBufferLength: 8,
        maxMaxBufferLength: 15,
        backBufferLength: 0,
        enableWorker: true,
        startLevel: 0,
        capLevelToPlayerSize: true,
        maxLoadingDelay: 0,
        startFragPrefetch: true,
        abrEwmaDefaultEstimate: 500_000,
      });
      hlsRef.current = hls;
      hls.loadSource(hlsUrl);
      hls.attachMedia(vid);
      if (!cancelled) {
        setSourceReady(true); // the play effect is the single tryPlay caller
      }
      hls.on(Hls.Events.ERROR, (_e: string, data: { type: string; fatal: boolean }) => {
        if (!data.fatal || !Hls) return;
        const resume = () => {
          const v = videoRef.current;
          if (v && isActiveRef.current && !blockedRef.current) v.play().catch(() => {});
        };
        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
          // A signed URL is a short-lived bearer capability. Refresh through
          // our authenticated endpoint before retrying; public/free streams
          // retain the existing network recovery behavior.
          if (!refreshProtectedSource()) {
            hls.startLoad();
            resume();
          }
        } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
          if (mediaRecoveriesRef.current < 2) {
            mediaRecoveriesRef.current += 1;
            hls.recoverMediaError();
            resume();
          } else if (!audioSwappedRef.current) {
            audioSwappedRef.current = true;
            hls.swapAudioCodec();
            hls.recoverMediaError();
            resume();
          } else {
            fullReattach();
          }
        } else {
          // OTHER_ERROR (worker/demuxer death, etc.) — rebuild from scratch.
          fullReattach();
        }
      });
    }

    attach();

    return () => {
      cancelled = true;
      if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
      const v = videoRef.current;
      if (v) { v.pause(); v.removeAttribute("src"); v.load(); }
      attachedRef.current = false;
      setSourceReady(false);
    };
  }, [hlsUrl, shouldLoad, tryPlay, attachNonce, refreshProtectedSource, fullReattach]);

  /* Native-HLS Safari does not use hls.js, so its token/network failures arrive
     on the media element. The same bounded refresh path handles them. */
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !episode.requiresAuthorization) return;
    const onError = () => { refreshProtectedSource(); };
    video.addEventListener("error", onError);
    return () => video.removeEventListener("error", onError);
  }, [episode.requiresAuthorization, refreshProtectedSource]);

  /* Tear down HLS only when slide is far away (not near) */
  useEffect(() => {
    if (isActive || isNear) return;
    const vid = videoRef.current;
    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
    if (vid) { vid.pause(); vid.removeAttribute("src"); vid.load(); }
    attachedRef.current = false;
    queueMicrotask(() => {
      setSourceReady(false);
      setPlaying(false);
      setStarted(false);
      setLoading(false);
    });
  }, [isActive, isNear]);

  /* When a slide becomes active AFTER source was already attached (swiping
     to a pre-loaded neighbor), play immediately. Locked (paywalled) episodes
     are PAUSED instead — the paid content must not play behind the unlock
     overlay. When the viewer unlocks (blocked flips false), it plays. */
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    if (isActive && sourceReady && !blocked) {
      tryPlay(vid);
    } else if (!isActive || blocked) {
      vid.muted = true;
      vid.pause();
      queueMicrotask(() => setPlaying(false));
    }
  }, [isActive, sourceReady, blocked, tryPlay]);

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
      if (!vid) return;
      if (vid.duration && isFinite(vid.duration)) {
        onProgress(vid.currentTime / vid.duration);
      }
      // Surface the live position to the parent (re-engagement reminder reads it).
      onPosition(vid.currentTime);
      // Throttled server save (~every 10s) while genuinely watching.
      const now = Date.now();
      if (now - lastSavedRef.current > 10000 && vid.currentTime > 5) {
        lastSavedRef.current = now;
        fetch("/api/watch-progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            seriesSlug,
            episodeNumber: episode.number,
            progressSeconds: Math.floor(vid.currentTime),
            completed: false,
          }),
        }).catch(() => {});
      }
    }
    function onEnd() {
      trackEpisodeComplete(seriesSlug, episode.number);
      onProgress(1);
      fetch("/api/watch-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seriesSlug, episodeNumber: episode.number, progressSeconds: 0, completed: true }),
      }).catch(() => {});
      onEnded();
    }

    vid.addEventListener("timeupdate", onTime);
    vid.addEventListener("ended", onEnd);
    return () => {
      vid.removeEventListener("timeupdate", onTime);
      vid.removeEventListener("ended", onEnd);
    };
  }, [isActive, seriesSlug, episode.number, onEnded, onProgress, onPosition]);

  /* Tap handler: single tap = pause, double tap = like */
  function handleTap(e: React.MouseEvent) {
    e.stopPropagation();
    onReveal();
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
      // Read activeness via ref — the tap-time closure goes stale if the user
      // swipes within 300ms, and acting on it played/paused the wrong slide.
      if (!vid || !isActiveRef.current) return;

      if (vid.paused) {
        // Genuine play gesture — opt the viewer into the resume reminder once.
        onFirstPlayGesture();
        vid.play().catch(() => {});
        setPlaying(true);
        // Reveal only once a real frame is composited — flipping `started`
        // immediately would fade the posters over a still-black video.
        onFirstFrame(vid, () => setStarted(true));
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
      {/* Transition poster — the EXACT image the user tapped on the browse
          page (already in the browser cache → paints instantly). Sits at the
          bottom of the stack so the screen is never black while the full-res
          poster and video load. */}
      {transitionPoster && (
        <img
          src={transitionPoster}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            opacity: started ? 0 : 1,
            transition: "opacity 0.45s cubic-bezier(0.22, 1, 0.36, 1) 0.1s",
            zIndex: 0,
          }}
        />
      )}

      {/* Series poster — visible IMMEDIATELY (no delay, no fade-in) and held
          steady until the first real video frame is composited. A stable
          placeholder can't flash: it only crossfades out once the video is
          actually showing pixels. */}
      {posterUrl && (
        <Image
          src={posterUrl}
          alt=""
          fill
          priority={isActive}
          sizes="100vw"
          // Always cover: only the VIDEO letterboxes in widescreen mode. A
          // contained poster over the full-bleed transition poster rendered
          // as a "poster inside a poster" double image on Storage Pirates.
          className="object-cover"
          style={{
            opacity: started ? 0 : 1,
            transition: "opacity 0.45s cubic-bezier(0.22, 1, 0.36, 1) 0.1s",
            zIndex: 1,
          }}
        />
      )}

      {/* Video mounts here imperatively (created fresh, or ADOPTED from the
          browse page's instant player so it's already playing on arrival).
          It fades in once the first real frame is composited, overlapping the
          poster fade-out so the swap is a true crossfade with no gap. */}
      <div ref={videoBoxRef} className="absolute inset-0" style={{ zIndex: 2 }} />

      {/* No spinner — poster holds until video plays */}

      {/* Pause/Play indicator (animated) */}
      {showPause && (
        <div
          className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none"
          style={{ animation: "fadeOut 0.3s ease 0.5s forwards" }}
        >
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{
              background: "rgba(0,0,0,0.4)",
              backdropFilter: "blur(16px)",
              animation: "scaleIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
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
        animation: "toastIn 1.2s cubic-bezier(0.22, 1, 0.36, 1) forwards",
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
  startPositionS: startPositionProp = 0,
  totalEpisodes,
  horizontal = false,
  backHref = "/",
}: EpisodeFeedProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Poster the user tapped on the browse page (stored in sessionStorage at
  // click time). It's already in the browser cache, so painting it here is
  // instant — the visual bridge from the browse grid into the first frame.
  const [transitionPoster] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = sessionStorage.getItem("verza-transition");
      if (!raw) return null;
      const d = JSON.parse(raw) as { src?: string; ts?: number };
      if (d.src && d.ts && Date.now() - d.ts < 15000) return d.src;
    } catch {}
    return null;
  });

  // One-shot: consume the transition poster so a later refresh / back-nav
  // doesn't show a stale image.
  useEffect(() => {
    try { sessionStorage.removeItem("verza-transition"); } catch {}
  }, []);

  // Read ?t= and ?unlocked= from URL client-side (page is static / SSG —
  // these params aren't available server-side).
  const [startPositionS] = useState(() => {
    if (typeof window !== "undefined") {
      const t = Number(new URLSearchParams(window.location.search).get("t"));
      if (t > 0) return Math.floor(t);
    }
    return startPositionProp;
  });

  // Client-side auth: VIP / entitlement upgrade.  The page ships with
  // episodes marked free based on series config only.  A Stripe checkout
  // return carries ?session_id=cs_... which is VERIFIED server-side (the old
  // blind ?unlocked=true param let anyone unlock by editing the URL);
  // verified sessions are remembered only to recover checkout for the same
  // still-authenticated account after the Stripe return.
  const [authFree, setAuthFree] = useState(() => {
    if (typeof window !== "undefined") {
      // Optimistic while verification runs — a buyer landing back from
      // Stripe must never see a paywall flash. Reverted if it fails.
      return (new URLSearchParams(window.location.search).get("session_id") ?? "").startsWith("cs_");
    }
    return false;
  });
  // True once the entitlement check (/api/access + session confirm) resolves.
  // The paywall must not surface until then, or VIP/owners see a flash-then-hide
  // while the async check is in flight.
  const [authResolved, setAuthResolved] = useState(false);

  useEffect(() => {
    let stale = false;
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");
    const storageKey = `verza-unlock:${seriesSlug}`;

    // A client-side navigation can reuse this component for a different
    // series. Never carry the prior title's entitlement/auth-settled state
    // across that boundary while the new checks are in flight.
    queueMicrotask(() => {
      if (stale) return;
      setAuthFree(!!sessionId?.startsWith("cs_"));
      setAuthResolved(false);
    });

    async function confirmSession(id: string): Promise<boolean> {
      try {
        const r = await fetch(`/api/unlock/confirm?session_id=${encodeURIComponent(id)}&slug=${encodeURIComponent(seriesSlug)}`);
        const d = (await r.json()) as { full?: boolean };
        return !!d.full;
      } catch {
        return false;
      }
    }

    (async () => {
      if (sessionId?.startsWith("cs_")) {
        const ok = await confirmSession(sessionId);
        if (stale) return;
        if (ok) {
          setAuthFree(true);
          try { localStorage.setItem(storageKey, sessionId); } catch {}
          return;
        }
        setAuthFree(false); // forged/expired param — fall through to /api/access
      }
      try {
        const r = await fetch(`/api/access?slug=${seriesSlug}`);
        const d = r.ok ? ((await r.json()) as { full?: boolean }) : null;
        if (!stale && d?.full) { setAuthFree(true); return; }
      } catch {}
      // Re-verify a remembered Checkout session for the signed-in account.
      try {
        const remembered = localStorage.getItem(storageKey);
        if (remembered && !stale && (await confirmSession(remembered))) {
          setAuthFree(true);
          return;
        }
      } catch {}
      if (!stale) setAuthFree(false);
    })().finally(() => { if (!stale) setAuthResolved(true); });

    return () => { stale = true; };
  }, [seriesSlug]);

  // Dismiss any visible paywall popup when auth resolves
  useEffect(() => {
    if (authFree) setShowUnlock(false);
  }, [authFree]);

  const [activeIndex, setActiveIndex] = useState(() => {
    const idx = episodes.findIndex((e) => e.number === startEpisode);
    return idx >= 0 ? idx : 0;
  });

  // A poster belongs to ENTERING a series, not to moving through it. It covers
  // the cold-start gap on the episode the viewer arrives on; from the first
  // swipe onward every slide loads over plain black instead, so episode to
  // episode transitions flash black rather than flashing the poster. Slides are
  // windowed and remount, so this is tracked for the whole session rather than
  // derived per slide.
  const [hasSwiped, setHasSwiped] = useState(false);
  useEffect(() => {
    const idx = episodes.findIndex((e) => e.number === startEpisode);
    if (activeIndex !== (idx >= 0 ? idx : 0)) setHasSwiped(true);
  }, [activeIndex, episodes, startEpisode]);
  const [muted, setMuted] = useState(() => {
    if (typeof window !== "undefined") return localStorage.getItem("verza-muted") !== "false";
    return true;
  });
  // $1.99 "Unlock Full Series" popup — pops up when the viewer reaches the first
  // locked episode (after the free preview, before entering the paid episode).
  const [showUnlock, setShowUnlock] = useState(false);
  // Reader mode (Apple 3.1.1): inside the iOS app, no purchase UI may appear.
  const [iosApp, setIosApp] = useState(false);
  useEffect(() => {
    if (isIOSApp()) queueMicrotask(() => setIosApp(true));
  }, []);

  // Surface the paywall from the SETTLED active episode, debounced. The
  // IntersectionObserver can flap activeIndex as a swipe settles; deriving +
  // debouncing here (instead of toggling inside the observer callback) means
  // the overlay fades in ONCE and never blinks, and paywall_viewed fires once
  // per settle rather than once per observer tick.
  useEffect(() => {
    const ep = episodes[activeIndex];
    const locked = !!ep && !ep.isFree && !authFree;
    // Wait for the entitlement check to resolve before showing the paywall —
    // otherwise VIP/owners flash the overlay while /api/access is in flight.
    if (!locked || !authResolved) { setShowUnlock(false); return; }
    const t = setTimeout(() => {
      setShowUnlock(true);
      trackUnlockPrompt(seriesSlug);
      emit("paywall_viewed", { show_id: seriesSlug, episode_number: ep.number, plan_type: "series_unlock", surface: "episode_feed" });
    }, 250);
    return () => clearTimeout(t);
  }, [activeIndex, authFree, authResolved, episodes, seriesSlug]);

  /* Keep the document title in step with the episode the viewer is actually on.
     The feed advances episodes with history.replaceState, which updates the URL
     but does NOT re-run the route's generateMetadata — so the tab kept showing
     the episode the viewer ENTERED on no matter how far they swiped. Mirror the
     server's format, including the "| VERZA TV" that layout.tsx's title.template
     appends server-side. og/twitter follow so an in-page share reflects the
     current episode; crawlers still read the correct per-episode server tags. */
  useEffect(() => {
    const ep = episodes[activeIndex];
    if (!ep) return;
    document.title = `${seriesTitle} — ${ep.title} | VERZA TV`;
    const url = `${window.location.origin}/series/${seriesSlug}/${ep.number}`;
    const setMeta = (selector: string, value: string) => {
      const el = document.querySelector<HTMLMetaElement>(selector);
      if (el) el.content = value;
    };
    setMeta('meta[property="og:title"]', `${ep.title} — ${seriesTitle}`);
    setMeta('meta[property="og:url"]', url);
    setMeta('meta[name="twitter:title"]', `${ep.title} — ${seriesTitle}`);
  }, [activeIndex, episodes, seriesSlug, seriesTitle]);

  const [unlockLoading, setUnlockLoading] = useState(false);
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const handlePlaybackAccessDenied = useCallback(() => {
    // A refund/dispute/account change can invalidate access after a prior URL
    // was cached. Re-lock immediately when the authenticated refresh says no.
    setAuthFree(false);
    setShowUnlock(true);
  }, []);
  const [epProgress, setEpProgress] = useState(0);
  const [showToast, setShowToast] = useState(false);
  const [showHeart, setShowHeart] = useState(false);
  const [liked, setLiked] = useState<Set<number>>(new Set());
  const [showMore, setShowMore] = useState(false);
  const [actionToast, setActionToast] = useState<string | null>(null);
  // All video chrome (back / mute / fullscreen / action rail / badge / progress)
  // shows for 10s on each new video, then fades out to a clean frame — only the
  // VERZA watermark stays permanent. Any tap brings the chrome back for 10s more.
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

  // Show the chrome for 10s whenever the active video changes (and on mount).
  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) revealActionRail();
    });
    return () => {
      cancelled = true;
      if (actionRailTimer.current) clearTimeout(actionRailTimer.current);
    };
  }, [activeIndex, revealActionRail]);
  const activeIndexRef = useRef(activeIndex);
  activeIndexRef.current = activeIndex;

  /* Re-engagement / Continue Watching: track the active video's live position
     so the visibilitychange handler can persist the exact resume spot. */
  const activePositionRef = useRef(0);
  const askedPermissionRef = useRef(false);

  const requestPermissionOnce = useCallback(() => {
    if (askedPermissionRef.current) return;
    askedPermissionRef.current = true;
    void maybeRequestResumePermission();
  }, []);

  /* Back always returns straight to the home page.
     Use window.location.href (not router.push) so the page fully reloads and
     BrowsePage remounts with default state (drama tab). router.push does a
     client-side navigation that keeps the component mounted, preserving
     whatever tab was previously active (e.g. reality). */
  const handleBack = useCallback(() => {
    // Pause any playing video first to avoid audio bleeding into the next view
    const vids = document.querySelectorAll("video");
    vids.forEach((v) => { v.muted = true; v.pause(); });
    // replace() instead of href assignment: the episode's history entry is
    // swapped for home, so the browser Back button from home doesn't bounce
    // the user straight back into the player.
    window.location.replace(backHref);
  }, [backHref]);

  const activeEp = episodes[activeIndex];

  // Virtual window: only render 5 slides max (windowCenter ± 2).
  // The window recenters ONLY when scrolling is idle — mounting/unmounting
  // slides and resizing spacers ABOVE the scrollport mid-swipe retargeted the
  // in-flight snap scroll (first happens at the 4th video) and broke playback.
  const WINDOW = 2;
  const [windowCenter, setWindowCenter] = useState(activeIndex);
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let idleTimer: ReturnType<typeof setTimeout> | null = null;
    const recenter = () => setWindowCenter(activeIndexRef.current);
    const onScroll = () => {
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(recenter, 160);
    };
    container.addEventListener("scroll", onScroll, { passive: true });
    container.addEventListener("scrollend", recenter);
    return () => {
      if (idleTimer) clearTimeout(idleTimer);
      container.removeEventListener("scroll", onScroll);
      container.removeEventListener("scrollend", recenter);
    };
  }, []);
  // The window always covers activeIndex ± 1 even before the idle recenter,
  // so a fast consecutive swipe never lands where its snap target is missing.
  const windowStart = Math.min(
    Math.max(0, windowCenter - WINDOW),
    Math.max(0, activeIndex - 1),
  );
  const windowEnd = Math.max(
    Math.min(episodes.length - 1, windowCenter + WINDOW),
    Math.min(episodes.length - 1, activeIndex + 1),
  );

  /* Scroll to start episode on mount. Look the slide up by data-index — the
     container's children include window spacers, so positional indexing is
     wrong for any start episode past the first render window. */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const startIdx = episodes.findIndex((e) => e.number === startEpisode);
    if (startIdx > 0) {
      const target = container.querySelector(`[data-index="${startIdx}"]`) as HTMLElement | null;
      if (target) target.scrollIntoView({ behavior: "instant" as ScrollBehavior });
    }
  }, [episodes, startEpisode]);

  /* Auto-advance: pause current, then scroll to next. Slides are looked up by
     data-index (positional children[] indexing breaks once window spacers
     exist — it skipped episodes and scrolled into blank spacer regions). */
  const handleEpisodeEnded = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    // Pause the current video immediately to prevent audio overlap. The
    // adopted instant-player video lives in <body>, not in the slide.
    const currentSlide = container.querySelector(`[data-index="${activeIndexRef.current}"]`);
    const currentVid =
      currentSlide?.querySelector("video") ??
      document.querySelector<HTMLVideoElement>("video[data-verza-fixed]");
    if (currentVid) { currentVid.muted = true; currentVid.pause(); }
    const nextIdx = activeIndexRef.current + 1;
    if (nextIdx < episodes.length) {
      const target = container.querySelector(`[data-index="${nextIdx}"]`) as HTMLElement | null;
      if (target) target.scrollIntoView({ behavior: "smooth" });
    }
  }, [episodes.length]);

  /* IntersectionObserver for snap detection */
  const observerCallback = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      for (const entry of entries) {
        // Gate on the RATIO, not isIntersecting: when the observer re-subscribes
        // after a window shift (first happens at the 4th video), the initial
        // callbacks report partially-visible neighbors as isIntersecting —
        // acting on those flapped activeIndex mid-swipe and paused playback.
        if (entry.intersectionRatio >= 0.55) {
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
            // Preserve query params on the starting episode, but drop the
            // one-shot ones (?t= resume position, ?session_id=) once the
            // viewer moves to another episode — a reload there must not
            // re-apply a stale resume seek to the wrong episode.
            const qp = new URLSearchParams(window.location.search);
            if (ep.number !== startEpisode) { qp.delete("t"); qp.delete("session_id"); qp.delete("unlocked"); }
            const qs = qp.toString();
            window.history.replaceState(null, "", `/series/${seriesSlug}/${ep.number}${qs ? `?${qs}` : ""}`);

            // Paywall visibility is derived from the SETTLED active episode in
            // a debounced effect (search: "Surface the paywall") — NOT toggled
            // here — so transient observer flaps as a swipe settles can't blink
            // the overlay.
          }
        }
      }
    },
    [episodes, seriesSlug, startEpisode],
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

  /* Re-engagement reminder: when the tab/app is backgrounded mid-episode,
     remember the exact spot, fire the "Continue watching" notification, and
     flush a final progress save. Clear the reminder when the viewer returns. */
  useEffect(() => {
    function activeVideoEl(): HTMLVideoElement | null {
      const container = containerRef.current;
      if (!container) return null;
      const slide = container.querySelector(`[data-index="${activeIndexRef.current}"]`);
      // The adopted instant-player video is a <body> child, not in the slide.
      return (
        (slide ? slide.querySelector("video") : null) ??
        document.querySelector<HTMLVideoElement>("video[data-verza-fixed]")
      );
    }

    function onHidden() {
      const vid = activeVideoEl();
      const ep = episodes[activeIndexRef.current];
      if (!vid || !ep) return;
      const positionS = vid.currentTime || activePositionRef.current;
      // Only remind if genuinely mid-episode and playing.
      if (vid.paused || positionS <= 3) return;

      const item: ResumeItem = {
        slug: seriesSlug,
        episode: ep.number,
        title: seriesTitle,
        poster: posterUrl,
        positionS,
        updatedAt: Date.now(),
      };
      saveLastWatching(item);
      void notifyResume(item);
      // Final flush — keepalive lets it complete while backgrounding.
      try {
        fetch("/api/watch-progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          keepalive: true,
          body: JSON.stringify({
            seriesSlug,
            episodeNumber: ep.number,
            progressSeconds: Math.floor(positionS),
            completed: false,
          }),
        }).catch(() => {});
      } catch {
        /* ignore */
      }
    }

    function onVisibility() {
      if (document.visibilityState === "hidden") onHidden();
      else void clearResumeNotification();
    }

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onHidden);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onHidden);
    };
  }, [episodes, seriesSlug, seriesTitle, posterUrl]);

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
      if (raw) {
        const next = new Set(JSON.parse(raw) as number[]);
        queueMicrotask(() => setLiked(next));
      }
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

  /* ---- Saved / My List (persisted per series in localStorage + API) ---- */
  const [isSaved, setIsSaved] = useState(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem("verza-saved");
      const slugs: string[] = raw ? JSON.parse(raw) : [];
      const saved = slugs.includes(seriesSlug);
      queueMicrotask(() => setIsSaved(saved));
    } catch {}
  }, [seriesSlug]);

  function toggleSave() {
    setIsSaved((prev) => {
      const next = !prev;
      try {
        const raw = localStorage.getItem("verza-saved");
        const slugs: string[] = raw ? JSON.parse(raw) : [];
        const set = new Set(slugs);
        if (next) set.add(seriesSlug);
        else set.delete(seriesSlug);
        localStorage.setItem("verza-saved", JSON.stringify([...set]));
      } catch {}
      fetch("/api/saved-list", {
        method: next ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seriesSlug }),
      }).catch(() => {});
      popActionToast(next ? "Saved to My List" : "Removed from My List");
      return next;
    });
    haptic();
  }

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
  const shareText = `Watch ${seriesTitle} — EP ${activeEp?.number ?? 1} on VERZA TV`;

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
                overflowAnchor: "none",
              }
            : {
                width: "100%",
                height: "var(--feed-h, 100dvh)",
                overflowY: "auto",
                overflowX: "hidden",
                scrollSnapType: "y mandatory",
                scrollbarWidth: "none",
                // Browser scroll anchoring fights the spacer resizes that keep
                // the virtual window's geometry stable — disable it.
                overflowAnchor: "none",
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
                posterUrl={!hasSwiped && ep.number === startEpisode ? posterUrl : ""}
                isActive={i === activeIndex}
                isNear={Math.abs(i - activeIndex) <= 1}
                muted={muted}
                resumePositionS={startPositionS}
                isResumeTarget={ep.number === startEpisode}
                onEnded={handleEpisodeEnded}
                onProgress={i === activeIndex ? setEpProgress : () => {}}
                onPosition={
                  i === activeIndex
                    ? (p: number) => { activePositionRef.current = p; }
                    : () => {}
                }
                onDoubleTap={handleDoubleTap}
                onReveal={revealActionRail}
                onFirstPlayGesture={requestPermissionOnce}
                widescreen={horizontal}
                transitionPoster={ep.number === startEpisode ? transitionPoster ?? undefined : undefined}
                blocked={!ep.isFree && !authFree}
                onAccessDenied={handlePlaybackAccessDenied}
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
        style={{
          background: "rgba(0,0,0,0.35)", backdropFilter: "blur(20px)",
          opacity: showActionRail ? 1 : 0,
          pointerEvents: showActionRail ? "auto" : "none",
          transition: showActionRail ? "opacity 0.2s cubic-bezier(0.22, 1, 0.36, 1)" : "opacity 0.6s ease",
        }}
        aria-label="Back"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      {/* VERZA logo — fades in exactly as the back arrow fades out (same spot) */}
      <VideoWatermark visible={!showActionRail} top={12} left={12} size={44} />

      {/* Mute button — top-right */}
      <button
        onClick={toggleMute}
        className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full flex items-center justify-center border-0 cursor-pointer"
        style={{
          background: "rgba(0,0,0,0.35)", backdropFilter: "blur(20px)",
          opacity: showActionRail ? 1 : 0,
          pointerEvents: showActionRail ? "auto" : "none",
          transition: showActionRail ? "opacity 0.2s cubic-bezier(0.22, 1, 0.36, 1)" : "opacity 0.6s ease",
        }}
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
          // Fullscreen the ACTIVE slide's video (works while paused too).
          // The adopted instant-player video is a <body> child, not in the slide.
          const slide = containerRef.current?.querySelector(`[data-index="${activeIndexRef.current}"]`);
          const v =
            (slide?.querySelector("video") as HTMLVideoElement | null) ??
            document.querySelector<HTMLVideoElement>("video[data-verza-fixed]");
          if (v) {
            if (v.requestFullscreen) v.requestFullscreen();
            else {
              const iosVideo = v as HTMLVideoElement & {
                webkitEnterFullscreen?: () => void;
              };
              iosVideo.webkitEnterFullscreen?.();
            }
          }
        }}
        className="absolute top-16 right-4 z-50 w-10 h-10 rounded-full flex items-center justify-center border-0 cursor-pointer"
        style={{
          background: "rgba(0,0,0,0.35)", backdropFilter: "blur(20px)",
          opacity: showActionRail ? 1 : 0,
          pointerEvents: showActionRail ? "auto" : "none",
          transition: showActionRail ? "opacity 0.2s cubic-bezier(0.22, 1, 0.36, 1)" : "opacity 0.6s ease",
        }}
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
          transition: showActionRail ? "opacity 0.2s cubic-bezier(0.22, 1, 0.36, 1)" : "opacity 0.6s ease",
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

        {/* Save / My List */}
        <button
          onClick={() => { revealActionRail(); toggleSave(); }}
          aria-label={isSaved ? "Remove from My List" : "Save to My List"}
          className="flex flex-col items-center gap-1 border-0 bg-transparent cursor-pointer p-0"
        >
          <span
            className="w-11 h-11 rounded-full flex items-center justify-center transition-transform active:scale-90"
            style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(20px)" }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill={isSaved ? "#fff" : "none"} stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
            </svg>
          </span>
          <span className="text-[10px] font-semibold" style={{ color: "#fff", textShadow: "0 1px 3px rgba(0,0,0,0.6)" }}>
            {isSaved ? "Saved" : "Save"}
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
            style={{ background: "#12121C", borderTopLeftRadius: 22, borderTopRightRadius: 22, animation: "slideUp 0.35s cubic-bezier(0.22, 1, 0.36, 1) both" }}
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
      <div
        className="absolute bottom-6 left-4 z-50 pointer-events-none"
        style={{ opacity: showActionRail ? 1 : 0, transition: showActionRail ? "opacity 0.2s cubic-bezier(0.22, 1, 0.36, 1)" : "opacity 0.6s ease" }}
      >
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
        style={{ height: 4, opacity: showActionRail ? 1 : 0, transition: showActionRail ? "opacity 0.2s cubic-bezier(0.22, 1, 0.36, 1)" : "opacity 0.6s ease" }}
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

      {/* ---- $1.99 Unlock overlay (first locked episode) ---- */}
      {showUnlock && (
        <div
          className="absolute inset-0 z-[60] flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(12px)", animation: "fadeIn 0.35s ease-out both" }}
        >
          <div className="text-center px-8 max-w-xs" style={{ animation: "paywallIn 0.45s cubic-bezier(0.22, 1, 0.36, 1) 0.08s both" }}>
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{
                background: "linear-gradient(135deg, rgba(224,17,95,0.25), rgba(139,92,246,0.25))",
                boxShadow: "0 0 30px rgba(224,17,95,0.25)",
              }}
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="#fff" stroke="none">
                <polygon points="8 5 20 12 8 19" />
              </svg>
            </div>
            <h3 className="text-2xl font-black mb-1.5 tracking-tight" style={{ color: "#fff" }}>
              {iosApp ? "Episode Unavailable" : "Unlock All Episodes"}
            </h3>
            <p className="text-sm mb-4" style={{ color: "rgba(255,255,255,0.55)" }}>
              {iosApp
                ? "This episode isn't available in this app."
                : <>You just watched the free preview of {seriesTitle}. Don&apos;t stop now — the story is just getting good.</>}
            </p>
            {!iosApp && (
              <div className="flex flex-col gap-1.5 mb-5 text-left mx-auto" style={{ width: "fit-content" }}>
                {[
                  `All ${episodes.length} episodes, instantly`,
                  "Access on your Verza account while this title remains available",
                ].map((line) => (
                  <div key={line} className="flex items-center gap-2">
                    <span
                      className="rounded-full shrink-0"
                      style={{ width: 6, height: 6, background: "linear-gradient(135deg, #E0115F, #8B5CF6)" }}
                    />
                    <span className="text-[13px] font-medium" style={{ color: "rgba(255,255,255,0.8)" }}>{line}</span>
                  </div>
                ))}
              </div>
            )}
            {!iosApp && (
              <p className="mb-3">
                <span className="text-3xl font-black align-middle" style={{ color: "#fff" }}>$1.99</span>
                <span className="ml-2 text-xs font-semibold align-middle" style={{ color: "rgba(255,255,255,0.65)" }}>
                  one-time Series Unlock
                </span>
              </p>
            )}
            {!iosApp && (
            <button
              onClick={async () => {
                if (!(await requireCheckoutUser())) return;
                setUnlockLoading(true);
                setUnlockError(null);
                trackUnlockClick(seriesSlug);
                emit("checkout_started", { show_id: seriesSlug, plan_type: "series_unlock", surface: "episode_feed" });
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
                    if (data.alreadyOwned) {
                      setAuthFree(true);
                      return;
                    }
                    setUnlockError(
                      typeof data.error === "string"
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
              className="glow-pulse w-full py-4 rounded-2xl text-base font-bold border-0 cursor-pointer transition-transform active:scale-[0.97]"
              style={{
                background: "linear-gradient(135deg, #E0115F, #8B5CF6)",
                color: "#fff",
                opacity: unlockLoading ? 0.7 : 1,
                boxShadow: "0 0 40px rgba(224,17,95,0.3)",
              }}
            >
              {unlockLoading ? "Opening secure checkout…" : "Series Unlock — $1.99 one-time"}
            </button>
            )}
            {!iosApp && unlockError && (
              <p
                className="mt-2.5 text-xs px-3 py-2 rounded-lg"
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
            {!iosApp && (
            <p className="mt-2.5 text-[11px]" style={{ color: "rgba(255,255,255,0.4)" }}>
              Secure checkout via Stripe
            </p>
            )}
            <button
              onClick={handleBack}
              className="mt-3.5 w-full py-3.5 rounded-2xl text-[15px] font-bold cursor-pointer transition-transform active:scale-[0.97]"
              style={{
                background: "rgba(255,255,255,0.1)",
                border: "1.5px solid rgba(255,255,255,0.35)",
                color: "#fff",
                backdropFilter: "blur(8px)",
                opacity: 0,
                animation: "fadeIn 0.35s ease-out 0.25s forwards",
              }}
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
          0% { transform: translate(-50%, -50%) scale(0.85); opacity: 0; }
          10% { transform: translate(-50%, -50%) scale(1.04); opacity: 1; }
          18% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          80% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(0.98); opacity: 0; }
        }
        @keyframes paywallIn {
          0% { transform: translateY(20px) scale(0.94); opacity: 0; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
