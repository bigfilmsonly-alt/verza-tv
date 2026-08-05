# Verza TV launch truth

**Operational snapshot:** 2026-08-05, America/New_York

**Scope:** web/backend release serving the native iOS 2.0 submission

**Status:** legal/payment compatibility, exact Stripe webhook, and signed Mux
backend are production-verified from the August 3 deployment. Apple StoreKit
commit `a9b537844a8878851ecfe4c0e310f405b68fc6ef`, migration 015,
Apple-aware legal copy, and three Apple API routes are now production-read-back.
No real signed Apple notification or Sandbox purchase has completed; Apple/
Stripe owner gates, credential rotation, exact TestFlight acceptance, and final
submission remain open.

This is the shortest authoritative answer to “what is true now?” It separates
the working tree, production, and intentionally deferred products. Detailed
mechanics remain in the linked runbooks. Dated reports and strategy documents
are evidence/history, not release instructions.

## Release truth at a glance

| Area | Source/verified inventory | Production truth | Submit implication |
| --- | --- | --- | --- |
| Catalog | 80 rows: 79 live and one coming soon; 74 paid-live and five wholly free | Catalog is live; local safety projections changed | Never charge free or non-live titles |
| Series Unlock | One-time full-series product; Stripe is canonical $1.99 USD, Apple is one non-consumable per paid-live title with $1.99 US base/StoreKit-localized price | Stripe compatibility and Apple authenticated no-charge preflight are live; no actual Apple Sandbox transaction yet | Complete separate paid Stripe and signed Apple provider canaries; neither provider's UI state grants access |
| VIP | $9.99/month and $79.99/year constants and guarded code exist | Both plans are hidden and API-blocked | Do not market or expose either plan; yearly has extra annual-reminder gate |
| Coins | Constants remain as dormant future-product data | Purchase/balance/season-pass routes fail closed | Do not describe coins as monetization or revive without a new ledger/compliance review |
| iOS payments | Native StoreKit module plus 74-product backend manifest/routes exist | Apple routes/migration/legal/preflight passed canonical readback; real signed notification and TestFlight transaction remain unproven | StoreKit is the only purchase method; no Stripe/web checkout or external-purchase steering |
| Stripe Terms consent | Explicit `false` compatibility and `true` required modes exist | Exact `false` compatibility is live; Public details is blank and Account API update returned 403 | Authorized Dashboard operator must set/verify details, portal, then deploy exact `true` |
| Stripe webhook | Handler supports the reviewed 19-event contract | One canonical enabled endpoint is exact 19/19, wildcard off; unsigned POST = 400 | Preserve exact allowlist; no second endpoint or historical replay |
| Stripe Tax | Tax-aware fields/codes and guarded feature flag exist | Automatic tax is off; zero active registrations | Nationwide sales authority is not registration evidence; keep off pending tax/legal decision |
| Legal/support | Apple billing/refund/restore/account-deletion wording is in source | Terms, Privacy, Refund, and Help return 200 and canonical HTML contains the Apple IAP/restore/refund wording | Keep all siblings/native copy aligned and repeat readback after any deploy |
| Mux inventory | 4,262 mapped rows; 459 public; 3,803 withheld; all 3,753 paid-live rows have signed counterparts | Signed mode true; 402/no-capability and entitled signed 1,800-second stream/poster + manifest canary passed | Exact new native-client acceptance remains open; legacy IDs coexist for 1.2 |
| Creator Mux webhook | Mandatory awaited raw-body verification and retry-safe database handling | Hardened route is deployed; absent production verification secret returns 503 | Creator ingestion/PPV stays unavailable until a real secret is configured and a signed-event canary passes |
| Legacy Mux IDs | Legacy public paid IDs coexist for live 1.2 compatibility | Direct legacy URLs remain public | Retirement is a separate post-2.0 forced-update/drain decision, never a pre-submit cleanup |
| Apple products | 74 append-only non-consumables have exact IDs, metadata, $1.99 US base, 173 territories, notes, Family Sharing/content hosting off | ASC readback still says `MISSING_METADATA` for all 74 because IAP review screenshots are absent | Add truthful screenshots, activate Paid Applications banking/tax, set/read back `Video`, complete DSA trader state, and attach all 74 with version 2.0.0 |
| App Store binary | Native StoreKit/source/metadata audit is active | Every earlier diagnostic build is superseded; no StoreKit-enabled final TestFlight proof exists | Only a newly pinned, inspected, Apple-`VALID` binary approved by the owner may be submitted |

## Exact catalog and Mux accounting

These numbers use distinct denominators and must not be blended:

| Set | Rows |
| --- | ---: |
| All catalog titles | 80 |
| Live titles | 79 |
| Paid live titles | 74 |
| Wholly free live titles | 5 |
| Coming-soon titles | 1 |
| All mapped episode rows | 4,262 |
| Rows belonging to live titles | 4,212 |
| Intentionally public/free live capabilities | 459 |
| Paid-live rows with server-only signed counterparts | 3,753 |
| Coming-soon capabilities withheld | 50 |
| Total capabilities withheld from client projections | 3,803 |

`lib/mux-map.ts` is the complete legacy-capability audit/data-sync anchor.
Clients import `lib/mux-public-map.ts`, which preserves logical episode and
duration data but exposes playback IDs only for the 459 intentionally public
rows. `lib/mux-private-map.ts` is the server-only gateway to the complete map;
`lib/mux-signed-map.ts` is the server-only correspondence for all 3,753
paid-live rows. Never import either private map into a client module.

The upstream browse-category reconciliation changes the generated projection's
source fingerprint without changing any episode row or capability. Therefore
the regenerated `lib/mux-public-map.ts` must be copied byte-identically to the
native client and re-audited before its next build. A matching inventory count
alone does not satisfy that sync gate, and this source reconciliation is not a
production deployment.

The complete live Mux audit scanned 5,220 assets with zero missing mapped IDs,
duplicates, free/paid overlap, or catalog-orphan series after the shared AST
catalog parser fix. Re-run the read-only generators/audits before release; this
snapshot is evidence, not permission to skip fresh verification.

## Payment product boundary

- A Series Unlock is one payment for one canonical live paid series. For Stripe
  the server sets the $1.99 USD subtotal, title, currency, user, Customer, and
  slug. For Apple, App Store Connect owns the $1.99 US base/storefront prices
  and StoreKit supplies the localized display price.
- Browser return, a success query parameter, analytics, profile state supplied
  by the client, or an unverified Checkout object never grants access.
- A successful Stripe confirmation must reconcile Session,
  PaymentIntent, Charge, Customer, user, catalog offer, Terms policy, Refunds,
  Disputes, and the purchase ledger before a purchase-linked entitlement is
  granted or recovered.
- A successful Apple path must verify Apple's signed transaction, immutable
  product/series, non-consumable type, account token, environment, and event
  ordering before its Apple source can grant access.
- Historical succeeded Charges, Refunds, and entitlements are preserved. The 41
  unfunded predecessor PaymentIntents were already canceled as abandoned under
  guarded preconditions; no funded object was changed. Do not issue automated
  “test cleanup” Refunds.
- Stripe-hosted Checkout opens outside the native Android app. There is no
  Stripe SDK, Elements, card field, or secret in either native client.
- iOS offers eligible Series Unlocks only through StoreKit. It contains no
  Stripe/web checkout, external-purchase direction, client Stripe SDK, or card
  field. Existing Stripe and new Apple purchases converge on Supabase access,
  while their provider ledgers and adverse events stay independent.

## Apple StoreKit boundary

The exact 74 `(series slug, product ID)` pairs are append-only in
`lib/apple-iap-product-manifest.ts` and mirrored in the native client. Product
IDs use `com.verzatv.app.series.<slug_with_underscores>`. A delisted title stays
in the registry for restore/refund/revocation processing and moves only to the
retired overlay for new-purchase preflight.

The production backend has three separate authorities:

1. authenticated preflight rechecks paid-live sellability, no current access/
   VIP/deletion, product mapping, and exact `APPLE_IAP_ENABLED=true` before it
   returns a product ID;
2. authenticated transaction verification validates Apple's JWS and exact
   account/product/series binding, then durably records the canonical original
   before it authorizes native transaction finishing; and
3. the public V2 notification route verifies Apple's signed outer/inner
   payloads and monotonically reconciles one-time charge, refund, revoke, and
   refund-reversed state.

Migration 015 preserves Stripe `purchase_id`, Apple
`apple_original_transaction_id`, and `manual_grant` as independent sources on
one entitlement. An adverse provider event clears only its source. A second
active Apple original, Stripe source, or manual grant preserves access. Profile
deletion removes access and pseudonymizes the retained Apple ledger owner;
explicit restore may rebind only a ledger row already orphaned by a truly
deleted account, never a purchase attached to another live account.

`APPLE_IAP_ENABLED` gates new preflight only. Signed transaction finishing,
refunds, revocations, restores, and notifications remain available when new
sales are stopped. Sandbox/TestFlight fulfillment additionally requires the
signed `appAccountToken` UUID in the server-only allowlist. Full architecture,
mapping, rollout, and canaries are in
[`guides/APPLE-IAP.md`](guides/APPLE-IAP.md).

## Terms-consent and webhook cutover

Live Series Checkout requires an explicit rollout value:

- `STRIPE_CHECKOUT_TOS_CONSENT_REQUIRED=false`: compatibility mode; Checkout is
  permitted without Stripe's hosted Terms checkbox during the first safe
  deployment.
- `STRIPE_CHECKOUT_TOS_CONSENT_REQUIRED=true`: required-consent mode; Checkout
  requests the hosted checkbox. Set only after Public details contains the
  current Terms URL and the legal pages are live.
- missing, empty, malformed, or an unrecognized live secret-key mode:
  unconfigured/fail-closed.

The final Terms/portal gate requires `true` and the exact reviewed Billing
Portal configuration. The canonical webhook now has the exact 19-event allowlist:
one enabled endpoint, wildcard off, no second endpoint, no historical replay,
and no signing-secret rotation. Preserve that state; do not replay pre-cutover
events merely because the allowlist is now complete.

Follow the command-by-command sequence and stop criteria in
[`reports/PAYMENT-CUTOVER-EVIDENCE-2026-08-03.md`](reports/PAYMENT-CUTOVER-EVIDENCE-2026-08-03.md).

## Tax state

Stripe Tax account defaults and streaming tax-code classifications have been
audited, but automatic calculation/collection remains explicitly disabled and
there are zero active Stripe Tax registrations. Legal authority to sell in all
states does not determine economic nexus, product taxability, registration,
filing, or display obligations. Only a recorded tax/legal decision may enable
`STRIPE_AUTOMATIC_TAX_ENABLED=true`.

Apple billing is separate. The App Store app tax category must be saved/read
back as `Video`, and Paid Applications banking/tax must be active before sale.
Neither step changes Stripe registration or collection state.

## Production versus staged source

Verified live as of this snapshot:

- canonical Terms, Privacy, Refund, and Support pages with August 3 copy;
- authenticated `/api/payments/capabilities` showing configured/live Series
  compatibility mode and monthly/yearly VIP false;
- one canonical exact-19 Stripe webhook, wildcard off, unsigned request 400;
  and
- Mux signed mode with unentitled 402/no capability and entitled
  `policy=signed`, no `playbackId`, 1,800-second stream/poster tokens, and a 200
  manifest canary. The disposable canary account/entitlement was deleted; and
- the hardened creator Mux-webhook route, whose production readback returns 503
  while `MUX_WEBHOOK_SECRET` is intentionally absent. No unsigned payload is
  accepted and creator ingestion remains unavailable; and
- Apple commit `a9b537844a8878851ecfe4c0e310f405b68fc6ef`: migration
  015 structural/RLS/RPC/privilege/source-preservation readback passed;
  authenticated no-charge preflight returned 200 with exact product and
  private/no-store, unauthenticated preflight returned 401, malformed
  notification returned 400, and Apple-aware legal siblings returned 200 with
  canonical wording. Production preflight is exact true with a narrow Sandbox
  allowlist; ASC V2 production/sandbox URLs are the exact canonical endpoint.

Still open and not to be claimed live:

- Stripe Public-details Terms/Privacy/Support values (currently blank), exact
  required-consent mode, and the restricted Billing Portal;
- a controlled $1.99 purchase through the hardened path;
- a real Apple-signed V2 notification delivery and actual Sandbox transaction;
- all 74 IAP review screenshots, Paid Applications banking/tax, App Store
  `Video` tax category, DSA trader status, and version/IAP attachment; and
- final standalone native-client signed playback plus StoreKit purchase/
  cancel/restore/refund/account-deletion acceptance; and
- rotation of the exposed Stripe secret/webhook, Supabase service role, and
  paired Mux token credentials through provider dashboards, followed by
  Sensitive Vercel replacement deployment/canary and predecessor revocation.

The safe order is:

1. **Complete:** source/database/type/lint/build/public-capability/client-bundle
   gates for the deployed compatibility source.
2. **Complete:** deploy/read back August 3 legal/payment compatibility with tax
   and VIP off and Terms consent explicitly false.
3. **Complete:** read back authenticated compatibility capabilities.
4. **Complete:** expand the existing webhook in place to exactly 19 events;
   wildcard is off and unsigned delivery returns 400.
5. **Complete for backend canary:** enable signed Mux delivery and verify
   unentitled/entitled production behavior while legacy IDs coexist.
6. **Complete fail-closed:** deploy/read back the hardened creator Mux webhook;
   with no configured verification secret it returns 503 and creator ingestion
   remains unavailable.
7. **Open:** complete Stripe Public details, restricted portal, exact `true`
   Terms mode, next deploy, and required-consent readback.
8. **Complete except signed delivery:** Apple backend commit is pushed/live;
   migration 015, legal siblings, negative routes, exact enabled preflight,
   narrow allowlist, and ASC V2 production/sandbox URL sibling readback passed.
   A real signed test notification remains open.
9. **Open:** complete signed notification plus every Apple agreement/tax/
   trader/screenshot/product gate, then pass the exact TestFlight purchase,
   cancel, restore, adverse-event, multi-source, deletion, and paid-playback
   matrix.
10. **Open:** perform the independent authorized Stripe $1.99 smoke without an
    automatic Refund.
11. **Open:** build, inspect, validate, attach the exact new iOS artifact plus
    all 74 IAPs, obtain owner TestFlight approval, then submit the resulting
    ReviewSubmission and verify `WAITING_FOR_REVIEW`.
12. **Open external security gate:** rotate the five exposed provider
    credentials, canary replacements, and revoke predecessors without printing
    values.

## Canonical runbooks

- Payments and entitlements: [`guides/PAYMENTS.md`](guides/PAYMENTS.md)
- Apple StoreKit: [`guides/APPLE-IAP.md`](guides/APPLE-IAP.md)
- Payment cutover evidence: [`reports/PAYMENT-CUTOVER-EVIDENCE-2026-08-03.md`](reports/PAYMENT-CUTOVER-EVIDENCE-2026-08-03.md)
- Mux authorization/cutover: [`guides/MUX.md`](guides/MUX.md)
- Deployment/readback: [`guides/DEPLOYMENT.md`](guides/DEPLOYMENT.md)
- Incident operations: [`guides/RUNBOOK.md`](guides/RUNBOOK.md)
- Native sync boundary: [`guides/REACT-NATIVE-SYNC.md`](guides/REACT-NATIVE-SYNC.md)
- Environment contract: [`guides/ENV.md`](guides/ENV.md)

## How to read older documents

Dated reports, launch plans, valuation documents, and the changelog describe
what was believed, proposed, or observed at their stated dates. They may contain
old prices, counts, route names, or launch claims. Their archival banners govern
them; they never override this page, current code, current provider readback, or
the canonical runbooks above.
