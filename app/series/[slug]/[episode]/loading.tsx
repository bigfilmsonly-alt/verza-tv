"use client";

import { useState } from "react";

/**
 * Route-transition screen between the browse page and the episode feed.
 *
 * Instead of a black frame (which reads as a "black flash"), show the exact
 * poster image the user just tapped — BrowsePage stores its cached URL in
 * sessionStorage on click, so this paints instantly from the browser's
 * memory cache. EpisodeFeed then keeps the same poster visible until the
 * first real video frame is composited → one continuous poster → video
 * transition with zero flashes.
 */
export default function EpisodeLoading() {
  const [posterSrc] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = sessionStorage.getItem("verza-transition");
      if (!raw) return null;
      const d = JSON.parse(raw) as { src?: string; ts?: number };
      if (d.src && d.ts && Date.now() - d.ts < 15000) return d.src;
    } catch {}
    return null;
  });

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#000",
        zIndex: 50,
      }}
    >
      {posterSrc && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={posterSrc}
          alt=""
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      )}
    </div>
  );
}
