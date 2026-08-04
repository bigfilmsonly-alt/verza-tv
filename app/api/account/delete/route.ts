import Stripe from "stripe";
import { getUser } from "@/lib/auth";
import { privateJson } from "@/lib/private-json";
import {
  isStripeResourceMissing,
  upsertPaymentAccountTombstone,
} from "@/lib/stripe-customer";
import { getServiceClient } from "@/lib/supabase/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
type ServiceClient = ReturnType<typeof getServiceClient>;

const TERMINAL_SUBSCRIPTION_STATUSES = new Set([
  "canceled",
  "incomplete_expired",
]);

const PURCHASE_IDENTITY_KEYS = new Set([
  "billing_email",
  "client_reference_id",
  "customer_email",
  "customer_name",
  "email",
  "name",
  "receipt_email",
  "user_id",
  "userId",
]);

function redactPurchaseIdentity(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactPurchaseIdentity);
  if (!value || typeof value !== "object") return value;

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([key]) => !PURCHASE_IDENTITY_KEYS.has(key))
      .map(([key, nested]) => [key, redactPurchaseIdentity(nested)]),
  );
}

function checkoutCustomerId(session: Stripe.Checkout.Session): string | null {
  return typeof session.customer === "string"
    ? session.customer
    : session.customer?.id ?? null;
}

function checkoutBelongsToUser(
  session: Stripe.Checkout.Session,
  userId: string,
  customerId: string | null,
): boolean {
  return (
    session.client_reference_id === userId ||
    session.metadata?.userId === userId ||
    (!!customerId && checkoutCustomerId(session) === customerId)
  );
}

async function listOpenUserCheckouts(
  userId: string,
  customerId: string | null,
): Promise<Stripe.Checkout.Session[]> {
  const sessions: Stripe.Checkout.Session[] = [];
  const list = stripe.checkout.sessions.list({
    ...(customerId ? { customer: customerId } : {}),
    status: "open",
    limit: 100,
  });
  for await (const session of list) {
    if (!checkoutBelongsToUser(session, userId, customerId)) continue;
    const boundUserId = session.metadata?.userId || session.client_reference_id;
    if (boundUserId && boundUserId !== userId) {
      throw new Error("Stripe Checkout belongs to another user");
    }
    sessions.push(session);
  }
  return sessions;
}

async function clearDeletionGuard(
  supabase: ServiceClient,
  userId: string,
): Promise<void> {
  const tombstone = await supabase
    .from("payment_account_tombstones")
    .delete()
    .eq("user_id", userId);
  if (tombstone.error && tombstone.error.code !== "42P01" && tombstone.error.code !== "PGRST205") {
    console.error("[account-delete] Could not clear payment tombstone:", tombstone.error);
  }
  const marker = await supabase
    .from("profiles")
    .update({
      deletion_requested_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);
  if (marker.error) {
    console.error("[account-delete] Could not clear deletion marker:", marker.error);
  }
}

/**
 * POST /api/account/delete
 *
 * Permanently deletes the signed-in user's account and associated personal
 * data. Required by Apple App Review Guideline 5.1.1(v): apps that support
 * account creation must let users initiate account deletion from within the
 * app.
 *
 * Removes: profile, watch progress, saved list, entitlements, push
 * subscriptions, then deletes the auth user itself. Purchase records are
 * retained (without the account link) as required for financial/legal
 * record-keeping. Email-keyed historical recovery records are not treated as
 * account-owned because this project's legacy autoconfirm setting does not
 * prove mailbox ownership; support clears them only after independent proof.
 */
export async function POST(request: Request) {
  try {
    const user = await getUser();
    if (!user) {
      return privateJson({ error: "Not signed in" }, { status: 401 });
    }

    // Native sends the exact account ID that was visible when the destructive
    // confirmation was accepted. Compare it with the authoritative bearer-token
    // identity before constructing the service client or writing a deletion
    // marker, so an A -> B session transition can never delete B on A's prompt.
    // An absent body remains accepted for already-shipped web/native clients.
    const rawBody = await request.json().catch(() => null) as {
      expectedUserId?: unknown;
    } | null;
    const suppliedExpectedUserId = rawBody?.expectedUserId;
    if (
      suppliedExpectedUserId !== undefined &&
      (typeof suppliedExpectedUserId !== "string" ||
        suppliedExpectedUserId.length === 0)
    ) {
      return privateJson({ error: "Invalid account confirmation" }, { status: 400 });
    }
    if (
      typeof suppliedExpectedUserId === "string" &&
      suppliedExpectedUserId !== user.id
    ) {
      return privateJson(
        { error: "Account changed. Please confirm deletion again." },
        { status: 409 },
      );
    }

    const supabase = getServiceClient();
    let deletionGuardSet = false;
    let authDeleted = false;

    try {

      // Close the checkout/delete race before touching Stripe. Checkout routes
      // read this service-owned marker both before and after session creation.
      const deletionMarker = await supabase
        .from("profiles")
        .update({
          deletion_requested_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)
        .select("id")
        .maybeSingle();
      if (deletionMarker.error || !deletionMarker.data) {
        throw new Error(
          `Could not mark deletion in progress: ${deletionMarker.error?.message ?? "missing profile"}`,
        );
      }
      deletionGuardSet = true;

      const profileResult = await supabase
        .from("profiles")
        .select("stripe_customer_id, stripe_subscription_id")
        .eq("id", user.id)
        .single();
      if (profileResult.error || !profileResult.data) {
        throw new Error(
          `Could not load billing profile: ${profileResult.error?.message ?? "missing profile"}`,
        );
      }
      const profile = profileResult.data;
      let customerId: string | null = profile.stripe_customer_id;

      // Invalidate every unpaid Checkout. If completion wins the race, the
      // session is no longer open and the tombstone below makes its delayed
      // webhook record money without granting access to the deleted account.
      let openSessions: Stripe.Checkout.Session[] = [];
      try {
        openSessions = await listOpenUserCheckouts(user.id, customerId);
      } catch (error) {
        if (!customerId || !isStripeResourceMissing(error)) throw error;
        customerId = null;
        openSessions = await listOpenUserCheckouts(user.id, null);
      }
      for (const session of openSessions) {
        try {
          await stripe.checkout.sessions.expire(session.id);
        } catch (error) {
          if (isStripeResourceMissing(error)) continue;
          const current = await stripe.checkout.sessions.retrieve(session.id);
          if (current.status === "open") throw error;
        }
      }

      const subscriptionIds = new Set<string>();
      if (profile?.stripe_subscription_id) subscriptionIds.add(profile.stripe_subscription_id);

      if (customerId) {
        try {
          for await (const subscription of stripe.subscriptions.list({
            customer: customerId,
            status: "all",
            limit: 100,
          })) {
            const owner = subscription.metadata?.userId;
            if (owner && owner !== user.id) {
              throw new Error("Stripe subscription belongs to another user");
            }
            subscriptionIds.add(subscription.id);
          }
        } catch (error) {
          if (!isStripeResourceMissing(error)) throw error;
          customerId = null;
        }
      }

      for (const subscriptionId of subscriptionIds) {
        let subscription: Stripe.Subscription;
        try {
          subscription = await stripe.subscriptions.retrieve(subscriptionId);
        } catch (error) {
          if (isStripeResourceMissing(error)) continue;
          throw error;
        }
        const owner = subscription.metadata?.userId;
        if (owner && owner !== user.id) {
          throw new Error("Stripe subscription belongs to another user");
        }
        if (!TERMINAL_SUBSCRIPTION_STATUSES.has(subscription.status)) {
          await stripe.subscriptions.cancel(subscription.id);
        }
      }

      // Survives profile/auth deletion by design. A delayed signed webhook can
      // now recognize the former account, preserve the financial row unlinked,
      // and cancel any subscription without restoring VIP or entitlements. The
      // RPC atomically coalesces a Customer provisioned by a checkout that lost
      // the deletion race, so this final provider pass cannot miss it.
      customerId = await upsertPaymentAccountTombstone(
        supabase,
        user.id,
        customerId,
      );

      const finalOpen = await listOpenUserCheckouts(user.id, customerId);
      for (const session of finalOpen) {
        try {
          await stripe.checkout.sessions.expire(session.id);
        } catch (error) {
          if (!isStripeResourceMissing(error)) throw error;
        }
      }
      if (customerId) {
        try {
          for await (const subscription of stripe.subscriptions.list({
            customer: customerId,
            status: "all",
            limit: 100,
          })) {
            const owner = subscription.metadata?.userId;
            if (owner && owner !== user.id) {
              throw new Error("Stripe subscription belongs to another user");
            }
            if (!TERMINAL_SUBSCRIPTION_STATUSES.has(subscription.status)) {
              await stripe.subscriptions.cancel(subscription.id);
            }
          }
        } catch (error) {
          if (!isStripeResourceMissing(error)) throw error;
        }
      }

      const remainingOpen = await listOpenUserCheckouts(user.id, customerId);
      if (remainingOpen.length > 0) {
        throw new Error("An open Stripe Checkout remains after expiration");
      }

      // Stripe keeps the immutable payment/refund ledger after Customer
      // deletion. Remove the live Customer object so its email and account UUID
      // are not retained as an active profile; the service-only tombstone above
      // keeps only the provider ID needed to classify delayed signed events.
      if (customerId) {
        try {
          await stripe.customers.del(customerId);
        } catch (error) {
          if (!isStripeResourceMissing(error)) throw error;
        }
      }

      let hadFailure = false;
      const tables = [
        "watch_progress",
        "saved_list",
        "entitlements",
        "push_subscriptions",
        "creator_signups",
        "feedback",
      ] as const;

      for (const table of tables) {
        const { error } = await supabase.from(table).delete().eq("user_id", user.id);
        const optionalLegacyTableMissing =
          table === "feedback" &&
          (error?.code === "42P01" || error?.code === "PGRST205");
        if (error && !optionalLegacyTableMissing) {
          hadFailure = true;
          console.error(`[account-delete] Failed to clear ${table}:`, error);
        }
      }

      // analytics_events keys user_id as plain text with no FK — no cascade.
      {
        const { error } = await supabase.from("analytics_events").delete().eq("user_id", user.id);
        if (error) { hadFailure = true; console.error("[account-delete] Failed to clear analytics_events:", error); }
      }

      if (hadFailure) {
        throw new Error("One or more personal-data tables could not be cleared");
      }

      // Purchase rows remain as a tax/refund ledger, but the account link and
      // checkout identity are not part of that minimum record. Scrub both
      // top-level and nested identity fields before the profile FK is nulled.
      const purchases = await supabase
        .from("purchases")
        .select("id, metadata")
        .eq("user_id", user.id);
      if (purchases.error) {
        throw new Error(`Could not load purchase ledger: ${purchases.error.message}`);
      }
      for (const purchase of purchases.data ?? []) {
        const redacted = await supabase
          .from("purchases")
          .update({ metadata: redactPurchaseIdentity(purchase.metadata) })
          .eq("id", purchase.id)
          .eq("user_id", user.id);
        if (redacted.error) {
          throw new Error(`Could not redact purchase ledger: ${redacted.error.message}`);
        }
      }

      // Delete Auth last. profiles.id cascades from auth.users, which in turn
      // nulls the purchase user_id and deletes remaining account-owned rows.
      // Keeping the profile until this succeeds means a transient Auth Admin
      // failure can clear the guard and be retried instead of orphaning a login.
      const { error: authErr } = await supabase.auth.admin.deleteUser(user.id);
      if (authErr) {
        throw new Error(`Could not delete auth user: ${authErr.message}`);
      }
      authDeleted = true;

      return privateJson({ ok: true });
    } finally {
      if (deletionGuardSet && !authDeleted) {
        await clearDeletionGuard(supabase, user.id);
      }
    }
  } catch (err) {
    console.error("[account-delete] Error:", err);
    return privateJson({ error: "Deletion failed — contact support@verzatv.com" }, { status: 500 });
  }
}
