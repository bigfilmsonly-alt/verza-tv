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

export const SPONSORED_PRODUCTS: SponsoredProduct[] = [
  {
    id: "viral-skincare-set",
    title: "Viral Vitamin-C Skincare Set",
    price: "$18.99",
    url: "https://www.tiktok.com/shop",
    accent: ["#FF2D78", "#8B5CF6"],
    badge: "Trending",
  },
  {
    id: "wireless-earbuds",
    title: "Noise-Cancelling Wireless Earbuds",
    price: "$24.99",
    url: "https://www.tiktok.com/shop",
    accent: ["#22D3EE", "#3B82F6"],
    badge: "Bestseller",
  },
  {
    id: "led-strip-lights",
    title: "Smart RGB LED Strip Lights (50ft)",
    price: "$15.99",
    url: "https://www.tiktok.com/shop",
    accent: ["#F59E0B", "#EF4444"],
    badge: "Hot deal",
  },
];
