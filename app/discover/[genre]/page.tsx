import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { catalog } from "@/lib/catalog";
import { T } from "@/lib/theme";

const KNOWN_GENRES = [
  "romance",
  "thriller",
  "drama",
  "comedy",
  "reality",
  "mystery",
  "sci-fi",
  "horror",
  "crime",
  "fantasy",
] as const;

export function generateStaticParams() {
  return KNOWN_GENRES.map((genre) => ({ genre }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ genre: string }>;
}): Promise<Metadata> {
  const { genre } = await params;
  const label = genre.charAt(0).toUpperCase() + genre.slice(1);

  return {
    title: `Best ${label} Micro-Dramas on Verza TV`,
    description: `Stream the best ${label.toLowerCase()} micro-dramas on Verza TV. Short-form vertical episodes, free to start, binge-worthy from the first scene.`,
  };
}

export default async function GenrePage({
  params,
}: {
  params: Promise<{ genre: string }>;
}) {
  const { genre } = await params;
  const label = genre.charAt(0).toUpperCase() + genre.slice(1);

  // Match broadly: "romance" matches "Mystery romance", "Billionaire romance", etc.
  const matches = catalog.filter(
    (s) => s.genre.toLowerCase().includes(genre.toLowerCase()),
  );

  return (
    <section className="px-4 pt-6 pb-8">
      <Link
        href="/discover"
        className="inline-flex items-center gap-1 text-sm mb-4 no-underline"
        style={{ color: T.textMute }}
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
          <path d="M15 18l-6-6 6-6" />
        </svg>
        Discover
      </Link>

      <h1
        className="text-2xl font-bold mb-1"
        style={{ color: T.text }}
      >
        {label} Micro-Dramas
      </h1>
      <p className="text-sm mb-6" style={{ color: T.textMute }}>
        {matches.length} series &middot; New episodes weekly
      </p>

      {matches.length === 0 ? (
        <div
          className="rounded-xl p-8 text-center"
          style={{ background: T.surface }}
        >
          <p className="text-sm mb-1" style={{ color: T.textDim }}>
            No {label.toLowerCase()} series yet.
          </p>
          <p className="text-xs" style={{ color: T.textMute }}>
            New titles are added every week. Check back soon.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {matches.map((series) => (
            <Link
              key={series.slug}
              href={`/series/${series.slug}`}
              className="flex items-center gap-4 rounded-xl p-3 no-underline transition-colors"
              style={{ background: T.surface, color: T.text }}
            >
              <div
                className="w-14 h-20 rounded-lg flex-shrink-0 overflow-hidden relative"
                style={{ background: T.raised }}
              >
                <Image
                  src={series.posterUrl}
                  alt={series.title}
                  fill
                  sizes="56px"
                  className="object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate">
                  {series.title}
                </p>
                <p
                  className="text-xs mt-0.5 line-clamp-2"
                  style={{ color: T.textDim }}
                >
                  {series.logline}
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span
                    className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                    style={{ background: `${T.accent}22`, color: T.accent }}
                  >
                    {series.genre}
                  </span>
                  {series.status === "coming_soon" && (
                    <span
                      className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                      style={{ background: `${T.coin}22`, color: T.coin }}
                    >
                      Coming Soon
                    </span>
                  )}
                  {series.status === "live" && (
                    <span
                      className="text-[10px]"
                      style={{ color: T.textMute }}
                    >
                      {series.episodeCount} ep &middot; {series.freeEpisodes}{" "}
                      free
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* SEO-friendly crawlable content */}
      <div className="mt-10" style={{ color: T.textMute }}>
        <h2 className="text-sm font-semibold mb-2">
          About {label} Micro-Dramas on Verza TV
        </h2>
        <p className="text-xs leading-relaxed">
          Verza TV is the premier platform for vertical micro-dramas.
          Each episode runs 60 to 120 seconds, filmed in cinematic 9:16
          for phone-first viewing. Start any series free with the first 5
          episodes, then unlock the rest with coins. From heart-pounding
          thrillers to sweeping romances, there is always something new
          to binge.
        </p>
      </div>
    </section>
  );
}
