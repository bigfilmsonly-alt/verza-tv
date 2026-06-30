"use client";

import { useState } from "react";
import Image from "next/image";
import { T } from "@/lib/theme";
import { useTranslation } from "@/components/LangProvider";
import { createBrowserClient } from "@supabase/ssr";
import { emit } from "@/lib/analytics";

interface CoinPaywallProps {
  posterUrl: string;
  unlockCoins: number;
  seasonPassCoins: number;
  seriesSlug: string;
  episodeNumber: number;
}

export default function CoinPaywall({
  posterUrl,
  seriesSlug,
  episodeNumber,
}: CoinPaywallProps) {
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  async function handleUnlock() {
    setLoading(true);
    try {
      // Check if user is signed in first
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      );
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        // Redirect to sign-in, then back to this episode after login
        window.location.href = `/sign-in?next=/series/${seriesSlug}/${episodeNumber}`;
        return;
      }

      // Intent signal — tapped buy, heading to Stripe (no revenue from client).
      emit("checkout_started", {
        show_id: seriesSlug,
        episode_number: episodeNumber,
        plan_type: "series_unlock",
        surface: "coin_paywall",
      });

      const res = await fetch("/api/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seriesSlug }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Unlock error:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative mx-4 rounded-2xl overflow-hidden" style={{ backgroundColor: "#07070E" }}>
      <div className="relative" style={{ aspectRatio: "9 / 16" }}>
        {posterUrl ? (
          <Image
            src={posterUrl}
            alt="Locked episode"
            fill
            priority
            sizes="(max-width: 440px) 100vw, 440px"
            className="object-cover"
            style={{ filter: "brightness(0.25) blur(2px)" }}
          />
        ) : (
          <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, #1A1A26, #07070E)" }} />
        )}

        <div
          className="absolute inset-0"
          style={{ background: "radial-gradient(ellipse at center, rgba(7,7,14,0.6) 0%, rgba(7,7,14,0.85) 100%)" }}
        />

        <div className="absolute inset-0 flex flex-col items-center justify-center px-6">
          {/* Lock icon */}
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mb-5"
            style={{ background: `${T.accent}22`, border: `2px solid ${T.accent}66` }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={T.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>

          <p className="text-sm font-medium mb-1" style={{ color: T.textDim }}>
            {t("content.episodeLocked").replace("{n}", String(episodeNumber))}
          </p>

          <p className="text-xs mb-6 text-center" style={{ color: T.textMute }}>
            {t("content.unlockPrompt")}
          </p>

          {/* Direct pricing — $1.99 Summer Sale */}
          <button
            onClick={handleUnlock}
            disabled={loading}
            className="w-full max-w-[280px] flex items-center justify-center gap-2 rounded-full py-3.5 text-sm font-bold mb-3 transition-transform active:scale-[0.97] border-0 cursor-pointer"
            style={{ background: T.accent, color: T.text, opacity: loading ? 0.7 : 1 }}
          >
            {loading ? (
              <div className="w-5 h-5 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: "#fff", borderRightColor: "#fff" }} />
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                  <line x1="1" y1="10" x2="23" y2="10" />
                </svg>
                {t("content.unlockSeries")} — $1.99
              </>
            )}
          </button>

          {/* Sale badge */}
          <div
            className="flex items-center gap-2 px-4 py-2 rounded-full mb-4"
            style={{ background: "rgba(255,255,255,0.06)" }}
          >
            <span className="text-xs" style={{ color: T.textMute }}>{t("content.oneTimePayment")}</span>
            <span style={{ color: T.textMute }}>&middot;</span>
            <span className="text-xs font-semibold" style={{ color: T.success ?? "#22c55e" }}>{t("content.allEpisodesIncluded")}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
