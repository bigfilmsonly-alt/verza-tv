import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
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
import {
  seriesSchema,
  episodeSchema,
  breadcrumbSchema,
} from "@/lib/schemas";
import { T } from "@/lib/theme";

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

type Props = { params: Promise<{ slug: string; episode: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
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

export default async function EpisodePage({ params }: Props) {
  const { slug, episode: epStr } = await params;
  const series = getSeriesBySlug(slug);
  const epNum = parseInt(epStr, 10);

  if (!series) notFound();

  const ep = getEpisode(slug, epNum);
  if (!ep) notFound();

  const episodes = getEpisodesForSeries(slug);
  const isFree = ep.number <= series.freeEpisodes;
  const hasPrev = ep.number > 1;
  const hasNext = ep.number < series.episodeCount;

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
              thumbUrl: `${BASE_URL}${series.posterUrl}`,
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

        {/* Meta line */}
        <p
          className="text-sm mb-4"
          style={{ color: T.textDim }}
        >
          Episode {ep.number} of {series.episodeCount}
          <span style={{ color: T.textMute }}> &middot; </span>
          {formatDuration(ep.durationS)}
        </p>
      </div>

      {/* ---- Player / Paywall ---- */}
      {isFree ? (
        <Player
          posterUrl={series.posterUrl}
          title={ep.title}
          episodeNumber={ep.number}
          durationS={ep.durationS}
          seriesSlug={series.slug}
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

      {/* ---- Episode Navigation ---- */}
      <div className="flex items-center justify-between px-4 mt-6 mb-8">
        {hasPrev ? (
          <Link
            href={`/series/${series.slug}/${ep.number - 1}`}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-medium no-underline transition-colors"
            style={{
              background: T.surface,
              color: T.text,
              border: `1px solid ${T.line}`,
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Previous
          </Link>
        ) : (
          <div />
        )}

        {hasNext ? (
          <Link
            href={`/series/${series.slug}/${ep.number + 1}`}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-medium no-underline transition-colors"
            style={{
              background: T.accent,
              color: T.text,
            }}
          >
            Next
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>
        ) : (
          <div />
        )}
      </div>

      {/* ---- All Episodes List ---- */}
      <div className="px-4 mb-8">
        <h2
          className="text-base font-bold mb-3"
          style={{ color: T.text }}
        >
          All Episodes
        </h2>

        <div className="flex flex-col gap-1.5">
          {episodes.slice(0, 20).map((listEp) => {
            const isActive = listEp.number === ep.number;
            const isListFree = listEp.number <= series.freeEpisodes;
            return (
              <Link
                key={listEp.number}
                href={`/series/${series.slug}/${listEp.number}`}
                className="flex items-center gap-3 rounded-lg px-3 py-2 no-underline"
                style={{
                  background: isActive ? `${T.accent}22` : "transparent",
                  border: isActive
                    ? `1px solid ${T.accent}44`
                    : "1px solid transparent",
                }}
              >
                <span
                  className="text-xs font-bold w-6 text-center flex-shrink-0"
                  style={{ color: isActive ? T.accent : T.textMute }}
                >
                  {listEp.number}
                </span>
                <span
                  className="text-sm flex-1 truncate"
                  style={{ color: isActive ? T.text : T.textDim }}
                >
                  {listEp.title}
                </span>
                <span
                  className="text-xs flex-shrink-0"
                  style={{
                    color: isListFree ? T.success : T.coin,
                  }}
                >
                  {isListFree ? "FREE" : `${listEp.unlockCoins}`}
                </span>
              </Link>
            );
          })}

          {episodes.length > 20 && (
            <p
              className="text-xs text-center py-2"
              style={{ color: T.textMute }}
            >
              + {episodes.length - 20} more episodes
            </p>
          )}
        </div>
      </div>

      {/* Bottom spacer for BottomNav */}
      <div className="h-8" />
    </>
  );
}
