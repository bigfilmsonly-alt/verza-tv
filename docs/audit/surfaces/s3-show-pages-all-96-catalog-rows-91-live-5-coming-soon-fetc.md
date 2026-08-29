# S3 — SHOW PAGES: all 96 catalog rows (91 live + 5 coming_soon) fetched from production at https://www.verzatv.com/series/&lt;slug&gt;, checked for synopsis presence and duplication, cast, badges, price, Play button, audio-language label, canonical, structured data, and coming-soon honesty.

**Coverage: 96 of 96 items examined.** 19 findings raised.

## Gaps — items in scope this agent could not examine

1. TRUE 320px DEVICE VIEWPORT — not measurable. Chrome on macOS refused to shrink the window below 606 CSS px (resize_window reported success, innerWidth stayed 606), and the site sends x-frame-options: DENY so a 320px same-origin iframe harness could not read contentDocument. I substituted a genuine 320px CONTENT width by constraining .app-shell, and verified 2 pages that way (the-pendleton-secret; i-cant-resist-my-mansion-gardener, which carries the second-longest h1). Needs: a real 320px device or a headless browser with an emulated viewport, run across the longest-string rows — mafia-lords-secret-video (h1 50 chars), salt-and-pepper / im-having-my-professors-baby-es (logline 211 chars), i-fell-in-love-with-my-presidential-brother-in-law-es (description 399 chars).

2. BURNED-IN ENGLISH SUBTITLES on the 6 live Hindi titles — partially verified. The show pages claim "Hindi audio · English subtitles". I confirmed the claim is TRUE for salt-and-pepper by pulling a Mux thumbnail of a public free episode (playback id jZ01vdAEA02cUDq007m02USJgJh8YKNeYj5wBySpM00qLwFw at t=30s shows burned-in English text). Sampled frames from falling-for-flatmate, dil-dosa-dosti, love-for-sale, the-breakup-podcast and reset happened to contain no dialogue, so the claim is UNVERIFIED for those 5. Structural risk worth noting: lib/audio-language.ts derives the subtitle claim from membership of the "bollywood" category, not from any per-title measurement, so the next Bollywood title added inherits the claim whether or not it is true. Needs: frame sampling at known dialogue timestamps, or a supplier delivery note per title.

3. IOS EXPOSURE PRECONDITION for D3-005 — I proved the $1.99 card is in the server HTML for every request including ?platform=ios with a VerzaTV-iOS user agent. I could NOT confirm whether the iOS binary actually renders /series/[slug] in a WebView; the native client lives in ../verza-native, outside this repo. If it does, D3-005 is an App Store 3.1.1 exposure at the severity given; if the native app never loads this route, it drops to S4. Needs: a route inventory from ../verza-native.

4. CAST NAME COLLISION — I established the cast lists are fabricated (18 entries are literal character/role labels). I did NOT check whether any of the 222 invented names collides with a real working performer, which would be a separate rights problem. Needs: a name-clearance pass.

5. LOCALE COVERAGE — I rendered the show page in production under 1 non-English locale (es) and read the strings off the live DOM. The remaining 18 non-English locales were not individually rendered. The strings are server-side English literals so they cannot vary by locale, but that is inference, not measurement.

6. EPISODE PICKER internals verified on 1 of 91 live pages (the-unforgettable-love: 50 items, EP1 "NOW", EP2–5 "FREE", 45 padlock glyphs on the paid run). The other 90 were verified only for the picker's presence and its collapsed-state label. This is a named DO-NOT-REGRESS asset and it was intact where measured.

7. STRUCTURED-DATA VALIDATION was done by parsing and property-checking all 96 payloads myself, not by submitting them to Google's Rich Results Test (no such tool available here).

---

# S3 — SHOW PAGES: all 96 catalog rows

**Surface:** `https://www.verzatv.com/series/<slug>` — `app/series/[slug]/page.tsx`
**Run:** 2026-08-29 against production deployment `dpl_7L9CxaoUDHn95y2P125xTMAVAWAj`
**Coverage: 96 of 96 rows fetched from production and examined. 19 findings.**

---

## 1. Coverage

| | |
|---|---|
| Rows in scope | **96** (91 `live` + 5 `coming_soon`, per `docs/audit/00-manifest.json` → `catalog.detail`) |
| Rows fetched from production | **96 / 96** — all HTTP 200, 0 redirects, 56–64 KB each |
| Rows fully parsed and cross-checked | **96 / 96** |
| Findings | 19 (5 × S2, 6 × S3, 8 × S4) |

Note on the manifest: `catalog.rows = 96` is right, but `catalog.live = 1` and `catalog.comingSoon = 0` in `00-manifest.json` are wrong — the per-row `catalog.detail` array counts 91 `live` / 5 `coming_soon`, which matches AGENTS.md rule 2 and matches production. I used `catalog.detail` as the denominator. **The two summary counters in the manifest are stale and should not be trusted by other agents.**

### Attributes checked on every one of the 96

HTTP status · redirect count · `<title>` · `<meta name="description">` + length · `<link rel="canonical">` · `<meta name="robots">` · `og:title/description/url/image/image:width/height/alt/type` · `twitter:card/title/description/image` · JSON-LD block count · `TVSeries` (name, description, genre, numberOfEpisodes, inLanguage, url, image, productionCompany) · `BreadcrumbList` (2 items) · `<html lang>` · `h1` · genre badge · episode-count line · audio-language badge · logline paragraph · description paragraph · year · channel · Cast block · tag pills · free-preview badge · Play CTA href + label · Coming-Soon pill · Series Unlock card presence · price string · "All N episodes · one-time purchase" line · episode dropdown vs. empty state · "Browse VERZA" escape hatch · next-episode chevron href · poster URL reachability.

### Additional evidence gathered

- **181 outgoing episode links** from show pages (91 Play + 90 next-episode) fetched: **181/181 = 200, 0 redirects.**
- **96 poster URLs** fetched: **96/96 = 200**, all 96 distinct (94 PNG, 2 JPEG).
- **Free-run badge cross-checked against the real 4,913-row Mux public projection** (`lib/mux-public-map.ts`), not against the catalog literal.
- **Negative routes probed:** `/series/does-not-exist-xyz` → 404; `/series/The-Mistress-Trap` (case) → 404; `/series/the-mistress-trap/` → 1 redirect to canonical, 200; `/series/the-chairmans-revenge/1` → 404 (correct — no episode exists).
- **Live browser measurement** of the deployed DOM (element hit boxes, interactivity, overflow, locale switch).
- **Mux thumbnail frames** pulled to test the burned-in-subtitle claim.

---

## 2. What is CORRECT — verified, not assumed

These were checked on all 96 and produced **zero** mismatches. Recording them so nobody re-audits them.

| Check | Result |
|---|---|
| Canonical is self-referential and absolute | 96/96 `https://www.verzatv.com/series/<slug>` |
| `og:url` matches canonical | 96/96 |
| `<title>` convention | 96/96 — `{h1} — Watch Free \| VERZA TV` (live) / `{h1} — Coming Soon \| VERZA TV` (soon). No double brand suffix. |
| `robots` | 91 live = `index, follow`; 5 coming-soon = `noindex, follow` |
| Episode-count line | 91 live print `{episodeCount} episodes`; 5 coming-soon print `Episodes announced soon` — never "0 episodes" |
| Play CTA | 91/91 live → `/series/<slug>/1`, label "Watch Episode 1 Free". 0/5 coming-soon have one. |
| Coming-Soon pill | 5/5 coming-soon, 0/91 live |
| Episode picker vs. empty state | 91/91 live render `EpisodeDropdown`; 5/5 coming-soon render the Anime-pattern empty state with the "Browse VERZA" escape. No "EP 1 of 0". |
| Unlock card gating | 86 paid rows have it; the 5 wholly-free live rows and the 5 coming-soon rows do not |
| "All N episodes · one-time purchase" | 86/86 matches the row's real episode count |
| JSON-LD | 96/96 exactly one `<script type="application/ld+json">`, parsing cleanly to `[TVSeries, BreadcrumbList]`. `numberOfEpisodes` matches the catalog on 96/96; `name` matches `h1`; `description` matches the logline; `genre` matches the badge; `inLanguage` matches the audio badge on 96/96 (80 en, 6 es, 10 hi). No fabricated `aggregateRating` is published. |
| Poster art | 96/96 resolve 200, 96 distinct files |
| Cast reuse | The only cast lists shared between rows are a title and its own sequel (`the-dumb-billionaire-heiress-in-love`↔`-pt-2`, `im-obsessed-with-my-boss`↔`-2`). Correct. |
| Logline / description uniqueness *across* rows | 0 duplicates. Every row's copy is its own. |

### The free-run badge is correct on all 91 — including the two clamped titles

This closes a known-open item for this surface. For every live row I counted the **contiguous run of episodes carrying a public `playbackId`** in `lib/mux-public-map.ts` and compared it to the badge:

- **91/91 badges match the real free run.** No title advertises a free episode it cannot serve.
- **0/91** have an off-run public playback ID (no free episode outside the advertised run).
- **5 wholly-free titles** correctly read **"All Episodes FREE"**: `the-dumb-billionaire-heiress-in-love`, `storage-pirates`, `too-much-junk`, `exes-premiere`, `love-awards`.
- **The 2 clamped titles resolve honestly.** `the-dumb-billionaire-heiress-in-love` has a catalog literal of `freeEpisodes: 58` against 50 real episodes, and `storage-pirates` has `14` against 13. Both are clamped at query time to the real inventory, both land on `freeEpisodes === episodeCount`, and both therefore render "All Episodes FREE". The overpromising literal never reaches the viewer.
- `episodeCount` matches the Mux map length on **91/91**, and every map is contiguous from 1..N.

### Named DO-NOT-REGRESS assets, verified intact

- **Episode picker FREE badges and padlocks** — on `/series/the-unforgettable-love`: 50 items, EP1 "NOW", EP2–EP5 "FREE", 45 padlock glyphs across the paid run. Intact.
- **Poster art** — 96/96 unique and reachable.
- **The coming-soon empty state** — matches the Anime house pattern exactly: same neutral slate, same clock glyph, same two-line shape, same gradient escape hatch. Genuinely good work; do not touch it.
- **Speed** — all 96 pages served from `x-nextjs-prerender: 1` with sub-300 ms total time on the negative-route probes.
- **"THE MICRODRAMA APP" under the logo** — present.

---

## 3. Findings

### D3-001 · S3 · The duplicate synopsis is REAL, still live, and it is 22 rows

**The prior report is confirmed.** "Roughly a quarter of the Drama catalog printed its synopsis twice" — the exact figure is **22 of 96 (22.9%)**.

The mechanism is precise: `SERIES_DETAIL[slug].description` **begins with the catalog `logline` verbatim**, and `app/series/[slug]/page.tsx` renders them as two consecutive `<p>` elements with no dedupe. The viewer reads the same sentence, then the "2025 · VERZA Originals" line, then the same sentence again followed by one or two extra sentences.

```
app/series/[slug]/page.tsx:203    {series.logline}
app/series/[slug]/page.tsx:210    (year · channel row)
app/series/[slug]/page.tsx:228    {series.description}
```

Source proof, three of twenty-two:

| slug | `lib/catalog.ts` logline | `lib/series-detail.ts` description |
|---|---|---|
| `the-unforgettable-love` | :859 "He erased her from his memory to survive. She walks back into his life and he feels everything — without knowing why." | :418 "He erased her from his memory to survive. She walks back into his life and he feels everything — without knowing why. **Some love stories survive even amnesia.**" |
| `the-ceo` | :881 "At 26 she runs a billion-dollar empire. At night she's the woman no one is allowed to love." | :430 "At 26 she runs a billion-dollar empire. At night she's the woman no one is allowed to love. **Power and loneliness share the same corner office — until someone breaks through.**" |
| `rosy-psycho` | :848 "She's sweet, beautiful, and everyone loves her. Her exes keep disappearing — and no one connects the dots." | :412 "She's sweet, beautiful, and everyone loves her. Her exes keep disappearing — and no one connects the dots. **The most dangerous person in the room is always the one you'd never suspect.**" |

Worst case is `the-unforgettable-love`, where **79% of the description is a verbatim repeat** — 22 of 28 words — leaving six new words as the entire payoff for a second paragraph.

**All 22 slugs:**

| # | slug | title | repeated words | desc words | repeat share |
|---|---|---|---|---|---|
| 1 | `im-obsessed-with-my-boss-2` | I'm Obsessed with My Boss Part II | 15 | 31 | 48% |
| 2 | `loves-perfect-crime` | Love's Perfect Crime | 20 | 45 | 44% |
| 3 | `my-celebrity-boyfriend-killed-me` | My Celebrity Boyfriend Killed Me | 20 | 43 | 47% |
| 4 | `one-night-one-forever` | One Night One Forever | 16 | 42 | 38% |
| 5 | `rosy-psycho` | Rosy Psycho | 18 | 32 | 56% |
| 6 | `runaway-bride` | Runaway Bride | 19 | 47 | 40% |
| 7 | `she-is-mine` | She Is Mine | 19 | 32 | 59% |
| 8 | `sisters-have-crush-on-the-same-man` | Sisters Have Crush on the Same Man | 11 | 36 | 31% |
| 9 | `the-billionaires-lost-love` | The Billionaire's Lost Love | 20 | 43 | 47% |
| 10 | `the-billionaires-vow` | The Billionaire's Vow | 17 | 31 | 55% |
| 11 | `the-ceo` | The CEO | 18 | 31 | 58% |
| 12 | `the-chauffeur` | The Chauffeur | 18 | 33 | 55% |
| 13 | `the-dumb-billionaire-heiress-pt-2` | The Dumb Billionaire Heiress In Love Pt. II | 18 | 35 | 51% |
| 14 | `the-inheritance-game` | The Inheritance Game | 20 | 43 | 47% |
| 15 | `the-pendleton-secret` | The Pendleton Secret | 19 | 37 | 51% |
| 16 | `the-perfect-husband` | The Perfect Husband | 16 | 31 | 52% |
| 17 | `the-phoenix-conspiracy` | The Phoenix Conspiracy | 18 | 28 | 64% |
| 18 | `the-unforgettable-love` | The Unforgettable Love | 22 | 28 | **79%** |
| 19 | `tied-by-fate` | Tied By Fate | 16 | 37 | 43% |
| 20 | `twist-of-time` | Twist of Time | 20 | 35 | 57% |
| 21 | `twisted-fates` | Twisted Fates | 22 | 40 | 55% |
| 22 | `why-i-did-it` | Why I Did It | 16 | 31 | 52% |

**Precision the earlier report got wrong:** it is not "printed twice" in the sense of an identical duplicate paragraph. There are **zero** exact full duplicates. It is a *prefix* duplicate — the description is a superset that opens with the logline word for word. That distinction matters for the fix: deleting the description would throw away real new copy on all 22.

**Not covered by any gate.** `scripts/test-feed-integrity.mjs` has no assertion comparing logline to description.

---

### D3-002 · S2 · The "Cast" credits are fabricated, on 76 of 96 pages

Every one of the 76 rows carrying a Cast block has **exactly three names**. Eighteen of those entries, across seventeen series, are unmistakably character or role labels rather than performers:

| slug | Cast entry |
|---|---|
| `rosy-psycho` | **Victim #4**, Detective Kane |
| `why-i-did-it` | **The Victim** |
| `the-perfect-husband` | **The Other Wife** |
| `tied-by-fate` | **The Oracle**, Detective James Wren |
| `the-ceo` | **Board Chair Helen Wu** |
| `the-pendleton-secret` | **Lady Pendleton**, Eloise Pendleton |
| `the-unforgettable-love` | **Dr. Miriam Fields** |
| `i-think-my-wife-wants-to-kill-me` | Officer Pike |
| `loves-perfect-crime` | Detective Nolan Cross, Captain Harris |
| `my-celebrity-boyfriend-killed-me` | Detective Rivera |
| `my-handsome-bodyguard` | Agent Cole Walker, Detective Marsh |
| `school-hall` | Professor Vane |
| `the-crown` | Judge Harrison |
| `she-is-mine` | Detective Grant |
| `the-escaping-mistress` | Detective Hale |

Plus the structural tell: `the-blackthornes` credits "Genevieve Blackthorne" and "Roman Blackthorne" — the fictional dynasty from its own logline — and `the-phoenix-conspiracy` credits "Phoenix Ashford", built from the title's own word.

Web searches for `"Sienna Marsh"` and `"Eloise Pendleton"`/`"Lady Pendleton"` return no matching performer.

The block is rendered under the literal heading **"Cast"** (`app/series/[slug]/page.tsx:236`) on 76 commercial pages, 66 of which carry a $1.99 price. A viewer reading "Cast: Rosalind Hart · Detective Kane · Victim #4" is being shown invented credits as if they were real.

---

### D3-003 · S2 · The $1.99 card is inert — no way to buy from the show page

Measured directly in the deployed DOM on `/series/the-pendleton-secret`:

```
card.tagName                                     → "DIV"
card.closest('a,button')                         → null
getComputedStyle(card).cursor                    → "auto"
card.getAttribute('role')                        → null
card.getAttribute('tabindex')                    → null
card.querySelectorAll('a,button,[role=button]')  → 0
card.textContent  → "Series UnlockAll 60 episodes · one-time purchase$1.99"
```

`<main>` on this route contains **exactly three interactive elements** in total:

```
A      "Watch Episode 1 Free"   → /series/the-pendleton-secret/1
BUTTON "EP 1 of 60 · All Episodes"
A      (chevron)                → /series/the-pendleton-secret/2
```

Source: `app/series/[slug]/page.tsx:328–364` is a plain nested `<div>` pair, never an anchor or button.

So on **86 paid show pages** the product states a price, states "one-time purchase", and provides no path to pay it. The only route to purchase is Play → swipe past the free run → hit the paywall. That is a viewer who cannot complete an obvious intended task on the page that advertises the price.

The card is *visibly* non-interactive by the letter of the completeness rule (no hover state, no cursor change), but it is styled as a purchase card — gradient frame, accent-coloured price, "one-time purchase" — so the honest reading is that it looks like a buy button and is not one.

---

### D3-004 · S2 · The show-page price is a hard-coded literal that no gate covers, and it is the only unlocalized money surface

`app/series/[slug]/page.tsx:359` renders the string `$1.99`.

`lib/price.ts` exists precisely to end this, and its own header names this file:

> "every price the viewer actually SEES was a hard-coded string literal: `"$1.99"` appears verbatim in `components/EpisodeFeed.tsx` (twice), **`app/series/[slug]/page.tsx`**, and two dead components."

Only `EpisodeFeed` was migrated. `grep` for importers of `@/lib/price` returns `components/EpisodeFeed.tsx` and `components/LangProvider.tsx` — not the show page.

**The gate does not catch it.** `scripts/test-feed-integrity.mjs:2106–2130` asserts `lib/price.ts` equals the server constant. It asserts nothing about the show page. Delete the show page's connection to the canonical price — as has already happened — and the check stays green. This is the Standing Rule 1 / Rule 3 pattern the audit was told to look for.

**Present-tense consequence, verified in production.** With `localStorage['verza-lang'] = 'es'` on `/series/the-pendleton-secret`, the live DOM returns:

```
htmlLang       "es"
audio badge    "Audio en inglés"     ← translated
unlock card    "$1.99"               ← not translated, not locale-formatted
```

Meanwhile `lib/price.ts` documents that `formatSeriesUnlockPrice("es")` yields `"1,99 US$"`, which is what the paywall renders. A Spanish viewer therefore sees two different renderings of the same price in one session — and `lib/price.ts` itself warns that mis-rendering a price is "a refund, not a translation".

The number is correct today. Nothing would fail if it stopped being.

---

### D3-005 · S2 · The iOS purchase-surface hide runs post-mount, so the price ships in the server HTML

```bash
curl -s 'https://www.verzatv.com/series/the-pendleton-secret?platform=ios' \
  -H 'User-Agent: Mozilla/5.0 (iPhone; ...) VerzaTV/2.0' | grep -c 'Series Unlock'
→ 1        # and "$1.99" is present
```

`components/HideInIOSApp.tsx` states the design outright:

> "Detection runs post-mount so server HTML stays identical for both."

`useState(false)` → `useEffect` → `queueMicrotask(() => setHidden(true))`. `lib/platform.ts::isIOSApp()` returns `false` during SSR (`typeof window === "undefined"`). So the card is in the delivered markup for every request and is painted for at least one frame before hydration removes it.

AGENTS.md rule 11: *"The iOS binary excludes UGC, ads, affiliate placements, Stripe, and web purchase steering."* The existence of `HideInIOSApp` on this route is itself evidence somebody believed the show page is reachable inside the iOS app. See gap 3 — I could not confirm that precondition from this repo.

---

### D3-006 · S3 · Twelve strings on all 96 pages ship English-only in 19 of 20 locales — and several translations already exist

Verified in production, not inferred. With `verza-lang = 'es'` on `/series/the-pendleton-secret`, the live DOM returns:

| Rendered | Should be (key already in `lib/i18n.ts`) |
|---|---|
| `60 episodes` | `content.episodes` = "Episodios" |
| `Cast` | `content.cast` = "**Reparto**" |
| `First 5 Episodes FREE` | — no key |
| `Watch Episode 1 Free` | `content.watchFree` = "**Ver Episodio 1 Gratis**" |
| `Series Unlock` | `content.unlockSeries` = "Desbloquear Serie Completa" |
| `All 60 episodes · one-time purchase` | `content.oneTimePayment` / `content.allEpisodesIncluded` |
| `EP 1 of 60 · All Episodes` | `content.allEpisodes` = "Todos los Episodios" |
| `$1.99` | see D3-004 |
| `Coming Soon` | `misc.comingSoon` = "**Próximamente**" |
| `Episodes announced soon` | — no key |
| `Episodes are on the way` + paragraph | — no key |
| `Browse VERZA` | — no key |

Only `AudioLanguageBadge` reads the i18n system — and correctly returned "Audio en inglés".

Literal line numbers: `:181`, `:236`, `:284–285`, `:307`, `:322`, `:346`, `:351`, `:359`, `:408`, `:410`, `:420`.
Keys that already ship in all 20 locales: `lib/i18n.ts:190–191` (en) and `:240–241` (es).

There is no machine-translation safety net. `components/ContentTranslator.tsx` documents that the Google Translate injection was removed because the engine host was never in the CSP and "has never once run".

---

### D3-007 · S3 · `<html lang>` never describes the content language

All 96 pages ship `lang="en"` from the server:

```html
<html data-dpl-id="dpl_7L9CxaoUDHn95y2P125xTMAVAWAj" lang="en" ...>
```

Six of them are entirely Spanish. `/series/sentence-of-passion-es` under `lang="en"` carries:

- h1 "Sentencia de pasión"
- genre badge "Drama · Pasión"
- logline and description entirely Spanish
- `<meta name="description">` in Spanish
- tags `#drama #juicio #pasion #obsesion`

Affected: `sentence-of-passion-es`, `i-cheated-on-my-wedding-night-es`, `i-fell-in-love-with-my-presidential-brother-in-law-es`, `the-goat-mistress-es`, `im-having-my-professors-baby-es`, `i-cant-resist-my-mansion-gardener`.

After hydration `lang` is set to the **UI locale** (`ContentTranslator.tsx`, `LangProvider.tsx`), so it can also read `lang="es"` over wholly English body copy — verified on `/series/the-pendleton-secret`. The attribute is wrong in both directions.

The correct value is already computed: those pages' JSON-LD carries `inLanguage: "es"`, from `inLanguageForSlug()`.

Live evidence, `/series/i-cant-resist-my-mansion-gardener` with locale `en` — one page, two languages:

```
No puedo resistir a mi jardinero de la mansión | ROMANCE · PROHIBIDO |
Episodes announced soon | Spanish audio | Ella tiene el apellido, la casa y un
matrimonio que todos envidian... | VERZA Originals | Coming Soon |
Episodes are on the way | The footage for this title hasn't landed yet... | Browse VERZA
```

---

### D3-008 · S3 · No back affordance on any show page

`document.querySelector('[aria-label*="ack" i]')` → `null`.

The header holds exactly three controls: language (36×36), logo → `/` (200×62), search (36×36). The bottom nav's "Discover" also points at `/`. Both land on the default Drama tab.

So a viewer who taps a Bollywood, Español, Reality or Red-Carpet poster and arrives here has no in-page route back to the tab they came from. `components/EpisodeFeed.tsx` already implements a tab-preserving back (`window.location.href = backHref` → `/?tab=reality`), so the pattern exists in the product and the show page does not use it.

---

### D3-009 · S3 · 11 of 86 paid titles have no Cast; 7 also have no synopsis paragraph and no tags

| Missing | Count | Slugs |
|---|---|---|
| description **and** tags (paid) | 7 | `im-having-my-professors-baby-es`, `falling-for-flatmate`, `dil-dosa-dosti`, `salt-and-pepper`, `love-for-sale`, `the-breakup-podcast`, `reset` |
| Cast (paid) | 11 | the 7 above + `sentence-of-passion-es`, `i-cheated-on-my-wedding-night-es`, `i-fell-in-love-with-my-presidential-brother-in-law-es`, `the-goat-mistress-es` |
| description/tags/Cast (free) | 4 | `storage-pirates`, `too-much-junk`, `exes-premiere`, `love-awards` — reality/red-carpet, where a drama cast list is not expected |
| all three (coming-soon) | 5 | the 5 `coming_soon` rows |

Every one of the 96 pages **does** carry a synopsis in the sense of a logline. But `salt-and-pepper` — a $1.99 purchase — gets a one-line logline where `the-mistress-trap` gets a logline, a 60-word description, three cast names and three tags. The newest revenue-bearing rows have the thinnest pages.

Cause: no `SERIES_DETAIL` entry for these slugs; the render is guarded on presence at `:223`, `:233`, `:243`.

---

### D3-010 · S3 · No error or loading boundary on the show route

```
find app -name error.tsx -o -name loading.tsx -o -name global-error.tsx
→ app/series/[slug]/[episode]/error.tsx      (the only one)
```

Plus `app/not-found.tsx`. There is no `app/error.tsx` and no `app/global-error.tsx`.

The show route is the landing page for search traffic and the destination for all five coming-soon tiles — and those five are deliberately excluded from `generateStaticParams` (`:27–31`), so they render on demand and are exactly the pages most likely to need a loading state. Production headers confirm: `/series/the-chairmans-revenge` returns `x-matched-path: /series/[slug]`, `x-nextjs-stale-time: 300`.

A render failure here shows Next's unbranded default, not an honest state with a way forward. The completeness bar asks for all four states; this route ships two.

---

### D3-011 · S3 · No save, share, or resume on the show page

The show page has three interactive elements (D3-003). There is no add-to-My-List control, no share, no resume — on the one surface the codebase itself calls *"the one surface carrying the synopsis, the cast and the price"* (`scripts/test-feed-integrity.mjs:2264`).

The feature exists elsewhere: `lib/i18n.ts` ships `profile.myList` / `library.myList` / `library.noSavedShows` in all 20 locales, `/library` renders My List, and Supabase carries a `saved_list` table. A viewer arriving from search who wants to come back later has nothing to press.

---

### D3-012 · S4 · Coming-soon JSON-LD emits `numberOfEpisodes: 0`

All five coming-soon pages emit:

```json
{"@type":"TVSeries","name":"The Chairman's Revenge","numberOfEpisodes":0,
 "inLanguage":"hi","image":"https://www.verzatv.com/posters/the-chairmans-revenge.png",...}
```

`app/series/[slug]/page.tsx:181` carries the comment *"A coming-soon title has no episode count worth printing; '0 episodes' reads as a broken page rather than an unreleased one"* — the UI rule the schema builder does not follow. Impact is bounded because the pages are `noindex, follow`, so the payload is mostly read by share-card scrapers. `og:type` is also `video.tv_show` on all five.

---

### D3-013 · S4 · 15 of 96 meta descriptions exceed the SERP budget

`app/series/[slug]/page.tsx:57` sets `description: series.logline` with no clamp. Measured across all 96: min 57 chars, max 211.

Over 160: **15 rows**. Over 200: **2**.
Worst six: `salt-and-pepper` 211, `im-having-my-professors-baby-es` 211, `hidden-agenda` 192, `love-for-sale` 190, `the-chairmans-revenge` 188, `protected-by-the-devil` 187.

---

### D3-014 · S4 · 16 of 96 pages render no year

76 rows render `[year, channel]`, 4 render `[2026, channel]`, **16 render `[channel]` only** — so the metadata row collapses to a lone "VERZA Originals" while every other page reads "2025 · VERZA Originals".

The 16: `storage-pirates`, `too-much-junk`, `exes-premiere`, `love-awards`, `im-having-my-professors-baby-es`, `falling-for-flatmate`, `dil-dosa-dosti`, `salt-and-pepper`, `love-for-sale`, `the-breakup-podcast`, `reset`, and the 5 coming-soon rows. Same root cause as D3-009 — no `SERIES_DETAIL` entry.

---

### D3-015 · S4 · Tap targets below 44 px

Measured from the deployed DOM, at both a 606 px viewport and a 320 px content width:

| Element | Size | Where |
|---|---|---|
| Header language button | 36 × 36 | every show page |
| Header search button | 36 × 36 | every show page |
| Next-episode chevron `<a href="/series/<slug>/2">` | 39 × 39 | 90 live pages |
| Play CTA "Watch Episode 1 Free" | 212 × **43** | 91 live pages |
| Episode-picker button | 227 × **41** (606 px) | 91 live pages |
| "Browse VERZA" | 124 × **35** | 5 coming-soon pages |
| Bottom-nav items | 74 × **41** | every page |

The Play CTA misses by one pixel; the chevron and the header controls miss by five to eight.

---

### D3-016 · S4 · "VERZA Originals" on supplier-licensed titles

94 of 96 rows carry `channel: "VERZA Originals"` in `lib/catalog.ts` (the other 2 carry "The Carpet"). That includes the 11 live Hindi and Spanish titles that AGENTS.md rule 2 describes as coming from a supplier (*"six further titles have key art but no video from the supplier"*), and that `lib/audio-language.ts` describes as carrying supplier-burned English subtitles.

**Flagged, not asserted.** "VERZA Originals" may be an intended imprint label rather than a production credit. This one needs an owner's call, not a code fix.

---

### D3-017 · S4 · No `offers` in the TVSeries structured data

All 96 JSON-LD payloads carry exactly eight `TVSeries` properties: `name`, `description`, `genre`, `numberOfEpisodes`, `inLanguage`, `url`, `image`, `productionCompany`. None carries `offers` or `potentialAction`, so the $1.99 shown on 86 pages is invisible to structured-data consumers.

**Related, and worth flagging as a hazard rather than a defect:** `lib/series-detail.ts` carries an invented `rating` on every entry (`rating: 9.2` for `the-dumb-billionaire-heiress-in-love`, `9.4` for `the-blackthornes`, and so on). Nothing renders it and nothing emits it as `aggregateRating` — which is correct. But the data is sitting there, and the first component that reads it publishes a fabricated review score.

---

### D3-018 · S4 · Coming-soon pages assert an audio language for footage that does not exist

All five coming-soon pages render an audio badge — four "Hindi audio", one "Spanish audio" — directly above the copy that says *"there is nothing to play and nothing on sale."*

`lib/audio-language.ts` already suppresses the *subtitle* half of the claim for coming-soon rows, with exactly the right reasoning:

> "promising a subtitle track it has never delivered is the same class of false claim as promising an episode count"

It keeps the audio half. Minor, arguably a deliberate forward-looking label; noted only because the file states the rule it then half-applies.

---

### D3-019 · S4 · Episode picker wraps at 320 px

At a genuine 320 px content width the picker button reflows from 227 × 41 to 155 × 60. No clipping (`scrollWidth === clientWidth`), no page-level horizontal overflow. Cosmetic.

---

## 4. Responsive: what I could and could not measure

At a **320 px content width** (`.app-shell` constrained, measured live), on `/series/the-pendleton-secret` and `/series/i-cant-resist-my-mansion-gardener`:

```
shellW               320
overflow             []      ← no element crosses the shell edge
scrollOverflow       []      ← no element clips its own text
h1                   279 × 29 (1 line) / 279 × 58 (2 lines, 46-char Spanish title)
unlock card inner    246 × 37, no internal overflow
play CTA             212 × 43
picker               155 × 60 (wraps — D3-019)
```

**No horizontal overflow and no clipped text at 320 px on either page.** See gap 1 for what this measurement is not.

---

## 5. Coming-soon honesty — 5 of 5, and it is good

Checked line by line on all five (`the-chairmans-revenge`, `protected-by-the-devil`, `the-last-will`, `the-billionaires-apron`, `i-cant-resist-my-mansion-gardener`):

| Check | Result |
|---|---|
| Page reachable | 5/5 HTTP 200 |
| Title | "— Coming Soon \| VERZA TV" |
| Robots | `noindex, follow` |
| Episode line | "Episodes announced soon" — never "0 episodes" |
| Free badge | absent (correctly — `freeEpisodes` and `episodeCount` are both 0, so an unguarded `>=` would print "All Episodes FREE") |
| Play CTA | absent; a non-interactive "Coming Soon" pill instead |
| Price card | absent |
| Episode picker | absent — no "EP 1 of 0" |
| Empty state | present, matching the Anime pattern, with a "Browse VERZA" escape |
| Deep link to episode 1 | 404 (correct — nothing links there) |

The empty-state copy is exactly right: *"The footage for this title hasn't landed yet, so there is nothing to play and nothing on sale. Everything else on VERZA is ready to watch right now."* Two honest facts and a way forward. This is the standard the rest of the page should be held to, not a defect.

Only carry-overs from the general findings apply: D3-012 (`numberOfEpisodes: 0`), D3-018 (audio claim), D3-007 (the Spanish one under `lang="en"`), D3-006 (empty state and pill untranslated), D3-014 (no year).

---

## 6. Audio-language labelling — verified, with one caveat

| Badge | Rows | `inLanguage` |
|---|---|---|
| "English audio" | 80 | `en` |
| "Spanish audio" | 6 (5 live + 1 coming-soon) | `es` |
| "Hindi audio · English subtitles" | 6 live | `hi` |
| "Hindi audio" | 4 coming-soon | `hi` |

**96/96 badge and `inLanguage` agree.** The Hindi/subtitle split is deliberate and correctly implemented.

I tested the subtitle claim empirically by pulling Mux thumbnails from public free episodes. `salt-and-pepper` E1 at t=30s shows burned-in English text over the picture — **claim confirmed for that title.** See gap 2 for the other five.

---

## 7. Re-checked inherited facts

| Asserted | Verdict |
|---|---|
| "Duplicate synopses across ~1/4 of the Drama catalog" | **TRUE.** 22 of 96 = 22.9%. Mechanism is prefix duplication, not identical paragraphs. |
| "96 rows: 91 live + 5 coming_soon" (AGENTS.md rule 2) | **TRUE** in production. |
| `00-manifest.json` `catalog.live = 1`, `comingSoon = 0` | **WRONG.** `catalog.detail` gives 91/5. Use `detail`. |
| "Free-run chip on the 5 wholly-free titles and the 2 clamped" | **CORRECT on this surface.** 91/91 badges match the real Mux public run; both clamped titles resolve to "All Episodes FREE". |
| "4,913 Mux map rows, 519 public" | **TRUE.** Parsed `lib/mux-public-map.ts`: 4,913 rows, 519 with a `playbackId`, 91 series. |
| `lib/price.ts` ended the hard-coded `$1.99` | **FALSE for this file.** `app/series/[slug]/page.tsx:359` still holds the literal; only `EpisodeFeed` migrated. |
| "the picker itself (FREE / padlock / NOW) is correct and untouched on all 91 live pages" (comment at `:373`) | **TRUE** where measured (1 of 91). |
