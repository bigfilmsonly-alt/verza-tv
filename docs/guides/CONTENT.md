# Content System

How the Verza TV content catalog works, from data source to rendering.

---

## Current State

- **76 live series** + 1 coming soon in `lib/catalog.ts`
- Rich detail (descriptions, cast, tags, ratings) for all 77 in `lib/series-detail.ts`
- ~4,100 episodes mapped to Mux playback IDs in `lib/mux-map.ts`
- 10 merchandise products in `lib/products.ts`

All content is served from code. No database reads required for catalog data.

---

## Content Adapter Architecture

The app uses a pluggable content source pattern so the catalog can be swapped from code to Supabase without changing any consuming components.

### Interface

Defined in `lib/content/source.ts`:

```ts
interface ContentSource {
  listShows(filter?: { category?: string; limit?: number }): Show[];
  getShow(slug: string): Show | undefined;
  listEpisodes(showSlug: string): Episode[];
  getEpisode(showSlug: string, n: number): Episode | undefined;
  listArticles(): Article[];
  getArticle(slug: string): Article | undefined;
  getInternalLinks(slug: string): { targetSlug: string; anchorText: string }[];
}
```

### Switching sources

Controlled by the `CONTENT_SOURCE` env var in `.env.local`:

| Value | Source | File | Status |
|-------|--------|------|--------|
| `code` (default) | TypeScript files | `lib/content/code-source.ts` | Active |
| `supabase` | Supabase tables | `lib/content/supabase-source.ts` | Scaffolded, not implemented |

The factory in `lib/content/index.ts` selects the source at startup:

```ts
const type = process.env.CONTENT_SOURCE || "code";
// "code"     -> createCodeContentSource()
// "supabase" -> createSupabaseContentSource()  // throws until implemented
```

All consuming code imports from `lib/content/index.ts`:
```ts
import { content } from "@/lib/content";
const show = content.getShow("the-blackthornes");
```

### Code source adapter (`lib/content/code-source.ts`)

The active adapter that reads from the three TypeScript data files:

1. **Series data** from `lib/catalog.ts` -- adapted to `Show` schema
2. **Rich detail** from `lib/series-detail.ts` -- merged into descriptions, cast, tags
3. **Mux playback IDs** from `lib/mux-map.ts` -- mapped into episode `muxPlaybackId`

The adapter converts between the legacy `Series`/`Episode` types and the canonical `Show`/`Episode` Zod schemas from `lib/content/schemas.ts`.

### To flip to Supabase

1. Set `CONTENT_SOURCE=supabase` in `.env.local`
2. Apply migrations: `supabase db push` (runs `002_content_tables.sql`)
3. Backfill shows + episodes from the code catalog
4. Implement `createSupabaseContentSource()` in `lib/content/supabase-source.ts`
5. Verify all pages render and the sitemap includes correct URLs

---

## How to Add a New Series

### Step 1: Add to catalog

In `lib/catalog.ts`, add a new entry to the `catalog` array:

```ts
{
  slug: "my-new-series",
  title: "My New Series",
  logline: "A one-line hook for the series.",
  genre: "Romance . Thriller",
  channel: "Verza Originals",
  categories: ["drama"],        // which browse tabs it appears in
  episodeCount: 55,
  posterUrl: "/posters/my-new-series.png",
  freeEpisodes: 5,
  coinPerEpisode: 49,
  seasonPassCoins: sp(55),      // use the sp() helper for discounted pass
  status: "live",
},
```

### Step 2: Add rich detail

In `lib/series-detail.ts`, add a keyed entry to `SERIES_DETAIL`:

```ts
"my-new-series": {
  description: "Multi-sentence synopsis...",
  cast: ["Actor One", "Actor Two", "Actor Three"],
  tags: ["romance", "thriller", "billionaire"],
  rating: 8.7,
  year: 2025,
  posterMood: "noir",     // one of the PosterMood values
},
```

### Step 3: Add poster image

Place the poster image at `public/posters/my-new-series.png`. The filename must match the slug.

### Step 4: Add Mux video mapping (if episodes are uploaded)

In `lib/mux-map.ts`, add an entry to `MUX_MAP`:

```ts
"my-new-series": [
  { episode: 1, playbackId: "abc123...", duration: 68 },
  { episode: 2, playbackId: "def456...", duration: 72 },
  // ... one entry per episode
],
```

---

## Browse Categories

Series appear in browse tabs based on their `categories` array. A series can appear in multiple tabs.

| Category | Description |
|----------|-------------|
| `drama` | Primary drama catalog |
| `new` | Recently added series |
| `popular` | Top-ranked series (sorted by `popularRank`) |
| `music` | Music-related content (tab exists, no series yet) |
| `reality` | Reality/unscripted style dramas |
| `red-carpet` | Red carpet / celebrity content (tab exists, no series yet) |

The `BROWSE_TABS` constant defines the tab order and display labels.

---

## Season Pass Pricing

The `sp()` helper calculates the discounted season pass price:

```ts
function sp(eps: number) {
  return Math.round((eps - 5) * 49 * 0.67);
}
```

This means: (total episodes - 5 free) * 49 coins * 0.67 discount = season pass coins.

For a 55-episode series: `(55 - 5) * 49 * 0.67 = 1,642 coins` (vs. 2,450 coins buying individually).

---

## Episode Generation

Episodes are generated deterministically at runtime by `getEpisodesForSeries()`. There is no episode-level data stored in the catalog -- only the `episodeCount` per series.

- Episode titles: "Episode N"
- Duration: Deterministic hash-based, 60-120 seconds
- Free gate: Episodes 1-5 are always free
- Paid episodes: 49 coins each

Actual durations come from Mux via `mux-map.ts` when available, overriding the hash-based fallback.

---

## Mux Mapping

`lib/mux-map.ts` maps `slug + episode number` to a Mux playback ID. This is the bridge between the content catalog and the video pipeline.

- **76 series** mapped (every live series)
- **~4,100 total episodes** with real playback IDs
- Used by the code content adapter to populate `muxPlaybackId` on Episode objects
- Used directly by the Player and ShortsFeed components for thumbnail URLs
