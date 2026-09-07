import { TAB_EXCLUSIVE_CATEGORIES, type BrowseCategory, type Series } from "@/lib/catalog";
import { isLanguageCategory } from "@/lib/audio-language";

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
 * (/discover/espanol and /discover/bollywood used to render 0 for an unrelated
 * reason — no title's genre string contains the word "espanol" — so they were
 * SEO shells like /discover/popular. `hubMatches` below now matches those two
 * by category, which is what this function was already written to accommodate.)
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

/**
 * Whether a title is a CANDIDATE for a hub, before eligibility is applied.
 *
 * Two rules, because there are two kinds of hub:
 *
 *   language hub  — membership is the category. A Spanish title's genre reads
 *                   "Drama · Pasión" and a Hindi one's reads "Romance ·
 *                   Comedy", so an English slug can never appear in either.
 *                   /discover/espanol and /discover/bollywood listed 0 live
 *                   series for exactly this reason while 5 and 6 were live,
 *                   on pages that are indexed and in genres.xml.
 *   genre hub     — membership is the free-text genre string, unchanged.
 *                   "romance" still matches "Mystery romance".
 *
 * Deliberately NOT a union of the two. Matching every hub by category as well
 * would take /discover/drama from 25 titles to 76 and refill /discover/popular,
 * the retired Hot tab, with 10 — rewriting two indexed pages Google already
 * holds to fix two others. Measured before choosing; the narrow rule changes
 * espanol and bollywood and nothing else.
 */
export function hubMatches(series: Series, hubSlug: string): boolean {
  if (isLanguageCategory(hubSlug)) return series.categories.includes(hubSlug);
  return series.genre.toLowerCase().includes(hubSlug.toLowerCase());
}

/** Everything that belongs in a hub: candidates, then the eligibility rule. */
export function seriesForHub<T extends Series>(pool: T[], hubSlug: string): T[] {
  return forGenreHub(pool.filter((series) => hubMatches(series, hubSlug)), hubSlug);
}
