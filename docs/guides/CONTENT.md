# Content system

Last reconciled: **2026-08-03**.

Catalog truth is code-backed. Supabase stores user/access/financial data, but it
is not the active source for the editorial catalog.

## Current inventory

| Classification | Titles |
| --- | ---: |
| Total catalog rows | 80 |
| Live | 79 |
| Paid live | 74 |
| Wholly free live | 5 |
| Coming soon | 1 |

The complete Mux mapping has 4,262 logical episode rows. Of the 4,212 rows that
belong to live titles, 459 are intentionally public/free and 3,753 are paid.
All 50 coming-soon capabilities are also withheld, for 3,803 withheld client
capabilities total. Every paid-live row has a server-only signed counterpart.

Merchandise and Amazon catalogs are separate commerce data. Official
merchandise Checkout is disabled; Amazon is web/retained Android only and
fail-closed in iOS 2.0.

## Sources and projections

| File | Authority / exposure |
| --- | --- |
| `lib/catalog.ts` | Canonical 80-title editorial/product classification |
| `lib/series-detail.ts` | Rich descriptions, cast, tags, ratings, and year |
| `lib/mux-map.ts` | Complete legacy-capability audit/data-sync anchor; never a client-runtime import |
| `lib/mux-public-map.ts` | Generated client-safe projection; only 459 playback IDs remain present |
| `lib/mux-private-map.ts` | `server-only` backend gateway to the complete map |
| `lib/mux-signed-map.ts` | `server-only` paid public-to-signed correspondence for 3,753 rows |
| `lib/content/code-source.ts` | Active adapter for crawlable content; imports only the public projection |

The sibling native repository copies designated content modules byte-identically
under its `src/lib/` tree. It excludes the complete map from EAS archives and
imports only the public projection at runtime. Do not hand-edit a native copy;
follow native `docs/DATA-SYNC.md`.

## Content adapter

`lib/content/source.ts` defines the adapter contract:

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

`CONTENT_SOURCE=code` (or unset) selects `lib/content/code-source.ts`. That
adapter filters lists to live titles, merges rich metadata, and puts a durable
Mux ID into SEO/content data only when the canonical episode is free. Paid and
coming-soon content cannot leak a playback ID through JSON-LD or sitemaps.

The Supabase content adapter remains a scaffold. Do not set
`CONTENT_SOURCE=supabase` in production until its implementation, backfill,
authorization, indexability, and cross-repo sync have a separate release plan.

## Free and paid classification

`freeEpisodes` on each title is the canonical preview boundary. Five titles are
wholly free. Never hard-code “the first five episodes are free” in logic, SEO,
legal copy, metadata, or native UI.

The active paid product is a one-time $1.99 full-series unlock, determined by
`lib/series-purchase.ts`. A sellable row must exist, be live, contain paid
episodes, and satisfy the canonical server offer. Dormant `coinPerEpisode`,
`seasonPassCoins`, `COIN_PACKS`, and `sp()` values are legacy/future product
data. Coin purchase/balance/season-pass routes fail closed; those fields are not
permission to expose or sell coins.

## Adding or changing a title

Treat catalog work as a capability/security change, not just editorial copy:

1. Update `lib/catalog.ts` and, when applicable, `lib/series-detail.ts`.
2. Verify status, episode count, `freeEpisodes`, paid/free product
   classification, poster path, categories, and indexability.
3. Add/verify the complete Mux rows in `lib/mux-map.ts`. Never place a signed ID
   there and never invent a mapping.
4. Run the shared AST parser/generator. Regex parsing is forbidden: an earlier
   regex skipped two comment-prefixed slugs and misclassified 25 free IDs.
5. Regenerate `lib/mux-public-map.ts`. It must expose IDs only through each
   title's canonical free boundary and withhold every non-live row.
6. For each new paid-live asset, run the guarded add-only signed-ID operation,
   re-audit live Mux, and regenerate `lib/mux-signed-map.ts` atomically.
7. Recopy designated data into native byte-identically and run both repos'
   security/count gates.
8. Test web lists, search, genre, series, episode, JSON-LD, sitemaps, Mux
   authorization, and entitlement behavior.
9. Test iOS live-only Discover/Search/genre filtering and direct non-live
   series/episode redirects before data/auth/Mux work.
10. Deploy the backend and verify production before building a native release
    that depends on the new data.

Relevant commands:

```bash
npm run mux:public:audit
npm run mux:signed:self-test
npm run mux:signed:audit
npm run test:playback-security
npx tsc --noEmit
npm run lint
npm run build
```

Use `npm run mux:public:generate` only when intentionally updating the generated
projection. Use the signed migration's write mode only for an audit-confirmed
missing paid-live counterpart; all 3,753 current paid-live rows are already
covered. No routine content command retires a legacy public ID.

## Browse and route behavior

`BROWSE_TABS` defines the web order: Drama, Hot, Tubi, Anime, Español,
Bollywood, Creators, Reality, Red Carpet, and Music. A live title may appear in
multiple catalog categories, with these deliberate presentation rules:

| Key / tab | Current web behavior |
| --- | --- |
| `drama` | Primary drama grid; dedicated Reality and Red Carpet titles are excluded |
| `popular` / Hot | Renders the ranked popular set plus titles categorized as `new`; New has no separate tab but still drives its badge |
| `tubi` | Authorized-partner surface using `public/tubi-logo.png` and the Tubi hero assets; it links to `tubitv.com` and does not embed or represent Tubi playback as Verza content |
| `anime`, `espanol`, `bollywood` | Coming Soon placeholders until releasable catalog titles exist |
| `creators` | Web profit-sharing beta/lead surface; it does not make creator ingestion or PPV available |
| `reality` | Storage Pirates is web Reality-only and is excluded from the Drama grid |
| `red-carpet`, `music` | Dedicated catalog/presentation surfaces |

Tubi rejects ordinary framing through its browser security policy; a different
embed or native surface would require specific partner, platform, and release
review. Do not infer permission for the iOS 2.0 binary from the web
click-through.

Web and eligible Android surfaces can render their supported catalog
experience. Native iOS applies stricter reader-mode predicates without
hand-editing shared data:

- Discover, Search/All Series, and genres refilter to live, reader-visible
  titles;
- direct non-live or reader-excluded series/episode links redirect before
  catalog, auth, episode, or Mux work;
- web-only Tubi, creator, affiliate, and promotional behavior does not cross
  into the iOS release; and
- payment-bearing non-core editorial routes redirect before consuming Tier-1
  data.

Do not render a coming-soon title as `0 episodes`, “All Episodes FREE,” or a
fake “Watch Episode 1 Free” action on any platform.

## Mux data safety

Public preview IDs may be used for free HLS playback and thumbnails. Paid IDs
must never appear in HTML, RSC payloads, browser/Expo/Hermes bundles, EAS
archives, SEO, sitemaps, share metadata, analytics, logs, navigation state, or
persistent storage. Paid playback is obtained only from the server authorization
route after entitlement/VIP verification.

See [`MUX.md`](MUX.md) for token, cache, migration, coexistence, and incident
rules and [`PAYMENTS.md`](PAYMENTS.md) for canonical offer/access behavior.
