import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import { organizationSchema } from "@/lib/schemas";
import { T } from "@/lib/theme";
import { BRAND } from "@/lib/config";

export const metadata: Metadata = {
  title: `Editorial Standards | ${BRAND.name}`,
  description:
    "Our commitment to quality content, editorial integrity, and responsible storytelling.",
  alternates: { canonical: "/editorial-standards" },
};

const SECTIONS = [
  {
    title: "Our Standards",
    body: `${BRAND.name} holds every piece of content to a high editorial bar. We believe that short-form entertainment deserves the same rigor as any other medium. Our editorial team reviews every series for narrative quality, production value, and audience appropriateness before it goes live on the platform.`,
  },
  {
    title: "Content Quality",
    body: "Every series on the platform goes through a multi-stage review process covering script, production, and final cut. We evaluate pacing, dialogue, visual quality, and sound design. Content that does not meet our standards is sent back for revision or declined. We do not publish content solely to fill a catalog.",
  },
  {
    title: "Human Review",
    body: "No content is published on Verza TV without human editorial oversight. While we use technology to assist with scheduling, metadata, and distribution, all creative and editorial decisions are made by people. Any AI-assisted tooling used in production is disclosed, and the final editorial judgment always rests with our team.",
  },
  {
    title: "Creator Guidelines",
    body: "Creators who produce content for Verza TV retain attribution and credit on all published work. We require accurate credits for writers, directors, cast, and crew. Creators are expected to follow our content policies, which prohibit plagiarism, undisclosed AI-generated performances, and misleading claims within storylines presented as fact.",
  },
  {
    title: "Age-Appropriate Ratings",
    body: "Every series carries a content rating reviewed by our editorial team. Ratings reflect language, violence, sexual content, and thematic elements. We do not allow unrated content on the platform. Parents and guardians can use these ratings to make informed viewing decisions.",
  },
  {
    title: "Reporting Issues",
    body: "If you encounter content that you believe violates our editorial standards, contains errors, or raises concerns, please contact us. We investigate every report and take corrective action when warranted, including content removal, rating adjustments, or creator account review.",
  },
];

export default function EditorialStandardsPage() {
  return (
    <>
      <JsonLd data={organizationSchema()} />

      <section className="px-4 pt-6 pb-8">
        <h1
          className="text-2xl font-bold mb-6"
          style={{ color: T.text }}
        >
          Editorial Standards
        </h1>

        {/* Answer-first statement */}
        <div
          className="rounded-xl p-5 mb-8"
          style={{
            background: `linear-gradient(135deg, ${T.accent}11, ${T.accent}22)`,
            border: `1px solid ${T.accent}33`,
          }}
        >
          <p
            className="text-lg font-semibold leading-relaxed"
            style={{ color: T.text }}
          >
            Every piece of content on {BRAND.name} is reviewed by our editorial
            team before publication.
          </p>
          <p
            className="text-sm mt-2 leading-relaxed"
            style={{ color: T.textDim }}
          >
            Quality, integrity, and responsible storytelling are non-negotiable.
          </p>
        </div>

        {/* Standards sections */}
        <div className="flex flex-col gap-6 mb-8">
          {SECTIONS.map((section) => (
            <div key={section.title}>
              <h2
                className="text-sm font-semibold uppercase tracking-wider mb-2"
                style={{ color: T.accent }}
              >
                {section.title}
              </h2>
              <p
                className="text-sm leading-relaxed"
                style={{ color: T.textDim }}
              >
                {section.body}
              </p>
            </div>
          ))}
        </div>

        {/* Report contact */}
        <div
          className="rounded-xl p-5 mb-6"
          style={{
            background: T.surface,
            border: `1px solid ${T.line}`,
          }}
        >
          <p
            className="text-sm leading-relaxed mb-2"
            style={{ color: T.textDim }}
          >
            To report a content concern or editorial issue, email us at:
          </p>
          <a
            href="mailto:feedback@verzatv.com"
            className="text-sm font-medium underline underline-offset-2"
            style={{ color: T.text }}
          >
            feedback@verzatv.com
          </a>
        </div>

        {/* Back to home */}
        <div
          className="rounded-xl p-4 text-center"
          style={{
            background: T.surface,
            border: `1px solid ${T.line}`,
          }}
        >
          <Link
            href="/"
            className="text-sm font-medium underline underline-offset-2"
            style={{ color: T.text }}
          >
            Back to Home
          </Link>
        </div>
      </section>
    </>
  );
}
