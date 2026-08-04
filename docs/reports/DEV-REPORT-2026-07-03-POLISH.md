# Verza TV — Dev Report: Cross-Device Polish Pass (2026-07-03)

> **ARCHIVE — 2026-07-03 snapshot.** “Shipped,” build, route, and open-item
> statements apply only to that dated pass. Current release truth:
> [`../LAUNCH-TRUTH.md`](../LAUNCH-TRUTH.md).

_Session report covering the responsive / multi-iPhone consistency fixes, the
header logo polish, the video back-arrow → logo crossfade, and a full broken-link
audit. All figures pulled from real `git` / build output._

---

## 1. Snapshot

| Metric | Value | Source |
| --- | --- | --- |
| Framework | Next.js 16.2.9 (App Router) + React 19 + TS 5 + Tailwind v4 | `package.json` |
| Commits | 343+ | `git rev-list --count HEAD` |
| App/lib/components code | 39,888 lines TS/TSX | `wc -l` over `app`,`components`,`lib` |
| Components | 52 | `ls components/*.tsx` |
| Pages | 58 | `find app -name page.tsx` |
| API routes | 32 | `find app/api -name route.ts` |
| DB migrations | 7 | `supabase/migrations` |
| Live series | 76 | `lib/catalog.ts` |
| Type-check | ✅ clean — `tsc --noEmit` exit 0 | — |
| Build | ✅ green — compiles, 1086 pages prerendered | `npx next build` |
| Broken internal links | ✅ 0 (56 routes / 100+ targets audited) | audit agent |
| Production | LIVE at https://www.verzatv.com | Vercel (codevibes/verza-tv) |

---

## 2. Root cause: "it looks different on different iPhones"

Two research agents audited the layout across every iPhone logical width
(SE 375 · 14/15/16 390–393 · Pro 393 · Plus/Pro Max 428–440 · iPhone 17 line)
plus tablet/laptop/desktop. The primary culprit was **asymmetric safe-area
handling**:

- The **bottom** nav already respected `env(safe-area-inset-bottom)`, but the
  **header had no `env(safe-area-inset-top)`**. Installed as a PWA (`viewportFit:
  cover` + black-translucent status bar), the header slid *under* the notch /
  Dynamic Island — and every iPhone has a different island/notch/status-bar
  height, so the same app looked different on each device (and different again
  between Safari and the installed home-screen app).
- Several sticky offsets (category tabs `top:62`, Summer Sale badge `top:108`)
  and the hero-poster height cap assumed a **fixed** header height, so they
  drifted once the notch inset was in play.

---

## 3. What shipped this session

### 3.1 Cross-device / multi-iPhone consistency
- **Header now respects the top safe area** — `paddingTop: env(safe-area-inset-top)`
  (`components/Header.tsx`). Resolves to `0` in a normal browser tab and to the
  real device inset when installed, so the header sits correctly on every iPhone
  (SE → 17 Pro Max) instead of under the island.
- **Sticky offsets made inset-aware** (`components/BrowsePage.tsx`) — the category
  tab bar (`calc(62px + env(safe-area-inset-top))`) and the Summer Sale ribbon
  (`calc(108px + …)`) stay glued to the header on notch devices.
- **Hero-poster cap made inset-aware** (`app/globals.css`) —
  `max-height: calc(100svh - 112px - env(safe-area-inset-top))` so the full 9:16
  flyer (incl. the bottom VERZA TV logo) still fits on notch devices without a
  forced scroll.
- **Bottom-nav clearance fixed** (`app/globals.css`) — the fixed 72px nav +
  home-indicator safe area exceeded `main`'s `pb-16` (64px), so the last poster
  row / footer could hide behind the nav. `main` now reserves
  `calc(76px + env(safe-area-inset-bottom))` on mobile, and it's zeroed inside the
  desktop iPhone frame (which docks the nav separately) so no desktop gap appears.

### 3.2 Header logo — the "Lionsgate coat of polish"
- **Brand halo** — a soft dual-tone drop-shadow glow (pink `#E0115F` + purple
  `#8B5CF6`) lifts the mark off the dark header. No `brightness()` filter, so the
  official white-inside emblem's colors stay true.
- **Cinematic sheen sweep** — a single highlight glides across **only the logo's
  pixels** (masked to the artwork via `mask-image: url(/logo.png)`) every ~6.5s.
  Reduced-motion users keep the halo but the sweep is disabled.
- Implemented as `.logo-shine` in `app/globals.css`; applied in `Header.tsx`.

### 3.3 Back arrow → VERZA logo crossfade (earlier this session, shipped)
- The permanent always-on watermark was removed. `VideoWatermark` gained a
  controlled `visible` prop; each immersive player (EpisodeFeed, Player,
  ShortsFeed, CreatorWatch) drives the logo as the **inverse of its chrome** — so
  the top-left VERZA logo fades in exactly as the back arrow / controls fade out
  after the 10s idle timer, in the same spot. HorizontalFeed (a card list, no back
  arrow / no 10s timer) left as-is.

### 3.4 Broken-link audit
- A dedicated agent enumerated all **56 `page.tsx` routes** and cross-checked
  **100+ internal link targets** (`<Link>`, `router.push`, `redirect`, template
  literals, `buildResumeUrl`, footer/header/nav). **Result: zero broken links.**

---

## 4. Verification

| Check | Result |
| --- | --- |
| `tsc --noEmit` | ✅ exit 0 |
| `next build` | ✅ compiled, 1086 pages |
| Broken internal links | ✅ 0 across 56 routes |
| Header inset (Safari vs installed PWA) | ✅ `env()` → 0 in tab, device inset when standalone |
| Sticky tabs/badge alignment on notch | ✅ offsets add `safe-area-inset-top` |
| Bottom-nav content clearance | ✅ mobile reserves nav + safe area; desktop unaffected |
| Reduced-motion | ✅ logo sheen disabled, halo kept |

---

## 5. Deliberately NOT changed (avoided regressions)

The audits suggested a few changes we **declined** because they'd trade one
problem for a worse one:

- **3-col → 2-col grid on <360px** — would break the sponsored-ad row insertion
  math (`(i+1)%12` assumes 3-wide rows), misaligning every ad row.
- **Hard-capping hero height on tall phones** — with the fixed 9:16 aspect this
  introduces pillarbox side bars; the current full-width behavior is preferred.
- **Global font-size overrides for SE** — `text-[11px]` captions are legible and
  re-scaling risks inconsistent 2-line wraps across devices.

---

## 6. Known items (carried over, not introduced this session)

- **P0:** `VipCard.tsx` "Manage subscription" points at a Stripe **TEST** portal
  URL — needs the real production Customer Portal link.
- Mux upload token + webhook still to be provisioned for the creator upload flow
  (returns 503 until set).
- `maximumScale: 1` in the viewport disables pinch-zoom (common for video apps,
  but a minor accessibility trade-off).

---

_Generated after the 2026-07-03 cross-device polish session. See
`docs/reports/DEV-REPORT-2026-07-03.md` for the prior session (resume feature,
install prompt, tap-only tabs) and `docs/reports/DEV-REPORT-CURRENT.md` for the
master pre-share audit._
