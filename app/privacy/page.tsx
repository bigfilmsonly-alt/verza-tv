{/* DRAFT — flagged for legal review */}
import type { Metadata } from "next";
import Link from "next/link";
import { T } from "@/lib/theme";
import { BRAND } from "@/lib/config";

export const metadata: Metadata = {
  title: `Privacy Policy | ${BRAND.name}`,
  description:
    "Privacy Policy for Verza TV. Learn how we collect, use, and protect your personal information.",
  alternates: { canonical: "/privacy" },
};

const LAST_UPDATED = "June 2025";

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
            {BRAND.name} (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;)
            is committed to protecting your privacy. This Privacy Policy
            explains how we collect, use, disclose, and safeguard your
            information when you use our mobile application, website, and
            related services (collectively, the &quot;Service&quot;). Please
            read this policy carefully. By using the Service, you consent to
            the practices described herein.
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
                  Name, email address, password, and profile details when you
                  create an account.
                </li>
                <li className="text-sm leading-relaxed" style={bodyText}>
                  <strong style={{ color: T.text }}>Purchase Information:</strong>{" "}
                  Transaction details related to Coin purchases and
                  subscription payments. Payment card information is processed
                  by third-party payment processors and is not stored on our
                  servers.
                </li>
                <li className="text-sm leading-relaxed" style={bodyText}>
                  <strong style={{ color: T.text }}>Communications:</strong>{" "}
                  Information you provide when contacting customer support or
                  communicating with us.
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
                  Device type, operating system, unique device identifiers, and
                  mobile network information.
                </li>
                <li className="text-sm leading-relaxed" style={bodyText}>
                  <strong style={{ color: T.text }}>Usage Data:</strong>{" "}
                  Viewing history, episodes watched, watch time, interactions,
                  search queries, and feature usage patterns.
                </li>
                <li className="text-sm leading-relaxed" style={bodyText}>
                  <strong style={{ color: T.text }}>Log Data:</strong> IP
                  address, browser type, referring/exit pages, timestamps, and
                  clickstream data.
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
              Process transactions and manage your account, including Coin
              balances and subscription status.
            </li>
            <li className="text-sm leading-relaxed" style={bodyText}>
              Personalize your experience, including content recommendations.
            </li>
            <li className="text-sm leading-relaxed" style={bodyText}>
              Send you transactional communications (purchase receipts, account
              notifications) and, with your consent, promotional messages.
            </li>
            <li className="text-sm leading-relaxed" style={bodyText}>
              Analyze usage patterns to improve content and features.
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
            We do not sell your personal information. We may share your
            information in the following circumstances:
          </p>
          <ul className="list-disc pl-5 flex flex-col gap-1.5">
            <li className="text-sm leading-relaxed" style={bodyText}>
              <strong style={{ color: T.text }}>Service Providers:</strong>{" "}
              With third-party vendors who assist in operating the Service
              (payment processors, hosting providers, analytics services).
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
            We use cookies, pixels, and similar tracking technologies to
            collect usage data, remember your preferences, and analyze how the
            Service is used. Third-party analytics providers (such as Google
            Analytics) may also collect information about your use of the
            Service. You can manage cookie preferences through your browser
            settings, though some features of the Service may not function
            properly if cookies are disabled.
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

        {/* 6. Children's Privacy (COPPA) */}
        <div>
          <h2 className="text-base font-semibold mb-2" style={sectionHeading}>
            6. Children&apos;s Privacy
          </h2>
          <p className="text-sm leading-relaxed" style={bodyText}>
            The Service is not directed to children under 13 years of age. We
            do not knowingly collect personal information from children under
            13. If we become aware that we have collected personal information
            from a child under 13 without verification of parental consent, we
            will take steps to delete that information. If you believe we have
            inadvertently collected information from a child under 13, please
            contact us at{" "}
            <a href="mailto:privacy@verzatv.com" style={{ color: T.accent }}>
              privacy@verzatv.com
            </a>
            .
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
                personal information; and opt out of the sale of personal
                information (we do not sell personal information). To exercise
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
            We retain your personal information for as long as your account is
            active or as needed to provide the Service. We may also retain
            certain information as necessary to comply with legal obligations,
            resolve disputes, enforce agreements, and support business
            operations. When personal information is no longer needed, we will
            securely delete or anonymize it.
          </p>
        </div>

        {/* 9. Third-Party Links */}
        <div>
          <h2 className="text-base font-semibold mb-2" style={sectionHeading}>
            9. Third-Party Links
          </h2>
          <p className="text-sm leading-relaxed" style={bodyText}>
            The Service may contain links to third-party websites or services
            that are not owned or controlled by {BRAND.name}. We are not
            responsible for the privacy practices of such third parties. We
            encourage you to read the privacy policies of any third-party
            services you access.
          </p>
        </div>

        {/* 10. Changes to This Policy */}
        <div>
          <h2 className="text-base font-semibold mb-2" style={sectionHeading}>
            10. Changes to This Policy
          </h2>
          <p className="text-sm leading-relaxed" style={bodyText}>
            We may update this Privacy Policy from time to time. If we make
            material changes, we will notify you through the Service or by
            other means. Your continued use of the Service after any changes
            constitutes your acceptance of the updated policy.
          </p>
        </div>

        {/* 11. Contact */}
        <div>
          <h2 className="text-base font-semibold mb-2" style={sectionHeading}>
            11. Contact
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
