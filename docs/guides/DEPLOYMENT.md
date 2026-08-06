# Deployment

The deployment chain from local development to production.

> **Stripe/Mux baseline, 2026-08-03:** canonical August 3 legal/support is live;
> payment capabilities reports live Series compatibility and VIP false;
> signed Mux backend canary passed; and the one canonical Stripe webhook is
> exact 19/19. Stripe Public details/required Terms/portal, the $1.99 smoke,
> and standalone native acceptance remain open. The hardened creator Mux
> webhook is deployed and returns 503 while its verification secret is
> intentionally absent, leaving creator ingestion unavailable. Never promote
> local source to “live” without canonical-origin readback. The August 5 Apple
> IAP base commit `a9b537844a8878851ecfe4c0e310f405b68fc6ef` plus strict
> owner-test/App Review allowlist hardening
> `fe07bedcd4c4da79d35ec9c669aaec8a71be5b14`, migration 015, routes, legal
> changes, and enabled preflight are live and read back. All three Apple Vercel
> variable names are Production `Sensitive`. ASC V2 URLs are exact; signed
> delivery and a real Sandbox transaction remain open.

---

## Repository

- **GitHub:** `splash-studio/verza-tv` (match the checked-out `origin`; older
  reports may retain the predecessor repository name as archival evidence)
- **Branch:** `main` (single trunk -- all deploys come from here)

---

## Vercel Project

- **Project:** approved `codevibes/verza-tv` project (internal IDs intentionally omitted)
- **Framework:** Next.js 16 (auto-detected)
- **Build tool:** Turbopack
- **Build time:** variable; verify the actual Vercel deployment rather than
  relying on a historical estimate

---

## Deploy Flow

The **live domain is promoted only by the Vercel CLI**, run from the repo root:

```
npx vercel --prod --yes
       |
       v
  Remote build on Vercel (next build, Turbopack)
       |
       v
  Deployment reaches READY (target: production, source: "cli")
       |
       v
  Production deploy + alias verification -> https://www.verzatv.com
```

`https://www.verzatv.com` is the canonical production origin and backend used by
the native app. The configured Git integration may create deployments from
`main`, and operators may run `npx vercel --prod --yes`; neither a Git push nor
an uploaded deployment is sufficient release evidence by itself. Verify in
Vercel that the intended deployment is healthy and currently owns the
canonical production alias. Pull requests/non-production deployments use
preview URLs and must remain noindex.

In this project's observed workflow, a push to `main` may create a
production-target deployment but does not itself promote the canonical live
alias. Keep the repository synchronized, then use the explicit CLI production
operation and canonical-origin readback above.

### Payment-aware deployment order

Payment changes are not an ordinary push. Follow
[`PAYMENTS.md`](PAYMENTS.md#release-sequence-and-verification) and the dated
cutover evidence exactly:

1. **Complete for current Stripe deployment:** run the source and rollback-only database gates; migrations `009`–`014` are
   already applied/read back in the current production database;
2. **Complete:** first deploy legal/payment compatibility with automatic tax,
   mode, every VIP flag, and hosted Terms consent off—the Terms flag must be
   exact `false`, not missing;
3. **Complete:** read back August 3 legal pages plus authenticated Series readiness in
   `compatibility` mode;
4. **Open:** visually complete Stripe Public details (currently blank), create/read back the restricted
   Billing Portal, switch the Terms flag to exact `true`, deploy, and verify
   authenticated `required` mode;
5. **Endpoint complete/full gate open:** preserve/read back the one existing
   webhook at exact 19/19, wildcard off, with no second endpoint, replay, or
   secret rotation; the full cutover audit still awaits Terms/portal; then
6. **Open:** perform one authorized $1.99 smoke purchase without an automatic Refund.

### Apple IAP deployment order

The Apple path is a separate release train. Steps 1–5 and the URL-configuration
part of step 6 are complete for the current commit. Follow
[`APPLE-IAP.md`](APPLE-IAP.md) and stop at each readback:

1. freeze the exact backend commit and pass payment, database, type, lint,
   build, audit, and manifest-parity gates;
2. link the approved Supabase project outside the transcript, run
   `npx supabase@2.67.1 migration list --linked`, then
   `npx supabase@2.67.1 db push --linked --dry-run`; stop unless 015 is the only
   pending migration;
3. apply exactly 015 with `npx supabase@2.67.1 db push --linked`, read migration
   history back, and rerun `npm run test:payments:db`;
4. verify the Production preflight flag and both Sandbox allowlist names are
   `Sensitive`; preserve the existing owner-test list and add the standing App
   Review VERZA UUID only through the separate review variable. Current behavior
   proves exact true preflight and the narrow owner-test list without printing
   values; the post-deploy readback now shows all three settings Production
   `Sensitive`;
5. deploy via `npx vercel --prod --yes`, record the immutable deployment, then
   verify it owns `https://www.verzatv.com` and read back Apple-aware legal
   pages plus unauthenticated/malformed negative route behavior;
6. configure App Store Server Notifications V2 production and sandbox to
   `https://www.verzatv.com/api/iap/apple/notifications`—this URL/V2/sibling
   readback is complete—then send Apple's signed test notification and prove
   one processed UUID plus idempotent redelivery;
7. complete the 74 product screenshots, agreement/tax/trader/product attachment
   gates; exact true preflight is already live for controlled testing; and
8. pass the exact TestFlight purchase/cancel/pending/restore/refund/revoke/
   account-switch/deletion/multi-source/playback matrix before App Review.

If Apple purchase initiation must stop, set preflight false and redeploy while
leaving transaction finishing, restore, refunds/revocations, and notifications
available. Migration 015 is additive and must remain; never rewrite an applied
migration or delete a provider ledger as rollback.

The final production security cutover also requires provider-dashboard
rotation of the exposed Stripe secret/webhook, Supabase service-role, and paired
Mux token credentials. Install replacements as Vercel `Sensitive`, deploy and
canary the dependent routes, then revoke predecessors. Inspect only names,
types, and targets; never export values into a terminal transcript.

Never deploy webhook code before its schema, expand the endpoint before
compatible runtime is live, create a second endpoint, or replay historical
events. VIP remains hidden/API-blocked throughout this Series cutover. Monthly
and yearly launch are separate future operations; yearly additionally requires
the application-owned 15–45-day reminder gate.

At cutover, record the deployment timestamp and treat every pre-cutover
`checkout.session.*` delivery as denylisted from bulk resend. The permanent
legacy exception contains exactly three previously audited paid Series Checkout
Sessions: two used the former $4.99 offer and one used the $1.99 offer. Do not
refund, edit, or resend them through the current canonical webhook. They remain
financial records; access recovery is only through the independently verified
support-claim workflow. This rule contains no purchaser identity and must be
copied into every Stripe incident ticket or replay plan.

Stripe also contains a distinct predecessor direct-PaymentIntent population
from before this repository existed. Its unfinished intents were closed as
`abandoned`, but its 20 Charge attempts (including 12 captured/unrefunded
payments) and four customer-requested refunds remain provider records. They are
not current Checkout Sessions and have no current Supabase purchase or
entitlement authority. Do not replay or mutate them during deployment; follow
the reviewed disposition/quarantine process in `PAYMENTS.md`.

### Signed-playback deployment order

Catalog playback has its own staged release. Follow
[`MUX.md`](MUX.md#production-release-sequence), not an ordinary push:

1. **Complete:** confirm the public projection exposes exactly 459 and withholds exactly
   3,803 capabilities;
2. **Complete:** confirm all 3,753 paid-live rows still have signed counterparts—the add-only
   migration is already complete;
3. **Complete compatibility phase:** deploy endpoint, maps, signing credentials, and clients while
   `MUX_SIGNED_PLAYBACK_ENABLED=false`;
4. **Backend canary complete/native acceptance open:** flip true and pass web
   authorization/manifest canary, then exact standalone-native authorization/
   expiry tests; and
5. keep legacy public paid IDs in place through 2.0 submission/release because
   live 1.2 depends on them.

Flag-off remains the rollback while legacy IDs coexist. Retirement is a
separate post-2.0 forced-update/drain decision requiring explicit owner
acceptance of the 1.2 outage risk; it is never pre-submit cleanup. After
retirement, recovery must fix signed delivery forward or issue new public IDs
and update clients; the original IDs cannot be recreated. The repository
therefore contains no bulk retirement command.

---

## Rendering Strategy

- **Static pages** are pre-rendered at build time (series index, series
  detail pages, shop, about, etc.). These are served from the Vercel edge
  cache with no origin hit.
- **API routes** are dynamic and run as serverless functions:
  - `/api/coins/purchase` -- retired; returns 501
  - `/api/coins/balance` -- retired; returns 501
  - `/api/checkout` -- feature-gated physical-merch Stripe Checkout
  - `/api/stripe/webhook` -- signed Series Unlock/VIP reconciliation
  - `/api/mux/webhook` -- signed creator-upload events; hardened route is live
    but returns 503 while the verification secret is intentionally absent, so
    creator ingestion/products remain deferred
  - `/api/unlock` -- authenticated $1.99 full-series Checkout
  - `/api/unlock/confirm` -- authenticated Series Unlock recovery
  - `/api/iap/apple/preflight` -- authenticated StoreKit product eligibility
  - `/api/iap/apple/transactions` -- authenticated signed transaction/restore reconciliation
  - `/api/iap/apple/notifications` -- Apple-signed V2 provider reconciliation
  - `/api/unlock/season-pass` -- retired; returns 410
  - `/api/subscribe` -- release-gated VIP Checkout
  - `/api/subscribe/confirm` -- authenticated VIP recovery
  - `/api/billing-portal` -- authenticated Stripe portal session
  - `/api/payments/capabilities` -- private native release capabilities
  - `/api/entitlements/check` -- entitlement check
  - `/api/entitlements` -- entitlement list
  - `/api/ai-host` -- AI Host chat
  - `/api/playback/[episode]` -- entitlement-aware signed video playback URL
  - `/api/auth/callback` -- Supabase auth callback
  - `/api/uploads` -- file uploads
  - `/api/studio/generate` -- studio content generation
  - `/api/og/[slug]` -- dynamic Open Graph images

---

## Preview vs Production

Non-production deploys (preview, development) receive an automatic
`X-Robots-Tag: noindex, nofollow` header on all routes. This is configured
in `next.config.ts` and gated on `VERCEL_ENV !== "production"`.

This prevents search engines from indexing preview URLs. Only the production
deploy is crawlable.

---

## Security Headers

All routes receive the following headers (configured in `next.config.ts`):

| Header | Value |
| ------ | ----- |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` |
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` |

Static assets under `/posters/` and `/shop/` are served with
`Cache-Control: public, max-age=31536000, immutable`.

---

## Production Domain

The canonical production origin is `https://www.verzatv.com` (the apex must
redirect canonically). It is also the native
client's API/backend origin, so a web rollback or alias change can affect both
clients immediately. Vercel-generated deployment URLs are operational/preview
addresses, not the canonical public domain. After every production deploy,
verify the canonical alias plus at least one public page and one required
API route before declaring the release healthy.

---

## Redirects

Configured in `next.config.ts`:

- Trailing slashes are stripped (`/:path+/` -> `/:path+`, 301)
- Typo slug corrections:
  - `/series/the-chauffer` -> `/series/the-chauffeur`
  - `/series/the-pendelton-secrete` -> `/series/the-pendleton-secret`

---

## Local Development

```bash
# Install dependencies
npm install

# Start dev server (default port 3000)
npm run dev

# Or specify a port if 3000 is occupied
PORT=3005 npm run dev
```

The dev server uses Turbopack for fast refresh. It can start without provider
credentials for source-only work, but provider-backed behavior is then
unavailable or fail-closed. Never treat a credential-free dev render as a
payment, entitlement, webhook, playback, email, or production-readiness test.

---

## Build Verification

```bash
npm run test:playback-security
npm run test:mux-webhook-security
npm run test:payments
npm run test:payments:db
npx tsc --noEmit
npm run lint
npm run build
```

The final command runs `next build` with Turbopack. The source build is designed
to compile without live provider credentials, but that says nothing about the
production environment. Provider inventory, authenticated capability, legal
page, webhook, signed-playback, and controlled purchase gates remain separate
and require the exact readbacks in the payment, Apple IAP, and Mux runbooks.

---

## Environment Variables

See [`ENV.md`](ENV.md) for the full variable reference. In Vercel, set them under
**Settings > Environment Variables**. Mark secrets as Sensitive.
