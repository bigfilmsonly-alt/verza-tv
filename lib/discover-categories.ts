import { BROWSE_TABS } from "@/lib/catalog";

/**
 * Canonical, indexable `/discover/[genre]` route slugs.
 *
 * Browse tabs come from the shared catalog. Editorial genre pages extend that
 * set, and Set keeps both generateStaticParams and the XML sitemap duplicate-
 * free if a future catalog tab promotes one of those editorial genres.
 */
const EDITORIAL_DISCOVER_CATEGORY_SLUGS = [
  "new",
  "romance",
  "thriller",
  "comedy",
  "mystery",
  "sci-fi",
  "horror",
  "crime",
  "fantasy",
] as const;

export const DISCOVER_CATEGORY_SLUGS: readonly string[] = Object.freeze([
  ...new Set<string>([
    ...BROWSE_TABS.map((tab) => tab.key),
    ...EDITORIAL_DISCOVER_CATEGORY_SLUGS,
  ]),
]);
