import { NextRequest } from "next/server";
import Stripe from "stripe";
import { getUser } from "@/lib/auth";
import { getSeriesBySlug } from "@/lib/catalog";
import {
  getSeriesPaymentState,
  isSeriesPurchasable,
  SERIES_UNLOCK_PRICE_CENTS,
} from "@/lib/series-purchase";
import { stripeCheckoutTermsConsentSatisfied } from "@/lib/stripe-checkout-consent";
import { getServiceClient } from "@/lib/supabase/server";
import { canonicalCheckoutFinancials } from "@/lib/stripe-tax";
import {
  grantSeriesEntitlementForPurchase,
  recordRecoveredSeriesPurchase,
} from "@/lib/series-purchase-ledger";
import { privateJson } from "@/lib/private-json";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

function hasCanonicalFinancials(session: Stripe.Checkout.Session): boolean {
  try {
    canonicalCheckoutFinancials(session, SERIES_UNLOCK_PRICE_CENTS);
    return true;
  } catch {
    return false;
  }
}

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
    const user = await getUser();
    if (!user) {
      return privateJson({ full: false }, { status: 401 });
    }

    const sessionId = request.nextUrl.searchParams.get("session_id");
    const slug = request.nextUrl.searchParams.get("slug");
    if (!sessionId || !slug || !sessionId.startsWith("cs_")) {
      return privateJson({ full: false });
    }

    const supabase = getServiceClient();
    const profile = await supabase
      .from("profiles")
      .select("stripe_customer_id,deletion_requested_at")
      .eq("id", user.id)
      .maybeSingle();
    if (
      profile.error ||
      !profile.data ||
      profile.data.deletion_requested_at
    ) {
      return privateJson({ full: false }, { status: 409 });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const series = getSeriesBySlug(slug);
    const paid = session.payment_status === "paid";
    const forSlug = session.metadata?.seriesSlug === slug;
    const isUnlock = session.metadata?.type === "series_unlock";
    const checkoutUserId =
      session.metadata?.userId || session.client_reference_id || null;
    const belongsToUser = checkoutUserId === user.id;
    const checkoutCustomerId =
      typeof session.customer === "string"
        ? session.customer
        : session.customer?.id;
    const belongsToCustomer =
      !!checkoutCustomerId &&
      checkoutCustomerId === profile.data.stripe_customer_id;
    const canonicalPurchase =
      !!series &&
      isSeriesPurchasable(series) &&
      session.mode === "payment" &&
      hasCanonicalFinancials(session);

    if (
      paid &&
      isUnlock &&
      belongsToUser &&
      (!forSlug || !canonicalPurchase)
    ) {
      console.error(
        "[unlock/confirm] Paid session failed canonical catalog validation:",
        session.id,
      );
    }

    if (
      !paid ||
      !forSlug ||
      !isUnlock ||
      !belongsToUser ||
      !belongsToCustomer ||
      !canonicalPurchase ||
      !stripeCheckoutTermsConsentSatisfied(session)
    ) {
      return privateJson({ full: false });
    }

    const paymentState = await getSeriesPaymentState(stripe, session);
    if (!paymentState.unrefunded) {
      console.error(
        "[unlock/confirm] Refused refunded/disputed entitlement recovery:",
        session.id,
      );
      return privateJson({ full: false }, { status: 409 });
    }

    const purchaseId = await recordRecoveredSeriesPurchase(
      supabase,
      session,
      user.id,
      slug,
    );

    const stillActive = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .eq("stripe_customer_id", checkoutCustomerId)
      .is("deletion_requested_at", null)
      .maybeSingle();
    if (stillActive.error || !stillActive.data) {
      return privateJson({ full: false }, { status: 409 });
    }

    try {
      await grantSeriesEntitlementForPurchase(
        supabase,
        purchaseId,
        user.id,
        slug,
      );
    } catch (error) {
      console.error("[unlock/confirm] Entitlement write failed:", error);
      return privateJson({ full: false }, { status: 500 });
    }

    return privateJson({ full: true });
  } catch {
    return privateJson({ full: false });
  }
}
