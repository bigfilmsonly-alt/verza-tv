# Environment reference

Last reconciled: **2026-08-05**. The operational authority, rollout semantics,
and safe placeholder file are in [`../guides/ENV.md`](../guides/ENV.md). This is
a concise index only; current code remains authoritative for reads.

`NEXT_PUBLIC_*` may enter browser bundles. Never place a secret, signed URL,
reviewer credential, access token, one-time code, or provider private object in
one. Non-public names must still be consumed only by server/ops modules.

## Site and deployment

| Variable | Exposure | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Public | Production canonical origin is `https://www.verzatv.com` |
| `VERCEL_ENV` | Platform-set | Controls production/noindex behavior; do not set manually |
| `CONTENT_SOURCE` | Server | Keep code-backed/default; Supabase adapter is not release-ready |
| `NEXT_PUBLIC_APPLE_APP_ID` | Public | Post-approval Smart App Banner only |

## Supabase

| Variable | Exposure | Notes |
| --- | --- | --- |
| `SUPABASE_URL` | Server | Server project URL |
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Browser auth project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Browser anon key; RLS remains mandatory |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret | Server only; bypasses RLS |

## Mux

| Variable | Exposure | Notes |
| --- | --- | --- |
| `MUX_TOKEN_ID` | Server/ops | Inventory/upload API identity |
| `MUX_TOKEN_SECRET` | Secret | Inventory/upload API credential |
| `MUX_SIGNING_KEY_ID` | Server | Paid playback JWT key ID |
| `MUX_SIGNING_KEY_SECRET` | Secret | Paid playback JWT private key |
| `MUX_SIGNED_PLAYBACK_ENABLED` | Server | Exact boolean; false compatibility, true signed; invalid/incomplete true state fails paid playback closed |
| `MUX_WEBHOOK_SECRET` | Secret | Creator-upload webhook verification, not playback signing |

All 3,753 paid-live rows have signed counterparts. Production flag/key/deploy
and backend canary are complete: unentitled 402/no capability, entitled signed
1,800-second URLs, and manifest 200. Standalone native-client acceptance remains
open. Any new environment must still follow the complete map/key sequence in
[`../guides/MUX.md`](../guides/MUX.md) before setting true.

The creator webhook route is separately deployed and hardened. Its production
verification secret is intentionally absent, so it returns 503 and performs no
ingestion mutation. Creator enablement requires a real Mux webhook secret and a
signed-event canary; the paid-playback signing key is not interchangeable.

## Stripe and payment release

| Variable | Exposure | Notes |
| --- | --- | --- |
| `STRIPE_SECRET_KEY` | Secret | Hosted Checkout/provider verification |
| `STRIPE_WEBHOOK_SECRET` | Secret | Canonical webhook signature verification |
| `STRIPE_AUTOMATIC_TAX_ENABLED` | Server | Exact boolean; remain false with zero active registrations |
| `STRIPE_CHECKOUT_TOS_CONSENT_REQUIRED` | Server | Exact false = compatibility; exact true = hosted Terms required; missing/malformed live state fails closed |
| `STRIPE_BILLING_PORTAL_CONFIGURATION_ID` | Sensitive | Exact reviewed restricted `bpc_...` configuration |
| `VIP_TRANSACTIONAL_NOTICES_ENABLED` | Server | Both VIP plans stay closed until notice path passes |
| `VIP_ANNUAL_RENEWAL_NOTICES_ENABLED` | Server | Yearly annual-reminder processing gate |
| `VIP_YEARLY_CHECKOUT_ENABLED` | Server | Separate yearly exposure gate |
| `MERCH_CHECKOUT_ENABLED` | Server | Keep false/absent until physical fulfillment is complete |

`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` remains in a legacy example but current
Series/VIP flows do not read it and ship no client-side Stripe SDK. It is not a
current payment requirement.

Production compatibility is live with exact false, Series configured/live, and
both VIP capabilities false. One canonical Stripe webhook is exact 19/19 with
wildcard off. Public details remains blank; the restricted portal, second
exact-true deployment, and controlled paid smoke remain open. Final Terms/portal
cutover requires Terms mode true.

## Apple StoreKit release

| Variable | Exposure | Notes |
| --- | --- | --- |
| `APPLE_IAP_ENABLED` | Server/Sensitive | Exact `true` opens authenticated new-purchase preflight. Any other state closes preflight but does not stop signed transaction/restore/adverse-event/notification reconciliation. |
| `APPLE_IAP_SANDBOX_ALLOWED_USER_IDS` | Sensitive | Comma-separated Supabase UUIDs accepted from Apple-signed Sandbox/TestFlight account tokens; empty denies Sandbox fulfillment. |

A names/type/target-only 2026-08-05 Vercel readback found both variables as
Production `Sensitive`; values were not read or printed. Independent behavior
readback proves exact true preflight and a narrow Sandbox allowlist, but does
not disclose membership. StoreKit signed-data verification uses Apple's public
roots and needs no App Store Server API private-key variable. See
[`../guides/APPLE-IAP.md`](../guides/APPLE-IAP.md).

## Email, cron, AI, push, and admin

| Variable | Exposure | Notes |
| --- | --- | --- |
| `RESEND_API_KEY` | Secret | Payment notices; VIP remains closed until monitored evidence passes |
| `CRON_SECRET` | Secret | 16+ character Vercel cron Bearer secret for yearly reminders |
| `ANTHROPIC_API_KEY` | Secret | Optional AI feature; absence must fail/degrade safely |
| `ANTHROPIC_MODEL` | Server | Optional model configuration |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Public | Browser push public key |
| `VAPID_PRIVATE_KEY` | Secret | Browser push signing key |
| `VAPID_SUBJECT` | Server | Browser push subject |
| `PUSH_API_KEY` | Secret | Push-send route guard |
| `ADMIN_EMAILS` | Server | Admin allowlist; never an authorization substitute by itself |

## One-command operator inputs

These are not persistent application configuration:

- `STRIPE_PUBLIC_DETAILS_TOS_READY=true` — guarded portal-creation attestation
  after visual Public-details verification;
- `PAYMENT_RUNTIME_BASE_URL` — canonical HTTPS origin override for the read-only
  verifier; and
- `PAYMENT_CAPABILITIES_ACCESS_TOKEN` — controlled Supabase JWT for an
  authenticated runtime gate, supplied without logging and unset immediately.

Use `.env.local.example` for names/placeholders. Never copy real values into a
Markdown file.

The current external credential-rotation gate covers `STRIPE_SECRET_KEY`,
`STRIPE_WEBHOOK_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, and the paired
`MUX_TOKEN_ID`/`MUX_TOKEN_SECRET`. Replace them as Vercel `Sensitive`, canary,
then revoke predecessors without value readback.
