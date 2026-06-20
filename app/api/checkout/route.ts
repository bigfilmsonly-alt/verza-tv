import { NextRequest } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

interface CartItem {
  productId: string;
  name: string;
  quantity: number;
  priceCents: number;
  imageUrl?: string;
}

/**
 * POST /api/checkout
 * Creates a Stripe Checkout session for merch purchases.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { items } = body as { items: CartItem[] };

    if (!items || !Array.isArray(items) || items.length === 0) {
      return Response.json({ error: "Cart is empty." }, { status: 400 });
    }

    for (const item of items) {
      if (!item.productId || !item.name || !item.quantity || !item.priceCents) {
        return Response.json(
          { error: "Each item must have productId, name, quantity, and priceCents" },
          { status: 400 },
        );
      }
      if (item.quantity < 1 || item.quantity > 10) {
        return Response.json(
          { error: `Invalid quantity for "${item.name}": must be 1-10` },
          { status: 400 },
        );
      }
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.verzatv.com";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      phone_number_collection: { enabled: true },
      line_items: items.map((item) => ({
        price_data: {
          currency: "usd",
          product_data: {
            name: item.name,
            images: item.imageUrl ? [item.imageUrl] : [],
          },
          unit_amount: item.priceCents,
        },
        quantity: item.quantity,
      })),
      metadata: {
        type: "merch",
        itemCount: String(items.length),
      },
      success_url: `${siteUrl}/shop?success=true`,
      cancel_url: `${siteUrl}/shop`,
    });

    return Response.json({ url: session.url });
  } catch (err) {
    console.error("[checkout] Error:", err);
    return Response.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
