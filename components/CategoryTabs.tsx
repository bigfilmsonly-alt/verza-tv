"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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

/* The exact colour of the sticky bar this rail is mounted into
   (components/BrowsePage.tsx renders <CategoryTabs> inside a div whose
   background is rgba(7, 7, 14, 0.95)). The edge fades below MUST be painted in
   this colour: a fade to any other tone reads as a grey smear laid over the
   bar instead of the bar continuing underneath the labels. If that background
   ever changes, change this with it. */
const BAR_RGB = "7, 7, 14";

/* Slack in the overflow test. scrollLeft is fractional on a device-pixel-ratio
   of 2 or 3, so it never lands exactly on scrollWidth - clientWidth and a
   strict comparison leaves the right-hand fade painted forever at the end of
   the rail — an affordance that promises content that is not there. */
const EDGE_EPSILON = 2;

export default function CategoryTabs({ active, onSelect, tabs }: CategoryTabsProps) {
  const items = tabs || BROWSE_TABS;
  const { t } = useTranslation();
  const railRef = useRef<HTMLDivElement | null>(null);
  const buttonRefs = useRef(new Map<string, HTMLButtonElement>());
  const openerRef = useRef<HTMLButtonElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);

  /* Which side of the rail still has track on it. Seeded false/false so the
     server HTML and the first client render agree — the effect below measures
     and corrects on the first commit, one frame later, which is invisible.
     Seeding `right: true` would paint a fade on a rail that may not overflow
     (a short `tabs` prop), i.e. an affordance that lies. */
  const [overflow, setOverflow] = useState({ left: false, right: false });
  /* createPortal needs document.body, which does not exist during the server
     render — but `sheetOpen` can only become true from a click, so the portal
     branch is unreachable on the server and the typeof guard below is belt and
     braces. Doing this with a mounted flag set from an effect costs an extra
     render pass on every mount of the browse page for no gain. */
  const [sheetOpen, setSheetOpen] = useState(false);

  const labelFor = (tab: { key: BrowseCategory; label: string }) => {
    const translationKey = TAB_KEYS[tab.key];
    return translationKey ? t(translationKey) : tab.label;
  };

  const measure = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;
    const max = rail.scrollWidth - rail.clientWidth;
    const x = rail.scrollLeft;
    const next = { left: x > EDGE_EPSILON, right: max - x > EDGE_EPSILON };
    // Bail out when nothing changed. This runs on every scroll event of a
    // momentum flick; returning the previous object keeps React from
    // re-rendering ten buttons sixty times a second.
    setOverflow((prev) => (prev.left === next.left && prev.right === next.right ? prev : next));
  }, []);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    measure();
    /* Every teardown here is scoped by identity. removeEventListener needs the
       same function reference, and this rail is not a private element — it is
       the node BrowsePage's tab-swipe test finds with
       .closest(".overflow-x-auto") and the node the parent scrolls. Never
       replace this with a blanket removal. */
    const onScroll = () => measure();
    rail.addEventListener("scroll", onScroll, { passive: true });

    /* Re-measure when the rail's own width changes (rotation, the desktop
       phone frame) and when the track's width changes (a language switch
       re-renders every label at a different width, which can turn a rail that
       overflowed into one that does not). */
    const ro = new ResizeObserver(() => measure());
    ro.observe(rail);
    const track = rail.firstElementChild;
    if (track) ro.observe(track);

    return () => {
      rail.removeEventListener("scroll", onScroll);
      ro.disconnect();
    };
  }, [measure, items.length]);

  /* Keep the active tab on screen.
     Ten tabs render about 1,000px of track inside a ~394px phone viewport, and
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
       is actually on screen, so it is correct wherever the rail sits.
       The wrapper added for the edge fades IS positioned; that is still safe
       precisely because nothing here reads offsetLeft. Do not "simplify" this
       back to offsetLeft now that a positioned ancestor exists. */
    const delta = elBox.left - railBox.left - (rail.clientWidth - elBox.width) / 2;
    rail.scrollBy({
      left: delta,
      /* "instant", not "auto". app/globals.css sets scroll-behavior: smooth on
         the document, and "auto" means "defer to the CSS value" — so the
         reduced-motion branch was animating exactly like the other one.
         Measured in the browser: rail.scrollLeft = 120 did not land for
         hundreds of milliseconds because the inherited smooth behaviour was
         driving it. "instant" is the value that actually jumps. */
      behavior: window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
    });
  }, [active]);

  const closeSheet = useCallback(() => {
    setSheetOpen(false);
    // Send the caret back where it came from, or a keyboard viewer is dropped
    // at the top of the document.
    openerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!sheetOpen) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeSheet();
    };
    document.addEventListener("keydown", onKey);
    // Scoped by identity — see the note on the scroll listener above.
    return () => document.removeEventListener("keydown", onKey);
  }, [sheetOpen, closeSheet]);

  const pick = (key: BrowseCategory) => {
    onSelect(key);
    closeSheet();
  };

  /* BrowsePage mounts this component inside <div onTouchStart onTouchEnd> and
     switches tabs on a horizontal swipe. React portals still bubble synthetic
     events through the React tree, so without this a swipe anywhere on the
     sheet would silently change the tab underneath it. */
  const swallowTouch = (e: React.TouchEvent) => e.stopPropagation();

  const fadeBase: React.CSSProperties = {
    position: "absolute",
    top: 0,
    bottom: 0,
    // 28px: wide enough to read as a fade rather than a hard cut, narrow
    // enough that it never swallows a whole label. At 320px only three items
    // fit in the rail and one of them is the Tubi partner logo, so every pixel
    // of scrim is paid for.
    width: 28,
    pointerEvents: "none",
    transition: "opacity 0.18s ease",
  };

  const tabLabel = (tab: { key: BrowseCategory; label: string }, isActive: boolean) =>
    tab.key === "tubi" ? (
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
        {labelFor(tab)}
      </span>
    );

  return (
    <>
      <div className="flex items-stretch">
        {/* Positioned wrapper for the edge fades. The rail itself must stay
            un-positioned and must keep the `overflow-x-auto` class: BrowsePage's
            swipe handler decides whether a touch belongs to a horizontal
            scroller with .closest(".overflow-x-auto, .snap-x"), so renaming it
            hands every rail drag to the tab-switcher. */}
        <div className="relative min-w-0 flex-1">
          <div
            ref={railRef}
            className="overflow-x-auto no-scrollbar"
            style={{ WebkitOverflowScrolling: "touch", scrollPaddingInline: 16 }}
            aria-label="Categories"
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
                    {tabLabel(tab, isActive)}
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

          {/* Edge fades. Without them the rail ends in a hard vertical cut through
              whatever label happens to sit on the boundary — testers read
              "ESPAÑ" as a broken, truncated label rather than as a row that
              scrolls, and one of them left believing this was a
              romance-drama-only app. A gradient in the bar's own colour reads as
              the strip continuing under the edge, which is what it does.
              pointer-events: none so they never eat a tap meant for a label. */}
          <div
            aria-hidden="true"
            style={{
              ...fadeBase,
              left: 0,
              background: `linear-gradient(90deg, rgba(${BAR_RGB},1) 12%, rgba(${BAR_RGB},0) 100%)`,
              opacity: overflow.left ? 1 : 0,
            }}
          />
          <div
            aria-hidden="true"
            style={{
              ...fadeBase,
              right: 0,
              background: `linear-gradient(270deg, rgba(${BAR_RGB},1) 12%, rgba(${BAR_RGB},0) 100%)`,
              opacity: overflow.right ? 1 : 0,
            }}
          />
        </div>

        {/* A fade tells you the row moves. It does not tell you that six of the
            ten sections are over there, and a fade cannot: at 320px only three
            labels fit, so Bollywood, Reality, Creators, Red Carpet and Music are
            invisible however pretty the edge is. One tester concluded there is
            no Indian content while six Bollywood titles were on sale. This
            button is the answer to that — every category, named, in one tap, at
            every width. It sits OUTSIDE the scroller (a flex sibling, not an
            overlay) so it can never cover a label or be scrolled away. */}
        <button
          type="button"
          ref={openerRef}
          onClick={() => setSheetOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={sheetOpen}
          aria-label={`All ${items.length} categories`}
          className="flex-shrink-0 flex items-center gap-1.5 cursor-pointer my-2 mr-3 ml-1 px-2.5 rounded-full"
          style={{
            background: "rgba(255,255,255,0.07)",
            border: "1px solid rgba(255,255,255,0.16)",
            color: "rgba(255,255,255,0.72)",
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <rect x="3" y="3" width="7.5" height="7.5" rx="1.6" />
            <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.6" />
            <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.6" />
            <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.6" />
          </svg>
          <span className="text-[11px] font-black uppercase tracking-wider">All</span>
        </button>
      </div>

      {sheetOpen && typeof document !== "undefined"
        ? createPortal(
            /* Portalled to <body> on purpose. The sticky bar this component
               renders into carries backdrop-filter: blur(16px), and a filter or
               backdrop-filter makes an element a containing block for its
               position: fixed descendants — an in-place sheet would be pinned
               to the 44px tab bar instead of the viewport. */
            <div
              role="dialog"
              aria-modal="true"
              aria-label="All categories"
              className="fixed inset-0 flex flex-col justify-end"
              style={{ zIndex: 70 }}
              onTouchStart={swallowTouch}
              onTouchMove={swallowTouch}
              onTouchEnd={swallowTouch}
            >
              <div
                onClick={closeSheet}
                aria-hidden="true"
                className="absolute inset-0 animate-fadeIn"
                style={{
                  background: "rgba(4,4,10,0.78)",
                  backdropFilter: "blur(6px)",
                  WebkitBackdropFilter: "blur(6px)",
                  // Stops a drag on the backdrop from scrolling the grid behind
                  // the sheet, without touching document.body — a global style
                  // mutation that leaks if this unmounts mid-animation.
                  touchAction: "none",
                  overscrollBehavior: "contain",
                }}
              />
              <div
                className="relative mx-auto w-full animate-slideUp"
                style={{
                  maxWidth: 440,
                  background: "#0B0B14",
                  borderTop: "1px solid rgba(255,255,255,0.10)",
                  borderRadius: "20px 20px 0 0",
                  padding: "14px 16px calc(20px + env(safe-area-inset-bottom, 0px))",
                }}
              >
                <div
                  aria-hidden="true"
                  className="mx-auto mb-3 rounded-full"
                  style={{ width: 38, height: 4, background: "rgba(255,255,255,0.18)" }}
                />
                <div className="flex items-center justify-between mb-3">
                  <p className="m-0 text-[11px] font-black uppercase tracking-[0.14em]" style={{ color: "#8A8A9A" }}>
                    Browse all categories
                  </p>
                  <button
                    type="button"
                    ref={closeRef}
                    onClick={closeSheet}
                    aria-label="Close"
                    className="border-0 cursor-pointer rounded-full flex items-center justify-center"
                    style={{ width: 30, height: 30, background: "rgba(255,255,255,0.07)", color: "#F5F4F8" }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
                      <path d="M5 5l14 14M19 5L5 19" />
                    </svg>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {items.map((tab) => {
                    const isActive = tab.key === active;
                    return (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => pick(tab.key)}
                        aria-current={isActive ? "page" : undefined}
                        className="flex items-center justify-center cursor-pointer rounded-xl px-3 transition-transform active:scale-[0.97]"
                        style={{
                          minHeight: 52,
                          background: isActive ? "rgba(224,17,95,0.14)" : "rgba(255,255,255,0.05)",
                          border: `1px solid ${isActive ? "#E0115F" : "rgba(255,255,255,0.10)"}`,
                        }}
                      >
                        {tab.key === "tubi" ? (
                          <Image
                            src="/tubi-logo.png"
                            alt="Tubi"
                            width={760}
                            height={300}
                            style={{ height: 26, width: "auto", display: "block", borderRadius: 6 }}
                          />
                        ) : (
                          /* No truncation and no ellipsis anywhere in this sheet:
                             the whole point of it is that every category can be
                             read in full. "Red Carpet" wraps to two lines on a
                             320px screen rather than becoming "Red Carp…". */
                          <span
                            className="text-[14px] font-black uppercase tracking-wide text-center leading-tight"
                            style={{ color: isActive ? "#E0115F" : "#F5F4F8" }}
                          >
                            {labelFor(tab)}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
