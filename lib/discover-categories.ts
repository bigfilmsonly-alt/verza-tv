import { BROWSE_TABS } from "@/lib/catalog";

/**
 * Canonical, indexable `/discover/[genre]` route slugs.
 *
 * Browse tabs come from the shared catalog. Editorial genre pages extend that
 * set, and Set keeps both generateStaticParams and the XML sitemap duplicate-
 * free if a future catalog tab promotes one of those editorial genres.
 */
const EDITORIAL_DISCOVER_CATEGORY_SLUGS = [
  // "new" and "popular" are here because they USED to be browse tabs and their
  // /discover pages are indexed and sitemapped. A slug that reaches this list by
  // being a tab silently loses its route the day the tab goes away — dropping it
  // out of generateStaticParams AND out of genres.xml, so a live indexed URL
  // starts 404ing with nothing failing locally. Retiring a tab means moving its
  // slug down here, not deleting it.
  "new",
  "popular",
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
