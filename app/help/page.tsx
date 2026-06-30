import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import { faqSchema } from "@/lib/schemas";
import { T } from "@/lib/theme";
import { BRAND, FREE_EPISODES, VIP_WEEKLY, VIP_YEARLY, DEFAULT_COIN_PER_EPISODE } from "@/lib/config";
import { getLiveSeries } from "@/lib/catalog";
import { formatPrice } from "@/lib/coins";

const FAQ_ITEMS = [
  {
    question: `What is ${BRAND.name}?`,
    answer:
      `${BRAND.name} is the first US-based vertical micro-drama streaming platform. We offer ${getLiveSeries().length}+ original series with episodes that run 60 to 120 seconds each, designed for phone-first viewing in vertical 9:16 format. Founded by Alan Mruvka, co-founder of E! Entertainment Television.`,
  },
  {
    question: `Is ${BRAND.name} free?`,
    answer:
      `The first ${FREE_EPISODES} episodes of every series are completely free. After that, you can unlock the full series for just $1.99 (Summer Sale) — a one-time payment that gives you access to every episode.`,
  },
  {
    question: "How much does it cost to unlock a series?",
    answer:
      `During our Summer Sale, unlocking a full series costs just $1.99. This is a one-time payment that gives you access to all episodes in that series — no subscriptions, no hidden fees.`,
  },
  {
    question: "How do I unlock a series?",
    answer:
      `Watch the first ${FREE_EPISODES} free episodes. When you reach the next episode, you'll see an "Unlock Full Series — $1.99" button. Tap it, complete the payment, and all episodes are yours.`,
  },
  {
    question: "What payment methods do you accept?",
    answer:
      `We accept all major credit and debit cards through Stripe, our secure payment provider. Your payment information is never stored on our servers.`,
  },
  {
    question: "How do I watch free episodes?",
    answer:
      `Just open any series and start watching. The first ${FREE_EPISODES} episodes are always free — no account or payment required. After the free episodes, you can unlock the rest for $2.`,
  },
  {
    question: "What devices are supported?",
    answer:
      `${BRAND.name} is available on iOS, Android, and the web. You can add it to your home screen for a native app experience.`,
  },
  {
    question: "What genres are available?",
    answer:
      "We currently offer series in Romance, Thriller, Drama, Comedy, Reality, Mystery, Sci-Fi, and Horror. New genres and series are added regularly.",
  },
  {
    question: `Who founded ${BRAND.name}?`,
    answer:
      `${BRAND.name} was founded by Alan Mruvka, co-founder of E! Entertainment Television. Our content is produced at Filmology Labs, a $250M production facility in Paterson, New Jersey with 21 soundstages and an LED volume wall.`,
  },
];

export const metadata: Metadata = {
  title: `Help & FAQ | ${BRAND.name}`,
  description:
    "Frequently asked questions about Verza TV. Learn about coins, VIP, episode pricing, season passes, supported devices, and more.",
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
          <p
            className="text-sm font-medium"
            style={{ color: T.text }}
          >
            support@verzatv.com
          </p>
        </div>
      </section>
    </>
  );
}
