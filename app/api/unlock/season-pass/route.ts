import { NextRequest } from "next/server";
import { getSeriesBySlug } from "@/lib/catalog";

// TODO: wire to Supabase + Stripe in production
// import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/unlock/season-pass
 *
 * Purchases a season pass for an entire series using coins.
 * Debits the seasonPassCoins amount and creates an entitlement
 * with episode_number = null (unlocks all episodes).
 *
 * Body: { seriesSlug: string }
 */
export async function POST(req: NextRequest) {
  try {
    // --- Auth check (stubbed) ---
    // TODO: wire to Supabase + Stripe in production
    // const supabase = await createClient();
    // const { data: { user } } = await supabase.auth.getUser();
    const user = null as { id: string } | null;

    if (!user) {
      return Response.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    // --- Parse & validate body ---
    const body = await req.json();
    const { seriesSlug } = body as { seriesSlug: string };

    if (!seriesSlug) {
      return Response.json(
        { error: "Missing required field: seriesSlug" },
        { status: 400 },
      );
    }

    // --- Validate series exists ---
    const series = getSeriesBySlug(seriesSlug);
    if (!series) {
      return Response.json(
        { error: `Series not found: "${seriesSlug}"` },
        { status: 400 },
      );
    }

    if (series.status === "coming_soon") {
      return Response.json(
        { error: `"${series.title}" is not yet available for purchase` },
        { status: 400 },
      );
    }

    const cost = series.seasonPassCoins;

    if (cost <= 0) {
      return Response.json(
        { error: `Season pass is not available for "${series.title}"` },
        { status: 400 },
      );
    }

    // --- Check coin balance (stubbed) ---
    // TODO: wire to Supabase + Stripe in production
    // const { data: profile } = await supabase
    //   .from("profiles")
    //   .select("coin_balance")
    //   .eq("id", user.id)
    //   .single();
    const coinBalance = 0; // stubbed

    if (coinBalance < cost) {
      return Response.json(
        {
          error: "Insufficient coin balance",
          required: cost,
          current: coinBalance,
          deficit: cost - coinBalance,
        },
        { status: 402 },
      );
    }

    // --- Production flow (stubbed) ---
    // In production this would (inside a transaction):
    // 1. Check user doesn't already own a season pass for this series
    // 2. UPDATE profiles SET coin_balance = coin_balance - cost WHERE id = user.id AND coin_balance >= cost
    // 3. INSERT into coin_ledger (user_id, amount=-cost, reason='season_pass', reference_id=seriesSlug, balance_after=newBalance)
    // 4. INSERT into entitlements (user_id, series_slug, episode_number=NULL)
    //    episode_number=NULL signifies full season pass

    // TODO: wire to Supabase + Stripe in production
    // await supabase.rpc("purchase_season_pass", {
    //   p_user_id: user.id,
    //   p_series_slug: seriesSlug,
    //   p_cost: cost,
    // });

    return Response.json({
      success: true,
      stub: true,
      message: "Season pass purchase stubbed -- Supabase integration pending",
      seasonPass: {
        seriesSlug,
        seriesTitle: series.title,
        episodeCount: series.episodeCount,
        coinCost: cost,
        balanceBefore: coinBalance,
        balanceAfter: coinBalance - cost,
      },
    });
  } catch (err) {
    console.error("[unlock/season-pass] Error:", err);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
