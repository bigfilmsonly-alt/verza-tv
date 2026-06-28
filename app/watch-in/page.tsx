import type { Metadata } from "next";
import Link from "next/link";
import { itemListSchema, breadcrumbSchema } from "@/lib/schemas";
import JsonLd from "@/components/JsonLd";
import { T } from "@/lib/theme";
import { BRAND } from "@/lib/config";
import { LOCATIONS } from "@/lib/data/locations";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://verzatv.com";

const PAGE_TITLE = `Watch ${BRAND.name} Around the World`;
const PAGE_DESC =
  "Stream Verza TV vertical micro-dramas and reality from anywhere — browse availability, most-watched picks and viewing guides for 70+ cities, states and countries.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESC,
  alternates: { canonical: "/watch-in" },
  keywords: [
    "watch verza tv",
    "verza tv availability",
    "microdramas near me",
    "vertical dramas by country",
    "stream short dramas",
  ],
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESC,
    url: `${BASE_URL}/watch-in`,
    type: "website",
    siteName: BRAND.name,
  },
  twitter: {
    card: "summary_large_image",
    title: PAGE_TITLE,
    description: PAGE_DESC,
  },
};

const GROUPS: { key: "city" | "state" | "country"; label: string }[] = [
  { key: "city", label: "Cities" },
  { key: "state", label: "States" },
  { key: "country", label: "Countries" },
];

export default function WatchInIndexPage() {
  return (
    <>
      <JsonLd
        data={[
          itemListSchema({
            name: PAGE_TITLE,
            description: PAGE_DESC,
            items: LOCATIONS.map((l, i) => ({
              name: l.name,
              url: `${BASE_URL}/watch-in/${l.slug}`,
              position: i + 1,
            })),
          }),
          breadcrumbSchema([
            { name: "Home", url: BASE_URL },
            { name: "Watch In", url: `${BASE_URL}/watch-in` },
          ]),
        ]}
      />

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
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Discover
        </Link>

        <h1 className="text-3xl font-bold leading-tight mb-3" style={{ color: T.text }}>
          Watch {BRAND.name} Anywhere
        </h1>

        <p className="text-sm leading-relaxed mb-4 max-w-xl" style={{ color: T.textDim }}>
          {BRAND.name} streams the same binge-worthy vertical micro-dramas and
          reality everywhere you go. Pick your city, state or country below for
          localized recommendations, availability and time-zone tips. Every
          series starts free with the first 5 episodes.
        </p>

        <span
          className="text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full"
          style={{ background: T.accent, color: T.text }}
        >
          {LOCATIONS.length} Locations
        </span>
      </section>

      <section className="px-4 pt-4 pb-8">
        {GROUPS.map((group) => {
          const items = LOCATIONS.filter((l) => l.type === group.key);
          if (items.length === 0) return null;
          return (
            <div key={group.key} className="mb-8">
              <h2
                className="text-sm font-semibold uppercase tracking-wider mb-3"
                style={{ color: T.textMute }}
              >
                {group.label}
              </h2>
              <div className="flex flex-wrap gap-2">
                {items.map((l) => (
                  <Link
                    key={l.slug}
                    href={`/watch-in/${l.slug}`}
                    className="text-xs font-medium px-3 py-1.5 rounded-full no-underline transition-colors"
                    style={{
                      background: `${T.accent}15`,
                      color: T.accent,
                      border: `1px solid ${T.accent}30`,
                    }}
                  >
                    {l.name}
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </section>
    </>
  );
}
