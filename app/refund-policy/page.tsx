import type { Metadata } from "next";
import Link from "next/link";
import { T } from "@/lib/theme";
import { BRAND } from "@/lib/config";

export const metadata: Metadata = {
  title: `Refund Policy | ${BRAND.name}`,
  description:
    "Refund Policy for VERZA TV. Learn about our policies on series unlock refunds, in-app purchase refunds, and VIP subscription cancellations.",
  alternates: { canonical: "/refund-policy" },
};

const LAST_UPDATED = "July 10, 2026";

const sectionHeading = {
  color: T.text,
};

const bodyText = {
  color: T.textDim,
};

export default function RefundPolicyPage() {
  return (
    <section className="px-4 pt-6 pb-12 max-w-2xl mx-auto">
      <Link
        href="/"
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
        Back to Home
      </Link>

      <h1
        className="text-2xl font-bold mb-2"
        style={{ color: T.text }}
      >
        Refund Policy
      </h1>
      <p className="text-sm mb-8" style={{ color: T.textMute }}>
        Last updated: {LAST_UPDATED}
      </p>

      <div className="flex flex-col gap-8">
        {/* Overview */}
        <div>
          <p className="text-sm leading-relaxed" style={bodyText}>
            Thank you for using {BRAND.name}. This Refund Policy explains our
            practices regarding refunds for Series Unlock purchases, in-app
            purchases, and VIP subscription cancellations. By making a purchase through the
            Service, you agree to this policy.
          </p>
        </div>

        {/* 1. Series Unlock Purchases */}
        <div>
          <h2 className="text-base font-semibold mb-2" style={sectionHeading}>
            1. Series Unlock Purchases
          </h2>
          <div
            className="rounded-xl p-4 mb-3"
            style={{
              background: `${T.accent}11`,
              border: `1px solid ${T.accent}33`,
            }}
          >
            <p
              className="text-sm font-medium leading-relaxed"
              style={{ color: T.text }}
            >
              Series Unlock purchases are final and non-refundable once any
              locked episode of that series has been streamed, except as
              required by applicable law.
            </p>
          </div>
          <p className="text-sm leading-relaxed" style={bodyText}>
            A Series Unlock is a one-time payment that permanently unlocks
            every episode of a specific series for your account. If you were
            charged in error, were charged more than once for the same series,
            or cannot access content you paid for, contact{" "}
            <a href="mailto:support@verzatv.com" style={{ color: T.accent }}>
              support@verzatv.com
            </a>{" "}
            within 14 days of purchase and we will make it right — including a
            full refund where appropriate.
          </p>
        </div>

        {/* 2. In-App Purchase Refunds */}
        <div>
          <h2 className="text-base font-semibold mb-2" style={sectionHeading}>
            2. App Store Purchases (where offered)
          </h2>
          <div className="flex flex-col gap-3">
            <p className="text-sm leading-relaxed" style={bodyText}>
              If you made a purchase through the Apple App Store or Google Play
              Store, the refund process is managed by the respective platform.
              {BRAND.name} does not have the ability to process refunds for
              in-app purchases made through these stores.
            </p>
            <div>
              <h3
                className="text-sm font-medium mb-1"
                style={{ color: T.text }}
              >
                Apple App Store
              </h3>
              <p className="text-sm leading-relaxed" style={bodyText}>
                To request a refund for an iOS purchase, visit{" "}
                <a
                  href="https://reportaproblem.apple.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: T.accent }}
                >
                  reportaproblem.apple.com
                </a>{" "}
                or contact Apple Support directly. Apple reviews and processes
                all refund requests at their discretion.
              </p>
            </div>
            <div>
              <h3
                className="text-sm font-medium mb-1"
                style={{ color: T.text }}
              >
                Google Play Store
              </h3>
              <p className="text-sm leading-relaxed" style={bodyText}>
                To request a refund for an Android purchase, visit the{" "}
                <a
                  href="https://support.google.com/googleplay/answer/2479637"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: T.accent }}
                >
                  Google Play refund page
                </a>{" "}
                or contact Google Play Support. Google reviews and processes
                all refund requests at their discretion.
              </p>
            </div>
          </div>
        </div>

        {/* 3. VIP Subscription Cancellations */}
        <div>
          <h2 className="text-base font-semibold mb-2" style={sectionHeading}>
            3. VIP Subscription Cancellations
          </h2>
          <div className="flex flex-col gap-3">
            <p className="text-sm leading-relaxed" style={bodyText}>
              You may cancel your VIP subscription at any time. Upon
              cancellation:
            </p>
            <ul className="list-disc pl-5 flex flex-col gap-1.5">
              <li className="text-sm leading-relaxed" style={bodyText}>
                You will continue to have VIP access for the remainder of your
                current billing period.
              </li>
              <li className="text-sm leading-relaxed" style={bodyText}>
                No refund will be issued for the current billing period,
                whether partial or full.
              </li>
              <li className="text-sm leading-relaxed" style={bodyText}>
                Future billing will stop automatically at the end of the
                current period.
              </li>
              <li className="text-sm leading-relaxed" style={bodyText}>
                After your VIP access expires, you will revert to a free
                account and keep access to any series you previously purchased
                with a one-time Series Unlock.
              </li>
            </ul>
            <p className="text-sm leading-relaxed" style={bodyText}>
              To cancel your subscription, open your Profile page and tap
              Manage Subscription — this opens your secure Stripe billing
              portal where you can cancel or change your plan. You can also
              email support@verzatv.com and we will process the cancellation
              the same day.
            </p>
          </div>
        </div>

        {/* 4. Exceptional Circumstances */}
        <div>
          <h2 className="text-base font-semibold mb-2" style={sectionHeading}>
            4. Exceptional Circumstances
          </h2>
          <p className="text-sm leading-relaxed" style={bodyText}>
            In rare cases involving technical errors, unauthorized transactions,
            or duplicate charges, we may review refund requests on a
            case-by-case basis. To submit a request, contact our support team
            with your account email, transaction details, and a description of
            the issue.
          </p>
        </div>

        {/* 5. Contact */}
        <div>
          <h2 className="text-base font-semibold mb-2" style={sectionHeading}>
            5. Contact
          </h2>
          <p className="text-sm leading-relaxed" style={bodyText}>
            For any questions about this Refund Policy or to submit a refund
            request for exceptional circumstances, please contact us at{" "}
            <a href="mailto:support@verzatv.com" style={{ color: T.accent }}>
              support@verzatv.com
            </a>
            .
          </p>
        </div>
      </div>

      {/* Footer */}
      <div
        className="rounded-xl p-4 mt-10 text-center"
        style={{
          background: T.surface,
          border: `1px solid ${T.line}`,
        }}
      >
        <p className="text-xs" style={{ color: T.textMute }}>
          {BRAND.name} &middot; {BRAND.domain} &middot; {LAST_UPDATED}
        </p>
      </div>
    </section>
  );
}
