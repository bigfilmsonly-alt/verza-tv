# Architecture

Last reconciled: **2026-08-03**. Current launch status is in
[`../LAUNCH-TRUTH.md`](../LAUNCH-TRUTH.md); this page describes source
architecture, not proof of production deployment.

## System boundary

Verza TV is a Next.js 16 App Router web application and the backend for the
Expo SDK 57 client in sibling repo `../../verza-native`.

```text
Web browser                         Native iOS / Android
     |                                      |
     +---------- HTTPS / Bearer-cookie -----+
                            |
                    Next.js on Vercel
                 pages, APIs, authorization
                   /       |        \
             Supabase     Stripe     Mux
           auth/data/RLS  payments   HLS/JWT
```

The native app contains no backend secret and does not implement business
authority. It uses Supabase directly only where RLS is the boundary and calls
`https://www.verzatv.com` APIs for server operations.

## Rendering and route flow

- Server Components render crawlable catalog/legal/editorial pages.
- Client components own interactive browsing, players, auth prompts, and
  browser Checkout handoff.
- API route handlers authenticate, validate canonical products, reconcile
  providers, and return private capabilities.
- Preview/non-production deployments are noindex.
- iOS-specific reader-mode routes are implemented in native; shared data is not
  edited to hide platform content.

Selected flow:

```text
catalog/list page
  -> lib/catalog.ts + series-detail.ts
  -> client-safe lib/mux-public-map.ts

free episode
  -> intentionally public playback ID
  -> Mux public HLS

paid episode
  -> GET /api/playback/<slug>--<episode>
  -> cookie/Bearer auth + VIP/series entitlement
  -> lib/mux-private-map.ts + mux-signed-map.ts
  -> short-lived signed HLS URL (private/no-store)

$1.99 Series Unlock (web / eligible Android only)
  -> POST /api/unlock
  -> canonical server offer + Stripe Customer/history scan
  -> Stripe-hosted Checkout
  -> signed webhook and/or authenticated exact confirmation
  -> immutable purchase + purchase-linked entitlement
```

Browser return is never entitlement authority.

## Catalog/content

The active editorial source is TypeScript, not Supabase:

| Module | Role |
| --- | --- |
| `lib/catalog.ts` | 80 titles: 79 live, 74 paid-live, five wholly free, one coming soon |
| `lib/series-detail.ts` | Rich title metadata |
| `lib/mux-public-map.ts` | Generated client-safe logical episode projection |
| `lib/content/code-source.ts` | Active SEO/content adapter using only public projection |
| `lib/content/supabase-source.ts` | Scaffold; not production-ready |

Each title's `freeEpisodes` determines preview access. Coin/season-pass fields
remain dormant future-product metadata and are not active monetization.

## Playback capability architecture

| Module | Rows/capability | Import boundary |
| --- | --- | --- |
| `lib/mux-map.ts` | Complete 4,262-row legacy-capability audit anchor | Audit/generation only |
| `lib/mux-public-map.ts` | 4,262 logical rows; 459 public IDs, 3,803 IDs withheld | Web/native client-safe runtime |
| `lib/mux-private-map.ts` | Gateway to complete anchor | `server-only` |
| `lib/mux-signed-map.ts` | All 3,753 paid-live public-to-signed counterparts | `server-only` |
| `lib/mux-playback.ts` | Public/signed URL construction and JWT issuance | Server only |

The 3,803 withheld rows comprise 3,753 paid-live and 50 coming-soon rows. Signed
mode fails closed for missing/invalid map/key/flag state. URL responses are
account-scoped, private/no-store, expiry-aware bearer capabilities and omit a
separate paid `playbackId`.

Production signed mode is live. Canary readback proved unentitled 402/no
capability and entitled `policy=signed`, no separate playback ID, 1,800-second
tokenized stream/poster URLs, and a 200 HLS manifest. Final standalone native
acceptance remains open. Legacy paid public IDs must coexist because the live 1.2 native app uses them; retirement is a separate
post-2.0 forced-update/drain decision.

## Supabase identity and data

Principal live payment/access tables and ledgers include:

- `profiles` — current account/VIP projection and payment-safety flags;
- `entitlements` — durable full-series grants (`episode_number = null`);
- `purchases` — immutable provider IDs and subtotal/tax/total/status;
- `stripe_webhook_events` — idempotent event claims/attempts;
- `stripe_refunds` and `stripe_disputes` — provider reconciliation;
- `vip_checkout_consents` and `payment_notices` — private consent/notice
  evidence;
- `payment_account_tombstones` — deletion/provider-event safety;
- `watch_progress` and saved-list data; and
- `coin_ledger` — legacy table with no active purchase/spend product.

Browser/native clients use anon credentials with RLS. Service-role access is
server-only. Payment creation/confirmation, portal, entitlement lists, and paid
playback resolve the current user from a verified cookie or Supabase Bearer
token.

Migrations `009`–`014` implement the current financial preservation, payment
integrity, least privilege, deletion tombstones, disputes, consent, notices, and
content-RLS hardening. They must precede matching webhook code.

## Payment architecture

The active sellable digital product is the canonical one-time $1.99 Series
Unlock. Both VIP plans ($9.99/month, $79.99/year) are hidden/API-blocked. Coins,
creator PPV, and official merch Checkout fail closed.

Core safeguards:

- server-owned user, product, amount, currency, Customer, Terms policy, and
  metadata;
- paginated durable Checkout-history recovery before creating another Session;
- exact provider Session/PaymentIntent/Charge/Refund/Dispute validation;
- webhook idempotency plus row-locked grant/revoke/recovery RPCs;
- deleted-account tombstones that retain financial evidence without restoring
  identity/access; and
- browser return never grants access by itself.

Live Terms consent supports explicit `false` compatibility and exact `true`
required modes; missing/malformed live state fails closed. Production now has
August 3 legal/support, live compatibility capabilities with VIP false, and one
exact-19 canonical webhook. Final Terms/portal cutover still requires exact
`true`, a restricted Billing Portal, and controlled smoke-purchase evidence.
Automatic tax remains off with zero active registrations.

## Platform commerce boundary

- Web and eligible Android use server-created Stripe-hosted Checkout for Series
  Unlock.
- iOS 2.0 is reader mode and contains no digital price/CTA/link/direction.
- There is no native or browser client-side Stripe SDK/card form.
- Official merch Checkout is feature-gated off.
- Amazon is web/retained Android only and fail-closed in iOS 2.0.
- Native iOS UGC, ads, affiliate placements, and payment-bearing non-core routes
  redirect before query/render.

## Layout and source directories

```text
app/                    App Router pages and API routes
components/             shared client/server web UI and players
lib/                    content, Mux, Stripe, auth, Supabase, SEO, policy
lib/content/            adapter and indexability layer
lib/supabase/           browser/server clients and typed schema
scripts/                read-only audits, generators, guarded provider ops
supabase/migrations/     ordered database migrations
public/                 web assets
docs/                   operational docs and explicitly archival evidence
```

Desktop web uses the current framed shell; mobile web renders directly. These
presentation details are independent of the native Expo shell.

See [`../guides/PAYMENTS.md`](../guides/PAYMENTS.md),
[`../guides/MUX.md`](../guides/MUX.md), and
[`../guides/REACT-NATIVE-SYNC.md`](../guides/REACT-NATIVE-SYNC.md) for release
and cross-platform invariants.
