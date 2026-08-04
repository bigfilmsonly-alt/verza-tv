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
 * Verification is mandatory. A missing secret, invalid signature, body/read
 * failure, or database mutation failure is never acknowledged with 2xx. We
 * link the asset back to our content row via `passthrough` (set to content.id
 * at upload-create time), with mux_asset_id / mux_upload_id as fallbacks.
 */

export async function POST(req: NextRequest) {
  const secret = process.env.MUX_WEBHOOK_SECRET?.trim();
  if (!secret) {
    console.error("[mux/webhook] verification is not configured");
    return Response.json(
      { error: "Webhook verification unavailable" },
      { status: 503 },
    );
  }

  let event: { type?: string; data?: Record<string, unknown> };
  try {
    const body = await req.text();
    const mux = new Mux({
      tokenId: process.env.MUX_TOKEN_ID,
      tokenSecret: process.env.MUX_TOKEN_SECRET,
      webhookSecret: secret,
    });
    event = await mux.webhooks.unwrap(
      body,
      Object.fromEntries(req.headers),
    ) as unknown as typeof event;
  } catch {
    console.error("[mux/webhook] signature verification failed");
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

  if (
    type !== "video.asset.created" &&
    type !== "video.asset.ready" &&
    type !== "video.asset.errored"
  ) {
    return Response.json({ received: true });
  }

  try {
    const supabase = getServiceClient();

    // Locate the content row this event belongs to. A missing row can be an
    // unrelated Mux asset and is safely acknowledged; a database error is not.
    async function findContentId(): Promise<string | null> {
      if (passthrough) {
        const { data: row, error } = await supabase
          .from("creator_content")
          .select("id")
          .eq("id", passthrough)
          .maybeSingle();
        if (error) throw new Error("creator content passthrough lookup failed");
        return row?.id ?? null;
      }
      if (assetId) {
        const { data: row, error } = await supabase
          .from("creator_content")
          .select("id")
          .eq("mux_asset_id", assetId)
          .maybeSingle();
        if (error) throw new Error("creator content asset lookup failed");
        if (row?.id) return row.id;
      }
      if (uploadId) {
        const { data: row, error } = await supabase
          .from("creator_content")
          .select("id")
          .eq("mux_upload_id", uploadId)
          .maybeSingle();
        if (error) throw new Error("creator content upload lookup failed");
        if (row?.id) return row.id;
      }
      return null;
    }

    switch (type) {
      case "video.asset.created": {
        const contentId = await findContentId();
        if (contentId && assetId) {
          const { error } = await supabase
            .from("creator_content")
            .update({ mux_asset_id: assetId, status: "processing", updated_at: new Date().toISOString() })
            .eq("id", contentId);
          if (error) throw new Error("creator asset-created update failed");
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
          const { error } = await supabase
            .from("creator_content")
            .update(update)
            .eq("id", contentId);
          if (error) throw new Error("creator asset-ready update failed");
        }
        break;
      }

      case "video.asset.errored": {
        const contentId = await findContentId();
        if (contentId) {
          const { error } = await supabase
            .from("creator_content")
            .update({ status: "draft", updated_at: new Date().toISOString() })
            .eq("id", contentId);
          if (error) throw new Error("creator asset-error update failed");
        }
        break;
      }
    }
  } catch {
    console.error("[mux/webhook] processing failed; provider should retry");
    return Response.json({ error: "Webhook processing failed" }, { status: 500 });
  }

  return Response.json({ received: true });
}
