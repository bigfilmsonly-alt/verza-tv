"use client";

import { useState } from "react";
import { getLiveSeries } from "@/lib/catalog";
import { emit } from "@/lib/analytics";

/**
 * Summer Sale promo badge — lives INSIDE the sticky header so it never moves
 * relative to it (no overscroll desync / clipping). Tapping it opens a $1.99
 * Stripe checkout for the most popular live movie.
 */
export default function SummerSaleBadge() {
  const [loading, setLoading] = useState(false);

  // Most popular live series makes the strongest $1.99 CTA.
  const featured = [...getLiveSeries()].sort(
    (a, b) => (a.popularRank ?? 999) - (b.popularRank ?? 999),
  )[0];

  async function startCheckout() {
    if (loading || !featured) return;
    setLoading(true);
    try {
      emit("checkout_started", {
        show_id: featured.slug,
        plan_type: "series_unlock",
        surface: "summer_sale_badge",
      });
      const res = await fetch("/api/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seriesSlug: featured.slug }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else setLoading(false);
    } catch {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={startCheckout}
      disabled={loading || !featured}
      className="border-0 bg-transparent p-0 cursor-pointer disabled:opacity-70"
      aria-label="Summer Sale — $1.99 a movie"
    >
      <div
        className="flex items-center gap-2 pl-2.5 pr-1 py-1 rounded-full"
        style={{
          background:
            "linear-gradient(180deg, rgba(28,24,12,0.85), rgba(10,10,16,0.85))",
          // Thin, bright pure-gold rim with a gold glow.
          border: "1px solid #FFD700",
          boxShadow:
            "0 6px 22px rgba(0,0,0,0.5), 0 0 16px rgba(255,215,0,0.55), 0 0 4px rgba(255,215,0,0.7), inset 0 1px 0 rgba(255,255,255,0.12)",
        }}
      >
        {/* sun / sparkle mark */}
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#F5E7B8"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="flex-shrink-0"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
        <span
          className="text-[10px] font-semibold uppercase"
          style={{ letterSpacing: "0.2em", color: "#EFE2B6" }}
        >
          Summer Sale
        </span>
        <span
          className="self-stretch w-px my-0.5"
          style={{ background: "rgba(255,215,0,0.6)" }}
        />
        <span
          className="flex items-baseline gap-0.5 px-2.5 py-1 rounded-full whitespace-nowrap"
          style={{
            background: "linear-gradient(180deg, #FBF0CB, #D4AF37)",
            color: "#1A1206",
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.7), inset 0 -1px 0 rgba(120,90,20,0.35)",
          }}
        >
          <span className="text-sm font-extrabold leading-none">$1.99</span>
          <span className="text-[10px] font-semibold leading-none">a movie</span>
        </span>
      </div>
    </button>
  );
}
