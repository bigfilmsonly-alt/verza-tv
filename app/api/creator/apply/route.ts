import { NextRequest } from "next/server";
import { getUser } from "@/lib/auth";
import { getServiceClient } from "@/lib/supabase/server";
import { normalizeHandle } from "@/lib/creator";
import { sendFormNotification } from "@/lib/email";

const MAX = 2000;
const clamp = (v: unknown, n = 280) => (typeof v === "string" ? v.slice(0, n) : "");

/**
 * POST /api/creator/apply
 * Creates (or updates, while still pending) the signed-in user's creator
 * profile and puts them in the review queue. Approval is a manual admin toggle
 * (see /api/admin/review). Cannot self-approve.
 */
export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const displayName = clamp(body.displayName, 80).trim();
  const bio = clamp(body.bio, MAX).trim();
  const website = clamp(body.website, 200).trim();
  const social = clamp(body.social, 200).trim();
  const handle = normalizeHandle(clamp(body.handle, 40) || displayName);

  if (!displayName) return Response.json({ error: "Display name required" }, { status: 400 });
  if (!handle) return Response.json({ error: "A valid handle is required" }, { status: 400 });

  const supabase = getServiceClient();

  // Already have a profile? Only allow edits while pending/rejected (re-apply).
  const { data: existing } = await supabase
    .from("creators")
    .select("id, status, handle")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing?.status === "approved") {
    return Response.json({ error: "Already an approved creator" }, { status: 409 });
  }

  // Handle uniqueness (allow keeping your own).
  const { data: handleTaken } = await supabase
    .from("creators")
    .select("id")
    .eq("handle", handle)
    .neq("user_id", user.id)
    .maybeSingle();
  if (handleTaken) {
    return Response.json({ error: "That handle is taken" }, { status: 409 });
  }

  const row = {
    user_id: user.id,
    handle,
    display_name: displayName,
    bio,
    website: website || null,
    social: social || null,
    status: "pending" as const,
    rejection_reason: null,
    payout_email: user.email,
    updated_at: new Date().toISOString(),
  };

  const { error: upsertErr } = await supabase
    .from("creators")
    .upsert(row, { onConflict: "user_id" });
  if (upsertErr) {
    console.error("[creator/apply] upsert failed:", upsertErr);
    return Response.json({ error: "Could not save application" }, { status: 500 });
  }

  // Mirror onto profile for quick role checks.
  await supabase
    .from("profiles")
    .update({ creator_status: "pending", updated_at: new Date().toISOString() })
    .eq("id", user.id);

  // Notify the team (best-effort).
  sendFormNotification("Creator Application", user.email, {
    name: displayName,
    handle,
    website: website || "—",
    social: social || "—",
  }).catch(() => {});

  return Response.json({ ok: true, status: "pending", handle });
}
