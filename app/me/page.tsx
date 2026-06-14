import type { Metadata } from "next";
import Link from "next/link";
import { T } from "@/lib/theme";
import { BRAND } from "@/lib/config";

export const metadata: Metadata = {
  title: `My Account | ${BRAND.name}`,
  description:
    "Manage your Verza TV account, coin balance, library, and settings.",
};

export default function MePage() {
  return (
    <section className="px-4 pt-6 pb-8">
      <h1
        className="text-2xl font-bold mb-6"
        style={{ color: T.text }}
      >
        My Account
      </h1>

      {/* Sign in prompt */}
      <div
        className="rounded-xl p-5 mb-6 text-center"
        style={{
          background: `linear-gradient(135deg, ${T.accent}11, ${T.accent}22)`,
          border: `1px solid ${T.accent}33`,
        }}
      >
        <svg
          className="mx-auto mb-3"
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke={T.accent}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
        <p
          className="text-base font-semibold mb-1"
          style={{ color: T.text }}
        >
          Sign in to access your account
        </p>
        <p
          className="text-sm mb-4 leading-relaxed"
          style={{ color: T.textDim }}
        >
          Sync your library, coin balance, and watch history across all
          your devices.
        </p>
        <button
          className="px-8 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90"
          style={{
            background: T.accent,
            color: "#fff",
          }}
        >
          Sign In
        </button>
      </div>

      {/* Coin Balance Card */}
      <div
        className="rounded-xl p-5 mb-6"
        style={{
          background: `linear-gradient(135deg, ${T.coin}11, ${T.coin}22)`,
          border: `1px solid ${T.coin}33`,
        }}
      >
        <p
          className="text-xs font-medium uppercase tracking-wider mb-1"
          style={{ color: T.coin }}
        >
          Coin Balance
        </p>
        <div className="flex items-baseline gap-2">
          <span
            className="text-4xl font-bold"
            style={{ color: T.coin }}
          >
            0
          </span>
          <span className="text-sm" style={{ color: `${T.coin}99` }}>
            coins
          </span>
        </div>
        <Link
          href="/shop"
          className="inline-block mt-3 px-5 py-2 rounded-lg text-sm font-semibold no-underline transition-opacity hover:opacity-90"
          style={{
            background: T.coin,
            color: T.bg,
          }}
        >
          Buy Coins
        </Link>
      </div>

      {/* Menu Items */}
      <div
        className="rounded-xl overflow-hidden"
        style={{
          background: T.surface,
          border: `1px solid ${T.line}`,
        }}
      >
        {[
          {
            label: "My Library",
            href: "/me",
            icon: (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
              </svg>
            ),
            detail: "0 series",
          },
          {
            label: "Watch History",
            href: "/me",
            icon: (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            ),
            detail: "No history yet",
          },
          {
            label: "Purchases",
            href: "/me",
            icon: (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                <line x1="1" y1="10" x2="23" y2="10" />
              </svg>
            ),
            detail: "No purchases",
          },
          {
            label: "Settings",
            href: "/me",
            icon: (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
              </svg>
            ),
            detail: "",
          },
          {
            label: "Help & FAQ",
            href: "/help",
            icon: (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            ),
            detail: "",
          },
        ].map((item, i) => (
          <Link
            key={item.label}
            href={item.href}
            className="flex items-center gap-3 px-4 py-3.5 no-underline"
            style={{
              color: T.text,
              borderBottom:
                i < 4 ? `1px solid ${T.line}` : "none",
            }}
          >
            <span style={{ color: T.textMute }}>{item.icon}</span>
            <span className="text-sm font-medium flex-1">
              {item.label}
            </span>
            {item.detail && (
              <span className="text-xs" style={{ color: T.textMute }}>
                {item.detail}
              </span>
            )}
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke={T.textMute}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </Link>
        ))}
      </div>
    </section>
  );
}
