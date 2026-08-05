import "server-only";

import {
  APPLE_RETIRED_SERIES_PRODUCT_SLUGS,
  APPLE_SERIES_PRODUCT_IDS,
} from "@/lib/apple-iap-product-manifest";

/**
 * Product IDs are permanent App Store identifiers. Keep this derivation
 * byte-identical with the native client and never recycle an ID for another
 * title. Every paid live series is its own non-consumable so Apple can restore
 * exactly what the customer bought.
 */
export const APPLE_SERIES_PRODUCT_PREFIX = "com.verzatv.app.series.";

const APPLE_PRODUCT_ID_PATTERN = /^[A-Za-z0-9._]{1,100}$/;
const retiredSeriesSlugs = new Set<string>(
  APPLE_RETIRED_SERIES_PRODUCT_SLUGS,
);

export function isAppleSeriesProductCurrentlySellable(
  seriesSlug: string,
): boolean {
  return (
    Object.hasOwn(APPLE_SERIES_PRODUCT_IDS, seriesSlug) &&
    !retiredSeriesSlugs.has(seriesSlug)
  );
}

export function appleSeriesProductId(seriesSlug: string): string {
  const productId = (
    APPLE_SERIES_PRODUCT_IDS as Readonly<Record<string, string>>
  )[seriesSlug];
  if (
    !productId ||
    productId !==
      `${APPLE_SERIES_PRODUCT_PREFIX}${seriesSlug.replaceAll("-", "_")}` ||
    !APPLE_PRODUCT_ID_PATTERN.test(productId)
  ) {
    throw new Error(`Series has no immutable Apple product ID: ${seriesSlug}`);
  }
  return productId;
}

/** Immutable reverse lookup used for restores/refunds even after delisting. */
export function seriesSlugForAppleProductId(productId: string): string | null {
  if (
    !APPLE_PRODUCT_ID_PATTERN.test(productId) ||
    !productId.startsWith(APPLE_SERIES_PRODUCT_PREFIX)
  ) {
    return null;
  }

  const manifestEntry = Object.entries(APPLE_SERIES_PRODUCT_IDS).find(
    ([, registeredProductId]) => registeredProductId === productId,
  );
  return manifestEntry?.[0] ?? null;
}
