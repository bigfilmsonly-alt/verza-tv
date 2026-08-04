#!/usr/bin/env node

/**
 * Audit and stage signed Mux playback IDs for paid catalog episodes.
 *
 * Safety model:
 * - default invocation is read-only;
 * - mutations require BOTH explicit acknowledgement flags;
 * - the mutation path only adds a `signed` playback ID to the same asset;
 * - it never removes or changes the existing public playback ID;
 * - map generation is refused until live inventory proves full coverage; and
 * - progress is checkpointed atomically so an interrupted run is resumable.
 *
 * Run `npm run mux:signed:self-test` before using real credentials.
 */

import { createHash } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import process from "node:process";
import { parseLiteralCatalog } from "./parse-catalog-source.mjs";

const ROOT = resolve(import.meta.dirname, "..");
const MUX_MAP_PATH = resolve(ROOT, "lib/mux-map.ts");
const CATALOG_PATH = resolve(ROOT, "lib/catalog.ts");
const GENERATED_MAP_PATH = resolve(ROOT, "lib/mux-signed-map.ts");
const CHECKPOINT_PATH = resolve(
  ROOT,
  "scripts/out/mux-signed-playback-state.json",
);
const MUX_API = "https://api.mux.com";
const CHECKPOINT_VERSION = 1;
const MAX_GET_ATTEMPTS = 4;
/* Mux's documented Video API POST bucket refills at 1 request/second for
   both high- and low-priority tokens. Stay just below that sustained rate. */
const MIN_POST_INTERVAL_MS = 1_100;
let lastPostStartedAt = 0;

const args = new Set(process.argv.slice(2));
const applyRequested = args.has("--apply-add-signed-ids");
const mutationConfirmed = args.has("--confirm-add-signed-ids");
const generateMapRequested = args.has("--generate-map");
const selfTestRequested = args.has("--self-test");

const knownArgs = new Set([
  "--apply-add-signed-ids",
  "--confirm-add-signed-ids",
  "--generate-map",
  "--self-test",
  "--help",
]);

function fail(message) {
  throw new Error(message);
}

function parseMuxMap(source) {
  const result = new Map();
  const seriesPattern = /^\s*"([a-z0-9]+(?:-[a-z0-9]+)*)":\s*\[([\s\S]*?)^\s*\],/gm;
  let seriesMatch;
  while ((seriesMatch = seriesPattern.exec(source)) !== null) {
    const slug = seriesMatch[1];
    const body = seriesMatch[2];
    const episodes = [];
    const episodePattern = /\{\s*episode:\s*(\d+),\s*playbackId:\s*"([A-Za-z0-9]+)",\s*duration:\s*(\d+)\s*\}/g;
    let episodeMatch;
    while ((episodeMatch = episodePattern.exec(body)) !== null) {
      episodes.push({
        episode: Number(episodeMatch[1]),
        playbackId: episodeMatch[2],
        duration: Number(episodeMatch[3]),
      });
    }
    if (episodes.length === 0) fail(`No episodes parsed for ${slug}`);
    if (result.has(slug)) fail(`Duplicate Mux-map series: ${slug}`);
    result.set(slug, episodes);
  }
  if (result.size === 0) fail("No series parsed from lib/mux-map.ts");
  return result;
}

function deriveCatalogAudit(muxMap, catalog) {
  const usages = new Map();
  const orphanMappedSeries = [];
  let mappedEpisodes = 0;
  let freeEpisodeRows = 0;
  let paidEpisodeRows = 0;

  for (const [slug, episodes] of muxMap) {
    const series = catalog.get(slug);
    /* The media inventory intentionally contains a few non-catalog/promotional
       rows. They are unreachable through the catalog playback route, so report
       them for cleanup review but do not classify them as paid episodes. */
    if (!series) {
      orphanMappedSeries.push(slug);
      continue;
    }
    if (series.status !== "live") continue;

    for (const episode of episodes) {
      mappedEpisodes += 1;
      const access = episode.episode <= series.freeEpisodes ? "free" : "paid";
      if (access === "free") freeEpisodeRows += 1;
      else paidEpisodeRows += 1;
      const list = usages.get(episode.playbackId) ?? [];
      list.push({ slug, episode: episode.episode, access });
      usages.set(episode.playbackId, list);
    }
  }

  const paidPublicIds = [];
  const duplicateIds = [];
  const mixedAccessIds = [];
  for (const [playbackId, rows] of usages) {
    const accessKinds = new Set(rows.map((row) => row.access));
    if (rows.length > 1) duplicateIds.push(playbackId);
    if (accessKinds.size > 1) mixedAccessIds.push(playbackId);
    if (accessKinds.has("paid")) paidPublicIds.push(playbackId);
  }
  paidPublicIds.sort();

  return {
    paidPublicIds,
    mappedEpisodes,
    freeEpisodeRows,
    paidEpisodeRows,
    duplicateIds,
    mixedAccessIds,
    orphanMappedSeries,
  };
}

function sourceHash(muxSource, catalogSource) {
  return createHash("sha256")
    .update("mux-map\0")
    .update(muxSource)
    .update("\0catalog\0")
    .update(catalogSource)
    .digest("hex");
}

function requireCredentials() {
  const tokenId = process.env.MUX_TOKEN_ID ?? "";
  const tokenSecret = process.env.MUX_TOKEN_SECRET ?? "";
  if (!tokenId || !tokenSecret) {
    fail(
      "MUX_TOKEN_ID and MUX_TOKEN_SECRET are required for the live read-only audit",
    );
  }
  return `Basic ${Buffer.from(`${tokenId}:${tokenSecret}`).toString("base64")}`;
}

function wait(milliseconds) {
  return new Promise((resolveWait) => setTimeout(resolveWait, milliseconds));
}

async function muxGet(path, authorization) {
  let lastError;
  for (let attempt = 1; attempt <= MAX_GET_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(`${MUX_API}${path}`, {
        method: "GET",
        headers: { Accept: "application/json", Authorization: authorization },
      });
      if (response.ok) return await response.json();
      const retryable = response.status === 429 || response.status >= 500;
      lastError = new Error(`Mux read failed with HTTP ${response.status}`);
      if (!retryable) throw lastError;
    } catch (error) {
      lastError = error;
    }
    if (attempt < MAX_GET_ATTEMPTS) await wait(250 * 2 ** (attempt - 1));
  }
  throw lastError ?? new Error("Mux read failed");
}

async function listAssets(authorization) {
  const assets = [];
  let page = 1;
  while (true) {
    const body = await muxGet(`/video/v1/assets?limit=100&page=${page}`, authorization);
    if (!Array.isArray(body.data)) fail("Mux returned an invalid asset list");
    assets.push(...body.data);
    const expectedTotal = Number.isFinite(body.total_row_count)
      ? body.total_row_count
      : null;
    if (
      body.data.length === 0 ||
      body.data.length < 100 ||
      (expectedTotal !== null && assets.length >= expectedTotal)
    ) {
      break;
    }
    page += 1;
    if (page > 1_000) fail("Mux asset pagination exceeded its safety bound");
  }
  return assets;
}

async function getAsset(assetId, authorization) {
  const body = await muxGet(
    `/video/v1/assets/${encodeURIComponent(assetId)}`,
    authorization,
  );
  if (!body.data?.id) fail("Mux returned an invalid asset response");
  return body.data;
}

function playbackIds(asset, policy) {
  if (!Array.isArray(asset.playback_ids)) return [];
  return asset.playback_ids
    .filter(
      (entry) =>
        entry?.policy === policy &&
        typeof entry.id === "string" &&
        /^[A-Za-z0-9]+$/.test(entry.id),
    )
    .map((entry) => entry.id)
    .sort();
}

function indexInventory(assets) {
  const byPublicId = new Map();
  const duplicatePublicIds = [];
  for (const asset of assets) {
    if (typeof asset?.id !== "string") continue;
    for (const publicId of playbackIds(asset, "public")) {
      if (byPublicId.has(publicId)) duplicatePublicIds.push(publicId);
      else byPublicId.set(publicId, asset);
    }
  }
  return { byPublicId, duplicatePublicIds };
}

async function readCheckpoint(expectedSourceHash) {
  try {
    const raw = await readFile(CHECKPOINT_PATH, "utf8");
    const parsed = JSON.parse(raw);
    if (
      parsed.version !== CHECKPOINT_VERSION ||
      parsed.sourceHash !== expectedSourceHash ||
      typeof parsed.entries !== "object" ||
      parsed.entries === null
    ) {
      return { version: CHECKPOINT_VERSION, sourceHash: expectedSourceHash, entries: {} };
    }
    return parsed;
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
    return { version: CHECKPOINT_VERSION, sourceHash: expectedSourceHash, entries: {} };
  }
}

async function atomicWrite(path, contents) {
  await mkdir(dirname(path), { recursive: true });
  const temporary = `${path}.tmp-${process.pid}`;
  await writeFile(temporary, contents, { encoding: "utf8", mode: 0o600 });
  await rename(temporary, path);
}

async function writeCheckpoint(checkpoint) {
  checkpoint.updatedAt = new Date().toISOString();
  await atomicWrite(CHECKPOINT_PATH, `${JSON.stringify(checkpoint, null, 2)}\n`);
}

async function addSignedPlaybackId(assetId, authorization) {
  /* Do not automatically retry this write: an interrupted response can be
     ambiguous. The caller re-reads the asset and either records the ID that
     was created or stops safely for an operator rerun. */
  const remainingDelay = Math.max(
    0,
    lastPostStartedAt + MIN_POST_INTERVAL_MS - Date.now(),
  );
  if (remainingDelay > 0) await wait(remainingDelay);
  lastPostStartedAt = Date.now();
  const response = await fetch(
    `${MUX_API}/video/v1/assets/${encodeURIComponent(assetId)}/playback-ids`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: authorization,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ policy: "signed" }),
    },
  );
  if (!response.ok) {
    throw new Error(`Mux write failed with HTTP ${response.status}`);
  }
  const body = await response.json();
  const id = body.data?.id;
  if (typeof id !== "string" || !/^[A-Za-z0-9]+$/.test(id)) {
    fail("Mux returned an invalid signed playback ID");
  }
  return id;
}

function renderGeneratedMap(mapping, hash) {
  const rows = [...mapping.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([publicId, signedId]) => `  ${JSON.stringify(publicId)}: ${JSON.stringify(signedId)},`)
    .join("\n");
  return `import "server-only";\n\n/**\n * GENERATED FILE — do not hand-edit.\n *\n * Generated by scripts/migrate-mux-signed-playback.mjs from a complete live\n * Mux inventory audit. Source fingerprint: ${hash}\n *\n * Keys are the legacy public playback IDs retained by the byte-identical\n * web/native catalog map; values are signed IDs on those same Mux assets. This\n * file is server-only and must never be copied into a browser or native bundle.\n */\nexport const MUX_SIGNED_PLAYBACK_MAP: Readonly<Record<string, string>> =\n  Object.freeze({\n${rows}\n  });\n\nexport function getSignedPlaybackId(publicPlaybackId: string): string | null {\n  return MUX_SIGNED_PLAYBACK_MAP[publicPlaybackId] ?? null;\n}\n`;
}

async function runSelfTest() {
  const muxFixture = `export const MUX_MAP = {\n  "alpha-show": [\n    { episode: 1, playbackId: "PublicOne", duration: 60 },\n    { episode: 2, playbackId: "PublicTwo", duration: 61 },\n  ],\n};\n`;
  const catalogFixture = `export const catalog = [\n  {\n    // A policy comment may legally precede the slug.\n    slug: "alpha-show",\n    title: "Alpha",\n    freeEpisodes: 1, coinPerEpisode: 49, status: "live",\n  },\n];\n`;
  const audit = deriveCatalogAudit(
    parseMuxMap(muxFixture),
    parseLiteralCatalog(catalogFixture),
  );
  if (
    audit.mappedEpisodes !== 2 ||
    audit.freeEpisodeRows !== 1 ||
    audit.paidEpisodeRows !== 1 ||
    audit.paidPublicIds.join(",") !== "PublicTwo"
  ) {
    fail("Fixture catalog classification failed");
  }
  const generated = renderGeneratedMap(
    new Map([["PublicTwo", "SignedTwo"]]),
    "fixture",
  );
  if (
    !generated.includes('"PublicTwo": "SignedTwo"') ||
    !generated.includes('import "server-only"')
  ) {
    fail("Generated-map fixture failed");
  }
  console.log("Mux signed-playback self-test: PASS");
}

async function main() {
  for (const arg of args) {
    if (!knownArgs.has(arg)) fail(`Unknown option: ${arg}`);
  }
  if (args.has("--help")) {
    console.log(`Usage:\n  node --env-file=.env.local scripts/migrate-mux-signed-playback.mjs\n  node --env-file=.env.local scripts/migrate-mux-signed-playback.mjs --generate-map\n  node --env-file=.env.local scripts/migrate-mux-signed-playback.mjs --apply-add-signed-ids --confirm-add-signed-ids\n  node scripts/migrate-mux-signed-playback.mjs --self-test\n\nThe default command is a live, read-only audit. The apply command only adds signed playback IDs; it does not remove existing public IDs.`);
    return;
  }
  if (selfTestRequested) {
    if (args.size !== 1) fail("--self-test cannot be combined with other options");
    await runSelfTest();
    return;
  }
  if (applyRequested !== mutationConfirmed) {
    fail(
      "A live mutation requires both --apply-add-signed-ids and --confirm-add-signed-ids",
    );
  }

  const [muxSource, catalogSource] = await Promise.all([
    readFile(MUX_MAP_PATH, "utf8"),
    readFile(CATALOG_PATH, "utf8"),
  ]);
  const hash = sourceHash(muxSource, catalogSource);
  const catalogAudit = deriveCatalogAudit(
    parseMuxMap(muxSource),
    parseLiteralCatalog(catalogSource),
  );

  console.log("Catalog source audit:");
  console.log(`  mapped live episode rows: ${catalogAudit.mappedEpisodes}`);
  console.log(`  free episode rows: ${catalogAudit.freeEpisodeRows}`);
  console.log(`  paid episode rows: ${catalogAudit.paidEpisodeRows}`);
  console.log(`  unique paid public IDs: ${catalogAudit.paidPublicIds.length}`);
  console.log(`  duplicate playback IDs: ${catalogAudit.duplicateIds.length}`);
  console.log(`  mixed free/paid ID reuse: ${catalogAudit.mixedAccessIds.length}`);
  console.log(`  mapped series outside catalog: ${catalogAudit.orphanMappedSeries.length}`);
  if (catalogAudit.orphanMappedSeries.length > 0) {
    console.log(`    ${catalogAudit.orphanMappedSeries.sort().join(", ")}`);
  }
  if (catalogAudit.mixedAccessIds.length > 0) {
    fail(
      "A playback ID is reused by both free and paid rows; resolve that catalog ambiguity before migration",
    );
  }

  const authorization = requireCredentials();
  console.log("Reading live Mux asset inventory (no changes)...");
  let assets = await listAssets(authorization);
  let inventory = indexInventory(assets);
  if (inventory.duplicatePublicIds.length > 0) {
    fail("Mux inventory contains a public playback ID on multiple assets");
  }

  const checkpoint = await readCheckpoint(hash);
  const mapping = new Map();
  const missingAssets = [];
  const assetsWithoutSignedId = [];
  const assetsWithMultipleSignedIds = [];

  for (const publicId of catalogAudit.paidPublicIds) {
    const asset = inventory.byPublicId.get(publicId);
    if (!asset) {
      missingAssets.push(publicId);
      continue;
    }
    const signedIds = playbackIds(asset, "signed");
    if (signedIds.length === 0) assetsWithoutSignedId.push({ publicId, assetId: asset.id });
    else {
      mapping.set(publicId, signedIds[0]);
      if (signedIds.length > 1) assetsWithMultipleSignedIds.push(publicId);
    }
  }

  console.log("Live Mux inventory audit:");
  console.log(`  assets scanned: ${assets.length}`);
  console.log(`  paid IDs missing from Mux: ${missingAssets.length}`);
  console.log(`  paid assets already signed: ${mapping.size}`);
  console.log(`  paid assets needing signed ID: ${assetsWithoutSignedId.length}`);
  console.log(
    `  assets with multiple signed IDs (deterministic first used): ${assetsWithMultipleSignedIds.length}`,
  );

  if (missingAssets.length > 0) {
    fail("Paid catalog IDs are absent from live Mux inventory; no mutation or map generation is safe");
  }

  if (applyRequested) {
    console.log(
      `Adding signed playback IDs to ${assetsWithoutSignedId.length} assets; existing public IDs remain unchanged...`,
    );
    let completed = 0;
    for (const item of assetsWithoutSignedId) {
      const currentAsset = await getAsset(item.assetId, authorization);
      let signedIds = playbackIds(currentAsset, "signed");
      let signedId = signedIds[0];
      if (!signedId) {
        try {
          signedId = await addSignedPlaybackId(item.assetId, authorization);
        } catch (writeError) {
          const verifiedAsset = await getAsset(item.assetId, authorization);
          signedIds = playbackIds(verifiedAsset, "signed");
          signedId = signedIds[0];
          if (!signedId) throw writeError;
        }
      }
      mapping.set(item.publicId, signedId);
      checkpoint.entries[item.publicId] = {
        assetId: item.assetId,
        signedPlaybackId: signedId,
        verifiedAt: new Date().toISOString(),
      };
      await writeCheckpoint(checkpoint);
      completed += 1;
      if (completed % 25 === 0 || completed === assetsWithoutSignedId.length) {
        console.log(`  completed ${completed}/${assetsWithoutSignedId.length}`);
      }
    }

    /* Re-read the entire inventory. A successful write response is not enough
       evidence for map generation; the live asset state is authoritative. */
    console.log("Re-reading live Mux inventory for post-write verification...");
    assets = await listAssets(authorization);
    inventory = indexInventory(assets);
    mapping.clear();
    for (const publicId of catalogAudit.paidPublicIds) {
      const asset = inventory.byPublicId.get(publicId);
      const signedId = asset ? playbackIds(asset, "signed")[0] : undefined;
      if (signedId) mapping.set(publicId, signedId);
    }
  }

  const complete = mapping.size === catalogAudit.paidPublicIds.length;
  console.log(
    `Coverage: ${mapping.size}/${catalogAudit.paidPublicIds.length} paid IDs have signed counterparts`,
  );

  if (generateMapRequested) {
    if (!complete) {
      fail("Generated map refused: live signed coverage is incomplete");
    }
    await atomicWrite(GENERATED_MAP_PATH, renderGeneratedMap(mapping, hash));
    console.log("Generated lib/mux-signed-map.ts atomically from verified live inventory");
  } else if (complete) {
    console.log(
      "Coverage is complete. Re-run with --generate-map to write the server-only map.",
    );
  } else if (!applyRequested) {
    console.log(
      "Read-only audit complete. No Mux state or repository files were changed.",
    );
  }
}

main().catch((error) => {
  console.error(`Mux signed-playback migration failed: ${error.message}`);
  process.exitCode = 1;
});
