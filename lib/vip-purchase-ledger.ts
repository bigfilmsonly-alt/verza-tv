import "server-only";
import type Stripe from "stripe";
import { getServiceClient } from "@/lib/supabase/server";
import { paidInvoiceFinancials } from "@/lib/stripe-tax";
import {
  type CanonicalVipPlan,
  verifyVipSubscriptionPayment,
} from "@/lib/vip-provider-payment";
import { assertVipCheckoutConsentRecorded } from "@/lib/vip-checkout-consent-ledger";

type ServiceClient = ReturnType<typeof getServiceClient>;

type VipPurchase = {
  id: string;
  user_id: string | null;
  type: string | null;
  amount_cents: number | null;
  subtotal_cents: number | null;
  tax_cents: number | null;
  total_cents: number | null;
  currency: string | null;
  status: string | null;
  metadata: Record<string, unknown> | null;
  stripe_session_id: string | null;
  stripe_payment_intent: string | null;
};

const VIP_PURCHASE_FIELDS =
  "id,user_id,type,amount_cents,subtotal_cents,tax_cents,total_cents,currency,status,metadata,stripe_session_id,stripe_payment_intent";

function customerId(subscription: Stripe.Subscription): string | null {
  return typeof subscription.customer === "string"
    ? subscription.customer
    : subscription.customer?.id ?? null;
}

function periodEnd(invoice: Stripe.Invoice): string | null {
  const end = invoice.lines?.data?.[0]?.period?.end;
  return end ? new Date(end * 1000).toISOString() : null;
}

function eligiblePurchaseStatus(status: string | null): boolean {
  return status === "completed" || status === "partially_refunded";
}

async function loadPurchase(
  supabase: ServiceClient,
  invoiceId: string,
  paymentIntentId: string,
): Promise<VipPurchase | null> {
  const [byInvoice, byIntent] = await Promise.all([
    supabase
      .from("purchases")
      .select(VIP_PURCHASE_FIELDS)
      .eq("stripe_session_id", invoiceId)
      .maybeSingle(),
    supabase
      .from("purchases")
      .select(VIP_PURCHASE_FIELDS)
      .eq("stripe_payment_intent", paymentIntentId)
      .maybeSingle(),
  ]);
  if (byInvoice.error || byIntent.error) {
    throw new Error(
      `Could not load VIP financial row: ${
        byInvoice.error?.message ?? byIntent.error?.message ?? "database error"
      }`,
    );
  }
  const invoicePurchase = (byInvoice.data as VipPurchase | null) ?? null;
  const intentPurchase = (byIntent.data as VipPurchase | null) ?? null;
  if (
    invoicePurchase &&
    intentPurchase &&
    invoicePurchase.id !== intentPurchase.id
  ) {
    throw new Error("VIP invoice and PaymentIntent resolve to different purchases");
  }
  return invoicePurchase ?? intentPurchase;
}

async function recordVipPurchase(
  supabase: ServiceClient,
  verified: Awaited<ReturnType<typeof verifyVipSubscriptionPayment>>,
  subscription: Stripe.Subscription,
  plan: CanonicalVipPlan,
  userId: string,
  allowInsert = true,
): Promise<VipPurchase> {
  const { invoice, paymentIntent } = verified;
  const financials = paidInvoiceFinancials(invoice);
  const metadata = {
    subscription_id: subscription.id,
    plan,
    billing_reason: invoice.billing_reason,
    period_end: periodEnd(invoice),
    recovered_from_provider: true,
    tos_consent_policy: subscription.metadata?.tosConsentPolicy,
    terms_version: subscription.metadata?.termsVersion,
  };
  let existing = await loadPurchase(supabase, invoice.id, paymentIntent.id);
  if (existing) {
    if (
      existing.type !== "vip_renewal" ||
      Number(existing.amount_cents ?? 0) !== financials.totalCents ||
      Number(existing.subtotal_cents ?? 0) !== financials.subtotalCents ||
      Number(existing.tax_cents ?? 0) !== financials.taxCents ||
      Number(existing.total_cents ?? 0) !== financials.totalCents ||
      (existing.currency ?? "usd") !== "usd" ||
      (existing.user_id && existing.user_id !== userId) ||
      (existing.stripe_session_id && existing.stripe_session_id !== invoice.id) ||
      (existing.stripe_payment_intent &&
        existing.stripe_payment_intent !== paymentIntent.id) ||
      existing.metadata?.subscription_id !== subscription.id ||
      existing.metadata?.plan !== plan ||
      !eligiblePurchaseStatus(existing.status)
    ) {
      throw new Error("Recovered VIP payment conflicts with its financial ledger");
    }
    if (!existing.user_id) {
      const repaired = await supabase
        .from("purchases")
        .update({ user_id: userId, metadata })
        .eq("id", existing.id)
        .is("user_id", null)
        .in("status", ["completed", "partially_refunded"])
        .select(VIP_PURCHASE_FIELDS)
        .maybeSingle();
      if (repaired.error || !repaired.data) {
        throw new Error(
          `Could not attach verified VIP owner: ${
            repaired.error?.message ?? "purchase state changed"
          }`,
        );
      }
      existing = repaired.data as VipPurchase;
    }
    return existing;
  }

  if (!allowInsert) {
    throw new Error("VIP purchase uniqueness conflict could not be recovered");
  }
  const inserted = await supabase
    .from("purchases")
    .insert({
      user_id: userId,
      type: "vip_renewal",
      series_slug: null,
      amount_cents: financials.totalCents,
      subtotal_cents: financials.subtotalCents,
      tax_cents: financials.taxCents,
      total_cents: financials.totalCents,
      currency: "usd",
      status: "completed",
      stripe_session_id: invoice.id,
      stripe_payment_intent: paymentIntent.id,
      metadata,
    })
    .select(VIP_PURCHASE_FIELDS)
    .single();
  if (inserted.error?.code === "23505") {
    return recordVipPurchase(
      supabase,
      verified,
      subscription,
      plan,
      userId,
      false,
    );
  }
  if (inserted.error || !inserted.data) {
    throw new Error(
      `Could not record recovered VIP invoice: ${
        inserted.error?.message ?? "missing row"
      }`,
    );
  }
  return inserted.data as VipPurchase;
}

/**
 * Recovery path used when Checkout redirects before invoice.paid finishes.
 * It creates the same financial row first, re-reads provider state, then uses
 * the row-locking restoration RPC so a concurrent refund/dispute wins safely.
 */
export async function recoverVipFromProvider(
  supabase: ServiceClient,
  stripe: Stripe,
  subscription: Stripe.Subscription,
  plan: CanonicalVipPlan,
  userId: string,
): Promise<{ expiresAt: string | null; cancelAtPeriodEnd: boolean }> {
  await assertVipCheckoutConsentRecorded(supabase, subscription, userId);
  const initial = await verifyVipSubscriptionPayment(
    stripe,
    subscription,
    plan,
  );
  let purchase = await recordVipPurchase(
    supabase,
    initial,
    subscription,
    plan,
    userId,
  );

  // Close the refund/dispute-before-insert window using a second current-state
  // read after the durable financial row exists.
  const current = await verifyVipSubscriptionPayment(
    stripe,
    subscription,
    plan,
  );
  if (
    current.invoice.id !== initial.invoice.id ||
    current.paymentIntent.id !== initial.paymentIntent.id ||
    current.charge.id !== initial.charge.id
  ) {
    throw new Error("VIP provider payment changed during recovery");
  }

  for (const table of ["stripe_refunds", "stripe_disputes"] as const) {
    const linked = await supabase
      .from(table)
      .update({ purchase_id: purchase.id, updated_at: new Date().toISOString() })
      .eq("stripe_payment_intent", current.paymentIntent.id)
      .is("purchase_id", null);
    if (linked.error) {
      throw new Error(`Could not link ${table}: ${linked.error.message}`);
    }
  }
  const disputeRows = await supabase
    .from("stripe_disputes")
    .select("status")
    .eq("stripe_payment_intent", current.paymentIntent.id);
  if (disputeRows.error) {
    throw new Error(`Could not verify dispute ledger: ${disputeRows.error.message}`);
  }
  if (
    (disputeRows.data ?? []).some(
      (dispute) =>
        dispute.status !== "won" &&
        dispute.status !== "warning_closed" &&
        dispute.status !== "prevented",
    )
  ) {
    throw new Error("VIP payment has adverse dispute state");
  }

  if (current.charge.amount_refunded > 0) {
    const refund = await supabase.rpc("reconcile_purchase_refund", {
      p_payment_intent: current.paymentIntent.id,
      p_refunded_cents: current.charge.amount_refunded,
    });
    if (refund.error) {
      throw new Error(`Could not reconcile VIP refund: ${refund.error.message}`);
    }
  }
  purchase =
    (await loadPurchase(
      supabase,
      current.invoice.id,
      current.paymentIntent.id,
    )) ?? purchase;
  if (!eligiblePurchaseStatus(purchase.status)) {
    throw new Error("VIP purchase became adverse during recovery");
  }

  const profile = await supabase
    .from("profiles")
    .select(
      "id,stripe_customer_id,stripe_subscription_id,vip_payment_blocked,deletion_requested_at",
    )
    .eq("id", userId)
    .maybeSingle();
  if (profile.error || !profile.data || profile.data.deletion_requested_at) {
    throw new Error(
      `VIP account is unavailable: ${profile.error?.message ?? "missing profile"}`,
    );
  }
  const subscriptionCustomerId = customerId(subscription);
  if (
    !subscriptionCustomerId ||
    (profile.data.stripe_customer_id &&
      profile.data.stripe_customer_id !== subscriptionCustomerId)
  ) {
    throw new Error("VIP subscription belongs to another billing account");
  }
  const sameSubscription =
    profile.data.stripe_subscription_id === subscription.id;
  if (!sameSubscription) {
    let linkQuery = supabase
      .from("profiles")
      .update({
        is_vip: false,
        vip_expires_at: null,
        vip_payment_blocked: false,
        vip_cancel_at_period_end: false,
        stripe_customer_id: subscriptionCustomerId,
        stripe_subscription_id: subscription.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .is("deletion_requested_at", null)
      .eq("vip_payment_blocked", profile.data.vip_payment_blocked);
    linkQuery = profile.data.stripe_subscription_id
      ? linkQuery.eq(
          "stripe_subscription_id",
          profile.data.stripe_subscription_id,
        )
      : linkQuery.is("stripe_subscription_id", null);
    const linked = await linkQuery.select("id").maybeSingle();
    if (linked.error || !linked.data) {
      throw new Error(
        `Could not link VIP subscription: ${
          linked.error?.message ?? "profile state changed"
        }`,
      );
    }
  }

  const expiresAt = subscription.items.data[0]?.current_period_end
    ? new Date(
        subscription.items.data[0].current_period_end * 1000,
      ).toISOString()
    : null;
  const restored = await supabase.rpc(
    "restore_vip_access_after_payment_resolution",
    {
      p_purchase_id: purchase.id,
      p_user_id: userId,
      p_subscription_id: subscription.id,
      p_expires_at: expiresAt,
      p_cancel_at_period_end: subscription.cancel_at_period_end,
    },
  );
  if (restored.error || restored.data !== true) {
    throw new Error(
      `VIP payment is not recoverable: ${
        restored.error?.message ?? "purchase state changed"
      }`,
    );
  }
  return {
    expiresAt,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
  };
}
