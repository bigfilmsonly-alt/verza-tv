/**
 * Central Analytics Emitter
 * Single emit() function that dispatches events to all configured providers.
 * Prevents duplicate events via deduplication key.
 *
 * Client-side: fires to GA4 + Vercel Analytics
 * Server-side: logs for dashboard aggregation (Supabase)
 */

import type { AnalyticsEvent, EventProperties } from "./events";
import { isServerOnlyEvent } from "./events";

/* ------------------------------------------------------------------ */
/*  Deduplication                                                      */
/* ------------------------------------------------------------------ */

const recentEvents = new Map<string, number>();
const DEDUP_WINDOW_MS = 2000; // 2 seconds

function isDuplicate(event: AnalyticsEvent, props: EventProperties): boolean {
  const key = `${event}:${props.show_id || ""}:${props.episode_number || ""}:${props.user_id || ""}`;
  const now = Date.now();
  const last = recentEvents.get(key);

  if (last && now - last < DEDUP_WINDOW_MS) {
    return true;
  }

  recentEvents.set(key, now);

  // Clean old entries periodically
  if (recentEvents.size > 100) {
    for (const [k, v] of recentEvents) {
      if (now - v > DEDUP_WINDOW_MS * 5) recentEvents.delete(k);
    }
  }

  return false;
}

/* ------------------------------------------------------------------ */
/*  Client-side emitter                                                */
/* ------------------------------------------------------------------ */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

function emitClient(event: AnalyticsEvent, props: EventProperties) {
  if (typeof window === "undefined") return;

  // GA4
  if (window.gtag) {
    window.gtag("event", event, {
      ...props,
      event_category: getEventCategory(event),
    });
  }

  // Vercel Analytics
  try {
    if ("va" in window) {
      (window as unknown as Record<string, (cmd: string, data: Record<string, unknown>) => void>)
        .va("event", { name: event, ...props });
    }
  } catch {}
}

/* ------------------------------------------------------------------ */
/*  Server-side emitter                                                */
/* ------------------------------------------------------------------ */

function emitServer(event: AnalyticsEvent, props: EventProperties) {
  // Log for server-side tracking (dashboard reads from Supabase + Stripe)
  console.log(`[analytics] ${event}`, JSON.stringify({
    ...props,
    timestamp: new Date().toISOString(),
  }));
}

/* ------------------------------------------------------------------ */
/*  Unified emit                                                       */
/* ------------------------------------------------------------------ */

/**
 * Emit an analytics event to all providers.
 * Handles deduplication and routes to the correct emitter.
 *
 * Usage:
 *   emit("play_started", { show_id: "my-series", episode_number: 1 })
 */
export function emit(event: AnalyticsEvent, props: EventProperties = {}) {
  // Add defaults
  const enriched: EventProperties = {
    platform: "web",
    ...props,
    timestamp: new Date().toISOString(),
  };

  // Deduplicate
  if (isDuplicate(event, enriched)) return;

  // Route to correct emitter
  if (typeof window !== "undefined" && !isServerOnlyEvent(event)) {
    emitClient(event, enriched);
  } else {
    emitServer(event, enriched);
  }
}

/* ------------------------------------------------------------------ */
/*  Server-side emit (for webhook handlers)                            */
/* ------------------------------------------------------------------ */

/**
 * Emit a server-side event (e.g., from Stripe webhook).
 * These are the revenue source of truth.
 */
export function emitServerEvent(event: AnalyticsEvent, props: EventProperties = {}) {
  emitServer(event, {
    platform: "web",
    ...props,
    timestamp: new Date().toISOString(),
    server_side: true,
  });
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function getEventCategory(event: AnalyticsEvent): string {
  if (event.startsWith("play_") || event.startsWith("episode_")) return "playback";
  if (event.startsWith("purchase_") || event.startsWith("subscription_") || event === "paywall_viewed") return "monetization";
  if (event.startsWith("signup_") || event === "login" || event === "app_opened") return "lifecycle";
  if (event === "show_viewed" || event === "search_performed" || event === "share_clicked") return "discovery";
  return "other";
}
