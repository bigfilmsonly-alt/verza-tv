import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import { itemListSchema, breadcrumbSchema } from "@/lib/schemas";
import { T } from "@/lib/theme";
import { BRAND } from "@/lib/config";
import { getLiveSeries } from "@/lib/catalog";
import { GENRE_HUBS } from "@/lib/content/genres";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://verzatv.com";

const approvedHubs = GENRE_HUBS.filter((g) => g.editorialApproved);

export const metadata: Metadata = {
  title: `Browse by Genre | ${BRAND.name}`,
  description:
    "Explore every Verza TV genre — billionaire romance, mafia romance, psychological thrillers, revenge dramas, time travel and more. Cinematic vertical micro-dramas, free to start.",
  alternates: { canonical: "/genres" },
  robots: { index: true, follow: true },
};

/** Count live series surfaced by a hub (tag + broad match), for display. */
function countForHub(hub: (typeof GENRE_HUBS)[number]): number {
  const live = getLiveSeries();
  const terms = [...hub.tags, ...(hub.matchTerms ?? [])].map((t) =>
    t.toLowerCase(),
  );
  return live.filter((s) => {
    const hay = `${s.title} ${s.logline} ${s.genre} ${(s.tags || []).join(" ")}`.toLowerCase();
    return terms.some((term) => hay.includes(term));
  }).length;
}

export default function GenresIndexPage() {
  const cards = approvedHubs.map((hub) => ({
    hub,
    count: countForHub(hub),
  }));

  return (
    <>
      <JsonLd
        data={[
          itemListSchema({
            name: "Verza TV Genres",
            description:
              "All editorially approved genre hubs on Verza TV — curated vertical micro-drama collections.",
            items: approvedHubs.map((hub, i) => ({
              name: hub.name,
              url: `${BASE_URL}/genres/${hub.slug}`,
              position: i + 1,
            })),
          }),
          breadcrumbSchema([
            { name: "Home", url: BASE_URL },
            { name: "Genres", url: `${BASE_URL}/genres` },
          ]),
        ]}
      />

      <section className="px-4 pt-6 pb-10">
        {/* Breadcrumb */}
        <nav
          className="flex items-center gap-1.5 text-xs mb-4"
          style={{ color: T.textMute }}
          aria-label="Breadcrumb"
        >
          <Link href="/" className="no-underline" style={{ color: T.textMute }}>
            Home
          </Link>
          <span>/</span>
          <span style={{ color: T.textDim }}>Genres</span>
        </nav>

        <h1 className="text-2xl font-bold mb-2" style={{ color: T.text }}>
          Browse by Genre
        </h1>
        <p
          className="text-sm leading-relaxed mb-6 max-w-xl"
          style={{ color: T.textDim }}
        >
          Find your next obsession. Verza TV organizes its original
          micro-dramas into {approvedHubs.length} hand-curated genres — from
          billionaire and mafia romance to psychological thrillers, revenge
          arcs, and time-travel fantasy. Every series opens with free episodes.
        </p>

        <p
          className="text-xs uppercase tracking-wider font-semibold mb-3"
          style={{ color: T.textMute }}
        >
          {approvedHubs.length} genres
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {cards.map(({ hub, count }) => (
            <Link
              key={hub.slug}
              href={`/genres/${hub.slug}`}
              className="block no-underline rounded-xl p-4 transition-colors"
              style={{
                background: T.surface,
                border: `1px solid ${T.line}`,
              }}
            >
              <div className="flex items-center justify-between gap-3 mb-1.5">
                <h2
                  className="text-base font-semibold"
                  style={{ color: T.text }}
                >
                  {hub.name}
                </h2>
                {count > 0 && (
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full whitespace-nowrap"
                    style={{ background: `${T.accent}1A`, color: T.accent }}
                  >
                    {count} series
                  </span>
                )}
              </div>
              <p
                className="text-xs leading-relaxed line-clamp-3"
                style={{ color: T.textDim }}
              >
                {hub.description}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
