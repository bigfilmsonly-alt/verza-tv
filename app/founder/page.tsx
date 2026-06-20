import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import { T } from "@/lib/theme";
import { BRAND } from "@/lib/config";

export const metadata: Metadata = {
  title: `Alan Mruvka — Founder | ${BRAND.name}`,
  description:
    "Alan Mruvka, co-founder of E! Entertainment Television, founded Verza TV to bring premium micro-drama entertainment to the mobile-first generation.",
  alternates: { canonical: "/founder" },
};

const founderSchema = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Alan Mruvka",
  jobTitle: "Founder & CEO",
  worksFor: {
    "@type": "Organization",
    name: "Verza TV",
    url: "https://www.verzatv.com",
  },
  description:
    "Co-founder of E! Entertainment Television. Founder of Verza TV, the first US-based vertical micro-drama streaming platform.",
  sameAs: [
    "https://www.instagram.com/verzatv",
  ],
};

export default function FounderPage() {
  return (
    <>
      <JsonLd data={founderSchema} />

      <section className="px-4 pt-6 pb-8">
        <h1 className="text-2xl font-bold mb-2" style={{ color: T.text }}>
          Alan Mruvka
        </h1>
        <p className="text-sm font-medium mb-6" style={{ color: T.accent }}>
          Founder & CEO, {BRAND.name}
        </p>

        <div className="flex flex-col gap-6">
          {/* E! Entertainment legacy */}
          <div>
            <h2
              className="text-sm font-semibold uppercase tracking-wider mb-2"
              style={{ color: T.accent }}
            >
              The E! Entertainment Story
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: T.textDim }}>
              Alan Mruvka co-founded E! Entertainment Television, one of the
              most recognized entertainment brands in the world. E! launched as
              a cable network dedicated to pop culture, celebrity news, and
              entertainment programming, and grew into a global media powerhouse
              reaching over 90 countries.
            </p>
          </div>

          {/* Verza TV vision */}
          <div>
            <h2
              className="text-sm font-semibold uppercase tracking-wider mb-2"
              style={{ color: T.accent }}
            >
              Building Verza TV
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: T.textDim }}>
              After decades of building entertainment brands, Alan saw the
              same transformation happening again: the shift from linear TV to
              mobile-first, short-form content. {BRAND.name} was founded to
              lead that shift with premium-quality vertical micro-dramas —
              cinematic stories told in 60 to 120 second episodes, designed
              for the way audiences actually consume content today.
            </p>
          </div>

          {/* Filmology Labs */}
          <div>
            <h2
              className="text-sm font-semibold uppercase tracking-wider mb-2"
              style={{ color: T.accent }}
            >
              Filmology Labs
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: T.textDim }}>
              {BRAND.name} is powered by Filmology Labs, a $250M
              state-of-the-art production facility in Paterson, New Jersey.
              With 21 soundstages, an LED volume wall for virtual production,
              and 250,000 square feet of production space, Filmology Labs
              gives {BRAND.name} a vertically integrated production advantage.
            </p>
          </div>

          {/* Vision */}
          <div>
            <h2
              className="text-sm font-semibold uppercase tracking-wider mb-2"
              style={{ color: T.accent }}
            >
              Vision
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: T.textDim }}>
              {BRAND.name} is building the future of entertainment — a platform
              where every story is crafted for the mobile screen, where quality
              meets convenience, and where creators and audiences connect
              through stories that fit in your pocket but stay in your memory.
            </p>
          </div>

          {/* HUMAN INPUT NEEDED notice */}
          <div
            className="rounded-xl p-4 mt-4"
            style={{
              background: T.surface,
              border: `1px solid ${T.line}`,
            }}
          >
            <p className="text-xs" style={{ color: T.textMute }}>
              For press inquiries, contact us at{" "}
              <a
                href="mailto:press@verzatv.com"
                className="underline"
                style={{ color: T.accent }}
              >
                press@verzatv.com
              </a>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
