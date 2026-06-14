import Link from "next/link";
import Image from "next/image";
import type { Series } from "@/lib/catalog";

interface SeriesCardProps {
  series: Series;
  dimmed?: boolean;
}

export default function SeriesCard({ series, dimmed }: SeriesCardProps) {
  return (
    <Link
      href={`/series/${series.slug}`}
      className="flex-shrink-0 group"
      style={{ width: 130, opacity: dimmed ? 0.45 : 1 }}
    >
      {/* Poster */}
      <div
        className="relative overflow-hidden rounded-lg"
        style={{ width: 130, aspectRatio: "3 / 4.2" }}
      >
        <Image
          src={series.posterUrl}
          alt={series.title}
          fill
          sizes="130px"
          className="object-cover"
        />

        {/* Episode count badge */}
        <span
          className="absolute top-2 right-2 text-xs font-semibold px-1.5 py-0.5 rounded"
          style={{
            background: "rgba(7, 7, 14, 0.75)",
            color: "#F5F4F8",
            backdropFilter: "blur(4px)",
          }}
        >
          {series.episodeCount} ep
        </span>

        {/* Coming soon badge */}
        {series.status === "coming_soon" && (
          <span
            className="absolute bottom-2 left-2 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
            style={{
              background: "#E0115F",
              color: "#F5F4F8",
            }}
          >
            Soon
          </span>
        )}
      </div>

      {/* Title */}
      <p
        className="mt-2 text-xs font-medium leading-tight line-clamp-2"
        style={{ color: "#F5F4F8" }}
      >
        {series.title}
      </p>
    </Link>
  );
}
