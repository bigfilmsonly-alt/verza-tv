# S6 — My List / Library / Profile / Account: /me, /me/list (both tabs), /me/purchases, /library, /sign-in, /sign-up, /forgot-password, /reset-password; the 13 account/auth/entitlement/subscription API routes behind them; the 68 manifest-tracked interactive elements in those 19 UI files; and the guest-persistence + account-migration layer (lib/guest-storage.ts, lib/continue-watching.ts, lib/watch-progress-client.ts, components/GuestStateSync.tsx).

**Coverage: 185 of 185 items examined.** 19 findings raised.

## Gaps — items in scope this agent could not examine

Everything in scope was examined; what I could not EXERCISE is the signed-in half of the surface, and one thing I could not confirm at all.

1. UNVERIFIABLE WITHOUT A SESSION (7 of 13 API routes, all 12 inputs, and every populated signed-in state). I have no test account, and creating one or typing a password into a live login form is outside what I may do. Not exercised: POST/DELETE /api/saved-list, POST /api/watch-progress, GET /api/entitlements (200 path), /api/entitlements/check (purchased path), POST /api/account/sync (the merge itself), POST /api/account/delete, POST /api/billing-portal, POST /api/subscribe/confirm. Each was read line by line and its unauthenticated behaviour confirmed live (401 or 200-empty, with `private, no-store` + `Vary: Authorization, Cookie` on every one). What this needs: one throwaway account with one $1.99 entitlement, then re-run the account-page, purchase-history, saved-list and sync paths.

2. THE SERVER-ONLY `SUPABASE_URL` VALUE (blocks the exact blast radius of S6-001). `vercel env ls production` shows two separate variables: NEXT_PUBLIC_SUPABASE_URL (52d, proven = the NXDOMAIN host) used by every auth client, and a distinct SUPABASE_URL (47d) used only by getServiceClient() (lib/supabase/server.ts:5). I did not read either value - `env pull` would have written production secrets to disk. If SUPABASE_URL points somewhere live, service-role reads still work and only authentication is dead; if it is the same host, the whole database is unreachable. A/B latency probes were inconclusive: /api/auth/callback?code=xxx (forces exchangeCodeForSession) and /api/creator/channels?z=rand (forces a service-client query) were both indistinguishable from their no-network controls (~0.22s vs ~0.27s), which is weak evidence that neither call reaches a real host, but is not proof. What this needs: read the two values in the Vercel dashboard - 30 seconds, and it is the most urgent item on this list.

3. OAUTH PROVIDER ENABLEMENT. Whether Google and Apple are actually enabled on the Supabase project is unknown, because /auth/v1/settings cannot be reached (the host is NXDOMAIN). Independently of S6-001, note that components/OAuthButtons.tsx:66-68 swallows every signInWithOAuth error into console.error, so if a provider is disabled the buttons are silently inert. What this needs: the Supabase Auth > Providers page.

4. 320px LAYOUT. The Chrome window is shared with other agents in this run and kept being resized back; my measurements ran at an innerWidth of 606, not 320. At 606 there was no horizontal overflow anywhere in scope and one sub-44px tap target (S6-018). The account pages are single-column `max-w-lg mx-auto px-4`, so 320px is very likely fine, but I did not observe it. What this needs: a dedicated window at 320x740.

5. EMAIL DELIVERABILITY. The two mailto: targets on /me (feedback@verzatv.com, support@verzatv.com) and the reset/welcome/verification sends in lib/email.ts were read, not sent. All 28 in-scope internal link targets were fetched live and every one returned 200.

6. TEST STATE I CREATED AND REMOVED. To exercise guest persistence on the live domain I wrote one localStorage key (verza.guest.progress.v1) in one browser tab, confirmed the rails rendered, then removed it and restored verza-saved to its prior value ["tied-by-fate"]; the tab is closed. No server state was written anywhere in this audit.

---

# S6 — My List / Library / Profile / Account

**Coverage: 185 of 185 items in scope examined. 19 findings — 2×S1, 3×S2, 8×S3, 6×S4.**

| Class | In scope | Examined | How |
|---|---|---|---|
| Page routes | 8 | 8 | fetched live from www.verzatv.com + read |
| API routes | 13 | 13 | read in full; 6 exercised live (unauthenticated only) |
| Interactive elements (manifest-tracked) | 68 | 68 | read at `file:line`; 28 unique link targets resolved live |
| Catalog rows resolved through the account lists | 96 | 96 | resolved offline against the real catalog, spot-fetched live |
| **Total** | **185** | **185** | |

Scope files: `app/me/page.tsx`, `app/me/list/page.tsx`, `app/me/purchases/page.tsx`, `app/library/page.tsx`, `app/sign-in/page.tsx`, `app/sign-up/page.tsx`, `app/forgot-password/page.tsx`, `app/reset-password/{page.tsx,ResetPasswordClient.tsx}`, `components/{AccountLists,ProfileDynamic,PurchaseHistoryList,LibraryPage,VipCard,VipCheckoutRecovery,OAuthButtons,AuthErrorNotice,GuestStateSync,BottomNav}.tsx`, `lib/{guest-storage,continue-watching,watch-progress-client,auth,checkout-auth,resume,series-href,vip-server,vip-release-policy,private-json}.ts`, `app/actions/auth.ts`, `middleware.ts`, and the 13 API routes named below.

Manifest note: the manifest counts 68 interactive elements across these files, but it counts shared components by definition site, not by usage — `/me`'s ten `MenuRow` links appear as two entries. The rendered element count on `/me` is higher; I enumerated the live DOM as well as the source.

---

## The headline

**The Supabase host that the live site authenticates against does not exist.**

`https://www.verzatv.com/_next/static/immutable/chunks/0fkfn44ctjja6.js` — served right now — contains:

```
createBrowserSupabase",0,function(){return(0,t.createBrowserClient)(
  "https://mmvbmrrwgludfmfalfcm.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1tdmJtcnJ3Z2x1ZGZtZmFsZmNt...
```

That hostname is **NXDOMAIN**:

| Resolver | `mmvbmrrwgludfmfalfcm.supabase.co` | control `jejispfvlkwastzvwtwu.supabase.co` |
|---|---|---|
| local `nslookup` | `NXDOMAIN` | `104.18.38.10`, `172.64.149.246` |
| `nslookup @8.8.8.8` | `NXDOMAIN` | A records returned |
| `dns.google/resolve` (from the browser) | `{"Status":3}` | `{"Status":0, Answer:[...]}` |
| `curl` | exit 6, couldn't resolve | HTTP 404 (reachable) |
| `fetch()` from a page on verzatv.com | `TypeError: Failed to fetch` — identical to an invented ref | HTTP 401 (reachable) |

Re-checked ten minutes apart, and `api.stripe.com` returned 401 inside the same `fetch` call, so this is not a network artefact on my side.

The server uses the same variable. `lib/supabase/middleware.ts:6` builds `createServerSupabase()` from `process.env.NEXT_PUBLIC_SUPABASE_URL`, and that is what `getUser()`'s cookie path (`lib/auth.ts:24-25`), `signInAction`, `signUpAction`, `updatePassword` and `/api/auth/callback` all run through. `npx vercel env ls production` reports `NEXT_PUBLIC_SUPABASE_URL` **created 52d ago** and unchanged since — the current build inlined its value, so the runtime value is the same NXDOMAIN host.

What that means, path by path:

- **Sign in / sign up** — `signInWithPassword` and `signUp` cannot reach an auth server.
- **Continue with Google / Continue with Apple** — `signInWithOAuth` navigates to `https://<dead host>/auth/v1/authorize?...`, i.e. a browser DNS error page.
- **Password reset completion** — `/reset-password` is built entirely on client-side `verifyOtp` (`ResetPasswordClient.tsx:85`). It can only ever render "This reset link is invalid or has expired."
- **Every session validation** — `supabase.auth.getUser()` makes a network call; on failure `lib/auth.ts:28-31` catches and returns `null`. Every signed-in customer therefore reads as *signed out* on the server: `/api/access` answers `{full:false}`, entitlements return 401, Purchase History shows the signed-out state.
- **Revenue** — the $1.99 Series Unlock requires an authenticated user (`app/api/unlock/route.ts:93-95`), so no unlock can be started.

Two caveats I am not glossing over. (a) I did not read the value of the *separate*, server-only `SUPABASE_URL` variable (47d old) that `getServiceClient()` uses — see gap 2. (b) The most likely cause of an NXDOMAIN Supabase ref is a **paused or deleted project**, which is recoverable from the dashboard. Neither caveat changes the client-side conclusion, which is proven.

**Verification, 30 seconds:** open the Vercel project's Production environment variables and compare `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_URL` against the Supabase dashboard's current project ref.

---

## Findings

### S6-001 — S1 — Supabase auth host is NXDOMAIN (money + access)
Detail above. Files: deployed chunk `0fkfn44ctjja6.js`; `lib/supabase/client.ts:4-8`; `lib/supabase/middleware.ts:6-7`; `lib/auth.ts:24-31`; `components/OAuthButtons.tsx:62`; `app/reset-password/ResetPasswordClient.tsx:85`; `app/actions/auth.ts:22,52,154`; `app/api/auth/callback/route.ts:16`; `app/api/unlock/route.ts:93-95`.

### S6-002 — S1 — No rate limit on any auth server action
`middleware.ts:176` matches `/api/:path*`. Sign-in, sign-up and password reset are React **server actions posted to the page routes** `/sign-in`, `/sign-up`, `/forgot-password`, so they never enter the matcher. Verified live: `/sign-in` returns no `x-ratelimit-*` headers; `/api/entitlements` returns `x-ratelimit-limit: 30`.

Two consequences:
1. **Unbounded credential attempts.** `middleware.ts:36-37` labels `/^\/api\/auth\//` (limit 10) as "Auth routes — brute-force protection", but the only route under that prefix is the OAuth callback. Because `signInWithPassword` runs server-side, Supabase's own per-IP limits see the Vercel egress IP, not the attacker's — so they cannot isolate an attacker and would throttle legitimate users first.
2. **Unbounded outbound email.** `app/actions/auth.ts:105-131` schedules `generateLink` + `sendPasswordResetEmail` inside `after()` for any submitted address, with no throttle, no captcha, no per-address cooldown. An unauthenticated caller can drive reset emails at a chosen victim and burn the Resend quota.

I did not exercise either path — probing them means submitting credentials or sending real email.

### S6-003 — S2 — Sign-out leaves the account's data on the device, and it migrates into the next account
`components/ProfileDynamic.tsx:195-228`: `SignOutButton` clears `localStorage` only inside its **catch** block. On the success path nothing is cleared. `lib/guest-storage.ts:328` `clearGuestState()` has exactly one caller in the whole repo — account deletion (`ProfileDynamic.tsx:145`).

Exercised against the real modules with a fake `Storage`:

```
SHARED DEVICE: {"afterA":false,
  "survives":{"saved":["the-mistress-trap"],"progress":1},
  "needsAfterNewActivity":true,
  "payloadWouldPostToB":{"progress":[2 rows],"saved":["the-mistress-trap"]}}
```

User A's saved slug and playhead survive sign-out. The digest at `guest-storage.ts:278-299` is keyed only on the snapshot, not on an account, so the moment any new activity changes it, `GuestStateSync` POSTs A's rows to whoever signs in next, and `app/api/account/sync/route.ts:219-248` unions them into that account. Before that, S6-011's empty-means-ignore rule already shows A's list to the next guest.

### S6-004 — S2 — /me tells a signed-out viewer "No purchases"
`components/ProfileDynamic.tsx:64-81`: `fetch('/api/entitlements').then(r => r.ok ? r.json() : null).then(d => setCount(d?.entitlements?.length ?? 0))`. A 401 becomes `null`, becomes `0`, becomes the words "No purchases". Confirmed live — `/api/entitlements` returns `401 {"error":"Authentication required"}` and the guest `/me` renders `Purchase History / No purchases`.

The sibling component gets this right (`PurchaseHistoryList.tsx:67-70` has a `signed-out` state saying "Sign in to see your purchases"), and the comment at `ProfileDynamic.tsx:59-63` says the bug being fixed was telling a customer with 86 unlocks that they had none. Half the fix landed.

### S6-005 — S2 — Reflected attacker text on /reset-password
`ResetPasswordClient.tsx:23-28` ends `return code; // Supabase surfaced a real message — show it as-is.` and renders it at `:195-202`. For a signed-in viewer, `getSession()` succeeds → `status: 'ready'` → any `?error=<sentence>` is printed in Verza's own red alert panel above the password form. React escapes it, so this is content injection, not XSS. `components/AuthErrorNotice.tsx:16-21` refuses this exact pattern and explains why ("a fake support phone number, say"). Two components, opposite policies, same threat.

### S6-006 — S3 — "Sign Out" shown to guests
`app/me/page.tsx:425` renders `<SignOutButton />` unconditionally; line 426 renders `<DeleteAccountButton>`, which correctly self-hides for a guest. `user` is already in scope at line 236. Confirmed live: the page header says "Guest — Sign in to sync your library and purchases" and the footer offers "Sign Out".

### S6-007 — S3 — Orphan "SUBSCRIPTION" heading on /me
Deployed HTML: `...>Subscription</p><p ...>Library</p>` with nothing between. The RSC payload in the same document carries `{"isVip":false,...,"checkoutEnabled":false,"yearlyCheckoutEnabled":false}`, and `VipCard.tsx:122` returns `null` for exactly that combination. `app/me/page.tsx:291` prints the label outside the condition.

### S6-008 — S3 — /library invents two channels
`components/LibraryPage.tsx:80` unions `getChannels()` with `Object.keys(CHANNEL_META)`, and `CHANNEL_META` still holds `StorageBlue` (:65) and `The Vertical Tea` (:70). Against the real catalog, `getChannels()` returns exactly `["VERZA Originals","The Carpet"]` (94 rows and 2 rows respectively; no other `channel:` value exists). Live page text from `/library`: **"StorageBlue is coming soon"** and **"The Vertical Tea is coming soon"**. StorageBlue is the sponsor and Storage Pirates is live and playable, so the card tells viewers a live show is unreleased. The file's own comment at :39-53 already establishes both are not channel values — the empty state was made prettier instead of removed.

### S6-009 — S3 — Server Continue Watching can link to a 404
`app/api/watch-progress/route.ts:98-110` drops rows for missing or non-live series but never clamps `episode_number` to the current `episodeCount`. `lib/continue-watching.ts:52` has the missing half and names the reason. `components/AccountLists.tsx:255` links through `buildResumeUrl` (`lib/resume.ts:30-33`), which has no 404 guard, unlike `lib/series-href.ts:80-87`. Verified end to end: the client rail dropped an out-of-range row (0 rows) while `buildResumeUrl` produced `/series/the-mistress-trap/66?t=10`, and **`https://www.verzatv.com/series/the-mistress-trap/66` returns 404** (that title has 61 episodes; `/61` returns 200). `episodeCount` is auto-normalised from `MUX_MAP` length, so it shrinks on a re-cut.

### S6-010 — S3 — No self-service purchase recovery on the web
`POST /api/entitlements/claim` → `410 {"error":"Automatic purchase recovery is unavailable; contact support"}`. `pending_entitlements` (migration 006) has **zero readers and zero writers** in `app/` or `lib/`. Neither `signInAction` (`app/actions/auth.ts:28-30`) nor the OAuth callback (`route.ts:22-23`) claims anything, deliberately. The only remedy offered anywhere is the sentence at `app/me/purchases/page.tsx:42-46`. Mitigating: unlock purchases are auth-bound at creation (`app/api/unlock/route.ts:93-95`, `:197 client_reference_id: user.id`), so orphans should not arise — but there is no in-product route back if one does, and no "Restore Purchases" control on the web surface at all.

### S6-011 — S3 — Empty account list is treated as silence
`AccountLists.tsx:111-120` — `if (data?.items && data.items.length > 0) {...} else fallbackToDevice()`. The same rule repeats in `ProfileDynamic.tsx:24`, `EpisodeFeed.tsx:1948`, `ShortsFeed.tsx:202`. An account that has genuinely saved nothing is indistinguishable from a request that failed, so removals made on another device reappear from the local mirror. `lib/continue-watching.ts:85` states the intended rule — "the server is the authority whenever it has anything to say" — and an empty list *is* something to say.

### S6-012 — S3 — Password change with no re-authentication
`ResetPasswordClient.tsx:114-119`: with no token in the URL, any existing session is accepted as a recovery session. `app/actions/auth.ts:136-162`: `updatePassword` requires only the cookie session, enforces a 6-character minimum, and asks for no current password. A stolen session becomes permanent account takeover.

### S6-013 — S3 — The account surface is unlocalised, and 320 translated cells go unused
`t()` call counts in scope: `/me` 1, `/me/list` 0, `/me/purchases` 0, `/sign-in` 0, `/sign-up` 0, `/forgot-password` 0, `/reset-password` 0, `ProfileDynamic` 0, `PurchaseHistoryList` 0, `AuthErrorNotice` 0, `OAuthButtons` 0. Six distinct keys are used anywhere in S6. Meanwhile `lib/i18n.ts` carries 16 `profile.*` keys — `myList`, `continueWatching`, `purchaseHistory`, `signIn`, `signOut`, `guest`, `signInPrompt`, `language`, `notifications`, `darkMode`, `helpFaq`, `sendFeedback`, `reportProblem`, `coinBalance`, `coins`, `buyCoins` — each defined 21 times (20 locales + the type), referenced by nothing. That is **320 i18n cells shipped and never rendered**, while `app/me/page.tsx:366` puts the 20-locale `LanguagePicker` in the same card as the hard-coded English "Dark Mode" row. The 6 keys that *are* used were verified complete across all 20 locales.

### S6-014 — S4 — Inconsistent robots directives on account pages
`/me` and `/me/list` → `index, follow`. `/me/purchases` → `noindex, nofollow` (`app/me/purchases/page.tsx:9-11`, with the note "Nothing here is for a crawler"). Transport is safe on all three (`cache-control: private, no-cache, no-store`, `x-vercel-cache: MISS` on the two dynamic ones), so this is hygiene, not a leak.

### S6-015 — S4 — Saved counter and saved list can disagree
`ProfileDynamic.tsx:18` counts `readSavedSlugs().length`; `AccountLists.tsx:76-91` drops slugs with no catalog row. Verified: `readSavedSlugs()` on `["not-a-real-show","the-mistress-trap"]` returns both, so `/me` reads "2 saved" while `/me/list` renders one row.

### S6-016 — S4 — The remove button is labelled "Saved"
`AccountLists.tsx:183-193`: `onClick={() => handleRemove(...)}` with children `{t("shorts.saved")}` and `aria-label="Remove … from saved list"`. Confirmed live — the only button in the section reads "Saved". Screen-reader users get the verb; sighted users get a state word.

### S6-017 — S4 — Guest sync prompt drops the active tab
`app/me/list/page.tsx:138` hard-codes `/sign-in?next=%2Fme%2Flist` in a block that renders on both tabs, so signing in from Recently Watched returns you to Saved Shows.

### S6-018 — S4 — No route to sign-up from /me, and a 36px Sign In pill
`app/me/page.tsx:257-265` renders a single Link to `/sign-in`, measured live at 86×36 px (every other control in scope is ≥44). The full set of `<main>` hrefs on `/me` — `/`, `/forgot-password`, `/help`, `/me/list`, `/me/list?tab=recent`, `/me/purchases`, `/privacy`, `/refund-policy`, `/sign-in`, `/studio`, `/terms`, `mailto:feedback@`, `mailto:support@` — contains no `/sign-up`.

### S6-019 — S4 — Two inherited facts are wrong
- `MEMORY.md` names `jejispfvlkwastzvwtwu.supabase.co`. `supabase/migrations/008_reconcile_live_schema.sql:3` says "New project **mmvbmrrwgludfmfalfcm** is a fresh/empty start". The old project still resolves and answers, so anyone acting on the memory file would point work at the retired database.
- `docs/audit/00-manifest.md` states "Catalog — 96 rows: **1 live**, **0 coming soon**". Loading `lib/catalog.ts` directly gives `rows=96 live=91 coming_soon=5`. Since the manifest is the shared denominator, this is worth fixing before other agents cite it.

---

## What I verified working (do not regress)

- **Guest My List and Continue Watching genuinely work on production.** Seeded one real playhead in a live browser: `/me/list` rendered "Tied By Fate · Supernatural romance · 50 episodes" linking to `/series/tied-by-fate/1`, and `?tab=recent` rendered "EP 4 of 50" linking to `/series/tied-by-fate/4?t=42`. `/me` counted "1 saved / 1 in progress". The whole `guest-storage → continue-watching → account/sync` chain is real, not a shell.
- **Every one of the 96 catalog rows routes correctly from the account lists.** All 91 live rows resolve through `posterHref` to `/series/<slug>/1`; all 5 coming-soon rows have `episodeCount 0` and resolve to `/series/<slug>`. Spot-checked live: `/series/the-chairmans-revenge` → 200, `/series/the-chairmans-revenge/1` → 404.
- **All 28 in-scope internal link targets return 200.** No 404s, no redirect chains, no homepage standing in for a deep link.
- **All four states exist on the account routes.** `/me/purchases` has an honest loading skeleton, a signed-out state, an error state and an empty state, all built on the shared `EmptyState` — the Anime-tab card — rather than a fourth private copy. The loading skeleton is present in the server HTML, not only after hydration (I checked, having first wrongly assumed otherwise).
- **Account API hygiene is uniform.** Every account route answers with `cache-control: private, no-store, max-age=0` and `Vary: Authorization, Cookie` via `lib/private-json.ts`. `/me` and `/me/list` are dynamic and private (`x-vercel-cache: MISS`).
- **`/api/account/sync` is well built.** It validates every incoming row against the real catalog, refuses non-live slugs, clamps future timestamps against clock skew, merges newer-wins per row rather than blind-upserting, and unions the saved list instead of replacing it. It touches only `watch_progress` and `saved_list`.
- **Account deletion is thorough** — two-tap confirmation with a 6s disarm, hidden from guests, an `expectedUserId` guard against an A→B session swap, Stripe sessions expired and subscriptions cancelled before the auth user is deleted, purchase metadata redacted, and the deletion guard cleared on failure. `entitlements` is not in the explicit table list but cascades correctly via `profiles → auth.users` (`001_schema.sql:30-36`).
- **Coins are properly fail-closed** — `/api/coins/balance` and `/api/coins/purchase` both return 501, and no wallet or credit balance is rendered anywhere in the account UI.
- **Anti-enumeration on password reset is correct** — a uniform redirect with link generation deferred to `after()`, closing the timing channel (`app/actions/auth.ts:100-133`).
- **Open-redirect guards are consistent** — `next` is validated as `startsWith("/") && !startsWith("//")` in `signInAction`, `signUpAction`, `updatePassword`, `requireCheckoutUser` and `/api/auth/callback`.
- Nothing in this report touches instant play from a poster tap, the paywall's honesty, the episode picker, swipe feel, poster art, the legal pages, the Anime empty state, speed, or "THE MICRODRAMA APP".

---

## Method notes

- Modules were **run, not read**, wherever possible: `lib/catalog.ts`, `lib/guest-storage.ts`, `lib/continue-watching.ts`, `lib/series-href.ts` and `lib/resume.ts` were transpiled and executed against the real catalog with a fake `Storage`, using the same `loadTypeScriptModule` technique as `scripts/test-feed-integrity.mjs`. Guest persistence, the shared-device migration, the progress cap (40) and the out-of-range clamp were all asserted on observed output, not on the presence of an assignment.
- Everything user-visible was confirmed **in the deployed bundle**, fetched from `www.verzatv.com` — page HTML, the RSC payload, the JS chunk, response headers, and the live DOM through a browser tab.
- The DNS conclusion rests on **four independent observations plus a positive control**, because a single failing lookup would have been worth nothing.
- I wrote no application code and edited no file in the repository. The one piece of state I created — a single `localStorage` key in one browser tab — was removed and the prior value restored.