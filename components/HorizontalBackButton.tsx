"use client";

import { T } from "@/lib/theme";

export default function HorizontalBackButton() {
  return (
    <div className="sticky top-0 z-30 px-4 pt-3 pb-2" style={{ background: "linear-gradient(to bottom, var(--t-bg) 60%, transparent)" }}>
      <button
        onClick={() => { window.location.href = "/?tab=reality"; }}
        className="flex items-center gap-2 border-0 bg-transparent cursor-pointer p-0"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F5F4F8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
        <span className="text-sm font-semibold" style={{ color: T.text }}>Storage Pirates</span>
      </button>
    </div>
  );
}
