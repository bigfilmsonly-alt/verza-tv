import { NextRequest } from "next/server";
import Stripe from "stripe";
import { VIP_PLANS } from "@/lib/config";
import { getUser } from "@/lib/auth";
import { getServiceClient } from "@/lib/supabase/server";
import { createCheckoutSessionWithRecovery } from "@/lib/stripe-idempotency";
import {
  STRIPE_CHECKOUT_TERMS_VERSION,
  assertStripeCheckoutConsentReady,
  stripeCheckoutConsentCollection,
  stripeCheckoutTermsConsentSatisfied,
  stripeCheckoutTosConsentRequired,
} from "@/lib/stripe-checkout-consent";
import {
  checkoutAccountStillActive,
  ensureStripeCustomer,
  isStripeResourceMissing,
} from "@/lib/stripe-customer";
import {
  canonicalCheckoutFinancials,
  stripeAutomaticTaxEnabled,
  VIP_SUBSCRIPTION_TAX_CODE,
} from "@/lib/stripe-tax";
import { recoverVipFromProvider } from "@/lib/vip-purchase-ledger";
import { recordVipCheckoutConsent } from "@/lib/vip-checkout-consent-ledger";
import { assertVipCheckoutReleaseReady } from "@/lib/vip-release-policy";
import {
  assertCanonicalBillingPortalConfiguration,
  stripeBillingPortalConfigurationId,
} from "@/lib/billing-portal-policy";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const ACTIVE_SUBSCRIPTION_STATUSES = new Set(["active", "trialing"]);
const BLOCKING_SUBSCRIPTION_STATUSES = new Set([
  "active",
  "trialing",
  "past_due",
  "unpaid",
  "paused",
  "incomplete",
]);

type ServiceClient = ReturnType<typeof getServiceClient>;

function dollarsForCheckout(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function subscriptionCustomerId(subscription: Stripe.Subscription): string {
  return typeof subscription.customer === "string"
    ? subscription.customer
    : subscription.customer.id;
}

function canonicalSubscriptionPlan(
  subscription: Stripe.Subscription,
): "monthly" | "yearly" | null {
  if (
    subscription.metadata?.type !== "vip_subscription" ||
    subscription.items.data.length !== 1
  ) {
    return null;
  }
  const price = subscription.items.data[0]?.price;
  for (const plan of ["monthly", "yearly"] as const) {
    const expected = VIP_PLANS[plan];
    if (
      price?.unit_amount === expected.cents &&
      price.currency === "usd" &&
      price.recurring?.interval === expected.interval &&
      price.recurring?.interval_count === expected.intervalCount
    ) {
      return plan;
    }
  }
  return null;
}

function assertSubscriptionOwner(
  subscription: Stripe.Subscription,
  userId: string,
): void {
  if (subscription.metadata?.userId !== userId) {
    throw new Error("Stripe subscription belongs to another user");
  }
  if (!canonicalSubscriptionPlan(subscription)) {
    throw new Error("Stripe subscription is not a canonical VIP plan");
  }
}

async function activateExistingSubscription(
  supabase: ServiceClient,
  userId: string,
  subscription: Stripe.Subscription,
): Promise<void> {
  if (!ACTIVE_SUBSCRIPTION_STATUSES.has(subscription.status)) {
    throw new Error(`Cannot activate subscription in ${subscription.status}`);
  }
  assertSubscriptionOwner(subscription, userId);
  const plan = canonicalSubscriptionPlan(subscription);
  if (!plan) {
    throw new Error("Cannot activate a non-canonical VIP subscription");
  }
  await recoverVipFromProvider(supabase, stripe, subscription, plan, userId);
}

/**
 * POST /api/subscribe
 * Creates a Stripe Checkout session for a VIP subscription.
 * Body: { plan: "monthly" | "yearly" }
 */
export async function POST(req: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      return Response.json(
        { error: "Request body must be a JSON object" },
        { status: 400 },
      );
    }

    const { plan, client } = body as Record<string, unknown>;
    if (plan !== "monthly" && plan !== "yearly") {
      return Response.json(
        { error: 'Invalid plan. Must be "monthly" or "yearly".' },
        { status: 400 },
      );
    }
    if (client !== undefined && client !== "native_android") {
      return Response.json({ error: "Unsupported checkout client" }, { status: 400 });
    }
    try {
      assertVipCheckoutReleaseReady(plan);
    } catch (error) {
      console.error("[subscribe] Release gate refused Checkout:", error);
      return Response.json(
        { error: "This VIP plan is not currently available" },
        { status: 503 },
      );
    }
    const nativeAndroid = client === "native_android";
    const hasBearerToken = /^Bearer [^\s]+$/.test(
      req.headers.get("authorization") ?? "",
    );
    if (nativeAndroid && !hasBearerToken) {
      return Response.json(
        { error: "Native checkout requires Bearer authentication" },
        { status: 401 },
      );
    }

    const user = await getUser();
    if (!user) {
      return Response.json({ error: "Authentication required" }, { status: 401 });
    }

    const selected = VIP_PLANS[plan];
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.verzatv.com";
    const successUrl = `${siteUrl}/me?vip=true`;
    const nativeReturnUrl = new URL("/api/checkout/native-return", siteUrl);
    if (
      nativeAndroid &&
      process.env.NODE_ENV === "production" &&
      nativeReturnUrl.protocol !== "https:"
    ) {
      throw new Error("Native Checkout return origin must use HTTPS");
    }
    nativeReturnUrl.searchParams.set("kind", "vip");
    const nativeSuccessUrl = new URL(nativeReturnUrl);
    nativeSuccessUrl.searchParams.set("status", "success");
    const nativeCancelUrl = new URL(nativeReturnUrl);
    nativeCancelUrl.searchParams.set("status", "cancel");
    const supabase = getServiceClient();
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select(
        "is_vip, vip_expires_at, stripe_customer_id, stripe_subscription_id, vip_payment_blocked, vip_cancel_at_period_end, deletion_requested_at",
      )
      .eq("id", user.id)
      .maybeSingle();

    if (profileError || !profile) {
      console.error(
        "[subscribe] Profile lookup failed:",
        profileError?.message ?? "missing profile",
      );
      return Response.json(
        { error: "Could not verify subscription eligibility" },
        { status: 500 },
      );
    }
    if (profile.deletion_requested_at) {
      return Response.json({ error: "Account deletion is in progress" }, { status: 409 });
    }

    const vipStillCurrent =
      profile.is_vip &&
      (!profile.vip_expires_at ||
        new Date(profile.vip_expires_at) >= new Date());
    if (vipStillCurrent) {
      return Response.json(
        {
          error: "You already have an active VIP subscription",
          alreadySubscribed: true,
        },
        { status: 409 },
      );
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY ?? "";
    assertStripeCheckoutConsentReady(stripeSecretKey);
    const portalConfigurationId = stripeBillingPortalConfigurationId();
    const portalConfiguration =
      await stripe.billingPortal.configurations.retrieve(portalConfigurationId);
    assertCanonicalBillingPortalConfiguration(
      portalConfiguration,
      portalConfigurationId,
      /^(?:sk|rk)_live_/.test(stripeSecretKey),
    );

    // Database state can lag Stripe after a failed webhook. Provider state is
    // authoritative: repair an active subscription, block non-terminal billing
    // states, and treat only a confirmed resource_missing as stale linkage.
    let checkoutCustomerId: string | null = profile.stripe_customer_id;
    let priorSubscriptionKey =
      profile.stripe_subscription_id ?? "no-prior-subscription";

    if (profile.stripe_subscription_id) {
      try {
        const existing = await stripe.subscriptions.retrieve(
          profile.stripe_subscription_id,
        );
        assertSubscriptionOwner(existing, user.id);
        checkoutCustomerId = subscriptionCustomerId(existing);
        if (ACTIVE_SUBSCRIPTION_STATUSES.has(existing.status)) {
          if (profile.vip_payment_blocked) {
            return Response.json(
              { error: "VIP access is unavailable while a payment is under review" },
              { status: 409 },
            );
          }
          await activateExistingSubscription(supabase, user.id, existing);
          return Response.json({
            url: successUrl,
            recovered: true,
            alreadySubscribed: true,
          });
        }
        if (BLOCKING_SUBSCRIPTION_STATUSES.has(existing.status)) {
          return Response.json(
            {
              error: `Your existing VIP subscription is ${existing.status}`,
              alreadySubscribed: true,
            },
            { status: 409 },
          );
        }
      } catch (error) {
        if (!isStripeResourceMissing(error)) throw error;
        console.warn(
          "[subscribe] Ignoring stale subscription reference:",
          profile.stripe_subscription_id,
        );
        priorSubscriptionKey = `missing:${profile.stripe_subscription_id}`;
      }
    }

    checkoutCustomerId = await ensureStripeCustomer(
      supabase,
      stripe,
      user,
      checkoutCustomerId,
    );

    const automaticTaxEnabled = stripeAutomaticTaxEnabled();

    if (checkoutCustomerId) {
      try {
        const subscriptions = await stripe.subscriptions.list({
          customer: checkoutCustomerId,
          status: "all",
          limit: 100,
        });
        for (const subscription of subscriptions.data) {
          assertSubscriptionOwner(subscription, user.id);
        }
        const active = subscriptions.data.find((subscription) =>
          ACTIVE_SUBSCRIPTION_STATUSES.has(subscription.status),
        );
        if (active) {
          if (
            profile.vip_payment_blocked &&
            active.id === profile.stripe_subscription_id
          ) {
            return Response.json(
              { error: "VIP access is unavailable while a payment is under review" },
              { status: 409 },
            );
          }
          await activateExistingSubscription(supabase, user.id, active);
          return Response.json({
            url: successUrl,
            recovered: true,
            alreadySubscribed: true,
          });
        }
        const blocking = subscriptions.data.find((subscription) =>
          BLOCKING_SUBSCRIPTION_STATUSES.has(subscription.status),
        );
        if (blocking) {
          assertSubscriptionOwner(blocking, user.id);
          return Response.json(
            {
              error: `Your existing VIP subscription is ${blocking.status}`,
              alreadySubscribed: true,
            },
            { status: 409 },
          );
        }
      } catch (error) {
        if (!isStripeResourceMissing(error)) throw error;
        console.warn(
          "[subscribe] Ignoring stale customer reference:",
          checkoutCustomerId,
        );
        checkoutCustomerId = await ensureStripeCustomer(
          supabase,
          stripe,
          user,
          checkoutCustomerId,
        );
      }
    }

    const consentCollection = stripeCheckoutConsentCollection();
    const tosConsentRequired = stripeCheckoutTosConsentRequired();
    const session = await createCheckoutSessionWithRecovery(
      stripe,
      {
        mode: "subscription",
        origin_context: nativeAndroid ? "mobile_app" : undefined,
        client_reference_id: user.id,
        customer: checkoutCustomerId,
        ...(consentCollection
          ? { consent_collection: consentCollection }
          : {}),
        custom_text: {
          submit: {
            message:
              plan === "yearly"
                ? `VERZA VIP renews automatically at ${dollarsForCheckout(selected.cents)} each year, plus applicable tax, until canceled. Cancel from Profile; access continues through the paid period.`
                : `VERZA VIP renews automatically at ${dollarsForCheckout(selected.cents)} each month, plus applicable tax, until canceled. Cancel from Profile; access continues through the paid period.`,
          },
        },
        ...(automaticTaxEnabled
          ? {
              automatic_tax: { enabled: true },
              customer_update: { address: "auto" as const },
            }
          : {}),
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: `VERZA VIP — ${selected.label}`,
                description:
                  plan === "yearly"
                    ? "Unlimited streaming for a full year — save 33% vs monthly"
                    : "Unlimited streaming, all episodes, cancel anytime",
                tax_code: VIP_SUBSCRIPTION_TAX_CODE,
              },
              tax_behavior: "exclusive",
              unit_amount: selected.cents,
              recurring: {
                interval: selected.interval,
                interval_count: selected.intervalCount,
              },
            },
            quantity: 1,
          },
        ],
        metadata: {
          type: "vip_subscription",
          plan,
          plan_type: plan === "yearly" ? "vip_yearly" : "vip_monthly",
          userId: user.id,
          tosConsentPolicy: tosConsentRequired ? "required" : "not_required",
          termsVersion: STRIPE_CHECKOUT_TERMS_VERSION,
        },
        subscription_data: {
          metadata: {
            type: "vip_subscription",
            userId: user.id,
            tosConsentPolicy: tosConsentRequired ? "required" : "not_required",
            termsVersion: STRIPE_CHECKOUT_TERMS_VERSION,
          },
        },
        success_url: nativeAndroid
          ? `${nativeSuccessUrl.toString()}&session_id={CHECKOUT_SESSION_ID}`
          : `${successUrl}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: nativeAndroid
          ? nativeCancelUrl.toString()
          : `${siteUrl}/me`,
      },
      [
        "vip-subscription-v3-tax-aware",
        user.id,
        plan,
        selected.cents,
        selected.interval,
        selected.intervalCount,
        priorSubscriptionKey,
        checkoutCustomerId ?? "new-customer",
        automaticTaxEnabled ? "automatic-tax" : "no-automatic-tax",
        VIP_SUBSCRIPTION_TAX_CODE,
        "exclusive",
        tosConsentRequired ? "tos-required" : "tos-not-required",
        STRIPE_CHECKOUT_TERMS_VERSION,
        nativeAndroid ? "native_android" : "web",
      ],
    );

    if (
      !(await checkoutAccountStillActive(supabase, stripe, user.id, session))
    ) {
      return Response.json(
        { error: "Account deletion is in progress" },
        { status: 409 },
      );
    }

    if (session.status === "complete") {
      const ownsSession =
        (session.metadata?.userId || session.client_reference_id) === user.id;
      const matchesOffer =
        session.metadata?.type === "vip_subscription" &&
        session.metadata?.plan === plan;
      const subscriptionId =
        typeof session.subscription === "string"
          ? session.subscription
          : session.subscription?.id;
      if (
        (session.payment_status !== "paid" &&
          session.payment_status !== "no_payment_required") ||
        !ownsSession ||
        !matchesOffer ||
        !subscriptionId ||
        !stripeCheckoutTermsConsentSatisfied(session)
      ) {
        return Response.json(
          { error: "Existing checkout could not be safely recovered" },
          { status: 409 },
        );
      }

      canonicalCheckoutFinancials(session, selected.cents);

      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      if (canonicalSubscriptionPlan(subscription) !== plan) {
        throw new Error("Completed Checkout subscription plan does not match");
      }
      await recordVipCheckoutConsent(supabase, session, subscription);
      await activateExistingSubscription(supabase, user.id, subscription);
      return Response.json({
        url: successUrl,
        sessionId: session.id,
        recovered: true,
        alreadySubscribed: true,
      });
    }

    if (!session.url) {
      throw new Error(`Checkout ${session.id} has no usable URL`);
    }
    return Response.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    console.error("[subscribe] Error:", error);
    return Response.json(
      { error: "Failed to create subscription checkout" },
      { status: 500 },
    );
  }
}
