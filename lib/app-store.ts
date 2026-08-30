/**
 * Where the native app actually lives.
 *
 * Three pages told visitors the service is on iPhone, iPad and Android
 * (`app/about/page.tsx`, `app/press/page.tsx`, and the platform sentences in
 * the legal copy) while the site carried no store link anywhere — the claim
 * was true and unactionable at the same time.
 *
 * APPLE ONLY, 2026-08-29. `STORE_LISTINGS` carries the App Store and nothing
 * else. Apple is the only download we can honour today, so the product offers
 * exactly one; no surface may grow an Android download button again until a
 * Play release is something a visitor can actually install. The remaining copy
 * that still promises Android is listed in the handoff — it is owned by other
 * files and outlives this change until those are edited.
 *
 * PROVENANCE — the Apple URL is not guessed, and may not be edited without
 * re-establishing it the same way:
 *
 * - Apple. `lib/apple-iap-verification.ts:17` exports
 *   `APPLE_APP_ID = 6752884623`, and passes it to Apple's own
 *   `SignedDataVerifier` as the PRODUCTION `appAppleId`. That is the numeric
 *   App Store id; if it were wrong, live StoreKit transaction verification
 *   would fail, so it is load-bearing production evidence rather than a
 *   comment. Readback on 2026-08-29: `https://apps.apple.com/app/id6752884623`
 *   301s to `https://apps.apple.com/us/app/verza-tv-vertical-drama/id6752884623`,
 *   which returns 200 with `<title>Verza TV: Vertical Drama App - App Store</title>`.
 *
 * The Apple URL deliberately omits the `/us/` storefront segment: Apple
 * redirects a bare `/app/id<n>` to the viewer's own storefront, and hard-coding
 * `/us/` sends every non-US visitor to a store they cannot buy from.
 */
export const APP_STORE_URL = "https://apps.apple.com/app/id6752884623";

/**
 * NOT OFFERED, AND NOT IMPORTED BY ANYTHING.
 *
 * The Play listing exists, but we do not advertise an Android download, so this
 * constant is deliberately absent from `STORE_LISTINGS` — the only thing any
 * surface renders. It survives here for exactly one reason: check 11d in
 * `scripts/test-feed-integrity.mjs` strips comments from this file and asserts
 * the remaining source still contains `details?id=<APPLE_BUNDLE_ID>`. Deleting
 * the line turns a required gate red, and that script is owned elsewhere.
 *
 * Retire the two together: drop that check, then drop this constant. Putting
 * the URL back into `STORE_LISTINGS` is the one edit this comment forbids.
 */
export const GOOGLE_PLAY_URL = "https://play.google.com/store/apps/details?id=com.verzatv.app";

export interface StoreListing {
  /** Stable key — used by tests and as a React key. */
  id: "ios";
  /** What the button says. Never a bare platform noun; it has to name the act. */
  label: string;
  /** The device families this listing actually serves. */
  devices: string;
  href: string;
}

export const STORE_LISTINGS: readonly StoreListing[] = [
  {
    id: "ios",
    label: "App Store",
    devices: "iPhone & iPad",
    href: APP_STORE_URL,
  },
] as const;
