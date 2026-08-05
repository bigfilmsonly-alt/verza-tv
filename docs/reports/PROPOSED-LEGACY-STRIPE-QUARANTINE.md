# Proposed legacy Stripe quarantine (not applied)

Status: **review only**. The companion SQL file
`PROPOSED_015_legacy_stripe_charge_quarantine.sql` is intentionally outside
`supabase/migrations/` and contains no seed statements.

> **Name collision / current authority:** production migration 015 is now
> `015_apple_iap_series_unlocks.sql`; this proposal was never promoted and must
> not be renamed/applied as migration 015. Current payment/Apple truth is in
> [`../LAUNCH-TRUTH.md`](../LAUNCH-TRUTH.md),
> [`../guides/PAYMENTS.md`](../guides/PAYMENTS.md), and
> [`../guides/APPLE-IAP.md`](../guides/APPLE-IAP.md).

## Why this exists

The live Stripe account contains a predecessor payment population that predates
this repository's first commit on June 14, 2026:

- 54 direct $4.99 show-unlock PaymentIntents used descriptions beginning
  `Unlock Show:` and obsolete `show_id` / `user_id` UUID metadata.
- 16 reached `succeeded`; four of those were later fully refunded at the
  customer's request, leaving 12 captured, unrefunded payments ($59.88).
- Four failed Charge attempts also exist. One belongs to a PaymentIntent that
  was later successfully retried, so the 20 Charge objects span 19 distinct
  PaymentIntents.
- The obsolete UUIDs do not resolve in the current production Supabase project.
  The previous internal environment report referenced a different Supabase
  project, which is not accessible under the current Supabase account and no
  longer resolves in public DNS.
- Current production has no purchase, creator-sale, or entitlement row for the
  12 unrefunded predecessor payments. Their public descriptions correspond to
  catalog titles, but that is not identity or ownership proof.
- The account uses a manual payout schedule and has made zero payouts. All
  provider balance transactions reconcile exactly: $91.81 succeeded gross,
  minus $19.96 refunded and $8.27 processing fees, equals the $63.58 available
  live balance ($0 pending). That balance includes both the predecessor money
  and the three separately ledgered paid Checkout Sessions.

The 38 unfinished predecessor show intents and three unfinished predecessor
merch intents were separately canceled as `abandoned` after exact provider
preconditions. That closure did not alter any Charge, refund, or succeeded
PaymentIntent.

### Provider provenance evidence

- Every predecessor PaymentIntent and Charge is live-mode on the approved
  Stripe account (identifier intentionally omitted); these are not test-mode fixtures.
- They are direct PaymentIntents, not Checkout Sessions, invoices,
  subscriptions, Payment Links, Customers, connected-account transfers, or
  application-fee payments. No customer, invoice, transfer, or application is
  attached.
- Descriptions follow `Unlock Show: <public title>`. The Charge statement
  descriptor is the account default `VERZATV`; no per-charge suffix was set.
- Most intents enabled automatic payment methods through Stripe's default
  configuration. Successful/attempted methods include card, Link, Cash App,
  and Amazon Pay, consistent with a predecessor Payment Element integration.
- All were created from January through May 2026. This repository and its
  Vercel deployment history begin in June 2026, and no matching creation code
  exists in current git history or the native repository.
- The only located historical environment note pointed to a different obsolete
  Supabase project (identifier intentionally omitted), which is outside the
  current account and no longer resolves. Searches found no local database dump
  or backup containing sampled predecessor user/show UUIDs.

## Current unmatched-event behavior is fail-closed

A future refund for one of these provider references does not match a current
purchase. The webhook therefore grants nothing and revokes nothing. A
`refund.*` event is stored in `stripe_refunds` with `purchase_id = null`; the
parallel `charge.refunded` event is durably claimed and logs the missing
purchase. A future dispute is stored in `stripe_disputes` with
`purchase_id = null`. This is safe, but the null relationship does not explain
that the provider reference belongs to a reviewed predecessor population.

## What the proposal does

- Stores only provider-verified Charge/PaymentIntent evidence in a private,
  service-role-only quarantine table.
- Hashes obsolete user/show UUID metadata instead of treating it as a current
  account or content identifier.
- Contains no foreign key to profiles, purchases, content, or entitlements.
- Adds a purchase trigger that prevents a quarantined PaymentIntent from being
  silently repurposed as a current purchase.
- Provides an update-only reconciliation RPC. It cannot invent a quarantine
  row; an unknown future orphan remains alert-worthy.
- Grants no access and contains no automatic claim/recovery path.

## Review required before promotion to migration 015

1. A payment owner must choose the disposition of the 12 captured/unrefunded
   predecessor payments: independently verify and honor, refund, or retain under
   a documented legal/accounting basis. No automated choice is appropriate.
2. Counsel/accounting should confirm retention and customer-support handling.
3. A separate seed script must re-retrieve every live Stripe object, require the
   exact audited aggregate, hash obsolete metadata only in memory, and insert
   only explicitly approved Charge IDs. Provider IDs must never be copied from
   logs without a fresh Stripe readback.
4. Webhook refund/dispute branches should call the update-only RPC only after
   their normal purchase lookup returns no row. A false RPC result should page
   an operator; it must not create a purchase or entitlement.
5. The migration, seed, trigger, out-of-order event behavior, full/partial
   refunds, open/won/lost disputes, RLS, and account-deletion behavior must pass
   a rollback-only database test before any production application.
