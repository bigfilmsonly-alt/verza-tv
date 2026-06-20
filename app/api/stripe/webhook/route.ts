import { NextRequest } from "next/server";
import Stripe from "stripe";
import { getServiceClient } from "@/lib/supabase/server";
import { sendPurchaseConfirmation } from "@/lib/email";

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

        // Send confirmation email
        if (email) {
          const amount = `$${((session.amount_total || 0) / 100).toFixed(2)}`;
          const name = session.customer_details?.name || email.split("@")[0];

          if (type === "series_unlock") {
            sendPurchaseConfirmation(email, name, "series_unlock", {
              seriesTitle: session.metadata?.seriesSlug?.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) || "Series",
              amount,
            }).catch((e) => console.error("[webhook] Email failed:", e));
          } else if (type === "merch") {
            sendPurchaseConfirmation(email, name, "merch", {
              amount,
              items: [session.metadata?.itemCount ? `${session.metadata.itemCount} item(s)` : "Merch order"],
            }).catch((e) => console.error("[webhook] Email failed:", e));
          }
        }

        break;
      }

      /* -------------------------------------------------------------- */
      /*  VIP Subscription — created / activated                         */
      /* -------------------------------------------------------------- */
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const status = sub.status; // active, trialing, past_due, canceled, etc.
        const isActive = status === "active" || status === "trialing";
        const customerId =
          typeof sub.customer === "string" ? sub.customer : sub.customer.id;

        // Resolve email from customer
        const customer = await stripe.customers.retrieve(customerId);
        const email =
          !("deleted" in customer && customer.deleted) ? customer.email : null;

        if (email) {
          const { data: users } = await supabase.auth.admin.listUsers();
          const user = users?.users?.find((u) => u.email === email);

          if (user) {
            const periodEnd = sub.items.data[0]?.current_period_end
              ? new Date(sub.items.data[0].current_period_end * 1000).toISOString()
              : null;

            const { error: profileErr } = await supabase
              .from("profiles")
              .update({
                is_vip: isActive,
                vip_expires_at: isActive ? periodEnd : null,
                stripe_customer_id: customerId,
                stripe_subscription_id: sub.id,
                updated_at: new Date().toISOString(),
              })
              .eq("id", user.id);

            if (profileErr) {
              console.error("[webhook] Failed to update VIP status:", profileErr);
            } else {
              console.log("[webhook] VIP status updated:", email, isActive ? "activated" : "deactivated");

              // Send VIP email to customer + team
              if (isActive) {
                const plan = sub.items.data[0]?.price?.recurring?.interval === "year" ? "Yearly ($79.99/yr)" : "Monthly ($9.99/mo)";
                sendPurchaseConfirmation(email, email.split("@")[0], "series_unlock", {
                  seriesTitle: `VIP Subscription — ${plan}`,
                  amount: plan.includes("79") ? "$79.99" : "$9.99",
                }).catch((e) => console.error("[webhook] VIP email failed:", e));
              }
            }
          } else {
            console.log("[webhook] No user found for customer email:", email);
          }
        }

        break;
      }

      /* -------------------------------------------------------------- */
      /*  VIP Subscription — deleted / canceled                          */
      /* -------------------------------------------------------------- */
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId =
          typeof sub.customer === "string" ? sub.customer : sub.customer.id;

        const customer = await stripe.customers.retrieve(customerId);
        const email =
          !("deleted" in customer && customer.deleted) ? customer.email : null;

        if (email) {
          const { data: users } = await supabase.auth.admin.listUsers();
          const user = users?.users?.find((u) => u.email === email);

          if (user) {
            const { error: profileErr } = await supabase
              .from("profiles")
              .update({
                is_vip: false,
                vip_expires_at: null,
                updated_at: new Date().toISOString(),
              })
              .eq("id", user.id);

            if (profileErr) {
              console.error("[webhook] Failed to remove VIP status:", profileErr);
            } else {
              console.log("[webhook] VIP removed for:", email);
            }
          }
        }

        break;
      }

      /* -------------------------------------------------------------- */
      /*  Invoice paid — renewal tracking                                */
      /* -------------------------------------------------------------- */
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;

        // Resolve subscription ID from parent (Stripe v22 structure)
        const subRef = invoice.parent?.subscription_details?.subscription;
        const subId =
          typeof subRef === "string" ? subRef : subRef?.id ?? null;

        // Only track subscription invoices (not one-time payments)
        if (subId) {
          const customerId =
            typeof invoice.customer === "string"
              ? invoice.customer
              : invoice.customer?.id ?? null;

          const email = invoice.customer_email;
          console.log(
            "[webhook] Subscription invoice paid:",
            subId,
            email,
            `$${((invoice.amount_paid || 0) / 100).toFixed(2)}`,
          );

          // Record in purchases table for history
          if (customerId) {
            await supabase.from("purchases").insert({
              stripe_session_id: invoice.id,
              type: "vip_renewal",
              amount_cents: invoice.amount_paid || 0,
              currency: invoice.currency || "usd",
              status: "completed",
              metadata: {
                email,
                subscription_id: subId,
                period_end: invoice.lines?.data?.[0]?.period?.end
                  ? new Date(
                      invoice.lines.data[0].period.end * 1000,
                    ).toISOString()
                  : null,
              },
            });
          }
        }

        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        console.error(
          "[webhook] Invoice payment failed:",
          invoice.id,
          invoice.customer_email,
        );
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
