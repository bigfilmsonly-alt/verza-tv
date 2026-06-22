import { NextRequest } from "next/server";
import Stripe from "stripe";
import { getProductBySlug, products } from "@/lib/products";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

interface CartItem {
  productId: string;
  quantity: number;
}

/**
 * POST /api/checkout
 * Creates a Stripe Checkout session for merch purchases.
 * SECURITY: Prices are looked up server-side from the product catalog.
 * The client only sends productId and quantity — never prices or names.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { items } = body as { items: CartItem[] };

    if (!items || !Array.isArray(items) || items.length === 0) {
      return Response.json({ error: "Cart is empty." }, { status: 400 });
    }

    // Validate and resolve prices server-side
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    for (const item of items) {
      if (!item.productId || !item.quantity) {
        return Response.json({ error: "Each item must have productId and quantity" }, { status: 400 });
      }
      if (typeof item.quantity !== "number" || item.quantity < 1 || item.quantity > 10) {
        return Response.json({ error: "Quantity must be 1-10" }, { status: 400 });
      }
      // Look up canonical price from server-side catalog
      const product = products.find((p) => p.id === item.productId || p.slug === item.productId);
      if (!product) {
        return Response.json({ error: `Unknown product: ${item.productId}` }, { status: 400 });
      }
      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: {
            name: product.name,
            images: product.images?.[0] ? [`https://www.verzatv.com${product.images[0]}`] : [],
          },
          unit_amount: Math.round(product.price * 100),
        },
        quantity: item.quantity,
      });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.verzatv.com";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      phone_number_collection: { enabled: true },
      line_items: lineItems,
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
