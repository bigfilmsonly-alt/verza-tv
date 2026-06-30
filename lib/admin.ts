import "server-only";
import { NextRequest } from "next/server";
import { getServiceClient } from "@/lib/supabase/server";

/** Emails allowed into the admin surfaces (dashboard, review queue). */
export const ADMIN_EMAILS = [
  "jotham@bigfilms.tv",
  "alan@verzatv.com",
  "jothamhall@gmail.com",
];

/**
 * Verify a request carries a Bearer token belonging to an admin user.
 * Returns the admin email on success, or null when unauthorized/forbidden.
 */
export async function getAdminEmail(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);

  const supabase = getServiceClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);
  if (error || !user) return null;

  const email = user.email ?? "";
  return ADMIN_EMAILS.includes(email) ? email : null;
}
