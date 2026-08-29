# S8 — Legal, Trust, Footer. The 21 legal/trust/footer routes (/terms, /privacy, /refund-policy, /legal/creator-agreement, /newsroom, /about, /contact, /press, /help, /support, /editorial-standards, /company, /careers, /investors, /leadership, /partnerships, /media-kit, /brand-assets, /founder, /sitemap, /studio), the site-wide footer (components/Footer.tsx, FooterSitemap.tsx, StoreLinks.tsx), every link reachable from those surfaces (276 internal + 9 user-facing external + 11 mailto), both App Store / Google Play listings verified against live store records, and every product claim made in that copy checked against production behaviour.

**Coverage: 372 of 372 items examined.** 23 findings raised.

## Gaps — items in scope this agent could not examine

Six items I could not close, and what each needs.

1. MAILBOX DELIVERABILITY — 8 of 11 mailto targets. verzatv.com has live MX (mx1/2/3-usg2.ppe-hosted.com + verzatv-com.mail.protection.outlook.com, SPF `v=spf1 include:_spf-usg2.ppe-hosted.com include:secureserver.net include:sendgrid.net -all`), so the domain accepts mail. Whether support@, press@, legal@, feedback@, privacy@, partnerships@, investors@ and careers@ are monitored mailboxes rather than dead aliases is unverified — I did not send mail or run an SMTP RCPT probe against a production server. NEEDS: someone with mailbox access to confirm each of the eight resolves to a monitored inbox, or one test message per address. This matters most for support@ (the only refund route), privacy@ (the only CCPA/GDPR route) and legal@ (the only DMCA route).

2. iOS BINARY BEHAVIOUR — S8-016. I verified the source mechanism (HideInIOSApp hides post-mount) but could not measure the visible flash duration in the shipped app, or confirm whether the native client renders this web footer at all. NEEDS: the ../verza-native client or a device running the App Store build, loading a legal page and recording first paint.

3. LEGAL SUFFICIENCY — S8-009 and S8-014. I can show that a consent mechanism, a "Do Not Sell or Share" link, GPC handling, a DMCA procedure and a designated agent are all absent from the product, and that the Privacy Policy promises rights those absences undercut. Whether that crosses the line into a GDPR/ePrivacy/CPRA/DMCA violation, and what the remedy must be, is a question for privacy and IP counsel, not this audit.

4. PLAY STORE RATING PROVENANCE — S8-006. I read the US/en listing only. Whether the "Everyone" rating reflects a stale content questionnaire, a pending resubmission, or a different app configuration is not visible from outside. NEEDS: Play Console access to read the current content-rating questionnaire and submission history. Also note the Play listing's last update is Dec 28, 2025 while the iOS build is v2.0.0 (Aug 11, 2026) — the Android binary predates the payment cutover, which no page discloses.

5. CORPORATE FACTS — unverifiable from here. "Filmology Labs, Paterson, New Jersey" (asserted on /about, /press, /company, /founder, /investors), "Alan Mruvka, co-founder of E! Entertainment Television" (asserted on 7 pages), and the VERZA TV LLC registration at 650 E Palisade Ave, Ste 2329, Englewood Cliffs NJ. NEEDS: the company to confirm these are contractually and factually supportable; the E! co-founder claim in particular is load-bearing across the whole trust section.

6. TRUE 320px VIEWPORT — S8-008. Chrome's minimum window width prevented a genuine 320px CSS viewport; measurements were taken at 620px, which is already below the sm (640px) breakpoint that hides the social labels. The offending targets have computed `padding: 0px` and fixed 18px intrinsic height, so they do not grow at 320px, but the wrap behaviour of the 8-link legal row at 320px was not observed directly. NEEDS: a real device or a devtools device-mode pass.

DENOMINATOR NOTE for the parent: docs/audit/00-manifest.json under-counts interactive elements on this lane. Its `interactive.items` lists 53 entries across S8 files but zero for components/StoreLinks.tsx, app/about/page.tsx, app/press/page.tsx, app/help/page.tsx and app/founder/page.tsx — all of which do render links (StoreLinks' anchor is inside a .map(), which the scanner appears to miss). I audited the real rendered set from production HTML rather than the manifest list, so my coverage is a superset, but the manifest's 535 figure is an undercount.

---

# S8 — Legal, Trust, Footer

**Audited:** 2026-08-29 against `https://www.verzatv.com` (live) and working tree at `147d0f9`.
**Method:** production fetch + crawl of every reachable link, live-DOM measurement in Chrome, production API probes, and source reading for provenance. Every claim below was checked against observed behaviour, not against the code that was supposed to produce it.

## Coverage

| Class | In scope | Examined | Notes |
|---|---:|---:|---|
| Legal / trust / footer routes | 21 | 21 | all return 200 |
| Manifest interactive elements in S8 files | 53 | 53 | manifest undercounts — see Gaps |
| Distinct internal link targets reachable from those pages | 276 | 276 | **276/276 return 200, 0 redirects, 0 404s** |
| Distinct user-facing external links | 9 | 9 | crawled with positive + negative controls |
| `mailto:` targets | 11 | 11 | as links; 8 mailboxes unverified for delivery |
| Store listings verified against live store records | 2 | 2 | Apple + Google |
| **Total** | **372** | **372** | |

Plus one systematic localization check across all 21 pages × 20 locales, run as a live effect test.

**23 findings: 7 × S2, 9 × S3, 7 × S4. No S1.**

---

## The 21 routes

All 21 return HTTP 200 from production. Byte sizes and robots directives recorded; `/legal/creator-agreement` is the only one serving `noindex, nofollow` (correct — it is a draft).

`/terms` `/privacy` `/refund-policy` `/legal/creator-agreement` `/newsroom` `/about` `/contact` `/press` `/help` `/support` `/editorial-standards` `/company` `/careers` `/investors` `/leadership` `/partnerships` `/media-kit` `/brand-assets` `/founder` `/sitemap` `/studio`

## Link crawl

**Internal — 276/276 pass.** Extracted every `href` from the 21 production pages, stripped `_next` assets, crawled each with a no-follow pass and a follow pass. Every one returned `200|200|redirects=0`. This includes all 91 live `/series/<slug>` links surfaced by the footer sitemap sheet, all 71 `/watch-in/*`, all 28 `/genres/*`, and every footer and sitemap-section destination. No 404, no redirect chain, no homepage standing in for a deep link.

**External — 8/9 pass, 1 fails.** All checked with controls, because several of these hosts return 200 for handles that do not exist.

| Link | Result | Control |
|---|---|---|
| `apps.apple.com/app/id6752884623` | 301 → `/us/app/verza-tv-vertical-drama/id6752884623` → 200 | iTunes lookup confirms live |
| `play.google.com/…?id=com.verzatv.app` | 200, `itemprop="name"` → VerzaTV | nonsense id → 404 |
| `instagram.com/verzatv` | 200, og:title `VERZATV (@verzatv)`, 5,719 followers | nonsense handle → generic `<title>Instagram</title>` |
| `tiktok.com/@verzatv` | 200, `uniqueId:"verzatv"`, 384 followers, 106 videos | nonsense handle → `statusCode:10221`, no uniqueId |
| `x.com/VerzaTV` | 200 (bot UA) | nonsense handle → 404 |
| `facebook.com/VerzaTV` | 200, `<title>Verza TV</title>` | nonsense handle → generic `<title>Facebook</title>` |
| `support.apple.com/billing` | 200 | — |
| `reportaproblem.apple.com/` | 200 via Apple ID sign-in | expected |
| **`youtube.com/@VerzaTV`** | **404** | `@netflix` → 200 · **S8-001** |

A note on method: my first pass flagged TikTok as broken because the page contains the string "Couldn't find this account." The positive control (`@netflix`) contains the same string twice — it is boilerplate in TikTok's JS bundle. String matching would have produced a false finding; the `uniqueId`/`statusCode` assertion produced the true one.

---

## S2 findings

### S8-001 — Footer YouTube link 404s on every page

`components/Footer.tsx:38` and `lib/data/sitemap.ts:224` → `https://www.youtube.com/@VerzaTV` → **404**. Every casing 404s. YouTube's own search for "verzatv" returns `@VerzaTVOfficial`, which returns 200. The site asserts a YouTube presence at a dead address, on every page.

### S8-002 — /brand-assets promises eight files and delivers none

Four asset cards (Primary logo, Logo on light, App icon, Social avatar), each with an accent-coloured pill reading **"SVG · PNG"**. `app/brand-assets/page.tsx:130-141` renders that pill as a `<span>` — no href, no handler, no download. Parsing the production HTML, no anchor on the page matches svg/png/download. The intro (`:99-104`) redirects the reader to `/media-kit` "for packaged downloads"; that page's `<main>` contains exactly two anchors — `mailto:press@verzatv.com` and `/press` — and no file of any kind. `/newsroom` repeats the promise with a link labelled "Media kit & downloadable assets".

A journalist or partner cannot obtain the logo. This is the cleanest violation of both "nothing tappable and inert" and "no surface promises something that does not exist" in the lane.

### S8-003 — VIP is described as live on six surfaces and cannot be bought

```
POST https://www.verzatv.com/api/subscribe  {"plan":"monthly"}
→ 400  {"error":"This VIP plan is not currently available"}
```
Unauthenticated — the availability gate fires before auth, so this is the product's own answer, not an auth artefact.

Production `/me` renders a **"Subscription" section heading with nothing under it**: `app/me/page.tsx:291-298` emits the `SectionLabel` unconditionally, then `<VipCard/>`, and `components/VipCard.tsx:121` returns `null` when `!isVip && !checkoutEnabled`. There is no "Manage Subscription" control anywhere on Profile.

Copy that says otherwise:

| Surface | Line | Text |
|---|---|---|
| `/press` | `app/press/page.tsx:22` | "Monetization — $1.99 one-time Series Unlock **+ VIP subscription**" (unhedged) |
| `/support` | `app/support/page.tsx:32` | "VIP renews automatically until cancelled … open Profile and choose **Manage Subscription**" |
| `/help` | `app/help/page.tsx:37` | "open Profile and choose **Manage Subscription**" |
| `/refund-policy` | `app/refund-policy/page.tsx:136` | "You may cancel VIP at any time through the secure Stripe billing portal available from your Profile" |
| `/about` | `app/about/page.tsx:139` | "or optional VIP access on supported purchase surfaces" |
| `/terms` | §4 | full "VIP Auto-Renewal" paragraph written as operative |

For contrast, `lib/data/compare.ts` hedges correctly ("a supported purchase surface *may* also show an available VIP plan") — the honest pattern already exists in the codebase.

### S8-004 — /investors states four revenue lines; three are fail-closed

`lib/data/company.ts:114`, `:125`, `:140`. Verified against production:

| Claimed line | Production |
|---|---|
| One-time Series Unlocks | live ($1.99) — though no purchase has ever completed |
| VIP subscriptions | `POST /api/subscribe` → **400** not available |
| Merchandise | `POST /api/checkout` → **503** "Official merchandise checkout is temporarily unavailable" (`app/api/checkout/route.ts:22-28`) |
| Creator partnerships | `POST /api/creator/mux-webhook` → **404**; AGENTS.md rule 1 records ingestion as unavailable |

"These are distinct revenue lines with different customer needs" is written in the present tense about three products that cannot take money. The merchandise claim is repeated to partners at `lib/data/company.ts:182` ("Merchandise tie-ins through the VERZA TV store"), rendered on `/partnerships`.

### S8-005 — The Creator Agreement is a required gate that disclaims itself

`/legal/creator-agreement` ships with: *"Version: v0-draft. Draft for review. This is placeholder text pending legal counsel and is not the final agreement."* All five sections defer their operative terms — revenue share, payout timing, licence scope, territory, exclusivity and term are all "set out in the executed agreement."

That document is a hard acceptance gate:
- `components/creator/ApplicationWizard.tsx:622-636` — required checkbox "I have read and accept the VERZA Creator Agreement"
- `lib/creator-client.ts:213` — blocks submission without it
- `app/api/creator/apply/route.ts:152` — persists `agreement_version: "v0-draft"`
- `components/AdminReview.tsx:288` — surfaces it back to admins as "Accepted (v0-draft)"

The product collects binding assent to a contract that says on its face it is not a contract, on the path to an 80% revenue-share relationship.

### S8-006 — Google Play rates the app "Everyone"; every legal page says 18+

| Source | Rating |
|---|---|
| Google Play (`itemprop="contentRating"` **and** JSON-LD) | **Everyone** |
| App Store (iTunes lookup `id=6752884623`) | **17+** |
| Apple advisories | Frequent/Intense Sexual Content or Nudity · Frequent/Intense Profanity or Crude Humor · Frequent/Intense Mature/Suggestive Themes · Frequent/Intense Horror/Fear Themes |
| `/terms` §2 | "You must be at least 18 years old" |
| `/privacy` §6 | "Adults-Only Service … We do not knowingly collect personal information from anyone under 18" |
| `/support` | "The Service is intended for adults age 18 and older" |
| `/editorial-standards` | "may include strong language, violence, sexual content, and mature themes" |

The footer of every page links to the Everyone-rated listing. There is no age gate on the site. Two exposures follow: a Play content-rating policy problem that can pull the Android listing, and a Privacy Policy that promises not to knowingly collect under-18 data while a store presents the app to children. Secondary: Apple's 17+ still admits 17-year-olds the Terms exclude.

### S8-007 — `<html lang>` lies in 19 of 20 locales

Measured live on `/terms` after selecting Español from the header pill:

```
document.documentElement.lang  →  "es"
localStorage['verza-lang']     →  "es"
h1                             →  "Terms of Service"
body                           →  "By accessing or using the VERZA TV application…"
footer                         →  "GET THE APP / App Store iPhone & iPad / Google Play Android /
                                   SITEMAP / Become a Creator Support Terms of Service Privacy
                                   Policy Refund Policy Help & Support Press About /
                                   © 2026 VERZA TV. All rights reserved."
```

`lib/i18n.ts` carries 115 keys × 20 locales, but none covers the footer or any legal/trust page — 20 of the 21 S8 page files contain zero `useTranslation` calls, and `components/Footer.tsx`, `StoreLinks.tsx` and `FooterSitemap.tsx` use literal English throughout. `components/ContentTranslator.tsx` documents that the Google Translate fallback was removed (it was CSP-blocked and had never run), so there is no machine fallback either.

The result is worse than an untranslated page: declaring `lang="es"` over English text makes a screen reader pronounce the entire Terms of Service with Spanish phonology, and suppresses the browser's own "translate this page" offer for exactly the users who need it.

---

## S3 findings (abridged — full detail in the findings array)

- **S8-008** — Footer tap targets are 18px tall on every page. Measured on the production DOM: social anchors compute `padding: 0px`, box **18×18**, label `display:none` below 640px; legal links compute `padding: 0px`, box height **18px**, container `row-gap: 6px`. Only the two store buttons (119×47, 129×47) and the Sitemap pill (115×36) are usable.
- **S8-009** — GTM (`GTM-K9GWK2XT`) and AdSense (`ca-pub-8089901381021947`) load for every web visitor with no consent gate (`components/ThirdPartyScripts.tsx:12-34` — the only gate is `isIOSApp()`). No CMP in the repo, no "Do Not Sell or Share" link on any page, no GPC handling, while `/privacy` §7 grants GDPR rights and §12 offers CPRA opt-out by email only.
- **S8-010** — `careers@verzatv.com` is the only address on the site rendered as plain text rather than a `mailto:` (`app/careers/page.tsx:171`), and its offered fallback (`/contact`) has no careers route.
- **S8-011** — `/contact` bills itself as the address directory (`/support` links to it as "Contact Directory →") and omits privacy@, careers@ and investors@ — including the address `/privacy` routes all deletion and CCPA/GDPR requests to.
- **S8-012** — `/help:52` claims a Horror catalog; `/discover/horror` says "0 live series", "No horror series yet.", and `grep -ic horror lib/catalog.ts` → 0.
- **S8-013** — `/studio` (the footer's "Become a Creator" target on every page) server-renders an empty `<main>`; the skeleton only appears post-hydration.
- **S8-014** — The 365-line Terms has no DMCA notice-and-takedown, designated agent, counter-notice or repeat-infringer policy. "DMCA" appears once in the whole app, as a bullet on `/contact`. `/dmca` → 404.
- **S8-015** — `/about:137` advertises "Podcasts" as a content category. No tab, genre hub, discover category or catalog row is a podcast; the only match is a drama titled "The Breakup Podcast."
- **S8-016** — `HideInIOSApp` hides the store buttons only after mount, so the iOS app paints a Google Play button on first render of every page. Against AGENTS.md rule 11.

## S4 findings

**S8-017** `/leadership` disclaims placeholder bios it does not show (one leader in `lib/data/company.ts:44-51`). · **S8-018** `/partnerships:57` "owns its content" vs `/about:119` "produced by or licensed to". · **S8-019** Seven indexable S8 pages missing from `sitemaps/pages.xml`. · **S8-020** `/sitemap` titled "Every Page on VERZA TV" lists 35 of 48. · **S8-021** Six duplicate links in the footer sitemap sheet. · **S8-022** "Traction & Highlights" with no traction. · **S8-023** Play developer is "Rare Media Group"; every legal page names VERZA TV LLC.

---

## Verified good — do not treat these as open

| Check | Result |
|---|---|
| 276 internal links from S8 pages | **276/276 → 200, zero redirects, zero 404s** |
| Both store links | resolve to live listings. Apple `/app/id<n>` deliberately omits `/us/` so non-US viewers reach their own storefront — the provenance comment in `lib/app-store.ts` is accurate and was re-verified |
| App Store listing | Verza TV: Vertical Drama · VERZA TV LLC · v2.0.0 · `features: ['iosUniversal']` with 5 iPad screenshots, so "iPhone & iPad" is correct · `sellerUrl: https://www.verzatv.com` |
| 4 of 5 social links | Instagram, TikTok, X, Facebook all resolve — each confirmed with a negative control |
| "91 live series" (`/about`, `/press`, `/help`, `/company`, `/media-kit`) | **accurate.** AST-parsed `lib/catalog.ts`: 96 rows, 91 live, 5 coming_soon |
| `/help` genre list | 7 of 8 genres confirmed against production `/discover/*` (comedy 6, sci-fi 1, crime 3, …); only Horror fails |
| Privacy §10 "Delete Account" | **substantiated end-to-end.** `components/ProfileDynamic.tsx:107-190` → `POST /api/account/delete`, which clears watch_progress, saved_list, push_subscriptions, creator_signups, feedback, analytics_events, redacts purchase identity, expires open Checkouts, cancels subscriptions, deletes the Stripe Customer, then deletes the auth user. `entitlements` and `creators` carry `on delete cascade` from `profiles` (migrations 001, 005), so the "access entitlements" clause holds |
| **Inherited fact — "VipCard.tsx:109 Stripe TEST portal URL"** | **STALE / already fixed.** `components/VipCard.tsx:95` now calls `POST /api/billing-portal`; the hard-coded TEST link is gone (`app/api/billing-portal/route.ts:19` records the replacement) |
| Legal "Last updated: August 5, 2026" | accurate — `git log` shows all three pages last touched in `a9b5378` (2026-08-05), the Apple base commit named in AGENTS.md |
| Coins / per-episode language in legal copy | **absent** — correctly, since both are disabled |
| 404 page | honest, offers a way forward ("Back to Discover"). `/legal`, `/legal/nonexistent`, `/terms-of-service`, `/privacy-policy`, `/cookies`, `/do-not-sell`, `/accessibility`, `/dmca`, `/careers/apply` all hard-404 — no soft-404s |
| `/newsroom` and `/careers` empty states | honest and offer a way forward — "No press releases are currently published." / "No openings are currently published." Consistent with the Anime house pattern (`components/BrowsePage.tsx:696-731`), except that `/careers`' contact address is inert (S8-010) |
| `/amazon` FTC disclosure | present and correct — "As an Amazon Associate, VERZA TV earns from qualifying purchases", plus per-tile "Sponsored · Ad · Amazon / Not personalized / Report an Ad" |
| Bare domain / http | `verzatv.com/terms` → 308 → `www` → 200; `http://` → 2 hops → 200 |
| Security headers on legal pages | HSTS preload, `x-frame-options: DENY`, `nosniff`, `strict-origin-when-cross-origin`, `object-src 'none'`, `base-uri 'self'`, `form-action 'self' https://checkout.stripe.com` |
| `rel` on all external footer links | `target="_blank" rel="noopener noreferrer"` throughout |
| Undisclosed third parties | none. Only `googletagmanager`, `stream.mux.com`, `image.mux.com` and `litix.io` (Mux Data) load on legal pages; all covered by the `/privacy` §3 vendor list. `player.vimeo.com` sits unused in the CSP allowlist — hygiene, not a data flow |

## Do-not-regress check

Nothing in this lane touches instant play, the paywall, the episode picker, swipe feel, poster art, speed or "THE MICRODRAMA APP". **The legal and trust pages are on the do-not-regress list, and they largely deserve to be** — `/terms`, `/privacy` and `/refund-policy` are specific, honest about Apple's role, correct about what VERZA can and cannot refund, and free of dark patterns. The defects above are claims that outran the product (VIP, merchandise, creator revenue, brand-asset downloads), one dead link, and an unlocalized footer — not a rewrite. **The Anime empty state is also on that list, and it is the right template for two things that currently fail it: the empty "Subscription" heading on `/me` and the `/brand-assets` "SVG · PNG" pills.**

## Suggested order for whoever fixes this

1. **S8-001** — one-line href change, live on every page. Confirm the destination is `@VerzaTVOfficial` before shipping.
2. **S8-003 / S8-004 / S8-022** — the copy edits are small and they are what an investor, a journalist and a paying viewer read first. Take the hedging pattern already used in `lib/data/compare.ts`.
3. **S8-006** — needs a Play Console decision this week; the rating gates Android distribution and interacts with the under-18 promise in the Privacy Policy.
4. **S8-005** — either finish the Creator Agreement or stop taking assent to it.
5. **S8-002** — ship the four logos, or say plainly that assets are available on request.
6. **S8-008** — padding on the footer links; one commit, every page.
7. **S8-007** — the largest, and the one with an accessibility edge. A cheap interim fix that removes the lie without translating anything: stop setting `<html lang>` to a locale whose page content is not translated.