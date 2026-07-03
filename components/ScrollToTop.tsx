"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Resets scroll to the top on every route change. On desktop the app is wrapped
 * in an iPhone frame and the scroll container is the `.device-screen` div (not
 * the window); on mobile the window scrolls. Reset both so returning to a
 * section always lands at the top.
 */
export default function ScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    const screen = document.querySelector<HTMLElement>(".device-screen");
    if (screen) screen.scrollTo({ top: 0, left: 0 });
    window.scrollTo({ top: 0, left: 0 });
  }, [pathname]);

  return null;
}
