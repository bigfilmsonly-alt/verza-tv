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

  // Find matching series by genre tags
  const allSeries = getLiveSeries();
  const matching = allSeries.filter((s) => {
    const sGenre = s.genre.toLowerCase();
    const sTags = (s.tags || []).map((t) => t.toLowerCase());
    return genre.tags.some(
      (tag) => sGenre.includes(tag) || sTags.includes(tag),
    );
  });

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
      </section>
    </>
  );
}
