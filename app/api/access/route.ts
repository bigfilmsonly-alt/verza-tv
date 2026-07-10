import { getUser } from "@/lib/auth";
import { getServiceClient } from "@/lib/supabase/server";
import { type NextRequest } from "next/server";

/**
 * Lightweight auth check — returns { full: true } if the caller is VIP or
 * owns an entitlement for the given series slug.  Non-logged-in users get
 * { full: false } with zero Supabase round-trips (<1 ms).
 *
 * GET /api/access?slug=the-ceo
 */
export async function GET(request: NextRequest) {
  try {
    const slug = request.nextUrl.searchParams.get("slug");

    // Resolve the session via @supabase/ssr cookies (the old "sb-access-token"
    // cookie name was never set by anything — every user read as logged-out,
    // so paying customers were re-paywalled on reload).
    const user = await getUser();
    if (!user) return Response.json({ full: false });

    const supabase = getServiceClient();

    const vipQuery = supabase
      .from("profiles")
      .select("is_vip, vip_expires_at")
      .eq("id", user.id)
      .single();

    const entQuery = slug
      ? supabase
          .from("entitlements")
          .select("id")
          .eq("user_id", user.id)
          .eq("series_slug", slug)
          .limit(1)
      : null;

    const [vipResult, entResult] = await Promise.all([
      vipQuery,
      entQuery ?? Promise.resolve({ data: [] as any[] }),
    ]);

    const vipData = vipResult.data;
    const isVip =
      vipData?.is_vip &&
      (!vipData.vip_expires_at ||
        new Date(vipData.vip_expires_at) >= new Date());
    const hasEntitlement = (entResult.data as any[])?.length > 0;

    return Response.json({ full: isVip || hasEntitlement });
  } catch {
    return Response.json({ full: false });
  }
}
