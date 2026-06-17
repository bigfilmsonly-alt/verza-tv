# Routes

## Pages (24)

| Route | Type | File | Purpose | Data Source |
|-------|------|------|---------|-------------|
| `/` | SSR + Client | `app/page.tsx` | Homepage with tabbed browse (BrowsePage) | `catalog.ts`, `getLiveSeries()`, `getSeriesByCategory()` |
| `/about` | Server | `app/about/page.tsx` | Company info, founder, Filmology Labs | `config.ts` (BRAND), `schemas.ts` |
| `/channels` | Server | `app/channels/page.tsx` | Browse by channel (Verza Originals, etc.) | `catalog.ts` (`getChannels`, `getSeriesByChannel`) |
| `/discover` | Server | `app/discover/page.tsx` | Discovery hub with search + category grid + all series list | `catalog.ts`, `SearchBar` component |
| `/discover/[genre]` | SSG | `app/discover/[genre]/page.tsx` | Genre-filtered series list (SEO landing page) | `catalog.ts`, `BROWSE_TABS`, `breadcrumbSchema` |
| `/genre/[genre]` | SSG | `app/genre/[genre]/page.tsx` | Genre landing page with rich descriptions | `catalog.ts` (`getSeriesByGenre`), `itemListSchema` |
| `/help` | Server | `app/help/page.tsx` | FAQ page with structured data | `config.ts` (pricing constants), `faqSchema` |
| `/me` | Server | `app/me/page.tsx` | User account dashboard (coins, library, settings) | Supabase auth (stubbed) |
| `/me/list` | Server | `app/me/list/page.tsx` | User watchlist / saved shows | Supabase auth (stubbed) |
| `/press` | Server | `app/press/page.tsx` | Press page with brand facts and media resources | `config.ts` (BRAND) |
| `/privacy` | Server | `app/privacy/page.tsx` | Privacy policy (draft, flagged for legal review) | Static content |
| `/refund-policy` | Server | `app/refund-policy/page.tsx` | Refund policy (draft, flagged for legal review) | Static content |
| `/search` | Server | `app/search/page.tsx` | Full search page with results grid | `catalog.ts` |
| `/series/[slug]` | SSG | `app/series/[slug]/page.tsx` | Series detail: poster hero, metadata, cast, tags, episode list, season pass | `getSeriesWithDetail()`, `getEpisodesForSeries()`, `seriesSchema` |
| `/series/[slug]/[episode]` | SSG | `app/series/[slug]/[episode]/page.tsx` | Episode player (free) or coin paywall (paid), episode nav, all episodes list | `getEpisode()`, `getPlayback()`, `episodeSchema` |
| `/shop` | Server | `app/shop/page.tsx` | Merch store grid | `products.ts`, `CartButton` |
| `/shop/[slug]` | SSG | `app/shop/[slug]/page.tsx` | Product detail with image carousel + add to cart | `products.ts` (`getProductBySlug`), `AddToCartButton` |
| `/shorts` | Server | `app/shorts/page.tsx` | TikTok-style vertical swipe feed of preview clips | `getLiveSeries()`, `ShortsFeed` client component |
| `/sign-in` | Server | `app/sign-in/page.tsx` | Sign-in form (Google/Apple OAuth) | Supabase auth (stubbed) |
| `/sign-up` | Server | `app/sign-up/page.tsx` | Sign-up form | Supabase auth (stubbed) |
| `/studio` | Server | `app/studio/page.tsx` | AI Creation Studio placeholder (Phase 5) | Static content |
| `/terms` | Server | `app/terms/page.tsx` | Terms of service (draft, flagged for legal review) | Static content |
| `not-found` | Server | `app/not-found.tsx` | Custom 404 page | Static content |

**SSG notes:**
- Series pages: all live series get static params via `generateStaticParams`
- Episode pages: first 10 episodes of each live series are pre-rendered
- Shop products: all 10 products are pre-rendered
- Genre pages: all genre slugs are pre-rendered

## API Routes (15)

| Route | Method | File | Purpose | Status |
|-------|--------|------|---------|--------|
| `/api/ai-host` | POST | `app/api/ai-host/route.ts` | AI Host recommendations via Anthropic Claude | Live (needs API key) |
| `/api/auth/callback` | GET | `app/api/auth/callback/route.ts` | Supabase OAuth callback (code exchange) | Stubbed |
| `/api/checkout` | POST | `app/api/checkout/route.ts` | Stripe Checkout session for merch cart | Stubbed |
| `/api/coins/balance` | GET | `app/api/coins/balance/route.ts` | Get user's coin balance | Stubbed (returns 500 coins) |
| `/api/coins/purchase` | POST | `app/api/coins/purchase/route.ts` | Purchase coin pack via Stripe PaymentIntent | Stubbed |
| `/api/entitlements` | GET, POST | `app/api/entitlements/route.ts` | List / grant episode entitlements | Stubbed |
| `/api/entitlements/check` | GET | `app/api/entitlements/check/route.ts` | Check if user is entitled to a specific episode | Stubbed (free eps always entitled) |
| `/api/og/[slug]` | GET | `app/api/og/[slug]/route.ts` | Dynamic OG image: redirects to series poster | Live |
| `/api/playback/[episode]` | GET | `app/api/playback/[episode]/route.ts` | Get Mux playback URL for an episode (slug--epNum format) | Live |
| `/api/stripe/webhook` | POST | `app/api/stripe/webhook/route.ts` | Stripe webhook handler (payment confirmation -> coin credit) | Stubbed |
| `/api/studio/generate` | POST | `app/api/studio/generate/route.ts` | AI Studio content generation | Placeholder (Phase 5, returns 501) |
| `/api/unlock` | POST | `app/api/unlock/route.ts` | Unlock single episode with coins | Stubbed |
| `/api/unlock/season-pass` | POST | `app/api/unlock/season-pass/route.ts` | Purchase season pass with coins | Stubbed |
| `/api/uploads` | POST | `app/api/uploads/route.ts` | Upload pipeline for creator content | Placeholder (Phase 6, returns 501) |

## SEO Routes (5)

| Route | Method | File | Purpose |
|-------|--------|------|---------|
| `/robots.txt` | GET | `app/robots.txt/route.ts` | Conditional robots.txt (noindex on preview deploys, allow on production) |
| `/sitemap.xml` | GET | `app/sitemap.xml/route.ts` | Sitemap index pointing to 4 child sitemaps |
| `/sitemaps/shows.xml` | GET | `app/sitemaps/shows.xml/route.ts` | All live series URLs |
| `/sitemaps/episodes.xml` | GET | `app/sitemaps/episodes.xml/route.ts` | All episode URLs for live series |
| `/sitemaps/genres.xml` | GET | `app/sitemaps/genres.xml/route.ts` | Genre + discover category URLs |
| `/sitemaps/pages.xml` | GET | `app/sitemaps/pages.xml/route.ts` | Static page URLs (home, discover, channels, shop, about, etc.) |
| `/llms.txt` | GET | `app/llms.txt/route.ts` | LLM-readable structured site description |

## Total Route Count

- **24 pages** (including not-found)
- **15 API routes**
- **7 SEO/meta routes**
- **46 total route handlers**
