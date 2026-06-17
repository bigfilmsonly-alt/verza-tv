"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { T } from "@/lib/theme";
import { getChannels, getSeriesByChannel, type Series } from "@/lib/catalog";
import { useTranslation } from "@/components/LangProvider";

type LibraryTab = "channels" | "my-list";

/* ---- Poster thumbnail ---- */
function PosterThumb({ series }: { series: Series }) {
  return (
    <Link href={`/series/${series.slug}`} className="flex-shrink-0 no-underline group">
      <div className="w-[100px] h-[140px] rounded-lg overflow-hidden relative" style={{ background: T.raised }}>
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

/* ---- Channel meta ---- */
const CHANNEL_META: Record<string, { description: string; icon: string; posterLimit: number }> = {
  "Verza Originals": {
    description: "The flagship channel. Romance, thriller, mystery, and revenge — 70+ original micro-dramas.",
    icon: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
    posterLimit: 12,
  },
  StorageBlue: {
    description: "Reality meets comedy. Abandoned storage units, auctions, and hidden fortunes.",
    icon: "M23 7l-7 5 7 5V7zM14 5H3a2 2 0 00-2 2v10a2 2 0 002 2h11a2 2 0 002-2V7a2 2 0 00-2-2z",
    posterLimit: 20,
  },
  "The Vertical Tea": {
    description: "The hottest takes on micro-drama and internet chaos — sixty seconds at a time.",
    icon: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75",
    posterLimit: 20,
  },
};

/* ---- Channels content ---- */
function ChannelsContent() {
  const liveChannelNames = getChannels();
  const allChannelNames = Array.from(new Set([...liveChannelNames, ...Object.keys(CHANNEL_META)]));
  const sortedChannels = allChannelNames.sort((a, b) => {
    if (a === "Verza Originals") return -1;
    if (b === "Verza Originals") return 1;
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
            {displaySeries.length > 0 && (
              <div className="px-4 pb-4 flex gap-3 overflow-x-auto no-scrollbar" style={{ WebkitOverflowScrolling: "touch" }}>
                {displaySeries.map((s) => <PosterThumb key={s.slug} series={s} />)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ---- My List content ---- */
function MyListContent() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-20 h-20 rounded-full flex items-center justify-center mb-5" style={{ background: `${T.accent}12` }}>
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke={T.accent} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
        </svg>
      </div>
      <p className="text-base font-semibold mb-1.5" style={{ color: T.text }}>{t("library.noSavedShows")}</p>
      <p className="text-sm text-center max-w-[260px] mb-6 leading-relaxed" style={{ color: T.textMute }}>
        Tap the bookmark icon on any show to add it here for easy access.
      </p>
      <Link href="/" className="px-6 py-2.5 rounded-lg text-sm font-semibold no-underline transition-opacity hover:opacity-90" style={{ background: T.accent, color: "#fff" }}>
        {t("library.browseShows")}
      </Link>
    </div>
  );
}

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

      {tab === "channels" ? <ChannelsContent /> : <MyListContent />}
    </section>
  );
}
