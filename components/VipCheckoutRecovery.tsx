"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function VipCheckoutRecovery({
  sessionId,
}: {
  sessionId?: string;
}) {
  const router = useRouter();

  useEffect(() => {
    if (!sessionId?.startsWith("cs_")) return;
    let cancelled = false;

    void (async () => {
      for (let attempt = 0; attempt < 4 && !cancelled; attempt += 1) {
        if (attempt > 0) {
          await new Promise((resolve) => setTimeout(resolve, 1500));
        }
        const response = await fetch(
          `/api/subscribe/confirm?session_id=${encodeURIComponent(sessionId)}`,
          { method: "POST" },
        ).catch(() => null);
        if (response?.ok) {
          router.replace("/me");
          router.refresh();
          return;
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router, sessionId]);

  return null;
}
