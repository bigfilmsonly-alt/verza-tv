"use client";

import { useEffect, useState, type RefObject } from "react";

/**
 * Subtle VERZA emblem watermark shown in the top-left corner of a video while it
 * is actually playing. Wires directly to the given <video> element's play/pause
 * events so it fades in on play and out on pause/end. Purely decorative and never
 * intercepts taps (pointer-events: none).
 */
export default function VideoWatermark({
  videoRef,
  top = 12,
  left = 12,
  size = 62,
  opacity = 0.88,
}: {
  videoRef: RefObject<HTMLVideoElement | null>;
  top?: number;
  left?: number;
  size?: number;
  opacity?: number;
}) {
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const v = videoRef.current;
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
  }, [videoRef]);

  return (
    <img
      src="/watermark.png"
      alt=""
      aria-hidden="true"
      draggable={false}
      className="absolute select-none pointer-events-none"
      style={{
        top,
        left,
        width: size,
        height: "auto",
        // Crafted entrance: settles in with a gentle scale + fade on play,
        // rather than a hard pop — presence you feel, not a jolt you notice.
        opacity: playing ? opacity : 0,
        transform: playing ? "scale(1)" : "scale(0.94)",
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
