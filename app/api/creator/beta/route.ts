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
const WINDOW_MS = 15 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 5;
const requestWindows = new Map<string, { count: number; resetAt: number }>();

function json(body: Record<string, unknown>, status = 200) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store, max-age=0" },
  });
}

function requestKey(req: Request): string {
  return (
    req.headers.get("x-vercel-forwarded-for") ??
    req.headers.get("x-forwarded-for") ??
    "unknown"
  ).split(",")[0].trim();
}

function isRateLimited(key: string, now = Date.now()): boolean {
  if (requestWindows.size > 1_000) {
    for (const [candidate, window] of requestWindows) {
      if (window.resetAt <= now) requestWindows.delete(candidate);
    }
  }
  const current = requestWindows.get(key);
  if (!current || current.resetAt <= now) {
    requestWindows.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  current.count += 1;
  return current.count > MAX_REQUESTS_PER_WINDOW;
}

function isSameOrigin(req: Request): boolean {
  if (req.headers.get("sec-fetch-site") === "cross-site") return false;
  const origin = req.headers.get("origin");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (!origin || !host) return false;
  try {
    return new URL(origin).host.toLowerCase() === host.toLowerCase();
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return json({ error: "Forbidden." }, 403);
  if (!req.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return json({ error: "Invalid request." }, 415);
  }
  const contentLength = Number(req.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > 2_048) {
    return json({ error: "Request is too large." }, 413);
  }
  if (isRateLimited(requestKey(req))) {
    return json({ error: "Too many attempts. Please try again later." }, 429);
  }

  let body: Record<string, unknown>;
  try {
    const raw = await req.text();
    if (raw.length > 2_048) return json({ error: "Request is too large." }, 413);
    body = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return json({ error: "Invalid request." }, 400);
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const website = typeof body.website === "string" ? body.website.trim() : "";

  // Honeypot: automated form fillers receive a generic success without
  // generating team email. The real form always sends this field empty.
  if (website) return json({ ok: true });

  if (name.length < 1 || name.length > 120) {
    return json({ error: "Please enter your name." }, 400);
  }
  if (email.length > 200 || !EMAIL_RE.test(email)) {
    return json({ error: "Please enter a valid email address." }, 400);
  }

  try {
    await sendFormNotification("Creator Beta Application", email, {
      name,
      email,
      source: "Creators tab",
    });
  } catch (err) {
    console.error("[creator/beta] notification failed:", err);
    return json({ error: "Could not submit right now. Please try again." }, 503);
  }

  return json({ ok: true });
}
