"use client";

import { useRef, useState, useEffect, useLayoutEffect, useCallback, useMemo, useSyncExternalStore } from "react";
import Image from "next/image";
import type HlsType from "hls.js";
import { adoptInstantPlayer } from "@/lib/instant-player";
import { isIOSApp } from "@/lib/platform";
import { trackEpisodeStart, trackEpisodeComplete, trackUnlockPrompt, trackUnlockClick } from "@/lib/track";
import { emit } from "@/lib/analytics";
import { requireCheckoutUser } from "@/lib/checkout-auth";
import { useTranslation } from "@/components/LangProvider";
import { SERIES_UNLOCK_PRICE_CENTS } from "@/lib/price";
import type { TranslationKey } from "@/lib/i18n";
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
import { recordWatchProgress } from "@/lib/watch-progress-client";
import { readSavedSlugs, setSavedSlug } from "@/lib/guest-storage";

/* The closed set of failures /api/unlock can return, mapped to copy the
   viewer can read. The route sends a stable machine `code` alongside its
   English `error`; without this map the paywall printed that English sentence
   verbatim, so a Spanish speaker who got as far as tapping the button was
   handed "Couldn't start checkout. Please try again." on a screen that was
   Spanish everywhere else.

   An unrecognised code falls back to the server's own text rather than to a
   generic message: losing "An earlier payment is still being reviewed,
   contact support" and replacing it with "please try again" would send a
   customer round a loop that cannot succeed. Wrong language beats wrong
   instruction. scripts/test-feed-integrity.mjs asserts the two sets match. */
const CHECKOUT_ERROR_KEYS: Record<string, TranslationKey> = {
  invalid_request: "checkout.errorStart",
  auth_required: "checkout.errorAuth",
  series_not_found: "checkout.errorNotFound",
  not_purchasable: "checkout.errorNotPurchasable",
  eligibility_unknown: "checkout.errorEligibility",
  already_owned: "checkout.errorStart",
  account_deletion: "checkout.errorAccountDeletion",
  payment_review: "checkout.errorPaymentReview",
  checkout_unusable: "checkout.errorCheckoutUnusable",
  payment_refunded: "checkout.errorRefunded",
  checkout_failed: "checkout.errorStart",
};

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

/* ---- "Are we past hydration yet?" ----------------------------------
   React's own mechanism for a value the server cannot know: the hydrating
   render is handed the server snapshot, so the first client render matches the
   HTML exactly, and React re-renders with the client snapshot once hydration
   is done. Stable module-scope functions, because a new getSnapshot identity on
   every render makes useSyncExternalStore loop. */
const subscribeNever = () => () => {};
const snapshotHydrated = () => true;
const snapshotServer = () => false;

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

/* Minimum gap between two auto-advances. Covers a smooth scroll settling, and
   is far below the shortest episode in the catalogue (about 29 seconds), so a
   viewer never meets it during normal playback. */
const ADVANCE_COOLDOWN_MS = 700;
/* How many episodes the feed may advance on its own before it must see the
   viewer do something. Chosen well above normal binge behaviour and far below
   the length of any series in the catalogue. */
const MAX_UNATTENDED_ADVANCES = 8;

/* How long after the last scroll event the position counts as settled, for
   browsers without the scrollend event. iOS keeps delivering scroll events well
   past the finger lift, so this has to outlast the momentum tail without making
   a deliberate swipe feel late. scrollend fires directly where it exists and
   this is only the fallback. */
const SCROLL_SETTLE_MS = 140;

/* ---- Cross-axis advance (horizontal rails only) ---------------------
   A swipe that clears CROSS_AXIS_ADVANCE_PX advances however slowly it was
   made; a shorter one advances only if it was thrown, which is what makes a
   quick flick feel like the vertical feed's flick rather than like a drag that
   has to be completed. Both are measured against the OTHER axis first:
   CROSS_AXIS_DOMINANCE demands the vertical component be half again the
   horizontal one, so a swipe the native x scroller has already served can
   never also arrive here as an advance.

   CROSS_AXIS_NATIVE_SCROLL_PX is the slack in that same rule expressed in
   pixels: if the rail's own axis actually moved during the gesture, the
   browser handled it and this stands down whatever the numbers say. A thumb
   resting on a moving rail drifts a few pixels, so it is not zero.

   CROSS_AXIS_LOCK_MS is the same idea as ADVANCE_COOLDOWN_MS, kept separate on
   purpose: an automatic advance and a viewer's swipe must not be able to
   silence each other. */
const CROSS_AXIS_ADVANCE_PX = 48;
const CROSS_AXIS_FLICK_PX = 24;
/** px per ms — a 24px throw inside ~70ms counts, a 24px drag over 300ms does not. */
const CROSS_AXIS_FLICK_VELOCITY = 0.35;
const CROSS_AXIS_DOMINANCE = 1.5;
const CROSS_AXIS_NATIVE_SCROLL_PX = 8;
const CROSS_AXIS_LOCK_MS = 320;

/* How far a finger must travel on the scrub strip before its axis is judged.
   Below this a press is just a press: a stationary finger must never start
   seeking, and the question of which way the gesture is going has no answer
   yet. */
const SCRUB_AXIS_SLOP = 6;
/* Wheel/trackpad. One inertial flick is dozens of wheel events, so the burst is
   latched: the deltas accumulate, ONE step is taken when they cross
   WHEEL_STEP_PX, and the accumulator only resets after the burst has been quiet
   for WHEEL_BURST_QUIET_MS. Without the latch a single two-finger flick would
   walk the rail — the same runaway the settle handler exists to prevent. */
const WHEEL_STEP_PX = 90;
const WHEEL_BURST_QUIET_MS = 220;

/* Deadline for the entitlement round-trip. Shorter than playback's 12s: this
   one only gates whether the paywall may mount, and a viewer staring at a
   locked black slide should not wait twelve seconds to be told why. On timeout
   the request aborts, the finally() still runs, authResolved becomes true and
   the paywall mounts. Failing to a paywall is correct: it is the state that
   explains itself and offers a way out, and the server is the thing that
   actually grants media access. */
const ACCESS_REQUEST_TIMEOUT_MS = 6_000;

/* Buffer budgets. The active slide gets the full window; the slide one swipe
   ahead gets just enough to paint its first frame the instant it is reached,
   which is what makes the feed feel instant instead of showing a spinner. These
   mirror the values in the Hls config below and must stay in step with it. */
const ACTIVE_BUFFER_S = 8;
const ACTIVE_MAX_BUFFER_S = 15;
const NEXT_SLIDE_PREFETCH_S = 4;

/* ---- Stall recovery ladder -----------------------------------------
   The failure screen must be unreachable except after a real, attempted,
   failed recovery, so every rung below is an ACTION and the message is only
   what is left when all of them have been tried.

   These are thresholds on MEASURED no-progress, not on a `waiting` event.
   That distinction is the whole fix. Measured against the real stream in
   Chrome 140 over CDP: calling play() straight after attachMedia — which is
   exactly what this component does, because sourceReady flips on the line
   after attachMedia — fires `waiting` at t=16ms at readyState 0 with an empty
   buffer, on a perfectly healthy 0.16s manifest. The old watchdog armed its
   20-second terminal countdown there, on every cold start, before one byte of
   media existed. Nothing about that is a stall.

   The same run showed the opposite failure on the other side: during a genuine
   19-second freeze (playhead pinned at 9.92s, buffer exhausted at 9.963s)
   Chrome emitted a `timeupdate` that did not advance currentTime, and the old
   watchdog treated it as recovery and disarmed everything — no spinner, no
   message, a frozen picture for the rest of the run. One engine escalated a
   non-stall, the other silently swallowed a real one, from the same code.
   Sampling currentTime and the buffered end tells the truth on both. */
const STALL_TICK_MS = 500;
/* A brief stall is normal and a spinner for it is noise. */
const STALL_SPINNER_MS = 1500;
/* Rung 1: hop a hole in the buffer. Cheap, targeted, and only ever taken when
   a gap demonstrably exists ahead of the playhead. */
const STALL_NUDGE_MS = 3000;
const MAX_STALL_NUDGES = 2;
/* Rung 2: abort and restart the hls load. Measured: hls.js clears its 10s
   time-to-first-byte timeout the moment response headers arrive and re-arms to
   maxLoadTimeMs = 120000, so a fetch whose headers landed and whose body then
   died — the cell-handoff signature — is something hls.js will sit on for two
   minutes. Eight seconds with zero bytes appended is enough to call it. */
const STALL_RELOAD_MS = 8000;
/* hls.js reporting a stall of its own is direct evidence, so act sooner. */
const STALL_RELOAD_CORROBORATED_MS = 5000;
const STALL_SIGNAL_FRESH_MS = 10000;
const MAX_STALL_RELOADS = 2;
/* Rung 3: rebuild the pipeline, through the SAME fullReattach the fatal-error
   handler uses. Sharing one bounded primitive is what stops the two recovery
   paths fighting each other. */
const STALL_REBUILD_MS = 20000;
/* Only after every rung above has been tried and failed. */
const STALL_TERMINAL_MS = 25000;
/* Two rungs must never fire on top of each other. */
const STALL_ACTION_GAP_MS = 2500;
/* The playhead legitimately stops dead at the end of an episode, which is not
   a stall. Deliberately this file's own constant rather than a borrowed one:
   the seek gestures keep a guard band of the same size for a different reason,
   and the two must be free to move apart. */
const STALL_TAIL_GUARD_S = 0.25;
/* A tick this late means the page was frozen or throttled, not that the video
   stalled. Nothing sampled across such a gap is usable. */
const FROZEN_TICK_MS = 2000;
/* hls.js error details that are a stall report rather than a passing hiccup.
   All of these arrive with fatal:false and were being dropped on the floor. */
const STALL_SIGNAL_DETAILS = new Set([
  "bufferStalledError", "bufferNudgeOnStall", "bufferSeekOverHole",
  "fragLoadTimeOut", "fragLoadError", "levelLoadTimeOut", "audioTrackLoadTimeOut",
]);

/* Start of the first buffered range that lies AHEAD of the playhead, or null
   when the playhead is already inside buffered data or nothing is buffered
   past it. A non-null answer is unambiguous evidence of the one failure a
   nudge fixes, which is why rung 1 is allowed to be the cheapest and earliest.
   hls.js has a GapController that does this, but it is inert here: it returns
   before doing anything while the buffer is empty, and its own stall report
   arrives fatal:false, which this component drops. */
function bufferGapAhead(vid: HTMLVideoElement): number | null {
  const b = vid.buffered;
  const t = vid.currentTime;
  for (let i = 0; i < b.length; i++) {
    const start = b.start(i);
    if (t >= start - 0.1 && t < b.end(i)) return null;
    if (start > t) return start;
  }
  return null;
}

/* Furthest buffered instant, or 0. Under MSE this is the INTERSECTION of the
   source buffers, so on this stream — whose master carries a separate audio
   rendition — a hung audio fragment pins it even while video keeps arriving.
   That is a stall the viewer experiences, and sampling it catches it. */
function bufferedEndOf(vid: HTMLVideoElement): number {
  const b = vid.buffered;
  return b.length ? b.end(b.length - 1) : 0;
}

/* ---- Seek gestures -------------------------------------------------
   ONE window separates tap, double-tap and hold. handleTap already used 300ms
   twice — once as the double-tap window, once as the delay before the deferred
   play/pause — so the hold threshold is that same number rather than a new one.
   A press shorter than the window is a tap, two of them inside it are a double
   tap, one held past it is a seek. Three gestures, one boundary, no overlap and
   nothing for a viewer to learn. */
const TAP_WINDOW_MS = 300;

/* How far a finger may drift before an ARMED hold is abandoned. Under this a
   press is stationary enough that the snap scroller will not claim the gesture;
   over it the viewer is swiping, and a swipe has to stay a swipe. Checked only
   before the hold engages — once it has, jitter under a resting thumb must not
   cancel a rewind, and a real swipe produces pointercancel anyway. */
const HOLD_SLOP_PX = 12;

/* Hold-to-seek travel. The playhead moves at HOLD_SEEK_MIN_RATE times real time
   the moment the hold engages and ramps to HOLD_SEEK_MAX_RATE across
   HOLD_SEEK_RAMP_MS, so a short hold nudges and a long one travels. Episodes in
   this catalogue run from about 29 seconds upward: 4x crosses a short one in a
   few seconds, 12x keeps a long one reachable without overshooting everything. */
const HOLD_SEEK_TICK_MS = 200;
const HOLD_SEEK_MIN_RATE = 4;
const HOLD_SEEK_MAX_RATE = 12;
const HOLD_SEEK_RAMP_MS = 2000;

/* Never land the playhead exactly on the duration. `ended` fires there, and
   `ended` is what auto-advances the feed — so a scrub to the far right of the
   bar would throw the viewer onto the next slide, which on the last free
   episode is the paywall. Stopping a quarter-second short means a deliberate
   scrub to the end still finishes the episode by PLAYING those last frames,
   exactly as watching it through does, rather than by teleporting past them. */
const SEEK_END_GUARD_S = 0.25;

/* Throttle for currentTime writes during a drag. Every write here is a real HLS
   seek — backBufferLength is 0, so a rewind always lands unbuffered and hls.js
   aborts the in-flight fragment to serve it. The bar still follows the finger
   at full rate; only the media seek is rate-limited. */
const SCRUB_WRITE_MS = 100;

/* mm:ss for the scrub and hold readouts. */
function formatClock(seconds: number): string {
  const s = Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}:${rem < 10 ? "0" : ""}${rem}`;
}

/* Stable no-op for the props the inactive slides get. An inline `() => {}` is a
   new identity on every parent render, and the slide's timeupdate effect lists
   these in its dependency array — so the inline form re-registered listeners on
   every one of the ~4 progress renders a second. */
const noop = () => {};

function EpisodeSlide({
  episode,
  seriesSlug,
  posterUrl,
  isActive,
  isNear,
  isNext,
  onUnmuteRefused,
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
  backHref,
}: {
  episode: FeedEpisode;
  seriesSlug: string;
  posterUrl: string;
  isActive: boolean;
  isNear: boolean;
  /** The slide one swipe ahead. It prefetches so the swipe starts instantly. */
  isNext: boolean;
  /** Called when WebKit refuses an unmute, so the feed's state can tell the truth. */
  onUnmuteRefused: () => void;
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
  /** Where the failure state sends a viewer who gives up. The action rail can
      be hidden when a slide never resolves, so the error must carry its own
      exit rather than relying on the back arrow being visible. */
  backHref: string;
}) {
  const videoBoxRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<HlsType | null>(null);
  const attachedRef = useRef(false);
  const mutedRef = useRef(muted);
  /* True once WebKit has refused an automatic unmute on THIS element. Every
     automatic attempt checks it, so a refusal is asked once and not churned:
     re-asking pauses the element again on each try, and each restore is another
     play() on a decoder that is already under pressure. Cleared only when the
     viewer explicitly unmutes, because that tap is a fresh gesture and a fresh
     gesture is the one thing WebKit always honours. */
  const unmuteRefusedRef = useRef(false);
  /* Previous value of the `muted` prop, so the sync effect below can tell an
     explicit unmute (true -> false, which only toggleMute produces) from the
     mount pass of a feed that simply starts with sound on. */
  const prevMutedRef = useRef(muted);
  const [sourceReady, setSourceReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  // True once playback has begun; stays true through pauses so the paused frame
  // remains visible (no black poster flash on pause). Reset only on teardown.
  const [started, setStarted] = useState(false);
  /* Ref mirror of `started`. The ended listener's effect deliberately does not
     depend on it, so reading the state directly there would capture whatever it
     was when the listener was attached. */
  const startedRef = useRef(false);
  const [, setLoading] = useState(false);
  const [showPause, setShowPause] = useState(false);
  const pauseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTap = useRef(0);
  /* The deferred play/pause from handleTap, held so a hold that engages after
     the tap can cancel it. Without the handle it fired 300ms later and paused
     the video the viewer was in the middle of rewinding. */
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /* X1: a press-and-hold that ends without the finger moving still dispatches
     `click` on iOS, and `click` is what handleTap listens to. Set when a hold
     takes the gesture, cleared on the next pointerdown, read at the top of
     handleTap — otherwise every hold-to-rewind ended by pausing the episode. */
  const gestureConsumedRef = useRef(false);
  /* Hold-to-seek state. `null` between gestures; `engaged` flips once the press
     has outlasted TAP_WINDOW_MS and the seek has actually started. */
  const holdRef = useRef<{
    pointerId: number;
    dir: -1 | 1;
    x: number;
    y: number;
    engaged: boolean;
    engagedAt: number;
    /** Was the video playing when the hold took over? Only then does it resume. */
    resume: boolean;
  } | null>(null);
  const holdArmRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdTickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const holdAbortRef = useRef<AbortController | null>(null);
  /* The readout is written straight into the DOM. Driving it through state
     would re-render this slide five times a second for the length of the hold,
     on the memory-constrained phones documented in
     docs/handoff/IOS-CONTENT-PROCESS-CRASH.md. */
  const holdLabelRef = useRef<HTMLSpanElement>(null);
  const holdLabelTextRef = useRef("");
  const [holdSeekDir, setHoldSeekDir] = useState<-1 | 0 | 1>(0);
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
  /* Non-null whenever the source could not be resolved for a reason that is
     NOT an entitlement answer. Drives the visible failure state. */
  const [sourceError, setSourceError] = useState<{ status: number; message: string } | null>(null);
  /* True while the browser says it is stalled and the stall has lasted long
     enough to be worth telling the viewer about. */
  const [buffering, setBuffering] = useState(false);
  useEffect(() => { sourceErrorRef.current = sourceError; }, [sourceError]);
  const forceSourceRefreshRef = useRef(false);
  const sourceRefreshInFlightRef = useRef(false);
  const protectedRefreshCountRef = useRef(0);
  const refreshResumePositionRef = useRef(0);
  /* Stall ladder state. All refs on purpose: this samples four times a second
     and the parent already re-renders on progress, so putting any of it in
     React state would multiply that across every mounted slide on exactly the
     memory-constrained phones documented in
     docs/handoff/IOS-CONTENT-PROCESS-CRASH.md. */
  const stallSinceRef = useRef(0);
  const stallSampleRef = useRef({ ct: -1, be: -1 });
  const stallNudgeCountRef = useRef(0);
  const stallReloadCountRef = useRef(0);
  const stallActionAtRef = useRef(0);
  const stallSignalAtRef = useRef(0);
  const selfSeekAtRef = useRef(0);
  const rafBeatRef = useRef(0);
  /* Mirror of `buffering` so the 2Hz sampler can tell a transition from a
     repeat and only call setState on the edges. */
  const bufferingRef = useRef(false);
  /* Mirror of `sourceError`, so the sampler can see it without being torn down
     and rebuilt every time it changes. */
  const sourceErrorRef = useRef<{ status: number; message: string } | null>(null);
  /* True across a rebuild the ladder itself ordered, so the spinner survives it.
     The rebuild changes this effect's deps, and the teardown would otherwise
     clear the spinner and leave a bare black frame until the fresh pipeline
     stalled long enough to earn it back. */
  const rebuildingRef = useRef(false);

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
        setSourceError(null);
        sourceRefreshInFlightRef.current = false;
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        sourceRefreshInFlightRef.current = false;
        setAuthorizedSource(null);
        /* 401 and 402 are answers, and the paywall handles them. EVERY other
           failure used to land here and do nothing at all: no state, no
           message, no retry. The slide simply kept its null source, the attach
           effect returned on its first line, and the stall watchdog could not
           fire because it requires a ready source. The viewer was left on a
           black frame with no way out, which is exactly what a 503 from the
           playback route produces when signing config is incomplete. */
        if (error instanceof PlaybackAccessError && error.isEntitlement) {
          setSourceError(null);
          onAccessDenied();
          return;
        }
        setSourceError({
          status: error instanceof PlaybackAccessError ? error.status : 0,
          message:
            error instanceof PlaybackAccessError && error.status === 504
              ? "This is taking longer than usual."
              : "We could not load this episode.",
        });
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
      startedRef.current = false;
      startedRef.current = false;
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
      /* THIS is where a poster tap gets its sound, and it is the only place on
         the site that can.

         The instant player was created by the tap itself (lib/instant-player),
         and it is ALREADY PLAYING by the time we get here — so an unmute needs
         only the audio-rate-change permission, not a play permission, and this
         line runs in the first pre-paint commit after the navigation: the
         closest to that tap in wall-clock time that any code in this component
         ever gets. Waiting for the activation effect instead costs the
         sourceReady round trip plus the play() resolve, measured at ~450ms on
         the slide that matters most, and spends a budget WebKit counts in
         whole seconds.

         A cold attach cannot do this. It has no element yet, nothing is
         playing, and autoplay policy forces the muted-then-unmute dance in
         tryPlay below. The adopted element is the one entry path that carries
         a gesture across the navigation, which is exactly the path a poster
         tap takes — the way nearly every viewer starts watching. */
      if (!mutedRef.current) {
        const wasPlaying = !vid.paused;
        vid.muted = false;
        /* Refused: WebKit pauses the element synchronously rather than letting
           it play unheard. Keep the picture, tell the feed the truth so the
           speaker icon does not claim sound over silence, and do not ask
           again until the viewer taps. */
        if (wasPlaying && vid.paused) {
          vid.muted = true;
          unmuteRefusedRef.current = true;
          onUnmuteRefused();
          vid.play().catch(() => {});
        }
      }
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
        /* The instant player is deliberately uncapped: its element is 2px
           until adoption, so capLevelToPlayerSize would have pinned it to the
           lowest rendition (lib/instant-player.ts). The element is full size
           NOW, so the reason to stay uncapped has expired. Without this, a
           poster tap, which is the single most common way into the player,
           decoded uncapped 1080p for the entire watch while only cold deep
           links got the cap. P1 was shipped and was not binding on the path
           almost everyone takes. */
        ahls.config.maxDevicePixelRatio = 1;
        /* Assign the INSTANCE property, not config. hls.js exposes
           capLevelToPlayerSize as a setter that calls
           capLevelController.startCapping(); writing config directly sets the
           flag and starts nothing, which is a silent no-op. maxDevicePixelRatio
           is read lazily out of config when the cap is computed, so setting it
           on config first is correct and is what makes the cap bind on a
           3x-DPR phone at all. */
        ahls.capLevelToPlayerSize = true;
        /* Remove the instant player's handler before installing this one, BY
           IDENTITY. lib/instant-player.ts registers an ERROR handler at
           construction and this adds a second, so after adoption ONE instance
           carried TWO, and a single fatal media error triggered two
           recoverMediaError rebuilds instead of one: an allocation burst at
           exactly the moment memory is tight. That is P2 in
           docs/handoff/IOS-CONTENT-PROCESS-CRASH.md.

           The first cut of this fix called ahls.off(Events.ERROR) with no
           listener, and that was worse than the bug. hls.js subscribes its own
           controllers to ERROR on this same emitter (21 call sites in
           hls.js/dist/hls.js), and eventemitter3 treats off(event) with no
           handler as removeAllListeners. It therefore deleted
           BufferController.onError and StreamController.onError too, taking
           reduceLengthAndFlushBuffer, flushMainBuffer and recoverWorkerError
           with them. Those are hls.js's memory-shedding responses to
           BUFFER_FULL_ERROR and INTERNAL_EXCEPTION, and they were removed from
           the one instance that is also playing uncapped. Scope the removal. */
        if (adopted.onError) ahls.off(AdoptedHls.Events.ERROR, adopted.onError);
        ahls.on(AdoptedHls.Events.ERROR, (_e: string, data: { type: string; fatal: boolean; details?: string }) => {
          if (!data.fatal) {
            if (STALL_SIGNAL_DETAILS.has(data.details ?? "")) {
              stallSignalAtRef.current = performance.now();
            }
            return;
          }
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
        if (frameAlreadyReady) { startedRef.current = true; setStarted(true); }
      });
      // A frame is already decoded → reveal the movie in this same pre-paint
      // pass (the poster never appears). Otherwise reveal on first frame.
      if (!frameAlreadyReady) onFirstFrame(vid, () => { startedRef.current = true; setStarted(true); });
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
    /* iOS requires muted for autoplay — but ONLY for an element that has to be
       started. An adopted instant player is already playing and may already be
       audible, because the adoption above unmuted it while the poster tap was
       still fresh. Muting it here and unmuting again in the play() promise
       throws that away and re-asks WebKit ~450ms later, outside the window that
       made the first answer a yes. A second ask can be refused, and a refusal
       pauses the element, so the blanket mute could turn a working audible
       slide into a silent one. Leave an already-audible element alone; every
       other path still starts muted, exactly as the policy demands. */
    const alreadyAudible = !vid.muted && !vid.paused;
    if (!alreadyAudible) vid.muted = true;
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

        /* UNMUTE HERE, NOT IN THE FRAME CALLBACK. This one line of placement is
           the difference between sound and silence for most of a session.

           Autoplay must start muted, so every slide has to unmute afterwards,
           and WebKit only permits that without a fresh tap inside a grace
           window: one second of wall clock, armed by the previous episode's
           `ended` event, tested as
           `m_userActivatedMediaFinishedPlayingTimestamp + 1_s >= now()`.

           The unmute used to sit inside onFirstFrame, so it spent that entire
           budget waiting for requestVideoFrameCallback. Measured on an iOS 26.3
           simulator against the real stream: `ended` to the observer firing on
           the next slide is 202ms and the scroll settles at 395ms; a cold slide
           then costs a React commit (~33ms), the play() resolve (~453ms) and
           the frame callback (~506ms), reaching the unmute at ~1194ms. That is
           194ms past the wall. WebKit refuses, pauses the element
           synchronously, and the fallback below re-mutes it. Worse, an element
           whose unmute was refused never arms the grace for the NEXT episode,
           so one overrun kills the chain and every later episode plays silent.

           Removing the frame-callback wait puts the same cold slide at ~688ms,
           with 312ms of margin. A prefetched slide goes from ~300ms to ~240ms.
           That is exactly the reported shape: sound on the first few, silence
           from the first cold slide onward.

           This is also what every other player on the site already does.
           ShortsFeed unmutes inside its play() promise, CreatorWatch on the
           statement after `await vid.play()`, HorizontalFeed never mutes at
           all. EpisodeFeed was the only player gating AUDIO on a composited
           frame, and the only one with this bug.

           The poster crossfade stays in onFirstFrame below, because that
           genuinely does need real pixels. Only the audio moved. */
        /* A refusal only stands while the element still lacks permission. Once
           a swipe has claimed the gesture for it, the reason the refusal
           happened is gone and it is asked again. */
        if (vid.dataset.verzaGestureClaimed === "1") unmuteRefusedRef.current = false;
        if (!mutedRef.current && !unmuteRefusedRef.current) {
          vid.muted = false;
          /* iOS pauses a muted-autoplayed element when the unmute is refused.
             Keep the picture by restoring muted playback — but tell React the
             truth as well. The old fallback left `muted` state false while the
             element was muted, so the speaker icon showed sound over silence
             and the viewer's first tap MUTED an already-silent video instead of
             restoring it. Syncing the state means one tap fixes it, and the tap
             itself is a fresh user gesture, which is the one thing WebKit
             always accepts. */
          if (vid.paused) {
            vid.muted = true;
            unmuteRefusedRef.current = true;
            onUnmuteRefused();
            vid.play().catch(() => {});
          }
        }

        // Don't set started yet — wait for the first actual frame to be
        // composited so the poster stays visible until real pixels are ready.
        onFirstFrame(vid, () => {
          startedRef.current = true;
          setStarted(true);
        });
        trackEpisodeStart(seriesSlug, episode.number);
      }).catch(() => {});
    }
  }, [isResumeTarget, resumePositionS, seriesSlug, episode.number, onUnmuteRefused]);

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
    startedRef.current = false;
    setStarted(false);
    setAttachNonce((n) => n + 1); // re-runs the attach effect
  }, []);

  /* Retry the source. Clears the error so the UI leaves the failed state, then
     bumps the nonce the resolution effect depends on, forcing a fresh request
     that bypasses the cache.

     The nonce alone was a no-op on precisely the episodes it mattered most for.
     Only the authorized-source effect reads it, and that effect returns on its
     first line when `requiresAuthorization` is false — which is every free
     preview episode, i.e. the first thing every new viewer taps and the exact
     episode in the founder's screenshot. The button cleared the overlay and
     changed nothing behind it, so the same frozen pipeline was still there.

     A tap is a human asking for another go, so it also hands the recovery
     ladder a fresh budget and rebuilds the pipeline for real. That cannot loop:
     it costs a deliberate press each time. */
  const retrySource = useCallback(() => {
    setSourceError(null);
    stallSinceRef.current = 0;
    stallSampleRef.current = { ct: -1, be: -1 };
    stallNudgeCountRef.current = 0;
    stallReloadCountRef.current = 0;
    stallActionAtRef.current = 0;
    reattachCountRef.current = 0;
    mediaRecoveriesRef.current = 0;
    audioSwappedRef.current = false;
    protectedRefreshCountRef.current = 0;
    fullReattach();
    forceSourceRefreshRef.current = true;
    setSourceRequestNonce((n) => n + 1);
  }, [fullReattach]);

  /* Source watchdog. The stall watchdog below cannot help here because it
     requires sourceReady, and the whole failure being guarded is that a source
     never arrives. If this slide is active and still has nothing to play after
     a grace period, say so and offer a retry rather than holding a black frame
     indefinitely. Covers the cases no catch can see: a request that resolves
     to nothing, an effect that never ran, a state update lost to a race. */
  useEffect(() => {
    if (!isActive || blocked || hlsUrl || sourceError) return;
    const t = setTimeout(() => {
      setSourceError({ status: 0, message: "We could not load this episode." });
    }, 12000);
    return () => clearTimeout(t);
  }, [isActive, blocked, hlsUrl, sourceError]);

  /* ---- Recovery ladder, and only then the failure screen --------------
     This replaces two effects that used to sit here: an event-armed watchdog
     that declared failure after 20 seconds, and a separate interval that
     rebuilt the pipeline. They disagreed, and the one that declared failure
     won. The rebuild stood itself down the moment ANY data had landed
     ("data flowing — just slow, not dead") while the failure timer had no such
     condition and fired anyway, so the exact state the code called "slow, not
     dead" was the state in which the only thing that ran was the code that
     declared it dead. One ladder replaces both, and it always ACTS before it
     ever speaks.

     WHY THE OLD ONE FIRED ON A HEALTHY EPISODE. It armed on `waiting`, and
     `waiting` is not a stall. Measured against this exact stream in Chrome over
     CDP: attachMedia, then play() on the next line — which is what this
     component does, because sourceReady flips immediately after attachMedia —
     fires `waiting` at t=16ms at readyState 0 with nothing buffered. The
     20-second terminal countdown was therefore armed on EVERY cold start
     before a single byte existed, and its only escape was a composited frame
     plus a moving playhead inside 20 seconds. Missing that once on a phone
     that has just changed cell is ordinary; the founder's episode is 76
     seconds long, so the old deadline was a quarter of the runtime.

     Nothing else could have intervened either. hls.js clears its 10s
     time-to-first-byte timeout the instant response headers arrive and re-arms
     to maxLoadTimeMs = 120000, so a fragment whose headers landed and whose
     body then died is something hls.js sits on for two minutes. Its own stall
     report arrives fatal:false, and the handler below dropped every non-fatal
     error on its first line. The escalation always won the race because it was
     the only runner.

     WHAT IT MEASURES NOW. currentTime and the end of the buffered range,
     sampled four times a second. That is engine-independent, which matters:
     the same CDP run showed Chrome emitting a `timeupdate` that did NOT move
     the playhead in the middle of a real 19-second freeze, which the old
     watchdog accepted as recovery — no spinner, no message, a frozen picture
     for the rest of the run. One engine escalated a non-stall, the other
     swallowed a real one. Sampling progress gets both right.

     WHAT IT DOES BEFORE IT SPEAKS. Nudge the playhead over a demonstrated
     buffer gap, restart the hls load, rebuild the pipeline — cheapest first,
     each bounded, with a gap between rungs so two never fire together. The
     rebuild is the SAME fullReattach the fatal-error handler calls, sharing its
     two-attempt budget, so the two recovery paths cannot fight or loop. The
     message is only what is left when every rung has been tried and failed.

     OCCLUSION. document.hidden was not enough. It is false while iOS shows
     Control Center, Notification Center, the app-switcher card, an incoming
     call or Siri, and false for a WKWebView whose host app is not fully
     backgrounded — in all of which WebKit suspends the media pipeline. It is
     also false at the one moment that matters most for a timer: iOS freezes
     JS timers for a backgrounded page and runs the overdue ones on resume, so
     the old 20s timer could be armed, backgrounded, and fire the instant the
     viewer came back to a working app. Two extra signals close that. A tick
     that arrives late means timers were frozen. A tick across which no
     animation frame was served means the page was not being composited, so
     nobody was looking at it. Either one throws the sample away instead of
     counting it as a stall. */
  useEffect(() => {
    if (!isActive || blocked) return;

    stallSinceRef.current = 0;
    stallSampleRef.current = { ct: -1, be: -1 };
    stallNudgeCountRef.current = 0;
    stallReloadCountRef.current = 0;
    stallActionAtRef.current = 0;
    rebuildingRef.current = false;

    /* Liveness beat. Its VALUE is never used — only whether it advanced, which
       is the difference between "the video stopped" and "the page stopped". */
    let beatHandle = requestAnimationFrame(function pump() {
      rafBeatRef.current += 1;
      beatHandle = requestAnimationFrame(pump);
    });

    const standDown = () => {
      stallSinceRef.current = 0;
      if (bufferingRef.current) { bufferingRef.current = false; setBuffering(false); }
    };
    /* Also drop the baseline: a sample taken before a freeze, a seek or a
       rebuild says nothing about the situation after one. */
    const restart = () => { standDown(); stallSampleRef.current = { ct: -1, be: -1 }; };

    /* A seek changes the whole situation and deserves a fresh budget — which
       matters more than it looks, because backBufferLength is 0, so every
       rewind lands unbuffered by construction. Rung 1 moves the playhead
       itself, so it must not hand itself a fresh budget and loop. */
    const onSeeking = () => {
      if (performance.now() - selfSeekAtRef.current < 500) return;
      restart();
    };
    /* A media-element error used to arm the terminal countdown with no recovery
       at all on a free episode: the only media-error recovery returns on its
       first line when requiresAuthorization is false, and after such an error
       no `playing` or `timeupdate` can ever fire, so the deadline was
       guaranteed. Now it is only evidence, and evidence makes the ladder act
       sooner rather than making it give up. */
    const onMediaError = () => { stallSignalAtRef.current = performance.now(); };
    const onVisibility = () => { restart(); };

    let lastTickAt = performance.now();
    let lastBeat = rafBeatRef.current;
    let blindTicks = 0;
    let trustFrames = true;

    const timer = setInterval(() => {
      const now = performance.now();
      const sinceTick = now - lastTickAt;
      const framesRan = rafBeatRef.current - lastBeat;
      lastTickAt = now;
      lastBeat = rafBeatRef.current;

      const vid = videoRef.current;
      if (!vid) return;

      /* The failure screen owns the slide once it is up, and "Try again" is the
         way out — it resets this ladder itself. Measured without this: the tick
         after the terminal turned the spinner state back on and left it on
         underneath the overlay forever, and the ladder kept rebuilding a
         pipeline nobody was watching. */
      if (sourceErrorRef.current) {
        if (bufferingRef.current) { bufferingRef.current = false; setBuffering(false); }
        return;
      }

      /* Not being watched, or not being measured. Either way this window is
         not evidence of anything. */
      const frozenTimers = sinceTick > FROZEN_TICK_MS;
      const notComposited = trustFrames && framesRan === 0;
      if (frozenTimers || notComposited || document.hidden) {
        /* Guard the guard. If frames genuinely never arrive on some engine the
           ladder would stand down forever and hand the viewer the silent black
           screen this whole path exists to prevent. Sustained absence while the
           document reports itself visible is not occlusion, so stop believing
           the signal and fall back to timers alone. */
        if (notComposited && !document.hidden && !frozenTimers) {
          blindTicks += 1;
          if (blindTicks > 240) trustFrames = false;
        }
        restart();
        return;
      }
      blindTicks = 0;

      /* States where a still playhead is correct, not a stall. */
      if (vid.paused || vid.ended) { restart(); return; }
      const dur = vid.duration;
      if (Number.isFinite(dur) && dur > 0 && vid.currentTime >= dur - STALL_TAIL_GUARD_S) {
        restart();
        return;
      }

      const ct = vid.currentTime;
      const be = bufferedEndOf(vid);
      const prev = stallSampleRef.current;
      stallSampleRef.current = { ct, be };
      /* Either the playhead moved or the buffer changed: something is working.
         Compared by magnitude, not direction, because a rewind legitimately
         shrinks the buffered range rather than growing it. */
      if (prev.ct < 0 || Math.abs(ct - prev.ct) > 0.01 || Math.abs(be - prev.be) > 0.01) {
        standDown();
        return;
      }

      if (!stallSinceRef.current) stallSinceRef.current = now;
      const stalled = now - stallSinceRef.current;

      if (stalled >= STALL_SPINNER_MS && !bufferingRef.current) {
        bufferingRef.current = true;
        setBuffering(true);
      }
      if (now - stallActionAtRef.current < STALL_ACTION_GAP_MS) return;

      /* Rung 1 — hop the hole. Only ever taken when one demonstrably exists. */
      if (stalled >= STALL_NUDGE_MS && stallNudgeCountRef.current < MAX_STALL_NUDGES) {
        const gap = bufferGapAhead(vid);
        if (gap !== null) {
          stallNudgeCountRef.current += 1;
          stallActionAtRef.current = now;
          selfSeekAtRef.current = now;
          try { vid.currentTime = gap + 0.1; } catch {}
          return;
        }
      }

      /* Rung 2 — abort the dead fetch and load again. startLoad() stops the
         in-flight fragment internally, which is the point: after this long with
         nothing appended, the request in flight is the problem, not the cure.
         It resumes from the current position, so nobody loses their place. */
      const corroborated = now - stallSignalAtRef.current < STALL_SIGNAL_FRESH_MS;
      const reloadAt = corroborated ? STALL_RELOAD_CORROBORATED_MS : STALL_RELOAD_MS;
      if (stalled >= reloadAt && stallReloadCountRef.current < MAX_STALL_RELOADS) {
        stallReloadCountRef.current += 1;
        stallActionAtRef.current = now;
        const hls = hlsRef.current;
        if (hls) {
          try { hls.startLoad(); } catch {}
        } else {
          /* Native HLS (no MSE): load() is the equivalent restart, but it
             rewinds to zero, so put the viewer back where they were. */
          const at = vid.currentTime;
          try { vid.load(); } catch {}
          if (at > 0.5) {
            vid.addEventListener(
              "loadedmetadata",
              () => { try { vid.currentTime = at; } catch {} },
              { once: true },
            );
          }
          vid.play().catch(() => {});
        }
        return;
      }

      /* Rung 3 — rebuild. Bounded at 2 inside fullReattach, and that budget is
         SHARED with the fatal-error handler, so the two paths cannot take four
         rebuilds between them or take turns forever. */
      if (stalled >= STALL_REBUILD_MS && reattachCountRef.current < 2) {
        stallActionAtRef.current = now;
        /* Keep the viewer's place across the rebuild, through the same ref
           tryPlay already honours for a token refresh. Without this a rebuild
           mid-episode would restart from zero — acceptable when the old
           rebuild only ran before the first frame, not acceptable now that the
           ladder also runs during a binge. */
        if (vid.currentTime > 0.5) refreshResumePositionRef.current = vid.currentTime;
        /* Hold the spinner across the rebuild. Without this the teardown below
           clears it and the viewer gets a bare black frame for the couple of
           seconds it takes the new pipeline to stall long enough to show it
           again — a regression this component has fought before. */
        rebuildingRef.current = true;
        if (!bufferingRef.current) { bufferingRef.current = true; setBuffering(true); }
        fullReattach();
        return;
      }

      /* Terminal. Reachable only once every rung above has been ATTEMPTED and
         the picture is still frozen well past the last of them. */
      if (
        reattachCountRef.current >= 2 &&
        stallReloadCountRef.current >= MAX_STALL_RELOADS &&
        stalled >= STALL_TERMINAL_MS
      ) {
        bufferingRef.current = false;
        setBuffering(false);
        setSourceError((existing) => existing ?? { status: 0, message: "This episode will not play." });
      }
    }, STALL_TICK_MS);

    const el = videoRef.current;
    el?.addEventListener("seeking", onSeeking);
    el?.addEventListener("error", onMediaError);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pageshow", onVisibility);

    return () => {
      clearInterval(timer);
      cancelAnimationFrame(beatHandle);
      el?.removeEventListener("seeking", onSeeking);
      el?.removeEventListener("error", onMediaError);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pageshow", onVisibility);
      if (bufferingRef.current && !rebuildingRef.current) {
        bufferingRef.current = false;
        setBuffering(false);
      }
    };
  }, [isActive, blocked, sourceReady, attachNonce, fullReattach]);

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
        /* Budget chosen at construction so a slide never spends its first
           moments on the wrong one. The effect below moves it between these
           two values as the slide becomes active or falls behind. */
        maxBufferLength: isActive ? ACTIVE_BUFFER_S : NEXT_SLIDE_PREFETCH_S,
        maxMaxBufferLength: isActive ? ACTIVE_MAX_BUFFER_S : NEXT_SLIDE_PREFETCH_S,
        backBufferLength: 0,
        enableWorker: true,
        startLevel: 0,
        capLevelToPlayerSize: true,
        /* Without this the cap above never binds. hls.js multiplies the element
           width by devicePixelRatio, and maxDevicePixelRatio defaults to
           Infinity, so on a DPR 3 iPhone a 393px element reports ~1179px, which
           is wider than every Mux rendition. No cap was ever applied and each
           attached pipeline pulled 1080p. Three pipelines of 1080p decode and
           buffer is what pushes an iPhone into jetsam, and jetsam killing the
           WebContent process is the "this page could not load" screen.
           Documented as P1 in docs/handoff/IOS-CONTENT-PROCESS-CRASH.md.
           Capping to the real element width selects roughly 480p/540p for a
           390px-wide phone, which is the resolution the pixels can show. */
        maxDevicePixelRatio: 1,
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
      hls.on(Hls.Events.ERROR, (_e: string, data: { type: string; fatal: boolean; details?: string }) => {
        /* Non-fatal used to mean "ignored". Measured on this stream with the
           connection throttled to a crawl: hls.js emitted bufferStalledError
           and then fragLoadTimeOut every ten seconds for the whole run, all
           fatal:false, and this line dropped every one of them while the
           terminal countdown ran underneath. They are the most direct evidence
           of a stall available, so record them for the ladder above. */
        if (!data.fatal) {
          if (STALL_SIGNAL_DETAILS.has(data.details ?? "")) {
            stallSignalAtRef.current = performance.now();
          }
          return;
        }
        if (!Hls) return;
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
      startedRef.current = false;
      startedRef.current = false;
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
      /* Resume buffering on the slide the viewer is actually watching, and give
         it back the full budget. It may have been stopped while it was a
         neighbour, or clamped to the small prefetch window while it was next. */
      try {
        const hls = hlsRef.current;
        if (hls) {
          hls.config.maxBufferLength = ACTIVE_BUFFER_S;
          hls.config.maxMaxBufferLength = ACTIVE_MAX_BUFFER_S;
          hls.startLoad();
        }
      } catch {}
    } else if (!isActive || blocked) {
      vid.muted = true;
      vid.pause();
      /* Stop the neighbour BUFFERING, not just playing — but NOT the slide the
         viewer is about to swipe to.

         The first version of this stopped every inactive pipeline, and that is
         why the second episode of a series opened on a black screen with a
         spinner on good wifi. The next slide attaches its pipeline and parses
         its manifest while you are still watching the current episode, and then
         this effect immediately stopped it, so it buffered nothing at all. The
         swipe then had to fetch segment one from scratch. The prefetch that
         makes a vertical feed feel instant was being cancelled by the code that
         was supposed to be protecting memory.

         Memory is bounded by maxBufferLength, which is the correct knob, not by
         refusing to load. The next slide is clamped to a few seconds: enough to
         paint a first frame the moment it becomes active, small enough that it
         costs a fraction of what an uncapped rendition used to. Renditions are
         capped now, so this is a much cheaper prefetch than it would have been
         before. Everything further away still stops dead. */
      const hls = hlsRef.current;
      if (hls && isNext && !blocked) {
        try {
          hls.config.maxBufferLength = NEXT_SLIDE_PREFETCH_S;
          hls.config.maxMaxBufferLength = NEXT_SLIDE_PREFETCH_S;
          hls.startLoad();
        } catch {}
      } else {
        try { hls?.stopLoad(); } catch {}
      }
      queueMicrotask(() => setPlaying(false));
    }
  }, [isActive, sourceReady, blocked, isNext, tryPlay]);

  /* Step 3: Sync muted prop instantly to video element.

     Muting is always permitted, so that half is a plain assignment. UNMUTING
     is a permission request, and this effect now makes one: with sound on by
     default it runs at mount, before any gesture this element can point to.
     WebKit answers a refusal by PAUSING the element, and the old one-liner had
     no idea that had happened — it left a frozen picture with the speaker icon
     still promising sound. Restore muted playback and report it instead. */
  useEffect(() => {
    const vid = videoRef.current;
    const prevMuted = prevMutedRef.current;
    prevMutedRef.current = muted;
    if (!vid) return;
    if (muted) { vid.muted = true; return; }
    /* true -> false only ever comes from toggleMute, i.e. from a finger.
       That is a fresh gesture, so a previous refusal no longer applies. */
    if (prevMuted) unmuteRefusedRef.current = false;
    else if (vid.dataset.verzaGestureClaimed === "1") unmuteRefusedRef.current = false;
    else if (unmuteRefusedRef.current) return;
    const wasPlaying = !vid.paused;
    vid.muted = false;
    if (wasPlaying && vid.paused) {
      vid.muted = true;
      unmuteRefusedRef.current = true;
      onUnmuteRefused();
      vid.play().catch(() => {});
    }
  }, [muted, onUnmuteRefused]);

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
        /* Device first, account second. The POST 401s for a signed-out viewer
           (app/api/watch-progress/route.ts:12-15), which is why a guest used to
           lose every second of a four-episode free preview. */
        recordWatchProgress({
          seriesSlug,
          episodeNumber: episode.number,
          progressSeconds: vid.currentTime,
          completed: false,
        });
      }
    }
    function onEnd() {
      if (!vid) return;
      /* Only treat this as a finished episode if the element actually played
         one. A media element with no resolved source — which is every paid
         slide until its authorized source arrives, and any slide whose HLS
         attach failed — can fire "ended" immediately, with duration 0 or NaN
         and currentTime 0. Advancing on that is what turned one blank slide
         into a runaway: the next slide was equally unresolved, fired "ended"
         just as fast, and the feed raced to the paywall with nothing visible.
         A real completion has a finite duration and a playhead at the end of
         it. Anything else is the element telling us it has nothing to play. */
      /* An episode that never showed a single frame cannot have finished.
         This is the guard that actually stops the runaway. The adjacency guard
         on the index only rejects JUMPS, and walking 5 to 60 is 55 perfectly
         adjacent steps, so it never applied. What produces those steps is a
         slide completing without ever playing: it advances, the next slide is
         equally dead, it completes too, and the counter climbs to the end of
         the series over a black screen.
         `started` flips only when a real frame is composited, so requiring it
         means a black slide can never advance the feed no matter what fires
         the event or why. */
      if (!startedRef.current) return;
      const duration = vid.duration;
      const playedToEnd =
        Number.isFinite(duration) && duration > 0 && vid.currentTime >= duration - 1.5;
      if (!playedToEnd) return;

      trackEpisodeComplete(seriesSlug, episode.number);
      onProgress(1);
      recordWatchProgress({ seriesSlug, episodeNumber: episode.number, progressSeconds: 0, completed: true });
      onEnded();
    }

    vid.addEventListener("timeupdate", onTime);
    vid.addEventListener("ended", onEnd);
    return () => {
      vid.removeEventListener("timeupdate", onTime);
      vid.removeEventListener("ended", onEnd);
    };
  }, [isActive, seriesSlug, episode.number, onEnded, onProgress, onPosition]);

  /* ------------------------------------------------------------------
     HOLD LEFT / RIGHT TO SEEK.

     Press and hold the left third of the slide to rewind, the right third to
     fast-forward, continuously while the finger is down. The middle third is
     left alone entirely, so the tap and double-tap the player already had keep
     the whole centre of the screen.

     Everything here is deliberately inside the SLIDE rather than the feed: the
     slide owns the <video>, so a seek is one assignment to currentTime and can
     never address the wrong element or the wrong episode. Seeking moves the
     playhead WITHIN this episode and nothing else — it does not scroll the
     rail, it does not touch activeIndex, and the clamp below keeps it off the
     duration so it cannot fire `ended` and advance the feed onto a locked
     slide.

     NOTHING in this path calls stopPropagation on a pointer or touch event.
     The feed registers claimGestureForMountedSlides on the scroll container as
     a passive bubble-phase listener, and that claim is the only reason sound
     survives past the first few episodes. A press that never reaches the
     container is a press that never claims the WebKit gesture.
     ------------------------------------------------------------------ */

  /* Clamp and write. Returns the position actually reached so the caller can
     paint it without re-reading a value the element may not have applied yet. */
  const seekTo = useCallback((targetS: number): number => {
    const vid = videoRef.current;
    if (!vid) return 0;
    const dur = vid.duration;
    if (!Number.isFinite(dur) || dur <= 0) return 0;
    const clamped = Math.max(0, Math.min(Math.max(0, dur - SEEK_END_GUARD_S), targetS));
    try {
      vid.currentTime = clamped;
    } catch {}
    return clamped;
  }, []);

  const paintHoldLabel = useCallback((positionS: number, durationS: number) => {
    const text = `${formatClock(positionS)} / ${formatClock(durationS)}`;
    holdLabelTextRef.current = text;
    if (holdLabelRef.current) holdLabelRef.current.textContent = text;
  }, []);

  /* The gesture's listeners live on WINDOW, not on the slide: a finger that
     lifts after drifting off this element still has to end the seek, and a
     swipe that turns into a scroll delivers pointercancel rather than
     pointerup. They are registered only while a hold is armed — there is no
     always-on pointermove listener on this route — and torn down through one
     AbortController so nothing depends on handler identity. */
  const endHoldSeek = useCallback(() => {
    if (holdArmRef.current) {
      clearTimeout(holdArmRef.current);
      holdArmRef.current = null;
    }
    if (holdTickRef.current) {
      clearInterval(holdTickRef.current);
      holdTickRef.current = null;
    }
    holdAbortRef.current?.abort();
    holdAbortRef.current = null;
    const hold = holdRef.current;
    holdRef.current = null;
    if (!hold || !hold.engaged) return;
    setHoldSeekDir(0);
    const vid = videoRef.current;
    /* Resume only what was playing. A hold that began on a paused video leaves
       it paused, which is what a viewer stepping through a scene expects.
       pointerup is itself a user gesture, so this play() is one WebKit accepts,
       and it never touches `muted` — the audio state the viewer chose survives
       the seek untouched. */
    if (vid && hold.resume) vid.play().catch(() => {});
  }, []);

  const onHoldPointerMove = useCallback(
    (e: PointerEvent) => {
      const hold = holdRef.current;
      if (!hold || hold.pointerId !== e.pointerId || hold.engaged) return;
      if (
        Math.abs(e.clientX - hold.x) > HOLD_SLOP_PX ||
        Math.abs(e.clientY - hold.y) > HOLD_SLOP_PX
      ) {
        /* Moved before the threshold: this is a swipe, not a hold. Stand down
           and leave the gesture to the snap scroller. */
        endHoldSeek();
      }
    },
    [endHoldSeek],
  );

  function engageHoldSeek() {
    holdArmRef.current = null;
    const hold = holdRef.current;
    const vid = videoRef.current;
    if (!hold || !vid || !isActiveRef.current || blockedRef.current) {
      endHoldSeek();
      return;
    }
    const dur = vid.duration;
    if (!Number.isFinite(dur) || dur <= 0) {
      endHoldSeek();
      return;
    }
    hold.engaged = true;
    hold.engagedAt = Date.now();
    hold.resume = !vid.paused;
    /* The release of this press must not reach handleTap. */
    gestureConsumedRef.current = true;
    if (tapTimer.current) {
      clearTimeout(tapTimer.current);
      tapTimer.current = null;
    }
    /* A hold is not half of a double tap. Clearing this stops the press that
       started it from pairing with the viewer's next tap and firing a Like. */
    lastTap.current = 0;
    /* Summon the chrome WITHOUT pausing. Until now the only way to bring the
       progress bar back was a tap, and that same tap toggled playback. */
    onReveal();
    haptic();
    try {
      vid.pause();
    } catch {}
    paintHoldLabel(vid.currentTime, dur);
    setHoldSeekDir(hold.dir);
    holdTickRef.current = setInterval(() => {
      const h = holdRef.current;
      const v = videoRef.current;
      if (!h || !h.engaged || !v || !isActiveRef.current || blockedRef.current) {
        endHoldSeek();
        return;
      }
      const d = v.duration;
      if (!Number.isFinite(d) || d <= 0) {
        endHoldSeek();
        return;
      }
      const held = Date.now() - h.engagedAt;
      const rate =
        HOLD_SEEK_MIN_RATE +
        (HOLD_SEEK_MAX_RATE - HOLD_SEEK_MIN_RATE) * Math.min(1, held / HOLD_SEEK_RAMP_MS);
      const reached = seekTo(v.currentTime + h.dir * rate * (HOLD_SEEK_TICK_MS / 1000));
      paintHoldLabel(reached, d);
    }, HOLD_SEEK_TICK_MS);
  }

  function handleSeekPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    /* Cleared here, never at the end of a gesture: a hold whose click is
       swallowed by the browser rather than by us would otherwise leave the flag
       set and eat the viewer's NEXT tap. */
    gestureConsumedRef.current = false;
    endHoldSeek();
    if (e.pointerType === "mouse" && e.button !== 0) return;
    if (!isActiveRef.current || blocked || sourceError) return;
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width <= 0) return;
    const rel = (e.clientX - rect.left) / rect.width;
    const dir: -1 | 0 | 1 = rel < 1 / 3 ? -1 : rel > 2 / 3 ? 1 : 0;
    if (dir === 0) return; // middle third stays pure tap / double-tap
    holdRef.current = {
      pointerId: e.pointerId,
      dir,
      x: e.clientX,
      y: e.clientY,
      engaged: false,
      engagedAt: 0,
      resume: false,
    };
    const abort = new AbortController();
    holdAbortRef.current = abort;
    window.addEventListener("pointermove", onHoldPointerMove, { passive: true, signal: abort.signal });
    window.addEventListener("pointerup", endHoldSeek, { signal: abort.signal });
    window.addEventListener("pointercancel", endHoldSeek, { signal: abort.signal });
    holdArmRef.current = setTimeout(engageHoldSeek, TAP_WINDOW_MS);
  }

  /* A slide that stops being active, or becomes paywalled, must not keep
     seeking under a finger the viewer has already moved on from. */
  useEffect(() => {
    if (!isActive || blocked) endHoldSeek();
  }, [isActive, blocked, endHoldSeek]);

  useEffect(() => {
    return () => {
      if (tapTimer.current) clearTimeout(tapTimer.current);
      if (pauseTimer.current) clearTimeout(pauseTimer.current);
      if (holdArmRef.current) clearTimeout(holdArmRef.current);
      if (holdTickRef.current) clearInterval(holdTickRef.current);
      holdRef.current = null;
      holdAbortRef.current?.abort();
      holdAbortRef.current = null;
    };
  }, []);

  /* Tap handler: single tap = pause, double tap = like */
  function handleTap(e: React.MouseEvent) {
    e.stopPropagation();
    /* X1. iOS dispatches `click` on the release of a stationary press however
       long it lasted, so without this every hold-to-seek ended in a pause. */
    if (gestureConsumedRef.current) return;
    onReveal();
    const now = Date.now();
    if (now - lastTap.current < TAP_WINDOW_MS) {
      // Double tap
      onDoubleTap();
      lastTap.current = 0;
      return;
    }
    lastTap.current = now;

    if (tapTimer.current) clearTimeout(tapTimer.current);
    tapTimer.current = setTimeout(() => {
      tapTimer.current = null;
      if (lastTap.current === 0) return; // was double tap, or a hold took over
      const vid = videoRef.current;
      // Read activeness via ref — the tap-time closure goes stale if the user
      // swipes inside the gesture window, and acting on it played/paused the
      // wrong slide.
      if (!vid || !isActiveRef.current) return;

      if (vid.paused) {
        // Genuine play gesture — opt the viewer into the resume reminder once.
        onFirstPlayGesture();
        vid.play().catch(() => {});
        setPlaying(true);
        // Reveal only once a real frame is composited — flipping `started`
        // immediately would fade the posters over a still-black video.
        onFirstFrame(vid, () => { startedRef.current = true; setStarted(true); });
      } else {
        vid.pause();
        setPlaying(false);
      }

      // Show pause/play indicator briefly
      setShowPause(true);
      if (pauseTimer.current) clearTimeout(pauseTimer.current);
      pauseTimer.current = setTimeout(() => setShowPause(false), 800);
    }, TAP_WINDOW_MS);
  }

  return (
    <div
      className="relative w-full select-none overflow-hidden"
      style={{ height: "var(--feed-h, 100dvh)", background: "#000", margin: 0, padding: 0 }}
      onClick={handleTap}
      /* No touch-action here, on purpose. A `touch-action` on the slide would
         take the whole video out of the vertical swipe surface, and the swipe
         IS the feed. Hold-to-seek needs a stationary finger, and a stationary
         finger never scrolls, so the two gestures do not compete for an axis.
         The horizontal rail declares `pan-x pinch-zoom` on the SCROLL
         CONTAINER, which is not a contradiction: there the feed's swipe is x,
         and that value is what keeps it the browser's to run. Nothing is ever
         declared on the slide, in either mode. */
      onPointerDown={handleSeekPointerDown}
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

      {/* Buffering. Deliberately quiet: the poster stays, and this sits on top
          of it so the viewer knows the app is working rather than dead. It only
          appears once a stall has lasted 1.5s, so a normal fast start never
          flashes it. */}
      {isActive && !blocked && buffering && !sourceError && (
        <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
          <div
            style={{
              width: 34, height: 34, borderRadius: "50%",
              border: "2.5px solid rgba(255,255,255,0.22)",
              borderTopColor: "rgba(255,255,255,0.9)",
              animation: "verzaSpin 0.8s linear infinite",
            }}
            role="status"
            aria-label="Loading"
          />
        </div>
      )}

      {/* Failure state. The poster holds during normal loading, so there is no
          spinner for the happy path, but a slide that cannot resolve a source
          must SAY so and offer a way out. Before this, every failure other than
          401/402 left a black frame with no message and nothing to tap. */}
      {isActive && !blocked && sourceError && (
        <div
          className="absolute inset-0 z-20 flex flex-col items-center justify-center px-8 text-center"
          style={{ background: "rgba(7,7,14,0.82)", backdropFilter: "blur(6px)" }}
          role="alert"
        >
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#F5F4F8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 14, opacity: 0.9 }}>
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <p className="text-[15px] font-bold mb-1" style={{ color: "#F5F4F8" }}>
            {sourceError.message}
          </p>
          <p className="text-[12px] mb-5" style={{ color: "rgba(255,255,255,0.55)" }}>
            {/* Only reassure about a purchase when there was one. Saying "your
                purchase is safe" on a free preview episode is confusing at
                best and looks like a billing error at worst. */}
            {episode.requiresAuthorization
              ? "Your purchase is safe. This is a playback problem on our side."
              : "This is a playback problem on our side, not something you did."}
          </p>
          <button
            type="button"
            onClick={retrySource}
            className="px-6 py-3 rounded-full text-[14px] font-bold cursor-pointer transition-transform active:scale-95"
            style={{ background: "linear-gradient(135deg, #E0115F, #8B5CF6)", color: "#fff", border: "none" }}
          >
            Try again
          </button>
          <a
            href={backHref}
            className="mt-3 text-[12px] no-underline"
            style={{ color: "rgba(255,255,255,0.6)" }}
          >
            Back to browsing
          </a>
        </div>
      )}

      {/* No spinner for the normal path: the poster holds until video plays. */}

      {/* Hold-to-seek readout. Mounts only while a hold is engaged, and its
          clock is written straight into the DOM by paintHoldLabel — putting the
          position in React state would re-render this slide five times a second
          for the length of the hold. */}
      {holdSeekDir !== 0 && (
        <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
          <div
            className="flex items-center gap-2 px-4 py-2 rounded-2xl"
            style={{
              background: "rgba(0,0,0,0.5)",
              backdropFilter: "blur(16px)",
              border: "1px solid rgba(255,255,255,0.12)",
              animation: "scaleIn 0.18s cubic-bezier(0.34, 1.56, 0.64, 1)",
            }}
            role="status"
            aria-label={holdSeekDir < 0 ? "Rewinding" : "Fast forwarding"}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="#fff"
              stroke="none"
              style={{ transform: holdSeekDir < 0 ? "scaleX(-1)" : undefined }}
            >
              <polygon points="4 5 12 12 4 19" />
              <polygon points="12 5 20 12 12 19" />
            </svg>
            <span
              ref={holdLabelRef}
              className="text-[13px] font-bold tabular-nums"
              style={{ color: "#fff" }}
            >
              {holdLabelTextRef.current}
            </span>
          </div>
        </div>
      )}

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
  episodes: allEpisodes,
  startEpisode,
  startPositionS: startPositionProp = 0,
  freeEpisodes,
  totalEpisodes,
  horizontal = false,
  backHref = "/",
}: EpisodeFeedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  /* The scrubber's 44px hit strip. It is a SIBLING of the scroll container, so
     nothing that happens on it bubbles into the rail — which is why the audio
     claim had to be called from it by hand, and why the cross-axis advance
     below has to be registered on it by hand too. Declared up here with the
     container because both of those registrations happen long before the
     scrubber's own block. */
  const scrubStripRef = useRef<HTMLDivElement>(null);

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
        const r = await fetch(
          `/api/unlock/confirm?session_id=${encodeURIComponent(id)}&slug=${encodeURIComponent(seriesSlug)}`,
          { signal: deadline.signal },
        );
        const d = (await r.json()) as { full?: boolean };
        return !!d.full;
      } catch {
        return false;
      }
    }

    /* Every request on this path gets a deadline. authResolved is what allows
       the paywall to mount, and it only becomes true in the finally() below.
       A fetch that hangs rather than rejecting, which is the normal shape of a
       flaky mobile network rather than an offline one, left authResolved false
       forever. A locked slide then rendered with no playbackId AND no paywall:
       a permanent black screen on a rail the viewer can keep scrolling. That
       is the reported symptom exactly. lib/playback-client.ts has had a 12s
       deadline for this reason; this path never got one. */
    const deadline = new AbortController();
    const deadlineTimer = setTimeout(() => deadline.abort(), ACCESS_REQUEST_TIMEOUT_MS);

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
        const r = await fetch(`/api/access?slug=${seriesSlug}`, { signal: deadline.signal });
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
    })().finally(() => {
      clearTimeout(deadlineTimer);
      if (!stale) setAuthResolved(true);
    });

    return () => { stale = true; deadline.abort(); clearTimeout(deadlineTimer); };
  }, [seriesSlug]);

  // Dismiss any visible paywall popup when auth resolves
  useEffect(() => {
    if (authFree) setShowUnlock(false);
  }, [authFree]);

  /* ---------------------------------------------------------------------
     THE RAIL IS BOUNDED BY WHAT THIS VIEWER CAN ACTUALLY WATCH.

     Until now the feed received every episode of the series and built a
     scroller that many viewports tall for everyone, entitled or not. A guest
     entitled to five episodes of a sixty-episode title got a rail sixty
     viewports deep, of which fifty-five were locked. A locked slide has no
     playbackId, so it renders as a black rectangle with no spinner and no
     error by design. That is why the counter could climb to sixty over a
     black screen: fifty-five accepted single steps is a legal traversal of
     the rail as it was built, and no guard on step size can catch it. The
     cooldown and the unattended-advance cap shipped earlier are real, but
     they bound the driver, not the track. This bounds the track.

     freeEpisodes was already being passed into this component and was read by
     nothing (it appeared exactly once, in the props interface).

     The bound is max(freeEpisodes, startIndex) + 1, so:
       - normal entry at episode 1: five playable slides plus one locked slide
         that mounts the paywall. There is nowhere to run to.
       - a deep link to a paid episode: the rail still reaches that episode, so
         the viewer lands where the URL pointed and meets the paywall there
         rather than being silently relocated.
       - entitled, or a wholly free title: the full series, unchanged.

     Before entitlement resolves we assume unentitled, which is the safe
     default and is invisible in practice because every in-app entry point
     lands on episode 1. When resolution grants access the rail extends
     downward while the viewer sits above the change, so the scroll position
     does not move. */
  const episodes = useMemo(() => {
    if (authFree) return allEpisodes;
    const startIdx = allEpisodes.findIndex((e) => e.number === startEpisode);
    // freeEpisodes + 1 = every free slide plus the one locked slide that
    // carries the paywall. A deep link past that boundary extends the rail
    // just far enough to include the episode the URL named, and no further,
    // so the paywall is the last thing on the track either way.
    const bound = Math.max(freeEpisodes + 1, startIdx + 1);
    return bound >= allEpisodes.length ? allEpisodes : allEpisodes.slice(0, bound);
  }, [allEpisodes, authFree, freeEpisodes, startEpisode]);

  /* WebKit refused an unmute on a slide. Bring the feed's state into line with
     the element so the speaker icon stops claiming sound over silence, and so
     the viewer's next tap RESTORES audio instead of muting an already-silent
     video. That tap is itself a fresh user gesture, which WebKit always
     honours, so it is the reliable way back. */
  /* Deliberately does NOT write verza-muted. A refusal is the platform's
     answer for one element in one moment; it is not something the viewer
     asked for, and it must never be recorded as if it were. That write was
     harmless while the feed defaulted to silence — it stored the value the
     default already had. With sound on by default it is a trap: verza-muted is
     shared with ShortsFeed, HorizontalFeed and Player, so a single refusal on
     a single slide would have silenced every player on the site for that
     viewer, permanently, and the founder's "it should just play" would have
     survived exactly one cold slide. Only toggleMute persists. */
  const handleUnmuteRefused = useCallback(() => {
    setMuted(true);
  }, []);

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
    // Deferred: a synchronous setState inside an effect cascades renders.
    if (activeIndex !== (idx >= 0 ? idx : 0)) queueMicrotask(() => setHasSwiped(true));
  }, [activeIndex, episodes, startEpisode]);
  const [muted, setMuted] = useState(() => {
    /* SOUND IS ON BY DEFAULT. Tapping a poster is the viewer asking to watch
       something, and a drama arriving silent reads as broken: the founder's
       report was that you should not have to turn the sound on. This is the
       switch. It only decides what the feed WANTS; the element still starts
       muted and the unmute is a request the platform can refuse, handled per
       slide above.

       It is a default, not an override. `=== "true"` means only an explicit
       stored preference mutes, so a viewer who pressed the speaker stays muted
       across sessions and across players — verza-muted is shared. `!== "false"`
       (the old test) inverted that: absence of a preference meant silence, so
       every first-time viewer was muted and had to find the button. Nothing
       writes "true" now except the viewer's own tap, so nothing but the viewer
       can turn this off.

       Guarded because localStorage does not merely return null when site data
       is blocked — accessing it THROWS. Safari's "Block All Cookies", Firefox's
       strictest mode and enterprise policy all do this. A throw inside a
       useState initialiser happens during render, so it propagated to the route
       error boundary and the player never mounted at all: the viewer got an
       error page instead of a video, for a preference read. The fallback is the
       default, because a viewer we cannot read a preference for is a viewer who
       has not expressed one. */
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem("verza-muted") === "true";
    } catch {
      return false;
    }
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
  /* The payment screen speaks the viewer's language. This is the only screen
     in the app where the language switcher is unreachable — app/globals.css
     hides the header under .episode-immersive — so the paywall cannot fall
     back on "they can change it themselves". */
  const { t, formatPrice, locale } = useTranslation();
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
  /* Long enough to cover a smooth scroll settling, short enough that a viewer
     watching very short episodes back to back never notices it. */
  const lastAdvanceAt = useRef(0);
  /* Consecutive automatic advances since the viewer last touched anything.
     A person watching several short episodes back to back is normal, so this is
     generous; a feed walking itself to the end of a 60 episode series is not. */
  const autoAdvanceRunRef = useRef(0);
  /* Any genuine interaction means a person is present and in control, so the
     unattended-advance run resets. Registered on the document rather than the
     container because a tap on the overlay chrome counts just as much as a
     swipe on the feed itself. */
  useEffect(() => {
    const reset = () => { autoAdvanceRunRef.current = 0; };
    const opts = { passive: true } as AddEventListenerOptions;
    document.addEventListener("pointerdown", reset, opts);
    document.addEventListener("touchstart", reset, opts);
    document.addEventListener("wheel", reset, opts);
    document.addEventListener("keydown", reset, opts);
    return () => {
      document.removeEventListener("pointerdown", reset, opts);
      document.removeEventListener("touchstart", reset, opts);
      document.removeEventListener("wheel", reset, opts);
      document.removeEventListener("keydown", reset, opts);
    };
  }, []);
  /* False until the observer has accepted one index. The first settle may be
     any distance (a deep link to episode 20); every one after it must be
     adjacent. */
  const hasSettledRef = useRef(false);
  activeIndexRef.current = activeIndex;

  /* Scroll-settle machinery. The index is derived from a position that has
     stopped moving, never from one still under momentum. */
  const inFlightRef = useRef(false);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /* The window's first index, mirrored for the settle handler: the scroll
     offset it reads is window-relative, so it needs the origin to convert. */
  const railStartRef = useRef(0);

  /* Re-engagement / Continue Watching: track the active video's live position
     so the visibilitychange handler can persist the exact resume spot. */
  const activePositionRef = useRef(0);
  const askedPermissionRef = useRef(false);

  const requestPermissionOnce = useCallback(() => {
    if (askedPermissionRef.current) return;
    askedPermissionRef.current = true;
    void maybeRequestResumePermission();
  }, []);

  /* Back returns to the tab this title belongs to.
     A full document navigation on purpose. router.replace() was tried here and
     silently did not navigate at all from the paywall — no RSC fetch, no URL
     change, no console error — so the tap did nothing and the viewer tapped
     again, which is exactly the reported symptom. location.replace fires on the
     first tap, every time.
     replace(), not an href assignment, so the episode's history entry is
     swapped for the tab and the browser Back button does not bounce the viewer
     straight back into the player they just left.
     The blank-tiles glitch after this navigation was never the navigation — it
     was the poster grid replaying its opacity-0 fade on a fresh document. That
     is fixed in BrowsePage's Poster, which now paints cached images instantly. */
  /* Mute and pause, then get out of the way and let the anchor navigate.
     This handler deliberately does NOT preventDefault, and does not drive the
     navigation itself. Both earlier versions did — router.replace() and then
     window.location.replace() — and both were intermittent from the paywall:
     the click cancelled the browser's own navigation and then sometimes failed
     to start its own, so the tap did nothing and the viewer tapped again. That
     is the reported symptom.
     The anchor's href is the navigation now. It cannot fail, it does not depend
     on React having hydrated, and it works on the first tap every time. The
     cost is one extra history entry instead of a replace, which is ordinary web
     behaviour and worth far less than a back button that works. */
  const handleBack = useCallback(() => {
    document.querySelectorAll("video").forEach((v) => {
      v.muted = true;
      v.pause();
    });
  }, []);

  const activeEp = episodes[activeIndex];

  /* Whether to show the free-run chip. Deliberately conservative: it is a
     promise about what the viewer still gets for nothing, so it must never
     appear to someone it does not apply to.
       - authResolved gates it, so an owner never sees "free episode 2 of 5"
         flash before their entitlement lands;
       - authFree hides it, because an owner has no free run, they have the lot;
       - a wholly free title hides it (freeEpisodes >= totalEpisodes): there is
         no boundary to warn about;
       - the locked slide hides it, because the paywall there is already saying
         something more specific and more useful. */
  const showFreeRunChip =
    authResolved &&
    !authFree &&
    !!activeEp &&
    activeEp.isFree &&
    freeEpisodes > 0 &&
    freeEpisodes < totalEpisodes;

  // Virtual window: only render 5 slides max (windowCenter ± 2).
  // The window recenters ONLY when scrolling is idle — mounting/unmounting
  // slides and resizing spacers ABOVE the scrollport mid-swipe retargeted the
  // in-flight snap scroll (first happens at the 4th video) and broke playback.
  /* ---------------------------------------------------------------------
     SCROLL SETTLE: the index is derived here, from a position that has
     stopped moving, and the flick is clamped to one slide.

     The IntersectionObserver above reports ratio crossings while momentum is
     still running. Those crossings are all adjacent and all legal, so a hard
     flick used to walk the index one accepted step per slide it passed. That
     walk is the runaway. Bounding the rail by entitlement removed the slides
     to run into on a paid title and left the mechanism untouched everywhere
     else — which is exactly why Red Carpet, whose two titles are wholly free
     and therefore get their full 12 and 13 slide rails, still reproduces it.

     scrollSnapStop: "always" is a hint, not a guarantee. iOS does not honour
     it through a momentum fling, so it cannot be the thing that enforces one
     flick equals one slide. This can, because it measures the landing rather
     than asking the platform to prevent it: if the feed came to rest more than
     one slide from where the finger went down, it is put back.
     --------------------------------------------------------------------- */
  const commitSettledIndex = useCallback(() => {
    const container = containerRef.current;
    if (!container || episodes.length === 0) return;

    const span = horizontal ? container.clientWidth : container.clientHeight;
    if (span <= 0) return;
    const offset = horizontal ? container.scrollLeft : container.scrollTop;

    /* The offset is WINDOW-relative now: the scrollport holds at most previous,
       current and next, so position 0/1/2 maps onto railStart + 0/1/2. */
    let idx = railStartRef.current + Math.round(offset / span);
    idx = Math.max(0, Math.min(episodes.length - 1, idx));

    /* The corrective clamp that used to live here is deleted, deliberately and
       not kept as a safety net. It measured the landing and put the scrollport
       back, which iOS does not reliably permit mid-flight, which is a visible
       jump when it does land, and which had a hole for a gesture starting
       before the previous scroll settled — repeated fast flicking, exactly the
       case that produced the slide-3-to-slide-12 report. A corrective clamp
       that can fire is a corrective clamp that can be seen firing. The runway
       is one slide long in each direction now, so there is nothing to correct:
       this arithmetic cannot produce a value more than one from where the
       gesture began, because no such scroll position exists. */
    inFlightRef.current = false;

    if (idx !== activeIndexRef.current) {
      hasSettledRef.current = true;
      activeIndexRef.current = idx;
      setActiveIndex(idx);
    }
  }, [episodes.length, horizontal]);

  /* ---------------------------------------------------------------
       KEEP THE SOUND ON PAST THE FIRST EPISODE.

       Reported: sound works from the poster tap and then switches itself off
       around the third or fourth video, after which the speaker button has to
       be pressed by hand.

       That is the tail of the fix that made the tap work at all. WebKit grants
       removeBehaviorRestrictionsAfterFirstUserGesture PER ELEMENT, for that
       element's lifetime, when play() is called on it during a user gesture.
       lib/instant-player.ts claims it for the element the poster tap creates,
       and EpisodeFeed adopts that exact element — so episode one is audible.

       Every later slide is a different <video>, created in an effect, with no
       such permission. Those elements can only be unmuted inside WebKit's
       one-second post-ended grace, and the moment one of them overruns it the
       unmute is refused; a refused element never arms the grace for the next
       one, so the chain dies and everything after is silent. Three or four
       episodes in is exactly where a cold slide first misses the window.

       A swipe IS a user gesture, and it happens on the element that is about
       to need the permission. So each touch claims it for every video
       currently mounted — at most three — the same way the poster tap claims
       it for the first. Non-active slides are returned to paused in the same
       breath; the permission is granted by the play() CALL, not by playing.
       Each element is claimed once, which is all its lifetime needs.

       Nothing here unmutes anything. It only removes the reason a later unmute
       would be refused, so the viewer's sound stays on until they turn it off
       themselves.

       HOISTED out of the scroll effect so the scrubber can call it too. The
       scrubber's hit strip is a SIBLING of the scroll container, not a
       descendant, so a press on it never bubbles to the listeners below — a
       viewer who drove the player from the bar alone would have starved the
       claim of touches and lost their sound. Calling it from there feeds the
       claim instead of bypassing it. The registration itself is unchanged:
       still passive, still on the container, still bubble phase. */
  const claimGestureForMountedSlides = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    for (const vid of Array.from(container.querySelectorAll("video"))) {
      if (vid.dataset.verzaGestureClaimed === "1") continue;
      vid.dataset.verzaGestureClaimed = "1";
      const wasPaused = vid.paused;
      try {
        const play = vid.play();
        if (play) {
          play
            .then(() => { if (wasPaused) vid.pause(); })
            .catch(() => {});
        }
      } catch {}
    }
    /* The claim is recorded ON THE ELEMENT, which is the one object both the
       feed and the slide can see. A slide that was refused earlier in the
       session treats its element gaining permission as superseding that
       refusal, so it will ask again rather than staying silent forever. */
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const armSettle = () => {
      if (settleTimer.current) clearTimeout(settleTimer.current);
      settleTimer.current = setTimeout(commitSettledIndex, SCROLL_SETTLE_MS);
    };
    const onScroll = () => {
      inFlightRef.current = true;
      armSettle();
    };
    const onScrollEnd = () => {
      if (settleTimer.current) clearTimeout(settleTimer.current);
      commitSettledIndex();
    };

    container.addEventListener("scroll", onScroll, { passive: true });
    container.addEventListener("scrollend", onScrollEnd);
    container.addEventListener("touchstart", claimGestureForMountedSlides, { passive: true });
    container.addEventListener("pointerdown", claimGestureForMountedSlides, { passive: true });
    return () => {
      if (settleTimer.current) clearTimeout(settleTimer.current);
      container.removeEventListener("scroll", onScroll);
      container.removeEventListener("scrollend", onScrollEnd);
      container.removeEventListener("touchstart", claimGestureForMountedSlides);
      container.removeEventListener("pointerdown", claimGestureForMountedSlides);
    };
  }, [commitSettledIndex, claimGestureForMountedSlides]);

  /* ---------------------------------------------------------------------
     CROSS-AXIS ADVANCE — the horizontal rail gets the other axis back.

     MEASURED, not reasoned. Storage Pirates, Chrome, the live component at
     both phone aspect ratios:

       390 x 844 (portrait)   overflow-y hidden  scrollHeight 844  clientHeight 844  → y extent 0
                              overflow-x auto    scrollWidth 780   clientWidth 390   → x extent 390
       844 x 390 (landscape)  overflow-y hidden  scrollHeight 390  clientHeight 390  → y extent 0
                              overflow-x auto    scrollWidth 1688  clientWidth 844   → x extent 844

     The rail exposes exactly ONE axis and it is x. There is no vertical scroll
     extent to reach in EITHER orientation, so a swipe up on this title has
     nowhere to go whichever way the phone is held. Rotating the phone does not
     change the geometry — it changes which gesture a person makes. Held
     upright they swipe up, because that is how every other title in this app
     advances, and nothing happens. Held sideways they swipe across, and the
     one axis that exists takes it. "You can only skip to the next show if the
     phone is horizontal" is an exact description of a rail that was never
     broken, only half built.

     So the rail is NOT moved onto the other axis. The native x scroll is the
     gesture that works today and it survives untouched — momentum, snap,
     recycle and all, in both orientations — and the missing axis is added
     alongside it. A vertical swipe steps the rail by exactly one slide through
     the same `[data-index]` + scrollIntoView("smooth") call auto-advance
     already makes, so this file still has ONE advance mechanism rather than
     two that can disagree.

     Everything below exists to make a double step impossible:
       - registered only when `horizontal`; the vertical feed never sees it;
       - the vertical component must dominate, so a diagonal the native
         scroller already served cannot also arrive here;
       - scrollLeft is re-read at the end of the gesture: if the browser moved
         the rail on its own axis, the browser wins and this stands down;
       - the step is taken from activeIndexRef, which only moves after the
         settle, so a second swipe arriving mid-scroll re-targets the SAME
         slide instead of stepping past it;
       - the target is clamped to `episodes`, the entitlement-bounded array, so
         this can no more cross the paywall than a native swipe can.
     --------------------------------------------------------------------- */
  const crossAxisRef = useRef<{ id: number; x: number; y: number; t: number; scroll: number } | null>(null);
  const crossAxisAdvancedAt = useRef(0);
  const wheelBurstRef = useRef<{ accum: number; scroll: number; timer: ReturnType<typeof setTimeout> | null }>({
    accum: 0,
    scroll: 0,
    timer: null,
  });

  /* One slide, one direction, through the same call auto-advance makes.
     Returns whether it actually moved, so callers only arm their cooldown on a
     step that happened. */
  const stepRail = useCallback(
    (dir: -1 | 1): boolean => {
      const container = containerRef.current;
      if (!container) return false;
      const target = activeIndexRef.current + dir;
      if (target < 0 || target >= episodes.length) return false;
      const el = container.querySelector(`[data-index="${target}"]`) as HTMLElement | null;
      if (!el) return false;
      el.scrollIntoView({ behavior: "smooth" });
      return true;
    },
    [episodes.length],
  );

  /* A vertical drag on this rail scrolls nothing natively, and a gesture that
     scrolls nothing is exactly the one a browser may still finish as a `click`
     — which on a slide is play/pause. Kill the next click in the CAPTURE phase
     on the container, which is an ancestor of every slide and of React's own
     delegated listener, so the slide's onClick never runs. Self-removing, and
     timed out so a swipe that produces no click cannot leave a trap armed for
     the viewer's next real tap. */
  const swallowNextClick = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const kill = (e: Event) => {
      e.stopPropagation();
      e.preventDefault();
      container.removeEventListener("click", kill, true);
      if (timer) clearTimeout(timer);
    };
    container.addEventListener("click", kill, true);
    timer = setTimeout(() => container.removeEventListener("click", kill, true), 500);
  }, []);

  useEffect(() => {
    if (!horizontal) return;
    const container = containerRef.current;
    if (!container) return;
    const strip = scrubStripRef.current;
    /* Captured once. The object behind this ref is never replaced — only its
       fields are written — so the local and the ref are the same latch, and
       the cleanup below is guaranteed to clear the timer it actually armed. */
    const burst = wheelBurstRef.current;

    /* `strict` drops the flick shortcut. touchend is the normal terminator;
       touchcancel is what a browser sends when it takes the gesture over, and
       accepting a cancel on distance alone keeps the advance working on a
       platform that claims vertical pans anyway, without letting a short
       system grab count as a swipe. */
    const attempt = (dy: number, dx: number, dt: number, startScroll: number, strict: boolean) => {
      const el = containerRef.current;
      if (!el) return;
      if (Math.abs(el.scrollLeft - startScroll) > CROSS_AXIS_NATIVE_SCROLL_PX) return;
      if (Math.abs(dy) <= Math.abs(dx) * CROSS_AXIS_DOMINANCE) return;
      const far = Math.abs(dy) >= CROSS_AXIS_ADVANCE_PX;
      const flick =
        !strict &&
        Math.abs(dy) >= CROSS_AXIS_FLICK_PX &&
        dt > 0 &&
        Math.abs(dy) / dt >= CROSS_AXIS_FLICK_VELOCITY;
      if (!far && !flick) return;
      const now = Date.now();
      if (now - crossAxisAdvancedAt.current < CROSS_AXIS_LOCK_MS) return;
      /* Up is forward, exactly as in the vertical feed: the content the viewer
         is pushing off the top is the one they are finishing. */
      if (!stepRail(dy < 0 ? 1 : -1)) return;
      crossAxisAdvancedAt.current = now;
      swallowNextClick();
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) {
        crossAxisRef.current = null;
        return;
      }
      const t = e.touches[0];
      crossAxisRef.current = {
        id: t.identifier,
        x: t.clientX,
        y: t.clientY,
        t: performance.now(),
        scroll: container.scrollLeft,
      };
    };

    const finish = (e: TouchEvent, strict: boolean) => {
      const start = crossAxisRef.current;
      crossAxisRef.current = null;
      if (!start) return;
      let end: Touch | null = null;
      for (const t of Array.from(e.changedTouches)) if (t.identifier === start.id) end = t;
      if (!end) return;
      attempt(end.clientY - start.y, end.clientX - start.x, performance.now() - start.t, start.scroll, strict);
    };
    const onTouchEnd = (e: TouchEvent) => finish(e, false);
    const onTouchCancel = (e: TouchEvent) => finish(e, true);

    /* Trackpad and mouse wheel. The rail only scrolls on x, so a two-finger
       vertical scroll — the way every other title advances on a laptop — has
       nowhere to go here either. Latched to one step per burst, and it stands
       down entirely if the browser turned the same wheel into a horizontal
       scroll of the rail, which some do. */
    const settleWheel = () => {
      burst.accum = 0;
      burst.timer = null;
    };
    const onWheel = (e: WheelEvent) => {
      const b = burst;
      if (b.timer) clearTimeout(b.timer);
      else {
        b.accum = 0;
        b.scroll = container.scrollLeft;
      }
      b.timer = setTimeout(settleWheel, WHEEL_BURST_QUIET_MS);
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX) * CROSS_AXIS_DOMINANCE) return;
      if (Math.abs(container.scrollLeft - b.scroll) > CROSS_AXIS_NATIVE_SCROLL_PX) return;
      b.accum += e.deltaY;
      if (Math.abs(b.accum) < WHEEL_STEP_PX) return;
      const dir: -1 | 1 = b.accum > 0 ? 1 : -1;
      b.accum = 0;
      const now = Date.now();
      if (now - crossAxisAdvancedAt.current < CROSS_AXIS_LOCK_MS) return;
      if (stepRail(dir)) crossAxisAdvancedAt.current = now;
    };

    /* Passive, every one of them. Nothing here may preventDefault: the native
       horizontal scroll is the gesture that already works and it must stay the
       browser's to run. */
    const opts = { passive: true } as AddEventListenerOptions;
    const surfaces: HTMLElement[] = strip ? [container, strip] : [container];
    for (const el of surfaces) {
      el.addEventListener("touchstart", onTouchStart, opts);
      el.addEventListener("touchend", onTouchEnd, opts);
      el.addEventListener("touchcancel", onTouchCancel, opts);
    }
    /* The strip is a scrub surface, not a wheel surface — a wheel over the bar
       belongs to the rail underneath it, which already receives this. */
    container.addEventListener("wheel", onWheel, opts);
    return () => {
      for (const el of surfaces) {
        el.removeEventListener("touchstart", onTouchStart);
        el.removeEventListener("touchend", onTouchEnd);
        el.removeEventListener("touchcancel", onTouchCancel);
      }
      container.removeEventListener("wheel", onWheel);
      if (burst.timer) clearTimeout(burst.timer);
      burst.timer = null;
      burst.accum = 0;
      crossAxisRef.current = null;
    };
  }, [horizontal, stepRail, swallowNextClick]);

  /* ---------------------------------------------------------------------
     THE SCROLLPORT IS THE RUNWAY, AND IT IS NOW ONE SLIDE LONG EACH WAY.

     Reported on a real iPhone after the settle handler shipped: Red Carpet
     reached slide 3 and jumped to slide 12. The settle handler was not
     malfunctioning — it was accurately reporting that the scrollport had
     already travelled there.

     The previous virtualization mounted a window of five components but left
     the scroll height at the FULL series length, because the two spacers
     either side summed to every un-mounted slide. From slide 3 of a 13-slide
     rail that is nine more viewports of runway, and a hard fling crosses them
     easily. Bounding the mounted components while leaving the runway full
     length bounds nothing that matters.

     Correcting the overshoot afterwards was the wrong architecture and is now
     deleted. Undoing momentum mid-flight is not something iOS reliably permits;
     any correction that does land is a visible jump, which is a broken app the
     user has watched being broken; and it had a hole for a gesture beginning
     before the previous scroll settled, which is exactly what repeated fast
     flicking is — the anchor is stale or null, the fling is treated as
     programmatic, and nothing clamps it. Landing on the last slide of the rail
     is the signature of that hole.

     So the scrollport now contains at most previous, current and next, and no
     spacers at all. Momentum has nowhere to go: one slide in each direction is
     the entire distance that exists. Slide 12 is unreachable from slide 3 by
     construction rather than by correction, and it stays unreachable whether or
     not scrollend exists, whether or not the anchor is stale, and whatever the
     platform does with scrollSnapStop.

     After the index settles the window is rebuilt around the new current slide
     and the scrollport is re-centred on it in the same commit. The pixels do
     not change across that swap — the slide the viewer is looking at simply
     moves from position 2 to position 1 while scrollTop drops by exactly one
     viewport — so the recycle is invisible.

     This costs nothing in prefetch: shouldLoad was already `isActive || isNear`
     with isNear meaning ±1, so the two extra mounted slides never loaded
     anything. They were runway and nothing else. */
  const railStart = Math.max(0, activeIndex - 1);
  railStartRef.current = railStart;
  const railEnd = Math.min(episodes.length - 1, activeIndex + 1);
  const windowStart = railStart;
  const windowEnd = railEnd;

  /* Re-centre after every recycle, before the browser paints. useLayoutEffect
     and "instant" are both load-bearing: a passive effect or a smooth scroll
     would let one frame through at the wrong offset, and that frame is the
     visible jump this whole change exists to remove. */
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const span = horizontal ? container.clientWidth : container.clientHeight;
    if (span <= 0) return;
    const target = (activeIndex - railStart) * span;
    const current = horizontal ? container.scrollLeft : container.scrollTop;
    if (Math.abs(current - target) <= 1) return;
    /* behavior: "instant" explicitly, and not merely inherited. The container
       opts out of the global smooth rule above, but stating it here means the
       recycle cannot silently start animating again if that style is ever lost,
       reordered or overridden. An animated recycle is a visible correction, and
       it emits scroll events that re-arm the settle timer while the viewer is
       already flicking again. */
    container.scrollTo(
      horizontal ? { left: target, behavior: "instant" } : { top: target, behavior: "instant" },
    );
  }, [activeIndex, railStart, horizontal, episodes.length]);

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
    /* One advance at a time. Even with the playback guard on "ended", two
       events landing in the same frame — a real completion racing a stray
       event from the adopted player, say — would issue two scrollIntoView
       calls and step the feed two slides. A short lock makes the advance
       idempotent within the window a smooth scroll takes to settle. */
    const now = Date.now();
    if (now - lastAdvanceAt.current < ADVANCE_COOLDOWN_MS) return;
    lastAdvanceAt.current = now;
    /* Circuit breaker. The reported failure is the counter climbing from
       episode 5 to 60 on its own over a black screen, then the tab dying. Every
       one of those steps is adjacent, so the adjacency guard never fired, and
       every one is spaced by the cooldown, so the cooldown never fired either.
       Neither bounds the TOTAL, which is the thing that was actually wrong.
       A viewer who genuinely watches this many episodes without touching the
       screen will have generated touch or scroll events long before here; any
       gesture resets the run. Hitting the cap means the feed is driving itself,
       so it stops rather than running to the end of the series. */
    if (autoAdvanceRunRef.current >= MAX_UNATTENDED_ADVANCES) return;
    autoAdvanceRunRef.current += 1;
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
    (allEntries: IntersectionObserverEntry[]) => {
      /* One decision per batch, made on the single most-visible slide.
         The loop used to act on every qualifying record and update the index
         ref as it went, so a batch of consecutive records walked the index
         forward one accepted step at a time — the adjacency guard passed on
         each hop and did not actually bound the total travel. Reducing the
         batch to its best entry first means a batch can move the feed by at
         most one slide, whatever the browser delivered. */
      let best: IntersectionObserverEntry | null = null;
      for (const entry of allEntries) {
        if (entry.intersectionRatio >= 0.55 && (!best || entry.intersectionRatio > best.intersectionRatio)) {
          best = entry;
        }
      }
      const entries = best ? [best] : [];
      for (const entry of entries) {
        // Gate on the RATIO, not isIntersecting: when the observer re-subscribes
        // after a window shift (first happens at the 4th video), the initial
        // callbacks report partially-visible neighbors as isIntersecting —
        // acting on those flapped activeIndex mid-swipe and paused playback.
        if (entry.intersectionRatio >= 0.55) {
          const idx = Number(entry.target.getAttribute("data-index"));
          if (!Number.isNaN(idx)) {
            /* Adjacency guard. The feed moves one episode at a time — by a
               swipe, or by an advance that scrolls exactly one slide. Nothing
               legitimate jumps two.
               On re-observe the browser delivers an initial callback for EVERY
               observed target, and the observer re-subscribes whenever the
               virtual window shifts, which first happens at the fourth video.
               Several of those callbacks can clear the ratio test in one batch,
               and each one used to be free to set a new index — so the episode
               number marched upward, faster as it went, which is precisely the
               reported symptom. Refusing any non-adjacent step makes the
               runaway impossible no matter what produced the batch.
               The very first settle is exempt: arriving deep-linked on episode
               20 legitimately reports an index far from wherever the container
               started, and rejecting that would strand the feed. */
            const prev = activeIndexRef.current;
            const firstSettle = !hasSettledRef.current;
            if (!firstSettle && prev !== idx && Math.abs(idx - prev) > 1) continue;

            /* THE RUNAWAY LIVED HERE, and the entitlement bound never touched
               it. This callback fires on ratio crossings, which happen
               CONTINUOUSLY while momentum is still carrying the container. A
               hard flick passes through slides in order, so every step it
               reports is adjacent and legal, and the adjacency guard above
               waves each one through: the index walks forward one legal step
               per slide the momentum crosses. That walk is what "the number
               spinning really fast" is.

               Bounding the rail removed the slides there were to run into on a
               paid title. It did nothing for a wholly free one — Red Carpet's
               two titles have freeEpisodes === episodeCount, so their rail is
               the full 12 and 13 slides and the mechanism is completely
               exposed. That is why the founder reproduces it there.

               The index is now owned by the settle handler below, which reads a
               position that has stopped moving. In flight, this callback may
               still do its visibility work but may NOT move the index. */
            if (inFlightRef.current && !firstSettle) continue;
            hasSettledRef.current = true;

            if (prev !== idx) {
              activeIndexRef.current = idx;
              setActiveIndex(idx);
              haptic();
              setEpProgress(0);
              setShowToast(true);
              if (toastTimer.current) clearTimeout(toastTimer.current);
              toastTimer.current = setTimeout(() => setShowToast(false), 1200);
            }

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
      /* Final flush. The device write inside recordWatchProgress is
         synchronous, so it lands even when the tab is killed before the
         keepalive request leaves — which is the case this whole handler
         exists for. */
      recordWatchProgress(
        {
          seriesSlug,
          episodeNumber: ep.number,
          progressSeconds: positionS,
          completed: false,
        },
        { keepalive: true },
      );
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

  /* The speaker ICON, unlike the audio itself, has to survive hydration.

     The two icons are structurally different SVGs — two <line>s against two
     <path>s — so a first client render that disagrees with the server is not a
     patchable attribute mismatch, it is "Hydration failed ... this tree will be
     regenerated on the client", measured in a scripted Chrome on this very
     route. The whole episode tree is thrown away and rebuilt, on the page where
     instant play lives.

     The preference is only knowable on the client, so the first client render
     must render what the SERVER rendered — the sound-on icon — and the real one
     only once hydration is finished. useSyncExternalStore is React's own way to
     say that: the hydrating render gets the server snapshot, and React
     re-renders with the client snapshot on its own afterwards. The AUDIO is not
     deferred: `muted` is correct from the very first render, so a viewer who
     chose silence gets silence, and only the drawing waits.

     This mismatch predates the sound-on default and was measured on both sides
     of it. It simply changed which viewers met it: with the old muted-first
     default it fired for everyone who had turned sound ON, and with this one it
     would have fired for everyone who had turned it OFF. Neither is acceptable
     on this route, so it is fixed rather than moved. */
  const hydrated = useSyncExternalStore(subscribeNever, snapshotHydrated, snapshotServer);
  const showMutedIcon = hydrated && muted;

  function toggleMute() {
    const next = !muted;
    setMuted(next);
    /* The ONLY writer of verza-muted, and now the only thing that can silence
       the feed for good. Guarded: setItem throws outright when site data is
       blocked, and an unguarded throw here skipped the haptic and escaped the
       click handler for what is only a preference save. The toggle itself must
       still work in that browser, it simply will not be remembered. */
    try { localStorage.setItem("verza-muted", String(next)); } catch {}
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

  /* ---- Saved / My List -------------------------------------------- */
  /*  The bookmark could be tapped over and over with no confirmation that
      anything had happened, and the list it feeds could stay empty while
      politely telling you to tap the bookmark. Three separate faults:

      1. Every side effect lived INSIDE the setIsSaved updater. React invokes
         an updater more than once (StrictMode does it deliberately), so the
         localStorage write and the network call were not guaranteed to run
         once per tap.
      2. The response was thrown away — `.catch(() => {})` on a promise whose
         result was never read. A signed-in viewer whose POST failed saw
         "Saved to My List" and then an empty list, which is the report.
      3. Mount read localStorage only. Signing in on a second device showed an
         empty bookmark for an already-saved title, so the next tap sent a
         DELETE and un-saved it on the account.

      Fixed by making the optimistic update real: state moves first, the toast
      says so, and if the account disagrees the state moves back and says that
      instead. A guest's 401 is NOT a failure — the device write is the whole
      point of the guest path, and it succeeded. */
  const [isSaved, setIsSaved] = useState(false);
  const saveSeqRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    // Local first so the icon is right on the first paint.
    const local = readSavedSlugs().includes(seriesSlug);
    queueMicrotask(() => { if (!cancelled) setIsSaved(local); });
    // Then the account, which outranks this device for a signed-in viewer.
    fetch("/api/saved-list")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { items?: { seriesSlug: string }[] } | null) => {
        if (cancelled || !data?.items || data.items.length === 0) return;
        setIsSaved(data.items.some((i) => i.seriesSlug === seriesSlug));
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [seriesSlug]);

  function toggleSave() {
    const next = !isSaved;
    const seq = ++saveSeqRef.current;

    // Optimistic, and durable on this device immediately.
    setIsSaved(next);
    setSavedSlug(seriesSlug, next);
    popActionToast(next ? "Saved to My List" : "Removed from My List");
    haptic();

    fetch("/api/saved-list", {
      method: next ? "POST" : "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ seriesSlug }),
    })
      .then((r) => {
        // A newer tap already superseded this one; its own response decides.
        if (seq !== saveSeqRef.current) return;
        // 401 = guest. The device write above IS the save for them, and
        // components/GuestStateSync.tsx hands it to the account at sign-in.
        if (r.ok || r.status === 401) return;
        setIsSaved(!next);
        setSavedSlug(seriesSlug, !next);
        popActionToast(next ? "Couldn\u2019t save \u2014 tap to try again" : "Couldn\u2019t remove \u2014 tap to try again");
      })
      .catch(() => {
        // Offline. The device kept it; do not lie about the account, but do
        // not throw away what the viewer just did either.
        if (seq !== saveSeqRef.current) return;
        popActionToast(next ? "Saved on this device" : "Removed on this device");
      });
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

  /* ==================================================================
     THE PROGRESS BAR IS A CONTROL.

     It was a 4px readout with pointer-events:none. It is now a slider: press
     anywhere along it and the video jumps there, drag and it follows the
     finger. Three things make that safe on this particular player.

     1. THE HIT AREA IS 44px TALL AND ONLY LIVE WHILE THE CHROME IS. A
        permanently live strip across the bottom of the screen would eat the
        band where thumbs start a vertical flick, and the flick is how the feed
        works. Gating it on showActionRail means the bar is grabbable exactly
        when it is visible — you can only grab what you can see — and the
        moment the chrome fades the whole band goes back to being swipe
        surface. The visual bar stays 4px; the strip around it is transparent.

     2. THE ELEMENT IS FOUND WITH THE TWO-BRANCH LOOKUP. The video for the
        arrival slide is the ADOPTED instant player, which is a <body> child
        pinned over the slide rather than a descendant of it — so a lookup that
        only searched the slide would silently do nothing on the poster-tap
        path, which is how nearly every viewer starts watching.

     3. IT NEVER LEAVES THE EPISODE. The only thing written is this element's
        currentTime, clamped into [0, duration - SEEK_END_GUARD_S]. It cannot
        move the rail, it cannot cross into a locked slide, and it is inert
        whenever the active episode is behind the paywall.
     ================================================================== */
  const scrubTrackRef = useRef<HTMLDivElement>(null);
  const scrubFillRef = useRef<HTMLDivElement>(null);
  const scrubbingRef = useRef(false);
  /* An armed but undecided press on the scrub strip: where it started and which
     pointer it belongs to. Null once the gesture resolves either way. */
  const scrubArmRef = useRef<{ x: number; y: number; id: number } | null>(null);
  const [scrubbing, setScrubbing] = useState(false);
  const scrubResumeRef = useRef(false);
  const scrubWroteAtRef = useRef(0);

  /* The established way to reach the video the viewer is actually watching.
     Same two branches as the fullscreen button, auto-advance and the
     visibility handler. */
  const getActiveVideo = useCallback((): HTMLVideoElement | null => {
    const container = containerRef.current;
    if (!container) return null;
    const slide = container.querySelector(`[data-index="${activeIndexRef.current}"]`);
    return (
      (slide ? slide.querySelector("video") : null) ??
      document.querySelector<HTMLVideoElement>("video[data-verza-fixed]")
    );
  }, []);

  /* While a drag is in flight the playhead must not fight the finger. The
     video keeps firing timeupdate as each seek lands, and letting those through
     would snap the bar back to wherever the media happened to be between
     writes. Suppressing the state update also keeps the drag off React's
     render path entirely: the fill's width is written straight to the DOM. */
  const handleProgress = useCallback((pct: number) => {
    if (scrubbingRef.current) return;
    setEpProgress(pct);
  }, []);
  const handlePosition = useCallback((positionS: number) => {
    activePositionRef.current = positionS;
  }, []);

  /* Locked content is not scrubbable. `blocked` slides are held paused on
     purpose so paid frames never render under the overlay, and the paywall
     itself sits above this strip at z-[60]. */
  const scrubDisabled = !activeEp || (!activeEp.isFree && !authFree) || showUnlock;

  const applyScrub = useCallback(
    (clientX: number, force: boolean) => {
      const track = scrubTrackRef.current;
      if (!track) return;
      const rect = track.getBoundingClientRect();
      if (rect.width <= 0) return;
      const pct = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
      /* Paint first and imperatively, so the bar tracks the finger at the
         pointer's own rate while the media seek below stays rate-limited. */
      if (scrubFillRef.current) scrubFillRef.current.style.width = `${pct * 100}%`;
      const vid = getActiveVideo();
      if (!vid) return;
      const dur = vid.duration;
      if (!Number.isFinite(dur) || dur <= 0) return;
      const now = Date.now();
      if (!force && now - scrubWroteAtRef.current < SCRUB_WRITE_MS) return;
      scrubWroteAtRef.current = now;
      try {
        vid.currentTime = Math.max(0, Math.min(Math.max(0, dur - SEEK_END_GUARD_S), pct * dur));
      } catch {}
    },
    [getActiveVideo],
  );

  const endScrub = useCallback(
    (commitClientX: number | null) => {
      if (!scrubbingRef.current) return;
      if (commitClientX !== null) applyScrub(commitClientX, true);
      scrubbingRef.current = false;
      setScrubbing(false);
      const vid = getActiveVideo();
      if (!vid) return;
      const dur = vid.duration;
      if (Number.isFinite(dur) && dur > 0) {
        setEpProgress(Math.min(1, Math.max(0, vid.currentTime / dur)));
      }
      if (scrubResumeRef.current) {
        scrubResumeRef.current = false;
        vid.play().catch(() => {});
      }
    },
    [applyScrub, getActiveVideo],
  );

  const beginScrub = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (scrubDisabled) return;
      /* FEED THE AUDIO CLAIM. This strip is outside the scroll container, so
         the container's own passive listener never sees this press. */
      claimGestureForMountedSlides();
      const vid = getActiveVideo();
      if (!vid) return;
      const dur = vid.duration;
      if (!Number.isFinite(dur) || dur <= 0) return;
      /* Touch gets implicit pointer capture; mouse does not, and without it a
         drag that leaves the 44px strip stops delivering moves. */
      try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}

      /* ARM, DO NOT COMMIT. This used to start scrubbing on the press itself,
         before anything was known about which way the finger was going to
         travel — so a vertical swipe that happened to begin inside the 44px
         strip fired the advance AND a full scrub in one gesture, seeking the
         episode the viewer was leaving. Measured by two reviewers before it
         shipped.

         The axis decides instead, on the first movement that means anything:
         horizontal dominance commits to a scrub, vertical dominance abandons it
         and leaves the swipe to the feed. Nothing is written to the video until
         that choice is made, so an abandoned press has no effect at all. */
      scrubArmRef.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
      scrubResumeRef.current = !vid.paused;
    },
    [scrubDisabled, claimGestureForMountedSlides, getActiveVideo],
  );

  /* Resolve an armed press into a scrub, or let it go.

     SCRUB_AXIS_SLOP is the distance before the question is even asked: below it
     a press is a press, and a stationary finger must not start seeking. The
     dominance test is the same shape as the cross-axis advance rule, so the two
     gestures agree about what counts as horizontal rather than each deciding
     for itself. */
  const moveScrub = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (scrubbingRef.current) {
        applyScrub(e.clientX, false);
        return;
      }
      const arm = scrubArmRef.current;
      if (!arm || arm.id !== e.pointerId) return;

      const dx = Math.abs(e.clientX - arm.x);
      const dy = Math.abs(e.clientY - arm.y);
      if (dx < SCRUB_AXIS_SLOP && dy < SCRUB_AXIS_SLOP) return;

      if (dy > dx) {
        // Vertical won. Hand the gesture to the feed and never touch the video.
        scrubArmRef.current = null;
        return;
      }

      const vid = getActiveVideo();
      if (!vid) { scrubArmRef.current = null; return; }
      scrubArmRef.current = null;
      scrubbingRef.current = true;
      setScrubbing(true);
      try { vid.pause(); } catch {}
      revealActionRail();
      haptic();
      scrubWroteAtRef.current = 0;
      applyScrub(e.clientX, true);
    },
    [applyScrub, getActiveVideo, revealActionRail],
  );

  /* Belt and braces for a pointer this element never sees the end of: a lift
     outside the capture, a system gesture, or the app being backgrounded
     mid-drag. Without this the feed would be left with a paused video and a
     scrubbingRef stuck true, which also silences every progress update. */
  useEffect(() => {
    if (!scrubbing) return;
    const stop = () => endScrub(null);
    window.addEventListener("pointerup", stop);
    window.addEventListener("pointercancel", stop);
    document.addEventListener("visibilitychange", stop);
    return () => {
      window.removeEventListener("pointerup", stop);
      window.removeEventListener("pointercancel", stop);
      document.removeEventListener("visibilitychange", stop);
    };
  }, [scrubbing, endScrub]);

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
                /* THE AXIS DECLARATION, and it is stated only on this branch.
                   The vertical feed leaves this at `auto` on purpose: there the
                   browser owns the advance axis and must keep it.

                   Here the browser owns x — the native rail scroll, unchanged —
                   and it will never own y, because there is no vertical scroll
                   extent for it to reach (measured: scrollHeight === clientHeight
                   in both orientations). Saying so is not cosmetic. Left at
                   `auto` a browser is entitled to CLAIM a vertical drag as a pan
                   it might handle, and claiming it means cancelling the touch
                   sequence — which is the sequence the cross-axis advance above
                   reads. `pan-x` tells it not to bother, so a vertical swipe
                   arrives as a clean touchend.

                   `pinch-zoom` is kept alongside it deliberately: `pan-x` on its
                   own would withdraw two-finger zoom from the whole player, and
                   iOS grants that for accessibility whatever maximum-scale says.
                   A browser that does not understand the pair drops the whole
                   declaration back to `auto`, which is exactly today's
                   behaviour — the touchcancel path above covers that case. */
                touchAction: "pan-x pinch-zoom",
                /* Opt OUT of the global `scroll-behavior: smooth` in
                   app/globals.css. Measured in a real browser on production:
                   with smooth inherited, `container.scrollTop = target` does not
                   jump — it ANIMATES, and the synchronous read still returns the
                   old value. Every programmatic reposition in this feed was
                   therefore a visible one-viewport slide rather than the
                   invisible recycle it was written to be, and while that
                   animation runs it keeps emitting scroll events that re-arm the
                   settle timer and fight the viewer's next flick. That is the
                   correction the founder can see. Explicit behaviors still win,
                   so auto-advance keeps its deliberate smooth scroll. */
                scrollBehavior: "auto",
                /* Contain the fling. Without this a hard flick that reaches
                   either end hands its remaining momentum to the page behind
                   the rail, which on iOS is what produces the rubber-band that
                   drags the whole immersive layer and can pull the viewer out
                   of the feed entirely. "contain" keeps the scroll chain inside
                   this element and gives the rail its own bounce at both ends. */
                overscrollBehavior: "contain",
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
                /* Opt OUT of the global `scroll-behavior: smooth` in
                   app/globals.css. Measured in a real browser on production:
                   with smooth inherited, `container.scrollTop = target` does not
                   jump — it ANIMATES, and the synchronous read still returns the
                   old value. Every programmatic reposition in this feed was
                   therefore a visible one-viewport slide rather than the
                   invisible recycle it was written to be, and while that
                   animation runs it keeps emitting scroll events that re-arm the
                   settle timer and fight the viewer's next flick. That is the
                   correction the founder can see. Explicit behaviors still win,
                   so auto-advance keeps its deliberate smooth scroll. */
                scrollBehavior: "auto",
                /* Contain the fling. Without this a hard flick that reaches
                   either end hands its remaining momentum to the page behind
                   the rail, which on iOS is what produces the rubber-band that
                   drags the whole immersive layer and can pull the viewer out
                   of the feed entirely. "contain" keeps the scroll chain inside
                   this element and gives the rail its own bounce at both ends. */
                overscrollBehavior: "contain",
              }
        }
      >
        {/* No spacers. They WERE the runway: summed, they restored the full
            series length to the scroll height, so bounding the mounted window
            bounded nothing a fling could feel. */}
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
                isNext={i === activeIndex + 1}
                muted={muted}
                onUnmuteRefused={handleUnmuteRefused}
                resumePositionS={startPositionS}
                isResumeTarget={ep.number === startEpisode}
                onEnded={handleEpisodeEnded}
                onProgress={i === activeIndex ? handleProgress : noop}
                onPosition={i === activeIndex ? handlePosition : noop}
                onDoubleTap={handleDoubleTap}
                onReveal={revealActionRail}
                onFirstPlayGesture={requestPermissionOnce}
                widescreen={horizontal}
                transitionPoster={ep.number === startEpisode ? transitionPoster ?? undefined : undefined}
                blocked={!ep.isFree && !authFree}
                onAccessDenied={handlePlaybackAccessDenied}
                backHref={backHref}
              />
            </div>
          );
        })}


      </div>

      {/* ---- Overlays ---- */}

      {/* Episode transition toast */}
      <EpisodeToast epNumber={activeEp?.number ?? 1} show={showToast} />

      {/* Double-tap heart */}
      <HeartBurst show={showHeart} />

      {/* Back button — top-left */}
      {/* Anchor for the same reason as the paywall's Go Back: it must work on
          the first tap, before hydration. */}
      <a
        href={backHref}
        onClick={handleBack}
        className="absolute top-4 left-4 z-50 w-10 h-10 rounded-full flex items-center justify-center border-0 cursor-pointer no-underline"
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
      </a>

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
        aria-label={showMutedIcon ? "Unmute" : "Mute"}
      >
        {showMutedIcon ? (
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

      {/* Free-run indicator — top-left.

          Five testers described the paywall at episode six as an ambush. The
          ambush was never autoplay; it was that nothing in the player ever said
          how long the free run is. A viewer who knows they are on free episode
          two of five is not ambushed at six, they are prepared for it, and the
          paywall reads as earned rather than sprung.

          Every value here is read, never assumed. freeRunLength is the title's
          own freeEpisodes, which is per-title data clamped to real Mux
          inventory, so this is correct for the five wholly free titles and for
          the two whose allowance is clamped below their catalogue literal. A
          hard-coded 5 would be wrong for seven of the ninety-one.

          It renders only while the viewer is actually inside a free run they do
          not own: hidden once entitlement resolves true, hidden on a title with
          nothing to unlock, and hidden on the locked slide, where the paywall
          is already saying something far more specific. */}
      {showFreeRunChip && (
        <div
          className="absolute left-4 z-50 pointer-events-none"
          style={{
            top: "calc(env(safe-area-inset-top, 0px) + 60px)",
            opacity: showActionRail ? 1 : 0,
            transition: showActionRail ? "opacity 0.2s cubic-bezier(0.22, 1, 0.36, 1)" : "opacity 0.6s ease",
          }}
        >
          <div
            className="text-[11px] font-semibold"
            style={{
              background: "rgba(0,0,0,0.4)",
              backdropFilter: "blur(12px)",
              borderRadius: 999,
              padding: "4px 10px",
              color: "rgba(255,255,255,0.82)",
              border: "1px solid rgba(255,255,255,0.14)",
            }}
          >
            {t("content.freeEpisodeOf", { n: String(activeEp?.number ?? 1), total: String(freeEpisodes) })}
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

      {/* Live playback progress bar — very bottom, and a real scrubber.
          The outer element is the 44px hit strip; the pink bar inside it is
          the same 4px readout it always was. It sits above the home indicator
          rather than under it.

          touch-action is `pan-y`, NOT `none`, and the difference is the whole
          feed. `none` tells the browser to hand us every gesture in this band,
          including vertical ones — which made a full-width strip across the
          bottom of the screen stop scrolling to the next episode for as long as
          the action rail was visible. That is the first ten seconds of every
          episode and ten seconds after every tap, on the app's primary gesture.
          Three independent reviewers measured it before it shipped.

          `pan-y` splits the axes, which is exactly the intent: the browser keeps
          vertical panning, so a swipe up still moves the feed, and we keep the
          horizontal drag for scrubbing.

          IT STAYS `pan-y` ON A HORIZONTAL RAIL TOO, and that is a decision, not
          an oversight. There the two axes collide: the feed's native advance is
          x and the scrub is also x, so whichever one the declaration hands to
          the browser, the other loses. Measured on Storage Pirates at 390x844,
          `pan-y` blocks pan-x for every touch that starts in this band, so the
          native advance is unavailable inside it. The alternative, `pan-x`,
          would hand the browser the drag and leave the scrub needing a VERTICAL
          swipe on a horizontal bar, which is not a control anyone can use. So
          the strip keeps x, because scrubbing is the only reason it exists and
          a horizontal bar you drag sideways is the affordance it is drawn as.

          What makes that affordable is that the advance no longer depends on
          the browser owning an axis here. The cross-axis handler above is
          registered ON THIS ELEMENT as well as on the rail — passive listeners
          receive touches whatever touch-action says — so a vertical swipe
          starting on the bar advances exactly as it does on the vertical feed,
          while a horizontal drag still scrubs. The band is a dead zone for
          neither gesture. */}
      <div
        ref={scrubStripRef}
        className="absolute bottom-0 left-0 right-0 z-50 flex items-end"
        style={{
          height: "calc(44px + env(safe-area-inset-bottom, 0px))",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
          touchAction: "pan-y",
          opacity: showActionRail || scrubbing ? 1 : 0,
          pointerEvents: (showActionRail || scrubbing) && !scrubDisabled ? "auto" : "none",
          transition: showActionRail || scrubbing ? "opacity 0.2s cubic-bezier(0.22, 1, 0.36, 1)" : "opacity 0.6s ease",
        }}
        onPointerDown={beginScrub}
        onPointerMove={moveScrub}
        onPointerUp={(e) => {
          /* A tap that never moved is still a seek — that is how a progress bar
             has always worked. It resolves here rather than on the press so it
             cannot pre-empt a swipe that simply started on the bar. */
          if (!scrubbingRef.current && scrubArmRef.current?.id === e.pointerId) {
            scrubArmRef.current = null;
            const vid = getActiveVideo();
            const dur = vid?.duration;
            if (vid && Number.isFinite(dur) && (dur as number) > 0) {
              scrubbingRef.current = true;
              applyScrub(e.clientX, true);
            }
          }
          endScrub(e.clientX);
        }}
        onPointerCancel={() => { scrubArmRef.current = null; endScrub(null); }}
        role="slider"
        tabIndex={-1}
        aria-label="Seek"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(epProgress * 100)}
      >
        <div
          ref={scrubTrackRef}
          style={{
            position: "relative",
            width: "100%",
            height: scrubbing ? 6 : 4,
            background: "rgba(255,255,255,0.16)",
            transition: "height 0.15s cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          <div
            ref={scrubFillRef}
            style={{
              height: "100%",
              width: `${epProgress * 100}%`,
              background: "linear-gradient(90deg, #E0115F, #8B5CF6)",
              /* No animation under a finger: a 0.25s ease on width reads as the
                 bar lagging behind the drag by a quarter of a second. */
              transition: scrubbing ? "none" : "width 0.25s linear",
              borderRadius: "0 2px 2px 0",
              boxShadow: "0 0 8px rgba(224,17,95,0.3)",
            }}
          >
            {scrubbing && (
              <span
                className="absolute rounded-full"
                style={{
                  right: -6,
                  top: "50%",
                  width: 12,
                  height: 12,
                  marginTop: -6,
                  background: "#fff",
                  boxShadow: "0 0 10px rgba(224,17,95,0.7)",
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* ---- $1.99 Unlock overlay (first locked episode) ---- */}
      {showUnlock && (
        <div
          className="absolute inset-0 z-[60] flex items-center justify-center"
          /* The whole payment screen declares its own language. <html lang> is
             set by LangProvider, but this overlay is the surface guaranteed to
             be translated even where the page around it is not, and a screen
             reader announcing Spanish copy with English phonemes is the
             audible version of the bug this fixes. dir follows for Arabic, the
             one RTL locale in the list. */
          lang={locale}
          dir={locale === "ar" ? "rtl" : undefined}
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
              {t(iosApp ? "paywall.unavailableTitle" : "paywall.unlockAll")}
            </h3>
            <p className="text-sm mb-4" style={{ color: "rgba(255,255,255,0.55)" }}>
              {iosApp
                ? t("paywall.unavailableBody")
                : t("paywall.previewOver", { title: seriesTitle })}
            </p>
            {!iosApp && (
              <div className="flex flex-col gap-1.5 mb-5 text-left mx-auto" style={{ width: "fit-content" }}>
                {[
                  t("paywall.benefitEpisodes", { count: totalEpisodes }),
                  t("paywall.benefitAccess"),
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
                {/* Same size, same weight, same position — the big honest
                    price testers named as working. Only the WRITING of it
                    follows the language now: "$1.99" in English (byte-identical
                    to the literal this replaces), "1,99 US$" in Spanish, which
                    also stops a LATAM viewer reading a bare "$" as pesos. The
                    currency charged is unchanged and is always USD. */}
                <span className="text-3xl font-black align-middle" style={{ color: "#fff" }}>
                  {formatPrice(SERIES_UNLOCK_PRICE_CENTS)}
                </span>
                <span className="ml-2 text-xs font-semibold align-middle" style={{ color: "rgba(255,255,255,0.65)" }}>
                  {t("paywall.oneTimeUnlock")}
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
                    code?: unknown;
                    alreadyOwned?: unknown;
                  };
                  if (!res.ok) {
                    if (data.alreadyOwned) {
                      setAuthFree(true);
                      return;
                    }
                    const key =
                      typeof data.code === "string"
                        ? CHECKOUT_ERROR_KEYS[data.code]
                        : undefined;
                    setUnlockError(
                      key
                        ? t(key)
                        : typeof data.error === "string"
                          ? data.error
                          : t("checkout.errorStart"),
                    );
                    return;
                  }
                  if (typeof data.url !== "string" || !data.url) {
                    setUnlockError(t("checkout.errorNotOpened"));
                    return;
                  }
                  navigating = true;
                  window.location.assign(data.url);
                } catch {
                  setUnlockError(t("checkout.errorNetwork"));
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
              {unlockLoading
                ? t("paywall.ctaLoading")
                : t("paywall.cta", { price: formatPrice(SERIES_UNLOCK_PRICE_CENTS) })}
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
              {t("paywall.secure")}
            </p>
            )}
            {/* A real link, not a button. As a <button onClick> this did
                nothing until React finished hydrating, and the episode route
                hydrates behind a video element and an HLS attach — so on a
                phone the first taps landed on dead markup and the viewer tapped
                again and again. An anchor navigates natively with no JS at all,
                so the very first tap always leaves. The handler still runs when
                hydrated, to mute the video and swap the history entry instead of
                pushing one. */}
            <a
              href={backHref}
              onClick={handleBack}
              className="mt-3.5 block w-full py-3.5 rounded-2xl text-[15px] font-bold text-center no-underline cursor-pointer transition-transform active:scale-[0.97]"
              style={{
                background: "rgba(255,255,255,0.1)",
                border: "1.5px solid rgba(255,255,255,0.35)",
                color: "#fff",
                backdropFilter: "blur(8px)",
                /* Visible unconditionally. This carried opacity:0 plus a
                   delayed fadeIn animation, and measured on production the
                   computed opacity was still 0 nine seconds after load — the
                   animation had not run, and with a fill mode holding the
                   from-state the only exit from the paywall stayed invisible.
                   An opacity-0 element still takes clicks, so the viewer was
                   tapping at where they guessed the button was and mostly
                   missing: exactly the "takes a few taps" report.
                   The one control that lets someone leave a paywall does not
                   get to depend on an animation finishing. */
                opacity: 1,
              }}
            >
              {t("paywall.goBack")}
            </a>
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
