"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { THEME_STORAGE_KEY, THEME_LITERALS, type ThemeName } from "@/lib/theme";

interface Ctx {
  theme: ThemeName;
  setTheme: (t: ThemeName) => void;
  toggle: () => void;
}

const ThemeCtx = createContext<Ctx>({ theme: "dark", setTheme: () => {}, toggle: () => {} });

export function useTheme() {
  return useContext(ThemeCtx);
}

/**
 * Runs BEFORE first paint, inlined in <head>.
 *
 * Without this the document renders dark, hydrates, and only then discovers a
 * stored light preference — a full-page flash from black to white on every
 * load, which is worse than having no light mode at all. React cannot help
 * here: any effect, even useLayoutEffect, runs after the browser has already
 * painted the server's HTML.
 *
 * Deliberately tiny and deliberately silent. It touches only the root element's
 * dataset and a meta tag, it never throws (storage access throws outright when
 * site data is blocked), and on any failure the document keeps the dark default
 * that :root already defines.
 */
export const themeBootScript = `(function(){try{
var t=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});
if(t==="light"){document.documentElement.dataset.theme="light";
var m=document.querySelector('meta[name="theme-color"]');
if(m)m.setAttribute("content",${JSON.stringify(THEME_LITERALS.light.bg)});}
}catch(e){}})();`;

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  /* Seeded from the DOM, not from storage. The boot script above has already
     run and is the single source of truth for what is on screen, so reading the
     attribute keeps React's first client render identical to the markup the
     browser already painted. Reading storage again here would be a second
     opinion, and a second opinion is a hydration mismatch. */
  const [theme, setThemeState] = useState<ThemeName>(() => {
    if (typeof document === "undefined") return "dark";
    return document.documentElement.dataset.theme === "light" ? "light" : "dark";
  });

  const setTheme = useCallback((next: ThemeName) => {
    setThemeState(next);
    if (typeof document === "undefined") return;
    if (next === "light") document.documentElement.dataset.theme = "light";
    else delete document.documentElement.dataset.theme;

    /* The iOS status bar and the Android URL bar are painted from this meta
       tag, so a white page under a near-black status bar is a visible seam. */
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", THEME_LITERALS[next].bg);

    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      /* Site data blocked. The choice holds for this session, which is better
         than throwing inside a tap handler. */
    }
  }, []);

  const toggle = useCallback(() => {
    setTheme(theme === "light" ? "dark" : "light");
  }, [theme, setTheme]);

  /* Follow the choice if it is made in another tab, so two open tabs do not
     disagree about what the app looks like. */
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== THEME_STORAGE_KEY) return;
      setTheme(e.newValue === "light" ? "light" : "dark");
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [setTheme]);

  return <ThemeCtx.Provider value={{ theme, setTheme, toggle }}>{children}</ThemeCtx.Provider>;
}
