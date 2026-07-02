# Environment Variables

Source of truth: `lib/env.ts` (typed accessor `env.*`). Set these in Vercel
project settings (Production / Preview) and in `.env.local` for local dev.

> `NEXT_PUBLIC_*` vars are exposed to the browser — never put secrets there.
> All other vars are server-only. Never expose service keys or signed URLs to
> the client.

## Site

| Var | `env.*` | Required | Notes |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | `siteUrl` | No | Defaults to `https://verzatv.com` |
| `VERCEL_ENV` | `isProduction` | auto | `"production"` gates prod-only behavior |

## Supabase

| Var | `env.*` | Required | Notes |
| --- | --- | --- | --- |
| `SUPABASE_URL` | `supabaseUrl` | Yes | Project URL (server) |
| `NEXT_PUBLIC_SUPABASE_URL` | — | Yes | Public URL for browser client |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `supabaseAnonKey` | Yes | Anon key (browser) |
| `SUPABASE_SERVICE_ROLE_KEY` | `supabaseServiceKey` | Yes | **Server only.** Bypasses RLS — used by webhook/persist. |

## Mux

| Var | `env.*` | Required | Notes |
| --- | --- | --- | --- |
| `MUX_TOKEN_ID` | `muxTokenId` | Yes* | API access (uploads/assets). *Creator upload returns 503 without it. |
| `MUX_TOKEN_SECRET` | `muxTokenSecret` | Yes* | API secret |
| `MUX_SIGNING_KEY_ID` | `muxSigningKeyId` | Yes | Signed playback URLs |
| `MUX_SIGNING_KEY_SECRET` | `muxSigningKeySecret` | Yes | Signed playback URLs |
| `MUX_WEBHOOK_SECRET` | — | Yes* | Verify `/api/mux/webhook` |

## Stripe

| Var | `env.*` | Required | Notes |
| --- | --- | --- | --- |
| `STRIPE_SECRET_KEY` | `stripeSecretKey` | Yes | Checkout + subscriptions |
| `STRIPE_WEBHOOK_SECRET` | `stripeWebhookSecret` | Yes | Verify `/api/stripe/webhook` (revenue truth) |

## AI (optional)

| Var | `env.*` | Required | Notes |
| --- | --- | --- | --- |
| `ANTHROPIC_API_KEY` | `anthropicApiKey` | No | Enables AI Host + Creator AI Studio. Absent → AI routes degrade. |

## Web push

| Var | `env.*` | Required | Notes |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | `vapidPublicKey` | No | Browser push key |
| `VAPID_PRIVATE_KEY` | `vapidPrivateKey` | No | **Server only** |
| `VAPID_SUBJECT` | `vapidSubject` | No | Defaults to `mailto:support@verzatv.com` |
| `PUSH_API_KEY` | `pushApiKey` | No | Gates `/api/push/send` |

## Admin

| Var | Required | Notes |
| --- | --- | --- |
| `ADMIN_EMAILS` | Yes | Comma-separated allow-list for admin Bearer-token routes (`lib/admin.ts`). |

## Email

| Var | Required | Notes |
| --- | --- | --- |
| `RESEND_API_KEY` | Yes | Transactional email via Resend (`lib/email.ts`). |

## Local development

```bash
cp .env.example .env.local   # if present; otherwise create .env.local
# fill in the vars above
npm install
npm run dev                  # http://localhost:3000
```

Missing required vars log a warning via `getEnv(key, true)` but do not crash the
process at import time — features fail at call sites instead.
