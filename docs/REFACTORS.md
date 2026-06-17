# Recommended Refactors — Verza TV

Changes deferred for human review and approval. None of these are urgent; the app works as-is. Each item includes a rationale and rough scope.

---

## Component Organization

**Move components into domain folders:**

```
components/player/    -- VideoPlayer, PlayerControls, etc.
components/shop/      -- ProductCard, CartDrawer, etc.
components/series/    -- SeriesCard, EpisodeList, etc.
```

Currently all components live flat under `components/`. Domain folders improve discoverability as the component count grows.

**Scope:** rename imports across the app. No logic changes.

## Lib Domain Folders

**Move Mux files into `lib/mux/`:**

```
lib/mux/index.ts       -- signed URL generation (currently lib/mux.ts)
lib/mux/playback.ts    -- playback helpers (currently lib/mux-playback.ts)
lib/mux/map.ts         -- asset mapping (currently lib/mux-map.ts)
```

Groups related video infrastructure in one place.

**Scope:** rename imports. No logic changes.

## Consolidate Mux Utilities

`lib/mux.ts` and `lib/mux-playback.ts` likely contain overlapping logic. Audit both files and merge into a single module (or two clearly delineated modules within `lib/mux/`).

**Scope:** small. Compare the two files and deduplicate.

## Remove Orphan SVGs from public/

The following files in `public/` appear to be Next.js starter boilerplate, not used anywhere in the app:

- `public/file.svg`
- `public/globe.svg`
- `public/next.svg`
- `public/vercel.svg`
- `public/window.svg`

**Action:** Grep for references before deleting. If unreferenced, remove them.

## Verify Component Usage

Check whether the following components are still imported anywhere:

- `components/ChannelRow.tsx`
- `components/HeroCarousel.tsx`

If unused, they can be removed or archived.

## Audit Seed Migration

`supabase/migrations/002_seed.sql` may contain duplicate or orphan seed data. Review against the current catalog in `lib/catalog.ts` and `lib/series-detail.ts`.

## Consider src/ Directory Structure

Next.js supports both root-level and `src/` directory layouts. Moving to `src/` would cleanly separate application code from config files at the root:

```
src/app/
src/components/
src/lib/
```

**Scope:** large. Every import path changes. Only worth doing if the team prefers it.

## Split lib/mux-map.ts

At 393KB, `lib/mux-map.ts` is the largest source file in the repo. Consider:

- Splitting by series (one file per series or group of series)
- Lazy loading the map at runtime instead of bundling it all
- Moving the data to a JSON file and importing it

This would improve editor performance and reduce initial bundle size.
