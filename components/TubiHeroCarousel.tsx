"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";

/**
 * Sliding hero carousel for the Tubi partner panel. Auto-rotates through the
 * featured-title banners inside a gradient-framed, rounded container.
 *
 * SEAMLESS INFINITE FORWARD LOOP: a clone of the first slide is appended to the
 * end. Auto-advance keeps moving forward (0,1,2,...,count) and, once the slide
 * onto the clone finishes, we jump back to the real first slide with NO
 * transition. Because the clone is pixel-identical to slide 0, the jump is
 * invisible, so it never "pops all the way back" through every slide.
 *
 * aspectRatio: e.g. "1080 / 655" — the box takes the banner's native ratio so
 * images show fully (no cover-crop of heads/titles); height derives from width.
 * heightStyle: legacy fixed-height fallback when aspectRatio is not given.
 */
export default function TubiHeroCarousel({
  images,
  heightStyle,
  aspectRatio,
}: {
  images: string[];
  heightStyle?: string;
  aspectRatio?: string;
}) {
  const count = images.length;
  const [idx, setIdx] = useState(0); // 0..count ; `count` = clone of slide 0
  const [animate, setAnimate] = useState(true);
  const [paused, setPaused] = useState(false);
  const boxSizing: React.CSSProperties = aspectRatio
    ? { aspectRatio, width: "100%" }
    : { height: heightStyle ?? "auto" };

  // Auto-advance forward, forever (4s). The clone + snap-back below keeps the
  // flow consistent instead of rewinding at the end.
  useEffect(() => {
    if (count <= 1 || paused) return;
    const t = setInterval(() => {
      setAnimate(true);
      setIdx((i) => i + 1);
    }, 4000);
    return () => clearInterval(t);
  }, [count, paused]);

  // When the slide ONTO the clone finishes, snap to the real first slide with
  // no transition (identical frame → invisible) to continue the loop.
  const onTransitionEnd = useCallback(
    (e: React.TransitionEvent) => {
      if (e.propertyName !== "transform") return;
      if (idx >= count) {
        setAnimate(false);
        setIdx(0);
      }
    },
    [idx, count],
  );

  // Re-arm the transition on the next frame after an instant (no-anim) snap.
  useEffect(() => {
    if (animate) return;
    const r = requestAnimationFrame(() => requestAnimationFrame(() => setAnimate(true)));
    return () => cancelAnimationFrame(r);
  }, [animate]);

  // Swipe: left = next (seamless via clone); right = prev, clamped at the first
  // slide so a back-swipe never triggers a long rewind. stopPropagation so the
  // parent tab-swipe doesn't also fire.
  const startX = useRef<number | null>(null);
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    e.stopPropagation();
    startX.current = e.touches[0].clientX;
  }, []);
  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    e.stopPropagation();
    if (startX.current === null) return;
    const dx = e.changedTouches[0].clientX - startX.current;
    if (Math.abs(dx) > 40) {
      setAnimate(true);
      setIdx((i) => (dx < 0 ? i + 1 : Math.max(0, i - 1)));
    }
    startX.current = null;
  }, []);

  const slides = count > 1 ? [...images, images[0]] : images;
  const activeDot = count > 0 ? idx % count : 0;

  return (
    <div className="w-full max-w-[440px] shrink-0">
      {/* Gradient ring + glow — same frame language as the Tubi logo */}
      <div
        style={{ padding: 2, borderRadius: 18, background: "linear-gradient(135deg, #4B01A5, #7401CB)", boxShadow: "0 0 48px rgba(116,1,203,0.5)" }}
      >
        <div
          style={{ borderRadius: 16, overflow: "hidden", ...boxSizing }}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {/* Sliding track */}
          <div
            className="flex"
            style={{
              height: "100%",
              transform: `translateX(-${idx * 100}%)`,
              transition: animate ? "transform 0.55s cubic-bezier(0.4,0,0.2,1)" : "none",
            }}
            onTransitionEnd={onTransitionEnd}
          >
            {slides.map((src, i) => (
              <Image
                key={i}
                src={src}
                alt="Featured free movies and shows on Tubi"
                width={1080}
                height={600}
                draggable={false}
                className="shrink-0"
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                /* Eager-load every slide: small webp banners that sit translated
                   off-screen inside overflow:hidden, so lazy would flash blank. */
                loading="eager"
                fetchPriority={i === 0 ? "high" : "low"}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Dots */}
      {count > 1 && (
        <div className="flex justify-center gap-2 mt-2.5">
          {images.map((src, i) => (
            <button
              key={src}
              aria-label={`Show slide ${i + 1}`}
              onClick={() => {
                setAnimate(true);
                setIdx(i);
              }}
              className="rounded-full transition-all"
              style={{
                width: i === activeDot ? 22 : 7,
                height: 7,
                background: i === activeDot ? "linear-gradient(135deg, #7401CB, #FFFF12)" : "rgba(255,255,255,0.28)",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
