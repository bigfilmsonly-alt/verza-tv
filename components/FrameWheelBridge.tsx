"use client";

import { useEffect } from "react";

/**
 * Lets the wheel work anywhere on the desktop page, not only over the phone.
 *
 * On desktop the site is a 400px iPhone frame centred in the viewport, and
 * globals.css gives the body `overflow: hidden` because the page itself is not
 * meant to scroll — `.device-screen` inside the frame is the real scroller.
 *
 * That is fine until you put a cursor on it. A wheel event goes to whatever
 * sits under the pointer, and on a wide desktop most of the window is body, not
 * phone. Body cannot scroll, so the gesture does nothing and the site reads as
 * frozen on landing: there is 2222px of content below the fold and no obvious
 * way to reach it. You had to find the 400px strip in the middle first.
 *
 * This forwards those gestures to the real scroller. Keyboard paging is handled
 * for the same reason: Space and PageDown act on the focused scroller, and on
 * load that is the body.
 *
 * DELIBERATELY DOES NOT TOUCH GESTURES THAT ALREADY LAND SOMEWHERE. If the
 * pointer is over anything that can scroll itself — the episode feed, a drawer,
 * a modal, the shorts reel — the event is left alone. Hijacking those would
 * break the vertical feed, which is the whole product.
 */
export default function FrameWheelBridge() {
  useEffect(() => {
    const screen = () => document.querySelector<HTMLElement>(".device-screen");

    /* Does this element, or anything between it and the frame, scroll on its
       own? If so the gesture already has an owner and is none of our business. */
    const ownsScroll = (start: EventTarget | null) => {
      let el = start instanceof Element ? start : null;
      while (el && !el.classList.contains("device-screen")) {
        const s = getComputedStyle(el);
        const scrolls = /(auto|scroll)/.test(s.overflowY) && el.scrollHeight > el.clientHeight + 2;
        if (scrolls) return true;
        el = el.parentElement;
      }
      return false;
    };

    const onWheel = (e: WheelEvent) => {
      const sc = screen();
      if (!sc) return;
      /* Already inside the real scroller, or inside something that scrolls
         itself. Leave it entirely alone. */
      if (sc.contains(e.target as Node) || ownsScroll(e.target)) return;
      if (sc.scrollHeight <= sc.clientHeight) return;
      sc.scrollTop += e.deltaY;
      /* The page cannot scroll anyway, but preventing the default stops the
         overscroll bounce the gesture would otherwise produce on the body. */
      e.preventDefault();
    };

    const onKey = (e: KeyboardEvent) => {
      const sc = screen();
      if (!sc) return;
      const t = e.target as HTMLElement | null;
      /* Never steal a key from something being typed into. */
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      if (sc.contains(t)) return;

      const page = sc.clientHeight * 0.9;
      const step =
        e.key === "PageDown" || (e.key === " " && !e.shiftKey) ? page
        : e.key === "PageUp" || (e.key === " " && e.shiftKey) ? -page
        : e.key === "ArrowDown" ? 80
        : e.key === "ArrowUp" ? -80
        : e.key === "End" ? sc.scrollHeight
        : e.key === "Home" ? -sc.scrollHeight
        : 0;
      if (!step) return;
      sc.scrollTop += step;
      e.preventDefault();
    };

    /* Not passive: the whole point is to preventDefault on the body. */
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  return null;
}
