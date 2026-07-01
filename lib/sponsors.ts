/* ------------------------------------------------------------------ */
/*  TikTok Shop sponsored products                                     */
/*                                                                      */
/*  Add/edit sponsors here — the SponsoredProducts strip on the home    */
/*  page renders whatever is in this array (and renders NOTHING when    */
/*  it's empty, so the page stays clean if all sponsors are removed).   */
/*                                                                      */
/*  For each product provide:                                           */
/*    title  — product name shown on the card                           */
/*    price  — display string, e.g. "$12.99"                            */
/*    url    — the real TikTok Shop / affiliate link (opens new tab)    */
/*    image  — OPTIONAL path under /public/ads (e.g. "/ads/foo.jpg").   */
/*             If omitted, a branded gradient placeholder is shown.      */
/*    accent — OPTIONAL [from, to] gradient for the placeholder.        */
/*    badge  — OPTIONAL small tag, e.g. "Trending", "Bestseller".       */
/* ------------------------------------------------------------------ */

export type SponsoredProduct = {
  id: string;
  title: string;
  price: string;
  url: string;
  image?: string;
  accent?: [string, string];
  badge?: string;
};

/**
 * Matches a sponsored product against a search query. Every product carries
 * the shared "tiktok / shop / sponsored" keywords, so searching "tiktok"
 * returns ALL products; product-specific words (e.g. "projector") narrow it.
 * Token-based AND matching, case-insensitive, min 2 chars — same rules as the
 * movie search.
 */
export function productMatchesQuery(p: SponsoredProduct, rawQuery: string): boolean {
  const q = rawQuery.trim().toLowerCase();
  if (q.length < 2) return false;
  const haystack = [
    p.title,
    p.price,
    p.badge ?? "",
    "tiktok",
    "tiktok shop",
    "shop",
    "sponsored",
    "ad",
    "product",
    "products",
    "deal",
    "deals",
  ]
    .join(" ")
    .toLowerCase();
  return q
    .split(/\s+/)
    .filter(Boolean)
    .every((token) => haystack.includes(token));
}

// Entertainment-aligned, top-selling TikTok Shop categories (movie night,
// creator gear, cozy binge-watch). Swap in real product image/price/link.
export const SPONSORED_PRODUCTS: SponsoredProduct[] = [
  {
    id: "mini-movie-projector",
    title: "Mini HD Movie Projector",
    price: "$39.99",
    url: "https://www.tiktok.com/shop",
    accent: ["#8B5CF6", "#3B82F6"],
    badge: "Movie night",
  },
  {
    id: "wireless-earbuds-pro",
    title: "Wireless Noise-Cancelling Earbuds Pro",
    price: "$24.99",
    url: "https://www.tiktok.com/shop",
    accent: ["#22D3EE", "#3B82F6"],
    badge: "Bestseller",
  },
  {
    id: "galaxy-star-projector",
    title: "Galaxy Star Night Projector",
    price: "$19.99",
    url: "https://www.tiktok.com/shop",
    accent: ["#7C3AED", "#EC4899"],
    badge: "Viral",
  },
  {
    id: "portable-bt-speaker",
    title: "Portable Bluetooth Speaker",
    price: "$21.99",
    url: "https://www.tiktok.com/shop",
    accent: ["#F59E0B", "#EF4444"],
    badge: "Trending",
  },
  {
    id: "led-room-lights",
    title: "Smart RGB LED Room Lights (50ft)",
    price: "$15.99",
    url: "https://www.tiktok.com/shop",
    accent: ["#EC4899", "#8B5CF6"],
    badge: "Hot deal",
  },
];
