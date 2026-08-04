import { getUser } from "@/lib/auth";
import {
  vipSubscriptionCheckoutEnabled,
  vipYearlyCheckoutEnabled,
} from "@/lib/vip-release-policy";
import {
  stripeCheckoutConsentReadiness,
  type StripeCheckoutConsentReadiness,
} from "@/lib/stripe-checkout-consent";

export const dynamic = "force-dynamic";

const PRIVATE_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0",
  Vary: "Authorization, Cookie",
};

function failClosed(capability: () => boolean): boolean {
  try {
    return capability() === true;
  } catch (error) {
    console.error(
      "[payment-capabilities] Release-policy configuration is invalid:",
      error instanceof Error ? error.message : error,
    );
    return false;
  }
}

function seriesUnlockCheckoutReadiness(): StripeCheckoutConsentReadiness {
  try {
    return stripeCheckoutConsentReadiness(
      process.env.STRIPE_SECRET_KEY ?? "",
    );
  } catch (error) {
    console.error(
      "[payment-capabilities] Series Checkout configuration is invalid:",
      error instanceof Error ? error.message : error,
    );
    return {
      checkoutConfigured: false,
      livemode: /^(?:sk|rk)_live_/.test(
        process.env.STRIPE_SECRET_KEY ?? "",
      ),
      consentMode: "unconfigured",
    };
  }
}

/**
 * Authenticated, non-secret release capabilities for native purchase surfaces.
 * The checkout routes enforce the same server policy; this response only lets
 * clients hide flows which are intentionally unavailable.
 */
export async function GET() {
  const user = await getUser();
  if (!user) {
    return Response.json(
      { error: "Unauthorized" },
      { status: 401, headers: PRIVATE_HEADERS },
    );
  }

  return Response.json(
    {
      seriesUnlock: seriesUnlockCheckoutReadiness(),
      vip: {
        monthlyCheckoutEnabled: failClosed(vipSubscriptionCheckoutEnabled),
        yearlyCheckoutEnabled: failClosed(vipYearlyCheckoutEnabled),
      },
    },
    { headers: PRIVATE_HEADERS },
  );
}
