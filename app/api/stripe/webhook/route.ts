import { NextRequest } from "next/server";
import Stripe from "stripe";
import { getServiceClient } from "@/lib/supabase/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

/**
 * POST /api/stripe/webhook
 * Handles Stripe webhook events — writes purchases + entitlements to Supabase.
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

    const supabase = getServiceClient();

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const type = session.metadata?.type;
        const email = session.customer_details?.email;

        // Record purchase in database
        const { data: purchase, error: purchaseErr } = await supabase
          .from("purchases")
          .insert({
            stripe_session_id: session.id,
            stripe_payment_intent: typeof session.payment_intent === "string" ? session.payment_intent : null,
            type: type || "merch",
            series_slug: session.metadata?.seriesSlug || null,
            amount_cents: session.amount_total || 0,
            currency: session.currency || "usd",
            status: "completed",
            metadata: { email, items: session.metadata },
          })
          .select("id")
          .single();

        if (purchaseErr) {
          console.error("[webhook] Failed to record purchase:", purchaseErr);
        } else {
          console.log("[webhook] Purchase recorded:", purchase?.id);
        }

        // If series unlock, create entitlement
        if (type === "series_unlock" && session.metadata?.seriesSlug) {
          // Try to find user by email
          const { data: users } = await supabase.auth.admin.listUsers();
          const user = users?.users?.find((u) => u.email === email);

          if (user) {
            const { error: entErr } = await supabase
              .from("entitlements")
              .upsert({
                user_id: user.id,
                series_slug: session.metadata.seriesSlug,
                purchase_id: purchase?.id,
              }, { onConflict: "user_id,series_slug" });

            if (entErr) {
              console.error("[webhook] Failed to create entitlement:", entErr);
            } else {
              console.log("[webhook] Entitlement created for", email, session.metadata.seriesSlug);
            }
          } else {
            console.log("[webhook] No user found for email", email, "— entitlement pending");
          }
        }

        if (type === "merch") {
          console.log("[webhook] Merch purchase completed:", {
            sessionId: session.id,
            amount: session.amount_total,
            email,
          });
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
