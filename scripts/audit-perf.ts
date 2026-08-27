#!/usr/bin/env tsx
/**
 * Memory / performance regression guard.
 *
 * WHY THIS EXISTS
 * A viewer on an iPhone hit Safari's "This page couldn't load" on the episode
 * feed. That message means the WebContent process was killed, and it was killed
 * on CUMULATIVE footprint, not one leak: a browse grid holding every poster as a
 * decoded bitmap, plus several concurrent hls.js MSE pipelines on a device the
 * code wrongly assumed had no MSE at all.
 *
 * Each check below pins one of the specific mistakes that produced that. They
 * are cheap, static, and deliberately blunt — the point is that the next person
 * (or agent) cannot quietly undo a fix without the build telling them.
 *
 *   npx tsx scripts/audit-perf.ts
 *
 * READ-ONLY. Exits non-zero on failure so CI can gate on it.
 */

import * as fs from "fs";
import * as path from "path";

const ROOT = path.join(__dirname, "..");
const read = (p: string) => fs.readFileSync(path.join(ROOT, p), "utf8");
const exists = (p: string) => fs.existsSync(path.join(ROOT, p));

let problems = 0;
let checks = 0;
function fail(msg: string) { problems++; console.log(`  ❌ ${msg}`); }
function pass(msg: string) { console.log(`  ✅ ${msg}`); }
function check(name: string, fn: () => void) { checks++; console.log(`\n▸ ${name}`); fn(); }

/* ------------------------------------------------------------------ */
check("next/image breakpoints cover the phone poster tile", () => {
  const cfg = read("next.config.ts");
  const imageSizes = cfg.match(/imageSizes:\s*\[([^\]]*)\]/);
  const deviceSizes = cfg.match(/deviceSizes:\s*\[([^\]]*)\]/);
  if (!imageSizes || !deviceSizes) {
    fail("next.config.ts must set images.deviceSizes AND images.imageSizes. " +
      "Next's defaults jump 384 -> 640, so a 33vw tile on a DPR-3 iPhone (needs ~390-436 device px) " +
      "rounds up to the 640w candidate — ~2.7MB decoded for a ~130x195 box, times ~78 tiles.");
    return;
  }
  const sizes = imageSizes[1].split(",").map((n) => parseInt(n.trim(), 10)).filter(Boolean);
  const inBand = sizes.filter((n) => n >= 400 && n <= 560);
  if (!inBand.length) {
    fail(`images.imageSizes has no candidate in 400-560 (got ${sizes.join(", ")}). ` +
      "Without one, phone poster tiles round up to 640w and decode ~3x the pixels they display.");
  } else {
    pass(`imageSizes covers the phone tile band (${inBand.join(", ")})`);
  }
});

/* ------------------------------------------------------------------ */
check("poster sources stay small enough to decode cheaply", () => {
  const dir = path.join(ROOT, "public/posters");
  if (!fs.existsSync(dir)) { pass("no public/posters directory"); return; }
  const files = fs.readdirSync(dir).filter((f) => /\.(png|jpe?g|webp|avif)$/i.test(f));
  const MAX_BYTES = 1_500_000;
  const heavy = files
    .map((f) => ({ f, size: fs.statSync(path.join(dir, f)).size }))
    .filter((x) => x.size > MAX_BYTES)
    .sort((a, b) => b.size - a.size);
  const total = files.reduce((t, f) => t + fs.statSync(path.join(dir, f)).size, 0);
  console.log(`     ${files.length} posters, ${(total / 1048576).toFixed(0)}MB total`);
  if (heavy.length) {
    // Warn, don't fail: this is pre-existing debt (89/93 files today) and
    // failing the build on it would just get the script disabled. Flip to
    // fail() once the library has been compressed.
    console.log(`  ⚠️  ${heavy.length} poster(s) over ${(MAX_BYTES / 1048576).toFixed(1)}MB — ` +
      `largest ${heavy[0].f} at ${(heavy[0].size / 1048576).toFixed(1)}MB. ` +
      "Big sources inflate optimizer cost and first-paint time; the decoded cost is set by " +
      "the srcset candidate, which the check above governs.");
  } else {
    pass("all poster sources under the size budget");
  }
});

/* ------------------------------------------------------------------ */
check("browse grid is not rendering the whole catalogue at once", () => {
  const src = read("components/BrowsePage.tsx");
  if (/const gridItems\s*=\s*filtered\s*;/.test(src)) {
    fail("components/BrowsePage.tsx renders every filtered series at once " +
      "(`const gridItems = filtered;`). The Drama tab is ~78 tiles. Slice it into pages " +
      "and append with an IntersectionObserver sentinel.");
  } else if (/const gridItems\s*=\s*filtered\.slice\(/.test(src)) {
    pass("grid is paginated");
  } else {
    console.log("  ⚠️  could not statically confirm grid pagination — verify by hand");
  }
});

/* ------------------------------------------------------------------ */
check("hero mounts only the layers a crossfade needs", () => {
  const src = read("components/BrowsePage.tsx");
  const heroBlock = src.match(/heroSlides\.map\(\(s, i\)[\s\S]{0,900}/);
  if (!heroBlock) { console.log("  ⚠️  hero block not found — layout changed, re-check by hand"); return; }
  if (/if \(i !== activeIdx && i !== nextIdx\) return null;/.test(heroBlock[0])) {
    pass("hero mounts 2 layers, not all slides");
  } else {
    fail("components/BrowsePage.tsx mounts every hero slide simultaneously. " +
      "A crossfade needs exactly two layers; the rest pin decoded bitmaps in the viewport " +
      "where WebKit will never reclaim them, and this subtree remounts on every tab switch.");
  }
});

/* ------------------------------------------------------------------ */
check("no code claims iOS Safari lacks MSE", () => {
  const files = ["components/EpisodeFeed.tsx", "components/ShortsFeed.tsx", "components/HorizontalFeed.tsx", "lib/instant-player.ts"];
  let found = false;
  for (const f of files) {
    if (!exists(f)) continue;
    const src = read(f);
    src.split("\n").forEach((line, i) => {
      if (/\/\/|\*/.test(line) && /ios|iphone|safari/i.test(line) && /no MSE|has no MSE|can'?t run|cannot run/i.test(line)) {
        fail(`${f}:${i + 1} still claims iOS Safari has no MSE. ` +
          "FALSE since iOS 17.1: hls.js resolves ManagedMediaSource first, so Hls.isSupported() " +
          "is TRUE on iPhone and the MSE branch runs there. Three files reasoned from this and " +
          "under-counted per-slide cost on the exact device that crashed.");
        found = true;
      }
    });
  }
  if (!found) pass("no stale 'iOS has no MSE' claims");
});

/* ------------------------------------------------------------------ */
check("every hls.js config caps the rendition to the player", () => {
  const files = ["components/EpisodeFeed.tsx", "components/HorizontalFeed.tsx", "lib/instant-player.ts"];
  for (const f of files) {
    if (!exists(f)) continue;
    const src = read(f);
    const configs = [...src.matchAll(/new Hls\(\{([\s\S]*?)\}\)/g)];
    for (const c of configs) {
      const body = c[1];
      const line = src.slice(0, c.index ?? 0).split("\n").length;
      if (!/capLevelToPlayerSize:\s*true/.test(body)) {
        // WARN, not fail. Turning this on is a playback-QUALITY decision that
        // needs on-device review, and it is not universally correct: the
        // instant player attaches to a deliberately 2px-square hidden element,
        // so capping to player size there would select the WORST rendition and
        // then keep it after the element goes full-screen on adoption. Promote
        // to fail() only once the rendition strategy has been settled per call
        // site.
        console.log(`  ⚠️  ${f}:${line} constructs Hls without capLevelToPlayerSize:true — ` +
          "it can pull the top rendition (1080p) into a phone-sized element. " +
          "Review per call site; see docs/handoff/IOS-CONTENT-PROCESS-CRASH.md.");
      } else if (!/maxDevicePixelRatio/.test(body)) {
        console.log(`  ⚠️  ${f}:${line} sets capLevelToPlayerSize but no maxDevicePixelRatio. ` +
          "hls.js multiplies by devicePixelRatio (default cap Infinity), so at DPR 3 a 393px " +
          "element reports ~1179px and NO cap is ever applied. Consider maxDevicePixelRatio: 1.");
      } else {
        pass(`${f}:${line} caps rendition to player size`);
      }
    }
  }
});

/* ------------------------------------------------------------------ */
check("one ERROR handler per hls.js instance", () => {
  const ip = exists("lib/instant-player.ts") ? read("lib/instant-player.ts") : "";
  const ef = exists("components/EpisodeFeed.tsx") ? read("components/EpisodeFeed.tsx") : "";
  const ipHandlers = (ip.match(/\.on\(Hls\.Events\.ERROR/g) || []).length;
  const efHandlers = (ef.match(/\.on\(Hls\.Events\.ERROR/g) || []).length;
  // The instant player's instance is ADOPTED by EpisodeFeed, which adds its own
  // handler. Neither side ever calls .off(), so both fire on one fatal error —
  // two recoverMediaError() rebuilds, i.e. an allocation burst exactly when the
  // device is already under memory pressure.
  const adopts = /adoptInstantPlayer/.test(ef);
  if (ipHandlers > 0 && efHandlers > 0 && adopts && !/\.off\(Hls\.Events\.ERROR/.test(ef + ip)) {
    console.log("  ⚠️  lib/instant-player.ts and components/EpisodeFeed.tsx BOTH attach an " +
      "Hls ERROR handler and neither calls .off(). After adoption one instance carries both, " +
      "so a single fatal media error triggers two detach/attach rebuilds.");
  } else {
    pass("no duplicate ERROR handlers on a shared instance");
  }
});

/* ------------------------------------------------------------------ */
check("language/section tabs do not leak into the Drama grid", () => {
  const src = read("components/BrowsePage.tsx");
  const m = src.match(/const TAB_EXCLUSIVE:\s*BrowseCategory\[\]\s*=\s*\[([^\]]*)\]/);
  if (!m) {
    fail("components/BrowsePage.tsx no longer defines TAB_EXCLUSIVE. Drama is the catch-all " +
      "grid; without that list, every language tab's titles render in Drama too.");
    return;
  }
  const listed = new Set([...m[1].matchAll(/"([a-z-]+)"/g)].map((x) => x[1]));
  // Any category that has its own tab AND whose titles should not also appear
  // in the English catch-all grid.
  const mustExclude = ["espanol", "bollywood", "reality", "red-carpet"];
  const missing = mustExclude.filter((c) => !listed.has(c));
  if (missing.length) {
    fail(`TAB_EXCLUSIVE is missing: ${missing.join(", ")}. ` +
      "Those titles will render in the Drama grid and its hero as well as their own tab — " +
      "a Spanish or Hindi title in the English grid is a content mismatch.");
  } else {
    pass(`Drama excludes ${[...listed].join(", ")}`);
  }
  // The filter must actually USE the list, not re-inline the old checks.
  if (!/TAB_EXCLUSIVE\.some\(/.test(src)) {
    fail("TAB_EXCLUSIVE is defined but the Drama filter does not use it — " +
      "the list is decorative and the real exclusions have drifted somewhere else.");
  }
});

/* ------------------------------------------------------------------ */
check("browse tab order matches the owner-specified sequence", () => {
  // This drifted once: a rebase onto a base that still had Creators before
  // Reality silently reverted the owner's ordering, and it shipped.
  const EXPECTED = ["Drama", "Hot", "Tubi", "Anime", "Español", "Bollywood",
                    "Reality", "Creators", "Red Carpet", "Music"];
  const src = read("lib/catalog.ts");
  const block = src.match(/export const BROWSE_TABS[\s\S]*?\n\];/);
  if (!block) { fail("BROWSE_TABS not found in lib/catalog.ts"); return; }
  const actual = [...block[0].matchAll(/label:\s*"([^"]+)"/g)].map((m) => m[1]);
  if (actual.join("|") !== EXPECTED.join("|")) {
    fail(`browse tab order drifted.\n     expected: ${EXPECTED.join(", ")}\n     actual:   ${actual.join(", ")}`);
  } else {
    pass(`tab order correct (${actual.length} tabs, Reality before Creators)`);
  }
});

/* ------------------------------------------------------------------ */
check("no earnings promises or turnaround SLAs in rendered copy", () => {
  // origin/main deliberately stripped "keep 80% of every sale" and "within 48
  // hours" from creator-facing copy. Commercial terms go to approved creators
  // separately; an earnings promise shipped inside the iOS binary is an App
  // Store rejection risk. Owner confirmed main's copy is authoritative.
  const roots = ["app", "components"];
  const banned: { re: RegExp; why: string }[] = [
    { re: /\b80\s*\/\s*20\b/, why: "revenue split figure" },
    { re: /\b(keep|earn|receive)\s+(up to\s+)?\d{1,3}\s*%/i, why: "earnings promise" },
    { re: /\d{1,3}\s*%\s*(of every sale|revenue share|of net revenue)/i, why: "earnings promise" },
    { re: /(eighty|seventy|ninety)\s+percent/i, why: "earnings promise (spelled out)" },
    { re: /within\s+\d+\s*(hours|business days|days)\b/i, why: "turnaround SLA" },
    { re: /\b\d\s+to\s+\d\s+business days\b/i, why: "turnaround SLA" },
  ];
  const hits: string[] = [];
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
      const rel = path.join(dir, entry.name);
      if (entry.isDirectory()) { walk(rel); continue; }
      if (!/\.(tsx?|mdx?)$/.test(entry.name)) continue;
      fs.readFileSync(path.join(ROOT, rel), "utf8").split("\n").forEach((line, i) => {
        const code = line.trim();
        // Skip comments and CSS keyframe percentages ("80% { transform: ... }").
        if (code.startsWith("//") || code.startsWith("*") || code.startsWith("/*")) return;
        if (/^\d{1,3}%\s*\{/.test(code)) return;
        for (const b of banned) {
          if (b.re.test(line)) hits.push(`${rel}:${i + 1} (${b.why}) ${code.slice(0, 88)}`);
        }
      });
    }
  };
  roots.forEach(walk);
  if (hits.length) {
    hits.slice(0, 10).forEach((h) => fail(h));
    if (hits.length > 10) fail(`…and ${hits.length - 10} more`);
  } else {
    pass("no earnings promises or SLA commitments in rendered copy");
  }
});

/* ------------------------------------------------------------------ */
console.log(`\n${"─".repeat(60)}`);
console.log(problems === 0
  ? `✅ PERF GUARD: ${checks} checks, 0 failures`
  : `❌ PERF GUARD: ${problems} failure(s) across ${checks} checks`);
process.exit(problems === 0 ? 0 : 1);
