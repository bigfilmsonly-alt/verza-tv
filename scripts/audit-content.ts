import { catalog } from "../lib/catalog";
import { MUX_MAP } from "../lib/mux-map";

let problems = 0;
const warn = (m: string) => { console.log("  ⚠ " + m); problems++; };

const live = catalog.filter((s) => s.status === "live");
const coming = catalog.filter((s) => s.status === "coming_soon");

console.log(`Catalog: ${catalog.length} series (${live.length} live, ${coming.length} coming_soon)`);

const mapKeys = new Set(Object.keys(MUX_MAP));
const slugSeen = new Set<string>();
let totalStreams = 0;
let totalEpisodesExpected = 0;
let perfect = 0;

for (const s of live) {
  // duplicate slug guard
  if (slugSeen.has(s.slug)) warn(`DUPLICATE slug in catalog: ${s.slug}`);
  slugSeen.add(s.slug);

  const eps = MUX_MAP[s.slug];
  totalEpisodesExpected += s.episodeCount;

  if (!eps || eps.length === 0) {
    warn(`${s.slug}: LIVE but NO Mux streams (episodeCount=${s.episodeCount})`);
    continue;
  }
  totalStreams += eps.length;

  // sequential 1..N, no dupes, valid ids/durations
  const nums = eps.map((e) => e.episode);
  const numSet = new Set(nums);
  if (numSet.size !== nums.length) warn(`${s.slug}: DUPLICATE episode numbers`);
  const badId = eps.filter((e) => !e.playbackId || e.playbackId.length < 20);
  if (badId.length) warn(`${s.slug}: ${badId.length} episode(s) with missing/short playbackId`);
  const badDur = eps.filter((e) => !(e.duration > 0));
  if (badDur.length) warn(`${s.slug}: ${badDur.length} episode(s) with non-positive duration`);

  const maxEp = Math.max(...nums);
  const minEp = Math.min(...nums);
  const gaps: number[] = [];
  for (let i = 1; i <= maxEp; i++) if (!numSet.has(i)) gaps.push(i);
  if (minEp !== 1) warn(`${s.slug}: episodes start at ${minEp}, not 1`);
  if (gaps.length) warn(`${s.slug}: MISSING episode numbers [${gaps.slice(0, 12).join(",")}${gaps.length > 12 ? "…" : ""}]`);

  // catalog episodeCount vs streams
  if (s.episodeCount !== eps.length) {
    warn(`${s.slug}: episodeCount=${s.episodeCount} but ${eps.length} Mux streams (${s.episodeCount > eps.length ? s.episodeCount - eps.length + " episodes have NO video" : eps.length - s.episodeCount + " extra streams"})`);
  }

  // freeEpisodes sanity
  if (s.freeEpisodes < 0 || s.freeEpisodes > s.episodeCount) warn(`${s.slug}: freeEpisodes=${s.freeEpisodes} out of range (0..${s.episodeCount})`);

  if (
    s.episodeCount === eps.length && !gaps.length && minEp === 1 &&
    numSet.size === nums.length && !badId.length && !badDur.length
  ) perfect++;
}

// MUX_MAP keys with no live catalog entry
const liveSlugs = new Set(live.map((s) => s.slug));
for (const k of mapKeys) if (!liveSlugs.has(k)) {
  const inCatalog = catalog.find((c) => c.slug === k);
  warn(`MUX_MAP has "${k}" but ${inCatalog ? `catalog status=${inCatalog.status}` : "NO catalog entry"}`);
}

console.log(`Live series fully consistent: ${perfect}/${live.length}`);
console.log(`Total Mux streams mapped: ${totalStreams}`);
console.log(`Total episodes expected (live episodeCount sum): ${totalEpisodesExpected}`);
console.log(problems === 0 ? "\n✅ CONTENT INTEGRITY: 0 problems" : `\n❌ ${problems} problem(s) found`);
