# S1 — Discover / Home. The `/` route as shipped on https://www.verzatv.com: the category strip (10 browse tabs), the hero carousel, the Continue Watching row, the Tubi partner carousel, every poster tile on all 10 tabs, the StorageBlue ad ribbons, the Reality / Red Carpet / Music / Creators / Anime custom sections, plus the page chrome that renders on `/` (header, footer, bottom nav) and the second category strip at `/discover`. Includes routing verification for all 96 catalog rows to their real destination URLs, and all 112 image assets the home surfaces reference.

**Coverage: 404 of 456 items examined.** 16 findings raised.

## Gaps — items in scope this agent could not examine

Nine items or behaviours in scope that I could not examine, and what each needs.

1. **52 of the 76 Drama tiles never rendered — infinite-scroll paging unverified.** The grid pages at PAGE_SIZE 24 behind an IntersectionObserver sentinel (components/BrowsePage.tsx:559-577). I scrolled `.device-screen` to its maximum (scrollTop 2664 of 2664, sentinel rect top 143, inside the viewport) and the tile count stayed at 24 across three attempts. This is NOT a finding: I ran a negative control — my own IntersectionObserver on the same sentinel with the same 800px rootMargin also never fired, and `document.hidden` was `true` with `requestAnimationFrame` never invoking its callback (a 12-frame rAF loop timed out after 45s). Another agent's session held the foreground tab in this Chrome window the whole time, so no rendering-update steps ran. NEEDS: a foreground browser tab or a real device to confirm the sentinel appends pages 2-4. Their routing and artwork ARE verified (all 96 catalog destinations 200, all 96 posters 200); only on-screen appearance is unconfirmed. These 52 are the entire difference between itemsInScope 456 and itemsExamined 404.

2. **Touch-swipe tab switching untested.** components/BrowsePage.tsx:506-539 switches tabs on a >50px horizontal touch drag, with an exclusion for touches starting inside `.overflow-x-auto, .snap-x`. Desktop Chrome has no touch input. NEEDS: a real device or a touch-emulating harness. Clicking all 10 tab buttons was verified and all 10 render (see report).

3. **Real narrow viewports.** The desktop phone frame is 394 CSS px inside a 606px window and the OS window would not shrink below ~518px outer. I simulated 320/360/375/390/430 by setting `.device-frame` width. Faithful for the grid (tile widths tracked correctly: 93/106/111/116/129) and for the tab strip. NOT faithful for anything sized in vw/dvh, which resolves against the real 606px viewport: the hero's `maxWidth: min(320px, 80vw)` (BrowsePage.tsx:996) and the Tubi panel's `height: calc(100dvh - 108px - 96px - env(safe-area-inset-bottom))` (BrowsePage.tsx:745). NEEDS: real device widths or Chrome device emulation in a foreground tab.

4. **Console errors on `/` could not be captured.** `read_console_messages` returned "No console messages found for this tab" both before and after a reload with tracking armed, on the occluded tab. No JS errors were observed but none can be ruled out. NEEDS: a foreground tab.

5. **Continue Watching rail exercised with one row only.** The rail appeared once during the session ("EP 4 · Tied By Fate") and was empty on later loads. I verified its code path (lib/continue-watching.ts filters to live series, drops rows past episodeCount, caps at 20; lib/resume.ts:30-33 builds `/series/<slug>/<n>?t=<s>`) and that the server is authoritative over the guest mirror. NOT verified: a full 20-row rail, a signed-in rail, horizontal scroll feel, or the progress-bar percentage against a real durationS.

6. **CreatorsLanding's 13 interactive elements inventoried but not exercised.** The Creators tab renders components/CreatorsLanding.tsx: 4 links (/creator x2, /founder, /privacy — all 200), 5 buttons (4 accordion rows 352x44 plus "Apply for the beta" 354x51), 4 form inputs. I did not open the accordions or touch the form; that surface and its no-earnings-promises copy constraint belong to the Creators agent.

7. **Badge truthfulness against real release dates.** "New" is asserted positionally on 6 Drama tiles (the FEATURED_NEW pins at BrowsePage.tsx:60-67), 5 Español and 6 Bollywood tiles; "Trending" on 3 Drama and the top 3 Hot tiles. I verified the badges are internally consistent — Drama's Trending three (the-day-we-got-married, the-escort, hidden-agenda) are exactly Hot's rank 1-3 — but the catalog exposes no publish date here, so whether the six FEATURED_NEW titles are genuinely the newest is unverified.

8. **Header, footer and bottom nav (34 of the 201 interactive elements on `/`).** Inventoried with boxes and destinations, and every destination fetched (all 200 except the YouTube link, S1-009). Their own behaviour — the language picker, the search overlay, bottom-nav active state — belongs to other surface agents and was not exercised.

9. **The 3 Reality placeholder shows are outside the audit denominator entirely.** sugar-babies, buy-sell-miami and the-vertical-tea are hardcoded in components/BrowsePage.tsx:437-442 and are not catalog rows, so they appear in none of the manifest's 96 catalog entries or 5129 route instances. Anyone auditing "every catalog row" will never see them. I counted them as home-surface items; a follow-up should decide whether they belong in the catalog as coming_soon rows (which would give them the house badge and a real show page) or should be removed.

---

# S1 — Discover / Home — audit record

Target: `https://www.verzatv.com/` (production), read back 2026-08-29.
Source read at the working tree; every behavioural claim below was checked against the deployed site, not the build.

---

## 1. Coverage

| Class | In scope | Examined |
|---|---:|---:|
| Browse categories (tabs) | 10 | 10 |
| Interactive elements rendered on `/` across all 10 tabs | 201 | 149 |
| Catalog rows resolved to their real destination URL | 96 | 96 |
| Image assets referenced by home surfaces | 112 | 112 |
| Distinct external URLs reachable from `/` | 9 | 9 |
| `/discover` strip tiles + `/discover/<slug>` routes | 28 | 28 |
| **Total** | **456** | **404** |

The 52 unexamined items are the Drama tiles behind the infinite-scroll sentinel; their routing and artwork are verified, their on-screen appearance is not. Cause and negative control in §8.

Cross-reference against the manifest: `docs/audit/00-manifest.json` attributes 48 interactive items to the files that compose this surface (BrowsePage 19, CreatorsLanding 8, HeroCarousel 5, TubiHeroCarousel 4, EmptyState 3, CategoryTabs 2, discover/page 2, and one each for page.tsx, Header, Footer, BottomNav, SeriesCard). All 48 were located in source. Five of them (HeroCarousel.tsx) are unreachable — see S1-014.

---

## 2. The category strip — all ten tabs

`BROWSE_TABS` (lib/catalog.ts:20-41) holds **ten** entries. The brief says nine; the ninth-plus-one is Tubi, the partner tab. Counting content categories only — Drama, Hot, Anime, Español, Bollywood, Reality, Creators, Red Carpet, Music — there are exactly nine, and Tubi makes ten tabs.

Every one was clicked on production and every one rendered:

| # | Tab | aria-current after click | Content rendered | Links in tab |
|---|---|---|---|---:|
| 0 | Drama | DRAMA | poster grid, hero, ad | 26 |
| 1 | Hot | HOT | ranked grid, hero, ad | 22 |
| 2 | Tubi | *(logo, no text)* | partner panel + carousel | 8 |
| 3 | Anime | ANIME | branded Coming Soon panel | 0 |
| 4 | Español | ESPAÑOL | 2-up grid | 6 |
| 5 | Bollywood | BOLLYWOOD | 2-up grid | 10 |
| 6 | Reality | REALITY | hero + 2x2 grid + ad | 2 |
| 7 | Creators | CREATORS | CreatorsLanding | 4 |
| 8 | Red Carpet | RED CARPET | "The Carpet" 2-up | 2 |
| 9 | Music | MUSIC | single poster | 1 |

The strip scrolls (scrollWidth 1057 vs clientWidth 394; `scrollTo({left:400, behavior:'instant'})` lands at 400), the active-tab underline and colour are driven by `aria-current`, and the edge fades are painted correctly — computed opacity `right: 1`, `left: 0` at rest, flipping on scroll (components/CategoryTabs.tsx:239-256).

**Label geometry at the four required widths.** Intrinsic widths measured on production (EN), laid out with the strip's own `px-4` (16px) and `gap-5` (20px):

`DRAMA 69 · HOT 38 · Tubi 76 · ANIME 60 · ESPAÑOL 84 · BOLLYWOOD 115 · REALITY 78 · CREATORS 97 · RED CARPET 112 · MUSIC 60` — track 1000px.

| Rail width | Fully visible | Clipped mid-word | Off-screen |
|---|---|---|---|
| 320 | DRAMA, HOT, Tubi, ANIME | — | 6 |
| 375 | DRAMA, HOT, Tubi, ANIME | ESPAÑOL at 36/84 → "ESP" | 5 |
| 390 | DRAMA, HOT, Tubi, ANIME | ESPAÑOL at 51/84 → "ESPAÑ" | 5 |
| 430 | + ESPAÑOL | — | 5 |

→ **S1-010** (S4). Mid-word truncation does occur at 375 and 390. The 28px fade is the deliberate mitigation and it is working; flagged because the brief names the criterion.

**Localization.** Only 6 of 10 tabs have i18n keys (components/CategoryTabs.tsx:14-21; lib/i18n.ts:51-56). Verified live with `verza-lang=es`: the strip reads `DRAMA · HOT · [Tubi] · ANIME · ESPAÑOL · BOLLYWOOD · REALITY · CREATORS · ALFOMBRA ROJA · MÚSICA` — Red Carpet and Music translated, Anime/Bollywood/Creators not. → **S1-008** (S3).

**The second strip.** `/discover`'s "Browse by Category" grid renders only 7 of the 10 (app/discover/page.tsx:17 filters on live-row count). Tubi, Anime and Creators are omitted although all three `/discover/<slug>` pages render 200 with honest empty states. → **S1-011** (S4).

All 20 `/discover/<slug>` routes fetched: **20/20 → 200**. `/discover/anime` renders the house pattern: *"No anime series yet. Catalog availability changes over time. Check back soon."*

---

## 3. Every tile, and where it goes

The catalog resolved from source via jiti: **96 rows, 91 live, 5 coming_soon**, no other status values. This contradicts the manifest summary — see **S1-013**.

Every tile in the product uses one code path, `posterHref(s)` (lib/series-href.ts:113-115 → `episodeHref(series, 1)`), which falls back to the show page when `episodeCount < 1`. I resolved all 96 rows to their real URL and fetched each one:

**96/96 → HTTP 200, zero redirects, zero 404s.**

- 91 live rows → `/series/<slug>/1` — the player.
- 5 coming-soon rows → `/series/<slug>` — the show page.

Spot-checked both ends of the rule on production:

- `/series/lost-and-found/1` → title *"Lost and Found — Episode 1 | VERZA TV"*, `robots: index, follow`, player chrome (Like / Save / Share / More).
- `/series/the-chairmans-revenge` → title *"The Chairman's Revenge — Coming Soon | VERZA TV"*, `robots: noindex, follow`, body reads *"Episodes announced soon · Hindi audio"*, and contains **no `1.99`, no "Unlock"**. Honest and unsellable, exactly as the invariant requires.

Rendered hrefs read back from the live DOM, per tab:

- **Drama** — 24 tiles on page 1, all `/1`. Slots 0-5 badged `New` (the six FEATURED_NEW pins), slots 6-8 badged `Trending`, nothing after. 76 tiles total.
- **Hot** — 20 tiles, all `/1`, ranked, `Trending` on the top three only. Drama's Trending three (`the-day-we-got-married`, `the-escort`, `hidden-agenda`) are exactly Hot's rank 1-3 — the two tabs agree.
- **Español** — 5 live → `/1` with a `New` badge and a `SPANISH` audio chip; 1 coming-soon (`i-cant-resist-my-mansion-gardener`) → `/series/<slug>` with a `Coming Soon` badge and no play affordance.
- **Bollywood** — 6 live → `/1` with `New` and a `HINDI` chip; 4 coming-soon → `/series/<slug>` with `Coming Soon`. All 10 chips read "Hindi".
- **Reality** — 1 link, `/series/storage-pirates/1`. Three inert cells. See S1-001.
- **Red Carpet** — 2 links, `/series/exes-premiere/1` and `/series/love-awards/1`.
- **Music** — 1 link, `/series/too-much-junk/1`, 394x480.

The restored rule holds everywhere I could observe it: **playable plays, unplayable explains.** The old inversion (coming-soon tiles reaching the show page while sellable titles skipped past it) is gone.

**Crawler index.** The `<noscript>` block (app/page.tsx:29-67) carries **107 live show-page links + 5 coming-soon plain-text spans = 112 entries** across 10 headed sections, matching `Σ getBrowseSeriesByCategory` exactly. Coming-soon rows correctly render as `<span>`, not `<a>`, because their pages are `noindex`.

---

## 4. The hero and the carousels

**Drama/Hot hero.** A 394x480 `<Link>` wrapping a 320x480 2:3 card, `object-contain`, three layers mounted (prev/active/next) for a real crossfade. Rotates the six FEATURED_NEW pins on Drama, the tab's first four elsewhere. It correctly does **not** render on Español, Bollywood, Music, Reality or Red Carpet, and does not render on Anime/Tubi/Creators because `filtered` is empty there.

Two defects:
- The link target changes every 4s with no pause control → **S1-004** (S3).
- Dot indicators are **6x6 px** (20x6 active) → **S1-005** (S3).

**Reality hero.** Same 320x480 card, four slides — and no anchor, no button, no handler. `heroImg.closest('a')` is `null`. → **S1-002** (S3).

**Tubi carousel.** Clean. 7 slides, each a real outbound `<a href="https://tubitv.com/" target="_blank" rel="noopener noreferrer sponsored">` at 350x194, plus the primary CTA at 354x57, plus an "OPENS TUBI ↗" chip and a "Streaming free on Tubi. Verza sponsored partner." trust line. `tubitv.com` returns 200. The component's own comment records that these slides were decorative until 2026-08-29; they are links now, verified.

**Continue Watching.** Renders above the tab content on every tab except Tubi and Creators. Tiles are 120px wide, link to `buildResumeUrl` → `/series/<slug>/<n>?t=<s>`, carry an EP badge and a progress bar. `lib/continue-watching.ts` drops rows whose series is missing or no longer live and rows past `episodeCount`, and caps at 20 — the same filters the server applies, so the guest rail cannot resurrect the 404s the server-side filter was added to kill. Exercised with one row only (gap 5).

**Ad ribbons.** One StorageBlue ribbon on Drama and Hot (370x74), one on Reality. `https://www.storageblue.com` → 200. The gate contains a dead `activeTab === "new"` arm → **S1-015** (S4).

---

## 5. Responsive behaviour, 320px to tablet

Simulated by resizing `.device-frame` (see gap 3 for the vw/dvh caveat):

| Width | Horizontal overflow | Tile width | Tiles overflowing caption | Overlapping next row |
|---|---|---|---|---|
| 320 | none | 93px | 14 / 24 | 12 |
| 360 | none | 106px | 10 / 24 | 9 |
| 375 | none | 111px | 7 / 24 | 6 |
| 390 | none | 116px | 6 / 24 | 5 |
| 430 | none | 129px | 5 / 24 | 4 |

No page-level horizontal overflow at any width (`scrollWidth === clientWidth` throughout). The caption overflow is a real, visible layout break — the genre line lands 2px inside the next row's poster — and it gets worse as the screen gets narrower. → **S1-003** (S3).

The two-up grids (Español/Bollywood, 136-189px tiles) and the Reality/Red Carpet grids show **0** overflow at every width, so this is specific to the 3-column `.poster-grid`.

Tap targets measured on production: grid tile 119x221 ✓, hero link 394x480 ✓, Tubi CTA 354x57 ✓, accordion rows 352x44 ✓, bottom nav 74x41, "Browse Drama" 125x36, header buttons 36x36, tab buttons 32px tall, footer social 18x18, **hero dots 6x6**. → **S1-005**.

At ≥520px the desktop iPhone frame takes over (400px wide, `body { overflow: hidden }`, nav docked below the scroll area). On a portrait tablet that means a 400px phone frame centred on a gradient — a deliberate presentation, not a break.

---

## 6. The four route states

| State | Status |
|---|---|
| Populated | ✓ 24 tiles + hero + ad on first paint, SSR'd into the HTML |
| Loading | ✓ SSG (no `loading.tsx` needed); poster tiles shimmer via `.skeleton` until decode, and `Poster` reads `img.complete` plus a native `load` listener so a cache hit cannot strand a blank tile |
| Empty | ✓ per tab. Anime gets the house pattern — branded panel, honest sentence, working "Browse Drama" CTA (clicked on production: switches to Drama, 24 tiles). Custom-section tabs are correctly excluded from the placeholder via `CUSTOM_SECTION_TABS` |
| Error | ✗ **absent** — no `app/error.tsx`, no `app/global-error.tsx` anywhere in the repo → **S1-007** (S3) |

`?tab=<garbage>` is guarded (`BROWSE_TABS.some(t => t.key === tab)`) and falls back to Drama without a crash. `?tab=new` — a valid `BrowseCategory` that is not a tab — is likewise rejected.

---

## 7. Links out

All 47 anchors and 19 buttons on the default `/` were enumerated and attributed:

`header 3 · category strip 10 · tab content 32 · footer 16 · bottom nav 5 = 66`

Internal destinations, all fetched: `/`, `/studio`, `/support`, `/terms`, `/privacy`, `/refund-policy`, `/help`, `/press`, `/about`, `/shorts`, `/shop`, `/library`, `/me`, `/creator`, `/founder`, `/discover` — **16/16 → 200**.

External, all 9 verified individually:

| URL | Result |
|---|---|
| instagram.com/verzatv | 200 ✓ |
| tiktok.com/@verzatv | ✓ renders "VerzaTV · 384 Followers" |
| x.com/VerzaTV | 200 ✓ |
| **youtube.com/@VerzaTV** | **404 — channel does not exist** → S1-009 |
| facebook.com/VerzaTV | ✓ renders "Verza TV · 202 followers" (curl 400s on every FB URL incl. control; needed a browser) |
| apps.apple.com/app/id6752884623 | 200 ✓ |
| play.google.com/…com.verzatv.app | 200 ✓ |
| storageblue.com | 200 ✓ |
| tubitv.com | 200 ✓ |

**Image assets: 112/112 → 200.** All 96 catalog posters, plus `/posters/{sugar-babies,buy-sell-miami,the-vertical-tea,storage-pirates,exes-premiere,love-awards,too-much-junk}`, `/tubi-hero-{1..6}.webp`, `/tubi-logo.png`, `/ads/storageblue-logo.png`, `/logo.png`.

---

## 8. Things I checked, disproved, and am NOT reporting

Standing rules 3 and 5, applied to my own work. All four of these looked like findings and are not:

**Tab strip cannot be scrolled.** `rail.scrollLeft = 200` was still 0 after 1.5s. Looked like the exact bug CategoryTabs claims to have fixed. It is not: `rail.scrollTo({left: 400, behavior: 'instant'})` lands at 400 and persists. The failing case is the *smooth* path, and smooth scrolling is rAF-driven — see below.

**Active-tab centring is broken.** `rail.scrollBy({left: 300, behavior: 'smooth'})` was 0 after 1.2s. Discarded for the same reason.

**Infinite scroll does not load page 2.** 24 tiles before and after scrolling to `scrollTop 2664 of 2664`. Discarded on a negative control: I attached my own `IntersectionObserver` with the same 800px rootMargin to the same sentinel and it also never fired. `document.hidden === true`, `document.visibilityState === 'hidden'`, and a 12-frame `requestAnimationFrame` loop timed out after 45s — another agent's session held the foreground tab in this Chrome window for the whole run, so Chrome ran no rendering-update steps for my tab. Every rAF/IO/smooth-scroll observation from that tab is void. Layout reads (`getBoundingClientRect`, `scrollWidth`, computed styles) and React click handlers all worked and are reported. Reported as gap 1.

**67 posters are cropped by `object-cover`.** 67 of 96 poster files are 1080x1920 (9:16) rendered into a 2:3 box, which is a 15.6% vertical crop — arithmetic that predicts the "ONLY STREAMING ON VERZA TV" lockup being cut off the bottom of most tiles. A screenshot of the live grid shows the lockup intact on every tile: the flyers place it above the crop line. The claim in components/BrowsePage.tsx:836-841 that cover "only ever crops the sides (never the bottom)" is technically wrong for 67 of 96 files but produces no visible defect, and it is true for the four Reality posters it was written about. Not reported.

Also observed and deliberately not reported as defects:

- **No in-product path from a home tile to a show page for a playable title.** By design: `posterHref` sends every tap to the player, and the founder rejected an interstitial. The show page is reachable from `/discover`, `/genre`, `/best`, `/collections`, `/channels`, `/shorts` and Library. Worth noting that `SearchBar` and `FeedSearch` also use `posterHref`, so the comment in lib/series-href.ts:104 claiming the show page is "reachable from search" is stale — but the page is not orphaned, so this is an inaccurate comment, not a broken surface. (The dead `SeriesInfoButton`/`SeriesInfoDrawer` pair is captured in S1-014.)
- **10 English slugs diverge from their displayed title** (`/series/the-mistress-trap` → "The Escort They Framed", `/series/hidden-agenda` → "The Killer Caregiver", `/series/the-crown` → "Power and Promises", and 7 more). Legitimate SEO-stable slugs after a rename; it only means a shared URL names a different show than the tile. Catalog surface, not home.
- **The `<noscript>` index links to show pages while the interactive grid links to the player.** Documented, intentional, correct.

## 9. Protected assets — all intact

Checked each named item and none is regressed: instant play from a poster tap (every playable tile is a direct `/1` link with an `instant-player` prewarm gated to free episodes only); the poster art; the Anime empty state; "THE MICRODRAMA APP" under the logo (present in the header); speed (home HTML 231KB, 0.39s TTFB, SSG). The paywall, episode picker, swipe feel and legal pages are outside this surface.