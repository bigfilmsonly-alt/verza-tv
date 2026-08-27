#!/usr/bin/env node

/** Static regression contract for catalog playback security. */

import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { extname, resolve } from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { parseLiteralCatalog } from "./parse-catalog-source.mjs";

const ROOT = resolve(import.meta.dirname, "..");
const failures = [];

async function source(relativePath) {
  return readFile(resolve(ROOT, relativePath), "utf8");
}

function requireMatch(name, text, pattern) {
  if (!pattern.test(text)) failures.push(name);
}

function requireText(name, text, expected) {
  if (!text.includes(expected)) failures.push(name);
}

function parseCompleteMuxMap(text) {
  const result = new Map();
  const seriesPattern = /^\s*"([a-z0-9]+(?:-[a-z0-9]+)*)":\s*\[([\s\S]*?)^\s*\],/gm;
  let seriesMatch;
  while ((seriesMatch = seriesPattern.exec(text)) !== null) {
    const episodes = [];
    const episodePattern = /\{\s*episode:\s*(\d+),\s*playbackId:\s*"([A-Za-z0-9]+)",\s*duration:\s*(\d+)\s*\}/g;
    let episodeMatch;
    while ((episodeMatch = episodePattern.exec(seriesMatch[2])) !== null) {
      episodes.push({
        episode: Number(episodeMatch[1]),
        playbackId: episodeMatch[2],
      });
    }
    if (episodes.length === 0 || result.has(seriesMatch[1])) return null;
    result.set(seriesMatch[1], episodes);
  }
  return result.size > 0 ? result : null;
}

async function codeFiles(directory) {
  const result = [];
  for (const entry of await readdir(resolve(ROOT, directory), { withFileTypes: true })) {
    const relative = `${directory}/${entry.name}`;
    if (entry.isDirectory()) result.push(...await codeFiles(relative));
    else if ([".ts", ".tsx", ".mjs"].includes(extname(entry.name))) result.push(relative);
  }
  return result;
}

const [route, episodePage, episodeFeed, playbackClient, playbackServer,
  signedMap, privateMap, completeMap, publicMap, catalog, browse, legacyPlayer, shorts,
  clipPage, sitemap, codeSource, migration] = await Promise.all([
  source("app/api/playback/[episode]/route.ts"),
  source("app/series/[slug]/[episode]/page.tsx"),
  source("components/EpisodeFeed.tsx"),
  source("lib/playback-client.ts"),
  source("lib/mux-playback.ts"),
  source("lib/mux-signed-map.ts"),
  source("lib/mux-private-map.ts"),
  source("lib/mux-map.ts"),
  source("lib/mux-public-map.ts"),
  source("lib/catalog.ts"),
  source("components/BrowsePage.tsx"),
  source("components/Player.tsx"),
  source("components/ShortsFeed.tsx"),
  source("app/c/[slug]/page.tsx"),
  source("app/sitemaps/episodes.xml/route.ts"),
  source("lib/content/code-source.ts"),
  source("scripts/migrate-mux-signed-playback.mjs"),
]);

requireText("paid API must call signed delivery", route, "getPaidPlaybackDelivery(mux.playbackId)");
requireMatch("paid API must omit a separate playback ID", route, /playbackId:\s*isFree\s*\?\s*mux\.playbackId\s*:\s*undefined/);
requireText("playback responses must be no-store", route, '"Cache-Control": "private, no-store, max-age=0"');
requireText("playback responses must vary by auth", route, 'Vary: "Authorization, Cookie"');
requireMatch("route must enforce catalog episode bounds", route, /epNum\s*>\s*series\.episodeCount/);

requireMatch("paid RSC payload must omit public ID", episodePage, /playbackId:\s*catalogFree\s*\?\s*mux\?\.playbackId\s*:\s*undefined/);
requireText("paid feed rows must require authorization", episodePage, "requiresAuthorization: !catalogFree");
requireText("paid feed must use authorization client", episodeFeed, "getAuthorizedPlayback(seriesSlug, episode.number");
requireText("paid feed must refresh protected source", episodeFeed, "refreshProtectedSource");

requireText("browser capability cache must be user scoped", playbackClient, "data.session?.user.id ?? \"anonymous\"");
requireText("browser capability cache must use expiry skew", playbackClient, "SIGNED_REUSE_SKEW_MS");
requireText("signed mode must default false", playbackServer, 'parseExactBoolean("MUX_SIGNED_PLAYBACK_ENABLED", false)');
requireText("signed mode must require generated mapping", playbackServer, "getSignedPlaybackId(publicId)");
requireText("signed video token must be generated", playbackServer, 'type: "video"');
requireText("signed thumbnail token must be generated", playbackServer, 'type: "thumbnail"');
requireText("signed map must be server-only", signedMap, 'import "server-only"');
const expectedSignedMapFingerprint = createHash("sha256")
  .update("mux-map\0")
  .update(completeMap)
  .update("\0catalog\0")
  .update(catalog)
  .digest("hex");
const embeddedFingerprintMatches = [
  ...signedMap.matchAll(/Source fingerprint:\s*([a-f0-9]{64})/g),
];
if (
  embeddedFingerprintMatches.length !== 1 ||
  embeddedFingerprintMatches[0][1] !== expectedSignedMapFingerprint
) {
  failures.push("signed map fingerprint must match current complete map plus catalog");
}

const completeMuxMap = parseCompleteMuxMap(completeMap);
let catalogEntries;
try {
  catalogEntries = parseLiteralCatalog(catalog);
} catch {
  failures.push("signed map key audit must parse the literal catalog");
}
if (!completeMuxMap) {
  failures.push("signed map key audit must parse the complete Mux map");
} else if (catalogEntries) {
  const paidLiveIds = new Set();
  for (const [slug, episodes] of completeMuxMap) {
    const series = catalogEntries.get(slug);
    if (!series || series.status !== "live") continue;
    for (const episode of episodes) {
      if (episode.episode > series.freeEpisodes) paidLiveIds.add(episode.playbackId);
    }
  }

  const signedEntries = [
    ...signedMap.matchAll(/^\s*"([A-Za-z0-9]+)":\s*"[A-Za-z0-9]+",$/gm),
  ];
  const signedKeys = signedEntries.map((entry) => entry[1]);
  const signedKeySet = new Set(signedKeys);
  if (signedKeySet.size !== signedKeys.length) {
    failures.push("signed map must not contain duplicate public-ID keys");
  }
  const missingKeyCount = [...paidLiveIds].filter((id) => !signedKeySet.has(id)).length;
  const extraKeyCount = [...signedKeySet].filter((id) => !paidLiveIds.has(id)).length;
  if (
    signedEntries.length === 0 ||
    missingKeyCount !== 0 ||
    extraKeyCount !== 0
  ) {
    failures.push(
      `signed map key set must exactly equal paid-live IDs (missing ${missingKeyCount}, extra ${extraKeyCount})`,
    );
  }
}
requireText("complete-map runtime gateway must be server-only", privateMap,
  'import "server-only"');
requireText("playback route must use complete-map server gateway", route,
  "@/lib/mux-private-map");
requireText("public map must be generated", publicMap,
  "Auto-generated public Mux catalog map — do not hand-edit");
requireText("public map release count must be explicit", publicMap,
  "Public playback IDs: 519");
requireText("protected map release count must be explicit", publicMap,
  "Protected playback IDs withheld: 4394");
requireText("public map must permit withheld capabilities", publicMap,
  "playbackId?: string;");

const publicMapAudit = spawnSync(
  process.execPath,
  [resolve(ROOT, "scripts/generate-public-mux-map.mjs")],
  { cwd: ROOT, encoding: "utf8" },
);
if (publicMapAudit.status !== 0) {
  failures.push(
    `generated public map must exactly match catalog policy: ${
      (publicMapAudit.stderr || publicMapAudit.stdout || "audit failed").trim()
    }`,
  );
} else if (
  !publicMapAudit.stdout.includes("intentionally public IDs: 519") ||
  !publicMapAudit.stdout.includes("protected IDs withheld: 4394")
) {
  failures.push("generated public-map audit returned unexpected release counts");
}

requireText("catalog normalization must use public map", catalog,
  'from "./mux-public-map"');
for (const [name, text] of [
  ["browse", browse],
  ["legacy player", legacyPlayer],
  ["shorts", shorts],
  ["clip page", clipPage],
  ["episode page", episodePage],
  ["sitemap", sitemap],
  ["SEO source", codeSource],
]) {
  requireText(`${name} must import the public map`, text, "mux-public-map");
}

requireText("browse instant player must gate on free count", browse, "epNum <= show.freeEpisodes");
requireText("legacy player must fail closed on paid episode", legacyPlayer, "episodeNumber <= freeEpisodes");
requireText("shorts must require episode 1 free", shorts, "s.freeEpisodes >= 1");
requireText("clip media must use free-only helper", clipPage, "getPublicClipPlayback");
requireMatch("sitemap video block must require a public ID and free count", sitemap,
  /muxEntry\?\.playbackId\s*&&\s*ep\.number\s*<=\s*s\.freeEpisodes/);
requireMatch("SEO content source must omit paid ID", codeSource, /muxPlaybackId:\s*catalogEp\.isFree\s*\?\s*\(mux\?\.playbackId\s*\?\?\s*""\)\s*:\s*""/);

requireText("migration must require apply acknowledgement", migration, "--apply-add-signed-ids");
requireText("migration must require second confirmation", migration, "--confirm-add-signed-ids");
requireText("migration may only add signed policy", migration, 'body: JSON.stringify({ policy: "signed" })');
requireText("migration map generation must require complete coverage", migration, 'fail("Generated map refused: live signed coverage is incomplete")');
if (/method:\s*["']DELETE["']/.test(migration)) failures.push("migration script must not contain a public-ID removal request");

const fullMapImport = /(?:from\s+|import\()\s*["'][^"']*mux-map["']/;
for (const directory of ["app", "components", "lib"]) {
  for (const file of await codeFiles(directory)) {
    if (file === "lib/mux-private-map.ts") continue;
    const text = await source(file);
    if (fullMapImport.test(text)) {
      failures.push(`runtime source imports complete paid-capability map: ${file}`);
    }
  }
}

const forbiddenLogValue = /console\.(?:log|error|warn|debug)\([^\n]*(?:hlsUrl|playbackUrl|authorizedSource|videoToken|thumbnailToken)/;
for (const directory of ["app", "components", "lib", "scripts"]) {
  for (const file of await codeFiles(directory)) {
    const text = await source(file);
    if (forbiddenLogValue.test(text)) failures.push(`capability-bearing value logged in ${file}`);
  }
}

if (failures.length > 0) {
  console.error("Playback security contract: FAIL");
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exitCode = 1;
} else {
  console.log("Playback security contract: PASS");
}
