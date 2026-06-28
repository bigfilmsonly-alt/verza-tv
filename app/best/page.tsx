import type { Metadata } from "next";
import Link from "next/link";
import { getLiveSeries } from "@/lib/catalog";
import { itemListSchema, breadcrumbSchema } from "@/lib/schemas";
import JsonLd from "@/components/JsonLd";
import { T } from "@/lib/theme";
import { BRAND } from "@/lib/config";
import { BEST_LISTS } from "@/lib/data/best-lists";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://verzatv.com";

const PAGE_TITLE = `Best-Of Lists: What to Watch on ${BRAND.name}`;
const PAGE_DESC =
  "Find your next binge with Verza TV best-of lists — the best billionaire romances, revenge dramas, cliffhangers, mafia romances and more, ranked and ready to watch.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESC,
  alternates: { canonical: "/best" },
  keywords: [
    "best microdramas",
    "best vertical dramas",
    "best billionaire romance",
    "what to watch verza tv",
    "best short dramas",
  ],
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESC,
    url: `${BASE_URL}/best`,
    type: "website",
    siteName: BRAND.name,
  },
  twitter: {
    card: "summary_large_image",
    title: PAGE_TITLE,
    description: PAGE_DESC,
  },
};

export default function BestIndexPage() {
  const live = getLiveSeries();

  return (
    <>
      <JsonLd
        data={[
          itemListSchema({
            name: PAGE_TITLE,
            description: PAGE_DESC,
            items: BEST_LISTS.map((b, i) => ({
              name: b.title,
              url: `${BASE_URL}/best/${b.slug}`,
              position: i + 1,
            })),
          }),
          breadcrumbSchema([
            { name: "Home", url: BASE_URL },
            { name: "Best Of", url: `${BASE_URL}/best` },
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
          Best-Of Lists
        </h1>

        <p
          className="text-sm leading-relaxed mb-4 max-w-xl"
          style={{ color: T.textDim }}
        >
          Not sure what to watch next? These best-of guides answer the questions
          viewers ask most — the best billionaire romances, revenge dramas,
          cliffhangers and more on {BRAND.name}. Every list is curated from our
          live catalog of vertical micro-dramas, and every series starts free.
        </p>

        <span
          className="text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full"
          style={{ background: T.accent, color: T.text }}
        >
          {BEST_LISTS.length} Lists
        </span>
      </section>

      {/* List cards */}
      <section className="px-4 pt-4 pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {BEST_LISTS.map((b) => {
            const count = live.filter(b.match).length;
            return (
              <Link
                key={b.slug}
                href={`/best/${b.slug}`}
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
                  {b.title}
                </h2>
                <p
                  className="text-xs leading-relaxed mb-3"
                  style={{ color: T.textDim }}
                >
                  {b.blurb}
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

        {/* Cross-link to collections */}
        <div className="mt-10">
          <h2
            className="text-sm font-semibold uppercase tracking-wider mb-3"
            style={{ color: T.textMute }}
          >
            Prefer Curated Themes?
          </h2>
          <Link
            href="/collections"
            className="text-xs font-medium px-3 py-1.5 rounded-full no-underline"
            style={{
              background: `${T.accent}15`,
              color: T.accent,
              border: `1px solid ${T.accent}30`,
            }}
          >
            Browse Collections
          </Link>
        </div>
      </section>
    </>
  );
}
