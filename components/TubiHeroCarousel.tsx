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
 *
 * THE SLIDES ARE LINKS, AND THEY SAY SO. The banner art is Tubi's own title
 * cards, each with Tubi's yellow play button rendered INTO the image. Until
 * 2026-08-29 those play buttons were decoration: the carousel was six <Image>
 * elements with no anchor anywhere, so six large, obvious play affordances did
 * nothing at all, and the panel's only working control opened Tubi's home page.
 * Testers reported exactly that. Every slide is now a real outbound link, and
 * the corner chip states where it goes — the honest reading of art that is a
 * montage of what is free on Tubi rather than a per-title deep link. If a
 * verified per-title Tubi URL is ever available, pass `href` per slide instead
 * of relying on the default; do NOT hand-write one, a link to the wrong film is
 * worse than a link to the catalogue.
 */

/** The partner destination. Same URL the panel's own CTA uses. */
const TUBI_HOME = "https://tubitv.com/";

export default function TubiHeroCarousel({
  images,
  heightStyle,
  aspectRatio,
  href = TUBI_HOME,
}: {
  images: string[];
  heightStyle?: string;
  aspectRatio?: string;
  href?: string;
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
  /* Set when the gesture that just ended moved far enough to be a drag rather
     than a tap. Now that each slide is an anchor, a swipe would otherwise end
     in a click and navigate to Tubi every time the viewer tried to see the next
     banner. touchend fires before click, so this flag is always set in time. */
  const draggedRef = useRef(false);
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    e.stopPropagation();
    draggedRef.current = false;
    startX.current = e.touches[0].clientX;
  }, []);
  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    e.stopPropagation();
    if (startX.current === null) return;
    const dx = e.changedTouches[0].clientX - startX.current;
    // 10px, not the 40px swipe threshold: a 20px smear is still not a tap, and
    // treating it as one navigates away mid-scroll.
    draggedRef.current = Math.abs(dx) > 10;
    if (Math.abs(dx) > 40) {
      setAnimate(true);
      setIdx((i) => (dx < 0 ? i + 1 : Math.max(0, i - 1)));
    }
    startX.current = null;
  }, []);
  const onSlideClick = useCallback((e: React.MouseEvent) => {
    if (draggedRef.current) {
      e.preventDefault();
      draggedRef.current = false;
    }
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
          style={{ borderRadius: 16, overflow: "hidden", position: "relative", ...boxSizing }}
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
              <a
                key={i}
                href={href}
                target="_blank"
                rel="noopener noreferrer sponsored"
                onClick={onSlideClick}
                aria-label="Open Tubi to stream free movies and shows"
                className="shrink-0 block no-underline"
                style={{ width: "100%", height: "100%" }}
              >
                <Image
                  src={src}
                  alt="Featured free movies and shows on Tubi"
                  width={1080}
                  height={600}
                  draggable={false}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  /* Eager-load every slide: small webp banners that sit translated
                     off-screen inside overflow:hidden, so lazy would flash blank. */
                  loading="eager"
                  fetchPriority={i === 0 ? "high" : "low"}
                />
              </a>
            ))}
          </div>

          {/* Says where the artwork goes. The banners carry Tubi's own play
              buttons, so without this the viewer reasonably expects the tapped
              title to start playing here; it opens Tubi's catalogue instead.
              pointer-events: none so the chip never swallows a tap or a swipe. */}
          <span
            className="absolute rounded-full text-[9px] font-black uppercase tracking-wider"
            style={{
              top: 8,
              right: 8,
              padding: "3px 7px",
              background: "rgba(4,4,10,0.72)",
              color: "#FFFF12",
              border: "1px solid rgba(255,255,18,0.3)",
              pointerEvents: "none",
            }}
          >
            Opens Tubi ↗
          </span>
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
