import "server-only";
import { getUser } from "@/lib/auth";
import { getServiceClient } from "@/lib/supabase/server";

export interface CreatorRow {
  id: string;
  user_id: string;
  handle: string;
  display_name: string;
  bio: string;
  avatar_url: string | null;
  website: string | null;
  social: string | null;
  status: "pending" | "approved" | "rejected";
  rejection_reason: string | null;
  payout_split: number;
  payout_email: string | null;
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

/** Normalize a requested handle into a safe slug fragment. */
export function normalizeHandle(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/^@+/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
}
