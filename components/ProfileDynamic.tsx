"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { T } from "@/lib/theme";
import { signOutAction } from "@/app/actions/auth";
import { readSavedSlugs, clearGuestState } from "@/lib/guest-storage";
import { readGuestContinueWatching } from "@/lib/continue-watching";

/* ---- Saved count badge ---- */
export function SavedCount() {
  const [count, setCount] = useState<number>(0);

  useEffect(() => {
    let cancelled = false;
    // This device first, so the number is right on the first paint and stays
    // right for a guest, whose /api/saved-list always answers {items: []}.
    const local = readSavedSlugs().length;
    queueMicrotask(() => { if (!cancelled) setCount(local); });

    fetch("/api/saved-list")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { items?: unknown[] } | null) => {
        if (cancelled || !d?.items || d.items.length === 0) return;
        setCount(d.items.length);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  return <>{count > 0 ? `${count} saved` : "0 saved"}</>;
}

/* ---- Continue watching count ---- */
/*  BUG THIS FIXES: this read only the account, so it said "No history" to
    every signed-out viewer no matter how much of the free preview they had
    watched — and the free preview is the guest product. */
export function WatchingCount() {
  const [count, setCount] = useState<number>(0);

  useEffect(() => {
    let cancelled = false;
    const local = readGuestContinueWatching().length;
    queueMicrotask(() => { if (!cancelled) setCount(local); });

    fetch("/api/watch-progress")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { items?: unknown[] } | null) => {
        if (cancelled || !d?.items || d.items.length === 0) return;
        setCount(d.items.length);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  return <>{count > 0 ? `${count} in progress` : "No history"}</>;
}

/* ---- Purchase count ---- */
/*  The Purchase History row shipped with the literal string "No purchases"
    hard-coded into app/me/page.tsx, so it read "No purchases" to a customer
    who had bought eighty-six of them. No price is rendered here — Apple
    guideline 3.1.1 (AGENTS.md rule 11) — only how many titles are unlocked. */
export function PurchaseCount() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/entitlements")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { entitlements?: unknown[] } | null) => {
        if (cancelled) return;
        setCount(d?.entitlements?.length ?? 0);
      })
      .catch(() => { if (!cancelled) setCount(null); });
    return () => { cancelled = true; };
  }, []);

  if (count === null) return <>&nbsp;</>;
  return <>{count > 0 ? `${count} unlocked` : "No purchases"}</>;
}

/* ---- Dark mode toggle ---- */
export function DarkModeToggle() {
  return (
    <div
      className="flex items-center gap-3 px-4 py-3"
      style={{ borderBottom: `1px solid ${T.line}` }}
    >
      <span style={{ color: T.textDim }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
        </svg>
      </span>
      <span className="flex-1 text-sm font-medium" style={{ color: T.text }}>Dark Mode</span>
      <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(46,204,113,0.15)", color: "#2ecc71" }}>
        Always On
      </span>
    </div>
  );
}

/* ---- Sign out button ---- */
/**
 * Two-step permanent account deletion (Apple App Review 5.1.1(v) requires an
 * in-app path). First tap arms the confirmation; second tap deletes.
 */
export function DeleteAccountButton({
  expectedUserId,
}: {
  expectedUserId: string | null;
}) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (!expectedUserId) return;
    if (!confirming) {
      setConfirming(true);
      setTimeout(() => setConfirming(false), 6000); // disarm after 6s
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expectedUserId }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setError(body.error ?? "Deletion failed — contact support@verzatv.com");
        setLoading(false);
        setConfirming(false);
        return;
      }
      try { await signOutAction(); } catch {}
      try {
        // Saved list, guest watch history and the migration digest.
        // The button's own copy promises to remove "your account, watch
        // history, saved list, and purchases access" — leaving a full local
        // watch history on the device would have made that sentence false.
        clearGuestState();
        localStorage.removeItem("verza-lang");
        // Guest-purchase unlock tokens die with the account too.
        for (const key of Object.keys(localStorage)) {
          if (key.startsWith("verza-unlock:")) localStorage.removeItem(key);
        }
      } catch {}
      window.location.replace("/"); // full reload — no stale session state
    } catch {
      setError("Deletion failed — contact support@verzatv.com");
      setLoading(false);
      setConfirming(false);
    }
  }

  if (!expectedUserId) return null;

  return (
    <div className="mt-3">
      <button
        onClick={handleDelete}
        disabled={loading}
        className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-opacity border-0 cursor-pointer"
        style={{
          background: confirming ? "rgba(224, 17, 95, 0.12)" : "transparent",
          border: `1px solid ${confirming ? "rgba(224, 17, 95, 0.5)" : T.line}`,
          color: confirming ? "#E0115F" : T.textMute,
          opacity: loading ? 0.5 : 1,
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
        </svg>
        {loading
          ? "Deleting account…"
          : confirming
            ? "Tap again to permanently delete"
            : "Delete Account"}
      </button>
      {error && (
        <p className="mt-2 text-xs text-center" style={{ color: "#E0115F" }}>{error}</p>
      )}
      <p className="mt-2 text-[11px] text-center" style={{ color: T.textMute }}>
        Permanently removes your account, watch history, saved list, and purchases access. This cannot be undone.
      </p>
    </div>
  );
}

export function SignOutButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  return (
    <button
      onClick={async () => {
        setLoading(true);
        try {
          await signOutAction();
        } catch {
          // Clear local data and redirect
          localStorage.removeItem("verza-saved");
          localStorage.removeItem("verza-lang");
          router.push("/");
        }
      }}
      disabled={loading}
      className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-opacity border-0 cursor-pointer"
      style={{
        background: T.surface,
        border: `1px solid ${T.line}`,
        color: T.textMute,
        opacity: loading ? 0.5 : 1,
      }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </svg>
      {loading ? "Signing out..." : "Sign Out"}
    </button>
  );
}
