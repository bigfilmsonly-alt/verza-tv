"use client";

import { useCart } from "@/lib/cart";
import { T } from "@/lib/theme";

export default function CartButton() {
  const { itemCount, openCart } = useCart();

  return (
    <button
      onClick={openCart}
      className="relative flex items-center justify-center w-10 h-10 rounded-full border-0 cursor-pointer"
      style={{ background: T.raised }}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke={T.text}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </svg>
      {itemCount > 0 && (
        <span
          className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
          style={{ background: T.accent, color: "#fff" }}
        >
          {itemCount}
        </span>
      )}
    </button>
  );
}
