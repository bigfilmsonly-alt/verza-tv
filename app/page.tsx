"use client";

import { useState } from "react";
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

function PosterImage({ src, alt, fill, sizes, className }: {
  src: string; alt: string; fill?: boolean; sizes?: string; className?: string;
}) {
  if (!src) {
    return (
      <div
        className={`flex items-center justify-center text-xs font-semibold text-center px-2 ${className ?? ""}`}
        style={{
          position: fill ? "absolute" : undefined,
          inset: fill ? 0 : undefined,
          background: "linear-gradient(135deg, #1A1A26, #12121C)",
          color: "#6B6B7B",
        }}
      >
        {alt}
      </div>
    );
  }
  return <Image src={src} alt={alt} fill={fill} sizes={sizes} className={className} />;
}

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<BrowseCategory>("drama");

  const live = getLiveSeries();
  const filtered = getSeriesByCategory(activeTab);

  // Featured: first 4 from active tab
  const featured = filtered.slice(0, 4);
  const current = featured[0];

  return (
    <>
      {/* ---- Search Bar ---- */}
      <FeedSearch series={catalog} />

      {/* ---- Category Tabs ---- */}
      <CategoryTabs active={activeTab} onSelect={setActiveTab} />

      {/* ---- Hero ---- */}
      {current && (
        <div className="relative">
          <Link href={`/series/${current.slug}`} className="block">
            <div className="relative w-full" style={{ height: "55dvh", minHeight: 360 }}>
              <PosterImage
                src={current.posterUrl}
                alt={current.title}
                fill
                sizes="100vw"
                className="object-cover"
              />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(to bottom, transparent 40%, rgba(7,7,14,0.7) 75%, #07070E 100%)",
                }}
              />
            </div>
          </Link>
          <div className="px-4 -mt-16 relative z-10">
            <Link href={`/series/${current.slug}`} className="no-underline">
              <h2
                className="text-[22px] font-extrabold leading-tight uppercase tracking-wide"
                style={{ color: "#F5F4F8" }}
              >
                {current.title}
              </h2>
            </Link>
            <p className="mt-1.5 text-xs" style={{ color: "#6B6B7B" }}>
              <span
                className="inline-block w-1.5 h-1.5 rounded-full mr-1.5"
                style={{ background: "#6B6B7B", verticalAlign: "middle" }}
              />
              {current.genre} &middot; {current.episodeCount} episodes
            </p>
          </div>
        </div>
      )}

      {/* ---- Poster Row (rest of filtered tab) ---- */}
      {filtered.length > 1 && (
        <div className="mt-6 px-4">
          <div className="flex gap-3 overflow-x-auto no-scrollbar">
            {filtered.slice(1).map((s) => (
              <Link
                key={s.slug}
                href={`/series/${s.slug}`}
                className="flex-shrink-0 block"
                style={{ width: 150 }}
              >
                <div
                  className="relative overflow-hidden rounded-lg"
                  style={{ width: 150, aspectRatio: "3 / 4" }}
                >
                  <PosterImage
                    src={s.posterUrl}
                    alt={s.title}
                    fill
                    sizes="150px"
                    className="object-cover"
                  />
                </div>
                <p
                  className="mt-2 text-xs font-medium leading-tight line-clamp-2"
                  style={{ color: "#F5F4F8" }}
                >
                  {s.title}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ---- All Shows — Full Poster Grid ---- */}
      <section className="mt-8 px-4 pb-8">
        <h2
          className="text-sm font-semibold uppercase tracking-wider mb-4"
          style={{ color: "#6B6B7B" }}
        >
          All Shows
        </h2>
        <div className="grid grid-cols-2 gap-3">
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
                <PosterImage
                  src={s.posterUrl}
                  alt={s.title}
                  fill
                  sizes="(max-width: 440px) 50vw, 220px"
                  className="object-cover"
                />
                {/* Bottom gradient for title readability */}
                <div
                  className="absolute inset-x-0 bottom-0 px-2.5 pb-2.5 pt-10"
                  style={{
                    background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)",
                  }}
                >
                  <p
                    className="text-xs font-bold leading-tight line-clamp-2"
                    style={{ color: "#F5F4F8" }}
                  >
                    {s.title}
                  </p>
                  <p className="text-[10px] mt-0.5" style={{ color: "#A0A0B0" }}>
                    {s.genre}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
