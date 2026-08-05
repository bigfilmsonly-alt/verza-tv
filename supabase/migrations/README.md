# Supabase migration operations

Last reconciled: **2026-08-05**.

The current production database has migrations `009`–`014` applied and
independently read back. Migration 015 is also applied; structural, RLS, RPC,
privilege, and independent-source preservation readbacks passed. Do not rerun
or edit an applied migration merely
because an older guide says “apply once.” A fresh environment applies the full
ordered migration history through the approved Supabase workflow.

## Current payment-critical order

| Migration | Purpose |
| --- | --- |
| `009_preserve_sales_ledger.sql` | Preserve historical creator financial rows across deletion |
| `010_payment_integrity.sql` | Webhook event claims, provider uniqueness, tax/Refund fields, constraints, row-locked payment/access RPCs |
| `011_rls_least_privilege.sql` | Least-privilege grants/RLS and creator constraints |
| `012_payment_account_tombstones.sql` | Minimal deleted-account/provider identity and atomic Customer coalescing |
| `013_stripe_dispute_ledger.sql` | Ordered, provider-idempotent Dispute reconciliation |
| `014_payment_notices_and_content_rls.sql` | VIP Terms/notice evidence and fail-closed optional-content RLS |
| `015_apple_iap_series_unlocks.sql` | Append/update-only Apple purchase/notification ledgers, independent Stripe/Apple/manual entitlement sources, monotonic adverse-event reconciliation, and orphan-only deleted-account restore |

These migrations must be present before matching payment/webhook code. Run the
rollback-only database suite before deployment:

```bash
npm run test:payments:db
```

The suite applies the critical migrations twice inside a transaction, tests
constraints/RLS/RPC/adverse-event behavior—including Stripe/Apple/manual
source preservation, equal-clock refund safety, alternate Apple originals,
failed/successful deletion, explicit orphan rebind, notification claims, and
no-delete ledger privileges—and rolls back. It is not a
production mutation.

For a fresh/replacement environment, use the approved linked operator profile
and stop unless 015 is the only pending migration:

```bash
npx supabase@2.67.1 migration list --linked
npx supabase@2.67.1 db push --linked --dry-run
npx supabase@2.67.1 db push --linked
npx supabase@2.67.1 migration list --linked
npm run test:payments:db
```

Never use `--include-all` to force through unexpected drift. This checkout was
not Supabase-CLI-linked during the documentation audit; any future link must use
the approved external operator profile without placing project credentials in
source or transcript. Production migration/readback used the approved release
path and is complete.

## Content-table status

Migration `002` introduced optional Supabase content tables, but the code-backed
catalog remains production authority. `CONTENT_SOURCE=supabase` is not a safe
simple toggle. Migration `014` fail-closes optional tables that lacked complete
RLS; their existence does not authorize direct client access to protected Mux
capabilities.

## Safety rules

- Never copy service-role/database credentials into commands, docs, tickets, or
  screenshots.
- Never rewrite migration history to make a current database look clean.
- Resolve drift with read-only schema evidence and a new reviewed migration.
- Preserve purchases, entitlements, Charges, Refunds, Disputes, provider IDs,
  creator financial rows, deletion tombstones, Apple originals, and Apple
  notification evidence.
- Never delete/recycle an Apple product or ledger ID. Disable new purchase
  preflight while continuing transaction/restore/adverse-event processing.
- Never use a migration to manufacture access for an unmatched historical
  payment without independently verified ownership and an approved recovery
  workflow.

See [`../../docs/reference/DATA-MODEL.md`](../../docs/reference/DATA-MODEL.md)
and [`../../docs/guides/PAYMENTS.md`](../../docs/guides/PAYMENTS.md).
