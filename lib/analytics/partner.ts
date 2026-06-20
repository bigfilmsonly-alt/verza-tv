/**
 * Partner Portal Foundation
 * Architecture for partner accounts, dashboards, and revenue sharing.
 *
 * BUSINESS DECISION REQUIRED (Alan):
 * How is VIP subscription ($9.99/mo) revenue attributed to individual
 * titles for partner reporting?
 * Options:
 *   A) By watch time (proportional to minutes watched)
 *   B) By unlocks (number of series unlocked)
 *   C) Equal split across all watched series
 *   D) Custom rule
 *
 * This module defines the data model and API structure.
 * Live payout and revenue sharing are NOT implemented.
 */

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface Partner {
  id: string;
  name: string;
  email: string;
  company?: string;
  /** Series slugs this partner owns/produced */
  seriesSlugs: string[];
  /** Revenue share percentage (0-100) */
  revenueSharePercent: number;
  /** Status */
  status: "active" | "pending" | "inactive";
  createdAt: string;
}

export interface PartnerDashboardData {
  partner: Partner;
  period: { start: string; end: string };
  revenue: {
    /** Direct series unlock revenue (partner's share) */
    directRevenueCents: number;
    /** Attributed VIP subscription revenue (pending attribution rule) */
    subscriptionRevenueCents: number;
    totalCents: number;
  };
  content: {
    totalSeries: number;
    totalEpisodes: number;
    watchSessions: number;
    completions: number;
    completionRate: number;
    unlocks: number;
  };
  topEpisodes: {
    seriesSlug: string;
    episodeNumber: number;
    sessions: number;
  }[];
}

export type AttributionRule = "watch_time" | "unlocks" | "equal_split" | "custom";

/* ------------------------------------------------------------------ */
/*  Attribution (PLACEHOLDER — awaiting Alan's decision)               */
/* ------------------------------------------------------------------ */

/**
 * Calculate a partner's share of VIP subscription revenue.
 * Currently returns 0 until the attribution rule is decided.
 */
export function calculateSubscriptionAttribution(
  _rule: AttributionRule,
  _partnerSlugs: string[],
  _totalVipRevenueCents: number,
  _watchData: { series_slug: string; seconds: number }[],
): number {
  // PLACEHOLDER: Returns 0 until business rule is decided
  // When Alan decides, implement the chosen attribution method here
  return 0;
}

/* ------------------------------------------------------------------ */
/*  Partner data builder                                               */
/* ------------------------------------------------------------------ */

/**
 * Build dashboard data for a specific partner.
 * Uses the same Supabase queries as the admin dashboard but filtered
 * to the partner's series.
 */
export async function buildPartnerDashboard(
  partner: Partner,
  startDate: string,
  endDate: string,
): Promise<PartnerDashboardData> {
  const { getServiceClient } = await import("@/lib/supabase/server");
  const supabase = getServiceClient();

  const [purchasesRes, watchRes, entitlementsRes] = await Promise.all([
    supabase
      .from("purchases")
      .select("amount_cents, metadata, type")
      .eq("status", "completed")
      .eq("type", "series_unlock")
      .gte("created_at", startDate),
    supabase
      .from("watch_progress")
      .select("series_slug, episode_number, completed")
      .in("series_slug", partner.seriesSlugs)
      .gte("updated_at", startDate),
    supabase
      .from("entitlements")
      .select("series_slug")
      .in("series_slug", partner.seriesSlugs)
      .gte("created_at", startDate),
  ]);

  // Direct revenue from partner's series
  const partnerPurchases = (purchasesRes.data || []).filter((p) => {
    const slug = (p.metadata as Record<string, string>)?.seriesSlug;
    return slug && partner.seriesSlugs.includes(slug);
  });
  const directRevenue = partnerPurchases.reduce(
    (sum, p) => sum + (p.amount_cents || 0),
    0,
  );
  const partnerShare = Math.round(
    directRevenue * (partner.revenueSharePercent / 100),
  );

  // Watch data
  const watchData = watchRes.data || [];
  const completions = watchData.filter((w) => w.completed).length;

  // Top episodes
  const epSessions: Record<string, number> = {};
  for (const w of watchData) {
    const key = `${w.series_slug}:${w.episode_number}`;
    epSessions[key] = (epSessions[key] || 0) + 1;
  }
  const topEpisodes = Object.entries(epSessions)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([key, sessions]) => {
      const [seriesSlug, ep] = key.split(":");
      return { seriesSlug, episodeNumber: Number(ep), sessions };
    });

  return {
    partner,
    period: { start: startDate, end: endDate },
    revenue: {
      directRevenueCents: partnerShare,
      subscriptionRevenueCents: 0, // Awaiting attribution rule
      totalCents: partnerShare,
    },
    content: {
      totalSeries: partner.seriesSlugs.length,
      totalEpisodes: 0, // Would sum from catalog
      watchSessions: watchData.length,
      completions,
      completionRate: watchData.length > 0 ? completions / watchData.length : 0,
      unlocks: (entitlementsRes.data || []).length,
    },
    topEpisodes,
  };
}
