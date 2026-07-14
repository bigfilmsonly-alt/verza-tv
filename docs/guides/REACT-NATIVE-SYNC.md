# Web → React Native Sync Guide

> **If you are an AI agent working in the Verza TV React Native repo: this file is
> your brief. Read it end to end before you change anything.**

The **web app** (this repo, `Splash-Studio/verza-tv`, live at
[verzatv.com](https://www.verzatv.com)) is the source of truth for product
behaviour, content, pricing and App Store compliance. The native app was built
from a snapshot of it and has since fallen behind.

This document tells you **what changed, why, and exactly what to do about each
thing** — including the parts you must deliberately *not* port.

- **Web repo:** `github.com/Splash-Studio/verza-tv` (also mirrored to `bigfilmsonly-alt/verza-tv`)
- **Current web `main`:** `2895946` (2026-07-13)
- **Web history spans:** 2026-06-14 → 2026-07-13 (~396 commits). Everything is in range.

---

# PART 0 — Three rules that outrank everything else

Get these wrong and you either get **rejected from the App Store** or **lose
money**. They are not style preferences.

## RULE 1 — Digital purchases must NOT appear inside the iOS app

**Apple Guideline 3.1.1.** You may not sell digital content (episode unlocks,
VIP subscriptions, coins) through an external checkout inside an iOS app.

**The web app already solves this and you should copy the strategy.** It runs a
"reader mode": `lib/platform.ts` exposes `isIOSApp()`, and
`components/HideInIOSApp.tsx` renders nothing when true. Inside the iOS app it
hides:

| Hidden in the iOS app | Where |
| --- | --- |
| Summer Sale `$1.99` badge | `components/BrowsePage.tsx` |
| Episode unlock CTA / paywall | `components/EpisodeFeed.tsx` |
| VIP subscription card | `components/VipCard.tsx` (existing VIPs still see *status*, just no billing links) |
| "Unlock Full Series" card | `app/series/[slug]/page.tsx` |

**Your two compliant options in RN:**

- **(a) Reader model — recommended, and what already ships.** No purchase UI in
  the app at all. Users buy on the web; entitlements sync down via
  `/api/entitlements`. Zero StoreKit work, zero Apple commission. This is the
  Netflix pattern.
- **(b) Apple IAP.** Implement StoreKit for unlocks and VIP. Apple takes 30%.
  Far more work, and you must *still* not show Stripe.

**Do not ship Stripe checkout for digital content in the iOS app.** It will be
rejected.

## RULE 2 — Physical goods must NOT use IAP

**Apple Guideline 3.1.5(a).** Merch and Amazon products are physical goods.
Apple *requires* these to use external payment and *forbids* IAP for them.

This is why `/shop` and `/amazon` are **not** wrapped in `HideInIOSApp`. That is
deliberate, not an oversight. **The shop can and should ship in the native app.**

## RULE 3 — Ad and analytics SDKs are off inside the iOS app

`components/ThirdPartyScripts.tsx` skips GTM, GA4 and AdSense entirely when
`isIOSApp()` is true, because Google's ad stack constitutes cross-context
tracking and would require an App Tracking Transparency prompt.

If you add any tracking SDK to RN, you must implement the ATT prompt. First-party
analytics (`/api/events`) is fine and does not need ATT.

> In RN you do not need `isIOSApp()` heuristics — you *are* the app. Replace it
> with `Platform.OS === "ios"`. Keep the same hide/show decisions.

---

# PART 1 — Work out what you already have

```bash
git -C <native-repo> log -1 --date=short --pretty='%ad %h %s'
```

Take that date and read every section below it. If you cannot tell, **read all of
Part 2** — the whole web history is only four weeks, so nothing is out of range.

To see the raw web-side history for a range:

```bash
git -C <web-repo> log --since=2026-06-22 --date=short --pretty='%ad %h %s'
```

---

# PART 2 — What changed, and what to do

Each block is tagged:

- 🔴 **PORT** — product behaviour or data. The native app must match.
- 🟡 **ADAPT** — port the behaviour, but the web implementation does not translate.
- ⚪ **SKIP** — web-only. Do not port.

---

## 2.1 🔴 App Store compliance (2026-07-10) — **do this first**

**What changed.** The web app became embeddable in an iOS wrapper without
breaching Apple's rules: reader-mode purchase hiding (Rule 1), no ad/tracking
stack in-app (Rule 3), a **support page**, an upgraded **privacy policy**, and
**in-app account deletion**.

**Why it matters to you.** Apple *requires* an in-app account-deletion path for
any app with account creation (Guideline 5.1.1(v)). Missing it is an automatic
rejection.

**Do in RN:**
- Implement account deletion. The backend already exists: **`POST /api/account/delete`**.
- Implement Rules 1–3 above.
- Ship a reachable Support and Privacy screen.

**Source:** `lib/platform.ts`, `components/HideInIOSApp.tsx`,
`components/ThirdPartyScripts.tsx`, `app/api/account/delete/route.ts`,
`app/support/page.tsx`, `app/privacy/page.tsx`

---

## 2.2 🔴 Content: +362 episodes, catalog and Mux remap (2026-07-08 → 07-11)

**What changed.**
- **362 episodes added**: 5 new series live, 3 series completed.
- Episode counts **reconciled against real Mux inventory** — the catalog used to
  claim episodes that did not exist.
- **6 trailer episodes removed** from series (trailers are for social promo only).
- Red Carpet events now actually play: **Exes Premiere (12 eps)**, **Love Awards (13 eps)**.

**Do in RN:** re-copy the data modules. They are pure TypeScript with no DOM
dependency and drop in almost verbatim:

| File | Lines | What it is |
| --- | --- | --- |
| `lib/catalog.ts` | ~1,118 | All ~80 series, categories, posters |
| `lib/mux-map.ts` | ~4,457 | Episode → Mux playback ID map (4,472 videos) |
| `lib/series-detail.ts` | ~477 | Rich per-series metadata |
| `lib/config.ts` | — | **Pricing and free-episode count. See 2.3.** |
| `lib/theme.ts` | 15 | Design tokens |
| `lib/i18n.ts` | ~647 | 20 languages |
| `lib/search-index.ts` | — | Genre/keyword search matching |

> Do **not** hand-edit these. Copy them wholesale, or you will drift from the
> Mux inventory and ship episodes that do not resolve.

---

## 2.3 🔴 Pricing and paywall (2026-06-30 → 07-11)

**What changed.** Pricing settled, and the paywall was redesigned for conversion
(2026-07-11: prominent "Go Back", gradient bullets, "No ads" copy).

**The numbers — `lib/config.ts` is the source of truth:**

| | |
| --- | --- |
| Free episodes per series | **`FREE_EPISODES = 5`** |
| Summer Sale per-movie unlock | **$1.99** (was $2 — changed 2026-06-30) |
| VIP monthly | **$9.99** (`VIP_MONTHLY_CENTS = 999`) |
| VIP yearly | **$79.99** (`VIP_YEARLY_CENTS = 7999`, "Save 33%") |
| Coin packs | `COIN_PACKS` — 100/300/700/1500/3500 with bonuses |
| Default coins per episode | `DEFAULT_COIN_PER_EPISODE = 49` |

**Do in RN:** import these constants; never retype the numbers. Then apply
**Rule 1** — on iOS, the paywall and every price is **hidden**, not shown.

---

## 2.4 🟡 Video playback overhaul (2026-07-08 → 07-10) — biggest UX change

**What changed.** A long fight to make playback instant and glitch-free. In order:

- Video now **starts at click time**, not after navigation. The poster is used as
  the loading state; the player is created immediately and "adopted" by the
  episode page (`lib/instant-player.ts`).
- Episode pages made **fully static (SSG)** for ReelShort-speed opens.
- Eliminated **black flashes** between poster and video (several passes).
- Fixed **videos pausing/failing from episode 4 onward** (a virtualization bug —
  too many `<video>` elements alive at once).
- **Paused frame stays visible** — no black screen on pause.
- Auto-hide all video chrome after 10s; watermark stays permanent.

**Do in RN:** the *symptoms* are web-specific (hls.js, `<video>` elements, DOM
adoption) but the **product rules are not**. Reproduce these:

1. Playback begins the moment the poster is tapped — never show a spinner.
2. Keep at most a small window of players alive; tear down the rest. **This is the
   actual cause of the "stops working after a few episodes" bug** — do not let
   every card hold a player.
3. Never show a black frame. Hold the poster until the first frame is decoded.
4. On pause, keep the frame.
5. Auto-hide chrome after 10s; keep the watermark.

`react-native-video` handles Mux HLS directly. Get signed playback URLs from
**`/api/playback/[episode]`** — do not embed Mux secrets in the app.

**Source:** `lib/instant-player.ts`, `components/EpisodeFeed.tsx`, `components/Player.tsx`

---

## 2.5 🔴 Amazon affiliate shop (2026-07-03, rebuilt 2026-07-13) — **new, ship it**

**What changed.** The TikTok Shop products (2026-07-01) were **deleted**. An
Amazon affiliate storefront replaced them (Associates tag **`verzatv-20`**).

> ⚠️ **If your snapshot is from 2026-07-01 → 07-13 you may have TikTok Shop
> products.** `lib/sponsors.ts` and `components/SponsoredProducts.tsx` were
> **deleted**. Delete their RN equivalents.

**Final state — this is what to build:**

- **12 Amazon products**, defined in `lib/amazon-sponsors.ts` (single source of truth).
- Products appear **only** on the Shop tab and the full store page. They are
  deliberately **NOT** in the poster grid, **NOT** in search, and **NOT** in the
  footer — putting them among the posters made the whole app read as an ad.
- **The Verza bag**: shoppers add products *without leaving the app*, then one
  handoff pushes the whole bag into their real Amazon cart.

**Four constraints you must not break** (they are Amazon terms, not taste):

1. **Checkout can never happen in-app.** Amazon gives affiliates no checkout API
   and forbids framing its pages. Payment always completes on Amazon.
2. **Never display a price.** Amazon only permits prices pulled live from PA-API
   and refreshed every 24h. The app shows none.
3. **Product images must come from `m.media-amazon.com`**, never the Associates
   widget on `ws-na.amazon-adsystem.com` — that is an ad-network domain and ad
   blockers drop it.
4. **Disclosure is mandatory**: "Sponsored · Amazon" on every tile plus the
   Associates disclosure. FTC and Amazon both require it.

**The cart handoff** — build this URL and open it in the system browser:

```
https://www.amazon.com/gp/aws/cart/add.html
  ?AssociateTag=verzatv-20
  &ASIN.1=B08KT2Z93D&Quantity.1=2
  &ASIN.2=B085P3TYPS&Quantity.2=1
```

In RN: `Linking.openURL(cartUrl)`. **Do not** open it in an in-app WebView —
Amazon's login and cart behave badly there, and it muddies attribution.

**Per Rule 2 this is allowed on iOS** — these are physical goods.

**Read before building:** [`AMAZON-SHOP.md`](AMAZON-SHOP.md) and
[`../reports/DEV-REPORT-2026-07-13-AMAZON-SHOP.md`](../reports/DEV-REPORT-2026-07-13-AMAZON-SHOP.md).

**Source:** `lib/amazon-sponsors.ts`, `lib/amazon-bag.tsx`,
`components/AmazonProducts.tsx`, `components/AmazonBag.tsx`, `app/shop/page.tsx`,
`app/amazon/page.tsx`

---

## 2.6 🔴 Auth, entitlements and Continue Watching (2026-06-20)

**What changed.** Supabase auth (email + Google/Apple OAuth), persistent
entitlements, sign-in required before purchase, purchases auto-saved to My List,
Continue Watching, saved list working for guests *and* signed-in users.

**Do in RN:** use `@supabase/supabase-js` with **AsyncStorage** as the session
store (not `localStorage`). Apple OAuth is effectively mandatory on iOS if you
offer any other social login (Guideline 4.8).

Entitlements are server-verified. Call **`/api/entitlements`** and
**`/api/entitlements/check`** — never trust a local flag.

---

## 2.7 🔴 Analytics event stream (2026-06-28 → 06-29)

**What changed.** `analytics_events` persistence in Supabase, a client sink at
**`/api/events`**, an anon-id beacon, and a closed purchase/revenue funnel with
server-verified revenue rows (ARPPU, paying users, free→paid rate).

**Do in RN:** emit the same events to `/api/events` so web and native revenue land
in one funnel. This is **first-party** — no ATT prompt needed (see Rule 3).

---

## 2.8 🟡 Creator / UGC pipeline (2026-06-30)

End-to-end: apply → upload → review → watch → payouts, plus an application
approval flow. Backend is live under **`/api/creator/*`** and `/api/admin/*`.

**Do in RN:** the apply/status screens are worth having. Uploads are heavy on
mobile — consider deep-linking to the web for the upload step.

---

## 2.9 🔴 Search (2026-07-01)

A genre/keyword search index (`lib/search-index.ts`) so searching a *category*
surfaces every show in it, not just title matches.

**Do in RN:** port `seriesMatchesQuery` verbatim — it is pure logic. Note that
Amazon products were **removed** from search on 2026-07-13; search returns shows
only.

---

## 2.10 🟡 Branding, gestures and polish (2026-06-23 → 07-04)

- New **white-inside VERZA logo** everywhere; brand capitalised **VERZA**.
- **Video watermark** (VERZA emblem, top-left, permanent while playing).
- **Swipe between category tabs** (right = next, left = previous).
- Back arrow **crossfades into the VERZA logo** after 10s idle on immersive players.
- Push notifications, install prompt, resume-playback reminder.

**Do in RN:** swipe tabs and the watermark are worth porting (`react-native-gesture-handler`).
Push → `expo-notifications` / APNs. The "install prompt" is meaningless in a
native app — **skip it**.

---

## 2.11 ⚪ SKIP — web-only, do not port

| | Why |
| --- | --- |
| pSEO pages (`/best`, `/compare`, `/guides`, `/watch-in`, `/collections`, `/genres`) | Search-engine surface. Meaningless in an app. |
| Sitemaps, JSON-LD, OG images, canonical URLs, `llms.txt` | Same. |
| CSP headers, `ads.txt`, AdSense | Web security/ads. Also see Rule 3. |
| Desktop iPhone frame (`.device-frame`) | Simulates a phone on desktop. You *are* a phone. |
| Container queries (`.headline-oneline`) | Use `useWindowDimensions()`. |
| Google Translate widget | Use `lib/i18n.ts` directly. |
| Service worker / PWA manifest | Native app. |
| `lib/platform.ts` `isIOSApp()` heuristics | Use `Platform.OS`. |

---

# PART 3 — Platform mapping

| Web | React Native |
| --- | --- |
| `localStorage` | `@react-native-async-storage/async-storage` |
| Next `<Link>` + App Router | React Navigation |
| Tailwind / CSS | `StyleSheet` or NativeWind |
| `<video>` + hls.js | `react-native-video` (Mux HLS) |
| `next/image`, `<img>` | `expo-image` / `<Image>` |
| `createPortal` modal | `<Modal>` |
| `window.open(url)` | `Linking.openURL(url)` |
| `container-type: inline-size` | `useWindowDimensions()` |
| Stripe Checkout redirect | **See Rules 1 & 2** |
| `document` / `window` | `Platform`, `Dimensions` |

**The backend is shared.** The RN app should call the same Next.js API routes
already deployed at `verzatv.com`:

```
/api/entitlements        /api/entitlements/check     /api/access
/api/playback/[episode]  /api/events                 /api/coins/balance
/api/account/delete      /api/auth/callback          /api/creator/*
```

Do not re-implement business logic client-side. **Never embed Mux, Stripe or
Supabase service-role secrets in the app bundle** — anyone can unzip an IPA.

---

# PART 4 — Suggested order of work

1. **Rules 1–3** (compliance). Everything else is worthless if the app is rejected.
2. **`/api/account/delete`** wiring (hard requirement).
3. **Re-copy the data modules** (2.2) — catalog, mux-map, config, theme, i18n.
4. **Playback rules** (2.4) — especially tearing down players; that is the
   "breaks after a few episodes" bug.
5. **Auth + entitlements** (2.6).
6. **Analytics** (2.7).
7. **Amazon shop** (2.5) — net-new revenue, allowed on iOS.
8. Polish (2.10).

---

# PART 5 — Verify before you call it done

- [ ] No price, paywall, unlock CTA, VIP card or Summer Sale badge is reachable on iOS.
- [ ] Merch and Amazon products **are** reachable, and use external checkout (not IAP).
- [ ] Account deletion works in-app.
- [ ] No GTM / GA4 / AdSense in the bundle (or ATT is implemented).
- [ ] Episode counts match `lib/mux-map.ts`; no episode resolves to a missing video.
- [ ] Open 10+ episodes back to back — playback still works (player teardown).
- [ ] No black frame on open or on pause.
- [ ] Amazon cart handoff opens in the **system browser** with `AssociateTag=verzatv-20`.
- [ ] No Mux / Stripe / Supabase service-role secret in the bundle.

---

# Reference

| Doc | What it covers |
| --- | --- |
| [`../CHANGELOG.md`](../CHANGELOG.md) | Every dated change on web |
| [`AMAZON-SHOP.md`](AMAZON-SHOP.md) | Amazon shop operations |
| [`../reports/DEV-REPORT-2026-07-13-AMAZON-SHOP.md`](../reports/DEV-REPORT-2026-07-13-AMAZON-SHOP.md) | Amazon build report |
| [`../reference/ARCHITECTURE.md`](../reference/ARCHITECTURE.md) | Web architecture |
| [`../reference/API-REFERENCE.md`](../reference/API-REFERENCE.md) | API routes |
| [`../reference/DATA-MODEL.md`](../reference/DATA-MODEL.md) | Supabase schema |
| [`PAYMENTS.md`](PAYMENTS.md) | Stripe, webhooks, revenue truth |
| [`MUX.md`](MUX.md) | Video pipeline |
