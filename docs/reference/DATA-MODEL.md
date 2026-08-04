# Data model

Last reconciled: **2026-08-03**. SQL migrations plus production readback are
database authority. `lib/supabase/schema.ts` still contains several legacy
minimal interfaces and must not be used as a complete database catalog.

## Code-backed editorial content

`BrowseCategory` is `"drama" | "new" | "popular" | "tubi" | "anime" |
"espanol" | "bollywood" | "creators" | "music" | "reality" |
"red-carpet"`. The web UI folds `new` into Hot, treats Tubi as an
authorized-partner click-through rather than a Verza series collection, and
renders Anime, Español, Bollywood, and Creators as placeholders until their
catalog categories contain releasable titles. Reality titles are excluded from
the Drama grid; Storage Pirates therefore belongs to Reality only on web.

### Catalog

`lib/catalog.ts` contains 80 `Series` rows:

- 79 live and one coming soon;
- 74 paid-live and five wholly free live titles; and
- 4,212 mapped episode rows belonging to live titles.

Core fields include `slug`, `title`, `logline`, `genre`, `channel`,
`categories`, `episodeCount`, `posterUrl`, `freeEpisodes`, status, and rich
metadata fields. `freeEpisodes` is per-title authority; it is not always five.

`coinPerEpisode`, `seasonPassCoins`, `COIN_PACKS`, and coin-related generated
episode fields remain legacy/future data. Coin purchase, balance, episode
unlock, and season-pass APIs fail closed. The active paid product is a canonical
$1.99 full-series unlock resolved by `lib/series-purchase.ts`.

`lib/series-detail.ts` supplies richer descriptions, cast, tags, ratings,
years, and poster mood. Code-backed content is the production source;
`CONTENT_SOURCE=supabase` is not a supported release state.

### Mux capability projections

| Module | Logical rows | Playback capabilities |
| --- | ---: | --- |
| `lib/mux-map.ts` | 4,262 | Complete legacy audit/data-sync anchor; generation/audit only |
| `lib/mux-public-map.ts` | 4,262 | 459 intentionally public IDs; 3,803 IDs omitted |
| `lib/mux-private-map.ts` | 4,262 | `server-only` gateway to complete anchor |
| `lib/mux-signed-map.ts` | 3,753 paid-live correspondences | `server-only` signed IDs |

The 3,803 withheld rows are 3,753 paid-live plus 50 coming-soon rows. Clients may
receive logical episode/duration data without receiving a protected playback
ID. Signed URLs are expiring response capabilities, not database/catalog data.

## Supabase account and access data

### `profiles`

One row per current Supabase auth user. Relevant current fields include:

- account/profile presentation and language;
- legacy `coin_balance` (not an active sale/spend product);
- `is_vip`, `vip_expires_at`, `vip_payment_blocked`, and
  `vip_cancel_at_period_end`;
- `stripe_customer_id` and `stripe_subscription_id`; and
- `deletion_requested_at` to close Checkout/deletion races.

Users can read/update only allowed own-profile data through RLS. Payment linkage
and safety state are server-owned. A Stripe Customer may not silently move to a
new profile merely because provider lookup failed.

### `entitlements`

Current Series access is one row per `(user_id, series_slug)`. Important fields
are `purchase_id`, nullable `episode_number`, `granted_at`, and optional expiry.
Current Series Unlock grants use `episode_number = null` and link to the exact
financial purchase. Grant, revoke, and restoration RPCs lock the purchase row so
an adverse event cannot race a confirmation and resurrect access.

Clients may read their own entitlements. Only verified server/payment flows may
grant current paid access.

### `purchases`

Migration `008` rebuilt the original 001 receipt shape for current Stripe
Checkout. Migrations `010`–`013` add current integrity. Principal fields:

| Field | Meaning |
| --- | --- |
| `id` | Internal immutable purchase UUID |
| `user_id` | Nullable owner; becomes null when retained financial evidence outlives account |
| `type` | `merch`, `series_unlock`, `subscription`, or `vip_renewal` |
| `series_slug` | Canonical Series target where applicable |
| `stripe_session_id` | Unique nullable Checkout Session ID |
| `stripe_payment_intent` | Unique nullable PaymentIntent ID |
| `subtotal_cents` | Pretax product amount |
| `tax_cents` | Collected tax; currently zero with automatic tax off |
| `total_cents` / `amount_cents` | Gross paid total; constrained equal |
| `refunded_cents` / `refunded_at` | Cumulative provider reconciliation |
| `currency` | Canonical lowercase currency, currently USD products |
| `status` | `pending`, `completed`, `partially_refunded`, `refunded`, `failed`, `disputed`, or `disputed_lost` |
| `metadata` | Server-generated non-authoritative supporting data |

Financial arithmetic, canonical product type/status, and provider uniqueness are
database constrained. Client values never establish product, amount, owner, or
status.

### `watch_progress` and saved list

`watch_progress` keys user/series/episode and stores progress, completion, and
update time. The saved-list table keys user/series. RLS limits each to the
current user. These tables do not grant paid access.

### `coin_ledger`

The table remains from the original schema, but no current client endpoint
credits, buys, debits, or spends coins. Do not describe it as an active ledger
until a reviewed atomic coin product, Refund/reversal policy, webhook contract,
and App Store compliance plan exist.

## Service-only payment integrity tables

All tables below have RLS enabled, anon/authenticated privileges revoked, and
service-role access only.

### `stripe_webhook_events`

One row per Stripe Event ID with event/object type, `processing` / `processed` /
`failed` state, attempt count, timestamps, and last error. The claim RPC returns
acquired, busy, or processed and permits stale/failed retry without concurrent
double fulfillment.

### `stripe_refunds`

Provider-idempotent Refund rows keyed by Stripe Refund ID, with Charge,
PaymentIntent, optional purchase link, amount, currency, status, and timestamps.
Cumulative purchase Refund reconciliation is row-locked so overlapping
`refund.*` and `charge.refunded` events do not double-count revenue/access
effects.

### `stripe_disputes`

Rows are keyed by Stripe Dispute ID and retain Charge, PaymentIntent, optional
purchase link, financial amount/currency, provider state/reason, Refund amount,
and last provider event ordering data. Current provider retrieval plus event
time/terminal ranking prevents an old snapshot from overwriting a later
resolution.

### `payment_account_tombstones`

Minimal account-deletion record keyed by deleted Supabase user UUID with an
optional unique Stripe Customer, deletion time, and last payment-event time. It
contains no name, email, entitlement, or profile FK. It lets delayed signed
events preserve financial state/cancel billing without restoring identity,
access, saved data, email, or analytics.

### `vip_checkout_consents`

Private evidence keyed by Checkout Session, with unique Subscription, Customer,
nullable user, Terms version, accepted state, provider Session time, and record
time. A row requires affirmative accepted Terms. VIP remains closed until the
full notice/portal/webhook policy passes.

### `payment_notices`

Private, idempotent evidence for VIP acknowledgment, renewal receipt,
cancellation confirmation, and annual reminder. It stores provider reference,
Subscription, nullable user, one-way recipient digest, amount/currency, period,
Terms version, legal payload, send state/attempt, provider message ID, and
timestamps—never the email address itself.

## Creator and content tables

Creator tables exist for the web pipeline, but creator PPV is disabled and the
iOS 2.0 binary exposes no UGC surface. Migration `009` preserves historical
`creator_sales` financial rows with nullable creator/content links instead of
cascade deletion. Migration `011` hardens creator constraints and RLS.

Migration `002` introduced optional content tables (`shows`, `seasons`,
`episodes_content`, people/tags/articles/internal links), but they are not the
active catalog source. Migration `014` fail-closes optional tables that lacked
complete RLS. Their presence is not permission to flip `CONTENT_SOURCE` or
expose stored Mux IDs.

## Migration authority and order

| Migration | Current purpose |
| --- | --- |
| `001`–`008` | Original schema plus reconciliation to the actual Checkout/profile/entitlement shape |
| `009_preserve_sales_ledger.sql` | Preserve creator financial rows across account/content deletion |
| `010_payment_integrity.sql` | Webhook ledger, provider uniqueness, tax/Refund fields, purchase constraints, row-locked access/Refund RPCs |
| `011_rls_least_privilege.sql` | Least-privilege grants/RLS and creator constraints |
| `012_payment_account_tombstones.sql` | Minimal deletion/payment identity and atomic Customer coalescing |
| `013_stripe_dispute_ledger.sql` | Provider-idempotent ordered Dispute reconciliation |
| `014_payment_notices_and_content_rls.sql` | VIP Terms/notice evidence and fail-closed optional content RLS |

Migrations `009`–`014` are applied and independently read back in the current
production project. Any fresh environment must apply migrations in filename
order and run the rollback-only database suite before matching payment/webhook
code. Never edit an applied migration to change production history.

## RLS and authority rules

- anon/authenticated users receive only explicit own-row or public-safe access;
- service role never enters a browser/native bundle;
- content-table “public” access may never include protected playback
  capabilities;
- profiles, query strings, analytics, browser return, and local storage do not
  grant access; and
- provider financial records can outlive account identity, but cannot recreate
  identity or entitlement after deletion.

See [`../guides/PAYMENTS.md`](../guides/PAYMENTS.md) for exact fulfillment and
adverse-event policy and [`../guides/MUX.md`](../guides/MUX.md) for playback
capability handling.
