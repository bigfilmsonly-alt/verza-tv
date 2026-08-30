# Verza TV — Verified Findings Register

**277 findings raised. 228 confirmed, 49 discarded, 0 unresolved. Discard rate 18%.**

Every finding here was raised by one agent and independently reproduced by a
different one. Findings that did not survive are in `discarded.md` with the
reason. A discard rate near zero would mean the verification was not
adversarial; 18% is in the same range as Phase 0's 23%.

| Severity | Confirmed |
|---|---|
| **S1** | 21 |
| **S2** | 28 |
| **S3** | 91 |
| **S4** | 88 |

Severity is the verifier's corrected value where it differs from the raiser's.

---

## S1 — takes or loses money, exposes data, crashes, or blocks a purchase or playback

### D3-001 — The production browser bundle's Supabase host does not exist in DNS. "Continue with Google" and "Continue with Apple" on /sign-in and /sign-up navigate the viewer out of the app onto a browser DNS-error page, and every c

*Raised by D3 — Dead Ends. All 535 interactive elem · **touches money or the shipped rail***

**Reproduction.** 1. Open https://www.verzatv.com/sign-in in Chrome. 2. Tap "Continue with Apple" (or Google). 3. The tab navigates to https://mmvbmrrwgludfmfalfcm.supabase.co/auth/v1/authorize?provider=apple&redirect_to=... and lands on the browser's "This site can't be reached" error page — outside the product, with no way back except the browser Back button. (The first tap sometimes appears to do nothing at all because supabase-js navigates asynchronously; a second tap navigates.) 4. Confirm the host: `dig +short @8.8.8.8 mmvbmrrwgludfmfalfcm.supabase.co` -> NXDOMAIN.

**Evidence.** Deployed bundle (fetched from www.verzatv.com, not built locally): chunks 0fkfn44ctjja6.js and 0oo5zhjmwzr5q.js both contain `createBrowserClient("https://mmvbmrrwgludfmfalfcm.supabase.co", "eyJ...")` — the only Supabase URL anywhere in the shipped JS (2 occurrences, 0 others). The bundled anon JWT decodes to {iss:"supabase", ref:"mmvbmrrwgludfmfalfcm", role:"anon"}, so URL and key agree on the same project. DNS: NXDOMAIN on the local resolver, on 8.8.8.8 and on 1.1.1.1. Negative control: jejispfvlkwastzvwtwu.supabase.co (the project named in the repo's own notes) resolves to 104.18.38.10 — so this is not a resolver problem, and the notes are stale. curl to the host: `Could not resolve host`

**Independent verification.** Reproduced end-to-end on the live domain. Severity S1 stands (auth/security surface + it blocks every purchase path).

1. DEPLOYED BUNDLE (fetched from www.verzatv.com, not built locally). Pulled https://www.verzatv.com/sign-in, extracted all 14 <script src="/_next/static/immutable/chunks/*.js"> and downloaded them. Exactly one Supabase host appears in the shipped JS, twice, in chunks/0oo5zhjmwzr5q.js and chunks/1uz8qcjprw-ih.js:
   e.s(["createBrowserSupabase",0,function(){return(0,t.createBrowserClient)("https://mmvbmrrwgludfmfalfcm.supabase.co","eyJ...")
   The bundled anon JWT payload is base64 "eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1tdmJtcnJ3Z2x1ZGZtZmFsZmNtIiwicm9sZSI6ImFub24i" = {iss:"supabase", ref:"mmvbmrrwgludfmfalfcm", role:"anon"} — URL and key agree on the same project ref. 1uz8qcjprw-ih.js also carries the "Continue with Google"/"Continue with Apple" component in the same chunk. Both /sign-in and /sign-up load that chunk (verified in each page's HTML).

2. DNS. mmvbmrrwgludfmfalfcm.supabase.co returns NXDOMAIN from the local resolver, 1.1.1.1 and 8.8.8.8. curl exits 6 (couldn't resolve host). Control: jejispfvlkwastzvwtwu.supabase.co (the ref recorded in project memory) r

---

### D3-003 — The "Series Unlock · $1.99" card on all 86 paid show pages is an inert <div> with no purchase path. A viewer who wants to buy from the show page cannot.

*Raised by S3 — SHOW PAGES: all 96 catalog rows (91 · **touches money or the shipped rail***

**Reproduction.** Open https://www.verzatv.com/series/the-pendleton-secret. The gradient-framed card reads "Series Unlock / All 60 episodes · one-time purchase / $1.99". Tapping it does nothing. The only route to purchase is Play → swipe past episode 5 → paywall.

**Evidence.** Measured in the deployed DOM: the card element is tagName DIV, closest('a,button') === null, computed cursor "auto", role null, tabindex null, 0 interactive descendants. <main> contains exactly 3 interactive elements site-wide on this route: the Play CTA (/series/the-pendleton-secret/1), the episode-dropdown button, and the next-episode chevron (/series/the-pendleton-secret/2). Source: app/series/[slug]/page.tsx:328-364 — the block is a plain nested <div> pair, never an <a> or <button>.

**Independent verification.** REPRODUCED EXACTLY, against production (www.verzatv.com) and against the source at /Users/jothamhall/E! CREATOR ECONOMY/verza-tv/middleware.ts. Severity S1 stands.

CODE (verified, line numbers exact as cited):
- middleware.ts:18 `const rateLimitMap = new Map<string, RateBucket>()` — module-scope, in-process.
- middleware.ts:49 `{ pattern: /^\/api\/playback\//, limit: 90 }`; :48 `/api/access` 120; :32-:37 `/api/checkout` 15, `/api/unlock` 15, `/api/subscribe` 15, `/api/auth/` 10.
- middleware.ts:129 `const key = `${ip}:${limit}``; :134-142 read/increment against that Map.
- The file's OWN header comment, middleware.ts:10-13, already documents this: "On serverless platforms (Vercel) each isolate has its own Map, so limits are per-instance, not globally shared... For globally-shared counters consider an external store (Redis / Upstash)." So this is a known accepted constraint in code, not a hidden bug — but it is presented as a working control and it is not one.

DEPLOYED-BUNDLE CHECK (standing rule 4): fetched live and read x-ratelimit-limit per path — playback 90, access 120, events 180, watch-progress 60, /api/og (catch-all) 30. All five match middleware.ts:48-54. The live middlew

---

### D3-011 — The show page offers no way to save a title, share it, or resume it — despite My List, watch progress and share being product features. It has three interactive elements total.

*Raised by S3 — SHOW PAGES: all 96 catalog rows (91*

**Reproduction.** Open any of the 96 show pages. <main> contains only: Play CTA, episode-picker button, next-episode chevron. There is no add-to-list control even though /library renders My List and Supabase carries a saved_list table.

**Evidence.** Measured in the deployed DOM on /series/the-pendleton-secret: [...document.querySelectorAll('main a, main button, main [role="button"]')] → 3 elements. lib/i18n.ts ships profile.myList / library.myList / library.noSavedShows in all 20 locales; components/BottomNav links /library. scripts/test-feed-integrity.mjs:2264 calls the show page "the one surface carrying the synopsis, the cast and the price" — save and share were never added to it.

**Independent verification.** REPRODUCED against production, twice, negative-controlled.

CODE: components/EpisodeFeed.tsx:1443-1446 is exactly as reported. The "outlier, not house style" claim holds - sessionStorage at :1265 and localStorage at :1353, :1897, :1908 are all try//catch-wrapped. Corroborating: the codebase documents blocked storage as an expected condition elsewhere (LangProvider catch comment "private mode / blocked storage"; lib/amazon-bag.tsx "Corrupt or unavailable storage (private mode, quota)"; lib/guest-storage.ts:34 on throwing at import). So this is a missed guard, not an unknown condition.

DEPLOYED BUNDLE (Rule 4): production chunks 13rz7ciqnwv2l.js, 27_6kgf3tx4s2.js and 2x1_kizd5hf_1.js all ship `useState(()=>"false"!==localStorage.getItem("verza-muted"))`. The `typeof window !== "undefined"` guard was dead-code-eliminated by the client build, so the shipped code is a bare unguarded access - nothing stands between the initializer and the throw.

REPRO 1 (production, client-side nav): on www.verzatv.com I redefined window.localStorage to raise the real DOMException("...","SecurityError") that Safari Block-All-Cookies / Chrome block-all-site-data raise, then clicked a poster (client-side

---

### D4-009 — BrowsePage's prewarm comment describes the abandoned show-page-first routing and states the opposite of what the file does, which is the kind of stale comment Standing Rule 5 exists for.

*Raised by D4 — Performance and memory. Rendition c*

**Reproduction.** Read components/BrowsePage.tsx:249-256 against components/BrowsePage.tsx:899, :953, :989, :1201, then load https://www.verzatv.com/ and read the anchors.

**Evidence.** The comment says 'Continue Watching is the last one on this page: every tile, hero, category row and search result now opens the show page instead'. In fact posterClick is wired to the Drama/Hot tile grid (:1201), the reality grid (:899), the red-carpet grid (:953) and the hero (:989) as well as Continue Watching (:631). Verified in production: the home page DOM contains 25 anchors, all ending in /1 (e.g. /series/tied-by-fate/1), and clicking one starts the instant player and is adopted by EpisodeFeed.

**Independent verification.** CONFIRMED against www.verzatv.com, but the raiser understated it badly and got the causal link backwards. Severity corrected S4 -> S1.

CLAUSE 1 — "per-isolate, not a global limit". Confirmed, and it is a total bypass, not a degradation. The raiser's own repro (a sequential run) is the weakest possible demonstration; I could not even reproduce it sequentially — 14 then 12 sequential GETs to /api/access?slug=the-escort decremented monotonically (119->106, then 118->107), because sequential requests pin to one warm isolate. Concurrency is what breaks it. A 60-request parallel burst to /api/access returned 15 responses carrying x-ratelimit-remaining: 119 — i.e. 15 fresh isolates with an empty Map each.

The decisive test was the expensive tier. /api/ai-host is limit 5/min because it spends Anthropic credits (middleware.ts:27, "Expensive: Anthropic AI credits"). It exports POST only, so I probed with GET — middleware runs first and counts the request, the handler then 405s without invoking the model, so no credits were burned.
  - 40 CONCURRENT GETs -> 40x 405, ZERO 429. 8x the limit through in ~2s.
  - 12 SEQUENTIAL keep-alive GETs to the identical URL -> 2x 405, 10x 429.
Same URL, sa

---

### D5-002 — Web authentication points at a Supabase project that does not exist. The deployed bundle hard-codes https://mmvbmrrwgludfmfalfcm.supabase.co plus that project's anon key; the host is authoritatively NXDOMAIN. The server'

*Raised by D5 — Security. Every security-relevant s · **touches money or the shipped rail***

**Reproduction.** 1. curl -s https://www.verzatv.com/ , extract /_next/static chunks, grep for supabase -> createBrowserClient("https://mmvbmrrwgludfmfalfcm.supabase.co", "eyJ...") in 7 places across 7 deployed chunks.
2. Decode the anon JWT payload -> {"iss":"supabase","ref":"mmvbmrrwgludfmfalfcm","role":"anon"}.
3. dig @neil.ns.cloudflare.com mmvbmrrwgludfmfalfcm.supabase.co A -> status: NXDOMAIN, flags: qr aa (authoritative). Same from 8.8.8.8, 1.1.1.1, 9.9.9.9.
4. In a real browser on https://www.verzatv.com, run fetch('https://mmvbmrrwgludfmfalfcm.supabase.co/auth/v1/health') -> TypeError: Failed to fetch.
5. Contrast: POST https://www.verzatv.com/api/push/subscribe (unauthenticated, writes via getServic

**Evidence.** Deployed chunks js2/0fkfn44ctjja6.js, 0h4pur-m4qpvj.js, 0oo5zhjmwzr5q.js, 1uz8qcjprw-ih.js, 273sb6e-xrgmd.js, 2u2o4tt-_dnr2.js, 3ecubpl8pz2as.js all contain createBrowserClient("https://mmvbmrrwgludfmfalfcm.supabase.co", <anon JWT>). Authoritative Cloudflare NS answer: NXDOMAIN with the aa flag. Control: gylklzdgjzhgmjidzwsy.supabase.co resolves (104.18.38.10), so project hosts do resolve in this environment. Code path split: lib/supabase/client.ts:4-5 and lib/supabase/middleware.ts:8-9 use NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY (inlined at build = the dead host); lib/supabase/server.ts:5-6 uses SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (runtime env = live). Consumers of the

**Independent verification.** CONFIRMED against live www.verzatv.com. Reproduced end-to-end, not by string matching.

1. DEPLOYED BUNDLE (fetched fresh, cache-busted, 2026-08-29 23:24Z). Crawled /, /sign-in, /sign-up, /me, /forgot-password, /reset-password, /library, /search and downloaded all 20 referenced chunks. Exactly one Supabase host appears anywhere in the shipped JS:
  /_next/static/immutable/chunks/0fkfn44ctjja6.js and 2u2o4tt-_dnr2.js contain
  e.s(["createBrowserSupabase",0,function(){return(0,t.createBrowserClient)("https://mmvbmrrwgludfmfalfcm.supabase.co","eyJ...")}])
  (0t8x_qxjrozto.js and 1uz8qcjprw-ih.js also reference the host.) Anon JWT payload decodes to {"iss":"supabase","ref":"mmvbmrrwgludfmfalfcm","role":"anon","iat":1781888317,"exp":2097464317} — key ref matches the URL, so this is not a mismatch, it is a whole project that is gone.

2. HOST DOES NOT EXIST. Authoritative NXDOMAIN from BOTH nameservers for supabase.co (neil./christina.ns.cloudflare.com), status NXDOMAIN with the `aa` flag; same NXDOMAIN from 1.1.1.1, 8.8.8.8 and the system resolver. curl to https://mmvbmrrwgludfmfalfcm.supabase.co/auth/v1/health → "Could not resolve host". Control jejispfvlkwastzvwtwu.supabase.co (the p

---

### D5-003 — Every named pre-release security gate passes with the paid-playback authorization deleted. Four independent authorization-removing mutations — deleting the 402 paywall branch, making /api/access always return full:true, 

*Raised by D5 — Security. Every security-relevant s · **touches money or the shipped rail***

**Reproduction.** In an isolated copy of the repo (app/, components/, lib/, scripts/, supabase/, middleware.ts, vercel.json, next.config.ts, package.json, symlinked node_modules and public/), confirm all four suites pass at baseline, then apply one mutation at a time and re-run all four:
M2  app/api/playback/[episode]/route.ts:85  `if (!isFree && !isVip && !hasPurchased) {`  ->  `if (false) {`
M4  app/api/access/route.ts:53  `return privateJson({ full: isVip || hasEntitlement });`  ->  `return privateJson({ full: true });`
M5  lib/mux-playback.ts:118-123  replace the `if (!mapped) throw new MuxPlaybackConfigurationError(...)` fail-closed with `if (!mapped) return publicDelivery(publicId);`
M6  app/api/entitle

**Evidence.** Baseline in the isolated copy: playback-security PASS, feed-integrity PASS, payment-integrity PASS, mux-webhook-security PASS. With M2 applied: all four PASS (exit 0). With M4: all four PASS. With M5: all four PASS. With M6: all four PASS. The suites are not uniformly blind — two control mutations WERE caught: changing `playbackId: isFree ? mux.playbackId : undefined` to `playbackId: mux.playbackId` produced 'paid API must omit a separate playback ID', and switching components/Player.tsx from @/lib/mux-public-map to @/lib/mux-map produced 'legacy player must import the public map' plus 'runtime source imports complete paid-capability map'. So the suites assert on data-shape and import hygien

**Independent verification.** Reproduced independently. Built my own isolated copy in scratchpad (app/, components/, lib/, scripts/, supabase/, middleware.ts, vercel.json, next.config.ts, package.json, tsconfig.json, next-env.d.ts, eslint.config.mjs; node_modules and public symlinked to the real repo). The real repo was never edited — after every restore, diff of all five mutated files against the originals is IDENTICAL, and their mtimes are still Aug 27 10:06.

BASELINE (isolated copy): test-playback-security exit 0 PASS, test-feed-integrity exit 0 PASS (walked 4,913 episodes / 91 live series), test-payment-integrity exit 0 PASS (6 suites), test-mux-webhook-security exit 0 PASS. tsc --noEmit exit 0. eslint . exit 0, 8 warnings.

AUTHORIZATION-REMOVING MUTATIONS — all four gates exit 0 on every one:
- M2 app/api/playback/[episode]/route.ts:85 `if (!isFree && !isVip && !hasPurchased) {` -> `if (false) {` (deletes the 402 paywall entirely): 0/0/0/0, all PASS.
- M4 app/api/access/route.ts — `return privateJson({ full: true });` inserted above the getUser() gate (every caller, anonymous included, reads as entitled): 0/0/0/0.
- M5 lib/mux-playback.ts:118-123 `throw new MuxPlaybackConfigurationError("Signed playback 

---

### D5-004 — 3,461 source master video files for paid episodes are publicly downloadable, unauthenticated, from a third-party Supabase Storage bucket, served with access-control-allow-origin: *. These are the pre-transcode masters — 

*Raised by D5 — Security. Every security-relevant s · **touches money or the shipped rail***

**Reproduction.** 1. Open scripts/out/placement.json (4,146 rows). Keys are Mux playback IDs; each value has a `url` on https://gylklzdgjzhgmjidzwsy.supabase.co/storage/v1/object/public/show-thumbnails/<folder-uuid>/<file-uuid>.mp4
2. Intersect the keys with the withheld/paid ID set -> 3,461 rows are paid episodes.
3. curl -I on any of those URLs, no credentials.

**Evidence.** placement.json: 4,146 rows; 3,461 keys are current paid (withheld) playback IDs, 426 are free, 259 are not in the current catalog. Sample resolution: ID5JK01RWV1vb1t1x0201ZmnBpNHaBumFtQonVwrcDJ8jw -> the-billionaires-vow episode 58; Xa9OMJb8uMQ5ZR4xcSJiDaWJyZqe3Dcny5SPmcjeSoc -> the-billionaires-vow episode 60. HEAD on both URLs: HTTP/2 200, content-type video/mp4, content-length 239,959,125 and 206,385,239, access-control-allow-origin: *, cache-control: no-cache, last-modified Mon 23 Feb 2026. 70 distinct live series affected. Mitigating facts, stated plainly: the bucket cannot be enumerated without credentials (POST /storage/v1/object/list/show-thumbnails -> 400 "headers must have required

**Independent verification.** CONFIRMED against live infrastructure on 2026-08-29. Counts reproduced independently: parsed lib/mux-map.ts (4,913 IDs) and lib/mux-public-map.ts (519 public) -> withheld = 4,394; scripts/out/placement.json has 4,146 keys; intersection = 3,461 paid/withheld, 426 free, 259 not in catalog — exactly the raiser's numbers. Unauthenticated HEAD on the two evidence URLs returned HTTP/2 200, content-type video/mp4, content-length 239,959,125 and 206,385,239, access-control-allow-origin: *. To avoid confirming a cherry-picked pair I drew 10 RANDOM paid rows and HEADed them: 10/10 -> 200, 55–362 MB, ACAO *, 3.6–34.6 Mbps. Proved the bytes are the real episode: ffprobe over HTTP on my-celebrity-boyfriend-killed-me ep 23 (catalog freeEpisodes: 5, so paid) returned h264 1080x1920, duration=121.173913s, size=54,824,382 — duration matches MUX_MAP's 121s for that exact episode; a range fetch shows ftyp isom/avc1 with mdat at byte 44. So these are full-length, full-resolution pre-transcode masters, far above the HLS renditions a paying customer gets, while lib/mux-public-map.ts deliberately withholds 4,394 paid IDs and lib/mux-playback.ts implements 30-minute signed playback — the bucket bypasses t

---

### D5-005 — The legacy public Mux playback IDs for all 4,394 paid episodes still carry a public playback policy, so possession of the ID alone is sufficient to stream a paid episode. Signed playback is correctly live on the signed I

*Raised by D5 — Security. Every security-relevant s · **touches money or the shipped rail***

**Reproduction.** Pick any playbackId present in lib/mux-map.ts but absent from lib/mux-public-map.ts (a paid episode), then: curl -s -o /dev/null -w '%{http_code}' https://stream.mux.com/<id>.m3u8  and  https://image.mux.com/<id>/thumbnail.jpg?time=5

**Evidence.** Paid ID 0000fZokybPD0248yKcMIXbIBewLv01vFi01kdF1JEFLVT7M -> HTTP 200, 1,970-byte HLS master. Paid ID 0015oD6lNW3pqeepEtnfqjE9Kh7PI5VrOmqr4qB02USiA -> HTTP 200, 1,974 bytes. Its thumbnail -> HTTP 200, image/jpeg. By contrast the mapped signed ID 00007bfsR94H0000013cW7Vl2p4f2TUqJ4cfo5ktqmhO400hw -> HTTP 403 (65 bytes) without a token, which confirms MUX_SIGNED_PLAYBACK_ENABLED is genuinely on and the signed policy is genuinely applied. AGENTS.md rule 8 records the retention of the public paid IDs as deliberate ('The old 1.2 app still needs legacy public paid IDs, so do not retire them before a separately approved post-2.0 forced-update/drain gate'). That decision is what turns D5-001 from an i

**Independent verification.** Reproduced exactly, at scale, against live Mux.

WHAT I DID
1. Rebuilt the paid-ID set from source: `lib/mux-signed-map.ts` has 4,394 key/value pairs (legacy public ID -> signed ID). Intersected the 4,394 keys with the 519 IDs in `lib/mux-public-map.ts`: overlap = 0. So every key is a paid episode whose ID the client map deliberately withholds.
2. The two IDs in the evidence still behave as claimed, today: `0000fZokybPD0248yKcMIXbIBewLv01vFi01kdF1JEFLVT7M` -> HTTP 200, 1,970-byte HLS master; thumbnail -> HTTP 200 image/jpeg 69,497 bytes. `0015oD6l...` -> HTTP 200, 1,974 bytes; thumbnail 200. No token, no cookie, no referer.
3. Not a manifest stub — I pulled the whole episode. Master lists three renditions (608x1080, 480x852, 270x480); the top variant playlist has 14 segments totalling 65.6s, matching `duration: 66` for `never-mess-with-a-badass-girl` episode 38 in `lib/mux-map.ts:1944`. That is the complete paid vertical episode, anonymously.
4. Same episode through production: `curl https://www.verzatv.com/api/playback/never-mess-with-a-badass-girl--38` (unauthenticated) -> HTTP 402 `{"status":"paywall",...}`. `freeEpisodes: 5` in `lib/catalog.ts:497`, so ep 38 is paid. The site r

---

### D5-007 — /api/push/subscribe accepts unauthenticated POST and DELETE keyed only by the push endpoint, with no ownership check: anyone holding an endpoint URL can detach another user's subscription from their account, overwrite it

*Raised by D5 — Security. Every security-relevant s*

**Reproduction.** POST https://www.verzatv.com/api/push/subscribe with {"endpoint":"<victim endpoint>","keys":{"p256dh":"x","auth":"y"}} and no Authorization header -> 200 {"subscribed":true}. The route upserts with onConflict:"endpoint" and user_id: user?.id ?? null, so an anonymous caller rewrites the row and nulls its user_id. DELETE the same endpoint with no credentials -> 200 {"removed":true}.

**Evidence.** app/api/push/subscribe/route.ts:10-11 — `const user = await getUser();` with no null guard before the write; :57-66 — upsert({ user_id: user?.id ?? null, endpoint, p256dh, auth }, { onConflict: "endpoint" }); :80-110 — the DELETE handler has no getUser() call at all and deletes by endpoint alone. Verified live: POST with endpoint https://audit.example.invalid/verza-d5-audit-probe-delete-me and no auth returned HTTP 200 {"subscribed":true}; the follow-up unauthenticated DELETE returned HTTP 200 {"removed":true} (probe row removed). Exploitability is bounded by endpoint secrecy — push endpoints are long unguessable URLs — but there is no authorization check whatsoever, and the anonymous-insert

**Independent verification.** Reproduced live against www.verzatv.com with zero credentials (no cookie, no Authorization header), using a throwaway probe endpoint so no real subscription was touched. Both probe rows were cleaned up afterward. No repo file edited.

WHAT I RAN AND SAW:
1) Anonymous POST /api/push/subscribe {"endpoint":"https://verifier-probe.example.invalid/verza-d5-007-<ts>-a","keys":{"p256dh":"VERIFIER_KEY_ONE","auth":"VERIFIER_AUTH_ONE"}} -> HTTP 200 {"subscribed":true}. This is proof the row WROTE, not just that the handler ran: route.ts:68-71 returns 500 "Failed to save subscription" on any supabase error, so 200 means the upsert committed to the production DB.
2) Anonymous POST again, SAME endpoint, DIFFERENT keys -> HTTP 200. supabase/migrations/003_push_subscriptions.sql:7 declares `endpoint text not null unique`, so a plain insert would have failed 23505 -> 500. The 200 proves the ON CONFLICT (endpoint) DO UPDATE path executed and rewrote every supplied column. supabase-js upsert emits DO UPDATE SET for all provided columns, and the payload includes user_id: user?.id ?? null (route.ts:59) -> an anonymous caller nulls the victim's user_id and replaces p256dh/auth. Overwrite primitive demo

---

### D5-008 — The production Content-Security-Policy allows 'unsafe-inline' and 'unsafe-eval' in script-src, which removes the CSP's ability to contain an XSS. It is the only compensating control behind the two dangerouslySetInnerHTML

*Raised by D5 — Security. Every security-relevant s*

**Reproduction.** curl -sD - -o /dev/null https://www.verzatv.com/ | grep -i content-security-policy

**Evidence.** Live header: `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com ... https://adservice.google.com`. Source: next.config.ts, headers() -> Content-Security-Policy. The rest of the policy is well built (object-src 'none', base-uri 'self', form-action 'self' https://checkout.stripe.com, worker-src 'self' blob: for the hls.js transmuxer) and the other headers are correct and live: Strict-Transport-Security max-age=63072000; includeSubDomains; preload, X-Content-Type-Options nosniff, X-Frame-Options DENY, Referrer-Policy strict-origin-when-cross-origin, Permissions-Policy camera=(), microphone=(), geolocation=(). Missing but lower value: frame-ancestors (XFO covers it

**Independent verification.** CONFIRMED against the live deployment. Ran the finding's exact repro: `curl -sD - -o /dev/null https://www.verzatv.com/ | grep -i content-security-policy`. The live header's script-src is verbatim: `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com ... https://adservice.google.com`. Both `'unsafe-inline'` and `'unsafe-eval'` are present, which is a genuine, well-established weakening of the CSP's XSS-containment value. Source confirmed at next.config.ts headers() -> Content-Security-Policy; the rest of the policy the finding praises is real (object-src 'none', base-uri 'self', form-action 'self' https://checkout.stripe.com, worker-src 'self' blob:) and the sibling headers are live (HSTS max-age=63072000 preload, X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy, Permissions-Policy). Both dangerouslySetInnerHTML sinks exist as claimed (components/JsonLd.tsx:17, components/AskVerza.tsx:489).

Severity kept at S1 per the rubric's explicit "Anything in security is S1." This is a real security-posture defect verified in the deployed bundle, so it belongs in the security bucket.

Two caveats the fix owner should know, because the finding

---

### D5-011 — components/JsonLd.tsx writes JSON.stringify(data) straight into a <script> element without escaping `<`, so any future dynamic string containing `</script` breaks out of the JSON-LD block into executable HTML. Not exploi

*Raised by D5 — Security. Every security-relevant s*

**Reproduction.** components/JsonLd.tsx:17 — dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}. Any caller that ever passes a string containing `</script>` produces script execution. 30 pages call <JsonLd>.

**Evidence.** components/JsonLd.tsx:13-19. 30 call sites across app/ (page.tsx, series/[slug], series/[slug]/[episode], discover/[genre], genre/[genre], learn/[slug], compare/[slug], best/[slug], guides/[slug], genres/[slug], alan-mruvka/[slug], and 19 static pages). I confirmed the two exposed dynamic feeds are currently safe: /search?q= is not routed into JsonLd at all and is correctly React-escaped in the DOM (probe `"></script><script>alert(1)</script>` rendered as &quot;&gt;&lt;/script&gt;... in <title>, <h1> and the input value), and /discover/[genre] receives the still-percent-encoded segment. The fix is one line — escape `<` as < in the serializer — and it removes a whole class. The other dangerou

**Independent verification.** CONFIRMED as a real latent (not-exploitable-today) code issue, exactly as written. components/JsonLd.tsx:17 is `dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}` with no HTML-escaping; JSON.stringify does not escape `<`/`/`, so any value containing `</script>` would break out of the JSON-LD block. 30+ live pages use it. Standard fix is escaping `<`->< (also >, &, U+2028/2029).

I verified the finding's own claim that it is NOT exploitable today by attacking the one route that reflects raw URL input into JSON-LD: /c/[slug] has no generateStaticParams (rendered on demand) and passes the raw slug as clipSlug into embedUrl -> JSON.stringify. Live probes against www.verzatv.com:
- /c/the-mistress-trap--1%3C%2Fscript%3E%3Cb%3EPWNED123%3C%2Fb%3E -> JSON-LD emitted `embedUrl":"...--1%3C%2Fscript%3E%3Cb%3EPWNED123%3C%2Fb%3E"`; %3C stayed percent-encoded, no `<` in HTML, no breakout.
- %3C is never decoded to `<` (probe ZZ%3CZZ stayed ZZ%3CZZ).
- Raw literal `<b>` in the path was normalized to %3Cb%3E before reaching the param; grep '<b>' = 0 in the document.
- Raw `<` + %2F breakout attempt: `</script><b>QQ` count = 0. A literal `/` cannot exist in a single [slug] segment, so `</s

---

### D5-014 — public.handle_new_user() is the one SECURITY DEFINER function in the schema with no `revoke all on function ... from public`, breaking the pattern every other definer function follows.

*Raised by D5 — Security. Every security-relevant s*

**Reproduction.** grep -n 'security definer' supabase/migrations/*.sql and compare each hit against the presence of a matching `revoke all on function`. 008_reconcile_live_schema.sql:56-70 defines handle_new_user() as security definer with no revoke; every other definer function has one.

**Evidence.** 11 of 12 SECURITY DEFINER functions follow revoke-then-grant-to-service_role: claim_stripe_webhook_event (010:93-95), grant_series_entitlement_for_purchase (010:243-245), restore_vip_access_after_payment_resolution (010:320-323), reconcile_purchase_refund (010:451-453), claim_pending_entitlements (010:530-532), upsert_payment_account_tombstone (012:109-111), reconcile_stripe_dispute (013:259-263), preserve_non_stripe_entitlement_sources (015:146-148), record_apple_series_transaction (015:442-447), claim_apple_iap_notification (015:532-535), finish_apple_iap_notification (015:567-570) — all granted `to service_role` only, which is exactly right: no entitlement-granting RPC is callable by anon

**Independent verification.** REPRODUCED EXACTLY, and the scope is wider than written.

Repro: the finding's own command, unauthenticated, returned HTTP 200 / 934 bytes with the full ADMIN_EMAILS array (all three addresses). GitHub public API: bigfilmsonly-alt/verza-tv is private:false, visibility:public, fork:false, pushed_at 2026-07-14. It is this app, not a stale mirror (package.json name:verza-tv, next:16.2.9 — matches the project stack). Re-fetched with no-cache at verification time: still 200, 3 emails.

Note the remote confusion: MEMORY.md records origin as Splash-Studio/verza-tv, which is PRIVATE (raw fetch -> 404). The leak is via the repo's SECOND remote, "bigfilmsonly" -> bigfilmsonly-alt/verza-tv. Anyone fixing this by checking only `origin` will conclude there is no exposure.

SCOPE CORRECTION (raiser understated): the same three emails are also public in a SECOND file, app/api/admin/stats/route.ts:9-12, which holds a duplicated hard-coded copy of the list (raw fetch -> HTTP 200, 3 matches). Remediating only lib/admin.ts leaves the disclosure fully intact. Any fix must cover both, and the duplication is itself a drift hazard.

Confirmed NOT already-public by other means: all 100 sampled commits in 

---

### S2-002 — The API rate limiter does not bind in production: 150 parallel requests to /api/playback in 4 seconds against a documented 90/min limit returned 150x HTTP 200 and zero 429s.

*Raised by S2 — PLAYER / SHORTS: the vertical rail  · **touches money or the shipped rail***

**Reproduction.** seq 1 150 | xargs -P 12 -I{} curl -s -o /dev/null -w '%{http_code}\n' 'https://www.verzatv.com/api/playback/the-mistress-trap--1'  ->  150 x 200 in 4s. Repeat against /api/access (limit 120/min) with 200 parallel requests -> 200 x 200 in 4s. A sequential single-connection loop DOES produce 429s (10 of 91 during my catalog sweep), which is what makes the control look effective. The same middleware is the only rate control on /api/checkout (15/min), /api/unlock (15/min) and /api/auth/ (10/min).

**Evidence.** middleware.ts:49 sets `{ pattern: /^\/api\/playback\//, limit: 90 }`; middleware.ts:129-141 keys an in-process Map as `${ip}:${limit}`. That map lives in one serverless instance, so parallel connections fan out across instances and each sees a fresh bucket. Observable proof: immediately after the 150-request burst, `curl -sI https://www.verzatv.com/api/playback/the-mistress-trap--1` returned `x-ratelimit-limit: 90` with `x-ratelimit-remaining: 84` - the answering instance had counted 6 requests, not 150. Same shape on /api/access: after 200 requests, remaining reported 95 of 120. Filed S1 per the rubric's security clause; discovered through /api/playback and very likely also in the security/

**Independent verification.** REPRODUCED VERBATIM against www.verzatv.com (live deploy dpl_FEduFW6ftQZyapPx28PouXp55wk3), not the build.

1. Limiter is live: single GET /api/playback/the-mistress-trap--1 -> 200, `x-ratelimit-limit: 90`, `x-ratelimit-remaining: 88`. Middleware runs and counts.
2. Exact repro: `seq 1 150 | xargs -P 12 -I{} curl ... /api/playback/the-mistress-trap--1` -> 150 x 200, ZERO 429, 5s. Matches the raiser's 4s claim.
3. Mechanism proven from the response headers, not inferred: across the 150 responses `x-ratelimit-remaining` formed ~6-7 independent countdowns, each starting fresh at 89 (7 responses with rem=89, then ~5 responses per value stepping down to rem=51). The deepest single bucket only ever reached count 39 of 90. All 150 served from iad1. That is the per-isolate `rateLimitMap` (middleware.ts:18, key at :129) fanning out across concurrently-warm instances. Evidence field is correct.

HEADLINE IS OVERSTATED — "does not bind" is wrong; it binds at limit x warm-isolate-count. Measured with a zero-side-effect probe (`/api/playback/__probe--1`: underscore fails the slug regex -> 400 at route, still counted by middleware): 800 parallel at -P 12 -> 624 x 400 + 176 x 429. 624/90 = 6.9x o

---

### S2-003 — The player throws on mount and falls to the route error boundary in any browser where site data is blocked, because the mute preference is read from localStorage without a guard inside a useState initializer.

*Raised by S2 — PLAYER / SHORTS: the vertical rail  · **touches money or the shipped rail***

**Reproduction.** Safari > Settings > Privacy > Block All Cookies (or Chrome > block all site data), then open any episode URL. `window.localStorage` access raises SecurityError, the throw escapes the useState initializer, EpisodeFeed fails to render, and app/series/[slug]/[episode]/error.tsx takes over. Its "Try again" calls reset(), which re-renders the same component and throws again - a closed loop on the app's central surface.

**Evidence.** components/EpisodeFeed.tsx:1443-1446 - `const [muted, setMuted] = useState(() => { if (typeof window !== "undefined") return localStorage.getItem("verza-muted") !== "false"; return true; });` with no try/catch. Every other storage access in the same file is wrapped (sessionStorage at :1264-1270, localStorage at :1353, :1365, :1896-1898, :1907-1909), so this one is the outlier, not the house style. Same unguarded pattern at components/EpisodeFeed.tsx:1890 (toggleMute), components/HorizontalFeed.tsx:51-54 and :275, components/ShortsFeed.tsx:141.

**Independent verification.** REPRODUCED end-to-end against the deployed bundle, not the build.

DEPLOYED CODE (not just source). Pulled every chunk referenced by the live page https://www.verzatv.com/series/collateral-hearts/1 and grepped for "verza-muted". Hit in /_next/static/immutable/chunks/27_6kgf3tx4s2.js:
  let[P,B]=(0,r.useState)(()=>"false"!==localStorage.getItem("verza-muted"))
Note a detail the raiser did not have: in the shipped client chunk Turbopack dead-code-eliminated the `typeof window !== "undefined"` branch, so what actually runs is a BARE unguarded property read. The mute-toggle write also shipped unguarded in the same chunk: localStorage.setItem("verza-muted",String(e)).

EFFECT, NOT ASSIGNMENT. Stood up a local reverse proxy of www.verzatv.com (strips CSP/XFO only) that injects, before any Next script, the exact behavior a storage-blocked browser has — an accessor on window.localStorage that throws DOMException("The operation is insecure.","SecurityError"), verbatim Safari's message under Settings > Safari > Block All Cookies. All JS, HTML and API traffic is the real production deployment (dpl_FEduFW6ftQZyapPx28PouXp55wk3).

  CONTROL (same proxy, no injection), /series/collateral-hearts/

---

### S2-004 — /shorts autoplays with sound ON and ignores the viewer's saved mute preference, while the two other players default to muted and honour it.

*Raised by S2 — PLAYER / SHORTS: the vertical rail *

**Reproduction.** Mute the player on any episode (writes verza-muted="true"), then open /shorts. The feed initialises unmuted and unmutes the element as soon as play() resolves.

**Evidence.** components/ShortsFeed.tsx:163 - `const [muted, setMuted] = useState(false);` - the stored key is never read. Compare components/EpisodeFeed.tsx:1444 and components/HorizontalFeed.tsx:52, both `localStorage.getItem("verza-muted") !== "false"` (default muted). ShortsFeed WRITES the shared key at :141 but never reads it, so muting in Shorts affects the other players while the other players cannot affect Shorts. The unmute happens in doPlay(): `p.then(() => { if (!cancelled && !mutedRef.current) { vid.muted = false; ... } })`. Confirmed on production: the sound rail button rendered the label "On" (`t(muted ? "shorts.soundOff" : "shorts.soundOn")`), i.e. state muted === false, on a cold load with

**Independent verification.** CONFIRMED, severity raised S2 -> S1.

SOURCE: components/EpisodeFeed.tsx:1443-1446 is exactly as described - `const [muted, setMuted] = useState(() => { if (typeof window !== "undefined") return localStorage.getItem("verza-muted") !== "false"; return true; });` with no try/catch, i.e. a bare storage read in the render phase.

DEPLOYED BUNDLE (not the build): https://www.verzatv.com/_next/static/immutable/chunks/27_6kgf3tx4s2.js contains `(0,r.useState)(()=>"false"!==localStorage.getItem("verza-muted"))`. No try/catch, and the typeof-window guard is dead-code-eliminated in the client chunk, so it is a naked property read. The same chunk also carries the unguarded `localStorage.setItem("verza-muted",String(e))` from the mute button.

EFFECT REPRODUCED ON PRODUCTION (Chrome 151, www.verzatv.com): I redefined window.localStorage to throw `SecurityError: The operation is insecure.` (Safari's exact message under Block All Cookies), then client-navigated from the browse grid into /series/lost-and-found/1. The route error boundary took over: body text "This episode didn't load / Something went wrong on our side. Your place in the series is saved.", no playing video. Console carried `[episo

---

### S5-001 — Loading any URL with ?platform=ios permanently and irreversibly disables every purchase surface in that browser, and the same branch fires for any iOS home-screen PWA install. The blocked viewer is told the episode "isn'

*Raised by S5 — Shop and commerce. Agent C's actual · **touches money or the shipped rail***

**Reproduction.** 1. Open https://www.verzatv.com/series/the-mistress-trap/6?platform=ios in a clean browser profile. 2. Paywall renders "Episode Unavailable / This episode isn't available in this app." with no price and no buy button. 3. Navigate to https://www.verzatv.com/series/the-mistress-trap/6 with NO query string — still "Episode Unavailable". 4. Open https://www.verzatv.com/series/the-mistress-trap — the $1.99 Series Unlock card is gone. 5. localStorage.getItem('verza-platform') === 'ios' forever; grep confirms nothing anywhere in the repo ever removes that key. Separately: any iPhone user who adds the site to their home screen hits the same branch via navigator.standalone === true.

**Evidence.** lib/platform.ts:13-31 — `if (params.get("platform")==="ios"){ localStorage.setItem("verza-platform","ios"); return true } if (localStorage.getItem("verza-platform")==="ios") return true` and `if (isApplePlatform && navigator.standalone === true) return true`. `grep -rn "verza-platform" app components lib` returns exactly two hits, both in lib/platform.ts, neither a remove/reset. Measured live 2026-08-29 on www.verzatv.com: step 2 → {hasUnavailable:true, hasUnlockAll:false, buyButtons:[]}; step 3 → {flag:'ios', unavailable:true} with no query string; step 4 → {seriesUnlockCard:false, price:false}. Consumers gated by this one predicate: components/EpisodeFeed.tsx:1452, components/HideInIOSApp.

**Independent verification.** CONFIRMED — reproduced end-to-end on the live domain in a real Chrome profile, and confirmed present in the deployed bundle, not just the source.

DEPLOYED-BUNDLE PROOF (not the build): fetched https://www.verzatv.com/series/the-mistress-trap/6, extracted its script srcs (they are under /_next/static/immutable/chunks/, not /_next/static/chunks/), and downloaded them. /_next/static/immutable/chunks/21y4skb0tansy.js ships isIOSApp verbatim:
  e.s(["isIOSApp",0,function(){try{let e=new URLSearchParams(window.location.search);if("ios"===e.get("platform")){try{localStorage.setItem("verza-platform","ios")}catch{}return!0}if("ios"===localStorage.getItem("verza-platform"))return!0}catch{}let e=navigator.userAgent||"";return!!(/VerzaTV-iOS/i.test(e)||/iPhone|iPad|iPod/i.test(e)&&!0===navigator.standalone)}])
and /_next/static/immutable/chunks/428d7hhx0m19l.js ships the copy: "paywall.unavailableBody":"This episode isn't available in this app."

LIVE REPRO (Chrome, desktop UA, verified localStorage clean first — keys were only verza_anon_id, verza-amazon-bag, verza_resume_notif_asked):
1. /series/the-mistress-trap/6 clean → normal paywall renders: "Unlock All Episodes … All 61 episodes, inst

---

### S6-001 — The production client bundle's Supabase host (mmvbmrrwgludfmfalfcm.supabase.co) is NXDOMAIN, so every authentication path on verzatv.com targets a hostname that does not exist: sign-in, sign-up, both OAuth buttons, passw

*Raised by S6 — My List / Library / Profile / Accou · **touches money or the shipped rail***

**Reproduction.** 1. curl -s https://www.verzatv.com/_next/static/immutable/chunks/0fkfn44ctjja6.js | grep createBrowserSupabase -> createBrowserClient("https://mmvbmrrwgludfmfalfcm.supabase.co", "eyJ..."). 2. nslookup mmvbmrrwgludfmfalfcm.supabase.co -> NXDOMAIN (same from 8.8.8.8 and from Google DoH: {"Status":3}). 3. Control: nslookup jejispfvlkwastzvwtwu.supabase.co -> 104.18.38.10 / 172.64.149.246; fetching it from a verzatv.com page returns 401, i.e. reachable. 4. In a page on www.verzatv.com: fetch('https://mmvbmrrwgludfmfalfcm.supabase.co/auth/v1/health') -> TypeError: Failed to fetch, identical to a made-up ref, while api.stripe.com returns 401 in the same call. 5. npx vercel env ls production -> NEX

**Evidence.** Deployed chunk https://www.verzatv.com/_next/static/immutable/chunks/0fkfn44ctjja6.js: 'createBrowserSupabase",0,function(){return(0,t.createBrowserClient)("https://mmvbmrrwgludfmfalfcm.supabase.co","eyJ..."ref":"mmvbmrrwgludfmfalfcm"...)'. The server reads the same variable: lib/supabase/middleware.ts:6-7 (createServerSupabase) and lib/auth.ts:24-25 (getUser cookie path). DNS: NXDOMAIN from the local resolver, 8.8.8.8, and dns.google/resolve (Status 3), re-checked 10 minutes apart. Consumers that break: components/OAuthButtons.tsx:62, app/reset-password/ResetPasswordClient.tsx:85, app/actions/auth.ts:22 / :52 / :154, app/api/auth/callback/route.ts:16. Money impact: app/api/unlock/route.ts:9

**Independent verification.** CONFIRMED, but the raiser's repro is broken and I had to rebuild it.

REPRO AS WRITTEN IS INVALID: chunk 0fkfn44ctjja6.js returns HTTP 200 only because /_next/static/immutable/ chunks persist on the CDN across deploys. No live page references it (grep of live homepage and /sign-in HTML = 0 hits). It is an orphan from an older build. Stopping at the raiser's step 1 would have justified a DISCARD.

SUBSTANCE SURVIVES ON A REBUILT REPRO: live /sign-in loads 14 chunks; two of them (0t8x_qxjrozto.js, 1uz8qcjprw-ih.js) contain createBrowserClient("https://mmvbmrrwgludfmfalfcm.supabase.co","eyJ..."). Decoded the shipped anon JWT: ref claim = "mmvbmrrwgludfmfalfcm", iat 2026-06-19, exp 2036 -- URL and key name the SAME project, so this is a whole-project misconfiguration, not a mismatched URL/key pair.

DNS EFFECT VERIFIED, NOT ASSUMED: Status 3 (NXDOMAIN) from BOTH Google DoH and Cloudflare DoH; local resolver NXDOMAIN; curl exit code 6 (couldn't resolve host). Control jejispfvlkwastzvwtwu.supabase.co resolves (104.18.38.10 / 172.64.149.246) and returns live GoTrue JSON.

EFFECT VERIFIED IN A REAL BROWSER ON THE REAL ORIGIN (the decisive test): from a tab on www.verzatv.com/sign-in, fetch

---

### S6-002 — None of the auth server actions are rate limited: middleware only matches /api/:path*, while sign-in, sign-up and password-reset POST to the page routes, leaving unbounded credential attempts and unbounded outbound reset

*Raised by S6 — My List / Library / Profile / Accou*

**Reproduction.** curl -sD - https://www.verzatv.com/sign-in -o /dev/null | grep -i x-ratelimit -> no headers. curl -sD - https://www.verzatv.com/api/entitlements -o /dev/null | grep -i x-ratelimit -> x-ratelimit-limit: 30. signInAction / signUpAction / requestPasswordReset are React server actions posted to /sign-in, /sign-up, /forgot-password, so they never enter the middleware matcher.

**Evidence.** middleware.ts:176 `matcher: "/api/:path*"`; middleware.ts:36-37 comment claims '/^\/api\/auth\//, limit: 10' is 'Auth routes - brute-force protection', but the only route under /api/auth/ is the OAuth callback (app/api/auth/callback/route.ts) - the password sign-in path is app/actions/auth.ts:11-31 and is not covered. app/actions/auth.ts:105-131: requestPasswordReset schedules generateLink + sendPasswordResetEmail in after() for any submitted address with no throttle, no captcha and no per-address cooldown. Because signInWithPassword runs server-side, Supabase's own per-IP limits see the Vercel egress IP, not the attacker's.

**Independent verification.** CONFIRMED against live www.verzatv.com on 2026-08-29. Reproduced end-to-end, client and server, and went past the raiser's evidence because an immutable chunk fetched by name proves nothing about the current deploy.

1) The dead host is in the CURRENT deploy, not a stale chunk. I fetched the live /, /sign-in, /sign-up, /reset-password and /me HTML, extracted the 18 distinct /_next/static chunks they reference, downloaded all 18, and grepped. Three contain it: 0fkfn44ctjja6.js (referenced by /me), 1uz8qcjprw-ih.js (/sign-in and /sign-up), 2u2o4tt-_dnr2.js (/reset-password). Each holds the same module: createBrowserSupabase -> createBrowserClient("https://mmvbmrrwgludfmfalfcm.supabase.co", "eyJ..."). In 1uz8qcjprw-ih.js it sits inline with the "Continue with Google" / "Continue with Apple" handlers. The anon JWT decodes to ref "mmvbmrrwgludfmfalfcm", iat 2026-06-19, exp 2036 — so URL and key are a matched pair pointing at one project ref, not a mismatch.

2) That host does not exist, authoritatively. NXDOMAIN from 8.8.8.8, 1.1.1.1, 9.9.9.9, Google DoH and Cloudflare DoH (Status 3), and — decisively — from supabase.co's own authoritative nameserver christina.ns.cloudflare.com. Not a r

---

### S6-003 — Signing out never clears the device mirror, so the next person on a shared browser sees the previous account's My List and Continue Watching - and if any new activity changes the snapshot digest, that state is merged int

*Raised by S6 — My List / Library / Profile / Accou*

**Reproduction.** Exercised against the real modules with a fake Storage: setSavedSlug(slug,true); saveGuestProgress({...}); markGuestStateMigrated(); -> guestStateNeedsMigration() false. Sign out (SignOutButton's success path touches nothing). readSavedSlugs() still returns the slug and readGuestProgress() still returns the row. One further saveGuestProgress() (any browsing by the next person) -> guestStateNeedsMigration() true, and readGuestSnapshot() returns BOTH the first account's saved slug and its playhead, which components/GuestStateSync.tsx POSTs to /api/account/sync as soon as the next user signs in.

**Evidence.** components/ProfileDynamic.tsx:195-228 - SignOutButton only clears localStorage inside its catch block; the success path calls signOutAction() and nothing else. lib/guest-storage.ts:328 clearGuestState() has exactly one caller, components/ProfileDynamic.tsx:145 (account deletion). Harness output: SHARED DEVICE: {"afterA":false,"survives":{"saved":["the-mistress-trap"],"progress":1},"needsAfterNewActivity":true,"payloadWouldPostToB":{"progress":[2 rows],"saved":["the-mistress-trap"]}}. The server accepts it: app/api/account/sync/route.ts:219-248 unions saved slugs into whatever account is authenticated.

**Independent verification.** CONFIRMED — reproduced in code, in the live bundle, and against live endpoints.

WHAT I DID.
1. Source. components/ProfileDynamic.tsx:195-228 SignOutButton: `try { await signOutAction(); } catch { localStorage.removeItem("verza-saved"); localStorage.removeItem("verza-lang"); router.push("/"); }`. The success path does exactly one thing and clears nothing. lib/guest-storage.ts:328 clearGuestState() (removes PROGRESS_KEY/SAVED_KEY/MIGRATED_KEY) has one caller, ProfileDynamic.tsx:145, inside account DELETION. Both cited line numbers are accurate. Grepped every sign-out path repo-wide: signOutAction has exactly two callers (delete flow + this button); the only onAuthStateChange listener (lib/playback-client.ts:241-251) clears an in-memory playback-URL Map on SIGNED_OUT and never touches localStorage.

2. Deployed bundle, not the build. Pulled https://www.verzatv.com/, /library, /me, /me/list and every referenced chunk. chunks/0fkfn44ctjja6.js ships the SignOutButton verbatim as above (empty success path). chunks/0v3cies8wkcun.js ships "verza.guest.progress.v1" and "verza.guest.migrated.v1". chunks/3z23pxudvy0-6.js ships GuestStateSync, which POSTs readGuestSnapshot() to /api/account/sy

---

### S6-004 — /me tells a signed-out viewer 'No purchases' - the account page asserts a fact about purchases it cannot know, which is the exact defect the code comment above it claims to have fixed.

*Raised by S6 — My List / Library / Profile / Accou · **touches money or the shipped rail***

**Reproduction.** Load https://www.verzatv.com/me signed out. The Library section reads 'Purchase History - No purchases'. /api/entitlements returns 401 for that same viewer, and /me/purchases correctly says 'Sign in to see your purchases'.

**Evidence.** components/ProfileDynamic.tsx:64-81 - fetch('/api/entitlements').then(r => r.ok ? r.json() : null).then(d => setCount(d?.entitlements?.length ?? 0)); a 401 collapses to null, then to 0, then to the string 'No purchases'. There is no signed-out branch, although the sibling component has one (components/PurchaseHistoryList.tsx:67-70 -> {kind:'signed-out'}). Confirmed live: GET /api/entitlements -> HTTP 401 {"error":"Authentication required"}; the /me page text captured from the browser shows 'Purchase History / No purchases'. The comment at components/ProfileDynamic.tsx:59-63 states the bug being fixed was telling 'a customer who had bought eighty-six of them' that they had none.

**Independent verification.** CONFIRMED — reproduced in the deployed production bundle and against the real modules.

WHAT I DID

1. Deployed code, not the build. Pulled https://www.verzatv.com/me and its chunks. In /_next/static/immutable/chunks/0fkfn44ctjja6.js the shipped SignOutButton is verbatim:
  "SignOutButton",0,function(){...onClick:async()=>{i(!0);try{await o()}catch{localStorage.removeItem("verza-saved"),localStorage.removeItem("verza-lang"),a.push("/")}}...}
The success path calls signOutAction (o) and nothing else. Even the catch path removes only verza-saved and verza-lang — never verza.guest.progress.v1 and never verza.guest.migrated.v1. Source: /Users/jothamhall/E! CREATOR ECONOMY/verza-tv/components/ProfileDynamic.tsx:195-228.

2. The eraser exists and is not wired to sign-out. Deployed chunk 0v3cies8wkcun.js carries clearGuestState removing all three keys [r,t,n] = progress/saved/migrated. Its only caller repo-wide is components/ProfileDynamic.tsx:145 — account DELETION. lib/guest-storage.ts:328.

3. The mirror holds a signed-in user's data, not just a guest's. lib/watch-progress-client.ts:39 writes saveGuestProgress unconditionally ("Always, session or no session"), and components/AccountLis

---

### S6-012 — /reset-password lets an ambient session set a new password with no current-password check and no re-authentication, so a stolen session converts into permanent account takeover.

*Raised by S6 — My List / Library / Profile / Accou*

**Reproduction.** While signed in, open /reset-password with no token. The effect finds a session via getSession(), sets status 'ready', and the form posts updatePassword, which calls supabase.auth.updateUser({password}) on the cookie-bound user.

**Evidence.** app/reset-password/ResetPasswordClient.tsx:114-119 (no token -> any session is accepted as a recovery session) and app/actions/auth.ts:136-162 (updatePassword requires only the cookie session; minimum length 6, no current-password field, no reauthentication nonce). Supabase's secure-password-change option is not in use.

**Independent verification.** CONFIRMED in the deployed bundle, not just the repo.

Mechanism, end to end:
1. app/reset-password/ResetPasswordClient.tsx:105-119 — with no token_hash in the URL, the effect calls supabase.auth.getSession() and does `if (session) setStatus("ready")`. It accepts ANY ambient session, not a recovery session.
2. app/actions/auth.ts:136-162 — updatePassword reads only password/confirm/next, enforces length >= 6, then calls supabase.auth.updateUser({password}) on the cookie-bound user. `grep -rn "reauthenticate|nonce" app lib components` has no auth hits (only an unrelated comment at components/EpisodeFeed.tsx:630): the app implements no reauthentication anywhere.

Verified in production, not the build: GET https://www.verzatv.com/reset-password -> 200; downloaded its chunks; the minified client lives in /_next/static/immutable/chunks/2u2o4tt-_dnr2.js and ships the branch verbatim — `let{data:{session:a}}=await r.auth.getSession();if(t){if(a)return p("ready");...}` — with the form posting server reference "updatePassword" carrying only next, password, confirm. No current-password input exists in the shipped markup.

Cookie handoff is real: lib/supabase/client.ts uses createBrowserClient

---

## S2 — a viewer cannot complete an intended task, or is actively misled

### D1-005 — /studio and /creator show the SIGNED-OUT screen when /api/creator/me fails. An approved, signed-in creator hitting a 500 or a network drop is told "Sign in to apply, upload, and manage your channel." There is no error st

*Raised by D1 — STATES: loading, empty, error, skel*

**Reproduction.** 1. Open https://www.verzatv.com/me. 2. Install a fetch interceptor returning 500 for /api/. 3. Click the in-page /studio link (client-side nav). The dashboard renders the unauthenticated screen. Also reproduces on a thrown network error via the explicit `catch` branch, and on /creator, which renders the same component.

**Evidence.** Forced on production: {"mode":"500","url":"/studio","log":["500 /api/creator/me"],"skel":0,"text":"Creator Studio Sign in to apply, upload, and manage your channel. Sign in"}. Source: components/CreatorDashboard.tsx:49-62 — a non-401 response is passed straight to `setMe(await res.json())`, so `{error:'forced'}` yields `me.authenticated === undefined` (falsy) and falls into the unauthenticated branch at :78; the `catch` at :57 explicitly sets `{authenticated:false}` for network failures. No error branch exists between loading and unauthenticated.

**Independent verification.** CONFIRMED against the live deployed bundle, not the build.

What I did:
1. Fetched https://www.verzatv.com/studio (200). Its SSR HTML contains no "Sign in to apply" — the server renders WizardSkeleton, so the branch is decided client-side, as claimed. Pulled every chunk it references and found the component in /_next/static/immutable/chunks/08mffsgdxya6b.js. Deployed code, verbatim:
   try{let e=await fetch("/api/creator/me",{cache:"no-store"});401===e.status?n({authenticated:!1,creator:null}):n(await e.json())}catch{n({authenticated:!1,creator:null})}finally{r(!1)}
   ...if(!e?.authenticated)return ... "Sign in to apply, upload, and manage your channel." ... href:"/sign-in?next=/studio"
   401 is the ONLY status special-cased, and the catch branch hardcodes authenticated:false. Deployed bundle matches components/CreatorDashboard.tsx:49-62 and the unauthenticated branch at :79 (raiser said :78, off by one).
2. Transcribed that shipped control flow byte-for-byte into a Node harness (JSX swapped for branch labels only) and ran it against real response shapes. Result: 200+approved -> ApprovedDashboard (control passes, so the harness is not stuck); 401 -> signed-out screen (correct); a

---

### D1-007 — Offline state: the service worker answers EVERY failed navigation with the cached homepage. The cache holds exactly one entry ("/"), no offline page exists in the 65 routes, and the cache name is never bumped so the offl

*Raised by D1 — STATES: loading, empty, error, skel*

**Reproduction.** 1. Open any page on https://www.verzatv.com (the SW self-registers). 2. In the console: `await caches.keys()` and enumerate the entries of verza-tv-v1. 3. Go offline and navigate to any deep link — the fetch handler returns caches.match("/").

**Evidence.** Verified on production, cache contents rather than code: {"swRegistered":1,"scopes":["https://www.verzatv.com/"],"cacheKeys":["verza-tv-v1"],"entries":[{"cache":"verza-tv-v1","urls":["/"]}],"homeCached":true,"deepLinkCached":false}. Deployed public/sw.js (byte-identical to the working tree): `const OFFLINE_URL = "/";` and `if (event.request.mode === "navigate") { event.respondWith(fetch(event.request).catch(() => caches.match(OFFLINE_URL))); }`. `caches.match` resolves to undefined on a cache miss, and `respondWith(undefined)` yields the browser's own network-error page — so the fallback for a failed fallback is a Chrome error screen. CACHE_NAME has stayed "verza-tv-v1", so the cached shell 

**Independent verification.** CONFIRMED at S2 (severity held, not corrected). Every sub-claim reproduced independently on production; found one aggravating fact the raiser missed.

DEPLOYED SOURCE — fetched https://www.verzatv.com/sw.js (HTTP 200, 1796 bytes), byte-identical to working tree /Users/jothamhall/E! CREATOR ECONOMY/verza-tv/public/sw.js (diff clean):
  const CACHE_NAME = "verza-tv-v1";
  const OFFLINE_URL = "/";
  install: caches.open(CACHE_NAME).then(c => c.addAll([OFFLINE_URL]))
  fetch:   if (event.request.mode === "navigate") event.respondWith(fetch(event.request).catch(() => caches.match(OFFLINE_URL)));
Scope is "/" (registered site-wide from app/layout.tsx:131 via components/ServiceWorker.tsx), so this is every same-origin navigation, exactly as the summary says.

LIVE BROWSER REPRODUCTION on https://www.verzatv.com/series/the-mistress-trap/1: 1 registration, scope https://www.verzatv.com/, controllerHere=true (SW controls deep links). caches.keys() -> ["verza-tv-v1"]; that cache holds count=1, url https://www.verzatv.com/. homeCached=true, deepLinkCached=false. Independently matches the raiser's evidence rather than inheriting it.

FACT THE RAISER MISSED (makes it worse): the cached fallback 

---

### D2-002 — The show page — the destination Phase 1 routed every poster tap to — renders its sales copy as hard-coded English in all 20 locales.

*Raised by D2 — Localization. All 20 locales x all  · **touches money or the shipped rail***

**Reproduction.** curl https://www.verzatv.com/series/the-mistress-trap and read the visible text: "Cast", "All Episodes", "Watch Episode 1 Free", "Series Unlock", "First 5 Episodes FREE". app/series/[slug]/page.tsx has no "use client" and calls getSeriesWithDetail on the server, so it cannot call t() at all (AGENTS.md rule 13). Selecting Japanese changes none of it. Translations for content.cast / content.allEpisodes / content.watchFree exist and ship in the bundle for all 20 locales.

**Evidence.** app/series/[slug]/page.tsx:236 `Cast`; :284 `"All Episodes FREE"`; :285 `` `First ${series.freeEpisodes} Episodes FREE` ``; :307 `Watch Episode 1 Free`; :346 `Series Unlock`. Server component (file head is `import Image from "next/image"`, no "use client"). 96 show pages affected. Only localized element on the page is the leaf client component AudioLanguageBadge (app/series/[slug]/page.tsx:195).

**Independent verification.** CONFIRMED — reproduced in source, in the deployed bundle, and in a live browser on www.verzatv.com.

STRUCTURAL CLAIM (exact): /Users/jothamhall/E! CREATOR ECONOMY/verza-tv/lib/i18n.ts — `interface Translations` has exactly 115 keys; 20 locale dicts x 115 = 2,300 cells. Grepping every .ts/.tsx/.mjs/.js outside lib/i18n.ts for each key literal returns exactly 55 with zero hits. 8 more hit only components/CoinPaywall.tsx, components/SeriesInfoButton.tsx, components/SeriesInfoDrawer.tsx (content.synopsis/episodes/moreLikeThis/info/oneTimePayment/allEpisodesIncluded/episodeLocked/unlockPrompt); a repo-wide grep shows those three files are imported by zero files — only self-references and docs/audit/00-manifest.json rows. 55+8 = 63 keys = 1,260 dead cells. No `t(`...`)` template or dynamic key construction exists anywhere that could rescue one.

SHIPPED, NOT JUST WRITTEN: https://www.verzatv.com/_next/static/immutable/chunks/428d7hhx0m19l.js contains the unused Spanish values "Cerrar Sesion", "Seguir Viendo", "Historial de Compras"; that chunk is referenced by /, /me and /sign-up, so all 1,260 dead cells download on every page load.

LIVE EFFECT (localStorage verza-lang=es, document.doc

---

### D3-002 — The footer YouTube link 404s. It renders on every page of the site and on the /sitemap page twice.

*Raised by D3 — Dead Ends. All 535 interactive elem*

**Reproduction.** Tap the YouTube glyph in the footer of any page (or the "YouTube" row in the Sitemap dropdown / Shorts & Social section). It opens https://www.youtube.com/@VerzaTV, which returns YouTube's 404 page.

**Evidence.** curl -A <Chrome UA> https://www.youtube.com/@VerzaTV -> HTTP 404, <title>404 Not Found</title>. Negative controls: https://www.youtube.com/@YouTube -> 200 "YouTube - YouTube"; https://www.youtube.com/@zzqxnotarealhandle99812 -> 404. Rendered on production: grep 'href="https://www.youtube.com/@VerzaTV"' returns a hit on /, /about, /help, /support, /shop and twice on /sitemap. Sources: components/Footer.tsx:38 (site-wide footer social row) and lib/data/sitemap.ts:224 ("Shorts & Social" section, which feeds both the footer Sitemap dropdown and the /sitemap page). Contrast: the other four socials were negative-controlled and are live — TikTok @verzatv returns "uniqueId":"verzatv","nickname":"Ver

**Independent verification.** Reproduced exactly as written, on the deployed production site.

WHAT I DID / SAW
1. Source: components/Footer.tsx socialLinks contains { name: "YouTube", href: "https://www.youtube.com/@VerzaTV" }. Footer is mounted in app/layout.tsx, so it is genuinely site-wide, not per-page.
2. Deployed bundle (curl, Chrome UA, www.verzatv.com — not a local build). Counting the literal href="https://www.youtube.com/@VerzaTV":
   / =1, /about =1, /help =1, /support =1, /shop =1, /sitemap =2, /terms, /privacy, /refund-policy, /press, /studio all carry it.
   Real catalog rows resolved to real URLs (lib/catalog.ts parses to 96 slugs, matching the documented 96): /series/the-mistress-trap =1, /series/collateral-hearts =1, and the episode/player pages /series/the-mistress-trap/1 and /series/collateral-hearts/1 =1 each (all HTTP 200).
   The two hits on /sitemap are the footer glyph row plus the Sitemap page's own list — the RSC payload carries the literal key "Shorts & Social-https://www.youtube.com/@VerzaTV-YouTube". The repro's "twice on /sitemap, in the Shorts & Social section" is precisely right.
3. Target URL: https://www.youtube.com/@VerzaTV -> HTTP 404, <title>404 Not Found</title>, no redire

---

### D3-003 — /discover's category tiles are dead ends: four of the seven categories it links to answer "No X series yet" while those same categories show live, playable titles on the home tabs. /discover/[genre] free-text-matches the

*Raised by D3 — Dead Ends. All 535 interactive elem*

**Reproduction.** 1. Open https://www.verzatv.com/discover. The "Browse by Category" row shows Drama, Hot, Español, Bollywood, Reality, Red Carpet, Music — /discover only renders a tile when getSeriesByCategory(tab).length > 0, so every one of those categories has titles. 2. Tap "Red Carpet" -> /discover/red-carpet -> "0 live series / No red carpet series yet. Catalog availability changes over time. Check back soon." 3. Meanwhile the Red Carpet home tab shows Exes Premiere (12 eps) and Love Awards (13 eps), both of which play. Same for Hot, Español and Bollywood.

**Evidence.** Measured on production. /discover/red-carpet: "0 live series", 0 series links. /discover/popular: "0 live series". /discover/espanol: "0 live series". /discover/bollywood: "0 live series". /discover/drama: "32 live series". Catalog truth, counted from lib/catalog.ts categories on live rows: drama 71, popular 10, espanol 5, bollywood 6, red-carpet 2, reality 1, music 1. Root cause at app/discover/[genre]/page.tsx:136-139 — `catalog.filter(s => s.genre.toLowerCase().includes(genre.toLowerCase()))`, matching the human-readable genre string, not s.categories. "red-carpet" (hyphen) can never appear inside "Red Carpet · Reality" (space), so the match is structurally impossible; "popular", "espanol

**Independent verification.** Reproduced end-to-end against the deployed site and the live third-party target.

TARGET IS DEAD: curl -A "<Chrome 126 UA>" https://www.youtube.com/@VerzaTV -> HTTP 404, body <title>404 Not Found</title>. Controls prove the method discriminates: @YouTube -> 200; @zzqxfakebrandzzz99Official and @notarealbrandxyz123Official -> 404. Case/legacy variants also dead: @verzatv 404, @Verzatv 404, @verza_tv 404, /c/VerzaTV 404, /user/VerzaTV 404.

RENDERED IN THE DEPLOYED BUNDLE (fetched from www.verzatv.com, not a local build): counting literal href="https://www.youtube.com/@VerzaTV" in the served HTML — / = 1, /about = 1, /help = 1, /support = 1, /shop = 1, /press = 1, /terms = 1, /sitemap = 2. The /sitemap pair is the "Shorts & Social -> YouTube" row plus the footer glyph, both with target="_blank" rel="noopener noreferrer". Every page additionally carries the same href in the RSC flight payload for the client-gated sitemap dropdown (components/FooterSitemap.tsx:49 renders it behind `open && ...`), so an expanded dropdown adds one more live instance on any page. The footer is site-wide, so the count is every page of the site, not just the eight probed.

SOURCES CONFIRMED: /Users/jothamha

---

### D3-009 — 11 of the 86 paid titles ship a show page with no Cast at all, and 7 of those also have no synopsis paragraph and no tags — only a one-line logline — while the other 76 paid pages carry all three.

*Raised by S3 — SHOW PAGES: all 96 catalog rows (91*

**Reproduction.** Compare https://www.verzatv.com/series/salt-and-pepper (logline only: no description paragraph, no Cast block, no tags) against https://www.verzatv.com/series/the-mistress-trap (logline + 60-word description + Cast + 3 tags). Both are $1.99 purchases.

**Evidence.** Parsed from production HTML of all 96. No description paragraph and no tags (7 paid): im-having-my-professors-baby-es, falling-for-flatmate, dil-dosa-dosti, salt-and-pepper, love-for-sale, the-breakup-podcast, reset. No Cast block (11 paid): those 7 plus sentence-of-passion-es, i-cheated-on-my-wedding-night-es, i-fell-in-love-with-my-presidential-brother-in-law-es, the-goat-mistress-es. (4 further rows without cast — storage-pirates, too-much-junk, exes-premiere, love-awards — are free reality/red-carpet titles where a drama cast list is not expected.) Cause: lib/series-detail.ts has no SERIES_DETAIL entry for these slugs, and app/series/[slug]/page.tsx:223/233/243 guard each block on presen

**Independent verification.** CONFIRMED — reproduced live on www.verzatv.com with the app in Spanish, both halves, plus the false-promise half proven empirically.

WHAT I DID (production, not the build):
1. Code read. Every cited line is exact. app/series/[slug]/[episode]/error.tsx:55/57/66/73 are bare JSX literals with no t() and no useTranslation import. components/EpisodeFeed.tsx:302, :647, :691 write English into sourceError.message, rendered raw at :1132 as {sourceError.message}; :1139, :1148, :1155 are literals. The boundary IS nested inside LangProvider (app/layout.tsx:139 wraps :147 <main>{children}</main>), so useTranslation() is available and simply unused.
2. Deployed bundle (standing rule 4). Pulled the episode page and its 16 chunks from www.verzatv.com. Chunk /_next/static/immutable/chunks/118nmsh16h8tr.js ships "This episode didn't load", "Something went wrong on our side", "Your place in the series is saved", "Try again", "Back to browse". Chunk 13rz7ciqnwv2l.js ships "We could not load this episode", "This episode will not play", "Your purchase is safe", "Try again", "Back to browsing". "content.tryAgain" appears 0 times in the feed chunk and 20 times (once per locale) in the i18n chunk — it is

---

### D3-012 — The 5 coming-soon pages emit numberOfEpisodes: 0 in their TVSeries JSON-LD, doing in structured data exactly what the UI deliberately refuses to do on screen.

*Raised by S3 — SHOW PAGES: all 96 catalog rows (91*

**Reproduction.** curl https://www.verzatv.com/series/the-chairmans-revenge and read the application/ld+json block: "numberOfEpisodes":0 alongside a full plot description and og:type video.tv_show — while the visible page reads "Episodes announced soon".

**Evidence.** Parsed JSON-LD for all 5 coming-soon slugs (the-chairmans-revenge, protected-by-the-devil, the-last-will, the-billionaires-apron, i-cant-resist-my-mansion-gardener): numberOfEpisodes 0 in each. app/series/[slug]/page.tsx:181 carries the comment "A coming-soon title has no episode count worth printing; '0 episodes' reads as a broken page rather than an unreleased one" — the on-page rule the schema builder does not follow. Impact is bounded: these pages are robots noindex, follow (verified in production), so the payload is mostly read by share-card scrapers.

**Independent verification.** CONFIRMED, and the measured behaviour is worse than the summary claims. Severity raised S3 -> S2.

WHAT I DID

1. Source, exact. /Users/jothamhall/E! CREATOR ECONOMY/verza-tv/components/ShortsFeed.tsx:353-358 and components/HorizontalFeed.tsx:97-102 are byte-identical unbounded handlers: `else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) hls.recoverMediaError();` with no counter, no codec swap, no reattach ceiling. Cited line numbers 356 and 100 are exact. EpisodeFeed.tsx bounds it in BOTH of its attach paths - line 817 (`mediaRecoveriesRef.current < 2` -> swapAudioCodec once -> fullReattach) and line 487 on the adopted instant-player path - and `fullReattach` is itself bounded at EpisodeFeed.tsx:616 (`reattachCountRef.current >= 2`). Minor citation drift only: the bound is at 815-832, not 849-861.

2. No failure UI, proven statically. `grep -in error` over ShortsFeed.tsx and HorizontalFeed.tsx returns ONLY those two handler lines. There is no error state, no role="alert", no retry, no way out. EpisodeFeed has all of it at 1120-1157 (message, "Try again", "Back to browsing"). ShortsFeed.tsx:430 labels its own poster "Poster-as-loading-state", so the raiser's "the poster thumbnail 

---

### D3-016 — 94 of 96 rows print "VERZA Originals" as the channel, including the 11 live Hindi and Spanish titles that AGENTS.md describes as supplied third-party footage.

*Raised by S3 — SHOW PAGES: all 96 catalog rows (91*

**Reproduction.** Open https://www.verzatv.com/series/salt-and-pepper — metadata line reads "VERZA Originals" on a Hindi title with burned-in English subtitles supplied externally.

**Evidence.** lib/catalog.ts: 94 rows carry channel: "VERZA Originals", 2 carry "The Carpet". AGENTS.md rule 2 records "six further titles have key art but no video from the supplier" and lib/audio-language.ts records the Hindi cuts as supplier material with burned-in subtitles. Flagged as a claim needing an owner's call rather than a proven falsehood — "VERZA Originals" may be an intended imprint label rather than a production credit.

**Independent verification.** CONFIRMED — reproduced against code and against production, with a negative control. Severity S2 stands (raiser was right); counts were UNDERSTATED and are corrected below.

WHAT I DID / WHAT I SAW

1) Code. /Users/jothamhall/E! CREATOR ECONOMY/verza-tv/app/series/[slug]/page.tsx:232-240 renders the literal heading "Cast" (line 236, hardcoded English, not the existing i18n key content.cast) over series.cast.join(" · ") (line 239). Cast data comes only from /Users/jothamhall/E! CREATOR ECONOMY/verza-tv/lib/series-detail.ts; lib/catalog.ts declares cast?: string[] but zero rows populate it (grep -c "cast:" lib/catalog.ts = 0). Parsed series-detail.ts: 80 slug keys, all 80 in the 96-row catalog; 76 carry exactly 3 names, 4 (the *-es Spanish rows) carry []. 16 catalog rows have no detail entry. So 76/96 exactly, as claimed.

2) Production sweep, negative-controlled (standing rule 3 and 4). Fetched all 96 /series/<slug> pages from https://www.verzatv.com and asserted the rendered block against the code-declared string: 76/76 render the exact 3-name Cast block, 0 mismatches, 0 expected-but-absent, and — the negative control — 0 of the 20 rows with no cast data render a Cast block. All 96

---

### D4-002 — A single scroll gesture that travels more than one slide strands the episode feed on a permanently blank screen: the IntersectionObserver adjacency guard rejects the non-adjacent index, activeIndex never updates, the vir

*Raised by D4 — Performance and memory. Rendition c*

**Reproduction.** Desktop Chrome, https://www.verzatv.com/series/the-dumb-billionaire-heiress-in-love/1 (50-episode wholly-free rail). Scroll down with 5-tick wheel gestures to episode 6 (works correctly). Then issue three 10-tick wheel gestures over the feed. The scroll position moves to 9.73 viewports while the mounted window stays [3,4,5,6,7]; the screen shows only the VERZA watermark on black, the URL stays at /6, and it does not recover after 2.5s, after further down-scrolls, or after a 3-tick up-scroll.

**Evidence.** Measured in production: `{"sl":9.73,"mounted":["3@-4256","4@-3620","5@-2984","6@-2348","7@-1712"],"url":"/series/the-dumb-billionaire-heiress-in-love/6","vid":5}` — all five mounted slides 2.7 to 6.7 viewports above the fold. Mechanism: components/EpisodeFeed.tsx:1780 `if (!firstSettle && prev !== idx && Math.abs(idx - prev) > 1) continue;` rejects the jump, so activeIndexRef stays stale; components/EpisodeFeed.tsx:1644 `const recenter = () => setWindowCenter(activeIndexRef.current);` then re-centres on the stale index, and EpisodeFeed.tsx:1658-1686 computes windowStart/windowEnd from windowCenter and activeIndex only. Nothing reads scrollTop, so there is no path back. Screenshots captured a

**Independent verification.** CONFIRMED on production, with two corrections to the write-up: the stated trigger is wrong, and "permanently" is not supported.

DEPLOYED-BUNDLE CHECK (not the build). Fetched https://www.verzatv.com/series/the-dumb-billionaire-heiress-in-love/1 and pulled every chunk it links. The feed ships in /_next/static/immutable/chunks/27_6kgf3tx4s2.js and matches source verbatim:
 - adjacency guard: `if(ek.current&&t!==r&&Math.abs(r-t)>1)continue;`  (= EpisodeFeed.tsx:1780)
 - observer sees only mounted slides: `e.querySelectorAll("[data-index]").forEach(e=>t.observe(e))`
 - recenter reads only the possibly-stale ref: `r=()=>eT(ey.current)` on 160ms scroll-idle and `scrollend`
 - grep of that chunk: `scrollTop` 0 occurrences, `clientHeight` 0 occurrences. The finding's load-bearing claim — nothing in the component reads scroll position, so there is no path back — is true of the shipped bundle, not just the repo.

REPRO AS WRITTEN: DOES NOT REPRODUCE. Desktop Chrome, real wheel events, 606x617 window, feed 574px, rail confirmed 50 episodes wholly free. Six 5-tick gestures took ep1->ep6 one slide each; then three 10-tick gestures gave ep7, ep8, ep9 — one slide each, URL/window/overlay all tra

---

### D7-001 — The bottom navigation renders completely empty — no icons, no labels, zero-height links — on every phone in landscape, because a rule intended to hide only the labels also hides the span that wraps each icon.

*Raised by D7 — Viewport and device. Every page-rou · **touches money or the shipped rail***

**Reproduction.** Open https://www.verzatv.com/ on any iPhone and rotate to landscape (viewport 852x393, 932x430 or 667x375 — any landscape viewport ≤500px tall). The bottom bar becomes a 40px empty strip: Discover, Shorts, Shop, Library and Profile are invisible and cannot be tapped. Reproduce deterministically by rendering the live homepage in a 852x393 iframe and reading the nav link's bounding rect.

**Evidence.** app/globals.css:624 opens `@media (orientation: landscape) and (max-height: 500px)`; :647-651 sets `.bottom-nav { height: 2.5rem }`; :653-655 sets `.bottom-nav span { display: none; /* Hide labels, show icons only */ }`. components/BottomNav.tsx:119-123 wraps the SVG icon in a bare `<span>`, so that selector hits the icon too. Measured at 852x393 against the deployed CSS: mq_short=true, navComputedHeight="40px", inner row inline height 72px, link rect {width: 83.2, height: 0}, svg rect 0x0, both child spans getComputedStyle(display)="none". Same at 932x430 and 667x375 (extraresult nav@L852 / nav@L932 / nav@L667: every linkRect h=0). The inner 72px row also spills 35px below the viewport (nav

**Independent verification.** CONFIRMED against the deployed bundle. Severity corrected S1 -> S2.

WHAT I DID
1. Deployed CSS. Fetched https://www.verzatv.com/ (200, iPhone UA) -> single stylesheet /_next/static/immutable/chunks/1b0rux1xv-mpp.css. It contains, verbatim:
   @media (orientation:landscape) and (max-height:500px){ ... .bottom-nav{height:2.5rem;padding-top:.125rem;padding-bottom:.125rem} .bottom-nav span{display:none} }
   Only two `.bottom-nav span` rules exist in the whole deployed sheet; the other (plain `@media (orientation:landscape)`, font-size only) comes earlier, so nothing re-shows the span. The desktop-frame MQ `(min-width:520px) and (orientation:portrait),(min-width:520px) and (min-height:600px)` does not match a short landscape viewport, so `.device-screen .bottom-nav{display:none!important}` is not in play.
2. Deployed markup. The live SSR HTML wraps each icon in a bare, class-less span: `<span><svg width="26" ...></svg></span>`, then a second span for the label. Same in components/BottomNav.tsx:119-123.
3. Live-origin CSSOM proof (no simulation). On https://www.verzatv.com/ I walked document.styleSheets, found the max-height:500px media rule, and tested the real DOM node: iconSpanMatch

---

### D7-002 — On every iPhone in landscape the paywall is clipped top and bottom inside an overflow:hidden container with no scroll, leaving the Go Back button mostly or entirely off-screen.

*Raised by D7 — Viewport and device. Every page-rou · **touches money or the shipped rail***

**Reproduction.** Watch past the free preview of any paid title (e.g. /series/the-mistress-trap/6) and rotate to landscape. The paywall column is taller than the viewport; it is vertically centred inside a fixed inset:0 container with overflow:hidden and no scroll region, so the play glyph is cut off the top and Go Back is cut off the bottom. There is no gesture that brings it back.

**Evidence.** Measured live on https://www.verzatv.com/series/the-mistress-trap/6: paywall column height 448px, `.episode-immersive` computed overflow "hidden", the paywall column's own computed overflow-y "visible". components/EpisodeFeed.tsx:2061 (`.episode-immersive`), :2502 (overlay is `absolute inset-0 flex items-center justify-center`), :2670-2679 (Go Back is the last child of the column). app/globals.css:706-712 gives `.episode-immersive` `position:fixed; inset:0; overflow:hidden`. Every iPhone landscape height is below 448: 375 (SE), 393 (12/13/14/15), 414, 430 (Pro Max). Harness run at 477px column height: goBackBelowViewportBy 42px at 393 and 51px at 375, and document.elementFromPoint at Go Back

**Independent verification.** Reproduced on production, not on the build.

DEPLOYED CSS (https://www.verzatv.com/_next/static/immutable/chunks/1b0rux1xv-mpp.css):
`.episode-immersive{z-index:50;background:#000;position:fixed;inset:0;overflow:hidden}`. The only override is `@media (min-width:520px) and (orientation:portrait),(min-width:520px) and (min-height:600px)` — an iPhone in landscape is neither portrait nor >=600px tall, so the container stays fixed inset:0 at viewport height and clips. Nothing in globals.css's two landscape blocks (541-660) touches the paywall.

DEPLOYED JS (chunk 27_6kgf3tx4s2.js) carries the same markup as source: overlay `absolute inset-0 z-[60] flex items-center justify-center`, inner column `text-center px-8 max-w-xs`, no scroll region.

LIVE MEASUREMENT — loaded https://www.verzatv.com/series/the-mistress-trap/6 anonymously (freeEpisodes 5, so ep 6 is the first locked slide; paywall auto-appears 250ms after /api/access resolves). Computed styles on the real page: `.episode-immersive` overflow "hidden", column overflow-y "visible", no scrollable ancestor inside the clipped box (the nearest `overflow:auto`, `.device-screen`, is OUTSIDE `.episode-immersive`). Settled column height = 4

---

### S2-001 — A deep link to any paid episode opens a paywall that tells the viewer they "just watched the free preview" when they have watched nothing, on a rail whose five free episodes are unreachable because the overlay swallows e

*Raised by S2 — PLAYER / SHORTS: the vertical rail  · **touches money or the shipped rail***

**Reproduction.** Open https://www.verzatv.com/series/the-mistress-trap/40 signed out (this exact URL is published in the production sitemap, and the show page's own episode picker links to it). The paywall mounts after 250ms reading "You just watched the free preview of The Escort They Framed. Don't stop now." Try to swipe or scroll up toward episodes 1-5: nothing moves. The only two exits are Unlock ($1.99) and Go Back, which leaves the player for the browse tab. NOTE: adjacent to a DO-NOT-REGRESS asset. The paywall's honesty is intact and verified; the fix is the copy plus a route back to episode 1, not a weaker paywall.

**Evidence.** Measured on production, viewport 394x580: the feed scroller reports scrollHeight/clientHeight = 40 slides for /series/the-mistress-trap/40 (rail bound = Math.max(freeEpisodes+1, startIdx+1) at components/EpisodeFeed.tsx:1422), 34 of them locked. The paywall overlay (components/EpisodeFeed.tsx:2503, `absolute inset-0 z-[60]`) computes pointer-events:auto, touch-action:auto, rect 394x580, and document.elementFromPoint(centre) returns an element inside it. A real wheel-up of 10 ticks over the overlay left scrollTop at 22605, unchanged; the scroll container is a sibling, not an ancestor, so there is no scroll chaining. Copy is components/EpisodeFeed.tsx:2532 -> `paywall.previewOver` = "You just 

**Independent verification.** Reproduced exactly as written, against www.verzatv.com (not a local build).

1. Source: components/BrowsePage.tsx:1086 is `{(activeTab === "drama" || activeTab === "new" || activeTab === "popular") && (` — the guard on the StorageBlue ad ribbon #1 (comment above it reads "only on Drama, New, Hot").

2. Deployed bundle: the live homepage still references /_next/static/immutable/chunks/1aseb4gggkekc.js. Fetched it (HTTP 200, 44,827 bytes); it contains, verbatim and exactly once, `("drama"===v||"new"===v||"popular"===v)&&(0,t.jsx)("a",{href:"https://www.storageb…`. Zero other `"new"===` occurrences in that chunk.

3. Unreachability proven in the DEPLOYED code, not just source. Deployed BROWSE_TABS lives in chunk 12o29nrz06ckg.js and is exactly 10 entries — drama, popular, tubi, anime, espanol, bollywood, reality, creators, red-carpet, music. No "new" key. The deployed URL guard is `let t=new URLSearchParams(e).get("tab");t&&a.BROWSE_TABS.some(e=>e.key===t)&&queueMicrotask(()=>j(t))`, so ?tab=new never reaches setActiveTab. I enumerated every `j(` (minified setActiveTab) call site in the chunk: only two exist — that URL guard, and selectTab `…,j(e)},[v,b])`, whose argument comes from C

---

### S4-002 — A typographic apostrophe (U+2019) in a query returns zero results for all 13 catalogue titles that contain an apostrophe. Every title in lib/catalog.ts uses ASCII U+0027; foldText() normalises accents but not punctuation

*Raised by S4 — SEARCH. The four catalogue-search s*

**Reproduction.** Production: /search?q=The%20Billionaire%27s%20Vow → 1 result (/series/the-billionaires-vow/1). /search?q=The%20Billionaire%E2%80%99s%20Vow → 0 results and the "No results" panel. Same for Love’s Perfect Crime, I’m Obsessed with My Boss, Hollywood Star’s Fake Girlfriend, Mafia Lord’s…, In Love with My Godfather’s Daughter, Billionaire Daughter’s Love Triangle, Married to My Brother’s Ex. All 13 apostrophe titles measured: 13/13 return 0.

**Evidence.** lib/text-fold.ts:51-57 foldText() = toLowerCase → NFD → strip [̀-ͯ] → NFC. No punctuation normalisation. lib/search-index.ts:136-143 splits on whitespace and requires every token to be a substring, so one bad token kills the whole query. Catalogue apostrophes measured: 13 rows, single distinct codepoint U+0027. Affects all four surfaces because they share seriesMatchesQuery. Deployed client chunk 21y4skb0tansy.js carries the identical folder, so the header popover fails the same way.

**Independent verification.** REPRODUCED, then found the raiser understated it. Severity corrected S4 -> S2.

WHAT I DID, AND WHAT I SAW

1. Code. `/Users/jothamhall/E! CREATOR ECONOMY/verza-tv/app/discover/page.tsx:17` is verbatim the cited line: `const activeTabs = BROWSE_TABS.filter(tab => getSeriesByCategory(tab.key).length > 0);`. `lib/catalog.ts:20-41` defines 10 BROWSE_TABS. Grepping the 97 `categories:` arrays in lib/catalog.ts, the strings "tubi", "anime" and "creators" appear ONLY in the BrowseCategory union (lines 11/12/15) and in BROWSE_TABS itself — no catalog row carries them. So getSeriesByCategory returns [] for exactly those three and the filter drops exactly three tiles. Effect verified, not just the assignment.

2. Production /discover (curl, iPhone UA, 502,352 bytes). Parsed `.genre-grid`: 7 tiles, exactly as claimed — /discover/drama "Drama", /discover/popular "Hot", /discover/espanol "Español", /discover/bollywood "Bollywood", /discover/reality "Reality", /discover/red-carpet "Red Carpet", /discover/music "Music". The strings "Tubi", "Anime" and "Creators" occur ZERO times anywhere in the /discover HTML. Live homepage carries all 10 (Tubi 3, Anime 3, Creators 3 occurrences). The two strips

---

### S4-007 — 15 of 91 live rows carry no curated SEARCH_TAGS — including all 5 Español and all 6 Bollywood titles, both Red Carpet titles, Storage Pirates and I'm Obsessed with My Boss Part II. Their entire index is title + slug + ge

*Raised by S4 — SEARCH. The four catalogue-search s*

**Reproduction.** Spanish queries against the live pool: "venganza" → 0, "millonario" → 0, "jefe" → 0, "celos" → 0, "novela" → 0, "telenovela" → 0, "latino" → 0, "doblada" → 0, "español latino" → 0. ("billionaire" returns 22 rows; "millonario" returns none.) Hindi/Indian-intent: "hindi" → 0, "india" → 0, "indian" → 0, "shaadi" → 0, "ishq" → 0, "pyaar" → 0, "hindi drama" → 0, "indian drama" → 0. "desi" → 4 results, all English dramas matched on the substring inside "Desire"/"desire", and none of the six Bollywood titles.

**Evidence.** lib/search-index.ts:14-95 SEARCH_TAGS has 76 keys, all resolving to real rows (0 orphans); the 15 live slugs with no entry are im-obsessed-with-my-boss-2, storage-pirates, exes-premiere, love-awards, sentence-of-passion-es, i-cheated-on-my-wedding-night-es, i-fell-in-love-with-my-presidential-brother-in-law-es, the-goat-mistress-es, im-having-my-professors-baby-es, falling-for-flatmate, dil-dosa-dosti, salt-and-pepper, love-for-sale, the-breakup-podcast, reset. No catalogue row populates its own `tags` array (0 of 96), so `s.tags` contributes nothing anywhere.

**Independent verification.** CONFIRMED — reproduced in the deployed bundle, in live DOM, and by real taps on production. Severity S2 stands.

WHAT I DID

1. Deployed bundle, not the build (Rule 4). Fetched https://www.verzatv.com/, enumerated its script tags, downloaded every chunk, and located BrowsePage in /_next/static/immutable/chunks/1aseb4gggkekc.js (the chunk the current home page actually references). The shipped reality-grid code is:
   `let r=(S.MUX_MAP[e.slug]?.length??0)>0; ... return r ? jsx(Link,{href:posterHref(e.slug),className:"block no-underline min-w-0 transition-transform active:scale-[0.97]",prefetch:!0,onClick:...}) : jsx("div",{className:"block min-w-0","aria-disabled":"true",children:a})`
   The card `a` is built ONCE and shared by both branches. Title colour is `"#F5F4F8"` unconditionally; subtitle `"Reality"` unconditionally; no opacity, no filter, no Badge component in either arm. Deployed bundle == working tree for this block.

2. Live DOM readback, production, /?tab=reality:
   DIV | Sugar Babies     | href - | aria-disabled true | rgb(245,244,248) | cursor auto    | img 1/none | "block min-w-0" | no pill
   DIV | Buy/Sell Miami   | href - | aria-disabled true | rgb(245,244,248) | 

---

### S4-017 — Accessibility gaps on all three shipped search surfaces: no aria-label on any of the three inputs (placeholder only), no aria-live region announcing result counts or the no-results state, and the header overlay is not a 

*Raised by S4 — SEARCH. The four catalogue-search s*

**Reproduction.** Inspect the deployed markup: the only aria-labels shipped on the home page are "Change language", "Close bag", "Close sitemap" and "Search" (the trigger button). The three <input type="search"> elements carry placeholder and nothing else. Tabbing past the last result in the open overlay walks into the page behind it.

**Evidence.** components/SearchButton.tsx:95-104, components/SearchBar.tsx:42-53, app/search/page.tsx:107-118 — no aria-label, no aria-describedby, no role on the results container. components/SearchButton.tsx:63-71 the portal root is a plain div with onMouseDown-to-close. Production /search?q=love ships `\"type\":\"search\",\"name\":\"q\",\"defaultValue\":\"love\",\"placeholder\":\"Search by title, genre, keyword...\"` and no aria attributes.

**Independent verification.** CONFIRMED on production. Severity S2 stands (unchanged).

WHAT I DID
Drove a clean signed-out headless Chrome 151 (fresh --user-data-dir, CDP over port 9333) at 394x580, mobile:true, touch emulation on, iPhone 17.5 UA. Real Input.dispatchTouchEvent / dispatchMouseEvent / synthesizeScrollGesture, not synthetic JS events. Also read the shipped code at /Users/jothamhall/E! CREATOR ECONOMY/verza-tv/components/EpisodeFeed.tsx, components/EpisodeDropdown.tsx, app/series/[slug]/page.tsx, app/series/[slug]/[episode]/page.tsx, lib/catalog.ts, lib/i18n.ts.

WHAT I SAW — all three sub-claims reproduce

1. The rail. GET https://www.verzatv.com/series/the-mistress-trap/40 -> 200, title "The Escort They Framed - Episode 40 | VERZA TV". The feed scroller reports scrollHeight 23200 / clientHeight 580 = exactly 40 slides, scrollTop pinned at 22620 (index 39 x 580). Matches bound = Math.max(freeEpisodes+1, startIdx+1) = max(6,40) = 40 at EpisodeFeed.tsx:1422. Only data-index 37/38/39 are rendered (5-slide window). Correction to the raiser: with 5 free episodes it is 35 locked slides, not 34.

2. The copy is false and it is the shipped string. Overlay innerText, read off production:
   "You just watc

---

### S5-002 — The purchase-confirmation email names the URL slug, not the catalog title. 30 of the 86 paid titles would send a receipt naming a different product from the one on the paywall and on the Stripe line item; 8 name an entir

*Raised by S5 — Shop and commerce. Agent C's actual · **touches money or the shipped rail***

**Reproduction.** Buy any Series Unlock for a slug whose de-slugified form differs from its title. Example: /series/the-mistress-trap is titled "The Escort They Framed" (verified in the production paywall and page <title>). /api/unlock builds the Stripe line item as `${series.title} — Full Series` = "The Escort They Framed — Full Series", but the webhook's confirmation email subject is `You unlocked The Mistress Trap!`. Worst cases: the-blackthornes → email says "The Blackthornes", product is "Two Brothers, One Bride"; hidden-agenda → "Hidden Agenda" vs "The Killer Caregiver"; the-escort → "The Escort" vs "The Call Girl Bought by Betrayal"; the-missing-piece → "The Missing Piece" vs "Deadly Revelations"; echo

**Evidence.** app/api/stripe/webhook/route.ts:993-1002 — `seriesTitle: session.metadata?.seriesSlug?.replace(/-/g," ").replace(/\b\w/g, c=>c.toUpperCase()) || "Series"`. lib/email.ts:188 `const subject = ... \`You unlocked ${details.seriesTitle}!\``; lib/email.ts:194 renders the same value as the email's headline. Contrast app/api/unlock/route.ts:218 `name: \`${series.title} — Full Series\``. Computed over the real catalog (lib/catalog.ts, 86 rows where status===live && episodeCount>freeEpisodes && coinPerEpisode>0): 30 mismatches, of which 22 are apostrophe/punctuation losses and 8 are a different title outright. The same block also interpolates the value into HTML unescaped while escaping the buyer's na

**Independent verification.** CONFIRMED — and worse than the raiser stated.

WHAT I DID
1. Code path, single caller. `grep -rn sendPurchaseConfirmation` returns exactly one call site: app/api/stripe/webhook/route.ts:993, inside `fulfillCheckout`. There is no second, corrected email path. It passes
   seriesTitle: session.metadata?.seriesSlug?.replace(/-/g," ").replace(/\b\w/g, c=>c.toUpperCase()) || "Series"
   lib/email.ts:187-188 renders it as the subject `You unlocked ${details.seriesTitle}!`, line 194 as the pink headline, and line 248 as the team notice subject `New Series Unlock: ${...}` plus the "Series" row. Contrast app/api/unlock/route.ts:216 `name: `${series.title} — Full Series`` and :204 `One-time purchase of account access to ${series.title}` — Stripe names the catalog title, the receipt names the slug.

2. Effect evaluated, not string-matched. I parsed the real catalog literal (brace-matched, 96 objects), applied the MUX_MAP episodeCount normalization at lib/catalog.ts:1273-1280, and applied `isSeriesPurchasable` (lib/series-purchase.ts:12). Parse reconciles exactly with the known ground truth: 96 rows, 91 live, 5 coming_soon, 86 paid. Then I ran the webhook's exact transform over every paid slug

---

### S5-003 — The "$1.99 Series Unlock" card on all 86 paid show pages is an inert div with no buy control — the surface that advertises the price offers no way to act on it. Agent C's "$1.99 unlock on show pages" did not ship.

*Raised by S5 — Shop and commerce. Agent C's actual · **touches money or the shipped rail***

**Reproduction.** 1. Open https://www.verzatv.com/series/the-mistress-trap (or any of the 86 paid rows — these pages are in /sitemaps/pages.xml's sibling shows.xml and are the SEO landing pages). 2. The card reads "Series Unlock / All 61 episodes · one-time purchase / $1.99". 3. There is no button, link, or handler anywhere in it. The only purchase path in the product is to tap "Watch Episode 1 Free", swipe through five episodes, and meet the in-feed paywall.

**Evidence.** app/series/[slug]/page.tsx:326-364 — the whole card is `<div><div><div class="flex items-center justify-between"><p>Series Unlock</p>…<span>$1.99</span></div></div></div>`, no <a>, no <button>, no onClick. Confirmed verbatim in the deployed HTML of https://www.verzatv.com/series/the-mistress-trap (fetched 2026-08-29): the markup between "Watch Episode 1 Free" and the episode dropdown contains only div/p/span. Coverage: all 96 show pages fetched from production; the card renders on exactly the 86 paid rows and on none of the 5 wholly-free or 5 coming-soon rows — so the gating is right and only the control is missing.

**Independent verification.** CONFIRMED — mechanism reproduces exactly at every cited line; the raiser's counts are wrong and UNDERSTATE the blast radius.

WHAT I DID AND SAW
1. app/api/stripe/webhook/route.ts:993-998 is the SOLE call site of sendPurchaseConfirmation for series unlocks (grep -rn "sendPurchaseConfirmation" over the repo returns exactly the import, this call, and the lib/email.ts definition — no second, title-correct sender in /api/unlock/confirm or anywhere else). It passes: seriesTitle: session.metadata?.seriesSlug?.replace(/-/g," ").replace(/\b\w/g, c=>c.toUpperCase()) || "Series". There is no catalog lookup anywhere in the path.
2. It reaches BOTH the subject and the visible headline: lib/email.ts:188 `You unlocked ${details.seriesTitle}!` and lib/email.ts:194 renders the same value as the pink <p> headline.
3. The Stripe metadata carries no title to recover from. app/api/unlock/route.ts writes only seriesSlug + show_id; the Stripe line item at :218 is `${series.title} — Full Series` and custom_text at :204 is "One-time purchase of account access to ${series.title}". So Stripe's receipt line and the site say one name and Verza's own email says another.
4. ASSERTED AGAINST LIVE PRODUCTION, not

---

### S5-009 — A single 6-second AbortController deadline spans the entire entitlement chain, and both fallback paths reuse the same already-aborted signal — so once the deadline fires, the recovery that would restore a paid customer's

*Raised by S5 — Shop and commerce. Agent C's actual · **touches money or the shipped rail***

**Reproduction.** 1. Complete a Series Unlock; Stripe returns the buyer to /series/<slug>/6?session_id=cs_... 2. The client calls confirmSession(sessionId) → GET /api/unlock/confirm, which performs a Stripe checkout retrieve, a Supabase profile read, a Stripe paymentIntent retrieve with charge expansion, a purchase write and an entitlement write. 3. If that exceeds 6s (cold serverless start plus four provider round trips), deadline.abort() fires: confirmSession's catch returns false, setAuthFree(false) runs, then the /api/access fetch is issued on the SAME aborted signal and rejects immediately, then confirmSession(remembered) is issued on the same aborted signal and rejects immediately. 4. finally() sets aut

**Evidence.** components/EpisodeFeed.tsx:129 `const ACCESS_REQUEST_TIMEOUT_MS = 6_000;` — one constant. :1344-1345 `const deadline = new AbortController(); const deadlineTimer = setTimeout(() => deadline.abort(), ACCESS_REQUEST_TIMEOUT_MS);` — one controller for the whole IIFE. :1321 confirmSession uses `{ signal: deadline.signal }`; :1355 the /api/access fetch uses the same `deadline.signal`; :1362-1366 the remembered-session recovery calls confirmSession again, still on the same signal. Once aborted, an AbortSignal never resets, so steps 3's second and third requests reject synchronously. The work being timed is heavy: app/api/unlock/confirm/route.ts:67 stripe.checkout.sessions.retrieve, :112 getSeriesP

**Independent verification.** CONFIRMED in the deployed bundle, with the mechanism proven empirically against production.

WHAT I DID / SAW

1. Deployed bundle, not the build. Fetched https://www.verzatv.com/series/the-mistress-trap/1, pulled all 16 chunks, and found the effect in /_next/static/immutable/chunks/27_6kgf3tx4s2.js. The shipped minified code is exactly the shape described:
   `let a=new AbortController,i=setTimeout(()=>a.abort(),6e3)` — ONE controller, 6000 ms, for the whole IIFE.
   `s` (confirmSession) fetches `/api/unlock/confirm?...` with `{signal:a.signal}`.
   Fallback 1: `fetch(\`/api/access?slug=${e}\`,{signal:a.signal})`.
   Fallback 2: `localStorage.getItem(n)` then `await s(e)` — same `a.signal` again.
   Terminal state: `t||R(!1)` then `.finally(()=>{clearTimeout(i),t||M(!0)})` = setAuthFree(false) + setAuthResolved(true).

2. Verified the EFFECT of the shared signal, not the assignment. Ran the real shape against the live origin (scratchpad/abort-test.mjs): with the controller already aborted, `/api/access` rejected AbortError in 14 ms and the remembered-session confirm in 0 ms, neither reaching the network. Control with a fresh signal: `/api/access` returned HTTP 200 `{"full":false}` 

---

### S5-010 — Any non-OK response from /api/access is treated as "not entitled" rather than "could not check", so a transient 429/500/503 paywalls a paying customer and blacks out episodes they own.

*Raised by S5 — Shop and commerce. Agent C's actual · **touches money or the shipped rail***

**Reproduction.** 1. Sign in as an owner of a paid series and open a paid episode. 2. Cause /api/access?slug=<slug> to return any non-2xx (rate limit exceeded, upstream Supabase error, a 503 during deploy). 3. `r.ok` is false, `d` becomes null, neither branch sets authFree(true), execution falls to setAuthFree(false), and the paywall arms 250ms after authResolved flips. The owner is asked to buy a title they own; a locked slide has hlsUrl null, so the video behind the overlay is a black rectangle.

**Evidence.** components/EpisodeFeed.tsx:1355-1357 `const r = await fetch(\`/api/access?slug=${seriesSlug}\`, {signal: deadline.signal}); const d = r.ok ? ((await r.json()) as {full?: boolean}) : null; if (!stale && d?.full) { setAuthFree(true); return; }` … :1370 `if (!stale) setAuthFree(false);`. The rate-limit half of this was mitigated — middleware.ts:48 now gives /api/access its own 120/min bucket, and the comment at :39-47 names exactly this failure — but the client-side conflation of "error" with "not entitled" was not changed, so every other non-OK cause still produces it. Note middleware.ts:10-13: buckets are per serverless isolate, so the effective limit is neither globally shared nor predictabl

**Independent verification.** CONFIRMED in the DEPLOYED bundle, not just the source.

WHAT I DID / SAW
1. Deployed proof. Fetched https://www.verzatv.com/series/the-escort/1, pulled its 16 chunks, and found the entitlement effect in https://www.verzatv.com/_next/static/immutable/chunks/27_6kgf3tx4s2.js. Minified, verbatim: `let a=new AbortController,i=setTimeout(()=>a.abort(),6e3)` — ONE controller, 6000ms. All three requests take that same signal: confirmSession `fetch(`/api/unlock/confirm?session_id=...`,{signal:a.signal})`; the fallback `fetch(`/api/access?slug=${e}`,{signal:a.signal})`; and the remembered-session recovery, which calls the same `s(e)` helper and therefore the same signal. The evidence lines are accurate (local: components/EpisodeFeed.tsx:129, 1344-1345, 1321, 1359, 1362-1366).

2. Effect, not assignment. Wrote /private/tmp/.../scratchpad/repro.mjs transcribing the deployed control flow 1:1 and drove it with a confirm that exceeds 6s and an /api/access that would answer full:true. Output: confirm ABORTED in flight at 6s -> `/api/access` REJECTED INSTANTLY (signal already aborted, request never sent) -> remembered confirmSession REJECTED INSTANTLY -> authFree=false, authResolved=true. Per spec

---

### S5-017 — Three unimported commerce components still carry live-looking $1.99 purchase UI, including a full unlock button wired to /api/unlock. None has an importer, so none can be reached — but they are the copies most likely to 

*Raised by S5 — Shop and commerce. Agent C's actual*

**Reproduction.** `grep -rn "from \"@/components/Player\"\|from \"@/components/CoinPaywall\"\|SeriesInfoButton" app components lib` returns only the definition files themselves.

**Evidence.** components/Player.tsx:986 `{unlockLoading ? "Loading..." : "Series Unlock — $1.99 one-time"}` — no importer (app/**, components/** and lib/** reference only lib/instant-player.ts). components/CoinPaywall.tsx:142 same string — no importer. components/SeriesInfoDrawer.tsx:371 renders a "$1.99" padlock chip and :365 hard-codes `series.freeEpisodes ?? 5`; its only consumer, components/SeriesInfoButton.tsx, has no importer either. The manifest counts 2 CoinPaywall and several Player interactive elements in the 535 denominator, so they inflate everyone's coverage figure too.

**Independent verification.** REPRODUCED LIVE on www.verzatv.com (not just the source). These routes are POST-only, so GETs 405 at the handler while still passing through middleware — side-effect-free probes.

(1) Three sequential requests to three DIFFERENT routes returned one monotonically decreasing counter sharing a byte-identical reset timestamp: /api/checkout remaining 14 -> /api/unlock 13 -> /api/subscribe 12 -> /api/checkout 11, all X-RateLimit-Limit: 15, all X-RateLimit-Reset: 1788043617. One bucket object, not three.
(2) The finding's exact repro: 16 requests to /api/subscribe ALONE drove it 14->0 then 429. Immediately after, /api/unlock and /api/checkout — zero requests in that window — both returned HTTP 429, Retry-After: 51, X-RateLimit-Remaining: 0.
(3) Control: /api/access (limit 120) was unaffected at remaining 119 during the lockout, proving the collapse is specifically the equal-limit collision, not a global lockout.
(4) Bucket recovered after 60s and again decremented across routes (14->13->12).

Source matches: middleware.ts:129 `const key = `${ip}:${limit}``; :32-34 assign limit 15 to all three. Not a deliberate grouping — the author relied on the opposite invariant at :45-47 ("Each of thes

---

### S6-005 — Reflected text from ?error= is rendered verbatim in the error box on /reset-password, so a crafted link puts attacker-authored copy on verzatv.com in Verza's own styling for any signed-in viewer.

*Raised by S6 — My List / Library / Profile / Accou*

**Reproduction.** Sign in, then open https://www.verzatv.com/reset-password?error=<any+sentence>. getSession() succeeds, status becomes 'ready', and the unmatched code falls through to `return code;` and is printed inside the red alert panel above the password form.

**Evidence.** app/reset-password/ResetPasswordClient.tsx:23-28 - `function errorCopy(code){ ... return code; // Supabase surfaced a real message - show it as-is. }` rendered at :195-202. The sibling component takes the opposite position and says why: components/AuthErrorNotice.tsx:16-21 - 'THE MESSAGE IS NEVER ECHOED BACK. `error` is a query parameter, so it is attacker-controlled: a crafted link could otherwise put any sentence - a fake support phone number, say - on our own sign-in page in our own type.' React escapes the value, so this is content injection, not script execution.

**Independent verification.** Reproduced live, in the deployed bundle and in a real signed-out browser.

WHAT I DID / SAW

1. Live API, no cookies: `curl -i https://www.verzatv.com/api/entitlements` -> `HTTP/2 401`, body `{"error":"Authentication required"}`. Matches /Users/jothamhall/E! CREATOR ECONOMY/verza-tv/app/api/entitlements/route.ts:5-9 (`if (!user) return privateJson({error:"Authentication required"},{status:401})`).

2. Deployed bundle, not the build. Pulled every chunk referenced by https://www.verzatv.com/me and found `PurchaseCount` shipped in https://www.verzatv.com/_next/static/immutable/chunks/0fkfn44ctjja6.js:
   `fetch("/api/entitlements").then(e=>e.ok?e.json():null).then(t=>{e||r(t?.entitlements?.length??0)}).catch(()=>{e||r(null)})` ... `null===e ? <>&nbsp;</> : <>{e>0?`${e} unlocked`:"No purchases"}</>`
   Traced the effect, not the assignment: 401 -> `!r.ok` -> `null` -> `null?.entitlements?.length` = `undefined` -> `?? 0` -> `setCount(0)` -> `0 > 0` false -> literal string "No purchases". The `catch` (network failure) is the only path that yields the honest blank; a clean 401 does not reach it.

3. Real browser, signed out. Header on /me read "Guest" / "Sign in to sync your library and p

---

### S6-009 — GET /api/watch-progress does not clamp episode_number to the series' current episodeCount, so a signed-in viewer's Continue Watching tile can link to a 404 - the client rail has the clamp, the server response does not.

*Raised by S6 — My List / Library / Profile / Accou*

**Reproduction.** A watch_progress row whose episode_number exceeds the title's current episodeCount (episodeCount is auto-normalised from MUX_MAP length, so it shrinks on a re-cut) survives the server filter and is rendered by RecentlyWatchedList via buildResumeUrl. Verified the destination: https://www.verzatv.com/series/the-mistress-trap/66 -> HTTP 404 (that title has 61 episodes; /series/the-mistress-trap/61 -> 200).

**Evidence.** app/api/watch-progress/route.ts:98-110 drops rows only when the series is missing or not live. lib/continue-watching.ts:52 has the missing half: `if (r.episodeNumber > series.episodeCount) return [];` with the comment 'A row can outlive the episode it points at ... /series/<slug>/<n> past the end is a 404, and a rail tile is not the place to discover that.' components/AccountLists.tsx:255 links with buildResumeUrl (lib/resume.ts:30-33), which has no such guard, unlike lib/series-href.ts:80-87 episodeHref. Harness: continueWatchingFromRows() dropped the out-of-range row (0 rows) while buildResumeUrl produced '/series/the-mistress-trap/66?t=10'.

**Independent verification.** CONFIRMED — the gap is real, is in the deployed bundle, and the trigger has already fired once in this repo's production history.

WHAT I CHECKED, IN ORDER

1. The missing clamp. /Users/jothamhall/E! CREATOR ECONOMY/verza-tv/app/api/watch-progress/route.ts:98-110 — the GET flatMap drops a row only for `!series || series.status !== "live"`. There is no comparison of `wp.episode_number` against `series.episodeCount`. Grepping `episodeCount` across all of app/api/ shows this is the ONLY read path that omits the check: app/api/playback/[episode]/route.ts:50, app/api/entitlements/check/route.ts:31 and app/api/account/sync/route.ts:65 all reject `epNum > series.episodeCount`, and lib/continue-watching.ts:52 does too. Four places guard it, one does not. That is a gap, not a design choice.

2. Where the unclamped rows land — VERIFIED IN THE DEPLOYED BUNDLE, not the build. Fetched https://www.verzatv.com/ and pulled its chunks; in /_next/static/immutable/chunks/0q5a2u069nbfo.js the shipped merge is `mergeContinueWatching = function(e){return e && e.length>0 ? e : r()}`, where `r()` is the guest reader carrying the clamp `...||e.episodeNumber>s.episodeCount?[]:[...]`. So the clamp only ever 

---

### S6-010 — There is no self-service purchase recovery on the web: /api/entitlements/claim is a hard 410, pending_entitlements has zero readers and zero writers, and the only offered remedy is an email to support.

*Raised by S6 — My List / Library / Profile / Accou · **touches money or the shipped rail***

**Reproduction.** POST https://www.verzatv.com/api/entitlements/claim -> 410 {"error":"Automatic purchase recovery is unavailable; contact support"}. grep -rn pending_entitlements app lib -> no matches (the table is created in supabase/migrations/006). Neither signInAction nor the OAuth callback claims anything (app/actions/auth.ts:28-30, app/api/auth/callback/route.ts:22-23).

**Evidence.** app/api/entitlements/claim/route.ts:8-13 returns 410 unconditionally. app/me/purchases/page.tsx:42-46: 'If something you bought is missing here, email support@verzatv.com with the email you used at checkout.' Mitigating: the paid path is auth-bound at purchase time (app/api/unlock/route.ts:93-95, :197 client_reference_id: user.id), so orphaned web purchases should not arise in the first place - but there is no in-product route back if one does, and no 'Restore Purchases' control anywhere on the web surface.

**Independent verification.** CONFIRMED, severity raised S3 -> S2.

WHAT I CHECKED

1) The asymmetry is real in shipped source (working tree clean at HEAD 197cc1a):
- /Users/jothamhall/E! CREATOR ECONOMY/verza-tv/app/api/watch-progress/route.ts:98-110 — GET drops a row only when the series is missing or not live. No episodeNumber-vs-episodeCount clamp.
- Same file line 37 — POST bounds episodeNumber to integer 1..999 ONLY, never against the series, so an out-of-range row is writable and persists.
- /Users/jothamhall/E! CREATOR ECONOMY/verza-tv/lib/continue-watching.ts:52 — the guest path DOES clamp: `if (r.episodeNumber > series.episodeCount) return [];`, with a comment naming this exact 404.
- /Users/jothamhall/E! CREATOR ECONOMY/verza-tv/app/api/account/sync/route.ts:60-68 — the guest->account merge ALSO rejects `episodeNumber > series.episodeCount`. So the project guards this hazard in two places; the server GET is the one gap.
- lib/continue-watching.ts:85 — mergeContinueWatching returns serverItems verbatim when non-empty, so nothing downstream re-applies the clamp.
- components/BrowsePage.tsx:628 and components/AccountLists.tsx:255 link straight to buildResumeUrl() = /series/<slug>/<n> (lib/resume.ts:30-3

---

### S6-011 — My List falls back to the device's copy whenever the account's saved list comes back empty, so an account with zero saved shows displays stale device rows and removals made on another device reappear.

*Raised by S6 — My List / Library / Profile / Accou*

**Reproduction.** Save titles on device A while signed in; remove all of them on device B; return to device A. GET /api/saved-list returns {items:[]}, length 0, so the component treats the account's answer as 'nothing to say' and renders the device mirror instead.

**Evidence.** components/AccountLists.tsx:111-120 - `if (data?.items && data.items.length > 0) {...} fallbackToDevice();`. The same 'empty means ignore the server' rule is repeated in components/ProfileDynamic.tsx:24, components/EpisodeFeed.tsx:1948, components/ShortsFeed.tsx:202. lib/continue-watching.ts:85 states the intended rule - 'The server is the authority whenever it has anything to say' - but an empty account list is a real answer, not silence. This is also the mechanism that surfaces S6-003 to the next viewer on a shared device.

**Independent verification.** CONFIRMED, and worse than filed — the removal is not merely displayed stale, it is silently re-inserted into the account.

WHAT I CHECKED

1. Source, all four cited sites, line numbers accurate. components/AccountLists.tsx:111 `if (data?.items && data.items.length > 0) {…} fallbackToDevice();`; components/ProfileDynamic.tsx:24; components/EpisodeFeed.tsx:1948; components/ShortsFeed.tsx:201-204. lib/continue-watching.ts:85 states the intended rule and implements the same empty-means-ignore exception.

2. Why the rule is ambiguous, verified on PRODUCTION, not the build. `curl -s https://www.verzatv.com/api/saved-list` with no cookie returns HTTP 200 `{"items":[]}` (app/api/saved-list/route.ts:12-14 returns `privateJson({items: []})` for a signed-out caller, not a 401). The client only tests `r.ok`, so a guest and a signed-in account with zero saved rows are byte-identical answers. The fallback is load-bearing for guests and therefore cannot be removed without a way to tell the two apart — but it is why an emptied account renders the device mirror.

3. Verified in the DEPLOYED BUNDLE, not the build. Pulled every chunk on https://www.verzatv.com/me/list. /_next/static/immutable/chunks/

---

### S7-001 — Reality: 3 of the 4 tiles are dead flyers rendered identically to the one that plays, with no Coming Soon treatment and no explanation.

*Raised by S7 — SECTIONS. The 10 browse tabs (Drama*

**Reproduction.** Open https://www.verzatv.com/?tab=reality on a phone. Four posters render in a 2x2 grid, each with a title and a "Reality" subtitle. Tap Sugar Babies, Buy/Sell Miami or The Vertical Tea: nothing happens, no navigation, no message. Only Storage Pirates opens.

**Evidence.** components/BrowsePage.tsx:873 (`const playable = (MUX_MAP[show.slug]?.length ?? 0) > 0`) and :904 (`<div key={show.title} className="block min-w-0" aria-disabled="true">`). Production DOM at /?tab=reality: `DIV|aria-disabled=true|286x471` x3 (Sugar Babies, Buy/Sell Miami, The Vertical Tea), `A|/series/storage-pirates/1|286x471`. Direct fetch: /series/sugar-babies 404, /series/buy-sell-miami 404, /series/the-vertical-tea 404. The same file defines the house Coming Soon badge (BADGE_STYLE.soon, BrowsePage.tsx:139) and applies it to catalog coming-soon rows on Español/Bollywood, but not here. `aria-disabled="true"` on a plain div with no role is not exposed to assistive tech (measured: role=-, 

**Independent verification.** Reproduced in production, with one correction to the wording.

DEPLOYED BUNDLE: chunks/1aseb4gggkekc.js from www.verzatv.com builds `card` once, then returns `r ? jsx(Link,{href:posterHref(slug),className:"...active:scale-[0.97]",prefetch:!0,onClick:...}) : jsx("div",{className:"block min-w-0","aria-disabled":"true",children:a})`. The inert branch has no href, no onClick, no press feedback, and its child is byte-identical to the playable tile's. Deployed CSS (/_next/static/immutable/chunks/1b0rux1xv-mpp.css) has ZERO rules matching aria-disabled, so the attribute paints nothing.

REAL DATA: deployed MUX_MAP chunks contain sugar-babies/buy-sell-miami/the-vertical-tea 0 times, storage-pirates yes. Live: /series/sugar-babies 404, /series/buy-sell-miami 404, /series/the-vertical-tea 404, /series/storage-pirates 200. Those 3 slugs exist repo-wide ONLY in BrowsePage.tsx:438-441 — they are NOT among the 5 coming_soon catalog rows, so the "coming-soon rows route to their show page on purpose" defence does not apply; there is no page to route to.

LIVE DOM (/?tab=reality, 430px viewport): all four grid children 180x312, opacity 1, filter none. Three are DIV aria-disabled=true, no href, curs

---

### S8-011 — /contact presents itself as the address directory and omits privacy@, careers@ and investors@ — including the address the Privacy Policy directs all deletion and CCPA/GDPR requests to.

*Raised by S8 — Legal, Trust, Footer. The 21 legal/*

**Reproduction.** Read /privacy §6, §7, §10, §12, §14 — every one routes the reader to privacy@verzatv.com. Now open /contact ('Choose the address below that best matches your request') or follow /support's 'Contact Directory →' link: the page lists General Inquiries (support@), Press (press@), Legal (legal@) and Feedback (feedback@) only. A viewer exercising a deletion or CCPA right from the contact page cannot find the address.

**Evidence.** app/contact/page.tsx defines four cards. Site-wide the copy directs people to seven addresses: support@, press@, legal@, feedback@, privacy@ (app/privacy/page.tsx §6/§7/§10/§12/§14 and app/support/page.tsx), careers@ (app/careers/page.tsx:171), partnerships@ (app/partnerships/page.tsx), investors@ (app/investors/page.tsx). app/support/page.tsx labels its /contact link 'Contact Directory →'.

**Independent verification.** CONFIRMED as a real, deterministic server crash — but the finding's severity and its central user-facing claim are both wrong. Corrected S1 -> S2.

WHAT I DID / SAW

1) Reproduced the 500 on production. `curl -s -o /dev/null -w '%{http_code}'` against https://www.verzatv.com:
   500  /search?q=a&q=b          (5/5 runs, deterministic)
   500  /search?q=&q=
   500  /search?q=pasion&q=pasion
   500  /search?q=a&q=b&q=c
   500  /search?q=%3Cscript%3E&q=b
   200  /search?q=pasion   200  /search   200  /search?q[]=pasion   200  /search?foo=1&q=pasion   200  /search?Q=a&q=b
   Every claimed status in the repro matches. Response headers: `x-matched-path: /search`, `x-vercel-cache: MISS`, `cache-control: private, no-cache, no-store` (so the 500 is not cached; no cache-poisoning angle).

2) Mechanism proven, not assumed. Served HTML has `id="__next_error__"` on the `<html>` tag and carries digests 3143474394 and 142849278 — exactly the two digests claimed. Ran the actual expression locally: `["a","b"]?.trim()` throws `TypeError: q?.trim is not a function`. The `?.` guards null/undefined on `q`, not a missing `.trim` on an array. Decisive proof the value is an array and not a joined string: `

---

### S8-015 — /about advertises 'Podcasts' as one of the platform's content categories; no podcast tab, genre, discover category or catalog row exists.

*Raised by S8 — Legal, Trust, Footer. The 21 legal/*

**Reproduction.** Open https://www.verzatv.com/about, Content section: '91 live series across Drama, Reality, Music, Podcasts, Red Carpet, and more.' Then look for podcasts anywhere in the product — the browse tabs are Drama, Hot, Tubi, Anime, Español, Bollywood, Creators, Reality, Red Carpet, Music; /genres lists 27 hubs, none a podcast; /discover categories include comedy, mystery, sci-fi, horror, crime, fantasy, none a podcast.

**Evidence.** app/about/page.tsx:136-138. BROWSE_TABS at lib/catalog.ts:19-31 has no podcast key. lib/content/genres.ts GENRE_HUBS has no podcast slug. lib/discover-categories.ts has no podcast. The only match in the catalog is a drama series titled 'The Breakup Podcast' (lib/catalog.ts:1163-1170), genre 'Romance · Comedy', category 'bollywood', 60 episodes. Same sentence's other categories are all real: Drama, Reality ('Red Carpet · Reality', 'Reality · Comedy'), Music ('Music · Drama'), Red Carpet.

**Independent verification.** CONFIRMED at all three layers — source, live production, and the deployed client bundle. Severity S2 stands.

WHAT I DID

1. Source, real code not a re-implementation. Compiled the actual modules with the repo's own tsc into my scratchpad (/private/tmp/.../scratchpad/build) and ran seriesMatchesQuery against the real 96-row catalog. Measured the catalogue first: 96 title fields, 13 contain an apostrophe, and the only apostrophe codepoint present anywhere is U+0027 — no U+2019 in any title. For each of the 13, queried the exact title with U+0027 and then the same string with U+0027 replaced by U+2019:
   ASCII query returns >=1 result: 13/13. U+2019 query returns >=1 result: 0/13.
   "The Billionaire's Betrayal" goes 3 -> 0; the other twelve go 1 -> 0.

2. Live production, server-rendered /search. Fetched both forms for all 13 and counted /series/ hrefs in the HTML.
   /search?q=The%20Billionaire%27s%20Vow -> http 200, one link, /series/the-billionaires-vow/1.
   /search?q=The%20Billionaire%E2%80%99s%20Vow -> http 200, zero links, "No results" panel.
   Across all 13: ASCII 11/13 with >=1 hit, U+2019 0/13. Every one of the 13 renders the no-results panel with U+2019.

3. Deployed bu

---

### S8-017 — /leadership prints a disclaimer that some bios are 'representative placeholders' when the page shows exactly one bio — reading as a warning that the founder's bio may be fabricated.

*Raised by S8 — Legal, Trust, Footer. The 21 legal/*

**Reproduction.** Open https://www.verzatv.com/leadership. One person is listed (Alan Mruvka, Founder & CEO). Immediately below: 'Bios for roles other than the founder are representative placeholders for the VERZA TV team and will be confirmed before public use.'

**Evidence.** app/leadership/page.tsx:157-161 renders the disclosure unconditionally. lib/data/company.ts:44-51 — LEADERSHIP contains a single Leader object. There are no non-founder bios for the sentence to be about.

**Independent verification.** CONFIRMED. Reproduced end-to-end, independently, on code + production + the deployed bundle. Severity S2 upheld.

WHAT I DID / SAW

1) Production search (server-rendered, so the HTML is the behaviour). curl'd www.verzatv.com with a browser UA:
   /search?q=The%20Chairman%27s%20Revenge -> 200, "0" series found, literal string "No results for “The Chairman's Revenge”".
   Same "No results for" body for q=chairman, q=protected%20by%20the%20devil, q=the%20last%20will, q=apron, q=jardinero. 6/6 as reported.
   Control: q=billionaire -> 22 results, q=mansi%C3%B3n -> exactly 1 result, "The Haunted Sisters", href /series/the-haunted-sisters/1. The Spanish row whose title literally contains "mansión" is absent. The illustrative example in the finding is exact.

2) The show pages exist. curl -o /dev/null -w %{http_code} on all five: the-chairmans-revenge 200, protected-by-the-devil 200, the-last-will 200, the-billionaires-apron 200, i-cant-resist-my-mansion-gardener 200. So "No results for X" is a false statement about a title with a live page.

3) Matcher vs pool — the cause is the pool filter, not the matcher. Loaded lib/catalog.ts + lib/text-fold.ts + lib/search-index.ts through the same 

---

## S3 — the task completes but the experience is broken or confusing

### D1-004 — /me tells a paying customer they have no purchases when the API is down. With /api/saved-list, /api/watch-progress and /api/entitlements all returning 500 the page renders "0 saved", "No history" and "No purchases" with 

*Raised by D1 — STATES: loading, empty, error, skel · **touches money or the shipped rail***

**Reproduction.** 1. Open https://www.verzatv.com/me/purchases. 2. Install a fetch interceptor returning 500 for /api/. 3. Click the in-page link to /me (client-side nav). 4. The account page paints the three counters at their zero values. SavedCount and WatchingCount also show "0 saved" / "No history" for the whole load window before any response arrives, because they initialise to 0 rather than to an unknown state.

**Evidence.** Forced on production: {"log":["500 /api/saved-list","500 /api/watch-progress","500 /api/entitlements"],"text":"Guest ... LIBRARY My List 0 saved Continue Watching No history Purchase History No purchases ..."}. Source: components/ProfileDynamic.tsx:12 and :39 — `useState<number>(0)` with `.catch(() => {})`, so 0 is both the loading value and the error value; components/ProfileDynamic.tsx:65-79 — PurchaseCount uses `useState<number|null>(null)` and renders `&nbsp;` forever on failure, i.e. a silently blank row.

**Independent verification.** CONFIRMED, but only for one of the three counters the finding names; two-thirds of the summary is disproven by direct reproduction. Severity corrected S2 -> S3.

WHAT I DID. Forced the exact stated repro on live production, not a local build. Loaded https://www.verzatv.com/me in Chrome, installed a fetch interceptor returning 500 for /api/entitlements, /api/saved-list and /api/watch-progress, seeded localStorage `verza-saved` with two slugs, then client-side navigated /me -> /me/purchases -> /me (both are Next <Link>, so the interceptor survived). Interceptor log confirmed all three 500s fired.

RESULT (all three APIs 500):
  My List           -> "2 saved"        <- device fallback WORKED, not a false zero
  Continue Watching -> "1 in progress"  <- device fallback WORKED, not "No history"
  Purchase History  -> "No purchases"   <- FALSE. the only real defect
  no error UI anywhere on /me (regex for Couldn't / Something went wrong / Retry / unavailable: false)

THE REAL DEFECT (verified in the DEPLOYED bundle, not the source). /_next/static/immutable/chunks/0fkfn44ctjja6.js, PurchaseCount, verbatim: `fetch("/api/entitlements").then(e=>e.ok?e.json():null).then(t=>{e||r(t?.entitlement

---

### D1-006 — /discover/[genre] accepts any string and returns HTTP 200 with a fabricated category page. /discover/zzzzz renders "Zzzzz Micro-Dramas — 0 live series — No zzzzz series yet. Catalog availability changes over time. Check 

*Raised by D1 — STATES: loading, empty, error, skel*

**Reproduction.** curl -s https://www.verzatv.com/discover/zzzzz — 200. Also /discover/anything, /discover/not-a-genre, /discover/%2e%2e%2f (renders "../ Micro-Dramas"). All 200 with a populated-looking page and a false "check back soon" promise.

**Evidence.** Production: `200 :: Zzzzz Micro-Dramas | VERZA TV ... Discover Zzzzz Micro-Dramas 0 live series No zzzzz series yet. Catalog availability changes over time. Check back soon. About Zzzzz Micro-Dramas on VERZA TV ... Our zzzzz catalog features 0 currently live matches for this catalog filt...`. Source: app/discover/[genre]/page.tsx — `generateStaticParams()` at :78 returns DISCOVER_CATEGORY_SLUGS, but the file contains no `notFound()` call and no `export const dynamicParams = false`. Contrast app/genre/[genre]/page.tsx:4, which does import and call notFound().

**Independent verification.** Reproduced verbatim on www.verzatv.com. /discover/zzzzz, /discover/anything, /discover/not-a-genre all return 200. The zzzzz page renders title "Zzzzz Micro-Dramas | VERZA TV", H1 "Zzzzz Micro-Dramas", "0 live series", "No zzzzz series yet. Catalog availability changes over time. Check back soon.", and the SEO block "Our zzzzz catalog features 0 currently live matches for this catalog filter." /discover/%2e%2e%2f returns 200 with H1 "..%2F Micro-Dramas", title "../ Micro-Dramas | VERZA TV" and a canonical that path-traverses to https://www.verzatv.com.

ROOT CAUSE (matches evidence): /Users/jothamhall/E! CREATOR ECONOMY/verza-tv/app/discover/[genre]/page.tsx has generateStaticParams() returning DISCOVER_CATEGORY_SLUGS but NO `export const dynamicParams = false` and no notFound() guard, so Next's default dynamicParams:true renders any segment. Controls confirm the rest of the site 404s correctly: /series/zzzzz -> 404, /discovr/x -> 404.

PERSISTENCE + INDEXABILITY (worse than a transient render): response headers on /discover/zzzzz show x-nextjs-prerender: 1, x-vercel-cache: HIT, age: 144 (my own probe was already CDN-cached), with <meta name="robots" content="index, follow"> and a 

---

### D1-008 — 0 of 65 page routes have a loading.tsx; 1 of 65 has an error.tsx (the episode player); there is no global-error.tsx. The production 500 that results is Next.js's unbranded default — no VERZA chrome, no nav, no link home,

*Raised by D1 — STATES: loading, empty, error, skel*

**Reproduction.** curl -s -o /dev/null -w '%{http_code}' 'https://www.verzatv.com/genres/%C0%80'  → 500. Same for /guides/%FF. A malformed percent-escape is what a mangled link in an SMS, an email client or a QR code produces. Then read the body.

**Evidence.** Production 500 body (9,368 bytes): `500: This page couldn't load  This page couldn't load  A server error occurred. Reload to try again.  Reload` — checked and confirmed absent: nav/footer chrome (0), "Back to Discover" (0), "Try again" (0). Headers show `content-disposition: inline; filename="500"` (the Next default asset). Repo scan: `find app -name loading.tsx -o -name error.tsx -o -name global-error.tsx` returns exactly two files — app/not-found.tsx and app/series/[slug]/[episode]/error.tsx. /collections/%00 returns a bare 400 with an empty body.

**Independent verification.** CONFIRMED — the error half. Reproduced end to end on www.verzatv.com; the loading.tsx half is padding and should be dropped.

WHAT I DID AND SAW
1. Repo scan (`find app -name loading.tsx -o -name error.tsx -o -name global-error.tsx`) returns exactly one file: /Users/jothamhall/E! CREATOR ECONOMY/verza-tv/app/series/[slug]/[episode]/error.tsx. 65 page.tsx files, 0 loading.tsx, 0 global-error.tsx. Counts as stated. (The raiser omitted that app/not-found.tsx DOES exist and is branded — 404s are fine; only the 500 path is bare.)
2. Production 500 reproduced on five paths, not just the two claimed: /genres/%C0%80, /guides/%FF, /series/%FF, /discover/%e2, /series/%C0%80/1 → all HTTP 500. Control paths behave: /genres/nonexistent-genre-xyz → 404, /genres/dram%61 (valid escape) → 404, /search?q=100% → 200, three real sitemap series URLs → 200. No collateral.
3. Body matches the evidence byte-for-byte in substance: 9,368 bytes, content-disposition: inline; filename="500", x-matched-path: /500, visible text "500: This page couldn't load … A server error occurred. Reload to try again. Reload". /500 fetched directly returns the identical md5 (ba2d2c9e…).
4. Dead end confirmed by count, not by 

---

### D2-003 — The Profile screen is a Server Component that hard-codes 16 strings which exist, fully translated, in all 20 locales.

*Raised by D2 — Localization. All 20 locales x all *

**Reproduction.** Open /me in any locale. Every row label stays English. app/me/page.tsx is a Server Component (getUser(), getVipStatusServer()) and passes label="..." literals to MenuRow, so t() is architecturally unavailable — this is not a missed call site, it is a boundary problem.

**Evidence.** app/me/page.tsx:251 "Guest" (=profile.guest), :254 "Sign in to sync your library and purchases" (=profile.signInPrompt), :263 "Sign In" (=profile.signIn), :310 "Library" (=library.title), :314 "My List", :320 "Continue Watching", :326 "Purchase History", :376 "Help & FAQs", :381 "Send Feedback", :387 "Report a Problem", :407 "Terms of Service", :412 "Privacy Policy", :417 "Refund Policy". components/ProfileDynamic.tsx:95 "Dark Mode", :226 "Sign Out". components/PushNotificationToggle.tsx:143 "Notifications". Only "Language" localizes (components/LanguagePicker.tsx:36,61 → profile.language).

**Independent verification.** REPRODUCED ON LIVE PRODUCTION, not the build.

What I did: opened https://www.verzatv.com/me in Chrome, set localStorage `verza-lang` (the real key, lib/i18n.ts:1176) to "es", reloaded, waited for hydration, and dumped the section's innerText. Repeated with "ja".

What I saw (es): document.documentElement.lang === "es", the picker row reads "Idioma / Español" — so the locale layer is live and knows the viewer's language — and every other row on the screen is English: "Guest", "Sign in to sync your library and purchases", "Sign In", "LIBRARY", "My List", "Continue Watching", "Purchase History", "Notifications", "Dark Mode", "Help & FAQs", "Send Feedback", "Report a Problem", "Terms of Service", "Privacy Policy", "Refund Policy", "Sign Out".

What I saw (ja) — the decisive frame: the bottom nav that leads to this screen is fully Japanese (発見 / ショート / ショップ / ライブラリ / プロフィール), the picker row reads "言語 / 日本語", and the account screen underneath it is byte-identical English. The translation layer works everywhere except here.

Dictionary claim checked, not string-matched: parsed lib/i18n.ts into JS and compared all 20 dictionaries cell-by-cell. All 20 locales present; for the 17 relevant k

---

### D2-006 — The audio-language label — the string whose stated purpose is stopping wrong-language purchases — renders a doubled article in Arabic and a doubled word in Vietnamese on all 96 show pages.

*Raised by D2 — Localization. All 20 locales x all  · **touches money or the shipped rail***

**Reproduction.** interpolate(dictionaries.ar['language.audio'], {language: languageName('ar','en')}) → "الصوت بالالإنجليزية". The template is "الصوت بال{language}" and Intl.DisplayNames('ar').of('en') returns "الإنجليزية", which already carries the definite article ال, so بال + ال = بالال. Same for 'es' and 'hi', and for both slots of language.audioSubs ("ترجمة بالالإنجليزية"). Vietnamese: template "Tiếng {language}", DisplayNames('vi').of('en') = "Tiếng Anh" → "Tiếng Tiếng Anh"; 'hi' → "Tiếng Tiếng Hindi".

**Evidence.** lib/i18n.ts:714-715 (ar) and :1014-1015 (vi). Rendered by components/AudioLanguageBadge.tsx:52,56 from app/series/[slug]/page.tsx:195 — one per show page, confirmed live (production /series/the-mistress-trap renders "English audio"). All 3 spoken languages in lib/audio-language.ts (en/es/hi) are affected in both locales. Lower-severity siblings in the same key: nl "Audio in Engels" (missing "het"), th "เสียง อังกฤษ" (space Thai does not use).

**Independent verification.** CONFIRMED (mechanism exactly as stated; the "everywhere" impact claim is overstated — corrected below). Severity S3 stands.

WHAT I DID, ON THE LIVE DEPLOY (dpl_FEduFW6ftQZyapPx28PouXp55wk3):

1. Deployed HTML. Fetched /, /me, /library, /shop, /sign-in, /series/the-mistress-trap, /series/the-mistress-trap/1 from www.verzatv.com. All seven ship `<html data-dpl-id="…" lang="en" class="…">` — no `dir` attribute on any route. Matches app/layout.tsx:107.

2. Deployed JS. Enumerated every chunk referenced by those pages plus every chunk name embedded in them (24 files, 1.5 MB) and downloaded all of them. `documentElement.dir` → ZERO hits. `documentElement.lang` → 3 hits (raiser said 5; the grep result is the same either way). The string "rtl" appears exactly ONCE in the whole deployed bundle: `dir:"ar"===X?"rtl":void 0` in /_next/static/immutable/chunks/27_6kgf3tx4s2.js, which is components/EpisodeFeed.tsx:2511, the paywall overlay. Repo-wide grep agrees: EpisodeFeed.tsx:2511 is the only `dir=` in app/ + components/.

3. Deployed CSS. The deploy ships ONE stylesheet, /_next/static/immutable/chunks/1b0rux1xv-mpp.css, 47,932 bytes (raiser said 6 files — wrong, but immaterial). `[dir` → 0. 

---

### D2-007 — No plural rules anywhere: the paywall's episode-count benefit line is grammatically wrong in Russian on 20 of 86 paid series and in Polish on 4 of 86.

*Raised by D2 — Localization. All 20 locales x all  · **touches money or the shipped rail***

**Reproduction.** grep -r 'Intl.PluralRules' over app/ components/ lib/ → zero hits. lib/i18n.ts interpolate() does a flat String() substitution. Resolve every paid live row against MUX_MAP and render paywall.benefitEpisodes: the-mistress-trap (61 eps) → ru "Все 61 серий сразу" (Intl.PluralRules('ru').select(61) = 'one', so it must read "серия"); married-to-a-stranger (62 eps) → pl "Wszystkie 62 odcinków, od razu" (select = 'few', must read "odcinki").

**Evidence.** components/EpisodeFeed.tsx:2537 `t("paywall.benefitEpisodes", { count: totalEpisodes })`; lib/i18n.ts:1195 interpolate(). Russian 'one' counts present in catalog: 41 (my-celebrity-boyfriend-killed-me), 51 (the-blackthornes, the-haunted-sisters, mafia-lords-secret-love, runaway-bride, the-crown, the-inheritance-game), 61 (the-mistress-trap, destined-to-be, the-winter-veil, the-missing-piece, duty-of-desire, faded-threads, good-for-him, honey-gold, im-having-my-professors-baby-es) = 16; 'few' counts 52/54/62 (the-escort, blood-contract, married-to-a-stranger, married-to-my-brothers-ex) = 4. Total ru 20/86, pl 4/86. Arabic escapes because its template avoids the noun-count agreement.

**Independent verification.** REPRODUCED LIVE ON PRODUCTION, not inferred.

Live render (Chrome, www.verzatv.com, localStorage verza-lang set, unentitled/signed-out):
- /series/the-mistress-trap/6 with lang=ru -> paywall bullet reads "Все 61 серий сразу". Header on the same panel reads "EP 6 / 61". Intl.PluralRules('ru').select(61) = 'one', which requires nominative singular "серия"; "серий" is genitive plural.
- /series/married-to-a-stranger/6 with lang=pl -> paywall bullet reads "Wszystkie 62 odcinków, od razu" (screenshot captured). select('pl',62) = 'few', which requires "odcinki". The SAME panel's headline four lines above reads "Odblokuj wszystkie odcinki" (correct form), so the panel contradicts itself in the viewer's own language on the screen asking for a card.
- CONTROL: /series/the-marriage-contract/6 (60 eps) with lang=ru renders "Все 60 серий сразу" — CORRECT. The string was authored for the 60-ep majority case and only breaks where the count is not 'many'. This rules out a blanket-translation misreading.

DEPLOYED BUNDLE, not the build. Pulled every JS chunk referenced by the deployed episode page. /_next/static/immutable/chunks/428d7hhx0m19l.js contains all 20 dictionaries; the two literals ship 

---

### D2-008 — Filipino viewers get English: resolveLocale matches the literal tag "tl", but Chrome and Safari send "fil".

*Raised by D2 — Localization. All 20 locales x all *

**Reproduction.** resolveLocale(['fil-PH']) → null → DEFAULT_LOCALE 'en'. resolveLocale(['tl-PH']) → 'tl'. Chrome's language picker and Safari both emit fil / fil-PH for Filipino; tl is the legacy code. Same class: resolveLocale(['in-ID']) → null (legacy Java code for Indonesian still emitted by some older Android WebViews) while ['id-ID'] → 'id'. Note ICU already treats them as one language — Intl.NumberFormat.supportedLocalesOf(['tl']) canonicalizes to 'fil' — so only this table lookup disagrees.

**Evidence.** lib/i18n.ts:1219-1243 resolveLocale() does `LOCALES.find(l => l.code === primary)` against the table at lib/i18n.ts:11 whose entry is `{ code: "tl", label: "Filipino", native: "Filipino" }`. A complete 115-key Filipino dictionary ships and is unreachable by auto-detection. Manual selection in LangDropdown still works.

**Independent verification.** Reproduced against the deployed bundle. Source: lib/i18n.ts:11 LOCALES has {code:"tl",label:"Filipino"}; resolveLocale (lib/i18n.ts:1219-1227, not -1243 — 1228+ is the languageName doc comment) takes the primary subtag and does LOCALES.find(l => l.code === primary) with no alias table (grep for "fil" across lib/components/app finds no alias). Sole auto-detect call site is components/LangProvider.tsx:84 over navigator.languages. Deployed: fetched https://www.verzatv.com/ and /_next/static/immutable/chunks/428d7hhx0m19l.js, which ships the identical function `function c(e){for(let a of e){if(!a)continue;let e=a.toLowerCase().split(/[-_]/)[0],o=t.find(a=>a.code===e);if(o)return o.code}return null}` and the same 20-row table. Verified the effect by extracting those exact production bytes and running them in node: ["fil-PH"] -> null -> DEFAULT_LOCALE "en"; ["fil-PH","fil","en-US"] -> "en"; ["tl-PH"] -> "tl"; ["in-ID"] -> null -> "en"; ["id-ID"] -> "id". Re-checked the inherited fact rather than trusting it: ICU 77 gives Intl.getCanonicalLocales(['tl-PH','in-ID']) = ['fil-PH','id-ID'], new Intl.Locale('tl').language = 'fil', NumberFormat.supportedLocalesOf(['fil','tl']) = ['fil'] — the s

---

### D2-009 — Traditional-Chinese readers are served Simplified copy; there is no zh-Hant dictionary and no way to ask for one.

*Raised by D2 — Localization. All 20 locales x all *

**Reproduction.** resolveLocale(['zh-Hant-TW']) → 'zh'; ['zh-TW'] → 'zh'; ['zh-HK'] → 'zh'. dictionaries.zh is Simplified (e.g. "发现", "媒体库", "解锁全部剧集"). LangDropdown offers one entry labelled 中文.

**Evidence.** lib/i18n.ts:1236 `const primary = tag.toLowerCase().split(/[-_]/)[0]` deliberately discards the script subtag; the doc comment above it justifies this for es-419/es-MX/es-ES, which is correct, but the same rule silently applies to Han script. Same class, lower stakes: pt is Brazilian ("Você acabou de ver", "neste app") and serves pt-PT.

**Independent verification.** Reproduced against the deployed bundle, not the source.

WHAT I DID
1. Source read. lib/i18n.ts:1219-1227 resolveLocale() lowercases the tag, splits on [-_], takes [0], and does an exact `LOCALES.find(l => l.code === primary)`. No alias/canonicalization table anywhere in the file. LOCALES (lib/i18n.ts:11-32) carries `{ code: "tl", label: "Filipino", native: "Filipino" }` and no "fil". components/LangProvider.tsx:84 feeds `navigator.languages` straight in, unnormalized.

2. Deployed bundle. Fetched https://www.verzatv.com/ (200) and all 14 chunks it loads, deployment dpl_FEduFW6ftQZyapPx28PouXp55wk3. The i18n module is in /_next/static/immutable/chunks/428d7hhx0m19l.js. It contains verbatim:
   function c(e){for(let a of e){if(!a)continue;let e=a.toLowerCase().split(/[-_]/)[0],o=t.find(a=>a.code===e);if(o)return o.code}return null}
   with t = [...,{code:"id",...},{code:"tl",label:"Filipino",native:"Filipino"},{code:"sw",...}], and LangProvider's effect: `let a=e??c(navigator.languages?.length?navigator.languages:[navigator.language].filter(Boolean));a&&"en"!==a&&queueMicrotask(...);document.documentElement.lang=a??"en"`.
   grep for '"fil"' across ALL 14 shipped chunks: zero hits. 

---

### D3-002 — 76 of 96 show pages publish a fabricated three-name "Cast" credit block; 18 entries across 17 series are unmistakably character/role labels, not performers.

*Raised by S3 — SHOW PAGES: all 96 catalog rows (91*

**Reproduction.** Open https://www.verzatv.com/series/rosy-psycho — Cast reads "Rosalind Hart · Detective Kane · Victim #4". https://www.verzatv.com/series/the-unforgettable-love — "David Loren · Hannah Grey · Dr. Miriam Fields". https://www.verzatv.com/series/the-pendleton-secret — "Eloise Pendleton · James Mercer · Lady Pendleton".

**Evidence.** app/series/[slug]/page.tsx:236 renders the literal heading "Cast" over series.cast.join(" · "). lib/series-detail.ts:413 cast: ["Rosalind Hart","Detective Kane","Victim #4"]; :419 ["David Loren","Hannah Grey","Dr. Miriam Fields"]; :431 ["Diana Zhao","Matteo Rios","Board Chair Helen Wu"]; :449 ["Eloise Pendleton","James Mercer","Lady Pendleton"]. Full set of non-actor entries: Victim #4, The Victim, The Other Wife, The Oracle, Board Chair Helen Wu, Lady Pendleton, Dr. Miriam Fields, Officer Pike, Detective Nolan Cross, Captain Harris, Detective Rivera, Agent Cole Walker, Detective Marsh, Professor Vane, Detective James Wren, Judge Harrison, Detective Kane, Detective Grant, Detective Hale. Eve

**Independent verification.** CONFIRMED against both the code and the deployed site. Severity S3 as claimed is correct.

WHAT I DID AND SAW

1. Production HTML. `curl https://www.verzatv.com/shorts` -> HTTP 200, 87,451 bytes. I extracted the `<main>` element verbatim; it is, in full:
   `<main class="flex-1 pb-16"><div style="background:#07070E"><script type="application/ld+json">{...WebSite schema...}</script></div><!--$--><!--/$--></main>`
   Zero occurrences of `episode-immersive`, zero `<video`, zero `ShortsFeed`. The 4 hits for `stream.mux.com` / `image.mux.com` in the document are `<link rel="preconnect">` and `<link rel="dns-prefetch">` from the root layout, not feed content. Stripping scripts/styles/svg/tags, the entire visible text of the server response is 304 characters and is footer + bottom nav only: "en Instagram TikTok X YouTube Facebook Get the app App Store iPhone & iPad Google Play Android Sitemap Become a Creator Support Terms of Service Privacy Policy Refund Policy Help & Support Press About (c) 2026 VERZA TV. All rights reserved. Microdramas, Reality & More. Discover Shorts Shop Library Profile". Matches the raised evidence exactly.

2. The empty render, observed. In Chrome at 414x900 on li

---

### D3-004 — Nine merchandising surfaces route every poster tap to the read-first show page instead of the player, breaking the product's central rule; the feed-integrity check that claims to prevent this only bans the opposite spell

*Raised by D3 — Dead Ends. All 535 interactive elem*

**Reproduction.** Tap any poster on /discover, /channels, /collections/<slug>, /best/<slug>, /genre/<genre>, /discover/<genre>, /guides/<slug>, /compare/<slug> or /watch-in/<slug>. It opens /series/<slug> and the viewer must tap "Watch Episode 1 Free" to start. Tap a poster on / , /search or /genres/<slug> and it plays immediately.

**Evidence.** Counted on production by resolving every href on each page: /discover player=0 showpage=91; /collections/most-binge-worthy 0/53; /best/best-billionaire-romance-microdramas 0/25; /discover/romance 0/46; /channels 0/14; /watch-in/new-york 0/12; /guides/what-is-a-microdrama 0/6; /compare/verza-vs-reelshort 0/6; /genre/revenge 0/4. Correct for comparison: /genres/revenge player=11 showpage=0; /search?q=billionaire player=22 showpage=0. Source: 12 files write the literal — app/page.tsx:55, app/discover/page.tsx:73, app/discover/[genre]/page.tsx:215, app/best/[slug]/page.tsx:199, app/genre/[genre]/page.tsx:301, app/guides/[slug]/page.tsx:144, app/compare/[slug]/page.tsx:143, app/watch-in/[slug]/pa

**Independent verification.** CONFIRMED on production and in source; severity S3 stands.

WHAT I DID
1) Source. Every one of the nine surfaces writes the show-page literal on the title tile and never calls posterHref():
   app/discover/page.tsx:73, app/discover/[genre]/page.tsx:215, app/channels/page.tsx:46,
   app/collections/[slug]/page.tsx:201, app/best/[slug]/page.tsx:199, app/genre/[genre]/page.tsx:301,
   app/guides/[slug]/page.tsx:144, app/compare/[slug]/page.tsx:143, app/watch-in/[slug]/page.tsx:240
   — all `href={`/series/${series.slug}`}`. Seven of the nine wrap a real <Image src={series.posterUrl}> tile.

2) Deployed bundle, not the build. curl'd www.verzatv.com and counted unique hrefs per page, stripping the <noscript> crawler block first. The raiser's numbers reproduce EXACTLY:
   /discover 0 player / 91 showpage; /channels 0/14; /collections/most-binge-worthy 0/53;
   /best/best-billionaire-romance-microdramas 0/25; /discover/romance 0/46; /watch-in/new-york 0/12;
   /guides/what-is-a-microdrama 0/6; /compare/verza-vs-reelshort 0/6; /genre/revenge 0/4.
   Controls behave the opposite way: /genres/revenge 11 player / 0 showpage, /search?q=billionaire 22/0.
   The 91 /discover show-page anchors ar

---

### D3-005 — The iOS purchase-surface hide runs post-mount, so the $1.99 Series Unlock card ships in the server HTML of all 86 paid show pages and is painted before it is removed.

*Raised by S3 — SHOW PAGES: all 96 catalog rows (91 · **touches money or the shipped rail***

**Reproduction.** curl -s 'https://www.verzatv.com/series/the-pendleton-secret?platform=ios' -H 'User-Agent: ...VerzaTV-iOS...' | grep -c 'Series Unlock' → 1. grep '\$1\.99' → present. The markup contains the price card regardless of platform signal; only a client effect after hydration removes it.

**Evidence.** components/HideInIOSApp.tsx: "Detection runs post-mount so server HTML stays identical for both" — useState(false) + useEffect → queueMicrotask(() => setHidden(true)). lib/platform.ts isIOSApp() returns false during SSR (typeof window === 'undefined'). AGENTS.md rule 11: "The iOS binary excludes ... Stripe, and web purchase steering." Verified against production, deployment dpl_7L9CxaoUDHn95y2P125xTMAVAWAj.

**Independent verification.** REPRODUCED — three independent layers (source, deployed bundle, live runtime on www.verzatv.com).

1) SOURCE (/Users/jothamhall/E! CREATOR ECONOMY/verza-tv). Every cited line is accurate. components/ShortsFeed.tsx:163 `const [muted, setMuted] = useState(false);` — no lazy initializer, no read of the key. The only `verza-muted` reference in the whole file is the WRITE at :141 (`onClick={() => { const next = !muted; setMuted(next); localStorage.setItem("verza-muted", String(next)); }}`). doPlay() (:276-283) is `vid.muted = true; vid.play().then(() => { if (!cancelled && !mutedRef.current) { vid.muted = false; ... } })`, and mutedRef mirrors that always-false state (:183-184). Correction to the raiser's evidence: there are THREE other players that read the key, not two — EpisodeFeed.tsx:1444, HorizontalFeed.tsx:52, and Player.tsx:452 (`localStorage.getItem("verza-muted") !== "false"`, i.e. default muted). ShortsFeed is the only one of four that writes without reading.

2) DEPLOYED BUNDLE (rule 4). Fetched https://www.verzatv.com/shorts (HTTP 200) and downloaded its 13 chunks. /_next/static/immutable/chunks/3ayar9q08rsc0.js is the shorts chunk: it contains `[m,g]=(0,r.useState)(!1)` fo

---

### D3-005 — On the Reality tab, four of the five poster surfaces are inert: the full-width 320x480 hero and three of the four grid tiles. They are pixel-identical in treatment to the one tile that does play.

*Raised by D3 — Dead Ends. All 535 interactive elem*

**Reproduction.** Open https://www.verzatv.com/ and tap REALITY. Tap the large hero poster at the top — nothing happens. Tap Sugar Babies, Buy/Sell Miami or The Vertical Tea in the 2x2 grid — nothing happens. Only Storage Pirates navigates.

**Evidence.** Live DOM on production: the 320x480 hero <img alt="The Vertical Tea"> has no ancestor <a> and no ancestor <button> (href:null, btn:false). Three 180x270 grid tiles (Sugar Babies, Buy/Sell Miami, The Vertical Tea) sit inside <div aria-disabled="true"> with no href; Storage Pirates sits inside <a href="/series/storage-pirates/1"> (200). Verified in the deployed bundle, not the working tree: chunk 1aseb4gggkekc.js contains `...:(0,t.jsx)("div",{className:"block min-w-0","aria-disabled":"true",children:a},e.title)` as the else-arm of the playable ternary, and the same chunk carries all four poster titles. Source: components/BrowsePage.tsx:873 gates on `(MUX_MAP[show.slug]?.length ?? 0) > 0`; onl

**Independent verification.** Reproduced on live production, not the working tree.

DEPLOYED BUNDLE: https://www.verzatv.com/_next/static/immutable/chunks/1aseb4gggkekc.js (200, 44,827 B — still the live chunk the raiser named). Reality hero = ("div",{className:"relative"}) -> ("div",{className:"relative mx-auto overflow-hidden rounded-xl",style:{aspectRatio:"2 / 3",maxWidth:"min(320px, 80vw)"}}) -> Image. No Link, no button, no onClick. Grid computes r=(S.MUX_MAP[e.slug]?.length??0)>0 and returns r ? Link(posterHref(slug)) : ("div",{className:"block min-w-0","aria-disabled":"true"}) with the IDENTICAL card fragment in both branches. The chunk contains exactly one "aria-disabled" and it is this one. Source match: components/BrowsePage.tsx:831-915.

LIVE DOM at /?tab=reality — 5 poster surfaces >100px:
- hero "The Vertical Tea" 320x480: href NONE, btn false, cursor auto, opacity 1, filter none. Full ancestor chain to <main> (IMG.object-cover / DIV.relative mx-auto / DIV.relative / DIV / DIV.tab-slide-inner / DIV.tab-slide / DIV / MAIN) has no <a>, <button>, onclick, or role.
- Sugar Babies 180x270: href NONE, aria-disabled=true, cursor auto, opacity 1, filter none
- Buy/Sell Miami 180x270: same
- The Vertical Te

---

### D3-006 — Arriving on a ?tab= deep link leaves the tab strip scrolled to the far left with no tab highlighted, so the viewer cannot tell which section they are in. This is the exact URL the episode Back button navigates to.

*Raised by D3 — Dead Ends. All 535 interactive elem*

**Reproduction.** Open https://www.verzatv.com/?tab=red-carpet (what EpisodeFeed's Back button sets for a red-carpet episode) or /?tab=music. The correct content renders — "THE CARPET" with Exes Premiere and Love Awards — but the tab strip still shows DRAMA / HOT / ANIME / ESPAÑ with none of them highlighted, and RED CARPET is off-screen to the right. Nothing tells the viewer where they are, and DRAMA (leftmost, and normally the highlighted one) now looks unselected too.

**Evidence.** Measured on production at /?tab=music with innerWidth 606: the MUSIC button sits at viewport x=1019 — entirely off-screen — while its overflow-x:auto scroller reports scrollLeft 11.5 of a possible 606 (scrollWidth 1000, clientWidth 394). No tab has a non-default colour or font-weight: all nine report color rgb(245,244,248) / weight 400, and the only element on the page with a non-400 weight is the SITEMAP button. Screenshot of /?tab=red-carpet saved to /var/folders/5f/lcnb7zy54sj33350s8qbkrwr0000gn/T/claude-chrome-screenshots-bdOAz5/screenshot-1788038023240-42.jpg shows the content rendered with no tab selected. The mount effect at components/BrowsePage.tsx:413-426 applies the tab from the q

**Independent verification.** CONFIRMED on live production (deployment dpl_FEduFW6ftQZyapPx28PouXp55wk3), with the root cause isolated. The centring code SHIPPED but has no effect — the classic "verify the effect, not the assignment" trap.

WHAT I DID AND SAW
1. Loaded https://www.verzatv.com/?tab=red-carpet in Chrome, foreground tab, innerWidth 606 (rail clientWidth 394, i.e. phone-frame width). Waited for settle, then measured the rail [aria-label="Categories"]:
   scrollLeft 5.5 of maxScroll 606; rail viewport x 106..500; active tab RED CARPET at x 893..1005 — 393px past the right edge, entirely off-screen. Labels actually visible: DRAMA, HOT, TUBI, ANIME, ESPAÑOL — none of them highlighted. Content below was correct ("THE CARPET"). Screenshot matches: strip reads DRAMA HOT [tubi] ANIME ESPAÑ, all grey.
2. Same at /?tab=music: MUSIC active at x 1025..1085, scrollLeft 5.5, off-screen. Reproduces on both deep links named in the repro.
3. Confirmed the Back-button link is exactly this URL: https://www.verzatv.com/series/exes-premiere/1 ships <a href="/?tab=red-carpet"> and the flight data carries "backHref":"/?tab=red-carpet".
4. NOT limited to deep links. On a clean https://www.verzatv.com/ I clicked ESPAÑOL (

---

### D3-007 — <html lang> never describes the page's content language. All 96 pages ship lang="en" from the server, including 6 whose entire body copy is Spanish; after hydration lang is set to the UI locale, so it can also read lang=

*Raised by S3 — SHOW PAGES: all 96 catalog rows (91*

**Reproduction.** curl https://www.verzatv.com/series/sentence-of-passion-es | grep -o '<html[^>]*>' → lang="en", on a page whose h1 is "Sentencia de pasión", genre badge "Drama · Pasión", logline and description entirely Spanish, and meta description Spanish. Conversely with verza-lang='es' on /series/the-pendleton-secret the DOM reports htmlLang 'es' over wholly English copy.

**Evidence.** Server HTML for all 96: <html data-dpl-id="dpl_7L9CxaoUDHn95y2P125xTMAVAWAj" lang="en">. components/ContentTranslator.tsx sets document.documentElement.lang = locale (UI locale) on mount; components/LangProvider.tsx does the same on switch. Affected Spanish rows: sentence-of-passion-es, i-cheated-on-my-wedding-night-es, i-fell-in-love-with-my-presidential-brother-in-law-es, the-goat-mistress-es, im-having-my-professors-baby-es, i-cant-resist-my-mansion-gardener. The JSON-LD on those pages already carries the correct inLanguage "es", so the correct value is computed and simply not applied to <html lang>.

**Independent verification.** CONFIRMED — every claim reproduced, in source and in the DEPLOYED production bundle. Severity S3 stands.

WHAT I DID / SAW

1) Orphan on the web. Repo-wide grep (excluding node_modules/.next/docs) for "/horizontal" in /Users/jothamhall/E! CREATOR ECONOMY/verza-tv returns exactly ONE hit outside docs: app/horizontal/page.tsx:11 `alternates: { canonical: "/horizontal" }`. No href, no router.push, no <Link>. components/HorizontalFeed.tsx is imported only by app/horizontal/page.tsx. Then against production: fetched /, /discover, /library, /shorts, /help, /about, /search, /channels, /sitemap, /series/storage-pirates, /series/storage-pirates/1, /me, /shop, /press — `href="/horizontal"` count = 0 on all 14. The Reality tile on the live home page points at href="/series/storage-pirates".

2) Sitemap. Not in the static list in app/sitemaps/pages.xml/route.ts (lines 8-20) and not in lib/data/sitemap.ts (grep exit 1). On production, all four sitemaps fetched — shows.xml, episodes.xml, genres.xml, pages.xml (170 <loc> entries) — zero "horizontal" hits. Yet the page itself is 200, x-nextjs-prerender: 1, and serves `<meta name="robots" content="index, follow">` with a self-canonical: publicly in

---

### D3-007 — On /sign-in and /sign-up, "Back" and "Continue as Guest" hard-code href="/" and discard the ?next= return path, so a viewer who reached sign-in from the paywall and backs out is dumped on the homepage and loses their pla

*Raised by D3 — Dead Ends. All 535 interactive elem · **touches money or the shipped rail***

**Reproduction.** 1. Open https://www.verzatv.com/series/the-mistress-trap/6 (the first paid episode). 2. Tap "Series Unlock — $1.99 one-time". You land on /sign-in?next=%2Fseries%2Fthe-mistress-trap%2F6. 3. Tap "Back" or "Continue as Guest". Both go to / . The episode you were 6 episodes into is gone.

**Evidence.** Live DOM on /sign-in?next=%2Fseries%2Fthe-mistress-trap%2F6: Back -> "/" (keepsNext false); Continue as Guest -> "/" (keepsNext false); Sign Up -> "/sign-up?next=%2Fseries%2Fthe-mistress-trap%2F6" (keepsNext true); Forgot password? -> "/forgot-password" (drops it, defensible). Source: app/sign-in/page.tsx:58 and :169, app/sign-up/page.tsx:41 and :191 — four literal href="/" against app/sign-in/page.tsx:161 which correctly builds `/sign-up${next ? \`?next=${encodeURIComponent(next)}\` : ""}`. Also measured: those two links are 352x20 and 122x20 CSS px — under the 44px thumb minimum.

**Independent verification.** Reproduced against the deployed site, not the build.

1) The repro path is real in the shipped bundle. lib/catalog.ts:100-109 confirms `the-mistress-trap` is status "live", episodeCount 48, freeEpisodes 5 — so /series/the-mistress-trap/6 is the first paid episode and is the paywall slide (both /5 and /6 return HTTP 200 live). components/EpisodeFeed.tsx:2569 shows the "$1.99 one-time" unlock button calls `requireCheckoutUser()` with no returnTo. I downloaded all 16 JS chunks referenced by the live episode-6 HTML and found the minified redirect verbatim in two of them (ch/0oo5zhjmwzr5q.js, ch/0fkfn44ctjja6.js): ``window.location.assign(`/sign-in?next=${encodeURIComponent(o)}`)`` with `o` defaulting to `${location.pathname}${location.search}`. So a signed-out tap on the paywall does land on /sign-in?next=%2Fseries%2Fthe-mistress-trap%2F6.

2) The defect itself, from the live DOM. `curl https://www.verzatv.com/sign-in?next=%2Fseries%2Fthe-mistress-trap%2F6`, anchors extracted:
   Back -> "/"                                          (next discarded)
   Continue as Guest -> "/"                              (next discarded)
   Sign Up -> "/sign-up?next=%2Fseries%2Fthe-mistress-trap%2F6"  

---

### D3-008 — /me renders a "Sign Out" button to a signed-out visitor, on the same screen that says "Guest — Sign in to sync your library and purchases" and offers a "Sign In" button. Tapping it silently ejects the guest to the homepa

*Raised by D3 — Dead Ends. All 535 interactive elem*

**Reproduction.** Open https://www.verzatv.com/me signed out. The header shows "Guest / Sign in to sync your library and purchases" and a "Sign In" link; scroll to the bottom and a full-width "Sign Out" button is there too. Tap it: the page navigates to / with no explanation.

**Evidence.** Live, signed out: body text before the tap reads "EN Guest Sign in to sync your library and purchases Sign In Start Watching..."; after the tap location.pathname is "/" and the button is gone. Source: app/me/page.tsx:425 renders <SignOutButton /> with no user guard, while the very next line (:426) passes <DeleteAccountButton expectedUserId={user?.id ?? null} /> — and components/ProfileDynamic.tsx:159 has `if (!expectedUserId) return null;`, which is exactly the guard SignOutButton (components/ProfileDynamic.tsx:195) lacks. The delete button correctly does not render for a guest; I confirmed it absent from the live /me element list.

**Independent verification.** Reproduced in the DEPLOYED bundle, not just source. Fetched https://www.verzatv.com/sign-in?next=%2Fseries%2Fthe-mistress-trap%2F6 (HTTP 200) and parsed the live anchors: Back -> `<a class="inline-flex items-center gap-1.5 text-sm mb-8" style="color:#6B6B7B" href="/">…Back</a>`, Continue as Guest -> `href="/"`, while Sign Up -> `href="/sign-up?next=%2Fseries%2Fthe-mistress-trap%2F6"`. Same asymmetry on the live /sign-up?next=…: Back -> "/", Continue as Guest -> "/", Sign In -> "/sign-in?next=%2Fseries%2Fthe-mistress-trap%2F6". No runtime interception: the Back control is a plain server-rendered <a> with no onClick, and "router.back" appears nowhere in the page payload.

Repro premise verified against real data, not string matching. lib/catalog.ts:100-109 has the-mistress-trap ("The Escort They Framed") status live, episodeCount 48, freeEpisodes 5, so /series/the-mistress-trap/6 is genuinely the first PAID episode (curl 200). The handoff is real too: the paywall's unlock button at components/EpisodeFeed.tsx:2569 calls requireCheckoutUser() with no argument, and lib/checkout-auth.ts:20-26 builds next from window.location.pathname+search and does window.location.assign(`/sign-in?next=

---

### D3-009 — The Amazon bag's "Send N items to Amazon cart" handoff lands on Amazon's sign-in wall, not on a cart containing the items, for any viewer not already signed in to Amazon in that browser — while the surface above it promi

*Raised by D3 — Dead Ends. All 535 interactive elem · **touches money or the shipped rail***

**Reproduction.** 1. Open https://www.verzatv.com/amazon. 2. Tap any product tile, then "Add to bag". 3. The bag drawer opens: "Your bag (1) ... Send 1 item to Amazon cart". 4. Tap it. In a browser with no Amazon session you land on "Sign in or create account" at amazon.com/ap/signin, with no mention of the item you assembled.

**Evidence.** Verified in a real Chrome tab, not only by curl. The button's href is https://www.amazon.com/gp/aws/cart/add.html with params AssociateTag, ASIN.1, Quantity.1 (built by lib/amazon-sponsors.ts:139-146). Navigating there resolves through two redirects to https://www.amazon.com/ap/signin?...openid.assoc_handle=amzn_associates_add_to_cart_us&openid.return_to=https%3A%2F%2Fwww.amazon.com%2Fassociates%2Faddtocart%3F... and renders Amazon's "Sign in or create account" page; screenshot saved to /var/folders/5f/lcnb7zy54sj33350s8qbkrwr0000gn/T/claude-chrome-screenshots-bdOAz5/screenshot-1788038745261-44.jpg. Same result by curl with an iPhone UA (2 redirects, final title "Amazon Sign-In"). Honest cav

**Independent verification.** Reproduced end-to-end against production (deployment dpl_FEduFW6ftQZyapPx28PouXp55wk3), not the local build.

1) Rendered state, signed out. `curl` of https://www.verzatv.com/me with no cookies returns HTTP 200 and both controls in the same document:
   - header at byte ~7180: `<h1 ...>Guest</h1><p ...>Sign in to sync your library and purchases</p><a ... href="/sign-in">Sign In</a>`
   - bottom at byte ~20848: `<button class="w-full py-3 rounded-xl ...">...Sign Out</button>` immediately followed by `VERZA TV v1.0.0`.
   No `Delete Account` anywhere in the signed-out HTML — so the sibling control on the very next source line IS guarded, and Sign Out is not. No `hidden`/`display:none`/null-return wrapper near the button.

2) Deployed bundle, not the source. /_next/static/immutable/chunks/0fkfn44ctjja6.js contains the shipped SignOutButton: `"SignOutButton",0,function(){let[e,i]=useState(!1),a=useRouter();return jsxs("button",{onClick:async()=>{i(!0);try{await o()}catch{...a.push("/")}}...,children:[svg, e?"Signing out...":"Sign Out"]})}` — no early return, no user prop. So the button is unconditionally interactive after hydration too.

3) Verified the EFFECT, not the assignment. Extr

---

### D3-010 — The Like button on /shorts changes to "Liked" and stores nothing — no localStorage write, no network call — while the identical Like button in the main episode feed persists. A like on Shorts is gone on reload.

*Raised by D3 — Dead Ends. All 535 interactive elem*

**Reproduction.** Open https://www.verzatv.com/shorts, tap Like (the label becomes "Liked"), reload. It is unliked again. Tap "List" on the same rail and reload: still saved.

**Evidence.** Measured on production. Before the Like tap the verza-* localStorage keys were [verza-liked-the-mistress-trap, verza_anon_id]; after the tap they were identical — no key added, no value changed. Tapping "List" immediately afterwards added verza-saved = ["faded-threads"], proving the measurement was sensitive. Source: components/ShortsFeed.tsx:65 `const [liked, setLiked] = useState(false)` and :122 `onClick={() => setLiked(l => !l)}` — pure ephemeral state, versus components/EpisodeFeed.tsx:1994-2008 where toggleLike() calls persistLiked() which writes `verza-liked-${seriesSlug}` (components/EpisodeFeed.tsx:1908).

**Independent verification.** Reproduced at the HTTP layer against live production and live Amazon.

1) Promise is live: curl of https://www.verzatv.com/amazon returns "Add anything you like without leaving Verza TV. When you are done, one tap sends your whole bag to your Amazon cart." (app/amazon/page.tsx:63-64). The same claim also ships on /shop (app/shop/page.tsx:164).

2) Verified in the DEPLOYED bundle, not the build: https://www.verzatv.com/_next/static/immutable/chunks/21y4skb0tansy.js contains the minified builder — `new URLSearchParams({AssociateTag:"verzatv-20"}) ... `https://www.amazon.com/gp/aws/cart/add.html?${t.toString()}`` — matching lib/amazon-sponsors.ts:139-146.

3) Verified the EFFECT with a real assembled URL from a real catalog row (medicube, ASIN B09V7Z4TJG): GET https://www.amazon.com/gp/aws/cart/add.html?AssociateTag=verzatv-20&ASIN.1=B09V7Z4TJG&Quantity.1=1 from a cookie-less client with a desktop Chrome UA returns HTTP/2 302 -> https://www.amazon.com/ap/signin?...openid.assoc_handle=amzn_associates_add_to_cart_us&openid.return_to=https%3A%2F%2Fwww.amazon.com%2Fassociates%2Faddtocart%3FAssociateTag%3Dverzatv-20%26ASIN.1%3DB09V7Z4TJG%26Quantity.1%3D1. The landed page renders <h1>Sign i

---

### D3-014 — 16 of 96 pages render no year in the published-metadata row, so the line collapses to a lone "VERZA Originals" while 80 pages show "2025 · VERZA Originals".

*Raised by S3 — SHOW PAGES: all 96 catalog rows (91*

**Reproduction.** Compare the metadata line on https://www.verzatv.com/series/reset ("VERZA Originals" only) with https://www.verzatv.com/series/the-mistress-trap ("2025  VERZA Originals").

**Evidence.** Parsed from production HTML: 76 rows render [year, channel], 4 render [2026, channel], 16 render [channel] only — storage-pirates, too-much-junk, exes-premiere, love-awards, im-having-my-professors-baby-es, falling-for-flatmate, dil-dosa-dosti, salt-and-pepper, love-for-sale, the-breakup-podcast, reset, and the 5 coming-soon rows. Cause: no SERIES_DETAIL entry, so series.year is undefined and app/series/[slug]/page.tsx:210 renders only the channel half.

**Independent verification.** CONFIRMED — the card is inert. Severity corrected S2 → S3, because one load-bearing claim in the repro is false: the show page DOES contain a working route to the purchase surface.

WHAT I DID

1. Source. /Users/jothamhall/E! CREATOR ECONOMY/verza-tv/app/series/[slug]/page.tsx lines 326-364. The block is `{isPurchasable && <HideInIOSApp><div className="rounded-xl p-[1px] mb-6">…<div className="rounded-[11px] p-4">…<p>Series Unlock</p><p>All {episodeCount} episodes · one-time purchase</p><span>$1.99</span>`. Plain nested divs, no <a>, no <button>, no onClick, no role/tabindex. It is a server component, so nothing can attach a handler; /Users/jothamhall/E! CREATOR ECONOMY/verza-tv/components/HideInIOSApp.tsx is a pass-through client wrapper (`return <>{children}</>`) that adds no element and no handler.

2. Deployed bundle (rule 4). curl https://www.verzatv.com/series/the-pendleton-secret. The served HTML has the three bare divs, and the RSC Flight payload row 36 is `["$","$L23",null,{"children":["$","div",null,{"className":"rounded-xl p-[1px] mb-6"…` — the HideInIOSApp boundary wrapping plain divs with children only. No client component and no handler in the payload.

3. Live browse

---

### D3-015 — Several tap targets on every show page fall below the 44×44 minimum: header controls 36×36, the next-episode chevron 39×39, the Play CTA 43px tall, the coming-soon "Browse VERZA" button 35px tall.

*Raised by S3 — SHOW PAGES: all 96 catalog rows (91*

**Reproduction.** Load any show page and measure getBoundingClientRect on the header buttons and the chevron link.

**Evidence.** Measured in the deployed DOM at both a 606px viewport and with .app-shell constrained to 320px: header language button 36×36 and search button 36×36 (class w-9 h-9); next-episode chevron <a href="/series/<slug>/2"> 39×39 (class w-10 h-10); Play CTA 212×43 (px-6 py-3); episode-picker button 227×41 at 606px, 155×60 at 320px; "Browse VERZA" on coming-soon pages 124×35. Bottom-nav items 74×41.

**Independent verification.** Reproduced against production and against the code. Severity S3 is correct; left unchanged.

WHAT I DID (production, real browser, own tab, cleaned up after)
1. Own Chrome tab on https://www.verzatv.com, localStorage.setItem('verza-lang','es'), reloaded /series/the-pendleton-secret, waited 2.5s for hydration, read document.body.innerText.
   Saw: htmlLang "es"; header pill "ES"; audio badge correctly "Audio en inglés"; then, English on the same viewport — "60 episodes | Cast | First 5 Episodes FREE | Watch Episode 1 Free | Series Unlock | All 60 episodes · one-time purchase | $1.99 | EP 1 | of 60 | All Episodes". Matches the reported repro token for token.
2. Ruled out anything Spanish-specific: same tab, verza-lang='ja', reload. htmlLang "ja", audio badge "英語音声" (translated), every string in (1) still English. The mechanism is locale-independent, so the "19 of 20 locales" scope holds.
3. Exercised the coming-soon branch, which the repro did not: /series/the-chairmans-revenge at locale es rendered "Episodes announced soon | Audio en hindi | Coming Soon | Episodes are on the way | The footage for this title hasn't landed yet… | Browse VERZA" — all English — directly above a bottom n

---

### D3-015 — /genre/<x> and /genres/<x> are two live URL families for the same genre with different tap behaviour; the /genre/ family is published in the XML sitemap but linked from nowhere inside the product, and only some of its sl

*Raised by D3 — Dead Ends. All 535 interactive elem*

**Reproduction.** Compare https://www.verzatv.com/genre/revenge (posters -> show pages) with https://www.verzatv.com/genres/revenge (posters -> player). Then try https://www.verzatv.com/genre/mafia-romance -> 404, while /genres/mafia-romance is a real hub.

**Evidence.** Measured on production: /genre/revenge player=0 showpage=4; /genres/revenge player=11 showpage=0. /genre/mafia-romance and /genre/anime both 404. /sitemaps/genres.xml publishes 8 /genre/* URLs (romance, thriller, drama, comedy, mystery, billionaire, revenge, forbidden) alongside 28 /genres/* URLs. Zero of the 485 pages crawled contain an href to /genre/<x>, so the family is search-reachable only. app/genre/[genre]/page.tsx:301 is one of the nine surfaces in D3-004.

**Independent verification.** Reproduced on the live deployed site (www.verzatv.com), not the build. Every number the raiser gave came back within rounding.

MEASURED VIA getBoundingClientRect IN THE DEPLOYED DOM:
- /sign-in: Back 352x20, Forgot password? 101.5x16, Continue as Guest 121.6x20, Sign Up 52.7x17. (Raiser said 352x20 / 101x16 / 122x20.) computedStyle padding on all four = 0px, so the rect IS the hit area.
- Footer socials, present on every page: Instagram, TikTok, X, YouTube, Facebook each exactly 18x18, padding 0px. The label span's computed display is "none" at viewport 606 (Tailwind sm = 640), so the anchor shrink-wraps the bare 18px SVG. Centre-to-centre spacing is 34px (gap-4), i.e. five distinct external destinations 34px apart — a fat-finger probe 10px and 17px right of the Instagram centre still lands inside the icon cluster, so a mis-tap opens the wrong social network in a new tab.
- /me/list Remove control: seeded localStorage["verza-saved"] with two real catalog slugs (the-mistress-trap, collateral-hearts), reloaded, and both rows rendered. Both Remove buttons measured 55.5x16 (raiser said 56x16), padding 0px, and document.elementFromPoint at each centre returned the button itself (hitIsS

---

### D3-016 — The layout preconnects and dns-prefetches https://litix.io, which is NXDOMAIN. The real Mux Data endpoints are subdomains, so both hints are no-ops that read as if the analytics connection is being warmed.

*Raised by D3 — Dead Ends. All 535 interactive elem*

**Reproduction.** dig +short @8.8.8.8 litix.io -> empty (NXDOMAIN). dig +short @8.8.8.8 inferred.litix.io -> dsolp.litix.io. curl https://litix.io/ -> HTTP 000, could not resolve.

**Evidence.** app/layout.tsx:112 `<link rel="preconnect" href="https://litix.io" crossOrigin="anonymous" />` and :115 `<link rel="dns-prefetch" href="https://litix.io" />`. The two neighbouring hints on lines 110-111 and 113-114 (stream.mux.com, image.mux.com) do resolve and were confirmed serving: https://stream.mux.com/BbnqVaxO3wZAy02p00AZ9B3Oa97OZIoRCJgJUwtA2Ggi8.m3u8 -> 200 application/x-mpegURL, and the matching image.mux.com thumbnail -> 200 image/jpeg.

**Independent verification.** Reproduced on production 2026-08-29. /genre/revenge returns 200 with 4 poster anchors all pointing at href="/series/<slug>" (show page); /genres/revenge returns 200 with 11 poster anchors all pointing at href="/series/<slug>/1" (player) — matching the raiser's player=0/showpage=4 vs player=11/showpage=0 exactly. /genre/mafia-romance 404 while /genres/mafia-romance 200. Both families are self-canonical and index,follow, robots.txt disallows nothing, and next.config has no redirect covering them (only trailing-slash + two typo slugs), so both are fully crawlable near-duplicates for romance, thriller, mystery, revenge.

Orphan claim holds: /, /discover, /sitemap, /genres, /help, /about, /library carry 0 hrefs to /genre/ (the HTML sitemap carries 36 and /genres carries 27 to /genres/). Repo grep confirms the only in-product link to /genre/<x> is app/genre/[genre]/page.tsx line 363 linking to its own 7 siblings, so the family is search-reachable only.

Root cause, which the finding missed and which is the strongest part: commit 83c29d1 "Restore instant play on a poster tap" converted 12 surfaces to posterHref(), including app/genres/[slug]/page.tsx, and touched app/genre/ zero times (gi

---

### D3-019 — The episode picker wraps to two lines at a 320px content width, growing from 41px to 60px tall.

*Raised by S3 — SHOW PAGES: all 96 catalog rows (91*

**Reproduction.** Constrain .app-shell to 320px on /series/the-pendleton-secret; the button reading "EP 1 of 60 … All Episodes ⌄" reflows from one line to two.

**Evidence.** Measured in the deployed DOM: button 227×41 at 606px content width, 155×60 at 320px. No clipping (scrollWidth === clientWidth) and no page-level horizontal overflow at 320px, so this is cosmetic only.

**Independent verification.** CONFIRMED — reproduced in the source, in the deployed production HTML, and live in the browser, plus a negative control proving the gate is blind to it. Severity corrected S2 -> S3, and two of the finding's supporting claims are wrong.

WHAT I DID AND SAW

1. Source. /Users/jothamhall/E! CREATOR ECONOMY/verza-tv/app/series/[slug]/page.tsx:359 is the bare literal `$1.99` inside the Series Unlock card. The file is a server component (no "use client"; generateStaticParams at line 28), so the string is baked at build. `grep -rn "lib/price"` over the repo returns exactly four files: components/EpisodeFeed.tsx, components/LangProvider.tsx, and two references inside scripts/test-feed-integrity.mjs. The show page is not among them.

2. Deployed bundle (rule 4). `curl https://www.verzatv.com/series/the-pendleton-secret` -> HTTP 200, and the served HTML contains `...one-time purchase</p></div><span class="text-base font-bold ..." style="color:#E0115F">$1.99</span>`. The literal is in the static markup and in the RSC payload; nothing client-side can rewrite it.

3. Live browser, exact repro given. Set localStorage 'verza-lang' = 'es', reloaded https://www.verzatv.com/series/the-pendleton-secr

---

### D4-004 — The entire 519-row public Mux map (156,628 B raw / 37,569 B brotli) and the full 96-row catalog (108,781 B raw / 32,290 B brotli) are in the client bundle of EVERY route — /about, /shop, /me included — because lib/catalo

*Raised by D4 — Performance and memory. Rendition c*

**Reproduction.** curl -s https://www.verzatv.com/about | grep -o '_next/static/immutable/chunks/[a-z0-9_.-]*\.js' — the list contains 29mb6gc-29b3o.js (519 occurrences of 'playbackId') and 428d7hhx0m19l.js (the catalog, 20 occurrences of 'synopsis'). Same for /, /shop, /shorts, /me and /series/<slug>/1.

**Evidence.** lib/catalog.ts:5 `import { MUX_MAP } from "./mux-public-map";` and the only use is lib/catalog.ts:1275 `const streams = MUX_MAP[s.slug]?.length;` — 96 array lengths. Client importers of @/lib/catalog: BrowsePage, CategoryTabs, SearchBar, SearchButton, FeedSearch, HeroCarousel, LibraryPage, AccountLists, PurchaseHistoryList, SeriesInfoButton, SeriesInfoDrawer, Player, ShortsFeed (13). components/PlayNowLink.tsx:12-18 documents the opposite intent ('Resolved server-side so the 4,900-row public Mux map stays out of this page's client bundle') — that is true of PlayNowLink itself and false of the shipped bundle. Chunk 29mb6gc-29b3o.js was confirmed present on 7 of 7 routes probed.

**Independent verification.** CONFIRMED against the deployed bundle on www.verzatv.com, with one correction to the raiser's evidence (wrong chunk id / wrong size for the catalog half).

WHAT I DID AND SAW

1. Chunk lists per route (fetched live HTML, extracted every `_next/static/.../*.js`). Both suspect chunks appear on `/`, `/about`, `/shop`, `/me`, `/shorts` — identical hashes, so it is one shared chunk on every route. They are real eager script tags, not prefetch hints:
   `<script src="/_next/static/immutable/chunks/29mb6gc-29b3o.js" async="" crossorigin="">` is present in `/about`'s HTML, same for `12o29nrz06ckg.js`.

2. Contents verified by download, not by name:
   - `29mb6gc-29b3o.js` — 156,628 B raw / 37,569 B brotli. Contains exactly 519 occurrences of `playbackId`; head of file is `let e={"the-mistress-trap":[{episode:1,playbackId:"BbnqVaxO3wZ...",duration:137},...`. This IS the full public MUX_MAP. Raiser's numbers exact.
   - CORRECTION: the raiser named `428d7hhx0m19l.js` (108,781 / 32,290) as "the catalog". It is not. That chunk is the i18n translation dictionary plus analytics — its 20 `synopsis` hits are `"content.synopsis":"Synopsis"`, `"Sinopsis"`, `"Sinopse"`, etc. across 20 locales. Zero c

---

### D5-009 — Migration 016 re-grants column-level UPDATE on public.creators to `authenticated` on a stated premise that is false — its comment says the 005 owner-update policy 'remains in force', but migration 011 dropped that policy

*Raised by D5 — Security. Every security-relevant s · **touches money or the shipped rail***

**Reproduction.** Read supabase/migrations/016_creator_section_buildout.sql lines 96-124 alongside supabase/migrations/011_rls_least_privilege.sql line 41.

**Evidence.** 016 lines 97-99: 'RLS — posture unchanged: `creators` is OWNER + service-role(admin) only. ... The existing 005 policies "Creators read own profile" / "Creators update own profile" remain in force.' 011 line 41: `drop policy if exists "Creators update own profile" on public.creators;`. 011 line 42-43 also revoked all and granted only SELECT. 016 lines 114-124 then `revoke update ... from anon, authenticated` and `grant update (handle, display_name, ..., current_step) on public.creators to authenticated`. The columns 016 deliberately withholds (status, published, payout_split, payout_email, payouts_enabled, stripe_account_id, reviewer_notes, submitted_at, reviewed_at, rejection_reason) are th

**Independent verification.** Every factual assertion in the finding reproduces at the exact cited lines.

WHAT I DID AND SAW (source, since the live DB is unreachable — see below):

1. False premise, verified. `supabase/migrations/016_creator_section_buildout.sql:97-99` reads: 'The existing 005 policies "Creators read own profile" / "Creators update own profile" remain in force.' Half of that is false. `011_rls_least_privilege.sql:41` is exactly `drop policy if exists "Creators update own profile" on public.creators;`. 011 did NOT drop the read policy, so the wrong half is precisely the one 016's rationale depends on.

2. A second false premise the finding did not name. `016:101-107` argues it is closing a hole created by "the default table-level UPDATE grant". `011:42-43` had already done `revoke all on table public.creators from anon, authenticated;` / `grant select on table public.creators to authenticated;` — there was no table-level UPDATE grant left to revoke. 016's whole "3b. Column-level WRITE hardening" block is written against the pre-011 world.

3. Net effect is a widening sold as a hardening. `016:114` (`revoke update ... from anon, authenticated`) is a no-op against 011's state; `016:115-124` then

---

### D6-003 — The episode player cannot be operated from a keyboard: play/pause is an onClick on a bare <div> with no role, tabindex or key handler, and the feed's scroll container has no tabindex or role. The measured tab order on an

*Raised by D6 — Accessibility. The accessibility pr*

**Reproduction.** 1. Open https://www.verzatv.com/series/the-mistress-trap/1. 2. Press Tab repeatedly and record document.activeElement. The full cycle is: Back -> Unmute -> Fullscreen -> Like -> Save to My List -> Share -> More options -> the scroll DIV. 3. Press Space or Enter at any point — the video never pauses. 4. There is no visible or focusable play/pause button at any time.

**Evidence.** Measured tab order on the deployed player at 320px: ["Tab -> BODY","Tab -> A:Back","Tab -> BUTTON:Unmute","Tab -> BUTTON:Fullscreen","Tab -> BUTTON:Like","Tab -> BUTTON:Save to My List","Tab -> BUTTON:Share","Tab -> BUTTON:More options"], then activeElement = DIV.no-scrollbar. Source: components/EpisodeFeed.tsx:1049 `onClick={handleTap}` on `<div className="relative w-full select-none overflow-hidden">` — no role, no tabIndex, no onKeyDown. components/EpisodeFeed.tsx:2065 scroll container `ref={containerRef} className="no-scrollbar"` with overflowY:auto and no tabIndex/role/aria-label. grep for onKeyDown/ArrowUp/ArrowDown in EpisodeFeed.tsx returns nothing; the only keydown listener (line 15

**Independent verification.** CONFIRMED in the deployed bundle; severity corrected S2 -> S3.

WHAT I DID AND SAW
1. Deployed HTML, four live routes (curl to www.verzatv.com, iPhone UA on the first): `/`, `/series/storage-pirates`, `/legal/terms` (404), `/account` (404). All four emit verbatim:
   <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover"/>
2. Ruled out a post-hydration rewrite (the way this finding could have been stale). In a real Chrome tab on the live site, after readyState=complete and React mounted, on `/` and on the player route `/series/lost-and-found/1` (video element present): exactly 1 viewport meta tag, hasMaxScale1=true, hasUserScalableNo=false. Nothing strips the cap at runtime; repo-wide grep for `meta[name="viewport"]` finds no client-side viewport manipulation.
3. Source: /Users/jothamhall/E! CREATOR ECONOMY/verza-tv/app/layout.tsx:96 `maximumScale: 1,` — the ONLY `export const viewport` in app/ or components/, so no route overrides it. `find app -name page.tsx | wc -l` = 65, matching the finding's "all 65 page routes."
4. The WKWebView premise checks out from this repo's own code: /Users/jothamhall/E! CREATOR ECONOMY/verza-tv/lib/pl

---

### D6-004 — Arabic — one of the 20 shipped locales — renders the entire app left-to-right. document.documentElement.dir is never set anywhere in the codebase; `dir` appears exactly once, on the paywall overlay div.

*Raised by D6 — Accessibility. The accessibility pr*

**Reproduction.** 1. Open https://www.verzatv.com/, tap the language chip, choose العربية. 2. The UI translates (nav reads اكتشف / مقاطع / متجر / مكتبة / الملف الشخصي). 3. In the console: document.documentElement.lang -> "ar"; document.documentElement.dir -> ""; getComputedStyle(document.body).direction -> "ltr". The nav, headings, poster grid, forms and footer stay mirrored the wrong way.

**Evidence.** Measured after switching locale on the deployed site: {"clicked":true,"lang":"ar","dir":"(empty)","computedDir":"ltr","nav":["اكتشف","مقاطع","متجر","مكتبة","الملف الشخصي"]}. Exhaustive grep over app/ components/ lib/ for documentElement.dir | document.dir | .dir = | dir=" | dir={ (excluding data-dir) returns exactly one hit: components/EpisodeFeed.tsx:2511 `dir={locale === "ar" ? "rtl" : undefined}` on the paywall overlay only. components/LangProvider.tsx:93 and :105 and components/ContentTranslator.tsx:58 set `lang` and never `dir`. Screenshot of the Arabic home page at 320px shows the LTR nav order and the two-line Profile label.

**Independent verification.** REPRODUCED on the live site, exactly as written.

CODE: lib/i18n.ts:22 ships `ar` as one of 20 locales. components/LangProvider.tsx sets `document.documentElement.lang` in two places (hydration effect + setLocale) and never touches `dir`. app/layout.tsx:107 hardcodes `<html lang="en" ...>` with no `dir`. Exhaustive grep over app/ components/ lib/ for `documentElement.dir | document.dir | setAttribute("dir"` returns ZERO hits; `dir=`/`dir={` in JSX returns exactly ONE hit — components/EpisodeFeed.tsx:2511 `dir={locale === "ar" ? "rtl" : undefined}` on the paywall overlay. globals.css has no `direction:` rule other than flex-direction, no `[lang=...]` selector, no `:dir()`.

DEPLOYED BUNDLE (not the build): served HTML at https://www.verzatv.com/ is `<html data-dpl-id="dpl_FEduFW6ftQZyapPx28PouXp55wk3" lang="en" ...>` — no dir attribute anywhere in 231KB of HTML. Downloaded all 14 JS chunks (3.1MB) + the CSS chunk: `documentElement.lang` appears in 2 chunks, `documentElement.dir` in ZERO, and no `.dir =` assignment exists at all. The single "rtl" that is real code is `lang:X,dir:"ar"===X?"rtl":void 0` in /_next/static/immutable/chunks/27_6kgf3tx4s2.js (the paywall overlay); every oth

---

### D6-005 — The --color-muted token #6B6B7B fails WCAG AA contrast on both site backgrounds — 3.56:1 on the card surface #12121C and 3.84:1 on the page background #07070E, against the 4.5:1 requirement — and it carries most of the p

*Raised by D6 — Accessibility. The accessibility pr*

**Reproduction.** 1. Open https://www.verzatv.com/discover at 320px. 2. Sample the '61 ep · ...' meta line under any poster: color rgb(107,107,123) at 10px on rgb(18,18,28). 3. Compute the contrast ratio -> 3.56:1 (AA needs 4.5:1 for text under 18.66px bold / 24px regular). Same token, same failure, on the footer link list, /me section labels, the Sign Out row, poster genre lines and the copyright line.

**Evidence.** Measured on the deployed bundle in a real 320px viewport. Worst aggregates: 3.56:1 rgb(107,107,123) on rgb(18,18,28) — 1,042 nodes; 3.84:1 rgb(107,107,123) on rgb(7,7,14) — 671 nodes. /discover alone: 276 nodes at 10px/400. /me: 'Sign Out' at 14px/600 = 3.56:1. Defined at app/globals.css:8 `--color-muted: #6B6B7B;` and duplicated as lib/theme.ts:8 `textMute: "#6B6B7B"`, which 76 component files import. Raising it to roughly #8A8A9C clears 4.5:1 on both surfaces.

**Independent verification.** CONFIRMED on the deployed bundle, not the build.

WHAT I DID:
1. Source: app/globals.css:8 `--color-muted: #6B6B7B;` and lib/theme.ts:8 `textMute: "#6B6B7B"` both exist as described. 76 files reference textMute — the claimed count is exact.
2. Deployed CSS: fetched https://www.verzatv.com/_next/static/immutable/chunks/1b0rux1xv-mpp.css (200, 47932 B). It contains `--color-muted:#6b6b7b`. The token ships.
3. Recomputed contrast independently from WCAG relative luminance rather than trusting the raiser: #6B6B7B on #12121C = 3.556:1; on #07070E = 3.839:1. The raiser's 3.56 and 3.84 are correct. AA needs 4.5:1 for text below 18.66px bold / 24px regular.
4. Reproduced repro step 2 exactly. Deployed /discover (200, 502352 B) renders 91 series row anchors, every one `style="background:#12121C;color:#F5F4F8"`, each containing `<span class="text-[10px]" style="color:#6B6B7B">61<!-- --> ep · <!-- -->5<!-- --> free</span>`. That is 10px/400 at 3.556:1. The 91 rows reconcile with the 91 live catalog rows, so this is real data, not string matching.
5. Deployed /me: the Sign Out control is `class="w-full py-3 rounded-xl text-sm font-semibold ..."` with `style="background:#12121C;...;color:#6B6B7

---

### D6-006 — The accent #E0115F used as text fails AA on every background it appears on — 4.22:1 on the page background, 4.07:1/3.70:1/3.60:1 on tinted chips, 3.91:1 on cards, 3.62:1 on raised surfaces. 732 failing nodes across 49 ro

*Raised by D6 — Accessibility. The accessibility pr · **touches money or the shipped rail***

**Reproduction.** 1. Open https://www.verzatv.com/series/the-mistress-trap at 320px. 2. Sample '$1.99': rgb(224,17,95) at 16px/700 on rgb(26,26,38) -> 3.62:1. 3. Sample 'First 5 Episodes FREE': rgb(224,17,95) at 12px/700 on rgb(50,9,30) -> 3.69:1. 4. On /support sample 'Privacy Policy' / 'privacy@verzatv.com': rgb(224,17,95) on rgb(7,7,14) -> 4.22:1. All below the 4.5:1 AA floor for their size.

**Evidence.** Measured across 61 real-state URL instances. Distinct failing pairs: 4.07:1 on rgb(25,8,21) (357 nodes, /sitemap series links); 3.60:1 on rgb(45,18,37) (137 nodes, /discover genre chips); 4.22:1 on rgb(7,7,14) (91 nodes); 3.70:1 (61); 3.74:1 (44); 3.91:1 on rgb(18,18,28) (31, the 'EP' label); 3.62:1 on rgb(26,26,38) (5, includes '$1.99'). Token: app/globals.css:10 `--color-accent: #E0115F`. The accent is fine as a fill; it is only the text usage that fails.

**Independent verification.** CONFIRMED against the deployed site, not the build. Verified the token in the shipped stylesheet (https://www.verzatv.com/_next/static/immutable/chunks/1b0rux1xv-mpp.css); on the live page getComputedStyle(documentElement)['--color-accent'] resolves to #e0115f. Source token is /Users/jothamhall/E! CREATOR ECONOMY/verza-tv/app/globals.css:9 (raiser said :10, off by one).

Method: verified the EFFECT, not the assignment. Ran a contrast audit in Chrome on four live routes that walks each accent-text node's ancestor chain and alpha-composites every background-color to a true opaque background, then applies the WCAG large-text rule (>=24px, or >=18.66px at 700+). Measured pairs, all FAILING:

/series/the-mistress-trap - 6 of 6 accent text nodes fail:
  "$1.99"  16px/700 on rgb(26,26,38)  = 3.62:1  (needs 4.5 - 16px bold is NOT large text)
  "First 5 Episodes FREE" 12px/700 on rgb(50,9,30) = 3.69:1
  "EP 1"   12px/700 on rgb(18,18,28)  = 3.91:1
  3 hashtag chips 10px/500 on rgb(36,8,25) = 3.93:1
/support - 8 of 8 fail: "Privacy Policy ->", "Terms of Service ->", "Refund Policy ->", "Contact Directory ->" 14px/400 on rgb(7,7,14) = 4.22:1; "Apple Billing Support" / "reportaproblem.apple.co

---

### D6-008 — Form fields have no focus indicator at all. The only focus-visible rule in the deployed CSS targets `a` and `button`; 36 of the 38 `outline-none` usages in the codebase sit on inputs/textareas with nothing replacing the 

*Raised by D6 — Accessibility. The accessibility pr*

**Reproduction.** 1. Open https://www.verzatv.com/sign-in. 2. Click the email field or Tab into it. 3. Nothing changes visually except the caret. 4. In the console: const e=document.getElementById('email'); e.focus(); e.matches(':focus-visible') -> true; getComputedStyle(e).outlineStyle -> 'none'; getComputedStyle(e).boxShadow -> 'none'.

**Evidence.** Measured on the deployed page: `#email -> fv=true outline=none/1px/rgb(0,95,204) shadow=none`, `#password -> fv=true outline=none/1px/rgb(0,95,204) shadow=none`, while `button[type=submit] -> fv=true outline=solid/2px/rgb(224,17,95) shadow=set` and `a[href="/forgot-password"]` likewise. Deployed CSS chunk /_next/static/immutable/chunks/1y2muhl66_cr7.css contains exactly one focus-visible rule: `a:focus-visible,button:focus-visible{outline-offset:2px;outline:2px solid #e0115f;box-shadow:0 0 12px #e0115f4d}` and the utility `.outline-none{--tw-outline-style:none;outline-style:none}`. Source count: 38 `outline-none` occurrences in app/ + components/; only 2 (app/sign-up/page.tsx:89 and :107) pa

**Independent verification.** REPRODUCED on the live deploy, including a live keyboard-modality measurement (not just string matching).

1) DEPLOYED CSS — re-checked against the CURRENT chunk, not the raiser's. The finding cites /_next/static/immutable/chunks/1y2muhl66_cr7.css; the site now serves /_next/static/immutable/chunks/1b0rux1xv-mpp.css (47,932 bytes, the only stylesheet linked by /sign-in, /sign-up, /search, /me). The claim survives the redeploy. Parsed all 3 occurrences of ":focus" in that file:
  - a:focus-visible,button:focus-visible{outline-offset:2px;outline:2px solid #e0115f;box-shadow:0 0 12px #e0115f4d}
  - .focus\:ring-2:focus{...} (utility; used on only 2 elements site-wide)
  - .outline-none{--tw-outline-style:none;outline-style:none}
No :focus or :focus-visible rule anywhere targets input, textarea, or select. The one inline <style> block in the deployed HTML is Google-Translate suppression only, no focus rules.

2) DEPLOYED HTML — curl of https://www.verzatv.com/sign-in shows both fields shipping with the ring removed and nothing replacing it:
  <input id="email" ... class="w-full rounded-xl px-4 py-3 text-sm outline-none placeholder:opacity-50" style="background:#12121C;border:1px solid 

---

### D6-009 — Every carousel pagination dot is a 6x6 CSS-pixel button with p-0 and no expanded hit area — a quarter of the WCAG 2.5.8 minimum of 24x24 and a seventh of Apple's 44pt guidance. Three separate implementations.

*Raised by D6 — Accessibility. The accessibility pr*

**Reproduction.** 1. Open https://www.verzatv.com/ at 320px. 2. The six dots under the hero measure 6x6 (the active one 20x6). 3. Try to tap dot 4 with a thumb — the neighbours are 1.5px away (gap-1.5).

**Evidence.** Measured on the deployed home page: `20x6 <button> "Slide 1"`, `6x6 <button> "Slide 2"` … `6x6 <button> "Slide 6"`. Source: components/BrowsePage.tsx:856 and :1067 (`className="p-0 border-0 cursor-pointer"` wrapping a `width: i===idx ? 20 : 6, height: 6` div) and components/HeroCarousel.tsx:82 (same shape, 6x6 / 24x6). None of the three exposes selected state — the label is only `Slide N` / `Show <title>` with no aria-current or aria-selected.

**Independent verification.** CONFIRMED against the live deployment, with real keyboard Tab (not programmatic .focus(), which does not reliably set :focus-visible in Chrome — the raiser's console repro is the weakest part of their evidence, but the claim survives a stronger test).

WHAT I DID / SAW

1. Deployed CSS. The chunk the raiser cited (1y2muhl66_cr7.css) is GONE — the site has redeployed since the finding was filed. Current chunk on https://www.verzatv.com/sign-in is /_next/static/immutable/chunks/1b0rux1xv-mpp.css. Re-checked it fresh: `grep -c focus-visible` = 1, and that single rule is
  `a:focus-visible,button:focus-visible{outline-offset:2px;outline:2px solid #e0115f;box-shadow:0 0 12px #e0115f4d}`
Nothing targets input/textarea/select focus. Also in that chunk: `.outline-none{--tw-outline-style:none;outline-style:none}` (Tailwind v4 semantics — this kills the UA ring outright, unlike v3's transparent-outline `outline-none`). The page's only inline <style> block is Google-Translate hiding, no focus rules. So: redeployed, behavior unchanged, NOT stale.

2. Deployed HTML. Both fields ship with the ring removed and nothing replacing it:
  <input id="email" ... class="w-full rounded-xl px-4 py-3 text-s

---

### D6-010 — Tap targets are systematically undersized: 1,853 of 2,679 measured interactive instances (69%) are below 44x44 and 943 (35%) are below the WCAG 2.5.8 minimum of 24x24. The catalog's primary navigation — the ten category 

*Raised by D6 — Accessibility. The accessibility pr*

**Reproduction.** 1. Open https://www.verzatv.com/ at 320px. 2. Measure the category rail buttons: Drama 69x31.5, Hot 38.3x31.5, Anime 60.3x31.5, Español 83.7x31.5, Bollywood 114.8x31.5, Reality 77.7x31.5, Creators 96.8x31.5, Red Carpet 111.9x31.5, Music 59.6x31.5, Tubi 76x36. 3. Measure the bottom nav links: 59.2x41 each. 4. Measure the header controls: Change language 36x36, Search 36x36.

**Evidence.** Measured across 61 real-state URL instances at 320x900 on the deployed bundle. Aggregate: 2,679 instances, 1,853 under 44x44 (69%), 943 under 24x24 (35%). Category tabs: components/CategoryTabs.tsx:211 `className="relative border-0 cursor-pointer bg-transparent whitespace-nowrap flex-shrink-0 p-0 pb-1.5"` — no vertical padding, so the target is the text box. Bottom nav: components/BottomNav.tsx:102, a flex-col Link inside a `items-center` row so it never stretches to the nav's 54px content box. Player chrome: Back / Unmute / Fullscreen are 40x40 (components/EpisodeFeed.tsx:2183, :2203, :2253); the action rail (Like/Save/Share/More) is 44x63 and passes. Episode picker prev/next are `w-10 h-10

**Independent verification.** CONFIRMED on the live deployment, with two corrections to the write-up.

WHAT I DID
1. Fetched https://www.verzatv.com/ (200, 231 KB). The shipped SSG HTML contains exactly six hero dot buttons, verbatim: `<button class="p-0 border-0 cursor-pointer" style="background:none" aria-label="Slide 1"><div class="rounded-full" style="width:20px;height:6px;...">` and five siblings at `width:6px;height:6px`, inside `<div class="flex items-center justify-center gap-1.5 pt-1 pb-0.5">`.
2. Measured the live DOM with getBoundingClientRect on www.verzatv.com (not a local build). Drama tab: 6 buttons, active 20x6, the other five 6x6, computed `padding: 0px`, container `gap: 6px`, dot pitch 12px (x = 329, 341, 353, 365). Reality tab (clicked through in-page): 4 buttons, 6x6 / active 20x6, padding 0px, gap 6px — identical.
3. Checked for any hit-area expansion. Fetched the deployed stylesheet /_next/static/immutable/chunks/1b0rux1xv-mpp.css: the only rules touching `button` are the Tailwind preflight reset and `a:focus-visible,button:focus-visible{outline...}`. No min-height/min-width, no ::after touch-target pad. app/globals.css has none either. So the 6x6 box is the whole target.
4. Selected-state

---

### D6-011 — Two icon-only controls ship with no accessible name at all: the Shorts back link and the next-episode link on every series page. A screen reader announces them as a bare link with only the URL.

*Raised by D6 — Accessibility. The accessibility pr*

**Reproduction.** 1. Open https://www.verzatv.com/shorts. The 40x40 circular back button top-right has no text, no aria-label, no svg title. 2. Open https://www.verzatv.com/series/the-mistress-trap. The 39x39 circular next-episode chevron has no accessible name. 3. Confirm on any other title, e.g. /series/the-goat-mistress-es — same result, so it is catalog-wide.

**Evidence.** Runtime accessible-name computation over 61 URL instances found exactly two unnamed controls: `/shorts -> a 40x40 href=/ .absolute top-4 right-4 z-10 w-10 h-10 ro...` and `/series/the-mistress-trap -> a 38.8x38.8 href=/series/the-mistress-trap/2 .w-10 h-10 rounded-full flex items-center`, reproduced on `/series/the-goat-mistress-es -> a 38.8x38.8 href=/series/the-goat-mistress-es/2`. Source: components/ShortsFeed.tsx:108 `<Link href="/" className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full ...">` containing only an inline svg; components/EpisodeDropdown.tsx:47 (prev) and :98 (next), each `<Link ...><svg><polyline/></svg></Link>` with no aria-label. Every other one of the 2,679 measur

**Independent verification.** CONFIRMED on the deployed bundle at www.verzatv.com (not the build). Every concrete number in the repro reproduces to the decimal.

WHAT I DID: loaded www.verzatv.com in Chrome, waited for hydration, and read getBoundingClientRect() off the live DOM.
- Category rail buttons ([aria-label="Categories"] button): all 31.5px tall. Widths: HOT 38.3, ANIME 60.3, ESPANOL 83.7, BOLLYWOOD 114.8, CREATORS 96.8, Tubi 76x36 — an exact match to the raiser's list.
- Bottom nav links (nav a): 41.0px tall, all five. Width is flex-1 so viewport-driven: 74.0 at my viewport, which is the raiser's 59.2 at 320px (296px content / 5).
- Header controls: "Change language" 36x36, "Search" 36x36 — exact match.

VERIFIED THE EFFECT, NOT THE ASSIGNMENT: I did not trust the rects. I probed document.elementFromPoint() 1..24px above and below each target's vertical centre-line to find what actually receives a tap. Extra hit area beyond the rect was 0px everywhere (one bottom-nav link had 1px). There is no ::before expander, no invisible padding, no parent absorbing the tap — the painted box IS the hit box. The rail's py-2 lives on the flex track, not on the buttons, so it is dead space between rows, not target ar

---

### D6-012 — There is no skip link anywhere in the product. On the home page a keyboard or switch user must press Tab 61 times to reach the bottom navigation, and <main> has no id to target even if a link were added.

*Raised by D6 — Accessibility. The accessibility pr*

**Reproduction.** 1. Open https://www.verzatv.com/ and press Tab from the address bar. 2. No 'Skip to content' control appears at any point. 3. Count the tabbable elements before the bottom nav: the first bottom-nav link is the 62nd tabbable element on the page.

**Evidence.** Measured: `{"tabbableCount":66,"firstBottomNavTabIndex":61}` on the deployed home page at 320px. Across all 61 real-state URL instances, routes carrying a skip link: 0. grep -rni 'skip to|skip-link|skiplink' over app/ components/ returns nothing. app/layout.tsx renders `<main className="flex-1 pb-16">` with no id, and the measured `mainId` was '(none)' on every route.

**Independent verification.** Reproduced in full against the deployed site. (1) Repo: grep -rni 'skip to|skip-link|skiplink|skipToContent' over app/ components/ = 0 hits; app/layout.tsx renders `<main className="flex-1 pb-16">` with no id and no tabIndex. (2) Deployed HTML: curl https://www.verzatv.com/ serves `<main class="flex-1 pb-16">` verbatim, no id, no skip-link string. (3) Deployed bundle, not the build: downloaded all 14 /_next/static/immutable/chunks/*.js referenced by the live home page (1.6MB) plus 35 cached chunks; grep for 'skip to (main|content)|skip-link|skipLink|skip-nav|"#main"' = 0 hits, so nothing injects one at runtime. (4) Live DOM measurement in Chrome on www.verzatv.com (innerWidth 606): {"tabbableCount":68,"firstBottomNavIndex":62,"bottomNavItemCount":5,"mainId":"(none)","mainTabIndex":null,"anySkipLink":0,"anyHashLinkToMain":[]} — the raiser's 66/61 at 320px reproduces within viewport noise; the bottom nav is the last 5 tab stops. (5) Not one route: 9 live routes (/, /shop, /search, /series/the-mistress-trap, /series/the-mistress-trap/1, /sitemap, /terms, /privacy, /amazon) each serve `<main class="flex-1 pb-16">` with no id, 0 skip-link hits, and ZERO href="#..." anchors of any kind —

---

### D6-013 — Heading structure is missing on the highest-traffic surfaces. The home page renders zero headings of any level, and the episode/paywall route's only heading is an <h3> with no h1 or h2 above it. 6 of the 61 measured rout

*Raised by D6 — Accessibility. The accessibility pr*

**Reproduction.** 1. Open https://www.verzatv.com/ and run document.querySelectorAll('h1,h2,h3,h4,h5,h6').length -> 0. 2. Open https://www.verzatv.com/series/the-mistress-trap/6 and run the same -> one element, an H3 reading 'Unlock All Episodes'. 3. In a screen reader, the heading-navigation shortcut finds nothing on the landing page.

**Evidence.** Measured over 61 real-state URL instances. Routes with no <h1>: '/', '/shorts', '/?tab=anime', '/series/the-mistress-trap/2', '/series/the-mistress-trap/6', '/share'. The home page and '/?tab=anime' return 0 headings of any level. Paywall page heading list: ['H3']. Landmark counts are otherwise present (1 main, 1 nav, header, footer on every route) but only 4 of 61 routes label any <nav>.

**Independent verification.** Reproduced on live production in a real browser and in the deployed bundle.

BROWSER (document.querySelectorAll on www.verzatv.com):
- /series/the-mistress-trap/6 -> headingCount 1, headings ["H3:Unlock All Episodes"], h1: 0. Exactly as claimed.
- / -> h1: 0. Total headings 1, and only because that profile has watch progress rendering the CONDITIONAL <h2>Continue Watching</h2> (components/BrowsePage.tsx:617). A first-time viewer gets 0.
- /?tab=anime -> h1: 0. /shorts -> h1: 0 (one H2 title card). /share -> redirects to /, h1: 0.
- Landmarks on every route: main 1, nav 1, header 1, footer 1, navLabeled 0 (bottom nav has no aria-label). Matches the "only 4 of 61 label any nav" claim.

DEPLOYED HTML: curl of / returns 1 h1 + 10 h2, but ALL 11 are inside <noscript> (offsets 9451-29010 verified inside the two noscript blocks); headings outside noscript = []. Source confirms app/page.tsx:32-39 wraps the block in <noscript> as a crawler-facing index, so it is inert text in the DOM when JS is on. Deployed HTML for /series/the-mistress-trap/2, /shorts, /share = 0 headings of any level.

DEPLOYED BUNDLE (not the build): downloaded the 16 chunks the episode route loads from www.verzatv.com. 

---

### D6-014 — Overlay sheets have no dialog semantics, no focus trap and (in the player) no Escape handler. Opening the player's More sheet leaves focus on <body> and keeps all seven background controls in the tab order alongside the 

*Raised by D6 — Accessibility. The accessibility pr*

**Reproduction.** 1. Open https://www.verzatv.com/series/the-mistress-trap/1 and tap 'More options'. 2. Run document.querySelectorAll('[role=dialog]').length -> 0 and document.querySelectorAll('[aria-modal]').length -> 0. 3. Run document.activeElement.tagName -> 'BODY' — focus was never moved into the sheet. 4. Tab: the cycle still includes Back, Unmute, Fullscreen, Like, Save, Share, More behind the scrim. 5. Press Escape — the sheet stays open.

**Evidence.** Measured on the deployed player with the sheet open: {"dialogs":0,"ariaModal":0,"focusablesWhileOpen":["Back","Unmute","Fullscreen","Like","Save to My List","Share","More options","Messages","WhatsApp","X","Copy link"],"activeEl":"BODY/"}. Codebase-wide: exactly one role="dialog" exists (components/InstallPrompt.tsx:206, a component the product no longer mounts), zero aria-modal, zero <dialog>, zero focus traps. Escape is handled in only 4 places — components/FeedSearch.tsx:37, components/AmazonProducts.tsx:257, components/SeriesInfoDrawer.tsx:119, components/SearchButton.tsx:38 — and not in EpisodeFeed, CartDrawer, AmazonBag, AskVerza or LangDropdown.

**Independent verification.** CONFIRMED on www.verzatv.com. Reproduced every sub-claim, plus found the root cause.

ROOT CAUSE (home page). Fetched https://www.verzatv.com/ (231KB). The static HTML does contain 1 <h1> ("VERZA TV — 91 Live Series") and 10 <h2> (the tab labels) — so a naive grep would have killed this finding. I computed byte offsets: the document's only <noscript> content range is 9414–29262, and all 11 headings sit at offsets 9451–29010, i.e. every single one is INSIDE that <noscript>. Source: /Users/jothamhall/E! CREATOR ECONOMY/verza-tv/app/page.tsx lines 32–70 wrap the entire heading tree in <noscript> as a crawler-facing index. With JS enabled — every real viewer, screen readers included — noscript content is inert text, so the live DOM has zero headings.

LIVE DOM (Chrome, production):
- / → h1=0. Only heading returned: ["H2 :: Continue Watching"], and that exists only because the test profile had watch history. components/BrowsePage.tsx:617 gates it on `continueWatching.length > 0`; its only other heading (BrowsePage.tsx:942 "The Carpet") is gated on `activeTab === "red-carpet"`. A first-time viewer therefore gets literally 0 headings, as the finding states.
- /series/the-mistress-trap/6 

---

### D6-016 — Reduced-motion handling is real but incomplete: the deployed CSS has four prefers-reduced-motion blocks covering eight selector groups, and none of them covers .glow-pulse (an infinite 2s animation on the paywall, series

*Raised by D6 — Accessibility. The accessibility pr · **touches money or the shipped rail***

**Reproduction.** 1. Enable Reduce Motion in the OS. 2. Open https://www.verzatv.com/series/the-mistress-trap — the 'Watch Episode 1 Free' CTA still pulses continuously. 3. Open https://www.verzatv.com/series/the-mistress-trap/6 — the 'Series Unlock · one-time' CTA still pulses. 4. In the console: getComputedStyle(document.querySelector('.glow-pulse')).animation -> '2s ease-in-out infinite glow-pulse'.

**Evidence.** Deployed CSS chunk 1y2muhl66_cr7.css: `.glow-pulse{animation:2s ease-in-out infinite glow-pulse}` and `.skeleton{...animation:1.5s ease-in-out infinite shimmer}`; `*{scroll-behavior:smooth}` at byte offset 42028. The four reduced-motion blocks enumerated from the live cascade cover only: @wizardFade, .wizard-step[+data-dir], (.animate-fadeIn,.animate-slideUp,.animate-rise,.animate-cardIn,.stagger-children>*), (video,img), (.tab-slide-next,.tab-slide-prev), .tubi-glow, (.tubi-live-dot,.tubi-rise), [role=status][aria-label=Loading]. Runtime check on the deployed series page: the animating elements were `rise x1 covered=true` and `glow-pulse xinfinite covered=false <A .glow-pulse inline-flex it

**Independent verification.** CONFIRMED against the live bundle. Inherited fact was STALE in one detail: evidence cites chunk 1y2muhl66_cr7.css, but the deployed chunk is now /_next/static/immutable/chunks/1b0rux1xv-mpp.css (47,932 B) — a redeploy since the audit. The substance reproduces unchanged in the current chunk, which is the ONLY stylesheet on /, /library and /series/*; the page's single inline <style> only hides the Google Translate widget.

Proof (brace-matched, not string-matched): the deployed CSS has exactly 4 prefers-reduced-motion blocks at offsets 37339, 43254, 43836, 44023, covering only @wizardFade + .wizard-step[data-dir]; .animate-fadeIn/.animate-slideUp/.animate-rise/.animate-cardIn/.stagger-children>*; video,img transitions; .tab-slide-next/-prev; .tubi-glow/.tubi-live-dot/.tubi-rise; [role=status][aria-label=Loading]. Every occurrence of glow-pulse (3), skeleton (3) and scroll-behavior:smooth (1) falls OUTSIDE all four ranges. Live rules: .glow-pulse{animation:2s ease-in-out infinite glow-pulse}; .skeleton{...animation:1.5s ease-in-out infinite shimmer}; *{scroll-behavior:smooth} (now at offset 42206, not the cited 42028). Source has 5 blocks vs 4 deployed because two adjacent blocks merg

---

### D6-017 — The bottom navigation never exposes which tab is current. The ACTIVE and INACTIVE colour constants are both #FFFFFF, and there is no aria-current, so the only cue is a 4px gradient bar and a drop-shadow — and nothing at 

*Raised by D6 — Accessibility. The accessibility pr*

**Reproduction.** 1. Open https://www.verzatv.com/shop. 2. Run document.querySelectorAll('.bottom-nav [aria-current]').length -> 0. 3. Compare the icon and label colour of Shop against Discover — both compute to rgb(255,255,255).

**Evidence.** components/BottomNav.tsx:9-10 `const ACTIVE = "#FFFFFF"; const INACTIVE = "#FFFFFF";` — the isActive branch at line 100 selects between two identical values. The <nav> at line 88 has no aria-label. Codebase-wide there is exactly one aria-current, at components/CategoryTabs.tsx:210 (the category rail, which does it correctly).

**Independent verification.** Reproduced in the deployed bundle with prefers-reduced-motion emulated, not by string matching.

WHAT I DID: launched headless Chrome (151) against www.verzatv.com, set `Emulation.setEmulatedMedia` features `prefers-reduced-motion: reduce` (page confirmed `matchMedia('(prefers-reduced-motion: reduce)').matches === true`), 390x844 mobile, then read getComputedStyle live.

WHAT I SAW (all with reduce=true):
- /series/the-mistress-trap -> 1 `.glow-pulse` element, text "Watch Episode 1 Free", `animation: "2s ease-in-out infinite glow-pulse"`, iterationCount `infinite`. Exactly repro step 4.
- /series/the-mistress-trap/6 -> paywall renders client-side, 1 `.glow-pulse` BUTTON, text "Series Unlock — $1.99 one-time", `animation: "2s ease-in-out infinite glow-pulse"`. Exactly repro step 3.
- / with network throttled -> 24 `.skeleton` elements, `animation: "1.5s ease-in-out infinite shimmer"`.
- computed `scroll-behavior` on both documentElement and body = `smooth`.

CASCADE PROOF (effect, not assignment): every live page (/, /library, /series/<slug>, /series/<slug>/<n>) loads exactly ONE stylesheet, /_next/static/immutable/chunks/1b0rux1xv-mpp.css (47,932 bytes). It contains exactly 4 @medi

---

### D6-018 — In the episode picker the locked state is carried by a bare padlock <svg> with no title, aria-label or aria-hidden, while FREE and NOW are real text. A screen-reader user hears the free and current episodes distinguished

*Raised by D6 — Accessibility. The accessibility pr*

**Reproduction.** 1. Open https://www.verzatv.com/series/the-mistress-trap and expand 'All Episodes'. 2. Episode 3 announces '3, <title>, FREE'. Episode 20 announces '3, <title>' with no indication it is locked. 3. Inspect the row: the trailing element is `<svg width="12" height="12">` with a rect and a path and no accessible text.

**Evidence.** components/EpisodeDropdown.tsx:158-166 — the isActive branch renders the text 'NOW', the isFree branch renders the text 'FREE', and the paid branch renders only an unlabelled 12x12 padlock svg. Rows are `px-3 py-2.5` = 40px tall, also under 44. NOTE: the fix is a visually-hidden text alternative next to the padlock — the padlock itself and the FREE badges are named as assets and must stay.

**Independent verification.** Reproduced on production, in the rendered DOM, not just the source.

WHAT I DID
1. Source: /Users/jothamhall/E! CREATOR ECONOMY/verza-tv/components/EpisodeDropdown.tsx — the row's trailing slot is a three-way branch: isActive -> <span>NOW</span> (line 146), isFree -> <span>FREE</span> (line 148), else a bare 12x12 <svg> whose only children are <rect> and <path d="M7 11V7a5 5 0 0 1 10 0v4"/> (lines ~155-161). `grep -n "aria|sr-only|<title"` over the whole file returns ZERO hits. (Raiser cited lines 158-166; the branch now sits at 145-161 — line drift from the added comment block, substance unchanged.)
2. Deployed bundle, not the build: fetched https://www.verzatv.com/series/the-mistress-trap, pulled its 13 chunks; the padlock path lives in /_next/static/immutable/chunks/3rs4odhb6kfd2.js and the minified JSX is identical — `l?jsx("span",{...children:"NOW"}):c?jsx("span",{...children:"FREE"}):jsxs("svg",{width:"12",height:"12",...children:[rect,path]})`. No aria, no title, no hidden label in the shipped code.
3. Live DOM via Chrome on www.verzatv.com/series/the-mistress-trap (61 episodes, freeEpisodes 5): expanded "All Episodes" and read the rows. Results:
   - rows 61, padlock rows 5

---

### D6-019 — Footer link targets are 18px tall and the five social links are 18x18 — below the WCAG 2.5.8 minimum of 24x24, with no padding to expand the hit area.

*Raised by D6 — Accessibility. The accessibility pr*

**Reproduction.** Open https://www.verzatv.com/ at 320px, scroll to the footer, and measure any social icon (18x18) or nav link ('Terms of Service' 96.6x18, 'Press' 31.6x18).

**Evidence.** Measured on the deployed footer, present identically on all 61 routes: Instagram/TikTok/X/YouTube/Facebook 18x18; Become a Creator 102.4x18, Support 45.3x18, Terms of Service 96.6x18, Privacy Policy 79.3x18, Refund Policy 77.9x18, Help & Support 86x18, Press 31.6x18, About 33.8x18. Source: components/Footer.tsx:84-95, `<a ... className="flex items-center gap-1.5 transition-opacity opacity-70 hover:opacity-100">` wrapping an 18px svg with no padding. The links do carry title={social.name}, so their names resolve correctly.

**Independent verification.** CONFIRMED at S3 (severity as raised).

WHAT I DID, IN ORDER

1. Source. /Users/jothamhall/E! CREATOR ECONOMY/verza-tv/components/EpisodeDropdown.tsx lines 145-162 is exactly as described. The three-way branch is: isActive -> `<span ...>NOW</span>`; isFree -> `<span ...>FREE</span>`; else -> `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={T.textMute} strokeWidth="2" ... className="flex-shrink-0">` containing only a `<rect>` and a `<path d="M7 11V7a5 5 0 0 1 10 0v4">`. No title, no aria-label, no aria-labelledby, no role, no aria-hidden. The enclosing `<Link>` has no aria-label or title either. Rows are `px-3 py-2.5`. Evidence line cite (158-166) is accurate; the svg opens on 158.

2. Where it renders. /Users/jothamhall/E! CREATOR ECONOMY/verza-tv/app/series/[slug]/page.tsx:413, guarded by `episodes.length > 0`, so the 5 coming-soon rows are correctly excluded. This is the series page picker, which is what the repro targets — the repro URL is right, not a mix-up with the episode route.

3. Deployed bundle, not the build. Fetched https://www.verzatv.com/series/the-mistress-trap (HTTP 200, 63,720 B), pulled every /_next/static/immutable/chunks/*.js it references, a

---

### D6-022 — The deployed CSS has no forced-colors or prefers-contrast support. Icons drawn with hard-coded stroke attributes will not adapt in Windows High Contrast Mode.

*Raised by D6 — Accessibility. The accessibility pr*

**Reproduction.** grep the deployed stylesheet for 'forced-colors' and 'prefers-contrast' — zero matches in 47,754 bytes.

**Evidence.** /_next/static/immutable/chunks/1y2muhl66_cr7.css: forced-colors occurrences 0, prefers-contrast occurrences 0, prefers-color-scheme occurrences 0. The absence of prefers-color-scheme is a deliberate dark-only product choice and is not reported as a defect; forced-colors is the gap.

**Independent verification.** CONFIRMED — and I expected to discard it. My prior was that forced-colors mode forces fill/stroke at the UA level, making an author @media (forced-colors: active) block unnecessary and this a pure string-match non-finding. That prior is wrong for SVG, and I proved it against the live site.

WHAT I DID
1. Re-checked the premise on the CURRENT bundle. The finding's cited path /_next/static/immutable/chunks/1y2muhl66_cr7.css is STALE (no longer referenced). The live homepage now links /_next/static/immutable/chunks/1b0rux1xv-mpp.css (HTTP 200, 47,932 bytes). Counts there: forced-colors 0, prefers-contrast 0, prefers-color-scheme 0, forced-color-adjust 0. Premise holds on current code.
2. Refused to stop at grep. Launched headless Chrome 151 with CDP on an isolated port, loaded https://www.verzatv.com/ at 390x844, and toggled Emulation.setEmulatedMedia forced-colors active against both forced palettes, reading computed styles and pixels.

WHAT I SAW
- Chromium computes forced-color-adjust: preserve-parent-color on SVG in forced-colors mode. It does NOT force author fill/stroke. Hard-coded values survive verbatim: stroke="#fff" -> rgb(255,255,255); stroke="#E0115F" -> rgb(224,17,95). Ic

---

### D6-023 — Every prerendered page ships with lang="en" hard-coded and only corrects to the viewer's locale after hydration, so the first paint of a non-English page is declared as English.

*Raised by D6 — Accessibility. The accessibility pr*

**Reproduction.** curl -sS https://www.verzatv.com/ | head -c 200 -> `<html ... lang="en" ...>` on every route including the Spanish and Hindi titles. Then load the page with a Spanish locale saved and observe document.documentElement.lang flip to 'es' after hydration.

**Evidence.** app/layout.tsx:106 `<html lang="en" className={...}>`. The correction happens in components/LangProvider.tsx:93 and :105 and components/ContentTranslator.tsx:58, all inside effects. Measured: the deployed HTML for /series/the-goat-mistress-es (a Spanish title) ships lang="en".

**Independent verification.** CONFIRMED, severity corrected S4 -> S3. See detail above.

---

### D7-003 — On home-indicator iPhones the fixed bottom nav permanently covers all eight footer legal/nav links (Terms, Privacy, Refund Policy, Support…) at maximum scroll, on 59 of 60 routes, because the nav-height reserve is applie

*Raised by D7 — Viewport and device. Every page-rou*

**Reproduction.** On an iPhone with a home indicator (safe-area-inset-bottom = 34px), open any page and scroll to the very bottom. The footer's legal-link rows sit underneath the bottom nav and cannot be scrolled into view — the document is already at max scroll. Reproduce by rendering any route at 430x932 and re-declaring the two env()-reading rules with a literal 34px inset.

**Evidence.** app/globals.css:333-335 `.app-shell > main { padding-bottom: calc(76px + env(safe-area-inset-bottom,0px)) !important }` — but app/layout.tsx:145-148 places `<Footer />` as a SIBLING of `<main>`, so the reserve never applies to it; components/Footer.tsx:77-79 gives the footer only `px-5 py-8` (32px bottom). Simulated inset 34 at 430x932 (safearearesult iPhone15PM_inset): nav height 107px, nav top y825; covered on 59/60 routes and interactive content covered on 59/60 — e.g. on `/`: 'Become a Creator', 'Support', 'Terms of Service', 'Privacy Policy' at y821-839 and 'Refund Policy', 'Help & Support', 'Press', 'About' at y845-863, all inside the 825-932 nav band. At 390x844 with the same inset, o

**Independent verification.** CONFIRMED against www.verzatv.com (deployed bundle, not the build), with severity corrected S2 -> S3.

HOW I REPRODUCED IT
Drove the real production site in headless Chrome 151 over CDP at a true iPhone 15 Pro Max viewport (Emulation.setDeviceMetricsOverride 430x932, dSF 3, mobile:true, iOS UA, touch on). Critically I did NOT hand-inject a literal 34px as the raiser did — I used Emulation.setSafeAreaInsetsOverride{bottom:34}, so env(safe-area-inset-bottom) is a genuine 34px. In-page probe confirms env resolves to 34. Then disabled the global `*{scroll-behavior:smooth}` (it silently stopped an earlier run 56px short of max) and scrolled to true max (scrollY === scrollHeight-innerHeight verified).

WHAT I SAW at max scroll, inset 34, on /terms, /, /shop, /me and /series/the-mistress-trap — identical on all five:
  nav: position:fixed, height 107px, occupying y 825..932
  .app-shell > main padding-bottom: 110px  (= 76 + 34, the reserve DOES apply)
  footer inner padding-bottom: 32px        (the reserve does NOT apply)
  row 1 links (/studio /support /terms /privacy)   y 821..839  ~78% covered
  row 2 links (/refund-policy /help /press /about) y 845..863  100% covered
  copyright line 

---

### D7-004 — The Amazon affiliate pill still overlaps the paywall's Go Back button, and on some phone geometries it overlaps the $1.99 Series Unlock button instead; the pill wins the hit test in the overlap region.

*Raised by D7 — Viewport and device. Every page-rou · **touches money or the shipped rail***

**Reproduction.** Add any sponsored product to the Amazon bag (any tile on /amazon or /shop), then watch past the free preview of a paid title, e.g. /series/the-mistress-trap/6. The orange 'N in bag' pill renders on top of the paywall. Header and bottom nav are correctly hidden inside the player; the pill is not.

**Evidence.** Verified live with no injection on https://www.verzatv.com/series/the-mistress-trap/6 after seeding localStorage['verza-amazon-bag'] the way the product does: paywall Go Back at y535-585 x183-423, pill at y532-572 x379-484, measured overlap 44 x 36 = 1,612px². The pill is fixed/absolute z-index 60 in the root stacking context while `.episode-immersive` is z-50, so it paints above the whole paywall; document.elementFromPoint at the pill centre returned the pill. Phone geometry, deployed CSS: 320x568 and 320x693 with no safe-area inset — 1,335px² = 9.7% of Go Back covered; 320x693 with a 34px home-indicator inset — 3,471px² = 25.1% of Go Back covered; 320x568 with a 34px inset — Go Back clears

**Independent verification.** Reproduced live on www.verzatv.com, no injection, deployed bundle.

DEPLOYED CSS (https://www.verzatv.com/_next/static/immutable/chunks/1b0rux1xv-mpp.css, from the live episode HTML): `.amazon-bag-layer{z-index:60;position:fixed}` `.amazon-bag-fab{bottom:calc(84px + env(safe-area-inset-bottom,0px))}` and `.episode-immersive{z-index:50;background:#000;position:fixed;inset:0}`. The chrome-hiding rules that ship are exactly `.episode-immersive~*`, `:has(.episode-immersive) header`, `... footer`, `... .bottom-nav`, and in the frame branch `... .device-nav-dock`. None matches the bag. The pill is a div in `.device-frame` (app/layout.tsx:159), not a sibling of `.episode-immersive` (which lives inside `main`), so `~*` misses it too. The raiser's "header and bottom nav are hidden, the pill is not" is exactly right.

LIVE REPRO: seeded localStorage['verza-amazon-bag'] = [{"id":"amzn-mighty-patch-original","quantity":2}] — the same {id,quantity} shape lib/amazon-bag.tsx writes — then loaded https://www.verzatv.com/series/the-mistress-trap/6. Real row: live, episodeCount 61, freeEpisodes 5, so ep 6 is the first locked one; the paywall rendered ("Unlock All Episodes", "$1.99 one-time Series Un

---

### D7-005 — The player's Back and Mute controls ignore safe-area-inset-top, so in the installed PWA and the iOS WebView they sit under the status bar / Dynamic Island; a decorative chip in the same component does inset correctly.

*Raised by D7 — Viewport and device. Every page-rou*

**Reproduction.** Install VERZA TV to the home screen (or open it in the iOS WebView) and play any episode. The circular Back and Mute buttons sit inside the top 47-59px reserved for the status bar and Dynamic Island. The 'Free episode n of N' chip below them is correctly pushed down.

**Evidence.** components/EpisodeFeed.tsx:2181-2184 Back is `absolute top-4 left-4 z-50 w-10 h-10`; :2202-2204 Mute is `absolute top-4 right-4 z-50 w-10 h-10`; :2229 Fullscreen is `absolute top-16 right-4`. None reads env(safe-area-inset-top). By contrast :2444-2450 places the free-run chip at `top: calc(env(safe-area-inset-top, 0px) + 60px)`. Measured with the inset re-declared at 0, 47 and 59: the Back/Mute rects were y16-56 in all three cases (safearearesult.playerTopControls, backTop=16 for every profile), i.e. fully inside the 47px (14 Pro) and 59px (15 Pro Max) status-bar zone. `.episode-immersive` is fixed inset:0 with no top padding (app/globals.css:706-712), and app/layout.tsx:79-84 sets appleWebA

**Independent verification.** CONFIRMED against the deployed site, not the build.

What I did and saw:

1. Deployed HTML. curl https://www.verzatv.com/series/the-escort/1 (200). The SSR markup ships the Back anchor as class="absolute top-4 left-4 z-50 w-10 h-10 ..." with an inline style containing only background/backdrop-filter/opacity/pointer-events/transition — no top override, no env().

2. Deployed CSS (/_next/static/css/1b0rux1xv-mpp.css, the only stylesheet the page links): `.episode-immersive{z-index:50;background:#000;position:fixed;inset:0;overflow:hidden}` for mobile (a second rule flips it to absolute only inside the >=520px desktop phone-frame). `.top-4{top:calc(var(--spacing)*4)}` = 16px, `.top-16` = 64px. So on a phone the controls are positioned 16px from the physical top of the display.

3. Deployed <head>: `viewport-fit=cover`, `mobile-web-app-capable=yes`, `apple-mobile-web-app-status-bar-style=black-translucent`, `<link rel=manifest>` -> /manifest.json with `"display":"standalone"`. This is an explicit opt-in to draw web content UNDER the iOS status bar in the installed PWA, which is exactly the condition that makes env(safe-area-inset-top) resolve to 47px (notch) / 59px (Dynamic Island).

4

---

### D7-006 — Pinch-zoom is disabled site-wide by maximum-scale=1 while 1,524 text nodes render below 12px — down to 9px on the free/paid chips — so a viewer who cannot read them has no way to enlarge them.

*Raised by D7 — Viewport and device. Every page-rou*

**Reproduction.** curl -s https://www.verzatv.com/ | grep viewport. On Android Chrome, open any browse page and try to pinch-zoom the '5 Free' / 'All Free' chips on a poster tile — the gesture is refused.

**Evidence.** Deployed HTML (verified by curl on www.verzatv.com, not the build): `<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover"/>`. Source app/layout.tsx:90-96 `export const viewport: Viewport = { width:"device-width", initialScale:1, maximumScale:1, viewportFit:"cover", themeColor:"#07070E" }`. Measured at 390px across all 60 reachable routes: 1,524 elements own text with computed font-size < 12px, on 60/60 routes — worst offenders /discover (191), /discover/romance (105), /genre/romance (103, including `div.absolute.bottom-1.5.left-1.5` at 9px reading 'All Free' and '5 Free'), /genres/romance (87), /amazon and /shop (73 each). WCAG 1.4.4 / 1.4.

**Independent verification.** CONFIRMED as an installed-PWA defect. Verified end-to-end in the DEPLOYED site, not the build.

WHAT MAKES THE STATUS BAR OVERLAP THE PAGE AT ALL (all three conditions confirmed live):
- Fetched https://www.verzatv.com/series/storage-pirates/1 with an iPhone UA: served HTML carries `viewport-fit=cover` and `apple-mobile-web-app-status-bar-style" content="black-translucent"`, and links /manifest.json, which is `"display": "standalone"`. That trio is exactly the combination in which iOS lays the web content out under the status bar / Dynamic Island and reports env(safe-area-inset-top) as 47px (notch) or 59px (Dynamic Island).

WHAT THE DEPLOYED CODE DOES:
- Deployed CSS /_next/static/immutable/chunks/1b0rux1xv-mpp.css: `.episode-immersive{z-index:50;background:#000;position:fixed;inset:0;overflow:hidden}` (the position:absolute variant is the >=520px desktop-frame override only). So the player's top edge IS the layout-viewport top edge.
- Deployed JS chunk /_next/static/immutable/chunks/27_6kgf3tx4s2.js contains, verbatim and each exactly once: "absolute top-4 left-4 z-50 w-10 h-10", "absolute top-4 right-4 z-50 w-10 h-10", "absolute top-16 right-4 z-50 w-10 h-10", and "safe-area-ins

---

### D7-009 — The only way to unmute the player is a 40x40 button in the extreme top-right corner, the hardest one-handed target on a 430x932 phone, on a product whose own rule is that playback always starts muted.

*Raised by D7 — Viewport and device. Every page-rou*

**Reproduction.** Open any episode one-handed on a 430x932 phone. Tap the video: it pauses. Double-tap: it likes. The sole unmute affordance is the small circle at the top-right corner.

**Evidence.** components/EpisodeFeed.tsx:2202-2204 Mute is `absolute top-4 right-4 w-10 h-10`; the slide's tap handler at :1006-1042 maps single tap to pause/play and double tap to like, with no unmute path. MEMORY.md records the standing rule 'iOS: ALWAYS play muted first, unmute after success', so a muted start is the normal case. On a 430x932 viewport the button's centre sits at roughly (394, 36) — the diagonal opposite of a right-thumb rest position, and it also collides with the status bar per D7-005.

**Independent verification.** Reproduced against the live deployed site (www.verzatv.com), not a build. Enumerated a[href],button,input,select,textarea in Chrome, dropped display:none/visibility:hidden/zero-rect and inline links inside flowing prose, and took min(width,height) — the raiser's stated method. Measured at a 606px viewport, which is below Tailwind's sm (640px) so the mobile component set renders (bottom nav present, footer social labels `hidden sm:inline` collapsed, footer maxWidth 440 already the binding constraint); every offender the finding names is fixed-pixel and does not change between 606 and 390. Repeated resize_window(390,844) calls reported success but innerWidth stayed 606 — another session appears to be sharing the window — and a same-origin iframe probe was blocked, so 390 itself was not directly reached.

Per-route results (reveal-wrapper opacity ignored so scroll-revealed posters count, which is the generous reading):
  /                        68 targets — 19 <24px (27.9%), 19 in 24–44, 30 >=44 (44.1%)
  /terms                   26 targets — 14 <24px (53.8%),  9 in 24–44,  3 >=44 (11.5%)
  /shop                    39 targets — 15 <24px (38.5%),  9 in 24–44, 15 >=44 (38.5%)
  /suppor

---

### D7-010 — On landscape viewports 501-599px tall (foldables, short desktop windows) the bottom nav's labels are clipped below the viewport edge, and the app shell goes full-bleed while the nav stays a 440px centred island.

*Raised by D7 — Viewport and device. Every page-rou*

**Reproduction.** Render https://www.verzatv.com/ at 653x512. The nav box is 48px but its content row is still 72px, so the label row falls off the bottom edge; the content spans the full 653px while the nav is 440px wide and centred.

**Evidence.** Measured at 653x512 against the deployed CSS: mqFrame=false, mqShort=false, navComputedHeight "48px", inner row inline height 72px, inner bottom edge y541 against a 512px viewport (29px off-screen), link height 34px with its label at roughly y509-521. shellW=653 while navW=440. Source: app/globals.css:549-554 `.bottom-nav { height: 3rem }` versus the inline `height: 72` on the row in components/BottomNav.tsx:91; app/globals.css:544-547 `.app-shell { max-width: 100%; width: 100% }` in landscape while app/globals.css:269-273 keeps `.bottom-nav { max-width: 440px }` unconditionally.

**Independent verification.** Reproduced in the DEPLOYED production bundle, not just the source.

What I did: pulled https://www.verzatv.com/series/the-mistress-trap/1 (a real catalog row from lib/catalog.ts; 200 OK), downloaded all 16 of its /_next/static/immutable/chunks/*.js, and grepped the shipped minified code.

Verified in the live bundle (chunks/27_6kgf3tx4s2.js):
1. The mute control ships exactly as described: `className:"absolute top-4 right-4 z-50 w-10 h-10 rounded-full ..."`, `aria-label: P?"Unmute":"Mute"`. 40x40 at a 16px inset; on a 430-wide viewport its centre is (394, 36).
2. Default state is muted: `useState(()=>"false"!==localStorage.getItem("verza-muted"))` — a first-ever viewer is always muted.
3. No second unmute path. The shipped slide tap handler is `stopPropagation(),reveal(); if(now-last<300){like()} ; setTimeout(...paused? play : pause ...,300)` — single tap pause/play, double tap like, nothing about audio. The feed's video element is built in JS with `playsInline`, `preload="auto"` and NO `controls` attribute (grep for `.controls` in the chunk returns nothing), so there is no native volume UI either. In source, `toggleMute` (components/EpisodeFeed.tsx:1887) has exactly one call site,

---

### D7-011 — Three of the four bottom sheets ignore safe-area-inset-bottom, so their last row of content or their primary button lands inside the home-indicator strip; the fourth sheet gets it right, which shows the pattern is known 

*Raised by D7 — Viewport and device. Every page-rou*

**Reproduction.** On a home-indicator iPhone open the footer Sitemap sheet: its bottom 34px is behind the bottom nav. Open the cart drawer: the Checkout button's bottom edge sits 16px from the screen edge, inside the 34px indicator strip. Open a series info drawer: same, 24px.

**Evidence.** components/FooterSitemap.tsx:65 hard-codes `bottom: 72` — the nav's height without the inset, while components/BottomNav.tsx:86 grows the nav by `env(safe-area-inset-bottom)`. components/CartDrawer.tsx:27 `fixed bottom-0` with the checkout footer at :144 `className="px-4 py-4"` and no inset. components/SeriesInfoDrawer.tsx:154 `fixed bottom-0` with the body at :181 `pb-6` (24px). Correct counter-example: components/AmazonBag.tsx:190 `paddingBottom: "calc(16px + env(safe-area-inset-bottom, 0px))"`. Also components/ShortsFeed.tsx:507 dot indicators at `bottom: 16` inside a fixed inset:0 container, and components/EpisodeFeed.tsx:2469 episode badge at `absolute bottom-6` — both non-interactive b

**Independent verification.** Reproduced live on www.verzatv.com, in the deployed bundle, at a landscape viewport inside the exact band the finding names.

What I did
1. Fetched the deployed CSS Next serves for the home page (https://www.verzatv.com/_next/static/immutable/chunks/1b0rux1xv-mpp.css). It contains, in this order: base `.bottom-nav{max-width:440px;left:50%;transform:translate(-50%)}`; `@media (orientation:landscape){.app-shell{width:100%;max-width:100%}.bottom-nav{height:3rem;padding-top:.25rem;padding-bottom:.25rem}.bottom-nav svg{width:1.125rem;height:1.125rem}.bottom-nav span{font-size:.625rem;line-height:.75rem}...}` — note the landscape block resets the shell to full width but never resets the nav's 440px max-width; and `@media (orientation:landscape) and (max-height:500px){...}`. The desktop-frame block is gated on `(min-width:520px) and (orientation:portrait),(min-width:520px) and (min-height:600px)`. So landscape heights 501–599 fall through every escape hatch, exactly as claimed.
2. Fetched the deployed home HTML: the nav's inner row still ships the inline `style="height:72px;padding-top:8px;padding-bottom:10px"` while the landscape CSS caps the nav box at 3rem.
3. Rendered https://www.verz

---

### D7-012 — Even with zero safe-area inset, the footer's copyright line is permanently hidden behind the fixed bottom nav on 59 of 60 routes at maximum scroll.

*Raised by D7 — Viewport and device. Every page-rou*

**Reproduction.** Open any page at 390x844, scroll to the absolute bottom. The line '© 2026 VERZA TV. All rights reserved. Microdramas, Reality & More.' renders at y779-812 while the nav starts at y771. The document is already at max scroll, so nothing brings it into view.

**Evidence.** Measured at max scroll (with `scroll-behavior` forced to auto so the programmatic scroll actually completed) across all 60 reachable route classes: 59/60 have the copyright inside the nav band at 390x844 (footerBottom 844 = viewport bottom = max scroll) and 59/60 at 852x393; the exception is /series/[slug]/[episode], where the nav is hidden. At 768 (device frame, nav docked rather than fixed) 0/60 are affected. Same root cause as D7-003: app/globals.css:333-335 applies the reserve to `.app-shell > main` while app/layout.tsx:148 makes `<Footer>` a sibling.

**Independent verification.** CONFIRMED but scope is wrong: 1 of the 3 named sheets is reachable, not 3. Fix FooterSitemap only.

REAL (FooterSitemap, every page's footer). Verified in the DEPLOYED bundle https://www.verzatv.com/_next/static/immutable/chunks/3z23pxudvy0-6.js: nav ships as `bottom-nav fixed bottom-0 w-full z-50` with style `paddingBottom:"env(safe-area-inset-bottom, 0px)"` wrapping an inner row `{height:72,paddingTop:8,paddingBottom:10}` -> painted box = 72 + inset, opaque #0D0D14. Sheet ships in the same chunk as `fixed ... z-40 rounded-t-2xl` with style `{maxWidth:440,bottom:72,maxHeight:"62dvh"}` - a literal 72. Live DOM on www.verzatv.com: sheet computed bottom "72px", z-index "40"; nav z-index "50", background rgb(13,13,20). Deployed HTML carries `viewport-fit=cover`, so the inset is live (34px iPhone X+ portrait) and bottom:0 anchors to the physical screen edge. Deployed stylesheet /_next/static/immutable/chunks/1b0rux1xv-mpp.css has only four safe-area-inset-bottom rules (main, .amazon-bag-fab, two auth pages) - none touches the sheet. Arithmetic: nav top = 106px above viewport bottom, sheet bottom = 72px -> a permanent 34px band of the sheet is behind the opaque nav at EVERY scroll posit

---

### S1-002 — The Reality tab's hero — a 320x480 rotating poster, the largest element on the tab — has no link, no button and no click handler. The identically sized and identically styled hero on Drama, Hot and Music is a link that s

*Raised by S1 — Discover / Home. The `/` route as s*

**Reproduction.** 1. Open https://www.verzatv.com/?tab=reality. 2. Tap the large poster at the top of the tab, on any of its four slides. Nothing happens. 3. Switch to Drama and tap the same-looking poster: it opens the player.

**Evidence.** components/BrowsePage.tsx:842-851 — the Reality hero image is wrapped in `<div className="relative">` with no <Link>; compare BrowsePage.tsx:986-990 where the Drama/Hot hero is `<Link href={posterHref(current)} …>`, and BrowsePage.tsx:667-683 where the Music poster is a <Link>. Live DOM readback on /?tab=reality: {heroAlt:"Sugar Babies", heroBox:"320x480", hasAnchorAncestor:false, hasButtonAncestor:false, onclick:false, cursor:"auto"}. Drama hero for comparison: link box 394x480, href /series/tied-by-fate/1.

**Independent verification.** CONFIRMED in the deployed bundle and by real tap on www.verzatv.com. Severity S3 stands (raiser was right).

DEPLOYED BUNDLE: fetched https://www.verzatv.com/?tab=reality, pulled its 14 /_next/static/immutable/chunks/*.js; BrowsePage lives in 1aseb4gggkekc.js. The "reality"===v branch renders the hero as plain divs with NO Link/onClick/button: `jsx("div",{className:"relative",children:jsx("div",{className:"relative mx-auto overflow-hidden rounded-xl",style:{aspectRatio:"2 / 3",width:"100%",maxWidth:"min(320px, 80vw)",background:"#000"},children:jsx(Image,{src:f.poster,alt:f.title,...})})})`. Same chunk, Drama/Hot hero uses the IDENTICAL box style wrapped in a Link: `jsx(Link,{href:posterHref(_),className:"block transition-transform duration-200 ease-out active:scale-[0.98]",onClick:e=>y(e,_.slug),...maxWidth:"min(320px, 80vw)"...})`. Music hero likewise a Link with the same box.

LIVE DOM (not string matching), /?tab=reality: heroBox "320x480", top 147, hasAnchorAncestor false, hasButtonAncestor false, onclick false, cursor "auto"; elementFromPoint at hero center = IMG with closestA=NONE.

REAL TAP: clicked hero center with a real mouse click -> URL unchanged (https://www.verzatv.c

---

### S1-003 — Poster-grid captions overflow their fixed 36px box and overlap the next row's artwork. The caption block is `<div style={{height:36}}>` holding a line-clamp-2 title plus a genre line, which needs 45px whenever the title 

*Raised by S1 — Discover / Home. The `/` route as s*

**Reproduction.** 1. Open https://www.verzatv.com/ at 320px wide (or 390px). 2. Look at the Drama grid, e.g. "Help! I'm Falling in Love with My Rude CEO". Its title wraps to two lines and "Romance · Comedy" drops below the caption box and sits on top of the poster in the row beneath.

**Evidence.** components/BrowsePage.tsx:1182-1185 — `<div style={{ height: 36 }}>` containing `<p className="… line-clamp-2">{s.title}</p>` and `<p className="text-[10px] mt-0.5 line-clamp-1">{s.genre}</p>`. Measured on production (Drama, grid page 1, 24 tiles), overflow past the caption box / tiles whose genre line crosses into the next row's top edge: 320px → 14 overflowing, 12 overlapping, worst 9px, tile 93px wide; 360px → 10 / 9; 375px → 7 / 6; 390px → 6 / 5; 430px → 5 / 4. Per-tile at 390px: boxH 36, scrollHeight 45, gapToNextRow −2px for "Help! I'm Falling in Love with My Rude CEO", "Billionaire Daughter's Love Triangle", "The Call Girl Bought by Betrayal", "Married to My Brother's Ex". The two-up 

**Independent verification.** CONFIRMED on the deployed site, not just the source.

WHAT I DID
1. Read the finding (element 44) from docs/audit/.pending-verification.json.
2. Confirmed the code is live: fetched https://www.verzatv.com/ and the deployed HTML contains 24 caption blocks rendered exactly as `<div style="height:36px"><p class="mt-1.5 text-[11px] font-semibold leading-tight line-clamp-2">TITLE</p><p class="text-[10px] mt-0.5 line-clamp-1">GENRE</p></div>`. Source match: /Users/jothamhall/E! CREATOR ECONOMY/verza-tv/components/BrowsePage.tsx:1182-1184 (the cited lines are exact). Not stale, not already fixed.
3. Pulled the deployed CSS bundle (/_next/static/immutable/chunks/1b0rux1xv-mpp.css) and resolved the real computed values rather than string-matching: --spacing .25rem, --leading-tight 1.25, preflight html line-height 1.5 (unitless). So mt-1.5=6px, mt-0.5=2px, gap-1.5 row gap=6px, title line=13.75px, genre line-height=15px (text-[10px] sets font-size only, inherits the 1.5 factor).
4. Measured the LIVE page in Chrome with getBoundingClientRect on the real DOM (not arithmetic), at four shell widths.

WHAT I SAW (measured, live, Drama grid page 1, 24 tiles)
- A two-line title makes the caption's c

---

### S1-004 — The hero auto-advances every 4 seconds and its link target changes with it, so a tap aimed at the poster a viewer is looking at can land on a different title's player. There is no pause control on touch (heroPaused is re

*Raised by S1 — Discover / Home. The `/` route as s*

**Reproduction.** 1. Open https://www.verzatv.com/ and watch the hero. 2. Note the title showing, wait for the 0.5s crossfade to begin, then tap. You can arrive at the incoming title's player instead. 3. There is no visible pause/stop control anywhere on the carousel.

**Evidence.** components/BrowsePage.tsx:479-483 — `setInterval(() => setHeroIdx(i => (i + 1) % slideCount), 4000)`; BrowsePage.tsx:986-989 — `<Link href={posterHref(current)}>` where `current = heroSlides[heroIdx % …]` (BrowsePage.tsx:384). Two consecutive fresh loads of https://www.verzatv.com/ read the hero anchor as /series/lost-and-found/1 and then /series/tied-by-fate/1. app/globals.css has 5 prefers-reduced-motion blocks (lines 232, 244, 776, …) covering fadeIn/slideUp/rise/cardIn/stagger-children/tab-slide, but the JS interval is unaffected; under reduce, `img { transition: opacity 0.1s !important }` only shortens the crossfade. WCAG 2.2.2 (Pause, Stop, Hide) is not met.

**Independent verification.** REPRODUCED ON www.verzatv.com (live), twice, in a real browser.

Loaded https://www.verzatv.com/ and sampled the hero anchor's href against the computed opacity of the three mounted hero layers:
  T0  href=/series/lost-and-found/1                                opacity1 = "Lost and Found"
  T4  href=/series/help-im-falling-in-love-with-my-rude-ceo/1      opacity1 = "Lost and Found"
      all layers = Lost and Found:1 | Help! I'm Falling in Love with My Rude CEO:0 | Tied By Fate:0
One auto-rotation tick moved the anchor to the INCOMING title while the OUTGOING poster was still the only layer at opacity 1. A tap in that window opens a different title's player than the poster on screen. Repeated on a second fresh load (T0 lost-and-found -> T5 help-im-falling..., visible layer still Lost and Found).

Also verified live: getComputedStyle(img.hero-crossfade).transitionDuration === "0.5s", so on a foregrounded tab the outgoing poster starts the swap at full opacity and eases to 0 over 500ms while the href is already the new title — a ~500ms mismatch window every 4000ms (12.5% of the cycle), plus the finger-in-flight window before touchstart lands.
Clicking dot 4 on the live page flipped t

---

### S1-005 — Primary navigation and carousel controls are far below a usable tap-target size: hero/Reality dot indicators are 6x6 CSS px (20x6 when active) and category-strip tab buttons are 32px tall. Footer social icons on the same

*Raised by S1 — Discover / Home. The `/` route as s*

**Reproduction.** 1. Open https://www.verzatv.com/ on a phone. 2. Try to jump to hero slide 4 by tapping its dot. The dot is 6x6 px; the nearest neighbours are 6px away. 3. Try to tap a category label near its top or bottom edge — the button box is 32px tall, the 8px of surrounding padding belongs to the parent and is not part of the target.

**Evidence.** Measured on production, computed bounding boxes: hero dots (components/BrowsePage.tsx:1062-1068) 6x6, active 20x6 — same for the Reality dots (BrowsePage.tsx:856); category tab buttons (components/CategoryTabs.tsx:203-227) DRAMA 69x32, HOT 38x32, Tubi 76x36, ANIME 60x32, ESPAÑOL 84x32, BOLLYWOOD 115x32, REALITY 78x32, CREATORS 97x32, RED CARPET 112x32, MUSIC 60x32; header language and search buttons 36x36; footer social links 18x18; bottom nav 74x41; Anime empty-state "Browse Drama" CTA 125x36. Grid tiles (119x221) and the hero link (394x480) are fine. iOS HIG minimum is 44x44, Android 48x48.

**Independent verification.** CONFIRMED — the core mechanism reproduces in the DEPLOYED artifacts, though two of the raiser's sub-claims are wrong and one piece of their evidence is meaningless.

WHAT I DID AND SAW

1. Deployed JS chunk https://www.verzatv.com/_next/static/immutable/chunks/1aseb4gggkekc.js (the BrowsePage chunk; it is the only chunk containing "hero-crossfade") contains, verbatim:
   `setInterval(()=>T(e=>(e+1)%K),4e3);return()=>clearInterval(e)},[K,$]`  → auto-advance every 4000 ms, live.
   `href:(0,d.posterHref)(_)` on the hero `<a class="block transition-transform duration-200 ease-out active:scale-[0.98]">` where `_` is `heroSlides[heroIdx % len]` → the link target is a pure function of the auto-advancing index, so it flips in the SAME React commit as the index.
   `className:"object-contain hero-crossfade",style:{opacity:+(r===s)}` → the visual swap is an opacity transition, not an instant swap.
2. Deployed CSS https://www.verzatv.com/_next/static/immutable/chunks/1b0rux1xv-mpp.css contains `.hero-crossfade{transition:opacity .5s ease-in-out}`. Ease-in-out means the outgoing poster is the MORE visible of the two layers for the first ~250 ms and is still partly on screen for the full 500 m

---

### S1-006 — The rendered home page has no <h1> and no <h2> at all. The only h1 lives inside the <noscript> crawler block, which is not exposed to a JS-enabled browser's accessibility tree, so a screen-reader user gets zero document 

*Raised by S1 — Discover / Home. The `/` route as s*

**Reproduction.** 1. Open https://www.verzatv.com/ with JS enabled. 2. Run a heading-outline check (or `document.querySelectorAll('h1,h2').length`) — it returns 0. 3. Navigate the page with VoiceOver's heading rotor: there are no headings to move between.

**Evidence.** Live DOM readback on production: `{h1:[], h2:[], landmarks:{header:1,main:1,nav:1,footer:1}}`. Shipped HTML (curl https://www.verzatv.com/): outside <noscript> there are zero `<h1>` and zero `<h2>` matches; inside <noscript> there is exactly one, `VERZA TV — 91 Live Series` (app/page.tsx:35-37). The tab-content h2s that do exist are conditional — "Continue Watching" (BrowsePage.tsx:617) only when the rail has rows, "The Carpet" (BrowsePage.tsx:942) only on Red Carpet.

**Independent verification.** Reproduced on production, twice, two ways.

1) Shipped HTML. curl https://www.verzatv.com/ (231,291 bytes, fetched today). Script-classified every heading by byte position against the two <noscript> ranges: 1 <h1> ("VERZA TV - 91 Live Series") and 10 <h2> (the ten tab labels) exist, and ALL 11 are inside <noscript>. Outside <noscript>: h1=0, h2=0, h3-h6=0, role="heading"=0, aria-level=0 - against 25 /series/ links and landmarks header:1 main:1 nav:1 footer:1. Matches the raiser's evidence exactly.

2) Live JS-enabled DOM in Chrome, fresh tab, 2.5s settle, deployed bundle hydrated (main present, 25 series links, tiles rendered): {h1: [], h2: [], h3:0,h4:0,h5:0,h6:0, roleHeading: [], ariaLevel: 0, ariaLabelledby: 0, landmarks:{header:1,main:1,nav:1,footer:1,section:1}}. document.querySelectorAll('h1,h2').length === 0.

3) Proved the noscript h1 is inert rather than merely hidden: both <noscript> nodes report children.length === 0 while textContent still contains the literal string "<h1". The browser keeps it as text, so it is not a DOM element and never reaches the accessibility tree. The crawler block is doing nothing for AT users.

4) Tab-state sweep, since the raiser's own evidenc

---

### S1-009 — The home page footer links to a YouTube channel that does not exist. https://www.youtube.com/@VerzaTV returns HTTP 404 from YouTube's edge, identically to a made-up handle, while a real handle returns 200.

*Raised by S1 — Discover / Home. The `/` route as s*

**Reproduction.** 1. Open https://www.verzatv.com/ and scroll to the footer social row. 2. Tap the YouTube icon. YouTube shows its 404 page.

**Evidence.** Negative-controlled with the same UA and follow-redirects: https://www.youtube.com/@MrBeast → 200, size 1338445; https://www.youtube.com/@thischannelshouldnotexist99887766 → 404, size 755; https://www.youtube.com/@VerzaTV → 404, size 755. Variants also 404: @verzatv, @verza_tv, @VERZATV, /c/VerzaTV. Control that the probe works at all: https://www.youtube.com/results?search_query=verza+tv → 200. The other four social links on the same row were verified live and are fine: instagram.com/verzatv 200; tiktok.com/@verzatv renders "VerzaTV · 384 Followers"; x.com/VerzaTV 200; facebook.com/VerzaTV renders "Verza TV · 202 followers" (curl reports 400 for every Facebook URL including a control, so th

**Independent verification.** CONFIRMED on live production, with the defect sharper than the raiser's own repro.

DEPLOYED BUNDLE (all 14 chunks pulled from www.verzatv.com, not the build): TAB_KEYS ships with exactly six entries — drama:"tab.drama",new:"tab.new",popular:"tab.popular",music:"tab.music",reality:"tab.reality","red-carpet":"tab.redCarpet". grep for tab.anime|tab.creators|tab.espanol|tab.bollywood|tab.tubi across every shipped chunk returns ZERO hits, so no locale can translate those. The Anime panel ships as raw literals with no t() wrapper: children:[Z," is coming soon"], "We're lining up the first titles for this section. Everything else on VERZA is ready to watch right now.", and a "Browse Drama" button.

LIVE READBACK (localStorage verza-lang set, then reload):
- es -> DRAMA / HOT / [Tubi logo] / ANIME / ESPANOL / BOLLYWOOD / REALITY / CREATORS / ALFOMBRA ROJA / MUSICA
- ja -> DORAMA(katakana) / HOT / [Tubi logo] / ANIME / ESPANOL / BOLLYWOOD / RIARITI(katakana) / CREATORS / REDDO KAAPETTO(katakana) / ONGAKU(kanji)
- ar -> Arabic drama / HOT / [Tubi logo] / ANIME / ESPANOL / BOLLYWOOD / Arabic reality / CREATORS / Arabic red carpet / Arabic music
- Tapping ANIME at ja: panel reads "Anime is co

---

### S1-010 — A category label truncates mid-word at the two most common phone widths, and 6 of the 10 categories sit entirely off-screen at rest at every width tested. The 28px edge fade is the only affordance that the strip continue

*Raised by S1 — Discover / Home. The `/` route as s*

**Reproduction.** 1. Open https://www.verzatv.com/ at 390px. The strip ends in "ESPAÑ" cut against the right edge. 2. At 375px it ends in "ESP". 3. At 320px, 375px, 390px and 430px, Bollywood, Reality, Creators, Red Carpet and Music are never visible without scrolling the strip.

**Evidence.** Measured intrinsic label widths on production (EN) with the strip's own px-4 (16px) and gap-5 (20px): DRAMA 69, HOT 38, Tubi 76, ANIME 60, ESPAÑOL 84, BOLLYWOOD 115, REALITY 78, CREATORS 97, RED CARPET 112, MUSIC 60; track 1000px in a 394px rail. Visible run at scrollLeft 0 — 320px: DRAMA/HOT/Tubi/ANIME full, 6 off-screen, no mid-word cut; 375px: ESPAÑOL clipped at 36 of 84px; 390px: ESPAÑOL clipped at 51 of 84px; 430px: ESPAÑOL full, BOLLYWOOD off. The right-hand fade is painted correctly (computed opacity 1 right / 0 left, components/CategoryTabs.tsx:239-256), and the strip is genuinely scrollable (rail.scrollTo({left:400,behavior:'instant'}) lands at 400, scrollWidth 1057 vs clientWidth 3

**Independent verification.** CONFIRMED, and the real cause is worse than the raiser described: the channel exists, the site links to the wrong handle.

WHAT I DID (all against the deployed site, not the build):

1. Fetched https://www.verzatv.com/ with an iPhone Safari UA (200, 231,291 bytes) and grepped the served HTML. The footer social row renders a real anchor:
   <a href="https://www.youtube.com/@VerzaTV" target="_blank" rel="noopener noreferrer" title="YouTube" ...>
   Not hidden, not behind JSON — a live, tappable link in the served markup.

2. Probed the deployed link with negative controls, same Chrome UA, follow-redirects:
   - https://www.youtube.com/@MrBeast -> 200, 1,338,321 bytes (probe works for a real handle)
   - https://www.youtube.com/@thischannelshouldnotexist99887766 -> 404, 755 bytes
   - https://www.youtube.com/@VerzaTV -> 404, 755 bytes (byte-identical to the garbage-handle control)
   - Variants @verzatv, /c/VerzaTV, /VerzaTV, /user/VerzaTV, @Verza-TV -> all 404, 755 bytes
   - https://www.youtube.com/results?search_query=verza+tv -> 200 (not an IP/bot block)
   Body of the 404 is YouTube's genuine error page: <title>404 Not Found</title> with an iframe to /error?src=404. So the handle

---

### S2-006 — ShortsFeed and HorizontalFeed retry fatal media errors without any bound and show no failure UI, which is the unbounded-rebuild pattern the main player deliberately caps at two.

*Raised by S2 — PLAYER / SHORTS: the vertical rail *

**Reproduction.** Force a fatal MEDIA_ERROR on /shorts (corrupt segment, decoder pressure). recoverMediaError() is called on every occurrence with no counter, no codec swap, no reattach ceiling and no user-visible error; the poster thumbnail simply stays forever.

**Evidence.** components/ShortsFeed.tsx:356 - `else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) hls.recoverMediaError();` - and components/HorizontalFeed.tsx:100, identical. Compare components/EpisodeFeed.tsx:849-861, which bounds to `mediaRecoveriesRef.current < 2`, then swapAudioCodec() once, then fullReattach() bounded to 2 - a bound whose stated reason is the allocation burst recorded as P2 in docs/handoff/IOS-CONTENT-PROCESS-CRASH.md. Neither Shorts nor Horizontal has any sourceError equivalent: EpisodeFeed's failure state (components/EpisodeFeed.tsx:1126-1157) has no counterpart in either file.

**Independent verification.** CONFIRMED on the deployed site, with the second half of the claim killed as unreachable.

WHAT I DID AND SAW

1. Deployed HTML (not the build). `curl https://www.verzatv.com/shorts` with an iPhone UA — HTTP 200, x-nextjs-prerender: 1, 87,451 bytes. Stripping script/style/comments, the ENTIRE visible body text is 316 chars: "en Instagram TikTok X YouTube Facebook Get the app App Store iPhone & iPad Google Play Android Sitemap Become a Creator Support Terms of Service Privacy Policy Refund Policy Help & Support Press About (c) 2026 VERZA TV. All rights reserved. Microdramas, Reality & More. Discover Shorts Shop Library Profile" — header chrome, footer, bottom nav. `episode-immersive` occurs 0 times. The 4 stream.mux.com / 4 image.mux.com hits are all preconnect/dns-prefetch <link>s, not content. The served markup is literally `<main class="flex-1 pb-16"><div style="background:#07070E">` followed immediately by the JSON-LD script and then </div> — an empty main.

2. Code, at the exact lines cited. /Users/jothamhall/E! CREATOR ECONOMY/verza-tv/components/ShortsFeed.tsx:422 is `if (shuffled.length === 0) return null;`. `shuffled` is `useState<Series[]>([])` at :161 and is written nowher

---

### S2-009 — Every failure state a viewer can hit inside the player is English-only in all 20 locales, including the route error boundary that stands in for the paywall when the feed throws.

*Raised by S2 — PLAYER / SHORTS: the vertical rail *

**Reproduction.** Set the app language to Spanish and force a playback failure (or a render throw) on an episode. The surrounding paywall is Spanish; the error is English.

**Evidence.** app/series/[slug]/[episode]/error.tsx:56 "This episode didn't load", :57 "Something went wrong on our side. Your place in the series is saved.", :66 "Try again", :73 "Back to browse" - all literals, though the boundary renders inside the layout so useTranslation() is available. In-slide failure UI: components/EpisodeFeed.tsx:302 and :647 "We could not load this episode.", :691 "This episode will not play.", :1139 "Your purchase is safe. This is a playback problem on our side.", :1148 "Try again", :1155 "Back to browsing". A translated `content.tryAgain` already exists in all 20 locales and is rendered nowhere. Separately, "Your place in the series is saved" is a promise the boundary cannot k

**Independent verification.** CONFIRMED in the live bundle on www.verzatv.com, not just in source.

WHAT I DID
1. Locales are real: /Users/jothamhall/E! CREATOR ECONOMY/verza-tv/lib/i18n.ts declares exactly 20 (en es fr pt de it ja ko zh hi ar ru tr pl nl th vi id tl sw).
2. Fetched the real episode route https://www.verzatv.com/series/the-mistress-trap/1 (HTTP 200; the-mistress-trap is a real live catalog row — lib/catalog.ts has 96 slugs, matching the stated 96). Pulled every /_next/static/immutable/chunks/*.js it references and grepped them.
3. Route error boundary: /Users/jothamhall/E! CREATOR ECONOMY/verza-tv/app/series/[slug]/[episode]/error.tsx is the ONLY error.tsx or global-error.tsx in the whole app. Lines 55, 57, 66, 73 are bare English JSX children. Shipped verbatim in chunk 118nmsh16h8tr.js, which is referenced twice by that episode page's HTML: `("h1",{className:"text-lg font-bold mb-2",children:"This episode didn't load"})` — a plain literal, no t() call anywhere in the file (it does not even import useTranslation).
4. useTranslation IS available there, as the finding claims: LangProvider wraps the tree at app/layout.tsx:139, and the episode error.tsx renders inside the root layout. There is no i

---

### S4-001 — /search?q=a&q=b returns HTTP 500 and a completely blank page. A repeated q parameter makes Next hand searchParams.q an array; q?.trim() throws in both generateMetadata and the page body. There is no error boundary on the

*Raised by S4 — SEARCH. The four catalogue-search s*

**Reproduction.** curl -s -o /dev/null -w '%{http_code}' 'https://www.verzatv.com/search?q=a&q=b' → 500. Deterministic across 3 attempts. Also 500 for ?q=pasion&q=espanol, ?q=&q=, ?q=pasion&q=pasion. Single q is 200; ?q[]=pasion and ?foo=1&q=pasion are 200. Rendering the page and stripping tags/scripts yields an empty string — no headline, no message, no link.

**Evidence.** app/search/page.tsx:13 `type Props = { searchParams: Promise<{ q?: string }> }`; :16-17 `const { q } = await searchParams; const query = q?.trim() ?? ""` (generateMetadata); :53-54 the same two lines in the page body. Production body carries `id="__next_error__"` and digests 3143474394 / 142849278; no stack leaked. /search is listed in app/sitemaps/pages.xml/route.ts:17 at priority 0.7 and is the target of the WebSite SearchAction in lib/seo/schema.ts:91, so it is a crawled, publicly advertised URL. `find app -name error.tsx` returns only app/series/[slug]/[episode]/error.tsx.

**Independent verification.** CONFIRMED against live production and against the code. Severity S3 is correct as claimed — no correction.

WHAT I DID / WHAT I SAW

1. Shipped HTML (curl https://www.verzatv.com/, 200, 231,291 bytes). Parsed the two <noscript> regions by byte offset rather than string-matching. Result: h1 total=1, inside_noscript=1, outside=0. h2 total=10, inside_noscript=10, outside=0. h3–h6 total=0. role="heading" total=0, aria-level total=0. The single h1 is `VERZA TV — 91 Live Series`; the ten h2s are the ten browse-tab labels (Drama, Hot, Tubi, Anime, …) — every one of them inside the crawler block. Zero headings of any kind exist outside <noscript>.

2. Live DOM, JS enabled (Chrome, real page load of https://www.verzatv.com/):
   {headingCount: 0, headings: [], ariaHeadingCount: 0, noscriptCount: 2, noscriptChildElementCounts: [{children:0, textLen:140, h1inside:0}, {children:0, textLen:19827, h1inside:0}], landmarks:{header:1,main:1,nav:1,footer:1}, linkCount:47, buttonCount:19, activeTab:"Drama"}
   This is the load-bearing observation, not the assignment: `document.querySelectorAll('h1,h2,h3,h4,h5,h6').length === 0` AND the <noscript> elements report `children: 0` with ~19.8 KB of text — 

---

### S4-003 — None of the 5 coming-soon rows is reachable from any search surface. All three shipped surfaces search a live-only pool, so an exact-title search for a title that has art on a revenue tab and a 200 show page returns "No 

*Raised by S4 — SEARCH. The four catalogue-search s*

**Reproduction.** Production: /search?q=The%20Chairman%27s%20Revenge → 0 results; /search?q=chairman → 0; /search?q=protected%20by%20the%20devil → 0; /search?q=the%20last%20will → 0; /search?q=apron → 0; /search?q=jardinero → 0. Meanwhile /series/the-chairmans-revenge, /series/protected-by-the-devil, /series/the-last-will, /series/the-billionaires-apron and /series/i-cant-resist-my-mansion-gardener all return 200. Matched against the full catalogue the matcher finds all 5 by exact title (5/5), so the exclusion is purely the pool filter.

**Evidence.** app/search/page.tsx:44 `.filter((s) => s.status === "live")`; components/SearchButton.tsx:17 `const series = getLiveSeries()`; app/discover/page.tsx:32 passes `live`. lib/series-href.ts:47-62 states the show page is "the landing page for search traffic" and that these five rows "genuinely have a page here… Verified 200 on production for all five" — search is the one surface that does not honour it. Illustrative: /search?q=mansi%C3%B3n returns 1 result, The Haunted Sisters (an English gothic drama matched on the SEARCH_TAGS word "mansion"), and not the Spanish title that literally contains "mansión".

**Independent verification.** CONFIRMED, and extended: the channel is not missing, the handle is wrong.

WHAT I DID

1) Code. The href appears twice in the repo, both literal "https://www.youtube.com/@VerzaTV":
   - /Users/jothamhall/E! CREATOR ECONOMY/verza-tv/components/Footer.tsx:38  (footer social icon row)
   - /Users/jothamhall/E! CREATOR ECONOMY/verza-tv/lib/data/sitemap.ts:224   ("Shorts & Social" in the sitemap sheet)
   No other occurrence outside docs/audit/00-manifest.json:4440. No ../verza-native checkout exists on this machine, so I could not check the native client.

2) Deployed bundle, not the build (rule 4). Fetched https://www.verzatv.com/ and grepped the served HTML. The rendered anchor is exactly:
   <a href="https://www.youtube.com/@VerzaTV" target="_blank" rel="noopener noreferrer" title="YouTube" class="flex items-center gap-1.5 ..." style="color:#F5F4F8;...">
   Counted rendered anchors per page: / =1, /about =1, /support =1, /shop =1, /press =1, /help =1, /shorts =1, /series/storage-pirates =1, /sitemap =2 (footer icon + the sitemap sheet's text link). So this is on the footer of every page, not only home. All those pages returned 200.

3) Independent negative-controlled probe, same UA 

---

### S4-004 — There is no relevance ranking. Results are emitted in raw catalogue-array order, so an exact title match can sit near the bottom of the list. Searching the exact name "The CEO" puts The CEO 9th of 10 results, in the thir

*Raised by S4 — SEARCH. The four catalogue-search s*

**Reproduction.** Search "the ceo" → 10 results in this order: Collateral Hearts, The Marriage Contract, Married to a Stranger, Cleopatra, Never Mess with a Badass Girl, Help! I'm Falling in Love with My Rude CEO, One Night Stand, The Billionaire's Lost Love, **The CEO**, Billionaire Daughter's Love Triangle. Search "killer romance" → The Killer Caregiver first, Killer Romance second. Search "one night stand" → correct only by catalogue accident.

**Evidence.** lib/search-index.ts:136-143 returns a boolean; every call site is a bare `.filter()` with no sort — app/search/page.tsx:43-45, components/SearchButton.tsx:29, components/SearchBar.tsx:23, components/FeedSearch.tsx:23. Measured across 13 exact-title probes: 2 landed at a non-zero index, 2 have no exact-title row at all.

**Independent verification.** CONFIRMED in source, in the deployed bundle, and live in a real browser. Severity S3 stands.

WHAT I DID

1. Source. /Users/jothamhall/E! CREATOR ECONOMY/verza-tv/components/CategoryTabs.tsx:14-21 — TAB_KEYS has exactly 6 entries (drama, new, popular, music, reality, red-carpet). Line 50-53 labelFor returns `tab.label` when unmapped. lib/catalog.ts:19-41 BROWSE_TABS holds the English literals. components/BrowsePage.tsx:248 `const activeTabs = BROWSE_TABS;` and :610 `<CategoryTabs ... tabs={activeTabs} />` — no translated tabs prop exists anywhere, so the fallback is the only path for unmapped tabs.

2. Dictionary. In lib/i18n.ts, `grep -c` gives tab.drama 21 (interface + 20 locales) and tab.anime / tab.espanol / tab.bollywood / tab.creators / tab.tubi = 0 each. 20 locale dicts confirmed (const en..sw, lines 169-1119) against the 20-entry LOCALES table (lines 11-32).

3. Deployed bundle (rule 4, fetched from www.verzatv.com, dpl_7L9CxaoUDHn95y2P125xTMAVAWAj). Pulled the 14 chunks the homepage loads. chunks/1aseb4gggkekc.js ships the live map verbatim: `n={drama:"tab.drama",new:"tab.new",popular:"tab.popular",music:"tab.music",reality:"tab.reality","red-carpet":"tab.redCarpet"}`. chu

---

### S4-006 — Every user-visible string in the search experience is hard-coded English. Zero of the 115 i18n keys covers search, and none of the four surfaces imports the translation hook — so 18 distinct strings render English in all

*Raised by S4 — SEARCH. The four catalogue-search s*

**Reproduction.** Switch the language to Español (or हिन्दी, العربية) via the header dropdown, then tap search. Placeholder reads "Search by show, genre, or keyword...", the dismiss button reads "Cancel", the count reads "5 results for …", the empty state reads "No results for …". /search reads "Search Micro-Dramas", "91 series found", "Try "billionaire", "revenge", or "thriller"", "Try a different keyword or browse by genre on the Discover page."

**Evidence.** `awk '/^export interface Translations/,/^}/' lib/i18n.ts | grep -c '": string;'` → 115; grepping the same block for search/discover returns only `"nav.discover"`. `grep -n 'useT|useI18n|t("' components/SearchButton.tsx components/SearchBar.tsx components/FeedSearch.tsx app/search/page.tsx` → no matches. Strings counted on the three shipped surfaces: SearchButton 5 (SearchButton.tsx:55,101,107,119,157), SearchBar 3 (:46,102,119), /search 10 (page.tsx:21,23,29-30,77,81,86,111,143,146-147,159,162-170,222-226) = 18 × 20 locales = 360 cells, 342 of them wrong. scripts/test-feed-integrity.mjs already carries check 10d for exactly this class of bug on the paywall; search has no equivalent.

**Independent verification.** CONFIRMED against the deployed bundle at https://www.verzatv.com (not the build). Every number in the finding reproduces; I found no measurement that was wrong.

WHAT I DID. Opened www.verzatv.com in Chrome and read live getBoundingClientRect values off the rendered 394px app-shell, then probed the real hit regions with document.elementFromPoint rather than reading CSS — the assignment is not the effect.

WHAT I SAW (all measured on production).
- Hero dots (components/BrowsePage.tsx:1059-1077): 6.0x6.0, active 20.0x6.0, computed padding 0px, gap to each neighbour exactly 6.0px. Effect probe: sweeping a 45x45 px area centred on a dot (a realistic thumb contact patch), only 120/2025 sample points land on the dot = 5.9%; for an inactive 6x6 dot it is 36/2025 = 1.8%. The entire 6-dot cluster is ~80px wide and 6px tall, so one thumb covers all of it horizontally and overshoots ~7x vertically.
- Reality dots (BrowsePage.tsx:853-864, reached by clicking the Reality tab): 4 dots, identical 6x6 / 20x6.
- Category tabs (components/CategoryTabs.tsx:203-228), live boxes: Drama 69.0x31.5, Hot 38.3x31.5, Tubi 76.0x36.0, Anime 60.3x31.5, Español 83.7x31.5, Bollywood 114.8x31.5, Reality 77.7x31.5

---

### S4-011 — components/FeedSearch.tsx has no importer anywhere in the app and does not appear in any deployed chunk. Seven of the 20 interactive elements the manifest attributes to search surfaces are in a component that never rende

*Raised by S4 — SEARCH. The four catalogue-search s*

**Reproduction.** `grep -rn 'FeedSearch' --include='*.tsx' --include='*.ts' app components lib` returns only the file itself. Searching every chunk referenced by / and /discover for the string "Search shows..." (its placeholder) returns no file, while "Search series, genres..." and "Search by show, genre, or keyword..." are both found.

**Evidence.** Manifest items components/FeedSearch.tsx:46 (button), :47 (handler), :81 (input), :95 (button), :96 (handler), :109 (link), :114 (handler). Downloaded 20 deployed chunks; FeedSearch's placeholder is in none of them. Its own comment at :19-22 acknowledges it has no importer. It is not harmful — it correctly calls the shared matcher — but it is a fourth copy of the search UI that will drift.

**Independent verification.** Reproduced on all three arms; severity S3 is correct as claimed.

SOURCE. /Users/jothamhall/E! CREATOR ECONOMY/verza-tv/components/BrowsePage.tsx:841-851 — the Reality hero is `<div className="relative">` wrapping the sized card and an `<Image>`; no <Link>, no onClick, no role, no tabIndex. BrowsePage.tsx:986-990 is the Drama/Hot hero as `<Link href={posterHref(current)} onClick={posterClick}>`; BrowsePage.tsx:664-669 is the Music hero as a <Link>. All three cards use the identical style `aspectRatio:"2 / 3", width:"100%", maxWidth:"min(320px, 80vw)"`, so "identically sized" holds.

DEPLOYED BUNDLE (standing rule 4, not the local build). Fetched https://www.verzatv.com/?tab=reality (200) and its chunks; BrowsePage lives in /_next/static/immutable/chunks/1aseb4gggkekc.js on deployment dpl_7L9CxaoUDHn95y2P125xTMAVAWAj. The 320px hero card appears three times: offset 32226 (Music) and offset 40846 (Drama/Hot) are both wrapped in next/link with posterHref; offset 36310 (Reality) is `jsx("div",{className:"relative",children:jsx("div",{...card...,children:jsx(Image,{src:f.poster,alt:f.title,fill,priority,className:"object-cover"})})})` — bare, no link, no handler. Rotation confirmed in t

---

### S4-014 — The comment that justifies putting the slug in the search haystack states the wrong number: it says the five Español and six Bollywood rows are "all eleven" rows shipping without SEARCH_TAGS. The real count is 15 — it om

*Raised by S4 — SEARCH. The four catalogue-search s*

**Reproduction.** Diff Object.keys(SEARCH_TAGS) against the 91 live slugs: 76 tagged, 15 untagged.

**Evidence.** lib/search-index.ts:104-108 — "all eleven ship with no SEARCH_TAGS entry at all, so title/genre/logline were their entire index". Measured untagged set: im-obsessed-with-my-boss-2, storage-pirates, exes-premiere, love-awards, plus the 11 named. Standing rule 5 territory: the comment was true for a subset and reads as a total.

**Independent verification.** CONFIRMED — all three legs reproduced against production (www.verzatv.com) and against the code. Severity raised S4 -> S3.

LEG 1 — first paint is the wrong tab. Proven three independent ways, not by timing luck:
(a) Bytes. `curl https://www.verzatv.com/?tab=anime` vs `curl https://www.verzatv.com/` returned BYTE-IDENTICAL bodies (`cmp` -> identical, 231,291 bytes, `x-nextjs-prerender: 1`, `x-vercel-cache: HIT`). The shipped HTML carries `aria-current="page"` on the DRAMA button with `color:#E0115F`, and contains ZERO occurrences of "is coming soon" or "Browse Drama" (grep -c = 0/0). The query string cannot influence a prerendered page, so every viewer of /?tab=anime is served the Drama document.
(b) Render. I saved that exact production HTML, absolutized its asset URLs and neutered its `<script>` tags, served it from 127.0.0.1 and screenshotted it: the Drama tab is pink and underlined, the Drama hero carousel (6 dots) and the NEW-badged Drama grid render. That is literally the pre-hydration paint.
(c) Code path. components/BrowsePage.tsx:288 `useState<BrowseCategory>("drama")` is the only SSR value; :413 `syncTabFromUrl` runs inside a `useEffect` (:423-426, no dep array) and defer

---

### S4-016 — The /search empty state and its metadata both claim "Search 91+ micro-drama series" when exactly 91 are searchable and the "+" has nothing behind it — the five rows the number excludes are the ones search cannot reach at

*Raised by S4 — SEARCH. The four catalogue-search s*

**Reproduction.** Load /search with no query: the panel reads "Search 91+ micro-drama series". The page description reads "Search 91+ micro-drama series on VERZA TV by title, genre, or keyword." Searching returns at most 91.

**Evidence.** app/search/page.tsx:22-23 and :142-144, both interpolating `getLiveSeries().length`. Catalogue is 96 rows: 91 live + 5 coming-soon.

**Independent verification.** CONFIRMED on production, by direct measurement of the live DOM rather than by reading the source.

WHAT I DID

1. Code read. /Users/jothamhall/E! CREATOR ECONOMY/verza-tv/components/BrowsePage.tsx:479-483 is `setInterval(() => setHeroIdx(i => (i+1) % slideCount), 4000)`; :384 `const current = heroSlides[heroIdx % ...]`; :986-989 `<Link href={posterHref(current)}>`. The wrapper at :972-978 sets heroPaused on mouseenter/touchstart and clears it on mouseleave/touchend/touchcancel. All four cited line references are accurate at HEAD (147d0f9).

2. Auto-advance moves the link target — measured, not inferred. Polled the hero anchor's href once a second for 22s on https://www.verzatv.com/. It walked all six FEATURED_NEW targets and wrapped: help-im-falling-in-love-with-my-rude-ceo -> tied-by-fate -> twist-of-time -> the-inheritance-game -> billionaire-daughters-love-triangle -> lost-and-found -> help-im-falling..., roughly every 4s.

3. THE DISPOSITIVE MEASUREMENT. Attached a MutationObserver to the hero subtree filtered on the `href` attribute and, inside the observer callback (same microtask as the React commit, before any frame is presented), read every layer's computed opacity and its

---

### S4-018 — Consistency drift across the search surfaces and their entry points: the /search input omits enterKeyHint="search" that the header input has; the sub-2-character state differs three ways (header shows nothing, /discover 

*Raised by S4 — SEARCH. The four catalogue-search s*

**Reproduction.** Production /search?q=a → "0 series found" and the No-results panel, although searchCatalog returned [] on the length guard without consulting the catalogue. Header search with "a" typed → the results region is not rendered at all. /discover with "a" typed → nothing. Footer sitemap → "Search" under Watch and "Search" under Support, same href.

**Evidence.** app/search/page.tsx:41 `if (!query || query.length < 2) return []` feeding the `query && results.length === 0` branch at :153; :107-118 input has no enterKeyHint (cf. components/SearchButton.tsx:98). lib/data/sitemap.ts:105 and :232 both `{ label: "Search", href: "/search" }`. app/discover/page.tsx:32 renders <SearchBar/> whose links use posterHref (→ /series/<slug>/1) while the All Series list below writes `href={`/series/${series.slug}`}` as a literal — 91 show-page links on /discover, 0 player links, the opposite of the dropdown above it. The feed-integrity gate at scripts/test-feed-integrity.mjs:936-951 only asserts that SearchBar.tsx itself calls posterHref, so it does not see the page 

**Independent verification.** CONFIRMED — both halves of the claim reproduce. Severity S3 stands.

WHAT I DID / SAW

1) Code. /Users/jothamhall/E! CREATOR ECONOMY/verza-tv/components/HorizontalBackButton.tsx:6-8 is verbatim `<button onClick={() => { window.location.href = "/?tab=reality"; }}>`. It is the page's ONLY exit affordance: app/horizontal/page.tsx:18 renders it, and I grepped components/HorizontalFeed.tsx for href/Link/back — it contains no back control of its own.

2) Production, not the build (standing rule 4). `curl https://www.verzatv.com/horizontal` → HTTP 200, 94,551 bytes. The served HTML ships, verbatim:
  `<button class="flex items-center gap-2 border-0 bg-transparent cursor-pointer p-0"><svg …><span … >Storage Pirates</span></button>`
No href. No inline onclick. Decisively: the string `tab=reality` occurs ZERO times in the served HTML — I grepped and counted. The destination exists only inside JS chunk /_next/static/immutable/chunks/1784bepepsm-x.js (I fetched all 13 chunks and located it). So pre-hydration the document does not contain the destination at all; the tap has nothing to land on. 13 chunks, ~328 KB as served, must download/parse/hydrate first — on a route that mounts 15 HLS-capabl

---

### S5-004 — A signed-out buyer who taps the paywall's $1.99 CTA is bounced to a generic /sign-in with no purchase context, and that page's "Continue as Guest" link discards the next param and dumps them on the home page — losing bot

*Raised by S5 — Shop and commerce. Agent C's actual · **touches money or the shipped rail***

**Reproduction.** 1. Signed out, open https://www.verzatv.com/series/the-mistress-trap/6. 2. Tap "Series Unlock — $1.99 one-time". 3. You land on /sign-in?next=%2Fseries%2Fthe-mistress-trap%2F6 whose copy reads "Sign in to VERZA TV / Stream micro-dramas, track your library, and more" — no mention of the purchase in flight. 4. Tap "Continue as Guest" — you are sent to "/" , not back to episode 6, and no purchase is possible. 5. Or sign in: `next` returns you to episode 6, the paywall fires again, and you must find and tap the CTA a second time.

**Evidence.** Measured live 2026-08-29: clicking the production CTA moved the tab to https://www.verzatv.com/sign-in?next=%2Fseries%2Fthe-mistress-trap%2F6 with body text "Sign in to VERZA TV Stream micro-dramas, track your library, and more … Continue as Guest". lib/checkout-auth.ts:26 `window.location.assign(\`/sign-in?next=${encodeURIComponent(next)}\`)`. app/sign-in/page.tsx:169-174 — the Continue as Guest control is `<Link href="/">`, a hard-coded literal that ignores the `next` search param entirely. components/EpisodeFeed.tsx:2569 `if (!(await requireCheckoutUser())) return;` runs before the fetch, so no checkout is ever attempted for a guest.

**Independent verification.** Reproduced live on www.verzatv.com; severity corrected S2 -> S3 because the purchase is NOT blocked.

WHAT I DID AND SAW (all against the deployed site, not the build):

1. Real data first. lib/catalog.ts: slug "the-mistress-trap" is a real live PAID row, title "The Escort They Framed", freeEpisodes 5, coinPerEpisode 49; lib/mux-map.ts has 61 episode entries. EpisodeFeed.tsx:1422 `bound = Math.max(freeEpisodes + 1, startIdx + 1)` and :2150 `blocked={!ep.isFree && !authFree}` -> deep-linking /6 gives startIdx 5, bound 6, and slide 6 is locked. The repro URL really is a paywall slide.

2. Redirect verified IN THE DEPLOYED BUNDLE, not the source. Downloaded the 16 chunks referenced by the live https://www.verzatv.com/series/the-mistress-trap/6 HTML. Chunk /_next/static/immutable/chunks/0oo5zhjmwzr5q.js contains verbatim:
   `let n=`${window.location.pathname}${window.location.search}`,o=e?.startsWith("/")&&!e.startsWith("//")?e:n.startsWith("//")?"/":n;return window.location.assign(`/sign-in?next=${encodeURIComponent(o)}`),!1}e.s(["requireCheckoutUser",0,i])`
   and the same chunk wires the paywall CTA: `children:K("paywall.oneTimeUnlock")})]}),!W&&(0,t.jsx)("button",{onClick:async()=

---

### S5-005 — Guest purchase does not exist anywhere in the codebase, and the pending_entitlements claim RPC that would attach one has zero callers — yet the standing dev checklist still lists "guest purchase → sign up with same email

*Raised by S5 — Shop and commerce. Agent C's actual · **touches money or the shipped rail***

**Reproduction.** 1. `grep -rn "claim_pending\|pending_ent" app lib components --include="*.ts" --include="*.tsx"` returns nothing — the function exists only in SQL. 2. Nothing in the codebase ever INSERTs into pending_entitlements. 3. POST https://www.verzatv.com/api/unlock with no cookie returns 401 {"error":"Authentication required","code":"auth_required"} — so no unauthenticated Checkout session can exist to be claimed later.

**Evidence.** supabase/migrations/010_payment_integrity.sql:464 defines public.claim_pending_entitlements(uuid, text) and :532 grants execute to service_role; supabase/migrations/006_saved_list_pending_entitlements.sql:37 creates the table. No TypeScript file references either. app/api/unlock/route.ts:93-96 `const user = await getUser(); if (!user) return privateJson({error:"Authentication required", code:"auth_required"}, {status:401})` — verified against production (401, x-ratelimit-limit: 15). docs/reports/DEV-REPORT-CURRENT.md:119 still carries the unticked box "Guest purchase → sign up with the same email → entitlement claimed from pending_entitlements".

**Independent verification.** Both mechanisms reproduce in the DEPLOYED production artifacts, but the raiser's consequence clause is wrong and the severity is one notch too high.

WHAT I DID AND SAW (www.verzatv.com, 2026-08-29)

1. Repro target is real. /Users/jothamhall/E! CREATOR ECONOMY/verza-tv/lib/catalog.ts:100-109 — the-mistress-trap, status "live", episodeCount 48, freeEpisodes 5 — so episode 6 IS the first locked episode, the paywall slide. https://www.verzatv.com/series/the-mistress-trap/6 -> HTTP 200.

2. Verified the CTA in the deployed JS chunk (not the build). Pulled all 16 chunks referenced by the live ep-6 HTML. The $1.99 handler ships verbatim as:
   onClick:async()=>{if(!await (0,l.requireCheckoutUser)())return;...fetch("/api/unlock"...)}
   requireCheckoutUser is the FIRST statement — before trackUnlockClick, before any loading state. And the deployed helper ships verbatim as:
   o=e?.startsWith("/")&&!e.startsWith("//")?e:n.startsWith("//")?"/":n;return window.location.assign(`/sign-in?next=${encodeURIComponent(o)}`),!1
   So a signed-out tap on the price button is an immediate hard navigation to /sign-in?next=/series/the-mistress-trap/6. Matches lib/checkout-auth.ts:26.

3. Fetched the liv

---

### S5-011 — The Amazon affiliate bag pill floats over the paywall's "Go Back" button — an ad control partially occluding the payment screen's only exit, which is one of the named do-not-regress assets.

*Raised by S5 — Shop and commerce. Agent C's actual · **touches money or the shipped rail***

**Reproduction.** 1. On https://www.verzatv.com/shop tap any Amazon tile, then "Add to bag". 2. Close the drawer ("Keep shopping"). 3. Navigate to https://www.verzatv.com/series/the-mistress-trap/6. 4. The orange "1 in bag" pill renders over the bottom-right corner of the Go Back button.

**Evidence.** Measured live 2026-08-29 at a 606px viewport: pill {x:405,y:460,w:102,h:40,z:60}, Go Back {x:183,y:485,w:241,h:50,z:60} → overlap x 405-424, y 485-500; document.elementFromPoint at the pill's centre returns the pill, not the anchor. The pill wins the z-60 tie purely by DOM order. At the 440px app-shell width the geometry is worse: the bag layer is right-aligned within max-width 440 with px-4 (pill spans x 322-424) while the paywall's max-w-xs/px-8 column spans x 92-348, so the overlap grows to ~26px. components/AmazonBag.tsx:38 `.amazon-bag-layer` (position fixed, z-index 60, bottom 84px), mounted unconditionally at app/layout.tsx:159; components/EpisodeFeed.tsx:2503 the paywall overlay is `

**Independent verification.** REPRODUCED ON PRODUCTION, live 2026-08-29.

WHAT I DID
1. Deployed CSS (https://www.verzatv.com/_next/static/immutable/chunks/1y2muhl66_cr7.css) shipped: `.amazon-bag-layer{z-index:60;position:fixed}` / desktop `position:absolute`; `.amazon-bag-fab{bottom:calc(84px + env(safe-area-inset-bottom,0px))}` / desktop `bottom:88px`; `.episode-immersive{z-index:50;position:fixed;inset:0}`. The `:has(.episode-immersive)` block suppresses `header`, `footer`, `.bottom-nav` and `.device-nav-dock` — and NOT `.amazon-bag-layer`. That omission is the whole bug: every other piece of app chrome is stripped on the immersive episode route, the bag layer was never added to the list. Source: BagButton in components/AmazonBag.tsx, mounted globally at app/layout.tsx:159 inside `.device-frame`, so it renders on every route whenever itemCount>0 (persisted localStorage key `verza-amazon-bag`).
2. Real browser, real prod page https://www.verzatv.com/series/the-mistress-trap/6, signed out, bag holding a real catalog item (amzn-medicube-pore-pads). Paywall rendered normally ("Unlock All Episodes / $1.99 one-time Series Unlock / Secure checkout via Stripe / Go Back").

WHAT I SAW — 606x723 viewport: pill rect x

---

### S5-012 — /me renders a "SUBSCRIPTION" section header with nothing underneath it, on every visit, for every viewer.

*Raised by S5 — Shop and commerce. Agent C's actual*

**Reproduction.** Open https://www.verzatv.com/me signed out or signed in without VIP. Between the "Start Watching" card and the "LIBRARY" section there is a bare "SUBSCRIPTION" label and no content.

**Evidence.** Deployed /me HTML (fetched 2026-08-29) contains `<p …>Subscription</p><p …>Library</p>` as immediate siblings — nothing between them. app/me/page.tsx:291-297 renders `<SectionLabel>Subscription</SectionLabel>` unconditionally and then `<VipCard checkoutEnabled={subscriptionCheckoutEnabled} …/>`; components/VipCard.tsx:122 `if (!isVip && (iosApp || !checkoutEnabled)) return null;`. checkoutEnabled is vipSubscriptionCheckoutEnabled() (lib/vip-release-policy.ts:27), which is false in production — confirmed independently by POST /api/subscribe {"plan":"monthly"} → 503 {"error":"This VIP plan is not currently available"}.

**Independent verification.** REPRODUCED ON PRODUCTION (www.verzatv.com, 2026-08-29, Chrome, viewport 606x779 = the desktop iPhone-frame layout).

What I did, exactly:
1. /shop -> opened a product tile -> "Add to bag" -> "Keep shopping". Bag persisted as localStorage `verza-amazon-bag` = [{"id":"amzn-medicube-pore-pads","quantity":1}].
2. Navigated to /series/the-mistress-trap/6 (freeEpisodes=5, so ep 6 is the first locked one). Waited for the paywall. Confirmed it was the WEB paywall, not the iOS variant: `localStorage["verza-platform"]` was null and the CTA read "Series Unlock - $1.99 one-time".
3. Measured with getBoundingClientRect, repeated across three separate navigations with identical results:
   - "1 in bag" pill: x 381.5-484.0, y 625.1-664.6
   - "Go Back" anchor: x 182.7-423.3, y 583.2-633.4
   - Overlap rectangle: 41.8 x 8.3 px on the button's BOTTOM-RIGHT corner.
4. Hit-tested INSIDE the Go Back rect. document.elementFromPoint returned `BUTTON "1 in bag"` at (387,631), (399,626), (399,631), (411,626), (411,631) and at the overlap centroid (402.4, 629.3). Points just outside the pill's border-radius correctly fall through to the anchor.
5. Screenshot confirms it visually: the bright orange, undimme

---

### S5-013 — /press tells journalists the monetization model is "$1.99 one-time Series Unlock + VIP subscription" while /llms.txt on the same deployment says VIP checkout is not currently offered and /api/subscribe returns 503 for bo

*Raised by S5 — Shop and commerce. Agent C's actual · **touches money or the shipped rail***

**Reproduction.** 1. curl https://www.verzatv.com/press | grep Monetization → "$1.99 one-time Series Unlock + VIP subscription". 2. curl https://www.verzatv.com/llms.txt | grep -i vip → "VIP subscription checkout is not currently offered; do not infer availability from historical or technical material". 3. curl -X POST https://www.verzatv.com/api/subscribe -d '{"plan":"monthly"}' → 503.

**Evidence.** app/press/page.tsx:22 hard-codes the string; app/llms.txt/route.ts:31-32 branches on the release flag and prints the correct sentence. Both fetched from production 2026-08-29 and confirmed to disagree. Note also app/me/page.tsx:282 ("Free previews by title · $1.99 one-time Series Unlock") is honest and does not mention VIP — the press page is the outlier.

**Independent verification.** Reproduced on www.verzatv.com, 2026-08-29. Fetched https://www.verzatv.com/me twice (iPhone UA and default UA), signed out (`Sign in to sync your library and purchases` + `>Guest<` present; `x-vercel-cache: MISS`, `cache-control: private, no-store` — rendered per request, not a stale cache). Both responses contain, verbatim and adjacent: `<p class="text-[11px] font-semibold uppercase tracking-widest px-1 mb-2 mt-7" style="color:#6B6B7B">Subscription</p><p class="text-[11px] font-semibold uppercase tracking-widest px-1 mb-2 mt-7" style="color:#6B6B7B">Library</p>` — immediate siblings, nothing between. The SUBSCRIPTION label carries byte-identical class+style to the LIBRARY / CREATOR / SETTINGS labels, each of which visibly heads real content, so it is rendered and visible, not hidden.

Verified the effect, not the assignment, and confirmed the gate is off in the deployed environment by a second independent route: deployed https://www.verzatv.com/llms.txt line 12 reads "VIP subscription checkout is not currently offered". That line is emitted from vipSubscriptionCheckoutEnabled() (app/llms.txt/route.ts:13) — the same server call that feeds checkoutEnabled at app/me/page.tsx:236. It 

---

### S6-006 — A 'Sign Out' button is rendered to signed-out guests on /me, on a page whose own header says 'Guest - Sign in to sync your library and purchases'.

*Raised by S6 — My List / Library / Profile / Accou*

**Reproduction.** Load https://www.verzatv.com/me signed out and scroll to the bottom: 'Sign Out' is present and enabled. Tapping it runs signOutAction() against no session and redirects to /.

**Evidence.** app/me/page.tsx:425 renders <SignOutButton /> unconditionally, while line 426 renders <DeleteAccountButton expectedUserId={user?.id ?? null} /> which correctly returns null for a guest (components/ProfileDynamic.tsx:160). Live page text from the browser: header 'Guest / Sign in to sync your library and purchases' ... footer 'Sign Out'. The page already has `user` in scope at line 236.

**Independent verification.** Reproduced on the live domain, signed out, in three independent ways.

1) Raw HTML from production (no cookies): `curl https://www.verzatv.com/me` returns 200 with `cache-control: private, no-cache, no-store` (per-request render, not a stale cache). The body contains BOTH the guest header — `Guest` and `Sign in to sync your library and purchases` plus a `/sign-in` CTA — AND, in the footer block `<div class="mt-8 flex flex-col items-center gap-3">`, an enabled `<button ... style="...opacity:1">…Sign Out</button>`. No `disabled` attribute. `Delete Account` does NOT appear, so the guest-null guard on DeleteAccountButton is working and the SignOutButton is the only unguarded one.

2) Deployed bundle, not the build. Downloaded the chunk referenced by the live page, `/_next/static/immutable/chunks/0fkfn44ctjja6.js`, and read the shipped `SignOutButton`: `function(){let[e,i]=useState(!1),a=useRouter();return jsxs("button",{onClick:async()=>{i(!0);try{await o()}catch{...}},disabled:e,...` — the only thing that ever disables it is its own loading state. There is no user/session condition anywhere in the shipped component, so nothing hides it after hydration either.

3) Real browser, real cl

---

### S6-007 — /me renders a 'SUBSCRIPTION' section heading with nothing underneath it, because VipCard returns null whenever VIP checkout is disabled - which it is in production.

*Raised by S6 — My List / Library / Profile / Accou*

**Reproduction.** curl -s https://www.verzatv.com/me and look between the 'Start Watching' card and the 'Library' heading: <p ...>Subscription</p> is immediately followed by <p ...>Library</p>.

**Evidence.** Deployed HTML of /me: '...>Subscription</p><p class="text-[11px] font-semibold uppercase tracking-widest px-1 mb-2 mt-7" style="color:#6B6B7B">Library</p>'. The RSC payload in the same document shows the props: {"isVip":false,"vipExpiresAt":null,"cancelAtPeriodEnd":false,"checkoutEnabled":false,"yearlyCheckoutEnabled":false}. components/VipCard.tsx:122 - `if (!isVip && (iosApp || !checkoutEnabled)) return null;`. app/me/page.tsx:291 prints the SectionLabel outside that condition. The browser page text confirms an empty 'SUBSCRIPTION' block between 'Start Watching' and 'LIBRARY'.

**Independent verification.** Reproduced on the live site today (2026-08-29), in both the deployed HTML and the hydrated DOM.

1) `curl -s https://www.verzatv.com/me` (HTTP 200, 79,299 bytes). With <script> blocks stripped, the rendered body contains, verbatim and adjacent:
   `...>Subscription</p><p class="text-[11px] font-semibold uppercase tracking-widest px-1 mb-2 mt-7" style="color:#6B6B7B">Library</p><div class="rounded-xl overflow-hidden"...`
   Nothing is emitted between the two headings.

2) RSC payload in the same document confirms the props the server passed: `{"isVip":false,"vipExpiresAt":null,"cancelAtPeriodEnd":false,"checkoutEnabled":false,"yearlyCheckoutEnabled":false}` — so `checkoutEnabled` is genuinely false in production, not a build artifact.

3) Verified the EFFECT after hydration, not just the SSR string. Loaded https://www.verzatv.com/me in a real browser and measured the live DOM: the section labels are Subscription (top 299), Library (343), Settings (684), Support (880), Legal (1129). Every label's nextElementSibling is a DIV card EXCEPT "Subscription", whose nextElementSibling is `P:Library`. VipCard is a client component ("use client"), so it had mounted — it still renders nothing. S

---

### S6-008 — /library invents two channels that do not exist in the catalog and tells viewers they are 'coming soon' - including StorageBlue, whose show (Storage Pirates) is already live and playable.

*Raised by S6 — My List / Library / Profile / Accou*

**Reproduction.** Load https://www.verzatv.com/library (Channels tab). Cards render for 'StorageBlue - Coming Soon' and 'The Vertical Tea - Coming Soon', each with the empty state 'No titles on this channel yet.'

**Evidence.** components/LibraryPage.tsx:80 - allChannelNames = union of getChannels() and Object.keys(CHANNEL_META); CHANNEL_META still contains StorageBlue (:65) and 'The Vertical Tea' (:70). Verified against the real catalog offline: getChannels() returns exactly ["VERZA Originals","The Carpet"], and grep over lib/catalog.ts finds only `channel: "The Carpet"` (2 rows) and `channel: "VERZA Originals"` (94 rows). Live page text from /library: 'StorageBlue / Coming Soon / ... / StorageBlue is coming soon' and 'The Vertical Tea / Coming Soon / ... / The Vertical Tea is coming soon'. The same file's comment at :39-53 says these two 'are not channel values on any catalogue row'.

**Independent verification.** Reproduced on the live domain. curl https://www.verzatv.com/me returns HTTP 200 with cache-control: private, no-store and x-vercel-cache: MISS, so this is a live per-request render, not a stale build. In that HTML the Subscription section label is immediately followed by the Library label with nothing between them: `</a><p class="text-[11px] font-semibold uppercase tracking-widest px-1 mb-2 mt-7" style="color:#6B6B7B">Subscription</p><p class="text-[11px] ... mt-7" style="color:#6B6B7B">Library</p><div class="rounded-xl overflow-hidden"...`. The RSC payload in the same document shows the VipCard slot mounted with live props between those two <p> tags: {"isVip":false,"vipExpiresAt":null,"cancelAtPeriodEnd":false,"checkoutEnabled":false,"yearlyCheckoutEnabled":false}.

Verified the effect, not the assignment. components/VipCard.tsx:122 is `if (!isVip && (iosApp || !checkoutEnabled)) return null;`. Both isVip and checkoutEnabled are SERVER props, so hydration cannot fill the section in; iosApp only ever makes the null return more likely. app/me/page.tsx:291 renders `<SectionLabel>Subscription</SectionLabel>` unconditionally, outside any guard, so the heading survives while its only ch

---

### S6-013 — The entire account, library and auth surface is hard-coded English: 16 profile.* keys are translated into all 20 locales (320 i18n cells) and never rendered, while /me displays English labels directly beside its own 20-l

*Raised by S6 — My List / Library / Profile / Accou*

**Reproduction.** grep -c 't("' across the S6 files: app/me/page.tsx 1, app/me/list/page.tsx 0, app/me/purchases/page.tsx 0, app/sign-in 0, app/sign-up 0, app/forgot-password 0, app/reset-password 0, ProfileDynamic 0, PurchaseHistoryList 0, AuthErrorNotice 0, OAuthButtons 0. Only 6 distinct keys are used anywhere in scope (library.title, library.channels, library.myList, library.noSavedShows, library.browseShows, shorts.saved).

**Evidence.** lib/i18n.ts defines profile.myList, profile.continueWatching, profile.purchaseHistory, profile.signIn, profile.signOut, profile.guest, profile.signInPrompt, profile.language, profile.notifications, profile.darkMode, profile.helpFaq, profile.sendFeedback, profile.reportProblem, profile.coinBalance, profile.coins, profile.buyCoins - each present 21 times (20 locales + the type declaration) and referenced by no component. app/me/page.tsx:366 renders <LanguagePicker /> in the same card as the untranslated 'Dark Mode' row. The 6 keys that ARE used were verified complete: each appears 21 times, i.e. in all 20 locales.

**Independent verification.** Reproduced on live production, not just in source.

WHAT I DID: set localStorage `verza-lang` = "es" (the real STORAGE_KEY, lib/i18n.ts:1176) in Chrome, loaded https://www.verzatv.com/me, waited for hydration, read document.body.innerText.

WHAT I SAW (html lang="es", stored="es"): "Guest | Sign in to sync your library and purchases | Sign In | Start Watching | LIBRARY | My List | 0 saved | Continue Watching | No history | Purchase History | No purchases | SETTINGS | **Idioma | Español** | Notifications | Off | Dark Mode | SUPPORT | Help & FAQs | Send Feedback | Report a Problem | Reset Password | Sign Out ... | Descubrir | Cortos | Tienda | Biblioteca | Perfil". The bottom nav is Spanish and the language row itself reads "Idioma", sitting one line above "Notifications" and "Dark Mode" in English, inside the same Settings card. /me/list is the same: H1 "My List / Saved Shows / Recently Watched" in English while each poster's own badge renders "Guardado" (shorts.saved).

DEPLOYED BUNDLE, NOT THE BUILD: /_next/static/immutable/chunks/428d7hhx0m19l.js (loaded by /me) contains exactly 320 `profile.*` cells — 16 keys x 20 locales, including "Mi Lista", "Historial de Compras", "Cerrar Se

---

### S7-005 — Channels: the StorageBlue card is marked Coming Soon while the show whose premise it describes is live and playing.

*Raised by S7 — SECTIONS. The 10 browse tabs (Drama*

**Reproduction.** Open https://www.verzatv.com/channels. The StorageBlue card reads "Coming Soon" and "Titles will appear here when they are published", under a description of storage-unit auctions. Then open /series/storage-pirates/1 — 13 episodes, all free, playing.

**Evidence.** app/channels/page.tsx:29-34 (CHANNEL_META.StorageBlue) and :178-181 (Coming Soon panel when displaySeries.length === 0). getSeriesByChannel("StorageBlue") returns 0 because storage-pirates carries `channel: "VERZA Originals"` in lib/catalog.ts — measured: channel field values across the catalog are only {"VERZA Originals": 94, "The Carpet": 2}. Live HTML at /channels: "StorageBlue|Coming Soon|Reality meets comedy. When abandoned storage units go to auction...".

**Independent verification.** Reproduced on the deployed site today. Fetched https://www.verzatv.com/channels (HTTP 200); the StorageBlue card renders "StorageBlue | Coming Soon | Reality meets comedy. When abandoned storage units go to auction, one crew finds more than furniture - they find fame, feuds, and hidden fortunes. | Coming Soon | Titles will appear here when they are published" - Coming Soon twice, both in the header subtitle and the empty-state panel. Cause verified in code, not string-matched: lib/catalog.ts:754-763 gives storage-pirates `channel: "VERZA Originals"`, and getSeriesByChannel (lib/catalog.ts:1334) filters on `status === "live" && s.channel === channel`, so getSeriesByChannel("StorageBlue") returns [] and app/channels/page.tsx takes the empty branch. Re-measured the channel field over all 96 rows: {VERZA Originals: 94, The Carpet: 2} total, {VERZA Originals: 89, The Carpet: 2} live - matches the evidence and the live page's "View All 89 Shows" and "The Carpet | 2 shows". Confirmed the show is genuinely live and free, not just catalog-live: https://www.verzatv.com/series/storage-pirates/1 returns HTTP 200 and renders "EP 1 / 13", the RSC payload carries 13 playbackId values, and https:/

---

### S7-006 — Channels: "View All 89 Shows" lands on an unfiltered /discover that lists 91 titles and drops the channel context.

*Raised by S7 — SECTIONS. The 10 browse tabs (Drama*

**Reproduction.** Open https://www.verzatv.com/channels, tap "View All 89 Shows →" under VERZA Originals. You land on /discover, which lists every live series with no channel heading and no filter.

**Evidence.** app/channels/page.tsx:229 `href="/discover"`, :234 `View All {series.length} Shows`. Fetched /discover: 200, contains 91 distinct `/series/...` links (all live series, not the channel's 89) and no channel-scoped view. Its own "Browse by Category" rail offers 7 categories (Drama, Hot, Español, Bollywood, Reality, Red Carpet, Music) against the app's 10 tabs.

**Independent verification.** Reproduced on the deployed site. GET https://www.verzatv.com/channels (200) renders the StorageBlue card with subhead "Coming Soon" and the empty panel "Coming Soon / Titles will appear here when they are published", directly under the description "Reality meets comedy. When abandoned storage units go to auction, one crew finds more than furniture - they find fame, feuds, and hidden fortunes." Present in both the SSR HTML and the RSC flight payload, so the deployed bundle matches source.

The show that description belongs to is live: https://www.verzatv.com/series/storage-pirates (200) reads "13 episodes", "All Episodes FREE", "Watch Episode 1 Free"; /series/storage-pirates/1 returns 200; and episode 1's real Mux playback id from lib/mux-map.ts:4077 (ISuPawNDgpa92VcXLcFMe6vrAnspIC2vqCBtjnmj2u00) returns HTTP/2 200 application/x-mpegURL from stream.mux.com. Genuinely playing, not a stale row. (13 not 14 - episodeCount is normalized to MUX_MAP length; live page and finding agree.)

Root cause re-measured, not taken on trust: getSeriesByChannel (lib/catalog.ts:1334) filters status === "live" && s.channel === channel. I counted channel values across the catalog myself - VERZA Originals

---

### S7-008 — Reality: the hero is a large non-interactive poster that spends three of every four rotations advertising a show that has no page and no episodes.

*Raised by S7 — SECTIONS. The 10 browse tabs (Drama*

**Reproduction.** Open https://www.verzatv.com/?tab=reality and wait. The hero cycles Sugar Babies, Buy/Sell Miami, The Vertical Tea, Storage Pirates every 4s. Tap it at any point: nothing happens — on every other tab the hero is a link.

**Evidence.** components/BrowsePage.tsx:842-849 renders the reality hero as bare `<div>`/`<Image>` with no `<Link>`, versus BrowsePage.tsx:986 where every other tab's hero is `<Link href={posterHref(current)}>`. Measured live: HERO_IS_LINK=false, HERO_ALT="Buy/Sell Miami"; /series/buy-sell-miami -> 404. realityShows is hard-coded at BrowsePage.tsx:437-442. The Reality grid also has no section heading, where Red Carpet has "THE CARPET" (BrowsePage.tsx:946).

**Independent verification.** Reproduced live on www.verzatv.com and in the deployed bundle. Every claim holds.

DEPLOYED BUNDLE (/_next/static/immutable/chunks/1aseb4gggkekc.js, fetched from www.verzatv.com — not the local build): the reality branch renders `"reality"===v&&(...jsxs("div",{children:[jsx("div",{className:"relative",children:jsx("div",{className:"relative mx-auto overflow-hidden rounded-xl",style:{aspectRatio:"2 / 3",...maxWidth:"min(320px, 80vw)"},children:jsx(Image,{src:f.poster,alt:f.title,...})})})`. No anchor, no button, no onClick anywhere in that subtree. Same chunk carries the hard-coded `H=[{Sugar Babies},{Buy/Sell Miami},{The Vertical Tea},{Storage Pirates}]` and `setInterval(()=>T(e=>(e+1)%K),4e3)`.

LIVE DOM (Chrome, www.verzatv.com, Reality tab): dot count 4. Hero measured 320x480. Rotation observed at ~4.3s intervals: alt "Sugar Babies" -> "Buy/Sell Miami" -> "The Vertical Tea". At every sample HERO_IS_LINK=false, closest('button')=null, computed cursor="auto". I then jumped to slide 4 via its dot: alt "Storage Pirates", still isLink=false, cursor="auto" — so even the one reality show that HAS 14 episodes and a working page gets a dead hero. Contrast measured in the same browser on 

---

### S7-009 — Carousel dots across four sections are 6-7px tap targets — the button element itself is the hit area.

*Raised by S7 — SECTIONS. The 10 browse tabs (Drama*

**Reproduction.** Open /?tab=reality (or Drama, Hot, Tubi) and try to hit a dot with a thumb. Only the active dot (20x6 / 22x7) is wider than 7px, and none is taller than 7px.

**Evidence.** Measured getBoundingClientRect on production: Reality dots `BUTTON|Slide 1|20x6`, `Slide 2..4|6x6` (components/BrowsePage.tsx:856); Drama/Hot hero dots `20x6` / `6x6` (BrowsePage.tsx:1062); Tubi dots `22x7` / `7x7` (components/TubiHeroCarousel.tsx:198). All carry `p-0 border-0`, so the button box equals the visual dot. Anime's "Browse Drama" button measures 125x36. Nothing in these sections meets a 44px minimum except the poster tiles (119x221 three-up, 180x312 two-up).

**Independent verification.** Reproduced on the live deployment (dpl_FEduFW6ftQZyapPx28PouXp55wk3), not the local build.

WHAT I DID / SAW

1. Deployed HTML. curl of https://www.verzatv.com/ returns the dot markup verbatim:
   `<button class="p-0 border-0 cursor-pointer" style="background:none" aria-label="Slide 1"><div class="rounded-full" style="width:20px;height:6px;..."></div></button>`
   Six such buttons ship in the SSG HTML; the button's only child is the 6px visual dot, and the button carries no padding/border, so button box == dot.

2. Deployed CSS. Fetched /_next/static/immutable/chunks/1b0rux1xv-mpp.css (47,932 B). The only `button` rules are the Tailwind preflight reset and `button:focus-visible{outline...}`. No `min-height`, no `::after` hit-area expander, and the single occurrence of "44px" in the whole stylesheet is `.device-frame{border-radius:44px}`. Nothing enlarges the target.

3. EFFECT, not assignment — live getBoundingClientRect + elementFromPoint on www.verzatv.com:
   - Drama tab (row class `pt-1 pb-0.5`, 6 dots): `Slide 1 = 20x6`, `Slide 2..6 = 6x6`.
   - Reality tab (row class `py-2`, 4 dots): active `20x6`, rest `6x6`. Horizontal gap between adjacent dots measured at 6px.
   - Tubi ta

---

### S7-010 — The StorageBlue advert carries no user-visible Ad or Sponsored label and no rel="sponsored", on any of the three tabs it renders on.

*Raised by S7 — SECTIONS. The 10 browse tabs (Drama*

**Reproduction.** Open /?tab=reality (or Drama, or Hot) and scroll to the StorageBlue panel. It is a bare logo box inline in editorial content; nothing on screen says it is an advert.

**Evidence.** Production DOM: `A | https://www.storageblue.com | 582x74`, anchor innerText === "" (empty); sole content is `<img alt="StorageBlue">`. Source and deployed bundle both: `target:"_blank", rel:"noopener noreferrer"` — no `sponsored` token (components/BrowsePage.tsx:912-936 for Reality, :1085-1108 for Drama/Hot; deployed chunk 1aseb4gggkekc.js offsets ~38603 and ~42006). The Tubi links on the same page do carry `rel="noopener noreferrer sponsored"`. The word "Sponsored" appears only in a source comment. Destination crawled: https://www.storageblue.com -> 301 -> https://storageblue.com/ 200.

**Independent verification.** CONFIRMED at S3 (severity as filed is correct). Reproduced at four layers; the raiser's evidence, including the byte offsets, checks out exactly.

1) SOURCE — /Users/jothamhall/E! CREATOR ECONOMY/verza-tv/components/BrowsePage.tsx. Two instances, both preceded by the comment "Sponsored Ad Ribbon": lines ~912-936 (Reality) and ~1085-1108 (gated on "drama"||"new"||"popular"). Both are `<a href="https://www.storageblue.com" target="_blank" rel="noopener noreferrer">` wrapping a single `<Image src="/ads/storageblue-logo.png" alt="StorageBlue">`. No label element, no `sponsored` rel token.

2) DEPLOYED BUNDLE — fetched https://www.verzatv.com/_next/static/immutable/chunks/1aseb4gggkekc.js (200, 44827 bytes). `storageblue` at offsets 38603/39059 (Reality) and 42006/42462 (Drama/Hot) — the exact offsets cited. Both minified anchors read `rel:"noopener noreferrer"`. Confirmed the fix was not shipped.

3) PRODUCTION HTML — curl of https://www.verzatv.com/ (200, 231291 bytes) renders `<a href="https://www.storageblue.com" target="_blank" rel="noopener noreferrer" class="block mx-3 mt-0 mb-4 ...">` whose sole child is `<img alt="StorageBlue">`. Across the whole document: zero matches for /spo

---

### S7-011 — Tubi: six banners carrying Tubi's own play buttons all resolve to the catalogue home page, and the large framed Tubi wordmark is the one affordance with no destination at all.

*Raised by S7 — SECTIONS. The 10 browse tabs (Drama*

**Reproduction.** Open https://www.verzatv.com/?tab=tubi. Tap the yellow play button on the "Central Intelligence" banner: a new tab opens on tubitv.com's home page, not that film. Tap the big gradient-framed Tubi wordmark at the bottom: nothing happens.

**Evidence.** Crawled every anchor in the panel: 8 anchors, all `https://tubitv.com/` (1 CTA + 6 slides + 1 clone of slide 1), `target="_blank" rel="noopener noreferrer sponsored"` (components/TubiHeroCarousel.tsx:34 TUBI_HOME, :149 href={href}). https://tubitv.com/ crawled -> 200, 0 redirects. Slide art at capture: "Central Intelligence — Comedy · 2016 · 1 hr 48 min · PG-13" with a yellow play glyph rendered into the image. MITIGATION PRESENT AND WORKING: a fixed "OPENS TUBI ↗" chip renders over the active slide (TubiHeroCarousel.tsx:189) and swipe-vs-tap is disambiguated (draggedRef, :96-119). NOT mitigated: the wordmark at components/BrowsePage.tsx:795-816 is `<div><div><Image/></div></div>` with no an

**Independent verification.** CONFIRMED, but only the second half of the summary. The dead wordmark is real; the "banners go to the catalogue home" half is by design and disclosed, and is NOT a defect.

WHAT I DID (deployed bundle + live DOM, not the build):
1. Fetched https://www.verzatv.com/ and pulled its 14 chunks. The Tubi panel and the carousel both live in /_next/static/immutable/chunks/1aseb4gggkekc.js (dpl_FEduFW6ftQZyapPx28PouXp55wk3). Deployed panel children, in order: (a) <a href="https://tubitv.com/" target=_blank rel="noopener noreferrer sponsored">"Watch Free on Tubi →"; (b) the carousel; (c) the value-prop <p>; (d) a plain <div style={padding:2,borderRadius:16,background:"linear-gradient(135deg,#7401CB,#FFFF12)",boxShadow:"0 0 42px rgba(116,1,203,0.55)"}> wrapping <div> wrapping <Image src="/tubi-logo.png">; (e) the trust line. Element (d) has NO href, NO onClick, NO role, NO tabIndex in the shipped code.
2. Live DOM on https://www.verzatv.com/?tab=tubi (Chrome, production): the panel holds 8 anchors, every one https://tubitv.com/ (1 CTA + 6 slides + 1 clone) — matches the raiser's crawl exactly. The 139x54 tubi-logo <img> in the panel returns closest('a') = null, closest('button') = null, compu

---

### S8-001 — The YouTube link in the footer of every page on the site returns HTTP 404; the real channel is at a different handle.

*Raised by S8 — Legal, Trust, Footer. The 21 legal/*

**Reproduction.** Load any page on www.verzatv.com, scroll to the footer, tap the YouTube icon (5th social icon). YouTube renders its 404. Verified from the CLI: curl -sSL -o /dev/null -w '%{http_code}' 'https://www.youtube.com/@VerzaTV' -> 404.

**Evidence.** components/Footer.tsx:38 and lib/data/sitemap.ts:224 both hold https://www.youtube.com/@VerzaTV. Measured 2026-08-29: @VerzaTV 404, @verzatv 404, @VERZATV 404, @Verzatv 404. Positive control https://www.youtube.com/@netflix -> 200. YouTube's own search results for 'verzatv' contain "canonicalBaseUrl":"/@VerzaTVOfficial", and https://www.youtube.com/@verzatvofficial -> 200. The other four socials all resolve (Instagram og:title 'VERZATV (@verzatv)', 5,719 followers; TikTok userInfo uniqueId 'verzatv', 384 followers, 106 videos; x.com/VerzaTV 200 with a 404 negative control; facebook.com/VerzaTV <title>Verza TV</title> with a generic-title negative control).

**Independent verification.** CONFIRMED — reproduced independently in code and in production. Coverage: 96/96 show pages fetched live from www.verzatv.com (all HTTP 200), 86/86 paid pages parsed.

WHAT I DID
1. AST-extracted lib/catalog.ts and lib/series-detail.ts with the repo's own TypeScript (script at /private/tmp/claude-501/-Users-jothamhall-E--CREATOR-ECONOMY/247f2627-3c01-4a2e-a945-0f54a170219b/scratchpad/extract.mjs, no regex/string matching). Catalog = 96 rows (91 live / 5 coming_soon); paid (status live && episodeCount > freeEpisodes && coinPerEpisode > 0) = 86; SERIES_DETAIL = 80 keys, zero orphans.
2. Fetched all 96 /series/<slug> pages from production and parsed the SSR HTML for the three guarded blocks in app/series/[slug]/page.tsx.

WHAT I SAW (production, today)
- 11 of 86 paid pages render no Cast block. 7 of those also render no description paragraph and no tag pills. 75 (not 76 — the finding's arithmetic is off by one; 86 − 11 = 75) carry all three.
- The slug lists match the finding exactly, no additions, no omissions. No-detail-entry-at-all (7): im-having-my-professors-baby-es, falling-for-flatmate, dil-dosa-dosti, salt-and-pepper, love-for-sale, the-breakup-podcast, reset. Detail entry pre

---

### S8-002 — /brand-assets advertises four logo files in SVG and PNG; none of the eight is downloadable and the 'SVG · PNG' pill is an inert span.

*Raised by S8 — Legal, Trust, Footer. The 21 legal/*

**Reproduction.** Open https://www.verzatv.com/brand-assets. Each of the four asset cards (Primary logo, Logo on light, App icon, Social avatar) shows an accent-coloured pill reading 'SVG · PNG'. Tap it: nothing happens. Follow the page's own pointer to /media-kit 'for packaged downloads': that page contains two links total and no file.

**Evidence.** app/brand-assets/page.tsx:130-141 renders the pill as <span className="...px-2 py-1 rounded-lg..." style={{background: `${T.accent}1A`, border: `1px solid ${T.accent}33`}}>SVG · PNG</span> — no href, no onClick, no download. Parsing the production HTML for /brand-assets, zero <a> elements match svg/png/download. app/brand-assets/page.tsx:99-104 links to /media-kit for 'packaged downloads'; the production /media-kit page's <main> contains exactly two anchors: mailto:press@verzatv.com and /press. /newsroom compounds it with a link labelled 'Media kit & downloadable assets'.

**Independent verification.** CONFIRMED — reproduced both directions on production (deployment dpl_7L9CxaoUDHn95y2P125xTMAVAWAj, measured 2026-08-29). No files edited.

WHAT I DID / SAW

1. Server HTML, 96/96 show pages (full denominator, not a spot-check). Extracted all 96 slugs from lib/catalog.ts (96 unique, no dupes), fetched https://www.verzatv.com/series/<slug> for each, parsed the <html> tag. Result: 96/96 HTTP 200, 96/96 `lang="en"`, zero variation. JSON-LD on the same pages: 80 inLanguage "en", 6 "es", 10 "hi". The 6 "es" rows are exactly the ones named: sentence-of-passion-es, i-cheated-on-my-wedding-night-es, i-fell-in-love-with-my-presidential-brother-in-law-es, the-goat-mistress-es, im-having-my-professors-baby-es, i-cant-resist-my-mansion-gardener. All 6 have Spanish h1, Spanish genre badge, Spanish logline and Spanish meta description under `lang="en"` (e.g. h1 "Sentencia de pasión", meta description "Ella entra a la sala como acusada…").

2. Live browser, direction A. Chrome on https://www.verzatv.com/series/sentence-of-passion-es with no stored locale (default English UI): `document.documentElement.lang` === "en". Visible text nodes are ~100 words of Spanish content (title, "DRAMA · PASIÓN", lo

---

### S8-005 — The Creator Agreement is a hard acceptance gate on the creator application and states on its own face that it is placeholder text and not the agreement.

*Raised by S8 — Legal, Trust, Footer. The 21 legal/ · **touches money or the shipped rail***

**Reproduction.** Open https://www.verzatv.com/studio, start the creator application, reach step 3 (Rights & terms). The checkbox 'I have read and accept the VERZA Creator Agreement' is required — submission is blocked without it. Open the linked /legal/creator-agreement: 'Version: v0-draft. Draft for review. This is placeholder text pending legal counsel and is not the final agreement.' The revenue share, payout timing, licence scope and term are all deliberately unstated.

**Evidence.** app/legal/creator-agreement/page.tsx renders the v0-draft banner and five sections that each defer their operative terms ('The revenue share, payout timing, minimum thresholds, and reporting are provided to approved creators and set out in the executed agreement'). components/creator/ApplicationWizard.tsx:622-636 renders the required CheckRow; lib/creator-client.ts:213 `if (!f.agreementAccepted) problems.push("Accept the VERZA Creator Agreement to continue.")`; lib/creator-client.ts:176 lists agreementAccepted as a step-3 required field; app/api/creator/apply/route.ts:152 persists `agreement_version: AGREEMENT_VERSION` = 'v0-draft' (lib/creator-client.ts:249). The stored acceptance is surfac

**Independent verification.** CONFIRMED — the core defect reproduces exactly, but the scope statement and the chosen repro title are both wrong and should be corrected before anyone fixes it.

WHAT I DID / WHAT I SAW

Code (/Users/jothamhall/E! CREATOR ECONOMY/verza-tv):
1. app/series/[slug]/page.tsx is the sole component for all 96 show pages (431 lines). It renders no back element, does not import getReturnTab, and contains no "?tab=" anywhere. Its only self-rendered escape is the coming-soon empty state's "Browse VERZA" Link href="/". Everything else on the page comes from the shared chrome in app/layout.tsx (Header, BottomNav, Footer).
2. app/series/ holds only [slug]/page.tsx, [slug]/[episode]/page.tsx and [slug]/[episode]/error.tsx — there is no route layout that could inject a back.
3. grep for back affordances across app/ components/ lib/ returns only components/EpisodeFeed.tsx (and an unrelated creator wizard).
4. The tab-preserving pattern exists and is shared: lib/catalog.ts:60 getReturnTab() over TAB_EXCLUSIVE_CATEGORIES (red-carpet, reality, music, espanol, bollywood). It has exactly one caller — app/series/[slug]/[episode]/page.tsx:129 → backHref={backTab ? `/?tab=${backTab}` : "/"}. scripts/test-

---

### S8-012 — /help tells viewers the catalog includes Horror; the site's own Horror page says 0 live series and no catalog row is horror.

*Raised by S8 — Legal, Trust, Footer. The 21 legal/*

**Reproduction.** Open https://www.verzatv.com/help, expand 'What genres are available?': 'The current catalog includes Romance, Thriller, Drama, Comedy, Reality, Mystery, Sci-Fi, and Horror.' Now open https://www.verzatv.com/discover/horror: '0 live series', 'No horror series yet.', 'Our horror catalog features 0 currently live matches for this catalog filter.'

**Evidence.** app/help/page.tsx:52. `grep -ic horror lib/catalog.ts` -> 0. AST-parsed catalog: 96 rows, 91 live, 61 distinct genre strings, none containing 'horror'. The other seven genres in the same sentence do check out against production: /discover/comedy 6 live, /discover/sci-fi 1 live, /discover/crime 3 live, plus Romance/Thriller/Drama/Mystery/Reality. /discover/fantasy is also 0 but is not claimed.

**Independent verification.** CONFIRMED — reproduced verbatim in code, on production HTML, and in the live header popover UI.

WHAT I DID / SAW

1) Code (/Users/jothamhall/E! CREATOR ECONOMY/verza-tv):
- lib/search-index.ts:136 `seriesMatchesQuery(s, rawQuery): boolean` — a predicate, no score, no ordering signal.
- Every call site is a bare `.filter()`, exactly as claimed: app/search/page.tsx:43-45, components/SearchButton.tsx:29, components/SearchBar.tsx:23, components/FeedSearch.tsx:23.
- `grep -rn "\.sort("` across the search path: zero hits. lib/catalog.ts:1298 `getLiveSeries()` is `catalog.filter(s => s.status === "live")` with no sort (the only sort in catalog.ts is popularRank inside getSeriesByCategory, line 1313, which search never calls).
- No result cap anywhere (no `.slice()` in app/search/page.tsx or SearchButton.tsx), so nothing is dropped — results are merely mis-ordered.

2) Production HTML, fetched 2026-08-29, `curl https://www.verzatv.com/search?q=the%20ceo` → HTTP 200, `<h1>Results for "the ceo"</h1>`, 10 result links in DOM order:
collateral-hearts, the-marriage-contract, married-to-a-stranger, cleopatra, never-mess-with-a-badass-girl, help-im-falling-in-love-with-my-rude-ceo, one-night-sta

---

### S8-013 — /studio — the footer's 'Become a Creator' destination on every page — server-renders an empty <main>.

*Raised by S8 — Legal, Trust, Footer. The 21 legal/*

**Reproduction.** curl -s https://www.verzatv.com/studio and extract the <main> element: it contains only whitespace. In a browser the content appears after hydration; with JS disabled, or for any crawler, the page is blank between the header and the footer.

**Evidence.** app/studio/page.tsx:11 returns <CreatorDashboard />, which is "use client" (components/CreatorDashboard.tsx:1). Its loading branch (`if (loading) return <WizardSkeleton />;`, components/CreatorDashboard.tsx:74) only runs post-hydration, and the /api/creator/me fetch is further deferred into a queueMicrotask (:65-72). Reached from components/Footer.tsx legalLinks[0] ('Become a Creator' -> /studio) on all 21 S8 pages, from lib/data/sitemap.ts:202-206 twice, and from app/partnerships/page.tsx ('Creator Program').

**Independent verification.** CONFIRMED as a mechanism and as a production fact; severity corrected S2 -> S3.

WHAT I DID / SAW

1. Code read. components/HideInIOSApp.tsx is exactly as reported: `const [hidden,setHidden]=useState(false); useEffect(()=>{ if(isIOSApp()) queueMicrotask(()=>setHidden(true)) },[])`. lib/platform.ts isIOSApp() short-circuits `typeof window === "undefined"` -> false, so SSG can never hide it. app/series/[slug]/page.tsx:328-364 wraps the $1.99 card in `{isPurchasable && <HideInIOSApp>…}`.

2. Production HTML, real data not string matching. Pulled all 91 live slugs from https://www.verzatv.com/sitemaps/shows.xml and fetched every one with `?platform=ios` AND a `VerzaTV-iOS` User-Agent. Result: 86/91 pages contain "Series Unlock" and "$1.99" (2 occurrences each, not 1 — the raiser's `grep -c` counts lines and the doc is one line); the 5 without are exactly the wholly-free titles (exes-premiere, love-awards, storage-pirates, the-dumb-billionaire-heiress-in-love, too-much-junk). So "all 86 paid show pages" is exact. Response headers: x-nextjs-prerender: 1, x-vercel-cache: HIT, vary: rsc,next-router-* (no UA/cookie) — a single platform-blind static document, no server variant possible.

3. 

---

### S8-018 — /partnerships tells prospective licensees VERZA 'owns its content'; /about tells viewers content is 'produced by or licensed to' VERZA.

*Raised by S8 — Legal, Trust, Footer. The 21 legal/*

**Reproduction.** Read https://www.verzatv.com/partnerships opening paragraph, then https://www.verzatv.com/about 'Filmology Labs' block. The two public pages assert opposite things about rights ownership, and the stronger claim is on the page selling licensing and syndication deals.

**Evidence.** app/partnerships/page.tsx:57 'VERZA TV owns its content and its platform — which makes it a rare partner that can move from idea to live audience without licensing friction.' app/about/page.tsx:119 'Available content is produced by or licensed to VERZA TV.' The catalog also carries an authorized-partner tab (Tubi) and six supplier-sourced titles with art but no video (AGENTS.md rule 2).

**Independent verification.** CONFIRMED — every number in S4-007 reproduces exactly, in the source and in the deployed production bundle. Severity S3 stands.

WHAT I DID (code). Ran the real modules under tsx against the real catalog (no string matching), harness at /private/tmp/claude-501/-Users-jothamhall-E--CREATOR-ECONOMY/247f2627-3c01-4a2e-a945-0f54a170219b/scratchpad/probe.ts, importing "/Users/jothamhall/E! CREATOR ECONOMY/verza-tv/lib/catalog.ts" and "/Users/jothamhall/E! CREATOR ECONOMY/verza-tv/lib/search-index.ts".

WHAT I SAW. catalog = 96 rows, 91 live / 5 coming_soon. SEARCH_TAGS = 76 keys, 0 orphans. Exactly 15 live rows have no SEARCH_TAGS entry, and they are the 15 slugs named, verbatim: im-obsessed-with-my-boss-2, storage-pirates, exes-premiere, love-awards, the 5 -es rows, and the 6 Bollywood rows. `tags` is populated on 0 of 96 rows, so the `...(s.tags ?? [])` term in seriesSearchHaystack (lib/search-index.ts:119) contributes nothing anywhere. Haystack composition confirmed by reading it: title + slug-with-dashes-spaced + genre + logline + channel + categories, and nothing else for these 15.

WHAT I SAW (production, per rule 4 — not the build). Fetched https://www.verzatv.com/search?q=… and 

---

### S8-019 — Seven indexable legal/trust pages are absent from the XML sitemap, including /support and /contact.

*Raised by S8 — Legal, Trust, Footer. The 21 legal/*

**Reproduction.** Fetch https://www.verzatv.com/sitemaps/pages.xml (170 <loc> entries) and grep for each S8 route. /support, /contact, /media-kit, /founder, /company, /editorial-standards and /studio are missing, yet all seven serve <meta name="robots" content="index, follow">.

**Evidence.** Measured 2026-08-29 against production. Present: /terms, /privacy, /refund-policy, /about, /press, /help, /newsroom, /careers, /investors, /leadership, /partnerships, /brand-assets, /sitemap. Absent: /support, /contact, /media-kit, /founder, /company, /editorial-standards, /studio. /legal/creator-agreement is correctly absent — it is the only S8 page serving 'noindex, nofollow'. lib/data/sitemap.ts allProgrammaticPaths() enumerates hubs but not these seven.

**Independent verification.** Reproduced against the deployed bundle on www.verzatv.com, not the build. Method: read components/EpisodeDropdown.tsx (its only consumer is app/series/[slug]/page.tsx:377), confirmed the fetched production HTML for /series/the-pendleton-secret carries identical markup, then drove headless Chrome 151 over CDP at real emulated viewport widths (not a JS-constrained .app-shell) measuring getBoundingClientRect, scrollWidth/clientWidth and per-span line boxes.

Measured threshold is exact: one line at viewport >=350 CSS px (button 190x42), two lines at <=349 (160x62 at 320px, 180x62 at 340px). At 350px the content fits by ~0.8px - a knife's edge.

The raiser's numbers are right but the description understates it. It is not a clean one-line-to-two reflow: all three spans break mid-phrase into a 2x3 grid reading left-to-right as "EP  of  All" over "1  60  Episodes v". The episode number is severed from "EP" and the total from "of". Screenshot: /private/tmp/claude-501/-Users-jothamhall-E--CREATOR-ECONOMY/247f2627-3c01-4a2e-a945-0f54a170219b/scratchpad/picker-320.png

Their "cosmetic only" half holds: scrollWidth === clientWidth (158/158) so no clipping, and documentElement.scrollWidth === c

---

### S8-020 — /sitemap is titled 'Every Page on VERZA TV' and lists 35 of the 48 static routes.

*Raised by S8 — Legal, Trust, Footer. The 21 legal/*

**Reproduction.** Open https://www.verzatv.com/sitemap — <title>Sitemap — Every Page on VERZA TV</title>, intro 'Every page on VERZA TV, organized by section.' Cross-check against the manifest's page list: 13 static routes are absent.

**Evidence.** Extracted 345 internal hrefs from the production /sitemap HTML and diffed against docs/audit/00-manifest.json routes.pages (48 non-dynamic). Missing user-facing routes: /horizontal, /me/list, /me/purchases, /share, /sign-in, /sign-up, /forgot-password, /reset-password. Defensibly missing: /admin/dashboard, /admin/review, /creator, /dev/perf, /legal/creator-agreement.

**Independent verification.** CONFIRMED. Reproduced in source, in the deployed bundle, and live on www.verzatv.com in two locales.

COVERAGE: 4 of 4 search surfaces examined; 115 of 115 i18n keys enumerated; 20 of 20 locales enumerated; 2 locales (es, ar) exercised live on production; 17 on-screen strings verified rendering English. 0 gaps.

WHAT I DID / SAW

1. Source. `awk '/^export interface Translations/,/^}/' lib/i18n.ts | grep -c '": string;'` -> 115, matching the claim. Dumped all 115 key names: the only one matching search/discover/result/cancel/keyword is `nav.discover`, and I traced that to `components/BottomNav.tsx:96` where it labels the HOME tab, not /discover. Zero search keys.

2. Hook absence. `grep -n "useTranslation|LangProvider|i18n"` across /Users/jothamhall/E! CREATOR ECONOMY/verza-tv/components/SearchButton.tsx, components/SearchBar.tsx, components/FeedSearch.tsx, app/search/page.tsx -> NONE. By contrast 15 components in the tree do import `useTranslation`. Importers confirmed: SearchButton in components/Header.tsx:41, SearchBar in app/discover/page.tsx:32, FeedSearch has no importer (so the raiser is right to call it a fourth surface and right to exclude it from the shipped count).

3. De

---

### S8-021 — The footer sitemap sheet contains six duplicate links — two labels pointing at /studio and five sections repeating their own hub as a list item.

*Raised by S8 — Legal, Trust, Footer. The 21 legal/*

**Reproduction.** Tap SITEMAP in the footer of any page and scroll the sheet. 'For Creators' shows 'Creator Studio' and 'Apply to Create', both -> /studio. The Genres, Collections, Best Of, Guides & Compare and Watch In sections each render their hub link as the section heading and again as the last list item ('All Genres', 'All Collections', 'All Best-Of Lists', 'All Guides', 'All Locations').

**Evidence.** lib/data/sitemap.ts:202-206 (both For Creators entries href '/studio'); :110-119, :121-132, :134-145, :147-160, :162-172 (each section declares `hub: {href}` and repeats the same href as its trailing link). All targets resolve 200 — this is redundancy, not breakage.

**Independent verification.** CONFIRMED — reproduced in source, in the deployed bundle, against real catalog data, and live in a browser on www.verzatv.com. Severity S3 stands.

1) SOURCE. /Users/jothamhall/E! CREATOR ECONOMY/verza-tv/components/SearchBar.tsx:56-63 is exactly as reported: className="absolute top-full left-0 right-0 mt-2 rounded-xl overflow-hidden z-50", style carries only background and border. No maxHeight, no overflow-y-auto. `filtered.map` at :64 has no .slice(). /Users/jothamhall/E! CREATOR ECONOMY/verza-tv/app/discover/page.tsx:32 passes `series={live}` = all 91 live rows. Comparison surfaces confirmed bounded: components/SearchButton.tsx:115 (maxHeight "calc(100vh - 76px)" + overflow-y-auto, plus an "N results" count line) and components/FeedSearch.tsx:105,108 (maxHeight + .slice(0, 12)). app/search/page.tsx is uncapped too but it is a full page, not an overlay, so that is correct there.

2) DEPLOYED BUNDLE (rule 4). curl https://www.verzatv.com/discover -> 200; it references /_next/static/immutable/chunks/3--x_pig694c6.js. Fetched that chunk (2,537 bytes): it is the whole SearchBar, and it renders `c.map(e=>...)` with no slice inside a div whose style object is exactly {background:"#1212

---

## S4 — polish, copy, consistency

### D1-012 — /me renders a "Sign Out" button in the signed-out (Guest) state. It is inert for a guest — an interactive control that does nothing observable.

*Raised by D1 — STATES: loading, empty, error, skel*

**Reproduction.** Open https://www.verzatv.com/me signed out. The header reads "Guest — Sign in to sync your library and purchases" and a "Sign Out" button is rendered at the bottom of the page.

**Evidence.** Forced on production: {"url":"/me","buttons":["Language English","Notifications Off","Sign Out"],"signedOutMarker":true}. Source: app/me/page.tsx:425 renders `<SignOutButton />` unconditionally, while :426 correctly passes `expectedUserId={user?.id ?? null}` to DeleteAccountButton, which returns null when signed out (components/ProfileDynamic.tsx:161). The gate was applied to one of the two buttons.

**Independent verification.** Reproduced in the deployed bundle. curl of https://www.verzatv.com/me with no cookies returned 200, x-matched-path /me, cache-control private/no-store (so this is the real signed-out render, not a cached page). The served HTML contains ">Guest<", "Sign in to sync your library and purchases", href="/sign-in", and exactly one "Sign Out" — a full-width <button class="... cursor-pointer"> inside the trailing <div class="mt-8 flex flex-col items-center gap-3">, immediately above "VERZA TV v1.0.0". "Delete Account" appears 0 times. So the asymmetry is real: the guest gate suppressed DeleteAccountButton but not SignOutButton, and the page renders "Sign In" and "Sign Out" simultaneously.

Source confirms the mechanism and the cited lines. app/me/page.tsx:425 renders <SignOutButton /> unconditionally; :426 passes expectedUserId={user?.id ?? null} to DeleteAccountButton, which bails at components/ProfileDynamic.tsx:160 (raiser said 161; off by one, immaterial). SignOutButton (same file, from :194) takes no props and has no gate at all.

EFFECT CHECK corrects one asserted fact, which is why I downgraded the severity. The claim that the button is "inert" and "does nothing observable" is wrong.

---

### D1-013 — /shorts ships no server-rendered content and no skeleton — the document is empty between header and footer until the JS bundle hydrates — and four client surfaces (ShortsFeed, HorizontalFeed, CreatorWatch, AmazonProducts

*Raised by D1 — STATES: loading, empty, error, skel*

**Reproduction.** curl -s https://www.verzatv.com/shorts | strip tags — the visible text jumps straight from the header to the footer. Load it in a browser and the feed appears only after hydration.

**Evidence.** Production SSR text for /shorts: `Shorts | VERZA TV en Instagram TikTok X YouTube Facebook Get the app App Store ... Press About` — nothing between. After hydration the same page renders `The Marriage Contract S1 EP.1 Like List Share On` with 1 <video>. Code fact: `grep -cE "setError|sourceError|Could not|went wrong|Try again|EmptyState|animate-pulse|skeleton"` returns 0 for components/ShortsFeed.tsx (531 lines), components/HorizontalFeed.tsx (391), components/CreatorWatch.tsx (300) and components/AmazonProducts.tsx (393). These back /shorts, /horizontal, /watch/[...slug], /amazon and /shop.

**Independent verification.** CONFIRMED as a stray control, but the raiser's mechanism ("inert") is WRONG — corrected below, and severity lowered S3 -> S4.

WHAT REPRODUCES (production, signed out). curl https://www.verzatv.com/me with no cookies -> HTTP 200, x-vercel-cache: MISS (dynamic). Deployed HTML contains the guest markers "Guest" and "Sign in to sync your library and purchases" plus an href="/sign-in" CTA, AND an enabled control: <button class="...cursor-pointer" style="...opacity:1"><svg .../>Sign Out</button>. Occurrences of "Delete Account" / "permanently delete" in the same HTML: 0. So the raiser's core point is exactly right — the auth gate was applied to one of the two sibling buttons. Cited lines all check out: app/me/page.tsx:425 `<SignOutButton />` (ungated), :426 `<DeleteAccountButton expectedUserId={user?.id ?? null} />`, and the gate `if (!expectedUserId) return null;` at components/ProfileDynamic.tsx:160 (raiser said :161 — off by one, immaterial).

WHAT DOES NOT REPRODUCE — the "inert / does nothing observable" claim is FALSE. The raiser read the DOM and never pressed the button. Verified in the DEPLOYED BUNDLE, not source: downloaded all 14 chunks for /me, found SignOutButton in /_next/s

---

### D1-014 — /search?q=<one character> reports "0 series found — No results for 'a'", which is false: the code refuses to search queries under 2 characters and returns an empty array, and many live titles contain 'a'.

*Raised by D1 — STATES: loading, empty, error, skel*

**Reproduction.** curl -s 'https://www.verzatv.com/search?q=a' — renders the no-results state. The genuine no-results state (q=zzzzzzzzzz) is correct and offers a link to /discover, so the copy is right for the wrong condition.

**Evidence.** Production: `Results for "a" 0 series found No results for " a " Try a different keyword or browse by genre on the Discover page.` Source: app/search/page.tsx:42 — `if (!query || query.length < 2) return [];` — the short-query branch and the genuine-no-match branch are indistinguishable downstream.

**Independent verification.** CONFIRMED on production, severity S4 unchanged.

REPRODUCED IN THE DEPLOYED SITE: curl 'https://www.verzatv.com/search?q=a' -> HTTP 200 rendering `Results for "a"` / `0 series found` / `No results for "a"` / `Try a different keyword or browse by genre on the Discover page.`

INDISTINGUISHABLE FROM A GENUINE MISS: fetched ?q=a and ?q=zzzzzzzzzz, stripped tags, diffed visible text. They differ on exactly 3 lines - the <title>, the `Results for "..."` heading, and the echoed query inside the empty state. `0 series found`, the `No results for` block and the Discover link are byte-identical. A viewer cannot tell "too short" from "we have nothing."

ASSERTED AGAINST REAL DATA: parsed lib/catalog.ts - 96 rows, 91 live; 70 of the 91 contain the letter 'a' in title or slug alone (Collateral Hearts, The Billionaire's Betrayal, Two Worlds Apart, ...), effectively all 91 once logline/genre/tags join the haystack. So "0 series found" is a false statement about the catalog.

CAUSE, BOTH FLOORS: app/search/page.tsx:53 `if (!query || query.length < 2) return [];` and lib/search-index.ts:137 `if (q.length < 2) return false;`. The page renders its no-results block on the bare condition `query && res

---

### D1-015 — The 404 page renders with no header, no footer and no bottom nav — a chrome-less dead end with a single escape — and carries the homepage <title> rather than a not-found title.

*Raised by D1 — STATES: loading, empty, error, skel*

**Reproduction.** curl -s https://www.verzatv.com/nope and compare the markup with https://www.verzatv.com/about.

**Evidence.** /nope (31,224 bytes, HTTP 404): occurrences of '<footer' = 0, '<header' = 0, 'Sitemap' = 0, 'Shorts' (bottom nav) = 0, 'Back to Discover' = 1, 'Page not found' = 1; <title> is `VERZA TV — Microdramas, Reality &amp; More`. /about (60,684 bytes) for comparison: '<footer' = 1, 'Sitemap' = 1, 'Shorts' = 1. The not-found copy itself is honest and does offer one way forward (app/not-found.tsx).

**Independent verification.** Reproduced on the live domain. curl https://www.verzatv.com/search?q=a renders verbatim: `Results for "a"  0 series found  No results for "a"  Try a different keyword or browse by genre on the Discover page.` — byte-identical to the genuine-miss state at q=zzzzzzzzzz, so the two conditions are indistinguishable to a viewer, exactly as claimed.

The "0" is false, proven against real data rather than string matching: same-word two-char queries on production return 63 (?q=ar) and 89 (?q=ma) live series, and 72 of the 96 catalog titles parsed from lib/catalog.ts contain the letter "a". The zero comes from the min-length guard refusing to search, not from the matcher finding nothing. Control q=zz also returns 0 with the same copy, which is a legitimate miss — confirming the collapsed state.

Two corrections to the raiser's evidence, neither fatal. (1) The guard is at app/search/page.tsx:53, not :42. (2) The raiser missed a SECOND identical guard at lib/search-index.ts:138 (`if (q.length < 2) return false;`), so any fix must add a distinct "type at least 2 characters" state rather than delete one guard — deleting only the page-level one changes nothing.

Severity S4 stands (no correction

---

### D2-001 — 63 of 115 dictionary keys (1,260 of 2,300 cells) are never rendered; the surfaces they were written for are hard-coded English in all 20 locales.

*Raised by D2 — Localization. All 20 locales x all *

**Reproduction.** 1. Grep every .ts/.tsx/.mjs outside lib/i18n.ts for each of the 115 key literals. 55 keys appear nowhere. 8 more appear only inside components/CoinPaywall.tsx, components/SeriesInfoButton.tsx and components/SeriesInfoDrawer.tsx, which are imported by zero files. 2. curl https://www.verzatv.com/me and https://www.verzatv.com/sign-up and list the visible text nodes: 21 and 17 of them are byte-identical to an `en` dictionary value whose key is in the never-referenced set. 3. Switch locale in the app: those strings do not change, because no t() call exists for them.

**Evidence.** Never referenced (55): nav.widescreen, header.followUs, browse.*(4), horizontal.widescreen/play/pause, profile.*(15 of 16), library.comingSoon, library.shows, auth.*(12), legal.*(3), misc.*(3), content.cast/views/now/allEpisodes/previous/next/episodeOf/trending/watchFree/unlockSeries/tryAgain. Dead-component-only (8): content.synopsis, content.episodes, content.moreLikeThis, content.info, content.oneTimePayment, content.allEpisodesIncluded, content.episodeLocked, content.unlockPrompt. Dead files: components/CoinPaywall.tsx (0 importers), components/SeriesInfoButton.tsx (0 importers), components/SeriesInfoDrawer.tsx (only importer is SeriesInfoButton). Production /me returns "Report a Problem

**Independent verification.** Reproduced exactly as written; severity S4 upheld. SOURCE: app/api/events/route.ts:13 reads verbatim " * Rate limited by middleware (catch-all /api/ tier: 30/min/IP)." while middleware.ts:51 reads "{ pattern: /^\\/api\\/events/, limit: 180 },". RATE_TIERS is documented "order matters: first match wins" and the dedicated /^\/api\/events/ entry (line 51) sits ABOVE the /^\/api\// catch-all (line 54), so this route never reaches the tier its own docblock names. DEPLOYED BUNDLE (not the build): POST https://www.verzatv.com/api/events with {"event":"app_opened","props":{}} returned HTTP/2 202 with x-ratelimit-limit: 180, x-ratelimit-remaining: 179 — matching the raiser's reported header. CONTROL PROBE to isolate the claim rather than string-match it: GET /api/nonexistent-route-probe (no dedicated tier) returned x-ratelimit-limit: 30, proving the 30/min catch-all really exists in production but is not the tier governing /api/events. Siblings confirm the tiered scheme is live: /api/access -> 120, /api/watch-progress -> 60. ROOT CAUSE is visible in-tree: middleware.ts:43 refers to "the old shared 30/min catch-all", i.e. the events tier was carved out of the catch-all in a later change and 

---

### D2-004 — 228 cells across 12 locales are verbatim English — the whole content.* block — contradicting the commit that claimed all 20 languages were fully translated.

*Raised by D2 — Localization. All 20 locales x all *

**Reproduction.** Load lib/i18n.ts dictionaries and compare each non-en cell to its en value. For zh, hi, ar, ru, tr, pl, nl, th, vi, id, tl and sw, 19 of the 20 content.* values are byte-identical to English. The one exception in every case is content.freeEpisodeOf, patched later in isolation. es/fr/pt/de/it/ja/ko have the block translated.

**Evidence.** lib/i18n.ts:592 (zh block) reads `"content.synopsis": "Synopsis", "content.episodes": "Episodes", ... "content.freeEpisodeOf": "免费第 {n} 集，共 {total} 集", "content.trending": "Trending", ...`. Script check: 12 locales x 19 keys = 228 cells. Non-Latin-script test is independent confirmation: zh/hi/ar/ru/th each carry 20 values with zero characters in their own script. Commit 8d6dc8e is titled "All 20 languages fully translated (was English fallback for 16)". Mitigating: all 228 sit in keys D2-001 shows are never rendered, so no viewer sees them today.

**Independent verification.** REPRODUCED AT THE BYTE LEVEL, IN PRODUCTION — but the effect is nil, so S3 is wrong. Corrected to S4.

WHAT I DID AND SAW (data claim — exactly as written):
1. Parsed all 20 dictionaries out of /Users/jothamhall/E! CREATOR ECONOMY/verza-tv/lib/i18n.ts (locale consts at lines en:169 es:219 fr:269 pt:319 de:369 it:419 ja:469 ko:519 zh:569 hi:619 ar:669 ru:719 tr:769 pl:819 nl:869 th:919 vi:969 id:1019 tl:1069 sw:1119) and diffed every cell against en. Result: zh, hi, ar, ru, tr, pl, nl, th, vi, id, tl, sw each have 19 of the 20 content.* values byte-identical to English; the only differing key in every one of the 12 is content.freeEpisodeOf. 12 x 19 = 228 exactly. es/fr/pt/de/it/ja/ko have the block translated (0-2 incidental cognate matches: "Synopsis" fr, "Info", "Cast" it).
2. The 12 are otherwise translated — the English island is precisely content.*: whole-dictionary identity is zh 20/115, hi 20/115, ar 20/115, ru 20/115, th 20/115, and all 20 of those matches are the content.* keys.
3. VERIFIED IN THE DEPLOYED BUNDLE, not the build: downloaded https://www.verzatv.com/_next/static/immutable/chunks/428d7hhx0m19l.js (linked from the live homepage, dpl_FEduFW6ftQZyapPx28PouXp55wk3)

---

### D2-005 — Arabic renders left-to-right everywhere: the deployed bundle never sets document.documentElement.dir and ships no [dir="rtl"] CSS.

*Raised by D2 — Localization. All 20 locales x all *

**Reproduction.** 1. Download all 23 JS chunks and 6 CSS files referenced by /, /me, /library, /shop, /sign-in, /sign-up, /series/the-mistress-trap and /series/the-mistress-trap/1 from www.verzatv.com. 2. grep for documentElement.dir → zero hits (documentElement.lang has 5). 3. grep the CSS for [dir=, :dir(, direction:rtl → zero hits; the only `direction:` declarations are flex-direction. 4. The single RTL declaration in the whole product is the paywall overlay div.

**Evidence.** Deployed chunk chunks/27_6kgf3tx4s2.js contains `lang:X,dir:"ar"===X?"rtl":void 0` (= components/EpisodeFeed.tsx:2511). components/LangProvider.tsx:90 and components/ContentTranslator.tsx:58 set only `.lang`. app/layout.tsx:107 hard-codes `<html lang="en">` with no dir. Even inside the one rtl container, the benefit list keeps physical utilities (`text-left` at EpisodeFeed.tsx:2535, `ml-2` at :2561), so it renders left-aligned inside an rtl box.

**Independent verification.** FACT CONFIRMED EXACTLY, SEVERITY WRONG (S3 -> S4).

COUNT REPRODUCED: Parsed all 20 locale blocks from lib/i18n.ts and diffed every content.* value against en. zh, hi, ar, ru, tr, pl, nl, th, vi, id, tl, sw each have 19 of 20 byte-identical to English; sole exception is content.freeEpisodeOf. 12 x 19 = 228 exactly. es/fr/pt/de/it/ja/ko are translated (0-2 incidental matches such as "Info"/"Cast").

VERIFIED IN THE DEPLOYED BUNDLE, NOT THE BUILD: the dictionary ships in https://www.verzatv.com/_next/static/immutable/chunks/428d7hhx0m19l.js, loaded on both the homepage and /series/the-mistress-trap/1. I extracted all 20 dictionaries from that production file and re-ran the diff: same 12 locales, same 19/20, same 228. Raiser's non-Latin-script test also holds: zh/hi/ar/ru/th each carry exactly 1 of 20 content.* values in their own script, vs 95/115 for the whole dictionary.

WHY S4 AND NOT S3 (the effect, not the assignment): no viewer can ever see any of the 228 cells.
- 19 of the 20 content.* keys are referenced ONLY by components/CoinPaywall.tsx, components/SeriesInfoButton.tsx and components/SeriesInfoDrawer.tsx. Nothing in the repo imports any of them: no importer, no barrel (com

---

### D2-010 — The feed-integrity i18n gate covers 26 of 115 keys and cannot detect an English fallback at all — proved by negative control.

*Raised by D2 — Localization. All 20 locales x all *

**Reproduction.** Re-implement the assertion at scripts/test-feed-integrity.mjs:2036-2077 verbatim and run it against mutated copies of the dictionaries (no repo file touched). Positive controls fire: deleting pl.paywall.cta → FAIL; stripping {price} from ru.paywall.cta → FAIL; removing "Stripe" from de.paywall.secure → FAIL. Negative controls do NOT fire: replacing the entire es paywall block with English → PASS; replacing all 100 non-paywall ja keys with English → PASS; dropping {n} and {total} from fr.content.episodeOf → PASS.

**Evidence.** scripts/test-feed-integrity.mjs:2039-2041 filters to `k.startsWith("paywall.") || k.startsWith("checkout.") || k.startsWith("language.")` (26 keys); the placeholder map at :2044-2050 whitelists 5 keys, so token drift in the other 110 is invisible; there is no comparison against dictionaries.en anywhere. The checks are correctly placed ABOVE the terminal process.exit(1) at :2373, so standing rule 3 is satisfied for what they do cover — the gap is scope, not placement. `npm run test:feed-integrity` PASSes today. Key PRESENCE is separately guaranteed by `npx tsc --noEmit`: deleting ko.legal.refund from a scratch copy yields `error TS2741: Property '"legal.refund"' is missing ... but required in

**Independent verification.** CONFIRMED in the deployed bundle, not just source. Every clause of the claim reproduces.

WHAT I DID. Fetched https://www.verzatv.com/ (200, dpl_FEduFW6ftQZyapPx28PouXp55wk3), pulled all 14 referenced chunks from /_next/static/immutable/chunks/, and found the i18n module in 428d7hhx0m19l.js. I did not read the assignment — I extracted the minified LOCALES array (`t`) and resolveLocale (`c`) verbatim out of that deployed file and EXECUTED them in node:
  ["zh-Hant-TW"] -> zh   ["zh-TW"] -> zh   ["zh-HK"] -> zh   ["zh-Hant"] -> zh   ["zh-MO"] -> zh
  ["zh-Hant-TW","en-US"] -> zh   (a Taiwan/HK reader who lists English second still lands in Simplified, not English)
  ["pt-PT"] -> pt
Deployed LOCALES has 20 entries and exactly one Chinese row: {code:"zh", label:"Chinese", native:"中文"}.

Then I JSON-parsed the deployed `zh` dictionary (115 keys) and printed the three cited strings verbatim: "nav.discover"=发现, "nav.library"=媒体库, "paywall.unlockAll"=解锁全部剧集 — Simplified (Traditional would be 發現 / 媒體庫 / 解鎖全部劇集). Also 登录, 试看, 别停, 找不到这部剧 throughout. grep for Traditional 發現 across all 14 deployed chunks: zero hits. "Hant"/"Hans" appear nowhere in the bundle (the single grep hit was the CSS key

---

### D2-011 — 52 rendered cells are untranslated English, including the sound toggle reading "On"/"Off" in six Latin-script locales.

*Raised by D2 — Localization. All 20 locales x all *

**Reproduction.** Compare each of the 52 rendered keys' non-en cells to en. shorts.soundOn/soundOff = "On"/"Off" in es, fr, pt, it, id, tl — while zh (开/关), ja, ko, ru, th and the rest do translate them, so this is inconsistency, not policy.

**Evidence.** Per-key counts: tab.popular 19/19 locales ("Hot" — plausibly deliberate brand word, flagged not asserted); tab.drama 8 (es,pt,de,it,nl,id,tl,sw — cognate, likely fine); tab.reality 7; shorts.soundOn 6 and shorts.soundOff 6 (es,fr,pt,it,id,tl); nav.shorts 2 (nl,tl); tab.redCarpet 2 (it,tl); nav.shop 1 (de); nav.profile 1 (tl). Rendered at components/HorizontalFeed.tsx:283 and components/ShortsFeed.tsx:141.

**Independent verification.** CONFIRMED on production, but the "52" is inflated ~4x. The asserted defect is real; the headline number is not.

WHAT REPRODUCES (live, www.verzatv.com):
Loaded https://www.verzatv.com/shorts in Chrome with locale es (LangProvider hydrates from localStorage `verza-lang`, else Accept-Language — /Users/jothamhall/E! CREATOR ECONOMY/verza-tv/components/LangProvider.tsx). Queried the live DOM: the shorts action rail renders four VISIBLE stacked labels — ["Me gusta", "Lista", "Compartir", "On"]. The "On" span is display:block, visibility:visible, opacity:1, fontSize 10px, rect 14x15 at (457,547), inViewport true. Three Spanish words and one English word on the same rail. Tapping to mute swaps it to "Off".
Mechanism: /Users/jothamhall/E! CREATOR ECONOMY/verza-tv/components/ShortsFeed.tsx:141 passes t("shorts.soundOn"/"soundOff") as RailButton's `label`, and RailButton (same file, lines 34-54) renders it BOTH as aria-label AND as `<span className="text-[10px] ...">{label}</span>` — visible text, not a11y-only.

DEPLOYED-BUNDLE EVIDENCE (not the build): downloaded every chunk referenced by the production homepage; the dictionaries live in /_next/static/immutable/chunks/428d7hhx0m19l.js. Al

---

### D2-012 — Dates and formatted numbers ignore the selected UI locale — one surface uses the browser's locale, two hard-code en-US.

*Raised by D2 — Localization. All 20 locales x all *

**Reproduction.** Set the app to Japanese in a browser whose OS locale is English. Purchase History still formats dates with the browser locale, not ja; the VIP expiry always formats as en-US regardless of both.

**Evidence.** components/PurchaseHistoryList.tsx:47 `d.toLocaleDateString(undefined, {...})` — `undefined` is the browser locale, not the LangProvider locale. components/VipCard.tsx:126 `toLocaleDateString("en-US", ...)`. lib/coins.ts:18 `n.toLocaleString("en-US")`. LangProvider exposes formatPrice for money but no equivalent for dates or plain numbers, and lib/price.ts formatMoney is the only locale-aware formatter in the product. (Admin surfaces AdminDashboard.tsx:351,593 and AdminReview.tsx:124 have the same pattern; out of viewer scope.)

**Independent verification.** CONFIRMED but scoped down hard: the real defect is 12 cells, not 52. 40 of the 52 do not survive.

WHAT I DID
1. Deployed bundle, not the build. Fetched https://www.verzatv.com/shorts, pulled every /_next/static/immutable/chunks/*.js it references, found the shipped dictionary in chunks/428d7hhx0m19l.js and extracted all 20 locale values for each claimed key by position (order: en,es,fr,pt,de,it,ja,ko,zh,hi,ar,ru,tr,pl,nl,th,vi,id,tl,sw). Shipped values match lib/i18n.ts exactly — nothing stale.
2. Live render, Spanish. Loaded www.verzatv.com/shorts, set localStorage verza-lang=es, reloaded. The ShortsFeed rail read: "Me gusta", "Lista", "Compartir", then "On". RailButton (ShortsFeed.tsx:34-55) renders {label} as a visible 10px span AND as aria-label, so this is visible copy, not just a11y text.
3. Live render, French tab bar. www.verzatv.com/ with verza-lang=fr, documentElement.lang=fr, tab rail read: DRAME, HOT, [Tubi logo], ANIME, ESPAÑOL, BOLLYWOOD, TÉLÉRÉALITÉ, CREATORS, TAPIS ROUGE, MUSIQUE. Bottom nav: Découvrir, Courts, Boutique, Bibliothèque, Profil.

WHAT SURVIVES (12 cells)
shorts.soundOn/soundOff = "On"/"Off" in es, fr, pt, it, id, tl, while ja オン/オフ, ko 켜기/끄기, zh 开/关, 

---

### D2-013 — The Anime empty state — the named house pattern for empty routes — is hard-coded English in all 20 locales.

*Raised by D2 — Localization. All 20 locales x all *

**Reproduction.** Open / with the Anime tab selected in any locale. The heading, body and button never change language.

**Evidence.** components/BrowsePage.tsx:716 `{activeTabLabel} is coming soon`; :718-721 "We&rsquo;re lining up the first titles for this section. Everything else on VERZA is ready to watch right now."; :729 "Browse Drama". BrowsePage.tsx is a client component ("use client" at line 1) so t() is available here — unlike D2-002/D2-003 this is a missed call site, not a boundary problem. Related dictionary entries exist unused: misc.comingSoon and library.comingSoon (all 20 locales), library.browseShows ("Browse Shows"). Flagged explicitly because this state is on the DO-NOT-REGRESS list: the state itself is good, only its localization is missing.

**Independent verification.** CONFIRMED on production. Deployed-bundle check: chunks/1aseb4gggkekc.js from www.verzatv.com contains the panel as three bare literals with NO dictionary lookup — [Z," is coming soon"], "We're lining up the first titles for this section. Everything else on VERZA is ready to watch right now.", children:"Browse Drama" (Z = activeTabLabel, itself the raw English label from BROWSE_TABS). Because they are literals and not a lookup, all 20 locales are English by construction, not by sampling.

Live repro at https://www.verzatv.com/?tab=anime setting localStorage["verza-lang"]: es -> html lang=es, nav "Descubrir/Cortos/Tienda/Biblioteca/Perfil", tabs "ALFOMBRA ROJA/MUSICA", panel fully English. ru -> nav "Главная/Шортс/Магазин/Библиотека/Профиль", panel fully English. ar -> html lang=ar, nav "اكتشف/مقاطع/متجر/مكتبة/الملف الشخصي", tab "دراما"; screenshotted the card rendering 100% English inside an otherwise fully Arabic app.

Inherited facts re-checked rather than trusted: the i18n system is real and wired (lib/i18n.ts = 20 locales; LangProvider mounted app/layout.tsx:139; LangDropdown in Header; Spanish dict live in chunks/428d7hhx0m19l.js via "Próximamente"). The raiser's unused-entry c

---

### D2-015 — Copy-quality defects inside otherwise-correct translations: gendered Polish, inconsistent Hindi orthography, mixed Turkish register, missing French narrow spaces.

*Raised by D2 — Localization. All 20 locales x all *

**Reproduction.** Read the rendered strings per locale. pl paywall.previewOver uses the masculine past-tense form "obejrzałeś", so a female Polish viewer is addressed as male on the payment screen. hi spells the same word two ways: "मुफ्त" (paywall.previewOver) and "मुफ़्त" (content.freeEpisodeOf). tr mixes formal ("izlediniz", "durmayın", "hesabınızdan") with informal imperatives ("Geri dön", "kilidini aç"). fr omits the required narrow no-break space before high punctuation.

**Evidence.** lib/i18n.ts pl block: "Właśnie obejrzałeś darmowy fragment {title}...". hi blocks: "आपने अभी {title} का मुफ्त प्रीव्यू देखा" vs "मुफ़्त एपिसोड {n} / {total}". tr blocks as quoted. fr cells failing the space rule: shorts.copied "Copié!", auth.noAccount "Pas de compte?", auth.haveAccount "Déjà un compte?". Clean on the mechanical checks: zero mojibake, zero U+FFFD, zero straight apostrophes (all 20 use U+2019), zero padding/double spaces, Spanish inverted ¿/¡ present wherever needed, no ASCII punctuation inside ja/zh sentences, brand tokens (VERZA TV, Verza, Stripe, Google, Apple) intact in all 20.

**Independent verification.** CONFIRMED in the DEPLOYED bundle, not just the source. Fetched https://www.verzatv.com/ (deployment dpl_FEduFW6ftQZyapPx28PouXp55wk3), pulled every referenced chunk, and found the full 20-locale dictionary (20x paywall.previewOver, 20x content.freeEpisodeOf) shipped in /_next/static/immutable/chunks/428d7hhx0m19l.js. All four sub-claims reproduce there verbatim.

1) pl — DEPLOYED: "paywall.previewOver":"Właśnie obejrzałeś darmowy fragment {title}. Nie przerywaj — historia dopiero się rozkręca." `obejrzałeś` is masculine 2nd-sg past; a Polish woman is addressed as a man on the payment screen. I regex-scanned all ~250 keys of the deployed pl block for gendered past forms (łeś|łaś|łem|łam) — this is the ONLY hit, so it is one isolated string, not a systemic pl problem. `obejrzałaś` count in bundle: 0.

2) hi — CONFIRMED by codepoint, not by string match. content.freeEpisodeOf = "मुफ़्त एपिसोड {n} / {total}" → U+092E U+0941 **U+095E (FA, precomposed nukta)** U+094D U+0924. paywall.previewOver = "…का मुफ्त प्रीव्यू…" → U+092E U+0941 **U+092B (PHA, no nukta)** U+094D U+0924. NFC-inequal. Caveat the raiser did not state: both are attested Hindi spellings, so neither is wrong — this is int

---

### D2-016 — Controls and overlays carry English-only accessible names and labels with no dictionary keys.

*Raised by D2 — Localization. All 20 locales x all *

**Reproduction.** Read the aria-label and JSX text of the interactive chrome. A screen reader in any of the 19 non-English locales announces these in English.

**Evidence.** components/LangDropdown.tsx:28 aria-label="Change language" (the control for changing language is itself unlocalized). components/EpisodeFeed.tsx:1111 aria-label="Loading", :2191 "Back", :2312 "Share", :2332 "More options", :2372 "Share this episode", :2418 "Copy link". components/EpisodeDropdown.tsx:148 "FREE" badge. Phase 1 added more of the same: aria-label="All categories", "Back to profile", "Categories", "Close", "Open Tubi to stream free movies and shows", label="Reset Password" (git diff 9b2fc27^..9b2fc27). misc.close exists in all 20 locales and is never used.

**Independent verification.** CONFIRMED — reproduced on production in a live Spanish session.

WHAT I DID / SAW
1. The i18n system is real and live, so the premise holds. /Users/jothamhall/E! CREATOR ECONOMY/verza-tv/lib/i18n.ts ships 20 locales x 115 keys, every locale fully translated (es/fr/pt/de/it/ja/ko/zh/hi/ar/ru/tr/pl/nl/th/vi/id/tl/sw). /Users/jothamhall/E! CREATOR ECONOMY/verza-tv/components/LangProvider.tsx:82-92 resolves `navigator.languages`, so a Spanish browser lands in Spanish with zero clicks.

2. Deployed SSR HTML, real catalog row resolved from lib/catalog.ts (96 slugs). GET https://www.verzatv.com/series/the-mistress-trap/1 -> 200. Every aria-label in the served HTML is an English literal: "Back", "Share", "More options", "Like", "Save to My List", "Unmute", "Fullscreen", "Change language", "Search". GET https://www.verzatv.com/ -> 200 carries "Change language", "Categories", "Search", "Slide 1..6".

3. Deployed bundle, not the build. Pulled the 14 chunks referenced by the live homepage from /_next/static/immutable/chunks/. Chunk 3z23pxudvy0-6.js contains the literals "Change language", "Close sitemap", "Close bag".

4. THE EFFECT, in a browser on www.verzatv.com. Set verza-lang=es, reloaded

---

### D2-017 — 20 locales, zero localized URLs: every server-rendered page ships lang="en" and no hreflang, so crawlers and the first paint are always English.

*Raised by D2 — Localization. All 20 locales x all *

**Reproduction.** curl https://www.verzatv.com/ → `<html ... lang="en" ...>`. Same for all 8 pages fetched. Search every metadata export for alternates.languages or hreflang → zero hits across ~20 files that all set alternates.canonical only. Localization is entirely client-side and post-hydration, so all 2,214 prerendered episode pages, 96 show pages and every static page are indexed only in English, and every viewer sees an English frame before the swap.

**Evidence.** app/layout.tsx:107 `<html lang="en" ...>` with the value only corrected later by components/LangProvider.tsx:90 and components/ContentTranslator.tsx:58 inside effects. alternates entries at app/layout.tsx:43, app/page.tsx:11, app/series/[slug]/page.tsx:58, app/series/[slug]/[episode]/page.tsx:64 and 16 others are canonical-only. This is a consequence of AGENTS.md rule 13 (no cookies/headers on the server), so it is a documented trade-off rather than an accident — recorded so the trade-off is visible rather than assumed.

**Independent verification.** CONFIRMED at S4 (raiser's severity stands; no correction needed). Headline reproduces in the deployed bundle, but two sub-claims are false and the scoping changes the remedy.

WHAT I DID AND SAW (all against https://www.verzatv.com, URLs resolved from real rows in lib/catalog.ts (96 slugs) and lib/data/locations.ts, not string-matched):
Fetched 13 live URLs — /, /series/the-mistress-trap, /series/the-mistress-trap/1, /series/collateral-hearts, /shop, /about, /discover, /genres, /terms, /watch-in/{new-york,mexico,japan,india}. All 200. EVERY one served `<html ... lang="en" ...>`; homepage exactly: `<html data-dpl-id="dpl_FEduFW6ftQZyapPx28PouXp55wk3" lang="en" ...>`. Zero `<link rel="alternate" hreflang>` on every content page. NOTE ON METHOD: my first sweep grepped lowercase `hreflang="` and returned NONE everywhere — that was a false negative, Next serves the attribute as `hrefLang`. Re-ran case-insensitively; the content-page result held, the watch-in result flipped (below).
Confirmed 20 locales at lib/i18n.ts:7-32, whose file header (lib/i18n.ts:1-4) states "No URL routing — uses localStorage + React context". components/LangProvider.tsx:90 sets document.documentElement.lang ins

---

### D2-018 — 257 catalog content strings — every title, logline and genre — render English in all 20 locales, including inside otherwise-translated sentences.

*Raised by D2 — Localization. All 20 locales x all *

**Reproduction.** Load lib/catalog.ts: 96 titles, 96 loglines, 65 distinct genre strings, none of them keyed. A Russian viewer's paywall reads "Вы только что посмотрели бесплатный фрагмент «The Escort They Framed»" — translated frame, English content. Browse tiles read "Drama · Betrayal" in every locale.

**Evidence.** Verified against production: / renders "The Escort They Framed", "Drama · Betrayal", "Romance · Comedy", "Psychological thriller" etc. as plain text; /library renders channel descriptions ("Reality meets comedy. Abandoned storage units, auctions, and hidden fortunes.") in English. lib/i18n.ts covers UI chrome only, by design — components/ContentTranslator.tsx:41 says so explicitly ("The real fix for the surfaces that are still English is to move their copy into lib/i18n.ts"). Recorded as a bounded, counted gap so it is not mistaken for coverage.

**Independent verification.** CONFIRMED in the deployed bundle; counts are exact, not approximate.

(1) Production HTML: curl https://www.verzatv.com/ (200, 231KB) renders "The Escort They Framed", "Drama · Betrayal", "Psychological thriller", "Romance · Comedy" as plain text. curl https://www.verzatv.com/library (200) contains "Reality meets comedy. Abandoned storage units, auctions, and hidden fortunes." verbatim.

(2) Deployed catalog chunk /_next/static/immutable/chunks/12o29nrz06ckg.js, parsed: exactly 96 titles + 96 loglines + 65 distinct genres = 257, matching the finding exactly. Rows are flat single strings with no locale variant and no key: {slug:"the-mistress-trap",title:"The Escort They Framed",logline:"Hired for one night and framed for a murder...",genre:"Drama · Betrayal",...}.

(3) The mixed-sentence claim reproduces at the source level and in the shipped JS. Chunk 428d7hhx0m19l.js contains verbatim: «Вы только что посмотрели бесплатный фрагмент «{title}». Не останавливайтесь — история только начинается.» The sole consumer is components/EpisodeFeed.tsx:2532 — t("paywall.previewOver", { title: seriesTitle }) — and seriesTitle comes from app/series/[slug]/[episode]/page.tsx:174 as seriesTitle={ser

---

### D3-001 — 22 of 96 show pages print the synopsis twice: SERIES_DETAIL.description begins with the catalog logline verbatim, and the page renders both as consecutive <p> elements with no dedupe. The prior report of "roughly a quart

*Raised by S3 — SHOW PAGES: all 96 catalog rows (91*

**Reproduction.** Open https://www.verzatv.com/series/the-unforgettable-love and scroll to the copy block. The sentence "He erased her from his memory to survive. She walks back into his life and he feels everything — without knowing why." appears once as the logline, then again immediately below as the first 22 of the description's 28 words, separated only by the "2025 · VERZA Originals" line. Repeats on the other 21 slugs listed in the report.

**Evidence.** app/series/[slug]/page.tsx:203 renders {series.logline}; :228 renders {series.description}. lib/series-detail.ts:418 description for the-unforgettable-love = "He erased her from his memory to survive. She walks back into his life and he feels everything — without knowing why. Some love stories survive even amnesia." vs lib/catalog.ts:859 logline = "He erased her from his memory to survive. She walks back into his life and he feels everything — without knowing why." Same pattern at lib/series-detail.ts:430 (the-ceo) and :412 (rosy-psycho). Measured across all 96 fetched pages: 22 exact-prefix duplicates, 0 exact full duplicates, repeat share 31%–79% of the description. Screenshot captured. No

**Independent verification.** CONFIRMED in substance, severity corrected S3 -> S4, with three sub-claims corrected and one material counter-finding.

WHAT I DID / SAW

1. Unreachability - CONFIRMED. Repo-wide grep (excluding node_modules/.next/.git) for `CoinPaywall` and `components/Player` returns zero importers. No `components/index.ts` barrel exists; the only two `require(` calls in app/components/lib are `./series-detail` and `./supabase-source`; zero `dynamic(` imports anywhere. Every remaining hit is documentation or the files themselves. The three `Player` hits in code are `lib/instant-player.ts` helpers (`startInstantPlayer`/`adoptInstantPlayer`), unrelated.

2. Not shipped - CONFIRMED, and this is what moves the severity. Fresh local build (/Users/jothamhall/E! CREATOR ECONOMY/verza-tv/.next, BUILD_ID i2kLgw78_1KEnHFXFUagk, built 15:56 today): `player_unlock_popup` = 0 files, `coin_paywall` = 0 files, `CoinPaywall` = 0 files, against positive control `episode_feed` = 11 files. Production: I fetched 31 distinct chunks (1.84 MB) reachable from /, /shop, /me, /library, /sign-in, /horizontal, /shorts and /series/the-billionaires-betrayal(/6). `player_unlock_popup` ABSENT, `coin_paywall` ABSENT; control `ep

---

### D3-004 — The $1.99 on the show page is a hard-coded string literal, not lib/price.ts. It is unguarded by the feed-integrity gate and is the only money surface in the product that is not locale-formatted.

*Raised by S3 — SHOW PAGES: all 96 catalog rows (91 · **touches money or the shipped rail***

**Reproduction.** Set localStorage 'verza-lang' to 'es' and reload https://www.verzatv.com/series/the-pendleton-secret. <html lang> flips to es and the audio badge renders "Audio en inglés", but the unlock card still renders "$1.99" — while components/EpisodeFeed.tsx renders the same price through formatSeriesUnlockPrice(locale), which for es produces "1,99 US$". Two renderings of one price in one session.

**Evidence.** app/series/[slug]/page.tsx:359 is the literal `$1.99`. lib/price.ts's own header names this exact file as one of the places the literal had to be removed from — "'$1.99' appears verbatim in components/EpisodeFeed.tsx (twice), app/series/[slug]/page.tsx, and two dead components" — and only EpisodeFeed was migrated (grep for imports of @/lib/price returns components/EpisodeFeed.tsx and components/LangProvider.tsx only). scripts/test-feed-integrity.mjs:2106-2130 asserts lib/price.ts equals SERIES_UNLOCK_PRICE_CENTS, but nothing asserts the show page reads it — the check passes with the show-page literal wrong. The number is correct today; nothing would fail if it stopped being.

**Independent verification.** CONFIRMED — reproduced exactly as raised, in the source and in the deployed bundle. Severity S4 stands (it is the rubric's floor and this sits right on it).

WHAT I DID / SAW

1. Source, cited lines verified byte-for-byte at the cited numbers:
   - /Users/jothamhall/E! CREATOR ECONOMY/verza-tv/app/api/events/route.ts:13 = " * Rate limited by middleware (catch-all /api/ tier: 30/min/IP)."
   - /Users/jothamhall/E! CREATOR ECONOMY/verza-tv/middleware.ts:51 = "  { pattern: /^\/api\/events/, limit: 180 },"
   - /Users/jothamhall/E! CREATOR ECONOMY/verza-tv/middleware.ts:54 = "  { pattern: /^\/api\//, limit: 30 },"
   RATE_TIERS is first-match-wins (middleware.ts:24 comment, getTierLimit() at :95-99 returns on first .test() hit), and the dedicated /api/events tier sits three lines ABOVE the catch-all. So the comment is wrong twice: wrong tier name AND wrong number, understating the real limit by 6x.

2. Production, effect verified — not the assignment (standing rule 1). Deployed www.verzatv.com:
   POST /api/events with {"event":"app_opened","props":{"audit":"verify-S2-016"}}
     -> HTTP/2 202, x-ratelimit-limit: 180, x-ratelimit-remaining: 179, x-ratelimit-reset: 1788042089
   NEGATIV

---

### D3-006 — Twelve user-visible strings on all 96 show pages are hard-coded English and render untranslated in 19 of 20 locales — including several for which translations already ship in lib/i18n.ts.

*Raised by S3 — SHOW PAGES: all 96 catalog rows (91*

**Reproduction.** In the browser on www.verzatv.com run localStorage.setItem('verza-lang','es') then load /series/the-pendleton-secret. Result measured in production: htmlLang 'es', audio badge correctly 'Audio en inglés', and everything else still English — "60 episodes", "Cast", "First 5 Episodes FREE", "Watch Episode 1 Free", "Series Unlock", "All 60 episodes · one-time purchase", "EP 1 of 60 / All Episodes", "$1.99".

**Evidence.** Untranslated literals: app/series/[slug]/page.tsx:181 ("{n} episodes" / "Episodes announced soon"), :236 ("Cast"), :284-285 ("All Episodes FREE" / "First {n} Episodes FREE"), :307 ("Watch Episode 1 Free"), :322 ("Coming Soon"), :346 ("Series Unlock"), :351 ("All {n} episodes · one-time purchase"), :359 ("$1.99"), :408 ("Episodes are on the way"), :410 (the empty-state paragraph), :420 ("Browse VERZA"). Translations that already exist and are not used: lib/i18n.ts:191/241 content.watchFree ("Watch Episode 1 Free"/"Ver Episodio 1 Gratis"), content.cast ("Cast"/"Reparto"), content.episodes, content.unlockSeries, content.oneTimePayment, content.allEpisodesIncluded, content.allEpisodes; :190/240 

**Independent verification.** CONFIRMED. Comment-only defect; the shipped behaviour is correct and the DO-NOT-REGRESS asset (instant play from a poster tap) is intact and verified live. Severity S4 as claimed is right by the rubric — zero viewer impact, pure consistency/maintenance hazard.

WHAT I DID AND SAW

1. Source, the contradiction. /Users/jothamhall/E! CREATOR ECONOMY/verza-tv/components/BrowsePage.tsx:250-252 reads "ONLY for links whose destination is the player. / Continue Watching is the last one on this page: every tile, hero, category / row and search result now opens the show page instead". Six lines below, :259-286 defines posterClick, which seeds sessionStorage["verza-transition"] and calls startInstantPlayer(publicId).

2. Call sites (grep, same file). posterHref is the href at :668, :896, :950, :987, :1192; posterClick is the onClick at :631, :670, :899, :953, :989, :1201. Six player-destined links, five of them the exact tiles/heroes/category rows the comment says now go to the show page. lib/series-href.ts posterHref() returns episodeHref(series,1) = /series/<slug>/1 — the player — and its own docblock states the opposite of BrowsePage's: "A poster tap starts the video, immediately, with no 

---

### D3-008 — No show page has a back affordance. A viewer who reaches a Bollywood, Español, Reality or Red-Carpet title cannot return to the tab they came from without the OS back gesture.

*Raised by S3 — SHOW PAGES: all 96 catalog rows (91*

**Reproduction.** Open https://www.verzatv.com/series/salt-and-pepper. The header holds only a language button, the logo (href="/") and search; the bottom nav's "Discover" is also href="/". Both drop the viewer on the default Drama tab, not ?tab=bollywood.

**Evidence.** Measured in the deployed DOM: document.querySelector('[aria-label*="ack" i]') → null. Header interactive elements are exactly [Change language 36×36, logo 200×62 → "/", Search 36×36]. Bottom nav hrefs: /, /shorts, /shop, /library, /me. By contrast components/EpisodeFeed.tsx implements a tab-preserving back (window.location.href = backHref → /?tab=reality etc.), so the pattern exists in the product and the show page does not use it.

**Independent verification.** CONFIRMED — reproduced in source and, per standing rule 4, in the deployed production bundle. Severity S4 is correct and unchanged.

WHAT I DID / SAW

1. Source, exact lines as claimed. /Users/jothamhall/E! CREATOR ECONOMY/verza-tv/components/EpisodeFeed.tsx. `grep -n "startedRef.current = false"` returns exactly 5 hits: 369, 370, 624, 868, 869. Rendering leading whitespace literally confirms both halves of the claim:
  369 |......startedRef.current = false;
  370 |......startedRef.current = false;
  371 |....setStarted(false);
  868 |......startedRef.current = false;
  869 |......startedRef.current = false;
  870 |....setStarted(false);
Surrounding statements in both blocks sit at 6 spaces; the two `setStarted(false)` lines sit at 4. Block 1 is the auth-invalidation teardown inside subscribeAuthorizedPlaybackInvalidation (effect at :345); block 2 is the far-slide teardown inside queueMicrotask (effect at :859).

2. The control the reporter did not cite, which makes it conclusive. The same reset pair appears a third time in `fullReattach` at :624-625 and is CLEAN — `startedRef.current = false;` once, `setStarted(false);` once, both at a consistent 4 spaces. Three sites, identical i

---

### D3-010 — /series/[slug] has no route-level error.tsx and no loading.tsx, and the app has no root error boundary — so a render failure on any of the 96 show pages falls through to Next's unbranded default instead of an honest stat

*Raised by S3 — SHOW PAGES: all 96 catalog rows (91*

**Reproduction.** find app -name error.tsx -o -name loading.tsx -o -name global-error.tsx returns exactly one file: app/series/[slug]/[episode]/error.tsx. The show route, which is the landing page for search traffic and the destination for all 5 coming-soon tiles, has neither.

**Evidence.** Repo enumeration of app/: only app/not-found.tsx and app/series/[slug]/[episode]/error.tsx exist. The 5 coming-soon rows are excluded from generateStaticParams (app/series/[slug]/page.tsx:27-31) and render on demand, so they are exactly the pages most likely to need a loading state; production headers for /series/the-chairmans-revenge confirm x-matched-path: /series/[slug] with x-nextjs-stale-time 300 and x-vercel-cache HIT/MISS depending on age.

**Independent verification.** CONFIRMED, severity S4 upheld.

WHAT I DID
1. Evaluated the real catalog post-normalizer. Wrote a throwaway script (scratchpad only, no repo files touched) using the same transpile-and-eval loader the gate itself uses (loadTypeScriptModule, /Users/jothamhall/E! CREATOR ECONOMY/verza-tv/scripts/test-feed-integrity.mjs:248) to load lib/mux-public-map.ts, lib/mux-map.ts and lib/catalog.ts, so the normalizer at /Users/jothamhall/E! CREATOR ECONOMY/verza-tv/lib/catalog.ts:1273-1279 had actually run before I counted. Asserted against the resolved objects, not string matching.
2. Re-derived the pre-normalizer literals by parsing the source text, so I could separate "wholly free" from "clamped".
3. Cross-checked every off-5 row against production HTML props on www.verzatv.com.
4. Pulled the deployed player chunk and read the shipped guard, not the build.
5. Ran npm run test:feed-integrity.

WHAT I SAW
Catalog: 96 rows, 91 live, 5 coming soon. 86 live rows have freeEpisodes === 5. Exactly 5 do not:
  the-dumb-billionaire-heiress-in-love free=50 eps=50, storage-pirates free=13 eps=13, too-much-junk free=1 eps=1, exes-premiere free=12 eps=12, love-awards free=13 eps=13 — all coinPerEpisode 0.

---

### D3-011 — The "Search creators and shows" input on the Creators tab is inert: it accepts text and the page content is byte-identical before and after, because there are zero creator channels and the empty-state copy does not vary 

*Raised by D3 — Dead Ends. All 535 interactive elem*

**Reproduction.** Open https://www.verzatv.com/, tap CREATORS, scroll to "Who is already here" and type anything in the search box. Nothing on screen changes.

**Evidence.** Live: with the input empty and then with value "zzz", the surrounding container's innerText is identical (comparison returned true) while input.value confirmed "zzz" — so the keystrokes registered and produced no observable effect. Source: components/CreatorsLanding.tsx:345-368 — when liveChannels.length === 0 the block always renders "The first channels are being built", never the "No match" branch, regardless of query. The underlying set really is empty: /@someone and /somehandle both return 404 on production. Contrast: the global header search does this correctly — typing "billion" returns 22 results and "zzzzqqqqxxxx" renders "No results for “zzzzqqqqxxxx”".

**Independent verification.** Reproduced on the live site, not the build.

1) Real data: GET https://www.verzatv.com/api/creator/channels returns HTTP 200 `{"channels":[]}`. Zero creator channels exist in production, so `liveChannels.length === 0` is the permanent state today.

2) Deployed bundle (not source): pulled every /_next/static chunk referenced by the live homepage. Chunk /_next/static/immutable/chunks/1aseb4gggkekc.js contains the shipped JSX. The input renders unconditionally, and the empty-state text is gated only on the channel count, never on the query: `0===x.length ? ... children: 0===d.length ? "The first channels are being built" : "No match"` where `x`=visible and `d`=liveChannels. With `d` empty, `x` is empty for every query, so the "No match" branch is unreachable in production.

3) Live browser, https://www.verzatv.com/?tab=creators, CREATORS tab, "Who is already here" section: the input is real and interactive — visible:true, 354x42, display inline-block, visibility visible, disabled:false, readOnly:false. Captured the surrounding container's innerText, set the value to "zzz" via the native value setter + bubbling input event, waited 600ms, re-read it. `identical: true` while `inp.value =

---

### D3-012 — /horizontal is an orphan page — nothing in the product links to it and it is absent from the XML sitemap — that publishes a second, stale episode list for a live show: "SEASON 1 / 8 episodes" for Storage Pirates, which t

*Raised by D3 — Dead Ends. All 535 interactive elem*

**Reproduction.** Open https://www.verzatv.com/horizontal directly (there is no link to it anywhere). It renders a full Storage Pirates episode list headed "SEASON 1 8 episodes", listing a Teaser plus S1 E1-E7.

**Evidence.** Zero pages out of the 485 crawled contain href="/horizontal". Not present in /sitemaps/pages.xml, shows.xml, genres.xml or episodes.xml. Page text on production: "Storage Pirates ... Horizontal Video ... SEASON 1 8 episodes 0:50 1080p Teaser ... S1 E6 The Real Furniture King". Manifest catalog row: {slug: storage-pirates, status: live, episodeCount: 13}, and the Reality tab routes to /series/storage-pirates/1 (200). The page carries 7 interactive elements (components/HorizontalFeed.tsx x5, components/HorizontalBackButton.tsx x2) that no navigation path reaches. Two more orphan pages behave the same way: /share (1 element, unlinked, unindexed) and /learn/<slug> (3 pages, 200, unlinked, uninde

**Independent verification.** REPRODUCED ON www.verzatv.com IN THE DEPLOYED BUNDLE, NOT THE BUILD.

What I did:
1. Live API: `curl https://www.verzatv.com/api/creator/channels` -> HTTP 200, body exactly `{"channels":[]}`. Zero creator channels in production today.
2. Deployed bundle: pulled every chunk referenced by the live home page. `Search creators and shows` ships only in /_next/static/immutable/chunks/1aseb4gggkekc.js. The minified code there is byte-for-byte the source logic: `input value:i onChange:e=>n(e.target.value)` then `0===x.length ? <emptyState> : <list>` with the heading `0===d.length?"The first channels are being built":"No match"` and the body `0===d.length?"Creator channels are opening now...":"Try a different creator or show name."` (x = visible, d = liveChannels). Same chunk contains the call site `"creators"===v&&(0,t.jsx)(F,{})` — CreatorsLanding is mounted with NO `channels` prop, matching components/BrowsePage.tsx:830 `<CreatorsLanding />`. So `liveChannels` starts `[]` and the effect's fetch of /api/creator/channels sets it to `[]` again.
3. Real browser on production (Chrome, https://www.verzatv.com/?tab=creators, fresh tab): captured the section innerText with the box empty, clicked

---

### D3-013 — 15 of 96 meta descriptions exceed the ~160-character SERP budget; 2 exceed 200.

*Raised by S3 — SHOW PAGES: all 96 catalog rows (91*

**Reproduction.** curl https://www.verzatv.com/series/salt-and-pepper and measure <meta name="description"> → 211 characters. Same for im-having-my-professors-baby-es (211).

**Evidence.** Measured across all 96 fetched pages: min 57 (sisters-have-crush-on-the-same-man), max 211. Over 160: 15 rows, worst six are salt-and-pepper 211, im-having-my-professors-baby-es 211, hidden-agenda 192, love-for-sale 190, the-chairmans-revenge 188, protected-by-the-devil 187. Source: app/series/[slug]/page.tsx:57 sets description: series.logline verbatim with no clamp.

**Independent verification.** CONFIRMED — reproduced independently against the code AND against production, with the report's exact count. Severity corrected S3 -> S4. Coverage: 96/96 catalog rows examined in source, 96/96 show pages fetched from www.verzatv.com (96/96 returned 200), 0 gaps.

WHAT I DID

1. Code path. /Users/jothamhall/E! CREATOR ECONOMY/verza-tv/app/series/[slug]/page.tsx:203 renders {series.logline}; :223-229 renders {series.description}. The two are consecutive <p> with identical typography (text-sm leading-relaxed, color #A0A0B0), separated only by the year/channel row. /Users/jothamhall/E! CREATOR ECONOMY/verza-tv/lib/catalog.ts:1343-1354 getSeriesWithDetail does `return { ...s, ...detail }` — a plain spread of SERIES_DETAIL over the catalog row, no dedupe anywhere. Both cited line numbers in the report are accurate.

2. Real data, not string matching (standing rule 6). Copied lib/catalog.ts, lib/series-detail.ts, lib/mux-public-map.ts to scratchpad, imported the actual TS modules under Node 24 type-stripping, and compared every row's real logline to its real description. Result over all 96 rows: 22 EXACT-PREFIX, 0 EXACT-FULL, 4 partial-sentence repeats, 54 distinct, 16 with no description

---

### D3-013 — 62 of the 535 manifest interactive elements live in ten components that nothing imports; they are absent from the deployed bundle entirely, so no viewer can ever tap them.

*Raised by D3 — Dead Ends. All 535 interactive elem*

**Reproduction.** grep for each component name across app/ components/ lib/ excluding its own file: components/Player.tsx (18 elements), AskVerza.tsx (9), SeriesInfoDrawer.tsx (8, reachable only via the equally-orphaned SeriesInfoButton.tsx), FeedSearch.tsx (7), CreatorAITools.tsx (6), HeroCarousel.tsx (5), InstallPrompt.tsx (4), CoinPaywall.tsx (2), SeriesInfoButton.tsx (2), SeriesCard.tsx (1, imported only by the equally-orphaned ChannelRow.tsx). Every one returns zero importers.

**Evidence.** Verified against the deployed bundle rather than the build: 25 production chunks downloaded from www.verzatv.com and searched for a distinctive string from each component — "Video playback error" (Player) NOT IN BUNDLE; "Recommend a drama" (AskVerza) NOT IN BUNDLE; "Search shows..." (FeedSearch) NOT IN BUNDLE; "Script Generator" (CreatorAITools) NOT IN BUNDLE; "Previous image" (ImageCarousel) NOT IN BUNDLE. Note InstallPrompt's 4 elements are intentionally dead per a standing product decision ("never re-add InstallPrompt"), so those are correct-as-is. A further 28 elements ship or exist but cannot be reached: CartDrawer.tsx (11) is mounted in app/layout.tsx and ships ("Your cart is empty" is

**Independent verification.** REPRODUCED, both at source and in the deployed bundle. Severity S4 stands (it is the floor; viewer impact is literally zero).

WHAT I DID — step 1, importer graph. Walked every .ts/.tsx under app/, components/, lib/ (296 files) with a regex over `from|import(|require(` covering alias, relative and dynamic forms, then re-checked with a plain any-filetype grep across the whole repo. Result, all ten confirmed to have zero runtime importers: Player.tsx (1156 lines), AskVerza.tsx, FeedSearch.tsx, CreatorAITools.tsx, HeroCarousel.tsx, InstallPrompt.tsx, CoinPaywall.tsx, SeriesInfoButton.tsx — 0 importers each; SeriesInfoDrawer.tsx imported only by SeriesInfoButton.tsx:8 (itself 0); SeriesCard.tsx imported only by ChannelRow.tsx:2 (itself 0). There is no components/index barrel. The only other mentions are a CSS comment (app/globals.css:834), unrelated substrings (TubiHeroCarousel, lib/instant-player, capLevelToPlayerSize), and non-importing filename references inside scripts/test-feed-integrity.mjs. That script already says so out loud at line 1122: "components/SeriesCard.tsx is dead today — its only importer, components/ChannelRow.tsx, has no importers at all." Independent corroboration

---

### D3-014 — Several primary tap targets are far below a 44px thumb: the five footer social icons are 18x18, the /me/list Remove control is 56x16, and the sign-in Back and Continue as Guest links are 20px tall.

*Raised by D3 — Dead Ends. All 535 interactive elem*

**Reproduction.** Measure getBoundingClientRect on the footer social anchors of any page, on the Remove button of a saved row at /me/list, and on the Back / Continue as Guest links at /sign-in.

**Evidence.** Measured live: footer socials (Instagram, TikTok, X, YouTube, Facebook) each 18x18 — the anchor is `flex items-center gap-1.5` around an 18px svg with no padding, and the text label is hidden below the sm breakpoint (components/Footer.tsx:85-99). /me/list Remove buttons: 56x16 for both rows, and this is a destructive control. /sign-in: Back 352x20, Continue as Guest 122x20, Forgot password? 101x16. For contrast, the elements that are sized correctly on the same screens: the episode-feed action rail is 44x63 per button, BottomNav tabs are 74x41, the paywall's Series Unlock button is 241x53, and /studio's Sign in link is 94x44.

**Independent verification.** CONFIRMED at S4 (severity unchanged), with one piece of the raiser's evidence corrected as false.

WHAT I DID — source side. Whole-repo grep (excluding node_modules/.next/.git/docs/art-staging) for `components/<Name>"` and `from ".../<Name>"` for all eleven names, each excluding its own file:
  Player -> []           AskVerza -> []        FeedSearch -> []
  CreatorAITools -> []   HeroCarousel -> []    InstallPrompt -> []
  CoinPaywall -> []      SeriesInfoButton -> []  ChannelRow -> []
  SeriesInfoDrawer -> [components/SeriesInfoButton.tsx]
  SeriesCard -> [components/ChannelRow.tsx]
The only two inbound edges are inside the orphan cluster itself and both roots (SeriesInfoButton, ChannelRow) are unreferenced, so the closure is genuinely unreachable. A word-boundary grep across app/ components/ lib/ hooks/ turned up only two prose mentions of "Player" in comments (lib/guest-storage.ts:207, lib/watch-progress-client.ts:6). No barrel file (components/index.ts does not exist). Element counts sum to exactly 62 (18+9+8+7+6+5+4+2+2+1).

WHAT I DID — deployed bundle, not the build. Fetched 20 production routes from www.verzatv.com (/, /shop, /shop/verzatv-mug, /library, /me, /creator, /c/t

---

### D3-017 — The TVSeries JSON-LD on the 86 paid pages declares no offers, so the $1.99 price shown on the page is invisible to structured-data consumers.

*Raised by S3 — SHOW PAGES: all 96 catalog rows (91*

**Reproduction.** curl any paid show page and read the ld+json: properties are name, description, genre, numberOfEpisodes, inLanguage, url, image, productionCompany. No offers, no potentialAction.

**Evidence.** Parsed all 96 JSON-LD blocks: 0 contain an offers key. lib/seo/schema.ts tvSeriesSchema emits the eight properties above. Related positive: no aggregateRating is emitted either, which is correct — lib/series-detail.ts carries an invented rating field (e.g. 9.2 for the-dumb-billionaire-heiress-in-love) that nothing renders. That field is a live hazard: any future component that reads it publishes a fabricated rating.

**Independent verification.** CONFIRMED as a mechanism, but the severity is wrong and two sub-claims in the report are wrong.

WHAT I DID

1. Source (/Users/jothamhall/E! CREATOR ECONOMY/verza-tv/components/EpisodeFeed.tsx). Line numbers match the report. :997-998 add `timeupdate`/`ended`; :1003 deps are `[isActive, seriesSlug, episode.number, onEnded, onProgress, onPosition]`; :2139-2143 are the two inline ternaries; :1509/:2491 show `epProgress` is real render state (the progress-bar width), so `setEpProgress` with a changing value genuinely re-renders EpisodeFeed; :139 `EpisodeSlide` is a plain function, no memo.

2. Shipped bundle (Standing Rule 4). /series/the-mistress-trap/1 loads https://www.verzatv.com/_next/static/immutable/chunks/27_6kgf3tx4s2.js, which carries the identical shape: `t.addEventListener("timeupdate",r),t.addEventListener("ended",n) ... },[l,a,e.number,m,b,y])` and `onProgress:a===A?ee:()=>{},onPosition:a===A?e=>{ew.current=e}:()=>{}`. Zero occurrences of `.memo(` in that chunk, so the slide is unmemoized in production too.

3. Live behavioural test (Standing Rule 1 - I measured the effect, not the assignment). On the production page I patched HTMLMediaElement.prototype.add/removeEventLi

---

### D3-017 — The manifest's external-link denominator is inflated: 4 of the 74 catalogued "external URLs" are not links at all but input placeholder text and one validation message.

*Raised by D3 — Dead Ends. All 535 interactive elem*

**Reproduction.** Open the four sources named in docs/audit/00-manifest.json externalLinks and read the surrounding line.

**Evidence.** components/creator/ApplicationWizard.tsx:373, :420, :458 -> placeholder="https://..."; components/CreatorDashboard.tsx:795 -> placeholder="https://…"; components/creator/ui.tsx:382 -> placeholder="https://drive.google.com/..."; lib/creator-client.ts:203 -> the string "Add at least one valid link starting with http:// or https://." inside a validation message. None is an href. Reported so the coverage denominator is not silently over-credited.

**Independent verification.** CONFIRMED — both hints ship dead in production, though the raiser's DNS status code is wrong.

WHAT I DID AND SAW

1. Deployed bundle, not the build. Fetched real pages from www.verzatv.com and grepped the served HTML. Both tags are present verbatim on every page (root layout at app/layout.tsx:112 and :115):
   <link rel="preconnect" href="https://litix.io" crossorigin="anonymous"/>
   <link rel="dns-prefetch" href="https://litix.io"/>
   Confirmed on / (200), /shop (200), and against real catalog rows pulled from lib/catalog.ts: /series/the-mistress-trap (200) and the real episode page /series/the-mistress-trap/1 (200). litix_hits=2 on each.

2. The apex genuinely does not resolve. `dig +short @8.8.8.8 litix.io A` and `AAAA` both empty; `@1.1.1.1` empty; system resolver returns only MX. `curl https://litix.io/` -> curl exit 6, "Could not resolve host", HTTP 000. So neither hint can warm any connection. Effect as claimed: both are no-ops.

3. CORRECTION to the repro's mechanism — it is NOT NXDOMAIN. `dig @8.8.8.8 litix.io A` returns `status: NOERROR, ANSWER: 0` with an SOA in AUTHORITY, i.e. NODATA. The zone exists (Route53 NS ns-533.awsdns-02.net et al., plus MX 10 inbound-smtp.us

---

### D3-018 — The 5 coming-soon pages assert a spoken audio language for titles that have zero footage.

*Raised by S3 — SHOW PAGES: all 96 catalog rows (91*

**Reproduction.** Open https://www.verzatv.com/series/the-chairmans-revenge — the badge reads "Hindi audio" beneath "Episodes announced soon" and above "Episodes are on the way / there is nothing to play".

**Evidence.** Production HTML for the 5 coming-soon rows: 4 render "Hindi audio", 1 (i-cant-resist-my-mansion-gardener) renders "Spanish audio". lib/audio-language.ts already suppresses the burnedInSubtitles half for coming-soon rows with exactly this reasoning ("promising a subtitle track it has never delivered is the same class of false claim as promising an episode count") but keeps the audio half. Minor and arguably intentional as a forward-looking label; noted for consistency with the rule the same file states.

**Independent verification.** Reproduced in code and in production; severity S4 stands.

CODE: app/series/[slug]/page.tsx:110 passes `episodeCount: series.episodeCount` into seriesSchema; lib/seo/schema.ts:146 emits `numberOfEpisodes: show.episodeCount` unconditionally, with no status guard. All 5 coming-soon rows in lib/catalog.ts (lines 1204-1257) declare `episodeCount: 0`, and the MUX_MAP episode-count normalizer at lib/catalog.ts:1273 explicitly `continue`s on `s.status !== "live"`, so 0 reaches the schema builder untouched. The on-page rule the raiser cited is real and accurately located: app/series/[slug]/page.tsx:179-181 carries the comment "A coming-soon title has no episode count worth printing; '0 episodes' reads as a broken page rather than an unreleased one" guarding `"Episodes announced soon"` vs `${series.episodeCount} episodes`.

PRODUCTION (curl www.verzatv.com, all 5 slugs, HTTP 200, JSON-LD parsed with python): the-chairmans-revenge, protected-by-the-devil, the-last-will, the-billionaires-apron, i-cant-resist-my-mansion-gardener each emit exactly one ld+json block containing a TVSeries with "numberOfEpisodes": 0 alongside a populated description (135-188 chars, the logline), plus og:type video

---

### D3-018 — Two of the seven test-stream URLs in the perf harness are 404, and the Sitemap dropdown lists two different labels pointing at the same destination.

*Raised by D3 — Dead Ends. All 535 interactive elem*

**Reproduction.** curl https://test-streams.mux.dev/bbb-360/playlist.m3u8 and https://test-streams.mux.dev/elephants_dream/playlist.m3u8. Then open the footer Sitemap dropdown and look at the "For Creators" section.

**Evidence.** Both test streams return 404; the other five in lib/perf/seed.ts (x36xhzz, test_001, pts_shift, and the two Apple devstreaming URLs) return 200. Not user-facing — lib/perf/seed.ts is only used by /dev/perf, which 404s in production — but they are in the 74-link scope. Separately, lib/data/sitemap.ts:200-205 emits { label: "Creator Studio", href: "/studio" } and { label: "Apply to Create", href: "/studio" } — two labels promising different things, one destination.

**Independent verification.** Both halves reproduce exactly as written; severity S4 is correct.

HALF 1 — the two dead test streams. Curled all 8 entries in /Users/jothamhall/E! CREATOR ECONOMY/verza-tv/lib/perf/seed.ts (7 hlsUrl + 1 playbackId), following redirects:
  404  https://test-streams.mux.dev/bbb-360/playlist.m3u8
  404  https://test-streams.mux.dev/elephants_dream/playlist.m3u8
  200  x36xhzz/x36xhzz.m3u8, test_001/stream.m3u8, pts_shift/master.m3u8, both devstreaming-cdn.apple.com URLs, and stream.mux.com/v69RSHh….m3u8
So 2 of the 7 URLs are dead and the other 5 are live — the raiser's list of which is which is precisely right.

Confirmed zero production surface, as the raiser conceded: app/dev/perf/page.tsx calls notFound() when !PERF_TEST_MODE, and PERF_TEST_MODE = NEXT_PUBLIC_PERF_TEST_MODE==="1" || NODE_ENV!=="production". curl https://www.verzatv.com/dev/perf returns 404. No viewer, buyer, or crawler ever requests these URLs; only a developer opening the local harness sees 2 of 8 clips fail to load. Real, but dev-tooling only.

HALF 2 — the duplicate sitemap label. Verified in the DEPLOYED artifacts, not the source:
  - https://www.verzatv.com/sitemap server HTML renders, under <h2>For Creators

---

### D4-001 — The maxDevicePixelRatio half of the P1 iOS-crash fix is protected by nothing: audit-perf.ts's guard is satisfied by the explanatory comment sitting inside the same config literal, it only warns rather than fails even whe

*Raised by D4 — Performance and memory. Rendition c*

**Reproduction.** In an isolated copy of the repo (node_modules and public symlinked so the other checks pass): 1) delete the single line `        maxDevicePixelRatio: 1,` from the fresh-attach config in components/EpisodeFeed.tsx (line 791) and run `npx tsx scripts/audit-perf.ts` -> prints '✅ components/EpisodeFeed.tsx:771 caps rendition to player size' and '✅ PERF GUARD: 11 checks, 0 failures'. 2) Also delete the comment block that begins 'Without this the cap above never binds' (lines 781-790) and re-run -> now prints '⚠️ ... sets capLevelToPlayerSize but no maxDevicePixelRatio' but STILL '✅ PERF GUARD: 11 checks, 0 failures'. 3) Delete `ahls.config.maxDevicePixelRatio = 1;` (line 450) and run `node script

**Evidence.** scripts/audit-perf.ts:203 `} else if (!/maxDevicePixelRatio/.test(body)) {` where `body` is the raw `new Hls({...})` text including comments — audit-perf has no stripComments(), unlike scripts/test-feed-integrity.mjs:43. The comment at components/EpisodeFeed.tsx:781-790 contains the literal 'maxDevicePixelRatio defaults to' inside the object literal. components/ShortsFeed.tsx:342-347 has the same shape ('maxDevicePixelRatio matters as much as the cap itself' inside the config), so its guard is dead too; components/HorizontalFeed.tsx:88-92 does not mention it in its comment, so that one is live. Negative-control transcript in /private/tmp/claude-501/-Users-jothamhall-E--CREATOR-ECONOMY/247f26

**Independent verification.** Reproduced on production 2026-08-29, exactly as written. `curl https://www.verzatv.com/series/the-mistress-trap/1.5` → 200 with `<title>The Escort They Framed — Episode 1 | VERZA TV</title>`; `/01` → 200, same Episode 1 title; while `/abc`, `/0`, `/-1`, `/62`, `/9999` all → 404. Response headers confirm these are not the prerendered page: `/1` returns `x-matched-path: /series/the-mistress-trap/1`, whereas `/01` and `/1.5` return `x-matched-path: /series/[slug]/[episode]` — dynamic renders of the same content.

MECHANISM VERIFIED IN SOURCE (not inferred): /Users/jothamhall/E! CREATOR ECONOMY/verza-tv/app/series/[slug]/[episode]/page.tsx line 90, `const epNum = parseInt(epStr, 10);` with no round-trip validation (no `String(epNum) !== epStr` guard) before `getEpisode(slug, epNum)`. Same lenient parse at line 56 in `generateMetadata`.

THE CLASS IS BROADER THAN THE RAISER STATED. It is not just "a float and a zero-padded integer" — parseInt's leading-prefix parsing 200s on anything starting with a digit: `0001` → Ep 1, `007` → Ep 7, `1abc` → Ep 1, `12abc` → Ep 12, `1e10` → Ep 1, `1,` and `1;` → Ep 1, `61.9` → Ep 61. Only no-leading-digit strings (`abc`, `+1`, `0x1`) and in-range-parse

---

### D4-010 — Instant play from a poster tap — a named do-not-regress asset — covers only BrowsePage's own tiles/hero/reality/red-carpet plus the show page's Play CTA. Nine other poster surfaces now route straight to the player under 

*Raised by D4 — Performance and memory. Rendition c*

**Reproduction.** grep -rn 'posterHref' app components — every call site listed below renders a plain next/link <Link> with no onClick, while only components/BrowsePage.tsx and components/PlayNowLink.tsx call startInstantPlayer.

**Evidence.** Cold surfaces: components/SeriesCard.tsx:14, components/HeroCarousel.tsx:26 and :59, components/SearchBar.tsx:67, components/SearchButton.tsx:125, components/FeedSearch.tsx:111, components/LibraryPage.tsx:22, components/AccountLists.tsx:163 and :176, components/PurchaseHistoryList.tsx:148, app/search/page.tsx:181, app/genres/[slug]/page.tsx:115. Marked clearly: this is NOT a regression of the protected behaviour on the surfaces where it was measured — the prewarm plus adoption was observed working end to end in production (see the D4-A confirmation in the report). It is an inconsistency introduced by posterHref now sending these surfaces to the player rather than to a show page.

**Independent verification.** Reproduced. The comment at components/BrowsePage.tsx:250-258 (raiser said 249-256; same block, off by one/two) reads "ONLY for links whose destination is the player. Continue Watching is the last one on this page: every tile, hero, category row and search result now opens the show page instead". Both factual claims are false.

FILE: posterClick has SIX call sites, not one — :631 Continue Watching, :670 music tile, :899 reality grid, :953 red carpet grid, :989 hero, :1201 main tile grid (raiser found five, missed :670). All five non-CW sites use href={posterHref(...)}, and posterHref (lib/series-href.ts:113) is episodeHref(series,1) -> /series/<slug>/1, the player. BrowsePage.tsx:1194-1200 carries a second comment stating the correct rule ("A coming-soon tile routes to its show page") five lines of code from the header that says the opposite. The "search result" half is false too: SearchButton.tsx:125 and SearchBar.tsx:67 both use posterHref -> player.

PRODUCTION (not the build): fetched https://www.verzatv.com/ (deployment dpl_FEduFW6ftQZyapPx28PouXp55wk3) and split the DOM at the <noscript> boundary — 25 real anchors, 25/25 ending in /1, ZERO show-page links; the 107 show-page li

---

### D5-012 — /api/creator/upload passes the client-controlled Origin request header straight into Mux's cors_origin for the direct-upload it creates, letting an approved creator authorize an arbitrary third-party site to PUT to their

*Raised by D5 — Security. Every security-relevant s*

**Reproduction.** POST /api/creator/upload as an approved creator with `Origin: https://attacker.example` -> app/api/creator/upload/route.ts:60-66 takes req.headers.get("origin") verbatim and passes it as corsOrigin to createDirectUpload, which sets it as Mux's cors_origin.

**Evidence.** app/api/creator/upload/route.ts:60-63 `const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "https://www.verzatv.com";` then :66 `createDirectUpload(content.id, origin)`. lib/mux-upload.ts:45-46 `mux.video.uploads.create({ cors_origin: corsOrigin, ... })`. Blast radius is confined to the caller's own upload (the content row is created with ctx.creator.id and the route is gated on status === 'approved'), and creator uploads are currently unreachable in production anyway — MUX_WEBHOOK_SECRET is absent, so POST /api/mux/webhook returns 503 {"error":"Webhook verification unavailable"} live. The fix is to allowlist the origin against NEXT_PUBLIC_SITE_URL rather than ech

**Independent verification.** Code defect reproduced exactly. components/JsonLd.tsx:17 does dangerouslySetInnerHTML={{__html: JSON.stringify(data)}} with no escaping of `<`/`</script`; React does not escape inside dangerouslySetInnerHTML and the live CSP (next.config.ts:37) allows script-src 'unsafe-inline', so a literal `</script>` in any schema string would break out and execute. Verified in the deployed bundle: /c/the-mistress-trap--1 emits the raw unescaped VideoObject JSON-LD (30 call sites).

The finding's own caveat "not exploitable today" holds, and my adversarial attempts confirmed it. The one user-reflected input reaching JsonLd is the /c/[slug] URL slug -> clipVideoSchema.embedUrl. Probing /c/...--INJECTPROBE123 reflected the raw slug unescaped, but breakout payloads do NOT survive: %3C%2Fscript%3E stays percent-encoded in the JSON-LD and an unencoded <b> arrives as %3Cb%3E — Next.js keeps single-segment params percent-encoded, so no literal `<` or `/` reaches the <script> body. discover/[genre] reflects raw genre into breadcrumb name/url with the same result (Romance%3C%2Fscript%3EMARK2, encoded). A literal `/` (needed for </script) cannot exist in a single dynamic segment, and the only catch-all ro

---

### D6-007 — Ink-coloured text on accent-filled badges and pills measures 4.34:1 (#F5F4F8 on #E0115F), and white on the purple NEW badge measures 4.23:1 at 8px bold. Both are below AA. Using pure #FFFFFF on the accent would reach 4.7

*Raised by D6 — Accessibility. The accessibility pr*

**Reproduction.** 1. Open https://www.verzatv.com/series/the-mistress-trap at 320px and sample the 'Drama · Betrayal' pill: rgb(245,244,248) at 12px/600 on rgb(224,17,95) -> 4.34:1. 2. Open / and sample a 'NEW' badge: rgb(255,255,255) at 8px/700 on rgb(139,92,246) -> 4.23:1.

**Evidence.** Measured aggregates over the deployed bundle: 4.34:1 rgb(245,244,248) on rgb(224,17,95) — 153 nodes on 9 routes; 4.23:1 rgb(255,255,255) on rgb(139,92,246) — 18 nodes on 3 routes. The 8px NEW badge is also the smallest type in the product.

**Independent verification.** CONFIRMED — both measurements reproduce exactly in the deployed bundle, verified from computed styles in a live browser (not source, not the build).

WHAT I DID AND SAW

1. Pink pill. Fetched https://www.verzatv.com/series/the-mistress-trap (200). Deployed HTML contains, verbatim:
   <span class="text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full" style="background:#E0115F;color:#F5F4F8">Drama · Betrayal</span>
   Resolved the tokens in the deployed stylesheet (/_next/static/immutable/chunks/1b0rux1xv-mpp.css): --text-xs:.75rem = 12px, --font-weight-semibold:600. Loaded the page in Chrome and read getComputedStyle: color rgb(245,244,248), effective background rgb(224,17,95), 12px, weight 600, opacity 1, visible. Contrast 4.34:1 against the 4.5:1 AA threshold (12px is not "large text", which needs 24px or 18.66px bold). Exactly as claimed.

2. Purple NEW badge. Loaded https://www.verzatv.com/ in Chrome. Six visible badges compute to color rgb(255,255,255) on background rgb(139,92,246), font-size 8px (from the literal rule text-\[8px\]{font-size:8px}), weight 700, opacity 1. Contrast 4.23:1 vs 4.5:1 required. Exactly as claimed, and it is the smallest type in the

---

### D6-020 — The category rail's aria-label sits on a role-less <div>, so assistive technology never exposes it. An aria-label on a generic element with no role is ignored.

*Raised by D6 — Accessibility. The accessibility pr*

**Reproduction.** Open https://www.verzatv.com/ and inspect the element with aria-label="Categories" — it is a plain div with class 'overflow-x-auto no-scrollbar' and no role attribute.

**Evidence.** components/CategoryTabs.tsx:186-190: `<div ref={railRef} className="overflow-x-auto no-scrollbar" style={...} aria-label="Categories" >`. Measured landmark data: only 4 of 61 routes exposed any labelled <nav>, and none of them was the category rail. Note the rail must keep its `overflow-x-auto` class (BrowsePage's swipe handler matches on it), so the fix is a role or a wrapping <nav>, not a class change.

**Independent verification.** Reproduced in the deployed bundle and in a live browser. Not a DO NOT REGRESS misfile.

WHAT I DID / SAW

1. Deployed HTML (curl https://www.verzatv.com/, 200, 231291 bytes). The rail ships exactly as described, with no role and no landmark ancestor:
   <div class="sticky z-30" ...><div class="flex items-stretch"><div class="relative min-w-0 flex-1"><div class="overflow-x-auto no-scrollbar" style="-webkit-overflow-scrolling:touch;scroll-padding-inline:16px" aria-label="Categories">
   grep of the served HTML: zero occurrences of role="..." on the entire page. Exactly one <nav> (the bottom nav), and it carries no aria-label and no role — so the raiser's "none of the labelled navs was the category rail" holds on this route, and is in fact stronger than stated.

2. Live runtime DOM (Chrome 151 on www.verzatv.com, JS probe). Element with aria-label="Categories": tag DIV, role null, tabindex null, ancestors DIV/DIV/DIV/DIV/MAIN (no role on any), document.querySelectorAll('[role]').length === 0. It is a genuine scroller, not a dead element: scrollWidth 1000 vs clientWidth 394.

3. Effect verified in Chrome's accessibility tree, not inferred. read_page renders the node as:
   generic "Cat

---

### D6-021 — The search inputs are labelled only by their placeholder, which disappears the moment the viewer types, leaving the field with no visible or programmatic label.

*Raised by D6 — Accessibility. The accessibility pr*

**Reproduction.** Open https://www.verzatv.com/search. The input has no id, no <label for>, no aria-label — only placeholder="Search series, genres...". Type into it and the only label text is gone.

**Evidence.** Measured field inventory across /sign-in, /sign-up, /search, /forgot-password: 8 fields total, 6 with a real <label for>, 2 (/search, and the same control in components/SearchBar.tsx:44-52 and components/SearchButton.tsx:102 and components/FeedSearch.tsx:87) relying on the placeholder alone. The /sign-up age-gate checkbox is correctly wrapped in a <label> and does resolve a name.

**Independent verification.** Reproduced in the deployed bundle, not just the source. Fetched https://www.verzatv.com/ (HTTP 200, 231KB); the shipped markup contains verbatim `<div class="overflow-x-auto no-scrollbar" style="-webkit-overflow-scrolling:touch;scroll-padding-inline:16px" aria-label="Categories">` — a plain div, no role attribute, and its ancestors are plain divs (relative min-w-0 flex-1 / flex items-stretch / sticky wrapper), not a nav. The page contains exactly one <nav> (the bottom nav, itself unlabelled) and the rail is not inside it. Source matches: components/CategoryTabs.tsx:184-190; grep of that file returns only aria-label, aria-current, aria-hidden — no role — and there is no runtime setAttribute("role", ...) anywhere in the repo that could add one at hydration, so this is not a case of the static HTML understating the live tree.

Effect verified, not just the assignment: a bare <div> maps to role=generic, for which an accessible name is prohibited in ARIA; and independent of that prohibition, a generic container is not a landmark or a group, so no screen reader ever stops on it or announces it. The label reaches assistive technology under neither reading. It is an inert attribute — nothi

---

### D6-024 — The <footer> reserves no space for the fixed bottom nav, so the last 73 CSS px of every page sit permanently behind it. On the home page the copyright line is never fully visible.

*Raised by D6 — Accessibility. The accessibility pr*

**Reproduction.** 1. Open https://www.verzatv.com/ at 320px and scroll to the very bottom. 2. The '© 2026 VERZA TV. All rights reserved' line is cut off by the nav. 3. In the console: getComputedStyle(document.querySelector('footer')).paddingBottom -> '0px'.

**Evidence.** Measured on the deployed home page: document height 2596, footer bottom 2596, gap under footer 0, fixed nav height 73. The obscured band is 2523..2596, and the only leaf element in it is `P [2531..2564] '2026 VERZA TV All rights r'`. app/globals.css reserves the nav height on `main` only (`.app-shell > main { padding-bottom: calc(76px + env(safe-area-inset-bottom,0px)) !important }`), and <footer> is a sibling of <main>, not a child. No focusable element currently falls in the band, so this is content-obscured rather than a WCAG 2.4.11 focus failure.

**Independent verification.** Reproduced on the live site, twice, on two different routes.

DEPLOYED BUNDLE (not the build): https://www.verzatv.com/_next/static/immutable/chunks/1b0rux1xv-mpp.css contains `.app-shell>main{padding-bottom:calc(76px + env(safe-area-inset-bottom,0px))!important}` and `.app-shell>footer{margin-top:auto}` — the footer rule sets no padding-bottom. In /Users/jothamhall/E! CREATOR ECONOMY/verza-tv/app/layout.tsx:145-148 <footer> is a sibling of <main> inside .app-shell, so the reservation on main does not cover it. Nav is `bottom-nav fixed bottom-0 z-50` with an inner row of height 72 + 1px border (components/BottomNav.tsx:84-91) = 73px, background rgb(13,13,20) — fully opaque, not translucent.

LIVE MEASUREMENT: the shared Chrome window would not resize below innerWidth 606, so I instead set `media.mediaText='not all'` on the two `min-width:520px` media blocks in the live stylesheet, which makes the browser apply exactly the mobile branch of the cascade (verified: nav position became `fixed`, body overflow `visible`, main padding-bottom `76px`).
- https://www.verzatv.com/ scrolled to the true bottom (scrollY 2779 == maxScroll 2779): nav rect 550..623 (h 73), footer bottom 622.86 vs in

---

### D6-025 — In Arabic the Profile tab label wraps to two lines inside the bottom nav's 59px cell, making that tab 52px tall against 41px for the other four and breaking the row's baseline.

*Raised by D6 — Accessibility. The accessibility pr*

**Reproduction.** Switch the language to العربية and look at the bottom nav: 'الملف الشخصي' wraps while اكتشف/مقاطع/متجر/مكتبة do not.

**Evidence.** Measured cells on the deployed Arabic home page at 320px: [59x41,59x41,59x41,59x41,59x52] with label boxes [31x11,27x11,23x11,25x11,59x22] — the fifth label occupies 2 lines. components/BottomNav.tsx:120 sets `className="text-[11px] font-medium leading-none"` with no truncation or min-width handling.

**Independent verification.** Reproduced on the deployed site (www.verzatv.com), not the build. Loaded the live home page in Chrome, set localStorage `verza-lang` = "ar" (the same key `LangProvider.setLocale` writes; lib/i18n.ts:1176) and reloaded — `document.documentElement.lang` became "ar" and the deployed bundle rendered the Arabic nav.

Measured the real `.bottom-nav` boxes at a 320px nav width (`getBoundingClientRect`, not string matching):
  cells  = [59x41, 59x41, 59x41, 59x41, 59x52]
  labels = [31x11, 27x11, 23x11, 25x11, 59x22]
  texts  = اكتشف / مقاطع / متجر / مكتبة / الملف الشخصي
That is the raiser's evidence to the pixel. Zoomed screenshot of the region confirms it visually: "الملف الشخصي" breaks across two lines ("الملف" / "الشخصي") and the person icon sits visibly above the other four.

The baseline break is real and measurable, not just implied: with the row's `items-center`, the taller cell recenters, so `iconTop[4] - iconTop[0] = -6px` — the Profile icon renders 6px higher than the other four. At >= ~366px nav width the delta is 0 and the label is one line (68x11).

Cause verified as the effect, not the assignment: the natural single-line width of "الملف الشخصي" in the deployed font stack (In

---

### D6-026 — components/SeriesInfoDrawer.tsx and components/SeriesInfoButton.tsx are dead code — nothing imports SeriesInfoButton — yet the manifest counts 8 interactive elements inside the drawer. Those 8 were examined statically on

*Raised by D6 — Accessibility. The accessibility pr*

**Reproduction.** grep -rn 'SeriesInfoButton' --include='*.tsx' app components -> only the definition file itself; no importer anywhere.

**Evidence.** components/SeriesInfoButton.tsx:8 imports SeriesInfoDrawer and renders it at :48; nothing imports SeriesInfoButton. Relevant because SeriesInfoDrawer.tsx:324 sets an inline `outline: isActive ? '1px solid accent' : 'none'` on every episode button, which — inline styles beating the stylesheet — would suppress the site's button:focus-visible ring for the non-active rows. That defect is latent, not live, and should be fixed before the component is ever wired up.

**Independent verification.** Reproduced on the deployed site, numbers match the raiser's to the tenth of a pixel.

WHAT I DID
1. Confirmed Arabic is a real, user-selectable locale, not a dead dictionary: lib/i18n.ts:6-32 lists `ar` / "العربية" in LOCALES (surfaced by components/LanguagePicker.tsx + LangDropdown.tsx), and components/LangProvider.tsx:82-93 also auto-selects it from navigator.languages, so an Arabic-reading visitor lands in it without touching a switcher.
2. Confirmed the deployed bundle matches the repo: https://www.verzatv.com/ returns 5 occurrences of `text-[11px] font-medium leading-none` — the five nav labels — so the class in the repo is the class in production.
3. In Chrome on the live domain: localStorage.setItem('verza-lang','ar') + reload. document.documentElement.lang became "ar" and the nav rendered اكتشف / مقاطع / متجر / مكتبة / الملف الشخصي.
4. macOS Chrome clamps the window (innerWidth floored at 606 no matter what resize_window reports), and at ≥520px portrait the site swaps to its desktop phone-frame (app/globals.css:413), where `.device-nav-dock .bottom-nav` sets `width:100% !important` (globals.css:518-525) and ignores any inline width — so a naive width override silently measu

---

### D7-013 — The landscape rule that is supposed to shrink the content's bottom reserve to match the shorter nav never applies, because a more specific !important rule outranks it.

*Raised by D7 — Viewport and device. Every page-rou*

**Reproduction.** Render https://www.verzatv.com/ at 653x512 or 852x393 and read getComputedStyle on `.app-shell > main`. It is 76px, not the 56px the landscape rule asks for.

**Evidence.** app/globals.css:618-620 `@media (orientation: landscape) { main { padding-bottom: 3.5rem !important } }` has specificity (0,0,1); app/globals.css:333-335 `.app-shell > main { padding-bottom: calc(76px + env(...)) !important }` has (0,1,1) and wins. Measured mainPB = "76px" at 653x512 and at 852x393. The landscape nav is 40-48px, so 28-36px of reserve is dead space and the rule is dead CSS.

**Independent verification.** REPRODUCED on live www.verzatv.com (headless system Chrome via puppeteer-core, iPhone UA, 390x844 dpr2, `*{scroll-behavior:auto!important}` injected so the programmatic scroll actually lands).

Method: load, scroll to document bottom in a loop until scrollY == scrollHeight - innerHeight and stable, then measure getBoundingClientRect + document.elementFromPoint on the copyright <p>.

Result on https://www.verzatv.com/ — scrollY 6165 == maxScroll 6165 (atMax true), footer bottom 844 = viewport bottom, copyright <p> "© 2026 VERZA TV. All rights reserved. Microdramas, Reality & More." at y 779–812, nav.bottom-nav position:fixed, top 771, bottom 844, height 73, backgroundColor rgb(13,13,20) (fully opaque, no alpha). elementFromPoint at the line's center returns an <svg> whose .closest('nav.bottom-nav') is truthy — the nav paints over it. elementFromPoint at top+1px is also inside the nav. Screenshot at max scroll confirms visually: the last readable text is the "About" legal link; the copyright line is not on screen at all. The page is already at max scroll, so no scrolling reveals it.

Identical numbers (copyright 779–812, nav top 771, hitInNav true) on 10/10 footer-bearing routes samp

---

### D7-014 — The 404 page — which is the production outcome for 5 of the 65 route classes — ships an entirely empty <body>; every pixel of it, including the way out, is client-rendered.

*Raised by D7 — Viewport and device. Every page-rou*

**Reproduction.** curl -s https://www.verzatv.com/@verza | tail -c 200 — the body is `<div hidden><!--$--><!--/$--></div>` and nothing else. With JavaScript disabled or slow, the page is blank at every viewport width.

**Evidence.** Mirrored server HTML for /@verza, /c/test-clip, /dev/perf, /shop/champion-tie-dye-hoodie and /watch/the-mistress-trap/1 is byte-identical at 2,767 bytes with `id="__next_error__"` and an empty body. Once hydrated the page is correct and honest — '404 / Page not found / The page you're looking for doesn't exist or has been moved.' with header, footer, nav and a 'Back to Discover' link measured at 162x44, which passes the thumb minimum and is content-sized so it is identical at 320px. Not a layout defect, but it means these five route classes have no server-rendered layout to audit at any width.

**Independent verification.** CONFIRMED against the deployed bundle (dpl_FEduFW6ftQZyapPx28PouXp55wk3), with two corrections to the raiser's evidence.

WHAT I DID AND SAW
1. curl'd all five named routes plus a random non-route. All return HTTP 404 with `<html data-dpl-id="..." id="__next_error__">`, and the entire server-rendered body markup is exactly:
   `<body><div hidden=""><!--$--><!--/$--></div>` followed only by `<script>` tags. Zero visible markup. Identical on /@verza, /c/test-clip, /dev/perf, /shop/champion-tie-dye-hoodie, /watch/the-mistress-trap/1, and /definitely-not-a-real-page-xyz.
2. Worse than the finding states: the 404 response also ships NO `<link rel="stylesheet">` in `<head>` (0 vs 1 on real pages) and no inline `<style>`. The `<body>` has no class and no `background` style, so there is not even a color to paint before JS runs.
3. Contrast confirms the 404 is the anomaly, not the site pattern. `/`, `/shop`, `/legal/terms` all ship `<body class="min-h-full flex flex-col" style="background:#07070E">` with real server-rendered content and one stylesheet link.
4. /Users/jothamhall/E! CREATOR ECONOMY/verza-tv/app/not-found.tsx is a pure server component (no "use client", plain `<section>`/`<h1>

---

### D7-015 — `.hero-poster` is dead CSS with a stale comment: the rule exists in two media contexts and is applied to no element in the codebase, and the header/tab heights its arithmetic is built on are wrong by 10px.

*Raised by D7 — Viewport and device. Every page-rou*

**Reproduction.** grep -rn 'hero-poster' --include='*.tsx' components app returns nothing; the class is only defined in app/globals.css.

**Evidence.** app/globals.css:364-370 defines `.hero-poster { max-height: calc(100svh - 112px - env(safe-area-inset-top, 0px)) }` with a comment claiming the header is ~62px and the tabs ~44px; app/globals.css:501-503 overrides it to 480px inside the device frame. Measured on the live homepage at 320, 375, 390, 430 and 768: header height 70px and sticky tab bar height 52px (122px, not 112px), and no element in the DOM carries the class. The commented rationale about keeping the whole 9:16 flyer above the fold describes behaviour nothing implements.

**Independent verification.** CONFIRMED against live production (cache-busted, x-vercel-cache: MISS).

WHAT I DID/SAW: curl https://www.verzatv.com/@verza returns HTTP 404 with <html data-dpl-id="dpl_FEduFW6ftQZyapPx28PouXp55wk3" id="__next_error__"> — no lang attribute and ZERO <link rel="stylesheet"> in <head>. Stripping <script> blocks from the body leaves exactly `<div hidden=""><!--$--><!--/$--></div>` and nothing else (52 chars). The whole 404 UI — "404", "Page not found", the sentence, and the <a href="/">Back to Discover</a> — exists only as a JSON string inside an inline self.__next_f.push(...) RSC flight payload. Same empty body on /c/test-clip, /dev/perf, /shop/champion-tie-dye-hoodie, /watch/the-mistress-trap/1, and additionally on /series/does-not-exist, /genre/nonexistent, and any unmatched top-level path (falls into app/[handle]). So the claim as written — empty body, every pixel including the way out client-rendered, blank without JS — reproduces.

DECISIVE COMPARISON THE RAISER MISSED (strengthens it; this is not a Next.js inevitability): /legal/nope and /help/nope/deep also return 404 but ship 12,820 chars of real server-rendered DOM — lang="en", a stylesheet in <head>, header, footer, and the

---

### D7-016 — `* { scroll-behavior: smooth }` is applied to every element, is not disabled under prefers-reduced-motion, and silently animates every programmatic scroll.

*Raised by D7 — Viewport and device. Every page-rou*

**Reproduction.** Call window.scrollTo(0, document.documentElement.scrollHeight) on any page and read scrollY 100ms later — it has not arrived. Enable Reduce Motion in the OS: smooth scrolling continues.

**Evidence.** app/globals.css:698-701. The two prefers-reduced-motion blocks at :232-241 and :244-265 cover animations and transitions but not scroll-behavior. Encountered directly: the first pass of the max-scroll occlusion measurement produced wrong data until the harness injected `*{scroll-behavior:auto !important}`.

**Independent verification.** CONFIRMED in the deployed bundle and by effect, not by string match. Severity S4 stands.

1) DEPLOYED CSS (not the build). Fetched https://www.verzatv.com/ -> /_next/static/immutable/chunks/1b0rux1xv-mpp.css (47,932 bytes, HTTP 200). It contains, verbatim: `.bottom-nav{-webkit-backdrop-filter:blur(20px)saturate(1.5)}*{scroll-behavior:smooth}.episode-immersive{...}`. That is the ONLY `scroll-behavior` declaration in the entire 47KB production stylesheet. The bundle has four `@media (prefers-reduced-motion:reduce)` blocks (wizard/animate-*/video+img; tab-slide; tubi-glow; loading spinner) and NONE mentions scroll-behavior. The one inline `<style>` in the live HTML only hides Google-Translate chrome. So production ships no override anywhere.

2) COMPUTED STYLE on the live page: getComputedStyle(html).scrollBehavior === "smooth"; same for body; same for a div created on the fly. The `*` really does reach every element.

3) EFFECT, NOT ASSIGNMENT — A/B on the live page against the real scroller (`.device-screen`, overflowY:auto, scrollHeight 3206 / clientHeight 531):
   - `ds.scrollTo({top:500, behavior:'instant'})` -> scrollTop = 500 SYNCHRONOUSLY (control: the element is scrollable).


---

### S1-001 — Reality tab: 3 of 4 tiles are inert and visually indistinguishable from the one that plays. Sugar Babies, Buy/Sell Miami and The Vertical Tea render as bare <div aria-disabled="true"> with full-brightness poster art, a f

*Raised by S1 — Discover / Home. The `/` route as s*

**Reproduction.** 1. Open https://www.verzatv.com/?tab=reality on a phone. 2. Scroll to the 2x2 grid under the rotating hero. 3. Tap "Sugar Babies", "Buy/Sell Miami" or "The Vertical Tea". Nothing happens — no navigation, no message, no state change. 4. Tap "Storage Pirates" (bottom-right, identical treatment): it opens the player.

**Evidence.** components/BrowsePage.tsx:872-908 — `const playable = (MUX_MAP[show.slug]?.length ?? 0) > 0;` then `playable ? <Link…> : <div aria-disabled="true">`. The four shows are hardcoded at components/BrowsePage.tsx:437-442; only storage-pirates exists in the catalog. Live DOM readback on /?tab=reality, computed styles per cell: [{tag:DIV, title:"Sugar Babies", color:rgb(245,244,248), opacity:1, imgFilter:none, badge:null, cursor:auto, ariaDisabled:true}, {tag:DIV, "Buy/Sell Miami", …identical}, {tag:DIV, "The Vertical Tea", …identical}, {tag:A, "Storage Pirates", color:rgb(245,244,248), opacity:1, badge:null, cursor:pointer}]. curl: /series/sugar-babies 404, /series/buy-sell-miami 404, /series/the-

**Independent verification.** Both halves reproduce at HEAD 197cc1a.

HALF 1 — stale Supabase project in MEMORY.md. /Users/jothamhall/.claude/projects/-Users-jothamhall-E--CREATOR-ECONOMY/memory/MEMORY.md:97 still reads "Project: jejispfvlkwastzvwtwu.supabase.co". Verified in the DEPLOYED bundle, not the build: fetched https://www.verzatv.com/sign-in, downloaded all 14 of its script chunks, and chunk /_next/static/immutable/chunks/1uz8qcjprw-ih.js contains the literal https://mmvbmrrwgludfmfalfcm.supabase.co. The old ref jejispfvlkwastzvwtwu appears in ZERO deployed chunks. Corroborated by supabase/migrations/008_reconcile_live_schema.sql:3 ("New project mmvbmrrwgludfmfalfcm is a fresh/empty start") and by .env.local (NEXT_PUBLIC_SUPABASE_URL=https://mmvbmrrwgludfmfalfcm.supabase.co). The raiser's sub-claim that the retired host still answers also holds: dig jejispfvlkwastzvwtwu.supabase.co -> 172.64.149.246 / 104.18.38.10, and GET /auth/v1/health -> 401 {"message":"No API key found in request"}. Note the inverse, which the raiser did not mention: mmvbmrrwgludfmfalfcm.supabase.co is NXDOMAIN from 8.8.8.8, 1.1.1.1 and 9.9.9.9 — a separate matter, not this finding.

HALF 2 — wrong catalog counts in the manifest. 

---

### S1-008 — The category strip is only partly localized. TAB_KEYS maps 6 of the 10 browse tabs to i18n keys; anime, espanol, bollywood and creators have no key in any of the 20 locales and fall back to the English literal, so a non-

*Raised by S1 — Discover / Home. The `/` route as s*

**Reproduction.** 1. Open https://www.verzatv.com/, set the language to Español with the header chip. 2. The category strip reads DRAMA · HOT · [Tubi] · ANIME · ESPAÑOL · BOLLYWOOD · REALITY · CREATORS · ALFOMBRA ROJA · MÚSICA — Red Carpet and Music are translated, Creators and Anime are not. 3. Tap Anime: the panel reads "Anime is coming soon / We're lining up the first titles for this section…" in English with an English "Browse Drama" button.

**Evidence.** components/CategoryTabs.tsx:14-21 — `TAB_KEYS` contains only drama, new, popular, music, reality, red-carpet; components/CategoryTabs.tsx:50-53 — `labelFor` falls back to `tab.label` (the English literal from lib/catalog.ts:20-41) for anything unmapped. lib/i18n.ts declares only 6 tab.* keys (lines 51-56) across all 20 locale blocks (lines 174, 224, 274, …, 1124). Live readback with verza-lang=es: aria-current tab innerText "ALFOMBRA ROJA", full strip innerText "DRAMA / HOT / ANIME / ESPAÑOL / BOLLYWOOD / REALITY / CREATORS / ALFOMBRA ROJA / MÚSICA". Empty-state copy is inline English at components/BrowsePage.tsx:715-729.

**Independent verification.** Reproduced on production, mechanism confirmed in the deployed bundle (not the build).

DEPLOYED-BUNDLE PROOF (dpl_FEduFW6ftQZyapPx28PouXp55wk3):
- /_next/static/immutable/chunks/1aseb4gggkekc.js ships TAB_KEYS verbatim as `{drama:"tab.drama",new:"tab.new",popular:"tab.popular",music:"tab.music",reality:"tab.reality","red-carpet":"tab.redCarpet"}` and the label expression `children:(a=n[r.key])?h(a):r.label` — an unmapped key renders the English literal from BROWSE_TABS.
- /_next/static/immutable/chunks/428d7hhx0m19l.js holds all 20 locale dictionaries: `"tab.drama"` appears 20x, `"tab.redCarpet"` 20x, and `"tab.anime"` / `"tab.espanol"` / `"tab.bollywood"` / `"tab.creators"` / `"tab.tubi"` appear 0 times. So no locale can translate those four labels.

LIVE READBACK (www.verzatv.com, Chrome, localStorage verza-lang):
- es → strip reads DRAMA · HOT · [Tubi img] · ANIME · ESPAÑOL · BOLLYWOOD · REALITY · CREATORS · ALFOMBRA ROJA · MÚSICA. Matches the repro exactly.
- ja → ドラマ · HOT · [Tubi img] · ANIME · ESPAÑOL · BOLLYWOOD · リアリティ · CREATORS · レッドカーペット · 音楽. Four Latin-script text labels among four Japanese ones.
- ja at /?tab=anime → the empty-state panel is fully English ("Anime is 

---

### S1-012 — Dead CSS whose stated purpose is unfulfilled: `.hero-poster` is defined twice in globals.css with a careful comment about capping the hero so the whole 9:16 flyer fits without scrolling, and is applied to no element anyw

*Raised by S1 — Discover / Home. The `/` route as s*

**Reproduction.** 1. `grep -rn 'hero-poster' app components lib` returns only the two globals.css definitions and no consumer. 2. The hero card in BrowsePage carries `className="relative mx-auto overflow-hidden rounded-xl"` with inline `aspectRatio: '2 / 3'` and `maxWidth: 'min(320px, 80vw)'` — no hero-poster class.

**Evidence.** app/globals.css:364-370 (`.hero-poster { max-height: calc(100svh - 112px - env(safe-area-inset-top, 0px)); }`) and app/globals.css:499-503 (the desktop-frame override `.hero-poster { max-height: 480px }`). `grep -rn 'hero-poster' app components lib` → only app/globals.css:368 and app/globals.css:501. components/BrowsePage.tsx:991-999 is the element the comment is describing. The maxWidth already bounds the height at every phone width tested, so no visible break results today — but the rule is inert, which is exactly the pattern standing rule 1 warns about.

**Independent verification.** Reproduced in source and in the live deployment. SOURCE: `grep -rniI 'hero.poster' . --exclude-dir={node_modules,.next,.git,docs}` returns only app/globals.css:368 and app/globals.css:501 (the two rule bodies) plus the 364-367 comment — no consumer anywhere. components/BrowsePage.tsx:991-999 is the element the comment describes and carries className="relative mx-auto overflow-hidden rounded-xl" with inline aspectRatio "2 / 3", width "100%", maxWidth "min(320px, 80vw)" — no hero-poster class. The sibling class hero-crossfade IS applied (BrowsePage.tsx:1039), which makes the omission look like a slip. DEPLOYED (fetched from www.verzatv.com with an iPhone UA): the served stylesheet /_next/static/immutable/chunks/1b0rux1xv-mpp.css ships both rules verbatim — `hero-poster{max-height:calc(100svh - 112px - env(safe-area-inset-top,0px))}` and `hero-poster{max-height:480px}` — while the live / HTML contains 0 occurrences of hero-poster and 3 of hero-crossfade, and the hero card in the served markup is exactly `class="relative mx-auto overflow-hidden rounded-xl" style="aspect-ratio:2 / 3;width:100%;max-width:min(320px, 80vw);background:#07070E"`. I also downloaded all 14 JS chunks referenced

---

### S1-013 — The audit's own denominator document is wrong about the catalog. docs/audit/00-manifest.json reports catalog.live = 1 and catalog.comingSoon = 0, and 00-manifest.md repeats "96 rows: 1 live, 0 coming soon", while the sam

*Raised by S1 — Discover / Home. The `/` route as s*

**Reproduction.** 1. `python3 -c "import json;d=json.load(open('docs/audit/00-manifest.json'));print(d['catalog']['rows'],d['catalog']['live'],d['catalog']['comingSoon'])"` → `96 1 0`. 2. Count statuses in d['catalog']['detail'] → Counter({'live': 91, 'coming_soon': 5}).

**Evidence.** docs/audit/00-manifest.json `catalog: {rows:96, live:1, comingSoon:0, slugs:96, detail:96}`; detail statuses Counter({'live':91,'coming_soon':5}). docs/audit/00-manifest.md: "96 rows: **1 live**, **0 coming soon**." Independently confirmed against lib/catalog.ts via jiti: 96 rows, 91 live, 5 coming_soon, no other status values. AGENTS.md rule 2 and scripts/test-payment-integrity.mjs both assert 96/91/5. Any agent that reports coverage against the summary numbers will report against a broken denominator.

**Independent verification.** Reproduced exactly as written. (1) /Users/jothamhall/E! CREATOR ECONOMY/verza-tv/docs/audit/00-manifest.json prints `96 1 0` for catalog.rows/live/comingSoon. (2) The SAME file's catalog.detail array (len 96) counts Counter({'live': 91, 'coming_soon': 5}) — self-contradictory. (3) docs/audit/00-manifest.md:28 reads "96 rows: **1 live**, **0 coming soon**." while line 18 of the same document already says "five of them behave differently from the other 91". (4) Asserted against real data, not the doc: resolved lib/catalog.ts at runtime via jiti (node -e with jiti, not string matching) — 96 rows, {"live":91,"coming_soon":5}, coming-soon slugs the-chairmans-revenge, protected-by-the-devil, the-last-will, the-billionaires-apron, i-cant-resist-my-mansion-gardener. Independent oracles agree: scripts/test-payment-integrity.mjs:678-685 asserts catalog.length 96, live 91, coming_soon 5; AGENTS.md:50-52 states 96 rows / 91 live / 5 coming_soon.

Adversarial checks that did not kill it: the two keys sit in a count trio beside rows:96 / slugs:96 / detail:96 and the markdown renders them as counts, so there is no alternate reading of live:1 as a flag or a different metric; the files on disk toda

---

### S1-014 — Seven components in the home/browse neighbourhood are imported by nothing reachable, and the manifest counts their interactive elements in the 535 denominator — 5 of them from HeroCarousel.tsx alone, a component the home

*Raised by S1 — Discover / Home. The `/` route as s*

**Reproduction.** For each of HeroCarousel, PosterSkeleton, ChannelRow, SeriesInfoButton, SeriesInfoDrawer, HeroVideo, SeriesCard: grep the repo for an import outside the component's own file.

**Evidence.** `for c in …; do grep -rl "components/$c" app components lib | grep -v "components/$c.tsx"; done` → HeroCarousel <UNUSED>, PosterSkeleton <UNUSED>, ChannelRow <UNUSED>, SeriesInfoButton <UNUSED>, HeroVideo <UNUSED>; SeriesInfoDrawer only from SeriesInfoButton (itself unused); SeriesCard only from ChannelRow (itself unused). Manifest interactive items attributed to these files: HeroCarousel.tsx 5 (1 button, 2 handler, 2 link), SeriesCard.tsx 1. The home page's real hero is the inline block at components/BrowsePage.tsx:972-1083, not HeroCarousel.tsx. Side effect worth naming: SeriesInfoButton/SeriesInfoDrawer are the only "more info" affordance in the codebase and they are wired to nothing, so 

**Independent verification.** CONFIRMED as written; severity S4 is correct (raiser got it right). Zero user impact — nothing ships.

PART 1 — the seven components are genuinely unreachable. Repo grep over app/ components/ lib/ (the only source dirs; no src/, no pages/) for each bare component name, excluding its own file:
- components/HeroCarousel.tsx — 0 importers. The only hits are components/TubiHeroCarousel.tsx, a DIFFERENT file, which BrowsePage.tsx:13 imports and renders at :775.
- components/PosterSkeleton.tsx — 0 references anywhere.
- components/ChannelRow.tsx — 0 importers.
- components/SeriesInfoButton.tsx — 0 importers.
- components/HeroVideo.tsx — 0 importers.
- components/SeriesInfoDrawer.tsx — imported only by SeriesInfoButton.tsx:8 (itself dead).
- components/SeriesCard.tsx — imported only by ChannelRow.tsx:2 (itself dead).
Ruled out the escape hatches: no barrel file (no components/index.*), tsconfig has only the "@/*" -> "./*" alias (so a relative import would still contain the component name and be caught by the same grep), and every dynamic import() in the repo is either "hls.js" or "@/lib/supabase/server" — no lazy component loading. scripts/test-feed-integrity.mjs:1122-1123 already documen

---

### S1-015 — Dead conditional in the StorageBlue ad-ribbon gate: it tests `activeTab === "new"`, a BrowseCategory value that is not present in BROWSE_TABS, so that arm can never be true.

*Raised by S1 — Discover / Home. The `/` route as s*

**Reproduction.** Compare components/BrowsePage.tsx:1086 with the BROWSE_TABS array in lib/catalog.ts:20-41 — there is no `{ key: "new" }` entry.

**Evidence.** components/BrowsePage.tsx:1086 — `{(activeTab === "drama" || activeTab === "new" || activeTab === "popular") && (…StorageBlue ribbon…)}`. lib/catalog.ts:7-18 keeps "new" in the BrowseCategory union but lib/catalog.ts:20-41 lists only drama, popular, tubi, anime, espanol, bollywood, reality, creators, red-carpet, music. Live confirmation: the ribbon renders on Drama and Hot only (measured 1 storageblue.com link on each, plus the separate Reality ribbon at BrowsePage.tsx:913-933).

**Independent verification.** CONFIRMED as written — dead conditional, zero viewer-visible effect. S4 is correct.

SOURCE (repo clean at HEAD 197cc1a, `git status --porcelain` empty):
- /Users/jothamhall/E! CREATOR ECONOMY/verza-tv/components/BrowsePage.tsx:1086 — `{(activeTab === "drama" || activeTab === "new" || activeTab === "popular") && (…StorageBlue ribbon…)}`
- /Users/jothamhall/E! CREATOR ECONOMY/verza-tv/lib/catalog.ts:20-41 — BROWSE_TABS = drama, popular, tubi, anime, espanol, bollywood, reality, creators, red-carpet, music. No `new` entry. `"new"` survives only in the BrowseCategory union (lib/catalog.ts:9) and as a *content* tag folded into Hot (lib/catalog.ts:1312), which is why `tsc --noEmit` accepts the comparison and never flagged it.

I traced every writer of activeTab rather than string-matching. Only three exist: `useState<BrowseCategory>("drama")` (BrowsePage.tsx:288); `syncTabFromUrl`, which hard-gates on `BROWSE_TABS.some(t => t.key === tab)` (BrowsePage.tsx:418) so `?tab=new` is rejected; and `selectTab` (BrowsePage.tsx:485), reachable only from CategoryTabs `onSelect` (items = BROWSE_TABS), the swipe handler (keys from BROWSE_TABS), and the literal `selectTab("drama")` at :724. activeTab

---

### S1-016 — ?tab= deep links paint the Drama tab first and swap after hydration, and the query string is not cleared when the tab changes afterwards, so the Anime empty state's "Browse Drama" CTA leaves the URL saying ?tab=anime and

*Raised by S1 — Discover / Home. The `/` route as s*

**Reproduction.** 1. Open https://www.verzatv.com/?tab=anime. The Drama grid paints first, then the Anime panel replaces it. 2. Tap "Browse Drama". You land on Drama but the address bar still reads /?tab=anime. 3. Reload: you are back on the Anime empty state.

**Evidence.** components/BrowsePage.tsx:412-426 — `syncTabFromUrl` runs in an effect after hydration; the SSR render is always `useState<BrowseCategory>("drama")` (BrowsePage.tsx:288). Measured on production: the first DOM read after navigating to /?tab=anime returned aria-current "DRAMA" with the Drama grid; a second read a round-trip later returned "ANIME" with the empty panel. components/BrowsePage.tsx:428-432 documents the deliberate decision not to write ?tab= on tab change, but nothing strips an inbound one; the `appliedTabSearch` ref (BrowsePage.tsx:412) stops it re-firing within the session, so only a reload exposes it.

**Independent verification.** Reproduced on production, both halves.

FIRST-PAINT CLAIM. `curl` of https://www.verzatv.com/?tab=anime and https://www.verzatv.com/ returned byte-identical bodies (`cmp` = IDENTICAL, 231291 bytes each, x-nextjs-prerender: 1, no redirect). Same for /?tab=reality vs /. The prerendered home page therefore always ships the Drama grid no matter what ?tab= says; the tab only changes after hydration.

NO-URL-WRITE CLAIM, verified in the DEPLOYED bundle. Pulled the chunk the live HTML loads, /_next/static/immutable/chunks/1aseb4gggkekc.js (contains "Browse Drama"). `grep -o "replaceState|pushState"` over it returns ZERO matches — the shipped BrowsePage writes no history entry on a tab change. The shipped sync is the guarded read only: `let e=window.location.search; if(q.current===e)return; q.current=e; ... queueMicrotask(()=>j(t))` inside a passive useEffect, matching components/BrowsePage.tsx:412-426, with initial state useState("drama") at :288.

LIVE INTERACTION on www.verzatv.com, one atomic JS run so a concurrently-driven tab could not interleave:
  step "after deep-link to anime": url /?tab=anime, aria-current="page" → "Anime", "Browse Drama" CTA present, 0 series tiles.
  step "aft

---

### S2-008 — The /horizontal back control is a <button onClick={() => window.location.href = ...}>, the exact defect feed-integrity check 3 exists to prevent - and that check cannot see this file.

*Raised by S2 — PLAYER / SHORTS: the vertical rail *

**Reproduction.** Open /horizontal on a phone and tap the back control before hydration completes. Nothing happens; the tap lands on dead markup.

**Evidence.** components/HorizontalBackButton.tsx:7 - `<button onClick={() => { window.location.href = "/?tab=reality"; }}>`. scripts/test-feed-integrity.mjs:132-152 asserts "Navigation controls must be real links" and names the exact bug ("Go Back on the paywall was a <button onClick>. It did nothing until React hydrated"), but its regex runs over `feedCode`, which is `read("components/EpisodeFeed.tsx")` at scripts/test-feed-integrity.mjs:34 and :46. I confirmed the check is load-bearing by negative control on an isolated copy of the tree: converting EpisodeFeed's paywall Go Back anchor into a button produced `FAIL - back control: a back control is a <button>, not a link`. The same mutation applied to Ho

**Independent verification.** CONFIRMED as written, but severity corrected S3 -> S4 because the route is unreachable from the product.

CODE CLAIM - true. components/HorizontalBackButton.tsx:6-7 is `<button onClick={() => { window.location.href = "/?tab=reality"; }}>`.

DEPLOYED BUNDLE (not the build) - true. curl https://www.verzatv.com/horizontal returns 200 / 94,551 bytes and serves `<div class="sticky top-0 z-30 px-4 pt-3 pb-2"...><button class="flex items-center gap-2 border-0 bg-transparent cursor-pointer p-0">` with NO href. The string "tab=reality" appears 0 times in the served HTML - the destination exists only in the JS chunk, so pre-hydration the tap genuinely lands on dead markup.

TEST BLIND SPOT - true. scripts/test-feed-integrity.mjs:132-152 ("Navigation controls must be real links") runs its regex over `feedCode`, defined at lines 35/46 as stripComments(read("components/EpisodeFeed.tsx")). It cannot see HorizontalBackButton.tsx.

WHY S4, NOT S3 - the effect, not just the assignment, was checked. /horizontal is an orphan legacy duplicate no viewer reaches:
- No link to it anywhere in app source; the only hit is its own self-referencing alternates.canonical at app/horizontal/page.tsx:11.
- In NO s

---

### S2-010 — /horizontal is an orphan route: nothing in the product links to it, it is absent from the sitemap, its chrome is hard-coded English, and its play buttons ignore translations that exist in all 20 locales.

*Raised by S2 — PLAYER / SHORTS: the vertical rail *

**Reproduction.** Search the app for a link to /horizontal - there is none. Load https://www.verzatv.com/horizontal directly (200) and read the accessible names on the play buttons in any locale.

**Evidence.** No `"/horizontal"` href exists in app/, components/ or lib/ (only its own alternates.canonical at app/horizontal/page.tsx:11); it is not in app/sitemaps/pages.xml/route.ts:8-20 and not in lib/data/sitemap.ts. The i18n key `nav.widescreen` is translated in all 20 locales and rendered nowhere. Live DOM read on production: 14 video cards, and button accessible names "Play Storage Pirates Teaser", "Play Real Storage Auction in New Jersey", ... - from components/HorizontalFeed.tsx:226 `aria-label={playing ? "Pause" : `Play ${video.title}`}` - while `horizontal.play` and `horizontal.pause` exist in all 20 locales, unused. The mute control on the same row IS localized (:283), which makes the incons

**Independent verification.** All four sub-claims reproduce on production; severity corrected S3 -> S4 on reach.

WHAT I DID AND SAW

1. Orphan — CONFIRMED. `grep -rn "/horizontal"` over app/, components/, lib/ returns exactly one hit: its own self-referencing canonical at app/horizontal/page.tsx:11 (`alternates: { canonical: "/horizontal" }`). No href, no redirect in next.config, nothing in public/, and no sibling repo under "E! CREATOR ECONOMY/" references it. The Reality tile that used to point here (commit 7e3e6e7 "Storage Pirates poster navigates to /horizontal like drama posters") now goes through `posterHref(show.slug)` at components/BrowsePage.tsx:894, and lib/series-href.ts:113 makes that `episodeHref(series, 1)` -> /series/storage-pirates/1. The repo's own docs/reports/VERZA_ROUTE_INVENTORY.csv:32 already labels it "ORPHANED — LEGACY".

2. Absent from the sitemap — CONFIRMED live. `curl` of all four children of https://www.verzatv.com/sitemap.xml (shows/episodes/genres/pages.xml): 0 occurrences of "horizontal" in each. pages.xml carries 170 <loc> entries, none of them this route. robots.txt is Allow: / for everyone, so the page is crawlable-but-unadvertised. https://www.verzatv.com/horizontal returns 

---

### S2-011 — Every mounted slide tears down and re-adds its timeupdate and ended listeners about four times a second for the entire watch, because the progress callbacks are inline arrows in the effect's dependency array.

*Raised by S2 — PLAYER / SHORTS: the vertical rail *

**Reproduction.** Watch any episode. onTime fires ~4x/sec and calls setEpProgress with a changing value, re-rendering EpisodeFeed; each render creates fresh onProgress/onPosition props for all mounted slides (up to five), whose identities are dependencies of the listener effect, so it cleans up and re-subscribes on every tick.

**Evidence.** components/EpisodeFeed.tsx:2139-2145 - `onProgress={i === activeIndex ? setEpProgress : () => {}}` and `onPosition={i === activeIndex ? (p: number) => { activePositionRef.current = p; } : () => {}}` - both allocate a new function per render. components/EpisodeFeed.tsx:1003 - `}, [isActive, seriesSlug, episode.number, onEnded, onProgress, onPosition]);` - the effect that adds `timeupdate` and `ended` (:997-998). EpisodeSlide is not memoized. Secondary risk: an `ended` event delivered in the gap between removeEventListener and addEventListener is dropped, which would silently skip an auto-advance.

**Independent verification.** Reproduced in full on production, then downgraded S3 -> S4 because the route is unreachable.

WHAT I DID AND SAW

1) Orphan — verified four ways, all negative for any inbound link.
- Repo grep for "/horizontal" across app/, components/, lib/ returns exactly one hit: /Users/jothamhall/E! CREATOR ECONOMY/verza-tv/app/horizontal/page.tsx:11 `alternates: { canonical: "/horizontal" }`. Nothing else, no router.push, no href.
- Fetched 7 production pages (/, /discover, /shorts, /series/storage-pirates, /search, /help, /about): zero occurrences of the substring "/horizontal" in any served HTML.
- Downloaded the 47 deployed JS chunks referenced by those pages plus /horizontal itself from /_next/static/immutable/chunks/: zero hits for "/horizontal".
- https://www.verzatv.com/manifest.json has no `shortcuts`; next.config.ts redirects() (lines 81-92) only normalizes trailing slashes and fixes two typo series slugs.
The route itself is live: GET https://www.verzatv.com/horizontal -> 200, 94,551 bytes.

2) Sitemap — absent everywhere. /sitemap.xml, /sitemaps/pages.xml (170 <loc> entries), /sitemaps/shows.xml, /sitemaps/episodes.xml, /sitemaps/genres.xml, the HTML /sitemap page and /robots.txt al

---

### S2-013 — The player and its regression gate both assert that a hard-coded free-episode count of 5 would be wrong for "seven of the ninety-one" live titles. Measured against the real catalog it is five, and the two clamped titles 

*Raised by S2 — PLAYER / SHORTS: the vertical rail *

**Reproduction.** Load lib/catalog.ts after the MUX_MAP normalizer runs (lib/catalog.ts:1273-1279) and list every live row where freeEpisodes !== 5.

**Evidence.** Measured: exactly 5 live rows have freeEpisodes !== 5 - the-dumb-billionaire-heiress-in-love (50/50), storage-pirates (13/13), too-much-junk (1/1), exes-premiere (12/12), love-awards (13/13). All 86 paid titles are exactly 5. The two rows whose freeEpisodes the normalizer clamps below their source literal are the-dumb-billionaire-heiress-in-love (literal 58 at lib/catalog.ts:128 -> 50) and storage-pirates (literal 14 at lib/catalog.ts:753 -> 13) - both already inside the wholly-free five. Claim locations: components/EpisodeFeed.tsx:2437 "A hard-coded 5 would be wrong for seven of the ninety-one", scripts/test-feed-integrity.mjs:2339 and :2343 "misstates the offer on seven live titles", and :

**Independent verification.** CONFIRMED — the comment's arithmetic double-counts, and I measured it against the real catalog rather than trusting the raiser.

WHAT I DID
1. Loaded the real runtime catalog the same way the repo's own gate does — transpiled `lib/catalog.ts` in-memory with `./mux-public-map` injected (script in scratchpad, no repo file touched), i.e. AFTER the normalizer at lib/catalog.ts:1272-1279 runs.
   Result: 96 rows = 91 live + 5 coming_soon (denominator "ninety-one" is correct).
   freeEpisodes distribution over the 91 live rows: {1:1, 5:86, 12:1, 13:2, 50:1}.
   Live rows with freeEpisodes !== 5 — exactly FIVE, not seven:
     the-dumb-billionaire-heiress-in-love 50/50, storage-pirates 13/13, too-much-junk 1/1, exes-premiere 12/12, love-awards 13/13.
   All 86 paid live titles (coinPerEpisode > 0) are exactly 5. Zero exceptions.

2. Re-ran the same load with the normalizer loop neutered in memory to get the pre-clamp source literals, and diffed. Exactly TWO live rows are clamped:
     the-dumb-billionaire-heiress-in-love 58 -> 50, storage-pirates 14 -> 13.
   Both have coinPerEpisode 0, so both are already inside the set of five wholly-free titles. The comment's own arithmetic — "the five

---

### S2-014 — Stale comments assert the opposite of the shipped routing: they say every poster now opens the show page, six lines above the code that starts the instant player on a poster tap straight into the player.

*Raised by S2 — PLAYER / SHORTS: the vertical rail *

**Reproduction.** Read components/BrowsePage.tsx:250-258, then read :259-286 immediately below it, then read posterHref in lib/series-href.ts.

**Evidence.** components/BrowsePage.tsx:251-253 - "Continue Watching is the last one on this page: every tile, hero, category row and search result now opens the show page instead, and the show page's own play CTA carries the prewarm from there (components/PlayNowLink.tsx)." But components/BrowsePage.tsx:259-286 defines posterClick, which seeds `verza-transition` and calls `startInstantPlayer(publicId)`, and it is wired to every grid tile at :1198 (`onClick={soon ? undefined : (e) => posterClick(e, s.slug)}`). lib/series-href.ts:posterHref returns `episodeHref(series, 1)` = /series/<slug>/1, and its own docblock says the opposite of BrowsePage's: "A poster tap starts the video, immediately, with no inters

**Independent verification.** Reproduced at HEAD (197cc1a) and against production. components/BrowsePage.tsx:250-258 asserts "Continue Watching is the last one on this page: every tile, hero, category row and search result now opens the show page instead". False on all counts. posterClick (defined :259, seeds sessionStorage verza-transition and calls startInstantPlayer at :284) is wired to SIX links: :631 Continue Watching, :670 music poster, :899 reality tile, :953 red-carpet tile, :989 hero, :1201 main grid tile. Each of the five non-resume ones uses href={posterHref(...)}, and posterHref in lib/series-href.ts is episodeHref(series,1) -> /series/<slug>/1, i.e. the player. The "search result" clause is false too: SearchBar.tsx:67, FeedSearch.tsx:111, SearchButton.tsx:125 all use posterHref. Provenance: git blame puts the comment in 9b2fc27 "Phase 1: route the app to its own sales pages" (2026-08-29 15:29); 83c29d1 "Restore instant play on a poster tap" (15:56) reversed the routing — its diff flips every seriesHref back to posterHref and re-adds the posterClick onClick on all five surfaces — and left the comment behind. Verified the EFFECT in the deployed bundle, not the build: curl https://www.verzatv.com/ (20

---

### S2-015 — A duplicated dead statement and broken indentation in two teardown paths of the rail, the signature of an unreviewed automated edit inside the file the brief marks DO NOT MODIFY.

*Raised by S2 — PLAYER / SHORTS: the vertical rail *

**Reproduction.** Read the two blocks.

**Evidence.** components/EpisodeFeed.tsx:369-371 and :868-870 both read `startedRef.current = false;` twice in a row followed by a `setStarted(false);` indented out of alignment with its block. Harmless at runtime; named because a stray duplicate line inside the Severity 1 file is exactly what a reviewer skims past.

**Independent verification.** CONFIRMED — the comment is stale and asserts the opposite of both the code below it and the live site. Not a DO-NOT-REGRESS misfile: the finding asks to correct a comment, it does not ask to change posterHref routing.

What I did and saw:

1) Quote is accurate. components/BrowsePage.tsx:250-258 (clean at HEAD 197cc1a, no working-tree diff) reads verbatim: "ONLY for links whose destination is the player. / Continue Watching is the last one on this page: every tile, hero, category row and search result now opens the show page instead, and the show page's own play CTA carries the prewarm from there (components/PlayNowLink.tsx). / Attaching this to a link that lands on the show page is not harmless — ..."

2) The code six lines below contradicts it. BrowsePage.tsx:259-286 defines posterClick, which seeds sessionStorage "verza-transition" and calls startInstantPlayer(publicId). grep shows it attached at SIX call sites, not one: :631 Continue Watching, :670 the Too Much Junk hero tile, :899 the Reality grid tile, :953 the Red Carpet event tiles, :989 the hero slideshow, :1201 every main catalog grid tile (skipped only for coming-soon, via `soon ? undefined :`). Every one of those five no

---

### S2-016 — The events route documents its own rate limit as the wrong tier.

*Raised by S2 — PLAYER / SHORTS: the vertical rail *

**Reproduction.** curl -sI -X POST https://www.verzatv.com/api/events and read x-ratelimit-limit.

**Evidence.** app/api/events/route.ts:13 - "Rate limited by middleware (catch-all /api/ tier: 30/min/IP)." middleware.ts:51 - `{ pattern: /^\/api\/events/, limit: 180 }`. Production header returns `x-ratelimit-limit: 180`. The sink itself works: POST {"event":"paywall_viewed","props":{...}} returned HTTP 202 {"ok":true}, so the player's paywall_viewed and checkout_started reach it correctly.

**Independent verification.** Reproduced exactly as written, in source AND in the live production bundle.

SOURCE — /Users/jothamhall/E! CREATOR ECONOMY/verza-tv/components/EpisodeFeed.tsx. Both cited blocks are verbatim as described. Measured indent depth with awk:
  369 indent=6 | startedRef.current = false;
  370 indent=6 | startedRef.current = false;   <- duplicate, dead
  371 indent=4 | setStarted(false);            <- siblings at 366/367/368/372 are all indent=6
  868 indent=6 | startedRef.current = false;
  869 indent=6 | startedRef.current = false;   <- duplicate, dead
  870 indent=4 | setStarted(false);            <- siblings at 866/867/871 are all indent=6
`grep -c "^      startedRef.current = false;$"` returns 4, i.e. exactly the two pairs claimed — no third site. The correct single-assignment form of the same pair exists at 624-625 inside fullReattach(), which is what these two should look like.

PROVENANCE — the "unreviewed automated edit" half of the claim is correct and I can name the commit. `git blame -L 367,372` and `-L 866,871` both attribute lines 369-371 / 868-870 to e6cff6a "Stop the rail walking itself to the end of the series" (bigfilmsonly-alt, 2026-08-29). `git show e6cff6a` shows the 

---

### S4-005 — The /discover search dropdown has no result cap, no max-height and no scroll container, so a two-character query renders all 91 rows as a ~7,300px absolutely-positioned overlay on top of the page. The other two surfaces 

*Raised by S4 — SEARCH. The four catalogue-search s*

**Reproduction.** On /discover type "an" (or "in", "er") → 91 rows. Type "dr" or "drama" → 83. "the" → 77. "love" → 50. Each row is a 56px poster inside py-3, ≈80px, so 91 rows ≈ 7,280px of dropdown over a page whose own content is a few screens tall. At 320px width the overlay covers the All Series list entirely and cannot be dismissed except by editing the query.

**Evidence.** components/SearchBar.tsx:56-63 — `className="absolute top-full left-0 right-0 mt-2 rounded-xl overflow-hidden z-50"`, style carries only background and border; no maxHeight, no overflow-y-auto, and `filtered.map` at :64 has no .slice(). Confirmed in the deployed bundle: /_next/static/immutable/chunks/3--x_pig694c6.js renders `c.map(...)` inside a div whose style object is `{background:"#12121C",border:"1px solid rgba(255,255,255,0.08)"}`. Compare components/SearchButton.tsx:115 (`maxHeight:"calc(100vh - 76px)"` + overflow-y-auto) and components/FeedSearch.tsx:108 (`.slice(0, 12)`).

**Independent verification.** CONFIRMED — reproduced exactly as raised, including the line numbers and the element it points at. Severity S4 stands.

WHAT I DID / WHAT I SAW

1) Source (repo-wide, not just app/components/lib). `grep -rn 'hero-poster' . --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=.git` in /Users/jothamhall/E! CREATOR ECONOMY/verza-tv returns exactly two code hits — /Users/jothamhall/E! CREATOR ECONOMY/verza-tv/app/globals.css:368 and :501 — plus three prose mentions (docs/guides/PORTING-VERZA-TV-TAB.md:110,342 and docs/reports/DEV-REPORT-2026-07-03-POLISH.md:46). Zero consumers in app/, components/, lib/, scripts/, public/. No dynamic construction: the only hero-ish className in the tree is `object-contain hero-crossfade` at components/BrowsePage.tsx:1039. Also checked the sibling repos — 0 hits in /Users/jothamhall/verza-native, ../novela, ../the-build — so it is not a shared rule live somewhere else.

2) Why it is orphaned (git -S). Two commits on 2026-07-04 removed the last two consumers and left the CSS behind: 12094c5 "Fit reality hero on all phones via width cap" deleted `className="hero-poster relative w-full overflow-hidden mx-auto rounded-xl"` from the reality hero, and

---

### S4-008 — A Devanagari query can never match: there is not one Devanagari codepoint anywhere in the catalogue's titles, genres, loglines, tags or categories. lib/text-fold.ts is carefully built to leave Devanagari byte-identical, 

*Raised by S4 — SEARCH. The four catalogue-search s*

**Reproduction.** "दिल" → 0, "दोस्ती" → 0, "दिल दोसा दोस्ती" → 0, "प्यार" → 0, "बॉलीवुड" → 0, "रीसेट" → 0. Verified on production too: /search?q=%E0%A4%A6%E0%A4%BF%E0%A4%B2 → 0 results, "No results" panel. The transliterated spellings do work: "dil" / "dosa" / "dosti" / "dil dosa dosti" all return Dil Dosa Dosti.

**Evidence.** Scan of all 96 rows for [ऀ-ॿ] across title, genre, logline, tags and categories → 0 rows. lib/text-fold.ts:22-39 and scripts/test-feed-integrity.mjs check at ~line 1955 assert `foldText("हिन्दी दोस्ती") === "हिन्दी दोस्ती"`, which passes on a string that exists only inside the test. The six Bollywood titles ship English lockups (Falling for Flatmate, Salt & Pepper, Love for Sale, The Breakup Podcast, Reset) plus one transliteration.

**Independent verification.** CONFIRMED — the `activeTab === "new"` arm is unreachable, verified in source, in the deployed bundle, and in a live browser. Severity S4 stands.

WHAT I DID / SAW

1. Source. /Users/jothamhall/E! CREATOR ECONOMY/verza-tv/lib/catalog.ts:20-41 — BROWSE_TABS holds exactly 10 keys: drama, popular, tubi, anime, espanol, bollywood, reality, creators, red-carpet, music. No "new". catalog.ts:7-18 does keep "new" in the BrowseCategory union, but only as a SERIES DATA TAG — BrowsePage.tsx:58 requires every FEATURED_NEW entry to "carry categories ['new']". So the gate conflates two namespaces (tab key vs series category) that share one union type, which is exactly why TypeScript cannot flag it.

2. Reachability proof (I went looking for an escape route rather than trusting the reporter). `activeTab` has exactly three writers, all bounded by BROWSE_TABS:
   - BrowsePage.tsx:288 `useState<BrowseCategory>("drama")`
   - BrowsePage.tsx:419 `setActiveTab(tab as BrowseCategory)` — guarded at :418 by `if (tab && BROWSE_TABS.some((t) => t.key === tab))`, so `?tab=new` is rejected. This was the most plausible way to make the arm live, and it is closed.
   - BrowsePage.tsx:491 `setActiveTab(key)` from 

---

### S4-009 — The header search's no-results state is a bare grey sentence with no icon, no explanation and no action — it does not follow the house empty-state pattern the Anime tab establishes, and it is the one surface most viewers

*Raised by S4 — SEARCH. The four catalogue-search s*

**Reproduction.** Open the header search, type any miss (e.g. "anime", "tubi", "creators", all of which return 0 despite being real browse tabs). The panel shows only: No results for "anime". Nothing to tap. Same on /discover's bar. /search does better — it links to Discover.

**Evidence.** components/SearchButton.tsx:156-158 renders a single <p>. components/SearchBar.tsx:110-121 the same. Compare the house pattern at components/BrowsePage.tsx:696-731 — a bordered card with a clock icon, a bold headline ("{tab} is coming soon"), an explanatory sentence, and a gradient "Browse Drama" button. And compare app/search/page.tsx:153-173, which at least links to /discover.

**Independent verification.** CONFIRMED — reproduced exactly, and the root cause is pinned.

WHAT I DID / SAW

1. Reproduced the raiser's steps verbatim. docs/audit/00-manifest.json -> catalog.rows=96, catalog.live=1, catalog.comingSoon=0. Counting statuses in the same file's catalog.detail (96 entries) -> Counter({'live': 91, 'coming_soon': 5}). docs/audit/00-manifest.md line 28 reads "96 rows: **1 live**, **0 coming soon**." Both halves reproduce on the current files, so the finding is not stale.

2. Established ground truth from THREE independent sources, all agreeing 96 / 91 live / 5 coming_soon:
   a. Evaluated lib/catalog.ts (not string-matched) via the repo's jiti: rows 96, {"live":91,"coming_soon":5}, getLiveSeries() 91, getComingSoonSeries() 5, 96 unique slugs. Coming-soon: the-chairmans-revenge, protected-by-the-devil, the-last-will, the-billionaires-apron, i-cant-resist-my-mansion-gardener.
   b. Ran scripts/test-payment-integrity.mjs, the oracle AGENTS.md rule 2 designates. It asserts catalog.length 96, live 91, coming_soon 5, and PASSES.
   c. PRODUCTION: https://www.verzatv.com/sitemaps/shows.xml (200) contains exactly 91 show URLs, and that slug set is an EXACT set match for the manifest's 91 liv

---

### S4-012 — trackSearch fires on every keystroke and reports a result count that is one keystroke stale, and fires again on Enter, so the search analytics stream is dominated by prefixes carrying the wrong counts. The two other surf

*Raised by S4 — SEARCH. The four catalogue-search s*

**Reproduction.** Type "billionaire" in the header search: 10 `search` events fire (from "bi" onward), each carrying the result count computed for the previous query string. Press Enter and an 11th fires, duplicating the final query.

**Evidence.** components/SearchButton.tsx:28-29 `const filtered = q.length >= 2 ? series.filter(...) : []` derives from state `query`; :100 `onChange={(e) => { setQuery(e.target.value); if (e.target.value.trim().length >= 2) trackSearch(e.target.value, filtered.length); }}` reads `filtered` from the render that is still current, i.e. computed from the pre-update query. :86-90 the submit handler calls trackSearch(q, filtered.length) again. Confirmed verbatim in the deployed bundle 0lqwh71sks5-j.js: `onChange:e=>{u(e.target.value),e.target.value.trim().length>=2&&(0,c.trackSearch)(e.target.value,y.length)}`. lib/track.ts:69-71 routes to GA4 and Vercel Analytics (not /api/events, so no rate-limit exposure). 

**Independent verification.** CONFIRMED — the import-graph claim reproduces exactly, and the manifest inflation is real and LARGER than reported. Two sub-claims in the evidence are wrong and I correct them below.

WHAT I DID / SAW

1. Import graph (HEAD 147d0f9; manifest generated at its parent 83c29d1, working tree clean, so no drift between manifest and code). Ran `grep -rn "<Name>" . --include='*.tsx' --include='*.ts' --include='*.jsx' --include='*.js' --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=.git` for all seven, minus self-references. Result, verbatim:
 - /Users/jothamhall/E! CREATOR ECONOMY/verza-tv/components/HeroCarousel.tsx — 0 external refs (the only "HeroCarousel" hits elsewhere are `TubiHeroCarousel`, a different, live component imported at BrowsePage.tsx:13 and used at :775)
 - components/PosterSkeleton.tsx — 0
 - components/ChannelRow.tsx — 0
 - components/SeriesInfoButton.tsx — 0
 - components/HeroVideo.tsx — 0
 - components/SeriesInfoDrawer.tsx — imported only by SeriesInfoButton.tsx:8 (itself unreachable)
 - components/SeriesCard.tsx — imported only by ChannelRow.tsx:2 (itself unreachable)
 No barrel/index file in components/, and `grep -rn "dynamic(\|React.lazy\|lazy("` over

---

### S4-013 — Matching is raw substring with no word boundary, so short and common tokens produce results a viewer cannot explain. "goat" matches "scapegoat"; "desi" matches "Desire"; "tit" matches 15 titles; two single letters separa

*Raised by S4 — SEARCH. The four catalogue-search s*

**Reproduction.** "goat mistress" → 2 results: La amante de la cabra (correct) and The Escort They Framed, whose logline contains "…a dynasty's perfect scapegoat…". "desi" → 4 (Blackmail Baby, Duty of Desire, She Is Mine, Tangled in Desire). "tit" → 15. "ass" → 7. "a e" → 91 (all of them). "e a i o" → 91. "a b" → 87.

**Evidence.** lib/search-index.ts:142 `q.split(/\s+/).filter(Boolean).every((token) => haystack.includes(token))` — plain String.includes on a space-joined blob. The 2-character floor at :138 is applied to the whole query, not per token, so a 3-character query of single letters passes and every letter matches somewhere. Haystack for the-mistress-trap contains "goat" at offset 164 inside "…dynasty's perfect scapegoat — until…".

**Independent verification.** CONFIRMED as to the geometry; two of the three supporting claims are wrong and I corrected them. Severity stays S4.

WHAT I DID. Read /Users/jothamhall/E! CREATOR ECONOMY/verza-tv/components/CategoryTabs.tsx (all 263 lines), lib/catalog.ts:20-40 (BROWSE_TABS), and components/BrowsePage.tsx:498-537 (the swipe handler). Then measured on https://www.verzatv.com/ in Chrome, not on a build.

REPRODUCED. Intrinsic label widths on production (EN) come out identical to the raiser's: DRAMA 69, HOT 38, Tubi 76, ANIME 60, ESPAÑOL 84, BOLLYWOOD 115, REALITY 78, CREATORS 97, RED CARPET 112, MUSIC 60; gap-5 = 20, px-4 = 16, track scrollWidth 1000. ESPAÑOL's left edge therefore sits at 16+69+20+38+20+76+20+60+20 = 339px into the rail, and the rail spans the full app width (rail clientWidth 394 == .app-shell == .device-screen), so the bisection point is a pure function of viewport width. I then drove the component's own ResizeObserver path by setting .device-screen to each width and read the rects back: 320 -> ESPAÑOL 0/84px visible, 6 tabs at 0px; 375 -> ESPAÑOL 40/84 (36 at scrollLeft 0), 5 tabs at 0px; 390 -> ESPAÑOL 55/84 (51 at scrollLeft 0), 5 tabs at 0px; 430 -> ESPAÑOL full, 5 tabs at 0px.

---

### S4-015 — app/search/page.tsx:86 contains a ternary whose two branches are identical (`results.length === 1 ? "series" : "series"`). The rendered output happens to be right because "series" is invariant in English, but the line re

*Raised by S4 — SEARCH. The four catalogue-search s*

**Reproduction.** Read the line. Production renders "1 series found" and "5 series found" — both correct today.

**Evidence.** app/search/page.tsx:85-88. Compare components/SearchButton.tsx:119, which pluralises correctly: `{filtered.length} result{filtered.length === 1 ? "" : "s"}`. The two surfaces also use different nouns for the same thing ("5 results" vs "5 series found").

**Independent verification.** CONFIRMED as a real, reproducible overflow — with two of the raiser's claims corrected, which is why I drop it to S4.

WHAT I DID
Read components/BrowsePage.tsx:1182-1185 (the box is `<div style={{height:36}}>` holding `<p class="mt-1.5 text-[11px] leading-tight line-clamp-2">{title}</p>` + `<p class="text-[10px] mt-0.5 line-clamp-1">{genre}</p>`), then measured the DEPLOYED page, not the build: loaded https://www.verzatv.com/ in Chrome and ran getBoundingClientRect over every tile of `.poster-grid`. Chrome would not honour resize_window below ~400px (shared window, concurrent agents), so I varied the width by pinning `.app-shell{width:Npx}` in-page. That is faithful here: there is no @media breakpoint anywhere between 320 and 440 in app/globals.css (the first is min-width:520px), so tile geometry is a pure function of container width. Verified: at shell 320 the grid measures 296px and tiles 94.7px, exactly a real 320px phone.

WHAT I SAW — the mechanism is exactly as described
Caption box clientHeight 36, scrollHeight 45 on every tile whose title wraps to two lines (title 27.5px + mt-1.5 6px + mt-0.5 2px + genre line box 15px = 45px against a hard 36px). Overflow past the box is a

---

### S5-014 — The payment gate's own PASS line reports "74 unlock SKUs" while the assertion twelve hundred lines above it requires exactly 86. Anyone reading a green CI run takes away the wrong number of sellable titles.

*Raised by S5 — Shop and commerce. Agent C's actual · **touches money or the shipped rail***

**Reproduction.** Run `npm run test:payments`. Output line 1: "payment code/catalog suite: PASS (74 unlock SKUs, 2 VIP plans)". Then read scripts/test-payment-integrity.mjs:689.

**Evidence.** scripts/test-payment-integrity.mjs:689 `assert.equal(purchasable.length, 86, "unlock SKU count changed; review checkout coverage")` and :699 `assert.equal(new Set(purchasable.map(s=>s.slug)).size, 86)`; :1072 `console.log("payment code/catalog suite: PASS (74 unlock SKUs, 2 VIP plans)")`. Independently confirmed from lib/catalog.ts: 96 rows, 91 live, 5 coming_soon, 86 purchasable. Full run on 2026-08-29: all seven suites PASS.

**Independent verification.** Reproduced exactly as written, then corrected the severity down.

WHAT I RAN / SAW
1. `npm run test:payments` at the repo root (2026-08-29). Exit 0, and the first output line is verbatim: `payment code/catalog suite: PASS (74 unlock SKUs, 2 VIP plans)`.
2. `scripts/test-payment-integrity.mjs:673` `const purchasable = catalog.filter(seriesPurchase.isSeriesPurchasable)`; `:689` `assert.equal(purchasable.length, 86, "unlock SKU count changed; review checkout coverage")`; `:699` `assert.equal(new Set(purchasable.map(s => s.slug)).size, 86)`; `:1072` the hard-coded `console.log("... (74 unlock SKUs, 2 VIP plans)")`.
3. Verified effect, not assignment: all three lines live inside the SAME function `runCodeAndCatalogSuite()` (spans :57 to :1073 — no other function opens between them), and node's `assert.equal` throws on mismatch. Reaching the log line therefore PROVES `purchasable.length === 86` at the moment the process prints 74. The two numbers are simultaneously true and contradictory in one run.
4. Independent catalog check (not string-matching the finding): `lib/catalog.ts` holds 96 unique `slug:` keys, 5 `status: "coming_soon"` — consistent with the passing asserts at :683/:685/:68

---

### S5-015 — The show page hard-codes "$1.99" with nothing binding it to SERIES_UNLOCK_PRICE_CENTS, and lib/price.ts's own docblock falsely claims it is the one number the client is allowed to render and that it replaced this literal

*Raised by S5 — Shop and commerce. Agent C's actual · **touches money or the shipped rail***

**Reproduction.** Change SERIES_UNLOCK_PRICE_CENTS in lib/price.ts and lib/series-purchase.ts to 299 and run every gate. `npm run test:feed-integrity` and `npm run test:payments` both pass, and all 86 show pages continue to advertise $1.99 while Stripe charges $2.99. (Today the two values agree, so no viewer is currently misled — this is a latent divergence with no barrier.)

**Evidence.** app/series/[slug]/page.tsx:359 is the bare literal `$1.99`. lib/price.ts:9-14 asserts "'$1.99' appears verbatim in components/EpisodeFeed.tsx (twice), app/series/[slug]/page.tsx, and two dead components … This module is the one number the client is allowed to render" — the EpisodeFeed half is true (components/EpisodeFeed.tsx:2559 and :2628 both call formatPrice(SERIES_UNLOCK_PRICE_CENTS)), the show-page half is not. scripts/test-feed-integrity.mjs:2107-2140 only compares lib/price.ts against lib/series-purchase.ts and checks the en/es formatting; grep for "app/series/[slug]/page.tsx" in both gates shows checks for dynamicParams, canonical, PlayNowLink and prewarm — none for a price.

**Independent verification.** Reproduced exactly; severity corrected S3 -> S4.

WHAT I DID AND SAW:
1. Both lines exist verbatim in /Users/jothamhall/E! CREATOR ECONOMY/verza-tv/scripts/test-payment-integrity.mjs. Line 689: assert.equal(purchasable.length, 86, "unlock SKU count changed; review checkout coverage"). Line 699: assert.equal(new Set(purchasable.map((series) => series.slug)).size, 86). Line 1072 is a HARDCODED, non-interpolated literal: console.log("payment code/catalog suite: PASS (74 unlock SKUs, 2 VIP plans)").

2. VERIFIED THE EFFECT, NOT THE ASSIGNMENT. Ran `npm run test:payments` on 2026-08-29. All seven suites PASS, and output line 1 was literally "payment code/catalog suite: PASS (74 unlock SKUs, 2 VIP plans)". The suite passing is itself proof the assertion holds at 86, so a single green run simultaneously enforces 86 and reports 74.

3. ASSERTED AGAINST REAL DATA, NOT STRING MATCHING. Loaded lib/catalog.ts, lib/series-purchase.ts, lib/stripe-tax.ts and lib/mux-public-map.ts through the same transpile path the test uses and counted independently: 96 catalog rows, 91 live, 5 coming_soon, 86 purchasable, 86 unique purchasable slugs. The log line understates by 12.

4. ROOT CAUSE FROM HISTORY: 

---

### S5-018 — The /amazon?p=<id> product deep link works but nothing in the app emits such a link; three source comments claim the footer Shop list points at it, and the footer's own comment says the opposite.

*Raised by S5 — Shop and commerce. Agent C's actual*

**Reproduction.** 1. https://www.verzatv.com/amazon?p=amzn-watersy-tumbler opens the WATERSY tumbler modal — verified live. 2. `grep -rn "amazon?p=" app components lib` returns only comments, never an href.

**Evidence.** components/AmazonDeepLink.tsx:7 "The Shop list in the footer points every product at one of these"; app/amazon/page.tsx:19-20 and components/AmazonProducts.tsx:170 repeat the claim. components/Footer.tsx:99-100 states "No products in the footer. They live on /shop … and on /amazon." The only outbound commerce links in the shell are components/BottomNav.tsx:38 (/shop), app/shop/page.tsx:133 (/amazon) and app/amazon/page.tsx:96 (/shop). Live check 2026-08-29: {modalOpen:true, heading:"WATERSY 40oz Insulated Stainless Tumbler", tiles:12}.

**Independent verification.** Reproduced at source and confirmed absent from the live bundle.

REPRO (exact command from the finding) returns only SeriesInfoButton.tsx's own self-references. A repo-wide scan for any static or dynamic import of the four modules (excluding node_modules/.next/.git/docs) found exactly one edge: components/SeriesInfoButton.tsx:8 imports SeriesInfoDrawer; SeriesInfoButton itself has zero importers. components/Player.tsx and components/CoinPaywall.tsx have zero importers anywhere. The repo has no native/ios tree that could be a second consumer (top-level dirs: app, art-staging, components, docs, lib, node_modules, public, scripts, supabase).

EVIDENCE LINES ARE EXACT. Player.tsx:986 `{unlockLoading ? "Loading..." : "Series Unlock — $1.99 one-time"}`; CoinPaywall.tsx:142 same literal; SeriesInfoDrawer.tsx:371 a literal `$1.99` padlock chip and :365 `series.freeEpisodes ?? 5`. Both unlock buttons are genuinely wired to checkout: Player.tsx:950 and CoinPaywall.tsx:52 both `fetch("/api/unlock", {method:"POST"})`, and Player.tsx:947/:258 emit checkout_started/paywall_viewed with surface "player_unlock_popup".

DEPLOYED-BUNDLE CHECK (www.verzatv.com, x-vercel-cache HIT, age 145s). Fetched 1

---

### S5-019 — On a 320px-wide column the Amazon tile's caption block is a fixed 52px box holding 60px of content, so the required "Not personalized" ad disclosure spills out of its container into the row gap.

*Raised by S5 — Shop and commerce. Agent C's actual*

**Reproduction.** Constrain the /shop Amazon grid's section to 320px and measure the caption div: clientHeight 52, scrollHeight 60, computed overflow "visible".

**Evidence.** Measured live on https://www.verzatv.com/shop 2026-08-29: {tileW:138, capH:52, capScrollH:60, capOverflow:true, overflow:"visible"}; the three lines measure 14px (title, 11px, line-clamp-2), 15px ("Sponsored · Ad · Amazon", 10px) and 14px ("Not personalized", 9px) plus mt-1.5/mt-0.5 spacing. components/AmazonProducts.tsx:226 `<div style={{ height: 52 }}>`. Nothing is clipped — overflow is visible — so the disclosure stays legible; it eats 8px of the 20px `gap-y-5` row gap. No horizontal page overflow was found at any width tested.

**Independent verification.** CONFIRMED — core claim reproduced, with one piece of the raiser's evidence corrected (it is TWO stale comments, not three).

WHAT I DID AND SAW

1. Deep link works — verified live in Chrome, not from source. Navigated to https://www.verzatv.com/amazon?p=amzn-watersy-tumbler; the WATERSY tumbler modal opened on arrival (Close / "Add to bag" / "View on Amazon" -> amazon.com/WATERSY-Tumbler-.../dp/B0D76368QD?...tag=verzatv-20). Product id resolved from real data: lib/amazon-sponsors.ts:327 `id: "amzn-watersy-tumbler"`.

2. Verified in the DEPLOYED bundle, not the build. Pulled all 16 /_next/static/immutable/chunks/*.js referenced by the live /, /shop and /amazon. `grep -l 'amazon?p' v18/*.js` -> zero hits: no emitter ships. The RECEIVER does ship, in 1i5srnvbqe9e9.js: `let e=(0,r.useSearchParams)().get("p"); ... let t=document.getElementById(e); t instanceof HTMLElement&&(t.scrollIntoView({block:"center"}),t.click())`. So a live, working listener with nothing on the site calling it.

3. Served HTML of /, /shop and /amazon: zero `href="...?p=..."`. The only /amazon href anywhere in the shell is `href="/amazon"` on /shop ("View all", app/shop/page.tsx:133). The footer sitemap is server-

---

### S5-022 — The Amazon bag pill's tap target is 40px tall, under the 44px thumb minimum, and it is the only route back into the bag once the drawer is closed.

*Raised by S5 — Shop and commerce. Agent C's actual*

**Reproduction.** Add an item to the bag on /shop, close the drawer, and measure the "N in bag" button.

**Evidence.** Measured live 2026-08-29: {w:102, h:40}. components/AmazonBag.tsx:43 `py-2.5` on a 13px font. It does clear the bottom nav (pill y 460-500, nav y 535-583), so there is no collision — only the size.

**Independent verification.** Reproduced live on www.verzatv.com, and the measurement matches the evidence to the decimal.

DEPLOYED BUNDLE (not the build): fetched https://www.verzatv.com/shop, pulled every /_next/static/immutable/chunks/*.js it references, and found the pill in chunks/3z23pxudvy0-6.js carrying the exact class string shipped: `pointer-events-auto flex items-center gap-2 rounded-full pl-3.5 pr-4 py-2.5 border-0 cursor-pointer font-bold text-[13px] transition-transform active:scale-[0.96]`, immediately before `" in bag"`. Identical to /Users/jothamhall/E! CREATOR ECONOMY/verza-tv/components/AmazonBag.tsx:43.

MEASURED EFFECT (not the assignment): in Chrome on the live /shop with one item in the bag and the drawer closed, getBoundingClientRect on the button with aria-label "Open your Amazon bag, 1 item" returns 102.47 x 39.50 px at y 460-499. Computed style: padding-top 10px, padding-bottom 10px, font-size 13px, line-height 19.5px -> 10+19.5+10 = 39.5. Both contributors are fixed px, so the height is viewport-independent. document.elementFromPoint at the pill centre resolves to the pill, and the parent .amazon-bag-layer is pointer-events:none, so 39.5px is the entire hit area with no invisible pa

---

### S5-023 — The audit manifest's own catalog summary is wrong: it reports "96 rows: 1 live, 0 coming soon" in both the JSON counters and the human summary, while its own detail array correctly holds 91 live and 5 coming soon. Every 

*Raised by S5 — Shop and commerce. Agent C's actual*

**Reproduction.** python3 -c "import json; d=json.load(open('docs/audit/00-manifest.json')); print(d['catalog']['rows'], d['catalog']['live'], d['catalog']['comingSoon']); import collections; print(collections.Counter(x['status'] for x in d['catalog']['detail']))" → 96 1 0 / Counter({'live': 91, 'coming_soon': 5}).

**Evidence.** docs/audit/00-manifest.json catalog.live = 1, catalog.comingSoon = 0, catalog.detail = 91 live + 5 coming_soon. docs/audit/00-manifest.md:28 "96 rows: **1 live**, **0 coming soon**." Ground truth from lib/catalog.ts and from fetching all 96 production show pages: 91 live (86 paid, 5 wholly free) and 5 coming soon.

**Independent verification.** Reproduced on the LIVE deployed site (www.verzatv.com/shop), not the build. Put an item in the Amazon bag, closed the drawer, measured the floating pill: `.amazon-bag-fab button` = {x:382, y:571, w:102.47, h:39.50} CSS px, computed padding-top/bottom 10px, font-size 13px, line-height 19.5px, min-height auto (10+19.5+10 = 39.5). Exactly matches the raiser's {w:102, h:40}. The parent layer is pointer-events:none, so nothing expands the hit area beyond the button's own 102x39.5 — no hidden padding rescues it. Zoomed screenshot confirms the raiser's "no collision" note: the pill sits clearly above the nav icons.

"Only route back into the bag" is essentially right: `openBag` has exactly one call site in the whole repo (components/AmazonBag.tsx:42). One caveat the raiser missed — `addItem` (lib/amazon-bag.tsx:129) calls setIsOpen(true), so "Add another to bag" in a product modal does reopen the drawer. That is a second route but a destructive one (it increments quantity), so the claim stands substantively.

IMPORTANT CONTEXT THAT SHOULD TEMPER ANY FIX: I enumerated every visible button/link on the same screen — 24 of 39 are already under 44px tall. Header "Change language" and "Search" 

---

### S6-014 — /me and /me/list are marked index,follow while the sibling account page /me/purchases is noindex - personal-account URLs are advertised to crawlers.

*Raised by S6 — My List / Library / Profile / Accou*

**Reproduction.** curl -s https://www.verzatv.com/me | grep '<meta name="robots"' -> content="index, follow"; same for /me/list; /me/purchases -> content="noindex, nofollow".

**Evidence.** app/me/purchases/page.tsx:9-11 sets robots {index:false, follow:false} with the note 'Account-only page. Nothing here is for a crawler'; app/me/page.tsx:16-20 and app/me/list/page.tsx:7-10 set no robots directive. Transport is safe (both respond 'cache-control: private, no-cache, no-store' with x-vercel-cache: MISS), so this is indexing hygiene, not a leak.

**Independent verification.** Reproduced on the live domain, and the effect (not just the string) is reachable.

WHAT I DID AND SAW
1) Live fetch of www.verzatv.com, exactly as the repro states:
   /me           -> <meta name="robots" content="index, follow"/>
   /me/list      -> <meta name="robots" content="index, follow"/>
   /me/purchases -> <meta name="robots" content="noindex, nofollow"/>

2) Cause is an inheritance gap, confirmed in source: app/layout.tsx:90 sets the site-wide default robots {index:true, follow:true}; app/me/page.tsx:16-20 and app/me/list/page.tsx:7-10 export metadata with no robots key and inherit it; app/me/purchases/page.tsx:11 overrides it. The codebase has a settled convention these two diverge from - 8 other private/utility pages set noindex (/creator, /admin/dashboard, /admin/review, /forgot-password, /reset-password, /dev/perf, /legal/creator-agreement, /me/purchases).

3) Verified the crawl path is real, not theoretical:
   - Production robots.txt is "Allow: /" for every agent named (Googlebot, Bingbot, GPTBot, OAI-SearchBot, PerplexityBot, ClaudeBot, Google-Extended). No Disallow for /me.
   - Indexable, sitemap-listed pages link to it with a plain href: the homepage and /series

---

### S6-015 — The saved-count badge on /me counts raw stored slugs while My List drops slugs that are not in the catalog, so the counter can disagree with the list it points at.

*Raised by S6 — My List / Library / Profile / Accou*

**Reproduction.** Seed localStorage['verza-saved'] with a retired slug plus a real one. readSavedSlugs() returns both, so /me reads '2 saved'; itemsFromSlugs() resolves only the real one, so /me/list shows 1 row.

**Evidence.** components/ProfileDynamic.tsx:18 `const local = readSavedSlugs().length;` vs components/AccountLists.tsx:76-91 itemsFromSlugs(), which does `if (!series) return [];`. Harness: readSavedSlugs() on {"verza-saved":["not-a-real-show","the-mistress-trap"]} returned both entries.

**Independent verification.** CONFIRMED as written; S4 stands.

DEPLOYED BUNDLE (not the build). Fetched www.verzatv.com/me and /me/list, pulled all 15 linked chunks from /_next/static/immutable/chunks/. Both halves ship, and both chunks are linked from both pages:
- 0fkfn44ctjja6.js: `"SavedCount",0,function(){...let t=(0,a.readSavedSlugs)().length;...e>0?`${e} saved`:"0 saved"}` — no catalog check.
- 11i-r28zvlr4j.js: `"SavedShowsList"...(0,c.readSavedSlugs)().flatMap(e=>{let t=(0,l.getSeriesBySlug)(e);return t?[{...}]:[]})` — drops unknown slugs.
Production /me HTML renders the row "My List | 0 saved" with href="/me/list", so the counter is literally the label on the link to the list it disagrees with (app/me/page.tsx:315-319).

REAL DATA, NOT A MADE-UP SLUG. The raiser's harness used a fake slug; I replaced it with slugs this catalog actually shipped. Walked all 56 commits touching lib/catalog.ts: 113 distinct slugs ever shipped vs 96 today = 17 retired. Six were status:"live" with real episodes (therefore bookmarkable in the player) when last present: the-carpet (2 eps, 2026-07-09), the-vertical-tea (40 eps), vertical-drama-love-awards (6 eps), storageblue-too-much-junk (24 eps, all 2026-06-17), plus the-p

---

### S6-016 — The only control for removing a title from My List is a button whose visible label is 'Saved' - a state word used as an action.

*Raised by S6 — My List / Library / Profile / Accou*

**Reproduction.** Open /me/list with a saved title. The row's single button reads 'Saved' beside a filled bookmark; tapping it removes the title.

**Evidence.** components/AccountLists.tsx:183-193 - onClick={() => handleRemove(...)} with children {t("shorts.saved")} and aria-label={`Remove ${item.seriesTitle} from saved list`}. Confirmed live from the browser: the only button inside the section is labelled 'Saved'. Screen-reader users get the right verb; sighted users do not.

**Independent verification.** Reproduced live on www.verzatv.com, and confirmed in the deployed bundle rather than the build.

SOURCE: /Users/jothamhall/E! CREATOR ECONOMY/verza-tv/components/AccountLists.tsx:183-193 matches the citation exactly. The button carries onClick={() => handleRemove(item.seriesSlug)}, aria-label={`Remove ${item.seriesTitle} from saved list`}, and its only visible children are a FILLED bookmark svg plus {t("shorts.saved")}. lib/i18n.ts:175 resolves "shorts.saved" to "Saved" (en). Style is background:"none", color:T.accent — no border, no chip, no background.

DEPLOYED BUNDLE (not the build): fetched https://www.verzatv.com/me/list (200), pulled its script chunks, and found the identical minified node in /_next/static/immutable/chunks/11i-r28zvlr4j.js — ("button",{onClick:()=>g(s.seriesSlug),...,"aria-label":`Remove ${s.seriesTitle} from saved list`,children:[svg, e("shorts.saved")]}). The deployed locale chunk 428d7hhx0m19l.js carries "shorts.saved":"Saved". So the shipped code, not just the repo, has this.

LIVE REPRO with real catalog rows: verified /series/the-mistress-trap and /series/collateral-hearts both return 200 on production, seeded the device list (localStorage "verza-saved

---

### S6-017 — The guest sync prompt on the Recently Watched tab signs the viewer back into the Saved Shows tab, dropping ?tab=recent.

*Raised by S6 — My List / Library / Profile / Accou*

**Reproduction.** Open /me/list?tab=recent signed out; the prompt's 'Sign in' link is /sign-in?next=%2Fme%2Flist.

**Evidence.** app/me/list/page.tsx:138 hard-codes href="/sign-in?next=%2Fme%2Flist" inside a block that renders on both tabs. Confirmed live: the anchor list on /me/list?tab=recent contains '/sign-in?next=%2Fme%2Flist'.

**Independent verification.** Reproduced live on www.verzatv.com, not just in source.

DEPLOYED BUNDLE (not the build): fetched https://www.verzatv.com/me/list and pulled its chunks. /_next/static/immutable/chunks/11i-r28zvlr4j.js contains the shipped row verbatim: `("button",{onClick:()=>g(s.seriesSlug), ... "aria-label":`Remove ${s.seriesTitle} from saved list`, children:[ ...bookmark svg... , e("shorts.saved")]})`. So the visible child is the translated string and the verb exists only in the aria-label. lib/i18n.ts:175 defines "shorts.saved": "Saved" for en.

LIVE, WITH REAL CATALOG DATA: seeded a guest device with two real slugs (verza-saved = ["the-mistress-trap","collateral-hearts"], verza-lang = "en") and loaded /me/list. Rendered rows resolved to real titles — "The Escort They Framed / Drama · Betrayal · 61 episodes" and "Collateral Hearts / Crime · Romance · 60 episodes". Enumerating every <button> on the page returned six: EN (language), Search, **"Saved"** aria "Remove The Escort They Framed from saved list", **"Saved"** aria "Remove Collateral Hearts from saved list", SITEMAP, Amazon bag. Inside the Saved Shows section the only buttons are the two reading "Saved". Computed color rgb(224,17,95) — the

---

### S6-018 — The guest header on /me offers only 'Sign In'; there is no route to account creation from the account page, and the Sign In pill is a 36px tap target.

*Raised by S6 — My List / Library / Profile / Accou*

**Reproduction.** Load /me signed out: the header shows 'Guest', the subtitle 'Sign in to sync your library and purchases', and a single Sign In pill. /sign-up is reachable only from a footer link inside /sign-in. Measured in the browser: the pill's bounding box is 86x36 px; every other control on the page is >=44px.

**Evidence.** app/me/page.tsx:257-265 renders one Link to /sign-in with className 'px-5 py-2 ...'. Enumerated hrefs inside <main> on /me: /, /forgot-password, /help, /me/list, /me/list?tab=recent, /me/purchases, /privacy, /refund-policy, /sign-in, /studio, /terms, mailto:feedback@verzatv.com, mailto:support@verzatv.com - no /sign-up.

**Independent verification.** Reproduced on live www.verzatv.com/me signed out (h1 = "Guest"), measured in a real browser, not read from source.

(1) Tap target: getBoundingClientRect() on the /sign-in anchor returns exactly 86 x 36 px; computed style padding 8px 20px, font-size 14px, line-height 20px, min-height auto. Independently confirmed from the deployed CSS bundle /_next/static/immutable/chunks/1b0rux1xv-mpp.css, where --spacing=.25rem, --text-sm=.875rem, --text-sm--line-height=calc(1.25/.875), making "px-5 py-2 text-sm" deterministically 36px tall. Deployed markup is byte-identical to app/me/page.tsx:257-265, so not stale.

(2) The "only sub-44 control" claim holds in the scope the raiser used. I enumerated and measured all 16 interactive elements inside <main>: the Sign In pill is the ONLY one under 44px (UNDER44_IN_MAIN = 1). The other 15 measure 45-88px (My List 49, Purchase History 48, Language 45, Notifications 51, Sign Out 46, Start Watching 72, Apply to Become a Creator 88). I specifically tried to break this claim: outside <main> there ARE smaller targets (36x36 header buttons, 18px-tall footer links), but the raiser's evidence explicitly scoped to <main>, where the claim is exactly true.

(3) N

---

### S6-019 — Two inherited facts used by this audit are wrong: MEMORY.md names the retired Supabase project, and the audit manifest's catalog line says '96 rows: 1 live, 0 coming soon' when the real catalog is 91 live and 5 coming so

*Raised by S6 — My List / Library / Profile / Accou*

**Reproduction.** MEMORY.md: 'Project: jejispfvlkwastzvwtwu.supabase.co'. supabase/migrations/008_reconcile_live_schema.sql:3: 'New project mmvbmrrwgludfmfalfcm is a fresh/empty start'. Loading lib/catalog.ts directly: rows=96 live=91 coming_soon=5, against docs/audit/00-manifest.md 'Catalog - 96 rows: 1 live, 0 coming soon.'

**Evidence.** Harness output: 'CATALOG rows=96 live=91 coming_soon=5'; all 5 coming-soon rows have episodeCount 0 and posterHref resolves each to /series/<slug> (the-chairmans-revenge, protected-by-the-devil, the-last-will, the-billionaires-apron, i-cant-resist-my-mansion-gardener), verified live: /series/the-chairmans-revenge -> 200, /series/the-chairmans-revenge/1 -> 404. All 91 live rows resolve to /series/<slug>/1. Anyone acting on MEMORY.md's project ref would point work at the old, still-resolving database.

**Independent verification.** Both asserted facts reproduce exactly as written. (B) docs/audit/00-manifest.md reads verbatim "96 rows: **1 live**, **0 coming soon**."; docs/audit/00-manifest.json has catalog.live=1, catalog.comingSoon=0 while its OWN catalog.detail array (96 entries) counts live=91, coming_soon=5 — the summary contradicts the detail in the same file, and the same .md says "96 show pages (91 prerendered; the 5 coming-soon rows render on demand)" nine lines above. Asserted against real data, not string-matching: copied lib/catalog.ts + lib/mux-public-map.ts to scratch and EXECUTED them under `node --experimental-strip-types` -> "CATALOG rows=96 live=91 coming_soon=5 other=0", getLiveSeries()=91, getComingSoonSeries()=5, all 5 coming-soon rows episodeCount=0. Live routing spot-check on www.verzatv.com: /series/the-chairmans-revenge 200, /series/the-chairmans-revenge/1 404, /series/the-last-will/1 404, /series/the-mistress-trap/1 200 — matches the 91/5 split, not 1/0. (A) MEMORY.md:97 says "Project: jejispfvlkwastzvwtwu.supabase.co". Verified in the DEPLOYED bundle, not the build: downloaded all 14 script chunks referenced by https://www.verzatv.com/sign-in — 6 occurrences of https://mmvbmrrwgludfm

---

### S7-012 — The audit manifest's own catalog summary says 1 live / 0 coming soon, contradicting its own detail array (91/5) — any agent using it as the denominator gets 1/96.

*Raised by S7 — SECTIONS. The 10 browse tabs (Drama*

**Reproduction.** Read docs/audit/00-manifest.md "## Catalog": "96 rows: **1 live**, **0 coming soon**." Then read the same file's `catalog.detail` in 00-manifest.json.

**Evidence.** docs/audit/00-manifest.json `catalog.live = 1`, `catalog.comingSoon = 0`; `catalog.detail` has 96 entries with status counts Counter({'live': 91, 'coming_soon': 5}) — verified against lib/catalog.ts, which yields TOTAL 96 / live 91 / coming_soon 5. The manifest's own prose two paragraphs earlier says "91 prerendered; the 5 coming-soon rows render on demand".

**Independent verification.** REPRODUCED, but S3 is too high — corrected to S4.

What I did and saw:
1. docs/audit/00-manifest.md line 28 reads verbatim: "96 rows: **1 live**, **0 coming soon**." docs/audit/00-manifest.json lines 137-139 read "rows": 96, "live": 1, "comingSoon": 0. Both still present in the current files (mtime Aug 29 16:18); not fixed, not stale.
2. Same JSON's catalog.detail has 96 entries with Counter({'live': 91, 'coming_soon': 5}). So the file contradicts itself.
3. Ground truth asserted against REAL DATA, not string matching: I transpiled lib/catalog.ts + lib/mux-public-map.ts with the repo's own node_modules/typescript and imported the module at runtime. Result: TOTAL rows 96, {"live":91,"coming_soon":5}, and the 5 coming_soon rows all have episodeCount 0 (the-chairmans-revenge, protected-by-the-devil, the-last-will, the-billionaires-apron, i-cant-resist-my-mansion-gardener). A raw grep would have said 92 live — line 81 is the type declaration `status: "live" | "coming_soon";`, which the regex also matches. Executing the source is what gives 91.
4. The manifest also contradicts itself in prose two paragraphs earlier: "**96 show pages** (91 prerendered; the 5 coming-soon rows render on de

---

### S7-014 — "Anime" and "Creators" tab labels have no i18n key at all, so they stay English in all 20 locales while their neighbours localize.

*Raised by S7 — SECTIONS. The 10 browse tabs (Drama*

**Reproduction.** Set the language to Español and open the browse page. The rail reads ... REALITY, CREATORS, ALFOMBRA ROJA, MÚSICA — Red Carpet and Music localize, Creators does not.

**Evidence.** Measured on production with document.documentElement.lang === "es": rail labels = ["DRAMA","HOT","[tubi logo]","ANIME","ESPAÑOL","BOLLYWOOD","REALITY","CREATORS","ALFOMBRA ROJA","MÚSICA"]. components/CategoryTabs.tsx:14-21 — TAB_KEYS maps only drama/new/popular/music/reality/red-carpet; anime, espanol, bollywood and creators fall through to the hard-coded English `tab.label` (CategoryTabs.tsx:50-53). lib/i18n.ts carries `tab.new` in all 20 locales for a tab removed in commit 2400f5c — 20 live cells for a dead tab, 0 cells for two live ones.

**Independent verification.** Reproduced against the deployed bundle and deployed catalogue data, not the source alone.

DEPLOYED DATA (production HTML noscript index, https://www.verzatv.com/): Espanol = 6 tiles, 5 live + 1 coming_soon. Bollywood = 10 tiles, 6 live + 4 coming_soon. Matches the finding's counts.

DEPLOYED LOGIC (/_next/static/immutable/chunks/1aseb4gggkekc.js, fetched from www.verzatv.com):
  let l="coming_soon"===e.status, a=A.has(v)            // A = Set{drama,espanol,bollywood}
  i = el && !l && (a ? r>=6 && r<9 : "popular"===v && r<3)   // trending
  render: i&&Badge{trending}, el&&!l&&a&&r<6&&Badge{new}, l&&Badge{soon}
  el = O.filter(live).length>=4;  order: if("popular"===v||e.length<=12) return playableFirst(e)
Both tabs are <=12 items, so they render live-first, unshuffled, one page.

EFFECT, derived deterministically from deployed code x deployed data:
- Espanol: indices 0-4 are the 5 live tiles, all < 6 -> NEW on 5 of 5 playable tiles. Trending window 6-8 has no tiles at all -> 0 Trending.
- Bollywood: indices 0-5 are the 6 live tiles, all < 6 -> NEW on 6 of 6 playable tiles. Trending window 6-8 lands only on coming_soon tiles, killed by !soon -> 0 Trending.
So every playable tile on

---

### S7-015 — Channels: "The Carpet" renders with no description and an empty icon because it has no CHANNEL_META entry.

*Raised by S7 — SECTIONS. The 10 browse tabs (Drama*

**Reproduction.** Open https://www.verzatv.com/channels. Three cards carry an icon and a paragraph; The Carpet has an empty circle and jumps straight from "2 shows" to its posters.

**Evidence.** app/channels/page.tsx:19-41 CHANNEL_META has keys VERZA Originals / StorageBlue / The Vertical Tea only; getChannels() returns ["VERZA Originals","The Carpet"], so The Carpet gets `meta === undefined` and both `{meta && <path d={meta.icon} />}` (:158) and the description block (:172-180) are skipped. Live HTML: "The Carpet|2 shows|Exes Premiere|Love Awards" with no description. Separately, the sort comparator at :111-117 is not a consistent total order.

**Independent verification.** Reproduced in the deployed bundle. Source: app/channels/page.tsx CHANNEL_META (lines 19-41) has only three keys - "VERZA Originals", "StorageBlue", "The Vertical Tea". Line 160 is `{meta && <path d={meta.icon} />}` and lines 180-187 gate the entire description <p> on `meta &&`. Real-data check: grep 'channel:' lib/catalog.ts returns 94 rows "VERZA Originals" and 2 rows "The Carpet" (exes-premiere, love-awards, both status:"live"), so getChannels() emits "The Carpet" and it resolves to meta === undefined. Live verification: curl https://www.verzatv.com/channels (HTTP 200, 105031 bytes). (1) ICON - the three metadata'd cards each render <svg ...><path d="M12 2l3.09..."/></svg>; The Carpet's card renders `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E0115F" stroke-width="2" ...></svg>` with zero children, i.e. a literally empty accent-tinted circle. (2) DESCRIPTION - stripped page text reads "...|The Carpet|2 shows|Exes Premiere|Love Awards|The Vertical Tea|...", jumping from the show count straight to the posters while every sibling card carries a paragraph. Counts corroborate the catalog: VERZA Originals renders "89 shows" + The Carpet "2 shows" = the 91 live

---

### S7-016 — Drama/Hot hero: the link target flips to the incoming title at the start of the 500ms crossfade, so a tap during the fade opens the poster you are still watching disappear.

*Raised by S7 — SECTIONS. The 10 browse tabs (Drama*

**Reproduction.** Open the home page and tap the hero poster within about half a second of a slide change. You land on the incoming title, not the one still at full opacity.

**Evidence.** components/BrowsePage.tsx:987 `<Link href={posterHref(current)}>` where `current = heroSlides[heroIdx]`; heroIdx advances on a 4000ms interval (BrowsePage.tsx:481) while `.hero-crossfade { transition: opacity 0.5s ease-in-out }` (app/globals.css:170-172) is still ramping the outgoing layer down. 500ms of every 4000ms is a wrong-target window.

**Independent verification.** Reproduced in the deployed production bundle, not just the source. Fetched https://www.verzatv.com/channels (HTTP 200, 105031 bytes) and parsed the four rendered channel cards. Icon <path> count and description presence per card: VERZA Originals = 1 path + description ("89 shows"); StorageBlue = 1 path + description ("Coming Soon"); The Carpet = 0 paths, NO description ("2 shows"); The Vertical Tea = 1 path + description ("Coming Soon"). The Carpet's icon <svg> ships with zero child elements — an empty accent-tinted circle — and its card text runs "The Carpet|2 shows|" straight into the Exes Premiere poster <img> with no paragraph between. Exactly as the repro states: three cards carry an icon and a paragraph, The Carpet has neither.

Mechanism verified against real data, not string matching. app/channels/page.tsx:19-41 CHANNEL_META has exactly three keys (VERZA Originals, StorageBlue, The Vertical Tea). lib/catalog.ts holds 2 rows with channel "The Carpet" (exes-premiere, love-awards) and 94 with "VERZA Originals"; getChannels() (lib/catalog.ts:1362) maps over status==="live" rows, so it returns ["VERZA Originals","The Carpet"], and "The Carpet" gets meta === undefined. Both the i

---

### S7-017 — "1 episodes" on the Music tab's only title.

*Raised by S7 — SECTIONS. The 10 browse tabs (Drama*

**Reproduction.** Open https://www.verzatv.com/series/too-much-junk.

**Evidence.** Live page text: "Too Much Junk | Music · Drama | 1 episodes | English audio". /channels does pluralize correctly on the same data (app/channels/page.tsx:170 `${series.length} ${series.length === 1 ? "show" : "shows"}`).

**Independent verification.** Reproduced against the deployed site, not the build. `curl https://www.verzatv.com/series/too-much-junk` (HTTP 200) returns the metadata row verbatim: `<span style="background:#E0115F;color:#F5F4F8">Music · Drama</span><span class="text-xs font-medium" style="color:#A0A0B0">1 episodes</span>`. Same string appears in the RSC flight payload on the same page, so it is the rendered node, not stray markup.

Assertion against real data, not string matching: `lib/catalog.ts:946-957` has `slug: "too-much-junk"`, `categories: ["music"]`, `episodeCount: 1`. Parsed all 96 catalog rows — `too-much-junk` is the ONLY row with `categories` containing "music" AND the only row in the whole catalog with `episodeCount === 1`. `components/BrowsePage.tsx:664` filters the Music tab by that category, so the raiser's framing ("the Music tab's only title") is accurate. `lib/mux-map.ts` has exactly one entry for the slug (`{ episode: 1, playbackId: "qBqc00XczuKuzZgxuYnhHmyVXyLm9HC8raqELT01ItzWg", duration: 187 }`), so the count of 1 is genuinely correct — only the plural noun is wrong. This is not the coming_soon/episodeCount-0 case (status is "live", and the coming_soon branch prints "Episodes announced so

---

### S7-018 — Dead `activeTab === "new"` branch ships in the production bundle for a tab that no longer exists.

*Raised by S7 — SECTIONS. The 10 browse tabs (Drama*

**Reproduction.** Read the ad-ribbon condition in the deployed chunk; then try /?tab=new — it is rejected and Drama renders.

**Evidence.** components/BrowsePage.tsx:1086 `(activeTab === "drama" || activeTab === "new" || activeTab === "popular")`; deployed chunk /_next/static/immutable/chunks/1aseb4gggkekc.js contains `("drama"===v||"new"===v||"popular"===v)`. BROWSE_TABS (lib/catalog.ts:20-41) has no "new" key and syncTabFromUrl (BrowsePage.tsx:418) only accepts keys present in BROWSE_TABS, so the branch is unreachable.

**Independent verification.** Reproduced on the deployed site. `curl https://www.verzatv.com/series/too-much-junk` returns 200 and the served HTML contains, in the metadata row under the genre chip: `<span ...>Music · Drama</span><span class="text-xs font-medium" style="color:#A0A0B0">1 episodes</span>`. The same literal is in the RSC flight payload (`"children":"1 episodes"`), so it renders on first paint, not just after hydration.

Source: app/series/[slug]/page.tsx:181 — `series.status === "coming_soon" ? "Episodes announced soon" : `${series.episodeCount} episodes`` — unconditional plural. The coming-soon branch was special-cased to avoid "0 episodes"; count-of-1 was not.

Blast radius verified against real data, not string matching: parsed all 91 MUX_MAP blocks in lib/mux-map.ts — too-much-junk is the ONLY series with a stream list of length 1. Every other live series has >=2; the 5 coming-soon rows take the "Episodes announced soon" branch. Since episodeCount is normalized from MUX_MAP.length at module load (lib/catalog.ts:1275-1277), no other row can hit this today. And `categories: ["music"]` appears exactly once in lib/catalog.ts (line 953), so the affected title is indeed the Music tab's only title — 

---

### S8-003 — Six legal and support surfaces describe VIP as a live product and tell viewers to use a Profile control that does not exist; VIP checkout is fail-closed in production.

*Raised by S8 — Legal, Trust, Footer. The 21 legal/ · **touches money or the shipped rail***

**Reproduction.** curl -X POST -H 'Content-Type: application/json' -d '{"plan":"monthly"}' https://www.verzatv.com/api/subscribe -> HTTP 400 {"error":"This VIP plan is not currently available"} (unauthenticated; the gate fires before auth). Then open https://www.verzatv.com/me and follow /help or /support: 'open Profile and choose Manage Subscription'. Profile renders a 'Subscription' section heading with nothing beneath it and no Manage Subscription control.

**Evidence.** Production probe returned 400 'This VIP plan is not currently available'. app/me/page.tsx:291-298 renders <SectionLabel>Subscription</SectionLabel> unconditionally, then <VipCard/>; components/VipCard.tsx:121 is `if (!isVip && (iosApp || !checkoutEnabled)) return null;` and checkoutEnabled comes from lib/vip-release-policy.ts:26-28, which is false. Production /me text reads '... $1.99 one-time Series Unlock / Subscription / Library ...' with the section empty. Unhedged claims: app/press/page.tsx:22 { label: "Monetization", value: "$1.99 one-time Series Unlock + VIP subscription" }; app/help/page.tsx:37; app/support/page.tsx:32 ('VIP renews automatically until cancelled'); app/refund-policy/p

**Independent verification.** CONFIRMED against production. Every asserted number reproduces exactly; severity S4 stands. Two scope corrections below.

WHAT I DID
1. Code: /Users/jothamhall/E! CREATOR ECONOMY/verza-tv/app/series/[slug]/page.tsx:57 reads `description: series.logline` with no clamp — the citation is precise. I did not trust source-side measurement, because getSeriesWithDetail (lib/catalog.ts:1343) spreads SERIES_DETAIL over the catalog row and could override logline, so I measured the rendered output instead. grep for any truncate/clamp/slice in the metadata path found nothing: the only clamp helpers in the repo are in lib/creator-intake.ts and lib/creator-client.ts, both unrelated.
2. Production: extracted all 96 slugs from lib/catalog.ts (91 live + 5 coming_soon — matches the manifest), fetched every /series/<slug> from www.verzatv.com, decoded HTML entities, and measured code points (not bytes).

WHAT I SAW
96/96 fetched, all HTTP 200, no redirects, none missing a description. min 57 (sisters-have-crush-on-the-same-man), max 211, median 104. Over 160: 15. Over 200: 2. The worst six came back exactly as claimed: salt-and-pepper 211, im-having-my-professors-baby-es 211, hidden-agenda 192, love-f

---

### S8-004 — /investors states four revenue lines as the current operating model; three of the four are fail-closed in production and have never taken a payment.

*Raised by S8 — Legal, Trust, Footer. The 21 legal/ · **touches money or the shipped rail***

**Reproduction.** Read https://www.verzatv.com/investors: 'a revenue model spanning one-time Series Unlocks, VIP subscriptions, merchandise, and creator partnerships' and 'One-time Series Unlocks provide title-specific access, VIP serves recurring viewers, merchandise covers physical goods, and creator partnerships can add supply. These are distinct revenue lines'. Then probe each: /api/subscribe -> 400 not available; /api/checkout -> 503; /api/creator/mux-webhook -> 404.

**Evidence.** lib/data/company.ts:114 (INVESTOR_OVERVIEW), :125, :140 (THESIS body). Production probes 2026-08-29: POST /api/subscribe -> 400 {"error":"This VIP plan is not currently available"}; POST /api/checkout -> 503 {"error":"Official merchandise checkout is temporarily unavailable."} (gate at app/api/checkout/route.ts:22-28, MERCH_CHECKOUT_ENABLED !== 'true'); POST /api/creator/mux-webhook -> 404. AGENTS.md rule 1 records creator ingestion as unavailable and rule 2 records merchandise Checkout and both VIP plans as disabled. Only the $1.99 Series Unlock is live, and per the audit brief no purchase has ever completed on the platform. The same merchandise claim is repeated to partners at lib/data/com

**Independent verification.** CONFIRMED on the mechanical core, severity corrected S3 -> S4, and the finding's stated consequence is WRONG and should be rewritten before anyone fixes it. The loading.tsx half should be dropped entirely.

WHAT I REPRODUCED (code)
1. find over the repo minus node_modules/.next for error.tsx|loading.tsx|global-error.tsx|template.tsx returns exactly ONE file: /Users/jothamhall/E! CREATOR ECONOMY/verza-tv/app/series/[slug]/[episode]/error.tsx. No app/error.tsx, no app/global-error.tsx, no loading.tsx anywhere in the repo.
2. grep -rn "ErrorBoundary|componentDidCatch|getDerivedStateFromError" over app/ components/ lib/ returns ZERO matches. There is no hand-rolled boundary standing in.
3. 96 show pages confirmed: lib/catalog.ts has 96 slug literals and 5 status:"coming_soon" rows (the-chairmans-revenge, protected-by-the-devil, the-last-will, the-billionaires-apron, i-cant-resist-my-mansion-gardener) = 91 live + 5. generateStaticParams filters to live only (app/series/[slug]/page.tsx:28-31).
4. Framework mechanism verified in node_modules/next/dist/client/components/error-boundary.js (next 16.3.0): ErrorBoundary is `if (errorComponent) { return <ErrorBoundaryHandler .../> } return chil

---

### S8-006 — The Google Play listing the footer links to on every page is rated 'Everyone', while every legal page on the site says the service is 18+ only and Apple rates the same bundle 17+ with frequent/intense sexual content.

*Raised by S8 — Legal, Trust, Footer. The 21 legal/ · **touches money or the shipped rail***

**Reproduction.** Tap 'Google Play — Android' in the footer of any page. The listing at play.google.com/store/apps/details?id=com.verzatv.app shows content rating 'Everyone'. Now read /terms §2 ('You must be at least 18 years old'), /privacy §6 ('Adults-Only Service ... We do not knowingly collect personal information from anyone under 18') and /support ('The Service is intended for adults age 18 and older'). There is no age gate anywhere on the site.

**Evidence.** Play HTML: <span itemprop="contentRating"><span>Everyone</span></span>, and JSON-LD "contentRating":"Everyone". iTunes lookup id=6752884623: contentAdvisoryRating '17+', advisories ['Infrequent/Mild Alcohol, Tobacco, or Drug Use or References','Frequent/Intense Mature/Suggestive Themes','Infrequent/Mild Realistic Violence','Frequent/Intense Profanity or Crude Humor','Frequent/Intense Sexual Content or Nudity','Frequent/Intense Horror/Fear Themes']. Site copy: app/terms/page.tsx §2, app/privacy/page.tsx §6, app/support/page.tsx intro, app/editorial-standards/page.tsx ('may include strong language, violence, sexual content, and mature themes'). Secondary mismatch: Apple 17+ still admits 17-yea

**Independent verification.** Reproduced in source and in the deployed DOM; severity corrected S3 -> S4 because the finding's central premise (that the show page is the front door) is false on production.

WHAT I DID / SAW — CODE: read /Users/jothamhall/E! CREATOR ECONOMY/verza-tv/app/series/[slug]/page.tsx in full (431 lines). The entire <main> payload is JsonLd, hero poster, title, genre pill, AudioLanguageBadge, logline, year/channel, description, cast, tags, FREE-preview pill, PlayNowLink -> episodeHref(series,1), the $1.99 unlock card (non-interactive text), and either EpisodeDropdown or the Anime-pattern empty state. No save control, no share control, and nothing on the page reads watch progress. components/PlayNowLink.tsx (80 lines) only prewarms the stream; the href is hard-coded to episode 1 with no ?t=. buildResumeUrl (lib/resume.ts:30) is called only from components/BrowsePage.tsx:628 and components/AccountLists.tsx:255 — never from the show page.

WHAT I DID / SAW — PRODUCTION (deployed DOM, not the build): curl'd four show pages and sliced to <main>...</main>. /series/the-pendleton-secret = 2 anchors (/1, /2) + 1 button + 0 role="button" = 3, matching the raiser's count exactly. /series/storage-pir

---

### S8-008 — Every footer tap target on the site is 18px tall — the five social icons are 18x18 with zero padding, the eight legal links are 18px tall with 6px between wrapped rows.

*Raised by S8 — Legal, Trust, Footer. The 21 legal/*

**Reproduction.** Open any page on a phone (or any viewport under 640px), scroll to the footer, and try to hit 'Terms of Service' or the TikTok icon with a thumb. Measured on the production DOM at /terms: social anchor computed padding '0px', bounding box 18x18, its label <span> computed display 'none'; legal anchor computed padding '0px', font-size 12px, line-height 18px, box 97x18; the wrapping container's computed row-gap is 6px.

**Evidence.** components/Footer.tsx:110-123 — the social <a> is `flex items-center gap-1.5` with an 18x18 SVG and `<span className="hidden sm:inline">{social.name}</span>`, so below the sm breakpoint the entire target is the raw icon. components/Footer.tsx:154-165 — legal links are bare <Link> with `fontSize: 12` and no padding, in a `flex flex-wrap justify-center gap-x-4 gap-y-1.5` container. Nothing in the footer except the two store buttons (119x47, 129x47) and the Sitemap pill (115x36) reaches a usable size; the 44x44 minimum is missed by 26px on the icons. This is on every page of a phone-first product.

**Independent verification.** CONFIRMED against production and code; severity S4 stands.

WHAT I DID
1. Code: /Users/jothamhall/E! CREATOR ECONOMY/verza-tv/lib/catalog.ts has ZERO `year:` fields (grep -c "year:" -> 0). `year?: number` is declared on the Series interface (catalog.ts:87) but is only ever populated by the SERIES_DETAIL merge in getSeriesWithDetail() (catalog.ts:1343-1354). lib/series-detail.ts has 80 keys against 96 catalog slugs; comm of the two sorted sets yields exactly 16 slugs with no detail entry. app/series/[slug]/page.tsx:207-217 wraps the row in {(series.year || series.channel) && ...} with the year span guarded by {series.year && ...}, so an undefined year renders the channel alone. The raiser's line citation (210) is accurate.
2. Production: fetched all 96 /series/<slug> pages from https://www.verzatv.com (96/96 HTTP 200) and parsed the `flex items-center gap-3 mb-3` row out of each.

WHAT I SAW (96 of 96 pages examined, 0 unparseable)
80 pages render [year, channel] — 76 with "2025", 4 with "2026" (sentence-of-passion-es, i-cheated-on-my-wedding-night-es, i-fell-in-love-with-my-presidential-brother-in-law-es, the-goat-mistress-es). 16 pages render the channel only. The 16 match the rai

---

### S8-014 — The Terms of Service contains no DMCA notice-and-takedown procedure, no designated agent and no repeat-infringer policy, for a service that both licenses third-party content and accepts creator uploads.

*Raised by S8 — Legal, Trust, Footer. The 21 legal/*

**Reproduction.** Read all 365 lines of app/terms/page.tsx / https://www.verzatv.com/terms — sections 1-11 cover acceptance, eligibility, accounts, purchases, content licensing, conduct, IP, disclaimers, governing law, changes and contact. None describes how a rights holder reports infringement. https://www.verzatv.com/dmca -> 404.

**Evidence.** 'DMCA' appears exactly once in app/, components/ and lib/: app/contact/page.tsx:34, as a bullet in the Legal card's description ('DMCA notices, licensing questions, terms of service inquiries, and other legal matters'). No counter-notice procedure, no designated-agent name/address, no repeat-infringer policy. The site operates a creator upload pipeline (components/creator/ApplicationWizard.tsx, creator_content in supabase/migrations/005_creator_pipeline.sql) and states at app/about/page.tsx:119 that content is 'produced by or licensed to VERZA TV'. Needs counsel to draft; flagged here because a safe-harbour gap sits on the trust surface this lane owns.

**Independent verification.** CONFIRMED — reproduced in code and in the deployed production HTML. Severity S4 is correct, unchanged.

WHAT I DID / SAW

Code. /Users/jothamhall/E! CREATOR ECONOMY/verza-tv/lib/seo/schema.ts:137 tvSeriesSchema() returns exactly: @context, @type, name, description, genre, numberOfEpisodes, inLanguage, url, image, productionCompany — plus two conditional spreads, contentRating (from show.rating) and datePublished (from show.year). There is no offers key on any code path and no potentialAction. Both call sites pass only slug/title/logline/genre/episodeCount/posterUrl, so even the two conditional keys never fire:
  /Users/jothamhall/E! CREATOR ECONOMY/verza-tv/app/series/[slug]/page.tsx:107
  /Users/jothamhall/E! CREATOR ECONOMY/verza-tv/app/series/[slug]/[episode]/page.tsx:156

Production (rule 4 — fetched the deployed pages, not the build). Parsed lib/catalog.ts for the real denominators: 96 slug rows = 86 paid (status live, coinPerEpisode>0, episodeCount>freeEpisodes) + 5 free-live + 5 coming-soon. Matches the finding's 86/96. Fetched all 96 https://www.verzatv.com/series/<slug> — 96/96 HTTP 200 — and JSON-parsed every application/ld+json block. Result: exactly ONE distinct TVSerie

---

### S8-016 — HideInIOSApp removes the App Store / Google Play buttons only after mount, so the iOS app paints a Google Play button in the footer of every page on first render.

*Raised by S8 — Legal, Trust, Footer. The 21 legal/ · **touches money or the shipped rail***

**Reproduction.** Load any verzatv.com page inside the iOS wrapper (or append ?platform=ios in a browser to simulate). The footer's 'Get the app / App Store iPhone & iPad / Google Play Android' block is present in the initial paint and disappears one commit later.

**Evidence.** components/HideInIOSApp.tsx — `const [hidden, setHidden] = useState(false); useEffect(() => { if (isIOSApp()) queueMicrotask(() => setHidden(true)); }, []);` with the comment 'Detection runs post-mount so server HTML stays identical for both.' components/StoreLinks.tsx wraps its whole body in it, and Footer renders <StoreLinks className="mb-6" /> on every page. AGENTS.md rule 11: 'The iOS binary excludes UGC, ads, affiliate placements, Stripe, and web purchase steering.' Secondary effect from lib/platform.ts:26-29: any iOS home-screen PWA sets navigator.standalone === true and is treated as the app, so those users never see either store link. Sizing the visible-flash duration needs the shipp

**Independent verification.** CONFIRMED in substance, but every measurement in the evidence is 3% low and one of the six named controls is not a defect at all.

WHAT I DID
1. Source: /Users/jothamhall/E! CREATOR ECONOMY/verza-tv/components/Header.tsx (LangDropdown + SearchButton both `w-9 h-9`), components/EpisodeDropdown.tsx (prev/next chevrons `w-10 h-10`, picker button `px-4 py-2.5`), app/series/[slug]/page.tsx (Play CTA `px-6 py-3 text-sm`, coming-soon "Browse VERZA" `px-5 py-2.5 text-xs`), components/BottomNav.tsx.
2. Deployed bundle, not the build: curl https://www.verzatv.com/series/storage-pirates — all five class strings present in the shipped HTML. Pulled the deployed stylesheet /_next/static/immutable/chunks/1y2muhl66_cr7.css and resolved the tokens: `--spacing:.25rem`, `--text-sm:.875rem` / lh `calc(1.25/.875)`=20px, `--text-xs:.75rem` / lh 16px, root font-size 16px (no html override). Arithmetic: w-9=36, w-10=40, Play CTA = 20 line box + 24 padding = 44, picker = 20 + 20 + 2 border = 42, Browse VERZA = 16 + 20 = 36.
3. Real browser against production: measured getBoundingClientRect on /series/a-love-once-betrayed, /series/storage-pirates and the coming-soon /series/the-chairmans-revenge.

THE MISRE

---

### S8-022 — /investors heads a section 'Traction & Highlights' and shows no traction — the two 'metrics' are the strings 'Studio + platform' and 'Multiple options'.

*Raised by S8 — Legal, Trust, Footer. The 21 legal/*

**Reproduction.** Open https://www.verzatv.com/investors and read the Traction & Highlights block. No users, revenue, watch time, retention or growth figure appears anywhere on the page.

**Evidence.** lib/data/company.ts:117-127 — INVESTOR_HIGHLIGHTS entries whose `metric` fields are 'Studio + platform' and 'Multiple options'. For calibration, the two public numbers that do exist are the Play listing's '100+' installs and the App Store's 3 ratings (iTunes lookup userRatingCount 3, averageUserRating 5).

**Independent verification.** REPRODUCED, both against real catalog data and against production. Severity corrected S3 -> S4.

WHAT I DID — CODE (real data, not string matching)
Built a harness in the scratchpad from the real /Users/jothamhall/E! CREATOR ECONOMY/verza-tv/lib/catalog.ts, lib/mux-public-map.ts, lib/search-index.ts and lib/text-fold.ts (imports rewritten, run under node 24 type-stripping) and executed the ACTUAL seriesMatchesQuery() / seriesSearchHaystack(), not a regex over the source file.

WHAT I SAW
- 96 catalog rows (91 live / 5 coming_soon). String fields present on rows: categories, channel, genre, logline, posterUrl, slug, status, title. 0 rows carry a Devanagari codepoint in ANY string field. 0 of the 76 curated SEARCH_TAGS entries. 0 of 96 BUILT HAYSTACKS. The index the matcher reads is empty of Devanagari — the finding's central claim holds against real data.
  (Minor: the finding lists "tags" as a scanned field; Series has no `tags` field at all. Harmless — seriesSearchHaystack spreads s.tags ?? [], always empty.)
- All 9 Devanagari queries returned 0 live matches through the real matcher: दिल, दोस्ती, दिल दोसा दोस्ती, प्यार, बॉलीवुड, रीसेट, हिन्दी, सॉल्ट, नमस्ते.
- Latin controls work

---

### S8-023 — The Google Play listing is published under 'Rare Media Group'; every legal page names VERZA TV LLC as the operator of the Service.

*Raised by S8 — Legal, Trust, Footer. The 21 legal/*

**Reproduction.** Tap 'Google Play — Android' in the footer. The developer row under the app name reads 'Rare Media Group'. Compare /terms §1 ('The Service is operated by VERZA TV LLC, 650 E Palisade Ave, Ste 2329, Englewood Cliffs, NJ 07632') and the App Store listing, whose seller is VERZA TV LLC.

**Evidence.** Play HTML: `<a href="/store/apps/dev?id=6806971900241837616"><span>Rare Media Group</span></a>` and JSON-LD `"author":{"@type":"Person","name":"Rare Media Group","url":"https://verzatv.com"}`. iTunes lookup id=6752884623: sellerName 'VERZA TV LLC', artistName 'VERZA TV LLC'. app/terms/page.tsx §1 and §11, app/privacy/page.tsx §6 and app/support/page.tsx footer all name VERZA TV LLC. A viewer checking who publishes the Android app sees a different company than the one the contract names.

**Independent verification.** REPRODUCED on live production, in the deployed bundle, and in source. Three independent checks.

1) DEPLOYED BUNDLE (not the build). Pulled the 14 JS chunks the live homepage loads from https://www.verzatv.com and grepped. The header search's zero-results branch is in chunks/3z23pxudvy0-6.js and reads verbatim:
  0===b.length&&jsx("div",{className:"px-4 py-10 text-center",children:jsxs("p",{className:"text-sm",style:{color:"#6B6B7B"},children:["No results for “",u.trim(),"”"]})})
One grey <p>. No icon, no second line, no action. The /discover bar is in the /discover chunk 3--x_pig694c6.js and is the same shape (bordered box, single "text-sm" <p>, color #6B6B7B). The house pattern's "Browse Drama" gradient button lives in a different chunk (1aseb4gggkekc.js) and is nowhere near either search surface.

2) LIVE BROWSER, 420px window. Opened https://www.verzatv.com, tapped the header magnifier, typed "anime". Panel renders: search bar + "Cancel", then a thin strip containing exactly one grey line — No results for "anime". Nothing else. Then clicked the ANIME tab on the same page: bordered card, clock icon, bold "Anime is coming soon", explanatory sentence, gradient "Browse Drama" butto

---
