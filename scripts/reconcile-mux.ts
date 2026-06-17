#!/usr/bin/env tsx
/**
 * Mux Mapping Reconciliation Script
 *
 * Compares the current mux-map.ts mapping against the actual Mux asset library
 * to find drift, orphans, duplicates, and suspicious mappings.
 *
 * Usage:
 *   npx tsx scripts/reconcile-mux.ts           # uses cached assets if available
 *   npx tsx scripts/reconcile-mux.ts --refresh  # force re-fetch from Mux API
 *
 * Output:
 *   scripts/out/mux-assets.json       — raw Mux asset pull
 *   scripts/out/reconcile-report.md   — human-readable report
 *   scripts/out/reconcile-report.csv  — spreadsheet-friendly summary
 *
 * READ-ONLY: does NOT modify mux-map.ts, catalog.ts, or any app code.
 */

import * as fs from "fs";
import * as path from "path";

const OUT_DIR = path.join(__dirname, "out");
const ASSETS_CACHE = path.join(OUT_DIR, "mux-assets.json");
const REPORT_MD = path.join(OUT_DIR, "reconcile-report.md");
const REPORT_CSV = path.join(OUT_DIR, "reconcile-report.csv");

// ---------- Types ----------

interface MuxAsset {
  asset_id: string;
  playback_id: string;
  duration: number;
  created_at: string;
  status: string;
  aspect_ratio: string;
  passthrough: string;
}

interface MappedEpisode {
  episode: number;
  playbackId: string;
  duration: number;
}

interface SeriesInfo {
  slug: string;
  declaredEpisodeCount: number;
  mappedEpisodes: MappedEpisode[];
}

// ---------- Step 1: Pull Mux Assets ----------

async function pullMuxAssets(forceRefresh: boolean): Promise<MuxAsset[]> {
  if (!forceRefresh && fs.existsSync(ASSETS_CACHE)) {
    console.log("[Reconcile] Using cached mux-assets.json");
    return JSON.parse(fs.readFileSync(ASSETS_CACHE, "utf8"));
  }

  const tokenId = process.env.MUX_TOKEN_ID;
  const tokenSecret = process.env.MUX_TOKEN_SECRET;

  if (!tokenId || !tokenSecret) {
    console.error("ERROR: MUX_TOKEN_ID and MUX_TOKEN_SECRET must be set in environment.");
    console.error("Run: source .env.local && npx tsx scripts/reconcile-mux.ts");
    process.exit(1);
  }

  console.log("[Reconcile] Fetching all Mux assets (this may take a minute)...");

  const Mux = (await import("@mux/mux-node")).default;
  const client = new Mux({ tokenId, tokenSecret });

  const allAssets: MuxAsset[] = [];
  let page = 1;

  while (true) {
    const resp = await client.video.assets.list({ limit: 100, page });
    const data = resp.data || [];
    if (data.length === 0) break;

    for (const asset of data) {
      const pid = asset.playback_ids?.[0]?.id;
      if (!pid) continue;
      allAssets.push({
        asset_id: asset.id,
        playback_id: pid,
        duration: Math.round(asset.duration || 0),
        created_at: new Date((asset.created_at as number) * 1000).toISOString(),
        status: asset.status || "unknown",
        aspect_ratio: asset.aspect_ratio || "unknown",
        passthrough: (asset as Record<string, unknown>).passthrough as string || "",
      });
    }

    process.stdout.write(`  Page ${page} — ${allAssets.length} assets collected\r`);
    page++;
    if (data.length < 100) break;
  }

  console.log(`\n[Reconcile] Total Mux assets: ${allAssets.length}`);
  fs.writeFileSync(ASSETS_CACHE, JSON.stringify(allAssets, null, 2));
  console.log(`[Reconcile] Saved to ${ASSETS_CACHE}`);

  return allAssets;
}

// ---------- Step 2: Load Current Mapping + Catalog ----------

function loadMapping(): { series: SeriesInfo[]; allMappedPlaybackIds: Set<string> } {
  const mapPath = path.join(__dirname, "..", "lib", "mux-map.ts");
  const catalogPath = path.join(__dirname, "..", "lib", "catalog.ts");
  const mapContent = fs.readFileSync(mapPath, "utf8");
  const catalogContent = fs.readFileSync(catalogPath, "utf8");

  // Extract series from catalog
  const slugs: string[] = [];
  const epCounts: number[] = [];
  const statuses: string[] = [];

  for (const m of catalogContent.matchAll(/slug: "([^"]+)"/g)) slugs.push(m[1]);
  for (const m of catalogContent.matchAll(/episodeCount: (\d+)/g)) epCounts.push(parseInt(m[1]));
  for (const m of catalogContent.matchAll(/status: "([^"]+)"/g)) statuses.push(m[1]);

  // Extract mapped episodes from mux-map
  const series: SeriesInfo[] = [];
  const allMappedPlaybackIds = new Set<string>();

  for (let i = 0; i < slugs.length; i++) {
    const slug = slugs[i];
    const declaredEpisodeCount = epCounts[i] || 0;

    // Find this slug's block in mux-map
    const blockRegex = new RegExp(`"${slug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}":\\s*\\[([\\s\\S]*?)\\]`, "m");
    const blockMatch = mapContent.match(blockRegex);

    const mappedEpisodes: MappedEpisode[] = [];
    if (blockMatch) {
      for (const epMatch of blockMatch[1].matchAll(/episode: (\d+), playbackId: "([^"]+)", duration: (\d+)/g)) {
        const ep: MappedEpisode = {
          episode: parseInt(epMatch[1]),
          playbackId: epMatch[2],
          duration: parseInt(epMatch[3]),
        };
        mappedEpisodes.push(ep);
        allMappedPlaybackIds.add(ep.playbackId);
      }
    }

    series.push({ slug, declaredEpisodeCount, mappedEpisodes });
  }

  return { series, allMappedPlaybackIds };
}

// ---------- Step 3: Reconcile ----------

interface ReconcileResult {
  totalAssets: number;
  totalMapped: number;
  totalUnmapped: number;
  unmappedAssets: MuxAsset[];
  countMismatches: { slug: string; declared: number; mapped: number }[];
  duplicatePlaybackIds: { playbackId: string; episodes: string[] }[];
  orphanEpisodes: { slug: string; episode: number; playbackId: string }[];
  durationOutliers: { slug: string; episode: number; duration: number; median: number }[];
  boundaryInfo: { slug: string; firstPid: string; firstDur: number; firstCreated: string; lastPid: string; lastDur: number; lastCreated: string }[];
  sequenceFlags: { slug: string; reason: string }[];
  seriesDetails: SeriesInfo[];
}

function reconcile(assets: MuxAsset[], mapping: { series: SeriesInfo[]; allMappedPlaybackIds: Set<string> }): ReconcileResult {
  const { series, allMappedPlaybackIds } = mapping;
  const assetByPid = new Map<string, MuxAsset>();
  for (const a of assets) assetByPid.set(a.playback_id, a);

  const allAssetPids = new Set(assets.map(a => a.playback_id));

  // Unmapped assets
  const unmappedAssets = assets.filter(a => !allMappedPlaybackIds.has(a.playback_id));

  // Count mismatches
  const countMismatches: ReconcileResult["countMismatches"] = [];
  for (const s of series) {
    if (s.declaredEpisodeCount > 0 && s.mappedEpisodes.length !== s.declaredEpisodeCount) {
      countMismatches.push({ slug: s.slug, declared: s.declaredEpisodeCount, mapped: s.mappedEpisodes.length });
    }
  }

  // Duplicate playback IDs
  const pidCount = new Map<string, string[]>();
  for (const s of series) {
    for (const ep of s.mappedEpisodes) {
      const key = ep.playbackId;
      if (!pidCount.has(key)) pidCount.set(key, []);
      pidCount.get(key)!.push(`${s.slug}/ep${ep.episode}`);
    }
  }
  const duplicatePlaybackIds = Array.from(pidCount.entries())
    .filter(([, eps]) => eps.length > 1)
    .map(([playbackId, episodes]) => ({ playbackId, episodes }));

  // Orphan episodes (mapped to non-existent Mux asset)
  const orphanEpisodes: ReconcileResult["orphanEpisodes"] = [];
  for (const s of series) {
    for (const ep of s.mappedEpisodes) {
      if (!allAssetPids.has(ep.playbackId)) {
        orphanEpisodes.push({ slug: s.slug, episode: ep.episode, playbackId: ep.playbackId });
      }
    }
  }

  // Duration outliers (per series)
  const durationOutliers: ReconcileResult["durationOutliers"] = [];
  for (const s of series) {
    if (s.mappedEpisodes.length < 3) continue;
    const durations = s.mappedEpisodes.map(e => {
      const asset = assetByPid.get(e.playbackId);
      return asset?.duration || e.duration;
    }).sort((a, b) => a - b);
    const median = durations[Math.floor(durations.length / 2)];
    for (const ep of s.mappedEpisodes) {
      const asset = assetByPid.get(ep.playbackId);
      const dur = asset?.duration || ep.duration;
      if (dur > median * 2.5 || dur < median * 0.25) {
        durationOutliers.push({ slug: s.slug, episode: ep.episode, duration: dur, median });
      }
    }
  }

  // Boundary info
  const boundaryInfo: ReconcileResult["boundaryInfo"] = [];
  for (const s of series) {
    if (s.mappedEpisodes.length === 0) continue;
    const first = s.mappedEpisodes[0];
    const last = s.mappedEpisodes[s.mappedEpisodes.length - 1];
    const firstAsset = assetByPid.get(first.playbackId);
    const lastAsset = assetByPid.get(last.playbackId);
    boundaryInfo.push({
      slug: s.slug,
      firstPid: first.playbackId.slice(0, 20) + "...",
      firstDur: firstAsset?.duration || first.duration,
      firstCreated: firstAsset?.created_at || "unknown",
      lastPid: last.playbackId.slice(0, 20) + "...",
      lastDur: lastAsset?.duration || last.duration,
      lastCreated: lastAsset?.created_at || "unknown",
    });
  }

  // Sequence continuity (created_at should be monotonic within a series)
  const sequenceFlags: ReconcileResult["sequenceFlags"] = [];
  for (const s of series) {
    if (s.mappedEpisodes.length < 2) continue;
    let outOfOrder = 0;
    for (let i = 1; i < s.mappedEpisodes.length; i++) {
      const prev = assetByPid.get(s.mappedEpisodes[i - 1].playbackId);
      const curr = assetByPid.get(s.mappedEpisodes[i].playbackId);
      if (prev && curr && prev.created_at > curr.created_at) {
        outOfOrder++;
      }
    }
    if (outOfOrder > 0) {
      sequenceFlags.push({ slug: s.slug, reason: `${outOfOrder} out-of-order created_at pairs` });
    }
  }

  return {
    totalAssets: assets.length,
    totalMapped: allMappedPlaybackIds.size,
    totalUnmapped: unmappedAssets.length,
    unmappedAssets,
    countMismatches,
    duplicatePlaybackIds,
    orphanEpisodes,
    durationOutliers,
    boundaryInfo,
    sequenceFlags,
    seriesDetails: series,
  };
}

// ---------- Step 4: Generate Reports ----------

function generateReport(r: ReconcileResult): void {
  const lines: string[] = [];

  lines.push("# Mux Mapping Reconciliation Report");
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push("");

  // Summary
  lines.push("## Summary");
  lines.push(`| Metric | Count |`);
  lines.push(`|--------|-------|`);
  lines.push(`| Total Mux assets | ${r.totalAssets} |`);
  lines.push(`| Total mapped episodes | ${r.totalMapped} |`);
  lines.push(`| Unmapped assets | ${r.totalUnmapped} |`);
  lines.push(`| Series with count mismatches | ${r.countMismatches.length} |`);
  lines.push(`| Duplicate playback IDs | ${r.duplicatePlaybackIds.length} |`);
  lines.push(`| Orphan episodes (dead mapping) | ${r.orphanEpisodes.length} |`);
  lines.push(`| Duration outliers | ${r.durationOutliers.length} |`);
  lines.push(`| Series with sequence flags | ${r.sequenceFlags.length} |`);
  lines.push("");

  // HIGH CONFIDENCE PROBLEMS
  lines.push("## HIGH CONFIDENCE PROBLEMS");
  lines.push("These are definitely wrong and need human review.");
  lines.push("");

  if (r.orphanEpisodes.length > 0) {
    lines.push("### Orphan Episodes (mapped to non-existent Mux assets)");
    for (const o of r.orphanEpisodes) {
      lines.push(`- **${o.slug}** EP${o.episode}: playbackId \`${o.playbackId.slice(0, 30)}...\` does NOT exist in Mux`);
    }
    lines.push("");
  } else {
    lines.push("### Orphan Episodes: NONE (all mapped playback IDs exist in Mux)");
    lines.push("");
  }

  if (r.duplicatePlaybackIds.length > 0) {
    lines.push("### Duplicate Playback IDs (same video on multiple episodes)");
    for (const d of r.duplicatePlaybackIds) {
      lines.push(`- \`${d.playbackId.slice(0, 30)}...\` mapped to: ${d.episodes.join(", ")}`);
    }
    lines.push("");
  } else {
    lines.push("### Duplicate Playback IDs: NONE (each video maps to exactly one episode)");
    lines.push("");
  }

  if (r.countMismatches.length > 0) {
    lines.push("### Episode Count Mismatches");
    for (const m of r.countMismatches) {
      lines.push(`- **${m.slug}**: declared ${m.declared} episodes, mapped ${m.mapped}`);
    }
    lines.push("");
  } else {
    lines.push("### Episode Count Mismatches: NONE (all series have correct episode counts)");
    lines.push("");
  }

  // WORTH SPOT-CHECKING
  lines.push("## WORTH SPOT-CHECKING");
  lines.push("Probably fine, but a human should eyeball these.");
  lines.push("");

  if (r.durationOutliers.length > 0) {
    lines.push("### Duration Outliers (>2.5x or <0.25x series median)");
    for (const o of r.durationOutliers.slice(0, 20)) {
      lines.push(`- **${o.slug}** EP${o.episode}: ${o.duration}s (median: ${o.median}s)`);
    }
    if (r.durationOutliers.length > 20) lines.push(`- ... and ${r.durationOutliers.length - 20} more`);
    lines.push("");
  }

  if (r.sequenceFlags.length > 0) {
    lines.push("### Sequence Continuity Flags (created_at not monotonic)");
    for (const f of r.sequenceFlags) {
      lines.push(`- **${f.slug}**: ${f.reason}`);
    }
    lines.push("");
  }

  // Unmapped assets appendix
  lines.push("## Appendix: Unmapped Assets");
  lines.push(`${r.totalUnmapped} Mux assets are NOT mapped to any episode.`);
  lines.push("");
  lines.push("| Asset ID (first 20) | Duration | Created At | Status |");
  lines.push("|---------------------|----------|------------|--------|");
  for (const a of r.unmappedAssets.slice(0, 50)) {
    lines.push(`| ${a.asset_id.slice(0, 20)}... | ${a.duration}s | ${a.created_at.split("T")[0]} | ${a.status} |`);
  }
  if (r.unmappedAssets.length > 50) lines.push(`| ... ${r.unmappedAssets.length - 50} more | | | |`);

  fs.writeFileSync(REPORT_MD, lines.join("\n"));
  console.log(`[Reconcile] Report: ${REPORT_MD}`);

  // CSV
  const csvLines: string[] = [];
  csvLines.push("slug,declared_episodes,mapped_episodes,match,first_duration,last_duration,sequence_flags,duration_outliers");
  for (const s of r.seriesDetails) {
    const flags = r.sequenceFlags.find(f => f.slug === s.slug);
    const outliers = r.durationOutliers.filter(o => o.slug === s.slug).length;
    const firstDur = s.mappedEpisodes[0]?.duration || 0;
    const lastDur = s.mappedEpisodes[s.mappedEpisodes.length - 1]?.duration || 0;
    csvLines.push(`${s.slug},${s.declaredEpisodeCount},${s.mappedEpisodes.length},${s.declaredEpisodeCount === s.mappedEpisodes.length ? "OK" : "MISMATCH"},${firstDur},${lastDur},${flags ? flags.reason : "none"},${outliers}`);
  }
  fs.writeFileSync(REPORT_CSV, csvLines.join("\n"));
  console.log(`[Reconcile] CSV: ${REPORT_CSV}`);
}

// ---------- Step 5: Print Summary ----------

function printSummary(r: ReconcileResult): void {
  console.log("\n" + "=".repeat(60));
  console.log("  MUX MAPPING RECONCILIATION — SUMMARY");
  console.log("=".repeat(60));
  console.log(`  Total Mux assets:        ${r.totalAssets}`);
  console.log(`  Total mapped episodes:   ${r.totalMapped}`);
  console.log(`  Unmapped assets:         ${r.totalUnmapped}`);
  console.log(`  Orphan episodes:         ${r.orphanEpisodes.length}`);
  console.log(`  Duplicate playback IDs:  ${r.duplicatePlaybackIds.length}`);
  console.log(`  Count mismatches:        ${r.countMismatches.length}`);
  console.log(`  Duration outliers:       ${r.durationOutliers.length}`);
  console.log(`  Sequence flags:          ${r.sequenceFlags.length}`);
  console.log("=".repeat(60));

  if (r.orphanEpisodes.length === 0 && r.duplicatePlaybackIds.length === 0 && r.countMismatches.length === 0) {
    console.log("\n  HIGH CONFIDENCE PROBLEMS: NONE");
  } else {
    console.log("\n  HIGH CONFIDENCE PROBLEMS:");
    for (const o of r.orphanEpisodes) console.log(`    ORPHAN: ${o.slug} EP${o.episode}`);
    for (const d of r.duplicatePlaybackIds) console.log(`    DUPE: ${d.playbackId.slice(0, 20)}... → ${d.episodes.join(", ")}`);
    for (const m of r.countMismatches) console.log(`    COUNT: ${m.slug} (${m.declared} vs ${m.mapped})`);
  }

  // Top 10 suspicious
  const suspicious = r.seriesDetails
    .map(s => ({
      slug: s.slug,
      score: (r.countMismatches.some(m => m.slug === s.slug) ? 10 : 0) +
             (r.sequenceFlags.some(f => f.slug === s.slug) ? 5 : 0) +
             r.durationOutliers.filter(o => o.slug === s.slug).length,
    }))
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  if (suspicious.length > 0) {
    console.log("\n  TOP 10 SERIES TO SPOT-CHECK:");
    for (const s of suspicious) {
      console.log(`    ${s.slug} (suspicion score: ${s.score})`);
    }
  }

  console.log("\n  NOTHING WAS CHANGED. Fixing the map is a separate step.");
  console.log("  Full report: scripts/out/reconcile-report.md");
  console.log("");
}

// ---------- Main ----------

async function main() {
  const forceRefresh = process.argv.includes("--refresh");

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const assets = await pullMuxAssets(forceRefresh);
  const mapping = loadMapping();
  const result = reconcile(assets, mapping);
  generateReport(result);
  printSummary(result);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
