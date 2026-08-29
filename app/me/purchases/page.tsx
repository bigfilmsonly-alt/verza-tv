import type { Metadata } from "next";
import Link from "next/link";
import { T } from "@/lib/theme";
import PurchaseHistoryList from "@/components/PurchaseHistoryList";

export const metadata: Metadata = {
  title: "Purchase History",
  description: "The Series Unlocks attached to your VERZA TV account.",
  // Account-only page. Nothing here is for a crawler, and the list is
  // per-account, so it must never enter a shared cache or an index.
  robots: { index: false, follow: false },
};

const arrowLeft = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

export default function PurchaseHistoryPage() {
  return (
    <section className="max-w-lg mx-auto pb-10">
      <div className="flex items-center gap-3 px-4 pt-5 pb-4">
        <Link
          href="/me"
          className="flex items-center justify-center w-9 h-9 rounded-full no-underline transition-colors"
          style={{ color: T.text, background: `${T.text}0A` }}
          aria-label="Back to profile"
        >
          {arrowLeft}
        </Link>
        <h1 className="text-lg font-bold" style={{ color: T.text }}>
          Purchase History
        </h1>
      </div>

      <div className="px-4">
        <PurchaseHistoryList />
      </div>

      <p className="px-6 pt-8 text-[11px] leading-relaxed text-center" style={{ color: T.textMute }}>
        A Series Unlock is permanent and attached to your account. If something
        you bought is missing here, email support@verzatv.com with the email you
        used at checkout.
      </p>
    </section>
  );
}
