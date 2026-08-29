"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { T } from "@/lib/theme";
import { getChannels, getSeriesByChannel, type Series } from "@/lib/catalog";
import { posterHref } from "@/lib/series-href";
import { useTranslation } from "@/components/LangProvider";
import { SavedShowsList } from "@/components/AccountLists";
import EmptyState from "@/components/EmptyState";

type LibraryTab = "channels" | "my-list";

/* ---- Poster thumbnail ---- */
function PosterThumb({ series }: { series: Series }) {
  return (
    /* seriesHref, not the /series/<slug>/1 literal B removed everywhere else:
       the show page carries the synopsis, the "First N Episodes FREE" badge and
       the unlock card, and it is the only URL that resolves for a coming-soon
       row. See lib/series-href.ts and B's handoff note. */
    <Link href={posterHref(series)} className="flex-shrink-0 no-underline group transition-transform active:scale-[0.97]">
      <div className="w-[100px] h-[150px] rounded-lg overflow-hidden relative" style={{ background: T.raised }}>
        {series.posterUrl ? (
          <Image src={series.posterUrl} alt={series.title} fill sizes="100px" className="object-cover transition-transform group-hover:scale-105" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center" style={{ color: T.textMute }}>
            <span className="text-[9px] font-medium text-center px-2">{series.title}</span>
          </div>
        )}
      </div>
      <p className="text-[10px] font-medium mt-1.5 w-[100px] truncate" style={{ color: T.textDim }}>
        {series.title}
      </p>
    </Link>
  );
}

/* ---- Channel meta ----
   VERIFIED against the catalogue on 2026-08-29, not assumed. getChannels()
   returns exactly two names — "VERZA Originals" (89 live titles) and
   "The Carpet" (2: exes-premiere, love-awards). Two of the three entries this
   table used to hold, StorageBlue and The Vertical Tea, are not channel values
   on any catalogue row, so they rendered as permanently empty cards reading
   "Coming Soon" with no posters and no explanation. "The Carpet", the one real
   second channel, was MISSING from the table, so it rendered with an empty
   <svg> (no path element) and no description at all.

   So the report that "the channel directory is always empty" is half right and
   worth stating precisely: the directory is not empty — VERZA Originals fills
   it — but half the cards in it were, and the one that had content had no
   identity. Both halves are fixed below: The Carpet gets its metadata, and a
   channel with nothing in it gets a real empty state instead of a blank card. */
const CHANNEL_META: Record<string, { description: string; icon: string; posterLimit: number }> = {
  "VERZA Originals": {
    description: "The flagship channel for romance, thriller, mystery, revenge, and other vertical micro-dramas.",
    icon: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
    posterLimit: 12,
  },
  "The Carpet": {
    description: "Red carpet arrivals, premieres and award nights, shot vertical and cut for your phone.",
    icon: "M12 2l2.4 6.5H21l-5.3 4 2 6.5-5.7-4.2L6.3 19l2-6.5-5.3-4h6.6z",
    posterLimit: 20,
  },
  StorageBlue: {
    description: "Reality meets comedy. Abandoned storage units, auctions, and hidden fortunes.",
    icon: "M23 7l-7 5 7 5V7zM14 5H3a2 2 0 00-2 2v10a2 2 0 002 2h11a2 2 0 002-2V7a2 2 0 00-2-2z",
    posterLimit: 20,
  },
  "The Vertical Tea": {
    description: "Commentary on micro-drama and internet culture in a short-form format.",
    icon: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75",
    posterLimit: 20,
  },
};

/* ---- Channels content ---- */
function ChannelsContent() {
  const liveChannelNames = getChannels();
  const allChannelNames = Array.from(new Set([...liveChannelNames, ...Object.keys(CHANNEL_META)]));
  const sortedChannels = allChannelNames.sort((a, b) => {
    if (a === "VERZA Originals") return -1;
    if (b === "VERZA Originals") return 1;
    return a.localeCompare(b);
  });

  return (
    <div className="flex flex-col gap-5">
      {sortedChannels.map((channelName) => {
        const series = getSeriesByChannel(channelName);
        const meta = CHANNEL_META[channelName];
        const posterLimit = meta?.posterLimit ?? 6;
        const displaySeries = series.slice(0, posterLimit);

        return (
          <div key={channelName} className="rounded-xl overflow-hidden" style={{ background: T.surface, border: `1px solid ${T.line}` }}>
            <div className="p-4 pb-3">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: `${T.accent}18` }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {meta && <path d={meta.icon} />}
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold" style={{ color: T.text }}>{channelName}</h3>
                  <p className="text-xs" style={{ color: T.textMute }}>
                    {series.length > 0 ? `${series.length} shows` : "Coming Soon"}
                  </p>
                </div>
              </div>
              {meta && <p className="text-xs leading-relaxed" style={{ color: T.textDim }}>{meta.description}</p>}
            </div>
            {displaySeries.length > 0 ? (
              <div className="px-4 pb-4 flex gap-3 overflow-x-auto no-scrollbar" style={{ WebkitOverflowScrolling: "touch" }}>
                {displaySeries.map((s) => <PosterThumb key={s.slug} series={s} />)}
              </div>
            ) : (
              /* A channel with no titles used to be a blank card under a
                 "Coming Soon" label: no posters, no explanation, no way out.
                 E's EmptyState — the Anime tab's card — so the app says
                 "nothing here yet" in one voice rather than three. */
              <EmptyState
                title={`${channelName} is coming soon`}
                body="No titles on this channel yet. Everything else on VERZA is ready to watch right now."
                action={{ label: "Browse VERZA", href: "/" }}
                className="px-4 pb-5"
                constrain={false}
              />
            )}
          </div>
        );
      })}

      {/* Creator CTA — moved below the fold so browse/watch content leads */}
      <div
        className="rounded-xl overflow-hidden"
        style={{
          background: "linear-gradient(135deg, rgba(224,17,95,0.12), rgba(139,92,246,0.12))",
          border: "1px solid rgba(224,17,95,0.25)",
        }}
      >
        <div className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #E0115F, #8B5CF6)" }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-bold" style={{ color: "#fff" }}>Apply to Become a Creator</h3>
              <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "rgba(224,17,95,0.9)" }}>Exclusive VIP</p>
            </div>
          </div>
          <p className="text-[13px] leading-relaxed mb-4" style={{ color: "rgba(255,255,255,0.7)" }}>
            Make your own channel, upload vertical or horizontal content, set your subscription pricing, and earn directly from subscribers. Most platforms pay creators pennies for views. VERZA TV is different.
          </p>
          <Link
            href="/studio"
            className="glow-pulse flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold no-underline transition-transform active:scale-[0.97]"
            style={{
              background: "linear-gradient(135deg, #E0115F, #8B5CF6)",
              color: "#fff",
              boxShadow: "0 0 24px rgba(224,17,95,0.25)",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="23 7 16 12 23 17 23 7" />
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
            Apply Now
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ---- My List ----
   BUG THIS FIXES: this component was a second, independent implementation of
   the saved list — its own fetch, its own localStorage parsing, its own remove
   handler, its own empty state — while app/me/list/page.tsx rendered a THIRD,
   hard-coded empty one. Three surfaces, one of which worked. The single
   implementation now lives in components/AccountLists.tsx and both pages
   render it, so "tap the bookmark icon" is true wherever it is printed. */

/* ---- Main Library page ---- */
export default function LibraryPage() {
  const [tab, setTab] = useState<LibraryTab>("channels");
  const { t } = useTranslation();

  return (
    <section className="px-4 pt-6 pb-24">
      <h1 className="text-xl font-bold mb-4" style={{ color: T.text }}>{t("library.title")}</h1>

      {/* Tab switcher */}
      <div className="flex rounded-lg overflow-hidden mb-5" style={{ background: T.surface, border: `1px solid ${T.line}` }}>
        {([["channels", t("library.channels")], ["my-list", t("library.myList")]] as [LibraryTab, string][]).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className="flex-1 text-center py-2.5 text-sm font-semibold border-none cursor-pointer transition-colors"
            style={{
              color: tab === id ? "#fff" : T.textMute,
              background: tab === id ? T.accent : "transparent",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "channels" ? <ChannelsContent /> : <SavedShowsList />}
    </section>
  );
}
