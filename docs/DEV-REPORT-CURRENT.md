# Verza TV — Pre-Share Dev Report

_Master audit run before handing the repo to Splash Studios as the foundation
for a React Native migration. Every figure below is pulled from real
`git` / build / source output — nothing estimated._

Generated after commit `b65da21`.

---

## 1. Snapshot

| Metric | Value | Source |
| --- | --- | --- |
| Framework | Next.js 16.2.9 (App Router) + React 19.2.4 + TS 5 + Tailwind v4 | `package.json` |
| Commits | 307 | `git rev-list --count HEAD` |
| App/lib/components code | 38,269 lines TS/TSX | `wc -l` over `app`,`components`,`lib` |
| Components | 47 | `ls components/*.tsx` |
| API routes | 32 | `find app/api -name route.ts` |
| DB migrations | 7 SQL files (001–006) | `ls supabase/migrations/*.sql` |
| Live series | 76 | `lib/catalog.ts` |
| Build | ✅ green — 1085 pages prerendered | `npx next build` |
| Production | LIVE at https://www.verzatv.com | Vercel (codevibes/verza-tv) |

Build emits **1 warning** (benign): a `@ts-expect-error` on the optional
`@anthropic-ai/sdk` import, which is only installed when `ANTHROPIC_API_KEY`
is provisioned. Does not affect the build or runtime.

---

## 2. Audit results (10 parallel agents)

| Agent | Area | Verdict | Notes |
| --- | --- | --- | --- |
| A | Build / code health | ✅ PASS | Build green; only the optional-SDK ts-expect-error warning. |
| B | Routes | ✅ PASS | 32 API routes; `/series/[slug]` landing page **does** exist (corrected stale note that it 404s); catch-all `/watch/[...slug]` present. |
| C | Playback | ⚠️ FLAG | `Player.tsx` muted-first / `mutedRef` pattern intact. `HorizontalFeed.tsx:107` reads `videoMuted` state inside a `setTimeout` (possible stale-closure unmute). **Not touched** — live player, flagged for review. |
| D | Payments | ⚠️ FLAG | Server-side pricing verified; revenue only recorded from the Stripe webhook after signature verification. **P0:** `VipCard.tsx:109` "Manage subscription" points at a Stripe **TEST** portal URL. |
| E | Auth / data | ✅ FIXED | Migration drift: code uses `saved_list` + `pending_entitlements`, but `001` shipped legacy `my_list` and neither new table was in a migration. Reconciled in migration `006`. |
| F | Creator flow | ⚠️ FLAG | Code complete end-to-end. Blocked on manual ops: run migrations 004/005, provision Mux upload token + webhook. |
| G | Analytics | ✅ PASS (gated) | Event-stream + funnel code complete. Rows only persist once migration `004` (`analytics_events`) is run. |
| H | SEO | ✅ PASS (minor) | Sitemaps, JSON-LD, per-series metadata present. Minor: `shop/[slug]` has title+description but no OpenGraph/canonical/twitter tags. |
| I | Security | ✅ PASS | **Agent I's "`.env.local` tracked with live secrets" was a FALSE ALARM** — see §5. Rate limiting (5 tiers), CSP `*.mux.com`, server-side pricing, input validation, open-redirect guards all present. |
| J | UI polish | ✅ FIXED | P1 batch, hero-arrow hardening, action-rail auto-hide, dead-code removal all landed. |

---

## 3. What was fixed (with commit hashes)

| Commit | Change |
| --- | --- |
| `b65da21` | Migration `006` reconciles `saved_list` + `pending_entitlements` (idempotent, RLS, safe vs live DB); removed orphaned `CreatorApplicationForm.tsx` (314 lines, zero imports, superseded by `CreatorDashboard`); removed unused `HeroVideo`/`RedCarpetHero`/`PosterSkeleton` imports in `BrowsePage`. |
| `84e318b` | Vertical action rail (like/share/comment/more) auto-fades after 8s. |
| `2771b98` | Hero arrows use safe modulo wrap both directions + index clamp on tab change (back button never lands on a video). |
| `0fef49c` | P1 polish: checkout error messaging (CoinPaywall + SummerSaleBadge), hero pause-on-hover, always-visible mobile "Shop on TikTok" CTA, larger VIP spinner. |
| `f2db35a` | Documentation index + reference catalogs. |

---

## 4. Known open items

**P0 — needs a value from the owner**
- `VipCard.tsx:109` — replace the Stripe **TEST** customer-portal URL
  (`https://billing.stripe.com/p/login/test_…`) with the real production
  portal link (or a per-user fetched session). On live prod, VIP members
  currently reach a sandbox portal and cannot manage real subscriptions.

**Manual ops (run/provision before the dependent features work)**
- Run `supabase/migrations/004_analytics_events.sql` (until then `/api/events`
  inserts silently no-op).
- Run `supabase/migrations/005_creator_pipeline.sql` (until then all creator
  routes 500 / return empty).
- Run `supabase/migrations/006_saved_list_pending_entitlements.sql` — verify it
  matches the live tables (idempotent, safe to run).
- Provision `MUX_TOKEN_ID` + `MUX_TOKEN_SECRET` + `MUX_WEBHOOK_SECRET` and
  configure the Mux webhook → `POST /api/mux/webhook` (creator upload returns
  503 without these).
- Confirm the 5–6 merch prices.
- Supply real TikTok Shop product images / prices / affiliate links (currently
  gradient placeholders in `lib/sponsors.ts`).

**Flagged for review (not auto-fixed — risky to touch)**
- `HorizontalFeed.tsx:107` stale-closure unmute (§2, Agent C).
- `shop/[slug]` OpenGraph/canonical/twitter metadata (minor SEO).

---

## 5. Secret sweep — CLEAN ✅

Agent I initially reported `.env.local` was tracked with live Stripe/Supabase/
Mux/Resend keys and said "DO NOT PUSH." **This was a false alarm.** Verified:

- `git ls-files | grep -i env` → only `.env.local.example`, `docs/ENV.md`,
  `docs/reference/ENVIRONMENT.md`, `lib/env.ts`. **`.env.local` is NOT tracked.**
- `git log --all -- .env.local` → empty. **Never committed, not in history.**
- `.gitignore:34` → `.env*`. The local file exists but is properly ignored.
- Pattern scan of all tracked files (`sk_live_`, `whsec_…`, service-role JWTs)
  → **no matches.**

The repo is safe to share regarding secrets.

---

## 6. Human test checklist (before / after handoff)

- [ ] Home: hero slideshow arrows both directions never show a video; back
      button always works; pause-on-hover holds the poster.
- [ ] Land on a vertical episode: like/share/comment/more rail shows, then
      fades after ~8s; tapping any rail action re-reveals it.
- [ ] Unlock a movie ($1.99) end-to-end with a **real card**; confirm Stripe
      webhook records the purchase and the series appears in My List.
- [ ] VIP subscribe ($9.99/mo, $79.99/yr); **then confirm "Manage subscription"
      opens the correct portal** (currently the P0 test URL).
- [ ] Guest purchase → sign up with the same email → entitlement claimed from
      `pending_entitlements`.
- [ ] Creator apply → admin approve → upload → publish → public `/watch` plays.
- [ ] Search from the header: genre/keyword returns tagged shows + TikTok
      products; page stays visible behind the bar.
- [ ] Playback on iOS Safari: muted-first autoplay, unmute after tap, no audio
      leak between screens.

---

## 7. Migration readiness (React Native)

- **Business logic is server-side and portable:** pricing, entitlements,
  revenue recording, and creator splits all live in API routes / Stripe
  webhook — a React Native client can reuse them unchanged.
- **Reusable as-is:** `lib/catalog.ts`, `lib/products.ts`, `lib/theme.ts`
  (design tokens), `lib/schemas.ts`, `lib/search-index.ts`, `lib/sponsors.ts`,
  all `app/api/*` routes, all 6 migrations.
- **Web-specific (needs re-implementation on RN):** every `"use client"`
  component in `components/` (DOM/CSS), HLS via `hls.js` → use a native Mux
  player, `createPortal` search overlay, service worker / web-push (→ native
  push), CSS `position:fixed`/`backdrop-filter` layout tricks.
- **Prerequisite before RN work:** clear the P0 Stripe portal URL and run the
  outstanding migrations so the shared backend is fully live.

---

_Ready-to-share verdict:_ **build green, secret sweep clean, no
production-breaking changes in this audit.** Safe to push, with the P0 Stripe
portal URL and the manual ops in §4 tracked as follow-ups.
