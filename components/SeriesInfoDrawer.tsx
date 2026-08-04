"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Image from "next/image";
import type { Series } from "@/lib/catalog";
import { useTranslation } from "@/components/LangProvider";
import { getEpisodesForSeries, formatDuration, catalog } from "@/lib/catalog";
import { SERIES_DETAIL, type SeriesDetail } from "@/lib/series-detail";
import { T } from "@/lib/theme";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface SeriesInfoDrawerProps {
  series: Series;
  seriesDetail?: SeriesDetail | null;
  currentEpisode: number;
  totalEpisodes: number;
  onClose: () => void;
  onSelectEpisode: (n: number) => void;
}

type Tab = "synopsis" | "episodes";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/*  "{tr("content.moreLikeThis")}" helpers                                           */
/* ------------------------------------------------------------------ */

function getSimilarSeries(series: Series): Series[] {
  const detail = SERIES_DETAIL[series.slug];
  const tags = detail?.tags ?? [];
  const scored = catalog
    .filter((s) => s.slug !== series.slug && s.status === "live")
    .map((s) => {
      const d = SERIES_DETAIL[s.slug];
      const overlap = d
        ? d.tags.filter((t) => tags.includes(t)).length
        : 0;
      const genreMatch =
        s.genre.toLowerCase() === series.genre.toLowerCase() ? 2 : 0;
      return { series: s, score: overlap + genreMatch };
    })
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, 10).map((s) => s.series);
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function SeriesInfoDrawer({
  series,
  seriesDetail,
  currentEpisode,
  totalEpisodes,
  onClose,
  onSelectEpisode,
}: SeriesInfoDrawerProps) {
  const [tab, setTab] = useState<Tab>("synopsis");
  const sheetRef = useRef<HTMLDivElement>(null);
  const { t: tr } = useTranslation();

  /* Resolve detail — prop takes priority, fall back to lookup */
  const detail: SeriesDetail | undefined =
    seriesDetail ?? SERIES_DETAIL[series.slug] ?? undefined;

  const description =
    detail?.description ?? series.description ?? series.logline;
  const cast = detail?.cast ?? series.cast ?? [];
  const tags = detail?.tags ?? series.tags ?? [];
  /* Episodes */
  const episodes = getEpisodesForSeries(series.slug);

  /* Similar series */
  const similar = getSimilarSeries(series);

  /* ---- Drag-to-dismiss ---- */
  const dragStartY = useRef<number | null>(null);
  const dragDelta = useRef(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const el = sheetRef.current;
    if (!el) return;
    // Only enable drag if scrolled to top
    if (el.scrollTop <= 0) {
      dragStartY.current = e.touches[0].clientY;
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (dragStartY.current === null) return;
    const delta = e.touches[0].clientY - dragStartY.current;
    if (delta < 0) return; // pulling up, ignore
    dragDelta.current = delta;
    if (sheetRef.current) {
      sheetRef.current.style.transform = `translateY(${delta}px)`;
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (dragStartY.current === null) return;
    if (dragDelta.current > 120) {
      onClose();
    } else if (sheetRef.current) {
      sheetRef.current.style.transform = "translateY(0)";
    }
    dragStartY.current = null;
    dragDelta.current = 0;
  }, [onClose]);

  /* Escape key */
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  /* Scroll active episode into view */
  const episodeListRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (tab !== "episodes" || !episodeListRef.current) return;
    const active = episodeListRef.current.querySelector(
      `[data-ep="${currentEpisode}"]`,
    );
    if (active) {
      active.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }, [tab, currentEpisode]);

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <>
      {/* ----- Backdrop ----- */}
      <div
        className="fixed inset-0 z-[60]"
        style={{ background: "rgba(0,0,0,0.6)" }}
        onClick={onClose}
        aria-hidden
      />

      {/* ----- Bottom sheet ----- */}
      <div
        ref={sheetRef}
        className="fixed bottom-0 left-0 right-0 z-[61] flex flex-col rounded-t-2xl transition-transform duration-200"
        style={{
          maxHeight: "85dvh",
          background: T.surface,
          borderTop: `1px solid ${T.line}`,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* ---- Drag handle + close ---- */}
        <div className="flex items-center justify-center pt-3 pb-1 relative flex-shrink-0">
          <div
            className="w-10 h-1 rounded-full"
            style={{ background: T.textMute }}
          />
          <button
            onClick={onClose}
            className="absolute right-3 top-2 w-8 h-8 flex items-center justify-center rounded-full border-0 cursor-pointer text-lg"
            style={{ background: T.raised, color: T.text }}
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        {/* ---- Scrollable body ---- */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-6">
          {/* ---- Header row: poster + title + meta ---- */}
          <div className="flex gap-3 mt-2 mb-4">
            {/* Poster thumbnail */}
            <div
              className="relative flex-shrink-0 rounded-lg overflow-hidden"
              style={{
                width: 80,
                height: 120,
                background: T.raised,
              }}
            >
              {series.posterUrl ? (
                <Image
                  src={series.posterUrl}
                  alt={series.title}
                  fill
                  sizes="80px"
                  className="object-cover"
                  style={{
                    filter:
                      "saturate(1.12) contrast(1.04) brightness(1.02)",
                  }}
                />
              ) : (
                <div
                  className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-center px-1"
                  style={{ color: T.textMute }}
                >
                  {series.title}
                </div>
              )}
            </div>

            {/* Title + meta */}
            <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
              <h2
                className="text-base font-bold leading-tight line-clamp-2"
                style={{ color: T.text }}
              >
                {series.title}
              </h2>
              <p className="text-xs" style={{ color: T.textDim }}>
                {series.genre}
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: T.textMute }}>
                {totalEpisodes} episodes
                {detail?.year ? ` \u00b7 ${detail.year}` : ""}
              </p>
            </div>
          </div>

          {/* ---- Tab switcher ---- */}
          <div
            className="flex border-b mb-4"
            style={{ borderColor: T.line }}
          >
            {(["synopsis", "episodes"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="flex-1 pb-2 text-sm font-semibold border-0 bg-transparent cursor-pointer capitalize transition-colors"
                style={{
                  color: tab === t ? T.text : T.textMute,
                  borderBottom:
                    tab === t
                      ? `3px solid ${T.accent}`
                      : "3px solid transparent",
                }}
              >
                {t === "synopsis" ? tr("content.synopsis") : tr("content.episodes")}
              </button>
            ))}
          </div>

          {/* ---- Synopsis tab ---- */}
          {tab === "synopsis" && (
            <div className="flex flex-col gap-4">
              {/* Description */}
              <p
                className="text-sm leading-relaxed"
                style={{ color: T.textDim }}
              >
                {description}
              </p>

              {/* Genre tags as pills */}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 rounded-full text-xs font-medium capitalize"
                      style={{
                        background: "rgba(224, 17, 95, 0.12)",
                        color: T.accent,
                        border: `1px solid rgba(224, 17, 95, 0.25)`,
                      }}
                    >
                      {tag.replace(/-/g, " ")}
                    </span>
                  ))}
                </div>
              )}

              {/* Cast */}
              {cast.length > 0 && (
                <div>
                  <h3
                    className="text-xs font-bold uppercase tracking-wider mb-2"
                    style={{ color: T.textMute }}
                  >
                    Cast
                  </h3>
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    {cast.map((name) => (
                      <span
                        key={name}
                        className="text-sm"
                        style={{ color: T.text }}
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ---- Episodes tab ---- */}
          {tab === "episodes" && (
            <div ref={episodeListRef} className="flex flex-col gap-1">
              {episodes.map((ep) => {
                const isActive = ep.number === currentEpisode;
                return (
                  <button
                    key={ep.number}
                    data-ep={ep.number}
                    onClick={() => onSelectEpisode(ep.number)}
                    className="flex items-center gap-3 w-full text-left rounded-xl px-3 py-3 border-0 cursor-pointer transition-colors"
                    style={{
                      background: isActive ? T.raised : "transparent",
                      outline: isActive
                        ? `1px solid ${T.accent}`
                        : "none",
                    }}
                  >
                    {/* Episode number */}
                    <span
                      className="w-8 h-8 flex-shrink-0 rounded-lg flex items-center justify-center text-xs font-bold"
                      style={{
                        background: isActive
                          ? T.accent
                          : "rgba(255,255,255,0.06)",
                        color: isActive ? "#fff" : T.textDim,
                      }}
                    >
                      {ep.number}
                    </span>

                    {/* Title + duration */}
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm font-medium truncate"
                        style={{
                          color: isActive ? T.text : T.textDim,
                        }}
                      >
                        {ep.title}
                      </p>
                      <p
                        className="text-[11px] mt-0.5"
                        style={{ color: T.textMute }}
                      >
                        {formatDuration(ep.durationS)}
                      </p>
                    </div>

                    {/* Free / Unlock / Locked badge */}
                    {ep.isFree ? (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: "rgba(46, 204, 113, 0.15)", color: T.success }}>
                        Free
                      </span>
                    ) : ep.number === (series.freeEpisodes ?? 5) + 1 ? (
                      <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: "rgba(224, 17, 95, 0.12)", color: T.accent }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                        $1.99
                      </span>
                    ) : (
                      <span className="flex-shrink-0">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.textMute} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                      </span>
                    )}

                    {/* Playing indicator */}
                    {isActive && (
                      <span
                        className="flex-shrink-0 text-xs font-bold"
                        style={{ color: T.accent }}
                      >
                        NOW
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* ---- {tr("content.moreLikeThis")} ---- */}
          {similar.length > 0 && (
            <div className="mt-6">
              <h3
                className="text-xs font-bold uppercase tracking-wider mb-3"
                style={{ color: T.textMute }}
              >
                {tr("content.moreLikeThis")}
              </h3>
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                {similar.map((s) => (
                  <div
                    key={s.slug}
                    className="flex-shrink-0 cursor-pointer"
                    style={{ width: 100 }}
                  >
                    <div
                      className="relative rounded-lg overflow-hidden"
                      style={{ width: 100, aspectRatio: "2 / 3" }}
                    >
                      {s.posterUrl ? (
                        <Image
                          src={s.posterUrl}
                          alt={s.title}
                          fill
                          sizes="100px"
                          className="object-cover"
                          style={{
                            filter:
                              "saturate(1.12) contrast(1.04) brightness(1.02)",
                          }}
                        />
                      ) : (
                        <div
                          className="absolute inset-0 flex items-center justify-center text-[9px] font-semibold text-center px-1"
                          style={{
                            background: `linear-gradient(135deg, ${T.raised}, ${T.surface})`,
                            color: T.textMute,
                          }}
                        >
                          {s.title}
                        </div>
                      )}
                      {/* Episode badge */}
                      <span
                        className="absolute bottom-1 right-1 text-[10px] font-semibold px-1 py-0.5 rounded"
                        style={{
                          background: "rgba(7, 7, 14, 0.75)",
                          color: T.text,
                          backdropFilter: "blur(4px)",
                        }}
                      >
                        {s.episodeCount} ep
                      </span>
                    </div>
                    <p
                      className="mt-1.5 text-[11px] font-medium leading-tight line-clamp-2"
                      style={{ color: T.text }}
                    >
                      {s.title}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
