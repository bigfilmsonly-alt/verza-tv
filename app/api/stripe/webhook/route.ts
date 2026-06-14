import { NextRequest } from "next/server";
import { COIN_PACKS } from "@/lib/config";

// TODO: wire to Supabase + Stripe in production
// import Stripe from "stripe";
// import { createServiceClient } from "@/lib/supabase/admin";
// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
// const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

/**
 * POST /api/stripe/webhook
 *
 * Stripe webhook handler. Validates the webhook signature, then
 * routes events to the appropriate handler.
 *
 * Handled events:
 *   - payment_intent.succeeded  -> credit coins to user
 *   - checkout.session.completed -> fulfill merch order
 *
 * IMPORTANT: This route must NOT be behind auth middleware.
 * Stripe sends webhooks directly; they are verified by signature.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      return Response.json(
        { error: "Missing stripe-signature header" },
        { status: 400 },
      );
    }

    // --- Signature verification (stubbed) ---
    // TODO: wire to Supabase + Stripe in production
    // let event: Stripe.Event;
    // try {
    //   event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    // } catch (err) {
    //   console.error("[stripe/webhook] Signature verification failed:", err);
    //   return Response.json({ error: "Invalid signature" }, { status: 400 });
    // }

    // For now, parse the body as JSON to inspect the event type
    let event: { type: string; data: { object: Record<string, unknown> } };
    try {
      event = JSON.parse(body);
    } catch {
      return Response.json(
        { error: "Invalid JSON body" },
        { status: 400 },
      );
    }

    // --- Route events ---
    switch (event.type) {
      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(event.data.object);
        break;

      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event.data.object);
        break;

      default:
        // Unhandled event type -- acknowledge receipt
        console.log(`[stripe/webhook] Unhandled event type: ${event.type}`);
    }

    return Response.json({ received: true });
  } catch (err) {
    console.error("[stripe/webhook] Error:", err);
    return Response.json(
      { error: "Webhook handler failed" },
      { status: 500 },
    );
  }
}

/**
 * Handle payment_intent.succeeded -- credit coins to user.
 *
 * In production:
 * 1. Read metadata.userId and metadata.packId from the PaymentIntent
 * 2. Look up the coin pack to determine coins + bonus
 * 3. Use a Supabase service-role client to:
 *    a. UPDATE profiles SET coin_balance = coin_balance + totalCoins
 *    b. INSERT into coin_ledger (amount, reason='purchase', ...)
 *    c. UPDATE purchases SET status='completed' WHERE provider_id = paymentIntent.id
 */
async function handlePaymentIntentSucceeded(
  paymentIntent: Record<string, unknown>,
) {
  // TODO: wire to Supabase + Stripe in production
  // const supabase = createServiceClient();

  const metadata = paymentIntent.metadata as
    | { userId?: string; packId?: string; coinsTotal?: string }
    | undefined;

  if (!metadata?.userId || !metadata?.packId) {
    console.warn(
      "[stripe/webhook] payment_intent.succeeded missing metadata:",
      paymentIntent.id,
    );
    return;
  }

  const pack = COIN_PACKS.find((p) => p.id === metadata.packId);
  if (!pack) {
    console.error(
      `[stripe/webhook] Unknown pack ID in metadata: ${metadata.packId}`,
    );
    return;
  }

  const totalCoins = pack.coins + pack.bonus;

  console.log(
    `[stripe/webhook] STUB: Would credit ${totalCoins} coins to user ${metadata.userId} (pack: ${pack.label})`,
  );

  // TODO: wire to Supabase + Stripe in production
  // await supabase.rpc("credit_coins", {
  //   p_user_id: metadata.userId,
  //   p_amount: totalCoins,
  //   p_reason: "purchase",
  //   p_reference_id: paymentIntent.id as string,
  // });
  //
  // await supabase
  //   .from("purchases")
  //   .update({ status: "completed" })
  //   .eq("provider_id", paymentIntent.id);
}

/**
 * Handle checkout.session.completed -- fulfill merch order.
 *
 * In production:
 * 1. Read session metadata (orderId, userId, items)
 * 2. Mark the order as paid in the merch_orders table
 * 3. Trigger fulfillment (email confirmation, shipping label, etc.)
 */
async function handleCheckoutSessionCompleted(
  session: Record<string, unknown>,
) {
  // TODO: wire to Supabase + Stripe in production
  // const supabase = createServiceClient();

  const metadata = session.metadata as
    | { orderId?: string; userId?: string }
    | undefined;

  console.log(
    `[stripe/webhook] STUB: Would fulfill merch order ${metadata?.orderId ?? "unknown"} for user ${metadata?.userId ?? "unknown"}`,
  );

  // TODO: wire to Supabase + Stripe in production
  // await supabase
  //   .from("merch_orders")
  //   .update({ status: "paid", paid_at: new Date().toISOString() })
  //   .eq("id", metadata?.orderId);
}
