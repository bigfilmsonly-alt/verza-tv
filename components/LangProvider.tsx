"use client";

import { trackLanguageChange } from "@/lib/track";
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import {
  dictionaries,
  DEFAULT_LOCALE,
  STORAGE_KEY,
  type Locale,
  type TranslationKey,
} from "@/lib/i18n";

interface LangContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey) => string;
}

const LangContext = createContext<LangContextValue>({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  t: (key) => dictionaries.en[key] ?? key,
});

export function LangProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  /* Hydrate from localStorage */
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (saved && dictionaries[saved]) {
      setLocaleState(saved);
      document.documentElement.lang = saved;
    }
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    trackLanguageChange(next);
    localStorage.setItem(STORAGE_KEY, next);
    document.documentElement.lang = next;
  }, []);

  const t = useCallback(
    (key: TranslationKey): string =>
      dictionaries[locale]?.[key] ?? dictionaries.en[key] ?? key,
    [locale],
  );

  return (
    <LangContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LangContext.Provider>
  );
}

export function useTranslation() {
  return useContext(LangContext);
}
