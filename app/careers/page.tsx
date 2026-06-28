import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import { breadcrumbSchema, organizationSchema } from "@/lib/schemas";
import { T } from "@/lib/theme";
import { BRAND } from "@/lib/config";
import {
  CAREERS_CULTURE,
  PERKS,
  OPEN_ROLES,
  CAREERS_EMAIL,
} from "@/lib/data/company";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://verzatv.com";

export const metadata: Metadata = {
  title: `Careers | ${BRAND.name}`,
  description:
    "Join Verza TV — a studio and software company in one building. Explore open roles in engineering, production, content, and growth at the vertical micro-drama studio.",
  alternates: { canonical: "/careers" },
  openGraph: {
    title: `Careers | ${BRAND.name}`,
    description:
      "Open roles at Verza TV, the first US-based vertical micro-drama studio. Engineering, production, content, and growth.",
    url: `${BASE_URL}/careers`,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `Careers | ${BRAND.name}`,
    description:
      "Open roles at Verza TV — a studio and software company in one building.",
  },
};

export default function CareersPage() {
  return (
    <>
      <JsonLd
        data={[
          organizationSchema(),
          breadcrumbSchema([
            { name: "Company", url: `${BASE_URL}/company` },
            { name: "Careers", url: `${BASE_URL}/careers` },
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
          Careers
        </h1>
        <p className="text-sm mb-8 leading-relaxed" style={{ color: T.textDim }}>
          Build the next mass-market entertainment format with us. {BRAND.name}{" "}
          is the first US-based vertical micro-drama studio — a place where the
          people writing code and the people shooting series share a roadmap and
          an audience.
        </p>

        {/* Culture */}
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
            A studio and a software company in one building.
          </p>
          <p className="text-sm leading-relaxed" style={{ color: T.textDim }}>
            {CAREERS_CULTURE}
          </p>
        </div>

        {/* Perks */}
        <h2
          className="text-sm font-semibold uppercase tracking-wider mb-3"
          style={{ color: T.accent }}
        >
          Why Verza TV
        </h2>
        <div className="grid grid-cols-1 gap-3 mb-8">
          {PERKS.map((perk) => (
            <div
              key={perk.title}
              className="rounded-xl p-4"
              style={{ background: T.surface, border: `1px solid ${T.line}` }}
            >
              <p
                className="text-sm font-semibold mb-1"
                style={{ color: T.text }}
              >
                {perk.title}
              </p>
              <p className="text-sm leading-relaxed" style={{ color: T.textDim }}>
                {perk.detail}
              </p>
            </div>
          ))}
        </div>

        {/* Open roles */}
        <h2
          className="text-sm font-semibold uppercase tracking-wider mb-3"
          style={{ color: T.accent }}
        >
          Open Roles
        </h2>
        <div className="flex flex-col gap-2 mb-8">
          {OPEN_ROLES.map((role) => (
            <a
              key={role.title}
              href={`mailto:${CAREERS_EMAIL}?subject=${encodeURIComponent(
                `Application: ${role.title}`,
              )}`}
              className="block rounded-xl p-4 no-underline"
              style={{ background: T.surface, border: `1px solid ${T.line}` }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p
                    className="text-sm font-semibold leading-snug"
                    style={{ color: T.text }}
                  >
                    {role.title}
                  </p>
                  <p className="text-xs mt-1" style={{ color: T.textMute }}>
                    {role.team} · {role.location}
                  </p>
                </div>
                <span
                  className="text-[11px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full flex-shrink-0"
                  style={{ background: `${T.accent}1A`, color: T.accent }}
                >
                  {role.type}
                </span>
              </div>
            </a>
          ))}
        </div>

        {/* General application */}
        <div
          className="rounded-xl p-4 text-center"
          style={{ background: T.surface, border: `1px solid ${T.line}` }}
        >
          <p className="text-sm mb-1" style={{ color: T.textDim }}>
            Don&apos;t see your role? We&apos;re always meeting great people.
          </p>
          <p className="text-sm font-medium" style={{ color: T.text }}>
            {CAREERS_EMAIL}
          </p>
          <p className="text-xs mt-3" style={{ color: T.textMute }}>
            Prefer a different channel? Reach us through the{" "}
            <Link
              href="/contact"
              className="no-underline"
              style={{ color: T.accent }}
            >
              contact page
            </Link>
            .
          </p>
        </div>
      </section>
    </>
  );
}
