# Verza TV -- Codebase Audit

Last updated: 2026-06-17

This document tracks potential orphans, duplicates, and structural notes
discovered during codebase review. Items should be resolved or promoted to
issues and then removed from this list.

---

## Potential Orphan Files

### `public/` default Next.js assets (unused)

The following SVGs ship with every `create-next-app` scaffold and are not
referenced anywhere in the Verza TV codebase:

- `public/file.svg`
- `public/globe.svg`
- `public/next.svg`
- `public/vercel.svg`
- `public/window.svg`

**Action:** Safe to delete. They add unnecessary weight to deployments.

---

## Possible Duplicates / Overlap

### `lib/mux.ts` vs `lib/mux-playback.ts`

Both files deal with Mux video integration. Review whether they serve distinct
purposes (e.g., server-side token signing vs client-side playback config) or if
one can be consolidated into the other.

- `lib/mux.ts` -- likely the general Mux client / helpers
- `lib/mux-playback.ts` -- likely playback-specific logic (signed URLs, tokens)

**Action:** Audit imports across the codebase. If responsibilities overlap,
merge into a single module or clearly document the boundary.

---

## Components To Verify

### `components/ChannelRow.tsx`

Check whether this component is imported and rendered anywhere. If it was
replaced by another pattern (e.g., `BrowsePage.tsx` sections), it may be an
orphan.

**Action:** Search for imports. Remove if unused.

### `components/HeroCarousel.tsx`

May have been superseded by the hero section inside `BrowsePage.tsx`. Confirm
whether `HeroCarousel` is still mounted on any page or if `BrowsePage` now
handles all hero rendering.

**Action:** Search for imports. If only `BrowsePage` renders the hero, remove
`HeroCarousel` or re-export it from `BrowsePage` to keep a single source.

---

## Migration Files

### `supabase/migrations/002_seed.sql`

This file sits alongside `002_content_tables.sql` (same numeric prefix). Check:

1. Is it a duplicate of seed data that already lives elsewhere (e.g., in
   `lib/catalog.ts` or `lib/series-detail.ts`)?
2. Is it meant to be run independently, or was it a one-time backfill that
   should be removed from the migrations folder?
3. The shared `002` prefix may cause ordering ambiguity with some migration
   runners.

**Action:** Clarify purpose. If it is seed-only data, move it to
`supabase/seed.sql` (the Supabase convention) or a `scripts/` file.

---

## Re-export Notes

### `lib/schemas.ts` re-exports from `lib/seo/schema.ts`

`lib/schemas.ts` now acts as a thin re-export barrel for `lib/seo/schema.ts`.
This keeps backward compatibility for any file that imports from `lib/schemas`
while the canonical implementation lives in `lib/seo/schema.ts`.

- Canonical location: `lib/seo/schema.ts`
- Re-export shim: `lib/schemas.ts`

**Action:** No immediate change needed. Over time, migrate all imports to
`@/lib/seo/schema` directly and then remove the shim.

---

## File Tree Reference

```
app/
  about/page.tsx
  api/                          (14 route handlers)
  channels/page.tsx
  discover/page.tsx
  discover/[genre]/page.tsx
  genre/[genre]/page.tsx
  globals.css
  help/page.tsx
  layout.tsx
  llms.txt/route.ts
  me/page.tsx
  me/list/page.tsx
  not-found.tsx
  page.tsx
  press/page.tsx
  privacy/page.tsx
  refund-policy/page.tsx
  robots.txt/route.ts
  search/page.tsx
  series/[slug]/page.tsx
  series/[slug]/[episode]/page.tsx
  shop/page.tsx
  shop/[slug]/page.tsx
  shorts/page.tsx
  sign-in/page.tsx
  sign-up/page.tsx
  sitemap.xml/route.ts
  sitemaps/                     (4 xml routes)
  studio/page.tsx
  terms/page.tsx
  favicon.ico

components/
  AddToCartButton.tsx  BottomNav.tsx       BrowsePage.tsx    CartButton.tsx
  CartDrawer.tsx       CategoryTabs.tsx    ChannelRow.tsx    CoinPaywall.tsx
  FeedSearch.tsx       Footer.tsx          Header.tsx        HeroCarousel.tsx
  ImageCarousel.tsx    JsonLd.tsx          Player.tsx        PosterSkeleton.tsx
  SearchBar.tsx        SeriesCard.tsx      ShortsFeed.tsx

lib/
  auth.ts  cart.tsx  catalog.ts  coins.ts  config.ts  env.ts
  mux-map.ts  mux-playback.ts  mux.ts  products.ts  schemas.ts
  series-detail.ts  theme.ts
  content/   (7 files)
  seo/       (2 files)
  supabase/  (3 files)

public/
  posters/   (76 PNGs)
  shop/      (16 PNGs)
  og-image.png  logo.png  apple-touch-icon.png  apple-touch-icon-180.png
  favicon.ico  file.svg  globe.svg  next.svg  vercel.svg  window.svg

scripts/attach-transcript.ts
supabase/migrations/ (001_schema.sql, 002_content_tables.sql, 002_seed.sql)
docs/seo.md
```
