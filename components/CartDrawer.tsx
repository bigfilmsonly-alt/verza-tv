"use client";

import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/lib/cart";
import { T } from "@/lib/theme";

export default function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, subtotal } =
    useCart();

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50"
        style={{ background: "rgba(0,0,0,0.6)" }}
        onClick={closeCart}
      />

      {/* Drawer */}
      <div
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full z-50 rounded-t-2xl flex flex-col"
        style={{
          maxWidth: 440,
          maxHeight: "80dvh",
          background: T.bg,
          borderTop: `1px solid ${T.line}`,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4">
          <h2 className="text-lg font-bold" style={{ color: T.text }}>
            Cart ({items.length})
          </h2>
          <button
            onClick={closeCart}
            className="w-8 h-8 flex items-center justify-center rounded-full border-0 cursor-pointer"
            style={{ background: T.raised, color: T.text }}
          >
            &times;
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-4">
          {items.length === 0 ? (
            <p
              className="text-sm text-center py-8"
              style={{ color: T.textMute }}
            >
              Your cart is empty
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {items.map((item) => (
                <div
                  key={item.product.id}
                  className="flex items-center gap-3 rounded-xl p-3"
                  style={{ background: T.surface }}
                >
                  {/* Thumbnail */}
                  <div
                    className="w-14 h-14 rounded-lg flex-shrink-0 overflow-hidden relative"
                    style={{ background: T.raised }}
                  >
                    {item.product.images[0] ? (
                      <Image
                        src={item.product.images[0]}
                        alt={item.product.name}
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold" style={{ color: T.textMute }}>
                        {item.product.name.replace("VerzaTV ", "").split(" ")[0]}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-xs font-semibold truncate"
                      style={{ color: T.text }}
                    >
                      {item.product.name}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: T.accent }}>
                      ${item.product.price.toFixed(2)}
                    </p>
                  </div>

                  {/* Quantity controls */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() =>
                        updateQuantity(item.product.id, item.quantity - 1)
                      }
                      className="w-7 h-7 rounded flex items-center justify-center text-sm font-bold border-0 cursor-pointer"
                      style={{ background: T.raised, color: T.text }}
                    >
                      -
                    </button>
                    <span
                      className="w-6 text-center text-xs font-bold"
                      style={{ color: T.text }}
                    >
                      {item.quantity}
                    </span>
                    <button
                      onClick={() =>
                        updateQuantity(item.product.id, item.quantity + 1)
                      }
                      className="w-7 h-7 rounded flex items-center justify-center text-sm font-bold border-0 cursor-pointer"
                      style={{ background: T.raised, color: T.text }}
                    >
                      +
                    </button>
                  </div>

                  {/* Remove */}
                  <button
                    onClick={() => removeItem(item.product.id)}
                    className="text-xs border-0 bg-transparent cursor-pointer"
                    style={{ color: T.textMute }}
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div
            className="px-4 py-4"
            style={{ borderTop: `1px solid ${T.line}` }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium" style={{ color: T.textDim }}>
                Subtotal
              </span>
              <span className="text-lg font-bold" style={{ color: T.text }}>
                ${subtotal.toFixed(2)}
              </span>
            </div>
            <button
              onClick={async () => {
                try {
                  const res = await fetch("/api/checkout", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      items: items.map((i) => ({
                        productId: i.product.id,
                        name: i.product.name,
                        quantity: i.quantity,
                        priceCents: Math.round(i.product.price * 100),
                        imageUrl: i.product.images?.[0] ?? undefined,
                      })),
                    }),
                  });
                  const data = await res.json();
                  if (data.url) {
                    window.location.href = data.url;
                  }
                } catch (err) {
                  console.error("Checkout error:", err);
                }
              }}
              className="w-full py-3.5 rounded-xl text-sm font-bold text-center transition-opacity hover:opacity-90 border-0 cursor-pointer"
              style={{ background: T.accent, color: "#fff" }}
            >
              Checkout
            </button>
          </div>
        )}
      </div>
    </>
  );
}
