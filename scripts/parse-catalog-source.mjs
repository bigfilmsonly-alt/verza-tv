import ts from "typescript";

function fail(message) {
  throw new Error(message);
}

function property(object, expectedName) {
  return object.properties.find((candidate) => {
    if (!ts.isPropertyAssignment(candidate)) return false;
    const name = candidate.name;
    return (
      (ts.isIdentifier(name) || ts.isStringLiteralLike(name)) &&
      name.text === expectedName
    );
  });
}

function stringProperty(object, name, slugForError) {
  const candidate = property(object, name);
  if (!candidate || !ts.isStringLiteralLike(candidate.initializer)) {
    fail(`Catalog entry ${slugForError} has no literal ${name}`);
  }
  return candidate.initializer.text;
}

function numberProperty(object, name, slugForError) {
  const candidate = property(object, name);
  if (!candidate || !ts.isNumericLiteral(candidate.initializer)) {
    fail(`Catalog entry ${slugForError} has no literal ${name}`);
  }
  return Number(candidate.initializer.text);
}

/**
 * Parse the literal catalog array with the TypeScript syntax tree.
 *
 * Regex parsing previously required `slug` to be the first token after `{`.
 * Two fully-free Red Carpet entries have explanatory comments before `slug`,
 * so they were silently omitted and their 25 free playback IDs were withheld.
 * The AST deliberately ignores comment placement while continuing to fail
 * closed if access-policy fields become computed or otherwise non-literal.
 */
export function parseLiteralCatalog(source) {
  const sourceFile = ts.createSourceFile(
    "lib/catalog.ts",
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  let catalogArray;

  const visit = (node) => {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === "catalog" &&
      node.initializer &&
      ts.isArrayLiteralExpression(node.initializer)
    ) {
      if (catalogArray) fail("Multiple literal catalog declarations found");
      catalogArray = node.initializer;
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);

  if (!catalogArray) fail("No literal catalog array found in lib/catalog.ts");

  const result = new Map();
  for (const entry of catalogArray.elements) {
    if (!ts.isObjectLiteralExpression(entry)) {
      fail("Every catalog array entry must remain a literal object");
    }
    const slug = stringProperty(entry, "slug", "<unknown>");
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      fail(`Catalog entry has invalid slug: ${slug}`);
    }
    if (result.has(slug)) fail(`Duplicate catalog series: ${slug}`);

    const freeEpisodes = numberProperty(entry, "freeEpisodes", slug);
    const status = stringProperty(entry, "status", slug);
    if (!Number.isSafeInteger(freeEpisodes) || freeEpisodes < 0) {
      fail(`Catalog entry ${slug} has invalid freeEpisodes`);
    }
    if (status !== "live" && status !== "coming_soon") {
      fail(`Catalog entry ${slug} has invalid status`);
    }
    result.set(slug, { freeEpisodes, status });
  }

  if (result.size === 0) fail("No series parsed from lib/catalog.ts");
  return result;
}
