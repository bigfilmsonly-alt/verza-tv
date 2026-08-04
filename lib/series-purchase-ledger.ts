import "server-only";
import type Stripe from "stripe";
import { getServiceClient } from "@/lib/supabase/server";
import { SERIES_UNLOCK_PRICE_CENTS } from "@/lib/series-purchase";
import { canonicalCheckoutFinancials } from "@/lib/stripe-tax";

export type PaymentServiceClient = ReturnType<typeof getServiceClient>;

type RecoveryPurchase = {
  id: string;
  user_id: string | null;
  type: string | null;
  series_slug: string | null;
  amount_cents: number | null;
  subtotal_cents: number | null;
  tax_cents: number | null;
  total_cents: number | null;
  currency: string | null;
  status: string | null;
  stripe_session_id: string | null;
  stripe_payment_intent: string | null;
};

/**
 * Durable safety net for a paid Checkout whose webhook has not completed yet.
 * Provider state must be verified by the caller immediately before this call.
 */
export async function recordRecoveredSeriesPurchase(
  supabase: PaymentServiceClient,
  session: Stripe.Checkout.Session,
  userId: string,
  seriesSlug: string,
  allowInsert = true,
): Promise<string> {
  const financials = canonicalCheckoutFinancials(
    session,
    SERIES_UNLOCK_PRICE_CENTS,
  );
  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id;
  if (!paymentIntentId) throw new Error("Paid Checkout has no payment intent");

  const fields =
    "id,user_id,type,series_slug,amount_cents,subtotal_cents,tax_cents,total_cents,currency,status,stripe_session_id,stripe_payment_intent";
  const bySession = await supabase
    .from("purchases")
    .select(fields)
    .eq("stripe_session_id", session.id)
    .maybeSingle();
  if (bySession.error) {
    throw new Error(`Could not load recovered purchase: ${bySession.error.message}`);
  }
  let existing = (bySession.data as RecoveryPurchase | null) ?? null;

  if (!existing) {
    const byIntent = await supabase
      .from("purchases")
      .select(fields)
      .eq("stripe_payment_intent", paymentIntentId)
      .maybeSingle();
    if (byIntent.error) {
      throw new Error(`Could not load recovered payment: ${byIntent.error.message}`);
    }
    existing = (byIntent.data as RecoveryPurchase | null) ?? null;
  }

  if (existing) {
    if (
      existing.type !== "series_unlock" ||
      existing.series_slug !== seriesSlug ||
      Number(existing.amount_cents ?? 0) !== financials.totalCents ||
      Number(existing.subtotal_cents ?? 0) !== financials.subtotalCents ||
      Number(existing.tax_cents ?? 0) !== financials.taxCents ||
      Number(existing.total_cents ?? 0) !== financials.totalCents ||
      (existing.currency ?? "usd") !== "usd" ||
      (existing.user_id && existing.user_id !== userId) ||
      (existing.stripe_payment_intent &&
        existing.stripe_payment_intent !== paymentIntentId)
    ) {
      throw new Error("Recovered purchase conflicts with the financial ledger");
    }
    if (
      existing.status === "refunded" ||
      existing.status === "partially_refunded" ||
      existing.status === "disputed" ||
      existing.status === "disputed_lost"
    ) {
      throw new Error("Recovered purchase has adverse provider state");
    }

    const repaired = await supabase
      .from("purchases")
      .update({
        user_id: userId,
        status: "completed",
        stripe_payment_intent: paymentIntentId,
      })
      .eq("id", existing.id)
      .select("id")
      .single();
    if (repaired.error || !repaired.data) {
      throw new Error(
        `Could not repair purchase ledger: ${repaired.error?.message ?? "missing row"}`,
      );
    }
    return repaired.data.id;
  }

  if (!allowInsert) {
    throw new Error("Purchase uniqueness conflict could not be recovered");
  }
  const inserted = await supabase
    .from("purchases")
    .insert({
      user_id: userId,
      type: "series_unlock",
      series_slug: seriesSlug,
      amount_cents: financials.totalCents,
      subtotal_cents: financials.subtotalCents,
      tax_cents: financials.taxCents,
      total_cents: financials.totalCents,
      currency: "usd",
      status: "completed",
      stripe_session_id: session.id,
      stripe_payment_intent: paymentIntentId,
      metadata: {
        recovered_from_checkout: true,
      },
    })
    .select("id")
    .single();
  if (inserted.error?.code === "23505") {
    return recordRecoveredSeriesPurchase(
      supabase,
      session,
      userId,
      seriesSlug,
      false,
    );
  }
  if (inserted.error || !inserted.data) {
    throw new Error(
      `Could not record recovered purchase: ${inserted.error?.message ?? "missing row"}`,
    );
  }
  return inserted.data.id;
}

/** Atomically grants only while the matching financial row remains eligible. */
export async function grantSeriesEntitlementForPurchase(
  supabase: PaymentServiceClient,
  purchaseId: string,
  userId: string,
  seriesSlug: string,
): Promise<void> {
  const result = await supabase.rpc("grant_series_entitlement_for_purchase", {
    p_purchase_id: purchaseId,
    p_user_id: userId,
    p_series_slug: seriesSlug,
  });
  if (result.error || result.data !== true) {
    throw new Error(
      `Paid entitlement is not grantable: ${result.error?.message ?? "purchase state changed"}`,
    );
  }
}
