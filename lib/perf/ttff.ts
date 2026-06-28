/* ------------------------------------------------------------------ */
/*  Lightweight client-side video performance metric recorder.         */
/*  Captures TTFF (tap -> first 'playing'), preload hit/miss, and       */
/*  rebuffer counts into an in-memory ring buffer exposed on            */
/*  window.__verzaPerf for the /dev/perf harness to read.               */
/* ------------------------------------------------------------------ */

export interface PerfMetric {
  /** Logical source identifier (playbackId, seed id, or series/ep). */
  id: string;
  /** Milliseconds from intent (tap / source-swap) to first 'playing'. */
  ttffMs: number | null;
  /** Was the manifest already warmed before playback started? */
  preloadHit: boolean;
  /** Number of 'waiting' (rebuffer) events during this playback. */
  rebuffers: number;
  /** Active HLS rendition height (px) if known. */
  rendition: number | null;
  /** Epoch ms when the metric was recorded. */
  at: number;
}

const RING_SIZE = 50;

interface PerfGlobal {
  metrics: PerfMetric[];
  push: (m: PerfMetric) => void;
  clear: () => void;
}

declare global {
  interface Window {
    __verzaPerf?: PerfGlobal;
  }
}

function store(): PerfGlobal | null {
  if (typeof window === "undefined") return null;
  if (!window.__verzaPerf) {
    const metrics: PerfMetric[] = [];
    window.__verzaPerf = {
      metrics,
      push(m: PerfMetric) {
        metrics.push(m);
        if (metrics.length > RING_SIZE) metrics.shift();
      },
      clear() {
        metrics.length = 0;
      },
    };
  }
  return window.__verzaPerf;
}

export function recordMetric(m: PerfMetric): void {
  store()?.push(m);
}

export function getMetrics(): PerfMetric[] {
  return store()?.metrics ?? [];
}

export function clearMetrics(): void {
  store()?.clear();
}

/* ------------------------------------------------------------------ */
/*  Per-playback timer helper.                                         */
/*  Call markIntent() on tap/source-swap, then attach the returned     */
/*  recorder to the video's first 'playing'.                           */
/* ------------------------------------------------------------------ */

export interface TtffTracker {
  /** Mark the moment of user/playback intent. */
  markIntent: () => void;
  /** Record one rebuffer ('waiting') event. */
  markRebuffer: () => void;
  /** Finalize on first 'playing'; computes TTFF and pushes the metric. */
  commit: (rendition?: number | null) => void;
  /** Reset for the next clip without committing. */
  reset: () => void;
}

export function createTtffTracker(id: string, preloadHit: boolean): TtffTracker {
  let intentAt: number | null = null;
  let rebuffers = 0;
  let committed = false;

  return {
    markIntent() {
      intentAt = performance.now();
      rebuffers = 0;
      committed = false;
    },
    markRebuffer() {
      if (!committed) rebuffers += 1;
    },
    commit(rendition: number | null = null) {
      if (committed) return;
      committed = true;
      recordMetric({
        id,
        ttffMs: intentAt != null ? Math.round(performance.now() - intentAt) : null,
        preloadHit,
        rebuffers,
        rendition,
        at: Date.now(),
      });
    },
    reset() {
      intentAt = null;
      rebuffers = 0;
      committed = false;
    },
  };
}
