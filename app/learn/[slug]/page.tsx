import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import { breadcrumbSchema } from "@/lib/schemas";
import { articleSchema } from "@/lib/seo/schema";
import { T } from "@/lib/theme";
import { BRAND } from "@/lib/config";
import { LEARN_PAGES, getLearnPage } from "@/lib/content/learn";

export async function generateStaticParams() {
  return LEARN_PAGES.filter((p) => p.editorialApproved).map((p) => ({
    slug: p.slug,
  }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = getLearnPage(slug);
  if (!page) return { title: "Not Found" };

  return {
    title: `${page.title} | ${BRAND.name}`,
    description: page.description,
    alternates: { canonical: `/learn/${slug}` },
    robots: { index: page.editorialApproved, follow: true },
  };
}

export default async function LearnPage({ params }: Props) {
  const { slug } = await params;
  const page = getLearnPage(slug);
  if (!page || !page.editorialApproved) notFound();

  const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://verzatv.com";
  const paragraphs = page.body.split("\n\n").filter(Boolean);

  return (
    <>
      <JsonLd
        data={[
          articleSchema({
            slug: page.slug,
            title: page.title,
            body: page.body,
            publishedAt: "2025-01-01",
          }),
          breadcrumbSchema([
            { name: "Home", url: BASE_URL },
            { name: "Learn", url: `${BASE_URL}/learn` },
            { name: page.title, url: `${BASE_URL}/learn/${slug}` },
          ]),
        ]}
      />

      <section className="px-4 pt-6 pb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-xs mb-4 no-underline"
          style={{ color: T.textMute }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Home
        </Link>

        <h1 className="text-2xl font-bold mb-2" style={{ color: T.text }}>
          {page.title}
        </h1>
        <p className="text-sm mb-6" style={{ color: T.accent }}>
          {BRAND.name} Editorial
        </p>

        <div className="flex flex-col gap-4">
          {paragraphs.map((p, i) => (
            <p
              key={i}
              className="text-sm leading-relaxed"
              style={{ color: T.textDim }}
            >
              {p}
            </p>
          ))}
        </div>

        {/* Related pages */}
        <div className="mt-8 pt-6" style={{ borderTop: `1px solid ${T.line}` }}>
          <h2
            className="text-sm font-semibold uppercase tracking-wider mb-3"
            style={{ color: T.accent }}
          >
            More to Learn
          </h2>
          <div className="flex flex-col gap-2">
            {LEARN_PAGES.filter(
              (p) => p.slug !== slug && p.editorialApproved,
            ).map((p) => (
              <Link
                key={p.slug}
                href={`/learn/${p.slug}`}
                className="text-sm no-underline py-1"
                style={{ color: T.text }}
              >
                {p.title} →
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
