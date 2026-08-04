# Verza TV — Dev Report (2026-07-03)

> **ARCHIVE — 2026-07-03 snapshot.** Counts, feature state, pricing, and
> verification below are historical. Current release truth:
> [`../LAUNCH-TRUTH.md`](../LAUNCH-TRUTH.md).

_Session report covering the resume/re-engagement feature, the install prompt,
brand-icon refresh, tab-navigation change, section polish, and docs
reorganization. All figures pulled from real `git` / build output._

---

## 1. Snapshot

| Metric | Value | Source |
| --- | --- | --- |
| Framework | Next.js 16.2.9 (App Router) + React 19 + TS 5 + Tailwind v4 | `package.json` |
| Commits | 341 | `git rev-list --count HEAD` |
| App/lib/components code | 39,871 lines TS/TSX | `wc -l` over `app`,`components`,`lib` |
| Components | 52 | `ls components/*.tsx` |
| API routes | 32 | `find app/api -name route.ts` |
| Live series | 76 | `lib/catalog.ts` |
| Build | ✅ green — compiles, 1086 pages prerendered | `npx next build` |
| Type-check | ✅ clean — `tsc --noEmit` exit 0 | — |
| Production | LIVE at https://www.verzatv.com | Vercel (codevibes/verza-tv) |

Build emits **1 benign warning**: a `@ts-expect-error` on the optional
`@anthropic-ai/sdk` import (only installed when `ANTHROPIC_API_KEY` is set).
Does not affect build or runtime.

---

## 2. What shipped this session

### 2.1 Brand icons — white-inside logo
- Regenerated `apple-touch-icon.png` (512×512), `apple-touch-icon-180.png`
  (180×180), and a **new** `favicon.ico` (was previously a 404) from the
  official white-inside play-triangle emblem on brand-dark `#07070E`.
- Commit `9290610`.

### 2.2 Resume playback + Continue Watching re-engagement reminder
The core: an interrupted viewer can jump straight back to the exact second.
- **`lib/resume.ts`** (new) — shared resume-URL builder, last-watching
  persistence, and a service-worker "Continue watching" notification.
- Episode route accepts `?t=<seconds>` to deep-link into a saved position.
- **`EpisodeFeed.tsx`** (the immersive vertical player) now persists position
  as you watch, restores it on load, and — when the app is backgrounded
  mid-episode — fires the reminder and flushes a final save.
- **`Player.tsx`** restores the saved position on load and mirrors the
  background reminder/flush.
- Home **"Continue Watching"** tiles resume at the saved second and show a
  **real** progress bar (previously hardcoded at 50%).
- Commit `f3aceee`.

> Platform note: the reference screenshot was a native iOS **Live Activity**
> (ActivityKit) — an App-Store-native feature a PWA cannot create. This is the
> web-native equivalent using Verza's existing service-worker + web-push stack.
> It surfaces on the lock/home screen for **installed PWAs** (iOS 16.4+,
> Android, desktop) with notifications granted.

### 2.3 Install / "turn on reminders" prompt
- **`components/InstallPrompt.tsx`** (new) — a gentle, dismissible banner that
  guides viewers to the state where reminders light up:
  - iOS Safari → Share ▸ Add to Home Screen instructions.
  - Android/desktop → native install prompt.
  - Installed → one-tap "Turn on reminders" (permission + push subscribe).
- Appears 6s after load, remembers dismissal for 7 days, and **never covers
  the immersive players** (route-guarded).
- Commit `af9f1c3`.

### 2.4 Tab navigation — swipe removed (per Alan)
- Removed the swipe / click-drag / trackpad-wheel gesture that changed the
  category tab (Drama · New · Hot · Music · Reality · Red Carpet).
- Tabs now change **only** by tapping the header tab bar. The tap still plays
  the slide-in transition. All gesture code and the now-unused
  `startsInHorizontalScroller` helper were removed cleanly (no orphans).

### 2.5 Section polish
- **Scroll reset:** switching to a section (or returning to one) now always
  opens at the **top** — added a scroll-to-top on tab change covering window,
  document, and the `.device-screen` scroll container.
- **Poster consistency:** red-carpet tile captions were 28px tall vs the
  standard 36px — aligned to 36px so every tile across every section matches.
- Verified via a full-page audit: all 6 tabs render correctly, posters are a
  uniform 2:3 `object-cover rounded-lg` with 36px captions and 1.5 gap,
  sponsored ad rows stay aligned to full rows of 3, and section spacing is
  consistent.

### 2.6 Documentation reorganized
- All hand-authored docs sorted under `docs/` into `reference/`, `guides/`,
  `reports/`, `strategy/` with a refreshed `docs/README.md` index (every doc
  linked + described). Root `README.md`, `CLAUDE.md`, `AGENTS.md` left in
  place. Moves done with `git mv` (history preserved); broken links fixed.

---

## 3. Verification

| Check | Result |
| --- | --- |
| `tsc --noEmit` | ✅ exit 0 |
| `next build` | ✅ compiled, 1086 pages |
| Production endpoints (`/`, `/manifest.json`, `/sw.js`, icons) | ✅ 200 |
| Push keys (`VAPID_*`, `PUSH_API_KEY`) provisioned | ✅ set in Vercel Production |
| Swipe removal — no orphaned refs | ✅ confirmed |
| All 6 tabs render + uniform posters | ✅ confirmed |

---

## 4. Known items (carried over, not introduced this session)

- **P0:** `VipCard.tsx` "Manage subscription" points at a Stripe **TEST**
  portal URL — needs the real production Customer Portal link.
- Mux upload token + webhook still to be provisioned for the creator upload
  flow (returns 503 until set).
- `HorizontalFeed.tsx` reads muted state inside a `setTimeout` (possible
  stale-closure unmute) — flagged, not touched (live player).

---

_Generated after the 2026-07-03 session. See `docs/reports/DEV-REPORT-CURRENT.md`
for the prior master pre-share audit._
