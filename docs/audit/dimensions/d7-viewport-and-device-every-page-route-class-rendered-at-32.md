# D7 — Viewport and device. Every page-route class rendered at 320 / 375 / 390 / 430 / 768 px, plus safe-area behaviour, thumb reach, and the specific question of whether the Amazon affiliate pill still overlaps the paywall's Go Back on real phone geometry. Geometry was computed from the deployed stylesheet (https://www.verzatv.com/_next/static/immutable/chunks/1y2muhl66_cr7.css) rendered against each route's live server HTML in fixed-size same-origin iframes, so media queries evaluated against real device viewports rather than a resized desktop window (Chrome will not size a window below ~606px). The pill/paywall collision was additionally reproduced end-to-end on the live production page with no injection.

**Coverage: 300 of 325 items examined.** 17 findings raised.

## Gaps — items in scope this agent could not examine

25 of the 325 scoped items (5 route classes x 5 widths) could not be rendered in their intended state, and a further 10 were examined only in a redirected state.

1. /[handle] (5 items) — needs a published, approved creator channel row in Supabase. https://www.verzatv.com/@verza returns 404. Needs: a seeded published channel, or a preview deployment with fixture data.
2. /c/[slug] (5 items) — lib/clips.ts:41 declares `const CLIPS: Clip[] = []`, so getClipBySlug can never resolve and every clip URL 404s in production. Needs: a real clip row before the route can be laid out at all.
3. /watch/[...slug] (5 items) — app/watch/[...slug]/page.tsx:44-54 requires a published creator_content row with a free pricing_type and a Mux playback id. None exist. Needs: a published free creator title.
4. /shop/[slug] (5 items) — app/shop/[slug]/page.tsx:8-12 returns no static params unless MERCH_CHECKOUT_ENABLED === "true"; all product URLs 404 in production. Needs: a preview deploy with that flag on, since the merch detail page carries an image carousel and quantity steppers that D7 has never measured.
5. /dev/perf (5 items) — gated by PERF_TEST_MODE (app/dev/perf/page.tsx:12); 404 in production. Needs: a preview deploy with the flag on. components/PerfHarness.tsx:107 contains a `minWidth: 280` that has never been rendered at 320px.
6. /admin/dashboard and /admin/review (10 of the 300 counted as examined) — both return 307 to / without an admin cookie session (verified: x-matched-path /admin/dashboard, HTTP 307, and the followed response is byte-identical to / at 113,899 bytes). What I measured at all five widths is the homepage, not the admin UI. components/AdminDashboard.tsx contains `w-[160px]` and 24x24 controls that D7 has not rendered. Needs: an admin session cookie.

Additional qualifications on the 300 that were examined:

7. No real iOS device or simulator was exercised. safe-area-inset values (D7-003, D7-005, D7-011) were reproduced by re-declaring every env()-reading rule with literal 34/47/59px insets against the deployed stylesheet — correct arithmetic, but not an on-device observation. Likewise iOS Safari's focus-zoom (D7-007) and its handling of maximum-scale (D7-006) are stated from the documented behaviour, not measured.
8. The dvh/svh question is unresolved. Every episode slide and the feed scroller are `height: var(--feed-h, 100dvh)` (components/EpisodeFeed.tsx:1048, 2073, 2082, 2099, 2116, 2122, 2164) inside a `position:fixed; inset:0` container, and --feed-h is only ever set inside the desktop-frame media query (app/globals.css:729). Whether the fixed container and 100dvh agree while iOS Safari's toolbars animate — and therefore whether scroll-snap positions drift mid-binge — cannot be determined in Chrome. This is the one place where a real-device pass would most change the picture, and it touches the "swipe feel" asset.
9. Client-only surfaces were audited from source plus injected markup rather than live interaction at phone widths, because Chrome will not size a window below ~606px: the cart drawer, series info drawer, sitemap sheet, search overlay, episode picker, language dropdown and the Amazon bag drawer. The one exception is the Amazon-pill-vs-paywall collision (D7-004), which was reproduced end-to-end on the live production page with no injection.
10. Tap-target findings are geometric, from getBoundingClientRect. No physical-device touch-accuracy testing was done, and my inline-link exemption (an <a> with display:inline inside a longer text block) is a heuristic — a handful of the 921 sub-24px instances at 390px are breadcrumb-style links that a stricter reading would exempt.
11. Only the 20-locale default (en) was rendered. Longer German and Russian nav labels and the single RTL locale (ar) were not laid out; note that app/layout.tsx:100 hard-codes `<html lang="en">` with no dir attribute, so an RTL layout pass has nothing to act on outside the paywall overlay (components/EpisodeFeed.tsx:2513).

---

# D7 — Viewport and Device

**Commit under audit:** live production, https://www.verzatv.com (deployed stylesheet `1y2muhl66_cr7.css`)
**Date:** 2026-08-29
**Coverage:** 300 of 325 scoped items (65 page-route classes x 5 viewport widths). 25 items are gaps; a further 10 of the 300 were examined only in a redirected state.

---

## Method, and why it is trustworthy

Chrome on macOS refuses to size a window below roughly 606 x 683 CSS px, so a resized real window cannot answer a question about 320px phone geometry. Instead:

1. Every route's live server HTML was mirrored from www.verzatv.com with an iPhone user agent, scripts stripped, and `<base href="https://www.verzatv.com/">` injected so the **deployed** stylesheet, fonts and images still resolve (the site sends `access-control-allow-origin: *`, so the self-hosted woff2 files load cross-origin).
2. Each mirror was rendered inside a fixed-size same-origin iframe served from a local harness. Media queries inside an iframe evaluate against the **iframe's** viewport, so `(min-width: 520px)`, `(orientation: landscape)` and `(max-height: 500px)` all resolve to real device values.
3. Every number below is a `getBoundingClientRect` or `getComputedStyle` reading against that deployed CSS, not a reading of the source.
4. The headline question — the Amazon pill over Go Back — was additionally reproduced **end to end on the live production page with no injection at all**, so it does not depend on the harness being faithful.

Standing rule 1 ("verify the effect, never the assignment") is the reason D7-001 was found: the CSS comment says *"Hide labels, show icons only"*, and reading the rule you would believe it. Reading the rendered link's height you find `0`.

---

## What is clean

This is worth stating plainly, because it is the largest single result of the pass.

**Zero horizontal overflow, on 60 of 60 reachable route classes, at every width tested: 320, 375, 390, 430, 768 — and at 852x393, 932x430 and 667x375 landscape.** `document.documentElement.scrollWidth` equalled the viewport width in all 480 measurements. Nothing pushes the page sideways at 320px. Every `w-[420px]`, `w-[380px]`, `w-[440px]` in the codebase turned out to be `max-w-` or `md:`-gated. The 440px app shell, the 3-up poster grid, the sticky header, the horizontally-scrolling category rail and the desktop iPhone frame all behave.

The 404 page's `Back to Discover` measures 162 x 44 and is content-sized, so it passes the thumb minimum at 320px too.

| Width | Routes | Overflowing | Interactive instances | <24px | 24-44px | Pass 44px |
|---|---|---|---|---|---|---|
| 320 | 60 | **0** | 2668 | 917 | 899 | 852 (31.9%) |
| 375 | 60 | **0** | 2668 | 921 | 917 | 830 (31.1%) |
| 390 | 60 | **0** | 2668 | 921 | 923 | 824 (30.9%) |
| 430 | 60 | **0** | 2668 | 922 | 928 | 818 (30.7%) |
| 768 | 60 | **0** | 2668 | 908 | 936 | 824 (30.9%) |

---

## The named question: does the Amazon pill still overlap Go Back?

**Yes. Confirmed on the live site, and confirmed worse on 320px phone geometry.**

Live, no injection, https://www.verzatv.com/series/the-mistress-trap/6 with two items seeded into the Amazon bag exactly the way the product writes it (`localStorage['verza-amazon-bag']`, lib/amazon-bag.tsx:27):

```
paywall Go Back   y 535-585   x 183-423
Amazon pill       y 532-572   x 379-484
overlap           44 x 36  =  1,612 px²
elementFromPoint(pill centre) -> the pill
```

The header and bottom nav *are* correctly hidden inside the player (`display: none` on both, via `:has(.episode-immersive)` at app/globals.css:715-720). The Amazon pill is not in that hide list, and its layer is `z-index: 60` in the **root** stacking context while `.episode-immersive` is `z-index: 50` — so it paints above the entire paywall, including a `z-[60]` overlay nested inside the 50.

Phone geometry, deployed CSS, paywall and pill markup transcribed verbatim from components/EpisodeFeed.tsx:2501-2679 and components/AmazonBag.tsx:36-55 with the bag placed as a child of `.device-frame` exactly as app/layout.tsx:159 does:

| Viewport | safe-area-inset-bottom | Go Back covered | $1.99 CTA covered |
|---|---|---|---|
| 320 x 568 | 0 | 1,335 px² (**9.7%**) | — |
| 320 x 568 | 34 | — | **1,513 px²** |
| 320 x 693 | 0 | 1,335 px² (9.7%) | — |
| 320 x 693 | 34 | 3,471 px² (**25.1%**) | — |
| 375 / 390 / 430 / 768 portrait | 0 and 34 | clear | clear |
| 852 x 393 landscape | 0 | — | 696 px² |
| 932 x 430 landscape | 0 / 34 | — | 1,131 / 261 px² |
| 667 x 375 landscape | 0 | — | 450 px² |

Two things follow. On a 320px phone with a home indicator, a quarter of the paywall's only exit is under an affiliate ad that wins the hit test. On several other geometries the ad sits over the **purchase** button instead. The fix is one line: add `.amazon-bag-layer` to the existing hide list at app/globals.css:715-720.

The paywall's honesty is a named do-not-regress asset. This finding is about something painting *over* it, not about the paywall itself.

---

## S1

### D7-001 — The bottom navigation is completely empty on every phone in landscape

`app/globals.css:624` opens `@media (orientation: landscape) and (max-height: 500px)`. Inside it:

```css
.bottom-nav span {
  display: none; /* Hide labels, show icons only */
}
```
— app/globals.css:653-655

But `components/BottomNav.tsx:119-123` wraps the icon in a bare span:

```jsx
<span style={active ? { filter: "drop-shadow(...)" } : undefined}>
  {tab.icon(color)}
</span>
<span className="text-[11px] font-medium leading-none" style={{ color }}>
  {labelMap[tab.label] ?? tab.label}
</span>
```

So the selector hits both. Measured at 852 x 393 against the deployed stylesheet:

```json
{"mq_short": true, "navComputedHeight": "40px", "innerInlineHeight": "72px",
 "linkRect": {"width": 83.2, "height": 0},
 "spanDisplays": ["none","none"], "svgRect": {"width":0,"height":0}}
```

The nav link is **zero pixels tall**. The SVG is 0 x 0. Identical at 932 x 430 and 667 x 375. Every iPhone in landscape, and any browser window in landscape 500px or shorter, gets a 40px empty dark bar where Discover, Shorts, **Shop**, **Library** and Profile should be. They are invisible and cannot be tapped.

Compounding it, `.bottom-nav { height: 2.5rem }` fights the inline `height: 72` on the row (BottomNav.tsx:91), so the row also spills 35px below the viewport.

Graded S1 rather than S2 because two of the five destinations it deletes are the commerce surfaces, and because there is no fallback affordance anywhere on the page.

---

## S2

### D7-002 — The paywall's Go Back is off-screen in landscape, with no scroll

Measured **live** on the paywall at https://www.verzatv.com/series/the-mistress-trap/6:

```
paywall column height            448 px
.episode-immersive overflow      hidden
paywall column overflow-y        visible
```

The overlay is `absolute inset-0 flex items-center justify-center` (EpisodeFeed.tsx:2502) inside a `position:fixed; inset:0; overflow:hidden` container (globals.css:706-712). Content taller than the viewport is therefore clipped symmetrically top and bottom, and there is no scroll region to recover it.

Every iPhone landscape height is below 448: 375, 393, 414, 430. Harness run (477px column):

| Viewport | column taller than viewport by | Go Back below the fold by | elementFromPoint at Go Back's centre |
|---|---|---|---|
| 852 x 393 | 84 px | 42 px | **null** |
| 932 x 430 | 47 px | 23 px | the button (41 of 50px visible) |
| 667 x 375 | 102 px | 51 px | **null** |

A viewer who rotates at the paywall loses the top of the message and most or all of the way out.

### D7-003 — Every footer legal link is behind the bottom nav on home-indicator iPhones

```css
/* app/globals.css:333-335 */
.app-shell > main {
  padding-bottom: calc(76px + env(safe-area-inset-bottom, 0px)) !important;
}
```

The comment above it says *"the last poster row / footer never hides behind the nav"*. But `app/layout.tsx:145-148`:

```jsx
<div className="app-shell">
  <Header />
  <main className="flex-1 pb-16">{children}</main>
  <Footer />          {/* sibling of main — the reserve never reaches it */}
</div>
```

The footer's own bottom padding is `py-8` = 32px (Footer.tsx:78), against a nav that is 72px + inset.

Simulated inset 34 at **430 x 932** — nav height 107px, nav top y825 — covered on **59 of 60 routes**, with interactive content covered on **59 of 60**:

```
[INTERACTIVE] Become a Creator    y821-839
[INTERACTIVE] Support             y821-839
[INTERACTIVE] Terms of Service    y821-839
[INTERACTIVE] Privacy Policy      y821-839
[INTERACTIVE] Refund Policy       y845-863
[INTERACTIVE] Help & Support      y845-863
[INTERACTIVE] Press               y845-863
[INTERACTIVE] About               y845-863
```

At 390 x 844 with the same inset, one link plus the copyright. With no inset, the copyright only (see D7-012). Terms, Privacy and Refund Policy are exactly what a paying customer goes looking for. They remain reachable from the footer's Sitemap sheet (lib/data/sitemap.ts:238-242), which is why this is S2 and not higher — but the sheet itself is `bottom: 72` with no inset (D7-011), so it loses its own last 34px on the same devices.

---

## S3

### D7-004 — Amazon pill over Go Back / the $1.99 CTA
Full evidence in "the named question" above. Money-adjacent: it obstructs both the exit from and the purchase button on the payment screen, and wins the hit test in the overlap.

### D7-005 — Player top controls ignore `safe-area-inset-top`

Measured with the inset re-declared at 0, 47 and 59:

| Control | Source | Rect at inset 0 | at 47 | at 59 |
|---|---|---|---|---|
| Back | EpisodeFeed.tsx:2181 `absolute top-4 left-4 w-10 h-10` | y16-56 | y16-56 | y16-56 |
| Mute | EpisodeFeed.tsx:2202 `absolute top-4 right-4 w-10 h-10` | y16-56 | y16-56 | y16-56 |
| Fullscreen | EpisodeFeed.tsx:2229 `absolute top-16 right-4` | y64-104 | y64-104 | y64-104 |

They do not move. On a 14 Pro the status-bar/Dynamic-Island zone is 0-47; on a 15 Pro Max it is 0-59. In the installed PWA and the iOS WebView (`appleWebApp.capable: true`, `statusBarStyle: "black-translucent"`, `viewportFit: "cover"` — layout.tsx:79-96) the exit control and the mute control sit inside it.

The same component gets it right 260 lines later:

```jsx
/* EpisodeFeed.tsx:2444-2447 — the free-run chip */
top: "calc(env(safe-area-inset-top, 0px) + 60px)",
```

So the decorative chip is inset and the exit button is not. All three controls are also 40 x 40, four points short.

### D7-006 — Pinch-zoom disabled while 1,524 text nodes render under 12px

Deployed HTML, fetched from www.verzatv.com (not the build):

```html
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover"/>
```
— from `export const viewport` at app/layout.tsx:90-96.

Measured at 390px across all 60 reachable routes: **1,524 elements own text rendered below 12px, on 60 of 60 routes.** Worst: /discover 191, /discover/romance 105, /genre/romance 103, /genres/romance 87, /amazon and /shop 73 each. The smallest are **9px**, and they carry the free/paid claim:

```
div.absolute.bottom-1.5.left-1.5   9px  "All Free"
div.absolute.bottom-1.5.left-1.5   9px  "5 Free"
```

Nine-pixel type stating how much of a title is free, on a page where the viewer is not permitted to zoom.

### D7-007 — 14px inputs, masked only by the thing D7-006 says to remove

8 of the 9 visible form controls render at **14px**, under iOS Safari's 16px focus-zoom threshold: email x3, password x2, search x2, text x1, on /sign-in, /sign-up, /forgot-password, /search and /discover. (The ninth, the sign-up terms checkbox, is 16px — and 16 x 16, which is its own problem.) 43 further `text-sm` inputs sit behind the creator and admin gates.

Today `maximum-scale=1` suppresses the focus zoom. Fix D7-006 in isolation and every auth form starts jumping under the thumb. **These two must move together.**

### D7-008 — 31% of interactive elements meet 44 x 44; 34% are under 24 x 24

Counts are net of inline links inside flowing prose. Offenders are shared components, so the fix is concentrated:

| Instances @430 | Size | Component |
|---|---|---|
| 489 | 102 x 18 | footer legal links — Footer.tsx:120-129, `fontSize: 12`, `gap-y-1.5` (6px between rows) |
| 285 | 18 x 18 | footer social icons — Footer.tsx:85-97 |
| 285 | 81 x 41 | bottom-nav tabs — BottomNav.tsx:91,105. The row is `items-center`, not `items-stretch`, so each link is content-height and **13 of the nav's 54px content box is dead space** |
| 118 | 36 x 36 | header language + search — LangDropdown.tsx:26, SearchButton.tsx:53 |
| 57 | 115 x 36 | footer Sitemap toggle — FooterSitemap.tsx:18-31 |
| 30 | 69 x 32 | browse category tabs — CategoryTabs.tsx:201-203 (`p-0 pb-1.5`) |
| 18 | 20 x 6 / **6 x 6** | hero carousel dots — BrowsePage.tsx:856-863, :1060-1078, `gap-1.5` |
| 1 | 16 x 16 | sign-up terms checkbox — app/sign-up/page.tsx:136 |
| 1 | 131 x 20 | `/horizontal` back control — HorizontalBackButton.tsx:5-13, the **only** in-app exit from that route |
| — | 128 x 36 | EmptyState CTA — EmptyState.tsx:92-95 |
| — | 24 x 24 / 28 x 28 | drawer quantity steppers — AmazonBag.tsx:161,172; CartDrawer.tsx:106,120 |
| — | 32 x 32 | drawer close buttons — CartDrawer.tsx:95, SeriesInfoDrawer.tsx:171, AmazonBag.tsx:95 |

A 6 x 6 px carousel dot with 6px neighbours is not a thumb target.

**Flagged against the do-not-regress list:** the Anime empty state is named as an asset and it is one — the clock, the honest sentence, the button that goes somewhere. The only defect is that its button is 36px tall, 8px short of the minimum. The pattern stays; the padding changes.

### D7-009 — The only unmute is in the far top-right corner

`components/EpisodeFeed.tsx:2202` puts Mute at `absolute top-4 right-4 w-10 h-10`. The slide's tap handler (`EpisodeFeed.tsx:1006-1042`) maps single tap to pause/play and double tap to like; there is **no tap-to-unmute path**. The project's own standing rule is that iOS playback always starts muted, so a muted start is the normal case, not the edge case. On a 430 x 932 phone that button's centre is at roughly (394, 36) — the diagonal opposite of a right thumb — and it collides with the Dynamic Island per D7-005. The right-hand action rail immediately below already uses correct 44px targets (EpisodeFeed.tsx:2271-2277); mute belongs there.

### D7-010 — Landscape 501-599px tall clips the nav labels

At 653 x 512 (foldable, or a short desktop window): `mqFrame` false, `mqShort` false, so icons survive — but `.bottom-nav { height: 3rem }` (globals.css:549-554) against the inline 72px row gives an inner bottom edge at y541 in a 512px viewport, putting the label row roughly y509-521 across the fold. Meanwhile `.app-shell` goes full-bleed to 653px (globals.css:544-547) while `.bottom-nav { max-width: 440px }` (globals.css:269-273) is never overridden, so the nav is a 440px island under 653px of content.

### D7-011 — Three of four bottom sheets ignore the home indicator

| Sheet | Source | Bottom treatment |
|---|---|---|
| Footer sitemap | FooterSitemap.tsx:65 | `bottom: 72` — the nav's height **without** the inset, while BottomNav.tsx:86 grows the nav by it. Loses its bottom 34px. |
| Cart drawer | CartDrawer.tsx:27, :144 | `fixed bottom-0`, checkout footer `px-4 py-4`. The Checkout button ends 16px from the screen edge, inside the 34px strip. |
| Series info drawer | SeriesInfoDrawer.tsx:154, :181 | `fixed bottom-0`, body `pb-6` (24px). Same. |
| **Amazon bag drawer** | AmazonBag.tsx:190 | `paddingBottom: "calc(16px + env(safe-area-inset-bottom, 0px))"` — **correct** |

The pattern is known. It is applied once out of four. Also non-interactive but inside the strip: ShortsFeed.tsx:507 dot indicators at `bottom: 16`, EpisodeFeed.tsx:2469 episode badge at `bottom-6`.

---

## S4

### D7-012 — The copyright line is permanently unreadable on 59 of 60 routes

Even at zero inset. At 390 x 844, at genuine maximum scroll (the harness had to inject `*{scroll-behavior:auto !important}` before `scrollTo` would actually arrive — see D7-016):

```
© 2026 VERZA TV. All rights reserved…   y779-812
.bottom-nav                              y771-844
footerBottom 844 = viewport bottom = max scroll
```

59/60 at 390 x 844, 59/60 at 852 x 393, 0/60 at 768 (where the nav is docked, not fixed). The one exception is the immersive episode route, where the nav is hidden. Same root cause as D7-003, same one-line fix.

### D7-013 — A landscape rule that has never once applied

```css
/* app/globals.css:618-620 */
@media (orientation: landscape) {
  main { padding-bottom: 3.5rem !important; }
}
```

Specificity (0,0,1). It is outranked by `.app-shell > main` at (0,1,1), globals.css:333-335, also `!important`. Measured `padding-bottom: 76px` at both 653 x 512 and 852 x 393. The landscape nav is 40-48px, so 28-36px of reserve is wasted and the rule is dead.

### D7-014 — The 404 page ships an empty `<body>`

`curl -s https://www.verzatv.com/@verza` returns 2,767 bytes whose entire body is `<div hidden><!--$--><!--/$--></div>`, with `id="__next_error__"` on the html element. Byte-identical for /c/test-clip, /dev/perf, /shop/champion-tie-dye-hoodie and /watch/the-mistress-trap/1. With JS off or slow that is a blank page at every width.

Once hydrated it is good: *"404 / Page not found / The page you're looking for doesn't exist or has been moved."* with full chrome and a `Back to Discover` link measuring 162 x 44. Reported here because it is the production outcome for five of the 65 route classes and because it means those five have no server-rendered layout to audit.

### D7-015 — `.hero-poster` is dead CSS with a stale comment

`grep -rn 'hero-poster' --include='*.tsx' components app` returns nothing. The class is defined twice — globals.css:364-370 and :501-503 — with an eleven-line comment explaining how it keeps "the WHOLE 9:16 flyer — including the bottom VERZA TV logo — visible on load without scrolling". Nothing carries the class. The arithmetic is also stale: the comment assumes a ~62px header and ~44px tabs (106px) and the rule subtracts 112px, while measured on the live homepage at all five widths the header is **70px** and the sticky tab bar **52px** — 122px.

### D7-016 — `* { scroll-behavior: smooth }` on every element, ungated

globals.css:698-701. The two `prefers-reduced-motion` blocks (:232-241, :244-265) cover animations and transitions but not scroll-behavior. It also silently animates every programmatic scroll; the first pass of the max-scroll occlusion measurement produced wrong data until the harness forced it off.

### D7-017 — Tablet = a 400px phone mock (observation, not a defect)

At 768 x 1024, on all 60 reachable routes: frame 400 x 868, shell 394px, `body { overflow: hidden }`, nav docked at y854-927 inside a frame ending at y946, zero horizontal overflow. This is deliberate (globals.css:412-539) and it works. Two sub-notes: at 1024 x 768 the landscape rule shrinks the nav box to 48px while its row stays 72px, overflowing by 29px (cosmetically hidden by a matching dock background — the same box-model bug as D7-010); and `height: min(94vh, 868px)` at globals.css:438 uses `vh`, not `dvh`, in a page whose body cannot scroll, so on a tablet browser with dynamic chrome the docked nav could fall below the fold with no way to reach it. **Unverified** — not reproducible in desktop Chrome.

---

## Coverage

**325 items in scope** = 65 page-route classes x {320, 375, 390, 430, 768}.
**300 examined.** **25 gaps.**

Beyond the 325, this pass also ran: 60 routes x 852 x 393 landscape for footer occlusion; nav and header geometry on `/` at nine viewports including three landscape and two tablet; 18 paywall-and-pill cases across nine viewports x two safe-area insets; three simulated safe-area device profiles x 60 routes; a computed-font-size sweep over 60 routes; and one live, uninjected end-to-end reproduction of the pill/paywall collision.

### Gaps

| # | Item | Missing | Needs |
|---|---|---|---|
| 1 | `/[handle]` (5) | 404 in production | a published, approved creator channel row |
| 2 | `/c/[slug]` (5) | `lib/clips.ts:41` is `const CLIPS: Clip[] = []` — every clip URL 404s | one real clip row |
| 3 | `/watch/[...slug]` (5) | needs a published free creator title with a Mux id (page.tsx:44-54) | one published free creator title |
| 4 | `/shop/[slug]` (5) | `generateStaticParams` returns `[]` unless `MERCH_CHECKOUT_ENABLED === "true"` (page.tsx:8-12) | preview deploy with the flag on — the carousel and quantity steppers have never been measured at 320px |
| 5 | `/dev/perf` (5) | gated by `PERF_TEST_MODE` (page.tsx:12) | preview deploy — `PerfHarness.tsx:107` has a `minWidth: 280` never rendered at 320px |
| 6 | `/admin/dashboard`, `/admin/review` (10 of the 300) | both 307 to `/` without an admin session; the followed response is byte-identical to `/` at 113,899 bytes | an admin session cookie — `AdminDashboard.tsx` has a `w-[160px]` and 24 x 24 controls D7 has not seen |

### Qualifications on the 300 examined

7. **No real iOS device or simulator.** Every safe-area finding (D7-003, D7-005, D7-011) was reproduced by re-declaring the env()-reading rules with literal 34 / 47 / 59px insets against the deployed stylesheet. The arithmetic is right; it is not an on-device observation. iOS focus-zoom (D7-007) and iOS's handling of `maximum-scale` (D7-006) are stated from documented behaviour.
8. **The dvh/svh question is unresolved, and it is the one most worth chasing.** Every episode slide and the feed scroller are `height: var(--feed-h, 100dvh)` (EpisodeFeed.tsx:1048, 2073, 2082, 2099, 2116, 2122, 2164) inside a `position:fixed; inset:0` container, and `--feed-h` is set only inside the desktop-frame media query (globals.css:729). Whether the fixed container and `100dvh` stay in agreement while iOS Safari's toolbars animate — and therefore whether scroll-snap positions drift mid-binge — cannot be settled in Chrome. It touches "swipe feel", a named asset.
9. **Client-only surfaces were audited from source plus transcribed markup, not live interaction at phone widths**, because Chrome will not go below ~606px: cart drawer, series info drawer, sitemap sheet, search overlay, episode picker, language dropdown, Amazon bag drawer. The exception is D7-004, reproduced live.
10. **Tap-target findings are geometric**, from `getBoundingClientRect`; no physical touch-accuracy testing. The inline-link exemption (`display:inline` anchor inside a longer text block) is a heuristic, so a handful of the 921 sub-24px instances at 390px are breadcrumb-style links a stricter reading would exempt.
11. **Only `en` was rendered.** Longer de/ru nav labels and the single RTL locale were not laid out. Note `app/layout.tsx:100` hard-codes `<html lang="en">` with no `dir`, so outside the paywall overlay (EpisodeFeed.tsx:2513) there is no RTL layout to test.

---

## Assets confirmed intact

Checked explicitly against the do-not-regress list, and found undamaged by anything in this dimension: instant play from a poster tap; the paywall's honest layout (big price, "one-time" repeated, Stripe named, Go Back at equal weight, nothing pre-ticked) — the defects here are things painting *over* it and it being *clipped*, never its own composition; the episode picker; the poster art; the legal and trust pages; the Anime empty state pattern (only its button's height is flagged, and flagged as such); "THE MICRODRAMA APP" under the logo. Header + logo fit at 320px with 24px to spare.