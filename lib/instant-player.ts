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
    hlsPromise = import("hls.js").then((m) => m.default).catch(() => null);
  }
  return hlsPromise || Promise.resolve(null);
}

export interface AdoptedPlayer {
  video: HTMLVideoElement;
  hls: HlsType | null;
  playbackId: string;
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
      hls.on(Hls.Events.ERROR, (_e: string, data: { type: string; fatal: boolean }) => {
        if (data.fatal) {
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) hls.startLoad();
          else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) hls.recoverMediaError();
        }
      });
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
  return { video: entry.video, hls: entry.hls, playbackId: entry.playbackId };
}
