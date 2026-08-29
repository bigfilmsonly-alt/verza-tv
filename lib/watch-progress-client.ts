import { saveGuestProgress } from "./guest-storage";

/* ------------------------------------------------------------------ */
/*  Recording a playhead, from any player.                              */
/*                                                                      */
/*  BUG THIS PREVENTS: three players (EpisodeFeed, Player, and the       */
/*  backgrounding flush in each) each hand-rolled the same POST to       */
/*  /api/watch-progress, and all five call sites shared one fault — the  */
/*  route 401s for a signed-out caller, so for a guest the write went    */
/*  nowhere and nothing local caught it. Five copies of a policy is why  */
/*  fixing it in one of them would have fixed nothing.                   */
/*                                                                      */
/*  The device write is unconditional and comes FIRST. It is synchronous */
/*  and it cannot fail on a 401, a 429 or a dropped connection, which    */
/*  matters most in the one case that has no second chance: the          */
/*  pagehide flush, where the tab is going away and the network request  */
/*  may never be sent at all.                                           */
/* ------------------------------------------------------------------ */

export interface WatchProgressInput {
  seriesSlug: string;
  episodeNumber: number;
  progressSeconds: number;
  completed?: boolean;
}

/**
 * Remember a playhead on this device, and tell the account about it too.
 *
 * `keepalive` is for the backgrounding flush: it lets the request outlive the
 * page. It is not the default because a keepalive body counts against a small
 * shared browser budget, and the ten-second heartbeat would exhaust it.
 */
export function recordWatchProgress(
  input: WatchProgressInput,
  options: { keepalive?: boolean } = {},
): void {
  // 1. The device. Always, session or no session.
  saveGuestProgress({
    seriesSlug: input.seriesSlug,
    episodeNumber: input.episodeNumber,
    progressSeconds: input.progressSeconds,
    completed: input.completed ?? false,
  });

  // 2. The account. 401 for a guest is expected and already handled above.
  try {
    fetch("/api/watch-progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      ...(options.keepalive ? { keepalive: true } : {}),
      body: JSON.stringify({
        seriesSlug: input.seriesSlug,
        episodeNumber: input.episodeNumber,
        progressSeconds: Math.floor(input.progressSeconds),
        completed: input.completed ?? false,
      }),
    }).catch(() => {});
  } catch {
    /* fetch itself can throw while a page is unloading */
  }
}
