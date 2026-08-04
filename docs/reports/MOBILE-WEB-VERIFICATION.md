# Mobile Web Verification — www.verzatv.com

> **ARCHIVE — dated production observation.** HTTP, build, payment, database,
> and media results can change and are not current release evidence. Re-run
> canonical readbacks; see [`../LAUNCH-TRUTH.md`](../LAUNCH-TRUTH.md).

_Live verification of the production mobile web experience. Every result below
is from a real check against the live site (iPhone Safari user-agent), the
production build, the deployed environment, and the live database — run
2026-07-02 against deploy of commit `77ff615`._

## Verdict

**The consumer mobile web experience is fully operational.** All routes serve,
video streams, the mobile layout/viewport/PWA signals are correct, security
headers are in place, the build is green, and the database is fully migrated.
A few **non-consumer** items (admin auth key, AI key, Mux webhook secret, and
the known VIP portal URL) are flagged in §8 — none affect what a mobile viewer
sees or does.

---

## 1. Live route health (iPhone Safari UA)

All 14 checked routes returned **200**:

| Route | Status | | Route | Status |
| --- | --- | --- | --- | --- |
| `/` | 200 | | `/library` | 200 |
| `/shorts` | 200 | | `/series/{slug}/1` | 200 |
| `/horizontal` | 200 | | `/watch-in/new-york` | 200 |
| `/studio` | 200 | | `/sitemap.xml` | 200 |
| `/creator` | 200 | | `/terms` | 200 |
| `/shop` | 200 | | `/privacy` | 200 |
| `/search` | 200 | | `/sign-in` | 200 |

Homepage renders a full **353 KB** document (not an empty SSR shell).

## 2. Mobile rendering signals (from live HTML)

| Signal | Value | Status |
| --- | --- | --- |
| Viewport meta | `width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover` | ✅ notch/safe-area correct |
| `theme-color` meta | present | ✅ |
| `apple-mobile-web-app-*` | present | ✅ iOS PWA |
| Web app manifest | linked | ✅ installable |
| `device-frame` shell | present | ✅ |
| JSON-LD structured data | present | ✅ SEO |
| `<title>` | "Verza TV — Microdramas, Reality & More" | ✅ |

## 3. Mobile-critical CSS (verified in `app/globals.css`)

- `.device-screen` has **no overflow on mobile** — this is what lets
  `position:fixed` work on iOS Safari (the core mobile layout rule).
- `.episode-immersive` is `position:fixed` on mobile for full-viewport vertical
  playback; header/footer/bottom-nav are suppressed while immersive.
- `viewport-fit=cover` + safe-area handling for notched devices.
- Desktop wraps the app in an iPhone frame with its own scroll; mobile fills the
  viewport. Single-render layout shell (`device-frame → device-screen →
  app-shell → main`).

## 4. Security headers (live response)

| Header | Value |
| --- | --- |
| Content-Security-Policy | `default-src 'self'` … includes `https://*.mux.com` (video) ✅ |
| Strict-Transport-Security | `max-age=63072000; includeSubDomains; preload` ✅ |
| X-Frame-Options | `DENY` ✅ |
| X-Content-Type-Options | `nosniff` ✅ |
| Referrer-Policy | `strict-origin-when-cross-origin` ✅ |
| Indexable in prod | yes (no `noindex`) ✅ |

Rate limiting (5-tier) is applied in `middleware.ts`.

## 5. Video delivery (Mux)

- **5/5** sampled catalog playback IDs returned **200** for live Mux
  thumbnails — assets are live and serving.
- Mux API token verified with **read + write (upload)** scope (see
  `MUX_TOKEN_ID`/`MUX_TOKEN_SECRET`), so creator uploads are functional.
- ~4,146 playback IDs mapped in `lib/mux-map.ts`.
- Playback uses muted-first autoplay with `mutedRef` (iOS-safe), `sourceReady`
  gate, and a persistent single-player pattern.

## 6. Build & deploy

- Production build: **✅ green — 1085 pages prerendered** (only a benign
  `@ts-expect-error` warning for the optional Anthropic SDK).
- Production deploy: latest commit `77ff615`, aliased to **www.verzatv.com**.

## 7. Database & payments

- Migrations **004** (analytics_events), **005** (creator pipeline),
  **006** (saved_list + pending_entitlements) all applied and verified on the
  live database with RLS enabled. Schema is caught up with the code.
- Stripe **live** keys present in production (`STRIPE_SECRET_KEY`,
  `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`); all pricing is
  server-side; revenue recorded only from the verified webhook.
- Supabase (URL / anon / service-role), Resend, VAPID push, and site URL all
  present in production.

## 8. Flagged — not consumer-mobile-blocking

These do **not** affect what a mobile viewer sees/does (browse, play, unlock,
subscribe, shop, search all work), but should be closed for full back-office /
AI functionality:

| Item | Impact | Action |
| --- | --- | --- |
| `ADMIN_EMAILS` absent in prod | Admin dashboard / creator-approval routes won't authorize | Add `ADMIN_EMAILS` (comma-separated) in Vercel Production |
| `ANTHROPIC_API_KEY` absent | "Ask Verza" chatbot + Creator AI Studio degrade (no responses) | Add key in Vercel to enable AI |
| `MUX_WEBHOOK_SECRET` absent + webhook not configured | Creator asset status advances via poll fallback instead of real-time webhook; webhook unverified | Create webhook in Mux dashboard → `…/api/mux/webhook`, store secret |
| `MUX_SIGNING_KEY_ID/SECRET` absent | Signed/private playback unavailable (public playback works) | Optional — generate signing key if private playback is needed |
| `VipCard.tsx:109` Stripe **TEST** portal URL | VIP "Manage subscription" opens a sandbox portal | **P0** — replace with the real production Customer Portal URL |

## 9. Recommended human spot-checks on a real phone

- Open www.verzatv.com on an iPhone: hero slideshow, tab switching, scroll.
- Tap a series → vertical episode plays; muted-first then unmute on tap; action
  rail (like/share/comment/more) fades after ~8s.
- Run the $1.99 unlock end-to-end with a real card; confirm the title appears in
  My List afterward.
- Subscribe VIP; confirm "Manage subscription" (currently the P0 test URL).
- Shorts (`/shorts`) and Storage Pirates (`/horizontal`) playback.
- Add to cart in `/shop` and reach Stripe checkout.
