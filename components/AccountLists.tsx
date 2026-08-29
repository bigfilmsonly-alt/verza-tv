"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { T } from "@/lib/theme";
import { getSeriesBySlug, getEpisode } from "@/lib/catalog";
import { posterHref } from "@/lib/series-href";
import { buildResumeUrl } from "@/lib/resume";
import { readSavedSlugs, writeSavedSlugs, setSavedSlug } from "@/lib/guest-storage";
import { mergeContinueWatching, type ContinueWatchingItem } from "@/lib/continue-watching";
import { useTranslation } from "@/components/LangProvider";
import EmptyState from "@/components/EmptyState";

/* ------------------------------------------------------------------ */
/*  The two account lists, in one place.                                */
/*                                                                      */
/*  BUG THIS FIXES: there were three "My List" surfaces and two of them  */
/*  were shells. app/me/list/page.tsx rendered a HARD-CODED empty state  */
/*  for both of its tabs — no fetch, no storage read, no props — so it   */
/*  said "No saved shows yet. Tap the bookmark icon on any show to add   */
/*  it here" to a viewer who had just bookmarked six shows, forever. The */
/*  /me menu's "Continue Watching" row pointed at "/" and its "Purchase  */
/*  History" row pointed at "/me", its own URL, with the string "No      */
/*  purchases" hard-coded beside it.                                     */
/*                                                                      */
/*  Only components/LibraryPage.tsx ever read anything, and it was the   */
/*  one surface nothing in the account menu linked to by tab.            */
/* ------------------------------------------------------------------ */

export interface SavedItem {
  seriesSlug: string;
  seriesTitle: string;
  posterUrl: string;
  episodeCount: number;
  genre: string;
  savedAt: string;
}

/* The empty states below use components/EmptyState — E's component, lifted
   verbatim from the Anime tab's card, which testers singled out as the model
   for the whole app. This file originally carried its own near-copy of that
   card; a second implementation of "nothing here yet" is exactly what the
   shared component exists to prevent. */

function ListSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex gap-3 p-3 rounded-xl animate-pulse" style={{ background: T.surface }}>
          <div className="w-[72px] h-[108px] rounded-lg flex-shrink-0" style={{ background: T.raised }} />
          <div className="flex-1 py-2">
            <div className="h-4 w-3/4 rounded mb-2" style={{ background: T.raised }} />
            <div className="h-3 w-1/2 rounded" style={{ background: T.raised }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* A bookmark instead of the default clock: this list is not empty because
   something is late, it is empty because nothing has been bookmarked. Same
   20px stroke weight and same #F5F4F8 as EmptyState's own glyph. */
const BookmarkGlyph = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F5F4F8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
  </svg>
);

/* ------------------------------------------------------------------ */
/*  Saved shows                                                         */
/* ------------------------------------------------------------------ */

/** Build rows for slugs this device remembers, dropping anything unknown. */
function itemsFromSlugs(slugs: string[]): SavedItem[] {
  return slugs.flatMap((slug) => {
    const series = getSeriesBySlug(slug);
    if (!series) return [];
    return [
      {
        seriesSlug: slug,
        seriesTitle: series.title,
        posterUrl: series.posterUrl,
        episodeCount: series.episodeCount,
        genre: series.genre,
        savedAt: new Date().toISOString(),
      },
    ];
  });
}

export function SavedShowsList() {
  const { t } = useTranslation();
  const [items, setItems] = useState<SavedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    function fallbackToDevice() {
      if (cancelled) return;
      setItems(itemsFromSlugs(readSavedSlugs()));
      setLoading(false);
    }

    fetch("/api/saved-list")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { items?: SavedItem[] } | null) => {
        if (cancelled) return;
        if (data?.items && data.items.length > 0) {
          setItems(data.items);
          // Keep the device mirror in step with the account, so the bookmark
          // icon in the player is right on the next title the viewer opens.
          writeSavedSlugs(data.items.map((i) => i.seriesSlug));
          setLoading(false);
          return;
        }
        fallbackToDevice();
      })
      .catch(fallbackToDevice);

    return () => { cancelled = true; };
  }, []);

  const handleRemove = useCallback((slug: string) => {
    setItems((prev) => prev.filter((i) => i.seriesSlug !== slug));
    setSavedSlug(slug, false);
    fetch("/api/saved-list", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ seriesSlug: slug }),
    }).catch(() => {});
  }, []);

  if (loading) return <ListSkeleton />;

  if (items.length === 0) {
    return (
      <EmptyState
        glyph={BookmarkGlyph}
        title={t("library.noSavedShows")}
        body="Tap the bookmark on any show and it lands here. Saved on this device straight away, and on your account the moment you sign in."
        action={{ label: t("library.browseShows"), href: "/" }}
        className="py-6"
        constrain={false}
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => (
        <div
          key={item.seriesSlug}
          className="flex gap-3 rounded-xl overflow-hidden"
          style={{ background: T.surface, border: `1px solid ${T.line}` }}
        >
          {/* seriesHref, not /series/<slug>/1: the show page is where the
              synopsis, the free-preview badge and the unlock card live, and it
              is the one URL that also resolves for a coming-soon row a viewer
              may have saved. See lib/series-href.ts. */}
          <Link href={posterHref(item.seriesSlug)} className="flex-shrink-0 no-underline transition-transform active:scale-[0.97]">
            <div className="w-[72px] h-[108px] relative">
              {item.posterUrl ? (
                <Image src={item.posterUrl} alt={item.seriesTitle} fill sizes="72px" className="object-cover" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center" style={{ background: T.raised, color: T.textMute }}>
                  <span className="text-[8px] font-medium text-center px-1">{item.seriesTitle}</span>
                </div>
              )}
            </div>
          </Link>
          <div className="flex-1 py-3 pr-2 flex flex-col justify-between min-w-0">
            <div>
              <Link href={posterHref(item.seriesSlug)} className="no-underline">
                <h4 className="text-sm font-semibold truncate" style={{ color: T.text }}>{item.seriesTitle}</h4>
              </Link>
              <p className="text-xs mt-0.5" style={{ color: T.textMute }}>
                {item.genre}{item.episodeCount > 0 ? ` · ${item.episodeCount} episodes` : ""}
              </p>
            </div>
            <button
              onClick={() => handleRemove(item.seriesSlug)}
              className="self-start flex items-center gap-1.5 text-xs font-medium border-none cursor-pointer mt-2 px-0"
              style={{ background: "none", color: T.accent }}
              aria-label={`Remove ${item.seriesTitle} from saved list`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill={T.accent} stroke={T.accent} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
              </svg>
              {t("shorts.saved")}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Recently watched                                                    */
/* ------------------------------------------------------------------ */

export function RecentlyWatchedList() {
  const { t } = useTranslation();
  const [items, setItems] = useState<ContinueWatchingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/watch-progress")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { items?: ContinueWatchingItem[] } | null) => {
        if (cancelled) return;
        setItems(mergeContinueWatching(d?.items));
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setItems(mergeContinueWatching(null));
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  if (loading) return <ListSkeleton />;

  if (items.length === 0) {
    return (
      <EmptyState
        title="Nothing watched yet"
        body="Start any show and it appears here so you can pick up where you left off — no account needed."
        action={{ label: t("library.browseShows"), href: "/" }}
        className="py-6"
        constrain={false}
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => {
        const durationS = getEpisode(item.seriesSlug, item.episodeNumber)?.durationS;
        const pct =
          durationS && durationS > 0
            ? Math.min(96, Math.max(4, Math.round((item.progressSeconds / durationS) * 100)))
            : 8;
        return (
          <Link
            key={`${item.seriesSlug}-${item.episodeNumber}`}
            /* A resume tile knows a real episode number, so it keeps going to
               that episode with its offset — that behaviour shipped in
               Severity 1 and is correct. */
            href={buildResumeUrl(item.seriesSlug, item.episodeNumber, item.progressSeconds)}
            className="flex gap-3 rounded-xl overflow-hidden no-underline transition-transform active:scale-[0.99]"
            style={{ background: T.surface, border: `1px solid ${T.line}` }}
          >
            <div className="w-[72px] h-[108px] relative flex-shrink-0">
              {item.posterUrl ? (
                <Image src={item.posterUrl} alt={item.seriesTitle} fill sizes="72px" className="object-cover" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center" style={{ background: T.raised, color: T.textMute }}>
                  <span className="text-[8px] font-medium text-center px-1">{item.seriesTitle}</span>
                </div>
              )}
            </div>
            <div className="flex-1 py-3 pr-3 flex flex-col justify-center min-w-0">
              <h4 className="text-sm font-semibold truncate" style={{ color: T.text }}>{item.seriesTitle}</h4>
              <p className="text-xs mt-0.5" style={{ color: T.textMute }}>
                EP {item.episodeNumber}
                {item.totalEpisodes > 0 ? ` of ${item.totalEpisodes}` : ""}
              </p>
              <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.12)" }}>
                <div
                  className="h-full"
                  style={{ width: `${pct}%`, background: "linear-gradient(90deg, #E0115F, #8B5CF6)" }}
                />
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
