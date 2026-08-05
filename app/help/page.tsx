import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import { faqSchema } from "@/lib/schemas";
import { T } from "@/lib/theme";
import { BRAND } from "@/lib/config";
import { getLiveSeries } from "@/lib/catalog";

const FAQ_ITEMS = [
  {
    question: `What is ${BRAND.name}?`,
    answer:
      `${BRAND.name} is a vertical entertainment service with ${getLiveSeries().length} currently live series. Episodes are designed for phone-first viewing in vertical 9:16 format, and length varies by title.`,
  },
  {
    question: `Is ${BRAND.name} free?`,
    answer:
      `Each title page shows its current free-preview availability. Later episodes may require a Series Unlock or an active VIP entitlement.`,
  },
  {
    question: "How do I unlock a series on a supported purchase surface?",
    answer:
      `Sign in, open the series, and use the unlock option shown after the free episodes. On iPhone and iPad, eligible Series Unlocks are non-consumable in-app purchases billed by Apple at the localized price shown in Apple's purchase sheet. Other supported purchase surfaces show their price and terms before Stripe checkout.`,
  },
  {
    question: "How do I use an existing unlock on another device?",
    answer:
      "Sign in with the same VERZA account used for the purchase. On iPhone or iPad, tap Restore Purchases in Profile or on a Series Unlock screen. If the prior VERZA account was permanently deleted, an Apple-verified orphaned purchase may be reclaimed to the current account; a purchase linked to another live VERZA account cannot transfer.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      `Apple processes iPhone and iPad in-app purchases using the payment methods available for your Apple Account. Other direct purchases use the methods displayed by Stripe Checkout. VERZA does not receive or store your full payment-card number from either provider.`,
  },
  {
    question: "How do I manage or cancel VIP?",
    answer:
      "On a supported web or Android surface, open Profile and choose Manage Subscription to use the secure Stripe billing portal. You can also contact support@verzatv.com for assistance.",
  },
  {
    question: "How do I delete my account?",
    answer:
      "Open Profile, choose Delete Account, and confirm. This permanently removes the account and associated profile, watch progress, saved list, and access entitlements; completed transaction records may be retained where legally required.",
  },
  {
    question: "What devices are supported?",
    answer:
      `${BRAND.name} is available on iPhone, iPad, Android, and the web. Sign in with the same account to sync eligible access, saved titles, and watch progress.`,
  },
  {
    question: "What genres are available?",
    answer:
      "The current catalog includes Romance, Thriller, Drama, Comedy, Reality, Mystery, Sci-Fi, and Horror.",
  },
];

export const metadata: Metadata = {
  title: "Help & FAQ",
  description:
    "Help with VERZA TV viewing, account access, purchases, subscriptions, supported devices, and account deletion.",
  alternates: { canonical: "/help" },
};

export default function HelpPage() {
  return (
    <>
      <JsonLd data={faqSchema(FAQ_ITEMS)} />

      <section className="px-4 pt-6 pb-8">
        <h1
          className="text-2xl font-bold mb-2"
          style={{ color: T.text }}
        >
          Help &amp; FAQ
        </h1>
        <p className="text-sm mb-8" style={{ color: T.textMute }}>
          Everything you need to know about {BRAND.name}.
        </p>

        <div className="flex flex-col gap-3">
          {FAQ_ITEMS.map((item, i) => (
            <details
              key={i}
              className="group rounded-xl"
              style={{
                background: T.surface,
                border: `1px solid ${T.line}`,
              }}
            >
              <summary
                className="flex items-center justify-between px-4 py-3.5 cursor-pointer list-none"
                style={{ color: T.text }}
              >
                <span className="text-sm font-medium pr-4">
                  {item.question}
                </span>
                <svg
                  className="flex-shrink-0 transition-transform group-open:rotate-180"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={T.textMute}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </summary>
              <div
                className="px-4 pb-4 text-sm leading-relaxed"
                style={{ color: T.textDim }}
              >
                {item.answer}
              </div>
            </details>
          ))}
        </div>

        {/* Contact support */}
        <div
          className="rounded-xl p-5 mt-8 text-center"
          style={{
            background: T.surface,
            border: `1px solid ${T.line}`,
          }}
        >
          <p className="text-sm mb-1" style={{ color: T.textDim }}>
            Still have questions?
          </p>
          <a
            href="mailto:support@verzatv.com"
            className="text-sm font-medium"
            style={{ color: T.accent }}
          >
            support@verzatv.com
          </a>
        </div>
      </section>
    </>
  );
}
