import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import { breadcrumbSchema, organizationSchema } from "@/lib/schemas";
import { T } from "@/lib/theme";
import { BRAND } from "@/lib/config";
import {
  INVESTOR_OVERVIEW,
  INVESTOR_HIGHLIGHTS,
  MARKET_THESIS,
  INVESTOR_EMAIL,
} from "@/lib/data/company";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://verzatv.com";

export const metadata: Metadata = {
  title: `Investor Relations | ${BRAND.name}`,
  description:
    "Verza TV investor relations: company overview, traction, and the market thesis for vertical micro-drama — a vertically integrated American entertainment studio.",
  alternates: { canonical: "/investors" },
  openGraph: {
    title: `Investor Relations | ${BRAND.name}`,
    description:
      "Company overview, traction highlights, and the market thesis for vertical micro-drama from Verza TV.",
    url: `${BASE_URL}/investors`,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `Investor Relations | ${BRAND.name}`,
    description:
      "Company overview and market thesis for vertical micro-drama from Verza TV.",
  },
};

export default function InvestorsPage() {
  return (
    <>
      <JsonLd
        data={[
          organizationSchema(),
          breadcrumbSchema([
            { name: "Company", url: `${BASE_URL}/company` },
            { name: "Investors", url: `${BASE_URL}/investors` },
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
          Investor Relations
        </h1>
        <p className="text-sm mb-8 leading-relaxed" style={{ color: T.textDim }}>
          {BRAND.name} is building the leading American platform for vertical
          micro-drama. This page summarizes who we are, where the opportunity
          sits, and how to reach our team.
        </p>

        {/* Overview */}
        <div
          className="rounded-xl p-5 mb-8"
          style={{
            background: `linear-gradient(135deg, ${T.accent}11, ${T.accent}22)`,
            border: `1px solid ${T.accent}33`,
          }}
        >
          <p
            className="text-base font-semibold leading-relaxed mb-2"
            style={{ color: T.text }}
          >
            A vertically integrated entertainment studio for the mobile era.
          </p>
          <p className="text-sm leading-relaxed" style={{ color: T.textDim }}>
            {INVESTOR_OVERVIEW}
          </p>
        </div>

        {/* Highlights */}
        <h2
          className="text-sm font-semibold uppercase tracking-wider mb-3"
          style={{ color: T.accent }}
        >
          Traction & Highlights
        </h2>
        <div className="grid grid-cols-2 gap-3 mb-8">
          {INVESTOR_HIGHLIGHTS.map((h) => (
            <div
              key={h.label}
              className="rounded-xl p-4"
              style={{ background: T.surface, border: `1px solid ${T.line}` }}
            >
              <p className="text-lg font-bold leading-tight" style={{ color: T.text }}>
                {h.metric}
              </p>
              <p
                className="text-xs font-medium mt-0.5"
                style={{ color: T.accent }}
              >
                {h.label}
              </p>
              <p className="text-xs mt-1.5 leading-relaxed" style={{ color: T.textMute }}>
                {h.detail}
              </p>
            </div>
          ))}
        </div>

        {/* Market thesis */}
        <h2
          className="text-sm font-semibold uppercase tracking-wider mb-3"
          style={{ color: T.accent }}
        >
          The Market Thesis
        </h2>
        <div className="flex flex-col gap-3 mb-8">
          {MARKET_THESIS.map((t) => (
            <div
              key={t.title}
              className="rounded-xl p-4"
              style={{ background: T.surface, border: `1px solid ${T.line}` }}
            >
              <p
                className="text-sm font-semibold mb-1.5"
                style={{ color: T.text }}
              >
                {t.title}
              </p>
              <p className="text-sm leading-relaxed" style={{ color: T.textDim }}>
                {t.body}
              </p>
            </div>
          ))}
        </div>

        {/* Related links */}
        <div className="flex flex-col gap-1.5 mb-8">
          {[
            { label: "Company overview", href: "/company" },
            { label: "Leadership team", href: "/leadership" },
            { label: "Newsroom", href: "/newsroom" },
            { label: "Partnerships", href: "/partnerships" },
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

        {/* Contact CTA */}
        <div
          className="rounded-xl p-4 text-center"
          style={{ background: T.surface, border: `1px solid ${T.line}` }}
        >
          <p className="text-sm mb-1" style={{ color: T.textDim }}>
            Investor inquiries
          </p>
          <p className="text-sm font-medium" style={{ color: T.text }}>
            <a
              href={`mailto:${INVESTOR_EMAIL}`}
              className="no-underline"
              style={{ color: T.text }}
            >
              {INVESTOR_EMAIL}
            </a>
          </p>
        </div>
      </section>
    </>
  );
}
