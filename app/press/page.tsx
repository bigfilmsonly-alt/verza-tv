import type { Metadata } from "next";
import { T } from "@/lib/theme";
import { BRAND } from "@/lib/config";
import { getLiveSeries } from "@/lib/catalog";
import { organizationSchema } from "@/lib/seo/schema";
import JsonLd from "@/components/JsonLd";

export const metadata: Metadata = {
  title: `Press | ${BRAND.name}`,
  description:
    "Verza TV press page. Brand facts, key metrics, and media resources for the first US-based vertical micro-drama streaming platform.",
  alternates: { canonical: "/press" },
};

const BRAND_FACTS = [
  { label: "Platform", value: "First US-based vertical micro-drama streaming app" },
  { label: "Founded By", value: "Alan Mruvka, co-founder of E! Entertainment Television" },
  { label: "Content Library", value: `${getLiveSeries().length}+ original series at launch` },
  { label: "Episode Format", value: "60-120 seconds, vertical 9:16" },
  { label: "Total Episode Views", value: "120M+" },
  { label: "Average per Episode", value: "425K views" },
  { label: "Completion Rate", value: "68%" },
  { label: "Monthly Active Users", value: "480K MAU" },
  { label: "Daily Watch Time", value: "28 min average" },
  { label: "Platforms", value: "iOS, Android, Web" },
  { label: "Monetization", value: "Coin-based unlock + VIP subscription" },
  { label: "Free Episodes", value: "First 5 episodes of every series" },
];

const FILMOLOGY_FACTS = [
  { label: "Investment", value: "$250M production facility" },
  { label: "Location", value: "Paterson, New Jersey" },
  { label: "Soundstages", value: "21 soundstages" },
  { label: "LED Volume Wall", value: "State-of-the-art virtual production" },
  { label: "Total Footprint", value: "250,000 sq ft" },
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
          {BRAND.name} is the first US-based vertical micro-drama streaming
          platform. Founded by Alan Mruvka, co-founder of E! Entertainment
          Television.
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

      {/* Market */}
      <h2
        className="text-sm font-semibold uppercase tracking-wider mb-3"
        style={{ color: T.accent }}
      >
        Market
      </h2>
      <div
        className="rounded-xl p-4 mb-8"
        style={{
          background: T.surface,
          border: `1px solid ${T.line}`,
        }}
      >
        <p className="text-sm leading-relaxed" style={{ color: T.text }}>
          The global vertical micro-drama market is valued at{" "}
          <span style={{ color: T.coin, fontWeight: 600 }}>
            $6.5 billion
          </span>{" "}
          and growing rapidly. {BRAND.name} is positioned as the premier
          US-based platform in this space.
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
