/* ------------------------------------------------------------------ */
/*  Amazon sponsored products                                          */
/*                                                                      */
/*  Add/edit Amazon sponsors here — the Amazon rows on the home page    */
/*  and the Amazon section in search render whatever is in this array   */
/*  (and render NOTHING when it's empty, so the page stays clean if all */
/*  Amazon sponsors are removed).                                       */
/*                                                                      */
/*  For each product provide:                                           */
/*    title       — product name shown on the card                      */
/*    price       — display string, e.g. "$12.99"                       */
/*    url         — the Amazon affiliate link (opens on final checkout).*/
/*                  Defaults to AMAZON_STOREFRONT when omitted.          */
/*    image       — OPTIONAL path under /public/ads (e.g. "/ads/x.jpg").*/
/*                  If omitted, a branded category placeholder is shown. */
/*    icon        — OPTIONAL category glyph for the placeholder.         */
/*    accent      — OPTIONAL [from, to] gradient for the placeholder.    */
/*    badge       — OPTIONAL small tag, e.g. "Amazon's Choice".          */
/*    description — OPTIONAL short blurb shown in the in-app product     */
/*                  modal before the Buy-on-Amazon handoff.              */
/* ------------------------------------------------------------------ */

export type AmazonIcon =
  | "device"
  | "audio"
  | "power"
  | "light"
  | "home"
  | "wear";

export type AmazonProduct = {
  id: string;
  title: string;
  price: string;
  url: string;
  image?: string;
  icon?: AmazonIcon;
  accent?: [string, string];
  badge?: string;
  description?: string;
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
    p.description ?? "",
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

// Currently-trending, top-selling Amazon products (entertainment + lifestyle).
// Realistic titles/prices as placeholders — swap in the client's real product
// title/price/image/affiliate link when supplied.
export const AMAZON_PRODUCTS: AmazonProduct[] = [
  {
    id: "amzn-fire-tv-stick-4k-max",
    title: "Fire TV Stick 4K Max Streaming Device",
    price: "$59.99",
    url: AMAZON_STOREFRONT,
    icon: "device",
    accent: ["#FF9900", "#232F3E"],
    badge: "Amazon's Choice",
    description: "Stream in 4K Ultra HD with Wi-Fi 6E, Alexa Voice Remote, and access to Verza TV and every major app.",
  },
  {
    id: "amzn-echo-dot-5",
    title: "Echo Dot (5th Gen) Smart Speaker",
    price: "$49.99",
    url: AMAZON_STOREFRONT,
    icon: "audio",
    accent: ["#00A8E1", "#232F3E"],
    badge: "Bestseller",
    description: "Rich, vibrant sound with Alexa built in — control your smart home, play music, and set the mood for movie night.",
  },
  {
    id: "amzn-stanley-tumbler-40oz",
    title: "40oz Stainless Quencher Tumbler",
    price: "$45.00",
    url: AMAZON_STOREFRONT,
    icon: "home",
    accent: ["#EC4899", "#F59E0B"],
    badge: "Viral",
    description: "The tumbler that broke the internet — keeps drinks cold for hours, fits any cup holder, dozens of colors.",
  },
  {
    id: "amzn-airpods-pro-2",
    title: "AirPods Pro (2nd Gen, USB-C)",
    price: "$189.99",
    url: AMAZON_STOREFRONT,
    icon: "audio",
    accent: ["#00A8E1", "#146EB4"],
    badge: "Trending",
    description: "Up to 2x more active noise cancellation, adaptive audio, and all-day comfort for immersive binge sessions.",
  },
  {
    id: "amzn-anker-power-bank",
    title: "Anker 10,000mAh Portable Charger",
    price: "$21.99",
    url: AMAZON_STOREFRONT,
    icon: "power",
    accent: ["#22D3EE", "#3B82F6"],
    badge: "Prime deal",
    description: "Ultra-compact power bank that charges your phone up to 2x — never miss an episode on the go.",
  },
  {
    id: "amzn-mini-projector",
    title: "Mini 1080p Home Theater Projector",
    price: "$89.99",
    url: AMAZON_STOREFRONT,
    icon: "device",
    accent: ["#FF9900", "#146EB4"],
    badge: "Movie night",
    description: "Turn any wall into a big screen with a portable Full HD projector — perfect for Verza TV watch parties.",
  },
  {
    id: "amzn-govee-led-strip",
    title: "Govee Smart LED Strip Lights (100ft)",
    price: "$29.99",
    url: AMAZON_STOREFRONT,
    icon: "light",
    accent: ["#EC4899", "#8B5CF6"],
    badge: "Hot deal",
    description: "App- and voice-controlled RGB lighting with music sync — set the scene for every genre you stream.",
  },
  {
    id: "amzn-galaxy-projector",
    title: "Galaxy Star & Aurora Night Projector",
    price: "$27.99",
    url: AMAZON_STOREFRONT,
    icon: "light",
    accent: ["#146EB4", "#7C3AED"],
    badge: "Viral",
    description: "Fill your room with a starry aurora sky — the ambience upgrade that keeps going viral.",
  },
  {
    id: "amzn-cosori-air-fryer",
    title: "COSORI 5.8QT Air Fryer",
    price: "$99.99",
    url: AMAZON_STOREFRONT,
    icon: "home",
    accent: ["#FF9900", "#EF4444"],
    badge: "Bestseller",
    description: "Crispy snacks in minutes with 9 presets — the ultimate movie-night sidekick.",
  },
  {
    id: "amzn-sleep-headphones",
    title: "Bluetooth Sleep Headphones Headband",
    price: "$19.99",
    url: AMAZON_STOREFRONT,
    icon: "audio",
    accent: ["#8B5CF6", "#22D3EE"],
    badge: "Trending",
    description: "Ultra-thin speakers in a soft headband — stream shows or podcasts comfortably in bed.",
  },
  {
    id: "amzn-ring-light-tripod",
    title: "Ring Light with Adjustable Tripod",
    price: "$28.99",
    url: AMAZON_STOREFRONT,
    icon: "light",
    accent: ["#FF9900", "#00A8E1"],
    badge: "Creator pick",
    description: "Studio-quality lighting with phone mount — the go-to kit for Verza creators filming content.",
  },
  {
    id: "amzn-owala-bottle",
    title: "Owala FreeSip Insulated Water Bottle",
    price: "$27.99",
    url: AMAZON_STOREFRONT,
    icon: "home",
    accent: ["#22D3EE", "#7C3AED"],
    badge: "Viral",
    description: "Sip or swig with the patented FreeSip spout — stays cold for 24 hours in trendy colorways.",
  },
  {
    id: "amzn-blue-light-glasses",
    title: "Blue-Light Blocking Glasses (2-Pack)",
    price: "$16.99",
    url: AMAZON_STOREFRONT,
    icon: "wear",
    accent: ["#146EB4", "#232F3E"],
    badge: "Binge-ready",
    description: "Reduce eye strain during long binge sessions with lightweight anti-glare frames.",
  },
  {
    id: "amzn-bt-speaker",
    title: "Waterproof Portable Bluetooth Speaker",
    price: "$49.95",
    url: AMAZON_STOREFRONT,
    icon: "audio",
    accent: ["#F59E0B", "#EF4444"],
    badge: "Bestseller",
    description: "Big, bold sound that's IPX7 waterproof and clips anywhere — bring the soundtrack everywhere.",
  },
  {
    id: "amzn-smart-watch",
    title: "Fitness Smart Watch (Heart Rate, GPS)",
    price: "$39.99",
    url: AMAZON_STOREFRONT,
    icon: "wear",
    accent: ["#00A8E1", "#232F3E"],
    badge: "Trending",
    description: "Track workouts, sleep, and notifications with a bright always-on display and week-long battery.",
  },
  {
    id: "amzn-hoodie-blanket",
    title: "Oversized Wearable Hoodie Blanket",
    price: "$32.99",
    url: AMAZON_STOREFRONT,
    icon: "wear",
    accent: ["#FF9900", "#F59E0B"],
    badge: "Cozy binge",
    description: "Ultra-soft sherpa hoodie blanket with a giant front pocket — peak cozy for a binge marathon.",
  },
];
