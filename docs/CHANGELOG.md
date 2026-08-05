# Changelog

> **Historical record.** Entries describe the state/claims at the time they
> were written and are not current deployment or release instructions. Old
> prices, counts, availability, and App Store assumptions are superseded by
> [`LAUNCH-TRUTH.md`](LAUNCH-TRUTH.md). In particular, July reader-mode/no-IAP
> entries are superseded by the August 5 StoreKit architecture below.

## 2026-08-05 — Apple StoreKit non-consumable backend deployed

Source/database architecture:

- added the append-only exact 74-title Apple product registry using immutable
  `com.verzatv.app.series.<slug_with_underscores>` IDs and a separate retired-
  product overlay;
- pinned `@apple/app-store-server-library` 3.1.0 and added production/sandbox
  Apple JWS verification for canonical bundle/app, non-consumable type,
  quantity, purchased ownership, account token, product/series, timestamps,
  and optional price/currency;
- added authenticated preflight and signed-transaction/restore routes plus the
  public Apple-signed V2 notification route;
- added migration 015 with append/update-only purchase/notification ledgers,
  monotonic signed-event ordering, idempotent notification claims, explicit
  orphan-only deleted-account restore, and independent Stripe/Apple/manual/
  alternate-Apple entitlement sources; and
- updated Terms, Privacy, Refund, Help, and account-deletion behavior for Apple
  billing, Apple-decided refunds, restoration, ledger retention, and source-
  specific revocation.

App Store Connect readback:

- all 74 non-consumables exist with exact `en-US` metadata, $1.99 US base price
  plus storefront equalization, the reviewed 173-territory set, title-specific
  review notes, Family Sharing off, and hosted content off; and
- all 74 still report `MISSING_METADATA` because each needs its real IAP review
  screenshot.

Backend commit `a9b537844a8878851ecfe4c0e310f405b68fc6ef` is pushed and
live on the canonical alias. Migration 015 structural/RLS/RPC/privilege/source-
preservation readback passed; Apple-aware Terms/Privacy/Refund/Help and negative
routes passed; authenticated no-charge preflight returned the exact product
with private/no-store. Production preflight is exact true with a narrow
Sandbox allowlist. ASC V2 production/sandbox URLs are exact with sibling
integrity unchanged.

Still open: real signed notification delivery, an actual Sandbox transaction,
Paid Applications banking/tax, App Store `Video` tax-category readback, DSA
trader status, screenshots, exact TestFlight purchase/restore/refund matrix,
owner approval, ReviewSubmission attachment, and the separate five-credential
provider rotation/revocation gate.

## 2026-08-03 — App Store backend/payment/playback hardening

Production-verified:

- canonical Terms, Privacy, Refund, and Support pages return 200 and contain the
  August 3 legal release date;
- authenticated payment capabilities reports configured/live Series Checkout
  in explicit `compatibility` Terms mode, with monthly/yearly VIP false;
- the one canonical Stripe webhook was expanded in place to the exact reviewed
  19-event allowlist, wildcard off, with no second endpoint, historical replay,
  or signing-secret rotation; unsigned delivery returns 400; and
- `MUX_SIGNED_PLAYBACK_ENABLED=true` is live. Unentitled paid playback returns
  402/no capability; entitled playback returns `policy=signed`, no
  `playbackId`, 1,800-second tokenized stream/poster URLs, and a 200 HLS
  manifest. The disposable canary account/entitlement was deleted.

Source/data hardening:

- classified 80 titles as 79 live / 74 paid-live / five wholly free / one
  coming soon;
- generated a 4,262-row client-safe Mux projection with 459 intentionally
  public IDs and 3,803 withheld (3,753 paid live + 50 coming soon);
- completed add-only signed counterparts for all 3,753 paid-live rows;
- replaced the error-prone regex catalog parser with a shared AST parser and
  restored 25 correctly public free Red Carpet IDs;
- hardened Series Checkout history recovery, provider verification, Refund/
  Dispute/deletion ordering, RLS, Terms/notice evidence, tax accounting, and
  explicit compatibility/required consent modes; and
- added and deployed Mux creator-webhook fail-closed verification: missing secret
  503, invalid signature 400, processing failure 500, no unsigned fallback,
  plus a synthetic-signature regression. Production readback with the
  intentionally absent verification secret returns 503, so creator ingestion
  remains unavailable until a real secret and signed-event canary exist.

Still open: Stripe Public details (currently blank), restricted Billing Portal,
exact required-consent deployment/readback, controlled $1.99 smoke purchase,
standalone native acceptance, and App Store submission. Coins, creator PPV,
official merch Checkout, and both VIP sale paths remain closed.

Isolated source reconciliation (not a deployment):

- reconciled the App Store/payment/playback hardening onto upstream `60546ee`
  while retaining the current web browse order, Storage Pirates Reality-only
  rule, arrowless heroes, Tubi outbound partner panel/assets, Creator beta form,
  and paywall auth-settle fix;
- kept `SummerSaleBadge.tsx` deleted and regenerated the client-safe Mux map
  after the upstream catalog-category change. Episode/capability inventory is
  unchanged at 4,262 / 459 public / 3,803 withheld; only the generated source
  fingerprint changed, so native must byte-sync the projection before its next
  build; and
- hardened `/api/creator/beta` with same-origin JSON, size/rate/honeypot and
  no-store controls, truthful provider-failure handling, and HTML-escaped form
  notification fields. The form is still lead capture only and does not enable
  creator ingestion, approval, PPV, payment, or entitlement.

## 2026-07-30 -- Tubi partner tab (3rd): logo → click-through to tubitv.com
- Added a **Tubi** tab (authorized partner, signed contract) as the 3rd tab,
  between Hot and Anime. Order: Drama · Hot · Tubi · Anime · Español · Bollywood ·
  Creators · Reality · Red Carpet · Music (10 tabs).
- The tab renders the Tubi wordmark logo (`public/tubi-logo.png` — the licensed
  asset center-cropped to a chip) instead of a text label, sized taller than the
  text tabs so it stands out. Tapping it opens a high-converting promo panel that
  links to **tubitv.com** in a new tab (`rel="sponsored"`) with first-party
  value-prop copy + a "Watch Free on Tubi" CTA. `CategoryEnum` + `/discover/tubi`
  updated. (Interim states during the day — a "Soon" pill, a Coming Soon card, a
  Tubi logo beside StorageBlue in the sponsor ribbon — were all removed.)
- A true in-site *embed* of tubitv.com is **blocked by Tubi's `X-Frame-Options:
  SAMEORIGIN`** (browser-enforced; not overridable from our side). The real
  embedded experience needs Tubi to whitelist verzatv.com for framing or provide
  a partner embed URL; any native WebView or embed would require separate
  partner, platform, and release review and is not part of the iOS 2.0 client.

## 2026-07-20 -- Fix the paywall blink at the first locked episode
- The $1.99 unlock overlay "blinked a few times" on reaching a locked episode.
  Cause: `showUnlock` was toggled imperatively inside the IntersectionObserver
  callback, which fires repeatedly as a swipe settles, replaying the overlay's
  fade-in. Now derived from the SETTLED active episode via a 250ms-debounced
  effect (`paywall_viewed` fires once per settle, not per tick).
- `fullReattach()` returns early when blocked, so a paywalled episode's player
  can't loop-reattach behind the overlay.
- Paywall gated on `authResolved`: it never surfaces until the `/api/access`
  entitlement check resolves, so VIP/owners no longer see a flash-then-hide.
  Found via a 6-angle adversarial verification pass.
- Reconciliation also resets `authFree` and `authResolved` on a client-side
  series change and explicitly fails the new title back to locked when no exact
  access/session check succeeds, so a reused component cannot carry the prior
  title's UI entitlement across slugs.
- Note: "This page cannot load / Go Back" is not a bug — it's the intended iOS
  reader-mode paywall ("Episode Unavailable", Apple Guideline 3.1.1).

## 2026-07-20 -- Nav rework: New→Hot, + Bollywood & Creators; hero arrows removed
- **New tab removed, folded into Hot.** `getSeriesByCategory("popular")` now
  returns `popular ∪ new` (ranked-popular first), so Hot shows Hot+New as one
  section (~20 titles, was 10). `new` stays a category, so the "New" badge still
  flags fresh titles inside the grid.
- **Bollywood and Creators tabs added** after Español (before Reality), both
  branded Coming Soon placeholders like Anime/Español — no content yet; drop in
  live `Series` with `categories: ["bollywood"|"creators"]` to go live.
- **Final tab order:** Drama · Hot · Anime · Español · Bollywood · Creators ·
  Reality · Red Carpet · Music (9 tabs; 4 Coming Soon).
- **Hero slideshow arrows removed** (main + Reality heroes); slides change via
  the dot indicators, auto-rotate, and tab swipe.

## 2026-07-16 -- Storage Pirates shows in the Reality tab only
- Storage Pirates (the only live series tagged `categories: ["reality"]`) was
  appearing in the Drama grid, which renders the whole live library. Reality
  titles are now excluded from the Drama grid — the same pattern already used to
  keep Red Carpet titles out — so Storage Pirates shows only in the Reality tab.
  Any future reality titles stay out of Drama automatically. No catalog/content,
  Mux, or payment/auth change (`components/BrowsePage.tsx`). Verified live.

## 2026-07-16 -- Anime & Español browse tabs (Coming Soon)
- Two new header tabs, additive navigation only. Final order:
  Drama · New · Hot · **Anime** · **Español** · Reality · Red Carpet · Music.
  No change to the episode catalog, Mux mapping, or payment/auth.
- Both launch in a branded **Coming Soon** state: no series carry the new
  categories yet, so `getSeriesByCategory()` returns `[]` and `BrowsePage`
  renders the existing Coming Soon card (category name → "Coming Soon" →
  subtext) using the site's existing tokens — no new design language. Copy:
  Anime — "Premium anime, coming soon to Verza."; Español — "Premium
  Spanish-language microdramas. Coming soon to Verza." "Español" keeps its ñ
  in both the tab and the heading.
- **Poster drop-in path:** when the ~6 Español posters (or Anime titles) are
  ready, add each as a live `Series` in `lib/catalog.ts` with
  `categories: ["espanol"]` / `["anime"]`; they then render through the
  standard poster grid and the Coming Soon card auto-hides. No layout change.
- Not surfaced in the genres sitemap or the Discover index while empty (no
  dead links / empty category pages). `/discover/espanol` + `/discover/anime`
  are statically generated and render a clean, accented Coming Soon page on
  direct navigation. `lib/content/schemas.ts` `CategoryEnum` widened to include
  the two keys so the content layer type-checks.
- **Deploy note (corrected):** the live domain `www.verzatv.com` / `verzatv.com`
  is promoted only by the Vercel **CLI** (`npx vercel --prod`), NOT by `git
  push` — a push builds a production-*target* deployment that does not take over
  the live alias. Shipped via CLI (deployment `dpl_GWBK4S1…`, commit `8a07501`);
  verified live in a real browser.

## 2026-07-13 -- Amazon Affiliate Shop (replaces TikTok Shop)
- Replaced the placeholder TikTok Shop products with 12 real Amazon products
  (Associates tag `verzatv-20`); deleted `lib/sponsors.ts` and
  `components/SponsoredProducts.tsx`
- **Verza bag** (`lib/amazon-bag.tsx`): shoppers add products without leaving the
  app, then one handoff pushes the whole bag into their real Amazon cart. Amazon
  gives affiliates no checkout API, so payment always settles on Amazon — this is
  the closest the program allows
- Two storefronts: an Amazon section on `/shop` under the VERZA merch, and
  `/amazon` as the full store
- **Products removed from the poster grid, from search, and from the footer.**
  Browsing stays editorial; everything for sale lives on the Shop tab
- **No prices displayed** — Amazon only permits prices pulled live from PA-API and
  refreshed every 24h, so a hardcoded price is stale and a terms violation
- Product photos come from `m.media-amazon.com`, NOT the Associates image widget
  on `ws-na.amazon-adsystem.com` (an ad-network domain that ad blockers drop,
  leaving empty product cards)
- `scripts/amazon-cutouts.py`: removes the white studio backdrop from each product
  photo by flood filling inward from the corners, so white products keep their white
- Docs: [`guides/AMAZON-SHOP.md`](guides/AMAZON-SHOP.md) (operations) and
  [`reports/DEV-REPORT-2026-07-13-AMAZON-SHOP.md`](reports/DEV-REPORT-2026-07-13-AMAZON-SHOP.md)
  (7 bugs found and fixed, live verification)
- Moved the loose `VERZA_*` audit files from the repo root into `docs/reports/`

## 2026-07-08 → 07-11 -- App Store Compliance, Video Reliability & Paywall
- **iOS reader mode (Apple Guideline 3.1.1)**: `lib/platform.ts` + `HideInIOSApp`
  hide ALL digital purchase UI inside the iOS app — Summer Sale badge, episode
  unlock CTA, VIP card, Unlock Full Series. Physical goods (merch, Amazon) stay
  visible, because Apple forbids IAP for them (3.1.5(a))
- **In-app account deletion** (`/api/account/delete`) — hard App Store requirement
- Support page + privacy policy upgrade; ad/tracking stack (GTM, GA4, AdSense)
  skipped entirely inside the iOS app (ATT)
- **Fixed videos pausing/failing from episode 4 onward** — too many `<video>`
  elements alive at once
- Keep the paused frame visible; no black screen on pause
- Paywall redesign for conversion: prominent Go Back, gradient bullets, "No ads"
- **+362 episodes**: 5 new series live, 3 series completed; episode counts
  reconciled against real Mux inventory; 6 trailer episodes removed
- Supabase schema reconciled to match app code; AdSense loader + `ads.txt`

## 2026-07-03 → 07-04 -- Amazon Affiliate v1, Watermark, Swipe Tabs, Re-engagement
- First Amazon sponsored sections + per-product affiliate deep links + in-app
  product modal (mirroring the TikTok Shop ads; both later replaced — see 07-13)
- VERZA emblem **watermark** on videos; auto-hide all video chrome after 10s,
  watermark stays permanent; back arrow crossfades into the logo after 10s idle
- **Horizontal swipe between category tabs** (right = next, left = previous)
- Resume playback + Continue Watching re-engagement reminder; install /
  turn-on-reminders prompt
- Official white-inside VERZA logo everywhere; brand capitalised to **VERZA**;
  app icons + favicon regenerated
- Dedicated `/share` URL and versioned OG image for clean link previews
- Instant playback groundwork: video starts at click time, poster never shown

## 2026-06-30 → 07-02 -- Summer Sale, Search, Creator Pipeline
- **Summer Sale**: per-movie unlock, price settled at **$1.99** (was $2); badge
  moved into the header so it never clips on scroll
- **Search**: genre/keyword index so searching a category surfaces every show;
  drop-down search over a dimmed page instead of a black takeover
- **Creator / UGC pipeline end-to-end**: apply, upload, review, watch, payouts,
  plus an application approval flow (`/api/creator/*`)
- TikTok Shop sponsored products woven through the poster grid *(all removed
  2026-07-13 — see that entry)*
- Docs: master index, reference catalogs, pre-share master audit, root README

## 2026-06-29 -- Purchase & Revenue Funnel
- Closed the purchase + revenue funnel end to end in analytics

## 2026-06-25 → 06-27 -- StorageBlue Sponsorship & pSEO Architecture
- StorageBlue sponsored ad ribbons on the browse page (Drama / New / Hot only)
- Studio-grade programmatic SEO architecture + footer Sitemap
- Sticky category tabs; back button returns to the last viewed page

## 2026-06-18 → 06-23 -- Money, Auth, i18n, Immersive Player, Shorts, Security
- **Stripe**: merch checkout, series unlock, webhook → Supabase purchases +
  entitlements; sign-in required before purchase; persistent entitlements
- **Supabase auth** + Google/Apple OAuth; saved list for guests *and* signed-in
  users; Continue Watching; purchases auto-saved to My List
- **VIP subscription** ($9.99/mo, $79.99/yr) + push notifications
- **20 languages** fully translated (`lib/i18n.ts`)
- **ReelShort-style immersive full-screen episode player**: vertical swipe,
  auto-advance, haptics, preload, unified sound persistence
- **Shorts rewritten several times** to stop freezes: single persistent video
  element with source swapping (the naive per-card player froze iOS)
- **CRITICAL**: CSP was blocking all video playback on every device
- PWA support; Resend emails; GA4; Vercel Analytics + Speed Insights
- Security hardening: 7 critical/high vulnerabilities, rate limiting, input validation
- Ask Verza AI chatbot + Creator AI Studio (Claude integration)
- Desktop iPhone frame wraps the app like a real device *(web-only)*

## 2026-06-28 -- Analytics Stream, Video Perf & Reality Polish
- Built `analytics_events` persistence: migration 004, server-only `persistEvent()`,
  `/api/events` client sink, anon_id beacon in `emit()`, webhook revenue rows
- Video performance layer: TTFF tracker, capped next-item warming (never locked
  episodes), `PERF_TEST_MODE` measurement harness at `/dev/perf`
- Admin dashboard: ARPPU, paying users, free→paid rate (server-verified)
- pSEO: shows-by-genre sitemap, footer Sitemap link, JSON-LD
- Reality tab: StorageBlue sponsor ribbon stacked flush on Storage Pirates
  (`embedded` prop), lone poster centered under middle column
- Wrote `docs/DEV-REPORT.md` (current state + open items)

## 2026-06-17 -- Repo Organization & Documentation
- Created comprehensive documentation set (14 docs)
- Audited file tree, identified orphans and duplicates
- Established coding conventions
- No files moved or deleted (documentation-only pass)

## 2026-06-16 -- Mux Video Integration
- Connected 4,472 Mux assets to the app
- Built HLS player with hls.js + native Safari support
- Fixed critical iOS black screen bug (dynamic hls.js import)
- Zero-black-frames policy implemented

## 2026-06-14 -- Initial Build
- 76 series catalog with poster art
- 10-product merch shop with cart
- 6 browse tabs, hero slideshow, shorts feed
- Milestones A-H: SEO, legal, infrastructure, auth, payments
- iPhone frame on desktop, landscape responsive
- Premium visual enhancements
