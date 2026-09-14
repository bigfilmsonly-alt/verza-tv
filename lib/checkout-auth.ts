"use client";

import { createBrowserSupabase } from "@/lib/supabase/client";
import { trackAuthRequired } from "@/lib/track";

/**
 * Marks a return path as "the viewer was trying to unlock when we interrupted
 * them". Read once on arrival and stripped from the URL immediately, so a
 * refresh or a shared link can never re-trigger checkout.
 */
export const UNLOCK_INTENT_PARAM = "resume_unlock";

/**
 * Where to send the viewer back to after sign-in so their unlock resumes.
 *
 * Deliberately returns pathname+search ONLY, never an absolute URL, so this
 * cannot become an open redirect no matter what the page URL contains. The
 * series being purchased is NOT encoded here — the resuming component reads it
 * from its own props, so a crafted link cannot aim the resume at another title.
 */
export function unlockReturnPath(): string {
  if (typeof window === "undefined") return "/";
  try {
    const url = new URL(window.location.href);
    url.searchParams.set(UNLOCK_INTENT_PARAM, "1");
    const path = `${url.pathname}${url.search}`;
    return path.startsWith("/") && !path.startsWith("//") ? path : "/";
  } catch {
    return "/";
  }
}

/**
 * Require an authenticated browser session before starting digital checkout.
 *
 * Checkout endpoints still enforce authentication server-side. This client
 * guard keeps signed-out taps from dead-ending on a 401 and avoids recording a
 * checkout-started event until the user can actually reach Checkout.
 */
export async function requireCheckoutUser(
  returnTo?: string,
  /* Analytics context only — never affects authorization. Callers pass which
     control was tapped so the turn-away can be attributed to a surface. */
  surface = "unknown",
  seriesSlug?: string,
): Promise<boolean> {
  const supabase = createBrowserSupabase();
  const { data, error } = supabase
    ? await supabase.auth.getSession()
    : { data: { session: null }, error: new Error("Auth is unavailable") };

  if (!error && data.session) return true;

  /* Record the turn-away BEFORE navigating away. window.location.assign()
     tears the page down, so anything emitted after it is lost — which is the
     same class of bug as recording the unlock tap after this guard. */
  trackAuthRequired(surface, seriesSlug);

  const currentPath = `${window.location.pathname}${window.location.search}`;
  const next = returnTo?.startsWith("/") && !returnTo.startsWith("//")
    ? returnTo
    : currentPath.startsWith("//")
      ? "/"
      : currentPath;
  window.location.assign(`/sign-in?next=${encodeURIComponent(next)}`);
  return false;
}
