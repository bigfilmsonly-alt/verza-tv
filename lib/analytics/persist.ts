/**
 * Server-only analytics persistence.
 * Inserts a single row into the `analytics_events` table using the service
 * role client (bypasses RLS). Never throws — analytics must never break a
 * request path. Requires migration 004_analytics_events.sql to be applied.
 */

import "server-only";
import { getServiceClient } from "@/lib/supabase/server";
import type { AnalyticsEvent, EventProperties } from "./events";

/** Columns that map to dedicated table columns; everything else → props jsonb. */
const COLUMN_KEYS = new Set([
  "user_id",
  "anon_id",
  "session_id",
  "platform",
  "show_id",
  "episode_number",
  "revenue_cents",
  "currency",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "campaign_id",
  "clip_id",
]);

export async function persistEvent(
  event: AnalyticsEvent,
  props: EventProperties = {},
): Promise<void> {
  try {
    const row: Record<string, unknown> = {
      event,
      platform: props.platform ?? "web",
    };
    const extra: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(props)) {
      if (value === undefined) continue;
      if (key === "timestamp" || key === "server_side") continue;
      if (COLUMN_KEYS.has(key)) {
        row[key] = value;
      } else {
        extra[key] = value;
      }
    }
    row.props = extra;

    const supabase = getServiceClient();
    await supabase.from("analytics_events").insert(row);
  } catch (err) {
    // Swallow — never let analytics break the caller.
    console.error("[analytics/persist] insert failed:", err);
  }
}
