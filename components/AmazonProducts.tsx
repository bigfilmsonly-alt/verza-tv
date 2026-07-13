"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { productImage, productSrcSet, isCartable, type AmazonProduct, type AmazonIcon } from "@/lib/amazon-sponsors";
import { useAmazonBag } from "@/lib/amazon-bag";

/* ------------------------------------------------------------------ */
/*  Amazon sponsored tile + in-app product modal                       */
/*                                                                      */
/*  Two layouts: the /amazon store page, and the shop section in the    */
/*  footer. Products deliberately no longer appear in the poster grid   */
/*  or in search — browsing stays editorial, and everything for sale    */
/*  lives in the footer shop.                                           */
/*                                                                      */
/*  Tapping a tile opens an in-app modal: shoppers stay inside Verza TV */
/*  and add to the Verza bag. Nothing leaves the app until the single   */
/*  Amazon cart handoff.                                                */
/* ------------------------------------------------------------------ */

// Category glyphs, used for the placeholder when the product photo is missing
// or fails to load.
function CategoryGlyph({ icon, size = 44 }: { icon: AmazonIcon; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "rgba(255,255,255,0.95)",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  switch (icon) {
    case "skincare": // dropper bottle
      return (
        <svg {...common}>
          <path d="M9 2h6M10 2v3.5L7.5 9A4 4 0 0 0 7 11v8a3 3 0 0 0 3 3h4a3 3 0 0 0 3-3v-8a4 4 0 0 0-.5-2L14 5.5V2" />
          <path d="M7 14h10" />
        </svg>
      );
    case "body": // lotion pump bottle
      return (
        <svg {...common}>
          <path d="M9 7h6a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z" />
          <path d="M10 7V5a1 1 0 0 1 1-1h2M13 4h3v2" />
        </svg>
      );
    case "makeup": // mascara wand
      return (
        <svg {...common}>
          <path d="M14 3.5l6.5 6.5" />
          <rect x="2.5" y="13" width="9" height="9" rx="1.5" transform="rotate(-45 7 17.5)" />
          <path d="M13 4.5l3 3M15.5 7l3 3" />
        </svg>
      );
    case "dress":
      return (
        <svg {...common}>
          <path d="M9 3l3 2 3-2" />
          <path d="M9 3l-1 4 2 2-3 12h10L14 9l2-2-1-4" />
        </svg>
      );
    case "top":
      return (
        <svg {...common}>
          <path d="M8 3L4 6l2 3 2-1v10h8V8l2 1 2-3-4-3" />
          <path d="M8 3h8a4 4 0 0 1-8 0z" />
        </svg>
      );
    case "blanket":
      return (
        <svg {...common}>
          <path d="M4 6h16v9a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V6z" />
          <path d="M4 10c2 1.4 4 1.4 6 0s4-1.4 6 0 4 1.4 4 0" />
        </svg>
      );
    case "drink": // tumbler
      return (
        <svg {...common}>
          <path d="M8 3h8l-1 18H9L8 3z" />
          <path d="M8.4 8h7.2" />
        </svg>
      );
    case "light":
      return (
        <svg {...common}>
          <path d="M9 18h6M10 21h4" />
          <path d="M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.3 1 2.5h6c0-1.2.3-1.8 1-2.5A6 6 0 0 0 12 3z" />
        </svg>
      );
    default:
      return null;
  }
}

/**
 * The product visual: the product photo on a white card, matching the merch in
 * /shop, and falling back to a branded gradient the moment the image 404s.
 *
 * The photos are still the transparent cutouts from scripts/amazon-cutouts.py.
 * On white they look exactly like Amazon's originals, and keeping them means the
 * card can be recoloured (to the brand gradient, say) without redoing the assets.
 *
 * object-contain, never cover: cropping a lotion bottle to fit the tile would
 * cut the product in half.
 */
function ProductVisual({
  p,
  glyphSize,
  sizes,
  priority = false,
}: {
  p: AmazonProduct;
  glyphSize: number;
  /** How wide this image actually renders, so the browser picks the right file. */
  sizes: string;
  /** True for the modal hero: it is the thing being looked at, so fetch it now. */
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const [from, to] = p.accent ?? ["#FF9900", "#232F3E"];
  const src = productImage(p, 800);
  const srcSet = productSrcSet(p);

  if (src && !failed) {
    return (
      <div className="absolute inset-0" style={{ background: "#FFFFFF" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          srcSet={srcSet}
          sizes={sizes}
          alt={p.title}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          decoding="async"
          onError={() => setFailed(true)}
          className="w-full h-full object-contain"
          style={{ padding: "8%" }}
        />
      </div>
    );
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

// Two across wherever it renders (/shop and /amazon), so one size hint serves
// both. Square, not poster-shaped: these are product shots, and it lines the
// tiles up with the square merch cards on /shop.
const TILE_SIZES = "(max-width: 440px) 50vw, 210px";

export default function AmazonTile({ product: p }: { product: AmazonProduct }) {
  const [open, setOpen] = useState(false);
  const { has } = useAmazonBag();
  const inBag = has(p.id);

  return (
    <>
      <button
        // Anchor target for /amazon?p=<id>, so a product can be linked directly.
        // Safe on both pages: each product renders at most once per page.
        id={p.id}
        onClick={() => setOpen(true)}
        className="group block w-full text-left no-underline min-w-0 transition-transform active:scale-[0.97] p-0 border-0 bg-transparent cursor-pointer"
        aria-label={`View ${p.title}`}
      >
        <div className="relative overflow-hidden rounded-lg" style={{ aspectRatio: "1 / 1" }}>
          <ProductVisual p={p} glyphSize={44} sizes={TILE_SIZES} />

          {/* Ad label (top-left) */}
          <span
            className="absolute top-1.5 left-1.5 text-[8px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full"
            style={{ background: "rgba(0,0,0,0.6)", color: "#fff", backdropFilter: "blur(4px)" }}
          >
            Ad
          </span>

          {/* In-bag check (top-right) — instant feedback that it is already in */}
          {inBag && (
            <span
              className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center"
              style={{ background: "#FF9900" }}
              aria-label="In your bag"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#232F3E" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </span>
          )}

          {/* Category badge (bottom-right). We show no price on purpose: Amazon
              only permits displaying prices pulled live from their API, and a
              hardcoded one would be wrong within the week. */}
          {p.badge && (
            <span
              className="absolute bottom-1.5 right-1.5 text-[9px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: "rgba(0,0,0,0.68)", color: "#fff", backdropFilter: "blur(4px)" }}
            >
              {p.badge}
            </span>
          )}

          {/* CTA — always visible on touch, reveals on hover for desktop */}
          <div
            className="absolute inset-x-0 bottom-0 flex items-center justify-center pt-8 pb-2 md:opacity-0 md:group-hover:opacity-100 md:inset-0 md:pb-0 md:pt-0 md:transition-opacity md:duration-300 z-10"
            style={{ background: "linear-gradient(to top, rgba(0,0,0,0.55), transparent)" }}
          >
            <div className="px-3 py-1.5 rounded-full text-[11px] font-bold" style={{ background: "#FF9900", color: "#232F3E" }}>
              {inBag ? "In your bag" : "View product"}
            </div>
          </div>
        </div>

        {/* Caption. Each tile carries its own "Sponsored · Amazon" line, so the
            disclosure travels with the product wherever the tile is used. */}
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

/* ---- In-app product modal (shoppers stay inside Verza TV) ---- */
function AmazonProductModal({ product: p, onClose }: { product: AmazonProduct; onClose: () => void }) {
  const [mounted, setMounted] = useState(false);
  const { addItem, has } = useAmazonBag();
  const inBag = has(p.id);
  const cartable = isCartable(p);

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

        {/* Product visual — the hero of this sheet, so it loads at full density. */}
        <div className="relative w-full" style={{ aspectRatio: "16 / 11", background: "#fff" }}>
          <ProductVisual
            p={p}
            glyphSize={84}
            sizes="(max-width: 440px) 100vw, 420px"
            priority
          />
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
          {p.description && (
            <p className="mt-2.5 text-sm leading-relaxed" style={{ color: "rgba(245,244,248,0.7)" }}>
              {p.description}
            </p>
          )}

          {cartable ? (
            <>
              {/* Primary: keep them in the app. The bag batches everything into
                  one Amazon trip instead of bouncing them out per product. */}
              <button
                onClick={() => {
                  addItem(p);
                  onClose();
                }}
                className="mt-5 w-full flex items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold border-0 cursor-pointer transition-transform active:scale-[0.98]"
                style={{ background: "#FF9900", color: "#232F3E" }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#232F3E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="9" cy="20" r="1.5" />
                  <circle cx="18" cy="20" r="1.5" />
                  <path d="M2 3h3l2.6 11.4a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6L21 7H6" />
                </svg>
                {inBag ? "Add another to bag" : "Add to bag"}
              </button>

              <a
                href={p.url}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="mt-2.5 w-full flex items-center justify-center gap-2 no-underline rounded-2xl py-3 text-sm font-semibold transition-transform active:scale-[0.98]"
                style={{ background: "rgba(255,255,255,0.07)", color: "#F5F4F8", border: "1px solid rgba(255,255,255,0.12)" }}
              >
                View on Amazon
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <path d="M15 3h6v6M10 14L21 3" />
                </svg>
              </a>
            </>
          ) : (
            /* Search links have no single ASIN, so there is nothing for Amazon
               to put in a cart. Send them straight to the results instead. */
            <a
              href={p.url}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="mt-5 w-full flex items-center justify-center gap-2 no-underline rounded-2xl py-3.5 text-sm font-bold transition-transform active:scale-[0.98]"
              style={{ background: "#FF9900", color: "#232F3E" }}
            >
              Shop on Amazon
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#232F3E" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M15 3h6v6M10 14L21 3" />
              </svg>
            </a>
          )}

          <p className="mt-3 text-center text-[11px] leading-relaxed" style={{ color: "rgba(245,244,248,0.4)" }}>
            Price shown on Amazon. Checkout completes on Amazon. As an Amazon Associate, Verza TV earns from qualifying purchases.
          </p>
        </div>
      </div>
    </div>,
    document.body,
  );
}
