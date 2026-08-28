"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
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
  const railRef = useRef<HTMLDivElement | null>(null);
  const buttonRefs = useRef(new Map<string, HTMLButtonElement>());

  /* Keep the active tab on screen.
     Ten tabs render about 984px of track inside a ~394px phone viewport, and
     nothing ever scrolled the rail. Measured on production at /?tab=red-carpet:
     scrollLeft 0 with the active tab 399px past the right edge — five grey
     labels, no pink one, no underline, while the section below was plainly Red
     Carpet. That happens on every swipe past the third tab, and on every return
     from an episode, because backHref sends Espanol, Bollywood, Reality, Music
     and Red Carpet viewers to a tab that starts off-screen.
     Centring on change costs nothing when the tab is already visible and fixes
     the case where the viewer has no idea which section they are in. */
  useEffect(() => {
    const rail = railRef.current;
    const el = buttonRefs.current.get(active);
    if (!rail || !el) return;
    // Only scroll if the tab is not already comfortably inside the rail, so a
    // tap on a visible tab never yanks the bar sideways under the thumb.
    const railBox = rail.getBoundingClientRect();
    const elBox = el.getBoundingClientRect();
    const fullyVisible = elBox.left >= railBox.left + 8 && elBox.right <= railBox.right - 8;
    if (fullyVisible) return;
    /* Measured from bounding rects, not offsetLeft. offsetLeft is relative to
       the nearest POSITIONED ancestor, and this rail is not positioned — each
       button is (it carries `relative` for the underline), so offsetLeft
       resolves against something far up the tree and produced a target that
       clamped to 0 and never moved the rail. A rect delta is relative to what
       is actually on screen, so it is correct wherever the rail sits. */
    const delta = elBox.left - railBox.left - (rail.clientWidth - elBox.width) / 2;
    rail.scrollBy({
      left: delta,
      behavior: window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
  }, [active]);

  return (
    <div
      ref={railRef}
      className="overflow-x-auto no-scrollbar"
      style={{ WebkitOverflowScrolling: "touch" }}
    >
      {/* w-max, not a plain flex row. As a block-level flex container this track
          took the rail's width (measured: 394px inside a 394px rail) while its
          flex-shrink-0 children overflowed past it. The rail therefore reported
          scrollWidth 984 but a maximum scrollLeft of 0 — assigning scrollLeft
          directly did nothing — so the bar was not draggable at all and the
          seven tabs past Anime were unreachable except by swiping the content.
          Sizing the track to its content gives the scroller something real to
          scroll, which is also what makes the active-tab centring above work. */}
      <div className="flex w-max items-center gap-5 px-4 py-2">
        {items.map((tab) => {
          const isActive = tab.key === active;
          const translationKey = TAB_KEYS[tab.key];
          const label = translationKey ? t(translationKey) : tab.label;
          return (
            <button
              key={tab.key}
              ref={(el) => {
                if (el) buttonRefs.current.set(tab.key, el);
                else buttonRefs.current.delete(tab.key);
              }}
              onClick={() => onSelect(tab.key)}
              aria-current={isActive ? "page" : undefined}
              className="relative border-0 cursor-pointer bg-transparent whitespace-nowrap flex-shrink-0 p-0 pb-1.5"
            >
              {tab.key === "tubi" ? (
                /* Authorized Tubi partner logo (signed contract). Rendered taller
                   than the text labels so it stands out as a feature. "Coming
                   Soon" appears on tap (the overlay), not in the tab bar. */
                <Image
                  src="/tubi-logo.png"
                  alt="Tubi"
                  width={760}
                  height={300}
                  style={{ height: 30, width: "auto", display: "block", borderRadius: 7, opacity: isActive ? 1 : 0.7, transition: "opacity 0.2s ease" }}
                />
              ) : (
                <span
                  className="text-[17px] font-black uppercase tracking-wide"
                  /* The colour eases now. It used to flip instantly while the
                     tab content slid for 400ms, so the indicator arrived long
                     before the section it labels. */
                  style={{
                    color: isActive ? "#E0115F" : "rgba(255,255,255,0.5)",
                    transition: "color 0.25s ease",
                  }}
                >
                  {label}
                </span>
              )}
              {/* Always mounted, revealed by opacity. Mounting it only on the
                  active tab made the underline pop in with no transition while
                  the content was still moving. */}
              <div
                className="absolute bottom-0 left-0 right-0 rounded-full"
                style={{
                  height: 3,
                  background: "#E0115F",
                  opacity: isActive ? 1 : 0,
                  transition: "opacity 0.25s ease",
                }}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
