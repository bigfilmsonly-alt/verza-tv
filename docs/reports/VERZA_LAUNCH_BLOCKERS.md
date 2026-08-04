# Verza TV — Launch Blockers

> **ARCHIVE — 2026-07-11 blocker snapshot.** Several items were fixed or
> materially changed; others require fresh readback. Do not use this list as the
> submission gate. Current authority:
> [`../LAUNCH-TRUTH.md`](../LAUNCH-TRUTH.md).

Generated 2026-07-11 from a full read-only audit (deterministic checks + 10-agent verification fleet). Every item below was verified against code, the live database, or the production site — not assumed.

Ranking: **P0** = hard launch blocker · **P1** = critical (fix before public/paid launch) · **P2** = important · **P3** = polish.

---

## P0 — Hard blockers (must fix before taking money or submitting)

### P0-1 · Merch checkout charges live cards with no shipping address
- **Evidence:** `app/api/checkout/route.ts:56-66` creates a live Stripe session for physical goods with no `shipping_address_collection`.
- **Impact:** A customer can be charged real money for merch you cannot ship — chargebacks and App Store/consumer-law exposure.
- **Fix:** Add `shipping_address_collection` to the merch checkout **or** hide the shop until fulfillment exists. (Fast path: hide `/shop` for launch.)

### P0-2 · Native iOS app does not exist in this repo
- **Evidence:** No `ios/`, `android/`, Capacitor, React Native, or Expo config anywhere (verified).
- **Impact:** There is nothing to submit to the App Store yet. The web product is ready; the wrapper is not built.
- **Fix:** Commission/build the iOS wrapper (WebView loading `https://www.verzatv.com?platform=ios`, or a light native shell). This is the gating dependency for the entire App Store goal.

---

## P1 — Critical (fix before public launch / real revenue)

### P1-1 · Paywall is bypassable — entire paid catalog streams free
- **Evidence:** Locked episodes' unsigned Mux playback IDs ship in public SSG HTML (`app/series/[slug]/[episode]/page.tsx:105-114`); a locked episode's `.m3u8` returns **HTTP 200 with no auth** (verified live). The paywall is a client-side overlay only.
- **Impact:** Anyone using view-source can watch every paid episode free. This directly undermines the revenue model.
- **Fix options:** (a) Configure **Mux signed playback URLs** (`MUX_SIGNING_KEY_ID/SECRET`) and serve tokens only to entitled users — the real fix; (b) accept the model as freemium/ad-supported and stop calling it "locked." Decision required.

### P1-2 · Stripe webhook is missing subscription/refund events
- **Evidence:** The endpoint is subscribed to only `checkout.session.completed` + payment-intent events; all `customer.subscription.*`, `invoice.*`, and refund handlers are dead code.
- **Impact:** A VIP who cancels **keeps access forever**; refunds don't revoke access; renewals aren't tracked. (0 subscriptions have ever been sold, so no live harm yet — but it must be fixed before selling VIP.)
- **Fix:** In the Stripe Dashboard, add `customer.subscription.created/updated/deleted`, `invoice.payment_succeeded/failed`, and `charge.refunded` to the webhook endpoint. No code change needed — the handlers already exist.

### P1-3 · Purchase pipeline never proven end-to-end
- **Evidence:** Live Stripe shows $71.85 lifetime (19 charges, 0 subs); the live DB has **0** rows in `purchases`, `entitlements`, and `pending_entitlements`. No purchase has traversed the 2026-07-10 repaired pipeline.
- **Impact:** The code is correct on trace, but the deployed webhook secret / fulfillment has never been observed working.
- **Fix:** Make one real $1.99 test purchase and confirm an `entitlements` row appears and the series unlocks after browser restart.

### P1-4 · Migration 009 not applied — account deletion destroys the sales ledger
- **Evidence:** Verified live via `pg_constraint`: `creator_sales.creator_id` is still `ON DELETE CASCADE`. `/api/account/delete` deletes the profile → cascades → **destroys financial/tax records**.
- **Impact:** Deleting a creator account wipes required financial records; also contradicts the privacy policy's retention clause. (A code guard currently blocks creator-with-sales deletions, so no live harm yet.)
- **Fix:** Apply `supabase/migrations/009_preserve_sales_ledger.sql` in the Supabase SQL editor (~30 seconds).

### P1-5 · Mux webhook accepts unsigned payloads
- **Evidence:** `app/api/mux/webhook/route.ts:21-27` skips signature verification when `MUX_WEBHOOK_SECRET` is unset (absent locally; production value unverified).
- **Impact:** Forged `asset.ready` events could inject playback IDs into `creator_content`. Low likelihood, real risk.
- **Fix:** Set `MUX_WEBHOOK_SECRET` in Vercel + configure the signing secret in the Mux dashboard, or disable the endpoint until creator uploads go live.

### P1-6 · Analytics captures almost nothing
- **Evidence:** `analytics_events` contains **only 121 `paywall_viewed` rows** (verified live). Play, search, checkout, and purchase events are never persisted. `window.gtag` is never defined, so GA4 custom events are silent no-ops.
- **Impact:** No conversion funnel is computable — you'll be flying blind at launch, unable to see where users drop off.
- **Fix:** Wire the client event emitters to persist to `analytics_events` (or a real analytics tool), and define the `gtag` shim / confirm the GTM container forwards events.

### P1-7 · Admin dashboard shows all zeros
- **Evidence:** `app/api/admin/stats/route.ts:76,82,87` queries nonexistent columns (`watch_progress.id`, `saved_list.id`, `entitlements.created_at`) — confirmed Postgres 42703 errors, rendered as silent zeros.
- **Impact:** The only operational dashboard the team has reports nothing.
- **Fix:** Correct the column names to the real schema.

### P1-8 · OAuth sign-in may be a dead end
- **Evidence:** Google/Apple sign-in buttons ship unconditionally (`OAuthButtons.tsx:77,86`); Supabase provider configuration is **UNVERIFIED**.
- **Impact:** If the providers aren't enabled in Supabase, tapping them fails — a broken first impression. (Apple sign-in is also required by App Store rules if Google is offered.)
- **Fix:** Confirm Google **and** Apple providers are enabled/configured in Supabase, or hide the buttons.

### P1-9 · Owner may be locked out of /admin
- **Evidence:** the historical allowlist comparison found a possible owner mismatch; account/email identifiers are intentionally omitted.
- **Impact:** An authorized owner could be unable to reach `/admin` if the approved login is absent.
- **Fix:** Add the owner's real email to `ADMIN_EMAILS`.

### P1-10 · Creator payment/notification gaps (only if launching creators)
- `/api/creator-unlock` omits `userId`/`client_reference_id` → buyers can lose paid access on email mismatch.
- Creator approval emails go to the **team**, not the creator (`admin/creators/route.ts:95`), despite the UI promising otherwise.
- **Fix:** Only relevant if the creator program launches with the app; otherwise defer.

---

## P2 — Important

- **148MB `public/posters-backup-20260617/` is deployed and publicly served** (verified 200 on production). Bloats every deploy and leaks originals. → Delete the folder.
- **Fake view/like counts** shown to users (`app/series/[slug]/page.tsx:75`, `ShortsFeed.tsx:33`). Honesty/consistency risk. → Remove or make real.
- **Doubled page titles**: `... | VERZA TV | VERZA TV` on episode/genre pages (verified live). → Fix the metadata template.
- **iOS reader mode leaks $1.99 badges** in `SeriesInfoDrawer`/`EpisodeDropdown` (not gated). → Wrap in `HideInIOSApp`.
- **6 of 10 merch prices are unconfirmed `// TODO`** yet charged live (`lib/products.ts`). → Confirm before shop launch.
- **AI creator tools are UI-only** (`@anthropic-ai/sdk` not installed, no key, `/api/studio/generate` is a 501 stub returning canned text). → Remove the UI or provision the SDK+key.
- **Zero automated tests, no CI gate** on a live revenue product. → Add at least a build+typecheck CI check.
- **Rate limiter is per-serverless-isolate** (`middleware.ts:10-13`) — ineffective at scale. → Move to a shared store (Upstash/Vercel KV) if abuse appears.
- **StorageBlue/affiliate tiles lack FTC "Ad"/"Sponsored" labels.** → Add disclosures.

---

## P3 — Polish

- ~4,300 lines of dead code (`Player.tsx`, `HeroVideo.tsx`, `PosterSkeleton.tsx`, `AskVerza`, `InstallPrompt`, `CoinPaywall`, `FeedSearch`, `HeroCarousel`, `RedCarpetHero`) — remove for maintainability.
- Defunct coin system remnants (`COIN_PACKS`, `coin_ledger` table, `/api/coins/*` 501 stubs).
- Duplicate `my_list` vs `saved_list` tables — consolidate.
- Orphaned routes: `/learn/*` (no links, not in sitemap), `/horizontal` (duplicate Storage Pirates), `/me/list` (hardcoded empty).
- Unused Supabase content-CMS tables (migration 002) holding no live data.
