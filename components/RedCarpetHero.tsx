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
  playbackIds: string[]; // episodes 1-5 playbackIds
}

export default function RedCarpetHero({ playbackIds }: RedCarpetHeroProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<HlsType | null>(null);
  const [currentEp, setCurrentEp] = useState(0);
  const [playing, setPlaying] = useState(false);
  const currentEpRef = useRef(0);

  const playbackId = playbackIds[currentEp];
  if (!playbackId) return null;

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
    setPlaying(false);

    function doPlay() {
      if (cancelled || !vid) return;
      vid.muted = true;
      vid.play().then(() => {
        if (!cancelled) setPlaying(true);
      }).catch(() => {});
    }

    // Safari
    if (vid.canPlayType("application/vnd.apple.mpegurl")) {
      vid.src = hlsUrl;
      vid.load();
      vid.addEventListener("canplay", () => { if (!cancelled) doPlay(); }, { once: true });
      return () => { cancelled = true; };
    }

    // hls.js
    getHls().then((Hls) => {
      if (cancelled || !Hls || !Hls.isSupported() || !vid) return;
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
    return () => {
      if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
      const vid = videoRef.current;
      if (vid) { vid.pause(); vid.removeAttribute("src"); vid.load(); }
    };
  }, []);

  return (
    <div className="absolute inset-0">
      {/* Logo on black before video loads */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{ zIndex: 1, opacity: playing ? 0 : 1, transition: "opacity 0.5s ease" }}
      >
        <img src="/logo.png" alt="" width={100} height={31} style={{ opacity: 0.5 }} />
      </div>
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
