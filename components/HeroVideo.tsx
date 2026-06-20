"use client";

import { useRef, useState, useEffect } from "react";
import type HlsType from "hls.js";

let hlsPromise: Promise<typeof HlsType | null> | null = null;
function getHls(): Promise<typeof HlsType | null> {
  if (!hlsPromise && typeof window !== "undefined") {
    hlsPromise = import("hls.js").then((m) => m.default).catch(() => null);
  }
  return hlsPromise || Promise.resolve(null);
}

interface HeroVideoProps {
  playbackId: string;
}

export default function HeroVideo({ playbackId }: HeroVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<HlsType | null>(null);
  const [playing, setPlaying] = useState(false);

  /* Respect prefers-reduced-motion */
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (reducedMotion) return;

    const vid = videoRef.current;
    if (!vid) return;

    let destroyed = false;
    const hlsUrl = `https://stream.mux.com/${playbackId}.m3u8`;

    function tryPlay() {
      if (destroyed || !vid) return;
      vid.muted = true;
      vid.play().catch(() => {});
    }

    function onPlaying() { if (!destroyed) setPlaying(true); }
    vid.addEventListener("playing", onPlaying);

    async function attach() {
      if (destroyed || !vid) return;

      if (vid.canPlayType("application/vnd.apple.mpegurl")) {
        vid.src = hlsUrl;
        tryPlay();
        return;
      }

      const Hls = await getHls();
      if (destroyed || !Hls || !Hls.isSupported() || !vid) return;

      const hls = new Hls({ maxBufferLength: 15, enableWorker: true });
      hlsRef.current = hls;
      hls.loadSource(hlsUrl);
      hls.attachMedia(vid);
      hls.on(Hls.Events.MANIFEST_PARSED, () => { if (!destroyed) tryPlay(); });
    }

    attach();

    return () => {
      destroyed = true;
      vid.removeEventListener("playing", onPlaying);
      if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
      vid.pause();
      vid.removeAttribute("src");
      vid.load();
      setPlaying(false);
    };
  }, [playbackId, reducedMotion]);

  if (reducedMotion) return null;

  return (
    <video
      ref={videoRef}
      playsInline
      muted
      loop
      preload="metadata"
      className="absolute inset-0 w-full h-full object-cover"
      style={{
        opacity: playing ? 1 : 0,
        zIndex: playing ? 5 : 0,
        transition: "opacity 0.8s ease",
      }}
    />
  );
}
