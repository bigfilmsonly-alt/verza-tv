import type { Metadata } from "next";
import { T } from "@/lib/theme";
import { BRAND } from "@/lib/config";
import { getLiveSeries } from "@/lib/catalog";
import { organizationSchema } from "@/lib/seo/schema";
import JsonLd from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "Press",
  description:
    "VERZA TV press page with current brand facts and media contact information.",
  alternates: { canonical: "/press" },
};

const BRAND_FACTS = [
  { label: "Platform", value: "Short-form vertical entertainment" },
  { label: "Founded By", value: "Alan Mruvka, co-founder of E! Entertainment Television" },
  { label: "Content Library", value: `${getLiveSeries().length} currently live series` },
  { label: "Episode Format", value: "Short-form vertical 9:16; length varies by title" },
  { label: "Platforms", value: "Web, iOS, Android" },
  { label: "Monetization", value: "$1.99 one-time Series Unlock + VIP subscription" },
  { label: "Free Preview", value: "Current free-episode count shown per title" },
];

const FILMOLOGY_FACTS = [
  { label: "Location", value: "Paterson, New Jersey" },
  { label: "Role", value: "Short-form content production" },
];

export default function PressPage() {
  return (
    <section className="px-4 pt-6 pb-8">
      <JsonLd data={organizationSchema()} />
      <h1
        className="text-2xl font-bold mb-2"
        style={{ color: T.text }}
      >
        Press
      </h1>
      <p className="text-sm mb-8" style={{ color: T.textMute }}>
        Brand facts and metrics for media and partners.
      </p>

      {/* Brand statement */}
      <div
        className="rounded-xl p-5 mb-8"
        style={{
          background: `linear-gradient(135deg, ${T.accent}11, ${T.accent}22)`,
          border: `1px solid ${T.accent}33`,
        }}
      >
        <p
          className="text-base font-semibold leading-relaxed"
          style={{ color: T.text }}
        >
          {BRAND.name} is a phone-first platform for short-form vertical
          entertainment. It was founded by Alan Mruvka, co-founder of E!
          Entertainment Television.
        </p>
      </div>

      {/* Brand Facts */}
      <h2
        className="text-sm font-semibold uppercase tracking-wider mb-3"
        style={{ color: T.accent }}
      >
        {BRAND.name} at a Glance
      </h2>
      <div
        className="rounded-xl overflow-hidden mb-8"
        style={{
          background: T.surface,
          border: `1px solid ${T.line}`,
        }}
      >
        {BRAND_FACTS.map((fact, i) => (
          <div
            key={fact.label}
            className="flex items-start justify-between px-4 py-3"
            style={{
              borderBottom:
                i < BRAND_FACTS.length - 1
                  ? `1px solid ${T.line}`
                  : "none",
            }}
          >
            <span
              className="text-sm font-medium flex-shrink-0 mr-4"
              style={{ color: T.textDim }}
            >
              {fact.label}
            </span>
            <span
              className="text-sm text-right"
              style={{ color: T.text }}
            >
              {fact.value}
            </span>
          </div>
        ))}
      </div>

      {/* Filmology Labs */}
      <h2
        className="text-sm font-semibold uppercase tracking-wider mb-3"
        style={{ color: T.accent }}
      >
        Filmology Labs
      </h2>
      <div
        className="rounded-xl overflow-hidden mb-8"
        style={{
          background: T.surface,
          border: `1px solid ${T.line}`,
        }}
      >
        {FILMOLOGY_FACTS.map((fact, i) => (
          <div
            key={fact.label}
            className="flex items-start justify-between px-4 py-3"
            style={{
              borderBottom:
                i < FILMOLOGY_FACTS.length - 1
                  ? `1px solid ${T.line}`
                  : "none",
            }}
          >
            <span
              className="text-sm font-medium flex-shrink-0 mr-4"
              style={{ color: T.textDim }}
            >
              {fact.label}
            </span>
            <span
              className="text-sm text-right"
              style={{ color: T.text }}
            >
              {fact.value}
            </span>
          </div>
        ))}
      </div>

      {/* Format */}
      <h2
        className="text-sm font-semibold uppercase tracking-wider mb-3"
        style={{ color: T.accent }}
      >
        Format
      </h2>
      <div
        className="rounded-xl p-4 mb-8"
        style={{
          background: T.surface,
          border: `1px solid ${T.line}`,
        }}
      >
        <p className="text-sm leading-relaxed" style={{ color: T.text }}>
          {BRAND.name} distributes short-form vertical entertainment through
          web and mobile experiences. Episode lengths, title availability, and
          access options are presented on the relevant title pages.
        </p>
      </div>

      {/* Contact */}
      <div
        className="rounded-xl p-4 text-center"
        style={{
          background: T.surface,
          border: `1px solid ${T.line}`,
        }}
      >
        <p className="text-sm" style={{ color: T.textDim }}>
          Media inquiries
        </p>
        <p
          className="text-sm font-medium mt-1"
          style={{ color: T.text }}
        >
          press@verzatv.com
        </p>
      </div>
    </section>
  );
}
