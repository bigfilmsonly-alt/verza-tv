import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import {
  SERIES,
  getSeriesBySlug,
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
  const series = getSeriesBySlug(slug);
  if (!series) return { title: "Not Found" };

  return {
    title: `${series.title} -- Watch Free on Verza TV`,
    description: series.logline,
    openGraph: {
      title: series.title,
      description: series.logline,
      images: [series.posterUrl],
    },
  };
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default async function SeriesPage({ params }: Props) {
  const { slug } = await params;
  const series = getSeriesBySlug(slug);
  if (!series) notFound();

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
      <section className="relative w-full" style={{ aspectRatio: "16 / 9" }}>
        {series.posterUrl ? (
          <Image
            src={series.posterUrl}
            alt={series.title}
            fill
            priority
            sizes="100vw"
            className="object-cover object-top"
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
          className="text-sm leading-relaxed mb-4"
          style={{ color: T.textDim }}
        >
          {series.logline}
        </p>

        {/* First 5 Free badge */}
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold mb-6"
          style={{
            background: `${T.accent}22`,
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

        {/* ---- Season Pass Card ---- */}
        <div
          className="rounded-xl p-4 mb-6"
          style={{
            background: T.raised,
            border: `1px solid ${T.line}`,
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

        <div className="flex flex-col gap-2 mb-8">
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
