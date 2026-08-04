import type { Metadata } from "next";
import Link from "next/link";
import { T } from "@/lib/theme";
import { BRAND } from "@/lib/config";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Terms of Service for VERZA TV. Read our terms governing use of the platform, purchases, VIP subscriptions, content licensing, and more.",
  alternates: { canonical: "/terms" },
};

const LAST_UPDATED = "August 3, 2026";

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
          <p className="text-sm leading-relaxed mt-3" style={bodyText}>
            The Service is operated by VERZA TV LLC, 650 E Palisade Ave, Ste
            2329, Englewood Cliffs, NJ 07632, United States.
          </p>
        </div>

        {/* 2. Eligibility */}
        <div>
          <h2 className="text-base font-semibold mb-2" style={sectionHeading}>
            2. Eligibility
          </h2>
          <p className="text-sm leading-relaxed" style={bodyText}>
            The Service is intended only for adults. You must be at least 18
            years old and legally able to enter into a binding agreement in
            your jurisdiction to use the Service. By using the Service, you
            represent and warrant that you meet these eligibility requirements.
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

        {/* 4. Purchases & Subscriptions */}
        <div>
          <h2 className="text-base font-semibold mb-2" style={sectionHeading}>
            4. Purchases &amp; Subscriptions
          </h2>
          <div className="flex flex-col gap-3">
            <p className="text-sm leading-relaxed" style={bodyText}>
              The Service may offer one-time{" "}
              <strong style={{ color: T.text }}>Series Unlocks</strong> for a
              specific series and an auto-renewing{" "}
              <strong style={{ color: T.text }}>VIP subscription</strong> for
              access while the subscription remains active. Digital purchases
              are offered through our website and supported non-iOS surfaces.
              The native iOS application does not offer digital purchases; it
              allows signed-in users to view content they are already entitled
              to access.
            </p>
            <p className="text-sm leading-relaxed" style={bodyText}>
              <strong style={{ color: T.text }}>VIP Auto-Renewal:</strong> The
              billing interval, price, renewal terms, and any trial or promotion
              are displayed before checkout. Unless cancelled, VIP renews at
              the disclosed interval and recurring price accepted at checkout.
              You may manage or
              cancel through the secure Stripe billing portal available from
              your Profile on supported surfaces, or contact
              support@verzatv.com for assistance. Cancellation stops future
              renewals; access ordinarily continues through the paid period.
              After enrollment, we send a retainable acknowledgment of the
              recurring terms and cancellation method. We also send successful
              renewal receipts, cancellation confirmations, and advance annual
              renewal reminders where required by applicable law. You are
              responsible for keeping your account and Stripe billing email
              current so these transactional notices can reach you.
            </p>
            <p className="text-sm leading-relaxed" style={bodyText}>
              <strong style={{ color: T.text }}>Series Unlocks:</strong> A
              Series Unlock applies only to the series identified at checkout,
              is tied to the authenticated account used for the purchase, and
              is non-transferable. It grants a license to view available
              content; it is not ownership of the content. A limited number of
              legacy purchases were completed before authenticated checkout was
              required. Any request to claim or alter one of those unlinked
              records requires independent purchase or mailbox verification;
              signing in with a matching email does not by itself promise an
              automatic claim.
            </p>
            <p className="text-sm leading-relaxed" style={bodyText}>
              <strong style={{ color: T.text }}>Physical Goods:</strong> Direct
              merchandise orders are processed through Stripe checkout.
              Product availability, taxes, shipping, and other material terms
              shown at checkout are part of the order. Purchases completed on
              Amazon are transactions with Amazon or the applicable seller and
              are governed by their terms.
            </p>
            <p className="text-sm leading-relaxed" style={bodyText}>
              <strong style={{ color: T.text }}>Refunds:</strong> Except as
              required by applicable law or described in our Refund Policy,
              purchases are final. The Refund Policy explains how to report a
              duplicate, unauthorized, inaccessible, or otherwise erroneous
              transaction.
            </p>
            <p className="text-sm leading-relaxed" style={bodyText}>
              <strong style={{ color: T.text }}>Price Changes:</strong> We may
              modify prices and promotions for new purchases. The price
              presented and accepted at checkout controls that transaction.
              Any proposed change to the recurring price of an existing
              subscription would take effect only after the advance notice,
              consent, and provider changes required by applicable law.
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
              <strong style={{ color: T.text }}>Viewing Rights:</strong> Free
              access, a Series Unlock, or an active subscription grants you a
              limited, non-exclusive, non-transferable, revocable license to
              stream available Content for personal, non-commercial use only,
              subject to these Terms.
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
            , or by mail at VERZA TV LLC, 650 E Palisade Ave, Ste 2329,
            Englewood Cliffs, NJ 07632, United States.
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
