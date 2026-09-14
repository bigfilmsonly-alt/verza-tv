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
  /* Content-performance pair. Deliberately in THIS sink, alongside
     episode_start: correlating a selection with the playback it produced is
     the whole point, and an event in a different sink cannot be joined to one
     here. Both fire from a real click only — never a render, never a carousel
     rotation, never an image load. There are no matching impression events
     yet, on purpose, so click COUNTS and click SHARE are reportable but CTR is
     not: there is no honest denominator. */
  | "hero_click"
  | "tile_click"
  /* Fired when a tap on a buy control is turned away because the viewer is
     signed out. It is the denominator series_unlock_click cannot supply on its
     own: without it, an unlock tap from a guest is indistinguishable from no
     tap at all, and the paywall -> checkout step of the funnel reads as though
     nobody tried. */
  | "auth_required"
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

/**
 * The hero carousel was clicked.
 *
 * `position` is the 1-based slide index the viewer was actually looking at, so
 * slide 3 reports 3 — not the title's place in the catalogue.
 */
export function trackHeroClick(seriesSlug: string, position: number, destinationEpisode = 1) {
  track("hero_click", { series: seriesSlug, position, destination_episode: destinationEpisode });
}

/**
 * A content tile was clicked.
 *
 * `shelf` is the shelf the viewer actually clicked in, derived from the same
 * positional rule that draws the badge — so the event cannot disagree with
 * what was on screen. `position` is 1-based WITHIN that shelf: the first NEW
 * tile is 1, and so is the first TRENDING tile.
 *
 * `destination_episode` is 1 everywhere except Continue Watching, where it is
 * the episode actually being resumed.
 */
export function trackTileClick(
  seriesSlug: string,
  shelf: string,
  position: number,
  destinationEpisode = 1,
) {
  track("tile_click", { series: seriesSlug, shelf, position, destination_episode: destinationEpisode });
}

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

/** A buy control was tapped by a signed-out viewer and sent to sign-in. */
export function trackAuthRequired(surface: string, seriesSlug?: string) {
  track("auth_required", seriesSlug ? { surface, series: seriesSlug } : { surface });
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
