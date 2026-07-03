"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import type { AmazonProduct, AmazonIcon } from "@/lib/amazon-sponsors";

/* ------------------------------------------------------------------ */
/*  Amazon sponsored tile + in-app product modal                       */
/*                                                                      */
/*  The tile is shaped EXACTLY like a movie poster (2:3) so it drops    */
/*  straight into the 3-column poster grid. Tapping it opens an in-app  */
/*  product modal (users stay inside Verza TV); the final "Buy on       */
/*  Amazon" button hands off to the affiliate link.                     */
/* ------------------------------------------------------------------ */

// Category glyphs used for the branded placeholder when no photo is supplied.
function CategoryGlyph({ icon, size = 48 }: { icon: AmazonIcon; size?: number }) {
  const stroke = "rgba(255,255,255,0.95)";
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke,
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  switch (icon) {
    case "device":
      return (
        <svg {...common}>
          <rect x="2" y="4" width="20" height="13" rx="2" />
          <path d="M8 21h8M12 17v4" />
        </svg>
      );
    case "audio":
      return (
        <svg {...common}>
          <path d="M11 5 6 9H2v6h4l5 4V5z" />
          <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />
        </svg>
      );
    case "power":
      return (
        <svg {...common}>
          <rect x="2" y="7" width="17" height="10" rx="2" />
          <path d="M22 10v4" />
          <path d="M8 9l-2 3h3l-2 3" stroke="#FFD27A" />
        </svg>
      );
    case "light":
      return (
        <svg {...common}>
          <path d="M9 18h6M10 21h4" />
          <path d="M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.3 1 2.5h6c0-1.2.3-1.8 1-2.5A6 6 0 0 0 12 3z" />
        </svg>
      );
    case "home":
      return (
        <svg {...common}>
          <path d="M6 8h12l-1 12H7L6 8z" />
          <path d="M9 8V6a3 3 0 0 1 6 0v2" />
        </svg>
      );
    case "wear":
      return (
        <svg {...common}>
          <circle cx="7" cy="12" r="3.2" />
          <circle cx="17" cy="12" r="3.2" />
          <path d="M10.2 12h3.6M2.5 11l1.8-1M21.5 11l-1.8-1" />
        </svg>
      );
    default:
      return null;
  }
}

// The product visual (photo if given, else gradient + category glyph). Shared
// by the tile and the modal so they always match.
function ProductVisual({ p, glyphSize }: { p: AmazonProduct; glyphSize: number }) {
  const [from, to] = p.accent ?? ["#FF9900", "#232F3E"];
  if (p.image) {
    return <Image src={p.image} alt={p.title} fill sizes="(max-width: 440px) 90vw, 380px" className="object-cover" />;
  }
  return (
    <div
      className="absolute inset-0 flex items-center justify-center"
      style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
    >
      {p.icon ? <CategoryGlyph icon={p.icon} size={glyphSize} /> : null}
    </div>
  );
}

export default function AmazonTile({ product: p }: { product: AmazonProduct }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="group block w-full text-left no-underline min-w-0 transition-transform active:scale-[0.97] p-0 border-0 bg-transparent cursor-pointer"
        aria-label={`View ${p.title}`}
      >
        {/* Poster-shaped tile (matches the movie tiles exactly) */}
        <div className="relative overflow-hidden rounded-lg" style={{ aspectRatio: "2 / 3" }}>
          <ProductVisual p={p} glyphSize={48} />

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

          {/* CTA — always visible on touch, reveals on hover for desktop */}
          <div
            className="absolute inset-x-0 bottom-0 flex items-center justify-center pt-8 pb-2 md:opacity-0 md:group-hover:opacity-100 md:inset-0 md:pb-0 md:pt-0 md:transition-opacity md:duration-300 z-10"
            style={{ background: "linear-gradient(to top, rgba(0,0,0,0.55), transparent)" }}
          >
            <div className="px-3 py-1.5 rounded-full text-[11px] font-bold" style={{ background: "#FF9900", color: "#232F3E" }}>
              View product
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
      </button>

      {open && <AmazonProductModal product={p} onClose={() => setOpen(false)} />}
    </>
  );
}

/* ---- In-app product modal (stays inside Verza TV) ---- */
function AmazonProductModal({ product: p, onClose }: { product: AmazonProduct; onClose: () => void }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center"
      style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(6px)" }}
      onMouseDown={onClose}
    >
      <div
        className="relative w-full md:w-[420px] max-h-[92vh] overflow-y-auto rounded-t-3xl md:rounded-3xl"
        style={{ background: "#0D0D16", border: "1px solid rgba(255,255,255,0.08)" }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full flex items-center justify-center border-0 cursor-pointer"
          style={{ background: "rgba(0,0,0,0.5)", color: "#fff", backdropFilter: "blur(4px)" }}
          aria-label="Close"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        {/* Product visual */}
        <div className="relative w-full" style={{ aspectRatio: "16 / 10", background: "#000" }}>
          <ProductVisual p={p} glyphSize={92} />
          <span
            className="absolute top-3 left-3 text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full"
            style={{ background: "rgba(0,0,0,0.6)", color: "#fff", backdropFilter: "blur(4px)" }}
          >
            Sponsored · Amazon
          </span>
        </div>

        {/* Details */}
        <div className="px-5 pt-4 pb-6">
          {p.badge && (
            <span
              className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mb-2"
              style={{ background: "rgba(255,153,0,0.18)", color: "#FF9900" }}
            >
              {p.badge}
            </span>
          )}
          <h2 className="text-lg font-bold leading-tight" style={{ color: "#F5F4F8" }}>
            {p.title}
          </h2>
          <p className="mt-1 text-2xl font-extrabold" style={{ color: "#FF9900" }}>
            {p.price}
          </p>
          {p.description && (
            <p className="mt-3 text-sm leading-relaxed" style={{ color: "rgba(245,244,248,0.7)" }}>
              {p.description}
            </p>
          )}

          <a
            href={p.url}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="mt-5 w-full flex items-center justify-center gap-2 no-underline rounded-2xl py-3.5 text-sm font-bold transition-transform active:scale-[0.98]"
            style={{ background: "#FF9900", color: "#232F3E" }}
          >
            {/* Amazon smile arrow */}
            <svg width="20" height="20" viewBox="0 0 48 48" fill="none" aria-hidden="true">
              <path d="M8 30c5.5 4 12 6 18 6s12.5-2 18-6" stroke="#232F3E" strokeWidth="3.4" strokeLinecap="round" />
              <path d="M36 33c1.6-1 3-2.3 4-4" stroke="#232F3E" strokeWidth="3.4" strokeLinecap="round" />
            </svg>
            Buy on Amazon
          </a>
          <p className="mt-2.5 text-center text-[11px]" style={{ color: "rgba(245,244,248,0.4)" }}>
            Secure checkout completes on Amazon · As an Amazon Associate, Verza TV earns from qualifying purchases.
          </p>
        </div>
      </div>
    </div>,
    document.body,
  );
}
