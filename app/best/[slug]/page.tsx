import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getLiveSeries } from "@/lib/catalog";
import { itemListSchema, breadcrumbSchema, faqSchema } from "@/lib/schemas";
import JsonLd from "@/components/JsonLd";
import { T } from "@/lib/theme";
import { BRAND } from "@/lib/config";
import { BEST_LISTS, getBestList } from "@/lib/data/best-lists";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://verzatv.com";

/* ------------------------------------------------------------------ */
/*  Static params                                                      */
/* ------------------------------------------------------------------ */

export function generateStaticParams() {
  return BEST_LISTS.map((b) => ({ slug: b.slug }));
}

/* ------------------------------------------------------------------ */
/*  Metadata                                                           */
/* ------------------------------------------------------------------ */

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const list = getBestList(slug);
  if (!list) return { title: "Not Found" };

  return {
    title: `${list.title} | ${BRAND.name}`,
    description: list.blurb,
    alternates: { canonical: `/best/${slug}` },
    openGraph: {
      title: list.title,
      description: list.blurb,
      url: `${BASE_URL}/best/${slug}`,
      type: "website",
      siteName: BRAND.name,
    },
    twitter: {
      card: "summary_large_image",
      title: list.title,
      description: list.blurb,
    },
  };
}

/* ------------------------------------------------------------------ */
/*  FAQ generator                                                      */
/* ------------------------------------------------------------------ */

function buildFaq(title: string, topSeries: string | undefined, count: number) {
  return [
    {
      question: `${title}`,
      answer: `${BRAND.name} features ${count} live ${
        count === 1 ? "series" : "series"
      } that fit this list${
        topSeries ? `, starting with standout titles like ${topSeries}` : ""
      }. Each is a complete, season-length vertical micro-drama you can start free with the first 5 episodes.`,
    },
    {
      question: `Are these series free to watch on ${BRAND.name}?`,
      answer:
        "Yes — every series here starts free with the first 5 episodes. You can unlock the rest of a season with coins or a VIP subscription whenever you're hooked. There's no cost to start watching.",
    },
    {
      question: `How long does it take to binge a series?`,
      answer:
        "Each episode runs roughly 60 to 120 seconds, so a full series of 50-plus episodes plays in a single relaxed sitting. The vertical 9:16 format is built for phone-first viewing, so you can binge on a commute or before bed.",
    },
    {
      question: `Where can I find similar recommendations?`,
      answer: `Explore more best-of guides at /best, or browse our themed collections at /collections to discover your next binge on ${BRAND.name}.`,
    },
  ];
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default async function BestListPage({ params }: Props) {
  const { slug } = await params;
  const list = getBestList(slug);
  if (!list) notFound();

  const matches = getLiveSeries().filter(list.match);

  // Related rail: ~6 other best lists
  const related = BEST_LISTS.filter((b) => b.slug !== slug).slice(0, 6);

  const faqs = buildFaq(list.title, matches[0]?.title, matches.length);

  return (
    <>
      {/* JSON-LD: ItemList + Breadcrumb + FAQ */}
      <JsonLd
        data={[
          itemListSchema({
            name: list.title,
            description: list.blurb,
            items: matches.map((s, i) => ({
              name: s.title,
              url: `${BASE_URL}/series/${s.slug}`,
              image: s.posterUrl ? `${BASE_URL}${s.posterUrl}` : undefined,
              position: i + 1,
            })),
          }),
          breadcrumbSchema([
            { name: "Home", url: BASE_URL },
            { name: "Best Of", url: `${BASE_URL}/best` },
            { name: list.title, url: `${BASE_URL}/best/${slug}` },
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
          href="/best"
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
          Best Of
        </Link>

        <h1
          className="text-3xl font-bold leading-tight mb-3"
          style={{ color: T.text }}
        >
          {list.title}
        </h1>

        <p
          className="text-sm leading-relaxed mb-4 max-w-xl"
          style={{ color: T.textDim }}
        >
          {list.intro}
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
              No series match this list yet.
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

        {/* Related best lists rail */}
        <div className="mt-10">
          <h2
            className="text-sm font-semibold uppercase tracking-wider mb-3"
            style={{ color: T.textMute }}
          >
            More Best-Of Guides
          </h2>
          <div className="flex flex-wrap gap-2">
            {related.map((b) => (
              <Link
                key={b.slug}
                href={`/best/${b.slug}`}
                className="text-xs font-medium px-3 py-1.5 rounded-full no-underline transition-colors"
                style={{
                  background: `${T.accent}15`,
                  color: T.accent,
                  border: `1px solid ${T.accent}30`,
                }}
              >
                {b.title}
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
            href="/collections"
            className="text-xs font-medium px-3 py-1.5 rounded-full no-underline"
            style={{
              background: T.surface,
              color: T.textDim,
              border: `1px solid ${T.line}`,
            }}
          >
            Browse Collections &rarr;
          </Link>
        </div>
      </section>
    </>
  );
}
