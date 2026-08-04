import Stripe from "stripe";
import { getUser } from "@/lib/auth";
import { privateJson } from "@/lib/private-json";
import { getServiceClient } from "@/lib/supabase/server";
import {
  assertOwnedLiveStripeCustomer,
  assertCanonicalBillingPortalConfiguration,
  assertStripePortalUrl,
  canonicalBillingPortalReturnUrl,
  stripeBillingPortalConfigurationId,
} from "@/lib/billing-portal-policy";

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
    if (!user) return privateJson({ error: "Not signed in" }, { status: 401 });

    const supabase = getServiceClient();
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("stripe_customer_id,deletion_requested_at")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError || !profile || profile.deletion_requested_at) {
      return privateJson({ error: "Billing account is unavailable" }, { status: 409 });
    }
    if (!profile.stripe_customer_id) {
      return privateJson(
        { error: "No billing profile found — contact support@verzatv.com" },
        { status: 404 },
      );
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.verzatv.com";
    const returnUrl = canonicalBillingPortalReturnUrl(siteUrl);
    const customer = await stripe.customers.retrieve(profile.stripe_customer_id);
    const secretKey = process.env.STRIPE_SECRET_KEY ?? "";
    const liveMode = /^(?:sk|rk)_live_/.test(secretKey);
    assertOwnedLiveStripeCustomer(
      customer,
      profile.stripe_customer_id,
      user.id,
      liveMode,
    );
    const configurationId = stripeBillingPortalConfigurationId();
    const configuration = await stripe.billingPortal.configurations.retrieve(
      configurationId,
    );
    assertCanonicalBillingPortalConfiguration(
      configuration,
      configurationId,
      liveMode,
    );

    // Close the account-deletion and customer-relink window after the provider
    // read but before creating a privileged self-service session.
    const recheck = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .eq("stripe_customer_id", customer.id)
      .is("deletion_requested_at", null)
      .maybeSingle();
    if (recheck.error || !recheck.data) {
      return privateJson({ error: "Billing account changed" }, { status: 409 });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customer.id,
      configuration: configurationId,
      return_url: returnUrl,
    });
    assertStripePortalUrl(session.url);

    return privateJson({ url: session.url });
  } catch (err) {
    console.error("[billing-portal] Error:", err);
    return privateJson(
      { error: "Could not open billing portal — contact support@verzatv.com" },
      { status: 500 },
    );
  }
}
