import { NextRequest } from "next/server";
import { getCreatorContext, buildContentSlug } from "@/lib/creator";
import { getServiceClient } from "@/lib/supabase/server";
import { createDirectUpload, muxConfigured } from "@/lib/mux-upload";

const clamp = (v: unknown, n = 280) => (typeof v === "string" ? v.slice(0, n) : "");

/**
 * POST /api/creator/upload
 * Approved creators only. Creates a content row in `uploading` state and a Mux
 * direct-upload URL. The browser PUTs the file straight to Mux (vertical 9:16
 * or landscape 16:9, MP4/MOV); the Mux webhook later flips status to ready and
 * stores the playback id. The asset is tied to this creator via passthrough.
 */
export async function POST(req: NextRequest) {
  const ctx = await getCreatorContext();
  if (!ctx) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!ctx.creator || ctx.creator.status !== "approved") {
    return Response.json({ error: "Creator not approved" }, { status: 403 });
  }
  if (!muxConfigured()) {
    // No Mux token provisioned yet — fail loudly so it's never silently fake.
    return Response.json(
      { error: "Uploads are not configured yet (missing Mux token). Contact the Verza team." },
      { status: 503 },
    );
  }

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    /* optional body */
  }
  const title = clamp(body.title, 120).trim() || "Untitled";
  const aspect = body.aspectRatio === "16:9" ? "16:9" : "9:16";

  const supabase = getServiceClient();
  const slug = buildContentSlug(ctx.creator.handle, title);

  // Create the content row first so we have an id to pass to Mux as passthrough.
  const { data: content, error: insErr } = await supabase
    .from("creator_content")
    .insert({
      creator_id: ctx.creator.id,
      slug,
      title,
      aspect_ratio: aspect,
      status: "uploading",
    })
    .select("id")
    .single();

  if (insErr || !content) {
    console.error("[creator/upload] insert failed:", insErr);
    return Response.json({ error: "Could not create content" }, { status: 500 });
  }

  const origin =
    req.headers.get("origin") ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://www.verzatv.com";

  try {
    const { uploadId, uploadUrl } = await createDirectUpload(content.id, origin);
    await supabase
      .from("creator_content")
      .update({ mux_upload_id: uploadId, updated_at: new Date().toISOString() })
      .eq("id", content.id);

    return Response.json({ contentId: content.id, slug, uploadUrl, uploadId });
  } catch (err) {
    console.error("[creator/upload] mux upload create failed:", err);
    // Roll the row back to draft so the creator can retry without orphaning it.
    await supabase
      .from("creator_content")
      .update({ status: "draft" })
      .eq("id", content.id);
    return Response.json({ error: "Could not start upload" }, { status: 502 });
  }
}
