import { NextRequest } from "next/server";
import { getServiceClient } from "@/lib/supabase/server";

/**
 * Check whether the current request comes from a VIP user.
 *
 * Reads the Supabase access token from the Authorization header or
 * sb-access-token cookie, resolves the user, then checks profiles.is_vip.
 *
 * Returns `true` if the user is an active VIP, `false` otherwise.
 * Never throws — a missing/invalid token is simply "not VIP".
 */
export async function checkVipStatus(request: NextRequest): Promise<boolean> {
  try {
    const supabase = getServiceClient();

    // Try Authorization header first, then cookie
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : request.cookies.get("sb-access-token")?.value;

    if (!token) return false;

    // Verify the token and get user
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) return false;

    // Check VIP status in profiles
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_vip, vip_expires_at")
      .eq("id", user.id)
      .single();

    if (!profile?.is_vip) return false;

    // Check expiry (if set)
    if (profile.vip_expires_at) {
      const expiry = new Date(profile.vip_expires_at);
      if (expiry < new Date()) return false;
    }

    return true;
  } catch {
    return false;
  }
}
