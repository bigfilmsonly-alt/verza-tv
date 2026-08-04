# Verza TV — Environment Variables Audit (historical)

> **ARCHIVE — non-secret 2026-07-11 environment-name snapshot.** Presence,
> absence, counts, and action items below are not current Vercel readback and
> must never be used to infer a secret value or deployed feature. Current
> contract: [`../guides/ENV.md`](../guides/ENV.md).

Audited: 2026-07-11. **Superseded:** this is a historical snapshot, not an
environment source of truth. Use `docs/guides/ENV.md`, inspect environment names
without pulling secret values, and verify the intended deployment after every
change. On 2026-08-03 the approved production/local payment target was verified;
current and obsolete project identifiers are intentionally omitted and must be
resolved through the approved environment. `.env.local` is git-ignored.

## ✅ Present in `.env.local` (15)

| Variable | Purpose | Notes |
|---|---|---|
| `SUPABASE_URL` | Supabase project URL (server) | Historical/current project identifiers intentionally omitted; use approved environment readback. |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL (client/auth) | |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | Public by design; RLS protects data |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase admin key | Server-only; used by API routes and the webhook |
| `STRIPE_SECRET_KEY` | Stripe API | **LIVE mode** (`sk_live_…`) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe client key | |
| `STRIPE_WEBHOOK_SECRET` | Webhook signature verification | Verified in use (`constructEvent`) |
| `MUX_TOKEN_ID` / `MUX_TOKEN_SECRET` | Mux API (asset management) | Read access verified working |
| `RESEND_API_KEY` | Transactional email (purchase confirmations) | |
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL | Must remain `https://www.verzatv.com` (www) |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` | Web push notifications | |
| `PUSH_API_KEY` | Push send-endpoint auth | |

## ❌ Referenced in code but NOT set (7)

| Variable | Used in | Impact of absence |
|---|---|---|
| `ANTHROPIC_API_KEY` | `app/api/ai-host/route.ts` | Creator AI tools (/studio) are **non-functional** — the route cannot call Anthropic. Feature is effectively disabled. |
| `MUX_SIGNING_KEY_ID` / `MUX_SIGNING_KEY_SECRET` | `lib/mux.ts` | Signed playback URLs unavailable. Not currently needed — all 4,262 episodes use **public** playback policy. Becomes relevant only if content protection is desired. |
| `MUX_WEBHOOK_SECRET` | `app/api/mux/webhook/route.ts` | Mux webhook events (asset ready, errors) are not verifiable → the endpoint is effectively dead. Uploads are reconciled manually instead. |
| `NEXT_PUBLIC_APPLE_APP_ID` | `app/c/[slug]/page.tsx` | Smart App Banner on shared clip pages does not render (intentional until the app is live in App Store Connect — **set this after app approval**). |
| `CONTENT_SOURCE` | `lib/content/transcripts.ts`, `lib/content/index.ts` | SEO transcript/content pipeline falls back to defaults. Low impact. |
| `NEXT_PUBLIC_PERF_TEST_MODE` | `lib/perf/seed.ts` | Perf harness flag; dev-only. No impact. |

## ⚠️ Action items

1. **Verify the Vercel production environment** has all 15 present variables (deploys succeed and payments work in production, so the critical ones are confirmed set — `ANTHROPIC_API_KEY` absence should be treated as "AI tools intentionally off").
2. **After App Store approval:** set `NEXT_PUBLIC_APPLE_APP_ID` in Vercel and redeploy to enable the Smart App Banner.
3. **If Mux upload automation is ever wanted:** provision `MUX_WEBHOOK_SECRET` (+ configure the webhook in the Mux dashboard to point at `/api/mux/webhook`).
4. Never commit `.env.local`; rotate any key that ever appears in chat logs, screenshots, or tickets.
