import { NextRequest } from "next/server";
import { createServerSupabase } from "@/lib/supabase/middleware";
import { getServiceClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const rawNext = searchParams.get("next") ?? "/";
  // Prevent open redirect — only allow relative paths
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/";

  if (!code) {
    return Response.redirect(new URL("/sign-in?error=missing_code", req.url));
  }

  const supabase = await createServerSupabase();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return Response.redirect(new URL("/sign-in?error=auth", req.url));
  }

  // Claim any pending entitlements for this email
  if (data.user?.email) {
    try {
      const service = getServiceClient();
      const email = data.user.email.toLowerCase();

      const { data: pending } = await service
        .from("pending_entitlements")
        .select("id, series_slug, purchase_id")
        .eq("email", email);

      if (pending && pending.length > 0) {
        for (const p of pending) {
          // Create real entitlement
          await service.from("entitlements").upsert(
            {
              user_id: data.user.id,
              series_slug: p.series_slug,
              purchase_id: p.purchase_id,
            },
            { onConflict: "user_id,series_slug" },
          );

          // Add to saved list
          await service.from("saved_list").upsert(
            {
              user_id: data.user.id,
              series_slug: p.series_slug,
              created_at: new Date().toISOString(),
            },
            { onConflict: "user_id,series_slug" },
          );
        }

        // Remove claimed pending entitlements
        await service
          .from("pending_entitlements")
          .delete()
          .eq("email", email);

        console.log("[auth/callback] Claimed", pending.length, "pending entitlements for", email);
      }
    } catch (err) {
      console.error("[auth/callback] Error claiming entitlements:", err);
    }
  }

  return Response.redirect(new URL(next, req.url));
}
