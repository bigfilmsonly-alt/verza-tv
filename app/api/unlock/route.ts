import { NextRequest } from "next/server";
import Stripe from "stripe";
import { getSeriesBySlug } from "@/lib/catalog";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

/**
 * POST /api/unlock
 * Creates a Stripe Checkout session to unlock a full series for $2 (Summer Sale).
 * Body: { seriesSlug: string }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { seriesSlug } = body as { seriesSlug: string };

    if (!seriesSlug) {
      return Response.json({ error: "seriesSlug is required" }, { status: 400 });
    }

    const series = getSeriesBySlug(seriesSlug);
    if (!series) {
      return Response.json({ error: "Series not found" }, { status: 404 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.verzatv.com";
    const priceInCents = 200; // $2 Summer Sale — per movie

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      phone_number_collection: { enabled: true },
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${series.title} — Full Series`,
              description: `Unlock all ${series.episodeCount} episodes of ${series.title}`,
              images: series.posterUrl ? [`${siteUrl}${series.posterUrl}`] : [],
            },
            unit_amount: priceInCents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        type: "series_unlock",
        plan_type: "series_unlock",
        seriesSlug: series.slug,
        show_id: series.slug,
        episodeCount: String(series.episodeCount),
      },
      success_url: `${siteUrl}/series/${series.slug}/6?unlocked=true`,
      cancel_url: `${siteUrl}/series/${series.slug}/1`,
    });

    return Response.json({ url: session.url });
  } catch (err) {
    console.error("[unlock] Error:", err);
    return Response.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
