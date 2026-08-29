"use client";

import { trackLanguageChange } from "@/lib/track";
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import {
  dictionaries,
  interpolate,
  languageName,
  resolveLocale,
  DEFAULT_LOCALE,
  STORAGE_KEY,
  type Locale,
  type TranslationKey,
} from "@/lib/i18n";
import { formatMoney } from "@/lib/price";

interface LangContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  /**
   * Translate a key. The optional second argument fills {name} placeholders,
   * so a translator can reorder "Series Unlock — {price} one-time" however
   * their language needs without the call site changing.
   */
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
  /** Money in the selected language. See lib/price.ts. */
  formatPrice: (cents: number, currency?: string) => string;
  /** The name of a language, written in the selected language. */
  nameOfLanguage: (languageTag: string) => string;
}

const fallbackT = (
  key: TranslationKey,
  vars?: Record<string, string | number>,
) => {
  const raw = dictionaries.en[key] ?? key;
  return vars ? interpolate(raw, vars) : raw;
};

const LangContext = createContext<LangContextValue>({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  t: fallbackT,
  formatPrice: (cents, currency) => formatMoney(DEFAULT_LOCALE, cents, currency),
  nameOfLanguage: (tag) => languageName(DEFAULT_LOCALE, tag),
});

export function LangProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  /* Hydrate: an explicit choice wins, otherwise fall back to what the browser
     already says the person reads.

     This effect used to read localStorage and stop there, so a first-time
     visitor sending `Accept-Language: es-ES` was served English and had to
     find the switcher to fix it — and the switcher lives in the header, which
     app/globals.css hides outright on the episode route. Someone who arrived
     on a shared episode link had no way to change language at all.

     Detection is deliberately client-side and inside an effect: reading
     headers or cookies on the server would opt the 91 show pages and 2,214
     prerendered episode pages out of static rendering (AGENTS.md rule 13). The
     first paint is English, then it settles — same shape as the existing
     localStorage hydration, so no new hydration mismatch. */
  useEffect(() => {
    let saved: Locale | null = null;
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
      if (stored && dictionaries[stored]) saved = stored;
    } catch {
      /* private mode / blocked storage — fall through to detection */
    }

    const detected =
      saved ??
      resolveLocale(
        navigator.languages?.length
          ? navigator.languages
          : [navigator.language].filter(Boolean),
      );

    if (detected && detected !== DEFAULT_LOCALE) {
      queueMicrotask(() => setLocaleState(detected));
    }
    document.documentElement.lang = detected ?? DEFAULT_LOCALE;
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    trackLanguageChange(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* a blocked store must not stop the language from changing for this
         session — the choice just will not survive a reload */
    }
    document.documentElement.lang = next;
  }, []);

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>): string => {
      const raw = dictionaries[locale]?.[key] ?? dictionaries.en[key] ?? key;
      return vars ? interpolate(raw, vars) : raw;
    },
    [locale],
  );

  const formatPrice = useCallback(
    (cents: number, currency?: string) => formatMoney(locale, cents, currency),
    [locale],
  );

  const nameOfLanguage = useCallback(
    (tag: string) => languageName(locale, tag),
    [locale],
  );

  const value = useMemo(
    () => ({ locale, setLocale, t, formatPrice, nameOfLanguage }),
    [locale, setLocale, t, formatPrice, nameOfLanguage],
  );

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useTranslation() {
  return useContext(LangContext);
}
