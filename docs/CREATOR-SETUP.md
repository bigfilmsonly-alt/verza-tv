# Creator Portal — Setup & Go-Live Guide

The full creator pipeline (apply → approve → upload → review → publish → watch →
payouts) is built and deployed. To make it 100% functional in production you
need three manual configuration steps that require credentials this codebase
can't provision on its own:

1. Create a Mux upload token
2. Create a Mux webhook
3. Add the env vars to Vercel + run the database migration

Everything below is dashboard configuration — no code changes required.

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

## 5. Run the database migration

In **Supabase → SQL Editor**, paste and run the full contents of:

```
supabase/migrations/005_creator_pipeline.sql
```

This creates `creators`, `creator_content`, and `creator_sales`, and adds
`role` + `creator_status` columns to `profiles`. Until this runs, every creator
route returns empty / 401.

---

## 6. Verify end-to-end (5-minute smoke test)

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
4. **Publish** — edit details/pricing → **Submit for review** → approve the
   title in `/admin/review` → it goes live at `/watch/<handle>/<title>`.
5. **PPV (optional)** — set a price, publish, open the watch page in an
   incognito window → you hit the paywall → Stripe checkout. After paying, the
   Stripe webhook writes the `creator_sales` 80/20 split row and grants the
   viewer's entitlement.

---

## What breaks without each piece

| Missing                                | Symptom                                                             |
| -------------------------------------- | ------------------------------------------------------------------ |
| `MUX_TOKEN_ID` / `MUX_TOKEN_SECRET`    | `/api/creator/upload` returns **503**; dashboard shows "not enabled" |
| Mux webhook not configured             | Uploads still process via poll fallback, but slower/less reliable  |
| `MUX_WEBHOOK_SECRET`                   | Webhook works but unsigned (lower security)                        |
| Migration 005 not run                  | All creator routes return empty / pending                          |

---

## Admin accounts

The review queue at `/admin/review` is gated to these emails (see
`lib/admin.ts`):

- `jotham@bigfilms.tv`
- `alan@verzatv.com`
- `jothamhall@gmail.com`

## Reference — key files

- `app/api/creator/*` — apply, upload, content CRUD, submit, analytics
- `app/api/admin/creators` — approve/reject creator **applications**
- `app/api/admin/review` — approve/reject submitted **titles**
- `app/api/creator-unlock` — PPV checkout (server-side price)
- `app/api/mux/webhook` — Mux asset lifecycle → content status
- `app/api/stripe/webhook` — writes the 80/20 split ledger on creator unlocks
- `components/CreatorDashboard.tsx` — the creator-facing dashboard
- `components/AdminReview.tsx` — the admin review UI
- `components/CreatorWatch.tsx` + `app/watch/[...slug]` — public playback + paywall
- `supabase/migrations/005_creator_pipeline.sql` — schema
