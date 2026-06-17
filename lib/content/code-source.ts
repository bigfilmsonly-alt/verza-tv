/**
 * Code-backed content source — reads from existing catalog.ts,
 * series-detail.ts, and mux-map.ts without modifying them.
 */
import {
  catalog,
  getLiveSeries,
  getEpisodesForSeries,
  getEpisode as getCatalogEpisode,
  type Series,
} from "@/lib/catalog";
import { SERIES_DETAIL } from "@/lib/series-detail";
import { getPlayback, MUX_MAP } from "@/lib/mux-map";
import { isIndexableShow, isIndexableEpisode } from "./indexability";
import type { Show, Episode, Article } from "./schemas";
import type { ContentSource } from "./source";

/* ------------------------------------------------------------------ */
/*  Adapters: catalog types → content types                           */
/* ------------------------------------------------------------------ */

function adaptShow(series: Series): Show {
  const detail = SERIES_DETAIL[series.slug];

  // Build synopsis: prefer the long-form description, fall back to logline
  const synopsis = detail?.description ?? series.logline;

  // Parse genre string (e.g. "Romance · Comedy") into array
  const genre = series.genre
    .split(/[·•,]/)
    .map((g) => g.trim())
    .filter(Boolean);

  // Build cast as Person objects
  const cast = (detail?.cast ?? series.cast ?? []).map((name, i) => ({
    id: `${series.slug}-cast-${i}`,
    slug: name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
    name,
    role: "actor" as const,
  }));

  const show: Show = {
    id: series.slug,
    slug: series.slug,
    title: series.title,
    synopsis,
    genre,
    tags: detail?.tags ?? series.tags ?? [],
    posterUrl: series.posterUrl,
    year: detail?.year ?? series.year ?? 2025,
    rating: detail?.rating ?? series.rating ?? 0,
    cast,
    episodeCount: series.episodeCount,
    category: series.categories[0] ?? "drama",
    status: series.status,
    indexable: false, // set below
    createdAt: new Date().toISOString(),
  };

  show.indexable = isIndexableShow(show);
  return show;
}

function adaptEpisode(showSlug: string, catalogEp: {
  number: number;
  title: string;
  isFree: boolean;
  unlockCoins: number;
  durationS: number;
}, show: Show): Episode {
  const mux = getPlayback(showSlug, catalogEp.number);

  const episode: Episode = {
    id: `${showSlug}-ep-${catalogEp.number}`,
    showSlug,
    number: catalogEp.number,
    title: catalogEp.title,
    synopsis: show.synopsis, // inherit show synopsis for now
    durationSeconds: mux?.duration ?? catalogEp.durationS,
    muxPlaybackId: mux?.playbackId ?? "",
    posterUrl: show.posterUrl,
    isFree: catalogEp.isFree,
    unlockCoins: catalogEp.unlockCoins,
    transcript: null,
    indexable: false, // set below
    createdAt: new Date().toISOString(),
  };

  episode.indexable = isIndexableEpisode(show, episode);
  return episode;
}

/* ------------------------------------------------------------------ */
/*  ContentSource implementation                                      */
/* ------------------------------------------------------------------ */

function createCodeContentSource(): ContentSource {
  // Cache adapted shows keyed by slug
  const showCache = new Map<string, Show>();

  function ensureShow(slug: string): Show | undefined {
    if (showCache.has(slug)) return showCache.get(slug)!;
    const series = catalog.find((s) => s.slug === slug);
    if (!series) return undefined;
    const show = adaptShow(series);
    showCache.set(slug, show);
    return show;
  }

  return {
    listShows(filter) {
      let list = catalog;

      // Filter by category
      if (filter?.category) {
        list = list.filter((s) => s.categories.includes(filter.category as never));
      }

      // Only live series
      list = list.filter((s) => s.status === "live");

      // Apply limit
      if (filter?.limit && filter.limit > 0) {
        list = list.slice(0, filter.limit);
      }

      return list.map((s) => {
        const show = ensureShow(s.slug);
        return show!;
      });
    },

    getShow(slug) {
      return ensureShow(slug);
    },

    listEpisodes(showSlug) {
      const show = ensureShow(showSlug);
      if (!show) return [];
      const catalogEps = getEpisodesForSeries(showSlug);
      return catalogEps.map((ep) => adaptEpisode(showSlug, ep, show));
    },

    getEpisode(showSlug, n) {
      const show = ensureShow(showSlug);
      if (!show) return undefined;
      const catalogEp = getCatalogEpisode(showSlug, n);
      if (!catalogEp) return undefined;
      return adaptEpisode(showSlug, catalogEp, show);
    },

    listArticles() {
      // No articles in code source yet
      return [];
    },

    getArticle() {
      // No articles in code source yet
      return undefined;
    },

    getInternalLinks(slug) {
      // Build basic internal links from related shows (same category)
      const series = catalog.find((s) => s.slug === slug);
      if (!series) return [];

      const related = catalog
        .filter(
          (s) =>
            s.slug !== slug &&
            s.status === "live" &&
            s.categories.some((c) => series.categories.includes(c)),
        )
        .slice(0, 5);

      return related.map((s) => ({
        targetSlug: s.slug,
        anchorText: s.title,
      }));
    },
  };
}

export { createCodeContentSource };
