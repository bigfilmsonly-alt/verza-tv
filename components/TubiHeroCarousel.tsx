"use client";

import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Sliding hero carousel for the Tubi partner panel. Auto-rotates through the
 * featured-title banners inside a gradient-framed, rounded container. Dots +
 * swipe for manual control; no arrows (consistent with the rest of the site's
 * heroes). Self-contained so its interval only runs while the Tubi tab is
 * mounted.
 *
 * heightStyle: optional CSS height (ideally a clamp() using dvh) that HARD-CAPS
 * the image box so the panel fits the fold with no vertical scroll. Images crop
 * with objectFit:cover to fill the capped box cleanly. Best paired with the
 * short wide 1000x420 banner assets so the featured cards stay fully in frame.
 */
export default function TubiHeroCarousel({
  images,
  heightStyle,
  aspectRatio,
}: {
  images: string[];
  heightStyle?: string;
  /** When set (e.g. "1000 / 420"), the box takes the image's native aspect
   *  ratio so banners show FULLY with no cover-crop; height auto-derives from
   *  width. Preferred over heightStyle for the wide Tubi banners. */
  aspectRatio?: string;
}) {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = images.length;
  const boxHeight = heightStyle ?? "auto";
  const boxSizing: React.CSSProperties = aspectRatio
    ? { aspectRatio, width: "100%" }
    : { height: boxHeight };

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
    <div className="w-full max-w-[420px] shrink-0">
      {/* Gradient ring + glow — same frame language as the Tubi logo below */}
      <div
        style={{ padding: 2, borderRadius: 18, background: "linear-gradient(135deg, #4B01A5, #7401CB)", boxShadow: "0 0 44px rgba(116,1,203,0.45)" }}
      >
        <div
          style={{ borderRadius: 16, overflow: "hidden", ...boxSizing }}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {/* Sliding track — each slide fills and cover-crops the capped box */}
          <div
            className="flex"
            style={{
              height: "100%",
              transform: `translateX(-${idx * 100}%)`,
              transition: "transform 0.55s cubic-bezier(0.4,0,0.2,1)",
            }}
          >
            {images.map((src, i) => (
              <img
                key={src}
                src={src}
                alt="Featured free movies and shows on Tubi"
                draggable={false}
                className="shrink-0"
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                /* Eager-load every slide: they're small webp banners and sit
                   translated off-screen inside overflow:hidden, so lazy would
                   flash blank on the first auto-rotate. */
                loading="eager"
                fetchPriority={i === 0 ? "high" : "low"}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Dots */}
      {count > 1 && (
        <div className="flex justify-center gap-2 mt-2">
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
