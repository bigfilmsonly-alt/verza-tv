/* ------------------------------------------------------------------ */
/*  Hardcoded catalog — replaces Supabase until DB is connected        */
/* ------------------------------------------------------------------ */

export interface Series {
  slug: string;
  title: string;
  logline: string;
  genre: string;
  channel: string;
  episodeCount: number;
  posterUrl: string;
  freeEpisodes: number;
  coinPerEpisode: number;
  seasonPassCoins: number;
  status: "live" | "coming_soon";
}

/* seasonPassCoins = Math.round((episodeCount - 5) * 49 * 0.67) */

export const catalog: Series[] = [
  /* ---- Must-sees ---- */
  {
    slug: "the-missing-piece",
    title: "The Missing Piece",
    logline:
      "A widow discovers the stranger who saved her life is the twin of the husband she buried.",
    genre: "Mystery romance",
    channel: "Must-sees",
    episodeCount: 62,
    posterUrl: "/posters/the-missing-piece.svg",
    freeEpisodes: 5,
    coinPerEpisode: 49,
    seasonPassCoins: Math.round((62 - 5) * 49 * 0.67),
    status: "live",
  },
  {
    slug: "married-to-a-stranger",
    title: "Married to a Stranger",
    logline:
      "A contract marriage to a cold billionaire turns real the night she learns why he chose her.",
    genre: "Contract marriage",
    channel: "Must-sees",
    episodeCount: 62,
    posterUrl: "/posters/married-to-a-stranger.svg",
    freeEpisodes: 5,
    coinPerEpisode: 49,
    seasonPassCoins: Math.round((62 - 5) * 49 * 0.67),
    status: "live",
  },
  {
    slug: "on-one-condition",
    title: "On One Condition",
    logline:
      "He will save her father's company for one price — she becomes his wife for a year.",
    genre: "Billionaire romance",
    channel: "Must-sees",
    episodeCount: 62,
    posterUrl: "/posters/on-one-condition.svg",
    freeEpisodes: 5,
    coinPerEpisode: 49,
    seasonPassCoins: Math.round((62 - 5) * 49 * 0.67),
    status: "live",
  },

  /* ---- Trending ---- */
  {
    slug: "killer-romance",
    title: "Killer Romance",
    logline:
      "She falls for the bodyguard hired to protect her, not knowing he was sent to kill her.",
    genre: "Romantic thriller",
    channel: "Trending",
    episodeCount: 59,
    posterUrl: "/posters/killer-romance.svg",
    freeEpisodes: 5,
    coinPerEpisode: 49,
    seasonPassCoins: Math.round((59 - 5) * 49 * 0.67),
    status: "live",
  },
  {
    slug: "honey-gold",
    title: "Honey Gold",
    logline:
      "A broke waitress inherits an empire and the ruthless board that wants her gone.",
    genre: "Rags-to-riches romance",
    channel: "Trending",
    episodeCount: 61,
    posterUrl: "/posters/honey-gold.svg",
    freeEpisodes: 5,
    coinPerEpisode: 49,
    seasonPassCoins: Math.round((61 - 5) * 49 * 0.67),
    status: "live",
  },
  {
    slug: "revenge-on-my-cheating-fiance",
    title: "Revenge on My Cheating Fiance",
    logline:
      "Jilted at the altar, she returns one year later as her ex's new boss.",
    genre: "Revenge drama",
    channel: "Trending",
    episodeCount: 50,
    posterUrl: "/posters/revenge-on-my-cheating-fiance.svg",
    freeEpisodes: 5,
    coinPerEpisode: 49,
    seasonPassCoins: Math.round((50 - 5) * 49 * 0.67),
    status: "live",
  },

  /* ---- Drama ---- */
  {
    slug: "the-billionaires-vow",
    title: "The Billionaire's Vow",
    logline:
      "A fake engagement to settle a debt becomes a war neither can afford to win or lose.",
    genre: "Billionaire romance",
    channel: "Drama",
    episodeCount: 60,
    posterUrl: "/posters/the-billionaires-vow.svg",
    freeEpisodes: 5,
    coinPerEpisode: 49,
    seasonPassCoins: Math.round((60 - 5) * 49 * 0.67),
    status: "live",
  },
  {
    slug: "im-obsessed-with-my-boss",
    title: "I'm Obsessed with My Boss",
    logline:
      "One elevator kiss with the CEO upends the assistant's careful life.",
    genre: "Office romance",
    channel: "Drama",
    episodeCount: 50,
    posterUrl: "/posters/im-obsessed-with-my-boss.svg",
    freeEpisodes: 5,
    coinPerEpisode: 49,
    seasonPassCoins: Math.round((50 - 5) * 49 * 0.67),
    status: "live",
  },
  {
    slug: "she-is-mine",
    title: "She Is Mine",
    logline:
      "Two rival heirs discover they were promised to the same woman at birth.",
    genre: "Possessive romance",
    channel: "Drama",
    episodeCount: 60,
    posterUrl: "/posters/she-is-mine.svg",
    freeEpisodes: 5,
    coinPerEpisode: 49,
    seasonPassCoins: Math.round((60 - 5) * 49 * 0.67),
    status: "live",
  },

  /* ---- Coming Soon ---- */
  {
    slug: "the-last-cliffhanger",
    title: "The Last Cliffhanger",
    logline:
      "A screenwriter discovers her scripts are coming true — and the next one ends in murder.",
    genre: "Mystery",
    channel: "Must-sees",
    episodeCount: 0,
    posterUrl: "/posters/the-last-cliffhanger.svg",
    freeEpisodes: 5,
    coinPerEpisode: 49,
    seasonPassCoins: 0,
    status: "coming_soon",
  },
  {
    slug: "villains-table",
    title: "Villains' Table",
    logline:
      "Six reality TV villains are locked in a mansion and forced to confront who they really are.",
    genre: "Reality drama",
    channel: "Reality",
    episodeCount: 0,
    posterUrl: "/posters/villains-table.svg",
    freeEpisodes: 5,
    coinPerEpisode: 49,
    seasonPassCoins: 0,
    status: "coming_soon",
  },
  {
    slug: "studio-21",
    title: "Studio 21",
    logline:
      "Behind the camera at a failing streaming network, the real drama is who's sleeping with whom.",
    genre: "Workplace reality",
    channel: "Reality",
    episodeCount: 0,
    posterUrl: "/posters/studio-21.svg",
    freeEpisodes: 5,
    coinPerEpisode: 49,
    seasonPassCoins: 0,
    status: "coming_soon",
  },
  {
    slug: "cold-case-files",
    title: "Cold Case Files",
    logline:
      "A retired detective reopens the one case that cost her everything — her partner's unsolved murder.",
    genre: "True crime",
    channel: "Must-sees",
    episodeCount: 0,
    posterUrl: "/posters/cold-case-files.svg",
    freeEpisodes: 5,
    coinPerEpisode: 49,
    seasonPassCoins: 0,
    status: "coming_soon",
  },
  {
    slug: "wolf-moon",
    title: "Wolf Moon",
    logline:
      "In a small Appalachian town, the new veterinarian discovers the locals are hiding a supernatural secret.",
    genre: "Werewolf fantasy",
    channel: "Trending",
    episodeCount: 0,
    posterUrl: "/posters/wolf-moon.svg",
    freeEpisodes: 5,
    coinPerEpisode: 49,
    seasonPassCoins: 0,
    status: "coming_soon",
  },
  {
    slug: "second-time-around",
    title: "Second Time Around",
    logline:
      "Divorced at 40, she swore off love — until her college sweetheart moved in next door.",
    genre: "Second-chance romance",
    channel: "Drama",
    episodeCount: 0,
    posterUrl: "/posters/second-time-around.svg",
    freeEpisodes: 5,
    coinPerEpisode: 49,
    seasonPassCoins: 0,
    status: "coming_soon",
  },
  {
    slug: "rewind",
    title: "Rewind",
    logline:
      "She wakes up reliving the worst week of her life and must fix everything before time runs out.",
    genre: "Time-travel drama",
    channel: "Drama",
    episodeCount: 0,
    posterUrl: "/posters/rewind.svg",
    freeEpisodes: 5,
    coinPerEpisode: 49,
    seasonPassCoins: 0,
    status: "coming_soon",
  },
];

/* ---- Episode type ---- */

export interface Episode {
  number: number;
  title: string;
  isFree: boolean;
  unlockCoins: number;
  durationS: number;
}

/* ---- Aliases ---- */

/** Alias for catalog — used by page components */
export const SERIES = catalog;

/* ---- Helpers ---- */

export function getLiveSeries(): Series[] {
  return catalog.filter((s) => s.status === "live");
}

export function getComingSoonSeries(): Series[] {
  return catalog.filter((s) => s.status === "coming_soon");
}

export function getSeriesByChannel(channel: string): Series[] {
  return catalog.filter((s) => s.status === "live" && s.channel === channel);
}

export function getSeriesBySlug(slug: string): Series | undefined {
  return catalog.find((s) => s.slug === slug);
}

export function getSeriesByGenre(genre: string): Series[] {
  return catalog.filter(
    (s) => s.genre.toLowerCase().includes(genre.toLowerCase()),
  );
}

/* ---- Episode generators ---- */

/** Simple deterministic hash for stable pseudo-random durations. */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Generate episode objects for a series.
 * Durations are deterministic (seeded from slug + episode number).
 */
export function getEpisodesForSeries(slug: string): Episode[] {
  const series = getSeriesBySlug(slug);
  if (!series || series.episodeCount === 0) return [];

  const episodes: Episode[] = [];
  for (let i = 1; i <= series.episodeCount; i++) {
    const hash = simpleHash(`${slug}-${i}`);
    const durationS = 60 + (hash % 61); // 60-120 seconds
    const isFree = i <= series.freeEpisodes;

    episodes.push({
      number: i,
      title: `Episode ${i}`,
      isFree,
      unlockCoins: isFree ? 0 : series.coinPerEpisode,
      durationS,
    });
  }

  return episodes;
}

/**
 * Get a single episode by series slug and episode number.
 */
export function getEpisode(
  slug: string,
  episodeNumber: number,
): Episode | undefined {
  const episodes = getEpisodesForSeries(slug);
  return episodes.find((e) => e.number === episodeNumber);
}

/**
 * Format seconds as "Xm Ys".
 */
export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  if (s === 0) return `${m}m`;
  return `${m}m ${s}s`;
}
