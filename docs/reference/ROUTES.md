# Route reference

Last reconciled: **2026-08-03**. The source tree contains 60 `page.tsx` files,
42 `app/api/**/route.ts` handlers, and seven SEO/meta route handlers. Counts are
file inventories, not proof that every route is enabled or deployed.

Latest production readback verifies August 3 legal/support, payment
compatibility capabilities, signed paid playback, and the exact 19-event Stripe
webhook. The hardened creator Mux webhook is also deployed and fail-closed at
503 while its verification secret is intentionally absent. Required
Terms/portal/smoke remain open. See
[`../LAUNCH-TRUTH.md`](../LAUNCH-TRUTH.md).

## Consumer catalog and playback pages

| Route family | Purpose / boundary |
| --- | --- |
| `/` | Server-rendered catalog shell plus interactive browse |
| `/discover`, `/discover/[genre]` | Discovery/category pages |
| `/genre/[genre]`, `/genres`, `/genres/[slug]` | Genre discovery/SEO families |
| `/search` | Catalog search |
| `/series/[slug]` | Series metadata, episodes, supported-platform Series Unlock surface |
| `/series/[slug]/[episode]` | Free/entitled playback or eligible-platform paywall |
| `/shorts` | Free-preview discovery feed |
| `/horizontal` | Widescreen content surface |
| `/library`, `/me/list` | Saved/owned viewing surfaces |

Web availability does not define native iOS availability. Native iOS refilters
Discover/Search/genre to live titles and redirects non-live series/episode deep
links before data/auth/Mux work. Payment-bearing route families remain reader
mode there.

## Account, support, and legal pages

| Route | Purpose |
| --- | --- |
| `/sign-in`, `/sign-up` | Supabase authentication |
| `/me` | Current account, library, existing status, settings, deletion |
| `/help`, `/support`, `/contact` | Support and contact surfaces |
| `/terms`, `/privacy`, `/refund-policy` | Legal policy pages |
| `/editorial-standards` | Editorial policy |

August 3 legal/support is live and read back at the canonical origin. Native
core email actions still use their own handler/fallback helper and never rely on
a dead web link.

## Commerce and creator/admin pages

| Route family | Source behavior | iOS 2.0 |
| --- | --- | --- |
| `/shop`, `/shop/[slug]` | Web official-merch catalog; Checkout feature-gated off | Native Shop is prior-order support only; not these pages |
| `/amazon` | Web affiliate storefront | Fail-closed |
| `/creator`, `/studio`, `/watch/[...slug]` | Web creator/UGC/admin-adjacent surfaces; creator PPV disabled | Redirect before query/render |
| `/admin/dashboard`, `/admin/review` | Authenticated web operations | Redirect before query/render |

## Editorial/company/SEO pages

The source tree also includes company, founder/leadership, press/newsroom,
investor/partnership, brand/media, collections/best/watch-in/guides/learn,
share/clip, careers, channels, sitemap, and comparison route families.

Several are deliberately unavailable in native iOS because they consume
payment-bearing Tier-1 data or promote unsupported surfaces. Native reader-mode
tests, not this web route list, define the exact redirect boundary.

## Payment/access API routes

| Method | Route | Source state |
| --- | --- | --- |
| `POST` | `/api/unlock` | Canonical authenticated $1.99 Series Checkout |
| `GET` | `/api/unlock/confirm` | Exact authenticated provider-backed recovery |
| `GET` | `/api/payments/capabilities` | Live/private: Series compatibility configured/live; both VIP false |
| `GET` | `/api/access` | Canonical episode access |
| `GET` | `/api/entitlements`, `/api/entitlements/check` | Current-user access data |
| `POST` | `/api/entitlements`, `/api/entitlements/claim` | Client grants rejected (405/410) |
| `POST` | `/api/subscribe`, `/api/subscribe/confirm` | VIP release-gated; both plans closed |
| `POST` | `/api/billing-portal` | Exact restricted configuration required |
| `GET` | `/api/cron/vip-renewal-reminders` | Secret-authenticated/yearly-gated |
| `POST` | `/api/unlock/season-pass` | Retired, 410 |
| `GET`, `POST` | `/api/coins/balance`, `/api/coins/purchase` | Retired, 501 |
| `POST` | `/api/creator-unlock` | Disabled, 503 |
| `POST` | `/api/checkout` | Official merch feature-gated off |
| `GET` | `/api/checkout/native-return` | Android navigation/recovery bridge; never grants access |
| `POST` | `/api/stripe/webhook` | Signed provider reconciliation; one canonical endpoint exact 19/19, wildcard off |

Full API security and method detail: [`API-REFERENCE.md`](API-REFERENCE.md).

## Playback, account, creator, and utility APIs

- `/api/playback/[episode]` — free public or authorized paid/signed playback;
- `/api/account/delete` — guarded account/provider deletion with minimal
  payment tombstone;
- `/api/watch-progress`, `/api/saved-list` — own-user state;
- `/api/auth/callback` — validated OAuth exchange/return;
- `/api/creator/beta` — same-origin, rate-limited/honeypotted name/email lead
  notification only; no creator approval, ingestion, payment, or entitlement;
- `/api/creator/*`, `/api/admin/*` — web creator/admin pipeline;
- `/api/mux/webhook` — verified creator asset events; currently 503/unavailable
  until the production verification secret and signed-event canary exist;
- `/api/events` — non-revenue analytics only;
- `/api/ai-host`, `/api/studio/generate`, `/api/uploads` — optional/deferred
  feature routes;
- `/api/push/subscribe`, `/api/push/send` — web push; and
- `/api/og/[slug]` — Open Graph behavior.

## SEO/meta route handlers

| Route | Purpose |
| --- | --- |
| `/robots.txt` | Production indexability vs preview noindex |
| `/sitemap.xml` | Sitemap index |
| `/sitemaps/shows.xml` | Live show URLs |
| `/sitemaps/episodes.xml` | Live episode URLs; durable Mux media only for free episodes |
| `/sitemaps/genres.xml` | Genre/discovery URLs |
| `/sitemaps/pages.xml` | Static/editorial URLs |
| `/llms.txt` | LLM-readable site description |

Paid and coming-soon Mux capabilities may never appear in page payloads,
JSON-LD, sitemaps, or `llms.txt`.
