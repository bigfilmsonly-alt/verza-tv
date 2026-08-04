# Creator Portal — Setup & Go-Live Guide

> **Deferred web-only guide, reconciled 2026-08-03.** This is not part of the
> iOS 2.0 launch. Native iOS excludes `/watch/*`, `/creator`, `/studio`, and
> `/admin/*` before query/render, and ASC User-Generated Content remains No.
> Creator PPV is server-disabled. Do not follow this guide to turn on creator
> sales or expose UGC in the submitted binary.

The web source contains an apply → approve → upload → review → publish pipeline,
but production readiness and deployment must be re-audited rather than inferred
from this older setup sequence. Provider credentials and database changes require
authorized operations and post-deploy readback:

1. Create a Mux upload token
2. Create a Mux webhook
3. Add the env vars to Vercel + run the database migration

The steps below cover provider plumbing only. They do not establish content
rights, moderation/report/block controls, signed paid playback, payout/tax
operations, creator ownership, legal approval, or App Store compliance.

---

## 1. Mux — create the upload token

1. Go to **dashboard.mux.com → Settings → Access Tokens → Generate new token**.
2. Environment: select your **production** environment.
3. Permissions: check **Mux Video → Read and Write** (write scope is required to
   create direct uploads). Leave Mux Data unchecked.
4. Click **Generate token**. Mux shows the **Token ID** and **Token Secret**
   **once** — copy both now.

| Mux value     | Env var            |
| ------------- | ------------------ |
| Token ID      | `MUX_TOKEN_ID`     |
| Token Secret  | `MUX_TOKEN_SECRET` |

---

## 2. Mux — create the webhook + signing secret

1. In Mux: **Settings → Webhooks → Create new webhook**.
2. Environment: the **same production environment** as the token in step 1.
3. URL:
   ```
   https://www.verzatv.com/api/mux/webhook
   ```
4. Click **Create**. Mux generates a **Signing Secret** — copy it.
5. Events: Mux delivers all asset events by default. The route only acts on
   `video.asset.created`, `video.asset.ready`, and `video.asset.errored`, so no
   event filtering is needed.

| Mux value      | Env var              |
| -------------- | -------------------- |
| Signing Secret | `MUX_WEBHOOK_SECRET` |

> The webhook route still works without `MUX_WEBHOOK_SECRET` — it skips
> signature verification and parses the body directly. Set it for production
> security.

---

## 3. Vercel — add the env vars

**Vercel Dashboard → project `verza-tv` → Settings → Environment Variables.**
Set **Environment = Production** for each (add **Preview** too if you want
uploads to work on preview deploys):

| Name                 | Value                      |
| -------------------- | -------------------------- |
| `MUX_TOKEN_ID`       | Token ID (step 1)          |
| `MUX_TOKEN_SECRET`   | Token Secret (step 1)      |
| `MUX_WEBHOOK_SECRET` | Signing Secret (step 2)    |

Or via the CLI from the repo root (each prompts you to paste the value):

```bash
npx vercel env add MUX_TOKEN_ID production
npx vercel env add MUX_TOKEN_SECRET production
npx vercel env add MUX_WEBHOOK_SECRET production
```

### Confirm these already exist

The webhook and watch routes depend on these (they're used elsewhere on the
site, so they should already be set):

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_SITE_URL` = `https://www.verzatv.com`

List them with:

```bash
npx vercel env ls
```

---

## 4. Redeploy so the new vars take effect

Env vars only apply to **new** deployments:

```bash
npx vercel deploy --prod
```

---

## 5. Verify database migration state

Migration 005 is historical and later migrations `009`–`014` add preservation,
constraints, and RLS. Do not paste or rerun one migration in production merely
because this guide mentions it. First use read-only schema/migration evidence
and the rollback-only database suite. A fresh environment applies the complete
ordered migration set through the approved migration workflow.

The original creator schema source is:

```
supabase/migrations/005_creator_pipeline.sql
```

It creates `creators`, `creator_content`, and `creator_sales` and adds profile
fields. Migration `009` preserves historical sale rows across deletion;
migration `011` hardens creator RLS/constraints.

---

## 6. Deferred internal smoke test

1. **Uploads enabled** — sign in, open `/studio`. If you see "Uploads aren't
   enabled yet (missing Mux token)" then step 3/4 didn't take. If you see the
   upload box, you're good.
2. **Approve a creator** — apply at `/studio`, then from an admin account open
   `/admin/review` → **Creator applications** → **Approve creator**. Reload
   `/studio` → you now see the approved dashboard.
3. **Upload** — drop an MP4. The progress bar runs, then status moves
   `uploading → processing → ready`. To confirm the webhook specifically, check
   **Mux → Settings → Webhooks → your webhook → recent deliveries** for `200`
   responses. (Status also advances via a poll fallback even if the webhook is
   misconfigured.)
4. **Stop before public publishing or payment.** Publication requires content
   rights, moderation/report/block operations, signed creator playback, and
   production approval.
5. **Do not test PPV.** `/api/creator-unlock` intentionally returns 503. No
   current smoke test is authorized to charge, Refund, or manufacture a creator
   entitlement.

---

## What breaks without each piece

| Missing                                | Symptom                                                             |
| -------------------------------------- | ------------------------------------------------------------------ |
| `MUX_TOKEN_ID` / `MUX_TOKEN_SECRET`    | `/api/creator/upload` returns **503**; dashboard shows "not enabled" |
| Mux webhook not configured             | Event-driven ingestion is unavailable; do not assume a poll fallback makes the deferred pipeline launch-ready |
| `MUX_WEBHOOK_SECRET`                   | Deployed route returns 503 and has no unsigned fallback; production readback confirms this fail-closed state, so keep creator ingestion/launch deferred until a real secret and signed-event canary exist |
| Migration 005 not run                  | All creator routes return empty / pending                          |

---

## Admin accounts

The review queue requires a verified authenticated user plus the server-side
`ADMIN_EMAILS` allowlist. Admin identifiers are intentionally not copied into
Markdown. Store and rotate them through the approved configuration channel;
never treat a client-supplied email as authorization.

## Reference — key files

- `app/api/creator/*` — apply, upload, content CRUD, submit, analytics
- `app/api/admin/creators` — approve/reject creator **applications**
- `app/api/admin/review` — approve/reject submitted **titles**
- `app/api/creator-unlock` — disabled PPV endpoint (503)
- `app/api/mux/webhook` — Mux asset lifecycle → content status
- `app/api/stripe/webhook` — writes the 80/20 split ledger on creator unlocks
- `components/CreatorDashboard.tsx` — the creator-facing dashboard
- `components/AdminReview.tsx` — the admin review UI
- `components/CreatorWatch.tsx` + `app/watch/[...slug]` — public playback + paywall
- `supabase/migrations/005_creator_pipeline.sql` — schema

Focused gate: `npm run test:mux-webhook-security`. It requires awaited raw-body
signature verification, 503 for missing secret, 400 for invalid signature, 500
for lookup/update failure, and no unsigned fallback. Run it plus typecheck,
lint, build, deploy, and production invalid/missing-signature readback before
enabling creator uploads. Missing-secret production readback already returns
503; a real-secret signed-event canary remains mandatory before enablement.
