"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { trackSearch } from "@/lib/track";
import { getLiveSeries } from "@/lib/catalog";
import { seriesMatchesQuery } from "@/lib/search-index";

export default function SearchButton() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const series = getLiveSeries();

  const q = query.trim();
  const filtered =
    q.length >= 2 ? series.filter((s) => seriesMatchesQuery(s, q)) : [];

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
    else setQuery("");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setOpen(false); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center justify-center w-9 h-9 rounded-full"
        style={{ background: "rgba(255,255,255,0.08)", border: "none", cursor: "pointer" }}
        aria-label="Search"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="7" />
          <line x1="16.65" y1="16.65" x2="21" y2="21" />
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-[100]" style={{ background: "rgba(7,7,14,0.95)" }}>
          <div className="px-4 pt-4 pb-3 flex items-center gap-3">
            {/* Form so pressing Return/Enter (desktop, tablet, mobile) submits
                without reloading and dismisses the on-screen keyboard. Results
                also populate live as you type. */}
            <form
              className="relative flex-1"
              onSubmit={(e) => {
                e.preventDefault();
                if (q.length >= 2) trackSearch(q, filtered.length);
                inputRef.current?.blur();
              }}
            >
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B6B7B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="7" /><line x1="16.65" y1="16.65" x2="21" y2="21" />
              </svg>
              <input
                ref={inputRef}
                type="search"
                enterKeyHint="search"
                value={query}
                onChange={(e) => { setQuery(e.target.value); if (e.target.value.trim().length >= 2) trackSearch(e.target.value, filtered.length); }}
                placeholder="Search by show, genre, or keyword..."
                className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none"
                style={{ background: "rgba(255,255,255,0.08)", color: "#F5F4F8", border: "1px solid rgba(255,255,255,0.15)" }}
              />
            </form>
            <button onClick={() => setOpen(false)} className="text-sm font-semibold" style={{ background: "none", border: "none", color: "#E0115F", cursor: "pointer" }}>
              Cancel
            </button>
          </div>

          <div className="overflow-y-auto" style={{ maxHeight: "calc(100dvh - 80px)" }}>
            {filtered.length > 0 && (
              <>
                <p className="px-4 pt-1 pb-3 text-xs" style={{ color: "#6B6B7B" }}>
                  {filtered.length} result{filtered.length === 1 ? "" : "s"} for &ldquo;{query.trim()}&rdquo;
                </p>
                <div className="grid grid-cols-3 gap-1.5 px-3 pb-6">
                  {filtered.map((s) => (
                    <Link
                      key={s.slug}
                      href={`/series/${s.slug}/1`}
                      className="block no-underline min-w-0 transition-transform active:scale-[0.97]"
                      style={{ color: "#F5F4F8" }}
                      onClick={() => setOpen(false)}
                    >
                      <div className="relative overflow-hidden rounded-lg" style={{ aspectRatio: "2 / 3", background: "#1A1A26" }}>
                        {s.posterUrl && (
                          <Image src={s.posterUrl} alt={s.title} fill sizes="(max-width: 440px) 33vw, 146px" className="object-cover" />
                        )}
                      </div>
                      <p className="mt-1.5 text-[11px] font-semibold leading-tight line-clamp-2">{s.title}</p>
                      <p className="text-[10px] mt-0.5 line-clamp-1" style={{ color: "#6B6B7B" }}>{s.genre}</p>
                    </Link>
                  ))}
                </div>
              </>
            )}
            {query.length >= 2 && filtered.length === 0 && (
              <div className="px-4 py-12 text-center"><p className="text-sm" style={{ color: "#6B6B7B" }}>No results for "{query}"</p></div>
            )}
            {query.length < 2 && (
              <div className="px-4 py-12 text-center"><p className="text-sm" style={{ color: "#6B6B7B" }}>Type to search 76+ shows</p></div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
