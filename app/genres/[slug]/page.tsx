import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import JsonLd from "@/components/JsonLd";
import { itemListSchema, breadcrumbSchema } from "@/lib/schemas";
import { T } from "@/lib/theme";
import { BRAND } from "@/lib/config";
import { getLiveSeries } from "@/lib/catalog";
import { GENRE_HUBS, getGenreHub } from "@/lib/content/genres";

export async function generateStaticParams() {
  return GENRE_HUBS.filter((g) => g.editorialApproved).map((g) => ({
    slug: g.slug,
  }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const genre = getGenreHub(slug);
  if (!genre) return { title: "Not Found" };

  return {
    title: `${genre.name} Shows | ${BRAND.name}`,
    description: genre.description,
    alternates: { canonical: `/genres/${slug}` },
    robots: { index: genre.editorialApproved, follow: true },
  };
}

export default async function GenreHubPage({ params }: Props) {
  const { slug } = await params;
  const genre = getGenreHub(slug);
  if (!genre || !genre.editorialApproved) notFound();

  const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://verzatv.com";

  // 1) Strict tag match against the series' genre string + tags array.
  const allSeries = getLiveSeries();
  const tagMatches = allSeries.filter((s) => {
    const sGenre = s.genre.toLowerCase();
    const sTags = (s.tags || []).map((t) => t.toLowerCase());
    return genre.tags.some(
      (tag) => sGenre.includes(tag) || sTags.includes(tag),
    );
  });

  // 2) Broad fallback: search title / logline / genre for hub keywords so no
  //    approved hub renders an empty (doorway) page. Mirrors /genre/[genre].
  const broadTerms = [
    ...genre.tags,
    ...(genre.matchTerms ?? []),
  ].map((t) => t.toLowerCase());
  const broadMatches = allSeries.filter(
    (s) =>
      !tagMatches.find((m) => m.slug === s.slug) &&
      broadTerms.some((term) => {
        const hay = `${s.title} ${s.logline} ${s.genre}`.toLowerCase();
        return hay.includes(term);
      }),
  );

  const matching = [...tagMatches, ...broadMatches];

  // Related hubs for cross-linking (curate by relatedSlugs, fall back to siblings)
  const relatedHubs = (
    genre.relatedSlugs && genre.relatedSlugs.length > 0
      ? genre.relatedSlugs
          .map((rs) => GENRE_HUBS.find((g) => g.slug === rs))
          .filter((g): g is (typeof GENRE_HUBS)[number] => Boolean(g))
      : GENRE_HUBS.filter((g) => g.slug !== slug)
  )
    .filter((g) => g.editorialApproved && g.slug !== slug)
    .slice(0, 6);

  return (
    <>
      <JsonLd
        data={[
          itemListSchema({
            name: `${genre.name} Shows on Verza TV`,
            description: genre.description,
            items: matching.slice(0, 20).map((s, i) => ({
              name: s.title,
              url: `${BASE_URL}/series/${s.slug}`,
              image: s.posterUrl ? `${BASE_URL}${s.posterUrl}` : undefined,
              position: i + 1,
            })),
          }),
          breadcrumbSchema([
            { name: "Home", url: BASE_URL },
            { name: genre.name, url: `${BASE_URL}/genres/${slug}` },
          ]),
        ]}
      />

      <section className="px-4 pt-6 pb-8">
        <h1 className="text-2xl font-bold mb-2" style={{ color: T.text }}>
          {genre.name}
        </h1>
        <p className="text-sm leading-relaxed mb-6" style={{ color: T.textDim }}>
          {genre.description}
        </p>

        <p className="text-xs uppercase tracking-wider font-semibold mb-3" style={{ color: T.textMute }}>
          {matching.length} series
        </p>

        <div className="grid grid-cols-3 gap-3">
          {matching.map((s) => (
            <Link
              key={s.slug}
              href={`/series/${s.slug}/1`}
              className="block no-underline"
            >
              <div
                className="relative rounded-lg overflow-hidden"
                style={{ aspectRatio: "2 / 3" }}
              >
                <Image
                  src={s.posterUrl}
                  alt={s.title}
                  fill
                  sizes="(max-width: 440px) 33vw, 140px"
                  className="object-cover"
                />
              </div>
              <p
                className="text-[11px] font-semibold mt-1.5 line-clamp-2 leading-tight"
                style={{ color: T.text }}
              >
                {s.title}
              </p>
            </Link>
          ))}
        </div>

        {matching.length === 0 && (
          <p className="text-sm py-8 text-center" style={{ color: T.textMute }}>
            More {genre.name.toLowerCase()} series coming soon.
          </p>
        )}

        {relatedHubs.length > 0 && (
          <div className="mt-10">
            <h2
              className="text-sm font-semibold uppercase tracking-wider mb-3"
              style={{ color: T.textMute }}
            >
              Related Genres
            </h2>
            <div className="flex flex-wrap gap-2">
              {relatedHubs.map((g) => (
                <Link
                  key={g.slug}
                  href={`/genres/${g.slug}`}
                  className="text-xs font-medium px-3 py-1.5 rounded-full no-underline"
                  style={{
                    background: `${T.accent}15`,
                    color: T.accent,
                    border: `1px solid ${T.accent}30`,
                  }}
                >
                  {g.name}
                </Link>
              ))}
            </div>
            <Link
              href="/genres"
              className="inline-block mt-4 text-xs font-medium underline no-underline"
              style={{ color: T.textDim }}
            >
              Browse all genres
            </Link>
          </div>
        )}
      </section>
    </>
  );
}
