import { NextRequest } from "next/server";
import Stripe from "stripe";
import { getServiceClient } from "@/lib/supabase/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

/**
 * POST /api/creator-unlock
 * Creates a Stripe Checkout session to unlock a paid creator title. The price
 * is read SERVER-SIDE from creator_content (never trusted from the client) and
 * only published, paid titles are sellable. Metadata carries content_id +
 * creator_id so the webhook can write the 80/20 split ledger server-side.
 * Body: { slug: string }
 */
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const slug = typeof body.slug === "string" ? body.slug : "";
  if (!slug) return Response.json({ error: "slug is required" }, { status: 400 });

  const supabase = getServiceClient();
  const { data: content } = await supabase
    .from("creator_content")
    .select("id, creator_id, slug, title, poster_url, status, pricing_type, price_cents")
    .eq("slug", slug)
    .maybeSingle();

  if (!content || content.status !== "published") {
    return Response.json({ error: "Title not available" }, { status: 404 });
  }
  if (content.pricing_type === "free" || content.price_cents < 99) {
    return Response.json({ error: "This title is free" }, { status: 400 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.verzatv.com";

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: content.title,
              images: content.poster_url ? [content.poster_url] : [],
            },
            unit_amount: content.price_cents, // server-side price
          },
          quantity: 1,
        },
      ],
      metadata: {
        type: "creator_unlock",
        content_id: content.id,
        creator_id: content.creator_id,
        seriesSlug: content.slug, // reuse entitlements keyed by slug
        show_id: content.slug,
      },
      success_url: `${siteUrl}/watch/${content.slug}?unlocked=true`,
      cancel_url: `${siteUrl}/watch/${content.slug}`,
    });

    return Response.json({ url: session.url });
  } catch (err) {
    console.error("[creator-unlock] checkout failed:", err);
    return Response.json({ error: "Could not start checkout" }, { status: 500 });
  }
}
