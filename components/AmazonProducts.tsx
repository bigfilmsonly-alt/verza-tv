"use client";

import Image from "next/image";
import type { AmazonProduct } from "@/lib/amazon-sponsors";

/* ------------------------------------------------------------------ */
/*  Amazon sponsored tile                                              */
/*                                                                      */
/*  A single product card shaped EXACTLY like a movie poster (2:3) so   */
/*  it drops straight into the 3-column poster grid and lines up with   */
/*  the movies — no horizontal scrolling, fits perfectly on screen.     */
/* ------------------------------------------------------------------ */

export default function AmazonTile({ product: p }: { product: AmazonProduct }) {
  const [from, to] = p.accent ?? ["#FF9900", "#232F3E"];

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
            {/* Amazon smile arrow mark */}
            <svg width="52" height="52" viewBox="0 0 48 48" fill="none" aria-hidden="true">
              <path
                d="M8 30c5.5 4 12 6 18 6s12.5-2 18-6"
                stroke="rgba(255,255,255,0.95)"
                strokeWidth="3.2"
                strokeLinecap="round"
              />
              <path
                d="M36 33c1.6-1 3-2.3 4-4"
                stroke="#FF9900"
                strokeWidth="3.2"
                strokeLinecap="round"
              />
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

        {/* "Shop" CTA — always visible on touch devices (no hover), reveals on
            hover for desktop. Uses a small always-on pill anchored at the bottom
            so mobile users still get a clear tap target. */}
        <div
          className="absolute inset-x-0 bottom-0 flex items-center justify-center pt-8 pb-2 md:opacity-0 md:group-hover:opacity-100 md:inset-0 md:pb-0 md:pt-0 md:transition-opacity md:duration-300 z-10"
          style={{
            background: "linear-gradient(to top, rgba(0,0,0,0.55), transparent)",
          }}
        >
          <div
            className="px-3 py-1.5 rounded-full text-[11px] font-bold"
            style={{ background: "#FF9900", color: "#232F3E" }}
          >
            Shop on Amazon
          </div>
        </div>
      </div>

      {/* Caption block — same fixed height as the movie tiles so rows align */}
      <div style={{ height: 36 }}>
        <p className="mt-1.5 text-[11px] font-semibold leading-tight line-clamp-2" style={{ color: "#F5F4F8" }}>
          {p.title}
        </p>
        <p className="text-[10px] mt-0.5 line-clamp-1 font-semibold" style={{ color: "#FF9900" }}>
          Sponsored · Amazon
        </p>
      </div>
    </a>
  );
}
