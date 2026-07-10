import type { Metadata } from "next";
import Link from "next/link";
import { T } from "@/lib/theme";
import { BRAND } from "@/lib/config";

export const metadata: Metadata = {
  title: `Support | ${BRAND.name}`,
  description:
    "Get help with VERZA TV — playback issues, purchases, VIP subscriptions, refunds, and account questions. We respond within 1 business day.",
  alternates: { canonical: "/support" },
};

const faqs = [
  {
    q: "A video won't play or keeps buffering",
    a: "Check your connection first — streaming needs a stable network. Then close and reopen the app (or refresh the page). If a specific episode still won't play, email support@verzatv.com with the series name and episode number and we'll fix it fast.",
  },
  {
    q: "I paid to unlock a series but it's still locked",
    a: "Your unlock is tied to your account (or to this device for guest purchases). Make sure you're signed in with the same email you used at checkout, then reopen the series. If it's still locked, email support@verzatv.com with your checkout email and the series name — we'll restore access right away.",
  },
  {
    q: "How do I manage or cancel my VIP subscription?",
    a: "VIP renews automatically until cancelled. To cancel or change your plan, contact support@verzatv.com from your account email and we'll process it same-day — you keep VIP access until the end of the paid period. If you subscribed through the App Store, manage it in your device's Settings → Apple ID → Subscriptions.",
  },
  {
    q: "How do refunds work?",
    a: "See our Refund Policy for full details. Purchases made through the App Store are refunded by Apple (reportaproblem.apple.com); purchases made on verzatv.com are handled by us — email support@verzatv.com.",
  },
  {
    q: "How do I delete my account?",
    a: "Open your Profile page and tap Delete Account (bottom of the page), then confirm. This permanently removes your account, watch history, saved list, and access to purchases, and cannot be undone. You can also email privacy@verzatv.com and we'll process the deletion within 30 days.",
  },
  {
    q: "How do I report inappropriate content?",
    a: "Email support@verzatv.com with the series name, episode, and a short description. Reports are reviewed within 24 hours.",
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
        anything else, email us and we&apos;ll respond within 1 business day.
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
        {BRAND.name} · {BRAND.domain} · For privacy requests:{" "}
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
