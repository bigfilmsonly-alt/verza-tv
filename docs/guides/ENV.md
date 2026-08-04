# Environment Variables

Copy `.env.local.example` to `.env.local` and fill in real values.
Never commit `.env.local` -- it is gitignored.

> Latest 2026-08-03 readback: production signed playback is exact `true` and its
> access/manifest canary passed; payment Terms mode is exact `false`
> compatibility with both VIP capabilities false; the canonical Stripe webhook
> is exact 19/19. Stripe Public details remains blank, so required Terms mode,
> the restricted Billing Portal, and the paid smoke remain open. Do not infer a
> value from this document; provider/readback evidence is authority.

---

## Variable Reference

| Variable | Purpose | Required | Secret |
| -------- | ------- | -------- | ------ |
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL used for OG tags, sitemaps, and absolute links. Production must be `https://www.verzatv.com`. | Production | No |
| `SUPABASE_URL` | Supabase project API URL (server-side). | Yes | No |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project API URL (client-side, bundled into JS). | Yes | No |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous/public key for client-side auth and reads. Safe to expose -- RLS enforces access. | Yes | No |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service-role key. Bypasses RLS -- used only in server-side routes (webhooks, admin ops). | Yes | **Yes** |
| `MUX_TOKEN_ID` | Mux API token ID for server-side video asset management. | Yes | No |
| `MUX_TOKEN_SECRET` | Mux API token secret. | Yes | **Yes** |
| `MUX_SIGNING_KEY_ID` | Mux signing key ID used by the server to generate paid playback JWTs. | Signed playback | No |
| `MUX_SIGNING_KEY_SECRET` | Mux signing key private key (base64-encoded RSA). Never enters either client bundle. | Signed playback | **Yes** |
| `MUX_SIGNED_PLAYBACK_ENABLED` | Exact `true`/`false`; defaults false. When true, incomplete paid signed configuration fails closed instead of returning a public URL. | Signed playback | No |
| `MUX_WEBHOOK_SECRET` | Verifies creator-upload asset events at `/api/mux/webhook`; unrelated to paid playback JWT signing. | Creator upload automation | **Yes** |
| `STRIPE_SECRET_KEY` | Stripe secret API key for creating PaymentIntents, Checkout Sessions, and verifying webhooks. | For payments | **Yes** |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret (`whsec_...`). Used by `/api/stripe/webhook` to verify inbound events. | For payments | **Yes** |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Legacy example value; current Series/VIP flows use hosted Checkout and do not read this variable or ship a client Stripe SDK. Do not treat it as required. | No | No |
| `STRIPE_AUTOMATIC_TAX_ENABLED` | Exact `true`/`false`. Keep `false` until registrations/tax review are complete. | For payments | No |
| `STRIPE_CHECKOUT_TOS_CONSENT_REQUIRED` | Required exact `true`/`false` for live keys. `false` is compatibility mode without Stripe's hosted Terms checkbox; `true` is required only after Public details has the Terms URL. Missing, empty, or malformed values fail closed. | Live payments | No |
| `STRIPE_BILLING_PORTAL_CONFIGURATION_ID` | Exact reviewed `bpc_...` configuration used for authenticated VIP management/cancellation. | VIP payments | No |
| `VIP_TRANSACTIONAL_NOTICES_ENABLED` | Exact `true`/`false`. Enables VIP sale UI/API only after application-owned acknowledgment, renewal receipt, and cancellation email delivery is verified. | VIP payments | No |
| `VIP_ANNUAL_RENEWAL_NOTICES_ENABLED` | Exact `true`/`false`. Enables the secured daily 15–45-day yearly reminder route; does not itself expose yearly checkout. | Yearly VIP | No |
| `VIP_YEARLY_CHECKOUT_ENABLED` | Exact `true`/`false`. Yearly UI/API remains blocked unless transactional notices, annual notices, Resend, and cron-secret checks also pass. | Yearly VIP | No |
| `RESEND_API_KEY` | Resend server API key used for customer-facing VIP payment notices. | VIP payments | **Yes** |
| `CRON_SECRET` | Random 16+ character Bearer secret automatically attached by Vercel to the annual-reminder cron request. | Yearly VIP | **Yes** |
| `MERCH_CHECKOUT_ENABLED` | Exact `true` enables official-merch Checkout. Keep absent/false until variants, shipping, inventory, tax, confirmed pricing, persistence, and fulfillment are ready. | Deferred merch | No |
| `ANTHROPIC_API_KEY` | Anthropic API key for the AI Host feature (`/api/ai-host`). | For AI Host | **Yes** |
| `ANTHROPIC_MODEL` | Anthropic model ID to use (e.g. `claude-sonnet-4-6`). Optional -- the code falls back to a default if unset. | No | No |
| `CONTENT_SOURCE` | Controls where catalog/episode data is loaded from. When unset, the app uses the local static catalog in `lib/catalog.ts`. | No | No |
| `NEXT_PUBLIC_APPLE_APP_ID` | Enables the web Smart App Banner only after the approved App Store ID/release decision. | Post-approval | No |
| `VERCEL_ENV` | Automatically set by Vercel (`production`, `preview`, or `development`). Used to gate `X-Robots-Tag: noindex` on non-production deploys and to toggle `env.isProduction`. Do not set manually. | No (auto) | No |

---

## Placeholder `.env.local`

```bash
# Site
NEXT_PUBLIC_SITE_URL=https://www.verzatv.com

# Supabase
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-anon-key
SUPABASE_SERVICE_ROLE_KEY=eyJ...your-service-role-key

# Mux (video)
MUX_TOKEN_ID=your-mux-token-id
MUX_TOKEN_SECRET=your-mux-token-secret
MUX_SIGNING_KEY_ID=your-signing-key-id
MUX_SIGNING_KEY_SECRET=LS0t...base64-encoded-private-key
MUX_SIGNED_PLAYBACK_ENABLED=false
MUX_WEBHOOK_SECRET=replace-with-provider-webhook-secret

# Stripe (payments)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_AUTOMATIC_TAX_ENABLED=false
STRIPE_CHECKOUT_TOS_CONSENT_REQUIRED=false
STRIPE_BILLING_PORTAL_CONFIGURATION_ID=bpc_...
VIP_TRANSACTIONAL_NOTICES_ENABLED=false
VIP_ANNUAL_RENEWAL_NOTICES_ENABLED=false
VIP_YEARLY_CHECKOUT_ENABLED=false
RESEND_API_KEY=re_...
CRON_SECRET=replace-with-a-random-secret
MERCH_CHECKOUT_ENABLED=false

# Anthropic (AI Host)
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-sonnet-4-6

# Optional
CONTENT_SOURCE=
NEXT_PUBLIC_APPLE_APP_ID=
# VERCEL_ENV is set automatically by Vercel -- do not set manually
```

---

## How Variables Are Loaded

`lib/env.ts` exports a typed `env` object that reads `process.env` at
import time. The `getEnv(key, required?)` helper logs a warning for missing
required values but does not throw, so the app can build without all keys
present. Stripe and Anthropic clients are lazy-initialized behind env checks
in their respective route handlers.

Variables prefixed with `NEXT_PUBLIC_` may be inlined into the client bundle at
build time. All secret consumers must be server-only modules; a non-public name
is not permission to import secret-reading code into a client component.

`MUX_SIGNED_PLAYBACK_ENABLED` is intentionally server-only and parsed more
strictly than the general environment helper: only exact `true` or `false` is
accepted. A fresh/unverified environment starts false. Production is now true
after re-auditing the complete 3,753-row paid-live signed inventory, generating
the map, configuring keys, deploying, and canarying. Follow
[`MUX.md`](MUX.md#production-release-sequence) before changing it. When true, a
missing map row or key returns 503 for paid playback; there is no unsigned
fallback.

The hardened creator webhook is deployed, but production intentionally has no
`MUX_WEBHOOK_SECRET` while the creator pipeline is deferred. Its readback is
HTTP 503 `Webhook verification unavailable`, with no unsigned fallback. Before
enabling ingestion, configure a real provider secret through the approved
secret store and pass a signed-event canary; never reuse a playback signing key.

---

## Vercel Setup

In the Vercel dashboard, add each secret variable under
**Settings > Environment Variables**. Mark secrets as "Sensitive" so they
are encrypted and hidden in logs. Use separate values for Preview vs
Production if needed (e.g. `sk_test_` for preview, `sk_live_` for
production).

`STRIPE_PUBLIC_DETAILS_TOS_READY=true` is a one-command operator attestation for
`npm run stripe:portal:configure`; do not persist it in Vercel. Set it only after
visually verifying the Stripe Dashboard Public details Terms URL.

`PAYMENT_RUNTIME_BASE_URL` and `PAYMENT_CAPABILITIES_ACCESS_TOKEN` are
operator-shell inputs for the read-only runtime verifier, not persistent Vercel
application configuration. Supply the controlled Supabase JWT without logging
it, run only the command matching the deployed compatibility/required phase,
then unset it. `STRIPE_PUBLIC_DETAILS_TOS_READY` is likewise a one-command
operator attestation, not a release flag.
