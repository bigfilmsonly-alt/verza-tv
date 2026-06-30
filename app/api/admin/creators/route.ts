import { NextRequest } from "next/server";
import { getAdminEmail } from "@/lib/admin";
import { getServiceClient } from "@/lib/supabase/server";
import { sendFormNotification } from "@/lib/email";

/**
 * GET /api/admin/creators
 * Admin-only. Lists creator applications awaiting approval (status pending).
 * Optionally filter by ?status=.
 */
export async function GET(req: NextRequest) {
  const admin = await getAdminEmail(req);
  if (!admin) return Response.json({ error: "Forbidden" }, { status: 403 });

  const status = req.nextUrl.searchParams.get("status") || "pending";
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("creators")
    .select("id, user_id, handle, display_name, bio, website, social, status, payout_email, created_at")
    .eq("status", status)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[admin/creators] list failed:", error);
    return Response.json({ error: "Could not load applications" }, { status: 500 });
  }
  return Response.json({ items: data ?? [] });
}

/**
 * POST /api/admin/creators
 * Admin-only. Approve or reject a creator application.
 *   { id, action: "approve" }          -> approved (can upload)
 *   { id, action: "reject", reason }   -> rejected + reason (creator can re-apply)
 * Mirrors the decision onto profiles.creator_status + role for quick checks.
 */
export async function POST(req: NextRequest) {
  const admin = await getAdminEmail(req);
  if (!admin) return Response.json({ error: "Forbidden" }, { status: 403 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const id = typeof body.id === "string" ? body.id : "";
  const action = body.action === "approve" ? "approve" : body.action === "reject" ? "reject" : "";
  if (!id || !action) return Response.json({ error: "id and action required" }, { status: 400 });
  const reason = typeof body.reason === "string" ? body.reason.slice(0, 500).trim() : "";
  if (action === "reject" && !reason) {
    return Response.json({ error: "A rejection reason is required" }, { status: 400 });
  }

  const supabase = getServiceClient();
  const { data: creator } = await supabase
    .from("creators")
    .select("id, user_id, handle, display_name, payout_email, status")
    .eq("id", id)
    .maybeSingle();

  if (!creator) return Response.json({ error: "Not found" }, { status: 404 });
  if (creator.status === "approved" && action === "approve") {
    return Response.json({ error: "Already approved" }, { status: 409 });
  }

  const now = new Date().toISOString();
  const newStatus = action === "approve" ? "approved" : "rejected";
  const { error } = await supabase
    .from("creators")
    .update({
      status: newStatus,
      rejection_reason: action === "reject" ? reason : null,
      updated_at: now,
    })
    .eq("id", id);

  if (error) {
    console.error("[admin/creators] update failed:", error);
    return Response.json({ error: "Could not save decision" }, { status: 500 });
  }

  // Mirror onto the profile for fast role checks.
  await supabase
    .from("profiles")
    .update({
      creator_status: newStatus,
      role: action === "approve" ? "creator" : "viewer",
      updated_at: now,
    })
    .eq("id", creator.user_id);

  // Notify the team (best-effort).
  if (creator.payout_email) {
    sendFormNotification(
      action === "approve" ? "Creator Approved" : "Creator Rejected",
      creator.payout_email,
      { handle: creator.handle, name: creator.display_name, decision: newStatus, ...(reason ? { reason } : {}) },
    ).catch(() => {});
  }

  return Response.json({ ok: true, status: newStatus });
}
