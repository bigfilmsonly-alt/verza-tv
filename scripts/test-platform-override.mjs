#!/usr/bin/env node

/**
 * Behavioural contract for the `?platform` override.
 *
 * This EXECUTES lib/platform.ts against a simulated window/localStorage/
 * navigator rather than pattern-matching its source, because the defect it
 * guards was a missing code path: a regex asserting `removeItem` appears in
 * the file would pass on a version that never reaches it.
 *
 * The defect: `?platform=ios` persisted `verza-platform=ios` with no removal
 * path, no override and no expiry. One tagged marketing link, QR code or
 * shared URL permanently converted a real web browser into one that could
 * never buy, and told the visitor the episode "isn't available in this app"
 * while they were on the open web. It also suppressed GTM/AdSense, so the
 * trapped browser never appeared in the funnel as a lost sale.
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

const source = await readFile(resolve(ROOT, "lib/platform.ts"), "utf8");
const { outputText } = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
  },
});

const WEB_UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1";
const APP_UA = `${WEB_UA} VerzaTV-iOS`;
const DESKTOP_UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/126 Safari/537.36";

function makeStorage(initial, throws) {
  const map = new Map(Object.entries(initial));
  const guard = () => { if (throws) throw new Error("site data blocked"); };
  return {
    getItem(key) { guard(); return map.has(key) ? map.get(key) : null; },
    setItem(key, value) { guard(); map.set(key, String(value)); },
    removeItem(key) { guard(); map.delete(key); },
    snapshot() { return Object.fromEntries(map); },
  };
}

/** Runs isIOSApp() once in an isolated context. Returns its result and the resulting storage. */
function run({ search = "", stored = {}, ua = DESKTOP_UA, standalone, storageThrows = false } = {}) {
  const storage = makeStorage(stored, storageThrows);
  const navigator = { userAgent: ua };
  if (standalone !== undefined) navigator.standalone = standalone;

  const moduleRef = { exports: {} };
  const sandbox = {
    module: moduleRef,
    exports: moduleRef.exports,
    Object,
    URLSearchParams,
    window: { location: { search } },
    localStorage: storage,
    navigator,
  };
  vm.createContext(sandbox);
  vm.runInContext(outputText, sandbox);

  const isIOSApp = moduleRef.exports.isIOSApp;
  if (typeof isIOSApp !== "function") {
    failures.push("lib/platform.ts no longer exports isIOSApp()");
    return { result: null, storage: storage.snapshot() };
  }
  return { result: isIOSApp(), storage: storage.snapshot() };
}

function expect(name, actual, expected) {
  if (actual !== expected) failures.push(`${name}: expected ${expected}, got ${actual}`);
}

function expectStored(name, storage, expected) {
  const actual = storage["verza-platform"] ?? null;
  if (actual !== expected) failures.push(`${name}: stored value expected ${expected}, got ${actual}`);
}

/* A. Fresh browser, no query — normal web behaviour, nothing written. */
{
  const { result, storage } = run();
  expect("A fresh browser is web", result, false);
  expectStored("A fresh browser writes nothing", storage, null);
}

/* B. ?platform=ios — override active and persisted. */
{
  const { result, storage } = run({ search: "?platform=ios" });
  expect("B ?platform=ios classifies as iOS", result, true);
  expectStored("B ?platform=ios persists", storage, "ios");
}

/* C. THE FIX. Persisted override, then ?platform=web — released, web restored. */
{
  const { result, storage } = run({
    search: "?platform=web",
    stored: { "verza-platform": "ios" },
  });
  expect("C ?platform=web releases a trapped browser", result, false);
  expectStored("C ?platform=web clears the persisted override", storage, null);
}

/* E. Navigation after recovery — stays web, with no query string. */
{
  const recovered = run({ search: "?platform=web", stored: { "verza-platform": "ios" } });
  const { result, storage } = run({ search: "", stored: recovered.storage });
  expect("E recovery survives the next navigation", result, false);
  expectStored("E recovery leaves no residue", storage, null);
}

/* D. Unrecognised value — never persisted, and never destroys a valid override. */
{
  const fresh = run({ search: "?platform=android" });
  expect("D unrecognised value is not iOS", fresh.result, false);
  expectStored("D unrecognised value is not persisted", fresh.storage, null);

  const withOverride = run({
    search: "?platform=nonsense",
    stored: { "verza-platform": "ios" },
  });
  expect("D unrecognised value leaves a real override intact", withOverride.result, true);
  expectStored("D unrecognised value does not clear a real override", withOverride.storage, "ios");
}

/* D2. Corrupt stored value is dropped rather than left unreadable forever. */
{
  const { result, storage } = run({ stored: { "verza-platform": "android" } });
  expect("D2 corrupt stored value is not iOS", result, false);
  expectStored("D2 corrupt stored value is cleared", storage, null);
}

/* F. The intended iOS flows all still work. */
{
  const persisted = run({ stored: { "verza-platform": "ios" } });
  expect("F1 persisted override still classifies as iOS", persisted.result, true);

  const byUserAgent = run({ ua: APP_UA });
  expect("F2 VerzaTV-iOS user agent still classifies as iOS", byUserAgent.result, true);

  const homeScreen = run({ ua: WEB_UA, standalone: true });
  expect("F3 iOS home-screen app still classifies as iOS", homeScreen.result, true);

  // Compliance guard: the escape hatch releases a mislabelled browser, it must
  // not be usable to force purchase UI into a genuine iOS client. Revealing
  // checkout there is the App Store 3.1.1 violation this module prevents.
  const forced = run({ search: "?platform=web", ua: APP_UA });
  expect("F4 ?platform=web cannot force checkout into a real iOS client", forced.result, true);

  const forcedStandalone = run({ search: "?platform=web", ua: WEB_UA, standalone: true });
  expect("F4 ?platform=web cannot force checkout into a home-screen app", forcedStandalone.result, true);
}

/* G. Blocked site data must not change the classification or throw.
      The repo has already shipped one render-crash from an unguarded
      localStorage read (S2-003); the same class must not return here. */
{
  const iosBlocked = run({ search: "?platform=ios", storageThrows: true });
  expect("G ?platform=ios survives blocked site data", iosBlocked.result, true);

  const webBlocked = run({ search: "?platform=web", storageThrows: true });
  expect("G ?platform=web survives blocked site data", webBlocked.result, false);

  const plainBlocked = run({ storageThrows: true });
  expect("G plain load survives blocked site data", plainBlocked.result, false);

  const appBlocked = run({ ua: APP_UA, storageThrows: true });
  expect("G real iOS client survives blocked site data", appBlocked.result, true);
}

if (failures.length > 0) {
  console.error("Platform override contract: FAIL");
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exitCode = 1;
} else {
  console.log("Platform override contract: PASS");
  console.log("  ?platform=web releases a persisted iOS override; iOS user agent and standalone are unaffected");
}
