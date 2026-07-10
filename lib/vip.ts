import { NextRequest } from "next/server";
import { getServiceClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";

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

    // Try Authorization header first, then the @supabase/ssr session cookies
    // (the old "sb-access-token" cookie name never existed).
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

    let userId: string | null = null;
    if (token) {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (error || !user) return false;
      userId = user.id;
    } else {
      const user = await getUser();
      if (!user) return false;
      userId = user.id;
    }

    // Check VIP status in profiles
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_vip, vip_expires_at")
      .eq("id", userId)
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
