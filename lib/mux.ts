import "server-only";

/**
 * Compatibility entry point. New catalog playback code uses
 * `lib/mux-playback.ts`; this module intentionally exposes no synchronous or
 * unsigned "signed URL" stub.
 */
export {
  MuxPlaybackConfigurationError,
  SIGNED_PLAYBACK_TTL_SECONDS,
  getPaidPlaybackDelivery,
  getPublicPlaybackDelivery,
  signedCatalogPlaybackEnabled,
} from "@/lib/mux-playback";
