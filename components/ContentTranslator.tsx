"use client";

import { useEffect } from "react";
import { useTranslation } from "@/components/LangProvider";
import type { Locale } from "@/lib/i18n";

/* Maps our locale codes to Google Translate language codes */
const GOOGLE_LANG: Record<Locale, string> = {
  en: "en", es: "es", fr: "fr", pt: "pt", de: "de", it: "it",
  ja: "ja", ko: "ko", zh: "zh-CN", hi: "hi", ar: "ar", ru: "ru",
  tr: "tr", pl: "pl", nl: "nl", th: "th", vi: "vi", id: "id",
  tl: "tl", sw: "sw",
};

/**
 * ContentTranslator — auto-translates all page content using
 * the browser's built-in translation API or Google Translate.
 *
 * When the user changes language, this component sets the page's
 * lang attribute and triggers translation of content text.
 */
export default function ContentTranslator() {
  const { locale } = useTranslation();

  useEffect(() => {
    const googleLang = GOOGLE_LANG[locale] || "en";

    /* Update the HTML lang attribute */
    document.documentElement.lang = googleLang;

    /* If English, remove any translation cookies and reload translated content */
    if (locale === "en") {
      /* Remove Google Translate cookie to revert */
      document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.verzatv.com";

      /* Remove translation frame if exists */
      const frame = document.querySelector(".goog-te-banner-frame");
      if (frame) (frame as HTMLElement).style.display = "none";

      /* Restore original text */
      const translated = document.querySelector(".translated-ltr, .translated-rtl");
      if (translated) {
        translated.classList.remove("translated-ltr", "translated-rtl");
      }
      return;
    }

    /* Set Google Translate cookie for auto-translation */
    document.cookie = `googtrans=/en/${googleLang}; path=/`;
    document.cookie = `googtrans=/en/${googleLang}; path=/; domain=.verzatv.com`;

    /* Load Google Translate script if not already loaded */
    if (!document.getElementById("google-translate-script")) {
      /* Hidden element required by Google Translate */
      const el = document.createElement("div");
      el.id = "google_translate_element";
      el.style.display = "none";
      document.body.appendChild(el);

      const script = document.createElement("script");
      script.id = "google-translate-script";
      script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateInit";
      script.async = true;
      document.body.appendChild(script);

      /* Callback for Google Translate initialization */
      (window as unknown as Record<string, unknown>).googleTranslateInit = () => {
        new ((window as unknown as Record<string, Record<string, Record<string, new (...args: unknown[]) => unknown>>>).google.translate.TranslateElement)(
          {
            pageLanguage: "en",
            autoDisplay: false,
            includedLanguages: Object.values(GOOGLE_LANG).join(","),
          },
          "google_translate_element"
        );
      };
    } else {
      /* Script already loaded — trigger re-translation by updating cookie + reloading frame */
      const iframe = document.querySelector(".goog-te-menu-frame") as HTMLIFrameElement;
      if (iframe) {
        try {
          const innerDoc = iframe.contentDocument || iframe.contentWindow?.document;
          const links = innerDoc?.querySelectorAll("a");
          links?.forEach((link) => {
            if (link.textContent?.includes(googleLang) || link.getAttribute("href")?.includes(googleLang)) {
              link.click();
            }
          });
        } catch {
          /* Cross-origin — reload the page to apply new language */
          window.location.reload();
        }
      }
    }
  }, [locale]);

  /* Hide Google Translate toolbar with CSS */
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
