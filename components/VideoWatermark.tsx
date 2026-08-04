"use client";

import { useEffect, useState, type RefObject } from "react";
import Image from "next/image";

/**
 * VERZA emblem watermark shown in the top-left corner of a video. Two modes:
 *
 *  - Uncontrolled (default): pass a `videoRef` and it fades in on play, out on
 *    pause/end by wiring to the <video> element's events.
 *  - Controlled: pass an explicit `visible` boolean to drive it yourself — used
 *    so the logo can fade IN exactly as the back arrow / chrome fades OUT after
 *    the 10s idle timer, occupying the same top-left spot as the arrow.
 *
 * Purely decorative and never intercepts taps (pointer-events: none).
 */
export default function VideoWatermark({
  videoRef,
  visible,
  top = 12,
  left = 12,
  size = 62,
  opacity = 0.88,
}: {
  videoRef?: RefObject<HTMLVideoElement | null>;
  visible?: boolean;
  top?: number;
  left?: number;
  size?: number;
  opacity?: number;
}) {
  const [playing, setPlaying] = useState(false);
  const controlled = visible !== undefined;

  useEffect(() => {
    if (controlled) return;
    const v = videoRef?.current;
    if (!v) return;
    const show = () => setPlaying(true);
    const hide = () => setPlaying(false);
    v.addEventListener("playing", show);
    v.addEventListener("play", show);
    v.addEventListener("pause", hide);
    v.addEventListener("ended", hide);
    if (!v.paused && !v.ended) setPlaying(true);
    return () => {
      v.removeEventListener("playing", show);
      v.removeEventListener("play", show);
      v.removeEventListener("pause", hide);
      v.removeEventListener("ended", hide);
    };
  }, [videoRef, controlled]);

  const shown = controlled ? visible : playing;

  return (
    <Image
      src="/watermark.png"
      alt=""
      aria-hidden="true"
      draggable={false}
      width={size}
      height={Math.round((size * 619) / 600)}
      className="absolute select-none pointer-events-none"
      style={{
        top,
        left,
        width: size,
        height: "auto",
        // Crafted entrance: settles in with a gentle scale + fade,
        // rather than a hard pop — presence you feel, not a jolt you notice.
        opacity: shown ? opacity : 0,
        transform: shown ? "scale(1)" : "scale(0.94)",
        transformOrigin: "top left",
        transition:
          "opacity 0.4s ease, transform 0.55s cubic-bezier(0.22, 1, 0.36, 1)",
        zIndex: 40,
        // One restrained shadow that lifts the mark off any footage —
        // a whisper of dark for bright scenes, a whisper of light for dark ones.
        filter:
          "drop-shadow(0 1px 3px rgba(0,0,0,0.5)) drop-shadow(0 0 4px rgba(255,255,255,0.12))",
      }}
    />
  );
}
