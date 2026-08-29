# S4 — SEARCH. The four catalogue-search surfaces (`components/SearchButton.tsx` header popover, `components/SearchBar.tsx` on /discover, `components/FeedSearch.tsx`, `app/search/page.tsx`), the shared matcher (`lib/search-index.ts`, `lib/text-fold.ts`) and the routing helper results depend on (`lib/series-href.ts`): accent folding on both query and index, partial and full titles, Hindi and transliterated titles, empty/short queries, the no-results state, localisation of every search string, and whether results route per the restored rule (91 playable → player, 5 coming-soon → show page). Asserted against the real 96-row catalogue and verified against the deployed bundle and www.verzatv.com.

**Coverage: 485 of 485 items examined.** 18 findings raised.

## Gaps — items in scope this agent could not examine

Six items in or adjacent to scope I could not fully examine, and what each needs.

1. No physical iOS/Android handset. S4-002's *cause* (iOS Smart Punctuation substituting U+2019 in a WKWebView search field) and the keyboard half of S4-010 (focus() on a 100ms timer failing to raise the software keyboard) are inferred from the shipped code plus known platform behaviour. The *effect* in S4-002 is measured and certain — a U+2019 query returns 0 on production — but the share of real queries that carry U+2019 is not. NEEDS: type "The Billionaire's Vow" into the header search on a stock iPhone with default keyboard settings and read the result count; tap the search icon and observe whether the keyboard rises.

2. The native app in ../verza-native was not in this repo and was not examined. If the iOS binary ships its own search screen rather than the web SearchButton in a WebView, none of S4-002, S4-005, S4-009, S4-010 or S4-012 has been verified there. NEEDS: the same 582-query matrix run against the native search module.

3. No screen-reader run. S4-017 is from static attributes only — no VoiceOver or TalkBack pass, so the actual announced experience (whether the placeholder is read as the accessible name, whether the result count is ever spoken) is unverified. NEEDS: a VoiceOver rotor pass over the open overlay.

4. No browser rendering. The ~7,300px figure in S4-005 is computed from the deployed markup (91 rows × a 56px poster inside py-3) rather than screenshotted at 320px. The overflow is certain from the absence of maxHeight/overflow-y in the shipped style object; the exact pixel height is an estimate. NEEDS: /discover at 320px with "an" typed.

5. No analytics console. S4-012's stale counts are proven in the shipped source but I could not read the GA4 / Vercel Analytics `search` event stream to show the wrong numbers landing. NEEDS: one day of the search event stream.

6. No ranking specification exists. S4-004 measures behaviour against what a viewer typing an exact title would expect, not against a documented rule, because there is no documented rule. NEEDS: a decision on what search should rank first, so a check can be written that names the defect it prevents.

Also examined and NOT defective, recorded so it is not re-litigated: accent folding is correct and genuinely deployed in both directions on all six non-ASCII titles and both spellings of the category key (/search?q=pasion and ?q=pasión both return sentence-of-passion-es; ?q=espanol and ?q=español both return the same 5 rows; cunado/cuñado, engane/engañé, enamore/enamoré, mansion/mansión all agree), and the client bundle carries the same folder as the server, not an older matcher. All 91 live titles are findable by their full title, by their first word, first two words, last word, middle word, and by their title minus stopwords — 0 failures across those probes. All 96 catalogue rows route correctly under the restored rule and all 96 destinations return 200 on production (91 → /series/<slug>/1, 5 → /series/<slug>). Reflected-query escaping is sound: script tags, quote-breakouts, a 2,000-character query, emoji and a SQL-shaped string all render as inert text at 200.

---

# S4 — SEARCH · Audit record

**Target:** https://www.verzatv.com (production) and the working tree at `/Users/jothamhall/E! CREATOR ECONOMY/verza-tv`.
**Date:** 2026-08-29. **Gate state at time of audit:** `node scripts/test-feed-integrity.mjs` → **PASS** (walked 4,913 episodes across 91 live series). Every finding below is live with that gate green.

---

## 1. Coverage

| Class in scope | In scope | Examined |
|---|---|---|
| Search surfaces | 4 | 4 |
| Interactive elements inside them (manifest `interactive.items`) | 20 | 20 |
| Catalogue rows resolved through the matcher and fetched at their destination | 96 | 96 |
| `/search` route states (no-query, sub-2-char, populated, no-results, malformed) | 5 | 5 |
| i18n cells for search strings (18 user-visible strings × 20 locales) | 360 | 360 |
| **Total** | **485** | **485** |

**Evidence volume:** 582 distinct query strings evaluated against the real catalogue through the exact shipped modules (loaded with `jiti`, aliases resolved, no fixtures); ~150 HTTP requests to www.verzatv.com; 20 deployed JS chunks downloaded and read.

**Findings:** 18 — 1×S1, 2×S2, 7×S3, 8×S4.

### The 20 interactive elements, one line each

| File:line | Kind | Verdict |
|---|---|---|
| `components/SearchButton.tsx:51` | button | Opens the overlay. Works. **36×36px** → S4-010 |
| `components/SearchButton.tsx:52` | handler | `setOpen(true)`. Works |
| `components/SearchButton.tsx:95` | input | Filters live. Works. No aria-label → S4-017. Per-keystroke tracking → S4-012 |
| `components/SearchButton.tsx:106` | button | Cancel. Works. ~44×20px hit box → S4-010 |
| `components/SearchButton.tsx:123` | link | `posterHref(s)`. Resolves 200 |
| `components/SearchButton.tsx:128` | handler | `setOpen(false)` on navigate. Works |
| `components/SearchBar.tsx:42` | input | Filters live. Works. Unbounded dropdown → S4-005 |
| `components/SearchBar.tsx:65` | link | `posterHref(s)`. Resolves 200 |
| `components/SearchBar.tsx:70` | handler | `setQuery("")`. Works |
| `app/search/page.tsx:60` | link | → `/discover`. **200** |
| `app/search/page.tsx:107` | input | GET form. Works. No `enterKeyHint` → S4-018 |
| `app/search/page.tsx:163` | link | → `/discover` from the no-results state. **200** |
| `app/search/page.tsx:179` | link | `posterHref(series)`. Resolves 200 |
| `components/FeedSearch.tsx:46,47,81,95,96,109,114` | 7 items | **Never rendered — no importer, in no deployed chunk** → S4-011 |

Nothing tappable and inert on the three shipped surfaces. Seven elements are unreachable rather than inert.

---

## 2. What is correct (verified, so it is not re-litigated)

**Accent folding works in both directions and is genuinely deployed — client and server.**

```
/search?q=pasion   → 1 result  /series/sentence-of-passion-es/1
/search?q=pasión   → 1 result  /series/sentence-of-passion-es/1
/search?q=espanol  → 5 results (all five Español rows)
/search?q=español  → 5 results (identical set)
/search?q=cunado   → 1   /search?q=cuñado  → 1
/search?q=engane   → 1   /search?q=engañé  → 1
/search?q=enamore  → 1   /search?q=mansión → 1   /search?q=mansion → 1
```

All 6 non-ASCII titles and every accented word inside them were probed in both spellings — 0 splits. The deployed client chunk `21y4skb0tansy.js` carries the same folder as the repo, so the header popover is not running an older matcher:

```js
function t(e){return e.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").normalize("NFC")}
… [e.title,e.slug.replace(/-/g," "),e.genre,e.logline,e.channel,...e.categories??[],...e.tags??[],...r[e.slug]??[]].join(" ")
… i.split(/\s+/).filter(Boolean).every(e=>n.includes(e))
```

**Title recall is complete.** 91/91 live titles find themselves by full title; 0 failures across first-word, first-two-word, last-word and middle-word probes; 0 failures on title-minus-stopwords. Sequel disambiguation works (`part 2`, `part ii`, `pt. ii`, `season 2`, `s2` each land on exactly the right row). `salt & pepper`, `salt and pepper`, `salt pepper` all find Salt & Pepper.

**The restored rule holds for every row that search can return.** All 96 `posterHref()` outputs match the expected shape (91 → `/series/<slug>/1`, 5 → `/series/<slug>`), and all 96 URLs return **200** on production. Zero live rows have `episodeCount < 1`, so the show-page fallback is never silently taken.

**Reflected-query handling is safe.** `<script>alert(1)</script>`, `"onmouseover=alert(1) x="`, a 2,000-character query, `🔥` and `' OR 1=1--` all render as inert escaped text at 200, with `robots: noindex, follow` and a correct canonical.

---

## 3. Findings

### S4-001 · S1 · `/search?q=a&q=b` returns 500 and a blank page

A repeated `q` makes Next hand `searchParams.q` a `string[]`; `q?.trim()` throws in `generateMetadata` **and** in the page body. There is no error boundary on the route.

```
?q=a&q=b            → 500   (3/3 attempts)
?q=pasion&q=espanol → 500
?q=&q=              → 500
?q=pasion&q=pasion  → 500
?q[]=pasion         → 200
?foo=1&q=pasion     → 200
```

Stripping tags and scripts from the 500 body yields **an empty string** — no headline, no message, no link. `id="__next_error__"`, digests `3143474394` / `142849278`, no stack leaked.

`app/search/page.tsx:13` types it `{ q?: string }`; `:16-17` and `:53-54` both call `.trim()` on it. `find app -name error.tsx` → only `app/series/[slug]/[episode]/error.tsx`. `/search` is in the sitemap at priority 0.7 (`app/sitemaps/pages.xml/route.ts:17`) and is the target of the `SearchAction` in `lib/seo/schema.ts:91`.

### S4-002 · S2 · A typographic apostrophe returns zero results for all 13 apostrophe titles

`foldText()` normalises accents but not punctuation. Every catalogue apostrophe is ASCII `U+0027` (13 rows, one distinct codepoint). A query carrying `U+2019` produces a token that is nowhere in the haystack, and per-token AND kills the whole query.

| Query | Production |
|---|---|
| `The Billionaire's Vow` (U+0027) | **1** → `/series/the-billionaires-vow/1` |
| `The Billionaire’s Vow` (U+2019) | **0** — "No results" |
| `Love’s Perfect Crime` | **0** |
| `I’m Obsessed with My Boss` | **0** |

All 13 measured: 13/13 return 0. iOS Smart Punctuation is on by default. Affects all four surfaces — they share `seriesMatchesQuery`.

Rows affected: The Billionaire's Betrayal · I'm Obsessed with My Boss Part II · Hollywood Star's Fake Girlfriend · In Love with My Godfather's Daughter · Love's Perfect Crime · Mafia Lord's Son… · The Billionaire's Vow · Help! I'm Falling in Love with My Rude CEO · The Billionaire's Lost Love · Billionaire Daughter's Love Triangle · Married to My Brother's Ex · The Chairman's Revenge · The Billionaire's Apron.

### S4-003 · S2 · The 5 coming-soon rows are unreachable from search, and the copy says they do not exist

All three shipped surfaces search a live-only pool.

```
/search?q=The Chairman's Revenge → 0    /series/the-chairmans-revenge          → 200
/search?q=protected by the devil → 0    /series/protected-by-the-devil          → 200
/search?q=the last will          → 0    /series/the-last-will                   → 200
/search?q=apron                  → 0    /series/the-billionaires-apron          → 200
/search?q=jardinero              → 0    /series/i-cant-resist-my-mansion-gardener → 200
```

Against the full catalogue the matcher finds all 5 by exact title, so the exclusion is purely the pool filter: `app/search/page.tsx:44`, `components/SearchButton.tsx:17`, `app/discover/page.tsx:32`.

`lib/series-href.ts:47-62` says the show page is *"the landing page for search traffic"* and that the five rows *"genuinely have a page here… Verified 200 on production for all five."* Search is the one surface that does not honour it. Requirement 5's coming-soon leg is exercised 0 of 5 times from search.

Sharpest illustration: `/search?q=mansión` returns **The Haunted Sisters** — an English gothic drama matched on the SEARCH_TAGS word `mansion` — and not the Spanish title that literally contains *mansión*.

### S4-004 · S3 · No relevance ranking; the exact title can land 9th

Results are emitted in raw catalogue-array order. `lib/search-index.ts:136-143` returns a boolean and every call site is a bare `.filter()`.

`"the ceo"` → 10 results, in this order:
> Collateral Hearts · The Marriage Contract · Married to a Stranger · Cleopatra · Never Mess with a Badass Girl · Help! I'm Falling in Love with My Rude CEO · One Night Stand · The Billionaire's Lost Love · **The CEO** · Billionaire Daughter's Love Triangle

In the header popover's 3-column grid that is the third row. `"killer romance"` puts The Killer Caregiver above Killer Romance.

### S4-005 · S3 · The /discover dropdown is uncapped, unscrollable and ~7,300px tall

| Query | Rows | Approx. overlay height |
|---|---|---|
| `an` / `in` / `er` | **91** | ~7,280px |
| `dr` / `drama` | 83 | ~6,640px |
| `the` | 77 | ~6,160px |
| `love` | 50 | ~4,000px |

`components/SearchBar.tsx:56-63` — `absolute top-full left-0 right-0 mt-2 rounded-xl overflow-hidden z-50`, style carries only `background` and `border`. No `maxHeight`, no `overflow-y-auto`, and `filtered.map` at `:64` has no `.slice()`. Confirmed in the deployed chunk `3--x_pig694c6.js`: `c.map(...)` inside `style:{background:"#12121C",border:"1px solid rgba(255,255,255,0.08)"}`.

SearchButton caps at `calc(100vh - 76px)` with `overflow-y-auto`; FeedSearch caps at `.slice(0, 12)`. Only this one does neither.

### S4-006 · S3 · The entire search experience is hard-coded English in all 20 locales

`lib/i18n.ts` has exactly **115 keys**; grepping the `Translations` interface for search/discover returns only `"nav.discover"`. None of the four surfaces imports the translation hook.

18 distinct user-visible strings × 20 locales = **360 cells, 342 of them rendering English** to a non-English viewer — on the screen you reach by tapping the button immediately to the right of the language switcher.

- SearchButton (5): `aria-label="Search"` · `"Search by show, genre, or keyword..."` · `"Cancel"` · `"{n} result{s} for …"` · `"No results for …"`
- SearchBar (3): `"Search series, genres..."` · `"No results for …"` · `"{genre} · {n} episodes"`
- /search (10): `"Discover"` · `"Search Micro-Dramas"` / `"Results for …"` · `"{n} series found"` · `"Search by title, genre, keyword..."` · `"Search 91+ micro-drama series"` · `"Try "billionaire", "revenge", or "thriller""` · `"No results for …"` · `"Try a different keyword or browse by genre on the Discover page."` · the SEO footer paragraph · the metadata title and description

`scripts/test-feed-integrity.mjs` already carries check 10d for exactly this class of bug on the in-feed paywall. Search has no equivalent.

### S4-007 · S3 · 15 of 91 live rows have no curated tags; Spanish and Hindi vocabulary finds nothing

`SEARCH_TAGS` has 76 keys (0 orphans). Untagged live rows: `im-obsessed-with-my-boss-2`, `storage-pirates`, `exes-premiere`, `love-awards`, and all 11 Español + Bollywood rows. No catalogue row populates its own `tags` array (0 of 96), so `s.tags` contributes nothing anywhere.

```
venganza  → 0     millonario → 0     jefe   → 0     celos    → 0
novela    → 0     telenovela → 0     latino → 0     doblada  → 0
hindi     → 0     india      → 0     indian → 0     shaadi   → 0
ishq      → 0     pyaar      → 0     hindi drama → 0   indian drama → 0
desi      → 4  ← all English dramas, matched inside "Desire"
```

`billionaire` returns 22 rows; `millonario` returns none. Español and Bollywood are revenue tabs.

### S4-008 · S3 · Devanagari queries can never match

Scanning all 96 rows for `[ऀ-ॿ]` across title, genre, logline, tags and categories → **0 rows**. `दिल`, `दोस्ती`, `प्यार`, `बॉलीवुड`, `रीसेट` all return 0, confirmed on production. Transliterations work (`dil`, `dosa`, `dosti`, `dil dosa dosti` → Dil Dosa Dosti).

`lib/text-fold.ts:22-39` is carefully built to leave Devanagari byte-identical, and the gate check at ~line 1955 asserts `foldText("हिन्दी दोस्ती")` is unchanged — on a string that exists only inside the test. The decision to restrict folding to U+0300–U+036F is **right**; it is simply protecting an empty index.

### S4-009 · S3 · The header's no-results state offers no way forward

`components/SearchButton.tsx:156-158` renders one grey `<p>`. Same at `components/SearchBar.tsx:110-121`. The house pattern at `components/BrowsePage.tsx:696-731` is a bordered card with a clock icon, a bold headline, an explanatory sentence and a gradient **Browse Drama** button. `/search` at least links to Discover; the header — the only search entry point in the product chrome — does not.

`anime` → 0, `tubi` → 0, `creators` → 0. All three are real browse tabs, and the panel says only *No results for "anime"*.

### S4-010 · S3 · 36×36px trigger, ~44×20px Cancel, keyboard focused on a timer

`components/SearchButton.tsx:53` → `w-9 h-9` (36×36 CSS px), byte-identical in the deployed chunk. `:106` Cancel has no padding classes. `:31-34` calls `focus()` from a `setTimeout(…, 100)` after `setOpen`, outside the gesture handler — the pattern that leaves the iOS software keyboard closed. `components/FeedSearch.tsx:48` repeats the 36×36 trigger. Keyboard half needs a handset (see Gaps).

### S4-011 · S4 · FeedSearch.tsx is dead — 7 of 20 in-scope elements never render

No importer anywhere; its placeholder `"Search shows..."` is in none of the 20 downloaded chunks, while both other placeholders are. Its own comment at `:19-22` acknowledges it. Harmless today (it calls the shared matcher) but it is a fourth copy of the search UI that will drift. It is listed in the gate's `searchSurfaces` at `scripts/test-feed-integrity.mjs:1984-1989`.

### S4-012 · S4 · Search analytics fire per keystroke with a stale count

`components/SearchButton.tsx:100`:
```js
onChange={(e) => { setQuery(e.target.value); if (e.target.value.trim().length >= 2) trackSearch(e.target.value, filtered.length); }}
```
`filtered` (`:28-29`) derives from the state `query` that has not updated yet, so every event reports the count for the **previous** query. `:86-90` fires again on submit, duplicating the final query. Typing "billionaire" produces 11 events. Verbatim in the deployed bundle:
```js
onChange:e=>{u(e.target.value),e.target.value.trim().length>=2&&(0,c.trackSearch)(e.target.value,y.length)}
```
`lib/track.ts:69-71` routes to GA4 / Vercel Analytics, not `/api/events` — no rate-limit exposure. `/search` and `/discover` track nothing at all.

### S4-013 · S4 · Substring matching with no word boundary

`lib/search-index.ts:142` is plain `String.includes` on a space-joined blob, and the 2-character floor at `:138` applies to the whole query rather than per token.

```
goat mistress → 2   (La amante de la cabra + The Escort They Framed, whose logline
                     contains "…a dynasty's perfect scapegoat — until…")
desi → 4   tit → 15   ass → 7
a e  → 91  e a i o → 91  a b → 87
```

### S4-014 · S4 · The comment justifying the slug-in-index says "eleven"; it is fifteen

`lib/search-index.ts:104-108` — *"all eleven ship with no SEARCH_TAGS entry at all."* Measured: **15**, adding `exes-premiere`, `love-awards`, `storage-pirates` and `im-obsessed-with-my-boss-2`. Standing rule 5.

### S4-015 · S4 · A ternary whose branches are identical

`app/search/page.tsx:86` — `{results.length === 1 ? "series" : "series"}`. Correct output today only because "series" is invariant; it will mis-pluralise the moment it is localised. `components/SearchButton.tsx:119` pluralises correctly, and uses a different noun ("5 results" vs "5 series found").

### S4-016 · S4 · "91+" when exactly 91 are searchable

`app/search/page.tsx:22-23` and `:142-144` both interpolate `getLiveSeries().length` and append `+`. The 5 rows the number excludes are the ones search cannot reach at all (S4-003).

### S4-017 · S4 · Accessibility gaps on all three shipped surfaces

No `aria-label` on any of the three inputs — the only aria-labels shipped on the home page are "Change language", "Close bag", "Close sitemap" and "Search" (the trigger). No `aria-live` on any results container. The header overlay (`:63-71`) is a plain portalled div: no `role="dialog"`, no `aria-modal`, no focus trap, no focus restoration.

### S4-018 · S4 · Consistency drift

- `/search?q=a` renders **"0 series found"** and the No-results panel for a search that was never run (`:41` returns `[]` on the length guard, feeding the `query && results.length === 0` branch at `:153`). The header and /discover render nothing in the same state — three behaviours for one condition.
- `/search`'s input omits `enterKeyHint="search"` that the header input carries (`:98`).
- The footer sitemap lists **Search twice** — `lib/data/sitemap.ts:105` (Watch) and `:232` (Support), same href.
- On `/discover`, the search dropdown routes to the player (`posterHref`) while the All Series list directly below writes `href={\`/series/${series.slug}\`}` as a literal — 91 show-page links, 0 player links, the opposite of the dropdown above it. The gate at `scripts/test-feed-integrity.mjs:936-951` only asserts that `SearchBar.tsx` calls `posterHref`, so it does not see the page around it. Possibly deliberate for a directory listing; flagged, not asserted.

---

## 4. Note on the DO-NOT-REGRESS list

Nothing here touches it. Search results route straight to `/series/<slug>/1` — instant play from a poster tap is preserved and is exactly what `posterHref` delivers on all 91 live rows, verified 200. No finding proposes an interstitial, a detail page in front of the player, or any change to the paywall, the picker, swipe feel, poster art, the legal pages, the Anime empty state or the logo lockup. S4-009 asks the header's no-results panel to *adopt* the Anime empty-state pattern, not to change it.

## 5. Method

The matcher and catalogue were loaded through `jiti` with the `@/` alias resolved, so every assertion ran against the exact modules that ship — no fixtures, no string matching against source. 582 distinct queries were evaluated locally; the load-bearing ones were re-fetched from `https://www.verzatv.com` and confirmed in the deployed JS chunks, so no fix was verified by its assignment. All 96 catalogue rows were resolved to real URLs and fetched. The feed-integrity gate was run and passes with every finding above live, which is the negative control: none of these defects is covered by an existing check.
