#!/usr/bin/env node
/**
 * Feed integrity contract.
 *
 * Every check here exists because a real defect shipped past the other gates.
 * They are cheap, offline, deterministic assertions over the player source and
 * the whole catalogue, so nobody has to open 91 series and swipe through them
 * to find out that something regressed.
 *
 * The rule for adding to this file: a check earns its place by naming the bug
 * it would have caught. If you cannot name one, it does not belong here.
 *
 *   npm run test:feed-integrity
 */

import { readFileSync, existsSync } from "node:fs";
import ts from "typescript";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(resolve(ROOT, p), "utf8");

const failures = [];
const notes = [];
function check(ok, label, detail) {
  if (!ok) failures.push(`${label}\n      ${detail}`);
}

/* ------------------------------------------------------------------ */
/*  Sources                                                            */
/* ------------------------------------------------------------------ */

const feed = read("components/EpisodeFeed.tsx");
const browse = read("components/BrowsePage.tsx");
const episodePage = read("app/series/[slug]/[episode]/page.tsx");
const catalogSrc = read("lib/catalog.ts");

/* Strip comments before pattern-matching source. Several checks below look for
   the ABSENCE of a construct, and a comment explaining why it was removed would
   otherwise re-trigger the very check it documents. */
function stripComments(s) {
  return s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^[ \t]*\/\/.*$/gm, "");
}
const feedCode = stripComments(feed);
const browseCode = stripComments(browse);

/* ------------------------------------------------------------------ */
/*  1. Auto-advance may never fire from a slide with nothing to play    */
/*                                                                      */
/*  BUG THIS CATCHES: the Drama feed blanked around slide 4-5 and then   */
/*  raced through episode numbers up to the paywall. A slide with no      */
/*  resolved source can emit "ended" immediately; if that advances the    */
/*  feed, the next slide does the same and the index runs away.           */
/* ------------------------------------------------------------------ */

const endedHandler = feedCode.match(/function onEnd\(\)[\s\S]{0,900}?\n {4}}/);
check(
  Boolean(endedHandler),
  "auto-advance: the ended handler could not be located",
  "Expected a `function onEnd()` inside EpisodeFeed. If it was renamed, update this check.",
);
if (endedHandler) {
  const body = endedHandler[0];
  const guarded =
    /playedAnyFrame|hasPlayed|progressedRef|vid\.currentTime\s*>|duration\s*>\s*0|isFinite\(\s*vid\.duration\s*\)/.test(
      body,
    );
  check(
    guarded,
    "auto-advance: `ended` advances the feed with no evidence the episode ever played",
    "onEnd() must confirm real playback (a finite duration, or currentTime past a floor) before\n" +
      "      calling onEnded(). A media element with no source can fire `ended` instantly, and an\n" +
      "      unguarded advance turns that into a runaway that accelerates to the paywall.",
  );
}

/* The advance itself must be rate-limited. Even with a playback guard, two
   events arriving in one frame must not advance two slides. */
check(
  /lastAdvance|advanceLock|advancingRef|cooldown/i.test(feedCode),
  "auto-advance: no cooldown between advances",
  "handleEpisodeEnded must refuse to advance twice in quick succession. Without a lock, a burst\n" +
    "      of events walks the index forward several slides in a single frame.",
);

/* ------------------------------------------------------------------ */
/*  2. The index may only ever move one slide at a time                 */
/*                                                                      */
/*  BUG THIS CATCHES: the same runaway. Whatever the trigger, a single    */
/*  observer batch must not be able to march activeIndex 1 -> 6.          */
/* ------------------------------------------------------------------ */

check(
  /Math\.abs\(\s*idx\s*-\s*prev\s*\)|idx\s*-\s*prev\s*>\s*1|prev\s*\+\s*1/.test(feedCode),
  "index: no adjacency guard on activeIndex",
  "The IntersectionObserver callback must reject a jump of more than one slide. On re-observe the\n" +
    "      browser delivers an initial callback for EVERY observed target, so several can satisfy the\n" +
    "      ratio test in one batch and each setActiveIndex would step the episode number again.",
);

/* ------------------------------------------------------------------ */
/*  2b. The render window must slide, never stretch                     */
/*                                                                      */
/*  BUG THIS CATCHES: windowCenter lags activeIndex by 160ms, and the    */
/*  window bounds took the min/max of both. A fast run forward widened    */
/*  the window instead of moving it, so one commit could mount many       */
/*  slides — each synchronously building a <video> plus an hls.js worker, */
/*  SourceBuffer and decoder — and block the main thread on a phone.      */
/* ------------------------------------------------------------------ */

check(
  /MAX_SPAN/.test(feedCode),
  "window: the render window has no span clamp",
  "windowEnd - windowStart must be bounded. Without a clamp the window stretches whenever the\n" +
    "      index outruns the lagging recenter, and a single commit mounts an unbounded number of\n" +
    "      hls.js instances.",
);

/* One decision per observer batch. Acting on every qualifying record lets a
   batch walk the index forward one accepted hop at a time, which defeats the
   adjacency guard above. */
check(
  /best\s*\.\s*intersectionRatio|entry\.intersectionRatio\s*>\s*best/.test(feedCode),
  "window: the observer acts on every entry in a batch",
  "Reduce each IntersectionObserver batch to its single most-visible slide before deciding. An\n" +
    "      adjacency guard applied per record does not bound how far one batch can move the feed.",
);

/* ------------------------------------------------------------------ */
/*  3. Navigation controls must be real links                           */
/*                                                                      */
/*  BUG THIS CATCHES: Go Back on the paywall was a <button onClick>. It   */
/*  did nothing until React hydrated — and the episode route hydrates      */
/*  behind a <video> and an HLS attach — so the first taps hit dead        */
/*  markup and viewers tapped repeatedly.                                 */
/* ------------------------------------------------------------------ */

const backHrefUses = [...feedCode.matchAll(/<(a|button)\b[^>]*?(?:href=\{backHref\}|onClick=\{handleBack\})/gs)];
check(
  backHrefUses.length > 0,
  "back control: no back control found in EpisodeFeed",
  "Expected at least one element wired to backHref/handleBack.",
);
for (const m of backHrefUses) {
  check(
    m[1] === "a",
    "back control: a back control is a <button>, not a link",
    "Every control that leaves the player must be an <a href={backHref}>. A button cannot navigate\n" +
      "      before hydration, which on this route is exactly when the viewer first taps it.",
  );
}
check(
  (feedCode.match(/href=\{backHref\}/g) || []).length >= 2,
  "back control: fewer than two anchors carry href={backHref}",
  "Both the paywall's Go Back and the top-left arrow must carry a real href.",
);

/* The handler must not cancel the browser's own navigation. Substituting a
   scripted navigation for the native one is what made the exit unreliable. */
const handleBack = feedCode.match(/const handleBack = useCallback\([\s\S]{0,700}?\n {2}\}/);
if (handleBack) {
  check(
    !/preventDefault/.test(handleBack[0]),
    "back control: handleBack calls preventDefault()",
    "Let the anchor navigate. Cancelling the native navigation and driving it from script was\n" +
      "      intermittent from the paywall — the tap cancelled the real navigation and then sometimes\n" +
      "      failed to start its own.",
  );
  check(
    !/location\.(replace|assign|href\s*=)|router\.(push|replace)/.test(handleBack[0]),
    "back control: handleBack drives navigation itself",
    "The href is the navigation. The handler should only mute and pause the video.",
  );
}

/* ------------------------------------------------------------------ */
/*  4. No control may depend on an animation to become visible          */
/*                                                                      */
/*  BUG THIS CATCHES: Go Back shipped with inline opacity:0 plus a        */
/*  delayed fadeIn. An opacity-0 element still accepts clicks, so the      */
/*  only exit from the paywall was invisible but tappable — viewers were   */
/*  tapping where they guessed it was and missing.                        */
/* ------------------------------------------------------------------ */

for (const [file, src] of [["EpisodeFeed.tsx", feedCode], ["BrowsePage.tsx", browseCode]]) {
  // An inline style that sets opacity: 0 and an animation in the same object,
  // on an element that also has an onClick or an href.
  const risky = [...src.matchAll(/<(a|button)\b[^>]*style=\{\{([^}]*)\}\}/gs)].filter(
    ([, , style]) => /opacity:\s*0\b/.test(style) && /animation:/.test(style),
  );
  check(
    risky.length === 0,
    `visibility: ${file} has an interactive control revealed only by an animation`,
    "opacity:0 plus an animation means the control is invisible if that animation does not run,\n" +
      "      while still accepting clicks. Give interactive elements a resting opacity.",
  );
}

/* ------------------------------------------------------------------ */
/*  5. Posters must not be gated on a load event                        */
/*                                                                      */
/*  BUG THIS CATCHES: returning from the player showed a grid of blank    */
/*  tiles. Posters were hidden until React's onLoad fired, and a cached    */
/*  image finishes decoding before React attaches that handler, so the     */
/*  event fired into nothing. Measured live: 8 of 8 decoded, 1 visible.    */
/* ------------------------------------------------------------------ */

const posterFn = browseCode.match(/function Poster\([\s\S]*?\n}/);
check(Boolean(posterFn), "poster: Poster component not found in BrowsePage", "Expected `function Poster(`.");
if (posterFn) {
  check(
    !/opacity:\s*loaded\s*\?/.test(posterFn[0]),
    "poster: the grid poster is opacity-gated on a load event",
    "A missed load event strands a fully decoded image as a permanent blank tile, and those events\n" +
      "      are missed routinely (cache hits, lazy src swaps). Let the image paint when the browser has it.",
  );
}

/* ------------------------------------------------------------------ */
/*  6. Leaving an episode must return to the tab it belongs to          */
/*                                                                      */
/*  BUG THIS CATCHES: Espanol and Bollywood shipped, and the episode      */
/*  page's hand-written back-tab chain still covered only three           */
/*  categories. 651 episode pages ejected the viewer to "/", which is      */
/*  Drama, which excludes those categories by construction.               */
/* ------------------------------------------------------------------ */

check(
  /getReturnTab/.test(episodePage),
  "back target: the episode page does not use the shared getReturnTab helper",
  "A hand-written per-category chain regresses the moment a tab is added. Derive it from\n" +
    "      TAB_EXCLUSIVE_CATEGORIES in lib/catalog.ts.",
);

const tabExclusive = catalogSrc.match(/TAB_EXCLUSIVE_CATEGORIES[^=]*=\s*\[([^\]]*)\]/);
check(Boolean(tabExclusive), "back target: TAB_EXCLUSIVE_CATEGORIES not found", "Expected it exported from lib/catalog.ts.");

/* ------------------------------------------------------------------ */
/*  7. CATALOGUE SWEEP — every episode of every live series             */
/*                                                                      */
/*  This is the check that means nobody opens 91 series and swipes       */
/*  through them by hand. It walks every episode the product will ever   */
/*  render and asserts the invariants the feed depends on.               */
/* ------------------------------------------------------------------ */

function loadTypeScriptModule(relativePath, requireMap = {}) {
  const filename = resolve(ROOT, relativePath);
  const output = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
    fileName: filename,
  }).outputText;
  const compiled = { exports: {} };
  const localRequire = (specifier) => {
    if (specifier === "server-only") return {};
    if (Object.hasOwn(requireMap, specifier)) return requireMap[specifier];
    throw new Error(`${relativePath} imported unexpected module ${specifier}`);
  };
  new Function("require", "module", "exports", output)(localRequire, compiled, compiled.exports);
  return compiled.exports;
}

const publicMap = loadTypeScriptModule("lib/mux-public-map.ts");
const fullMap = loadTypeScriptModule("lib/mux-map.ts");
const catalog = loadTypeScriptModule("lib/catalog.ts", { "./mux-public-map": publicMap });

const live = catalog.catalog.filter((s) => s.status === "live");
const soon = catalog.catalog.filter((s) => s.status === "coming_soon");

let episodesWalked = 0;
const leaks = [];
const gaps = [];
const countMismatch = [];
const missingArt = [];
const freeMismatch = [];

for (const s of live) {
  const pub = publicMap.MUX_MAP[s.slug] ?? [];
  const full = fullMap.MUX_MAP[s.slug] ?? [];

  if (full.length !== s.episodeCount) countMismatch.push(`${s.slug}: catalog ${s.episodeCount} vs map ${full.length}`);
  if (pub.length !== full.length) countMismatch.push(`${s.slug}: public ${pub.length} vs full ${full.length}`);

  const posterPath = resolve(ROOT, "public", s.posterUrl.replace(/^\//, ""));
  if (!existsSync(posterPath)) missingArt.push(`${s.slug} -> ${s.posterUrl}`);

  const numbers = full.map((e) => e.episode).sort((a, b) => a - b);
  if (numbers.length && (numbers[0] !== 1 || numbers.some((n, i) => n !== i + 1))) {
    gaps.push(`${s.slug}: not gapless from 1`);
  }

  let exposedFree = 0;
  for (const ep of pub) {
    episodesWalked++;
    const isFree = ep.episode <= s.freeEpisodes;
    // The load-bearing one: a paid episode must never carry a durable playback
    // ID in the projection every client receives.
    if (!isFree && ep.playbackId) leaks.push(`${s.slug} E${ep.episode}`);
    if (isFree && ep.playbackId) exposedFree++;
    // Every episode the feed renders needs a duration, free or paid — the
    // progress bar and the stall watchdog both read it.
    if (typeof ep.duration !== "number" || !(ep.duration > 0)) {
      gaps.push(`${s.slug} E${ep.episode}: no usable duration`);
    }
  }
  if (exposedFree !== Math.min(s.freeEpisodes, pub.length)) {
    freeMismatch.push(`${s.slug}: ${exposedFree} public IDs for ${s.freeEpisodes} free episodes`);
  }
}

/* Every paid title must actually reach a paywall, at the house boundary.
   A title that sells a full-series unlock but never locks an episode gives its
   catalogue away; one whose free count drifts off 5 contradicts the advertised
   "first 5 episodes free" everywhere else in the product. */
const noPaywall = live.filter((s) => s.coinPerEpisode > 0 && s.episodeCount <= s.freeEpisodes);
check(
  noPaywall.length === 0,
  "sweep: a paid title never reaches a paywall",
  `Every episode is free on: ${noPaywall.map((s) => s.slug).join(", ")}`,
);
const offBoundary = live
  .filter((s) => s.coinPerEpisode > 0 && s.episodeCount > s.freeEpisodes)
  .filter((s) => s.freeEpisodes !== 5);
check(
  offBoundary.length === 0,
  "sweep: a paid title does not gate at episode 5",
  `House standard is 5 free episodes, then the paywall. Off-boundary: ${offBoundary
    .map((s) => `${s.slug}=${s.freeEpisodes}`)
    .join(", ")}`,
);
/* And the projection must agree: no public ID at or past the boundary. */
const pastBoundaryExposed = [];
for (const s of live.filter((x) => x.coinPerEpisode > 0)) {
  for (const ep of publicMap.MUX_MAP[s.slug] ?? []) {
    if (ep.episode === s.freeEpisodes + 1 && ep.playbackId) pastBoundaryExposed.push(`${s.slug} E${ep.episode}`);
  }
}
check(
  pastBoundaryExposed.length === 0,
  "sweep: the first paid episode is still playable without paying",
  pastBoundaryExposed.slice(0, 8).join(", "),
);

check(leaks.length === 0, "sweep: a paid episode carries a public playback ID", `Leaked: ${leaks.slice(0, 8).join(", ")}`);
check(countMismatch.length === 0, "sweep: episode counts disagree", countMismatch.slice(0, 6).join("\n      "));
check(gaps.length === 0, "sweep: episode numbering or duration is unusable", gaps.slice(0, 6).join("\n      "));
check(missingArt.length === 0, "sweep: a live series points at a poster that does not exist", missingArt.slice(0, 6).join("\n      "));
check(freeMismatch.length === 0, "sweep: free-preview count does not match the exposed IDs", freeMismatch.slice(0, 6).join("\n      "));

/* A coming-soon row has no video. It must never reach the feed at all. */
const soonWithVideo = soon.filter((s) => (fullMap.MUX_MAP[s.slug] ?? []).length > 0);
check(
  soonWithVideo.length === 0,
  "sweep: a coming-soon title has playback rows",
  soonWithVideo.map((s) => s.slug).join(", "),
);
const soonSellable = soon.filter((s) => s.coinPerEpisode > 0 || s.episodeCount > 0);
check(
  soonSellable.length === 0,
  "sweep: a coming-soon title looks sellable or claims episodes",
  soonSellable.map((s) => s.slug).join(", "),
);

notes.push(`walked ${episodesWalked} episodes across ${live.length} live series (${soon.length} coming soon)`);


/* ------------------------------------------------------------------ */
/*  9. RUNTIME: a failing playback endpoint must reject, never hang      */
/*                                                                      */
/*  The checks above assert the wiring exists. This one exercises it.    */
/*  The client is loaded for real, its network boundary is stubbed, and  */
/*  each failure mode is driven through getAuthorizedPlayback.           */
/* ------------------------------------------------------------------ */

{
  const stubSupabase = { createBrowserSupabase: () => null };
  const client = loadTypeScriptModule("lib/playback-client.ts", {
    "@/lib/supabase/client": stubSupabase,
    "./supabase/client": stubSupabase,
  });

  const realFetch = globalThis.fetch;
  const scenarios = [
    { name: "503 from the playback route", status: 503, body: { error: "Signing unavailable" }, expect: 503, entitlement: false },
    { name: "502 invalid response body", status: 200, body: { nonsense: true }, expect: 502, entitlement: false },
    { name: "401 not signed in", status: 401, body: { error: "Sign in" }, expect: 401, entitlement: true },
    { name: "402 not purchased", status: 402, body: { error: "Locked" }, expect: 402, entitlement: true },
  ];

  for (const sc of scenarios) {
    globalThis.fetch = async () => ({
      ok: sc.status >= 200 && sc.status < 300,
      status: sc.status,
      json: async () => sc.body,
    });
    let caught = null;
    try {
      await client.getAuthorizedPlayback("the-mistress-trap", 6, { forceRefresh: true });
    } catch (e) {
      caught = e;
    }
    check(
      caught !== null,
      `player runtime: ${sc.name} resolved instead of rejecting`,
      "A failing playback request must reject so the caller can render an error. Resolving, or never\n" +
        "      settling, is what leaves the viewer on an indefinite black slide.",
    );
    if (caught) {
      check(
        caught.status === sc.expect,
        `player runtime: ${sc.name} produced status ${caught.status}, expected ${sc.expect}`,
        "The status drives whether the viewer sees the paywall or a retry.",
      );
      check(
        Boolean(caught.isEntitlement) === sc.entitlement,
        `player runtime: ${sc.name} classified isEntitlement=${caught.isEntitlement}, expected ${sc.entitlement}`,
        "Entitlement answers belong to the paywall; everything else must reach the retryable error\n" +
          "      state. Misclassifying either way shows the viewer the wrong screen.",
      );
    }
  }

  /* A connection that never answers must abort into a handled error rather than
     leaving the promise open.
     This asserts the MECHANISM, not a wall clock: the client must hand fetch an
     AbortSignal, and aborting that signal must become a PlaybackAccessError the
     UI can render. An earlier version of this test dispatched the abort itself,
     which made it pass even with the timeout removed. It is driven from the
     signal the client actually supplies, so deleting that wiring fails it. */
  let sawSignal = false;
  globalThis.fetch = (_url, init) =>
    new Promise((_resolve, reject) => {
      const signal = init && init.signal;
      if (!signal) return;            // no signal: promise stays open, as it did before
      sawSignal = true;
      signal.addEventListener("abort", () => {
        const err = new Error("aborted");
        err.name = "AbortError";
        reject(err);
      });
      signal.dispatchEvent(new Event("abort"));  // stand in for the deadline firing
    });
  let hangErr = null;
  let settled = false;
  /* Raced, so a promise that never settles fails this gate instead of hanging
     it. A CI job that stops producing output is worse than one that reports a
     failure. */
  await Promise.race([
    client
      .getAuthorizedPlayback("the-mistress-trap", 7, { forceRefresh: true })
      .then(() => { settled = true; })
      .catch((e) => { settled = true; hangErr = e; }),
    new Promise((r) => setTimeout(r, 3000)),
  ]);
  check(
    settled,
    "player runtime: the playback request never settled",
    "The promise stayed open, which is the exact failure that leaves a viewer on a black slide with\n" +
      "      no error and nothing to retry. The request must be abandonable.",
  );
  check(
    sawSignal,
    "player runtime: the playback fetch is not given an AbortSignal",
    "Without a signal there is no way to abandon a stalled request, so the promise never settles,\n" +
      "      the caller never reaches its catch, and the viewer keeps a black slide.",
  );
  check(
    hangErr !== null && hangErr.status === 504 && hangErr.isEntitlement === false,
    `player runtime: an aborted request produced ${hangErr ? hangErr.status : "no error"}, expected a 504 pipeline failure`,
    "An abandoned request must surface as a retryable failure, never as a paywall and never as\n" +
      "      silence.",
  );

  globalThis.fetch = realFetch;
  notes.push("player failure paths exercised: 503, 502, 401, 402 and a hanging request");
}

/* ------------------------------------------------------------------ */
/*  Report                                                             */
/* ------------------------------------------------------------------ */

for (const n of notes) console.log(`  ${n}`);

if (failures.length > 0) {
  console.error("Feed integrity contract: FAIL");
  for (const f of failures) console.error(`  - ${f}`);
  console.error(`\n  ${failures.length} failing check(s).`);
  process.exit(1);
}

console.log("Feed integrity contract: PASS");

/* ------------------------------------------------------------------ */
/*  8. THE PLAYER MUST HAVE A FAILURE PATH                              */
/*                                                                      */
/*  BUG THIS CATCHES: EpisodeFeed handled only 401 and 402. A 503 from   */
/*  /api/playback, a response that failed validation, or a fetch that    */
/*  hung left authorizedSource null with no state, no message and no     */
/*  retry, so the viewer sat on a black slide forever. Rule 15 names Mux */
/*  credential rotation as an open gate, which is exactly the trigger.   */
/* ------------------------------------------------------------------ */

const playbackClient = read("lib/playback-client.ts");

check(
  /AbortController|AbortSignal\.timeout/.test(playbackClient),
  "player: the playback request has no timeout",
  "A hanging request never settles, so the caller never reaches its catch and no error state is\n" +
    "      ever set. Give the fetch a deadline so a dead connection becomes a handled failure.",
);

check(
  /isEntitlement/.test(feedCode) && /isEntitlement/.test(playbackClient),
  "player: entitlement answers are not separated from pipeline failures",
  "401 and 402 mean 'not signed in' and 'not bought' and belong to the paywall. Every other status\n" +
    "      is the pipeline failing and must reach a retryable error state, not the paywall and not\n" +
    "      silence.",
);

check(
  /setSourceError/.test(feedCode),
  "player: no error state exists for a source that will not resolve",
  "A failure other than 401/402 must produce a visible state. Without one the slide keeps a null\n" +
    "      source and the viewer sees an indefinite black frame.",
);

check(
  /retrySource/.test(feedCode),
  "player: the failure state offers no retry",
  "Every rendered failure needs an affordance that re-requests the source.",
);

/* The stall watchdog requires sourceReady, so it cannot cover the case where a
   source never arrives at all. A second timer must. */
{
  const sourceWatchdog = feedCode.match(/if \(!isActive \|\| blocked \|\| hlsUrl \|\| sourceError\) return;/);
  check(
    Boolean(sourceWatchdog),
    "player: nothing guards a source that never arrives",
    "The stall watchdog is gated on sourceReady, which is false in precisely the failure being\n" +
      "      guarded. Add a watchdog that fires when an active slide still has no playable URL.",
  );
}
