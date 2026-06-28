import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import { breadcrumbSchema, organizationSchema } from "@/lib/schemas";
import { T } from "@/lib/theme";
import { BRAND } from "@/lib/config";
import { LEADERSHIP } from "@/lib/data/company";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://verzatv.com";

export const metadata: Metadata = {
  title: `Leadership | ${BRAND.name}`,
  description:
    "Meet the Verza TV leadership team, led by founder Alan Mruvka, co-founder of E! Entertainment Television, building a vertically integrated micro-drama studio.",
  alternates: { canonical: "/leadership" },
  openGraph: {
    title: `Leadership | ${BRAND.name}`,
    description:
      "The Verza TV leadership team, led by founder Alan Mruvka, co-founder of E! Entertainment Television.",
    url: `${BASE_URL}/leadership`,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `Leadership | ${BRAND.name}`,
    description:
      "The Verza TV leadership team, led by founder Alan Mruvka.",
  },
};

export default function LeadershipPage() {
  return (
    <>
      <JsonLd
        data={[
          organizationSchema(),
          breadcrumbSchema([
            { name: "Company", url: `${BASE_URL}/company` },
            { name: "Leadership", url: `${BASE_URL}/leadership` },
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
          Leadership
        </h1>
        <p className="text-sm mb-8 leading-relaxed" style={{ color: T.textDim }}>
          {BRAND.name} is led by a team that pairs studio pedigree with
          software discipline — founded by Alan Mruvka, co-founder of E!
          Entertainment Television, and built to own content and platform end
          to end.
        </p>

        {/* Leaders */}
        <div className="flex flex-col gap-3 mb-8">
          {LEADERSHIP.map((leader) => (
            <div
              key={leader.name}
              className="rounded-xl p-5"
              style={{ background: T.surface, border: `1px solid ${T.line}` }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="flex items-center justify-center rounded-full flex-shrink-0 text-sm font-bold"
                  style={{
                    width: 44,
                    height: 44,
                    background: `${T.accent}1A`,
                    color: T.accent,
                  }}
                  aria-hidden
                >
                  {leader.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)}
                </div>
                <div>
                  <p
                    className="text-base font-semibold leading-tight"
                    style={{ color: T.text }}
                  >
                    {leader.name}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: T.accent }}>
                    {leader.title}
                  </p>
                </div>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: T.textDim }}>
                {leader.bio}
              </p>
              {leader.href && (
                <Link
                  href={leader.href}
                  className="inline-flex items-center gap-1 text-sm font-semibold no-underline mt-3"
                  style={{ color: T.accent }}
                >
                  More about {leader.name.split(" ")[0]}
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
                </Link>
              )}
            </div>
          ))}
        </div>

        {/* Founder note */}
        <div
          className="rounded-xl p-4 mb-8"
          style={{
            background: `linear-gradient(135deg, ${T.accent}11, ${T.accent}22)`,
            border: `1px solid ${T.accent}33`,
          }}
        >
          <p className="text-sm leading-relaxed" style={{ color: T.textDim }}>
            Learn more about our founder on the{" "}
            <Link
              href="/founder"
              className="no-underline font-semibold"
              style={{ color: T.accent }}
            >
              founder page
            </Link>{" "}
            and the dedicated{" "}
            <Link
              href="/alan-mruvka"
              className="no-underline font-semibold"
              style={{ color: T.accent }}
            >
              Alan Mruvka hub
            </Link>
            .
          </p>
        </div>

        {/* Placeholder disclosure */}
        <p className="text-xs leading-relaxed" style={{ color: T.textMute }}>
          Bios for roles other than the founder are representative placeholders
          for the {BRAND.name} team and will be confirmed before public use.
        </p>
      </section>
    </>
  );
}
