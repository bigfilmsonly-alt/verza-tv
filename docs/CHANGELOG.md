# Changelog

## 2026-07-30 -- Tubi partner tab (3rd): logo + Coming Soon
- Added a **Tubi** tab (authorized partner, signed contract) as the 3rd tab,
  between Hot and Anime. Order: Drama · Hot · Tubi · Anime · Español · Bollywood ·
  Creators · Reality · Red Carpet · Music (10 tabs).
- The tab renders the Tubi wordmark logo (`public/tubi-logo.png` — the licensed
  asset center-cropped to a chip) instead of a text label, sized taller than the
  text tabs so it stands out, with a small "Soon" pill. Coming Soon state on tap
  until the integration is live. `CategoryEnum` + `/discover/tubi` updated.

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
