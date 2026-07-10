import { NextRequest } from "next/server";
import Stripe from "stripe";
import { getServiceClient } from "@/lib/supabase/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

/**
 * GET /api/unlock/confirm?session_id=cs_...&slug=the-ceo
 *
 * Server-side verification of a Stripe Checkout session. Replaces the old
 * blind `?unlocked=true` param (which granted access to anyone who typed it).
 * Returns { full: true } only when Stripe confirms this exact session was
 * PAID for this exact series. Also idempotently writes the entitlement when
 * the buyer's user id is known — covering webhook delivery delays, so a
 * buyer is unlocked the second they land back on the site.
 */
export async function GET(request: NextRequest) {
  try {
    const sessionId = request.nextUrl.searchParams.get("session_id");
    const slug = request.nextUrl.searchParams.get("slug");
    if (!sessionId || !slug || !sessionId.startsWith("cs_")) {
      return Response.json({ full: false });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const paid = session.payment_status === "paid";
    const forSlug = session.metadata?.seriesSlug === slug;
    const isUnlock =
      session.metadata?.type === "series_unlock" ||
      session.metadata?.type === "creator_unlock";

    if (!paid || !forSlug || !isUnlock) {
      return Response.json({ full: false });
    }

    // Webhook safety net: write the entitlement now if we know the buyer.
    const userId = session.metadata?.userId || session.client_reference_id;
    if (userId) {
      const supabase = getServiceClient();
      await supabase
        .from("entitlements")
        .upsert(
          { user_id: userId, series_slug: slug },
          { onConflict: "user_id,series_slug" },
        );
    }

    return Response.json({ full: true });
  } catch {
    return Response.json({ full: false });
  }
}
