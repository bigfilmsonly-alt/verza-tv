import type { Show, Episode } from "./schemas";

export function isIndexableShow(
  show: Pick<Show, "slug" | "title" | "synopsis" | "posterUrl" | "episodeCount">,
): boolean {
  return !!(show.slug && show.title && show.synopsis && show.posterUrl && show.episodeCount > 0);
}

export function isIndexableEpisode(
  show: Pick<Show, "slug" | "title" | "synopsis" | "posterUrl" | "episodeCount">,
  episode: Pick<Episode, "title" | "synopsis" | "muxPlaybackId">,
): boolean {
  return isIndexableShow(show) && !!(episode.title && episode.muxPlaybackId);
}
