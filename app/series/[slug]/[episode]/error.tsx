"use client";

/*
 * Route error boundary for the episode player.
 *
 * WHY: before this file existed there was NO error boundary anywhere on the
 * series route (no app/error.tsx, no global-error.tsx, and EpisodeFeed renders
 * no error state of its own). Any thrown render error inside the feed therefore
 * escaped to Next's default handler, and a viewer sitting on the paywall — the
 * single highest-value moment in the product — could be shown a raw error
 * instead of the unlock screen.
 *
 * This does NOT weaken the paywall. It renders only when the feed has already
 * failed, and its primary action reloads the same episode URL, which re-enters
 * the normal entitlement path server-side. It never grants access to anything.
 *
 * Note for whoever reads this next: a WebContent process kill on iOS (Safari's
 * own "This page couldn't load") happens BELOW React and cannot be caught here.
 * That failure mode is memory, not an exception — see
 * docs/handoff/IOS-CONTENT-PROCESS-CRASH.md.
 */

import { useEffect } from "react";
import Link from "next/link";

export default function EpisodeError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface it for whoever is debugging; the digest is what correlates to the
    // server log entry for a server-side throw.
    console.error("[episode-feed] render error", error?.digest ?? "", error);
  }, [error]);

  return (
    <div
      className="flex flex-col items-center justify-center text-center px-6"
      style={{ minHeight: "100dvh", background: "#07070E", color: "#F5F4F8" }}
    >
      <div
        className="flex items-center justify-center rounded-full mb-5"
        style={{ width: 56, height: 56, background: "rgba(224,17,95,0.14)" }}
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#E0115F" strokeWidth="2" strokeLinecap="round">
          <path d="M12 9v4" />
          <path d="M12 17h.01" />
          <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
        </svg>
      </div>

      <h1 className="text-lg font-bold mb-2">This episode didn&apos;t load</h1>
      <p className="text-sm mb-6" style={{ color: "#A0A0B0", maxWidth: 320 }}>
        Something went wrong on our side. Your place in the series is saved.
      </p>

      <div className="flex items-center gap-2.5">
        <button
          onClick={reset}
          className="px-5 py-2.5 rounded-full text-sm font-semibold"
          style={{ background: "linear-gradient(135deg, #E0115F, #8B5CF6)", color: "#fff" }}
        >
          Try again
        </button>
        <Link
          href="/"
          className="px-5 py-2.5 rounded-full text-sm font-semibold no-underline"
          style={{ background: "rgba(255,255,255,0.08)", color: "#F5F4F8" }}
        >
          Back to browse
        </Link>
      </div>
    </div>
  );
}
