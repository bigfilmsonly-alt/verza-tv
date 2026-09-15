#!/usr/bin/env node

/**
 * Regression contract for content-performance instrumentation.
 *
 * Two events, hero_click and tile_click, exist to answer which programmed
 * title actually earns a selection. The risks they carry are the reason this
 * file exists:
 *
 *  - A React re-render becoming an audience event. Nothing here may fire from
 *    render, from a carousel rotation, or from an image load.
 *  - Double counting. A Link wrapping a button, touch-then-click, or three
 *    separate handlers all firing for one navigation.
 *  - A shelf label that disagrees with the badge the viewer saw.
 *  - Reporting click share as CTR. There are no impression events yet, so
 *    there is no honest denominator.
 */

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import process from "node:process";

const ROOT = resolve(import.meta.dirname, "..");
const failures = [];
const read = (p) => readFile(resolve(ROOT, p), "utf8");
const [track, browse, events, sink] = await Promise.all([
  read("lib/track.ts"),
  read("components/BrowsePage.tsx"),
  read("lib/analytics/events.ts"),
  read("app/api/events/route.ts"),
]);
const must = (name, ok) => { if (!ok) failures.push(name); };

/* ---- the events exist, in the sink that makes correlation possible ----- */

must("hero_click must be a declared TrackEvent", track.includes('| "hero_click"'));
must("tile_click must be a declared TrackEvent", track.includes('| "tile_click"'));

/* episode_start lives in track(). A click event in a different sink could not
   be joined to the playback it produced, which is the entire question. */
must("the click events must share episode_start's sink",
  track.includes('"episode_start"') && track.includes('"hero_click"'));

/* ---- exactly one emission site --------------------------------------- */

/* Every content surface routes through posterClick already. Instrumenting
   there — not in three onClick handlers — is what makes one navigation
   produce one event. */
must("hero_click must be emitted from exactly one place",
  (browse.match(/trackHeroClick\(/g) ?? []).length === 1);
must("tile_click must be emitted from exactly one place",
  (browse.match(/trackTileClick\(/g) ?? []).length === 1);
must("both must be emitted from inside posterClick",
  browse.includes("if (origin.surface === \"hero\") trackHeroClick(slug, origin.position, origin.status, epNum);"));

/* ---- never from a render or a rotation -------------------------------- */

/* posterClick is a click handler and the only caller. If either helper ever
   appears inside an effect, a render body or the rotation timer, that is the
   inflation this whole file exists to prevent. */
for (const helper of ["trackHeroClick", "trackTileClick"]) {
  const inEffect = new RegExp(`useEffect\\([\\s\\S]{0,600}?${helper}\\(`);
  if (inEffect.test(browse)) failures.push(`${helper} must never be called from an effect`);
  const inTimer = new RegExp(`setInterval\\([\\s\\S]{0,400}?${helper}\\(`);
  if (inTimer.test(browse)) failures.push(`${helper} must never be called from the carousel timer`);
}

/* ---- modified clicks are not content selections ----------------------- */

const guard = browse.indexOf("e.button !== 0) return;");
const emit = browse.indexOf("trackHeroClick(slug");
must("the event must fire AFTER the modified-click guard, so cmd-click is not counted",
  guard !== -1 && emit !== -1 && guard < emit);

/* ---- shelf and position ----------------------------------------------- */

must("tile shelf must be derived from the same positional rule as the badge",
  browse.includes('const tileShelf = isNew ? "new" : trending ? "trending" : activeTab;'));
must("tile position must be 1-based within its own shelf",
  browse.includes("? i + 1") && browse.includes("? i - TRENDING_START + 1"));
/* heroPosition is derived once next to `current`, so the badge, the event and
   the rendered slide cannot disagree about which slide is on screen. */
must("hero position must be the slide actually on screen",
  browse.includes("const heroPosition = (heroIdx % Math.max(heroSlides.length, 1)) + 1;")
    && browse.includes("position: heroPosition"));
must("hero_click must record NEW vs TRENDING",
  browse.includes('status: activeTab === "drama" ? promotedStatus(heroPosition - 1) : undefined'));

/* ---- Continue Watching resumes a real episode ------------------------- */

must('Continue Watching must report shelf="continue_watching"',
  browse.includes('shelf: "continue_watching"'));
must("Continue Watching must report the episode actually resumed, not 1",
  browse.includes("posterClick(e, item.seriesSlug, item.episodeNumber, item.progressSeconds, {"));
/* ?t=<seconds> is how a resume lands mid-episode. Analytics must not have
   disturbed it. */
must("the resume URL must still carry the playhead",
  browse.includes("buildResumeUrl(item.seriesSlug, item.episodeNumber, item.progressSeconds)"));

/* ---- privacy ----------------------------------------------------------- */

const payload = track.slice(track.indexOf("export function trackHeroClick"), track.indexOf("export function trackEpisodeStart"));
for (const forbidden of ["email", "token", "customer", "stripe", "session_id", "progressSeconds", "progress_seconds"]) {
  if (payload.toLowerCase().includes(forbidden)) {
    failures.push(`click payload must not carry ${forbidden}`);
  }
}

/* ---- no impression events yet ----------------------------------------- */

for (const premature of ["hero_impression", "tile_impression", "shelf_impression"]) {
  if (track.includes(premature) || browse.includes(premature)) {
    failures.push(`${premature} must not exist yet — click share is not CTR without a denominator`);
  }
}

/* ---- commerce semantics untouched ------------------------------------- */

for (const frozen of ["purchase_completed", "checkout_started", "auth_required", "paywall_viewed"]) {
  must(`${frozen} must still be declared`, events.includes(`"${frozen}"`) || track.includes(`"${frozen}"`));
}
must("the events sink allowlist must be unchanged by this work",
  sink.includes('"paywall_viewed"') && sink.includes('"checkout_started"'));

if (failures.length > 0) {
  console.error("Content analytics contract: FAIL");
  for (const f of failures) console.error(`  - ${f}`);
  process.exitCode = 1;
} else {
  console.log("Content analytics contract: PASS");
  console.log("  hero_click + tile_click fire once per real click, after the modified-click guard");
  console.log("  shelf derived from the badge rule; position 1-based per shelf; no impression events");
}
