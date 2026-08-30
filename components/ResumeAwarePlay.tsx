"use client";

import { useEffect, useState } from "react";
import PlayNowLink from "@/components/PlayNowLink";
import { buildResumeUrl } from "@/lib/resume";
import { readGuestProgress } from "@/lib/guest-storage";

interface Props {
  slug: string;
  /** Where to go when there is no progress to resume. */
  fallbackHref: string;
  playbackId?: string;
  className?: string;
  style?: React.CSSProperties;
  /** Label when starting from the beginning. */
  startLabel: string;
}

/* ------------------------------------------------------------------ */
/*  The show page's play CTA, aware of where the viewer stopped.        */
/*                                                                      */
/*  Resume used to exist in exactly one place: the Continue Watching     */
/*  row on the browse page. Open the same title from a poster, from      */
/*  search or from a Google result and the show page offered "Watch      */
/*  Episode 1 Free" as though nothing had been watched — the product     */
/*  remembered the viewer on one surface and forgot them on another.     */
/*                                                                      */
/*  This is deliberately the SAME button in the SAME position with the   */
/*  same styling. Only the destination and the label change, and only    */
/*  when there is real progress to resume. Nothing is added to the page  */
/*  and nothing moves.                                                   */
/*                                                                      */
/*  It renders the start state on the server and corrects after mount,   */
/*  because progress lives on the device for a signed-out viewer and     */
/*  cannot be known while rendering. The start state is the safe one to  */
/*  be briefly wrong about: it is what the button said before.           */
/* ------------------------------------------------------------------ */
export default function ResumeAwarePlay({
  slug,
  fallbackHref,
  playbackId,
  className,
  style,
  startLabel,
}: Props) {
  const [resume, setResume] = useState<{ episode: number; seconds: number } | null>(null);

  useEffect(() => {
    let cancelled = false;

    // Device first: it is the only source a signed-out viewer has, and it
    // answers synchronously so the correction lands in one frame.
    try {
      const rows = readGuestProgress().filter((r) => r.seriesSlug === slug && !r.completed);
      const newest = rows.sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))[0];
      if (newest && newest.progressSeconds > 5) {
        // Deferred: a synchronous setState inside an effect cascades renders,
        // and this one runs on every show page mount.
        queueMicrotask(() => {
          if (!cancelled) setResume({ episode: newest.episodeNumber, seconds: newest.progressSeconds });
        });
      }
    } catch {
      /* Storage can be blocked outright, in which case there is nothing to
         resume from and the start state is correct. */
    }

    // Then the account, which wins when it has anything to say — the same
    // precedence mergeContinueWatching applies on the browse rail.
    fetch("/api/watch-progress")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { items?: { seriesSlug: string; episodeNumber: number; progressSeconds: number }[] } | null) => {
        if (cancelled || !d?.items) return;
        const row = d.items.find((i) => i.seriesSlug === slug);
        if (row && row.progressSeconds > 5) {
          setResume({ episode: row.episodeNumber, seconds: row.progressSeconds });
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [slug]);

  const href = resume ? buildResumeUrl(slug, resume.episode, resume.seconds) : fallbackHref;
  const label = resume ? `Resume Episode ${resume.episode}` : startLabel;

  return (
    <PlayNowLink href={href} playbackId={resume ? undefined : playbackId} className={className} style={style}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff" stroke="none">
        <polygon points="6 3 20 12 6 21" />
      </svg>
      {label}
    </PlayNowLink>
  );
}
