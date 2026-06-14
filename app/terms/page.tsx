{/* DRAFT — flagged for legal review */}
import type { Metadata } from "next";
import Link from "next/link";
import { T } from "@/lib/theme";
import { BRAND } from "@/lib/config";

export const metadata: Metadata = {
  title: `Terms of Service | ${BRAND.name}`,
  description:
    "Terms of Service for Verza TV. Read our terms governing use of the platform, coin purchases, content licensing, and more.",
  alternates: { canonical: "/terms" },
};

const LAST_UPDATED = "June 2025";

const sectionHeading = {
  color: T.text,
};

const bodyText = {
  color: T.textDim,
};

export default function TermsPage() {
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
        Terms of Service
      </h1>
      <p className="text-sm mb-8" style={{ color: T.textMute }}>
        Last updated: {LAST_UPDATED}
      </p>

      <div className="flex flex-col gap-8">
        {/* 1. Acceptance of Terms */}
        <div>
          <h2 className="text-base font-semibold mb-2" style={sectionHeading}>
            1. Acceptance of Terms
          </h2>
          <p className="text-sm leading-relaxed" style={bodyText}>
            By accessing or using the {BRAND.name} application, website, or any
            related services (collectively, the &quot;Service&quot;), you agree
            to be bound by these Terms of Service (&quot;Terms&quot;). If you do
            not agree to these Terms, you may not use the Service. We reserve
            the right to update these Terms at any time, and your continued use
            of the Service after any changes constitutes acceptance of the
            revised Terms.
          </p>
        </div>

        {/* 2. Eligibility */}
        <div>
          <h2 className="text-base font-semibold mb-2" style={sectionHeading}>
            2. Eligibility
          </h2>
          <p className="text-sm leading-relaxed" style={bodyText}>
            You must be at least 13 years of age to use the Service. If you are
            between 13 and 18 years of age (or the age of majority in your
            jurisdiction), you may only use the Service with the consent of a
            parent or legal guardian who agrees to be bound by these Terms. By
            using the Service, you represent and warrant that you meet these
            eligibility requirements.
          </p>
        </div>

        {/* 3. Account Registration */}
        <div>
          <h2 className="text-base font-semibold mb-2" style={sectionHeading}>
            3. Account Registration
          </h2>
          <p className="text-sm leading-relaxed" style={bodyText}>
            To access certain features of the Service, you may be required to
            create an account. You agree to provide accurate, current, and
            complete information during registration, and to update such
            information as necessary. You are responsible for safeguarding your
            account credentials and for all activity that occurs under your
            account. You agree to notify us immediately at{" "}
            <a href="mailto:legal@verzatv.com" style={{ color: T.accent }}>
              legal@verzatv.com
            </a>{" "}
            if you suspect any unauthorized use of your account.
          </p>
        </div>

        {/* 4. Coin Purchases & Virtual Currency */}
        <div>
          <h2 className="text-base font-semibold mb-2" style={sectionHeading}>
            4. Coin Purchases &amp; Virtual Currency
          </h2>
          <div className="flex flex-col gap-3">
            <p className="text-sm leading-relaxed" style={bodyText}>
              The Service uses a virtual currency system (&quot;Coins&quot;)
              that allows you to unlock premium content. Coins can be purchased
              through the Service or through third-party app stores (Apple App
              Store, Google Play Store).
            </p>
            <p className="text-sm leading-relaxed" style={bodyText}>
              <strong style={{ color: T.text }}>Non-Refundable:</strong> All
              Coin purchases are final and non-refundable, except as required
              by applicable law.
            </p>
            <p className="text-sm leading-relaxed" style={bodyText}>
              <strong style={{ color: T.text }}>No Cash Value:</strong> Coins
              have no real-world monetary value and cannot be exchanged for
              cash, transferred to other users, or redeemed outside the
              Service.
            </p>
            <p className="text-sm leading-relaxed" style={bodyText}>
              <strong style={{ color: T.text }}>No Expiration:</strong> Coins
              do not expire as long as your account remains in good standing.
              However, if your account is terminated for violation of these
              Terms, any remaining Coins may be forfeited.
            </p>
            <p className="text-sm leading-relaxed" style={bodyText}>
              <strong style={{ color: T.text }}>Price Changes:</strong> We
              reserve the right to modify Coin pricing and pack offerings at
              any time without prior notice.
            </p>
          </div>
        </div>

        {/* 5. Content & Licensing */}
        <div>
          <h2 className="text-base font-semibold mb-2" style={sectionHeading}>
            5. Content &amp; Licensing
          </h2>
          <div className="flex flex-col gap-3">
            <p className="text-sm leading-relaxed" style={bodyText}>
              All content available through the Service, including but not
              limited to video, audio, text, graphics, and images
              (&quot;Content&quot;), is owned by or licensed to {BRAND.name}.
            </p>
            <p className="text-sm leading-relaxed" style={bodyText}>
              <strong style={{ color: T.text }}>Viewing Rights:</strong> Your
              purchase of Coins or a subscription grants you a limited,
              non-exclusive, non-transferable, revocable license to stream
              unlocked Content for personal, non-commercial use only.
            </p>
            <p className="text-sm leading-relaxed" style={bodyText}>
              <strong style={{ color: T.text }}>Restrictions:</strong> You may
              not download, copy, reproduce, distribute, transmit, broadcast,
              display, sell, license, or otherwise exploit any Content for any
              purpose without prior written consent from {BRAND.name}.
              Screen recording, screen capturing, or any form of content
              extraction is strictly prohibited.
            </p>
          </div>
        </div>

        {/* 6. User Conduct */}
        <div>
          <h2 className="text-base font-semibold mb-2" style={sectionHeading}>
            6. User Conduct
          </h2>
          <p className="text-sm leading-relaxed mb-3" style={bodyText}>
            You agree not to:
          </p>
          <ul className="list-disc pl-5 flex flex-col gap-1.5">
            <li className="text-sm leading-relaxed" style={bodyText}>
              Use the Service for any unlawful purpose or in violation of any
              applicable laws or regulations.
            </li>
            <li className="text-sm leading-relaxed" style={bodyText}>
              Attempt to gain unauthorized access to any part of the Service,
              other accounts, or any systems or networks connected to the
              Service.
            </li>
            <li className="text-sm leading-relaxed" style={bodyText}>
              Interfere with or disrupt the Service, servers, or networks
              connected to the Service.
            </li>
            <li className="text-sm leading-relaxed" style={bodyText}>
              Use any automated means (bots, scrapers, crawlers) to access or
              collect data from the Service.
            </li>
            <li className="text-sm leading-relaxed" style={bodyText}>
              Impersonate any person or entity, or falsely state or
              misrepresent your affiliation with any person or entity.
            </li>
            <li className="text-sm leading-relaxed" style={bodyText}>
              Upload, post, or transmit any content that is defamatory,
              obscene, abusive, or otherwise objectionable.
            </li>
            <li className="text-sm leading-relaxed" style={bodyText}>
              Circumvent, disable, or otherwise interfere with any
              security-related features of the Service or features that
              restrict use or copying of Content.
            </li>
          </ul>
        </div>

        {/* 7. Intellectual Property */}
        <div>
          <h2 className="text-base font-semibold mb-2" style={sectionHeading}>
            7. Intellectual Property
          </h2>
          <p className="text-sm leading-relaxed" style={bodyText}>
            The Service and all associated intellectual property rights,
            including but not limited to trademarks, logos, trade names, domain
            names, Content, software, and design elements, are and shall remain
            the exclusive property of {BRAND.name} and its licensors. Nothing
            in these Terms grants you any right, title, or interest in the
            Service or any intellectual property of {BRAND.name}, except for
            the limited license expressly set forth herein.
          </p>
        </div>

        {/* 8. Disclaimers & Limitation of Liability */}
        <div>
          <h2 className="text-base font-semibold mb-2" style={sectionHeading}>
            8. Disclaimers &amp; Limitation of Liability
          </h2>
          <div className="flex flex-col gap-3">
            <p className="text-sm leading-relaxed" style={bodyText}>
              THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS
              AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS
              OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF
              MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND
              NON-INFRINGEMENT. {BRAND.name.toUpperCase()} DOES NOT WARRANT
              THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE.
            </p>
            <p className="text-sm leading-relaxed" style={bodyText}>
              TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT
              SHALL {BRAND.name.toUpperCase()}, ITS AFFILIATES, OFFICERS,
              DIRECTORS, EMPLOYEES, OR AGENTS BE LIABLE FOR ANY INDIRECT,
              INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY
              LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR
              INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER
              INTANGIBLE LOSSES, RESULTING FROM (A) YOUR ACCESS TO OR USE OF
              OR INABILITY TO ACCESS OR USE THE SERVICE; (B) ANY UNAUTHORIZED
              ACCESS TO OR USE OF OUR SERVERS AND/OR ANY PERSONAL INFORMATION
              STORED THEREIN; OR (C) ANY INTERRUPTION OR CESSATION OF
              TRANSMISSION TO OR FROM THE SERVICE.
            </p>
          </div>
        </div>

        {/* 9. Governing Law */}
        <div>
          <h2 className="text-base font-semibold mb-2" style={sectionHeading}>
            9. Governing Law
          </h2>
          <p className="text-sm leading-relaxed" style={bodyText}>
            These Terms shall be governed by and construed in accordance with
            the laws of the State of New Jersey, United States, without regard
            to its conflict of law provisions. Any disputes arising out of or
            relating to these Terms or the Service shall be subject to the
            exclusive jurisdiction of the state and federal courts located in
            the State of New Jersey.
          </p>
        </div>

        {/* 10. Changes to These Terms */}
        <div>
          <h2 className="text-base font-semibold mb-2" style={sectionHeading}>
            10. Changes to These Terms
          </h2>
          <p className="text-sm leading-relaxed" style={bodyText}>
            We reserve the right to modify these Terms at any time. If we make
            material changes, we will notify you through the Service or by
            other means. Your continued use of the Service after any
            modifications indicates your acceptance of the updated Terms.
          </p>
        </div>

        {/* 11. Contact */}
        <div>
          <h2 className="text-base font-semibold mb-2" style={sectionHeading}>
            11. Contact
          </h2>
          <p className="text-sm leading-relaxed" style={bodyText}>
            If you have any questions about these Terms, please contact us at{" "}
            <a href="mailto:legal@verzatv.com" style={{ color: T.accent }}>
              legal@verzatv.com
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
