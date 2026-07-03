# Environment Variables

Copy `.env.example` to `.env.local` and fill in real values.
Never commit `.env.local` -- it is gitignored.

---

## Variable Reference

| Variable | Purpose | Required | Secret |
| -------- | ------- | -------- | ------ |
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL used for OG tags, sitemaps, and absolute links. Defaults to `https://verzatv.com` when unset. | No | No |
| `SUPABASE_URL` | Supabase project API URL (server-side). | Yes | No |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project API URL (client-side, bundled into JS). | Yes | No |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous/public key for client-side auth and reads. Safe to expose -- RLS enforces access. | Yes | No |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service-role key. Bypasses RLS -- used only in server-side routes (webhooks, admin ops). | Yes | **Yes** |
| `MUX_TOKEN_ID` | Mux API token ID for server-side video asset management. | Yes | No |
| `MUX_TOKEN_SECRET` | Mux API token secret. | Yes | **Yes** |
| `MUX_SIGNING_KEY_ID` | Mux signing key ID for generating signed playback URLs. | Yes | No |
| `MUX_SIGNING_KEY_SECRET` | Mux signing key private key (base64-encoded RSA). Used to sign playback tokens so videos cannot be accessed without authorization. | Yes | **Yes** |
| `STRIPE_SECRET_KEY` | Stripe secret API key for creating PaymentIntents, Checkout Sessions, and verifying webhooks. | For payments | **Yes** |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret (`whsec_...`). Used by `/api/stripe/webhook` to verify inbound events. | For payments | **Yes** |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key for client-side Stripe.js / Elements. | For payments | No |
| `ANTHROPIC_API_KEY` | Anthropic API key for the AI Host feature (`/api/ai-host`). | For AI Host | **Yes** |
| `ANTHROPIC_MODEL` | Anthropic model ID to use (e.g. `claude-sonnet-4-6`). Optional -- the code falls back to a default if unset. | No | No |
| `CONTENT_SOURCE` | Controls where catalog/episode data is loaded from. When unset, the app uses the local static catalog in `lib/catalog.ts`. | No | No |
| `VERCEL_ENV` | Automatically set by Vercel (`production`, `preview`, or `development`). Used to gate `X-Robots-Tag: noindex` on non-production deploys and to toggle `env.isProduction`. Do not set manually. | No (auto) | No |

---

## Placeholder `.env.local`

```bash
# Site
NEXT_PUBLIC_SITE_URL=https://verzatv.com

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

# Stripe (payments)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Anthropic (AI Host)
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-sonnet-4-6

# Optional
CONTENT_SOURCE=
# VERCEL_ENV is set automatically by Vercel -- do not set manually
```

---

## How Variables Are Loaded

`lib/env.ts` exports a typed `env` object that reads `process.env` at
import time. The `getEnv(key, required?)` helper logs a warning for missing
required values but does not throw, so the app can build without all keys
present. Stripe and Anthropic clients are lazy-initialized behind env checks
in their respective route handlers.

Variables prefixed with `NEXT_PUBLIC_` are inlined into the client bundle at
build time. All others are server-only and never reach the browser.

---

## Vercel Setup

In the Vercel dashboard, add each secret variable under
**Settings > Environment Variables**. Mark secrets as "Sensitive" so they
are encrypted and hidden in logs. Use separate values for Preview vs
Production if needed (e.g. `sk_test_` for preview, `sk_live_` for
production).
