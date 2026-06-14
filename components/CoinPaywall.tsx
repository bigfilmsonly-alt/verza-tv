"use client";

import Image from "next/image";
import Link from "next/link";
import { T } from "@/lib/theme";
import { formatCoins } from "@/lib/coins";

interface CoinPaywallProps {
  posterUrl: string;
  unlockCoins: number;
  seasonPassCoins: number;
  seriesSlug: string;
  episodeNumber: number;
}

export default function CoinPaywall({
  posterUrl,
  unlockCoins,
  seasonPassCoins,
  seriesSlug,
  episodeNumber,
}: CoinPaywallProps) {
  return (
    <div className="relative mx-4 rounded-2xl overflow-hidden">
      {/* Dimmed poster background */}
      <div className="relative" style={{ aspectRatio: "9 / 16" }}>
        <Image
          src={posterUrl}
          alt="Locked episode"
          fill
          sizes="(max-width: 440px) 100vw, 440px"
          className="object-cover"
          style={{ filter: "brightness(0.25) blur(2px)" }}
        />

        {/* Dark overlay */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(7,7,14,0.6) 0%, rgba(7,7,14,0.85) 100%)",
          }}
        />

        {/* Lock content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6">
          {/* Lock icon */}
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mb-5"
            style={{
              background: `${T.accent}22`,
              border: `2px solid ${T.accent}66`,
            }}
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke={T.accent}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>

          {/* Episode locked text */}
          <p
            className="text-sm font-medium mb-1"
            style={{ color: T.textDim }}
          >
            Episode {episodeNumber} is locked
          </p>

          {/* Coin balance */}
          <div
            className="flex items-center gap-1.5 mb-6 px-3 py-1 rounded-full"
            style={{ background: "rgba(255,255,255,0.06)" }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill={T.coin}
              stroke="none"
            >
              <circle cx="12" cy="12" r="10" />
            </svg>
            <span
              className="text-xs font-semibold"
              style={{ color: T.coin }}
            >
              0 coins
            </span>
          </div>

          {/* Unlock button */}
          <button
            className="w-full max-w-[260px] flex items-center justify-center gap-2 rounded-full py-3 text-sm font-bold mb-3 transition-transform active:scale-[0.97]"
            style={{
              background: T.accent,
              color: T.text,
            }}
            onClick={() => {
              // TODO: Implement coin unlock flow
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill={T.coin}
              stroke="none"
            >
              <circle cx="12" cy="12" r="10" />
            </svg>
            Unlock for {unlockCoins} coins
          </button>

          {/* Season pass link */}
          <Link
            href={`/series/${seriesSlug}`}
            className="text-xs font-medium no-underline mb-4 transition-colors"
            style={{ color: T.textDim }}
          >
            Or get Season Pass &mdash;{" "}
            <span style={{ color: T.coin }}>{formatCoins(seasonPassCoins)} coins</span>
          </Link>

          {/* Get Coins button */}
          <Link
            href="/shop"
            className="flex items-center justify-center gap-1.5 rounded-full px-6 py-2 text-xs font-semibold no-underline transition-transform active:scale-[0.97]"
            style={{
              background: "rgba(255,255,255,0.08)",
              color: T.text,
              border: `1px solid ${T.line}`,
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke={T.coin}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
            Get Coins
          </Link>
        </div>
      </div>
    </div>
  );
}
