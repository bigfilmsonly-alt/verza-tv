"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import type HlsType from "hls.js";

let hlsPromise: Promise<typeof HlsType | null> | null = null;
function getHls(): Promise<typeof HlsType | null> {
  if (!hlsPromise && typeof window !== "undefined") {
    hlsPromise = import("hls.js").then((m) => m.default).catch(() => null);
  }
  return hlsPromise || Promise.resolve(null);
}

interface RedCarpetHeroProps {
  /** Intentionally-public catalog-free preview IDs only. */
  playbackIds: string[]; // episodes 1-5 playbackIds
}

export default function RedCarpetHero({ playbackIds }: RedCarpetHeroProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<HlsType | null>(null);
  const [currentEp, setCurrentEp] = useState(0);
  const [playing, setPlaying] = useState(false);
  const currentEpRef = useRef(0);

  const playbackId = playbackIds[currentEp];

  // Auto-advance to next episode when current ends
  const handleEnded = useCallback(() => {
    const next = (currentEpRef.current + 1) % playbackIds.length;
    currentEpRef.current = next;
    setCurrentEp(next);
  }, [playbackIds.length]);

  // Single video element — swap source on episode change
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid || !playbackId) return;

    let cancelled = false;
    const hlsUrl = `https://stream.mux.com/${playbackId}.m3u8`;

    // Destroy previous HLS
    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }

    vid.pause();
    vid.removeAttribute("src");
    queueMicrotask(() => {
      if (!cancelled) setPlaying(false);
    });

    function doPlay() {
      if (cancelled || !vid) return;
      vid.muted = true;
      vid.play().then(() => {
        if (!cancelled) setPlaying(true);
      }).catch(() => {});
    }

    // Prefer hls.js (MSE) whenever supported; native HLS only where hls.js
    // can't run (iOS Safari). Some Chrome versions answer "maybe" to
    // canPlayType(HLS) but then stall forever without playing.
    getHls().then((Hls) => {
      if (cancelled || !vid) return;
      if (!Hls || !Hls.isSupported()) {
        if (vid.canPlayType("application/vnd.apple.mpegurl")) {
          vid.src = hlsUrl;
          vid.load();
          vid.addEventListener("canplay", () => { if (!cancelled) doPlay(); }, { once: true });
        }
        return;
      }
      const hls = new Hls({ maxBufferLength: 15, enableWorker: true });
      hlsRef.current = hls;
      hls.loadSource(hlsUrl);
      hls.attachMedia(vid);
      hls.on(Hls.Events.MANIFEST_PARSED, () => { if (!cancelled) doPlay(); });
      hls.on(Hls.Events.ERROR, (_e: string, data: { type: string; fatal: boolean }) => {
        if (data.fatal && Hls) {
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) hls.startLoad();
          else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) hls.recoverMediaError();
        }
      });
    });

    return () => { cancelled = true; };
  }, [playbackId]);

  // Listen for ended event
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.addEventListener("ended", handleEnded);
    return () => vid.removeEventListener("ended", handleEnded);
  }, [handleEnded]);

  // Cleanup on unmount
  useEffect(() => {
    const vid = videoRef.current;
    return () => {
      if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
      if (vid) { vid.pause(); vid.removeAttribute("src"); vid.load(); }
    };
  }, []);

  if (!playbackId) return null;

  return (
    <div className="absolute inset-0">
      <video
        ref={videoRef}
        playsInline
        muted
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          opacity: playing ? 1 : 0,
          zIndex: playing ? 5 : 0,
          transition: "opacity 0.8s ease",
        }}
      />
      {/* Episode indicator */}
      <div
        className="absolute bottom-3 right-3 px-2 py-1 rounded-full pointer-events-none"
        style={{ zIndex: 6, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }}
      >
        <span className="text-[10px] font-semibold" style={{ color: "rgba(255,255,255,0.7)" }}>
          EP {currentEp + 1} / {playbackIds.length}
        </span>
      </div>
    </div>
  );
}
