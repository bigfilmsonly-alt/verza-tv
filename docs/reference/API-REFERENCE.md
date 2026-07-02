# API Reference

All route handlers under `app/api/`. Endpoints are Next.js 16 App Router route
handlers (`route.ts`). Request APIs are async (`await cookies()`,
`await params`). Auth model noted per group.

> **Revenue rule:** No endpoint records revenue from client input. Purchases and
> subscription revenue are written **only** by the Stripe webhook after
> server-side verification. Checkout endpoints compute prices server-side.

---

## Payments & entitlements

| Method | Route | Purpose | Auth |
| --- | --- | --- | --- |
| POST | `/api/unlock` | Start Stripe checkout to unlock a series ($1.99). Adds `plan_type` + `show_id` metadata. | Cookie session |
| POST | `/api/unlock/season-pass` | Season-pass unlock checkout. | Cookie session |
| POST | `/api/creator-unlock` | PPV checkout for creator content (price from server). | Cookie session |
| POST | `/api/checkout` | Generic Stripe checkout session. | Cookie session |
| POST | `/api/subscribe` | VIP subscription checkout (monthly/yearly), adds `plan_type`. | Cookie session |
| GET | `/api/entitlements` | List the user's entitlements. | Cookie session |
| GET | `/api/entitlements/check` | Check access to a given series/episode. | Cookie session |
| GET | `/api/coins/balance` | Coin balance. | Cookie session |
| POST | `/api/coins/purchase` | Coin purchase checkout. | Cookie session |
| POST | `/api/stripe/webhook` | **Source of revenue truth.** Handles `checkout.session.completed`, `invoice.payment_succeeded`, `charge.refunded`, `customer.subscription.*`. Writes entitlements + `analytics_events` revenue rows + creator 80/20 split. | Stripe signature |

## Video / Mux

| Method | Route | Purpose | Auth |
| --- | --- | --- | --- |
| GET | `/api/playback/[episode]` | Return (signed) Mux playback data for an episode. | Cookie session |
| POST | `/api/mux/webhook` | Mux asset lifecycle (`video.asset.created/ready/errored`) → advances creator content status. | Mux signature |
| POST | `/api/uploads` | Upload helper. | Cookie session |

## Creator pipeline (UGC)

Creator routes authenticate via **cookie session** (`getUser`, same-origin).

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/api/creator/me` | Current creator context/status. |
| POST | `/api/creator/apply` | Submit a creator application (→ pending). |
| POST | `/api/creator/upload` | Create a Mux direct upload (503 if Mux not provisioned). |
| GET/POST | `/api/creator/content` | List / create creator content. |
| GET/PATCH | `/api/creator/content/[id]` | Read / edit one content item (details, pricing). |
| POST | `/api/creator/content/[id]/submit` | Submit content for review. |
| GET | `/api/creator/analytics` | Creator earnings/views. |

## Admin

Admin routes authenticate via **Bearer access token** gated by `ADMIN_EMAILS`
(`lib/admin.ts`).

| Method | Route | Purpose |
| --- | --- | --- |
| GET/POST | `/api/admin/creators` | GET pending creator applications; POST approve/reject (with reason). |
| GET/POST | `/api/admin/review` | GET content review queue; POST approve/reject content. |
| GET | `/api/admin/stats` | Analytics funnel + revenue rollups (paywall→checkout→purchase). |

## Analytics

| Method | Route | Purpose | Auth |
| --- | --- | --- | --- |
| POST | `/api/events` | Client event sink. Allow-lists non-revenue events, strips `revenue_cents`/`currency`, rejects server-only events. | Anonymous (stable `verza_anon_id`) |

## User data

| Method | Route | Purpose | Auth |
| --- | --- | --- | --- |
| GET/POST | `/api/watch-progress` | Continue-watching progress. | Cookie session |
| GET/POST | `/api/saved-list` | Saved list add/read. | Cookie session |

## AI

| Method | Route | Purpose | Auth |
| --- | --- | --- | --- |
| POST | `/api/ai-host` | "Ask Verza" chatbot + creator/SEO/marketing/moderate modes (Claude). | Cookie session |
| POST | `/api/studio/generate` | Creator AI Studio generation (scripts, loglines, social copy). | Cookie session |

## Notifications & auth

| Method | Route | Purpose |
| --- | --- | --- |
| POST | `/api/push/subscribe` | Register a web-push subscription. |
| POST | `/api/push/send` | Send a push (server, `PUSH_API_KEY` gated). |
| GET | `/api/auth/callback` | Supabase OAuth callback (open-redirect protected). |

## SEO / OG

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/api/og/[slug]` | Dynamic Open Graph image per series. |

---

## Cross-cutting: middleware

`middleware.ts` applies **5-tier rate limiting** across API routes, attaches
auth context, and marks preview deploys `noindex` (only production indexes).
CSP is set with a `https://*.mux.com` wildcard (Mux uses many CDN subdomains).
