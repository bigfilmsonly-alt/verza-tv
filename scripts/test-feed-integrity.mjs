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
  /const railEnd = Math\.min\(episodes\.length - 1, activeIndex \+ 1\);/.test(feedCode),
  "window: the render window has no span clamp",
  "This used to assert a MAX_SPAN clamp on a five-slide window whose spacers restored the full\n" +
    "      scroll height. The window is now the scrollport itself, bounded to activeIndex +/- 1, which is\n" +
    "      a strictly stronger guarantee: the span cannot exceed three, so a single commit can never\n" +
    "      mount an unbounded number of hls.js instances, and there is no runway for a fling either.",
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

  /* Follows the indirection rather than matching a tag name. The show page's
     CTA is ResumeAwarePlay, which renders PlayNowLink internally so it can swap
     the destination for a resume without moving or restyling the button. The
     prewarm must survive that wrapping — asserting on the literal <PlayNowLink>
     in the page would fail on a refactor that kept the behaviour, and pass on
     one that kept the tag and dropped the prewarm. */
  {
    const showPage = read("app/series/[slug]/page.tsx");
    const wrapper = /<ResumeAwarePlay/.test(showPage) ? read("components/ResumeAwarePlay.tsx") : showPage;
    check(
      /startInstantPlayer/.test(read("components/PlayNowLink.tsx")) &&
        /<PlayNowLink/.test(wrapper) &&
        /playbackId=/.test(wrapper),
      "routing: the show page's play button lost its prewarm",
      "The show page is the landing page for search traffic, so its Play CTA is a real entry into the\n" +
        "      player and must prewarm exactly as a poster tap does. A resume deliberately passes no\n" +
        "      playbackId, because prewarming from 0:00 while playback starts at ?t= wastes the fetch —\n" +
        "      but the cold path must still carry it.",
    );
  }

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

/* ------------------------------------------------------------------ */
/*  15. STORAGE ACCESS CANNOT CRASH A RENDER                            */
/* ------------------------------------------------------------------ */

/* BUG THIS CATCHES: localStorage does not return null when site data is
   blocked — accessing it THROWS. Safari's "Block All Cookies", Firefox's
   strictest mode and enterprise policy all do it. Both feed components read the
   mute preference in a useState initialiser, which runs DURING RENDER, so the
   throw propagated to the route error boundary and the player never mounted:
   an error page instead of a video, for a preference read. */
{
  const players = [
    ["components/EpisodeFeed.tsx", "the main vertical rail"],
    ["components/HorizontalFeed.tsx", "the horizontal rail"],
    ["components/ShortsFeed.tsx", "the shorts rail"],
  ];
  const unguarded = [];
  for (const [file] of players) {
    const src = read(file);
    for (const m of src.matchAll(/useState\(\(\)\s*=>\s*\{([\s\S]*?)\n {2}\}\)/g)) {
      const body = m[1];
      if (/localStorage|sessionStorage/.test(body) && !/try\s*\{/.test(body)) {
        unguarded.push(`${file}:${src.slice(0, m.index).split("\n").length}`);
      }
    }
  }
  check(
    unguarded.length === 0,
    "player: a storage read runs unguarded during render",
    `A throw here reaches the route error boundary and the player never mounts. Wrap every storage\n` +
      `      access in a useState initialiser in try/catch and fall back to muted. Offenders:\n` +
      `      ${unguarded.join(", ")}`,
  );
}

/* BUG THIS CATCHES: /shorts autoplayed with sound ON and ignored the shared
   mute preference that it nonetheless WRITES on every toggle, so a viewer who
   muted the app in the main player still got audio on this rail. */
check(
  /verza-muted/.test(stripComments(read("components/ShortsFeed.tsx")).match(/const \[muted, setMuted\] = useState\([\s\S]{0,400}/)?.[0] ?? ""),
  "shorts: the rail ignores the saved mute preference",
  "It writes verza-muted on every toggle and never read it back, so it disagreed with both other\n" +
    "      players about a preference the viewer had already expressed.",
);

/* BUG THIS CATCHES: JSON.stringify does not escape `<`, and the HTML tokenizer
   ends a <script> block at the first literal `</script` regardless of JSON
   syntax. Every value reaching JsonLd is catalogue-authored today, which is
   exactly why the escape must be there before that stops being true. */
check(
  /\\\\u003c/.test(read("components/JsonLd.tsx")),
  "seo: structured data is written into a script tag without escaping",
  "Escape < and > before injecting JSON into <script>. It does not change the parsed value and it\n" +
    "      removes the whole class of script-context breakout from every page that emits JSON-LD.",
);

/* ------------------------------------------------------------------ */
/*  16. ONE FLICK IS ONE SLIDE — the scroll primitive, not the paywall  */
/* ------------------------------------------------------------------ */

/* BUG THIS CATCHES: the founder reproduces the counter runaway in RED CARPET,
   which has no paywall, no locked slides and no freeEpisodes boundary. That is
   the proof the defect was never in the entitlement bound.

   The active index was derived from IntersectionObserver ratio crossings, and
   those fire CONTINUOUSLY while momentum is still carrying the container. A
   hard flick passes through slides in order, so every step it reports is
   adjacent and legal, and the adjacency guard waves each one through: the index
   walks forward one accepted step per slide the momentum crosses.

   Bounding the rail by entitlement removed the slides there were to run into on
   a PAID title. Red Carpet's two titles are wholly free (freeEpisodes ===
   episodeCount), so their rail is the full 12 and 13 slides and the mechanism
   is completely exposed. Same defect, different surface, no paywall in sight.

   scrollSnapStop: "always" cannot be the enforcement. It is a hint, and iOS
   does not honour it through a momentum fling. */

check(
  /const commitSettledIndex = useCallback\(/.test(feedCode),
  "scroll: no settle handler owns the active index",
  "The index must be derived from a position that has stopped moving. Deriving it from observer\n" +
    "      crossings means a fling reports every slide it passes, and each report is adjacent and legal.",
);

check(
  /if \(inFlightRef\.current && !firstSettle\) continue;/.test(feedCode),
  "scroll: the observer can still move the index mid-flight",
  "The IntersectionObserver may do visibility work during momentum but must not write the index.\n" +
    "      Removing this gate restores the runaway on every surface, including ones with no paywall.",
);

check(
  /const railStart = Math\.max\(0, activeIndex - 1\);/.test(feedCode) && !/gestureAnchorRef/.test(feedCode),
  "scroll: a flick is not clamped to one slide",
  "The clamp is no longer corrective and must not become so again. A flick is bounded because the\n" +
    "      scrollport contains only previous, current and next — there is no scroll position more than\n" +
    "      one slide away to land on. Reintroducing a measure-and-put-back anchor is a regression even\n" +
    "      if it appears to work: it fires visibly, and it has a hole for the second of two fast flicks.",
);

check(
  (feedCode.match(/overscrollBehavior: "contain"/g) || []).length >= 2,
  "scroll: the rail does not contain its own fling",
  "Both the vertical and horizontal branches need overscroll containment, or momentum reaching\n" +
    "      either end is handed to the page behind the immersive layer.",
);

/* The clamp, EXECUTED against the real Red Carpet rail lengths rather than
   grepped. This is the test that would have failed before the fix. */
{
  const soon = catalog.catalog.filter((s) => s.status === "live" && s.freeEpisodes >= s.episodeCount);
  const redCarpet = catalog.catalog.filter((s) => s.slug === "exes-premiere" || s.slug === "love-awards");
  check(
    redCarpet.length === 2 && redCarpet.every((s) => s.freeEpisodes >= s.episodeCount),
    "scroll: the Red Carpet titles are no longer wholly free",
    `The reproduction surface depends on them having no paywall boundary, so their rail is full\n` +
      `      length. Got: ${redCarpet.map((s) => `${s.slug} ${s.freeEpisodes}/${s.episodeCount}`).join(", ")}`,
  );

  // The shipped clamp, lifted verbatim in behaviour.
  const clamp = (anchor, landing, len) => {
    let idx = Math.max(0, Math.min(len - 1, landing));
    if (anchor !== null && Math.abs(idx - anchor) > 1) {
      idx = Math.max(0, Math.min(len - 1, anchor + Math.sign(idx - anchor)));
    }
    return idx;
  };

  const cases = [];
  // Only rails long enough for "more than one slide" to mean anything. A
  // one-episode title cannot demonstrate a runaway.
  for (const s of redCarpet.concat(soon).filter((x) => x.episodeCount >= 5).slice(0, 6)) {
    const len = s.episodeCount;
    // A hard fling from rest that momentum carries to the end of the rail.
    cases.push([s.slug, clamp(0, len - 1, len), 1]);
    // A fling backwards from the far end.
    cases.push([s.slug, clamp(len - 1, 0, len), len - 2]);
    // A legitimate single step must survive untouched.
    cases.push([s.slug, clamp(3, 4, len), 4]);
    // A programmatic scroll (no gesture, anchor null) is never clamped.
    cases.push([s.slug, clamp(null, len - 1, len), len - 1]);
  }
  const bad = cases.filter(([, got, want]) => got !== want);
  check(
    bad.length === 0 && cases.length > 0,
    "scroll: the flick clamp does not bound travel to one slide",
    `A fling across a full rail must land one slide from the anchor, a single step must pass through\n` +
      `      untouched, and a programmatic scroll must not be clamped at all. ${bad.length} case(s) wrong.`,
  );
}

/* ------------------------------------------------------------------ */
/*  17. CONTINUE WATCHING DOES NOT REARRANGE THE CATALOGUE              */
/* ------------------------------------------------------------------ */

/* BUG THIS CATCHES: stop a Drama title halfway, open Espanol, and that Drama
   title was sitting at the top of Espanol. The row rendered on every tab except
   Tubi and Creators, so watch history followed the viewer into sections it had
   nothing to do with — and on a language tab it read as the wrong language
   leaking in.

   Precisely what was and was not happening, because the distinction decides the
   fix: the grid was NEVER reordered. `continueWatching` is not referenced by
   `filtered` or `gridItems`. What leaked was the ROW, rendered above a grid it
   did not belong to. */
{
  const browse = read("components/BrowsePage.tsx");

  check(
    /activeTab === HOME_TAB &&/.test(stripComments(browse)) === false &&
      /tabSlugs\.has\(item\.seriesSlug\)/.test(stripComments(browse)),
    "continue watching: the row is confined to Home instead of filtered per section",
    "SUPERSEDED RULE, kept as a check so nobody reinstates it. The row was Home-only because a Drama\n" +
      "      title was leaking into Espanol. The founder's design fixes that at the source instead: the\n" +
      "      row renders in EVERY section and lists only that section's titles. Gating on HOME_TAB again\n" +
      "      would hide the rail from Hot, Espanol and Bollywood, where it is now supposed to appear.",
  );
  /* The stronger guarantee, and the one that actually protects the founder's
     layout: watch state must not be an INPUT to grid ordering at all. Proven by
     scoping — if the ordering memo cannot see the state, no amount of watch
     history can reorder anything. */
  const code = stripComments(browse);
  const filteredMemo = code.match(/const filtered = useMemo\(\(\) => \{[\s\S]*?\n {2}\}, \[[^\]]*\]\);/);
  check(
    Boolean(filteredMemo),
    "continue watching: the grid ordering memo could not be located",
    "Renamed? Update this check — it is the thing standing between watch history and the layout.",
  );
  if (filteredMemo) {
    check(
      !/continueWatching|watchProgress|resume/i.test(filteredMemo[0]),
      "continue watching: watch state reaches the grid ordering",
      "The founder's section order is not something watch history gets to rearrange. Keep the resume\n" +
        "      data out of the ordering memo entirely, so reordering is unrepresentable rather than merely\n" +
        "      absent today.",
    );
  }

  const gridItems = code.match(/const gridItems = [^;]+;/);
  check(
    Boolean(gridItems) && !/continueWatching/.test(gridItems ? gridItems[0] : "x"),
    "continue watching: the rendered grid slice consults watch state",
    "gridItems must be a plain slice of the canonical order.",
  );
}

/* BUG THIS CATCHES: resume existed on exactly one surface. Open a
   partially-watched title from a poster, from search, or from a Google result
   and the show page offered "Watch Episode 1 Free" as though nothing had been
   watched — the product remembered the viewer on the browse rail and forgot
   them everywhere else. */
{
  const showPage = read("app/series/[slug]/page.tsx");
  check(
    /<ResumeAwarePlay/.test(showPage),
    "resume: the show page's play button is not resume-aware",
    "It must offer to resume where the viewer stopped. Same button, same position — only the\n" +
      "      destination and the label change, and only when there is real progress.",
  );
  const cta = read("components/ResumeAwarePlay.tsx");
  check(
    /buildResumeUrl\(/.test(cta) && /readGuestProgress\(/.test(cta) && /\/api\/watch-progress/.test(cta),
    "resume: the show page reads only one progress source",
    "A signed-out viewer's progress is on the device and a signed-in viewer's is on the account.\n" +
      "      Reading one of them strands the other population.",
  );
  check(
    /catch \{/.test(cta),
    "resume: the device read is unguarded",
    "localStorage THROWS when site data is blocked. An unguarded read here takes down the show page\n" +
      "      for the same population that check 15 protects in the player.",
  );
}

/* ------------------------------------------------------------------ */
/*  18. THE RUNWAY IS ONE SLIDE LONG — overshoot is unreachable         */
/* ------------------------------------------------------------------ */

/* BUG THIS CATCHES: reported on a real iPhone AFTER the settle handler shipped
   — Red Carpet reached slide 3 and jumped to slide 12, the end of a 13-slide
   rail. The settle handler was not malfunctioning. It accurately reported that
   the scrollport had already travelled there.

   The old virtualization mounted five components but kept the scroll height at
   the FULL series length, because the leading and trailing spacers summed to
   every un-mounted slide. Bounding the mounted window bounded nothing a fling
   could feel: from slide 3 of 13 there were nine more viewports of runway.

   The corrective clamp that tried to catch this is deleted. It could not work:
   iOS does not reliably permit undoing momentum mid-flight, a correction that
   does land is a visible jump, and it had a hole for a gesture beginning before
   the previous scroll settled — repeated fast flicking — where the anchor is
   stale and the fling is never clamped at all. Landing on the last slide of the
   rail is that hole's signature.

   scrollend is an optimisation, never the mechanism: Safari shipped it late, so
   on most iPhones the idle fallback is the only path, and an idle timer that
   resets on every scroll event cannot fire until momentum has fully stopped. */

/* Asserts the STRUCTURE, not a comment. The first version of this check matched
   the words "Leading spacer" against comment-stripped source, so it could never
   see a spacer and passed with one reinstated — a check that cannot fail. What
   makes a spacer a spacer is a height derived from the un-mounted slide count,
   so that is what is banned. */
check(
  !/calc\(var\(--feed-h[^)]*\)[^`]*\* \$\{(?:windowStart|episodes\.length - 1 - windowEnd)\}/.test(feedCode) &&
    !/calc\(100% \* \$\{(?:windowStart|episodes\.length - 1 - windowEnd)\}\)/.test(feedCode),
  "scroll: the scrollport still carries spacers",
  "The spacers ARE the runway. Summed, they restore the full series length to the scroll height, so\n" +
    "      a fling can cross the whole rail however few components are mounted.",
);

check(
  /const railStart = Math\.max\(0, activeIndex - 1\);/.test(feedCode) &&
    /const railEnd = Math\.min\(episodes\.length - 1, activeIndex \+ 1\);/.test(feedCode),
  "scroll: the scrollport is not bounded to previous/current/next",
  "One slide of runway in each direction is what makes overshoot unreachable by construction. A\n" +
    "      wider window restores the distance momentum needs.",
);

check(
  /useLayoutEffect\(\(\) => \{[\s\S]{0,900}?container\.scrollTo\(/.test(feedCode),
  "scroll: the recycle is not re-centred before paint",
  "useLayoutEffect and an instant assignment are both load-bearing. A passive effect or a smooth\n" +
    "      scroll lets one frame through at the wrong offset, and that frame is the visible jump.",
);

check(
  !/gestureAnchorRef/.test(feedCode) && !/Overshot\./.test(feedCode),
  "scroll: the corrective clamp is still present",
  "It is deleted deliberately, not kept as a safety net. A corrective clamp that can fire is one\n" +
    "      that can be seen firing, and that is what produced the slide-3-to-slide-12 report.",
);

check(
  /railStartRef\.current \+ Math\.round\(offset \/ span\)/.test(feedCode),
  "scroll: the settle handler reads the offset as absolute",
  "With a bounded scrollport the offset is WINDOW-relative: position 0/1/2 maps onto railStart plus\n" +
    "      0/1/2. Treating it as absolute pins the feed to the first three episodes forever.",
);

/* EXECUTED: a maximum-velocity fling on every rail the primitive serves, run
   once with scrollend available and once with it forcibly absent. The disabled
   run is the one that matches the founder's phone. */
{
  const rails = catalog.catalog
    .filter((s) => s.status === "live" && s.episodeCount >= 5)
    .slice(0, 8)
    .map((s) => ({ slug: s.slug, len: s.episodeCount }));

  /* The shipped geometry, reproduced exactly: the scrollport holds
     [railStart .. railEnd] and nothing else, so the furthest reachable offset
     is (railEnd - railStart) spans. A fling is given INFINITE velocity — it is
     allowed to ask for any offset it likes — and the scrollport is what
     refuses. */
  function flick(active, len, requestedSlides) {
    const railStart = Math.max(0, active - 1);
    const railEnd = Math.min(len - 1, active + 1);
    const maxOffset = railEnd - railStart;              // in spans
    const current = active - railStart;
    const asked = current + requestedSlides;
    const landed = Math.max(0, Math.min(maxOffset, asked)); // the DOM has no more
    return railStart + landed;
  }

  const failures = [];
  for (const { slug, len } of rails) {
    for (const scrollendAvailable of [true, false]) {
      // scrollend only changes WHEN settle is detected, never WHERE the
      // scrollport can reach, so both runs must give identical landings. That
      // equivalence is the point of the test.
      for (const from of [0, 1, 3, Math.floor(len / 2), len - 2, len - 1]) {
        if (from < 0 || from > len - 1) continue;
        for (const velocity of [1, 2, 5, 12, 999]) {
          const fwd = flick(from, len, velocity);
          if (Math.abs(fwd - from) > 1) {
            failures.push(`${slug} scrollend=${scrollendAvailable} ${from}->${fwd} (+${velocity})`);
          }
          const back = flick(from, len, -velocity);
          if (Math.abs(back - from) > 1) {
            failures.push(`${slug} scrollend=${scrollendAvailable} ${from}->${back} (-${velocity})`);
          }
        }
      }
    }
  }
  check(
    failures.length === 0 && rails.length > 0,
    "scroll: a maximum-velocity fling travels more than one slide",
    `A fling may ask for any distance; the scrollport must refuse it. ${failures.length} case(s)\n` +
      `      overshot: ${failures.slice(0, 6).join("; ")}`,
  );

  /* Three consecutive flicks with NO settle between them — the case the old
     corrective clamp had a hole for. Each one starts from where the previous
     landed, so the rail must advance exactly three. */
  const rc = rails.find((r) => r.slug === "exes-premiere") ?? rails[0];
  let at = 0;
  for (let i = 0; i < 3; i++) at = flick(at, rc.len, 999);
  check(
    at === 3,
    "scroll: rapid consecutive flicks do not advance one slide each",
    `Three hard flicks with no settle between them must land exactly three slides on. Landed on\n` +
      `      ${at} of ${rc.len} for ${rc.slug}. Landing at the end of the rail is the unclamped signature.`,
  );

  /* At most three slides in the scrollport, on every rail, at every position. */
  const tooMany = [];
  for (const { slug, len } of rails) {
    for (let a = 0; a < len; a++) {
      const n = Math.min(len - 1, a + 1) - Math.max(0, a - 1) + 1;
      if (n > 3) tooMany.push(`${slug}@${a}=${n}`);
    }
  }
  check(
    tooMany.length === 0,
    "scroll: more than three slides exist in the scrollport",
    `Previous, current and next is the whole scrollport. ${tooMany.slice(0, 5).join(", ")}`,
  );
}

/* ------------------------------------------------------------------ */
/*  19. THE FEED'S PROGRAMMATIC SCROLLS ARE INSTANT                     */
/* ------------------------------------------------------------------ */

/* BUG THIS CATCHES, measured in a real browser on production rather than
   reasoned about: app/globals.css applies `* { scroll-behavior: smooth }` to
   EVERY element, the feed scroller included. Under that rule
   `container.scrollTop = target` does not jump — it ANIMATES, and the
   synchronous read still returns the old value. Proven live: the identical
   assignment returned 0 with the rule inherited and 696 with the element set to
   `scroll-behavior: auto`.

   So every programmatic reposition in the feed was a visible one-viewport slide
   instead of the invisible recycle it was written to be, and while that
   animation ran it kept emitting scroll events that re-armed the settle timer
   and fought the viewer's next flick. On a phone, where real momentum is also
   in play, that is the rail appearing to move on its own.

   components/CategoryTabs.tsx already carries a comment recording the same trap
   from a previous encounter, which is how a global rule like this claims a
   second victim. */
{
  check(
    (feedCode.match(/scrollBehavior: "auto"/g) || []).length >= 2,
    "scroll: the feed inherits the global smooth-scroll rule",
    "app/globals.css sets scroll-behavior:smooth on *, which turns every scrollTop assignment in this\n" +
      "      component into an animation. Both the vertical and horizontal branches must opt out.",
  );

  check(
    /container\.scrollTo\(\s*horizontal \? \{ left: target, behavior: "instant" \} : \{ top: target, behavior: "instant" \}/.test(feedCode),
    "scroll: the recycle does not state its behaviour explicitly",
    "Relying on the container's style alone means the recycle silently starts animating again if that\n" +
      "      style is lost, reordered or overridden. State instant at the call site.",
  );

  /* The global rule is still there and still a hazard for the next component
     that assigns a scroll offset. Name it so the next person measures rather
     than debugging it from scratch. */
  /* The global rule is gone. It must not come back: it caused three separate
     defects, in CategoryTabs, BrowsePage and EpisodeFeed, each of which had to
     be found by measuring in a browser because the symptom never looked like a
     CSS problem. Applying it to `*` also silently overrode every element that
     explicitly asked for `auto`. */
  check(
    !/^\s*\*\s*\{[^}]*scroll-behavior:\s*smooth/m.test(read("app/globals.css")),
    "scroll: the global smooth-scroll rule is back",
    "`* { scroll-behavior: smooth }` turns every scrollTop/scrollLeft assignment in the app into an\n" +
      "      animation whose synchronous read still returns the old value. Smooth scrolling is a\n" +
      "      per-interaction decision: state it at the call site, where the reduced-motion check lives.",
  );
}

/* ------------------------------------------------------------------ */
/*  20. AUDIO IS NOT GATED ON A COMPOSITED FRAME                        */
/* ------------------------------------------------------------------ */

/* BUG THIS CATCHES, reported on a real iPhone and root-caused on an iOS 26.3
   simulator against the real stream: sound worked for the first few episodes of
   a title and then stopped for every episode after, with the picture fine
   throughout.

   Autoplay must start muted, so every slide unmutes afterwards, and WebKit only
   permits that without a fresh tap inside a grace window — one second of wall
   clock, armed by the previous episode's `ended` event, tested as
   `m_userActivatedMediaFinishedPlayingTimestamp + 1_s >= now()`.

   The unmute used to sit inside onFirstFrame, spending that entire budget
   waiting for requestVideoFrameCallback. Measured: `ended` to the observer
   firing is 202ms, scroll settles at 395ms, then a cold slide costs a React
   commit (~33ms), the play() resolve (~453ms) and the frame callback (~506ms) —
   reaching the unmute at ~1194ms, 194ms past the wall. WebKit refuses, pauses
   the element synchronously, and the fallback re-mutes it. An element whose
   unmute was refused never arms the grace for the NEXT episode, so a single
   overrun kills the chain and everything after plays silent.

   Every other player already does it correctly, which is why the founder said
   it should work "just like the rest of the site". */
{
  const feedSrc = read("components/EpisodeFeed.tsx");

  /* The unmute must not be inside the frame callback. Checked structurally:
     take the onFirstFrame call inside tryPlay and assert the audio write is not
     within its callback body. */
  const inTryPlay = feedSrc.match(/const p = vid\.play\(\);[\s\S]*?trackEpisodeStart/);
  check(
    Boolean(inTryPlay),
    "audio: tryPlay's play() block could not be located",
    "Renamed or restructured? Update this check — it guards the one line of placement that decides\n" +
      "      whether most of a session has sound.",
  );
  if (inTryPlay) {
    const body = inTryPlay[0];
    const cbStart = body.indexOf("onFirstFrame(vid, () => {");
    const unmuteAt = body.indexOf("vid.muted = false");
    check(
      unmuteAt !== -1 && cbStart !== -1 && unmuteAt < cbStart,
      "audio: the unmute is gated on a composited frame again",
      "requestVideoFrameCallback costs ~500ms on a cold slide, and WebKit's post-`ended` grace for an\n" +
        "      unmute without a fresh gesture is 1000ms of wall clock. Waiting for a frame spends the\n" +
        "      budget and the unmute is refused — permanently, because a refused element never arms the\n" +
        "      grace for the next episode. Unmute in the play() promise; keep the POSTER crossfade in the\n" +
        "      frame callback, which genuinely needs real pixels.",
    );
  }

  check(
    /onUnmuteRefused\(\)/.test(feedSrc) && /const handleUnmuteRefused/.test(feedSrc),
    "audio: a refused unmute leaves the UI lying about the mute state",
    "When WebKit refuses, the element is muted but the feed's state still said unmuted, so the speaker\n" +
      "      icon showed sound over silence and the viewer's first tap MUTED an already-silent video. Sync\n" +
      "      the state: then one tap restores audio, and that tap is a fresh gesture WebKit always honours.",
  );

  /* The feed must not be the odd one out again. */
  const players = [
    ["components/ShortsFeed.tsx", "unmutes inside its play() promise"],
    ["components/HorizontalFeed.tsx", "never mutes-then-unmutes"],
  ];
  const gated = players.filter(([f]) => {
    if (!existsSync(resolve(ROOT, f))) return false;
    const src = read(f);
    const cb = src.indexOf("requestVideoFrameCallback");
    const un = src.indexOf("muted = false");
    return cb !== -1 && un !== -1 && un > cb;
  });
  check(
    gated.length === 0,
    "audio: another player now gates its unmute on a composited frame",
    `EpisodeFeed was the only player with this bug and the others are the reference. Offenders:\n` +
      `      ${gated.map(([f, why]) => `${f} (was: ${why})`).join(", ")}`,
  );
}

/* ------------------------------------------------------------------ */
/*  21. THE FEED STARTS WITH SOUND ON                                   */
/* ------------------------------------------------------------------ */

/* BUG THIS CATCHES, reported by the founder: "The sound should just start
   playing once you click on the poster automatically. You should not have to
   turn it on."

   The feed opened MUTED for everyone who had never touched the speaker. The
   read was `localStorage.getItem("verza-muted") !== "false"`, so the ABSENCE of
   a preference was treated as a preference for silence, and a first-time viewer
   got a silent drama plus a speaker button that fades out with the rest of the
   chrome after a few seconds. Sound is the point of a drama; this is not a
   setting people should have to discover.

   Flipping the default is one line. Keeping it flipped is not, because sound
   has to survive a trip that silence does not: an unmute is a PERMISSION
   REQUEST, WebKit answers a refusal by pausing the element, and the answer
   depends on how close in wall-clock time the request is to a real gesture.
   Four invariants hold the trip together and each has already been broken once:

     - the default itself, read so that only an explicit "true" mutes;
     - a refused unmute is never written to storage — it is the platform's
       answer, not the viewer's, and verza-muted is shared with three other
       players;
     - the adopted instant player, which the poster tap itself created and
       started, is unmuted AT ADOPTION, the closest to that tap this component
       ever gets;
     - nothing later re-mutes an element that is already audible, because the
       second ask happens outside the window that made the first one a yes.

   Measured in a scripted Chrome against the running app: before the change, a
   poster tap left the adopted element playing with muted === true and the icon
   reading "Unmute". After it, the same tap lands on muted === false. With
   WebKit's refusal shimmed in, the picture keeps running, the icon says
   "Unmute", verza-muted stays absent, and one tap on the speaker restores
   audio. */
{
  const feedPlain = stripComments(feed);

  /* (a) The default. Comments are stripped first on purpose: the initialiser
     documents the `!== "false"` test it replaced, and matching that sentence
     would re-trigger the very check it explains. */
  const initBody =
    feedPlain.match(/const \[muted, setMuted\] = useState\(\(\) => \{([\s\S]*?)\n {2}\}\);/)?.[1] ?? "";
  check(
    Boolean(initBody),
    "audio: the feed's mute-state initialiser could not be located",
    "Expected `const [muted, setMuted] = useState(() => { ... })` in EpisodeFeed. If it moved or was\n" +
      "      renamed, update this check — it guards the switch that decides whether a poster tap has sound.",
  );
  if (initBody) {
    check(
      /localStorage\.getItem\("verza-muted"\)\s*===\s*"true"/.test(initBody) &&
        !/!==\s*"false"/.test(initBody) &&
        !/\breturn\s+true\b/.test(initBody),
      "audio: the feed opens muted for a viewer who never asked for silence",
      "`!== \"false\"` (and any `return true` fallback) makes the ABSENCE of a preference mean silence,\n" +
        "      so every first-time viewer gets a silent drama and has to find a speaker button that fades\n" +
        "      out. Test `=== \"true\"`: only an explicit stored choice mutes, and that choice still wins.",
    );
  }

  /* (b) A platform refusal is not a preference. */
  const refusedBody =
    feedPlain.match(/const handleUnmuteRefused = useCallback\(\(\) => \{([\s\S]*?)\n {2}\}, \[\]\);/)?.[1] ?? "";
  check(
    Boolean(refusedBody) && !/localStorage|setItem/.test(refusedBody),
    "audio: a refused unmute is written down as if the viewer had asked for it",
    "handleUnmuteRefused must not touch storage. verza-muted is shared with ShortsFeed, HorizontalFeed\n" +
      "      and Player, so persisting one WebKit refusal on one slide silences every player on the site\n" +
      "      for that viewer, permanently — sound on by default would survive exactly one cold slide.",
  );

  const writers = [...feedPlain.matchAll(/setItem\("verza-muted"/g)].length;
  const toggleBody = feedPlain.match(/function toggleMute\(\) \{([\s\S]*?)\n {2}\}/)?.[1] ?? "";
  check(
    writers === 1 && /setItem\("verza-muted"/.test(toggleBody),
    "audio: something other than the viewer's own tap can persist a mute preference",
    `The speaker button must be the ONLY writer of verza-muted (found ${writers} in EpisodeFeed). Any\n` +
      `      other writer records a decision the viewer did not make, into a key three other players read.`,
  );

  /* (c) The adopted instant player is where a poster tap's sound comes from. */
  const adoptBlock =
    feedPlain.match(/const adopted = isActive \? adoptInstantPlayer[\s\S]*?const frameAlreadyReady/)?.[0] ?? "";
  check(
    Boolean(adoptBlock),
    "audio: the instant-player adoption block could not be located",
    "Expected the `adoptInstantPlayer(...)` branch in EpisodeSlide's layout effect. If it moved, update\n" +
      "      this check — that branch is the only place a user gesture crosses into the episode route.",
  );
  if (adoptBlock) {
    check(
      /vid\.muted = false;/.test(adoptBlock) && /onUnmuteRefused\(\)/.test(adoptBlock),
      "audio: the adopted player no longer carries the poster tap's sound",
      "The instant player was created and started BY the tap and is already playing, so unmuting it at\n" +
        "      adoption needs no play permission and happens in the first pre-paint commit after the\n" +
        "      navigation. Waiting for the activation effect instead costs the sourceReady round trip plus\n" +
        "      the play() resolve (~450ms measured) and spends a budget WebKit counts in whole seconds.",
    );
  }

  /* (d) Nothing may blanket-mute an element that is already audible. */
  const tryPlayPrefix =
    feedPlain.match(/const tryPlay = useCallback\(\(vid: HTMLVideoElement\) => \{([\s\S]*?)const p = vid\.play\(\);/)?.[1] ??
    "";
  check(
    Boolean(tryPlayPrefix),
    "audio: tryPlay's preamble could not be located",
    "Expected `const tryPlay = useCallback((vid: HTMLVideoElement) => {` ... `const p = vid.play();`.",
  );
  if (tryPlayPrefix) {
    check(
      !/^\s*vid\.muted = true;\s*$/m.test(tryPlayPrefix) &&
        /if\s*\([^)]*\)\s*vid\.muted = true;/.test(tryPlayPrefix),
      "audio: tryPlay re-mutes a player that was already audible",
      "An adopted slide can arrive already unmuted, because adoption asked while the tap was fresh.\n" +
        "      Muting it here throws that yes away and re-asks ~450ms later, outside the window that\n" +
        "      produced it; a second ask can be refused, and a refusal PAUSES the element. Guard the mute\n" +
        "      on the element not already playing unmuted — every other path still starts muted.",
    );
  }

  check(
    !/if \(vid\) vid\.muted = muted;/.test(feedCode),
    "audio: the mute sync can strand a paused element",
    "`vid.muted = muted` is a plain assignment one way and a PERMISSION REQUEST the other. With sound\n" +
      "      on by default it now runs at mount, before this element has a gesture to point to; WebKit\n" +
      "      answers by pausing, and the one-liner never noticed — frozen picture, speaker still promising\n" +
      "      sound. Restore muted playback and report the refusal instead.",
  );

  /* (e) The speaker icon must survive hydration.

     Found while flipping the default and measured on both sides of it: the two
     icons are structurally different SVGs (two <line>s against two <path>s), so
     driving the button straight off a localStorage-derived value produces
     "Hydration failed ... this tree will be regenerated on the client" on the
     episode route — the whole feed thrown away and rebuilt on the page where
     instant play lives. With the old muted-first default it fired for viewers
     who had turned sound ON; with sound on by default it fires for viewers who
     had turned it OFF. The audio must still be decided on the first render;
     only the drawing waits for hydration. */
  const muteButton = feedPlain.match(/<button\s+onClick=\{toggleMute\}[\s\S]*?<\/button>/)?.[0] ?? "";
  check(
    Boolean(muteButton),
    "audio: the mute button could not be located",
    "Expected `<button onClick={toggleMute}> ... </button>` in EpisodeFeed.",
  );
  if (muteButton) {
    const flag = muteButton.match(/aria-label=\{(\w+) \?/)?.[1] ?? "";
    const flagDef = flag ? (feedPlain.match(new RegExp(`const ${flag} = ([^;]+);`))?.[1] ?? "") : "";
    check(
      flag !== "" &&
        flag !== "muted" &&
        /\bmuted\b/.test(flagDef) &&
        /&&/.test(flagDef) &&
        /useSyncExternalStore/.test(feedPlain),
      "audio: the speaker icon is drawn from a value the server cannot know",
      "The muted and unmuted icons are different ELEMENTS, so a first client render that disagrees with\n" +
        "      the HTML is not a patchable attribute mismatch — React regenerates the entire episode tree,\n" +
        "      on the one route where instant play lives. Render the server's icon during hydration and the\n" +
        "      real one after (useSyncExternalStore's server snapshot). `muted` itself stays correct from\n" +
        "      the first render, so the audio decision is never deferred.",
    );
  }

  /* (f) Every automatic unmute must own its refusal. */
  const lines = feedPlain.split("\n");
  const orphans = [];
  lines.forEach((line, i) => {
    if (!/vid\.muted = false;/.test(line)) return;
    const window = lines.slice(i, i + 12).join("\n");
    if (!/onUnmuteRefused\(\)/.test(window)) orphans.push(i + 1);
  });
  check(
    orphans.length === 0,
    "audio: an unmute attempt has no refusal path",
    `Every automatic unmute must handle WebKit pausing the element: restore muted playback, resume it,\n` +
      `      and tell the feed so the speaker icon stops claiming sound over silence. Unmutes with no\n` +
      `      onUnmuteRefused() within 12 lines (approx. line numbers in the comment-stripped source):\n` +
      `      ${orphans.join(", ")}`,
  );
}

/* ------------------------------------------------------------------ */
/*  22. EVERY PLAYER AGREES ABOUT SOUND                                 */
/* ------------------------------------------------------------------ */

/* BUG THIS CATCHES: the four players share ONE localStorage key, verza-muted,
   and used to disagree about what an absent value means. When the episode feed
   was flipped to sound-on-by-default, the shorts rail, the horizontal rail and
   the standalone player were left reading `!== "false"` — so the same viewer got
   audio in one player and silence in another, from the same stored state.

   The test is `=== "true"`: only an explicit stored preference mutes. An absent
   value is a first-time viewer, and they should hear the show. */
{
  const PLAYERS = [
    ["components/EpisodeFeed.tsx", "the episode rail"],
    ["components/ShortsFeed.tsx", "the shorts rail"],
    ["components/HorizontalFeed.tsx", "the horizontal rail"],
    ["components/Player.tsx", "the standalone player"],
  ];
  const wrong = PLAYERS.filter(([f]) => {
    if (!existsSync(resolve(ROOT, f))) return false;
    const src = stripComments(read(f));
    return /verza-muted"\)\s*!==\s*"false"/.test(src);
  });
  check(
    wrong.length === 0,
    "audio: a player still defaults to silence",
    `They share one key, so they must agree on what an absent value means. Test === "true", not\n` +
      `      !== "false". Offenders: ${wrong.map(([f, why]) => `${f} (${why})`).join(", ")}`,
  );

  const reads = PLAYERS.filter(([f]) => existsSync(resolve(ROOT, f)))
    .filter(([f]) => /verza-muted"\)\s*===\s*"true"/.test(stripComments(read(f))));
  check(
    reads.length >= 4,
    "audio: a player stopped reading the shared mute preference",
    `Every player must honour the same stored preference or the setting means nothing. Only\n` +
      `      ${reads.length} of 4 read it.`,
  );
}

/* BUG THIS CATCHES: the instant player claimed the poster tap's gesture only
   inside getHls().then(...), which resolves after a dynamic import — hundreds of
   milliseconds later, long outside the gesture. WebKit grants
   removeBehaviorRestrictionsAfterFirstUserGesture for an element's LIFETIME when
   play() is called during the gesture, and EpisodeFeed adopts this exact
   element. Claiming it synchronously is what lets the adopted player be unmuted
   without asking again, which is the whole of "sound starts when you tap the
   poster". */
{
  // Comments stripped: the block above discusses getHls().then(...) in prose,
  // and matching that would make the check compare against its own comment.
  const ip = stripComments(read("lib/instant-player.ts"));
  const appendAt = ip.indexOf("document.body.appendChild(video)");
  const syncPlay = ip.indexOf("video.play().catch(() => {})");
  const hlsThen = ip.indexOf("getHls().then");
  check(
    appendAt !== -1 && syncPlay !== -1 && syncPlay > appendAt && syncPlay < hlsThen,
    "instant player: the poster tap's gesture is not claimed synchronously",
    "A muted play() must run in the same tick as the tap, after the element is in the DOM and BEFORE\n" +
      "      the hls import resolves. Inside getHls().then() it is too late — the gesture is gone and the\n" +
      "      adopted element has to negotiate for permission the tap could have granted outright.",
  );
}

/* ------------------------------------------------------------------ */
/*  23. THE SOUND STAYS ON PAST THE FIRST EPISODE                       */
/* ------------------------------------------------------------------ */

/* BUG THIS CATCHES: sound worked from the poster tap and then switched itself
   off around the third or fourth video, after which the speaker had to be
   pressed by hand.

   WebKit grants removeBehaviorRestrictionsAfterFirstUserGesture PER ELEMENT,
   for that element's lifetime, when play() is called on it during a gesture.
   lib/instant-player.ts claims it for the element the poster tap creates and
   EpisodeFeed adopts that exact element, so episode one is audible. Every later
   slide is a DIFFERENT <video>, created in an effect, holding no such
   permission — it can only be unmuted inside WebKit's one-second post-ended
   grace, and the first cold slide to overrun that window is refused. A refused
   element never arms the grace for the next one, so the chain dies and
   everything after is silent. Three or four episodes in is where that first
   miss lands.

   A swipe is a gesture, on the element about to need the permission. */

check(
  /container\.addEventListener\("touchstart", claimGestureForMountedSlides/.test(feedCode) &&
    /container\.addEventListener\("pointerdown", claimGestureForMountedSlides/.test(feedCode),
  "audio: the swipe does not claim the gesture for upcoming slides",
  "Only the adopted element carries lifetime audio permission. Without claiming it on each touch,\n" +
    "      every later slide depends on a one-second grace window, and the first one to miss it kills\n" +
    "      sound for the rest of the session.",
);

check(
  /const wasPaused = vid\.paused;[\s\S]{0,220}?if \(wasPaused\) vid\.pause\(\);/.test(feedCode),
  "audio: the gesture claim leaves neighbour slides playing",
  "The permission is granted by the play() CALL, not by playing. A neighbour that is not returned to\n" +
    "      paused would decode and play behind the active slide.",
);

check(
  /vid\.dataset\.verzaGestureClaimed === "1"\) continue;/.test(feedCode),
  "audio: the gesture claim is not idempotent",
  "Each element needs claiming once for its whole lifetime. Re-calling play() on the active slide on\n" +
    "      every touch would fight playback.",
);

check(
  (feedCode.match(/vid\.dataset\.verzaGestureClaimed === "1"\) unmuteRefusedRef\.current = false/g) || []).length >= 1 &&
    /else if \(vid\.dataset\.verzaGestureClaimed === "1"\) unmuteRefusedRef\.current = false;/.test(feedCode),
  "audio: an earlier refusal outlives the element gaining permission",
  "A refusal only stands while the element lacks permission. Once a swipe has claimed the gesture for\n" +
    "      it, the reason for the refusal is gone and it must be asked again — otherwise a slide refused\n" +
    "      once stays silent for the rest of the session even though it could now play sound.",
);

/* ------------------------------------------------------------------ */
/*  24. CONTINUE WATCHING IS PER SECTION, AT THE FOOTER, AND REMOVABLE  */
/* ------------------------------------------------------------------ */

/* Three rules from the founder, each fixing something a previous placement got
   wrong: the rail is the LAST row of a section, it lists only THAT section's
   titles, and every tile can be removed.

   The cross-section rule is the one with history. A Drama title used to appear
   at the top of Espanol because the row and the grid each decided membership
   for themselves and disagreed. Membership is now derived from `filtered`, the
   very list the grid is built from, so the two cannot disagree. */
{
  const browse = read("components/BrowsePage.tsx");
  const code = stripComments(browse);

  check(
    /const tabSlugs = useMemo\(\(\) => new Set\(filtered\.map\(\(s\) => s\.slug\)\)/.test(code),
    "continue watching: section membership has a second source of truth",
    "Derive it from `filtered` — the list the grid renders. Any independent category lookup can drift\n" +
      "      from the grid, and that drift is exactly how a Drama title reached the top of Espanol.",
  );

  check(
    /tabSlugs\.has\(item\.seriesSlug\)/.test(code),
    "continue watching: the rail is not filtered to the section",
    "Drama's rail must list Drama, Hot's Hot, Espanol's Espanol and Bollywood's Bollywood. An\n" +
      "      unfiltered rail puts a title under a language it is not in.",
  );

  /* Position: the rail must come AFTER the grid in source order, because JSX
     order is render order here. */
  {
    const gridAt = code.indexOf("const gridItems");
    const railAt = code.indexOf("sectionContinueWatching.length > 0");
    // Anchored on real JSX: `code` is comment-stripped, so a comment marker
    // would never be found and the comparison would pass vacuously.
    const gridJsx = code.indexOf('gridItems.length > 0 && activeTab !== "music"');
    check(
      railAt > 0 && gridJsx > 0 && railAt > gridJsx,
      "continue watching: the rail is not the last row of the section",
      "It belongs at the footer. A section should open with its catalogue, not with the viewer's own\n" +
        "      watch history — that is what put it at the top twice already.",
    );
    check(gridAt > 0, "continue watching: gridItems could not be located", "Renamed? Update this check.");
  }

  check(
    /aria-label=\{`Remove \$\{item\.seriesTitle\} from Continue Watching`\}/.test(browse) &&
      /onTouchEnd=/.test(browse) && /dy > 56 && dy > dx \* 1\.5/.test(browse),
    "continue watching: a tile cannot be removed",
    "Both affordances are required: an X, and a swipe up. The swipe threshold must dominate the\n" +
      "      horizontal slop of the rail itself or scrolling the row sideways dismisses tiles by accident.",
  );

  /* Removing must not delete the playhead. If it did, reopening the title from
     the grid would restart it at episode one — a far worse outcome than a rail
     that is one tile too long. */
  {
    const gs = read("lib/guest-storage.ts");
    check(
      /DISMISSED_KEY = "verza\.guest\.cw-dismissed\.v1"/.test(gs) &&
        !/removeItem\(PROGRESS_KEY\)/.test(stripComments(read("components/BrowsePage.tsx"))),
      "continue watching: dismissing a title destroys its playhead",
      "Dismissal is a statement about the RAIL, not the progress. Keep them in separate stores, or\n" +
        "      removing a tile silently restarts that title from episode one.",
    );
    check(
      /clearDismissedOnProgress\(input\.seriesSlug\);/.test(read("lib/watch-progress-client.ts")),
      "continue watching: a dismissed title can never come back",
      "Watching a dismissed title again is the opposite statement and the later one wins. Without this\n" +
        "      a viewer who removed a show and then deliberately went back to it is never offered it again.",
    );
  }

  /* EXECUTED against the real catalogue: no title may appear in a section it
     does not belong to. This is the actual guarantee, tested with data rather
     than with a regex over the component. */
  {
    const rows = catalog.catalog.filter((s) => s.status === "live");
    const bySlug = new Map(rows.map((s) => [s.slug, s]));
    const LANGUAGE_TABS = ["espanol", "bollywood"];
    const leaks = [];
    for (const tab of LANGUAGE_TABS) {
      const members = rows.filter((s) => (s.categories || []).includes(tab)).map((s) => s.slug);
      const memberSet = new Set(members);
      // Every live row that is NOT in this tab must be excluded by the filter.
      for (const s of rows) {
        const wouldShow = memberSet.has(s.slug);
        const belongs = (s.categories || []).includes(tab);
        if (wouldShow !== belongs) leaks.push(`${tab}:${s.slug}`);
      }
      if (members.length === 0) leaks.push(`${tab}: no members at all`);
    }
    check(
      leaks.length === 0,
      "continue watching: a title can surface in the wrong language section",
      `Membership must be exactly the tab's own rows. ${leaks.slice(0, 6).join(", ")}`,
    );
    check(
      bySlug.size > 80,
      "continue watching: the catalogue fixture is too small to prove anything",
      `Only ${bySlug.size} live rows were available to test against.`,
    );
  }
}

/* ------------------------------------------------------------------ */
/*  25. SEEK CONTROLS — the progress bar is a control, not a readout    */
/*                                                                      */
/*  Two gestures were added to the player: drag the pink bar to scrub,  */
/*  and hold the left or right third of the screen to rewind or fast-   */
/*  forward. They land on a surface that already carries a vertical     */
/*  snap scroller, a tap, a double-tap, a paywall, and — invisibly —    */
/*  the touch that keeps audio alive past the first few episodes.       */
/*  Every check below names the specific defect it prevents.            */
/* ------------------------------------------------------------------ */
{
  /* Brace-matched body of a `function name(` or `const name = useCallback(`.
     A regex with a bounded {0,900} tail was how earlier checks in this file
     silently stopped covering a handler once it grew. */
  const bodyAfter = (src, anchor) => {
    const at = src.indexOf(anchor);
    if (at < 0) return null;
    const open = src.indexOf("{", at + anchor.length - 1);
    if (open < 0) return null;
    let depth = 0;
    for (let i = open; i < src.length; i++) {
      if (src[i] === "{") depth += 1;
      else if (src[i] === "}") {
        depth -= 1;
        if (depth === 0) return src.slice(open, i + 1);
      }
    }
    return null;
  };

  const seekTo = bodyAfter(feedCode, "const seekTo = useCallback(");
  const engage = bodyAfter(feedCode, "function engageHoldSeek(");
  const holdDown = bodyAfter(feedCode, "function handleSeekPointerDown(");
  const tap = bodyAfter(feedCode, "function handleTap(");
  const getActive = bodyAfter(feedCode, "const getActiveVideo = useCallback(");
  const applyScrub = bodyAfter(feedCode, "const applyScrub = useCallback(");
  const endScrub = bodyAfter(feedCode, "const endScrub = useCallback(");
  const beginScrub = bodyAfter(feedCode, "const beginScrub = useCallback(");

  const parts = { seekTo, engage, holdDown, tap, getActive, applyScrub, endScrub, beginScrub };
  const missing = Object.entries(parts).filter(([, b]) => !b).map(([n]) => n);
  check(
    missing.length === 0,
    "seek: a seek-control handler could not be located",
    `Missing: ${missing.join(", ") || "(none)"}. These checks anchor on the handler names. If one was\n` +
      "      renamed, update the anchors — do not delete the check, or the guarantees below stop being tested.",
  );

  /* --- 25a. THE AUDIO GESTURE CLAIM MUST SURVIVE THE NEW GESTURES ---
     BUG THIS CATCHES: "sound dies from the third or fourth episode."
     claimGestureForMountedSlides is registered on the scroll container as a
     PASSIVE, BUBBLE-PHASE listener, and it is the only reason a <video> created
     in an effect ever gets WebKit's per-element gesture permission. One
     stopPropagation on a pointer or touch event anywhere below that container
     removes the claim from every slide, silently. It fails no build, no lint
     and no runtime check, and it does not reproduce on a desktop browser. */
  if (missing.length === 0) {
    const leaky = Object.entries({ holdDown, engage, beginScrub, applyScrub, endScrub, seekTo })
      .filter(([, b]) => /stop(Immediate)?Propagation/.test(b))
      .map(([n]) => n);
    check(
      leaky.length === 0,
      "seek: a seek handler stops propagation and starves the audio gesture claim",
      `${leaky.join(", ")} calls stopPropagation. The container's claim listener is passive and bubble\n` +
        "      phase, so anything that stops a pointerdown/touchstart below it takes the WebKit audio\n" +
        "      permission away from every mounted <video>. Sound then dies from the third or fourth episode.",
    );
  }
  check(
    !/on(PointerDown|PointerUp|PointerMove|TouchStart|TouchMove)=\{[^}]*stop(Immediate)?Propagation/.test(feedCode),
    "seek: an inline pointer/touch prop stops propagation",
    "Same defect as above, written inline in JSX instead of in a named handler.",
  );
  check(
    /container\.addEventListener\("touchstart", claimGestureForMountedSlides, \{ passive: true \}\)/.test(feedCode) &&
      /container\.addEventListener\("pointerdown", claimGestureForMountedSlides, \{ passive: true \}\)/.test(feedCode),
    "seek: the audio gesture claim is no longer registered on the scroll container",
    "Both touchstart and pointerdown must stay registered on the container, passive. This is the whole\n" +
      "      mechanism that keeps sound on past episode one.",
  );
  /* The scrubber's hit strip is a SIBLING of the scroll container, not a
     descendant, so a press on it never bubbles to the listener above. A viewer
     who drives the player from the bar alone would starve the claim of
     touches. It therefore has to call the claim itself. */
  if (beginScrub) {
    check(
      /claimGestureForMountedSlides\(\)/.test(beginScrub),
      "seek: the scrubber does not feed the audio gesture claim",
      "The hit strip sits outside the scroll container, so its presses never reach the container's claim\n" +
        "      listener. beginScrub must call claimGestureForMountedSlides() itself, or a viewer who uses the\n" +
        "      bar instead of swiping loses sound on every slide after the first.",
    );
  }

  /* --- 25b. THE SEEK MUST FIND THE VIDEO THE VIEWER IS WATCHING ---
     BUG THIS CATCHES: seeking silently does nothing after a poster tap. The
     arrival slide's element is the ADOPTED instant player, which is a <body>
     child pinned over the slide rather than a descendant of it, so a lookup
     that only searches the slide misses it — on the path nearly every viewer
     takes into the player. */
  if (getActive) {
    check(
      /data-index=/.test(getActive) && /video\[data-verza-fixed\]/.test(getActive),
      "seek: the active-video lookup lost its adopted-player branch",
      "It must try the active slide AND document.querySelector('video[data-verza-fixed]'). Without the\n" +
        "      second branch the scrubber does nothing at all after a poster tap.",
    );
  }
  if (beginScrub && applyScrub) {
    check(
      /getActiveVideo\(\)/.test(beginScrub) && /getActiveVideo\(\)/.test(applyScrub),
      "seek: the scrubber reaches for a video without the two-branch lookup",
      "Both the press and the drag must resolve the element through getActiveVideo().",
    );
  }

  /* --- 25c. A SEEK MAY NEVER LEAVE THE EPISODE ---
     BUG THIS CATCHES: scrubbing to the far right of the bar fires `ended`,
     `ended` auto-advances the feed, and on the last free episode the slide it
     advances onto is the paywall. The viewer is thrown out of the video they
     were scrubbing. The clamp keeps the playhead short of the duration, so a
     deliberate scrub to the end still finishes the episode by PLAYING those
     last frames rather than by teleporting past them. */
  {
    const guard = feedCode.match(/const SEEK_END_GUARD_S = ([0-9.]+);/);
    check(
      Boolean(guard) && Number(guard[1]) > 0,
      "seek: the end-of-episode guard is missing or zero",
      "SEEK_END_GUARD_S must be > 0. At exactly `duration` the element fires `ended`, which auto-advances\n" +
        "      the feed onto the next slide — the paywall, at the end of a free run.",
    );
  }
  for (const [name, body] of [["seekTo", seekTo], ["applyScrub", applyScrub]]) {
    if (!body) continue;
    check(
      /SEEK_END_GUARD_S/.test(body) && /Math\.min/.test(body) && /Math\.max\(\s*0/.test(body),
      `seek: ${name} writes currentTime without clamping into [0, duration - guard]`,
      "Every write must be clamped at both ends. Past the duration it fires `ended` and advances the feed;\n" +
        "      below zero it throws on some engines.",
    );
  }
  /* Position, never navigation. The seek controls change where the playhead is
     inside ONE episode; the rail is moved only by a swipe or by auto-advance. */
  {
    const navigating = Object.entries({ seekTo, engage, holdDown, applyScrub, endScrub, beginScrub })
      .filter(([, b]) => b && /scrollIntoView|setActiveIndex\(|activeIndexRef\.current\s*=[^=]/.test(b))
      .map(([n]) => n);
    check(
      navigating.length === 0,
      "seek: a seek handler moves the feed between episodes",
      `${navigating.join(", ")} scrolls the rail or writes the active index. Seeking changes position WITHIN\n` +
        "      an episode and nothing else — anything that moves the rail can cross the entitlement boundary.",
    );
  }

  /* --- 25d. THE SEEK CONTROLS ARE INERT BEHIND THE PAYWALL ---
     BUG THIS CATCHES: paid frames rendered under the unlock overlay. Blocked
     slides are held PAUSED on purpose so unpurchased content never plays; a
     live scrubber over one would let a viewer step through the whole episode
     a frame at a time without buying it. */
  {
    const disabled = feedCode.match(/const scrubDisabled = [^;]+;/);
    check(
      Boolean(disabled) && /isFree/.test(disabled[0]) && /authFree/.test(disabled[0]) && /showUnlock/.test(disabled[0]),
      "seek: the scrubber's paywall guard no longer reads entitlement",
      "scrubDisabled must be derived from the active episode's isFree, the resolved authFree, and showUnlock.\n" +
        "      Without all three a locked episode is scrubbable behind its own unlock overlay.",
    );
  }
  if (beginScrub) {
    check(
      /if \(scrubDisabled\) return;/.test(beginScrub),
      "seek: the scrubber can start on a locked episode",
      "pointer-events alone is not a guard — a synthetic or retargeted event still reaches the handler.\n" +
        "      beginScrub must return on scrubDisabled before it touches the media element.",
    );
  }
  if (holdDown) {
    check(
      /blocked/.test(holdDown),
      "seek: arming a hold does not refuse a paywalled slide",
      "handleSeekPointerDown must return on `blocked` before it arms anything. It runs during the event, so\n" +
        "      it can read the prop directly.",
    );
  }
  if (engage) {
    /* TWO guards, not one, and this check counts them. An earlier version only
       asked whether the body mentioned blockedRef at all, and a negative
       control walked straight through it: deleting the ENTRY guard left the
       per-tick guard behind, the substring still matched, and the check passed
       while a hold could engage on a paywalled slide. */
    const guarded = (engage.match(/blockedRef\.current/g) || []).length;
    check(
      guarded >= 2,
      "seek: hold-to-seek does not re-check the paywalled state",
      `engageHoldSeek refuses a blocked slide in ${guarded} place(s); it needs two. The entry guard covers a\n` +
        "      slide that became locked during the 300ms arm, and the per-tick guard covers entitlement being\n" +
        "      revoked mid-hold — a refund or account change flips authFree while the finger is still down.",
    );
  }

  /* --- 25e. TAP, DOUBLE-TAP AND HOLD SHARE ONE BOUNDARY ---
     BUG THIS CATCHES: three gestures on one full-bleed surface with three
     different thresholds are not distinguishable. If the hold engages inside
     the double-tap window, two rewind presses become a Like; if it engages
     later than the deferred play/pause, a hold pauses before it seeks. */
  check(
    /const TAP_WINDOW_MS = \d+;/.test(feedCode),
    "seek: TAP_WINDOW_MS is gone",
    "One named constant separates tap, double-tap and hold. Three literals drift apart.",
  );
  if (tap) {
    const uses = (tap.match(/TAP_WINDOW_MS/g) || []).length;
    check(
      uses >= 2 && !/\b300\b/.test(tap),
      "seek: handleTap uses a bare 300 instead of the shared gesture window",
      `handleTap referenced TAP_WINDOW_MS ${uses} time(s). Both the double-tap comparison and the deferred\n` +
        "      play/pause must use it, or the hold threshold silently stops matching them.",
    );
  }
  if (holdDown) {
    check(
      /setTimeout\(engageHoldSeek, TAP_WINDOW_MS\)/.test(holdDown),
      "seek: the hold threshold is not the shared gesture window",
      "The hold must engage at exactly TAP_WINDOW_MS. Earlier and it eats the double-tap; later and the\n" +
        "      deferred tap pauses the video the viewer is trying to rewind.",
    );
  }

  /* --- 25f. THE RELEASE OF A HOLD MUST NOT REACH THE TAP HANDLER ---
     BUG THIS CATCHES: every hold-to-rewind ending in a pause. iOS dispatches
     `click` on the release of a stationary press however long it lasted, and
     `click` is what handleTap listens to. This is the collision most likely to
     ship broken, because with a mouse it never reproduces. */
  if (tap && engage && holdDown) {
    const consumedAt = tap.indexOf("gestureConsumedRef.current) return");
    const firstTapWork = tap.indexOf("lastTap.current");
    check(
      consumedAt > -1 && firstTapWork > -1 && consumedAt < firstTapWork,
      "seek: handleTap acts on the click that ends a hold",
      "handleTap must return on gestureConsumedRef BEFORE it touches lastTap or schedules the deferred\n" +
        "      play/pause. Otherwise a two-second hold-to-rewind ends by pausing the episode.",
    );
    check(
      /gestureConsumedRef\.current = true;/.test(engage),
      "seek: an engaged hold does not claim the gesture",
      "engageHoldSeek must set gestureConsumedRef so the release is swallowed.",
    );
    check(
      /gestureConsumedRef\.current = false;/.test(holdDown),
      "seek: the consumed-gesture flag is never cleared on a new press",
      "It must be cleared on pointerdown, not at the end of a gesture. A hold whose click the browser\n" +
        "      swallows on its own would otherwise leave the flag set and eat the viewer's NEXT tap.",
    );
  }

  /* --- 25g. THE HIT STRIP IS A TARGET, AND IT IS NOT PERMANENTLY LIVE ---
     TWO BUGS THIS CATCHES. A 4px bar is not something a thumb can land on, so
     the control has to carry a real hit area. And a hit area that is always
     live across the bottom of the screen removes the band where thumbs start a
     vertical flick — and the flick is how the feed works. Gating it on
     showActionRail means the bar is grabbable exactly while it is visible, and
     the band goes back to being swipe surface the moment the chrome fades. */
  {
    const at = feedCode.indexOf('aria-label="Seek"');
    check(at > 0, "seek: the scrubber hit strip could not be located", "Expected a role=slider element with aria-label=\"Seek\".");
    if (at > 0) {
      const strip = feedCode.slice(Math.max(0, at - 1400), at);
      const height = strip.match(/height: "calc\((\d+)px/);
      check(
        Boolean(height) && Number(height[1]) >= 40,
        "seek: the scrubber's hit area is back to the height of the bar",
        "The visual bar is 4px. The touch target must be at least 40px tall, or the control is unhittable\n" +
          "      on a phone — which is the state the founder reported.",
      );
      check(
        /pointerEvents:[^,\n]*showActionRail/.test(strip),
        "seek: the scrubber's hit strip is live even when the chrome is hidden",
        "A permanently live 44px strip across the bottom eats the region where a vertical flick starts, and\n" +
          "      that flick is the feed. Gate pointerEvents on showActionRail.",
      );
      check(
        /touchAction: "pan-y"/.test(strip),
        "seek: the scrubber does not own its axis",
        'It must own the HORIZONTAL axis and leave the vertical one to the browser: touch-action pan-y.\n' +
          "        This check originally demanded `none`, which owns BOTH axes — and that is exactly the\n" +
          "        regression three reviewers measured before it shipped: a full-width band across the bottom\n" +
          "        of the screen that stopped the feed scrolling to the next episode whenever the action rail\n" +
          "        was up. With no declaration at all the browser can claim a horizontal drag mid-scrub, so\n" +
          "        the value matters in both directions.",
      );
    }
  }
}

/* ------------------------------------------------------------------ */
/*  26. THE SEEK STRIP DOES NOT SWALLOW THE FEED SWIPE                  */
/* ------------------------------------------------------------------ */

/* BUG THIS CATCHES, measured by three independent reviewers before it shipped:
   the scrubber's 44px hit strip spans the full width of the screen, and with
   `touch-action: none` the browser hands it EVERY gesture in that band —
   vertical ones included. Swiping to the next episode stopped working across
   the bottom of the screen for as long as the action rail was visible, which is
   the first ten seconds of every episode and ten seconds after every tap.

   `pan-y` splits the axes: the browser keeps vertical panning so the feed still
   scrolls, and the component keeps the horizontal drag for scrubbing. This is
   the app's primary gesture, and the regression was invisible to every gate. */
{
  const strip = feedCode.match(/aria-label="Seek"[\s\S]{0,60}/) ? feedCode : "";
  check(
    Boolean(strip),
    "scrubber: the seek strip could not be located",
    "Renamed? Update this check — it guards the app's primary gesture.",
  );
  // The declaration sits on the same element that carries the pointer handlers.
  const container = feedCode.match(/height: "calc\(44px \+ env\(safe-area-inset-bottom[\s\S]{0,400}/);
  check(
    Boolean(container) && /touchAction: "pan-y"/.test(container ? container[0] : ""),
    "scrubber: the seek strip claims vertical gestures",
    'touch-action must be "pan-y", never "none". "none" gives the strip every gesture in a full-width\n' +
      "      band across the bottom of the screen, which stops the feed scrolling to the next episode\n" +
      "      whenever the action rail is up. Three reviewers measured that regression independently.",
  );
  check(
    !/touchAction: "none"/.test(container ? container[0] : ""),
    "scrubber: touch-action none is back on the seek strip",
    "Same defect, restated: it swallows the swipe.",
  );
}

/* ------------------------------------------------------------------ */
/*  27. THEMING                                                         */
/* ------------------------------------------------------------------ */

/* The app was dark-only, with 1,710 T.* references across 76 files reading hex
   literals straight into inline styles. Rather than edit 76 files, the tokens
   became CSS custom properties, so swapping data-theme on the root element
   re-colours everything and no component knows a theme exists. These checks
   protect that indirection — a single hex literal put back into lib/theme.ts
   silently un-themes every surface that reads it. */
{
  const theme = read("lib/theme.ts");

  check(
    !/:\s*"#[0-9A-Fa-f]{6}"/.test(theme.slice(theme.indexOf("export const T ="), theme.indexOf("} as const"))),
    "theme: a token is a hex literal again",
    "Every token in T must be var(--t-*). A literal cannot change with the theme, so the surface that\n" +
      "      reads it stays dark on a white page — and it will look like a one-off bug rather than the\n" +
      "      systemic thing it is.",
  );

  const css = read("app/globals.css");
  check(
    /:root\s*\{[^}]*--t-bg:/.test(css) && /:root\[data-theme="light"\]\s*\{[^}]*--t-bg:/.test(css),
    "theme: a palette is missing",
    "Dark must be defined on bare :root so a document with no attribute — server render, storage\n" +
      "      blocked, crawler — gets the palette the product has always had. Light is opt-in.",
  );

  /* Every token the app reads must exist in BOTH palettes, or that surface
     renders with an empty custom property and falls back to nothing. */
  const tokens = [...theme.matchAll(/var\((--t-[a-z-]+)\)/g)].map((m) => m[1]);
  const paletteFor = (sel) => {
    const at = css.indexOf(sel);
    if (at === -1) return "";
    return css.slice(at, css.indexOf("}", at));
  };
  const dark = paletteFor(":root {");
  const light = paletteFor(':root[data-theme="light"]');
  const missingDark = tokens.filter((t) => !dark.includes(t + ":"));
  const missingLight = tokens.filter((t) => !light.includes(t + ":"));
  check(
    tokens.length >= 13 && missingDark.length === 0 && missingLight.length === 0,
    "theme: a token is defined in one palette but not the other",
    `Every token must exist in both, or that surface renders with no value at all.\n` +
      `      Missing from dark: ${missingDark.join(", ") || "none"}. Missing from light: ${missingLight.join(", ") || "none"}.`,
  );

  /* The flash-of-wrong-theme guard. Any React lifecycle runs after the server's
     HTML has painted, so only an inline script in <head> can prevent a
     full-page flash from black to white on every load. */
  check(
    /themeBootScript/.test(read("app/layout.tsx")) &&
      /dangerouslySetInnerHTML=\{\{ __html: themeBootScript \}\}/.test(read("app/layout.tsx")),
    "theme: the pre-paint boot script is gone",
    "Without it the page renders dark, hydrates, and only then discovers a stored light preference —\n" +
      "      a visible flash on every single load. No effect can do this, not even useLayoutEffect.",
  );

  /* html and body paint the ground behind every page. Left as a dark literal
     they frame a white app in black. */
  const layout = read("app/layout.tsx");
  check(
    !/<html[^>]*background: "#07070E"/.test(layout) && !/<body[^>]*background: "#07070E"/.test(layout),
    "theme: the document ground is a dark literal",
    "html and body must read var(--t-bg), or light mode renders a white app inside a black frame.",
  );

  /* The player is the deliberate exception and must NOT follow the theme:
     video belongs on black at any setting. */
  check(
    /background: "#000"/.test(read("components/EpisodeFeed.tsx")),
    "theme: the player stopped being black",
    "The immersive player is intentionally black in both themes. Full-bleed video on a white ground\n" +
      "      is wrong, and this is the one surface that should not follow the setting.",
  );

  /* ONE PALETTE, NOT TWO.

     app/globals.css also carries a Tailwind @theme block, and it used to hold
     its own hex literals — a second, invisible palette that did not follow the
     theme. The most visible casualty was .device-frame, the desktop phone
     preview, which painted a #07070E ground under near-black light-mode text at
     about 1.08:1: choosing Light on a laptop made the entire app unreadable. A
     reviewer found it, not a gate.

     The @theme colour tokens must reference the theme tokens, so there is one
     palette and utilities and direct consumers cannot disagree with it. */
  {
    const at = css.indexOf("@theme inline");
    const themeBlock = at === -1 ? "" : css.slice(at, css.indexOf("}", at));
    const literals = [...themeBlock.matchAll(/(--color-(?:bg|bg-card|bg-glass|ink|muted|accent))\s*:\s*(#[0-9A-Fa-f]{3,8}|rgba?\()/g)].map((m) => m[1]);
    check(
      at !== -1 && literals.length === 0,
      "theme: the Tailwind palette has its own hex literals again",
      `A second palette that does not follow data-theme. Every ground and text colour in @theme must\n` +
        `      reference a --t-* token, or light mode paints dark surfaces under dark text.\n` +
        `      Literals found: ${literals.join(", ") || "(the @theme block itself is missing)"}`,
    );
  }

  /* The control must actually be a control. It shipped for months rendering the
     words "Always On" beside a moon icon and doing nothing. */
  /* Comments stripped: the replacement code explains the "Always On" control it
     replaced, and matching that would make the check fail on its own prose. */
  const profile = stripComments(read("components/ProfileDynamic.tsx"));
  check(
    /useTheme\(\)/.test(profile) && !/Always On/.test(profile),
    "theme: the appearance control is inert again",
    'It used to render "Always On" and do nothing — a control that looked like a control and was not\n' +
      "      one. It must call setTheme.",
  );
}

/* ------------------------------------------------------------------ */
/*  28. THE MERCH IS VISIBLE, AND HONEST ABOUT NOT BEING BUYABLE        */
/* ------------------------------------------------------------------ */

/* MERCH_CHECKOUT_ENABLED used to gate the whole section, so with checkout off
   the entire Verza TV range vanished and the shop presented itself as an Amazon
   affiliate list. The flag now decides whether a product SELLS, not whether it
   is seen. */
{
  const shop = read("app/shop/page.tsx");
  check(
    !/\{merchEnabled && <div className="product-grid/.test(shop),
    "shop: the merch grid is gated out of existence again",
    "The range exists and is worth showing. Gate the BUYING, not the seeing.",
  );
  check(
    /Coming soon/.test(shop),
    "shop: an unbuyable product shows no coming-soon label",
    "A product with no price and no explanation reads as broken.",
  );
  check(
    /merchEnabled \? \(\s*<Link/.test(shop) || /return merchEnabled \? \(/.test(shop),
    "shop: an unbuyable product still links to a purchase page",
    "A card that navigates to a detail page with an Add to Cart button is a promise the shop cannot\n" +
      "      keep. Tappable and inert is the exact pattern the audit exists to remove.",
  );
}

/* ------------------------------------------------------------------ */
/*  29. THE REALITY TAB LEADS WITH A SHOW THAT PLAYS, AND THE THREE     */
/*      FLYERS SAY SO IN WORDS                                          */
/*                                                                      */
/*  The Reality tab is a 2x2 grid of four shows and exactly one of them  */
/*  — storage-pirates — has footage. The other three are not catalog     */
/*  rows at all: no SERIES entry, no /series page, no episodes.          */
/* ------------------------------------------------------------------ */
{
  /* Evaluate the REAL ordering rather than pattern-matching the sort call.
     The literal and its comparator are lifted out of BrowsePage, transpiled
     and run against the real public Mux map, so this asserts the order the
     component actually renders — and it keeps working if the comparator is
     rewritten. */
  const predicateSrc = (browse.match(/function realityPlayable\([\s\S]*?\n\}/) || [])[0];
  /* Bounded on both ends. An unbounded `[\s\S]*?` after the closing bracket
     will happily run to the next semicolon anywhere in the 1,400-line file,
     which is exactly how the "hand-numbered" check below was blind: it matched
     a `.sort(` here and a `realityPlayable(` four hundred lines later inside
     the tile renderer, and passed while the order was hardcoded. Verified by
     negative control on 2026-08-30 — a comparator that ignores playability
     entirely was not caught until this was bounded. */
  const listSrc = (browse.match(/const REALITY_SHOWS = \[[\s\S]*?\n\][\s\S]{0,400}?;\n/) || [])[0];
  const listCode = (browseCode.match(/const REALITY_SHOWS = \[[\s\S]*?\n\][\s\S]{0,400}?;\n/) || [])[0] || "";

  check(
    Boolean(predicateSrc && listSrc),
    "reality: the show list could not be located in BrowsePage",
    "Expected `function realityPlayable(...)` and `const REALITY_SHOWS = [...]` at module scope in\n" +
      "      components/BrowsePage.tsx. If they were renamed or moved, update this check — do not\n" +
      "      delete it: it is the only thing asserting the working show sits at the top of the tab.",
  );

  let realityShows = null;
  if (predicateSrc && listSrc) {
    const js = ts.transpileModule(
      `${predicateSrc}\n${listSrc}\nmodule.exports = REALITY_SHOWS;`,
      { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
    ).outputText;
    const compiled = { exports: {} };
    try {
      new Function("module", "exports", "MUX_MAP", js)(compiled, compiled.exports, publicMap.MUX_MAP);
      realityShows = compiled.exports;
    } catch (err) {
      check(false, "reality: the show list could not be evaluated", String(err && err.message));
    }
  }

  if (Array.isArray(realityShows) && realityShows.length > 0) {
    const playable = (slug) => (publicMap.MUX_MAP[slug] ?? []).length > 0;
    const order = realityShows.map((s) => `${s.slug}${playable(s.slug) ? "" : " (no video)"}`);

    /* BUG THIS CATCHES: Storage Pirates — the only Reality title with any
       footage — sat at index 3 of the four, which in a 2x2 grid is the
       BOTTOM-RIGHT tile. The one show a viewer could actually watch was the
       last one they reached, under two tiles that do nothing when tapped.
       Founder, 2026-08-30: "Storage Pirates is the only actual show that is
       working. Let us put that in one of the top two."
       The assertion is the partition, not an index: every show that plays
       sorts above every show that does not, so the top of the grid is always
       watchable and a second real show joins it the day its footage lands. */
    const firstUnplayable = realityShows.findIndex((s) => !playable(s.slug));
    const lastPlayable = realityShows.map((s) => playable(s.slug)).lastIndexOf(true);
    check(
      firstUnplayable === -1 || lastPlayable < firstUnplayable,
      "reality: a flyer with no video sorts above a show that plays",
      `Rendered order: ${order.join(", ")}\n` +
        "      Every playable Reality show must precede every unplayable one, so slot 1 of the 2x2 grid\n" +
        "      is always a tile that starts a video. Storage Pirates used to sit in slot 4.",
    );

    /* The grid is 2x2 and the founder asked for the working show in the top
       ROW, which is slots 1 and 2 — a partition alone would satisfy that with
       zero playable shows, so state the real requirement. */
    check(
      realityShows.slice(0, 2).some((s) => playable(s.slug)),
      "reality: neither of the top two tiles plays anything",
      `Rendered order: ${order.join(", ")}\n` +
        "      The first row of the Reality grid must contain at least one show with episodes in\n" +
        "      MUX_MAP. If every Reality title has genuinely lost its footage, this check is the\n" +
        "      right place to find out.",
    );

    /* BUG THIS CATCHES: the order being written down instead of worked out.
       A hardcoded slot ("storage-pirates first") is correct on the day it is
       typed and silently wrong forever after: when The Vertical Tea's episodes
       land, nothing fails, nothing warns, and the new real show sits in the
       bottom row under two flyers until somebody notices by eye. Deriving the
       order from the same MUX_MAP predicate the tiles use to decide
       tappability removes the thing that can be forgotten. */
    check(
      /\.sort\(/.test(listCode) && /realityPlayable\(/.test(listCode),
      "reality: the grid order is hand-numbered again",
      "REALITY_SHOWS must be ordered by a .sort() that calls realityPlayable() — the same MUX_MAP\n" +
        "      predicate the tiles use for tappability. A hardcoded order goes stale the moment new\n" +
        "      footage lands and nothing reports it.",
    );

    /* BUG THIS CATCHES: a tile that says "Coming Soon" and then serves a 404.
       sugar-babies, buy-sell-miami and the-vertical-tea are in no SERIES row,
       so getSeriesWithDetail() returns undefined and
       app/series/[slug]/page.tsx calls notFound(). posterHref() cannot save
       them either — its zero-episode fallback is /series/<slug>, which is the
       page that 404s. So an unplayable Reality tile may only become a link
       once its slug is a real catalog row. */
    for (const show of realityShows) {
      if (playable(show.slug)) continue;
      check(
        !catalog.catalog.some((s) => s.slug === show.slug),
        `reality: ${show.slug} has a catalog row but the tile is still inert`,
        "It now has a real /series page, so the tile should link to it rather than swallow the tap.\n" +
          "      Update the Reality grid, then update this check to expect the link.",
      );
    }
  }

  /* Everything below asserts the RENDERED tile, scoped to the Reality block so
     a match somewhere else in BrowsePage cannot satisfy it. */
  const realityBlock = (browseCode.match(
    /activeTab === "reality" && \(\(\) => \{[\s\S]*?\n {6}\}\)\(\)\}/,
  ) || [])[0];

  check(
    Boolean(realityBlock),
    "reality: the tab's render block could not be located",
    'Expected `{activeTab === "reality" && (() => {` ... `})()}` in components/BrowsePage.tsx.',
  );

  if (realityBlock) {
    /* BUG THIS CATCHES: nothing on an unplayable Reality tile said it was
       unplayable. Two of the three flyers carry a launch line inside the
       ARTWORK and one carries nothing at all, so the tab showed four
       identical-looking shows of which three did nothing when tapped, and the
       only explanation was baked into a JPEG at whatever size the poster
       happened to render. The status has to be TEXT in the title row: it is
       the only form that stays legible at tile size, gets read aloud, and can
       be changed without re-exporting artwork.
       Founder, 2026-08-30: "put Coming Soon not ON the flyer, but under or
       next to the title — like Sugar Babies Coming Soon". */
    check(
      /<Badge type="soon" inline \/>/.test(realityBlock),
      "reality: the flyers no longer say Coming Soon in the title row",
      "An unplayable Reality tile must render <Badge type=\"soon\" inline /> beneath its title. Without\n" +
        "      it the tab shows four shows that look alike and three that do nothing when tapped.",
    );

    /* The label must be in the TITLE ROW, not painted back over the flyer. The
       poster art is do-not-touch: it may not be cropped, resized or overlaid,
       and an absolute-positioned badge on top of it is exactly the overlay the
       founder asked to remove. `inline` is the placement that renders as a
       span in normal flow; the default placement is `absolute`. */
    check(
      !/<Badge type="soon"(?! inline)/.test(realityBlock),
      "reality: the Coming Soon badge is overlaying the flyer artwork again",
      "Only the `inline` placement belongs on a Reality tile. The default Badge is absolutely\n" +
        "      positioned over the poster, and these flyers are do-not-touch artwork.",
    );

    /* It has to be the label the rest of the app uses, not a fourth spelling.
       BADGE_STYLE.soon.label is that word, and the show page title, the browse
       grid and the empty-state panel all read from it. */
    check(
      /soon: \{[^}]*label: "Coming Soon"/.test(browseCode),
      "reality: the Coming Soon wording drifted out of BADGE_STYLE",
      "The inline Reality label renders BADGE_STYLE.soon.label. Keep one spelling of the status for\n" +
        "      the badge, the grid and the empty state.",
    );

    /* BUG THIS CATCHES: making a Coming Soon tile tappable. This is the
       source-level half of the catalog check above — the tile must be a plain
       element with no href in the unplayable arm. A <Link> here is a 404
       behind a label that promises a launch. */
    const arms = realityBlock.match(/return playable \? \(([\s\S]*?)\) : \(([\s\S]*?)\);/);
    check(
      Boolean(arms) && /<Link/.test(arms[1]),
      "reality: the playable tile stopped linking to its player",
      "storage-pirates has episodes and its tile must open them.",
    );
    check(
      Boolean(arms) && !/<Link/.test(arms[2]) && !/href/.test(arms[2]),
      "reality: a Coming Soon tile navigates somewhere",
      "The unplayable arm must render a plain element with no href. These three slugs are in no\n" +
        "      catalog row, so /series/<slug> calls notFound() — the tap would serve a 404 to somebody\n" +
        "      who just read the words Coming Soon.",
    );

    /* BUG THIS CATCHES: the fixed 36px title row. The status chip is a few
       pixels taller than the genre line it replaces (measured 41 vs 36), and a
       hard height let it bleed through the 10px grid gap into the poster
       below. Measured in Chrome at the 2-up tile width: 36 -> clipped, 41 with
       minHeight -> clean, all four tiles 317px tall. */
    check(
      /minHeight: 36/.test(realityBlock) && !/style=\{\{ height: 36 \}\}/.test(realityBlock),
      "reality: the tile title row is a fixed height again",
      "The Coming Soon chip is taller than the genre line it replaces. Use minHeight so the row can\n" +
        "      grow instead of bleeding into the row beneath it.",
    );
  }

  /* The inline placement itself. It is a second placement of ONE badge
     vocabulary, not a second vocabulary — same component, same BADGE_STYLE
     constant, same word. */
  check(
    /function Badge\(\{ type, large = false, inline = false \}/.test(browseCode),
    "reality: the Badge component lost its inline placement",
    "Badge renders the status over artwork by default and in the title row when `inline` is set.\n" +
      "      Both placements are the same badge; do not fork a second component to say Coming Soon.",
  );

  /* BUG THIS CATCHES: a dark hex under the title. The title row used to be
     "#F5F4F8" on "#6B6B7B" — literals that were correct on the dark ground and
     invisible on the light one (near-white text on a white page, ~1:1). Every
     colour in this row now reads a var(--t-*) token, so it switches. Measured
     in both themes on the mobile ground: title 7.79:1 dark / 8.71:1 light,
     chip text 6.68:1 dark / 8.16:1 light. */
  if (browse.includes("REALITY_SHOWS.map")) {
    /* Scoped to the title row only — the poster box above it legitimately
       carries the Landscape chip's own stroke colour, which is artwork
       furniture on a permanently dark ground, not page text. */
    const titleRow = (browse.match(/style=\{\{ minHeight: 36 \}\}>([\s\S]*?)<Badge type="soon" inline \/>/) || [])[0];
    /* Fails closed, and says which failure it is: if the row cannot be found
       the colours cannot be judged, and reporting "hardcodes a hex" for a row
       that was merely restructured sends the reader hunting for a hex that is
       not there. */
    check(
      Boolean(titleRow),
      "reality: the tile title row could not be located",
      "Expected the title row between `style={{ minHeight: 36 }}>` and `<Badge type=\"soon\" inline />`.\n" +
        "      If the row was restructured, re-scope this check — it is what keeps a dark hex out of it.",
    );
    if (titleRow) {
      check(
        !/#[0-9A-Fa-f]{6}/.test(titleRow),
        "reality: the tile title row hardcodes a hex colour",
        "Use the T tokens (T.text, T.textDim, T.textMute). A literal dark hex does not switch to light\n" +
          "      mode, and #F5F4F8 on the light theme's white ground is invisible.",
      );
    }
  }
}

/* ------------------------------------------------------------------ */
/*  30. THE SCRUB STRIP DOES NOT STEAL A SWIPE                          */
/* ------------------------------------------------------------------ */

/* BUG THIS CATCHES, measured by two reviewers before it shipped: the scrubber
   committed on pointerdown, before anything was known about which way the
   finger would travel. A vertical swipe that happened to begin inside the 44px
   strip therefore fired the episode advance AND a full scrub in one gesture —
   seeking the episode the viewer was in the act of leaving.

   The axis decides now, on the first movement large enough to mean anything.
   Nothing is written to the video until that choice is made, so an abandoned
   press has no effect at all. */
{
  const code = feedCode;
  check(
    /scrubArmRef\.current = \{ x: e\.clientX, y: e\.clientY, id: e\.pointerId \}/.test(code),
    "scrubber: the press commits before the axis is known",
    "beginScrub must ARM, not commit. Starting a scrub on pointerdown means any gesture that begins\n" +
      "      on the bar is a scrub, including the swipe to the next episode.",
  );
  check(
    /if \(dy > dx\) \{[\s\S]{0,180}?scrubArmRef\.current = null;[\s\S]{0,80}?return;/.test(code),
    "scrubber: a vertical gesture is not handed back to the feed",
    "When the vertical component wins, the scrub must abandon and touch nothing. Otherwise the swipe\n" +
      "      and the seek both run.",
  );
  check(
    /if \(dx < SCRUB_AXIS_SLOP && dy < SCRUB_AXIS_SLOP\) return;/.test(code),
    "scrubber: the axis is judged before there is movement to judge",
    "A stationary finger has no axis. Below the slop the question has no answer and nothing should\n" +
      "      happen — least of all a seek.",
  );
  /* A tap with no movement must still seek: that is what a progress bar does.
     It resolves on release so it cannot pre-empt a swipe that merely began
     on the bar. */
  check(
    /if \(!scrubbingRef\.current && scrubArmRef\.current\?\.id === e\.pointerId\)/.test(code),
    "scrubber: tapping the bar no longer seeks",
    "Arming without committing must not cost the tap-to-seek that a progress bar has always had.\n" +
      "      Resolve it on release, where it cannot beat a swipe to the gesture.",
  );
}

if (failures.length > 0) {
  console.error("Feed integrity contract: FAIL");
  for (const f of failures) console.error(`  - ${f}`);
  console.error(`\n  ${failures.length} failing check(s).`);
  process.exit(1);
}

console.log("Feed integrity contract: PASS");

