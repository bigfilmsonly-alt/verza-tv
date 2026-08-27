import { NextRequest } from "next/server";
import { getAdminEmail } from "@/lib/admin";
import { privateJson } from "@/lib/private-json";
import { getServiceClient } from "@/lib/supabase/server";
import { sendFormNotification } from "@/lib/email";

/** Every application column a reviewer needs to make a decision (Steps A-D +
 *  legacy fields + workflow timestamps). PII stays server-side; this route is
 *  admin-gated so the full row is safe to return here. */
const APP_COLUMNS =
  "id, user_id, handle, display_name, real_name, country, bio, avatar_url, website, " +
  "social, social_links, phone, contact_email, project_pitch, film_link, " +
  "content_types, content_languages, finished_titles, content_links, " +
  "total_runtime_minutes, sample_link, content_rating, " +
  "rights_attested, territory, territory_detail, exclusivity, " +
  "agreement_accepted, agreement_version, payout_preference, tax_country, payment_ack, " +
  "reviewer_notes, rejection_reason, status, payout_email, submitted_at, reviewed_at, created_at";

/** The active review set surfaced by default (everything a reviewer can act on). */
const ACTIVE_REVIEW_STATUSES = ["submitted", "in_review", "changes_requested"] as const;

/**
 * GET /api/admin/creators
 * Admin-only. Lists the active review queue (submitted / in_review /
 * changes_requested) ordered oldest-first, with every application column so the
 * reviewer sees the whole submission. ?status= overrides to a single status.
 * Also returns a per-status count for tab badges.
 */
export async function GET(req: NextRequest) {
  const admin = await getAdminEmail(req);
  if (!admin) return privateJson({ error: "Forbidden" }, { status: 403 });

  const statusParam = req.nextUrl.searchParams.get("status");
  const supabase = getServiceClient();

  let query = supabase.from("creators").select(APP_COLUMNS);
  query = statusParam
    ? query.eq("status", statusParam)
    : query.in("status", ACTIVE_REVIEW_STATUSES as unknown as string[]);
  // Oldest waiting first. submitted_at is set at submit; nulls (edge cases) float up.
  query = query
    .order("submitted_at", { ascending: true, nullsFirst: true })
    .order("created_at", { ascending: true });

  const { data, error } = await query;
  if (error) {
    console.error("[admin/creators] list failed:", error);
    return privateJson({ error: "Could not load applications" }, { status: 500 });
  }

  // Per-status counts for the review tab badges (best-effort; failures -> 0).
  const countFor = async (s: string): Promise<number> => {
    const { count } = await supabase
      .from("creators")
      .select("id", { count: "exact", head: true })
      .eq("status", s);
    return count ?? 0;
  };
  const [submitted, in_review, changes_requested] = await Promise.all([
    countFor("submitted"),
    countFor("in_review"),
    countFor("changes_requested"),
  ]);

  return privateJson({
    items: data ?? [],
    counts: { submitted, in_review, changes_requested },
  });
}

type Decision = "approve" | "changes" | "decline" | "start_review";

/** Map the incoming action (accepting the legacy 'reject' alias) to a decision. */
function parseAction(v: unknown): Decision | "" {
  if (v === "approve") return "approve";
  if (v === "changes" || v === "changes_requested") return "changes";
  if (v === "decline" || v === "reject") return "decline"; // legacy 'reject' -> decline
  if (v === "start_review") return "start_review";
  return "";
}

/**
 * POST /api/admin/creators
 * Admin-only. Applies a review decision to a creator application.
 *   { id, action: "approve" }               -> approved (role -> creator)
 *   { id, action: "changes", feedback }     -> changes_requested (feedback REQUIRED)
 *   { id, action: "decline", reason }       -> declined (reason REQUIRED, role stays viewer)
 *   { id, action: "reject",  reason }       -> legacy alias for "decline"
 *   { id, action: "start_review" }          -> in_review (an admin claiming the app)
 * Every status write lives here behind the admin allowlist + service-role client;
 * a creator can never self-approve. Mirrors the decision onto profiles for fast
 * role checks. Applicant/team is notified best-effort.
 */
export async function POST(req: NextRequest) {
  const admin = await getAdminEmail(req);
  if (!admin) return privateJson({ error: "Forbidden" }, { status: 403 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return privateJson({ error: "Invalid JSON" }, { status: 400 });
  }

  const id = typeof body.id === "string" ? body.id : "";
  const action = parseAction(body.action);
  if (!id || !action) return privateJson({ error: "id and action required" }, { status: 400 });

  // Free-text inputs: trimmed + hard length clamp before they ever touch the DB.
  const clamp = (v: unknown): string => (typeof v === "string" ? v.slice(0, 2000).trim() : "");
  const feedback = clamp(body.feedback) || clamp(body.reason);
  const reason = clamp(body.reason) || clamp(body.feedback);

  if (action === "changes" && !feedback) {
    return privateJson({ error: "Feedback for the creator is required" }, { status: 400 });
  }
  if (action === "decline" && !reason) {
    return privateJson({ error: "A decline reason is required" }, { status: 400 });
  }

  const supabase = getServiceClient();
  const { data: creator } = await supabase
    .from("creators")
    .select("id, user_id, handle, display_name, payout_email, status")
    .eq("id", id)
    .maybeSingle();

  if (!creator) return privateJson({ error: "Not found" }, { status: 404 });
  if (creator.status === "approved" && action === "approve") {
    return privateJson({ error: "Already approved" }, { status: 409 });
  }
  if (
    action === "start_review" &&
    creator.status !== "submitted" &&
    creator.status !== "changes_requested"
  ) {
    return privateJson({ error: "Only a submitted application can be moved to in-review" }, { status: 409 });
  }

  const now = new Date().toISOString();

  // Build the creators-row update + the mirrored profiles fields per decision.
  const creatorUpdate: Record<string, unknown> = { updated_at: now };
  const profileUpdate: Record<string, unknown> = { updated_at: now };
  let newStatus: string;

  if (action === "approve") {
    newStatus = "approved";
    creatorUpdate.status = "approved";
    creatorUpdate.reviewed_at = now;
    creatorUpdate.rejection_reason = null;
    profileUpdate.creator_status = "approved";
    profileUpdate.role = "creator";
  } else if (action === "changes") {
    newStatus = "changes_requested";
    creatorUpdate.status = "changes_requested";
    creatorUpdate.reviewer_notes = feedback;
    creatorUpdate.reviewed_at = now;
    creatorUpdate.rejection_reason = null;
    profileUpdate.creator_status = "changes_requested";
    // role intentionally unchanged (stays viewer) while the creator revises.
  } else if (action === "decline") {
    newStatus = "declined";
    creatorUpdate.status = "declined";
    creatorUpdate.rejection_reason = reason;
    creatorUpdate.reviewed_at = now;
    profileUpdate.creator_status = "declined";
    profileUpdate.role = "viewer";
  } else {
    // start_review: an admin claims the application. No reviewed_at (not decided).
    newStatus = "in_review";
    creatorUpdate.status = "in_review";
    profileUpdate.creator_status = "in_review";
  }

  const { error } = await supabase.from("creators").update(creatorUpdate).eq("id", id);
  if (error) {
    console.error("[admin/creators] update failed:", error);
    return privateJson({ error: "Could not save decision" }, { status: 500 });
  }

  // Mirror onto the profile for fast role checks (best-effort).
  await supabase.from("profiles").update(profileUpdate).eq("id", creator.user_id);

  // Notify the team (best-effort; never blocks the response). Respectful copy;
  // the changes-requested note carries the reviewer feedback for the record.
  if (creator.payout_email && action !== "start_review") {
    const label =
      action === "approve"
        ? "Creator Approved"
        : action === "changes"
          ? "Creator Changes Requested"
          : "Creator Declined";
    sendFormNotification(label, creator.payout_email, {
      handle: creator.handle,
      name: creator.display_name,
      decision: newStatus,
      ...(action === "changes" ? { feedback } : {}),
      ...(action === "decline" ? { reason } : {}),
    }).catch(() => {});
  }

  return privateJson({ ok: true, status: newStatus });
}
