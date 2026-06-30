import { NextRequest } from "next/server";
import Mux from "@mux/mux-node";
import { getServiceClient } from "@/lib/supabase/server";

/**
 * POST /api/mux/webhook
 * Flips creator_content status as Mux processes an upload:
 *   video.asset.created  -> processing (store asset id)
 *   video.asset.ready    -> ready      (store playback id + duration + ratio)
 *   video.asset.errored  -> draft      (let the creator retry)
 *
 * Verified with MUX_WEBHOOK_SECRET when present. We link the asset back to our
 * content row via `passthrough` (set to content.id at upload-create time), with
 * mux_asset_id / mux_upload_id as fallbacks.
 */

export async function POST(req: NextRequest) {
  const body = await req.text();

  let event: { type?: string; data?: Record<string, unknown> };
  const secret = process.env.MUX_WEBHOOK_SECRET;
  try {
    if (secret) {
      const mux = new Mux({
        tokenId: process.env.MUX_TOKEN_ID,
        tokenSecret: process.env.MUX_TOKEN_SECRET,
        webhookSecret: secret,
      });
      event = mux.webhooks.unwrap(body, Object.fromEntries(req.headers)) as typeof event;
    } else {
      event = JSON.parse(body);
    }
  } catch (err) {
    console.error("[mux/webhook] verification/parse failed:", err);
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }

  const type = event.type;
  const data = (event.data ?? {}) as Record<string, unknown>;
  const assetId = (data.id as string) || undefined;
  const passthrough =
    (data.passthrough as string) ||
    ((data.new_asset_settings as Record<string, unknown> | undefined)?.passthrough as string) ||
    undefined;
  const uploadId = (data.upload_id as string) || undefined;

  const supabase = getServiceClient();

  // Locate the content row this event belongs to.
  async function findContentId(): Promise<string | null> {
    if (passthrough) return passthrough;
    if (assetId) {
      const { data: row } = await supabase
        .from("creator_content")
        .select("id")
        .eq("mux_asset_id", assetId)
        .maybeSingle();
      if (row?.id) return row.id;
    }
    if (uploadId) {
      const { data: row } = await supabase
        .from("creator_content")
        .select("id")
        .eq("mux_upload_id", uploadId)
        .maybeSingle();
      if (row?.id) return row.id;
    }
    return null;
  }

  try {
    switch (type) {
      case "video.asset.created": {
        const contentId = await findContentId();
        if (contentId && assetId) {
          await supabase
            .from("creator_content")
            .update({ mux_asset_id: assetId, status: "processing", updated_at: new Date().toISOString() })
            .eq("id", contentId);
        }
        break;
      }

      case "video.asset.ready": {
        const contentId = await findContentId();
        const playbackId = (data.playback_ids as { id: string }[] | undefined)?.[0]?.id ?? null;
        const duration = Math.round((data.duration as number) ?? 0);
        const aspect = (data.aspect_ratio as string) || null;
        if (contentId) {
          const update: Record<string, unknown> = {
            status: "ready",
            duration_seconds: duration,
            updated_at: new Date().toISOString(),
          };
          if (assetId) update.mux_asset_id = assetId;
          if (playbackId) update.mux_playback_id = playbackId;
          if (aspect === "9:16" || aspect === "16:9") update.aspect_ratio = aspect;
          await supabase.from("creator_content").update(update).eq("id", contentId);
        }
        break;
      }

      case "video.asset.errored": {
        const contentId = await findContentId();
        if (contentId) {
          await supabase
            .from("creator_content")
            .update({ status: "draft", updated_at: new Date().toISOString() })
            .eq("id", contentId);
        }
        break;
      }

      default:
        // Unhandled Mux event — ack so Mux stops retrying.
        break;
    }
  } catch (err) {
    console.error("[mux/webhook] handler error:", err);
    // Still ack to avoid infinite retries; we logged it.
  }

  return Response.json({ received: true });
}
