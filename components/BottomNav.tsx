"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ACTIVE = "#E0115F";
const INACTIVE = "#6B6B7B";

interface Tab {
  label: string;
  href: string;
  icon: (color: string) => React.ReactNode;
}

const tabs: Tab[] = [
  {
    label: "Feed",
    href: "/",
    icon: (c) => (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke={c}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 9.5L12 3l9 6.5" />
        <path d="M19 13v6a1 1 0 0 1-1 1h-4v-5h-4v5H6a1 1 0 0 1-1-1v-6" />
      </svg>
    ),
  },
  {
    label: "Discover",
    href: "/discover",
    icon: (c) => (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke={c}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="11" cy="11" r="7" />
        <line x1="16.65" y1="16.65" x2="21" y2="21" />
      </svg>
    ),
  },
  {
    label: "Studio",
    href: "/studio",
    icon: (c) => (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke={c}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 2l1.09 3.26L16 6l-2.18 2.18L14.36 12 12 10.09 9.64 12l.54-3.82L8 6l2.91-.74z" />
        <path d="M5 15l1.5 2L5 22" />
        <path d="M19 15l-1.5 2L19 22" />
        <path d="M12 15v7" />
      </svg>
    ),
  },
  {
    label: "Channels",
    href: "/channels",
    icon: (c) => (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke={c}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    label: "Me",
    href: "/me",
    icon: (c) => (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke={c}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
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
    return pathname.startsWith(href);
  };

  return (
    <nav
      className="glass fixed bottom-0 left-1/2 -translate-x-1/2 w-full z-50"
      style={{
        maxWidth: 440,
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <div className="flex items-center justify-around h-14">
        {tabs.map((tab) => {
          const active = isActive(tab.href);
          const color = active ? ACTIVE : INACTIVE;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex flex-col items-center justify-center gap-0.5 flex-1 pt-1.5 pb-1 no-underline"
              style={{ WebkitTapHighlightColor: "transparent" }}
            >
              {tab.icon(color)}
              <span
                className="text-[10px] font-medium leading-none"
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
