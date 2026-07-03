"use client";

import { useEffect } from "react";

/**
 * The /share route exists only to serve a clean, un-cached link-preview card.
 * Real visitors are bounced to the homepage immediately; crawlers (which don't
 * run JS) stay to read the OG tags.
 */
export default function ShareRedirect() {
  useEffect(() => {
    window.location.replace("/");
  }, []);

  return null;
}
