import "server-only";

import Mux from "@mux/mux-node";
import { getSignedPlaybackId } from "@/lib/mux-signed-map";

const STREAM_ORIGIN = "https://stream.mux.com";
const IMAGE_ORIGIN = "https://image.mux.com";

/**
 * Thirty minutes is safely longer than the longest catalog episode plus a
 * generous playback/buffering margin, while materially limiting the lifetime
 * of a copied URL after a refund, dispute, sign-out, or account deletion.
 * Clients refresh before reuse and use bounded fresh authorization after an
 * expiry-shaped playback failure.
 */
export const SIGNED_PLAYBACK_TTL_SECONDS = 30 * 60;

export type PlaybackPolicy = "public" | "signed";

export type PlaybackDelivery = {
  policy: PlaybackPolicy;
  playbackUrl: string;
  poster: string;
  /** UNIX epoch seconds. Null means the URL is public and has no JWT expiry. */
  expiresAt: number | null;
};

export class MuxPlaybackConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MuxPlaybackConfigurationError";
  }
}

function parseExactBoolean(name: string, fallback: boolean): boolean {
  const raw = process.env[name];
  if (raw == null || raw === "") return fallback;
  if (raw === "true") return true;
  if (raw === "false") return false;
  throw new MuxPlaybackConfigurationError(
    `${name} must be exactly "true" or "false"`,
  );
}

/**
 * Defaults OFF for the compatibility deployment. When ON, paid playback has
 * no unsigned fallback: missing map rows or signing credentials return 503.
 */
export function signedCatalogPlaybackEnabled(): boolean {
  return parseExactBoolean("MUX_SIGNED_PLAYBACK_ENABLED", false);
}

function validatePlaybackId(value: string, label: string): string {
  // Mux playback IDs are URL-path tokens. Reject anything that could alter the
  // URL shape even if a generated map or upstream response were corrupted.
  if (!/^[A-Za-z0-9]+$/.test(value)) {
    throw new MuxPlaybackConfigurationError(`${label} is invalid`);
  }
  return value;
}

function publicDelivery(publicPlaybackId: string): PlaybackDelivery {
  const id = validatePlaybackId(publicPlaybackId, "Public playback ID");
  return {
    policy: "public",
    playbackUrl: `${STREAM_ORIGIN}/${id}.m3u8`,
    poster: `${IMAGE_ORIGIN}/${id}/thumbnail.jpg?time=5&width=720&height=1280`,
    expiresAt: null,
  };
}

let signingClient: Mux | null = null;
let signingClientFingerprint = "";

function getSigningClient(): Mux {
  const keyId = process.env.MUX_SIGNING_KEY_ID ?? "";
  const keySecret = process.env.MUX_SIGNING_KEY_SECRET ?? "";
  if (!keyId || !keySecret) {
    throw new MuxPlaybackConfigurationError(
      "Signed playback is enabled but Mux signing credentials are missing",
    );
  }

  // Recreate only when a deployment/runtime rotates credentials. Never log or
  // persist the fingerprint: it includes the private-key string.
  const fingerprint = `${keyId}\0${keySecret}`;
  if (!signingClient || signingClientFingerprint !== fingerprint) {
    signingClient = new Mux({
      jwtSigningKey: keyId,
      jwtPrivateKey: keySecret,
    });
    signingClientFingerprint = fingerprint;
  }
  return signingClient;
}

/** Build the public delivery used for catalog-free episodes. */
export function getPublicPlaybackDelivery(
  publicPlaybackId: string,
): PlaybackDelivery {
  return publicDelivery(publicPlaybackId);
}

/**
 * Build an authorized paid-episode delivery.
 *
 * Compatibility phase (`MUX_SIGNED_PLAYBACK_ENABLED=false`): returns the
 * current public URL so the endpoint/client change can deploy before Mux is
 * mutated. Signed phase: requires complete generated mapping and signing env,
 * signs video and thumbnail JWTs independently, and never falls back public.
 */
export async function getPaidPlaybackDelivery(
  publicPlaybackId: string,
): Promise<PlaybackDelivery> {
  const publicId = validatePlaybackId(publicPlaybackId, "Public playback ID");
  if (!signedCatalogPlaybackEnabled()) return publicDelivery(publicId);

  const mapped = getSignedPlaybackId(publicId);
  if (!mapped) {
    throw new MuxPlaybackConfigurationError(
      "Signed playback is enabled but this paid catalog asset is not mapped",
    );
  }
  const signedId = validatePlaybackId(mapped, "Signed playback ID");
  const mux = getSigningClient();
  const expiration = `${SIGNED_PLAYBACK_TTL_SECONDS}s`;

  const [videoToken, thumbnailToken] = await Promise.all([
    mux.jwt.signPlaybackId(signedId, {
      type: "video",
      expiration,
    }),
    mux.jwt.signPlaybackId(signedId, {
      type: "thumbnail",
      expiration,
      // For signed image URLs, Mux requires transformations inside the JWT;
      // adding them beside token= would invalidate the signature.
      params: {
        time: "5",
        width: "720",
        height: "1280",
      },
    }),
  ]);

  return {
    policy: "signed",
    playbackUrl: `${STREAM_ORIGIN}/${signedId}.m3u8?token=${encodeURIComponent(videoToken)}`,
    poster: `${IMAGE_ORIGIN}/${signedId}/thumbnail.jpg?token=${encodeURIComponent(thumbnailToken)}`,
    expiresAt: Math.floor(Date.now() / 1000) + SIGNED_PLAYBACK_TTL_SECONDS,
  };
}
