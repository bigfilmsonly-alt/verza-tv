/**
 * Content Performance System
 * Tracks per-show and per-episode metrics:
 * - Revenue, completion rate, watch time, drop-off points
 * - Enables future ranking modes: trending, most-watched, highest-revenue, most-completed
 *
 * Data sources:
 * - Supabase: purchases, entitlements, watch_progress, saved_list
 * - Stripe: revenue per series (via purchases table)
 */

import { getServiceClient } from "@/lib/supabase/server";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface ShowPerformance {
  slug: string;
  title: string;
  revenue_cents: number;
  unlocks: number;
  watch_sessions: number;
  completions: number;
  completion_rate: number;   // completions / watch_sessions
  saves: number;
  avg_episodes_watched: number;
}

export interface EpisodePerformance {
  series_slug: string;
  episode_number: number;
  watch_sessions: number;
  completions: number;
  completion_rate: number;
  drop_off_rate: number;    // 1 - (next_ep_sessions / this_ep_sessions)
}

export type RankingMode =
  | "trending"         // Most watch sessions in last 7 days
  | "most_watched"     // Total watch sessions all-time
  | "highest_revenue"  // Revenue from unlocks
  | "most_completed"   // Highest completion rate
  | "most_saved";      // Most saved to lists

/* ------------------------------------------------------------------ */
/*  Fetch show performance                                             */
/* ------------------------------------------------------------------ */

export async function getShowPerformance(
  options: { since?: string; limit?: number } = {},
): Promise<ShowPerformance[]> {
  const supabase = getServiceClient();
  const since = options.since || new Date(0).toISOString();
  const limit = options.limit || 50;

  const [purchasesRes, watchRes, entitlementsRes, savedRes] = await Promise.all([
    supabase
      .from("purchases")
      .select("amount_cents, metadata, type")
      .eq("status", "completed")
      .eq("type", "series_unlock")
      .gte("created_at", since),
    supabase
      .from("watch_progress")
      .select("series_slug, episode_number, completed")
      .gte("updated_at", since),
    supabase
      .from("entitlements")
      .select("series_slug")
      .gte("created_at", since),
    supabase
      .from("saved_list")
      .select("series_slug")
      .gte("created_at", since),
  ]);

  // Aggregate by series
  const shows: Record<string, {
    revenue: number;
    unlocks: number;
    sessions: number;
    completions: number;
    saves: number;
    episodes_watched: number[];
  }> = {};

  const ensure = (slug: string) => {
    if (!shows[slug]) {
      shows[slug] = { revenue: 0, unlocks: 0, sessions: 0, completions: 0, saves: 0, episodes_watched: [] };
    }
  };

  // Revenue
  for (const p of purchasesRes.data || []) {
    const slug = (p.metadata as Record<string, string>)?.seriesSlug ||
      (p.metadata as Record<string, Record<string, string>>)?.items?.seriesSlug;
    if (slug) {
      ensure(slug);
      shows[slug].revenue += p.amount_cents || 0;
    }
  }

  // Unlocks
  for (const e of entitlementsRes.data || []) {
    ensure(e.series_slug);
    shows[e.series_slug].unlocks++;
  }

  // Watch sessions + completions
  for (const w of watchRes.data || []) {
    ensure(w.series_slug);
    shows[w.series_slug].sessions++;
    if (w.completed) shows[w.series_slug].completions++;
    shows[w.series_slug].episodes_watched.push(w.episode_number);
  }

  // Saves
  for (const s of savedRes.data || []) {
    ensure(s.series_slug);
    shows[s.series_slug].saves++;
  }

  // Build output
  const result: ShowPerformance[] = Object.entries(shows)
    .map(([slug, data]) => ({
      slug,
      title: slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      revenue_cents: data.revenue,
      unlocks: data.unlocks,
      watch_sessions: data.sessions,
      completions: data.completions,
      completion_rate: data.sessions > 0 ? data.completions / data.sessions : 0,
      saves: data.saves,
      avg_episodes_watched: data.episodes_watched.length > 0
        ? new Set(data.episodes_watched).size / Math.max(new Set(data.episodes_watched.map(() => 1)).size, 1)
        : 0,
    }))
    .sort((a, b) => b.watch_sessions - a.watch_sessions)
    .slice(0, limit);

  return result;
}

/* ------------------------------------------------------------------ */
/*  Fetch episode performance for a specific series                    */
/* ------------------------------------------------------------------ */

export async function getEpisodePerformance(
  seriesSlug: string,
): Promise<EpisodePerformance[]> {
  const supabase = getServiceClient();

  const { data: watchData } = await supabase
    .from("watch_progress")
    .select("episode_number, completed")
    .eq("series_slug", seriesSlug);

  if (!watchData || watchData.length === 0) return [];

  // Aggregate by episode
  const episodes: Record<number, { sessions: number; completions: number }> = {};
  for (const w of watchData) {
    if (!episodes[w.episode_number]) {
      episodes[w.episode_number] = { sessions: 0, completions: 0 };
    }
    episodes[w.episode_number].sessions++;
    if (w.completed) episodes[w.episode_number].completions++;
  }

  const sorted = Object.entries(episodes)
    .map(([ep, data]) => ({ ep: Number(ep), ...data }))
    .sort((a, b) => a.ep - b.ep);

  return sorted.map((curr, i) => {
    const next = sorted[i + 1];
    const dropOff = next
      ? 1 - (next.sessions / Math.max(curr.sessions, 1))
      : 0;

    return {
      series_slug: seriesSlug,
      episode_number: curr.ep,
      watch_sessions: curr.sessions,
      completions: curr.completions,
      completion_rate: curr.sessions > 0 ? curr.completions / curr.sessions : 0,
      drop_off_rate: Math.max(0, dropOff),
    };
  });
}

/* ------------------------------------------------------------------ */
/*  Ranking helper                                                     */
/* ------------------------------------------------------------------ */

export function rankShows(
  shows: ShowPerformance[],
  mode: RankingMode,
): ShowPerformance[] {
  const sorted = [...shows];
  switch (mode) {
    case "trending":
    case "most_watched":
      return sorted.sort((a, b) => b.watch_sessions - a.watch_sessions);
    case "highest_revenue":
      return sorted.sort((a, b) => b.revenue_cents - a.revenue_cents);
    case "most_completed":
      return sorted.sort((a, b) => b.completion_rate - a.completion_rate);
    case "most_saved":
      return sorted.sort((a, b) => b.saves - a.saves);
    default:
      return sorted;
  }
}
