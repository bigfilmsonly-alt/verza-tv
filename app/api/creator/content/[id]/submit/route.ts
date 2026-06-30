import { NextRequest } from "next/server";
import { getCreatorContext } from "@/lib/creator";
import { getServiceClient } from "@/lib/supabase/server";
import { sendFormNotification } from "@/lib/email";

/**
 * POST /api/creator/content/[id]/submit
 * Moves a READY title into the admin review queue (pending_review). Requires a
 * processed video and, for paid titles, a price. Owner-scoped.
 */
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await getCreatorContext();
  if (!ctx?.creator) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getServiceClient();
  const { data: content } = await supabase
    .from("creator_content")
    .select("*")
    .eq("id", id)
    .eq("creator_id", ctx.creator.id)
    .maybeSingle();

  if (!content) return Response.json({ error: "Not found" }, { status: 404 });
  if (content.status !== "ready") {
    return Response.json(
      { error: "Video must finish processing before submitting" },
      { status: 409 },
    );
  }
  if (!content.title || content.title === "Untitled") {
    return Response.json({ error: "Add a title before submitting" }, { status: 400 });
  }
  if (content.pricing_type !== "free" && content.price_cents < 99) {
    return Response.json({ error: "Set a price for paid content" }, { status: 400 });
  }

  const { error } = await supabase
    .from("creator_content")
    .update({
      status: "pending_review",
      submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error("[creator/content/submit] failed:", error);
    return Response.json({ error: "Could not submit" }, { status: 500 });
  }

  sendFormNotification("Creator Content Submitted for Review", ctx.email, {
    title: content.title,
    creator: ctx.creator.handle,
    pricing: content.pricing_type,
  }).catch(() => {});

  return Response.json({ ok: true, status: "pending_review" });
}
