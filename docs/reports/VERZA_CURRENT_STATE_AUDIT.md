# Verza TV Current-State Audit

> **ARCHIVE — 2026-07-11 snapshot; the filename is not current authority.**
> Many blockers, counts, prices, and architecture facts changed during the
> 2026-08-03 hardening. Use [`../LAUNCH-TRUTH.md`](../LAUNCH-TRUTH.md).
> The separate native app and August 5 74-product StoreKit backend supersede
> every no-native/reader-mode/no-IAP conclusion in this July snapshot.

**Date:** 2026-07-11 · **Repo:** `Splash-Studio/verza-tv` @ `195c806` · **Live:** https://www.verzatv.com
**Method:** Deterministic verification (build, typecheck, lint, route sweep, live DB reads, production HTTP probes, Stripe/Mux API reads) + a 10-agent verification fleet, all read-only. Nothing was modified, no test charges were made.

**Companion files:** `VERZA_FEATURE_MATRIX.csv` · `VERZA_ROUTE_INVENTORY.csv` · `VERZA_CONTENT_CATALOG_AUDIT.csv` · `VERZA_ENVIRONMENT_VARIABLES.md` · `VERZA_LAUNCH_BLOCKERS.md`

---

## 1. Executive Summary

**What Verza TV is today:** a genuinely substantial, well-built vertical micro-drama streaming platform — the web product is polished and largely production-grade. **79 live series / 4,262 playable episodes**, a sophisticated TikTok-style player, a repaired Stripe payment pipeline, a full (unused) creator pipeline, SEO-complete SSG (2,257 pages), a PWA, and App-Store-oriented legal compliance. The build passes, TypeScript is clean, and the site is live and fast.

**Overall completion estimate:** ~**75% of a launchable consumer product**. The core watch-and-buy loop is coded correctly but **has never been proven with a single real transaction through the current pipeline** (0 purchase/entitlement rows in the live DB despite $71.85 lifetime revenue predating the fixes). The remaining 25% is verification, three revenue-integrity fixes, analytics wiring, and — critically — an iOS app that **does not exist in this repo yet**.

**Launch readiness:**
- **Web (free content):** Ready now.
- **Web (paid content):** ~1–2 days of fixes + one test purchase away.
- **App Store:** Blocked — no native/wrapper app has been built.

### Top 5 risks
1. **Paywall is bypassable.** Locked episodes' unsigned Mux URLs are in public HTML; a locked `.m3u8` returns HTTP 200 with no auth (verified). The entire paid catalog is free via view-source. *(P1)*
2. **No native app exists.** The App Store goal has no artifact to submit. *(P0 for that goal)*
3. **Purchase pipeline unproven in production.** Correct in code, but 0 rows have ever been written by the repaired flow. *(P1)*
4. **VIP subscriptions can't be managed.** Webhook lacks subscription/refund events; billing portal 404s for everyone. Cancelled VIPs would keep access forever. *(P1)*
5. **You are flying blind.** Analytics has captured only 121 `paywall_viewed` rows — no play, search, checkout, or purchase events. No conversion funnel exists. *(P1)*

### Top 5 immediate wins (hours, not days)
1. **Apply migration 009** (30 sec) — stops account deletion from destroying financial records.
2. **Add subscription + refund events** to the Stripe webhook in the dashboard (no code) — activates the entire VIP lifecycle.
3. **Delete `public/posters-backup-20260617/`** (148MB, publicly served) — instant deploy-size + hygiene win.
4. **Fix admin dashboard column names** — turns the all-zeros dashboard back on.
5. **Hide the merch shop OR add shipping collection** — closes the "charged with no address" hole.

### Biggest unknowns
- The exact **iOS app wrapper plan** and who owns the Apple Developer account (not in repo).
- Whether the **deployed Stripe webhook secret** matches (only a real test purchase proves it).
- Whether **Supabase Google/Apple OAuth providers** are actually configured (buttons ship unconditionally).
- Whether the **Amazon `verzatv-20`** affiliate tag is approved/active.
- **Content licensing terms** (owned vs. licensed) — affects both legal exposure and asset value.

---

## 2. System Architecture

| Layer | Choice | Status |
|---|---|---|
| Framework | Next.js 16.2.9 (App Router) · React 19.2.4 · TypeScript 5 · Tailwind v4 | Production Ready |
| Package manager | npm (package-lock present) | — |
| Hosting | Vercel — team `codevibes`, project `verza-tv`. **No `vercel.json`**; headers/CSP/redirects live in `next.config.ts`. **Manual deploy** (`npx vercel deploy --prod`) — no CI/CD, no git auto-deploy. | Production Ready |
| Database | Supabase Postgres — historical/current project identifiers intentionally omitted; approved environment is authoritative | Production Ready |
| Auth | Supabase Auth via `@supabase/ssr` cookies (`lib/auth.ts`); Google/Apple OAuth buttons | Working but Untested |
| Video | Mux HLS via hls.js 1.6.16; `@mux/mux-node` for creator direct-upload. **Public playback policy** (no signing) | Production Ready (playback) |
| Payments | Stripe 22.2.2, **LIVE keys** (`sk_live_…`) | Working but Untested |
| Analytics | GTM + GA4 + AdSense identifiers existed in `ThirdPartyScripts.tsx` (identifiers intentionally omitted); custom bus → `analytics_events`; Vercel Analytics | Partial (capture broken) |
| Email | Resend 6.14.0 (`lib/email.ts`), sender `noreply@verzatv.com` | Working but Untested |
| Storage | None external — static `public/` assets + direct-to-Mux for creator video | Production Ready |
| Search | Client-side static tag index (`lib/search-index.ts`) — no DB/external search | Production Ready |
| Admin | `/admin/dashboard` + `/admin/review`; APIs gated by Bearer + hardcoded 3-email allowlist (`lib/admin.ts`) | Working but Untested |
| AI | `/api/ai-host` (5 modes) + AskVerza + CreatorAITools — **non-functional** (no SDK, no key) | UI Only / Broken |
| i18n | 20-locale `lib/i18n.ts` + Google-Translate-backed `ContentTranslator` | Working but Untested |
| Rate limiting | In-memory per-isolate sliding window (`middleware.ts`) — ineffective at scale | Partial |

**Major directories:** `app/` (routes + API), `components/` (55 client components), `lib/` (89 modules: catalog, mux-map, analytics, search, email, auth, platform), `supabase/migrations/` (001–009), `public/` (posters, shop images, sw.js, manifest).

**Dead / duplicate / legacy (P3 cleanup, ~4,300 lines):** `Player.tsx`, `HeroVideo.tsx`, `PosterSkeleton.tsx`, `AskVerza.tsx`, `InstallPrompt.tsx`, `CoinPaywall.tsx`, `FeedSearch.tsx`, `HeroCarousel.tsx`, `RedCarpetHero.tsx` (all unimported). Defunct **coin system** (`COIN_PACKS`, `coin_ledger` table, `/api/coins/*` → 501). Duplicate **`my_list` vs `saved_list`** tables. Unused **content-CMS** tables (migration 002). **Hardcoded values:** GTM/AdSense IDs, all prices, GA4 id. **Mock data:** `pseudoViews`/`pseudoCount` fake view & like counts shown to users.

---

## 3. Feature Inventory

Full 39-row matrix in `VERZA_FEATURE_MATRIX.csv`. Highlights:

| Feature | Status | Evidence | Risk | Next Action |
|---|---|---|---|---|
| Episode player | Working but Untested | `EpisodeFeed.tsx` (recovery, watchdog, iOS guards) | Runtime-untested on iOS | Device QA |
| $1.99 unlock | Working but Untested | `/api/unlock` → webhook `:141` writes entitlement | 0 rows ever | Real test purchase |
| **Paywall enforcement** | **Broken** | Locked m3u8 = HTTP 200 no auth (verified) | Whole catalog free | Mux signed URLs or accept freemium |
| **VIP activation** | **Broken** | Webhook missing sub events; portal 404s | Cancelled VIPs keep access | Add Stripe events |
| Account deletion | Working but Untested | `/api/account/delete` | Creator ledger cascade | Apply migration 009 |
| Search / discovery | Production Ready | `lib/search-index.ts` | No fuzzy match | Optional |
| **Merch shop** | **Partial** | Real Stripe, no shipping address | Unfulfillable orders | Add shipping or hide |
| Creator pipeline | Working but Untested | Real Mux ingest, 0 rows | Never exercised | Test creator |
| **Creator AI tools** | **UI Only** | SDK absent, 501 stub, canned answers | Presents fake as real | Remove or provision |
| **Analytics capture** | **Broken** | Only 121 paywall_viewed rows | No funnel | Wire events |
| **Admin dashboard** | **Broken** | Queries nonexistent columns | All zeros | Fix columns |
| Legal pages | Production Ready | Rewritten, verified live | Needs lawyer | Legal review |
| iOS reader mode | Working but Untested | `lib/platform.ts` | $1.99 badges leak | Fix leaks |
| PWA | Production Ready | manifest+sw.js live 200 | — | — |
| **Native app** | **Not Started** | No native code in repo | Blocks App Store | Build wrapper |

Status totals across areas: **Production Ready ~65 · Working-but-Untested ~40 · Partial ~15 · UI Only ~4 · Broken ~6 · Blocked ~2 · Not Started ~8 · Unverified ~30.**

---

## 4. Route Inventory

**59 page routes + 36 API routes** (full detail in `VERZA_ROUTE_INVENTORY.csv`).

- **NO anime section** and **NO feature-films section** exist anywhere (spec asked; confirmed absent — the only "film" reference is a creator-content category enum).
- Core routes production-ready: `/`, `/series/[slug]`, `/series/[slug]/[episode]` (player+paywall), `/shorts`, `/shop`, `/library`, `/me`, `/search`, all legal pages, `/api/stripe/webhook`, `/api/unlock(+/confirm)`, `/api/subscribe`, `/api/access`.
- **Defects:** `/me/list` is **UI-only** (hardcoded empty, orphaned — the real saved list is `/library`); `/learn/*` fully orphaned (no links, not in sitemap); `/studio` AI tools return canned text; `/horizontal` is a duplicate Storage Pirates implementation; `/dev/perf` blocked by design; 4 API routes are 501 stubs (coins).
- **Category tabs:** Drama, New, Hot, Music, Reality, Red Carpet — all live. **Red Carpet** now = `exes-premiere` (12 eps) + `love-awards` (13 eps) with real Mux IDs (older notes said placeholder — outdated).

---

## 5. Content and Mux Audit

Full per-series table in `VERZA_CONTENT_CATALOG_AUDIT.csv` (80 rows).

- **Metadata:** `lib/catalog.ts` (series) — hardcoded TypeScript. **Episode order:** `lib/mux-map.ts` (4,457 lines of `{episode, playbackId, duration}`), keyed by explicit numeric `episode` (numeric, not string sort → ordering is correct). **Posters:** `posterUrl` → `public/posters/*` (all verified present). **Categories:** `categories[]` array per series.
- **Mapping integrity (verified):** 0 duplicate playback IDs across the entire map; 0 gaps within any live series; all posters resolve; no series mixes assets from another show.
- **Catalog count vs mapped count:** ~68 series show a mismatch (e.g. catalog says 48, map has 61) — this is **not a bug**: `catalog.ts` auto-normalizes `episodeCount` from `MUX_MAP.length` at runtime. The displayed count is always the real mapped count. (Cosmetic: the hardcoded numbers in source are stale and misleading to a reader.)
- **Orientation:** all vertical 9:16 **except `storage-pirates`** (horizontal 16:9, handled by a dedicated mode in EpisodeFeed). Red carpet & reality use the **same structure as drama** (vertical feed). **No dedicated anime structure** (no anime exists).
- **"Too Much Junk"** (music-tab exclusive) and **"Storage Pirates"** (reality, landscape) are correctly grouped and filtered out of the Drama grid.
- **Free vs paid:** differentiated by `coinPerEpisode` (0 = fully free) and `freeEpisodes` (first 5 free, then $1.99). Two series are intentionally all-free.
- **1 coming-soon:** `im-obsessed-with-my-boss-2` (50 validated episodes uploaded, awaiting go-live decision).

---

## 6. Playback Audit

The real player is **`components/EpisodeFeed.tsx`** (`Player.tsx` is dead code — verified unimported). Code-sound, runtime-untested on device.

- **Working in code:** muted-first autoplay + iOS unmute-pause guard; mute persistence (localStorage); fullscreen; widescreen mode; progress tracking (`/api/watch-progress`); auto-advance; swipe prev/next; back button (`location.replace` + per-category `backHref`); deep links (`/series/slug/N` + `?t=` resume); native share + fallback sheet; watermark; instant-player poster→video adoption; bounded HLS recovery (2× recover → codec-swap → full re-attach) + 10s stall watchdog; virtual windowing (renders active ±2).
- **P1 — Client-side-only paywall** (see §7). Locked streams also **attach and buffer** behind the overlay.
- **P2:** no user-facing error UI after recovery exhausts (silent black); guest progress/save calls **401 silently**; `ShortsFeed` shows **fabricated like counts and fake episode numbers**; `/horizontal` is an orphaned duplicate.
- **Analytics events fired from player:** `paywall_viewed`, `checkout_started`, unlock click/prompt — but play/complete events don't persist (see §10).

---

## 7. Payment and Paywall Audit

**The purchase→entitlement path (traced):** paywall renders at `EpisodeFeed.tsx` (episode 6) → `/api/unlock` creates a Stripe session **with `client_reference_id` + `metadata.userId`** → **the entitlement becomes real at `app/api/stripe/webhook/route.ts:141-147`** (`entitlements` upsert on `checkout.session.completed`) → `/api/unlock/confirm` is a server-side session-verification safety net that also upserts. Signature verification via `constructEvent` is present and confirmed. Keys are **LIVE** (`sk_live`).

**Reality check (verified):** Stripe = **$71.85 lifetime** (19 charges, **0 subscriptions ever**). Live DB = **0** `purchases`, **0** `entitlements`, **0** `pending_entitlements`. **No purchase has traversed the repaired pipeline.** *(P1 — prove with one test purchase.)*

- **P1 — Paywall bypass:** unsigned Mux URLs in public SSG HTML; locked `.m3u8` fetchable HTTP 200 (verified). Fix = Mux signed playback, or reposition as freemium.
- **P1 — VIP lifecycle dead:** webhook subscribed to only 3 event types; `customer.subscription.*` / `invoice.*` / refund handlers never fire. `/api/billing-portal` 404s (no profile has `stripe_customer_id`). Cancelled VIPs would keep access. **Dashboard-only fix — code already exists.**
- **Pricing:** $1.99 (with ~~$4.99~~ anchor). No stale $2/coin pricing in the active paywall (coin remnants are dead).
- **Apple IAP:** reader mode (`lib/platform.ts`) hides purchase UI in-app — but **P2:** $1.99 badges still leak in `SeriesInfoDrawer`/`EpisodeDropdown` (not wrapped in `HideInIOSApp`).
- **Coin remnants:** `COIN_PACKS`, `/api/coins/purchase` (501), `coin_ledger`, dead `CoinPaywall` — should be removed.

---

## 8. Creator Portal Audit

**Fully implemented end-to-end** (real Mux direct-upload, not metadata-only), migrations 005/007 **applied live**, but **0 creators / 0 content / 0 sales** — never exercised.

| Capability | Status |
|---|---|
| Apply / onboarding | Working but Untested |
| Profile (post-approval edit) | Partial (no edit UI) |
| Public creator channel | **Not Started** (no discovery surface; titles reachable only by direct `/watch/handle/slug` URL) |
| Video upload (Mux ingest) | Working but Untested (real) |
| Content review/approval | Working but Untested |
| 80/20 revenue split | Working but Untested |
| Creator analytics | Working but Untested |
| Payout tracking | **Not Started** (fully manual, off-platform) |
| Dashboard | Working but Untested |
| Admin moderation | Working but Untested |
| Emails | Partial (**creator NOT emailed on approval** — team-only) |
| Terms acceptance / rights declaration | **Not Started** (no ToS checkbox, no "I own this" attestation) |
| Creator AI tools | **Broken** (SDK absent, no key, returns canned text as "Powered by Claude AI") |

**P1s:** creator-unlock omits buyer `userId` (pay-and-lose-access risk); creators never notified of approval; Mux webhook unsigned (forgeable `asset.ready`).

---

## 9. Commerce Audit

| Element | Status |
|---|---|
| Merch checkout (Stripe) | **Partial** — real live charges, **no shipping address** (P0), 6/10 prices unconfirmed TODOs (P1) |
| Cart mechanics | Production Ready (in-memory; empties on reload) |
| TikTok Shop tiles | **UI Only** — 16 fabricated products → generic `tiktok.com/shop`, zero attribution |
| Amazon tiles | **Partial** — real `verzatv-20` tag but placeholder prices + search-page links |
| StorageBlue | Production Ready (no "Ad" label — P2) |
| Shop-the-episode | **Not Started** (doesn't exist) |
| Commerce analytics | **Broken** — `trackAddToCart`/`trackCheckout` are dead code |
| FTC disclosures | Partial (Amazon modal OK; no site-wide affiliate page) |

---

## 10. Analytics Audit

**Provider:** GTM/GA4 (web only — skipped in iOS reader mode) + Supabase `analytics_events` + Vercel Analytics.

- **Architecture is correct:** revenue events fire **server-side** from the Stripe webhook (`emitServerEvent`, Stripe-verified — can't be spoofed by the client); client events use an allowlist.
- **But capture is broken (verified live):** `analytics_events` contains **only 121 `paywall_viewed` rows**. No play, episode start/complete, search, share, like, checkout, or purchase rows have **ever** been persisted. **`window.gtag` is never defined** (only the GTM loader runs) → all GA4 custom events in `lib/track.ts` / `lib/analytics/emit.ts` are silent no-ops unless the GTM container injects a shim.
- **Two overlapping taxonomies** (`lib/track.ts` vs `lib/analytics`) double-fire on unlock interactions.
- **Missing entirely:** share, like, product-click, creator-signup/upload, install-attribution events.
- **Net:** no conversion funnel is currently computable. *(P1)*

---

## 11. Mobile and App Store Audit

- **Native app: NOT STARTED / NOT IN REPO** (no iOS/Android/Capacitor/RN/Expo — verified). This is the gating dependency for the App Store goal.
- **PWA: Working but Untested** — valid manifest + `sw.js` + apple icons, all 200 on production; `screenshots: []` empty; offline caches only `/`.
- **iOS reader mode:** implemented (`lib/platform.ts`) — but **P2 traps:** permanent `localStorage` `?platform=ios` flag (a web user who ever hits that URL loses purchase UI forever on that device), and iOS home-screen PWA users are treated as in-app (lose purchase UI). Plus fake "Available on iOS/Android" badges + unconditional `google-play-app` meta on clip pages for apps that don't exist.
- **Smart App Banner:** correctly gated off until `NEXT_PUBLIC_APPLE_APP_ID` is set.
- **UNVERIFIED (not determinable from repo):** wrapper choice, bundle id, signing, Apple Developer account ownership, TestFlight, App Store Connect state, screenshots, iOS push.

---

## 12. Admin Operations Audit

**Blunt truth: the team cannot operate the platform without a developer.** `/admin` is only an analytics dashboard + a creator/UGC review queue.

| Task | Non-dev possible today? |
|---|---|
| Approve creators / approve+publish creator content / view revenue | ✅ Yes (3 tasks) |
| Add/edit title, reorder episodes, replace poster, change category/price, publish/unpublish, feature content, change homepage order, create a sale, add affiliate product | ❌ **No** — all are hardcoded TypeScript (`catalog.ts`, `mux-map.ts`, `config.ts`, `products.ts`, `amazon-sponsors.ts`, `SummerSaleBadge.tsx`) requiring a commit + full redeploy |
| View purchases/users, export data, takedown published UGC, resolve support/refund/entitlement issues | ❌ **No tooling exists** |

- **Admin API protection:** server-side Bearer + hardcoded allowlist (verified 401/403 at the time). Historical owner/admin email identifiers are intentionally omitted.
- **P1:** the dashboard's engagement/unlock metrics query **nonexistent columns** → silent zeros.

---

## 13. Security and Compliance Audit

**Strong fundamentals:** no secrets committed (`.env*` gitignored, scan clean); all security headers present & verified live (CSP, HSTS); server-side price resolution (client prices ignored); RLS enabled on all tables; admin/creator APIs auth-scoped with no IDOR; Stripe webhook signature verified; App Store reader mode + in-app account deletion implemented; legal pages rewritten and accurate.

**Gaps:**
- **P1 — Paywall integrity** (paid streams free-ridable — §7).
- **P1 — Mux webhook unsigned** (`MUX_WEBHOOK_SECRET` unset).
- **P1 — Migration 009 unapplied** (verified live: FK still `ON DELETE CASCADE` → deletion destroys sales ledger).
- **P2 — Rate limiter per-isolate** (ineffective at scale).
- **No DMCA/copyright takedown process**, no COPPA/minors statement beyond privacy text, **no content-moderation process** for UGC (the AI `moderate` mode can't run).
- Affiliate FTC disclosures partial.

---

## 14. Performance Audit

- **Build: PASS** (2,257 SSG pages; one benign `@ts-expect-error` warning). **tsc: PASS** clean.
- **Tests: NONE** — no test script, zero automated tests, no CI gate on a live revenue product. *(P1)*
- **Lint:** 90 problems (45 errors / 45 warnings). The 4 rules-of-hooks errors (real crash pattern) are all inside **dead unimported `RedCarpetHero.tsx`** — no live-path bug. Rest are unused-vars/style.
- **npm audit:** 2 moderate build-time (postcss, vendored in Next) — no runtime exposure.
- **Images:** every poster served via `next/image` optimizer (verified); originals are 1.5–2.5MB but optimized on delivery.
- **P2 findings:** **148MB `public/posters-backup-20260617/` deployed and publicly served** (verified 200); **doubled page titles** `| VERZA TV | VERZA TV` (verified live); `screenshots:[]` in manifest.
- **SEO:** sitemaps, canonicals, JSON-LD present (spot-checked). **TTFB 155–508ms** — healthy.

---

## 15. Third-Party Dependencies

| Service | Purpose | Account/Creds | Status |
|---|---|---|---|
| Vercel | Hosting (team codevibes) | ✅ | Production |
| Supabase | DB + Auth (project identifier intentionally omitted) | ✅ | Production |
| Stripe | Payments (LIVE) | ✅ | Live; webhook events incomplete |
| Mux | Video (public playback) | ✅ tokens; ❌ signing keys; ❌ webhook secret | Playback prod; upload untested |
| Resend | Email | ✅ | Untested |
| Google (GTM/GA4/AdSense) | Analytics + ads | Historical identifiers omitted; **data flow UNVERIFIED** | Partial |
| Anthropic | AI features | ❌ no key, **SDK not installed** | Broken/UI-only |
| Amazon Associates | Affiliate | `verzatv-20` tag; **validity UNVERIFIED** | Partial |
| TikTok Shop | Affiliate | None — fabricated tiles | UI Only |
| Apple Developer | App Store | **UNVERIFIED / external** | Blocked |

---

## 16. Known Bugs (ranked)

**P0**
- Merch checkout charges live cards with **no shipping address** (`/api/checkout`).
- **No native app exists** to submit to the App Store.

**P1**
- Paywall bypassable — paid catalog streams free (unsigned Mux URLs in public HTML).
- Stripe webhook missing subscription/refund events → VIP lifecycle dead; billing portal 404s.
- Purchase pipeline never proven (0 rows in live DB).
- Migration 009 unapplied → account deletion destroys sales ledger (verified live).
- Mux webhook accepts unsigned payloads.
- Analytics captures almost nothing (121 rows, only paywall_viewed); `gtag` undefined.
- Admin dashboard queries nonexistent columns → all zeros.
- OAuth providers possibly not configured → dead-end sign-in.
- Owner email not in admin allowlist.
- Creator-unlock omits buyer id; creators never emailed on approval.

**P2**
- 148MB posters-backup publicly served.
- Fake view/like counts shown to users.
- Doubled page titles.
- iOS reader mode leaks $1.99 badges (SeriesInfoDrawer/EpisodeDropdown) + permanent localStorage flag.
- 6/10 merch prices unconfirmed TODOs, charged live.
- AI creator tools present canned text as real output.
- Zero tests / no CI.
- Rate limiter per-isolate.
- Affiliate/StorageBlue missing FTC labels.

**P3**
- ~4,300 lines dead code; coin remnants; duplicate `my_list`/`saved_list`; orphan routes (`/learn/*`, `/horizontal`, `/me/list`); unused content-CMS tables; stale catalog `episodeCount` numbers.

---

## 17. Missing Information (must be provided/verified externally)
- iOS app wrapper plan + Apple Developer account ownership + App Store Connect state.
- Deployed Stripe webhook secret correctness (proven only by a test purchase).
- Supabase Google/Apple OAuth provider configuration.
- Amazon `verzatv-20` approval status.
- GTM/GA4/AdSense accounts actively receiving data.
- **Content licensing terms** (owned vs licensed originals).
- Supabase backup/rollback policy.
- Real monitored inboxes for `support@`/`privacy@`/`legal@verzatv.com`.

---

## 18. Launch Checklist

### Before App Store submission
1. Build the iOS wrapper (loads `verzatv.com?platform=ios`). **[P0]**
2. Verify in the real app build: no prices/purchase UI anywhere; free playback works; sign-in + delete-account work.
3. Fix the $1.99 badge leaks in `SeriesInfoDrawer`/`EpisodeDropdown`. **[P2]**
4. Apply migration 009. **[P1]**
5. Confirm real support/privacy/legal inboxes; lawyer sign-off on legal pages.
6. App Store Connect: Privacy URL `/privacy`, Support URL `/support`, nutrition label (Email, Purchase History, Usage Data, Identifiers, Diagnostics; no tracking), age rating.

### Before public launch / accepting money
1. **Decide the paywall model:** Mux signed URLs (real lock) or reposition as freemium. **[P1]**
2. Add subscription + refund events to the Stripe webhook. **[P1]**
3. Make one real $1.99 test purchase; confirm entitlement + persistence. **[P1]**
4. Fix merch: add shipping collection **or** hide `/shop`; confirm the 6 prices. **[P0/P1]**
5. Wire analytics event persistence + define `gtag`. **[P1]**
6. Fix admin dashboard columns; add owner to admin allowlist. **[P1]**
7. Set `MUX_WEBHOOK_SECRET` or disable the Mux webhook. **[P1]**
8. Verify OAuth providers or hide the buttons. **[P1]**
9. Delete the 148MB backup folder; fix doubled titles; remove fake counts. **[P2]**

### First 30 days after launch
- Read the (now-working) funnel; iterate paywall copy/price from data.
- Reconcile any pre-fix buyers whose entitlements sit in `pending_entitlements`.
- Remove dead code + coin remnants; consolidate duplicate tables.
- Build minimal non-dev content ops (publish/unpublish, feature, create-sale) — currently all require a deploy.
- Decide creator-program launch (fix the 3 creator P1s first) and `im-obsessed-with-my-boss-2` go-live.

---

## 19. Recommended Execution Order

1. **Migration 009** (30 sec, prevents data loss).
2. **Stripe webhook events** (dashboard, no code — activates VIP).
3. **Merch: hide `/shop`** for launch (fastest close of the P0).
4. **Admin dashboard columns + owner allowlist** (restores visibility).
5. **Delete posters-backup, fix doubled titles, remove fake counts** (fast hygiene).
6. **One real $1.99 test purchase** → confirm the pipeline (informs everything else).
7. **Paywall decision** (signed URLs vs freemium) — the biggest strategic call.
8. **Analytics wiring** (so launch produces data).
9. **Verify OAuth / set MUX_WEBHOOK_SECRET / badge leaks.**
10. **Build the iOS wrapper** (parallel track — longest lead time; start now).
11. Post-launch: creator fixes, dead-code cleanup, non-dev CMS.

---

## 20. Honest Final Assessment

- **Is the platform ready to launch?** The **free web experience, yes.** As a **paid** product, **not quite** — one paywall decision, the VIP webhook fix, and a single proven test purchase stand between you and a trustworthy revenue loop. Call it 1–3 days of focused work.
- **Is it ready to accept money?** **Technically yes, safely not yet.** Live keys work and the code is correct, but it's never been proven end-to-end, VIP can't be cancelled, merch ships nowhere, and paid video is free-ridable. Fix those four and it is.
- **Is the content database reliable?** **Yes.** 4,262 episodes, zero duplicate IDs, zero gaps, correct numeric ordering, posters all present. It's the strongest part of the platform. (The only wrinkle is cosmetic stale `episodeCount` numbers in source, auto-corrected at runtime.)
- **Can creators upload without help?** **Technically yes** (the pipeline is real and complete), but it has **never been used**, creators aren't emailed on approval, there's no rights/terms step, no payouts, and the AI tools are fake. Not ready to invite creators.
- **Can the team operate it without a developer?** **No.** Every content, pricing, poster, and merchandising change is code + redeploy. Only creator approval and revenue-viewing are self-serve. This is the biggest long-term operational gap.
- **The single biggest blocker:** **there is no iOS app to submit** — for the App Store goal, nothing else matters until the wrapper exists. *(If the near-term goal is instead "sell paid content on the web," the single biggest blocker is the **bypassable paywall**.)*
- **What should be completed this week:** apply migration 009; add the Stripe subscription/refund events; hide or fix the merch shop; fix the admin dashboard + owner allowlist; make one real $1.99 test purchase to prove the pipeline; and **start the iOS wrapper build** since it has the longest lead time. Then make the paywall decision.

---

*This audit verified claims against code, the live database, Stripe, Mux, and the production site. Items that could not be verified are labeled UNVERIFIED and listed in §17. No production data was modified and no charges were made.*
