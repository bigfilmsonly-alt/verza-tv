import { sendFormNotification } from "@/lib/email";

/**
 * POST /api/creator/beta
 *
 * Unauthenticated lead capture for the "Make your own show on Verza"
 * profit-sharing beta (the Creators browse tab). Collects ONLY a name and an
 * email so the team can review and reach out. No password, no payment, no
 * database write. The full authenticated creator flow lives at /studio.
 */

// Basic, deliberately permissive email shape check. Not RFC-perfect — just
// enough to reject obvious garbage before we email the team.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";

  if (name.length < 1 || name.length > 120) {
    return Response.json({ error: "Please enter your name." }, { status: 400 });
  }
  if (email.length > 200 || !EMAIL_RE.test(email)) {
    return Response.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  try {
    await sendFormNotification("Creator Beta Application", email, {
      name,
      email,
      source: "Creators tab",
    });
  } catch (err) {
    // Never crash on a mail hiccup — the applicant still counts as submitted,
    // and the failure is logged for the team to follow up on manually.
    console.error("[creator/beta] notification failed:", err);
  }

  return Response.json({ ok: true });
}