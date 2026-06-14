"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart";
import type { Product } from "@/lib/products";
import { T } from "@/lib/theme";

export default function AddToCartButton({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [qty, setQty] = useState(1);

  return (
    <div className="flex flex-col gap-3">
      {/* Quantity */}
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium" style={{ color: T.textDim }}>
          Qty
        </span>
        <div
          className="flex items-center rounded-lg overflow-hidden"
          style={{ border: `1px solid ${T.line}` }}
        >
          <button
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="w-10 h-10 flex items-center justify-center text-lg font-bold border-0 cursor-pointer"
            style={{ background: T.raised, color: T.text }}
          >
            -
          </button>
          <span
            className="w-12 h-10 flex items-center justify-center text-sm font-bold"
            style={{ background: T.surface, color: T.text }}
          >
            {qty}
          </span>
          <button
            onClick={() => setQty((q) => q + 1)}
            className="w-10 h-10 flex items-center justify-center text-lg font-bold border-0 cursor-pointer"
            style={{ background: T.raised, color: T.text }}
          >
            +
          </button>
        </div>
      </div>

      {/* Add Button */}
      <button
        onClick={() => {
          for (let i = 0; i < qty; i++) addItem(product);
          setQty(1);
        }}
        className="w-full py-3.5 rounded-xl text-sm font-bold border-0 cursor-pointer transition-opacity hover:opacity-90"
        style={{ background: T.accent, color: "#fff" }}
      >
        Add to Cart &middot; ${(product.price * qty).toFixed(2)}
      </button>
    </div>
  );
}
