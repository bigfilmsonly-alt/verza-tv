"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import type HlsType from "hls.js";
import { SEED_CLIPS, getSeedHlsUrl, getSeedPoster, type SeedClip } from "@/lib/perf/seed";
import { createTtffTracker, getMetrics, clearMetrics, type PerfMetric } from "@/lib/perf/ttff";

/* Load hls.js once. */
let hlsPromise: Promise<typeof HlsType | null> | null = null;
function getHls(): Promise<typeof HlsType | null> {
  if (!hlsPromise && typeof window !== "undefined") {
    hlsPromise = import("hls.js").then((m) => m.default).catch(() => null);
  }
  return hlsPromise || Promise.resolve(null);
}

/* Dev-only player perf harness: a single video element source-swapped
   through the public seed clips, mirroring the production series flow.
   Warms the next clip's manifest and overlays live TTFF / preload /
   rebuffer / rendition metrics. */
export default function PerfHarness() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<HlsType | null>(null);
  const warmedRef = useRef<Set<string>>(new Set());
  const [index, setIndex] = useState(0);
  const [rendition, setRendition] = useState<number | null>(null);
  const [metrics, setMetrics] = useState<PerfMetric[]>([]);

  const refresh = useCallback(() => setMetrics([...getMetrics()].reverse()), []);

  const next = useCallback(() => setIndex((i) => (i + 1) % SEED_CLIPS.length), []);
  const prev = useCallback(() => setIndex((i) => (i - 1 + SEED_CLIPS.length) % SEED_CLIPS.length), []);

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    const clip = SEED_CLIPS[index];
    const hlsUrl = getSeedHlsUrl(clip);
    let cancelled = false;

    const tracker = createTtffTracker(clip.id, warmedRef.current.has(hlsUrl));
    tracker.markIntent();
    const onPlaying = () => { tracker.commit(vid.videoHeight || null); refresh(); };
    const onWaiting = () => tracker.markRebuffer();
    const onLevel = () => { if (hlsRef.current) setRendition(hlsRef.current.levels?.[hlsRef.current.currentLevel]?.height ?? null); };
    vid.addEventListener("playing", onPlaying, { once: true });
    vid.addEventListener("waiting", onWaiting);

    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
    vid.pause();
    vid.removeAttribute("src");

    const doPlay = () => { if (!cancelled) { vid.muted = true; vid.play().catch(() => {}); } };

    // Warm next clip's manifest (cap: next 1).
    const nextClip: SeedClip | undefined = SEED_CLIPS[(index + 1) % SEED_CLIPS.length];
    if (nextClip) {
      const nextUrl = getSeedHlsUrl(nextClip);
      if (!warmedRef.current.has(nextUrl)) {
        warmedRef.current.add(nextUrl);
        fetch(nextUrl, { mode: "cors" }).catch(() => {});
        const poster = getSeedPoster(nextClip);
        if (poster) { const img = new window.Image(); img.src = poster; }
      }
    }

    const cleanup = () => {
      cancelled = true;
      vid.removeEventListener("playing", onPlaying);
      vid.removeEventListener("waiting", onWaiting);
    };

    if (vid.canPlayType("application/vnd.apple.mpegurl")) {
      vid.src = hlsUrl;
      vid.addEventListener("canplay", () => { if (!cancelled) doPlay(); }, { once: true });
      vid.load();
      return cleanup;
    }

    getHls().then((Hls) => {
      if (cancelled || !Hls || !Hls.isSupported()) return;
      const hls = new Hls({ maxBufferLength: 15, enableWorker: true });
      hlsRef.current = hls;
      hls.loadSource(hlsUrl);
      hls.attachMedia(vid);
      hls.on(Hls.Events.MANIFEST_PARSED, () => { if (!cancelled) doPlay(); });
      hls.on(Hls.Events.LEVEL_SWITCHED, onLevel);
    });

    return cleanup;
  }, [index, refresh]);

  const clip = SEED_CLIPS[index];

  return (
    <div style={{ minHeight: "100dvh", background: "#07070E", color: "#fff", padding: 16, fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Verza Perf Harness</h1>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <div style={{ position: "relative", width: 240, aspectRatio: "9 / 16", background: "#000", borderRadius: 12, overflow: "hidden", flexShrink: 0 }}>
          <video ref={videoRef} playsInline muted loop preload="auto" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>

        <div style={{ flex: 1, minWidth: 280 }}>
          <p style={{ fontSize: 13, opacity: 0.8, marginBottom: 8 }}>
            <strong>{index + 1}/{SEED_CLIPS.length}</strong> — {clip.label}
          </p>
          <p style={{ fontSize: 11, opacity: 0.5, marginBottom: 12 }}>
            rendition: {rendition ? `${rendition}p` : "—"}
          </p>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <button onClick={prev} style={btn}>◀ Prev</button>
            <button onClick={next} style={btn}>Next ▶</button>
            <button onClick={() => { clearMetrics(); refresh(); }} style={{ ...btn, background: "#333" }}>Clear</button>
          </div>

          <table style={{ width: "100%", fontSize: 11, borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", opacity: 0.6 }}>
                <th style={th}>Clip</th>
                <th style={th}>TTFF</th>
                <th style={th}>Preload</th>
                <th style={th}>Rebuf</th>
                <th style={th}>Rend</th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((m, i) => (
                <tr key={`${m.id}-${m.at}-${i}`} style={{ borderTop: "1px solid #1e1e2a" }}>
                  <td style={td}>{m.id}</td>
                  <td style={td}>{m.ttffMs != null ? `${m.ttffMs}ms` : "—"}</td>
                  <td style={td}>{m.preloadHit ? "✓ hit" : "miss"}</td>
                  <td style={td}>{m.rebuffers}</td>
                  <td style={td}>{m.rendition ? `${m.rendition}p` : "—"}</td>
                </tr>
              ))}
              {metrics.length === 0 && (
                <tr><td colSpan={5} style={{ ...td, opacity: 0.4 }}>No metrics yet — play a clip.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const btn: React.CSSProperties = {
  background: "#E0115F", color: "#fff", border: "none", borderRadius: 8,
  padding: "8px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer",
};
const th: React.CSSProperties = { padding: "4px 8px", fontWeight: 600 };
const td: React.CSSProperties = { padding: "4px 8px" };
