import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import { breadcrumbSchema } from "@/lib/schemas";
import { T } from "@/lib/theme";
import { BRAND } from "@/lib/config";
import { ALAN_SAMEAS, ALAN_SUBPAGES } from "@/lib/data/alan";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.verzatv.com";

const DESCRIPTION =
  "Alan Mruvka is a co-founder of E! Entertainment Television and the founder of VERZA TV, the US-based vertical micro-drama streaming platform. Biography, legacy, and vision.";

export const metadata: Metadata = {
  title: `Alan Mruvka — E! Co-Founder & VERZA TV Founder`,
  description: DESCRIPTION,
  keywords: [
    "Alan Mruvka",
    "E! co-founder",
    "VERZA TV founder",
    "E! Entertainment Television",
    "vertical micro-drama",
  ],
  alternates: { canonical: "/alan-mruvka" },
  openGraph: {
    title: "Alan Mruvka — E! Co-Founder & VERZA TV Founder",
    description: DESCRIPTION,
    url: `${BASE_URL}/alan-mruvka`,
    type: "profile",
    siteName: BRAND.name,
  },
  twitter: {
    card: "summary_large_image",
    title: "Alan Mruvka — E! Co-Founder & VERZA TV Founder",
    description: DESCRIPTION,
  },
};

const personSchema = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Alan Mruvka",
  url: `${BASE_URL}/alan-mruvka`,
  jobTitle: "Founder & CEO",
  description:
    "Co-founder of E! Entertainment Television and founder of VERZA TV, the US-based vertical micro-drama streaming platform.",
  worksFor: {
    "@type": "Organization",
    name: "VERZA TV",
    url: BASE_URL,
  },
  alumniOf: {
    "@type": "Organization",
    name: "E! Entertainment Television",
  },
  knowsAbout: [
    "Entertainment media",
    "Vertical micro-dramas",
    "Streaming platforms",
    "Cable television",
  ],
  sameAs: ALAN_SAMEAS,
};

export default function AlanMruvkaHub() {
  return (
    <>
      <JsonLd
        data={[
          personSchema,
          breadcrumbSchema([
            { name: "Home", url: BASE_URL },
            { name: "Alan Mruvka", url: `${BASE_URL}/alan-mruvka` },
          ]),
        ]}
      />

      <section className="px-4 pt-6 pb-8">
        <nav className="text-xs mb-4" style={{ color: T.textMute }} aria-label="Breadcrumb">
          <Link href="/" className="no-underline" style={{ color: T.textMute }}>
            Home
          </Link>
          <span> / </span>
          <span style={{ color: T.textDim }}>Alan Mruvka</span>
        </nav>

        <h1 className="text-2xl font-bold mb-2" style={{ color: T.text }}>
          Alan Mruvka
        </h1>
        <p className="text-sm font-medium mb-6" style={{ color: T.accent }}>
          Co-Founder of E! Entertainment Television · Founder of {BRAND.name}
        </p>

        <p className="text-sm leading-relaxed mb-6" style={{ color: T.textDim }}>
          Alan Mruvka is an American media entrepreneur and a co-founder of E!
          Entertainment Television. Today he is the founder of {BRAND.name}, a
          US-based platform for short-form vertical entertainment. Episode
          lengths and formats vary by title. This page is a reference hub for
          his work with E! and VERZA TV.
        </p>

        {/* E! legacy summary */}
        <div className="mb-7">
          <h2
            className="text-sm font-semibold uppercase tracking-wider mb-2"
            style={{ color: T.accent }}
          >
            The E! Entertainment Legacy
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: T.textDim }}>
            As a co-founder of E!, Mruvka helped launch a cable channel focused
            on entertainment and pop-culture programming. He later founded{" "}
            {BRAND.name} around short-form, phone-first distribution.{" "}
            <Link href="/alan-mruvka/e-entertainment-legacy" className="underline" style={{ color: T.accent }}>
              Read the full E! legacy
            </Link>
            .
          </p>
        </div>

        {/* Subpage directory */}
        <div className="mb-8">
          <h2
            className="text-sm font-semibold uppercase tracking-wider mb-3"
            style={{ color: T.accent }}
          >
            Explore
          </h2>
          <div className="flex flex-col gap-3">
            {ALAN_SUBPAGES.map((p) => (
              <Link
                key={p.slug}
                href={`/alan-mruvka/${p.slug}`}
                className="rounded-xl p-4 no-underline block"
                style={{ background: T.surface, border: `1px solid ${T.line}` }}
              >
                <span className="text-sm font-semibold block mb-1" style={{ color: T.text }}>
                  {p.title}
                </span>
                <span className="text-xs leading-relaxed block" style={{ color: T.textMute }}>
                  {p.blurb}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Related platform pages */}
        <div className="pt-6" style={{ borderTop: `1px solid ${T.line}` }}>
          <h2
            className="text-sm font-semibold uppercase tracking-wider mb-3"
            style={{ color: T.textMute }}
          >
            More from {BRAND.name}
          </h2>
          <div className="flex flex-col gap-2">
            <Link href="/founder" className="text-sm no-underline py-1" style={{ color: T.text }}>
              Founder profile →
            </Link>
            <Link href="/about" className="text-sm no-underline py-1" style={{ color: T.text }}>
              About {BRAND.name} →
            </Link>
            <Link href="/company" className="text-sm no-underline py-1" style={{ color: T.text }}>
              Company →
            </Link>
            <Link href="/press" className="text-sm no-underline py-1" style={{ color: T.text }}>
              Press →
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
