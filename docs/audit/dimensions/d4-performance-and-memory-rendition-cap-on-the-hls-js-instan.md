# D4 — Performance and memory. Rendition cap on the hls.js INSTANCE under the restored routing, maxDevicePixelRatio, decoder/pipeline and instance counts across a long swipe, listener leaks, bundle size, image optimization, and rate-limit tier separation (/api/access must not share a bucket with playback, progress or analytics). Every cap claim verified in the DEPLOYED bundle on https://www.verzatv.com, not in the build. Concrete units in scope: 10 hls.js construction sites, 11 rate-limit tiers, 7 production routes measured for JS weight, 102 image items (101 poster sources + the next.config images block), 139 UI files scanned for listener/timer/observer balance, 2 perf regression guards negative-controlled, and the 50-slide feed rail of the longest wholly-free title.

**Coverage: 277 of 321 items examined.** 14 findings raised.

## Gaps — items in scope this agent could not examine

Items in scope I could NOT examine, and what each needs:

1. 44 of 50 slides of the long-swipe rail (D4's "60-episode swipe"). I traversed episodes 1 to 6 of the-dumb-billionaire-heiress-in-love with real wheel input and sampled a constant steady state at three separate points. I could not traverse the remaining 44 because (a) programmatic scrollTop and scrollTo are refused by scroll-snap on this feed — the container re-snaps to the last mounted slide, proven by 30 consecutive no-op scroll assignments — so only real synthesized input advances it, at one tool round-trip plus one screenshot per slide, and (b) the shared Chrome profile was being driven by other agents in the same session, which navigated my tab away mid-run three times and froze the renderer twice (CDP Runtime.evaluate timeout after 45,000 ms). NEEDS: a dedicated browser session, or a headed run with a touch-emulation driver that can flick the feed 50 times.

2. A true 60+ episode rail. The longest wholly-free title is 50 episodes; every 61-62 episode title clamps a guest to 6 slides via the entitlement bound at components/EpisodeFeed.tsx:1415-1424. NEEDS: an entitled test account, which I did not create (creating accounts is prohibited and would also write to the live entitlements table).

3. Actual video DECODER counts and GPU/decoder memory. Playback never decoded in the automation profile — segments downloaded and were appended-to-nothing, with readyState 0, videoWidth 0 and buffered.length 0 on every element across every run. I therefore measured hls.js pipeline counts (instances, SourceBuffers, network state) rather than decoders. NEEDS: a Chrome profile with proprietary codecs and media playback enabled, or a real device.

4. The named target device. Everything was observed in desktop Chrome at devicePixelRatio 2 with a 606x523 media element. The iPhone case (390 CSS px, DPR 3, ManagedMediaSource) was not measured. The cap was observed BINDING at DPR 2 (autoLevelCapping 1 of 3 levels); the DPR 3 result is derived from the same hls.js code path, not observed. NEEDS: an iOS device or Safari Technology Preview with device emulation.

5. Runtime instance counts for /shorts (ShortsFeed) and /horizontal (HorizontalFeed). Reviewed statically only — both construct with capLevelToPlayerSize:true and maxDevicePixelRatio:1, ShortsFeed swaps one element between sources and destroys on unmount, HorizontalFeed mounts up to fifteen cards. NEEDS: the same browser access as item 1.

6. CreatorWatch (/watch/*), the one live surface with a fully unconfigured `new Hls()`. Unreachable: it requires a published row in creator_content, and creator ingestion is unavailable (the Mux webhook returns 503 by design). NEEDS: a published creator title, or a preview deploy with seeded data.

7. Per-route bundle enumeration beyond the 7 routes probed (/, /about, /shop, /shorts, /me, /legal/terms, /series/<slug>/1). The manifest lists 65 page routes. I crawled the chunk graph from the home and episode HTML (19 chunks) rather than every route's lazily-loaded chunks. NEEDS: a full crawl of all 65 routes' chunk manifests.

8. Whether the D4-002 stranding is reachable by a touch flick on a phone. Reproduced with a desktop 10-tick wheel gesture. The code-level mechanism is input-independent, but `scroll-snap-stop: always` is honoured differently for touch, so the phone reachability is unconfirmed. NEEDS: a real touch device.

9. Long-task and main-thread cost of the ~2.1 MB of decoded JS. performance.getEntriesByType('longtask') returned an empty array in this profile (the observer was not registered before load), so I have transfer and decode sizes but no parse/execute time. NEEDS: a Performance trace or a Lighthouse run on throttled mobile hardware.

---

# D4 — Performance and Memory

**Target:** https://www.verzatv.com (production, deployment `dpl_7L9CxaoUDHn95y2P125xTMAVAWAj`)
**Working tree:** `/Users/jothamhall/E! CREATOR ECONOMY/verza-tv`
**Date:** 2026-08-29
**Coverage: 277 of 321 scoped items examined. 14 findings (0 S1, 1 S2, 6 S3, 7 S4).**

Every cap claim below was verified by reading the LIVE hls.js instance in the deployed page, not by reading source and not from a local build. Every guard claim was negative-controlled in an isolated copy of the repo. No application file was modified; the negative controls ran against a copy at `…/scratchpad/d4/negctl` with `node_modules` and `public` symlinked back to the repo.

---

## Coverage denominator

| Unit | In scope | Examined |
|---|---|---|
| hls.js construction sites (`new Hls(`) | 10 | 10 |
| Rate-limit tiers (middleware.ts) | 11 | 11 |
| Production routes measured for JS weight | 7 | 7 |
| Image items (101 poster sources + next.config images block) | 102 | 102 |
| UI files scanned for listener/timer/observer/rVFC balance | 139 | 139 |
| Perf regression guards negative-controlled | 2 | 2 |
| Slides of the longest wholly-free rail traversed with real input | 50 | 6 |
| **Total** | **321** | **277** |

---

## Part 1 — VERIFIED GOOD (the things D4 was sent to confirm)

These are confirmations, not findings. They are recorded because Standing Rule 5 says to re-check every inherited fact, and three of these were previously asserted without observable evidence.

### D4-A. The rendition cap IS bound on the INSTANCE, under the restored routing, in the deployed bundle

The restored routing is live: the home page's real DOM carries 25 anchors, all of the form `/series/<slug>/1` (e.g. `/series/tied-by-fate/1`). A tile tap therefore lands in the player, and `components/BrowsePage.tsx:284 startInstantPlayer(publicId)` prewarms it, so **the adoption path is the common path**, exactly as the fix assumed.

I clicked a poster in production and then walked the React fiber tree to read the live hls.js instances:

```
adopted instance   (media.parentElement === document.body, maxBufferLength 8):
  levels            254x480@249k | 450x854@559k | 1012x1920@2279k
  autoLevelCapping  1                       <- capped to 450x854, NOT the top rendition
  config.capLevelToPlayerSize  true         <- was FALSE at construction
  config.maxDevicePixelRatio   1            <- was Infinity at construction
  capLevelController.timer     RUNNING      <- startCapping() actually ran
  ERROR listeners on emitter   14

fresh-attach neighbour (maxBufferLength 4):
  autoLevelCapping  1
  capLevelToPlayerSize true / maxDevicePixelRatio 1 / timer RUNNING
  ERROR listeners on emitter   14
```

`autoLevelCapping` is the *effect* of `startCapping()`, not the assignment: `CapLevelController.startCapping()` (node_modules/hls.js/dist/hls.mjs:20118) is the only thing that starts the 1000 ms `detectPlayerSize` timer, and `detectPlayerSize` is the only writer of `hls.autoLevelCapping`. A capped value of 1 out of 3 levels on a 606×523 element at DPR 2 with `maxDevicePixelRatio: 1` is the correct answer (`contentScaleFactor = Math.min(2, 1) = 1`, so `mediaWidth` 606 → the smallest level ≥ 606 wide is index 1). **Standing Rule 1 satisfied: the behaviour change is observable.**

The deployed minified source confirms the assignment target:

```
chunks/27_6kgf3tx4s2.js:
  t.config.maxDevicePixelRatio=1,t.capLevelToPlayerSize=!0,
  r.onError&&t.off(e.Events.ERROR,r.onError),
```

Instance property, not `config.capLevelToPlayerSize`. Confirmed against `https://www.verzatv.com/_next/static/immutable/chunks/27_6kgf3tx4s2.js`. **Standing Rule 4 satisfied.**

### D4-B. `maxDevicePixelRatio: 1` is present and effective on both attach paths

- Fresh attach (deployed): `capLevelToPlayerSize:!0,maxDevicePixelRatio:1` inside the `new Hls({…})` literal — this is sufficient, because `CapLevelController.onManifestParsed` (hls.mjs:20058) and `onBufferCodecs` (:20073) call `startCapping()` whenever `hls.config.capLevelToPlayerSize` is true. Observed: `timer: RUNNING`, `autoLevelCapping: 1`.
- Instant player (deployed): `capLevelToPlayerSize:!1` — intentionally uncapped while the element is 2 px, and the obligation correctly discharged by the adopter.
- Cold deep link (no adoption): both live instances showed `3L/cap1/mbl8/C1/T` and `3L/cap1/mbl4/C1/T`. Before manifest parse the reading is `0L/cap-1/…/t` (no levels, timer not yet started), which settles within ~5 s.

### D4-C. Standing Rule 2 — no blunt-remove regression, and no duplicate handler

`hls.js@1.6.16` registers **13** internal `on(Events.ERROR, …)` subscriptions (`grep -c "on(Events.ERROR" node_modules/hls.js/dist/hls.mjs` = 13). Both the adopted instance and a never-adopted fresh instance reported **14** listeners on the `hlsError` event in production.

- 14 = 13 internal + 1 application handler.
- A blunt `off(Events.ERROR)` would have left **1**.
- A missing `off()` (the P2 duplicate) would have left **15**.

14 on both is the exact expected value, on the one instance that was ever at risk. Negative-controlled: rewriting the removal to `ahls.off(AdoptedHls.Events.ERROR)` makes `test:feed-integrity` FAIL with `player: the ERROR listener is removed without a handler reference`.

### D4-D. Decoder / pipeline / instance counts are constant across the traversal

Measured live on the 50-slide wholly-free rail (`the-dumb-billionaire-heiress-in-love`), sampled at three independent points:

| Position | Mounted slides | `<video>` elements | hls.js instances | pipelines loading | JS heap |
|---|---|---|---|---|---|
| episode 1 (arrival) | 3 `[0,1,2]` | 3 | 2 | 2 | 16 MB |
| episode 4 | 5 `[1..5]` | 5 | 3 | 3 | 33 MB |
| episode 6 | 5 `[3..7]` | 5 | 3 | 3 | 15–19 MB |

Per-slide network state at episode 4 was exactly the designed shape — `net=0/preload=none` on the two outer slides, `net=2 (LOADING)/preload=auto` on active ±1:

```
slide 1: net 0, preload none, buffered 0
slide 2: net 2, preload auto
slide 3: net 2, preload auto   <- active
slide 4: net 2, preload auto
slide 5: net 0, preload none, buffered 0
```

Nothing accumulates. `MAX_SPAN` (EpisodeFeed.tsx:1680) holds the mount window at 5 and `isNear = |i − activeIndex| <= 1` holds the pipeline count at 3.

One false alarm worth recording so nobody re-raises it: a torn-down slide's `<video>` still reports a stale `blob:` string in `currentSrc` after `removeAttribute("src")` + `load()`. `networkState` is 0 (NETWORK_EMPTY) and `buffered.length` is 0 on those elements, so **no MediaSource, SourceBuffer or decoder is retained** — `currentSrc` is just a string Chrome does not clear. Not a leak; do not "fix" it.

### D4-E. Rate-limit tier separation is intact in production — the D4 requirement is MET

Probed live, one request each:

| Path | HTTP | `x-ratelimit-limit` | Bucket |
|---|---|---|---|
| `/api/access?slug=…` | 200 | **120** | own |
| `/api/playback/…` | 400 | **90** | own |
| `/api/watch-progress` | 200 | **60** | own |
| `/api/events` | 405 | **180** | own |
| `/api/checkout` | 405 | 15 | shared → D4-007 |
| `/api/unlock` | 405 | 15 | shared → D4-007 |
| `/api/subscribe` | 405 | 15 | shared → D4-007 |
| `/api/auth/session` | 404 | 10 | shared → D4-007 |
| `/api/push/send` | 405 | 10 | shared → D4-007 |
| `/api/ai-host` | 405 | 5 | own |
| `/api/saved-list`, `/api/entitlements` | 200 / 401 | 30 | catch-all (by design) |

**`/api/access` (120) does not share a bucket with playback (90), progress (60) or analytics (180).** These four limits are pairwise distinct and are the only members of their tiers, so `${ip}:${limit}` cannot collide between them. Deployed values match `middleware.ts:26-53` and `docs/audit/00-manifest.md` exactly.

### D4-F. Listener/timer/observer hygiene

A scan of all 139 UI files for `addEventListener` vs `removeEventListener`, `setInterval` vs `clearInterval`, `new IntersectionObserver`/`ResizeObserver`/`MutationObserver` vs `.disconnect()` found **zero** unbalanced files. The only asymmetry anywhere is `requestVideoFrameCallback` with no cancel (→ D4-013), which is not a measurable leak.

### D4-G. Other checks that passed

- `npx tsx scripts/audit-perf.ts` → 11 checks, 0 failures (but see D4-001 for what that number is worth).
- `node scripts/test-feed-integrity.mjs` → PASS, walking 4,913 episodes across 91 live series. Its `process.exit(1)` is at line **2373 of 2377** — no checks sit below the reporter. **Standing Rule 3 satisfied for this file.**
- `/dev/perf` returns **404** in production (`PERF_TEST_MODE` correctly off).
- next/image is doing its job: `?w=448` returns **26,730 B webp**, `?w=1920` returns **94,444 B webp**, and `?w=1200` returns the *identical* 94,444 B — the optimizer clamps to the ≤1080 px source and never enlarges. Raw PNG for the same poster is 2,231,379 B. `imageSizes` includes 448 and 512, covering the phone tile band as `audit-perf` intends. `/posters/*` is served `public, max-age=31536000, immutable`.
- **Instant play from a poster tap is NOT regressed.** Verified end to end in production on the browse tiles: click → `startInstantPlayer` → navigation → `adoptInstantPlayer` → body-level `<video>` pinned over the slide box at 606×523 with a live capped hls instance. This is a protected asset and it is working.

---

## Part 2 — FINDINGS

### D4-001 — S3 — The `maxDevicePixelRatio` guard cannot fail

`scripts/audit-perf.ts:203`:

```ts
} else if (!/maxDevicePixelRatio/.test(body)) {
```

`body` is the raw text captured by `/new Hls\(\{([\s\S]*?)\}\)/` — **comments included**. `scripts/test-feed-integrity.mjs:43` has a `stripComments()` helper for exactly this reason; `audit-perf.ts` has none.

Negative control, three stages, in the isolated copy:

| Mutation | `test:feed-integrity` | `audit:perf` |
|---|---|---|
| Delete `maxDevicePixelRatio: 1,` from the fresh-attach config (EpisodeFeed.tsx:791) | PASS | **PASS — "✅ caps rendition to player size"** |
| …and also delete the comment at :781-790 | PASS | ⚠ warns, **still "0 failures"** |
| Delete `ahls.config.maxDevicePixelRatio = 1;` (EpisodeFeed.tsx:450) | **PASS** | ❌ FAIL |
| *(control)* Rewrite to `ahls.config.capLevelToPlayerSize = true;` | ❌ FAIL ×2 | ❌ FAIL |
| *(control)* Rewrite to bare `ahls.off(AdoptedHls.Events.ERROR)` | ❌ FAIL | — |

So: the string that saves the guard is the comment explaining why the guard exists. `components/ShortsFeed.tsx:342-347` has the same shape ("maxDevicePixelRatio matters as much as the cap itself" inside the literal) — dead there too. `components/HorizontalFeed.tsx:88-92` does not mention it in its comment, so that guard is live.

Compounding it: the one check that *does* catch the adopted-path loss lives only in `audit:perf`, and **`npm run audit:perf` is not among the eight commands under "Required pre-release gates" in AGENTS.md**. P1 — the documented cause of the iOS WebContent kill — is therefore silently regressible on both attach paths.

### D4-002 — S2 — A multi-slide scroll strands the feed on a blank screen

Reproduced in production on `/series/the-dumb-billionaire-heiress-in-love/1`. After reaching episode 6 with one-slide gestures (correct behaviour throughout), three 10-tick wheel gestures produced:

```
{"sl":9.73,
 "mounted":["3@-4256","4@-3620","5@-2984","6@-2348","7@-1712"],
 "url":"/series/the-dumb-billionaire-heiress-in-love/6",
 "vid":5,"heap":15}
```

Scroll offset is 9.73 viewports; all five mounted slides are 2.7 to 6.7 viewports **above** the fold. The screen shows only the VERZA watermark on black. It did not recover after a 2.5 s settle, after further downward scrolls, or after a 3-tick upward scroll (`sl` moved 9.73 → 9.29, mounted window unchanged).

Mechanism, all in `components/EpisodeFeed.tsx`:

1. `:1780` — `if (!firstSettle && prev !== idx && Math.abs(idx - prev) > 1) continue;` rejects the non-adjacent settle, so `activeIndexRef.current` stays at 5.
2. `:1644` — `const recenter = () => setWindowCenter(activeIndexRef.current);` re-centres on the stale index.
3. `:1658-1686` — `windowStart`/`windowEnd` are computed from `windowCenter` and `activeIndex` only. **Nothing in the component reads `scrollTop`.** There is no path back.

The adjacency guard is a correct fix for the runaway-index bug it names; the gap is that rejecting the settle leaves no fallback. A recovery that reads `Math.round(scrollTop / clientHeight)` on `scrollend` and re-centres there would close it without weakening the guard.

**Caveat, stated plainly:** reproduced with a desktop mouse wheel. `scroll-snap-stop: always` is honoured more strictly for touch, so phone reachability is unconfirmed. The code-level failure is input-independent — any settle that skips an intermediate ≥0.55 intersection produces it.

**Not a defect (do not report):** programmatic `scrollTop`/`scrollTo` cannot advance this feed at all — 30 consecutive assignments produced zero movement because scroll-snap re-snaps to the last mounted slide. That is a synthetic-input artifact, and real gestures work correctly one slide at a time.

### D4-003 — S3 — 148 MB of dead poster art is committed, deployed and publicly served

```
$ du -sk public public/posters public/posters-backup-20260617
public                         358.7 MB
public/posters                 203.6 MB
public/posters-backup-20260617 147.9 MB   (77 PNGs, all tracked in git)

$ curl -sI https://www.verzatv.com/posters-backup-20260617/a-love-once-betrayed.png
HTTP/2 200
content-length: 1890262
cache-control: public, max-age=0, must-revalidate
```

The `next.config.ts` immutable-cache rule matches `/posters/:path*` only, so every fetch of the backup directory revalidates. There is no `.vercelignore`; `vercel.json` contains only a cron entry. `/_next/image?url=%2Fposters-backup-20260617%2F…` also serves it through the optimizer.

### D4-004 — S3 — The 519-row Mux map and the whole catalog ship on every route

`lib/catalog.ts:5` imports `MUX_MAP` at module scope, and its only use is `lib/catalog.ts:1275`:

```ts
const streams = MUX_MAP[s.slug]?.length;
```

96 array lengths. Thirteen client components import `@/lib/catalog` (BrowsePage, CategoryTabs, SearchBar, SearchButton, FeedSearch, HeroCarousel, LibraryPage, AccountLists, PurchaseHistoryList, SeriesInfoButton, SeriesInfoDrawer, Player, ShortsFeed), several of them in the shared header/layout.

Result, confirmed on 7 of 7 routes probed (`/`, `/about`, `/shop`, `/shorts`, `/me`, `/legal/terms`, `/series/<slug>/1`):

| Chunk | Contents | Raw | Brotli |
|---|---|---|---|
| `29mb6gc-29b3o.js` | 519 `playbackId` entries | 156,628 B | 37,569 B |
| `428d7hhx0m19l.js` | catalog (20 `synopsis`) | 108,781 B | 32,290 B |

`components/PlayNowLink.tsx:12-18` documents the opposite intent — "Resolved server-side so the 4,900-row public Mux map stays out of this page's client bundle." True of `PlayNowLink`; false of the shipped bundle.

### D4-005 — S3 — hls.js is eagerly downloaded on browse for everyone

`components/BrowsePage.tsx:18-23` fires `import("hls.js")` on a 0 ms timer at module scope. Deployed: `chunks/0394rxul_bkiz.js` = **511,717 B identity / 160,990 B brotli**.

Per-route JS measured against production:

| Route | Chunks in HTML | Brotli | Identity |
|---|---|---|---|
| `/about` | 12 | 322 KB | 1,065 KB |
| `/` | 14 | 338 KB | 1,114 KB |
| `/series/<slug>/1` | 16 | 403 KB | 1,356 KB |
| hls.js (dynamic) | 1 | 157 KB | 499 KB |

So the home page reaches ~495 KB brotli / ~1.6 MB identity of JS before a single tap, and the browser reported **2,165 KB of decoded script** on `/` and **2,412 KB** on the episode page.

### D4-006 — S3 — Four hls.js construction sites no guard looks at

`grep -rn 'new Hls(' app components lib` → 10 sites. `scripts/audit-perf.ts:150-155` reads four files. The uncovered ones:

| Site | Config | Status |
|---|---|---|
| `components/Player.tsx:155` | `capLevelToPlayerSize: true`, **no** `maxDevicePixelRatio` | dead (no importers) |
| `components/Player.tsx:590` | same | dead |
| `components/HeroVideo.tsx:69` | `{ maxBufferLength: 15, enableWorker: true }` — no cap | dead |
| `components/RedCarpetHero.tsx:73` | same — no cap | dead |
| `components/CreatorWatch.tsx:84` | `new Hls()` — no cap, `maxBufferLength` 30, `backBufferLength` Infinity, `maxBufferSize` 60 MB | **live** at `app/watch/[...slug]/page.tsx` |

The two `Player.tsx` sites are the exact P1 shape: `capLevelToPlayerSize` without `maxDevicePixelRatio` never binds, because `contentScaleFactor` is `Math.min(devicePixelRatio, config.maxDevicePixelRatio)` and the default is `POSITIVE_INFINITY` (hls.mjs:31273, :20175). `audit-perf.ts:141-143` already records this precise failure mode for ShortsFeed — "A guard that does not look at a file cannot protect it" — and it has recurred with four more files.

### D4-007 — S3 — checkout, unlock and subscribe share one 15/min bucket (money path)

`middleware.ts:120` — `const key = \`${ip}:${limit}\``. Observed live within one window from one IP:

```
/api/checkout   x-ratelimit-remaining: 14
/api/unlock     x-ratelimit-remaining: 13
/api/subscribe  x-ratelimit-remaining: 12     <- one counter, three endpoints
/api/auth/session  remaining: 9
/api/push/send     remaining: 8               <- one counter, two endpoints
```

Three of the four money endpoints share 15 requests per minute per IP.

### D4-008 — S4 — The limiter is per-isolate, and a false 429 on `/api/access` re-paywalls a payer

12 sequential requests to `/api/access`:

```
117 116 115 114 113 112 111 110 → 119 ← different isolate, fresh Map
                                   118 117 116
```

`middleware.ts:16-20` documents this. The consequence is at `components/EpisodeFeed.tsx:1360`:

```ts
const d = r.ok ? ((await r.json()) as { full?: boolean }) : null;
```

followed by `:1371 if (!stale) setAuthFree(false);` — a 429 is indistinguishable from "no entitlement". The middleware's own comment at `:41-48` names this exact outcome. Behind CGNAT or a carrier NAT, many viewers share one `x-forwarded-for`; the per-isolate split reduces the odds but is not the fix.

### D4-009 — S4 — Stale, inverted comment on the prewarm

`components/BrowsePage.tsx:249-256` claims "Continue Watching is the last one on this page: every tile, hero, category row and search result now opens the show page instead." The code attaches `posterClick` at `:631` (continue watching), `:670`, `:899` (reality), `:953` (red carpet), `:989` (hero) and `:1201` (main grid), and production serves 25 anchors all ending in `/1`. Standing Rule 5, applied to a comment written after the routing was restored.

### D4-010 — S4 — Nine poster surfaces route to the player with no prewarm

Under the restored `posterHref`, these all land in the player cold: `SeriesCard.tsx:14`, `HeroCarousel.tsx:26` and `:59`, `SearchBar.tsx:67`, `SearchButton.tsx:125`, `FeedSearch.tsx:111`, `LibraryPage.tsx:22`, `AccountLists.tsx:163` and `:176`, `PurchaseHistoryList.tsx:148`, `app/search/page.tsx:181`, `app/genres/[slug]/page.tsx:115`.

**Marked clearly:** this is *not* a regression of the protected "instant play from a poster tap" behaviour — that was verified working in production on the browse tiles (D4-A). It is an inconsistency the routing restoration introduced on secondary surfaces.

### D4-011 — S4 — A stale prewarm survives the next tap when the next id is undefined

`lib/instant-player.ts:63` returns *before* `:65 destroyInstantPlayer()`:

```ts
if (typeof window === "undefined" || !playbackId) return;
if (current?.playbackId === playbackId) return;
destroyInstantPlayer();
```

`components/BrowsePage.tsx:280-284` passes `undefined` deliberately for paid episodes. A prior prewarm therefore keeps a hidden `<video>` decoding and downloading for its full `TTL_MS = 12_000` while the next player spins up.

### D4-012 — S4 — Layout read/write per scroll frame on the adopted slide

`components/EpisodeFeed.tsx:419-431` — `place()` calls `box.getBoundingClientRect()` and writes four inline styles, registered at `:426` on the feed's `scroll` event. Passive and correctly torn down (`:429-432`), confined to the one adopting slide, but it is the only per-frame layout work on the swipe gesture, and swipe feel is a protected asset.

### D4-013 — S4 — `requestVideoFrameCallback` never cancelled

`components/EpisodeFeed.tsx:553-560` (2 sites) and `components/Player.tsx` (6 sites) call `requestVideoFrameCallback` with no `cancelVideoFrameCallback` anywhere. The callback is dropped when the element is collected and `setState` post-unmount is a no-op in React 19, so no measurable leak — recorded because it is the sole unbalanced async callback in an otherwise complete cleanup path.

### D4-014 — S4 — Third-party stack owns the load tail

`https://www.verzatv.com/?tab=drama`, measured in Chrome:

```
responseStart 63 ms | domInteractive 79 ms | DCL 79 ms | loadEventEnd 4,643 ms
6 cross-origin requests: googletagmanager.com, pagead2.googlesyndication.com,
                         googleads.g.doubleclick.net, ep1.adtrafficquality.google
```

`components/ThirdPartyScripts.tsx:20-33` appends GTM and AdSense in a mount effect; `app/layout.tsx:121,166,167` also mounts `@vercel/analytics` and `@vercel/speed-insights`.

*Handoff to whoever owns security:* `ep1.adtrafficquality.google` appears in no directive of the deployed CSP (which lists googlesyndication, googleadservices, doubleclick and adservice.google.com, but not adtrafficquality.google).

---

## Part 3 — Method notes

- **Fiber-walk instrumentation.** The live hls.js instances are not exposed on any global, so I located them by walking the React fiber tree from `__reactContainer$…` and scanning each fiber's hook chain for a ref whose `.current` has both `.config` and an array `.levels`. This reads the real instance; it does not modify it.
- **Chunk crawl.** Started from the chunk URLs in the deployed HTML for `/` and `/series/the-escort/1`, then followed `static/immutable/chunks/*.js` references transitively (19 chunks, 1.9 MB). Wire sizes were measured with `Accept-Encoding: br`; identity sizes with no encoding header.
- **Negative controls.** The repo was copied to `…/scratchpad/d4/negctl` with `node_modules` and `public` symlinked; baseline `test:feed-integrity` PASS and `audit:perf` 11/0 were established there before any mutation, and the file was restored from a backup after each. The repo itself was never modified.
- **Environmental constraint.** The shared Chrome profile was being driven by other agents in parallel; my tab was navigated away mid-run three times and the renderer timed out twice (`CDP Runtime.evaluate timed out after 45000ms`). Every reported measurement was re-taken on a clean page load after each disruption. Media never decoded in this profile (`readyState` 0, `videoWidth` 0 on every element, with segments downloading normally), so pipeline counts are hls.js MSE pipelines, not hardware decoders.
