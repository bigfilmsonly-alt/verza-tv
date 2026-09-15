"use client";

import Image from "next/image";
import { useTranslation } from "@/components/LangProvider";
import { purchaseCopy } from "@/lib/purchase-copy";
import { SERIES_UNLOCK_PRICE_CENTS } from "@/lib/price";
import { T } from "@/lib/theme";

/**
 * The purchase-intent header on /sign-in.
 *
 * The viewer got here by tapping "Unlock All Episodes" on a story they were in
 * the middle of. Before this existed, the very next thing they saw was a
 * generic account page offering to help them "track your library", with no
 * title, no price and no explanation of why signing in had anything to do with
 * the thing they just tried to buy. That is where purchase intent went to die.
 *
 * A Client Component because locale is resolved in the browser: LangProvider
 * reads localStorage and navigator.languages in an effect, so the server cannot
 * know which of the 20 languages to render. Props are plain serializable values
 * looked up from the catalog on the server.
 */
export default function PurchaseIntentCard({
  title,
  posterUrl,
  episodeCount,
}: {
  title: string;
  posterUrl: string;
  episodeCount: number;
}) {
  const { locale, formatPrice } = useTranslation();
  const price = formatPrice(SERIES_UNLOCK_PRICE_CENTS);

  return (
    <div lang={locale} dir={locale === "ar" ? "rtl" : undefined} className="mb-7">
      <h1 className="text-2xl font-black text-center tracking-tight mb-1" style={{ color: T.text }}>
        {purchaseCopy(locale, "oneStepAway")}
      </h1>
      <p className="text-sm text-center mb-5" style={{ color: T.textDim }}>
        {purchaseCopy(locale, "signInToUnlockRest")}
      </p>

      {/* The story itself, carried across the auth hop. */}
      <div
        className="flex items-center gap-3.5 rounded-2xl p-3"
        style={{ background: T.surface, border: `1px solid ${T.line}` }}
      >
        <Image
          src={posterUrl}
          alt=""
          width={56}
          height={84}
          className="rounded-lg object-cover shrink-0"
          style={{ width: 56, height: 84 }}
        />
        <div className="min-w-0">
          <p className="text-[15px] font-bold leading-snug mb-1" style={{ color: T.text }}>
            {title}
          </p>
          <p className="text-[13px] leading-snug" style={{ color: T.textDim }}>
            {purchaseCopy(locale, "unlockAllCount", { count: episodeCount })}
          </p>
          <p className="text-[13px] font-semibold mt-0.5" style={{ color: T.text }}>
            {purchaseCopy(locale, "oneTimeWithPrice", { price })}
          </p>
        </div>
      </div>

      {/* Sign-in is a step in the purchase, not a detour. Saying so is the
          whole reason the viewer keeps going. */}
      <p className="text-[12px] text-center mt-3.5 leading-relaxed" style={{ color: T.textMute }}>
        {purchaseCopy(locale, "continueToCheckout")}
      </p>
    </div>
  );
}
