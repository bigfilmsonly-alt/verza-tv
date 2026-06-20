import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import JsonLd from "@/components/JsonLd";
import Player from "@/components/Player";
import CoinPaywall from "@/components/CoinPaywall";
import {
  SERIES,
  getSeriesBySlug,
  getEpisode,
  getEpisodesForSeries,
  formatDuration,
} from "@/lib/catalog";
import { getPlayback } from "@/lib/mux-map";
import {
  seriesSchema,
  episodeSchema,
  breadcrumbSchema,
} from "@/lib/schemas";
import { T } from "@/lib/theme";
import { SERIES_DETAIL } from "@/lib/series-detail";
import SeriesInfoButton from "@/components/SeriesInfoButton";
import EpisodeDropdown from "@/components/EpisodeDropdown";
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

  const mux = getPlayback(slug, epNum);

  const episodes = getEpisodesForSeries(slug);
  const isVip = await checkVipStatusServer();

  // Check if user has purchased this series (entitlement)
  let hasEntitlement = false;
  if (unlocked === "true") {
    hasEntitlement = true; // Just paid via Stripe, redirected back
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

  const isFree = ep.number <= series.freeEpisodes || isVip || hasEntitlement;

  const BASE_URL =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://verzatv.com";

  return (
    <>
      {/* ---- JSON-LD ---- */}
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
              thumbUrl: mux ? `https://image.mux.com/${mux.playbackId}/thumbnail.jpg?time=5&width=1080&height=1920` : `${BASE_URL}${series.posterUrl}`,
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
            {
              name: series.title,
              url: `${BASE_URL}/series/${series.slug}`,
            },
            {
              name: ep.title,
              url: `${BASE_URL}/series/${series.slug}/${ep.number}`,
            },
          ]),
        ]}
      />

      {/* ---- Episode Header ---- */}
      <div className="px-4 pt-4 pb-2">
        {/* Back link */}
        <Link
          href={`/series/${series.slug}`}
          className="inline-flex items-center gap-1 text-xs font-medium no-underline mb-3"
          style={{ color: T.textDim }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
          {series.title}
        </Link>

        {/* Episode title */}
        <h1
          className="text-xl font-bold leading-tight mb-1"
          style={{ color: T.text }}
        >
          {ep.title}
        </h1>

        {/* Meta line + info button */}
        <div className="flex items-center gap-3 mb-4">
          <p
            className="text-sm flex-1"
            style={{ color: T.textDim }}
          >
            Episode {ep.number} of {series.episodeCount}
            <span style={{ color: T.textMute }}> &middot; </span>
            {formatDuration(ep.durationS)}
          </p>
          <SeriesInfoButton
            series={series}
            seriesDetail={SERIES_DETAIL[series.slug]}
            currentEpisode={ep.number}
            totalEpisodes={series.episodeCount}
          />
        </div>
      </div>

      {/* ---- Player / Paywall ---- */}
      {isFree ? (
        <Player
          posterUrl={series.posterUrl}
          title={ep.title}
          episodeNumber={ep.number}
          durationS={ep.durationS}
          seriesSlug={series.slug}
          playbackId={mux?.playbackId}
          totalEpisodes={series.episodeCount}
          freeEpisodes={series.freeEpisodes}
        />
      ) : (
        <CoinPaywall
          posterUrl={series.posterUrl}
          unlockCoins={ep.unlockCoins}
          seasonPassCoins={series.seasonPassCoins}
          seriesSlug={series.slug}
          episodeNumber={ep.number}
        />
      )}

      {/* ---- Episode Dropdown (prev / selector / next) ---- */}
      <EpisodeDropdown
        seriesSlug={series.slug}
        episodes={episodes.map((e) => ({ number: e.number, title: e.title }))}
        currentEpisode={ep.number}
        freeEpisodes={series.freeEpisodes}
        totalEpisodes={series.episodeCount}
      />

      {/* Bottom spacer for BottomNav */}
      <div className="h-8" />
    </>
  );
}
