import "server-only";
import { getUser } from "@/lib/auth";
import { getServiceClient } from "@/lib/supabase/server";
import { normalizeHandleClient } from "@/lib/creator-client";
import type { CreatorStatus, DraftSocial } from "@/lib/creator-client";

/** Reviewed-application lifecycle (migration 010). Union lives in the
 *  client-safe module so client components can type against it too. */
export type { CreatorStatus, DraftSocial };

export interface CreatorRow {
  id: string;
  user_id: string;
  handle: string;
  display_name: string;
  bio: string;
  avatar_url: string | null;
  website: string | null;
  social: string | null;
  status: CreatorStatus;
  rejection_reason: string | null;
  payout_split: number;
  payout_email: string | null;
  // Public channel profile (migration 010)
  banner_url: string | null;
  published: boolean;
  // Review workflow (migration 010)
  reviewer_notes: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  current_step: number;
  // Application intake fields (migration 010, Steps A-D)
  real_name: string | null;
  country: string | null;
  social_links: DraftSocial | null;
  content_types: string[] | null;
  content_languages: string[] | null;
  finished_titles: number | null;
  content_links: string[] | null;
  total_runtime_minutes: number | null;
  sample_link: string | null;
  content_rating: string | null;
  rights_attested: boolean | null;
  territory: string | null;
  territory_detail: string | null;
  exclusivity: string | null;
  agreement_accepted: boolean | null;
  agreement_version: string | null;
  payout_preference: string | null;
  tax_country: string | null;
  payment_ack: boolean | null;
}

export interface CreatorContext {
  userId: string;
  email: string;
  creator: CreatorRow | null;
}

/** Resolve the signed-in user and their creator profile (if any). */
export async function getCreatorContext(): Promise<CreatorContext | null> {
  const user = await getUser();
  if (!user) return null;
  const supabase = getServiceClient();
  const { data } = await supabase
    .from("creators")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  return { userId: user.id, email: user.email, creator: (data as CreatorRow) ?? null };
}

/** Build a collision-proof, namespaced slug from a creator handle + title. */
export function buildContentSlug(handle: string, title: string): string {
  const base = (title || "untitled")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "untitled";
  const suffix = Math.random().toString(36).slice(2, 7);
  return `${handle}/${base}-${suffix}`;
}

/** Normalize a requested handle into a safe slug fragment. Delegates to the
 *  client-safe implementation so server + client previews never drift. */
export function normalizeHandle(raw: string): string {
  return normalizeHandleClient(raw);
}
