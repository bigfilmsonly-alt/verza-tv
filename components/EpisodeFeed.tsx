"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type HlsType from "hls.js";
import { trackEpisodeStart, trackEpisodeComplete, trackUnlockPrompt, trackUnlockClick } from "@/lib/track";

/* ---- Load hls.js once ---- */
let hlsPromise: Promise<typeof HlsType | null> | null = null;
function getHls(): Promise<typeof HlsType | null> {
  if (!hlsPromise && typeof window !== "undefined") {
    hlsPromise = import("hls.js").then((m) => m.default).catch(() => null);
  }
  return hlsPromise || Promise.resolve(null);
}

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface FeedEpisode {
  number: number;
  title: string;
  durationS: number;
  playbackId?: string;
  isFree: boolean;
}

interface EpisodeFeedProps {
  seriesSlug: string;
  seriesTitle: string;
  posterUrl: string;
  episodes: FeedEpisode[];
  startEpisode: number;
  freeEpisodes: number;
  totalEpisodes: number;
}

/* ================================================================== */
/*  Single Episode Slide                                               */
/* ================================================================== */

function EpisodeSlide({
  episode,
  seriesSlug,
  posterUrl,
  isActive,
  muted,
}: {
  episode: FeedEpisode;
  seriesSlug: string;
  posterUrl: string;
  isActive: boolean;
  muted: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<HlsType | null>(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);

  const hlsUrl = episode.playbackId
    ? `https://stream.mux.com/${episode.playbackId}.m3u8`
    : null;
  const thumbUrl = episode.playbackId
    ? `https://image.mux.com/${episode.playbackId}/thumbnail.jpg?time=2&width=720&height=1280`
    : "";

  /* Attach HLS + autoplay when active */
  useEffect(() => {
    if (!isActive || !hlsUrl) return;

    const vid = videoRef.current;
    if (!vid) return;

    let cancelled = false;
    setLoading(true);

    function tryPlay() {
      if (cancelled || !vid) return;
      const wasMuted = localStorage.getItem("verza-muted") !== "false";
      vid.muted = wasMuted;
      vid.play()
        .then(() => {
          if (!cancelled) { setPlaying(true); setLoading(false); }
          trackEpisodeStart(seriesSlug, episode.number);
        })
        .catch(() => {
          if (cancelled) return;
          vid.muted = true;
          vid.play()
            .then(() => { if (!cancelled) { setPlaying(true); setLoading(false); } })
            .catch(() => { if (!cancelled) setLoading(false); });
        });
    }

    async function attach() {
      if (cancelled || !vid || !hlsUrl) return;

      if (vid.canPlayType("application/vnd.apple.mpegurl")) {
        vid.src = hlsUrl;
        vid.addEventListener("loadedmetadata", () => tryPlay(), { once: true });
        return;
      }

      const Hls = await getHls();
      if (cancelled || !Hls || !Hls.isSupported() || !vid) return;

      const hls = new Hls({ maxBufferLength: 60, enableWorker: true });
      hlsRef.current = hls;
      hls.loadSource(hlsUrl);
      hls.attachMedia(vid);
      hls.on(Hls.Events.MANIFEST_PARSED, () => { if (!cancelled) tryPlay(); });
      hls.on(Hls.Events.ERROR, (_e: string, data: { type: string; fatal: boolean }) => {
        if (data.fatal && Hls) {
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) hls.startLoad();
          else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) hls.recoverMediaError();
        }
      });
    }

    attach();

    return () => {
      cancelled = true;
      if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
      if (vid) { vid.pause(); vid.removeAttribute("src"); vid.load(); }
      setPlaying(false);
      setLoading(false);
    };
  }, [isActive, hlsUrl, episode.number, seriesSlug]);

  /* Sync muted state */
  useEffect(() => {
    const vid = videoRef.current;
    if (vid) vid.muted = muted;
  }, [muted]);

  /* Tap to pause/resume */
  function handleTap() {
    const vid = videoRef.current;
    if (!vid || !isActive) return;
    if (vid.paused) {
      vid.play().catch(() => {});
    } else {
      vid.pause();
    }
    setPlaying(!vid.paused);
  }

  return (
    <div
      className="relative w-full select-none"
      style={{ height: "100dvh", background: "#000" }}
      onClick={handleTap}
    >
      {/* Mux thumbnail (shows until video plays) */}
      {thumbUrl && (
        <img
          src={thumbUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            opacity: playing ? 0 : 1,
            transition: "opacity 0.3s ease",
            zIndex: 1,
          }}
        />
      )}

      {/* Poster fallback */}
      {!thumbUrl && posterUrl && (
        <img
          src={posterUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: "brightness(0.5)", zIndex: 1 }}
        />
      )}

      {/* Video */}
      <video
        ref={videoRef}
        playsInline
        preload={isActive ? "auto" : "none"}
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          opacity: playing ? 1 : 0,
          transition: "opacity 0.3s ease",
          zIndex: 2,
        }}
      />

      {/* Loading spinner */}
      {isActive && loading && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <div
            className="w-10 h-10 rounded-full border-2 border-transparent animate-spin"
            style={{ borderTopColor: "#fff", borderRightColor: "#fff" }}
          />
        </div>
      )}

      {/* Pause icon (brief flash) */}
      {isActive && !playing && !loading && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(8px)" }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="#fff">
              <polygon points="8 5 20 12 8 19" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}

/* ================================================================== */
/*  EpisodeFeed — vertical snap-scroll                                 */
/* ================================================================== */

export default function EpisodeFeed({
  seriesSlug,
  seriesTitle,
  posterUrl,
  episodes,
  startEpisode,
  freeEpisodes,
  totalEpisodes,
}: EpisodeFeedProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(() => {
    const idx = episodes.findIndex((e) => e.number === startEpisode);
    return idx >= 0 ? idx : 0;
  });
  const [muted, setMuted] = useState(() => {
    if (typeof window !== "undefined") return localStorage.getItem("verza-muted") !== "false";
    return true;
  });
  const [showUnlock, setShowUnlock] = useState(false);
  const [unlockLoading, setUnlockLoading] = useState(false);

  const activeEp = episodes[activeIndex];

  /* Scroll to start episode on mount */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const startIdx = episodes.findIndex((e) => e.number === startEpisode);
    if (startIdx > 0) {
      const target = container.children[startIdx] as HTMLElement;
      if (target) target.scrollIntoView({ behavior: "instant" as ScrollBehavior });
    }
  }, []);

  /* IntersectionObserver for snap detection */
  const observerCallback = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const idx = Number(entry.target.getAttribute("data-index"));
          if (!Number.isNaN(idx)) {
            setActiveIndex(idx);
            const ep = episodes[idx];
            // Update URL without navigation
            window.history.replaceState(null, "", `/series/${seriesSlug}/${ep.number}`);

            // Show unlock popup if this is the first paid episode
            if (!ep.isFree) {
              trackUnlockPrompt(seriesSlug);
              setShowUnlock(true);
            } else {
              setShowUnlock(false);
            }
          }
        }
      }
    },
    [episodes, seriesSlug],
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container || episodes.length === 0) return;
    const observer = new IntersectionObserver(observerCallback, {
      root: container,
      threshold: 0.6,
    });
    container.querySelectorAll("[data-index]").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [episodes, observerCallback]);

  function toggleMute() {
    const next = !muted;
    setMuted(next);
    localStorage.setItem("verza-muted", String(next));
  }

  /* Thin progress bar color */
  const progressPct = activeEp
    ? ((activeIndex + 1) / Math.min(episodes.length, totalEpisodes)) * 100
    : 0;

  return (
    <div className="episode-immersive" style={{ background: "#000" }}>
      {/* Vertical snap-scroll container */}
      <div
        ref={containerRef}
        className="no-scrollbar"
        style={{
          width: "100%",
          height: "100dvh",
          overflowY: "auto",
          overflowX: "hidden",
          scrollSnapType: "y mandatory",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {episodes.map((ep, i) => (
          <div
            key={ep.number}
            data-index={i}
            style={{
              width: "100%",
              height: "100dvh",
              scrollSnapAlign: "start",
              scrollSnapStop: "always",
            }}
          >
            <EpisodeSlide
              episode={ep}
              seriesSlug={seriesSlug}
              posterUrl={posterUrl}
              isActive={i === activeIndex}
              muted={muted}
            />
          </div>
        ))}
      </div>

      {/* ---- Minimal overlays ---- */}

      {/* Back button — top-left */}
      <button
        onClick={() => router.push(`/series/${seriesSlug}`)}
        className="absolute top-4 left-4 z-50 w-10 h-10 rounded-full flex items-center justify-center border-0 cursor-pointer"
        style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(12px)" }}
        aria-label="Back"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      {/* Mute button — top-right */}
      <button
        onClick={toggleMute}
        className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full flex items-center justify-center border-0 cursor-pointer"
        style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(12px)" }}
        aria-label={muted ? "Unmute" : "Mute"}
      >
        {muted ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          </svg>
        )}
      </button>

      {/* Episode badge — bottom-left, minimal */}
      <div
        className="absolute bottom-6 left-4 z-50 pointer-events-none"
        style={{ opacity: 0.9 }}
      >
        <p className="text-[11px] font-medium mb-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>
          {seriesTitle}
        </p>
        <p className="text-sm font-bold" style={{ color: "#fff" }}>
          EP {activeEp?.number}
        </p>
      </div>

      {/* Thin progress rail — very bottom */}
      <div
        className="absolute bottom-0 left-0 right-0 z-50 pointer-events-none"
        style={{ height: 3 }}
      >
        <div
          style={{
            height: "100%",
            width: `${progressPct}%`,
            background: "linear-gradient(90deg, #E0115F, #8B5CF6)",
            transition: "width 0.4s ease",
            borderRadius: "0 2px 2px 0",
          }}
        />
      </div>

      {/* ---- Unlock overlay (when scrolling to paid episode) ---- */}
      {showUnlock && (
        <div
          className="absolute inset-0 z-[60] flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
        >
          <div className="text-center px-8 max-w-xs">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
              style={{ background: "rgba(224,17,95,0.15)" }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#E0115F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2" style={{ color: "#fff" }}>
              Keep Watching
            </h3>
            <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.5)" }}>
              Unlock all episodes of {seriesTitle}
            </p>
            <button
              onClick={async () => {
                setUnlockLoading(true);
                trackUnlockClick(seriesSlug);
                try {
                  const res = await fetch("/api/unlock", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ seriesSlug }),
                  });
                  const data = await res.json();
                  if (data.url) window.location.href = data.url;
                } catch {
                  setUnlockLoading(false);
                }
              }}
              disabled={unlockLoading}
              className="w-full py-4 rounded-2xl text-base font-bold border-0 cursor-pointer transition-transform active:scale-[0.97]"
              style={{
                background: "linear-gradient(135deg, #E0115F, #8B5CF6)",
                color: "#fff",
                opacity: unlockLoading ? 0.7 : 1,
                boxShadow: "0 0 30px rgba(224,17,95,0.3)",
              }}
            >
              {unlockLoading ? "Loading..." : "Unlock Full Series — $4.99"}
            </button>
            <button
              onClick={() => {
                setShowUnlock(false);
                // Scroll back to last free episode
                const container = containerRef.current;
                if (container) {
                  const lastFreeIdx = episodes.findIndex((e) => !e.isFree) - 1;
                  if (lastFreeIdx >= 0) {
                    const target = container.children[lastFreeIdx] as HTMLElement;
                    if (target) target.scrollIntoView({ behavior: "smooth" });
                  }
                }
              }}
              className="mt-4 text-sm font-medium border-0 bg-transparent cursor-pointer"
              style={{ color: "rgba(255,255,255,0.4)" }}
            >
              Go Back
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
