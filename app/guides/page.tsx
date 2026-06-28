import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import { breadcrumbSchema, itemListSchema } from "@/lib/schemas";
import { T } from "@/lib/theme";
import { BRAND } from "@/lib/config";
import { GUIDES } from "@/lib/data/guides";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://verzatv.com";

const PAGE_TITLE = `Microdrama Guides | ${BRAND.name}`;
const PAGE_DESC =
  "Plain-English guides to microdramas and vertical drama: what they are, how to watch, how coins work, whether they're free, and the history of the format.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESC,
  alternates: { canonical: "/guides" },
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESC,
    url: `${BASE_URL}/guides`,
    type: "website",
    siteName: BRAND.name,
  },
  twitter: {
    card: "summary_large_image",
    title: PAGE_TITLE,
    description: PAGE_DESC,
  },
};

export default function GuidesIndexPage() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", url: BASE_URL },
            { name: "Guides", url: `${BASE_URL}/guides` },
          ]),
          itemListSchema({
            name: `${BRAND.name} Microdrama Guides`,
            description: PAGE_DESC,
            items: GUIDES.map((g, i) => ({
              name: g.title,
              url: `${BASE_URL}/guides/${g.slug}`,
              position: i + 1,
            })),
          }),
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
          Microdrama Guides
        </h1>
        <p className="text-sm leading-relaxed mb-6 max-w-xl" style={{ color: T.textDim }}>
          New to vertical drama? These guides explain everything in plain
          English — what a microdrama actually is, how to start watching, how
          coins and free episodes work, and where the format came from. Each one
          is a quick, honest read built to answer the questions real viewers
          ask.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {GUIDES.map((g) => (
            <Link
              key={g.slug}
              href={`/guides/${g.slug}`}
              className="group block rounded-xl p-4 no-underline transition-colors"
              style={{ background: T.surface, border: `1px solid ${T.line}` }}
            >
              <h2 className="text-base font-semibold mb-1.5" style={{ color: T.text }}>
                {g.title}
              </h2>
              <p className="text-xs leading-relaxed" style={{ color: T.textMute }}>
                {g.blurb}
              </p>
              <span
                className="inline-block mt-3 text-xs font-medium"
                style={{ color: T.accent }}
              >
                Read guide →
              </span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
