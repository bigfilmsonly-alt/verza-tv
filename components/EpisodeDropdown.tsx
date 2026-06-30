"use client";

import { useState } from "react";
import Link from "next/link";

const T = {
  bg: "#07070E",
  surface: "#12121C",
  raised: "#1A1A26",
  line: "rgba(255,255,255,.08)",
  text: "#F5F4F8",
  textDim: "#A0A0B0",
  textMute: "#6B6B7B",
  accent: "#E0115F",
  success: "#2ECC71",
};

interface Episode {
  number: number;
  title: string;
}

interface Props {
  seriesSlug: string;
  episodes: Episode[];
  currentEpisode: number;
  freeEpisodes: number;
  totalEpisodes: number;
}

export default function EpisodeDropdown({
  seriesSlug,
  episodes,
  currentEpisode,
  freeEpisodes,
  totalEpisodes,
}: Props) {
  const [open, setOpen] = useState(false);
  const hasPrev = currentEpisode > 1;
  const hasNext = currentEpisode < totalEpisodes;

  return (
    <div className="px-4 mt-4 mb-8">
      {/* Prev / Episode selector / Next — single compact row */}
      <div className="flex items-center gap-2">
        {/* Previous */}
        {hasPrev ? (
          <Link
            href={`/series/${seriesSlug}/${currentEpisode - 1}`}
            className="w-10 h-10 rounded-full flex items-center justify-center no-underline flex-shrink-0"
            style={{ background: T.surface, border: `1px solid ${T.line}` }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </Link>
        ) : (
          <div className="w-10 flex-shrink-0" />
        )}

        {/* Episode dropdown button */}
        <button
          onClick={() => setOpen(!open)}
          className="flex-1 flex items-center justify-between px-4 py-2.5 rounded-xl border-0 cursor-pointer"
          style={{ background: T.surface, border: `1px solid ${T.line}` }}
        >
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold" style={{ color: T.accent }}>
              EP {currentEpisode}
            </span>
            <span className="text-sm" style={{ color: T.textDim }}>
              of {totalEpisodes}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs" style={{ color: T.textMute }}>
              All Episodes
            </span>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke={T.textMute}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-transform"
              style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </button>

        {/* Next */}
        {hasNext ? (
          <Link
            href={`/series/${seriesSlug}/${currentEpisode + 1}`}
            className="w-10 h-10 rounded-full flex items-center justify-center no-underline flex-shrink-0"
            style={{ background: T.accent }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>
        ) : (
          <div className="w-10 flex-shrink-0" />
        )}
      </div>

      {/* Collapsible episode list */}
      {open && (
        <div
          className="mt-2 rounded-xl overflow-hidden"
          style={{ background: T.surface, border: `1px solid ${T.line}`, maxHeight: 320, overflowY: "auto" }}
        >
          {episodes.map((ep) => {
            const isActive = ep.number === currentEpisode;
            const isFree = ep.number <= freeEpisodes;

            return (
              <Link
                key={ep.number}
                href={`/series/${seriesSlug}/${ep.number}`}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 no-underline"
                style={{
                  background: isActive ? `${T.accent}18` : "transparent",
                  borderBottom: `1px solid ${T.line}`,
                }}
              >
                <span
                  className="text-xs font-bold w-6 text-center flex-shrink-0"
                  style={{ color: isActive ? T.accent : T.textMute }}
                >
                  {ep.number}
                </span>
                <span
                  className="text-sm flex-1 truncate"
                  style={{ color: isActive ? T.text : T.textDim }}
                >
                  {ep.title}
                </span>
                {isActive ? (
                  <span className="text-[10px] font-bold flex-shrink-0" style={{ color: T.accent }}>NOW</span>
                ) : isFree ? (
                  <span className="text-[10px] font-bold flex-shrink-0" style={{ color: T.success }}>FREE</span>
                ) : ep.number === freeEpisodes + 1 ? (
                  <span className="text-[10px] font-bold flex-shrink-0" style={{ color: T.accent }}>$1.99</span>
                ) : (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={T.textMute} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
