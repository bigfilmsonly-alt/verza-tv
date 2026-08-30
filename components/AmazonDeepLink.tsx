"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

/**
 * Opens a product straight from a /amazon?p=<product-id> link. The Shop list in
 * the footer points every product at one of these.
 *
 * A query param rather than a #hash, deliberately. Next's <Link> performs a
 * same-page navigation with history.pushState, which — unlike a real hash
 * navigation — fires no hashchange event. So a hash link silently did nothing
 * for anyone already sitting on /amazon. useSearchParams re-renders on soft
 * navigation, so this works from a cold load and from a footer tap alike.
 *
 * It clicks the tile's own button rather than lifting the modal state up here:
 * the tile already owns `open`, and duplicating that in a parent would leave two
 * sources of truth for the same sheet.
 */
export default function AmazonDeepLink() {
  const productId = useSearchParams().get("p");

  useEffect(() => {
    if (!productId) return;

    // Defer a tick: the tiles are server rendered, but their click handlers only
    // exist once React has hydrated them, and a click before that is a silent
    // no-op.
    //
    // A timeout, NOT requestAnimationFrame. rAF does not fire in a tab that is
    // not painting, so opening a product link in a background tab — a middle
    // click from the footer — would leave it sitting there doing nothing.
    const t = setTimeout(() => {
      const tile = document.getElementById(productId);
      if (!(tile instanceof HTMLElement)) return;
      tile.scrollIntoView({
        block: "center",
        // Explicit: this used to inherit smooth from a global rule in
        // globals.css that has since been removed. Deep-linking to a product
        // should glide to it, not teleport.
        behavior: window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
      });
      tile.click();
    }, 0);
    return () => clearTimeout(t);
  }, [productId]);

  return null;
}
