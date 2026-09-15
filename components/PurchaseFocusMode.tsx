"use client";

import { useEffect } from "react";

/**
 * Narrows the app chrome while a purchase is in progress.
 *
 * The bottom navigation is five one-tap exits from a checkout the viewer has
 * already committed to: they tapped Unlock, they were sent here to sign in, and
 * the next thing they should do is finish. Discover, Shorts, Shop, Library and
 * Profile all lead away from that.
 *
 * Deliberately a body class and a stylesheet rule rather than a change to
 * BottomNav itself:
 *
 *  - BottomNav mounts in the root layout and is shared by every route. Teaching
 *    it to read search params would pull `useSearchParams()` into the root
 *    layout, which forces a Suspense boundary and changes rendering for the
 *    whole site to hide one element on one screen.
 *  - This is presentation only. No route, no guard and no auth path is touched,
 *    so nothing about where the viewer can actually go has changed. They still
 *    have Back, and the nav returns the moment this unmounts.
 */
export default function PurchaseFocusMode() {
  useEffect(() => {
    const { body } = document;
    body.classList.add("purchase-focus");
    return () => body.classList.remove("purchase-focus");
  }, []);

  return null;
}
