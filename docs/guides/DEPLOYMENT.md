# Deployment

The deployment chain from local development to production.

---

## Repository

- **GitHub:** `Splash-Studio/verza-tv` (private, canonical — remote `origin`).
  A public fork `bigfilmsonly-alt/verza-tv` (remote `bigfilmsonly`) also feeds
  the same Vercel project but leaks `lib/mux-map.ts` — do not treat it as canonical.
- **Branch:** `main` (single trunk)

---

## Vercel Project

- **Project ID:** `prj_0HX6x5Vi64r9Y3YIa3W6KpIwDLKG`
- **Team ID:** `team_uikUPkCBtl8h84khAOFJJWpz`
- **Framework:** Next.js 16 (auto-detected)
- **Build tool:** Turbopack
- **Build time:** ~30 seconds

---

## Deploy Flow

The **live domain is promoted only by the Vercel CLI**, run from the repo root:

```
npx vercel --prod --yes
       |
       v
  Remote build on Vercel (next build, Turbopack)
       |
       v
  Deployment reaches READY (target: production, source: "cli")
       |
       v
  CLI aliases it to www.verzatv.com + verzatv.com
```

**A `git push` does NOT promote the live site.** Pushing to `main` builds a
production-*target* deployment (it reaches READY) but does NOT take over the
`www.verzatv.com` / `verzatv.com` aliases — only `npx vercel --prod` does.
Non-main branches / PRs still get preview deploys at unique
`verza-tv-<hash>.vercel.app` URLs. Keep the repo in sync by pushing to `main`
too, then run the CLI to go live. Verify a deploy in a browser or via the Vercel
API — not `curl`: the live domain returns a "Vercel Security Checkpoint" (HTTP
403) to bot-like clients even when the site is healthy.

---

## Rendering Strategy

- **Static pages** are pre-rendered at build time (series index, series
  detail pages, shop, about, etc.). These are served from the Vercel edge
  cache with no origin hit.
- **API routes** are dynamic and run as serverless functions:
  - `/api/coins/purchase` -- coin pack purchase
  - `/api/coins/balance` -- coin balance check
  - `/api/checkout` -- merch Stripe Checkout session
  - `/api/stripe/webhook` -- Stripe webhook handler
  - `/api/unlock` -- single episode unlock
  - `/api/unlock/season-pass` -- season pass purchase
  - `/api/entitlements/check` -- entitlement check
  - `/api/entitlements` -- entitlement list
  - `/api/ai-host` -- AI Host chat
  - `/api/playback/[episode]` -- signed video playback URL
  - `/api/auth/callback` -- Supabase auth callback
  - `/api/uploads` -- file uploads
  - `/api/studio/generate` -- studio content generation
  - `/api/og/[slug]` -- dynamic Open Graph images

---

## Preview vs Production

Non-production deploys (preview, development) receive an automatic
`X-Robots-Tag: noindex, nofollow` header on all routes. This is configured
in `next.config.ts` and gated on `VERCEL_ENV !== "production"`.

This prevents search engines from indexing preview URLs. Only the production
deploy is crawlable.

---

## Security Headers

All routes receive the following headers (configured in `next.config.ts`):

| Header | Value |
| ------ | ----- |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` |
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` |

Static assets under `/posters/` and `/shop/` are served with
`Cache-Control: public, max-age=31536000, immutable`.

---

## Production Domain

The production domain is **`www.verzatv.com`** (apex `verzatv.com` is also
aliased) and is **LIVE**. New builds are promoted to it with `npx vercel --prod`
(see Deploy Flow above).

---

## Redirects

Configured in `next.config.ts`:

- Trailing slashes are stripped (`/:path+/` -> `/:path+`, 301)
- Typo slug corrections:
  - `/series/the-chauffer` -> `/series/the-chauffeur`
  - `/series/the-pendelton-secrete` -> `/series/the-pendleton-secret`

---

## Local Development

```bash
# Install dependencies
npm install

# Start dev server (default port 3000)
npm run dev

# Or specify a port if 3000 is occupied
PORT=3005 npm run dev
```

The dev server uses Turbopack for fast refresh. No environment variables are
strictly required to start the dev server -- the app gracefully degrades
when keys are missing (Stripe routes return stubs, video playback is
unavailable, etc.).

---

## Build Verification

```bash
npm run build
```

Runs `next build` with Turbopack. The build succeeds without any environment
variables set -- all external clients are lazy-initialized behind env
checks.

---

## Environment Variables

See `docs/ENV.md` for the full variable reference. In Vercel, set them under
**Settings > Environment Variables**. Mark secrets as Sensitive.
