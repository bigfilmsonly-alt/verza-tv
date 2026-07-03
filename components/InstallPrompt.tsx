"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { T } from "@/lib/theme";

/**
 * InstallPrompt — a gentle, dismissible banner that nudges viewers toward the
 * state where "Continue watching" reminders actually light up on their lock
 * screen: an installed PWA with notifications granted.
 *
 * Modes (auto-detected):
 *  - "install-ios"     iOS Safari, not installed → Share ▸ Add to Home Screen
 *                      (web notifications require an installed PWA on iOS 16.4+)
 *  - "install-android" Chrome/Edge/desktop with a native beforeinstallprompt
 *  - "reminders"       supported + permission not yet granted → one-tap enable
 * Renders nothing when everything is already set up, unsupported, or blocked.
 */

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type Mode = "install-ios" | "install-android" | "reminders" | null;

const DISMISS_KEY = "verza_install_prompt_dismissed";
const DISMISS_DAYS = 7;
const SHOW_DELAY_MS = 6000;

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

function recentlyDismissed(): boolean {
  try {
    const ts = Number(localStorage.getItem(DISMISS_KEY) || 0);
    return ts > 0 && Date.now() - ts < DISMISS_DAYS * 86400000;
  } catch {
    return false;
  }
}

// Immersive full-screen players — never cover these with the banner.
const IMMERSIVE = /^\/(series\/[^/]+\/|shorts|horizontal|watch(\/|$))/;

export default function InstallPrompt() {
  const pathname = usePathname();
  const [mode, setMode] = useState<Mode>(null);
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const deferredRef = useRef<BeforeInstallPromptEvent | null>(null);
  const onImmersive = IMMERSIVE.test(pathname || "");

  const decideMode = useCallback((): Mode => {
    if (typeof window === "undefined") return null;

    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true;

    const ua = navigator.userAgent || "";
    const isIOS = /iphone|ipad|ipod/i.test(ua) && !/windows phone/i.test(ua);
    const canNotify = "Notification" in window && "serviceWorker" in navigator;
    const permission = canNotify ? Notification.permission : "denied";

    // Already installed and receiving reminders — nothing to do.
    if (standalone && permission === "granted") return null;

    // iOS must be installed to the home screen before notifications work.
    if (!standalone && isIOS) return "install-ios";

    // Android / desktop with a captured native install prompt.
    if (!standalone && deferredRef.current) return "install-android";

    // Installable-or-not, we can still ask for reminders directly here.
    if (canNotify && permission === "default") return "reminders";

    return null;
  }, []);

  useEffect(() => {
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      deferredRef.current = e as BeforeInstallPromptEvent;
      if (!recentlyDismissed()) {
        const m = decideMode();
        if (m) setMode(m);
      }
    };
    const onInstalled = () => {
      deferredRef.current = null;
      setVisible(false);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);

    let timer: ReturnType<typeof setTimeout> | null = null;
    if (!recentlyDismissed()) {
      timer = setTimeout(() => {
        const m = decideMode();
        if (m) setMode(m);
      }, SHOW_DELAY_MS);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
      if (timer) clearTimeout(timer);
    };
  }, [decideMode]);

  // Fade in once a mode is chosen.
  useEffect(() => {
    if (mode) {
      const id = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(id);
    }
  }, [mode]);

  const dismiss = useCallback(() => {
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* storage unavailable */
    }
    setTimeout(() => setMode(null), 300);
  }, []);

  const installAndroid = useCallback(async () => {
    const evt = deferredRef.current;
    if (!evt) return dismiss();
    setBusy(true);
    try {
      await evt.prompt();
      await evt.userChoice;
    } catch {
      /* user cancelled */
    }
    deferredRef.current = null;
    setBusy(false);
    dismiss();
  }, [dismiss]);

  const enableReminders = useCallback(async () => {
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setBusy(false);
        dismiss();
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (vapidKey) {
        try {
          const existing = await reg.pushManager.getSubscription();
          const sub =
            existing ??
            (await reg.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: urlBase64ToUint8Array(vapidKey).buffer as ArrayBuffer,
            }));
          await fetch("/api/push/subscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(sub.toJSON()),
          }).catch(() => {});
        } catch {
          /* push subscribe optional; local reminders still work */
        }
      }
    } catch {
      /* not supported / blocked */
    }
    setBusy(false);
    dismiss();
  }, [dismiss]);

  if (!mode || onImmersive) return null;

  const copy =
    mode === "reminders"
      ? {
          title: "Never lose your place",
          body: "Get a Continue Watching reminder when you're interrupted mid-episode.",
          cta: "Turn on reminders",
        }
      : {
          title: "Add VERZA TV to your home screen",
          body: "Install the app to get lock-screen reminders and pick up right where you left off.",
          cta: "Add to Home Screen",
        };

  return (
    <div
      role="dialog"
      aria-label={copy.title}
      className="fixed left-0 right-0 z-[70] flex justify-center px-3"
      style={{
        bottom: "calc(76px + env(safe-area-inset-bottom, 0px))",
        pointerEvents: "none",
      }}
    >
      <div
        className="w-full rounded-2xl overflow-hidden"
        style={{
          maxWidth: 420,
          pointerEvents: "auto",
          background: "rgba(18,18,28,0.98)",
          border: `1px solid ${T.line}`,
          boxShadow: "0 12px 40px rgba(0,0,0,0.55)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(12px)",
          transition: "opacity 0.32s ease, transform 0.32s cubic-bezier(0.22,1,0.36,1)",
        }}
      >
        <div className="flex items-start gap-3 p-4">
          {/* App emblem */}
          <img
            src="/apple-touch-icon-180.png"
            alt=""
            width={44}
            height={44}
            className="rounded-xl flex-shrink-0"
            style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.4)" }}
          />

          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold" style={{ color: T.text }}>
              {copy.title}
            </p>
            <p className="text-xs mt-0.5 leading-snug" style={{ color: T.textMute }}>
              {copy.body}
            </p>

            {mode === "install-ios" ? (
              <p
                className="text-xs mt-2 flex items-center gap-1.5 flex-wrap"
                style={{ color: T.text }}
              >
                Tap
                <span
                  className="inline-flex items-center justify-center rounded"
                  style={{ background: "rgba(255,255,255,0.12)", padding: "2px 5px" }}
                >
                  {/* iOS share glyph */}
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 16V4" />
                    <path d="M8 8l4-4 4 4" />
                    <path d="M4 12v7a1 1 0 001 1h14a1 1 0 001-1v-7" />
                  </svg>
                </span>
                then <b>Add to Home Screen</b>
              </p>
            ) : (
              <button
                onClick={mode === "reminders" ? enableReminders : installAndroid}
                disabled={busy}
                className="mt-2.5 px-4 py-2 rounded-full text-xs font-bold border-0 cursor-pointer"
                style={{
                  background: "linear-gradient(135deg, #E0115F, #8B5CF6)",
                  color: "#fff",
                  opacity: busy ? 0.7 : 1,
                }}
              >
                {busy ? "…" : copy.cta}
              </button>
            )}
          </div>

          {/* Dismiss */}
          <button
            onClick={dismiss}
            aria-label="Dismiss"
            className="flex-shrink-0 -mt-1 -mr-1 p-1 border-0 bg-transparent cursor-pointer"
            style={{ color: T.textMute }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
