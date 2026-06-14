// TODO: wire to Supabase + Stripe in production
// import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/coins/balance
 *
 * Returns the authenticated user's current coin balance.
 * In production this reads from profiles.coin_balance via Supabase.
 */
export async function GET() {
  try {
    // --- Auth check (stubbed) ---
    // TODO: wire to Supabase + Stripe in production
    // const supabase = await createClient();
    // const { data: { user } } = await supabase.auth.getUser();
    const user = null as { id: string } | null;

    if (!user) {
      return Response.json(
        { balance: 0, userId: null },
        { status: 200 },
      );
    }

    // --- Production flow (stubbed) ---
    // TODO: wire to Supabase + Stripe in production
    // const { data: profile } = await supabase
    //   .from("profiles")
    //   .select("coin_balance")
    //   .eq("id", user.id)
    //   .single();

    return Response.json({
      balance: 0,
      userId: user?.id ?? null,
    });
  } catch (err) {
    console.error("[coins/balance] Error:", err);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
