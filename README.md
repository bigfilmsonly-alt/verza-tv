# Verza TV

Web product and production backend for the Verza TV native app: a catalog of
short, vertical micro-dramas delivered through Mux, with Supabase identity and
entitlements and server-created Stripe Checkout on eligible platforms.

- **Production:** https://www.verzatv.com
- **Hosting:** Vercel project `codevibes/verza-tv`
- **Native client:** sibling repository `../verza-native`
- **Current release truth:** [`docs/LAUNCH-TRUTH.md`](docs/LAUNCH-TRUTH.md)

> Production and the working tree are intentionally distinguished. As of the
> latest 2026-08-03 readback, August 3 legal/support, live payment capabilities
> in compatibility mode, signed paid playback, and the exact 19-event Stripe
> webhook are production-verified. Stripe Public details, required-consent
> mode/portal, and the controlled $1.99 smoke remain open. The hardened creator
> Mux webhook is deployed and returns 503 while its verification secret is
> intentionally absent, so creator ingestion remains unavailable.

## Product state

| Surface | Current launch behavior |
| --- | --- |
| Catalog | 80 titles: 79 live and one coming soon; 74 paid-live, five wholly free |
| Web browse | Drama, Hot, Tubi, Anime, Español, Bollywood, Creators, Reality, Red Carpet, Music. New is folded into Hot; Anime/Español/Bollywood are placeholders; Storage Pirates is Reality-only. Hero arrows were removed in favor of automatic rotation, dots, and tab/swipe navigation. |
| Tubi partner | Authorized web partner logo/hero panel and outbound `tubitv.com` CTA; browser policy prevents an ordinary embed. This web surface does not enter the iOS 2.0 client. |
| Series access | $1.99 one-time full-series unlock on web and eligible Android surfaces |
| iOS | Reader mode: existing entitlements only; no digital price, purchase, subscribe, billing, external-purchase direction, Tubi partner promotion, or creator surface |
| VIP | $9.99/month and $79.99/year code paths are hidden and API-blocked pending separate release gates |
| Coins | Disabled; purchase, balance, and season-pass routes fail closed |
| Creator beta / PPV | The web lead form and `/api/creator/beta` exist, but the Mux ingestion path remains fail-closed and creator PPV is disabled pending verification, ownership, fulfillment, and payout controls |
| Official merch Checkout | Disabled pending inventory, variants, shipping, tax, pricing, and fulfillment |
| Amazon affiliate shop | Web/retained Android system-browser handoff; fail-closed in the iOS 2.0 client |

Stripe Checkout is hosted by Stripe and created by the server. There is no
client-side Stripe SDK, Elements form, native card collection, or client-trusted
price. Browser return never grants access; provider-backed reconciliation and a
purchase-linked entitlement do.

## Video authorization

The complete logical Mux mapping has 4,262 rows. Client projections expose only
459 intentionally public/free playback capabilities. They withhold all 3,753
paid-live capabilities and 50 coming-soon capabilities (3,803 withheld total).
Every paid-live row has a server-only signed counterpart.

Production signed mode is live. Canary readback proved unentitled paid access
returns 402/no capability and an entitled request returns `policy=signed`, no
separate playback ID, 1,800-second tokenized stream/poster URLs, and a 200 HLS
manifest. Final standalone native-client acceptance remains a release gate. The
live 1.2 app depends on legacy public paid IDs, so those IDs
must coexist until a separately approved post-2.0 forced-update/drain decision.
Do not retire them as pre-submit cleanup.

Read [`docs/guides/MUX.md`](docs/guides/MUX.md) before changing maps, playback
URLs, entitlement checks, tokens, or Mux policy IDs.

## Stack

| Layer | Technology |
| --- | --- |
| Application | Next.js 16 App Router, React 19, TypeScript strict |
| Styling | Tailwind CSS v4 |
| Identity/data | Supabase Auth, Postgres, RLS, service-role server operations |
| Video | Mux HLS; `hls.js` on web; server-generated JWTs for paid playback |
| Payments | Stripe-hosted Checkout, verified webhooks, durable Supabase ledger |
| Notices | Resend, guarded by release flags and idempotent private evidence |
| Hosting | Vercel; Cloudflare/GoDaddy DNS path |

## Repository layout

```text
app/                 App Router pages and API route handlers
components/          shared web UI and player components
lib/                 catalog, Mux, Stripe, Supabase, auth, SEO, policy modules
public/              web assets
scripts/             read-only audits, generators, guarded provider operations
supabase/migrations/ database migrations; apply in numeric order
docs/                current runbooks plus explicitly dated archival reports
```

Key current modules:

- `lib/catalog.ts` — 80-title source catalog
- `lib/mux-public-map.ts` — client-safe projection
- `lib/mux-private-map.ts` — server-only gateway to complete legacy map
- `lib/mux-signed-map.ts` — server-only paid public-to-signed correspondence
- `lib/series-purchase.ts` — canonical Series Unlock product authority
- `lib/stripe-checkout-consent.ts` — explicit compatibility/required Terms mode
- `lib/series-checkout-recovery.ts` — durable provider-history recovery
- `lib/stripe-webhook-events.ts` — reviewed webhook event contract

## Local setup

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

Never commit `.env.local`. `NEXT_PUBLIC_*` values enter browser bundles; all
service-role, Mux signing, Stripe secret, webhook, Resend, and cron values must
remain server-only. Do not paste credentials, reviewer accounts, one-time codes,
signed URLs, or provider objects containing PII into source, docs, or logs.

Before editing Next.js code, read the exact local versioned documentation in
`node_modules/next/dist/docs/` as required by [`AGENTS.md`](AGENTS.md).

## Required source gates

```bash
npm run test:playback-security
npm run test:mux-webhook-security
npm run test:payments
npm run test:payments:db
npx tsc --noEmit
npm run lint
npm run build
```

Provider and production runtime gates are deliberately separate:

```bash
npm run test:payments:runtime:public
npm run test:payments:runtime:compatibility
npm run test:payments:runtime:required-consent
npm run test:payments:stripe-cutover
```

The authenticated runtime commands require a controlled Supabase JWT supplied
outside source/logs. Run only the phase matching the deployed Terms-consent
mode. The Stripe cutover command is red before the canonical webhook has exactly
19 events and the reviewed portal/Terms configuration exists; it must not be
used as a reason to mutate provider state out of order.

## Payment release boundary

Production now has one canonical enabled Stripe webhook with the exact reviewed
19/19 allowlist, wildcard off, no second endpoint, no replay, and no secret
rotation. An unsigned request returns HTTP 400. Automatic tax is off and Stripe
has zero active tax registrations. Both VIP plans remain closed.

The live compatibility deployment uses exact
`STRIPE_CHECKOUT_TOS_CONSENT_REQUIRED=false`, which permits Series Checkout
without Stripe's hosted Terms checkbox. August 3 legal/support pages are live,
but Stripe Public details remains blank and its Account API write was rejected
with 403. After an authorized Dashboard operator completes and visually
verifies Public details, the next deployment must use exact `true`.
Missing, empty, malformed, or unrecognized live-key configuration fails closed.
Final cutover requires `true`.

Do not infer tax registration from authority to sell nationwide, expand the
webhook before compatible code is live, create a second webhook endpoint,
replay historical events, or automatically refund a controlled smoke purchase.

See [`docs/guides/PAYMENTS.md`](docs/guides/PAYMENTS.md) and the exact current
cutover record in
[`docs/reports/PAYMENT-CUTOVER-EVIDENCE-2026-08-03.md`](docs/reports/PAYMENT-CUTOVER-EVIDENCE-2026-08-03.md).

## Database and deployment

Migrations `009` through `014` support the current payment ledger, RLS,
account-deletion tombstones, disputes, Terms evidence, and notice evidence.
They are already applied/read back in the current production project; any new
environment must apply migrations in filename order before matching webhook
code.

Deployment is an explicit operation followed by production readback:

```bash
npx vercel --prod --yes
```

Do not assume a push to `main`, a Vercel build, or local source changed the
canonical production alias. Follow
[`docs/guides/DEPLOYMENT.md`](docs/guides/DEPLOYMENT.md) and preserve the
payment/Mux phase ordering.

## Documentation

- [`docs/LAUNCH-TRUTH.md`](docs/LAUNCH-TRUTH.md) — current source vs production vs deferred truth
- [`docs/guides/PAYMENTS.md`](docs/guides/PAYMENTS.md) — payment/access invariants and cutover
- [`docs/guides/MUX.md`](docs/guides/MUX.md) — capability projection, signed playback, legacy coexistence
- [`docs/guides/REACT-NATIVE-SYNC.md`](docs/guides/REACT-NATIVE-SYNC.md) — web/backend ↔ native boundary
- [`docs/guides/PORTING-VERZA-TV-TAB.md`](docs/guides/PORTING-VERZA-TV-TAB.md) — archived web-extraction guide; not the Expo/native release architecture
- [`docs/guides/RUNBOOK.md`](docs/guides/RUNBOOK.md) — operational and incident procedures
- [`docs/README.md`](docs/README.md) — complete documentation map and status labels

Dated reports and strategy files are retained as history. Their archival banners
govern them; old prices, counts, and “live” claims must never override current
code, provider readback, `docs/LAUNCH-TRUTH.md`, or the canonical runbooks.
