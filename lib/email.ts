import "server-only";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = "VERZA TV <noreply@verzatv.com>";

export type VipCustomerNoticeType =
  | "vip_initial_acknowledgment"
  | "vip_renewal_receipt"
  | "vip_cancellation_confirmation"
  | "vip_annual_renewal_reminder";

export type VipCustomerNoticeInput = {
  type: VipCustomerNoticeType;
  email: string;
  name: string;
  planLabel: "Monthly" | "Yearly";
  recurringAmount: string;
  chargedAmount?: string;
  renewalDate?: string | null;
  accessThrough?: string | null;
  termsVersion?: string | null;
  canceledAtPeriodEnd?: boolean;
};

/** Escape HTML special characters to prevent XSS in email templates */
function esc(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/* Team members — notified on signups, purchases, and form submissions */
const TEAM_EMAILS = [
  "alan@storageblue.com",
  "matt@verzatv.com",
  "natalie@verzatv.com",
  "allison@verzatv.com",
  "debra@verzatv.com",
  "bigfilmsonly@gmail.com",
  "mikecrouch@gmail.com",
];

/* ---- Team notification (internal) ---- */
async function notifyTeam(
  subject: string,
  body: string,
  options: { throwOnError?: boolean } = {},
) {
  const request = resend.emails.send({
    from: FROM,
    to: TEAM_EMAILS,
    subject: `[VERZA TV] ${subject}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; background: #07070E; color: #F5F4F8; padding: 32px 24px; border-radius: 16px;">
        <img src="https://www.verzatv.com/logo.png" alt="VERZA TV" width="120" style="display: block; margin: 0 auto 20px;" />
        <h2 style="font-size: 18px; text-align: center; margin: 0 0 16px; color: #E0115F;">${esc(subject)}</h2>
        ${body}
        <p style="font-size: 11px; color: #6B6B7B; text-align: center; margin-top: 24px;">
          VERZA TV Internal Notification
        </p>
      </div>
    `,
  });

  if (options.throwOnError) {
    const result = await request;
    if (result.error) {
      throw new Error(`Email provider rejected the request: ${result.error.name}`);
    }
    return result;
  }
  return request.catch((e) => console.error("[email] Team notify failed:", e));
}

/* ---- New user signup ---- */
export async function sendWelcomeEmail(email: string, name: string) {
  // Send welcome to the user
  const userEmail = resend.emails.send({
    from: FROM,
    to: email,
    subject: "Welcome to VERZA TV!",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 500px; margin: 0 auto; background: #07070E; color: #F5F4F8; padding: 40px 24px; border-radius: 16px;">
        <img src="https://www.verzatv.com/logo.png" alt="VERZA TV" width="140" style="display: block; margin: 0 auto 24px;" />
        <h1 style="font-size: 22px; text-align: center; margin: 0 0 16px;">Welcome, ${esc(name)}!</h1>
        <p style="font-size: 14px; color: #A0A0B0; text-align: center; line-height: 1.6; margin: 0 0 24px;">
          You're in. Browse the current micro-drama and reality catalog; each title page shows its current free-preview availability.
        </p>
        <div style="text-align: center; margin: 0 0 24px;">
          <a href="https://www.verzatv.com" style="display: inline-block; background: linear-gradient(135deg, #E0115F, #8B5CF6); color: #fff; padding: 14px 32px; border-radius: 50px; text-decoration: none; font-weight: 700; font-size: 14px;">
            Start Watching
          </a>
        </div>
        <p style="font-size: 11px; color: #6B6B7B; text-align: center;">
          &copy; 2026 VERZA TV. All rights reserved.
        </p>
      </div>
    `,
  });

  // Notify the team
  const teamNotify = notifyTeam("New User Signup", `
    <table style="width: 100%; font-size: 14px; color: #A0A0B0;">
      <tr><td style="padding: 6px 0; color: #6B6B7B;">Name</td><td style="padding: 6px 0; font-weight: 600; color: #F5F4F8;">${esc(name)}</td></tr>
      <tr><td style="padding: 6px 0; color: #6B6B7B;">Email</td><td style="padding: 6px 0; font-weight: 600; color: #F5F4F8;">${esc(email)}</td></tr>
      <tr><td style="padding: 6px 0; color: #6B6B7B;">Time</td><td style="padding: 6px 0;">${new Date().toLocaleString("en-US", { timeZone: "America/New_York" })} ET</td></tr>
    </table>
  `);

  return Promise.all([userEmail, teamNotify]);
}

/* ---- Purchase confirmation ---- */
/* ---- Auth transactional (branded; replaces Supabase's raw templates) ----
   Both take a Supabase-generated action link and wrap it in Verza branding.
   esc() on the link is main's existing escaper — these are the only two
   user-supplied values in the template. */
export async function sendPasswordResetEmail(email: string, actionLink: string) {
  return resend.emails.send({
    from: FROM,
    to: email,
    subject: "Reset your VERZA TV password",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 500px; margin: 0 auto; background: #07070E; color: #F5F4F8; padding: 40px 24px; border-radius: 16px;">
        <img src="https://www.verzatv.com/logo.png" alt="VERZA TV" width="140" style="display: block; margin: 0 auto 24px;" />
        <h1 style="font-size: 22px; text-align: center; margin: 0 0 16px;">Reset your password</h1>
        <p style="font-size: 14px; color: #A0A0B0; text-align: center; line-height: 1.6; margin: 0 0 24px;">
          We received a request to reset the password for your VERZA TV account. Tap the button below to choose a new one. This link expires soon, so use it while it is fresh.
        </p>
        <div style="text-align: center; margin: 0 0 24px;">
          <a href="${esc(actionLink)}" style="display: inline-block; background: linear-gradient(135deg, #E0115F, #8B5CF6); color: #fff; padding: 14px 32px; border-radius: 50px; text-decoration: none; font-weight: 700; font-size: 14px;">
            Reset Password
          </a>
        </div>
        <p style="font-size: 12px; color: #6B6B7B; text-align: center; line-height: 1.6; margin: 0 0 24px;">
          If you did not request this, you can safely ignore this email. Your password will stay the same.
        </p>
        <p style="font-size: 11px; color: #6B6B7B; text-align: center;">
          &copy; 2026 VERZA TV. All rights reserved.
        </p>
      </div>
    `,
  }).catch((e) => console.error("[email] Password reset failed:", e));
}

/* ---- Email verification (branded soft verification, replaces raw template) ---- */
export async function sendVerificationEmail(email: string, actionLink: string) {
  return resend.emails.send({
    from: FROM,
    to: email,
    subject: "Verify your VERZA TV email",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 500px; margin: 0 auto; background: #07070E; color: #F5F4F8; padding: 40px 24px; border-radius: 16px;">
        <img src="https://www.verzatv.com/logo.png" alt="VERZA TV" width="140" style="display: block; margin: 0 auto 24px;" />
        <h1 style="font-size: 22px; text-align: center; margin: 0 0 16px;">Confirm your email</h1>
        <p style="font-size: 14px; color: #A0A0B0; text-align: center; line-height: 1.6; margin: 0 0 24px;">
          Welcome to VERZA TV. Confirm your email address to secure your account and keep your library, purchases, and watchlist safe.
        </p>
        <div style="text-align: center; margin: 0 0 24px;">
          <a href="${esc(actionLink)}" style="display: inline-block; background: linear-gradient(135deg, #E0115F, #8B5CF6); color: #fff; padding: 14px 32px; border-radius: 50px; text-decoration: none; font-weight: 700; font-size: 14px;">
            Verify Email
          </a>
        </div>
        <p style="font-size: 12px; color: #6B6B7B; text-align: center; line-height: 1.6; margin: 0 0 24px;">
          If you did not create a VERZA TV account, you can ignore this email.
        </p>
        <p style="font-size: 11px; color: #6B6B7B; text-align: center;">
          &copy; 2026 VERZA TV. All rights reserved.
        </p>
      </div>
    `,
  }).catch((e) => console.error("[email] Verification failed:", e));
}

export async function sendPurchaseConfirmation(
  email: string,
  name: string,
  type: "merch" | "series_unlock",
  details: { seriesTitle?: string; amount: string; items?: string[] },
  options?: { idempotencyKey?: string; notifyTeam?: boolean },
): Promise<string> {
  const subject = type === "series_unlock"
    ? `You unlocked ${details.seriesTitle}!`
    : "Your VERZA TV order is confirmed";

  const body = type === "series_unlock"
    ? `
        <h1 style="font-size: 22px; text-align: center; margin: 0 0 8px;">Series Unlocked!</h1>
        <p style="font-size: 16px; text-align: center; color: #E0115F; font-weight: 700; margin: 0 0 16px;">${details.seriesTitle}</p>
        <p style="font-size: 14px; color: #A0A0B0; text-align: center; line-height: 1.6; margin: 0 0 8px;">
          Access to all currently available episodes in this series is now active on your account while the title remains available. Payment: ${details.amount}.
        </p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="https://www.verzatv.com" style="display: inline-block; background: linear-gradient(135deg, #E0115F, #8B5CF6); color: #fff; padding: 14px 32px; border-radius: 50px; text-decoration: none; font-weight: 700; font-size: 14px;">
            Keep Watching
          </a>
        </div>
      `
    : `
        <h1 style="font-size: 22px; text-align: center; margin: 0 0 16px;">Order Confirmed!</h1>
        <p style="font-size: 14px; color: #A0A0B0; text-align: center; line-height: 1.6; margin: 0 0 8px;">
          Thanks for your purchase, ${esc(name)}. Total: ${details.amount}.
        </p>
        ${details.items ? `<ul style="color: #A0A0B0; font-size: 13px; padding-left: 20px;">${details.items.map((i) => `<li>${i}</li>`).join("")}</ul>` : ""}
        <p style="font-size: 12px; color: #6B6B7B; text-align: center; margin-top: 16px;">
          We'll send shipping updates to this email.
        </p>
      `;

  // Send confirmation to the customer
  const customerEmail = await resend.emails.send(
    {
      from: FROM,
      to: email,
      replyTo: "support@verzatv.com",
      subject,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 500px; margin: 0 auto; background: #07070E; color: #F5F4F8; padding: 40px 24px; border-radius: 16px;">
          <img src="https://www.verzatv.com/logo.png" alt="VERZA TV" width="140" style="display: block; margin: 0 auto 24px;" />
          ${body}
          <p style="font-size: 12px; color: #A0A0B0; text-align: center; margin-top: 20px;">
            Questions or an access problem? Reply to this email or contact support@verzatv.com.
          </p>
          <p style="font-size: 11px; color: #6B6B7B; text-align: center; margin-top: 24px;">
            &copy; 2026 VERZA TV. All rights reserved.
          </p>
        </div>
      `,
    },
    options?.idempotencyKey
      ? { idempotencyKey: options.idempotencyKey }
      : undefined,
  );
  if (customerEmail.error || !customerEmail.data?.id) {
    throw new Error(
      `Resend rejected purchase confirmation: ${
        customerEmail.error?.message ?? "missing message id"
      }`,
    );
  }

  // Notify the team
  const teamSubject = type === "series_unlock"
    ? `New Series Unlock: ${details.seriesTitle}`
    : "New Merch Order";

  if (options?.notifyTeam !== false) {
    await notifyTeam(teamSubject, `
      <table style="width: 100%; font-size: 14px; color: #A0A0B0;">
        <tr><td style="padding: 6px 0; color: #6B6B7B;">Customer</td><td style="padding: 6px 0; font-weight: 600; color: #F5F4F8;">${esc(name)}</td></tr>
        <tr><td style="padding: 6px 0; color: #6B6B7B;">Email</td><td style="padding: 6px 0; font-weight: 600; color: #F5F4F8;">${esc(email)}</td></tr>
        <tr><td style="padding: 6px 0; color: #6B6B7B;">Type</td><td style="padding: 6px 0; font-weight: 600; color: #E0115F;">${type === "series_unlock" ? "Series Unlock" : "Merch Purchase"}</td></tr>
        ${details.seriesTitle ? `<tr><td style="padding: 6px 0; color: #6B6B7B;">Series</td><td style="padding: 6px 0;">${details.seriesTitle}</td></tr>` : ""}
        <tr><td style="padding: 6px 0; color: #6B6B7B;">Amount</td><td style="padding: 6px 0; font-weight: 700; color: #22c55e;">${details.amount}</td></tr>
        <tr><td style="padding: 6px 0; color: #6B6B7B;">Time</td><td style="padding: 6px 0;">${new Date().toLocaleString("en-US", { timeZone: "America/New_York" })} ET</td></tr>
      </table>
    `).catch((error) =>
      console.error("[email] Team purchase notification failed:", error),
    );
  }

  return customerEmail.data.id;
}

/* ---- Form submission notification ---- */
/* ---- Creator review decision (approve / reject a submitted title) ---- */
export async function sendCreatorDecisionEmail(
  email: string,
  opts: { title: string; approved: boolean; reason?: string; slug?: string },
) {
  const subject = opts.approved
    ? `"${opts.title}" is live on VERZA TV`
    : `Update on your VERZA TV submission`;

  const body = opts.approved
    ? `
        <h1 style="font-size: 22px; text-align: center; margin: 0 0 8px;">You're live!</h1>
        <p style="font-size: 16px; text-align: center; color: #E0115F; font-weight: 700; margin: 0 0 16px;">${esc(opts.title)}</p>
        <p style="font-size: 14px; color: #A0A0B0; text-align: center; line-height: 1.6; margin: 0 0 8px;">
          Your title passed review and is now streaming on VERZA TV. Earnings appear in your creator dashboard.
        </p>
        ${
          opts.slug
            ? `<div style="text-align: center; margin: 24px 0;">
                 <a href="https://www.verzatv.com/watch/${esc(opts.slug)}" style="display: inline-block; background: linear-gradient(135deg, #E0115F, #8B5CF6); color: #fff; padding: 14px 32px; border-radius: 50px; text-decoration: none; font-weight: 700; font-size: 14px;">View Your Title</a>
               </div>`
            : ""
        }
      `
    : `
        <h1 style="font-size: 22px; text-align: center; margin: 0 0 8px;">Submission needs changes</h1>
        <p style="font-size: 16px; text-align: center; color: #F5F4F8; font-weight: 700; margin: 0 0 16px;">${esc(opts.title)}</p>
        <p style="font-size: 14px; color: #A0A0B0; text-align: center; line-height: 1.6; margin: 0 0 8px;">
          Your title wasn't approved this time${opts.reason ? `:` : "."}
        </p>
        ${opts.reason ? `<p style="font-size: 14px; color: #F5F4F8; text-align: center; line-height: 1.6; margin: 0 0 8px; padding: 12px 16px; background: #14141F; border-radius: 12px;">${esc(opts.reason)}</p>` : ""}
        <p style="font-size: 13px; color: #6B6B7B; text-align: center; line-height: 1.6; margin: 16px 0 0;">
          Make the changes above and resubmit from your creator dashboard.
        </p>
      `;

  return resend.emails.send({
    from: FROM,
    to: email,
    subject,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 500px; margin: 0 auto; background: #07070E; color: #F5F4F8; padding: 40px 24px; border-radius: 16px;">
        <img src="https://www.verzatv.com/logo.png" alt="VERZA TV" width="140" style="display: block; margin: 0 auto 24px;" />
        ${body}
        <p style="font-size: 11px; color: #6B6B7B; text-align: center; margin-top: 24px;">
          &copy; 2026 VERZA TV. All rights reserved.
        </p>
      </div>
    `,
  }).catch((e) => console.error("[email] Creator decision failed:", e));
}

export async function sendFormNotification(
  formName: string,
  submitterEmail: string,
  data: Record<string, string>,
) {
  const rows = Object.entries(data)
    .map(([key, val]) => `<tr><td style="padding: 6px 0; color: #6B6B7B; text-transform: capitalize;">${esc(key)}</td><td style="padding: 6px 0; color: #F5F4F8;">${esc(val)}</td></tr>`)
    .join("");

  return notifyTeam(`Form Submission: ${formName}`, `
    <table style="width: 100%; font-size: 14px; color: #A0A0B0;">
      <tr><td style="padding: 6px 0; color: #6B6B7B;">Form</td><td style="padding: 6px 0; font-weight: 600; color: #F5F4F8;">${esc(formName)}</td></tr>
      <tr><td style="padding: 6px 0; color: #6B6B7B;">From</td><td style="padding: 6px 0; font-weight: 600; color: #F5F4F8;">${esc(submitterEmail)}</td></tr>
      ${rows}
      <tr><td style="padding: 6px 0; color: #6B6B7B;">Time</td><td style="padding: 6px 0;">${new Date().toLocaleString("en-US", { timeZone: "America/New_York" })} ET</td></tr>
    </table>
  `, { throwOnError: true });
}

function vipNoticeCopy(input: VipCustomerNoticeInput): {
  subject: string;
  heading: string;
  body: string;
} {
  const cadence = input.planLabel === "Yearly" ? "year" : "month";
  const renewalDate = input.renewalDate ? esc(input.renewalDate) : null;
  const accessThrough = input.accessThrough ? esc(input.accessThrough) : null;
  const recurringTerms = `${esc(input.recurringAmount)} each ${cadence}, plus applicable tax`;

  switch (input.type) {
    case "vip_initial_acknowledgment":
      return {
        subject: "Your VERZA VIP subscription is active",
        heading: "VIP subscription confirmed",
        body: `
          <p style="font-size: 14px; color: #A0A0B0; line-height: 1.65; margin: 0 0 14px;">
            Hi ${esc(input.name)}, your ${input.planLabel.toLowerCase()} VERZA VIP subscription is active. You were charged <strong style="color:#F5F4F8">${esc(input.chargedAmount ?? input.recurringAmount)}</strong> today.
          </p>
          <p style="font-size: 14px; color: #A0A0B0; line-height: 1.65; margin: 0 0 14px;">
            It renews automatically at <strong style="color:#F5F4F8">${recurringTerms}</strong> until you cancel.${renewalDate ? ` Your next renewal is ${renewalDate}; cancel before that date to avoid the next charge.` : " Cancel before the next renewal to avoid the next charge."}
          </p>
        `,
      };
    case "vip_renewal_receipt":
      return {
        subject: "Your VERZA VIP renewal receipt",
        heading: "VIP renewed",
        body: `
          <p style="font-size: 14px; color: #A0A0B0; line-height: 1.65; margin: 0 0 14px;">
            Hi ${esc(input.name)}, your ${input.planLabel.toLowerCase()} VERZA VIP subscription renewed. You were charged <strong style="color:#F5F4F8">${esc(input.chargedAmount ?? input.recurringAmount)}</strong>.
          </p>
          <p style="font-size: 14px; color: #A0A0B0; line-height: 1.65; margin: 0 0 14px;">
            It continues to renew automatically at <strong style="color:#F5F4F8">${recurringTerms}</strong> until you cancel.${renewalDate ? ` The next renewal is ${renewalDate}; cancel before that date to avoid the next charge.` : ""}
          </p>
        `,
      };
    case "vip_cancellation_confirmation":
      return {
        subject: "Your VERZA VIP cancellation is confirmed",
        heading: "VIP renewal canceled",
        body: `
          <p style="font-size: 14px; color: #A0A0B0; line-height: 1.65; margin: 0 0 14px;">
            Hi ${esc(input.name)}, we confirmed your VERZA VIP cancellation. You will not be charged another automatic renewal for this subscription.
          </p>
          <p style="font-size: 14px; color: #A0A0B0; line-height: 1.65; margin: 0 0 14px;">
            ${input.canceledAtPeriodEnd && accessThrough ? `Your VIP access continues through ${accessThrough}.` : "Your VIP subscription has ended."}
          </p>
        `,
      };
    case "vip_annual_renewal_reminder":
      return {
        subject: "Reminder: your annual VERZA VIP renewal is coming up",
        heading: "Annual renewal reminder",
        body: `
          <p style="font-size: 14px; color: #A0A0B0; line-height: 1.65; margin: 0 0 14px;">
            Hi ${esc(input.name)}, your annual VERZA VIP subscription is scheduled to renew${renewalDate ? ` on <strong style="color:#F5F4F8">${renewalDate}</strong>` : " soon"}.
          </p>
          <p style="font-size: 14px; color: #A0A0B0; line-height: 1.65; margin: 0 0 14px;">
            The renewal charge is <strong style="color:#F5F4F8">${recurringTerms}</strong>. To prevent the charge, cancel before the renewal date using Manage Subscription below.
          </p>
        `,
      };
  }
}

/**
 * Customer-facing VIP notices use a stable Resend idempotency key. The caller
 * also records the provider message id in the private payment_notices ledger.
 */
export async function sendVipCustomerNotice(
  input: VipCustomerNoticeInput,
  idempotencyKey: string,
): Promise<string> {
  const copy = vipNoticeCopy(input);
  const result = await resend.emails.send(
    {
      from: FROM,
      to: input.email,
      replyTo: "support@verzatv.com",
      subject: copy.subject,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 520px; margin: 0 auto; background: #07070E; color: #F5F4F8; padding: 40px 24px; border-radius: 16px;">
          <img src="https://www.verzatv.com/logo.png" alt="VERZA TV" width="140" style="display: block; margin: 0 auto 24px;" />
          <h1 style="font-size: 22px; text-align: center; margin: 0 0 18px;">${copy.heading}</h1>
          ${copy.body}
          <div style="text-align: center; margin: 24px 0;">
            <a href="https://www.verzatv.com/me" style="display: inline-block; background: linear-gradient(135deg, #E0115F, #8B5CF6); color: #fff; padding: 14px 28px; border-radius: 50px; text-decoration: none; font-weight: 700; font-size: 14px;">Manage Subscription</a>
          </div>
          <p style="font-size: 12px; color: #A0A0B0; line-height: 1.6; text-align: center; margin: 0 0 12px;">
            You can cancel online from Profile → Manage Subscription. Need help? Email
            <a href="mailto:support@verzatv.com" style="color:#F5F4F8">support@verzatv.com</a>.
          </p>
          <p style="font-size: 11px; color: #6B6B7B; text-align: center; line-height: 1.6; margin: 0;">
            <a href="https://www.verzatv.com/terms" style="color:#A0A0B0">Terms</a> ·
            <a href="https://www.verzatv.com/refund-policy" style="color:#A0A0B0">Cancellation &amp; Refund Policy</a> ·
            <a href="https://www.verzatv.com/privacy" style="color:#A0A0B0">Privacy</a>
            ${input.termsVersion ? `<br />Terms version: ${esc(input.termsVersion)}` : ""}
          </p>
          <p style="font-size: 11px; color: #6B6B7B; text-align: center; margin-top: 18px;">&copy; 2026 VERZA TV. All rights reserved.</p>
        </div>
      `,
    },
    { idempotencyKey },
  );
  if (result.error || !result.data?.id) {
    throw new Error(
      `Resend rejected VIP notice: ${result.error?.message ?? "missing message id"}`,
    );
  }
  return result.data.id;
}
