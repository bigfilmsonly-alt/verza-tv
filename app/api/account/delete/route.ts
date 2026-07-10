import { getUser } from "@/lib/auth";
import { getServiceClient } from "@/lib/supabase/server";

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

    const tables = [
      "watch_progress",
      "saved_list",
      "entitlements",
      "push_subscriptions",
    ] as const;

    for (const table of tables) {
      const { error } = await supabase.from(table).delete().eq("user_id", user.id);
      if (error) console.error(`[account-delete] Failed to clear ${table}:`, error);
    }

    if (user.email) {
      const { error } = await supabase
        .from("pending_entitlements")
        .delete()
        .ilike("email", user.email);
      if (error) console.error("[account-delete] Failed to clear pending entitlements:", error);
    }

    const { error: profileErr } = await supabase.from("profiles").delete().eq("id", user.id);
    if (profileErr) console.error("[account-delete] Failed to delete profile:", profileErr);

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
