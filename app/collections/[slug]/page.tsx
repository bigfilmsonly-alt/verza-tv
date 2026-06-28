import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getLiveSeries } from "@/lib/catalog";
import { itemListSchema, breadcrumbSchema, faqSchema } from "@/lib/schemas";
import JsonLd from "@/components/JsonLd";
import { T } from "@/lib/theme";
import { BRAND } from "@/lib/config";
import { COLLECTIONS, getCollection } from "@/lib/data/collections";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://verzatv.com";

/* ------------------------------------------------------------------ */
/*  Static params                                                      */
/* ------------------------------------------------------------------ */

export function generateStaticParams() {
  return COLLECTIONS.map((c) => ({ slug: c.slug }));
}

/* ------------------------------------------------------------------ */
/*  Metadata                                                           */
/* ------------------------------------------------------------------ */

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const collection = getCollection(slug);
  if (!collection) return { title: "Not Found" };

  return {
    title: `${collection.title} | ${BRAND.name}`,
    description: collection.blurb,
    alternates: { canonical: `/collections/${slug}` },
    openGraph: {
      title: collection.title,
      description: collection.blurb,
      url: `${BASE_URL}/collections/${slug}`,
      type: "website",
      siteName: BRAND.name,
    },
    twitter: {
      card: "summary_large_image",
      title: collection.title,
      description: collection.blurb,
    },
  };
}

/* ------------------------------------------------------------------ */
/*  FAQ generator                                                      */
/* ------------------------------------------------------------------ */

function buildFaq(title: string, count: number) {
  return [
    {
      question: `How many series are in the ${title} collection?`,
      answer: `This collection currently features ${count} live ${
        count === 1 ? "series" : "series"
      } on ${BRAND.name}, hand-picked from our catalog of vertical micro-dramas. We add new titles regularly, so check back often for fresh additions.`,
    },
    {
      question: `Are these ${BRAND.name} series free to watch?`,
      answer:
        "Every series in this collection starts free with the first 5 episodes. After that, you can unlock the rest of the season with coins or a VIP subscription. There's no risk to start — just open a title and start watching.",
    },
    {
      question: `How long is each episode?`,
      answer:
        "Verza TV micro-drama episodes run roughly 60 to 120 seconds each, filmed in cinematic 9:16 vertical for phone-first viewing. A full series tells a complete, season-length story across dozens of bite-sized episodes you can binge anywhere.",
    },
    {
      question: `Where can I find more collections like this?`,
      answer: `Browse all of our curated collections at /collections, or check out our best-of recommendation lists at /best to discover your next binge on ${BRAND.name}.`,
    },
  ];
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default async function CollectionPage({ params }: Props) {
  const { slug } = await params;
  const collection = getCollection(slug);
  if (!collection) notFound();

  const matches = getLiveSeries().filter(collection.match);

  // Related rail: ~6 other collections
  const related = COLLECTIONS.filter((c) => c.slug !== slug).slice(0, 6);

  const faqs = buildFaq(collection.title, matches.length);

  return (
    <>
      {/* JSON-LD: ItemList + Breadcrumb + FAQ */}
      <JsonLd
        data={[
          itemListSchema({
            name: collection.title,
            description: collection.blurb,
            items: matches.map((s, i) => ({
              name: s.title,
              url: `${BASE_URL}/series/${s.slug}`,
              image: s.posterUrl ? `${BASE_URL}${s.posterUrl}` : undefined,
              position: i + 1,
            })),
          }),
          breadcrumbSchema([
            { name: "Home", url: BASE_URL },
            { name: "Collections", url: `${BASE_URL}/collections` },
            { name: collection.title, url: `${BASE_URL}/collections/${slug}` },
          ]),
          faqSchema(faqs),
        ]}
      />

      {/* Hero */}
      <section
        className="px-4 pt-8 pb-6"
        style={{
          background: `linear-gradient(180deg, ${T.accent}15 0%, ${T.bg} 100%)`,
        }}
      >
        <Link
          href="/collections"
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
          Collections
        </Link>

        <h1
          className="text-3xl font-bold leading-tight mb-3"
          style={{ color: T.text }}
        >
          {collection.title}
        </h1>

        <p
          className="text-sm leading-relaxed mb-4 max-w-xl"
          style={{ color: T.textDim }}
        >
          {collection.intro}
        </p>

        <div className="flex items-center gap-3">
          <span
            className="text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full"
            style={{ background: T.accent, color: T.text }}
          >
            {matches.length} {matches.length === 1 ? "Series" : "Series"}
          </span>
          <span className="text-xs" style={{ color: T.textMute }}>
            First 5 episodes free
          </span>
        </div>
      </section>

      {/* Poster grid */}
      <section className="px-4 pt-4 pb-8">
        {matches.length === 0 ? (
          <div
            className="rounded-xl p-8 text-center"
            style={{ background: T.surface }}
          >
            <p className="text-sm mb-1" style={{ color: T.textDim }}>
              No series in this collection yet.
            </p>
            <p className="text-xs" style={{ color: T.textMute }}>
              New titles are added every week.{" "}
              <Link href="/discover" className="underline" style={{ color: T.accent }}>
                Explore all series
              </Link>
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {matches.map((series) => (
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
                <p className="text-[10px] truncate" style={{ color: T.textMute }}>
                  {series.genre} &middot; {series.episodeCount} ep
                </p>
              </Link>
            ))}
          </div>
        )}

        {/* Related collections rail */}
        <div className="mt-10">
          <h2
            className="text-sm font-semibold uppercase tracking-wider mb-3"
            style={{ color: T.textMute }}
          >
            More Collections
          </h2>
          <div className="flex flex-wrap gap-2">
            {related.map((c) => (
              <Link
                key={c.slug}
                href={`/collections/${c.slug}`}
                className="text-xs font-medium px-3 py-1.5 rounded-full no-underline transition-colors"
                style={{
                  background: `${T.accent}15`,
                  color: T.accent,
                  border: `1px solid ${T.accent}30`,
                }}
              >
                {c.title}
              </Link>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-10">
          <h2 className="text-lg font-bold mb-4" style={{ color: T.text }}>
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {faqs.map((f) => (
              <div key={f.question}>
                <h3
                  className="text-sm font-semibold mb-1"
                  style={{ color: T.textDim }}
                >
                  {f.question}
                </h3>
                <p className="text-xs leading-relaxed" style={{ color: T.textMute }}>
                  {f.answer}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Up-link */}
        <div className="mt-10">
          <Link
            href="/best"
            className="text-xs font-medium px-3 py-1.5 rounded-full no-underline"
            style={{
              background: T.surface,
              color: T.textDim,
              border: `1px solid ${T.line}`,
            }}
          >
            Browse Best-Of Lists &rarr;
          </Link>
        </div>
      </section>
    </>
  );
}
