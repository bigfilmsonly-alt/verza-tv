"use client";

import { useState } from "react";

const CATEGORIES = [
  "DRAMA",
  "NEW",
  "POPULAR",
  "MUSIC",
  "REALITY",
  "ROMANCE",
  "THRILLER",
  "MYSTERY",
  "COMEDY",
] as const;

interface CategoryTabsProps {
  onSelect?: (category: string) => void;
}

export default function CategoryTabs({ onSelect }: CategoryTabsProps) {
  const [active, setActive] = useState(0);

  return (
    <div className="flex gap-5 overflow-x-auto px-4 py-3 no-scrollbar">
      {CATEGORIES.map((cat, i) => {
        const isActive = i === active;
        return (
          <button
            key={cat}
            onClick={() => {
              setActive(i);
              onSelect?.(cat);
            }}
            className="relative flex-shrink-0 pb-2 border-0 cursor-pointer bg-transparent"
            style={{ padding: 0 }}
          >
            <span
              className="text-[13px] font-bold tracking-wider"
              style={{
                color: isActive ? "#F5F4F8" : "#6B6B7B",
              }}
            >
              {cat}
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
