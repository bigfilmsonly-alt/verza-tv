import "server-only";
import type Stripe from "stripe";
import type { Series } from "@/lib/catalog";
import {
  canonicalCheckoutFinancials,
  type PaymentFinancials,
} from "@/lib/stripe-tax";

export const SERIES_UNLOCK_PRICE_CENTS = 199;

/** Canonical sellability gate shared by checkout and payment fulfillment. */
export function isSeriesPurchasable(series: Series): boolean {
  return (
    series.status === "live" &&
    series.episodeCount > series.freeEpisodes &&
    series.coinPerEpisode > 0
  );
}

/**
 * Checkout's payment_status remains "paid" after a refund. Before repairing a
 * missing entitlement from a completed session, verify the underlying charge
 * still represents the full, undisputed canonical payment.
 */
export async function hasUnrefundedSeriesPayment(
  client: Stripe,
  session: Stripe.Checkout.Session,
): Promise<boolean> {
  const state = await getSeriesPaymentState(client, session);
  return state.unrefunded;
}

export async function getSeriesPaymentState(
  client: Stripe,
  session: Stripe.Checkout.Session,
): Promise<{
  paymentIntentId: string;
  charge: Stripe.Charge;
  financials: PaymentFinancials;
  unrefunded: boolean;
}> {
  const financials = canonicalCheckoutFinancials(
    session,
    SERIES_UNLOCK_PRICE_CENTS,
  );
  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id;
  if (!paymentIntentId) throw new Error("Series Checkout has no payment intent");

  const paymentIntent = await client.paymentIntents.retrieve(paymentIntentId, {
    expand: ["latest_charge"],
  });
  if (
    paymentIntent.status !== "succeeded" ||
    paymentIntent.amount_received !== financials.totalCents ||
    paymentIntent.currency !== "usd"
  ) {
    throw new Error("Series payment intent does not match the canonical offer");
  }

  const charge =
    paymentIntent.latest_charge &&
    typeof paymentIntent.latest_charge !== "string"
      ? paymentIntent.latest_charge
      : paymentIntent.latest_charge
        ? await client.charges.retrieve(paymentIntent.latest_charge)
        : null;
  if (!charge) throw new Error("Series payment intent has no successful charge");
  if (
    !charge.paid ||
    charge.status !== "succeeded" ||
    charge.amount !== financials.totalCents ||
    charge.currency !== "usd"
  ) {
    throw new Error("Series charge does not match the canonical offer");
  }
  return {
    paymentIntentId,
    charge,
    financials,
    unrefunded: !charge.disputed && charge.amount_refunded === 0,
  };
}
