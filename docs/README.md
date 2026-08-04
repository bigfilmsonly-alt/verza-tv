# Verza TV documentation index

Last full Markdown reconciliation: **2026-08-03**.

The documentation has three explicit statuses:

- **Operational** — current instructions; expected to match source and current
  release state.
- **Reference** — current technical inventory, but code remains authoritative.
- **Archive/strategy** — dated evidence, proposal, or scenario. Never use it as
  a release instruction or source of current price/count/deployment truth.

Start with [`LAUNCH-TRUTH.md`](LAUNCH-TRUTH.md). It distinguishes working-tree
truth, verified production truth, and deferred products. A dated report saying
“live,” “pass,” or “ready” does not override that page or a current provider
readback.

## Start here

| Status | Document | Purpose |
| --- | --- | --- |
| Operational | [`LAUNCH-TRUTH.md`](LAUNCH-TRUTH.md) | Current catalog, payments, Mux, tax, legal-deploy, webhook, and submission truth |
| Operational | [`../AGENTS.md`](../AGENTS.md) | Mandatory engineering/release rules shared by humans, Claude, and Codex |
| Operational | [`guides/PAYMENTS.md`](guides/PAYMENTS.md) | Payment/access authority, safeguards, cutover, and incident boundaries |
| Operational | [`reports/PAYMENT-CUTOVER-EVIDENCE-2026-08-03.md`](reports/PAYMENT-CUTOVER-EVIDENCE-2026-08-03.md) | Exact non-secret current payment baseline, commands, and stop conditions |
| Operational | [`guides/MUX.md`](guides/MUX.md) | Public-capability projection, signed playback, coexistence, and retirement gate |
| Operational | [`guides/DEPLOYMENT.md`](guides/DEPLOYMENT.md) | Vercel deployment order and production readback |
| Operational | [`guides/REACT-NATIVE-SYNC.md`](guides/REACT-NATIVE-SYNC.md) | Web/backend ↔ native data, payment, reader-mode, and release boundary |
| Operational | [`guides/RUNBOOK.md`](guides/RUNBOOK.md) | Routine operations and incident response |

## Current platform snapshot

- **Production URL:** https://www.verzatv.com
- **Catalog:** 80 titles; 79 live; 74 paid-live; five wholly free; one coming soon
- **Series Unlock:** $1.99 one-time on web and eligible Android surfaces
- **iOS:** reader mode; no digital purchase UI, prices, links, or directions
- **VIP:** $9.99/month and $79.99/year configuration exists but both plans are
  hidden and API-blocked
- **Coins / creator PPV / official merch Checkout:** disabled/fail-closed
- **Mux:** 4,262 rows; 459 public capabilities; 3,803 withheld, including all
  3,753 paid-live rows and 50 coming-soon rows
- **Webhook:** one canonical enabled endpoint is exact 19/19 with wildcard off;
  unsigned delivery returns 400
- **Tax:** automatic tax off; zero active Stripe Tax registrations
- **Legal:** August 3 Terms/Privacy/Refund/Support are live and read back
- **Mux production:** signed mode true; unentitled 402/no capability and
  entitled signed 1,800-second URL/manifest canary passed
- **Creator Mux webhook:** hardened route deployed; production returns 503
  while its verification secret is intentionally absent, so ingestion is off
- **Open payment gates:** Stripe Public details is blank; required-consent
  mode/portal and the controlled $1.99 smoke remain open

## Operational guides

| Document | Scope |
| --- | --- |
| [`guides/AMAZON-SHOP.md`](guides/AMAZON-SHOP.md) | Web/Android Amazon affiliate rules; iOS 2.0 is fail-closed |
| [`guides/CONTENT.md`](guides/CONTENT.md) | Catalog, public/private Mux projections, and content update workflow |
| [`guides/CONTRIBUTING.md`](guides/CONTRIBUTING.md) | Local workflow, gates, documentation responsibility |
| [`guides/CONVENTIONS.md`](guides/CONVENTIONS.md) | Current implementation conventions |
| [`guides/CREATOR-SETUP.md`](guides/CREATOR-SETUP.md) | Deferred web creator-pipeline configuration; not an iOS launch instruction |
| [`guides/DEPLOYMENT.md`](guides/DEPLOYMENT.md) | Production deployment and readback |
| [`guides/ENV.md`](guides/ENV.md) | Environment contract and release flags |
| [`guides/MUX.md`](guides/MUX.md) | Playback capability and signed-ID operations |
| [`guides/PAYMENTS.md`](guides/PAYMENTS.md) | Stripe, ledger, entitlements, notices, tax, and cutover |
| [`guides/PORTING-VERZA-TV-TAB.md`](guides/PORTING-VERZA-TV-TAB.md) | Archived web-extraction guide for a separate project; not the Expo/native release architecture |
| [`guides/REACT-NATIVE-SYNC.md`](guides/REACT-NATIVE-SYNC.md) | Native synchronization contract |
| [`guides/RUNBOOK.md`](guides/RUNBOOK.md) | Operations and incident response |
| [`guides/seo-governance.md`](guides/seo-governance.md) | Indexing/content governance |
| [`guides/seo.md`](guides/seo.md) | SEO/content infrastructure |

## Technical references

References are maintained inventories, not substitutes for tests or current
source inspection.

| Document | Scope |
| --- | --- |
| [`reference/API-REFERENCE.md`](reference/API-REFERENCE.md) | Selected API routes and security contracts |
| [`reference/ARCHITECTURE.md`](reference/ARCHITECTURE.md) | System/data-flow architecture |
| [`reference/COMPONENTS.md`](reference/COMPONENTS.md) | Component inventory |
| [`reference/DATA-MODEL.md`](reference/DATA-MODEL.md) | Catalog and Supabase models, including disabled legacy tables |
| [`reference/ENVIRONMENT.md`](reference/ENVIRONMENT.md) | Concise environment reference; `guides/ENV.md` is the operational authority |
| [`reference/PROJECT-STRUCTURE.md`](reference/PROJECT-STRUCTURE.md) | Repository layout |
| [`reference/ROUTES.md`](reference/ROUTES.md) | Selected page/API route inventory |
| [`reference/TECH-STACK.md`](reference/TECH-STACK.md) | Dependencies, scripts, and services |

## Release evidence and proposals

| Status | Document | Interpretation |
| --- | --- | --- |
| Operational evidence | [`reports/PAYMENT-CUTOVER-EVIDENCE-2026-08-03.md`](reports/PAYMENT-CUTOVER-EVIDENCE-2026-08-03.md) | Current payment release record until superseded by a later dated readback |
| Review-only proposal | [`reports/PROPOSED-LEGACY-STRIPE-QUARANTINE.md`](reports/PROPOSED-LEGACY-STRIPE-QUARANTINE.md) | Not applied; never authorization to mutate historical payments |

## Archived reports

Every document below is retained for provenance. Its own archival banner and
stated date govern it. Old $4.99 offers, VIP/coin claims, catalog counts,
provider totals, “pass” statuses, and production assertions are historical.

| Document | Snapshot |
| --- | --- |
| [`reports/ALAN-FINAL-REPORT.md`](reports/ALAN-FINAL-REPORT.md) | 2026-06-22 project/investor report |
| [`reports/ALAN-FULL-PROJECT-REPORT.md`](reports/ALAN-FULL-PROJECT-REPORT.md) | 2026-06-22 extended report |
| [`reports/AUDIT.md`](reports/AUDIT.md) | 2026-06-17 codebase audit |
| [`reports/DEV-REPORT-2026-07-03-POLISH.md`](reports/DEV-REPORT-2026-07-03-POLISH.md) | 2026-07-03 polish snapshot |
| [`reports/DEV-REPORT-2026-07-03.md`](reports/DEV-REPORT-2026-07-03.md) | 2026-07-03 development snapshot |
| [`reports/DEV-REPORT-2026-07-13-AMAZON-SHOP.md`](reports/DEV-REPORT-2026-07-13-AMAZON-SHOP.md) | 2026-07-13 Amazon implementation report |
| [`reports/DEV-REPORT-CURRENT.md`](reports/DEV-REPORT-CURRENT.md) | Archived 2026-06-23 “current” report; filename is historical |
| [`reports/DEV-REPORT.md`](reports/DEV-REPORT.md) | 2026-06-29 development snapshot |
| [`reports/MOBILE-WEB-VERIFICATION.md`](reports/MOBILE-WEB-VERIFICATION.md) | 2026-07-11 production snapshot |
| [`reports/VERZA_CURRENT_STATE_AUDIT.md`](reports/VERZA_CURRENT_STATE_AUDIT.md) | 2026-07-11 audit; filename is historical |
| [`reports/VERZA_ENVIRONMENT_VARIABLES.md`](reports/VERZA_ENVIRONMENT_VARIABLES.md) | 2026-07-11 non-secret environment snapshot |
| [`reports/VERZA_LAUNCH_BLOCKERS.md`](reports/VERZA_LAUNCH_BLOCKERS.md) | 2026-07-11 blocker snapshot; many items subsequently changed |
| [`reports/cwv-app-store-checklist.md`](reports/cwv-app-store-checklist.md) | 2026-06-era web/App Store checklist |
| [`reports/gate-0-verification.md`](reports/gate-0-verification.md) | 2026-06-20 claimed money-path gate; superseded |

CSV inventories in `reports/` are likewise dated artifacts, not current source
truth.

## Archived strategy and valuation

These are scenarios, not approved pricing, compliance advice, current metrics,
or authorization to enable a product:

- [`strategy/FINAL-COMPLETE-REPORT-AND-MONETIZATION-STRATEGY.md`](strategy/FINAL-COMPLETE-REPORT-AND-MONETIZATION-STRATEGY.md)
- [`strategy/HIGH-CONVERSION-PLAYBOOK.md`](strategy/HIGH-CONVERSION-PLAYBOOK.md)
- [`strategy/SECTION-BY-SECTION-VALUATION.md`](strategy/SECTION-BY-SECTION-VALUATION.md)
- [`strategy/VERZA-TV-LAUNCH-PLAN-10M.md`](strategy/VERZA-TV-LAUNCH-PLAN-10M.md)

## Historical/project notes

| Status | Document | Interpretation |
| --- | --- | --- |
| History | [`CHANGELOG.md`](CHANGELOG.md) | Events as described when recorded; not current configuration |
| Review backlog | [`REFACTORS.md`](REFACTORS.md) | Proposals require fresh source audit before action |
| Archived porting note | [`guides/PORTING-VERZA-TV-TAB.md`](guides/PORTING-VERZA-TV-TAB.md) | Web extraction guide, not the Expo/native architecture |
| Operational helper | [`../scripts/README-reconcile.md`](../scripts/README-reconcile.md) | Current Mux audit/generation command map |
| Operational helper | [`../supabase/migrations/README.md`](../supabase/migrations/README.md) | Migration ordering and safety boundary |

`CLAUDE.md` and `CODEX.md` at repository root intentionally contain only
`@AGENTS.md`, ensuring both agents read the same current instruction source.
