"use client";

import { BROWSE_TABS, type BrowseCategory } from "@/lib/catalog";
import { useTranslation } from "@/components/LangProvider";

interface CategoryTabsProps {
  active: BrowseCategory;
  onSelect: (category: BrowseCategory) => void;
  tabs?: { key: BrowseCategory; label: string }[];
}

const TAB_KEYS: Record<string, "tab.drama" | "tab.new" | "tab.popular" | "tab.music" | "tab.reality" | "tab.redCarpet"> = {
  drama: "tab.drama",
  new: "tab.new",
  popular: "tab.popular",
  music: "tab.music",
  reality: "tab.reality",
  "red-carpet": "tab.redCarpet",
};

export default function CategoryTabs({ active, onSelect, tabs }: CategoryTabsProps) {
  const items = tabs || BROWSE_TABS;
  const { t } = useTranslation();
  return (
    <div className="overflow-x-auto no-scrollbar" style={{ WebkitOverflowScrolling: "touch" }}>
      <div className="flex items-center gap-5 px-4 py-2">
        {items.map((tab) => {
          const isActive = tab.key === active;
          const translationKey = TAB_KEYS[tab.key];
          const label = translationKey ? t(translationKey) : tab.label;
          return (
            <button
              key={tab.key}
              onClick={() => onSelect(tab.key)}
              className="relative border-0 cursor-pointer bg-transparent whitespace-nowrap flex-shrink-0 p-0 pb-1.5"
            >
              <span
                className="text-[17px] font-black uppercase tracking-wide"
                style={{ color: "#FFFFFF" }}
              >
                {label}
              </span>
              {isActive && (
                <div
                  className="absolute bottom-0 left-0 right-0 rounded-full"
                  style={{ height: 3, background: "#E0115F" }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
