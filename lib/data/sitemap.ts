/* ------------------------------------------------------------------ */
/*  Master sitemap registry — single source of truth for the footer    */
/*  "Sitemap" dropdown, the HTML /sitemap page, and the XML sitemap.    */
/* ------------------------------------------------------------------ */

import { LOCATIONS } from "@/lib/data/locations";
import { COLLECTIONS } from "@/lib/data/collections";
import { BEST_LISTS } from "@/lib/data/best-lists";
import { GUIDES } from "@/lib/data/guides";
import { COMPARISONS } from "@/lib/data/compare";
import { ALAN_SUBPAGES } from "@/lib/data/alan";
import { getApprovedGenreHubs } from "@/lib/content/genres";

export interface SitemapLink {
  label: string;
  href: string;
  external?: boolean;
}

export interface SitemapSection {
  title: string;
  /** Hub link for the whole section (optional). */
  hub?: SitemapLink;
  links: SitemapLink[];
}

const approvedGenres = getApprovedGenreHubs();

/* ------------------------------------------------------------------ */
/*  Curated sections — drive the footer dropdown + the HTML /sitemap.   */
/*  Each links to its hub + the most important children.               */
/* ------------------------------------------------------------------ */

export const SITEMAP_SECTIONS: SitemapSection[] = [
  {
    title: "Watch",
    links: [
      { label: "Browse", href: "/discover" },
      { label: "Channels", href: "/channels" },
      { label: "Shorts", href: "/shorts" },
      { label: "Search", href: "/search" },
      { label: "Collections", href: "/collections" },
      { label: "Best Of", href: "/best" },
    ],
  },
  {
    title: "Genres",
    hub: { label: "All Genres", href: "/genres" },
    links: [
      ...approvedGenres.slice(0, 9).map((g) => ({
        label: g.name,
        href: `/genres/${g.slug}`,
      })),
      { label: "All Genres", href: "/genres" },
    ],
  },
  {
    title: "Collections",
    hub: { label: "All Collections", href: "/collections" },
    links: [
      ...COLLECTIONS.slice(0, 6).map((c) => ({
        label: c.title,
        href: `/collections/${c.slug}`,
      })),
      { label: "All Collections", href: "/collections" },
    ],
  },
  {
    title: "Best Of",
    hub: { label: "All Best-Of Lists", href: "/best" },
    links: [
      ...BEST_LISTS.slice(0, 6).map((b) => ({
        label: b.title,
        href: `/best/${b.slug}`,
      })),
      { label: "All Best-Of Lists", href: "/best" },
    ],
  },
  {
    title: "Guides & Compare",
    hub: { label: "All Guides", href: "/guides" },
    links: [
      ...GUIDES.slice(0, 5).map((g) => ({
        label: g.title,
        href: `/guides/${g.slug}`,
      })),
      ...COMPARISONS.slice(0, 2).map((c) => ({
        label: c.title,
        href: `/compare/${c.slug}`,
      })),
      { label: "All Guides", href: "/guides" },
      { label: "Compare", href: "/compare" },
    ],
  },
  {
    title: "Watch In",
    hub: { label: "All Locations", href: "/watch-in" },
    links: [
      ...LOCATIONS.filter((l) => l.type === "city")
        .slice(0, 6)
        .map((l) => ({ label: l.name, href: `/watch-in/${l.slug}` })),
      ...LOCATIONS.filter((l) => l.type === "country")
        .slice(0, 3)
        .map((l) => ({ label: l.name, href: `/watch-in/${l.slug}` })),
      { label: "All Locations", href: "/watch-in" },
    ],
  },
  {
    title: "Company",
    hub: { label: "About", href: "/about" },
    links: [
      { label: "About", href: "/about" },
      { label: "Company", href: "/company" },
      { label: "Newsroom", href: "/newsroom" },
      { label: "Careers", href: "/careers" },
      { label: "Investors", href: "/investors" },
      { label: "Partnerships", href: "/partnerships" },
      { label: "Leadership", href: "/leadership" },
      { label: "Press", href: "/press" },
      { label: "Media Kit", href: "/media-kit" },
      { label: "Brand Assets", href: "/brand-assets" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Founder — Alan Mruvka",
    hub: { label: "Alan Mruvka", href: "/alan-mruvka" },
    links: [
      { label: "Alan Mruvka", href: "/alan-mruvka" },
      ...ALAN_SUBPAGES.map((s) => ({
        label: s.title,
        href: `/alan-mruvka/${s.slug}`,
      })),
      { label: "Founder's Note", href: "/founder" },
    ],
  },
  {
    title: "For Creators",
    links: [
      { label: "Creator Studio", href: "/studio" },
      { label: "Apply to Create", href: "/studio" },
    ],
  },
  {
    title: "Shop",
    hub: { label: "Shop All", href: "/shop" },
    links: [{ label: "Shop All", href: "/shop" }],
  },
  {
    title: "Shorts & Social",
    links: [
      { label: "Shorts Feed", href: "/shorts" },
      { label: "TikTok", href: "https://www.tiktok.com/@verzatv", external: true },
      { label: "Instagram", href: "https://www.instagram.com/verzatv", external: true },
      { label: "YouTube", href: "https://www.youtube.com/@VerzaTV", external: true },
      { label: "X", href: "https://x.com/VerzaTV", external: true },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Help Center", href: "/help" },
      { label: "Search", href: "/search" },
      { label: "Contact", href: "/contact" },
      { label: "Editorial Standards", href: "/editorial-standards" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms of Service", href: "/terms" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Refund Policy", href: "/refund-policy" },
      { label: "Sitemap", href: "/sitemap" },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Full enumerations — drive the complete HTML /sitemap page lists.    */
/* ------------------------------------------------------------------ */

export const SITEMAP_FULL: SitemapSection[] = [
  {
    title: "All Genres",
    links: approvedGenres.map((g) => ({
      label: g.name,
      href: `/genres/${g.slug}`,
    })),
  },
  {
    title: "All Collections",
    links: COLLECTIONS.map((c) => ({
      label: c.title,
      href: `/collections/${c.slug}`,
    })),
  },
  {
    title: "All Best-Of Lists",
    links: BEST_LISTS.map((b) => ({
      label: b.title,
      href: `/best/${b.slug}`,
    })),
  },
  {
    title: "Guides",
    links: GUIDES.map((g) => ({ label: g.title, href: `/guides/${g.slug}` })),
  },
  {
    title: "Compare",
    links: COMPARISONS.map((c) => ({
      label: c.title,
      href: `/compare/${c.slug}`,
    })),
  },
  {
    title: "Watch In — Cities",
    links: LOCATIONS.filter((l) => l.type === "city").map((l) => ({
      label: l.name,
      href: `/watch-in/${l.slug}`,
    })),
  },
  {
    title: "Watch In — States",
    links: LOCATIONS.filter((l) => l.type === "state").map((l) => ({
      label: l.name,
      href: `/watch-in/${l.slug}`,
    })),
  },
  {
    title: "Watch In — Countries",
    links: LOCATIONS.filter((l) => l.type === "country").map((l) => ({
      label: l.name,
      href: `/watch-in/${l.slug}`,
    })),
  },
  {
    title: "Founder — Alan Mruvka",
    links: [
      { label: "Alan Mruvka", href: "/alan-mruvka" },
      ...ALAN_SUBPAGES.map((s) => ({
        label: s.title,
        href: `/alan-mruvka/${s.slug}`,
      })),
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Flat URL list for the XML sitemap.                                 */
/* ------------------------------------------------------------------ */

export function allProgrammaticPaths(): { loc: string; priority: string; changefreq: string }[] {
  const out: { loc: string; priority: string; changefreq: string }[] = [];

  // Static hubs created this session
  for (const loc of [
    "/genres",
    "/collections",
    "/best",
    "/guides",
    "/compare",
    "/watch-in",
    "/newsroom",
    "/careers",
    "/investors",
    "/partnerships",
    "/leadership",
    "/brand-assets",
    "/alan-mruvka",
    "/sitemap",
  ]) {
    out.push({ loc, priority: "0.6", changefreq: "weekly" });
  }

  for (const g of approvedGenres)
    out.push({ loc: `/genres/${g.slug}`, priority: "0.7", changefreq: "weekly" });
  for (const c of COLLECTIONS)
    out.push({ loc: `/collections/${c.slug}`, priority: "0.7", changefreq: "weekly" });
  for (const b of BEST_LISTS)
    out.push({ loc: `/best/${b.slug}`, priority: "0.7", changefreq: "weekly" });
  for (const g of GUIDES)
    out.push({ loc: `/guides/${g.slug}`, priority: "0.6", changefreq: "monthly" });
  for (const c of COMPARISONS)
    out.push({ loc: `/compare/${c.slug}`, priority: "0.6", changefreq: "monthly" });
  for (const l of LOCATIONS)
    out.push({ loc: `/watch-in/${l.slug}`, priority: "0.6", changefreq: "weekly" });
  for (const s of ALAN_SUBPAGES)
    out.push({ loc: `/alan-mruvka/${s.slug}`, priority: "0.6", changefreq: "monthly" });

  return out;
}
