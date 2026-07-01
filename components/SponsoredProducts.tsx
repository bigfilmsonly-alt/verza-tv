"use client";

import Image from "next/image";
import { SPONSORED_PRODUCTS } from "@/lib/sponsors";

/* ------------------------------------------------------------------ */
/*  TikTok Shop sponsored products strip                               */
/*                                                                      */
/*  A horizontally-scrollable row of product cards placed in a high-    */
/*  converting spot on the home page (right under the hero). Renders    */
/*  nothing when there are no sponsors, so the layout stays clean.      */
/* ------------------------------------------------------------------ */

export default function SponsoredProducts({
  embedded = false,
  startOffset = 0,
}: {
  /** When woven into the poster grid, drop the horizontal padding (the grid
   *  already provides it) and use symmetric vertical spacing instead. */
  embedded?: boolean;
  /** Rotates which product leads each strip so repeated placements down the
   *  page don't all show the same first card. */
  startOffset?: number;
}) {
  if (SPONSORED_PRODUCTS.length === 0) return null;

  // Rotate the product order for this placement.
  const n = SPONSORED_PRODUCTS.length;
  const rot = ((startOffset % n) + n) % n;
  const products = [...SPONSORED_PRODUCTS.slice(rot), ...SPONSORED_PRODUCTS.slice(0, rot)];

  return (
    <section className={embedded ? "my-3" : "mt-0 mb-4 px-3"}>
      {/* Header row — clearly labelled "Sponsored" + TikTok Shop wordmark */}
      <div className="flex items-center justify-between mb-2 px-1">
        <span
          className="text-[10px] font-bold uppercase tracking-widest"
          style={{ color: "#6B6B7B" }}
        >
          Sponsored
        </span>
        <span className="flex items-center gap-1 text-[11px] font-semibold" style={{ color: "#F5F4F8" }}>
          {/* TikTok music-note glyph */}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="#F5F4F8" aria-hidden="true">
            <path d="M16.5 3c.3 2.2 1.7 3.9 4 4.2v2.6c-1.4 0-2.7-.4-3.9-1.1v6.6c0 3.3-2.7 6-6 6s-6-2.7-6-6 2.7-6 6-6c.3 0 .6 0 .9.1v2.8c-.3-.1-.6-.2-.9-.2-1.8 0-3.3 1.5-3.3 3.3S9.2 18.7 11 18.7s3.3-1.5 3.3-3.3V3h2.2z" />
          </svg>
          TikTok Shop
        </span>
      </div>

      {/* Scrollable card row */}
      <div
        className="flex gap-2.5 overflow-x-auto pb-1"
        style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}
      >
        {products.map((p) => {
          const [from, to] = p.accent ?? ["#E0115F", "#8B5CF6"];
          return (
            <a
              key={p.id}
              href={p.url}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="block no-underline flex-shrink-0 rounded-xl overflow-hidden transition-transform active:scale-[0.97]"
              style={{
                width: 132,
                background: "#12121C",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              {/* Product image / gradient placeholder */}
              <div className="relative" style={{ aspectRatio: "1 / 1", background: `linear-gradient(135deg, ${from}, ${to})` }}>
                {p.image ? (
                  <Image src={p.image} alt={p.title} fill sizes="132px" className="object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg width="34" height="34" viewBox="0 0 24 24" fill="rgba(255,255,255,0.9)" aria-hidden="true">
                      <path d="M16.5 3c.3 2.2 1.7 3.9 4 4.2v2.6c-1.4 0-2.7-.4-3.9-1.1v6.6c0 3.3-2.7 6-6 6s-6-2.7-6-6 2.7-6 6-6c.3 0 .6 0 .9.1v2.8c-.3-.1-.6-.2-.9-.2-1.8 0-3.3 1.5-3.3 3.3S9.2 18.7 11 18.7s3.3-1.5 3.3-3.3V3h2.2z" />
                    </svg>
                  </div>
                )}
                {p.badge && (
                  <span
                    className="absolute top-1.5 left-1.5 text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full"
                    style={{ background: "rgba(0,0,0,0.55)", color: "#fff", backdropFilter: "blur(4px)" }}
                  >
                    {p.badge}
                  </span>
                )}
              </div>

              {/* Title + price + CTA */}
              <div className="px-2 pt-1.5 pb-2">
                <p className="text-[11px] font-semibold leading-snug line-clamp-2" style={{ color: "#F5F4F8", height: 30 }}>
                  {p.title}
                </p>
                <p className="text-[13px] font-bold mt-0.5" style={{ color: "#F5F4F8" }}>
                  {p.price}
                </p>
                <div
                  className="mt-1.5 flex items-center justify-center rounded-lg py-1 text-[10px] font-bold"
                  style={{ background: "#F5F4F8", color: "#07070E" }}
                >
                  Shop on TikTok
                </div>
              </div>
            </a>
          );
        })}
      </div>
    </section>
  );
}
