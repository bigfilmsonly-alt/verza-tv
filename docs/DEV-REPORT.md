# Verza TV — Developer Report

**Updated:** June 28, 2026
**Status:** LIVE in production — https://www.verzatv.com
**Latest deploy:** `verza-hpex5pzju-codevibes.vercel.app` (READY)
**Latest commit:** `659f09a`

---

## 1. Snapshot

| Metric | Value |
| --- | --- |
| Production URL | https://www.verzatv.com (live) |
| Stack | Next.js 16.2.9 · TypeScript · Tailwind v4 · React 19 |
| Hosting | Vercel (codevibes/verza-tv) |
| Repo | github.com/bigfilmsonly-alt/verza-tv (`main`) |
| Total commits | 265 |
| App/lib/component LOC | ~34,700 (TS/TSX) |
| API routes | 21 |
| DB migrations | 6 |
| Live series | 76 |
| Mux streams | 4,160 (all healthy) |
| Merch products | 10 |

Backend: Supabase (auth + 6 tables, RLS on all), Mux (unsigned public playback),
Stripe (payments + webhook = revenue truth), Anthropic (AI host + creator studio).

---

## 2. Recent sprint — what shipped

### 2.1 Analytics event stream (`analytics_events`)
End-to-end funnel + retention persistence, replacing the prior console-only emitter.

- `supabase/migrations/004_analytics_events.sql` — event-stream table. RLS enabled
  with **no policies** → service-role-only read/write; the raw stream stays private.
  Indexed for funnel scans (event, created_at), per-identity rollups (user_id,
  anon_id), and attribution (show_id, utm_campaign).
- `lib/analytics/persist.ts` — server-only `persistEvent()`; inserts via the service
  client, maps known fields to columns and everything else to `props` jsonb, and
  **never throws** (analytics can't break a request or a checkout).
- `app/api/events/route.ts` — client sink. Validates against an allow-list of
  non-revenue events, strips `revenue_cents`/`currency`, rejects server-only events
  so the client can never forge revenue. Rate-limited by middleware (30/min/IP).
- `lib/analytics/emit.ts` — every client `emit()` now beacons to `/api/events` with a
  stable `localStorage` anon_id (`verza_anon_id`), alongside GA4 + Vercel Analytics.
- `app/api/stripe/webhook/route.ts` — server-verified `purchase_completed` and
  `subscription_*` events now `persistEvent()` real revenue rows.

> **Manual step pending:** run `004_analytics_events.sql` in the Supabase SQL Editor
> (project `jejispfvlkwastzvwtwu`). Until then inserts no-op silently by design. The
> repo only carries the service-role key (no DDL rights / no DB password), so the
> table cannot be created from CI.

### 2.2 Video performance layer (Phase A + B)
- `lib/perf/ttff.ts` — client TTFF tracker (time-to-first-frame, preload hit/miss,
  rebuffer count, active rendition) on a ring buffer.
- Connection warming + capped next-item prefetch in `ShortsFeed.tsx` and `Player.tsx`.
  Prefetch is limited to the next 1–2 items and **never warms locked/paid episodes**.
- `lib/perf/seed.ts` + `components/PerfHarness.tsx` + `app/dev/perf/page.tsx` —
  measurement harness gated behind `PERF_TEST_MODE`, noindexed.
- (Phase C signed-URL work deferred — Mux playback remains unsigned/public.)

### 2.3 Monetization KPIs on the admin dashboard
- `app/api/admin/stats/route.ts` — added ARPPU, paying-users, and free→paid rate,
  all computed from server-verified Stripe + Supabase data (no new vendor).
- `components/AdminDashboard.tsx` — new monetization KPI row.

### 2.4 pSEO + sitemap
- Data-driven sitemap registry, shows-by-genre sitemap, JSON-LD, footer Sitemap link.

### 2.5 Reality tab polish
- StorageBlue ("cheapest self storage") sponsor ribbon added in the Reality tab,
  stacked flush on top of Storage Pirates (new `embedded` prop on `HorizontalFeed`
  drops the standalone page's `pt-16` header clearance when embedded).
- Lone Storage Pirates poster now centers under the middle column via a spacer cell.

---

## 3. Architecture notes
- Single-render layout: `.device-frame > .device-screen > .app-shell > main`.
  Desktop adds an iPhone frame with scroll; mobile has **no** overflow on
  `.device-screen` (preserves `position:fixed` on iOS Safari).
- Video: muted-first autoplay, `mutedRef` (not state) in async callbacks,
  `vid.load()` after `src` change. CSP uses `https://*.mux.com` wildcard.
- `emit.ts` must **not** import `persist.ts` — `server-only` would break the client
  bundle. The Stripe webhook imports `persist.ts` directly.

---

## 4. Open items
| Item | Owner | Notes |
| --- | --- | --- |
| Run `004_analytics_events.sql` | manual | Activates the event stream (no redeploy needed) |
| Run `pending_entitlements` table | manual | Existing pending migration |
| PostHog install | needs Alan | Account + key |
| Mux Data QoE (TTFF/rebuffer in dashboard) | needs Alan | Mux Data API token |
| Confirm 6 merch prices | needs Alan | joggers, hoodies, jacket, cap, tee |
| "Too Much Junk" genre | needs Alan | music vs reality/comedy label |

---

## 5. Revenue surfaces (all live via Stripe)
- Series unlock — $4.99/series
- VIP — $9.99/mo or $79.99/yr
- Merch — 10 products, $15–$110
- Creator channels — 80% rev share (application at `/studio`)
