import type { Metadata } from "next";
import Link from "next/link";
import { T } from "@/lib/theme";
import { BRAND } from "@/lib/config";

export const metadata: Metadata = {
  title: `Privacy Policy | ${BRAND.name}`,
  description:
    "Privacy Policy for VERZA TV. Learn how we collect, use, and protect your personal information.",
  alternates: { canonical: "/privacy" },
};

const LAST_UPDATED = "August 3, 2026";

const sectionHeading = {
  color: T.text,
};

const bodyText = {
  color: T.textDim,
};

export default function PrivacyPage() {
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
        Privacy Policy
      </h1>
      <p className="text-sm mb-8" style={{ color: T.textMute }}>
        Last updated: {LAST_UPDATED}
      </p>

      <div className="flex flex-col gap-8">
        {/* Introduction */}
        <div>
          <p className="text-sm leading-relaxed" style={bodyText}>
            VERZA TV LLC, doing business as {BRAND.name} (&quot;we,&quot;
            &quot;us,&quot; or &quot;our&quot;), is committed to protecting your
            privacy. This Privacy Policy explains how we collect, use,
            disclose, and safeguard your information when you use our mobile
            application, website, and related services (collectively, the
            &quot;Service&quot;). Please read this policy carefully so you
            understand our practices and the choices available to you.
          </p>
        </div>

        {/* 1. Information We Collect */}
        <div>
          <h2 className="text-base font-semibold mb-2" style={sectionHeading}>
            1. Information We Collect
          </h2>
          <div className="flex flex-col gap-3">
            <div>
              <h3
                className="text-sm font-medium mb-1"
                style={{ color: T.text }}
              >
                Information You Provide
              </h3>
              <ul className="list-disc pl-5 flex flex-col gap-1.5">
                <li className="text-sm leading-relaxed" style={bodyText}>
                  <strong style={{ color: T.text }}>Account Information:</strong>{" "}
                  Display name, email address, authentication credentials, and
                  profile details when you create or use an account.
                </li>
                <li className="text-sm leading-relaxed" style={bodyText}>
                  <strong style={{ color: T.text }}>Purchase Information:</strong>{" "}
                  Transaction and entitlement details related to Series
                  Unlocks, VIP subscriptions, and physical merchandise.
                  Payment card information is entered with Stripe outside the
                  native app and is not stored on our servers. Limited legacy
                  purchase-recovery records may remain keyed to the checkout
                  email when a historical purchase was never linked to an
                  authenticated account. For VIP, we also retain the accepted
                  Terms version and provider identifiers, plus a delivery
                  record for required billing notices. That notice record uses
                  a one-way digest of the recipient email rather than storing
                  the address again.
                </li>
                <li className="text-sm leading-relaxed" style={bodyText}>
                  <strong style={{ color: T.text }}>Communications:</strong>{" "}
                  Information you provide when contacting customer support or
                  communicating with us.
                </li>
                <li className="text-sm leading-relaxed" style={bodyText}>
                  <strong style={{ color: T.text }}>Creator Information:</strong>{" "}
                  If you apply to the Creator Program, information in your
                  application and materials you choose to submit, such as
                  contact details, portfolio links, project information, and
                  payout details.
                </li>
              </ul>
            </div>
            <div>
              <h3
                className="text-sm font-medium mb-1"
                style={{ color: T.text }}
              >
                Information Collected Automatically
              </h3>
              <ul className="list-disc pl-5 flex flex-col gap-1.5">
                <li className="text-sm leading-relaxed" style={bodyText}>
                  <strong style={{ color: T.text }}>Device Information:</strong>{" "}
                  Device type, operating system, app or browser version, IP
                  address, request timestamps, and diagnostic information
                  generated when the Service is used.
                </li>
                <li className="text-sm leading-relaxed" style={bodyText}>
                  <strong style={{ color: T.text }}>Usage Data:</strong>{" "}
                  Watch progress, saved titles, episodes viewed, interactions,
                  and, on the website and Android app, search and feature-usage
                  events. The iOS app does not create a persistent analytics
                  identifier or send first-party analytics events.
                </li>
                <li className="text-sm leading-relaxed" style={bodyText}>
                  <strong style={{ color: T.text }}>Log Data:</strong> Browser
                  type, referring page, request and error records, and security
                  logs created by our hosting and service providers.
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* 2. How We Use Your Information */}
        <div>
          <h2 className="text-base font-semibold mb-2" style={sectionHeading}>
            2. How We Use Your Information
          </h2>
          <ul className="list-disc pl-5 flex flex-col gap-1.5">
            <li className="text-sm leading-relaxed" style={bodyText}>
              Provide, maintain, and improve the Service.
            </li>
            <li className="text-sm leading-relaxed" style={bodyText}>
              Process transactions and manage your account, entitlements, and
              subscription status.
            </li>
            <li className="text-sm leading-relaxed" style={bodyText}>
              Sync your saved list and watch progress across signed-in devices.
            </li>
            <li className="text-sm leading-relaxed" style={bodyText}>
              Send you transactional communications (purchase receipts, account
              notifications) and, with your consent, promotional messages.
            </li>
            <li className="text-sm leading-relaxed" style={bodyText}>
              On the website and Android app, analyze usage patterns to improve
              content and features.
            </li>
            <li className="text-sm leading-relaxed" style={bodyText}>
              Detect, prevent, and address fraud, abuse, and security issues.
            </li>
            <li className="text-sm leading-relaxed" style={bodyText}>
              Comply with legal obligations.
            </li>
          </ul>
        </div>

        {/* 3. How We Share Your Information */}
        <div>
          <h2 className="text-base font-semibold mb-2" style={sectionHeading}>
            3. How We Share Your Information
          </h2>
          <p className="text-sm leading-relaxed mb-3" style={bodyText}>
            We do not sell your personal information for money. Our website may
            use advertising technologies that qualify as &quot;sharing&quot; for
            cross-context behavioral advertising under some laws; the native
            iOS app does not use data for tracking across other companies&apos;
            apps or websites. We disclose information in the following limited
            circumstances:
          </p>
          <ul className="list-disc pl-5 flex flex-col gap-1.5">
            <li className="text-sm leading-relaxed" style={bodyText}>
              <strong style={{ color: T.text }}>Service Providers:</strong>{" "}
              With third-party vendors who assist in operating the Service.
              These currently include: <strong style={{ color: T.text }}>Stripe</strong>{" "}
              (external checkout and payment processing),{" "}
              <strong style={{ color: T.text }}>Supabase</strong> (account
              authentication and database hosting),{" "}
              <strong style={{ color: T.text }}>Mux</strong> (video delivery and
              playback operations), <strong style={{ color: T.text }}>Vercel</strong>{" "}
              (website and API hosting and performance),{" "}
              <strong style={{ color: T.text }}>Google</strong> (website-only
              analytics and advertising),{" "}
              and <strong style={{ color: T.text }}>Resend</strong>{" "}
              (transactional email delivery). We require service providers to protect personal data
              consistently with this policy and applicable law and to process
              it only for the services they provide to us.
            </li>
            <li className="text-sm leading-relaxed" style={bodyText}>
              <strong style={{ color: T.text }}>Legal Requirements:</strong>{" "}
              When required by law, regulation, legal process, or government
              request.
            </li>
            <li className="text-sm leading-relaxed" style={bodyText}>
              <strong style={{ color: T.text }}>Protection of Rights:</strong>{" "}
              To protect the rights, property, or safety of {BRAND.name}, our
              users, or others.
            </li>
            <li className="text-sm leading-relaxed" style={bodyText}>
              <strong style={{ color: T.text }}>Business Transfers:</strong>{" "}
              In connection with a merger, acquisition, reorganization, or sale
              of assets.
            </li>
          </ul>
        </div>

        {/* 4. Cookies & Analytics */}
        <div>
          <h2 className="text-base font-semibold mb-2" style={sectionHeading}>
            4. Cookies &amp; Analytics
          </h2>
          <p className="text-sm leading-relaxed" style={bodyText}>
            The website uses cookies, local storage, pixels, and analytics
            technologies to maintain sessions, remember preferences, measure
            usage, and support advertising. You can manage these technologies
            through your browser and applicable privacy controls, although
            disabling required storage can affect account features. The Android
            app sends limited first-party analytics events to our own API. The
            iOS app does not send those analytics events and does not load
            Google analytics or advertising SDKs.
          </p>
        </div>

        {/* 5. Data Security */}
        <div>
          <h2 className="text-base font-semibold mb-2" style={sectionHeading}>
            5. Data Security
          </h2>
          <p className="text-sm leading-relaxed" style={bodyText}>
            We implement commercially reasonable technical and organizational
            measures to protect your personal information against unauthorized
            access, alteration, disclosure, or destruction. However, no method
            of transmission over the Internet or electronic storage is 100%
            secure, and we cannot guarantee absolute security.
          </p>
        </div>

        {/* 6. Adults-only service */}
        <div>
          <h2 className="text-base font-semibold mb-2" style={sectionHeading}>
            6. Adults-Only Service
          </h2>
          <p className="text-sm leading-relaxed" style={bodyText}>
            The Service is intended only for adults age 18 and older and is not
            directed to children or minors. We do not knowingly collect
            personal information from anyone under 18. If we learn that an
            underage person provided personal information, we will take
            appropriate steps to delete it and disable the associated account,
            subject to applicable law. If you believe an underage person has
            provided information to us, contact us at{" "}
            <a href="mailto:privacy@verzatv.com" style={{ color: T.accent }}>
              privacy@verzatv.com
            </a>
            , or by mail at VERZA TV LLC, 650 E Palisade Ave, Ste 2329,
            Englewood Cliffs, NJ 07632, United States.
          </p>
        </div>

        {/* 7. Your Rights */}
        <div>
          <h2 className="text-base font-semibold mb-2" style={sectionHeading}>
            7. Your Rights
          </h2>
          <div className="flex flex-col gap-3">
            <div>
              <h3
                className="text-sm font-medium mb-1"
                style={{ color: T.text }}
              >
                California Residents (CCPA)
              </h3>
              <p className="text-sm leading-relaxed" style={bodyText}>
                If you are a California resident, you have the right to: request
                disclosure of the categories and specific pieces of personal
                information we have collected; request deletion of your
                personal information; opt out of the sale of personal
                information; and opt out of qualifying &quot;sharing&quot; for
                cross-context behavioral advertising (see Section 12). To exercise
                these rights, contact us at{" "}
                <a
                  href="mailto:privacy@verzatv.com"
                  style={{ color: T.accent }}
                >
                  privacy@verzatv.com
                </a>
                .
              </p>
            </div>
            <div>
              <h3
                className="text-sm font-medium mb-1"
                style={{ color: T.text }}
              >
                European Users (GDPR)
              </h3>
              <p className="text-sm leading-relaxed" style={bodyText}>
                If you are located in the European Economic Area, you have
                rights under the General Data Protection Regulation including:
                the right to access, rectify, or erase your personal data; the
                right to restrict or object to processing; the right to data
                portability; and the right to withdraw consent. To exercise
                these rights, contact us at{" "}
                <a
                  href="mailto:privacy@verzatv.com"
                  style={{ color: T.accent }}
                >
                  privacy@verzatv.com
                </a>
                .
              </p>
            </div>
          </div>
        </div>

        {/* 8. Data Retention */}
        <div>
          <h2 className="text-base font-semibold mb-2" style={sectionHeading}>
            8. Data Retention
          </h2>
          <p className="text-sm leading-relaxed" style={bodyText}>
            Account, entitlement, saved-list, and watch-progress information is
            retained while your account is active or as needed to provide the
            Service. Operational and analytics records are retained only as
            reasonably needed for security, reliability, and business
            analysis. We may retain completed transaction records as required
            for tax, accounting, dispute, fraud-prevention, and subscription
            consent/notice-compliance purposes. When information is no longer
            needed, we delete or anonymize it. Legacy
            unlinked purchase-recovery records may be retained for support and
            fraud prevention until ownership is independently verified or the
            record is no longer needed.
          </p>
        </div>

        {/* 9. Third-Party Links */}
        <div>
          <h2 className="text-base font-semibold mb-2" style={sectionHeading}>
            9. Third-Party Links
          </h2>
          <p className="text-sm leading-relaxed" style={bodyText}>
            The Service may contain links to third-party websites or services
            that are not owned or controlled by {BRAND.name}, including Amazon
            affiliate links. Those links may contain our affiliate tag. After
            you leave the Service, the third party&apos;s own privacy terms apply;
            we encourage you to review them before providing information.
          </p>
        </div>

        {/* 10. Account Deletion */}
        <div>
          <h2 className="text-base font-semibold mb-2" style={sectionHeading}>
            10. Account &amp; Data Deletion
          </h2>
          <p className="text-sm leading-relaxed" style={bodyText}>
            You can permanently delete your account at any time from within the
            Service: open your <strong style={{ color: T.text }}>Profile</strong>{" "}
            page and tap <strong style={{ color: T.text }}>Delete Account</strong>.
            Deletion removes your authentication account, profile, watch
            history, saved list, browser notification subscriptions, analytics
            records tied to your user ID, and access entitlements, and cannot be
            undone. You may also request assistance by emailing{" "}
            <a href="mailto:privacy@verzatv.com" style={{ color: T.accent }}>
              privacy@verzatv.com
            </a>{" "}
            from your account email. Records of completed financial
            transactions and required subscription consent/notice evidence may
            be retained, separated from the deleted account, where required for
            tax, accounting, dispute, fraud-prevention, or legal-compliance
            purposes. Deleting an authenticated account does not automatically
            delete a separate legacy recovery record that is keyed only to a
            checkout email and has never been linked to that account. To claim
            or delete such a record, contact us so we can independently verify
            the purchase or mailbox before changing it.
          </p>
        </div>

        {/* 11. Browser Notifications */}
        <div>
          <h2 className="text-base font-semibold mb-2" style={sectionHeading}>
            11. Browser Notifications
          </h2>
          <p className="text-sm leading-relaxed" style={bodyText}>
            The website may offer browser notifications only after you grant
            permission. You can withdraw permission through your browser or
            Profile settings. The native iOS app does not register for or send
            push notifications.
          </p>
        </div>

        {/* 12. Advertising & Tracking */}
        <div>
          <h2 className="text-base font-semibold mb-2" style={sectionHeading}>
            12. Advertising &amp; Tracking
          </h2>
          <p className="text-sm leading-relaxed" style={bodyText}>
            The Service identifies sponsored Amazon products and uses an
            affiliate tag on outbound Amazon links. The native iOS app does not
            use advertising SDKs or data to track you across other companies&apos;
            apps or websites. The website may use third-party advertising and
            analytics technologies. We do not sell personal information for
            money; where applicable, you may request to opt out of qualifying
            cross-context behavioral advertising by emailing{" "}
            <a href="mailto:privacy@verzatv.com" style={{ color: T.accent }}>
              privacy@verzatv.com
            </a>
            .
          </p>
        </div>

        {/* 13. Changes to This Policy */}
        <div>
          <h2 className="text-base font-semibold mb-2" style={sectionHeading}>
            13. Changes to This Policy
          </h2>
          <p className="text-sm leading-relaxed" style={bodyText}>
            We may update this Privacy Policy from time to time. If we make
            material changes, we will update the date above and provide notice
            through the Service or by other means when required.
          </p>
        </div>

        {/* 14. Contact */}
        <div>
          <h2 className="text-base font-semibold mb-2" style={sectionHeading}>
            14. Contact
          </h2>
          <p className="text-sm leading-relaxed" style={bodyText}>
            If you have any questions or concerns about this Privacy Policy or
            our data practices, please contact us at{" "}
            <a href="mailto:privacy@verzatv.com" style={{ color: T.accent }}>
              privacy@verzatv.com
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
