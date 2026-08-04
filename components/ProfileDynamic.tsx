"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { T } from "@/lib/theme";
import { signOutAction } from "@/app/actions/auth";

/* ---- Saved count badge ---- */
export function SavedCount() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    // Check localStorage first
    try {
      const local = localStorage.getItem("verza-saved");
      if (local) {
        const localCount = JSON.parse(local).length;
        queueMicrotask(() => setCount(localCount));
      }
    } catch {}

    // Then API
    fetch("/api/saved-list")
      .then((r) => r.json())
      .then((d) => { if (d.items?.length > 0) setCount(d.items.length); })
      .catch(() => {});
  }, []);

  return <>{count !== null && count > 0 ? `${count} saved` : "0 saved"}</>;
}

/* ---- Continue watching count ---- */
export function WatchingCount() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/watch-progress")
      .then((r) => r.json())
      .then((d) => { if (d.items) setCount(d.items.length); })
      .catch(() => {});
  }, []);

  return <>{count !== null && count > 0 ? `${count} in progress` : "No history"}</>;
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
export function DeleteAccountButton() {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (!confirming) {
      setConfirming(true);
      setTimeout(() => setConfirming(false), 6000); // disarm after 6s
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/account/delete", { method: "POST" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setError(body.error ?? "Deletion failed — contact support@verzatv.com");
        setLoading(false);
        setConfirming(false);
        return;
      }
      try { await signOutAction(); } catch {}
      try {
        localStorage.removeItem("verza-saved");
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
