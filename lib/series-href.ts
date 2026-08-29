import { getSeriesBySlug, type Series } from "./catalog";

/* ------------------------------------------------------------------ */
/*  Routing — where a link to a title goes.                             */
/*                                                                      */
/*  BUG THIS PREVENTS: for 70 days every browse tile, hero, category row */
/*  and search result hard-coded `/series/<slug>/1` — the player — as a   */
/*  string literal, repeated at a dozen independent call sites (commit    */
/*  42d9d15, "All posters -> instant play (episode 1), no detail page").  */
/*  There was no shared helper, so there was no single place the policy   */
/*  lived and no way to change it once. The 91 show pages — the only      */
/*  surface carrying the synopsis, the cast, the "First N Episodes FREE"  */
/*  badge and the $1.99 Series Unlock card — stayed reachable from Google */
/*  and from nothing inside the product. Measured on production          */
/*  2026-08-29: the home page's real DOM held 25 links ending in /1 and    */
/*  zero show-page links, while its <noscript> block held 107 show-page   */
/*  links and zero player links. The crawler got the merchandising; the   */
/*  paying customer did not.                                             */
/*                                                                      */
/*  The one code path that ever chose /series/<slug> was BrowsePage's     */
/*  coming-soon arm, keyed on `status === "coming_soon"` — which is 1:1   */
/*  with "has no video". So the sales page was reachable exactly when     */
/*  there was nothing to sell. That is what made the Bollywood tab read   */
/*  as inverted: its four unsellable tiles opened their description page  */
/*  and its six sellable ones skipped straight past it.                  */
/*                                                                      */
/*  The cause was the ABSENCE of a shared decision, not any one literal.  */
/*  These two functions are that decision. Call them; do not write the    */
/*  string. scripts/test-feed-integrity.mjs fails the build if a surface  */
/*  writes it instead.                                                   */
/*                                                                      */
/*  Why this lives here and not in lib/catalog.ts, where the rest of the  */
/*  catalog helpers live: scripts/generate-public-mux-map.mjs fingerprints */
/*  the RAW SOURCE TEXT of lib/catalog.ts (sourceHash() hashes            */
/*  lib/mux-map.ts + lib/catalog.ts), and npm run test:playback-security  */
/*  fails the moment that fingerprint stops matching the generated        */
/*  lib/mux-public-map.ts and lib/mux-signed-map.ts headers. Adding two   */
/*  functions there — or even correcting a comment — reddens a required   */
/*  release gate until both projections are regenerated in lockstep, and  */
/*  the signed half needs Mux credentials plus a matching regeneration in */
/*  ../verza-native to stay byte-identical (AGENTS.md rule 12). Verified  */
/*  both ways on 2026-08-29: the gate PASSes with catalog.ts at HEAD and  */
/*  FAILs with two functions appended to it. Keep lib/catalog.ts          */
/*  byte-stable; put derived logic in its own module.                     */
/* ------------------------------------------------------------------ */

/**
 * The front door for a title: its show page.
 *
 * Live or coming soon, the answer is the same URL — which is precisely why a
 * tile can no longer route by playability. Playback begins from an explicit
 * action on the show page, never from a poster tap.
 *
 * The five coming-soon rows genuinely have a page here. `dynamicParams` is set
 * nowhere in this repo, so Next's default `true` applies: /series/<slug> is not
 * prebuilt for them (generateStaticParams filters on status "live") but it
 * renders on demand and then caches. Verified 200 on production for all five.
 * The comment block at lib/catalog.ts:1187-1196 claims the opposite — "no URL
 * resolves", "inert tiles: no <Link>". It was falsified five minutes after it
 * was written (951dbbb -> 67fe50c) and never updated. Do not act on it; acting
 * on it ships five live 404s on two revenue tabs.
 */
export function seriesHref(series: Series | string): string {
  return `/series/${typeof series === "string" ? series : series.slug}`;
}

/**
 * A genuine episode URL — a resume tile, the show page's own play CTA, a clip
 * deep link. These still land in the player at that episode, and an unentitled
 * viewer still meets the paywall there. That was shipped in Severity 1 and is
 * correct; this helper preserves it.
 *
 * Falls back to the show page when the row has no video, because
 * `/series/<slug>/N` is a real 404 for such a row: getEpisodesForSeries()
 * returns [] at episodeCount 0, getEpisode() is then undefined, and
 * app/series/[slug]/[episode]/page.tsx calls notFound(). The five coming-soon
 * rows hit that, and so does any stale saved-progress row pointing at one. The
 * guard belongs here so no caller has to remember it.
 */
export function episodeHref(series: Series | string, episode: number): string {
  const slug = typeof series === "string" ? series : series.slug;
  const row = typeof series === "string" ? getSeriesBySlug(series) : series;
  if (!row || row.episodeCount < 1 || !Number.isFinite(episode) || episode < 1) {
    return `/series/${slug}`;
  }
  return `/series/${slug}/${Math.floor(episode)}`;
}
