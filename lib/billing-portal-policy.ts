import "server-only";
import type Stripe from "stripe";

const PRODUCTION_SITE_HOSTS = new Set(["verzatv.com", "www.verzatv.com"]);

export const BILLING_PORTAL_TERMS_URL = "https://www.verzatv.com/terms";
export const BILLING_PORTAL_PRIVACY_URL = "https://www.verzatv.com/privacy";
export const BILLING_PORTAL_DEFAULT_RETURN_URL = "https://www.verzatv.com/me";
export const BILLING_PORTAL_ALLOWED_CUSTOMER_UPDATES = [
  "address",
  "email",
  "name",
] as const;
export const BILLING_PORTAL_CANCELLATION_REASONS = [
  "too_expensive",
  "unused",
  "missing_features",
  "customer_service",
  "other",
] as const;

/** Safe, restricted portal configuration to create once during rollout. */
export const CANONICAL_BILLING_PORTAL_CONFIGURATION = {
  business_profile: {
    headline: "Manage your VERZA VIP subscription and billing details.",
    privacy_policy_url: BILLING_PORTAL_PRIVACY_URL,
    terms_of_service_url: BILLING_PORTAL_TERMS_URL,
  },
  default_return_url: BILLING_PORTAL_DEFAULT_RETURN_URL,
  features: {
    customer_update: {
      enabled: true,
      allowed_updates: [...BILLING_PORTAL_ALLOWED_CUSTOMER_UPDATES],
    },
    invoice_history: { enabled: true },
    payment_method_update: { enabled: true },
    subscription_cancel: {
      enabled: true,
      mode: "at_period_end",
      proration_behavior: "none",
      cancellation_reason: {
        enabled: true,
        options: [...BILLING_PORTAL_CANCELLATION_REASONS],
      },
    },
    // Prevent unreviewed plan changes/proration. Customers can cancel and then
    // select another canonical plan after the paid period.
    subscription_update: { enabled: false },
  },
  login_page: { enabled: false },
  metadata: { policy: "verza-vip-v1" },
  name: "VERZA VIP self-service v1",
} satisfies Stripe.BillingPortal.ConfigurationCreateParams;

export function stripeBillingPortalConfigurationId(): string {
  const configurationId =
    process.env.STRIPE_BILLING_PORTAL_CONFIGURATION_ID?.trim() ?? "";
  if (!/^bpc_[A-Za-z0-9]+$/.test(configurationId)) {
    throw new Error("STRIPE_BILLING_PORTAL_CONFIGURATION_ID is not configured");
  }
  return configurationId;
}

function sameStringSet(actual: string[], expected: readonly string[]): boolean {
  return (
    actual.length === expected.length &&
    [...actual].sort().every((value, index) => value === [...expected].sort()[index])
  );
}

/** Refuse to mint a portal session if the live configuration drifts. */
export function assertCanonicalBillingPortalConfiguration(
  configuration: Stripe.BillingPortal.Configuration,
  expectedId: string,
  expectedLivemode: boolean,
): void {
  const { features } = configuration;
  if (
    configuration.id !== expectedId ||
    !configuration.active ||
    configuration.livemode !== expectedLivemode ||
    configuration.business_profile.terms_of_service_url !==
      BILLING_PORTAL_TERMS_URL ||
    configuration.business_profile.privacy_policy_url !==
      BILLING_PORTAL_PRIVACY_URL ||
    configuration.default_return_url !== BILLING_PORTAL_DEFAULT_RETURN_URL ||
    configuration.login_page.enabled ||
    configuration.metadata?.policy !== "verza-vip-v1" ||
    !features.customer_update.enabled ||
    !sameStringSet(
      features.customer_update.allowed_updates,
      BILLING_PORTAL_ALLOWED_CUSTOMER_UPDATES,
    ) ||
    !features.invoice_history.enabled ||
    !features.payment_method_update.enabled ||
    !features.subscription_cancel.enabled ||
    features.subscription_cancel.mode !== "at_period_end" ||
    features.subscription_cancel.proration_behavior !== "none" ||
    !features.subscription_cancel.cancellation_reason.enabled ||
    !sameStringSet(
      features.subscription_cancel.cancellation_reason.options,
      BILLING_PORTAL_CANCELLATION_REASONS,
    ) ||
    features.subscription_update.enabled
  ) {
    throw new Error("Stripe Billing Portal configuration is not canonical");
  }
}

export function canonicalBillingPortalReturnUrl(siteUrl: string): string {
  const origin = new URL(siteUrl);
  if (
    origin.protocol !== "https:" ||
    origin.username ||
    origin.password ||
    !PRODUCTION_SITE_HOSTS.has(origin.hostname) ||
    (origin.port && origin.port !== "443")
  ) {
    throw new Error("Billing Portal return origin is not canonical HTTPS");
  }
  return new URL("/me", origin.origin).toString();
}

export function assertOwnedLiveStripeCustomer(
  customer: Stripe.Customer | Stripe.DeletedCustomer,
  expectedCustomerId: string,
  expectedUserId: string,
  expectedLivemode: boolean,
): asserts customer is Stripe.Customer {
  if (
    customer.id !== expectedCustomerId ||
    "deleted" in customer ||
    customer.metadata?.userId !== expectedUserId ||
    customer.livemode !== expectedLivemode
  ) {
    throw new Error("Stripe Customer is not the account's live billing identity");
  }
}

export function assertStripePortalUrl(url: string): void {
  const parsed = new URL(url);
  if (parsed.protocol !== "https:" || parsed.hostname !== "billing.stripe.com") {
    throw new Error("Stripe returned a non-canonical Billing Portal URL");
  }
}
