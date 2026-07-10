import Stripe from "stripe";
import { getUser } from "@/lib/auth";
import { getServiceClient } from "@/lib/supabase/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

/**
 * POST /api/billing-portal
 * Creates a Stripe customer-portal session for the signed-in subscriber so
 * they can self-service manage/cancel VIP (required disclosure-adjacent UX;
 * replaces a hard-coded TEST-mode portal link that shipped in VipCard).
 */
export async function POST() {
  try {
    const user = await getUser();
    if (!user) return Response.json({ error: "Not signed in" }, { status: 401 });

    const supabase = getServiceClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile?.stripe_customer_id) {
      return Response.json(
        { error: "No billing profile found — contact support@verzatv.com" },
        { status: 404 },
      );
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.verzatv.com";
    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${siteUrl}/me`,
    });

    return Response.json({ url: session.url });
  } catch (err) {
    console.error("[billing-portal] Error:", err);
    return Response.json(
      { error: "Could not open billing portal — contact support@verzatv.com" },
      { status: 500 },
    );
  }
}
