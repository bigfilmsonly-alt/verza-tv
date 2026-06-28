# Changelog

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
