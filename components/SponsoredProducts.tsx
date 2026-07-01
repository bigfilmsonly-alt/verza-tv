"use client";

import Image from "next/image";
import type { SponsoredProduct } from "@/lib/sponsors";

/* ------------------------------------------------------------------ */
/*  TikTok Shop sponsored tile                                         */
/*                                                                      */
/*  A single product card shaped EXACTLY like a movie poster (2:3) so   */
/*  it drops straight into the 3-column poster grid and lines up with   */
/*  the movies — no horizontal scrolling, fits perfectly on screen.     */
/* ------------------------------------------------------------------ */

export default function SponsoredTile({ product: p }: { product: SponsoredProduct }) {
  const [from, to] = p.accent ?? ["#E0115F", "#8B5CF6"];

  return (
    <a
      href={p.url}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className="group block no-underline min-w-0 transition-transform active:scale-[0.97]"
    >
      {/* Poster-shaped tile (matches the movie tiles exactly) */}
      <div className="relative overflow-hidden rounded-lg" style={{ aspectRatio: "2 / 3" }}>
        {p.image ? (
          <Image src={p.image} alt={p.title} fill sizes="(max-width: 440px) 33vw, 146px" className="object-cover" />
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
          >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="rgba(255,255,255,0.92)" aria-hidden="true">
              <path d="M16.5 3c.3 2.2 1.7 3.9 4 4.2v2.6c-1.4 0-2.7-.4-3.9-1.1v6.6c0 3.3-2.7 6-6 6s-6-2.7-6-6 2.7-6 6-6c.3 0 .6 0 .9.1v2.8c-.3-.1-.6-.2-.9-.2-1.8 0-3.3 1.5-3.3 3.3S9.2 18.7 11 18.7s3.3-1.5 3.3-3.3V3h2.2z" />
            </svg>
          </div>
        )}

        {/* Ad label (top-left) */}
        <span
          className="absolute top-1.5 left-1.5 text-[8px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full"
          style={{ background: "rgba(0,0,0,0.6)", color: "#fff", backdropFilter: "blur(4px)" }}
        >
          Ad
        </span>

        {/* Price pill (bottom-right) */}
        <span
          className="absolute bottom-1.5 right-1.5 text-[11px] font-bold px-2 py-0.5 rounded-full"
          style={{ background: "rgba(0,0,0,0.68)", color: "#fff", backdropFilter: "blur(4px)" }}
        >
          {p.price}
        </span>

        {/* Hover "Shop" overlay — mirrors the poster play-button treatment */}
        <div
          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"
          style={{ background: "rgba(0,0,0,0.3)" }}
        >
          <div
            className="px-3 py-1.5 rounded-full text-[11px] font-bold"
            style={{ background: "#F5F4F8", color: "#07070E" }}
          >
            Shop on TikTok
          </div>
        </div>
      </div>

      {/* Caption block — same fixed height as the movie tiles so rows align */}
      <div style={{ height: 36 }}>
        <p className="mt-1.5 text-[11px] font-semibold leading-tight line-clamp-2" style={{ color: "#F5F4F8" }}>
          {p.title}
        </p>
        <p className="text-[10px] mt-0.5 line-clamp-1 font-semibold" style={{ color: "#E0115F" }}>
          Sponsored · TikTok Shop
        </p>
      </div>
    </a>
  );
}
