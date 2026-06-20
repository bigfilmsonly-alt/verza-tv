import { cookies } from "next/headers";
import { getServiceClient } from "@/lib/supabase/server";

/**
 * Server-side VIP check for React Server Components.
 *
 * Reads the Supabase access token from cookies, resolves the user,
 * then checks profiles.is_vip + expiry.
 *
 * Returns `true` if the user is an active VIP, `false` otherwise.
 * Never throws.
 */
export async function checkVipStatusServer(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("sb-access-token")?.value;

    if (!token) return false;

    const supabase = getServiceClient();

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) return false;

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_vip, vip_expires_at")
      .eq("id", user.id)
      .single();

    if (!profile?.is_vip) return false;

    if (profile.vip_expires_at) {
      const expiry = new Date(profile.vip_expires_at);
      if (expiry < new Date()) return false;
    }

    return true;
  } catch {
    return false;
  }
}
