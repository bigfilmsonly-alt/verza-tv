import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import { organizationSchema } from "@/lib/seo/schema";
import { T } from "@/lib/theme";
import { BRAND } from "@/lib/config";
import { getLiveSeries } from "@/lib/catalog";

export const metadata: Metadata = {
  title: `Company | ${BRAND.name}`,
  description:
    "Verza TV company overview. The first US-based vertical micro-drama streaming platform, founded by Alan Mruvka, co-founder of E! Entertainment Television.",
  alternates: { canonical: "/company" },
};

const LINKS = [
  { label: "About", href: "/about" },
  { label: "Founder", href: "/founder" },
  { label: "Press", href: "/press" },
  { label: "Editorial Standards", href: "/editorial-standards" },
  { label: "Contact", href: "/contact" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Refund Policy", href: "/refund-policy" },
];

export default function CompanyPage() {
  const liveCount = getLiveSeries().length;

  return (
    <>
      <JsonLd data={organizationSchema()} />

      <section className="px-4 pt-6 pb-8">
        <h1 className="text-2xl font-bold mb-6" style={{ color: T.text }}>
          {BRAND.name}
        </h1>

        <div
          className="rounded-xl p-5 mb-8"
          style={{
            background: `linear-gradient(135deg, ${T.accent}11, ${T.accent}22)`,
            border: `1px solid ${T.accent}33`,
          }}
        >
          <p className="text-lg font-semibold" style={{ color: T.text }}>
            The first US-based vertical micro-drama streaming platform.
          </p>
          <p className="text-sm mt-2" style={{ color: T.textDim }}>
            Founded by Alan Mruvka, co-founder of E! Entertainment Television.
          </p>
        </div>

        {/* Key facts */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          {[
            { label: "Original Series", value: `${liveCount}+` },
            { label: "Episode Format", value: "60-120s" },
            { label: "Orientation", value: "Vertical 9:16" },
            { label: "Free Episodes", value: "First 5" },
            { label: "Platforms", value: "Web, iOS, Android" },
            { label: "Headquarters", value: "Los Angeles, CA" },
          ].map((fact) => (
            <div
              key={fact.label}
              className="rounded-xl p-3"
              style={{ background: T.surface, border: `1px solid ${T.line}` }}
            >
              <p className="text-xs" style={{ color: T.textMute }}>
                {fact.label}
              </p>
              <p className="text-sm font-semibold mt-0.5" style={{ color: T.text }}>
                {fact.value}
              </p>
            </div>
          ))}
        </div>

        {/* Links */}
        <h2
          className="text-sm font-semibold uppercase tracking-wider mb-3"
          style={{ color: T.accent }}
        >
          Company Pages
        </h2>
        <div className="flex flex-col gap-1.5">
          {LINKS.map((link) => (
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
                width="14" height="14" viewBox="0 0 24 24"
                fill="none" stroke={T.textMute} strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
