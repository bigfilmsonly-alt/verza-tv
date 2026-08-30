# Verza TV — Fix Plan

228 confirmed findings: **21 S1, 28 S2, 91 S3, 88 S4**.

Ordered by severity, then by dependency. The split between *apply* and *propose*
follows the audit's own rule: anything touching the payment path, entitlement,
the Severity 1 rail bounds, the App Store build or the SEO surface is proposed
and waits for a human.

---

## STOP — these need you before anything else

### 1. The deployed bundle points at a Supabase project that does not exist

`D5-002`, `S6-001`, `D3-001`. **Independently confirmed by me, not just by an agent.**

The live bundle on www.verzatv.com and `.env.local` both carry
`mmvbmrrwgludfmfalfcm.supabase.co`, and that host is **NXDOMAIN**. The project
memory records the real project as `jejispfvlkwastzvwtwu.supabase.co`, which
resolves. Every client-side auth path — email sign-in, sign-up, Continue with
Google, Continue with Apple, password reset — targets a host that is not there.

Server-side API routes still answer 200, because they authenticate with the
service-role key and a separate server variable, so this is invisible from the
outside until someone tries to log in.

**Why I did not fix it:** I will not rewrite the credential that controls
authentication and entitlement on a live product from an inference. You need to
confirm which project is current and set `NEXT_PUBLIC_SUPABASE_URL` and its
anon key in Vercel. If `jejispfvlkwastzvwtwu` is correct, this is a one-line
env change plus a redeploy.

### 2. Loading any URL with `?platform=ios` permanently disables every purchase surface

`S5-001`. `lib/platform.ts` writes `verza-platform=ios` to localStorage on sight
of that query parameter, from the root layout, so it fires on **any** page. There
is no removal path anywhere in the repo: no `removeItem`, no `?platform=web`, no
expiry. The browser is converted, permanently, into a client that shows the
catalogue and can never buy — and tells the viewer the content "isn't available
in this app" while they are on the open web.

Any link out of the iOS WebView, any shared app URL, any QR or marketing link
carrying the parameter does this. It touches the payment path, so it is proposed
rather than applied. The fix is small: honour the parameter only for the real
native user-agent, or add an explicit reset.

### 3. Source master video files for paid episodes are publicly downloadable

`D5-004`. 3,461 pre-transcode masters for paid episodes, unauthenticated, with
`access-control-allow-origin: *`. Higher quality than the paid HLS renditions.
Needs bucket access to fix and needs you to decide the remediation.

### 4. The rate limiter does not bind in production

`S2-002`. 150 parallel requests to `/api/playback` against a documented 90/min
limit returned 150 × HTTP 200 and zero 429s. The bucket is an in-process `Map`,
and serverless instances each get a fresh one. The tier separation I shipped
earlier is therefore correct in intent and inert in practice. Fixing it needs a
shared store, which is an infrastructure decision.

### 5. Every named pre-release security gate passes with paid-playback authorization deleted

`D5-003`. Four independent authorization-removing mutations — deleting the 402
paywall branch, forcing `/api/access` to return `full:true`, removing the
signed-playback fail-closed — left all four suites green. Two control mutations
*were* caught, so the suites are not uniformly blind, but the authorization path
itself is unguarded. **This is the most important finding in the audit**, because
it means the gates cannot be trusted to catch the class of defect they exist for.

---

## Applied in this run

All negative-controlled; none touches money or the rail.

| Finding | Fix |
|---|---|
| `S4-001` | `/search?q=a&q=b` returned HTTP 500 on a blank page. `searchParams` typed `q` as `string`; Next returns `string[]` when a parameter repeats. Typed honestly, normalised through one helper. |
| `D3-001` (show pages) | 22 of 96 pages printed the synopsis twice. The repeated opening is stripped and the remainder kept. The first version of this fix was an equality test that suppressed **zero** pages — caught by measuring. |
| `S2-003` | Both feed components read the mute preference with an unguarded `localStorage` call inside a `useState` initialiser. Blocked site data makes that **throw during render**, so the player never mounted and the viewer got an error page instead of a video. |
| `S2-004` | `/shorts` autoplayed with sound on and ignored the shared mute preference it writes on every toggle. |
| `D5-011` | `JsonLd` wrote `JSON.stringify` into a `<script>` without escaping `<`. Not exploitable today because every value is catalogue-authored — which is exactly why the escape belongs there before that changes. |
| `S4-016` | `/search` claimed "91+ series" when exactly 91 are live, and carried a pluralisation ternary whose branches were the same string. |

---

## The rest, by severity

### S1 — 21 confirmed

- `D3-001` The production browser bundle's Supabase host does not exist in DNS. "Continue with Google" and "Continue with Apple" on /sign-in and /sign-up navigate the viewer ou **[money/rail — propose only]**
- `D3-003` The "Series Unlock · $1.99" card on all 86 paid show pages is an inert <div> with no purchase path. A viewer who wants to buy from the show page cannot. **[money/rail — propose only]**
- `D3-011` The show page offers no way to save a title, share it, or resume it — despite My List, watch progress and share being product features. It has three interactive elem
- `D4-009` BrowsePage's prewarm comment describes the abandoned show-page-first routing and states the opposite of what the file does, which is the kind of stale comment Standi
- `D5-002` Web authentication points at a Supabase project that does not exist. The deployed bundle hard-codes https://mmvbmrrwgludfmfalfcm.supabase.co plus that project's anon **[money/rail — propose only]**
- `D5-003` Every named pre-release security gate passes with the paid-playback authorization deleted. Four independent authorization-removing mutations — deleting the 402 paywa **[money/rail — propose only]**
- `D5-004` 3,461 source master video files for paid episodes are publicly downloadable, unauthenticated, from a third-party Supabase Storage bucket, served with access-control- **[money/rail — propose only]**
- `D5-005` The legacy public Mux playback IDs for all 4,394 paid episodes still carry a public playback policy, so possession of the ID alone is sufficient to stream a paid epi **[money/rail — propose only]**
- `D5-007` /api/push/subscribe accepts unauthenticated POST and DELETE keyed only by the push endpoint, with no ownership check: anyone holding an endpoint URL can detach anoth
- `D5-008` The production Content-Security-Policy allows 'unsafe-inline' and 'unsafe-eval' in script-src, which removes the CSP's ability to contain an XSS. It is the only comp
- `D5-011` components/JsonLd.tsx writes JSON.stringify(data) straight into a <script> element without escaping `<`, so any future dynamic string containing `</script` breaks ou
- `D5-014` public.handle_new_user() is the one SECURITY DEFINER function in the schema with no `revoke all on function ... from public`, breaking the pattern every other define
- `S2-002` The API rate limiter does not bind in production: 150 parallel requests to /api/playback in 4 seconds against a documented 90/min limit returned 150x HTTP 200 and ze **[money/rail — propose only]**
- `S2-003` The player throws on mount and falls to the route error boundary in any browser where site data is blocked, because the mute preference is read from localStorage wit **[money/rail — propose only]**
- `S2-004` /shorts autoplays with sound ON and ignores the viewer's saved mute preference, while the two other players default to muted and honour it.
- `S5-001` Loading any URL with ?platform=ios permanently and irreversibly disables every purchase surface in that browser, and the same branch fires for any iOS home-screen PW **[money/rail — propose only]**
- `S6-001` The production client bundle's Supabase host (mmvbmrrwgludfmfalfcm.supabase.co) is NXDOMAIN, so every authentication path on verzatv.com targets a hostname that does **[money/rail — propose only]**
- `S6-002` None of the auth server actions are rate limited: middleware only matches /api/:path*, while sign-in, sign-up and password-reset POST to the page routes, leaving unb
- `S6-003` Signing out never clears the device mirror, so the next person on a shared browser sees the previous account's My List and Continue Watching - and if any new activit
- `S6-004` /me tells a signed-out viewer 'No purchases' - the account page asserts a fact about purchases it cannot know, which is the exact defect the code comment above it cl **[money/rail — propose only]**
- `S6-012` /reset-password lets an ambient session set a new password with no current-password check and no re-authentication, so a stolen session converts into permanent accou

### S2 — 28 confirmed

- `D1-005` /studio and /creator show the SIGNED-OUT screen when /api/creator/me fails. An approved, signed-in creator hitting a 500 or a network drop is told "Sign in to apply,
- `D1-007` Offline state: the service worker answers EVERY failed navigation with the cached homepage. The cache holds exactly one entry ("/"), no offline page exists in the 65
- `D2-002` The show page — the destination Phase 1 routed every poster tap to — renders its sales copy as hard-coded English in all 20 locales. **[money/rail — propose only]**
- `D3-002` The footer YouTube link 404s. It renders on every page of the site and on the /sitemap page twice.
- `D3-003` /discover's category tiles are dead ends: four of the seven categories it links to answer "No X series yet" while those same categories show live, playable titles on
- `D3-009` 11 of the 86 paid titles ship a show page with no Cast at all, and 7 of those also have no synopsis paragraph and no tags — only a one-line logline — while the other
- `D3-012` The 5 coming-soon pages emit numberOfEpisodes: 0 in their TVSeries JSON-LD, doing in structured data exactly what the UI deliberately refuses to do on screen.
- `D3-016` 94 of 96 rows print "VERZA Originals" as the channel, including the 11 live Hindi and Spanish titles that AGENTS.md describes as supplied third-party footage.
- `D4-002` A single scroll gesture that travels more than one slide strands the episode feed on a permanently blank screen: the IntersectionObserver adjacency guard rejects the
- `D7-001` The bottom navigation renders completely empty — no icons, no labels, zero-height links — on every phone in landscape, because a rule intended to hide only the label **[money/rail — propose only]**
- `D7-002` On every iPhone in landscape the paywall is clipped top and bottom inside an overflow:hidden container with no scroll, leaving the Go Back button mostly or entirely  **[money/rail — propose only]**
- `S2-001` A deep link to any paid episode opens a paywall that tells the viewer they "just watched the free preview" when they have watched nothing, on a rail whose five free  **[money/rail — propose only]**
- `S4-002` A typographic apostrophe (U+2019) in a query returns zero results for all 13 catalogue titles that contain an apostrophe. Every title in lib/catalog.ts uses ASCII U+
- `S4-007` 15 of 91 live rows carry no curated SEARCH_TAGS — including all 5 Español and all 6 Bollywood titles, both Red Carpet titles, Storage Pirates and I'm Obsessed with M
- `S4-017` Accessibility gaps on all three shipped search surfaces: no aria-label on any of the three inputs (placeholder only), no aria-live region announcing result counts or
- `S5-002` The purchase-confirmation email names the URL slug, not the catalog title. 30 of the 86 paid titles would send a receipt naming a different product from the one on t **[money/rail — propose only]**
- `S5-003` The "$1.99 Series Unlock" card on all 86 paid show pages is an inert div with no buy control — the surface that advertises the price offers no way to act on it. Agen **[money/rail — propose only]**
- `S5-009` A single 6-second AbortController deadline spans the entire entitlement chain, and both fallback paths reuse the same already-aborted signal — so once the deadline f **[money/rail — propose only]**
- `S5-010` Any non-OK response from /api/access is treated as "not entitled" rather than "could not check", so a transient 429/500/503 paywalls a paying customer and blacks out **[money/rail — propose only]**
- `S5-017` Three unimported commerce components still carry live-looking $1.99 purchase UI, including a full unlock button wired to /api/unlock. None has an importer, so none c
- `S6-005` Reflected text from ?error= is rendered verbatim in the error box on /reset-password, so a crafted link puts attacker-authored copy on verzatv.com in Verza's own sty
- `S6-009` GET /api/watch-progress does not clamp episode_number to the series' current episodeCount, so a signed-in viewer's Continue Watching tile can link to a 404 - the cli
- `S6-010` There is no self-service purchase recovery on the web: /api/entitlements/claim is a hard 410, pending_entitlements has zero readers and zero writers, and the only of **[money/rail — propose only]**
- `S6-011` My List falls back to the device's copy whenever the account's saved list comes back empty, so an account with zero saved shows displays stale device rows and remova
- `S7-001` Reality: 3 of the 4 tiles are dead flyers rendered identically to the one that plays, with no Coming Soon treatment and no explanation.
- `S8-011` /contact presents itself as the address directory and omits privacy@, careers@ and investors@ — including the address the Privacy Policy directs all deletion and CCP
- `S8-015` /about advertises 'Podcasts' as one of the platform's content categories; no podcast tab, genre, discover category or catalog row exists.
- `S8-017` /leadership prints a disclaimer that some bios are 'representative placeholders' when the page shows exactly one bio — reading as a warning that the founder's bio ma

### S3 — 91 confirmed

- `D1-004` /me tells a paying customer they have no purchases when the API is down. With /api/saved-list, /api/watch-progress and /api/entitlements all returning 500 the page r **[money/rail — propose only]**
- `D1-006` /discover/[genre] accepts any string and returns HTTP 200 with a fabricated category page. /discover/zzzzz renders "Zzzzz Micro-Dramas — 0 live series — No zzzzz ser
- `D1-008` 0 of 65 page routes have a loading.tsx; 1 of 65 has an error.tsx (the episode player); there is no global-error.tsx. The production 500 that results is Next.js's unb
- `D2-003` The Profile screen is a Server Component that hard-codes 16 strings which exist, fully translated, in all 20 locales.
- `D2-006` The audio-language label — the string whose stated purpose is stopping wrong-language purchases — renders a doubled article in Arabic and a doubled word in Vietnames **[money/rail — propose only]**
- `D2-007` No plural rules anywhere: the paywall's episode-count benefit line is grammatically wrong in Russian on 20 of 86 paid series and in Polish on 4 of 86. **[money/rail — propose only]**
- `D2-008` Filipino viewers get English: resolveLocale matches the literal tag "tl", but Chrome and Safari send "fil".
- `D2-009` Traditional-Chinese readers are served Simplified copy; there is no zh-Hant dictionary and no way to ask for one.
- `D3-002` 76 of 96 show pages publish a fabricated three-name "Cast" credit block; 18 entries across 17 series are unmistakably character/role labels, not performers.
- `D3-004` Nine merchandising surfaces route every poster tap to the read-first show page instead of the player, breaking the product's central rule; the feed-integrity check t
- `D3-005` The iOS purchase-surface hide runs post-mount, so the $1.99 Series Unlock card ships in the server HTML of all 86 paid show pages and is painted before it is removed **[money/rail — propose only]**
- `D3-005` On the Reality tab, four of the five poster surfaces are inert: the full-width 320x480 hero and three of the four grid tiles. They are pixel-identical in treatment t
- `D3-006` Arriving on a ?tab= deep link leaves the tab strip scrolled to the far left with no tab highlighted, so the viewer cannot tell which section they are in. This is the
- `D3-007` <html lang> never describes the page's content language. All 96 pages ship lang="en" from the server, including 6 whose entire body copy is Spanish; after hydration 
- `D3-007` On /sign-in and /sign-up, "Back" and "Continue as Guest" hard-code href="/" and discard the ?next= return path, so a viewer who reached sign-in from the paywall and  **[money/rail — propose only]**
- `D3-008` /me renders a "Sign Out" button to a signed-out visitor, on the same screen that says "Guest — Sign in to sync your library and purchases" and offers a "Sign In" but
- `D3-009` The Amazon bag's "Send N items to Amazon cart" handoff lands on Amazon's sign-in wall, not on a cart containing the items, for any viewer not already signed in to Am **[money/rail — propose only]**
- `D3-010` The Like button on /shorts changes to "Liked" and stores nothing — no localStorage write, no network call — while the identical Like button in the main episode feed 
- `D3-014` 16 of 96 pages render no year in the published-metadata row, so the line collapses to a lone "VERZA Originals" while 80 pages show "2025 · VERZA Originals".
- `D3-015` Several tap targets on every show page fall below the 44×44 minimum: header controls 36×36, the next-episode chevron 39×39, the Play CTA 43px tall, the coming-soon "
- `D3-015` /genre/<x> and /genres/<x> are two live URL families for the same genre with different tap behaviour; the /genre/ family is published in the XML sitemap but linked f
- `D3-016` The layout preconnects and dns-prefetches https://litix.io, which is NXDOMAIN. The real Mux Data endpoints are subdomains, so both hints are no-ops that read as if t
- `D3-019` The episode picker wraps to two lines at a 320px content width, growing from 41px to 60px tall.
- `D4-004` The entire 519-row public Mux map (156,628 B raw / 37,569 B brotli) and the full 96-row catalog (108,781 B raw / 32,290 B brotli) are in the client bundle of EVERY r
- `D5-009` Migration 016 re-grants column-level UPDATE on public.creators to `authenticated` on a stated premise that is false — its comment says the 005 owner-update policy 'r **[money/rail — propose only]**
- `D6-003` The episode player cannot be operated from a keyboard: play/pause is an onClick on a bare <div> with no role, tabindex or key handler, and the feed's scroll containe
- `D6-004` Arabic — one of the 20 shipped locales — renders the entire app left-to-right. document.documentElement.dir is never set anywhere in the codebase; `dir` appears exac
- `D6-005` The --color-muted token #6B6B7B fails WCAG AA contrast on both site backgrounds — 3.56:1 on the card surface #12121C and 3.84:1 on the page background #07070E, again
- `D6-006` The accent #E0115F used as text fails AA on every background it appears on — 4.22:1 on the page background, 4.07:1/3.70:1/3.60:1 on tinted chips, 3.91:1 on cards, 3. **[money/rail — propose only]**
- `D6-008` Form fields have no focus indicator at all. The only focus-visible rule in the deployed CSS targets `a` and `button`; 36 of the 38 `outline-none` usages in the codeb
- `D6-009` Every carousel pagination dot is a 6x6 CSS-pixel button with p-0 and no expanded hit area — a quarter of the WCAG 2.5.8 minimum of 24x24 and a seventh of Apple's 44p
- `D6-010` Tap targets are systematically undersized: 1,853 of 2,679 measured interactive instances (69%) are below 44x44 and 943 (35%) are below the WCAG 2.5.8 minimum of 24x2
- `D6-011` Two icon-only controls ship with no accessible name at all: the Shorts back link and the next-episode link on every series page. A screen reader announces them as a 
- `D6-012` There is no skip link anywhere in the product. On the home page a keyboard or switch user must press Tab 61 times to reach the bottom navigation, and <main> has no i
- `D6-013` Heading structure is missing on the highest-traffic surfaces. The home page renders zero headings of any level, and the episode/paywall route's only heading is an <h
- `D6-014` Overlay sheets have no dialog semantics, no focus trap and (in the player) no Escape handler. Opening the player's More sheet leaves focus on <body> and keeps all se
- `D6-016` Reduced-motion handling is real but incomplete: the deployed CSS has four prefers-reduced-motion blocks covering eight selector groups, and none of them covers .glow **[money/rail — propose only]**
- `D6-017` The bottom navigation never exposes which tab is current. The ACTIVE and INACTIVE colour constants are both #FFFFFF, and there is no aria-current, so the only cue is
- `D6-018` In the episode picker the locked state is carried by a bare padlock <svg> with no title, aria-label or aria-hidden, while FREE and NOW are real text. A screen-reader
- `D6-019` Footer link targets are 18px tall and the five social links are 18x18 — below the WCAG 2.5.8 minimum of 24x24, with no padding to expand the hit area.
- `D6-022` The deployed CSS has no forced-colors or prefers-contrast support. Icons drawn with hard-coded stroke attributes will not adapt in Windows High Contrast Mode.
- `D6-023` Every prerendered page ships with lang="en" hard-coded and only corrects to the viewer's locale after hydration, so the first paint of a non-English page is declared
- `D7-003` On home-indicator iPhones the fixed bottom nav permanently covers all eight footer legal/nav links (Terms, Privacy, Refund Policy, Support…) at maximum scroll, on 59
- `D7-004` The Amazon affiliate pill still overlaps the paywall's Go Back button, and on some phone geometries it overlaps the $1.99 Series Unlock button instead; the pill wins **[money/rail — propose only]**
- `D7-005` The player's Back and Mute controls ignore safe-area-inset-top, so in the installed PWA and the iOS WebView they sit under the status bar / Dynamic Island; a decorat
- `D7-006` Pinch-zoom is disabled site-wide by maximum-scale=1 while 1,524 text nodes render below 12px — down to 9px on the free/paid chips — so a viewer who cannot read them 
- `D7-009` The only way to unmute the player is a 40x40 button in the extreme top-right corner, the hardest one-handed target on a 430x932 phone, on a product whose own rule is
- `D7-010` On landscape viewports 501-599px tall (foldables, short desktop windows) the bottom nav's labels are clipped below the viewport edge, and the app shell goes full-ble
- `D7-011` Three of the four bottom sheets ignore safe-area-inset-bottom, so their last row of content or their primary button lands inside the home-indicator strip; the fourth
- `D7-012` Even with zero safe-area inset, the footer's copyright line is permanently hidden behind the fixed bottom nav on 59 of 60 routes at maximum scroll.
- `S1-002` The Reality tab's hero — a 320x480 rotating poster, the largest element on the tab — has no link, no button and no click handler. The identically sized and identical
- `S1-003` Poster-grid captions overflow their fixed 36px box and overlap the next row's artwork. The caption block is `<div style={{height:36}}>` holding a line-clamp-2 title 
- `S1-004` The hero auto-advances every 4 seconds and its link target changes with it, so a tap aimed at the poster a viewer is looking at can land on a different title's playe
- `S1-005` Primary navigation and carousel controls are far below a usable tap-target size: hero/Reality dot indicators are 6x6 CSS px (20x6 when active) and category-strip tab
- `S1-006` The rendered home page has no <h1> and no <h2> at all. The only h1 lives inside the <noscript> crawler block, which is not exposed to a JS-enabled browser's accessib
- `S1-009` The home page footer links to a YouTube channel that does not exist. https://www.youtube.com/@VerzaTV returns HTTP 404 from YouTube's edge, identically to a made-up 
- `S1-010` A category label truncates mid-word at the two most common phone widths, and 6 of the 10 categories sit entirely off-screen at rest at every width tested. The 28px e
- `S2-006` ShortsFeed and HorizontalFeed retry fatal media errors without any bound and show no failure UI, which is the unbounded-rebuild pattern the main player deliberately 
- `S2-009` Every failure state a viewer can hit inside the player is English-only in all 20 locales, including the route error boundary that stands in for the paywall when the 
- `S4-001` /search?q=a&q=b returns HTTP 500 and a completely blank page. A repeated q parameter makes Next hand searchParams.q an array; q?.trim() throws in both generateMetada
- `S4-003` None of the 5 coming-soon rows is reachable from any search surface. All three shipped surfaces search a live-only pool, so an exact-title search for a title that ha
- `S4-004` There is no relevance ranking. Results are emitted in raw catalogue-array order, so an exact title match can sit near the bottom of the list. Searching the exact nam
- `S4-006` Every user-visible string in the search experience is hard-coded English. Zero of the 115 i18n keys covers search, and none of the four surfaces imports the translat
- `S4-011` components/FeedSearch.tsx has no importer anywhere in the app and does not appear in any deployed chunk. Seven of the 20 interactive elements the manifest attributes
- `S4-014` The comment that justifies putting the slug in the search haystack states the wrong number: it says the five Español and six Bollywood rows are "all eleven" rows shi
- `S4-016` The /search empty state and its metadata both claim "Search 91+ micro-drama series" when exactly 91 are searchable and the "+" has nothing behind it — the five rows 
- `S4-018` Consistency drift across the search surfaces and their entry points: the /search input omits enterKeyHint="search" that the header input has; the sub-2-character sta
- `S5-004` A signed-out buyer who taps the paywall's $1.99 CTA is bounced to a generic /sign-in with no purchase context, and that page's "Continue as Guest" link discards the  **[money/rail — propose only]**
- `S5-005` Guest purchase does not exist anywhere in the codebase, and the pending_entitlements claim RPC that would attach one has zero callers — yet the standing dev checklis **[money/rail — propose only]**
- `S5-011` The Amazon affiliate bag pill floats over the paywall's "Go Back" button — an ad control partially occluding the payment screen's only exit, which is one of the name **[money/rail — propose only]**
- `S5-012` /me renders a "SUBSCRIPTION" section header with nothing underneath it, on every visit, for every viewer.
- `S5-013` /press tells journalists the monetization model is "$1.99 one-time Series Unlock + VIP subscription" while /llms.txt on the same deployment says VIP checkout is not  **[money/rail — propose only]**
- `S6-006` A 'Sign Out' button is rendered to signed-out guests on /me, on a page whose own header says 'Guest - Sign in to sync your library and purchases'.
- `S6-007` /me renders a 'SUBSCRIPTION' section heading with nothing underneath it, because VipCard returns null whenever VIP checkout is disabled - which it is in production.
- `S6-008` /library invents two channels that do not exist in the catalog and tells viewers they are 'coming soon' - including StorageBlue, whose show (Storage Pirates) is alre
- `S6-013` The entire account, library and auth surface is hard-coded English: 16 profile.* keys are translated into all 20 locales (320 i18n cells) and never rendered, while /
- `S7-005` Channels: the StorageBlue card is marked Coming Soon while the show whose premise it describes is live and playing.
- `S7-006` Channels: "View All 89 Shows" lands on an unfiltered /discover that lists 91 titles and drops the channel context.
- `S7-008` Reality: the hero is a large non-interactive poster that spends three of every four rotations advertising a show that has no page and no episodes.
- `S7-009` Carousel dots across four sections are 6-7px tap targets — the button element itself is the hit area.
- `S7-010` The StorageBlue advert carries no user-visible Ad or Sponsored label and no rel="sponsored", on any of the three tabs it renders on.
- `S7-011` Tubi: six banners carrying Tubi's own play buttons all resolve to the catalogue home page, and the large framed Tubi wordmark is the one affordance with no destinati
- `S8-001` The YouTube link in the footer of every page on the site returns HTTP 404; the real channel is at a different handle.
- `S8-002` /brand-assets advertises four logo files in SVG and PNG; none of the eight is downloadable and the 'SVG · PNG' pill is an inert span.
- `S8-005` The Creator Agreement is a hard acceptance gate on the creator application and states on its own face that it is placeholder text and not the agreement. **[money/rail — propose only]**
- `S8-012` /help tells viewers the catalog includes Horror; the site's own Horror page says 0 live series and no catalog row is horror.
- `S8-013` /studio — the footer's 'Become a Creator' destination on every page — server-renders an empty <main>.
- `S8-018` /partnerships tells prospective licensees VERZA 'owns its content'; /about tells viewers content is 'produced by or licensed to' VERZA.
- `S8-019` Seven indexable legal/trust pages are absent from the XML sitemap, including /support and /contact.
- `S8-020` /sitemap is titled 'Every Page on VERZA TV' and lists 35 of the 48 static routes.
- `S8-021` The footer sitemap sheet contains six duplicate links — two labels pointing at /studio and five sections repeating their own hub as a list item.

### S4 — 88 confirmed

- `D1-012` /me renders a "Sign Out" button in the signed-out (Guest) state. It is inert for a guest — an interactive control that does nothing observable.
- `D1-013` /shorts ships no server-rendered content and no skeleton — the document is empty between header and footer until the JS bundle hydrates — and four client surfaces (S
- `D1-014` /search?q=<one character> reports "0 series found — No results for 'a'", which is false: the code refuses to search queries under 2 characters and returns an empty a
- `D1-015` The 404 page renders with no header, no footer and no bottom nav — a chrome-less dead end with a single escape — and carries the homepage <title> rather than a not-f
- `D2-001` 63 of 115 dictionary keys (1,260 of 2,300 cells) are never rendered; the surfaces they were written for are hard-coded English in all 20 locales.
- `D2-004` 228 cells across 12 locales are verbatim English — the whole content.* block — contradicting the commit that claimed all 20 languages were fully translated.
- `D2-005` Arabic renders left-to-right everywhere: the deployed bundle never sets document.documentElement.dir and ships no [dir="rtl"] CSS.
- `D2-010` The feed-integrity i18n gate covers 26 of 115 keys and cannot detect an English fallback at all — proved by negative control.
- `D2-011` 52 rendered cells are untranslated English, including the sound toggle reading "On"/"Off" in six Latin-script locales.
- `D2-012` Dates and formatted numbers ignore the selected UI locale — one surface uses the browser's locale, two hard-code en-US.
- `D2-013` The Anime empty state — the named house pattern for empty routes — is hard-coded English in all 20 locales.
- `D2-015` Copy-quality defects inside otherwise-correct translations: gendered Polish, inconsistent Hindi orthography, mixed Turkish register, missing French narrow spaces.
- `D2-016` Controls and overlays carry English-only accessible names and labels with no dictionary keys.
- `D2-017` 20 locales, zero localized URLs: every server-rendered page ships lang="en" and no hreflang, so crawlers and the first paint are always English.
- `D2-018` 257 catalog content strings — every title, logline and genre — render English in all 20 locales, including inside otherwise-translated sentences.
- `D3-001` 22 of 96 show pages print the synopsis twice: SERIES_DETAIL.description begins with the catalog logline verbatim, and the page renders both as consecutive <p> elemen
- `D3-004` The $1.99 on the show page is a hard-coded string literal, not lib/price.ts. It is unguarded by the feed-integrity gate and is the only money surface in the product  **[money/rail — propose only]**
- `D3-006` Twelve user-visible strings on all 96 show pages are hard-coded English and render untranslated in 19 of 20 locales — including several for which translations alread
- `D3-008` No show page has a back affordance. A viewer who reaches a Bollywood, Español, Reality or Red-Carpet title cannot return to the tab they came from without the OS bac
- `D3-010` /series/[slug] has no route-level error.tsx and no loading.tsx, and the app has no root error boundary — so a render failure on any of the 96 show pages falls throug
- `D3-011` The "Search creators and shows" input on the Creators tab is inert: it accepts text and the page content is byte-identical before and after, because there are zero c
- `D3-012` /horizontal is an orphan page — nothing in the product links to it and it is absent from the XML sitemap — that publishes a second, stale episode list for a live sho
- `D3-013` 15 of 96 meta descriptions exceed the ~160-character SERP budget; 2 exceed 200.
- `D3-013` 62 of the 535 manifest interactive elements live in ten components that nothing imports; they are absent from the deployed bundle entirely, so no viewer can ever tap
- `D3-014` Several primary tap targets are far below a 44px thumb: the five footer social icons are 18x18, the /me/list Remove control is 56x16, and the sign-in Back and Contin
- `D3-017` The TVSeries JSON-LD on the 86 paid pages declares no offers, so the $1.99 price shown on the page is invisible to structured-data consumers.
- `D3-017` The manifest's external-link denominator is inflated: 4 of the 74 catalogued "external URLs" are not links at all but input placeholder text and one validation messa
- `D3-018` The 5 coming-soon pages assert a spoken audio language for titles that have zero footage.
- `D3-018` Two of the seven test-stream URLs in the perf harness are 404, and the Sitemap dropdown lists two different labels pointing at the same destination.
- `D4-001` The maxDevicePixelRatio half of the P1 iOS-crash fix is protected by nothing: audit-perf.ts's guard is satisfied by the explanatory comment sitting inside the same c
- `D4-010` Instant play from a poster tap — a named do-not-regress asset — covers only BrowsePage's own tiles/hero/reality/red-carpet plus the show page's Play CTA. Nine other 
- `D5-012` /api/creator/upload passes the client-controlled Origin request header straight into Mux's cors_origin for the direct-upload it creates, letting an approved creator 
- `D6-007` Ink-coloured text on accent-filled badges and pills measures 4.34:1 (#F5F4F8 on #E0115F), and white on the purple NEW badge measures 4.23:1 at 8px bold. Both are bel
- `D6-020` The category rail's aria-label sits on a role-less <div>, so assistive technology never exposes it. An aria-label on a generic element with no role is ignored.
- `D6-021` The search inputs are labelled only by their placeholder, which disappears the moment the viewer types, leaving the field with no visible or programmatic label.
- `D6-024` The <footer> reserves no space for the fixed bottom nav, so the last 73 CSS px of every page sit permanently behind it. On the home page the copyright line is never 
- `D6-025` In Arabic the Profile tab label wraps to two lines inside the bottom nav's 59px cell, making that tab 52px tall against 41px for the other four and breaking the row'
- `D6-026` components/SeriesInfoDrawer.tsx and components/SeriesInfoButton.tsx are dead code — nothing imports SeriesInfoButton — yet the manifest counts 8 interactive elements
- `D7-013` The landscape rule that is supposed to shrink the content's bottom reserve to match the shorter nav never applies, because a more specific !important rule outranks i
- `D7-014` The 404 page — which is the production outcome for 5 of the 65 route classes — ships an entirely empty <body>; every pixel of it, including the way out, is client-re
- `D7-015` `.hero-poster` is dead CSS with a stale comment: the rule exists in two media contexts and is applied to no element in the codebase, and the header/tab heights its a
- `D7-016` `* { scroll-behavior: smooth }` is applied to every element, is not disabled under prefers-reduced-motion, and silently animates every programmatic scroll.
- `S1-001` Reality tab: 3 of 4 tiles are inert and visually indistinguishable from the one that plays. Sugar Babies, Buy/Sell Miami and The Vertical Tea render as bare <div ari
- `S1-008` The category strip is only partly localized. TAB_KEYS maps 6 of the 10 browse tabs to i18n keys; anime, espanol, bollywood and creators have no key in any of the 20 
- `S1-012` Dead CSS whose stated purpose is unfulfilled: `.hero-poster` is defined twice in globals.css with a careful comment about capping the hero so the whole 9:16 flyer fi
- `S1-013` The audit's own denominator document is wrong about the catalog. docs/audit/00-manifest.json reports catalog.live = 1 and catalog.comingSoon = 0, and 00-manifest.md 
- `S1-014` Seven components in the home/browse neighbourhood are imported by nothing reachable, and the manifest counts their interactive elements in the 535 denominator — 5 of
- `S1-015` Dead conditional in the StorageBlue ad-ribbon gate: it tests `activeTab === "new"`, a BrowseCategory value that is not present in BROWSE_TABS, so that arm can never 
- `S1-016` ?tab= deep links paint the Drama tab first and swap after hydration, and the query string is not cleared when the tab changes afterwards, so the Anime empty state's 
- `S2-008` The /horizontal back control is a <button onClick={() => window.location.href = ...}>, the exact defect feed-integrity check 3 exists to prevent - and that check can
- `S2-010` /horizontal is an orphan route: nothing in the product links to it, it is absent from the sitemap, its chrome is hard-coded English, and its play buttons ignore tran
- `S2-011` Every mounted slide tears down and re-adds its timeupdate and ended listeners about four times a second for the entire watch, because the progress callbacks are inli
- `S2-013` The player and its regression gate both assert that a hard-coded free-episode count of 5 would be wrong for "seven of the ninety-one" live titles. Measured against t
- `S2-014` Stale comments assert the opposite of the shipped routing: they say every poster now opens the show page, six lines above the code that starts the instant player on 
- `S2-015` A duplicated dead statement and broken indentation in two teardown paths of the rail, the signature of an unreviewed automated edit inside the file the brief marks D
- `S2-016` The events route documents its own rate limit as the wrong tier.
- `S4-005` The /discover search dropdown has no result cap, no max-height and no scroll container, so a two-character query renders all 91 rows as a ~7,300px absolutely-positio
- `S4-008` A Devanagari query can never match: there is not one Devanagari codepoint anywhere in the catalogue's titles, genres, loglines, tags or categories. lib/text-fold.ts 
- `S4-009` The header search's no-results state is a bare grey sentence with no icon, no explanation and no action — it does not follow the house empty-state pattern the Anime 
- `S4-012` trackSearch fires on every keystroke and reports a result count that is one keystroke stale, and fires again on Enter, so the search analytics stream is dominated by
- `S4-013` Matching is raw substring with no word boundary, so short and common tokens produce results a viewer cannot explain. "goat" matches "scapegoat"; "desi" matches "Desi
- `S4-015` app/search/page.tsx:86 contains a ternary whose two branches are identical (`results.length === 1 ? "series" : "series"`). The rendered output happens to be right be
- `S5-014` The payment gate's own PASS line reports "74 unlock SKUs" while the assertion twelve hundred lines above it requires exactly 86. Anyone reading a green CI run takes  **[money/rail — propose only]**
- `S5-015` The show page hard-codes "$1.99" with nothing binding it to SERIES_UNLOCK_PRICE_CENTS, and lib/price.ts's own docblock falsely claims it is the one number the client **[money/rail — propose only]**
- `S5-018` The /amazon?p=<id> product deep link works but nothing in the app emits such a link; three source comments claim the footer Shop list points at it, and the footer's 
- `S5-019` On a 320px-wide column the Amazon tile's caption block is a fixed 52px box holding 60px of content, so the required "Not personalized" ad disclosure spills out of it
- `S5-022` The Amazon bag pill's tap target is 40px tall, under the 44px thumb minimum, and it is the only route back into the bag once the drawer is closed.
- `S5-023` The audit manifest's own catalog summary is wrong: it reports "96 rows: 1 live, 0 coming soon" in both the JSON counters and the human summary, while its own detail 
- `S6-014` /me and /me/list are marked index,follow while the sibling account page /me/purchases is noindex - personal-account URLs are advertised to crawlers.
- `S6-015` The saved-count badge on /me counts raw stored slugs while My List drops slugs that are not in the catalog, so the counter can disagree with the list it points at.
- `S6-016` The only control for removing a title from My List is a button whose visible label is 'Saved' - a state word used as an action.
- `S6-017` The guest sync prompt on the Recently Watched tab signs the viewer back into the Saved Shows tab, dropping ?tab=recent.
- `S6-018` The guest header on /me offers only 'Sign In'; there is no route to account creation from the account page, and the Sign In pill is a 36px tap target.
- `S6-019` Two inherited facts used by this audit are wrong: MEMORY.md names the retired Supabase project, and the audit manifest's catalog line says '96 rows: 1 live, 0 coming
- `S7-012` The audit manifest's own catalog summary says 1 live / 0 coming soon, contradicting its own detail array (91/5) — any agent using it as the denominator gets 1/96.
- `S7-014` "Anime" and "Creators" tab labels have no i18n key at all, so they stay English in all 20 locales while their neighbours localize.
- `S7-015` Channels: "The Carpet" renders with no description and an empty icon because it has no CHANNEL_META entry.
- `S7-016` Drama/Hot hero: the link target flips to the incoming title at the start of the 500ms crossfade, so a tap during the fade opens the poster you are still watching dis
- `S7-017` "1 episodes" on the Music tab's only title.
- `S7-018` Dead `activeTab === "new"` branch ships in the production bundle for a tab that no longer exists.
- `S8-003` Six legal and support surfaces describe VIP as a live product and tell viewers to use a Profile control that does not exist; VIP checkout is fail-closed in productio **[money/rail — propose only]**
- `S8-004` /investors states four revenue lines as the current operating model; three of the four are fail-closed in production and have never taken a payment. **[money/rail — propose only]**
- `S8-006` The Google Play listing the footer links to on every page is rated 'Everyone', while every legal page on the site says the service is 18+ only and Apple rates the sa **[money/rail — propose only]**
- `S8-008` Every footer tap target on the site is 18px tall — the five social icons are 18x18 with zero padding, the eight legal links are 18px tall with 6px between wrapped ro
- `S8-014` The Terms of Service contains no DMCA notice-and-takedown procedure, no designated agent and no repeat-infringer policy, for a service that both licenses third-party
- `S8-016` HideInIOSApp removes the App Store / Google Play buttons only after mount, so the iOS app paints a Google Play button in the footer of every page on first render. **[money/rail — propose only]**
- `S8-022` /investors heads a section 'Traction & Highlights' and shows no traction — the two 'metrics' are the strings 'Studio + platform' and 'Multiple options'.
- `S8-023` The Google Play listing is published under 'Rare Media Group'; every legal page names VERZA TV LLC as the operator of the Service.
