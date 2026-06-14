import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { catalog, getSeriesByGenre } from "@/lib/catalog";
import { itemListSchema, breadcrumbSchema } from "@/lib/schemas";
import JsonLd from "@/components/JsonLd";
import { T } from "@/lib/theme";

/* ------------------------------------------------------------------ */
/*  Genre definitions                                                  */
/* ------------------------------------------------------------------ */

const GENRE_DATA: Record<
  string,
  { label: string; title: string; description: string; keywords: string[] }
> = {
  romance: {
    label: "Romance",
    title: "Best Romance Microdramas on Verza TV",
    description:
      "Fall in love with Verza TV's romance micro-dramas. From billionaire romances and forbidden love stories to friends-to-lovers twists, every series delivers heart-racing chemistry in 60-second vertical episodes. Start any series free with the first 5 episodes.",
    keywords: [
      "romance microdramas",
      "love stories",
      "billionaire romance",
      "forbidden love",
      "contract marriage",
    ],
  },
  thriller: {
    label: "Thriller",
    title: "Best Thriller Microdramas on Verza TV",
    description:
      "Edge-of-your-seat thriller micro-dramas on Verza TV. Psychological suspense, crime twists, and jaw-dropping reveals packed into 60-second vertical episodes. These are the shows you binge in one sitting. First 5 episodes always free.",
    keywords: [
      "thriller microdramas",
      "suspense series",
      "psychological thriller",
      "crime drama",
      "mystery thriller",
    ],
  },
  drama: {
    label: "Drama",
    title: "Best Drama Microdramas on Verza TV",
    description:
      "Powerful drama micro-series on Verza TV. Family secrets, dynasty battles, betrayal arcs, and emotional stories told in cinematic 60-second vertical episodes. Binge the best short-form drama content with the first 5 episodes free.",
    keywords: [
      "drama microdramas",
      "family drama",
      "betrayal drama",
      "dynasty series",
      "emotional drama",
    ],
  },
  comedy: {
    label: "Comedy",
    title: "Best Comedy Microdramas on Verza TV",
    description:
      "Laugh-out-loud comedy micro-dramas on Verza TV. Romantic comedies, workplace humor, and witty storylines in fast-paced 60-second vertical episodes. Light, bingeable, and free to start.",
    keywords: [
      "comedy microdramas",
      "romantic comedy",
      "funny series",
      "comedy shorts",
      "workplace comedy",
    ],
  },
  mystery: {
    label: "Mystery",
    title: "Best Mystery Microdramas on Verza TV",
    description:
      "Unravel the truth with Verza TV's mystery micro-dramas. Cold cases, hidden identities, and shocking reveals in 60-second vertical episodes that keep you guessing until the final scene. Start watching free.",
    keywords: [
      "mystery microdramas",
      "whodunit series",
      "cold case drama",
      "mystery romance",
      "detective series",
    ],
  },
  billionaire: {
    label: "Billionaire",
    title: "Best Billionaire Microdramas on Verza TV",
    description:
      "Luxury, power, and passion collide in Verza TV's billionaire micro-dramas. Contract marriages, corporate empires, secret heirs, and high-stakes romance in cinematic 60-second vertical episodes. The first 5 episodes of every series are free.",
    keywords: [
      "billionaire microdramas",
      "billionaire romance",
      "rich CEO drama",
      "luxury romance",
      "billionaire love story",
    ],
  },
  revenge: {
    label: "Revenge",
    title: "Best Revenge Microdramas on Verza TV",
    description:
      "She was wronged. Now she's back. Verza TV's revenge micro-dramas deliver cunning comebacks, power plays, and satisfying justice in 60-second vertical episodes. Binge the most addictive payback stories with the first 5 episodes free.",
    keywords: [
      "revenge microdramas",
      "revenge drama",
      "payback series",
      "revenge romance",
      "comeback stories",
    ],
  },
  forbidden: {
    label: "Forbidden",
    title: "Best Forbidden Love Microdramas on Verza TV",
    description:
      "Love knows no rules. Verza TV's forbidden romance micro-dramas explore taboo attractions, secret affairs, and impossible love stories in 60-second vertical episodes that keep you hooked. Start free with 5 episodes per series.",
    keywords: [
      "forbidden love microdramas",
      "forbidden romance",
      "taboo love stories",
      "secret affair drama",
      "impossible love",
    ],
  },
};

const GENRE_SLUGS = Object.keys(GENRE_DATA);

/* ------------------------------------------------------------------ */
/*  Static params                                                      */
/* ------------------------------------------------------------------ */

export function generateStaticParams() {
  return GENRE_SLUGS.map((genre) => ({ genre }));
}

/* ------------------------------------------------------------------ */
/*  Metadata                                                           */
/* ------------------------------------------------------------------ */

type Props = { params: Promise<{ genre: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { genre } = await params;
  const data = GENRE_DATA[genre];
  if (!data) return { title: "Not Found" };

  const BASE_URL =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://verzatv.com";

  return {
    title: data.title,
    description: data.description,
    alternates: { canonical: `/genre/${genre}` },
    keywords: data.keywords,
    openGraph: {
      title: data.title,
      description: data.description,
      url: `${BASE_URL}/genre/${genre}`,
      type: "website",
      siteName: "Verza TV",
    },
    twitter: {
      card: "summary_large_image",
      title: data.title,
      description: data.description,
    },
  };
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default async function GenreLandingPage({ params }: Props) {
  const { genre } = await params;
  const data = GENRE_DATA[genre];
  if (!data) notFound();

  const BASE_URL =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://verzatv.com";

  const matches = getSeriesByGenre(genre).filter((s) => s.status === "live");

  // Also broaden: search title/logline for the genre keyword
  const broadMatches = catalog.filter(
    (s) =>
      s.status === "live" &&
      !matches.find((m) => m.slug === s.slug) &&
      (s.title.toLowerCase().includes(genre.toLowerCase()) ||
        s.logline.toLowerCase().includes(genre.toLowerCase()))
  );

  const allMatches = [...matches, ...broadMatches];

  return (
    <>
      {/* JSON-LD: ItemList + BreadcrumbList */}
      <JsonLd
        data={[
          itemListSchema({
            name: `Best ${data.label} Shows on Verza TV`,
            description: data.description,
            items: allMatches.map((s, i) => ({
              name: s.title,
              url: `${BASE_URL}/series/${s.slug}`,
              image: s.posterUrl
                ? `${BASE_URL}${s.posterUrl}`
                : undefined,
              position: i + 1,
            })),
          }),
          breadcrumbSchema([
            { name: "Home", url: BASE_URL },
            { name: "Discover", url: `${BASE_URL}/discover` },
            {
              name: `${data.label} Micro-Dramas`,
              url: `${BASE_URL}/genre/${genre}`,
            },
          ]),
        ]}
      />

      {/* Hero section */}
      <section
        className="px-4 pt-8 pb-6"
        style={{
          background: `linear-gradient(180deg, ${T.accent}15 0%, ${T.bg} 100%)`,
        }}
      >
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
          className="text-3xl font-bold leading-tight mb-3"
          style={{ color: T.text }}
        >
          Best {data.label} Shows on Verza TV
        </h1>

        <p
          className="text-sm leading-relaxed mb-4 max-w-xl"
          style={{ color: T.textDim }}
        >
          {data.description}
        </p>

        <div className="flex items-center gap-3">
          <span
            className="text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full"
            style={{ background: T.accent, color: T.text }}
          >
            {allMatches.length} {allMatches.length === 1 ? "Series" : "Series"}
          </span>
          <span className="text-xs" style={{ color: T.textMute }}>
            New episodes weekly
          </span>
        </div>
      </section>

      {/* Poster grid */}
      <section className="px-4 pt-4 pb-8">
        {allMatches.length === 0 ? (
          <div
            className="rounded-xl p-8 text-center"
            style={{ background: T.surface }}
          >
            <p className="text-sm mb-1" style={{ color: T.textDim }}>
              No {data.label.toLowerCase()} series yet.
            </p>
            <p className="text-xs" style={{ color: T.textMute }}>
              New titles are added every week.{" "}
              <Link
                href="/discover"
                className="underline"
                style={{ color: T.accent }}
              >
                Explore all genres
              </Link>
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {allMatches.map((series) => (
              <Link
                key={series.slug}
                href={`/series/${series.slug}`}
                className="group no-underline"
              >
                <div
                  className="relative aspect-[3/4] rounded-lg overflow-hidden mb-1.5"
                  style={{ background: T.raised }}
                >
                  {series.posterUrl ? (
                    <Image
                      src={series.posterUrl}
                      alt={series.title}
                      fill
                      sizes="(min-width: 768px) 20vw, 33vw"
                      className="object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div
                      className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-center px-2"
                      style={{ color: T.textMute }}
                    >
                      {series.title}
                    </div>
                  )}
                  {/* Free badge */}
                  <div
                    className="absolute bottom-1.5 left-1.5 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded"
                    style={{ background: T.accent, color: T.text }}
                  >
                    5 Free
                  </div>
                </div>
                <p
                  className="text-xs font-medium truncate"
                  style={{ color: T.text }}
                >
                  {series.title}
                </p>
                <p
                  className="text-[10px] truncate"
                  style={{ color: T.textMute }}
                >
                  {series.genre} &middot; {series.episodeCount} ep
                </p>
              </Link>
            ))}
          </div>
        )}

        {/* Related genre links for internal linking / SEO */}
        <div className="mt-10">
          <h2
            className="text-sm font-semibold uppercase tracking-wider mb-3"
            style={{ color: T.textMute }}
          >
            Explore More Genres
          </h2>
          <div className="flex flex-wrap gap-2">
            {GENRE_SLUGS.filter((g) => g !== genre).map((g) => (
              <Link
                key={g}
                href={`/genre/${g}`}
                className="text-xs font-medium px-3 py-1.5 rounded-full no-underline transition-colors"
                style={{
                  background: `${T.accent}15`,
                  color: T.accent,
                  border: `1px solid ${T.accent}30`,
                }}
              >
                {GENRE_DATA[g].label}
              </Link>
            ))}
          </div>
        </div>

        {/* Rich SEO content */}
        <div className="mt-8" style={{ color: T.textMute }}>
          <h2 className="text-sm font-semibold mb-2" style={{ color: T.textDim }}>
            Why Watch {data.label} Micro-Dramas on Verza TV?
          </h2>
          <div className="text-xs leading-relaxed space-y-3">
            <p>
              Verza TV is the first US-based vertical micro-drama streaming
              platform with over 80 original series. Every episode runs 60 to
              120 seconds, filmed in cinematic 9:16 for phone-first viewing.
            </p>
            <p>
              Our {data.label.toLowerCase()} collection features hand-picked
              series with high-stakes storytelling, compelling characters, and
              cliffhangers that keep you coming back. Start any series free
              with the first 5 episodes, then unlock the rest with coins.
            </p>
            <p>
              Whether you have a commute to fill or five minutes before bed,
              Verza TV {data.label.toLowerCase()} micro-dramas deliver
              full-season storylines in bite-sized episodes you can binge
              anywhere.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
