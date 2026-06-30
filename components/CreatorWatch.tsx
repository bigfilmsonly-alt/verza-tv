"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type HlsType from "hls.js";
import { emit } from "@/lib/analytics";

let HlsModule: typeof HlsType | null = null;
if (typeof window !== "undefined") {
  import("hls.js").then((m) => {
    HlsModule = m.default;
  }).catch(() => {});
}

interface Props {
  slug: string;
  title: string;
  description: string;
  handle: string;
  displayName: string;
  playbackId: string;
  aspect: string;
  priceCents: number;
  isFree: boolean;
  hasAccess: boolean;
}

export default function CreatorWatch({
  slug,
  title,
  description,
  handle,
  displayName,
  playbackId,
  aspect,
  priceCents,
  isFree,
  hasAccess,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<HlsType | null>(null);
  const mutedRef = useRef(true);
  const [muted, setMuted] = useState(true);
  const [started, setStarted] = useState(false);
  const [buying, setBuying] = useState(false);

  const locked = !isFree && !hasAccess;
  const hlsUrl = `https://stream.mux.com/${playbackId}.m3u8`;

  // Attach the stream once the user starts (mux public playback).
  const attach = useCallback(() => {
    const vid = videoRef.current;
    if (!vid || locked) return;

    if (vid.canPlayType("application/vnd.apple.mpegurl")) {
      vid.src = hlsUrl; // Safari / iOS native HLS
      vid.load();
    } else if (HlsModule && HlsModule.isSupported()) {
      const hls = new HlsModule();
      hlsRef.current = hls;
      hls.loadSource(hlsUrl);
      hls.attachMedia(vid);
    } else {
      vid.src = hlsUrl;
      vid.load();
    }
  }, [hlsUrl, locked]);

  useEffect(() => {
    return () => {
      hlsRef.current?.destroy();
    };
  }, []);

  async function play() {
    const vid = videoRef.current;
    if (!vid) return;
    if (!started) {
      attach();
      setStarted(true);
      emit("play_started", { show_id: slug });
    }
    // Muted-first autoplay, then unmute after it's going (iOS rule).
    vid.muted = true;
    mutedRef.current = true;
    try {
      await vid.play();
      vid.muted = false;
      mutedRef.current = false;
      setMuted(false);
    } catch {
      /* user gesture needed; controls remain */
    }
  }

  async function buy() {
    setBuying(true);
    emit("checkout_started", { show_id: slug, surface: "creator_watch" });
    try {
      const res = await fetch("/api/creator-unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      const body = await res.json().catch(() => ({}));
      if (body.url) window.location.href = body.url;
      else setBuying(false);
    } catch {
      setBuying(false);
    }
  }

  const vertical = aspect !== "16:9";

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#07070E" }}>
      <div className="px-4 pt-4">
        <Link href="/" className="text-sm no-underline" style={{ color: "rgba(255,255,255,0.5)" }}>
          ← Verza TV
        </Link>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-6">
        <div
          className="relative w-full rounded-2xl overflow-hidden"
          style={{
            maxWidth: vertical ? 360 : 720,
            aspectRatio: vertical ? "9 / 16" : "16 / 9",
            background: "#000",
          }}
        >
          {!locked ? (
            <>
              <video
                ref={videoRef}
                className="w-full h-full object-contain"
                playsInline
                controls={started}
                poster={`https://image.mux.com/${playbackId}/thumbnail.jpg?width=720`}
              />
              {!started && (
                <button
                  onClick={play}
                  className="absolute inset-0 flex items-center justify-center border-0 cursor-pointer"
                  style={{ background: "rgba(0,0,0,0.35)" }}
                  aria-label="Play"
                >
                  <span
                    className="flex items-center justify-center rounded-full"
                    style={{ width: 64, height: 64, background: "rgba(224,17,95,0.9)" }}
                  >
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="#fff">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </span>
                </button>
              )}
              {started && muted && (
                <button
                  onClick={() => {
                    const v = videoRef.current;
                    if (v) {
                      v.muted = false;
                      mutedRef.current = false;
                      setMuted(false);
                    }
                  }}
                  className="absolute bottom-3 right-3 px-3 py-1.5 rounded-full text-xs font-semibold border-0 cursor-pointer"
                  style={{ background: "rgba(0,0,0,0.6)", color: "#fff" }}
                >
                  Tap for sound
                </button>
              )}
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
              <img
                src={`https://image.mux.com/${playbackId}/thumbnail.jpg?width=720`}
                alt=""
                className="absolute inset-0 w-full h-full object-cover opacity-30"
              />
              <div className="relative">
                <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "#E0115F" }}>
                  Pay-per-view
                </p>
                <p className="text-sm mb-4" style={{ color: "rgba(255,255,255,0.7)" }}>
                  Unlock {title} for ${(priceCents / 100).toFixed(2)}
                </p>
                <button
                  onClick={buy}
                  disabled={buying}
                  className="px-6 py-3 rounded-xl text-sm font-bold border-0 cursor-pointer"
                  style={{
                    background: "linear-gradient(135deg, #E0115F, #8B5CF6)",
                    color: "#fff",
                    opacity: buying ? 0.7 : 1,
                  }}
                >
                  {buying ? "Loading…" : `Unlock — $${(priceCents / 100).toFixed(2)}`}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="w-full mt-5" style={{ maxWidth: vertical ? 360 : 720 }}>
          <h1 className="text-lg font-bold" style={{ color: "#F5F4F8" }}>
            {title}
          </h1>
          <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
            by {displayName || `@${handle}`}
          </p>
          {description && (
            <p className="text-sm mt-3 leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
