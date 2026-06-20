/* ================================================================== */
/*  Analytics event tracking — GA4 + Vercel Analytics                   */
/*  Fire events for every key user action across the platform           */
/* ================================================================== */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

type TrackEvent =
  | "page_view"
  | "episode_start"
  | "episode_complete"
  | "episode_unlock_prompt"
  | "series_unlock_click"
  | "merch_add_to_cart"
  | "merch_checkout"
  | "search"
  | "share_click"
  | "save_click"
  | "language_change"
  | "shorts_swipe"
  | "info_drawer_open"
  | "signup_start"
  | "signup_complete";

export function track(event: TrackEvent, params?: Record<string, string | number>) {
  /* GA4 */
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", event, params);
  }

  /* Vercel Analytics (custom events) */
  try {
    if (typeof window !== "undefined" && "va" in window) {
      (window as unknown as Record<string, (event: string, params?: Record<string, string | number>) => void>).va("event", { name: event, ...params });
    }
  } catch {}
}

/* ---- Convenience helpers ---- */

export function trackEpisodeStart(seriesSlug: string, episode: number) {
  track("episode_start", { series: seriesSlug, episode, source: document.referrer || "direct" });
}

export function trackEpisodeComplete(seriesSlug: string, episode: number) {
  track("episode_complete", { series: seriesSlug, episode });
}

export function trackUnlockPrompt(seriesSlug: string) {
  track("episode_unlock_prompt", { series: seriesSlug });
}

export function trackUnlockClick(seriesSlug: string) {
  track("series_unlock_click", { series: seriesSlug });
}

export function trackAddToCart(productName: string, price: number) {
  track("merch_add_to_cart", { product: productName, price });
}

export function trackCheckout(totalCents: number, itemCount: number) {
  track("merch_checkout", { total: totalCents, items: itemCount });
}

export function trackSearch(query: string, resultCount: number) {
  track("search", { query, results: resultCount });
}

export function trackShare(seriesSlug: string, platform: string) {
  track("share_click", { series: seriesSlug, platform });
}

export function trackLanguageChange(locale: string) {
  track("language_change", { language: locale });
}

export function trackShortsSwipe(seriesSlug: string, direction: string) {
  track("shorts_swipe", { series: seriesSlug, direction });
}
