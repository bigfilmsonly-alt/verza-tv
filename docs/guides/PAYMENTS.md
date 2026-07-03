# Payments

> **IMPORTANT:** Legal pages (/terms, /privacy, /refund-policy) are DRAFTS and must be
> reviewed by an attorney before production payments go live. Do NOT switch to live Stripe
> keys until legal review is complete.

The money path end to end. All payment routes are currently stubbed behind
environment-variable checks. Plug in `STRIPE_SECRET_KEY` and
`STRIPE_WEBHOOK_SECRET` to activate the live flow.

---

## Coin Packs

Coins are the primary in-app currency. Users buy packs through Stripe, then
spend coins to unlock episodes. Every pack includes a bonus.

| Pack    | Coins | Bonus | Total Coins | Price   | Notes      |
| ------- | ----- | ----- | ----------- | ------- | ---------- |
| Starter | 100   | 50    | 150         | $1.99   |            |
| Fan     | 300   | 30    | 330         | $4.99   |            |
| Binge   | 700   | 100   | 800         | $9.99   | Popular    |
| Super   | 1,500 | 300   | 1,800       | $19.99  |            |
| Mega    | 3,500 | 1,000 | 4,500       | $49.99  | Best value |

Source of truth: `lib/config.ts` (`COIN_PACKS` array). Prices are stored in
cents (e.g. `199` = $1.99).

Formatting helpers live in `lib/coins.ts`:

- `formatCoins(n)` -- adds locale commas (`1500` -> `"1,500"`)
- `formatPrice(cents)` -- converts cents to dollars (`499` -> `"$4.99"`)
- `computeSeasonPass(episodeCount, freeEps, coinsPerEp)` -- calculates the
  discounted season-pass price

---

## Episode Unlock

- **Cost:** 49 coins per episode (configurable per series via
  `series.coinPerEpisode`, default `DEFAULT_COIN_PER_EPISODE` in
  `lib/config.ts`)
- **Entitlement:** unlock once, watch forever -- stored in the Supabase
  `entitlements` table with `(user_id, series_slug, episode_number)`
- **Route:** `POST /api/unlock` with body `{ seriesSlug, episodeNumber }`
- On success the server debits coins from `profiles.coin_balance`, writes a
  `coin_ledger` entry, and creates the entitlement row (all in one
  transaction via `supabase.rpc("unlock_episode", ...)`)

---

## Season Pass

- **Discount:** ~67% off the sum of all paid episodes
- **Calculation:** `Math.round((episodeCount - FREE_EPISODES) * coinsPerEp * 0.67)`
- **Entitlement:** a single row with `episode_number = NULL` grants access
  to every episode in the series
- **Route:** `POST /api/unlock/season-pass` with body `{ seriesSlug }`

---

## Free Gate

The first 5 episodes of every series are free (`FREE_EPISODES = 5` in
`lib/config.ts`). Enforced server-side in:

- `GET /api/entitlements/check?series=<slug>&episode=<n>` -- returns
  `{ entitled: true, reason: "free" }` for episodes 1-5
- `POST /api/unlock` -- rejects unlock requests for free episodes

---

## VIP Subscription

- **Weekly:** $19.99/week (`VIP_WEEKLY = 1999`)
- **Yearly:** $199.00/year (`VIP_YEARLY = 19900`)
- Grants unlimited access to all episodes across all series
- Entitlement check returns `reason: "vip"` when a VIP subscription is active

---

## Stripe Flow -- Coin Purchases

```
Client                  Server                      Stripe
  |                       |                           |
  |-- POST /api/coins/purchase { packId } ----------->|
  |                       |-- PaymentIntent.create --->|
  |<-- { clientSecret } --|                           |
  |                       |                           |
  |-- confirmCardPayment(clientSecret) -------------->|
  |                       |                           |
  |                       |<-- webhook: payment_intent.succeeded
  |                       |                           |
  |                       |-- credit coins (profiles + coin_ledger)
  |                       |-- mark purchase completed |
```

1. Client sends `POST /api/coins/purchase` with `{ packId, paymentMethodId? }`
2. Server validates the pack, creates a Stripe `PaymentIntent` for
   `pack.price` cents with metadata `{ userId, packId, coinsTotal }`
3. Client receives `clientSecret` and completes payment via Stripe.js
4. Stripe fires `payment_intent.succeeded` to `POST /api/stripe/webhook`
5. Webhook handler reads metadata, credits `coins + bonus` to the user via
   `supabase.rpc("credit_coins", ...)`, and marks the purchase row as
   `completed`

---

## Stripe Flow -- Merch Checkout

```
Client                  Server                      Stripe
  |                       |                           |
  |-- POST /api/checkout { items } ------------------>|
  |                       |-- Checkout.session.create->|
  |<-- { url } -----------|                           |
  |                       |                           |
  |-- redirect to Stripe Checkout URL --------------->|
  |                       |                           |
  |                       |<-- webhook: checkout.session.completed
  |                       |                           |
  |                       |-- fulfill order (merch_orders table)
```

1. Client sends `POST /api/checkout` with `{ items: CartItem[] }`
2. Server creates a Stripe Checkout Session with line items, success/cancel
   URLs, and metadata `{ userId, itemCount }`
3. Client redirects to the Checkout URL
4. On completion, Stripe fires `checkout.session.completed` to
   `POST /api/stripe/webhook`
5. Webhook handler marks the merch order as `paid` and triggers fulfillment

---

## Webhook Security

`POST /api/stripe/webhook` verifies every request using
`stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET)`.
This route must NOT be behind auth middleware -- Stripe sends requests
directly and authenticates via the `stripe-signature` header.

Handled event types:

| Event                          | Action                           |
| ------------------------------ | -------------------------------- |
| `payment_intent.succeeded`     | Credit coins to user             |
| `checkout.session.completed`   | Fulfill merch order              |

---

## Entitlement Hierarchy

When checking whether a user can watch an episode, the server evaluates in
this order:

1. **Free gate** -- episode number <= 5 -> always entitled
2. **VIP subscription** -- active VIP -> entitled to everything
3. **Season pass** -- entitlement row with `episode_number = NULL` for the
   series -> entitled to all episodes in that series
4. **Single episode purchase** -- entitlement row matching
   `(series_slug, episode_number)` -> entitled to that episode

Route: `GET /api/entitlements/check?series=<slug>&episode=<n>`

---

## Activation Checklist

All payment logic is stubbed and safe to deploy without keys. To go live:

1. Set `STRIPE_SECRET_KEY` in Vercel environment variables
2. Set `STRIPE_WEBHOOK_SECRET` (from `stripe listen` or the Stripe Dashboard
   webhook endpoint config)
3. Set `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` for client-side Stripe.js
4. Wire Supabase auth (`createClient()` calls in each route)
5. Create the database tables: `profiles`, `coin_ledger`, `entitlements`,
   `purchases`, `merch_orders`
6. Create the RPC functions: `credit_coins`, `unlock_episode`,
   `purchase_season_pass`
7. Register the webhook URL in Stripe Dashboard:
   `https://verzatv.com/api/stripe/webhook`
