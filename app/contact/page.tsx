import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import { organizationSchema } from "@/lib/schemas";
import { T } from "@/lib/theme";
import { BRAND } from "@/lib/config";

export const metadata: Metadata = {
  title: `Contact | ${BRAND.name}`,
  description: "Get in touch with the Verza TV team.",
  alternates: { canonical: "/contact" },
};

const CONTACTS = [
  {
    icon: "💬",
    title: "General Inquiries",
    email: "support@verzatv.com",
    description:
      "Questions about your account, episodes, coins, or anything else? Our support team is here to help.",
  },
  {
    icon: "📰",
    title: "Press",
    email: "press@verzatv.com",
    description:
      "Media inquiries, interview requests, and press kit access. We welcome coverage from journalists and publications.",
  },
  {
    icon: "⚖️",
    title: "Legal",
    email: "legal@verzatv.com",
    description:
      "DMCA notices, licensing questions, terms of service inquiries, and other legal matters.",
  },
  {
    icon: "💡",
    title: "Feedback",
    email: "feedback@verzatv.com",
    description:
      "Tell us what you love, what you want to see next, or how we can improve. Every message is read by our team.",
  },
];

export default function ContactPage() {
  return (
    <>
      <JsonLd data={organizationSchema()} />

      <section className="px-4 pt-6 pb-8">
        <h1
          className="text-2xl font-bold mb-6"
          style={{ color: T.text }}
        >
          Contact {BRAND.name}
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
            Contact the {BRAND.name} team for support, press inquiries,
            partnerships, or feedback.
          </p>
          <p
            className="text-sm mt-2 leading-relaxed"
            style={{ color: T.textDim }}
          >
            We typically respond within 24 hours on business days.
          </p>
        </div>

        {/* Contact sections */}
        <div className="flex flex-col gap-4 mb-8">
          {CONTACTS.map((section) => (
            <div
              key={section.title}
              className="rounded-xl p-5"
              style={{
                background: T.surface,
                border: `1px solid ${T.line}`,
              }}
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xl" aria-hidden="true">
                  {section.icon}
                </span>
                <h2
                  className="text-sm font-semibold uppercase tracking-wider"
                  style={{ color: T.accent }}
                >
                  {section.title}
                </h2>
              </div>
              <p
                className="text-sm leading-relaxed mb-3"
                style={{ color: T.textDim }}
              >
                {section.description}
              </p>
              <a
                href={`mailto:${section.email}`}
                className="text-sm font-medium underline underline-offset-2"
                style={{ color: T.text }}
              >
                {section.email}
              </a>
            </div>
          ))}
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
