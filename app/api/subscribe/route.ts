import { NextRequest } from "next/server";
import Stripe from "stripe";
import { VIP_PLANS } from "@/lib/config";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

/**
 * POST /api/subscribe
 * Creates a Stripe Checkout session for a VIP subscription.
 * Body: { plan: "monthly" | "yearly" }
 */
export async function POST(req: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    // --- Input validation ---
    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      return Response.json({ error: "Request body must be a JSON object" }, { status: 400 });
    }

    const { plan } = body as Record<string, unknown>;

    if (typeof plan !== "string") {
      return Response.json({ error: "plan must be a string" }, { status: 400 });
    }
    if (plan !== "monthly" && plan !== "yearly") {
      return Response.json(
        { error: 'Invalid plan. Must be "monthly" or "yearly".' },
        { status: 400 },
      );
    }

    if (!VIP_PLANS[plan]) {
      return Response.json(
        { error: 'Invalid plan. Must be "monthly" or "yearly".' },
        { status: 400 },
      );
    }

    const selected = VIP_PLANS[plan];
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.verzatv.com";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      phone_number_collection: { enabled: true },
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Verza VIP — ${selected.label}`,
              description:
                plan === "yearly"
                  ? "Unlimited streaming for a full year — save 33% vs monthly"
                  : "Unlimited streaming, all episodes, cancel anytime",
            },
            unit_amount: selected.cents,
            recurring: {
              interval: selected.interval,
              interval_count: selected.intervalCount,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        type: "vip_subscription",
        plan,
      },
      success_url: `${siteUrl}/me?vip=true`,
      cancel_url: `${siteUrl}/me`,
    });

    return Response.json({ url: session.url });
  } catch (err) {
    console.error("[subscribe] Error:", err);
    return Response.json(
      { error: "Failed to create subscription checkout" },
      { status: 500 },
    );
  }
}
