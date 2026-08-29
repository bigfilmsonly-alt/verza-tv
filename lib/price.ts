/**
 * Client-safe canonical price for the Series Unlock.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * `SERIES_UNLOCK_PRICE_CENTS` lives in `lib/series-purchase.ts`, which starts
 * with `import "server-only"` — a client component that imports it fails the
 * build. So every price the viewer actually SEES was a hard-coded string
 * literal: "$1.99" appears verbatim in `components/EpisodeFeed.tsx` (twice),
 * `app/series/[slug]/page.tsx`, and two dead components. Nothing connected the
 * number on the paywall to the number Stripe charges, and nothing would have
 * failed if they diverged.
 *
 * This module is the one number the client is allowed to render.
 * `npm run test:feed-integrity` asserts it equals the server constant, so a
 * price change in one file and not the other fails the gate instead of
 * shipping a paywall that advertises the wrong amount.
 *
 * AGENTS.md rule 4 still binds: this is a DISPLAY value. It never authorizes
 * anything. `/api/unlock` reads the server constant and Stripe is charged from
 * there; `/api/unlock/confirm` re-validates the amount against the same server
 * constant on the way back.
 */

/** Canonical Series Unlock price, in minor units of SERIES_UNLOCK_CURRENCY. */
export const SERIES_UNLOCK_PRICE_CENTS = 199;

/**
 * ISO-4217 currency of the canonical price. The Stripe line item is created
 * with `currency: "usd"` (app/api/unlock/route.ts) for every buyer in every
 * locale, so this must stay USD. Localization changes how the amount is
 * WRITTEN, never which currency is charged — showing "1,99 €" to a Spanish
 * viewer whose card is debited $1.99 is a refund, not a translation.
 */
export const SERIES_UNLOCK_CURRENCY = "USD";

/**
 * Format the Series Unlock price for a locale.
 *
 * `Intl.NumberFormat` places the symbol, the grouping and the decimal
 * separator the way the language does, and — this is the part that matters for
 * a US-priced product sold worldwide — it disambiguates the dollar sign on its
 * own: "$1.99" in English, "1,99 US$" in Spanish, "US$ 1,99" in Portuguese.
 * The English output is byte-identical to the literal it replaces.
 */
export function formatSeriesUnlockPrice(locale: string): string {
  return formatMoney(locale, SERIES_UNLOCK_PRICE_CENTS, SERIES_UNLOCK_CURRENCY);
}

/** Locale-aware money formatting with a hard English fallback. */
export function formatMoney(
  locale: string,
  cents: number,
  currency: string = SERIES_UNLOCK_CURRENCY,
): string {
  const amount = cents / 100;
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    /* An unrecognised locale tag must never blank the price on the one screen
       that asks for money. Fall back to the canonical English rendering. */
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }
}
