# Payment cutover evidence — 2026-08-03

This is the non-secret release record and execution order for the current
payment hardening. It is intentionally conservative: Series Unlocks may launch,
while monthly and yearly VIP remain hidden and server-blocked. No step in this
document authorizes changing a successful Charge, Refund, Dispute, payout, or
historical entitlement.

> **Stripe-only snapshot.** The August 5 Apple StoreKit backend/migration and
> 74-product rollout are newer and governed by
> [`../guides/APPLE-IAP.md`](../guides/APPLE-IAP.md). Apple migration/backend
> deployment is now live, but nothing in this dated Stripe record proves or
> authorizes Apple notifications, testing, products, or submission.

## Current production/cutover state

- The approved production Supabase project has migrations `009`–`014` applied
  and independently read back; its project identifier is intentionally omitted.
- The approved live Stripe account has Charges and payouts enabled and statement
  descriptor `VERZATV`; its account identifier is intentionally omitted.
- Financial baseline: 19 succeeded and 41 safely canceled PaymentIntents; 19
  succeeded and 4 failed Charges; 4 completed full Refunds totaling $19.96; no
  Disputes. Gross successful balance activity is $91.81, less $19.96 Refunds
  and $8.27 fees, leaving $63.58 available and $0 pending. There are no payouts.
- The 41 canceled PaymentIntents were predecessor attempts that had no funded
  state. The guarded closure did not modify a successful Charge, Refund, balance
  transaction, or payout.
- Stripe Checkout has 31 historical Sessions: 28 expired and 3 complete/paid.
  The three paid Sessions total $11.97 and reconcile to the current database's
  documented support-recovery state.
- The predecessor system also has 12 captured, unrefunded $4.99 Series Charges
  whose obsolete user/show UUIDs do not resolve in the current database. They
  are not silently granted, refunded, replayed, or attached to current users.
  See `PROPOSED-LEGACY-STRIPE-QUARANTINE.md`; that proposal is not an applied
  migration and has no seeded Charge IDs.
- Automatic tax is explicitly off and Stripe has no active Tax registrations.
  Do not enable automatic tax until registrations and filing ownership are
  separately approved.
- VIP transactional notices, annual notices, and yearly Checkout are explicitly
  false. They remain false throughout this cutover.
- The one canonical Stripe webhook endpoint is enabled with the exact reviewed
  19/19 event allowlist and wildcard off. It was expanded in place only after
  compatible runtime was live; no second endpoint, historical replay, or
  signing-secret rotation occurred. An unsigned `{}` POST returned HTTP 400
  `Missing stripe-signature`.
- Stripe has no active Billing Portal configuration. Live business-profile
  Public details remains blank. Terms/Privacy fields cannot be read or changed
  through the ordinary Account API; the attempted own-account update was
  rejected with HTTP 403 and readback confirmed no change.
- Canonical Terms, Privacy, Refund, and Support pages return HTTP 200 and both
  parsed/source HTML verify the August 3, 2026 legal date; Support contains the
  published support address. Authenticated payment capabilities is live,
  private/no-store, and reports Series Checkout configured/live in
  `compatibility` mode with monthly and yearly VIP false.

## Implemented safeguards and automated evidence

- All 80 catalog rows are classified: 79 are live and one is coming soon;
  exactly 74 are canonical $1.99 Series Unlock SKUs and five live titles are
  fully free. Every sellable Series has a matching playback inventory. The
  coming-soon title can never become a Checkout SKU through client input.
- Before a new Series Checkout is created, the server searches every page of
  complete and open Checkout history for the persisted Stripe Customer. It
  repairs an exact paid Session, reuses exactly one current canonical open
  Session, and blocks pending, conflicting, noncanonical, multiple-open,
  provider-error, broken-pagination, or over-limit history. This closes the
  duplicate-charge window after Stripe's idempotency retention expires when
  both the original webhook and return confirmation failed.
- A missing or deleted Stripe Customer already persisted on a profile is never
  silently replaced: replacement would hide that Customer's paid Checkout
  history. The stored link remains intact and Checkout fails for support review.
- Series provider verification rejects the wrong subtotal, tax/total, currency,
  PaymentIntent status/amount, missing or failed Charge, any Refund, and any
  Dispute before entitlement recovery.
- Checkout confirmation rebinds the authenticated user, persisted Customer,
  exact Session, Series slug, mode, current catalog offer, Terms policy, and
  provider financial state before granting access.
- Refund and Dispute RPCs are row-locked and provider-idempotent. Full Series
  Refunds and adverse Disputes revoke only purchase-linked access; unmatched
  legacy provider events retain service-only financial evidence with no user or
  entitlement link.
- VIP tests cover active/trialing, canceled, incomplete, incomplete-expired,
  past-due, paused, and unpaid states; adverse or non-active states do not grant
  access. Invoice validation rejects discounts, shipping, wrong currency,
  partial payment, and inconsistent tax arithmetic.
- The read-only Stripe inventory script is `scripts/audit-stripe-inventory.mjs`.
  It emits aggregate non-PII evidence only.
- The rollback-only database suite applies migrations `009`–`014` twice and
  tests constraints, RLS, event claims, Refunds, Disputes, deletion tombstones,
  consent/notices, orphan provider events, and access transitions before
  rolling the entire transaction back.

Current local gates:

```bash
npm run test:playback-security
npm run test:mux-webhook-security
npm run test:payments
npm run test:payments:db
npx tsc --noEmit
npm run lint
npm run build
```

As of the final launch-source audit, the playback boundary, Mux webhook
security, payment, rollback-only database, TypeScript, repository-wide ESLint,
and production-build gates pass. The
repository-wide lint result is 0 errors and 7 reviewed warnings, reduced from 46
errors and 36 warnings. Four warnings preserve direct `<img>` loading for Mux
poster/thumbnail transitions in playback surfaces; replacing those elements
with the Next.js image pipeline would change the exact cache, loading, and
first-frame behavior and requires focused visual/playback regression testing.
Three warnings preserve dormant AI-provider prompt/model scaffolding while the
provider-backed integration deliberately fails closed; deleting that planned
integration is a separate product decision. All conditional-Hook,
`set-state-in-effect`, typing, and Hook-dependency findings are resolved.

The production build also emits Next.js's non-blocking deprecation notice for
the `middleware` filename convention. Renaming it to `proxy` is deferred to a
separate routing change with deployment validation; it is not a compile or
runtime failure in this release.

The ordinary payment suite currently passes with these named sub-suites:

- code/catalog: 74 unlock SKUs and 2 VIP plans;
- Series Checkout history: paid/open/pending/identity/multiple-open/pagination/
  provider-failure behavior;
- Series provider payment: amount/currency/Charge/Refund/Dispute behavior;
- authenticated Series readiness (compatibility/required/unconfigured), VIP
  capabilities, and private-cache contract;
- Series/VIP email idempotency and provider errors; and
- VIP provider payment: paid/partial/full/Dispute/owner behavior.

## Manual Stripe Dashboard gate

An authorized Stripe Dashboard operator must open Public details in live mode,
set and visually verify all four values, and retain a screenshot or dated audit
note:

- Terms: `https://www.verzatv.com/terms`
- Privacy: `https://www.verzatv.com/privacy`
- Support: `https://www.verzatv.com/support`
- Support email: `support@verzatv.com`

Also visually confirm the public business name and `VERZATV` statement
descriptor. Do not treat the platform Account API as evidence for the
Terms/Privacy fields; it does not expose them. Keep
`STRIPE_CHECKOUT_TOS_CONSENT_REQUIRED=false` until this manual gate and the
first runtime deployment below both pass. That explicit false value is a live
compatibility state: it keeps Series Unlock Checkout operational while omitting
Stripe's hosted Terms checkbox. Missing, empty, or malformed live values are
unconfigured and fail closed; they are not equivalent to compatibility mode.

## Exact safe cutover order

### 1. First deployment: code and legal pages, release flags still off — COMPLETE

1. Confirm migrations `009`–`014` and all local gates above are green.
2. Confirm production environment remains:
   `VIP_TRANSACTIONAL_NOTICES_ENABLED=false`,
   `VIP_ANNUAL_RENEWAL_NOTICES_ENABLED=false`,
   `VIP_YEARLY_CHECKOUT_ENABLED=false`,
   `STRIPE_AUTOMATIC_TAX_ENABLED=false`, and
   `STRIPE_CHECKOUT_TOS_CONSENT_REQUIRED=false`.
3. Deploy the reviewed source. Do not change the Stripe webhook event list yet.
4. Run the public, GET-only runtime gate:

   ```bash
   npm run test:payments:runtime:public
   ```

   It must confirm the August 3 Terms/Privacy/Refund content, Support page, and
   an unauthenticated capabilities response of HTTP 401 with `private,
   no-store` and `Vary: Authorization, Cookie`.
5. Supply a controlled Supabase review-account JWT through a non-logged secret
   prompt, then run the authenticated GET-only gate:

   ```zsh
   read -s "PAYMENT_CAPABILITIES_ACCESS_TOKEN?Supabase review JWT: "
   export PAYMENT_CAPABILITIES_ACCESS_TOKEN
   npm run test:payments:runtime:compatibility
   unset PAYMENT_CAPABILITIES_ACCESS_TOKEN
   ```

   It must return HTTP 200 with `seriesUnlock.checkoutConfigured=true`,
   `seriesUnlock.livemode=true`, `seriesUnlock.consentMode=compatibility`, and
   both monthly and yearly VIP capabilities false. An Apple verification code
   is not a Supabase JWT and must never be used here.

### 2. Public details, portal, and Terms-consent deployment — OPEN

1. Complete and evidence the manual Stripe Public-details gate above.
2. Create the single restricted portal configuration only after that evidence:

   ```bash
   STRIPE_PUBLIC_DETAILS_TOS_READY=true npm run stripe:portal:configure
   ```

   Record the returned `bpc_...` identifier. The guarded script refuses a live
   create without the explicit readiness flag and legal-page HTTP checks.
3. Set that exact identifier as the sensitive production
   `STRIPE_BILLING_PORTAL_CONFIGURATION_ID`; set
   `STRIPE_CHECKOUT_TOS_CONSENT_REQUIRED=true`. Leave every VIP release flag and
   automatic tax false.
4. Deploy again so the new environment is active.
5. Re-run the public gate and the authenticated required-consent gate, then read
   back the portal without mutation:

   ```bash
   npm run test:payments:runtime:public
   npm run test:payments:runtime:required-consent
   STRIPE_BILLING_PORTAL_CONFIGURATION_ID=bpc_REDACTED \
     npm run stripe:portal:check
   ```

   Replace the placeholder through a protected environment value, not source
   control. The authenticated gate must show configured, live Series Unlock
   Checkout in `required` mode and both VIP capabilities false. The portal check
   must confirm exact Terms, Privacy, return URL, customer updates, invoice
   history, payment-method update, end-of-period cancellation, disabled plan
   changes, disabled hosted login, and live-mode consistency.

### 3. Webhook expansion, only after compatible runtime is verified — PROVIDER CHANGE COMPLETE

The existing endpoint was updated in place after compatible runtime verification;
no second endpoint was created and no historical event was replayed. Its current
event set is exactly the following 19:

```text
checkout.session.completed
checkout.session.async_payment_succeeded
checkout.session.async_payment_failed
customer.subscription.created
customer.subscription.updated
customer.subscription.deleted
customer.subscription.paused
customer.subscription.resumed
invoice.paid
invoice.payment_failed
charge.refunded
refund.created
refund.updated
refund.failed
charge.dispute.created
charge.dispute.updated
charge.dispute.closed
charge.dispute.funds_withdrawn
charge.dispute.funds_reinstated
```

Read it back with the safe cutover gate:

```bash
npm run test:payments:stripe-cutover
```

That command requires one canonical enabled endpoint, exactly the 19-event
allowlist with no wildcard or extras, hosted Terms consent true, the exact
Billing Portal configuration, and all three VIP release flags explicitly false.
The older `npm run test:payments:stripe` command is reserved for a separately
approved future VIP launch and intentionally requires the notice gates on.

The endpoint/event portion now passes readback, but the full command remains
blocked by the intentionally open hosted-Terms/portal phase. An unsigned empty
request already returned HTTP 400. Do not fabricate or replay a live Stripe
event. Re-run the aggregate Stripe
inventory and confirm successful Charges, Refunds, Disputes, balance, and
payouts are unchanged by the cutover itself.

### 4. Controlled payment smoke test — OPEN

Only an authorized payment owner should perform a new live $1.99 smoke purchase
with a dedicated review account and real payment method. Before payment, verify
the account has no entitlement or unresolved Checkout for the chosen Series.
After payment, retain evidence of exactly one Checkout Session, one successful
PaymentIntent/Charge, one purchase row with correct subtotal/tax/total, one
purchase-linked entitlement, authenticated playback, and one idempotent receipt.
Retry the Unlock action and prove it recovers/reuses provider history without a
second Checkout or Charge. Do not refund the smoke Charge merely to tidy test
data; any Refund requires a separate business decision and its own reconciliation
evidence.

## Stop and rollback criteria

Stop without creating another Checkout if any of these occurs:

- runtime capabilities are 404, public, cacheable, unauthenticated 200, or show
  Series Unlock Checkout unconfigured/non-live/in the wrong consent mode, or
  either VIP capability true;
- updated legal/support pages are not the live August 3 versions;
- Public details cannot be visually verified;
- portal readback drifts or more than one managed configuration exists;
- webhook readback is missing an event, includes an extra/wildcard, or shows a
  second canonical endpoint;
- the database or provider-history scan fails, exceeds its safety bound, or
  finds pending/conflicting/multiple payable Series Sessions;
- financial inventory changes before the authorized smoke purchase; or
- any smoke purchase produces more than one Charge or fails to produce a
  purchase-linked entitlement.

Rollback means keeping all VIP/tax flags false, restoring
`STRIPE_CHECKOUT_TOS_CONSENT_REQUIRED=false` if Public details or hosted consent
is uncertain, re-running the authenticated compatibility-mode runtime gate, and
restoring the prior one-event (`checkout.session.completed`) webhook allowlist
only if the new runtime itself must be rolled back. Do not delete financial
ledgers or provider history during rollback.
