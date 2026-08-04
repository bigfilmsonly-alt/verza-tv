import type { Metadata } from "next";
import Link from "next/link";
import { T } from "@/lib/theme";
import { BRAND } from "@/lib/config";

export const metadata: Metadata = {
  title: "Support",
  description:
    "Get help with VERZA TV playback, purchases, VIP subscriptions, refunds, and account questions.",
  alternates: { canonical: "/support" },
};

const faqs = [
  {
    q: "A video won't play or keeps buffering",
    a: "Check your connection first, then close and reopen the app or refresh the page. If a specific episode still won't play, email support@verzatv.com with the series name, episode number, device, and app or browser version.",
  },
  {
    q: "I paid to unlock a series but it's still locked",
    a: "Series Unlocks are tied to the authenticated account used at checkout. Sign in with that account and reopen the series. If it is still locked, email support@verzatv.com with the account email, series name, and transaction details so we can investigate without asking for full card information.",
  },
  {
    q: "How do I manage or cancel my VIP subscription?",
    a: "VIP renews automatically until cancelled. On a supported web or Android surface, open Profile and choose Manage Subscription to use the secure Stripe billing portal. Cancellation stops future renewals and access ordinarily continues through the paid period. You can also email support@verzatv.com for assistance.",
  },
  {
    q: "How do refunds work?",
    a: "See our Refund Policy, then email support@verzatv.com with your account email and transaction details. Direct VERZA TV purchases use Stripe; purchases completed after an Amazon handoff are governed by Amazon or the applicable seller's policy.",
  },
  {
    q: "How do I delete my account?",
    a: "Open Profile, choose Delete Account, and confirm. This permanently removes the account and associated profile, watch progress, saved list, and access entitlements. Completed financial records may be retained separately where required. You can also email privacy@verzatv.com for assistance.",
  },
  {
    q: "How do I report inappropriate content?",
    a: "Email support@verzatv.com with the series name, episode, and a short description. Please include enough detail for the team to locate and review the reported content.",
  },
];

export default function SupportPage() {
  return (
    <section className="px-4 pt-6 pb-12 max-w-2xl mx-auto">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm mb-6"
        style={{ color: T.textMute }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
        Back to Home
      </Link>

      <h1 className="text-2xl font-bold mb-2" style={{ color: T.text }}>
        Support
      </h1>
      <p className="text-sm mb-8" style={{ color: T.textDim }}>
        We&apos;re here to help. Most questions are answered below — for
        anything else, email our support team. The Service is intended for
        adults age 18 and older.
      </p>

      {/* Contact card */}
      <div
        className="rounded-xl p-4 mb-8"
        style={{ background: T.raised, border: `1px solid ${T.line}` }}
      >
        <p className="text-sm font-bold mb-1" style={{ color: T.text }}>
          Contact Support
        </p>
        <p className="text-sm mb-3" style={{ color: T.textDim }}>
          Include your account email and, for playback issues, the series and
          episode number.
        </p>
        <a
          href="mailto:support@verzatv.com"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold no-underline"
          style={{
            background: "linear-gradient(135deg, #E0115F, #8B5CF6)",
            color: "#fff",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
          support@verzatv.com
        </a>
      </div>

      {/* FAQs */}
      <h2 className="text-base font-semibold mb-4" style={{ color: T.text }}>
        Frequently Asked Questions
      </h2>
      <div className="flex flex-col gap-3 mb-10">
        {faqs.map((f) => (
          <details
            key={f.q}
            className="rounded-xl px-4 py-3"
            style={{ background: T.raised, border: `1px solid ${T.line}` }}
          >
            <summary
              className="text-sm font-semibold cursor-pointer select-none"
              style={{ color: T.text }}
            >
              {f.q}
            </summary>
            <p className="text-sm leading-relaxed mt-2" style={{ color: T.textDim }}>
              {f.a}
            </p>
          </details>
        ))}
      </div>

      {/* Legal links */}
      <h2 className="text-base font-semibold mb-3" style={{ color: T.text }}>
        Policies
      </h2>
      <div className="flex flex-col gap-2 mb-10">
        {[
          { label: "Privacy Policy", href: "/privacy" },
          { label: "Terms of Service", href: "/terms" },
          { label: "Refund Policy", href: "/refund-policy" },
          { label: "Contact Directory", href: "/contact" },
        ].map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="text-sm no-underline"
            style={{ color: T.accent }}
          >
            {l.label} →
          </Link>
        ))}
      </div>

      {/* Company info */}
      <p className="text-xs leading-relaxed" style={{ color: T.textMute }}>
        VERZA TV LLC · 650 E Palisade Ave, Ste 2329 · Englewood Cliffs, NJ
        07632 · United States
        <br />
        {BRAND.domain} · For privacy requests:{" "}
        <a href="mailto:privacy@verzatv.com" style={{ color: T.accent }}>
          privacy@verzatv.com
        </a>{" "}
        · For legal:{" "}
        <a href="mailto:legal@verzatv.com" style={{ color: T.accent }}>
          legal@verzatv.com
        </a>
      </p>
    </section>
  );
}
