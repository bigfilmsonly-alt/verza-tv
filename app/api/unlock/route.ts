import { NextRequest } from "next/server";
import Stripe from "stripe";
import { getSeriesBySlug } from "@/lib/catalog";
import { getUser } from "@/lib/auth";
import { privateJson } from "@/lib/private-json";
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
} from "@/lib/stripe-customer";
import {
  hasUnrefundedSeriesPayment,
  isSeriesPurchasable,
  SERIES_UNLOCK_PRICE_CENTS,
} from "@/lib/series-purchase";
import { findPriorSeriesCheckout } from "@/lib/series-checkout-recovery";
import {
  SERIES_UNLOCK_TAX_CODE,
  stripeAutomaticTaxEnabled,
} from "@/lib/stripe-tax";
import {
  grantSeriesEntitlementForPurchase,
  recordRecoveredSeriesPurchase,
} from "@/lib/series-purchase-ledger";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

/**
 * POST /api/unlock
 * Creates a Stripe Checkout session to unlock a full series for $1.99 plus
 * applicable tax when explicitly enabled by server configuration.
 * Body: { seriesSlug: string }
 *
 * Every failure carries a stable machine `code` next to the human `error`.
 * The English `error` string is unchanged and is still what non-browser
 * clients and logs see; `code` exists so the in-feed paywall can render the
 * failure in the viewer's own language instead of dropping an English
 * sentence into an otherwise Spanish or Hindi payment screen. The codes are
 * a closed set — components/EpisodeFeed.tsx maps each one to a translation
 * key and falls back to `error` for anything it does not recognise, and
 * scripts/test-feed-integrity.mjs fails if a code here has no key in all 20
 * locale dictionaries. Adding a new failure means adding its code to both.
 *
 * Codes never affect authorization. Status codes, ordering and every
 * fail-closed branch below are byte-for-byte what they were.
 */
export async function POST(req: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return privateJson({ error: "Invalid JSON body", code: "invalid_request" }, { status: 400 });
    }
    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      return privateJson(
        { error: "Request body must be a JSON object", code: "invalid_request" },
        { status: 400 },
      );
    }
    const { seriesSlug, client } = body as Record<string, unknown>;

    if (typeof seriesSlug !== "string" || !seriesSlug) {
      return privateJson({ error: "seriesSlug is required", code: "invalid_request" }, { status: 400 });
    }
    if (client !== undefined && client !== "native_android") {
      return privateJson({ error: "Unsupported checkout client", code: "invalid_request" }, { status: 400 });
    }
    const nativeAndroid = client === "native_android";
    const hasBearerToken = /^Bearer [^\s]+$/.test(
      req.headers.get("authorization") ?? "",
    );
    if (nativeAndroid && !hasBearerToken) {
      return privateJson(
        { error: "Native checkout requires Bearer authentication", code: "auth_required" },
        { status: 401 },
      );
    }

    const series = getSeriesBySlug(seriesSlug);
    if (!series) {
      return privateJson({ error: "Series not found", code: "series_not_found" }, { status: 404 });
    }

    const user = await getUser();
    if (!user) {
      return privateJson({ error: "Authentication required", code: "auth_required" }, { status: 401 });
    }

    if (!isSeriesPurchasable(series)) {
      return privateJson({ error: "Series is not available for purchase", code: "not_purchasable" }, { status: 409 });
    }

    // Refuse a second checkout for content the verified account already owns.
    // The Stripe idempotency key below closes the smaller race where two
    // requests arrive before the first payment's entitlement webhook lands.
    const supabase = getServiceClient();
    const { data: existing, error: entitlementError } = await supabase
      .from("entitlements")
      .select("id")
      .eq("user_id", user.id)
      .eq("series_slug", series.slug)
      .maybeSingle();

    if (entitlementError) {
      console.error("[unlock] Entitlement lookup failed:", entitlementError.message);
      return privateJson({ error: "Could not verify purchase eligibility", code: "eligibility_unknown" }, { status: 500 });
    }
    if (existing) {
      return privateJson(
        { error: "You already own this series", code: "already_owned", alreadyOwned: true },
        { status: 409 },
      );
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.verzatv.com";
    const priceInCents = SERIES_UNLOCK_PRICE_CENTS;
    const automaticTaxEnabled = stripeAutomaticTaxEnabled();
    assertStripeCheckoutConsentReady(process.env.STRIPE_SECRET_KEY ?? "");
    const profile = await supabase
      .from("profiles")
      .select("stripe_customer_id, deletion_requested_at")
      .eq("id", user.id)
      .single();
    if (profile.error || !profile.data) {
      throw new Error(
        `Could not load billing profile: ${profile.error?.message ?? "missing profile"}`,
      );
    }
    if (profile.data.deletion_requested_at) {
      return privateJson({ error: "Account deletion is in progress", code: "account_deletion" }, { status: 409 });
    }
    const customerId = await ensureStripeCustomer(
      supabase,
      stripe,
      user,
      profile.data.stripe_customer_id,
    );

    const successUrl = `${siteUrl}/series/${series.slug}/${series.freeEpisodes + 1}`;
    const nativeReturnUrl = new URL("/api/checkout/native-return", siteUrl);
    if (
      nativeAndroid &&
      process.env.NODE_ENV === "production" &&
      nativeReturnUrl.protocol !== "https:"
    ) {
      throw new Error("Native Checkout return origin must use HTTPS");
    }
    nativeReturnUrl.searchParams.set("kind", "series");
    const nativeSuccessUrl = new URL(nativeReturnUrl);
    nativeSuccessUrl.searchParams.set("status", "success");
    const nativeCancelUrl = new URL(nativeReturnUrl);
    nativeCancelUrl.searchParams.set("status", "cancel");
    const consentCollection = stripeCheckoutConsentCollection();
    const tosConsentRequired = stripeCheckoutTosConsentRequired();
    const priorCheckout = await findPriorSeriesCheckout(stripe, {
      customerId,
      userId: user.id,
      seriesSlug: series.slug,
      termsVersion: STRIPE_CHECKOUT_TERMS_VERSION,
      tosConsentPolicy: tosConsentRequired ? "required" : "not_required",
      checkoutClient: nativeAndroid ? "native_android" : "web",
    });
    if (priorCheckout.kind === "blocked") {
      console.error(
        "[unlock] Existing Checkout requires payment review:",
        priorCheckout.sessionId,
        priorCheckout.reason,
      );
      return privateJson(
        {
          error: "An earlier checkout is still being resolved. Contact support before trying another payment.",
          code: "payment_review",
          paymentReviewRequired: true,
        },
        { status: 409 },
      );
    }

    let session: Stripe.Checkout.Session;
    if (priorCheckout.kind === "paid" || priorCheckout.kind === "open") {
      session = priorCheckout.session;
    } else {
      session = await createCheckoutSessionWithRecovery(
        stripe,
        {
        mode: "payment",
        origin_context: nativeAndroid ? "mobile_app" : undefined,
        client_reference_id: user.id,
        customer: customerId,
        ...(consentCollection
          ? { consent_collection: consentCollection }
          : {}),
        custom_text: {
          submit: {
            message: `One-time purchase of account access to ${series.title}. This is not a subscription and does not renew.`,
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
                name: `${series.title} — Full Series`,
                description: `Unlock all ${series.episodeCount} episodes of ${series.title}`,
                images: series.posterUrl ? [`${siteUrl}${series.posterUrl}`] : [],
                tax_code: SERIES_UNLOCK_TAX_CODE,
              },
              tax_behavior: "exclusive",
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
          userId: user.id,
          checkoutClient: nativeAndroid ? "native_android" : "web",
          tosConsentPolicy: tosConsentRequired ? "required" : "not_required",
          termsVersion: STRIPE_CHECKOUT_TERMS_VERSION,
        },
        // session_id is VERIFIED server-side by /api/unlock/confirm before the
        // client honors it — the old blind ?unlocked=true param let anyone
        // unlock every series by editing the URL.
        success_url: nativeAndroid
          ? `${nativeSuccessUrl.toString()}&session_id={CHECKOUT_SESSION_ID}`
          : `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: nativeAndroid
          ? nativeCancelUrl.toString()
          : `${siteUrl}/series/${series.slug}/1`,
      },
      [
        "series-unlock-v4-tax-aware",
        user.id,
        series.slug,
        priceInCents,
        series.episodeCount,
        customerId,
        automaticTaxEnabled ? "automatic-tax" : "no-automatic-tax",
        SERIES_UNLOCK_TAX_CODE,
        "exclusive",
        tosConsentRequired ? "tos-required" : "tos-not-required",
        STRIPE_CHECKOUT_TERMS_VERSION,
        nativeAndroid ? "native_android" : "web",
        ],
      );
    }

    if (
      !(await checkoutAccountStillActive(supabase, stripe, user.id, session))
    ) {
      return privateJson(
        { error: "Account deletion is in progress", code: "account_deletion" },
        { status: 409 },
      );
    }

    const sessionCustomerId =
      typeof session.customer === "string"
        ? session.customer
        : session.customer?.id;
    const ownsSession =
      (session.metadata?.userId || session.client_reference_id) === user.id;
    const matchesSeries =
      session.metadata?.type === "series_unlock" &&
      session.metadata?.seriesSlug === series.slug;
    if (
      session.mode !== "payment" ||
      sessionCustomerId !== customerId ||
      !ownsSession ||
      !matchesSeries
    ) {
      return privateJson(
        { error: "Existing checkout could not be safely used", code: "checkout_unusable" },
        { status: 409 },
      );
    }

    if (session.status === "complete") {
      const paid = session.payment_status === "paid";
      if (!paid) {
        return privateJson(
          { error: "Existing checkout could not be safely recovered", code: "checkout_unusable" },
          { status: 409 },
        );
      }
      if (!stripeCheckoutTermsConsentSatisfied(session)) {
        return privateJson(
          { error: "Checkout Terms acceptance could not be verified", code: "checkout_unusable" },
          { status: 409 },
        );
      }
      if (!(await hasUnrefundedSeriesPayment(stripe, session))) {
        return privateJson(
          { error: "This payment is refunded or disputed", code: "payment_refunded" },
          { status: 409 },
        );
      }

      // The provider accepted payment but fulfillment did not finish. Repair
      // the financial owner link before exposing the entitlement.
      const purchaseId = await recordRecoveredSeriesPurchase(
        supabase,
        session,
        user.id,
        series.slug,
      );
      const recoveredSave = await supabase.from("saved_list").upsert(
        {
          user_id: user.id,
          series_slug: series.slug,
          created_at: new Date().toISOString(),
        },
        { onConflict: "user_id,series_slug" },
      );
      if (recoveredSave.error) {
        throw new Error(
          `Could not recover paid saved-list entry: ${recoveredSave.error.message}`,
        );
      }
      await grantSeriesEntitlementForPurchase(
        supabase,
        purchaseId,
        user.id,
        series.slug,
      );

      return privateJson({
        url: `${successUrl}?session_id=${encodeURIComponent(session.id)}`,
        sessionId: session.id,
        recovered: true,
      });
    }

    if (!session.url) {
      throw new Error(`Checkout ${session.id} has no usable URL`);
    }

    return privateJson({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error("[unlock] Error:", err);
    return privateJson({ error: "Failed to create checkout session", code: "checkout_failed" }, { status: 500 });
  }
}
