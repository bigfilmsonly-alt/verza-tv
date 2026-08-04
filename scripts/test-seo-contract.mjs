#!/usr/bin/env node

/** Static release regression for titles, canonicals, sitemaps, and store promotion. */

import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import ts from "typescript";

const ROOT = resolve(import.meta.dirname, "..");

async function source(relativePath) {
  return readFile(resolve(ROOT, relativePath), "utf8");
}

function syntaxTree(text, fileName) {
  return ts.createSourceFile(
    fileName,
    text,
    ts.ScriptTarget.Latest,
    true,
    fileName.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
}

function unwrap(expression) {
  let current = expression;
  while (
    ts.isAsExpression(current) ||
    ts.isSatisfiesExpression(current) ||
    ts.isParenthesizedExpression(current)
  ) {
    current = current.expression;
  }
  return current;
}

function variableInitializer(text, fileName, variableName) {
  const tree = syntaxTree(text, fileName);
  let result;
  const visit = (node) => {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === variableName &&
      node.initializer
    ) {
      assert.equal(result, undefined, `${fileName} declares ${variableName} more than once`);
      result = unwrap(node.initializer);
    }
    ts.forEachChild(node, visit);
  };
  visit(tree);
  assert.ok(result, `${fileName} must declare ${variableName}`);
  return result;
}

function objectProperty(object, expectedName, context) {
  assert.ok(ts.isObjectLiteralExpression(object), `${context} must be an object literal`);
  const matches = object.properties.filter((candidate) => {
    if (!ts.isPropertyAssignment(candidate)) return false;
    return (
      (ts.isIdentifier(candidate.name) || ts.isStringLiteralLike(candidate.name)) &&
      candidate.name.text === expectedName
    );
  });
  assert.equal(matches.length, 1, `${context} must have one ${expectedName} property`);
  return unwrap(matches[0].initializer);
}

function optionalObjectProperty(object, expectedName) {
  if (!ts.isObjectLiteralExpression(object)) return undefined;
  const matches = object.properties.filter((candidate) => {
    if (!ts.isPropertyAssignment(candidate)) return false;
    return (
      (ts.isIdentifier(candidate.name) || ts.isStringLiteralLike(candidate.name)) &&
      candidate.name.text === expectedName
    );
  });
  assert.ok(matches.length <= 1, `object must not repeat ${expectedName}`);
  return matches[0] ? unwrap(matches[0].initializer) : undefined;
}

function stringLiteral(expression, context) {
  assert.ok(ts.isStringLiteralLike(expression), `${context} must be a string literal`);
  return expression.text;
}

function stringArray(initializer, context) {
  assert.ok(ts.isArrayLiteralExpression(initializer), `${context} must be an array literal`);
  return initializer.elements.map((entry, index) =>
    stringLiteral(unwrap(entry), `${context}[${index}]`),
  );
}

function topLevelInitializers(tree) {
  const result = new Map();
  for (const statement of tree.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (ts.isIdentifier(declaration.name) && declaration.initializer) {
        result.set(declaration.name.text, unwrap(declaration.initializer));
      }
    }
  }
  return result;
}

function expressionVariants(expression, constants, seen = new Set()) {
  const current = unwrap(expression);
  if (ts.isStringLiteralLike(current)) return [current.text];
  if (ts.isIdentifier(current)) {
    const initializer = constants.get(current.text);
    if (!initializer || seen.has(current.text)) return [`<${current.text}>`];
    return expressionVariants(initializer, constants, new Set([...seen, current.text]));
  }
  if (
    ts.isPropertyAccessExpression(current) &&
    ts.isIdentifier(current.expression) &&
    current.expression.text === "BRAND" &&
    current.name.text === "name"
  ) {
    return ["VERZA TV"];
  }
  if (ts.isTemplateExpression(current)) {
    let variants = [current.head.text];
    for (const span of current.templateSpans) {
      const inserted = expressionVariants(span.expression, constants, seen);
      variants = variants.flatMap((prefix) =>
        inserted.map((value) => `${prefix}${value}${span.literal.text}`),
      );
    }
    return variants;
  }
  if (ts.isBinaryExpression(current) && current.operatorToken.kind === ts.SyntaxKind.PlusToken) {
    return expressionVariants(current.left, constants, seen).flatMap((left) =>
      expressionVariants(current.right, constants, seen).map((right) => `${left}${right}`),
    );
  }
  if (ts.isConditionalExpression(current)) {
    return [
      ...expressionVariants(current.whenTrue, constants, seen),
      ...expressionVariants(current.whenFalse, constants, seen),
    ];
  }
  return ["<dynamic>"];
}

async function pageFiles(directory = "app") {
  const result = [];
  for (const entry of await readdir(resolve(ROOT, directory), { withFileTypes: true })) {
    const relative = `${directory}/${entry.name}`;
    if (entry.isDirectory()) result.push(...await pageFiles(relative));
    else if (entry.name === "page.tsx") result.push(relative);
  }
  return result;
}

function returnedMetadataObjects(functionDeclaration) {
  const result = [];
  const visit = (node) => {
    if (node !== functionDeclaration && ts.isFunctionLike(node)) return;
    if (ts.isReturnStatement(node) && node.expression) {
      const expression = unwrap(node.expression);
      if (ts.isObjectLiteralExpression(expression)) result.push(expression);
      return;
    }
    ts.forEachChild(node, visit);
  };
  visit(functionDeclaration.body);
  return result;
}

function documentTitleVariants(text, fileName) {
  const tree = syntaxTree(text, fileName);
  const constants = topLevelInitializers(tree);
  const metadataObjects = [];

  const staticMetadata = constants.get("metadata");
  if (staticMetadata && ts.isObjectLiteralExpression(staticMetadata)) {
    metadataObjects.push(staticMetadata);
  }
  for (const statement of tree.statements) {
    if (
      ts.isFunctionDeclaration(statement) &&
      statement.name?.text === "generateMetadata"
    ) {
      metadataObjects.push(...returnedMetadataObjects(statement));
    }
  }

  return metadataObjects.flatMap((metadataObject) => {
    const title = optionalObjectProperty(metadataObject, "title");
    if (!title) return [];
    if (ts.isObjectLiteralExpression(title)) {
      // Explicit absolute titles intentionally bypass the root template.
      if (optionalObjectProperty(title, "absolute")) return [];
      return [];
    }
    return expressionVariants(title, constants);
  });
}

function literalObjectCount(text, fileName, variableName, predicate = () => true) {
  const initializer = variableInitializer(text, fileName, variableName);
  assert.ok(ts.isArrayLiteralExpression(initializer), `${variableName} must remain literal`);
  return initializer.elements.filter((element) => {
    const object = unwrap(element);
    assert.ok(ts.isObjectLiteralExpression(object), `${variableName} entries must be objects`);
    return predicate(object);
  }).length;
}

const [discoverPage, rootLayout, catalog, categorySource, genrePage, genreSitemap] =
  await Promise.all([
    source("app/discover/page.tsx"),
    source("app/layout.tsx"),
    source("lib/catalog.ts"),
    source("lib/discover-categories.ts"),
    source("app/discover/[genre]/page.tsx"),
    source("app/sitemaps/genres.xml/route.ts"),
  ]);

const discoverMetadata = variableInitializer(
  discoverPage,
  "app/discover/page.tsx",
  "metadata",
);
const discoverTitle = stringLiteral(
  objectProperty(discoverMetadata, "title", "Discover metadata"),
  "Discover metadata title",
);
assert.equal(discoverTitle, "Discover Micro-Dramas");
assert.doesNotMatch(discoverTitle, /VERZA TV/i, "child title must not repeat root branding");

const discoverAlternates = objectProperty(
  discoverMetadata,
  "alternates",
  "Discover metadata",
);
assert.equal(
  stringLiteral(
    objectProperty(discoverAlternates, "canonical", "Discover alternates"),
    "Discover canonical",
  ),
  "/discover",
);

const rootMetadata = variableInitializer(rootLayout, "app/layout.tsx", "metadata");
const rootTitle = objectProperty(rootMetadata, "title", "root metadata");
assert.equal(
  stringLiteral(objectProperty(rootTitle, "template", "root title"), "root title template"),
  "%s | VERZA TV",
);

const browseTabs = variableInitializer(catalog, "lib/catalog.ts", "BROWSE_TABS");
assert.ok(ts.isArrayLiteralExpression(browseTabs), "BROWSE_TABS must remain literal");
const browseKeys = browseTabs.elements.map((entry, index) =>
  stringLiteral(
    objectProperty(unwrap(entry), "key", `BROWSE_TABS[${index}]`),
    `BROWSE_TABS[${index}].key`,
  ),
);
assert.equal(new Set(browseKeys).size, browseKeys.length, "BROWSE_TABS keys must be unique");

for (const requiredCategory of ["anime", "espanol", "bollywood", "creators", "tubi"]) {
  assert.ok(
    browseKeys.includes(requiredCategory),
    `BROWSE_TABS must include canonical ${requiredCategory}`,
  );
}

const editorialCategories = stringArray(
  variableInitializer(
    categorySource,
    "lib/discover-categories.ts",
    "EDITORIAL_DISCOVER_CATEGORY_SLUGS",
  ),
  "EDITORIAL_DISCOVER_CATEGORY_SLUGS",
);
for (const slug of [...browseKeys, ...editorialCategories]) {
  assert.match(slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/, `invalid Discover slug: ${slug}`);
}

assert.match(categorySource, /import\s*\{\s*BROWSE_TABS\s*\}\s*from\s*["']@\/lib\/catalog["']/);
assert.match(categorySource, /new\s+Set<string>\s*\(/, "Discover slugs must be deduplicated");
assert.match(
  categorySource,
  /BROWSE_TABS\.map\(\(tab\)\s*=>\s*tab\.key\)/,
  "Discover slugs must derive from canonical BROWSE_TABS",
);
assert.match(
  genrePage,
  /DISCOVER_CATEGORY_SLUGS\.map\(\(genre\)\s*=>\s*\(\{\s*genre\s*\}\)\)/,
  "static Discover routes must use the canonical slug set",
);
assert.match(
  genreSitemap,
  /DISCOVER_CATEGORY_SLUGS\.map\(/,
  "genre sitemap must use the canonical Discover slug set",
);
assert.doesNotMatch(
  genreSitemap,
  /const\s+discoverSlugs\s*=\s*\[/,
  "genre sitemap must not restore a hand-maintained Discover list",
);

const allPageFiles = await pageFiles();
const allPageSources = new Map(
  await Promise.all(
    allPageFiles.map(async (fileName) => [fileName, await source(fileName)]),
  ),
);
const repeatedBrandViolations = [];
let auditedDocumentTitles = 0;
for (const [fileName, text] of allPageSources) {
  // app/page.tsx shares the root layout segment, so the root template does not
  // apply to that one document title. Every nested page is a template child.
  if (fileName === "app/page.tsx") continue;
  const variants = documentTitleVariants(text, fileName);
  auditedDocumentTitles += variants.length;
  for (const title of variants) {
    if (/\|\s*VERZA TV(?:\s+(?:Admin|Shop))?\s*$/i.test(title)) {
      repeatedBrandViolations.push(`${fileName}: ${title}`);
    }
  }
}
assert.ok(auditedDocumentTitles >= 60, "document-title audit covered too few routes");
assert.deepEqual(
  repeatedBrandViolations,
  [],
  "child document titles must let the root template add the only trailing brand",
);

const formerlyDoubledStaticRoutes = [
  ["/about", "app/about/page.tsx"],
  ["/amazon", "app/amazon/page.tsx"],
  ["/brand-assets", "app/brand-assets/page.tsx"],
  ["/careers", "app/careers/page.tsx"],
  ["/channels", "app/channels/page.tsx"],
  ["/discover", "app/discover/page.tsx"],
  ["/genres", "app/genres/page.tsx"],
  ["/guides", "app/guides/page.tsx"],
  ["/help", "app/help/page.tsx"],
  ["/investors", "app/investors/page.tsx"],
  ["/leadership", "app/leadership/page.tsx"],
  ["/newsroom", "app/newsroom/page.tsx"],
  ["/partnerships", "app/partnerships/page.tsx"],
  ["/press", "app/press/page.tsx"],
  ["/privacy", "app/privacy/page.tsx"],
  ["/refund-policy", "app/refund-policy/page.tsx"],
  ["/shop", "app/shop/page.tsx"],
  ["/shorts", "app/shorts/page.tsx"],
  ["/terms", "app/terms/page.tsx"],
];
assert.equal(formerlyDoubledStaticRoutes.length, 19);

const [pagesSitemap, sitemapRegistry, alanData, bestData, collectionData,
  comparisonData, guideData, genreData, footer, clipPage] = await Promise.all([
  source("app/sitemaps/pages.xml/route.ts"),
  source("lib/data/sitemap.ts"),
  source("lib/data/alan.ts"),
  source("lib/data/best-lists.ts"),
  source("lib/data/collections.ts"),
  source("lib/data/compare.ts"),
  source("lib/data/guides.ts"),
  source("lib/content/genres.ts"),
  source("components/Footer.tsx"),
  source("app/c/[slug]/page.tsx"),
]);
const combinedSitemapSource = `${pagesSitemap}\n${sitemapRegistry}`;

for (const [routePath, fileName] of formerlyDoubledStaticRoutes) {
  assert.match(
    combinedSitemapSource,
    new RegExp(`["']${routePath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["']`),
    `${routePath} must remain in the pages sitemap`,
  );
  const text = allPageSources.get(fileName);
  assert.ok(text, `${fileName} must remain a page`);
  const metadata = variableInitializer(text, fileName, "metadata");
  const constants = topLevelInitializers(syntaxTree(text, fileName));
  const title = objectProperty(metadata, "title", `${routePath} metadata`);
  assert.ok(
    expressionVariants(title, constants).every(
      (value) => !/\|\s*VERZA TV(?:\s+(?:Admin|Shop))?\s*$/i.test(value),
    ),
    `${routePath} child title must not contain the root brand suffix`,
  );
  const alternates = objectProperty(metadata, "alternates", `${routePath} metadata`);
  const canonical = objectProperty(alternates, "canonical", `${routePath} alternates`);
  assert.ok(
    expressionVariants(canonical, constants).some((value) => value.endsWith(routePath)),
    `${routePath} must retain its self-canonical`,
  );
}

const dynamicFormerlyDoubledGroups = [
  [
    "alan-mruvka",
    literalObjectCount(alanData, "lib/data/alan.ts", "ALAN_SUBPAGES"),
    5,
    "app/alan-mruvka/[slug]/page.tsx",
  ],
  [
    "best",
    literalObjectCount(bestData, "lib/data/best-lists.ts", "BEST_LISTS"),
    15,
    "app/best/[slug]/page.tsx",
  ],
  [
    "collections",
    literalObjectCount(collectionData, "lib/data/collections.ts", "COLLECTIONS"),
    12,
    "app/collections/[slug]/page.tsx",
  ],
  [
    "compare",
    literalObjectCount(comparisonData, "lib/data/compare.ts", "COMPARISONS"),
    6,
    "app/compare/[slug]/page.tsx",
  ],
  [
    "genres",
    literalObjectCount(
      genreData,
      "lib/content/genres.ts",
      "GENRE_HUBS",
      (object) => optionalObjectProperty(object, "editorialApproved")?.kind === ts.SyntaxKind.TrueKeyword,
    ),
    27,
    "app/genres/[slug]/page.tsx",
  ],
  [
    "guides",
    literalObjectCount(guideData, "lib/data/guides.ts", "GUIDES"),
    8,
    "app/guides/[slug]/page.tsx",
  ],
];

for (const [routePrefix, actualCount, expectedCount, fileName] of dynamicFormerlyDoubledGroups) {
  assert.equal(actualCount, expectedCount, `/${routePrefix} sitemap inventory changed`);
  assert.match(
    sitemapRegistry,
    new RegExp("loc:\\s*`/" + routePrefix + "/\\$\\{"),
    `/${routePrefix} family must remain in the pages sitemap`,
  );
  const variants = documentTitleVariants(allPageSources.get(fileName), fileName);
  assert.ok(variants.length > 0, `${fileName} must expose document metadata`);
  assert.ok(
    variants.every((value) => !/\|\s*VERZA TV\s*$/i.test(value)),
    `${fileName} must rely on the root title template`,
  );
  assert.match(
    allPageSources.get(fileName),
    new RegExp("canonical:\\s*`/" + routePrefix + "/\\$\\{slug\\}`"),
    `/${routePrefix} metadata must remain self-canonical`,
  );
}

const formerlyDoubledSitemapUrlCount = formerlyDoubledStaticRoutes.length +
  dynamicFormerlyDoubledGroups.reduce((sum, group) => sum + group[1], 0);
assert.equal(
  formerlyDoubledSitemapUrlCount,
  92,
  "the known doubled-title sitemap inventory changed; re-audit before updating this gate",
);

assert.doesNotMatch(footer, /\b(?:App Store|Google Play)\b/i);
assert.doesNotMatch(clipPage, /Available on (?:iOS|Android)|google-play-app/i);
for (const legalOrSupportPage of [
  "app/help/page.tsx",
  "app/privacy/page.tsx",
  "app/refund-policy/page.tsx",
  "app/support/page.tsx",
  "app/terms/page.tsx",
]) {
  assert.doesNotMatch(
    allPageSources.get(legalOrSupportPage),
    /\bGoogle Play\b|(?:App Store|Google Play)\s*(?:badge|button)/i,
    `${legalOrSupportPage} must not promote an inert store control`,
  );
}

console.log(
  `SEO contract: PASS (${auditedDocumentTitles} document-title branches; ${
    formerlyDoubledSitemapUrlCount} former sitemap duplicates; ${browseKeys.length} browse tabs; ${
    new Set([...browseKeys, ...editorialCategories]).size
  } canonical Discover category routes)`,
);
