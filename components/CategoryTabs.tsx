"use client";

import { BROWSE_TABS, type BrowseCategory } from "@/lib/catalog";

interface CategoryTabsProps {
  active: BrowseCategory;
  onSelect: (category: BrowseCategory) => void;
  tabs?: { key: BrowseCategory; label: string }[];
}

export default function CategoryTabs({ active, onSelect, tabs }: CategoryTabsProps) {
  const items = tabs || BROWSE_TABS;
  return (
    <div className="flex items-center">
      {items.map((tab) => {
        const isActive = tab.key === active;
        return (
          <button
            key={tab.key}
            onClick={() => onSelect(tab.key)}
            className="relative flex-1 py-2 border-0 cursor-pointer bg-transparent"
            style={{ padding: "8px 0" }}
          >
            <span
              className="text-[11px] font-bold tracking-wide uppercase"
              style={{
                color: isActive ? "#FFFFFF" : "rgba(255,255,255,0.5)",
              }}
            >
              {tab.label}
            </span>
            {isActive && (
              <div
                className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full"
                style={{
                  width: "60%",
                  height: 3,
                  background: "linear-gradient(90deg, #E0115F, #8B5CF6)",
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
