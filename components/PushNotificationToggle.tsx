"use client";

import { useEffect, useState, useCallback } from "react";
import { T } from "@/lib/theme";

/**
 * PushNotificationToggle — "use client" component for the profile page.
 * Checks browser support, manages push subscription lifecycle,
 * and syncs with /api/push/subscribe.
 */

type Status = "loading" | "unsupported" | "denied" | "off" | "on";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function PushNotificationToggle() {
  const [status, setStatus] = useState<Status>("loading");

  // Check current subscription state on mount
  useEffect(() => {
    if (!("PushManager" in window) || !("serviceWorker" in navigator)) {
      setStatus("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setStatus("denied");
      return;
    }

    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setStatus(sub ? "on" : "off"))
      .catch(() => setStatus("off"));
  }, []);

  const subscribe = useCallback(async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("denied");
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        console.error("[push] NEXT_PUBLIC_VAPID_PUBLIC_KEY not set");
        return;
      }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey).buffer as ArrayBuffer,
      });

      // Send subscription to our API
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });

      setStatus("on");
    } catch (err) {
      console.error("[push] Subscribe failed:", err);
    }
  }, []);

  const unsubscribe = useCallback(async () => {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        // Notify API to remove subscription
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setStatus("off");
    } catch (err) {
      console.error("[push] Unsubscribe failed:", err);
    }
  }, []);

  const toggle = useCallback(() => {
    if (status === "on") {
      unsubscribe();
    } else {
      subscribe();
    }
  }, [status, subscribe, unsubscribe]);

  // Don't render on unsupported browsers
  if (status === "unsupported") return null;

  const isOn = status === "on";
  const isDenied = status === "denied";
  const isLoading = status === "loading";

  return (
    <button
      onClick={toggle}
      disabled={isDenied || isLoading}
      className="flex items-center gap-3 px-4 py-3.5 w-full transition-colors"
      style={{
        color: T.text,
        borderBottom: `1px solid ${T.line}`,
        background: "transparent",
        cursor: isDenied || isLoading ? "not-allowed" : "pointer",
        opacity: isDenied ? 0.5 : 1,
      }}
    >
      {/* Bell icon */}
      <span style={{ color: T.textMute }}>
        <svg
          width={20}
          height={20}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 01-3.46 0" />
        </svg>
      </span>

      <span className="text-sm font-medium flex-1 text-left">
        Notifications
      </span>

      {/* Status label */}
      <span className="text-xs" style={{ color: T.textMute }}>
        {isLoading
          ? ""
          : isDenied
            ? "Blocked"
            : isOn
              ? "On"
              : "Off"}
      </span>

      {/* Toggle pill */}
      <span
        className="relative inline-flex items-center rounded-full transition-colors"
        style={{
          width: 40,
          height: 22,
          background: isOn ? T.accent : "rgba(255,255,255,.12)",
        }}
      >
        <span
          className="block rounded-full bg-white shadow transition-transform"
          style={{
            width: 18,
            height: 18,
            transform: isOn ? "translateX(20px)" : "translateX(2px)",
          }}
        />
      </span>
    </button>
  );
}
