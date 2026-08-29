# D1 — STATES: loading, empty, error, skeleton/populated on every route in the manifest. Unit of examination is the **route definition** (65 page routes + 55 API/file routes = 120), which is what generates the manifest's 5,129 route instances (65 static pages + 96 show pages + 4,913 episode routes + 55 API/file routes). Every state claim below was FORCED and observed on https://www.verzatv.com — never reasoned about — using (a) curl against production for server-rendered states, malformed params, and API error/rate-limit states, and (b) a Chrome fetch/XMLHttpRequest interceptor installed on a loaded production page, followed by client-side Next.js `<Link>` navigation so component effects re-ran against forced 500 / network-reject / hang / delay / empty responses and against a blocked stream.mux.com.

**Coverage: 120 of 120 items examined.** 17 findings raised.

## Gaps — items in scope this agent could not examine

Items in D1 scope I could NOT examine, and what each needs:

1. **The episode player's paid-source error state (sourceError + "Try again", EpisodeFeed.tsx:281-305 / :1137-1150).** Unreachable: a paywalled slide never calls /api/playback (verified — the interceptor log was empty on ep 6), so the state only fires for an ENTITLED viewer of a paid episode, and no purchase has ever completed. No live series has freeEpisodes===0, so no episode-1 URL requires authorization either. NEEDS: one real entitlement on a test account, then force /api/playback to 500 while entitled. Reported as D1-002 because "an error state that has never been rendered is unverified".

2. **The populated state of /me/purchases.** Its loading (2-row skeleton), empty (signed-out) and error states were all forced and are correct; the list-with-purchases state cannot exist until a purchase does. NEEDS: the same real entitlement.

3. **The `ready` (form) state of /reset-password, and the server-error copy it carries.** Loading ("Checking your link") and error ("Link expired — Request a new one") were both forced and are honest. The form branch requires a live Supabase recovery session, which requires a real password-reset email. Consequence: I could not confirm whether `?error=weak_password` / `?error=mismatch` from updatePassword actually surfaces to a viewer mid-flow. NEEDS: a genuine recovery link on a test account.

4. **Auth form submission error states on /sign-in, /sign-up, /forgot-password.** I forced the *rendered* error states via the `?error=` parameter (6 codes on sign-in, 2 on sign-up, all honest and XSS-safe) but did NOT submit any form — submitting forms against live production auth is outside what I will do unprompted. NEEDS: an explicit go-ahead plus a throwaway account to confirm the action→redirect→notice round trip end to end.

5. **/admin/dashboard and /admin/review interior states.** Both 307 to `/` for a non-admin (server-side gate in app/admin/layout.tsx via requireAdminPage). I confirmed the redirect leaks no admin data (body is head-only, 0 occurrences of revenue/stats/purchases/creator/email). Their loading/empty/error branches exist in source (components/AdminDashboard.tsx:229-305, components/AdminReview.tsx:453-489) but I could not render them. NEEDS: an admin session. Separately worth a judgement call by someone else: the redirect makes the homepage stand in for a deep link (completeness criterion 3), which is defensible for a security gate but is the pattern the criterion names.

6. **/dev/perf.** 404 on production (notFound() in the page). Its PerfHarness states are unexaminable in the deployed build. NEEDS: a preview deployment or the flag that ungates it — or confirmation that it is meant to be permanently dark, in which case it should leave the route manifest.

7. **Per-instance coverage below the template level.** I examined 65/65 page route definitions and 55/55 API+file route definitions, which is 120/120 route definitions. At the *instance* level the manifest counts 5,129: I probed 65/65 static pages, 55/55 API+file routes, 6/96 show pages (1 live + all 5 coming-soon) and 12/4,913 episode instances (1/1 template: episodes 1, 61, 62, 9999, abc, 0, -1, 1.5, 01, plus 6 on two series). The 4,913 episode routes and 91 live show pages share one template each, so state behaviour generalises — but per-row *data* correctness across all 96 catalog rows is D5's denominator, not something this pass established.

8. **The three-state Reality tab posters.** The REALITY browse tab renders 4 posters of which only 1 (Storage Pirates) is a link; the other 3 are described in project notes as intentionally inert flyers. Whether they *read* as tappable is a D2 interactive-element question, not a route-state one, so I logged the observation and left the call to D2.

9. **iOS/native app states.** Everything here is the web surface at www.verzatv.com. The iOS binary's route-level gates and its WebView behaviour (including the Tubi tab and the content-process-crash path documented in docs/handoff/IOS-CONTENT-PROCESS-CRASH.md, which sits below React and cannot be caught by any boundary) were not exercised. NEEDS: a device or simulator build.

10. **Test-environment caveat.** The Chrome instance was shared with other concurrently running agents; tabs were created, navigated and closed underneath me several times mid-run. Every finding above was re-confirmed after the tab churn, and each carries its own captured JSON, but a clean single-tenant browser would make the run cheaper to repeat.

---

# D1 — STATES. Loading, empty, error and skeleton on every route.

**Target:** https://www.verzatv.com (production, live, real paying customers)
**Denominator:** docs/audit/00-manifest.json — 5,129 route instances, generated by **120 route definitions** (65 page routes + 55 API/file routes).
**Coverage:** **120 / 120 route definitions examined.** At instance level: 65/65 static pages, 55/55 API+file routes, 6/96 show pages, 12/4,913 episode instances (1/1 template).
**Findings:** 17 (2 × S1-class severity, 5 × S2, 8 × S3, 2 × S4).

Everything below was **forced and observed on the deployed site**. Nothing here is reasoned from source alone; where source is cited it is to name the root cause of a behaviour I had already watched happen.

---

## 1. How each state was forced

| State | Method | Routes forced |
|---|---|---|
| **Loading / skeleton** | fetch interceptor with an artificial delay (4–6 s) or a never-resolving promise, then client-side `<Link>` navigation so effects re-ran | 5 |
| **Empty** | signed-out sessions; cleared device localStorage; queries with no matches; `?tab=anime`; merch flag off | 12 |
| **Error** | forced HTTP 500 / 401 / 504 / non-JSON-200 / thrown `TypeError` on `/api/*`; blocked `stream.mux.com` at the XHR+fetch layer; malformed percent-escapes in the URL; rate-limit exhaustion; `?error=` parameters | 20 route-level cases + 55 API routes |
| **Populated** | ordinary navigation | 65 page routes + 55 API routes |
| **404 / not-found** | invalid slugs across 16 route families | 16 |

The interceptor technique matters and is worth recording for whoever repeats this: a full page load wipes any console patch, so patching `window.fetch` and `XMLHttpRequest.prototype.send` on a *loaded* page and then clicking a Next.js `<Link>` is the only way to get a component to mount with a broken backend. Every "forced" claim below used that path.

---

## 2. The structural result

```
find app -name loading.tsx -o -name error.tsx -o -name global-error.tsx
  → app/not-found.tsx
  → app/series/[slug]/[episode]/error.tsx
```

**0 of 65 page routes have a `loading.tsx`. 1 of 65 has an `error.tsx`. There is no `global-error.tsx`.**

The consequence is observable in production. `/genres/%C0%80` and `/guides/%FF` — a mangled percent-escape, which is what a broken link in an SMS or a QR code produces — return **HTTP 500** rendered by Next.js's own default page:

> 500: This page couldn't load · A server error occurred. Reload to try again. · **Reload**

9,368 bytes. Zero occurrences of the site's nav, footer, "Back to Discover", or "Try again". `content-disposition: inline; filename="500"`. Sixty-four of sixty-five routes have this as their entire error story.

That is not, on its own, the worst of it. The worse pattern is that most surfaces **never reach** an error state, because they translate failure into emptiness.

---

## 3. The dominant defect: failure renders as emptiness

Five separate surfaces catch every backend failure and render a state that says *nothing is here*, when the truth is *we could not find out*.

| Route | Forced condition | What the viewer sees | What is true |
|---|---|---|---|
| `/me/list?tab=recent` | `500 /api/watch-progress` | "Nothing watched yet" | history unknown |
| `/me/list` | `500 /api/saved-list`, device mirror cleared | "No saved shows yet" | list unknown |
| `/library` → My List | `500 /api/saved-list` | "No saved shows yet" | list unknown |
| `/me` | `500` × 3 | "0 saved · No history · **No purchases**" | entitlements unknown |
| `/studio`, `/creator` | `500 /api/creator/me` | "**Sign in** to apply, upload, and manage your channel" | viewer is signed in |

Captured verbatim from production for the `/me` case:

```json
{"log":["500 /api/saved-list","500 /api/watch-progress","500 /api/entitlements"],
 "text":"Guest ... LIBRARY My List 0 saved  Continue Watching No history
          Purchase History No purchases ..."}
```

"No purchases" shown to someone who has bought a title is the single most damaging sentence in this list, and `/me` is exactly the page they would open to check.

The counter-example is in the same codebase and is the right pattern: **`/me/purchases` gets all four states right.** Forced `500` and forced network-reject both produce

> Couldn't load your purchases — Something went wrong on our side. Your unlocks are safe — reload the page, and if it keeps happening email support@verzatv.com. · **Contact support**

with a 2-row skeleton while loading and an honest "Sign in to see your purchases" when signed out. `components/PurchaseHistoryList.tsx` models the state as `{kind:'loading'|'empty'|'error'}`. Nothing prevents `AccountLists`, `ProfileDynamic` and `CreatorDashboard` from doing the same.

---

## 4. The player (S1)

This is the finding that matters most, and it is a textbook case of Standing Rule 1 — *verify the effect, never the assignment*.

`components/EpisodeFeed.tsx` carries three watchdogs and a long comment block explaining that twelve testers saw no spinner, no message and no retry, that three of them left at that screen, and that the code now "escalates to the real error screen if the frame never arrives."

**It does not, for the failure mode that a viewer is most likely to hit.**

Forced condition: `stream.mux.com` unreachable — a Mux incident, a school or corporate network block, a captive portal. Free episode 1 of `the-mistress-trap`, entered by client-side navigation from the show page so the block was in place before mount.

```
t=14s  {"blocked":3,"spinners":0,"text":"... Free episode 1 of 5 ... EP 1 / 61"}
t=54s  {"blocked":8,"spinners":0,"text":"... Free episode 1 of 5 ... EP 1 / 61"}
       video: readyState 0, networkState 2, error null
```

Fifty-four seconds. Poster held. No spinner, no message, no retry, and the overlay chrome auto-hides so there is not even a back button on screen. On an episode with no poster asset (observed on ep 4 of the same title) the identical state renders as a **fully black frame**.

### Why all three guards miss it

| Guard | Line | Gate | Why it never arms |
|---|---|---|---|
| Source watchdog (12 s) | `:644-650` | `if (… \|\| hlsUrl \|\| …) return` | a free episode's URL is known from the public map instantly, so `hlsUrl` is truthy from the first render |
| Waiting/stalled watchdog (20 s) | `:667-710` | listens for `waiting` / `stalled` / `error` on `<video>` | with hls.js + MSE no source is ever attached, so the element fires nothing — confirmed `readyState 0`, `error null` |
| Stall watchdog (10 s) | `:730-745` | `if (!sourceReady) return` | `sourceReady` never becomes true |

### And the handler that should have caught it retries forever

```js
// components/EpisodeFeed.tsx:808-815
if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
  if (!refreshProtectedSource()) {
    hls.startLoad();   // no attempt counter, no ceiling
    resume();
  }
}                      // and never calls setSourceError(...)
```

`MEDIA_ERROR` immediately below it is bounded at two recoveries then escalates; `OTHER_ERROR` does a `fullReattach()`. **`NETWORK_ERROR` alone is unbounded and terminally silent.** It is the one a viewer on a bad connection actually gets.

### The compounding fact

The error state that *does* exist — `sourceError` plus a "Try again" button at `:1137-1150` — **has never rendered for any viewer in production.** It is set only in the `.catch` of `getAuthorizedPlayback`, and a paywalled slide never issues that request:

```json
{"url":"/series/the-mistress-trap/6","pbLog":[],
 "text":"... Unlock All Episodes ... $1.99 one-time Series Unlock ... Go Back"}
```

`pbLog` empty — with the interceptor armed to 500 every `/api/playback/` call, none was made. `blocked` is decided client-side from the catalog's `freeEpisodes` before any request (`:262-268`). So the state fires only for an **entitled** viewer of a **paid** episode. No purchase has ever completed on this platform, and no live series has `freeEpisodes === 0`, so no episode-1 URL requires authorization either.

**Net: the player's only error state is unreachable, and the reachable failure has no error state.**

---

## 5. Offline

Verified against the live cache, not the source:

```json
{"swRegistered":1,"scopes":["https://www.verzatv.com/"],
 "cacheKeys":["verza-tv-v1"],
 "entries":[{"cache":"verza-tv-v1","urls":["/"]}],
 "homeCached":true,"deepLinkCached":false}
```

The deployed `sw.js` answers **every** failed navigation with `caches.match("/")`. One entry in the cache. No offline route exists among the 65. An offline viewer tapping an episode, a paywall or their purchase history gets the cached homepage with no indication anything went wrong — precisely "the homepage standing in for a deep link". If the entry is ever missing, `respondWith(undefined)` hands them Chrome's own network-error screen. `CACHE_NAME` has never been bumped past `verza-tv-v1`, so the shell is frozen at whenever it was first installed.

---

## 6. States that are correct

Worth recording, because they are the standard the rest should meet, and because two are on the do-not-regress list.

- **The Anime empty state** — `?tab=anime` renders "Anime is coming soon · We're lining up the first titles for this section. Everything else on VERZA is ready to watch right now. · **Browse Drama**". Intact, and `components/EmptyState.tsx` correctly generalises it.
- **The paywall** — forced on ep 6: big `$1.99`, "one-time" repeated twice, "Secure checkout via Stripe", **Go Back** at equal weight, no countdown, no fake discount, nothing pre-ticked. Intact.
- **`/me/purchases`** — all four states correct (§3).
- **`/sign-in` and `/sign-up`** — `AuthErrorNotice` forced through 6 error codes. Honest copy, a reset link where useful, and an unrecognised value (including `<script>alert(1)</script>`) collapses to the generic line rather than echoing attacker-controlled text.
- **`/reset-password`** — "Checking your link" while verifying; "Link expired — This reset link is invalid or has expired. Request a new one. · **Request a New Link**" for a missing or bad token.
- **`/search`** — the genuine no-match state is honest and links to `/discover`.
- **All 55 API routes.** Unauthenticated GET and malformed POST return correct, non-leaking JSON across the board: 401 `{"error":"Authentication required"}`, 403, 405, 400 `{"error":"Invalid JSON body"}`, 501 `{"error":"Not available"}`, 503, 410, 429 with a retry-after in seconds. `/api/playback/<slug>--<n>` discriminates cleanly: 200 free / 402 paywall / 404 out-of-range / 400 malformed. `/api/og/<unknown>` falls back to the site OG image. Nothing 500s, nothing leaks a stack.
- **Coming-soon routing** — all 5 coming-soon rows: `/series/<slug>` → 200 "Coming Soon", `/series/<slug>/1` → 404. Correct.
- **404 handling** — 16 route families return a real 404 with honest copy.
- **The admin 307** — leaks nothing: body is head-only, 0 occurrences of revenue/stats/purchases/creator/email.

---

## 7. Full route-state matrix

Legend: **F** forced and observed · **✓** present and correct · **✗** missing or dishonest · **n/a** not applicable (static content, no async path) · **–** unreachable

| Route | Loading | Empty | Error | Populated |
|---|---|---|---|---|
| `/` | n/a | **F ✓** (anime) | ✗ | **F ✓** 10 tabs |
| `/series/[slug]/[episode]` | **F ✗** never resolves | n/a | **F ✗** (D1-001) | **F ✓** free + paywall |
| `/series/[slug]` | n/a | **F ✓** coming-soon | ✗ | **F ✓** |
| `/me` | ✗ shows 0 | **F ✓** | **F ✗** (D1-004) | – |
| `/me/list` | **F ✓** 3-row skeleton | **F ✓** | **F ✗** (D1-003) | **F ✓** |
| `/me/purchases` | **F ✓** 2-row skeleton | **F ✓** | **F ✓** | – |
| `/library` | ✗ | **F ✓** | **F ✗** | **F ✓** |
| `/studio`, `/creator` | **F ✓** 11 blocks | **F ✓** | **F ✗** (D1-005) | – |
| `/shorts` | **F ✗** blank SSR | ✗ | ✗ | **F ✓** |
| `/horizontal` | n/a | n/a | ✗ | **F ✓** |
| `/search` | n/a | **F ✓** | n/a | **F ✓** |
| `/discover/[genre]` | n/a | **F ✗** (D1-006) | n/a | **F ✓** |
| `/channels` | n/a | **F ✓** 2 cards | n/a | **F ✓** 4 channels |
| `/sign-in`, `/sign-up` | n/a | n/a | **F ✓** × 8 | **F ✓** |
| `/forgot-password` | n/a | n/a | **F ✗** (D1-010) | **F ✓** |
| `/reset-password` | **F ✓** | n/a | **F ✓** | – |
| `/shop`, `/amazon` | n/a | n/a | ✗ | **F ✓** |
| `/shop/[slug]` | – | – | – | **F** 404 (merch off) |
| `/admin/*` | – | – | – | – 307 |
| `/c/[slug]`, `/watch/[...slug]`, `/[handle]` | – | – | – | – always 404 |
| `/dev/perf` | – | – | – | – 404 |
| 40 static content routes | n/a | n/a | ✗ default 500 | **F ✓** 200 |
| 55 API + file routes | n/a | **F ✓** | **F ✓** incl. 429 | **F ✓** |

---

## 8. Findings by severity

**S1**
- **D1-001** — free-episode player: HLS load failure ⇒ permanent poster/black hold, no error, no retry. Unbounded silent `startLoad()` retry; all three watchdogs mis-gated.

**S2**
- **D1-002** — the player's only error state is unreachable and has never rendered.
- **D1-003** — `/me/list` and `/library` render "nothing saved" on an API error.
- **D1-004** — `/me` tells a paying customer "No purchases" during an outage.
- **D1-005** — `/studio` / `/creator` tell a signed-in creator to sign in.
- **D1-006** — `/discover/<anything>` returns 200 with a fabricated category and "check back soon".
- **D1-007** — offline serves the cached homepage for every deep link; one-entry, never-revalidated cache.

**S3**
- **D1-008** — 0 loading boundaries, 1 error boundary, no global-error; production 500 is Next's unbranded default.
- **D1-009** — no fetch timeouts outside the player; a hung request pins the skeleton forever (observed on `/studio`).
- **D1-010** — `/forgot-password` always claims success and has no error state.
- **D1-011** — shared rate-limit bucket 429s unrelated endpoints, which the list surfaces then render as "empty".
- **D1-012** — `/me` shows an inert "Sign Out" button to guests.
- **D1-013** — `/shorts` has no SSR content and no skeleton; four client components have zero error/empty handling.
- **D1-015** — the 404 page loses the entire nav and footer and carries the homepage title.
- **D1-016** — `/c/*`, `/watch/*`, `/@handle` can only ever render 404.

**S4**
- **D1-014** — `/search?q=<1 char>` falsely reports "0 series found".
- **D1-017** — `/series/<slug>/1.5` and `/01` return 200 duplicates of episode 1.

---

## 9. Inherited facts re-checked (Standing Rule 5)

| Asserted | Verified? |
|---|---|
| "10 browse tabs including Tubi" | **True.** 9 text tabs + a logo-only Tubi tab (`alt="Tubi"`, image loads, 380×150). |
| "Merch shop: 10 products $15–$110" | **Stale.** `/shop` is now the Amazon affiliate surface. Every `/shop/<slug>` 404s (`MERCH_CHECKOUT_ENABLED !== "true"`), and `/api/checkout` returns 503 "Official merchandise checkout is temporarily unavailable." No dead links, because `/shop` no longer links to product pages. |
| "FREE-PREVIEW COUNT = 5 for all series" | **Mostly.** Manifest distribution is `{5: 86, 0: 5, 13: 2, 50: 1, 1: 1, 12: 1}` — the five zeros are the coming-soon rows. |
| Episode `error.tsx` comment: "escalates to the real error screen if the frame never arrives" | **False for the reachable failure mode.** See §4. |
| `/api/creator/channels` populated | **False.** Returns `{"channels":[]}` — no published creator channel exists. |

---

## 10. Recommended order of repair

1. **D1-001.** Bound the `NETWORK_ERROR` retry and call `setSourceError` when the ceiling is hit; arm the source watchdog on *no frame yet* rather than on *no URL yet*. This is the free preview — the first tap of every new viewer, and the funnel into the paywall.
2. **D1-003 / D1-004 / D1-005.** Adopt `PurchaseHistoryList`'s `{loading|empty|error}` shape in `AccountLists`, `ProfileDynamic` and `CreatorDashboard`. Never let a non-ok response become an empty list.
3. **D1-008.** Add a `global-error.tsx` and an `app/error.tsx` in the house voice, with a route home. Sixty-four routes currently have Next's bare default as their entire error story.
4. **D1-007.** Cache a real `/offline` page and serve *that*, not `/`.
5. **D1-006.** `export const dynamicParams = false` on `/discover/[genre]`, or call `notFound()`.
6. **D1-009.** A shared `fetchWithTimeout` for every client call.
7. **D1-010, D1-012, D1-014, D1-015, D1-017.** One-line fixes each.

---

## 11. Method notes for whoever repeats this

- Production only. Nothing was inferred from a local build (Standing Rule 4).
- Nothing outside `docs/audit/` was written or edited. No application code changed.
- No form was submitted, no purchase attempted, no live Stripe / Mux / Supabase / Vercel / App Store state mutated.
- The rate-limit probe (D1-011) exhausted a shared 30/min bucket with malformed POSTs that were rejected before reaching any provider. It self-cleared in ~26 s.
- Two device-local guest toggles (Like, Save on `the-mistress-trap`) were flipped by stray clicks during the swipe experiments. No account state exists for a signed-out viewer, so nothing user-visible was mutated.
- The Chrome instance was shared with other concurrently running agents and tabs were created, navigated and closed underneath this run several times. Every finding was re-confirmed after that churn and each carries its own captured JSON.