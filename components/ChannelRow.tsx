import type { Series } from "@/lib/catalog";
import SeriesCard from "@/components/SeriesCard";

interface ChannelRowProps {
  title: string;
  series: Series[];
  dimmed?: boolean;
}

export default function ChannelRow({ title, series, dimmed }: ChannelRowProps) {
  if (series.length === 0) return null;

  return (
    <section className="mt-8">
      {/* Section header */}
      <div className="flex items-center justify-between px-4 mb-3">
        <h2 className="text-base font-bold" style={{ color: "#F5F4F8" }}>
          {title}
        </h2>
        <span
          className="text-xs font-medium"
          style={{ color: "#A0A0B0" }}
        >
          More &gt;
        </span>
      </div>

      {/* Horizontal scroll */}
      <div
        className="flex gap-3 overflow-x-auto px-4 pb-2 no-scrollbar"
      >
        {series.map((s) => (
          <SeriesCard key={s.slug} series={s} dimmed={dimmed} />
        ))}
      </div>
    </section>
  );
}
