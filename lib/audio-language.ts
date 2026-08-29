/**
 * What language a title is actually SPOKEN in.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * Nothing in the product said it. The Bollywood tab ships six live titles with
 * Hindi audio behind English title lockups — "Falling for Flatmate",
 * "Salt & Pepper", "Reset" — and neither the tile, the show page, the metadata
 * nor the stream told anyone the dialogue is in Hindi. A buyer found out after
 * paying.
 *
 * The stream does not say it either. Measured against production on
 * 2026-08-29, the Mux manifest for falling-for-flatmate E1
 * (playback id 1en6bVzn1IAnYjCOwgQDjUXuLkaoVVVc0202JLo5J7lw4) declares:
 *
 *   #EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="audio-hi-0",NAME="Default",
 *                CHANNELS="2",AUTOSELECT=YES,DEFAULT=YES,LANGUAGE="und",...
 *
 * `LANGUAGE="und"` is ISO-639-2 for "undetermined" — this is the "audio track
 * says undefined" report, and it is true of every asset in the library because
 * nothing in the ingest path ever set an input language. That tag lives in the
 * Mux asset and can only be changed by re-ingesting with credentials this
 * repository does not hold, so it is NOT fixed here (see
 * docs/remediation/handoffs.md). What is fixed here is that the PRODUCT no
 * longer takes the manifest's word for it: this module is the declared source
 * of truth, and the show page, the browse tile and the JSON-LD all read it.
 *
 * DERIVED, NOT LISTED, ON PURPOSE
 * -------------------------------
 * `lib/catalog.ts` is source-fingerprinted by
 * scripts/generate-public-mux-map.mjs — appending even a comment to it reddens
 * `npm run test:playback-security` — so a `language` field cannot be added to
 * the Series rows. Deriving from `categories` is better than a slug list
 * anyway: a hand-maintained list goes stale the moment a title is added to the
 * Bollywood tab, whereas the category IS the tab, and a title cannot appear on
 * the Bollywood tab without carrying `"bollywood"`.
 *
 * THE SEPARATE-ROWS RULE
 * ----------------------
 * Language variants stay separate catalog rows — one English, one Spanish,
 * each with its own slug, key art and Apple product. `im-having-my-professors-
 * baby-es` is a row; the English cut of the same footage sits dark in Mux
 * under `im-having-my-professors-baby_EN` because no English key art exists.
 * That decision exists to stop buyers getting the wrong language and asking
 * for their money back. Nothing in this module consolidates variants, offers a
 * toggle between them, or links one to the other. It labels what a row IS.
 */

import type { BrowseCategory } from "@/lib/catalog";
import { SERIES } from "@/lib/catalog";

/** BCP-47 tags for the languages the library actually ships. */
export type SpokenLanguage = "en" | "es" | "hi";

export interface TitleLanguage {
  /** BCP-47 tag of the spoken audio. */
  audio: SpokenLanguage;
  /**
   * BCP-47 tag of subtitles the supplier burned into the picture, when there
   * are any. Burned-in means they cannot be switched off, which is exactly why
   * a buyer needs to be told before they pay rather than after.
   */
  burnedInSubtitles?: SpokenLanguage;
}

/**
 * Tab → spoken language. The two language tabs exist BECAUSE the titles on
 * them are in those languages; everything else in the catalogue is English.
 */
const LANGUAGE_BY_CATEGORY: Partial<Record<BrowseCategory, SpokenLanguage>> = {
  espanol: "es",
  bollywood: "hi",
};

/**
 * Escape hatch for a title whose tab does not imply its language — a Hindi
 * title cross-listed into Drama, say. Empty today, and the feed-integrity
 * gate walks the whole catalogue to prove the category rule still covers
 * every live row, so this stays empty until a real exception arrives.
 */
const LANGUAGE_BY_SLUG: Record<string, TitleLanguage> = {};

type LanguageInput = {
  slug: string;
  categories: readonly BrowseCategory[];
  status?: "live" | "coming_soon";
};

/** The declared audio (and burned-in subtitle) language of one title. */
export function audioLanguageOf(series: LanguageInput): TitleLanguage {
  const override = LANGUAGE_BY_SLUG[series.slug];
  if (override) return override;

  for (const category of series.categories) {
    const audio = LANGUAGE_BY_CATEGORY[category];
    if (!audio) continue;
    /* Hindi titles ship with English subtitles burned into the picture
       (lib/catalog.ts, Bollywood section). Claim that only for rows that
       actually have footage: a coming-soon row has zero Mux streams, so
       promising a subtitle track it has never delivered is the same class of
       false claim as promising an episode count. */
    if (audio === "hi" && series.status !== "coming_soon") {
      return { audio, burnedInSubtitles: "en" };
    }
    return { audio };
  }
  return { audio: "en" };
}

/** Same, by slug. Used where only the slug is in hand (JSON-LD builders). */
export function audioLanguageForSlug(slug: string): TitleLanguage {
  const series = SERIES.find((s) => s.slug === slug);
  return series ? audioLanguageOf(series) : { audio: "en" };
}

/**
 * The value for schema.org `inLanguage` — the machine-readable half of the
 * same claim. Google, share cards and the native client all read this; before
 * it existed, every one of the 91 show pages and 2,214 prerendered episode
 * pages was silent about language, which is why a Hindi drama could be
 * surfaced to an English-only viewer with nothing to warn them.
 */
export function inLanguageForSlug(slug: string): string {
  return audioLanguageForSlug(slug).audio;
}
