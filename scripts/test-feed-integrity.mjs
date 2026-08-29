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

import { readFileSync, existsSync, readdirSync } from "node:fs";
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
/* The routing helpers live in their own module rather than in lib/catalog.ts:
   scripts/generate-public-mux-map.mjs fingerprints the RAW SOURCE TEXT of
   lib/catalog.ts, so appending anything there — a function, even a comment —
   fails npm run test:playback-security until both generated Mux projections are
   regenerated in lockstep. Verified both ways on 2026-08-29. */
let seriesHrefMod = {};
try {
  seriesHrefMod = loadTypeScriptModule("lib/series-href.ts", { "./catalog": catalog });
} catch {
  /* leave empty: the "canonical link helpers are gone" check below reports it */
}

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
/*  10. THE RUNAWAY MUST BE BOUNDED IN TOTAL, NOT JUST PER STEP         */
/*                                                                      */
/*  BUG THIS CATCHES: the feed walked from episode 5 to 60 on its own    */
/*  over a black screen and then the tab died. Every one of those 55     */
/*  steps was ADJACENT, so the adjacency guard never applied, and every  */
/*  one was spaced by the cooldown, so the cooldown never applied.       */
/*  Neither bounded the total, which was the thing actually wrong.       */
/* ------------------------------------------------------------------ */

check(
  /startedRef\.current/.test(feedCode) && /if \(!startedRef\.current\) return;/.test(feedCode),
  "runaway: an episode can complete without ever showing a frame",
  "The ended handler must require that a real frame was composited. A slide that never played\n" +
    "      cannot have finished, and a slide that completes without playing advances the feed into\n" +
    "      the next equally dead slide, which is the runaway.",
);

check(
  /autoAdvanceRunRef\.current\s*>=\s*MAX_UNATTENDED_ADVANCES/.test(feedCode),
  "runaway: no cap on consecutive automatic advances",
  "Bound the TOTAL, not only the gap between steps. Without a cap the feed can walk itself to the\n" +
    "      end of a 60 episode series one legal step at a time.",
);

check(
  /autoAdvanceRunRef\.current = 0/.test(feedCode),
  "runaway: the advance cap never resets on interaction",
  "A cap that never resets would eventually stop a genuine binge-watcher. Any pointer, touch,\n" +
    "      wheel or key event means a person is present and must clear the run.",
);

/* ------------------------------------------------------------------ */
/*  Report                                                             */
/* ------------------------------------------------------------------ */

for (const n of notes) console.log(`  ${n}`);

/* ------------------------------------------------------------------ */
/*  The rail is bounded by entitlement                                 */
/* ------------------------------------------------------------------ */

/* Each check names the defect it prevents. The defect here was reported by the
   founder in these words: "once you hit 4 or 5, it just turns black... the
   number runs at the bottom... it'll just run all the way up to 60 and then
   give us an error page."

   The cause was structural, not a logic error. The feed received every episode
   of the series and built a scroller that many viewports tall for every
   viewer, so a guest entitled to five episodes of a sixty-episode title was
   handed a rail with fifty-five locked slides on it. A locked slide has no
   playbackId and deliberately renders no spinner and no error, so it is a
   black rectangle. Walking five to sixty is fifty-five adjacent single steps,
   which is a legal traversal of that rail, so no guard on step size could ever
   have caught it. Two earlier guards bounded how fast and how often the feed
   could advance itself; neither bounded the track. */

check(
  /episodes:\s*allEpisodes/.test(feedCode),
  "rail: the episode list is consumed unbounded",
  "The feed must take the full list under a distinct name and derive a bounded rail from it. If it\n" +
    "      binds `episodes` straight from props again, every viewer gets a rail as long as the series\n" +
    "      and the runaway to episode 60 is reachable once more.",
);

check(
  /const episodes = useMemo\(\(\) => \{[\s\S]{0,400}?allEpisodes\.slice\(0, bound\)/.test(feedCode),
  "rail: no bounded rail is derived from the full episode list",
  "Without the slice the scroller is `episodes.length` viewports tall for everyone. Fifty-five of\n" +
    "      those viewports are black locked slides with nothing to explain them.",
);

check(
  /Math\.max\(freeEpisodes \+ 1, startIdx \+ 1\)/.test(feedCode),
  "rail: the bound is not derived from freeEpisodes",
  "The bound must be the viewer's free allowance plus exactly one locked slide to carry the paywall,\n" +
    "      widened only far enough to include a deep-linked episode. A hard-coded 5 is wrong for the\n" +
    "      five wholly free titles and for the two whose allowance is clamped to real Mux inventory.",
);

check(
  /if \(authFree\) return allEpisodes;/.test(feedCode),
  "rail: an entitled viewer does not get the whole series",
  "Bounding must apply only to viewers who cannot watch past the boundary. A paying customer must\n" +
    "      still be able to scroll the full series.",
);

/* The counter reads "EP n / total". Bounding the rail must not shrink the
   advertised series length, or a sixty-episode title starts describing itself
   as six episodes on the one screen where the viewer is deciding whether to
   pay for it. */
check(
  /\/ \{totalEpisodes\}/.test(feedCode) &&
    /t\("paywall\.benefitEpisodes",\s*\{\s*count:\s*totalEpisodes\s*\}\)/.test(feedCode),
  "rail: series length is being read from the bounded rail",
  "The counter and the paywall's headline benefit must both come from totalEpisodes. Reading\n" +
    "      episodes.length there would advertise the free preview as the whole series.\n" +
    "      2026-08-29: that benefit line moved from the literal `All ${totalEpisodes} episodes,\n" +
    "      instantly` to t(\"paywall.benefitEpisodes\", { count: totalEpisodes }) when the paywall was\n" +
    "      translated into all 20 locales. The defect guarded is unchanged: the ARGUMENT must be\n" +
    "      totalEpisodes, never episodes.length.",
);

/* ------------------------------------------------------------------ */
/*  Entitlement resolution cannot hang                                 */
/* ------------------------------------------------------------------ */

/* authResolved is what allows the paywall to mount: the effect forces
   setShowUnlock(false) whenever it is false. It becomes true only in a
   finally(). A fetch that hangs rather than rejecting therefore leaves a
   locked slide with no playbackId AND no paywall, permanently. */
check(
  /const deadline = new AbortController\(\)/.test(feedCode) &&
    /setTimeout\(\(\) => deadline\.abort\(\), ACCESS_REQUEST_TIMEOUT_MS\)/.test(feedCode),
  "entitlement: the access request has no deadline",
  "Without an abort the promise can stay open forever, authResolved never settles, and the paywall\n" +
    "      is suppressed on a slide that has nothing else to show. That is a permanent black screen.",
);

check(
  /\/api\/access\?slug=\$\{seriesSlug\}`, \{ signal: deadline\.signal \}/.test(feedCode),
  "entitlement: the access fetch is not wired to the deadline",
  "The AbortController must actually be passed to the request it is meant to bound.",
);

/* ------------------------------------------------------------------ */
/*  The adopted pipeline is capped and keeps its own recovery          */
/* ------------------------------------------------------------------ */

const instantPlayer = read("lib/instant-player.ts");

check(
  /ahls\.capLevelToPlayerSize = true;/.test(feedCode),
  "player: the adopted instance is never capped",
  "A poster tap adopts the instant player's hls instance, which is deliberately built uncapped\n" +
    "      because its element is 2px until adoption. If the cap is not applied on adoption the most\n" +
    "      common path into the player decodes uncapped 1080p for the entire watch, and only cold deep\n" +
    "      links get the cap that was supposed to be shipped.",
);

check(
  !/ahls\.config\.capLevelToPlayerSize\s*=/.test(feedCode),
  "player: capping is being set on config instead of the instance",
  "hls.js exposes capLevelToPlayerSize as a setter that calls capLevelController.startCapping().\n" +
    "      Writing config directly sets a flag and starts nothing, which reads as a fix and is a no-op.",
);

check(
  /ahls\.off\(AdoptedHls\.Events\.ERROR, adopted\.onError\)/.test(feedCode),
  "player: the ERROR listener is removed without a handler reference",
  "hls.js subscribes its own controllers to ERROR on the same emitter, and eventemitter3 treats\n" +
    "      off(event) with no listener as removeAllListeners. A bare off() therefore deletes\n" +
    "      BufferController.onError and StreamController.onError too, taking reduceLengthAndFlushBuffer,\n" +
    "      flushMainBuffer and recoverWorkerError with them. That removes hls.js's own response to\n" +
    "      BUFFER_FULL_ERROR from the one instance that is also playing uncapped. Remove by identity.",
);

check(
  /entry\.onError = onError;/.test(instantPlayer) && /onError: entry\.onError/.test(instantPlayer),
  "player: the instant player does not expose its ERROR listener",
  "The adopter cannot remove a listener by identity unless the reference survives adoption.",
);

/* ------------------------------------------------------------------ */
/*  Watching does not rate-limit itself                                */
/* ------------------------------------------------------------------ */

{
  const mw = read("middleware.ts");
  const tier = (re) => {
    const m = mw.match(re);
    return m ? Number(m[1]) : 0;
  };
  const access = tier(/\/\^\\\/api\\\/access\/, limit: (\d+)/);
  check(
    access >= 60,
    "middleware: /api/access shares the catch-all rate tier",
    "The bucket key is `${ip}:${limit}`, so every route on the 30/min catch-all shares one bucket:\n" +
      "      /api/access, /api/playback/*, /api/watch-progress, /api/saved-list and /api/events. A binge\n" +
      "      spends that budget on its own. A 429 makes r.ok false in EpisodeFeed, the chain falls through\n" +
      "      to setAuthFree(false), and a paying customer is paywalled and their episodes turn black.",
  );
}

/* ------------------------------------------------------------------ */
/*  The next slide prefetches                                          */
/* ------------------------------------------------------------------ */

/* BUG THIS CATCHES: the founder reported that the second episode of a series
   opened on a black screen with a spinner, on good wifi, and took seconds to
   start. The next slide attaches its pipeline and parses its manifest while
   the viewer is still on the current episode, and an earlier memory fix then
   stopped every inactive pipeline outright, so it buffered nothing at all. The
   swipe had to fetch segment one from scratch. The prefetch that makes a
   vertical feed feel instant was being cancelled by the code meant to protect
   memory. Memory belongs to maxBufferLength, not to refusing to load. */

check(
  /isNext={i === activeIndex \+ 1}/.test(feedCode),
  "player: slides cannot tell whether they are next",
  "Without knowing which slide is one swipe ahead, the feed can only choose between buffering\n" +
    "      every neighbour or none of them. It chose none, and the next episode started cold.",
);

check(
  /if \(hls && isNext && !blocked\) \{[\s\S]{0,260}?hls\.startLoad\(\);/.test(feedCode),
  "player: the next slide is not allowed to prefetch",
  "The slide one swipe ahead must keep loading so it can paint a first frame the instant it is\n" +
    "      reached. If it is stopped with the rest, every swipe starts from an empty buffer and the\n" +
    "      viewer sees a spinner on a fast connection.",
);

check(
  /hls\.config\.maxBufferLength = NEXT_SLIDE_PREFETCH_S;/.test(feedCode),
  "player: the prefetch is not bounded",
  "An unbounded prefetch on the next slide would restore the memory problem the stopLoad was\n" +
    "      protecting against. The window must be clamped, not merely allowed.",
);

check(
  /hls\.config\.maxBufferLength = ACTIVE_BUFFER_S;/.test(feedCode),
  "player: an activated slide is never given its full buffer back",
  "A slide clamped to the small prefetch window while it was next must have the full budget\n" +
    "      restored when it becomes the slide being watched, or every episode plays with a 4s buffer.",
);

check(
  /maxBufferLength: isActive \? ACTIVE_BUFFER_S : NEXT_SLIDE_PREFETCH_S/.test(feedCode),
  "player: the buffer budget is not chosen at construction",
  "The instance is built before the effect can clamp it, so a slide would spend its first moments\n" +
    "      on whichever budget the literal happened to be. Choose it at construction.",
);

/* ------------------------------------------------------------------ */
/*  MOVED, 2026-08-29. Section 8 below used to sit AFTER the reporter    */
/*  block — after process.exit(1) and after the PASS line — so its five  */
/*  checks could not fail the gate. Proven, not assumed: breaking the    */
/*  AbortController regex while it lived down there still printed        */
/*  "Feed integrity contract: PASS" and exited 0; the same mutation      */
/*  applied to a check above the reporter printed FAIL and exited 1.     */
/*  Every check must be above the reporter. Append new ones there.       */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/*  9. THE SHOW PAGE IS THE FRONT DOOR                                  */
/*                                                                      */
/*  BUG THIS CATCHES: for 70 days every poster, hero, category row and  */
/*  search result in the app linked straight to `/series/<slug>/1` —    */
/*  the player — as a hard-coded string literal repeated at a dozen     */
/*  independent call sites with no shared helper. The 91 show pages,     */
/*  the only surface carrying the synopsis, the cast, the "First N       */
/*  Episodes FREE" badge and the $1.99 Series Unlock card, were          */
/*  reachable by Googlebot and by nothing inside the product. Measured   */
/*  on production 2026-08-29: the home page's real DOM held 25 links     */
/*  ending in /1 and zero show-page links, while its <noscript> block    */
/*  held 107 show-page links and zero player links. The crawler got the  */
/*  merchandising; the paying customer did not.                          */
/*                                                                      */
/*  The single code path that ever chose /series/<slug> was BrowsePage's */
/*  coming-soon arm, keyed on `status === "coming_soon"` — 1:1 with "has */
/*  no video". So the sales page was reachable exactly when there was    */
/*  nothing to sell, which is what made Bollywood read as inverted: its  */
/*  four unsellable tiles opened their description page and its six      */
/*  sellable ones skipped it.                                            */
/* ------------------------------------------------------------------ */

/* 9a. The decision exists in exactly one place, and it does not consult
       playability. Executed against the real module, not matched as text. */

const hasHelpers =
  typeof seriesHrefMod.seriesHref === "function" && typeof seriesHrefMod.episodeHref === "function";

check(
  hasHelpers,
  "routing: the canonical link helpers are gone",
  "lib/series-href.ts must export seriesHref() and episodeHref(). Without one shared decision the\n" +
    "      /1 literal returns, because that is exactly how it spread the first time: a product\n" +
    "      policy frozen as a string at every call site, changeable at none.",
);

if (hasHelpers) {
  /* All 96 rows — the 91 live and the 5 coming-soon — must land on the same
     shape of URL. The front door is identical for a title you can sell and one
     you cannot; the moment it differs by status, the inversion is representable
     again. Checked by calling it, not by reading it. */
  const wrong = catalog.catalog.filter(
    (s) =>
      seriesHrefMod.seriesHref(s) !== `/series/${s.slug}` ||
      seriesHrefMod.seriesHref(s.slug) !== `/series/${s.slug}`,
  );
  check(
    wrong.length === 0,
    "routing: seriesHref does not resolve to the show page",
    `Every tile, hero and search result routes through it, so a wrong answer here is a wrong answer\n` +
      `      everywhere — and a status-dependent answer is the Bollywood inversion rebuilt. Offenders:\n` +
      `      ${wrong.slice(0, 4).map((s) => `${s.slug} (${s.status}) -> ${seriesHrefMod.seriesHref(s)}`).join(", ") || "-"}`,
  );
}

/* 9b. The five coming-soon rows: /series/<slug>/N is a live 404 for them, so
       the helper must fall back to the show page rather than build it.
       getEpisodesForSeries() returns [] at episodeCount 0, getEpisode() is then
       undefined, and app/series/[slug]/[episode]/page.tsx calls notFound(). */
if (hasHelpers) {
  const bad = soon.filter(
    (s) => seriesHrefMod.episodeHref(s, 1) !== `/series/${s.slug}` || seriesHrefMod.episodeHref(s.slug, 1) !== `/series/${s.slug}`,
  );
  check(
    bad.length === 0,
    "routing: a coming-soon row can still be handed an episode URL",
    `/series/<slug>/1 returns 404 for a row with episodeCount 0 — verified on production for all\n` +
      `      five. episodeHref() must fall back to the show page, which renders 200. Offenders:\n` +
      `      ${bad.map((s) => `${s.slug} -> ${seriesHrefMod.episodeHref(s, 1)}`).join(", ") || "-"}`,
  );

  const liveBad = live.filter((s) => seriesHrefMod.episodeHref(s, 1) !== `/series/${s.slug}/1`);
  check(
    liveBad.length === 0,
    "routing: a live title no longer resolves to its own episode URL",
    `A genuine episode URL must still land in the player at that episode — that was shipped in\n` +
      `      Severity 1 and is correct. A fallback that swallows live rows would break resume tiles,\n` +
      `      clip deep links and the show page's own play button. Offenders:\n` +
      `      ${liveBad.slice(0, 4).map((s) => s.slug).join(", ") || "-"}`,
  );
}

/* 9c. No browse-side surface builds the episode-1 literal any more.
       Scanned across every component and every page, because the defect was
       never in one file — it was in thirteen copies of one string. */
{
  const EPISODE_ONE_LITERAL = /`\/series\/\$\{[^}]+\}\/1`|["']\/series\/[a-z0-9-]+\/1["']/;

  /* Files where an episode-1 link is legitimate, each with the reason. This
     list is self-cleaning: a file that no longer contains the pattern must be
     removed from it, or the check below fails. An exemption is not allowed to
     outlive the defect it excuses. */
  /* Empty on purpose. The one entry this list ever held —
     components/LibraryPage.tsx, with three literals at :15, :261 and :274 that
     dropped a saved title straight into the player — was B's handoff request to
     F and has been applied: the poster thumbnail now calls seriesHref() and the
     saved rows moved into components/AccountLists.tsx, which does too. The
     stale-exemption check below is what forced this entry to be deleted rather
     than left behind as a permanent hole. */
  const EXEMPT = new Map([]);

  const scanned = [];
  const walk = (dir) => {
    for (const entry of readdirSync(resolve(ROOT, dir), { withFileTypes: true })) {
      const rel = `${dir}/${entry.name}`;
      if (entry.isDirectory()) walk(rel);
      else if (entry.name.endsWith(".tsx")) scanned.push(rel);
    }
  };
  walk("components");
  walk("app");

  const offenders = scanned.filter((f) => !EXEMPT.has(f) && EPISODE_ONE_LITERAL.test(read(f)));
  check(
    offenders.length === 0,
    "routing: a surface hard-codes its destination",
    `Build artwork links with posterHref() and genuine episode links with episodeHref(). The literal\n` +
      `      is banned even though it is now the right destination for most titles, because a literal\n` +
      `      cannot know that /series/<slug>/1 is a live 404 for the five rows with no video, and because\n` +
      `      thirteen copies of one string with no shared decision is what made the policy impossible to\n` +
      `      change the first time. Offenders:\n` +
      `      ${offenders.join(", ")}`,
  );

  check(
    scanned.length > 60,
    "routing: the surface scan found almost nothing to scan",
    `The walk over components/ and app/ returned ${scanned.length} .tsx files. If the walk breaks, the\n` +
      "      check above passes vacuously and the regression it guards ships unnoticed.",
  );

  const staleExemptions = [...EXEMPT.keys()].filter((f) => !EPISODE_ONE_LITERAL.test(read(f)));
  check(
    staleExemptions.length === 0,
    "routing: an exemption outlived the defect it excused",
    `These files no longer hard-code an episode-1 link, so their entry in EXEMPT is now a hole in\n` +
      `      the check for anyone who edits them next. Delete the entry: ${staleExemptions.join(", ")}`,
  );
}

/* 9d. Every merchandising surface actually calls the helper. 9c only proves the
       old literal is gone; a surface that stopped linking at all, or that grew a
       third spelling, would pass 9c and still strand the show pages. */
{
  const SURFACES = [
    ["components/BrowsePage.tsx", "the home grid, hero, Reality, Red Carpet and Music tiles"],
    ["components/SearchButton.tsx", "the global header search results"],
    ["components/SearchBar.tsx", "the /discover search bar"],
    ["app/search/page.tsx", "the /search results grid"],
    ["app/genres/[slug]/page.tsx", "the plural genre hub (its singular twin app/genre/[genre] was already correct)"],
  ];
  const missing = SURFACES.filter(([f]) => !/posterHref\(/.test(read(f)));
  check(
    missing.length === 0,
    "routing: an artwork surface stopped routing through the helper",
    `Verza is a shorts app: a tap on artwork starts the video, with no interstitial and no second\n` +
      `      tap. Each of these surfaces must call posterHref(), which plays a playable title and falls\n` +
      `      back to the show page for a title with no video:\n` +
      `      ${missing.map(([f, why]) => `${f} (${why})`).join("; ")}`,
  );
}

/* 9e. The tile branch no longer decides the destination.
       BrowsePage's coming-soon ternary must stay — deleting it is what would
       ship five 404s — but both arms must now agree on where the tile goes. */
check(
  !/href=\{`\/series\/\$\{s\.slug\}`\}/.test(browseCode) && /href=\{posterHref\(s\)\}/.test(browseCode),
  "routing: the browse tile still builds its own href",
  "The grid tile once had two arms with two destinations, chosen by `status === \"coming_soon\"`.\n" +
    "      One href for every tile is what makes the old inversion unrepresentable: posterHref decides\n" +
    "      playable-plays / unplayable-explains in one place, so a tile cannot disagree with the policy.",
);

/* 9f. dynamicParams must not be switched off on the show route.
       generateStaticParams deliberately excludes the five coming-soon rows, so
       nothing is PREBUILT for them; they render on demand purely because Next's
       default dynamicParams is true. Setting it false to "tighten SSG" turns all
       five tiles — on two live revenue tabs — into 404s, silently. */
{
  const showPage = read("app/series/[slug]/page.tsx");
  check(
    !/export\s+const\s+dynamicParams\s*=\s*false/.test(showPage),
    "routing: dynamicParams is disabled on /series/[slug]",
    "The five coming-soon rows are excluded from generateStaticParams on purpose and reach their\n" +
      "      page through the framework default. Disabling it 404s every one of them. If SSG really must\n" +
      "      be tightened, add the coming-soon slugs to generateStaticParams in the same commit.",
  );
}

/* 9g. THE SEO SURFACE IS THE ASSET. 91 show pages and 2,214 prerendered episode
       pages are indexed. This sprint adds inbound internal links to pages that
       already exist; it moves no URL. A change to either number is a change to
       what Google has crawled. */
{
  const showPage = read("app/series/[slug]/page.tsx");
  const epPage = read("app/series/[slug]/[episode]/page.tsx");
  const showParams = live.length;
  const epParams = live.reduce((a, s) => a + Math.min(s.episodeCount, 25), 0);

  check(
    showParams === 91,
    "seo: the show-page count moved",
    `generateStaticParams builds one page per live row. Expected 91, got ${showParams}. Every one of\n` +
      "      them is indexed and carries the merchandising copy.",
  );
  check(
    epParams === 2214,
    "seo: the prerendered episode-page count moved",
    `Sum of min(episodeCount, 25) over live rows. Expected 2214, got ${epParams}.`,
  );
  check(
    /SERIES\.filter\(\(s\) => s\.status === "live"\)/.test(showPage) &&
      /SERIES\.filter\(\(s\) => s\.status === "live"\)/.test(epPage),
    "seo: generateStaticParams no longer filters on live status",
    "Both routes must build from live rows only. Widening it publishes five pages for titles with\n" +
      "      no video; narrowing it withdraws pages Google already has.",
  );
  check(
    /Math\.min\(series\.episodeCount, 25\)/.test(epPage),
    "seo: the 25-episode prerender cap changed",
    "2,214 is Σ min(episodeCount, 25). Changing the cap silently changes which of the 4,913 episode\n" +
      "      URLs are prerendered and which fall to blocking render.",
  );
  check(
    /alternates: \{ canonical: `\/series\/\$\{slug\}` \}/.test(showPage),
    "seo: the show page's canonical changed",
    "The canonical is the URL Google has indexed for all 91. It must keep pointing at /series/<slug>.",
  );
}

/* 9h. THE PREWARM FOLLOWS THE NAVIGATION — verify the effect, not the edit.
       posterClick() starts a hidden <video>, attaches hls.js and downloads a
       stream on the assumption that the very next page is EpisodeFeed, which
       ADOPTS the running element. That assumption is the whole mechanism: it is
       why a poster tap reaches a first frame in network time rather than in
       network time plus a page load.

       So the rule is symmetric, and both halves have been live at different
       times in this repo. A link to the PLAYER must prewarm, or the tap is
       merely fast instead of instant. A link to the SHOW PAGE must not, because
       nothing there adopts the hidden element: the stream would be downloaded
       and thrown away after the 12s TTL in lib/instant-player.ts, on cellular,
       on every tap, and the transition poster it seeds into sessionStorage
       would be painted by whichever EpisodeFeed mounts next — the wrong title's
       artwork flashing over the right title's video. */
{
  /* Depth-aware, because a naive /<Link[\s\S]*?>/ stops at the `>` inside an
     arrow function: `onClick={(e) => posterClick(...)}` would be cut in half and
     the check would read every tag as prewarm-free. That is a check that cannot
     fail — the exact thing this file is not allowed to contain. */
  const tags = [];
  for (let i = browseCode.indexOf("<Link"); i !== -1; i = browseCode.indexOf("<Link", i + 5)) {
    let depth = 0;
    for (let j = i + 5; j < browseCode.length; j++) {
      const ch = browseCode[j];
      if (ch === "{") depth++;
      else if (ch === "}") depth--;
      else if (ch === ">" && depth === 0) {
        tags.push(browseCode.slice(i, j + 1));
        break;
      }
    }
  }
  check(
    tags.length >= 5,
    "routing: the <Link> scan of BrowsePage found almost no tags",
    `Found ${tags.length}. If the tag scan breaks, both prewarm checks below pass vacuously.`,
  );

  const showPageTagsWithPrewarm = tags.filter(
    (t) => /href=\{seriesHref\(/.test(t) && /posterClick\(/.test(t),
  );
  check(
    showPageTagsWithPrewarm.length === 0,
    "routing: a show-page link still fires the instant-player prewarm",
    `${showPageTagsWithPrewarm.length} <Link> element(s) route to the show page and still call\n` +
      "      posterClick. Nothing on the show page adopts the hidden player, so the stream is downloaded\n" +
      "      and thrown away, on cellular, on every tap.",
  );

  const playerTags = tags.filter((t) => /href=\{posterHref\(/.test(t));
  const coldPlayerTags = playerTags.filter((t) => !/posterClick\(/.test(t));
  check(
    playerTags.length > 0 && coldPlayerTags.length === 0,
    "routing: an artwork link opens the player without prewarming it",
    `${coldPlayerTags.length} of ${playerTags.length} <Link> element(s) route into the player and do\n` +
      "      not call posterClick. Without the prewarm the tap still works, but the viewer waits for a\n" +
      "      page load before the download even starts. Instant playback on a poster tap is the product;\n" +
      "      speed is the thing testers named as already working, and this is where it comes from.",
  );

  check(
    /startInstantPlayer/.test(read("components/PlayNowLink.tsx")) &&
      /<PlayNowLink/.test(read("app/series/[slug]/page.tsx")),
    "routing: the show page's play button lost its prewarm",
    "The show page is the landing page for search traffic, so its Play CTA is a real entry into the\n" +
      "      player and must prewarm exactly as a poster tap does.",
  );

  /* BUG THIS CATCHES: the prewarm needs a playback id, and the obvious way to
     get one is to look it up in MUX_MAP unguarded. The public projection carries
     ids for the 519 free rows only, but an unguarded lookup is one data change
     away from requesting a paid capability from the client, which AGENTS.md
     rule 8 forbids. The lookup must be gated on the title's own freeEpisodes. */
  check(
    /series\.freeEpisodes >= 1[\s\S]{0,160}?MUX_MAP\[series\.slug\]/.test(
      read("app/series/[slug]/page.tsx"),
    ),
    "playback: the show page prewarms without checking the episode is free",
    "Gate the MUX_MAP lookup on series.freeEpisodes. A paid episode's source must be obtained after\n" +
      "      navigation through the server-authorized path, never resolved from a client-visible map.",
  );
}

/* 9i. The coming-soon show page must not offer an episode picker.
       BUG THIS CATCHES: /series/the-chairmans-revenge shipped a button reading
       "EP 1 of 0" with a tappable "All Episodes" control that opened an empty
       list — directly beneath the page's own "Coming Soon" pill and the line
       "Episodes announced soon". Verified in production HTML. */
{
  const showPage = read("app/series/[slug]/page.tsx");
  check(
    /episodes\.length > 0 \? \(\s*<EpisodeDropdown/.test(showPage),
    "merchandising: the episode picker renders on a page with no episodes",
    "getEpisodesForSeries() returns [] for the five coming-soon rows, and EpisodeDropdown then\n" +
      "      renders `EP 1 of 0` over an empty list. Gate it on episodes.length and fill the space with\n" +
      "      the empty state instead. The picker itself is correct and stays untouched on all 91 live\n" +
      "      pages.",
  );
}

/* 9j. components/SeriesCard.tsx is dead today — its only importer,
       components/ChannelRow.tsx, has no importers at all — but it renders a
       "Soon" badge on a tile whose href was hard-coded to /series/<slug>/1.
       That is precisely the 404 BrowsePage's branch exists to prevent, sitting
       one import away from production. */
{
  const card = read("components/SeriesCard.tsx");
  check(
    /posterHref\(/.test(card) && /Soon/.test(card),
    "routing: SeriesCard can badge a title Soon and link it to a 404",
    "A tile that can render a Soon badge must route through posterHref(), which plays a playable title\n" +
      "      and falls back to the show page for one with no video. A raw episode literal on a tile that\n" +
      "      advertises an unplayable title is a 404 with a badge on it.",
  );
}

/* ------------------------------------------------------------------ */
/*  10. PERSISTENCE — the app must remember a signed-out viewer         */
/*                                                                      */
/*  These run the REAL modules against a fake Storage. Source-text       */
/*  greps would pass on a module that stored nothing; a guest-memory     */
/*  layer that is never exercised without a browser is a guest-memory    */
/*  layer nobody ever runs.                                             */
/* ------------------------------------------------------------------ */

/* A minimal Storage. Also the only thing standing between these checks and
   needing a browser. */
function fakeStorage(seed = {}) {
  const map = new Map(Object.entries(seed));
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => void map.set(k, String(v)),
    removeItem: (k) => void map.delete(k),
    _dump: () => Object.fromEntries(map),
  };
}

function withStorage(seed, fn) {
  const previous = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  const fake = fakeStorage(seed);
  Object.defineProperty(globalThis, "localStorage", {
    value: fake,
    configurable: true,
    writable: true,
  });
  try {
    return fn(fake);
  } finally {
    if (previous) Object.defineProperty(globalThis, "localStorage", previous);
    else delete globalThis.localStorage;
  }
}

let guestStore = null;
let continueMod = null;
try {
  guestStore = loadTypeScriptModule("lib/guest-storage.ts");
  continueMod = loadTypeScriptModule("lib/continue-watching.ts", {
    "./catalog": catalog,
    "./guest-storage": guestStore,
  });
} catch (err) {
  check(false, "persistence: the guest storage layer could not be loaded", String(err && err.message));
}

/* 10a. A signed-out viewer's playhead survives at all.

       BUG THIS CATCHES: the headline persistence defect. POST /api/watch-progress
       401s for a guest (app/api/watch-progress/route.ts:12-15), the localStorage
       fallback that would have covered them was WRITE-ONLY — readLastWatching()
       and clearLastWatching() in lib/resume.ts had zero callers repo-wide — and
       the Continue Watching rail was server-backed. A guest who watched four free
       episodes and closed the tab lost every second of it. Every piece of a
       working guest-resume path existed; none of them were connected. */
if (guestStore) {
  const written = withStorage({}, () => {
    guestStore.saveGuestProgress({
      seriesSlug: "reset",
      episodeNumber: 3,
      progressSeconds: 41,
      completed: false,
    });
    return guestStore.readGuestProgress();
  });
  check(
    written.length === 1 &&
      written[0].seriesSlug === "reset" &&
      written[0].episodeNumber === 3 &&
      written[0].progressSeconds === 41,
    "persistence: a guest's watch progress is not remembered",
    "saveGuestProgress() then readGuestProgress() must round-trip a playhead with no session. If this\n" +
      "      fails, a signed-out viewer loses the whole free preview the moment the tab closes — which is\n" +
      "      the state the free preview is designed to leave people in.\n" +
      `      Got: ${JSON.stringify(written)}`,
  );
}

/* 10b. The store is bounded and upserts rather than appending.

       BUG THIS CATCHES: a heartbeat that fires every ten seconds for the length
       of a binge, writing to a storage area with a ~5 MB quota shared with the
       cart, the language, the unlock hints and the analytics id. An append-only
       log of playheads fills it and then every write in the app starts throwing. */
if (guestStore) {
  /* Two separate measurements, deliberately. Taking the duplicate count AFTER
     the eviction loop would let the cap hide a broken upsert: 60 later writes
     push the duplicates off the end and the store looks fine while every
     heartbeat is still appending. */
  const afterHeartbeats = withStorage({}, () => {
    for (let i = 0; i < 12; i++) {
      guestStore.saveGuestProgress({
        seriesSlug: "reset",
        episodeNumber: 3,
        progressSeconds: i * 10,
        completed: false,
      });
    }
    return guestStore.readGuestProgress();
  });
  const dupes = afterHeartbeats.filter((r) => r.seriesSlug === "reset" && r.episodeNumber === 3);
  check(
    dupes.length === 1 && dupes[0].progressSeconds === 110,
    "persistence: the guest progress store appends instead of upserting",
    `Twelve heartbeats for ONE episode produced ${dupes.length} row(s), newest position\n` +
      `      ${dupes[0] ? dupes[0].progressSeconds : "-"}. The ten-second heartbeat runs for the length of a\n` +
      `      binge; appending instead of upserting fills a ~5 MB quota shared with the cart, the language,\n` +
      `      the unlock hints and the analytics id, after which every write in the app starts throwing.`,
  );

  const rows = withStorage({}, () => {
    for (let n = 1; n <= 60; n++) {
      guestStore.saveGuestProgress({
        seriesSlug: "reset",
        episodeNumber: n,
        progressSeconds: 30,
        completed: false,
      });
    }
    return guestStore.readGuestProgress();
  });
  check(
    rows.length <= guestStore.MAX_PROGRESS_ROWS,
    "persistence: the guest progress store is unbounded",
    `Sixty distinct episodes must cap at MAX_PROGRESS_ROWS (${guestStore.MAX_PROGRESS_ROWS}).\n` +
      `      Got ${rows.length} rows.`,
  );
}

/* 10c. localStorage is attacker-writable, so it is validated on the way OUT.

       BUG THIS CATCHES: a hand-edited or corrupted blob putting a poisoned row
       into the Continue Watching rail and then into a POST body at sign-in
       migration time. The bounds are the same ones the two write routes enforce
       (slug charset, episode 1-999, seconds 0-36000), applied on read as well. */
if (guestStore) {
  const poisoned = JSON.stringify([
    { seriesSlug: "../../etc/passwd", episodeNumber: 1, progressSeconds: 5, completed: false, updatedAt: 1 },
    { seriesSlug: "reset", episodeNumber: 0, progressSeconds: 5, completed: false, updatedAt: 1 },
    { seriesSlug: "reset", episodeNumber: 2, progressSeconds: 999999, completed: false, updatedAt: 1 },
    { seriesSlug: "reset", episodeNumber: 4, progressSeconds: 12, completed: false, updatedAt: 1 },
  ]);
  const survivors = withStorage({ [guestStore.PROGRESS_KEY]: poisoned }, () =>
    guestStore.readGuestProgress(),
  );
  check(
    survivors.length === 1 && survivors[0].episodeNumber === 4,
    "persistence: invalid guest rows are not rejected on read",
    "readGuestProgress() must drop rows that would fail the server's own validators. Anything that\n" +
      "      survives here reaches the Continue Watching rail and then POST /api/account/sync.\n" +
      `      Survivors: ${JSON.stringify(survivors)}`,
  );
  /* Wrapped, because the failure mode under test IS a throw: an unguarded
     JSON.parse here would abort this script instead of reporting a defect. */
  let degradesCleanly = false;
  try {
    degradesCleanly =
      withStorage({ [guestStore.PROGRESS_KEY]: "{not json" }, () => guestStore.readGuestProgress())
        .length === 0;
  } catch {
    degradesCleanly = false;
  }
  check(
    degradesCleanly,
    "persistence: a corrupt guest store throws instead of degrading",
    "A JSON.parse failure must return an empty list, not propagate. This code runs inside the player's\n" +
      "      timeupdate handler; a throw there stops playback.",
  );
}

/* 10d. The guest rail is shaped exactly like the signed-in rail.

       BUG THIS CATCHES: two implementations of Continue Watching drifting apart.
       GET /api/watch-progress drops rows whose series is missing or no longer
       live — added because they rendered poster-less ghost cards linking to 404s
       (route.ts:98-110) — filters completed rows, and caps at 20. A guest rail
       that skipped any of those brings the 404 tile back for the population that
       has no account to fall back on. */
if (continueMod) {
  const now = Date.now();
  const items = continueMod.continueWatchingFromRows([
    { seriesSlug: "reset", episodeNumber: 2, progressSeconds: 30, completed: false, updatedAt: now },
    { seriesSlug: "reset", episodeNumber: 1, progressSeconds: 10, completed: true, updatedAt: now + 5 },
    { seriesSlug: "a-slug-that-is-not-in-the-catalogue", episodeNumber: 1, progressSeconds: 9, completed: false, updatedAt: now + 9 },
  ]);
  check(
    items.length === 1 && items[0].seriesSlug === "reset" && items[0].episodeNumber === 2,
    "persistence: the guest rail does not apply the server's own filters",
    "continueWatchingFromRows() must drop completed rows and rows for series that are missing or not\n" +
      "      live, exactly as app/api/watch-progress/route.ts does.\n" +
      `      Got: ${JSON.stringify(items)}`,
  );
  if (items.length === 1) {
    const shape = Object.keys(items[0]).sort().join(",");
    check(
      shape ===
        "episodeNumber,posterUrl,progressSeconds,seriesSlug,seriesTitle,totalEpisodes,updatedAt",
      "persistence: the guest rail row does not match the API row",
      "BrowsePage renders whichever source answered into ONE component. A field the guest source omits\n" +
        `      is a blank tile for every signed-out viewer. Got: ${shape}`,
    );
  }
  /* A coming-soon row has episodeCount 0, so /series/<slug>/N is a real 404. It
     must never reach the rail — the same class of bug B fixed on the browse
     tiles, arriving instead through saved progress. */
  const soonSlug = (catalog.catalog.find((s) => s.status === "coming_soon") ?? {}).slug;
  if (soonSlug) {
    const soonItems = continueMod.continueWatchingFromRows([
      { seriesSlug: soonSlug, episodeNumber: 1, progressSeconds: 30, completed: false, updatedAt: now },
    ]);
    check(
      soonItems.length === 0,
      "persistence: a coming-soon row can reach the Continue Watching rail",
      `A resume tile links to /series/<slug>/<n> with an offset. For a coming-soon row that URL 404s.\n` +
        `      ${soonSlug} produced ${soonItems.length} rail row(s).`,
    );
  }
}

/* 10e. The account wins whenever it has anything to say.

       BUG THIS CATCHES: a stale device shadowing an account. Someone who watched
       on their phone and then signs in on a laptop must see the account's rail,
       not the laptop's leftovers. The precedence lives in one function so no
       surface can pick its own. */
if (continueMod && guestStore) {
  const server = [
    {
      seriesSlug: "reset",
      seriesTitle: "Server row",
      posterUrl: "/x.jpg",
      episodeNumber: 9,
      totalEpisodes: 20,
      progressSeconds: 5,
      updatedAt: new Date().toISOString(),
    },
  ];
  const merged = withStorage({}, () => {
    guestStore.saveGuestProgress({ seriesSlug: "reset", episodeNumber: 2, progressSeconds: 30 });
    return continueMod.mergeContinueWatching(server);
  });
  check(
    merged.length === 1 && merged[0].episodeNumber === 9,
    "persistence: local rows override the account's Continue Watching",
    "mergeContinueWatching() must return the server's rows untouched when it has any. Otherwise a\n" +
      "      device that was signed out yesterday rewrites the rail for an account that has moved on.",
  );
  const fallback = withStorage({}, () => {
    guestStore.saveGuestProgress({ seriesSlug: "reset", episodeNumber: 2, progressSeconds: 30 });
    return continueMod.mergeContinueWatching([]);
  });
  check(
    fallback.length === 1 && fallback[0].episodeNumber === 2,
    "persistence: the rail stays empty for a guest",
    "GET /api/watch-progress returns {items: []} for a signed-out caller, so an empty array is the\n" +
      "      GUEST case, not an authoritative empty account. mergeContinueWatching([]) must fall back to\n" +
      "      the device or the rail is invisible to every guest — the population the free preview serves.",
  );
}

/* 10f. Sign-in migration re-arms, and does not fire forever.

       BUG THIS CATCHES: both halves of getting this wrong. A digest that never
       changes means a guest's history is offered to the account once and any
       later viewing is stranded; a digest that always differs means every route
       change in the app POSTs the whole snapshot again. */
if (guestStore) {
  const observed = withStorage({}, () => {
    const before = guestStore.guestStateNeedsMigration();
    guestStore.saveGuestProgress({ seriesSlug: "reset", episodeNumber: 1, progressSeconds: 30 });
    const armed = guestStore.guestStateNeedsMigration();
    guestStore.markGuestStateMigrated();
    const settled = guestStore.guestStateNeedsMigration();
    guestStore.setSavedSlug("reset", true);
    const rearmed = guestStore.guestStateNeedsMigration();
    return { before, armed, settled, rearmed };
  });
  check(
    observed.before === false && observed.armed === true && observed.settled === false && observed.rearmed === true,
    "persistence: guest-state migration does not arm and settle correctly",
    "Empty device -> false. New progress -> true. After a successful merge -> false. New bookmark ->\n" +
      "      true again. Anything else either strands a viewer's history at sign-in or re-POSTs the whole\n" +
      `      snapshot on every navigation. Got: ${JSON.stringify(observed)}`,
  );
}

/* 10g. Account deletion takes the device with it.

       BUG THIS CATCHES: the Delete Account button promises to remove "your
       account, watch history, saved list, and purchases access". It cleared
       verza-saved, verza-lang and the verza-unlock: hints and left a full local
       watch history on the device, which made that sentence false. */
if (guestStore) {
  const left = withStorage({}, (fake) => {
    guestStore.saveGuestProgress({ seriesSlug: "reset", episodeNumber: 1, progressSeconds: 30 });
    guestStore.setSavedSlug("reset", true);
    guestStore.markGuestStateMigrated();
    guestStore.clearGuestState();
    return Object.keys(fake._dump());
  });
  check(
    left.length === 0,
    "persistence: account deletion leaves guest state on the device",
    `clearGuestState() must remove the progress, the saved list and the migration digest. Left behind:\n` +
      `      ${left.join(", ")}`,
  );
}

/* 10h. Every player records progress through the one shared path.

       BUG THIS CATCHES: five hand-rolled copies of the same POST — EpisodeFeed's
       heartbeat, its completion write and its pagehide flush, plus Player's
       heartbeat and flush — all sharing one fault, that the route 401s for a
       guest. Five copies of a policy is why fixing it in one of them fixes
       nothing. A new player, or a revert of one call site, silently reopens it. */
{
  const player = read("components/Player.tsx");
  for (const [label, src] of [["EpisodeFeed", feed], ["Player", player]]) {
    const body = stripComments(src);
    check(
      !/fetch\(\s*["'`]\/api\/watch-progress["'`]\s*,\s*\{[\s\S]{0,80}method:\s*["'`]POST/.test(body),
      `persistence: ${label} writes watch progress with a raw POST`,
      "Progress must go through recordWatchProgress() in lib/watch-progress-client.ts, which records on\n" +
        "      the device FIRST and then tells the account. A direct POST is discarded for every signed-out\n" +
        "      viewer, because app/api/watch-progress/route.ts:12-15 returns 401 with no local fallback.",
    );
    check(
      /recordWatchProgress\(/.test(body),
      `persistence: ${label} no longer records watch progress at all`,
      "Both players must call recordWatchProgress(). Losing the call is indistinguishable, from the\n" +
        "      viewer's side, from the original bug.",
    );
  }
}

/* 10h-bis. recordWatchProgress() actually lands a row — EXECUTED, not grepped.

       BUG THIS CATCHES: the class of fix that looks right and does nothing. 10h
       proves both players CALL the shared recorder; this proves the recorder
       WRITES. A version that only POSTed, or that wrote after awaiting the
       network, would pass every source-text check above and still lose a guest's
       position on the one path that has no second chance — the pagehide flush,
       where the tab is going away and the request may never be sent. */
if (guestStore) {
  let recorder = null;
  try {
    recorder = loadTypeScriptModule("lib/watch-progress-client.ts", { "./guest-storage": guestStore });
  } catch (err) {
    check(false, "persistence: lib/watch-progress-client.ts could not be loaded", String(err && err.message));
  }
  if (recorder) {
    const previousFetch = globalThis.fetch;
    const calls = [];
    globalThis.fetch = (url, init) => {
      calls.push({ url, init });
      // Reject, the way a guest's 401 path and an offline tab both effectively
      // do, to prove the device write does not depend on the network at all.
      return Promise.reject(new Error("offline"));
    };
    let landed = [];
    try {
      landed = withStorage({}, () => {
        recorder.recordWatchProgress(
          { seriesSlug: "reset", episodeNumber: 4, progressSeconds: 87.6, completed: false },
          { keepalive: true },
        );
        return guestStore.readGuestProgress();
      });
    } finally {
      if (previousFetch) globalThis.fetch = previousFetch;
      else delete globalThis.fetch;
    }
    check(
      landed.length === 1 && landed[0].episodeNumber === 4 && landed[0].progressSeconds === 87,
      "persistence: recordWatchProgress does not write to the device",
      "With the network failing, the playhead must still be on the device synchronously. If this fails,\n" +
        "      every source check above passes while a guest still loses the free preview.\n" +
        `      Got: ${JSON.stringify(landed)}`,
    );
    check(
      calls.length === 1 && calls[0].init && calls[0].init.keepalive === true,
      "persistence: recordWatchProgress drops the account write or the keepalive flag",
      "It must still POST, and the backgrounding flush must pass keepalive so the request can outlive\n" +
        `      the page. Got ${calls.length} call(s), keepalive=${calls[0] && calls[0].init ? calls[0].init.keepalive : "-"}.`,
    );
  }
}

/* 10i. The bookmark confirms, and reverts when the account says no.

       BUG THIS CATCHES: the reported one — the bookmark could be tapped over and
       over with no confirmation while the list it feeds stayed empty. Three
       faults in one handler: every side effect lived inside the setIsSaved
       updater (React may invoke an updater more than once), the response was
       discarded with .catch(() => {}) so a failed write still rendered "Saved to
       My List", and mount read only localStorage so a second device showed an
       empty bookmark for an already-saved title and the next tap DELETED it. */
{
  const toggle = feedCode.match(/function toggleSave\(\)[\s\S]{0,2200}?\n {2}}/);
  check(Boolean(toggle), "persistence: toggleSave() could not be located", "Renamed? Update this check.");
  if (toggle) {
    const body = toggle[0];
    check(
      !/setIsSaved\(\s*\((?:prev|[a-z]+)\)\s*=>\s*\{[\s\S]*?fetch\(/.test(body),
      "persistence: the bookmark's network write lives inside a state updater",
      "React invokes a state updater more than once (StrictMode does it deliberately), so the POST and\n" +
        "      the localStorage write were not guaranteed to happen once per tap. Compute the intent first,\n" +
        "      then act on it.",
    );
    check(
      /\.then\(/.test(body) && /r\.ok/.test(body),
      "persistence: the bookmark ignores whether the save succeeded",
      "The response must be read. A discarded promise is how a failed write still rendered\n" +
        '      "Saved to My List" and then an empty list — which is the defect users reported.',
    );
    check(
      /401/.test(body),
      "persistence: the bookmark treats a guest's 401 as a failure",
      "POST /api/saved-list 401s for a signed-out viewer, and that is EXPECTED: the device write is the\n" +
        "      save for them, and GuestStateSync hands it to the account at sign-in. Reverting the icon on\n" +
        "      401 un-bookmarks every guest.",
    );
    check(
      /popActionToast\(/.test(body),
      "persistence: the bookmark gives no confirmation",
      "A tap with no visible response is the reported complaint. Keep the toast.",
    );
  }
}

/* 10j. The three account rows are not shells.

       BUG THIS CATCHES: "My List" linked to /library, which opens on its Channels
       tab; "Continue Watching" linked to "/"; and "Purchase History" linked to
       /me — its own URL — with the literal string "No purchases" beside it, so a
       customer who had bought a Series Unlock was told they had bought nothing
       and tapping the row reloaded the same page. */
{
  const me = read("app/me/page.tsx");
  const row = (label) => {
    const m = me.match(new RegExp(`label="${label}"[\\s\\S]{0,200}?href="([^"]+)"`));
    return m ? m[1] : null;
  };
  check(
    row("Purchase History") !== "/me" && row("Purchase History") !== null,
    "account: Purchase History links to the page it is already on",
    `href was ${row("Purchase History")}. It must open a page that lists what the account owns.`,
  );
  check(
    row("Continue Watching") !== "/",
    "account: Continue Watching links to the home page",
    "The home rail is one surface among many on / and was server-only. The row must open something\n" +
      "      that renders the viewer's unfinished episodes, signed in or not.",
  );
  check(
    !/detail="No purchases"/.test(me),
    "account: the purchase count is a hard-coded string",
    'app/me/page.tsx shipped detail="No purchases" as a literal, so it said that to a customer with\n' +
      "      eighty-six unlocks. It must read /api/entitlements.",
  );
  const list = read("app/me/list/page.tsx");
  check(
    /<SavedShowsList\b/.test(list) && /<RecentlyWatchedList\b/.test(list),
    "account: /me/list renders hard-coded empty states",
    "Both tabs of that page were literal <EmptyState> calls — no fetch, no storage read — so it told\n" +
      '      every viewer "No saved shows yet. Tap the bookmark icon on any show to add it here", forever,\n' +
      "      including the viewer who had just done exactly that.",
  );
}

/* 10l. The account surfaces say "nothing here yet" in ONE voice.

       BUG THIS CATCHES: a second empty-state design. Testers named the Anime
       tab's card as the model for the whole app, and every surface that grew
       its own near-copy of it — a different disc, a different glyph size, a
       different CTA shape — is a surface that will drift away from it. The three
       account lists (saved shows, recently watched, purchases) and the Library's
       empty channel cards all render components/EmptyState. */
{
  const SURFACES = [
    ["components/AccountLists.tsx", "the saved-shows and recently-watched lists"],
    ["components/PurchaseHistoryList.tsx", "purchase history: signed out, error and nothing-bought"],
    ["components/LibraryPage.tsx", "a channel with no live titles"],
  ];
  const rogue = SURFACES.filter(([f]) => !/from "@\/components\/EmptyState"/.test(read(f)));
  check(
    rogue.length === 0,
    "empty states: an account surface hand-rolls its own empty card",
    "components/EmptyState is the Anime tab's card, lifted verbatim, and it is the one testers named as\n" +
      "      working. A surface that rebuilds it locally drifts from it the first time either is touched.\n" +
      `      Offenders: ${rogue.map(([f, why]) => `${f} (${why})`).join(", ") || "-"}`,
  );
}

/* 10k. There is a way back in for a customer who forgot their password.

       BUG THIS CATCHES: /forgot-password, /reset-password, the branded recovery
       email and both server actions were all built and deployed, and NOTHING in
       the product linked to them. A customer who paid $1.99 and forgot their
       password was permanently locked out of their own purchases. Both auth
       pages also declared `error?: string` in searchParams and never rendered
       it, so a wrong password produced a silent form reset. */
{
  const signIn = read("app/sign-in/page.tsx");
  check(
    /href="\/forgot-password"/.test(signIn),
    "auth: /sign-in has no forgot-password link",
    "The reset flow exists and is deployed. Without a link to it, a customer who forgot their password\n" +
      "      cannot reach their purchases from anywhere in the product.",
  );
  check(
    existsSync(resolve(ROOT, "app/forgot-password/page.tsx")) &&
      existsSync(resolve(ROOT, "app/reset-password/page.tsx")),
    "auth: the password reset route is gone",
    "app/forgot-password and app/reset-password back that link. Removing either strands the link.",
  );
  for (const page of ["app/sign-in/page.tsx", "app/sign-up/page.tsx"]) {
    const src = read(page);
    check(
      /AuthErrorNotice/.test(src),
      `auth: ${page} swallows its own error parameter`,
      "app/actions/auth.ts redirects here with ?error= on every failure. Both pages declared the param\n" +
        "      in their searchParams type and neither read it, so every failed attempt looked like nothing\n" +
        "      had happened at all.",
    );
  }
  const notice = read("components/AuthErrorNotice.tsx");
  check(
    !/\{\s*error\s*\}/.test(notice.replace(/\{\s*error\s*\}:/g, "")),
    "auth: the raw error parameter is rendered to the page",
    "`error` is a query parameter and therefore attacker-controlled. A crafted link could otherwise put\n" +
      "      any sentence — a fake support phone number — on our own sign-in page in our own type. Map\n" +
      "      known causes to our copy and fall back to a generic line.",
  );
}

/* ------------------------------------------------------------------ */
/*  11. THE SHELL: the category strip, the empty states, the store links */
/*                                                                      */
/*  Appended ABOVE the reporter on purpose. Five checks once sat below   */
/*  it, after process.exit(1), and could not fail the gate; breaking one */
/*  there printed PASS and exited 0. Never append after the reporter.    */
/* ------------------------------------------------------------------ */

const tabsSrc = read("components/CategoryTabs.tsx");
const tabsCode = stripComments(tabsSrc);

/* 11a. The category rail says, on screen, that it scrolls — and stops saying
       it at the end.

       BUG THIS CATCHES: ten tabs render ~1,000px of track inside a 320-430px
       rail. The rail ended in a hard vertical cut through whatever label landed
       on the boundary, with no fade, no peek treatment and no other hint. Two
       testers read "ESPAÑ" as a broken label rather than as a row that moves:
       one left believing this was a romance-drama-only app, and one concluded
       there was no Indian content while six Bollywood titles were on sale. The
       affordance has to be DERIVED from scroll position, not painted always-on
       — a fade that stays lit at the end of the rail promises content that is
       not there. */
check(
  /scrollWidth\s*-\s*rail\.clientWidth/.test(tabsCode) && /rail\.scrollLeft/.test(tabsCode),
  "shell: the category rail no longer measures its own overflow",
  "components/CategoryTabs.tsx must compute the remaining track from scrollWidth - clientWidth and\n" +
    "      scrollLeft. Without that measurement the edge treatment is decoration and cannot be honest.",
);
check(
  /opacity:\s*overflow\.left\s*\?/.test(tabsCode) && /opacity:\s*overflow\.right\s*\?/.test(tabsCode),
  "shell: the category rail's edge fades are no longer bound to scroll position",
  "Both fades must read the measured overflow state. Hard-coding either one to 1 re-creates the\n" +
    "      original defect in reverse: an edge that claims there is more to the right at the far right end.",
);

/* 11b. The rail's scroll listener is torn down BY IDENTITY.

       BUG THIS CATCHES: the class of teardown that removes every listener for
       an event instead of the one it added — the same defect that stripped
       hls.js's own ERROR handlers off the adopted player instance. This rail is
       not a private element: components/BrowsePage.tsx decides whether a touch
       belongs to a horizontal scroller by walking up to it with
       .closest(".overflow-x-auto"), and the component scrolls it programmatically
       from two effects. A blanket removal here would silently disarm whatever
       else is listening. */
{
  const added = tabsCode.match(/rail\.addEventListener\(\s*"scroll"\s*,\s*(\w+)/);
  const removed = tabsCode.match(/rail\.removeEventListener\(\s*"scroll"\s*,\s*(\w+)/);
  check(
    Boolean(added) && Boolean(removed) && added[1] === removed[1],
    "shell: the category rail's scroll listener is not removed by identity",
    "addEventListener and removeEventListener must name the SAME handler variable. A mismatch either\n" +
      "      leaks a listener per mount or, worse, invites the argument-less removal that takes out every\n" +
      "      other subscriber on the element.",
  );
}
check(
  !/rail\.removeEventListener\(\s*"scroll"\s*\)/.test(tabsCode),
  "shell: the category rail removes every scroll listener on the element",
  "removeEventListener with no handler is a blanket removal. Scope it to the listener this component\n" +
    "      added.",
);

/* 11c. Every category is reachable at 320px.

       BUG THIS CATCHES: at 320px exactly three of the ten top-level categories
       fit in the strip. Bollywood, Reality, Creators, Red Carpet and Music were
       entirely off screen. A fade cannot fix that — it says the row moves, not
       what is over there — so the strip carries a control that opens all of
       them at once. Both the opener and the sheet must render from the SAME
       `items` array the strip does, or the sheet becomes a second, drifting
       copy of the tab list. */

/* 11d. The store links are the ones the backend actually verifies against.

       BUG THIS CATCHES: /about ("Available on iOS, Android, and Web."),
       /press ("Platforms: Web, iOS, Android") and the platform sentences in the
       legal copy all told visitors the apps existed, and the site carried no
       link to either store on any page — a live App Store listing and a live
       Play listing reachable only by searching for them. The two identifiers
       below are not decorative: APPLE_APP_ID is passed to Apple's
       SignedDataVerifier as the production appAppleId and APPLE_BUNDLE_ID is
       the verified bundle. Deriving the marketing URLs from anything else means
       someone guessed. */
{
  /* Comments stripped: the provenance note in lib/app-store.ts quotes the
     storefront-qualified URL Apple redirects TO, as evidence the id resolves.
     Matching source against prose would fail the check on its own citation. */
  const storeSrc = stripComments(read("lib/app-store.ts"));
  const iapSrc = read("lib/apple-iap-verification.ts");
  const appleId = iapSrc.match(/APPLE_APP_ID\s*=\s*(\d+)/);
  const bundleId = iapSrc.match(/APPLE_BUNDLE_ID\s*=\s*"([^"]+)"/);
  check(
    Boolean(appleId) && new RegExp(`apps\\.apple\\.com/app/id${appleId[1]}`).test(storeSrc),
    "shell: the App Store URL no longer matches the verified Apple app id",
    "lib/app-store.ts must build the URL from the same numeric id lib/apple-iap-verification.ts passes\n" +
      "      to Apple as the production appAppleId. Any other number is a guess pointed at a stranger's app.",
  );
  check(
    Boolean(bundleId) && storeSrc.includes(`details?id=${bundleId[1]}`),
    "shell: the Google Play URL no longer matches the verified bundle id",
    "The Play listing is keyed by the same application id as APPLE_BUNDLE_ID. Editing one without the\n" +
      "      other silently ships a link to whatever else owns that package name.",
  );
  check(
    !/apps\.apple\.com\/[a-z]{2}\/app/.test(storeSrc),
    "shell: the App Store URL hard-codes a storefront country",
    "A bare /app/id<n> is redirected by Apple to the viewer's own storefront. Pinning /us/ sends every\n" +
      "      non-US visitor to a store they cannot buy from.",
  );
  for (const page of ["components/Footer.tsx", "app/about/page.tsx", "app/press/page.tsx"]) {
    check(
      /<StoreLinks\b/.test(read(page)),
      `shell: ${page} states the apps exist and does not link to them`,
      "This surface makes the iPhone/iPad/Android claim. It has to carry the route to the two listings,\n" +
        "      or the claim is true and unusable — which is how the site shipped with a live iOS app and no\n" +
        "      store link anywhere on it.",
    );
  }
}

/* 11e. Nothing on the Tubi panel is tappable and inert.

       BUG THIS CATCHES: the partner carousel renders Tubi's own title cards,
       each with Tubi's yellow play button drawn INTO the artwork. There was no
       anchor anywhere in the component, so six large, obvious play affordances
       did nothing at all, and the panel's one working control opened Tubi's
       home page rather than anything to do with the title on screen. The slides
       are links now, and the corner chip says where they go — the honest
       reading of a montage. The drag guard is load-bearing: without it every
       swipe of the carousel ends in a click and navigates off the site. */
{
  const tubi = stripComments(read("components/TubiHeroCarousel.tsx"));
  check(
    /\{slides\.map\([\s\S]{0,400}?<a\b[\s\S]{0,300}?\shref=\{href\}/.test(tubi),
    "shell: the Tubi carousel slides are decoration again",
    "Each slide must be a real outbound link. The play buttons are part of the supplied artwork, so a\n" +
      "      slide that is not a link is a play button that does nothing.",
  );
  check(
    /draggedRef\.current\s*=\s*Math\.abs\(dx\)\s*>/.test(tubi) && /e\.preventDefault\(\)/.test(tubi),
    "shell: the Tubi carousel navigates on every swipe",
    "touchend fires before click. Without the drag guard, dragging to see the next banner opens Tubi\n" +
      "      instead — the carousel becomes unswipeable the moment its slides become links.",
  );
  check(
    /Opens Tubi/.test(tubi) && /pointerEvents:\s*"none"/.test(tubi),
    "shell: the Tubi carousel no longer says where a tap goes",
    "The artwork promises playback in place. The chip is the honest label, and it must stay\n" +
      "      pointer-events:none so it never swallows the tap or the swipe it is describing.",
  );
}

/* 11f. There is exactly ONE empty state in this app.

       BUG THIS CATCHES: testers singled out the Anime tab's card — a clock, one
       honest sentence, a button somewhere useful — and called it the model. The
       risk when four more surfaces need the same message is that each gets its
       own card. components/EmptyState.tsx is that pattern; the neutral slate
       below is the deliberate part, chosen because brand pink and violet invite
       a tap and this card explicitly does not. */
{
  /* Stripped: the file's own doc block prints the three constants so a reader
     knows they are the pattern and not arbitrary. Matching prose would let the
     card be re-styled while its documentation still described the old one. */
  const emptySrc = stripComments(read("components/EmptyState.tsx"));
  check(
    /rgba\(12,12,20,0\.82\)/.test(emptySrc) && /<circle cx="12" cy="12" r="10"/.test(emptySrc),
    "shell: the shared empty state has been re-tuned away from the Anime card",
    "The slate background and the clock glyph ARE the pattern testers praised. Changing them here\n" +
      "      changes every surface that says 'nothing here yet', which is the point of the component.",
  );
  check(
    !/^"use client"/m.test(emptySrc),
    "shell: the shared empty state became a client component",
    "It is rendered both from BrowsePage (client, passes onClick) and from the coming-soon show page\n" +
      "      (server, passes href). Marking it \"use client\" drags the show page's copy into the bundle for\n" +
      "      no gain and breaks nothing loudly enough to notice.",
  );
  /* Either form counts: the surface renders <EmptyState> (the goal), or it
     still inlines the same card by hand (where it stands today). What must
     never happen is a surface that says "nothing here yet" in a palette of its
     own — the check would otherwise fire on the very refactor it is asking
     for. */
  for (const page of ["components/BrowsePage.tsx", "app/series/[slug]/page.tsx"]) {
    const src = read(page);
    check(
      src.includes("rgba(12,12,20,0.82)") || /<EmptyState\b/.test(src),
      `shell: ${page} has grown a second empty-state style`,
      "Every 'nothing here yet' surface uses the one card — components/EmptyState.tsx, or the same\n" +
        "      slate inlined. A second palette here means the app says the same thing in two voices, which\n" +
        "      is exactly what testers praised the Anime card for avoiding.",
    );
  }
}

/* ================================================================== */
/*  10. LOCALIZATION (agent D)                                         */
/*                                                                      */
/*  A Spanish-only speaker set the app to Espanol, browsed a Spanish     */
/*  show with Spanish artwork and a Spanish synopsis, hit the wall at    */
/*  episode 6, and every word of the payment screen was English. In      */
/*  their words: the app speaks Spanish right up until it wants a card.  */
/*  Separately, "pasion" returned nothing while the result's own poster  */
/*  reads SENTENCIA DE PASIÓN — a Spanish keyboard auto-accents, so the  */
/*  CORRECT spelling was the one that failed.                            */
/* ================================================================== */
{
  const fold = loadTypeScriptModule("lib/text-fold.ts");
  const searchIndex = loadTypeScriptModule("lib/search-index.ts", {
    "@/lib/text-fold": fold,
  });
  const i18n = loadTypeScriptModule("lib/i18n.ts");
  const priceMod = loadTypeScriptModule("lib/price.ts");
  const audioLang = loadTypeScriptModule("lib/audio-language.ts", {
    "@/lib/catalog": catalog,
  });

  const matches = (q) =>
    live
      .filter((s) => searchIndex.seriesMatchesQuery(s, q))
      .map((s) => s.slug)
      .sort();

  /* 10a. BUG THIS CATCHES: /search?q=pasion returned 0 results while
     /search?q=pasión returned 1, and /search?q=espanol returned 5 while
     /search?q=español returned 0 (measured on production 2026-08-29). The
     matcher was haystack.toLowerCase().includes(query.toLowerCase()) with
     .normalize() called on NEITHER side, so which spelling won was decided by
     how the string happened to be typed into lib/catalog.ts — and it failed in
     both directions. These pairs are real catalogue titles, not fixtures. */
  const accentPairs = [
    ["pasion", "pasión"],
    ["espanol", "español"],
    ["engane", "engañé"],
    ["enamore", "enamoré"],
    ["cunado", "cuñado"],
    ["profesor", "PROFESÓR".toLowerCase()],
    ["musica", "música"],
  ];
  const accentSplits = [];
  for (const [plain, accented] of accentPairs) {
    const a = matches(plain);
    const b = matches(accented);
    if (a.join("|") !== b.join("|")) {
      accentSplits.push(`"${plain}" → ${a.length} vs "${accented}" → ${b.length}`);
    }
  }
  check(
    accentSplits.length === 0,
    "search: an accented query and its unaccented spelling return different results",
    "Fold BOTH the query and the index (lib/text-fold.ts). Folding one side fixes one direction and\n" +
      "      leaves the other broken.\n      " +
      accentSplits.join("\n      "),
  );

  /* The pairs above are only meaningful if they actually hit something. A
     folding bug that made everything match nothing would pass the equality
     test above with two empty sets. */
  check(
    matches("pasion").includes("sentence-of-passion-es") &&
      matches("pasión").includes("sentence-of-passion-es") &&
      matches("espanol").length === 5 &&
      matches("español").length === 5 &&
      matches("cunado").includes("i-fell-in-love-with-my-presidential-brother-in-law-es"),
    "search: folded queries match nothing at all",
    "Both spellings agreeing on an EMPTY result set is not a fix. 'pasion' and 'pasión' must both\n" +
      "      return sentence-of-passion-es, and both spellings of espanol must return all five Spanish rows.",
  );

  /* 10b. BUG THIS CATCHES: the obvious fix for 10a —
     .normalize("NFD").replace(/\p{Diacritic}/gu, "") — is the one written into
     the Phase 0 diagnosis, and it is WRONG for this catalogue. \p{Diacritic}
     matches the Devanagari virama U+094D, so it silently rewrites Hindi:
     "हिन्दी" becomes "हिनदी" and "दोस्ती" becomes "दोसती". The Bollywood tab is
     six live Hindi titles. Folding must stay inside the Latin combining range
     U+0300-U+036F. */
  const devanagari = "हिन्दी दोस्ती";
  const arabic = "العربية";
  const thai = "ไทย";
  check(
    fold.foldText(devanagari) === devanagari &&
      fold.foldText(arabic) === arabic &&
      fold.foldText(thai) === thai &&
      fold.foldText("ñ") === "n" &&
      fold.foldText("Ó") === "o",
    "search: diacritic folding is mangling non-Latin scripts",
    "Use the U+0300-U+036F combining-marks range, not \\p{Diacritic}. \\p{Diacritic} strips the\n" +
      "      Devanagari virama and nukta, which changes Hindi words rather than normalising them.",
  );

  /* Hindi and transliterated titles must still be reachable. */
  check(
    matches("dil dosa").includes("dil-dosa-dosti") &&
      matches("flatmate").includes("falling-for-flatmate") &&
      matches("salt pepper").includes("salt-and-pepper"),
    "search: Bollywood titles are unreachable",
    "The six Hindi titles ship with English lockups and no curated SEARCH_TAGS, so title, slug,\n" +
      "      genre and logline are their entire index. Folding must not disturb them.",
  );

  /* 10c. BUG THIS CATCHES: three separate search UIs each carried their own
     inline predicate. /discover's bar had no tags, no SEARCH_TAGS and OR
     across fields instead of per-token AND, so the same typed string returned
     a different set on /discover than in the header popover — and all of them
     were accent-blind independently, so fixing one left the others broken. */
  const searchSurfaces = [
    "components/SearchBar.tsx",
    "components/SearchButton.tsx",
    "components/FeedSearch.tsx",
    "app/search/page.tsx",
  ];
  const privateMatchers = searchSurfaces.filter((f) => {
    const src = stripComments(read(f));
    return !/seriesMatchesQuery\(/.test(src) || /toLowerCase\(\)\.includes\(/.test(src);
  });
  check(
    privateMatchers.length === 0,
    "search: a surface is matching with its own predicate instead of seriesMatchesQuery",
    "Every catalogue search must go through lib/search-index.ts. A private toLowerCase().includes()\n" +
      "      is how three surfaces ended up with three different answers.\n      " +
      privateMatchers.join(", "),
  );

  /* 10d. BUG THIS CATCHES: the in-feed paywall was hard-coded English —
     "Unlock All Episodes", "one-time Series Unlock", "$1.99", "Secure checkout
     via Stripe", "Go Back" — on the ONE screen where the language switcher is
     unreachable, because app/globals.css hides the header under
     .episode-immersive. A Spanish speaker could not translate it and could not
     switch away from it. */
  const paywallStart = feed.indexOf("{showUnlock && (");
  /* Comments stripped first: the replacement code explains itself by quoting
     the literals it removed, and a check for the ABSENCE of a string must not
     be re-triggered by the comment documenting why it went. */
  const paywallSrc = paywallStart > 0 ? stripComments(feed.slice(paywallStart)) : "";
  const englishInPaywall = [
    "Unlock All Episodes",
    "Episode Unavailable",
    "one-time Series Unlock",
    "Secure checkout via Stripe",
    "$1.99",
    "Go Back",
    "Opening secure checkout",
    "Please try again",
  ].filter((lit) => paywallSrc.includes(lit));
  check(
    paywallStart > 0 && englishInPaywall.length === 0,
    "paywall: hard-coded English copy is back on the payment screen",
    "Every string in the unlock overlay goes through t(). This is the one screen with no language\n" +
      "      switcher (app/globals.css hides the header on .episode-immersive), so English here is final.\n      " +
      `Found: ${englishInPaywall.join(" | ") || "(paywall block not located)"}`,
  );

  /* 10e. BUG THIS CATCHES: a key present in `en` but missing from `es` falls
     back to English silently — which reproduces the exact defect being fixed,
     one string at a time, with nothing failing. Placeholders are checked too:
     a translator dropping {price} from the CTA ships a buy button with no
     price on it, and dropping "Stripe" from the security line removes the
     named processor testers called out as part of the paywall's honesty. */
  const dicts = i18n.dictionaries;
  const localeCodes = i18n.LOCALES.map((l) => l.code);
  const enKeys = Object.keys(dicts.en);
  const paywallKeys = enKeys.filter(
    (k) => k.startsWith("paywall.") || k.startsWith("checkout.") || k.startsWith("language."),
  );
  const dictProblems = [];
  const placeholders = {
    "paywall.previewOver": ["{title}"],
    "paywall.benefitEpisodes": ["{count}"],
    "paywall.cta": ["{price}"],
    "language.audio": ["{language}"],
    "language.audioSubs": ["{language}", "{subtitles}"],
  };
  for (const code of localeCodes) {
    const d = dicts[code];
    if (!d) {
      dictProblems.push(`${code}: no dictionary`);
      continue;
    }
    for (const key of paywallKeys) {
      const v = d[key];
      if (typeof v !== "string" || v.trim() === "") {
        dictProblems.push(`${code}.${key}: missing`);
        continue;
      }
      for (const token of placeholders[key] ?? []) {
        if (!v.includes(token)) dictProblems.push(`${code}.${key}: lost ${token}`);
      }
    }
    if (d["paywall.secure"] && !d["paywall.secure"].includes("Stripe")) {
      dictProblems.push(`${code}.paywall.secure: no longer names Stripe`);
    }
  }
  check(
    dictProblems.length === 0 && paywallKeys.length >= 20 && localeCodes.length === 20,
    "i18n: a locale is missing paywall/checkout copy or lost a placeholder",
    "Every one of the 20 locales must carry every paywall.*, checkout.* and language.* key with its\n" +
      "      placeholders intact. A missing key falls back to English on the payment screen, which is the\n" +
      "      defect this work exists to remove.\n      " +
      dictProblems.slice(0, 8).join("\n      "),
  );

  /* 10f. BUG THIS CATCHES: /api/unlock returns English error sentences. The
     paywall printed data.error verbatim, so a failed checkout dropped an
     English sentence into an otherwise Spanish screen. The route now sends a
     stable machine `code`; if a code is added there and not mapped here, the
     English leaks back silently. */
  const unlockRouteSrc = read("app/api/unlock/route.ts");
  const routeCodes = [
    ...new Set([...unlockRouteSrc.matchAll(/\bcode:\s*"([a-z_]+)"/g)].map((m) => m[1])),
  ].sort();
  const mapBlock = feed.match(/CHECKOUT_ERROR_KEYS[^{]*\{([\s\S]*?)\n\};/);
  const mapped = mapBlock
    ? Object.fromEntries(
        [...mapBlock[1].matchAll(/(\w+):\s*"([\w.]+)"/g)].map((m) => [m[1], m[2]]),
      )
    : {};
  const unmappedCodes = routeCodes.filter((c) => !mapped[c]);
  const brokenKeys = Object.values(mapped).filter((k) => typeof dicts.en[k] !== "string");
  check(
    routeCodes.length > 0 && unmappedCodes.length === 0 && brokenKeys.length === 0,
    "checkout: a server error code has no translated message",
    "Every `code` returned by app/api/unlock/route.ts must appear in CHECKOUT_ERROR_KEYS in\n" +
      "      components/EpisodeFeed.tsx and resolve to a real translation key, or a failed checkout prints\n" +
      "      an English sentence onto a translated payment screen.\n      " +
      `Unmapped: ${unmappedCodes.join(", ") || "none"}; bad keys: ${brokenKeys.join(", ") || "none"}`,
  );

  /* 10g. BUG THIS CATCHES: the price on the paywall was the string literal
     "$1.99" with no connection to SERIES_UNLOCK_PRICE_CENTS, which lives in a
     server-only module the client cannot import. Nothing would have failed if
     the two diverged — the paywall would simply have advertised one price
     while Stripe charged another. */
  const serverPrice = read("lib/series-purchase.ts").match(
    /SERIES_UNLOCK_PRICE_CENTS\s*=\s*(\d+)/,
  );
  check(
    Boolean(serverPrice) &&
      priceMod.SERIES_UNLOCK_PRICE_CENTS === Number(serverPrice[1]) &&
      priceMod.SERIES_UNLOCK_CURRENCY === "USD" &&
      /currency:\s*"usd"/.test(unlockRouteSrc),
    "paywall: the displayed price no longer matches the price Stripe charges",
    "lib/price.ts is the client-safe mirror of SERIES_UNLOCK_PRICE_CENTS in the server-only\n" +
      "      lib/series-purchase.ts, and the Stripe line item is created in USD. Change one and you must\n" +
      "      change the other, or the paywall advertises an amount the card is not debited.",
  );

  /* 10h. BUG THIS CATCHES: localising a price is one keystroke away from
     localising the CURRENCY. Showing "1,99 €" to a Spanish viewer whose card
     is debited $1.99 is a refund, not a translation. English must also stay
     byte-identical to the literal it replaced — the big honest price is the
     part of this screen testers named as already working. */
  const enPrice = priceMod.formatSeriesUnlockPrice("en");
  const esPrice = priceMod.formatSeriesUnlockPrice("es");
  check(
    enPrice === "$1.99" &&
      /1[.,]99/.test(esPrice) &&
      /\$/.test(esPrice) &&
      priceMod.formatSeriesUnlockPrice("zz-nonsense") === "$1.99",
    "paywall: locale-aware price formatting drifted",
    "English must render exactly $1.99 (unchanged from the literal), every locale must render the\n" +
      "      same 1.99 in USD, and an unusable locale tag must fall back rather than blank the price.\n      " +
      `en=${JSON.stringify(enPrice)} es=${JSON.stringify(esPrice)}`,
  );

  /* 10i. BUG THIS CATCHES: LangProvider started at "en" and hydrated ONLY from
     localStorage, so a first-time visitor sending Accept-Language: es-ES was
     served English — and if they arrived on a shared episode link there was no
     switcher to fix it, because the header is hidden on that route. */
  check(
    i18n.resolveLocale(["es-ES", "en"]) === "es" &&
      i18n.resolveLocale(["es-419"]) === "es" &&
      i18n.resolveLocale(["hi-IN"]) === "hi" &&
      i18n.resolveLocale(["zz"]) === null &&
      /navigator\.languages/.test(read("components/LangProvider.tsx")),
    "i18n: the browser's own language is ignored on a first visit",
    "LangProvider must fall back to navigator.languages when localStorage holds no explicit choice.\n" +
      "      Region subtags resolve to their primary language: es-419 and es-MX are both 'es'.",
  );

  /* 10j. BUG THIS CATCHES: the Bollywood tab ships six live Hindi titles
     behind English title lockups and English loglines, and nothing anywhere in
     the product said the dialogue is in Hindi — not the tile, not the show
     page, not the metadata, and not the stream, whose HLS manifest declares
     LANGUAGE="und". A buyer found out after paying. */
  const langProblems = [];
  const byLang = { en: [], es: [], hi: [] };
  for (const s of catalog.catalog) {
    const l = audioLang.audioLanguageOf(s);
    if (!byLang[l.audio]) {
      langProblems.push(`${s.slug}: unknown audio language ${l.audio}`);
      continue;
    }
    byLang[l.audio].push(s.slug);
    const isBollywood = s.categories.includes("bollywood");
    const isEspanol = s.categories.includes("espanol");
    if (isBollywood && l.audio !== "hi") langProblems.push(`${s.slug}: bollywood but ${l.audio}`);
    if (isEspanol && l.audio !== "es") langProblems.push(`${s.slug}: espanol but ${l.audio}`);
    if (!isBollywood && !isEspanol && l.audio !== "en") {
      langProblems.push(`${s.slug}: no language tab but ${l.audio}`);
    }
    /* Burned-in English subtitles are claimed for the Hindi titles. A
       coming-soon row has zero Mux streams, so it must claim nothing. */
    if (l.burnedInSubtitles && s.status === "coming_soon") {
      langProblems.push(`${s.slug}: coming-soon row claims burned-in subtitles`);
    }
    if (l.audio === "hi" && s.status === "live" && l.burnedInSubtitles !== "en") {
      langProblems.push(`${s.slug}: live Hindi title lost its English subtitle claim`);
    }
  }
  check(
    langProblems.length === 0 && byLang.hi.length === 10 && byLang.es.length === 6,
    "language: a title's declared audio language is wrong or missing",
    "lib/audio-language.ts derives audio from the tab, because lib/catalog.ts is source-fingerprinted\n" +
      "      and cannot carry the field. Ten Bollywood rows are Hindi, six Espanol rows are Spanish, the\n" +
      "      remaining 80 are English.\n      " +
      langProblems.slice(0, 6).join("\n      "),
  );

  /* 10k. BUG THIS CATCHES: a language map nobody renders is not a label. This
     is the check that the derivation actually reaches a viewer — on the show
     page, on the browse tile, and in the JSON-LD that Google and every share
     card read. */
  const showPageSrc = read("app/series/[slug]/page.tsx");
  const schemaSrc = read("lib/seo/schema.ts");
  check(
    /<AudioLanguageBadge/.test(showPageSrc) &&
      /<AudioLanguageBadge/.test(browse) &&
      /inLanguage:\s*inLanguageForSlug\(show\.slug\)/.test(schemaSrc) &&
      (schemaSrc.match(/inLanguage:/g) ?? []).length >= 3,
    "language: the audio language is declared but never shown",
    "audioLanguageOf() must reach the show page, the browse tile, and inLanguage on both the TVSeries\n" +
      "      and TVEpisode/VideoObject schemas. A constant that nothing renders fixes nothing.",
  );

  /* 10l. BUG THIS CATCHES: consolidating an English and a Spanish cut of the
     same footage into one row with a language toggle is how a buyer ends up
     owning the wrong language and asking for their money back. The two cuts
     stay separate catalogue rows with separate slugs, separate key art and
     separate Apple products; labelling the language must not quietly introduce
     a bridge between them. */
  const badgeSrc = read("components/AudioLanguageBadge.tsx");
  check(
    !/href=|<Link|useRouter|onClick/.test(badgeSrc) &&
      catalog.catalog.some((s) => s.slug === "im-having-my-professors-baby-es") &&
      !catalog.catalog.some((s) => s.slug === "im-having-my-professors-baby"),
    "language: the audio label became a language switcher",
    "AudioLanguageBadge is a label, not a control. Language variants stay as separate catalog rows —\n" +
      "      one English, one Spanish — and nothing may link or toggle between them. That decision exists\n" +
      "      to stop buyers getting the wrong language.",
  );

  /* 10m. BUG THIS CATCHES: ContentTranslator injected Google Translate from
     translate.google.com, whose bootstrap loads the real engine from
     translate.googleapis.com — a host that has never been in the CSP. Every
     language change paid for a blocked request, two cookie writes and, in one
     branch, a window.location.reload(). Either the host is in the policy or
     the injection is gone; shipping the injection against a policy that blocks
     it is the state that wasted a page reload on nothing. */
  /* stripComments: the rewritten component explains its own removal by
     quoting the exact URL it used to load. This check looks for the ABSENCE
     of that injection, so it must not read the explanation as the offence. */
  const translator = stripComments(read("components/ContentTranslator.tsx"));
  const csp = read("next.config.ts");
  const injects = /translate\.google\.com\/translate_a/.test(translator);
  const allowed = /translate\.googleapis\.com/.test(csp);
  check(
    !injects || allowed,
    "i18n: the page injects a translate engine the CSP blocks",
    "components/ContentTranslator.tsx loads translate.google.com/translate_a/element.js, which pulls\n" +
      "      its engine from translate.googleapis.com. That host is absent from script-src in\n" +
      "      next.config.ts, so the engine cannot load and the injection is pure cost.",
  );
}

/* ------------------------------------------------------------------ */
/*  12. PLAYABLE PLAYS, UNPLAYABLE EXPLAINS                             */
/* ------------------------------------------------------------------ */

/* The product rule, in one place. Verza is a shorts app: a tap on artwork
   starts the video, with no interstitial and no second tap. Routing artwork
   through the show page first was built, shipped to this branch, and rejected
   by the founder — it turns a shorts app into a website that plays video.

   This is NOT the old Bollywood inversion returning. That bug was that the show
   page was reachable ONLY from titles with nothing to play, so the one surface
   carrying the synopsis, the cast and the price existed for every title except
   the ones you could sell. The show page is now a real destination in its own
   right: the landing page for search traffic, reachable from the player, and
   the honest answer for a row with no video. What changed is that it is no
   longer a toll booth on the way to playback.

   These checks assert the rule holds for real catalogue rows, not that a
   particular string appears somewhere. */
{
  const hrefMod = loadTypeScriptModule("lib/series-href.ts", { "./catalog": catalog });
  const rows = catalog.catalog;
  const live = rows.filter((r) => r.status === "live");
  const soon = rows.filter((r) => r.status === "coming_soon");

  const wrongLive = live.filter((r) => hrefMod.posterHref(r) !== `/series/${r.slug}/1`);
  check(
    live.length > 80 && wrongLive.length === 0,
    "routing: a playable title does not play on a poster tap",
    `Every live row must resolve to its player at episode 1. ${wrongLive.length} of ${live.length} did\n` +
      `      not: ${wrongLive.slice(0, 5).map((r) => r.slug).join(", ")}`,
  );

  const wrongSoon = soon.filter((r) => hrefMod.posterHref(r) !== `/series/${r.slug}`);
  check(
    soon.length > 0 && wrongSoon.length === 0,
    "routing: a title with no video routes into a 404",
    `A coming-soon row has episodeCount 0, so getEpisodesForSeries() returns [], getEpisode() is\n` +
      `      undefined and the episode route calls notFound(). posterHref must fall back to the show page.\n` +
      `      ${wrongSoon.length} of ${soon.length} did not: ${wrongSoon.map((r) => r.slug).join(", ")}`,
  );

  /* The guard has to live in the helper, not in each caller's head. A caller
     that reasons "this one is fine" is how thirteen copies of a string got
     written the first time. */
  check(
    hrefMod.posterHref("a-slug-that-does-not-exist") === "/series/a-slug-that-does-not-exist",
    "routing: an unknown slug is routed into the player",
    "posterHref() must fall back to the show page for a row it cannot find, not build an episode URL\n" +
      "      it cannot vouch for. Stale saved progress and old deep links both arrive this way.",
  );
}

/* ------------------------------------------------------------------ */
/*  13. THE FREE RUN IS STATED BEFORE IT ENDS                           */
/* ------------------------------------------------------------------ */

/* BUG THIS CATCHES: five testers called the paywall at episode six an ambush.
   The ambush was never autoplay — it was that nothing in the player ever said
   how long the free run is. A viewer who can see "Free episode 2 of 5" is not
   ambushed at six. Removing the chip restores the complaint that produced the
   whole sprint, and it would go unnoticed because nothing else fails. */
check(
  /content\.freeEpisodeOf/.test(feedCode),
  "player: the free run is never stated to the viewer",
  "The player must say how many free episodes there are, while the viewer is still inside them. Every\n" +
    "      tester who met the paywall cold described it as an ambush.",
);

check(
  /freeEpisodes > 0 &&\s*freeEpisodes < totalEpisodes/.test(feedCode),
  "player: the free-run chip is shown on a title with no paid run",
  "Five live titles are wholly free. Telling their viewers they are on 'free episode 2 of 50' implies\n" +
    "      a boundary that does not exist and invites them to expect a paywall that never comes.",
);

check(
  /showFreeRunChip =\s*\n?\s*authResolved &&/.test(feedCode) && /!authFree &&/.test(feedCode),
  "player: the free-run chip can appear to someone who owns the series",
  "It is a statement about what is still free. An owner has no free run, and showing it before\n" +
    "      entitlement resolves flashes it at every returning customer on every launch.",
);

/* The count must be the title's own, not the number 5. freeEpisodes is
   per-title data clamped to real Mux inventory: five titles are wholly free and
   two ship clamped below their catalogue literal, so a hard-coded 5 is wrong
   for seven of the ninety-one and wrong in the direction that overpromises. */
check(
  /total: String\(freeEpisodes\)/.test(feedCode),
  "player: the free-episode count is not read from the title",
  "Use the series' own freeEpisodes. A literal 5 misstates the offer on seven live titles.",
);

{
  const i18nMod = loadTypeScriptModule("lib/i18n.ts");
  const dicts = i18nMod.dictionaries;
  const codes = Object.keys(dicts || {});
  const missing = codes.filter((c) => !dicts[c]["content.freeEpisodeOf"]);
  const untokenised = codes.filter(
    (c) =>
      dicts[c]["content.freeEpisodeOf"] &&
      !(/\{n\}/.test(dicts[c]["content.freeEpisodeOf"]) && /\{total\}/.test(dicts[c]["content.freeEpisodeOf"])),
  );
  check(
    codes.length >= 20 && missing.length === 0,
    "i18n: the free-run chip is missing a translation",
    `A missing key renders the raw key id over the video. Missing in: ${missing.join(", ")}`,
  );
  check(
    untokenised.length === 0,
    "i18n: a free-run translation dropped an interpolation token",
    `Both {n} and {total} must survive translation or the chip states a number it was not given.\n` +
      `      Broken in: ${untokenised.join(", ")}`,
  );
}

/* ------------------------------------------------------------------ */
/*  14. AUDIT FIXES                                                     */
/* ------------------------------------------------------------------ */

/* BUG THIS CATCHES: /search?q=a&q=b returned HTTP 500 and a blank page. The
   route typed searchParams as { q?: string } and called q.trim(), but Next
   hands back string[] whenever a parameter repeats, and /search has no
   error.tsx to catch the throw. A repeated parameter is not exotic — a double
   form submit, an edited shared link, or a crawler recombining parameters all
   produce one. */
{
  const searchPage = read("app/search/page.tsx");
  check(
    /q\?: string \| string\[\]/.test(searchPage),
    "search: the query parameter is typed as a bare string",
    "Next gives string[] when a parameter repeats. Typing it as string is what let q.trim() throw and\n" +
      "      return a 500 on a blank page.",
  );
  check(
    /function readQuery\(/.test(searchPage) && !/q\?\.trim\(\)/.test(searchPage),
    "search: the repeated-parameter normaliser is gone",
    "Both the metadata function and the page body must normalise through one helper. A second\n" +
      "      q?.trim() anywhere re-opens the 500.",
  );
}

/* BUG THIS CATCHES: 22 of the 96 show pages printed the same sentence twice, a
   paragraph apart, with the metadata row wedged between them — on the one page
   whose whole job is to describe the show. SERIES_DETAIL.description opens with
   the catalogue logline verbatim for those rows.

   The obvious fix is wrong and was caught by measuring rather than reasoning: an
   equality test suppresses ZERO of the 22, because every one of them is
   "logline + genuinely new text". Dropping the paragraph would delete the only
   new information on the page. The repeat must be stripped, not the paragraph. */
{
  const showPage = read("app/series/[slug]/page.tsx");
  check(
    /dk\.startsWith\(lk\)/.test(showPage),
    "show page: the duplicated synopsis is compared for equality only",
    "All 22 affected rows are prefix duplicates, not exact ones. An equality test reads like a fix and\n" +
      "      suppresses nothing. Strip the repeated opening and keep the remainder.",
  );

  const detail = loadTypeScriptModule("lib/series-detail.ts");
  const collapse = (t) => String(t || "").trim().replace(/\s+/g, " ");
  const key = (t) => collapse(t).replace(/[.\u2026]+$/, "").toLowerCase();
  const rows = catalog.catalog;
  const map = detail.SERIES_DETAIL || detail.default || {};
  let stranded = 0;
  const examples = [];
  for (const r of rows) {
    const d = map[r.slug];
    const desc = collapse(d && d.description);
    const log = collapse(r.logline);
    if (!desc || !log) continue;
    const dk = key(desc), lk = key(log);
    if (dk !== lk && dk.startsWith(lk)) {
      const remainder = collapse(desc.slice(log.length).replace(/^[\s.,;:\u2014-]+/, ""));
      if (!remainder) { stranded++; if (examples.length < 4) examples.push(r.slug); }
    }
  }
  check(
    stranded === 0,
    "show page: stripping the duplicate would leave an empty synopsis",
    `${stranded} row(s) would render an empty paragraph after the repeated logline is removed, which\n` +
      `      means the description carries no information the logline did not: ${examples.join(", ")}.\n` +
      `      Those rows need real copy, not a render-time trim.`,
  );
}

/* BUG THIS CATCHES: /search told every viewer it searches "91+ micro-drama
   series" when exactly 91 are live. The plus sign claims a catalogue that does
   not exist, on the page a viewer uses when they already suspect we do not
   carry what they want. */
{
  const searchPage = read("app/search/page.tsx");
  check(
    !/\}\+ micro-drama/.test(searchPage),
    "search: the catalogue size is overstated",
    "getLiveSeries().length is the WHOLE live catalogue, so the trailing + promises titles beyond it.",
  );
}

if (failures.length > 0) {
  console.error("Feed integrity contract: FAIL");
  for (const f of failures) console.error(`  - ${f}`);
  console.error(`\n  ${failures.length} failing check(s).`);
  process.exit(1);
}

console.log("Feed integrity contract: PASS");

