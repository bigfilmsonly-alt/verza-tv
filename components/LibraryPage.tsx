"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { T } from "@/lib/theme";
import { getChannels, getSeriesByChannel, getSeriesBySlug, type Series } from "@/lib/catalog";
import { useTranslation } from "@/components/LangProvider";

type LibraryTab = "channels" | "my-list";

/* ---- Poster thumbnail ---- */
function PosterThumb({ series }: { series: Series }) {
  return (
    <Link href={`/series/${series.slug}/1`} className="flex-shrink-0 no-underline group">
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
      {/* Creator CTA */}
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
            Make your own channel, upload vertical or horizontal content, set your subscription pricing, and earn directly from subscribers. Most platforms pay creators pennies for views. Verza TV is different.
          </p>
          <Link
            href="/studio"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold no-underline transition-transform active:scale-[0.97]"
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

/* ---- Saved list item type ---- */
interface SavedItem {
  seriesSlug: string;
  seriesTitle: string;
  posterUrl: string;
  episodeCount: number;
  genre: string;
  savedAt: string;
}

/* ---- My List content ---- */
function MyListContent() {
  const { t } = useTranslation();
  const [items, setItems] = useState<SavedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try API first (signed-in users)
    fetch("/api/saved-list")
      .then((r) => r.json())
      .then((data) => {
        if (data.items && data.items.length > 0) {
          setItems(data.items);
          setLoading(false);
          return;
        }
        // Fallback: read from localStorage (guests)
        loadFromLocalStorage();
      })
      .catch(() => {
        loadFromLocalStorage();
      });

    function loadFromLocalStorage() {
      try {
        const local = localStorage.getItem("verza-saved");
        if (local) {
          const slugs: string[] = JSON.parse(local);
          const localItems: SavedItem[] = slugs.map((slug) => {
            const series = getSeriesBySlug(slug);
            return {
              seriesSlug: slug,
              seriesTitle: series?.title ?? slug,
              posterUrl: series?.posterUrl ?? "",
              episodeCount: series?.episodeCount ?? 0,
              genre: series?.genre ?? "",
              savedAt: new Date().toISOString(),
            };
          }).filter((i) => i.seriesTitle !== i.seriesSlug);
          setItems(localItems);
        }
      } catch {}
      setLoading(false);
    }
  }, []);

  const handleRemove = useCallback((slug: string) => {
    setItems((prev) => prev.filter((i) => i.seriesSlug !== slug));

    // Remove from localStorage
    try {
      const local = localStorage.getItem("verza-saved");
      if (local) {
        const slugs: string[] = JSON.parse(local);
        localStorage.setItem("verza-saved", JSON.stringify(slugs.filter((s) => s !== slug)));
      }
    } catch {}

    // Also remove from API
    fetch("/api/saved-list", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ seriesSlug: slug }),
    }).catch(() => {});
  }, []);

  /* Loading skeleton */
  if (loading) {
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

  /* Empty state */
  if (items.length === 0) {
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

  /* Saved series list */
  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => (
        <div key={item.seriesSlug} className="flex gap-3 rounded-xl overflow-hidden" style={{ background: T.surface, border: `1px solid ${T.line}` }}>
          <Link href={`/series/${item.seriesSlug}/1`} className="flex-shrink-0 no-underline">
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
              <Link href={`/series/${item.seriesSlug}/1`} className="no-underline">
                <h4 className="text-sm font-semibold truncate" style={{ color: T.text }}>{item.seriesTitle}</h4>
              </Link>
              <p className="text-xs mt-0.5" style={{ color: T.textMute }}>
                {item.genre}{item.episodeCount > 0 ? ` \u00b7 ${item.episodeCount} episodes` : ""}
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
