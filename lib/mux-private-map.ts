import "server-only";

/**
 * Server-only gateway to the complete legacy capability map.
 *
 * `mux-map.ts` remains byte-identical with the native data-sync anchor, so it
 * cannot itself import Next's `server-only` sentinel. Every web runtime caller
 * must use this module; browser/native-safe code uses `mux-public-map.ts`.
 */
export {
  MUX_MAP,
  getPlayback,
  getRandomPlayback,
  type MuxEpisode,
} from "./mux-map";
