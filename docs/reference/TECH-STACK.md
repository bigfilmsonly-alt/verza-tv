# Tech Stack

Verified from `package.json`. Verza TV is a Next.js 16 App Router application.

> **Note:** This is not the Next.js you may know from training data — v16 has
> breaking changes to APIs, conventions, and file structure. Consult
> `node_modules/next/dist/docs/` before writing framework code. All request APIs
> are async (`await cookies()`, `await headers()`, `await params`).

## Runtime dependencies

| Package | Version | Role |
| --- | --- | --- |
| `next` | 16.2.9 | App Router framework (SSR/SSG/route handlers, middleware) |
| `react` / `react-dom` | 19.2.4 | UI runtime |
| `@supabase/ssr` | ^0.12.0 | Cookie-based Supabase auth for SSR |
| `@supabase/supabase-js` | ^2.108.1 | Supabase client (DB, auth, RLS) |
| `@mux/mux-node` | ^14.1.1 | Mux server SDK (uploads, signed playback, assets) |
| `hls.js` | ^1.6.16 | Client HLS playback |
| `stripe` | ^22.2.2 | Payments, checkout, webhooks |
| `resend` | ^6.14.0 | Transactional email (`lib/email.ts`) |
| `web-push` | ^3.6.7 | Web-push notifications (VAPID) |
| `zod` | ^4.4.3 | Runtime schema validation |
| `@vercel/analytics` | ^2.0.1 | Product analytics |
| `@vercel/speed-insights` | ^2.0.0 | Core Web Vitals |

> `@anthropic-ai/sdk` is **optional** — loaded only when `ANTHROPIC_API_KEY` is
> provisioned (AI Host / Creator AI Studio). Missing → AI routes degrade
> gracefully.

## Dev / build tooling

| Package | Version | Role |
| --- | --- | --- |
| `typescript` | ^5 | Types |
| `tailwindcss` + `@tailwindcss/postcss` | ^4 | Styling (Tailwind v4, PostCSS) |
| `eslint` + `eslint-config-next` | ^9 / 16.2.9 | Linting |
| `@types/*` | — | React 19 / Node 20 / web-push types |

## Scripts (`package.json`)

| Script | Command |
| --- | --- |
| `dev` | `next dev` |
| `build` | `next build` |
| `start` | `next start` |
| `lint` | `eslint` |

Utility scripts live in `scripts/` (`reconcile-mux.ts`,
`attach-transcript.ts`) — see `scripts/README-reconcile.md`.

## Platform services

| Service | Use |
| --- | --- |
| **Vercel** | Hosting/CDN, deploy target (`codevibes/verza-tv`) |
| **Supabase** | Postgres + auth + RLS (`jejispfvlkwastzvwtwu.supabase.co`) |
| **Mux** | Video encoding, HLS delivery, signed URLs |
| **Stripe** | Checkout + subscriptions + webhooks (revenue truth) |
| **Cloudflare** | DNS in front of Vercel |
| **Resend** | Email delivery |
| **Anthropic (Claude)** | AI Host + Creator AI Studio |

## Config notes

- `next.config.ts`: `reactStrictMode: false`; CSP with `https://*.mux.com`
  wildcard; `next/image` remote patterns for Mux/poster hosts.
- Tailwind v4 via `postcss.config.mjs` (no `tailwind.config.js`).
