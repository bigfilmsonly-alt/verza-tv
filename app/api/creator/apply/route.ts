import { NextRequest } from "next/server";
import { getUser } from "@/lib/auth";
import { privateJson } from "@/lib/private-json";
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
  if (!user) return privateJson({ error: "Unauthorized" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return privateJson({ error: "Invalid JSON" }, { status: 400 });
  }

  const displayName = clamp(body.displayName, 80).trim();
  const bio = clamp(body.bio, MAX).trim();
  const website = clamp(body.website, 200).trim();
  const social = clamp(body.social, 200).trim();
  const phone = clamp(body.phone, 40).trim();
  const contactEmail = clamp(body.contactEmail, 200).trim();
  const projectPitch = clamp(body.projectPitch, MAX).trim();
  const filmLink = clamp(body.filmLink, 500).trim();
  const handle = normalizeHandle(clamp(body.handle, 40) || displayName);

  if (!displayName) return privateJson({ error: "Display name required" }, { status: 400 });
  if (!handle) return privateJson({ error: "A valid handle is required" }, { status: 400 });

  const supabase = getServiceClient();

  // Already have a profile? Only allow edits while pending/rejected (re-apply).
  const { data: existing } = await supabase
    .from("creators")
    .select("id, status, handle")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing?.status === "approved") {
    return privateJson({ error: "Already an approved creator" }, { status: 409 });
  }

  // Handle uniqueness (allow keeping your own).
  const { data: handleTaken } = await supabase
    .from("creators")
    .select("id")
    .eq("handle", handle)
    .neq("user_id", user.id)
    .maybeSingle();
  if (handleTaken) {
    return privateJson({ error: "That handle is taken" }, { status: 409 });
  }

  const row = {
    user_id: user.id,
    handle,
    display_name: displayName,
    bio,
    website: website || null,
    social: social || null,
    phone: phone || null,
    contact_email: contactEmail || null,
    project_pitch: projectPitch || null,
    film_link: filmLink || null,
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
    return privateJson({ error: "Could not save application" }, { status: 500 });
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
    phone: phone || "—",
    contactEmail: contactEmail || user.email || "—",
    social: social || "—",
    website: website || "—",
    pitch: projectPitch || "—",
    filmLink: filmLink || "—",
  }).catch(() => {});

  return privateJson({ ok: true, status: "pending", handle });
}
