# Verza TV — What This Audit Could Not Establish

This document matters as much as the findings register. The previous audit's
biggest failure was not a wrong finding: it was twelve testers sharing one
browser, with nobody noticing that video playback and checkout were never
exercised at all. What follows is what this run genuinely could not settle, and
what each item needs.

Nothing here is padding, and nothing has been removed to look thorough.

---

## The three that block a launch claim

### 1. Nobody has ever completed a purchase on this platform
Not a tester, not an agent, not the founder. Checkout is unverified **by
definition**, not by omission. Every statement in this audit about the payment
path describes code and configuration, never an observed transaction.
**Needs:** one real card, one real $1.99 purchase, and a readback of the
resulting Stripe event, purchase row and entitlement.

### 2. No agent could hold an iPhone
Everything about finger swipes, tap-target reachability, safe areas, real
scroll momentum and the actual feel of the rail is unverified. Desktop Chrome
at an emulated width is not a phone. Several agents also reported their tab was
backgrounded by other agents sharing the browser, which suspends media decode —
so first-frame timing and the instant-play handoff were never observed either.
**Needs:** a person with the app open on a real device.

### 3. The iOS / In-App Purchase architecture decision is still open
It gates Agent C's checkout work entirely. Until it is answered, the iOS
paywall's purchase path cannot be designed, let alone verified.
**Needs:** a human decision.

---

## Per-agent gaps, as reported

### S4 — SEARCH. The four catalogue-search surfaces (`components/SearchButton.tsx` header popo

Coverage: **485 of 485** items examined.

Six items in or adjacent to scope I could not fully examine, and what each needs.

1. No physical iOS/Android handset. S4-002's *cause* (iOS Smart Punctuation substituting U+2019 in a WKWebView search field) and the keyboard half of S4-010 (focus() on a 100ms timer failing to raise the software keyboard) are inferred from the shipped code plus known platform behaviour. The *effect* in S4-002 is measured and certain — a U+2019 query returns 0 on production — but the share of real queries that carry U+2019 is not. NEEDS: type "The Billionaire's Vow" into the header search on a stock iPhone with default keyboard settings and read the result count; tap the search icon and observe whether the keyboard rises.

2. The native app in ../verza-native was not in this repo and was not examined. If the iOS binary ships its own search screen rather than the web SearchButton in a WebView, none of S4-002, S4-005, S4-009, S4-010 or S4-012 has been verified there. NEEDS: the same 582-query matrix run against the native search module.

3. No screen-reader run. S4-017 is from static attributes only — no VoiceOver or TalkBack pass, so the actual announced experience (whether the placeholder is read as the accessible name, whether the result count is ever spoken) is unverified. NEEDS: a VoiceOver rotor pass over the open overlay.

4. No browser rendering. The ~7,300px figure in S4-005 is computed from the deployed markup (91 rows × a 56px poster inside py-3) rather than screenshotted at 320px. The overflow is certain from the absence of maxHeight/overflow-y in the shipped style object; the exact pixel height is an estimate. NEEDS: /discover at 320px with "an" typed.

5. No analytics console. S4-012's stale counts are proven in the shipped source but I could not read the GA4 / Vercel Analytics `search` event stream to show the wrong numbers landing. NEEDS: one day of the search event stream.

6. No ranking specification exists. S4-004 measures behaviour against what a viewer typing an exact title would expect, not against a documented rule, because there is no documented rule. NEEDS: a decision on what search should rank first, so a check can be written that names the defect it prevents.

Also examined and NOT defective, recorded so it is not re-litigated: accent folding is correct and genuinely deployed in both directions on all six non-ASCII titles and both spellings of the category key (/search?q=pasion and ?q=pasión both return sentence-of-passion-es; ?q=espanol and ?q=español both return the same 5 rows; cunado/cuñado, engane/engañé, enamore/enamoré, mansion/mansión all agree), and the client bundle carries the same folder as the server, not an older matcher. All 91 live titles are findable by their full title, by their first word, first two words, last word, middle word, and by their title minus stopwords — 0 failures across those probes. All 96 catalogue rows route correctly under the restored rule and all 96 destinations return 200 on production (91 → /series/<slug>/1, 5 → /series/<slug>). Reflected-query escaping is sound: script tags, quote-breakouts, a 2,000-character query, emoji and a SQL-shaped string all render as inert text at 200.

### S3 — SHOW PAGES: all 96 catalog rows (91 live + 5 coming_soon) fetched from production at 

Coverage: **96 of 96** items examined.

1. TRUE 320px DEVICE VIEWPORT — not measurable. Chrome on macOS refused to shrink the window below 606 CSS px (resize_window reported success, innerWidth stayed 606), and the site sends x-frame-options: DENY so a 320px same-origin iframe harness could not read contentDocument. I substituted a genuine 320px CONTENT width by constraining .app-shell, and verified 2 pages that way (the-pendleton-secret; i-cant-resist-my-mansion-gardener, which carries the second-longest h1). Needs: a real 320px device or a headless browser with an emulated viewport, run across the longest-string rows — mafia-lords-secret-video (h1 50 chars), salt-and-pepper / im-having-my-professors-baby-es (logline 211 chars), i-fell-in-love-with-my-presidential-brother-in-law-es (description 399 chars).

2. BURNED-IN ENGLISH SUBTITLES on the 6 live Hindi titles — partially verified. The show pages claim "Hindi audio · English subtitles". I confirmed the claim is TRUE for salt-and-pepper by pulling a Mux thumbnail of a public free episode (playback id jZ01vdAEA02cUDq007m02USJgJh8YKNeYj5wBySpM00qLwFw at t=30s shows burned-in English text). Sampled frames from falling-for-flatmate, dil-dosa-dosti, love-for-sale, the-breakup-podcast and reset happened to contain no dialogue, so the claim is UNVERIFIED for those 5. Structural risk worth noting: lib/audio-language.ts derives the subtitle claim from membership of the "bollywood" category, not from any per-title measurement, so the next Bollywood title added inherits the claim whether or not it is true. Needs: frame sampling at known dialogue timestamps, or a supplier delivery note per title.

3. IOS EXPOSURE PRECONDITION for D3-005 — I proved the $1.99 card is in the server HTML for every request including ?platform=ios with a VerzaTV-iOS user agent. I could NOT confirm whether the iOS binary actually renders /series/[slug] in a WebView; the native client lives in ../verza-native, outside this repo. If it does, D3-005 is an App Store 3.1.1 exposure at the severity given; if the native app never loads this route, it drops to S4. Needs: a route inventory from ../verza-native.

4. CAST NAME COLLISION — I established the cast lists are fabricated (18 entries are literal character/role labels). I did NOT check whether any of the 222 invented names collides with a real working performer, which would be a separate rights problem. Needs: a name-clearance pass.

5. LOCALE COVERAGE — I rendered the show page in production under 1 non-English locale (es) and read the strings off the live DOM. The remaining 18 non-English locales were not individually rendered. The strings are server-side English literals so they cannot vary by locale, but that is inference, not measurement.

6. EPISODE PICKER internals verified on 1 of 91 live pages (the-unforgettable-love: 50 items, EP1 "NOW", EP2–5 "FREE", 45 padlock glyphs on the paid run). The other 90 were verified only for the picker's presence and its collapsed-state label. This is a named DO-NOT-REGRESS asset and it was intact where measured.

7. STRUCTURED-DATA VALIDATION was done by parsing and property-checking all 96 payloads myself, not by submitting them to Google's Rich Results Test (no such tool available here).

### S8 — Legal, Trust, Footer. The 21 legal/trust/footer routes (/terms, /privacy, /refund-pol

Coverage: **372 of 372** items examined.

Six items I could not close, and what each needs.

1. MAILBOX DELIVERABILITY — 8 of 11 mailto targets. verzatv.com has live MX (mx1/2/3-usg2.ppe-hosted.com + verzatv-com.mail.protection.outlook.com, SPF `v=spf1 include:_spf-usg2.ppe-hosted.com include:secureserver.net include:sendgrid.net -all`), so the domain accepts mail. Whether support@, press@, legal@, feedback@, privacy@, partnerships@, investors@ and careers@ are monitored mailboxes rather than dead aliases is unverified — I did not send mail or run an SMTP RCPT probe against a production server. NEEDS: someone with mailbox access to confirm each of the eight resolves to a monitored inbox, or one test message per address. This matters most for support@ (the only refund route), privacy@ (the only CCPA/GDPR route) and legal@ (the only DMCA route).

2. iOS BINARY BEHAVIOUR — S8-016. I verified the source mechanism (HideInIOSApp hides post-mount) but could not measure the visible flash duration in the shipped app, or confirm whether the native client renders this web footer at all. NEEDS: the ../verza-native client or a device running the App Store build, loading a legal page and recording first paint.

3. LEGAL SUFFICIENCY — S8-009 and S8-014. I can show that a consent mechanism, a "Do Not Sell or Share" link, GPC handling, a DMCA procedure and a designated agent are all absent from the product, and that the Privacy Policy promises rights those absences undercut. Whether that crosses the line into a GDPR/ePrivacy/CPRA/DMCA violation, and what the remedy must be, is a question for privacy and IP counsel, not this audit.

4. PLAY STORE RATING PROVENANCE — S8-006. I read the US/en listing only. Whether the "Everyone" rating reflects a stale content questionnaire, a pending resubmission, or a different app configuration is not visible from outside. NEEDS: Play Console access to read the current content-rating questionnaire and submission history. Also note the Play listing's last update is Dec 28, 2025 while the iOS build is v2.0.0 (Aug 11, 2026) — the Android binary predates the payment cutover, which no page discloses.

5. CORPORATE FACTS — unverifiable from here. "Filmology Labs, Paterson, New Jersey" (asserted on /about, /press, /company, /founder, /investors), "Alan Mruvka, co-founder of E! Entertainment Television" (asserted on 7 pages), and the VERZA TV LLC registration at 650 E Palisade Ave, Ste 2329, Englewood Cliffs NJ. NEEDS: the company to confirm these are contractually and factually supportable; the E! co-founder claim in particular is load-bearing across the whole trust section.

6. TRUE 320px VIEWPORT — S8-008. Chrome's minimum window width prevented a genuine 320px CSS viewport; measurements were taken at 620px, which is already below the sm (640px) breakpoint that hides the social labels. The offending targets have computed `padding: 0px` and fixed 18px intrinsic height, so they do not grow at 320px, but the wrap behaviour of the 8-link legal row at 320px was not observed directly. NEEDS: a real device or a devtools device-mode pass.

DENOMINATOR NOTE for the parent: docs/audit/00-manifest.json under-counts interactive elements on this lane. Its `interactive.items` lists 53 entries across S8 files but zero for components/StoreLinks.tsx, app/about/page.tsx, app/press/page.tsx, app/help/page.tsx and app/founder/page.tsx — all of which do render links (StoreLinks' anchor is inside a .map(), which the scanner appears to miss). I audited the real rendered set from production HTML rather than the manifest list, so my coverage is a superset, but the manifest's 535 figure is an undercount.

### S5 — Shop and commerce. Agent C's actual shipped/not-shipped status; merch shop and prices

Coverage: **752 of 752** items examined.

Everything in the S5 denominator was examined, but seven classes of state could not be REACHED and are reported as gaps rather than counted as verified behaviour.

1. NO PURCHASE WAS COMPLETED, and none can be from this seat. Every authenticated-and-owning state downstream of a real card is unverified by definition: the populated purchase-history list, the granted-entitlement playback path, the post-Stripe ?session_id= return, the confirmation email actually rendering, the webhook's series_unlock branch running against a real event, and the refund/dispute handlers. What it needs: one controlled $1.99 live purchase with the Stripe dashboard and the Supabase entitlements/purchases tables read back, plus a screenshot of the received email (which is where S5-002 becomes visible).

2. Authenticated latency of /api/unlock/confirm — the number S5-009's 6s deadline is racing. Unauthenticated it short-circuits at 0.29-0.49s; the real path adds a Stripe session retrieve, a paymentIntent retrieve with charge expansion, and two Supabase writes, possibly on a cold isolate. What it needs: one timed authenticated call, or a p95 from Vercel function logs.

3. Apple StoreKit end to end. The 86 slug/product pairs reconcile 1:1 with the 86 paid rows with no duplicates and no orphans, and all three /api/iap/apple/* routes fail closed correctly to unauthenticated probes (401/401/400). But no signed transaction, no Sandbox purchase, no restore, and no V2 notification was exercised. What it needs: a Sandbox account on the TestFlight build plus the ASC notification history.

4. Whether the native iOS binary routes to these web pages. S5-007 (affiliate ads surviving reader mode) is a defect in this repo either way, but its severity depends on whether the App Store binary renders /shop and /amazon. The native client lives in ../verza-native, which is not present here. What it needs: a grep of the native repo's route table and WebView allowlist.

5. Merch checkout behaviour when enabled. MERCH_CHECKOUT_ENABLED is not true in production and I did not change any environment. S5-008 is read from source, so the missing-webhook-branch consequence is asserted from code, not observed. What it needs: a preview deployment with the flag on and a Stripe test-mode purchase — never production.

6. A true 320px viewport. Chrome clamped this machine's window to 606px inner width; the 320px measurements in S5-019 were taken by constraining the shop section's own container, which reproduces the layout but not media queries or safe-area insets. What it needs: a real 320px device or a DevTools device-emulation session.

7. Stripe dashboard state. The 19-event allowlist, the single enabled endpoint, the zero tax registrations, and the billing-portal configuration are all asserted from source and from the fail-closed behaviour of the deployed routes. No Stripe credentials were used and nothing was mutated. What it needs: npm run test:payments:stripe-config with live keys, by whoever holds them.

Also worth flagging for whoever consolidates: the Amazon storefront button on /amazon says "Visit the full VERZA TV Amazon storefront" but node=53629917011 fetches back as a generic "Amazon.com: : All Departments" browse page with no product tiles and no Verza branding in the HTML. Amazon renders storefronts client-side, so this may be a false negative from a headless fetch — I did not open it in a real browser session and am not claiming it is broken. One human tap settles it.

### S6 — My List / Library / Profile / Account: /me, /me/list (both tabs), /me/purchases, /lib

Coverage: **185 of 185** items examined.

Everything in scope was examined; what I could not EXERCISE is the signed-in half of the surface, and one thing I could not confirm at all.

1. UNVERIFIABLE WITHOUT A SESSION (7 of 13 API routes, all 12 inputs, and every populated signed-in state). I have no test account, and creating one or typing a password into a live login form is outside what I may do. Not exercised: POST/DELETE /api/saved-list, POST /api/watch-progress, GET /api/entitlements (200 path), /api/entitlements/check (purchased path), POST /api/account/sync (the merge itself), POST /api/account/delete, POST /api/billing-portal, POST /api/subscribe/confirm. Each was read line by line and its unauthenticated behaviour confirmed live (401 or 200-empty, with `private, no-store` + `Vary: Authorization, Cookie` on every one). What this needs: one throwaway account with one $1.99 entitlement, then re-run the account-page, purchase-history, saved-list and sync paths.

2. THE SERVER-ONLY `SUPABASE_URL` VALUE (blocks the exact blast radius of S6-001). `vercel env ls production` shows two separate variables: NEXT_PUBLIC_SUPABASE_URL (52d, proven = the NXDOMAIN host) used by every auth client, and a distinct SUPABASE_URL (47d) used only by getServiceClient() (lib/supabase/server.ts:5). I did not read either value - `env pull` would have written production secrets to disk. If SUPABASE_URL points somewhere live, service-role reads still work and only authentication is dead; if it is the same host, the whole database is unreachable. A/B latency probes were inconclusive: /api/auth/callback?code=xxx (forces exchangeCodeForSession) and /api/creator/channels?z=rand (forces a service-client query) were both indistinguishable from their no-network controls (~0.22s vs ~0.27s), which is weak evidence that neither call reaches a real host, but is not proof. What this needs: read the two values in the Vercel dashboard - 30 seconds, and it is the most urgent item on this list.

3. OAUTH PROVIDER ENABLEMENT. Whether Google and Apple are actually enabled on the Supabase project is unknown, because /auth/v1/settings cannot be reached (the host is NXDOMAIN). Independently of S6-001, note that components/OAuthButtons.tsx:66-68 swallows every signInWithOAuth error into console.error, so if a provider is disabled the buttons are silently inert. What this needs: the Supabase Auth > Providers page.

4. 320px LAYOUT. The Chrome window is shared with other agents in this run and kept being resized back; my measurements ran at an innerWidth of 606, not 320. At 606 there was no horizontal overflow anywhere in scope and one sub-44px tap target (S6-018). The account pages are single-column `max-w-lg mx-auto px-4`, so 320px is very likely fine, but I did not observe it. What this needs: a dedicated window at 320x740.

5. EMAIL DELIVERABILITY. The two mailto: targets on /me (feedback@verzatv.com, support@verzatv.com) and the reset/welcome/verification sends in lib/email.ts were read, not sent. All 28 in-scope internal link targets were fetched live and every one returned 200.

6. TEST STATE I CREATED AND REMOVED. To exercise guest persistence on the live domain I wrote one localStorage key (verza.guest.progress.v1) in one browser tab, confirmed the rails rendered, then removed it and restored verza-saved to its prior value ["tied-by-fate"]; the tab is closed. No server state was written anywhere in this audit.

### S1 — Discover / Home. The `/` route as shipped on https://www.verzatv.com: the category st

Coverage: **404 of 456** items examined.

Nine items or behaviours in scope that I could not examine, and what each needs.

1. **52 of the 76 Drama tiles never rendered — infinite-scroll paging unverified.** The grid pages at PAGE_SIZE 24 behind an IntersectionObserver sentinel (components/BrowsePage.tsx:559-577). I scrolled `.device-screen` to its maximum (scrollTop 2664 of 2664, sentinel rect top 143, inside the viewport) and the tile count stayed at 24 across three attempts. This is NOT a finding: I ran a negative control — my own IntersectionObserver on the same sentinel with the same 800px rootMargin also never fired, and `document.hidden` was `true` with `requestAnimationFrame` never invoking its callback (a 12-frame rAF loop timed out after 45s). Another agent's session held the foreground tab in this Chrome window the whole time, so no rendering-update steps ran. NEEDS: a foreground browser tab or a real device to confirm the sentinel appends pages 2-4. Their routing and artwork ARE verified (all 96 catalog destinations 200, all 96 posters 200); only on-screen appearance is unconfirmed. These 52 are the entire difference between itemsInScope 456 and itemsExamined 404.

2. **Touch-swipe tab switching untested.** components/BrowsePage.tsx:506-539 switches tabs on a >50px horizontal touch drag, with an exclusion for touches starting inside `.overflow-x-auto, .snap-x`. Desktop Chrome has no touch input. NEEDS: a real device or a touch-emulating harness. Clicking all 10 tab buttons was verified and all 10 render (see report).

3. **Real narrow viewports.** The desktop phone frame is 394 CSS px inside a 606px window and the OS window would not shrink below ~518px outer. I simulated 320/360/375/390/430 by setting `.device-frame` width. Faithful for the grid (tile widths tracked correctly: 93/106/111/116/129) and for the tab strip. NOT faithful for anything sized in vw/dvh, which resolves against the real 606px viewport: the hero's `maxWidth: min(320px, 80vw)` (BrowsePage.tsx:996) and the Tubi panel's `height: calc(100dvh - 108px - 96px - env(safe-area-inset-bottom))` (BrowsePage.tsx:745). NEEDS: real device widths or Chrome device emulation in a foreground tab.

4. **Console errors on `/` could not be captured.** `read_console_messages` returned "No console messages found for this tab" both before and after a reload with tracking armed, on the occluded tab. No JS errors were observed but none can be ruled out. NEEDS: a foreground tab.

5. **Continue Watching rail exercised with one row only.** The rail appeared once during the session ("EP 4 · Tied By Fate") and was empty on later loads. I verified its code path (lib/continue-watching.ts filters to live series, drops rows past episodeCount, caps at 20; lib/resume.ts:30-33 builds `/series/<slug>/<n>?t=<s>`) and that the server is authoritative over the guest mirror. NOT verified: a full 20-row rail, a signed-in rail, horizontal scroll feel, or the progress-bar percentage against a real durationS.

6. **CreatorsLanding's 13 interactive elements inventoried but not exercised.** The Creators tab renders components/CreatorsLanding.tsx: 4 links (/creator x2, /founder, /privacy — all 200), 5 buttons (4 accordion rows 352x44 plus "Apply for the beta" 354x51), 4 form inputs. I did not open the accordions or touch the form; that surface and its no-earnings-promises copy constraint belong to the Creators agent.

7. **Badge truthfulness against real release dates.** "New" is asserted positionally on 6 Drama tiles (the FEATURED_NEW pins at BrowsePage.tsx:60-67), 5 Español and 6 Bollywood tiles; "Trending" on 3 Drama and the top 3 Hot tiles. I verified the badges are internally consistent — Drama's Trending three (the-day-we-got-married, the-escort, hidden-agenda) are exactly Hot's rank 1-3 — but the catalog exposes no publish date here, so whether the six FEATURED_NEW titles are genuinely the newest is unverified.

8. **Header, footer and bottom nav (34 of the 201 interactive elements on `/`).** Inventoried with boxes and destinations, and every destination fetched (all 200 except the YouTube link, S1-009). Their own behaviour — the language picker, the search overlay, bottom-nav active state — belongs to other surface agents and was not exercised.

9. **The 3 Reality placeholder shows are outside the audit denominator entirely.** sugar-babies, buy-sell-miami and the-vertical-tea are hardcoded in components/BrowsePage.tsx:437-442 and are not catalog rows, so they appear in none of the manifest's 96 catalog entries or 5129 route instances. Anyone auditing "every catalog row" will never see them. I counted them as home-surface items; a follow-up should decide whether they belong in the catalog as coming_soon rows (which would give them the house badge and a real show page) or should be removed.

### S7 — SECTIONS. The 10 browse tabs (Drama, Hot, Tubi, Anime, Español, Bollywood, Reality, C

Coverage: **395 of 395** items examined.

Five things in or adjacent to my scope that I could NOT establish, and what each needs:

1. DRAMA PAGINATION BEYOND PAGE 1 (52 of 76 tiles). The Drama grid renders 24 tiles and appends more via an IntersectionObserver sentinel (components/BrowsePage.tsx:566-577). In my session the sentinel sat fully inside the viewport (top 129, viewport 563) for 10+ seconds and page 2 never loaded. I then installed my OWN IntersectionObserver on the same node with the same rootMargin as a negative control: it also never fired. My tab was `document.visibilityState === "hidden"` throughout, which suspends IO delivery in Chrome. The observation is therefore worthless and I am NOT reporting it as a defect. All 76 Drama destinations WERE crawled independently (76/76 -> HTTP 200); only the client-side rendering of tiles 25-76 is unverified. NEEDS: one pass in a foreground browser tab that nothing else is driving.

2. FOREGROUND CONFIRMATION OF S7-004 (tab-rail centring). Same root confound: `behavior:"smooth"` scrolls do not advance in a hidden tab. I kept the finding because the `behavior:"instant"` positive control lands perfectly (so the delta maths is sound) and because two rendered screenshots show the failure state at paint time, but a fixer must reproduce it in a foreground tab BEFORE changing CategoryTabs.tsx:132. NEEDS: an uncontended browser.

3. iOS APP RENDERING OF THESE SECTIONS. AGENTS.md rule 11 says the iOS binary excludes UGC, ads and affiliate placements — which means the StorageBlue ribbon, the Tubi outbound panel and the whole Creators recruitment surface must behave differently there. ../verza-native is not in this repo and I did not audit it. NEEDS: the native repo, or an installed build.

4. WHETHER /api/creator/upload 503s IN PRODUCTION. app/api/creator/upload/route.ts:24-30 returns 503 when MUX_TOKEN_ID/SECRET are absent, but the route requires an approved-creator session and returns 401 to me. I proved the downstream half instead (POST /api/mux/webhook -> 503, secret absent), which is sufficient to show the pipeline cannot complete, but the upload half itself is inferred, not observed. NEEDS: an approved creator account, or a Vercel env-var name readback.

5. WHETHER THE TUBI CONTRACT PERMITS PER-TITLE DEEP LINKS. S7-011 reports that six banners advertising specific films all land on tubitv.com's home page. TubiHeroCarousel.tsx:23-29 says a per-title URL must not be hand-written. Whether verified per-title URLs are obtainable is a partner-contract question I cannot answer from the code. NEEDS: the Tubi partner contact.

Also noted but deliberately NOT filed as defects, because they came back clean and are worth protecting:
- Anime empty state renders live and is honest: "Anime is coming soon" + "We're lining up the first titles for this section. Everything else on VERZA is ready to watch right now." + a working "Browse Drama" button. This is the house pattern and it works.
- All 5 coming-soon show pages (4 Bollywood + 1 Español) render 200 with "Episodes are on the way / The footage for this title hasn't landed yet, so there is nothing to play and nothing on sale", no price, no buy button, `noindex, follow`.
- Catalog routing rule holds on every section tab: 116 tile instances covering all 96 rows resolve as specified — 91 live tiles to /series/<slug>/1, 5 coming-soon tiles to /series/<slug>.
- All 5 wholly-free titles in scope (too-much-junk, storage-pirates, exes-premiere, love-awards, the-dumb-billionaire-heiress-in-love) read "All Episodes FREE" with no $1.99 anywhere on the page.
- Red Carpet is finished: heading, 2 tiles, both live, both to the player, back-tab correct.
- /creator signed out is honest with a way forward ("Sign in to apply, upload, and manage your channel" + Sign in).
- Every section episode page carries the right return tab (music/reality/red-carpet/bollywood/espanol).
- All 3 external destinations crawled clean: tubitv.com 200, storageblue.com 200 (one www->apex redirect), apps.apple.com 200.

### S2 — PLAYER / SHORTS: the vertical rail and its entitlement bound, the paywall slide, the 

Coverage: **5972 of 5972** items examined.

Eight items I could not examine to the standard the brief sets, and what each needs.

1. FIRST-FRAME TIMING AND INSTANT PLAY — unmeasured. The only browser available is shared with other agents driving it concurrently; my tab reported document.hidden === true for the whole session, so Chrome suspended media decode. Symptom: /series/the-mistress-trap/1 sat at readyState 0 with buffered.length 0 for 13+ seconds while its init segment and segment 0 returned HTTP 200 for four tracks. That is a hidden-tab artifact, not a production defect, and the code correctly refuses to escalate to an error while document.hidden (components/EpisodeFeed.tsx:672-680). NEEDS: a foreground browser session or a real device to time poster -> first frame and to confirm the adoption handoff visually.

2. RENDITION CAP EFFECT — assignment verified, effect not. Standing rule 1 says the instance property is what matters, and I confirmed the shipped bundle sets it: chunks/27_6kgf3tx4s2.js contains `t.config.maxDevicePixelRatio=1,t.capLevelToPlayerSize=!0` on the adoption path and `capLevelToPlayerSize:!0,maxDevicePixelRatio:1` in the fresh-attach constructor, while the instant player (chunks/0oo5zhjmwzr5q.js) is deliberately `capLevelToPlayerSize:!1`. What I could NOT observe is the resulting rendition. NEEDS: a foreground session reading hls.currentLevel and video.videoHeight on a ~390px-wide element to prove ~480p/540p is selected rather than 1080p.

3. /watch/[...slug] (creator playback) — source only. app/watch/[...slug]/page.tsx notFound()s unless a row in creator_content is status=published AND pricing_type=free AND has a mux_playback_id. No such title was reachable. NEEDS: a published free creator title, or database access to confirm the table is empty.

4. /api/watch-progress — source only. Both verbs require an authenticated session (401 for a guest by design, app/api/watch-progress/route.ts:14). I verified the client-side contract (lib/watch-progress-client.ts writes the device first, unconditionally) but not the round trip. NEEDS: an authenticated session.

5. RESUME AND AUTO-ADVANCE END TO END — not exercised, same cause as gap 1. I verified the wiring (?t= parsing at components/EpisodeFeed.tsx:1300-1306, the single-seek guard in tryPlay at :569-583, buildResumeUrl in lib/resume.ts:30-33, and the advance cooldown plus unattended cap present in the shipped bundle as `if(t-eg.current<700||(eg.current=t,ev.current>=8))return;`) but never watched an episode complete and advance. NEEDS: gap 1 resolved.

6. iOS PAYWALL SUPPRESSION — unverified. components/EpisodeFeed.tsx:1454-1457 flips `iosApp` from isIOSApp() and every purchase element is gated behind `!iosApp`, replacing the paywall with paywall.unavailableTitle / paywall.unavailableBody. I have no way to set the iOS-app signal from a desktop browser. NEEDS: the native client, or knowledge of the UA/bridge marker isIOSApp() tests.

7. ENTITLED-VIEWER PATHS — unverified by definition. I could not confirm that the rail extends to the full series after purchase, that /api/playback returns policy=signed with a tokenized URL, that the free-run chip hides for an owner, or that a cached signed URL re-locks on 401/402 via onAccessDenied. Nobody has ever completed a purchase on this platform and I had no entitled account. What I DID confirm is that the server is authoritative on the way in: a forged ?session_id=cs_test_forged123 returns HTTP 401 {"full":false} from /api/unlock/confirm and leaves /api/playback/the-mistress-trap--6 at 402. NEEDS: one entitled account.

8. CART PILL OVER THE PLAYER — one observation, not reproduced. On one load of /series/the-mistress-trap/1 the document text included "1 in bag", i.e. the cart pill painting over the immersive player, which .episode-immersive's chrome-hiding rules (app/globals.css:714-720, which hide header, footer and .bottom-nav) do not cover. It was absent on every later load. Another agent was mutating the shared cart during the session, so I cannot say whether the pill is suppressed or was simply empty. NEEDS: a clean profile with a non-empty cart.

### D2 — Localization. All 20 locales x all 115 keys = 2,300 i18n cells (the manifest denomina

Coverage: **2300 of 2300** items examined.

Five items in or adjacent to D2 scope that I could not settle here.

1. VISUAL LAYOUT / OVERFLOW at 320px in the 19 non-English locales — NOT EXAMINED. Localized copy expands up to +58% over English and the paywall's text box is ~256px (max-w-xs 320px minus px-8). Measured worst cases with real values substituted: paywall.cta sw 45 chars vs en 30 ("Fungua mfululizo — $1.99, malipo ya mara moja") on a text-base font-bold full-width button; paywall.unlockAll es/pt 30 chars vs en 19 on a text-2xl font-black heading; paywall.benefitAccess sw 76 chars vs en 63; paywall.previewOver de 133 chars vs en 109. All of these wrap rather than clip in principle (py-4, no fixed heights), but I did not render them. NEEDS: a browser at 320x568 stepping the locale through all 20 on /series/<paid-slug>/6 with the paywall open. I loaded the claude-in-chrome tools; driving them requires an interactive browser-selection prompt to the user that a workflow subagent cannot issue, so I stopped rather than guess.

2. ARABIC BIDI RENDERING of the price inside the CTA — NOT EXAMINED. formatMoney('ar', 199) emits "‏1.99 US$" with a leading RIGHT-TO-LEFT MARK, and it is interpolated into "فتح المسلسل — {price}، دفعة واحدة" inside the one div that does set dir="rtl". Whether the em dash, the RLM and the Latin "US$" resolve to a sane visual order is a rendering question, not a string question. NEEDS: the same browser pass, Arabic, screenshot of the paywall CTA.

3. NATIVE APP DICTIONARIES — OUT OF THIS REPO. ../verza-native is not present here. Whether the iOS/Android client shares lib/i18n.ts, carries its own copy, or is English-only is unverified, so the 2,300-cell denominator is web-only. NEEDS: the same D2 sweep run inside ../verza-native.

4. NATIVE-SPEAKER REVIEW of the 2,300 cells — NOT CERTIFIABLE BY ME. I ran mechanical checks (presence, emptiness, token identity, brace balance, English-identity, script coverage, mojibake, whitespace, apostrophe style, Spanish ¿/¡, French spacing, CJK punctuation, brand tokens) and close-read the 520 paywall/checkout/language cells, which is where D2-006, D2-007 and D2-015 came from. Register, idiom and mistranslation across 19 languages beyond what those checks surface is unaudited. NEEDS: a human reviewer per language, prioritised on the 52 rendered keys.

5. THE fil-vs-tl CLAIM (D2-008) is asserted from Chrome's and Safari's published language codes, not measured on a device. The code-side half is certain — resolveLocale(['fil-PH']) returns null, verified — but which tag a real Filipino handset sends is not. NEEDS: one device or one Accept-Language capture.

Two scope notes, not gaps. (a) Every one of the 2,300 cells was examined, and separately re-verified against production: I extracted the dictionary object out of the deployed chunk https://www.verzatv.com/_next/static/immutable/chunks/428d7hhx0m19l.js and diffed all 2,300 cells against lib/i18n.ts — 0 differences, so every finding above is confirmed shipped, per standing rule 4. (b) The brief's "confirm the paywall and every string added since Phase 1 are present" is answered YES and is the strongest thing in this dimension: commit 9b2fc27 added exactly 26 keys (13 paywall.*, 11 checkout.*, 2 language.*), all 520 cells are present, none is identical to English, and no interpolation token drifted — verified in source and in the deployed bundle. lib/i18n.ts has not changed since the manifest commit 83c29d1.

### D5 — Security. Every security-relevant surface of the Verza TV web app and its production 

Coverage: **5341 of 5341** items examined.

Every item in scope was examined at least once. Nine specific verification DEPTHS could not be reached from this machine, each with what it needs:

1. LIVE RLS ENFORCEMENT — 34/34 tables examined in migration source; 0/34 verified against the live database. I could not exercise PostgREST because the only anon key I have (from the deployed bundle) belongs to the nonexistent project in D5-002. Needs: the live project's URL + anon key, or Supabase dashboard access. Specifically worth confirming that migration 014's DO-block (which enables RLS on channels, seasons, show_people, tags, show_tags, internal_links via `execute format(...)`, and which a naive grep misses) actually ran.

2. ENTITLED PAID PLAYBACK — the unentitled path is verified live (GET /api/playback/the-mistress-trap--6 -> 402 paywall, no capability, no playbackId). The entitled response shape asserted by AGENTS.md rule 8 (policy=signed, tokenized 1,800s stream/poster, no playbackId, 200 manifest) is UNVERIFIED. Needs: an account holding an entitlement.

3. STRIPE LIVE ENDPOINT CONFIG — signature rejection is verified live (unsigned POST -> 400 "Missing stripe-signature"; bogus signature -> 400 "Invalid signature"). The exact 19/19 event allowlist, wildcard-off, single-endpoint, no-replay and no-secret-rotation claims in AGENTS.md rule 6 are UNVERIFIED. Needs: Stripe dashboard.

4. CREDENTIAL ROTATION GATE — AGENTS.md rule 15 says the Stripe secret/webhook, Supabase service-role and Mux token pair must be rotated and reinstalled as Vercel `Sensitive`. Whether that is done is UNVERIFIED. Needs: Vercel + provider dashboards. (I did confirm no secrets are present in the deployed bundle or the public repo tree — see below.)

5. APPLE ASC V2 — the verifier code is sound (root-cert chain, bundle com.verzatv.app, app id 6752884623, non-consumable/quantity/ownership/reason checks, sandbox allowlist, UUID app-account-token, notification dedupe) and the route rejects unsigned input live (400 "Invalid signedPayload"). No real signed notification or sandbox purchase was exercised. Needs: App Store Connect.

6. PUBLIC-REPO GIT HISTORY — I checked the current tree (690 files: only .env.local.example, all placeholders) and path-filtered commit queries for .env, .env.local, .env.production and lib/mux-signed-map.ts (0 commits each). A full history clone and secret scan was NOT run. Needs: `git clone` + gitleaks/trufflehog on bigfilmsonly-alt/verza-tv.

7. NATIVE iOS BINARY — ../verza-native does not exist on this machine (the parent directory holds only novela, the-build, verza-tv). Its Supabase configuration, where its Bearer token comes from, and whether it embeds the complete paid map are UNVERIFIED — and item 7 is what determines whether D5-002 also breaks the iOS app or only the web.

8. SECOND REMOTE VISIBILITY — https://api.github.com/repos/Splash-Studio/verza-tv returns 404, which GitHub returns for both private and nonexistent repos. Whether `origin` is private is UNVERIFIED. Needs: an authenticated `gh api`.

9. END-USER WEB SIGN-IN — I did not submit the sign-in form (submitting forms on a live production site is outside what I will do unprompted). D5-002 rests on the deployed bundle contents, an authoritative NXDOMAIN, an in-page fetch failure from the live origin, and the code path trace. A human can close this in ten seconds by attempting any sign-in at https://www.verzatv.com/sign-in.

NOT gaps — verified clean, recorded so nobody re-does them:
- Secret scan of 235 deployed artifacts (45 JS chunks, 63 pages, 120 paid-episode HTML+RSC payloads, 4 sitemaps, robots.txt, llms.txt, sitemap.xml): zero hits for sk_live_/sk_test_/rk_live_/whsec_/sk-ant-/re_/service_role/MUX_TOKEN_SECRET/MUX_SIGNING_KEY_SECRET/CRON_SECRET/PRIVATE KEY. Exactly one JWT is present and it is the anon key, role:"anon" — by design.
- Capability projection holds at runtime: 0 withheld (paid) and 0 signed playback IDs in any of those 235 artifacts, including 120 paid-episode HTML and RSC payloads and all 4,913 URLs in episodes.xml. Only the intended 519 public IDs appear.
- Rate limiter is NOT X-Forwarded-For spoofable: 7 requests to /api/ai-host with a fixed fake XFF gave 200,200,200,200,200,429,429; switching to a different fake XFF still returned 429,429,429 — Vercel overwrites the header, so the bucket keys on the real client IP.
- All disabled money paths fail closed live: /api/checkout 503, /api/coins/purchase 501, /api/coins/balance 501, /api/creator-unlock 503, /api/unlock/season-pass 501, /api/entitlements/claim 410, /api/studio/generate 501, /api/uploads 501, /api/mux/webhook 503.
- All authenticated routes reject unauthenticated callers: billing-portal/watch-progress/saved-list/account-delete/account-sync 401, iap/apple/preflight+transactions 401, creator/{upload,apply,analytics,channel,content,me} 401, admin/{creators,review} 403, admin/stats 401, push/send 401, cron/vip-renewal-reminders 401, payments/capabilities 401, entitlements 401, entitlements POST 405.
- Open-redirect guards present and correct on every `next` parameter (app/api/auth/callback/route.ts:9, app/actions/auth.ts:15, :39, :141) — startsWith("/") && !startsWith("//").
- Cron auth uses node:crypto timingSafeEqual with a length pre-check and a 16-char minimum (app/api/cron/vip-renewal-reminders/route.ts:31-37).
- Password reset is enumeration-safe: uniform redirect plus after() deferral so the response time does not vary (app/actions/auth.ts:97-134).
- The Stripe webhook is the strongest code in the repo: signature verify, durable claim_stripe_webhook_event with processed/acquired/busy states, purchase uniqueness with 23505 reconciliation and field-by-field conflict checks, re-read of provider state before every grant, deletion-tombstone re-resolution immediately before access, refund/dispute reconciliation through SECURITY DEFINER RPCs, and analytics failures that never trigger a Stripe retry.
- No client-trusted ownership claims found anywhere: /api/events strips revenue_cents and currency and rejects server-only events; /api/account/sync touches only watch_progress and saved_list and clamps device timestamps to now; /api/unlock/confirm and /api/subscribe/confirm re-read the session from Stripe and check paid + slug + type + userId + customerId + canonical financials + terms consent + unrefunded before granting.

### D1 — STATES: loading, empty, error, skeleton/populated on every route in the manifest. Uni

Coverage: **120 of 120** items examined.

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

### D4 — Performance and memory. Rendition cap on the hls.js INSTANCE under the restored routi

Coverage: **277 of 321** items examined.

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

### D6 — Accessibility. The accessibility properties of the 535 manifest interactive elements 

Coverage: **594 of 600** items examined.

Six of the 65 page route patterns could not be examined in their real rendered state; all six were still examined statically for accessible names and size classes, and their interactive elements are inside the 535/535 static count.

1. /shop/[slug] — 404s for every product in production by design. app/shop/[slug]/page.tsx:30 calls notFound() unless MERCH_CHECKOUT_ENABLED === "true", which it is not (consistent with AGENTS.md rule 2, merchandise Checkout fail-closed). Verified: /shop/champion-tie-dye-hoodie and /shop/verzatv-mug both return the 404 body. NEEDS: MERCH_CHECKOUT_ENABLED=true on a preview deployment. This also leaves components/AddToCartButton.tsx (6 items), components/ImageCarousel.tsx (6) and components/CartDrawer.tsx (11) unreachable at runtime.
2. /c/[slug] — no published creator channel exists to resolve. /c/verza returns "Clip Not Found". NEEDS: a published row in creator_content, which is blocked because the Mux creator-ingest webhook returns 503 with its verification secret intentionally absent.
3. /watch/[...slug] — same cause as (2); requires a published creator title.
4. /admin/dashboard — the proxied request rendered the browse page rather than the admin surface, so what I measured was not the admin UI. NEEDS: an authenticated admin session. 35 interactive items in components/CreatorDashboard.tsx and 17 in components/AdminReview.tsx are therefore static-only.
5. /admin/review — same, not reachable unauthenticated.
6. /dev/perf — returns a 404 body in production. NEEDS: the dev flag that gates it.

Additional coverage caveats:
- Of the 535 manifest interactive elements, all 535 were examined statically (accessible name, size classes, focus handling) and 2,679 rendered instances were measured live. The elements only reachable behind sign-in or the disabled creator/merch rails — notably components/creator/ApplicationWizard.tsx (26), components/AmazonBag.tsx (15), components/creator/ui.tsx (11), components/VipCard.tsx (9), components/AskVerza.tsx (9), components/LanguagePicker.tsx (8), components/CreatorWatch.tsx (7) — were not measured in a real viewport, so their tap-target sizes and contrast are asserted from source rather than measured. The 36-input focus-ring finding (D6-008) covers 17 of the ApplicationWizard fields on that basis.
- Screen-reader traversal was reconstructed from the DOM accessible-name sequence, the real Tab order, and the live cascade; it was not verified with VoiceOver or TalkBack on a device. A device pass would confirm the announcement wording for D6-011, D6-015, D6-017 and D6-018.
- prefers-reduced-motion could not be toggled in the harness browser, so D6-016 was verified by enumerating the reduced-motion rules present in the live cascade and confirming that the animating elements match none of them, rather than by observing motion stop. That is the cascade-level equivalent of observing the effect; a device pass with Reduce Motion on would close it.
- The site sends x-frame-options: DENY, so the 320px measurements were taken through a local read-only reverse proxy of www.verzatv.com that strips only X-Frame-Options and CSP. All HTML, CSS and JS measured were the deployed bundle (CSS chunk /_next/static/immutable/chunks/1y2muhl66_cr7.css); nothing local was substituted.
- Two of the routes I first probed were 404s from slugs I guessed wrong (/shop/verza-classic-tee, /series/mi-jefe-obsesionado); both were re-run against real slugs pulled from the live sitemap and lib/catalog.ts, and the 404 measurements were discarded from the totals.

### D3 — Dead Ends. All 535 interactive elements in docs/audit/00-manifest.json (interactive.i

Coverage: **487 of 609** items examined.

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

### D7 — Viewport and device. Every page-route class rendered at 320 / 375 / 390 / 430 / 768 p

Coverage: **300 of 325** items examined.

25 of the 325 scoped items (5 route classes x 5 widths) could not be rendered in their intended state, and a further 10 were examined only in a redirected state.

1. /[handle] (5 items) — needs a published, approved creator channel row in Supabase. https://www.verzatv.com/@verza returns 404. Needs: a seeded published channel, or a preview deployment with fixture data.
2. /c/[slug] (5 items) — lib/clips.ts:41 declares `const CLIPS: Clip[] = []`, so getClipBySlug can never resolve and every clip URL 404s in production. Needs: a real clip row before the route can be laid out at all.
3. /watch/[...slug] (5 items) — app/watch/[...slug]/page.tsx:44-54 requires a published creator_content row with a free pricing_type and a Mux playback id. None exist. Needs: a published free creator title.
4. /shop/[slug] (5 items) — app/shop/[slug]/page.tsx:8-12 returns no static params unless MERCH_CHECKOUT_ENABLED === "true"; all product URLs 404 in production. Needs: a preview deploy with that flag on, since the merch detail page carries an image carousel and quantity steppers that D7 has never measured.
5. /dev/perf (5 items) — gated by PERF_TEST_MODE (app/dev/perf/page.tsx:12); 404 in production. Needs: a preview deploy with the flag on. components/PerfHarness.tsx:107 contains a `minWidth: 280` that has never been rendered at 320px.
6. /admin/dashboard and /admin/review (10 of the 300 counted as examined) — both return 307 to / without an admin cookie session (verified: x-matched-path /admin/dashboard, HTTP 307, and the followed response is byte-identical to / at 113,899 bytes). What I measured at all five widths is the homepage, not the admin UI. components/AdminDashboard.tsx contains `w-[160px]` and 24x24 controls that D7 has not rendered. Needs: an admin session cookie.

Additional qualifications on the 300 that were examined:

7. No real iOS device or simulator was exercised. safe-area-inset values (D7-003, D7-005, D7-011) were reproduced by re-declaring every env()-reading rule with literal 34/47/59px insets against the deployed stylesheet — correct arithmetic, but not an on-device observation. Likewise iOS Safari's focus-zoom (D7-007) and its handling of maximum-scale (D7-006) are stated from the documented behaviour, not measured.
8. The dvh/svh question is unresolved. Every episode slide and the feed scroller are `height: var(--feed-h, 100dvh)` (components/EpisodeFeed.tsx:1048, 2073, 2082, 2099, 2116, 2122, 2164) inside a `position:fixed; inset:0` container, and --feed-h is only ever set inside the desktop-frame media query (app/globals.css:729). Whether the fixed container and 100dvh agree while iOS Safari's toolbars animate — and therefore whether scroll-snap positions drift mid-binge — cannot be determined in Chrome. This is the one place where a real-device pass would most change the picture, and it touches the "swipe feel" asset.
9. Client-only surfaces were audited from source plus injected markup rather than live interaction at phone widths, because Chrome will not size a window below ~606px: the cart drawer, series info drawer, sitemap sheet, search overlay, episode picker, language dropdown and the Amazon bag drawer. The one exception is the Amazon-pill-vs-paywall collision (D7-004), which was reproduced end-to-end on the live production page with no injection.
10. Tap-target findings are geometric, from getBoundingClientRect. No physical-device touch-accuracy testing was done, and my inline-link exemption (an <a> with display:inline inside a longer text block) is a heuristic — a handful of the 921 sub-24px instances at 390px are breadcrumb-style links that a stricter reading would exempt.
11. Only the 20-locale default (en) was rendered. Longer German and Russian nav labels and the single RTL locale (ar) were not laid out; note that app/layout.tsx:100 hard-codes `<html lang="en">` with no dir attribute, so an RTL layout pass has nothing to act on outside the paywall overlay (components/EpisodeFeed.tsx:2513).
