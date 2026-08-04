import "server-only";
import type Stripe from "stripe";
import { VIP_PLANS } from "@/lib/config";
import { paidInvoiceFinancials } from "@/lib/stripe-tax";

export type CanonicalVipPlan = keyof typeof VIP_PLANS;

function expandableId(
  value: string | { id: string } | null | undefined,
): string | null {
  return typeof value === "string" ? value : value?.id ?? null;
}

function subscriptionInvoiceId(invoice: Stripe.Invoice): string | null {
  return expandableId(invoice.parent?.subscription_details?.subscription);
}

/**
 * Provider-backed recovery proof for a VIP subscription.
 *
 * An active Subscription is not payment proof: lifecycle events can precede a
 * paid invoice and Stripe does not cancel a subscription merely because its
 * Charge was refunded. Require the canonical latest invoice, its single paid
 * PaymentIntent, and the current successful Charge. Partial refunds retain
 * access by policy; a full refund or dispute does not.
 */
export async function verifyVipSubscriptionPayment(
  stripe: Stripe,
  subscription: Stripe.Subscription,
  plan: CanonicalVipPlan,
): Promise<{
  invoice: Stripe.Invoice;
  paymentIntent: Stripe.PaymentIntent;
  charge: Stripe.Charge;
}> {
  const invoiceId = expandableId(subscription.latest_invoice);
  const customerId = expandableId(subscription.customer);
  if (!invoiceId || !customerId) {
    throw new Error("VIP subscription has no canonical invoice or customer");
  }

  const invoice = await stripe.invoices.retrieve(invoiceId);
  const invoiceCustomerId = expandableId(invoice.customer);
  if (
    subscriptionInvoiceId(invoice) !== subscription.id ||
    invoiceCustomerId !== customerId ||
    invoice.livemode !== subscription.livemode
  ) {
    throw new Error("VIP invoice ownership is inconsistent");
  }
  const financials = paidInvoiceFinancials(invoice);
  if (financials.subtotalCents !== VIP_PLANS[plan].cents) {
    throw new Error("VIP invoice does not match its canonical plan");
  }

  const invoicePayments = await stripe.invoicePayments.list({
    invoice: invoice.id,
    status: "paid",
    limit: 10,
  });
  if (invoicePayments.has_more || invoicePayments.data.length !== 1) {
    throw new Error("VIP invoice has non-canonical payment allocation");
  }
  const invoicePayment = invoicePayments.data[0];
  const paymentIntentId = expandableId(
    invoicePayment.payment.payment_intent,
  );
  if (
    !paymentIntentId ||
    invoicePayment.amount_paid !== financials.totalCents ||
    invoicePayment.currency !== invoice.currency ||
    invoicePayment.livemode !== invoice.livemode ||
    expandableId(invoicePayment.invoice) !== invoice.id
  ) {
    throw new Error("VIP invoice has no canonical paid PaymentIntent");
  }

  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
    expand: ["latest_charge"],
  });
  const paymentIntentCustomerId = expandableId(paymentIntent.customer);
  const latestCharge = paymentIntent.latest_charge;
  const charge =
    typeof latestCharge === "string"
      ? await stripe.charges.retrieve(latestCharge)
      : latestCharge;
  if (
    paymentIntent.status !== "succeeded" ||
    paymentIntent.amount_received !== financials.totalCents ||
    paymentIntent.currency !== invoice.currency ||
    paymentIntentCustomerId !== customerId ||
    paymentIntent.livemode !== invoice.livemode ||
    !charge ||
    charge.status !== "succeeded" ||
    !charge.paid ||
    charge.amount !== financials.totalCents ||
    charge.currency !== invoice.currency ||
    expandableId(charge.customer) !== customerId ||
    expandableId(charge.payment_intent) !== paymentIntent.id ||
    charge.livemode !== invoice.livemode ||
    charge.disputed ||
    !Number.isSafeInteger(charge.amount_refunded) ||
    charge.amount_refunded < 0 ||
    charge.amount_refunded >= charge.amount
  ) {
    throw new Error("VIP payment is refunded, disputed, or inconsistent");
  }

  const disputes = await stripe.disputes.list({
    charge: charge.id,
    limit: 100,
  });
  const hasAdverseDispute = disputes.data.some(
    (dispute) =>
      dispute.status !== "won" &&
      dispute.status !== "warning_closed" &&
      dispute.status !== "prevented",
  );
  if (disputes.has_more || hasAdverseDispute) {
    throw new Error("VIP payment has an unresolved or lost dispute");
  }

  return { invoice, paymentIntent, charge };
}
