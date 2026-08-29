# S7 — SECTIONS. The 10 browse tabs (Drama, Hot, Tubi, Anime, Español, Bollywood, Reality, Creators, Red Carpet, Music) plus the /channels page: is each finished, honestly empty, or neither. Includes crawling every Tubi play affordance to its real destination, the storage-company advert wherever it renders, and every Reality tile.

**Coverage: 395 of 395 items examined.** 18 findings raised.

## Gaps — items in scope this agent could not examine

Five things in or adjacent to my scope that I could NOT establish, and what each needs:

1. DRAMA PAGINATION BEYOND PAGE 1 (52 of 76 tiles). The Drama grid renders 24 tiles and appends more via an IntersectionObserver sentinel (components/BrowsePage.tsx:566-577). In my session the sentinel sat fully inside the viewport (top 129, viewport 563) for 10+ seconds and page 2 never loaded. I then installed my OWN IntersectionObserver on the same node with the same rootMargin as a negative control: it also never fired. My tab was `document.visibilityState === "hidden"` throughout, which suspends IO delivery in Chrome. The observation is therefore worthless and I am NOT reporting it as a defect. All 76 Drama destinations WERE crawled independently (76/76 -> HTTP 200); only the client-side rendering of tiles 25-76 is unverified. NEEDS: one pass in a foreground browser tab that nothing else is driving.

2. FOREGROUND CONFIRMATION OF S7-004 (tab-rail centring). Same root confound: `behavior:"smooth"` scrolls do not advance in a hidden tab. I kept the finding because the `behavior:"instant"` positive control lands perfectly (so the delta maths is sound) and because two rendered screenshots show the failure state at paint time, but a fixer must reproduce it in a foreground tab BEFORE changing CategoryTabs.tsx:132. NEEDS: an uncontended browser.

3. iOS APP RENDERING OF THESE SECTIONS. AGENTS.md rule 11 says the iOS binary excludes UGC, ads and affiliate placements — which means the StorageBlue ribbon, the Tubi outbound panel and the whole Creators recruitment surface must behave differently there. ../verza-native is not in this repo and I did not audit it. NEEDS: the native repo, or an installed build.

4. WHETHER /api/creator/upload 503s IN PRODUCTION. app/api/creator/upload/route.ts:24-30 returns 503 when MUX_TOKEN_ID/SECRET are absent, but the route requires an approved-creator session and returns 401 to me. I proved the downstream half instead (POST /api/mux/webhook -> 503, secret absent), which is sufficient to show the pipeline cannot complete, but the upload half itself is inferred, not observed. NEEDS: an approved creator account, or a Vercel env-var name readback.

5. WHETHER THE TUBI CONTRACT PERMITS PER-TITLE DEEP LINKS. S7-011 reports that six banners advertising specific films all land on tubitv.com's home page. TubiHeroCarousel.tsx:23-29 says a per-title URL must not be hand-written. Whether verified per-title URLs are obtainable is a partner-contract question I cannot answer from the code. NEEDS: the Tubi partner contact.

Also noted but deliberately NOT filed as defects, because they came back clean and are worth protecting:
- Anime empty state renders live and is honest: "Anime is coming soon" + "We're lining up the first titles for this section. Everything else on VERZA is ready to watch right now." + a working "Browse Drama" button. This is the house pattern and it works.
- All 5 coming-soon show pages (4 Bollywood + 1 Español) render 200 with "Episodes are on the way / The footage for this title hasn't landed yet, so there is nothing to play and nothing on sale", no price, no buy button, `noindex, follow`.
- Catalog routing rule holds on every section tab: 116 tile instances covering all 96 rows resolve as specified — 91 live tiles to /series/<slug>/1, 5 coming-soon tiles to /series/<slug>.
- All 5 wholly-free titles in scope (too-much-junk, storage-pirates, exes-premiere, love-awards, the-dumb-billionaire-heiress-in-love) read "All Episodes FREE" with no $1.99 anywhere on the page.
- Red Carpet is finished: heading, 2 tiles, both live, both to the player, back-tab correct.
- /creator signed out is honest with a way forward ("Sign in to apply, upload, and manage your channel" + Sign in).
- Every section episode page carries the right return tab (music/reality/red-carpet/bollywood/espanol).
- All 3 external destinations crawled clean: tubitv.com 200, storageblue.com 200 (one www->apex redirect), apps.apple.com 200.

---

# S7 — SECTIONS: audit record

**Target:** https://www.verzatv.com (production), working tree at commit `147d0f9`.
**Date:** 2026-08-29. **Method:** deployed-bundle inspection + live DOM measurement + HTTP crawl. Nothing was fixed; no file outside this report was touched.

---

## 1. Coverage

| Class | In scope | Examined |
|---|---|---|
| Sections (10 browse tabs + /channels) | 11 | **11** |
| Interactive elements rendered by those sections | 135 | **135** |
| Route instances owned by those sections (section pages + every tile destination) | 130 | **130** |
| Catalog tile instances across the 7 catalog-backed tabs (96 distinct rows) | 116 | **116** |
| External destinations reachable from those sections | 3 | **3** |
| **Total** | **395** | **395** |

Per-section element counts, measured with `getBoundingClientRect` on production:

| Section | Elements | Composition |
|---|---|---|
| Drama | 32 | 1 hero link, 6 dots, 1 ad, 24 grid tiles (page 1 of 76) |
| Hot | 26 | 1 hero link, 4 dots, 1 ad, 20 tiles |
| Tubi | 15 | 1 CTA, 7 slide anchors (6 + clone), 6 dots, **1 inert wordmark** |
| Anime | 1 | "Browse Drama" button |
| Español | 6 | 5 live tiles + 1 coming-soon tile |
| Bollywood | 10 | 6 live tiles + 4 coming-soon tiles |
| Reality | 10 | 4 dots, 1 tile link, **3 inert tiles**, 1 ad, **1 inert hero** |
| Creators | 13 | 2 CTA links, founder link, search input, 4 FAQ toggles, 3 form inputs, submit, privacy link |
| Red Carpet | 2 | 2 tiles |
| Music | 1 | 1 tile |
| /channels | 19 | 4 channel cards, 14 poster links, 1 "View All" |

Crawl result: **127 of 130 URLs -> 200.** The 3 non-200s are `/series/sugar-babies`, `/series/buy-sell-miami`, `/series/the-vertical-tea` (404) — no surface links to them, which is why they are inside S7-001 (dead tiles) rather than a broken-link finding.

Deployed-bundle verification (standing rule 4): the browse chunk `/_next/static/immutable/chunks/1aseb4gggkekc.js` fetched from www.verzatv.com contains `Opens Tubi`, `storageblue`, `Storage Pirates`, `Sugar Babies`, `Buy/Sell Miami`, `The Vertical Tea`, `aria-disabled`, `Browse Drama`, `is coming soon`, `Watch Free on Tubi`, `The Carpet`, `Landscape`. What is in the working tree is what is shipped.

---

## 2. Verdict per section

| Section | Verdict | Why |
|---|---|---|
| **Anime** | **Honestly empty** | The house pattern, live and correct. Named as a do-not-regress asset and it deserves it. |
| **Red Carpet** | **Finished** | Heading, 2 tiles, both live (12 + 13 eps), both -> player, back-tab correct, both free and labelled free. |
| **Español** | **Finished** (one blemish) | 5 live -> player, 1 coming-soon -> show page. Routing rule exactly right. Blemish: every live tile badged NEW (S7-013). |
| **Bollywood** | **Finished** (one blemish) | 6 live -> player, 4 coming-soon -> show page with honest copy. Same NEW-badge blemish (S7-013). |
| **Drama** | **Finished** | 76 destinations all 200, pinned six + Trending shelf render as designed. Hero link race is cosmetic (S7-016). |
| **Hot** | **Finished** | 20 tiles (popular + new merged), rank order, top-3 Trending, all destinations 200. |
| **Tubi** | **Neither** | Polished, but every play affordance lands on the catalogue home page (S7-011), the wordmark is inert, and the sponsorship disclosure is rendered off-screen (S7-003). |
| **Creators** | **Neither** | Nine finished sections and an honestly-empty showcase, wrapped around a four-step promise the production backend is fail-closed against (S7-002). |
| **Reality** | **Neither** | 1 of 4 tiles works; the other 3 are dead flyers presented identically (S7-001) and the hero is an inert poster for a show that does not exist (S7-008). |
| **Music** | **Neither** | One unlabelled image, zero text (S7-007). Not empty, not finished. |
| **/channels** | **Neither** | Renders, but calls a live show's channel "Coming Soon" (S7-005), links "View All 89 Shows" at an unfiltered 91-item page (S7-006), and renders one of four cards without description or icon (S7-015). |

---

## 3. Direct answers to the three specific asks

### 3a. Tubi's play buttons — where they ACTUALLY land

Crawled, not read. The panel contains **8 anchors and every one is `https://tubitv.com/`**:

```
a|https://tubitv.com/|WATCH FREE ON TUBI →|354x57
a|https://tubitv.com/||350x194   <- slide 1  (Central Intelligence, yellow play glyph in art)
a|https://tubitv.com/||350x194   <- slide 2  (Rango)
a|https://tubitv.com/||350x194   <- slides 3-6
a|https://tubitv.com/||350x194
a|https://tubitv.com/||350x194
a|https://tubitv.com/||350x194
a|https://tubitv.com/||350x194   <- clone of slide 1 (loop seam)
button|Show slide 1||22x7
button|Show slide 2..6||7x7
```

`https://tubitv.com/` crawled with an iPhone UA: **200, zero redirects.** All anchors carry `target="_blank" rel="noopener noreferrer sponsored"`.

The artwork is Tubi's own title cards with Tubi's yellow play button **rendered into the image**, so each slide reads as "play this film". It opens Tubi's front door instead. `TubiHeroCarousel.tsx` knows this and mitigates it with a fixed `OPENS TUBI ↗` chip over the active slide (`pointer-events: none`, so it never eats a tap) and a drag-vs-tap guard so a swipe does not navigate. Both work — verified in the live DOM and on screen. That is the honest reading of montage art, and it is a real improvement over the state the comment describes.

What is **not** mitigated: the large gradient-ringed, glowing Tubi wordmark at the bottom of the panel (`BrowsePage.tsx:795-816`) is `<div><div><Image/></div></div>` — no anchor. It is styled exactly like a button and is the only Tubi affordance with no destination at all.

### 3b. The storage-company advert on Music

**There is no storage-company advert on Music.** Measured at `/?tab=music`: `document.querySelectorAll('a[href*="storageblue"]').length === 0`.

In the deployed bundle the ribbon renders in exactly two places:
- `("drama"===v||"new"===v||"popular"===v)` — Drama and Hot (`"new"` is a dead branch, S7-018)
- inside the Reality block

Where it does render it works: `A | https://www.storageblue.com | 582x74`, image loads (`/ads/storageblue-logo.png`, "StorageBlue — THE CHEAPEST SELF STORAGE"), destination 200 via one `www` -> apex redirect. Its defect is that it carries **no user-visible Ad/Sponsored label and no `rel="sponsored"`** (S7-010) — the anchor's `innerText` is the empty string; its whole content is one `<img alt="StorageBlue">`.

Music itself renders one poster and nothing else — `innerText === ""` (S7-007).

### 3c. Every Reality tile

Measured at `/?tab=reality`, all four:

| Tile | Element | Destination | Live? |
|---|---|---|---|
| Sugar Babies | `DIV aria-disabled="true"` 286x471 | none | `/series/sugar-babies` -> **404** |
| Buy/Sell Miami | `DIV aria-disabled="true"` 286x471 | none | `/series/buy-sell-miami` -> **404** |
| The Vertical Tea | `DIV aria-disabled="true"` 286x471 | none | `/series/the-vertical-tea` -> **404** |
| Storage Pirates | `A` 286x471, "Landscape" chip | `/series/storage-pirates/1` | **200**, 13 eps, all free |

All four render an identical poster + title + "Reality" subtitle. Nothing distinguishes the three that do nothing. The Coming Soon badge that this same component applies to catalog coming-soon rows on Español and Bollywood is not applied here. `aria-disabled="true"` on a plain `<div>` with no `role` is invisible to assistive technology (measured: `role=-`, `tabindex=-`). Plus the hero above the grid: `HERO_IS_LINK=false`, `HERO_ALT="Buy/Sell Miami"` — a large inert poster for one of the three shows that do not exist.

---

## 4. Findings

Ranked most severe first. Full detail in the structured findings list.

| ID | Sev | Summary |
|---|---|---|
| S7-001 | S2 | Reality: 3 of 4 tiles are dead flyers, presented identically to the one that plays |
| S7-002 | S2 | Creators promises a pipeline that is 503-fail-closed at two points in production |
| S7-003 | S2 | Tubi's sponsorship disclosure renders off-screen with no way to scroll to it |
| S7-004 | S3 | Active-tab indicator off-screen past the third section — **confounded, re-verify** |
| S7-005 | S3 | Channels calls StorageBlue "Coming Soon" while Storage Pirates plays |
| S7-006 | S3 | "View All 89 Shows" -> unfiltered /discover listing 91 |
| S7-007 | S3 | Music is a single unlabelled poster with zero text |
| S7-008 | S3 | Reality hero is inert and mostly shows a nonexistent show |
| S7-009 | S3 | Carousel dots are 6-7px tap targets on four sections |
| S7-010 | S3 | StorageBlue advert has no visible Ad/Sponsored label and no `rel="sponsored"` |
| S7-011 | S3 | Tubi play buttons all land on the home page; wordmark inert |
| S7-012 | S3 | The audit manifest's own catalog summary says 1 live / 0 coming soon |
| S7-013 | S4 | NEW badge fix inert: every live Español/Bollywood tile still badged |
| S7-014 | S4 | "Anime" and "Creators" tab labels unlocalized in all 20 locales |
| S7-015 | S4 | Channels: "The Carpet" card has no description and an empty icon |
| S7-016 | S4 | Hero link target flips at the start of the 500ms crossfade |
| S7-017 | S4 | "1 episodes" on the Music tab's only title |
| S7-018 | S4 | Dead `activeTab === "new"` branch in the shipped bundle |

### Two findings that are the same failure mode

**S7-013** and **S7-004** are both cases of standing rule 1 — a fix written into the code and never observed to change behaviour:

- `BrowsePage.tsx:546-549` says Español/Bollywood "used to badge EVERY tile as New... a badge on all six tiles carries no information... They now run the same positional rule as every other tab." The positional rule, with `NEW_SLOTS = 6` and 5/6 live tiles, badges every live tile. Same outcome, new mechanism.
- `CategoryTabs.tsx:96-104` documents the tab-rail bug ("five grey labels, no pink one, no underline") and fixes it with `scrollBy`. The reduced-motion branch uses `behavior:"instant"`, which I verified lands exactly. The branch every ordinary viewer gets uses `behavior:"smooth"`. The same file's neighbouring comment already establishes that in this codebase `"instant"` is "the value that actually jumps" — the lesson was learned one line above and not applied one line below.

### On S7-004's confound (standing rule 3)

Every browser measurement I took ran in a tab whose `document.visibilityState` was `"hidden"`, because other agents held the Chrome foreground for the whole session and I could not take it back. Chrome suspends smooth-scroll animation and IntersectionObserver delivery in hidden tabs, so any finding that depends on either is unreliable.

I ran a negative control before deciding what to keep. On the Drama pagination sentinel I installed **my own** `IntersectionObserver` with the same `rootMargin` on the same node: it did not fire either. That kills the observation, so the Drama pagination stall is filed as a **gap, not a finding**, and all 76 Drama destinations were crawled by HTTP instead (76/76 -> 200).

S7-004 survives at reduced severity because it has a positive control the pagination case does not: the component's own delta run with `behavior:"instant"` lands exactly (delta 304 -> `scrollLeft` 304 -> visible), and two rendered screenshots show the failure at paint time. It still must be reproduced in a foreground tab before anyone edits `CategoryTabs.tsx:132`.

---

## 5. What is finished and should not be touched

Recorded so a fixer does not "improve" any of it:

- **The Anime empty state.** Verified live: "Anime is coming soon" / "We're lining up the first titles for this section. Everything else on VERZA is ready to watch right now." / a working "Browse Drama" button. It is the house pattern and it works.
- **The 5 coming-soon show pages.** All 200. "Episodes are on the way — The footage for this title hasn't landed yet, so there is nothing to play and nothing on sale. Everything else on VERZA is ready to watch right now." No price, no buy button, `noindex, follow`, "Browse VERZA" as the way forward.
- **The catalog routing rule across every section tab.** 116 tile instances covering all 96 rows: 91 live -> `/series/<slug>/1`, 5 coming-soon -> `/series/<slug>`. No inversion anywhere.
- **The free-run claim on the wholly-free titles in scope.** `too-much-junk`, `storage-pirates`, `exes-premiere`, `love-awards`, `the-dumb-billionaire-heiress-in-love` all read "All Episodes FREE" with no `1.99` anywhere in the HTML.
- **Back-tab correctness.** Every section episode page carries the right `?tab=`: music, reality, red-carpet, bollywood, espanol.
- **The Creators channel-showcase empty state** ("The first channels are being built") and **the signed-out /creator state** ("Sign in to apply, upload, and manage your channel").
- **Tubi's swipe-vs-tap guard and the "Opens Tubi ↗" chip.** Both correct and both load-bearing.
- **THE MICRODRAMA APP** under the logo, the poster art, and instant play from a poster tap — all present and working on every tab I opened.

---

## 6. Reproduction notes

Every URL used:

- Tabs: `https://www.verzatv.com/?tab={drama,popular,tubi,anime,espanol,bollywood,reality,creators,red-carpet,music}`
- Pages: `/channels`, `/creator`, `/studio`, `/founder`, `/discover`
- APIs probed read-only: `GET /api/creator/channels` (200, `{"channels":[]}`), `GET /api/creator/me` (401), `POST /api/mux/webhook` with `{}` (503 — unsigned, cannot mutate; the route checks the secret before touching anything)
- External: `https://tubitv.com/`, `https://www.storageblue.com`, `https://apps.apple.com/app/id6752884623` — all 200

Files that carry the findings:

- `/Users/jothamhall/E! CREATOR ECONOMY/verza-tv/components/BrowsePage.tsx` (Reality tiles :873/:904, Reality hero :842, Tubi panel height :745, Tubi wordmark :795, StorageBlue ribbons :912 and :1085, Music branch :668, hero link :987, NEW_SLOTS :98, dead "new" branch :1086)
- `/Users/jothamhall/E! CREATOR ECONOMY/verza-tv/components/TubiHeroCarousel.tsx` (:34 TUBI_HOME, :149 href, :189 chip, :198 dots)
- `/Users/jothamhall/E! CREATOR ECONOMY/verza-tv/components/CategoryTabs.tsx` (:14 TAB_KEYS, :123 delta, :132 scroll behavior)
- `/Users/jothamhall/E! CREATOR ECONOMY/verza-tv/components/CreatorsLanding.tsx` (:233, :288, :289, :361)
- `/Users/jothamhall/E! CREATOR ECONOMY/verza-tv/app/channels/page.tsx` (:19 CHANNEL_META, :111 sort, :229 View All)
- `/Users/jothamhall/E! CREATOR ECONOMY/verza-tv/app/api/creator-unlock/route.ts` (:6-11)
- `/Users/jothamhall/E! CREATOR ECONOMY/verza-tv/app/api/mux/webhook/route.ts` (:19-26)
- `/Users/jothamhall/E! CREATOR ECONOMY/verza-tv/app/globals.css` (:170 hero-crossfade, :699 `* { scroll-behavior: smooth }`)
- `/Users/jothamhall/E! CREATOR ECONOMY/verza-tv/lib/i18n.ts` (tab.* keys, 20 locales)
- `/Users/jothamhall/E! CREATOR ECONOMY/verza-tv/docs/audit/00-manifest.json` (`catalog.live`, `catalog.comingSoon`)
