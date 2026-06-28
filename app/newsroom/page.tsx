import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import { breadcrumbSchema, organizationSchema } from "@/lib/schemas";
import { T } from "@/lib/theme";
import { BRAND } from "@/lib/config";
import { PRESS_RELEASES, IN_THE_NEWS } from "@/lib/data/company";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://verzatv.com";

export const metadata: Metadata = {
  title: `Newsroom | ${BRAND.name}`,
  description:
    "The Verza TV newsroom: press releases, company announcements, media-kit resources, and coverage of the first US-based vertical micro-drama studio.",
  alternates: { canonical: "/newsroom" },
  openGraph: {
    title: `Newsroom | ${BRAND.name}`,
    description:
      "Press releases, announcements, and media resources from Verza TV, the vertical micro-drama studio founded by Alan Mruvka.",
    url: `${BASE_URL}/newsroom`,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `Newsroom | ${BRAND.name}`,
    description:
      "Press releases and media resources from Verza TV, the vertical micro-drama studio.",
  },
};

export default function NewsroomPage() {
  return (
    <>
      <JsonLd
        data={[
          organizationSchema(),
          breadcrumbSchema([
            { name: "Company", url: `${BASE_URL}/company` },
            { name: "Newsroom", url: `${BASE_URL}/newsroom` },
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
          Newsroom
        </h1>
        <p className="text-sm mb-8 leading-relaxed" style={{ color: T.textDim }}>
          Official announcements, press releases, and media resources from{" "}
          {BRAND.name} — the first US-based vertical micro-drama studio, founded
          by Alan Mruvka, co-founder of E! Entertainment Television. For
          interviews, assets, and fact-checking, our communications team is here
          to help.
        </p>

        {/* Press releases */}
        <h2
          className="text-sm font-semibold uppercase tracking-wider mb-3"
          style={{ color: T.accent }}
        >
          Press Releases
        </h2>
        <div className="flex flex-col gap-3 mb-8">
          {PRESS_RELEASES.map((pr) => (
            <article
              key={pr.slug}
              className="rounded-xl p-4"
              style={{ background: T.surface, border: `1px solid ${T.line}` }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="text-[11px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full"
                  style={{ background: `${T.accent}1A`, color: T.accent }}
                >
                  {pr.category}
                </span>
                <time
                  className="text-xs"
                  dateTime={pr.date}
                  style={{ color: T.textMute }}
                >
                  {pr.dateLabel}
                </time>
              </div>
              <h3
                className="text-base font-semibold leading-snug mb-1.5"
                style={{ color: T.text }}
              >
                {pr.title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: T.textDim }}>
                {pr.summary}
              </p>
            </article>
          ))}
        </div>

        {/* In the news */}
        <h2
          className="text-sm font-semibold uppercase tracking-wider mb-3"
          style={{ color: T.accent }}
        >
          In the News
        </h2>
        <div
          className="rounded-xl overflow-hidden mb-8"
          style={{ background: T.surface, border: `1px solid ${T.line}` }}
        >
          {IN_THE_NEWS.map((item, i) => (
            <div
              key={item.headline}
              className="px-4 py-3"
              style={{
                borderBottom:
                  i < IN_THE_NEWS.length - 1 ? `1px solid ${T.line}` : "none",
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className="text-xs font-medium"
                  style={{ color: T.accent }}
                >
                  {item.outlet}
                </span>
                <span className="text-xs" style={{ color: T.textMute }}>
                  {item.dateLabel}
                </span>
              </div>
              <p className="text-sm leading-snug" style={{ color: T.text }}>
                {item.headline}
              </p>
            </div>
          ))}
        </div>

        {/* Media resources */}
        <h2
          className="text-sm font-semibold uppercase tracking-wider mb-3"
          style={{ color: T.accent }}
        >
          Media Resources
        </h2>
        <div className="flex flex-col gap-1.5 mb-8">
          {[
            { label: "Press kit & brand facts", href: "/press" },
            { label: "Media kit & downloadable assets", href: "/media-kit" },
            { label: "Brand & press assets", href: "/brand-assets" },
            { label: "Leadership team", href: "/leadership" },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center justify-between rounded-lg px-3 py-2.5 no-underline"
              style={{ background: T.surface, border: `1px solid ${T.line}` }}
            >
              <span className="text-sm" style={{ color: T.text }}>
                {link.label}
              </span>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke={T.textMute}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </Link>
          ))}
        </div>

        {/* Contact */}
        <div
          className="rounded-xl p-4 text-center"
          style={{ background: T.surface, border: `1px solid ${T.line}` }}
        >
          <p className="text-sm" style={{ color: T.textDim }}>
            Media inquiries
          </p>
          <p className="text-sm font-medium mt-1" style={{ color: T.text }}>
            press@verzatv.com
          </p>
        </div>
      </section>
    </>
  );
}
