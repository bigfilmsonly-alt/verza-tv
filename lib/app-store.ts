/**
 * Where the native apps actually live.
 *
 * Three pages told visitors the service is on iPhone, iPad and Android
 * (`app/about/page.tsx`, `app/press/page.tsx`, and the platform sentences in
 * the legal copy) while the site carried no store link anywhere — the claim
 * was true and unactionable at the same time.
 *
 * PROVENANCE — neither URL is guessed, and neither may be edited without
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
 * - Google. `lib/apple-iap-verification.ts:16` exports
 *   `APPLE_BUNDLE_ID = "com.verzatv.app"`; the Play listing is keyed by the same
 *   application id. Readback on 2026-08-29:
 *   `https://play.google.com/store/apps/details?id=com.verzatv.app` returns 200
 *   with `itemprop="name" → VerzaTV` and the description "VerzaTV brings premium
 *   short-form entertainment to audiences worldwide."
 *
 * The Apple URL deliberately omits the `/us/` storefront segment: Apple
 * redirects a bare `/app/id<n>` to the viewer's own storefront, and hard-coding
 * `/us/` sends every non-US visitor to a store they cannot buy from.
 */
export const APP_STORE_URL = "https://apps.apple.com/app/id6752884623";
export const GOOGLE_PLAY_URL = "https://play.google.com/store/apps/details?id=com.verzatv.app";

export interface StoreListing {
  /** Stable key — used by tests and as a React key. */
  id: "ios" | "android";
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
  {
    id: "android",
    label: "Google Play",
    devices: "Android",
    href: GOOGLE_PLAY_URL,
  },
] as const;
