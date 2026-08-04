import { getCreatorContext } from "@/lib/creator";
import { privateJson } from "@/lib/private-json";
import { getServiceClient } from "@/lib/supabase/server";

/**
 * GET /api/creator/content
 * Lists the signed-in creator's own content (all statuses). Owner-scoped.
 */
export async function GET() {
  const ctx = await getCreatorContext();
  if (!ctx) return privateJson({ error: "Unauthorized" }, { status: 401 });
  if (!ctx.creator) return privateJson({ items: [] });

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("creator_content")
    .select(
      "id, slug, title, description, category, status, aspect_ratio, duration_seconds, poster_url, mux_playback_id, pricing_type, price_cents, rejection_reason, created_at, published_at",
    )
    .eq("creator_id", ctx.creator.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[creator/content] list failed:", error);
    return privateJson({ error: "Could not load content" }, { status: 500 });
  }

  return privateJson({ items: data ?? [] });
}
