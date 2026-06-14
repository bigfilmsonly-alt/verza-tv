import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { catalog, BROWSE_TABS } from "@/lib/catalog";
import { breadcrumbSchema } from "@/lib/schemas";
import JsonLd from "@/components/JsonLd";
import { T } from "@/lib/theme";

/* ------------------------------------------------------------------ */
/*  Genre descriptions for SEO                                         */
/* ------------------------------------------------------------------ */

const GENRE_DESCRIPTIONS: Record<string, string> = {
  drama:
    "Intense family secrets, dynasty battles, and emotional storylines. Verza TV drama micro-dramas pack full-season stakes into 60-second vertical episodes.",
  new:
    "The freshest micro-dramas on Verza TV. Catch new premieres and recently added series before everyone else.",
  popular:
    "The most-watched micro-dramas on Verza TV right now. See what everyone is binging this week.",
  music:
    "Music and entertainment-themed shows on Verza TV, from reality formats to behind-the-scenes content.",
  reality:
    "Reality-style micro-dramas on Verza TV. Power games, talk shows, and unscripted entertainment in vertical format.",
  "red-carpet":
    "Glamour and awards on Verza TV. Red carpet events, award shows, and celebrity micro-drama specials.",
  romance:
    "Sweeping love stories, billionaire romances, and forbidden attractions. Verza TV romance micro-dramas deliver heart-racing chemistry in every 60-second episode.",
  thriller:
    "Edge-of-your-seat psychological thrillers and crime mysteries. Verza TV thriller micro-dramas keep you guessing with plot twists in every episode.",
  comedy:
    "Light, witty, and bingeable. Verza TV comedy micro-dramas bring laughs, romantic mishaps, and workplace humor in 60-second vertical episodes.",
  mystery:
    "Cold cases, hidden identities, and shocking reveals. Verza TV mystery micro-dramas will keep you guessing until the final scene.",
  "sci-fi":
    "Time travel, supernatural twists, and mind-bending storylines. Verza TV sci-fi micro-dramas push the boundaries of short-form storytelling.",
  horror:
    "Gothic mansions, psychological terror, and supernatural secrets. Verza TV horror micro-dramas deliver chills in 60-second vertical episodes.",
  crime:
    "Undercover agents, crime families, and dangerous investigations. Verza TV crime micro-dramas explore the world of law and the lawless.",
  fantasy:
    "Supernatural connections and otherworldly love stories. Verza TV fantasy micro-dramas blend magic with cinematic storytelling.",
};

const KNOWN_GENRES = [
  ...BROWSE_TABS.map((t) => t.key),
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
];

/* ------------------------------------------------------------------ */
/*  Static params                                                      */
/* ------------------------------------------------------------------ */

export function generateStaticParams() {
  return KNOWN_GENRES.map((genre) => ({ genre }));
}

/* ------------------------------------------------------------------ */
/*  Metadata                                                           */
/* ------------------------------------------------------------------ */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ genre: string }>;
}): Promise<Metadata> {
  const { genre } = await params;
  const label = genre.charAt(0).toUpperCase() + genre.slice(1);
  const description =
    GENRE_DESCRIPTIONS[genre] ??
    `Stream the best ${label.toLowerCase()} micro-dramas on Verza TV.`;

  const BASE_URL =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://verzatv.com";

  return {
    title: `Best ${label} Micro-Dramas on Verza TV`,
    description: `${description} Short-form vertical episodes, free to start, binge-worthy from the first scene.`,
    alternates: { canonical: `/discover/${genre}` },
    openGraph: {
      title: `Best ${label} Micro-Dramas on Verza TV`,
      description,
      url: `${BASE_URL}/discover/${genre}`,
      type: "website",
      siteName: "Verza TV",
    },
    twitter: {
      card: "summary_large_image",
      title: `Best ${label} Micro-Dramas on Verza TV`,
      description,
    },
  };
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default async function GenrePage({
  params,
}: {
  params: Promise<{ genre: string }>;
}) {
  const { genre } = await params;
  const label = genre.charAt(0).toUpperCase() + genre.slice(1);
  const description = GENRE_DESCRIPTIONS[genre];

  const BASE_URL =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://verzatv.com";

  // Match broadly: "romance" matches "Mystery romance", "Billionaire romance", etc.
  const matches = catalog.filter(
    (s) => s.genre.toLowerCase().includes(genre.toLowerCase()),
  );
  const liveMatches = matches.filter((s) => s.status === "live");

  return (
    <>
      {/* JSON-LD: Breadcrumb */}
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", url: BASE_URL },
          { name: "Discover", url: `${BASE_URL}/discover` },
          { name: `${label} Micro-Dramas`, url: `${BASE_URL}/discover/${genre}` },
        ])}
      />

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

        {/* Genre description paragraph */}
        {description && (
          <p
            className="text-sm leading-relaxed mb-4 max-w-xl"
            style={{ color: T.textDim }}
          >
            {description}
          </p>
        )}

        <p className="text-sm mb-6" style={{ color: T.textMute }}>
          {liveMatches.length} series &middot; New episodes weekly
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
                  {series.posterUrl ? (
                    <Image
                      src={series.posterUrl}
                      alt={series.title}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  ) : (
                    <div
                      className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-center px-1"
                      style={{ color: T.textMute }}
                    >
                      {series.episodeCount}ep
                    </div>
                  )}
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
          <div className="text-xs leading-relaxed space-y-2">
            <p>
              Verza TV is the premier platform for vertical micro-dramas.
              Each episode runs 60 to 120 seconds, filmed in cinematic 9:16
              for phone-first viewing. Start any series free with the first 5
              episodes, then unlock the rest with coins.
            </p>
            <p>
              Our {label.toLowerCase()} catalog features {liveMatches.length}{" "}
              original series with new titles added weekly. From heart-pounding
              thrillers to sweeping romances, there is always something new
              to binge on Verza TV.
            </p>
          </div>
        </div>

        {/* Cross-link to other genre pages */}
        <div className="mt-8">
          <h2
            className="text-xs font-semibold uppercase tracking-wider mb-3"
            style={{ color: T.textMute }}
          >
            More Genres
          </h2>
          <div className="flex flex-wrap gap-2">
            {["romance", "thriller", "drama", "comedy", "mystery"].filter((g) => g !== genre).map((g) => (
              <Link
                key={g}
                href={`/discover/${g}`}
                className="text-[10px] font-medium px-2.5 py-1 rounded-full no-underline"
                style={{
                  background: `${T.accent}15`,
                  color: T.accent,
                  border: `1px solid ${T.accent}30`,
                }}
              >
                {g.charAt(0).toUpperCase() + g.slice(1)}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
