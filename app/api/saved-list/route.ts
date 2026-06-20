import { NextRequest } from "next/server";
import { getUser } from "@/lib/auth";
import { getServiceClient } from "@/lib/supabase/server";
import { getSeriesBySlug } from "@/lib/catalog";

/**
 * GET /api/saved-list — list all saved series for current user
 */
export async function GET() {
  const user = await getUser();
  if (!user) {
    return Response.json({ items: [] });
  }

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("saved_list")
    .select("series_slug, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[saved-list] List error:", error);
    return Response.json({ items: [] });
  }

  const items = (data ?? []).map((row) => {
    const series = getSeriesBySlug(row.series_slug);
    return {
      seriesSlug: row.series_slug,
      seriesTitle: series?.title ?? row.series_slug,
      posterUrl: series?.posterUrl ?? "",
      episodeCount: series?.episodeCount ?? 0,
      genre: series?.genre ?? "",
      savedAt: row.created_at,
    };
  });

  return Response.json({ items });
}

/**
 * POST /api/saved-list — add a series to the saved list
 * Body: { seriesSlug: string }
 */
export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) {
    return Response.json({ error: "Not signed in" }, { status: 401 });
  }

  const body = await req.json();
  const { seriesSlug } = body;

  if (!seriesSlug || typeof seriesSlug !== "string") {
    return Response.json({ error: "Missing seriesSlug" }, { status: 400 });
  }

  const supabase = getServiceClient();
  const { error } = await supabase
    .from("saved_list")
    .upsert(
      {
        user_id: user.id,
        series_slug: seriesSlug,
        created_at: new Date().toISOString(),
      },
      { onConflict: "user_id,series_slug" },
    );

  if (error) {
    console.error("[saved-list] Save error:", error);
    return Response.json({ error: "Failed to save" }, { status: 500 });
  }

  return Response.json({ saved: true });
}

/**
 * DELETE /api/saved-list — remove a series from the saved list
 * Body: { seriesSlug: string }
 */
export async function DELETE(req: NextRequest) {
  const user = await getUser();
  if (!user) {
    return Response.json({ error: "Not signed in" }, { status: 401 });
  }

  const body = await req.json();
  const { seriesSlug } = body;

  if (!seriesSlug || typeof seriesSlug !== "string") {
    return Response.json({ error: "Missing seriesSlug" }, { status: 400 });
  }

  const supabase = getServiceClient();
  const { error } = await supabase
    .from("saved_list")
    .delete()
    .eq("user_id", user.id)
    .eq("series_slug", seriesSlug);

  if (error) {
    console.error("[saved-list] Delete error:", error);
    return Response.json({ error: "Failed to remove" }, { status: 500 });
  }

  return Response.json({ removed: true });
}
