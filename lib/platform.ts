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
 */
export function isIOSApp(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get("platform") === "ios") {
      try { localStorage.setItem("verza-platform", "ios"); } catch {}
      return true;
    }
    if (localStorage.getItem("verza-platform") === "ios") return true;
  } catch {}
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
