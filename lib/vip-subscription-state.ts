import "server-only";
import type Stripe from "stripe";

export type PriorVipPaymentState = {
  stripeSubscriptionId: string | null;
  paymentBlocked: boolean;
};

export type DerivedVipPaymentState = {
  providerIsActive: boolean;
  sameSubscription: boolean;
  isVip: boolean;
  paymentBlocked: boolean;
  cancelAtPeriodEnd: boolean;
};

/** Pure state transition applied only to a freshly retrieved Subscription. */
export function deriveVipPaymentState(
  subscription: Pick<
    Stripe.Subscription,
    "id" | "status" | "cancel_at_period_end"
  >,
  prior: PriorVipPaymentState,
): DerivedVipPaymentState {
  const providerIsActive =
    subscription.status === "active" || subscription.status === "trialing";
  const sameSubscription = prior.stripeSubscriptionId === subscription.id;
  const paymentBlocked = sameSubscription && prior.paymentBlocked;
  const isVip = providerIsActive && !paymentBlocked;
  return {
    providerIsActive,
    sameSubscription,
    isVip,
    paymentBlocked,
    cancelAtPeriodEnd: isVip ? subscription.cancel_at_period_end : false,
  };
}
