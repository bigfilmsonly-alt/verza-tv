import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import { faqSchema } from "@/lib/schemas";

const FAQ_ITEMS = [
  {
    question: "What is Verza TV?",
    answer:
      "Verza TV is the first US-based vertical micro-drama streaming platform. We offer 80+ original series with episodes that run 60 to 120 seconds each, designed for phone-first viewing in vertical 9:16 format.",
  },
  {
    question: "Is Verza TV free?",
    answer:
      "The first 5 episodes of every series are completely free. After that, you can unlock additional episodes using coins, or subscribe to VIP for unlimited access.",
  },
  {
    question: "What are coins?",
    answer:
      "Coins are the in-app currency used to unlock premium episodes. You can purchase coin packs starting at $1.99 for 100 coins. Bonus coins are included with larger packs. Coins never expire.",
  },
  {
    question: "How much does an episode cost?",
    answer:
      "Most episodes cost 49 coins to unlock. Season passes are also available at roughly 67% off the total episode-by-episode price.",
  },
  {
    question: "What is VIP?",
    answer:
      "VIP is our premium subscription tier. VIP members get unlimited access to all episodes across every series, plus early access to new releases. Weekly ($19.99) and yearly ($199.00) plans are available.",
  },
  {
    question: "What devices are supported?",
    answer:
      "Verza TV is available on iOS, Android, and the web. Your library, coin balance, and watch history sync across all devices when you are signed in.",
  },
  {
    question: "How long are episodes?",
    answer:
      "Each episode runs between 60 and 120 seconds. They are designed to be binge-watched in vertical format on your phone.",
  },
  {
    question: "What genres are available?",
    answer:
      "We currently offer series in Romance, Thriller, Drama, Comedy, Reality, Mystery, Sci-Fi, and Horror. New genres and series are added regularly.",
  },
  {
    question: "Can I create my own micro-drama?",
    answer:
      "Verza Studio (coming soon) will let creators write, produce, and publish their own micro-dramas using AI-powered tools. Stay tuned for announcements.",
  },
  {
    question: "Who founded Verza TV?",
    answer:
      "Verza TV was founded by Alan Mruvka, co-founder of E! Entertainment Television. Our content is produced at Filmology Labs, a $250M production facility in Paterson, New Jersey.",
  },
];

export const metadata: Metadata = {
  title: "Help & FAQ | Verza TV",
  description:
    "Frequently asked questions about Verza TV. Learn about coins, VIP, episode pricing, supported devices, and more.",
};

export default function HelpPage() {
  return (
    <>
      <JsonLd data={faqSchema(FAQ_ITEMS)} />

      <section className="px-4 pt-6 pb-8">
        <h1
          className="text-2xl font-bold mb-2"
          style={{ color: "#F5F4F8" }}
        >
          Help &amp; FAQ
        </h1>
        <p className="text-sm mb-8" style={{ color: "#6B6B7B" }}>
          Everything you need to know about Verza TV.
        </p>

        <div className="flex flex-col gap-3">
          {FAQ_ITEMS.map((item, i) => (
            <details
              key={i}
              className="group rounded-xl"
              style={{
                background: "#12121C",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <summary
                className="flex items-center justify-between px-4 py-3.5 cursor-pointer list-none"
                style={{ color: "#F5F4F8" }}
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
                  stroke="#6B6B7B"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </summary>
              <div
                className="px-4 pb-4 text-sm leading-relaxed"
                style={{ color: "#A0A0B0" }}
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
            background: "#12121C",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <p className="text-sm mb-1" style={{ color: "#A0A0B0" }}>
            Still have questions?
          </p>
          <p
            className="text-sm font-medium"
            style={{ color: "#F5F4F8" }}
          >
            support@verzatv.com
          </p>
        </div>
      </section>
    </>
  );
}
