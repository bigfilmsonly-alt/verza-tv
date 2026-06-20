import { NextRequest } from "next/server";
import { getUser } from "@/lib/auth";
import { getServiceClient } from "@/lib/supabase/server";
import { getSeriesBySlug } from "@/lib/catalog";

/**
 * POST /api/watch-progress — save watch progress
 * Body: { seriesSlug, episodeNumber, progressSeconds, completed }
 */
export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) {
    return Response.json({ error: "Not signed in" }, { status: 401 });
  }

  const body = await req.json();
  const { seriesSlug, episodeNumber, progressSeconds, completed } = body;

  if (!seriesSlug || !episodeNumber) {
    return Response.json({ error: "Missing seriesSlug or episodeNumber" }, { status: 400 });
  }

  const supabase = getServiceClient();
  const { error } = await supabase
    .from("watch_progress")
    .upsert({
      user_id: user.id,
      series_slug: seriesSlug,
      episode_number: episodeNumber,
      progress_seconds: progressSeconds ?? 0,
      completed: completed ?? false,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,series_slug,episode_number" });

  if (error) {
    console.error("[watch-progress] Save error:", error);
    return Response.json({ error: "Failed to save" }, { status: 500 });
  }

  return Response.json({ saved: true });
}

/**
 * GET /api/watch-progress — get continue watching list
 */
export async function GET() {
  const user = await getUser();
  if (!user) {
    return Response.json({ items: [] });
  }

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("watch_progress")
    .select("*")
    .eq("user_id", user.id)
    .eq("completed", false)
    .order("updated_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error("[watch-progress] List error:", error);
    return Response.json({ items: [] });
  }

  // Enrich with series metadata
  const items = (data ?? []).map((wp) => {
    const series = getSeriesBySlug(wp.series_slug);
    return {
      seriesSlug: wp.series_slug,
      seriesTitle: series?.title ?? wp.series_slug,
      posterUrl: series?.posterUrl ?? "",
      episodeNumber: wp.episode_number,
      totalEpisodes: series?.episodeCount ?? 0,
      progressSeconds: wp.progress_seconds,
      updatedAt: wp.updated_at,
    };
  });

  return Response.json({ items });
}
