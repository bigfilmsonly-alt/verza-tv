"use client";

import { useEffect, useState } from "react";
import { isIOSApp } from "@/lib/platform";

/**
 * Renders children on the web, nothing inside the iOS app (App Store
 * Guideline 3.1.1 — purchase surfaces must not appear in the app).
 * Detection runs post-mount so server HTML stays identical for both.
 */
export default function HideInIOSApp({ children }: { children: React.ReactNode }) {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    if (isIOSApp()) setHidden(true);
  }, []);
  if (hidden) return null;
  return <>{children}</>;
}
