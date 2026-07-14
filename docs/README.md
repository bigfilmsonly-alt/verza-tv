# Verza TV — Documentation Index

> Vertical micro-drama streaming platform. **Live at [www.verzatv.com](https://www.verzatv.com).**
> Next.js 16 · TypeScript · Tailwind v4 · React 19 · Supabase · Mux · Stripe · Vercel.

This is the master index for all project documentation. Docs are grouped into
folders by purpose:

- **[reference/](reference/)** — technical catalogs: architecture, API, components, data model, routes, env, tech stack, project structure.
- **[guides/](guides/)** — how-to / setup / integration / operations guides.
- **[reports/](reports/)** — dev reports, audits, and launch-readiness verifications.
- **[strategy/](strategy/)** — business, valuation, and monetization playbooks.

Two docs stay at the `docs/` root: this index and the ones below.

---

## Start here

| Doc | What it covers |
| --- | --- |
| [reports/DEV-REPORT-CURRENT.md](reports/DEV-REPORT-CURRENT.md) | **Latest pre-share master audit** — snapshot, audit table, fixes, open items, secret sweep, test checklist, RN-migration readiness |
| [`../README.md`](../README.md) | Repo readme — quick start |
| [`../AGENTS.md`](../AGENTS.md) | House rules for anyone (human or AI) editing the code |
| [reference/PROJECT-STRUCTURE.md](reference/PROJECT-STRUCTURE.md) | Full directory map |
| [reference/TECH-STACK.md](reference/TECH-STACK.md) | Dependencies, versions, why each exists |

## Reference — architecture & engineering

| Doc | What it covers |
| --- | --- |
| [reference/ARCHITECTURE.md](reference/ARCHITECTURE.md) | System design, rendering model, layout shell |
| [reference/API-REFERENCE.md](reference/API-REFERENCE.md) | Every `app/api/*` route endpoint |
| [reference/COMPONENTS.md](reference/COMPONENTS.md) | Every React component |
| [reference/DATA-MODEL.md](reference/DATA-MODEL.md) | Supabase tables, RLS, entitlements, content types |
| [reference/ROUTES.md](reference/ROUTES.md) | Page routing map |
| [reference/PROJECT-STRUCTURE.md](reference/PROJECT-STRUCTURE.md) | Directory map of the codebase |
| [reference/TECH-STACK.md](reference/TECH-STACK.md) | Runtime + dev dependencies |
| [reference/ENVIRONMENT.md](reference/ENVIRONMENT.md) | All env vars (from `lib/env.ts`) |

## Guides — setup, integrations & operations

| Doc | What it covers |
| --- | --- |
| [guides/CONTRIBUTING.md](guides/CONTRIBUTING.md) | How to contribute / local dev setup |
| [guides/CONVENTIONS.md](guides/CONVENTIONS.md) | Coding conventions |
| [guides/ENV.md](guides/ENV.md) | Env var notes (copy `.env.example`) |
| [guides/MUX.md](guides/MUX.md) | Mux video playback + upload pipeline |
| [guides/PAYMENTS.md](guides/PAYMENTS.md) | Stripe checkout, webhooks, revenue truth |
| [guides/AMAZON-SHOP.md](guides/AMAZON-SHOP.md) | Amazon affiliate shop — adding products, refreshing images, and the four constraints that will bite you |
| [guides/CREATOR-SETUP.md](guides/CREATOR-SETUP.md) | Creator (UGC) pipeline setup & go-live |
| [guides/CONTENT.md](guides/CONTENT.md) | Catalog structure, series data flow |
| [guides/seo.md](guides/seo.md) | SEO & content infrastructure |
| [guides/seo-governance.md](guides/seo-governance.md) | SEO governance rules |
| [guides/DEPLOYMENT.md](guides/DEPLOYMENT.md) | Deploy to Vercel production |
| [guides/RUNBOOK.md](guides/RUNBOOK.md) | Incident / operational runbook + pre-launch checklist |

## Reports — status, audits & verification

| Doc | What it covers |
| --- | --- |
| [reports/DEV-REPORT-2026-07-13-AMAZON-SHOP.md](reports/DEV-REPORT-2026-07-13-AMAZON-SHOP.md) | **Amazon affiliate shop** — what shipped, decisions, 7 bugs found and fixed, live verification |
| [reports/DEV-REPORT-CURRENT.md](reports/DEV-REPORT-CURRENT.md) | Latest pre-share master audit (RN-migration foundation) |
| [reports/DEV-REPORT.md](reports/DEV-REPORT.md) | Developer status report |
| [reports/VERZA_CURRENT_STATE_AUDIT.md](reports/VERZA_CURRENT_STATE_AUDIT.md) | Current-state audit (2026-07-11) |
| [reports/VERZA_LAUNCH_BLOCKERS.md](reports/VERZA_LAUNCH_BLOCKERS.md) | Launch blockers |
| [reports/VERZA_ENVIRONMENT_VARIABLES.md](reports/VERZA_ENVIRONMENT_VARIABLES.md) | Env var audit (names and purposes only — no secrets) |
| [reports/VERZA_FEATURE_MATRIX.csv](reports/VERZA_FEATURE_MATRIX.csv) | Feature matrix (CSV) |
| [reports/VERZA_ROUTE_INVENTORY.csv](reports/VERZA_ROUTE_INVENTORY.csv) | Route inventory (CSV) |
| [reports/VERZA_CONTENT_CATALOG_AUDIT.csv](reports/VERZA_CONTENT_CATALOG_AUDIT.csv) | Content catalog audit (CSV) |
| [reports/AUDIT.md](reports/AUDIT.md) | Codebase audit — orphans, duplicates, structural notes |
| [reports/MOBILE-WEB-VERIFICATION.md](reports/MOBILE-WEB-VERIFICATION.md) | Live production mobile-web verification |
| [reports/gate-0-verification.md](reports/gate-0-verification.md) | Money-path launch gate checklist |
| [reports/cwv-app-store-checklist.md](reports/cwv-app-store-checklist.md) | Core Web Vitals / app-store readiness |
| [reports/ALAN-FINAL-REPORT.md](reports/ALAN-FINAL-REPORT.md) | Final project report for Alan |
| [reports/ALAN-FULL-PROJECT-REPORT.md](reports/ALAN-FULL-PROJECT-REPORT.md) | Extended full project report for Alan |

## Strategy — business & monetization

| Doc | What it covers |
| --- | --- |
| [strategy/HIGH-CONVERSION-PLAYBOOK.md](strategy/HIGH-CONVERSION-PLAYBOOK.md) | Monetization / conversion strategy |
| [strategy/SECTION-BY-SECTION-VALUATION.md](strategy/SECTION-BY-SECTION-VALUATION.md) | Build-cost valuation |
| [strategy/FINAL-COMPLETE-REPORT-AND-MONETIZATION-STRATEGY.md](strategy/FINAL-COMPLETE-REPORT-AND-MONETIZATION-STRATEGY.md) | Dev report + valuation + pitch + monetization, combined |
| [strategy/VERZA-TV-LAUNCH-PLAN-10M.md](strategy/VERZA-TV-LAUNCH-PLAN-10M.md) | $10M+ launch & marketing plan |

## Project history

| Doc | What it covers |
| --- | --- |
| [CHANGELOG.md](CHANGELOG.md) | Release history |
| [REFACTORS.md](REFACTORS.md) | Recommended refactors / tech debt (deferred for review) |

## Related READMEs (co-located with code)

| Doc | What it covers |
| --- | --- |
| [`../scripts/README-reconcile.md`](../scripts/README-reconcile.md) | Mux mapping reconciliation script usage |
| [`../supabase/migrations/README.md`](../supabase/migrations/README.md) | Content-tables migration notes |

---

## Project at a glance

- **Production URL:** https://www.verzatv.com (LIVE)
- **Deployment:** Vercel (`codevibes/verza-tv`) — `npx vercel deploy --prod`
- **Repo:** GitHub `bigfilmsonly-alt/verza-tv` (`main`)
- **Domain path:** GoDaddy → Cloudflare (DNS) → Vercel (hosting)
- **Catalog:** 76 live series, thousands of Mux HLS streams
- **Monetization:** $1.99 series unlock · VIP $9.99/mo or $79.99/yr · merch · 80/20 creator rev-share

See [reference/TECH-STACK.md](reference/TECH-STACK.md) and
[reference/ARCHITECTURE.md](reference/ARCHITECTURE.md) for the full picture.
