# VERZA TV — Phase 0 Diagnosis

**Cartographer:** Agent 0. **Written:** 2026-08-29. **Tree state:** `main` at `e6cff6a`, `git status --porcelain` empty — the working tree *is* HEAD, so every file:line below is what the repo holds right now.

**Provenance.** Nine areas were surveyed by parallel agents; every asserted fact was independently re-checked against the code before it entered this document, and I re-verified the load-bearing citations myself (spot-checks across `components/EpisodeFeed.tsx`, `components/BrowsePage.tsx`, `lib/catalog.ts`, `lib/search-index.ts`, `middleware.ts`, `next.config.ts`, and the two required handoff docs). Production readbacks against `https://www.verzatv.com` were re-run today where they are load-bearing.

**How to read the confidence markers.**
- **VERIFIED** — read in the tree at `e6cff6a`, or measured against production, this session.
- **MEASURED (prod)** — an HTTP readback of `www.verzatv.com`, today.
- **DERIVED** — a control-flow conclusion from verified code, not observed at runtime.
- **UNKNOWN** — nobody could determine it. Section 11 says what would settle it.

**Two traps that will poison you if you inherit them.** Read these before anything else.

1. **`AGENTS.md` rule 2 is stale on catalog shape.** It says "The catalog has 91 rows: all 91 live … No coming-soon rows remain." **VERIFIED false.** `lib/catalog.ts` holds **96 rows: 91 live + 5 `coming_soon`** (statuses at `lib/catalog.ts:1212, 1223, 1234, 1245, 1256`). `scripts/test-payment-integrity.mjs:678-688` asserts 96/91/5 and passes. The "91 live" half is correct; "91 rows" and "no coming-soon rows remain" are not. Every agent in this sprint reads `AGENTS.md` first (`CLAUDE.md` and `CODEX.md` are each one line: `@AGENTS.md`). Do not use it as the row-count oracle.
2. **`AGENTS.md` rule 1 is still correct and still binds:** *"Never describe local code or a successful build as deployed."* Where I cite a local `.next` build below I label it. Where a fact is a production readback I label it.

---

## 1. ROUTE MAP

### 1.1 Shape of the route table

Measured by counting route files in the tree (not by parsing build output, so it may differ from Next's own route listing by a few synthetic entries):

| Kind | Count |
|---|---|
| Page routes (`app/**/page.tsx`) | 64 |
| API routes (`app/api/**/route.ts`) | 47 |
| File routes (sitemaps, robots, llms.txt) | 7 |

Prerendered paths, from the local build at `.next/prerender-manifest.json` (built today 11:16; **local build, not production evidence**): **2,523** total, of which **91** match `/series/<slug>` and **2,214** match `/series/<slug>/<n>`.

- The 91 comes from `app/series/[slug]/page.tsx:23-27`, `SERIES.filter((s) => s.status === "live")`. **MEASURED (prod):** `/sitemap` renders exactly 91 distinct `/series/<slug>` links and 0 player links; `/sitemaps/shows.xml` returns 91 `<loc>`.
- The 2,214 comes from `app/series/[slug]/[episode]/page.tsx:29-39`, which caps static params at `Math.min(series.episodeCount, 25)` per live series. Σ min(episodeCount,25) = 2,214; Σ episodeCount = **4,913**. **2,699 episode pages are therefore not prerendered** and render `blocking` on first request, with `export const revalidate = 3600` at `app/series/[slug]/[episode]/page.tsx:43`. 87 of the 91 live series exceed the 25 cap; the four that do not are `storage-pirates` (13), `too-much-junk` (1), `exes-premiere` (12), `love-awards` (13). **Any episode index above 25 — including the ep-30 URL in the crash handoff and the "toward 60" the founder describes — is served by a different code path than episodes 1-25.** Nobody tested whether that matters (§11).

### 1.2 The exact answer: what does a poster tap resolve to

**A poster tap on the home grid resolves to `/series/<slug>/1` — the player. The show page is not involved.** VERIFIED:

```
components/BrowsePage.tsx:1155  <Link
                        :1157      href={`/series/${s.slug}/1`}
                        :1158      className="group block no-underline min-w-0 transition-transform active:scale-[0.97]"
                        :1159      onClick={(e) => posterClick(e, s.slug)}
```

`Link` is `next/link` (`components/BrowsePage.tsx:5`). `posterClick` is defined at `components/BrowsePage.tsx:246-273`. **It never calls `preventDefault`** — `grep -n preventDefault components/BrowsePage.tsx` returns zero hits across all 1,177 lines. Line 249 reads `e.defaultPrevented` (a read of a different identifier, which is why a naive grep misleads). The handler:

- `:249` early-returns on modified/non-primary clicks — this skips only the instant-player prewarm, never navigation;
- `:252-256` seeds `sessionStorage["verza-transition"]` with the tapped `<img>`'s `src`;
- `:265-272` computes `publicId` only when `resumeS <= 2` **and** `epNum <= show.freeEpisodes`, then calls `startInstantPlayer(publicId)` at `:271`.

So navigation proceeds on every path. The destination is the player: `app/series/[slug]/[episode]/page.tsx:172` renders `<EpisodeFeed>`.

**MEASURED (prod), today.** `GET https://www.verzatv.com/` (200, ~225KB). Stripping the two `<noscript>` blocks: **25 `/series/<slug>/1` hrefs in the real DOM, 0 `/series/<slug>` hrefs.** Inside `<noscript>`: **107 `/series/<slug>` hrefs, 0 ending in `/1`.** The 25 = 24 grid tiles (`PAGE_SIZE = 24` at `components/BrowsePage.tsx:532`; `gridItems = filtered.slice(0, page * PAGE_SIZE)` at `:534`) + 1 hero, with `/series/lost-and-found/1` appearing twice because the hero is also grid tile #1. All 25 end in literal `/1` — no shipped home-page link enters the feed above episode 1.

### 1.3 Every other tap target

Every in-app entry into a live title goes to `/1`. VERIFIED:

| Surface | file:line | href |
|---|---|---|
| Home grid tile | `components/BrowsePage.tsx:1157` | `/series/<slug>/1` |
| Hero | `components/BrowsePage.tsx:960` (+ `posterClick` at `:962`) | `/series/<slug>/1` |
| Continue Watching | `components/BrowsePage.tsx:601` (+ `posterClick` at `:604`) | `buildResumeUrl(slug, epNum, seconds)` → `/series/<slug>/<n>?t=<s>` |
| Music tab | `components/BrowsePage.tsx:641` | `/series/too-much-junk/1` |
| Reality grid | `components/BrowsePage.tsx:869` | `/series/<slug>/1` |
| Red Carpet | `components/BrowsePage.tsx:923` | `/series/<slug>/1` |
| Header search (global) | `components/SearchButton.tsx:124` | `/series/<slug>/1` |
| `/search` page | `app/search/page.tsx:180` | `/series/<slug>/1` |
| `/discover` search bar | `components/SearchBar.tsx:70` | `/series/<slug>/1` |
| `/genres/[slug]` (plural) | `app/genres/[slug]/page.tsx:114` | `/series/<slug>/1` |
| Library tiles | `components/LibraryPage.tsx:15, 261, 274` | `/series/<slug>/1` |

**Continue Watching (`:601`) is the only in-app link that targets an arbitrary episode N with a resume offset.** It is the in-app source of deep-episode entry. It is client-built from `/api/watch-progress`, so it never appears in the shipped HTML — which is why the production measurement in §1.2 shows only `/1`.

### 1.4 The 91 show pages, and who links to them

`app/series/[slug]/page.tsx` (344 lines) is the **only rendered surface in the web app** carrying the full merchandising payload. VERIFIED, each range read:

- logline `:169-174`
- year/channel `:177-190`
- description `:193-200`
- cast `:203-212`
- tags `:215-227`
- per-title free-preview badge `:233-256` (`:253-255` emits "All Episodes FREE" or `First ${series.freeEpisodes} Episodes FREE`)
- **$1.99 Series Unlock card `:292-328`, price literal at `:323`**
- full `<EpisodeDropdown>` `:331-337`

Exclusivity confirmed repo-wide: `.cast` renders only here and in `components/SeriesInfoDrawer.tsx`; `EpisodeDropdown` has exactly one importer (`app/series/[slug]/page.tsx:16`); `SeriesInfoDrawer` is dead (§1.6).

The complete list of live code that constructs a link to `/series/<slug>` — verified exhaustive against a literal `/series/` grep, a bare-string grep, a helper-indirection grep (no `seriesHref`/`showUrl` helper exists), and a trace of every `href={<variable>}` in `app/` and `components/`:

`components/BrowsePage.tsx:1149` (coming_soon tiles only) · `components/ShortsFeed.tsx:110` and `:66-67` (share URL) · `app/discover/page.tsx:70` · `app/discover/[genre]/page.tsx:215` · `app/channels/page.tsx:46` · `app/best/[slug]/page.tsx:199` · `app/collections/[slug]/page.tsx:201` · `app/compare/[slug]/page.tsx:143` · `app/guides/[slug]/page.tsx:144` · `app/watch-in/[slug]/page.tsx:240` · `app/genre/[genre]/page.tsx:301` · `app/c/[slug]/page.tsx:245` and `:259` · `lib/data/sitemap.ts:74` (feeds `components/FooterSitemap.tsx:141` and `app/sitemap/page.tsx:126`) · `app/page.tsx:48` (`<noscript>` only) · `app/sitemaps/shows.xml/route.ts:12`.

Of these: exactly one is reachable from the bottom nav (`ShortsFeed:110`, via `/shorts`), one requires opening the Footer "Sitemap" sheet, one is crawler-only, and the rest are SEO landing pages with no in-app entry point.

**Near-miss trap:** `app/genres/[slug]/page.tsx:114` (**plural**) links to the *player*; `app/genre/[genre]/page.tsx:301` (**singular**) links to the *show page*. Two near-identical route names with opposite destinations. Verify before "fixing" either.

### 1.5 There is no back-out path

`app/series/[slug]/[episode]/page.tsx:129` `const backTab = getReturnTab(series);` and `:181` `backHref={backTab ? `/?tab=${backTab}` : "/"}`. That is the **only** assignment of `backHref` in the repo (repo-wide grep), so the value is provably only `/` or `/?tab=<tab>`. Consumed at `components/EpisodeFeed.tsx:1053`, `:1965`, `:2373`; default `"/"` at `:1156`. `handleBack` (`:1445-1450`) only mutes and pauses videos — the anchor `href` navigates.

**MEASURED (prod):** `/series/falling-for-flatmate/1` renders `<a href="/?tab=bollywood" aria-label="Back">`; `/series/the-mistress-trap/1` renders `<a href="/">`. `grep 'href="/series/'` on the shipped episode HTML returns **zero** matches — nothing in the player chrome links back to the show page.

**Net:** `/series/<slug>` is a dead end in the tap graph. 91 real, indexed, cached pages of merchandising copy that primary navigation never links to and the player never returns to. The consideration step of the funnel is built and unreachable. The sale is still possible — the in-feed paywall (`components/EpisodeFeed.tsx:2241-2360`) shows $1.99 at `:2284` and a checkout button at `:2343` — but everything that makes a viewer *want* it before the paywall fires is on a page they cannot reach.

### 1.6 A ready-made replacement exists as dead code — with caveats

`components/SeriesInfoButton.tsx` (62 lines) + `components/SeriesInfoDrawer.tsx` (467 lines) = 529 lines rendering a synopsis tab (`SeriesInfoDrawer.tsx:257-309`), an episode list (`:312-395`), and drawer mechanics (fixed sheet `:152-163`, drag-to-dismiss `:86-114`, Escape `:117-123`). **VERIFIED zero importers** of `SeriesInfoButton` (only its own definition plus `docs/reference/COMPONENTS.md:44` and `docs/strategy/SECTION-BY-SECTION-VALUATION.md:85`). It compiles clean (`npx tsc --noEmit` exits 0).

Four corrections before anyone calls this a one-line win:

1. **It is not a purchase surface.** The "$1.99" at `SeriesInfoDrawer.tsx:371` is an inline pill on one episode row (`:365-372`), gated to `ep.number === (series.freeEpisodes ?? 5) + 1`, with **no onClick and no checkout call anywhere in the 529 lines**. The row handler is `onSelectEpisode(ep.number)` (`:320`), which navigates.
2. **It was wired, then deliberately unwired.** Commit `a0957c6` ("DramaBox-style UX: hero instant-play + series info drawer") mounted it on the episode page; commit `eac0b1f` ("10/10 immersive episode feed — vertical swipe, zero clutter", 2026-06-22) rewrote that page around `EpisodeFeed` and deleted the import. Re-mounting reverses an explicit product decision.
3. **App Store blocker.** `grep -c HideInIOSApp` returns **0** in both files. The show page wraps its price in `<HideInIOSApp>` (`app/series/[slug]/page.tsx:292`/`:328`) and gates on `isSeriesPurchasable` (`:81`). The drawer has neither. Wiring as-is ships a $1.99 web price inside the iOS binary — `AGENTS.md` rule 11.
4. **z-index collision.** Drawer uses `z-[60]`/`z-[61]` (`:145`/`:154`); `EpisodeFeed` already occupies `z-[60]` (`:2243`), `z-[70]` (`:2145`), `z-[80]` (`:2135`). Dropped in unchanged it renders *beneath* the paywall.

---

## 2. THE BOLLYWOOD INVERSION

### 2.1 The branch

VERIFIED, `components/BrowsePage.tsx`:

```
:1099   const soon = s.status === "coming_soon";
:1146   return soon ? (
:1147-1153   <Link href={`/series/${s.slug}`} className="block no-underline …">{art}</Link>
:1154   ) : (
:1155-1162   <Link href={`/series/${s.slug}/1`} className="group block …" onClick={(e) => posterClick(e, s.slug)}>{art}</Link>
:1163   );
```

Line `:1149` is the **only show-page link in the entire component** — not merely in the grid. There is no `router.push` or `window.location` navigation in the file (the only `window.location` reference is a `.search` read at `:401`).

**This is live, not dead code.** The shipped client chunk `/_next/static/immutable/chunks/0oiw0cd5-3mj5.js` on production contains the minified ternary verbatim, including `let l="coming_soon"===e.status`. The homepage RSC payload ships 91 live + exactly 5 `coming_soon` rows.

### 2.2 The five rows, and the reach

`lib/catalog.ts:1203-1257` — `the-chairmans-revenge` (:1204), `protected-by-the-devil` (:1215), `the-last-will` (:1226), `the-billionaires-apron` (:1237) — all `categories: ["bollywood"]` — and `i-cant-resist-my-mansion-gardener` (:1248), `categories: ["espanol"]`. All carry `episodeCount: 0, freeEpisodes: 0, coinPerEpisode: 0`. All have zero rows in `lib/mux-map.ts`, `lib/mux-public-map.ts`, `lib/mux-signed-map.ts`, `lib/mux-private-map.ts`.

They reach the grid via `getBrowseSeriesByCategory` (`lib/catalog.ts:1325-1332`), which appends coming-soon rows to every tab **except `popular`**:

```
:1326   const live = getSeriesByCategory(cat);
:1327   if (cat === "popular") return live;
:1328-30 const soon = catalog.filter((s) => s.status === "coming_soon" && s.categories.includes(cat));
:1331   return [...live, ...soon];
```

The branch is **not Bollywood-specific in code** — the predicate is `status === "coming_soon"`, full stop. It acts on two tabs today (Bollywood: 6 live + 4 soon; Español: 5 live + 1 soon) only because those are the only tabs carrying such rows. **It reads as 0 show-page hrefs on first paint only because the default tab is `drama` (`components/BrowsePage.tsx:275`)** and because Drama rebuilds `base` from `liveSeries` (`:301`) rather than consuming `tabData`. Any fix scoped to "Bollywood" misses Español and every future tab.

### 2.3 Is it the origin of the routing bug? **No — it is separate, and it is correct.**

**Origin:** commit `42d9d15`, 2026-06-18, "All posters → instant play (episode 1), no detail page". Its body states the policy verbatim: *"The detail page still exists at /series/slug for SEO and the Info drawer — but users never land there from browsing. One tap from any poster → video plays."* It changed six files at once (`BrowsePage`, `FeedSearch`, `HeroCarousel`, `LibraryPage`, `SearchBar`, `SeriesCard`). The `/1` default is a **repeated string literal at 13+ independent call sites, not a shared helper** — nothing downstream derives from `BrowsePage`.

**The branch:** commit `951dbbb`, 2026-08-27 13:53:06, "Show the coming-soon slate on Bollywood and Espanol", introduced the ternary — **70 days after the origin**. Commit `67fe50c`, 2026-08-27 13:58:19 (five minutes later), "Make the coming-soon detail page tell the truth", replaced the consequent from an inert `<div>` to the `<Link>` that now stands. `git blame` splits the ternary precisely: `:1146`, `:1152`, `:1154` = `951dbbb`; `:1147-1151`, `:1153` = `67fe50c`. **If you are mapping tile-tap behaviour, `67fe50c` is the deciding commit, not `951dbbb`.**

**The branch is correct and must stay.** MEASURED (prod), reproduced today:

```
/series/the-chairmans-revenge              200    /series/the-chairmans-revenge/1              404
/series/protected-by-the-devil             200    /series/protected-by-the-devil/1             404
/series/the-last-will                      200    /series/the-last-will/1                      404
/series/the-billionaires-apron             200    /series/the-billionaires-apron/1             404
/series/i-cant-resist-my-mansion-gardener  200    /series/i-cant-resist-my-mansion-gardener/1  404
/series/definitely-not-a-real-slug-xyz     404    (control — the 200s are real renders)
/series/reset (live bollywood control)     200    /series/reset/1                              200
```

Mechanism of the 404: `lib/catalog.ts:1379-1381` `getEpisodesForSeries` returns `[]` when `episodeCount === 0`; `getEpisode` then returns undefined; `app/series/[slug]/[episode]/page.tsx:95` `if (!ep) notFound()`.

Mechanism of the 200: `app/series/[slug]/page.tsx:23-27` excludes coming-soon from `generateStaticParams`, **but `dynamicParams` is set nowhere in the repo** (`grep -rn dynamicParams app/ lib/ next.config.ts middleware.ts` returns nothing), so Next 16's default `true` applies and the page renders on demand. `getSeriesWithDetail` (`lib/catalog.ts:1343-1354`) searches the *full* catalog, so `notFound()` at `:78` never fires. Production headers on `/series/the-chairmans-revenge`: `x-matched-path: /series/[slug]`, `x-nextjs-prerender: 1`, `x-vercel-cache: HIT`, `age: 587` — i.e. rendered on demand and then cached.

**Removing the branch to make Bollywood "consistent" would ship five live 404s.** The branch depends on an unstated framework default: **if anyone sets `dynamicParams = false` on `app/series/[slug]` to tighten SSG, all five tiles become 404s and no test catches it** (§2.5).

### 2.4 What the inversion actually is

Not a bug in the branch. It is the visible consequence of `42d9d15`:

> **The five titles that cannot be watched are the only ones routed to their own description page. The 91 that can be watched, and the 86 that can be sold, are not.**

Bollywood is simply where that finally became legible, because it is the only tab where both branches render side by side.

**Two alternative readings, handled:** grid *ordering* inversion is **ruled out** — `playableFirst` (`components/BrowsePage.tsx:311-314`) is applied at `:317`/`:326`/`:357`, and Bollywood's base length (10) is ≤ `CURATED_MAX` (12), so `:326` returns `playableFirst(base)` unshuffled; live sorts before soon. A *content/language* inversion (English-titled live rows on the Bollywood tab: `falling-for-flatmate`, `salt-and-pepper`, `the-breakup-podcast`, `reset`) **could not be ruled out** — see §11.

### 2.5 Nothing tests any of it

- `scripts/test-payment-integrity.mjs:692-698` asserts each coming_soon row is `!isSeriesPurchasable` and `MUX_MAP[slug] === undefined`.
- `scripts/test-feed-integrity.mjs:273` collects `soon`; the walk at `:282` iterates `live` only; `soon` is re-used at `:355-367` for two more checks — **also sellability and playback rows**.
- Broader sweep: `grep -rni "soon" scripts/` returns no href, route, or `generateStaticParams` assertion anywhere. `scripts/test-feed-integrity.mjs:36` does read `BrowsePage.tsx`, but only asserts an opacity/animation control scan (`:187-199`) and poster load-gating (`:210+`).

Per `AGENTS.md`'s feed-integrity rule ("a check must name the defect it prevents"), the defect this branch prevents — a coming-soon tile linking to a 404 episode route — is unguarded. That is the concrete gap if someone wants a check that earns its place.

### 2.6 Six code comments in this area are FALSE

Do not let a downstream agent trust these over the code. All VERIFIED false against the tree and against production:

| Location | Claim | Reality |
|---|---|---|
| `lib/catalog.ts:1193-1194` | "no page is built and **no URL resolves**" | URL resolves 200 (dynamicParams default true) |
| `lib/catalog.ts:1195-1196` | "BrowsePage renders them as inert tiles: **no `<Link>`**, no episode route, nothing to tap" | `BrowsePage.tsx:1147-1153` is a real `<Link>` |
| `lib/catalog.ts:1187` | "These **six**" | Five remain (`love-in-double-dose` pulled, per `:1258-1263`) |
| `app/page.tsx:45-46` | "Coming-soon rows build no page… Linking them would hand crawlers a **guaranteed 404**" | 200 |
| `app/discover/page.tsx:27-28` and `:64-66` | "A coming-soon title builds no page" | 200; and the `coming_soon` pill at `:110-117` is unreachable because `:18` binds `getLiveSeries()` |
| `app/discover/[genre]/page.tsx:194-197` | "coming-soon titles build no such page… a guaranteed 404" | 200 |

`git blame`: **all six false comments were authored by `951dbbb`**. The one true comment (`components/BrowsePage.tsx:1093-1098`) came from `67fe50c`, five minutes later, which changed the behaviour and did not update the comments it invalidated.

**Latent, not live:** `components/SeriesCard.tsx:13` hard-codes `/series/${series.slug}/1` while `:56` renders a "Soon" badge on the same tile — the exact 404 the BrowsePage branch prevents. Its only consumer is `components/ChannelRow.tsx:33`, which has **no importer anywhere** (only `docs/REFACTORS.md:62`, `docs/reference/COMPONENTS.md:27`, `docs/reports/AUDIT.md:50` and `:141`). Dead today; one import away from shipping five 404s.

---

## 3. PLAYER ARCHITECTURE

### 3.1 The rail is native CSS scroll-snap with hand-rolled virtualization

No third-party pager. VERIFIED, `components/EpisodeFeed.tsx:1848-1876` — one scroller `<div>`:

- vertical branch `:1864-1874`: `height: "var(--feed-h, 100dvh)"` `:1866`, `overflowY: "auto"` `:1867`, `scrollSnapType: "y mandatory"` `:1869`, `overflowAnchor: "none"` `:1873` (comment at `:1871-1872`: scroll anchoring fights the spacer resizes)
- horizontal branch `:1853-1863`: same, with `scrollSnapType: "x mandatory"` `:1860`. Horizontal is wired **only** for `storage-pirates` — `app/series/[slug]/[episode]/page.tsx:125` `const isHorizontalSwipe = slug === "storage-pirates";`, passed at `:180`. (The comment at `EpisodeFeed.tsx:1847` says "horizontal for red carpet" — **stale**; red carpet plays vertical.)

No dependency: `package.json` has no react-window / react-virtuoso / @tanstack/react-virtual / swiper / embla / keen-slider / framer-motion. The only runtime player dep is `hls.js ^1.6.16`. Every `transform`/`translate` in the file is on overlays and keyframes, never the scroller or slides.

Dead CSS trap: `app/globals.css:56-70` defines `.snap-feed`/`.snap-card` with `scroll-snap-type: y mandatory`. **They have no consumer** — the rail is styled purely inline. Anyone grepping `scroll-snap` will hit them; ignore them.

`--feed-h` is defined in exactly one place: `app/globals.css:729`, inside `@media (min-width: 520px)`. **On an iPhone the variable is unset** and every height in the rail resolves through the `100dvh` fallback — scroller, all five slides, both spacers. A dvh change (URL-bar collapse) resizes all of them simultaneously, which is exactly what `overflowAnchor: "none"` stops the browser from compensating for.

### 3.2 Windowing

```
:1458  const WINDOW = 2;
:1500  const MAX_SPAN = WINDOW * 2 + 1;          // 5
:1878-1886  leading spacer  height: calc(var(--feed-h, 100dvh) * ${windowStart})
:1889  {episodes.slice(windowStart, windowEnd + 1).map((ep, wi) => {
:1942-1950 trailing spacer  height: calc(var(--feed-h, 100dvh) * ${episodes.length - 1 - windowEnd})
```

Slides carry `scrollSnapAlign: "start"` and `scrollSnapStop: "always"` (`:1902` horizontal, `:1907-1908` vertical); slides are keyed by `ep.number` (`:1893`), not index, so a slide remounts only when its episode genuinely leaves the window. Spacers are **unkeyed and carry no snap properties**.

**Total rail height is exactly `episodes.length` viewports**, algebraically: `windowStart + (windowEnd − windowStart + 1) + (length − 1 − windowEnd) = length`. A brute-force simulation of `:1479-1506` over every `(episodes.length, activeIndex, windowCenter)` triple for lengths 1–6, 60, 91 confirmed: **max rendered slides is 5 in every case, and `activeIndex` is never outside `[windowStart, windowEnd]`.**

**Caveat for anyone doing positional DOM indexing:** the container has **5, 6, or 7** direct children depending on scroll position — the spacers are conditional (`:1878` `windowStart > 0`, `:1942` `windowEnd < episodes.length - 1`). The code already knows this and warns twice (`:1508-1510`, `:1522-1523`); both scroll-targeting paths look slides up by `[data-index="…"]` (`:1516`, `:1653`). Do not regress that.

### 3.3 **THE 60-COUNTER ANSWER: how tall is the rail for a viewer entitled to five episodes?**

**The full series. 60 viewports. Entitlement never shortens the rail; it only nulls the video source.**

VERIFIED at `app/series/[slug]/[episode]/page.tsx:104-119`:

```
:104  const freeCount = series.freeEpisodes;
:105  const allEpisodes = getEpisodesForSeries(slug);
:106  const feedEpisodes: FeedEpisode[] = allEpisodes.map((e) => {
:108    const catalogFree = e.number <= freeCount;
:115    playbackId: catalogFree ? mux?.playbackId : undefined,
:116    requiresAuthorization: !catalogFree,
:117    isFree: catalogFree,
```

No `.filter`, no `.slice`, no length clamp anywhere in the function. The source is unfiltered too (`lib/catalog.ts:1384` loops `for (let i = 1; i <= series.episodeCount; i++)`).

`freeEpisodes` is declared on the props interface at `components/EpisodeFeed.tsx:70` and passed at `app/series/[slug]/[episode]/page.tsx:178`. **`grep -n freeEpisodes components/EpisodeFeed.tsx` returns line 70 and nothing else.** It is absent from the destructure at `:1147-1157` and from the entire body. It is shipped over the wire (`freeEpisodes\":5` is in the production flight payload) and read by nothing.

**MEASURED (prod), unauthenticated,** `/series/falling-for-flatmate/6`: the SSG payload ships **60 episode objects, 5 `isFree:true` / 55 `isFree:false`, 5 real playbackIds and 55 `$undefined`**. The live scroller reports `scrollHeight 40417 / clientHeight 674 = 59.97 viewports`. Deep-linking `/30` serves five slides `data-index 27…31` between a 27-viewport and a 28-viewport spacer (27+5+28 = 60).

**Consequence: there is no structural upper bound on the episode index below `episodes.length`. A counter reaching 60 requires no bug at all — 55 accepted adjacent steps is a legal traversal of the rail as built.** 82 of 91 live series have ≥50 episodes; the longest is 65 (`help-im-falling-in-love-with-my-rude-ceo`).

**Do not read "60 slides scrollable" as "60 pipelines."** At most 5 `EpisodeSlide`s exist in the DOM; the other 55 viewports are two empty divs. This claim explains the *counter* and the *black screen*. It does not by itself explain the jetsam kill.

### 3.4 A blocked slide is black by construction and says nothing

VERIFIED:

- `:201-205` `const hlsUrl = blocked ? null : episode.requiresAuthorization ? (authorizedSource?.url ?? null) : directFreeUrl;`
- `:1933` `blocked={!ep.isFree && !authFree}`
- `:661` attach effect: `if (!hlsUrl || !shouldLoad) return;` — no Hls constructed, no `src`
- Three watchdogs all early-return on `blocked`: source watchdog `:570` (`if (!isActive || blocked || hlsUrl || sourceError) return;`, 12,000 ms), stall messaging `:592` (`if (!vid || !isActive || blocked) return;`), stall-rebuild `:644` (`if (!isActive || !sourceReady || started || blocked) return;`)
- Both visible states are gated on `!blocked`: spinner `:1003`, error card with Try again / Back to browsing `:1022`
- Slide background is `#000` (`:950`); `posterUrl` is passed as `""` for every slide except the entry one (`:1915`), so **after the first swipe every slide loses its poster** (deliberate; comment `:1274-1279`)

**MEASURED (prod)** at `/30` unauthenticated: all 5 mounted `<video>` elements have empty `src`, `readyState 0`, `networkState 0`. At `/5`: index 5 (episode 6, paid) has `preload="auto"` and no source, while indices 3 and 4 carry `blob:` MSE sources — exactly what `:470-472` predicts (`vid.preload = isActive || isNear ? "auto" : "none"`, which consults proximity and never `blocked`).

**Every one of the 55 slides past the free boundary renders pure black with no spinner, no error, no retry.** If the paywall does not mount, nothing at all explains the screen to the viewer.

### 3.5 Simultaneous media

- **5 `<video>` elements** — created unconditionally at mount. `useLayoutEffect(…, [])` at `:336`/`:460`; the non-adopt branch `:430-440` does `document.createElement("video")` `:431` and `box.appendChild(vid)` `:438` with no proximity test. (5 is the *maximum*: a cold deep-link to episode 1 mounts 3 slides, episode 2 mounts 4.)
- **≤3 hls.js/MSE pipelines** — `:659` `const shouldLoad = isActive || isNear;` and `:1917` `isNear={Math.abs(i - activeIndex) <= 1}`. Teardown when a slide leaves ±1 at `:781-795` (`destroy()`), so the count is bounded, not accumulating. **For an unentitled viewer past episode 5 the pipeline count is 0** while the 5 elements still exist.
- **+1 uncapped orphan for up to 12 s** — `lib/instant-player.ts:88-97` constructs with `capLevelToPlayerSize: false` (`:94`); `TTL_MS = 12_000` (`:35`), armed at `:78-80`. `:58` `if (typeof window === "undefined" || !playbackId) return;` fires **before** `destroyInstantPlayer()` at `:60`, and `adoptInstantPlayer` (`:126`) likewise returns null on a mismatched id without clearing `current`. `destroyInstantPlayer` has no external caller and there is no route-change cleanup, and the element is a child of `<body>` — so an orphan survives the SPA navigation for its full TTL.

**Probe note:** on a poster-tap entry one of the five videos is a fixed-position child of `<body>`, not a descendant of the feed container. `feed.querySelectorAll("video")` reports 4; use `document.querySelectorAll("video")`.

### 3.6 The index has exactly one writer

- `:1269` `const [activeIndex, setActiveIndex] = useState(…)`
- `grep -n setActiveIndex` returns exactly two hits: `:1269` (declaration) and `:1606` (the sole call), inside `observerCallback`. Never aliased, never passed as a prop.
- `activeIndexRef.current` is assigned at exactly two places: `:1409` (unconditional, render-phase) and `:1605` (immediately before `setActiveIndex`).
- The counter is a pure function: `activeEp = episodes[activeIndex]` (`:1452`), rendered at `:2218` (`EP {activeEp?.number} / {totalEpisodes}`), `:2157`, and `:1956` (`EpisodeToast`).
- `EpisodeFeed` is mounted once at `app/series/[slug]/[episode]/page.tsx:172` with **no `key` prop**, and the URL moves via `history.replaceState` (`:1622`), not a Next navigation — so the parent cannot reset the cell by remount and `startEpisode` never changes under a live feed.

**One setter is not one cause.** The observer only *reports*; the causal input is the scroll position. Two places move the scrollport programmatically: `:1517` `scrollIntoView({ behavior: "instant" })` on mount, and `:1556` `scrollIntoView({ behavior: "smooth" })` inside `handleEpisodeEnded`. Anything that scrolls the container writes the index by proxy.

### 3.7 The observer's two guards bound step size, never total

- `:1570-1576` reduces each batch to its single highest-ratio entry (`entry.intersectionRatio >= 0.55`) before deciding.
- `:1601` `if (!firstSettle && prev !== idx && Math.abs(idx - prev) > 1) continue;`

Neither consults a run counter or the rail length. **Walking 5 → 60 is 55 adjacent single steps, so neither guard applies.** The code says so itself at `:1535-1543`. Observer re-subscribes on `[episodes, observerCallback, windowStart, windowEnd]` (`:1644`) with `container.querySelectorAll("[data-index]").forEach(el => observer.observe(el))` (`:1642`).

The *total* bound was correctly placed on the driver instead (§5).

### 3.8 The other two rails

`components/ShortsFeed.tsx` and `components/HorizontalFeed.tsx` are separate routes (`/shorts`, `/horizontal`, both 200 on production) and are **not** on the founder's crash path. Both construct Hls with **no rendition cap**:

- `ShortsFeed.tsx:322` `new Hls({ maxBufferLength: 15, enableWorker: true, startLevel: 0, abrEwmaDefaultEstimate: 1_000_000 })`. **Correction to a common misreading:** ShortsFeed is a *single-player source-swapper*, not a mounted rail. One `<video>` (`:421-429`), one `<img>` (`:412-419`), and `shuffled.map` at `:447-458` renders **empty snap spacer divs with no children**. `:253-256` destroys the previous instance before constructing the next. Cost: **one** uncapped pipeline, not fifteen. It is the least memory-exposed of the three rails.
- `HorizontalFeed.tsx:80` — `maxBufferLength: 20`, uncapped. 15 cards mount (`:282-284`), each `<video preload="none">` (`:177-184`). Hls is created lazily on tap (`:130 → :146 → :147 → :80`) and **never released**: the only `destroy()` is the unmount cleanup (`:92-97`); the IntersectionObserver (`:118-128`) calls `vid.pause()` on scroll-out, with no `stopLoad()` and no `destroy()`. **Worst case: up to 15 simultaneously live, uncapped Hls instances**, reachable by ordinary tapping. 8 of the 15 source assets are 1920×1080.
- Third uncapped constructor, deliberate: `lib/instant-player.ts:94`, with the reason inline ("element is 2px until adopted — don't cap").

`npm run audit:perf` (`scripts/audit-perf.ts:148-177`) currently prints: ✅ EpisodeFeed caps · ⚠️ HorizontalFeed uncapped · ⚠️ instant-player uncapped. **`ShortsFeed.tsx` is absent from that check's file list at `scripts/audit-perf.ts:149`** — a real guardrail gap.

---

## 4. ENTITLEMENT FLOW

### 4.1 The boundary is per-title data, not a constant

- `lib/catalog.ts:78` `freeEpisodes: number;` (required, non-optional).
- Normalizer, top-level side effect that **mutates the exported array in place**, `lib/catalog.ts:1273-1280`: skips non-live (`:1274`), reads `MUX_MAP[s.slug]?.length` (`:1275`), sets `s.episodeCount = streams` (`:1277`), then **`:1278 if (s.freeEpisodes > streams) s.freeEpisodes = streams;`**
- Expansion: `lib/catalog.ts:1387` `const isFree = i <= series.freeEpisodes;`

86 live titles ship `freeEpisodes: 5`; five are wholly free.

**The clamp is not dead code, and the source literals are not the shipped numbers.** `the-dumb-billionaire-heiress-in-love` reads 58/58 in source (`lib/catalog.ts:122, 124`) but `MUX_MAP` holds 50 streams, so it **ships as 50/50**. `storage-pirates` reads 14/14 (`:761-762`) and ships 13/13. Conversely the normalizer *raises* `episodeCount` for 68 live titles (`the-mistress-trap` 48 → 61).

**Two-truths hazard:** anything that *imports* `catalog`/`SERIES` sees post-normalization values. Anything that reads `lib/catalog.ts` as *text* sees pre-normalization values — that includes every `.mjs` gate via `scripts/parse-catalog-source.mjs:81`. Those scripts re-derive the clamp themselves (`scripts/test-feed-integrity.mjs:311` uses `Math.min(s.freeEpisodes, pub.length)`). Do not assume the two paths agree by construction.

**Residual constants** (`AGENTS.md` working agreement: "never hard-code a universal free-preview count"): `lib/config.ts:17 FREE_EPISODES = 5` consumed at `app/series/[slug]/page.tsx:335` (`?? FREE_EPISODES` — unreachable, the field is required) and `app/llms.txt/route.ts:42`; `components/Player.tsx:65` default param `= 5`; `components/SeriesInfoDrawer.tsx:365` `(series.freeEpisodes ?? 5)`; `app/c/[slug]/page.tsx:310` `(series.freeEpisodes ?? 5)`. None can fire today; each would silently paywall a wholly-free title if the field were made optional.

### 4.2 Three enforcement points doing three different jobs

| Layer | Where | What it enforces |
|---|---|---|
| **SERVER** | `app/api/playback/[episode]/route.ts:66` `const isFree = epNum <= series.freeEpisodes;` and `:85-92` returns **402** `{status:"paywall"}` when `!isFree && !isVip && !hasPurchased` | **Media access.** MEASURED (prod, anonymous): `/api/playback/falling-for-flatmate--6` → 402; `--1` → 200 `policy:"public"` |
| **BUILD** | `app/series/[slug]/[episode]/page.tsx:104-119` | **Data shape.** Stamps `isFree`/`requiresAuthorization`, drops the playback id for paid rows. MEASURED in the prod RSC payload: 5 real ids, 55 `$undefined` |
| **CLIENT** | `components/EpisodeFeed.tsx:1209-1262`, `:1304-1316` | **Navigation.** A CSS overlay. Nothing else. |

**Neither of the first two stops navigation.** The only thing that stops a viewer moving past episode 5 is `showUnlock`.

### 4.3 The client resolution chain

`components/EpisodeFeed.tsx:1209-1262`, VERIFIED line by line:

```
:1196-1203  authFree seeded optimistically true iff ?session_id starts with "cs_"
:1207       const [authResolved, setAuthResolved] = useState(false);
:1218-1222  on slug change: reset authFree, authResolved := false
:1235-1244  if session_id: await /api/unlock/confirm → on success setAuthFree(true), remember in localStorage["verza-unlock:<slug>"], return
:1246-1248  const r = await fetch(`/api/access?slug=${seriesSlug}`);
            const d = r.ok ? await r.json() : null;
            if (!stale && d?.full) { setAuthFree(true); return; }
:1251-1257  else re-verify a remembered Checkout session
:1258       if (!stale) setAuthFree(false);
:1259       })().finally(() => { if (!stale) setAuthResolved(true); });
```

### 4.4 What triggers the paywall — and the two ways it does not

`components/EpisodeFeed.tsx:1304-1316`:

```
:1305  const ep = episodes[activeIndex];
:1306  const locked = !!ep && !ep.isFree && !authFree;
:1309  if (!locked || !authResolved) { setShowUnlock(false); return; }
:1310  const t = setTimeout(() => {
:1311    setShowUnlock(true);
:1312-13   trackUnlockPrompt(…); emit("paywall_viewed", …);
:1314  }, 250);
:1315  return () => clearTimeout(t);
:1316  }, [activeIndex, authFree, authResolved, episodes, seriesSlug]);
```

Live in the deployed bundle verbatim: `let r=setTimeout(()=>{A(!0),(0,i.trackUnlockPrompt)(e),(0,o.emit)("paywall_viewed",{…})},250);return()=>clearTimeout(r)},[R,g,w,u,e])`.

The overlay is a **sibling of the scroller**, `absolute inset-0 z-[60]` (`:2243`), inside `.episode-immersive` (`position: fixed; inset: 0; z-index: 50`, `app/globals.css:706-712`). No `pointer-events: none` on it or any ancestor. Measured on prod: z-index 60, `pointer-events auto`, rect 394×674 exactly covering the 394×674 scroller, and `document.elementFromPoint(centre)` returns the overlay's contents. Its `fadeIn` animation is opacity-only, and an opacity-0 element still takes touches — so it blocks from mount frame 0. Once up, the only exits are the Unlock button and `Go Back` (`:2372-2395`); there is no tap-outside dismiss.

**FAILURE MODE A — debounce starvation.** The cleanup at `:1315` clears the pending timer on **every** `activeIndex` change. Swiping faster than one slide per 250 ms means the overlay never mounts. This is a true property of the code and it is still live.
*But:* every slide carries `scrollSnapStop: "always"` (`:1902`, `:1908`), so one gesture crosses at most one snap point. Index 5 → 59 at sub-250 ms steps requires ~55 discrete gestures at >4/sec sustained for ~14 s, and the instant the viewer pauses 250 ms the overlay mounts and blocks. **Debounce starvation cannot produce a hands-off climb.** (§10.4)

**FAILURE MODE B — `authResolved` never settles.** `:1309` forces `setShowUnlock(false)` whenever `!authResolved`. `authResolved` becomes true only in the `.finally()` at `:1259`. The `/api/access` fetch at `:1246` has **no `AbortController` and no timeout**. If it hangs rather than rejecting, `.finally()` never runs, `authResolved` stays false forever, and a locked slide renders with **no paywall and no playbackId** — the reported symptom's exact shape.
The asymmetry is stark: `lib/playback-client.ts:48` sets `PLAYBACK_REQUEST_TIMEOUT_MS = 12_000` and `:143-144` wires an `AbortController` + timer. `/api/access` has neither. **DERIVED, not observed.**

**FAILURE MODE C — a 429 reads as "not entitled".** `middleware.ts:40` puts every unlisted `/api/*` route in one catch-all tier of **30 requests per minute**; `:115` keys the bucket `${ip}:${limit}`, so **`/api/access`, `/api/playback/*`, `/api/watch-progress`, `/api/saved-list` and `/api/events` share a single 30/min bucket per IP** (`WINDOW_MS = 60_000` at `:20`). A 429 makes `r.ok` false at `:1247`, `d` becomes `null`, the chain falls through to `setAuthFree(false)` at `:1258` — **paywalling a paying customer and turning their purchased episodes black.** A binge generates one `/api/playback` per paid episode plus a `/api/watch-progress` POST every 10 s (`EpisodeFeed.tsx:847-859`) plus analytics beacons. VERIFIED code; the real-world request rate is UNKNOWN (§11).

### 4.5 The iOS branch of the paywall has no purchase path

`components/EpisodeFeed.tsx:2259` renders `iosApp ? "Episode Unavailable" : "Unlock All Episodes"`; `:2263` "This episode isn't available in this app."; the benefit list (`:2266-2281`), the `$1.99` (`:2282-2289`) and the entire checkout button (`:2290-2345`) are gated `!iosApp`. Correct for `AGENTS.md` rule 11 — and it means an iOS web-view viewer hits a dead end with no StoreKit CTA. Whether the native client intercepts before this point is UNKNOWN (`../verza-native` is not in this working tree).

---

## 5. MEMORY

### 5.1 Verdict on each of the five shipped fixes

All five are present in the tree at `e6cff6a` **and** in the bundle live on `www.verzatv.com` (chunk `/_next/static/immutable/chunks/13rz7ciqnwv2l.js`, the only chunk containing both `episode-immersive` and `scrollSnapType`; it also carries strings distinctive to `e6cff6a` and `e856cca`, so production is at or after HEAD). **None is missing. Two are half-applied and one introduced a new defect.**

---

**FIX 1 — `maxDevicePixelRatio: 1`. Verdict: SHIPPED, HALF-APPLIED. The cap does not bind on the most common entry path.**

Source: `components/EpisodeFeed.tsx:702` `capLevelToPlayerSize: true`, `:713` `maxDevicePixelRatio: 1` (rationale comment `:703-712`). Prod bytes: `capLevelToPlayerSize:!0,maxDevicePixelRatio:1`.

But: on a poster tap, `EpisodeFeed` **adopts** the instant player's instance (`:340`, `:384`) and the attach effect early-returns for it (`:662`, with `attachedRef.current = true` at `:385`). The adoption block `:388-420` only swaps the ERROR handler; **it never touches the level cap.** Nothing in the repo sets `capLevelToPlayerSize`/`maxDevicePixelRatio`/`autoLevelCapping` on an adopted instance. `lib/instant-player.ts:94` sets `capLevelToPlayerSize: false` deliberately (2px element).

**So the episode the viewer tapped into plays uncapped — bandwidth-only ABR, up to 1080p on 5G — for the whole time they watch it and while it is a ±1 neighbour, until the ±2 teardown at `:781-795`. Minutes, not 12 seconds.** Only the two neighbours and cold-navigation slides get the capped config. This is what the handoff instructed (P1: "**Not** a blind copy to `lib/instant-player.ts`"), so it is intended — but its effect on the dominant path is nil.

Second-order: even where the cap does bind, the measured Mux ladder makes it a 2-pixel margin — 480×854 is selected only while `max(cssWidth, cssHeight) <= 854`.

---

**FIX 2 — one ERROR handler per instance. Verdict: SHIPPED, AND IT IS A REGRESSION.**

Source: `components/EpisodeFeed.tsx:402` `ahls.off(AdoptedHls.Events.ERROR);` then `:403` `ahls.on(...)`. Prod bytes: `t.off(e.Events.ERROR),t.on(e.Events.ERROR,…)`. `.off(` occurs exactly once in the chunk.

**`off(Events.ERROR)` with no listener argument removes every ERROR listener on the instance, including hls.js's own internal ones.** hls.js 1.6.16: `Hls.prototype.off` → eventemitter3 `removeListener`, whose first branch is `if (!fn) { clearEvent(this, evt); return this; }` (`node_modules/hls.js/dist/hls.js:36795-36800`, `:423-429`). hls.js registers ~11–13 internal `hls.on(Events.ERROR, this.onError, this)` subscriptions from controller constructors (`:4198, :4980, :9455, :18614, :19203, :22587, :25698, :28226, :33633, :33826`, plus `errorController.onErrorOut` at `:36741`).

Among them: `StreamController.onError` and `BufferController.onError` — the handlers that implement `reduceLengthAndFlushBuffer`/`flushMainBuffer` on `BUFFER_FULL_ERROR` and `recoverWorkerError` on `INTERNAL_EXCEPTION`. **On the adopted instance — the active, full-screen, uncapped pipeline — hls.js's own memory-shedding and recovery path is gone.** The code comment at `:400-401` states the removal is intentional ("Passing no listener removes every ERROR listener on this instance") but does not appear to account for the internals.

---

**FIX 3 — `stopLoad()` on non-active neighbours. Verdict: SHIPPED AND CORRECT. It is the lower-risk half of P3; P3 proper was not taken.**

Source: `components/EpisodeFeed.tsx:808` `hlsRef.current?.startLoad()` on re-activation, `:822` `hlsRef.current?.stopLoad()` on `!isActive || blocked`. Prod bytes present.

`isNear` is still `Math.abs(i - activeIndex) <= 1` (`:1917`) — three pipelines are still **attached**. `stopLoad` reduces buffering, not attach count. The comment at `:815-821` says so explicitly.

---

**FIX 4 — `ended` requires a composited frame. Verdict: SHIPPED AND CORRECT. This is the fix that actually stopped the reported runaway.**

Source: `components/EpisodeFeed.tsx:883` `if (!startedRef.current) return;` then `:884-886` requires `Number.isFinite(duration) && duration > 0 && vid.currentTime >= duration - 1.5`. `startedRef` flips only on a composited frame (`:429`, `:934`).

Prod bytes: `function n(){if(!t||!U.current)return;let r=t.duration;Number.isFinite(r)&&r>0&&t.currentTime>=r-1.5&&(…)}`. `U` is provably `startedRef`: the teardown minifies to `…U.current=!1,U.current=!1,…`, the duplicated assignment being the accidentally duplicated `startedRef.current = false;` at source `:790-791` — a unique fingerprint; and all four `U.current=!0` sites sit inside the `onFirstFrame` callback.

The comment at `:862-887` names the exact reported failure. **Auto-advance can no longer walk past episode 5 at all: blocked slides have no video, so nothing fires a real `ended`.**

---

**FIX 5 — cap on consecutive unattended auto-advances. Verdict: SHIPPED AND CORRECT, BUT WEAKER THAN IT READS.**

Source: `:85 ADVANCE_COOLDOWN_MS = 700`, `:89 MAX_UNATTENDED_ADVANCES = 8`, enforced `:1533` (cooldown) and `:1544` (`if (autoAdvanceRunRef.current >= MAX_UNATTENDED_ADVANCES) return;`), incremented `:1545`. Prod bytes: `let t=Date.now();if(t-ec.current<700||(ec.current=t,eu.current>=8))return;eu.current+=1` (the minifier fused the two guards; semantically identical).

**The reset is the weakness.** `:1391-1404` registers `pointerdown`, `touchstart`, `wheel`, `keydown` **on `document`**, each setting `autoAdvanceRunRef.current = 0` (`:1392`). The comment (`:1387-1390`) says this is deliberate — "a tap on the overlay chrome counts just as much as a swipe." **A viewer tapping a black screen re-arms 8 more advances; roughly 7 taps still walks 5 → 60.** The cap bounds only the strictly hands-off case.

### 5.2 A sixth "shipped" item is regressed

The handoff (`docs/handoff/IOS-CONTENT-PROCESS-CRASH.md:45-48`) records "`EpisodeFeed` — unmount teardown now clears `src` + `load()`". **The current teardown only pauses and removes.** Low impact (when an Hls instance exists, `destroy()` does this internally) but the doc and the code disagree.

### 5.3 Peak footprint, corrected

| Item | Handoff's figure | Verified |
|---|---|---|
| Slides mounted | — | ≤5 (`MAX_SPAN`) |
| `<video>` elements | — | ≤5, +1 orphan instant-player |
| Hls instances | 3 | ≤3 from the feed, +1 orphan for ≤12 s = **4** |
| Transmux Workers | "one per attached slide" | **ONE shared** — hls.js 1.6.16 refcounts a per-version `workerStore`. **The handoff is wrong here.** |
| SourceBuffers | 1 per instance | **2 per instance** — every Mux master playlist sampled (4, one series) carries a separate `EXT-X-MEDIA` audio rendition, so **6–8 coexist** |
| Decoded posters on the episode route | — | modest and self-limiting: ≤2 full-viewport images on the start slide; the Next/Image one measures 1024×1536 = **6.29 MB decoded** (measured from the optimizer output) |

### 5.4 Which of P1–P5 remain open

| | Status |
|---|---|
| **P1 — cap the rendition** | **HALF-DONE.** Capped on fresh attaches; **not** on the adopted instance, which is the active pipeline on every poster tap. |
| **P2 — drop the duplicate ERROR handler** | **DONE, BUT HARMFUL.** Blanket `off()` also stripped ~13 internal hls.js listeners including buffer-shedding recovery (§5.1). Needs replacing with a scoped `off(Events.ERROR, thatOneListener)`. |
| **P3 — one look-ahead, forward only** | **HALF-DONE.** The lower-risk `stopLoad()` variant shipped; `isNear` is still ±1 and three pipelines remain attached. |
| **P4 — `/horizontal`** | **UNTOUCHED.** Up to 15 uncapped Hls instances, never released (§3.8). The handoff's "mitigated today by `preload='none'`" is weaker than stated — that only stops the pre-tap fetch, not the instance the tap creates. |
| **P5 — keep `MUX_MAP` out of the player route's client graph** | **UNTOUCHED, PREMISE SHRUNK.** The chain is intact: `app/layout.tsx:140` `<Header />` → `components/Header.tsx:6,41` → `components/SearchButton.tsx:8` `import { getLiveSeries } from "@/lib/catalog"` → `lib/catalog.ts:5` `import { MUX_MAP } from "./mux-public-map"`. The header is **hidden by CSS only** on the player (`app/globals.css:716` `:has(.episode-immersive) header`), so it stays mounted. But the handoff's "390KB chunk with all 4,616 playback ids" is **stale**: the runtime map is the 519-row public projection (`lib/mux-public-map.ts`, 5,137 lines / 208,664 bytes source; measured **156,628 raw / 37,569 br** on the wire) and **is no longer the largest asset on the route.** |

---

## 6. i18n

### 6.1 The layer

No library. One in-house file, `lib/i18n.ts` (647 lines): **88 flat keys × 20 locales** as inline TypeScript objects, plus `LOCALES` (`:12-33`). Consumed through a React **client** context, `components/LangProvider.tsx` (mounted at `app/layout.tsx:133`).

**Locale is never detected.** `LangProvider` hard-starts at `DEFAULT_LOCALE` ("en") and hydrates only from `localStorage[STORAGE_KEY]` (`components/LangProvider.tsx:37`). VERIFIED: `Accept-Language: es-ES` gets English.

### 6.2 The full list of surfaces bypassing the layer

**Only 10 files import `useTranslation`, and only 5 render translated copy.**

Importers (VERIFIED, `grep -rln useTranslation app components lib`):

| File | Mounted? | Renders `t()`? |
|---|---|---|
| `components/LangProvider.tsx` | — | is the layer |
| `components/ContentTranslator.tsx` | `app/layout.tsx:134` | **no** — reads `locale` for side effects only |
| `components/LangDropdown.tsx` | `components/Header.tsx` | yes |
| `components/BottomNav.tsx` | `app/layout.tsx:146` | yes (3 calls) |
| `components/CategoryTabs.tsx` | `components/BrowsePage.tsx` | yes |
| `components/LanguagePicker.tsx` | `app/me/page.tsx` | yes (2 calls) |
| `components/LibraryPage.tsx` | `app/library/page.tsx` | yes (5 calls) |
| `components/CoinPaywall.tsx` | **no importer** | dead (4 calls) |
| `components/SeriesInfoButton.tsx` | **no importer** | dead (1 call) |
| `components/SeriesInfoDrawer.tsx` | only `SeriesInfoButton` | dead |

**Live translated surfaces: 5** — `BottomNav`, `CategoryTabs`, `LangDropdown`, `LanguagePicker`, `LibraryPage`. Only **20 of 88 keys (23%)** are ever rendered. Every `auth.*`, `legal.*`, `tab.*`, `browse.*`, `misc.*` and `horizontal.*` key is translated into 20 languages and never used.

**Everything else bypasses the layer.** That is **59 of the 64 page routes** plus every player, checkout and commerce surface. The high-value ones, named:

- **The in-feed paywall** — `components/EpisodeFeed.tsx:2258-2360`. Hard-coded English throughout: `:2259` "Unlock All Episodes" / "Episode Unavailable"; `:2263-2264` body copy; `:2269-2270` benefit lines; `:2286` "one-time Series Unlock"; `:2343` "Series Unlock — $1.99 one-time". **The worst case: it is the one screen where the language switcher is hidden**, because `app/globals.css:716` hides the header (and with it `LangDropdown`) whenever `.episode-immersive` is present.
- **The show page** — `app/series/[slug]/page.tsx`, all 344 lines, including the free-preview badge and the $1.99 card.
- **The home page and browse grid** — `app/page.tsx`, `components/BrowsePage.tsx` (except the tab strip via `CategoryTabs`).
- **Auth** — `/sign-in`, `/sign-up`, `/forgot-password`, `/reset-password`.
- **Legal** — `/terms`, `/privacy`, `/refund-policy`, `/editorial-standards`, `/legal/creator-agreement`.
- **Commerce** — `/shop`, `/shop/[slug]`, `/amazon`, `CartDrawer`, `AmazonBag`.
- **Search** — `/search`, `/discover`, `/discover/[genre]`, `SearchButton`.
- **Account** — `/me`, `/me/list` (only the `LanguagePicker` widget on `/me` is translated).
- **Every SEO landing family** — `/best/*`, `/collections/*`, `/compare/*`, `/guides/*`, `/watch-in/*`, `/genre/*`, `/genres/*`, `/channels`, `/c/*`.
- **Both other players** — `ShortsFeed`, `HorizontalFeed`.

### 6.3 The structural cause

`t()` is a **client** context (`components/LangProvider.tsx:63` `useContext`). `AGENTS.md` rule 13 mandates "Prefer Server Components; use client components only for genuine interactivity." Sign-in, sign-up, terms, privacy, `/me`, `/search`, the home page and the series page are Server Components and **architecturally cannot call it**. This is not neglect; it is a design collision. Any fix has to move the dictionary to something a Server Component can read.

### 6.4 The designed fallback has never worked in production

`components/ContentTranslator.tsx` injects Google Translate. **CSP-blocked.** VERIFIED:

- `components/ContentTranslator.tsx:63` loads `https://translate.google.com/translate_a/element.js?cb=googleTranslateInit`.
- `next.config.ts:37` `script-src` **does** allow `https://translate.google.com`, and `:41` `connect-src` allows it too.
- That bootstrap is a ~3KB shim; the real ~277KB engine loads from **`translate.googleapis.com`**, which appears **nowhere** in the CSP and is not matched by `https://translate.google.com` (different host, no wildcard, no `strict-dynamic`). `git log -S` shows the host has never been in the CSP.

**DERIVED, not observed in a browser** — the arithmetic is airtight but no console violation was captured (§11).

### 6.5 Price and currency follow no locale

Not one `Intl.NumberFormat` in any client surface. `SERIES_UNLOCK_PRICE_CENTS` is never read by UI. Every price is the hard-coded literal **`$1.99`** — `components/EpisodeFeed.tsx:2284` and `:2343`, `app/series/[slug]/page.tsx:323`, `components/SeriesInfoDrawer.tsx:371` (dead), `components/Player.tsx:985` (dead — no importer; `docs/reports/VERZA_CURRENT_STATE_AUDIT.md:72` lists `Player.tsx` as unimported).

The web price is correctly iOS-gated in both live places (`app/series/[slug]/page.tsx:292-328` via `<HideInIOSApp>`; `components/EpisodeFeed.tsx:2282, 2290` via `!iosApp`), so no live web surface leaks a hard USD price into the app.

---

## 7. SEARCH

### 7.1 The exact cause of the accent failure

**There is no index and no Unicode folding. Matching is a byte-exact `String.includes()` on a lowercased haystack, applied to a lowercased query, with `.normalize()` called on neither side.**

VERIFIED, `lib/search-index.ts:104-120` — the entire matcher:

```
104  export function seriesMatchesQuery(s: Series, rawQuery: string): boolean {
105    const q = rawQuery.trim().toLowerCase();
106    if (q.length < 2) return false;
107
108    const haystack = [
109      s.title, s.genre, s.logline, s.channel,
113      ...(s.categories ?? []), ...(s.tags ?? []), ...(SEARCH_TAGS[s.slug] ?? []),
116    ].join(" ").toLowerCase();
118
119    return q.split(/\s+/).filter(Boolean).every((token) => haystack.includes(token));
120  }
```

`.toLowerCase()` is **case** folding only. It does not decompose or strip combining marks: `"español".toLowerCase()` is still `"español"`, and `"espanol".includes("español")` is `false`.

**`grep -rn "\.normalize(" app components lib` returns ZERO hits.** (The only `unicodedata.normalize` calls in the repo are in three Python data scripts — `scripts/regenerate-mux-map.py:48`, `scripts/diag-folders.py:13`, `scripts/diag-weak.py:15` — which never touch runtime search.) The colleague also confirmed zero occurrences of `normalize` in the deployed client chunk.

**Which spelling wins is decided purely by how that string was typed into `lib/catalog.ts`.** The failure is therefore **bidirectional and data-dependent, not one-directional**:

- Category **keys** are ASCII: `lib/catalog.ts:13` `| "espanol"`, `:55` `"espanol"`, and every Spanish row carries `categories: ["espanol"]` (`:1052, 1063, 1074, 1085, 1104`). The *label* is accented (`:33` `{ key: "espanol", label: "Español" }`) but labels are not in the haystack.
- Spanish **titles** are accented: `:1048` `"Sentencia de pasión"`, `:1050` `genre: "Drama · Pasión"`, `:1059` `"Engañé a mi pareja en mi noche de bodas"`, `:1070` `"Me enamoré de mi cuñado presidencial"`, `:1100` `"Estoy embarazada de mi profesor"`.

**MEASURED (prod), reproduced today:**

```
/search?q=espanol   →  5 results
/search?q=español   →  0 results     ← accented query, ASCII data
/search?q=pasion    →  0 results     ← ASCII query, accented data
/search?q=pasión    →  1 result
```

An NFD-decomposed `pasión` also returns 0 against the NFC data. **A single `.normalize("NFD").replace(/\p{Diacritic}/gu, "")` applied to both the query and the haystack fixes all four cases at once.**

### 7.2 Adjacent defects on the same surface

- **Two live matchers.** The header popover (`components/SearchButton.tsx:28`) and `/search` (`app/search/page.tsx:44`) share `seriesMatchesQuery`. `/discover`'s bar has its own, weaker, inline matcher — `components/SearchBar.tsx:15-25`: no tags, no `SEARCH_TAGS`, and **OR** across fields rather than per-token AND. Two surfaces, two behaviours.
- **The slug is not in the haystack.** `lib/search-index.ts:108-115` includes title, genre, logline, channel, categories, tags, curated tags — not `s.slug`.
- **15 live rows have no curated tags at all**, including all 5 Español and all 6 Bollywood titles — they match on title/genre/logline/category only.
- **`/search` has no link anywhere in the UI.** The header search renders results inline in a portal; its only href is `components/SearchButton.tsx:124`. `/search` is reached only from `lib/data/sitemap.ts:105, 232` (→ `components/FooterSitemap.tsx:6` ← `components/Footer.tsx:103`), from `app/sitemaps/pages.xml/route.ts:17`, and from its own `<form action="/search">` (`app/search/page.tsx:90`). `components/BottomNav.tsx` has five tabs (`/`, `/shorts`, `/shop`, `/library`, `/me`) and no search entry. (`docs/reports/VERZA_ROUTE_INVENTORY.csv:45` attributes `/search`'s inbound links to "FooterSitemap + SearchButton/FeedSearch" — **stale**.)
- **A fourth live search UI exists and does NOT go to `/series/<slug>/1`:** `components/CreatorsLanding.tsx:343` ("Search creators and shows"), results linking to `/@${c.handle}` (`:370`) and `/watch/${t.slug}` (`:402`). Mounted at `components/BrowsePage.tsx:803`.
- **Dead code:** `components/FeedSearch.tsx` (matcher + `href` at `:113`) has no importer anywhere.

---

## 8. PERSISTENCE

Verdicts: **WIRED** = writes and reads both reach a real consumer. **SHELLED** = the write path exists and runs, but nothing reads it (or the read path is gated to a population the write path does not serve). **DEAD** = no live caller at all.

| # | Surface | Store | Write | Read | Verdict |
|---|---|---|---|---|---|
| 1 | Watch progress | Supabase `watch_progress` | `EpisodeFeed.tsx:850` (throttled ~10 s, `currentTime > 5`), `:891` (on real completion), `:1681` (`keepalive`, on hide) → `POST /api/watch-progress` | `GET /api/watch-progress` → `BrowsePage.tsx:433`, `ProfileDynamic.tsx:37`, `Player.tsx:334` | **WIRED — signed-in only.** Both verbs `getUser()`-gated: POST 401s for guests (`app/api/watch-progress/route.ts:12-15`), GET returns `{items: []}` (`:77-80`). **For a guest, every second of watch position is discarded.** |
| 2 | Continue Watching rail | derived from #1 | — | `BrowsePage.tsx:588-620`, href `buildResumeUrl` at `:601` | **WIRED — signed-in only.** Empty for guests, so the rail is invisible to them. GET also drops rows whose series is no longer live (`route.ts:98-110`). |
| 3 | `verza_last_watching` (resume item) | `localStorage` | `lib/resume.ts:36-42` `saveLastWatching`, called from `EpisodeFeed.tsx:1677` and `Player.tsx:383` | **NONE.** `readLastWatching` (`lib/resume.ts:44`) and `clearLastWatching` (`:53`) have **zero callers repo-wide.** | **SHELLED.** The key is written on every backgrounding and never read by any surface. |
| 4 | Resume push notification | Service Worker | `notifyResume` (`lib/resume.ts:81`) ← `EpisodeFeed.tsx:1678`, `Player.tsx:384`; permission asked once at `EpisodeFeed.tsx:1419` | click → `sw.js` `notificationclick` → `buildResumeUrl` | **WIRED but triple-gated:** needs `Notification.permission === "granted"` (`lib/resume.ts:85`), a registered SW, and on iOS an installed PWA. |
| 5 | `?t=` deep-link resume | URL | `buildResumeUrl` (`lib/resume.ts:30-33`), emitted only from `BrowsePage.tsx:601` | `EpisodeFeed.tsx:1182-1187` reads `?t` client-side into `startPositionS`; consumed at `:1919` | **WIRED, client-side only** — correct, since the episode route is fully static. Cleared on episode change at `:1620`. |
| 6 | Saved list / My List | Supabase `saved_list` **+** `localStorage["verza-saved"]` | `EpisodeFeed.tsx:1752-1766` writes both (localStorage then `POST`/`DELETE /api/saved-list`); `ShortsFeed.tsx:196, 205` writes localStorage | `LibraryPage.tsx:169-180` (API first, localStorage fallback for guests), `ProfileDynamic.tsx:15`, `ShortsFeed.tsx:186` | **WIRED — the only dual-store surface, and the only one that degrades gracefully for guests.** No reconciliation on sign-in: a guest's local list is never merged into the account. |
| 7 | Likes | `localStorage["verza-liked-<slug>"]` only | `EpisodeFeed.tsx:1728-1736` `persistLiked`, called `:1789`, `:1802` | `EpisodeFeed.tsx:1718-1726` | **WIRED locally, DEAD server-side.** No `likes` table exists in Supabase; no API route touches likes. Per-device, per-series, invisible to the product. |
| 8 | Mute preference | `localStorage["verza-muted"]` | `EpisodeFeed.tsx:1713`, `ShortsFeed.tsx:135`, `HorizontalFeed.tsx:252`, `Player.tsx:880` | `EpisodeFeed.tsx:1287`, `HorizontalFeed.tsx:49`, `Player.tsx:451` | **WIRED.** Shared across all three players. |
| 9 | Language | `localStorage["verza-lang"]` | `LangProvider.tsx:47` | `LangProvider.tsx:37` | **WIRED** — but reaches only 5 components (§6). |
| 10 | Remembered Checkout session | `localStorage["verza-unlock:<slug>"]` | `EpisodeFeed.tsx:1240` (after a confirmed `session_id`) | `EpisodeFeed.tsx:1252` (re-verified server-side via `/api/unlock/confirm`) | **WIRED and safe** — a hint, never an authority. Consistent with `AGENTS.md` rule 4. Cleared on sign-out (`ProfileDynamic.tsx:107-108`). |
| 11 | Entitlements / purchases | Supabase, Stripe, Apple | server-only webhook/IAP routes | `/api/access`, `/api/playback/[episode]` | **WIRED.** The real gate. `/api/entitlements`, `/api/entitlements/check`, `/api/entitlements/claim` have **zero client callers** — server-to-server or vestigial. |
| 12 | Poster hand-off | `sessionStorage["verza-transition"]` | `BrowsePage.tsx:255` | `EpisodeFeed.tsx:1166`, removed at `:1177` | **WIRED.** Single-hop, self-clearing. |
| 13 | Analytics | Supabase `analytics_events` | `lib/analytics/emit.ts:76` `sendBeacon("/api/events")`, `:78` fetch fallback; anon id in `localStorage` (`:57-60`) | server-side only | **WIRED.** Shares the 30/min bucket (§4.4). |
| 14 | Push subscriptions | Supabase `push_subscriptions` | `PushNotificationToggle.tsx:66, 84` → `/api/push/subscribe` (mounted at `app/me/page.tsx`); `InstallPrompt.tsx:173` | `/api/push/send` — **zero client callers** | **WIRED for subscribe; the send side is server/cron-only.** |
| 15 | Install prompt dismissal | `localStorage` | `InstallPrompt.tsx:131` | `:43` | **DEAD.** `components/InstallPrompt.tsx` has **no importer** — consistent with the standing "never re-add InstallPrompt" instruction. |
| 16 | Cart / Amazon bag | `localStorage` (`lib/amazon-bag.tsx:59, 80`) | `CartProvider`/`AmazonBagProvider` at `app/layout.tsx:131-132` | same | **WIRED.** Commerce-side, outside this sprint. |
| 17 | Coins / season pass | — | — | — | **DEAD by policy.** `/api/coins/balance`, `/api/coins/purchase`, `/api/unlock/season-pass` have zero client callers; `components/CoinPaywall.tsx` has no importer. Consistent with `AGENTS.md` rule 2 ("Coins, per-episode unlocks… are disabled/fail-closed"). |

**The headline persistence defect:** a guest who watches four free episodes and closes the tab loses everything. `POST /api/watch-progress` 401s (#1), the localStorage fallback that would cover them is write-only (#3), and the Continue Watching rail that would surface it is server-backed (#2). The pieces of a working guest-resume path all exist and are not connected to each other.

---

## 9. OWNERSHIP AND CONFLICTS

**Caveat: the sprint brief did not name the six lanes.** The split below is *my proposal*, derived from the conflict surface in the code — specifically, from keeping the two agents who must both edit `components/EpisodeFeed.tsx` down to two, and from putting the rail and the memory work in one hand because they are the same 400 lines.

### 9.1 Proposed lanes

| Lane | Owns | Primary files |
|---|---|---|
| **A — Merchandising & Route Graph** | §1, §2. Reaching the show page (or replacing it in-player); the coming-soon branch; the six false comments; the missing route test. | `components/BrowsePage.tsx` (grid/hero/tabs), `app/series/[slug]/page.tsx`, `app/page.tsx`, `app/discover/**`, `components/SeriesInfo*.tsx`, `lib/catalog.ts` (`getBrowseSeriesByCategory`) |
| **B — Player: rail, memory, runaway** | §3, §5. Windowing, observer, auto-advance, hls config, P1–P5. | `components/EpisodeFeed.tsx` (**lines 1–1100 and 1379–1960**), `lib/instant-player.ts`, `components/ShortsFeed.tsx`, `components/HorizontalFeed.tsx`, `scripts/audit-perf.ts` |
| **C — Entitlement & Paywall** | §4. `authResolved`, the 250 ms debounce, the rate-limit collision, the 402 path. | `components/EpisodeFeed.tsx` (**lines 1195–1330 and 2240–2400**), `app/api/access/route.ts`, `app/api/playback/[episode]/route.ts`, `app/api/unlock/**`, `middleware.ts`, `lib/playback-client.ts` |
| **D — Localization** | §6. Moving `t()` off the client context; paywall copy; the CSP/Translate decision; price formatting. | `lib/i18n.ts`, `components/LangProvider.tsx`, `components/ContentTranslator.tsx`, `next.config.ts` (CSP), plus **copy-only edits** across many surfaces |
| **E — Search** | §7. Diacritic folding; matcher unification; slug in haystack; `/search` discoverability. | `lib/search-index.ts`, `components/SearchButton.tsx`, `components/SearchBar.tsx`, `app/search/page.tsx`, `components/BottomNav.tsx` |
| **F — Persistence** | §8. Guest resume; the shelled `verza_last_watching`; likes; local↔account reconciliation. | `lib/resume.ts`, `app/api/watch-progress/route.ts`, `app/api/saved-list/route.ts`, `components/EpisodeFeed.tsx` (**lines 830–900 and 1660–1810**), `components/BrowsePage.tsx` (**lines 430–620**), `components/LibraryPage.tsx` |

### 9.2 Shared-file list, with the conflict zones named

**`components/EpisodeFeed.tsx` (2,425 lines) — four lanes want it. This is the #1 conflict.**

| Lines | Region | Lane |
|---|---|---|
| 85–89 | advance constants | **B** |
| 201–205 | `hlsUrl` / `blocked` | **B** reads, **C** owns the predicate |
| 336–460 | slide layout effect, `<video>` creation, adoption | **B** |
| 388–420 | adoption ERROR handler (P2) | **B** |
| 470–472 | `preload` by proximity | **B** |
| 569–653 | three watchdogs (all `blocked`-gated) | **B** mechanism, **C** gating |
| 659–800 | hls attach + config (P1) | **B** |
| 808–822 | `startLoad`/`stopLoad` (P3) | **B** |
| 830–900 | `timeupdate` progress POST + `ended` guard | **F** owns 847–859; **B** owns 862–900 |
| 1003 / 1022 | spinner / error card | **B** render, **C** `!blocked` gate |
| 1147–1157 | props destructure (`freeEpisodes` missing at 70) | **B**/**C** |
| 1195–1268 | **auth chain** | **C** |
| 1304–1316 | **paywall arming (250 ms debounce)** | **C** |
| 1379–1410 | refs, advance-reset listeners | **B** |
| 1452–1520 | window math, `MAX_SPAN`, mount scroll | **B** |
| 1524–1560 | `handleEpisodeEnded`, cooldown, cap | **B** |
| 1561–1644 | IntersectionObserver, `replaceState` | **B** |
| 1660–1712 | visibility flush + `saveLastWatching` | **F** |
| 1717–1810 | likes + saved list | **F** |
| 1848–1951 | scroller, spacers, slide props | **B** |
| 2218 / 2157 / 1956 | the counter | **B** |
| 2240–2400 | **paywall overlay** ($1.99, checkout, copy) | **C** owns behaviour, **D** owns strings, **A** wants merchandising in it |

**Protocol I recommend:** B and C must not both hold this file open. Land **C first** (the entitlement region is 200 lines and does not move the rail), then **B**, then **F** (its two regions are disjoint from both), then **D** last as a copy-only pass over `:2258-2360`. **A** must not touch this file at all in Phase 1 — if the merchandising drawer is re-mounted, it lands after B and C are green on device.

---

**`components/BrowsePage.tsx` (1,177 lines) — three lanes.**

| Lines | Region | Lane |
|---|---|---|
| 246–273 | `posterClick` (routing + instant-player prewarm) | **A** owns; **B** must review — `:271` is the allocator |
| 275–360 | tab state, `filtered`, `playableFirst` | **A** |
| 430–437 | continue-watching fetch | **F** |
| 532–534 | `PAGE_SIZE = 24` pagination | **B** (shipped memory fix — do not regress) |
| 588–620 | continue-watching rail | **F** render, **A** href |
| 940–965 | hero (2 layers — shipped memory fix) | **B** / **A** |
| 1084–1163 | grid tile + **the `soon` ternary** | **A** |

---

**`lib/catalog.ts` (1,415 lines) — four lanes read it, two would edit it.**

- `:1203-1263` the five coming-soon rows + **six false comments** → **A**
- `:1273-1280` the normalizer (mutates in place) → **C** must not break the clamp
- `:1325-1332` `getBrowseSeriesByCategory` → **A**
- `:1379-1396` `getEpisodesForSeries` (`isFree`) → **C**
- `:5` `import { MUX_MAP }` — the P5 chain → **B**
- catalog strings (accented titles, ASCII category keys) → **E** reads, must not edit

---

**Other shared files**

| File | Lanes | Note |
|---|---|---|
| `app/series/[slug]/[episode]/page.tsx` (185 lines) | **A** (`:181 backHref`), **B** (`:172-182` props, `:125` horizontal), **C** (`:104-119` `isFree` stamping) | Tiny file, three owners. Serialize. |
| `AGENTS.md` | **all six** | Rule 2 is stale (§0). **Exactly one lane may fix it** — assign to A. Six simultaneous edits to a 171-line policy file is a guaranteed conflict. |
| `scripts/test-feed-integrity.mjs` (581 lines) | **all six** | Everyone will want to add a barrier. `AGENTS.md:156-158`: "a check must name the defect it prevents." **Append only; never reorder; one commit per lane.** |
| `scripts/audit-perf.ts` (313 lines) | **B** | Also needs `ShortsFeed.tsx` added to `:149`. |
| `next.config.ts` | **B** (`deviceSizes`/`imageSizes`, shipped), **D** (CSP `script-src` for Translate) | Different keys in the same object literal. |
| `middleware.ts` | **C** | Sole owner. |
| `docs/handoff/IOS-CONTENT-PROCESS-CRASH.md` | **B** | Sole owner. Needs the §5 corrections written back (Worker count, SourceBuffer count, P5 size, the regressed teardown claim). |
| `components/SeriesInfoDrawer.tsx` | **A**, with **D** review (no `t()`) and **C** review (no `HideInIOSApp`, no `isSeriesPurchasable` gate) | Do not mount without both reviews. |
| `lib/resume.ts` | **F** | Sole owner. |

### 9.3 Cross-lane invariants nobody may break unilaterally

1. **Do not unify the two arms of `BrowsePage.tsx:1146-1163`** onto the episode route. Five live 404s (§2.3). — binds **A**
2. **Do not set `dynamicParams = false` on `app/series/[slug]`.** Same five 404s, and no test catches it. — binds **A**
3. **Do not copy `maxDevicePixelRatio: 1` into `lib/instant-player.ts`.** The element is 2px until adopted; capping there selects the worst rendition and keeps it. Fix the *adoption* path instead. — binds **B**
4. **Never hard-code a universal free-preview count** (`AGENTS.md` working agreement). — binds **B**, **C**, **D**
5. **Never expose a web price on iOS.** `<HideInIOSApp>` or `!iosApp` on any new price surface (`AGENTS.md` rule 11). — binds **A**, **C**, **D**
6. **Never let a client value grant access** (`AGENTS.md` rule 4). The `verza-unlock:` key is a hint that is always re-verified; keep it that way. — binds **C**, **F**
7. **Paid public playback ids must never enter the static payload.** `app/series/[slug]/[episode]/page.tsx:113-115`. — binds **B**, **C**
8. **Keep web/native public Mux projections byte-identical; use the generation scripts** (`AGENTS.md` rule 12). — binds **B**

---

## 10. WHERE THE PROMPT'S HYPOTHESES ARE WRONG

The sprint brief was written from a black-box test. Nine places where the code disagrees with it. These corrections are the most valuable thing in this document.

### 10.1 "Episodes 1-5 play, then swiping past 5…" — 5 is not a constant

The brief treats 5 as a product rule. It is per-title data (`lib/catalog.ts:78`), clamped down to real Mux inventory at `lib/catalog.ts:1278`, and **five live titles are wholly free** (`freeEpisodes === episodeCount`). Two titles ship with clamped values that differ from their source literals (`the-dumb-billionaire-heiress-in-love` 58→50; `storage-pirates` 14→13). Any fix, test, or repro keyed to the literal 5 is wrong for 5 titles and wrong about the shipped numbers for 2 more. Use `series.freeEpisodes` (post-normalization).

### 10.2 "the episode counter RUN upward toward 60" — this is not a counter bug, and the rail is supposed to be that long

The counter is a pure function of `activeIndex` (`components/EpisodeFeed.tsx:1452 → :2218`), and `activeIndex` has exactly one writer (`:1606`) with no second path (§3.6). **The rail is `episodes.length` viewports tall for every viewer, entitled or not** — `freeEpisodes` is declared at `:70` and never read anywhere in the component (§3.3). Reaching index 59 is a *legal traversal of the rail as built*, not evidence of a defect. Do not go looking for an index bug or a clamp regression; there is no clamp to regress. The question is not "why did the counter run" but "**what moved the scroll container**."

### 10.3 "…over a black screen" — the black screen is by construction, not a rendering failure

A blocked slide has `hlsUrl = null` (`:201-205`), and **all three watchdogs plus both visible states early-return on `blocked`** (`:570`, `:592`, `:644`, `:1003`, `:1022`). After the first swipe the poster is also gone (`:1915`). A locked slide is a literal black rectangle that renders exactly what it was built to render. Nobody should spend time hunting a poster/decoder bug here. The defect is that **nothing explains the screen to the viewer** — which is a paywall problem, not a video problem.

### 10.4 "…with no paywall" — this is a SEPARATE defect from the counter, with three independent causes, and the brief fuses them

The brief reads as one failure. It is two, and the paywall half has three candidate causes that need different owners and different fixes:

- **A. Debounce starvation** (`:1310-1315`, cleanup re-arms on every index change). Real and live. **But `scrollSnapStop: "always"` (`:1902`, `:1908`) means one gesture crosses at most one snap point** — 5 → 59 needs ~55 discrete gestures at >4/sec for ~14 s, and any 250 ms pause mounts the overlay. **This cannot produce a hands-off climb**, and the founder described the counter *running*, not 55 hand swipes.
- **B. `authResolved` never settles** (`:1309`, `.finally()` at `:1259`, `/api/access` fetch at `:1246` with **no AbortController and no timeout**, unlike `lib/playback-client.ts:48,143-144` which has a 12 s deadline). This is the only candidate whose shape matches the report exactly: black screen, full-length rail, **permanently** no paywall.
- **C. A 429 reading as "not entitled"** (`middleware.ts:40, 115` — one 30/min bucket shared across `/api/access`, `/api/playback/*`, `/api/watch-progress`, `/api/saved-list`, `/api/events`; `EpisodeFeed.tsx:1247` `r.ok` false → `d = null` → `:1258 setAuthFree(false)`). This paywalls a **paying** customer.

The brief's framing ("no paywall" as a symptom of the runaway) will send an engineer to the wrong file.

### 10.5 The runaway the brief describes is already fixed, and cannot recur by that mechanism

`ended`-driven auto-advance now requires a composited frame (`:883`, live in the production bundle) and is capped at 8 consecutive unattended steps (`:89`, `:1544`, live). Blocked slides have no video, so they cannot fire a real `ended` at all. **On the current build a hands-off run stops at ~8 steps, not 55.** If the founder reproduces the symptom *today*, the mechanism is different from the one the shipped fixes address, and the diagnosis must start over from "what moved the scroll container" (§11).

**But the cap is weaker than it reads:** `:1391-1404` resets the run to zero on any document `pointerdown`/`touchstart`/`wheel`/`keydown`. **A viewer tapping a black screen re-arms 8 more advances — roughly 7 taps still walks 5 → 60.** The brief lists the cap as a solved item; it is a partial one.

### 10.6 "the tab being killed for memory" — correct about the error, unproven about the cause, and the runaway is not the allocator

The brief is right that "This page can't be loaded" is jetsam killing the WebContent process, not our error page (and our error card at `:1022` is suppressed on blocked slides anyway). But: **the 55 black slides allocate essentially nothing** — measured on production at `/30`, all 5 mounted `<video>` elements have empty `src`, `readyState 0`, `networkState 0`. No decoder, no SourceBuffer, no worker. **The climb itself is not the memory event.** The peak is elsewhere: the browse→player overlap, and the adopted uncapped pipeline (§5.1, §10.7). Nobody has profiled a device (§11). Do not assume the two halves of the report are one event.

### 10.7 "maxDevicePixelRatio: 1 so capLevelToPlayerSize actually binds" — shipped, but it does not bind on the path the founder most likely took

The brief lists this as done. It is present in source (`:702`, `:713`) and in the production bundle. **But on a poster tap `EpisodeFeed` adopts the instant player's instance, and the adoption path never reconfigures the level cap** — `lib/instant-player.ts:94` sets `capLevelToPlayerSize: false`, and `EpisodeFeed.tsx:388-420` only swaps the ERROR handler. The active, full-screen pipeline plays **uncapped 1080p for the entire watch**, not for 12 seconds. Only fresh attaches (neighbours, cold deep links) are capped. This is the single most consequential correction in §5 and it changes what P1 still has to do.

### 10.8 "a single hls ERROR handler per instance (the adoption path calls off() first)" — shipped, and it is a regression

`ahls.off(AdoptedHls.Events.ERROR)` at `:402` passes **no listener**, which in eventemitter3 clears the whole event (`node_modules/hls.js/dist/hls.js:36795-36800`, `:423-429`). That removes hls.js's ~11–13 internal ERROR subscriptions along with the app's duplicate — including `StreamController.onError` and `BufferController.onError`, i.e. `reduceLengthAndFlushBuffer` / `flushMainBuffer` on `BUFFER_FULL_ERROR` and `recoverWorkerError` on `INTERNAL_EXCEPTION`. **On the adopted instance, hls.js's own memory-shedding path is gone — on exactly the instance that is also uncapped.** P2 as shipped traded one duplicate rebuild for the loss of all internal recovery. The fix is a scoped `off(Events.ERROR, theSpecificListener)`.

### 10.9 Two premises inherited from the docs are stale

- **`AGENTS.md` rule 2:** "The catalog has 91 rows… No coming-soon rows remain." **False** — 96 rows, 5 coming-soon, asserted by the repo's own passing test (`scripts/test-payment-integrity.mjs:684-688`). `git log -L49,51:AGENTS.md` shows the sentence was true when written (commit `b6aafd6`, 13:06) and was falsified 47 minutes later by `951dbbb` (13:53), which never touched the doc. An agent reasoning from `AGENTS.md` will conclude the coming-soon path is dead code and the `BrowsePage` branch vestigial. **It is neither.**
- **The handoff's P5:** "a **390KB** chunk with all **4,616** playback ids… it is the largest asset on the page." Stale. The runtime client receives the **519-row public projection** (`AGENTS.md` rule 8 is the current truth), measured at **156,628 raw / 37,569 br**, and it is no longer the largest asset. P5 is still open — the import chain `layout → Header → SearchButton → lib/catalog → lib/mux-public-map` is intact — but it is smaller headroom than the doc claims. The handoff also over-counts transmux Workers (one shared, not one per slide) and under-counts SourceBuffers (2 per instance, not 1), and its "unmount teardown now clears `src` + `load()`" line no longer matches the code.

---

## 11. OPEN QUESTIONS

Ordered by how much they change the plan.

**Q1. What actually moved the scroll container in the founder's session?**
This is the only question that matters for the crash. The index has one writer, driven by the IntersectionObserver, which only reports. Two code paths scroll programmatically: `EpisodeFeed.tsx:1517` (mount) and `:1556` (auto-advance, now frame-gated and capped). Everything else is a human gesture. **Could not determine** — no session recording, no device.
*Settled by:* Safari remote inspector on a real iPhone, on a 60-episode paid title, logging a timestamp on each `setActiveIndex` (`:1606`) plus `showUnlock` and `authResolved`, while swiping from episode 5. If the counter climbs with no gestures, the driver is not `ended` and the diagnosis restarts. If `showUnlock` stays false while the counter climbs, §10.4-A is confirmed.

**Q2. Can the observer walk the index with no scroll at all, via spacer-geometry shift?**
The leading spacer height is `calc(var(--feed-h, 100dvh) * ${windowStart})` (`:1883`) and browser scroll anchoring is deliberately off (`:1873`). If a window shift moves content under a fixed `scrollTop` such that slide N+1 becomes the highest-ratio entry, the loop `index+1 → windowStart shifts → observer re-subscribes (:1644) → initial batch → index+1` closes, and **nothing bounds the total on that path** because the auto-advance cap is not on it. I could neither construct nor exclude this.
*Settled by:* instrumenting `container.scrollTop`, `windowStart`, and each accepted `idx` across a re-observe on a real iPhone; or replaying the batch sequence against the real spacer geometry in a headless harness.

**Q3. Does `/api/access` hang, or return, in the failing session?**
The whole "no paywall" branch B turns on this. **DERIVED only.** Unauthenticated from this machine, `/api/access?slug=falling-for-flatmate` returned 200 `{"full":false}` in 0.41 s.
*Settled by:* one failing session with the network panel open — does the request complete with any status, or hang? Or: does `paywall_viewed` (`:1313`) appear in `analytics_events` for that session at all?

**Q4. Does real signed-in binge traffic trip the 30/min bucket?**
The shared bucket is verified from `middleware.ts:40, 115` and a 429 was reproduced by hammering from one IP. The real request rate for an authenticated binger was not measured (no credentials).
*Settled by:* one authenticated session with the network panel open for 90 s of paid-episode swiping; or a Vercel log query counting 429s on `/api/access` and `/api/playback` over the last week.

**Q5. `Hls.isSupported()` on a real iPhone.**
Still the single highest-value confirmation, exactly as the handoff says (`docs/handoff/IOS-CONTENT-PROCESS-CRASH.md:90-91`). If `true`, the MSE analysis and P1/P3 are correct. **Still unrun.** Nobody has profiled the actual device; every megabyte figure in §5 except the 6.29 MB poster is arithmetic.
*Settled by:* one line in Safari's remote inspector. Pair it with `getComputedStyle(document.querySelector('.episode-immersive')).height` and `document.querySelector('video').getBoundingClientRect()` — that second number decides whether the P1 cap does anything at all (it binds only while `max(cssWidth, cssHeight) <= 854`).

**Q6. Has stripping hls.js's internal ERROR listeners already caused a user-visible regression, or is it latent?**
Read from the registration sites, not executed.
*Settled by:* on the adopted pipeline, `hls.listeners(Hls.Events.ERROR).length` immediately after `:402-403` — expect 1 if the internals are gone, ~12–14 if not; then force a `BUFFER_FULL_ERROR` or a fragment 404 and observe whether hls.js retries or switches level.

**Q7. Was the founder's session a poster tap or a cold deep link?**
This decides whether §10.7 (adopted, uncapped, no internal error recovery) is the trigger or merely headroom. The handoff flagged the same unknown at `:92-95`.
*Settled by:* the analytics event stream for that session, or asking the founder whether they tapped a poster on the home page or opened a link.

**Q8. Which half of the "inversion" does the founder want fixed?**
Two incompatible fixes: (a) route live grid tiles to `/series/<slug>` so the unlock card is reachable — reverses `42d9d15`'s explicit product decision and adds a tap before every play; or (b) leave routing alone and surface the merchandising inside the player. **Nothing in the code decides this.**
*Settled by:* founder intent, or an A/B on the grid tile href measuring `checkout_started` per session (the event already fires at `EpisodeFeed.tsx:2297`).

**Q9. What did the twelve-persona test actually flag as "the Bollywood inversion"?**
`grep -ri "inversion"` over all `.md`/`.ts`/`.tsx`/`.json` (excluding `node_modules`) returns **zero hits**, and no 119-finding document exists under `docs/`. I verified a mechanism and its production behaviour; I did not verify it is what the persona observed. Grid *ordering* is ruled out (§2.4). A **content/language** inversion — English-titled live rows on the Bollywood tab (`falling-for-flatmate`, `salt-and-pepper`, `the-breakup-podcast`, `reset`), against `AGENTS.md`'s note that eleven series-language groups are deliberately dark on wrong-language key art — **could not be ruled out** and would be unrelated to the ternary.
*Settled by:* the finding's own text and repro steps.

**Q10. Is Google Translate actually refused at runtime?**
The CSP arithmetic is airtight (`next.config.ts:37` allows `translate.google.com`; the engine loads from `translate.googleapis.com`, absent from every directive; `git log -S` shows it was never present). No console violation was captured — a browser is connected to this machine, but as a subagent I had no way to obtain browser-selection consent and did not drive the user's browser.
*Settled by:* open `https://www.verzatv.com`, switch language in the header dropdown, read the console for `Refused to load the script https://translate.googleapis.com/…`.

**Q11. Has any real user ever successfully changed language?**
`components/LangProvider.tsx:46` calls `trackLanguageChange`, which writes to `analytics_events`. This tells you whether the i18n layer is worth repairing or worth deleting. Not queried.
*Settled by:* one Supabase query on that event name.

**Q12. Do the 91 show pages get any traffic?**
Established: unreachable by tap, reachable by crawl. No analytics access.
*Settled by:* Vercel Analytics or GA4 pageviews grouped by path, split `/series/<slug>` vs `/series/<slug>/<n>`, last 30 days.

**Q13. Is the deployed commit `e6cff6a`?**
Behavioural parity was confirmed on many URLs, and the production chunk contains strings distinctive to both `e6cff6a` and `e856cca`, so production is **at or after** HEAD. The exact SHA was not read.
*Settled by:* `npx vercel inspect` on the current production alias, or `vercel ls` showing the commit SHA.

**Q14. Does every Mux asset share the sampled 3-rung ladder?**
Four master playlists were sampled, all from one series, all identical with no 720p. Whether the other 515 public and 4,394 signed assets match is unverified — and it changes what the P1 cap actually selects.
*Settled by:* iterate `lib/mux-public-map.ts` and fetch each master, or read the account's encoding tier in the Mux dashboard.

**Q15. Does the native client share any of this?**
`../verza-native` is **not in this working tree** and was not examined. Whether iOS routes a poster tap to a show screen or straight into the player, whether it reuses `lib/i18n.ts` or any hard-coded `$1.99` surface, and whether it imposes its own nav on the player are all unknown. `AGENTS.md` rule 11 and rule 14 make this the highest-risk blind spot in the sprint.
*Settled by:* the same grep sweep run in that repo.

**Q16. Are `SeriesCard` / `ChannelRow` intended for revival?**
Nothing in the repo records intent; last touched at `8145be4`. If revived, `SeriesCard.tsx:13` ships five live 404s. One-line fix: mirror `BrowsePage.tsx:1146`.
*Settled by:* an owner decision.

**Q17. Should the five coming-soon show pages be indexable?**
They render, they 200, and `app/series/[slug]/page.tsx:54` marks them `noindex` — while `BrowsePage.tsx:1149` links to them internally and `app/page.tsx:48` withholds them from crawlers on a false premise. The SEO harm is nil; the incoherence is real.
*Settled by:* an owner decision on whether the slate is a teaser surface or should be inert as `lib/catalog.ts:1195-1196` claims.