"use client";

import { useEffect } from "react";

/**
 * Lets the wheel and the keyboard work anywhere on the desktop page, not only
 * over the phone.
 *
 * On desktop the site is a 400px iPhone frame centred in the viewport, and
 * globals.css gives the body `overflow: hidden` because the page itself is not
 * meant to scroll — `.device-screen` inside the frame is the real scroller.
 *
 * That is fine until you put a cursor on it. A wheel event goes to whatever
 * sits under the pointer, and on a wide desktop most of the window is body, not
 * phone. Body cannot scroll, so the gesture did nothing and the site read as
 * frozen on landing: 2222px of content below the fold and no obvious way down.
 *
 * EVERY GUARD BELOW EXISTS BECAUSE THE FIRST VERSION BROKE SOMETHING.
 *
 *   framed()      the frame only exists above 520px. Below it, and in any short
 *                 landscape window, the DOCUMENT is the scroller and
 *                 .device-screen is not a scroll container at all. The first
 *                 version still ran there, cancelled every Space, PageDown and
 *                 arrow key, and scrolled nothing: keyboard scrolling of the
 *                 whole site was dead. A browser zoomed past about 125% lands
 *                 in exactly that layout, so it hit the readers who need zoom.
 *
 *   ctrlKey       ctrl+wheel and trackpad pinch ARE wheel events. Cancelling
 *                 one cancels browser zoom and turns it into a scroll instead.
 *
 *   activatable   Space activates buttons. Blacklisting INPUT and TEXTAREA was
 *                 not enough; it stopped Space working on every button outside
 *                 the frame, Checkout and Add to bag among them.
 *
 *   overlay       The search panel and the product sheet portal to the body and
 *                 lock the background themselves with an INLINE body overflow.
 *                 The stylesheet rule is not inline, so that inline value is a
 *                 reliable "an overlay is open" signal, and while one is we
 *                 forward nothing: otherwise the app scrolled behind them.
 *
 *   cross axis    A horizontal gesture is a swipe, often swipe-to-go-back.
 *                 Cancelling it while discarding deltaX just killed it.
 *
 *   moved         preventDefault only if the scroller actually moved, so a
 *                 no-op never swallows a key or a gesture the browser could
 *                 have used.
 *
 * And it still leaves alone anything that scrolls itself — the episode feed, a
 * drawer, the shorts reel — because hijacking those would break the vertical
 * feed, which is the product.
 */
export default function FrameWheelBridge() {
  useEffect(() => {
    /* Matches globals.css:495 exactly. If these two ever drift, the bridge
       starts acting on a layout that never had a frame. */
    const framed = () =>
      window.matchMedia(
        "(min-width: 520px) and (orientation: portrait), (min-width: 520px) and (min-height: 600px)",
      ).matches;

    const screen = () => document.querySelector<HTMLElement>(".device-screen");

    /* An overlay portalled to the body has locked the background itself. */
    const overlayOpen = () => document.body.style.overflow === "hidden";

    const ownsScroll = (start: EventTarget | null) => {
      let el = start instanceof Element ? start : null;
      while (el && !el.classList.contains("device-screen")) {
        const s = getComputedStyle(el);
        if (/(auto|scroll)/.test(s.overflowY) && el.scrollHeight > el.clientHeight + 2) return true;
        el = el.parentElement;
      }
      return false;
    };

    /* Returns true only if the scroller actually moved. */
    const nudge = (sc: HTMLElement, by: number) => {
      const before = sc.scrollTop;
      sc.scrollTop += by;
      return sc.scrollTop !== before;
    };

    const onWheel = (e: WheelEvent) => {
      if (!framed() || overlayOpen()) return;
      /* Zoom is never a scroll request. */
      if (e.ctrlKey || e.metaKey) return;
      /* A sideways gesture is a swipe, not a scroll down. */
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      if (!e.deltaY) return;

      const sc = screen();
      if (!sc) return;
      if (sc.contains(e.target as Node) || ownsScroll(e.target)) return;
      if (sc.scrollHeight <= sc.clientHeight) return;

      if (nudge(sc, e.deltaY)) e.preventDefault();
    };

    const onKey = (e: KeyboardEvent) => {
      if (!framed() || overlayOpen()) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      /* Space activates these. Taking it is worse than not scrolling. */
      if (t?.closest?.('button, a[href], summary, [role="button"], [role="checkbox"], [role="switch"], [role="slider"], [role="tab"]')) return;

      const sc = screen();
      if (!sc) return;
      if (sc.contains(t)) return;
      if (sc.scrollHeight <= sc.clientHeight) return;

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

      if (nudge(sc, step)) e.preventDefault();
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  return null;
}
