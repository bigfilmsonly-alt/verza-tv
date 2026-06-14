import { NextRequest } from "next/server";

/**
 * OAuth callback handler — Supabase Auth will redirect here after
 * a successful Google / Apple sign-in. Swap the stub below for the
 * real Supabase `exchangeCodeForSession` flow in production.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (!code) {
    return Response.redirect(new URL("/sign-in?error=missing_code", req.url));
  }

  // TODO: Exchange `code` for a Supabase session:
  //
  // const supabase = createServerClient(cookies());
  // const { error } = await supabase.auth.exchangeCodeForSession(code);
  // if (error) return Response.redirect(new URL("/sign-in?error=auth", req.url));

  return Response.redirect(new URL(next, req.url));
}
