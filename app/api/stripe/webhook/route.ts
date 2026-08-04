import { NextRequest } from "next/server";
import Stripe from "stripe";
import { getServiceClient } from "@/lib/supabase/server";
import { sendPurchaseConfirmation } from "@/lib/email";
import { emitServerEvent } from "@/lib/analytics";
import { persistEvent } from "@/lib/analytics/persist";
import { getSeriesBySlug } from "@/lib/catalog";
import { VIP_PLANS } from "@/lib/config";
import {
  getSeriesPaymentState,
  isSeriesPurchasable,
  SERIES_UNLOCK_PRICE_CENTS,
} from "@/lib/series-purchase";
import { isStripeResourceMissing } from "@/lib/stripe-customer";
import {
  canonicalCheckoutFinancials,
  paidInvoiceFinancials,
  pretaxRefundDeltaCents,
  type PaymentFinancials,
} from "@/lib/stripe-tax";
import { grantSeriesEntitlementForPurchase } from "@/lib/series-purchase-ledger";
import { deriveVipPaymentState } from "@/lib/vip-subscription-state";
import { stripeCheckoutTermsConsentSatisfied } from "@/lib/stripe-checkout-consent";
import {
  assertVipCheckoutConsentRecorded,
  recordVipCheckoutConsent,
} from "@/lib/vip-checkout-consent-ledger";
import {
  sendDurableVipPaymentNotice,
  vipCustomerContact,
} from "@/lib/vip-payment-notices";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

type ServiceClient = ReturnType<typeof getServiceClient>;

type PurchaseInput = {
  stripeSessionId: string;
  stripePaymentIntent: string | null;
  userId: string | null;
  type: string;
  seriesSlug: string | null;
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
  currency: string;
  metadata: Record<string, unknown>;
};

type PurchaseRecord = {
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
  metadata: Record<string, unknown> | null;
  stripe_session_id: string | null;
  stripe_payment_intent: string | null;
};

type PaymentAccount =
  | {
      kind: "active";
      userId: string;
      stripeCustomerId: string | null;
    }
  | {
      kind: "deleted";
      userId: string;
      stripeCustomerId: string | null;
    };

type PaymentTombstone = {
  user_id: string;
  stripe_customer_id: string | null;
};

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function throwDb(
  error: { message?: string; code?: string } | null,
  operation: string,
): void {
  if (error) {
    throw new Error(`${operation}: ${error.message ?? error.code ?? "database error"}`);
  }
}

function stripeObjectId(event: Stripe.Event): string | null {
  const object = event.data.object as { id?: unknown };
  return typeof object.id === "string" ? object.id : null;
}

function idFromExpandable(
  value: string | { id: string } | null | undefined,
): string | null {
  return typeof value === "string" ? value : value?.id ?? null;
}

function isPaidCheckout(session: Stripe.Checkout.Session): boolean {
  return (
    session.payment_status === "paid" ||
    session.payment_status === "no_payment_required"
  );
}

function canonicalVipPlan(
  subscription: Stripe.Subscription,
): "monthly" | "yearly" | null {
  if (
    subscription.metadata?.type !== "vip_subscription" ||
    subscription.items.data.length !== 1
  ) {
    return null;
  }
  const price = subscription.items.data[0]?.price;
  for (const plan of ["monthly", "yearly"] as const) {
    const expected = VIP_PLANS[plan];
    if (
      price?.unit_amount === expected.cents &&
      price.currency === "usd" &&
      price.recurring?.interval === expected.interval &&
      price.recurring?.interval_count === expected.intervalCount
    ) {
      return plan;
    }
  }
  return null;
}

function assertMatchingCustomer(
  expectedCustomerId: string | null,
  actualCustomerId: string | null,
  context: string,
): void {
  if (
    expectedCustomerId &&
    actualCustomerId &&
    expectedCustomerId !== actualCustomerId
  ) {
    throw new Error(`${context} belongs to another Stripe customer`);
  }
}

function assertDeletedCustomer(
  expectedCustomerId: string | null,
  actualCustomerId: string | null,
  context: string,
): void {
  if (
    !expectedCustomerId ||
    !actualCustomerId ||
    expectedCustomerId !== actualCustomerId
  ) {
    throw new Error(`${context} has no exact Stripe Customer match`);
  }
}

async function loadPaymentTombstoneByUser(
  supabase: ServiceClient,
  userId: string,
): Promise<PaymentTombstone | null> {
  const { data, error } = await supabase
    .from("payment_account_tombstones")
    .select("user_id,stripe_customer_id")
    .eq("user_id", userId)
    .maybeSingle();
  throwDb(error, "resolve deleted payment account");
  return (data as PaymentTombstone | null) ?? null;
}

async function resolvePaymentAccount(
  supabase: ServiceClient,
  candidateUserId: string | null,
  stripeCustomerId: string | null,
): Promise<PaymentAccount | null> {
  if (candidateUserId) {
    const { data, error } = await supabase
      .from("profiles")
      .select("id,stripe_customer_id,deletion_requested_at")
      .eq("id", candidateUserId)
      .maybeSingle();
    throwDb(error, "verify checkout profile");
    if (data?.id) {
      assertMatchingCustomer(
        data.stripe_customer_id,
        stripeCustomerId,
        "payment account",
      );
      if (!data.deletion_requested_at) {
        return {
          kind: "active",
          userId: data.id,
          stripeCustomerId: data.stripe_customer_id,
        };
      }

      // Do not fulfill while deletion is in its reversible phase. Once the
      // tombstone is durable, delayed events can be handled without access or
      // personal communications; otherwise a retry will resolve after abort.
      const tombstone = await loadPaymentTombstoneByUser(
        supabase,
        candidateUserId,
      );
      if (!tombstone) {
        throw new Error("payment account deletion is still in progress");
      }
      assertDeletedCustomer(
        tombstone.stripe_customer_id,
        stripeCustomerId,
        "deleted payment account",
      );
      return {
        kind: "deleted",
        userId: tombstone.user_id,
        stripeCustomerId: tombstone.stripe_customer_id,
      };
    }

    const tombstone = await loadPaymentTombstoneByUser(
      supabase,
      candidateUserId,
    );
    if (tombstone) {
      assertDeletedCustomer(
        tombstone.stripe_customer_id,
        stripeCustomerId,
        "deleted payment account",
      );
      return {
        kind: "deleted",
        userId: tombstone.user_id,
        stripeCustomerId: tombstone.stripe_customer_id,
      };
    }

    // An explicit application identity must never fall through to a different
    // profile which merely happens to match the provider customer.
    return null;
  }

  if (stripeCustomerId) {
    const { data, error } = await supabase
      .from("profiles")
      .select("id,stripe_customer_id,deletion_requested_at")
      .eq("stripe_customer_id", stripeCustomerId)
      .maybeSingle();
    throwDb(error, "resolve Stripe customer profile");
    if (data?.id) {
      if (data.deletion_requested_at) {
        const tombstone = await loadPaymentTombstoneByUser(supabase, data.id);
        if (!tombstone) {
          throw new Error("payment account deletion is still in progress");
        }
        return {
          kind: "deleted",
          userId: tombstone.user_id,
          stripeCustomerId: tombstone.stripe_customer_id,
        };
      }
      return {
        kind: "active",
        userId: data.id,
        stripeCustomerId: data.stripe_customer_id,
      };
    }

    const tombstoneResult = await supabase
      .from("payment_account_tombstones")
      .select("user_id,stripe_customer_id")
      .eq("stripe_customer_id", stripeCustomerId)
      .maybeSingle();
    throwDb(tombstoneResult.error, "resolve deleted Stripe customer");
    if (tombstoneResult.data) {
      const tombstone = tombstoneResult.data as PaymentTombstone;
      return {
        kind: "deleted",
        userId: tombstone.user_id,
        stripeCustomerId: tombstone.stripe_customer_id,
      };
    }
  }

  return null;
}

async function touchPaymentTombstone(
  supabase: ServiceClient,
  account: Extract<PaymentAccount, { kind: "deleted" }>,
  stripeCustomerId: string | null,
): Promise<void> {
  assertDeletedCustomer(
    account.stripeCustomerId,
    stripeCustomerId,
    "deleted payment event",
  );
  const touched = await supabase
    .from("payment_account_tombstones")
    .update({ last_payment_event_at: new Date().toISOString() })
    .eq("user_id", account.userId)
    .select("user_id")
    .maybeSingle();
  throwDb(touched.error, "touch deleted payment account");
  if (!touched.data) {
    throw new Error("deleted payment account no longer exists");
  }
}

async function cancelDeletedSubscription(
  supabase: ServiceClient,
  account: Extract<PaymentAccount, { kind: "deleted" }>,
  subscription: Stripe.Subscription,
): Promise<void> {
  const customerId = idFromExpandable(subscription.customer);
  if (
    subscription.metadata?.userId !== account.userId ||
    !customerId
  ) {
    throw new Error(`subscription ${subscription.id} owner is inconsistent`);
  }
  await touchPaymentTombstone(supabase, account, customerId);

  if (
    subscription.status === "canceled" ||
    subscription.status === "incomplete_expired"
  ) {
    return;
  }
  try {
    await stripe.subscriptions.cancel(subscription.id);
  } catch (error) {
    // A resource which no longer exists cannot bill again.
    if (!isStripeResourceMissing(error)) throw error;
  }
}

/**
 * Insert a financial row once. If another Stripe Event already wrote the same
 * session/payment intent, validate that it represents the same transaction and
 * reuse it so a failed first delivery can continue fulfillment on retry.
 */
async function recordPurchase(
  supabase: ServiceClient,
  input: PurchaseInput,
): Promise<{ purchase: PurchaseRecord; isNew: boolean }> {
  const fields =
    "id,user_id,type,series_slug,amount_cents,subtotal_cents,tax_cents,total_cents,currency,status,metadata,stripe_session_id,stripe_payment_intent";
  const { data, error } = await supabase
    .from("purchases")
    .insert({
      user_id: input.userId,
      stripe_session_id: input.stripeSessionId,
      stripe_payment_intent: input.stripePaymentIntent,
      type: input.type,
      series_slug: input.seriesSlug,
      amount_cents: input.totalCents,
      subtotal_cents: input.subtotalCents,
      tax_cents: input.taxCents,
      total_cents: input.totalCents,
      currency: input.currency,
      status: "completed",
      metadata: input.metadata,
    })
    .select(fields)
    .single();

  if (!error && data) {
    return { purchase: data as PurchaseRecord, isNew: true };
  }
  if (error?.code !== "23505") {
    throwDb(error, "record purchase");
    throw new Error("record purchase returned no row");
  }

  let existing: PurchaseRecord | null = null;
  const bySession = await supabase
    .from("purchases")
    .select(fields)
    .eq("stripe_session_id", input.stripeSessionId)
    .maybeSingle();
  throwDb(bySession.error, "load duplicate purchase by session");
  existing = (bySession.data as PurchaseRecord | null) ?? null;

  if (!existing && input.stripePaymentIntent) {
    const byIntent = await supabase
      .from("purchases")
      .select(fields)
      .eq("stripe_payment_intent", input.stripePaymentIntent)
      .maybeSingle();
    throwDb(byIntent.error, "load duplicate purchase by payment intent");
    existing = (byIntent.data as PurchaseRecord | null) ?? null;
  }

  if (!existing) {
    throw new Error("purchase uniqueness conflict could not be reconciled");
  }
  if (
    existing.type !== input.type ||
    existing.series_slug !== input.seriesSlug ||
    Number(existing.amount_cents ?? 0) !== input.totalCents ||
    Number(existing.subtotal_cents ?? 0) !== input.subtotalCents ||
    Number(existing.tax_cents ?? 0) !== input.taxCents ||
    Number(existing.total_cents ?? 0) !== input.totalCents ||
    (existing.currency ?? "usd") !== input.currency
  ) {
    throw new Error("duplicate provider identifier has conflicting purchase data");
  }
  if (existing.user_id && input.userId && existing.user_id !== input.userId) {
    throw new Error("duplicate provider identifier belongs to another user");
  }

  // Repair historical rows which predated authenticated checkout metadata.
  if (!existing.user_id && input.userId) {
    const repaired = await supabase
      .from("purchases")
      .update({ user_id: input.userId })
      .eq("id", existing.id)
      .is("user_id", null)
      .select(fields)
      .single();
    throwDb(repaired.error, "attach verified user to purchase");
    existing = repaired.data as PurchaseRecord;
  }

  return { purchase: existing, isNew: false };
}

async function detachDeletedPurchase(
  supabase: ServiceClient,
  purchaseId: string,
  metadata: Record<string, unknown>,
): Promise<void> {
  const detached = await supabase
    .from("purchases")
    .update({ user_id: null, metadata })
    .eq("id", purchaseId)
    .select("id")
    .maybeSingle();
  throwDb(detached.error, "detach deleted payment account from purchase");
  if (!detached.data) {
    throw new Error("purchase disappeared during account deletion");
  }
}

async function loadPurchaseById(
  supabase: ServiceClient,
  purchaseId: string,
): Promise<PurchaseRecord | null> {
  const result = await supabase
    .from("purchases")
    .select(
      "id,user_id,type,series_slug,amount_cents,subtotal_cents,tax_cents,total_cents,currency,status,metadata,stripe_session_id,stripe_payment_intent",
    )
    .eq("id", purchaseId)
    .maybeSingle();
  throwDb(result.error, "load payment purchase");
  return (result.data as PurchaseRecord | null) ?? null;
}

async function loadPurchaseByPaymentIntent(
  supabase: ServiceClient,
  paymentIntentId: string | null,
): Promise<PurchaseRecord | null> {
  if (!paymentIntentId) return null;
  const result = await supabase
    .from("purchases")
    .select(
      "id,user_id,type,series_slug,amount_cents,subtotal_cents,tax_cents,total_cents,currency,status,metadata,stripe_session_id,stripe_payment_intent",
    )
    .eq("stripe_payment_intent", paymentIntentId)
    .maybeSingle();
  throwDb(result.error, "load payment-intent purchase");
  return (result.data as PurchaseRecord | null) ?? null;
}

function vipPurchaseSubscriptionId(purchase: PurchaseRecord): string | null {
  const subscriptionId = purchase.metadata?.subscription_id;
  return purchase.type === "vip_renewal" && typeof subscriptionId === "string"
    ? subscriptionId
    : null;
}

async function blockPurchaseAccess(
  supabase: ServiceClient,
  purchase: PurchaseRecord,
): Promise<void> {
  if (purchase.type === "series_unlock") {
    const removed = await supabase
      .from("entitlements")
      .delete()
      .eq("purchase_id", purchase.id);
    throwDb(removed.error, "revoke disputed series entitlement");
    return;
  }

  const subscriptionId = vipPurchaseSubscriptionId(purchase);
  if (!subscriptionId || !purchase.user_id) return;
  const blocked = await supabase
    .from("profiles")
    .update({
      is_vip: false,
      vip_expires_at: null,
      vip_payment_blocked: true,
      vip_cancel_at_period_end: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", purchase.user_id)
    .eq("stripe_subscription_id", subscriptionId);
  throwDb(blocked.error, "block adverse VIP payment");
}

async function cancelVipForTerminalAdversePayment(
  purchase: PurchaseRecord,
): Promise<void> {
  const subscriptionId = vipPurchaseSubscriptionId(purchase);
  if (!subscriptionId || !purchase.user_id) return;

  let subscription: Stripe.Subscription;
  try {
    subscription = await stripe.subscriptions.retrieve(subscriptionId);
  } catch (error) {
    if (isStripeResourceMissing(error)) return;
    throw error;
  }
  if (
    subscription.metadata?.userId !== purchase.user_id ||
    !canonicalVipPlan(subscription)
  ) {
    throw new Error("Adverse VIP purchase has a non-canonical subscription");
  }
  if (
    subscription.status !== "canceled" &&
    subscription.status !== "incomplete_expired"
  ) {
    try {
      await stripe.subscriptions.cancel(subscription.id);
    } catch (error) {
      if (!isStripeResourceMissing(error)) throw error;
    }
  }
}

async function preventVipRenewalForOpenDispute(
  purchase: PurchaseRecord,
): Promise<void> {
  const subscriptionId = vipPurchaseSubscriptionId(purchase);
  if (!subscriptionId || !purchase.user_id) return;

  let subscription: Stripe.Subscription;
  try {
    subscription = await stripe.subscriptions.retrieve(subscriptionId);
  } catch (error) {
    if (isStripeResourceMissing(error)) return;
    throw error;
  }
  if (
    subscription.metadata?.userId !== purchase.user_id ||
    !canonicalVipPlan(subscription)
  ) {
    throw new Error("Disputed VIP purchase has a non-canonical subscription");
  }
  if (
    subscription.status !== "canceled" &&
    subscription.status !== "incomplete_expired" &&
    !subscription.cancel_at_period_end
  ) {
    await stripe.subscriptions.update(subscription.id, {
      cancel_at_period_end: true,
    });
  }
}

async function restoreVipAfterResolvedDispute(
  supabase: ServiceClient,
  purchase: PurchaseRecord,
): Promise<void> {
  const subscriptionId = vipPurchaseSubscriptionId(purchase);
  if (
    !subscriptionId ||
    !purchase.user_id ||
    (purchase.status !== "completed" &&
      purchase.status !== "partially_refunded")
  ) {
    return;
  }

  let subscription: Stripe.Subscription;
  try {
    subscription = await stripe.subscriptions.retrieve(subscriptionId);
  } catch (error) {
    if (isStripeResourceMissing(error)) return;
    throw error;
  }
  const customerId = idFromExpandable(subscription.customer);
  const account = await resolvePaymentAccount(
    supabase,
    purchase.user_id,
    customerId,
  );
  if (
    !account ||
    account.kind !== "active" ||
    account.userId !== purchase.user_id ||
    subscription.metadata?.userId !== purchase.user_id ||
    !canonicalVipPlan(subscription) ||
    (subscription.status !== "active" && subscription.status !== "trialing")
  ) {
    return;
  }
  const periodEnd = subscription.items.data[0]?.current_period_end
    ? new Date(
        subscription.items.data[0].current_period_end * 1000,
      ).toISOString()
    : null;
  const restored = await supabase.rpc(
    "restore_vip_access_after_payment_resolution",
    {
      p_purchase_id: purchase.id,
      p_user_id: purchase.user_id,
      p_subscription_id: subscription.id,
      p_expires_at: periodEnd,
      p_cancel_at_period_end: subscription.cancel_at_period_end,
    },
  );
  throwDb(restored.error, "restore resolved VIP payment");
  // false means another refund/dispute/account transition won the race. That
  // is a safe terminal result and must not be retried into stale access.
}

async function recordAnalytics(
  name:
    | "purchase_completed"
    | "subscription_started"
    | "subscription_renewed"
    | "subscription_cancelled"
    | "refund",
  properties: Parameters<typeof persistEvent>[1],
): Promise<void> {
  try {
    emitServerEvent(name, properties);
    await persistEvent(name, properties);
  } catch (error) {
    // Analytics must not make Stripe retry a successfully fulfilled payment.
    console.error(`[webhook] ${name} analytics failed:`, error);
  }
}

async function reconcilePurchaseProviderState(
  supabase: ServiceClient,
  purchase: PurchaseRecord,
  paymentIntentId: string,
  knownCharge?: Stripe.Charge,
): Promise<{
  charge: Stripe.Charge;
  accessAllowed: boolean;
  clean: boolean;
}> {
  const paymentIntent = knownCharge
    ? null
    : await stripe.paymentIntents.retrieve(paymentIntentId, {
        expand: ["latest_charge"],
      });
  const latestCharge = paymentIntent?.latest_charge;
  const charge = knownCharge
    ? knownCharge
    : typeof latestCharge === "string"
      ? await stripe.charges.retrieve(latestCharge)
      : latestCharge ?? null;
  if (!charge) throw new Error("Paid purchase has no provider charge");
  if (
    charge.status !== "succeeded" ||
    !charge.paid ||
    charge.amount !== Number(purchase.total_cents ?? purchase.amount_cents ?? 0) ||
    charge.currency !== (purchase.currency ?? "usd") ||
    !Number.isSafeInteger(charge.amount_refunded) ||
    charge.amount_refunded < 0 ||
    charge.amount_refunded > charge.amount
  ) {
    throw new Error("Provider charge conflicts with the purchase ledger");
  }

  const linkedRefunds = await supabase
    .from("stripe_refunds")
    .update({ purchase_id: purchase.id, updated_at: new Date().toISOString() })
    .eq("stripe_payment_intent", paymentIntentId)
    .is("purchase_id", null);
  throwDb(linkedRefunds.error, "link pre-existing refunds to purchase");

  const linkedDisputes = await supabase
    .from("stripe_disputes")
    .update({ purchase_id: purchase.id, updated_at: new Date().toISOString() })
    .eq("stripe_payment_intent", paymentIntentId)
    .is("purchase_id", null);
  throwDb(linkedDisputes.error, "link pre-existing disputes to purchase");
  const disputeStates = await supabase
    .from("stripe_disputes")
    .select("status")
    .eq("stripe_payment_intent", paymentIntentId);
  throwDb(disputeStates.error, "load linked dispute state");
  const hasLostDispute = (disputeStates.data ?? []).some(
    (dispute) => dispute.status === "lost",
  );
  const hasOpenDispute = (disputeStates.data ?? []).some(
    (dispute) =>
      dispute.status !== "won" &&
      dispute.status !== "warning_closed" &&
      dispute.status !== "prevented" &&
      dispute.status !== "lost",
  );
  const hasDisputeLedger = (disputeStates.data ?? []).length > 0;
  const providerDisputeBlocksAccess = hasDisputeLedger
    ? hasLostDispute || hasOpenDispute
    : charge.disputed;

  if (charge.amount_refunded > 0) {
    await reconcileChargeRefund(supabase, charge);
  }
  if (providerDisputeBlocksAccess) {
    const adverseStatus = hasLostDispute ? "disputed_lost" : "disputed";
    const disputed = await supabase
      .from("purchases")
      .update({ status: adverseStatus })
      .eq("id", purchase.id);
    throwDb(disputed.error, "mark purchase disputed");
    const adversePurchase = await loadPurchaseById(supabase, purchase.id);
    if (adversePurchase) {
      await blockPurchaseAccess(supabase, adversePurchase);
      if (hasLostDispute) {
        await cancelVipForTerminalAdversePayment(adversePurchase);
      } else {
        // Do not let a still-active subscription bill another period while its
        // prior payment is disputed and access is blocked. A later win may
        // restore paid-period access, but auto-renewal stays off until the user
        // affirmatively subscribes again.
        await preventVipRenewalForOpenDispute(adversePurchase);
      }
    }
  }

  return {
    charge,
    // A partial refund deliberately retains the purchased access. A full
    // refund or any unresolved/lost dispute does not.
    accessAllowed:
      charge.amount_refunded < charge.amount &&
      !providerDisputeBlocksAccess,
    clean:
      charge.amount_refunded === 0 &&
      !providerDisputeBlocksAccess,
  };
}

async function fulfillCheckout(
  supabase: ServiceClient,
  session: Stripe.Checkout.Session,
): Promise<void> {
  if (!isPaidCheckout(session)) {
    // Delayed payment methods are fulfilled only by
    // checkout.session.async_payment_succeeded.
    console.log(
      "[webhook] Checkout not paid; fulfillment deferred:",
      session.id,
      session.payment_status,
    );
    return;
  }

  const type = session.metadata?.type;
  if (type !== "series_unlock" && type !== "vip_subscription") {
    throw new Error(`unsupported checkout type: ${type || "missing"}`);
  }
  if (!stripeCheckoutTermsConsentSatisfied(session)) {
    throw new Error(`${type} checkout has no required Terms acceptance`);
  }
  const email = session.customer_details?.email ?? session.customer_email ?? null;
  const customerId = idFromExpandable(session.customer);
  const metadataUserId = session.metadata?.userId || null;
  const referenceUserId = session.client_reference_id || null;
  if (
    metadataUserId &&
    referenceUserId &&
    metadataUserId !== referenceUserId
  ) {
    throw new Error(`${type} checkout has conflicting user identities`);
  }
  const candidateUserId = metadataUserId || referenceUserId;
  if (!candidateUserId || !customerId) {
    throw new Error(`${type} checkout has no verified user`);
  }

  let seriesOfferIsCurrent = true;
  let seriesFinancials: PaymentFinancials | null = null;
  if (type === "series_unlock") {
    const seriesSlug = session.metadata?.seriesSlug;
    const series = seriesSlug ? getSeriesBySlug(seriesSlug) : undefined;
    if (
      !seriesSlug ||
      session.mode !== "payment"
    ) {
      throw new Error("series checkout does not match the canonical offer");
    }
    seriesFinancials = canonicalCheckoutFinancials(
      session,
      SERIES_UNLOCK_PRICE_CENTS,
    );
    // Catalog publication/free status can legitimately change after a buyer
    // paid but before Stripe delivers the webhook. Preserve and reconcile the
    // money, but do not grant access or send a product confirmation unless the
    // offer remains currently canonical.
    seriesOfferIsCurrent = !!series && isSeriesPurchasable(series);
  } else {
    const plan = session.metadata?.plan;
    if (plan !== "monthly" && plan !== "yearly") {
      throw new Error("VIP checkout has no canonical plan");
    }
    const selected = VIP_PLANS[plan];
    const subscriptionId = idFromExpandable(session.subscription);
    if (!subscriptionId) {
      throw new Error("VIP checkout is missing subscription or user identity");
    }
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const canonicalPlan = canonicalVipPlan(subscription);
    if (
      subscription.metadata?.userId !== candidateUserId ||
      idFromExpandable(subscription.customer) !== customerId ||
      session.mode !== "subscription" ||
      canonicalPlan !== plan
    ) {
      throw new Error("VIP checkout does not match the canonical offer");
    }
    canonicalCheckoutFinancials(session, selected.cents);

    const account = await resolvePaymentAccount(
      supabase,
      candidateUserId,
      customerId,
    );
    if (!account || account.userId !== candidateUserId) {
      throw new Error("VIP checkout has no verified payment account");
    }
    if (account.kind === "deleted") {
      await cancelDeletedSubscription(supabase, account, subscription);
      return;
    }
    await recordVipCheckoutConsent(supabase, session, subscription);
    if (
      subscription.status !== "active" &&
      subscription.status !== "trialing"
    ) {
      throw new Error(`VIP subscription is not active (${subscription.status})`);
    }

    const latestInvoiceId = idFromExpandable(subscription.latest_invoice);
    if (!latestInvoiceId) {
      throw new Error("VIP subscription has no paid invoice");
    }
    // Checkout completion is a recovery signal, not independent proof of
    // access. Fulfillment below validates the latest invoice and its current
    // Charge before activating VIP.
    const latestInvoice = await stripe.invoices.retrieve(latestInvoiceId);
    await fulfillPaidInvoice(supabase, latestInvoice);
    return;
  }

  const account = await resolvePaymentAccount(
    supabase,
    candidateUserId,
    customerId,
  );
  if (!account || account.userId !== candidateUserId) {
    throw new Error("series checkout has no verified payment account");
  }
  const paymentIntentId = idFromExpandable(session.payment_intent);
  if (!paymentIntentId) throw new Error("Series checkout has no payment intent");
  const seriesSlug = session.metadata?.seriesSlug;
  if (!seriesSlug) throw new Error("Series checkout has no series slug");
  if (!seriesFinancials) {
    throw new Error("Series checkout has no canonical financials");
  }
  const purchaseInput: PurchaseInput = {
    stripeSessionId: session.id,
    stripePaymentIntent: paymentIntentId,
    userId: account.kind === "active" ? account.userId : null,
    type: "series_unlock",
    seriesSlug,
    subtotalCents: seriesFinancials.subtotalCents,
    taxCents: seriesFinancials.taxCents,
    totalCents: seriesFinancials.totalCents,
    currency: session.currency || "usd",
    metadata:
      account.kind === "active"
        ? {
            checkout_type: "series_unlock",
            show_id: session.metadata?.show_id || seriesSlug,
            episode_count: session.metadata?.episodeCount,
            offer_currently_canonical: seriesOfferIsCurrent,
            tos_consent_policy: session.metadata?.tosConsentPolicy,
            terms_version: session.metadata?.termsVersion,
          }
        : { account_deleted: true },
  };
  const purchaseResult = await recordPurchase(supabase, purchaseInput);
  let purchase = purchaseResult.purchase;
  const isNew = purchaseResult.isNew;

  const paymentState = await getSeriesPaymentState(stripe, session);
  const providerState = await reconcilePurchaseProviderState(
    supabase,
    purchase,
    paymentState.paymentIntentId,
    paymentState.charge,
  );

  // Provider calls above can overlap an account-deletion request. Re-resolve
  // immediately before any access, analytics identity, or communication.
  const finalAccount = await resolvePaymentAccount(
    supabase,
    candidateUserId,
    customerId,
  );
  if (!finalAccount || finalAccount.userId !== candidateUserId) {
    throw new Error("series payment account disappeared during fulfillment");
  }
  if (finalAccount.kind === "active" && !purchase.user_id) {
    ({ purchase } = await recordPurchase(supabase, {
      ...purchaseInput,
      userId: finalAccount.userId,
    }));
  }

  if (finalAccount.kind === "deleted") {
    await detachDeletedPurchase(supabase, purchase.id, {
      account_deleted: true,
    });
    await touchPaymentTombstone(supabase, finalAccount, customerId);
    return;
  }
  if (isNew) {
    await recordAnalytics("purchase_completed", {
      revenue_cents: seriesFinancials.subtotalCents,
      currency: session.currency || "usd",
      purchase_type: "series_unlock",
      plan_type: "series_unlock",
      show_id: session.metadata?.show_id || session.metadata?.seriesSlug,
      stripe_session_id: session.id,
      user_id: finalAccount.userId,
    });
  }
  if (!providerState.accessAllowed) {
    console.warn(
      "[webhook] Withholding new access for refunded/disputed purchase:",
      session.id,
    );
    return;
  }
  if (!seriesOfferIsCurrent) {
    console.warn(
      "[webhook] Paid series offer is no longer purchasable; access withheld:",
      session.id,
      seriesSlug,
    );
    return;
  }

  const saved = await supabase.from("saved_list").upsert(
    {
      user_id: finalAccount.userId,
      series_slug: seriesSlug,
      created_at: new Date().toISOString(),
    },
    { onConflict: "user_id,series_slug" },
  );
  throwDb(saved.error, "add purchased series to saved list");

  await grantSeriesEntitlementForPurchase(
    supabase,
    purchase.id,
    finalAccount.userId,
    seriesSlug,
  );

  if (email) {
    const amount = `$${(seriesFinancials.totalCents / 100).toFixed(2)}`;
    const name = session.customer_details?.name || email.split("@")[0];
    await sendPurchaseConfirmation(email, name, "series_unlock", {
      seriesTitle:
        session.metadata?.seriesSlug
          ?.replace(/-/g, " ")
          .replace(/\b\w/g, (character) => character.toUpperCase()) ||
        "Series",
      amount,
    }, {
      idempotencyKey: `verza-series-unlock/${session.id}`,
      notifyTeam: isNew,
    });
  }
}

async function processSubscription(
  supabase: ServiceClient,
  subscription: Stripe.Subscription,
  allowActivation = false,
): Promise<PaymentAccount> {
  const customerId = idFromExpandable(subscription.customer);
  const metadataUserId = subscription.metadata?.userId;
  const plan = canonicalVipPlan(subscription);
  if (!customerId || !metadataUserId || !plan) {
    throw new Error(`subscription ${subscription.id} has no verified user`);
  }
  const account = await resolvePaymentAccount(
    supabase,
    metadataUserId,
    customerId,
  );
  if (!account || account.userId !== metadataUserId) {
    throw new Error(`subscription ${subscription.id} owner does not exist`);
  }
  if (account.kind === "deleted") {
    await cancelDeletedSubscription(supabase, account, subscription);
    return account;
  }

  const previous = await supabase
    .from("profiles")
    .select(
      "is_vip,stripe_subscription_id,vip_payment_blocked,vip_cancel_at_period_end",
    )
    .eq("id", account.userId)
    .single();
  throwDb(previous.error, "load prior VIP state");
  if (!previous.data) throw new Error("VIP profile disappeared during update");

  const derivedState = deriveVipPaymentState(subscription, {
    stripeSubscriptionId: previous.data.stripe_subscription_id,
    paymentBlocked: previous.data.vip_payment_blocked,
  });
  const { sameSubscription } = derivedState;
  // Subscription lifecycle events describe billing state, but can arrive
  // before invoice.paid and before an earlier refund/dispute event. They may
  // maintain or revoke already-proven access, never create it. Only a paid
  // invoice whose current Charge was reconciled may activate a new/current
  // subscription.
  if (!allowActivation && !sameSubscription) {
    return account;
  }
  const isActive =
    derivedState.isVip &&
    (allowActivation || (sameSubscription && previous.data.is_vip));
  const periodEnd = subscription.items.data[0]?.current_period_end
    ? new Date(
        subscription.items.data[0].current_period_end * 1000,
      ).toISOString()
    : null;
  let updateQuery = supabase
    .from("profiles")
    .update({
      is_vip: isActive,
      vip_expires_at: isActive ? periodEnd : null,
      vip_payment_blocked: sameSubscription
        ? previous.data.vip_payment_blocked
        : false,
      vip_cancel_at_period_end: isActive
        ? derivedState.cancelAtPeriodEnd
        : false,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", account.userId)
    .is("deletion_requested_at", null)
    .eq("vip_payment_blocked", previous.data.vip_payment_blocked);
  updateQuery = previous.data.stripe_subscription_id
    ? updateQuery.eq(
        "stripe_subscription_id",
        previous.data.stripe_subscription_id,
      )
    : updateQuery.is("stripe_subscription_id", null);
  const update = await updateQuery.select("id").maybeSingle();
  throwDb(update.error, "update VIP state");
  if (!update.data) {
    throw new Error("VIP account entered deletion during subscription update");
  }

  if (previous.data.is_vip && !isActive) {
    const planType = plan === "yearly" ? "vip_yearly" : "vip_monthly";
    await recordAnalytics("subscription_cancelled", {
      user_id: account.userId,
      plan_type: planType,
      stripe_session_id: subscription.id,
    });
  }

  // Retry from current provider state rather than relying on the one-time
  // profile transition: the profile update and external email cannot share a
  // transaction. The stable cancellation reference keeps retries idempotent.
  const terminallyCanceled =
    subscription.status === "canceled" ||
    subscription.status === "incomplete_expired";
  if (subscription.cancel_at_period_end || terminallyCanceled) {
    const contact = await vipCustomerContact(stripe, subscription);
    const periodEndEpoch =
      subscription.items.data[0]?.current_period_end ??
      subscription.canceled_at ??
      0;
    await sendDurableVipPaymentNotice(supabase, {
      type: "vip_cancellation_confirmation",
      providerReference: `${subscription.id}:${periodEndEpoch}:${
        terminallyCanceled ? "ended" : "scheduled"
      }`,
      subscriptionId: subscription.id,
      userId: account.userId,
      email: contact.email,
      name: contact.name,
      plan,
      recurringAmountCents: VIP_PLANS[plan].cents,
      periodEnd,
      termsVersion: subscription.metadata?.termsVersion ?? null,
      canceledAtPeriodEnd: !terminallyCanceled,
    });
  }
  return account;
}

function invoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  return idFromExpandable(invoice.parent?.subscription_details?.subscription);
}

async function invoicePaymentIntentId(
  invoice: Stripe.Invoice,
): Promise<string> {
  // The event snapshot's includable `payments` field is optional. Load the
  // provider collection directly and require the one-payment shape created by
  // canonical subscription Checkout; manual/out-of-band payments are not an
  // access grant path.
  const payments = await stripe.invoicePayments.list({
    invoice: invoice.id,
    status: "paid",
    limit: 10,
  });
  if (payments.has_more || payments.data.length !== 1) {
    throw new Error(`paid invoice ${invoice.id} has non-canonical payments`);
  }
  const invoicePayment = payments.data[0];
  const paymentIntentId = idFromExpandable(
    invoicePayment.payment.payment_intent,
  );
  if (
    !paymentIntentId ||
    invoicePayment.amount_paid !== invoice.amount_paid ||
    invoicePayment.currency !== invoice.currency ||
    idFromExpandable(invoicePayment.invoice) !== invoice.id
  ) {
    throw new Error(`paid invoice ${invoice.id} has no canonical PaymentIntent`);
  }
  return paymentIntentId;
}

async function fulfillPaidInvoice(
  supabase: ServiceClient,
  invoice: Stripe.Invoice,
): Promise<void> {
  const subscriptionId = invoiceSubscriptionId(invoice);
  if (!subscriptionId) return;

  const customerId = idFromExpandable(invoice.customer);
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const metadataUserId = subscription.metadata?.userId;
  const subscriptionCustomerId = idFromExpandable(subscription.customer);
  const invoicePlan = canonicalVipPlan(subscription);
  if (
    !metadataUserId ||
    !customerId ||
    subscriptionCustomerId !== customerId ||
    !invoicePlan ||
    invoice.currency !== "usd"
  ) {
    throw new Error(`paid invoice ${invoice.id} has no verified user`);
  }
  const financials = paidInvoiceFinancials(invoice);
  if (financials.subtotalCents !== VIP_PLANS[invoicePlan].cents) {
    throw new Error(`paid invoice ${invoice.id} does not match its VIP plan`);
  }

  // Resolve ownership without granting access. A paid invoice is an independent
  // recovery path, but the current Charge must be reconciled first.
  const subscriptionAccount = await resolvePaymentAccount(
    supabase,
    metadataUserId,
    customerId,
  );
  if (!subscriptionAccount || subscriptionAccount.userId !== metadataUserId) {
    throw new Error(`paid invoice ${invoice.id} has no verified payment account`);
  }

  const isFirstPayment = invoice.billing_reason === "subscription_create";
  if (subscriptionAccount.kind === "active") {
    await assertVipCheckoutConsentRecorded(
      supabase,
      subscription,
      subscriptionAccount.userId,
    );
  }
  const paymentIntentId = await invoicePaymentIntentId(invoice);
  const purchaseInput: PurchaseInput = {
    stripeSessionId: invoice.id,
    stripePaymentIntent: paymentIntentId,
    userId:
      subscriptionAccount.kind === "active"
        ? subscriptionAccount.userId
        : null,
    // Keep one stable financial-row type for every paid subscription invoice;
    // billing_reason below distinguishes acquisition from renewal analytics.
    type: "vip_renewal",
    seriesSlug: null,
    subtotalCents: financials.subtotalCents,
    taxCents: financials.taxCents,
    totalCents: financials.totalCents,
    currency: invoice.currency || "usd",
    metadata:
      subscriptionAccount.kind === "active"
        ? {
            subscription_id: subscriptionId,
            plan: invoicePlan,
            billing_reason: invoice.billing_reason,
            period_end: invoice.lines?.data?.[0]?.period?.end
              ? new Date(
                  invoice.lines.data[0].period.end * 1000,
                ).toISOString()
              : null,
            tos_consent_policy: subscription.metadata?.tosConsentPolicy,
            terms_version: subscription.metadata?.termsVersion,
          }
        : {
            account_deleted: true,
            subscription_id: subscriptionId,
            plan: invoicePlan,
            billing_reason: invoice.billing_reason,
            period_end: invoice.lines?.data?.[0]?.period?.end
              ? new Date(
                  invoice.lines.data[0].period.end * 1000,
                ).toISOString()
              : null,
          },
  };
  const purchaseResult = await recordPurchase(supabase, purchaseInput);
  let purchase = purchaseResult.purchase;
  const isNew = purchaseResult.isNew;
  const planType = invoicePlan === "yearly" ? "vip_yearly" : "vip_monthly";
  const eventName = isFirstPayment
    ? "subscription_started"
    : "subscription_renewed";

  const providerState = await reconcilePurchaseProviderState(
    supabase,
    purchase,
    paymentIntentId,
  );

  const finalAccount = await resolvePaymentAccount(
    supabase,
    metadataUserId,
    customerId,
  );
  if (!finalAccount || finalAccount.userId !== metadataUserId) {
    throw new Error(`paid invoice ${invoice.id} owner disappeared`);
  }
  if (finalAccount.kind === "active" && !purchase.user_id) {
    ({ purchase } = await recordPurchase(supabase, {
      ...purchaseInput,
      userId: finalAccount.userId,
    }));
  }
  if (finalAccount.kind === "deleted") {
    await detachDeletedPurchase(supabase, purchase.id, {
      account_deleted: true,
      subscription_id: subscriptionId,
      plan: invoicePlan,
      billing_reason: invoice.billing_reason,
      period_end: invoice.lines?.data?.[0]?.period?.end
        ? new Date(invoice.lines.data[0].period.end * 1000).toISOString()
        : null,
    });
    await cancelDeletedSubscription(supabase, finalAccount, subscription);
    return;
  }
  if (providerState.accessAllowed) {
    await processSubscription(supabase, subscription, true);
  }
  if (isNew) {
    await recordAnalytics(eventName, {
      revenue_cents: financials.subtotalCents,
      currency: invoice.currency || "usd",
      plan_type: planType,
      stripe_session_id: invoice.id,
      user_id: finalAccount.userId,
    });
  }

  // The notice ledger, not purchase insertion, is the delivery idempotency
  // boundary. A prior attempt can insert the purchase and fail before email.
  if (providerState.accessAllowed) {
    const contact = await vipCustomerContact(stripe, subscription);
    const periodEnd = invoice.lines?.data?.[0]?.period?.end
      ? new Date(invoice.lines.data[0].period.end * 1000).toISOString()
      : null;
    await sendDurableVipPaymentNotice(supabase, {
      type: isFirstPayment
        ? "vip_initial_acknowledgment"
        : "vip_renewal_receipt",
      providerReference: invoice.id,
      subscriptionId,
      userId: finalAccount.userId,
      email: contact.email,
      name: contact.name,
      plan: invoicePlan,
      recurringAmountCents: VIP_PLANS[invoicePlan].cents,
      chargedAmountCents: financials.totalCents,
      periodEnd,
      termsVersion: subscription.metadata?.termsVersion ?? null,
    });
  }
}

async function processFailedInvoice(
  supabase: ServiceClient,
  invoice: Stripe.Invoice,
): Promise<void> {
  const subscriptionId = invoiceSubscriptionId(invoice);
  if (!subscriptionId) return;

  const customerId = idFromExpandable(invoice.customer);
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  if (
    !customerId ||
    idFromExpandable(subscription.customer) !== customerId
  ) {
    throw new Error(`failed invoice ${invoice.id} has inconsistent ownership`);
  }

  // This deactivates an active account when Stripe has transitioned the
  // subscription out of active/trialing, and cancels any tombstoned account.
  await processSubscription(supabase, subscription);
  console.error(
    "[webhook] Invoice payment failed:",
    invoice.id,
    subscription.id,
  );
}

type RefundReconciliation = {
  purchase_id: string;
  purchase_user_id: string | null;
  purchase_type: string | null;
  purchase_session_id: string | null;
  purchase_amount_cents: number;
  purchase_subtotal_cents: number;
  purchase_tax_cents: number;
  purchase_total_cents: number;
  total_refunded_cents: number;
  refund_delta_cents: number;
  purchase_status: string;
};

async function reconcileChargeRefund(
  supabase: ServiceClient,
  charge: Stripe.Charge,
): Promise<RefundReconciliation | null> {
  const paymentIntentId = idFromExpandable(charge.payment_intent);
  if (!paymentIntentId) {
    console.warn("[webhook] Refunded charge has no payment intent:", charge.id);
    return null;
  }

  const reconciliation = await supabase.rpc("reconcile_purchase_refund", {
    p_payment_intent: paymentIntentId,
    p_refunded_cents: charge.amount_refunded || 0,
  });
  throwDb(reconciliation.error, "reconcile refunded purchase");
  const row = Array.isArray(reconciliation.data)
    ? reconciliation.data[0]
    : reconciliation.data;
  if (!row) {
    console.warn(
      "[webhook] Refund has no matching purchase:",
      paymentIntentId,
    );
    return null;
  }

  const result = row as RefundReconciliation;
  if (result.refund_delta_cents > 0) {
    const pretaxRefundDelta = pretaxRefundDeltaCents({
      subtotalCents: result.purchase_subtotal_cents,
      totalCents: result.purchase_total_cents,
      totalRefundedCents: result.total_refunded_cents,
      refundDeltaCents: result.refund_delta_cents,
    });
    await recordAnalytics("refund", {
      revenue_cents: -pretaxRefundDelta,
      currency: charge.currency || "usd",
      stripe_session_id: paymentIntentId,
      // Never recover an identity from Stripe billing details: purchase_user_id
      // is deliberately nulled when its application account is deleted.
      user_id: result.purchase_user_id || undefined,
    });
  }

  if (result.purchase_status === "refunded") {
    const purchase = await loadPurchaseById(supabase, result.purchase_id);
    if (purchase) {
      await cancelVipForTerminalAdversePayment(purchase);
    }
  }

  // Migration 010 atomically retains access for partial refunds, revokes a
  // fully refunded Series Unlock, and blocks a fully refunded VIP invoice.
  return result;
}

async function chargeForRefund(
  refund: Stripe.Refund,
): Promise<Stripe.Charge | null> {
  if (refund.charge && typeof refund.charge !== "string") return refund.charge;
  if (typeof refund.charge === "string") {
    return stripe.charges.retrieve(refund.charge);
  }

  const paymentIntentId = idFromExpandable(refund.payment_intent);
  if (!paymentIntentId) return null;
  const paymentIntent =
    refund.payment_intent && typeof refund.payment_intent !== "string"
      ? refund.payment_intent
      : await stripe.paymentIntents.retrieve(paymentIntentId);
  const chargeId = idFromExpandable(paymentIntent.latest_charge);
  return chargeId ? stripe.charges.retrieve(chargeId) : null;
}

async function processRefund(
  supabase: ServiceClient,
  refund: Stripe.Refund,
): Promise<void> {
  const charge = await chargeForRefund(refund);
  const paymentIntentId =
    idFromExpandable(refund.payment_intent) ??
    (charge ? idFromExpandable(charge.payment_intent) : null);
  let reconciliation: RefundReconciliation | null = null;

  if (refund.status === "succeeded" && charge) {
    reconciliation = await reconcileChargeRefund(supabase, charge);
  }

  const upsert = await supabase.from("stripe_refunds").upsert(
    {
      stripe_refund_id: refund.id,
      stripe_charge_id: charge?.id || idFromExpandable(refund.charge),
      stripe_payment_intent: paymentIntentId,
      purchase_id: reconciliation?.purchase_id ?? null,
      amount_cents: refund.amount,
      currency: refund.currency || "usd",
      status: refund.status || "unknown",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "stripe_refund_id" },
  );
  throwDb(upsert.error, "record Stripe refund");
}

async function processDispute(
  supabase: ServiceClient,
  event: Stripe.Event,
  eventDispute: Stripe.Dispute,
): Promise<void> {
  // Event snapshots can arrive out of order. Retrieve the provider's current
  // Dispute and expanded Charge so a delayed delivery cannot regress a won or
  // otherwise resolved case back to its earlier state.
  const dispute = await stripe.disputes.retrieve(eventDispute.id, {
    expand: ["charge"],
  });
  const charge =
    typeof dispute.charge === "string"
      ? await stripe.charges.retrieve(dispute.charge)
      : dispute.charge;
  if (
    dispute.id !== eventDispute.id ||
    dispute.livemode !== event.livemode ||
    charge.livemode !== event.livemode
  ) {
    throw new Error(`dispute ${eventDispute.id} provider state is inconsistent`);
  }

  const disputePaymentIntentId = idFromExpandable(dispute.payment_intent);
  const chargePaymentIntentId = idFromExpandable(charge.payment_intent);
  if (
    disputePaymentIntentId &&
    chargePaymentIntentId &&
    disputePaymentIntentId !== chargePaymentIntentId
  ) {
    throw new Error(`dispute ${dispute.id} has conflicting payment intents`);
  }

  const paymentIntentId =
    disputePaymentIntentId || chargePaymentIntentId;
  const candidatePurchase = await loadPurchaseByPaymentIntent(
    supabase,
    paymentIntentId,
  );
  const candidateSeries = candidatePurchase?.series_slug
    ? getSeriesBySlug(candidatePurchase.series_slug)
    : undefined;
  const restoreSeriesEntitlement = !!(
    candidatePurchase &&
    candidatePurchase.type === "series_unlock" &&
    candidatePurchase.user_id &&
    candidatePurchase.subtotal_cents === SERIES_UNLOCK_PRICE_CENTS &&
    candidatePurchase.currency === "usd" &&
    candidatePurchase.total_cents ===
      Number(candidatePurchase.subtotal_cents) +
        Number(candidatePurchase.tax_cents ?? 0) &&
    candidateSeries &&
    isSeriesPurchasable(candidateSeries)
  );

  const reconciliation = await supabase.rpc("reconcile_stripe_dispute", {
    p_dispute_id: dispute.id,
    p_charge_id: charge.id,
    p_payment_intent: paymentIntentId,
    p_amount_cents: dispute.amount,
    p_currency: dispute.currency,
    p_status: dispute.status,
    p_reason: dispute.reason,
    p_charge_disputed: charge.disputed,
    p_charge_refunded_cents: charge.amount_refunded || 0,
    p_event_created_at: event.created,
    p_event_id: event.id,
    p_restore_series_entitlement: restoreSeriesEntitlement,
  });
  throwDb(reconciliation.error, "reconcile Stripe dispute");
  const row = Array.isArray(reconciliation.data)
    ? reconciliation.data[0]
    : reconciliation.data;
  if (!row) {
    throw new Error(`dispute ${dispute.id} reconciliation returned no row`);
  }

  if (!row.linked_purchase_id) {
    // The financial row can legitimately arrive later than the dispute event;
    // Checkout fulfillment links this provider record and reconciles the
    // current Charge before granting any access.
    console.warn(
      "[webhook] Dispute recorded before matching purchase:",
      dispute.id,
    );
    return;
  }

  const purchase = await loadPurchaseById(supabase, row.linked_purchase_id);
  if (!purchase) {
    throw new Error(`dispute ${dispute.id} linked purchase disappeared`);
  }
  if (purchase.status === "disputed_lost") {
    await cancelVipForTerminalAdversePayment(purchase);
  } else if (purchase.status === "disputed") {
    await preventVipRenewalForOpenDispute(purchase);
  } else if (
    !charge.disputed &&
    (dispute.status === "won" ||
      dispute.status === "warning_closed" ||
      dispute.status === "prevented")
  ) {
    await restoreVipAfterResolvedDispute(supabase, purchase);
  }
}

async function processStripeEvent(
  supabase: ServiceClient,
  event: Stripe.Event,
): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded":
      await fulfillCheckout(
        supabase,
        event.data.object as Stripe.Checkout.Session,
      );
      break;

    case "checkout.session.async_payment_failed":
      console.error(
        "[webhook] Asynchronous checkout failed:",
        (event.data.object as Stripe.Checkout.Session).id,
      );
      break;

    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
    case "customer.subscription.paused":
    case "customer.subscription.resumed": {
      const snapshot = event.data.object as Stripe.Subscription;
      let current = snapshot;
      try {
        current = await stripe.subscriptions.retrieve(snapshot.id);
      } catch (error) {
        if (!isStripeResourceMissing(error)) throw error;
      }
      await processSubscription(supabase, current);
      break;
    }

    // Keep payment_succeeded for the currently configured endpoint; invoice.paid
    // is the recommended canonical event. Purchase-level uniqueness makes
    // enabling both safe during the configuration transition.
    case "invoice.paid":
    case "invoice.payment_succeeded":
      await fulfillPaidInvoice(supabase, event.data.object as Stripe.Invoice);
      break;

    case "invoice.payment_failed": {
      await processFailedInvoice(
        supabase,
        event.data.object as Stripe.Invoice,
      );
      break;
    }

    case "charge.refunded":
      await reconcileChargeRefund(
        supabase,
        event.data.object as Stripe.Charge,
      );
      break;

    case "refund.created":
    case "refund.updated":
    case "refund.failed":
      await processRefund(supabase, event.data.object as Stripe.Refund);
      break;

    case "charge.dispute.created":
    case "charge.dispute.updated":
    case "charge.dispute.closed":
    case "charge.dispute.funds_withdrawn":
    case "charge.dispute.funds_reinstated":
      await processDispute(
        supabase,
        event,
        event.data.object as Stripe.Dispute,
      );
      break;

    case "payment_intent.succeeded": {
      const intent = event.data.object as Stripe.PaymentIntent;
      console.log("[webhook] Payment succeeded:", intent.id, intent.amount);
      break;
    }

    case "payment_intent.payment_failed": {
      const intent = event.data.object as Stripe.PaymentIntent;
      console.error(
        "[webhook] Payment failed:",
        intent.id,
        intent.last_payment_error?.message,
      );
      break;
    }

    default:
      console.log("[webhook] Unhandled event type:", event.type);
  }
}

/**
 * POST /api/stripe/webhook
 * Signature-verifies, durably claims, and idempotently processes Stripe events.
 */
export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return Response.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    console.error("[webhook] Signature verification failed:", error);
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = getServiceClient();
  const claim = await supabase.rpc("claim_stripe_webhook_event", {
    p_event_id: event.id,
    p_event_type: event.type,
    p_object_id: stripeObjectId(event),
  });
  if (claim.error) {
    console.error("[webhook] Could not claim event:", claim.error);
    return Response.json({ error: "Could not claim event" }, { status: 500 });
  }
  if (claim.data === "processed") {
    return Response.json({ received: true, duplicate: true });
  }
  if (claim.data !== "acquired") {
    return Response.json(
      { error: "Event is already being processed" },
      { status: 503, headers: { "Retry-After": "30" } },
    );
  }

  try {
    await processStripeEvent(supabase, event);
    const completed = await supabase
      .from("stripe_webhook_events")
      .update({
        status: "processed",
        processed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_error: null,
      })
      .eq("event_id", event.id)
      .eq("status", "processing");
    throwDb(completed.error, "complete webhook event");
    return Response.json({ received: true });
  } catch (error) {
    const message = errorText(error).slice(0, 2000);
    console.error("[webhook] Processing failed:", event.id, error);
    const failed = await supabase
      .from("stripe_webhook_events")
      .update({
        status: "failed",
        last_error: message,
        updated_at: new Date().toISOString(),
      })
      .eq("event_id", event.id);
    if (failed.error) {
      console.error("[webhook] Could not persist failure:", failed.error);
    }
    return Response.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
