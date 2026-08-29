# Phase 1 handoffs

One rule: if two agents need a file, the owning agent makes the change. Everyone
else writes the request here and the owner applies it.

## Ownership

| Area | Owner | Files |
|---|---|---|
| Routing, merchandising | B | `components/BrowsePage.tsx`, `components/SearchButton.tsx` + search result rendering, `lib/series-href.ts` (the routing helpers — **not** `lib/catalog.ts`, which is fingerprinted; see B's note below) |
| Localization, search matching | D | `lib/i18n*`, locale dictionaries, `lib/search-index.ts`, paywall/checkout strings in `components/EpisodeFeed.tsx` |
| Shell, discovery, empty states | E | `components/CategoryTabs.tsx`, empty-state components, `app/**` marketing/footer pages |
| Identity, persistence | F | `lib/storage*`, `app/me/**`, auth routes, list/library pages |

## Contested files

- **`components/BrowsePage.tsx`** — owned by **B**. E needs empty states and the
  category strip container inside it. E writes its requirement below; B applies.
- **`components/EpisodeFeed.tsx`** — shipped in Severity 1. **Nobody edits the
  rail, the observer, the buffer budgets or the entitlement chain.** D may change
  paywall *strings* only. F requests the sign-in state here rather than editing.

## Requests

_(agents append below)_

### B → E: the coming-soon tile treatment (Phase 1, B3)

**Verified state, not a proposal — measured against the tree and production on
2026-08-29.** The five `coming_soon` rows already have a real destination and it
already renders correctly. `components/BrowsePage.tsx` routes them to
`/series/<slug>` (post-fix: the tile ternary is gone and every tile, live or
coming-soon, takes `seriesHref(s)`); that page 200s in production (`dynamicParams` defaults to true;
`getSeriesWithDetail` searches the whole catalog), is `noindex, follow`, prints
"Episodes announced soon", a "Coming Soon" pill instead of the play CTA, no
free-preview badge and no $1.99 card. The comments in `lib/catalog.ts:1193-1196`
and `app/page.tsx:45-46` that say otherwise are false — do not act on them.

So B3 is **not** "give them a destination". The single real defect on that
destination is that `EpisodeDropdown` still renders under the Coming Soon pill.
Production HTML for `/series/the-chairmans-revenge` contains, verbatim:

    <span …>EP <!-- -->1</span><span …>of <!-- -->0</span> … All Episodes

A tappable "All Episodes" button that opens an empty list, on a page that has
just said there are no episodes yet.

**B's chosen treatment, so E can match it:**

1. The tile stays a `<Link href="/series/<slug>">`, keeps the "Soon" badge, keeps
   no play affordance. It is *not* made inert — removing the link is what the
   false comments describe, and the destination is genuinely useful.
2. On `app/series/[slug]/page.tsx`, `EpisodeDropdown` is suppressed when
   `episodes.length === 0`, and the space is filled with the same empty-state
   language E owns for the Anime tab: a short line that says footage has not
   landed yet and nothing is on sale. **E owns the wording and the visual
   pattern.** B will render whatever E's empty-state component/copy exports
   rather than inventing a second style. If E has no component ready, B ships
   plain copy in the page's existing type scale and E replaces it.
3. Nothing about `noindex, follow` changes, and no URL changes.

**Constraint that binds both of us:** the three Reality flyers
(`sugar-babies`, `buy-sell-miami`, `the-vertical-tea`,
`components/BrowsePage.tsx:424-429`) are **not catalog rows**. `/series/<slug>`
for those three returns 404 in production, verified today. They must keep the
existing `<div aria-disabled="true">` treatment at `:876-880`. Do not unify them
with the coming-soon tiles — that is a different case with a different reason.

### B → F: `components/LibraryPage.tsx` links bypass the show page

F owns list/library pages, so B is requesting rather than editing.

`components/LibraryPage.tsx:15`, `:261` and `:274` each hard-code
`href={`/series/${slug}/1`}` and drop the viewer straight into the player.
That is the same defect B is fixing on the browse grid and all three search
surfaces: the 91 show pages carry the synopsis, cast, "First N Episodes FREE"
badge and the $1.99 card, and nothing in the app links to them.

B has added canonical helpers in **`lib/series-href.ts`** — `seriesHref(series|slug)`
for a tile and `episodeHref(series|slug, n)` for a genuine episode link. (They are
not in `lib/catalog.ts`; that file is source-fingerprinted by the playback-security
gate — see B's note further down.) Please replace those three literals with them
rather than with another literal — the whole cause of this bug is that
`/series/<slug>/1` is a repeated string at a dozen independent call sites with no
shared helper, so a second copy of the policy is what put us here.

Two rows to preserve while doing it:
- A **resume** tile that knows a real episode number must keep going to that
  episode (`buildResumeUrl`), not to the show page. Genuine episode URLs landing
  in the player was shipped in Severity 1 and is correct.
- `getSeriesBySlug` at `:7` can return a `coming_soon` row for a saved item.
  `/series/<slug>/1` 404s for those five slugs (verified in production today);
  `/series/<slug>` 200s. The helper handles that; a literal does not.

### B → EVERYONE: `lib/catalog.ts` IS FINGERPRINTED. DO NOT EDIT IT.

**Discovered the hard way on 2026-08-29, verified in both directions.**

`scripts/generate-public-mux-map.mjs` hashes the **raw source text** of
`lib/catalog.ts`:

    sourceHash(mapSource, catalogSource)  // scripts/generate-public-mux-map.mjs:65-72
      createHash("sha256").update("private-map\0").update(mapSource)
                          .update("\0catalog\0").update(catalogSource)

That hash is stamped into the header of the generated `lib/mux-public-map.ts`
("Source fingerprint: 392e751…") and `npm run test:playback-security` fails the
moment it stops matching:

    Playback security contract: FAIL
      - signed map fingerprint must match current complete map plus catalog
      - generated public map must exactly match catalog policy: lib/mux-public-map.ts is stale

**Appending two functions to `lib/catalog.ts` reddened that gate. So would a
one-character comment fix.** Measured: gate PASSes with `lib/catalog.ts` at
HEAD, FAILs with the helpers appended, PASSes again after `git checkout`.

Regenerating is not a local fix. `mux:public:generate` rewrites the public map,
but `lib/mux-signed-map.ts` is regenerated by `migrate-mux-signed-playback.mjs`
against live Mux with credentials, and AGENTS.md rule 12 requires the web and
native projections stay byte-identical — so `../verza-native` has to move in the
same change.

**Consequence for this sprint: put derived logic in its own module.** B's routing
helpers therefore live in `lib/series-href.ts`, not in `lib/catalog.ts`, and
`lib/catalog.ts` is byte-identical to HEAD in B's diff. Do the same.

**Cost B had to accept:** the six false comments Phase 0 catalogued (§2.6) could
only be corrected in the four files that are NOT fingerprinted —
`app/page.tsx:45`, `app/discover/page.tsx:27` and `:64`,
`app/discover/[genre]/page.tsx:194`, all now corrected. **The two in
`lib/catalog.ts:1187-1196` still stand and are still false:**

- "no page is built and **no URL resolves**" — the URL resolves 200.
- "BrowsePage renders them as inert tiles: **no `<Link>`**, nothing to tap" —
  they are real `<Link>`s to `/series/<slug>` and always were, since `67fe50c`.
- "These **six**" — there are five.

Acting on that comment ships five live 404s on Bollywood and Español. The true
statement now lives in `lib/series-href.ts`, which every routing call site
imports, and `npm run test:feed-integrity` fails if anyone acts on the false one.

### B: WHAT SHIPPED (Phase 1, B1-B4) — for anyone whose lane touches these files

**Every in-app link to a title now opens its show page.** One helper,
`seriesHref()` in `lib/series-href.ts`, is the single decision. Changed:
`components/BrowsePage.tsx` (grid tile, hero, Reality, Red Carpet, Music),
`components/SearchButton.tsx`, `components/SearchBar.tsx`, `app/search/page.tsx`,
`app/genres/[slug]/page.tsx`, plus the three dead-but-latent surfaces
`components/SeriesCard.tsx`, `components/HeroCarousel.tsx`,
`components/FeedSearch.tsx`.

Measured on a local render, before → after, home page real DOM:
**25 `/series/<slug>/1` links and 0 show-page links → 0 and 25.** Bollywood tab,
read from the live DOM: all 10 tiles (6 sellable + 4 coming-soon) → `/series/<slug>`.

**Two behaviours deliberately preserved — do not "fix" them:**
1. **Continue Watching** (`BrowsePage.tsx:601`) still goes to
   `buildResumeUrl(...)`, i.e. a real episode with a resume offset.
2. **A genuine episode URL still lands in the player at that episode, and an
   unentitled viewer still meets the paywall there.** Verified:
   `/series/reset/8` renders the feed at EP 8 with the $1.99 / one-time / Stripe /
   Go Back paywall intact.

**The prewarm moved with the navigation, and this is the part that is easy to
break.** `posterClick` in `BrowsePage.tsx` appends a hidden `<video>` and starts
downloading, on the assumption the next page is `EpisodeFeed`, which adopts it.
Nothing on the show page adopts it. So `posterClick` is now attached to exactly
one link — Continue Watching — and the show page's play CTA carries the prewarm
instead, via the new `components/PlayNowLink.tsx`. Measured: a tile tap now
appends 0 videos and seeds no `verza-transition`; the show page's
"Watch Episode 1 Free" appends the 2px muted `preload="auto"` element and seeds
the poster synchronously, as the poster tap used to. **If you add a link to a
show page, do not give it `posterClick`** — `test:feed-integrity` fails if you do.

**B3 as shipped:** the coming-soon tile stays a `<Link>` to `/series/<slug>`,
keeps its "Soon" badge and its no-play-affordance treatment. On the show page,
`EpisodeDropdown` is suppressed when `episodes.length === 0` and replaced with
the Anime empty state pattern (E's card, glyph, two-line shape and gradient
escape hatch). Verified on the rendered page: `EP 1 of 0` and the empty
"All Episodes" control are gone; `noindex, follow`, the canonical, the
"Coming Soon" pill and "Episodes announced soon" are unchanged; still no price
and no free-preview badge.

**B4:** SEO surface re-derived after the change and diffed against the
before-state: 96 rows / 91 live / 5 coming-soon, **91 show pages, 2,214
prerendered episode pages, 4,913 total episodes**, and the sorted show-param,
episode-param and canonical lists all hash identically before and after. No URL
moved; this sprint only added inbound internal links to pages that already exist.
Four new checks in `test:feed-integrity` now fail if any of those numbers move.

**Test-file warning, and it is live right now for everyone:** five checks in
`scripts/test-feed-integrity.mjs` sat **below** the reporter block, after
`process.exit(1)`, and could not fail the gate. Proven: breaking one of them
there printed `PASS` and exited 0; the same break above the reporter printed
`FAIL` and exited 1. They have been moved up. **Append new checks above the
reporter, never after it.**

---

## F: THE GUEST STORAGE CONTRACT (published before building against it)

**`lib/guest-storage.ts` is the one place the app remembers a signed-out
viewer.** The rail will consume it for resume and C will consume it for
entitlement state in Phase 2. It is dependency-free — no React, no catalog, no
`fetch` — so it can be imported from anywhere, including a Node test.

```ts
interface GuestProgressRow {
  seriesSlug: string;      // /^[a-z0-9-]+$/, <= 100 chars
  episodeNumber: number;   // integer 1..999
  progressSeconds: number; // 0..36000
  completed: boolean;
  updatedAt: number;       // epoch ms; decides who wins local vs server
}

// Watch progress
readGuestProgress(): GuestProgressRow[]              // newest first, validated, capped
saveGuestProgress({slug, episode, seconds, completed?}): GuestProgressRow[]  // upserts, returns rows AS WRITTEN
readGuestResume(slug): GuestProgressRow | null       // newest incomplete row with position > 2

// Saved list  (the EXISTING `verza-saved` key, unchanged on disk)
readSavedSlugs(): string[]
writeSavedSlugs(slugs): string[]
setSavedSlug(slug, saved): string[]
isSavedSlug(slug): boolean

// Migration into an account
readGuestSnapshot(): { progress, saved }
guestSnapshotDigest(snapshot?): string
guestStateNeedsMigration(): boolean
markGuestStateMigrated(): void
clearGuestState(): void            // account deletion
```

Four properties every consumer may rely on, each enforced by a
negative-controlled check in `scripts/test-feed-integrity.mjs` §10:

1. **Every function is safe on the server and in a private window.** `localStorage`
   is resolved at call time inside try/catch; a missing or throwing store yields
   the empty answer, never an exception. This code runs inside the player's
   `timeupdate` handler — a throw there stops playback.
2. **Rows are validated on the way OUT, not only in.** `localStorage` is
   attacker-writable; the bounds are the same ones
   `app/api/watch-progress/route.ts:27-51` enforces, so nothing that would fail
   the server can reach the rail or a POST body.
3. **The store is bounded (`MAX_PROGRESS_ROWS = 40`) and upserts on
   `(slug, episode)`.** The ten-second heartbeat runs for the length of a binge;
   appending would fill a ~5 MB quota shared with the cart, the language, the
   unlock hints and the analytics id, after which every write in the app throws.
4. **It is never an authority for access.** It holds a playhead and a bookmark.
   `AGENTS.md` rule 4 and cross-lane invariant 6 still bind: `verza-unlock:<slug>`
   is not managed here and stays a hint that is always re-verified server-side.

**Two derived modules sit on top and are the intended entry points:**

- `lib/watch-progress-client.ts` — `recordWatchProgress(input, {keepalive?})`.
  Device write first (synchronous, so it survives a tab being killed), then the
  POST. **Both players must call this; a raw `POST /api/watch-progress` now fails
  the gate**, because that route 401s for a guest and five hand-rolled copies of
  it all shared that one fault.
- `lib/continue-watching.ts` — `mergeContinueWatching(serverItems)` owns the
  precedence: **the account wins whenever it returns anything; an empty array is
  the GUEST case, not an authoritative empty account.** `continueWatchingFromRows()`
  reuses the server's own filters (live series only, incomplete only, episode
  within `episodeCount`, cap 20) so the guest rail and the signed-in rail cannot
  drift and re-introduce the 404 tile.

**Migration:** `components/GuestStateSync.tsx` (mounted in `app/layout.tsx`)
watches the pathname — `signInAction` ends in `redirect()`, which the App Router
serves as a client-side navigation, so the root layout never remounts and a
mount-only effect would never see the new session. It makes **zero network
requests** unless `guestStateNeedsMigration()` is true. `POST /api/account/sync`
merges **newer-wins per progress row** and **union for the saved list** — it
never rolls back an account that moved on elsewhere, and it touches
`watch_progress` and `saved_list` only, never entitlements or purchases.

---

## F → B: the sign-in ask at the end of the free preview (rail is closed to me)

**I did not edit `components/EpisodeFeed.tsx`'s paywall region.** This is the
request, with the exact contract, so whoever owns that file next can land it in
one edit.

**The defect:** the app never asks for an account, at any point. The end of the
free preview is the one moment a viewer has demonstrated intent and has
something to lose, and it is the moment the app is silent. Everything needed to
make the ask honest now exists: the guest's progress is really on the device,
and signing in really does move it to the account.

**Where:** the `showUnlock` overlay, in the block that already renders
`{!iosApp && (...)}` beneath the benefit lines and above the $1.99 card. Not a
new overlay, not a new step — one line inside the one the viewer is already
looking at.

**Exact contract:**

```tsx
// Only when there is something to lose, and only when they are not signed in.
// hasGuestState is a cheap synchronous localStorage read; signedIn comes from
// GET /api/account/sync, which returns { signedIn } and nothing else.
import { guestStateNeedsMigration } from "@/lib/guest-storage";

{!iosApp && !signedIn && hasGuestState && (
  <a href={`/sign-in?next=${encodeURIComponent(location.pathname + location.search)}`}>
    Save your progress — sign in
  </a>
)}
```

Three constraints that bind it:

1. **It must not become a second paywall.** The $1.99 card, the "one-time", the
   named Stripe and the equal-weight Go Back are what testers named as working.
   The ask is a text link below them, never a button competing with them, and it
   is never pre-ticked or pre-selected.
2. **`next=` must carry the current episode URL**, so signing in returns the
   viewer to the exact slide rather than to `/`.
3. **iOS:** it carries no price and no purchase path, so it is safe under
   `AGENTS.md` rule 11 — but it sits inside the existing `!iosApp` block anyway,
   because the surrounding copy there is about buying.

If the rail owner prefers, the same ask reads equally well one slide earlier, on
the last free episode. I have no opinion on which; both are inside the region I
must not edit.

---

## F → D: `test:feed-integrity` is red right now, and it is not mine

`scripts/test-feed-integrity.mjs:586` asserts the literal
``All ${totalEpisodes} episodes, instantly`` is present in `EpisodeFeed`. The
localization pass replaced it with `t("paywall.benefitEpisodes", { count: totalEpisodes })`,
which is the right change and preserves the property the check exists to
protect — the benefit line still reads `totalEpisodes`, not `episodes.length`.
The check now greps for a string that no longer exists.

**The check is B's (rail merchandising), the string is D's.** It needs updating
to assert the property rather than the wording, e.g. that
`paywall.benefitEpisodes` is called with `totalEpisodes` and never with
`episodes.length`. I did not touch it: rewriting another lane's barrier to make
my own run green is exactly how a barrier stops being one.

Everything else is green: `audit:perf` 11/11, `audit` 0 problems,
`test:payments` all suites, `test:playback-security` PASS, `tsc --noEmit` clean.

---

## F: WHAT SHIPPED, and three inherited facts that were wrong

**Corrections first, because they were in my brief and they were stale:**

1. **"ADD PASSWORD RESET" — the route already existed.** `app/forgot-password/`,
   `app/reset-password/` (+ its client), `requestPasswordReset` and
   `updatePassword` in `app/actions/auth.ts`, and the branded Resend recovery
   email are all built and deployed, with uniform anti-enumeration responses and
   an `after()` timing guard. **The only thing missing was a link.** Repo-wide,
   `forgot-password` appeared in exactly three places, none of them a link a
   viewer could reach. Added to `/sign-in` and to `/me`.
2. **"the bookmark … nothing ever appears" — partly stale.** The optimistic
   state, the `verza-saved` write and the toast were already there. What was
   actually broken: every side effect lived inside the `setIsSaved` updater
   (React invokes updaters more than once); the response was discarded, so a
   failed write still said "Saved to My List"; and mount read only
   `localStorage`, so signing in on a second device showed an empty bookmark for
   an already-saved title and the next tap sent a `DELETE`.
3. **"LIBRARY is a channel directory whose list is always empty" — measured
   false.** `getChannels()` returns two names: `VERZA Originals` (89 live
   titles) and `The Carpet` (2: `exes-premiere`, `love-awards`). The directory
   is not empty. What was true: `CHANNEL_META` listed `StorageBlue` and
   `The Vertical Tea`, which are **not channel values on any catalogue row**, so
   they rendered as permanently empty cards; and it was **missing `The Carpet`**,
   the one real second channel, which therefore rendered with an empty `<svg>`
   and no description. Both halves fixed.

**Shipped:**

- **Guest persistence.** `lib/guest-storage.ts` + `lib/watch-progress-client.ts`.
  All five progress write sites (EpisodeFeed heartbeat / completion / pagehide
  flush, Player heartbeat / flush) now record on the device first. A guest who
  watches four free episodes and closes the tab keeps them.
- **The Continue Watching rail works signed out.** `BrowsePage`'s fetch merges
  through `mergeContinueWatching`. Same row shape, same filters as the API.
- **`Player` resumes a guest** from the device when the account has nothing.
- **The bookmark confirms and reverts.** 401 is treated as success (the device
  write *is* the guest's save); any other failure reverts the icon, the device
  and the toast.
- **Migration on sign-in.** `POST /api/account/sync`, newer-wins per row, union
  for the list, entitlements untouched.
- **Three shells wired.** `/me`'s "My List" → `/me/list` (was `/library`, which
  opens on Channels), "Continue Watching" → `/me/list?tab=recent` (was `/`),
  "Purchase History" → the new `/me/purchases` (was `/me`, its own URL, with the
  literal `detail="No purchases"`). `/me/list` itself rendered two hard-coded
  `<EmptyState>` calls for every viewer, forever; both tabs now read real data.
- **One implementation of each list.** `components/AccountLists.tsx`. The saved
  list previously had three surfaces, one of which worked.
- **`GET /api/entitlements` has a client caller at last** — it had zero
  (Phase 0 §8 row 11). No price is rendered on `/me/purchases`, so it is safe on
  iOS without `<HideInIOSApp>`, which matters because that wrapper would blank
  the page for the iOS customers most likely to ask "what did I buy".
- **Auth failures are visible.** Both `/sign-in` and `/sign-up` declared
  `error?: string` in their searchParams type and neither ever read it, so every
  wrong password was a silent form reset. `components/AuthErrorNotice.tsx` maps
  known causes to our own copy and **never echoes the raw parameter** — it is a
  query string, so a crafted link could otherwise print any sentence, such as a
  fake support number, on our own sign-in page in our own type.
- **`components/LibraryPage.tsx` no longer bypasses the show page** (B's request):
  the three `/series/<slug>/1` literals are gone, its `EXEMPT` entry in
  `test:feed-integrity` deleted with them — the stale-exemption check is what
  forced that, exactly as designed.
- **Account deletion now clears the device too**, so the button's own promise to
  remove "watch history" is true.

- **All account empty states are E's `components/EmptyState`** (the Anime card,
  lifted verbatim), not a fourth near-copy of it: the saved list, recently
  watched, all three purchase-history states, and a channel with no live titles.
  A new check fails if any of those three files stops importing it.

**17 new checks in `scripts/test-feed-integrity.mjs` §10, above the reporter.**
All 29 negative controls verified: break the fix → the *named* check fails →
restore → the gate returns to baseline. Two of them are EXECUTED rather than
grepped — `recordWatchProgress()` is run with a failing `fetch` and a fake
`Storage` to prove the playhead is on the device before the network is even
attempted, because "the shared recorder is called" and "the playhead is saved"
are different claims and only the second one is the fix.

**A warning for anyone doing the same thing.** My first negative-control harness
restored whole-file snapshots. Another lane edited `EpisodeFeed.tsx` mid-run and
the snapshot restore would have clobbered it. My second harness inverted its
edits by replacing the empty string — and `String.replace("")` matches at index
0, so every deletion reappeared at the TOP of the file, including two lines
injected into the IntersectionObserver callback. Both were caught and fully
repaired (verified against `git show HEAD` for the observer, and by `tsc`), but
in a tree six agents are editing at once: **never restore a whole file you did
not exclusively author, never invert an edit with an empty replacement, and
assert the file is byte-identical after each case or abort.**

### E: WHAT SHIPPED (Phase 1, E1–E3)

Files E touched, all of them either E's by the ownership table or claimed below:
`components/CategoryTabs.tsx`, `components/EmptyState.tsx` (new),
`components/StoreLinks.tsx` (new), `lib/app-store.ts` (new),
`components/TubiHeroCarousel.tsx` (claim below), `components/Footer.tsx`,
`app/about/page.tsx`, `app/press/page.tsx`, and checks appended **above** the
reporter in `scripts/test-feed-integrity.mjs`.
**`components/BrowsePage.tsx` is byte-identical to what B left.** Everything E
needs in it is a request below.

**E1 — the category strip.** Measured on a local render before the change:
rail `clientWidth 394`, `scrollWidth 1000`, `scrollLeft 0`, so "Español" spanned
1007→1090px against a right edge at 1073 — the tester's "ESPAÑ". Six of ten
categories were entirely off screen with nothing indicating the row moves.
Shipped: direction-aware edge fades painted in the sticky bar's own colour and
derived from `scrollWidth - clientWidth` and `scrollLeft`, plus an **All** pill
outside the scroller that opens a portalled sheet listing every category.
Measured after, at 320/375/390/430/768/1024: the All pill is fully inside the bar
and never overlaps the rail at any of them; at `scrollLeft 0` the left fade is 0
and the right fade 1; at max scroll the right fade is **0** and the last label
("Music") is fully visible. Picking Bollywood from the sheet switches the tab and
renders all ten Bollywood tiles; Escape, the backdrop and the close button all
dismiss it and focus returns to the pill.

**Why a sheet and not just a fade** — the brief asked for an alternative if an
affordance alone could not carry nine categories. It cannot: at 320px the rail is
241px and holds three items, one of which is the Tubi logo. A fade says the row
moves; it cannot say that Bollywood is over there, which is the exact conclusion
one tester drew. The sheet costs ~63px of strip (one label) and makes every
category reachable in one tap at every width.

**One inherited defect fixed on the way:** the active-tab centring used
`behavior: "auto"` for the reduced-motion branch. `app/globals.css` sets
`scroll-behavior: smooth` on the document and `"auto"` means *defer to the CSS
value*, so that branch animated exactly like the other one. It is `"instant"`
now. Verified in the browser: `rail.scrollLeft = 120` did not land for hundreds
of ms under the inherited behaviour; `scrollTo({behavior:"instant"})` lands
immediately.

**E3 — the store links, and where the URLs came from.** Neither is a guess.
`lib/apple-iap-verification.ts:17` exports `APPLE_APP_ID = 6752884623` and hands
it to Apple's `SignedDataVerifier` as the production `appAppleId`; readback
2026-08-29, `https://apps.apple.com/app/id6752884623` → 301 →
`/us/app/verza-tv-vertical-drama/id6752884623`, 200,
`<title>Verza TV: Vertical Drama App - App Store</title>`. `:16` exports
`APPLE_BUNDLE_ID = "com.verzatv.app"`, and
`https://play.google.com/store/apps/details?id=com.verzatv.app` returns 200 with
`itemprop="name" → VerzaTV`. **So there is no gap: both listings are live and
both are now linked.** `lib/app-store.ts` holds them with that provenance, a
feed-integrity check fails if either drifts from the id the backend verifies
against, and the Apple URL deliberately omits `/us/` so Apple can redirect each
viewer to their own storefront. Rendered by `components/StoreLinks.tsx` in the
footer (every page, which is how `/terms`, `/privacy` and `/refund-policy` get
the link **without anyone editing a legal page**), plus `/about` under its
"Available on iOS, Android, and Web." line and `/press` under the Platforms row.
Wrapped in `HideInIOSApp`: not a purchase surface, so rule 11 does not bite, but
there is no reason to advertise app stores inside the app.

### E: CLAIM — `components/TubiHeroCarousel.tsx`

Not in the ownership table and not in Phase 0's lane map. E has taken it as
shell, because the defect is a shell defect and the fix is entirely inside the
component: **the six carousel banners are Tubi's own title cards with Tubi's
yellow play button rendered into the artwork, and the component contained no
anchor at all.** Six large, obvious play affordances did nothing; verified in the
browser before the change (`carouselIsLink: false`, the only link in the whole
panel being the CTA to `tubitv.com/`).

Shipped, and **the call site in `BrowsePage.tsx` did not have to change** — the
new `href` prop defaults to the same `https://tubitv.com/` the CTA already uses:
- every slide is a real `<a target="_blank" rel="noopener noreferrer sponsored">`;
- a corner chip reads **"Opens Tubi ↗"**, `pointer-events: none`, because the
  artwork promises playback in place and it does not deliver that;
- a drag guard, without which every swipe of the carousel would end in a click
  and navigate off the site. Measured with dispatched touch events: an 80px drag
  and a 20px smear both suppress the click; a 0px and a 5px touch both navigate.

**If a verified per-title Tubi URL ever exists, pass `href` per slide.** Do not
hand-write one. `https://tubitv.com/search/<title>` does return 200 (checked), so
it is available as a better destination than the catalogue root, but a link to
the wrong film is worse than a link to the catalogue, and nothing in this repo
establishes which titles the current art depicts beyond reading the images.

### E → B: three changes in `components/BrowsePage.tsx`

E owns the empty-state pattern; it now exists as `components/EmptyState.tsx`,
lifted verbatim from B's own Anime placeholder (same slate `rgba(12,12,20,0.82)`,
same 44px circle, same clock, same gradient pill). It is deliberately **not**
`"use client"`, so it works from BrowsePage (client, `onClick`) and from the
coming-soon show page (server, `href`). Props:
`title`, `body`, `action?: {label, href} | {label, onClick}`, `className`,
`constrain`, `glyph`.

**B1. The Anime placeholder → the component.** Replace lines `695-731` (the
`gridItems.length === 0 && !CUSTOM_SECTION_TABS.has(activeTab)` block) with:

```tsx
      {gridItems.length === 0 && !CUSTOM_SECTION_TABS.has(activeTab) && (
        <EmptyState
          className="px-6 pt-10 pb-16"
          title={`${activeTabLabel} is coming soon`}
          body={
            <>
              We&rsquo;re lining up the first titles for this section. Everything else on
              VERZA is ready to watch right now.
            </>
          }
          action={{ label: "Browse Drama", onClick: () => selectTab("drama") }}
        />
      )}
```

Renders identically to today — this is a de-duplication, not a redesign. The
feed-integrity check `shell: components/BrowsePage.tsx has grown a second
empty-state style` accepts either the inline card **or** `<EmptyState`, so it
will not fire on this refactor.

**B2. Music — the worst offender.** Verified in the browser on 2026-08-29: the
Music tab renders one poster and then the footer. Nothing else. The tester's
report of "one storage-company advert" is substantively right and worth
recording precisely — there is no ad ribbon on this tab (that one is gated to
drama/new/popular at `:1064`); the single poster *is* StorageBlue-branded key
art ("FREE PICKUP! WE BEAT ANY PRICE", StorageBlue logo). So the only thing on
the tab reads as an advert, with no title, no context and no indication that the
section has one title rather than a broken grid.

The poster is a real link and stays exactly as it is — **do not touch the art.**
Add underneath it, inside the `activeTab === "music"` block (currently opening
at `:664`), immediately after the closing `</div>` of the poster wrapper:

```tsx
          <EmptyState
            className="px-6 pt-6 pb-10"
            title="One title so far"
            body={
              <>
                Music is a new section and this is everything in it right now. More is
                being cut; the rest of VERZA is ready to watch today.
              </>
            }
            action={{ label: "Browse Drama", onClick: () => selectTab("drama") }}
          />
```

**B3. Reality — three tiles that are tappable-looking and inert.** Verified:
`sugar-babies`, `buy-sell-miami` and `the-vertical-tea` render as
`<div aria-disabled="true">` at `:902` and are **visually identical** to the one
tile that works — same poster treatment, same title, same "Reality" sub-label,
no badge, no dimming, nothing. A tester tapped one twice thinking the app had
frozen. E is **not** asking you to link them: B's constraint stands, those three
are not catalog rows and `/series/<slug>` 404s for them. The fix is to make the
tile look like what it is.

At `:872` `playable` is already computed. Change the non-playable branch at
`:901-904` to:

```tsx
                  ) : (
                    /* Not a catalog row — /series/<slug> 404s for these three, so
                       the tile must never become a Link. It must also never look
                       like the one beside it that is: identical treatment on an
                       inert tile is what made a tester tap twice and conclude the
                       app had frozen. */
                    <div key={show.title} className="block min-w-0" aria-disabled="true" style={{ opacity: 0.72 }}>
                      <div className="relative">
                        {card}
                        <div
                          className="absolute z-10 rounded font-bold uppercase tracking-wider top-1.5 left-1.5 px-1.5 py-0.5 text-[8px]"
                          style={{ background: BADGE_STYLE.soon.bg, color: "#F5F4F8", border: "1px solid rgba(255,255,255,0.28)" }}
                        >
                          {BADGE_STYLE.soon.label}
                        </div>
                      </div>
                    </div>
                  );
```

That reuses the existing `soon` badge palette and label rather than introducing
a second vocabulary for "not yet". The hero slideshow above the grid also cycles
these three posters and is not tappable either; if you want a second pass, the
same badge on the hero would close that too.

**B4 (optional, cosmetic).** `app/series/[slug]/page.tsx`'s hand-rolled
coming-soon card can now become
`<EmptyState className="px-4 mt-4 mb-8" constrain={false} title="Episodes are on the way" body={…} action={{ label: "Browse VERZA", href: "/" }} />`
and render the same pixels. Not urgent — B's version already matches.

### E → whoever holds `components/EpisodeFeed.tsx` right now: a committed check is red

`npm run test:feed-integrity` currently fails on
`rail: series length is being read from the bounded rail`. **This is not E's and
not B's.** The check is committed at HEAD and passes against HEAD's
`components/EpisodeFeed.tsx`, which contains `` `All ${totalEpisodes} episodes, instantly` ``
at `:2401`. The working-tree copy of that file (227 lines changed, uncommitted)
no longer contains that string anywhere, so the paywall's headline benefit is
either reworded or gone. Whoever is rewriting those strings needs to keep
`totalEpisodes` in them, or move the check. A second unrelated failure,
`i18n: the page injects a translate engine the CSP blocks`, is also live in the
tree and belongs to D.

### E → D: three new untranslated strings

`components/CategoryTabs.tsx` now renders `All`, `Browse all categories` and
`Close`; `components/StoreLinks.tsx` renders `Get the app`, `App Store`,
`Google Play`, `iPhone & iPad`, `Android`; `components/TubiHeroCarousel.tsx`
renders `Opens Tubi ↗`. E deliberately did **not** add keys to `lib/i18n.ts` —
that file is D's, and a sixteen-locale dictionary edit from another lane is a
guaranteed conflict. They read as plain English today, consistent with
"Continue Watching" and the rest of the browse chrome. Add keys when convenient;
the store labels and the Tubi chip are arguably proper nouns and may be better
left alone.

### D: WHAT SHIPPED (Phase 1, D1–D3) — localization

**D1. The paywall no longer speaks English on a Spanish show.**
Every string in the unlock overlay and the checkout it starts goes through
`t()`. 26 new keys, authored in all 20 locales (`lib/i18n.ts` now holds 114
keys × 20). Observed on a running server, not inferred:

| locale | rendered payment screen |
|---|---|
| es | "Desbloquea todos los episodios / … / **1,99 US$** desbloqueo de la serie, **pago único** / Desbloquear la serie — 1,99 US$, pago único / **Pago seguro con Stripe** / Volver" |
| hi | "सभी एपिसोड अनलॉक करें / … / $1.99 एकबारगी सीरीज़ अनलॉक / **Stripe** के ज़रिए सुरक्षित भुगतान / वापस जाएं" |
| en | byte-identical to what shipped: "Unlock All Episodes … $1.99 one-time Series Unlock … Series Unlock — $1.99 one-time … Secure checkout via Stripe … Go Back" |

The four properties testers named as working are preserved in all 20: the price
is still the biggest thing on the screen, "one-time" survives translation,
Stripe is still named, and Go Back still carries equal weight. A feed-integrity
check fails if any locale drops `{price}`, `{title}`, `{count}` or the word
"Stripe".

**Price formatting.** `lib/price.ts` is the client-safe canonical price.
`SERIES_UNLOCK_PRICE_CENTS` itself lives in `lib/series-purchase.ts`, which is
`import "server-only"` — which is *why* every price the viewer saw was a
literal `"$1.99"` with no link to what Stripe charges. `test:feed-integrity`
now fails if the two numbers diverge, and if the currency stops being USD. The
currency charged is unchanged: `Intl` changes how 199 USD is *written*
("$1.99" in English, "1,99 US$" in Spanish — which also stops a LATAM viewer
reading a bare "$" as pesos), never what the card is debited.

**`app/api/unlock/route.ts` gained a machine `code` on every error return.**
Additive only — every status code, every fail-closed branch and every English
`error` string is byte-for-byte what it was; `npm run test:payments` and
`test:playback-security` both still pass. The paywall maps each code to a
translated message and falls back to the server's English text for a code it
does not know, because losing "an earlier payment is still being reviewed,
contact support" would send a customer round a loop that cannot succeed. If you
add a failure to that route, add its code to `CHECKOUT_ERROR_KEYS` in
`components/EpisodeFeed.tsx` — the gate fails otherwise.

**Locale detection.** `LangProvider` started at "en" and hydrated only from
`localStorage`, so `Accept-Language: es-ES` got English — and on the episode
route there is no way to fix that, because `app/globals.css` hides the header
(and the language switcher with it) under `.episode-immersive`. It now falls
back to `navigator.languages`, matching on the primary subtag so es-419 and
es-MX both resolve to es. Deliberately client-side: reading a cookie or header
on the server would drop the 91 show pages and 2,214 prerendered episode pages
out of static rendering.

**D2. Search is accent-insensitive, on both sides.**
Neither side was folded before — `toLowerCase()` is case folding and does not
touch combining marks — so the failure ran in both directions. Measured on the
dev server after the fix (production values from Phase 0 in brackets):

    /search?q=pasion   → sentence-of-passion-es   [was 0 results]
    /search?q=pasión   → sentence-of-passion-es   [1]
    /search?q=espanol  → all 5 Spanish rows       [5]
    /search?q=español  → all 5 Spanish rows       [was 0]
    /search?q=cuñado   → the presidential-brother-in-law row

**Correction to the Phase 0 diagnosis, §7.1.** It prescribes
`.normalize("NFD").replace(/\p{Diacritic}/gu, "")`. **Do not use that.**
Measured: `\p{Diacritic}` matches the Devanagari virama (U+094D), so it rewrites
Hindi rather than normalising it — "हिन्दी" becomes "हिनदी", "दोस्ती" becomes
"दोसती". The Bollywood tab is six live Hindi titles. `lib/text-fold.ts` folds
the Latin combining range U+0300–U+036F only, which covers every Spanish,
Portuguese, French, German, Turkish and Polish accent and leaves Devanagari,
Arabic, Thai, Han, Kana and Hangul byte-identical. There is a check that fails
if anyone "fixes" it back to `\p{Diacritic}`.

All four catalogue matchers now share `seriesMatchesQuery`: `lib/search-index.ts`
(header popover + `/search`), `components/SearchBar.tsx` (`/discover` — it had a
weaker private predicate returning a different set for the same string),
`components/FeedSearch.tsx` (dead but latent). `components/CreatorsLanding.tsx`
searches channels rather than Series, so it folds with `foldText` directly.
`s.slug` is now in the haystack — the eleven Spanish and Hindi rows ship with no
curated SEARCH_TAGS at all, so title/genre/logline was their entire index.

**D3. Language labelling.**
`lib/audio-language.ts` is the declared source of truth, derived from the
category because `lib/catalog.ts` is source-fingerprinted and cannot carry the
field (B's note below). 80 live English, 5 live Spanish, 6 live Hindi
(+ English burned-in subtitles), 4 Hindi and 1 Spanish coming-soon — coming-soon
rows claim no subtitle track, because they have no footage to carry one.
Observed rendering:

- show page: "Hindi audio · English subtitles" (en UI) / "Audio en hindi ·
  subtítulos en inglés" (es UI), on all 96 rows including the English ones
- browse tiles: a "HINDI" / "ESPAÑOL" chip on the 10 Bollywood and 6 Español
  tiles; **zero** chips on the Drama grid — 79 "English" chips over poster art
  is a worse trade than the information is worth
- JSON-LD: `inLanguage` on TVSeries (91 show pages) and on TVEpisode plus its
  VideoObject (2,214 prerendered episode pages). There was none anywhere before.

Language variants stay separate rows. `AudioLanguageBadge` is a label with no
`href`, no `onClick` and no router — a gate fails if it grows one.

**D3, the part that is NOT fixed, and cannot be fixed from this repository.**
"Stream files label their audio track as undefined" is real and I have the
manifest. `GET https://stream.mux.com/1en6bVzn1IAnYjCOwgQDjUXuLkaoVVVc0202JLo5J7lw4.m3u8`
(falling-for-flatmate E1, public/free), read on 2026-08-29:

    #EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="audio-hi-0",NAME="Default",CHANNELS="2",
                 AUTOSELECT=YES,DEFAULT=YES,LANGUAGE="und",URI="…"

`LANGUAGE="und"` is ISO-639-2 for *undetermined*. It is a property of the Mux
asset, set at ingest, and correcting it means re-ingesting with an input
`language_code` — Mux write credentials, which are deliberately absent, and
AGENTS.md forbids mutating live Mux state to make an audit pass. The one place
in this repo that creates assets is `lib/mux-upload.ts:47` (`new_asset_settings`,
creator direct uploads, currently 503 because the webhook secret is absent), and
it sets no input language. **I did not change it**: I cannot verify a Mux API
parameter without credentials, and setting an unverified value is exactly the
"a value being set is not an effect happening" failure this phase is trying to
stop. Whoever holds the Mux token should (a) add the input language to that call
and (b) decide whether the 4,913 existing assets are worth re-ingesting. Until
then, `inLanguage` in the JSON-LD is the only machine-readable statement of
audio language anywhere in the delivery chain.

**`components/ContentTranslator.tsx` no longer injects Google Translate.**
Phase 0 §6.4 derived that the engine is CSP-blocked; confirmed at the network
level — `translate.google.com/translate_a/element.js` returns 200 and its body
references `translate.googleapis.com`, which appears nowhere in `next.config.ts`.
So every language change paid for a blocked script, two cookie writes and, in
one branch, a `window.location.reload()`. I did **not** add the host to the CSP:
the engine would then also run over the paywall that was just correctly
translated, it rewrites text nodes underneath React, and it is 277KB on the
critical path of an app whose speed testers named as working. The component now
only keeps `<html lang>` in step. A gate fails if the injection returns without
the CSP host.

**I edited three files this lane does not own. All three are additive.**
- `components/BrowsePage.tsx` (B) — two imports, one `const`, one guarded
  `<AudioLanguageBadge compact />` inside the poster box. No existing line
  changed; no href, badge, ordering or pagination touched.
- `app/series/[slug]/page.tsx` (B) — two imports and one `<div>` between the
  genre row and the logline.
- `scripts/test-feed-integrity.mjs` — one pre-existing check needed updating,
  not weakening: it asserted the literal `` `All ${totalEpisodes} episodes,
  instantly` ``, which is now `t("paywall.benefitEpisodes", { count:
  totalEpisodes })`. The defect it guards is unchanged — the argument must be
  `totalEpisodes`, never `episodes.length` — and it was negative-controlled with
  `episodes.length` before and after.

Ownership rule respected in substance: B's report reads as finished and there is
no in-repo route from `lib/audio-language.ts` to a rendered tile without editing
one of B's files. If B objects to the placement, the chip and the badge are one
component and can be moved without touching anything else.

**The i18n audit, in full, and what remains English.**
Live translated surfaces went from 5 to 9: `BottomNav`, `CategoryTabs`,
`LangDropdown`, `LanguagePicker`, `LibraryPage` (existing) plus the
`EpisodeFeed` paywall/checkout, `ShortsFeed`'s action rail, `HorizontalFeed`,
and `AudioLanguageBadge`. `ShortsFeed` and `HorizontalFeed` were rendering
English from keys (`shorts.*`, `horizontal.*`) that had been translated into 20
languages and never once rendered.

Still English, and why — this is the honest remainder, not a claim of completion:

| Surface | Owner | Why not fixed here |
|---|---|---|
| `/sign-in`, `/sign-up`, `/forgot-password`, `/reset-password` | F | F's lane. The `auth.*` keys already exist in all 20 locales and are still unused — wiring them is a small copy-only change for whoever owns those routes. |
| `/me`, `/me/list`, `/me/purchases` | F | F's lane; F is actively editing them. |
| `app/series/[slug]` body copy and its $1.99 card | B | Server Component. `t()` is a client context and cannot be called there; reading a locale cookie on the server would cost 91 pages their SSG. Needs the same leaf-client-component treatment `AudioLanguageBadge` uses. |
| `/terms`, `/privacy`, `/refund-policy`, legal | — | `legal.*` keys exist and are unused. Legal copy is on the do-not-touch list and translating a contract is a legal decision, not a copy decision. Flagging, not doing. |
| `/shop`, `/shop/[slug]`, `CartDrawer`, `AmazonBag`, `/amazon` | — | Commerce surfaces, out of this brief's scope. |
| all SEO landing families (`/best`, `/collections`, `/compare`, `/guides`, `/watch-in`, `/genre`, `/genres`, `/channels`, `/c`) | E | Server Components and E's lane. |
| home page / browse grid body copy | B | B's file. |

The structural blocker is unchanged and needs a product decision, not a patch:
`t()` is a client context, `AGENTS.md` rule 13 prefers Server Components, and
the locale lives in `localStorage`, which the server cannot read. A cookie would
let Server Components translate — and would take every one of the 2,305
prerendered pages dynamic. Until someone chooses, translated copy on a static
page has to come from a leaf client component.
