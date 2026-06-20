import { NextRequest } from "next/server";
import { getUser } from "@/lib/auth";
import { getServiceClient } from "@/lib/supabase/server";

/**
 * POST /api/push/subscribe — save a push subscription
 * Body: PushSubscription JSON (endpoint, keys.p256dh, keys.auth)
 */
export async function POST(req: NextRequest) {
  const user = await getUser();
  const body = await req.json();

  const { endpoint, keys } = body;
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return Response.json(
      { error: "Invalid push subscription" },
      { status: 400 },
    );
  }

  const supabase = getServiceClient();
  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: user?.id ?? null,
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
      created_at: new Date().toISOString(),
    },
    { onConflict: "endpoint" },
  );

  if (error) {
    console.error("[push/subscribe] Upsert error:", error);
    return Response.json({ error: "Failed to save subscription" }, { status: 500 });
  }

  return Response.json({ subscribed: true });
}

/**
 * DELETE /api/push/subscribe — remove a push subscription
 * Body: { endpoint: string }
 */
export async function DELETE(req: NextRequest) {
  const body = await req.json();
  const { endpoint } = body;

  if (!endpoint) {
    return Response.json({ error: "Missing endpoint" }, { status: 400 });
  }

  const supabase = getServiceClient();
  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("endpoint", endpoint);

  if (error) {
    console.error("[push/subscribe] Delete error:", error);
    return Response.json({ error: "Failed to remove subscription" }, { status: 500 });
  }

  return Response.json({ removed: true });
}
