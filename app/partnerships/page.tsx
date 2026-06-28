import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import { breadcrumbSchema, organizationSchema } from "@/lib/schemas";
import { T } from "@/lib/theme";
import { BRAND } from "@/lib/config";
import { PARTNERSHIPS, PARTNERSHIPS_EMAIL } from "@/lib/data/company";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://verzatv.com";

export const metadata: Metadata = {
  title: `Partnerships | ${BRAND.name}`,
  description:
    "Partner with Verza TV across distribution, brand integrations, advertising, and licensing — a vertically integrated American vertical micro-drama studio.",
  alternates: { canonical: "/partnerships" },
  openGraph: {
    title: `Partnerships | ${BRAND.name}`,
    description:
      "Distribution, brand, advertiser, and licensing partnerships with Verza TV, the vertical micro-drama studio.",
    url: `${BASE_URL}/partnerships`,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `Partnerships | ${BRAND.name}`,
    description:
      "Distribution, brand, advertiser, and licensing partnerships with Verza TV.",
  },
};

export default function PartnershipsPage() {
  return (
    <>
      <JsonLd
        data={[
          organizationSchema(),
          breadcrumbSchema([
            { name: "Company", url: `${BASE_URL}/company` },
            { name: "Partnerships", url: `${BASE_URL}/partnerships` },
          ]),
        ]}
      />

      <section className="px-4 pt-6 pb-8">
        <Link
          href="/company"
          className="text-xs no-underline"
          style={{ color: T.textMute }}
        >
          ‹ Company
        </Link>

        <h1 className="text-2xl font-bold mt-2 mb-2" style={{ color: T.text }}>
          Partnerships
        </h1>
        <p className="text-sm mb-8 leading-relaxed" style={{ color: T.textDim }}>
          {BRAND.name} owns its content and its platform — which makes it a rare
          partner that can move from idea to live audience without licensing
          friction. Whether you want to distribute our originals, build inside
          our stories, advertise in a premium environment, or license IP, we
          build partnerships that put your goals inside the experience, not
          around it.
        </p>

        {/* Categories */}
        <div className="flex flex-col gap-4 mb-8">
          {PARTNERSHIPS.map((p) => (
            <div
              key={p.slug}
              className="rounded-xl p-5"
              style={{ background: T.surface, border: `1px solid ${T.line}` }}
            >
              <h2
                className="text-base font-semibold mb-1.5"
                style={{ color: T.text }}
              >
                {p.title}
              </h2>
              <p className="text-sm leading-relaxed mb-3" style={{ color: T.textDim }}>
                {p.summary}
              </p>
              <ul className="flex flex-col gap-1.5 mb-4">
                {p.points.map((point) => (
                  <li
                    key={point}
                    className="flex items-start gap-2 text-sm"
                    style={{ color: T.textDim }}
                  >
                    <span
                      aria-hidden
                      className="mt-1.5 flex-shrink-0 rounded-full"
                      style={{
                        width: 5,
                        height: 5,
                        background: T.accent,
                      }}
                    />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
              <a
                href={`mailto:${PARTNERSHIPS_EMAIL}?subject=${encodeURIComponent(
                  `${p.title} partnership inquiry`,
                )}`}
                className="inline-flex items-center gap-1.5 text-sm font-semibold no-underline rounded-lg px-3 py-2"
                style={{
                  background: `${T.accent}1A`,
                  color: T.accent,
                  border: `1px solid ${T.accent}33`,
                }}
              >
                {p.cta}
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={T.accent}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </a>
            </div>
          ))}
        </div>

        {/* Creators note */}
        <div
          className="rounded-xl p-4 mb-8"
          style={{ background: T.surface, border: `1px solid ${T.line}` }}
        >
          <p className="text-sm leading-relaxed" style={{ color: T.textDim }}>
            Independent filmmaker or vertical-native creator? Publish your own
            series on {BRAND.name} with an 80% revenue share through our{" "}
            <Link
              href="/studio"
              className="no-underline"
              style={{ color: T.accent }}
            >
              Creator Channels program
            </Link>
            .
          </p>
        </div>

        {/* Contact CTA */}
        <div
          className="rounded-xl p-4 text-center"
          style={{ background: T.surface, border: `1px solid ${T.line}` }}
        >
          <p className="text-sm mb-1" style={{ color: T.textDim }}>
            Partnership inquiries
          </p>
          <p className="text-sm font-medium" style={{ color: T.text }}>
            <a
              href={`mailto:${PARTNERSHIPS_EMAIL}`}
              className="no-underline"
              style={{ color: T.text }}
            >
              {PARTNERSHIPS_EMAIL}
            </a>
          </p>
        </div>
      </section>
    </>
  );
}
