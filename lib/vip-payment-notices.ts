import "server-only";
import { createHash } from "node:crypto";
import type Stripe from "stripe";
import {
  sendVipCustomerNotice,
  type VipCustomerNoticeInput,
  type VipCustomerNoticeType,
} from "@/lib/email";
import { getServiceClient } from "@/lib/supabase/server";

type ServiceClient = ReturnType<typeof getServiceClient>;

type NoticeRecord = {
  id: string;
  notice_type: VipCustomerNoticeType;
  provider_reference: string;
  subscription_id: string;
  user_id: string | null;
  recipient_email_sha256: string;
  amount_cents: number;
  currency: string;
  period_end: string | null;
  terms_version: string | null;
  payload: Record<string, unknown>;
  status: "sending" | "sent" | "failed" | "needs_review";
  attempt_count: number;
  send_started_at: string;
  created_at: string;
  updated_at: string;
};

export type VipPaymentNotice = {
  type: VipCustomerNoticeType;
  providerReference: string;
  subscriptionId: string;
  userId: string;
  email: string;
  name: string;
  plan: "monthly" | "yearly";
  recurringAmountCents: number;
  chargedAmountCents?: number;
  periodEnd?: string | null;
  termsVersion?: string | null;
  canceledAtPeriodEnd?: boolean;
};

const NOTICE_FIELDS =
  "id,notice_type,provider_reference,subscription_id,user_id,recipient_email_sha256,amount_cents,currency,period_end,terms_version,payload,status,attempt_count,send_started_at,created_at,updated_at";
const RETRY_WINDOW_MS = 23 * 60 * 60 * 1000;
const STALE_LEASE_MS = 5 * 60 * 1000;

function normalizeEmail(email: string): string {
  const normalized = email.trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(normalized) || normalized.length > 320) {
    throw new Error("VIP notice has no valid customer email");
  }
  return normalized;
}

function emailDigest(email: string): string {
  return createHash("sha256").update(email).digest("hex");
}

function formatMoney(cents: number): string {
  if (!Number.isSafeInteger(cents) || cents < 0) {
    throw new Error("VIP notice amount is invalid");
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function formatDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) {
    throw new Error("VIP notice date is invalid");
  }
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function messageInput(input: VipPaymentNotice): VipCustomerNoticeInput {
  return {
    type: input.type,
    email: normalizeEmail(input.email),
    // Keep the provider-idempotent payload byte-stable even if the customer
    // edits their Stripe display name while a delivery is being retried.
    name: "there",
    planLabel: input.plan === "yearly" ? "Yearly" : "Monthly",
    recurringAmount: formatMoney(input.recurringAmountCents),
    chargedAmount:
      input.chargedAmountCents === undefined
        ? undefined
        : formatMoney(input.chargedAmountCents),
    renewalDate: formatDate(input.periodEnd),
    accessThrough: formatDate(input.periodEnd),
    termsVersion: input.termsVersion,
    canceledAtPeriodEnd: input.canceledAtPeriodEnd,
  };
}

function durablePayload(input: VipPaymentNotice): Record<string, unknown> {
  return {
    notice_version: "2026-08-03",
    product: "VERZA VIP",
    plan: input.plan,
    frequency: input.plan === "yearly" ? "year" : "month",
    recurring_amount_cents: input.recurringAmountCents,
    charged_amount_cents: input.chargedAmountCents ?? null,
    automatic_renewal: true,
    canceled_at_period_end: input.canceledAtPeriodEnd ?? null,
    cancellation_url: "https://www.verzatv.com/me",
    cancellation_policy_url: "https://www.verzatv.com/refund-policy",
    terms_url: "https://www.verzatv.com/terms",
    support_email: "support@verzatv.com",
  };
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableJson).join(",")}]`;
  }
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).sort(
      ([left], [right]) => left.localeCompare(right),
    );
    return `{${entries
      .map(([key, entry]) => `${JSON.stringify(key)}:${stableJson(entry)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value) ?? "undefined";
}

function assertSameNotice(
  record: NoticeRecord,
  expected: Omit<NoticeRecord, "id" | "status" | "attempt_count" | "send_started_at" | "created_at" | "updated_at">,
): void {
  const samePeriodEnd =
    record.period_end === expected.period_end ||
    (record.period_end !== null &&
      expected.period_end !== null &&
      Number.isFinite(new Date(record.period_end).getTime()) &&
      new Date(record.period_end).getTime() ===
        new Date(expected.period_end).getTime());
  if (
    record.notice_type !== expected.notice_type ||
    record.provider_reference !== expected.provider_reference ||
    record.subscription_id !== expected.subscription_id ||
    (record.user_id !== null && record.user_id !== expected.user_id) ||
    record.recipient_email_sha256 !== expected.recipient_email_sha256 ||
    Number(record.amount_cents) !== expected.amount_cents ||
    record.currency !== expected.currency ||
    !samePeriodEnd ||
    record.terms_version !== expected.terms_version ||
    stableJson(record.payload) !== stableJson(expected.payload)
  ) {
    throw new Error("VIP notice conflicts with its durable ledger record");
  }
}

async function acquireNotice(
  supabase: ServiceClient,
  input: VipPaymentNotice,
): Promise<{ record: NoticeRecord; shouldSend: boolean }> {
  const normalizedEmail = normalizeEmail(input.email);
  const expected = {
    notice_type: input.type,
    provider_reference: input.providerReference,
    subscription_id: input.subscriptionId,
    user_id: input.userId,
    recipient_email_sha256: emailDigest(normalizedEmail),
    amount_cents: input.chargedAmountCents ?? input.recurringAmountCents,
    currency: "usd",
    period_end: input.periodEnd ?? null,
    terms_version: input.termsVersion ?? null,
    payload: durablePayload(input),
  };
  const inserted = await supabase
    .from("payment_notices")
    .insert(expected)
    .select(NOTICE_FIELDS)
    .single();
  if (!inserted.error && inserted.data) {
    return { record: inserted.data as NoticeRecord, shouldSend: true };
  }
  if (inserted.error?.code !== "23505") {
    throw new Error(
      `Could not claim VIP notice: ${inserted.error?.message ?? "missing row"}`,
    );
  }

  const existing = await supabase
    .from("payment_notices")
    .select(NOTICE_FIELDS)
    .eq("notice_type", input.type)
    .eq("provider_reference", input.providerReference)
    .maybeSingle();
  if (existing.error || !existing.data) {
    throw new Error(
      `Could not reconcile VIP notice: ${
        existing.error?.message ?? "missing row"
      }`,
    );
  }
  const record = existing.data as NoticeRecord;
  assertSameNotice(record, expected);
  if (record.status === "sent") return { record, shouldSend: false };
  if (record.status === "needs_review") {
    throw new Error("VIP notice requires manual delivery review");
  }

  const now = Date.now();
  const createdAt = new Date(record.created_at).getTime();
  const sendStartedAt = new Date(record.send_started_at).getTime();
  if (
    !Number.isFinite(createdAt) ||
    !Number.isFinite(sendStartedAt) ||
    now - createdAt >= RETRY_WINDOW_MS
  ) {
    const review = await supabase
      .from("payment_notices")
      .update({
        status: "needs_review",
        last_error: "Automatic retry window expired before delivery was proven",
        updated_at: new Date().toISOString(),
      })
      .eq("id", record.id)
      .in("status", ["sending", "failed"]);
    if (review.error) {
      throw new Error(`Could not quarantine VIP notice: ${review.error.message}`);
    }
    throw new Error("VIP notice automatic retry window expired");
  }
  if (record.status === "sending" && now - sendStartedAt < STALE_LEASE_MS) {
    throw new Error("VIP notice delivery is already in progress");
  }

  const reacquiredAt = new Date().toISOString();
  const reacquired = await supabase
    .from("payment_notices")
    .update({
      status: "sending",
      attempt_count: record.attempt_count + 1,
      send_started_at: reacquiredAt,
      updated_at: reacquiredAt,
      last_error: null,
    })
    .eq("id", record.id)
    .eq("status", record.status)
    .eq("updated_at", record.updated_at)
    .select(NOTICE_FIELDS)
    .maybeSingle();
  if (reacquired.error) {
    throw new Error(`Could not reacquire VIP notice: ${reacquired.error.message}`);
  }
  if (!reacquired.data) {
    throw new Error("VIP notice delivery was claimed concurrently");
  }
  return { record: reacquired.data as NoticeRecord, shouldSend: true };
}

function resendIdempotencyKey(input: VipPaymentNotice): string {
  const referenceHash = createHash("sha256")
    .update(`${input.type}:${input.providerReference}`)
    .digest("hex");
  return `verza-vip/${input.type}/${referenceHash}`;
}

/**
 * Send once with two layers of deduplication: a durable Postgres unique claim
 * and Resend's stable request idempotency key. Records older than Resend's
 * retry window are quarantined instead of risking a duplicate notice.
 */
export async function sendDurableVipPaymentNotice(
  supabase: ServiceClient,
  input: VipPaymentNotice,
): Promise<void> {
  const claim = await acquireNotice(supabase, input);
  if (!claim.shouldSend) return;

  let providerMessageId: string;
  try {
    providerMessageId = await sendVipCustomerNotice(
      messageInput(input),
      resendIdempotencyKey(input),
    );
  } catch (error) {
    const failed = await supabase
      .from("payment_notices")
      .update({
        status: "failed",
        last_error: (error instanceof Error ? error.message : String(error)).slice(
          0,
          2000,
        ),
        updated_at: new Date().toISOString(),
      })
      .eq("id", claim.record.id)
      .eq("status", "sending");
    if (failed.error) {
      console.error("[vip-notice] Could not record send failure:", failed.error);
    }
    throw error;
  }

  const sentAt = new Date().toISOString();
  const completed = await supabase
    .from("payment_notices")
    .update({
      status: "sent",
      sent_at: sentAt,
      provider_message_id: providerMessageId,
      last_error: null,
      updated_at: sentAt,
    })
    .eq("id", claim.record.id)
    .eq("status", "sending")
    .select("id")
    .maybeSingle();
  if (completed.error || !completed.data) {
    throw new Error(
      `VIP notice was sent but its ledger did not finalize: ${
        completed.error?.message ?? "state changed"
      }`,
    );
  }
}

export async function vipCustomerContact(
  stripe: Stripe,
  subscription: Stripe.Subscription,
): Promise<{ email: string; name: string }> {
  const customer =
    typeof subscription.customer === "string"
      ? await stripe.customers.retrieve(subscription.customer)
      : subscription.customer;
  if (!customer || customer.deleted) {
    throw new Error("VIP subscription customer is unavailable");
  }
  const email = normalizeEmail(customer.email ?? "");
  return {
    email,
    name: customer.name?.trim() || email.split("@")[0] || "there",
  };
}
