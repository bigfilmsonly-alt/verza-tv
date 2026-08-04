# Verza TV launch truth

**Operational snapshot:** 2026-08-03, America/Los_Angeles

**Scope:** web/backend release serving the native iOS 2.0 submission

**Status:** legal/payment compatibility, exact Stripe webhook, and signed Mux
backend are production-verified; Dashboard Terms/portal, paid smoke, native
acceptance, and final submission remain open

This is the shortest authoritative answer to “what is true now?” It separates
the working tree, production, and intentionally deferred products. Detailed
mechanics remain in the linked runbooks. Dated reports and strategy documents
are evidence/history, not release instructions.

## Release truth at a glance

| Area | Source/verified inventory | Production truth | Submit implication |
| --- | --- | --- | --- |
| Catalog | 80 rows: 79 live and one coming soon; 74 paid-live and five wholly free | Catalog is live; local safety projections changed | Never charge free or non-live titles |
| Series Unlock | Canonical one-time price is $1.99 USD; exact server validation and durable provider-history recovery exist | Authenticated capabilities report configured/live in `compatibility` mode; controlled hardened-path purchase still unproven | Web/eligible Android only; complete one controlled $1.99 smoke after required-consent/portal gate |
| VIP | $9.99/month and $79.99/year constants and guarded code exist | Both plans are hidden and API-blocked | Do not market or expose either plan; yearly has extra annual-reminder gate |
| Coins | Constants remain as dormant future-product data | Purchase/balance/season-pass routes fail closed | Do not describe coins as monetization or revive without a new ledger/compliance review |
| iOS payments | Reader-mode source gates exist in native | No digital iOS Checkout is intended | iOS may show previously acquired access only; no price/CTA/link/direction |
| Stripe Terms consent | Explicit `false` compatibility and `true` required modes exist | Exact `false` compatibility is live; Public details is blank and Account API update returned 403 | Authorized Dashboard operator must set/verify details, portal, then deploy exact `true` |
| Stripe webhook | Handler supports the reviewed 19-event contract | One canonical enabled endpoint is exact 19/19, wildcard off; unsigned POST = 400 | Preserve exact allowlist; no second endpoint or historical replay |
| Stripe Tax | Tax-aware fields/codes and guarded feature flag exist | Automatic tax is off; zero active registrations | Nationwide sales authority is not registration evidence; keep off pending tax/legal decision |
| Legal/support | August 3 Terms, Privacy, Refund, and Support copy exists in source | Canonical live pages return 200 and parsed/source HTML verifies the August 3 date; Support exposes the support address | Keep native/legal metadata aligned; repeat readback after later deploys |
| Mux inventory | 4,262 mapped rows; 459 public; 3,803 withheld; all 3,753 paid-live rows have signed counterparts | Signed mode true; 402/no-capability and entitled signed 1,800-second stream/poster + manifest canary passed | Exact new native-client acceptance remains open; legacy IDs coexist for 1.2 |
| Creator Mux webhook | Mandatory awaited raw-body verification and retry-safe database handling | Hardened route is deployed; absent production verification secret returns 503 | Creator ingestion/PPV stays unavailable until a real secret is configured and a signed-event canary passes |
| Legacy Mux IDs | Legacy public paid IDs coexist for live 1.2 compatibility | Direct legacy URLs remain public | Retirement is a separate post-2.0 forced-update/drain decision, never a pre-submit cleanup |
| App Store | Native source/metadata audit is active | Build 19 is stale and must not be attached | Only a newly pinned, inspected, VALID binary may be submitted |

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

- A Series Unlock is one payment for one canonical live paid series. The server
  sets the $1.99 subtotal, title, currency, user, Customer, and slug.
- Browser return, a success query parameter, analytics, profile state supplied
  by the client, or an unverified Checkout object never grants access.
- A successful provider-backed confirmation must reconcile Session,
  PaymentIntent, Charge, Customer, user, catalog offer, Terms policy, Refunds,
  Disputes, and the purchase ledger before a purchase-linked entitlement is
  granted or recovered.
- Historical succeeded Charges, Refunds, and entitlements are preserved. The 41
  unfunded predecessor PaymentIntents were already canceled as abandoned under
  guarded preconditions; no funded object was changed. Do not issue automated
  “test cleanup” Refunds.
- Stripe-hosted Checkout opens outside the native Android app. There is no
  Stripe SDK, Elements, card field, or secret in either native client.
- iOS is reader mode. It does not offer a Stripe or Apple IAP purchase path in
  this release. Existing web purchases synchronize through Supabase
  entitlements.

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
  accepted and creator ingestion remains unavailable.

Still open and not to be claimed live:

- Stripe Public-details Terms/Privacy/Support values (currently blank), exact
  required-consent mode, and the restricted Billing Portal;
- a controlled $1.99 purchase through the hardened path;
- final standalone native-client signed playback/payment acceptance.

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
8. **Open:** perform one authorized $1.99 live smoke purchase without an
   automatic Refund and complete standalone native-client acceptance.
9. **Open:** build, inspect, validate, attach, and submit the exact new iOS
   artifact.

## Canonical runbooks

- Payments and entitlements: [`guides/PAYMENTS.md`](guides/PAYMENTS.md)
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
