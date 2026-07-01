"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import { trackSearch } from "@/lib/track";
import { getLiveSeries } from "@/lib/catalog";
import { seriesMatchesQuery } from "@/lib/search-index";

export default function SearchButton() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const series = getLiveSeries();

  // Portal target only exists on the client. Without this guard the overlay
  // would try to render on the server and crash.
  useEffect(() => setMounted(true), []);

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
    // Lock background scroll so the page behind the overlay stays put.
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
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

      {open && mounted && createPortal(
        /* Rendered via a portal on <body> so the panel escapes the header's
           backdrop-filter (which otherwise makes it a containing block for
           position:fixed and clips this overlay to the header on desktop). */
        <div
          className="fixed inset-0 z-[9999] flex justify-center items-start"
          style={{ background: "transparent" }}
          onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
        {/* Floating search bar at the top — the page (all the movies) stays fully
            visible behind it, no dim/blank screen. A results grid drops down only
            once you type. */}
        <div className="flex flex-col w-full" style={{ maxWidth: 440, maxHeight: "100%", background: "#07070E", boxShadow: "0 12px 40px rgba(0,0,0,0.6)" }}>
          {/* Solid search bar — opaque so NOTHING from the page shows through */}
          <div
            className="flex items-center gap-3 px-4 pt-4 pb-3 flex-shrink-0"
            style={{ background: "#07070E", borderBottom: "1px solid rgba(255,255,255,0.08)" }}
          >
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

          {/* Results — only shown once there's a query, so an empty search is
              just the bar over the dimmed page (no black screen). Its own scroll
              region, capped height, solid background. */}
          {q.length >= 2 && (
          <div className="overflow-y-auto" style={{ background: "#07070E", maxHeight: "calc(100vh - 76px)" }}>
            {filtered.length > 0 && (
              <>
                <p className="px-4 pt-3 pb-2 text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#6B6B7B" }}>
                  {filtered.length} result{filtered.length === 1 ? "" : "s"} for &ldquo;{query.trim()}&rdquo;
                </p>
                <div className="grid grid-cols-3 gap-x-2.5 gap-y-4 px-3 pb-10">
                  {filtered.map((s) => (
                    <Link
                      key={s.slug}
                      href={`/series/${s.slug}/1`}
                      className="block no-underline min-w-0 transition-transform active:scale-[0.97]"
                      style={{ color: "#F5F4F8" }}
                      onClick={() => setOpen(false)}
                    >
                      <div
                        className="relative overflow-hidden rounded-xl"
                        style={{ aspectRatio: "2 / 3", background: "#12121C", boxShadow: "0 4px 14px rgba(0,0,0,0.45)" }}
                      >
                        {s.posterUrl && (
                          <Image
                            src={s.posterUrl}
                            alt={s.title}
                            fill
                            quality={90}
                            sizes="(max-width: 440px) 33vw, 146px"
                            className="object-cover"
                          />
                        )}
                      </div>
                      {/* Fixed-height caption block so every tile's title + genre
                          line up on the same baseline — no uneven/overlapping text */}
                      <div className="mt-2" style={{ height: 46 }}>
                        <p className="text-[11px] font-semibold leading-snug line-clamp-2">{s.title}</p>
                        <p className="text-[10px] mt-0.5 line-clamp-1" style={{ color: "#6B6B7B" }}>{s.genre}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            )}
            {filtered.length === 0 && (
              <div className="px-4 py-10 text-center"><p className="text-sm" style={{ color: "#6B6B7B" }}>No results for &ldquo;{query.trim()}&rdquo;</p></div>
            )}
          </div>
          )}
        </div>
        </div>,
        document.body
      )}
    </>
  );
}
