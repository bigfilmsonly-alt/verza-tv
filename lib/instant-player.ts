import type HlsType from "hls.js";

/* ------------------------------------------------------------------ */
/*  Instant player — click-to-playing with ZERO poster/black frames.   */
/*                                                                     */
/*  The moment a poster is clicked on the browse page we create a      */
/*  hidden muted <video>, attach the stream, and start playing it —    */
/*  all while the route navigation is still in flight. When the        */
/*  episode page mounts, EpisodeFeed ADOPTS this element (it is moved  */
/*  into the player, already decoded and playing), so the first frame  */
/*  the viewer ever sees of the episode page is the movie itself.      */
/* ------------------------------------------------------------------ */

let hlsPromise: Promise<typeof HlsType | null> | null = null;
function getHls(): Promise<typeof HlsType | null> {
  if (!hlsPromise && typeof window !== "undefined") {
    hlsPromise = import("hls.js").then((m) => m.default).catch(() => { hlsPromise = null; return null; });
  }
  return hlsPromise || Promise.resolve(null);
}

/** The ERROR listener this module installs, so an adopter can remove exactly it. */
export type InstantErrorListener = (_e: string, data: { type: string; fatal: boolean }) => void;

export interface AdoptedPlayer {
  video: HTMLVideoElement;
  hls: HlsType | null;
  playbackId: string;
  /** Present only once the hls instance exists. Remove by identity, never with a bare off(). */
  onError?: InstantErrorListener;
}

interface Entry extends AdoptedPlayer {
  timer: ReturnType<typeof setTimeout>;
}

let current: Entry | null = null;

/** How long an un-adopted instant player is allowed to live. */
const TTL_MS = 12_000;

export function destroyInstantPlayer(): void {
  const entry = current;
  if (!entry) return;
  current = null;
  clearTimeout(entry.timer);
  try { entry.hls?.destroy(); } catch {}
  try {
    entry.video.muted = true;
    entry.video.pause();
    entry.video.removeAttribute("src");
    entry.video.load();
    entry.video.remove();
  } catch {}
}

/**
 * Begin loading AND playing (hidden, muted) the given Mux stream right now.
 * Called from the poster's click handler, so the play() carries the user
 * gesture. Safe to call repeatedly — a second click replaces the first.
 */
export function startInstantPlayer(playbackId: string | undefined): void {
  if (typeof window === "undefined" || !playbackId) return;
  if (current?.playbackId === playbackId) return; // already spinning up
  destroyInstantPlayer();

  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.setAttribute("playsinline", "");
  video.setAttribute("muted", "");
  video.preload = "auto";
  // Kept tiny + invisible but IN the DOM so the browser actually decodes.
  video.style.cssText =
    "position:fixed;bottom:0;right:0;width:2px;height:2px;opacity:0;pointer-events:none;";
  document.body.appendChild(video);

  /* Claim the gesture NOW, synchronously, while the poster tap is still on the
     stack. This element has no source yet, so this play() cannot succeed and is
     not meant to — the return value is deliberately ignored.

     What it does is call WebKit's removeBehaviorRestrictionsAfterFirstUserGesture
     on THIS element, which lasts for the element's whole lifetime. EpisodeFeed
     adopts this exact element a moment later, so the adopted player carries a
     permission that a freshly created element cannot have: it may be unmuted
     without asking again.

     Timing is the entire point and it is why this cannot live below. The play()
     that already existed runs inside getHls().then(...), which resolves after a
     dynamic import — hundreds of milliseconds later, long outside the gesture,
     by which time WebKit has stopped associating it with the tap. Everything a
     viewer does after that is negotiating for permission the tap could simply
     have granted.

     This is the mechanism behind "the sound should just start playing once you
     click on the poster". Muted, so nothing is audible from a 2px offscreen
     element and no autoplay policy is violated. */
  video.play().catch(() => {});

  const url = `https://stream.mux.com/${playbackId}.m3u8`;
  const entry: Entry = {
    video,
    hls: null,
    playbackId,
    timer: setTimeout(() => {
      if (current === entry) destroyInstantPlayer();
    }, TTL_MS),
  };
  current = entry;

  getHls().then((Hls) => {
    if (current !== entry) return; // superseded or destroyed while loading

    if (Hls && Hls.isSupported()) {
      const hls = new Hls({
        maxBufferLength: 8,
        maxMaxBufferLength: 15,
        backBufferLength: 0,
        enableWorker: true,
        startLevel: 0,
        capLevelToPlayerSize: false, // element is 2px until adopted — don't cap
        maxLoadingDelay: 0,
        startFragPrefetch: true,
        abrEwmaDefaultEstimate: 500_000,
      });
      entry.hls = hls;
      hls.loadSource(url);
      hls.attachMedia(video);
      /* Keep the reference. EpisodeFeed replaces this handler on adoption and
         must remove it BY IDENTITY: hls.js registers 21 internal ERROR
         subscriptions on this same emitter (BufferController.onError,
         StreamController.onError and friends), and a bare off(Events.ERROR)
         clears the whole event, taking reduceLengthAndFlushBuffer,
         flushMainBuffer and recoverWorkerError with it. That is hls.js's own
         memory-shedding path, and losing it on the one instance that also
         plays uncapped is how a tight-memory device gets pushed over. */
      const onError = (_e: string, data: { type: string; fatal: boolean }) => {
        if (data.fatal) {
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) hls.startLoad();
          else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) hls.recoverMediaError();
        }
      };
      entry.onError = onError;
      hls.on(Hls.Events.ERROR, onError);
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // iOS Safari — native HLS
      video.src = url;
      video.load();
    } else {
      destroyInstantPlayer();
      return;
    }

    video.play().catch(() => {});
  });
}

/**
 * Hand the pre-started player to the episode page. Returns null if there is
 * no live instant player for this exact stream (normal cold navigation).
 */
export function adoptInstantPlayer(playbackId: string | undefined): AdoptedPlayer | null {
  if (!playbackId || !current || current.playbackId !== playbackId) return null;
  const entry = current;
  current = null;
  clearTimeout(entry.timer);
  if (entry.video.error) {
    try { entry.hls?.destroy(); } catch {}
    try { entry.video.remove(); } catch {}
    return null;
  }
  return { video: entry.video, hls: entry.hls, playbackId: entry.playbackId, onError: entry.onError };
}
