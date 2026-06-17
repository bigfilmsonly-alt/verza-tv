"use client";

import { useState } from "react";
import { useTranslation } from "@/components/LangProvider";
import { LOCALES, type Locale } from "@/lib/i18n";
import { T } from "@/lib/theme";

export default function LanguagePicker() {
  const { locale, setLocale, t } = useTranslation();
  const [open, setOpen] = useState(false);

  const current = LOCALES.find((l) => l.code === locale);

  return (
    <>
      {/* Trigger row — matches MenuRow style */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-3 w-full px-4 py-3"
        style={{
          background: "transparent",
          border: "none",
          borderBottom: `1px solid ${T.line}`,
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <span style={{ color: T.textDim }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
          </svg>
        </span>
        <span className="flex-1 text-sm font-medium" style={{ color: T.text }}>
          {t("profile.language")}
        </span>
        <span className="text-sm" style={{ color: T.textMute }}>
          {current?.native ?? "English"}
        </span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.textMute} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>

      {/* Language selection modal */}
      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-t-2xl overflow-hidden"
            style={{ background: T.surface, maxHeight: "70dvh" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${T.line}` }}>
              <h3 className="text-base font-bold" style={{ color: T.text }}>
                {t("profile.language")}
              </h3>
              <button
                onClick={() => setOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: T.textMute }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Language list */}
            <div className="overflow-y-auto" style={{ maxHeight: "calc(70dvh - 60px)" }}>
              {LOCALES.map((lang) => {
                const selected = lang.code === locale;
                return (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setLocale(lang.code as Locale);
                      setOpen(false);
                    }}
                    className="flex items-center gap-3 w-full px-5 py-3.5 text-left transition-colors"
                    style={{
                      background: selected ? `${T.accent}15` : "transparent",
                      border: "none",
                      borderBottom: `1px solid ${T.line}`,
                      cursor: "pointer",
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold" style={{ color: selected ? T.accent : T.text }}>
                        {lang.native}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: T.textMute }}>
                        {lang.label}
                      </p>
                    </div>
                    {selected && (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={T.accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
