/**
 * Unicode folding for text matching.
 *
 * WHY THIS EXISTS
 * ---------------
 * Search matched with `haystack.toLowerCase().includes(query.toLowerCase())`.
 * `toLowerCase()` is CASE folding only — it does not decompose a character or
 * remove its combining marks. Neither side of the comparison was normalized,
 * so which spelling won was decided purely by how the string happened to be
 * typed into lib/catalog.ts, and the failure ran in BOTH directions:
 *
 *   /search?q=pasion   → 0 results   (ASCII query, accented data:
 *                                     "Sentencia de pasión")
 *   /search?q=pasión   → 1 result
 *   /search?q=espanol  → 5 results   (ASCII query, ASCII category key)
 *   /search?q=español  → 0 results   (accented query, ASCII data)
 *
 * A Spanish keyboard auto-accents. So a Spanish speaker typing the CORRECT
 * spelling of a show whose own poster reads SENTENCIA DE PASIÓN got nothing,
 * and concluded the catalogue does not carry it.
 *
 * WHY NOT \p{Diacritic}
 * ---------------------
 * The obvious fix — `.normalize("NFD").replace(/\p{Diacritic}/gu, "")` — is
 * WRONG for this catalogue and was measured to be wrong before this file was
 * written. `\p{Diacritic}` matches the Devanagari virama (U+094D) and nukta,
 * so it silently mangles Hindi:
 *
 *   "हिन्दी"    → "हिनदी"      (virama stripped — a different word)
 *   "दोस्ती"    → "दोसती"
 *
 * The Bollywood tab is six live Hindi titles. Folding must therefore be
 * restricted to the Latin combining range U+0300–U+036F ("Combining
 * Diacritical Marks"), which is exactly what Spanish, Portuguese, French,
 * German, Turkish and Polish decompose into and which no Devanagari, Arabic,
 * Thai, Han, Kana or Hangul codepoint uses.
 *
 * Verified: folding leaves "हिन्दी दिल दोसा दोस्ती", "العربية" and "ไทย"
 * byte-identical while collapsing á é í ó ú ñ ü ç ğ ł and İ.
 */

/**
 * Fold a string for accent-insensitive, case-insensitive matching.
 *
 * Apply this to BOTH the query and the indexed text. Folding one side only
 * fixes one of the two directions above and leaves the other broken.
 *
 * Order matters: lowercase first, so Turkish "İ" expands to "i" + U+0307 and
 * the combining dot is then removed by the same pass that removes accents.
 */
export function foldText(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .normalize("NFC");
}

/** Fold and collapse runs of whitespace. Used for building a haystack. */
export function foldForSearch(input: string): string {
  return foldText(input).replace(/\s+/g, " ").trim();
}
