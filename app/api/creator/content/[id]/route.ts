import { NextRequest } from "next/server";
import { getCreatorContext } from "@/lib/creator";
import { getServiceClient } from "@/lib/supabase/server";
import { getUploadAssetId, getAsset, muxConfigured } from "@/lib/mux-upload";

const clamp = (v: unknown, n = 280) => (typeof v === "string" ? v.slice(0, n) : "");

const CATEGORIES = ["microdrama", "film", "series", "podcast", "creator", "other"];
const PRICING = ["free", "ppv", "premium"];

/** Verify the content row belongs to the signed-in creator. */
async function ownContent(id: string) {
  const ctx = await getCreatorContext();
  if (!ctx?.creator) return null;
  const supabase = getServiceClient();
  const { data } = await supabase
    .from("creator_content")
    .select("*")
    .eq("id", id)
    .eq("creator_id", ctx.creator.id)
    .maybeSingle();
  return data ? { ctx, content: data, supabase } : null;
}

/**
 * GET /api/creator/content/[id]
 * Returns one of the creator's titles. If it's still uploading/processing and
 * Mux hasn't called back yet, polls Mux directly as a fallback so the UI can
 * advance without waiting on the webhook.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const owned = await ownContent(id);
  if (!owned) return Response.json({ error: "Not found" }, { status: 404 });

  let { content } = owned;
  const { supabase } = owned;

  // Fallback reconciliation when the webhook is delayed.
  if (
    muxConfigured() &&
    (content.status === "uploading" || content.status === "processing") &&
    !content.mux_playback_id
  ) {
    try {
      let assetId: string | null = content.mux_asset_id;
      if (!assetId && content.mux_upload_id) {
        assetId = await getUploadAssetId(content.mux_upload_id);
      }
      if (assetId) {
        const info = await getAsset(assetId);
        const update: Record<string, unknown> = {
          mux_asset_id: assetId,
          updated_at: new Date().toISOString(),
        };
        if (info.status === "ready" && info.playbackId) {
          update.status = "ready";
          update.mux_playback_id = info.playbackId;
          update.duration_seconds = info.durationSeconds;
          if (info.aspectRatio === "9:16" || info.aspectRatio === "16:9") {
            update.aspect_ratio = info.aspectRatio;
          }
        } else if (content.status === "uploading") {
          update.status = "processing";
        }
        await supabase.from("creator_content").update(update).eq("id", id);
        content = { ...content, ...update };
      }
    } catch (err) {
      console.error("[creator/content GET] mux sync failed:", err);
    }
  }

  return Response.json({ content });
}

/**
 * PATCH /api/creator/content/[id]
 * Save details + pricing. Server enforces pricing rules (PPV requires a price).
 * Locked once submitted/published so the review can't be bypassed.
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const owned = await ownContent(id);
  if (!owned) return Response.json({ error: "Not found" }, { status: 404 });
  const { content, supabase } = owned;

  if (content.status === "pending_review" || content.status === "published") {
    return Response.json({ error: "Locked while in review or live" }, { status: 409 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (body.title !== undefined) update.title = clamp(body.title, 120).trim() || "Untitled";
  if (body.description !== undefined) update.description = clamp(body.description, 4000).trim();
  if (body.poster_url !== undefined) update.poster_url = clamp(body.poster_url, 500).trim();
  if (body.category !== undefined) {
    const c = String(body.category);
    if (!CATEGORIES.includes(c)) return Response.json({ error: "Bad category" }, { status: 400 });
    update.category = c;
  }

  if (body.pricing_type !== undefined) {
    const pt = String(body.pricing_type);
    if (!PRICING.includes(pt)) return Response.json({ error: "Bad pricing type" }, { status: 400 });
    update.pricing_type = pt;
    if (pt === "free") {
      update.price_cents = 0;
    } else {
      // Price is server-validated; client can't set arbitrary/negative money.
      const cents = Math.round(Number(body.price_cents));
      if (!Number.isFinite(cents) || cents < 99 || cents > 50000) {
        return Response.json({ error: "Price must be $0.99–$500" }, { status: 400 });
      }
      update.price_cents = cents;
    }
  }

  const { error } = await supabase.from("creator_content").update(update).eq("id", id);
  if (error) {
    console.error("[creator/content PATCH] failed:", error);
    return Response.json({ error: "Could not save" }, { status: 500 });
  }
  return Response.json({ ok: true });
}
