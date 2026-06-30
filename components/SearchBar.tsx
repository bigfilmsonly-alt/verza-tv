"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Series } from "@/lib/catalog";

interface SearchBarProps {
  series: Series[];
}

export default function SearchBar({ series }: SearchBarProps) {
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const filtered =
    q.length >= 2
      ? series.filter(
          (s) =>
            s.title.toLowerCase().includes(q) ||
            s.logline.toLowerCase().includes(q) ||
            s.genre.toLowerCase().includes(q) ||
            s.channel.toLowerCase().includes(q) ||
            s.categories.some((c) => c.toLowerCase().includes(q))
        )
      : [];

  return (
    <div className="relative">
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#6B6B7B"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="7" />
          <line x1="16.65" y1="16.65" x2="21" y2="21" />
        </svg>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search series, genres..."
          className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none"
          style={{
            background: "#12121C",
            color: "#F5F4F8",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        />
      </div>

      {filtered.length > 0 && (
        <div
          className="absolute top-full left-0 right-0 mt-2 rounded-xl overflow-hidden z-50"
          style={{
            background: "#12121C",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          {filtered.map((s) => (
            <Link
              key={s.slug}
              href={`/series/${s.slug}/1`}
              className="flex items-center gap-3 px-4 py-3 no-underline transition-colors"
              style={{ color: "#F5F4F8" }}
              onClick={() => setQuery("")}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#1A1A26")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              <div
                className="w-10 h-14 rounded-md flex-shrink-0 overflow-hidden relative"
                style={{ background: "#1A1A26" }}
              >
                {s.posterUrl ? (
                  <Image
                    src={s.posterUrl}
                    alt={s.title}
                    fill
                    sizes="40px"
                    className="object-cover"
                  />
                ) : (
                  <div
                    className="absolute inset-0 flex items-center justify-center text-[8px] font-semibold text-center px-0.5"
                    style={{ color: "#6B6B7B" }}
                  >
                    {s.episodeCount}ep
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{s.title}</p>
                <p className="text-xs truncate" style={{ color: "#6B6B7B" }}>
                  {s.genre} &middot; {s.episodeCount} episodes
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {query.length >= 2 && filtered.length === 0 && (
        <div
          className="absolute top-full left-0 right-0 mt-2 rounded-xl px-4 py-6 text-center z-50"
          style={{
            background: "#12121C",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "#6B6B7B",
          }}
        >
          <p className="text-sm">No results for &ldquo;{query}&rdquo;</p>
        </div>
      )}
    </div>
  );
}
