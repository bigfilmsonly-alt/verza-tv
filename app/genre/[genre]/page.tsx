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
    title: "Romance Microdramas on VERZA TV",
    description:
      "Explore VERZA TV romance micro-dramas, from billionaire and forbidden love stories to friends-to-lovers twists, in a short-form vertical format. Free-preview availability is shown per title.",
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
    title: "Thriller Microdramas on VERZA TV",
    description:
      "Explore VERZA TV thriller micro-dramas with psychological suspense, crime twists, and escalating reveals in a short-form vertical format. Free-preview availability is shown per title.",
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
    title: "Drama Microdramas on VERZA TV",
    description:
      "Explore VERZA TV drama micro-series with family secrets, dynasty battles, betrayal arcs, and emotional stories told in a cinematic vertical format.",
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
    title: "Comedy Microdramas on VERZA TV",
    description:
      "Explore VERZA TV comedy micro-dramas with romantic mishaps, workplace humor, and witty storylines in a short-form vertical format.",
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
    title: "Mystery Microdramas on VERZA TV",
    description:
      "Explore VERZA TV mystery micro-dramas with cold cases, hidden identities, and escalating reveals in a short-form vertical format.",
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
    title: "Billionaire Microdramas on VERZA TV",
    description:
      "Luxury, power, and passion collide in VERZA TV's billionaire micro-dramas, with contract marriages, corporate empires, secret heirs, and high-stakes romance in a cinematic vertical format.",
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
    title: "Revenge Microdramas on VERZA TV",
    description:
      "She was wronged. Now she's back. VERZA TV's revenge micro-dramas deliver cunning comebacks, power plays, and payback in a short-form vertical format.",
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
    title: "Forbidden Love Microdramas on VERZA TV",
    description:
      "Love knows no rules. VERZA TV's forbidden romance micro-dramas explore taboo attractions, secret affairs, and impossible love stories in a short-form vertical format.",
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
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.verzatv.com";

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
      siteName: "VERZA TV",
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
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.verzatv.com";

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
            name: `Best ${data.label} Shows on VERZA TV`,
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
          Best {data.label} Shows on VERZA TV
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
            Current catalog
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
              Catalog availability changes over time.{" "}
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
                    {series.freeEpisodes >= series.episodeCount
                      ? "All Free"
                      : `${series.freeEpisodes} Free`}
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
            Why Watch {data.label} Micro-Dramas on VERZA TV?
          </h2>
          <div className="text-xs leading-relaxed space-y-3">
            <p>
              VERZA TV presents short-form micro-dramas in cinematic vertical
              9:16 for phone-first viewing. Episode lengths vary by title.
            </p>
            <p>
              This {data.label.toLowerCase()} collection is selected from the
              current catalog. Each title page shows its episode count,
              free-preview availability, and current access details.
            </p>
            <p>
              VERZA TV {data.label.toLowerCase()} micro-dramas use short-form
              vertical chapters designed for phone-first viewing.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
