"use client";

import Link from "next/link";
import type { CSSProperties, MouseEvent, ReactNode } from "react";
import { startInstantPlayer } from "@/lib/instant-player";

interface Props {
  href: string;
  /**
   * Public playback id of the episode this link opens, resolved on the SERVER
   * and only ever for a free episode. Undefined for a paid episode: its
   * capability is withheld from the public projection entirely (AGENTS.md rule
   * 8) and EpisodeFeed obtains an authorized, expiring source after navigation.
   * Resolved server-side so the 4,900-row public Mux map stays out of this
   * page's client bundle.
   */
  playbackId?: string;
  /** CSS selector for the poster this page has already painted. */
  posterSelector?: string;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}

/* ------------------------------------------------------------------ */
/*  The show page's play CTA — and the ONLY browse-side surface that     */
/*  still prewarms the player.                                          */
/*                                                                      */
/*  BUG THIS PREVENTS: the prewarm (lib/instant-player.ts) appends a     */
/*  hidden <video>, attaches hls.js and starts downloading the moment a  */
/*  link is clicked, on the assumption that the very next page is        */
/*  EpisodeFeed, which ADOPTS the running element. Routing every poster  */
/*  to the show page instead broke that assumption: nothing on the show  */
/*  page adopts it, so every tile tap would have downloaded a stream     */
/*  nobody watches for the full 12s TTL, then thrown it away — on        */
/*  cellular, for every tap, including taps that never reach the player. */
/*  It also seeds sessionStorage["verza-transition"], which the NEXT     */
/*  EpisodeFeed to mount within 15s consumes; a seed written on a        */
/*  navigation that never entered the player is a poster from the wrong  */
/*  title waiting to flash on the next one.                              */
/*                                                                      */
/*  So the prewarm moved with the navigation. It now fires here, on the  */
/*  one control whose destination really is the player, which keeps      */
/*  click-to-first-frame exactly as fast as it was before the show page  */
/*  became the front door.                                              */
/* ------------------------------------------------------------------ */
export default function PlayNowLink({
  href,
  playbackId,
  posterSelector = ".series-hero img",
  className,
  style,
  children,
}: Props) {
  function onClick(e: MouseEvent<HTMLAnchorElement>) {
    // Modified clicks (open in new tab, etc.) get default browser behavior —
    // don't spin up a hidden player for a tab the user isn't watching.
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;

    // The poster this page already painted doubles as the player's loading
    // state (user preference: poster > black). Read the rendered <img> rather
    // than series.posterUrl so we hand over the exact next/image URL that is
    // already in the browser cache — the raw path is a different URL and would
    // cost a fresh request at the worst possible moment.
    try {
      const img = document.querySelector(posterSelector) as HTMLImageElement | null;
      const src = img?.currentSrc || img?.src;
      if (src) sessionStorage.setItem("verza-transition", JSON.stringify({ src, ts: Date.now() }));
    } catch {}

    // No-ops when playbackId is undefined, which is the paid-episode case.
    startInstantPlayer(playbackId);
  }

  return (
    <Link href={href} className={className} style={style} onClick={onClick}>
      {children}
    </Link>
  );
}
