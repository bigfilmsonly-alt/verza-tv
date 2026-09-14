#!/usr/bin/env node

/**
 * Regression contract for the web purchase funnel.
 *
 * Every assertion here names a defect that actually reached production and was
 * measured in analytics, not a hypothetical:
 *
 *  - Aug 3 (b26487d) put requireCheckoutUser() ABOVE the unlock tracking, so
 *    every signed-out tap on Unlock recorded nothing. Thirty days of data:
 *    series_unlock_click ZERO against 325 paywall_viewed.
 *  - The same guard dropped the viewer's purchase intent. They signed in and
 *    landed back on the episode with no checkout and no explanation.
 *  - Jul 21 (f6d1e50) moved the paywall into an effect keyed on `episodes` by
 *    identity, so paywall_viewed re-fired for an episode already on screen and
 *    inflated the funnel's denominator.
 *  - The same commit fired episode_unlock_prompt from the same line as
 *    paywall_viewed, making the two events a single signal reported as two
 *    funnel stages.
 *  - Jul 10 (04d8346) made one ?platform=ios link permanently hide the buy
 *    button AND suppress analytics for that browser.
 *
 * Source-text assertions are used where ordering is the invariant, because
 * ordering is exactly what regressed twice.
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

const [feed, auth, trackSrc, eventsType, sink, webhook] = await Promise.all([
  read("components/EpisodeFeed.tsx"),
  read("lib/checkout-auth.ts"),
  read("lib/track.ts"),
  read("lib/analytics/events.ts"),
  read("app/api/events/route.ts"),
  read("app/api/stripe/webhook/route.ts"),
]);

function must(name, condition) {
  if (!condition) failures.push(name);
}
function order(name, text, first, second) {
  const a = text.indexOf(first);
  const b = text.indexOf(second);
  if (a === -1) return failures.push(`${name}: missing "${first.slice(0, 40)}"`);
  if (b === -1) return failures.push(`${name}: missing "${second.slice(0, 40)}"`);
  if (a > b) failures.push(name);
}

/* ---- TEST 1 & 2: unlock ordering, signed-in and signed-out ------------- */

/* The tap must be recorded before the guard can navigate the page away.
   This is the exact line order that was wrong for 35 days. */
order(
  "TEST 1/2 series_unlock_click must be recorded BEFORE the auth guard",
  feed,
  'if (origin === "tap") trackUnlockClick(seriesSlug)',
  "await requireCheckoutUser(",
);

/* TEST 2: the guard must carry a return path, or intent is lost at sign-in. */
must(
  "TEST 2 auth guard must receive a resume-capable return path",
  feed.includes('requireCheckoutUser(unlockReturnPath(), "episode_feed", seriesSlug)'),
);

/* auth_required is emitted inside the guard, before navigation tears the page
   down — it is the denominator series_unlock_click cannot supply alone. */
/* Matched against the call WITH its argument: the prose above it mentions
   window.location.assign() too, and a bare substring match found the comment
   first and reported a false failure. */
order(
  "TEST 3b auth_required must be recorded before navigating to sign-in",
  auth,
  "trackAuthRequired(surface, seriesSlug)",
  "window.location.assign(`/sign-in?next=",
);

/* ---- checkout_started semantics ---------------------------------------- */

/* checkout_started means "checkout actually began", NOT "a button was
   pressed". It must stay BELOW the guard: a signed-out tap is an
   auth_required, not a checkout. Raising it would inflate the funnel. */
order(
  "checkout_started must stay BELOW the auth guard (it means checkout began)",
  feed,
  "await requireCheckoutUser(",
  'emit("checkout_started"',
);

/* ---- TEST 3: purchase intent cannot become an open redirect ------------ */

{
  const { outputText } = ts.transpileModule(auth, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  });
  const run = (href) => {
    const moduleRef = { exports: {} };
    const sandbox = {
      module: moduleRef,
      exports: moduleRef.exports,
      Object,
      URL,
      URLSearchParams,
      window: { location: { href } },
      require: () => ({ createBrowserSupabase: () => null, trackAuthRequired: () => {} }),
    };
    vm.createContext(sandbox);
    vm.runInContext(outputText, sandbox);
    return moduleRef.exports.unlockReturnPath();
  };

  const hostile = [
    "https://www.verzatv.com//evil.com/series/a/6",
    "https://www.verzatv.com/series/a/6?next=https://evil.com",
    "https://www.verzatv.com/\\\\evil.com",
  ];
  for (const href of hostile) {
    let out;
    try { out = run(href); } catch { out = "/"; }
    if (typeof out !== "string" || !out.startsWith("/") || out.startsWith("//")) {
      failures.push(`TEST 3 unlockReturnPath produced an off-site destination for ${href}: ${out}`);
    }
    if (/^https?:/i.test(out)) {
      failures.push(`TEST 3 unlockReturnPath returned an absolute URL for ${href}`);
    }
  }

  const normal = run("https://www.verzatv.com/series/the-mistress-trap/6");
  must(
    "TEST 3 normal path keeps its route and gains the resume marker",
    normal === "/series/the-mistress-trap/6?resume_unlock=1",
  );

  /* The guard itself must also refuse a protocol-relative returnTo. */
  must(
    "TEST 3 auth guard rejects protocol-relative returnTo",
    auth.includes('returnTo?.startsWith("/") && !returnTo.startsWith("//")'),
  );
}

/* ---- TEST 4: resume cannot loop --------------------------------------- */

/* The marker is deleted and the URL rewritten BEFORE checkout starts, so a
   refresh, a back navigation or a shared link cannot replay a purchase. */
order(
  "TEST 4 resume marker must be stripped from the URL before checkout starts",
  feed,
  "window.history.replaceState(null, \"\", `${window.location.pathname}",
  'startUnlock("resume")',
);
must("TEST 4 resume must run at most once per arrival", feed.includes("resumeHandledRef.current = true"));
must(
  "TEST 4 an already-entitled viewer must not resume a purchase",
  feed.includes("if (authFree) return;  // they already own it"),
);

/* ---- TEST 5: no duplicate checkout sessions --------------------------- */

must(
  "TEST 5 a second unlock must be refused while one is in flight",
  feed.includes("if (unlockInFlightRef.current) return;"),
);
must(
  "TEST 5 the in-flight latch must clear when checkout fails",
  feed.includes("unlockInFlightRef.current = false;"),
);

/* ---- TEST 6: paywall_viewed must not inflate on re-render ------------- */

must(
  "TEST 6 paywall_viewed must report each exposure at most once",
  feed.includes("paywallReportedRef.current === exposureKey") &&
    feed.includes("paywallReportedRef.current = exposureKey"),
);

/* ---- TEST 7: cold vs engaged ------------------------------------------ */

must(
  "TEST 7 paywall_viewed must carry entry_type",
  feed.includes('entry_type: hasAdvancedRef.current ? "engaged" : "cold"'),
);

/* ---- TEST 8/9: platform gating ---------------------------------------- */

must(
  "TEST 8/9 the buy control must remain gated on !iosApp (Apple 3.1.1)",
  feed.includes("{!iosApp && ("),
);

/* ---- Duplicate paywall signal retired --------------------------------- */

must(
  "episode_unlock_prompt must no longer be emitted from the paywall",
  !feed.includes("trackUnlockPrompt("),
);
must(
  "episode_unlock_prompt must survive as a TYPE so historical data still parses",
  trackSrc.includes('"episode_unlock_prompt"'),
);

/* ---- TEST 11: a failed checkout must leave the UI usable -------------- */

must(
  "TEST 11 checkout failure must re-enable the button",
  feed.includes("if (!navigating) {") && feed.includes("setUnlockLoading(false);"),
);
must(
  "TEST 11 checkout failure must show a customer-facing message",
  feed.includes('setUnlockError(t("checkout.errorNetwork"))') &&
    feed.includes('setUnlockError(t("checkout.errorNotOpened"))'),
);

/* ---- TEST 12: webhook idempotency ------------------------------------- */

must(
  "TEST 12 the webhook must durably claim each Stripe event before processing",
  webhook.includes('supabase.rpc("claim_stripe_webhook_event"'),
);

/* ---- TEST 13: revenue truth is server-side ---------------------------- */

must(
  "TEST 13 purchase_completed must be recorded from the Stripe webhook",
  webhook.includes('recordAnalytics("purchase_completed"'),
);
must(
  "TEST 13 purchase_completed must be server-only so a client cannot forge it",
  eventsType.includes('SERVER_ONLY_EVENTS: AnalyticsEvent[] = [\n  "purchase_completed"'),
);
must(
  "TEST 13 the client sink must refuse server-only events",
  (await read("lib/analytics/emit.ts")).includes("if (isServerOnlyEvent(event)) return;"),
);

/* ---- Funnel events must survive the sink allowlist -------------------- */

for (const event of ["paywall_viewed", "checkout_started", "auth_required"]) {
  must(`${event} must be accepted by /api/events or it is dropped 400 in silence`,
    sink.includes(`"${event}"`));
}

/* ---- report ----------------------------------------------------------- */

if (failures.length > 0) {
  console.error("Purchase funnel contract: FAIL");
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exitCode = 1;
} else {
  console.log("Purchase funnel contract: PASS");
  console.log("  intent survives sign-in; click/auth/checkout are distinct; paywall counted once with entry_type");
}
