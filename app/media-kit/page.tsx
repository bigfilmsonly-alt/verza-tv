import type { Metadata } from "next";
import Link from "next/link";
import { T } from "@/lib/theme";
import { BRAND } from "@/lib/config";
import { getLiveSeries } from "@/lib/catalog";

export const metadata: Metadata = {
  title: `Media Kit | ${BRAND.name}`,
  description:
    "Verza TV media kit. Logos, brand guidelines, key facts, and press resources.",
  alternates: { canonical: "/media-kit" },
};

export default function MediaKitPage() {
  const liveCount = getLiveSeries().length;

  return (
    <section className="px-4 pt-6 pb-8">
      <h1 className="text-2xl font-bold mb-2" style={{ color: T.text }}>
        Media Kit
      </h1>
      <p className="text-sm mb-6" style={{ color: T.textDim }}>
        Resources for press, partners, and media coverage.
      </p>

      {/* Brand identity */}
      <div className="flex flex-col gap-6 mb-8">
        <div>
          <h2
            className="text-sm font-semibold uppercase tracking-wider mb-2"
            style={{ color: T.accent }}
          >
            Brand Name
          </h2>
          <p className="text-sm" style={{ color: T.textDim }}>
            <strong style={{ color: T.text }}>Verza TV</strong> — always
            spelled as two words, with a capital V and capital TV.
          </p>
        </div>

        <div>
          <h2
            className="text-sm font-semibold uppercase tracking-wider mb-2"
            style={{ color: T.accent }}
          >
            Brand Color
          </h2>
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg"
              style={{ background: T.accent }}
            />
            <div>
              <p className="text-sm font-mono" style={{ color: T.text }}>
                #E0115F
              </p>
              <p className="text-xs" style={{ color: T.textMute }}>
                Ruby Red — primary accent
              </p>
            </div>
          </div>
        </div>

        <div>
          <h2
            className="text-sm font-semibold uppercase tracking-wider mb-2"
            style={{ color: T.accent }}
          >
            Boilerplate
          </h2>
          <div
            className="rounded-xl p-4"
            style={{ background: T.surface, border: `1px solid ${T.line}` }}
          >
            <p className="text-sm leading-relaxed" style={{ color: T.textDim }}>
              {BRAND.name} is the first US-based vertical micro-drama streaming
              platform. Founded by Alan Mruvka, co-founder of E! Entertainment
              Television, {BRAND.name} delivers premium short-form cinematic
              series — each episode 60 to 120 seconds — designed for the
              mobile-first generation. With {liveCount}+ original series
              spanning romance, thriller, drama, reality, and more, {BRAND.name}{" "}
              is redefining entertainment for the vertical screen.
            </p>
          </div>
        </div>

        <div>
          <h2
            className="text-sm font-semibold uppercase tracking-wider mb-2"
            style={{ color: T.accent }}
          >
            Key Facts
          </h2>
          <ul className="flex flex-col gap-1.5">
            {[
              `${liveCount}+ original series at launch`,
              "60–120 second episodes in vertical 9:16 format",
              "First 5 episodes of every series are free",
              "Powered by Filmology Labs ($250M production facility)",
              "Founded by Alan Mruvka (co-founder, E! Entertainment Television)",
            ].map((fact, i) => (
              <li
                key={i}
                className="text-sm flex items-start gap-2"
                style={{ color: T.textDim }}
              >
                <span style={{ color: T.accent }}>-</span>
                {fact}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Contact */}
      <div
        className="rounded-xl p-4"
        style={{ background: T.surface, border: `1px solid ${T.line}` }}
      >
        <p className="text-sm font-semibold mb-1" style={{ color: T.text }}>
          Press Contact
        </p>
        <p className="text-sm" style={{ color: T.textDim }}>
          For media inquiries, interviews, and press coverage, email{" "}
          <a
            href="mailto:press@verzatv.com"
            className="underline"
            style={{ color: T.accent }}
          >
            press@verzatv.com
          </a>
        </p>
        <Link
          href="/press"
          className="inline-flex items-center gap-1 text-sm mt-2 no-underline"
          style={{ color: T.accent }}
        >
          View Press Page
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </Link>
      </div>
    </section>
  );
}
