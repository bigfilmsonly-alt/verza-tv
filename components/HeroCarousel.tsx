"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Series } from "@/lib/catalog";

interface HeroCarouselProps {
  series: Series[];
}

export default function HeroCarousel({ series }: HeroCarouselProps) {
  const [active, setActive] = useState(0);
  const count = series.length;
  const current = series[active];

  const goTo = useCallback(
    (i: number) => setActive(Math.max(0, Math.min(i, count - 1))),
    [count],
  );

  return (
    <div className="relative">
      {/* Hero image — full width, tall */}
      <Link href={`/series/${current.slug}`} className="block">
        <div className="relative w-full" style={{ height: "65dvh", minHeight: 420 }}>
          {current.posterUrl ? (
            <Image
              src={current.posterUrl}
              alt={current.title}
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          ) : (
            <div
              className="absolute inset-0 flex items-center justify-center text-lg font-bold"
              style={{ background: "linear-gradient(135deg, #1A1A26, #12121C)", color: "#6B6B7B" }}
            >
              {current.title}
            </div>
          )}
          {/* Bottom gradient fade */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, transparent 40%, rgba(7,7,14,0.7) 75%, #07070E 100%)",
            }}
          />
        </div>
      </Link>

      {/* Title below image */}
      <div className="px-4 -mt-16 relative z-10">
        <Link
          href={`/series/${current.slug}`}
          className="no-underline"
        >
          <h2
            className="text-[22px] font-extrabold leading-tight uppercase tracking-wide"
            style={{ color: "#F5F4F8" }}
          >
            {current.title}
          </h2>
        </Link>

        {/* Genre dot */}
        <p className="mt-1.5 text-xs" style={{ color: "#6B6B7B" }}>
          <span
            className="inline-block w-1.5 h-1.5 rounded-full mr-1.5"
            style={{ background: "#6B6B7B", verticalAlign: "middle" }}
          />
          {current.genre} &middot; {current.episodeCount} episodes
        </p>

        {/* Pagination dots */}
        <div className="flex items-center gap-2 mt-3">
          {series.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Show ${series[i].title}`}
              className="p-0 border-0 cursor-pointer"
              style={{ background: "none" }}
            >
              {i === active ? (
                <div
                  className="rounded-full"
                  style={{
                    width: 24,
                    height: 6,
                    background: "linear-gradient(90deg, #E0115F, #8B5CF6)",
                  }}
                />
              ) : (
                <div
                  className="rounded-full"
                  style={{
                    width: 6,
                    height: 6,
                    background: "#6B6B7B",
                  }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Swipe hint — hidden touch handlers */}
      <div
        className="absolute inset-0 z-10"
        style={{ pointerEvents: "none" }}
        onTouchStart={(e) => {
          const touch = e.touches[0];
          (e.currentTarget as HTMLElement).dataset.startX = String(touch.clientX);
        }}
        onTouchEnd={(e) => {
          const startX = Number((e.currentTarget as HTMLElement).dataset.startX);
          const endX = e.changedTouches[0].clientX;
          const diff = startX - endX;
          if (Math.abs(diff) > 50) {
            if (diff > 0 && active < count - 1) goTo(active + 1);
            if (diff < 0 && active > 0) goTo(active - 1);
          }
        }}
      />
    </div>
  );
}
