<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may
all differ from your training data. Read the relevant guide in
`node_modules/next/dist/docs/` before writing any code. Heed deprecation
notices.
<!-- END:nextjs-agent-rules -->

# Verza TV — web/backend

Last reconciled with code and release state: **2026-08-05**.

This Next.js application is the web product and the production backend for the
native client in `../verza-native`. Read
[`docs/LAUNCH-TRUTH.md`](docs/LAUNCH-TRUTH.md) before changing payments,
playback, legal copy, catalog data, or release configuration. `CLAUDE.md` and
`CODEX.md` intentionally point to this file.

## Stack

- Next.js 16 App Router, React 19, TypeScript strict, Tailwind v4
- Supabase auth/data with RLS and server-only service-role operations
- Mux HLS with server-authorized signed playback for paid episodes
- Stripe-hosted Checkout/webhooks for web and eligible Android; Apple StoreKit
  non-consumables plus signed-transaction/V2-notification verification for iOS
- Resend for guarded payment notices
- Vercel production deployment at `https://www.verzatv.com`

## Rules that outrank everything

1. **Production is not the working tree.** As of the latest 2026-08-03 readback,
   August 3 legal/support, authenticated payment capabilities in compatibility
   mode, signed paid playback, the exact 19-event Stripe webhook, and the
   hardened creator Mux-webhook route are live. The Mux route currently returns
   503 because its verification secret is intentionally absent; creator
   ingestion remains unavailable. Stripe Public details, required-consent
   mode/portal, and the controlled $1.99 smoke remain open. Apple base commit
   `a9b537844a8878851ecfe4c0e310f405b68fc6ef` plus strict Sandbox/App Review
   allowlist hardening `fe07bedcd4c4da79d35ec9c669aaec8a71be5b14` are live on
   the canonical alias:
   migration 015/schema/RLS/RPC/privileges passed readback; Apple-aware legal
   pages and negative routes passed; authenticated no-charge preflight returned
   the exact product with private/no-store; production preflight is true and
   both Sandbox allowlists are narrow and Production `Sensitive`. ASC V2
   production/sandbox URLs are exact,
   but no real signed notification or Sandbox purchase has completed yet.
   Never describe local code or a successful build as deployed.
2. **The product sold now is a full-series unlock.** The catalog has 86
   rows: all 86 live, of which 81 are paid and five are wholly free. No
   coming-soon rows remain. (2026-08-27, post App Store approval: four Espanol titles,
   two Bollywood titles, and "I'm Obsessed with My Boss Part II" released from
   coming-soon. Two Bollywood titles are still held pending key art.) Web/eligible Android use a canonical $1.99 USD Stripe
   Checkout; iOS uses one Apple non-consumable per paid-live series with a
   $1.99 US base price and StoreKit-localized storefront pricing. Coins,
   per-episode unlocks, creator PPV, merchandise Checkout, and both VIP plans
   are disabled/fail-closed. VIP price constants are future configuration, not
   current availability.
3. **Platform payment boundaries are load-bearing.** Web and eligible Android
   surfaces may open server-created Stripe Checkout in the system browser. The
   iOS app sells eligible Series Unlocks only through Apple StoreKit; it may not
   expose Stripe, web checkout, competing payment methods, or external-purchase
   direction. Both providers converge on server-authorized entitlements, but
   their immutable ledgers and adverse events remain independent.
4. **Browser return never grants access.** Exact provider-backed confirmation,
   immutable purchase identity, canonical price/catalog validation, and a
   purchase-linked entitlement are required. Never trust query strings,
   localStorage, analytics, or client-supplied user/price data.
5. **Terms consent has two explicit live states.** Exact `false` is the first
   compatibility deployment and permits Checkout without Stripe's hosted
   checkbox. Exact `true` is required after Stripe Public details is visually
   verified. Missing, empty, malformed, or unrecognized live-key state fails
   closed. Final cutover requires `true`.
6. **The production Stripe webhook is exact 19/19.** One canonical enabled
   endpoint was expanded in place with wildcard off, no second endpoint, no
   replay, and no signing-secret rotation; an unsigned POST returns 400. Never
   drift that allowlist, create a second endpoint, or replay pre-cutover events.
7. **Automatic tax stays off.** Stripe has zero active tax registrations.
   Authority to sell nationwide is not evidence of registration. Do not enable
   `STRIPE_AUTOMATIC_TAX_ENABLED` until tax/legal owners record nexus,
   registrations, classification, display, and filing decisions.
8. **Paid playback is server-authorized and signed mode is live.** The complete map has 4,616 rows:
   all live, 494 intentionally public/free rows and 4,122 paid-live rows with
   signed counterparts. Runtime clients receive only the 494-row public
   capability projection; 4,122 capabilities are withheld. Production readback shows unentitled paid access 402 with no
   capability and entitled access `policy=signed`, no `playbackId`, 1,800-second
   tokenized stream/poster, and a 200 manifest. The old 1.2 app still needs legacy public paid IDs, so do not
   retire them before a separately approved post-2.0 forced-update/drain gate.
9. **Keep secrets and capabilities server-only.** Never put service-role keys,
   Stripe/Mux secrets, signing keys, signed URLs, reviewer credentials, or
   one-time codes in source, client bundles, docs, screenshots, logs, or EAS
   archives.
10. **Migrations and webhook code move in order.** Migrations `009`–`015` must
    be applied/read back before the matching payment code is deployed. Preserve
    historical Charges, Refunds, purchases, entitlements, and provider IDs; no
    cleanup Refund is authorized. Migration 015 is additive and keeps Apple,
    Stripe, manual, and alternate-Apple entitlement sources independent.
11. **The iOS binary excludes UGC, ads, affiliate placements, Stripe, and web
    purchase steering.** Its only digital-commerce path is the exact StoreKit
    non-consumable flow. Web/Android availability does not make a surface safe
    on iOS. Keep the native route-level gates and App Store compliance tests
    aligned when shared data or APIs change.
12. **Catalog and Mux projections are generated, not hand-sanitized.** Keep the
    web/native public projections byte-identical and use the audited generation
    scripts. `lib/mux-private-map.ts` and `lib/mux-signed-map.ts` are server-only.
13. **All Next request APIs are async.** Await `cookies()`, `headers()`, and
    `params`. Prefer Server Components; use client components only for genuine
    interactivity. Preview deployments remain `noindex`.
14. **Apple product identity is append-only.** The 81 exact slug/product pairs
    live in `lib/apple-iap-product-manifest.ts`; never derive an arbitrary ID,
    recycle one, or delete a retired mapping. New-purchase preflight is gated
    separately from durable transaction/refund/revocation/restore/notification
    reconciliation. Read [`docs/guides/APPLE-IAP.md`](docs/guides/APPLE-IAP.md)
    before changing any Apple route, product, migration, flag, or legal copy.
15. **The credential-transcript incident remains an external launch gate.**
    Rotate the Stripe secret/webhook, Supabase service-role, and paired Mux token
    ID/secret through provider dashboards, install replacements as Vercel
    `Sensitive`, deploy/canary, then revoke predecessors. Never read or print
    values during names/type/target readback.

## Required pre-release gates

```bash
npm run test:playback-security
npm run test:mux-webhook-security
npm run test:payments
npm run test:payments:db
npx tsc --noEmit
npm run lint
npm run build
```

Production runtime and provider gates are staged and must be run in the order
documented in:

- [`docs/guides/PAYMENTS.md`](docs/guides/PAYMENTS.md)
- [`docs/reports/PAYMENT-CUTOVER-EVIDENCE-2026-08-03.md`](docs/reports/PAYMENT-CUTOVER-EVIDENCE-2026-08-03.md)
- [`docs/guides/MUX.md`](docs/guides/MUX.md)
- [`docs/guides/DEPLOYMENT.md`](docs/guides/DEPLOYMENT.md)

## Working agreements

- Backend changes deploy from this repository; native changes belong in
  `../verza-native`.
- Preserve unrelated work in the dirty tree. Do not rewrite historical evidence
  as current truth; label it archival and point to `docs/LAUNCH-TRUTH.md`.
- Use canonical catalog helpers and per-title `freeEpisodes`; never hard-code a
  universal free-preview count.
- Do not mutate live Stripe, Mux, Supabase, Vercel, or App Store state merely to
  make an audit pass. Follow the explicit cutover sequence and stop conditions.
- Verify production through readback after every deployment. A local build is
  necessary evidence, never production evidence.
