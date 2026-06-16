import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import {
  SERIES,
  getSeriesWithDetail,
  getEpisodesForSeries,
  formatDuration,
} from "@/lib/catalog";
import { formatCoins } from "@/lib/coins";
import { seriesSchema, breadcrumbSchema } from "@/lib/schemas";
import { T } from "@/lib/theme";
import { FREE_EPISODES } from "@/lib/config";

/* ------------------------------------------------------------------ */
/*  Static params                                                      */
/* ------------------------------------------------------------------ */

export async function generateStaticParams() {
  return SERIES.filter((s) => s.status === "live").map((s) => ({
    slug: s.slug,
  }));
}

/* ------------------------------------------------------------------ */
/*  Metadata                                                           */
/* ------------------------------------------------------------------ */

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const series = getSeriesWithDetail(slug);
  if (!series) return { title: "Not Found" };

  return {
    title: `${series.title} — Watch Free on Verza TV`,
    description: series.logline,
    alternates: { canonical: `/series/${slug}` },
    openGraph: {
      title: series.title,
      description: series.logline,
      url: `/series/${slug}`,
      type: "video.tv_show",
      images: series.posterUrl ? [{ url: series.posterUrl, width: 800, height: 1067, alt: series.title }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: series.title,
      description: series.logline,
      images: series.posterUrl ? [series.posterUrl] : [],
    },
  };
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

function hashCode(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export default async function SeriesPage({ params }: Props) {
  const { slug } = await params;
  const series = getSeriesWithDetail(slug);
  if (!series) notFound();

  const pseudoViews = 50000 + (hashCode(series.slug) % 950000);

  const episodes = getEpisodesForSeries(slug);
  const BASE_URL =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://verzatv.com";

  return (
    <>
      {/* ---- JSON-LD ---- */}
      <JsonLd
        data={[
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
          ]),
        ]}
      />

      {/* ---- Hero Poster ---- */}
      <section className="series-hero relative w-full" style={{ aspectRatio: "3 / 4", maxHeight: "50vh", background: "#07070E" }}>
        {series.posterUrl ? (
          <Image
            src={series.posterUrl}
            alt={series.title}
            fill
            priority
            sizes="100vw"
            className="object-contain"
            style={{ filter: "saturate(1.12) contrast(1.04) brightness(1.02)" }}
          />
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center text-lg font-bold"
            style={{ background: `linear-gradient(135deg, ${T.raised}, ${T.surface})`, color: T.textMute }}
          >
            {series.title}
          </div>
        )}
        {/* Gradient fade to background */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to bottom, transparent 30%, ${T.bg} 100%)`,
          }}
        />
      </section>

      {/* ---- Series Info ---- */}
      <div className="px-4 -mt-12 relative z-10">
        {/* Title */}
        <h1
          className="text-2xl font-bold leading-tight mb-2"
          style={{ color: T.text }}
        >
          {series.title}
        </h1>

        {/* Genre badge + episode count */}
        <div className="flex items-center gap-2 mb-3">
          <span
            className="text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full"
            style={{
              background: T.accent,
              color: T.text,
            }}
          >
            {series.genre}
          </span>
          <span
            className="text-xs font-medium"
            style={{ color: T.textDim }}
          >
            {series.episodeCount} episodes
          </span>
        </div>

        {/* Logline */}
        <p
          className="text-sm leading-relaxed mb-3"
          style={{ color: T.textDim }}
        >
          {series.logline}
        </p>

        {/* Rating + Year */}
        {series.rating && (
          <div className="flex items-center gap-3 mb-3">
            <span
              className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded"
              style={{ background: `${T.coin}22`, color: T.coin, boxShadow: "0 0 8px rgba(246, 200, 0, 0.2)" }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill={T.coin} stroke="none">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              {series.rating.toFixed(1)}
            </span>
            {series.year && (
              <span className="text-xs" style={{ color: T.textMute }}>
                {series.year}
              </span>
            )}
            <span className="text-xs" style={{ color: T.textMute }}>
              {series.channel}
            </span>
          </div>
        )}

        {/* Social proof */}
        <div className="flex items-center gap-3 mb-3">
          <span className="text-xs" style={{ color: T.textDim }}>
            {(pseudoViews).toLocaleString()} views
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(224, 17, 95, 0.15)", color: T.accent }}>
            Trending
          </span>
        </div>

        {/* Description */}
        {series.description && (
          <p
            className="text-sm leading-relaxed mb-4"
            style={{ color: T.textDim }}
          >
            {series.description}
          </p>
        )}

        {/* Cast */}
        {series.cast && series.cast.length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-semibold mb-1" style={{ color: T.textMute }}>
              Cast
            </p>
            <p className="text-sm" style={{ color: T.textDim }}>
              {series.cast.join(" \u00b7 ")}
            </p>
          </div>
        )}

        {/* Tags */}
        {series.tags && series.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {series.tags.map((tag) => (
              <span
                key={tag}
                className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                style={{ background: `${T.accent}22`, color: T.accent, border: `1px solid ${T.accent}30` }}
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* First 5 Free badge */}
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold mb-6"
          style={{
            background: `${T.accent}33`,
            color: T.accent,
            border: `1px solid ${T.accent}44`,
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
          First {FREE_EPISODES} Episodes FREE
        </div>

        <Link
          href={`/series/${series.slug}/1`}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold no-underline transition-transform active:scale-95 mb-6"
          style={{
            background: "linear-gradient(135deg, #E0115F, #8B5CF6)",
            color: "#fff",
            boxShadow: "0 0 20px rgba(224, 17, 95, 0.3)",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff" stroke="none">
            <polygon points="6 3 20 12 6 21" />
          </svg>
          Watch Episode 1 Free
        </Link>

        {/* ---- Season Pass Card ---- */}
        <div
          className="rounded-xl p-4 mb-6"
          style={{
            background: T.raised,
            border: `1px solid ${T.line}`,
            boxShadow: "0 0 12px rgba(224, 17, 95, 0.08)",
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p
                className="text-sm font-bold mb-0.5"
                style={{ color: T.text }}
              >
                Season Pass
              </p>
              <p
                className="text-xs"
                style={{ color: T.textDim }}
              >
                Unlock all {series.episodeCount} episodes
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill={T.coin}
                stroke="none"
              >
                <circle cx="12" cy="12" r="10" />
                <text
                  x="12"
                  y="16"
                  textAnchor="middle"
                  fontSize="12"
                  fontWeight="bold"
                  fill={T.bg}
                >
                  C
                </text>
              </svg>
              <span
                className="text-base font-bold"
                style={{ color: T.coin }}
              >
                {formatCoins(series.seasonPassCoins)}
              </span>
            </div>
          </div>
        </div>

        {/* ---- Episode List ---- */}
        <h2
          className="text-base font-bold mb-3"
          style={{ color: T.text }}
        >
          Episodes
        </h2>

        <div className="episode-list flex flex-col gap-2 mb-8">
          {episodes.map((ep) => {
            const isFree = ep.number <= FREE_EPISODES;
            return (
              <Link
                key={ep.number}
                href={`/series/${series.slug}/${ep.number}`}
                className="flex items-center gap-3 rounded-xl px-4 py-3 no-underline transition-colors"
                style={{
                  background: T.surface,
                  border: `1px solid ${T.line}`,
                }}
              >
                {/* Episode number */}
                <span
                  className="text-sm font-bold w-7 text-center flex-shrink-0"
                  style={{ color: T.textMute }}
                >
                  {ep.number}
                </span>

                {/* Episode title + duration */}
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-medium truncate"
                    style={{ color: T.text }}
                  >
                    {ep.title}
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: T.textMute }}
                  >
                    {formatDuration(ep.durationS)}
                  </p>
                </div>

                {/* Free or coin badge */}
                {isFree ? (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={T.success}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                    <span
                      className="text-xs font-bold uppercase"
                      style={{ color: T.success }}
                    >
                      Free
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill={T.coin}
                      stroke="none"
                    >
                      <circle cx="12" cy="12" r="10" />
                    </svg>
                    <span
                      className="text-xs font-bold"
                      style={{ color: T.coin }}
                    >
                      {ep.unlockCoins}
                    </span>
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Bottom spacer for BottomNav */}
      <div className="h-8" />
    </>
  );
}
