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
    <div className="px-3 pt-1 pb-1">
      <div className="flex items-center text-center">
        {items.map((tab) => {
          const isActive = tab.key === active;
          const translationKey = TAB_KEYS[tab.key];
          const label = translationKey ? t(translationKey) : tab.label;
          return (
            <button
              key={tab.key}
              onClick={() => onSelect(tab.key)}
              className="relative flex-1 py-1.5 border-0 cursor-pointer bg-transparent"
            >
              <span
                className="text-[10px] font-bold tracking-wider uppercase whitespace-nowrap"
                style={{ color: "#FFFFFF" }}
              >
                {label}
              </span>
              {isActive && (
                <div
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full"
                  style={{
                    width: "50%",
                    height: 3,
                    background: "linear-gradient(90deg, #E0115F, #8B5CF6)",
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
