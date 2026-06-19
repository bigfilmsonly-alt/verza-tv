import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = "Verza TV <noreply@verzatv.com>";

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
async function notifyTeam(subject: string, body: string) {
  return resend.emails.send({
    from: FROM,
    to: TEAM_EMAILS,
    subject: `[Verza TV] ${subject}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; background: #07070E; color: #F5F4F8; padding: 32px 24px; border-radius: 16px;">
        <img src="https://www.verzatv.com/logo.png" alt="Verza TV" width="120" style="display: block; margin: 0 auto 20px;" />
        <h2 style="font-size: 18px; text-align: center; margin: 0 0 16px; color: #E0115F;">${subject}</h2>
        ${body}
        <p style="font-size: 11px; color: #6B6B7B; text-align: center; margin-top: 24px;">
          Verza TV Internal Notification
        </p>
      </div>
    `,
  }).catch((e) => console.error("[email] Team notify failed:", e));
}

/* ---- New user signup ---- */
export async function sendWelcomeEmail(email: string, name: string) {
  // Send welcome to the user
  const userEmail = resend.emails.send({
    from: FROM,
    to: email,
    subject: "Welcome to Verza TV!",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 500px; margin: 0 auto; background: #07070E; color: #F5F4F8; padding: 40px 24px; border-radius: 16px;">
        <img src="https://www.verzatv.com/logo.png" alt="Verza TV" width="140" style="display: block; margin: 0 auto 24px;" />
        <h1 style="font-size: 22px; text-align: center; margin: 0 0 16px;">Welcome, ${name}!</h1>
        <p style="font-size: 14px; color: #A0A0B0; text-align: center; line-height: 1.6; margin: 0 0 24px;">
          You're in. Start streaming 76+ original micro-dramas, reality shows, and more — the first 5 episodes of every series are free.
        </p>
        <div style="text-align: center; margin: 0 0 24px;">
          <a href="https://www.verzatv.com" style="display: inline-block; background: linear-gradient(135deg, #E0115F, #8B5CF6); color: #fff; padding: 14px 32px; border-radius: 50px; text-decoration: none; font-weight: 700; font-size: 14px;">
            Start Watching
          </a>
        </div>
        <p style="font-size: 11px; color: #6B6B7B; text-align: center;">
          &copy; 2026 Verza TV. All rights reserved.
        </p>
      </div>
    `,
  });

  // Notify the team
  const teamNotify = notifyTeam("New User Signup", `
    <table style="width: 100%; font-size: 14px; color: #A0A0B0;">
      <tr><td style="padding: 6px 0; color: #6B6B7B;">Name</td><td style="padding: 6px 0; font-weight: 600; color: #F5F4F8;">${name}</td></tr>
      <tr><td style="padding: 6px 0; color: #6B6B7B;">Email</td><td style="padding: 6px 0; font-weight: 600; color: #F5F4F8;">${email}</td></tr>
      <tr><td style="padding: 6px 0; color: #6B6B7B;">Time</td><td style="padding: 6px 0;">${new Date().toLocaleString("en-US", { timeZone: "America/New_York" })} ET</td></tr>
    </table>
  `);

  return Promise.all([userEmail, teamNotify]);
}

/* ---- Purchase confirmation ---- */
export async function sendPurchaseConfirmation(
  email: string,
  name: string,
  type: "merch" | "series_unlock",
  details: { seriesTitle?: string; amount: string; items?: string[] },
) {
  const subject = type === "series_unlock"
    ? `You unlocked ${details.seriesTitle}!`
    : "Your Verza TV order is confirmed";

  const body = type === "series_unlock"
    ? `
        <h1 style="font-size: 22px; text-align: center; margin: 0 0 8px;">Series Unlocked!</h1>
        <p style="font-size: 16px; text-align: center; color: #E0115F; font-weight: 700; margin: 0 0 16px;">${details.seriesTitle}</p>
        <p style="font-size: 14px; color: #A0A0B0; text-align: center; line-height: 1.6; margin: 0 0 8px;">
          All episodes are now yours. Payment: ${details.amount}.
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
          Thanks for your purchase, ${name}. Total: ${details.amount}.
        </p>
        ${details.items ? `<ul style="color: #A0A0B0; font-size: 13px; padding-left: 20px;">${details.items.map((i) => `<li>${i}</li>`).join("")}</ul>` : ""}
        <p style="font-size: 12px; color: #6B6B7B; text-align: center; margin-top: 16px;">
          We'll send shipping updates to this email.
        </p>
      `;

  // Send confirmation to the customer
  const customerEmail = resend.emails.send({
    from: FROM,
    to: email,
    subject,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 500px; margin: 0 auto; background: #07070E; color: #F5F4F8; padding: 40px 24px; border-radius: 16px;">
        <img src="https://www.verzatv.com/logo.png" alt="Verza TV" width="140" style="display: block; margin: 0 auto 24px;" />
        ${body}
        <p style="font-size: 11px; color: #6B6B7B; text-align: center; margin-top: 24px;">
          &copy; 2026 Verza TV. All rights reserved.
        </p>
      </div>
    `,
  });

  // Notify the team
  const teamSubject = type === "series_unlock"
    ? `New Series Unlock: ${details.seriesTitle}`
    : "New Merch Order";

  const teamNotify = notifyTeam(teamSubject, `
    <table style="width: 100%; font-size: 14px; color: #A0A0B0;">
      <tr><td style="padding: 6px 0; color: #6B6B7B;">Customer</td><td style="padding: 6px 0; font-weight: 600; color: #F5F4F8;">${name}</td></tr>
      <tr><td style="padding: 6px 0; color: #6B6B7B;">Email</td><td style="padding: 6px 0; font-weight: 600; color: #F5F4F8;">${email}</td></tr>
      <tr><td style="padding: 6px 0; color: #6B6B7B;">Type</td><td style="padding: 6px 0; font-weight: 600; color: #E0115F;">${type === "series_unlock" ? "Series Unlock" : "Merch Purchase"}</td></tr>
      ${details.seriesTitle ? `<tr><td style="padding: 6px 0; color: #6B6B7B;">Series</td><td style="padding: 6px 0;">${details.seriesTitle}</td></tr>` : ""}
      <tr><td style="padding: 6px 0; color: #6B6B7B;">Amount</td><td style="padding: 6px 0; font-weight: 700; color: #22c55e;">${details.amount}</td></tr>
      <tr><td style="padding: 6px 0; color: #6B6B7B;">Time</td><td style="padding: 6px 0;">${new Date().toLocaleString("en-US", { timeZone: "America/New_York" })} ET</td></tr>
    </table>
  `);

  return Promise.all([customerEmail, teamNotify]);
}

/* ---- Form submission notification ---- */
export async function sendFormNotification(
  formName: string,
  submitterEmail: string,
  data: Record<string, string>,
) {
  const rows = Object.entries(data)
    .map(([key, val]) => `<tr><td style="padding: 6px 0; color: #6B6B7B; text-transform: capitalize;">${key}</td><td style="padding: 6px 0; color: #F5F4F8;">${val}</td></tr>`)
    .join("");

  return notifyTeam(`Form Submission: ${formName}`, `
    <table style="width: 100%; font-size: 14px; color: #A0A0B0;">
      <tr><td style="padding: 6px 0; color: #6B6B7B;">Form</td><td style="padding: 6px 0; font-weight: 600; color: #F5F4F8;">${formName}</td></tr>
      <tr><td style="padding: 6px 0; color: #6B6B7B;">From</td><td style="padding: 6px 0; font-weight: 600; color: #F5F4F8;">${submitterEmail}</td></tr>
      ${rows}
      <tr><td style="padding: 6px 0; color: #6B6B7B;">Time</td><td style="padding: 6px 0;">${new Date().toLocaleString("en-US", { timeZone: "America/New_York" })} ET</td></tr>
    </table>
  `);
}
