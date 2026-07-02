# Verza TV — Documentation Index

> Vertical micro-drama streaming platform. **Live at [www.verzatv.com](https://www.verzatv.com).**
> Next.js 16 · TypeScript · Tailwind v4 · React 19 · Supabase · Mux · Stripe · Vercel.

This is the master index for all project documentation. Docs are grouped by
purpose. Files marked **(reference)** are auto-organized technical catalogs kept
in `docs/reference/`; the rest are hand-authored reports and playbooks.

---

## 1. Start here

| Doc | What it covers |
| --- | --- |
| [`../README.md`](../README.md) | Repo readme — quick start |
| [`../AGENTS.md`](../AGENTS.md) | House rules for anyone (human or AI) editing the code |
| [reference/PROJECT-STRUCTURE.md](reference/PROJECT-STRUCTURE.md) | **(reference)** Full directory map |
| [reference/TECH-STACK.md](reference/TECH-STACK.md) | **(reference)** Dependencies, versions, why each exists |

## 2. Architecture & engineering

| Doc | What it covers |
| --- | --- |
| [ARCHITECTURE.md](ARCHITECTURE.md) | System design, rendering model, layout shell |
| [reference/API-REFERENCE.md](reference/API-REFERENCE.md) | **(reference)** Every `app/api/*` route endpoint |
| [reference/COMPONENTS.md](reference/COMPONENTS.md) | **(reference)** Every React component |
| [DATA-MODEL.md](DATA-MODEL.md) | Supabase tables, RLS, entitlements |
| [ROUTES.md](ROUTES.md) | Page routing map |
| [CONVENTIONS.md](CONVENTIONS.md) | Coding conventions |
| [CONTRIBUTING.md](CONTRIBUTING.md) | How to contribute |
| [REFACTORS.md](REFACTORS.md) | Refactor history / tech debt |

## 3. Integrations

| Doc | What it covers |
| --- | --- |
| [reference/ENVIRONMENT.md](reference/ENVIRONMENT.md) | **(reference)** All env vars (from `lib/env.ts`) |
| [ENV.md](ENV.md) | Env var notes |
| [MUX.md](MUX.md) | Mux video playback + upload |
| [PAYMENTS.md](PAYMENTS.md) | Stripe checkout, webhooks, revenue truth |
| [CREATOR-SETUP.md](CREATOR-SETUP.md) | Creator (UGC) pipeline setup |

## 4. Operations

| Doc | What it covers |
| --- | --- |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Deploy to Vercel production |
| [RUNBOOK.md](RUNBOOK.md) | Incident / operational runbook |
| [DEV-REPORT.md](DEV-REPORT.md) | Latest dev status report |
| [AUDIT.md](AUDIT.md) | Security / quality audit |
| [CHANGELOG.md](CHANGELOG.md) | Release history |
| [gate-0-verification.md](gate-0-verification.md) | Launch gate checklist |

## 5. Content & SEO

| Doc | What it covers |
| --- | --- |
| [CONTENT.md](CONTENT.md) | Catalog structure, series data |
| [seo.md](seo.md) | SEO implementation |
| [seo-governance.md](seo-governance.md) | SEO governance rules |
| [cwv-app-store-checklist.md](cwv-app-store-checklist.md) | Core Web Vitals / app-store checklist |

## 6. Business & strategy

| Doc | What it covers |
| --- | --- |
| [ALAN-FINAL-REPORT.md](ALAN-FINAL-REPORT.md) | Complete project report |
| [ALAN-FULL-PROJECT-REPORT.md](ALAN-FULL-PROJECT-REPORT.md) | Extended project report |
| [SECTION-BY-SECTION-VALUATION.md](SECTION-BY-SECTION-VALUATION.md) | Build-cost valuation |
| [HIGH-CONVERSION-PLAYBOOK.md](HIGH-CONVERSION-PLAYBOOK.md) | Monetization strategy |
| [FINAL-COMPLETE-REPORT-AND-MONETIZATION-STRATEGY.md](FINAL-COMPLETE-REPORT-AND-MONETIZATION-STRATEGY.md) | Everything combined |
| [VERZA-TV-LAUNCH-PLAN-10M.md](VERZA-TV-LAUNCH-PLAN-10M.md) | $10M marketing plan |

---

## Project at a glance

- **Production URL:** https://www.verzatv.com (LIVE)
- **Deployment:** Vercel (`codevibes/verza-tv`) — `npx vercel deploy --prod`
- **Repo:** GitHub `bigfilmsonly-alt/verza-tv` (`main`)
- **Domain path:** GoDaddy → Cloudflare (DNS) → Vercel (hosting)
- **Catalog:** 76 live series, thousands of Mux HLS streams
- **Monetization:** $1.99 series unlock · VIP $9.99/mo or $79.99/yr · merch · 80/20 creator rev-share

See [reference/TECH-STACK.md](reference/TECH-STACK.md) and
[ARCHITECTURE.md](ARCHITECTURE.md) for the full picture.
