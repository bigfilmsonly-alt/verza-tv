import "server-only";
import Stripe from "stripe";
import { getServiceClient } from "@/lib/supabase/server";
import { stripeIdempotencyKey } from "@/lib/stripe-idempotency";

type ServiceClient = ReturnType<typeof getServiceClient>;

type PaymentTombstoneRow = {
  user_id: string;
  stripe_customer_id: string | null;
};

const TERMINAL_SUBSCRIPTION_STATUSES = new Set([
  "canceled",
  "incomplete_expired",
]);

export function isStripeResourceMissing(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "resource_missing"
  );
}

/** Atomically preserve the first non-null Customer id for a deleting account. */
export async function upsertPaymentAccountTombstone(
  supabase: ServiceClient,
  userId: string,
  stripeCustomerId: string | null,
): Promise<string | null> {
  const result = await supabase.rpc("upsert_payment_account_tombstone", {
    p_user_id: userId,
    p_stripe_customer_id: stripeCustomerId,
  });
  if (result.error) {
    throw new Error(
      `Could not preserve payment tombstone: ${result.error.message}`,
    );
  }
  const row = (Array.isArray(result.data) ? result.data[0] : result.data) as
    | PaymentTombstoneRow
    | null;
  if (!row || row.user_id !== userId) {
    throw new Error("Payment tombstone upsert returned no matching account");
  }
  if (
    stripeCustomerId &&
    row.stripe_customer_id &&
    row.stripe_customer_id !== stripeCustomerId
  ) {
    throw new Error("Payment tombstone belongs to another Stripe Customer");
  }
  return row.stripe_customer_id;
}

/**
 * A Customer provisioned by this checkout must not survive if account deletion
 * wins before the profile link. Clean any cached concurrent provider resources,
 * then remove the Customer's live email/metadata object.
 */
async function cleanProvisionedCustomer(
  client: Stripe,
  customerId: string,
  userId: string,
): Promise<void> {
  for await (const session of client.checkout.sessions.list({
    customer: customerId,
    status: "open",
    limit: 100,
  })) {
    const owner = session.metadata?.userId || session.client_reference_id;
    if (owner && owner !== userId) {
      throw new Error("Provisioned Checkout belongs to another account");
    }
    try {
      await client.checkout.sessions.expire(session.id);
    } catch (error) {
      if (isStripeResourceMissing(error)) continue;
      const current = await client.checkout.sessions.retrieve(session.id);
      if (current.status === "open") throw error;
    }
  }

  for await (const subscription of client.subscriptions.list({
    customer: customerId,
    status: "all",
    limit: 100,
  })) {
    const owner = subscription.metadata?.userId;
    if (owner && owner !== userId) {
      throw new Error("Provisioned subscription belongs to another account");
    }
    if (!TERMINAL_SUBSCRIPTION_STATUSES.has(subscription.status)) {
      try {
        await client.subscriptions.cancel(subscription.id);
      } catch (error) {
        if (!isStripeResourceMissing(error)) throw error;
      }
    }
  }

  try {
    await client.customers.del(customerId);
  } catch (error) {
    if (!isStripeResourceMissing(error)) throw error;
  }
}

async function provisionStripeCustomer(
  client: Stripe,
  user: { id: string; email: string },
  priorCustomerId: string | null,
): Promise<Stripe.Customer> {
  let priorKey = priorCustomerId ?? "no-prior-customer";
  for (let attempt = 0; attempt < 3; attempt++) {
    const created = await client.customers.create(
      {
        email: user.email,
        metadata: { userId: user.id, type: "verza_user" },
      },
      {
        // Including a deleted response's id gives retries a fresh, but still
        // deterministic, key. This matters if account deletion removes a
        // just-created Customer and later aborts while Stripe still caches the
        // original idempotent create response.
        idempotencyKey: stripeIdempotencyKey(
          "verza-customer-v2",
          user.id,
          priorKey,
          attempt,
        ),
      },
    );
    try {
      const verified = await client.customers.retrieve(created.id);
      if (!("deleted" in verified && verified.deleted)) return verified;
    } catch (error) {
      if (!isStripeResourceMissing(error)) throw error;
    }
    priorKey = `deleted:${created.id}`;
  }
  throw new Error("Could not provision a live Stripe Customer");
}

/**
 * Every digital Checkout is attached to a persisted, user-bound Customer so
 * account deletion can find and expire open sessions before deleting the user.
 */
export async function ensureStripeCustomer(
  supabase: ServiceClient,
  client: Stripe,
  user: { id: string; email: string },
  existingCustomerId: string | null,
): Promise<string> {
  if (!user.email) throw new Error("A verified account email is required");

  // Re-read the deletion marker inside this helper before any provider write.
  // Route-level checks alone leave a window between profile read and Customer
  // creation. Also reject a stale caller-supplied Customer id.
  const initialProfile = await supabase
    .from("profiles")
    .select("stripe_customer_id,deletion_requested_at")
    .eq("id", user.id)
    .maybeSingle();
  if (initialProfile.error || !initialProfile.data) {
    throw new Error(
      `Could not verify billing profile: ${initialProfile.error?.message ?? "missing profile"}`,
    );
  }
  if (initialProfile.data.deletion_requested_at) {
    throw new Error("Account deletion is in progress");
  }
  if (
    existingCustomerId &&
    initialProfile.data.stripe_customer_id &&
    existingCustomerId !== initialProfile.data.stripe_customer_id
  ) {
    throw new Error("Billing profile changed during checkout");
  }
  existingCustomerId =
    initialProfile.data.stripe_customer_id ?? existingCustomerId;

  let customer: Stripe.Customer | null = null;
  let provisionedCustomer = false;
  if (existingCustomerId) {
    try {
      const retrieved = await client.customers.retrieve(existingCustomerId);
      if ("deleted" in retrieved && retrieved.deleted) {
        throw new Error(
          "Stored Stripe Customer was deleted; billing history requires support review",
        );
      }
      customer = retrieved;
    } catch (error) {
      if (isStripeResourceMissing(error)) {
        // Replacing a persisted Customer would detach this account from its
        // durable Checkout history. If an earlier payment succeeded while both
        // webhook and return fulfillment failed, a fresh Customer could then
        // be charged again after idempotency retention. Preserve the link and
        // fail closed for support instead.
        throw new Error(
          "Stored Stripe Customer is unavailable; billing history requires support review",
        );
      }
      throw error;
    }
  }

  if (customer) {
    const owner = customer.metadata?.userId;
    if (owner && owner !== user.id) {
      throw new Error("Stripe Customer belongs to another user");
    }
    if (
      !owner &&
      customer.email &&
      customer.email.toLowerCase() !== user.email.toLowerCase()
    ) {
      throw new Error("Stripe Customer email does not match the account");
    }
    if (!owner || !customer.email) {
      customer = await client.customers.update(customer.id, {
        email: customer.email || user.email,
        metadata: { ...customer.metadata, userId: user.id },
      });
    }
  } else {
    customer = await provisionStripeCustomer(
      client,
      user,
      existingCustomerId,
    );
    provisionedCustomer = true;
  }
  const customerId = customer.id;

  const persistCustomerLink = async (expectedCustomerId: string | null) => {
    let update = supabase
      .from("profiles")
      .update({
        stripe_customer_id: customerId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)
      .is("deletion_requested_at", null);
    update = expectedCustomerId
      ? update.eq("stripe_customer_id", expectedCustomerId)
      : update.is("stripe_customer_id", null);
    return update.select("id").maybeSingle();
  };

  // Compare-and-link against the exact profile state we observed. This must
  // never overwrite a Customer concurrently linked by another checkout.
  const linked = await persistCustomerLink(
    initialProfile.data.stripe_customer_id,
  );
  if (!linked.error && linked.data) return customerId;

  // Determine whether deletion really won before creating a durable tombstone
  // or deleting a provider object. An ordinary DB/link conflict must not be
  // mistaken for account deletion.
  const latestProfile = await supabase
    .from("profiles")
    .select("stripe_customer_id,deletion_requested_at")
    .eq("id", user.id)
    .maybeSingle();
  if (latestProfile.error) {
    throw new Error(
      `Could not recheck Stripe Customer link: ${latestProfile.error.message}`,
    );
  }
  let checkedProfile = latestProfile.data;
  if (checkedProfile && !checkedProfile.deletion_requested_at) {
    // A timed-out update may actually have committed; accept only an exact
    // observed link.
    if (checkedProfile.stripe_customer_id === customerId) {
      return customerId;
    }

    // Deletion may have set the marker just long enough to block the first
    // link, then aborted and cleared it. Retry only while the profile still has
    // no Customer, preserving compare-and-swap semantics.
    if (checkedProfile.stripe_customer_id === null) {
      const retryLinked = await persistCustomerLink(null);
      if (!retryLinked.error && retryLinked.data) return customerId;

      const finalProfile = await supabase
        .from("profiles")
        .select("stripe_customer_id,deletion_requested_at")
        .eq("id", user.id)
        .maybeSingle();
      if (finalProfile.error) {
        // The provider object cannot safely be removed until its link state is
        // known, so leave it for a later deterministic retry.
        throw new Error(
          `Could not verify retried Stripe Customer link: ${finalProfile.error.message}`,
        );
      }
      checkedProfile = finalProfile.data;
      if (
        checkedProfile &&
        !checkedProfile.deletion_requested_at &&
        checkedProfile.stripe_customer_id === customerId
      ) {
        return customerId;
      }
    }

    if (checkedProfile && !checkedProfile.deletion_requested_at) {
      // An active profile linked a different Customer (or remained unlinked).
      // A newly provisioned object is not authoritative and must not retain
      // the account's email/metadata as an orphan.
      if (provisionedCustomer) {
        await cleanProvisionedCustomer(client, customerId, user.id);
      }
      throw new Error(
        `Could not persist Stripe Customer: ${linked.error?.message ?? "billing profile changed"}`,
      );
    }
  }

  if (checkedProfile && !checkedProfile.deletion_requested_at) {
    throw new Error(
      `Could not persist Stripe Customer: ${linked.error?.message ?? "billing profile changed"}`,
    );
  }

  if (provisionedCustomer) {
    await upsertPaymentAccountTombstone(supabase, user.id, customerId);
    await cleanProvisionedCustomer(client, customerId, user.id);
  }
  throw new Error("Account deletion won the Stripe Customer link race");
}

/** Expire an unreturned session if account deletion won the race. */
export async function checkoutAccountStillActive(
  supabase: ServiceClient,
  client: Stripe,
  userId: string,
  session: Stripe.Checkout.Session,
): Promise<boolean> {
  const profile = await supabase
    .from("profiles")
    .select("deletion_requested_at")
    .eq("id", userId)
    .maybeSingle();
  if (profile.error) {
    throw new Error(`Could not recheck account state: ${profile.error.message}`);
  }
  if (profile.data && !profile.data.deletion_requested_at) return true;

  if (session.status === "open") {
    await client.checkout.sessions.expire(session.id);
  }
  return false;
}
