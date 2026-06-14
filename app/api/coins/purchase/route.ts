import { NextRequest } from "next/server";
import { COIN_PACKS } from "@/lib/config";

// TODO: wire to Supabase + Stripe in production
// import { createClient } from "@/lib/supabase/server";
// import Stripe from "stripe";
// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

/**
 * POST /api/coins/purchase
 *
 * Handles coin pack purchases. In production this creates a Stripe
 * PaymentIntent and, on webhook confirmation, credits the user's
 * coin balance via the coin_ledger table.
 *
 * Body: { packId: string, paymentMethodId?: string }
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
    const { packId, paymentMethodId } = body as {
      packId: string;
      paymentMethodId?: string;
    };

    if (!packId) {
      return Response.json(
        { error: "Missing required field: packId" },
        { status: 400 },
      );
    }

    const pack = COIN_PACKS.find((p) => p.id === packId);
    if (!pack) {
      return Response.json(
        { error: `Invalid pack ID: "${packId}". Valid IDs: ${COIN_PACKS.map((p) => p.id).join(", ")}` },
        { status: 400 },
      );
    }

    // --- Production flow (stubbed) ---
    // In production this would:
    // 1. Create a Stripe PaymentIntent for pack.price cents
    // 2. If paymentMethodId is provided, attach it and confirm
    // 3. Return clientSecret so the client can complete payment
    // 4. On webhook (payment_intent.succeeded):
    //    a. INSERT into purchases (provider='stripe', product_type='coin_pack', ...)
    //    b. UPDATE profiles SET coin_balance = coin_balance + (pack.coins + pack.bonus)
    //    c. INSERT into coin_ledger (amount=coins+bonus, reason='purchase', ...)

    // TODO: wire to Supabase + Stripe in production
    // const paymentIntent = await stripe.paymentIntents.create({
    //   amount: pack.price,
    //   currency: "usd",
    //   payment_method: paymentMethodId,
    //   metadata: {
    //     userId: user.id,
    //     packId: pack.id,
    //     coinsTotal: String(pack.coins + pack.bonus),
    //   },
    // });

    const totalCoins = pack.coins + pack.bonus;

    return Response.json({
      success: true,
      stub: true,
      message: "Coin purchase stubbed -- Stripe integration pending",
      pack: {
        id: pack.id,
        label: pack.label,
        price: pack.price,
        coins: pack.coins,
        bonus: pack.bonus,
        totalCoins,
      },
      // clientSecret: paymentIntent.client_secret,
      paymentMethodProvided: !!paymentMethodId,
    });
  } catch (err) {
    console.error("[coins/purchase] Error:", err);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
