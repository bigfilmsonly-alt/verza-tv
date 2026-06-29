import { NextRequest } from "next/server";
import { persistEvent } from "@/lib/analytics/persist";
import type { AnalyticsEvent, EventProperties } from "@/lib/analytics/events";
import { isServerOnlyEvent } from "@/lib/analytics/events";

/**
 * POST /api/events
 * Client-side analytics sink. Accepts a single event and persists it to the
 * `analytics_events` table for funnel + retention reporting.
 *
 * Revenue-truth events (purchase/subscription) are rejected here — those are
 * only written by the Stripe webhook so the client can never forge revenue.
 * Rate limited by middleware (catch-all /api/ tier: 30/min/IP).
 */

// Events the client is allowed to report. Server-only revenue events excluded.
const ALLOWED: AnalyticsEvent[] = [
  "app_opened",
  "signup_started",
  "signup_completed",
  "login",
  "show_viewed",
  "episode_viewed",
  "search_performed",
  "share_clicked",
  "play_started",
  "play_completed",
  "play_progress",
  "paywall_viewed",
  "purchase_started",
  "checkout_started",
];

const MAX_STRING_LEN = 512;

function clampString(v: unknown): string | undefined {
  if (typeof v !== "string") return undefined;
  return v.slice(0, MAX_STRING_LEN);
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }

  const { event, props } = body as { event?: unknown; props?: unknown };

  if (typeof event !== "string" || !ALLOWED.includes(event as AnalyticsEvent)) {
    return Response.json({ error: "Unknown event" }, { status: 400 });
  }
  if (isServerOnlyEvent(event as AnalyticsEvent)) {
    return Response.json({ error: "Server-only event" }, { status: 403 });
  }

  // Sanitize props: drop revenue fields (client can't assert money), clamp strings.
  const raw = (props && typeof props === "object" ? props : {}) as Record<string, unknown>;
  const clean: EventProperties = {};
  for (const [key, value] of Object.entries(raw)) {
    if (key === "revenue_cents" || key === "currency") continue; // server-only
    if (typeof value === "string") {
      const s = clampString(value);
      if (s !== undefined) clean[key] = s;
    } else if (typeof value === "number" || typeof value === "boolean") {
      clean[key] = value;
    }
  }

  await persistEvent(event as AnalyticsEvent, clean);

  return Response.json({ ok: true }, { status: 202 });
}
