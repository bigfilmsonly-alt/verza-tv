"use client";

/**
 * Resume + re-engagement helpers.
 *
 * Verza is a web app / PWA (not a native iOS app), so it can't create the
 * native ActivityKit "Live Activity" lock-screen pill. This is the
 * web-native equivalent: when a viewer is interrupted mid-episode we remember
 * the exact spot and fire a "Continue watching" notification (via the already
 * registered service worker) that deep-links straight back to that second.
 *
 * On an installed PWA (iOS 16.4+, Android, desktop) that notification shows on
 * the lock / home screen. Everything here is best-effort and silently no-ops
 * when notifications aren't available or granted.
 */

export interface ResumeItem {
  slug: string;
  episode: number;
  title: string;
  poster: string; // root-relative or absolute image URL
  positionS: number; // seconds to resume at
  updatedAt: number; // Date.now()
}

const LS_KEY = "verza_last_watching";
const ASKED_KEY = "verza_resume_notif_asked";

/** Build a deep link that resumes an episode at a given position. */
export function buildResumeUrl(slug: string, episode: number, positionS: number): string {
  const t = Math.max(0, Math.floor(positionS || 0));
  return `/series/${slug}/${episode}${t > 2 ? `?t=${t}` : ""}`;
}

/** Persist the currently-watching item so the home row can resume instantly. */
export function saveLastWatching(item: ResumeItem): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(item));
  } catch {
    /* storage unavailable */
  }
}

export function readLastWatching(): ResumeItem | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as ResumeItem) : null;
  } catch {
    return null;
  }
}

export function clearLastWatching(): void {
  try {
    localStorage.removeItem(LS_KEY);
  } catch {
    /* storage unavailable */
  }
}

/**
 * Ask for notification permission ONCE, on a real user gesture (a play tap).
 * iOS only allows this from an installed PWA in response to a gesture.
 */
export async function maybeRequestResumePermission(): Promise<void> {
  try {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "default") return;
    if (localStorage.getItem(ASKED_KEY)) return;
    localStorage.setItem(ASKED_KEY, "1");
    await Notification.requestPermission();
  } catch {
    /* not supported / blocked */
  }
}

/**
 * Fire the local "Continue watching" reminder through the service worker.
 * Clicking it routes to buildResumeUrl (handled by sw.js notificationclick).
 */
export async function notifyResume(item: ResumeItem): Promise<void> {
  try {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator) || !("Notification" in window)) return;
    if (Notification.permission !== "granted") return;
    const reg = await navigator.serviceWorker.ready;
    const options: NotificationOptions & { image?: string; renotify?: boolean } = {
      body: `${item.title} · EP.${item.episode}`,
      icon: item.poster || "/apple-touch-icon-180.png",
      badge: "/apple-touch-icon-180.png",
      image: item.poster || undefined,
      tag: "verza-resume",
      renotify: true,
      requireInteraction: true,
      data: { url: buildResumeUrl(item.slug, item.episode, item.positionS) },
    };
    await reg.showNotification("Continue watching", options);
  } catch {
    /* best-effort */
  }
}

/** Dismiss any open resume reminder (call when the viewer returns to play). */
export async function clearResumeNotification(): Promise<void> {
  try {
    if (!("serviceWorker" in navigator)) return;
    const reg = await navigator.serviceWorker.ready;
    const notes = await reg.getNotifications({ tag: "verza-resume" });
    notes.forEach((n) => n.close());
  } catch {
    /* best-effort */
  }
}
