# Payments and access

This document describes the payment system that exists in code. It is an
operations and engineering runbook, not a substitute for legal or accounting
review.

> **Stripe baseline, 2026-08-03:** August 3 legal/support and
> authenticated Series capabilities are live in explicit `compatibility` mode;
> both VIP capabilities are false. One canonical enabled Stripe webhook now has
> the exact 19-event allowlist, wildcard off, no second endpoint/replay/secret
> rotation, and rejects unsigned delivery with 400. Stripe Public details is
> still blank; required-consent mode, the restricted portal, and the controlled
> $1.99 Stripe smoke remain open. The August 5 Apple StoreKit backend/migration
> 015/legal/preflight are production-read-back and ASC V2 URLs are exact. No
> real signed notification or Sandbox transaction has completed; all 74 Apple
> products still need IAP review screenshots and the owner/App Store gates in
> [`APPLE-IAP.md`](APPLE-IAP.md).

## Launch state

| Product | Current state | Payment surface |
| --- | --- | --- |
| Full-series unlock — web/eligible Android | Production capabilities configured/live in compatibility mode; $1.99 USD one-time; controlled hardened-path smoke still open | Stripe Checkout |
| Full-series unlock — iOS | Backend/migration/legal/enabled preflight production-read-back; 74 ASC nonconsumables at $1.99 US base/Apple-localized prices; signed notification, actual transaction, screenshots, agreements, tax/trader and TestFlight gates open | Apple StoreKit |
| VIP monthly | Code-ready at $9.99/month; hidden and API-blocked until transactional notices, Billing Portal, and webhook cutover gates pass | Stripe Checkout subscription |
| VIP yearly | Code-ready at $79.99/year; separately hidden and API-blocked until the secured annual 15–45-day reminder path also passes | Stripe Checkout subscription |
| Coins / episode unlocks / coin season passes | Disabled; endpoints fail closed | None |
| Creator PPV | Disabled until authenticated ownership and payout fulfillment are complete | None |
| Official VERZA merchandise | Disabled unless `MERCH_CHECKOUT_ENABLED=true`; do not enable until variants, shipping, tax, inventory, confirmed prices, and fulfillment exist | Stripe Checkout |
| Amazon affiliate products | Enabled; Amazon owns pricing and checkout | Amazon system-browser handoff |

The iOS app offers eligible Series Unlocks only through Apple StoreKit. It never
shows Stripe/web checkout, a competing processor, or external-purchase
direction. StoreKit supplies the localized product price and Apple bills the
customer. The iOS Shop remains physical-order support only, Amazon stays fail-
closed, and VIP remains hidden/API-blocked.

Catalog classification is exact: 80 total titles, 79 live, 74 canonical paid
Series Unlock SKUs/Apple product mappings, five wholly free live titles, and one coming-soon title.
Free-preview counts come from each title's `freeEpisodes`; there is no global
five-episode promise.

## Canonical product rules

`lib/series-purchase.ts` is the server-side authority for a series unlock:

- price: `SERIES_UNLOCK_PRICE_CENTS` (199 cents, USD);
- catalog row exists;
- `status === "live"`;
- `episodeCount > freeEpisodes`; and
- `coinPerEpisode > 0`.

The last two checks are load-bearing. Several live catalog titles are wholly
free and must never be offered or charged as an unlock. Client filtering is
only UX; checkout, confirmation, and webhook fulfillment all repeat the
canonical server-side validation.

VIP prices and intervals come from `VIP_PLANS` in `lib/config.ts`. Checkout
routes must never accept a client-supplied price, title, interval, user ID, or
entitlement target.

`lib/apple-iap-product-manifest.ts` is the separate append-only Apple identity
authority for exactly those same 74 paid-live titles. Each product is a non-
consumable with a $1.99 US base price; the native app displays Apple's localized
StoreKit price. A catalog title can cease new sales without deleting or
recycling its Apple mapping, because restore/refund/revocation processing must
recognize the original forever.

## Authentication and ownership

Digital checkout requires a verified Supabase user. `getUser()` accepts either
the web cookie session or the native client's Supabase bearer token. The
checkout routes derive `userId` and email from that verified session and bind
the identity into all relevant Stripe objects:

- Checkout `client_reference_id`;
- Checkout metadata `userId`;
- series metadata `seriesSlug`, `show_id`, `type=series_unlock`;
- subscription metadata `userId`, `type=vip_subscription`.

Clients check for a session before emitting `checkout_started` and route guests
to sign-in with a local, validated return path. The API repeats the auth check;
client state is never authoritative.

Apple purchases bind the exact lower-cased Supabase user UUID into StoreKit's
`appAccountToken`. The backend verifies that Apple-signed token before a new
purchase can grant access. Restore may not move a purchase from another live
VERZA account; only an explicitly requested restore of an already-ledgered,
orphaned purchase from a provably deleted account may rebind.

## Full-series unlock flow

1. Client calls `POST /api/unlock` with `{ seriesSlug }`.
2. Server authenticates the user, resolves the canonical catalog row, rejects
   non-purchasable/free titles, and checks for an existing entitlement.
3. Before creating anything, the server pages through the Customer's durable
   Stripe Checkout history for this exact account and series. It repairs an
   exact paid Session, reuses exactly one current canonical open Session, and
   blocks pending, conflicting, noncanonical, multiple-open, provider-error, or
   incomplete-history states. Only when that scan proves there is no payable or
   paid Session does it create a USD 199-cent tax-exclusive `mode=payment`
   Checkout Session from canonical product data. Applicable tax is added only
   when the explicit server flag is enabled.
4. Stripe returns to
   `/series/<slug>/<first-paid-episode>?session_id={CHECKOUT_SESSION_ID}`.
5. `GET /api/unlock/confirm?session_id=...&slug=...` retrieves the session from
   Stripe and verifies all of: paid status, payment mode, exact 199-cent
   subtotal, internally consistent tax/total, USD currency, canonical
   sellability, exact slug, series-unlock type, and authenticated owner. It can
   repair an entitlement if the webhook is delayed.
6. The Stripe webhook records the financial purchase and upserts the same
   `(user_id, series_slug)` entitlement and saved-list row.

The success query parameter never grants access by itself. Access is true only
after provider-backed confirmation or a server/RLS entitlement check.

### iOS StoreKit full-series flow

1. Native authenticates the exact Supabase account and calls
   `POST /api/iap/apple/preflight` with the canonical series slug.
2. The server rejects non-paid/non-live/retired products, current VIP or series
   access, deletion-in-progress, mapping drift, missing auth, and any state
   other than exact `APPLE_IAP_ENABLED=true`.
3. Native loads the returned immutable product ID from StoreKit, displays
   Apple's localized `displayPrice`, and starts the non-consumable purchase with
   `appAccountToken` equal to the current Supabase user UUID.
4. Native sends Apple's signed transaction JWS plus expected series to
   `POST /api/iap/apple/transactions`. The server verifies Apple's trust chain,
   bundle/app/environment, product/type/quantity/ownership/reason, exact account
   token, identifiers, and timestamps before calling the row-locked ledger RPC.
5. Only a response with `verified=true` and `finishAuthorized=true` permits
   StoreKit transaction finishing. `accessGranted` is separate: a canonical
   refunded or revoked transaction is durably finishable without access.
6. `POST /api/iap/apple/notifications` independently handles Apple's signed V2
   `ONE_TIME_CHARGE`, `REFUND`, `REVOKE`, and `REFUND_REVERSED` events using an
   idempotent notification ledger and monotonic Apple-signed event clock.
7. Playback still rechecks the materialized entitlement at
   `GET /api/playback/<series>--<episode>`; neither StoreKit UI, a transaction ID,
   nor a native success screen is playback authority.

New-purchase preflight can be disabled without disabling signed transaction
finishing, restore, refund/revocation, or V2 notifications. This is required for
a safe sales rollback. Sandbox/TestFlight fulfillment also requires the signed
account UUID in `APPLE_IAP_SANDBOX_ALLOWED_USER_IDS`.

The exact product registry, payload contracts, deployment order, and test
matrix are in [`APPLE-IAP.md`](APPLE-IAP.md).

### Entitlement-to-playback boundary

Payment completion and media delivery are separate trust boundaries. Stripe
may create/reconcile the purchase and the database may hold an entitlement,
but neither the client nor a success URL receives a Mux ID from that event.
For a paid catalog episode, web and native must call authenticated
`GET /api/playback/<series>--<episode>`. That route independently rechecks
current VIP/series entitlement and returns only a short-lived signed URL after
the signed-playback cutover; a paid response never returns a separate playback
ID. A missing/revoked entitlement returns 402, and incomplete signing
configuration returns 503 with no public fallback.

Client capability caches are memory-only, scoped to the current Supabase user,
and stop reusing a token 90 seconds before its 30-minute expiry. Sign-out,
account switch, or account deletion cannot inherit another user's cached URL.
See [`MUX.md`](MUX.md) for the migration, TestFlight matrix, public-ID retirement
gate, and post-retirement rollback limitation.

Checkout creation uses deterministic idempotency for concurrent/repeated taps,
but idempotency retention alone is not the duplicate-charge boundary. Before
every new Series Checkout, `lib/series-checkout-recovery.ts` scans complete and
open Sessions for the persisted Stripe Customer across every page. A completed
paid Session is reconciled even if both its webhook and original return failed;
one exact open Session is reused. Completed-but-unpaid, identity-conflicting,
noncanonical, or multiple open Sessions are sent to support review rather than
risk another charge. The scan is bounded at 500 provider rows and any provider
failure, broken pagination, or over-limit history fails before Session creation.
If a profile already names a Stripe Customer and that provider object is missing
or deleted, the server preserves the stored link and blocks for support review;
it never substitutes a fresh Customer that would hide the old Checkout history.
Expired unpaid Sessions cannot be completed and are omitted. If Stripe still
retains an expired Session for the creation idempotency key, the route derives a
deterministic recovery key from that expired Session and returns a fresh usable
Session.

## VIP flow

1. Client calls `POST /api/subscribe` with `plan: "monthly" | "yearly"`.
2. Server authenticates the user and loads the profile.
3. It rejects current VIP access and checks Stripe for an existing non-terminal
   subscription. An active/trialing Subscription object alone never repairs
   access: recovery also verifies the canonical latest paid invoice, its single
   paid PaymentIntent, current successful Charge, exact owner/currency/amount,
   and absence of a full refund or dispute. Other non-terminal states are
   blocked so a second subscription cannot be opened.
4. Only an exact Stripe `resource_missing` error is treated as a stale stored
   subscription/customer ID. Other Stripe failures remain fail-closed. A new
   customer is then anchored to the verified account email.
5. Checkout creates a recurring subscription from canonical `VIP_PLANS` data
   and writes verified ownership metadata onto the Checkout Session and
   Subscription.
6. A paid-invoice webhook records and reconciles the invoice/PaymentIntent/
   Charge before it may activate `profiles.is_vip`. Subscription lifecycle
   events can maintain cancellation/expiry state or revoke existing access, but
   cannot create paid access. Every paid invoice is recorded once.

`POST /api/billing-portal` is authenticated, rejects deletion-in-progress,
retrieves a live-mode-consistent Stripe Customer, requires its metadata user ID
to exactly match the signed-in profile, rechecks the unchanged database link,
and uses only the canonical HTTPS `/me` return origin. It also retrieves the
exact `STRIPE_BILLING_PORTAL_CONFIGURATION_ID` and refuses drift before minting
a session. The canonical portal allows billing-address/name/email updates,
payment-method updates, invoice history, and end-of-period cancellation with
reasons. It disables unauthenticated hosted login and subscription plan changes.
Stale, deleted, cross-account, unconfigured, or drifted state fails closed.

Hosted Checkout Terms acceptance is separately gated by
`STRIPE_CHECKOUT_TOS_CONSENT_REQUIRED`. A live key requires the variable to be
exactly `false` or `true`; missing, empty, or malformed values fail closed.
Explicit `false` is the first-deployment compatibility mode: Series Checkout
remains available, Stripe's hosted Terms checkbox is omitted, and new Sessions
retain `tosConsentPolicy=not_required` plus the `tos-not-required` idempotency
identity. Set it to `true` only after Stripe Dashboard **Public details** has the
production Terms URL; Stripe rejects a required Terms checkbox without that
prerequisite. The flag is included in the Checkout idempotency key so an old
open no-consent session cannot be reused after cutover. A completed
`not_required` Session remains eligible for durable paid-purchase recovery. The
VIP card discloses price/interval, automatic renewal, cancellation, paid-period
access, Terms, Privacy, and Refund Policy before the hosted flow.

Stripe's platform Account API does not expose a readback of Public-details
Terms/Privacy URLs and rejects updates to the platform's own account (the
Accounts update method is for connected accounts). On 2026-08-03 the readable
platform fields showed `support_url = null` and no support email. An attempted
support-URL-only update was rejected with no account change. Set and visually
verify Terms `https://www.verzatv.com/terms`, Privacy
`https://www.verzatv.com/privacy`, Support
`https://www.verzatv.com/support`, and `support@verzatv.com` in Stripe
Dashboard. The API-readable statement descriptor is `VERZATV`; do not change
it as part of Public-details setup.

### Subscription acknowledgments and renewal notices

Do not assume Stripe Dashboard email defaults. Stripe documents successful
payment, renewal, and cancellation email settings as Dashboard-controlled, and
the ordinary Stripe API does not expose an auditable readback of those toggles.
The application therefore owns the required customer record independently:

- Checkout activation writes the exact accepted Terms version, Checkout Session,
  Subscription, Customer, user, and provider timestamp to the private
  `vip_checkout_consents` table before any recovery path may grant VIP;
- every first payment sends a retainable acknowledgment with the product,
  amount charged, recurring price/frequency, automatic-renewal terms, next
  renewal date, cancellation deadline/method, support contact, and legal links;
- every successful renewal sends a receipt with the same recurring/cancellation
  information;
- a scheduled or immediate cancellation sends a confirmation and, when
  applicable, the paid-through date; and
- a Vercel cron calls `/api/cron/vip-renewal-reminders` daily. It independently
  verifies each current yearly Stripe Subscription and consent record, then
  sends exactly one reminder per subscription period while 15–45 days remain.

Customer email is sent through Resend with a stable provider idempotency key and
a unique `payment_notices` database claim. The private ledger retains the legal
payload, one-way recipient-email digest, attempt state, provider message ID, and
sent time, but not the email address. Ambiguous sends older than Resend's 24-hour
idempotency window are quarantined for manual review instead of risking an
automatic duplicate.

The application deliberately treats a successful Resend API response plus its
provider message ID as evidence that it sent the notice. Resend distinguishes
that `email.sent` state from later `delivered`, `bounced`, `suppressed`,
`delivery_delayed`, `failed`, and `complained` outcomes in its
[event model](https://resend.com/docs/webhooks/event-types). A signed delivery
webhook is desirable long-term, but its absence alone does **not** block monthly
or yearly under this release policy: the cited automatic-renewal rules require
the business to send the notice, not to prove that the receiving mail server
accepted it. This is an engineering policy, not a legal opinion.

That acceptance is conditional. Before setting
`VIP_TRANSACTIONAL_NOTICES_ENABLED=true`, the verified sending domain must pass
real-inbox and controlled-bounce tests, an identified operator must review
Resend `failed`/`suppressed`/`bounced`/`delivery_delayed`/`complained` events at
least daily, and the escalation/reissue decision must be logged against the
provider message ID without copying the recipient address. Resend exposes these
events in its [email dashboard](https://resend.com/docs/dashboard/emails/introduction)
but retains email data for only 30 days by default, so the operating calendar
and evidence export cannot be informal. If that monitoring ownership is not in
place, keep `VIP_TRANSACTIONAL_NOTICES_ENABLED=false`, which blocks **both**
monthly and yearly. Yearly still has the additional cron, 15–45-day reminder,
legal-review, and explicit yearly-flag gates regardless of email monitoring.

Series Unlock confirmations also use the immutable Checkout Session as a
stable Resend idempotency key. A provider rejection fails the webhook after the
financial row and entitlement are safe, so Stripe can retry the communication
without charging again or duplicating access. The separate VIP ledger remains
the stronger long-term evidence path required for recurring-payment notices.

These controls implement a conservative engineering posture for
[California BPC 17602](https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=BPC&sectionNum=17602)
and current [New York GBL 527-a](https://www.nysenate.gov/legislation/laws/GBS/527-A),
both of which include retainable acknowledgment/cancellation duties and a
15–45-day notice rule for qualifying annual terms. Counsel must still approve
the nationwide policy. `VIP_TRANSACTIONAL_NOTICES_ENABLED` remains false until
the email path is deployed and tested. Yearly additionally remains false unless
`VIP_ANNUAL_RENEWAL_NOTICES_ENABLED`, `VIP_YEARLY_CHECKOUT_ENABLED`, and a
16+ character `CRON_SECRET` are all set. The server API enforces the same gates
as the web UI, so a stale or native client cannot bypass them.
Authenticated native clients read non-secret readiness from
`GET /api/payments/capabilities`. Series Unlock reports whether Checkout is
configured, whether its Stripe key is live, and whether Terms consent is in
`compatibility` or `required` mode; missing/malformed state is explicitly
`unconfigured`. VIP flags return false when absent or malformed. Checkout
routes remain the final enforcement boundary.

## Webhook integrity

`POST /api/stripe/webhook` reads the raw request body and verifies the
`stripe-signature` with `STRIPE_WEBHOOK_SECRET`. Never place this route behind
user authentication.

Migrations `009` through `015` must be applied in filename order before
deploying the matching payment/webhook code. In particular they provide:

- preservation of historical creator financial rows (`009`);
- a durable event ledger and atomic event claim/retry function;
- unique Stripe Checkout Session and PaymentIntent identifiers on purchases;
- canonical purchase type/status constraints which permit VIP invoices,
  partial refunds, and dispute states;
- explicit `subtotal_cents`, `tax_cents`, and `total_cents` purchase fields,
  with an idempotent historical backfill and arithmetic constraint;
- cumulative, row-locked refund reconciliation;
- a service-role-only refund ledger; and
- a service-role-only manual recovery function for historical pending
  entitlements (`010`);
- least-privilege RLS repairs (`011`);
- a minimal, no-email account-deletion tombstone and atomic Customer coalescing
  RPC (`012`);
- a provider-idempotent, service-only Stripe dispute ledger and ordered dispute
  reconciliation RPC (`013`); and
- private, durable VIP Checkout-consent and customer-notice evidence, plus
  fail-closed RLS for optional content tables when present (`014`); and
- append/update-only Apple purchase/notification ledgers, monotonic StoreKit
  reconciliation, and independent Stripe/Apple/manual entitlement sources
  (`015`).

The handler returns 2xx only after durable processing. A failed database or
fulfillment operation is recorded and returns 5xx so Stripe retries. Concurrent
delivery returns a retryable response; already-processed event IDs are safely
acknowledged. Purchase uniqueness also protects against distinct Stripe event
types referring to the same transaction.

The Stripe endpoint must deliver at least:

- `checkout.session.completed`;
- `checkout.session.async_payment_succeeded`;
- `checkout.session.async_payment_failed`;
- `customer.subscription.created`;
- `customer.subscription.updated`;
- `customer.subscription.deleted`;
- `customer.subscription.paused`;
- `customer.subscription.resumed`;
- `invoice.paid` (the canonical paid-invoice event);
- `invoice.payment_failed`;
- `charge.refunded`;
- `refund.created`, `refund.updated`, `refund.failed`;
- `charge.dispute.created`;
- `charge.dispute.updated`;
- `charge.dispute.closed`;
- `charge.dispute.funds_withdrawn`; and
- `charge.dispute.funds_reinstated`.

`invoice.payment_succeeded` may remain enabled during transition because
purchase uniqueness makes it duplicate-safe, but `invoice.paid` is canonical.
Provider event delivery order is not assumed.

Apple uses a distinct public endpoint,
`POST /api/iap/apple/notifications`, configured in App Store Connect for V2
production and sandbox delivery at
`https://www.verzatv.com/api/iap/apple/notifications`. It does not share the
Stripe secret or event allowlist. The handler verifies Apple's signed outer and
inner JWS, claims the notification UUID, and keeps processing adverse events
even when new Apple purchase preflight is off. A hand-built payload, copied JWS,
or HTTP 200 from an unsigned request is not a canary.

Account deletion sets a database guard before touching Stripe, expires open
Checkout Sessions, cancels and re-lists subscriptions, and atomically preserves
only the deleted user UUID plus Stripe Customer ID in a service-only tombstone.
A delayed signed event for that tombstone records the financial transaction
with `user_id=NULL` and non-personal metadata, reconciles refunds/disputes,
cancels any non-terminal subscription, updates the tombstone event timestamp,
and emits no entitlement, saved-list row, email, or analytics event. An event
which overlaps the reversible phase before the tombstone exists returns 5xx so
Stripe retries after deletion either commits or rolls back.

The same successful profile/Auth cascade removes all account-owned entitlement
sources and changes retained Apple ledger ownership to `NULL`; it does not
refund the App Store purchase. A failed deletion keeps the Apple binding and
independent sources recoverable after the guard clears. Explicit StoreKit
restore can rebind only an already-orphaned canonical original after the former
profile and Auth user are proven absent.

VIP lifecycle events retrieve the current Subscription from Stripe before
writing profile state, so an out-of-order cancellation snapshot cannot regress
a later resume. Those events cannot activate a new subscription; activation is
invoice-first and occurs only after current Charge reconciliation.
`profiles.vip_cancel_at_period_end` persists the provider flag; active membership
UI says `Access through` rather than `Renews` when future renewal is cancelled.
`vip_payment_blocked` prevents an unrelated subscription update from
reactivating access while a refund or chargeback is adverse.

## Refunds, disputes, and access policy

Refund events update `purchases.refunded_cents`, `refunded_at`, and status and
write `stripe_refunds` idempotently. Creator sale status is updated for fully
refunded historical creator purchases. The access policy is deterministic:

- a partial refund retains the existing Series Unlock or VIP access;
- a full Series Unlock refund atomically removes only the entitlement tied to
  that purchase ID;
- a full VIP invoice refund blocks VIP access and idempotently cancels the
  exact verified subscription so it cannot bill again;
- an open or lost chargeback removes the matching Series Unlock and blocks the
  matching VIP subscription immediately; an open VIP chargeback also turns off
  its next automatic renewal so a blocked account cannot be charged for another
  period, while a lost VIP chargeback cancels the subscription immediately; and
- a won/closed dispute restores a Series Unlock only when the financial row,
  account, current catalog SKU, and provider state remain canonical. VIP is
  restored only when the exact subscription is still active/trialing and no
  other invoice for it has an adverse state.

Grant, refund, dispute, and restoration RPCs lock the financial row(s), so an
out-of-order confirmation cannot resurrect access after a refund and an older
dispute event cannot override a later resolution.

Apple refunds/revocations are separate provider state. The app does not issue
or promise an Apple refund; Apple decides App Store refund requests. A verified
`REFUND` or `REVOKE` clears only the matching Apple original from the
entitlement. Stripe access, a manual/support grant, or another active verified
Apple original remains. Equal-clock adverse Apple state outranks active state,
and only a genuinely later signed `REFUND_REVERSED` may restore that original.
The server can return `finishAuthorized=true` for a durably recorded canonical
terminal transaction while independently returning `accessGranted=false`.

Dispute events retrieve the current Dispute and Charge from Stripe instead of
trusting an out-of-order event snapshot. Migration `013` records each provider
dispute once, maps open cases to `disputed`, losses to `disputed_lost`, and a
win/closed inquiry back to the actual current refund/dispute-derived purchase
status before applying the access rules above. Evidence submission and customer
communication remain support operations, but their absence does not leave the
application's billing/access state undefined.

## Sales-tax readiness

On 2026-08-03, Stripe Tax was configured and read back against the independently
verified public business record: status `active`, verified US head office,
default tax behavior `inferred_by_currency`, and default code `txcd_10402000`.
There are still zero active tax registrations. All 31 historical sessions had
`automatic_tax.enabled=false` and zero tax collected, and the application
automatic-tax feature flag remains off.

The code is tax-aware but collection remains safely off by default:

- `STRIPE_AUTOMATIC_TAX_ENABLED` is false when absent or explicitly `false`;
  any other value besides exact `true`/`false` fails closed;
- series unlocks use Stripe tax code `txcd_10402000` (streamed audiovisual work,
  non-subscription, limited rights);
- VIP uses `txcd_10402200` (streamed audiovisual subscription, conditional
  rights);
- both prices explicitly use tax-exclusive behavior;
- only an explicit `true` enables Checkout automatic tax and persists the
  customer address needed for subscription renewals;
- webhook/confirmation validation treats 199/999/7999 cents as the canonical
  product subtotal, validates the tax-inclusive total separately, and stores
  subtotal/tax/total independently; and
- revenue analytics and refund reversals exclude tax collected, while receipts
  and the gross financial ledger retain the actual total paid.

Threshold monitoring can now use the account location/defaults, but monitoring
is not registration. Qualified tax/accounting review must decide where the
business is registered/required to collect before the feature flag is enabled;
no state registration may be inferred from authority to sell nationwide.
That review must confirm nexus, registrations, the selected streaming tax-code
classification, and tax-exclusive display before collection. Never infer that
$1.99, $9.99, or $79.99 includes tax, and do not enable automatic tax until the
decision is recorded and end-to-end test-mode Checkout is verified.

Apple commerce is not controlled by `STRIPE_AUTOMATIC_TAX_ENABLED`. Apple
collects and bills through the App Store under its agreements and storefront
rules. Before App Review, App Store Connect must separately show the app tax
category `Video` after a complete sibling-field readback, and the Paid
Applications banking/tax agreement must be active. Those App Store steps do not
establish or change Stripe nexus/registrations.

## Access checks

For a requested catalog episode, server access is evaluated as:

1. episode is within that series' canonical free-episode count;
2. authenticated profile has active, unexpired VIP access; or
3. authenticated user owns a `(user_id, series_slug)` entitlement backed by at
   least one current Stripe, Apple, or manual source.

Relevant routes are `GET /api/access`,
`GET /api/entitlements/check?series=<slug>&episode=<n>`, and the playback route.
Client query strings, local storage, analytics events, Checkout UI state, and
profile fields sent by a client never grant access.

## Disabled legacy paths

- `POST /api/coins/purchase` returns 501.
- `GET /api/coins/balance` returns 501.
- `POST /api/unlock/season-pass` returns 410 unconditionally.
- `POST /api/creator-unlock` returns 503 unconditionally.

The coin constants and editorial copy are future-product data, not a live
ledger. There is no atomic coin debit/credit RPC and no client-side Stripe SDK.
Do not revive stub code; a coin launch requires a reviewed ledger schema,
transactional RPCs, canonical pricing, refund/reversal rules, webhook tests,
and a new App Store compliance review.

### Predecessor direct-PaymentIntent population

A separate live Stripe population predates this repository and is not part of
the three historical paid Checkout Sessions. Fifty-four direct $4.99 show
PaymentIntents used public `Unlock Show:` descriptions and obsolete
`show_id`/`user_id` UUID metadata. Sixteen succeeded; four of those were fully
refunded at the customer's request, leaving 12 captured/unrefunded payments
($59.88). Four failed Charge attempts also exist; one belongs to a
PaymentIntent later retried successfully. None of the obsolete UUIDs resolves
in the current production Supabase project, and no current purchase,
creator-sale, or entitlement row represents the 12 payments.

The 38 unfinished predecessor show intents and three unfinished predecessor
merch intents were canceled as `abandoned` on 2026-08-03 after exact live
provider preconditions. Readback showed 19 succeeded and 41 canceled
PaymentIntents, with zero predecessor intents still confirmable. No Charge,
refund, succeeded PaymentIntent, or balance transaction was altered.

Do not replay, regrant, refund, or otherwise mutate the predecessor financial
objects during routine release or incident work. A payment owner must choose a
documented disposition after independent identity/ownership verification. See
`docs/reports/PROPOSED-LEGACY-STRIPE-QUARANTINE.md`; its companion SQL is a
review-only proposal outside active migrations and has not been applied or
seeded.

## Merchandise separation

`POST /api/checkout` prices official merchandise from `lib/products.ts`, never
from client-supplied values, but it fails closed unless
`MERCH_CHECKOUT_ENABLED=true`. Keep it disabled until every price and variant
is confirmed and shipping, tax, inventory, order persistence, and fulfillment
are production-ready. Amazon affiliate products never use this route; checkout
completes at Amazon and hardcoded Amazon prices are forbidden.

## Release sequence and verification

1. Run the non-PII Stripe inventory and record read-only snapshots of the
   production webhook endpoint, Tax settings/registrations, portal
   configurations, PaymentIntents, Charges, refunds, disputes, balance
   transactions, Checkout Sessions, subscriptions, invoices, customers,
   products/prices, Payment Links, payouts, transfers, and connected accounts.
   Preserve the three historical paid Checkout Sessions and the separately
   documented predecessor direct-PaymentIntent population during release work.
2. Run `npm run test:payments`, `npm run test:payments:db`, `npx tsc --noEmit`,
   lint, and the production build. Apply migrations `009` through `015` in order
   and verify constraints, functions, RLS, and service-role-only permissions
   before deploying the matching Stripe/Apple webhook code. Migrations 009–015
   are production-read-back.
3. Complete and record the sales-tax/legal decision above. Keep
   `STRIPE_AUTOMATIC_TAX_ENABLED=false` until registrations and collection are
   independently approved.
4. **Complete:** deploy the migration-compatible code and updated legal/support
   pages while automatic tax, hosted Terms consent, and all three VIP release
   flags remain false. The endpoint was held unchanged until this runtime phase
   passed, then step 7 was completed. Run
   `npm run test:payments:runtime:public`, then supply a controlled Supabase JWT
   and run `npm run test:payments:runtime:compatibility`; the authenticated
   response must show live Series Unlock Checkout configured in compatibility
   mode and both VIP capabilities false.
5. **Open:** in the live Stripe Dashboard, visually set and evidence
   Public-details Terms, Privacy, Support URL, and support email. The platform Account API cannot
   prove this step. Only then attest `STRIPE_PUBLIC_DETAILS_TOS_READY=true` for
   the one-time portal command.
6. **Open:** with zero prior active portal configurations, run
   `STRIPE_PUBLIC_DETAILS_TOS_READY=true npm run stripe:portal:configure`.
   Record the returned `bpc_...` ID, set it as the sensitive production
   `STRIPE_BILLING_PORTAL_CONFIGURATION_ID`, set
   `STRIPE_CHECKOUT_TOS_CONSENT_REQUIRED=true`, and deploy again while every VIP
   flag remains false. Re-run the public gate and
   `npm run test:payments:runtime:required-consent`, then run
   `npm run stripe:portal:check`. Never enable plan changes, hosted login, or
   immediate cancellation in this configuration.
7. **Endpoint complete; full gate open:** the single canonical production
   Stripe endpoint was changed in place to the exact 19-event list after the
   compatibility deployment. No second endpoint, replay, wildcard, or secret
   rotation occurred; unsigned delivery returns 400. Preserve/read back that
   state after the required-consent deployment. Run
   `npm run test:payments:stripe-cutover`; it also requires the open exact portal
   and hosted Terms consent true, while requiring monthly/yearly VIP to remain
   explicitly disabled. The older `npm run test:payments:stripe` command is a
   future VIP-launch gate and must not justify this Series cutover.
8. An authorized payment owner may then perform one controlled live $1.99
   Series smoke purchase. Verify exactly one Checkout/PaymentIntent/Charge,
   correct purchase financials, one purchase-linked entitlement, authenticated
   playback, idempotent receipt, and retry recovery with no second Charge. Do
   not issue a cleanup Refund automatically.
9. Reconcile Stripe Checkout Sessions/Subscriptions/Invoices/Disputes against
   `purchases`, `stripe_refunds`, `stripe_disputes`, `profiles`,
   `entitlements`, `vip_checkout_consents`, and `payment_notices`; alert on
   paid-but-unfulfilled or duplicate logical purchases and any failed,
   ambiguous, or overdue customer notice.
10. Verify web and Android guest sign-in routing and purchase return behavior.
11. **Complete:** migration 015, Apple routes/legal siblings, exact enabled
    preflight/narrow allowlist, canonical negative route/cache behavior, and
    authenticated no-charge product mapping passed production readback.
12. **URL configuration complete; delivery open:** App Store Server
    Notifications V2 production and sandbox use the canonical HTTPS route with
    sibling integrity preserved. Still pass Apple's real signed test-
    notification canary; do not use a fabricated/copy-pasted JWS.
13. Complete all 74 IAP screenshots/readbacks, Paid Applications banking/tax,
    App Store `Video` tax category, DSA trader status, and exact app-version/IAP
    attachment prerequisites.
14. Enable exact Apple preflight and run one controlled TestFlight Sandbox
    purchase plus cancel, interrupted/pending, restore, duplicate-tap,
    cross-live-account denial, deletion/orphan rebind, refund/revocation,
    multi-source, offline/retry, and paid-playback cases.
15. Verify iOS exposes StoreKit localized price/purchase/restore only; it must
    contain no Stripe, web checkout, external-purchase direction, VIP purchase,
    coins, or competing billing UI.
16. Tie all evidence to the exact backend commit/deployment/migration, Apple
    product-manifest hash, and pinned TestFlight build before the owner approves
    App Review submission.

The command-by-command current cutover record, stop conditions, and baseline
totals are in
`docs/reports/PAYMENT-CUTOVER-EVIDENCE-2026-08-03.md`. VIP launch is a separate
future operation requiring Resend delivery/monitoring evidence, the annual cron
gate for yearly, and legal approval; it is not part of the Series cutover.

Never deploy the webhook code before its migration, rotate/change live Stripe
configuration without recording the exact endpoint/event set, or issue a live
charge/refund as part of a code-only verification pass.

Separate external launch blocker: rotate the exposed Stripe secret/webhook,
Supabase service-role, and paired Mux token credentials through provider
dashboards. Install replacements as Vercel `Sensitive`, deploy and canary every
dependent path, then revoke predecessors. Never export/read values for
documentation or names/type/target evidence.
