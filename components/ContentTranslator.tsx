"use client";

import { useEffect } from "react";
import { useTranslation } from "@/components/LangProvider";

/**
 * Keeps the document's declared language in step with the selected UI locale.
 *
 * WHAT THIS USED TO DO, AND WHY IT IS GONE
 * ----------------------------------------
 * This component injected Google Translate: it wrote `googtrans` cookies on
 * two domains and appended
 * `https://translate.google.com/translate_a/element.js?cb=googleTranslateInit`
 * to the body, intending to machine-translate every surface the in-house
 * dictionary does not cover.
 *
 * It has never once run. Measured on 2026-08-29: that URL returns 200, but it
 * is a ~3KB bootstrap whose body references `translate.googleapis.com` — the
 * host the ~277KB engine actually loads from. `next.config.ts` allows
 * `https://translate.google.com` in `script-src` and nowhere allows
 * `translate.googleapis.com`; there is no wildcard and no `strict-dynamic`, so
 * the engine is CSP-blocked. `git log -S` shows that host has never been in
 * the policy. Every language change therefore paid for a blocked request, two
 * cookie writes, and — in the "script already loaded" branch — a
 * `window.location.reload()` triggered by a cross-origin iframe read that
 * always throws. A page reload on a video app, to run a translator that
 * cannot load.
 *
 * WHY THE FIX IS NOT "ADD THE HOST TO THE CSP"
 * -------------------------------------------
 * 1. The engine would then also run over the paywall, which is now genuinely
 *    translated. Machine-retranslating already-correct Spanish payment copy is
 *    how "one-time" becomes something else, and the paywall's honesty is the
 *    thing testers named as already working.
 * 2. It rewrites text nodes underneath React. That is a well-known source of
 *    removeChild crashes, and it cannot be verified from here.
 * 3. It is 277KB of third-party JavaScript on the critical path of an app
 *    whose speed testers also named as working.
 *
 * The real fix for the surfaces that are still English is to move their copy
 * into `lib/i18n.ts`, which is what the paywall, checkout, and audio-language
 * labelling now do. Removing this leaves nothing worse than it found: the
 * translation it promised was never delivered.
 *
 * WHAT REMAINS
 * ------------
 * `<html lang>`. LangProvider sets it on hydration and on every switch; this
 * component keeps it correct if the locale is changed by anything else, and it
 * is the mount point named in app/layout.tsx, which is not this lane's file to
 * edit. The returned <style> still suppresses Google Translate's injected
 * chrome, so a viewer who translates the page with the BROWSER's own
 * translator does not get a banner shoving the layout down.
 */
export default function ContentTranslator() {
  const { locale } = useTranslation();

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return (
    <style>{`
      .goog-te-banner-frame, .goog-te-balloon-frame,
      #google_translate_element, .goog-tooltip,
      .goog-te-gadget, .skiptranslate {
        display: none !important;
      }
      body { top: 0 !important; }
    `}</style>
  );
}
