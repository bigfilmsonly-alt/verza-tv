"use client";

import { useAmazonBag } from "@/lib/amazon-bag";
import { productImage } from "@/lib/amazon-sponsors";
import { T } from "@/lib/theme";

/* ------------------------------------------------------------------ */
/*  The Verza bag: floating button + drawer                            */
/*                                                                      */
/*  Mounted inside the device frame, so the bag follows shoppers across */
/*  the browse grid, search and /amazon. The floating pill only appears */
/*  once something is in it, so it never covers the app for free.       */
/*                                                                      */
/*  Positioning lives in globals.css under .amazon-bag-layer: pinned to */
/*  the viewport on mobile, anchored to the iPhone frame on desktop —    */
/*  there the nav is docked INSIDE the frame, so a viewport-fixed bag    */
/*  would slide under it and get clipped. Width is capped at the 440px   */
/*  app-shell width so it lines up with the app either way.              */
/* ------------------------------------------------------------------ */

export default function AmazonBag() {
  return (
    <>
      <BagButton />
      <BagDrawer />
    </>
  );
}

function BagButton() {
  const { itemCount, isOpen, openBag } = useAmazonBag();

  // Nothing in the bag, or the drawer is already showing it.
  if (itemCount === 0 || isOpen) return null;

  return (
    <div
      className="amazon-bag-layer amazon-bag-fab left-1/2 -translate-x-1/2 w-full flex justify-end px-4 pointer-events-none"
      style={{ maxWidth: 440 }}
    >
      <button
        onClick={openBag}
        className="pointer-events-auto flex items-center gap-2 rounded-full pl-3.5 pr-4 py-2.5 border-0 cursor-pointer font-bold text-[13px] transition-transform active:scale-[0.96]"
        style={{ background: "#FF9900", color: "#232F3E", boxShadow: "0 6px 22px rgba(0,0,0,0.45)" }}
        aria-label={`Open your Amazon bag, ${itemCount} item${itemCount === 1 ? "" : "s"}`}
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#232F3E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="9" cy="20" r="1.5" />
          <circle cx="18" cy="20" r="1.5" />
          <path d="M2 3h3l2.6 11.4a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6L21 7H6" />
        </svg>
        {itemCount} in bag
      </button>
    </div>
  );
}

function BagDrawer() {
  const { items, isOpen, closeBag, removeItem, updateQuantity, clear, itemCount, cartUrl } =
    useAmazonBag();

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="amazon-bag-layer inset-0"
        style={{ background: "rgba(0,0,0,0.6)" }}
        onClick={closeBag}
      />

      {/* Drawer */}
      <div
        className="amazon-bag-layer bottom-0 left-1/2 -translate-x-1/2 w-full rounded-t-2xl flex flex-col"
        style={{
          maxWidth: 440,
          maxHeight: "84dvh",
          background: T.bg,
          borderTop: `1px solid ${T.line}`,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold" style={{ color: T.text }}>
              Your bag ({itemCount})
            </h2>
            <p className="text-[11px] mt-0.5" style={{ color: T.textMute }}>
              Sponsored · Amazon
            </p>
          </div>
          <button
            onClick={closeBag}
            className="w-8 h-8 flex items-center justify-center rounded-full border-0 cursor-pointer text-lg"
            style={{ background: T.raised, color: T.text }}
            aria-label="Close bag"
          >
            &times;
          </button>
        </div>

        {items.length === 0 ? (
          <div className="px-4 pb-10 pt-2 text-center">
            <p className="text-sm" style={{ color: T.textMute }}>
              Your bag is empty.
            </p>
          </div>
        ) : (
          <>
            {/* Items */}
            <div className="overflow-y-auto px-4 flex-1">
              {items.map(({ product: p, quantity }) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 py-3"
                  style={{ borderBottom: `1px solid ${T.line}` }}
                >
                  <div
                    className="relative flex-shrink-0 rounded-lg overflow-hidden"
                    style={{
                      width: 52,
                      height: 52,
                      background: "#000",
                      border: `1px solid ${T.line}`,
                    }}
                  >
                    {/* 52px on screen, so 400px covers even a 3x display. */}
                    {productImage(p, 300) && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={productImage(p, 300)}
                        alt={p.title}
                        decoding="async"
                        className="w-full h-full object-contain"
                        style={{ padding: 4 }}
                      />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-semibold leading-snug line-clamp-2" style={{ color: T.text }}>
                      {p.title}
                    </p>
                    <button
                      onClick={() => removeItem(p.id)}
                      className="mt-1 text-[11px] border-0 bg-transparent p-0 cursor-pointer"
                      style={{ color: T.textMute }}
                    >
                      Remove
                    </button>
                  </div>

                  {/* Quantity */}
                  <div
                    className="flex items-center gap-2 rounded-full px-1 py-1 flex-shrink-0"
                    style={{ background: T.raised }}
                  >
                    <button
                      onClick={() => updateQuantity(p.id, quantity - 1)}
                      className="w-6 h-6 rounded-full flex items-center justify-center border-0 cursor-pointer text-sm"
                      style={{ background: "transparent", color: T.text }}
                      aria-label={`Decrease quantity of ${p.title}`}
                    >
                      &minus;
                    </button>
                    <span className="text-[12px] font-bold tabular-nums w-3 text-center" style={{ color: T.text }}>
                      {quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(p.id, quantity + 1)}
                      className="w-6 h-6 rounded-full flex items-center justify-center border-0 cursor-pointer text-sm"
                      style={{ background: "transparent", color: T.text }}
                      aria-label={`Increase quantity of ${p.title}`}
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Handoff — every item goes into the real Amazon cart in one trip,
                tagged to verzatv-20. Amazon owns checkout; we own everything
                that happens before it. */}
            <div
              className="px-4 pt-4 flex-shrink-0"
              style={{
                borderTop: `1px solid ${T.line}`,
                paddingBottom: "calc(16px + env(safe-area-inset-bottom, 0px))",
              }}
            >
              {cartUrl && (
                <a
                  href={cartUrl}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  className="w-full flex items-center justify-center gap-2 no-underline rounded-2xl py-3.5 text-sm font-bold transition-transform active:scale-[0.98]"
                  style={{ background: "#FF9900", color: "#232F3E" }}
                >
                  Send {itemCount} item{itemCount === 1 ? "" : "s"} to Amazon cart
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#232F3E" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </a>
              )}

              <div className="flex items-center justify-between mt-3">
                <button
                  onClick={closeBag}
                  className="text-[12px] font-semibold border-0 bg-transparent p-0 cursor-pointer"
                  style={{ color: T.accent }}
                >
                  Keep shopping
                </button>
                <button
                  onClick={clear}
                  className="text-[12px] border-0 bg-transparent p-0 cursor-pointer"
                  style={{ color: T.textMute }}
                >
                  Clear bag
                </button>
              </div>

              <p className="mt-3 text-center text-[11px] leading-relaxed" style={{ color: "rgba(245,244,248,0.4)" }}>
                Prices and checkout are handled by Amazon. As an Amazon Associate, Verza TV earns from qualifying purchases.
              </p>
            </div>
          </>
        )}
      </div>
    </>
  );
}
