# Genre hubs and language separation — web + native

**Date:** 2026-09-07

## 1. Product rule

A title that owns a dedicated tab does not appear in a **generic** genre hub.
A free-text genre word must not override tab exclusivity.

- Español titles belong in Español.
- Bollywood/Hindi titles belong in Bollywood.
- **Global search is exempt** and stays global; it discloses language instead.

## 2. Root cause

Genre hubs match on the free-text `genre` string, not on `categories`:

```ts
catalog.filter((s) => s.genre.toLowerCase().includes(genre.toLowerCase()))
```

So `"Drama · Pasión"` (Spanish) matched `/discover/drama` on the word *Drama*,
and `"Romance · Comedy"` (Hindi) matched `/discover/romance` and
`/discover/comedy`. The browse tabs had already been separated; the genre hubs
are a second, older path into the same catalogue and never received the rule.

**Both platforms had identical logic**, so this was never a web/native parity
gap — it was one shared defect in two places.

## 3. Routes affected

Three route families **per platform**, all now fixed:

| Family | Web | Native |
|---|---|---|
| `/discover/[genre]` | `app/discover/[genre]/page.tsx` | `src/app/discover/[genre].tsx` |
| `/genres/[slug]` | `app/genres/[slug]/page.tsx` | `src/app/genres/[slug].tsx` |
| `/genre/[genre]` | `app/genre/[genre]/page.tsx` | `src/app/genre/[genre].tsx` |

## 4. Before → after (measured through the real catalog modules, not regex)

`/discover/[genre]` — identical on both platforms:

| route | before | after | Spanish after | Hindi after |
|---|---:|---:|---:|---:|
| drama | 32 | **25** | 0 | 0 |
| romance | 46 | **37** | 0 | 0 |
| thriller | 18 | **17** | 0 | 0 |
| comedy | 6 | **3** | 0 | 0 |
| reality | 3 | **1** | 0 | 0 |
| mystery | 7 | 7 | 0 | 0 |
| crime | 3 | 3 | 0 | 0 |
| music | 1 | 1 | 0 | 0 |
| sci-fi | 1 | 1 | 0 | 0 |

`/genres/[slug]`: **22 of 27 hubs leaked; now 0.** Worst was `/genres/romance`
at 69 titles including 5 Spanish and 6 Hindi.

**Total non-English titles in generic genre hubs: 11 → 0 on both platforms.**

### What was removed, and why it is more than language

Every drop is a title that owns a dedicated tab:

- `/discover/drama` lost 4 Spanish, 2 Hindi, **and `too-much-junk`** (Music tab).
- `/discover/comedy` lost 2 Hindi **and `storage-pirates`** (Reality tab).
- `/discover/reality` lost **`exes-premiere` and `love-awards`** (Red Carpet
  tab), whose genre reads `"Red Carpet · Reality"`.

This is broader than language alone. It is the same rule the Drama grid already
applies via `TAB_EXCLUSIVE_CATEGORIES`, extended to the hubs — consistent
rather than novel, and flagged here because it changes three non-language
routes.

## 5. Implementation

One helper per repo, logically identical:

- `lib/genre-hub.ts` (web) / `src/lib/genre-hub.ts` (native)

```ts
export function isGenreHubEligible(series: Series, hubSlug: string): boolean {
  const own = hubSlug.toLowerCase() as BrowseCategory;
  return !TAB_EXCLUSIVE_CATEGORIES.some(
    (category) => category !== own && series.categories.includes(category),
  );
}
```

Two properties worth naming:

1. **Derived from `TAB_EXCLUSIVE_CATEGORIES`, never a slug list.** The category
   *is* the tab, so a future language tab is covered the day it is added.
2. **A hub never excludes its own category** — `category !== own`. Without this
   the exclusion eats the hub: `/discover/reality` would drop Storage Pirates
   and render empty. Verified: it still lists it.

Applied at the **pool** level in `/genres/[slug]` so both the strict tag match
and the broad keyword fallback inherit it.

## 6. Search — global, and now labelled

Search is deliberately **not** filtered. Someone typing a title's name must
find it whatever language it is in; hiding it would be a bug, not a policy.

Verified untouched: `src/app/search.tsx` contains zero references to
`forGenreHub`.

The trade is disclosure. Both platforms now show the audio language on
non-English search results:

- Web: `components/SearchButton.tsx` renders `<AudioLanguageBadge compact />`
- Native: `src/app/search.tsx` renders the same chip as the browse tile

English results render nothing — 80 redundant chips would be noise.

## 7. Related / recommended

**Classified: SAFE BUT UNLABELED → now labelled where it matters.**

There is no separate ML recommender. "Related" surfaces are the genre hubs and
the browse grids, both of which now apply the rule, so an English title can no
longer lead to an unlabelled Spanish or Hindi one through generic browsing.
Where cross-language discovery survives — global search, and the language tabs
themselves — the language chip is present.

No cross-language recommendation was removed on the strength of language alone.

## 8. Web / native parity

Identical after-counts, verified by running both catalog modules:

```
drama:25 romance:37 thriller:17 comedy:3 mystery:7 reality:1 music:1 crime:3 sci-fi:1
```

## 9. Remaining exceptions

- **`/discover/espanol` and `/discover/bollywood` render 0 titles.** Pre-existing
  and unrelated: no title's genre *string* contains the word "espanol", so these
  hubs never matched their own titles. They are SEO shells, like
  `/discover/popular`. This change does not worsen it, and the helper would do
  the right thing if they ever matched by category. **Worth a separate
  decision** — they are indexed and sitemapped.
- Native applies `isIosReaderSeriesVisible` in addition, so iOS counts can be
  lower than web's by App Store policy. That is intentional, not drift.

## 10. Device QA

- `/discover/drama` on iOS shows no Spanish or Hindi titles.
- `/discover/reality` still lists Storage Pirates.
- Searching "amante" or "flatmate" still returns the title, with a language chip.
- The chip does not collide with the New/Trending badge (top-left vs bottom-left).
