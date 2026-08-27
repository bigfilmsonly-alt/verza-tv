import "server-only";
import { NextRequest } from "next/server";
import { redirect } from "next/navigation";
import { getServiceClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";

/** Emails allowed into the admin surfaces (dashboard, review queue). */
export const ADMIN_EMAILS = [
  "jotham@bigfilms.tv",
  "alan@verzatv.com",
  "jothamhall@gmail.com",
];

/** True when the email is on the admin allowlist. Single source of truth. */
export function isAdminEmail(email: string | null | undefined): boolean {
  return !!email && ADMIN_EMAILS.includes(email);
}

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
  return isAdminEmail(email) ? email : null;
}

/**
 * Server-component page guard (defense-in-depth in front of the API Bearer
 * check). Reads the COOKIE session via getUser() and redirects any non-admin to
 * '/' before the admin page renders, so /admin/* is never served to a
 * non-admin, not merely 403'd on its data fetch. Returns the admin email.
 *
 * Use ONLY in server components (it calls redirect()). API routes keep using
 * getAdminEmail(req) on the Bearer token; this does not replace or weaken it.
 */
export async function requireAdminPage(): Promise<string> {
  const user = await getUser();
  if (!user || !isAdminEmail(user.email)) {
    redirect("/");
  }
  return user.email;
}
