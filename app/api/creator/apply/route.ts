import { NextRequest } from "next/server";
import { getUser } from "@/lib/auth";
import { privateJson } from "@/lib/private-json";
import { getServiceClient } from "@/lib/supabase/server";
import { AGREEMENT_VERSION, DRAFT_HANDLE_PREFIX } from "@/lib/creator-client";
import { mapDraftToRow, validateSubmit, type CreatorRowWrite } from "@/lib/creator-intake";
import { sendFormNotification } from "@/lib/email";

/**
 * POST /api/creator/apply  (single route, intent discriminator)
 *
 *   { intent: "save",   step: 1..5, values: Partial<DraftValues> }
 *   { intent: "submit",             values: DraftValues }
 *
 * SAVE persists just the current step's fields, advances current_step, and
 * keeps status 'draft' (or leaves 'changes_requested' untouched) so the flow is
 * fully save-and-resume. SUBMIT runs full server-side validation, flips status
 * to 'submitted', and notifies the team.
 *
 * ALL writes go through the service-role client: RLS grants no client INSERT and
 * column-restricts UPDATE (migration 010), so server-only is mandatory. Approval
 * remains a manual admin action; a creator can never self-approve here.
 */
export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return privateJson({ error: "Unauthorized" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return privateJson({ error: "Invalid JSON" }, { status: 400 });
  }

  const intent = body.intent === "submit" ? "submit" : "save";
  const values = (body.values && typeof body.values === "object" ? body.values : {}) as Record<
    string,
    unknown
  >;

  const supabase = getServiceClient();

  // Load the existing row to enforce the status lock + handle-collision scope.
  const { data: existing } = await supabase
    .from("creators")
    .select("id, status, handle")
    .eq("user_id", user.id)
    .maybeSingle();

  const existingStatus = existing?.status as string | undefined;

  // STATUS LOCK: edits are only allowed while null | 'draft' | 'changes_requested'.
  if (existingStatus === "approved") {
    return privateJson({ error: "Already an approved creator" }, { status: 409 });
  }
  if (existingStatus === "submitted" || existingStatus === "in_review") {
    return privateJson(
      { error: "Your application is locked while under review." },
      { status: 409 },
    );
  }

  /** Handle uniqueness: allow keeping your own, block anyone else's. */
  async function handleTaken(handle: string): Promise<boolean> {
    const { data } = await supabase
      .from("creators")
      .select("id")
      .eq("handle", handle)
      .neq("user_id", user!.id)
      .maybeSingle();
    return !!data;
  }

  /* ---------------------------------------------------------------- */
  /*  SAVE                                                            */
  /* ---------------------------------------------------------------- */
  if (intent === "save") {
    const step = clampStep(body.step);
    const partial = mapDraftToRow(values);

    // `creators.handle` is UNIQUE NOT NULL. Autosave can fire on step 1 before a
    // display name/handle exists, which maps to handle=''. A brand-new insert of
    // '' is fine once, but a second concurrent empty draft would hit a unique
    // violation (500). Reserve a per-user placeholder instead; it is overwritten
    // the moment a real handle is entered, and always at submit.
    if (partial.handle === "") {
      partial.handle = `${DRAFT_HANDLE_PREFIX}${user.id.replace(/-/g, "").slice(0, 25)}`;
    }

    if (partial.handle && partial.handle !== existing?.handle) {
      if (await handleTaken(partial.handle)) {
        return privateJson({ error: "That handle is taken" }, { status: 409 });
      }
    }

    const row: CreatorRowWrite & Record<string, unknown> = {
      ...partial,
      user_id: user.id,
      current_step: step,
      // Never flip changes_requested back to draft on autosave; only submit advances it.
      status: existingStatus === "changes_requested" ? "changes_requested" : "draft",
      updated_at: new Date().toISOString(),
    };

    const { error: upsertErr } = await supabase
      .from("creators")
      .upsert(row, { onConflict: "user_id" });
    if (upsertErr) {
      console.error("[creator/apply] save upsert failed:", upsertErr);
      return privateJson({ error: "Could not save application" }, { status: 500 });
    }

    // Mirror onto profiles only when it is still 'none'/'draft' (do not stomp a
    // later lifecycle state that lives on the creators row).
    await supabase
      .from("profiles")
      .update({ creator_status: "draft", updated_at: new Date().toISOString() })
      .eq("id", user.id)
      .in("creator_status", ["none", "draft"]);

    return privateJson({
      ok: true,
      status: row.status,
      currentStep: step,
      handle: partial.handle ?? existing?.handle ?? null,
    });
  }

  /* ---------------------------------------------------------------- */
  /*  SUBMIT                                                          */
  /* ---------------------------------------------------------------- */
  const full = mapDraftToRow(values);

  const problem = validateSubmit(full);
  if (problem) {
    return privateJson({ error: problem.error, step: problem.step }, { status: 400 });
  }

  if (full.handle && full.handle !== existing?.handle) {
    if (await handleTaken(full.handle)) {
      return privateJson({ error: "That handle is taken" }, { status: 409 });
    }
  }

  const now = new Date().toISOString();
  const row: CreatorRowWrite & Record<string, unknown> = {
    ...full,
    user_id: user.id,
    status: "submitted",
    submitted_at: now,
    current_step: 5,
    agreement_version: AGREEMENT_VERSION,
    payout_preference: full.payout_preference || "stripe",
    rejection_reason: null,
    reviewer_notes: null, // clear any stale changes-requested note on resubmit
    payout_email: user.email,
    updated_at: now,
  };

  const { error: upsertErr } = await supabase
    .from("creators")
    .upsert(row, { onConflict: "user_id" });
  if (upsertErr) {
    console.error("[creator/apply] submit upsert failed:", upsertErr);
    return privateJson({ error: "Could not submit application" }, { status: 500 });
  }

  await supabase
    .from("profiles")
    .update({ creator_status: "submitted", updated_at: now })
    .eq("id", user.id);

  // Notify the team (best-effort; must not block the response).
  sendFormNotification("Creator Application", user.email, {
    name: full.display_name || "-",
    handle: full.handle || "-",
    country: full.country || "-",
    contentTypes: (full.content_types ?? []).join(", ") || "-",
    languages: (full.content_languages ?? []).join(", ") || "-",
    finishedTitles: full.finished_titles != null ? String(full.finished_titles) : "-",
    links: (full.content_links ?? []).join("\n") || "-",
    sample: full.sample_link || "-",
    territory: full.territory || "-",
    exclusivity: full.exclusivity || "-",
    rating: full.content_rating || "-",
  }).catch(() => {});

  return privateJson({ ok: true, status: "submitted", handle: full.handle });
}

/** Clamp the incoming step cursor into [1, 5]. */
function clampStep(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return 1;
  return Math.min(5, Math.max(1, Math.floor(n)));
}
