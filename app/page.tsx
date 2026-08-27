import type { Metadata } from "next";
import { catalog, getLiveSeries, getBrowseSeriesByCategory, BROWSE_TABS } from "@/lib/catalog";
import { organizationSchema, webSiteSchema, mobileAppSchema } from "@/lib/schemas";
import JsonLd from "@/components/JsonLd";
import BrowsePage from "@/components/BrowsePage";

export const metadata: Metadata = {
  title: "VERZA TV — Microdramas, Reality & More",
  description:
    `Stream short-form micro-dramas, reality shows, and other entertainment. The current VERZA TV catalog contains ${getLiveSeries().length} live series; formats and access vary by title.`,
  alternates: { canonical: "/" },
};

export default function HomePage() {
  const live = getLiveSeries();

  // Pre-render all tab data for SSR — real content in the HTML.
  // Browse variant: includes the coming-soon slate so Bollywood and Espanol
  // show every title we hold art for, not only the ones that play.
  const tabData = Object.fromEntries(
    BROWSE_TABS.map((tab) => [tab.key, getBrowseSeriesByCategory(tab.key)])
  );

  // Show ALL tabs including empty ones
  const activeTabs = BROWSE_TABS;

  return (
    <>
      <JsonLd data={[organizationSchema(), webSiteSchema(), mobileAppSchema()]} />

      {/* SSR: render all series titles as real text for crawlers */}
      <noscript>
        <section className="px-4 py-6">
          <h1 className="text-2xl font-bold mb-4" style={{ color: "#F5F4F8" }}>
            VERZA TV — {live.length} Live Series
          </h1>
          {activeTabs.map((tab) => (
            <div key={tab.key} className="mb-6">
              <h2 className="text-lg font-bold mb-2" style={{ color: "#F5F4F8" }}>
                {tab.label}
              </h2>
              <ul>
                {(tabData[tab.key] ?? []).map((s) => (
                  <li key={s.slug}>
                    {/* Coming-soon rows build no page, so they get plain text.
                        Linking them would hand crawlers a guaranteed 404. */}
                    {s.status === "live" ? (
                      <a href={`/series/${s.slug}`} style={{ color: "#A0A0B0" }}>
                        {s.title} — {s.genre} ({s.episodeCount} episodes)
                      </a>
                    ) : (
                      <span style={{ color: "#A0A0B0" }}>
                        {s.title} — {s.genre} (coming soon)
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      </noscript>

      {/* Interactive browse (client component) */}
      <BrowsePage allSeries={catalog} liveSeries={live} tabData={tabData} />
    </>
  );
}
