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
import { checkVipStatusServer } from "@/lib/vip-server";

/* ------------------------------------------------------------------ */
/*  Static params (first 10 episodes per live series)                  */
/* ------------------------------------------------------------------ */

export async function generateStaticParams() {
  const params: { slug: string; episode: string }[] = [];

  for (const series of SERIES.filter((s) => s.status === "live")) {
    const limit = Math.min(series.episodeCount, 10);
    for (let i = 1; i <= limit; i++) {
      params.push({ slug: series.slug, episode: String(i) });
    }
  }

  return params;
}

/* ------------------------------------------------------------------ */
/*  Metadata                                                           */
/* ------------------------------------------------------------------ */

type Props = {
  params: Promise<{ slug: string; episode: string }>;
  searchParams: Promise<{ unlocked?: string }>;
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string; episode: string }> }): Promise<Metadata> {
  const { slug, episode: epStr } = await params;
  const series = getSeriesBySlug(slug);
  const epNum = parseInt(epStr, 10);
  const ep = series ? getEpisode(slug, epNum) : undefined;

  if (!series || !ep) return { title: "Not Found" };

  return {
    title: `${series.title} — ${ep.title} | Verza TV`,
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

export default async function EpisodePage({ params, searchParams }: Props) {
  const { slug, episode: epStr } = await params;
  const { unlocked } = await searchParams;
  const series = getSeriesBySlug(slug);
  const epNum = parseInt(epStr, 10);

  if (!series) notFound();

  const ep = getEpisode(slug, epNum);
  if (!ep) notFound();

  const isVip = await checkVipStatusServer();

  // Check entitlement
  let hasEntitlement = false;
  if (unlocked === "true") {
    hasEntitlement = true;
  }
  if (!hasEntitlement) {
    try {
      const { getUser } = await import("@/lib/auth");
      const user = await getUser();
      if (user) {
        const { getServiceClient } = await import("@/lib/supabase/server");
        const supabase = getServiceClient();
        const { data } = await supabase
          .from("entitlements")
          .select("id")
          .eq("user_id", user.id)
          .eq("series_slug", slug)
          .limit(1);
        if (data && data.length > 0) hasEntitlement = true;
      }
    } catch {}
  }

  // Build episode list for feed
  const allEpisodes = getEpisodesForSeries(slug);
  const feedEpisodes: FeedEpisode[] = allEpisodes.map((e) => {
    const mux = getPlayback(slug, e.number);
    return {
      number: e.number,
      title: e.title,
      durationS: e.durationS,
      playbackId: mux?.playbackId,
      isFree: e.number <= series.freeEpisodes || isVip || hasEntitlement,
    };
  });

  const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://verzatv.com";

  // Red carpet events use horizontal swipe and return to the red carpet layout
  const isRedCarpet = slug === "the-dumb-billionaire-heiress-in-love";

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
              thumbUrl: getPlayback(slug, epNum)
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
        horizontal={isRedCarpet}
        backHref={isRedCarpet ? "/?tab=red-carpet" : "/"}
      />
    </>
  );
}
