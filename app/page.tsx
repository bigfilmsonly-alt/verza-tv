"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import CategoryTabs from "@/components/CategoryTabs";
import FeedSearch from "@/components/FeedSearch";
import {
  catalog,
  getLiveSeries,
  getSeriesByCategory,
  type BrowseCategory,
} from "@/lib/catalog";

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
    />
  );
}

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<BrowseCategory>("drama");
  const [heroIdx, setHeroIdx] = useState(0);

  const live = getLiveSeries();
  const filtered = getSeriesByCategory(activeTab);

  // Hero slideshow: first 4 from active tab
  const heroSlides = filtered.slice(0, 4);
  const current = heroSlides[heroIdx % heroSlides.length];

  // Reset hero index when tab changes
  useEffect(() => { setHeroIdx(0); }, [activeTab]);

  // Auto-advance every 5s
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

  // Grid shows everything after the hero slides
  const gridItems = filtered.slice(heroSlides.length);

  return (
    <>
      {/* ---- Search Bar ---- */}
      <FeedSearch series={catalog} />

      {/* ---- Category Tabs ---- */}
      <CategoryTabs active={activeTab} onSelect={setActiveTab} />

      {/* ---- Hero Slideshow ---- */}
      {current && (
        <div className="relative">
          {/* Poster — clean, no text overlay */}
          <Link href={`/series/${current.slug}`} className="block">
            <div
              className="relative w-full overflow-hidden"
              style={{ aspectRatio: "3 / 4", maxHeight: "60dvh" }}
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

          {/* Arrows */}
          {heroSlides.length > 1 && (
            <>
              <button
                onClick={goPrev}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center border-0 cursor-pointer z-10"
                style={{ background: "rgba(7,7,14,0.55)", color: "#fff", backdropFilter: "blur(6px)" }}
                aria-label="Previous"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
              <button
                onClick={goNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center border-0 cursor-pointer z-10"
                style={{ background: "rgba(7,7,14,0.55)", color: "#fff", backdropFilter: "blur(6px)" }}
                aria-label="Next"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            </>
          )}

          {/* Title + info BELOW the poster */}
          <div className="px-4 pt-3 pb-1">
            <Link href={`/series/${current.slug}`} className="no-underline">
              <h2
                className="text-lg font-extrabold leading-tight uppercase tracking-wide"
                style={{ color: "#F5F4F8" }}
              >
                {current.title}
              </h2>
            </Link>
            <p className="mt-1 text-xs" style={{ color: "#6B6B7B" }}>
              {current.genre} &middot; {current.episodeCount} episodes
            </p>

            {/* Dots */}
            {heroSlides.length > 1 && (
              <div className="flex items-center gap-1.5 mt-2.5">
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
                        width: i === heroIdx % heroSlides.length ? 20 : 6,
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
          </div>
        </div>
      )}

      {/* ---- 3-Column Poster Grid (rest of active tab) ---- */}
      {gridItems.length > 0 && (
        <section className="mt-4 px-3 pb-6">
          <div className="grid grid-cols-3 gap-2.5">
            {gridItems.map((s) => (
              <Link
                key={s.slug}
                href={`/series/${s.slug}`}
                className="block no-underline"
              >
                <div
                  className="relative overflow-hidden rounded-lg"
                  style={{ aspectRatio: "3 / 4" }}
                >
                  <Poster src={s.posterUrl} alt={s.title} />
                </div>
                <p
                  className="mt-1.5 text-[11px] font-semibold leading-tight line-clamp-2"
                  style={{ color: "#F5F4F8" }}
                >
                  {s.title}
                </p>
                <p className="text-[10px] mt-0.5 line-clamp-1" style={{ color: "#6B6B7B" }}>
                  {s.genre}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ---- All Shows ---- */}
      <section className="px-3 pb-8">
        <h2
          className="text-sm font-semibold uppercase tracking-wider mb-4 px-1"
          style={{ color: "#6B6B7B" }}
        >
          All Shows
        </h2>
        <div className="grid grid-cols-3 gap-2.5">
          {live.map((s) => (
            <Link
              key={s.slug}
              href={`/series/${s.slug}`}
              className="block no-underline"
            >
              <div
                className="relative overflow-hidden rounded-lg"
                style={{ aspectRatio: "3 / 4" }}
              >
                <Poster src={s.posterUrl} alt={s.title} />
              </div>
              <p
                className="mt-1.5 text-[11px] font-semibold leading-tight line-clamp-2"
                style={{ color: "#F5F4F8" }}
              >
                {s.title}
              </p>
              <p className="text-[10px] mt-0.5 line-clamp-1" style={{ color: "#6B6B7B" }}>
                {s.genre}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
