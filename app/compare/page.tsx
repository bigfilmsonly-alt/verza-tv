import type { Metadata } from "next";
import Link from "next/link";
import { itemListSchema, breadcrumbSchema } from "@/lib/schemas";
import JsonLd from "@/components/JsonLd";
import { T } from "@/lib/theme";
import { BRAND } from "@/lib/config";
import { COMPARISONS } from "@/lib/data/compare";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://verzatv.com";

const PAGE_TITLE = `${BRAND.name} Comparisons & Microdrama Explainers`;
const PAGE_DESC =
  "Fair, factual comparisons of Verza TV vs other microdrama apps and traditional streaming, plus clear explainers on free episodes, coins and how the format works.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESC,
  alternates: { canonical: "/compare" },
  keywords: [
    "verza tv vs reelshort",
    "verza tv vs dramabox",
    "best short drama apps",
    "are microdramas free",
    "how do microdrama coins work",
  ],
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESC,
    url: `${BASE_URL}/compare`,
    type: "website",
    siteName: BRAND.name,
  },
  twitter: {
    card: "summary_large_image",
    title: PAGE_TITLE,
    description: PAGE_DESC,
  },
};

export default function CompareIndexPage() {
  return (
    <>
      <JsonLd
        data={[
          itemListSchema({
            name: PAGE_TITLE,
            description: PAGE_DESC,
            items: COMPARISONS.map((c, i) => ({
              name: c.title,
              url: `${BASE_URL}/compare/${c.slug}`,
              position: i + 1,
            })),
          }),
          breadcrumbSchema([
            { name: "Home", url: BASE_URL },
            { name: "Compare", url: `${BASE_URL}/compare` },
          ]),
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
          href="/guides"
          className="inline-flex items-center gap-1 text-sm mb-4 no-underline"
          style={{ color: T.textMute }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Guides
        </Link>

        <h1 className="text-3xl font-bold leading-tight mb-3" style={{ color: T.text }}>
          Compare & Explore
        </h1>

        <p className="text-sm leading-relaxed mb-4 max-w-xl" style={{ color: T.textDim }}>
          Honest, factual comparisons to help you choose the right way to watch.
          See how {BRAND.name} lines up against other microdrama apps and
          traditional streaming, and get straight answers on free episodes,
          coins and how the vertical format works.
        </p>

        <span
          className="text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full"
          style={{ background: T.accent, color: T.text }}
        >
          {COMPARISONS.length} Comparisons
        </span>
      </section>

      {/* Comparison cards */}
      <section className="px-4 pt-4 pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {COMPARISONS.map((c) => (
            <Link
              key={c.slug}
              href={`/compare/${c.slug}`}
              className="group block rounded-xl p-4 no-underline transition-colors"
              style={{
                background: T.surface,
                border: `1px solid ${T.line}`,
              }}
            >
              <h2
                className="text-base font-semibold leading-snug mb-1.5"
                style={{ color: T.text }}
              >
                {c.title}
              </h2>
              <p className="text-xs leading-relaxed" style={{ color: T.textDim }}>
                {c.blurb}
              </p>
            </Link>
          ))}
        </div>

        {/* Cross-link to guides */}
        <div className="mt-10">
          <h2
            className="text-sm font-semibold uppercase tracking-wider mb-3"
            style={{ color: T.textMute }}
          >
            Want the Full Picture?
          </h2>
          <Link
            href="/guides"
            className="text-xs font-medium px-3 py-1.5 rounded-full no-underline"
            style={{
              background: `${T.accent}15`,
              color: T.accent,
              border: `1px solid ${T.accent}30`,
            }}
          >
            Browse Viewing Guides
          </Link>
        </div>
      </section>
    </>
  );
}
