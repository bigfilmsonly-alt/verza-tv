"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import {
  guestStateNeedsMigration,
  markGuestStateMigrated,
  readGuestSnapshot,
  writeSavedSlugs,
  readSavedSlugs,
} from "@/lib/guest-storage";

/**
 * Carries a guest's history into their account the moment they sign in.
 *
 * BUG THIS FIXES: registration was a reset. Watch progress and the saved list
 * both lived on the device for a signed-out viewer; neither was ever handed to
 * the account, so someone who finally created an account at the paywall landed
 * in it with an empty Continue Watching rail and an empty My List, having just
 * watched four episodes and bookmarked the show.
 *
 * WHY IT LISTENS TO THE PATHNAME. signInAction / signUpAction end in
 * redirect(), which the App Router serves as a CLIENT-SIDE navigation — the
 * root layout does not remount, so a mount-only effect would never see the new
 * session. The pathname changing is the one signal available on this side of
 * that redirect.
 *
 * WHY IT COSTS NOTHING ON A NORMAL DEVICE. guestStateNeedsMigration() is a
 * localStorage read against a digest of what was last merged. A device with no
 * guest state, or with state the account has already absorbed, makes zero
 * network requests — the probe below only runs when there is genuinely
 * something an account has not seen.
 */
export default function GuestStateSync() {
  const pathname = usePathname();
  const inFlight = useRef(false);
  const lastProbeAt = useRef(0);

  useEffect(() => {
    // Cheapest possible early-out, and the common case.
    if (!guestStateNeedsMigration()) return;
    if (inFlight.current) return;
    // A signed-out viewer would otherwise re-probe on every route change for
    // the whole session. Once every 15 s is plenty to catch a sign-in.
    const now = Date.now();
    if (now - lastProbeAt.current < 15_000) return;
    lastProbeAt.current = now;

    let cancelled = false;
    inFlight.current = true;

    (async () => {
      try {
        const probe = await fetch("/api/account/sync");
        if (cancelled || !probe.ok) return;
        const { signedIn } = (await probe.json()) as { signedIn?: boolean };
        // Still a guest: leave the digest unstamped so this runs again after
        // they do sign in. Nothing is lost by waiting.
        if (!signedIn) return;

        const snapshot = readGuestSnapshot();
        const res = await fetch("/api/account/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(snapshot),
        });
        if (cancelled || !res.ok) return;

        // The merge is a union on the server side, so the account may now hold
        // titles this device never knew about. Pull the authoritative list back
        // down so My List reads the same on this device as on the account.
        try {
          const listRes = await fetch("/api/saved-list");
          if (listRes.ok) {
            const data = (await listRes.json()) as { items?: { seriesSlug: string }[] };
            const merged = new Set([
              ...(data.items ?? []).map((i) => i.seriesSlug),
              ...readSavedSlugs(),
            ]);
            writeSavedSlugs([...merged]);
          }
        } catch {
          /* the merge already landed; the local mirror can catch up later */
        }

        if (!cancelled) markGuestStateMigrated();
      } catch {
        /* offline or rate-limited — the digest stays unstamped and it retries */
      } finally {
        inFlight.current = false;
      }
    })();

    return () => {
      cancelled = true;
      inFlight.current = false;
    };
  }, [pathname]);

  return null;
}
