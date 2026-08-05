import type { Metadata } from "next";
import Link from "next/link";
import { T } from "@/lib/theme";
import { BRAND } from "@/lib/config";

export const metadata: Metadata = {
  title: "Refund Policy",
  description:
    "Refund Policy for VERZA TV Series Unlocks, VIP subscriptions, and merchandise orders.",
  alternates: { canonical: "/refund-policy" },
};

const LAST_UPDATED = "August 5, 2026";

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
            practices regarding Series Unlocks, VIP subscriptions, and direct
            merchandise orders. Apple bills and administers Series Unlocks
            purchased in the iPhone or iPad app. Other supported purchase
            surfaces are billed directly by {BRAND.name} through Stripe. This
            policy does not limit rights that cannot be waived under applicable
            law.
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
              Series Unlock purchases are generally final once paid content in
              the series has been streamed, except as required by law or where
              a verified billing or access error occurred.
            </p>
          </div>
          <p className="text-sm leading-relaxed" style={bodyText}>
            A Series Unlock is a one-time payment for account access to the
            available paid episodes of the series identified at checkout. If
            you were charged in error, charged more than once for the same
            series, or cannot access content you paid for, contact{" "}
            <a href="mailto:support@verzatv.com" style={{ color: T.accent }}>
              support@verzatv.com
            </a>{" "}
            promptly with the account email, series title, and transaction
            details. We will investigate and, where appropriate, restore access,
            correct the charge, or issue a refund.
          </p>
          <p className="text-sm leading-relaxed mt-3" style={bodyText}>
            A partial refund does not ordinarily remove the Series Unlock. A
            full refund ends access granted by that purchase when the refund is
            processed. This does not affect episodes that are otherwise free or
            access obtained through a separate valid purchase or membership.
          </p>
          <p className="text-sm leading-relaxed mt-3" style={bodyText}>
            Apple decides refund requests for Apple in-app purchases. Request
            an Apple refund at{" "}
            <a
              href="https://reportaproblem.apple.com/"
              rel="noopener noreferrer"
              style={{ color: T.accent }}
            >
              reportaproblem.apple.com
            </a>{" "}
            or through Apple Support. VERZA cannot issue or guarantee an Apple refund, but we
            can investigate access, verification, and account-linking problems.
            Before buying again, use Restore Purchases while signed in to the
            original VERZA account when it still exists. If it was permanently
            deleted, an Apple-verified orphaned purchase may be reclaimed to the
            current account; a purchase linked to another live VERZA account
            cannot transfer.
          </p>
        </div>

        {/* 2. VIP Subscription Cancellations */}
        <div>
          <h2 className="text-base font-semibold mb-2" style={sectionHeading}>
            2. VIP Subscription Cancellations
          </h2>
          <div className="flex flex-col gap-3">
            <p className="text-sm leading-relaxed" style={bodyText}>
              You may cancel VIP at any time through the secure Stripe billing
              portal available from your Profile on supported surfaces. You may
              also contact support@verzatv.com for assistance. Cancellation
              stops future renewals; access ordinarily continues through the
              paid billing period.
            </p>
            <p className="text-sm leading-relaxed" style={bodyText}>
              Cancelling a subscription does not by itself refund a completed
              billing period. If a renewal was duplicated, unauthorized, or
              billed after a confirmed cancellation, contact us promptly so we
              can investigate. Refunds required by applicable law remain
              available.
            </p>
            <p className="text-sm leading-relaxed" style={bodyText}>
              A partial refund does not ordinarily end the current VIP period.
              A full refund of a VIP billing period ends VIP access and cancels
              the matching subscription to prevent another renewal.
            </p>
          </div>
        </div>

        {/* 3. Merchandise and Amazon Purchases */}
        <div>
          <h2 className="text-base font-semibold mb-2" style={sectionHeading}>
            3. Merchandise and Amazon Purchases
          </h2>
          <p className="text-sm leading-relaxed" style={bodyText}>
            For physical merchandise purchased directly from {BRAND.name},
            contact support with your order number before sending an item back.
            Eligibility depends on fulfillment status, item condition, the
            checkout terms, and applicable law. Products purchased after an
            Amazon handoff are sold and fulfilled by Amazon or the identified
            seller; their return and refund policy applies.
          </p>
        </div>

        {/* 4. Billing and Technical Errors */}
        <div>
          <h2 className="text-base font-semibold mb-2" style={sectionHeading}>
            4. Billing and Technical Errors
          </h2>
          <p className="text-sm leading-relaxed" style={bodyText}>
            We review reports of duplicate or unauthorized charges, incorrect
            amounts, and paid content that remains inaccessible. Contact our
            support team with your account email, transaction details, and a
            description of the issue. Do not send full payment-card details by
            email.
          </p>
        </div>

        {/* 5. Payment Disputes */}
        <div>
          <h2 className="text-base font-semibold mb-2" style={sectionHeading}>
            5. Payment Disputes and Chargebacks
          </h2>
          <p className="text-sm leading-relaxed" style={bodyText}>
            Access tied to a payment may be suspended or removed when a bank or
            payment provider reports a chargeback, refund, or revocation. A
            lost chargeback ends the matching Series Unlock or VIP access; a
            lost VIP chargeback also cancels the matching subscription. If the
            provider later reports the transaction as valid and active, access
            is restored only when the original product and account association
            remain valid. Contact support first when possible so we can
            investigate billing or access errors promptly. Nothing in this
            section limits non-waivable rights.
          </p>
        </div>

        {/* 6. Contact */}
        <div>
          <h2 className="text-base font-semibold mb-2" style={sectionHeading}>
            6. Contact
          </h2>
          <p className="text-sm leading-relaxed" style={bodyText}>
            For any questions about this Refund Policy or to submit a refund
            request, please contact us at{" "}
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
