import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { catalog, BROWSE_TABS } from "@/lib/catalog";
import { T } from "@/lib/theme";
import SearchBar from "@/components/SearchBar";

export const metadata: Metadata = {
  title: "Discover Micro-Dramas | Verza TV",
  description:
    "Browse Drama, New, Popular, Music, Reality, and Red Carpet micro-dramas on Verza TV. 80+ original series, all vertical, all binge-worthy.",
};

export default function DiscoverPage() {
  return (
    <section className="px-4 pt-6 pb-8">
      <h1 className="text-2xl font-bold mb-5" style={{ color: T.text }}>
        Discover
      </h1>

      <div className="mb-8">
        <SearchBar series={catalog} />
      </div>

      {/* Browse Categories */}
      <h2
        className="text-sm font-semibold uppercase tracking-wider mb-3"
        style={{ color: T.textMute }}
      >
        Browse by Category
      </h2>
      <div className="genre-grid grid grid-cols-2 gap-3 mb-10">
        {BROWSE_TABS.map((tab) => (
          <Link
            key={tab.key}
            href={`/discover/${tab.key}`}
            className="flex items-center justify-center h-20 rounded-xl text-sm font-semibold no-underline transition-transform active:scale-95"
            style={{
              background: `linear-gradient(135deg, ${T.accent}22, ${T.accent}44)`,
              border: `1px solid ${T.accent}33`,
              color: T.accent,
            }}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {/* All Series */}
      <h2
        className="text-sm font-semibold uppercase tracking-wider mb-4"
        style={{ color: T.textMute }}
      >
        All Series
      </h2>
      <div className="flex flex-col gap-3">
        {catalog.map((series) => (
          <Link
            key={series.slug}
            href={`/series/${series.slug}`}
            className="flex items-center gap-4 rounded-xl p-3 no-underline transition-colors"
            style={{ background: T.surface, color: T.text }}
          >
            <div
              className="w-14 h-20 rounded-lg flex-shrink-0 overflow-hidden relative"
              style={{ background: T.raised }}
            >
              {series.posterUrl ? (
                <Image
                  src={series.posterUrl}
                  alt={series.title}
                  fill
                  sizes="56px"
                  className="object-cover"
                />
              ) : (
                <div
                  className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-center px-1"
                  style={{ color: T.textMute }}
                >
                  {series.episodeCount}ep
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate">{series.title}</p>
              <p
                className="text-xs mt-0.5 line-clamp-2"
                style={{ color: T.textDim }}
              >
                {series.logline}
              </p>
              <div className="flex items-center gap-2 mt-1.5">
                <span
                  className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                  style={{ background: `${T.accent}22`, color: T.accent }}
                >
                  {series.genre}
                </span>
                {series.status === "coming_soon" && (
                  <span
                    className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                    style={{ background: `${T.coin}22`, color: T.coin }}
                  >
                    Coming Soon
                  </span>
                )}
                {series.status === "live" && (
                  <span className="text-[10px]" style={{ color: T.textMute }}>
                    {series.episodeCount} ep &middot; {series.freeEpisodes} free
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
