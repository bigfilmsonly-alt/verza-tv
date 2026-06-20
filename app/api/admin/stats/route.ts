import { NextRequest } from "next/server";
import Stripe from "stripe";
import { getServiceClient } from "@/lib/supabase/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Admin emails that can access the dashboard
const ADMIN_EMAILS = [
  "jotham@bigfilms.tv",
  "alan@verzatv.com",
  "jothamhall@gmail.com",
];

/**
 * GET /api/admin/stats
 * Returns aggregated analytics for the executive dashboard.
 * Protected: only admin emails can access.
 */
export async function GET(req: NextRequest) {
  const supabase = getServiceClient();

  // Auth check — verify user is admin
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = authHeader.slice(7);
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser(token);

  if (authErr || !user || !ADMIN_EMAILS.includes(user.email ?? "")) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const range = req.nextUrl.searchParams.get("range") || "30d";
  const daysBack = range === "7d" ? 7 : range === "90d" ? 90 : range === "all" ? 365 : 30;
  const since = new Date();
  since.setDate(since.getDate() - daysBack);
  const sinceISO = since.toISOString();

  try {
    // Run all queries in parallel
    const [
      purchasesResult,
      usersResult,
      vipResult,
      entitlementsResult,
      watchResult,
      savedResult,
      stripeBalance,
      stripeCharges,
    ] = await Promise.all([
      // Purchases
      supabase
        .from("purchases")
        .select("id, type, amount_cents, currency, status, created_at, metadata")
        .gte("created_at", sinceISO)
        .order("created_at", { ascending: false }),

      // Total users
      supabase.auth.admin.listUsers({ perPage: 1000 }),

      // VIP subscribers
      supabase
        .from("profiles")
        .select("id, is_vip, vip_expires_at, created_at")
        .eq("is_vip", true),

      // Entitlements (series unlocks)
      supabase
        .from("entitlements")
        .select("id, series_slug, created_at")
        .gte("created_at", sinceISO),

      // Watch progress (engagement)
      supabase
        .from("watch_progress")
        .select("id, series_slug, episode_number, progress, updated_at")
        .gte("updated_at", sinceISO),

      // Saved list
      supabase
        .from("saved_list")
        .select("id, series_slug, created_at")
        .gte("created_at", sinceISO),

      // Stripe balance
      stripe.balance.retrieve().catch(() => null),

      // Recent Stripe charges for revenue timeline
      stripe.charges.list({
        created: { gte: Math.floor(since.getTime() / 1000) },
        limit: 100,
      }).catch(() => null),
    ]);

    // Process purchases
    const purchases = purchasesResult.data || [];
    const totalRevenueCents = purchases
      .filter((p) => p.status === "completed")
      .reduce((sum, p) => sum + (p.amount_cents || 0), 0);

    const purchasesByType: Record<string, { count: number; revenue: number }> = {};
    for (const p of purchases) {
      const t = p.type || "other";
      if (!purchasesByType[t]) purchasesByType[t] = { count: 0, revenue: 0 };
      purchasesByType[t].count++;
      if (p.status === "completed") purchasesByType[t].revenue += p.amount_cents || 0;
    }

    // Revenue by day
    const revenueByDay: Record<string, number> = {};
    for (const p of purchases.filter((p) => p.status === "completed")) {
      const day = p.created_at?.slice(0, 10) || "unknown";
      revenueByDay[day] = (revenueByDay[day] || 0) + (p.amount_cents || 0);
    }

    // Process users
    const allUsers = usersResult.data?.users || [];
    const totalUsers = allUsers.length;
    const newUsers = allUsers.filter(
      (u) => u.created_at && new Date(u.created_at) >= since
    ).length;

    // Process VIP
    const activeVips = (vipResult.data || []).length;

    // Process entitlements
    const entitlements = entitlementsResult.data || [];
    const seriesUnlocksBySlug: Record<string, number> = {};
    for (const e of entitlements) {
      seriesUnlocksBySlug[e.series_slug] = (seriesUnlocksBySlug[e.series_slug] || 0) + 1;
    }

    // Process watch engagement
    const watchEntries = watchResult.data || [];
    const uniqueWatchers = new Set(watchEntries.map((w) => w.id)).size;
    const watchBySeriesSlug: Record<string, number> = {};
    for (const w of watchEntries) {
      watchBySeriesSlug[w.series_slug] = (watchBySeriesSlug[w.series_slug] || 0) + 1;
    }

    // Process saved list
    const savedEntries = savedResult.data || [];
    const savedBySlug: Record<string, number> = {};
    for (const s of savedEntries) {
      savedBySlug[s.series_slug] = (savedBySlug[s.series_slug] || 0) + 1;
    }

    // Stripe balance
    const stripeAvailable = stripeBalance?.available?.reduce(
      (sum, b) => sum + b.amount,
      0,
    ) ?? 0;
    const stripePending = stripeBalance?.pending?.reduce(
      (sum, b) => sum + b.amount,
      0,
    ) ?? 0;

    // Top series by revenue (from purchases metadata)
    const topSeriesByRevenue: Record<string, number> = {};
    for (const p of purchases.filter((p) => p.status === "completed" && p.type === "series_unlock")) {
      const slug =
        (p.metadata as Record<string, string>)?.seriesSlug ||
        (p.metadata as Record<string, Record<string, string>>)?.items?.seriesSlug ||
        "unknown";
      topSeriesByRevenue[slug] = (topSeriesByRevenue[slug] || 0) + (p.amount_cents || 0);
    }

    // Revenue from Stripe charges timeline
    const chargeTimeline: { date: string; amount: number; count: number }[] = [];
    if (stripeCharges?.data) {
      const byDay: Record<string, { amount: number; count: number }> = {};
      for (const c of stripeCharges.data) {
        if (c.status !== "succeeded") continue;
        const day = new Date(c.created * 1000).toISOString().slice(0, 10);
        if (!byDay[day]) byDay[day] = { amount: 0, count: 0 };
        byDay[day].amount += c.amount;
        byDay[day].count++;
      }
      for (const [date, data] of Object.entries(byDay).sort()) {
        chargeTimeline.push({ date, ...data });
      }
    }

    // Today / yesterday revenue
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const todayRevenue = revenueByDay[today] || 0;
    const yesterdayRevenue = revenueByDay[yesterday] || 0;

    // 7d / 30d revenue
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000).toISOString().slice(0, 10);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000).toISOString().slice(0, 10);
    let revenue7d = 0;
    let revenue30d = 0;
    for (const [day, cents] of Object.entries(revenueByDay)) {
      if (day >= sevenDaysAgo) revenue7d += cents;
      if (day >= thirtyDaysAgo) revenue30d += cents;
    }

    // MRR / ARR from active VIP subscriptions
    const vipMonthly = (vipResult.data || []).length; // each VIP = $9.99/mo average
    const mrrCents = vipMonthly * 999; // simplified: assume monthly rate
    const arrCents = mrrCents * 12;

    // AOV (average order value)
    const completedPurchases = purchases.filter((p) => p.status === "completed");
    const aovCents = completedPurchases.length > 0
      ? Math.round(totalRevenueCents / completedPurchases.length)
      : 0;

    // Conversion rate: purchasers / total users
    const conversionRate = totalUsers > 0
      ? Number(((completedPurchases.length / totalUsers) * 100).toFixed(2))
      : 0;

    // Refunds
    const refunds = purchases.filter((p) => p.status === "refunded");

    return Response.json({
      range,
      generatedAt: new Date().toISOString(),
      revenue: {
        totalCents: totalRevenueCents,
        todayCents: todayRevenue,
        yesterdayCents: yesterdayRevenue,
        last7dCents: revenue7d,
        last30dCents: revenue30d,
        mrrCents,
        arrCents,
        byType: purchasesByType,
        byDay: revenueByDay,
        stripeAvailableCents: stripeAvailable,
        stripePendingCents: stripePending,
        chargeTimeline,
      },
      purchases: {
        total: purchases.length,
        completed: completedPurchases.length,
        aovCents,
        conversionRate,
        refunds: refunds.length,
        recent: purchases.slice(0, 20).map((p) => ({
          id: p.id,
          type: p.type,
          amountCents: p.amount_cents,
          status: p.status,
          createdAt: p.created_at,
          email: (p.metadata as Record<string, string>)?.email || null,
        })),
      },
      users: {
        total: totalUsers,
        newInPeriod: newUsers,
        activeVips,
      },
      content: {
        seriesUnlocks: seriesUnlocksBySlug,
        topSeriesByRevenue,
        watchSessions: watchEntries.length,
        uniqueWatchers,
        watchBySeriesSlug,
        savedBySlug,
        totalSaved: savedEntries.length,
      },
    });
  } catch (err) {
    console.error("[admin/stats] Error:", err);
    return Response.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
