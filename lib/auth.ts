import { headers } from "next/headers";
import { createServerSupabase } from "@/lib/supabase/middleware";
import { getServiceClient } from "@/lib/supabase/server";

export async function getUser() {
  try {
    // The native app authenticates with a Supabase access token in the
    // Authorization header (it has no cookie session). Same pattern as
    // checkVipStatus in lib/vip.ts. A request that presents a Bearer token
    // is authenticated by it alone — an invalid token does not fall back
    // to cookies.
    const headerStore = await headers();
    const authHeader = headerStore.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (token) {
      const { data: { user }, error } = await getServiceClient().auth.getUser(token);
      if (error || !user) return null;
      return { id: user.id, email: user.email ?? "" };
    }

    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    return { id: user.id, email: user.email ?? "" };
  } catch {
    return null;
  }
}

export async function requireAuth() {
  const user = await getUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}
