"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Series } from "@/lib/catalog";

interface FeedSearchProps {
  series: Series[];
}

export default function FeedSearch({ series }: FeedSearchProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered =
    query.length >= 2
      ? series.filter(
          (s) =>
            s.title.toLowerCase().includes(query.toLowerCase()) ||
            s.logline.toLowerCase().includes(query.toLowerCase()) ||
            s.genre.toLowerCase().includes(query.toLowerCase()),
        )
      : [];

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery("");
    }
  }, [open]);

  /* Close on escape */
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      {/* Small search icon — sits in the header area */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center justify-center w-9 h-9 rounded-full"
        style={{ background: "rgba(255,255,255,0.08)", border: "none", cursor: "pointer" }}
        aria-label="Search"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="7" />
          <line x1="16.65" y1="16.65" x2="21" y2="21" />
        </svg>
      </button>

      {/* Search overlay */}
      {open && (
        <div
          className="fixed inset-0 z-[100]"
          style={{ background: "rgba(7,7,14,0.95)" }}
        >
          {/* Search bar */}
          <div className="px-4 pt-4 pb-3 flex items-center gap-3">
            <div className="relative flex-1">
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
                ref={inputRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search shows..."
                className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none"
                style={{
                  background: "rgba(255,255,255,0.08)",
                  color: "#F5F4F8",
                  border: "1px solid rgba(255,255,255,0.15)",
                }}
              />
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-sm font-semibold"
              style={{ background: "none", border: "none", color: "#E0115F", cursor: "pointer" }}
            >
              Cancel
            </button>
          </div>

          {/* Results */}
          <div className="overflow-y-auto" style={{ maxHeight: "calc(100dvh - 80px)" }}>
            {filtered.length > 0 && (
              <div>
                {filtered.slice(0, 12).map((s) => (
                  <Link
                    key={s.slug}
                    href={`/series/${s.slug}/1`}
                    className="flex items-center gap-3 px-4 py-3 no-underline"
                    style={{ color: "#F5F4F8", borderBottom: "1px solid rgba(255,255,255,0.05)" }}
                    onClick={() => setOpen(false)}
                  >
                    {s.posterUrl && (
                      <div className="relative w-10 h-14 rounded overflow-hidden flex-shrink-0">
                        <Image src={s.posterUrl} alt={s.title} fill sizes="40px" className="object-cover" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate">{s.title}</p>
                      <p className="text-xs truncate" style={{ color: "#6B6B7B" }}>
                        {s.genre} &middot; {s.episodeCount} episodes
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {query.length >= 2 && filtered.length === 0 && (
              <div className="px-4 py-12 text-center">
                <p className="text-sm" style={{ color: "#6B6B7B" }}>
                  No results for &ldquo;{query}&rdquo;
                </p>
              </div>
            )}

            {query.length < 2 && (
              <div className="px-4 py-12 text-center">
                <p className="text-sm" style={{ color: "#6B6B7B" }}>
                  Type to search 76+ shows
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
