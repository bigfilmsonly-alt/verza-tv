#!/usr/bin/env node

/**
 * Generate the web/native-safe catalog map from the complete server anchor.
 *
 * The complete `lib/mux-map.ts` intentionally remains the server-side logical
 * anchor used by the authorized playback route and migration tooling. A public
 * playback ID is itself a bearer capability, though, so paid IDs must never be
 * imported by a browser or native runtime. This generator preserves every
 * series, episode number, and duration while retaining a playback ID only for
 * an intentionally public free episode on a live catalog title.
 *
 * Default invocation is read-only and verifies the checked-in generated file.
 * `--write` replaces it atomically. The native repo then copies the generated
 * file byte-for-byte under the normal data-sync gate.
 */

import { createHash } from "node:crypto";
import { readFile, rename, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import process from "node:process";
import { parseLiteralCatalog } from "./parse-catalog-source.mjs";

const ROOT = resolve(import.meta.dirname, "..");
const PRIVATE_MAP_PATH = resolve(ROOT, "lib/mux-map.ts");
const CATALOG_PATH = resolve(ROOT, "lib/catalog.ts");
const PUBLIC_MAP_PATH = resolve(ROOT, "lib/mux-public-map.ts");

const args = new Set(process.argv.slice(2));
const writeRequested = args.has("--write");
const selfTestRequested = args.has("--self-test");
const knownArgs = new Set(["--write", "--self-test", "--help"]);

function fail(message) {
  throw new Error(message);
}

function parseMuxMap(source) {
  const result = new Map();
  const seriesPattern =
    /^\s*"([a-z0-9]+(?:-[a-z0-9]+)*)":\s*\[([\s\S]*?)^\s*\],/gm;
  let seriesMatch;
  while ((seriesMatch = seriesPattern.exec(source)) !== null) {
    const slug = seriesMatch[1];
    const body = seriesMatch[2];
    const episodes = [];
    const episodePattern =
      /\{\s*episode:\s*(\d+),\s*playbackId:\s*"([A-Za-z0-9]+)",\s*duration:\s*(\d+)\s*\}/g;
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

function sourceHash(mapSource, catalogSource) {
  return createHash("sha256")
    .update("private-map\0")
    .update(mapSource)
    .update("\0catalog\0")
    .update(catalogSource)
    .digest("hex");
}

function derivePublicMap(privateMap, catalog) {
  const result = new Map();
  let totalEpisodes = 0;
  let publicEpisodes = 0;
  let protectedEpisodes = 0;

  for (const [slug, episodes] of privateMap) {
    const series = catalog.get(slug);
    const rows = episodes.map((episode) => {
      totalEpisodes += 1;
      const isPublic =
        series?.status === "live" &&
        episode.episode >= 1 &&
        episode.episode <= series.freeEpisodes;
      if (isPublic) {
        publicEpisodes += 1;
        return episode;
      }
      protectedEpisodes += 1;
      return { episode: episode.episode, duration: episode.duration };
    });
    result.set(slug, rows);
  }

  return { map: result, totalEpisodes, publicEpisodes, protectedEpisodes };
}

function renderPublicMap(derived, hash) {
  const seriesRows = [...derived.map.entries()]
    .map(([slug, episodes]) => {
      const episodeRows = episodes
        .map((episode) => {
          const playback = episode.playbackId
            ? `, playbackId: ${JSON.stringify(episode.playbackId)}`
            : "";
          return `    { episode: ${episode.episode}${playback}, duration: ${episode.duration} },`;
        })
        .join("\n");
      return `  ${JSON.stringify(slug)}: [\n${episodeRows}\n  ],`;
    })
    .join("\n");

  return `/* Auto-generated public Mux catalog map — do not hand-edit.
 *
 * Source fingerprint: ${hash}
 * Public playback IDs: ${derived.publicEpisodes}
 * Protected playback IDs withheld: ${derived.protectedEpisodes}
 *
 * This file is byte-identical in web and native. It preserves catalog episode
 * metadata while exposing durable playback IDs only for intentionally free
 * previews. Paid playback resolves by logical slug/episode through the server.
 */

export interface MuxEpisode {
  episode: number;
  playbackId?: string;
  duration: number;
}

export const MUX_MAP: Record<string, MuxEpisode[]> = {
${seriesRows}
};

export function getPlayback(slug: string, episode: number): MuxEpisode | undefined {
  return MUX_MAP[slug]?.find((entry) => entry.episode === episode);
}

export function getRandomPlayback():
  | { slug: string; episode: number; playbackId: string }
  | undefined {
  const candidates: { slug: string; episode: number; playbackId: string }[] = [];
  for (const [slug, episodes] of Object.entries(MUX_MAP)) {
    for (const episode of episodes) {
      if (episode.playbackId) {
        candidates.push({
          slug,
          episode: episode.episode,
          playbackId: episode.playbackId,
        });
      }
    }
  }
  if (candidates.length === 0) return undefined;
  return candidates[Math.floor(Math.random() * candidates.length)];
}
`;
}

async function atomicWrite(path, contents) {
  const temporary = `${path}.tmp-${process.pid}`;
  await writeFile(temporary, contents, { encoding: "utf8", mode: 0o644 });
  await rename(temporary, path);
}

async function runSelfTest() {
  const muxFixture = `export const MUX_MAP = {\n  "alpha-show": [\n    { episode: 1, playbackId: "PublicOne", duration: 60 },\n    { episode: 2, playbackId: "PaidTwo", duration: 61 },\n  ],\n  "future-show": [\n    { episode: 1, playbackId: "FutureOne", duration: 62 },\n  ],\n};\n`;
  const catalogFixture = `export const catalog = [\n  {\n    // Comments before slug must never hide a catalog entry.\n    slug: "alpha-show",\n    freeEpisodes: 1, status: "live",\n  },\n  {\n    slug: "future-show",\n    freeEpisodes: 1, status: "coming_soon",\n  },\n];\n`;
  const derived = derivePublicMap(
    parseMuxMap(muxFixture),
    parseLiteralCatalog(catalogFixture),
  );
  const output = renderPublicMap(derived, "fixture");
  if (
    derived.publicEpisodes !== 1 ||
    derived.protectedEpisodes !== 2 ||
    !output.includes('playbackId: "PublicOne"') ||
    output.includes("PaidTwo") ||
    output.includes("FutureOne") ||
    output.includes("\n+")
  ) {
    fail("Public-map fixture failed");
  }
  console.log("Public Mux-map generator self-test: PASS");
}

async function main() {
  for (const arg of args) {
    if (!knownArgs.has(arg)) fail(`Unknown option: ${arg}`);
  }
  if (args.has("--help")) {
    console.log(`Usage:\n  node scripts/generate-public-mux-map.mjs\n  node scripts/generate-public-mux-map.mjs --write\n  node scripts/generate-public-mux-map.mjs --self-test\n\nDefault mode verifies the checked-in public map without writing.`);
    return;
  }
  if (selfTestRequested) {
    if (args.size !== 1) fail("--self-test cannot be combined with other options");
    await runSelfTest();
    return;
  }

  const [mapSource, catalogSource] = await Promise.all([
    readFile(PRIVATE_MAP_PATH, "utf8"),
    readFile(CATALOG_PATH, "utf8"),
  ]);
  const derived = derivePublicMap(
    parseMuxMap(mapSource),
    parseLiteralCatalog(catalogSource),
  );
  const rendered = renderPublicMap(
    derived,
    sourceHash(mapSource, catalogSource),
  );

  console.log("Public Mux-map source audit:");
  console.log(`  episode rows: ${derived.totalEpisodes}`);
  console.log(`  intentionally public IDs: ${derived.publicEpisodes}`);
  console.log(`  protected IDs withheld: ${derived.protectedEpisodes}`);

  if (writeRequested) {
    await atomicWrite(PUBLIC_MAP_PATH, rendered);
    console.log("Generated lib/mux-public-map.ts atomically");
    return;
  }

  let checkedIn;
  try {
    checkedIn = await readFile(PUBLIC_MAP_PATH, "utf8");
  } catch (error) {
    if (error?.code === "ENOENT") {
      fail("lib/mux-public-map.ts is missing; run with --write");
    }
    throw error;
  }
  if (checkedIn !== rendered) {
    fail("lib/mux-public-map.ts is stale; regenerate with --write");
  }
  console.log("Checked-in public Mux map: PASS");
}

main().catch((error) => {
  console.error(`Public Mux-map generation failed: ${error.message}`);
  process.exitCode = 1;
});
