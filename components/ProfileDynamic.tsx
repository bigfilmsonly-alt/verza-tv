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
      if (local) setCount(JSON.parse(local).length);
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
