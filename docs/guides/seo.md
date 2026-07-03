# Verza TV — SEO & Content Infrastructure

## Content Source
The app reads content from a pluggable adapter (`lib/content/source.ts`).

- **Current**: `CONTENT_SOURCE=code` (default) — reads from `lib/catalog.ts`, `lib/series-detail.ts`, `lib/mux-map.ts`
- **Future**: `CONTENT_SOURCE=supabase` — reads from Supabase content tables

### How to flip to Supabase
1. Set `CONTENT_SOURCE=supabase` in `.env.local`
2. Apply migrations: `supabase db push` (runs `supabase/migrations/002_content_tables.sql`)
3. Backfill shows + episodes from the code catalog
4. Verify: all pages render, sitemap includes correct URLs

## Metadata Rules
- Every page uses builders from `lib/seo/metadata.ts`
- Builders: `buildHomeMetadata()`, `buildShowMetadata(show)`, `buildEpisodeMetadata(show, ep)`, `buildGenreMetadata(genre)`, `buildArticleMetadata(article)`
- All canonicals are absolute on `https://verzatv.com`
- Non-indexable entities get `robots: { index: false, follow: true }`

## JSON-LD Rules
- Builders in `lib/seo/schema.ts`
- One `<script type="application/ld+json">` per entity per page (never duplicate)
- Types: Organization, WebSite, MobileApplication, TVSeries, TVEpisode+VideoObject, BreadcrumbList, ItemList, FAQPage, Article

## Indexability Gates (`lib/content/indexability.ts`)
- Show is indexable if: slug + title + synopsis + posterUrl + episodeCount > 0
- Episode is indexable if: show is indexable + episode has title + muxPlaybackId
- Transcript is NOT required (60-90s micro-dramas)
- Gates used in BOTH page metadata AND sitemap inclusion

## Sitemap Structure
- `/sitemap.xml` — sitemap index
- `/sitemaps/shows.xml` — all indexable live series
- `/sitemaps/episodes.xml` — all indexable episodes
- `/sitemaps/genres.xml` — genre/category landing pages
- `/sitemaps/pages.xml` — static pages

## Transcript Pipeline
- `lib/content/transcripts.ts` — stub, validates input, logs
- CLI: `npx tsx scripts/attach-transcript.ts <slug> <ep> <file>`
- No batch automation yet — just the seam for future use
