/* ------------------------------------------------------------------ */
/*  Full catalog — 37 live series + coming soon                        */
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

function sp(eps: number) {
  return Math.round((eps - 5) * 49 * 0.67);
}

export const catalog: Series[] = [
  /* ================================================================ */
  /*  MUST-SEES                                                        */
  /* ================================================================ */
  {
    slug: "a-love-once-betrayed",
    title: "A Love Once Betrayed",
    logline: "A widow discovers the stranger who saved her life is the twin of the husband she buried.",
    genre: "Mystery romance",
    channel: "Must-sees",
    episodeCount: 62,
    posterUrl: "/posters/a-love-once-betrayed.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(62), status: "live",
  },
  {
    slug: "married-to-a-stranger",
    title: "Married to a Stranger",
    logline: "A contract marriage to a cold billionaire turns real the night she learns why he chose her.",
    genre: "Contract marriage",
    channel: "Must-sees",
    episodeCount: 62,
    posterUrl: "/posters/married-to-a-stranger.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(62), status: "live",
  },
  {
    slug: "billionaire-daughters-love-triangle",
    title: "Billionaire Daughter's Love Triangle",
    logline: "He will save her father's company for one price — she becomes his wife for a year.",
    genre: "Billionaire romance",
    channel: "Must-sees",
    episodeCount: 62,
    posterUrl: "/posters/billionaire-daughters-love-triangle.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(62), status: "live",
  },
  {
    slug: "blood-contract",
    title: "Blood Contract",
    logline: "She falls for the bodyguard hired to protect her, not knowing he was sent to kill her.",
    genre: "Romantic thriller",
    channel: "Must-sees",
    episodeCount: 59,
    posterUrl: "/posters/blood-contract.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(59), status: "live",
  },
  {
    slug: "cleopatra",
    title: "Cleopatra",
    logline: "A broke waitress inherits an empire and the ruthless board that wants her gone.",
    genre: "Rags-to-riches drama",
    channel: "Must-sees",
    episodeCount: 61,
    posterUrl: "/posters/cleopatra.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(61), status: "live",
  },
  {
    slug: "collateral-hearts",
    title: "Collateral Hearts",
    logline: "Jilted at the altar, she returns one year later as her ex's new boss.",
    genre: "Revenge drama",
    channel: "Must-sees",
    episodeCount: 50,
    posterUrl: "/posters/collateral-hearts.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(50), status: "live",
  },

  /* ================================================================ */
  /*  TRENDING                                                         */
  /* ================================================================ */
  {
    slug: "conflicted-hearts",
    title: "Conflicted Hearts",
    logline: "A fake engagement to settle a debt becomes a war neither can afford to win or lose.",
    genre: "Billionaire romance",
    channel: "Trending",
    episodeCount: 60,
    posterUrl: "/posters/conflicted-hearts.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(60), status: "live",
  },
  {
    slug: "im-obsessed-with-my-boss",
    title: "I'm Obsessed with My Boss",
    logline: "One elevator kiss with the CEO upends the assistant's careful life.",
    genre: "Office romance",
    channel: "Trending",
    episodeCount: 50,
    posterUrl: "/posters/im-obsessed-with-my-boss.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(50), status: "live",
  },
  {
    slug: "destined-to-be",
    title: "Destined to Be",
    logline: "Two rival heirs discover they were promised to the same woman at birth.",
    genre: "Possessive romance",
    channel: "Trending",
    episodeCount: 60,
    posterUrl: "/posters/destined-to-be.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(60), status: "live",
  },
  {
    slug: "do-not-deceive-me",
    title: "Do Not Deceive Me",
    logline: "She married the love of her life — then found his other wife living two floors up.",
    genre: "Betrayal drama",
    channel: "Trending",
    episodeCount: 55,
    posterUrl: "/posters/do-not-deceive-me.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(55), status: "live",
  },
  {
    slug: "duty-of-desire",
    title: "Duty of Desire",
    logline: "A military wife falls for her husband's commanding officer while he's deployed overseas.",
    genre: "Forbidden romance",
    channel: "Trending",
    episodeCount: 58,
    posterUrl: "/posters/duty-of-desire.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(58), status: "live",
  },
  {
    slug: "echo-of-vengeance",
    title: "Echo of Vengeance",
    logline: "She was left for dead on her wedding night. Now she's back — and everyone will pay.",
    genre: "Revenge thriller",
    channel: "Trending",
    episodeCount: 56,
    posterUrl: "/posters/echo-of-vengeance.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(56), status: "live",
  },

  /* ================================================================ */
  /*  DRAMA                                                            */
  /* ================================================================ */
  {
    slug: "an-affair-with-my-boss",
    title: "An Affair with My Boss",
    logline: "A single mom takes a night job at a hotel and discovers her new boss is the father who vanished.",
    genre: "Office romance",
    channel: "Drama",
    episodeCount: 52,
    posterUrl: "/posters/an-affair-with-my-boss.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(52), status: "live",
  },
  {
    slug: "faded-threads",
    title: "Faded Threads",
    logline: "A fashion dynasty crumbles when the eldest daughter leaks the family's darkest secrets on live TV.",
    genre: "Family drama",
    channel: "Drama",
    episodeCount: 48,
    posterUrl: "/posters/faded-threads.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(48), status: "live",
  },
  {
    slug: "good-for-him",
    title: "Good for Him",
    logline: "After twenty years of marriage, she realizes the perfect husband is living a perfect lie.",
    genre: "Psychological drama",
    channel: "Drama",
    episodeCount: 50,
    posterUrl: "/posters/good-for-him.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(50), status: "live",
  },
  {
    slug: "help-im-falling-in-love-with-my-rude-ceo",
    title: "Help! I'm Falling in Love with My Rude CEO",
    logline: "Her new boss humiliates her daily — but every night he secretly pays her mother's hospital bills.",
    genre: "Office romance",
    channel: "Drama",
    episodeCount: 65,
    posterUrl: "/posters/help-im-falling-in-love-with-my-rude-ceo.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(65), status: "live",
  },
  {
    slug: "hidden-agenda",
    title: "Hidden Agenda",
    logline: "An undercover journalist infiltrates a powerful family and falls for the son she's investigating.",
    genre: "Romantic thriller",
    channel: "Drama",
    episodeCount: 54,
    posterUrl: "/posters/hidden-agenda.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(54), status: "live",
  },
  {
    slug: "hollywood-stars-fake-girlfriend",
    title: "Hollywood Star's Fake Girlfriend",
    logline: "A struggling actress is hired to play an A-lister's girlfriend — then the cameras stop rolling and the feelings don't.",
    genre: "Celebrity romance",
    channel: "Drama",
    episodeCount: 60,
    posterUrl: "/posters/hollywood-stars-fake-girlfriend.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(60), status: "live",
  },
  {
    slug: "i-think-my-wife-wants-to-kill-me",
    title: "I Think My Wife Wants to Kill Me",
    logline: "A billionaire notices small, lethal coincidences after changing his will — and his wife is always nearby.",
    genre: "Psychological thriller",
    channel: "Drama",
    episodeCount: 52,
    posterUrl: "/posters/i-think-my-wife-wants-to-kill-me.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(52), status: "live",
  },

  /* ================================================================ */
  /*  ROMANCE                                                          */
  /* ================================================================ */
  {
    slug: "if-only-you-were-mine",
    title: "If Only You Were Mine",
    logline: "Best friends since childhood, they swore never to cross the line — until one drunken confession changed everything.",
    genre: "Friends-to-lovers",
    channel: "Romance",
    episodeCount: 58,
    posterUrl: "/posters/if-only-you-were-mine.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(58), status: "live",
  },
  {
    slug: "in-her-shadow",
    title: "In Her Shadow",
    logline: "A woman discovers her twin sister has been living her life — dating her boyfriend, working her job — for months.",
    genre: "Suspense drama",
    channel: "Romance",
    episodeCount: 50,
    posterUrl: "/posters/in-her-shadow.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(50), status: "live",
  },
  {
    slug: "in-love-with-my-godfathers-daughter",
    title: "In Love with My Godfather's Daughter",
    logline: "He owes the Don everything. Falling for his daughter is the one debt that could cost him his life.",
    genre: "Forbidden romance",
    channel: "Romance",
    episodeCount: 55,
    posterUrl: "/posters/in-love-with-my-godfathers-daughter.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(55), status: "live",
  },
  {
    slug: "lost-and-found",
    title: "Lost and Found",
    logline: "A widow finds love letters in her late husband's attic — addressed to someone he never stopped loving.",
    genre: "Emotional drama",
    channel: "Romance",
    episodeCount: 48,
    posterUrl: "/posters/lost-and-found.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(48), status: "live",
  },
  {
    slug: "love-lies-and-bloodline",
    title: "Love, Lies and Bloodline",
    logline: "A DNA test reveals the family patriarch is not who he claims — and someone in the house already knew.",
    genre: "Family thriller",
    channel: "Romance",
    episodeCount: 56,
    posterUrl: "/posters/love-lies-and-bloodline.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(56), status: "live",
  },
  {
    slug: "loves-perfect-crime",
    title: "Love's Perfect Crime",
    logline: "A detective falls for the prime suspect in a murder case — and the evidence keeps pointing back to her.",
    genre: "Romantic thriller",
    channel: "Romance",
    episodeCount: 54,
    posterUrl: "/posters/loves-perfect-crime.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(54), status: "live",
  },

  /* ================================================================ */
  /*  THRILLER                                                         */
  /* ================================================================ */
  {
    slug: "mafia-lords-secret-love",
    title: "Mafia Lord's Son Has a Secret Love for His Stepmom",
    logline: "In a crime family where loyalty is blood, his forbidden obsession could start a war.",
    genre: "Dark romance",
    channel: "Thriller",
    episodeCount: 60,
    posterUrl: "/posters/mafia-lords-secret-love.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(60), status: "live",
  },
  {
    slug: "married-to-my-brothers-ex",
    title: "Married to My Brother's Ex",
    logline: "He married her to get revenge on his brother. She married him to get closer to the truth.",
    genre: "Revenge romance",
    channel: "Thriller",
    episodeCount: 52,
    posterUrl: "/posters/married-to-my-brothers-ex.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(52), status: "live",
  },
  {
    slug: "marry-the-wrong-bride",
    title: "Marry the Wrong Bride",
    logline: "On her sister's wedding day, she takes her place at the altar — and the groom knows.",
    genre: "Deception romance",
    channel: "Thriller",
    episodeCount: 55,
    posterUrl: "/posters/marry-the-wrong-bride.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(55), status: "live",
  },
  {
    slug: "mistress-trap",
    title: "Mistress Trap",
    logline: "She set a honeytrap to catch her husband cheating. She didn't expect the other woman to be her best friend.",
    genre: "Betrayal drama",
    channel: "Thriller",
    episodeCount: 48,
    posterUrl: "/posters/mistress-trap.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(48), status: "live",
  },
  {
    slug: "my-celebrity-boyfriend-killed-me",
    title: "My Celebrity Boyfriend Killed Me",
    logline: "She wakes up in a hospital with no memory — and her famous boyfriend is telling the world she's dead.",
    genre: "Psychological thriller",
    channel: "Thriller",
    episodeCount: 50,
    posterUrl: "/posters/my-celebrity-boyfriend-killed-me.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(50), status: "live",
  },
  {
    slug: "my-handsome-bodyguard",
    title: "My Handsome Bodyguard",
    logline: "A pop star hires a bodyguard to protect her from a stalker. The stalker knows things only the bodyguard would.",
    genre: "Romantic suspense",
    channel: "Thriller",
    episodeCount: 58,
    posterUrl: "/posters/my-handsome-bodyguard.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(58), status: "live",
  },

  /* ================================================================ */
  /*  REALITY / MISC                                                   */
  /* ================================================================ */
  {
    slug: "my-sister-stole-my-man",
    title: "My Sister Stole My Man",
    logline: "Twin sisters. One fiance. The wrong twin said yes — and the right one wants blood.",
    genre: "Family drama",
    channel: "Reality",
    episodeCount: 46,
    posterUrl: "/posters/my-sister-stole-my-man.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(46), status: "live",
  },
  {
    slug: "mysterious-murder",
    title: "Mysterious Murder",
    logline: "A true-crime podcaster reopens a cold case and realizes the killer has been listening to every episode.",
    genre: "Crime thriller",
    channel: "Reality",
    episodeCount: 52,
    posterUrl: "/posters/mysterious-murder.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(52), status: "live",
  },
  {
    slug: "never-mess-with-a-badass-girl",
    title: "Never Mess with a Badass Girl",
    logline: "They underestimated the quiet girl from the wrong side of town. Now she owns the company that fired her.",
    genre: "Revenge romance",
    channel: "Reality",
    episodeCount: 55,
    posterUrl: "/posters/never-mess-with-a-badass-girl.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(55), status: "live",
  },
  {
    slug: "one-night-one-forever",
    title: "One Night One Forever",
    logline: "A one-night stand with a stranger becomes a lifetime when she discovers he's her new stepbrother.",
    genre: "Forbidden romance",
    channel: "Reality",
    episodeCount: 50,
    posterUrl: "/posters/one-night-one-forever.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(50), status: "live",
  },
  {
    slug: "the-producer",
    title: "The Producer",
    logline: "Behind every hit show is a producer willing to do anything — including destroy the people who made him.",
    genre: "Industry drama",
    channel: "Reality",
    episodeCount: 60,
    posterUrl: "/posters/the-producer.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(60), status: "live",
  },

  /* ================================================================ */
  /*  COMING SOON                                                      */
  /* ================================================================ */
  {
    slug: "im-obsessed-with-my-boss-2",
    title: "I'm Obsessed with My Boss Part II",
    logline: "She thought leaving the company would end it. He followed her to the new one.",
    genre: "Office romance",
    channel: "Drama",
    episodeCount: 0,
    posterUrl: "/posters/im-obsessed-with-my-boss-2.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: 0, status: "coming_soon",
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

export function getChannels(): string[] {
  const channels = new Set(catalog.filter((s) => s.status === "live").map((s) => s.channel));
  return Array.from(channels);
}

/* ---- Episode generators ---- */

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getEpisodesForSeries(slug: string): Episode[] {
  const series = getSeriesBySlug(slug);
  if (!series || series.episodeCount === 0) return [];

  const episodes: Episode[] = [];
  for (let i = 1; i <= series.episodeCount; i++) {
    const hash = simpleHash(`${slug}-${i}`);
    const durationS = 60 + (hash % 61);
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

export function getEpisode(
  slug: string,
  episodeNumber: number,
): Episode | undefined {
  const episodes = getEpisodesForSeries(slug);
  return episodes.find((e) => e.number === episodeNumber);
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  if (s === 0) return `${m}m`;
  return `${m}m ${s}s`;
}
