import { NextRequest } from "next/server";
import { getUser } from "@/lib/auth";
import { getServiceClient } from "@/lib/supabase/server";

/**
 * POST /api/push/subscribe — save a push subscription
 * Body: PushSubscription JSON (endpoint, keys.p256dh, keys.auth)
 */
export async function POST(req: NextRequest) {
  const user = await getUser();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // --- Input validation ---
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return Response.json({ error: "Request body must be a JSON object" }, { status: 400 });
  }

  const { endpoint, keys } = body as Record<string, unknown>;

  if (typeof endpoint !== "string" || !endpoint) {
    return Response.json({ error: "endpoint must be a non-empty string" }, { status: 400 });
  }
  try {
    const parsed = new URL(endpoint);
    if (parsed.protocol !== "https:") {
      return Response.json({ error: "endpoint must be an HTTPS URL" }, { status: 400 });
    }
  } catch {
    return Response.json({ error: "endpoint must be a valid URL" }, { status: 400 });
  }
  if (endpoint.length > 2000) {
    return Response.json({ error: "endpoint must be at most 2000 characters" }, { status: 400 });
  }

  if (typeof keys !== "object" || keys === null || Array.isArray(keys)) {
    return Response.json({ error: "keys must be an object with p256dh and auth" }, { status: 400 });
  }
  const { p256dh, auth } = keys as Record<string, unknown>;
  if (typeof p256dh !== "string" || !p256dh) {
    return Response.json({ error: "keys.p256dh must be a non-empty string" }, { status: 400 });
  }
  if (typeof auth !== "string" || !auth) {
    return Response.json({ error: "keys.auth must be a non-empty string" }, { status: 400 });
  }
  if (p256dh.length > 500 || auth.length > 500) {
    return Response.json({ error: "keys.p256dh and keys.auth must be at most 500 characters each" }, { status: 400 });
  }

  const supabase = getServiceClient();
  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: user?.id ?? null,
      endpoint,
      p256dh,
      auth,
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
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { endpoint } = body as Record<string, unknown>;

  // --- Input validation ---
  if (typeof endpoint !== "string" || !endpoint) {
    return Response.json({ error: "endpoint must be a non-empty string" }, { status: 400 });
  }
  try {
    const parsed = new URL(endpoint);
    if (parsed.protocol !== "https:") {
      return Response.json({ error: "endpoint must be an HTTPS URL" }, { status: 400 });
    }
  } catch {
    return Response.json({ error: "endpoint must be a valid URL" }, { status: 400 });
  }
  if (endpoint.length > 2000) {
    return Response.json({ error: "endpoint must be at most 2000 characters" }, { status: 400 });
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
