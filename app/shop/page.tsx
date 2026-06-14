import type { Metadata } from "next";
import { T } from "@/lib/theme";
import { BRAND, COIN_PACKS, FREE_EPISODES } from "@/lib/config";
import { formatPrice } from "@/lib/coins";

export const metadata: Metadata = {
  title: `Coin Shop | ${BRAND.name}`,
  description:
    "Buy coins to unlock premium micro-drama episodes on Verza TV. Starter packs from $1.99.",
};

export default function ShopPage() {
  return (
    <section className="px-4 pt-6 pb-8">
      <h1
        className="text-2xl font-bold mb-2"
        style={{ color: T.text }}
      >
        Coin Shop
      </h1>
      <p className="text-sm mb-6" style={{ color: T.textMute }}>
        Buy coins to unlock episodes. The first {FREE_EPISODES} episodes of
        every series are always free.
      </p>

      {/* Current Balance */}
      <div
        className="rounded-xl p-4 mb-6 flex items-center justify-between"
        style={{
          background: `linear-gradient(135deg, ${T.coin}11, ${T.coin}22)`,
          border: `1px solid ${T.coin}33`,
        }}
      >
        <div>
          <p
            className="text-xs font-medium uppercase tracking-wider"
            style={{ color: T.coin }}
          >
            Your Balance
          </p>
          <p
            className="text-2xl font-bold"
            style={{ color: T.coin }}
          >
            0
          </p>
        </div>
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill={T.coin}
          stroke="none"
        >
          <circle cx="12" cy="12" r="10" opacity="0.2" />
          <circle cx="12" cy="12" r="7" opacity="0.4" />
          <text
            x="12"
            y="16"
            textAnchor="middle"
            fontSize="10"
            fontWeight="bold"
            fill={T.coin}
          >
            C
          </text>
        </svg>
      </div>

      {/* Coin Packs */}
      <div className="flex flex-col gap-3">
        {COIN_PACKS.map((pack) => {
          const isPopular = "popular" in pack && pack.popular;
          const isBestValue = "bestValue" in pack && pack.bestValue;

          return (
            <div
              key={pack.id}
              className="relative rounded-xl p-4"
              style={{
                background: T.surface,
                border: isPopular
                  ? `1px solid ${T.accent}44`
                  : isBestValue
                    ? `1px solid ${T.coin}44`
                    : `1px solid ${T.line}`,
              }}
            >
              {/* Badge */}
              {isPopular && (
                <span
                  className="absolute -top-2.5 right-4 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full"
                  style={{
                    background: T.accent,
                    color: "#fff",
                  }}
                >
                  Most Popular
                </span>
              )}
              {isBestValue && (
                <span
                  className="absolute -top-2.5 right-4 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full"
                  style={{
                    background: T.coin,
                    color: T.bg,
                  }}
                >
                  Best Value
                </span>
              )}

              <div className="flex items-center justify-between">
                <div>
                  <p
                    className="text-base font-semibold"
                    style={{ color: T.text }}
                  >
                    {pack.label}
                  </p>
                  <p className="text-sm mt-0.5">
                    <span style={{ color: T.coin }}>
                      {pack.coins.toLocaleString()} coins
                    </span>
                    {pack.bonus > 0 && (
                      <span
                        className="ml-1.5 text-xs"
                        style={{ color: T.success }}
                      >
                        +{pack.bonus} bonus
                      </span>
                    )}
                  </p>
                </div>
                <button
                  className="px-4 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90"
                  style={{
                    background: isPopular
                      ? T.accent
                      : isBestValue
                        ? T.coin
                        : T.raised,
                    color:
                      isPopular
                        ? "#fff"
                        : isBestValue
                          ? T.bg
                          : T.text,
                  }}
                >
                  {formatPrice(pack.price)}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Info footer */}
      <div className="mt-8 text-center">
        <p className="text-xs" style={{ color: T.textMute }}>
          Coins never expire. Purchases are non-refundable.
        </p>
      </div>
    </section>
  );
}
