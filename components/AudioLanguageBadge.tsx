"use client";

import { useTranslation } from "@/components/LangProvider";
import type { TitleLanguage } from "@/lib/audio-language";

/**
 * "Hindi audio · English subtitles", written in the VIEWER's language.
 *
 * Client component on purpose. The show page is a Server Component and cannot
 * call t() (AGENTS.md rule 13 — and reading a locale cookie on the server
 * would drop the 91 show pages and 2,214 prerendered episode pages out of
 * static rendering). A leaf client component gets the translation without
 * costing the page its SSG.
 *
 * The language NAME comes from Intl.DisplayNames, so it is written in the
 * viewer's language for all 20 UI locales with no dictionary entries to keep
 * in sync: "Hindi" for an English viewer, "hindi" for a Spanish one, "हिन्दी"
 * for a Hindi one.
 */
export default function AudioLanguageBadge({
  language,
  compact = false,
}: {
  language: TitleLanguage;
  compact?: boolean;
}) {
  const { t, nameOfLanguage } = useTranslation();

  const audioName = nameOfLanguage(language.audio);

  if (compact) {
    /* Grid tiles get the bare language name and nothing else. The poster art
       is the thing testers named as working — a two-line badge over it is a
       worse trade than the information is worth, and the full sentence is one
       tap away on the show page. */
    return (
      <span
        className="absolute bottom-1 left-1 z-10 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide"
        style={{
          background: "rgba(0,0,0,0.62)",
          color: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(6px)",
          letterSpacing: "0.04em",
        }}
      >
        {audioName}
      </span>
    );
  }

  const label = language.burnedInSubtitles
    ? t("language.audioSubs", {
        language: audioName,
        subtitles: nameOfLanguage(language.burnedInSubtitles),
      })
    : t("language.audio", { language: audioName });

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
      style={{
        background: "rgba(255,255,255,0.08)",
        color: "rgba(245,244,248,0.85)",
        border: "1px solid rgba(255,255,255,0.14)",
      }}
    >
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M3 5h12M9 3v2c0 4.4-2.7 8-6 9" />
        <path d="M5 11c0 2.2 3.1 4.3 6 5" />
        <path d="M13 21l4-10 4 10M14.6 18h5.8" />
      </svg>
      {label}
    </span>
  );
}
