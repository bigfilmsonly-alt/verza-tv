# Deployment

The deployment chain from local development to production.

---

## Repository

- **GitHub:** `bigfilmsonly-alt/verza-tv`
- **Branch:** `main` (single trunk -- all deploys come from here)

---

## Vercel Project

- **Project ID:** `prj_Nio9LZnB47XRYATkr0uA9BCWXq0c`
- **Team ID:** `team_dH3gjHuiMOEBasjWn3GwQcYf`
- **Framework:** Next.js 16 (auto-detected)
- **Build tool:** Turbopack
- **Build time:** ~30 seconds

---

## Deploy Flow

```
git push origin main
       |
       v
  Vercel detects push (GitHub integration)
       |
       v
  next build (Turbopack)
       |
       v
  Production deploy -> verza-tv.vercel.app
```

Every push to `main` triggers an automatic production deploy. Pull requests
and non-main branches get preview deploys at unique URLs
(`verza-tv-<hash>.vercel.app`).

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

The production domain will be `verzatv.com`. This is NOT yet active --
cutover is planned after full feature completion. Until then, the app is
accessible at `verza-tv.vercel.app`.

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
