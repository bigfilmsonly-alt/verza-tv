# SEO and content infrastructure

Last reconciled: **2026-08-03**. This governs web search indexing, not App Store
keyword metadata. Native App Store ASO lives in the native release audit.

## Source and canonical origin

- Code-backed `lib/content/code-source.ts` is production authority.
- It reads `catalog.ts`, `series-detail.ts`, and **only**
  `mux-public-map.ts`.
- `CONTENT_SOURCE=supabase` is a scaffold, not an operational toggle.
- Production canonical URLs use `https://www.verzatv.com`; the apex redirects.
- Preview/non-production deployments are always noindex/nofollow.

Do not flip content source until the adapter, data backfill, RLS, Mux capability
projection, indexability, sitemap parity, native sync, rollback, and production
readback have a separately approved release plan.

## Protected-video rule

The public projection contains 4,262 logical rows but exposes only 459
intentionally public/free playback IDs. It withholds 3,753 paid-live and 50
coming-soon IDs. SEO, JSON-LD, sitemaps, share pages, `llms.txt`, browser
payloads, and metadata may never contain those 3,803 protected capabilities or
an expiring signed URL.

For a paid episode, use title/series/poster metadata without a durable video
content URL. A protected episode must not be made public merely to satisfy a
VideoObject or indexability check.

## Metadata and schema

- Central builders live in `lib/seo/metadata.ts` and `lib/seo/schema.ts`.
- Canonical, title, and description must be unique and user-serving.
- Structured data must describe visible, verified facts—no fake ratings,
  reviews, view counts, release schedules, prices, or availability.
- Series/episode schema and sitemap inclusion must require a live canonical
  title. Durable Mux media URLs are free-preview only.
- Search results remain noindex.
- Marketing keywords belong in natural title/description copy; hidden text and
  stuffing are forbidden.

## Sitemaps

- `/sitemap.xml` — index;
- `/sitemaps/shows.xml` — live/indexable titles;
- `/sitemaps/episodes.xml` — live/indexable episodes, free media URL only;
- `/sitemaps/genres.xml` — approved genre/discovery pages; and
- `/sitemaps/pages.xml` — approved static/editorial pages.

Before deploy, scan generated output for all 3,803 withheld Mux IDs and reject
any match. After deploy, read back the canonical sitemap origin and confirm the
preview origin remains noindex.

## Transcript pipeline

`lib/content/transcripts.ts` and
`npx tsx scripts/attach-transcript.ts <slug> <episode> <file>` provide the
current seam. Human-review rights, privacy, accuracy, originality, and search
quality before indexing. Transcripts must never contain secrets, reviewer
credentials, signed URLs, or protected playback IDs.

See [`seo-governance.md`](seo-governance.md) for quality/sign-off rules and
[`MUX.md`](MUX.md) for capability security.
