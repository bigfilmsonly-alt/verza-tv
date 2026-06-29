import { NextRequest } from "next/server";
import Stripe from "stripe";
import { getServiceClient } from "@/lib/supabase/server";
import { sendPurchaseConfirmation } from "@/lib/email";
import { emitServerEvent } from "@/lib/analytics";
import { persistEvent } from "@/lib/analytics/persist";

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
          const purchaseProps = {
            revenue_cents: session.amount_total || 0,
            currency: session.currency || "usd",
            purchase_type: type || "merch",
            plan_type: session.metadata?.plan_type as
              | "series_unlock"
              | "vip_monthly"
              | "vip_yearly"
              | undefined,
            show_id: session.metadata?.show_id || session.metadata?.seriesSlug,
            stripe_session_id: session.id,
            user_id: email || undefined,
          };
          emitServerEvent("purchase_completed", purchaseProps);
          // Server-verified revenue row in the event stream.
          await persistEvent("purchase_completed", purchaseProps);
        }

        // If series unlock, create entitlement
        if (type === "series_unlock" && session.metadata?.seriesSlug) {
          // Try to find user by stripe_customer_id on profiles table
          const stripeCustomer =
            typeof session.customer === "string" ? session.customer : (session.customer as { id: string } | null)?.id ?? null;

          let userId: string | null = null;

          if (stripeCustomer) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("id")
              .eq("stripe_customer_id", stripeCustomer)
              .maybeSingle();
            userId = profile?.id ?? null;
          }

          if (userId) {
            const { error: entErr } = await supabase
              .from("entitlements")
              .upsert({
                user_id: userId,
                series_slug: session.metadata.seriesSlug,
                purchase_id: purchase?.id,
              }, { onConflict: "user_id,series_slug" });

            if (entErr) {
              console.error("[webhook] Failed to create entitlement:", entErr);
            } else {
              console.log("[webhook] Entitlement created for", email, session.metadata.seriesSlug);
            }

            // Also add to saved list so it appears in My List
            const { error: saveErr } = await supabase
              .from("saved_list")
              .upsert({
                user_id: userId,
                series_slug: session.metadata.seriesSlug,
                created_at: new Date().toISOString(),
              }, { onConflict: "user_id,series_slug" });
            if (saveErr) console.error("[webhook] Failed to add to saved list:", saveErr);
            else console.log("[webhook] Added to saved list:", session.metadata?.seriesSlug);
          } else if (email) {
            // No user yet — store pending entitlement by email so it can be claimed on sign-up
            const { error: pendErr } = await supabase
              .from("pending_entitlements")
              .upsert({
                email: email.toLowerCase(),
                series_slug: session.metadata.seriesSlug,
                purchase_id: purchase?.id,
                created_at: new Date().toISOString(),
              }, { onConflict: "email,series_slug" });
            if (pendErr) {
              console.error("[webhook] Failed to store pending entitlement:", pendErr);
            } else {
              console.log("[webhook] Pending entitlement stored for", email, session.metadata.seriesSlug);
            }
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

        // Look up user by stripe_customer_id in profiles table
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .maybeSingle();
        const userId = profile?.id ?? null;

        if (userId) {
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
            .eq("id", userId);

          if (profileErr) {
            console.error("[webhook] Failed to update VIP status:", profileErr);
          } else {
            console.log("[webhook] VIP status updated:", email, isActive ? "activated" : "deactivated");
            const planType =
              sub.items.data[0]?.price?.recurring?.interval === "year" ? "vip_yearly" : "vip_monthly";
            if (isActive) {
              // Activation logged here; the revenue-bearing subscription_started
              // row is written from invoice.payment_succeeded so the dollar
              // amount is Stripe-verified and never double-counted.
              emitServerEvent("subscription_started", { user_id: userId, plan_type: planType, stripe_session_id: sub.id });
            } else {
              const subProps = { user_id: userId, plan_type: planType, stripe_session_id: sub.id } as const;
              emitServerEvent("subscription_cancelled", subProps);
              await persistEvent("subscription_cancelled", subProps);
            }

            // Send VIP email to customer + team
            if (isActive) {
              const plan = sub.items.data[0]?.price?.recurring?.interval === "year" ? "Yearly ($79.99/yr)" : "Monthly ($9.99/mo)";
              sendPurchaseConfirmation(email!, email!.split("@")[0], "series_unlock", {
                seriesTitle: `VIP Subscription — ${plan}`,
                amount: plan.includes("79") ? "$79.99" : "$9.99",
              }).catch((e) => console.error("[webhook] VIP email failed:", e));
            }
          }
        } else {
          console.log("[webhook] No profile found for stripe customer:", customerId, email);
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

        // Look up user by stripe_customer_id in profiles table
        const { data: delProfile } = await supabase
          .from("profiles")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .maybeSingle();
        const delUserId = delProfile?.id ?? null;

        if (delUserId) {
          const { error: profileErr } = await supabase
            .from("profiles")
            .update({
              is_vip: false,
              vip_expires_at: null,
              updated_at: new Date().toISOString(),
            })
            .eq("id", delUserId);

          if (profileErr) {
            console.error("[webhook] Failed to remove VIP status:", profileErr);
          } else {
            console.log("[webhook] VIP removed for:", email);
          }
        } else {
          console.log("[webhook] No profile found for stripe customer (delete):", customerId, email);
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

          // Server-verified subscription revenue row. The paid invoice is the
          // single source of truth for VIP dollars (the subscription.created
          // event is logged without revenue to avoid double-counting).
          // billing_reason distinguishes first purchase from renewal.
          const isFirstPayment = invoice.billing_reason === "subscription_create";
          const subEvent = isFirstPayment ? "subscription_started" : "subscription_renewed";
          // $79.99/yr vs $9.99/mo — infer plan from the verified amount.
          const planType = (invoice.amount_paid || 0) >= 5000 ? "vip_yearly" : "vip_monthly";

          let invUserId: string | null = null;
          if (customerId) {
            const { data: invProfile } = await supabase
              .from("profiles")
              .select("id")
              .eq("stripe_customer_id", customerId)
              .maybeSingle();
            invUserId = invProfile?.id ?? null;
          }

          const subRevenueProps = {
            revenue_cents: invoice.amount_paid || 0,
            currency: invoice.currency || "usd",
            plan_type: planType as "vip_monthly" | "vip_yearly",
            stripe_session_id: subId,
            user_id: invUserId || email || undefined,
          };
          emitServerEvent(subEvent, subRevenueProps);
          await persistEvent(subEvent, subRevenueProps);
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

      /* -------------------------------------------------------------- */
      /*  Refunds — negative revenue so net stays accurate               */
      /* -------------------------------------------------------------- */
      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const refundedCents = charge.amount_refunded || 0;
        if (refundedCents > 0) {
          const customerId =
            typeof charge.customer === "string" ? charge.customer : charge.customer?.id ?? null;
          const refundProps = {
            revenue_cents: -refundedCents, // negative — reduces net revenue
            currency: charge.currency || "usd",
            stripe_session_id: charge.payment_intent
              ? (typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent.id)
              : charge.id,
            user_id: charge.billing_details?.email || customerId || undefined,
          };
          emitServerEvent("refund", refundProps);
          await persistEvent("refund", refundProps);
          console.log("[webhook] Refund recorded:", charge.id, `-$${(refundedCents / 100).toFixed(2)}`);
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
