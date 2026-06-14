/**
 * Calculate the season pass price at ~67% discount.
 */
export function computeSeasonPass(
  episodeCount: number,
  freeEps: number,
  coinsPerEp: number,
): number {
  const paidEpisodes = Math.max(0, episodeCount - freeEps);
  const fullPrice = paidEpisodes * coinsPerEp;
  return Math.round(fullPrice * 0.67);
}

/**
 * Format a coin amount with commas (e.g. 1500 -> "1,500").
 */
export function formatCoins(n: number): string {
  return n.toLocaleString("en-US");
}

/**
 * Format a price in cents as dollars (e.g. 499 -> "$4.99").
 */
export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
