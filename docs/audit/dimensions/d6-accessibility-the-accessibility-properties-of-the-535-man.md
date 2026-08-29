# D6 — Accessibility. The accessibility properties of the 535 manifest interactive elements (accessible name, tap-target size, focus indicator, keyboard operability, state exposure) and the 65 page-route patterns (dark-mode contrast, heading/landmark structure, focus order, skip links, reflow at 320px, reduced-motion handling, screen-reader traversal of the player). Measured against the DEPLOYED bundle at www.verzatv.com in a true 320x900 viewport, not against the working tree.

**Coverage: 594 of 600 items examined.** 26 findings raised.

## Gaps — items in scope this agent could not examine

Six of the 65 page route patterns could not be examined in their real rendered state; all six were still examined statically for accessible names and size classes, and their interactive elements are inside the 535/535 static count.

1. /shop/[slug] — 404s for every product in production by design. app/shop/[slug]/page.tsx:30 calls notFound() unless MERCH_CHECKOUT_ENABLED === "true", which it is not (consistent with AGENTS.md rule 2, merchandise Checkout fail-closed). Verified: /shop/champion-tie-dye-hoodie and /shop/verzatv-mug both return the 404 body. NEEDS: MERCH_CHECKOUT_ENABLED=true on a preview deployment. This also leaves components/AddToCartButton.tsx (6 items), components/ImageCarousel.tsx (6) and components/CartDrawer.tsx (11) unreachable at runtime.
2. /c/[slug] — no published creator channel exists to resolve. /c/verza returns "Clip Not Found". NEEDS: a published row in creator_content, which is blocked because the Mux creator-ingest webhook returns 503 with its verification secret intentionally absent.
3. /watch/[...slug] — same cause as (2); requires a published creator title.
4. /admin/dashboard — the proxied request rendered the browse page rather than the admin surface, so what I measured was not the admin UI. NEEDS: an authenticated admin session. 35 interactive items in components/CreatorDashboard.tsx and 17 in components/AdminReview.tsx are therefore static-only.
5. /admin/review — same, not reachable unauthenticated.
6. /dev/perf — returns a 404 body in production. NEEDS: the dev flag that gates it.

Additional coverage caveats:
- Of the 535 manifest interactive elements, all 535 were examined statically (accessible name, size classes, focus handling) and 2,679 rendered instances were measured live. The elements only reachable behind sign-in or the disabled creator/merch rails — notably components/creator/ApplicationWizard.tsx (26), components/AmazonBag.tsx (15), components/creator/ui.tsx (11), components/VipCard.tsx (9), components/AskVerza.tsx (9), components/LanguagePicker.tsx (8), components/CreatorWatch.tsx (7) — were not measured in a real viewport, so their tap-target sizes and contrast are asserted from source rather than measured. The 36-input focus-ring finding (D6-008) covers 17 of the ApplicationWizard fields on that basis.
- Screen-reader traversal was reconstructed from the DOM accessible-name sequence, the real Tab order, and the live cascade; it was not verified with VoiceOver or TalkBack on a device. A device pass would confirm the announcement wording for D6-011, D6-015, D6-017 and D6-018.
- prefers-reduced-motion could not be toggled in the harness browser, so D6-016 was verified by enumerating the reduced-motion rules present in the live cascade and confirming that the animating elements match none of them, rather than by observing motion stop. That is the cascade-level equivalent of observing the effect; a device pass with Reduce Motion on would close it.
- The site sends x-frame-options: DENY, so the 320px measurements were taken through a local read-only reverse proxy of www.verzatv.com that strips only X-Frame-Options and CSP. All HTML, CSS and JS measured were the deployed bundle (CSS chunk /_next/static/immutable/chunks/1y2muhl66_cr7.css); nothing local was substituted.
- Two of the routes I first probed were 404s from slugs I guessed wrong (/shop/verza-classic-tee, /series/mi-jefe-obsesionado); both were re-run against real slugs pulled from the live sitemap and lib/catalog.ts, and the 404 measurements were discarded from the totals.

---

# D6 — Accessibility audit

**Target:** https://www.verzatv.com (production, deployed bundle)
**Method:** measured, not estimated. All geometry, contrast and focus values were read from the live site in a real 320x900 viewport; all CSS claims were checked against the deployed stylesheet chunk `/_next/static/immutable/chunks/1y2muhl66_cr7.css`, not against `app/globals.css`.
**Date:** 2026-08-29

---

## Coverage

| | In scope | Examined | Fraction |
|---|---|---|---|
| Interactive elements (manifest) | 535 | 535 statically; 2,679 rendered instances measured live | **535 / 535** |
| Page route patterns | 65 | 59 rendered in their real state | **59 / 65** |
| **Total** | **600** | **594** | **99%** |

61 distinct URL instances were loaded and measured. 6 route patterns are gaps, each with a stated cause — see **Gaps**.

### Headline measurements

| Measure | Result |
|---|---|
| Interactive instances measured at 320px | 2,679 |
| …below 44x44 (Apple HIG) | **1,853 (69%)** |
| …below 24x24 (WCAG 2.5.8 AA) | **943 (35%)** |
| Text nodes failing WCAG AA contrast | **2,609** |
| Routes with a skip link | **0 / 61** |
| Routes with any `aria-live` region | **0 / 61** |
| Routes with a labelled `<nav>` | 4 / 61 |
| Routes with no `<h1>` | 6 / 61 |
| Images missing `alt` | **0 / 561** ✅ |
| Routes with horizontal overflow at 320px | **0 / 7 tested** ✅ |
| Episodes with captions | **0** |

---

## How the measurements were taken

The site sends `x-frame-options: DENY`, and the browser window could not be resized below the desktop breakpoint (the site swaps to a 400px iPhone frame above 520px, so a desktop window never exercises the mobile branch). To get a genuine 320px viewport against the deployed bundle, I ran a local read-only reverse proxy of `www.verzatv.com` that strips *only* `X-Frame-Options` and CSP, and framed it at 320x900. `matchMedia('(min-width: 520px)')` returned `false` inside the frame, confirming the mobile branch was active, and `.app-shell` measured 320px. Every byte of HTML, CSS and JS measured came from production.

Contrast was computed by resolving each text node's computed colour against its true composited background (walking ancestors and alpha-compositing until an opaque layer), then applying the WCAG relative-luminance formula with the correct large-text threshold (≥24px, or ≥18.66px at weight ≥700).

---

## Findings

### S2 — a viewer cannot complete an intended task

#### D6-001 · No captions or subtitles exist on any episode
`components/EpisodeFeed.tsx` · catalog-wide · **WCAG 1.2.2, Level A**

The deployed player renders three `<video>` elements; all three measure `controls=false muted=true aria=null tabindex=null textTracks=0`. There is no CC control in the player chrome. This is not a player bug — the media has no caption track to attach:

```
$ curl -sS https://stream.mux.com/BbnqVaxO3wZAy02p00AZ9B3Oa97OZIoRCJgJUwtA2Ggi8.m3u8
#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="audio-hi-0",...,LANGUAGE="und",...
#EXT-X-STREAM-INF:...,RESOLUTION=1080x1920,CLOSED-CAPTIONS=NONE
```

I sampled 14 series at random (seed 7) across the 91-series public map:

| Series | subtitle rendition | CLOSED-CAPTIONS | audio LANGUAGE |
|---|---|---|---|
| good-for-him | none | NONE | und |
| cleopatra | none | NONE | und |
| revenge-on-my-cheating-fiance | none | NONE | und |
| the-goat-mistress-es | none | NONE | und |
| under-her-control | none | NONE | und |
| marry-the-wrong-bride | none | NONE | und |
| the-perfect-husband | none | NONE | und |
| the-winter-veil | none | NONE | und |
| the-billionaires-lost-love | none | NONE | und |
| love-awards | none | NONE | und |
| two-worlds-apart | none | NONE | und |
| the-ceo | none | NONE | und |
| in-love-with-my-godfathers-daughter | none | NONE | und |
| the-billionaires-betrayal | none | NONE | und |

**0 / 14** carry a subtitle rendition. There are zero `<track>` elements in the codebase. `lib/audio-language.ts:97-100` documents that Hindi titles ship burned-in English subs and that advertising a subtitle track the product has never delivered would be dishonest — so the team knows. This is the single largest accessibility exposure in a dialogue-driven drama product, and it confirms the manifest's known-open `LANGUAGE=und` item at the same time.

---

#### D6-002 · Pinch-zoom is blocked
`app/layout.tsx:96` · all 65 routes · **WCAG 1.4.4, Level AA**

```ts
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,      // <- blocks zoom
  viewportFit: "cover",
};
```

Emitted verbatim in production:
```html
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover"/>
```

Scope matters here and I want to be precise: iOS Safari and Android Chrome both override `maximum-scale` for pinch. **WKWebView does not** — which is exactly what the approved iOS app renders in. So the case where this actually blocks a low-vision viewer is the shipped native client.

---

#### D6-003 · The player cannot be operated from a keyboard
`components/EpisodeFeed.tsx:1049`, `:2065` · **WCAG 2.1.1, Level A**

Real Tab-key traversal on the deployed episode page:

```
Tab -> BODY
Tab -> A:Back
Tab -> BUTTON:Unmute
Tab -> BUTTON:Fullscreen
Tab -> BUTTON:Like
Tab -> BUTTON:Save to My List
Tab -> BUTTON:Share
Tab -> BUTTON:More options
Tab -> DIV.no-scrollbar
```

Seven controls, and **no play, pause, seek or next-episode control among them**. Play/pause is an `onClick` on a bare div:

```tsx
<div className="relative w-full select-none overflow-hidden"
     style={{ height: "var(--feed-h, 100dvh)", ... }}
     onClick={handleTap}>          // EpisodeFeed.tsx:1049
```

No `role`, no `tabIndex`, no `onKeyDown`. The video has `controls=false`, so entering fullscreen does not surface native controls either. The feed's scroll container (`:2065`) has `overflowY: auto` with no `tabIndex`, `role` or `aria-label`; arrow-key scrolling works in the Chrome I measured in only because of Chrome's keyboard-focusable-scrollers behaviour. Safari — and therefore WKWebView, the iOS client — does not make plain scrollers focusable, so on iOS there is no keyboard path to the next episode at all.

The only `keydown` listener in the file (`:1559`) resets the unattended-advance counter and does not control playback.

---

#### D6-004 · Arabic renders left-to-right
`components/LangProvider.tsx` / `components/ContentTranslator.tsx` · **RTL locale broken**

Measured after choosing العربية on the live site:

```json
{"clicked":true,"lang":"ar","dir":"(empty)","computedDir":"ltr",
 "nav":["اكتشف","مقاطع","متجر","مكتبة","الملف الشخصي"]}
```

The copy translates correctly — the direction never changes. An exhaustive grep over `app/ components/ lib/` for `documentElement.dir`, `document.dir`, `.dir =`, `dir="`, `dir={` (excluding `data-dir`) returns **exactly one hit**: `components/EpisodeFeed.tsx:2511`, on the paywall overlay only. `LangProvider.tsx:93` and `:105` and `ContentTranslator.tsx:58` set `lang` and never `dir`. So the paywall is the one RTL-correct surface in the product; everything else — nav, headings, poster grid, forms, footer — mirrors the wrong way for Arabic readers.

---

### S3 — the task completes but the experience is broken

#### D6-005 · The muted token fails AA everywhere
`app/globals.css:8` · `lib/theme.ts:8` · **1,715 failing nodes on 62 of 64 routes**

| Foreground | Background | Ratio | Needs | Failing nodes |
|---|---|---|---|---|
| `#6B6B7B` | `#12121C` (card) | **3.56:1** | 4.5:1 | 1,042 |
| `#6B6B7B` | `#07070E` (page) | **3.84:1** | 4.5:1 | 671 |

This token carries most of the product's secondary copy: the `61 ep · …` meta line under every poster (276 nodes on `/discover` alone, at 10px), the entire footer link list, the `/me` section labels, and the **Sign Out** row at 14px/600. It is defined once as `--color-muted` and once as `theme.textMute`, and 76 component files import the theme object — so a single-token change fixes all 1,715. Roughly `#8A8A9C` clears 4.5:1 on both surfaces.

#### D6-006 · The accent as text fails AA
`app/globals.css:10` · **732 failing nodes on 49 routes**

| Context | Ratio | Where |
|---|---|---|
| `#E0115F` on `rgb(25,8,21)` | 4.07:1 | 357 nodes — `/sitemap` series links |
| `#E0115F` on `rgb(45,18,37)` | 3.60:1 | 137 nodes — `/discover` genre chips |
| `#E0115F` on `#07070E` | 4.22:1 | 91 nodes — legal links, email links |
| `#E0115F` on `rgb(18,18,28)` | 3.91:1 | the `EP` label |
| `#E0115F` on `rgb(26,26,38)` | **3.62:1** | **`$1.99`** on the series page |
| `#E0115F` on `rgb(50,9,30)` | 3.69:1 | `First 5 Episodes FREE` |

The price and the free-run promise are both below AA. The accent is fine as a *fill*; only the text usage fails.

#### D6-007 · Ink on accent fills is 4.34:1
`#F5F4F8` on `#E0115F` measures **4.34:1** (153 nodes on 9 routes) — e.g. the `Drama · Betrayal` pill at 12px/600. Pure `#FFFFFF` on the same fill reaches 4.76:1 and passes. The purple `NEW` badge is `#FFFFFF` on `#8B5CF6` = **4.23:1** at 8px bold (18 nodes), which is also the smallest type in the product.

---

#### D6-008 · Form fields have no focus indicator
36 of 38 `outline-none` usages · **WCAG 2.4.7, Level AA**

Measured on the deployed sign-in page:

```
#email    -> fv=true  outline=none/1px/rgb(0,95,204)   shadow=none
#password -> fv=true  outline=none/1px/rgb(0,95,204)   shadow=none
button[type=submit]            -> fv=true  outline=solid/2px/rgb(224,17,95)  shadow=set
a[href="/forgot-password"]     -> fv=true  outline=solid/2px/rgb(224,17,95)  shadow=set
```

`:focus-visible` matches and the computed outline is `none` with no box-shadow. The deployed stylesheet contains exactly one focus rule:

```css
a:focus-visible,button:focus-visible{outline-offset:2px;outline:2px solid #e0115f;box-shadow:0 0 12px #e0115f4d}
.outline-none{--tw-outline-style:none;outline-style:none}
```

Nothing targets `input`, `textarea`, `select`, `summary` or `[tabindex]`. Of 38 `outline-none` occurrences only 2 (`app/sign-up/page.tsx:89`, `:107`) pair it with `focus:ring-2`. Affected: `app/sign-in/page.tsx:106,118`; `app/sign-up/page.tsx:126`; `app/forgot-password/page.tsx:107`; `app/reset-password/ResetPasswordClient.tsx:218,233`; `app/search/page.tsx:112`; `components/SearchBar.tsx:47`; `components/SearchButton.tsx:102`; `components/FeedSearch.tsx:87`; and 17 fields in `components/creator/ApplicationWizard.tsx`. `ApplicationWizard.tsx:285` additionally puts `outline-none` on the step heading that `:100` calls `.focus()` on — so the wizard's own focus move is invisible.

---

#### D6-009 · Carousel dots are 6x6 CSS pixels
`BrowsePage.tsx:856`, `:1067`, `HeroCarousel.tsx:82`

Measured on the deployed home page: `20x6 "Slide 1"`, then `6x6 "Slide 2"` … `6x6 "Slide 6"`, separated by `gap-1.5`. That is a quarter of the WCAG 2.5.8 minimum and a seventh of Apple's guidance. All three implementations wrap the dot in `className="p-0 border-0 cursor-pointer"` — literally zero padding. None exposes selected state (`aria-label="Slide N"` with no `aria-current`/`aria-selected`).

#### D6-010 · Tap targets are systematically undersized
**1,853 / 2,679 (69%) below 44x44 · 943 (35%) below 24x24**

The catalog's primary navigation is the worst case:

```
69x31.5 "Drama"      38.3x31.5 "Hot"        76x36 "Tubi"
60.3x31.5 "Anime"    83.7x31.5 "Español"    114.8x31.5 "Bollywood"
77.7x31.5 "Reality"  96.8x31.5 "Creators"   111.9x31.5 "Red Carpet"
59.6x31.5 "Music"
```

`CategoryTabs.tsx:211` uses `p-0 pb-1.5`, so the target *is* the text box. Bottom nav links measure `59.2x41` (`BottomNav.tsx:102` — a flex-col `Link` inside an `items-center` row, so it never stretches into the nav's 54px content box). Header controls are `36x36`. Player Back/Unmute/Fullscreen are `40x40`; the action rail (Like/Save/Share/More) is `44x63` and **passes**. Episode-picker prev/next are `39x39`.

#### D6-011 · Two controls ship with no accessible name
Across 2,679 measured instances, exactly two resolved to an empty name:

- `/shorts` — `a 40x40 href=/` (`ShortsFeed.tsx:108`, icon-only, no `aria-label`, no `<title>`)
- `/series/<slug>` — `a 38.8x38.8 href=/series/<slug>/2` (`EpisodeDropdown.tsx:98`; the prev twin at `:47`)

Reproduced on `/series/the-goat-mistress-es`, so it is catalog-wide, not one title. Everything else named correctly, and **0 of 561 images were missing `alt`** — the alt-text discipline in this codebase is genuinely good.

#### D6-012 · No skip link anywhere
0 of 61 routes. On the home page the first bottom-nav link is the **62nd** tabbable element (`{"tabbableCount":66,"firstBottomNavTabIndex":61}`). `app/layout.tsx` renders `<main className="flex-1 pb-16">` with no `id`, so there is not even a target to skip to.

#### D6-013 · Missing heading structure on the top surfaces
The **home page renders zero headings of any level**. `/?tab=anime` likewise. The episode/paywall route's only heading is an `<h3>` (`Unlock All Episodes`) with no `h1` or `h2` above it. 6 of 61 routes have no `h1`: `/`, `/shorts`, `/?tab=anime`, `/series/the-mistress-trap/2`, `/series/the-mistress-trap/6`, `/share`.

#### D6-014 · Overlays are not dialogs
With the player's More sheet open on the deployed site:

```json
{"dialogs":0,"ariaModal":0,"activeEl":"BODY/",
 "focusablesWhileOpen":["Back","Unmute","Fullscreen","Like","Save to My List",
                        "Share","More options","Messages","WhatsApp","X","Copy link"]}
```

Focus never enters the sheet and all seven background controls stay tabbable behind the scrim. Codebase-wide: **one** `role="dialog"` (`InstallPrompt.tsx:206`, a component the product no longer mounts), zero `aria-modal`, zero `<dialog>`, zero focus traps. Escape is handled in 4 places only (`FeedSearch:37`, `AmazonProducts:257`, `SeriesInfoDrawer:119`, `SearchButton:38`) — not in EpisodeFeed, CartDrawer, AmazonBag, AskVerza or LangDropdown.

#### D6-015 · No live regions at all
0 `aria-live` elements on 61 routes. Advancing an episode, toggling mute, saving, liking and crossing the free-episode boundary all change the screen silently. The three `role="alert"` nodes that exist (`EpisodeFeed:1124`, `:2639`, `CartDrawer:206`) fire only on failure.

#### D6-016 · Reduced motion is honoured, but not completely
The deployed cascade has four `prefers-reduced-motion` blocks covering eight selector groups:

```
@wizardFade · .wizard-step[+data-dir]
.animate-fadeIn, .animate-slideUp, .animate-rise, .animate-cardIn, .stagger-children > *
video, img
.tab-slide-next, .tab-slide-prev
.tubi-glow
.tubi-live-dot, .tubi-rise
[role="status"][aria-label="Loading"]
```

Not covered, verified against the live cascade:

- `.glow-pulse{animation:2s ease-in-out infinite glow-pulse}` — on the **paywall CTA** (`EpisodeFeed:2618`), the **series-page CTA** (`app/series/[slug]/page.tsx:297`) and the library CTA (`LibraryPage:162`). Runtime check on the deployed series page returned `glow-pulse xinfinite covered=false <A .glow-pulse …>` next to `rise x1 covered=true` — so the mechanism works, this class just isn't in it.
- `.skeleton{…animation:1.5s ease-in-out infinite shimmer}` — 12 usages.
- `*{scroll-behavior:smooth}` — applied to every element, never reset.
- Unguarded infinite animations at `AskVerza.tsx:505`, `CreatorAITools.tsx:108`, `Player.tsx:1074`.

**This is a motion fix only.** It does not touch the paywall's price, its "one-time" repetition, the Stripe naming, or the equal-weight Go Back — those stay exactly as they are.

#### D6-017 · The bottom nav never says which tab is current
```ts
const ACTIVE = "#FFFFFF";
const INACTIVE = "#FFFFFF";     // BottomNav.tsx:9-10
```
The `isActive` branch at `:100` picks between two identical values. There is no `aria-current` on the nav (the codebase's single `aria-current` is at `CategoryTabs.tsx:210`, which does it right), and the `<nav>` at `:88` has no `aria-label`. The only cue is a 4px gradient bar.

#### D6-018 · The episode picker's lock state is icon-only
`EpisodeDropdown.tsx:158-166` renders text for `NOW` and text for `FREE`, but a bare unlabelled 12x12 padlock `<svg>` for every paid row. A screen reader hears free and current episodes distinguished and paid ones not distinguished at all. Rows are `px-3 py-2.5` = 40px tall.

> **Protected asset note:** the FREE badges and padlocks are named as things that already work. The fix is a visually-hidden text alternative *beside* the padlock — the padlock stays.

---

### S4 — polish

| ID | Finding | Evidence |
|---|---|---|
| D6-019 | Footer targets 18px tall; social links 18x18 | `Footer.tsx:84-95`, no padding around an 18px svg. Names resolve correctly via `title=`. |
| D6-020 | `aria-label="Categories"` on a role-less `<div>` → not exposed | `CategoryTabs.tsx:189`. The rail must keep `overflow-x-auto` (BrowsePage's swipe handler matches on it), so the fix is a role or wrapping `<nav>`. |
| D6-021 | Search inputs labelled by placeholder only | `/search`, `SearchBar.tsx:44`, `SearchButton.tsx:102`, `FeedSearch.tsx:87`. 6 of 8 measured fields do have a real `<label for>`. |
| D6-022 | No `forced-colors` / `prefers-contrast` in the deployed CSS | 0 occurrences in 47,754 bytes. (`prefers-color-scheme` is also 0, but that is a deliberate dark-only choice, not a defect.) |
| D6-023 | SSG ships `lang="en"`, corrected only after hydration | `app/layout.tsx:106`; verified on the Spanish title `/series/the-goat-mistress-es`. |
| D6-024 | The last 73px of every page sits behind the fixed nav | `footer` `padding-bottom: 0px`, footer bottom 2596 = document height 2596, nav height 73. Only leaf in the band: `P [2531..2564] "2026 VERZA TV All rights r"`. `main` reserves 76px; `footer` is its sibling and reserves nothing. |
| D6-025 | Arabic Profile label wraps to 2 lines in the nav | Cells `[59x41,59x41,59x41,59x41,59x52]`, labels `[31x11,27x11,23x11,25x11,59x22]`. |
| D6-026 | `SeriesInfoDrawer` is dead code (8 manifest items) | Nothing imports `SeriesInfoButton`. Latent defect inside it: `:324` sets inline `outline:'none'` on non-active episode rows, which would beat the stylesheet's `button:focus-visible` ring. Fix before wiring it up. |

---

## What passes

Recording these so nobody re-litigates them:

- **0 of 561 images are missing `alt`** across 61 routes. Consistently good.
- **No horizontal overflow at 320px** on any route tested (`scrollWidth === innerWidth === 320` on `/`, `/shop`, `/sign-in`, `/series/<slug>`, `/support`, `/sitemap`, `/discover`). WCAG 1.4.10 Reflow passes. The only elements extending past the viewport are the category tabs inside their own `overflow-x-auto` scroller — intentional.
- **`a` and `button` have a correct, generous focus ring**: 2px solid `#E0115F` with 2px offset and a glow. The gap is only that it doesn't extend to form controls.
- `aria-current="page"` on the active category tab (`CategoryTabs.tsx:210`).
- `role="alert"` on the checkout error (`EpisodeFeed.tsx:2639`) and the player error (`:1124`).
- Reduced-motion handling genuinely exists and works for 8 selector groups — including a thoughtful one that leaves the buffering spinner as a *static ring* rather than nothing, so it still says "working".
- `sr-only` labels on the sign-in, sign-up and forgot-password fields; the age-gate checkbox is correctly wrapped in a `<label>`.
- The player's action rail (Like / Save / Share / More) measures **44x63** — the only chrome in the product that meets 44pt.
- The paywall's Go Back is **241x50**, the same visual weight as the 241x53 CTA, and it is a real `<a href>`. Both the geometry and the honesty properties are intact.
- `html lang` *is* kept in sync with the chosen locale on the client (`ContentTranslator.tsx:58`) — the direction is the part that was never wired.

---

## Interaction with the DO-NOT-REGRESS list

Three findings touch protected surfaces. In each case the fix is additive and does not disturb what testers praised:

1. **D6-016 (paywall CTA pulses under reduced motion)** — add `.glow-pulse` to the existing reduced-motion block. Price, "one-time", Stripe naming, Go Back weighting, absence of countdown/fake-discount all untouched.
2. **D6-018 (padlock has no text alternative)** — add visually-hidden text beside the padlock. The padlock and the FREE badges stay exactly as they are.
3. **The Anime empty state** — its "Browse Drama" CTA measures `124.9x36`, under 44pt. Flagging it only because the sweep caught it; the empty state's copy and structure are the house pattern and should not change. Its one real gap is that the tab renders **zero headings**, which is D6-013.

---

## Fix order (highest value per unit of work)

1. **`--color-muted` → ~`#8A8A9C`** (one token, two files) clears 1,715 of the 2,609 contrast failures.
2. **Add `input, textarea, select, summary, [tabindex]` to the `:focus-visible` rule** (one CSS line) fixes all 36 invisible-focus controls.
3. **Add `.glow-pulse, .skeleton, html` (scroll-behavior) to the reduced-motion block** (three selectors).
4. **`aria-label` on `ShortsFeed.tsx:108` and `EpisodeDropdown.tsx:47/:98`** (three attributes) fixes the only two unnamed controls in the product.
5. **Drop `maximumScale: 1`** (one line) restores zoom for the iOS client.
6. **Set `document.documentElement.dir`** alongside the existing `lang` writes in `LangProvider.tsx:93/:105` (two lines) unbreaks Arabic.
7. **Vertical padding on `CategoryTabs.tsx:211` and a stretched `BottomNav` link** lifts the two most-used navigations over 44pt.
8. Captions (D6-001) and player keyboard support (D6-003) are the two that need real engineering, not a token change.
