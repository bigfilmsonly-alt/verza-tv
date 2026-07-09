import { notFound } from "next/navigation";
import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import EpisodeFeed from "@/components/EpisodeFeed";
import type { FeedEpisode } from "@/components/EpisodeFeed";
import {
  SERIES,
  getSeriesBySlug,
  getEpisode,
  getEpisodesForSeries,
} from "@/lib/catalog";
import { getPlayback } from "@/lib/mux-map";
import {
  seriesSchema,
  episodeSchema,
  breadcrumbSchema,
} from "@/lib/schemas";

/* ------------------------------------------------------------------ */
/*  Static params (first 25 episodes per live series)                  */
/*                                                                     */
/*  No dynamic APIs (cookies/headers) are used in this page, so ALL    */
/*  listed params are pre-rendered at build time and served instantly   */
/*  from the CDN edge — zero server round-trip, ReelShort-speed.       */
/*  VIP / entitlement checks happen client-side in EpisodeFeed.        */
/* ------------------------------------------------------------------ */

export async function generateStaticParams() {
  const params: { slug: string; episode: string }[] = [];

  for (const series of SERIES.filter((s) => s.status === "live")) {
    const limit = Math.min(series.episodeCount, 25);
    for (let i = 1; i <= limit; i++) {
      params.push({ slug: series.slug, episode: String(i) });
    }
  }

  return params;
}

/* ISR: re-validate pages every hour so new content propagates */
export const revalidate = 3600;

/* ------------------------------------------------------------------ */
/*  Metadata                                                           */
/* ------------------------------------------------------------------ */

type Props = {
  params: Promise<{ slug: string; episode: string }>;
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string; episode: string }> }): Promise<Metadata> {
  const { slug, episode: epStr } = await params;
  const series = getSeriesBySlug(slug);
  const epNum = parseInt(epStr, 10);
  const ep = series ? getEpisode(slug, epNum) : undefined;

  if (!series || !ep) return { title: "Not Found" };

  return {
    title: `${series.title} — ${ep.title} | VERZA TV`,
    description: `Watch ${ep.title} of ${series.title}. ${series.logline}`,
    alternates: { canonical: `/series/${slug}/${epStr}` },
    openGraph: {
      title: `${ep.title} — ${series.title}`,
      description: series.logline,
      url: `/series/${slug}/${epStr}`,
      type: "video.episode",
      images: series.posterUrl
        ? [{ url: series.posterUrl, width: 800, height: 1067, alt: series.title }]
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title: `${ep.title} — ${series.title}`,
      description: series.logline,
      images: series.posterUrl ? [series.posterUrl] : [],
    },
  };
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default async function EpisodePage({ params }: Props) {
  const { slug, episode: epStr } = await params;
  const series = getSeriesBySlug(slug);
  const epNum = parseInt(epStr, 10);

  if (!series) notFound();

  const ep = getEpisode(slug, epNum);
  if (!ep) notFound();

  // Build episode list with series-level free logic only (no auth).
  // VIP / entitlement overrides happen client-side in EpisodeFeed via
  // /api/access — this keeps the page fully static (SSG).
  const freeCount = series.coinPerEpisode > 0 ? Math.min(series.freeEpisodes, 4) : series.freeEpisodes;
  const allEpisodes = getEpisodesForSeries(slug);
  const feedEpisodes: FeedEpisode[] = allEpisodes.map((e) => {
    const mux = getPlayback(slug, e.number);
    return {
      number: e.number,
      title: e.title,
      durationS: e.durationS,
      playbackId: mux?.playbackId,
      isFree: e.number <= freeCount,
    };
  });

  const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://verzatv.com";

  // Horizontal swipe for widescreen series (reality / red carpet)
  const isHorizontalSwipe = series.categories.includes("red-carpet") || slug === "storage-pirates";
  const backTab = series.categories.includes("red-carpet") ? "red-carpet" : series.categories.includes("reality") ? "reality" : null;

  return (
    <>
      <JsonLd
        data={[
          episodeSchema(
            {
              slug: series.slug,
              title: series.title,
              logline: series.logline,
              genre: series.genre,
              episodeCount: series.episodeCount,
              posterUrl: `${BASE_URL}${series.posterUrl}`,
            },
            {
              number: ep.number,
              title: ep.title,
              durationS: ep.durationS,
              thumbUrl: getPlayback(slug, epNum)?.playbackId
                ? `https://image.mux.com/${getPlayback(slug, epNum)!.playbackId}/thumbnail.jpg?time=5&width=1080&height=1920`
                : `${BASE_URL}${series.posterUrl}`,
            },
          ),
          seriesSchema({
            slug: series.slug,
            title: series.title,
            logline: series.logline,
            genre: series.genre,
            episodeCount: series.episodeCount,
            posterUrl: `${BASE_URL}${series.posterUrl}`,
          }),
          breadcrumbSchema([
            { name: "Home", url: BASE_URL },
            { name: series.title, url: `${BASE_URL}/series/${series.slug}` },
            { name: ep.title, url: `${BASE_URL}/series/${series.slug}/${ep.number}` },
          ]),
        ]}
      />

      <EpisodeFeed
        seriesSlug={series.slug}
        seriesTitle={series.title}
        posterUrl={series.posterUrl}
        episodes={feedEpisodes}
        startEpisode={epNum}
        freeEpisodes={series.freeEpisodes}
        totalEpisodes={series.episodeCount}
        horizontal={isHorizontalSwipe}
        backHref={backTab ? `/?tab=${backTab}` : "/"}
      />
    </>
  );
}
