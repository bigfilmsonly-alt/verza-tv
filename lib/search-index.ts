/**
 * Search tag index — maps each series slug to genre/theme keywords so a viewer
 * can search by a genre word ("thriller"), a theme ("revenge", "billionaire"),
 * a category, or the show name and get every matching poster.
 *
 * Tags were curated per show from its title + logline + genre. Keep them
 * lowercase. seriesMatchesQuery() below is the single matcher used by BOTH the
 * header search popover and the /search page so results stay consistent.
 */

import type { Series } from "@/lib/catalog";

export const SEARCH_TAGS: Record<string, string[]> = {
  "the-mistress-trap": ["drama", "betrayal", "affair", "cheating", "marriage", "secret", "revenge", "mistress", "honeytrap", "best friend", "love"],
  "the-dumb-billionaire-heiress-in-love": ["romance", "comedy", "billionaire", "love", "secret", "hidden-identity", "heiress", "fool", "wealthy", "drama"],
  "do-not-deceive-me": ["thriller", "romance", "marriage", "betrayal", "secret", "affair", "drama", "second wife", "deception", "mystery"],
  "collateral-hearts": ["crime", "romance", "revenge", "wedding", "boss", "ceo", "drama", "jilted", "ex", "second-chance", "love"],
  "the-billionaires-betrayal": ["betrayal", "drama", "billionaire", "marriage", "romance", "wealthy", "power", "secret", "captivity", "love"],
  "undercovered-heart": ["crime", "romance", "spy", "forbidden", "drama", "undercover", "cop", "crime lord", "secret", "love", "thriller"],
  "under-her-control": ["thriller", "marriage", "obsession", "secret", "drama", "romance", "controlling", "psychological", "captivity", "betrayal"],
  "two-worlds-apart": ["romance", "billionaire", "drama", "forbidden", "love", "heir", "street artist", "enemies-to-lovers", "wealthy", "class divide"],
  "the-blackthornes": ["drama", "family", "inheritance", "betrayal", "siblings", "dynasty", "revenge", "will", "wealthy", "power", "secret"],
  "marry-the-wrong-bride": ["romance", "wedding", "sisters", "secret", "drama", "arranged-marriage", "bride swap", "deception", "hidden-identity", "love"],
  "destined-to-be": ["romance", "billionaire", "arranged-marriage", "drama", "obsession", "heir", "love", "rivals", "possessive", "forbidden"],
  "the-day-we-got-married": ["romance", "thriller", "wedding", "marriage", "secret", "drama", "arranged-marriage", "stranger", "danger", "forbidden"],
  "the-winter-veil": ["mystery", "romance", "thriller", "murder", "drama", "heiress", "missing", "estate", "secret", "love"],
  "the-marriage-contract": ["romance", "contract", "marriage", "billionaire", "ceo", "drama", "fake-relationship", "arranged-marriage", "love", "company"],
  "the-haunted-sisters": ["mystery", "supernatural", "sisters", "family", "inheritance", "secret", "drama", "ghost", "mansion", "gothic", "haunted"],
  "the-missing-piece": ["mystery", "romance", "drama", "detective", "cold case", "secret", "love", "letter", "thriller", "fate"],

  "mysterious-murder": ["thriller", "mystery", "murder", "crime", "true-crime", "podcast", "cold-case", "killer", "suspense", "serial-killer"],
  "married-to-a-stranger": ["romance", "contract", "marriage", "billionaire", "ceo", "arranged-marriage", "fake-relationship", "secret", "love", "drama", "contract-marriage"],
  "billionaire-daughters-love-triangle": ["romance", "billionaire", "contract", "marriage", "love", "love-triangle", "arranged-marriage", "inheritance", "family", "drama", "wealthy"],
  "blood-contract": ["thriller", "romance", "bodyguard", "assassin", "secret", "betrayal", "forbidden", "love", "suspense", "drama", "hired-to-kill"],
  "cleopatra": ["drama", "rags-to-riches", "inheritance", "billionaire", "ceo", "empire", "boss", "waitress", "revenge", "family", "boardroom"],
  "im-obsessed-with-my-boss": ["romance", "boss", "ceo", "office-romance", "obsession", "love", "assistant", "forbidden", "drama", "workplace"],
  "duty-of-desire": ["romance", "forbidden", "affair", "cheating", "military", "marriage", "love", "drama", "deployed", "commanding-officer"],
  "echo-of-vengeance": ["thriller", "revenge", "wedding", "betrayal", "murder", "drama", "left-for-dead", "comeback", "suspense", "obsession"],
  "faded-threads": ["drama", "family", "secret", "betrayal", "fashion", "dynasty", "sisters", "scandal", "inheritance", "live-tv"],
  "hidden-agenda": ["thriller", "romance", "mystery", "secret", "hidden-identity", "spy", "undercover", "journalist", "forbidden", "love", "family", "investigation"],
  "hollywood-stars-fake-girlfriend": ["romance", "fake-relationship", "celebrity", "hollywood", "actress", "love", "second-chance", "drama", "a-lister", "hidden-identity"],
  "i-think-my-wife-wants-to-kill-me": ["thriller", "murder", "billionaire", "marriage", "betrayal", "mystery", "suspense", "will", "inheritance", "psychological", "drama"],
  "in-love-with-my-godfathers-daughter": ["romance", "forbidden", "mafia", "crime", "love", "obsession", "family", "drama", "don", "debt", "dangerous"],
  "love-lies-and-bloodline": ["thriller", "mystery", "family", "secret", "betrayal", "drama", "dna-test", "inheritance", "patriarch", "hidden-identity", "lies"],
  "loves-perfect-crime": ["thriller", "romance", "murder", "crime", "mystery", "detective", "suspect", "forbidden", "love", "investigation", "drama"],
  "mafia-lords-secret-love": ["romance", "mafia", "crime", "forbidden", "obsession", "secret", "love", "stepmom", "dark-romance", "family", "betrayal"],
  "married-to-my-brothers-ex": ["romance", "revenge", "marriage", "secret", "betrayal", "love", "drama", "family", "truth", "obsession", "forbidden"],

  "my-celebrity-boyfriend-killed-me": ["thriller", "mystery", "psychological", "drama", "betrayal", "secret", "obsession", "murder", "celebrity", "amnesia", "hidden-identity", "boyfriend"],
  "my-handsome-bodyguard": ["romance", "thriller", "bodyguard", "suspense", "obsession", "secret", "love", "stalker", "pop-star", "forbidden", "betrayal", "protection"],
  "never-mess-with-a-badass-girl": ["revenge", "romance", "drama", "billionaire", "ceo", "boss", "betrayal", "comeback", "underdog", "empowerment", "company", "rich"],
  "sisters-have-crush-on-the-same-man": ["romance", "drama", "family", "sisters", "love", "betrayal", "forbidden", "love-triangle", "obsession", "rivalry", "jealousy"],
  "the-billionaires-vow": ["billionaire", "drama", "romance", "love", "loyalty", "betrayal", "inheritance", "wealth", "vow", "love-triangle", "fortune", "choice"],
  "lost-and-found": ["drama", "romance", "love", "secret", "affair", "emotional", "widow", "love-letters", "grief", "hidden-past", "family", "betrayal"],
  "help-im-falling-in-love-with-my-rude-ceo": ["romance", "comedy", "ceo", "boss", "billionaire", "love", "enemies-to-lovers", "secret", "hidden-kindness", "office", "hospital", "workplace"],
  "an-affair-with-my-boss": ["romance", "affair", "boss", "drama", "secret", "hidden-identity", "office", "single-mom", "hotel", "family", "father", "forbidden"],
  "a-love-once-betrayed": ["romance", "mystery", "drama", "twins", "betrayal", "secret", "love", "hidden-identity", "widow", "second-chance", "grief", "stranger"],
  "in-her-shadow": ["thriller", "mystery", "suspense", "drama", "twins", "sisters", "betrayal", "secret", "identity", "hidden-identity", "obsession", "deception"],
  "good-for-him": ["thriller", "mystery", "drama", "marriage", "betrayal", "secret", "psychological", "affair", "lies", "husband", "suspense", "double-life"],
  "one-night-stand": ["romance", "drama", "boss", "ceo", "secret", "love", "forbidden", "one-night-stand", "workplace", "hidden-identity", "steamy", "surprise"],
  "if-only-you-were-mine": ["romance", "drama", "love", "friends-to-lovers", "forbidden", "second-chance", "confession", "childhood-friends", "longing", "secret", "slow-burn"],
  "one-night-one-forever": ["romance", "drama", "forbidden", "love", "secret", "one-night-stand", "stepbrother", "hidden-identity", "family", "surprise", "taboo"],
  "runaway-bride": ["romance", "drama", "wedding", "marriage", "love", "second-chance", "runaway", "bride", "fate", "stranger", "escape", "altar"],
  "the-billionaires-lost-love": ["billionaire", "romance", "drama", "love", "second-chance", "ceo", "empire", "obsession", "reunion", "wealth", "lost-love", "sacrifice"],

  "camouflage": ["spy", "romance", "thriller", "secret", "forbidden", "betrayal", "hidden-identity", "espionage", "diplomat", "mission", "drama"],
  "killer-romance": ["romance", "thriller", "crime", "assassin", "enemies-to-lovers", "murder", "obsession", "hitman", "blind-date", "drama"],
  "honey-gold": ["romance", "reality", "rags-to-riches", "wealth", "billionaire", "waitress", "drama", "betrayal", "family", "small-town"],
  "revenge-on-my-cheating-fiance": ["revenge", "drama", "cheating", "betrayal", "wedding", "affair", "fiance", "payback", "marriage", "love"],
  "the-escort": ["forbidden", "drama", "romance", "secret", "affair", "billionaire", "escort", "professor", "law-student", "scandal"],
  "school-hall": ["mystery", "drama", "high-school", "power-games", "academy", "teachers", "students", "secret", "thriller", "elite"],
  "conflicted-hearts": ["romance", "fake-relationship", "contract", "enemies-to-lovers", "debt", "fake-engagement", "drama", "love", "billionaire", "arranged-marriage"],
  "my-sister-stole-my-man": ["family", "drama", "sisters", "twins", "revenge", "betrayal", "wedding", "love", "cheating", "fiance"],
  "the-phoenix-conspiracy": ["thriller", "drama", "revenge", "billionaire", "mystery", "inheritance", "murder", "secret", "resurrection", "betrayal", "heiress"],
  "tangled-in-desire": ["romance", "pregnancy", "secret", "billionaire", "ceo", "one-night-stand", "drama", "hidden-identity", "boss", "steamy"],
  "the-escaping-mistress": ["romance", "drama", "obsession", "secret", "mistress", "affair", "forbidden", "billionaire", "dark-romance", "escape"],
  "the-chauffeur": ["thriller", "romance", "suspense", "betrayal", "bodyguard", "chauffeur", "secret", "spy", "drama", "obsession"],
  "twisted-fates": ["mystery", "drama", "switched-at-birth", "secret", "identity", "hidden-identity", "sisters", "betrayal", "thriller", "inheritance"],
  "the-dumb-billionaire-heiress-pt-2": ["romance", "comedy", "billionaire", "heiress", "hidden-identity", "revenge", "wealth", "enemies-to-lovers", "drama", "secret"],
  "tied-by-fate": ["supernatural", "romance", "mystery", "detective", "reincarnation", "fate", "kidnapping", "drama", "destiny", "love"],
  "the-crown": ["drama", "thriller", "mystery", "pageant", "blackmail", "beauty-queen", "revenge", "secret", "suspense", "scandal"],

  "rosy-psycho": ["thriller", "mystery", "crime", "murder", "obsession", "psychological", "serial-killer", "secret", "drama", "suspense", "femme-fatale"],
  "the-unforgettable-love": ["romance", "drama", "love", "second-chance", "amnesia", "memory-loss", "forbidden", "heartbreak", "reunion", "melodrama"],
  "why-i-did-it": ["thriller", "crime", "murder", "mystery", "confession", "drama", "secret", "betrayal", "courtroom", "suspense", "cover-up"],
  "the-ceo": ["billionaire", "ceo", "boss", "romance", "drama", "forbidden", "love", "secret", "empire", "powerful-woman", "workplace"],
  "twist-of-time": ["romance", "drama", "time-travel", "second-chance", "marriage", "revenge", "family", "sci-fi", "do-over", "past", "fate"],
  "she-is-mine": ["obsession", "drama", "betrayal", "romance", "desire", "love", "possessive", "toxic-love", "jealousy", "dark-romance"],
  "the-pendleton-secret": ["thriller", "mystery", "family", "secret", "inheritance", "drama", "dynasty", "lies", "betrayal", "fortune", "scandal"],
  "the-perfect-husband": ["drama", "betrayal", "affair", "cheating", "marriage", "secret", "double-life", "family", "husband", "second-family", "lies"],
  "trial-marriage-to-a-billionaire-s2": ["billionaire", "romance", "marriage", "contract", "drama", "love", "ex-wife", "arranged-marriage", "wealthy", "second-chance", "jealousy"],
  "the-inheritance-game": ["mystery", "thriller", "inheritance", "family", "fortune", "drama", "secret", "betrayal", "survival", "wealthy", "games"],
  "too-much-junk": ["music", "drama", "secret", "industry", "artist", "lies", "fame", "betrayal", "singer", "scandal"],
};

/**
 * Single source of truth for matching a series against a search query.
 * - Case-insensitive.
 * - Multi-word: every whitespace-separated token must match somewhere (AND),
 *   so "billionaire revenge" narrows instead of returning everything.
 * - Searches title, genre, logline, channel, categories, catalog tags, and the
 *   curated SEARCH_TAGS above.
 */
export function seriesMatchesQuery(s: Series, rawQuery: string): boolean {
  const q = rawQuery.trim().toLowerCase();
  if (q.length < 2) return false;

  const haystack = [
    s.title,
    s.genre,
    s.logline,
    s.channel,
    ...(s.categories ?? []),
    ...(s.tags ?? []),
    ...(SEARCH_TAGS[s.slug] ?? []),
  ]
    .join(" ")
    .toLowerCase();

  return q.split(/\s+/).filter(Boolean).every((token) => haystack.includes(token));
}
