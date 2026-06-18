"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import CategoryTabs from "@/components/CategoryTabs";
import FeedSearch from "@/components/FeedSearch";
import { BROWSE_TABS, getSeriesByCategory, type Series, type BrowseCategory } from "@/lib/catalog";
import PosterSkeleton from "@/components/PosterSkeleton";

function Poster({ src, alt }: { src: string; alt: string }) {
  if (!src) {
    return (
      <div
        className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-center px-1"
        style={{ background: "linear-gradient(135deg, #1A1A26, #12121C)", color: "#6B6B7B" }}
      >
        {alt.split(" ").slice(0, 3).join(" ")}
      </div>
    );
  }
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes="(max-width: 440px) 33vw, 146px"
      className="object-cover"
      style={{ filter: "saturate(1.12) contrast(1.04) brightness(1.02)" }}
    />
  );
}

interface Props {
  allSeries: Series[];
  liveSeries: Series[];
  tabData: Record<string, Series[]>;
}

export default function BrowsePage({ allSeries, liveSeries, tabData }: Props) {
  // Show ALL tabs (including empty ones like Music, Red Carpet)
  const activeTabs = BROWSE_TABS;

  const [activeTab, setActiveTab] = useState<BrowseCategory>("drama");
  const [heroIdx, setHeroIdx] = useState(0);

  const filtered = tabData[activeTab] ?? [];
  const heroSlides = filtered.slice(0, 4);
  const current = heroSlides[heroIdx % Math.max(heroSlides.length, 1)];

  useEffect(() => { setHeroIdx(0); }, [activeTab]);

  useEffect(() => {
    if (heroSlides.length <= 1) return;
    const t = setInterval(() => setHeroIdx((i) => (i + 1) % heroSlides.length), 5000);
    return () => clearInterval(t);
  }, [heroSlides.length]);

  const goPrev = useCallback(() => {
    setHeroIdx((i) => (i === 0 ? heroSlides.length - 1 : i - 1));
  }, [heroSlides.length]);

  const goNext = useCallback(() => {
    setHeroIdx((i) => (i + 1) % heroSlides.length);
  }, [heroSlides.length]);

  const gridItems = filtered.slice(heroSlides.length);

  return (
    <div className="relative">
      {/* Search icon — floats top-right, next to header IG handle */}
      <div className="absolute top-2 right-16 z-50">
        <FeedSearch series={allSeries} />
      </div>

      {/* Category tabs — all visible, no scroll */}
      <CategoryTabs active={activeTab} onSelect={setActiveTab} tabs={activeTabs} />

      {/* Hero Skeleton */}
      {!current && (
        <div>
          <div className="skeleton w-full" style={{ aspectRatio: "9 / 14", maxHeight: "70dvh" }} />
        </div>
      )}

      {/* Hero Slideshow — clean poster, text below */}
      {current && (
        <div>
          {/* Poster image — clean, no text overlay */}
          <div className="relative">
            <Link href={`/series/${current.slug}/1`} className="block">
              <div
                className="relative w-full overflow-hidden"
                style={{ aspectRatio: "9 / 16", background: "#07070E" }}
              >
                {current.posterUrl ? (
                  <Image
                    src={current.posterUrl}
                    alt={current.title}
                    fill
                    priority
                    sizes="100vw"
                    className="object-cover object-top"
                  />
                ) : (
                  <div
                    className="absolute inset-0 flex items-center justify-center text-lg font-bold"
                    style={{ background: "linear-gradient(135deg, #1A1A26, #12121C)", color: "#6B6B7B" }}
                  >
                    {current.title}
                  </div>
                )}
              </div>
            </Link>

            {heroSlides.length > 1 && (
              <>
                <button
                  onClick={goPrev}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center border-0 cursor-pointer z-10"
                  style={{ background: "rgba(7,7,14,0.55)", color: "#fff", backdropFilter: "blur(6px)" }}
                  aria-label="Previous"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
                </button>
                <button
                  onClick={goNext}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center border-0 cursor-pointer z-10"
                  style={{ background: "rgba(7,7,14,0.55)", color: "#fff", backdropFilter: "blur(6px)" }}
                  aria-label="Next"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
                </button>
              </>
            )}
          </div>

          {/* Title + CTA below the poster */}
          <div className="px-4 pt-3 pb-1 text-center">
            <Link href={`/series/${current.slug}/1`} className="no-underline">
              <h2 className="text-lg font-extrabold leading-tight uppercase tracking-wide" style={{ color: "#FFFFFF" }}>
                {current.title}
              </h2>
            </Link>
            <p className="mt-1 text-xs" style={{ color: "#6B6B7B" }}>
              {current.genre} &middot; {current.episodeCount} episodes
            </p>
            {heroSlides.length > 1 && (
              <div className="flex items-center justify-center gap-1.5 mt-2.5">
                {heroSlides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setHeroIdx(i)}
                    className="p-0 border-0 cursor-pointer"
                    style={{ background: "none" }}
                    aria-label={`Slide ${i + 1}`}
                  >
                    <div
                      className="rounded-full"
                      style={{
                        width: i === heroIdx % heroSlides.length ? 24 : 6,
                        height: 6,
                        background: i === heroIdx % heroSlides.length
                          ? "linear-gradient(90deg, #E0115F, #8B5CF6)"
                          : "#6B6B7B",
                        transition: "width 0.3s",
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
            <Link
              href={`/series/${current.slug}/1`}
              className="inline-flex items-center gap-2 mt-3 px-5 py-2.5 rounded-full text-sm font-bold no-underline transition-transform active:scale-95"
              style={{
                background: "linear-gradient(135deg, #E0115F, #8B5CF6)",
                color: "#fff",
                boxShadow: "0 0 20px rgba(224, 17, 95, 0.3)",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff" stroke="none">
                <polygon points="6 3 20 12 6 21" />
              </svg>
              Start Watching Free
            </Link>
          </div>
        </div>
      )}

      {/* Tab Grid */}
      {gridItems.length === 0 && filtered.length > 4 ? (
        <section className="mt-4 px-3 pb-6">
          <PosterSkeleton count={9} />
        </section>
      ) : gridItems.length > 0 && (
        <section className="mt-4 px-3 pb-6">
          <div className="grid grid-cols-3 gap-2.5 poster-grid stagger-children">
            {gridItems.map((s) => (
              <Link key={s.slug} href={`/series/${s.slug}/1`} className="group block no-underline transition-transform duration-200 hover:scale-[1.03]">
                <div className="relative overflow-hidden rounded-lg" style={{ aspectRatio: "3 / 4" }}>
                  <Poster src={s.posterUrl} alt={s.title} />
                  {/* Play preview overlay on hover */}
                  <div
                    className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"
                    style={{ background: "rgba(0,0,0,0.3)" }}
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ background: "rgba(224, 17, 95, 0.85)", backdropFilter: "blur(4px)" }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff" stroke="none">
                        <polygon points="8 5 20 12 8 19" />
                      </svg>
                    </div>
                  </div>
                </div>
                <p className="mt-1.5 text-[11px] font-semibold leading-tight line-clamp-2" style={{ color: "#F5F4F8" }}>{s.title}</p>
                <p className="text-[10px] mt-0.5 line-clamp-1" style={{ color: "#6B6B7B" }}>{s.genre}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* All Shows */}
      <section className="px-3 pb-8">
        <h2 className="text-sm font-semibold uppercase tracking-wider mb-4 px-1" style={{ color: "#8A8A9A" }}>All Shows</h2>
        <div className="grid grid-cols-3 gap-2.5 poster-grid stagger-children">
          {liveSeries.map((s) => (
            <Link key={s.slug} href={`/series/${s.slug}/1`} className="group block no-underline transition-transform duration-200 hover:scale-[1.03]">
              <div className="relative overflow-hidden rounded-lg" style={{ aspectRatio: "3 / 4" }}>
                <Poster src={s.posterUrl} alt={s.title} />
                {/* Play preview overlay on hover */}
                <div
                  className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"
                  style={{ background: "rgba(0,0,0,0.3)" }}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(224, 17, 95, 0.85)", backdropFilter: "blur(4px)" }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff" stroke="none">
                      <polygon points="8 5 20 12 8 19" />
                    </svg>
                  </div>
                </div>
              </div>
              <p className="mt-1.5 text-[11px] font-semibold leading-tight line-clamp-2" style={{ color: "#F5F4F8" }}>{s.title}</p>
              <p className="text-[10px] mt-0.5 line-clamp-1" style={{ color: "#6B6B7B" }}>{s.genre}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
