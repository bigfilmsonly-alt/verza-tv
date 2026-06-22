import { NextRequest } from "next/server";
import webPush from "web-push";
import { getServiceClient } from "@/lib/supabase/server";

/* ------------------------------------------------------------------ */
/*  Configure web-push with VAPID keys                                 */
/* ------------------------------------------------------------------ */
const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY ?? "";
const VAPID_SUBJECT = process.env.VAPID_SUBJECT ?? "mailto:support@verzatv.com";

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webPush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
}

/**
 * POST /api/push/send — send a push notification (admin/internal only)
 *
 * Body: {
 *   title: string;
 *   body: string;
 *   url?: string;        — deep link on click
 *   userId?: string;     — target a single user (omit for broadcast)
 * }
 *
 * Protect this route in production with an API key header or admin auth.
 */
export async function POST(req: NextRequest) {
  // Gate: require internal API key
  const authHeader = req.headers.get("x-push-api-key");
  const apiKey = process.env.PUSH_API_KEY;
  if (!apiKey || authHeader !== apiKey) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
    return Response.json(
      { error: "VAPID keys not configured" },
      { status: 500 },
    );
  }

  const { title, body, url, userId } = await req.json();
  if (!title || !body) {
    return Response.json(
      { error: "Missing title or body" },
      { status: 400 },
    );
  }

  const payload = JSON.stringify({ title, body, url: url ?? "/" });

  // Fetch subscriptions
  const supabase = getServiceClient();
  let query = supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth");

  if (userId) {
    query = query.eq("user_id", userId);
  }

  const { data: subs, error } = await query;

  if (error) {
    console.error("[push/send] Fetch subscriptions error:", error);
    return Response.json({ error: "Failed to fetch subscriptions" }, { status: 500 });
  }

  if (!subs || subs.length === 0) {
    return Response.json({ sent: 0, failed: 0, message: "No subscribers" });
  }

  // Send to all matching subscriptions
  let sent = 0;
  let failed = 0;
  const staleEndpoints: string[] = [];

  await Promise.allSettled(
    subs.map(async (sub) => {
      const pushSub = {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      };

      try {
        await webPush.sendNotification(pushSub, payload);
        sent++;
      } catch (err: unknown) {
        failed++;
        // Remove stale subscriptions (410 Gone or 404 Not Found)
        const statusCode = (err as { statusCode?: number })?.statusCode;
        if (statusCode === 410 || statusCode === 404) {
          staleEndpoints.push(sub.endpoint);
        } else {
          console.error("[push/send] Send error:", err);
        }
      }
    }),
  );

  // Clean up stale subscriptions
  if (staleEndpoints.length > 0) {
    await supabase
      .from("push_subscriptions")
      .delete()
      .in("endpoint", staleEndpoints);
  }

  return Response.json({
    sent,
    failed,
    cleaned: staleEndpoints.length,
    total: subs.length,
  });
}
