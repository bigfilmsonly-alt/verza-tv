import "server-only";
import type Stripe from "stripe";

/** Stripe Tax categories for Verza's two digital streaming offers. */
export const SERIES_UNLOCK_TAX_CODE = "txcd_10402000";
export const VIP_SUBSCRIPTION_TAX_CODE = "txcd_10402200";

export type PaymentFinancials = {
  /** Product revenue before separately collected tax. */
  subtotalCents: number;
  /** Tax collected on top of the canonical product price. */
  taxCents: number;
  /** Gross amount paid, including tax. */
  totalCents: number;
};

/**
 * Tax collection is deliberately opt-in. An absent or explicit false value is
 * always off; a typo fails closed instead of silently changing checkout math.
 */
export function stripeAutomaticTaxEnabled(): boolean {
  const value = process.env.STRIPE_AUTOMATIC_TAX_ENABLED?.trim().toLowerCase();
  if (!value || value === "false") return false;
  if (value === "true") return true;
  throw new Error("STRIPE_AUTOMATIC_TAX_ENABLED must be true or false");
}

function assertNonNegativeInteger(value: number, label: string): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${label} is not a non-negative integer`);
  }
}

/**
 * Validate the immutable product subtotal while allowing exclusive tax to be
 * added to the amount paid. Discounts and shipping are not part of either
 * canonical digital offer and therefore fail reconciliation.
 *
 * The fallback for a missing amount_subtotal/total_details supports old Stripe
 * event snapshots, but only when they are provably untaxed and undiscounted.
 */
export function canonicalCheckoutFinancials(
  session: Stripe.Checkout.Session,
  expectedSubtotalCents: number,
): PaymentFinancials {
  assertNonNegativeInteger(expectedSubtotalCents, "expected Checkout subtotal");
  if (session.currency !== "usd") {
    throw new Error("Checkout currency does not match the canonical offer");
  }

  const totalCents = session.amount_total;
  if (totalCents === null) {
    throw new Error("Checkout has no final total");
  }
  assertNonNegativeInteger(totalCents, "Checkout total");

  const discountCents = session.total_details?.amount_discount ?? 0;
  const shippingCents = session.total_details?.amount_shipping ?? 0;
  assertNonNegativeInteger(discountCents, "Checkout discount");
  assertNonNegativeInteger(shippingCents, "Checkout shipping");
  if (discountCents !== 0 || shippingCents !== 0) {
    throw new Error("Checkout includes a non-canonical discount or shipping charge");
  }

  const explicitTaxCents = session.total_details?.amount_tax;
  if (explicitTaxCents !== undefined) {
    assertNonNegativeInteger(explicitTaxCents, "Checkout tax");
  }
  const subtotalCents =
    session.amount_subtotal ??
    (explicitTaxCents === undefined || explicitTaxCents === 0
      ? totalCents
      : totalCents - explicitTaxCents);
  assertNonNegativeInteger(subtotalCents, "Checkout subtotal");
  const taxCents = explicitTaxCents ?? totalCents - subtotalCents;
  assertNonNegativeInteger(taxCents, "Checkout tax");

  if (
    subtotalCents !== expectedSubtotalCents ||
    totalCents !== subtotalCents + taxCents
  ) {
    throw new Error("Checkout financials do not match the canonical offer");
  }

  const automaticTaxEnabled = session.automatic_tax?.enabled === true;
  if (automaticTaxEnabled && session.automatic_tax.status !== "complete") {
    throw new Error("Checkout automatic tax calculation is incomplete");
  }
  if (!automaticTaxEnabled && taxCents !== 0) {
    throw new Error("Checkout contains unexpected tax");
  }

  return { subtotalCents, taxCents, totalCents };
}

/**
 * Paid subscription invoices are the revenue source of record for VIP. Stripe
 * reports their post-discount pretax total separately from tax; the app does
 * not offer invoice-level discounts or shipping.
 */
export function paidInvoiceFinancials(
  invoice: Stripe.Invoice,
): PaymentFinancials {
  if (invoice.currency !== "usd") {
    throw new Error("Invoice currency does not match the canonical offer");
  }

  const totalCents = invoice.amount_paid;
  assertNonNegativeInteger(totalCents, "Invoice amount paid");
  if (invoice.status !== "paid" || totalCents !== invoice.total) {
    throw new Error("Invoice is not fully paid");
  }

  const discountCents = (invoice.total_discount_amounts ?? []).reduce(
    (sum, discount) => sum + discount.amount,
    0,
  );
  assertNonNegativeInteger(discountCents, "Invoice discount");
  if (discountCents !== 0 || invoice.shipping_cost) {
    throw new Error("Invoice includes a non-canonical discount or shipping charge");
  }

  const taxCents = (invoice.total_taxes ?? []).reduce(
    (sum, tax) => sum + tax.amount,
    0,
  );
  assertNonNegativeInteger(taxCents, "Invoice tax");
  const subtotalCents =
    invoice.total_excluding_tax ?? totalCents - taxCents;
  assertNonNegativeInteger(subtotalCents, "Invoice subtotal");
  if (totalCents !== subtotalCents + taxCents) {
    throw new Error("Invoice subtotal, tax, and total are inconsistent");
  }

  return { subtotalCents, taxCents, totalCents };
}

/**
 * Converts a cumulative gross refund into an incremental pretax revenue
 * reversal. Comparing cumulative rounded values prevents penny drift across
 * several partial refunds.
 */
export function pretaxRefundDeltaCents(input: {
  subtotalCents: number;
  totalCents: number;
  totalRefundedCents: number;
  refundDeltaCents: number;
}): number {
  const {
    subtotalCents,
    totalCents,
    totalRefundedCents,
    refundDeltaCents,
  } = input;
  for (const [label, value] of Object.entries(input)) {
    assertNonNegativeInteger(value, label);
  }
  if (
    subtotalCents > totalCents ||
    totalRefundedCents > totalCents ||
    refundDeltaCents > totalRefundedCents
  ) {
    throw new Error("Refund financials are inconsistent");
  }
  if (totalCents === 0 || refundDeltaCents === 0) return 0;

  const priorRefundedCents = totalRefundedCents - refundDeltaCents;
  const currentPretaxRefund = Math.round(
    (totalRefundedCents * subtotalCents) / totalCents,
  );
  const priorPretaxRefund = Math.round(
    (priorRefundedCents * subtotalCents) / totalCents,
  );
  return currentPretaxRefund - priorPretaxRefund;
}
