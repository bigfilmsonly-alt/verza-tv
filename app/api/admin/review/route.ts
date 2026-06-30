import { NextRequest } from "next/server";
import { getAdminEmail } from "@/lib/admin";
import { getServiceClient } from "@/lib/supabase/server";
import { sendCreatorDecisionEmail } from "@/lib/email";

/**
 * GET /api/admin/review
 * Admin-only. Lists creator titles awaiting review (status pending_review),
 * joined with their creator profile so the reviewer has context + a playback
 * id to preview. Optionally include other statuses via ?status=.
 */
export async function GET(req: NextRequest) {
  const admin = await getAdminEmail(req);
  if (!admin) return Response.json({ error: "Forbidden" }, { status: 403 });

  const status = req.nextUrl.searchParams.get("status") || "pending_review";

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("creator_content")
    .select(
      "id, slug, title, description, category, status, aspect_ratio, duration_seconds, poster_url, mux_playback_id, pricing_type, price_cents, rejection_reason, submitted_at, created_at, creators(handle, display_name, payout_email, status)",
    )
    .eq("status", status)
    .order("submitted_at", { ascending: true, nullsFirst: false });

  if (error) {
    console.error("[admin/review] list failed:", error);
    return Response.json({ error: "Could not load queue" }, { status: 500 });
  }

  return Response.json({ items: data ?? [] });
}

/**
 * POST /api/admin/review
 * Admin-only. Approve or reject a submitted title.
 *   { id, action: "approve" }            -> published + published_at
 *   { id, action: "reject", reason }     -> rejected + rejection_reason
 * Only acts on titles currently in pending_review so a decision can't be
 * silently applied to a draft or already-live title.
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
  if (!id || !action) {
    return Response.json({ error: "id and action required" }, { status: 400 });
  }
  const reason = typeof body.reason === "string" ? body.reason.slice(0, 500).trim() : "";
  if (action === "reject" && !reason) {
    return Response.json({ error: "A rejection reason is required" }, { status: 400 });
  }

  const supabase = getServiceClient();
  const { data: content } = await supabase
    .from("creator_content")
    .select("id, title, slug, status, creators(payout_email)")
    .eq("id", id)
    .maybeSingle();

  if (!content) return Response.json({ error: "Not found" }, { status: 404 });
  if (content.status !== "pending_review") {
    return Response.json({ error: "Title is not awaiting review" }, { status: 409 });
  }

  const now = new Date().toISOString();
  const update =
    action === "approve"
      ? { status: "published", published_at: now, rejection_reason: null, updated_at: now }
      : { status: "rejected", rejection_reason: reason, updated_at: now };

  const { error } = await supabase.from("creator_content").update(update).eq("id", id);
  if (error) {
    console.error("[admin/review] update failed:", error);
    return Response.json({ error: "Could not save decision" }, { status: 500 });
  }

  // Notify the creator (best-effort).
  const creator = Array.isArray(content.creators) ? content.creators[0] : content.creators;
  const payoutEmail = (creator as { payout_email?: string } | null)?.payout_email;
  if (payoutEmail) {
    sendCreatorDecisionEmail(payoutEmail, {
      title: content.title,
      approved: action === "approve",
      reason,
      slug: content.slug,
    }).catch(() => {});
  }

  return Response.json({ ok: true, status: update.status });
}
