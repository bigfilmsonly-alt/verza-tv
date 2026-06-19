import { NextRequest } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

/**
 * POST /api/stripe/webhook
 * Handles Stripe webhook events for merch purchases and series unlocks.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const sig = req.headers.get("stripe-signature");

    if (!sig) {
      return Response.json({ error: "Missing stripe-signature" }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch (err) {
      console.error("[webhook] Signature verification failed:", err);
      return Response.json({ error: "Invalid signature" }, { status: 400 });
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const type = session.metadata?.type;

        if (type === "merch") {
          console.log("[webhook] Merch purchase completed:", {
            sessionId: session.id,
            amount: session.amount_total,
            email: session.customer_details?.email,
            items: session.metadata?.itemCount,
          });
          // TODO: record order in database, send confirmation email
        }

        if (type === "series_unlock") {
          console.log("[webhook] Series unlock completed:", {
            sessionId: session.id,
            seriesSlug: session.metadata?.seriesSlug,
            episodeCount: session.metadata?.episodeCount,
            email: session.customer_details?.email,
          });
          // TODO: create entitlement in database so episodes 6+ are unlocked
        }

        break;
      }

      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent;
        console.log("[webhook] Payment succeeded:", pi.id, pi.amount);
        break;
      }

      case "payment_intent.payment_failed": {
        const pi = event.data.object as Stripe.PaymentIntent;
        console.error("[webhook] Payment failed:", pi.id, pi.last_payment_error?.message);
        break;
      }

      default:
        console.log("[webhook] Unhandled event type:", event.type);
    }

    return Response.json({ received: true });
  } catch (err) {
    console.error("[webhook] Error:", err);
    return Response.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
