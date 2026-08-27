import type { NextRequest } from "next/server";
import { privateJson } from "@/lib/private-json";
import { getCreatorContext, normalizeHandle } from "@/lib/creator";
import { getServiceClient } from "@/lib/supabase/server";

/**
 * Creator channel editor — the ONLY write path a creator has to their own
 * public profile (stage 5).
 *
 * SECURITY SHAPE, do not loosen:
 * - Owner scoped. The row is selected by the session's user_id; an id is never
 *   accepted from the request body, so a creator cannot address another row.
 * - Approved only. A draft/submitted/declined applicant has no channel to edit,
 *   and letting them write these columns would give them a public surface
 *   before review.
 * - ALLOWLIST, not a spread. Only the fields below are writable. status,
 *   payout_split, payouts_enabled, stripe_account_id, role and reviewer_notes
 *   are deliberately absent: those are review/finance state and writing them
 *   from here would be privilege escalation.
 * - Handle is normalized and uniqueness-checked before write, so two creators
 *   cannot claim /@same.
 */

const MAX = { displayName: 60, bio: 400, website: 200, social: 200 } as const;

function clamp(v: unknown, max: number): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

/** Accept only http(s) URLs; anything else becomes empty rather than throwing. */
function safeUrl(v: unknown, max: number): string {
  const s = clamp(v, max);
  if (!s) return "";
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:" ? s : "";
  } catch {
    return "";
  }
}

export async function GET() {
  const ctx = await getCreatorContext();
  if (!ctx) return privateJson({ authenticated: false }, { status: 401 });
  const c = ctx.creator;
  if (!c || c.status !== "approved") return privateJson({ eligible: false }, { status: 403 });

  return privateJson({
    eligible: true,
    channel: {
      handle: c.handle ?? "",
      displayName: c.display_name ?? "",
      bio: c.bio ?? "",
      avatarUrl: c.avatar_url ?? "",
      bannerUrl: c.banner_url ?? "",
      website: c.website ?? "",
      social: c.social_links ?? {},
      published: Boolean(c.published),
    },
  });
}

export async function PATCH(request: NextRequest) {
  const ctx = await getCreatorContext();
  if (!ctx) return privateJson({ error: "Not signed in" }, { status: 401 });

  const creator = ctx.creator;
  if (!creator || creator.status !== "approved") {
    return privateJson({ error: "Channel editing unlocks after approval" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return privateJson({ error: "Invalid body" }, { status: 400 });
  }

  const supabase = getServiceClient();
  const update: Record<string, unknown> = {};

  /* Handle: normalized, then uniqueness-checked against every other creator. */
  if (typeof body.handle === "string") {
    const handle = normalizeHandle(body.handle);
    if (!handle || handle.length < 3) {
      return privateJson({ error: "Handle must be at least 3 characters" }, { status: 400 });
    }
    if (handle !== creator.handle) {
      const { data: taken } = await supabase
        .from("creators")
        .select("id")
        .eq("handle", handle)
        .neq("id", creator.id)
        .maybeSingle();
      if (taken) return privateJson({ error: "That handle is taken" }, { status: 409 });
      update.handle = handle;
    }
  }

  if ("displayName" in body) update.display_name = clamp(body.displayName, MAX.displayName);
  if ("bio" in body) update.bio = clamp(body.bio, MAX.bio);
  if ("avatarUrl" in body) update.avatar_url = safeUrl(body.avatarUrl, MAX.website);
  if ("bannerUrl" in body) update.banner_url = safeUrl(body.bannerUrl, MAX.website);
  if ("website" in body) update.website = safeUrl(body.website, MAX.website);

  if (body.social && typeof body.social === "object") {
    const raw = body.social as Record<string, unknown>;
    // Fixed key set: an arbitrary object here would end up rendered on the
    // public channel page.
    const social: Record<string, string> = {};
    for (const k of ["instagram", "tiktok", "youtube", "imdb"] as const) {
      const v = safeUrl(raw[k], MAX.social);
      if (v) social[k] = v;
    }
    update.social_links = social;
  }

  /* Publishing the channel is the creator's call, but it requires a handle and
     a display name so /@handle never renders an unnamed page. */
  if ("published" in body) {
    const wantsPublished = Boolean(body.published);
    if (wantsPublished) {
      const handle = (update.handle as string) ?? creator.handle;
      const name = (update.display_name as string) ?? creator.display_name;
      if (!handle || !name) {
        return privateJson(
          { error: "Set a handle and channel name before publishing" },
          { status: 400 },
        );
      }
    }
    update.published = wantsPublished;
  }

  if (Object.keys(update).length === 0) {
    return privateJson({ error: "Nothing to update" }, { status: 400 });
  }

  const { error } = await supabase
    .from("creators")
    .update(update)
    .eq("id", creator.id)
    .eq("user_id", ctx.userId); // belt and braces: owner scope enforced twice

  if (error) return privateJson({ error: "Could not save" }, { status: 500 });

  return privateJson({ ok: true, updated: Object.keys(update) });
}
