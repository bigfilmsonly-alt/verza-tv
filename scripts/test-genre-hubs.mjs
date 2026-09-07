#!/usr/bin/env node

/**
 * Behavioural contract for /discover/[genre] hub membership.
 *
 * This EXECUTES lib/genre-hub.ts, with TAB_EXCLUSIVE_CATEGORIES and the
 * language-tab set read out of their real source files rather than restated
 * here. A test that hardcoded either list would keep passing after someone
 * changed it, which is the failure mode worth avoiding: both lists are the
 * definition of correct, not an input to it.
 *
 * Two defects are named here.
 *
 *   1. /discover/espanol and /discover/bollywood listed ZERO live series while
 *      five Spanish and six Hindi titles were live. Hubs matched the free-text
 *      genre string, and those titles' genre strings are written in their own
 *      language ("Drama · Pasión"), so an English slug could never match. Both
 *      pages are indexed and sit in genres.xml.
 *
 *   2. The obvious repair — match every hub by category as well as by text —
 *      silently rewrites hubs that were never broken: /discover/drama goes
 *      from 25 titles to 76, and /discover/popular, the RETIRED Hot tab whose
 *      copy says "these titles browse under Drama", refills with 10. Assertion
 *      "non-language hubs are unchanged" is the guard against fixing two
 *      indexed pages by breaking two others.
 */

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import process from "node:process";
import vm from "node:vm";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const ts = require("typescript");

const ROOT = resolve(import.meta.dirname, "..");
const failures = [];
const read = (p) => readFile(resolve(ROOT, p), "utf8");

const [catalogSrc, audioSrc, hubSrc, discoverSrc] = await Promise.all([
  read("lib/catalog.ts"),
  read("lib/audio-language.ts"),
  read("lib/genre-hub.ts"),
  read("lib/discover-categories.ts"),
]);

/* ---------- read the catalogue and the two authoritative lists ---------- */

function ast(source, name) {
  return ts.createSourceFile(name, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
}
/** Unwraps `as const` / `satisfies` so the array literal underneath is reachable. */
function unwrap(node) {
  while (node && (ts.isAsExpression(node) || ts.isSatisfiesExpression?.(node) ||
         ts.isParenthesizedExpression(node))) {
    node = node.expression;
  }
  return node;
}
function findDecl(source, name) {
  const sf = ast(source, name);
  let found;
  const visit = (n) => {
    if (ts.isVariableDeclaration(n) && ts.isIdentifier(n.name) && n.name.text === name) {
      found = unwrap(n.initializer);
    }
    ts.forEachChild(n, visit);
  };
  visit(sf);
  return found;
}
const prop = (o, name) =>
  o.properties.find(
    (p) =>
      ts.isPropertyAssignment(p) &&
      (ts.isIdentifier(p.name) || ts.isStringLiteral(p.name)) &&
      p.name.text === name,
  );

const catalogArray = findDecl(catalogSrc, "catalog");
if (!catalogArray || !ts.isArrayLiteralExpression(catalogArray)) {
  console.error("Genre hub contract: FAIL\n  - could not parse the literal catalog");
  process.exit(1);
}
const series = catalogArray.elements.map((e) => ({
  slug: prop(e, "slug")?.initializer.text,
  genre: prop(e, "genre")?.initializer.text ?? "",
  status: prop(e, "status")?.initializer.text,
  categories: (() => {
    const c = prop(e, "categories");
    return c && ts.isArrayLiteralExpression(c.initializer)
      ? c.initializer.elements.map((x) => x.text)
      : [];
  })(),
}));

const tabExclusive = findDecl(catalogSrc, "TAB_EXCLUSIVE_CATEGORIES").elements.map((e) => e.text);
const languageMap = findDecl(audioSrc, "LANGUAGE_BY_CATEGORY");
const languageTabs = languageMap.properties.map((p) => p.name.text);

/* Hub slugs, read from the same place the route's generateStaticParams reads. */
const browseTabs = [...catalogSrc.matchAll(/key:\s*"([a-z-]+)"/g)].map((m) => m[1]);
const editorial = findDecl(discoverSrc, "EDITORIAL_DISCOVER_CATEGORY_SLUGS").elements.map(
  (e) => e.text,
);
const hubSlugs = [...new Set([...browseTabs, ...editorial])];

/* ---------- execute the real lib/genre-hub.ts ---------- */

const { outputText } = ts.transpileModule(hubSrc, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
});
const stubs = {
  "@/lib/catalog": { TAB_EXCLUSIVE_CATEGORIES: tabExclusive },
  "@/lib/audio-language": {
    isLanguageCategory: (v) => languageTabs.includes(v),
  },
};
const moduleRef = { exports: {} };
const sandbox = {
  module: moduleRef,
  exports: moduleRef.exports,
  Object,
  require: (id) => {
    if (!(id in stubs)) throw new Error(`unexpected import in lib/genre-hub.ts: ${id}`);
    return stubs[id];
  },
};
vm.createContext(sandbox);
vm.runInContext(outputText, sandbox);

const { seriesForHub, hubMatches, isGenreHubEligible } = moduleRef.exports;
for (const [name, fn] of Object.entries({ seriesForHub, hubMatches, isGenreHubEligible })) {
  if (typeof fn !== "function") failures.push(`lib/genre-hub.ts no longer exports ${name}()`);
}
if (failures.length > 0) {
  console.error("Genre hub contract: FAIL");
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}

const live = (rows) => rows.filter((s) => s.status === "live");
const hubLive = (slug) => live(seriesForHub(series, slug));

/* The behaviour as it stood before language hubs matched by category. Used to
   prove the change is confined to the language hubs. */
const legacyLive = (slug) =>
  live(
    series
      .filter((s) => s.genre.toLowerCase().includes(slug.toLowerCase()))
      .filter((s) => isGenreHubEligible(s, slug)),
  );

/* ---------- 1. the language hubs are no longer empty ---------- */

for (const tab of languageTabs) {
  const rows = hubLive(tab);
  if (rows.length === 0) {
    failures.push(`/discover/${tab} lists 0 live series; this is the shipped SEO-shell defect`);
  }
  const expected = live(series).filter((s) => s.categories.includes(tab));
  const missing = expected.filter((e) => !rows.some((r) => r.slug === e.slug));
  if (missing.length > 0) {
    failures.push(`/discover/${tab} omits live ${tab} titles: ${missing.map((s) => s.slug).join(", ")}`);
  }
  const foreign = rows.filter((r) => !r.categories.includes(tab));
  if (foreign.length > 0) {
    failures.push(`/discover/${tab} lists titles that are not ${tab}: ${foreign.map((s) => s.slug).join(", ")}`);
  }
}

/* ---------- 2. every other hub is byte-for-byte unchanged ---------- */

for (const slug of hubSlugs.filter((s) => !languageTabs.includes(s))) {
  const now = hubLive(slug).map((s) => s.slug).join(",");
  const before = legacyLive(slug).map((s) => s.slug).join(",");
  if (now !== before) {
    failures.push(
      `/discover/${slug} changed (${legacyLive(slug).length} -> ${hubLive(slug).length}); ` +
        `only the language hubs may change`,
    );
  }
}

/* ---------- 3. generic hubs still contain no language titles ---------- */

for (const slug of hubSlugs.filter((s) => !tabExclusive.includes(s))) {
  const leaked = hubLive(slug).filter((s) =>
    languageTabs.some((tab) => s.categories.includes(tab)),
  );
  if (leaked.length > 0) {
    failures.push(`/discover/${slug} leaks language titles: ${leaked.map((s) => s.slug).join(", ")}`);
  }
}

/* ---------- 4. no hub throws, and a hub never excludes its own category ---------- */

for (const slug of hubSlugs) {
  try {
    hubLive(slug);
  } catch (error) {
    failures.push(`/discover/${slug} threw: ${error.message}`);
  }
}
/* A hub must never exclude its OWN category. Checked for the language hubs,
   which is what this change governs; see the reported list below for
   tab-exclusive hubs that are empty for a different reason. */
for (const tab of languageTabs) {
  const owned = live(series).filter((s) => s.categories.includes(tab));
  if (owned.length > 0 && hubLive(tab).length === 0) {
    failures.push(`/discover/${tab} excluded its own category and emptied the hub`);
  }
}

/* Reported, not asserted. A tab-exclusive hub with live titles and an empty
   page is a real defect, but not the one this change fixes and not one to
   silently repair: /discover/red-carpet is empty because the slug is
   "red-carpet" while the genre reads "Red Carpet", so the substring match
   fails on the hyphen. Printing it on every run keeps it from being forgotten
   without asserting that today's behaviour is correct. */
const emptyOwnHubs = tabExclusive
  .filter((tab) => hubSlugs.includes(tab) && !languageTabs.includes(tab))
  .map((tab) => ({ tab, owned: live(series).filter((s) => s.categories.includes(tab)).length, shown: hubLive(tab).length }))
  .filter((row) => row.owned > 0 && row.shown === 0);

if (failures.length > 0) {
  console.error("Genre hub contract: FAIL");
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exitCode = 1;
} else {
  const summary = languageTabs.map((t) => `${t}:${hubLive(t).length}`).join(" ");
  console.log("Genre hub contract: PASS");
  console.log(`  language hubs populated (${summary}); all other hubs unchanged`);
  for (const row of emptyOwnHubs) {
    console.log(
      `  NOTE: /discover/${row.tab} still lists 0 of its ${row.owned} live titles ` +
        `(separate defect, not this change)`,
    );
  }
}
