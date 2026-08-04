import "server-only";
import type Stripe from "stripe";
import { getServiceClient } from "@/lib/supabase/server";

type ServiceClient = ReturnType<typeof getServiceClient>;

type ConsentRecord = {
  checkout_session_id: string;
  subscription_id: string;
  stripe_customer_id: string;
  user_id: string | null;
  terms_version: string;
  terms_accepted: boolean;
  provider_session_created_at: string;
};

const CONSENT_FIELDS =
  "checkout_session_id,subscription_id,stripe_customer_id,user_id,terms_version,terms_accepted,provider_session_created_at";

function objectId(
  value: string | { id: string } | null | undefined,
): string | null {
  return typeof value === "string" ? value : value?.id ?? null;
}

function expectedConsent(
  session: Stripe.Checkout.Session,
  subscription: Stripe.Subscription,
): ConsentRecord {
  const userId = session.metadata?.userId ?? session.client_reference_id;
  const sessionSubscriptionId = objectId(session.subscription);
  const customerId = objectId(session.customer);
  const subscriptionCustomerId = objectId(subscription.customer);
  const termsVersion = session.metadata?.termsVersion;

  if (
    session.metadata?.tosConsentPolicy !== "required" ||
    session.consent?.terms_of_service !== "accepted" ||
    session.status !== "complete" ||
    session.mode !== "subscription" ||
    session.metadata?.type !== "vip_subscription" ||
    !userId ||
    session.metadata?.userId !== userId ||
    session.client_reference_id !== userId ||
    !sessionSubscriptionId ||
    sessionSubscriptionId !== subscription.id ||
    !customerId ||
    customerId !== subscriptionCustomerId ||
    subscription.metadata?.userId !== userId ||
    !termsVersion ||
    subscription.metadata?.termsVersion !== termsVersion
  ) {
    throw new Error("VIP Checkout consent does not match its subscription");
  }

  return {
    checkout_session_id: session.id,
    subscription_id: subscription.id,
    stripe_customer_id: customerId,
    user_id: userId,
    terms_version: termsVersion,
    terms_accepted: true,
    provider_session_created_at: new Date(session.created * 1000).toISOString(),
  };
}

function assertSameConsent(
  existing: ConsentRecord,
  expected: ConsentRecord,
): void {
  const existingCreatedAt = new Date(
    existing.provider_session_created_at,
  ).getTime();
  const expectedCreatedAt = new Date(
    expected.provider_session_created_at,
  ).getTime();
  if (
    existing.checkout_session_id !== expected.checkout_session_id ||
    existing.subscription_id !== expected.subscription_id ||
    existing.stripe_customer_id !== expected.stripe_customer_id ||
    (existing.user_id !== null && existing.user_id !== expected.user_id) ||
    existing.terms_version !== expected.terms_version ||
    existing.terms_accepted !== true ||
    !Number.isFinite(existingCreatedAt) ||
    existingCreatedAt !== expectedCreatedAt
  ) {
    throw new Error("VIP Checkout consent conflicts with its durable record");
  }
}

/**
 * Persist Stripe's accepted Terms checkbox and the exact policy version before
 * any recovery path is allowed to activate the subscription.
 */
export async function recordVipCheckoutConsent(
  supabase: ServiceClient,
  session: Stripe.Checkout.Session,
  subscription: Stripe.Subscription,
): Promise<void> {
  const expected = expectedConsent(session, subscription);
  const inserted = await supabase
    .from("vip_checkout_consents")
    .insert(expected)
    .select(CONSENT_FIELDS)
    .single();

  if (!inserted.error && inserted.data) {
    assertSameConsent(inserted.data as ConsentRecord, expected);
    return;
  }
  if (inserted.error?.code !== "23505") {
    throw new Error(
      `Could not record VIP Checkout consent: ${
        inserted.error?.message ?? "missing row"
      }`,
    );
  }

  const [bySession, bySubscription] = await Promise.all([
    supabase
      .from("vip_checkout_consents")
      .select(CONSENT_FIELDS)
      .eq("checkout_session_id", expected.checkout_session_id)
      .maybeSingle(),
    supabase
      .from("vip_checkout_consents")
      .select(CONSENT_FIELDS)
      .eq("subscription_id", expected.subscription_id)
      .maybeSingle(),
  ]);
  if (bySession.error || bySubscription.error) {
    throw new Error(
      `Could not reconcile VIP Checkout consent: ${
        bySession.error?.message ??
        bySubscription.error?.message ??
        "database error"
      }`,
    );
  }
  const sessionRecord = (bySession.data as ConsentRecord | null) ?? null;
  const subscriptionRecord =
    (bySubscription.data as ConsentRecord | null) ?? null;
  if (
    !sessionRecord ||
    !subscriptionRecord ||
    sessionRecord.checkout_session_id !==
      subscriptionRecord.checkout_session_id
  ) {
    throw new Error("VIP Checkout consent uniqueness conflict is unsafe");
  }
  assertSameConsent(sessionRecord, expected);
}

/** First-payment invoice delivery can race Checkout completion. Fail closed. */
export async function assertVipCheckoutConsentRecorded(
  supabase: ServiceClient,
  subscription: Stripe.Subscription,
  userId: string,
): Promise<ConsentRecord> {
  const result = await supabase
    .from("vip_checkout_consents")
    .select(CONSENT_FIELDS)
    .eq("subscription_id", subscription.id)
    .maybeSingle();
  if (result.error || !result.data) {
    throw new Error(
      `VIP subscription has no durable Checkout consent: ${
        result.error?.message ?? "Checkout completion pending"
      }`,
    );
  }
  const consent = result.data as ConsentRecord;
  if (
    consent.user_id !== userId ||
    consent.stripe_customer_id !== objectId(subscription.customer) ||
    consent.terms_version !== subscription.metadata?.termsVersion ||
    consent.terms_accepted !== true
  ) {
    throw new Error("VIP subscription consent record is inconsistent");
  }
  return consent;
}
