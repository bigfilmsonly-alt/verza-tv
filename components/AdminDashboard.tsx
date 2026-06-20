"use client";

import { useEffect, useState, useCallback } from "react";
import { createBrowserClient } from "@supabase/ssr";

const T = {
  bg: "#07070E",
  surface: "#12121C",
  raised: "#1A1A26",
  line: "rgba(255,255,255,.08)",
  text: "#F5F4F8",
  textDim: "#A0A0B0",
  textMute: "#6B6B7B",
  accent: "#E0115F",
  gold: "#F6C800",
  success: "#2ECC71",
};

interface Stats {
  range: string;
  generatedAt: string;
  revenue: {
    totalCents: number;
    byType: Record<string, { count: number; revenue: number }>;
    byDay: Record<string, number>;
    stripeAvailableCents: number;
    stripePendingCents: number;
    chargeTimeline: { date: string; amount: number; count: number }[];
  };
  purchases: {
    total: number;
    recent: {
      id: string;
      type: string;
      amountCents: number;
      status: string;
      createdAt: string;
      email: string | null;
    }[];
  };
  users: {
    total: number;
    newInPeriod: number;
    activeVips: number;
  };
  content: {
    seriesUnlocks: Record<string, number>;
    topSeriesByRevenue: Record<string, number>;
    watchSessions: number;
    uniqueWatchers: number;
    watchBySeriesSlug: Record<string, number>;
    savedBySlug: Record<string, number>;
    totalSaved: number;
  };
}

function fmt(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function fmtK(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

function slugToTitle(slug: string) {
  return slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/* ------------------------------------------------------------------ */
/*  Stat Card                                                          */
/* ------------------------------------------------------------------ */
function StatCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub?: string;
  color?: string;
}) {
  return (
    <div
      className="rounded-xl p-4 flex flex-col gap-1"
      style={{ background: T.surface, border: `1px solid ${T.line}` }}
    >
      <span className="text-xs font-medium" style={{ color: T.textMute }}>
        {label}
      </span>
      <span
        className="text-2xl font-bold"
        style={{ color: color || T.text }}
      >
        {value}
      </span>
      {sub && (
        <span className="text-xs" style={{ color: T.textDim }}>
          {sub}
        </span>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Mini Bar Chart                                                     */
/* ------------------------------------------------------------------ */
function BarChart({
  data,
  formatValue,
}: {
  data: { label: string; value: number }[];
  formatValue?: (v: number) => string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const fv = formatValue || ((v: number) => String(v));
  return (
    <div className="flex flex-col gap-1.5">
      {data.map((d) => (
        <div key={d.label} className="flex items-center gap-2">
          <span
            className="text-xs w-20 truncate text-right flex-shrink-0"
            style={{ color: T.textDim }}
          >
            {d.label}
          </span>
          <div className="flex-1 h-5 rounded-full overflow-hidden" style={{ background: T.raised }}>
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.max((d.value / max) * 100, 2)}%`,
                background: `linear-gradient(90deg, ${T.accent}, #8B5CF6)`,
              }}
            />
          </div>
          <span
            className="text-xs w-16 flex-shrink-0"
            style={{ color: T.text }}
          >
            {fv(d.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Revenue Timeline (sparkline-style)                                 */
/* ------------------------------------------------------------------ */
function Timeline({
  data,
}: {
  data: { date: string; amount: number; count: number }[];
}) {
  if (!data.length) {
    return (
      <p className="text-sm" style={{ color: T.textMute }}>
        No charges in this period
      </p>
    );
  }
  const max = Math.max(...data.map((d) => d.amount), 1);
  return (
    <div className="flex items-end gap-1" style={{ height: 80 }}>
      {data.map((d) => (
        <div
          key={d.date}
          className="flex-1 rounded-t group relative"
          style={{
            height: `${Math.max((d.amount / max) * 100, 4)}%`,
            background: `linear-gradient(180deg, ${T.accent}, #8B5CF680)`,
            minWidth: 4,
          }}
          title={`${d.date}: ${fmt(d.amount)} (${d.count} charges)`}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Dashboard                                                     */
/* ------------------------------------------------------------------ */
export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState("30d");

  const fetchStats = useCallback(async (r: string) => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      );
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setError("Not logged in. Sign in with an admin account.");
        setLoading(false);
        return;
      }

      const res = await fetch(`/api/admin/stats?range=${r}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || `Error ${res.status}`);
        setLoading(false);
        return;
      }

      setStats(await res.json());
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats(range);
  }, [range, fetchStats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: T.bg }}>
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-8 h-8 rounded-full border-2 animate-spin"
            style={{ borderColor: `${T.accent} transparent transparent transparent` }}
          />
          <span className="text-sm" style={{ color: T.textDim }}>
            Loading dashboard...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: T.bg }}>
        <div
          className="rounded-xl p-6 text-center max-w-md"
          style={{ background: T.surface, border: `1px solid ${T.accent}44` }}
        >
          <h2 className="text-lg font-bold mb-2" style={{ color: T.accent }}>
            Access Denied
          </h2>
          <p className="text-sm" style={{ color: T.textDim }}>
            {error}
          </p>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  // Derived data
  const topSeries = Object.entries(stats.content.topSeriesByRevenue)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([slug, cents]) => ({ label: slugToTitle(slug), value: cents }));

  const topWatched = Object.entries(stats.content.watchBySeriesSlug)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([slug, count]) => ({ label: slugToTitle(slug), value: count }));

  const topSaved = Object.entries(stats.content.savedBySlug)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([slug, count]) => ({ label: slugToTitle(slug), value: count }));

  const topUnlocks = Object.entries(stats.content.seriesUnlocks)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([slug, count]) => ({ label: slugToTitle(slug), value: count }));

  const revenueBreakdown = Object.entries(stats.revenue.byType).map(
    ([type, data]) => ({
      label: type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      value: data.revenue,
    })
  );

  return (
    <div className="min-h-screen px-4 py-6 max-w-5xl mx-auto" style={{ background: T.bg }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: T.text }}>
            Verza TV Dashboard
          </h1>
          <p className="text-xs" style={{ color: T.textMute }}>
            Updated {new Date(stats.generatedAt).toLocaleString()}
          </p>
        </div>

        {/* Range Selector */}
        <div className="flex gap-1.5">
          {(["7d", "30d", "90d", "all"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
              style={{
                background: range === r ? T.accent : T.surface,
                color: range === r ? "#fff" : T.textDim,
                border: `1px solid ${range === r ? T.accent : T.line}`,
              }}
            >
              {r === "all" ? "All" : r}
            </button>
          ))}
        </div>
      </div>

      {/* ---- KPI Cards ---- */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard
          label="Total Revenue"
          value={fmt(stats.revenue.totalCents)}
          sub={`${stats.purchases.total} transactions`}
          color={T.success}
        />
        <StatCard
          label="Stripe Balance"
          value={fmt(stats.revenue.stripeAvailableCents)}
          sub={`${fmt(stats.revenue.stripePendingCents)} pending`}
          color={T.gold}
        />
        <StatCard
          label="Total Users"
          value={fmtK(stats.users.total)}
          sub={`${stats.users.newInPeriod} new this period`}
        />
        <StatCard
          label="Active VIPs"
          value={String(stats.users.activeVips)}
          sub={`${((stats.users.activeVips / Math.max(stats.users.total, 1)) * 100).toFixed(1)}% conversion`}
          color={T.accent}
        />
      </div>

      {/* ---- Second Row KPIs ---- */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard
          label="Watch Sessions"
          value={fmtK(stats.content.watchSessions)}
          sub={`${stats.content.uniqueWatchers} unique viewers`}
        />
        <StatCard
          label="Series Unlocked"
          value={String(Object.values(stats.content.seriesUnlocks).reduce((a, b) => a + b, 0))}
          sub={`${Object.keys(stats.content.seriesUnlocks).length} unique series`}
        />
        <StatCard
          label="Saved to List"
          value={fmtK(stats.content.totalSaved)}
        />
        <StatCard
          label="Avg Revenue/User"
          value={fmt(
            stats.users.total > 0
              ? Math.round(stats.revenue.totalCents / stats.users.total)
              : 0,
          )}
          sub="ARPU"
        />
      </div>

      {/* ---- Revenue Timeline ---- */}
      <section
        className="rounded-xl p-4 mb-6"
        style={{ background: T.surface, border: `1px solid ${T.line}` }}
      >
        <h2 className="text-sm font-bold mb-3" style={{ color: T.text }}>
          Revenue Timeline (Stripe)
        </h2>
        <Timeline data={stats.revenue.chargeTimeline} />
        <div className="flex justify-between mt-2">
          <span className="text-xs" style={{ color: T.textMute }}>
            {stats.revenue.chargeTimeline[0]?.date || "—"}
          </span>
          <span className="text-xs" style={{ color: T.textMute }}>
            {stats.revenue.chargeTimeline[stats.revenue.chargeTimeline.length - 1]?.date || "—"}
          </span>
        </div>
      </section>

      {/* ---- Revenue Breakdown ---- */}
      {revenueBreakdown.length > 0 && (
        <section
          className="rounded-xl p-4 mb-6"
          style={{ background: T.surface, border: `1px solid ${T.line}` }}
        >
          <h2 className="text-sm font-bold mb-3" style={{ color: T.text }}>
            Revenue by Type
          </h2>
          <BarChart data={revenueBreakdown} formatValue={fmt} />
        </section>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {/* ---- Top Series by Revenue ---- */}
        {topSeries.length > 0 && (
          <section
            className="rounded-xl p-4"
            style={{ background: T.surface, border: `1px solid ${T.line}` }}
          >
            <h2 className="text-sm font-bold mb-3" style={{ color: T.text }}>
              Top Series by Revenue
            </h2>
            <BarChart data={topSeries} formatValue={fmt} />
          </section>
        )}

        {/* ---- Top Series by Watch Sessions ---- */}
        {topWatched.length > 0 && (
          <section
            className="rounded-xl p-4"
            style={{ background: T.surface, border: `1px solid ${T.line}` }}
          >
            <h2 className="text-sm font-bold mb-3" style={{ color: T.text }}>
              Most Watched Series
            </h2>
            <BarChart data={topWatched} />
          </section>
        )}

        {/* ---- Top Series Unlocked ---- */}
        {topUnlocks.length > 0 && (
          <section
            className="rounded-xl p-4"
            style={{ background: T.surface, border: `1px solid ${T.line}` }}
          >
            <h2 className="text-sm font-bold mb-3" style={{ color: T.text }}>
              Most Unlocked Series
            </h2>
            <BarChart data={topUnlocks} />
          </section>
        )}

        {/* ---- Most Saved ---- */}
        {topSaved.length > 0 && (
          <section
            className="rounded-xl p-4"
            style={{ background: T.surface, border: `1px solid ${T.line}` }}
          >
            <h2 className="text-sm font-bold mb-3" style={{ color: T.text }}>
              Most Saved to List
            </h2>
            <BarChart data={topSaved} />
          </section>
        )}
      </div>

      {/* ---- Recent Transactions ---- */}
      <section
        className="rounded-xl p-4 mb-6"
        style={{ background: T.surface, border: `1px solid ${T.line}` }}
      >
        <h2 className="text-sm font-bold mb-3" style={{ color: T.text }}>
          Recent Transactions
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ color: T.textDim }}>
            <thead>
              <tr
                className="text-xs text-left"
                style={{ color: T.textMute, borderBottom: `1px solid ${T.line}` }}
              >
                <th className="pb-2 pr-4">Date</th>
                <th className="pb-2 pr-4">Type</th>
                <th className="pb-2 pr-4">Email</th>
                <th className="pb-2 pr-4 text-right">Amount</th>
                <th className="pb-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {stats.purchases.recent.map((p) => (
                <tr
                  key={p.id}
                  className="border-t"
                  style={{ borderColor: T.line }}
                >
                  <td className="py-2 pr-4 whitespace-nowrap">
                    {new Date(p.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-2 pr-4">
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{
                        background:
                          p.type === "series_unlock"
                            ? `${T.accent}22`
                            : p.type === "vip_renewal"
                              ? `${T.gold}22`
                              : `${T.success}22`,
                        color:
                          p.type === "series_unlock"
                            ? T.accent
                            : p.type === "vip_renewal"
                              ? T.gold
                              : T.success,
                      }}
                    >
                      {p.type?.replace(/_/g, " ") || "other"}
                    </span>
                  </td>
                  <td className="py-2 pr-4 truncate max-w-[160px]">
                    {p.email || "—"}
                  </td>
                  <td className="py-2 pr-4 text-right font-medium" style={{ color: T.text }}>
                    {fmt(p.amountCents)}
                  </td>
                  <td className="py-2">
                    <span
                      className="text-xs"
                      style={{
                        color: p.status === "completed" ? T.success : T.gold,
                      }}
                    >
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
              {stats.purchases.recent.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="py-6 text-center"
                    style={{ color: T.textMute }}
                  >
                    No transactions in this period
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ---- Funnel ---- */}
      <section
        className="rounded-xl p-4 mb-8"
        style={{ background: T.surface, border: `1px solid ${T.line}` }}
      >
        <h2 className="text-sm font-bold mb-3" style={{ color: T.text }}>
          Conversion Funnel
        </h2>
        <div className="flex flex-col gap-2">
          {[
            {
              label: "Total Users",
              value: stats.users.total,
              pct: 100,
            },
            {
              label: "Active Watchers",
              value: stats.content.uniqueWatchers,
              pct:
                stats.users.total > 0
                  ? (stats.content.uniqueWatchers / stats.users.total) * 100
                  : 0,
            },
            {
              label: "Purchasers",
              value: stats.purchases.total,
              pct:
                stats.users.total > 0
                  ? (stats.purchases.total / stats.users.total) * 100
                  : 0,
            },
            {
              label: "VIP Subscribers",
              value: stats.users.activeVips,
              pct:
                stats.users.total > 0
                  ? (stats.users.activeVips / stats.users.total) * 100
                  : 0,
            },
          ].map((step, i) => (
            <div key={step.label} className="flex items-center gap-3">
              <span
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{ background: T.accent, color: "#fff" }}
              >
                {i + 1}
              </span>
              <div className="flex-1">
                <div className="flex justify-between mb-1">
                  <span className="text-xs" style={{ color: T.textDim }}>
                    {step.label}
                  </span>
                  <span className="text-xs font-medium" style={{ color: T.text }}>
                    {fmtK(step.value)} ({step.pct.toFixed(1)}%)
                  </span>
                </div>
                <div
                  className="h-2 rounded-full overflow-hidden"
                  style={{ background: T.raised }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.max(step.pct, 1)}%`,
                      background: `linear-gradient(90deg, ${T.accent}, #8B5CF6)`,
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
