"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Series } from "@/lib/catalog";
import { T } from "@/lib/theme";

/* ------------------------------------------------------------------ */
/*  Deterministic shuffle seeded by day — keeps order stable per visit */
/* ------------------------------------------------------------------ */
function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ------------------------------------------------------------------ */
/*  Fake engagement numbers (stable per slug via simple hash)          */
/* ------------------------------------------------------------------ */
function pseudoCount(slug: string, min: number, max: number): number {
  let h = 0;
  for (let i = 0; i < slug.length; i++) {
    h = (h * 31 + slug.charCodeAt(i)) | 0;
  }
  return min + (Math.abs(h) % (max - min));
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

/* ------------------------------------------------------------------ */
/*  Icon components                                                    */
/* ------------------------------------------------------------------ */
function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill={filled ? T.accent : "none"}
      stroke={filled ? T.accent : "#fff"}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#fff"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#fff"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}

function SoundIcon({ muted }: { muted: boolean }) {
  if (muted) {
    return (
      <svg
        width="26"
        height="26"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#fff"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <line x1="23" y1="9" x2="17" y2="15" />
        <line x1="17" y1="9" x2="23" y2="15" />
      </svg>
    );
  }
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#fff"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Single Short card                                                  */
/* ------------------------------------------------------------------ */
function ShortCard({
  series,
  isActive,
}: {
  series: Series;
  isActive: boolean;
}) {
  const [liked, setLiked] = useState(false);
  const [muted, setMuted] = useState(true);

  const likeCount = pseudoCount(series.slug, 800, 45_000);

  return (
    <div
      className="short-card relative w-full flex-shrink-0 overflow-hidden"
      style={{
        height: "calc(100dvh - 56px - 56px)", /* header ~56px + bottom nav ~56px */
        scrollSnapAlign: "start",
        background: T.bg,
      }}
    >
      {/* Full-bleed poster background */}
      <Image
        src={series.posterUrl}
        alt=""
        fill
        className="object-cover"
        sizes="440px"
        priority={isActive}
      />

      {/* Darken overlay for readability */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, transparent 30%, transparent 50%, rgba(0,0,0,0.75) 100%)",
        }}
      />

      {/* Top-left: small poster thumbnail + series title */}
      <div className="absolute top-3 left-3 flex items-center gap-2 z-10">
        <div
          className="relative w-9 h-12 rounded overflow-hidden flex-shrink-0"
          style={{
            border: "1.5px solid rgba(255,255,255,0.3)",
          }}
        >
          <Image
            src={series.posterUrl}
            alt={series.title}
            fill
            className="object-cover"
            sizes="36px"
          />
        </div>
        <span
          className="text-xs font-semibold drop-shadow-lg"
          style={{ color: "#fff", textShadow: "0 1px 4px rgba(0,0,0,0.7)" }}
        >
          {series.title}
        </span>
      </div>

      {/* Right rail: action icons */}
      <div className="absolute right-3 bottom-40 flex flex-col items-center gap-5 z-10">
        {/* Like */}
        <button
          className="flex flex-col items-center gap-0.5"
          onClick={() => setLiked((l) => !l)}
          aria-label={liked ? "Unlike" : "Like"}
        >
          <HeartIcon filled={liked} />
          <span
            className="text-[11px] font-medium"
            style={{ color: "#fff", textShadow: "0 1px 3px rgba(0,0,0,0.6)" }}
          >
            {formatCount(liked ? likeCount + 1 : likeCount)}
          </span>
        </button>

        {/* Add to List */}
        <button
          className="flex flex-col items-center gap-0.5"
          aria-label="Add to list"
        >
          <PlusIcon />
          <span
            className="text-[11px] font-medium"
            style={{ color: "#fff", textShadow: "0 1px 3px rgba(0,0,0,0.6)" }}
          >
            List
          </span>
        </button>

        {/* Share */}
        <button
          className="flex flex-col items-center gap-0.5"
          aria-label="Share"
        >
          <ShareIcon />
          <span
            className="text-[11px] font-medium"
            style={{ color: "#fff", textShadow: "0 1px 3px rgba(0,0,0,0.6)" }}
          >
            Share
          </span>
        </button>

        {/* Mute toggle */}
        <button
          className="flex flex-col items-center gap-0.5"
          onClick={() => setMuted((m) => !m)}
          aria-label={muted ? "Unmute" : "Mute"}
        >
          <SoundIcon muted={muted} />
          <span
            className="text-[11px] font-medium"
            style={{ color: "#fff", textShadow: "0 1px 3px rgba(0,0,0,0.6)" }}
          >
            {muted ? "Muted" : "Sound"}
          </span>
        </button>
      </div>

      {/* Bottom overlay: series info bar */}
      <div
        className="absolute bottom-0 left-0 right-0 z-10 px-4 pb-5 pt-16"
        style={{
          background:
            "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.5) 60%, transparent 100%)",
        }}
      >
        <h2
          className="text-lg font-bold leading-tight mb-1"
          style={{ color: "#fff" }}
        >
          {series.title}
        </h2>
        <p
          className="text-xs mb-3"
          style={{ color: "rgba(255,255,255,0.7)" }}
        >
          {series.genre} &middot; {series.episodeCount} episodes
        </p>
        <Link
          href={`/series/${series.slug}`}
          className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-sm font-semibold no-underline"
          style={{
            background: T.accent,
            color: "#fff",
          }}
        >
          Watch Now
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </Link>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main feed component                                                */
/* ------------------------------------------------------------------ */
export default function ShortsFeed({ series }: { series: Series[] }) {
  const [shuffled, setShuffled] = useState<Series[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  /* Shuffle once on mount (client only) */
  useEffect(() => {
    setShuffled(shuffleArray(series));
  }, [series]);

  /* Track which card is active via IntersectionObserver */
  const observerCallback = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const idx = Number(entry.target.getAttribute("data-index"));
          if (!Number.isNaN(idx)) setActiveIndex(idx);
        }
      }
    },
    [],
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container || shuffled.length === 0) return;

    const observer = new IntersectionObserver(observerCallback, {
      root: container,
      threshold: 0.6,
    });

    const cards = container.querySelectorAll(".short-card");
    cards.forEach((card) => observer.observe(card));

    return () => observer.disconnect();
  }, [shuffled, observerCallback]);

  if (shuffled.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className="w-full overflow-y-auto"
      style={{
        height: "calc(100dvh - 56px - 56px)",
        scrollSnapType: "y mandatory",
        WebkitOverflowScrolling: "touch",
        background: T.bg,
      }}
    >
      {shuffled.map((s, i) => (
        <div key={s.slug} data-index={i}>
          <ShortCard series={s} isActive={i === activeIndex} />
        </div>
      ))}
    </div>
  );
}
