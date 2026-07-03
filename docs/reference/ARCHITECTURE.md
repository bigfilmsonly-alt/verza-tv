# Architecture

## Overview

Verza TV is a Next.js 16 App Router application that streams vertical micro-dramas. The homepage is server-rendered with a client-side `BrowsePage` for interactive tab switching. Content metadata lives in static TypeScript files (catalog, series-detail, mux-map). Video playback goes through Mux HLS. Payments use Stripe with a coin-based economy. Auth and user data are backed by Supabase.

## Request Flow

```
Browser
  |
  v
Vercel Edge Network
  |
  v
Next.js App Router (SSR / ISR / API)
  |
  +---> Static pages (about, help, terms, privacy, press)
  |
  +---> SSR homepage
  |       page.tsx (server)
  |         -> catalog.ts (80+ series)
  |         -> BrowsePage.tsx (client, tab switching)
  |
  +---> Series pages (SSG at build, ISR on demand)
  |       /series/[slug]           -> catalog + series-detail
  |       /series/[slug]/[episode] -> catalog + mux-map -> Player or CoinPaywall
  |
  +---> API routes
  |       /api/playback/[episode]  -> mux-map.ts -> HLS URL
  |       /api/coins/*             -> Supabase profiles (stubbed)
  |       /api/unlock/*            -> coin debit + entitlement (stubbed)
  |       /api/stripe/webhook      -> Stripe -> coin_ledger (stubbed)
  |       /api/ai-host             -> Anthropic Claude
  |       /api/checkout            -> Stripe Checkout (stubbed)
  |       /api/og/[slug]           -> poster redirect for OG cards
  |
  +---> SEO routes
          /robots.txt              -> conditional by VERCEL_ENV
          /sitemap.xml             -> sitemap index
          /sitemaps/*.xml          -> shows, episodes, genres, pages
          /llms.txt                -> structured LLM-readable site info
```

## Content System

Content is defined entirely in static TypeScript files -- no CMS, no database reads at build time.

```
lib/catalog.ts          80+ Series objects (slug, title, logline, genre,
                        channel, episodeCount, pricing, status)
                           |
lib/series-detail.ts    Rich metadata keyed by slug (description, cast,
                        tags, rating, year, posterMood)
                           |
lib/mux-map.ts          4,149 Mux playback IDs across 76 series
                        (slug -> episode[] with playbackId + duration)
                           |
lib/products.ts         10 merch products for /shop
lib/config.ts           Brand constants, coin packs, pricing
lib/theme.ts            Design tokens (T.bg, T.accent, T.coin, etc.)
lib/schemas.ts          JSON-LD generators (Organization, TVSeries, Episode, FAQ, etc.)
```

**Content adapter pattern:** `getSeriesWithDetail(slug)` merges catalog.ts base data with series-detail.ts rich metadata at query time, keeping the catalog lightweight for list views.

**Episode generation:** Episodes are generated deterministically from `getEpisodesForSeries(slug)` using a hash-seeded duration (60-120s). No episode table exists yet -- episode metadata is computed, not stored.

## Video Playback

```
Episode page (SSR)
  -> getPlayback(slug, epNum)           lib/mux-map.ts lookup
  -> Player component (client)          receives playbackId
  -> HLS stream                         https://stream.mux.com/{id}.m3u8

API fallback:
  GET /api/playback/{slug}--{epNum}
  -> entitlement check (free eps or auth)
  -> returns { playbackId, streamUrl, thumbnail }
```

Mux assets: 4,149 playback IDs mapped across 76 series in `mux-map.ts`. The file is auto-generated. Signed URLs are stubbed (`lib/mux-playback.ts`, `lib/mux.ts`) -- production will use `@mux/mux-node` JWT signing with `MUX_SIGNING_KEY_ID` + `MUX_SIGNING_KEY_SECRET`.

## Supabase (User Data)

**Live tables (typed in `lib/supabase/schema.ts`):**
- `profiles` -- display_name, avatar_url, coin_balance, is_vip, vip_expires_at, streak_days, language
- `coin_ledger` -- amount, reason, reference_id, balance_after (append-only)
- `entitlements` -- series_slug, episode_number (null = season pass)
- `purchases` -- provider, product_type, amount_cents, status
- `watch_progress` -- series_slug, episode_number, progress_seconds, completed

**Auth:** Supabase Auth with Google/Apple OAuth. Callback at `/api/auth/callback`. Currently stubbed (`lib/auth.ts` returns null).

**Client/Server split:**
- `lib/supabase/client.ts` -- browser client (anon key)
- `lib/supabase/server.ts` -- server client (service role key, cookies)

## Stripe (Payments)

Coin-based economy:
1. User selects a coin pack (5 tiers: 100-3,500 coins, $1.99-$49.99)
2. `POST /api/coins/purchase` creates a Stripe PaymentIntent
3. Stripe webhook (`POST /api/stripe/webhook`) confirms payment
4. Webhook handler credits `coin_ledger` and updates `profiles.coin_balance`
5. User spends coins: `POST /api/unlock` (single episode) or `POST /api/unlock/season-pass`

Merch checkout: `POST /api/checkout` creates a Stripe Checkout Session for cart items.

All payment endpoints are currently stubbed with the Supabase integration marked as TODO.

## Layout and Rendering

**iPhone frame:** On desktop (>768px), the entire app renders inside a CSS iPhone frame (`iphone-frame` / `iphone-screen` / `iphone-nav-dock`). On mobile, the frame is hidden and content renders directly (`mobile-only`).

**Shell structure:**
```
RootLayout
  -> CartProvider (React context)
     -> iphone-frame (desktop) / mobile-only (mobile)
        -> Header
        -> main (page content)
        -> Footer
        -> BottomNav (5-tab navigation)
     -> CartDrawer (slide-out cart overlay)
```

**Rendering modes:**
- Homepage: SSR with client `BrowsePage` for interactivity
- Series/episode pages: SSG via `generateStaticParams` (live series, first 10 episodes each)
- Shop product pages: SSG via `generateStaticParams`
- Genre pages: SSG with dynamic params
- API routes: serverless functions
- Static pages: server components (about, help, terms, privacy, press, refund-policy)

## Key Directories

```
app/                    Next.js App Router pages and API routes
  api/                  15 API route handlers
  series/[slug]/        Series detail + episode player
  discover/             Browse + genre filtering
  genre/[genre]/        SEO genre landing pages
  shop/                 Merch store
  sitemaps/             XML sitemap generation
components/             19 React components (mix of server + client)
lib/                    Data layer, config, utilities
  supabase/             Supabase client/server/schema
  content/              Content utilities
  seo/                  SEO helpers
public/                 Static assets (posters, icons, OG images)
docs/                   Project documentation
```
