# D3 — Dead Ends. All 535 interactive elements in docs/audit/00-manifest.json (interactive.items) plus all 74 catalogued external URLs (externalLinks) = 609 items. Every link crawled against the live production domain https://www.verzatv.com rather than read from source; every handler resolved to its target function and its effect observed in the browser or in the deployed JS bundle.

**Coverage: 487 of 609 items examined.** 18 findings raised.

## Gaps — items in scope this agent could not examine

103 of the 535 interactive elements and 19 of the 74 external URLs could not be examined. Every one is named below with what it needs.

BEHIND AN ACCOUNT I DO NOT HAVE (103 elements). I refused to enter a password or create an account, so nothing past a login was exercised.
- components/CreatorDashboard.tsx (35) — channel editor, upload, publish toggle, aspect picker, pricing picker. Needs a signed-in creator account. /studio and /creator both render only "Creator Studio / Sign in to apply" for a guest.
- components/creator/ApplicationWizard.tsx (26) and components/creator/ui.tsx (11) — the 5-step creator application. Reached only from inside CreatorDashboard.
- components/AdminReview.tsx (17) and components/AdminDashboard.tsx (2) — /admin/review and /admin/dashboard both 307 to / for an unauthenticated visitor (correct gating). Needs an admin role.
- components/VipCard.tsx (9) — subscribe monthly, subscribe yearly, billing portal, 3 legal links. Verified it does NOT render for a guest (app/me/page.tsx guard `if (!isVip && (iosApp || !checkoutEnabled)) return null`), and /api/payments/capabilities returns 401 to a guest, so I could not establish whether checkoutEnabled is true in production. AGENTS.md rule 2 says both VIP plans are disabled/fail-closed; that is unconfirmed here. Needs an account plus a capabilities readback. Note the standing open item that VipCard carries a Stripe TEST portal URL — I could not reach the code path to confirm or clear it.
- components/ProfileDynamic.tsx (2 of 4) — DeleteAccountButton and its handler. Correctly returns null for a guest, so it needs a real account, and exercising it would delete that account.
- components/PurchaseHistoryList.tsx (1) — the purchased-title row link. Needs a completed purchase; nobody has ever completed one on this platform.

DELIBERATELY NOT EXERCISED (counted as examined, flagged here for honesty)
- The $1.99 Series Unlock button: I tapped it as a guest and followed it to /sign-in?next=..., which is the whole guest path. I did not create a Stripe Checkout Session, because that mutates live Stripe state (AGENTS.md working agreements).
- "Continue with Google" / "Continue with Apple": tapped, and the destination observed. I did not proceed past the provider handoff.
- Email/password sign-in and sign-up forms: rendered, error states confirmed via ?error=, but not submitted — submitting means entering a password.
- PushNotificationToggle: verified wired rather than clicked, to avoid leaving a notification permission grant on the machine. The VAPID public key is inlined in the deployed chunk 0fkfn44ctjja6.js and both subscribe and unsubscribe call /api/push/subscribe, so it is not inert.
- app/series/[slug]/[episode]/error.tsx (3) — the error boundary's Retry/Back. Counted as examined by source only; I could not force a render-time throw on production without breaking something.

EXTERNAL URLS NOT CRAWLED (19 of 74)
- 19 template literals of the form https://image.mux.com/${...} and https://stream.mux.com/${...} that only appear on admin, creator-dashboard or /dev/perf surfaces I could not reach. Their two hosts were both verified serving with real resolved playback IDs (200, correct content types), so the host is not in doubt — only these specific query shapes are unverified.

SERVER-SIDE SUPABASE HEALTH (bears directly on D3-001)
- I proved the browser-side Supabase host is NXDOMAIN. I could not establish whether the server's own SUPABASE_URL is healthy, because every guest-reachable API route short-circuits before touching the database (/api/watch-progress and /api/saved-list return {"items":[]}, /api/access returns {"full":false}, /api/entitlements and /api/payments/capabilities return 401). Confirming it needs either an authenticated request or a Vercel env readback.

DENOMINATOR CORRECTION WORTH CARRYING FORWARD
- docs/audit/00-manifest.json reports catalog.live = 1 and catalog.comingSoon = 0 in its summary block while catalog.detail correctly holds 91 live and 5 coming-soon. The summary integers are wrong; the detail array is right, and it is what I audited against.
- One entry in my own first-pass BFS, /watch-in/series/a-love-once-betrayed (404), proved unreproducible: a targeted re-scan of all 485 live pages found the string on zero of them, and a scan for relative hrefs across all 485 found zero. It was a crawler artifact and is NOT reported as a finding.

---

# D3 — Dead Ends

**Target:** https://www.verzatv.com (live production)
**Denominator:** 535 interactive elements + 74 external URLs = **609 items**
**Examined:** **487 of 609** (432 of 535 interactive, 55 of 74 external)
**Findings:** 18 (1 S1, 2 S2, 7 S3, 8 S4)

Every link in this report was fetched from the live domain. Every handler was resolved to its target function and its effect observed in a browser or in the JavaScript actually served by www.verzatv.com — never in a local build.

---

## 1. Verdict counts

### 1.1 Interactive elements (535)

| Verdict | Count |
|---|---:|
| Exercised on production; effect observed | 315 |
| Unreachable — orphan component, never imported, absent from the deployed bundle | 62 |
| Unreachable — feature flag off or route 404s in production | 28 |
| Reachable only by typing the URL (page linked from nowhere) | 14 |
| Unreachable — route 404s because its data set is empty | 13 |
| **Examined (verdict reached)** | **432** |
| Not examined — behind an account or admin login | 103 |
| **Total** | **535** |

**Inert taps found: 4 poster surfaces on the Reality tab, 1 search input on the Creators tab, and (intermittently) the 2 OAuth buttons.** Everything else that renders does something observable.

### 1.2 External URLs (74)

| Verdict | Count |
|---|---:|
| Crawled directly, landed where claimed | 40 |
| Crawled directly, **did not** land where claimed | 3 |
| Template literal resolved to a real instance and crawled | 8 |
| Not a link at all (placeholder / validation text) — manifest over-count | 4 |
| **Examined** | **55** |
| Not examined — templates on admin/creator surfaces | 19 |

The three that do not land where they claim: `https://www.youtube.com/@VerzaTV` (404, user-facing, D3-002), and `test-streams.mux.dev/bbb-360` + `test-streams.mux.dev/elephants_dream` (404, dev-only, D3-018). `litix.io` is a fourth failure but is a preconnect hint rather than a link (D3-016).

### 1.3 Route crawl (supporting evidence)

1,502 route fetches plus a 489-URL breadth-first crawl of the whole site.

| Set | Count | Result |
|---|---:|---|
| Internal links harvested from 49 live pages | 319 | 319 × 200, no redirects |
| BFS crawl of the entire site, depth 4 | 489 | 485 × 200; 2 × 307→/ (`/admin/*`, correct gating, linked from nowhere); 1 × 404 (`/dev/perf`, linked from nowhere) |
| 96 show pages + 91 player URLs | 187 | 187 × 200 |
| Sampled episode URLs (ep 1, last free, first paid, last) | 353 | 353 × 200 |
| Over-range episode URLs (episodeCount + 1) | 91 | 91 × 404 — correct |
| Dynamic slug URLs from the data modules | 129 | 119 × 200; 10 × 404, all `/shop/<slug>`, correctly fail-closed |
| Non-series XML sitemap URLs | 197 | 197 × 200 |
| Sampled series/episode sitemap URLs | 200 | 200 × 200 |

**Every catalog row resolves correctly.** 91 live rows → `/series/<slug>/1` (200); 5 coming-soon rows → `/series/<slug>` (200). No 404 is reachable by tapping anything in the product.

---

## 2. Findings

### D3-001 — S1 — The production Supabase host does not exist in DNS

The browser bundle served by www.verzatv.com constructs its Supabase client against a hostname that returns NXDOMAIN. Tapping **Continue with Google** or **Continue with Apple** navigates the viewer out of the app onto the browser's "This site can't be reached" page.

```
chunk 0fkfn44ctjja6.js  (fetched from www.verzatv.com)
  createBrowserClient("https://mmvbmrrwgludfmfalfcm.supabase.co", "eyJ...")
chunk 0oo5zhjmwzr5q.js  — identical
```

The bundled anon JWT decodes to `{iss:"supabase", ref:"mmvbmrrwgludfmfalfcm", role:"anon"}`, so URL and key agree on the same project. That project does not resolve:

| Resolver | Result |
|---|---|
| local | NXDOMAIN |
| 8.8.8.8 | NXDOMAIN |
| 1.1.1.1 | NXDOMAIN |
| **negative control** `jejispfvlkwastzvwtwu.supabase.co` (the project named in the repo notes) | 104.18.38.10 — resolves |

The control matters twice over: it proves this is not a resolver problem, **and** it falsifies the inherited fact. The repo's own notes name a different, still-live project. Standing rule 5 earned its keep here — I nearly filed a finding against the wrong host.

Observed in Chrome: after tapping Continue with Apple on `/sign-in`, the tab URL becomes `https://mmvbmrrwgludfmfalfcm.supabase.co/auth/v1/authorize?provider=apple&redirect_to=...&code_challenge=...` and screenshot capture fails with `Frame with ID 0 is showing error page`. The first tap sometimes looks completely inert, because `signInWithOAuth` navigates asynchronously; a second tap navigates. Either way the viewer gets nothing useful, and `components/OAuthButtons.tsx:52-70` only `console.error`s on failure, so no message ever appears.

**Bound on the claim.** `lib/checkout-auth.ts:12` gates the $1.99 unlock on `supabase.auth.getSession()` from this same dead client — which is why the paywall's Unlock button always routes to `/sign-in`. Every guest-reachable API route short-circuits before touching the database (`/api/watch-progress` → `{"items":[]}`, `/api/access` → `{"full":false}`, `/api/entitlements` → 401), so **server-side** Supabase health is not established here. Confirming the full checkout consequence needs an account.

---

### D3-002 — S2 — The footer YouTube link 404s, on every page

```
https://www.youtube.com/@VerzaTV        → HTTP 404, <title>404 Not Found</title>
https://www.youtube.com/@YouTube        → HTTP 200   (control: exists)
https://www.youtube.com/@zzqxnotareal…  → HTTP 404   (control: does not exist)
```

Rendered on production at `/`, `/about`, `/help`, `/support`, `/shop`, and twice on `/sitemap`. Sources: `components/Footer.tsx:38` (site-wide) and `lib/data/sitemap.ts:224` (Sitemap dropdown + `/sitemap` page).

The other four socials were negative-controlled and are live. TikTok returns `"uniqueId":"verzatv","nickname":"VerzaTV"` in its own page JSON. Facebook's HTTP 400 is datacenter-IP blocking, not a missing page — `facebook.com/Meta` returns the identical 400, so I did **not** report it.

---

### D3-003 — S2 — `/discover`'s category tiles contradict the catalog

`/discover` renders a tile only when `getSeriesByCategory(tab).length > 0`. It links seven categories. Four of them answer "No X series yet."

| Tile on /discover | The child page says | Catalog `categories` truth |
|---|---|---:|
| Drama | 32 live series | 71 |
| **Hot** | **0 live — "No popular series yet"** | 10 |
| **Español** | **0 live — "No espanol series yet"** | 5 |
| **Bollywood** | **0 live — "No bollywood series yet"** | 6 |
| Reality | 3 live series | 1 |
| **Red Carpet** | **0 live — "No red carpet series yet"** | 2 |
| Music | 1 live series | 1 |

`app/discover/[genre]/page.tsx:136-139`:

```ts
const matches = catalog.filter(
  (s) => s.genre.toLowerCase().includes(genre.toLowerCase()),
);
```

It free-text-matches the human-readable `genre` string instead of the `categories` field. `"red-carpet"` (hyphen) can never appear inside `"Red Carpet · Reality"` (space) — the match is structurally impossible. `"popular"`, `"espanol"` and `"bollywood"` never appear in any genre string either. `/discover/reality` over-counts by the same mechanism.

Red Carpet is the starkest: `lib/catalog.ts:958-979` gives `exes-premiere` and `love-awards` `categories:["red-carpet"], status:"live"`, 12 and 13 episodes, and both `/series/exes-premiere/1` and `/series/love-awards/1` return 200 and play.

This is the brief's own standing rule 6 — assert against real data, not string matching — committed by the product.

---

### D3-004 — S3 — Nine surfaces send poster taps to the show page, and the gate that forbids it passes

`lib/series-href.ts:96-101` states the rule: *"a poster tap starts the video, immediately, with no interstitial and no second tap."* Measured on production, by resolving every poster href on each page:

| Surface | → player | → show page |
|---|---:|---:|
| `/discover` | 0 | 91 |
| `/collections/most-binge-worthy` | 0 | 53 |
| `/discover/romance` | 0 | 46 |
| `/best/best-billionaire-romance-microdramas` | 0 | 25 |
| `/channels` | 0 | 14 |
| `/watch-in/new-york` | 0 | 12 |
| `/guides/what-is-a-microdrama` | 0 | 6 |
| `/compare/verza-vs-reelshort` | 0 | 6 |
| `/genre/revenge` | 0 | 4 |
| `/genres/revenge` *(correct)* | 11 | 0 |
| `/search?q=billionaire` *(correct)* | 22 | 0 |

257 poster links on nine sampled pages, every one costing an extra tap. Twelve files write the literal — `app/page.tsx:55`, `app/discover/page.tsx:73`, `app/discover/[genre]/page.tsx:215`, `app/best/[slug]/page.tsx:199`, `app/genre/[genre]/page.tsx:301`, `app/guides/[slug]/page.tsx:144`, `app/compare/[slug]/page.tsx:143`, `app/watch-in/[slug]/page.tsx:240`, `app/collections/[slug]/page.tsx:201`, `app/channels/page.tsx:46`, `components/ShortsFeed.tsx:116`, `app/c/[slug]/page.tsx:245,259` — against twelve that call `posterHref()`.

**Negative control on the gate.** `lib/series-href.ts` claims *"scripts/test-feed-integrity.mjs fails the build if a surface writes it instead."* It does not:

```
$ npm run test:feed-integrity
  walked 4913 episodes across 91 live series (5 coming soon)
Feed integrity contract: PASS
```

Two holes. `scripts/test-feed-integrity.mjs:877` bans only the **opposite** spelling:

```js
const EPISODE_ONE_LITERAL = /`\/series\/\$\{[^}]+\}\/1`|["']\/series\/[a-z0-9-]+\/1["']/;
```

— the `/1` form, not the bare show-page form. And check 9d (line 913) whitelists exactly five surfaces as required to call `posterHref()`; the other nine are outside every check. Good news on a related front: the earlier defect where checks sat below `process.exit` is fixed — no `check()` call appears after line 2373.

This touches a named do-not-regress asset (*instant play from a poster tap*). Flagging it as such: the asset is intact on the home grid, header search, `/search` and `/genres/<slug>`; it is absent on the nine surfaces above.

---

### D3-005 — S3 — Reality tab: four of five poster surfaces are inert, and look identical to the one that works

| Surface | Size | Tappable |
|---|---|---|
| Hero poster (`The Vertical Tea`) | 320 × 480 | **no** — no ancestor `<a>`, no ancestor `<button>` |
| Sugar Babies tile | 180 × 270 | **no** — `<div aria-disabled="true">` |
| Buy/Sell Miami tile | 180 × 270 | **no** — `<div aria-disabled="true">` |
| The Vertical Tea tile | 180 × 270 | **no** — `<div aria-disabled="true">` |
| Storage Pirates tile | 180 × 270 | yes — `/series/storage-pirates/1` (200) |

Verified in the **deployed** bundle, not the working tree. Chunk `1aseb4gggkekc.js`:

```js
return r ? jsx(Link,{href:posterHref(e.slug),…,onClick:t=>y(t,e.slug),children:a},e.title)
         : jsx("div",{className:"block min-w-0","aria-disabled":"true",children:a},e.title)
```

`components/BrowsePage.tsx:873` gates on `(MUX_MAP[show.slug]?.length ?? 0) > 0`, and only `storage-pirates` appears in `lib/mux-public-map.ts` (the other three: 0 hits each).

The inert tiles carry no badge, no dimming, no lock. The only visual difference anywhere on the tab is that Storage Pirates *gains* a "Landscape" badge — which reads as an addition, not as a playability marker. `aria-disabled` on a bare `<div>` has no role to attach to, so it is announced to nobody and shown to nobody. The biggest element on the screen — the 320×480 hero — is inert on this tab alone; on every other tab the hero is a link to the player (`components/BrowsePage.tsx:987`).

---

### D3-006 — S3 — `?tab=` arrivals leave no tab selected, on the Back button's own target

`/?tab=red-carpet` is exactly what `EpisodeFeed`'s Back button sets for a red-carpet episode. Landing there:

- correct content renders ("THE CARPET", Exes Premiere, Love Awards)
- the tab strip still shows `DRAMA HOT ANIME ESPAÑ` and **no tab is highlighted**
- RED CARPET is off-screen to the right

Measured at `/?tab=music`, innerWidth 606: the MUSIC button sits at viewport `x=1019`, while its `overflow-x:auto` scroller reports `scrollLeft 11.5` of a possible 606 (`scrollWidth 1000`, `clientWidth 394`). All nine tabs report `color rgb(245,244,248)` and `font-weight 400`; the only non-400 element on the page is the SITEMAP button.

`components/BrowsePage.tsx:413-426` applies the tab from the query string but nothing scrolls the active tab into view. The document does not scroll horizontally (`docScrollWidth == docClientWidth == 606`), so this is the strip's own scroll position, not a layout overflow.

Screenshot: `/var/folders/5f/lcnb7zy54sj33350s8qbkrwr0000gn/T/claude-chrome-screenshots-bdOAz5/screenshot-1788038023240-42.jpg`

---

### D3-007 — S3 — Sign-in "Back" and "Continue as Guest" throw away the return path

On `/sign-in?next=%2Fseries%2Fthe-mistress-trap%2F6` — reached by tapping Series Unlock on the first paid episode:

| Link | href | keeps `next` |
|---|---|---|
| Sign Up | `/sign-up?next=%2Fseries%2Fthe-mistress-trap%2F6` | yes |
| **Back** | `/` | **no** |
| **Continue as Guest** | `/` | **no** |
| Forgot password? | `/forgot-password` | no (defensible) |

Four literal `href="/"`: `app/sign-in/page.tsx:58`, `:169`; `app/sign-up/page.tsx:41`, `:191` — against `app/sign-in/page.tsx:161`, which builds the `next` correctly. A viewer six episodes into a show who decides not to sign in loses their place entirely.

---

### D3-008 — S3 — `/me` offers "Sign Out" to a guest

Signed out, `/me` reads *"Guest — Sign in to sync your library and purchases"* with a **Sign In** link at the top, and a full-width **Sign Out** button at the bottom. Tapping Sign Out navigates to `/` with no explanation.

`app/me/page.tsx:425` renders `<SignOutButton />` with no user guard. The very next line passes `<DeleteAccountButton expectedUserId={user?.id ?? null} />`, and `components/ProfileDynamic.tsx:159` has `if (!expectedUserId) return null;` — the exact guard `SignOutButton` (`:195`) lacks. The delete button correctly does not render for a guest; I confirmed it absent from the live element list.

---

### D3-009 — S3 — The Amazon bag handoff lands on a sign-in wall, not a cart

The bag drawer promises *"one tap sends your whole bag to Amazon"*. Tapping **Send 1 item to Amazon cart** resolves through two redirects to Amazon's *"Sign in or create account"* page for any viewer without an Amazon session:

```
https://www.amazon.com/gp/aws/cart/add.html?AssociateTag=verzatv-20&ASIN.1=…&Quantity.1=1
  → https://www.amazon.com/ap/signin?…openid.assoc_handle=amzn_associates_add_to_cart_us
    &openid.return_to=…%2Fassociates%2Faddtocart%3F…
```

Verified in a real Chrome tab, not only by curl. Screenshot: `/var/folders/5f/lcnb7zy54sj33350s8qbkrwr0000gn/T/claude-chrome-screenshots-bdOAz5/screenshot-1788038745261-44.jpg`

**Honest caveat:** the `return_to` carries the ASINs, so the item *is* added after sign-in. This is Amazon's own Associates behaviour, not a broken URL. The defect is the promise (`components/AmazonBag.tsx:182-186` and the `/amazon` copy) describing an outcome only signed-in Amazon shoppers get.

The rest of the Amazon flow is sound: the modal's "View on Amazon" deep link and all 12 catalogued ASIN URLs return 200, the bag pill appears on add, quantity ± and Remove all work.

---

### D3-010 — S4 — The `/shorts` Like button stores nothing

Before the tap the `verza-*` keys were `[verza-liked-the-mistress-trap, verza_anon_id]`. After the tap: identical — no key added, no value changed. Tapping **List** immediately afterwards added `verza-saved = ["faded-threads"]`, proving the measurement was sensitive.

`components/ShortsFeed.tsx:65` `useState(false)` + `:122` `onClick={() => setLiked(l => !l)}` — pure ephemeral state, versus `components/EpisodeFeed.tsx:1994-2008` where `toggleLike()` calls `persistLiked()`, which writes `verza-liked-${seriesSlug}` (`:1908`).

---

### D3-011 — S4 — The Creators-tab search box is inert

With the input empty and then with value `"zzz"`, the surrounding container's `innerText` is **byte-identical** (comparison returned `true`) while `input.value` confirmed `"zzz"` — the keystrokes registered and produced no observable effect.

`components/CreatorsLanding.tsx:355-368`: when `liveChannels.length === 0` the block always renders *"The first channels are being built"*, never the *"No match"* branch, regardless of query. The set really is empty — `/@someone` and `/somehandle` both 404.

The global header search does this correctly: `"billion"` → 22 results, `"zzzzqqqqxxxx"` → *"No results for "zzzzqqqqxxxx""*.

---

### D3-012 — S4 — `/horizontal` is an orphan page publishing a stale episode count

Nothing links to it (0 of 485 crawled pages contain `href="/horizontal"`), and it is in none of the four XML sitemaps. It renders *"SEASON 1 — 8 episodes"* for Storage Pirates, listing a Teaser plus S1 E1–E7. The catalog says **13**, and the Reality tab routes to `/series/storage-pirates/1`.

7 interactive elements (`HorizontalFeed` ×5, `HorizontalBackButton` ×2) that no navigation path reaches. Two more orphan pages behave the same: `/share` (1 element) and `/learn/<slug>` (3 pages, 200, unlinked, unindexed).

---

### D3-013 — S4 — 62 elements in ten components that nothing imports

Verified against the **deployed** bundle: 25 production chunks downloaded from www.verzatv.com and searched for a distinctive string from each.

| Component | Elements | Distinctive string | In deployed bundle |
|---|---:|---|---|
| `Player.tsx` | 18 | "Video playback error" | **no** |
| `AskVerza.tsx` | 9 | "Recommend a drama" | **no** |
| `SeriesInfoDrawer.tsx` | 8 | — (only via orphaned SeriesInfoButton) | unreachable |
| `FeedSearch.tsx` | 7 | "Search shows..." | **no** |
| `CreatorAITools.tsx` | 6 | "Script Generator" | **no** |
| `HeroCarousel.tsx` | 5 | — | unreachable |
| `InstallPrompt.tsx` | 4 | — | *intentional* — standing decision |
| `CoinPaywall.tsx` | 2 | — | unreachable |
| `SeriesInfoButton.tsx` | 2 | — | unreachable |
| `SeriesCard.tsx` | 1 | — (only via orphaned `ChannelRow.tsx`) | unreachable |

A further **28** ship or exist but cannot be reached:

- `CartDrawer.tsx` (11) is mounted in `app/layout.tsx` and **does** ship ("Your cart is empty" is in chunk `3z23pxudvy0-6.js`) but returns `null` unless `isOpen`, and the only caller of `openCart` is `CartButton.tsx`, which `app/shop/page.tsx:20` renders only when `MERCH_CHECKOUT_ENABLED === "true"` — false in production.
- `AddToCartButton` (6) and `ImageCarousel` (6) live on `/shop/<slug>`, which fails closed correctly: all 10 real product slugs return 404, `generateMetadata` sets `robots:{index:false}`, and no product URL is in the sitemap. **This is correct behaviour, not a defect.**
- `PerfHarness` (3) lives at `/dev/perf`, 404 in production, linked from nowhere.

A further **13** sit on routes whose data set is empty: `/c/<slug>` (5) — `lib/clips.ts:44` is `const CLIPS: Clip[] = []`, so every slug 404s; `/watch/<...>` `CreatorWatch` (7) — 404; `/@handle` (1) — 404.

---

### D3-014 — S3 — Tap targets well under a thumb

| Element | Size | Where |
|---|---|---|
| Footer social icons ×5 | **18 × 18** | every page (`components/Footer.tsx:85-99`) |
| Remove from saved list | **56 × 16** | `/me/list` — and it is destructive |
| Back | 352 × 20 | `/sign-in` |
| Continue as Guest | 122 × 20 | `/sign-in` |
| Forgot password? | 101 × 16 | `/sign-in` |

The anchor around each social glyph is `flex items-center gap-1.5` with no padding and its text label hidden below the `sm` breakpoint, so 18px is the whole target. For contrast, correctly sized on the same screens: episode-feed action rail 44 × 63 per button, BottomNav 74 × 41, paywall Series Unlock 241 × 53, `/studio` Sign in 94 × 44.

---

### D3-015 — S4 — Two URL families for the same genre, with different tap behaviour

`/genre/revenge` → posters go to show pages (player 0 / show 4). `/genres/revenge` → posters go to the player (player 11 / show 0). `/genre/mafia-romance` and `/genre/anime` 404 while their `/genres/` twins are real hubs.

`/sitemaps/genres.xml` publishes 8 `/genre/*` URLs alongside 28 `/genres/*`. Zero of the 485 crawled pages link to `/genre/<x>`, so that family is search-reachable only. `app/genre/[genre]/page.tsx:301` is one of the nine surfaces in D3-004.

---

### D3-016 — S4 — `litix.io` preconnect points at a non-existent apex

```
dig +short @8.8.8.8 litix.io           → (empty, NXDOMAIN)
dig +short @8.8.8.8 inferred.litix.io  → dsolp.litix.io.
curl https://litix.io/                 → HTTP 000, could not resolve
```

`app/layout.tsx:112` and `:115` preconnect and dns-prefetch `https://litix.io`; Mux Data's real endpoints are subdomains. Both hints are no-ops that read as though the analytics connection is being warmed. Their neighbours on lines 110-111 and 113-114 do resolve and were confirmed serving — `stream.mux.com/<id>.m3u8` → 200 `application/x-mpegURL`, matching `image.mux.com` thumbnail → 200 `image/jpeg`.

---

### D3-017 — S4 — Four of the 74 "external links" are not links

`components/creator/ApplicationWizard.tsx:373`, `:420`, `:458` → `placeholder="https://..."`. `components/CreatorDashboard.tsx:795` → `placeholder="https://…"`. `components/creator/ui.tsx:382` → `placeholder="https://drive.google.com/..."`. `lib/creator-client.ts:203` → the validation string *"Add at least one valid link starting with http:// or https://."*

Reported so the coverage denominator is not silently over-credited.

---

### D3-018 — S4 — Two dead test streams, and one destination with two labels

`test-streams.mux.dev/bbb-360/playlist.m3u8` and `.../elephants_dream/playlist.m3u8` both 404; the other five in `lib/perf/seed.ts` return 200. Not user-facing — that module only runs at `/dev/perf`, which 404s — but they are in the 74-link scope.

Separately, `lib/data/sitemap.ts:200-205` emits `{ label: "Creator Studio", href: "/studio" }` and `{ label: "Apply to Create", href: "/studio" }` — two labels promising different things, one destination.

---

## 3. Do-not-regress assets — all verified intact

| Asset | Verdict |
|---|---|
| Instant play from a poster tap | intact on home grid, header search, `/search`, `/genres/<slug>`; **absent** on the nine surfaces in D3-004 — flagged, not a false alarm |
| Paywall honesty | intact. Episode 6 of a 5-free title renders "$1.99 / one-time", "Series Unlock — $1.99 one-time" (241×53), "Secure checkout via Stripe", and a **Go Back** link of equal prominence. No countdown, no fake discount, nothing pre-ticked |
| Episode picker FREE badges and padlocks | intact. Dropdown opens 61 episode links; ep 1 "NOW", eps 2–5 "FREE", eps 6+ bare |
| Anime empty state | intact and is the house pattern: *"Anime is coming soon / We're lining up the first titles for this section. Everything else on VERZA is ready to watch right now."* + **Browse Drama** |
| "THE MICRODRAMA APP" under the logo | present, every page |
| Poster art | all posters load |
| Legal and trust pages | `/terms`, `/privacy`, `/refund-policy`, `/help`, `/support`, `/editorial-standards` all 200; every link on them 200 |
| Speed | homepage TTFB 0.37s; all 1,502 route fetches well inside timeout |
| Swipe feel | not measured — outside D3 |

Other surfaces confirmed correct and worth naming:

- **`/me/purchases` empty state** is the best on the site: *"Unlocks live on your account, not on this device… If something you bought is missing here, email support@verzatv.com with the email you used at checkout."* — honest, with a route forward and a real fallback.
- **`/me/list`** both tabs: honest empty states with a **Browse Shows** CTA; seeded saved rows and a seeded resume row both resolved correctly (`/series/the-mistress-trap/3?t=42` → 200).
- **`/reset-password` with no token**: *"Link expired… Request a New Link"* → `/forgot-password`. A real error state with a way forward.
- **Language picker**: all 20 locales present.
- **Header search**: 22 results for "billion", honest "No results for …" otherwise.
- **Tubi tab**: honest and correctly labelled — "WATCH FREE ON TUBI →", "OPENS TUBI ↗", four slides all → `https://tubitv.com/` (200 with a browser UA).
- **Infinite grid**: paging confirmed working (25 → 49 unique series links, scrollHeight 3206 → 5022).
- **Push notifications**: the VAPID *public* key is inlined in chunk `0fkfn44ctjja6.js` and both subscribe and unsubscribe call `/api/push/subscribe`. Not inert.
- **App Store / Play Store links**: verified live via the iTunes Lookup API — `resultCount: 1`, "Verza TV: Vertical Drama", VERZA TV LLC. The `301 → itms-appss://` under an iOS UA is Apple's correct hand-off, not a broken link. Play Store → 200, "VerzaTV - Apps on Google Play".

## 4. One near-miss worth recording

My first breadth-first pass reported `/watch-in/series/a-love-once-betrayed` as a 404. A targeted re-scan of all 485 live pages found that string on **zero** of them, and a scan for relative `href`s across all 485 found **zero**. It was a crawler artifact. It is not reported as a finding.