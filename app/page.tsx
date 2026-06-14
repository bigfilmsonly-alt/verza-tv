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

  const live = getLiveSeries();
  const filtered = getSeriesByCategory(activeTab);

  // Hero: first from active tab
  const current = filtered[0];

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
              {current.posterUrl ? (
                <Image
                  src={current.posterUrl}
                  alt={current.title}
                  fill
                  priority
                  sizes="100vw"
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, #1A1A26, #12121C)" }} />
              )}
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(to bottom, transparent 50%, #07070E 100%)",
                }}
              />
            </div>
          </Link>
          <div className="px-4 -mt-14 relative z-10">
            <Link href={`/series/${current.slug}`} className="no-underline">
              <h2
                className="text-[22px] font-extrabold leading-tight uppercase tracking-wide"
                style={{ color: "#F5F4F8" }}
              >
                {current.title}
              </h2>
            </Link>
            <p className="mt-1.5 text-xs" style={{ color: "#6B6B7B" }}>
              {current.genre} &middot; {current.episodeCount} episodes
            </p>
          </div>
        </div>
      )}

      {/* ---- 3-Column Poster Grid (active tab) ---- */}
      {filtered.length > 1 && (
        <section className="mt-6 px-3 pb-8">
          <div className="grid grid-cols-3 gap-2.5">
            {filtered.slice(1).map((s) => (
              <Link
                key={s.slug}
                href={`/series/${s.slug}`}
                className="block no-underline"
              >
                {/* Clean poster — no text overlay */}
                <div
                  className="relative overflow-hidden rounded-lg"
                  style={{ aspectRatio: "3 / 4" }}
                >
                  <Poster src={s.posterUrl} alt={s.title} />
                </div>

                {/* Title + genre underneath */}
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

          {filtered.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-sm" style={{ color: "#6B6B7B" }}>
                No shows in this category yet.
              </p>
            </div>
          )}
        </section>
      )}

      {/* ---- All Shows — 3-Column Poster Grid ---- */}
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
              {/* Clean poster — no text overlay */}
              <div
                className="relative overflow-hidden rounded-lg"
                style={{ aspectRatio: "3 / 4" }}
              >
                <Poster src={s.posterUrl} alt={s.title} />
              </div>

              {/* Title + genre underneath */}
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
