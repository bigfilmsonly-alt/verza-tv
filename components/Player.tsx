"use client";

import { useState } from "react";
import Image from "next/image";
import { T } from "@/lib/theme";
import { formatDuration } from "@/lib/catalog";

interface PlayerProps {
  posterUrl: string;
  title: string;
  episodeNumber: number;
  durationS: number;
  seriesSlug: string;
}

export default function Player({
  posterUrl,
  title,
  episodeNumber,
  durationS,
  seriesSlug: _seriesSlug,
}: PlayerProps) {
  // _seriesSlug will be used to fetch signed playback URL from /api/playback
  void _seriesSlug;
  const [playing, setPlaying] = useState(false);

  return (
    <div className="mx-4">
      {/* Player container -- 9:16 vertical aspect ratio */}
      <div
        className="relative rounded-2xl overflow-hidden"
        style={{ aspectRatio: "9 / 16", background: T.bg }}
      >
        {/* Poster background */}
        {posterUrl ? (
          <Image
            src={posterUrl}
            alt={title}
            fill
            sizes="(max-width: 440px) 100vw, 440px"
            className="object-cover"
            style={{
              filter: playing ? "brightness(0.15)" : "brightness(0.6)",
              transition: "filter 0.4s ease",
            }}
          />
        ) : (
          <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, #1A1A26, #07070E)" }} />
        )}

        {/* Content overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {playing ? (
            /* Playing state */
            <div className="flex flex-col items-center gap-4">
              {/* Equalizer animation */}
              <div className="flex items-end gap-1 h-10">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-1.5 rounded-full"
                    style={{
                      background: T.accent,
                      height: `${20 + ((i * 17) % 30)}px`,
                      animation: `eq ${0.4 + i * 0.1}s ease-in-out infinite alternate`,
                    }}
                  />
                ))}
              </div>

              <p
                className="text-sm font-semibold"
                style={{ color: T.text }}
              >
                Playing...
              </p>

              {/* Pause button */}
              <button
                className="w-12 h-12 rounded-full flex items-center justify-center transition-transform active:scale-90"
                style={{
                  background: "rgba(255,255,255,0.12)",
                  backdropFilter: "blur(8px)",
                }}
                onClick={() => setPlaying(false)}
                aria-label="Pause"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill={T.text}
                  stroke="none"
                >
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
              </button>
            </div>
          ) : (
            /* Idle / poster state */
            <button
              className="w-16 h-16 rounded-full flex items-center justify-center transition-transform active:scale-90"
              style={{
                background: T.accent,
                boxShadow: `0 0 24px ${T.accent}66`,
              }}
              onClick={() => {
                // In production: fetch /api/playback/{episodeId} for signed URL
                setPlaying(true);
              }}
              aria-label="Play"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill={T.text}
                stroke="none"
              >
                <polygon points="8 5 20 12 8 19" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Episode info bar */}
      <div
        className="flex items-center justify-between rounded-b-xl px-4 py-3 -mt-1"
        style={{
          background: T.surface,
          borderLeft: `1px solid ${T.line}`,
          borderRight: `1px solid ${T.line}`,
          borderBottom: `1px solid ${T.line}`,
        }}
      >
        <div className="flex-1 min-w-0">
          <p
            className="text-sm font-semibold truncate"
            style={{ color: T.text }}
          >
            {title}
          </p>
          <p className="text-xs" style={{ color: T.textMute }}>
            Episode {episodeNumber}
          </p>
        </div>
        <span
          className="text-xs font-medium flex-shrink-0 ml-3"
          style={{ color: T.textDim }}
        >
          {formatDuration(durationS)}
        </span>
      </div>

      {/* Inline keyframes for equalizer animation */}
      <style>{`
        @keyframes eq {
          from { height: 8px; }
          to { height: 32px; }
        }
      `}</style>
    </div>
  );
}
