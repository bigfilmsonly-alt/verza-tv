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
      `The first ${FREE_EPISODES} episodes of every series are completely free. After that, you can unlock additional episodes using coins, or subscribe to VIP for unlimited access.`,
  },
  {
    question: "How do coins work?",
    answer:
      `Coins are the in-app currency used to unlock premium episodes. You can purchase coin packs starting at $1.99 for 100 coins. Larger packs include bonus coins. Coins never expire and can be used on any series.`,
  },
  {
    question: "How much does an episode cost?",
    answer:
      `Most episodes cost ${DEFAULT_COIN_PER_EPISODE} coins to unlock. Season passes are also available at roughly 33% off the total episode-by-episode price, so you can binge an entire series for less.`,
  },
  {
    question: "What is a season pass?",
    answer:
      `A season pass unlocks every paid episode in a series at a discounted rate -- typically about 33% off what you would pay episode by episode. Once purchased, all current and future episodes in that series are yours to watch anytime.`,
  },
  {
    question: "What is VIP?",
    answer:
      `VIP is the premium subscription tier. VIP members get unlimited access to all episodes across every series, plus early access to new releases. Plans are available weekly (${formatPrice(VIP_WEEKLY)}) and yearly (${formatPrice(VIP_YEARLY)}).`,
  },
  {
    question: "How do I watch free episodes?",
    answer:
      `Just open any series and start watching. The first ${FREE_EPISODES} episodes are always free -- no account or coins required. After the free episodes, you will see a prompt to unlock the next episode with coins.`,
  },
  {
    question: "What devices are supported?",
    answer:
      `${BRAND.name} is available on iOS, Android, and the web. Your library, coin balance, and watch history sync across all devices when you are signed in.`,
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
