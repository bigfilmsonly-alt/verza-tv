"use client";

import { createBrowserSupabase } from "@/lib/supabase/client";

/**
 * Require an authenticated browser session before starting digital checkout.
 *
 * Checkout endpoints still enforce authentication server-side. This client
 * guard keeps signed-out taps from dead-ending on a 401 and avoids recording a
 * checkout-started event until the user can actually reach Checkout.
 */
export async function requireCheckoutUser(returnTo?: string): Promise<boolean> {
  const supabase = createBrowserSupabase();
  const { data, error } = supabase
    ? await supabase.auth.getSession()
    : { data: { session: null }, error: new Error("Auth is unavailable") };

  if (!error && data.session) return true;

  const currentPath = `${window.location.pathname}${window.location.search}`;
  const next = returnTo?.startsWith("/") && !returnTo.startsWith("//")
    ? returnTo
    : currentPath.startsWith("//")
      ? "/"
      : currentPath;
  window.location.assign(`/sign-in?next=${encodeURIComponent(next)}`);
  return false;
}
