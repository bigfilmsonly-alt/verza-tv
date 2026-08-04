import { NextRequest } from "next/server";
import { getUser } from "@/lib/auth";
import { getServiceClient } from "@/lib/supabase/server";
import { getSeriesBySlug } from "@/lib/catalog";
import { privateJson } from "@/lib/private-json";

/**
 * POST /api/watch-progress — save watch progress
 * Body: { seriesSlug, episodeNumber, progressSeconds, completed }
 */
export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) {
    return privateJson({ error: "Not signed in" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return privateJson({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { seriesSlug, episodeNumber, progressSeconds, completed } = body as Record<string, unknown>;

  // --- Input validation ---
  if (typeof seriesSlug !== "string" || !seriesSlug) {
    return privateJson({ error: "seriesSlug must be a non-empty string" }, { status: 400 });
  }
  if (seriesSlug.length > 100) {
    return privateJson({ error: "seriesSlug must be at most 100 characters" }, { status: 400 });
  }
  if (!/^[a-z0-9-]+$/.test(seriesSlug)) {
    return privateJson({ error: "seriesSlug must contain only lowercase letters, digits, and hyphens" }, { status: 400 });
  }

  if (typeof episodeNumber !== "number" || !Number.isInteger(episodeNumber) || episodeNumber < 1 || episodeNumber > 999) {
    return privateJson({ error: "episodeNumber must be an integer between 1 and 999" }, { status: 400 });
  }

  if (progressSeconds !== undefined && progressSeconds !== null) {
    if (typeof progressSeconds !== "number" || !Number.isFinite(progressSeconds) || progressSeconds < 0 || progressSeconds > 36000) {
      return privateJson({ error: "progressSeconds must be a number between 0 and 36000" }, { status: 400 });
    }
  }

  if (completed !== undefined && completed !== null) {
    if (typeof completed !== "boolean") {
      return privateJson({ error: "completed must be a boolean" }, { status: 400 });
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
    return privateJson({ error: "Failed to save" }, { status: 500 });
  }

  return privateJson({ saved: true });
}

/**
 * GET /api/watch-progress — get continue watching list
 */
export async function GET() {
  const user = await getUser();
  if (!user) {
    return privateJson({ items: [] });
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
    return privateJson({ items: [] });
  }

  // Enrich with series metadata; drop rows for series that no longer exist
  // (they rendered poster-less ghost cards linking to 404s).
  const items = (data ?? []).flatMap((wp) => {
    const series = getSeriesBySlug(wp.series_slug);
    if (!series || series.status !== "live") return [];
    return [{
      seriesSlug: wp.series_slug,
      seriesTitle: series.title,
      posterUrl: series.posterUrl,
      episodeNumber: wp.episode_number,
      totalEpisodes: series.episodeCount,
      progressSeconds: wp.progress_seconds,
      updatedAt: wp.updated_at,
    }];
  });

  return privateJson({ items });
}
