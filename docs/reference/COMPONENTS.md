# Component Reference

All React components in `components/`. `"use client"` unless noted. Grouped by
concern.

## Layout & navigation

| Component | Purpose |
| --- | --- |
| `Header.tsx` | Sticky top bar (logo, search). Has `backdropFilter: blur(16px)` — a containing block for `position:fixed` descendants (see SearchButton note). |
| `Footer.tsx` / `FooterSitemap.tsx` | Footer + sitemap links. "Become a Creator" → `/studio`. |
| `BottomNav.tsx` | Mobile bottom navigation. |
| `CategoryTabs.tsx` | Category tab bar (Drama, New, Hot, Music, Reality, Red Carpet). Sticky `top:48`. |

## Home / browse

| Component | Purpose |
| --- | --- |
| `BrowsePage.tsx` | Home page. Hero slideshow (`filtered.slice(0,4)`, pause-on-hover), category tabs, poster grid with woven TikTok Shop ad rows, StorageBlue sponsor ribbons, Summer Sale sticky ribbon. |
| `HeroCarousel.tsx` / `HeroVideo.tsx` | Hero variants. |
| `RedCarpetHero.tsx` | Red Carpet tab hero grid. |
| `ChannelRow.tsx` | Horizontal channel/series row. |
| `SeriesCard.tsx` | Poster tile. |
| `PosterSkeleton.tsx` | Loading skeleton. |
| `ImageCarousel.tsx` | Generic image carousel. |

## Search

| Component | Purpose |
| --- | --- |
| `SearchButton.tsx` | Header search popover. Renders via `createPortal(..., document.body)` to escape the header's backdrop-filter containing block. Transparent backdrop (page stays visible). Movie results + TikTok Shop product results. |
| `SearchBar.tsx` / `FeedSearch.tsx` | Alternate search inputs. |

## Video players

| Component | Purpose |
| --- | --- |
| `Player.tsx` | Core Mux/HLS player. Muted-first autoplay, `mutedRef` pattern, `sourceReady` gate. Emits `paywall_viewed` / `checkout_started`. |
| `EpisodeFeed.tsx` | Immersive vertical swipe feed (episodes). |
| `ShortsFeed.tsx` | Horizontal swipe carousel (shorts, starts unmuted). |
| `HorizontalFeed.tsx` | 16:9 widescreen player (Storage Pirates). |
| `EpisodeDropdown.tsx` | Episode selector. |

## Monetization

| Component | Purpose |
| --- | --- |
| `CoinPaywall.tsx` | Locked-episode paywall. $1.99 unlock → `/api/unlock`. Sign-in redirect, spinner, inline error+retry. |
| `SummerSaleBadge.tsx` | Sticky $1.99 promo badge → checkout for most-popular series. Gold rim, disabled when no featured, "tap to retry" on failure. |
| `VipCard.tsx` | VIP subscription card ($9.99/mo · $79.99/yr). **P0: "Manage subscription" link is a Stripe TEST portal URL — needs real production URL.** |
| `SponsoredProducts.tsx` | `SponsoredTile({product})` — poster-shaped (2:3) TikTok Shop ad tile. "Ad" tag, price pill, always-visible mobile "Shop on TikTok" CTA (hover on desktop). |

## Commerce (merch)

| Component | Purpose |
| --- | --- |
| `AddToCartButton.tsx` / `CartButton.tsx` / `CartDrawer.tsx` | Shop cart UI. |

## Creator (UGC)

| Component | Purpose |
| --- | --- |
| `CreatorDashboard.tsx` | Apply → pending → approved; Mux XHR-progress upload; content list poll; edit/pricing; earnings. Rendered at `/creator` and `/studio`. |
| `CreatorAITools.tsx` | AI Studio (script/logline/social/description). |
| `CreatorWatch.tsx` | Public creator content player (Mux HLS, PPV paywall). |

## Admin

| Component | Purpose |
| --- | --- |
| `AdminDashboard.tsx` | Stats + funnel (paywall→checkout→purchase) + revenue. |
| `AdminReview.tsx` | Creator applications + content review queue (inline Mux preview, approve/reject). |

## User / account

| Component | Purpose |
| --- | --- |
| `LibraryPage.tsx` | User library. |
| `ProfileDynamic.tsx` | Profile. |
| `OAuthButtons.tsx` | Social sign-in. |
| `SeriesInfoButton.tsx` / `SeriesInfoDrawer.tsx` | Series metadata drawer. |

## Platform / infra

| Component | Purpose |
| --- | --- |
| `AskVerza.tsx` | Floating AI chatbot (all pages). |
| `LangProvider.tsx` / `LangDropdown.tsx` / `LanguagePicker.tsx` / `ContentTranslator.tsx` | i18n context + language UI. `useTranslation()` hook. |
| `JsonLd.tsx` | Injects JSON-LD structured data. |
| `ServiceWorker.tsx` | Registers the service worker (PWA). |
| `PushNotificationToggle.tsx` | Web-push opt-in. |
| `PerfHarness.tsx` | Performance instrumentation. |
