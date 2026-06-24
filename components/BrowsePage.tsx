"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import CategoryTabs from "@/components/CategoryTabs";
import { useTranslation } from "@/components/LangProvider";
import { BROWSE_TABS, getSeriesByCategory, type Series, type BrowseCategory } from "@/lib/catalog";
import PosterSkeleton from "@/components/PosterSkeleton";
import HeroVideo from "@/components/HeroVideo";
import RedCarpetHero from "@/components/RedCarpetHero";
import HorizontalFeed from "@/components/HorizontalFeed";
import { MUX_MAP } from "@/lib/mux-map";

// Eagerly preload hls.js so it's cached before user taps a video
if (typeof window !== "undefined") {
  import("hls.js").catch(() => {});
}

function Badge({ type }: { type: "trending" | "new" }) {
  return (
    <div
      className="absolute top-1.5 left-1.5 z-10 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider"
      style={{
        background: type === "trending" ? "#E0115F" : "#8B5CF6",
        color: "#fff",
      }}
    >
      {type === "trending" ? "Trending" : "New"}
    </div>
  );
}

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

interface Props {
  allSeries: Series[];
  liveSeries: Series[];
  tabData: Record<string, Series[]>;
}

interface ContinueItem {
  seriesSlug: string;
  seriesTitle: string;
  posterUrl: string;
  episodeNumber: number;
  totalEpisodes: number;
}

export default function BrowsePage({ allSeries, liveSeries, tabData }: Props) {
  const { t } = useTranslation();
  const activeTabs = BROWSE_TABS;

  const [activeTab, setActiveTab] = useState<BrowseCategory>("drama");
  const [heroIdx, setHeroIdx] = useState(0);
  const [continueWatching, setContinueWatching] = useState<ContinueItem[]>([]);
  const [showSplash, setShowSplash] = useState<string | null>(null);

  const filtered = tabData[activeTab] ?? [];
  const heroSlides = filtered.slice(0, 4);
  const current = heroSlides[heroIdx % Math.max(heroSlides.length, 1)];

  useEffect(() => { setHeroIdx(0); }, [activeTab]);

  // No splash on Red Carpet — poster shows instantly

  // Reality show data (posters may not exist yet — uses styled placeholders)
  const realityShows = [
    { title: "Sugar Babies", poster: "/posters/sugar-babies.jpg" },
    { title: "Buy/Sell Miami", poster: "/posters/buy-sell-miami.png" },
    { title: "The Vertical Tea", poster: "/posters/the-vertical-tea.png" },
    { title: "Storage Pirates", poster: "/posters/storage-pirates.jpg" },
  ];

  // Fetch continue watching data
  useEffect(() => {
    fetch("/api/watch-progress")
      .then((r) => r.json())
      .then((d) => setContinueWatching(d.items ?? []))
      .catch(() => {});
  }, []);

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

  // Show ALL filtered series in the grid (not just the ones after the hero)
  const gridItems = filtered;

  return (
    <div>
      {/* Splash screen — Verza TV logo on black */}
      {showSplash && (
        <div
          className="fixed inset-0 flex items-center justify-center"
          style={{
            zIndex: 100,
            background: "#000",
            animation: "fadeOut 0.5s ease 1s forwards",
          }}
        >
          <div style={{ animation: "scaleIn 0.4s ease" }}>
            <img src="/logo.png" alt="Verza TV" width={200} height={55} />
          </div>
        </div>
      )}

      {/* Category tabs */}
      <CategoryTabs active={activeTab} onSelect={setActiveTab} tabs={activeTabs} />

      {/* Continue Watching row */}
      {continueWatching.length > 0 && (
        <section className="pb-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider mb-3 px-4" style={{ color: "#8A8A9A" }}>Continue Watching</h2>
          <div
            className="flex gap-1.5 overflow-x-auto no-scrollbar px-3 snap-x snap-mandatory"
            style={{ WebkitOverflowScrolling: "touch", overscrollBehaviorY: "none", touchAction: "pan-x pinch-zoom" }}
          >
            {continueWatching.map((item) => (
              <Link key={item.seriesSlug} href={`/series/${item.seriesSlug}/${item.episodeNumber}`} className="group block no-underline flex-shrink-0 snap-start" style={{ width: 120 }}>
                <div className="relative overflow-hidden rounded-lg" style={{ width: 120, aspectRatio: "2 / 3" }}>
                  {item.posterUrl && (
                    <Image src={item.posterUrl} alt={item.seriesTitle} fill sizes="120px" className="object-cover" />
                  )}
                  {/* Progress bar */}
                  <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: "rgba(0,0,0,0.5)" }}>
                    <div className="h-full" style={{ width: "50%", background: "#E0115F" }} />
                  </div>
                  {/* Episode badge */}
                  <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold" style={{ background: "rgba(0,0,0,0.7)", color: "#fff" }}>
                    EP {item.episodeNumber}
                  </div>
                </div>
                <div style={{ height: 36 }}>
                  <p className="mt-1.5 text-[11px] font-semibold leading-tight line-clamp-2" style={{ color: "#F5F4F8" }}>{item.seriesTitle}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Music tab — Too Much Junk poster → taps to native Mux player */}
      {activeTab === "music" && (
        <div>
          <div className="relative">
            <Link href="/series/too-much-junk/1" prefetch={true} className="block transition-transform active:scale-[0.97]">
              <div className="relative w-full overflow-hidden" style={{ aspectRatio: "2 / 3", background: "#000" }}>
                <Image
                  src="/posters/too-much-junk.jpg"
                  alt="Too Much Junk"
                  fill
                  priority
                  sizes="100vw"
                  className="object-contain"
                  style={{ objectPosition: "top" }}
                />
              </div>
            </Link>
            <div className="absolute bottom-0 left-0 right-0 pointer-events-none" style={{ height: 80, background: "linear-gradient(to top, #07070E, transparent)", zIndex: 5 }} />
          </div>
        </div>
      )}

      {/* Coming Soon — for empty categories (skip Reality and Music since they show inline) */}
      {filtered.length === 0 && activeTab !== "reality" && activeTab !== "music" && activeTab !== "red-carpet" && (
        <section className="px-4 py-8">
          <div
            className="rounded-2xl py-16 flex flex-col items-center justify-center gap-4 text-center"
            style={{ background: "linear-gradient(135deg, #12121C, #0A0A14)", border: "1px solid rgba(224,17,95,0.15)" }}
          >
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "rgba(224,17,95,0.12)" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#E0115F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <h3 className="text-lg font-bold" style={{ color: "#F5F4F8" }}>Coming Soon</h3>
            <p className="text-sm max-w-[280px] leading-relaxed" style={{ color: "#6B6B7B" }}>
              New content for this category is being produced. Check back soon for exclusive releases.
            </p>
          </div>
        </section>
      )}

      {/* Reality tab — full-width hero slideshow */}
      {activeTab === "reality" && (() => {
        const realityIdx = heroIdx % realityShows.length;
        const currentShow = realityShows[realityIdx];
        return (
          <div>
            <div className="relative">
              <div className="relative w-full overflow-hidden" style={{ aspectRatio: "2 / 3", background: "#000" }}>
                <Image src={currentShow.poster} alt={currentShow.title} fill priority sizes="100vw" className="object-contain" />
              </div>

              {/* Bottom gradient */}
              <div className="absolute bottom-0 left-0 right-0 pointer-events-none" style={{ height: 80, background: "linear-gradient(to top, #07070E, transparent)", zIndex: 5 }} />

              {/* Arrows */}
              <button
                onClick={() => setHeroIdx((i) => (i === 0 ? realityShows.length - 1 : i - 1))}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center border-0 cursor-pointer z-10"
                style={{ background: "rgba(7,7,14,0.55)", color: "#fff", backdropFilter: "blur(6px)" }}
                aria-label="Previous"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
              </button>
              <button
                onClick={() => setHeroIdx((i) => (i + 1) % realityShows.length)}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center border-0 cursor-pointer z-10"
                style={{ background: "rgba(7,7,14,0.55)", color: "#fff", backdropFilter: "blur(6px)" }}
                aria-label="Next"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
              </button>
            </div>

            {/* Dot indicators */}
            <div className="flex items-center justify-center gap-1.5 py-2">
              {realityShows.map((_, i) => (
                <button key={i} onClick={() => setHeroIdx(i)} className="p-0 border-0 cursor-pointer" style={{ background: "none" }} aria-label={`Slide ${i + 1}`}>
                  <div className="rounded-full" style={{
                    width: i === realityIdx ? 20 : 6,
                    height: 6,
                    background: i === realityIdx ? "linear-gradient(90deg, #E0115F, #8B5CF6)" : "rgba(255,255,255,0.4)",
                    transition: "width 0.3s",
                  }} />
                </button>
              ))}
            </div>

            {/* All Reality posters */}
            <section className="mt-2 pb-4 px-3">
              <div className="poster-grid grid grid-cols-3 gap-1.5">
                {realityShows.map((show) => (
                  <div key={show.title} className="block no-underline min-w-0">
                    <div className="relative overflow-hidden rounded-lg" style={{ aspectRatio: "2 / 3" }}>
                      <Image src={show.poster} alt={show.title} fill sizes="(max-width: 440px) 33vw, 146px" className="object-cover" />
                    </div>
                    <div style={{ height: 36 }}>
                      <p className="mt-1.5 text-[11px] font-semibold leading-tight line-clamp-2" style={{ color: "#F5F4F8" }}>{show.title}</p>
                      <p className="text-[10px] mt-0.5" style={{ color: "#6B6B7B" }}>Reality</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Storage Pirates widescreen episodes */}
            <div className="px-3">
              <HorizontalFeed />
            </div>
          </div>
        );
      })()}

      {/* Red Carpet tab — The Carpet poster → taps to video instantly */}
      {activeTab === "red-carpet" && (
        <div>
          {/* Preload the HLS stream so video starts instantly on tap */}
          {(() => {
            const rcId = MUX_MAP["the-dumb-billionaire-heiress-in-love"]?.[0]?.playbackId;
            return rcId ? (
              <link rel="preload" href={`https://stream.mux.com/${rcId}.m3u8`} as="fetch" crossOrigin="anonymous" />
            ) : null;
          })()}
          <div className="relative">
            <Link href="/series/the-dumb-billionaire-heiress-in-love/1" prefetch={true} className="block">
              <div className="relative w-full overflow-hidden" style={{ aspectRatio: "2 / 3", background: "#000" }}>
                <Image
                  src="/posters/the-carpet.png"
                  alt="The Carpet"
                  fill
                  priority
                  sizes="100vw"
                  className="object-contain"
                  style={{ objectPosition: "top" }}
                />
              </div>
            </Link>
            <div className="absolute bottom-0 left-0 right-0 pointer-events-none" style={{ height: 80, background: "linear-gradient(to top, #07070E, transparent)", zIndex: 5 }} />
          </div>
        </div>
      )}

      {/* Hero Slideshow — only when category has content (not Reality or Red Carpet) */}
      {current && activeTab !== "reality" && activeTab !== "red-carpet" && activeTab !== "music" && (
        <div>
          {/* Poster image — clean, no text overlay */}
          <div className="relative">
            <Link href={`/series/${current.slug}/1`} className="block">
              <div
                className="relative w-full overflow-hidden"
                style={{ aspectRatio: "2 / 3", background: "#07070E" }}
              >
                {/* Poster slideshow — full image visible, no cropping */}
                {current.posterUrl ? (
                  <Image
                    src={current.posterUrl}
                    alt={current.title}
                    fill
                    priority
                    sizes="100vw"
                    className="object-contain"
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

            {/* Bottom gradient fade */}
            <div
              className="absolute bottom-0 left-0 right-0 pointer-events-none"
              style={{ height: 80, background: "linear-gradient(to top, #07070E, transparent)", zIndex: 5 }}
            />

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

          {/* Dot indicators overlaid on hero bottom */}
          {heroSlides.length > 1 && (
            <div className="flex items-center justify-center gap-1.5 py-2">
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
                      background: i === heroIdx % heroSlides.length ? "linear-gradient(90deg, #E0115F, #8B5CF6)" : "rgba(255,255,255,0.4)",
                      transition: "width 0.3s",
                    }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab Row — 3-column grid (not on Music/Reality/Red Carpet — they have custom sections) */}
      {gridItems.length > 0 && activeTab !== "music" && activeTab !== "reality" && activeTab !== "red-carpet" && (
        <section className="mt-4 pb-4 px-3">
          <div className="poster-grid grid grid-cols-3 gap-1.5">
            {gridItems.map((s) => (
              <Link key={s.slug} href={`/series/${s.slug}/1`} className="group block no-underline min-w-0 transition-transform active:scale-[0.97]">
                <div className="relative overflow-hidden rounded-lg" style={{ aspectRatio: "2 / 3" }}>
                  <Poster src={s.posterUrl} alt={s.title} />
                  {s.popularRank && s.popularRank <= 5 && <Badge type="trending" />}
                  {!s.popularRank && s.categories.includes("new") && <Badge type="new" />}
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
                <div style={{ height: 36 }}>
                  <p className="mt-1.5 text-[11px] font-semibold leading-tight line-clamp-2" style={{ color: "#F5F4F8" }}>{s.title}</p>
                  <p className="text-[10px] mt-0.5 line-clamp-1" style={{ color: "#6B6B7B" }}>{s.genre}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* All Shows — only on Drama tab */}
      {activeTab === "drama" && <section className="pb-8 px-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider mb-3 px-1" style={{ color: "#8A8A9A" }}>{t("browse.allShows")}</h2>
        <div className="poster-grid grid grid-cols-3 gap-1.5">
          {liveSeries.map((s) => (
            <Link key={s.slug} href={`/series/${s.slug}/1`} className="group block no-underline min-w-0 transition-transform active:scale-[0.97]">
              <div className="relative overflow-hidden rounded-lg" style={{ aspectRatio: "2 / 3" }}>
                <Poster src={s.posterUrl} alt={s.title} />
                {s.popularRank && s.popularRank <= 6 && <Badge type="trending" />}
                {!s.popularRank && s.categories.includes("new") && <Badge type="new" />}
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
              <div style={{ height: 36 }}>
                <p className="mt-1.5 text-[11px] font-semibold leading-tight line-clamp-2" style={{ color: "#F5F4F8" }}>{s.title}</p>
                <p className="text-[10px] mt-0.5 line-clamp-1" style={{ color: "#6B6B7B" }}>{s.genre}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>}
    </div>
  );
}
