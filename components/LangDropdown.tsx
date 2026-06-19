"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslation } from "@/components/LangProvider";
import { LOCALES, type Locale } from "@/lib/i18n";

export default function LangDropdown() {
  const { locale, setLocale } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = LOCALES.find((l) => l.code === locale);

  /* Close on click outside */
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-center w-9 h-9 rounded-full"
        style={{ background: "rgba(255,255,255,0.08)", border: "none", cursor: "pointer" }}
        aria-label="Change language"
      >
        <span className="text-[10px] font-bold uppercase" style={{ color: "#fff" }}>
          {locale}
        </span>
      </button>

      {open && (
        <div
          className="absolute top-full left-0 mt-2 rounded-xl overflow-hidden z-[100]"
          style={{
            background: "#12121C",
            border: "1px solid rgba(255,255,255,0.1)",
            width: 180,
            maxHeight: 320,
            overflowY: "auto",
            boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
          }}
        >
          {LOCALES.map((lang) => {
            const selected = lang.code === locale;
            return (
              <button
                key={lang.code}
                onClick={() => {
                  setLocale(lang.code as Locale);
                  setOpen(false);
                }}
                className="flex items-center gap-2 w-full px-3 py-2.5 text-left border-0 cursor-pointer"
                style={{
                  background: selected ? "rgba(224,17,95,0.15)" : "transparent",
                  borderBottom: "1px solid rgba(255,255,255,0.05)",
                  color: selected ? "#E0115F" : "#F5F4F8",
                  fontSize: 13,
                  fontWeight: selected ? 700 : 400,
                }}
              >
                <span className="flex-1">{lang.native}</span>
                {selected && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#E0115F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
