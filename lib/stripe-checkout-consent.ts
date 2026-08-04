import "server-only";
import type Stripe from "stripe";

export const STRIPE_CHECKOUT_TERMS_VERSION = "2026-08-03";

type StripeCheckoutConsentFlag = "compatibility" | "required" | "unset";

export type StripeCheckoutConsentReadiness =
  | {
      checkoutConfigured: true;
      livemode: boolean;
      consentMode: "compatibility" | "required";
    }
  | {
      checkoutConfigured: false;
      livemode: boolean;
      consentMode: "unconfigured";
    };

function stripeCheckoutConsentFlag(): StripeCheckoutConsentFlag {
  const value = process.env.STRIPE_CHECKOUT_TOS_CONSENT_REQUIRED;
  if (value == null || value === "") return "unset";
  if (value === "false") return "compatibility";
  if (value === "true") return "required";
  throw new Error(
    'STRIPE_CHECKOUT_TOS_CONSENT_REQUIRED must be exactly "true" or "false"',
  );
}

/**
 * Hosted Checkout can require an affirmative Terms checkbox only after the
 * Stripe account's Public details contain a Terms of Service URL. Keep rollout
 * explicit so a missing Dashboard prerequisite cannot break every Checkout.
 */
export function stripeCheckoutTosConsentRequired(): boolean {
  return stripeCheckoutConsentFlag() === "required";
}

/**
 * Non-secret release readiness for authenticated runtime verification.
 *
 * An explicit false value is the compatibility deployment: live Checkout
 * remains available without Stripe's hosted checkbox until Public details is
 * ready. Missing live configuration is different and fails closed. Test-mode
 * Checkout may omit the flag for local development.
 */
export function stripeCheckoutConsentReadiness(
  secretKey: string,
): StripeCheckoutConsentReadiness {
  const flag = stripeCheckoutConsentFlag();
  const livemode = /^(?:sk|rk)_live_/.test(secretKey);
  const testmode = /^(?:sk|rk)_test_/.test(secretKey);
  if ((!livemode && !testmode) || (livemode && flag === "unset")) {
    return {
      checkoutConfigured: false,
      livemode,
      consentMode: "unconfigured",
    };
  }
  return {
    checkoutConfigured: true,
    livemode,
    consentMode: flag === "required" ? "required" : "compatibility",
  };
}

export function stripeCheckoutConsentCollection():
  | Stripe.Checkout.SessionCreateParams.ConsentCollection
  | undefined {
  return stripeCheckoutTosConsentRequired()
    ? { terms_of_service: "required" }
    : undefined;
}

/** Validate only sessions marked as having required hosted consent. */
export function stripeCheckoutTermsConsentSatisfied(
  session: Pick<Stripe.Checkout.Session, "metadata" | "consent">,
): boolean {
  return (
    session.metadata?.tosConsentPolicy !== "required" ||
    session.consent?.terms_of_service === "accepted"
  );
}

/**
 * Live sales require an explicit rollout state. False keeps the compatibility
 * deployment available; missing or malformed configuration fails closed.
 */
export function assertStripeCheckoutConsentReady(secretKey: string): void {
  const readiness = stripeCheckoutConsentReadiness(secretKey);
  if (readiness.checkoutConfigured) return;
  if (readiness.livemode) {
    throw new Error(
      "Live Stripe Checkout requires an explicit Terms-consent rollout state",
    );
  }
  throw new Error("Stripe Checkout requires a recognized secret-key mode");
}
