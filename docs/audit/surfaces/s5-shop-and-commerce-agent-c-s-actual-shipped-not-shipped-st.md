# S5 — Shop and commerce. Agent C's actual shipped/not-shipped status; merch shop and prices; cart scope; every checkout entry point; the $1.99 unlock on show pages; the paywall slide's purchase path and its five fixes; the Amazon pill and affiliate bag; VIP. Denominator: 60 commerce interactive controls, 30 commerce route instances (14 page + 16 API), 96 catalog rows resolved against their unlock card, 22 product records (12 Amazon + 10 merch), 18 commerce external links, 440 commerce i18n cells (22 keys x 20 locales), 86 Apple product pairs = 752 items.

**Coverage: 752 of 752 items examined.** 23 findings raised.

## Gaps — items in scope this agent could not examine

Everything in the S5 denominator was examined, but seven classes of state could not be REACHED and are reported as gaps rather than counted as verified behaviour.

1. NO PURCHASE WAS COMPLETED, and none can be from this seat. Every authenticated-and-owning state downstream of a real card is unverified by definition: the populated purchase-history list, the granted-entitlement playback path, the post-Stripe ?session_id= return, the confirmation email actually rendering, the webhook's series_unlock branch running against a real event, and the refund/dispute handlers. What it needs: one controlled $1.99 live purchase with the Stripe dashboard and the Supabase entitlements/purchases tables read back, plus a screenshot of the received email (which is where S5-002 becomes visible).

2. Authenticated latency of /api/unlock/confirm — the number S5-009's 6s deadline is racing. Unauthenticated it short-circuits at 0.29-0.49s; the real path adds a Stripe session retrieve, a paymentIntent retrieve with charge expansion, and two Supabase writes, possibly on a cold isolate. What it needs: one timed authenticated call, or a p95 from Vercel function logs.

3. Apple StoreKit end to end. The 86 slug/product pairs reconcile 1:1 with the 86 paid rows with no duplicates and no orphans, and all three /api/iap/apple/* routes fail closed correctly to unauthenticated probes (401/401/400). But no signed transaction, no Sandbox purchase, no restore, and no V2 notification was exercised. What it needs: a Sandbox account on the TestFlight build plus the ASC notification history.

4. Whether the native iOS binary routes to these web pages. S5-007 (affiliate ads surviving reader mode) is a defect in this repo either way, but its severity depends on whether the App Store binary renders /shop and /amazon. The native client lives in ../verza-native, which is not present here. What it needs: a grep of the native repo's route table and WebView allowlist.

5. Merch checkout behaviour when enabled. MERCH_CHECKOUT_ENABLED is not true in production and I did not change any environment. S5-008 is read from source, so the missing-webhook-branch consequence is asserted from code, not observed. What it needs: a preview deployment with the flag on and a Stripe test-mode purchase — never production.

6. A true 320px viewport. Chrome clamped this machine's window to 606px inner width; the 320px measurements in S5-019 were taken by constraining the shop section's own container, which reproduces the layout but not media queries or safe-area insets. What it needs: a real 320px device or a DevTools device-emulation session.

7. Stripe dashboard state. The 19-event allowlist, the single enabled endpoint, the zero tax registrations, and the billing-portal configuration are all asserted from source and from the fail-closed behaviour of the deployed routes. No Stripe credentials were used and nothing was mutated. What it needs: npm run test:payments:stripe-config with live keys, by whoever holds them.

Also worth flagging for whoever consolidates: the Amazon storefront button on /amazon says "Visit the full VERZA TV Amazon storefront" but node=53629917011 fetches back as a generic "Amazon.com: : All Departments" browse page with no product tiles and no Verza branding in the HTML. Amazon renders storefronts client-side, so this may be a false negative from a headless fetch — I did not open it in a real browser session and am not claiming it is broken. One human tap settles it.

---

# S5 — Shop and Commerce

**Audited 2026-08-29 against commit `147d0f9` and the live deployment at https://www.verzatv.com.**
Read-only. No application code was written and no live Stripe, Supabase, Mux, Vercel or App Store state was mutated.

---

## Coverage

| Class | In scope | Examined | Method |
|---|---|---|---|
| Commerce interactive controls | 60 | 60 | 30 exercised in the deployed bundle; 30 code-read with unreachability proven |
| Commerce route instances (14 page + 16 API) | 30 | 30 | all probed against production |
| Catalog rows × unlock-card correctness | 96 | 96 | all 96 show pages fetched from production |
| Product records (12 Amazon + 10 merch) | 22 | 22 | Amazon URLs and images crawled; merch code-read, routes probed |
| Commerce external links | 18 | 18 | crawled |
| Commerce i18n cells (22 keys × 20 locales) | 440 | 440 | loaded and token-checked |
| Apple product pairs | 86 | 86 | reconciled against the paid catalog |
| **Total** | **752** | **752** | |

23 findings: **1 S1**, **9 S2**, **7 S3**, **6 S4**.

The 60 controls break down as: 57 from the manifest across the twelve commerce component files, plus the paywall's CTA and Go Back in `components/EpisodeFeed.tsx`, plus the show-page unlock card. Thirty could not be exercised because they are unreachable in production — the 19 merch cart controls (`AddToCartButton` 6, `CartDrawer` 11, `CartButton` 2) sit behind a disabled flag, `VipCard`'s 9 behind a disabled release gate, and `CoinPaywall`'s 2 behind no importer at all. Unreachability was proven for each rather than assumed.

---

## Agent C's actual status — established from code and the deployed bundle

The brief asked for this first, and told me not to trust prior reports. Here is what I found by reading the tree and fetching production, item by item from the known-open list.

| Item | Claimed open | Actual status |
|---|---|---|
| **$1.99 buy path** | unverified | **SHIPPED, in one place only.** The in-feed paywall's CTA posts to `/api/unlock`, which is fully server-authoritative. The show-page card is display-only — see S5-003. |
| **Guest-purchase attachment** | unverified | **DOES NOT EXIST.** `claim_pending_entitlements` is defined in migration 010 and called by nothing; nothing writes `pending_entitlements`; `/api/unlock` returns 401 without a session. See S5-005. |
| **Restore purchases** | unverified | **DOES NOT EXIST on the web**, and is promised to customers six times on `/support` plus `/help`, `/refund-policy` and `/privacy`. See S5-006. |
| **Five paywall fixes** | unverified | **ALL FIVE HOLD IN THE DEPLOYED BUNDLE.** Measured, not inferred — see the verification table below. |
| **Amazon pill** | unverified | **SHIPPED and works end to end**, including persistence and the real Amazon cart handoff. It also floats over the paywall's Go Back — see S5-011. |
| **Shop pricing** | unverified | **MOOT.** Merch is disabled in production; `/shop` renders the Amazon section only and all ten `/shop/<slug>` routes 404. The six unconfirmed prices are unreachable — but `priceConfirmed` is read by nothing, so the flag protects nothing if merch is ever enabled. See S5-008. |
| **VIP** | unverified | **NOT SELLABLE.** `/api/subscribe` returns 503 for both plans and `VipCard` returns null. The hard-coded Stripe TEST portal URL that project memory still lists as a known bug is **gone** — `handleBillingPortal` now posts to `/api/billing-portal`. |
| **Nobody has ever completed a purchase** | asserted | **Still true, and I did not change that.** Everything downstream of a real card is a gap, not a verification. |

### The five paywall fixes — measured in production

Fetched `https://www.verzatv.com/series/the-mistress-trap/6` as a guest and read the live DOM:

| Fix | Evidence |
|---|---|
| Go Back visible unconditionally | computed `opacity: 1`, `visibility: visible`, `display: block`, 241×50 |
| Go Back is a real anchor, not a hydration-dependent button | `tagName: "A"`, `href="/"` |
| Go Back of equal weight | CTA 241×53 at `font-weight: 700` / 16px; Go Back 241×50 at `font-weight: 700` / 15px |
| Price is localized, not a literal | `formatPrice(SERIES_UNLOCK_PRICE_CENTS)` at `components/EpisodeFeed.tsx:2559`; renders `$1.99` in English, byte-identical to the literal it replaced |
| Checkout errors carry translated copy | `CHECKOUT_ERROR_KEYS` at `:44-56` maps eleven server codes to keys; all eleven exist in all twenty locales |

**The do-not-regress assets are intact.** Verified in the same pass: Stripe is named (`"Secure checkout via Stripe"`), "one-time" appears twice, the price is the largest element on the screen, there is no countdown, no fake discount, no strikethrough, and `document.querySelectorAll('input')` returns an empty list — nothing is pre-ticked.

---

## Money-path integrity — what is genuinely solid

Worth recording, because most of it is right and a consolidator should not go looking for problems here.

**`/api/unlock`** (`app/api/unlock/route.ts`) requires an authenticated session, refuses a series the account already owns, refuses a non-purchasable row, refuses an account with `deletion_requested_at`, blocks on a prior checkout in payment review, and recovers a prior paid-but-unfulfilled session only after re-validating mode, customer, owner, series, terms consent and refund state. The price comes from the server constant; the client never sends an amount. Idempotency key includes user, slug, price, episode count, customer, tax mode and terms version.

**`/api/unlock/confirm`** re-derives everything: paid status, `metadata.type`, slug match, `metadata.userId` **and** `client_reference_id`, the Stripe customer against the profile row, canonical financials against `SERIES_UNLOCK_PRICE_CENTS`, terms consent, and the charge's undisputed/unrefunded state — before writing a purchase and granting an entitlement. The old blind `?unlocked=true` param is gone and the replacement is genuinely server-verified.

**`/api/stripe/webhook`** rejects an unsigned POST with 400 (confirmed live), verifies the signature, claims each event through `claim_stripe_webhook_event`, and returns `duplicate: true` for an already-processed id. The claim RPC correctly re-acquires a `failed` row and a `processing` row older than ten minutes, so a transient failure does not strand fulfillment. `lib/stripe-webhook-events.ts` holds exactly nineteen events. Fulfillment re-resolves the payment account immediately before granting access, withholds access for refunded/disputed purchases, and withholds access for a row that stopped being purchasable between payment and delivery.

**Fail-closed endpoints, all confirmed against production:**

```
POST /api/coins/purchase        → 501 {"error":"Not available"}
POST /api/unlock/season-pass    → 501 {"error":"Coin season passes are not available"}
POST /api/creator-unlock        → 503 {"error":"Creator purchases are temporarily unavailable"}
POST /api/checkout              → 503 {"error":"Official merchandise checkout is temporarily unavailable."}
POST /api/subscribe {monthly}   → 503 {"error":"This VIP plan is not currently available"}
POST /api/billing-portal        → 401 {"error":"Not signed in"}
GET  /api/payments/capabilities → 401 {"error":"Unauthorized"}
GET  /api/entitlements          → 401 {"error":"Authentication required"}
POST /api/iap/apple/preflight   → 401 (and 401 again with a garbage Bearer)
POST /api/iap/apple/transactions→ 401
POST /api/iap/apple/notifications→ 400 {"error":"Invalid signedPayload"}
GET  /api/checkout/native-return→ 400 with no params, 400 on kind=evil, 200 on the allowlisted pair
```

**Apple product identity: 86 of 86 reconcile 1:1** with the 86 paid catalog rows. No duplicate slugs, no duplicate product ids, no paid row without a product, no product without a paid row.

**Commerce localization: 440 of 440 cells present** — 11 checkout error keys and 11 paywall keys across all 20 locales, every interpolation token (`{title}`, `{count}`, `{price}`) intact in every one.

**Both offline gates are green.** `npm run test:payments` passes all seven suites; `npm run test:feed-integrity` passes, walking 4,913 episodes across 91 live series. `scripts/test-feed-integrity.mjs` has exactly one `process.exit`, at line 2373 after every check — the reporter-below-exit bug is genuinely fixed.

---

## Catalog resolution — 96 of 96

Every show page fetched from production and checked for the unlock card:

| Class | Rows | HTTP | Unlock card | Price shown | "Coming Soon" |
|---|---|---|---|---|---|
| live, paid | 86 | 200 | yes | yes | no |
| live, wholly free | 5 | 200 | no | no | no |
| coming_soon | 5 | 200 | no | no | yes |

The five wholly-free rows are `the-dumb-billionaire-heiress-in-love` (50/50), `storage-pirates` (13/13), `too-much-junk` (1/1), `exes-premiere` (12/12), `love-awards` (13/13). The five coming-soon rows all have `episodeCount: 0` and correctly show no price. All 86 paid rows have `freeEpisodes: 5` — there is no clamping in the catalog, so the "2 clamped titles" question from the known-open list does not arise from catalog data.

The gating is exactly right. Only the control is missing (S5-003).

---

## Shop and affiliate — exercised live

The merch shop is off. `/shop` renders "Sponsored picks from Amazon" with no product grid and no cart button; all ten `/shop/<slug>` routes 404; the sitemap lists only `/shop` and `/amazon`, so no dead link points at them.

The Amazon bag was driven end to end on production:

1. Tap a tile → modal opens with the product photo, the ad label, "Not personalized", and the disclosure "Price shown on Amazon. Checkout completes on Amazon."
2. Tap "Add to bag" → drawer opens, `localStorage["verza-amazon-bag"]` = `[{"id":"amzn-medicube-pore-pads","quantity":1}]`
3. Drawer offers remove, quantity ±, clear, keep shopping
4. "Send 1 item to Amazon cart" → `www.amazon.com/gp/aws/cart/add.html?AssociateTag=verzatv-20&ASIN.1=B09V7Z4TJG&Quantity.1=1`, `rel="noopener noreferrer sponsored"`, `target="_blank"`
5. Close drawer → the "1 in bag" pill appears, `aria-label="Open your Amazon bag, 1 item"`
6. `/amazon?p=amzn-watersy-tumbler` opens the right product modal

All 12 affiliate URLs return 200 and resolve to their real listings with matching product titles; all 36 cutout images (12 products × 3 widths) are served from production as `image/webp`. All 12 products carry an ASIN, so all 12 are cartable. Both app-store links resolve (`apps.apple.com/app/id6752884623` → the real listing; Play → VerzaTV). Both Apple support links resolve. No price is displayed on any Amazon surface, which is correct under the Associates agreement.

I cleared the bag and the platform flag from the test browser afterwards.

---

## Stale facts corrected

Rule 5 said to assume roughly a quarter of inherited facts are wrong. Five were:

- **`VipCard.tsx:109` Stripe TEST portal URL** (project memory, listed as a known bug) — **fixed and gone.** `components/VipCard.tsx:95` posts to `/api/billing-portal`, whose docblock at `app/api/billing-portal/route.ts:19` explicitly says it "replaces a hard-coded TEST-mode portal link that shipped in VipCard". The route validates customer ownership, live-mode, and the portal configuration before returning a URL.
- **"Revenue (all LIVE via Stripe): VIP $9.99/mo or $79.99/yr; Merch 10 products $15-$110"** (project memory) — **both are disabled in production.** Only the $1.99 Series Unlock is sellable.
- **"`test:feed-integrity` is red right now"** (`docs/remediation/handoffs.md:330`) — **it passes.**
- **`docs/audit/00-manifest.md:28` "96 rows: 1 live, 0 coming soon"** — **wrong**, and it is the coverage denominator everyone is working from (S5-023).
- **`lib/price.ts:9-14`** claiming it replaced the `$1.99` literal in `app/series/[slug]/page.tsx` — **it did not** (S5-015).

---

## Findings

Full detail, repro steps and evidence for each of the 23 findings are in the structured findings list. Ranked:

**S1** — S5-001: `?platform=ios` permanently kills every purchase surface in a browser, irreversibly, and the same branch catches every iOS home-screen PWA install.

**S2** — S5-002 receipt names the wrong show (30/86, 8 badly); S5-003 the show-page price card is inert on all 86 paid pages; S5-004 the signed-out buy path dead-ends at a context-free sign-in whose "Continue as Guest" throws away `next`; S5-005 guest purchase does not exist and the claim RPC has no caller; S5-006 "Restore Purchases" is promised four places and exists nowhere; S5-007 affiliate ads survive iOS reader mode; S5-008 merch is one env var from charging cards the webhook cannot fulfill; S5-009 the 6s deadline's aborted signal kills both entitlement fallbacks; S5-010 any `/api/access` error reads as "not entitled" and paywalls an owner.

**S3** — S5-011 the ad pill covers the paywall's Go Back; S5-012 `/me` shows an empty "SUBSCRIPTION" header; S5-013 `/press` sells VIP that `/llms.txt` and the API both say is unavailable; S5-014 the payment gate's PASS line says 74 SKUs while asserting 86; S5-015 the show-page price literal has no gate; S5-016 three payment endpoints share one rate-limit bucket; S5-023 the manifest's catalog counters are wrong.

**S4** — S5-017 three dead components with live-looking $1.99 UI; S5-018 an orphaned deep link with three false comments; S5-019 the ad disclosure overflows its box at 320px; S5-020 the merch success URL confirms nothing; S5-021 "one tap" is an Amazon sign-in wall for signed-out shoppers; S5-022 the bag pill is a 40px tap target.

---

## The one thing to fix first

S5-001 is the only S1 and it is cheap. A single shared link containing `?platform=ios` — a marketing URL, a QR code, a support reply, anything that echoes query parameters — permanently converts a paying web customer into someone who is told, falsely, that the episode "isn't available in this app", with no route back. Every iPhone user who adds the site to their home screen lands in the same state without anyone sending them anything. The fix is a `?platform=web` reset plus dropping the `navigator.standalone` branch, which never identified the App Store binary in the first place.

After that, S5-002 is one line and it is the difference between a first customer's receipt naming what they bought and naming a different show.
