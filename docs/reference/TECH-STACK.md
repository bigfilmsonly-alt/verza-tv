# Tech stack

Verified from `package.json` on **2026-08-03**.

> Next.js 16.3.0 has breaking/version-specific behavior. Read the relevant
> exact local guide under `node_modules/next/dist/docs/` before writing framework
> code. Request APIs such as `cookies()`, `headers()`, and route `params` are
> asynchronous.

## Runtime dependencies

| Package | Declared version | Role |
| --- | --- | --- |
| `next` | `16.3.0` | App Router, Server Components, route handlers, build/runtime |
| `react`, `react-dom` | `19.2.4` | UI runtime |
| `@supabase/ssr` | `^0.12.0` | Cookie-aware server auth |
| `@supabase/supabase-js` | `^2.108.1` | Auth/data/RLS clients |
| `@mux/mux-node` | `^14.1.1` | Server Mux API and signing support |
| `hls.js` | `^1.6.16` | Web HLS fallback/player runtime |
| `stripe` | `^22.2.2` | Server Checkout, provider retrieval, webhooks |
| `resend` | `^6.14.0` | Guarded transactional notice sending |
| `web-push` | `^3.6.7` | Web push/VAPID |
| `zod` | `^4.4.3` | Runtime validation |
| `@vercel/analytics` | `^2.0.1` | Web analytics |
| `@vercel/speed-insights` | `^2.0.0` | Web performance telemetry |

No client-side Stripe SDK is installed. Current digital checkout is
server-created and Stripe-hosted. No Anthropic SDK is installed; AI scaffolding
must degrade/fail safely and is not a native-launch dependency.

## Development/build tooling

| Package | Declared version | Role |
| --- | --- | --- |
| `typescript` | `^5` | Strict type checking |
| `tailwindcss`, `@tailwindcss/postcss` | `^4` | Tailwind v4/PostCSS styling |
| `eslint` | `^9` | Lint engine |
| `eslint-config-next` | `16.2.9` | Current Next lint rules; note it does not exactly match runtime Next 16.3.0 |
| `@types/node`, `@types/react`, `@types/react-dom`, `@types/web-push` | declared ranges | Type packages |

The runtime/lint-config version mismatch is an explicit inventory fact, not
permission to upgrade during release freeze. Any alignment needs a separate
dependency/build/UI regression pass.

## Package scripts

| Script | Purpose / mutation |
| --- | --- |
| `dev`, `build`, `start`, `lint` | Standard Next development/build/runtime/lint |
| `mux:signed:self-test` | Offline non-mutating parser/migration self-test |
| `mux:signed:audit` | Live read-only Mux inventory audit using local env |
| `mux:public:audit` | Verify public capability projection without writing |
| `mux:public:generate` | Regenerate the public projection; source write |
| `test:mux-webhook-security` | Mux creator-webhook missing/invalid/processing fail-closed contract plus synthetic signatures |
| `test:playback-security` | Web/client Mux capability and boundary gate |
| `test:payments` | Pure payment integrity/contract suite |
| `test:payments:db` | Rollback-only live-schema/payment RPC/RLS suite |
| `test:payments:stripe-cutover` | Final Series cutover provider gate; requires exact 19 events, Terms true, portal exact, VIP false |
| `test:payments:stripe` | Future VIP-launch provider gate; not Series cutover evidence |
| `test:payments:runtime:public` | GET-only legal/support plus unauthenticated private-capability gate |
| `test:payments:runtime:compatibility` | Authenticated exact-false Terms-mode readiness |
| `test:payments:runtime:required-consent` | Authenticated exact-true Terms-mode readiness |
| `stripe:portal:check` | Read-only exact portal audit |
| `stripe:portal:configure` | Guarded live portal mutation; requires explicit confirmations and Public-details attestation |

Scripts that read provider credentials remain operations tools. Never print or
copy secrets/provider PII into logs or docs. The public/signed Mux write commands
and portal configuration command are not routine verification.

## Services and launch state

| Service | Role | Current release note |
| --- | --- | --- |
| Vercel | Canonical web/backend deployment | Local source is ahead of verified production |
| Supabase | Auth, Postgres, RLS, access/payment ledgers | Migrations `009`–`014` applied/read back |
| Mux | Encoding, HLS, public/signed capability IDs, creator asset events | Signed mode live; 402/no-capability and entitled signed 1,800-second URL/manifest canary passed; standalone native acceptance open. Creator webhook hardening is deployed but returns 503 while its separate verification secret is intentionally absent, so ingestion stays off |
| Stripe | Hosted Checkout, financial source, signed webhooks | Compatibility capabilities live; canonical webhook exact 19/19; Public details/required consent/portal/smoke open; VIP closed; tax off/zero registrations |
| Resend | Payment notices | VIP notice/monitoring launch gate remains closed |
| Cloudflare/DNS | Domain path to Vercel | Canonical origin is `https://www.verzatv.com` |

## Configuration notes

- Tailwind v4 uses `postcss.config.mjs`; there is no Tailwind v3 config flow.
- Preview/non-production deployments must remain noindex.
- Protected Mux capabilities and every secret are server-only.
- A successful `next build` proves compilation/static generation, not provider
  configuration, production alias ownership, payment fulfillment, signed
  playback, or native behavior.
