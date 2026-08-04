# Mux audit and projection scripts

Last reconciled: **2026-08-03**. Current architecture has a complete audit map,
a generated client-safe projection, and a server-only signed correspondence.
Never use the older reconciliation workflow alone as release evidence.

## Current verified snapshot

| Set | Rows |
| --- | ---: |
| Complete mapped rows | 4,262 |
| Live-title rows | 4,212 |
| Intentionally public/free | 459 |
| Paid live | 3,753 |
| Coming soon | 50 |
| Withheld from clients | 3,803 |
| Paid-live signed counterparts | 3,753 |

The final live audit scanned 5,220 Mux assets with zero missing mapped IDs,
duplicates, free/paid overlap, or catalog-orphan series. Numbers are dated;
rerun non-mutating audits before a release decision.

## Safe routine commands

```bash
# Exact generated public-projection audit; does not write.
npm run mux:public:audit

# Offline signed-migration/parser self-test; no provider call.
npm run mux:signed:self-test

# Live Mux inventory readback; does not mutate.
npm run mux:signed:audit

# Static/client capability boundary regression.
npm run test:playback-security

# Mux creator-webhook fail-closed/signature contract.
npm run test:mux-webhook-security
```

The public generator uses the shared AST catalog parser. Regex parsing is
forbidden: a previous regex skipped two entries when comments preceded `slug`
and incorrectly withheld 25 free playback IDs.

## Deliberate source generation

```bash
npm run mux:public:generate

node --env-file=.env.local scripts/migrate-mux-signed-playback.mjs \
  --generate-map
```

Both commands write generated source and require review, byte-sync to native
where designated, and all client/security tests. The signed-map generator
refuses incomplete coverage and writes atomically.

## Guarded provider mutation

The current 3,753-row paid-live signed inventory is complete. Only a fresh audit
that proves a newly added paid-live asset lacks a signed counterpart justifies:

```bash
node --env-file=.env.local scripts/migrate-mux-signed-playback.mjs \
  --apply-add-signed-ids --confirm-add-signed-ids
```

This is an add-only live Mux mutation, not a routine verification command. It
does not create signing keys or retire public IDs. Existing signed IDs are
reused, ambiguous writes are reread, and progress is checkpointed under ignored
`scripts/out/`.

No script in this repository removes legacy public IDs. Live native 1.2 depends
on those paid IDs, so retirement is a separate post-2.0 forced-update/drain
decision with explicit owner outage-risk acceptance.

## Legacy reconciliation script

`scripts/reconcile-mux.ts` may still produce raw inventory/report artifacts
under ignored `scripts/out/`. Treat its cached asset totals and reports as dated
diagnostics. It does not replace:

- AST catalog classification;
- exact public-projection generation;
- signed-counterpart coverage;
- browser/Expo/Hermes/EAS capability scans; or
- production `policy=signed` canary/readback.

No script may print secrets, JWTs, signed URLs, reviewer credentials, or
provider/customer PII. See [`../docs/guides/MUX.md`](../docs/guides/MUX.md).
