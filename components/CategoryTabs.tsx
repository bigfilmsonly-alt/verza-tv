"use client";

import { BROWSE_TABS, type BrowseCategory } from "@/lib/catalog";

interface CategoryTabsProps {
  active: BrowseCategory;
  onSelect: (category: BrowseCategory) => void;
}

export default function CategoryTabs({ active, onSelect }: CategoryTabsProps) {
  return (
    <div className="flex gap-5 overflow-x-auto px-4 py-3 no-scrollbar">
      {BROWSE_TABS.map((tab) => {
        const isActive = tab.key === active;
        return (
          <button
            key={tab.key}
            onClick={() => onSelect(tab.key)}
            className="relative flex-shrink-0 pb-2 border-0 cursor-pointer bg-transparent"
            style={{ padding: 0 }}
          >
            <span
              className="text-[13px] font-bold tracking-wider uppercase"
              style={{
                color: isActive ? "#F5F4F8" : "#6B6B7B",
              }}
            >
              {tab.label}
            </span>
            {isActive && (
              <div
                className="absolute bottom-0 left-0 rounded-full"
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
