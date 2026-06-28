/* ------------------------------------------------------------------ */
/*  Perf test seed clips — public, unsigned HLS streams used by the     */
/*  /dev/perf harness to measure player performance without touching    */
/*  paid catalog content or the paywall.                                */
/* ------------------------------------------------------------------ */

/** Gate the harness behind an explicit env flag (never on in prod). */
export const PERF_TEST_MODE =
  process.env.NEXT_PUBLIC_PERF_TEST_MODE === "1" ||
  process.env.NODE_ENV !== "production";

export interface SeedClip {
  id: string;
  label: string;
  /** Mux public playback ID — preferred (gets a real poster). */
  playbackId?: string;
  /** Or a fully-qualified public HLS manifest URL. */
  hlsUrl?: string;
}

/* Mux's public demo asset + canonical public HLS test streams.
   All are openly hosted for testing and require no signing. */
export const SEED_CLIPS: SeedClip[] = [
  { id: "mux-demo", label: "Mux Demo (Big Buck Bunny)", playbackId: "v69RSHhFelSm4701snP22dYz2jICy4E4FUyk02rW4gxRM" },
  { id: "mux-test-1", label: "Mux Test — Low Latency", hlsUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8" },
  { id: "mux-test-2", label: "Mux Test — Multi-rendition", hlsUrl: "https://test-streams.mux.dev/test_001/stream.m3u8" },
  { id: "apple-bipbop-16x9", label: "Apple BipBop 16:9", hlsUrl: "https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_fmp4/master.m3u8" },
  { id: "apple-bipbop-basic", label: "Apple BipBop Basic", hlsUrl: "https://devstreaming-cdn.apple.com/videos/streaming/examples/bipbop_4x3/bipbop_4x3_variant.m3u8" },
  { id: "mux-test-3", label: "Mux Test — fMP4", hlsUrl: "https://test-streams.mux.dev/pts_shift/master.m3u8" },
  { id: "mux-test-4", label: "Mux Test — Audio shift", hlsUrl: "https://test-streams.mux.dev/elephants_dream/playlist.m3u8" },
  { id: "mux-test-5", label: "Mux Test — TS segments", hlsUrl: "https://test-streams.mux.dev/bbb-360/playlist.m3u8" },
];

export function getSeedHlsUrl(clip: SeedClip): string {
  if (clip.hlsUrl) return clip.hlsUrl;
  return `https://stream.mux.com/${clip.playbackId}.m3u8`;
}

export function getSeedPoster(clip: SeedClip): string | null {
  if (clip.playbackId) {
    return `https://image.mux.com/${clip.playbackId}/thumbnail.jpg?time=2&width=720`;
  }
  return null;
}
