import { TAB_EXCLUSIVE_CATEGORIES, type BrowseCategory, type Series } from "@/lib/catalog";

/**
 * Who belongs in a GENERIC genre hub.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * Genre hubs match on the free-text `genre` string, so a title reaches
 * /discover/drama by containing the word "Drama". That is how five Spanish
 * titles ("Drama · Pasión", "Drama · Traición", "Romance · Drama") and six
 * Hindi ones ("Romance · Comedy", "Thriller · Romance") were showing up in
 * English genre browsing — measured before this change:
 *
 *   /discover/drama     32 titles,  4 Spanish, 2 Hindi
 *   /discover/romance   46 titles,  3 Spanish, 6 Hindi
 *   /genres/romance     69 titles,  5 Spanish, 6 Hindi
 *   ...22 of the 27 /genres hubs leaked at all
 *
 * The browse tabs had already been separated — Español and Bollywood titles
 * are kept out of the Drama grid — but the genre hubs are a second, older path
 * into the same catalogue and never got the rule. The product decision is that
 * a free-text genre word must not override a title's language-tab
 * exclusivity.
 *
 * THE CONDITIONAL PART, WHICH IS THE WHOLE TRICK
 * ----------------------------------------------
 * A hub must not exclude its OWN category, or the exclusion eats the hub. This
 * is not hypothetical for /discover/reality (3 titles today) or
 * /discover/music (1): a blanket exclusion would empty both. So a hub drops
 * every tab-exclusive category EXCEPT the one it is a hub for.
 *
 * (/discover/espanol and /discover/bollywood already render 0 for an unrelated
 * reason — no title's genre string contains the word "espanol" — so they are
 * SEO shells like /discover/popular. This function does not make that worse,
 * and would do the right thing if those hubs ever matched by category.)
 *
 * NOT APPLIED TO SEARCH. Someone typing a title's name must find it, whatever
 * language it is in; hiding it there would be a bug, not a policy. Search
 * shows the audio language instead. See docs/VERZA_GENRE_LANGUAGE_PARITY.md.
 *
 * Derived from TAB_EXCLUSIVE_CATEGORIES, never a slug list: the category IS
 * the tab, so a new language tab is covered the day it is added, and no
 * hand-maintained list can go stale.
 */
export function isGenreHubEligible(series: Series, hubSlug: string): boolean {
  const own = hubSlug.toLowerCase() as BrowseCategory;
  return !TAB_EXCLUSIVE_CATEGORIES.some(
    (category) => category !== own && series.categories.includes(category),
  );
}

/** Filter a genre hub's matches down to the titles that belong in it. */
export function forGenreHub<T extends Series>(matches: T[], hubSlug: string): T[] {
  return matches.filter((series) => isGenreHubEligible(series, hubSlug));
}
