"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ACTIVE = "#F5F4F8";
const INACTIVE = "#6B6B7B";

interface Tab {
  label: string;
  href: string;
  icon: (color: string) => React.ReactNode;
}

const tabs: Tab[] = [
  {
    label: "Discover",
    href: "/",
    icon: (c) => (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9.5L12 3l9 6.5" />
        <path d="M19 13v6a1 1 0 0 1-1 1h-4v-5h-4v5H6a1 1 0 0 1-1-1v-6" />
      </svg>
    ),
  },
  {
    label: "Shorts",
    href: "/shorts",
    icon: (c) => (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="6 3 20 12 6 21 6 3" />
      </svg>
    ),
  },
  {
    label: "Channels",
    href: "/channels",
    icon: (c) => (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8" />
        <path d="M12 17v4" />
      </svg>
    ),
  },
  {
    label: "Shop",
    href: "/shop",
    icon: (c) => (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </svg>
    ),
  },
  {
    label: "My List",
    href: "/me/list",
    icon: (c) => (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 6L9 17l-5-5" />
      </svg>
    ),
  },
  {
    label: "Profile",
    href: "/me",
    icon: (c) => (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" />
        <path d="M20 21c0-3.31-3.58-6-8-6s-8 2.69-8 6" />
      </svg>
    ),
  },
];

export default function BottomNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    if (href === "/me") return pathname === "/me";
    return pathname.startsWith(href);
  };

  return (
    <nav
      className="bottom-nav fixed bottom-0 w-full z-50"
      style={{
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        background: "#0D0D14",
        borderTop: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div className="flex items-center justify-around px-3" style={{ height: 72, paddingTop: 8, paddingBottom: 10 }}>
        {tabs.map((tab) => {
          const active = isActive(tab.href);
          const color = active ? ACTIVE : INACTIVE;

          return (
            <Link
              key={tab.label}
              href={tab.href}
              className="relative flex flex-col items-center justify-center gap-1 flex-1 no-underline"
              style={{ WebkitTapHighlightColor: "transparent" }}
            >
              {/* Active gradient bar — matches header tab style */}
              {active && (
                <div
                  className="absolute bottom-0 rounded-full"
                  style={{
                    width: "60%",
                    height: 3,
                    background: "linear-gradient(90deg, #E0115F, #8B5CF6)",
                  }}
                />
              )}
              {tab.icon(color)}
              <span
                className="text-[11px] font-medium leading-none"
                style={{ color }}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
