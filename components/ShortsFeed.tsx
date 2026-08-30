"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import type HlsType from "hls.js";
import type { Series } from "@/lib/catalog";

import { T } from "@/lib/theme";
import { getPlayback } from "@/lib/mux-public-map";
import { createTtffTracker } from "@/lib/perf/ttff";
import { readSavedSlugs, writeSavedSlugs, setSavedSlug } from "@/lib/guest-storage";
import VideoWatermark from "@/components/VideoWatermark";
import { useTranslation } from "@/components/LangProvider";

/* ---- Load hls.js once ---- */
let hlsPromise: Promise<typeof HlsType | null> | null = null;
function getHls(): Promise<typeof HlsType | null> {
  if (!hlsPromise && typeof window !== "undefined") {
    hlsPromise = import("hls.js").then((m) => m.default).catch(() => null);
  }
  return hlsPromise || Promise.resolve(null);
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function RailButton({ children, label, onClick }: {
  children: React.ReactNode; label: string; onClick?: () => void;
}) {
  return (
    <button
      className="flex flex-col items-center gap-1"
      onClick={onClick}
      aria-label={label}
      style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
    >
      <div
        className="w-11 h-11 rounded-full flex items-center justify-center"
        style={{ background: "rgba(50,50,50,0.7)", backdropFilter: "blur(4px)" }}
      >
        {children}
      </div>
      <span className="text-[10px] font-semibold" style={{ color: "#fff", textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}>
        {label}
      </span>
    </button>
  );
}

/* ================================================================== */
/*  ShortCard — one slide (lightweight, NO video element)              */
/* ================================================================== */
function ShortCard({ series, visible, muted, setMuted, saved, onToggleSave }: {
  series: Series; visible: boolean;
  muted: boolean; setMuted: (m: boolean) => void;
  saved: boolean; onToggleSave: (slug: string) => void;
}) {
  const [liked, setLiked] = useState(false);
  const [showCopied, setShowCopied] = useState(false);
  /* These six labels have existed in all 20 locale dictionaries since the
     dictionaries were written, and not one of them was ever rendered — the
     rail read English regardless of the language the viewer had chosen. */
  const { t } = useTranslation();
  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/series/${series.slug}`
    : `/series/${series.slug}`;

  function handleShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({ title: series.title, text: `Watch "${series.title}" on VERZA TV`, url: shareUrl }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareUrl).then(() => { setShowCopied(true); setTimeout(() => setShowCopied(false), 2000); }).catch(() => {});
    }
  }

  return (
    <div
      className="relative overflow-hidden"
      style={{ width: "100%", height: "100%", pointerEvents: "none", opacity: visible ? 1 : 0, transition: "opacity 0.4s ease" }}
    >
      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, transparent 15%, transparent 70%, rgba(0,0,0,0.3) 100%)" }}
      />

      {/* Top-left: title + episode chip (indented to clear the watermark) */}
      <div className="absolute top-4 left-4 z-10" style={{ maxWidth: "65%", paddingLeft: 40 }}>
        <h2 className="text-base font-bold leading-tight mb-1.5" style={{ color: "#fff", textShadow: "0 1px 6px rgba(0,0,0,0.8)" }}>
          {series.title}
        </h2>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full" style={{ background: "rgba(50,50,50,0.7)", backdropFilter: "blur(4px)" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" />
          </svg>
          <span className="text-xs font-semibold" style={{ color: "#fff" }}>S1 EP.1</span>
        </div>
      </div>

      {/* Top-right: close */}
      <Link href="/" className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full flex items-center justify-center no-underline" style={{ background: "rgba(50,50,50,0.7)", backdropFilter: "blur(4px)", pointerEvents: visible ? "auto" : "none" }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </Link>

      {/* Right rail */}
      <div className="absolute right-3 flex flex-col items-center gap-4 z-10" style={{ top: "28%", pointerEvents: visible ? "auto" : "none" }}>
        <Link href={`/series/${series.slug}`} className="block no-underline">
          <div className="relative w-12 h-16 rounded-lg overflow-hidden" style={{ border: "2px solid rgba(255,255,255,0.4)" }}>
            {series.posterUrl && <Image src={series.posterUrl} alt={series.title} fill className="object-cover" sizes="48px" />}
          </div>
        </Link>

        <RailButton label={t(liked ? "shorts.liked" : "shorts.like")} onClick={() => setLiked((l) => !l)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill={liked ? T.accent : "none"} stroke={liked ? T.accent : "#fff"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </RailButton>

        <RailButton label={t(saved ? "shorts.saved" : "shorts.list")} onClick={() => onToggleSave(series.slug)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill={saved ? T.accent : "none"} stroke={saved ? T.accent : "#fff"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
          </svg>
        </RailButton>

        <RailButton label={t(showCopied ? "shorts.copied" : "shorts.share")} onClick={handleShare}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={showCopied ? T.accent : "#fff"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
        </RailButton>

        <RailButton label={t(muted ? "shorts.soundOff" : "shorts.soundOn")} onClick={() => { const next = !muted; setMuted(next); localStorage.setItem("verza-muted", String(next)); }}>
          {muted ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" />
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            </svg>
          )}
        </RailButton>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  ShortsFeed — SINGLE persistent video element, source swapping      */
/* ================================================================== */
export default function ShortsFeed({ series }: { series: Series[] }) {
  const [shuffled, setShuffled] = useState<Series[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  /* Start muted, and honour the viewer's saved preference, exactly as
     EpisodeFeed and Player do. This rail alone defaulted to sound ON and
     ignored the shared "verza-muted" key that it nonetheless WRITES on every
     toggle, so a viewer who muted the app elsewhere still got audio here.
     Reading in an initialiser rather than an effect avoids a frame of sound
     before the correction lands. localStorage can throw outright when site data
     is blocked, so the read is guarded. */
  const [muted, setMuted] = useState(() => {
    /* Sound ON by default, matching the episode feed. Only an explicit stored
       "true" mutes, so a viewer who pressed the speaker stays muted. The old
       test (!== "false") defaulted to SILENCE for anyone with no stored
       preference, which is every first-time viewer.

       Both fallbacks return false for the same reason: a server render and a
       browser with site data blocked are both "no stored preference", and that
       is a viewer who should hear the show, not a viewer who asked for silence. */
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem("verza-muted") === "true";
    } catch {
      return false;
    }
  });
  const [savedSlugs, setSavedSlugs] = useState<Set<string>>(new Set());
  const [showSplash, setShowSplash] = useState(true);
  // All overlay chrome (title / close / right rail / dots) shows for 10s on each
  // new short, then fades to a clean frame — only the VERZA watermark stays.
  // Any tap/swipe brings the chrome back for 10s more.
  const [chromeVisible, setChromeVisible] = useState(true);
  const chromeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const revealChrome = useCallback(() => {
    setChromeVisible(true);
    if (chromeTimer.current) clearTimeout(chromeTimer.current);
    chromeTimer.current = setTimeout(() => setChromeVisible(false), 10000);
  }, []);

  // THE single video element — never destroyed, source swapped
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<HlsType | null>(null);
  const currentPlaybackIdRef = useRef<string | null>(null);
  const mutedRef = useRef(muted);
  useEffect(() => { mutedRef.current = muted; }, [muted]);

  // Manifests/posters we've already warmed (so we can flag preload hits).
  const warmedRef = useRef<Set<string>>(new Set());

  /* Fetch saved list.
     Reads and writes go through lib/guest-storage so this feed, EpisodeFeed,
     the account counters and both list pages agree on one key with one shape.
     Four hand-rolled copies of the same JSON.parse is how a bookmark set here
     could disagree with the list that was supposed to display it. */
  useEffect(() => {
    let cancelled = false;
    const local = new Set(readSavedSlugs());
    queueMicrotask(() => { if (!cancelled) setSavedSlugs(local); });
    fetch("/api/saved-list")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { items?: { seriesSlug: string }[] } | null) => {
        if (cancelled || !data?.items || data.items.length === 0) return;
        const slugs = data.items.map((i) => i.seriesSlug);
        setSavedSlugs(new Set(slugs));
        writeSavedSlugs(slugs);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const handleToggleSave = useCallback((slug: string) => {
    /* The intent is derived ONCE, from the device, before anything moves. It
       used to be read from `prev` inside the state updater for the UI and from
       the captured `savedSlugs` for the HTTP method — two sources that agreed
       only by luck, and disagreed under a rapid double tap. */
    const shouldSave = !readSavedSlugs().includes(slug);
    setSavedSlug(slug, shouldSave);
    setSavedSlugs((prev) => {
      const updated = new Set(prev);
      if (shouldSave) updated.add(slug); else updated.delete(slug);
      return updated;
    });
    fetch("/api/saved-list", {
      method: shouldSave ? "POST" : "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ seriesSlug: slug }),
    }).catch(() => {});
  }, []);

  useEffect(() => {
    /* Shorts are a public discovery surface: episode 1 must be explicitly
       catalog-free and have a public preview ID. */
    const withMux = series.filter(
      (s) => s.freeEpisodes >= 1 && Boolean(getPlayback(s.slug, 1)?.playbackId),
    );
    const next = shuffleArray(withMux).slice(0, 15);
    queueMicrotask(() => setShuffled(next));
  }, [series]);

  /* ---- SINGLE PLAYER: swap source when activeIndex changes ---- */
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid || shuffled.length === 0) return;

    const activeSeries = shuffled[activeIndex];
    if (!activeSeries) return;
    const playbackId = activeSeries.freeEpisodes >= 1
      ? getPlayback(activeSeries.slug, 1)?.playbackId
      : undefined;
    if (!playbackId) return;

    // Skip if already playing this source
    if (currentPlaybackIdRef.current === playbackId) return;
    currentPlaybackIdRef.current = playbackId;

    const hlsUrl = `https://stream.mux.com/${playbackId}.m3u8`;
    let cancelled = false;

    // ---- TTFF measurement: mark intent now, commit on first 'playing' ----
    const tracker = createTtffTracker(playbackId, warmedRef.current.has(hlsUrl));
    tracker.markIntent();
    const onPlaying = () => tracker.commit(vid.videoHeight || null);
    const onWaiting = () => tracker.markRebuffer();
    vid.addEventListener("playing", onPlaying, { once: true });
    vid.addEventListener("waiting", onWaiting);

    // Destroy previous HLS instance (but keep the SAME video element)
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    // Pause and clear previous source
    vid.pause();
    vid.removeAttribute("src");

    function doPlay() {
      if (cancelled || !vid) return;
      vid.muted = true;
      const p = vid.play();
      if (p) {
        p.then(() => {
          if (!cancelled && !mutedRef.current) {
            vid.muted = false;
            // iOS pauses on programmatic unmute outside a gesture — fall back
            // to muted playback instead of freezing.
            if (vid.paused) {
              vid.muted = true;
              vid.play().catch(() => {});
            }
          }
        }).catch(() => {
          // Autoplay rejected (e.g. iOS Low Power Mode): retry on first tap.
          const retry = () => { vid.play().catch(() => {}); };
          document.addEventListener("pointerdown", retry, { once: true });
        });
      }
    }

    // ---- Warm the NEXT clip (cap: next 1) — manifest + poster ----------
    const next = shuffled[activeIndex + 1];
    const nextId = next && next.freeEpisodes >= 1
      ? getPlayback(next.slug, 1)?.playbackId
      : undefined;
    if (nextId) {
      const nextUrl = `https://stream.mux.com/${nextId}.m3u8`;
      if (!warmedRef.current.has(nextUrl)) {
        warmedRef.current.add(nextUrl);
        fetch(nextUrl, { mode: "cors" }).catch(() => {});
        const img = new window.Image();
        img.src = `https://image.mux.com/${nextId}/thumbnail.jpg?time=2&width=480`;
      }
    }

    const cleanup = () => {
      cancelled = true;
      vid.removeEventListener("playing", onPlaying);
      vid.removeEventListener("waiting", onWaiting);
    };

    // Prefer hls.js (MSE) whenever supported; native HLS only where hls.js
    // can't run. Some Chrome versions answer "maybe" to
    // canPlayType(HLS) but then stall forever without playing.
    // NOTE: that is NOT iOS. hls.js resolves ManagedMediaSource first and
    // iPhone Safari has shipped it since iOS 17.1, so Hls.isSupported() is
    // true there and iPhones take the MSE branch, worker and all.
    getHls().then((Hls) => {
      if (cancelled || !vid) return;
      if (!Hls || !Hls.isSupported()) {
        if (vid.canPlayType("application/vnd.apple.mpegurl")) {
          vid.src = hlsUrl;
          vid.addEventListener("canplay", () => { if (!cancelled) doPlay(); }, { once: true });
          vid.load();
        }
        return;
      }
      const hls = new Hls({
        maxBufferLength: 15,
        enableWorker: true,
        startLevel: 0,
        abrEwmaDefaultEstimate: 1_000_000,
        // This rail swaps one full-size player between sources, so the element
        // is already at its final size when the cap is computed. maxDevicePixelRatio
        // matters as much as the cap itself: hls.js multiplies the element width
        // by devicePixelRatio, so on a DPR-3 phone a 393px element reports
        // ~1179px and nothing is ever capped.
        capLevelToPlayerSize: true,
        maxDevicePixelRatio: 1,
      });
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

    return cleanup;
  }, [activeIndex, shuffled]);

  /* Destroy the live hls instance on unmount — the source-swap effect's
     cleanup only cancels listeners, so leaving the feed leaked a running
     player that kept buffering segments. */
  useEffect(() => {
    return () => {
      if (hlsRef.current) { try { hlsRef.current.destroy(); } catch {} hlsRef.current = null; }
    };
  }, []);

  /* Sync muted */
  useEffect(() => {
    const vid = videoRef.current;
    if (vid) vid.muted = muted;
  }, [muted]);

  /* IntersectionObserver — stable, created once */
  const observerCallback = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const idx = Number(entry.target.getAttribute("data-index"));
          if (!Number.isNaN(idx)) setActiveIndex(idx);
        }
      }
    },
    [],
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container || shuffled.length === 0) return;
    const observer = new IntersectionObserver(observerCallback, {
      root: container,
      threshold: 0.6,
    });
    container.querySelectorAll("[data-index]").forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, [shuffled, observerCallback]);

  // Auto-dismiss splash after 1.5s
  useEffect(() => {
    if (!showSplash) return;
    const t = setTimeout(() => setShowSplash(false), 1500);
    return () => clearTimeout(t);
  }, [showSplash]);

  // Reveal chrome for 10s on mount and whenever the active short changes.
  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) revealChrome();
    });
    return () => {
      cancelled = true;
      if (chromeTimer.current) clearTimeout(chromeTimer.current);
    };
  }, [activeIndex, revealChrome]);

  if (shuffled.length === 0) return null;

  return (
    <div className="episode-immersive" style={{ background: "#000" }} onPointerDownCapture={revealChrome}>
      {/* Splash screen — VERZA TV logo on black */}
      {/* Video starts immediately — no splash */}

      {/* THE single persistent video element */}
      {/* Poster-as-loading-state: the active clip's thumbnail sits behind the
          video so source swaps show a frame preview instead of black. */}
      {(() => {
        const active = shuffled[activeIndex];
        const activeId = active?.freeEpisodes && active.freeEpisodes >= 1
          ? getPlayback(active.slug, 1)?.playbackId
          : undefined;
        return activeId ? (
          <img
            key={activeId}
            src={`https://image.mux.com/${activeId}/thumbnail.jpg?time=2&width=480`}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            style={{ zIndex: 1 }}
          />
        ) : null;
      })()}
      <video
        ref={videoRef}
        playsInline
        muted
        loop
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover"
        style={{ zIndex: 2, background: "transparent", pointerEvents: "none" }}
      />

      {/* VERZA logo — fades in as the chrome fades out after the 10s idle timer */}
      <VideoWatermark visible={!chromeVisible} top={12} left={12} size={64} />

      {/* Swipe detection layer — transparent, receives horizontal swipe */}
      <div
        ref={containerRef}
        className="absolute inset-0 no-scrollbar"
        style={{
          display: "flex",
          overflowX: "auto",
          overflowY: "hidden",
          scrollSnapType: "x mandatory",
          scrollBehavior: "auto",
          zIndex: 5,
        }}
      >
        {shuffled.map((s, i) => (
          <div
            key={s.slug}
            data-index={i}
            style={{
              flex: "0 0 100%",
              width: "100%",
              height: "100%",
              scrollSnapAlign: "center",
            }}
          />
        ))}
      </div>

      {/* Interactive overlays — pointer-events:none on container, auto on buttons only */}
      {shuffled[activeIndex] && (
        <div
          className="absolute inset-0"
          style={{ zIndex: 10, pointerEvents: "none" }}
        >
          <ShortCard
            series={shuffled[activeIndex]}
            visible={chromeVisible}
            muted={muted}
            setMuted={setMuted}
            saved={savedSlugs.has(shuffled[activeIndex].slug)}
            onToggleSave={handleToggleSave}
          />
        </div>
      )}

      {/* Dot indicators */}
      <div
        className="absolute z-30 flex items-center gap-1.5"
        style={{ bottom: 16, left: "50%", transform: "translateX(-50%)", opacity: chromeVisible ? 1 : 0, transition: "opacity 0.4s ease" }}
      >
        {shuffled.slice(0, Math.min(shuffled.length, 15)).map((_, i) => (
          <div
            key={i}
            className="rounded-full transition-all duration-200"
            style={{
              width: i === activeIndex ? 16 : 6,
              height: 6,
              background: i === activeIndex
                ? "linear-gradient(90deg, #E0115F, #8B5CF6)"
                : "rgba(255,255,255,0.3)",
              borderRadius: 3,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes fadeOut { 0% { opacity: 1; } 100% { opacity: 0; } }
        @keyframes scaleIn { 0% { transform: scale(0.8); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
      `}</style>
    </div>
  );
}
