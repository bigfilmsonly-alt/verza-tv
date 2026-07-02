# Verza TV

**The first US-based vertical micro-drama streaming platform.** Netflix-style
catalog of short, vertical, minutes-long episodes — plus creator UGC, an AI
host, and full Stripe monetization. Built on Next.js 16 and shipping in
production.

- **Live:** https://www.verzatv.com
- **Hosting:** Vercel (`codevibes/verza-tv`) · **DNS:** GoDaddy → Cloudflare → Vercel
- **Status:** In production, actively monetizing (Stripe live mode)

---

## Table of contents

1. [What it is](#what-it-is)
2. [Feature overview](#feature-overview)
3. [Tech stack](#tech-stack)
4. [Monetization model](#monetization-model)
5. [Architecture](#architecture)
6. [Repository layout](#repository-layout)
7. [Project metrics](#project-metrics)
8. [Local development](#local-development)
9. [Environment variables](#environment-variables)
10. [Database & migrations](#database--migrations)
11. [Deployment](#deployment)
12. [Documentation index](#documentation-index)
13. [React Native migration notes](#react-native-migration-notes)

---

## What it is

Verza TV delivers **vertical micro-dramas** — full serialized shows told in
1–3 minute vertical episodes, designed for phone-first, swipe-native viewing
(think TikTok's format applied to premium scripted drama). The platform
combines:

- A **curated catalog** of 80 titles (77 currently marked live in
  `lib/catalog.ts`), delivered as HLS via Mux (~4,150 playback assets mapped in
  `lib/mux-map.ts`).
- A **creator pipeline (UGC)** where approved creators upload, price, and
  publish their own vertical content with an 80/20 revenue split.
- **AI features** (optional, powered by Anthropic Claude): an "Ask Verza"
  chatbot and a Creator AI Studio (script/logline/social/description tools).
- **Full commerce**: per-title unlocks, VIP subscriptions, and a merch shop —
  all on live Stripe with webhook-verified revenue.

## Feature overview

| Area | What's built |
| --- | --- |
| **Playback** | Mux HLS via `hls.js`, signed playback URLs, muted-first autoplay (iOS-safe), immersive vertical swipe feed, horizontal 16:9 feed, shorts carousel |
| **Browse / discovery** | Hero slideshow (pause-on-hover), category tabs (Drama, New, Hot, Music, Reality, Red Carpet), poster grid, genre/keyword search (header popover + `/search`) |
| **Monetization** | $1.99 per-title unlock, VIP ($9.99/mo · $79.99/yr), 10-product merch shop, woven TikTok Shop sponsored ad tiles, StorageBlue sponsor ribbons |
| **Creator (UGC)** | Apply → admin approve → Mux upload (XHR progress) → edit/price → submit → admin review → publish → public `/watch`; 80/20 sales ledger |
| **AI (optional)** | Ask Verza chatbot; Creator AI Studio; multi-mode API (chat/creator/seo/marketing/moderate) |
| **Accounts** | Supabase auth (email + OAuth), library / My List, watch progress, entitlements, guest-purchase claim on sign-up |
| **Admin** | Stats + funnel (paywall→checkout→purchase) + revenue dashboard; creator application & content review queues |
| **Platform** | i18n (`useTranslation`), PWA service worker, web-push (VAPID), JSON-LD structured data, sitemaps, rate limiting, CSP |

## Tech stack

| Layer | Technology |
| --- | --- |
| Framework | **Next.js 16.2.9** (App Router, Turbopack) — note: v16 has breaking changes vs. earlier versions; all request APIs are async (`await cookies()/headers()/params`) |
| Language / UI | TypeScript 5 · React 19.2.4 · Tailwind CSS v4 (PostCSS, no `tailwind.config.js`) |
| Auth & DB | Supabase (Postgres + RLS) via `@supabase/ssr` (cookie sessions) |
| Video | Mux (`@mux/mux-node`) for encoding/HLS/signed URLs; `hls.js` client playback |
| Payments | Stripe (`stripe`) — checkout, subscriptions, webhooks (single source of revenue truth) |
| Email | Resend (`resend`) transactional email |
| Push | `web-push` (VAPID) |
| AI | Anthropic Claude (`@anthropic-ai/sdk`, **optional** — loaded only when `ANTHROPIC_API_KEY` is set) |
| Validation | `zod` |
| Analytics | `@vercel/analytics`, `@vercel/speed-insights` |
| Hosting | Vercel; Cloudflare DNS |

See [`docs/reference/TECH-STACK.md`](docs/reference/TECH-STACK.md) for exact
versions and roles.

## Monetization model

All revenue is recorded **only** from the Stripe webhook after signature
verification — prices are computed server-side (never client-controlled).

- **Per-title unlock** — $1.99 (Summer Sale), charged via `/api/unlock`.
- **VIP subscription** — $9.99/mo or $79.99/yr.
- **Merch** — 10 products ($15–$110) in the shop.
- **Creator UGC** — pay-per-view / premium pricing, **80/20 split** to
  creators, recorded in a server-only `creator_sales` ledger.
- **Sponsored ads** — TikTok Shop product tiles woven into the grid + search;
  StorageBlue sponsor ribbons.

Details: [`docs/PAYMENTS.md`](docs/PAYMENTS.md) ·
[`docs/HIGH-CONVERSION-PLAYBOOK.md`](docs/HIGH-CONVERSION-PLAYBOOK.md).

## Architecture

- **Single-render layout shell:** `.device-frame` → `.device-screen` →
  `.app-shell` → `main`. On desktop, CSS wraps the app in an iPhone frame; on
  mobile the screen has no overflow so `position:fixed` works on iOS Safari.
- **Server-render crawlable content;** client components (`"use client"`) only
  for interactivity. Never expose API keys or signed URLs to the client.
- **Revenue truth lives server-side:** pricing, entitlements, and the Stripe
  webhook are all in API routes — portable to any future client.
- **Immersive video** uses a persistent single-player pattern with a
  `sourceReady` gate and `mutedRef` (ref, not state) in async callbacks.

Full write-up: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) ·
[`docs/DATA-MODEL.md`](docs/DATA-MODEL.md).

## Repository layout

```
app/            Next.js App Router — pages + 32 API routes (app/api/*)
components/     47 React components (players, browse, paywalls, creator, admin)
lib/            catalog, products, theme, schemas, search-index, sponsors,
                mux-map, env, auth, supabase clients, analytics
supabase/       migrations/ (7 SQL files) + seed
scripts/        reconcile-mux.ts, attach-transcript.ts (+ README-reconcile.md)
docs/           all documentation (see index below)
public/         static assets, ads, icons, service worker
```

Full map: [`docs/reference/PROJECT-STRUCTURE.md`](docs/reference/PROJECT-STRUCTURE.md).

## Project metrics

_Verified from source / git / build as of the latest audit (commit `c5f1610`)._

| Metric | Value |
| --- | --- |
| Commits | 307 |
| App/lib/components code | 38,269 lines TS/TSX |
| Components | 47 |
| API routes | 32 |
| Pages (`page.tsx`) | 57 |
| DB migrations | 7 |
| Catalog titles / live | 80 / 77 |
| Mux playback assets | ~4,146 |
| Merch products | 10 |
| Build | ✅ green — 1085 pages prerendered |

## Local development

```bash
git clone https://github.com/Splash-Studio/verza-tv.git
cd verza-tv
npm install
cp .env.local.example .env.local   # then fill in the vars (see below)
npm run dev                        # http://localhost:3000
```

Scripts (`package.json`): `dev` · `build` · `start` · `lint`.

## Environment variables

Source of truth is `lib/env.ts` (typed `env.*` accessor). Required groups:
Supabase (`SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`), Mux
(`MUX_TOKEN_ID/SECRET`, `MUX_SIGNING_KEY_ID/SECRET`, `MUX_WEBHOOK_SECRET`),
Stripe (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`), `RESEND_API_KEY`,
`ADMIN_EMAILS`. Optional: `ANTHROPIC_API_KEY`, VAPID push keys.

> `NEXT_PUBLIC_*` vars reach the browser — never put secrets there. All other
> vars are server-only. `.env.local` is git-ignored (`.gitignore` → `.env*`).

Full table: [`docs/reference/ENVIRONMENT.md`](docs/reference/ENVIRONMENT.md).

## Database & migrations

Supabase Postgres with RLS on all tables (`profiles`, `entitlements`,
`purchases`, `watch_progress`, `saved_list`, `pending_entitlements`, plus
creator + analytics tables). Migrations live in `supabase/migrations/`
(`001`–`006`). Run pending migrations via the Supabase SQL editor or
`supabase db push`. See [`docs/DATA-MODEL.md`](docs/DATA-MODEL.md) and
[`docs/DEV-REPORT-CURRENT.md`](docs/DEV-REPORT-CURRENT.md) §4 for the current
run/provision checklist.

## Deployment

Hosted on Vercel (`codevibes/verza-tv`), auto-aliased to `www.verzatv.com`.

```bash
npx vercel deploy --prod
```

Preview deploys are `noindex`; only production is indexed. Runbook:
[`docs/RUNBOOK.md`](docs/RUNBOOK.md) · [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

## Documentation index

The complete, grouped index is in **[`docs/README.md`](docs/README.md)**. Highlights:

| Doc | Covers |
| --- | --- |
| [`docs/DEV-REPORT-CURRENT.md`](docs/DEV-REPORT-CURRENT.md) | **Latest master audit** — metrics, audit results, fixes, open items, secret sweep, test checklist, RN readiness |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | System design & layout shell |
| [`docs/DATA-MODEL.md`](docs/DATA-MODEL.md) | Supabase tables, RLS, entitlements |
| [`docs/reference/API-REFERENCE.md`](docs/reference/API-REFERENCE.md) | Every `app/api/*` endpoint |
| [`docs/reference/COMPONENTS.md`](docs/reference/COMPONENTS.md) | Every React component |
| [`docs/MUX.md`](docs/MUX.md) · [`docs/PAYMENTS.md`](docs/PAYMENTS.md) | Video + payments integrations |
| [`docs/CREATOR-SETUP.md`](docs/CREATOR-SETUP.md) | Creator (UGC) pipeline setup |
| [`docs/CONTENT.md`](docs/CONTENT.md) | Catalog / content system |
| [`docs/RUNBOOK.md`](docs/RUNBOOK.md) · [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) | Ops & deploy |
| [`AGENTS.md`](AGENTS.md) | House rules for anyone (human or AI) editing the code |

## React Native migration notes

This repo is intended as the foundation for a React Native app. The
server-side business logic (pricing, entitlements, revenue, creator splits) is
portable as-is; the web-specific `"use client"` components, `hls.js` playback,
`createPortal` overlays, and CSS layout tricks need native re-implementation.
Full readiness assessment: [`docs/DEV-REPORT-CURRENT.md`](docs/DEV-REPORT-CURRENT.md) §7.
