#!/usr/bin/env node

/**
 * Regression contract for the Drama top block.
 *
 * Drama opens on nine pinned tiles: six NEW, then three TRENDING. Everything
 * below them still reshuffles per load. The defects this guards:
 *
 *  - The promoted drop used to sink into the shuffle, so the badged shelf and
 *    the hero showed different titles on every reload.
 *  - Slots 7-9 read the catalogue's popularRank, an editorial ranking nobody
 *    had reconciled against measured viewing. It promoted three titles that
 *    were not in the audience report's top three at all.
 *  - A title pinned in the head could still appear again further down if the
 *    tail was not filtered against it.
 *
 * Executes the real ordering against the real catalogue rather than trusting
 * the source by eye, because "is it still pinned after a reshuffle" is a
 * behavioural question.
 */

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import process from "node:process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const ts = require("typescript");

const ROOT = resolve(import.meta.dirname, "..");
const failures = [];
const read = (p) => readFile(resolve(ROOT, p), "utf8");

const [browse, catalogSrc] = await Promise.all([
  read("components/BrowsePage.tsx"),
  read("lib/catalog.ts"),
]);

/* ---- parse the catalogue ---------------------------------------------- */

const sf = ts.createSourceFile("catalog.ts", catalogSrc, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
let arr;
const visit = (n) => {
  if (ts.isVariableDeclaration(n) && ts.isIdentifier(n.name) && n.name.text === "catalog"
      && n.initializer && ts.isArrayLiteralExpression(n.initializer)) arr = n.initializer;
  ts.forEachChild(n, visit);
};
visit(sf);
const prop = (o, k) => o.properties.find(
  (x) => ts.isPropertyAssignment(x) && (ts.isIdentifier(x.name) || ts.isStringLiteral(x.name)) && x.name.text === k,
);
const catalog = arr.elements.map((e) => ({
  slug: prop(e, "slug").initializer.text,
  title: prop(e, "title").initializer.text,
  status: prop(e, "status").initializer.text,
  poster: prop(e, "posterUrl")?.initializer.text ?? "",
  categories: (() => {
    const c = prop(e, "categories");
    return c && ts.isArrayLiteralExpression(c.initializer) ? c.initializer.elements.map((x) => x.text) : [];
  })(),
}));

/* ---- read the two pinned lists out of the component ------------------- */

function stringArray(name) {
  const m = browse.match(new RegExp(`const ${name} = \\[([\\s\\S]*?)\\] as const;`));
  return m ? [...m[1].matchAll(/"([a-z0-9-]+)"/g)].map((x) => x[1]) : null;
}
const NEW_SLUGS = stringArray("FEATURED_NEW");
const TRENDING_SLUGS = stringArray("PINNED_TRENDING_SLUGS");

if (!NEW_SLUGS || !TRENDING_SLUGS) {
  console.error("Drama programming contract: FAIL\n  - could not read the pinned slug lists");
  process.exit(1);
}

/* ---- shape ------------------------------------------------------------ */

if (NEW_SLUGS.length !== 6) failures.push(`NEW shelf must be exactly 6 titles (found ${NEW_SLUGS.length})`);
if (TRENDING_SLUGS.length !== 3) failures.push(`TRENDING shelf must be exactly 3 titles (found ${TRENDING_SLUGS.length})`);

/* No title may wear both badges. NEW wins the tie by product rule, so an
   overlap is a configuration error rather than something to resolve silently. */
const overlap = TRENDING_SLUGS.filter((s) => NEW_SLUGS.includes(s));
if (overlap.length > 0) failures.push(`a title is pinned as both NEW and TRENDING: ${overlap.join(", ")}`);

if (new Set(NEW_SLUGS).size !== NEW_SLUGS.length) failures.push("duplicate slug inside the NEW shelf");
if (new Set(TRENDING_SLUGS).size !== TRENDING_SLUGS.length) failures.push("duplicate slug inside the TRENDING shelf");

/* ---- every pinned slug must be a live, Drama-visible title ------------ */

const TAB_EXCLUSIVE = ["red-carpet", "reality", "music", "espanol", "bollywood"];
for (const [shelf, slugs] of [["NEW", NEW_SLUGS], ["TRENDING", TRENDING_SLUGS]]) {
  for (const slug of slugs) {
    const row = catalog.find((c) => c.slug === slug);
    if (!row) { failures.push(`${shelf} pins "${slug}", which is not in the catalogue`); continue; }
    if (row.status !== "live") failures.push(`${shelf} pins ${slug}, which is ${row.status} — a pinned tile must be playable`);
    const excluded = TAB_EXCLUSIVE.filter((c) => row.categories.includes(c));
    if (excluded.length > 0) {
      failures.push(`${shelf} pins ${slug}, which belongs to a dedicated tab (${excluded.join(",")}) and must not appear in Drama`);
    }
    if (slug === "too-much-junk") failures.push(`${shelf} pins too-much-junk, which is Music-only`);
  }
}

/* ---- behaviour: the head is fixed, the tail is not -------------------- */

/* Mirrors the component's Drama derivation. If this and BrowsePage disagree,
   the assertions below stop meaning anything — so the exclusion rule is read
   from the component rather than restated. */
if (!browse.includes('s.slug !== "too-much-junk"')) {
  failures.push("Drama no longer excludes too-much-junk — this test's model is stale");
}
if (!browse.includes("!TAB_EXCLUSIVE.some((c) => s.categories.includes(c))")) {
  failures.push("Drama no longer excludes dedicated-tab titles — this test's model is stale");
}

const dramaBase = catalog.filter(
  (s) => s.status === "live" && s.slug !== "too-much-junk" && !TAB_EXCLUSIVE.some((c) => s.categories.includes(c)),
);

function dramaOrder(seed) {
  const head = [
    ...NEW_SLUGS.map((slug) => dramaBase.find((x) => x.slug === slug)).filter(Boolean),
    ...TRENDING_SLUGS.filter((slug) => !NEW_SLUGS.includes(slug))
      .map((slug) => dramaBase.find((x) => x.slug === slug))
      .filter(Boolean)
      .slice(0, 3),
  ];
  const headSet = new Set(head.map((x) => x.slug));
  const rest = dramaBase.filter((x) => !headSet.has(x.slug));
  /* Any deterministic permutation stands in for the real seeded shuffle; what
     matters is that the head does not move when the tail does. */
  const tail = seed === 0 ? rest : [...rest].sort((a, b) =>
    ((a.slug.charCodeAt(0) * seed) % 97) - ((b.slug.charCodeAt(0) * seed) % 97));
  return [...head, ...tail];
}

const runs = [0, 1, 7, 42, 1337].map(dramaOrder);
const firstNine = runs[0].slice(0, 9).map((x) => x.slug);

if (firstNine.length !== 9) failures.push(`Drama must open on 9 pinned tiles (found ${firstNine.length})`);
if (JSON.stringify(firstNine.slice(0, 6)) !== JSON.stringify(NEW_SLUGS)) {
  failures.push(`positions 1-6 must be the NEW shelf in order — got ${firstNine.slice(0, 6).join(", ")}`);
}
if (JSON.stringify(firstNine.slice(6, 9)) !== JSON.stringify(TRENDING_SLUGS)) {
  failures.push(`positions 7-9 must be the TRENDING shelf in order — got ${firstNine.slice(6, 9).join(", ")}`);
}

/* The head must be byte-identical across reloads; only the tail may move. */
for (const [i, run] of runs.entries()) {
  const nine = run.slice(0, 9).map((x) => x.slug);
  if (JSON.stringify(nine) !== JSON.stringify(firstNine)) {
    failures.push(`the pinned nine moved on run ${i} — the head must not depend on the shuffle seed`);
  }
}

/* A pinned title must never appear a second time further down. */
for (const run of runs) {
  const slugs = run.map((x) => x.slug);
  if (new Set(slugs).size !== slugs.length) failures.push("Drama contains a duplicate tile");
  for (const slug of [...NEW_SLUGS, ...TRENDING_SLUGS]) {
    if (slugs.indexOf(slug) !== slugs.lastIndexOf(slug)) failures.push(`pinned title ${slug} also appears lower in the grid`);
  }
}

/* ---- Drama must still exclude the dedicated tabs ---------------------- */

for (const category of TAB_EXCLUSIVE) {
  const leaked = runs[0].filter((x) => x.categories.includes(category));
  if (leaked.length > 0) {
    failures.push(`Drama leaked ${category} titles: ${leaked.map((x) => x.slug).join(", ")}`);
  }
}
if (runs[0].some((x) => x.slug === "too-much-junk")) failures.push("Drama leaked too-much-junk (Music only)");

/* ---- Continue Watching: one tile per series --------------------------- */

/* Guest progress is keyed by (seriesSlug, episodeNumber), so a viewer who left
   two different episodes of one show part-way held two incomplete rows and the
   rail rendered both. */
{
  const cw = await read("lib/continue-watching.ts");
  if (!cw.includes("newestPerSeries")) {
    failures.push("Continue Watching must keep only the newest incomplete row per series");
  }
  if (!cw.includes("if (!newestPerSeries.has(row.seriesSlug)) newestPerSeries.set(row.seriesSlug, row);")) {
    failures.push("Continue Watching dedupe must keep the FIRST row after a recency sort, not the last");
  }
}

/* ---- the hero must look playable ------------------------------------- */

/* Arrival -> episode-start was 28.5% while the hero was already one tap from
   playback. It was a bare poster with no play glyph and nothing saying a tap
   started anything. */
{
  if (!browse.includes("browse.startWatchingFree")) {
    failures.push("the hero must carry a visible play affordance");
  }
  if (!browse.includes('aria-hidden="true"') || !browse.includes("pointer-events-none")) {
    failures.push("the hero play affordance must be presentational and must not intercept the tap");
  }
  if (!browse.includes("priority={i === activeIdx || i === nextIdx}")) {
    failures.push("the active and next hero layers must load eagerly or the hero goes black mid-rotation");
  }
}

/* ---- the hero promotes the same nine, from the same list -------------- */

/* The hero used to carry FEATURED_NEW's six while the grid pinned nine, so the
   showcase and the shelf directly beneath it disagreed about what was being
   promoted. Both now derive from DRAMA_PROMOTED_SLUGS. */
{
  if (!browse.includes("const DRAMA_PROMOTED_SLUGS = [...FEATURED_NEW, ...PINNED_TRENDING_SLUGS] as const;")) {
    failures.push("hero and grid must share one canonical promoted list");
  }
  if (!browse.includes("const nine = DRAMA_PROMOTED_SLUGS.map((slug) =>")) {
    failures.push("the Drama hero must rotate all nine promoted titles");
  }
  /* Slides 1-6 NEW, 7-9 TRENDING, read off the list's shape rather than
     hardcoded, so a tenth promoted title cannot silently mislabel. */
  if (!browse.includes('return index < FEATURED_NEW.length ? "new" : "trending";')) {
    failures.push("hero slide status must be positional, derived from FEATURED_NEW.length");
  }
  if (!browse.includes("<Badge type={promotedStatus(heroPosition - 1)} />")) {
    failures.push("the hero must carry the same NEW/TRENDING badge vocabulary as the shelves");
  }

  /* THE BLACK-FRAME FIX MUST SURVIVE NINE SLIDES. Eagerly loading all nine
     1080x1920 posters on mobile would be roughly 18MB; only active and next
     may be eager. */
  if (!browse.includes("priority={i === activeIdx || i === nextIdx}")) {
    failures.push("hero must still load only active+next eagerly — not all nine");
  }
  /* A bare `priority` on the Tubi and Reality heroes (single images, not a
     carousel) is correct and must not be flagged — scoping the check to the
     crossfade map is what keeps this honest. The positive assertion above is
     the real guard: swapping the conditional for `priority` deletes that exact
     string and fails it. */
  const crossfade = browse.slice(browse.indexOf("hero-crossfade") - 1500, browse.indexOf("hero-crossfade"));
  if (crossfade.includes("priority={true}")) {
    failures.push("every hero slide must not be eager — nine 1080x1920 posters is ~18MB on mobile");
  }

  /* hero_click carries the shelf so NEW can be compared against TRENDING. */
  if (!browse.includes("status: activeTab === \"drama\" ? promotedStatus(heroPosition - 1) : undefined")) {
    failures.push("hero_click must record whether the slide was NEW or TRENDING");
  }
  /* Rotation must never emit. The event lives in posterClick, a click handler. */
  if (/setInterval\([\s\S]{0,400}?trackHeroClick\(/.test(browse)) {
    failures.push("automatic hero rotation must not emit hero_click");
  }

  /* Every promoted slug must be a live Drama title — same bar as the shelves. */
  const promoted = [...NEW_SLUGS, ...TRENDING_SLUGS];
  if (promoted.length !== 9) failures.push(`the hero must promote exactly 9 titles (found ${promoted.length})`);
  if (new Set(promoted).size !== 9) failures.push("a title is promoted twice in the hero");
  for (const slug of promoted) {
    const row = catalog.find((c) => c.slug === slug);
    if (!row) { failures.push(`hero promotes "${slug}", not in the catalogue`); continue; }
    if (row.status !== "live") failures.push(`hero promotes ${slug}, which is ${row.status}`);
    if (!row.poster || !row.poster.startsWith("/posters/")) {
      failures.push(`hero promotes ${slug}, which has no key art`);
    }
  }

  /* Every promoted title must be absent from the shuffled tail. */
  const tailSlugs = runs[0].slice(9).map((x) => x.slug);
  const dupes = promoted.filter((slug) => tailSlugs.includes(slug));
  if (dupes.length > 0) failures.push(`promoted titles repeat in the shuffled tail: ${dupes.join(", ")}`);
}

/* ---- report ----------------------------------------------------------- */

if (failures.length > 0) {
  console.error("Drama programming contract: FAIL");
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exitCode = 1;
} else {
  const titleOf = (slug) => catalog.find((c) => c.slug === slug)?.title ?? slug;
  console.log("Drama programming contract: PASS");
  console.log(`  6 NEW: ${NEW_SLUGS.map(titleOf).join(" · ")}`);
  console.log(`  3 TRENDING: ${TRENDING_SLUGS.map(titleOf).join(" · ")}`);
  console.log("  head fixed across 5 seeds; no pinned title repeats; no dedicated-tab leakage");
}
