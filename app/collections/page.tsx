import type { Metadata } from "next";
import Link from "next/link";
import { getLiveSeries } from "@/lib/catalog";
import { itemListSchema, breadcrumbSchema } from "@/lib/schemas";
import JsonLd from "@/components/JsonLd";
import { T } from "@/lib/theme";
import { BRAND } from "@/lib/config";
import { COLLECTIONS } from "@/lib/data/collections";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://verzatv.com";

const PAGE_TITLE = `Curated Collections on ${BRAND.name}`;
const PAGE_DESC =
  "Explore handpicked Verza TV collections — billionaire romances, revenge dramas, cliffhangers, enemies-to-lovers and more, each curated from our vertical micro-drama originals.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESC,
  alternates: { canonical: "/collections" },
  keywords: [
    "verza tv collections",
    "best microdrama collections",
    "curated vertical dramas",
    "billionaire romance collection",
    "revenge drama collection",
  ],
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESC,
    url: `${BASE_URL}/collections`,
    type: "website",
    siteName: BRAND.name,
  },
  twitter: {
    card: "summary_large_image",
    title: PAGE_TITLE,
    description: PAGE_DESC,
  },
};

export default function CollectionsIndexPage() {
  const live = getLiveSeries();

  return (
    <>
      <JsonLd
        data={[
          itemListSchema({
            name: PAGE_TITLE,
            description: PAGE_DESC,
            items: COLLECTIONS.map((c, i) => ({
              name: c.title,
              url: `${BASE_URL}/collections/${c.slug}`,
              position: i + 1,
            })),
          }),
          breadcrumbSchema([
            { name: "Home", url: BASE_URL },
            { name: "Collections", url: `${BASE_URL}/collections` },
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
          Curated Collections
        </h1>

        <p
          className="text-sm leading-relaxed mb-4 max-w-xl"
          style={{ color: T.textDim }}
        >
          Hand-picked groupings of the best vertical micro-dramas on {BRAND.name}.
          Each collection gathers a different flavor of binge — billionaire
          romance, revenge, cliffhangers and more — pulled straight from our
          live catalog. Every series starts free with the first 5 episodes.
        </p>

        <span
          className="text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full"
          style={{ background: T.accent, color: T.text }}
        >
          {COLLECTIONS.length} Collections
        </span>
      </section>

      {/* Collection cards */}
      <section className="px-4 pt-4 pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {COLLECTIONS.map((c) => {
            const count = live.filter(c.match).length;
            return (
              <Link
                key={c.slug}
                href={`/collections/${c.slug}`}
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
                <p
                  className="text-xs leading-relaxed mb-3"
                  style={{ color: T.textDim }}
                >
                  {c.blurb}
                </p>
                <span
                  className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full"
                  style={{
                    background: `${T.accent}15`,
                    color: T.accent,
                    border: `1px solid ${T.accent}30`,
                  }}
                >
                  {count} {count === 1 ? "Series" : "Series"}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Cross-link to best-of */}
        <div className="mt-10">
          <h2
            className="text-sm font-semibold uppercase tracking-wider mb-3"
            style={{ color: T.textMute }}
          >
            Looking for Recommendations?
          </h2>
          <Link
            href="/best"
            className="text-xs font-medium px-3 py-1.5 rounded-full no-underline"
            style={{
              background: `${T.accent}15`,
              color: T.accent,
              border: `1px solid ${T.accent}30`,
            }}
          >
            Browse Best-Of Lists
          </Link>
        </div>
      </section>
    </>
  );
}
