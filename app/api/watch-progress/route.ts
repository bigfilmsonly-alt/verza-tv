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

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { seriesSlug, episodeNumber, progressSeconds, completed } = body as Record<string, unknown>;

  // --- Input validation ---
  if (typeof seriesSlug !== "string" || !seriesSlug) {
    return Response.json({ error: "seriesSlug must be a non-empty string" }, { status: 400 });
  }
  if (seriesSlug.length > 100) {
    return Response.json({ error: "seriesSlug must be at most 100 characters" }, { status: 400 });
  }
  if (!/^[a-z0-9-]+$/.test(seriesSlug)) {
    return Response.json({ error: "seriesSlug must contain only lowercase letters, digits, and hyphens" }, { status: 400 });
  }

  if (typeof episodeNumber !== "number" || !Number.isInteger(episodeNumber) || episodeNumber < 1 || episodeNumber > 999) {
    return Response.json({ error: "episodeNumber must be an integer between 1 and 999" }, { status: 400 });
  }

  if (progressSeconds !== undefined && progressSeconds !== null) {
    if (typeof progressSeconds !== "number" || !Number.isFinite(progressSeconds) || progressSeconds < 0 || progressSeconds > 36000) {
      return Response.json({ error: "progressSeconds must be a number between 0 and 36000" }, { status: 400 });
    }
  }

  if (completed !== undefined && completed !== null) {
    if (typeof completed !== "boolean") {
      return Response.json({ error: "completed must be a boolean" }, { status: 400 });
    }
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
