# Mux Mapping Reconciliation

Verifies the `lib/mux-map.ts` episode→playback mappings against the actual Mux asset library.

## Usage

```bash
# First run (fetches all assets from Mux API, ~45 pages):
source .env.local
npx tsx scripts/reconcile-mux.ts

# Re-analyze without re-fetching (uses cached mux-assets.json):
npx tsx scripts/reconcile-mux.ts

# Force fresh pull from Mux API:
npx tsx scripts/reconcile-mux.ts --refresh
```

## Output

- `scripts/out/mux-assets.json` — raw Mux asset pull (all ~4,472 assets)
- `scripts/out/reconcile-report.md` — human-readable report with problems + spot-checks
- `scripts/out/reconcile-report.csv` — spreadsheet summary (one row per series)

## What It Checks

1. **Count check** — declared episodeCount vs mapped episodes per series
2. **Coverage** — total mapped vs total assets, lists unmapped assets
3. **Duplicates** — any playback ID mapped to multiple episodes
4. **Orphans** — any mapped playback ID that doesn't exist in Mux (dead/broken)
5. **Duration outliers** — episodes with unusual duration for their series
6. **Boundary check** — first/last episode timestamps per series
7. **Sequence continuity** — whether created_at is monotonic within each series

## READ-ONLY

This script does NOT modify `lib/mux-map.ts` or any content data. It only reads and reports.
