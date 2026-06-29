/**
 * Central Analytics Event Definitions
 * Single source of truth for all trackable events across the platform.
 * Used by both client-side (track.ts) and server-side (emit.ts) tracking.
 */

/* ------------------------------------------------------------------ */
/*  Event Types                                                        */
/* ------------------------------------------------------------------ */

export type AnalyticsEvent =
  // Lifecycle
  | "app_opened"
  | "signup_started"
  | "signup_completed"
  | "login"
  // Content discovery
  | "show_viewed"
  | "episode_viewed"
  | "search_performed"
  | "share_clicked"
  // Playback
  | "play_started"
  | "play_completed"
  | "play_progress"        // Periodic progress updates
  // Monetization
  | "paywall_viewed"
  | "purchase_started"
  | "checkout_started"     // Client: tapped buy, redirected to Stripe (no revenue)
  | "purchase_completed"   // Server-side only (Stripe webhook)
  | "subscription_started" // Server-side only (Stripe webhook)
  | "subscription_renewed" // Server-side only (Stripe webhook)
  | "subscription_cancelled" // Server-side only (Stripe webhook)
  | "refund";              // Server-side only (Stripe webhook), negative revenue

/* ------------------------------------------------------------------ */
/*  Event Properties                                                   */
/* ------------------------------------------------------------------ */

export interface EventProperties {
  // Identity
  user_id?: string;
  anon_id?: string;
  session_id?: string;
  platform?: "web" | "ios" | "android";

  // Content context
  show_id?: string;
  show_title?: string;
  episode_id?: string;
  episode_number?: number;

  // Campaign / attribution
  campaign_id?: string;
  clip_id?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;

  // Revenue (server-side only)
  revenue_cents?: number;
  currency?: string;
  stripe_session_id?: string;
  purchase_type?: string;
  plan_type?: "series_unlock" | "vip_monthly" | "vip_yearly";
  surface?: string;

  // Engagement
  duration_seconds?: number;
  progress_percent?: number;
  search_query?: string;
  share_platform?: string;

  // Generic
  [key: string]: string | number | boolean | undefined;
}

/* ------------------------------------------------------------------ */
/*  Server-side event sources (revenue truth)                          */
/* ------------------------------------------------------------------ */

/**
 * Events that MUST come from the server (Stripe webhooks).
 * Client-side events for these are informational only — the server
 * event is the source of truth for revenue reporting.
 */
export const SERVER_ONLY_EVENTS: AnalyticsEvent[] = [
  "purchase_completed",
  "subscription_started",
  "subscription_renewed",
  "subscription_cancelled",
  "refund",
];

export function isServerOnlyEvent(event: AnalyticsEvent): boolean {
  return SERVER_ONLY_EVENTS.includes(event);
}
