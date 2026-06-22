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
    <div className="px-2 pt-2 pb-1">
      <div className="flex items-center justify-between">
        {items.map((tab) => {
          const isActive = tab.key === active;
          const translationKey = TAB_KEYS[tab.key];
          const label = translationKey ? t(translationKey) : tab.label;
          return (
            <button
              key={tab.key}
              onClick={() => onSelect(tab.key)}
              className="relative px-1 py-2 border-0 cursor-pointer bg-transparent transition-opacity"
              style={{ opacity: isActive ? 1 : 0.45 }}
            >
              <span
                className="text-[13px] font-extrabold tracking-wide whitespace-nowrap"
                style={{ color: "#FFFFFF" }}
              >
                {label}
              </span>
              {isActive && (
                <div
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full"
                  style={{
                    width: "60%",
                    height: 2.5,
                    background: "#E0115F",
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
