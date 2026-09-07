/**
 * iOS App detection — powers "reader-style" App Store compliance (Apple
 * Guideline 3.1.1): when the site runs inside the iOS app, all purchase
 * UI is hidden. Digital content may not be sold via external checkout
 * inside an iOS app; hiding purchases entirely (the Netflix model) is the
 * compliant pattern that requires no in-app purchase implementation.
 *
 * The iOS wrapper identifies itself in any ONE of these ways:
 *   1. Load the site with `?platform=ios` once (persisted per device), or
 *   2. Append "VerzaTV-iOS" to its WebView user agent, or
 *   3. Run as an installed iOS home-screen app (navigator.standalone).
 *
 * `?platform=web` is the escape hatch, and it exists because the persisted
 * form of (1) had no removal path of any kind: no removeItem, no override,
 * no expiry. Any marketing link, QR code or shared URL carrying
 * `?platform=ios` permanently converted a real web browser into one that
 * could never buy, and that told the visitor the episode "isn't available in
 * this app" while they sat on the open web. It also suppressed GTM/AdSense
 * (see ThirdPartyScripts), so a trapped browser did not even appear in the
 * funnel as a lost sale. One tagged link was a permanent conversion loss.
 *
 * `?platform=web` deliberately clears only the PERSISTED override. It does
 * not overrule the user-agent or standalone signals, because those mean the
 * page is genuinely running inside the app, and revealing purchase UI there
 * is the 3.1.1 violation this module exists to prevent. The escape hatch
 * releases a mislabelled browser; it cannot be used to force checkout into a
 * real iOS client.
 */

const STORAGE_KEY = "verza-platform";

/** Only these two values are meaningful; anything else is ignored, never stored. */
function queryOverride(): "ios" | "web" | null {
  try {
    const value = new URLSearchParams(window.location.search).get("platform");
    if (value === "ios" || value === "web") return value;
  } catch {}
  return null;
}

export function isIOSApp(): boolean {
  if (typeof window === "undefined") return false;

  const override = queryOverride();

  // Each storage call is guarded on its own: the classification must never
  // depend on persistence succeeding. A real iOS client with site data
  // blocked still has to read as iOS.
  if (override === "ios") {
    try { localStorage.setItem(STORAGE_KEY, "ios"); } catch {}
    return true;
  }

  if (override === "web") {
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    // Falls through to the genuine in-app signals below on purpose.
  } else {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "ios") return true;
      // A stored value that is not exactly "ios" is corrupt or from an older
      // scheme. Drop it rather than leaving state we will never honour.
      if (stored !== null) localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }

  const ua = navigator.userAgent || "";
  if (/VerzaTV-iOS/i.test(ua)) return true;
  // navigator.standalone is iOS-Safari-only: true when launched from the
  // home screen (which is how a wrapped PWA presents itself).
  const isApplePlatform = /iPhone|iPad|iPod/i.test(ua);
  if (isApplePlatform && (navigator as unknown as { standalone?: boolean }).standalone === true) {
    return true;
  }
  return false;
}
