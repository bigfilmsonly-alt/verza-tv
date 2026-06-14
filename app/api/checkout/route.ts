import { NextRequest } from "next/server";

// TODO: wire to Supabase + Stripe in production
// import Stripe from "stripe";
// import { createClient } from "@/lib/supabase/server";
// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

interface CartItem {
  productId: string;
  name: string;
  quantity: number;
  priceCents: number;
  imageUrl?: string;
}

/**
 * POST /api/checkout
 *
 * Creates a Stripe Checkout session for merch cart purchases.
 * The client redirects to the Checkout URL returned in the response.
 *
 * Body: { items: CartItem[] }
 */
export async function POST(req: NextRequest) {
  try {
    // --- Auth check (stubbed) ---
    // TODO: wire to Supabase + Stripe in production
    // const supabase = await createClient();
    // const { data: { user } } = await supabase.auth.getUser();
    const user = null as { id: string; email?: string } | null;

    if (!user) {
      return Response.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    // --- Parse & validate body ---
    const body = await req.json();
    const { items } = body as { items: CartItem[] };

    if (!items || !Array.isArray(items) || items.length === 0) {
      return Response.json(
        { error: "Cart is empty. Provide a non-empty items array." },
        { status: 400 },
      );
    }

    // Validate each item
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

    const totalCents = items.reduce(
      (sum, item) => sum + item.priceCents * item.quantity,
      0,
    );

    // --- Production flow (stubbed) ---
    // TODO: wire to Supabase + Stripe in production
    // const session = await stripe.checkout.sessions.create({
    //   mode: "payment",
    //   customer_email: user.email,
    //   line_items: items.map((item) => ({
    //     price_data: {
    //       currency: "usd",
    //       product_data: {
    //         name: item.name,
    //         images: item.imageUrl ? [item.imageUrl] : [],
    //       },
    //       unit_amount: item.priceCents,
    //     },
    //     quantity: item.quantity,
    //   })),
    //   metadata: {
    //     userId: user.id,
    //     itemCount: String(items.length),
    //   },
    //   success_url: `${process.env.NEXT_PUBLIC_URL}/shop/success?session_id={CHECKOUT_SESSION_ID}`,
    //   cancel_url: `${process.env.NEXT_PUBLIC_URL}/shop/cart`,
    // });

    return Response.json({
      success: true,
      stub: true,
      message: "Checkout session stubbed -- Stripe integration pending",
      checkout: {
        itemCount: items.length,
        totalCents,
        totalFormatted: `$${(totalCents / 100).toFixed(2)}`,
        items: items.map((item) => ({
          productId: item.productId,
          name: item.name,
          quantity: item.quantity,
          subtotalCents: item.priceCents * item.quantity,
        })),
        // url: session.url,
      },
    });
  } catch (err) {
    console.error("[checkout] Error:", err);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
