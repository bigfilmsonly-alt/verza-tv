import { NextRequest } from "next/server";
import { createServerSupabase } from "@/lib/supabase/middleware";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (!code) {
    return Response.redirect(new URL("/sign-in?error=missing_code", req.url));
  }

  const supabase = await createServerSupabase();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return Response.redirect(new URL("/sign-in?error=auth", req.url));
  }

  return Response.redirect(new URL(next, req.url));
}
