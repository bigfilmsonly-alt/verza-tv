"use client";

import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Sliding hero carousel for the Tubi partner panel. Auto-rotates through the
 * featured-titles screenshots, with a gradient-framed rounded container that
 * matches the Tubi promo styling. Dots + swipe for manual control; no arrows
 * (consistent with the rest of the site's heroes). Self-contained so its
 * interval only runs while the Tubi tab is mounted.
 */
export default function TubiHeroCarousel({ images }: { images: string[] }) {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = images.length;

  // Auto-rotate (4s, matching the site's other heroes). Pauses on hover.
  useEffect(() => {
    if (count <= 1 || paused) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % count), 4000);
    return () => clearInterval(t);
  }, [count, paused]);

  // Touch swipe — stopPropagation so the parent tab-swipe doesn't also fire.
  const startX = useRef<number | null>(null);
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    e.stopPropagation();
    startX.current = e.touches[0].clientX;
  }, []);
  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      e.stopPropagation();
      if (startX.current === null) return;
      const dx = e.changedTouches[0].clientX - startX.current;
      if (Math.abs(dx) > 40) {
        setIdx((i) => (dx < 0 ? (i + 1) % count : (i - 1 + count) % count));
      }
      startX.current = null;
    },
    [count],
  );

  return (
    <div className="w-full max-w-[420px] mb-6">
      {/* Gradient ring + glow — same frame as the Tubi logo below */}
      <div
        style={{ padding: 2, borderRadius: 20, background: "linear-gradient(135deg, #4B01A5, #7401CB)", boxShadow: "0 0 50px rgba(116,1,203,0.4)" }}
      >
        <div
          style={{ borderRadius: 18, overflow: "hidden" }}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {/* Sliding track */}
          <div
            className="flex"
            style={{ transform: `translateX(-${idx * 100}%)`, transition: "transform 0.55s cubic-bezier(0.4,0,0.2,1)" }}
          >
            {images.map((src, i) => (
              <img
                key={src}
                src={src}
                alt="Featured free movies and shows on Tubi"
                className="shrink-0"
                style={{ width: "100%", height: "auto", display: "block" }}
                loading={i === 0 ? "eager" : "lazy"}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Dots */}
      {count > 1 && (
        <div className="flex justify-center gap-2 mt-3">
          {images.map((src, i) => (
            <button
              key={src}
              aria-label={`Show slide ${i + 1}`}
              onClick={() => setIdx(i)}
              className="rounded-full transition-all"
              style={{
                width: i === idx ? 22 : 7,
                height: 7,
                background: i === idx ? "linear-gradient(135deg, #7401CB, #FFFF12)" : "rgba(255,255,255,0.25)",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
