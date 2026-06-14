import { NextRequest } from "next/server";
import { getSeriesBySlug, getEpisode } from "@/lib/catalog";
import { FREE_EPISODES } from "@/lib/config";

// TODO: wire to Supabase + Stripe in production
// import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/unlock
 *
 * Unlocks a single episode using coins.
 * Checks the user's balance, debits coins, and creates an entitlement row.
 *
 * Body: { seriesSlug: string, episodeNumber: number }
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
    const { seriesSlug, episodeNumber } = body as {
      seriesSlug: string;
      episodeNumber: number;
    };

    if (!seriesSlug || episodeNumber == null) {
      return Response.json(
        { error: "Missing required fields: seriesSlug, episodeNumber" },
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

    // --- Validate episode exists ---
    const episode = getEpisode(seriesSlug, episodeNumber);
    if (!episode) {
      return Response.json(
        { error: `Episode ${episodeNumber} not found in "${series.title}"` },
        { status: 400 },
      );
    }

    // --- Check if episode is already free ---
    if (episodeNumber <= FREE_EPISODES) {
      return Response.json(
        { error: `Episode ${episodeNumber} is free and does not require unlocking` },
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

    const cost = series.coinPerEpisode;

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
    // 1. UPDATE profiles SET coin_balance = coin_balance - cost WHERE id = user.id AND coin_balance >= cost
    // 2. INSERT into coin_ledger (user_id, amount=-cost, reason='unlock', reference_id=seriesSlug/episodeNumber, balance_after=newBalance)
    // 3. INSERT into entitlements (user_id, series_slug, episode_number)

    // TODO: wire to Supabase + Stripe in production
    // const newBalance = coinBalance - cost;
    // await supabase.rpc("unlock_episode", {
    //   p_user_id: user.id,
    //   p_series_slug: seriesSlug,
    //   p_episode_number: episodeNumber,
    //   p_cost: cost,
    // });

    return Response.json({
      success: true,
      stub: true,
      message: "Episode unlock stubbed -- Supabase integration pending",
      unlock: {
        seriesSlug,
        seriesTitle: series.title,
        episodeNumber,
        coinCost: cost,
        balanceBefore: coinBalance,
        balanceAfter: coinBalance - cost,
      },
    });
  } catch (err) {
    console.error("[unlock] Error:", err);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
