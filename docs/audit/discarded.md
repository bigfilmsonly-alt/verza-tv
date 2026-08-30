# Verza TV — Discarded Findings

**49 of 277 findings did not survive independent verification: a discard rate of 18%.**

This file is part of the audit's result, not its waste. A discard rate near zero
would mean the verification step was ceremonial. Phase 0 discarded 23% of its own
assertions; this run discarded 18%.

Each entry names why the finding failed.

---

### S4-010 — The search trigger is a 36×36px button — the sole entry point to search on every page — below the 44pt iOS minimum. The panel's Cancel control is a bare text node with no padding, roughly 44×20px. On 

*Raised by S4 — SEARCH. The four catalogue-search s, claimed S3*

**Why it was discarded.** DISCARDED — stale inherited fact. The code observation is roughly right; the defect it claims does not exist in the shipped Next version.

WHAT IS TRUE: /Users/jothamhall/E! CREATOR ECONOMY/verza-tv/app/error.tsx and app/global-error.tsx are both absent. Grep for ErrorBoundary / componentDidCatch / getDerivedStateFromError across app, components, lib returns nothing.

WHAT IS FALSE (three things):
1. "no error.tsx anywhere in the repository" — wrong. /Users/jothamhall/E! CREATOR ECONOMY/verza-tv/app/series/[slug]/[episode]/error.tsx exists and is a full branded boundary. The raiser used `find app -maxdepth 3`; that file is at depth 4, so their own evidence command hid it.
2. "bare production error screen with no message and no way forward — no retry, no link home" — wrong. package.json pins next 16.3.0. node_modules/next/dist/client/components/builtin/global-error.js renders a warning icon, H1 "This page couldn't load", "Reload to try again, or go back.", a Reload submit button, and a Back button: `window.history.length>1?window.history.back():window.location.href="/"`. The raiser is

---

### S8-007 — Choosing any of the 19 non-English locales sets <html lang> to that locale while the footer and all 21 legal/trust pages stay 100% English — so the document lies about its language to screen readers a

*Raised by S8 — Legal, Trust, Footer. The 21 legal/, claimed S2*

**Why it was discarded.** DISCARDED — the code shape is real but the mechanism is a misreading of React's update model, and the named trigger cannot produce the revert on the React this site actually ships.

WHAT I CONFIRMED IS TRUE
- The pattern exists in source and in production. /Users/jothamhall/E! CREATOR ECONOMY/verza-tv/components/EpisodeFeed.tsx:1571 is `activeIndexRef.current = activeIndex;` in the component body (raiser said 1573; every cited line is off by 2-10, observer is 1779-1786, handleEpisodeEnded 1728/1733, fullscreen 2232, flush 1833/1843). In the deployed bundle (fetched from www.verzatv.com, /_next/static/immutable/chunks/13rz7ciqnwv2l.js, offset 20962) it minifies to `let ed=(0,r.useRef)(!1);el.current=R;`, with the observer at offset 22741 as `ed.current=!0,t!==r&&(el.current=r,z(r),...)`. Same two writers, no third.

WHY THE REPRO AS GIVEN IS DEAD
Production runs React 19.3.0-canary-cbb046ab-20260731 (NOT the 19.2.4 in node_modules — re-check-inherited-facts catch). I installed that exact canary in a scratch harness and ran the sequence rather than reasoning about it:
1. "setEpProgress

---

### S8-009 — Google Tag Manager and AdSense load for every web visitor with no consent gate, no cookie banner, no 'Do Not Sell or Share' link and no GPC handling, while the Privacy Policy offers GDPR rights and ad

*Raised by S8 — Legal, Trust, Footer. The 21 legal/, claimed S3*

**Why it was discarded.** MISREADING OF THE CITED EVIDENCE. The raw observations all reproduce; the defect they are said to prove does not exist.

WHAT REPRODUCES (all verified):
- /Users/jothamhall/E! CREATOR ECONOMY/verza-tv/lib/catalog.ts: `grep -o 'channel: *"[^"]*"' | sort | uniq -c` returns exactly 94 "VERZA Originals" + 2 "The Carpet" = 96 rows. Parsed every row: all 6 live Bollywood (falling-for-flatmate, dil-dosa-dosti, salt-and-pepper, love-for-sale, the-breakup-podcast, reset), all 5 live Espanol, and all 5 coming_soon rows carry "VERZA Originals". The only two exceptions are exes-premiere and love-awards ("The Carpet").
- Production, HTTP 200 on https://www.verzatv.com/series/salt-and-pepper: the metadata line renders `<span class="text-xs" style="color:#6B6B7B">VERZA Originals</span>`, from app/series/[slug]/page.tsx:214-217. JSON-LD confirms `"inLanguage":"hi"`, so it is the Hindi title claimed.
- Production /channels renders "VERZA Originals — 89 shows" (91 live minus the 2 The Carpet rows).

WHY IT IS KILLED — the two evidence citations do not say what the finding says they say:
1. AGENTS.md r

---

### S8-010 — The careers contact address is rendered as plain text rather than a mailto link — the only address on the whole site that is not tappable — and the fallback it offers leads to a contact page with no c

*Raised by S8 — Legal, Trust, Footer. The 21 legal/, claimed S3*

**Why it was discarded.** DISCARDED — the observation reproduces 5/5, but it is a misreading of the rule the raiser cites, and the behaviour is deliberate and test-locked.

WHAT I DID / SAW (production, 2026-08-29)
- Fetched all 5 coming-soon show pages from www.verzatv.com. All return 200. Rendered markup (scripts stripped, not just the RSC flight payload) on /series/the-chairmans-revenge reads: title -> "Drama · Corporate power" -> "Episodes announced soon" -> "Hindi audio" -> logline. Exactly the placement claimed.
- Counts match the evidence given: "Hindi audio" x1 on the-chairmans-revenge, protected-by-the-devil, the-last-will, the-billionaires-apron; "Spanish audio" x1 on i-cant-resist-my-mansion-gardener. All 5 also carry "Episodes announced soon" and "there is nothing to play".
- JSON-LD on those pages carries TVSeries inLanguage "hi"/"es" with numberOfEpisodes 0. All 5 are <meta name="robots" content="noindex, follow">, so the machine-readable half is not indexed.
- Control: live /series/falling-for-flatmate renders "Hindi audio · English subtitles"; the coming-soon Hindi rows render "Hindi audio" on

---

### S5-006 — "Restore Purchases" is promised to customers on four deployed pages (six times on /support alone) as a control in Profile or on a Series Unlock screen. No such control exists anywhere in this reposito

*Raised by S5 — Shop and commerce. Agent C's actual, claimed S2*

**Why it was discarded.** Misreading — the raiser grepped only the web repo. Every cited string is explicitly scoped to Apple in-app purchases on iPhone/iPad, and the control exists exactly where the copy points, in the shipped native iOS app.

WHAT THE DEPLOYED COPY ACTUALLY SAYS (fetched from www.verzatv.com, HTTP 200 on all five pages):
- /support: "For an **Apple in-app purchase**, tap Restore Purchases in Profile or on a Series Unlock screen…" and "How do I restore an **Apple** Series Unlock? **On iPhone or iPad**, sign in…"
- /help: "**On iPhone or iPad**, tap Restore Purchases in Profile or on a Series Unlock screen."
- /refund-policy: the sentence sits inside the paragraph that opens "**Apple decides refund requests for Apple in-app purchases.**" (app/refund-policy/page.tsx:110-121)
- /privacy: "…reclaimed to a new VERZA account only through **Apple-verified** Restore Purchases."
None of the five promises a control on the web.

THE CONTROL EXISTS, IN BOTH NAMED PLACES, in the native app at /Users/jothamhall/verza-native (Expo, com.verzatv.app v2.0.0):
- Profile: /Users/jothamhall/verza-native/src/comp

---

### S5-007 — iOS reader-mode hides purchase UI, store links and ad scripts but leaves the entire Amazon affiliate storefront — 12 sponsored tiles, the in-app product modal, the bag, and the Amazon cart handoff — f

*Raised by S5 — Shop and commerce. Agent C's actual, claimed S2*

**Why it was discarded.** DISCARDED — the observation is true, the premise is not. Rule 11's "iOS binary" is a different codebase, and it already fails closed.

WHAT I CONFIRMED (the observation, not the defect). Live on www.verzatv.com: GET /shop = 200, 12 `tag=verzatv-20` affiliate links, 12 "View product" CTAs, 14 "Sponsored · Ad · Amazon" labels, merch grid absent (`product-grid` count 0, MERCH_CHECKOUT_ENABLED off); /amazon = 200 with the same 12 tiles. `lib/amazon-sponsors.ts` AMAZON_PRODUCTS = exactly 12 entries, 12 asins. I pulled all 13 JS chunks the live /shop references and grepped them: the chunk carrying "Add to bag" (/_next/static/immutable/chunks/0whkx-kuh5sq7.js) contains ZERO iOS markers — no `verza-platform`, no `VerzaTV-iOS`, no `standalone`. So yes, in the web app's reader mode the Amazon storefront stays fully live, gate-free, in the deployed bundle. Every fact in the evidence string checks out.

WHY IT IS NOT A DEFECT — two independent kills.

1. THE iOS BINARY IS NOT THIS REPO, AND IT ALREADY EXCLUDES AMAZON. The raiser's own surface file (docs/audit/surfaces/s5-...md:15) names the bloc

---

### S5-008 — Merch checkout is one env var away from charging cards with no fulfillment: /api/checkout has no authentication, no shipping address, no tax, and no idempotency key, and the Stripe webhook has no bran

*Raised by S5 — Shop and commerce. Agent C's actual, claimed S2*

**Why it was discarded.** The web observation reproduces; the rule-11 framing that makes it S2 is false. WHAT I REPRODUCED (live, deployed): loaded https://www.verzatv.com/?platform=ios in Chrome, confirmed localStorage verza-platform="ios" and store links gone, then /shop -> {sponsoredLabels:12, "View product":11-12, gtag:false, googletagmanager/doubleclick scripts:[], storeLinks:false}; then /amazon?platform=ios -> {iosFlag:true, tiles:11, storefront CTA present, bag present}. So yes, the affiliate storefront survives web reader mode. WHY THAT IS NOT RULE 11: rule 11 constrains "the iOS binary." The iOS binary is /Users/jothamhall/verza-native 2.0.0 build 31 -- the current App Store release (docs/RELEASE-2026-08-11.md: public Lookup and eight regional inventories served 2.0). It is NOT a WebView of verzatv.com: no react-native-webview dependency at all, playback is expo-video, and the only in-app browser targets are mailto, the creator studio, and AMAZON_STOREFRONT. In that binary the affiliate storefront is excluded by four independent gates: src/app/amazon.tsx:29 `if (Platform.OS === "ios") return <Redire

---

### S5-016 — /api/unlock, /api/checkout and /api/subscribe all share one 15-requests-per-minute per-IP bucket, because the bucket key is `${ip}:${limit}` and all three tiers use the same limit. On a shared or carr

*Raised by S5 — Shop and commerce. Agent C's actual, claimed S3*

**Why it was discarded.** Discarded: the repro does not reproduce, and the docblock claim is a misreading. Both load-bearing legs fail.

WHAT IS TRUE. app/series/[slug]/page.tsx:395 (raiser cited :359 — drifted) renders a bare "$1.99" in the Series Unlock card, and the file imports nothing from lib/price.ts. Verified in the DEPLOYED bundle, not the build: curl of https://www.verzatv.com/series/the-mistress-trap, /collateral-hearts and /under-her-control each returns the RSC payload ..."className":"text-base font-bold flex items-baseline gap-1.5","style":{"color":"#E0115F"},"children":"$$1.99" — a baked static string, not a computed value. Stripe charges SERIES_UNLOCK_PRICE_CENTS=199, so the two agree and no viewer is misled, as the raiser concedes.

WHAT KILLS IT — I RAN THE REPRO. Mirrored the repo to scratchpad (source only, node_modules/public symlinked), set SERIES_UNLOCK_PRICE_CENTS=299 in BOTH lib/price.ts:26 and lib/series-purchase.ts:9 exactly as the repro instructs, and ran both named gates:
  - test:feed-integrity -> EXIT 1. "paywall: locale-aware price formatting drifted / English must render exact

---

### S5-020 — The merch success_url /shop?success=true renders the ordinary shop page with no order confirmation of any kind.

*Raised by S5 — Shop and commerce. Agent C's actual, claimed S4*

**Why it was discarded.** Measurement reproduces on the live site; the claimed harm does not. I loaded https://www.verzatv.com/shop and https://www.verzatv.com/amazon in Chrome, constrained the Amazon grid's section to a 320px column exactly as the repro says, and measured all 12 caption divs: tileW 138, clientHeight 52, scrollHeight 60, computed overflow "visible", 8px of overhang past the button box. Those are the raiser's numbers to the pixel. Deployed HTML confirms it too: 12x style="height:52px" in both /shop and /amazon.

But nothing is harmed. (1) The "Not personalized" <p> is not clipped — I checked last.scrollHeight > last.clientHeight on every tile: false for all 12. Its rect is 13.5px tall, visibility:visible, opacity:1, and document.elementFromPoint at its center returns the element itself, so it is painted and hit-testable. (2) The 8px lands in the grid's own gap-y-5 (measured rowGap 20px), leaving 12px of clearance to the next row's tile and 20px below the last row before the next element. No collision anywhere. The raiser's own evidence string concedes this: "Nothing is clipped — overflow is vi

---

### S5-021 — /shop and /amazon both promise "one tap sends the whole bag to your Amazon cart", but a shopper not signed in to Amazon is sent to an Amazon sign-in wall instead of a cart.

*Raised by S5 — Shop and commerce. Agent C's actual, claimed S4*

**Why it was discarded.** Literally true, but unreachable — dead code behind an off flag, not a viewer-facing defect.

REPRODUCED THE STRING FACTS. app/api/checkout/route.ts:74 does set success_url to `${siteUrl}/shop?success=true`, and app/shop/page.tsx:19 `export default function ShopPage()` takes no props with no searchParams reference in the file. A repo-wide grep finds no consumer of ?success=true anywhere. On production, GET /shop and GET /shop?success=true are byte-identical: both 200, 90306 bytes, md5 5796f6df41d3b304ec60e5c5b0435d85, and the token "success" does not appear in the rendered HTML.

KILLED THE CONSEQUENCE. The merch surface is fail-closed in production, confirmed three independent ways: POST https://www.verzatv.com/api/checkout returns 503 {"error":"Official merchandise checkout is temporarily unavailable."} — verbatim the gate string at route.ts:24; the rendered /shop shows "Sponsored picks from Amazon" with zero occurrences of product-grid and no CartButton (merchEnabled false at page.tsx:20); and /shop/champion-tie-dye-hoodie and /shop/verzatv-mug both 404 (page.tsx:30 notFound()). ME

---

### S1-007 — The home route has no error state. There is no app/error.tsx and no app/global-error.tsx anywhere in the repository, so a runtime failure inside BrowsePage (a client component) drops the viewer onto N

*Raised by S1 — Discover / Home. The `/` route as s, claimed S3*

**Why it was discarded.** Misreading of the framework default, verified dead against the deployed bundle.

TRUE PART: app/error.tsx and app/global-error.tsx genuinely do not exist. `find . -path ./node_modules -prune -o \( -name error.tsx -o -name global-error.tsx -o -name loading.tsx -o -name not-found.tsx \) -print` returns exactly two files: app/not-found.tsx and app/series/[slug]/[episode]/error.tsx. `grep -rn "ErrorBoundary|componentDidCatch|getDerivedStateFromError"` over app/, components/, lib/ returns zero hits, so nothing in app/layout.tsx wraps BrowsePage either. Nothing catches a client throw on /.

THE ASSERTED EFFECT IS FALSE. The finding claims the viewer gets "Next's bare production error screen with no message and no way forward - no retry, no Browse Drama". That is Next's OLD default ("Application error: a client-side exception has occurred"). package.json pins next 16.3.0, and I checked the live bundle, not the build. The home page HTML at https://www.verzatv.com/ references /_next/static/immutable/chunks/17tuxysuvqwd2.js twice (link rel=preload as=script, and <script id="_R_" async>). I dow

---

### S1-011 — The second category strip disagrees with the first. /discover's "Browse by Category" grid renders 7 of the 10 browse tabs — Tubi, Anime and Creators are filtered out because they hold no live catalog 

*Raised by S1 — Discover / Home. The `/` route as s, claimed S4*

**Why it was discarded.** DISCARDED — the observations are accurate but the defect claim is a misreading, and its premise is false in production.

WHAT I VERIFIED (live www.verzatv.com, not the build):
- GET /discover → 200. Parsed the rendered body: the .genre-grid holds exactly 7 tiles — Drama, Hot, Español, Bollywood, Reality, Red Carpet, Music. Tubi/Anime/Creators appear nowhere in the page body. Matches the raiser.
- Cited line is real and exact: /Users/jothamhall/E! CREATOR ECONOMY/verza-tv/app/discover/page.tsx:17 — `const activeTabs = BROWSE_TABS.filter(tab => getSeriesByCategory(tab.key).length > 0);`
- Fetched all 10 browse-tab /discover/<slug> routes and parsed each rendered body for the "N live series" label and distinct /series links.

WHY IT DIES — the premise ("filtered out because they hold no live rows", implying the 7 shown ones do carry rows) is false on the live site. Of the 7 tiles that DO render:
  /discover/drama       32 live series, 32 links
  /discover/popular      0 live series, "No hot series yet."
  /discover/espanol      0 live series, "No español series yet."
  /discover/bollywo

---

### S7-002 — Creators promises a four-step pipeline (upload -> channel goes live -> viewers unlock -> you get paid) that is fail-closed at two points in production.

*Raised by S7 — SECTIONS. The 10 browse tabs (Drama, claimed S2*

**Why it was discarded.** Reproduced every raw observation, then killed the characterization. Both "fail-closed points" are unreachable by any user, and one of the three evidence items is not a failure at all.

WHAT REPRODUCED (production, 2026-08-29):
- `curl -X POST https://www.verzatv.com/api/mux/webhook -d '{}'` -> HTTP 503 `{"error":"Webhook verification unavailable"}`. Good oracle: app/api/mux/webhook/route.ts returns 503 only when MUX_WEBHOOK_SECRET is absent (a set-but-unsigned request would fall through to `mux.webhooks.unwrap` -> 400 "Invalid payload"). So the secret is genuinely unprovisioned.
- `GET /api/creator/channels` -> HTTP 200 `{"channels":[]}`.
- app/api/creator-unlock/route.ts is an unconditional 503 "Creator purchases are temporarily unavailable".
- The copy is really shipped: I pulled the 14 chunks off `/?tab=creators` and found the strings verbatim in /_next/static/immutable/chunks/1aseb4gggkekc.js — `["Build your channel","Set your banner, avatar and bio. Your channel goes live with your titles on it."],["Earn","Viewers unlock your work and you get paid. Commercial terms are shared wi

---

### S7-003 — Tubi: the panel's only user-visible sponsorship disclosure renders outside the visible screen on desktop and the page cannot scroll to it.

*Raised by S7 — SECTIONS. The 10 browse tabs (Drama, claimed S2*

**Why it was discarded.** Misreading of the desktop scroll container. Reproduced on production at the raiser's viewport class (innerH 673 vs their 667, desktop phone frame). Their at-rest geometry is right: .device-screen bottom 560 (they said 554), section height 469 = innerH-204 (so calc(100dvh-108px-96px) is genuinely live), and the disclosure <p> "Streaming free on Tubi. Verza sponsored partner." sits at top 571 / bottom 587, i.e. just below the fold at first paint.

The load-bearing claim — "the page does not scroll" / "never visible" — is false. .device-screen reports scrollHeight 996 vs clientHeight 537: 459px of scroll. On desktop THAT is the scroller, not the document; the repo documents it at components/ScrollToTop.tsx:8-16 and components/BrowsePage.tsx:400, and body is overflow:hidden on desktop by design. Their evidence used document.documentElement.scrollHeight === window.innerHeight, which is the wrong element. A real wheel gesture inside the frame (10 ticks at 320,250) moved scrollTop 0 -> 460 (max 459) while staying on the Tubi tab, and at scrollTop 200 I screenshotted the full Tubi wordmark a

---

### S7-004 — Tab rail: the active-section indicator sits off-screen on every section past the third, so the viewer cannot tell which section they are in. CONFOUNDED — re-verify in a foreground browser before actin

*Raised by S7 — SECTIONS. The 10 browse tabs (Drama, claimed S3*

**Why it was discarded.** Measurement artifact of a hidden/background browser tab. The fix is already deployed and works; a real (visible) viewer sees the rail scroll the active tab into view.

1) THE FIX IS IN THE DEPLOYED BUNDLE, not just the build. Fetched https://www.verzatv.com/?tab=red-carpet and pulled every chunk it references. /_next/static/immutable/chunks/1aseb4gggkekc.js (dpl_FEduFW6ftQZyapPx28PouXp55wk3) contains the centring effect verbatim: `let a=s.left-l.left-(t.clientWidth-s.width)/2;t.scrollBy({left:a,behavior:window.matchMedia?.("(prefers-reduced-motion: reduce)").matches?"instant":"smooth"})`, keyed on [active], next to aria-label="Categories". Source: /Users/jothamhall/E! CREATOR ECONOMY/verza-tv/components/CategoryTabs.tsx:104-134 (clean working tree).

2) I REPRODUCED THE RAISER'S EXACT GEOMETRY AND THEIR EXACT SYMPTOM. Live rail measured left 106 / right 500 / width 394, maxScroll 606 — matching their "rail right 500", "606 max". Screenshot ss_92471uopd of /?tab=red-carpet shows precisely what they describe: rail reading "DRAMA HOT [tubi] ANIME ESPAÑO…", no pink label, no underline, w

---

### S7-007 — Music is a single unlabelled poster with zero text — no heading, no title, no episode count — and there is no storage-company advert on it.

*Raised by S7 — SECTIONS. The 10 browse tabs (Drama, claimed S3*

**Why it was discarded.** DISCARDED — the DOM measurements reproduce exactly, but every conclusion drawn from them is refuted by what the viewer actually sees. Classic string-matching-instead-of-real-data failure.

WHAT I DID. Fetched the deployed bundle from www.verzatv.com (chunk /_next/static/immutable/chunks/1aseb4gggkekc.js) and confirmed the shipped music branch is `"music"===v&&<div><div className="relative pt-4"><Link href={posterHref("too-much-junk")}...><Image src="/posters/too-much-junk.jpg" alt="Too Much Junk" .../></Link></div></div>` — nothing else. Then loaded www.verzatv.com in Chrome as a signed-out guest and clicked the MUSIC tab. Reproduced the raiser's numbers verbatim: `.tab-slide-inner` innerText === "" (length 0); exactly one anchor, /series/too-much-junk/1; one img alt="Too Much Junk" at 320x480; `a[href*="storageblue"]`.length === 0.

WHY IT IS STILL WRONG. I then downloaded https://www.verzatv.com/posters/too-much-junk.jpg (941x1672) and looked at it, and screenshotted the live tab. The poster prints, in this order and at this prominence: "TOO MUCH JUNK?!" as the largest type on the 

---

### S7-013 — The Español/Bollywood New-badge fix is inert: every live tile on both tabs still carries NEW, and the Trending shelf never renders there.

*Raised by S7 — SECTIONS. The 10 browse tabs (Drama, claimed S4*

**Why it was discarded.** The observation reproduces exactly; the characterization ("the fix is inert") does not. This is the documented, intended output of the positional badge rule.

WHAT I DID AND SAW

1. Deployed bundle (not the build). Pulled every chunk off https://www.verzatv.com. The badge logic lives verbatim in /_next/static/immutable/chunks/1aseb4gggkekc.js:
   A=new Set(["drama","espanol","bollywood"])                       // NEW_BADGE_TABS
   el=O.filter(e=>"live"===e.status).length>=4                      // badgesApply
   i=el&&!l&&(a?r>=6&&r<9:"popular"===v&&r<3)                       // trending
   el&&!l&&a&&r<6&&(0,t.jsx)(R,{type:"new",large:er})               // isNew
   if("popular"===v||e.length<=12)return t(e)  with  t=e=>[...live,...non-live]
   So NEW_SLOTS=6 / TRENDING 6..9 / playable-first / curated-max-12 are all genuinely shipped, matching components/BrowsePage.tsx:98-113, :130, :1136-1143.

2. Real catalog data, not string matching. Deployed catalog chunk /_next/static/immutable/chunks/12o29nrz06ckg.js: espanol = 5 live + 1 coming_soon; bollywood = 6 live + 4 coming_soon. Matche

---

### S2-005 — /shorts has no loading, empty or error state - it renders literally nothing until a client effect populates the list, and renders nothing forever if the list is ever empty.

*Raised by S2 — PLAYER / SHORTS: the vertical rail , claimed S3*

**Why it was discarded.** The code citations are exact, but every claimed user-visible harm fails to reproduce. Both branches of the repro are false.

WHAT IS TRUE (source + deployed HTML): components/ShortsFeed.tsx:422 is `if (shuffled.length === 0) return null;`, `shuffled` starts `[]` at :161, and is populated only inside a useEffect at :229-236. `curl https://www.verzatv.com/shorts` returns 200 / 87,451 bytes containing 0 `episode-immersive` and 0 `<video>`. /shorts is also the only player route whose shell is missing server-side (/series/collateral-hearts/1 ships 1 `episode-immersive`; /horizontal ships 14 `<video>`).

BRANCH 1 — "renders nothing forever if the list is ever empty" — UNREACHABLE. The filter is `freeEpisodes >= 1 && getPlayback(s.slug, 1)?.playbackId` against lib/mux-public-map.ts. I parsed that file: all 91 slug blocks (91/91) carry a public `{ episode: 1, playbackId: ... }`. Catalog freeEpisodes: 86 rows at 5, plus 1/12/13/14/58 = 91 live rows >= 1; the only five zeros are the coming_soon rows that getLiveSeries() already excludes. The filter yields 91, sliced to 15. The empty list canno

---

### S2-007 — components/Player.tsx (1,156 lines) and components/CoinPaywall.tsx (170 lines) are unreachable dead code carrying live checkout calls, hard-coded English $1.99 pricing and no iOS gate - and a porting 

*Raised by S2 — PLAYER / SHORTS: the vertical rail , claimed S3*

**Why it was discarded.** DISCARDED — every factual claim is true, but the finding does not reproduce as a defect at any tier of the rubric, because the code is not in the deployed bundle.

WHAT I CONFIRMED AT SOURCE (all five claims accurate):
1. Unreachable. No static import of `/Users/jothamhall/E! CREATOR ECONOMY/verza-tv/components/Player.tsx` or `.../components/CoinPaywall.tsx` anywhere in app/, components/, lib/, hooks/. No dynamic `import()` either — the only dynamic imports in the repo are hls.js and `@/lib/supabase/server`. The episode route `app/series/[slug]/[episode]/page.tsx:4` renders EpisodeFeed; `app/watch/[...slug]/page.tsx:5` renders CreatorWatch. The ONLY non-doc references repo-wide are inside `docs/audit/00-manifest.json` — i.e. the audit crawler indexed two dead files as if they were live surfaces.
2. Live checkout calls present: Player.tsx:950 and CoinPaywall.tsx:52 both `fetch("/api/unlock")`.
3. Hard-coded unlocalized price present: Player.tsx:986 and CoinPaywall.tsx:142 both render the literal `Series Unlock — $1.99 one-time`.
4. No iOS gate: neither imports `isIOSApp`. The live pay

---

### S2-012 — activeIndexRef is written during render as well as by the IntersectionObserver, so an unrelated re-render between the observer's write and its committed state can silently revert the rail's idea of wh

*Raised by S2 — PLAYER / SHORTS: the vertical rail , claimed S3*

**Why it was discarded.** The central claim — "EVERY mounted slide tears down and re-adds its timeupdate and ended listeners about four times a second" — is false. The effect opens with a guard the raiser did not read.

WHAT I CHECKED
Source: components/EpisodeFeed.tsx:934-1003. The raiser's line refs are accurate but incomplete. The effect's first statement is `if (!isActive) return;` (line 935), BEFORE `videoRef.current` is touched. Inactive slides re-run the effect body and immediately bail — they never call addEventListener at all, and have no cleanup.

Deployed bundle (not the build): fetched https://www.verzatv.com/series/collateral-hearts/1, pulled its 16 chunks, found the code in /_next/static/immutable/chunks/27_6kgf3tx4s2.js. Shipped shape matches source exactly — deps `[l,a,e.number,m,b,y]` (= isActive, seriesSlug, episode.number, onEnded, onProgress, onPosition), props `onProgress:a===A?ee:()=>{}` and `onPosition:a===A?e=>{ew.current=e}:()=>{}`, guard `if(!l)return`, progress bar `width:${100*Q}%` where `[Q,ee]=useState(0)`. onEnded (`handleEpisodeEnded`, deps `[episodes.length]`) and tryPlay (dep

---

### D2-014 — lib/price.ts documents a disambiguation guarantee that Intl does not provide: six locales render a bare "$".

*Raised by D2 — Localization. All 20 locales x all , claimed S4*

**Why it was discarded.** MISREADING. The measurement reproduces perfectly; the defect inferred from it does not exist.

WHAT I RAN. `node -e` over all 20 locales in lib/i18n.ts (en es fr pt de it ja ko zh hi ar ru tr pl nl th vi id tl sw), Node v24.13.0 with full ICU, `new Intl.NumberFormat(l,{style:"currency",currency:"USD",minimumFractionDigits:2,maximumFractionDigits:2}).formatToParts(1.99)`, reading the `currency` part. Result is byte-for-byte what the raiser reported: en "$", de "$", ja "$", hi "$", ru "$", tr "$", tl "$" (tl resolves to `fil`, verified via resolvedOptions); the other 13 give "US$", "$US" or "USD". The three examples the comment cites reproduce exactly: en "$1.99", es "1,99 US$", pt "US$ 1,99".

DEPLOYED, NOT JUST BUILT. lib/price.ts is only two days old (commit 9b2fc27, 2026-08-29), so I confirmed it is live before judging it. Fetched https://www.verzatv.com/series/the-mistress-trap/1 (200), pulled its 16 chunks, and found formatMoney minified verbatim in /_next/static/immutable/chunks/428d7hhx0m19l.js: `function p(e,a,o="USD"){let n=a/100;try{return new Intl.NumberFormat(e,{style:"cur

---

### D2-019 — interpolate() substitutes raw String(n), so every injected number bypasses locale digit grouping and numbering systems.

*Raised by D2 — Localization. All 20 locales x all , claimed S4*

**Why it was discarded.** The code fact is real; the claimed EFFECT does not reproduce anywhere, and the raiser's own evidence concedes it ("Impact today is nil").

What I verified in the DEPLOYED bundle (not the build). Fetched https://www.verzatv.com/series/married-to-a-stranger/1 (200) and pulled all 16 shipped chunks. interpolate ships exactly as alleged, in /_next/static/immutable/chunks/428d7hhx0m19l.js: `function l(e,a){return e.replace(/\{(\w+)\}/g,(e,o)=>Object.hasOwn(a,o)?String(a[o]):e)}`. The paywall call site ships in 27_6kgf3tx4s2.js as `K("paywall.benefitEpisodes",{count:x})` — x is a raw number. So the assignment is confirmed.

The effect is not. The repro says "in hi renders Western 62; the same page's price renders through Intl. Two different number policies on one screen." I ran the two policies side by side in the live browser on the verzatv.com origin (Chrome 151), for all 20 locales in lib/i18n.ts:6-9, against the real paywall inputs:
  - Intl.NumberFormat(l).resolvedOptions().numberingSystem === "latn" for ALL 20 locales, including hi and ar.
  - Intl.NumberFormat(l).format(62) vs Strin

---

### D5-001 — The complete Mux playback map — including 3,798 currently-paid playback IDs across 75 live series — is published in a PUBLIC GitHub repository, and every one of those IDs streams real video from Mux w

*Raised by D5 — Security. Every security-relevant s, claimed S1*

**Why it was discarded.** The mechanism is real; the defect is not. The repro does not reproduce, one of the two cited call sites is mis-cited, and both hypothetical triggers are unreachable.

WHAT I CONFIRMED (deployed bundle, not the build). Fetched https://www.verzatv.com/series/married-to-a-stranger and pulled all 13 chunks. chunks/428d7hhx0m19l.js carries both halves verbatim: interpolate ships as `e.replace(/\{(\w+)\}/g,(e,o)=>Object.hasOwn(a,o)?String(a[o]):e)` and formatMoney ships as `new Intl.NumberFormat(e,{style:"currency",...})`. So yes, one path is String() and the other is Intl. That much is accurate.

WHY IT IS NOT A DEFECT. I lifted those two shipped functions out of the bundle verbatim, extracted all 20 shipped `paywall.benefitEpisodes` and `paywall.cta` dictionary strings from the same chunk, and rendered the real paywall at the maximum possible input (totalEpisodes = 62). Divergence in 0 of 20 locales. The repro's own example, hi, renders `सभी 62 एपिसोड, तुरंत` beside the price `$1.99` — both latn. `Intl.NumberFormat('hi').format(62)` is also "62", so the "two different number policies on 

---

### D5-006 — lib/supabase/server.ts, the service-role client factory, is the only privileged module in lib/ without the `import "server-only"` sentinel, so nothing prevents a client component from importing getSer

*Raised by D5 — Security. Every security-relevant s, claimed S1*

**Why it was discarded.** Filed S1 but the raiser's own evidence field disclaims it ("the service-role key cannot leak this way"), and the deployed bundle confirms that. No effect reproduces.

TRUE: lib/supabase/server.ts is 8 lines with no `import "server-only"`.

FALSE — the summary's central claim. It calls this "the only privileged module in lib/ without the sentinel." Eight modules that call getServiceClient() lack it: lib/supabase/server.ts, lib/supabase/middleware.ts, lib/auth.ts, lib/vip.ts, lib/vip-server.ts, lib/analytics/partner.ts, lib/analytics/reporting.ts, lib/analytics/content-performance.ts. Count also off: 34 lib modules carry the sentinel, not 32. `server-only` is not in package.json (resolves via Next's bundled copy).

NO EFFECT, verified against www.verzatv.com per the deployed-bundle rule. Reproduced the importer check independently: 68 "use client" files, zero import @/lib/supabase/server directly. A transitive reverse-dependency walk surfaced two client components (app/reset-password/ResetPasswordClient.tsx, components/ProfileDynamic.tsx), but both chains pass through app/actions/auth.

---

### D5-010 — /discover/[genre] has no notFound() guard, so any attacker-chosen string becomes a live, indexable page on www.verzatv.com with the attacker's text in <title>, <h1>, og:title and the JSON-LD breadcrum

*Raised by D5 — Security. Every security-relevant s, claimed S1*

**Why it was discarded.** Misreading of Postgres column-privilege semantics, on a file that is not in production. The one true part is a stale code comment.

WHAT I CONFIRMED (the factual half): 016:96-99 does say the 005 policies "Creators read own profile" / "Creators update own profile" "remain in force", and 011:41 is `drop policy if exists "Creators update own profile" on public.creators;` followed by 011:42-43 `revoke all ... grant select on table public.creators to authenticated;`. I grepped every policy/grant statement touching public.creators across all 17 migrations: 005:107 (select), 005:109 (update), 011:41 (drop of the update policy), 016:114 (revoke). No migration ever re-creates an UPDATE policy. So the comment at 016:97-99 is stale and the 016:115-124 column grant is inert. That much is real, and it is a comment fix — S4.

WHY THE S1 FAILS — four independent reasons:

1. NOT IN PRODUCTION. 016 line 22, in the file's own header: "Additive + idempotent. NOT yet applied to the live database (branch review pending)." supabase/migrations/README.md lists 009-014 as applied and read back, plus 015, a

---

### D5-013 — Admin authorization is a hard-coded email allowlist, and lib/admin.ts is published verbatim in the public GitHub repository — so the exact three accounts that hold full admin over the review queue, cr

*Raised by D5 — Security. Every security-relevant s, claimed S1*

**Why it was discarded.** DISCARDED — the code reads exactly as described, but the claimed effect does not exist. Reflected-Origin pattern-matched at the source without checking the sink.

WHAT I CONFIRMED (the raiser read the code correctly):
/Users/jothamhall/E! CREATOR ECONOMY/verza-tv/app/api/creator/upload/route.ts:60-63 does take `req.headers.get("origin")` verbatim and pass it at :66 to createDirectUpload, and /Users/jothamhall/E! CREATOR ECONOMY/verza-tv/lib/mux-upload.ts:45-46 does set it as Mux `cors_origin`. That much is real.

INHERITED FACT RE-CHECKED AND FOUND STALE: MEMORY.md lists "Provision Mux upload token (MUX_TOKEN_ID + MUX_TOKEN_SECRET)" as PENDING, which would have made this 503 at route.ts:22 before ever reaching the origin code. `npx vercel env ls production` shows MUX_TOKEN_ID and MUX_TOKEN_SECRET both present as Production secrets, 71d old. muxConfigured() passes and the path IS live. I could NOT discard on reachability — I discard on effect.

WHY THE EFFECT IS ZERO — VERIFIED, NOT ASSUMED:
1. cors_origin is not an access control. A Mux direct-upload URL is itself the bearer capabili

---

### D1-001 — Free-episode player has NO error state for an HLS load failure: the poster (or a black frame on posterless episodes) is held indefinitely with no spinner, no message and no retry. The NETWORK_ERROR br

*Raised by D1 — STATES: loading, empty, error, skel, claimed S1*

**Why it was discarded.** The counting is right; the security claim behind it is not. Filed S1 ("exposes data") on a string-match — 11 revoke lines vs 12 definer functions — with no effect behind it. I built the schema on a real Postgres and proved the grant it names cannot be exercised by anyone.

WHAT IS TRUE. 12 `security definer` hits across supabase/migrations/*.sql, 11 `revoke all on function` lines; the odd one out is `public.handle_new_user()` at 008_reconcile_live_schema.sql:56-72. No migration revokes it. Confirmed on a PostgreSQL 18.3 engine (PGlite in scratchpad, repo untouched, `git status` clean): after creating the function verbatim from 008, `pg_proc.proacl` is NULL (default = EXECUTE to PUBLIC), `prosecdef` = true, and `has_function_privilege('public','public.handle_new_user()','EXECUTE')` returns **true**. PUBLIC does hold EXECUTE.

WHY IT IS NOT S1 — the grant is unusable. `handle_new_user()` is the only one of the 12 that `returns trigger`. Every attempt to spend that EXECUTE failed at the engine, not at the ACL:
  set role anon;          select public.handle_new_user();  -> ERROR: trigger

---

### D1-002 — The only error state the episode player actually has (sourceError + "Try again") is unreachable in production and has never rendered for any viewer: it fires only for an ENTITLED viewer of a paid epis

*Raised by D1 — STATES: loading, empty, error, skel, claimed S2*

**Why it was discarded.** STALE / MISREADING — the claim is refuted by the deployed bundle. The raiser cited only ONE of THREE setSourceError call sites in components/EpisodeFeed.tsx. The other two are not gated on requiresAuthorization or entitlement at all, and both fire on FREE episodes 1-5, which every unentitled visitor watches.

Verified in the DEPLOYED chunk https://www.verzatv.com/_next/static/immutable/chunks/27_6kgf3tx4s2.js (dpl_FEduFW6ftQZyapPx28PouXp55wk3), minified (eo=setSourceError, l=isActive, L=blocked, eb=hlsUrl, ei=sourceError):
 (1) source watchdog — `useEffect(()=>{if(!l||L||eb||ei)return;let e=setTimeout(()=>{eo({status:0,message:"We could not load this episode."})},12e3)...` — no auth gate. Source: EpisodeFeed.tsx:644-650.
 (2) stall/media-error escalation attached to the slide's own <video> — `if(!e||!l||L)return; ... addEventListener("waiting",s)/("stalled",s)/("error",s) ... setTimeout(()=>{...eo(e=>e??{status:0,message:"This episode will not play."})},2e4)` — gated only on isActive && !blocked. Source: EpisodeFeed.tsx:665-710.
 (3) the /api/playback catch the raiser cited (EpisodeF

---

### D1-003 — /me/list (both tabs) and /library "My List" render the EMPTY state on an API error. A signed-in viewer with saved shows and watch history is told "No saved shows yet" / "Nothing watched yet" during an

*Raised by D1 — STATES: loading, empty, error, skel, claimed S2*

**Why it was discarded.** DISCARDED — stale. The raiser read only two of the four things that set `sourceError` and missed the two watchdogs that fire for ordinary logged-out viewers on FREE episodes. Reproduced the OPPOSITE on production.

LIVE REPRO (www.verzatv.com, not a build). New Chrome tab -> https://www.verzatv.com/series/the-mistress-trap/1 (episode 1 = free, requiresAuthorization false, blocked false). First confirmed the session is the exact viewer the finding says can never see this: `fetch('/api/access?slug=the-mistress-trap')` returned `{"full":false}` — not VIP, no entitlement, no purchase. Neutralised only the harness artifact (`document.hidden` was true because the MCP tab group is not the foreground window; the app deliberately suppresses the error on a hidden document, which is not what the finding is about), then broke the media pipeline. The browser itself fired real `waiting@236ms`, `stalled@3234ms`, `waiting@10962ms`. At t=32.957s the `role="alert"` overlay rendered, verbatim:
  "This episode will not play. / This is a playback problem on our side, not something you did. / Try again / 

---

### D1-009 — No client fetch outside the player has a timeout or AbortController, so a hung request pins the surface in its loading state forever with no escape.

*Raised by D1 — STATES: loading, empty, error, skel, claimed S3*

**Why it was discarded.** The code fact is true; the effect claim is not, and both of its operative words fail against the deployed site.

WHAT IS TRUE. `grep -rnE "AbortController|AbortSignal|signal:" components/ lib/ app/` returns exactly five hits: components/EpisodeFeed.tsx:1327, :1344, :1359 and lib/playback-client.ts:143, :150. No client fetch outside the player carries a timeout. Confirmed.

"NO ESCAPE" IS FALSE. I fetched https://www.verzatv.com/studio with plain curl — no interception — and parsed the response. The loading state ships 21 real `<a href>` anchors: the entire bottom nav (/, /shorts, /shop, /library, /me), the header, and the footer sitemap (/support, /terms, /privacy, /refund-policy, /help, /press, /about). app/layout.tsx:146-152 wraps `{children}` in Header + Footer + BottomNav, and BottomNav.tsx uses next/link, so these are plain anchors that navigate even with hydration or a fetch hung. Escape is one tap, always. There is no trap.

"FOREVER" IS FALSE. The trigger is a monkeypatched `window.fetch` returning a never-settling promise — a condition the site cannot experience, not a netwo

---

### D1-010 — /forgot-password has no error state and always claims success. The action redirects to ?sent=1 unconditionally; the send runs fire-and-forget with a bare catch, so if generateLink returns no token or 

*Raised by D1 — STATES: loading, empty, error, skel, claimed S3*

**Why it was discarded.** Misreading of a deliberate anti-enumeration design; the repro exercises a URL no code path produces.

WHAT I CONFIRMED (the raw observations are accurate): live fetches show /forgot-password?error=x renders visible text byte-identical to /forgot-password ("Forgot your password? Enter your email and we will send you a link to set a new one. Email address Send Reset Link Remembered it? Sign In") with no notice, while /sign-in?error=x renders "We couldn't complete that. Check your details and try again. / Reset your password". /forgot-password?sent=1 renders "Check your inbox. If an account exists for that email, we just sent a link to reset your password."

WHY IT IS STILL NOT A DEFECT:

(1) Nothing ever sends a viewer to /forgot-password?error=. grep -rn "forgot-password" over the repo returns exactly one redirect carrying a query string: app/actions/auth.ts:133 -> redirect("/forgot-password?sent=1"). The auditor hand-crafted ?error=x and then reported the page for not honoring a parameter no code emits. The /sign-in comparison is apples-to-oranges: signInAction and updatePassword DO 

---

### D1-011 — The shared rate-limit bucket lets ordinary traffic on one API surface a 429 on unrelated APIs — and because the saved-list and watch-progress surfaces treat any non-ok response as "empty" (D1-003), a 

*Raised by D1 — STATES: loading, empty, error, skel, claimed S3*

**Why it was discarded.** Misreading, and a repro against a URL the product never generates.

WHAT I DID. Read app/forgot-password/page.tsx, app/actions/auth.ts, components/AuthErrorNotice.tsx, lib/email.ts. Fetched four live pages from www.verzatv.com (/forgot-password, /forgot-password?error=x, /forgot-password?sent=1, /sign-in?error=x, all 200) and stripped them to visible text. Grepped app/ lib/ components/ for every reference to forgot-password and every ?error= redirect target.

CLAIM 1 FAILS — "always claims success". Live /forgot-password?sent=1 renders: "Check your inbox — If an account exists for that email, we just sent a link to reset your password. It expires soon, so use it while it is fresh." That is a conditional, not a success claim, and it is the deployed text (matches repo source byte for byte, so the build is not stale). app/actions/auth.ts:100-104 documents the intent in comments: the response is uniform whether or not an account exists so the BODY cannot enumerate users, and link generation + send are pushed into after() so the redirect returns at the same SPEED either way, closing the t

---

### D1-016 — Three route families in the manifest can only ever render 404: /c/[slug] (the clip list is a hard-coded empty array), /watch/[...slug] and /[handle] (no creator channel is published). Their populated,

*Raised by D1 — STATES: loading, empty, error, skel, claimed S3*

**Why it was discarded.** Refuted on every count in a real browser on the live domain. The raiser verified the transport, not the effect.

WHAT I DID
1. Reproduced the raiser's exact repro: `curl -s https://www.verzatv.com/nope` (HTTP 404, 31,243 bytes) vs `/about` (HTTP 200, 60,702 bytes). Their raw string counts replicate exactly: on /nope `<header`=0, `<footer`=0, `<nav`=0, `Sitemap`=0, `Shorts`=0; `<title>VERZA TV — Microdramas, Reality &amp; More</title>`.
2. Stripped `<script>`/`<noscript>` from each body. /nope's body-minus-scripts is 58 bytes — literally `<body><div hidden=""><!--$--><!--/$--></div></body></html>`. There is no server-rendered DOM AT ALL on the 404 response, not "no header/footer". /about's is 17,805 bytes. So grep on curl output cannot find any tag on /nope, chrome or otherwise — the raiser's method could only ever have returned zero.
3. Read the RSC flight payload embedded in /nope. It carries the complete root-layout tree: `device-frame` → `device-screen` → `app-shell` → `$Lb` (Header), `main` with the notFound section, a literal `"footer"` element with the full sitemap, and `device

---

### D1-017 — /series/<slug>/1.5 and /series/<slug>/01 return HTTP 200 as duplicate renders of episode 1 rather than 404, unlike every other malformed episode parameter.

*Raised by D1 — STATES: loading, empty, error, skel, claimed S4*

**Why it was discarded.** Misreading of the code, disproved in production.

/c/[slug] — FALSE, and this is the finding's headline. app/c/[slug]/page.tsx gates notFound() on `if (!series)` (line 157), NOT on `if (!clip)`. The empty `const CLIPS: Clip[] = []` only disables the registry path; lines 146-152 are a documented fallback ("/* Fallback: treat slug as seriesSlug--episodeNumber */") that parses the slug into seriesSlug + episode. Fetched from www.verzatv.com: /c/the-mistress-trap--1 -> 200 "The Escort They Framed — Episode 1 | VERZA TV"; /c/blood-contract--4 -> 200; /c/the-blackthornes--1 -> 200; /c/cleopatra--2 -> 200; /c/reset--1 and /c/the-last-will--1 (coming-soon rows) -> 200; /c/the-mistress-trap (no `--`, defaults to ep 1) -> 200. Only /c/not-a-real-show--1 and /c/anything 404 — correct behavior for a slug resolving to no series. The 200 page is fully populated: real Mux thumbnail (playback id BbnqVaxO3wZAy02p00AZ9B3Oa97OZIoRCJgJUwtA2Ggi8), VideoObject JSON-LD, and a working "Watch the Full Episode" CTA to /series/the-mistress-trap/1. The `seriesSlug--n` format is a live convention (lib/playback-c

---

### D4-003 — public/posters-backup-20260617/ — 77 PNGs totalling 147.8 MB — is committed to git, uploaded on every deploy, and publicly fetchable in production with cache-control: max-age=0, must-revalidate.

*Raised by D4 — Performance and memory. Rendition c, claimed S3*

**Why it was discarded.** Ran the finding's exact repro against production in desktop Chrome and it did not reproduce. The premise is false: no wheel gesture, of any size, ever travels more than one slide.

PRECONDITIONS CHECKED (all true): lib/catalog.ts:115 "the-dumb-billionaire-heiress-in-love" (A Fortune to Die For), freeEpisodes 58 >= episodeCount, 50 rows in lib/mux-map.ts. Live DOM confirms a wholly-free 50-slide rail: scrollHeight 28699 / clientHeight 574 = 50.00, overlay "EP n / 50". The adjacency guard cited is real and deployed - components/EpisodeFeed.tsx:1781 (the finding says 1780, off by one): `if (!firstSettle && prev !== idx && Math.abs(idx - prev) > 1) continue;`.

WHY THE MECHANISM CANNOT FIRE: the container is `scrollSnapType: "y mandatory"` (components/EpisodeFeed.tsx:2083) and EVERY mounted slide carries `scrollSnapStop: "always"` (components/EpisodeFeed.tsx:2118 and :2124). Chrome therefore caps each scrolling operation at the very next snap position, so the non-adjacent index the guard rejects never gets produced. `git log -S scrollSnapStop` shows snap-stop landed in the original feed 

---

### D4-005 — hls.js (498 KB raw / 157 KB brotli) is eagerly imported on the browse page for every visitor on a 0ms timer, including the majority who never tap a video.

*Raised by D4 — Performance and memory. Rendition c, claimed S3*

**Why it was discarded.** Misfiled DO-NOT-REGRESS asset: this IS "instant play from a poster tap". Facts all reproduce, the defect framing does not.

VERIFIED IN THE DEPLOYED BUNDLE (www.verzatv.com, not the build):
- Home chunk /_next/static/immutable/chunks/1aseb4gggkekc.js contains, at module scope, `setTimeout(()=>{e.A(70308).catch(()=>{})},0);`
- Module 70308 => `static/immutable/chunks/0394rxul_bkiz.js`, content-length 511,717 B identity, 160,990 B with content-encoding: br, and it is hls.js 1.6.16 (string "1.6.16" + "hls.js" in the chunk).
- Chrome on https://www.verzatv.com/ with no video tapped: performance.getEntriesByType('resource') shows 0394rxul_bkiz.js, initiatorType "script", startTime 184 ms, decodedBodySize 511,717, encodedBodySize 160,990. hlsFetched true.
- 14 home static chunks = 1,141,026 B identity / 346,477 B br (raiser said 1,114 KB / 338 KB - correct). +hls = 1,652,743 raw / 507,467 br, i.e. the raiser's "~1.6 MB raw / ~495 KB br" is right.
Every number in the finding is accurate. It is the characterization as a defect that fails.

WHY DISCARDED:
1. The import is the mechanism behind

---

### D4-006 — Four hls.js construction sites sit outside every perf guard's file list; two of them repeat the exact P1 shape (capLevelToPlayerSize: true with no maxDevicePixelRatio, which never binds at DPR > 1) an

*Raised by D4 — Performance and memory. Rendition c, claimed S3*

**Why it was discarded.** String facts true, effect nil — every uncovered site is dead or unreachable code.

VERIFIED AS WRITTEN: grep -rn 'new Hls(' app components lib returns 10 sites. scripts/audit-perf.ts:150-156 lists only EpisodeFeed, HorizontalFeed, ShortsFeed, instant-player. components/Player.tsx:155 and :590 both set capLevelToPlayerSize:true with no maxDevicePixelRatio. components/CreatorWatch.tsx:84 is `const hls = new Hls();`. hls.js 1.6.16 does default maxDevicePixelRatio: Number.POSITIVE_INFINITY (node_modules/hls.js/dist/hls.mjs:31273) and computes Math.min(pixelRatio, config.maxDevicePixelRatio) at :20175.

WHY IT DIES ON EFFECT:
1. components/Player.tsx — the finding's two headline "exact P1 shape" sites — is ORPHANED. No module in app/, components/, or lib/ imports it statically or dynamically. Its unique string "Please try Chrome, Safari, or Firefox" appears in ZERO files across the entire local .next build and zero deployed chunks fetched from www.verzatv.com. The presence test is sound: CreatorWatch's marker ("iOS Safari native HLS") IS in .next/server/chunks, and capLevelToPlayerSize IS

---

### D4-007 — /api/checkout, /api/unlock and /api/subscribe share one rate-limit bucket, and /api/push/send shares one with /api/auth/*, because the bucket key is `${ip}:${limit}` and those tiers were given equal l

*Raised by D4 — Performance and memory. Rendition c, claimed S3*

**Why it was discarded.** DISCARDED — the two "P1 shape" sites are in DEAD CODE that does not ship, the count is wrong, and "never read by any guard" is false.

WHAT CHECKS OUT (repo clean at HEAD 197cc1a): `grep -rn 'new Hls(' app components lib` returns exactly 10 sites. scripts/audit-perf.ts's rendition-cap check does list only EpisodeFeed, HorizontalFeed, ShortsFeed, instant-player. Player.tsx:155-163 and :590-598 do both set capLevelToPlayerSize:true with no maxDevicePixelRatio. hls.js 1.6.16 does default maxDevicePixelRatio to Number.POSITIVE_INFINITY (node_modules/hls.js/dist/hls.mjs:31273) and does compute Math.min(devicePixelRatio, config.maxDevicePixelRatio) (:20175). CreatorWatch.tsx:84 is `const hls = new Hls();`.

WHY IT DIES ON EFFECT (the decisive part):
1) components/Player.tsx, components/HeroVideo.tsx and components/RedCarpetHero.tsx have ZERO importers. `grep -rn "components/Player\|components/HeroVideo\|components/RedCarpetHero" . --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=.git --exclude-dir=docs` returns only two guard scripts reading Player.tsx as TEXT (test-playback-se

---

### D4-008 — The rate limiter is per-isolate in production (the counter resets when a request lands on a different Vercel isolate), so it is not a global limit; and a 429 that does land on /api/access re-paywalls 

*Raised by D4 — Performance and memory. Rendition c, claimed S4*

**Why it was discarded.** Both stated facts reproduce; neither supports the claim. The finding is internally inverted and quotes a shipped fix as an open defect.

REPRODUCED (facts): 20 sequential GETs to https://www.verzatv.com/api/access?slug=the-escort -> x-ratelimit-remaining ran 105..87 monotonically then jumped to 119 on request 20 with a fresh x-vercel-id. limit=120 is live. The re-paywall code path is confirmed IN THE DEPLOYED BUNDLE (/_next/static/immutable/chunks/27_6kgf3tx4s2.js): `let r=await fetch(`/api/access?slug=${e}`,{signal:a.signal}),n=r.ok?await r.json():null` ... `t||R(!1)`. Non-ok does fall through to unentitled, no retry.

WHY DISCARDED:
1. LOGIC INVERTED. The finding presents the per-isolate reset as WEAKENING the 120/min mitigation. The reset is what makes a 429 HARDER to reach: each isolate starts a fresh bucket, so the effective per-IP ceiling is a multiple of 120. The observation offered as evidence is the thing preventing the harm.
2. VOLUME IS ~250x A REAL VIEWER'S. I could only force a 429 on /api/access at request 253 in 24.4s (~10.4 req/s over a single pinned keep-alive connec

---

### D4-011 — startInstantPlayer() returns before destroyInstantPlayer() when the playbackId is undefined, so a prewarmed hidden <video> from a previous tap keeps downloading and decoding for its full 12s TTL when 

*Raised by D4 — Performance and memory. Rendition c, claimed S4*

**Why it was discarded.** Mechanism is real, trigger is not. The guard ordering is exactly as claimed and I confirmed it in the DEPLOYED bundle (www.verzatv.com/_next/static/immutable/chunks/3a6je4_-m3ifk.js): `function(a){if(!a||r?.playbackId===a)return; i(); ... timer:setTimeout(()=>{r===s&&i()},12e3)}` where i() is destroyInstantPlayer. TTL 12e3 confirmed. The deployed call site also matches: `let t=e.find(e=>e.slug===r),s=t&&l<=t.freeEpisodes?S.MUX_MAP[r]?.find(e=>e.episode===l)?.playbackId:void 0` then startInstantPlayer(s).

But the claimed second tap cannot occur. I resolved all 96 real catalog rows against the real public Mux map (91 live + 5 coming_soon, matching the inherited fact): the ONLY rows where `1 <= freeEpisodes` fails or ep 1 has no public playbackId are the 5 coming-soon rows (freeEpisodes: 0 — the-chairmans-revenge, protected-by-the-devil, the-last-will, the-billionaires-apron, i-cant-resist-my-mansion-gardener). Every surface that could tap one is gated out of the prewarm, and the gates are in the shipped bundle: grid tile `onClick:l?void 0:t=>y(t...)` with `l` = `"coming_soon"===e.stat

---

### D4-012 — The adopted body-level video is repositioned by a scroll handler that reads getBoundingClientRect() and writes four inline styles on every scroll event — a forced layout read/write per frame during th

*Raised by D4 — Performance and memory. Rendition c, claimed S4*

**Why it was discarded.** The code is exactly as described, but it is not a defect — it is the mechanism behind a DO NOT REGRESS asset, and it costs 0.8 microseconds.

WHAT I DID
1. Deployed-bundle check (not the build). Fetched https://www.verzatv.com/series/the-mistress-trap/1, pulled all 16 referenced /_next/static/immutable/chunks/*.js, and found the handler minified in chunks/27_6kgf3tx4s2.js:
   let o=()=>{let r=t.getBoundingClientRect();e.style.left=`${r.left}px`,e.style.top=`${r.top}px`,e.style.width=`${r.width}px`,e.style.height=`${r.height}px`};o();let l=t.closest(".no-scrollbar");if(l?.addEventListener("scroll",o,{passive:!0}),window.addEventListener("resize",o),eg.current=()=>{l?.removeEventListener("scroll",o),window.removeEventListener("resize",o)}
   So the description in the finding is factually accurate. Source: components/EpisodeFeed.tsx:419-432, cleanup invoked at :526.

2. Reproduced the adoption path on the LIVE site (not a deep link — a real poster tap, the only path that registers `place`). Clicked the "Lost and Found" poster on www.verzatv.com, landed on /series/lost-and-found/1, and c

---

### D4-013 — requestVideoFrameCallback is never paired with cancelVideoFrameCallback anywhere in the player code, so a first-frame callback can fire after its slide has unmounted.

*Raised by D4 — Performance and memory. Rendition c, claimed S4*

**Why it was discarded.** DISCARDED — the counts are wrong, most of the cited code never ships, and the finding disclaims its own effect.

WHAT I DID

1. Static, in repo. `grep -n "requestVideoFrameCallback|cancelVideoFrameCallback"`:
   - /Users/jothamhall/E! CREATOR ECONOMY/verza-tv/components/EpisodeFeed.tsx — lines 554-555, ONE call site (`onFirstFrame`), not 2.
   - /Users/jothamhall/E! CREATOR ECONOMY/verza-tv/components/Player.tsx — lines 445, 489, 566: THREE call sites, not 6.
   `cancelVideoFrameCallback`: 0 repo-wide. The raiser counted grep LINES, not call sites — each site emits two hits because of the `"requestVideoFrameCallback" in vid` feature test that precedes the call.

2. components/Player.tsx is DEAD CODE. Nothing imports it: no `import ... Player` and no `dynamic(` referencing it anywhere in app/, components/ or lib/ (the only "Player" imports in the tree are `startInstantPlayer`/`adoptInstantPlayer` from lib/instant-player). So 6 of the 8 asserted unbalanced call sites are in a file no viewer ever loads.

3. Deployed bundle, per the standing rule. Fetched https://www.verzatv.com/series/t

---

### D4-014 — Google Tag Manager, AdSense, doubleclick and adtrafficquality push loadEventEnd on the home page to 4,643 ms while the first-party page is interactive at 79 ms.

*Raised by D4 — Performance and memory. Rendition c, claimed S4*

**Why it was discarded.** DISCARDED — the headline number does not reproduce on the live domain, and the metric it cites gates nothing.

WHAT I DID
1. Deployed bundle, not the build. Fetched https://www.verzatv.com/?tab=drama, pulled all 14 chunks it references, and found the component in /_next/static/immutable/chunks/3z23pxudvy0-6.js. The minified code matches source verbatim: `t.async=!0 ... "https://www.googletagmanager.com/gtm.js?id=GTM-K9GWK2XT"` and `r.async=!0, r.crossOrigin="anonymous" ... adsbygoogle.js?client=ca-pub-8089901381021947`, both inside a `useEffect(...,[])`.
2. Measured the effect twice in Chrome on the live URL, reading performance.getEntriesByType('navigation')[0]:
   Run 1: responseStart 81, domInteractive 103, domContentLoadedEventEnd 103, loadEventStart 608, loadEventEnd 609.
   Run 2: responseStart 182, domInteractive 195, domContentLoadedEventEnd 195, loadEventStart 520, loadEventEnd 521.
   Claimed loadEventEnd is 4,643 ms. I measured 609 ms and 521 ms — 8-9x off. The figure is not reproducible.
3. Checked whether the metric matters. domInteractive === domContentLoadedEventEnd in

---

### D6-001 — No captions or subtitles exist on any episode in the catalog. Every Mux master manifest declares CLOSED-CAPTIONS=NONE with no subtitle rendition, every <video> reports textTracks.length === 0, and the

*Raised by D6 — Accessibility. The accessibility pr, claimed S2*

**Why it was discarded.** Static citations are accurate; the harm claim is not, and the headline number does not reproduce.

WHAT REPRODUCED. components/ThirdPartyScripts.tsx:20-33 does append GTM (GTM-K9GWK2XT) and AdSense (ca-pub-8089901381021947) in a mount effect; app/layout.tsx:121 renders it and :166-167 add @vercel/analytics + @vercel/speed-insights. Live CSP fetched from www.verzatv.com confirms ep1.adtrafficquality.google appears in NO directive. The named third-party hosts all fire on the deployed page.

WHAT DID NOT. The claim is loadEventEnd 4,643 ms. Two real Chrome navigations of the deployed site measured loadEventEnd 312 ms (/?tab=drama) and 310 ms (/?tab=hot) — off by ~15x. The first-party numbers matched the raiser exactly (responseStart 61, domInteractive 76, DCL 76), so the instrument agrees; only the load-tail claim fails. The raiser most likely caught a stray GA beacon in flight at load (I saw one google-analytics entry ending at 5,542 ms, i.e. long AFTER the load event, so it did not affect loadEventEnd even then).

NO USER-VISIBLE COST EXISTS TO FIX. performance.getEntriesByType('longt

---

### D6-002 — The viewport meta blocks pinch-zoom (maximum-scale=1), so a low-vision viewer cannot enlarge any page. WCAG 1.4.4 Resize Text, Level AA. Honored by WKWebView, which is what the approved iOS app render

*Raised by D6 — Accessibility. The accessibility pr, claimed S2*

**Why it was discarded.** DISCARDED — the tag is real, but every claim about WHERE it bites is false, and the correctly-scoped version of this finding is already on the list at index 205.

ASSIGNMENT VERIFIED (this part is true). /Users/jothamhall/E! CREATOR ECONOMY/verza-tv/app/layout.tsx:96 `maximumScale: 1,` is the only viewport declaration in the repo (`grep -rn "export const viewport" app/` returns exactly one hit, layout.tsx:93). curl against production on /, /terms, /privacy, /help, /series/the-billionaires-vow, /shop all return `<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover"/>` verbatim. Present since the first commit (56782d7).

EFFECT KILLED. The finding's load-bearing sentence — "Honored by WKWebView, which is what the approved iOS app renders in… the case where this actually blocks a low-vision viewer is the shipped native client" — is false. The shipped iOS app (/Users/jothamhall/verza-native, bundle com.verzatv.app v2.0.0) is an Expo SDK 57 / React Native 0.86.2 / expo-router / expo-video app. `react-native-webview` is in neither package.

---

### D6-015 — There is not a single aria-live region in the product. Advancing to the next episode, toggling mute, saving to My List, liking, and crossing the free-episode boundary all change the screen with nothin

*Raised by D6 — Accessibility. The accessibility pr, claimed S3*

**Why it was discarded.** DISCARDED — the headline claim is false in both source and the deployed bundle, the evidence undercounts live regions by more than 3x, and 4 of the 5 named interactions do announce.

1) "Not a single aria-live region in the product" is false. `components/CreatorBetaForm.tsx:69-70` ships `role="status" aria-live="polite"`. Verified in the DEPLOYED bundle, not the build: chunk `https://www.verzatv.com/_next/static/immutable/chunks/1aseb4gggkekc.js` contains the minified literal `role:"status","aria-live":"polite"`, gated on `"done"===h`. That chunk is referenced twice by `https://www.verzatv.com/?tab=creators` (http 200) — CreatorsLanding is mounted from `components/BrowsePage.tsx`, i.e. the Creators tab of the home route, which is why a `/creators` path 404s and a path-based sweep would miss it. So "routes with any aria-live element = 0" is a sweep artifact, not a fact.

2) The evidence's count is wrong. It names "three role='alert' nodes (EpisodeFeed.tsx:1124, :2639, CartDrawer.tsx:206)". There are ten: AuthErrorNotice.tsx:62, CreatorBetaForm.tsx:160, CoinPaywall.tsx:151, VipCard.tsx

---

### D7-007 — Eight of the nine visible form controls render at 14px, below iOS Safari's 16px focus-zoom threshold; this is currently masked only by the maximum-scale=1 that D7-006 says to remove, so fixing D7-006 

*Raised by D7 — Viewport and device. Every page-rou, claimed S3*

**Why it was discarded.** Every measurement is accurate, but the finding describes no defect that exists in production — it is an implementation constraint on D7-006 filed as its own S3.

WHAT I VERIFIED AS TRUE (all against the deployed site):
1. Mask is present. curl of https://www.verzatv.com/ and /sign-in both return `<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover"/>` (source: app/layout.tsx:93-96, `maximumScale: 1`).
2. The 14px claim is real, verified as EFFECT not assignment. Every control carries `text-sm` in the deployed HTML, and I resolved it through the deployed CSS bundle /_next/static/immutable/chunks/1b0rux1xv-mpp.css: `.text-sm{font-size:var(--text-sm)}` with `--text-sm:.875rem`, and there is NO html/:root font-size override in that bundle, so 1rem=16px and the controls compute to a genuine 14px.
3. The tally is exact: email x3 (/sign-in, /sign-up, /forgot-password), password x2 (/sign-in, /sign-up), search x2 (/search, /discover), text x1 (sign-up display-name) = 8 at 14px; the 9th is the sign-up ageGate checkbox at `w-4 h-4` = 16x16. M

---

### D7-008 — Only 31% of visible interactive elements meet the 44x44 thumb minimum and 34% are below even the 24x24 WCAG floor; the offenders are systemic components, not one-off pages.

*Raised by D7 — Viewport and device. Every page-rou, claimed S3*

**Why it was discarded.** DISCARDED — the measurement is accurate but the defect is not reproducible on production; it is a companion note on D7-006, not a standalone finding.

WHAT I VERIFIED AS TRUE (in the deployed bundle, not the build):
Fetched /sign-in, /sign-up, /forgot-password, /search, /discover from www.verzatv.com with an iPhone UA and enumerated every non-hidden form control. Exactly 9, matching the evidence element-for-element: email x3 (sign-in, sign-up, forgot-password), password x2 (sign-in, sign-up), search x2 (search, discover), text x1 (sign-up display-name) = 8 carrying `text-sm`; the 9th is the sign-up age-gate checkbox (`w-4 h-4`). Deployed stylesheet /_next/static/immutable/chunks/1b0rux1xv-mpp.css resolves it: `.text-sm{font-size:var(--text-sm);...}` with `--text-sm:.875rem`, no `html{font-size}` override, and NO input font-size rule anywhere in the 47,932-byte sheet. So 14px is genuinely what ships. (Minor evidence error, immaterial: the checkbox's "16px" is its 16x16 BOX size from w-4 h-4, not a font-size — and checkboxes do not trigger focus zoom anyway.)

WHY IT IS DISCARDED:
The 

---

### D7-017 — OBSERVATION, NOT A DEFECT — a tablet gets a 400px iPhone mock with a non-scrolling body; the layout is correct but the frame height uses vh rather than dvh, which would put the docked nav below the fo

*Raised by D7 — Viewport and device. Every page-rou, claimed S4*

**Why it was discarded.** Facts reproduce exactly; the asserted consequence does not. Discarded.

WHAT I DID. Confirmed both rules in the DEPLOYED bundle (https://www.verzatv.com/_next/static/immutable/chunks/1b0rux1xv-mpp.css, not the build): `.device-frame{...height:min(94vh,868px)...}` + `body{min-height:100vh;overflow:hidden}` inside `@media (min-width:520px) and (orientation:portrait),(min-width:520px) and (min-height:600px)`, and `@media (orientation:landscape){.bottom-nav{height:3rem;padding-top:.25rem;padding-bottom:.25rem}}`. Then drove headless Chrome 151 over CDP against live www.verzatv.com and measured real layout boxes at 11 viewports.

RAISER'S MEASUREMENTS ARE ACCURATE. 768x1024: frame 400x868 at y78 (bottom 946), shellW 394, body overflow "hidden", page unscrollable, nav docked y854-927, zero horizontal overflow. 1024x768: frame 400x721.9, `.bottom-nav` computed height 48px, inner row inline height 72px, row overflows the nav box by exactly 29px. Every number matches.

WHY IT IS STILL NOT A DEFECT.
1. The finding self-declares "OBSERVATION, NOT A DEFECT — the layout is correct." It asks for n

---
