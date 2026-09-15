#!/usr/bin/env node

/**
 * Recover ORIGINAL Mux masters for one title.
 *
 * Mux keeps the file that was uploaded. `master_access: "temporary"` asks it to
 * expose that file for roughly 24 hours at a signed mezzanine URL. Proven on
 * 2026-09-15 against you-me-and-lies_EN_S01_E01: the returned mezzanine.mp4 was
 * 2160x3840 h264 High at 26.6 Mbps, 348.6 MB for 108 seconds, matching the
 * asset's own input-info exactly. That is the master, not a stream rendition.
 *
 * WHAT THIS IS FOR
 * Short-form marketing needs the master. The HLS ladder the player consumes is
 * roughly an order of magnitude smaller and already compressed for delivery;
 * re-cutting it and re-encoding for social stacks loss on loss.
 *
 * SAFETY
 *  - DRY RUN BY DEFAULT. Enabling master access is a real mutation against a
 *    production Mux asset, so it requires --confirm-enable-master-access.
 *  - Touches ONLY the assets of the one --title you name.
 *  - Never changes playback IDs, policies, or anything the app serves.
 *  - Never prints or writes a signed URL. They are credentials with a clock on
 *    them; the repo rule is that signed URLs stay out of source, logs and docs.
 *  - Credentials come from the environment, never from source.
 *  - Resumable and idempotent: an episode already downloaded and verified is
 *    skipped, so an interrupted run costs nothing to restart.
 *
 * USAGE
 *   node --env-file=.env.local scripts/recover-masters.mjs --title <slug>
 *   node --env-file=.env.local scripts/recover-masters.mjs --title <slug> \
 *        --confirm-enable-master-access
 *
 * Optional: --out <dir>  --limit <n>  --revert  --status
 */

import { readFile, writeFile, mkdir, rename, stat, unlink, statfs } from "node:fs/promises";
import { createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import { resolve, join } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import process from "node:process";

const execFileAsync = promisify(execFile);
const ROOT = resolve(import.meta.dirname, "..");
const MUX_API = "https://api.mux.com";

/* Mux prepares each master on demand. Observed ~36s for a 108s UHD clip, so a
   full title is a queued job measured in tens of minutes, not a single call. */
const POLL_INTERVAL_MS = 6_000;
const MAX_POLLS = 60;
const MAX_ATTEMPTS = 4;
/* One at a time on purpose. Every unit of concurrency multiplies both the
   prepare queue and the egress bill, and nothing here is urgent. */
const CONCURRENCY = 1;

/* ------------------------------------------------------------------ */
/*  args                                                               */
/* ------------------------------------------------------------------ */
const argv = process.argv.slice(2);
const flag = (name) => argv.includes(name);
const value = (name, fallback = null) => {
  const i = argv.indexOf(name);
  return i !== -1 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : fallback;
};

const TITLE = value("--title");
const APPLY = flag("--confirm-enable-master-access");
const LIMIT = Number(value("--limit", "0")) || 0;
const STATUS_ONLY = flag("--status");
const REVERT = flag("--revert");
/* Default ON: the original beats Mux's mezzanine wherever one exists. */
const PREFER_SOURCE = !flag("--force-mux-master");

if (!TITLE || flag("--help")) {
  console.log(`
  Recover original Mux masters for ONE title.

    --title <slug>                     required, e.g. the-mistress-trap
    --confirm-enable-master-access     actually mutate + download (default: dry run)
    --out <dir>                        default verza-growth/pilot/<slug>/masters
    --limit <n>                        only the first n episodes
    --status                           print checkpoint state and exit
    --revert                           set master_access back to none for this title
    --force-mux-master                 ignore the original source, use Mux master access

  Credentials come from MUX_TOKEN_ID / MUX_TOKEN_SECRET in the environment.
  Run with: node --env-file=.env.local scripts/recover-masters.mjs --title <slug>
`);
  process.exit(TITLE ? 0 : 1);
}

const OUT_DIR = resolve(ROOT, value("--out", `verza-growth/pilot/${TITLE}/masters`));
const MANIFEST_DIR = resolve(OUT_DIR, "..", "manifest");
const STATE_PATH = join(MANIFEST_DIR, "recovery-state.json");

const ID = process.env.MUX_TOKEN_ID;
const SECRET = process.env.MUX_TOKEN_SECRET;
if (!ID || !SECRET) {
  console.error("  MUX_TOKEN_ID / MUX_TOKEN_SECRET are not set. Use --env-file=.env.local");
  process.exit(1);
}
const AUTH = "Basic " + Buffer.from(`${ID}:${SECRET}`).toString("base64");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ------------------------------------------------------------------ */
/*  Mux                                                                */
/* ------------------------------------------------------------------ */
async function mux(method, path, body, attempt = 1) {
  const res = await fetch(`${MUX_API}${path}`, {
    method,
    headers: { Authorization: AUTH, "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if ((res.status === 429 || res.status >= 500) && attempt < MAX_ATTEMPTS) {
    await sleep(1_500 * 2 ** (attempt - 1));
    return mux(method, path, body, attempt + 1);
  }
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

/* ------------------------------------------------------------------ */
/*  the title's episodes, from the canonical map                       */
/* ------------------------------------------------------------------ */
async function episodesForTitle(slug) {
  const src = await readFile(join(ROOT, "lib/mux-map.ts"), "utf8");
  const block = new RegExp(`^\\s*"${slug}":\\s*\\[([\\s\\S]*?)^\\s*\\],`, "m").exec(src);
  if (!block) throw new Error(`"${slug}" is not in lib/mux-map.ts`);
  const rows = [...block[1].matchAll(
    /\{\s*episode:\s*(\d+),\s*playbackId:\s*"([A-Za-z0-9]+)",\s*duration:\s*(\d+)\s*\}/g,
  )].map((m) => ({ episode: Number(m[1]), playbackId: m[2], duration: Number(m[3]) }));
  if (!rows.length) throw new Error(`No episodes parsed for "${slug}"`);
  return rows.sort((a, b) => a.episode - b.episode);
}

/** Resolve playback id -> asset. Mux has no reverse lookup, so page the list. */
async function assetsByPlaybackId(wanted) {
  const found = new Map();
  for (let page = 1; page <= 200; page += 1) {
    const { status, json } = await mux("GET", `/video/v1/assets?limit=100&page=${page}`);
    if (status !== 200) throw new Error(`Asset list failed: HTTP ${status}`);
    const rows = json.data || [];
    for (const a of rows) {
      for (const p of a.playback_ids || []) {
        if (wanted.has(p.id)) found.set(p.id, a);
      }
    }
    process.stderr.write(`\r  resolving assets ... ${found.size}/${wanted.size}`);
    if (found.size === wanted.size || rows.length < 100) break;
    await sleep(120);
  }
  process.stderr.write("\n");
  return found;
}

/* ------------------------------------------------------------------ */
/*  disk                                                               */
/* ------------------------------------------------------------------ */

/**
 * Refuse to start a download that cannot finish.
 *
 * This is here because it already happened. A 37.4 GB title was started on a
 * volume with 15.6 GB free: 23 episodes landed, then 38 consecutive ENOSPC
 * failures, and the machine was left with 118 MB free, which is its own
 * hazard. The run "succeeded" with exit code 0 while failing 62% of the work.
 *
 * Checking costs one syscall. Running out of disk costs the whole run and
 * endangers the host.
 */
async function freeBytes(dir) {
  try {
    const fs = await statfs(dir);
    return fs.bavail * fs.bsize;
  } catch {
    return null; // unknown: caller decides, never silently assume plenty
  }
}

function gb(n) { return (n / 1e9).toFixed(1); }

/* ------------------------------------------------------------------ */
/*  the ORIGINAL ingest source                                         */
/* ------------------------------------------------------------------ */

/**
 * Mux's "master" is not always the file you uploaded.
 *
 * An asset carrying `max_resolution_tier: 1080p` was DOWNSCALED at ingest and
 * the original was never retained, so master access hands back a derivative.
 * Measured on the-mistress-trap E1: Mux returns 1152x2048 at ~9.3 Mbps / 159 MB,
 * while the file actually ingested was 2160x3840 at 44.4 Mbps / 766 MB.
 * Clipping the derivative would throw away three quarters of the picture before
 * social ever re-encodes it.
 *
 * Assets ingested with `ingest_type: on_demand_url` still record that URL, so
 * when it is a real http(s) location we can fetch the true original instead.
 * That is higher quality, costs no Mux egress, needs no prepare step, and
 * mutates nothing in production.
 */
async function originalSourceUrl(assetId) {
  const { status, json } = await mux("GET", `/video/v1/assets/${assetId}/input-info`);
  if (status !== 200) return null;
  for (const item of json.data || []) {
    const url = item?.settings?.url;
    if (typeof url === "string" && /^https?:\/\//i.test(url)) return url;
  }
  return null; // direct upload: no URL was ever given to Mux
}

/* ------------------------------------------------------------------ */
/*  checkpoint                                                         */
/* ------------------------------------------------------------------ */
async function loadState() {
  try { return JSON.parse(await readFile(STATE_PATH, "utf8")); }
  catch { return { title: TITLE, episodes: {} }; }
}
async function saveState(state) {
  await mkdir(MANIFEST_DIR, { recursive: true });
  await writeFile(STATE_PATH, JSON.stringify(state, null, 2));
}

/* ------------------------------------------------------------------ */
/*  verification                                                       */
/* ------------------------------------------------------------------ */
async function probe(file) {
  try {
    const { stdout } = await execFileAsync("ffprobe", [
      "-v", "error", "-select_streams", "v:0",
      "-show_entries", "stream=width,height,codec_name",
      "-show_entries", "format=duration,size",
      "-of", "json", file,
    ], { maxBuffer: 1 << 20 });
    const d = JSON.parse(stdout);
    const s = (d.streams || [])[0] || {};
    return {
      width: s.width ?? null,
      height: s.height ?? null,
      codec: s.codec_name ?? null,
      duration: Number(d.format?.duration ?? 0),
      size: Number(d.format?.size ?? 0),
    };
  } catch {
    return null; // ffprobe absent or file unreadable
  }
}

/** A file counts as recovered only if it is present, non-empty, and its
    duration matches what Mux says. A truncated download otherwise looks
    identical to a finished one. */
function verdict(info, expectedDuration) {
  if (!info) return { ok: false, why: "ffprobe could not read the file" };
  if (!info.size) return { ok: false, why: "zero bytes" };
  if (!info.width || !info.height) return { ok: false, why: "no video stream" };
  const drift = Math.abs(info.duration - expectedDuration);
  if (drift > 2.5) return { ok: false, why: `duration ${info.duration.toFixed(1)}s vs expected ${expectedDuration}s` };
  return { ok: true, why: `${info.width}x${info.height} ${info.codec} ${info.duration.toFixed(1)}s ${(info.size / 1e6).toFixed(1)}MB` };
}

/* ------------------------------------------------------------------ */
/*  one episode                                                        */
/* ------------------------------------------------------------------ */
async function recoverOne(ep, asset, state) {
  const key = String(ep.episode);
  const name = `${TITLE}_S01_E${String(ep.episode).padStart(2, "0")}__${asset.id}.mp4`;
  const dest = join(OUT_DIR, name);

  const prior = state.episodes[key];
  if (prior?.status === "verified") {
    try {
      const st = await stat(dest);
      if (st.size > 0 && st.size === prior.bytes) {
        console.log(`  EP ${key.padStart(3)}  skip (already verified)`);
        return;
      }
    } catch { /* file vanished, fall through and redo */ }
  }

  /* 1. Prefer the ORIGINAL ingest source when Mux still records one. Higher
        quality than the mezzanine, no egress, no prepare wait, and it leaves
        the production asset completely untouched. */
  let url = PREFER_SOURCE ? await originalSourceUrl(asset.id) : null;
  let via = url ? "source" : "mux-master";

  if (!url) {
  const put = await mux("PUT", `/video/v1/assets/${asset.id}/master-access`, { master_access: "temporary" });
  if (put.status >= 400) {
    state.episodes[key] = { status: "failed", why: `master-access HTTP ${put.status}`, asset: asset.id };
    console.log(`  EP ${key.padStart(3)}  FAILED  master-access HTTP ${put.status}`);
    return;
  }

  /* 2. poll until ready. The URL is never logged. */
  for (let i = 0; i < MAX_POLLS; i += 1) {
    await sleep(POLL_INTERVAL_MS);
    const { json } = await mux("GET", `/video/v1/assets/${asset.id}`);
    const m = json?.data?.master;
    if (m?.status === "ready" && m.url) { url = m.url; break; }
    if (m?.status === "errored") break;
  }
  if (!url) {
    state.episodes[key] = { status: "failed", why: "master never became ready", asset: asset.id };
    console.log(`  EP ${key.padStart(3)}  FAILED  master never became ready`);
    return;
  }
  }

  /* 3. download to .part, then rename. A partial file must never be mistaken
        for a finished one by the next run. */
  await mkdir(OUT_DIR, { recursive: true });
  const part = `${dest}.part`;
  try {
    const res = await fetch(url);
    if (!res.ok || !res.body) throw new Error(`download HTTP ${res.status}`);
    await pipeline(res.body, createWriteStream(part));
    await rename(part, dest);
  } catch (err) {
    await unlink(part).catch(() => {});
    state.episodes[key] = { status: "failed", why: String(err.message).slice(0, 120), asset: asset.id };
    console.log(`  EP ${key.padStart(3)}  FAILED  ${String(err.message).slice(0, 80)}`);
    return;
  }

  /* 4. verify against what Mux claims */
  const info = await probe(dest);
  const v = verdict(info, ep.duration);
  state.episodes[key] = {
    status: v.ok ? "verified" : "failed",
    why: v.why,
    via,
    asset: asset.id,
    file: name,
    bytes: info?.size ?? 0,
    width: info?.width ?? null,
    height: info?.height ?? null,
    codec: info?.codec ?? null,
    seconds: info?.duration ?? null,
    at: new Date().toISOString(),
  };
  console.log(`  EP ${key.padStart(3)}  ${v.ok ? "OK  " : "BAD "}  ${via.padEnd(10)} ${v.why}`);
}

/* ------------------------------------------------------------------ */
/*  main                                                               */
/* ------------------------------------------------------------------ */
const episodes = await episodesForTitle(TITLE);
const selected = LIMIT ? episodes.slice(0, LIMIT) : episodes;
const state = await loadState();

if (STATUS_ONLY) {
  const rows = Object.entries(state.episodes);
  const ok = rows.filter(([, v]) => v.status === "verified");
  const bytes = ok.reduce((n, [, v]) => n + (v.bytes || 0), 0);
  console.log(`  ${TITLE}: ${ok.length}/${episodes.length} verified, ${(bytes / 1e9).toFixed(2)} GB on disk`);
  for (const [k, v] of rows.filter(([, v]) => v.status !== "verified")) {
    console.log(`    EP ${k}: ${v.status} ${v.why || ""}`);
  }
  process.exit(0);
}

console.log(`\n  title      : ${TITLE}`);
console.log(`  episodes   : ${selected.length}${LIMIT ? ` (limited from ${episodes.length})` : ""}`);
console.log(`  output     : ${OUT_DIR}`);

const wanted = new Set(selected.map((e) => e.playbackId));
const assets = await assetsByPlaybackId(wanted);
const missing = selected.filter((e) => !assets.has(e.playbackId));
if (missing.length) {
  console.error(`  ${missing.length} episode(s) have no matching Mux asset. Aborting.`);
  process.exit(1);
}

const estBytes = selected.reduce((n, e) => n + e.duration * 26.6e6 / 8, 0);
console.log(`  est. size  : ~${(estBytes / 1e9).toFixed(1)} GB at the observed 26.6 Mbps`);

if (REVERT) {
  if (!APPLY) { console.log("\n  DRY RUN. Re-run with --confirm-enable-master-access to revert.\n"); process.exit(0); }
  console.log("\n  reverting master_access to none ...");
  for (const e of selected) {
    const a = assets.get(e.playbackId);
    const r = await mux("PUT", `/video/v1/assets/${a.id}/master-access`, { master_access: "none" });
    console.log(`  EP ${String(e.episode).padStart(3)}  ${r.status === 200 ? "reverted" : `HTTP ${r.status}`}`);
  }
  process.exit(0);
}

if (!APPLY) {
  console.log(`
  DRY RUN. Nothing was enabled and nothing was downloaded.

  This run would, for ${selected.length} episodes of "${TITLE}":
    1. PUT master_access=temporary on each Mux asset
    2. wait for each master to be prepared (~36s each, so roughly ${Math.round(selected.length * 42 / 60)} min)
    3. download each mezzanine.mp4 into ${OUT_DIR}
    4. verify resolution, codec and duration against Mux, then checkpoint

  Re-run with --confirm-enable-master-access to proceed.
`);
  process.exit(0);
}

await mkdir(OUT_DIR, { recursive: true });

/* Preflight. Leave a margin so we never drive the volume to zero. */
const HEADROOM = 5e9;
const verified = Object.entries(state.episodes).filter(([, v]) => v.status === "verified");
const alreadyHave = verified.reduce((n, [, v]) => n + (v.bytes || 0), 0);

/* Estimate from what we have ACTUALLY measured, not from an assumed bitrate.
   The 26.6 Mbps figure came from a direct-upload asset; the originals here run
   ~44 Mbps, so the assumption under-counted by 4x and would have waved through
   a run that could not finish. Once any episode is verified, its real
   bytes-per-second is the honest basis. */
const verifiedSeconds = verified.reduce((n, [, v]) => n + (v.seconds || 0), 0);
const bytesPerSecond = verifiedSeconds > 0 ? alreadyHave / verifiedSeconds : 26.6e6 / 8;
const doneKeys = new Set(verified.map(([k]) => k));
const remainingSeconds = selected
  .filter((e) => !doneKeys.has(String(e.episode)))
  .reduce((n, e) => n + e.duration, 0);
const stillNeed = remainingSeconds * bytesPerSecond;
const free = await freeBytes(OUT_DIR);
if (free !== null) {
  console.log(`  disk free  : ${gb(free)} GB   still needed: ~${gb(stillNeed)} GB (+${gb(HEADROOM)} GB headroom)`);
  if (free < stillNeed + HEADROOM) {
    console.error(`
  ABORTING: not enough disk.

  This run needs roughly ${gb(stillNeed + HEADROOM)} GB and the volume has ${gb(free)} GB.
  Starting anyway would fill the disk and fail most of the episodes, which is
  exactly what happened once already.

  Either free space, or send the files somewhere else:
    --out /Volumes/<external>/verza-masters/the-mistress-trap
`);
    process.exit(1);
  }
} else {
  console.log("  disk free  : could not be determined; proceeding with care");
}

console.log("");
const queue = [...selected];
await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
  for (;;) {
    const ep = queue.shift();
    if (!ep) return;
    await recoverOne(ep, assets.get(ep.playbackId), state);
    await saveState(state);
  }
}));

const done = Object.values(state.episodes).filter((v) => v.status === "verified");
const failed = Object.entries(state.episodes).filter(([, v]) => v.status !== "verified");
const bytes = done.reduce((n, v) => n + (v.bytes || 0), 0);
console.log(`\n  ${done.length}/${selected.length} verified, ${(bytes / 1e9).toFixed(2)} GB`);
console.log(`  checkpoint: ${STATE_PATH}`);
if (failed.length) {
  /* Exit non-zero. The first version of this returned 0 after failing 38 of
     61 episodes, so the run looked like a success in every wrapper. */
  console.error(`\n  ${failed.length} episode(s) did NOT verify:`);
  for (const [k, v] of failed.slice(0, 8)) console.error(`    EP ${k}: ${v.why}`);
  if (failed.length > 8) console.error(`    ... and ${failed.length - 8} more`);
  console.error("  Re-run the same command to resume; verified episodes are skipped.\n");
  process.exitCode = 1;
} else {
  console.log("");
}
