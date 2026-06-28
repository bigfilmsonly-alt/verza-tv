import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import { breadcrumbSchema } from "@/lib/schemas";
import { T } from "@/lib/theme";
import { BRAND } from "@/lib/config";
import { ALAN_SAMEAS, ALAN_SUBPAGES, getAlanSubpage } from "@/lib/data/alan";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://verzatv.com";

export async function generateStaticParams() {
  return ALAN_SUBPAGES.map((p) => ({ slug: p.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = getAlanSubpage(slug);
  if (!page) return { title: "Not Found" };

  return {
    title: `${page.title} | ${BRAND.name}`,
    description: page.blurb,
    keywords: ["Alan Mruvka", "E! co-founder", "Verza TV founder"],
    alternates: { canonical: `/alan-mruvka/${slug}` },
    openGraph: {
      title: page.title,
      description: page.blurb,
      url: `${BASE_URL}/alan-mruvka/${slug}`,
      type: "article",
      siteName: BRAND.name,
    },
    twitter: {
      card: "summary_large_image",
      title: page.title,
      description: page.blurb,
    },
  };
}

export default async function AlanSubpage({ params }: Props) {
  const { slug } = await params;
  const page = getAlanSubpage(slug);
  if (!page) notFound();

  const related = ALAN_SUBPAGES.filter((p) => p.slug !== slug);

  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "Alan Mruvka",
    url: `${BASE_URL}/alan-mruvka`,
    jobTitle: "Founder & CEO",
    description:
      "Co-founder of E! Entertainment Television and founder of Verza TV, the US-based vertical micro-drama streaming platform.",
    worksFor: {
      "@type": "Organization",
      name: "Verza TV",
      url: BASE_URL,
    },
    alumniOf: {
      "@type": "Organization",
      name: "E! Entertainment Television",
    },
    sameAs: ALAN_SAMEAS,
  };

  return (
    <>
      <JsonLd
        data={[
          personSchema,
          breadcrumbSchema([
            { name: "Home", url: BASE_URL },
            { name: "Alan Mruvka", url: `${BASE_URL}/alan-mruvka` },
            { name: page.title, url: `${BASE_URL}/alan-mruvka/${slug}` },
          ]),
        ]}
      />

      <article className="px-4 pt-6 pb-8">
        <nav className="text-xs mb-4" style={{ color: T.textMute }} aria-label="Breadcrumb">
          <Link href="/" className="no-underline" style={{ color: T.textMute }}>
            Home
          </Link>
          <span> / </span>
          <Link href="/alan-mruvka" className="no-underline" style={{ color: T.textMute }}>
            Alan Mruvka
          </Link>
          <span> / </span>
          <span style={{ color: T.textDim }}>{page.title}</span>
        </nav>

        <h1 className="text-2xl font-bold mb-2" style={{ color: T.text }}>
          {page.title}
        </h1>
        <p className="text-xs mb-5" style={{ color: T.accent }}>
          Co-Founder of E! · Founder of {BRAND.name}
        </p>

        <p className="text-sm leading-relaxed mb-7" style={{ color: T.textDim }}>
          {page.intro}
        </p>

        <div className="flex flex-col gap-6">
          {page.sections.map((s, i) => (
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

        {/* Related subpages rail */}
        <section className="mt-9 pt-6" style={{ borderTop: `1px solid ${T.line}` }}>
          <h2
            className="text-sm font-semibold uppercase tracking-wider mb-3"
            style={{ color: T.accent }}
          >
            More on Alan Mruvka
          </h2>
          <div className="flex flex-col gap-2">
            {related.map((p) => (
              <Link
                key={p.slug}
                href={`/alan-mruvka/${p.slug}`}
                className="text-sm no-underline py-1"
                style={{ color: T.text }}
              >
                {p.title} →
              </Link>
            ))}
            <Link
              href="/alan-mruvka"
              className="text-sm no-underline py-1"
              style={{ color: T.text }}
            >
              Alan Mruvka hub →
            </Link>
          </div>
        </section>

        {/* Platform links */}
        <section className="mt-8 pt-6" style={{ borderTop: `1px solid ${T.line}` }}>
          <h2
            className="text-sm font-semibold uppercase tracking-wider mb-3"
            style={{ color: T.textMute }}
          >
            From {BRAND.name}
          </h2>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/founder"
              className="text-xs font-medium px-3 py-1.5 rounded-full no-underline"
              style={{ background: `${T.accent}15`, color: T.accent, border: `1px solid ${T.accent}30` }}
            >
              Founder
            </Link>
            <Link
              href="/about"
              className="text-xs font-medium px-3 py-1.5 rounded-full no-underline"
              style={{ background: `${T.accent}15`, color: T.accent, border: `1px solid ${T.accent}30` }}
            >
              About
            </Link>
            <Link
              href="/company"
              className="text-xs font-medium px-3 py-1.5 rounded-full no-underline"
              style={{ background: `${T.accent}15`, color: T.accent, border: `1px solid ${T.accent}30` }}
            >
              Company
            </Link>
            <Link
              href="/press"
              className="text-xs font-medium px-3 py-1.5 rounded-full no-underline"
              style={{ background: `${T.accent}15`, color: T.accent, border: `1px solid ${T.accent}30` }}
            >
              Press
            </Link>
          </div>
        </section>
      </article>
    </>
  );
}
