# S2 — PLAYER / SHORTS: the vertical rail and its entitlement bound, the paywall slide, the free-run chip, player controls, the episode picker, resume, autoplay, auto-advance, the prewarm/adoption path, and the Shorts + Horizontal player surfaces. Concretely: components/EpisodeFeed.tsx, Player.tsx, ShortsFeed.tsx, HorizontalFeed.tsx, EpisodeDropdown.tsx, CoinPaywall.tsx, HorizontalBackButton.tsx, PlayNowLink.tsx, VideoWatermark.tsx, app/series/[slug]/[episode]/{page,error}.tsx, app/shorts, app/horizontal, app/watch/[...slug], app/c/[slug]; lib/instant-player.ts, playback-client.ts, resume.ts, watch-progress-client.ts, mux-playback.ts, horizontal-map.ts; APIs /api/access, /api/playback/[episode], /api/watch-progress, /api/unlock/confirm, /api/events. Denominator: 74 interactive elements + 4,922 route instances + 880 i18n cells (44 player keys x 20 locales) + 96 catalog rows = 5,972 items.

**Coverage: 5972 of 5972 items examined.** 16 findings raised.

## Gaps — items in scope this agent could not examine

Eight items I could not examine to the standard the brief sets, and what each needs.

1. FIRST-FRAME TIMING AND INSTANT PLAY — unmeasured. The only browser available is shared with other agents driving it concurrently; my tab reported document.hidden === true for the whole session, so Chrome suspended media decode. Symptom: /series/the-mistress-trap/1 sat at readyState 0 with buffered.length 0 for 13+ seconds while its init segment and segment 0 returned HTTP 200 for four tracks. That is a hidden-tab artifact, not a production defect, and the code correctly refuses to escalate to an error while document.hidden (components/EpisodeFeed.tsx:672-680). NEEDS: a foreground browser session or a real device to time poster -> first frame and to confirm the adoption handoff visually.

2. RENDITION CAP EFFECT — assignment verified, effect not. Standing rule 1 says the instance property is what matters, and I confirmed the shipped bundle sets it: chunks/27_6kgf3tx4s2.js contains `t.config.maxDevicePixelRatio=1,t.capLevelToPlayerSize=!0` on the adoption path and `capLevelToPlayerSize:!0,maxDevicePixelRatio:1` in the fresh-attach constructor, while the instant player (chunks/0oo5zhjmwzr5q.js) is deliberately `capLevelToPlayerSize:!1`. What I could NOT observe is the resulting rendition. NEEDS: a foreground session reading hls.currentLevel and video.videoHeight on a ~390px-wide element to prove ~480p/540p is selected rather than 1080p.

3. /watch/[...slug] (creator playback) — source only. app/watch/[...slug]/page.tsx notFound()s unless a row in creator_content is status=published AND pricing_type=free AND has a mux_playback_id. No such title was reachable. NEEDS: a published free creator title, or database access to confirm the table is empty.

4. /api/watch-progress — source only. Both verbs require an authenticated session (401 for a guest by design, app/api/watch-progress/route.ts:14). I verified the client-side contract (lib/watch-progress-client.ts writes the device first, unconditionally) but not the round trip. NEEDS: an authenticated session.

5. RESUME AND AUTO-ADVANCE END TO END — not exercised, same cause as gap 1. I verified the wiring (?t= parsing at components/EpisodeFeed.tsx:1300-1306, the single-seek guard in tryPlay at :569-583, buildResumeUrl in lib/resume.ts:30-33, and the advance cooldown plus unattended cap present in the shipped bundle as `if(t-eg.current<700||(eg.current=t,ev.current>=8))return;`) but never watched an episode complete and advance. NEEDS: gap 1 resolved.

6. iOS PAYWALL SUPPRESSION — unverified. components/EpisodeFeed.tsx:1454-1457 flips `iosApp` from isIOSApp() and every purchase element is gated behind `!iosApp`, replacing the paywall with paywall.unavailableTitle / paywall.unavailableBody. I have no way to set the iOS-app signal from a desktop browser. NEEDS: the native client, or knowledge of the UA/bridge marker isIOSApp() tests.

7. ENTITLED-VIEWER PATHS — unverified by definition. I could not confirm that the rail extends to the full series after purchase, that /api/playback returns policy=signed with a tokenized URL, that the free-run chip hides for an owner, or that a cached signed URL re-locks on 401/402 via onAccessDenied. Nobody has ever completed a purchase on this platform and I had no entitled account. What I DID confirm is that the server is authoritative on the way in: a forged ?session_id=cs_test_forged123 returns HTTP 401 {"full":false} from /api/unlock/confirm and leaves /api/playback/the-mistress-trap--6 at 402. NEEDS: one entitled account.

8. CART PILL OVER THE PLAYER — one observation, not reproduced. On one load of /series/the-mistress-trap/1 the document text included "1 in bag", i.e. the cart pill painting over the immersive player, which .episode-immersive's chrome-hiding rules (app/globals.css:714-720, which hide header, footer and .bottom-nav) do not cover. It was absent on every later load. Another agent was mutating the shared cart during the session, so I cannot say whether the pill is suppressed or was simply empty. NEEDS: a clean profile with a non-empty cart.

---

« S2 — PLAYER / SHORTS — AUDIT RECORD

Run date: 2026-08-29. All production checks against https://www.verzatv.com.

---

## 1. Coverage

**5,972 of 5,972 items in scope examined. 16 findings (1 S1, 2 S2, 9 S3, 4 S4). 8 gaps.**

| Class | In scope | Examined | How |
|---|---|---|---|
| Interactive elements | 74 | 74 | Every one read at its `file:line`; 54 exercised or DOM-inspected on production; 20 are in unreachable components (finding S2-007) |
| Route instances | 4,922 | 4,922 | 4,913 episode routes modelled offline against real catalog + Mux data; 91 episode-1 pages fetched live; 182 playback-boundary API calls; 4 further episode URLs; /shorts, /horizontal, /c/[slug] fetched and DOM-inspected; 5 API routes (4 exercised live) |
| i18n cells | 880 | 880 | 44 player-scope keys × 20 locales, checked programmatically for presence, token integrity and translation |
| Catalog rows | 96 | 96 | 91 live swept + all 91 fetched at episode 1; 5 coming-soon fetched (show 200 / episode 404) |

S2-002 is filed S1 under the rubric's security clause while being an API-layer defect discovered through `/api/playback`; de-duplicate it against the security agent's report.

### Interactive-element denominator, per file

| Count | File |
|---|---|
| 27 | `components/EpisodeFeed.tsx` |
| 18 | `components/Player.tsx` — **unreachable** |
| 8 | `components/ShortsFeed.tsx` |
| 6 | `components/EpisodeDropdown.tsx` |
| 5 | `components/HorizontalFeed.tsx` |
| 3 | `app/series/[slug]/[episode]/error.tsx` |
| 2 | `components/CoinPaywall.tsx` — **unreachable** |
| 2 | `components/HorizontalBackButton.tsx` |
| 2 | `app/series/[slug]/page.tsx` |
| 1 | `components/PlayNowLink.tsx` |
| **74** | (24 button, 41 handler, 9 link) |

---

## 2. The two questions the brief asked

### 2.1 Is the free preview burnable WITHOUT watching? **No. Not by swipe count, not by watch time, not at all.**

There is no consumption model anywhere in the product. Free access is a fixed positional prefix of every series, evaluated fresh on every request, re-enterable without limit.

Server side, `app/api/playback/[episode]/route.ts:65`:

```
const isFree = epNum <= series.freeEpisodes;
```

That is the whole rule. No counter, no ledger row, no cookie, no session state. A repo-wide search for every plausible spelling of a consumption counter — `previewCount`, `previewsUsed`, `freeViews`, `previewRemaining`, `consumeFree`, `free_views`, `previews_used`, `watchedFree`, `freeWatched`, `previewQuota`, `freeQuota` — returns zero hits across `app/`, `lib/`, `components/`, `supabase/` and `scripts/`. The Supabase tables that exist (`watch_progress`, `entitlements`, `purchases`, `saved_list`) record position and ownership, never allowance.

Client side, `app/series/[slug]/[episode]/page.tsx:104-118` marks episodes free by the same positional test at build time, and the rail's `blocked` prop (`components/EpisodeFeed.tsx:2150`) is `!ep.isFree && !authFree` — again positional, again stateless.

Verified against real data on all 91 live series:

- 91/91 → `/series/<slug>/1` returns **200**
- 91/91 → `/api/playback/<slug>--<freeEpisodes>` returns **200** with a public `playbackId` and `policy: "public"`
- 86/86 paid titles → `/api/playback/<slug>--<freeEpisodes+1>` returns **402** `{"status":"paywall"}`
- 5/5 wholly-free titles → `<freeEpisodes+1>` returns **404** (past the end of the series — correct)

Ten of the 91 hit the rate limiter mid-sweep and were re-run after a 70-second cooldown; all ten then matched.

Swiping the rail changes none of this. A viewer can open episode 1, swipe to 5, leave, and return tomorrow to the same five free episodes.

### 2.2 Does the free-run chip read correctly on the 5 wholly-free titles and the 2 clamped below their catalog literal? **Yes — on all of them, and on the other 86.**

The chip is `t("content.freeEpisodeOf", { n: activeEp.number, total: freeEpisodes })` at `components/EpisodeFeed.tsx:2463`, gated by `showFreeRunChip` at `:1626`:

```
authResolved && !authFree && !!activeEp && activeEp.isFree
  && freeEpisodes > 0 && freeEpisodes < totalEpisodes
```

I simulated that predicate over all **4,913** episodes of all 91 live series, using the runtime catalog after the MUX_MAP normalizer:

- Chip shown on **430** episodes — exactly 86 paid titles × 5 free episodes
- Chip hidden on **4,483**
- Episodes where the chip would state a number outside `1..freeEpisodes`: **0**

**The five wholly-free titles.** All five satisfy `freeEpisodes >= episodeCount`, so `freeEpisodes < totalEpisodes` is false and the chip never mounts — the correct behaviour, since there is no boundary to warn about. Verified live on production, all five:

| Slug | free / count | Chip on production | Rail length on production |
|---|---|---|---|
| `the-dumb-billionaire-heiress-in-love` | 50 / 50 | absent | 50 slides (full series) |
| `storage-pirates` | 13 / 13 | absent | 13 slides (full series, horizontal) |
| `too-much-junk` | 1 / 1 | absent | 1 slide |
| `exes-premiere` | 12 / 12 | absent | 12 slides (full series) |
| `love-awards` | 13 / 13 | absent | 13 slides (full series) |

**The two clamped titles.** `lib/catalog.ts:1273-1279` clamps `freeEpisodes` down to real Mux inventory. Exactly two live rows are clamped:

- `the-dumb-billionaire-heiress-in-love` — literal `freeEpisodes: 58` / `episodeCount: 58` at `lib/catalog.ts:122-128` → runtime 50 / 50
- `storage-pirates` — literal 14 / 14 at `lib/catalog.ts:753` → runtime 13 / 13

Both are already inside the wholly-free five. Both correctly show no chip and a full-series rail. **The distinct set of titles where a hard-coded 5 would be wrong is five, not seven** — finding S2-013.

**A paid title, verified live.** `/series/the-mistress-trap/1`, signed out: the chip rendered `Free episode 1 of 5` and the scroller reported 6 slides (`scrollHeight 3478 / clientHeight 580`) — five free plus one locked slide carrying the paywall. Exactly the designed bound.

**Localization of the chip.** `content.freeEpisodeOf` is present in **20/20** locales with both `{n}` and `{total}` intact — including `sw`, which a naive line grep appears to miss because its dictionary is laid out differently. Across all 44 player-scope i18n keys × 20 locales = 880 cells: **0 missing, 0 token drift**. 99 cells are byte-identical to English; 96 of those belong to the eight `content.*` keys used only by the dead `CoinPaywall` (S2-007), and the remaining three are `horizontal.pause` in fr/de and `horizontal.widescreen` in tl — keys nothing renders (S2-010).

---

## 3. What is working, and is verified working

Stated because the brief asks that DO-NOT-REGRESS assets be confirmed rather than assumed.

**The paywall's honesty is intact.** Rendered live on production (the shared browser profile was set to Spanish by another agent, which incidentally proved the localization path end to end): a 3xl `1,99 US$`, `desbloqueo de la serie, pago único`, two benefit lines, `Pago seguro con Stripe`, and `Volver` at equal visual weight with a real `href`. No countdown, no struck-through price, nothing pre-ticked. The Go Back control is an `<a href={backHref}>` with computed opacity 1 — both properties that regressed before and are now guarded by feed-integrity checks 3 and 4.

**The entitlement bound holds on the server.** 91/91 series verified (§2.1). A forged Stripe return — `?session_id=cs_test_forged123` — returns HTTP 401 `{"full":false}` from `/api/unlock/confirm` and leaves `/api/playback/the-mistress-trap--6` at 402. The client's optimistic `authFree` (`components/EpisodeFeed.tsx:1319`) is UI-only; the media capability is never client-granted.

**No paid playback ID leaks into the static payload.** Production HTML for `/series/the-mistress-trap/1` carries exactly 5 real `playbackId` values and 56 × `"playbackId\":\"$undefined\"` with `requiresAuthorization: true`. Offline sweep across all 4,913 episodes: 0 paid rows with a public ID, 0 free rows missing one, 0 rows without a usable duration.

**The runaway guards are in the shipped bundle, not just the source** (standing rule 4). From `_next/static/immutable/chunks/27_6kgf3tx4s2.js`:

- advance cooldown + unattended cap — `if(t-eg.current<700||(eg.current=t,ev.current>=8))return;ev.current+=1;`
- rail bound — `let e=Math.max(m+1,f.findIndex(e=>e.number===p)+1);return e>=f.length?f:f.slice(0,e)`
- adjacency guard — `if(ek.current&&t!==r&&Math.abs(r-t)>1)continue;`
- one-decision-per-batch ratio gate — `e.intersectionRatio>=.55&&(!r||e.intersectionRatio>r.intersectionRatio)`
- per-title chip — `content.freeEpisodeOf",{n:String(eN?.number??1),total:String(m)}`

**The rendition cap is assigned as an instance property, in the shipped bundle** (standing rule 1). Adoption path: `t.config.maxDevicePixelRatio=1,t.capLevelToPlayerSize=!0` — config first (read lazily), then the setter that calls `startCapping()`. Fresh attach constructs with both. The instant player is deliberately uncapped (`capLevelToPlayerSize:!1`) because its element is 2px until adoption. *The resulting rendition is unverified — gap 2.*

**No blunt emitter removal survives anywhere** (standing rule 2). The entire source tree contains exactly one `.off(` call, `components/EpisodeFeed.tsx:477`, scoped by identity: `ahls.off(AdoptedHls.Events.ERROR, adopted.onError)`. Confirmed in the deployed bundle as `.off(e.Events.ERROR,r.onError)`. Zero `removeAllListeners`.

**The feed-integrity gate is load-bearing** (standing rule 3). The five-checks-below-`process.exit` defect is fixed — the reporter is at `scripts/test-feed-integrity.mjs:2369` with every check above it. I proved the gate is not vacuous by negative control, on a full isolated copy of the tree in a scratch directory (the repo working tree was never modified). Baseline PASS, then five mutations, five catches:

| Mutation | Result |
|---|---|
| Delete the `startedRef` + `playedToEnd` guard from `onEnd()` | FAIL ×2 — "ended advances the feed with no evidence the episode ever played"; "an episode can complete without ever showing a frame" |
| Paywall Go Back `<a href>` → `<button onClick>` | FAIL — "a back control is a `<button>`, not a link" |
| `if (authFree)` → `if (true)` in the rail memo | FAIL — "an entitled viewer does not get the whole series" |
| Chip `total: String(freeEpisodes)` → `total: "5"` | FAIL — "the free-episode count is not read from the title" |
| `bound = Math.max(freeEpisodes+1, startIdx+1, allEpisodes.length)` | FAIL — "the bound is not derived from freeEpisodes" |

The gate's coverage boundary is real: every player check reads `components/EpisodeFeed.tsx` only, which is how S2-008 sits in plain sight.

**The instant-play prewarm still fires from a poster tap.** `components/BrowsePage.tsx:1198` wires `posterClick` to every non-coming-soon tile, and `posterClick` (`:259-286`) seeds `verza-transition` and calls `startInstantPlayer`. `lib/series-href.ts:posterHref` routes posters to `/series/<slug>/1`. Only the surrounding comments claim otherwise — S2-014.

**Coming-soon routing is correct.** All 5 rows: `/series/<slug>` → 200, `/series/<slug>/1` → 404. Nothing routes a videoless title into the player.

**The episode picker's FREE badges and padlocks are intact** — `components/EpisodeDropdown.tsx:120` (`isFree = ep.number <= freeEpisodes`), `:146` NOW, `:148` FREE, `:157-160` padlock on every paid row with no per-episode price stamped on it.

---

## 4. Findings

### S2-001 — S2 — Deep-linked paid episodes claim a preview that never happened, on a rail whose free episodes cannot be reached

`/series/the-mistress-trap/40`, signed out, on production:

- The rail builds **40 slides** (`scrollHeight/clientHeight === 40`), 34 locked. Bound: `Math.max(freeEpisodes + 1, startIdx + 1)` — `components/EpisodeFeed.tsx:1422`.
- The paywall mounts and reads **"Acabas de ver la vista previa gratuita de The Escort They Framed"** — English source `paywall.previewOver`: *"You just watched the free preview of {title}. Don't stop now — the story is just getting good."* The viewer has watched zero seconds.
- The overlay (`components/EpisodeFeed.tsx:2503`, `absolute inset-0 z-[60]`) computes `pointer-events: auto`, `touch-action: auto`, rect 394×580, and `document.elementFromPoint(centre)` returns a node inside it. **A real wheel-up of 10 ticks left `scrollTop` at 22605, unchanged.** The scroll container is a sibling, not an ancestor, so there is no scroll chaining. The five free episodes are on the rail and unreachable.
- The only exits are Unlock ($1.99) and Go Back, which leaves the player for the browse tab (`href="/"`).

Reach is not theoretical. `https://www.verzatv.com/sitemaps/episodes.xml` publishes all **4,913** episode URLs, of which **4,394 are paid**. Inside the product, the show page's episode picker links every padlocked row to the same URL (`components/EpisodeDropdown.tsx:125`, list supplied unfiltered at `app/series/[slug]/page.tsx:377-383`).

The comment at `components/EpisodeFeed.tsx:1417-1420` states the intent as "the paywall is the last thing on the track either way." For a deep link past the boundary it is not: 34 locked slides sit between the free run and the landing slide.

*Adjacent to a DO-NOT-REGRESS asset. The paywall's honesty is an asset and is intact. The fix is the copy plus a route back to episode 1 — not a weaker paywall.*

### S2-002 — S1 (security rubric) — The rate limiter does not bind

150 parallel requests to `/api/playback/the-mistress-trap--1` in **4 seconds** against a documented 90/min limit → **150 × HTTP 200, zero 429**. 200 parallel requests to `/api/access` in 4 seconds against 120/min → **200 × HTTP 200, zero 429**.

The mechanism is visible in the response headers. Immediately after the 150-request burst, a fresh request returned `x-ratelimit-limit: 90` with `x-ratelimit-remaining: 84` — the answering instance had counted 6, not 150. `middleware.ts:129-141` keys an in-process `Map` as `` `${ip}:${limit}` ``; that map is per serverless instance, so parallel connections fan out and each sees a fresh bucket.

It looks like it works because a sequential single-connection loop reuses one instance and does 429 — 10 of my 91 catalog probes did exactly that. The same middleware is the only rate control on `/api/checkout` (15/min), `/api/unlock` (15/min) and `/api/auth/` (10/min).

### S2-003 — S2 — The player crashes when browser storage is blocked

`components/EpisodeFeed.tsx:1443-1446`:

```
const [muted, setMuted] = useState(() => {
  if (typeof window !== "undefined") return localStorage.getItem("verza-muted") !== "false";
  return true;
});
```

In Safari with *Block All Cookies* (and Chrome's equivalent), `window.localStorage` access raises `SecurityError`. The throw escapes the `useState` initializer, `EpisodeFeed` fails to render, and `app/series/[slug]/[episode]/error.tsx` takes over. Its **Try again** calls `reset()`, which re-renders the same component and throws again — a closed loop on the app's central surface.

This is the outlier, not the house style: every other storage access in the same file is wrapped (`:1264-1270`, `:1353`, `:1365`, `:1896-1898`, `:1907-1909`). Same unguarded pattern at `components/EpisodeFeed.tsx:1890`, `components/HorizontalFeed.tsx:51-54` and `:275`, `components/ShortsFeed.tsx:141`.

### S2-004 — S3 — /shorts starts unmuted and ignores the shared preference

`components/ShortsFeed.tsx:163` — `const [muted, setMuted] = useState(false);`

Both other players default muted and read the stored key: `components/EpisodeFeed.tsx:1444` and `components/HorizontalFeed.tsx:52`, each `localStorage.getItem("verza-muted") !== "false"`. ShortsFeed **writes** that key (`:141`) but never reads it, so muting in Shorts propagates outward while nothing propagates in. `doPlay()` unmutes as soon as `play()` resolves.

Confirmed on production: the sound rail rendered the label **"On"** — `t(muted ? "shorts.soundOff" : "shorts.soundOn")` — on a cold load, i.e. state `muted === false`.

### S2-005 — S3 — /shorts has no loading, empty, or error state

`components/ShortsFeed.tsx:422` — `if (shuffled.length === 0) return null;` — with `shuffled` starting `[]` (`:161`) and populated only inside a `useEffect` (`:229-236`).

Production HTML for `/shorts` contains **0** occurrences of `episode-immersive`. Its entire visible text is the footer and bottom nav. There is a blank frame before hydration, a permanently blank route without JS, and a permanently blank route if the episode-1 filter ever returns nothing — with no message and no way forward.

The route is advertised in `components/BottomNav.tsx:29`, in `/sitemaps/pages.xml` at priority 0.7, and twice in `lib/data/sitemap.ts`. The house pattern for this is the Anime empty state.

### S2-006 — S3 — Unbounded media-error recovery in Shorts and Horizontal

`components/ShortsFeed.tsx:356` and `components/HorizontalFeed.tsx:100`, identical:

```
else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) hls.recoverMediaError();
```

No counter, no ceiling. Compare `components/EpisodeFeed.tsx:849-861`, which caps at `mediaRecoveriesRef.current < 2`, then tries `swapAudioCodec()` once, then `fullReattach()` capped at 2 — a bound whose stated reason is the allocation burst recorded as P2 in `docs/handoff/IOS-CONTENT-PROCESS-CRASH.md`. Neither file has any failure UI: `EpisodeFeed`'s `sourceError` screen (`:1126-1157`) has no counterpart, so a dead stream in Shorts shows a thumbnail forever.

### S2-007 — S3 — Two unreachable player/paywall components, still wired to checkout, and a guide that copies them forward

`components/Player.tsx` (1,156 lines, 18 interactive elements) and `components/CoinPaywall.tsx` (170 lines, 2 elements) are imported nowhere in `app/`, `components/` or `lib/`. Together they are **20 of the 74** interactive elements in this scope.

Both are live checkout code: `Player.tsx:986` and `CoinPaywall.tsx:142` render the literal `Series Unlock — $1.99 one-time`, unlocalized, with **no `isIOSApp()` gate** — while the shipped paywall uses `formatPrice(SERIES_UNLOCK_PRICE_CENTS)` and hides every purchase element behind `!iosApp`. Both `POST /api/unlock`. Both emit analytics surfaces that can never fire (`player_unlock_popup` at `Player.tsx:258`, `coin_paywall` at `CoinPaywall.tsx:47`), which quietly poisons funnel analysis.

The only references in the repo are `docs/guides/PORTING-VERZA-TV-TAB.md:131, 138, 250, 366` and `:449` — a `cp` command that copies both into any new surface. Their five exclusive i18n keys are still English in 12 of 20 locales, so a copy ships an English `$1.99` paywall to zh/hi/ar/ru/tr/pl/nl/th/vi/id/tl/sw, inside an app whose iOS binary may not show a Stripe price at all.

### S2-008 — S3 — `/horizontal`'s back control is a button, and the gate that forbids that cannot see the file

`components/HorizontalBackButton.tsx:7`:

```
<button onClick={() => { window.location.href = "/?tab=reality"; }}>
```

`scripts/test-feed-integrity.mjs:132-152` asserts "Navigation controls must be real links" and names the exact bug it prevents. Its regex runs over `feedCode`, which is `read("components/EpisodeFeed.tsx")` (`:34`, `:46`). I confirmed the check is load-bearing (§3) *and* that it cannot reach this file.

### S2-009 — S3 — Every player failure state is English-only in 20 locales

`app/series/[slug]/[episode]/error.tsx:56` "This episode didn't load", `:57` "Something went wrong on our side. Your place in the series is saved.", `:66` "Try again", `:73` "Back to browse" — all literals. The boundary renders inside the layout, so `useTranslation()` is available.

In-slide: `components/EpisodeFeed.tsx:302` and `:647` "We could not load this episode.", `:691` "This episode will not play.", `:1139` "Your purchase is safe. This is a playback problem on our side.", `:1148` "Try again", `:1155` "Back to browsing".

A translated `content.tryAgain` already exists in all 20 locales and is rendered nowhere.

Separately, *"Your place in the series is saved"* is a promise the boundary cannot keep: progress is written only by the 10-second heartbeat (`components/EpisodeFeed.tsx:952-961`, gated on `vid.currentTime > 5`) and the `visibilitychange` flush. A throw before first playback saves nothing.

### S2-010 — S3 — `/horizontal` is an orphan with English-only chrome and unused translations

No `"/horizontal"` href exists anywhere in `app/`, `components/` or `lib/` — only its own `alternates.canonical` (`app/horizontal/page.tsx:11`). It is absent from `app/sitemaps/pages.xml/route.ts:8-20` and from `lib/data/sitemap.ts`. `nav.widescreen` is translated in all 20 locales and rendered nowhere.

Live DOM read on production: 14 video cards; button accessible names *"Play Storage Pirates Teaser"*, *"Play Real Storage Auction in New Jersey"* — `components/HorizontalFeed.tsx:226`, `` aria-label={playing ? "Pause" : `Play ${video.title}`} `` — while `horizontal.play` and `horizontal.pause` exist in all 20 locales, unused. The mute control on the same row **is** localized (`:283`), which puts the inconsistency side by side.

Page chrome is likewise literal: `:330` "Storage Pirates", `:333` the logline, `:336` "Horizontal Video", `:339` "Rotate your phone for full-screen landscape viewing", `:348` "SEASON 1", plus "SEASON 2" and "BONUS".

Two smaller inaccuracies in the same file: the comment at `:85` says *"Fifteen cards mount on this route"* but `lib/horizontal-map.ts` holds 14 entries (confirmed live: 14 `<video>` elements), and the Season 1 heading renders "8 episodes" while one of the eight is the episode-0 teaser.

### S2-011 — S3 — The rail re-subscribes its playback listeners four times a second

`components/EpisodeFeed.tsx:2139-2145` allocates fresh callbacks on every parent render:

```
onProgress={i === activeIndex ? setEpProgress : () => {}}
onPosition={i === activeIndex ? (p: number) => { activePositionRef.current = p; } : () => {}}
```

Both are dependencies of the effect that attaches `timeupdate` and `ended` (`:997-1003`). `onTime` calls `setEpProgress` with a changing value ~4×/sec, re-rendering the parent; `EpisodeSlide` is not memoized. Result: up to five mounted slides tear down and re-add two listeners each, four times a second, for the whole watch.

Secondary risk: an `ended` delivered in the gap between `removeEventListener` and `addEventListener` is dropped, silently skipping an auto-advance.

### S2-012 — S3 (PLAUSIBLE) — `activeIndexRef` is written during render and by the observer

`components/EpisodeFeed.tsx:1573` assigns `activeIndexRef.current = activeIndex` in the component body. `:1782-1786` has the observer write the same ref and queue `setActiveIndex(idx)`.

Any render between the observer's write and the committed state — `setEpProgress` fires ~4×/sec — re-runs the render-body assignment and reverts the ref to the stale index. Consumers reading the ref rather than state: `handleEpisodeEnded` (`:1738`, `:1745`), the fullscreen button (`:2231`), the backgrounding flush (`:1832`), and the adjacency guard itself (`:1780`). Consequence: an auto-advance computed from a stale index scrolls to the slide the viewer is already on.

Marked PLAUSIBLE — the mechanism is certain from the code; the race was not reproduced live (gap 1).

### S2-013 — S4 — "Seven of the ninety-one" is five

`components/EpisodeFeed.tsx:2437`, `scripts/test-feed-integrity.mjs:2339`, `:2343` and `:572` all assert a hard-coded 5 would be wrong for **seven** live titles ("the five wholly free titles and the two whose allowance is clamped").

Measured against the runtime catalog: exactly **five** live rows have `freeEpisodes !== 5`, and the two clamped rows — `the-dumb-billionaire-heiress-in-love` (literal 58 at `lib/catalog.ts:128` → 50) and `storage-pirates` (literal 14 at `:753` → 13) — are two **of** those five, not two more. All 86 paid titles are exactly 5. Standing rule 5: an inherited fact that did not survive re-checking.

### S2-014 — S4 — The prewarm comments assert the opposite of the shipped routing

`components/BrowsePage.tsx:251-253`: *"every tile, hero, category row and search result now opens the show page instead, and the show page's own play CTA carries the prewarm from there."*

Six lines below, `:259-286` defines `posterClick`, which seeds `verza-transition` and calls `startInstantPlayer(publicId)`, wired to every grid tile at `:1198`. `lib/series-href.ts:posterHref` returns `/series/<slug>/1`, and its own docblock says the opposite of BrowsePage's: *"A poster tap starts the video, immediately, with no interstitial and no second tap."* The entire header block of `components/PlayNowLink.tsx:26-45` rests on the same falsified premise.

The behaviour is correct; the comments are wrong in the direction that would invite someone to delete a working prewarm.

### S2-015 — S4 — Duplicated dead statement inside the Severity 1 file

`components/EpisodeFeed.tsx:369-371` and `:868-870` each read `startedRef.current = false;` twice, followed by a `setStarted(false);` indented out of its block. Harmless at runtime; named because it sits in the file the brief marks DO NOT MODIFY, and a stray duplicate is exactly what a reviewer skims past.

### S2-016 — S4 — The events route documents the wrong rate-limit tier

`app/api/events/route.ts:13` says *"catch-all /api/ tier: 30/min/IP"*. `middleware.ts:51` gives `/api/events` its own 180/min tier; the production header returns `x-ratelimit-limit: 180`.

The sink itself works: `POST {"event":"paywall_viewed","props":{…}}` → HTTP 202 `{"ok":true}`. (My first probe used `{events:[…]}` and got a correct 400 `{"error":"Unknown event"}` — the route's shape is `{event, props}`.)

---

## 5. Method notes

- **Real data, not string matching** (standing rule 6). The rail, chip, entitlement bound and Mux exposure were modelled over all 4,913 real episodes by loading `lib/catalog.ts`, `lib/mux-map.ts` and `lib/mux-public-map.ts` through the same TypeScript transpile-and-execute loader the feed-integrity suite uses, then re-resolved to real URLs and fetched.
- **Deployed bundle, not the build** (standing rule 4). All 16 client chunks for `/series/[slug]/[episode]` were downloaded from `www.verzatv.com` and searched for the cap assignment, the scoped `off()`, the advance cooldown, the unattended cap, the rail bound, the adjacency guard and the chip's per-title read.
- **Negative control** (standing rule 3). The feed-integrity suite was baselined and then broken five ways in an isolated copy of the tree. The repo working directory was not modified.
- **Nothing was repaired.** The rail was read, measured and fetched; no application file was edited.

---

## 6. Gaps

1. **First-frame timing / instant play — unmeasured.** The available browser is shared with other agents driving it concurrently; my tab reported `document.hidden === true` throughout, so Chrome suspended media decode. Symptom: `readyState 0`, `buffered.length 0` for 13+ seconds while the init segment and segment 0 returned 200 for four tracks. Hidden-tab artifact, not a production defect — and the code correctly refuses to escalate to an error while `document.hidden` (`components/EpisodeFeed.tsx:672-680`). **Needs:** a foreground browser or a real device.
2. **Rendition cap effect — assignment verified, effect not.** The shipped bundle sets the instance property; the resulting rendition is unobserved. **Needs:** a foreground session reading `hls.currentLevel` / `video.videoHeight` on a ~390px element.
3. **`/watch/[...slug]` (creator playback) — source only.** `notFound()`s unless `creator_content` has a row with `status=published`, `pricing_type=free` and a `mux_playback_id`. None reachable. **Needs:** a published free creator title, or DB access.
4. **`/api/watch-progress` — source only.** Both verbs require a session (401 by design at `route.ts:14`). Client contract verified (`lib/watch-progress-client.ts` writes the device first, unconditionally); round trip not. **Needs:** an authenticated session.
5. **Resume and auto-advance end to end — not exercised** (same cause as gap 1). Wiring verified: `?t=` parsing at `:1300-1306`, single-seek guard at `:569-583`, `buildResumeUrl` at `lib/resume.ts:30-33`, cooldown and cap present in the shipped bundle.
6. **iOS paywall suppression — unverified.** `components/EpisodeFeed.tsx:1454-1457` flips `iosApp` from `isIOSApp()` and gates every purchase element behind `!iosApp`. Not settable from a desktop browser. **Needs:** the native client or the UA/bridge marker.
7. **Entitled-viewer paths — unverified by definition.** Rail extension after purchase, `policy=signed` with a tokenized URL, chip suppression for an owner, and re-lock on 401/402 via `onAccessDenied` are all unconfirmed. Nobody has ever completed a purchase on this platform and I had no entitled account. What *is* confirmed is that the server is authoritative on the way in (§3). **Needs:** one entitled account.
8. **Cart pill over the player — one observation, not reproduced.** One load of `/series/the-mistress-trap/1` included "1 in bag" in the document text, i.e. the cart pill painting over the immersive player, which `.episode-immersive`'s chrome-hiding rules (`app/globals.css:714-720` — header, footer, `.bottom-nav`) do not cover. Absent on later loads; another agent was mutating the shared cart. **Needs:** a clean profile with a non-empty cart.
