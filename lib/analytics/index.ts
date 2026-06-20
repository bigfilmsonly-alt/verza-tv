/**
 * Analytics — public API
 *
 * Client usage:
 *   import { emit } from "@/lib/analytics"
 *   emit("play_started", { show_id: "my-series", episode_number: 1 })
 *
 * Server usage (webhooks):
 *   import { emitServerEvent } from "@/lib/analytics"
 *   emitServerEvent("purchase_completed", { revenue_cents: 499 })
 */

export { emit, emitServerEvent } from "./emit";
export type { AnalyticsEvent, EventProperties } from "./events";
export { SERVER_ONLY_EVENTS, isServerOnlyEvent } from "./events";
