import { timingSafeEqual } from "node:crypto";
import Stripe from "stripe";
import { VIP_PLANS } from "@/lib/config";
import { privateJson } from "@/lib/private-json";
import { getServiceClient } from "@/lib/supabase/server";
import { assertVipCheckoutConsentRecorded } from "@/lib/vip-checkout-consent-ledger";
import {
  sendDurableVipPaymentNotice,
  vipCustomerContact,
} from "@/lib/vip-payment-notices";
import { vipAnnualNoticeDeliveryReady } from "@/lib/vip-release-policy";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const DAY_MS = 24 * 60 * 60 * 1000;
const EARLIEST_NOTICE_MS = 45 * DAY_MS;
const LATEST_NOTICE_MS = 15 * DAY_MS;

type VipProfile = {
  id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  is_vip: boolean;
  vip_payment_blocked: boolean;
  vip_cancel_at_period_end: boolean;
  deletion_requested_at: string | null;
};

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim() ?? "";
  const header = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  if (secret.length < 16 || header.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(header), Buffer.from(expected));
}

function customerId(subscription: Stripe.Subscription): string | null {
  return typeof subscription.customer === "string"
    ? subscription.customer
    : subscription.customer?.id ?? null;
}

function canonicalPlan(
  subscription: Stripe.Subscription,
): "monthly" | "yearly" | null {
  const item = subscription.items.data[0];
  if (
    subscription.metadata?.type !== "vip_subscription" ||
    subscription.metadata?.userId === undefined ||
    subscription.items.data.length !== 1 ||
    !item ||
    item.price.currency !== "usd"
  ) {
    return null;
  }
  for (const plan of ["monthly", "yearly"] as const) {
    const expected = VIP_PLANS[plan];
    if (
      item.price.unit_amount === expected.cents &&
      item.price.recurring?.interval === expected.interval &&
      item.price.recurring?.interval_count === expected.intervalCount
    ) {
      return plan;
    }
  }
  return null;
}

async function sendAnnualNoticeWithRetries(
  supabase: ReturnType<typeof getServiceClient>,
  input: Parameters<typeof sendDurableVipPaymentNotice>[1],
): Promise<void> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      await sendDurableVipPaymentNotice(supabase, input);
      return;
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);
      // These states need time or human reconciliation; hammering them cannot
      // safely prove whether the provider accepted the first request.
      if (
        message.includes("already in progress") ||
        message.includes("requires manual delivery review") ||
        message.includes("automatic retry window expired")
      ) {
        throw error;
      }
      if (attempt < 3) {
        console.warn(
          `[vip-renewal-cron] Annual notice attempt ${attempt} failed; retrying with the same idempotency key`,
        );
      }
    }
  }
  throw lastError;
}

/**
 * Daily, idempotent application-owned annual reminder. One stable ledger key
 * is used per subscription period, so the whole 15–45 day window is safe to
 * re-run without duplicate customer email.
 */
export async function GET(request: Request) {
  if (!authorized(request)) {
    return privateJson({ error: "Unauthorized" }, { status: 401 });
  }
  if (!vipAnnualNoticeDeliveryReady()) {
    return privateJson(
      { error: "Annual VIP notice delivery is not release-ready" },
      { status: 503 },
    );
  }

  const supabase = getServiceClient();
  const subscriptions: Stripe.Subscription[] = [];
  try {
    for (const status of ["active", "trialing"] as const) {
      for await (const subscription of stripe.subscriptions.list({
        status,
        limit: 100,
      })) {
        subscriptions.push(subscription);
      }
    }
  } catch (error) {
    console.error("[vip-renewal-cron] Stripe subscription listing failed:", error);
    return privateJson(
      { error: "Could not load provider subscriptions" },
      { status: 500 },
    );
  }

  const now = Date.now();
  let eligible = 0;
  let skipped = 0;
  let failed = 0;

  for (const subscription of subscriptions) {
    try {
      if (subscription.metadata?.type !== "vip_subscription") {
        skipped += 1;
        continue;
      }
      const periodEndEpoch = subscription.items.data[0]?.current_period_end;
      if (subscription.cancel_at_period_end) {
        skipped += 1;
        continue;
      }
      const plan = canonicalPlan(subscription);
      if (plan === "monthly") {
        skipped += 1;
        continue;
      }
      const metadataUserId = subscription.metadata?.userId;
      const subscriptionCustomerId = customerId(subscription);
      if (
        subscription.status !== "active" ||
        !metadataUserId ||
        !subscriptionCustomerId ||
        plan !== "yearly" ||
        !periodEndEpoch
      ) {
        throw new Error("Provider has unsafe annual VIP billing state");
      }
      const profileResult = await supabase
        .from("profiles")
        .select(
          "id,stripe_customer_id,stripe_subscription_id,is_vip,vip_payment_blocked,vip_cancel_at_period_end,deletion_requested_at",
        )
        .eq("id", metadataUserId)
        .maybeSingle();
      if (profileResult.error || !profileResult.data) {
        throw new Error(
          `Annual VIP account is unavailable: ${
            profileResult.error?.message ?? "missing profile"
          }`,
        );
      }
      const profile = profileResult.data as VipProfile;
      if (
        profile.deletion_requested_at ||
        profile.stripe_subscription_id !== subscription.id ||
        profile.stripe_customer_id !== subscriptionCustomerId
      ) {
        throw new Error("Annual VIP provider/account ownership is inconsistent");
      }
      const periodEnd = new Date(periodEndEpoch * 1000).toISOString();
      const untilRenewal = periodEndEpoch * 1000 - now;
      const applicationStateDrift =
        !profile.is_vip ||
        profile.vip_payment_blocked ||
        profile.vip_cancel_at_period_end;
      if (
        untilRenewal < LATEST_NOTICE_MS ||
        untilRenewal > EARLIEST_NOTICE_MS
      ) {
        if (applicationStateDrift) {
          throw new Error("Annual VIP application billing state has drifted");
        }
        skipped += 1;
        continue;
      }

      await assertVipCheckoutConsentRecorded(
        supabase,
        subscription,
        profile.id,
      );
      const contact = await vipCustomerContact(stripe, subscription);
      await sendAnnualNoticeWithRetries(supabase, {
        type: "vip_annual_renewal_reminder",
        providerReference: `${subscription.id}:${periodEndEpoch}`,
        subscriptionId: subscription.id,
        userId: profile.id,
        email: contact.email,
        name: contact.name,
        plan: "yearly",
        recurringAmountCents: VIP_PLANS.yearly.cents,
        periodEnd,
        termsVersion: subscription.metadata?.termsVersion ?? null,
      });
      eligible += 1;
      if (applicationStateDrift) {
        throw new Error(
          "Annual reminder sent, but application access/billing state has drifted",
        );
      }
    } catch (error) {
      failed += 1;
      console.error(
        "[vip-renewal-cron] Reminder failed for a subscription:",
        error,
      );
    }
  }

  if (failed > 0) {
    return privateJson(
      { checked: subscriptions.length, eligible, skipped, failed },
      { status: 500 },
    );
  }
  return privateJson({ checked: subscriptions.length, eligible, skipped, failed });
}
