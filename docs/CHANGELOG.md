# Changelog

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
