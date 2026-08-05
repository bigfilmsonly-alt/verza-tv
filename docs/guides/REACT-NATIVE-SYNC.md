# Web/backend → React Native sync guide

Last reconciled: **2026-08-05**.

The sibling repository `../../verza-native` is an Expo SDK 57 client. This web
repository is its backend and the canonical source for shared content data.
The native repository’s `AGENTS.md` and deep docs remain authoritative for
native implementation and App Store shipping; this guide defines the boundary
between the two repositories.

> This replaces the July porting plan. Do not follow older instructions to use
> `react-native-video`, copy the complete Mux map into runtime, show Amazon or
> merchandise ordering on iOS, implement coins, or hard-code “five free.”

## Platform contract

| Capability | Web | Android native | iOS 2.0 native |
| --- | --- | --- | --- |
| Browse live catalog | Yes | Yes | Yes, refiltered to live titles |
| Play free previews | Yes | Yes | Yes |
| Play owned/VIP content | Yes | Yes | Yes, server-authorized |
| One-time Series Unlock | Stripe-hosted Checkout, canonical $1.99 USD | Server-created Stripe Checkout opened in system browser, canonical $1.99 USD | Apple StoreKit non-consumable, $1.99 US base and localized `displayPrice` |
| VIP purchase | Hidden/API-blocked | Hidden/API-blocked | Hidden/API-blocked |
| Coins / episode purchase | Disabled | Disabled | Disabled |
| Official merch new order | Disabled | Disabled | No; support for prior physical orders only |
| Amazon affiliate handoff | Web | Retained system-browser flow | Fail-closed |
| Creator/UGC surface | Web feature remains separately gated | Not a launch dependency | Absent; direct routes redirect before query/render |
| Ads/affiliate placements | Web policy applies | Retained disclosures/controls | Fail-closed; ASC Advertising answer remains No |

Digital access from either provider is represented by a Supabase entitlement/
VIP read at playback, but Stripe and Apple keep independent immutable source
ledgers. The iOS app may offer only StoreKit; it never directs users to web/
Android/Stripe purchase. The fact that web or Android may sell the same logical
series does not make that payment method safe to expose on iOS.

## Current product accounting

- 80 catalog titles total;
- 79 live titles and one coming soon;
- 74 canonical paid-live Series Unlock SKUs and append-only Apple product IDs;
- five wholly free live titles; and
- per-title free-preview counts come from `freeEpisodes`.

VIP constants remain $9.99/month and $79.99/year, but both plans default closed
and the API rejects them until their independent portal, webhook, notice,
annual-reminder, legal, and runtime gates pass. Coin constants are dormant
future-product data; coin purchase/balance and season-pass endpoints fail
closed.

## Shared data contract

Shared data is copied byte-identically from web to native, never independently
edited to “sanitize” a platform. Platform-specific safety belongs at route and
projection boundaries.

At minimum, the native data-sync runbook covers:

- `lib/catalog.ts` → `src/lib/catalog.ts`;
- `lib/mux-public-map.ts` → `src/lib/mux-public-map.ts`;
- audit-only `lib/mux-map.ts` → audit-only `src/lib/mux-map.ts`;
- `lib/series-detail.ts` → `src/lib/series-detail.ts`;
- shared configuration, i18n, product/editorial data named in native
  `docs/DATA-SYNC.md`; and
- `lib/apple-iap-product-manifest.ts` ↔ native Apple product manifest: exact 74
  slug/product pairs and retired overlay, verified for semantic parity before
  any build or App Store product mutation; and
- generated assets/projections only through their audited generators.

After any web catalog change:

1. run the shared AST catalog/parser self-tests;
2. regenerate/audit the public Mux projection;
3. add signed capability for any new paid-live Mux asset through the guarded
   add-only process;
4. regenerate the server-only signed map;
5. copy the designated shared modules byte-identically;
6. run byte-comparison and catalog/Mux count gates in both repositories; and
7. regenerate/provision a new Apple product only after the paid-live/rights
   gates pass; never delete or recycle an old mapping; and
8. rerun iOS route-boundary and StoreKit tests rather than altering shared data.

## Mux capability boundary

The complete mapping has 4,262 logical episode rows:

| Classification | Rows | Client playback ID? |
| --- | ---: | --- |
| Intentionally public/free live | 459 | Yes |
| Paid live | 3,753 | No; server-authorized signed URL only |
| Coming soon | 50 | No |
| Total withheld | 3,803 | No |

All 3,753 paid-live rows have a server-only signed counterpart. Client runtime
imports only `mux-public-map.ts`, which preserves logical episode/duration rows
while omitting all protected playback IDs. Native `.easignore` excludes the
complete legacy-capability map.

Paid playback comes from
`GET /api/playback/<series-slug>--<episode-number>` after server verification of
the Supabase cookie or Bearer token and current VIP/series entitlement. Signed
responses are private/no-store, expiry-aware bearer capabilities. Neither
client persists or logs the URL.

Native uses `expo-video`, not `hls.js` or `react-native-video`. Its hard
invariant is at most three attached players with release on blur. Token refresh
must replace the source on an existing player and restore playhead; it must not
allocate a fourth player.

Production signed mode is live. Backend canary proved unentitled paid access
returns 402/no capability and entitled access returns `policy=signed`, no
`playbackId`, 1,800-second tokenized stream/poster URLs, and a 200 manifest.
Final standalone new-client acceptance remains open. Legacy public paid IDs
coexist because the live 1.2 app depends on them. Do not retire them before 2.0 release and an owner-approved
forced-update/drain decision.

See [`MUX.md`](MUX.md) and native `docs/PLAYBACK.md`.

## Series Checkout and Android return

Android calls the authenticated server route to create a canonical $1.99
Stripe Checkout Session, then opens its URL in the system browser. There is no
Stripe SDK or card form in the app.

Expo SDK 57 may deliver browser return through both `expo-web-browser` and Expo
Router. Native `/checkout-return` is therefore mandatory:

- a warm Android return resumes the suspended confirmer;
- a cold Android return displays recovery-only guidance;
- invalid or non-Android returns redirect home; and
- the route itself grants nothing.

Confirmation rebinds the current authenticated user, persisted Stripe
Customer, Session, catalog offer, canonical amount, Terms policy, financial
objects, Refunds, and Disputes. It may repair only an exact paid provider state
and purchase-linked entitlement. A query parameter or browser success screen
is never authority.

Native reads non-secret authenticated readiness from
`GET /api/payments/capabilities`. The response is private/no-store and varies on
Authorization/Cookie. Series readiness distinguishes:

- `compatibility`: exact live Terms flag `false`, Checkout permitted without
  Stripe's hosted checkbox;
- `required`: exact flag `true`, hosted Terms consent required; and
- `unconfigured`: missing/malformed live state, Checkout fail-closed.

Both VIP capabilities must remain false for this release.

## iOS StoreKit and backend contract

The native app must call backend preflight before loading/buying a series
product. The backend returns the immutable product ID only after authenticated
paid-live/no-access/no-VIP/no-deletion checks and exact Apple release enablement.
Native then loads that exact StoreKit non-consumable and displays Apple's
localized price; it must not hard-code `$1.99` as the storefront price.

Every purchase uses the current lower-cased Supabase user UUID as
`appAccountToken`. Native sends Apple's signed transaction plus expected series
to `/api/iap/apple/transactions`. It may finish StoreKit only when the backend
returns both `verified=true` and `finishAuthorized=true`; playback/access uses
the separate `accessGranted`/entitlement state. A refunded or revoked canonical
transaction can be finish-authorized without access.

Restore uses the same route with `restoreMode=true`. It is idempotent for the
same account and may not steal from another live VERZA account. Rebinding is
limited to a purchase already in the server ledger whose prior profile/Auth
identity is truly gone and whose owner was nulled by deletion. App Store V2
notifications at the canonical backend route reconcile charge/refund/revoke/
refund-reversed state independently of native launch.

Migration 015 allows one entitlement to retain Stripe, Apple, and manual
sources. Native must refresh authoritative access after every purchase,
restore, account switch/deletion, or adverse event; it must not persist a local
unlock bit. Full contract and the exact 74 mappings are in
[`APPLE-IAP.md`](APPLE-IAP.md).

## iOS route boundary

Platform policy is enforced before data resolution/rendering, not by deleting
a sentence after an unsupported payment-bearing component mounts. Native tests
freeze all of these boundaries:

- only StoreKit localized Series Unlock price/purchase/restore; no Stripe,
  portal, web-purchase, external-purchase direction, coins, or VIP purchase;
- Discover, Search/All Series, and genre views include live titles only;
- non-live series/episode direct links redirect before episode, auth, catalog,
  or Mux work and never show “0 episodes,” “All Episodes FREE,” or a fake free
  Episode 1 CTA;
- `/learn/*`, `/careers`, `/channels`, `/sitemap`, and other non-core
  payment-bearing editorial routes redirect before consuming Tier-1 data;
- `/watch/*`, `/creator`, `/studio`, and `/admin/*` redirect before querying or
  rendering UGC/admin content;
- Amazon, StorageBlue, ad/affiliate reporting, creator submissions, and related
  assets are fail-closed;
- Shop is physical-order support only, with no products, prices, cart,
  checkout, Amazon, or new-order path;
- Reality contains only the completed live Storage Pirates title, with no
  coming-soon tile or inert carousel controls; and
- support/legal email actions always verify a handler and show a selectable
  address fallback.

The root age-assurance gate mounts outside providers/router/content and requires
the explicit `I am 18 or older` action plus direct AsyncStorage write/readback.
Read/write failure and an under-18 response remain locked.

## Authentication and account data

Native Supabase sessions persist through `expo-secure-store` (iOS Keychain /
Android Keystore), with fail-closed migration from legacy AsyncStorage. Never
store service-role or provider secrets in native code.

Account creation, login, guest mode, entitlement refresh, sign-out/account
switch, and in-app account deletion must be exercised in the exact standalone
binary. Deletion preserves only the provider/account tombstone and financial
evidence required by the server policy; delayed provider events may not recreate
identity, access, email, saved-list, or analytics data.

## Legal and production dependency

Native legal screens and App Store metadata must match the live web policy. As
of the latest 2026-08-03 readback, canonical Terms, Privacy, Refund, and Support
return 200 and parsed/source HTML confirms the August 3 legal date. Authenticated
payment capabilities is live/private and reports configured/live Series
`compatibility` mode with both VIP plans false. Re-run canonical readback after
later deployments; do not take a local render as evidence. Apple-aware billing,
refund, restore, deletion, and processor wording is now deployed/read back as a
complete sibling set.

The safe payment deployment sequence is:

1. deploy compatible legal/payment code with tax, VIP, Mux signed mode, and
   hosted Terms consent off (`STRIPE_CHECKOUT_TOS_CONSENT_REQUIRED=false`);
2. read back legal pages and authenticated compatibility capabilities;
3. **Open:** visually set Stripe Public details (currently blank), configure/review the restricted Billing
   Portal, switch Terms mode to exact `true`, and deploy/read back again;
4. **Complete provider state:** preserve/read back the one existing webhook at
   exact 19/19 with wildcard off; no second endpoint, replay, or secret
   rotation; and
5. perform one owner-authorized $1.99 smoke purchase without an automatic
   cleanup Refund.

The independent Apple backend sequence is complete through migration 015,
routes/legal, exact enabled preflight/narrow allowlist, no-charge canary, and
ASC V2 URL configuration. Still canary Apple's real signed V2 notification,
finish all product/agreement/tax/trader/screenshot gates, then pass the pinned
TestFlight purchase/cancel/pending/restore/refund/deletion/multi-source/playback
matrix. App Review is later and requires the owner's exact-build approval.

See [`PAYMENTS.md`](PAYMENTS.md) and
[`../reports/PAYMENT-CUTOVER-EVIDENCE-2026-08-03.md`](../reports/PAYMENT-CUTOVER-EVIDENCE-2026-08-03.md).

## Cross-repository release gates

Web/backend:

```bash
npm run test:playback-security
npm run test:mux-webhook-security
npm run test:payments
npm run test:payments:db
npx tsc --noEmit
npm run lint
npm run build
```

Native:

```bash
cd ../verza-native
npm run typecheck
npm run lint
npm run test:android-checkout-return
npm run test:playback-security
npm run test:ios-app-store-compliance
npx expo export --platform ios
```

The current Mac cannot run the SDK 57 cached Expo Go binary and does not need an
operating-system upgrade for submission. Use the documented EAS standalone
Simulator build, then the exact production IPA. Before App Store attachment,
inspect that pinned IPA's `Info.plist`, entitlements, privacy manifests,
frameworks/extensions, StoreKit linkage/product strings, and secrets; every
earlier reader-mode diagnostic artifact is superseded and forbidden.

## Documentation ownership

- Web payment/Mux/API/deployment truth lives in this repository.
- Native routes, player pool, Keychain, app config, screenshots, binary audit,
  App Store Connect, and shipping mechanics live in the native repository.
- Shared data is copied only through native `docs/DATA-SYNC.md` and then
  byte-compared.
- Update both documentation sets in the same change whenever an API contract,
  capability response, shared count, route boundary, or release flag changes.
