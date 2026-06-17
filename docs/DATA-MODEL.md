# Data Model

All data types and tables used across the Verza TV platform.

---

## 1. Code-Based Content (Live Now)

These TypeScript types power the current production content. No database required.

### `lib/catalog.ts` -- Series

The primary catalog of all shows on the platform.

```ts
interface Series {
  slug: string;              // URL-safe identifier, e.g. "the-blackthornes"
  title: string;             // Display title
  logline: string;           // One-line hook/description
  genre: string;             // Genre string, e.g. "Romance . Comedy"
  channel: string;           // Channel name, e.g. "Verza Originals"
  categories: BrowseCategory[]; // Placement in browse tabs
  popularRank?: number;      // Rank within Popular tab (1-9)
  episodeCount: number;      // Total episodes (0 = coming soon)
  posterUrl: string;         // Path to poster image in /public/posters/
  freeEpisodes: number;      // Number of free episodes (always 5)
  coinPerEpisode: number;    // Cost per paid episode (always 49)
  seasonPassCoins: number;   // Discounted cost for all paid episodes
  status: "live" | "coming_soon";
  // Rich detail fields (merged from series-detail.ts at query time)
  description?: string;
  cast?: string[];
  tags?: string[];
  rating?: number;
  year?: number;
  posterMood?: PosterMood;
}
```

**BrowseCategory**: `"drama" | "new" | "popular" | "music" | "reality" | "red-carpet"`

**PosterMood**: `"ballroom" | "noir" | "rose" | "sunset" | "ice" | "blood" | "emerald" | "violet" | "gold" | "storage"`

**Episode** (generated at runtime via `getEpisodesForSeries()`):
```ts
interface Episode {
  number: number;
  title: string;       // "Episode N"
  isFree: boolean;     // true for episodes 1-5
  unlockCoins: number; // 0 if free, 49 if paid
  durationS: number;   // Deterministic hash-based duration (60-120s)
}
```

**Current count**: 76 live series + 1 coming soon = 77 total entries.

**Helper functions**: `getLiveSeries()`, `getComingSoonSeries()`, `getSeriesByCategory()`, `getSeriesByChannel()`, `getSeriesBySlug()`, `getSeriesWithDetail()`, `getSeriesByGenre()`, `getChannels()`, `getEpisodesForSeries()`, `getEpisode()`, `formatDuration()`.

### `lib/series-detail.ts` -- SeriesDetail

Rich metadata per series, keyed by slug. Merged into Series at query time via `getSeriesWithDetail()`.

```ts
interface SeriesDetail {
  description: string;    // Multi-sentence synopsis
  cast: string[];         // Actor names
  tags: string[];         // Searchable tags, e.g. ["billionaire", "enemies-to-lovers"]
  rating: number;         // Rating out of 10 (e.g. 9.2)
  year: number;           // Release year
  posterMood: PosterMood; // Color mood for poster styling
}
```

All 77 series have detail entries in the `SERIES_DETAIL` record.

### `lib/mux-map.ts` -- MuxEpisode

Maps each series slug + episode number to a Mux playback ID for video streaming.

```ts
interface MuxEpisode {
  episode: number;      // Episode number
  playbackId: string;   // Mux playback ID (e.g. "O00Zi004Ru9Y...")
  duration: number;     // Actual duration in seconds from Mux
}
```

**Structure**: `Record<string, MuxEpisode[]>` -- 76 series slugs, ~4,100 total episode mappings.

**Helper functions**: `getPlayback(slug, episode)`, `getRandomPlayback()`.

### `lib/products.ts` -- Product

Merchandise catalog for the shop.

```ts
interface Product {
  id: string;               // e.g. "prod_1"
  slug: string;             // URL slug
  name: string;             // Display name
  price: number;            // Price in dollars
  priceConfirmed: boolean;  // Whether the price has been finalized
  category: ProductCategory;
  images: string[];         // Paths to product images
}
```

**ProductCategory**: `"Apparel" | "Drinkware" | "Accessories" | "Digital" | "Experiences"`

**Current count**: 10 products (4 price-confirmed, 6 pending confirmation).

### `lib/content/schemas.ts` -- Zod Schemas

Validated content schemas used by the content adapter layer. These are the canonical types for the pluggable content system.

| Schema | Key Fields |
|--------|-----------|
| **Show** | `id`, `slug`, `title`, `synopsis`, `genre[]`, `tags[]`, `posterUrl`, `year`, `rating`, `cast: Person[]`, `episodeCount`, `category`, `status`, `indexable`, `createdAt` |
| **Episode** | `id`, `showSlug`, `number`, `title`, `synopsis`, `durationSeconds`, `muxPlaybackId`, `posterUrl`, `isFree`, `unlockCoins`, `transcript?`, `indexable`, `createdAt` |
| **Person** | `id`, `slug`, `name`, `role: "actor" | "creator" | "host"`, `bio?`, `photoUrl?` |
| **Season** | `id`, `showSlug`, `number`, `episodeCount` |
| **Article** | `id`, `slug`, `title`, `body`, `showSlugs[]`, `tags[]`, `publishedAt`, `indexable` |

Parse helpers: `parseShow()`, `parseEpisode()`, `parsePerson()`, `parseArticle()`.

### `lib/config.ts` -- Constants

```ts
FREE_EPISODES = 5;
DEFAULT_COIN_PER_EPISODE = 49;
VIP_WEEKLY = 1999;   // cents
VIP_YEARLY = 19900;  // cents
```

Coin packs: Starter (100 coins/$1.99), Fan (300/$4.99), Binge (700/$9.99), Super (1500/$19.99), Mega (3500/$49.99).

---

## 2. Supabase Tables -- Live (001_schema.sql)

User-facing tables with Row-Level Security. All active in production.

### `profiles`
Extends Supabase `auth.users`. One row per authenticated user.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | References `auth.users(id)`, cascade delete |
| `display_name` | text | |
| `avatar_url` | text | |
| `coin_balance` | integer | Default 0 |
| `is_vip` | boolean | Default false |
| `vip_expires_at` | timestamptz | |
| `streak_days` | integer | Daily login streak |
| `streak_last_date` | date | |
| `language` | text | Default 'en' |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

**RLS**: Users can read and update their own profile only.

### `coin_ledger`
Immutable append-only ledger of all coin transactions.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `user_id` | uuid FK | References profiles |
| `amount` | integer | Positive = credit, negative = debit |
| `reason` | text | One of: `purchase`, `unlock`, `season_pass`, `ad`, `daily`, `refund`, `admin` |
| `reference_id` | text | Stripe payment ID, episode slug, etc. |
| `balance_after` | integer | Running balance after transaction |
| `created_at` | timestamptz | |

**RLS**: Users can read their own ledger only.

### `entitlements`
Tracks which episodes a user has unlocked.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `user_id` | uuid FK | References profiles |
| `series_slug` | text | |
| `episode_number` | integer | Null = season pass (all episodes) |
| `granted_at` | timestamptz | |

**Unique constraint**: `(user_id, series_slug, episode_number)`.
**RLS**: Users can read their own entitlements only.

### `purchases`
Stripe/IAP payment receipts.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `user_id` | uuid FK | References profiles |
| `provider` | text | `stripe`, `apple`, or `google` |
| `provider_id` | text | Unique -- Stripe payment intent, Apple receipt, etc. |
| `product_type` | text | `coin_pack`, `season_pass`, `vip`, or `merch` |
| `product_id` | text | |
| `amount_cents` | integer | |
| `currency` | text | Default 'usd' |
| `status` | text | `pending`, `completed`, `refunded`, or `failed` |
| `created_at` | timestamptz | |

**RLS**: Users can read their own purchases only.

### `watch_progress`
Continue-watching state per user per episode.

| Column | Type | Notes |
|--------|------|-------|
| `user_id` | uuid FK | PK part 1 |
| `series_slug` | text | PK part 2 |
| `episode_number` | integer | PK part 3 |
| `progress_seconds` | integer | Default 0 |
| `completed` | boolean | Default false |
| `updated_at` | timestamptz | |

**PK**: `(user_id, series_slug, episode_number)`.
**RLS**: Users can CRUD their own watch progress.

### `my_list`
Saved/bookmarked shows per user.

| Column | Type | Notes |
|--------|------|-------|
| `user_id` | uuid FK | PK part 1 |
| `series_slug` | text | PK part 2 |
| `added_at` | timestamptz | |

**RLS**: Users can CRUD their own list.

### `channels`
Channel metadata (e.g. "Verza Originals").

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `slug` | text | Unique |
| `name` | text | |
| `description` | text | |
| `avatar_url` | text | |
| `banner_url` | text | |
| `subscriber_count` | integer | Default 0 |
| `created_at` | timestamptz | |

### `tickets`
Support tickets from users.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `user_id` | uuid FK | Nullable, set null on user delete |
| `email` | text | |
| `subject` | text | |
| `body` | text | |
| `status` | text | `open`, `in_progress`, `resolved`, or `closed` |
| `created_at` | timestamptz | |

**RLS**: Users can create tickets and read their own.

### Indexes (001)
- `idx_coin_ledger_user` -- `coin_ledger(user_id, created_at DESC)`
- `idx_entitlements_user` -- `entitlements(user_id, series_slug)`
- `idx_watch_progress_user` -- `watch_progress(user_id, updated_at DESC)`
- `idx_my_list_user` -- `my_list(user_id, added_at DESC)`

---

## 3. Supabase Content Tables -- Scaffolded, Not Yet Active (002_content_tables.sql)

These tables mirror the code-based content types and will replace them when `CONTENT_SOURCE=supabase` is activated. They are additive and do not modify live tables.

### `shows`
Mirrors `lib/catalog.ts` + `lib/series-detail.ts`.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `slug` | text | Unique |
| `title` | text | |
| `synopsis` | text | Default '' |
| `genre` | text[] | Array |
| `tags` | text[] | Array |
| `poster_url` | text | |
| `year` | integer | Default 2025 |
| `rating` | numeric(3,1) | Default 0 |
| `episode_count` | integer | Default 0 |
| `category` | text | Check: drama, new, popular, reality, music, red-carpet |
| `status` | text | Check: live, coming_soon |
| `indexable` | boolean | Default true |
| `created_at` | timestamptz | |

**RLS**: Public read access.

### `seasons`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `show_slug` | text FK | References shows(slug), cascade delete |
| `number` | integer | Default 1 |
| `episode_count` | integer | Default 0 |

**Unique constraint**: `(show_slug, number)`.

### `episodes_content`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `show_slug` | text FK | References shows(slug), cascade delete |
| `number` | integer | |
| `title` | text | |
| `synopsis` | text | |
| `duration_seconds` | integer | |
| `mux_playback_id` | text | |
| `poster_url` | text | |
| `is_free` | boolean | Default false |
| `unlock_coins` | integer | Default 49 |
| `transcript` | text | Nullable |
| `indexable` | boolean | Default true |
| `created_at` | timestamptz | |

**Unique constraint**: `(show_slug, number)`.
**RLS**: Public read access.

### `people`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `slug` | text | Unique |
| `name` | text | |
| `role` | text | Check: actor, creator, host |
| `bio` | text | Nullable |
| `photo_url` | text | Nullable |

**RLS**: Public read access.
**Join table**: `show_people(show_slug, person_id)`.

### `tags`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `name` | text | Unique |

**Join table**: `show_tags(show_slug, tag_id)`.

### `articles`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `slug` | text | Unique |
| `title` | text | |
| `body` | text | |
| `show_slugs` | text[] | Array of related show slugs |
| `tags` | text[] | Array |
| `published_at` | timestamptz | |
| `indexable` | boolean | Default true |

**RLS**: Public read where `indexable = true`.

### `internal_links`
SEO link graph for internal linking between content pages.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `source_slug` | text | |
| `target_slug` | text | |
| `anchor_text` | text | |
| `context` | text | |

### Indexes (002)
- `idx_shows_slug` -- `shows(slug)`
- `idx_shows_category` -- `shows(category)`
- `idx_shows_indexable` -- `shows(indexable)`
- `idx_episodes_show` -- `episodes_content(show_slug, number)`
- `idx_episodes_indexable` -- `episodes_content(indexable)`
- `idx_articles_slug` -- `articles(slug)`
