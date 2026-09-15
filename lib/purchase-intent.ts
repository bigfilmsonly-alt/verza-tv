/* ==================================================================== */
/*  Purchase intent carried through the sign-in hop                      */
/* ==================================================================== */

import { getSeriesBySlug, type Series } from "@/lib/catalog";

/**
 * Must stay identical to `UNLOCK_INTENT_PARAM` in `lib/checkout-auth.ts`.
 *
 * It is duplicated rather than imported because that module is `"use client"`
 * and this one is read by the sign-in Server Component. The duplication is
 * pinned by an assertion in `scripts/test-purchase-ux.mjs`, so the two cannot
 * drift apart silently.
 */
const UNLOCK_INTENT_VALUE = "resume_unlock";

/**
 * Read purchase intent out of a `?next=` destination.
 *
 * The viewer reaches /sign-in because they tapped Unlock while signed out, and
 * the sign-in screen has to be able to say WHICH story they are buying. That
 * information is only available here, in the return path.
 *
 * Three rules make reading it safe:
 *
 *  1. `next` is accepted only as a same-origin path, the same test the auth
 *     guard applies before it navigates. An absolute or protocol-relative
 *     destination is refused outright.
 *  2. The slug is a LOOKUP KEY, never display text. Whatever it contains, the
 *     title and episode count rendered on screen come from our own catalog, so
 *     a crafted link cannot put attacker-chosen words on a Verza page.
 *  3. An unknown or non-live slug returns null and the page falls back to the
 *     ordinary sign-in screen. It never invents a title.
 *
 * This does NOT decide what gets purchased. The resuming component still reads
 * the series from its own props, so this is presentation only: the worst a
 * crafted link can do is show a real catalog title the viewer then does not
 * buy.
 */
export function purchaseIntentFromNext(next: string | undefined | null): Series | null {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return null;

  let path: URL;
  try {
    /* Base is a throwaway. `next` is already proven to be a path, and parsing
       it relative to any origin gives us pathname + searchParams without
       hand-rolling a query-string parser. */
    path = new URL(next, "https://verza.invalid");
  } catch {
    return null;
  }

  if (path.searchParams.get(UNLOCK_INTENT_VALUE) !== "1") return null;

  const match = /^\/series\/([^/]+)/.exec(path.pathname);
  if (!match) return null;

  let slug: string;
  try {
    slug = decodeURIComponent(match[1]);
  } catch {
    return null;
  }

  const series = getSeriesBySlug(slug);
  if (!series || series.status !== "live") return null;

  /* A wholly free title has nothing to sell. Showing it a purchase card would
     promise a transaction that cannot happen. */
  if (series.freeEpisodes >= series.episodeCount) return null;

  return series;
}

/**
 * Where "Back" should go from purchase-intent sign-in.
 *
 * It must NOT be `next` as-is. `next` still carries the resume marker, and a
 * signed-out viewer landing on it would trip the resume effect in EpisodeFeed,
 * fail the auth guard again and be thrown straight back to this screen. Back
 * would look broken and the viewer would be stuck in a bounce.
 *
 * Stripping the marker returns them to the episode they were watching, with the
 * paywall still there and the Unlock button still one tap away.
 */
export function intentBackPath(next: string | undefined | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/";
  try {
    const url = new URL(next, "https://verza.invalid");
    url.searchParams.delete(UNLOCK_INTENT_VALUE);
    const path = `${url.pathname}${url.search}`;
    return path.startsWith("/") && !path.startsWith("//") ? path : "/";
  } catch {
    return "/";
  }
}
