/* ------------------------------------------------------------------ */
/*  Amazon sponsored products                                          */
/*                                                                      */
/*  Add/edit Amazon sponsors here — the Amazon rows on the home page    */
/*  and the Amazon section in search render whatever is in this array   */
/*  (and render NOTHING when it's empty, so the page stays clean if all */
/*  Amazon sponsors are removed).                                       */
/*                                                                      */
/*  For each product provide:                                           */
/*    title  — product name shown on the card                           */
/*    price  — display string, e.g. "$12.99"                            */
/*    url    — the Amazon affiliate link (opens new tab). Defaults to    */
/*             AMAZON_STOREFRONT below when omitted.                     */
/*    image  — OPTIONAL path under /public/ads (e.g. "/ads/foo.jpg").   */
/*             If omitted, a branded gradient placeholder is shown.      */
/*    accent — OPTIONAL [from, to] gradient for the placeholder.        */
/*    badge  — OPTIONAL small tag, e.g. "Amazon's Choice", "Bestseller".*/
/* ------------------------------------------------------------------ */

export type AmazonProduct = {
  id: string;
  title: string;
  price: string;
  url: string;
  image?: string;
  accent?: [string, string];
  badge?: string;
};

/**
 * The Verza TV Amazon storefront / affiliate link (tag=verzatv-20). Individual
 * products point here until real per-product affiliate URLs are supplied.
 */
export const AMAZON_STOREFRONT =
  "https://www.amazon.com/b?node=53629917011&linkCode=ll2&tag=verzatv-20&linkId=1877149370959eec0902c66cb14fb4e5&language=en_US&ref_=as_li_ss_tl";

/**
 * Matches an Amazon product against a search query. Every product carries the
 * shared "amazon / prime / shop / sponsored" keywords, so searching "amazon"
 * returns ALL products; product-specific words (e.g. "projector") narrow it.
 * Token-based AND matching, case-insensitive, min 2 chars — same rules as the
 * movie search.
 */
export function amazonProductMatchesQuery(p: AmazonProduct, rawQuery: string): boolean {
  const q = rawQuery.trim().toLowerCase();
  if (q.length < 2) return false;
  const haystack = [
    p.title,
    p.price,
    p.badge ?? "",
    "amazon",
    "amzn",
    "prime",
    "amazon prime",
    "shop",
    "sponsored",
    "ad",
    "ads",
    "product",
    "products",
    "deal",
    "deals",
    "trending",
  ]
    .join(" ")
    .toLowerCase();
  return q
    .split(/\s+/)
    .filter(Boolean)
    .every((token) => haystack.includes(token));
}

// Entertainment-aligned, top-selling Amazon categories (movie night, creator
// gear, cozy binge-watch). Swap in real product image/price/affiliate link.
export const AMAZON_PRODUCTS: AmazonProduct[] = [
  {
    id: "amzn-fire-tv-stick",
    title: "Fire TV Stick 4K Streaming Device",
    price: "$29.99",
    url: AMAZON_STOREFRONT,
    accent: ["#FF9900", "#232F3E"],
    badge: "Amazon's Choice",
  },
  {
    id: "amzn-echo-dot",
    title: "Echo Dot (5th Gen) Smart Speaker",
    price: "$34.99",
    url: AMAZON_STOREFRONT,
    accent: ["#00A8E1", "#232F3E"],
    badge: "Bestseller",
  },
  {
    id: "amzn-4k-projector",
    title: "4K Portable Home Theater Projector",
    price: "$89.99",
    url: AMAZON_STOREFRONT,
    accent: ["#FF9900", "#146EB4"],
    badge: "Movie night",
  },
  {
    id: "amzn-soundbar",
    title: "Bluetooth TV Soundbar with Subwoofer",
    price: "$59.99",
    url: AMAZON_STOREFRONT,
    accent: ["#146EB4", "#232F3E"],
    badge: "Trending",
  },
  {
    id: "amzn-earbuds",
    title: "Noise-Cancelling Wireless Earbuds",
    price: "$45.99",
    url: AMAZON_STOREFRONT,
    accent: ["#00A8E1", "#146EB4"],
    badge: "Prime deal",
  },
  {
    id: "amzn-led-strip",
    title: "Smart LED Light Strip (65ft, App)",
    price: "$21.99",
    url: AMAZON_STOREFRONT,
    accent: ["#FF9900", "#EC4899"],
    badge: "Hot deal",
  },
  {
    id: "amzn-hoodie-blanket",
    title: "Oversized Wearable Hoodie Blanket",
    price: "$32.99",
    url: AMAZON_STOREFRONT,
    accent: ["#FF9900", "#F59E0B"],
    badge: "Cozy binge",
  },
  {
    id: "amzn-popcorn-maker",
    title: "Hot-Air Electric Popcorn Maker",
    price: "$24.99",
    url: AMAZON_STOREFRONT,
    accent: ["#FF9900", "#146EB4"],
    badge: "Movie night",
  },
  {
    id: "amzn-galaxy-projector",
    title: "Galaxy Star & Aurora Night Projector",
    price: "$27.99",
    url: AMAZON_STOREFRONT,
    accent: ["#146EB4", "#7C3AED"],
    badge: "Viral",
  },
  {
    id: "amzn-power-bank",
    title: "Anker 20,000mAh Portable Charger",
    price: "$39.99",
    url: AMAZON_STOREFRONT,
    accent: ["#00A8E1", "#146EB4"],
    badge: "Bestseller",
  },
  {
    id: "amzn-ring-light",
    title: "Ring Light with Adjustable Tripod",
    price: "$28.99",
    url: AMAZON_STOREFRONT,
    accent: ["#FF9900", "#00A8E1"],
    badge: "Creator pick",
  },
  {
    id: "amzn-blue-light-glasses",
    title: "Blue-Light Blocking Glasses (2-Pack)",
    price: "$16.99",
    url: AMAZON_STOREFRONT,
    accent: ["#146EB4", "#232F3E"],
    badge: "Binge-ready",
  },
  {
    id: "amzn-tumbler",
    title: "40oz Insulated Stainless Tumbler",
    price: "$22.99",
    url: AMAZON_STOREFRONT,
    accent: ["#FF9900", "#F59E0B"],
    badge: "Trending",
  },
  {
    id: "amzn-game-controller",
    title: "Wireless Mobile Game Controller",
    price: "$26.99",
    url: AMAZON_STOREFRONT,
    accent: ["#146EB4", "#7C3AED"],
    badge: "Trending",
  },
  {
    id: "amzn-smart-watch",
    title: "Fitness Smart Watch (Heart Rate)",
    price: "$37.99",
    url: AMAZON_STOREFRONT,
    accent: ["#00A8E1", "#232F3E"],
    badge: "Bestseller",
  },
  {
    id: "amzn-sunset-lamp",
    title: "Sunset Projection Mood Lamp",
    price: "$18.99",
    url: AMAZON_STOREFRONT,
    accent: ["#FF9900", "#EC4899"],
    badge: "Viral",
  },
];
