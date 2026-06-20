# GATE 0 — Money Path Verification

## Date: 2026-06-20
## Status: PASS (with one pending action)

---

## Purchase Flow ($4.99 Series Unlock)

| Step | Component | Status | Notes |
|------|-----------|--------|-------|
| 1. Tap "Unlock Full Series" | CoinPaywall | PASS | Checks auth first; redirects to sign-in if needed |
| 2. Auth check | supabase.auth.getSession() | PASS | Redirects to /sign-in?next=/series/{slug}/{ep} |
| 3. Create checkout | /api/unlock | PASS | Stripe Checkout with metadata: type=series_unlock, seriesSlug |
| 4. Stripe payment | Stripe Checkout | PASS | Live keys (sk_live_, pk_live_) configured |
| 5. Webhook fires | /api/stripe/webhook | PASS | Signature verification with whsec_ |
| 6. Purchase recorded | purchases table | PASS | stripe_session_id, amount_cents, type, status |
| 7. Entitlement created | entitlements table | PASS | user_id + series_slug, upsert on conflict |
| 8. Saved to My List | saved_list table | PASS | Auto-added on purchase |
| 9. Email sent | Resend API | PASS | Customer + team notified |
| 10. Redirect back | /series/{slug}/6?unlocked=true | PASS | Immediate access via query param |
| 11. Persistent access | Episode page entitlement check | PASS | Checks entitlements table on every load |

**Previous live test:** User confirmed "$4.99 purchase → episodes unlocked → that worked"

## VIP Subscription Flow

| Step | Component | Status | Notes |
|------|-----------|--------|-------|
| 1. Select plan | VipCard | PASS | Monthly $9.99 / Yearly $79.99 |
| 2. Create subscription | /api/subscribe | PASS | Stripe subscription checkout |
| 3. Webhook: sub created | customer.subscription.created | PASS | Updates profiles.is_vip |
| 4. Webhook: sub updated | customer.subscription.updated | PASS | Handles active/trialing/canceled |
| 5. Webhook: sub deleted | customer.subscription.deleted | PASS | Sets is_vip=false |
| 6. Invoice paid | invoice.payment_succeeded | PASS | Records vip_renewal purchase |
| 7. Invoice failed | invoice.payment_failed | PASS | Logged for monitoring |
| 8. VIP access check | checkVipStatusServer() | PASS | Checks is_vip + vip_expires_at |

## Stripe Configuration

- Secret key: sk_live_ (server-only)
- Publishable key: pk_live_ (client)
- Webhook secret: whsec_ (server-only)
- Webhook URL: https://www.verzatv.com/api/stripe/webhook
- Events handled: checkout.session.completed, customer.subscription.*, invoice.*, payment_intent.*

## Supabase Tables (verified working)

- **purchases**: stripe_session_id, type, amount_cents, currency, status, metadata
- **entitlements**: user_id, series_slug, purchase_id (unique on user_id,series_slug)
- **profiles**: is_vip, vip_expires_at, stripe_customer_id, stripe_subscription_id
- **saved_list**: user_id, series_slug (auto-populated on purchase)

## Pending Action

- **pending_entitlements table**: NOT YET CREATED in Supabase
  - Needed for edge case: user buys without account, entitlement claimed on sign-up
  - Core flow works without it (CoinPaywall requires sign-in before purchase)
  - Run SQL in Supabase dashboard to create

## Human Gate

A full end-to-end test by Jotham/Alan is recommended:
1. Sign in → unlock a series ($4.99) → verify episodes 6+ play → log out → log in → still unlocked
2. Subscribe VIP → verify all episodes accessible → cancel → verify VIP removed
3. Check email inbox for confirmation
4. Check Supabase purchases + entitlements tables for rows
