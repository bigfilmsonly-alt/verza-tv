import type { Metadata } from "next";
import Link from "next/link";
import { breadcrumbSchema } from "@/lib/schemas";
import JsonLd from "@/components/JsonLd";
import { T } from "@/lib/theme";
import { BRAND } from "@/lib/config";
import { SITEMAP_SECTIONS, SITEMAP_FULL, SHOW_GENRE_GROUPS, TOTAL_LIVE_SHOWS } from "@/lib/data/sitemap";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://verzatv.com";

const PAGE_TITLE = `Sitemap — Every Page on ${BRAND.name}`;
const PAGE_DESC =
  "The complete Verza TV sitemap. Browse every section — shows, genres, collections, best-of lists, guides, locations, company and founder pages — in one place.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESC,
  alternates: { canonical: "/sitemap" },
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESC,
    url: `${BASE_URL}/sitemap`,
    type: "website",
    siteName: BRAND.name,
  },
};

export default function HtmlSitemapPage() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", url: BASE_URL },
            { name: "Sitemap", url: `${BASE_URL}/sitemap` },
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
        <h1 className="text-3xl font-bold leading-tight mb-3" style={{ color: T.text }}>
          Sitemap
        </h1>
        <p className="text-sm leading-relaxed max-w-xl" style={{ color: T.textDim }}>
          Every page on {BRAND.name}, organized by section. Use the curated
          links below to jump to a hub, or browse the full A-to-Z lists further
          down.
        </p>
      </section>

      {/* Curated sections */}
      <section className="px-4 pt-6 pb-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-7">
          {SITEMAP_SECTIONS.map((section) => (
            <div key={section.title}>
              <h2
                className="text-sm font-semibold uppercase tracking-wider mb-3"
                style={{ color: T.textMute }}
              >
                {section.hub ? (
                  <Link href={section.hub.href} className="no-underline" style={{ color: T.textMute }}>
                    {section.title}
                  </Link>
                ) : (
                  section.title
                )}
              </h2>
              <ul className="m-0 p-0" style={{ listStyle: "none" }}>
                {section.links.map((link) => (
                  <li key={`${section.title}-${link.href}-${link.label}`} className="mb-2">
                    {link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="no-underline transition-opacity hover:opacity-80"
                        style={{ color: T.textDim, fontSize: 13 }}
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="no-underline transition-opacity hover:opacity-80"
                        style={{ color: T.textDim, fontSize: 13 }}
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* All shows, grouped by genre */}
      <section className="px-4 pt-8 pb-2">
        <h2 className="text-lg font-bold mb-1" style={{ color: T.text }}>
          All Shows by Genre
        </h2>
        <p className="text-xs mb-5" style={{ color: T.textMute }}>
          Every one of our {TOTAL_LIVE_SHOWS} live originals, grouped by genre.
        </p>
        <div className="flex flex-col gap-7">
          {SHOW_GENRE_GROUPS.map((group) => (
            <div key={group.title}>
              <h3
                className="text-xs font-semibold uppercase tracking-wider mb-3"
                style={{ color: T.textMute }}
              >
                {group.title}{" "}
                <span style={{ color: T.textDim }}>({group.count})</span>
              </h3>
              <div className="flex flex-wrap gap-2">
                {group.links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-xs font-medium px-3 py-1.5 rounded-full no-underline"
                    style={{
                      background: `${T.accent}15`,
                      color: T.accent,
                      border: `1px solid ${T.accent}30`,
                    }}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Full A-to-Z enumerations */}
      <section className="px-4 pt-8 pb-10">
        <h2 className="text-lg font-bold mb-5" style={{ color: T.text }}>
          Full Index
        </h2>
        <div className="flex flex-col gap-7">
          {SITEMAP_FULL.map((section) => (
            <div key={section.title}>
              <h3
                className="text-xs font-semibold uppercase tracking-wider mb-3"
                style={{ color: T.textMute }}
              >
                {section.title}
              </h3>
              <div className="flex flex-wrap gap-2">
                {section.links.map((link) => (
                  <Link
                    key={`${section.title}-${link.href}-${link.label}`}
                    href={link.href}
                    className="text-xs font-medium px-3 py-1.5 rounded-full no-underline"
                    style={{
                      background: `${T.accent}15`,
                      color: T.accent,
                      border: `1px solid ${T.accent}30`,
                    }}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
