/**
 * Reporting Infrastructure
 * Builds daily/weekly/monthly reports from Stripe + Supabase data.
 * Architecture only — sending is NOT enabled until approved by Alan.
 *
 * Report types:
 * - Daily: revenue, new users, purchases, top shows
 * - Weekly: trends, growth %, conversion funnel, retention
 * - Monthly: full summary, MRR/ARR, content performance
 */

import { getServiceClient } from "@/lib/supabase/server";
import Stripe from "stripe";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface ReportData {
  period: "daily" | "weekly" | "monthly";
  startDate: string;
  endDate: string;
  revenue: {
    totalCents: number;
    previousPeriodCents: number;
    growthPercent: number;
    byType: Record<string, number>;
  };
  users: {
    total: number;
    new: number;
    activeVips: number;
  };
  purchases: {
    count: number;
    aovCents: number;
  };
  topShows: { slug: string; sessions: number }[];
  errors: ErrorEntry[];
}

export interface ErrorEntry {
  type: "failed_purchase" | "failed_login" | "playback_error" | "api_error";
  count: number;
  lastSeen: string;
}

export interface ReportRecipient {
  email: string;
  name: string;
  reports: ("daily" | "weekly" | "monthly")[];
}

/* ------------------------------------------------------------------ */
/*  Recipients (sending disabled until approved)                       */
/* ------------------------------------------------------------------ */

export const REPORT_RECIPIENTS: ReportRecipient[] = [
  { email: "alan@verzatv.com", name: "Alan Mruvka", reports: ["daily", "weekly", "monthly"] },
  { email: "jotham@bigfilms.tv", name: "Jotham Hall", reports: ["daily", "weekly", "monthly"] },
  { email: "jothamhall@gmail.com", name: "Jotham Hall", reports: ["daily", "weekly", "monthly"] },
];

/* ------------------------------------------------------------------ */
/*  Build report                                                       */
/* ------------------------------------------------------------------ */

export async function buildReport(
  period: "daily" | "weekly" | "monthly",
): Promise<ReportData> {
  const supabase = getServiceClient();
  const now = new Date();
  const daysBack = period === "daily" ? 1 : period === "weekly" ? 7 : 30;
  const prevDaysBack = daysBack * 2;

  const startDate = new Date(now.getTime() - daysBack * 86400000);
  const prevStartDate = new Date(now.getTime() - prevDaysBack * 86400000);

  // Current period purchases
  const { data: currentPurchases } = await supabase
    .from("purchases")
    .select("amount_cents, type, status")
    .gte("created_at", startDate.toISOString())
    .eq("status", "completed");

  // Previous period purchases (for growth calculation)
  const { data: prevPurchases } = await supabase
    .from("purchases")
    .select("amount_cents")
    .gte("created_at", prevStartDate.toISOString())
    .lt("created_at", startDate.toISOString())
    .eq("status", "completed");

  // Users
  const { data: users } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const allUsers = users?.users || [];
  const newUsers = allUsers.filter(
    (u) => u.created_at && new Date(u.created_at) >= startDate,
  ).length;

  // VIPs
  const { data: vips } = await supabase
    .from("profiles")
    .select("id")
    .eq("is_vip", true);

  // Watch sessions (top shows)
  const { data: watchData } = await supabase
    .from("watch_progress")
    .select("series_slug")
    .gte("updated_at", startDate.toISOString());

  // Aggregate
  const purchases = currentPurchases || [];
  const totalCents = purchases.reduce((sum, p) => sum + (p.amount_cents || 0), 0);
  const prevTotalCents = (prevPurchases || []).reduce((sum, p) => sum + (p.amount_cents || 0), 0);

  const byType: Record<string, number> = {};
  for (const p of purchases) {
    byType[p.type || "other"] = (byType[p.type || "other"] || 0) + (p.amount_cents || 0);
  }

  const showSessions: Record<string, number> = {};
  for (const w of watchData || []) {
    showSessions[w.series_slug] = (showSessions[w.series_slug] || 0) + 1;
  }

  const topShows = Object.entries(showSessions)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([slug, sessions]) => ({ slug, sessions }));

  return {
    period,
    startDate: startDate.toISOString().slice(0, 10),
    endDate: now.toISOString().slice(0, 10),
    revenue: {
      totalCents,
      previousPeriodCents: prevTotalCents,
      growthPercent: prevTotalCents > 0
        ? Number((((totalCents - prevTotalCents) / prevTotalCents) * 100).toFixed(1))
        : 0,
      byType,
    },
    users: {
      total: allUsers.length,
      new: newUsers,
      activeVips: (vips || []).length,
    },
    purchases: {
      count: purchases.length,
      aovCents: purchases.length > 0 ? Math.round(totalCents / purchases.length) : 0,
    },
    topShows,
    errors: [], // Populated by monitoring system
  };
}

/* ------------------------------------------------------------------ */
/*  Format report as text (for email body)                             */
/* ------------------------------------------------------------------ */

export function formatReportText(report: ReportData): string {
  const fmt = (cents: number) => `$${(cents / 100).toFixed(2)}`;
  const growth = report.revenue.growthPercent > 0
    ? `+${report.revenue.growthPercent}%`
    : `${report.revenue.growthPercent}%`;

  return `Verza TV ${report.period.toUpperCase()} Report
${report.startDate} — ${report.endDate}
${"=".repeat(40)}

REVENUE
  Total: ${fmt(report.revenue.totalCents)}
  Previous period: ${fmt(report.revenue.previousPeriodCents)}
  Growth: ${growth}
  ${Object.entries(report.revenue.byType).map(([t, c]) => `${t}: ${fmt(c)}`).join("\n  ")}

USERS
  Total: ${report.users.total}
  New: ${report.users.new}
  VIPs: ${report.users.activeVips}

PURCHASES
  Count: ${report.purchases.count}
  AOV: ${fmt(report.purchases.aovCents)}

TOP SHOWS
  ${report.topShows.map((s, i) => `${i + 1}. ${s.slug} (${s.sessions} sessions)`).join("\n  ")}
`;
}
