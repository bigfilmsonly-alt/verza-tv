import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import { breadcrumbSchema, faqSchema } from "@/lib/schemas";
import { articleSchema } from "@/lib/seo/schema";
import { T } from "@/lib/theme";
import { BRAND } from "@/lib/config";
import { GUIDES, getGuide } from "@/lib/data/guides";
import { getLiveSeries } from "@/lib/catalog";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://verzatv.com";

export async function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) return { title: "Not Found" };

  return {
    title: `${guide.title} | ${BRAND.name}`,
    description: guide.blurb,
    alternates: { canonical: `/guides/${slug}` },
    openGraph: {
      title: guide.title,
      description: guide.blurb,
      url: `${BASE_URL}/guides/${slug}`,
      type: "article",
      siteName: BRAND.name,
    },
    twitter: {
      card: "summary_large_image",
      title: guide.title,
      description: guide.blurb,
    },
  };
}

export default async function GuidePage({ params }: Props) {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) notFound();

  // Full article body for Article schema
  const articleBody = [
    guide.intro,
    ...guide.sections.map((s) => `${s.heading}. ${s.body}`),
  ].join("\n\n");

  const related = GUIDES.filter((g) => g.slug !== slug).slice(0, 4);
  const featuredSeries = getLiveSeries().slice(0, 6);

  return (
    <>
      <JsonLd
        data={[
          articleSchema({
            slug: guide.slug,
            title: guide.title,
            body: articleBody,
            publishedAt: "2025-01-01",
          }),
          breadcrumbSchema([
            { name: "Home", url: BASE_URL },
            { name: "Guides", url: `${BASE_URL}/guides` },
            { name: guide.title, url: `${BASE_URL}/guides/${slug}` },
          ]),
          faqSchema(guide.faq),
        ]}
      />

      <article className="px-4 pt-6 pb-8">
        <Link
          href="/guides"
          className="inline-flex items-center gap-1 text-xs mb-4 no-underline"
          style={{ color: T.textMute }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Guides
        </Link>

        <h1 className="text-2xl font-bold mb-2" style={{ color: T.text }}>
          {guide.title}
        </h1>
        <p className="text-xs mb-5" style={{ color: T.accent }}>
          {BRAND.name} Editorial
        </p>

        <p className="text-sm leading-relaxed mb-7" style={{ color: T.textDim }}>
          {guide.intro}
        </p>

        <div className="flex flex-col gap-6">
          {guide.sections.map((s, i) => (
            <section key={i}>
              <h2 className="text-lg font-semibold mb-2" style={{ color: T.text }}>
                {s.heading}
              </h2>
              <p className="text-sm leading-relaxed" style={{ color: T.textDim }}>
                {s.body}
              </p>
            </section>
          ))}
        </div>

        {/* FAQ */}
        <section className="mt-9 pt-6" style={{ borderTop: `1px solid ${T.line}` }}>
          <h2 className="text-lg font-semibold mb-4" style={{ color: T.text }}>
            Frequently Asked Questions
          </h2>
          <div className="flex flex-col gap-4">
            {guide.faq.map((f, i) => (
              <div key={i}>
                <h3 className="text-sm font-semibold mb-1" style={{ color: T.text }}>
                  {f.question}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: T.textMute }}>
                  {f.answer}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Featured series rail */}
        <section className="mt-9 pt-6" style={{ borderTop: `1px solid ${T.line}` }}>
          <h2
            className="text-sm font-semibold uppercase tracking-wider mb-3"
            style={{ color: T.accent }}
          >
            Start Watching Free
          </h2>
          <div className="flex flex-wrap gap-2">
            {featuredSeries.map((s) => (
              <Link
                key={s.slug}
                href={`/series/${s.slug}`}
                className="text-xs font-medium px-3 py-1.5 rounded-full no-underline"
                style={{
                  background: `${T.accent}15`,
                  color: T.accent,
                  border: `1px solid ${T.accent}30`,
                }}
              >
                {s.title}
              </Link>
            ))}
          </div>
        </section>

        {/* Related guides */}
        <section className="mt-8 pt-6" style={{ borderTop: `1px solid ${T.line}` }}>
          <h2
            className="text-sm font-semibold uppercase tracking-wider mb-3"
            style={{ color: T.textMute }}
          >
            Related Guides
          </h2>
          <div className="flex flex-col gap-2">
            {related.map((g) => (
              <Link
                key={g.slug}
                href={`/guides/${g.slug}`}
                className="text-sm no-underline py-1"
                style={{ color: T.text }}
              >
                {g.title} →
              </Link>
            ))}
            <Link
              href="/compare/best-short-drama-apps"
              className="text-sm no-underline py-1"
              style={{ color: T.text }}
            >
              Best Short Drama Apps: How to Choose →
            </Link>
          </div>
        </section>
      </article>
    </>
  );
}
