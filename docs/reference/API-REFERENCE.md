# API reference

Last reconciled: **2026-08-05**. There are 45 `app/api/**/route.ts` files. This
reference emphasizes release/security contracts; inspect the exact handler and
versioned local Next.js docs before changing a payload.

> The August 3 Stripe/Mux production baseline verifies legal/support, authenticated
> payment capabilities in compatibility mode with VIP false, signed paid
> playback, and one exact-19 Stripe webhook. Required Terms/portal and the live
> $1.99 smoke remain open. The hardened Mux creator webhook is deployed and
> returns 503 while its verification secret is intentionally absent; creator
> ingestion remains unavailable. The three Apple IAP routes are live at commit
> `a9b537844a8878851ecfe4c0e310f405b68fc6ef`; negative routes and
> authenticated no-charge preflight passed, while real signed notification and
> transaction delivery remain open.

## Authentication conventions

- Web/native user routes resolve a verified Supabase cookie session or Bearer
  token where their handler supports the native client. Client-supplied user IDs
  are never ownership authority.
- Admin routes require a verified Bearer user whose email is in `ADMIN_EMAILS`;
  an email string by itself is not auth.
- Stripe/Mux webhooks verify their provider signature over the required raw
  payload or return non-2xx before any mutation when verification is not
  configured or fails.
- Apple device routes require an exact Supabase Bearer user; the V2 notification
  route is public but accepts only an Apple-signed JWS payload.
- Cron uses a constant-time checked Bearer `CRON_SECRET` and release gates.
- Private access/payment/playback responses are `private, no-store` and vary on
  Authorization/Cookie as applicable.

## Payments and access

| Method | Route | Contract | Launch state |
| --- | --- | --- | --- |
| `POST` | `/api/unlock` | Authenticated canonical $1.99 Series Checkout; server owns user, Customer, slug, amount, currency, Terms policy, and history recovery | Production configured/live in compatibility mode; controlled smoke open |
| `GET` | `/api/unlock/confirm` | Authenticated exact provider-backed Series recovery; browser return alone grants nothing | Source-enabled |
| `POST` | `/api/iap/apple/preflight` | Bearer-authenticated paid-live/no-access/no-VIP/no-deletion check; exact Apple flag; returns canonical product ID, never access | Live; auth 200 exact product/private-no-store and unauth 401 read back |
| `POST` | `/api/iap/apple/transactions` | Bearer-authenticated Apple JWS verification and monotonic ledger reconciliation; exact-account purchase or explicit orphan restore | Live; no real signed transaction canary yet |
| `POST` | `/api/iap/apple/notifications` | Public Apple-signed V2 notification verification, idempotent claim, refund/revoke/reversal reconciliation | Live; invalid 400 and exact ASC V2 URLs read back; real signed delivery open |
| `GET` | `/api/payments/capabilities` | Authenticated non-secret Series/VIP readiness; private/no-store; explicit compatibility/required/unconfigured Terms mode | Live: Series configured/live compatibility; both VIP false; unauthenticated = 401 |
| `GET` | `/api/access` | Canonical episode access decision | Free or verified user access only |
| `GET` | `/api/entitlements/check` | Free/VIP/series entitlement check | Source-enabled |
| `GET` | `/api/entitlements` | Current user's entitlements | Source-enabled |
| `POST` | `/api/entitlements` | Client grant attempt | Rejected (405) |
| `POST` | `/api/entitlements/claim` | Retired client claim | Fail-closed (410) |
| `POST` | `/api/subscribe` | Authenticated VIP Checkout | Hidden/API-blocked while notice/portal/webhook gates are false |
| `POST` | `/api/subscribe/confirm` | Exact provider-backed VIP recovery | Cannot bypass VIP release/provider gates |
| `POST` | `/api/billing-portal` | Current Customer's reviewed restricted portal | Fail-closed until exact production configuration passes drift check |
| `GET` | `/api/cron/vip-renewal-reminders` | Secured annual 15–45-day reminder processor | Secret-authenticated; yearly launch separately blocked |
| `POST` | `/api/unlock/season-pass` | Legacy coin season pass | Fail-closed (410) |
| `GET` | `/api/coins/balance` | Legacy coin balance | Disabled (501) |
| `POST` | `/api/coins/purchase` | Legacy coin purchase | Disabled (501) |
| `POST` | `/api/creator-unlock` | Creator PPV | Disabled (503) |
| `POST` | `/api/checkout` | Server-priced official merchandise Checkout | Feature-gated off pending physical fulfillment readiness |
| `GET` | `/api/checkout/native-return` | Validated Android return bridge | Navigation/recovery only; never fulfillment authority |

Current Series Terms behavior is explicit:

- exact live `STRIPE_CHECKOUT_TOS_CONSENT_REQUIRED=false` = compatibility
  Checkout without hosted checkbox;
- exact `true` = hosted consent required after Public details; and
- missing/empty/malformed live state = unconfigured/fail-closed.

Final cutover requires true. Both VIP capabilities remain false.

Apple route payloads are deliberately small:

- preflight accepts `{ "seriesSlug": string }`;
- transaction verification accepts `{ "signedTransaction": string,
  "expectedSeriesSlug": string, "restoreMode"?: boolean }`; and
- notifications accept `{ "signedPayload": string }`.

Preflight success returns `purchaseAllowed`, exact `productId`, and
`seriesSlug`. Transaction success separates `verified`/`finishAuthorized` from
`accessGranted` and includes canonical status, rebind state, transaction ID,
series, and environment. A verified terminal transaction can be finishable
without access. Apple new-purchase preflight can be off while transaction,
restore, refund/revocation, and notification reconciliation remains on. See
[`../guides/APPLE-IAP.md`](../guides/APPLE-IAP.md).

## Stripe webhook

`POST /api/stripe/webhook` verifies `stripe-signature`, durably claims the Event,
retrieves current provider objects where ordering matters, and row-locks
financial/access reconciliation. It handles Series fulfillment/recovery,
subscriptions/invoices, Refunds, Disputes, account-deletion tombstones, and
notice retries.

Production now has one canonical enabled endpoint with exactly the reviewed
19-event allowlist in [`../guides/PAYMENTS.md`](../guides/PAYMENTS.md), wildcard
off. It was changed in place after compatible code was live, with no second
endpoint, historical replay, or signing-secret rotation. An unsigned request
returns 400. Preserve that state through the required-consent deployment.

The webhook is the normal asynchronous fulfillment authority; authenticated
confirmation may also persist/recover an exact paid provider state when the
webhook is delayed. Neither path trusts client revenue/access input.

## Playback and Mux

| Method | Route | Contract |
| --- | --- | --- |
| `GET` | `/api/playback/[episode]` | Key format `<slug>--<episode>`; free returns public capability, paid requires cookie/Bearer entitlement/VIP and returns signed URL when signed mode is enabled |
| `POST` | `/api/mux/webhook` | Creator-upload asset lifecycle; requires secret, awaited signature verification, and non-2xx on processing failure; deployed production route currently returns 503 because the verification secret is intentionally absent |

Paid responses omit a separate playback ID, use private/no-store headers, and
fail closed with 503 for incomplete signed configuration. Current clients expose
only 459 public capabilities and withhold 3,803. See
[`../guides/MUX.md`](../guides/MUX.md).

## Account and user data

| Method | Route | Purpose |
| --- | --- | --- |
| `POST` | `/api/account/delete` | Guard Checkout, cancel/expire provider state, preserve minimal payment tombstone/financial evidence, delete identity |
| `GET`, `POST` | `/api/watch-progress` | Current user's continue-watching data |
| `GET`, `POST`, `DELETE` | `/api/saved-list` | Current user's saved series |
| `GET` | `/api/auth/callback` | Supabase OAuth exchange with validated return path |

Deletion may not restore identity, entitlement, saved state, email, or analytics
when a delayed payment event arrives. Stripe financial/tombstone rows and Apple
purchase rows may remain pseudonymized; the successful profile/Auth cascade
removes access and sets the Apple ledger owner to null. Explicit StoreKit
restore can rebind only that pre-existing orphan after the former account is
proven absent.

## Creator/admin/AI/notifications

Creator routes cover current creator context, application, content list/detail,
submit, upload, and analytics. Admin routes cover creator applications, review,
and stats. These web routes exist, but creator PPV is disabled and iOS 2.0
redirects all UGC/admin routes before query/render.

`POST /api/creator/beta` is a separate unauthenticated web lead form that
collects only name/email and sends an internal notification. It never creates a
creator, approves upload, grants access, or enables PPV. The handler requires a
same-origin JSON request, caps request/body size, applies a bounded per-source
hot-instance rate window plus a honeypot, returns private/no-store responses,
and reports provider failure instead of claiming a submission was saved. Email
template fields are HTML-escaped. These controls are defense in depth; a
durable/distributed abuse-control service is required if traffic risk grows.

`POST /api/ai-host` and `POST /api/studio/generate` are optional/deferred AI
surfaces and must fail safely without their provider. Upload routes are not a
native-launch dependency.

Push routes create/delete browser subscriptions and gate sends with the
server-side push credential. iOS 2.0 does not inherit web push merely because
these routes exist.

## Analytics

`POST /api/events` accepts allowlisted non-revenue events and strips/rejects
server-only financial fields. Analytics is never purchase, entitlement, Refund,
or playback authority.

## SEO and middleware

`/api/og/[slug]` serves current Open Graph behavior. Robots/sitemaps/`llms.txt`
are route handlers outside `app/api`.

The current request boundary applies rate limits/security/noindex policy from
the repository middleware/proxy layer. The build may emit a non-blocking Next.js
middleware-filename deprecation warning; renaming it is a separate routing
change, not a release shortcut.
