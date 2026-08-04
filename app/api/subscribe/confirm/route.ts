import { NextRequest } from "next/server";
import Stripe from "stripe";
import { getUser } from "@/lib/auth";
import { VIP_PLANS } from "@/lib/config";
import { getServiceClient } from "@/lib/supabase/server";
import { canonicalCheckoutFinancials } from "@/lib/stripe-tax";
import { stripeCheckoutTermsConsentSatisfied } from "@/lib/stripe-checkout-consent";
import { recoverVipFromProvider } from "@/lib/vip-purchase-ledger";
import { recordVipCheckoutConsent } from "@/lib/vip-checkout-consent-ledger";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

/** Provider-backed VIP recovery for webhook delivery lag. */
export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return Response.json({ vip: false, error: "Authentication required" }, { status: 401 });
    }
    const sessionId = request.nextUrl.searchParams.get("session_id");
    if (!sessionId?.startsWith("cs_")) {
      return Response.json({ vip: false, error: "Invalid Checkout session" }, { status: 400 });
    }

    const supabase = getServiceClient();
    const profile = await supabase
      .from("profiles")
      .select(
        "stripe_customer_id,stripe_subscription_id,vip_payment_blocked,deletion_requested_at",
      )
      .eq("id", user.id)
      .maybeSingle();
    if (profile.error || !profile.data || profile.data.deletion_requested_at) {
      return Response.json({ vip: false, error: "Account is unavailable" }, { status: 409 });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const plan = session.metadata?.plan;
    const customerId =
      typeof session.customer === "string"
        ? session.customer
        : session.customer?.id;
    const subscriptionId =
      typeof session.subscription === "string"
        ? session.subscription
        : session.subscription?.id;
    const ownsSession =
      session.metadata?.userId === user.id &&
      session.client_reference_id === user.id;
    if (
      session.status !== "complete" ||
      (session.payment_status !== "paid" &&
        session.payment_status !== "no_payment_required") ||
      session.mode !== "subscription" ||
      session.metadata?.type !== "vip_subscription" ||
      (plan !== "monthly" && plan !== "yearly") ||
      !ownsSession ||
      !customerId ||
      customerId !== profile.data.stripe_customer_id ||
      !subscriptionId ||
      !stripeCheckoutTermsConsentSatisfied(session)
    ) {
      return Response.json({ vip: false }, { status: 409 });
    }

    const expected = VIP_PLANS[plan];
    try {
      canonicalCheckoutFinancials(session, expected.cents);
    } catch {
      return Response.json({ vip: false }, { status: 409 });
    }

    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const subscriptionCustomerId =
      typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer.id;
    const item = subscription.items.data[0];
    if (
      (subscription.status !== "active" &&
        subscription.status !== "trialing") ||
      subscription.metadata?.type !== "vip_subscription" ||
      subscription.metadata?.userId !== user.id ||
      subscriptionCustomerId !== customerId ||
      subscription.items.data.length !== 1 ||
      item?.price.unit_amount !== expected.cents ||
      item?.price.currency !== "usd" ||
      item?.price.recurring?.interval !== expected.interval ||
      item?.price.recurring?.interval_count !== expected.intervalCount
    ) {
      return Response.json({ vip: false }, { status: 409 });
    }

    await recordVipCheckoutConsent(supabase, session, subscription);

    let recovered: Awaited<ReturnType<typeof recoverVipFromProvider>>;
    try {
      recovered = await recoverVipFromProvider(
        supabase,
        stripe,
        subscription,
        plan,
        user.id,
      );
    } catch (error) {
      console.error("[subscribe/confirm] Payment verification refused:", error);
      return Response.json(
        { vip: false, error: "Subscription payment is unavailable" },
        { status: 409 },
      );
    }

    return Response.json({
      vip: true,
      expiresAt: recovered.expiresAt,
      cancelAtPeriodEnd: recovered.cancelAtPeriodEnd,
    });
  } catch (error) {
    console.error("[subscribe/confirm] Error:", error);
    return Response.json({ vip: false, error: "Could not confirm subscription" }, { status: 500 });
  }
}
