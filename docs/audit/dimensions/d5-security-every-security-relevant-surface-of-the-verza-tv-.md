# D5 — Security. Every security-relevant surface of the Verza TV web app and its production deployment at https://www.verzatv.com: all 55 API route instances (48 handler files + 7 file routes), all 65 page routes (auth exposure), all 34 database tables (RLS + grants), all 12 SECURITY DEFINER functions, all 16 migrations, all 3 provider signature verifiers (Stripe / Mux / Apple), all 4 named pre-release security gates (negative-controlled), 235 deployed artifacts fetched from the live domain and scanned for secrets, all 4,913 catalog playback IDs classified and tested against Mux, both HTML-injection sinks, and both git remotes.

**Coverage: 5341 of 5341 items examined.** 14 findings raised.

## Gaps — items in scope this agent could not examine

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

---

# D5 — SECURITY. Full record.

**Target:** `/Users/jothamhall/E! CREATOR ECONOMY/verza-tv` and the live deployment at `https://www.verzatv.com`
**Date:** 2026-08-29 · **Manifest commit:** `83c29d1` · **Repo HEAD:** `147d0f9`
**Rule applied:** anything found in security is S1. Findings are therefore all S1 and are **ordered by real-world impact**, most severe first, so they can be triaged.

Nothing in the repository was modified. Three stray files my own `curl` calls dropped in the repo root (`body.txt`, `body2.txt`, `ep.xml`) were removed; `git status --porcelain` is clean of audit artifacts and `git diff` on every file I mutated *in an isolated copy* is empty.

---

## Coverage

| Class | In scope | Examined | How |
|---|---|---|---|
| API route instances | 55 | **55** | 48 handler files read in full; all 48 probed unauthenticated on production; 7 file routes fetched live |
| Page routes | 65 | **65** | 63 fetched live; admin gating traced to `app/admin/layout.tsx` |
| Database tables (RLS + grants) | 34 | **34** | every `create table` / `enable row level security` / `create policy` / `grant` / `revoke` in 16 migrations |
| `SECURITY DEFINER` functions | 12 | **12** | definition + `revoke`/`grant execute` grantee for each |
| Migrations | 16 | **16** | read in full or grepped for every security-relevant statement |
| Provider signature verifiers | 3 | **3** | Stripe, Mux, Apple — source + live negative probe |
| Pre-release security gates | 4 | **4** | run, then negative-controlled with 6 mutations |
| Deployed artifacts scanned for secrets | 235 | **235** | 45 JS chunks + 63 pages + 120 paid-episode HTML/RSC + 4 sitemaps + robots + llms + sitemap index |
| Catalog playback IDs classified & tested | 4,913 | **4,913** | full/public/signed set algebra + live Mux policy tests |
| HTML-injection sinks | 2 | **2** | `JsonLd.tsx`, `AskVerza.tsx` |
| Git remotes | 2 | **2** | one conclusively public, one inconclusive (gap 8) |
| **Total** | **5,341** | **5,341** | |

14 findings. Nine verification *depths* could not be reached — enumerated in the gaps section, each with what it needs.

---

## The two that matter most

### D5-001 — The entire paid catalog is free, from a public GitHub repo

`git remote -v` lists two remotes. `origin` is `Splash-Studio/verza-tv`. The second is `bigfilmsonly/https://github.com/bigfilmsonly-alt/verza-tv.git`, and:

```
full_name: bigfilmsonly-alt/verza-tv
private:   False
visibility: public
forks: 0   stargazers: 0   watchers: 0
```

`lib/mux-map.ts` is tracked in git (`git ls-files lib/mux-map.ts`) and is therefore served, unauthenticated, at `raw.githubusercontent.com` — **414,185 bytes, HTTP 200**. It contains 4,262 Mux playback IDs. Set algebra against the current catalog:

- **3,798 are currently PAID episodes** (present in `lib/mux-map.ts`, absent from `lib/mux-public-map.ts`)
- 464 are current free-preview IDs
- 0 are stale
- **75 distinct live series affected**

Every sampled paid ID streams:

```
0000fZokybPD0248... -> HTTP 200   0015oD6lNW3pqeep... -> HTTP 200
002mM1xtIC3bk501... -> HTTP 200   002tepxEbcXL6S00... -> HTTP 200
004gd3WWQ2YZ9FZj... -> HTTP 200
```

Followed all the way to bytes: master manifest → rendition → first segment → **HTTP 200, 355,232 bytes**, hexdump `0000 0a04 6d6f 6f66` (`moof` — a real fMP4 media fragment). Paid video, no token, no account, no payment.

`lib/mux-signed-map.ts` is *also* tracked, but that one is harmless: the signed IDs 403 without a signing key (proved below). It is the **public** paid IDs that are the capability.

Zero forks means making the repo private now would contain the leak *going forward* — but the IDs must be treated as burned, which forces D5-005.

### D5-002 — Web authentication points at a Supabase project that does not exist

The deployed bundle contains, in seven separate chunks:

```js
createBrowserClient("https://mmvbmrrwgludfmfalfcm.supabase.co","eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...")
```

The anon JWT decodes to `{"iss":"supabase","ref":"mmvbmrrwgludfmfalfcm","role":"anon"}`. That host does not exist:

```
dig @neil.ns.cloudflare.com mmvbmrrwgludfmfalfcm.supabase.co A
;; ->>HEADER<<- status: NXDOMAIN,  flags: qr aa rd
```

Authoritative (`aa`), and identical from 8.8.8.8, 1.1.1.1 and 9.9.9.9. Control: `gylklzdgjzhgmjidzwsy.supabase.co` resolves to 104.18.38.10, so project hosts do resolve here. From a real browser sitting on `https://www.verzatv.com`:

```js
fetch("https://mmvbmrrwgludfmfalfcm.supabase.co/auth/v1/health")
-> {"error":"TypeError: Failed to fetch"}
```

**But the server is fine.** An unauthenticated `POST /api/push/subscribe` — which writes through `getServiceClient()` and returns 500 on any DB error — returned `200 {"subscribed":true}`, and the cleanup `DELETE` returned `200 {"removed":true}`. So the service-role client is reaching a *live* database.

The two use different variables:

| Factory | Env var | Inlined at build? | State |
|---|---|---|---|
| `lib/supabase/server.ts:5` | `SUPABASE_URL` | no (runtime) | **live** |
| `lib/supabase/middleware.ts:8` | `NEXT_PUBLIC_SUPABASE_URL` | yes | **dead** |
| `lib/supabase/client.ts:4` | `NEXT_PUBLIC_SUPABASE_URL` | yes | **dead** |

Production env drifted: `SUPABASE_URL` was repointed at a new project; `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` were not.

Everything on the dead side: `app/actions/auth.ts` (`signInAction`, `signUpAction`, `updatePassword`, `signOutAction`), `lib/auth.ts:24-25` (the `getUser()` cookie branch), `components/OAuthButtons.tsx:52`, `app/reset-password/ResetPasswordClient.tsx:70`, `lib/checkout-auth.ts:13`, `lib/playback-client.ts:65` and `:241`.

Consequence chain: `getUser()` cookie branch always returns `null` on the web → `/api/access` returns `{full:false}` for every browser user → a paying customer is re-paywalled → `/api/unlock` returns 401 and no web purchase can even start. **This is a sufficient standalone explanation for the standing "NOBODY HAS EVER COMPLETED A PURCHASE" item.** Only the Bearer path (`getServiceClient().auth.getUser(token)`, `SUPABASE_URL`) works — which is the native app's path, so iOS may be unaffected (gap 7).

---

## D5-003 — Every pre-release security gate passes with the paywall deleted

Rule 3 says every test is negative-controlled. I built an isolated copy (`app/`, `components/`, `lib/`, `scripts/`, `supabase/`, `middleware.ts`, `vercel.json`, `next.config.ts`, `package.json`, symlinked `node_modules` and `public/`), confirmed a clean four-way baseline, then mutated one authorization decision at a time.

| Mutation | playback-security | feed-integrity | payments | mux-webhook |
|---|---|---|---|---|
| **M2** `if (!isFree && !isVip && !hasPurchased)` → `if (false)` | PASS | PASS | PASS | PASS |
| **M4** `/api/access` → always `{full:true}` | PASS | PASS | PASS | PASS |
| **M5** signed fail-closed → silent public fallback | PASS | PASS | PASS | PASS |
| **M6** `entitlements/check` → always `entitled:true` | PASS | PASS | PASS | PASS |
| *M1* `playbackId: mux.playbackId` (control) | **FAIL** | — | — | — |
| *M3* `Player.tsx` imports `mux-map` (control) | **FAIL** | — | — | — |

The controls prove the suites are not inert — M1 produced *"paid API must omit a separate playback ID"* and M3 produced *"legacy player must import the public map"* + *"runtime source imports complete paid-capability map"*. The suites assert on **data shape and import hygiene**; not one of them asserts that the authorization decision **exists**.

M5 is the sharpest. AGENTS.md rule 8 states signed playback "never falls back public", and `scripts/test-playback-security.mjs` is the named guardian of that contract. Replacing `lib/mux-playback.ts:118-123`'s `throw new MuxPlaybackConfigurationError(...)` with `return publicDelivery(publicId)` ships green.

This is *not* the old `process.exit`-above-the-checks bug — `scripts/test-playback-security.mjs:229-236` sets `process.exitCode` after all checks run. The gap is coverage.

---

## D5-004 — 3,461 paid master files on a public storage bucket

`scripts/out/placement.json` maps 4,146 Mux playback IDs to source files on a **third** Supabase project:

```
https://gylklzdgjzhgmjidzwsy.supabase.co/storage/v1/object/public/show-thumbnails/<uuid>/<uuid>.mp4
```

3,461 of those keys are current paid episodes, across 70 live series. `ID5JK01RWV1vb1t1x0201ZmnBpNHaBumFtQonVwrcDJ8jw` resolves to *the-billionaires-vow* episode 58. `HEAD` on its URL, no credentials:

```
HTTP/2 200 · content-type: video/mp4 · content-length: 239,959,125
access-control-allow-origin: * · cache-control: no-cache
```

A second (episode 60) returned 206,385,239 bytes. These are pre-transcode masters — better quality than the paid HLS renditions.

Bounding it honestly: the bucket cannot be enumerated (`POST /storage/v1/object/list/show-thumbnails` → `400 "headers must have required property 'authorization'"`), `scripts/out/` is gitignored, and `https://www.verzatv.com/scripts/out/placement.json` → 404. The project ref belongs to neither Verza project, so this is the content supplier's bucket and remediation runs through them.

---

## D5-005 — Signed playback is live and protects nothing

Verified against Mux directly:

| ID class | `stream.mux.com/<id>.m3u8` |
|---|---|
| signed-policy ID (`00007bfsR94H...`) | **403** — signed policy is genuinely applied |
| paid public ID (`0000fZokybPD...`) | **200**, 1,970-byte master |
| paid public ID (`0015oD6lNW3p...`) | **200**, 1,974-byte master |
| paid thumbnail `image.mux.com/<id>/thumbnail.jpg` | **200**, image/jpeg |
| free public ID | 200 (expected) |

The signed-playback migration was done correctly. It is neutralised by AGENTS.md rule 8's deliberate retention of the legacy public paid IDs for the 1.2 app. That decision rested on the IDs staying secret. D5-001 has already ended that. **D5-001 and D5-005 must be fixed together** — making the repo private is not sufficient; the 4,394 public playback policies have to go, gated behind the forced-update/drain plan.

---

## D5-006 … D5-014 — the rest

- **D5-006** `lib/supabase/server.ts` — the service-role factory — is the only privileged module in `lib/` missing `import "server-only"` (32 others have it). No client component imports it today (checked all 48 importers against every `"use client"` file), and Next would inline `undefined` rather than the key, so nothing leaks now. The sentinel is what makes that a build error instead of a silent failure, and it is absent exactly where it matters most. `lib/auth.ts` and `lib/vip.ts` are the same.
- **D5-007** `/api/push/subscribe` — POST has no null guard on `getUser()` (line 10-11) and upserts `user_id: user?.id ?? null` with `onConflict:"endpoint"` (line 57-66); DELETE has **no `getUser()` call at all** (line 80-110). Proved live: unauthenticated POST → `200 {"subscribed":true}`, unauthenticated DELETE → `200 {"removed":true}` (probe row cleaned up). Bounded by endpoint secrecy, but there is no authorization check whatsoever.
- **D5-008** CSP ships `script-src 'self' 'unsafe-inline' 'unsafe-eval' …`, which removes CSP as a containment layer. The rest of the policy is good (`object-src 'none'`, `base-uri 'self'`, `form-action 'self' https://checkout.stripe.com`, `worker-src 'self' blob:`) and all other headers are correct and live (HSTS preload, nosniff, XFO DENY, strict-origin-when-cross-origin, Permissions-Policy).
- **D5-009** Migration 016 lines 97-99 assert the 005 owner-update policy on `public.creators` "remains in force". Migration 011 line 41 dropped it. 016 lines 114-124 then re-grant column UPDATE to `authenticated` — inert only because no UPDATE policy exists. Restoring one on the belief that the column grant is the guard opens self-approval and, because `handle` is grantable, handle squatting. 016 is not yet applied; fix before it is.
- **D5-010** `/discover/[genre]` is the only dynamic route with no `notFound()` guard. `GET /discover/Buy-Cheap-Rolex` → 200, `<title>Buy-Cheap-Rolex Micro-Dramas | VERZA TV</title>`, `<meta name="robots" content="index, follow">`. All 14 other dynamic routes 404 correctly.
- **D5-011** `components/JsonLd.tsx:17` writes `JSON.stringify(data)` into a `<script>` with no `<` escaping, across 30 call sites. **Not exploitable today** — I probed both dynamic feeds: `/search?q=` never reaches `JsonLd` and is correctly React-escaped, and `/discover/[genre]` receives the still-percent-encoded segment (a literal `/` can never occur inside one path segment, so `</script` is unreachable). One-line fix, whole class removed.
- **D5-012** `/api/creator/upload:60-63` echoes the client `Origin` header into Mux's `cors_origin`. Confined to the caller's own upload; creator uploads are unreachable anyway (`/api/mux/webhook` → 503, `MUX_WEBHOOK_SECRET` absent).
- **D5-013** `lib/admin.ts` — the three-email admin allowlist — is public at `raw.githubusercontent.com`. The gate itself is implemented correctly (Bearer verified through `supabase.auth.getUser`, `requireAdminPage()` in the layout, live: `/admin/dashboard` → 307 → `/`, `/api/admin/creators` → 403). The defect is publishing the target list and having no second factor.
- **D5-014** `handle_new_user()` (008:56) is the one `SECURITY DEFINER` function without a `revoke ... from public`. Not exploitable (trigger-only), but 11 of 12 do it right.

---

## Verified clean — recorded so nobody repeats the work

**Secrets.** 235 deployed artifacts scanned: **zero** hits for `sk_live_`, `sk_test_`, `rk_live_`, `whsec_`, `sk-ant-`, `re_…`, `service_role`, `MUX_TOKEN_SECRET`, `MUX_SIGNING_KEY_SECRET`, `CRON_SECRET`, `BEGIN PRIVATE KEY`. Exactly one JWT is present and it is the anon key (`role:"anon"`) — by design. `.env*` is gitignored; the only tracked example file contains placeholders. The public repo's 690-file tree contains no env file; `docs/guides/ENV.md`, `DEPLOYMENT.md` and `README.md` leak no project ref or key.

**Capability projection holds at runtime.** Set algebra: 4,913 total IDs = 519 public + 4,394 withheld; the signed map is exactly 4,394 pairs, keys ⊆ withheld, **0 overlap with public**. Zero withheld and zero signed IDs appear in 45 JS chunks, 63 pages, **120 paid-episode HTML *and* RSC payloads** (30 series × 2 paid episodes), or the 4,913 URLs in `episodes.xml`. `lib/mux-private-map.ts` is imported by exactly one file — the playback route.

**Rate limiting is not spoofable.** `/api/ai-host` (5/min) with a fixed fake `X-Forwarded-For`: `200 200 200 200 200 429 429`. Switching to a *different* fake XFF: `429 429 429`. Vercel overwrites the header; the bucket keys on the real client IP.

**Money paths fail closed, live.** `/api/checkout` 503 · `coins/purchase` 501 · `coins/balance` 501 · `creator-unlock` 503 · `unlock/season-pass` 501 · `entitlements/claim` 410 · `studio/generate` 501 · `uploads` 501 · `mux/webhook` 503.

**Authenticated routes reject anonymous callers, live.** billing-portal / watch-progress / saved-list / account-delete / account-sync 401 · iap preflight + transactions 401 · creator upload/apply/analytics/channel/content/me 401 · admin creators + review 403 · admin stats 401 · push/send 401 · cron 401 · payments/capabilities 401 · entitlements 401 · entitlements POST 405.

**Webhook verification.** Stripe: unsigned → `400 "Missing stripe-signature"`; bogus signature → `400 "Invalid signature"`. Mux: `503 "Webhook verification unavailable"` (fail-closed, secret intentionally absent). Apple notifications: `400 "Invalid signedPayload"`; Apple transactions: `401` (Bearer required).

**RPC privilege.** All 12 `SECURITY DEFINER` functions use revoke-then-`grant execute … to service_role`. **No entitlement-granting RPC is callable by `anon` or `authenticated`.**

**The Stripe webhook is the strongest code in the repository.** Signature verify → durable `claim_stripe_webhook_event` with processed/acquired/busy → purchase uniqueness with `23505` reconciliation and field-by-field conflict checks → provider re-read before every grant → deletion-tombstone re-resolution immediately before access → refund/dispute reconciliation through definer RPCs → analytics failures that can never trigger a Stripe retry.

**No client-trusted ownership claims anywhere.** `/api/events` strips `revenue_cents`/`currency` and rejects server-only events. `/api/account/sync` touches only `watch_progress` and `saved_list` and clamps device timestamps to `now`. `/api/unlock/confirm` and `/api/subscribe/confirm` re-read the session from Stripe and require paid + slug + type + userId + customerId + canonical financials + terms consent + unrefunded before granting.

**Other.** Open-redirect guards correct on all four `next` parameters. Cron uses `timingSafeEqual` with a length pre-check and 16-char minimum. Password reset is enumeration-safe (uniform redirect + `after()` deferral closes the timing channel). No `eval`, `new Function`, or `.innerHTML=` anywhere. No reflected XSS on `/search`. `/admin/*` gated by layout. Apple verification does full root-cert chain validation with bundle `com.verzatv.app` / app id `6752884623`, plus non-consumable, quantity, ownership-type, transaction-reason, environment and sandbox-allowlist checks.

---

## Fix order

1. **D5-001** — make `bigfilmsonly-alt/verza-tv` private today. Zero forks, so this contains it going forward. Treat the 3,798 IDs as burned.
2. **D5-005** — the IDs being burned forces the public-policy retirement. Schedule the forced-update/drain gate AGENTS.md rule 8 defers; until it lands the paywall is decorative for anyone holding the file.
3. **D5-002** — repoint `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` at the live project and redeploy. One env change plus a build. Until it lands, no web customer can sign in, be recognised, or buy.
4. **D5-003** — add one assertion per authorization decision, then re-run all six mutations. Any new check must name the defect it prevents.
5. **D5-004** — supplier action: make `show-thumbnails` private, serve through signed URLs.
6. **D5-006 / D5-007 / D5-011** — three small, contained patches.
7. **D5-008 / D5-009 / D5-010 / D5-012 / D5-013 / D5-014** — hardening.