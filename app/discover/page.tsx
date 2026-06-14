import type { Metadata } from "next";
import Link from "next/link";
import { catalog } from "@/lib/catalog";
import SearchBar from "@/components/SearchBar";

export const metadata: Metadata = {
  title: "Discover Micro-Dramas | Verza TV",
  description:
    "Browse Romance, Thriller, Drama, Comedy, Reality, Mystery, Sci-Fi, and Horror micro-dramas on Verza TV. 80+ original series, all vertical, all binge-worthy.",
};

const GENRE_GRID = [
  { name: "Romance", emoji: "", color: "#E0115F" },
  { name: "Thriller", emoji: "", color: "#8B5CF6" },
  { name: "Drama", emoji: "", color: "#3B82F6" },
  { name: "Comedy", emoji: "", color: "#F59E0B" },
  { name: "Reality", emoji: "", color: "#10B981" },
  { name: "Mystery", emoji: "", color: "#6366F1" },
  { name: "Sci-Fi", emoji: "", color: "#06B6D4" },
  { name: "Horror", emoji: "", color: "#EF4444" },
] as const;

export default function DiscoverPage() {
  const liveSeries = catalog.filter((s) => s.status === "live");

  return (
    <section className="px-4 pt-6 pb-8">
      {/* Header */}
      <h1
        className="text-2xl font-bold mb-5"
        style={{ color: "#F5F4F8" }}
      >
        Discover
      </h1>

      {/* Search */}
      <div className="mb-8">
        <SearchBar series={catalog} />
      </div>

      {/* Genre Grid */}
      <h2
        className="text-sm font-semibold uppercase tracking-wider mb-3"
        style={{ color: "#6B6B7B" }}
      >
        Browse by Genre
      </h2>
      <div className="grid grid-cols-2 gap-3 mb-10">
        {GENRE_GRID.map((g) => (
          <Link
            key={g.name}
            href={`/discover/${g.name.toLowerCase()}`}
            className="flex items-center justify-center h-20 rounded-xl text-sm font-semibold no-underline transition-transform active:scale-95"
            style={{
              background: `linear-gradient(135deg, ${g.color}22, ${g.color}44)`,
              border: `1px solid ${g.color}33`,
              color: g.color,
            }}
          >
            {g.name}
          </Link>
        ))}
      </div>

      {/* All Series */}
      <h2
        className="text-sm font-semibold uppercase tracking-wider mb-4"
        style={{ color: "#6B6B7B" }}
      >
        All Series
      </h2>
      <div className="flex flex-col gap-3">
        {catalog.map((series) => (
          <Link
            key={series.slug}
            href={`/series/${series.slug}`}
            className="flex items-center gap-4 rounded-xl p-3 no-underline transition-colors"
            style={{
              background: "#12121C",
              color: "#F5F4F8",
            }}
          >
            {/* Poster placeholder */}
            <div
              className="w-14 h-20 rounded-lg flex-shrink-0 flex items-center justify-center text-xs"
              style={{
                background: "#1A1A26",
                color: "#6B6B7B",
              }}
            >
              {series.episodeCount}ep
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate">
                {series.title}
              </p>
              <p
                className="text-xs mt-0.5 line-clamp-2"
                style={{ color: "#A0A0B0" }}
              >
                {series.logline}
              </p>
              <div className="flex items-center gap-2 mt-1.5">
                <span
                  className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                  style={{
                    background: "#E0115F22",
                    color: "#E0115F",
                  }}
                >
                  {series.genre}
                </span>
                {series.status === "coming_soon" && (
                  <span
                    className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                    style={{
                      background: "#FFC83D22",
                      color: "#FFC83D",
                    }}
                  >
                    Coming Soon
                  </span>
                )}
                {series.status === "live" && (
                  <span
                    className="text-[10px]"
                    style={{ color: "#6B6B7B" }}
                  >
                    {series.channel}
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
