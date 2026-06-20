"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Series } from "@/lib/catalog";
import { useTranslation } from "@/components/LangProvider";
import type { SeriesDetail } from "@/lib/series-detail";
import SeriesInfoDrawer from "@/components/SeriesInfoDrawer";

interface SeriesInfoButtonProps {
  series: Series;
  seriesDetail?: SeriesDetail;
  currentEpisode: number;
  totalEpisodes: number;
}

export default function SeriesInfoButton({
  series,
  seriesDetail,
  currentEpisode,
  totalEpisodes,
}: SeriesInfoButtonProps) {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-opacity active:opacity-70"
        style={{
          background: "rgba(255,255,255,0.1)",
          border: "1px solid rgba(255,255,255,0.15)",
          color: "rgba(255,255,255,0.8)",
          cursor: "pointer",
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
        {t("content.info")}
      </button>

      {open && (
        <SeriesInfoDrawer
          series={series}
          seriesDetail={seriesDetail}
          currentEpisode={currentEpisode}
          totalEpisodes={totalEpisodes}
          onClose={() => setOpen(false)}
          onSelectEpisode={(ep) => {
            setOpen(false);
            router.push(`/series/${series.slug}/${ep}`);
          }}
        />
      )}
    </>
  );
}
