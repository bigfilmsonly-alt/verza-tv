# The $1.99 owner test

**Prepared 2026-09-07. Not executed — the payment is Jotham's to make.**

This proves the commerce loop end to end on **web** (`www.verzatv.com`). It is
the first real transaction the platform will have completed: `purchases` and
`entitlements` are both **empty**, and Stripe's last successful charge was
2026-07-03.

That emptiness is the test's best feature. **Any row that appears is yours**,
so there is nothing to disambiguate.

---

## Before you start

Run this. If it is not `ok: true` / HTTP 200, **stop** — the entitlement write
will not land and you will have paid for nothing.

```bash
curl -s https://www.verzatv.com/api/health | python3 -m json.tool
```

Expected:

```json
{ "ok": true, "checks": { "configured": true, "projectsMatch": true, "canRead": true, "schemaReady": true } }
```

`projectsMatch: false` is the exact failure this endpoint was built for: the
browser would authenticate against one Supabase project while the webhook wrote
your entitlement to another. That was live for ~7.5 weeks and is fixed, but
check it anyway — it costs one second and it is the difference between a test
and a donation.

Have open:

- **Stripe** → Payments, and Developers → Webhooks → `www.verzatv.com/api/stripe/webhook`
- **Supabase** → project `mmvbmrrwgludfmfalfcm` → Table editor
- The site in a normal browser window (not private — you want the session to persist for step 19)

Cost: **$1.99**, real money, live mode. It is refundable from the Stripe
dashboard afterwards; refunding also exercises the revoke path, which has never
been observed either.

---

## The test

Fill in ACTUAL / PASS / EVIDENCE as you go.

| # | Step | Expected | ACTUAL | PASS | EVIDENCE |
|---|---|---|---|---|---|
| 1 | Sign in at `/sign-in` | Signs in. Google, Apple, Sign Up and Continue as Guest are all visible and not clipped | | | |
| 2 | Open a locked series | Series page loads, shows price and episode count | | | |
| 3 | Advance past the free preview | First 5 episodes play; episode 6 shows the paywall | | | |
| 4 | Tap Unlock | Redirects to Stripe hosted checkout — no dead button, no raw error | | | |
| 5 | Checkout opens | Stripe page renders with the Verza brand | | | |
| 6 | Offer is correct | Line item names the series you chose | | | |
| 7 | Price | **$1.99 USD** | | | |
| 8 | Language disclosure *(only if testing an Español/Bollywood title)* | Series page said "Spanish audio" or "Hindi audio · English subtitles" **before** checkout | | | |
| 9 | Pay | Card accepted | | | |
| 10 | Stripe shows success | Payments → status `Succeeded`, $1.99 | | | |
| 11 | Webhook delivered | Developers → Webhooks → the endpoint → the `checkout.session.completed` attempt returns **2xx** | | | |
| 12 | `purchases` row | Exactly 1 row. `type` = `series_unlock`, `status` = `completed`, `amount_cents` = 199, your `user_id`, matching `series_slug` | | | |
| 13 | `entitlements` row | Exactly 1 row. Your `user_id`, matching `series_slug`, `purchase_id` pointing at the row from step 12 | | | |
| 14 | Return to Verza | Lands back on the series with `?session_id=…` | | | |
| 15 | Content unlocked | Paywall gone; the previously locked episode is playable | | | |
| 16 | Play it | Video starts | | | |
| 17 | Playback works | Plays through, audio present, advances to the next episode | | | |
| 18 | Refresh the page | Still unlocked | | | |
| 19 | Close the tab, reopen the site | Still unlocked. **This is the real test** — it proves access came from the database, not from a URL parameter or client state | | | |

### What "pass" means

Steps **12, 13 and 19** are the ones that matter. Steps 9–11 only prove Stripe
worked; plenty of systems take money correctly and fail to grant anything.
Step 19 is the one that proves a customer keeps what they bought.

---

## If something fails

### Checkout never opens (step 4)

You were probably signed out. `/api/unlock` returns **401 `auth_required`** for
guests by design, and the UI should route you to sign-in rather than erroring.

Check the browser console and network tab for the `POST /api/unlock` response
code:

- **401** — session was lost. Sign in again.
- **409 `not_purchasable`** — that series is not sellable (coming soon, or free).
- **409 `already_owned`** — you already own it. Pick another title.
- **503** — checkout is disabled. `STRIPE_CHECKOUT_TOS_CONSENT_REQUIRED` must
  be exactly `true` or `false` in Vercel Production; missing or malformed fails
  closed on purpose.

### Payment succeeded but no webhook 2xx (step 11)

Stripe → Developers → Webhooks → the endpoint → the failed attempt. The
response body says which assertion threw.

- **400** — signature rejected. `STRIPE_WEBHOOK_SECRET` in Vercel Production
  does not match this endpoint's signing secret.
- **500 "checkout has no verified user"** — the session carried no `userId`.
  That was the pre-2026-08-29 guest-checkout path and should be impossible now;
  if you see it, the auth gate has regressed.
- **500 "no required Terms acceptance"** — the consent flag disagrees with what
  the session recorded.

Stripe retries automatically. **Do not re-pay.** Fix the cause and use
Stripe's "Resend" on that event.

### Payment succeeded, webhook 2xx, but no `purchases` / `entitlements` row (12–13)

This is the split-brain signature. Re-run `/api/health` first.

- `projectsMatch: false` → the webhook wrote to a different Supabase project.
- `schemaReady: false` → the project is the right one but is missing the payment
  schema. This is the 2026-09-07 failure: migrations 009–015 were live on the
  database production had just been repointed AWAY from, so checkout 500'd and
  the webhook could not have written an entitlement even if it had not. Do not
  pay while this is false; the charge would succeed and grant nothing.
  Fix `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` in Vercel Production, redeploy,
  then use Stripe's "Resend" on the event. **Do not re-pay** — resending
  replays the same event and the write is idempotent.
- `canRead: false` → the project is unreachable or paused again.

Vercel → Logs, filtered to `/api/stripe/webhook`, will show the thrown message.

### Rows exist but content stays locked (15)

Access is a client-side check against `/api/access?slug=…`. Open that URL
directly while signed in and see what it returns.

- `{"full":false}` with an entitlement row present → the row's `series_slug`
  does not match the slug you are viewing.
- A 401 → the browser session is not reaching the API.

Hard-refresh first; the browser caches the access check briefly.

### Return from checkout fails (14)

`success_url` is `/series/<slug>/<first paid episode>?session_id=…`, and
`/api/unlock/confirm` verifies that `session_id` **server-side** before the
client honours it. A blank or errored return page means confirm rejected the
session — check its response. Access does not depend on this redirect; if steps
12–13 passed, the content is yours and step 19 will show it.

---

## After the test

1. **Record the result here** — this file is the evidence, not a chat message.
2. Decide whether to refund. Refunding exercises `charge.refunded` →
   `REVOKE` → entitlement removal, which has also never been observed. If you
   do, verify the `entitlements` row disappears.
3. **Do not delete the `purchases` row.** It is the immutable ledger.
4. If everything passed, this is the go signal for the consolidated TestFlight
   build — with the caveat that iOS commerce is StoreKit, a **separate** path
   this test does not touch, and 12 of its 86 products are still unprovisioned.

---

## What this test does not prove

- **iOS purchases.** Apple StoreKit is a different code path with its own
  server routes. This is the web/Stripe loop only.
- **Refunds, revocation, restore, account deletion.** All unobserved.
- **Any of the 12 unprovisioned Apple products**, which cannot be bought on iOS
  at all until they exist in App Store Connect.
