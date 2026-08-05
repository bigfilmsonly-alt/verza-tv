# Operations runbook — Verza TV

Last reconciled: **2026-08-05**. Start with
[`../LAUNCH-TRUTH.md`](../LAUNCH-TRUTH.md). Production and local source are
different until a deployment is read back.

## Current pre-release checklist

### Source and database

- [ ] `npm run test:playback-security` passes.
- [ ] `npm run test:mux-webhook-security` passes.
- [ ] `npm run test:payments` passes.
- [ ] rollback-only `npm run test:payments:db` passes.
- [ ] `npx tsc --noEmit`, `npm run lint`, and `npm run build` pass.
- [x] migrations `009`–`015` are applied/read back; Apple structural, RLS, RPC,
      privilege, and independent-source preservation checks pass.
- [ ] client bundles and the native EAS archive contain none of the 3,803
      withheld Mux capabilities or any secret.

### Catalog and playback

- [ ] catalog reads 80 total / 79 live / 74 paid-live / five wholly free / one
      coming soon.
- [ ] Mux projection reads 4,262 rows / 459 intentionally public / 3,803
      withheld / 3,753 paid-live signed counterparts / 50 coming soon.
- [ ] fresh Mux audit has zero missing mapped IDs, duplicates, free/paid overlap,
      or catalog-orphan series.
- [ ] web free, signed-out paid, entitled paid, VIP entitlement, expiry refresh,
      account-switch, and 503 fail-closed matrices pass.
- [ ] standalone iPhone/iPad playback keeps at most three attached players and
      releases on blur.
- [ ] legacy paid public IDs remain in place for live native 1.2 compatibility.
- [x] hardened creator Mux-webhook route is deployed/read back; with the
      verification secret intentionally absent it returns 503 and performs no
      ingestion mutation.

### Legal and payments

- [x] August 3 Terms, Privacy, Refund, and Support pages are deployed and read
      back at `https://www.verzatv.com`.
- [ ] automatic tax remains exact `false`; Stripe Tax has zero active
      registrations; tax/legal ownership decision is recorded before any
      future enablement.
- [x] first payment deployment uses exact
      `STRIPE_CHECKOUT_TOS_CONSENT_REQUIRED=false`; authenticated capabilities
      report live Series Checkout in `compatibility` mode and both VIP plans
      false.
- [ ] Stripe Dashboard Public details visibly contains current Terms, Privacy,
      Support URL, and support email.
- [ ] restricted Billing Portal is created/read back, Terms flag is exact
      `true`, second deployment is healthy, and authenticated capabilities
      report `required` mode.
- [x] the one canonical webhook is updated in place to exactly 19/19 with
      wildcard off, no second endpoint/replay/secret rotation, and unsigned
      delivery returning 400.
- [ ] `npm run test:payments:stripe-cutover` passes after the still-open exact
      required Terms mode and restricted portal are configured.
- [ ] one owner-authorized $1.99 Series Unlock creates exactly one Session,
      PaymentIntent/Charge, canonical purchase, purchase-linked entitlement,
      idempotent receipt, and playable paid episode; retry creates no second
      Charge.
- [ ] the smoke purchase is preserved; no automatic cleanup Refund is issued.
- [ ] coins, creator PPV, official merch Checkout, monthly VIP, and yearly VIP
      remain hidden/fail-closed.
- [ ] all 74 Apple product IDs exactly match both append-only manifests; current
      ASC metadata/price/173-territory/review-note readback stays exact, Family
      Sharing/content hosting stay off, and every IAP review screenshot is
      attached so no product remains `MISSING_METADATA`.
- [ ] Paid Applications banking/tax is active; App Store app tax category is
      saved/read back as `Video`; DSA trader state is declared/verified.
- [x] migration 015 and Apple-aware legal siblings are deployed/read back;
      Apple V2 production+sandbox URLs target the exact canonical route with
      sibling integrity unchanged.
- [x] exact enabled Apple preflight plus narrow allowlist behavior passed an
      authenticated no-charge 200/exact-product/private-no-store canary; unauth
      preflight is 401 and malformed notification is 400.
- [ ] Apple's real signed V2 test notification is processed idempotently.
- [ ] one controlled TestFlight Sandbox purchase/cancel/pending/restore/refund/
      revoke/multi-source/deletion/playback matrix passes.
- [ ] exposed Stripe secret/webhook, Supabase service role, and paired Mux
      tokens are rotated as Sensitive replacements, canaried, then predecessors
      revoked.

Live Public details is currently blank and the own-account API write was
rejected with 403. This is a Dashboard/manual gate, not permission to bypass
required consent.

Creator ingestion remains separately deferred. A real `MUX_WEBHOOK_SECRET` and
signed provider-event canary are required before changing the current 503
fail-closed production state.

### Native/App Store

- [ ] iOS exposes StoreKit localized price, purchase, and restore only for the
      exact 74 Series Unlocks; it exposes no Stripe, web checkout, competing
      billing, VIP purchase, coins, or external-purchase direction.
- [ ] iOS Amazon, ads/affiliate placements, UGC/admin routes, non-core
      payment-bearing editorial routes, and non-live titles fail closed before
      query/render.
- [ ] root age assurance, SecureStore/Keychain session migration, login/demo,
      account deletion, legal/support email fallback, Shop support-only surface,
      and iPhone/iPad layouts pass in the standalone app.
- [ ] the exact new IPA—not historical build 19—passes `Info.plist`, entitlement,
      privacy-manifest, framework/extension, capability, and secret inspection.
- [ ] the exact build reaches App Store Connect `VALID` before attachment.

## Add or change a title

Follow [`CONTENT.md`](CONTENT.md); the condensed sequence is:

1. update `lib/catalog.ts` and `lib/series-detail.ts`;
2. update the complete `lib/mux-map.ts` audit anchor from verified Mux data;
3. run the shared AST parser and public projection generator—never regex-parse
   the catalog;
4. add a signed counterpart for any new paid-live asset through the guarded
   add-only operation, then regenerate the server-only signed map;
5. copy designated data into native byte-identically;
6. run both repos' count/security/iOS-route gates; and
7. deploy/read back the backend before releasing a dependent native build.

Never hard-code five free episodes. Each title's `freeEpisodes` is canonical.
Never treat `coinPerEpisode` or `seasonPassCoins` as a live product.

## Attach a transcript

```bash
npx tsx scripts/attach-transcript.ts <slug> <episode-number> <transcript-file>
```

Validate the transcript for rights, privacy, accuracy, indexability, and
unintended payment/Mux capability strings before committing or deploying.

## Content-source changes

The code adapter is production authority. The Supabase content adapter is a
scaffold, not a release toggle. Do not set `CONTENT_SOURCE=supabase` until the
adapter, backfill, RLS, indexability, capability projection, web/native parity,
rollback, and production readback have a separate approved plan.

## Re-verify Mux

```bash
npm run mux:public:audit
npm run mux:signed:self-test
npm run mux:signed:audit
npm run test:playback-security
npm run test:mux-webhook-security
```

The first three are non-mutating in their documented default modes. The current
3,753 paid-live signed inventory is complete; never invoke add-only write mode
without a fresh audit-confirmed delta and explicit reviewed intent. No routine
script retires legacy public IDs.

## Deploy and read back

```bash
npx vercel --prod --yes
```

Then verify the intended deployment owns the canonical
`https://www.verzatv.com` alias, the apex redirects canonically, required pages
and private APIs have correct status/cache headers, payment capabilities match
the deployed Terms phase, and free/paid playback matches the deployed Mux flag.
See [`DEPLOYMENT.md`](DEPLOYMENT.md).

For Apple IAP, migration 015, Apple-aware legal pages, negative routes, exact
enabled preflight/narrow allowlist, and V2 production/sandbox URL configuration
are complete. Still canary Apple's real signed V2 notification at
`https://www.verzatv.com/api/iap/apple/notifications`, then run the actual
TestFlight transaction matrix and close product/agreement/tax/trader/screenshot
gates. The secret-safe commands and stop rules are in
[`APPLE-IAP.md`](APPLE-IAP.md#safe-deployment-and-readback).

## Submit sitemaps

Use the canonical `https://www.verzatv.com/sitemap.xml` in Google Search Console
and Bing Webmaster Tools. Before submission/readback, confirm non-production
deployments are `noindex`, only live/free episode video URLs are emitted, and no
paid/coming-soon Mux capability appears in XML.

## Rotate a provider key

1. Record the provider, environment, affected routes, reason, operator, and
   rollback plan without copying the secret.
2. Generate the replacement in the provider's approved secret channel.
3. Update the matching sensitive Vercel environment value.
4. Deploy and verify the dependent feature through canonical readback.
5. Revoke the old key only after the new path is proven.
6. If a Mux signing key or signed URL leaked, follow the capability incident
   rules in [`MUX.md`](MUX.md); never log the replacement.

## Stripe webhook incident and replay

1. Stop and record the endpoint, deployment SHA/timestamp, event IDs/types,
   delivery status, and matching provider object IDs. Do not charge or Refund
   merely to manufacture an incident test.
2. Confirm migrations `009`–`015`, deployed webhook version, signing secret,
   exact endpoint event set, and database suite before any resend.
3. Build an allowlist of only failed/missed **post-cutover** events supported by
   deployed code/schema. Resend through Stripe's signed mechanism and verify
   event/purchase/Refund/Dispute ledgers after each bounded batch.
4. Permanently denylist all pre-cutover `checkout.session.*` events from bulk
   replay. This includes the three audited paid Series Sessions—two former
   $4.99 offers and one $1.99 offer—which do not satisfy today's canonical
   fulfillment rules. Preserve them and use only independently verified
   support recovery.
5. The predecessor direct-PaymentIntent population is also replay-denied. Its
   unfinished intents are canceled; existing Charges/Refunds remain unchanged
   unless a payment owner separately approves a customer disposition. A future
   Refund/Dispute may be recorded without a current user, but may never create
   an entitlement.
6. Never include purchaser names, emails, cards, billing addresses, secrets, or
   authorization tokens in an incident log.

## Common issues

| Symptom | First checks | Safe response |
| --- | --- | --- |
| Paid route returns 402 for owner | current account, entitlement/purchase link, Refund/Dispute state, Customer/history recovery | Reconcile exact provider/ledger state; never paste a playback ID |
| Paid route returns 503 | signed flag, complete map row, key presence/format, deployment | Keep fail-closed; use flag-off only while legacy IDs coexist |
| Free video missing | catalog `freeEpisodes`, public projection, exact Mux row | Regenerate/audit projection; never expose a paid ID as a shortcut |
| Native black video or unrelated fetches fail | attached-player count and release-on-blur | Restore ≤3-player invariant before changing network/auth code |
| Checkout unconfigured | live key mode and exact Terms flag | Use explicit phase value; never treat missing/malformed as false |
| Apple preflight 503 | migration/deploy lineage, exact Apple flag, product registry, account access/deletion state | Keep sales closed; do not bypass preflight or manually grant access |
| Apple notification 500/409 | signed V2 payload, environment, notification claim/attempt, inner transaction, allowlist for Sandbox | Let Apple retry after fixing verification/ledger state; never acknowledge an unverified payload |
| StoreKit repeatedly redelivers | backend `verified`/`finishAuthorized`, durable ledger result, native finish ordering | Finish only after durable authorization; never finish merely because StoreKit UI succeeded |
| Apple refund removes too much access | entitlement's Stripe/Apple/manual sources and alternate active Apple originals | Stop sales and reconcile provider-specific source; never delete the whole row blindly |
| Duplicate-charge risk | persisted Customer plus all paginated paid/open Checkout history | Stop; do not create a replacement Customer or another Session |
| Webhook red | exact one endpoint and 19-event allowlist after compatible deploy | Do not create a second endpoint or replay history |
| Legal runtime gate fails | canonical alias and August 3 markers | Stop payment cutover; deploy/read back correct copy |
| Supabase RLS denial | migration order, caller role, explicit policy/grant | Fix least privilege; never bypass through a client service key |
