import Stripe from "stripe";
import { getUser } from "@/lib/auth";
import { getServiceClient } from "@/lib/supabase/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

/**
 * POST /api/account/delete
 *
 * Permanently deletes the signed-in user's account and associated personal
 * data. Required by Apple App Review Guideline 5.1.1(v): apps that support
 * account creation must let users initiate account deletion from within the
 * app.
 *
 * Removes: profile, watch progress, saved list, entitlements, push
 * subscriptions, and pending entitlements tied to the account email, then
 * deletes the auth user itself. Purchase records are retained (without the
 * account link) as required for financial/legal record-keeping.
 */
export async function POST() {
  try {
    const user = await getUser();
    if (!user) {
      return Response.json({ error: "Not signed in" }, { status: 401 });
    }

    const supabase = getServiceClient();

    // FIRST: cancel any active VIP subscription. Deleting the profile
    // destroys the only stripe_customer_id link — without this, the
    // subscription would keep billing a deleted account forever.
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("stripe_customer_id, stripe_subscription_id")
        .eq("id", user.id)
        .maybeSingle();
      if (profile?.stripe_subscription_id) {
        await stripe.subscriptions.cancel(profile.stripe_subscription_id).catch(() => {});
      }
      if (profile?.stripe_customer_id) {
        const subs = await stripe.subscriptions.list({
          customer: profile.stripe_customer_id,
          status: "active",
          limit: 10,
        });
        for (const sub of subs.data) {
          await stripe.subscriptions.cancel(sub.id).catch(() => {});
        }
      }
    } catch (e) {
      console.error("[account-delete] Subscription cancel check failed:", e);
      return Response.json(
        { error: "Could not cancel your active subscription — contact support@verzatv.com" },
        { status: 500 },
      );
    }

    // Creator accounts with recorded sales: deleting would cascade-destroy
    // the financial ledger (creator_sales) until migration 009 (ON DELETE
    // SET NULL) is applied to the live DB. Route those through support.
    try {
      const { data: creator } = await supabase
        .from("creators")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (creator?.id) {
        const { count } = await supabase
          .from("creator_sales")
          .select("id", { count: "exact", head: true })
          .eq("creator_id", creator.id);
        if ((count ?? 0) > 0) {
          return Response.json(
            { error: "Creator accounts with sales history are deleted by our team to preserve required financial records — email privacy@verzatv.com and we'll complete it within 30 days." },
            { status: 409 },
          );
        }
      }
    } catch (e) {
      console.error("[account-delete] Creator check failed:", e);
    }

    let hadFailure = false;
    const tables = [
      "watch_progress",
      "saved_list",
      "entitlements",
      "push_subscriptions",
    ] as const;

    for (const table of tables) {
      const { error } = await supabase.from(table).delete().eq("user_id", user.id);
      if (error) { hadFailure = true; console.error(`[account-delete] Failed to clear ${table}:`, error); }
    }

    // analytics_events keys user_id as plain text with no FK — no cascade.
    {
      const { error } = await supabase.from("analytics_events").delete().eq("user_id", user.id);
      if (error) { hadFailure = true; console.error("[account-delete] Failed to clear analytics_events:", error); }
    }

    if (user.email) {
      const { error } = await supabase
        .from("pending_entitlements")
        .delete()
        .eq("email", user.email.toLowerCase());
      if (error) { hadFailure = true; console.error("[account-delete] Failed to clear pending entitlements:", error); }
    }

    // Abort BEFORE the irreversible step if any personal-data wipe failed —
    // the route stays retryable and the account stays signed-in-able.
    if (hadFailure) {
      return Response.json(
        { error: "Deletion incomplete — please try again or contact support@verzatv.com" },
        { status: 500 },
      );
    }

    const { error: profileErr } = await supabase.from("profiles").delete().eq("id", user.id);
    if (profileErr) {
      console.error("[account-delete] Failed to delete profile:", profileErr);
      return Response.json(
        { error: "Deletion incomplete — please try again or contact support@verzatv.com" },
        { status: 500 },
      );
    }

    const { error: authErr } = await supabase.auth.admin.deleteUser(user.id);
    if (authErr) {
      console.error("[account-delete] Failed to delete auth user:", authErr);
      return Response.json({ error: "Deletion failed — contact support@verzatv.com" }, { status: 500 });
    }

    return Response.json({ ok: true });
  } catch (err) {
    console.error("[account-delete] Error:", err);
    return Response.json({ error: "Deletion failed — contact support@verzatv.com" }, { status: 500 });
  }
}
