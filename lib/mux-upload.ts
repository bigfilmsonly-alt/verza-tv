import "server-only";
import Mux from "@mux/mux-node";

/**
 * Server-side Mux client for creator direct uploads.
 * Requires MUX_TOKEN_ID + MUX_TOKEN_SECRET (a Mux access token with video
 * write scope). Distinct from the signing keys used for playback URLs.
 */

let client: Mux | null = null;

export function muxConfigured(): boolean {
  return Boolean(process.env.MUX_TOKEN_ID && process.env.MUX_TOKEN_SECRET);
}

function getMux(): Mux {
  if (!muxConfigured()) {
    throw new Error("MUX_NOT_CONFIGURED");
  }
  if (!client) {
    client = new Mux({
      tokenId: process.env.MUX_TOKEN_ID!,
      tokenSecret: process.env.MUX_TOKEN_SECRET!,
    });
  }
  return client;
}

export interface DirectUpload {
  uploadId: string;
  uploadUrl: string;
}

/**
 * Create a Mux direct upload. The browser PUTs the raw file straight to the
 * returned URL (no proxying through our server → no request-size/timeout
 * limits). passthrough carries our content row id so the webhook can link the
 * resulting asset back to the creator's content.
 */
export async function createDirectUpload(
  contentId: string,
  corsOrigin: string,
): Promise<DirectUpload> {
  const mux = getMux();
  const upload = await mux.video.uploads.create({
    cors_origin: corsOrigin,
    new_asset_settings: {
      playback_policy: ["public"],
      passthrough: contentId,
      encoding_tier: "baseline",
    },
  });
  if (!upload.url) throw new Error("MUX_UPLOAD_NO_URL");
  return { uploadId: upload.id, uploadUrl: upload.url };
}

/** Resolve the asset id once an upload finishes (fallback if webhook is slow). */
export async function getUploadAssetId(uploadId: string): Promise<string | null> {
  const mux = getMux();
  const upload = await mux.video.uploads.retrieve(uploadId);
  return upload.asset_id ?? null;
}

export interface AssetInfo {
  playbackId: string | null;
  status: string;
  durationSeconds: number;
  aspectRatio: string | null;
}

export async function getAsset(assetId: string): Promise<AssetInfo> {
  const mux = getMux();
  const asset = await mux.video.assets.retrieve(assetId);
  return {
    playbackId: asset.playback_ids?.[0]?.id ?? null,
    status: asset.status,
    durationSeconds: Math.round(asset.duration ?? 0),
    aspectRatio: asset.aspect_ratio ?? null,
  };
}
