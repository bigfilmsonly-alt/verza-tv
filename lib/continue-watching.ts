import { getSeriesBySlug } from "./catalog";
import { readGuestProgress, type GuestProgressRow } from "./guest-storage";

/* ------------------------------------------------------------------ */
/*  The Continue Watching row, from either source.                      */
/*                                                                      */
/*  BUG THIS PREVENTS: the rail was server-only, so it was empty for     */
/*  every signed-out viewer — and the free preview is open to guests, so */
/*  the people most likely to have an unfinished episode were exactly    */
/*  the people the rail could never show one to.                         */
/*                                                                      */
/*  The shape and the filters below are COPIED FROM THE SERVER, not      */
/*  invented: app/api/watch-progress/route.ts returns this field set,    */
/*  drops rows whose series is missing or no longer live (":98-110",     */
/*  added because they rendered poster-less ghost cards linking to 404s),*/
/*  selects only `completed = false`, and caps at 20. A guest rail that  */
/*  disagreed with the signed-in rail on any of those would be a second  */
/*  behaviour to maintain and a second place for a 404 to come back.     */
/* ------------------------------------------------------------------ */

export interface ContinueWatchingItem {
  seriesSlug: string;
  seriesTitle: string;
  posterUrl: string;
  episodeNumber: number;
  totalEpisodes: number;
  progressSeconds: number;
  /** ISO-8601, matching the server's `updated_at` column. */
  updatedAt: string;
}

/** Same limit as the server query (`.limit(20)`). */
export const CONTINUE_WATCHING_LIMIT = 20;

/**
 * Turn locally-remembered playheads into rail rows.
 *
 * Exported separately from the localStorage read so it can be exercised with
 * fixture rows offline, against the real catalog, without a browser.
 */
export function continueWatchingFromRows(rows: GuestProgressRow[]): ContinueWatchingItem[] {
  return rows
    .filter((r) => !r.completed)
    .slice()
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .flatMap((r) => {
      const series = getSeriesBySlug(r.seriesSlug);
      if (!series || series.status !== "live") return [];
      // A row can outlive the episode it points at — an episodeCount can shrink
      // when a title is re-cut. `/series/<slug>/<n>` past the end is a 404, and
      // a rail tile is not the place to discover that.
      if (r.episodeNumber > series.episodeCount) return [];
      return [
        {
          seriesSlug: r.seriesSlug,
          seriesTitle: series.title,
          posterUrl: series.posterUrl,
          episodeNumber: r.episodeNumber,
          totalEpisodes: series.episodeCount,
          progressSeconds: r.progressSeconds,
          updatedAt: new Date(r.updatedAt).toISOString(),
        },
      ];
    })
    .slice(0, CONTINUE_WATCHING_LIMIT);
}

/** The guest rail: what this device remembers, shaped like the server's answer. */
export function readGuestContinueWatching(): ContinueWatchingItem[] {
  return continueWatchingFromRows(readGuestProgress());
}

/**
 * The rule every consumer of the rail uses, in one place.
 *
 * The server is the authority whenever it has anything to say. A signed-in
 * viewer's rail is their account's, across devices; the local mirror only
 * fills the silence for someone the account layer cannot answer for. That
 * ordering is what stops a stale device row from shadowing an account whose
 * progress moved on somewhere else.
 */
export function mergeContinueWatching(
  serverItems: ContinueWatchingItem[] | null | undefined,
): ContinueWatchingItem[] {
  if (serverItems && serverItems.length > 0) return serverItems;
  return readGuestContinueWatching();
}
