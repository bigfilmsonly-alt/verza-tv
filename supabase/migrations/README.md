# Supabase migration operations

Last reconciled: **2026-08-03**.

The current production database has migrations `009`–`014` applied and
independently read back. Do not rerun or edit an applied migration merely
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

These migrations must be present before matching payment/webhook code. Run the
rollback-only database suite before deployment:

```bash
npm run test:payments:db
```

The suite applies the critical migrations twice inside a transaction, tests
constraints/RLS/RPC/adverse-event behavior, and rolls back. It is not a
production mutation.

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
  creator financial rows, and deletion tombstones.
- Never use a migration to manufacture access for an unmatched historical
  payment without independently verified ownership and an approved recovery
  workflow.

See [`../../docs/reference/DATA-MODEL.md`](../../docs/reference/DATA-MODEL.md)
and [`../../docs/guides/PAYMENTS.md`](../../docs/guides/PAYMENTS.md).
