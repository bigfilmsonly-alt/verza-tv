#!/usr/bin/env node

/**
 * Contract for the two screens immediately before the $1.99 transaction.
 *
 * This suite exists because the purchase journey is where presentation and
 * commerce touch, and the presentation half is the half with no server to
 * catch a mistake. Every assertion names what it prevents.
 *
 * The central one: purchase context must survive the sign-in hop. Before this
 * work, a viewer who tapped "Unlock All Episodes" mid-story was handed a
 * generic account page offering to help them "track your library" -- no title,
 * no price, no reason given. That is a context break in the middle of a
 * transaction the viewer had already agreed to.
 */

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { homedir } from "node:os";
import { createHash } from "node:crypto";
import process from "node:process";

const ROOT = resolve(import.meta.dirname, "..");
const failures = [];
const read = (p) => readFile(resolve(ROOT, p), "utf8");
const must = (name, ok) => { if (!ok) failures.push(name); };
const order = (name, text, first, second) => {
  const a = text.indexOf(first);
  const b = text.indexOf(second);
  if (a === -1) return failures.push(`${name}: missing "${first.slice(0, 48)}"`);
  if (b === -1) return failures.push(`${name}: missing "${second.slice(0, 48)}"`);
  if (a > b) failures.push(name);
};

const [feed, signIn, card, copy, intent, auth, oauth, css, focus] = await Promise.all([
  read("components/EpisodeFeed.tsx"),
  read("app/sign-in/page.tsx"),
  read("components/PurchaseIntentCard.tsx"),
  read("lib/purchase-copy.ts"),
  read("lib/purchase-intent.ts"),
  read("lib/checkout-auth.ts"),
  read("components/OAuthButtons.tsx"),
  read("app/globals.css"),
  read("components/PurchaseFocusMode.tsx"),
]);

/* ---- PAYWALL: what is being bought, and for how much ------------------- */

must("paywall must name the title being bought, from props not a literal",
  feed.includes("{seriesTitle}"));
must("paywall episode count must come from the catalog, never a hard-coded 60",
  feed.includes('purchaseCopy(locale, "unlockAllCount", { count: totalEpisodes })'));
must("paywall price must come from the canonical constant",
  feed.includes("formatPrice(SERIES_UNLOCK_PRICE_CENTS)"));
must("paywall must answer per-episode vs per-month vs once",
  feed.includes('purchaseCopy(locale, "oneTimePurchase")'));

/* A viewer must never be shown a literal episode count. The catalog
   reconciles episodeCount from MUX_MAP at module load, so a hard-coded number
   is wrong the moment an episode is added. */
for (const literal of ["60 episodes", "All 60", "45 episodes"]) {
  must(`paywall must not hard-code "${literal}"`, !feed.includes(literal));
}

/* ---- PAYWALL: one dominant action ------------------------------------- */

must("the purchase CTA must repeat the price, because the button is the decision",
  feed.includes('`${t("paywall.unlockAll")} \\u2022 ${formatPrice(SERIES_UNLOCK_PRICE_CENTS)}`'));

/* The exit used to be a full-width bordered button, drawn at nearly the same
   weight as the purchase CTA, so leaving read as an equally intended choice. */
must("the back action must be a quiet text action, not a second big button",
  !feed.includes('{t("paywall.goBack")}') &&
  feed.includes('purchaseCopy(locale, "backToEpisodes")'));
must("the back action must stay a real anchor so the FIRST tap works pre-hydration",
  /<a\s+href=\{backHref\}\s+onClick=\{handleBack\}/.test(feed));
must("the back action must never depend on an animation to become visible",
  feed.includes('style={{ color: "rgba(255,255,255,0.5)", opacity: 1 }}'));

/* ---- PAYWALL: product vocabulary removed ------------------------------ */

/* "Series Unlock" is our internal product name. The viewer is buying the rest
   of a story, and should not have to translate our noun to understand that. */
for (const key of ["paywall.oneTimeUnlock", "paywall.previewOver",
                   "paywall.benefitAccess", "paywall.benefitEpisodes"]) {
  must(`${key} must no longer be rendered on the web paywall`, !feed.includes(key));
}

/* ---- Someone who already paid must have a route that is not "pay again" -- */

must("the paywall must offer an already-purchased path",
  feed.includes('purchaseCopy(locale, "alreadyPurchased")'));
must("the already-purchased path must NOT carry the resume marker, or it starts a purchase",
  !/already[\s\S]{0,400}resume_unlock/i.test(feed));

/* ---- PURCHASE-INTENT SIGN-IN ------------------------------------------ */

must("sign-in must derive purchase intent from the existing return path",
  signIn.includes("purchaseIntentFromNext(next)"));
must("the purchase card must carry the title", card.includes("{title}"));
must("the purchase card must carry the episode count",
  card.includes('purchaseCopy(locale, "unlockAllCount", { count: episodeCount })'));
must("the purchase card must carry the price",
  card.includes("formatPrice(SERIES_UNLOCK_PRICE_CENTS)") &&
  card.includes('purchaseCopy(locale, "oneTimeWithPrice"'));
must("the purchase card must say sign-in is a step in the purchase, not a detour",
  card.includes('purchaseCopy(locale, "continueToCheckout")'));

/* The pink square "V" was a placeholder mark, not the Verza brand, sitting
   directly under the real logo on the screen that takes money. */
must("the placeholder V mark must be gone",
  !/>\s*V\s*</.test(signIn) && !signIn.includes('rounded-2xl flex items-center justify-center text-2xl font-bold'));

/* A new customer must still be able to buy. */
must("purchase-intent sign-in must keep an account-creation route",
  signIn.includes('"Create account"'));
must("the account route must carry next, or signup loses the purchase",
  signIn.includes("`/sign-up${next ? `?next=${encodeURIComponent(next)}` : \"\"}`"));

/* Guest cannot own a series, so from purchase intent it is a dead end. */
must("Continue as Guest must be hidden under purchase intent",
  signIn.includes("{!intent && ("));

/* ---- Back from purchase-intent sign-in must not bounce ---------------- */

/* `next` still carries the marker. Linking Back straight to it would trip the
   resume effect, fail the auth guard and throw the viewer back to sign-in. */
must("intentBackPath must strip the resume marker",
  intent.includes("url.searchParams.delete(UNLOCK_INTENT_VALUE)"));
must("sign-in Back must use the stripped path under purchase intent",
  signIn.includes("intent ? intentBackPath(next) : \"/\""));

/* ---- The duplicated marker literal cannot drift ----------------------- */

const inGuard = /UNLOCK_INTENT_PARAM = "([^"]+)"/.exec(auth);
const inIntent = /UNLOCK_INTENT_VALUE = "([^"]+)"/.exec(intent);
must("both modules must name the same resume marker",
  inGuard && inIntent && inGuard[1] === inIntent[1]);

/* ---- NORMAL SIGN-IN must still be normal ------------------------------ */

must("normal sign-in must keep its heading", signIn.includes("Sign in to {BRAND.name}"));
must("normal sign-in must keep email first, then the providers",
  signIn.includes("{emailForm}\n          {divider}\n          <OAuthButtons redirectNext={redirectNext} />"));
must("purchase-intent sign-in must lead with the one-tap providers",
  signIn.includes("<OAuthButtons redirectNext={redirectNext} appleFirst />"));

/* ---- AUTH MECHANICS FROZEN -------------------------------------------- */

must("email auth must still post to the same server action", signIn.includes("action={signInAction}"));
must("OAuth provider calls must be untouched",
  oauth.includes('supabase.auth.signInWithOAuth({') &&
  oauth.includes('handleOAuth("google")') &&
  oauth.includes('handleOAuth("apple")'));
must("the OAuth redirect must still be built from the live origin",
  oauth.includes("`${window.location.origin}/api/auth/callback`"));
must("appleFirst must reorder rendering ONLY, never the provider strings",
  oauth.includes("{appleFirst ? [apple, google] : [google, apple]}"));
must("the auth guard must still refuse a protocol-relative returnTo",
  auth.includes('returnTo?.startsWith("/") && !returnTo.startsWith("//")'));

/* ---- COMMERCE FROZEN --------------------------------------------------- */

order("series_unlock_click must still be recorded BEFORE the auth guard",
  feed, 'if (origin === "tap") trackUnlockClick(seriesSlug)', "await requireCheckoutUser(");
order("checkout_started must still stay BELOW the guard (it means checkout began)",
  feed, "await requireCheckoutUser(", 'emit("checkout_started"');
must("the resume must still strip the marker before checkout starts",
  feed.includes("resumeHandledRef.current = true"));
must("a second unlock must still be refused while one is in flight",
  feed.includes("if (unlockInFlightRef.current) return;"));
must("the buy control must remain gated on !iosApp (Apple 3.1.1)",
  feed.includes("{!iosApp && ("));

/* ---- BOTTOM NAV, presentation only ------------------------------------ */

must("purchase focus must hide the nav via a class, not a routing change",
  css.includes("body.purchase-focus .bottom-nav") && focus.includes('classList.add("purchase-focus")'));
must("the nav must come back when the screen unmounts",
  focus.includes('classList.remove("purchase-focus")'));
must("focus mode must apply ONLY under purchase intent",
  signIn.includes("{intent && <PurchaseFocusMode />}"));

/* ---- COPY RULES -------------------------------------------------------- */

/* Founder requirement: no em dashes anywhere in the transaction experience. */
for (const [name, src] of [["lib/purchase-copy.ts", copy], ["PurchaseIntentCard", card]]) {
  if (src.includes("—")) failures.push(`${name} must contain no em dash`);
}
{
  /* The paywall block only. The rest of EpisodeFeed is engineering prose. */
  const blockStart = feed.indexOf('{showUnlock && (');
  const block = blockStart === -1 ? "" : feed.slice(blockStart);
  const rendered = block.split("\n").filter((l) => !l.trim().startsWith("*") && !l.includes("/*"));
  if (rendered.join("\n").includes("—")) {
    failures.push("the rendered paywall must contain no em dash");
  }
}

/* ---- Every locale must be complete ------------------------------------ */

{
  /* The final union member ends with a semicolon, so the line anchor has to
     allow it. Without that this silently under-counted the key list and then
     "verified" a subset. */
  const keys = [...copy.matchAll(/^  \| "(\w+)";?$/gm)].map((m) => m[1]);
  const blocks = [...copy.matchAll(/^  (\w+): \{$/gm)].map((m) => m[1]);
  must("purchase copy must cover all 20 shipped locales", blocks.length === 20);
  must("purchase copy must declare at least 13 keys", keys.length >= 13);
  for (const loc of blocks) {
    const from = copy.indexOf(`  ${loc}: {`);
    /* Terminate on the dedented closing brace, NOT the first "}," in the
       block: several locales render the price as "{price}, pago unico", and
       scanning to that comma cut every later key out of the segment and
       reported nine perfectly good translations as missing. */
    const to = copy.indexOf("\n  },", from);
    const seg = copy.slice(from, to === -1 ? undefined : to);
    for (const k of keys) {
      if (!seg.includes(`${k}: "`)) failures.push(`purchase copy: ${loc} is missing ${k}`);
    }
  }
  /* i18n.ts is pure ASCII on disk so a missing charset header cannot turn it
     into mojibake, and that failure only ever appears over HTTP. Match it. */
  // eslint-disable-next-line no-control-regex
  must("purchase copy must be pure ASCII on disk, like i18n.ts", !/[^\x00-\x7F]/.test(copy));
}

/* ---- The native contract must not have been broken to do this --------- */

/* lib/i18n.ts is byte-identical with the native repo and is one of the 29
   files its data-sync gate hashes. Putting web transaction copy in there would
   fail that gate until someone re-synced a frozen app. */
{
  const candidates = [
    resolve(homedir(), "verza-native/src/lib/i18n.ts"),
    resolve(ROOT, "../verza-native/src/lib/i18n.ts"),
  ];
  let checked = false;
  for (const candidate of candidates) {
    let nativeSrc;
    try { nativeSrc = await readFile(candidate, "utf8"); } catch { continue; }
    const web = createHash("sha256").update(await read("lib/i18n.ts")).digest("hex");
    const nat = createHash("sha256").update(nativeSrc).digest("hex");
    must("lib/i18n.ts must stay byte-identical with the native repo", web === nat);
    checked = true;
    break;
  }
  if (!checked) {
    console.warn("  SKIPPED: native repo not found, i18n byte-identity NOT verified");
  }
}

/* ---- report ------------------------------------------------------------ */

if (failures.length > 0) {
  console.error("Purchase UX contract: FAIL");
  for (const f of failures) console.error(`  - ${f}`);
  process.exitCode = 1;
} else {
  console.log("Purchase UX contract: PASS");
  console.log("  title, episode count and price survive the sign-in hop; one dominant action per screen");
  console.log("  auth mechanics, resume_unlock and commerce event ordering untouched");
}
