import type { Metadata } from "next";
import Link from "next/link";
import { T } from "@/lib/theme";
import { BRAND } from "@/lib/config";
import { AGREEMENT_VERSION } from "@/lib/creator-client";

export const metadata: Metadata = {
  title: "Creator Agreement",
  description:
    "Draft VERZA Creator Agreement covering the 80/20 revenue split, content license, term, rights, and payments. Placeholder pending legal counsel.",
  alternates: { canonical: "/legal/creator-agreement" },
  robots: { index: false, follow: false },
};

const sectionHeading = { color: T.text };
const bodyText = { color: T.textDim };

const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: "1. Revenue Share (80/20)",
    body: [
      "For each paid transaction on content you license to VERZA TV, you receive eighty percent (80%) of the net revenue and VERZA retains twenty percent (20%) as its platform fee. Net revenue means the amount VERZA actually collects after payment processor fees, refunds, chargebacks, and applicable taxes.",
      "This placeholder section describes the intended commercial terms only. Final defined terms, payout timing, minimum thresholds, and reporting will be set out in the executed agreement.",
    ],
  },
  {
    title: "2. Content License",
    body: [
      "You grant VERZA a license to host, encode, stream, promote, and make your submitted content available to viewers through the Service and its distribution channels. You retain ownership of your content.",
      "The scope of the license (territory and exclusivity) follows the selections you make in your application. This placeholder text is not the final grant of rights.",
    ],
  },
  {
    title: "3. Term & Termination",
    body: [
      "This placeholder describes an ongoing term that either party may end with notice, subject to windows already committed to viewers who purchased access. Post-termination handling of purchased content and outstanding payouts will be defined in the final agreement.",
    ],
  },
  {
    title: "4. Rights & Warranties",
    body: [
      "You represent that you own or control all rights necessary to license the content you submit, that it does not infringe any third party rights, and that it complies with applicable law and the VERZA content policies. This placeholder does not limit or replace the representations in the final agreement.",
    ],
  },
  {
    title: "5. Payments",
    body: [
      "Payouts are handled after approval through Stripe. VERZA does not collect your bank account numbers or tax identification details inside the application. Secure payment and tax onboarding happen separately through Stripe once your channel is approved.",
      "Payout schedule, currency handling, and tax documentation requirements will be specified in the final agreement.",
    ],
  },
];

export default function CreatorAgreementPage() {
  return (
    <section className="px-4 pt-6 pb-12 max-w-2xl mx-auto">
      <Link
        href="/creator"
        className="inline-flex items-center gap-1.5 text-sm mb-6"
        style={{ color: T.textMute }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M15 18l-6-6 6-6" />
        </svg>
        Back to your application
      </Link>

      <h1 className="text-2xl font-bold mb-2" style={{ color: T.text }}>
        VERZA Creator Agreement
      </h1>
      <p className="text-sm mb-6" style={{ color: T.textMute }}>
        Version: {AGREEMENT_VERSION}
      </p>

      <div
        className="rounded-xl p-4 mb-8 text-sm leading-relaxed"
        style={{
          background: `${BRAND.accentHex}14`,
          border: `1px solid ${BRAND.accentHex}33`,
          color: T.text,
        }}
      >
        Draft for review. This is placeholder text pending legal counsel and is not the final
        agreement.
      </div>

      <div className="flex flex-col gap-8">
        {SECTIONS.map((s) => (
          <div key={s.title}>
            <h2 className="text-base font-semibold mb-2" style={sectionHeading}>
              {s.title}
            </h2>
            <div className="flex flex-col gap-3">
              {s.body.map((p, i) => (
                <p key={i} className="text-sm leading-relaxed" style={bodyText}>
                  {p}
                </p>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div
        className="rounded-xl p-4 mt-10 text-center"
        style={{ background: T.surface, border: `1px solid ${T.line}` }}
      >
        <p className="text-xs" style={{ color: T.textMute }}>
          {BRAND.name} &middot; {BRAND.domain} &middot; Creator Agreement {AGREEMENT_VERSION}
        </p>
      </div>
    </section>
  );
}
