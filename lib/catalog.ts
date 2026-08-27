/* ------------------------------------------------------------------ */
/*  Full catalog — live series + coming soon                            */
/* ------------------------------------------------------------------ */

import { MUX_MAP } from "./mux-public-map";

export type BrowseCategory =
  | "drama"
  | "new"
  | "popular"
  | "tubi"
  | "anime"
  | "espanol"
  | "bollywood"
  | "creators"
  | "music"
  | "reality"
  | "red-carpet";

export const BROWSE_TABS: { key: BrowseCategory; label: string }[] = [
  { key: "drama", label: "Drama" },
  { key: "popular", label: "Hot" },
  // Tubi — authorized partner (signed contract). The web tab renders the Tubi
  // logo and a sponsored outbound partner spotlight; it does not expose Tubi
  // playback capabilities inside Verza.
  { key: "tubi", label: "Tubi" },
  // Anime, Español, Bollywood and Creators launch in a "Coming Soon" state: no
  // series carry these categories yet, so getSeriesByCategory() returns [] and
  // BrowsePage shows the branded placeholder. Adding live Series with the matching
  // category (e.g. categories: ["bollywood"]) later renders them in the standard grid.
  { key: "anime", label: "Anime" },
  { key: "espanol", label: "Español" },
  { key: "bollywood", label: "Bollywood" },
  // Reality before Creators — owner-specified tab order. scripts/audit-perf.ts
  // asserts this exact sequence so it cannot silently drift again.
  { key: "reality", label: "Reality" },
  { key: "creators", label: "Creators" },
  { key: "red-carpet", label: "Red Carpet" },
  { key: "music", label: "Music" },
];

export type PosterMood =
  | "ballroom" | "noir" | "rose" | "sunset" | "ice"
  | "blood" | "emerald" | "violet" | "gold" | "storage";

export interface Series {
  slug: string;
  title: string;
  logline: string;
  genre: string;
  channel: string;
  categories: BrowseCategory[];
  popularRank?: number;
  episodeCount: number;
  posterUrl: string;
  freeEpisodes: number;
  coinPerEpisode: number;
  seasonPassCoins: number;
  status: "live" | "coming_soon";
  /* Rich detail fields */
  description?: string;
  cast?: string[];
  tags?: string[];
  rating?: number;
  year?: number;
  posterMood?: PosterMood;
}

function sp(eps: number) {
  return Math.round((eps - 5) * 49 * 0.67);
}

export const catalog: Series[] = [
  /* ================================================================ */
  /*  #1 HIGHEST CONVERTING — first hero slide on Discover              */
  /* ================================================================ */
  {
    slug: "the-mistress-trap",
    title: "The Escort They Framed",
    logline: "Hired for one night and framed for a murder she didn't commit, an escort becomes a dynasty's perfect scapegoat — until she sets out to burn their flawless lives down.",
    genre: "Drama · Betrayal",
    channel: "VERZA Originals",
    categories: ["drama", "popular"],
    popularRank: 5,
    episodeCount: 48,
    posterUrl: "/posters/mistress-trap.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(48), status: "live",
  },
  /* ================================================================ */
  /*  DRAMA TAB                                                        */
  /* ================================================================ */
  {
    slug: "the-dumb-billionaire-heiress-in-love",
    title: "A Fortune to Die For",
    logline: "A dying matriarch's fortune turns her glittering family into rivals willing to kill. To claim her inheritance — and survive it — one heiress must outplay her own blood.",
    genre: "Romance \u00b7 Comedy",
    channel: "VERZA Originals",
    categories: ["drama", "popular"],
    popularRank: 8,
    episodeCount: 58,
    posterUrl: "/posters/the-dumb-billionaire-heiress-in-love.png",
    freeEpisodes: 58, coinPerEpisode: 0, seasonPassCoins: 0, status: "live",
  },
  {
    slug: "do-not-deceive-me",
    title: "Do Not Deceive Me",
    logline: "She married the love of her life — then found his other wife living two floors up.",
    genre: "Thriller \u00b7 Romance",
    channel: "VERZA Originals",
    categories: ["drama"],
    episodeCount: 55,
    posterUrl: "/posters/do-not-deceive-me.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(55), status: "live",
  },
  {
    slug: "collateral-hearts",
    title: "Collateral Hearts",
    logline: "Jilted at the altar, she returns one year later as her ex's new boss.",
    genre: "Crime \u00b7 Romance",
    channel: "VERZA Originals",
    categories: ["drama"],
    episodeCount: 50,
    posterUrl: "/posters/collateral-hearts.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(50), status: "live",
  },
  {
    slug: "the-billionaires-betrayal",
    title: "The Billionaire's Betrayal",
    logline: "She married into wealth and power. She didn't know the price was her freedom.",
    genre: "Betrayal drama",
    channel: "VERZA Originals",
    categories: ["drama"],
    episodeCount: 55,
    posterUrl: "/posters/the-billionaires-betrayal.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(55), status: "live",
  },
  {
    slug: "undercovered-heart",
    title: "Undercovered Heart",
    logline: "An undercover cop falls for the crime lord's daughter — and his cover is cracking by the hour.",
    genre: "Crime \u00b7 Romance",
    channel: "VERZA Originals",
    categories: ["drama"],
    episodeCount: 54,
    posterUrl: "/posters/undercovered-heart.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(54), status: "live",
  },
  {
    slug: "under-her-control",
    title: "Under Her Control",
    logline: "His new wife controls every detail of his life. When he tries to leave, she reveals why he never can.",
    genre: "Psychological thriller",
    channel: "VERZA Originals",
    categories: ["drama"],
    episodeCount: 52,
    posterUrl: "/posters/under-her-control.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(52), status: "live",
  },
  {
    slug: "two-worlds-apart",
    title: "Two Worlds Apart",
    logline: "A billionaire heir and a street artist collide in a city that wants them on opposite sides.",
    genre: "Romance drama",
    channel: "VERZA Originals",
    categories: ["drama"],
    episodeCount: 56,
    posterUrl: "/posters/two-worlds-apart.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(56), status: "live",
  },
  {
    slug: "the-blackthornes",
    title: "Two Brothers, One Bride",
    logline: "She's engaged to one brother and falling for the other. Caught between two men who'd destroy the family to have her, the bride must choose before the choice is made in blood.",
    genre: "Dynasty \u00b7 Drama",
    channel: "VERZA Originals",
    categories: ["drama", "popular"],
    popularRank: 6,
    episodeCount: 60,
    posterUrl: "/posters/the-blackthornes.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(60), status: "live",
  },
  {
    slug: "marry-the-wrong-bride",
    title: "Marry the Wrong Bride",
    logline: "On her sister's wedding day, she takes her place at the altar — and the groom knows.",
    genre: "Deception romance",
    channel: "VERZA Originals",
    categories: ["drama"],
    episodeCount: 55,
    posterUrl: "/posters/marry-the-wrong-bride.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(55), status: "live",
  },
  {
    slug: "destined-to-be",
    title: "Destined to Be",
    logline: "Two rival heirs discover they were promised to the same woman at birth.",
    genre: "Possessive romance",
    channel: "VERZA Originals",
    categories: ["drama"],
    episodeCount: 60,
    posterUrl: "/posters/destined-to-be.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(60), status: "live",
  },
  {
    slug: "the-day-we-got-married",
    title: "Betrayed at the Altar",
    logline: "She said 'I do' — then found the betrayal waiting at the altar. Now the bride they humiliated is planning a reckoning no one will survive.",
    genre: "Romance \u00b7 Thriller",
    channel: "VERZA Originals",
    categories: ["drama", "popular"],
    popularRank: 1,
    episodeCount: 55,
    posterUrl: "/posters/the-day-we-got-married.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(55), status: "live",
  },
  {
    slug: "the-winter-veil",
    title: "The Winter Veil",
    logline: "A snowbound estate. A missing heiress. The man who loved her is the last person who saw her alive.",
    genre: "Mystery \u00b7 Romance",
    channel: "VERZA Originals",
    categories: ["drama"],
    episodeCount: 52,
    posterUrl: "/posters/the-winter-veil.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(52), status: "live",
  },
  {
    slug: "the-marriage-contract",
    title: "The Marriage Contract",
    logline: "Twelve months. No feelings. One billion-dollar company. The contract said nothing about falling in love.",
    genre: "Contract marriage",
    channel: "VERZA Originals",
    categories: ["drama"],
    episodeCount: 58,
    posterUrl: "/posters/the-marriage-contract.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(58), status: "live",
  },
  {
    slug: "the-haunted-sisters",
    title: "The Haunted Sisters",
    logline: "Three sisters inherit a mansion with a locked wing. The ghost inside knows their mother's secret.",
    genre: "Gothic \u00b7 Mystery",
    channel: "VERZA Originals",
    categories: ["drama"],
    episodeCount: 50,
    posterUrl: "/posters/the-haunted-sisters.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(50), status: "live",
  },
  {
    slug: "the-missing-piece",
    title: "Deadly Revelations",
    logline: "A business magnate is dead — ruled an accident, but the headlines hide a murder. As the evidence circles the widow, buried revelations threaten everyone the truth touches.",
    genre: "Mystery romance",
    channel: "VERZA Originals",
    categories: ["drama", "popular"],
    popularRank: 7,
    episodeCount: 54,
    posterUrl: "/posters/the-missing-piece.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(54), status: "live",
  },
  {
    slug: "mysterious-murder",
    title: "Mysterious Murder",
    logline: "A true-crime podcaster reopens a cold case and realizes the killer has been listening to every episode.",
    genre: "Thriller",
    channel: "VERZA Originals",
    categories: ["drama"],
    episodeCount: 52,
    posterUrl: "/posters/mysterious-murder.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(52), status: "live",
  },
  {
    slug: "married-to-a-stranger",
    title: "Married to a Stranger",
    logline: "A contract marriage to a cold billionaire turns real the night she learns why he chose her.",
    genre: "Contract marriage",
    channel: "VERZA Originals",
    categories: ["drama"],
    episodeCount: 62,
    posterUrl: "/posters/married-to-a-stranger.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(62), status: "live",
  },
  {
    slug: "blood-contract",
    title: "Blood Contract",
    logline: "She falls for the bodyguard hired to protect her, not knowing he was sent to kill her.",
    genre: "Romantic thriller",
    channel: "VERZA Originals",
    categories: ["drama"],
    episodeCount: 59,
    posterUrl: "/posters/blood-contract.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(59), status: "live",
  },
  {
    slug: "cleopatra",
    title: "Cleopatra",
    logline: "A broke waitress inherits an empire and the ruthless board that wants her gone.",
    genre: "Rags-to-riches drama",
    channel: "VERZA Originals",
    categories: ["drama"],
    episodeCount: 61,
    posterUrl: "/posters/cleopatra.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(61), status: "live",
  },
  {
    slug: "im-obsessed-with-my-boss",
    title: "Blackmail Baby",
    logline: "One secret, one damning text, and two powerful men who'll do anything to keep her quiet. Trapped in a game of blackmail and desire, she learns some secrets can destroy everything.",
    genre: "Office romance",
    channel: "VERZA Originals",
    categories: ["drama", "popular"],
    popularRank: 9,
    episodeCount: 50,
    posterUrl: "/posters/im-obsessed-with-my-boss.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(50), status: "live",
  },
  {
    slug: "duty-of-desire",
    title: "Duty of Desire",
    logline: "A military wife falls for her husband's commanding officer while he's deployed overseas.",
    genre: "Forbidden romance",
    channel: "VERZA Originals",
    categories: ["drama"],
    episodeCount: 58,
    posterUrl: "/posters/duty-of-desire.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(58), status: "live",
  },
  {
    slug: "echo-of-vengeance",
    title: "Revenge in Couture",
    logline: "Betrayed and cast out of the fashion house she built, she returns down the runway in couture — flawless, ruthless, and ready to make the industry that ruined her pay.",
    genre: "Revenge thriller",
    channel: "VERZA Originals",
    categories: ["drama", "popular"],
    popularRank: 10,
    episodeCount: 56,
    posterUrl: "/posters/echo-of-vengeance.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(56), status: "live",
  },
  {
    slug: "faded-threads",
    title: "Faded Threads",
    logline: "A fashion dynasty crumbles when the eldest daughter leaks the family's darkest secrets on live TV.",
    genre: "Family drama",
    channel: "VERZA Originals",
    categories: ["drama"],
    episodeCount: 48,
    posterUrl: "/posters/faded-threads.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(48), status: "live",
  },
  {
    slug: "hidden-agenda",
    title: "The Killer Caregiver",
    logline: "The gentle nurse everyone adores has buried more patients than anyone suspects. When a sharp-eyed heir survives her care, he realizes the woman keeping him alive is the one trying to kill him.",
    genre: "Romantic thriller",
    channel: "VERZA Originals",
    categories: ["drama", "popular"],
    popularRank: 3,
    episodeCount: 54,
    posterUrl: "/posters/hidden-agenda.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(54), status: "live",
  },
  {
    slug: "hollywood-stars-fake-girlfriend",
    title: "Hollywood Star's Fake Girlfriend",
    logline: "A struggling actress is hired to play an A-lister's girlfriend — then the cameras stop rolling and the feelings don't.",
    genre: "Celebrity romance",
    channel: "VERZA Originals",
    categories: ["drama"],
    episodeCount: 60,
    posterUrl: "/posters/hollywood-stars-fake-girlfriend.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(60), status: "live",
  },
  {
    slug: "i-think-my-wife-wants-to-kill-me",
    title: "I Think My Wife Wants to Kill Me",
    logline: "A billionaire notices small, lethal coincidences after changing his will — and his wife is always nearby.",
    genre: "Psychological thriller",
    channel: "VERZA Originals",
    categories: ["drama"],
    episodeCount: 52,
    posterUrl: "/posters/i-think-my-wife-wants-to-kill-me.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(52), status: "live",
  },
  {
    slug: "in-love-with-my-godfathers-daughter",
    title: "In Love with My Godfather's Daughter",
    logline: "He owes the Don everything. Falling for his daughter is the one debt that could cost him his life.",
    genre: "Forbidden romance",
    channel: "VERZA Originals",
    categories: ["drama"],
    episodeCount: 55,
    posterUrl: "/posters/in-love-with-my-godfathers-daughter.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(55), status: "live",
  },
  {
    slug: "love-lies-and-bloodline",
    title: "Love, Lies and Bloodline",
    logline: "A DNA test reveals the family patriarch is not who he claims — and someone in the house already knew.",
    genre: "Family thriller",
    channel: "VERZA Originals",
    categories: ["drama"],
    episodeCount: 56,
    posterUrl: "/posters/love-lies-and-bloodline.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(56), status: "live",
  },
  {
    slug: "loves-perfect-crime",
    title: "Love's Perfect Crime",
    logline: "A detective falls for the prime suspect in a murder case — and the evidence keeps pointing back to her.",
    genre: "Romantic thriller",
    channel: "VERZA Originals",
    categories: ["drama"],
    episodeCount: 54,
    posterUrl: "/posters/loves-perfect-crime.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(54), status: "live",
  },
  {
    slug: "mafia-lords-secret-love",
    title: "Mafia Lord's Son Has a Secret Love for His Stepmom",
    logline: "In a crime family where loyalty is blood, his forbidden obsession could start a war.",
    genre: "Dark romance",
    channel: "VERZA Originals",
    categories: ["drama"],
    episodeCount: 60,
    posterUrl: "/posters/mafia-lords-secret-love.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(60), status: "live",
  },
  {
    slug: "my-celebrity-boyfriend-killed-me",
    title: "My Celebrity Boyfriend Killed Me",
    logline: "She wakes up in a hospital with no memory — and her famous boyfriend is telling the world she's dead.",
    genre: "Psychological thriller",
    channel: "VERZA Originals",
    categories: ["drama"],
    episodeCount: 50,
    posterUrl: "/posters/my-celebrity-boyfriend-killed-me.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(50), status: "live",
  },
  {
    slug: "my-handsome-bodyguard",
    title: "My Handsome Bodyguard",
    logline: "A pop star hires a bodyguard to protect her from a stalker. The stalker knows things only the bodyguard would.",
    genre: "Romantic suspense",
    channel: "VERZA Originals",
    categories: ["drama"],
    episodeCount: 58,
    posterUrl: "/posters/my-handsome-bodyguard.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(58), status: "live",
  },
  {
    slug: "never-mess-with-a-badass-girl",
    title: "Never Mess with a Badass Girl",
    logline: "They underestimated the quiet girl from the wrong side of town. Now she owns the company that fired her.",
    genre: "Revenge romance",
    channel: "VERZA Originals",
    categories: ["drama"],
    episodeCount: 55,
    posterUrl: "/posters/never-mess-with-a-badass-girl.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(55), status: "live",
  },
  {
    slug: "sisters-have-crush-on-the-same-man",
    title: "Sisters Have Crush on the Same Man",
    logline: "One man. Two sisters. A love that could destroy them all.",
    genre: "Family romance",
    channel: "VERZA Originals",
    categories: ["drama"],
    episodeCount: 52,
    posterUrl: "/posters/sisters-have-crush-on-the-same-man.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(52), status: "live",
  },
  {
    slug: "the-billionaires-vow",
    title: "The Billionaire's Vow",
    logline: "Two men. One vow. A choice that could cost her everything — love, loyalty, or her fortune.",
    genre: "Billionaire drama",
    channel: "VERZA Originals",
    categories: ["drama"],
    episodeCount: 56,
    posterUrl: "/posters/the-billionaires-vow.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(56), status: "live",
  },

  /* ================================================================ */
  /*  NEW TAB                                                          */
  /* ================================================================ */
  {
    slug: "lost-and-found",
    title: "Lost and Found",
    logline: "A widow finds love letters in her late husband's attic — addressed to someone he never stopped loving.",
    genre: "Emotional drama",
    channel: "VERZA Originals",
    categories: ["new"],
    episodeCount: 48,
    posterUrl: "/posters/lost-and-found.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(48), status: "live",
  },
  {
    slug: "help-im-falling-in-love-with-my-rude-ceo",
    title: "Help! I'm Falling in Love with My Rude CEO",
    logline: "Her new boss humiliates her daily — but every night he secretly pays her mother's hospital bills.",
    genre: "Romance \u00b7 Comedy",
    channel: "VERZA Originals",
    categories: ["new"],
    episodeCount: 65,
    posterUrl: "/posters/help-im-falling-in-love-with-my-rude-ceo.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(65), status: "live",
  },
  {
    slug: "an-affair-with-my-boss",
    title: "An Affair with My Boss",
    logline: "A single mom takes a night job at a hotel and discovers her new boss is the father who vanished.",
    genre: "Office romance",
    channel: "VERZA Originals",
    categories: ["drama"],
    episodeCount: 52,
    posterUrl: "/posters/an-affair-with-my-boss.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(52), status: "live",
  },
  {
    slug: "a-love-once-betrayed",
    title: "A Love Once Betrayed",
    logline: "A widow discovers the stranger who saved her life is the twin of the husband she buried.",
    genre: "Mystery romance",
    channel: "VERZA Originals",
    categories: ["drama"],
    episodeCount: 62,
    posterUrl: "/posters/a-love-once-betrayed.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(62), status: "live",
  },
  {
    slug: "in-her-shadow",
    title: "In Her Shadow",
    logline: "A woman discovers her twin sister has been living her life — dating her boyfriend, working her job — for months.",
    genre: "Suspense drama",
    channel: "VERZA Originals",
    categories: ["drama"],
    episodeCount: 50,
    posterUrl: "/posters/in-her-shadow.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(50), status: "live",
  },
  {
    slug: "good-for-him",
    title: "Good for Him",
    logline: "After twenty years of marriage, she realizes the perfect husband is living a perfect lie.",
    genre: "Psychological drama",
    channel: "VERZA Originals",
    categories: ["drama"],
    episodeCount: 50,
    posterUrl: "/posters/good-for-him.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(50), status: "live",
  },
  {
    slug: "one-night-stand",
    title: "One Night Stand",
    logline: "One night. No names. No strings. Or so they thought — until she discovers he's her new boss.",
    genre: "Steamy romance",
    channel: "VERZA Originals",
    categories: ["drama"],
    episodeCount: 56,
    posterUrl: "/posters/one-night-stand.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(56), status: "live",
  },
  {
    slug: "if-only-you-were-mine",
    title: "If Only You Were Mine",
    logline: "Best friends since childhood, they swore never to cross the line — until one drunken confession changed everything.",
    genre: "Friends-to-lovers",
    channel: "VERZA Originals",
    categories: ["drama"],
    episodeCount: 58,
    posterUrl: "/posters/if-only-you-were-mine.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(58), status: "live",
  },
  {
    slug: "one-night-one-forever",
    title: "One Night One Forever",
    logline: "A one-night stand with a stranger becomes a lifetime when she discovers he's her new stepbrother.",
    genre: "Forbidden romance",
    channel: "VERZA Originals",
    categories: ["drama"],
    episodeCount: 50,
    posterUrl: "/posters/one-night-one-forever.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(50), status: "live",
  },
  {
    slug: "runaway-bride",
    title: "Runaway Bride",
    logline: "She ran from the altar. Fate led her to the stranger who saved her life — and ruined it.",
    genre: "Romantic drama",
    channel: "VERZA Originals",
    categories: ["drama"],
    episodeCount: 54,
    posterUrl: "/posters/runaway-bride.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(54), status: "live",
  },
  {
    slug: "the-billionaires-lost-love",
    title: "The Billionaire's Lost Love",
    logline: "He lost her once. This time, he'll fight to keep her — even if it means burning his empire down.",
    genre: "Billionaire romance",
    channel: "VERZA Originals",
    categories: ["drama"],
    episodeCount: 58,
    posterUrl: "/posters/the-billionaires-lost-love.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(58), status: "live",
  },

  /* ================================================================ */
  /*  POPULAR TAB (ranked 1-6)                                         */
  /* ================================================================ */
  /* The Mistress Trap moved to top of catalog — see first entry */
  /* The Blackthornes (rank 2), Destined to Be (rank 3), Do Not Deceive Me (rank 4), Undercovered Heart (rank 5), The Dumb Billionaire Heiress (rank 6) are in Drama above */
  {
    slug: "camouflage",
    title: "Camouflage",
    logline: "A spy posing as a diplomat's wife falls for her target — and the agency orders her to finish the mission anyway.",
    genre: "Spy \u00b7 Romance",
    channel: "VERZA Originals",
    categories: ["drama"],
    episodeCount: 56,
    posterUrl: "/posters/camouflage.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(56), status: "live",
  },
  {
    slug: "killer-romance",
    title: "Killer Romance",
    logline: "Two assassins are hired to eliminate each other. Neither knows the other's face — until their first date.",
    genre: "Romantic thriller",
    channel: "VERZA Originals",
    categories: ["drama"],
    episodeCount: 54,
    posterUrl: "/posters/killer-romance.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(54), status: "live",
  },
  {
    slug: "honey-gold",
    title: "Honey Gold",
    logline: "A small-town waitress wins a reality show and enters a world of wealth where everyone wants a piece — and no one wants her to stay.",
    genre: "Rags-to-riches romance",
    channel: "VERZA Originals",
    categories: ["drama"],
    episodeCount: 58,
    posterUrl: "/posters/honey-gold.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(58), status: "live",
  },
  {
    slug: "revenge-on-my-cheating-fiance",
    title: "Revenge On My Cheating Fianc\u00e9",
    logline: "She found the texts a week before the wedding. Instead of crying, she started planning.",
    genre: "Revenge drama",
    channel: "VERZA Originals",
    categories: ["drama"],
    episodeCount: 52,
    posterUrl: "/posters/revenge-on-my-cheating-fiance.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(52), status: "live",
  },
  {
    slug: "the-escort",
    title: "The Call Girl Bought by Betrayal",
    logline: "Sold into the escort life by the man she loved, she rises through the city's darkest circles to destroy the ones who bought and betrayed her.",
    genre: "Forbidden drama",
    channel: "VERZA Originals",
    categories: ["drama", "popular"],
    popularRank: 2,
    episodeCount: 55,
    posterUrl: "/posters/the-escort.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(55), status: "live",
  },

  /* ================================================================ */
  /*  MUSIC TAB                                                        */
  /* ================================================================ */

  /* ================================================================ */
  /*  REALITY TAB                                                      */
  /* ================================================================ */
  {
    slug: "school-hall",
    title: "School Hall",
    logline: "A prestigious academy's students play power games that make Wall Street look tame — and the teachers are the worst players.",
    genre: "Mystery \u00b7 Drama",
    channel: "VERZA Originals",
    categories: ["drama"],
    episodeCount: 52,
    posterUrl: "/posters/school-hall.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(52), status: "live",
  },
  {
    slug: "conflicted-hearts",
    title: "Conflicted Hearts",
    logline: "A fake engagement to settle a debt becomes a war neither can afford to win or lose.",
    genre: "Romance",
    channel: "VERZA Originals",
    categories: ["drama"],
    episodeCount: 60,
    posterUrl: "/posters/conflicted-hearts.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(60), status: "live",
  },
  {
    slug: "my-sister-stole-my-man",
    title: "My Sister Stole My Man",
    logline: "Twin sisters. One fiance. The wrong twin said yes — and the right one wants blood.",
    genre: "Family drama",
    channel: "VERZA Originals",
    categories: ["drama"],
    episodeCount: 46,
    posterUrl: "/posters/my-sister-stole-my-man.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(46), status: "live",
  },

  /* ================================================================ */
  /*  REALITY TAB — Storage Pirates (horizontal / landscape)            */
  /* ================================================================ */
  {
    slug: "storage-pirates",
    title: "Storage Pirates",
    logline: "Reality meets comedy. Real storage auctions, hidden treasures, bidding wars, and behind-the-scenes chaos.",
    genre: "Reality · Comedy",
    channel: "VERZA Originals",
    categories: ["reality"],
    episodeCount: 14,
    posterUrl: "/posters/storage-pirates.jpg",
    freeEpisodes: 14, coinPerEpisode: 0, seasonPassCoins: 0, status: "live",
  },

  /* ================================================================ */
  /*  RED CARPET TAB                                                   */
  /* ================================================================ */

  /* ================================================================ */
  /*  NEW FROM DRIVE                                                   */
  /* ================================================================ */
  {
    slug: "the-phoenix-conspiracy",
    title: "The Phoenix Conspiracy",
    logline: "A dead billionaire's daughter returns from the grave — and everyone who profited from her death is terrified.",
    genre: "Thriller \u00b7 Drama",
    channel: "VERZA Originals",
    categories: ["drama"],
    episodeCount: 56,
    posterUrl: "/posters/the-phoenix-conspiracy.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(56), status: "live",
  },
  {
    slug: "the-chauffeur",
    title: "The Chauffeur",
    logline: "He drives her everywhere. She trusts him with her life. He's been reporting every move to her enemies.",
    genre: "Romantic suspense",
    channel: "VERZA Originals",
    categories: ["drama"],
    episodeCount: 50,
    posterUrl: "/posters/the-chauffeur.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(50), status: "live",
  },
  {
    slug: "twisted-fates",
    title: "Twisted Fates",
    logline: "Switched at birth, two women discover the truth at 30 — and one will do anything to keep the life she stole.",
    genre: "Mystery \u00b7 Drama",
    channel: "VERZA Originals",
    categories: ["drama"],
    episodeCount: 55,
    posterUrl: "/posters/twisted-fates.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(55), status: "live",
  },
  {
    slug: "the-dumb-billionaire-heiress-pt-2",
    title: "The Dumb Billionaire Heiress In Love Pt. II",
    logline: "She dropped the act. Now the real heiress is playing for keeps — and her enemies aren't ready.",
    genre: "Romance \u00b7 Comedy",
    channel: "VERZA Originals",
    categories: ["drama"],
    episodeCount: 56,
    posterUrl: "/posters/the-dumb-billionaire-heiress-in-love.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(56), status: "live",
  },
  {
    slug: "tied-by-fate",
    title: "Tied By Fate",
    logline: "A red thread connects them across lifetimes. In this one, he's the detective investigating her disappearance.",
    genre: "Supernatural romance",
    channel: "VERZA Originals",
    categories: ["new"],
    episodeCount: 54,
    posterUrl: "/posters/tied-by-fate.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(54), status: "live",
  },
  {
    slug: "the-crown",
    title: "Power and Promises",
    logline: "Two ruthless heirs, one empire, and the woman caught between their promises. In a world where power is the only currency, every vow hides a blade.",
    genre: "Drama \u00b7 Suspense",
    channel: "VERZA Originals",
    categories: ["drama", "new", "popular"],
    popularRank: 4,
    episodeCount: 52,
    posterUrl: "/posters/the-crown.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(52), status: "live",
  },
  {
    slug: "rosy-psycho",
    title: "Rosy Psycho",
    logline: "She's sweet, beautiful, and everyone loves her. Her exes keep disappearing — and no one connects the dots.",
    genre: "Psychological thriller",
    channel: "VERZA Originals",
    categories: ["drama"],
    episodeCount: 50,
    posterUrl: "/posters/rosy-psycho.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(50), status: "live",
  },
  {
    slug: "the-unforgettable-love",
    title: "The Unforgettable Love",
    logline: "He erased her from his memory to survive. She walks back into his life and he feels everything — without knowing why.",
    genre: "Romance drama",
    channel: "VERZA Originals",
    categories: ["drama"],
    episodeCount: 58,
    posterUrl: "/posters/the-unforgettable-love.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(58), status: "live",
  },
  {
    slug: "why-i-did-it",
    title: "Why I Did It",
    logline: "A woman confesses to murder on live television. The real question is: who is she protecting?",
    genre: "Crime \u00b7 Thriller",
    channel: "VERZA Originals",
    categories: ["drama"],
    episodeCount: 48,
    posterUrl: "/posters/why-i-did-it.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(48), status: "live",
  },
  {
    slug: "the-ceo",
    title: "The CEO",
    logline: "At 26 she runs a billion-dollar empire. At night she's the woman no one is allowed to love.",
    genre: "Billionaire romance",
    channel: "VERZA Originals",
    categories: ["drama"],
    episodeCount: 55,
    posterUrl: "/posters/the-ceo.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(55), status: "live",
  },
  {
    slug: "twist-of-time",
    title: "Twist of Time",
    logline: "She wakes up ten years in the past — married to the man who will one day destroy her family.",
    genre: "Sci-fi \u00b7 Romance",
    channel: "VERZA Originals",
    categories: ["new"],
    episodeCount: 56,
    posterUrl: "/posters/twist-of-time.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(56), status: "live",
  },
  {
    slug: "she-is-mine",
    title: "She Is Mine",
    logline: "Desire. Obsession. Betrayal. She always gets what she wants — and not every love story has a happy ending.",
    genre: "Obsession drama",
    channel: "VERZA Originals",
    categories: ["drama"],
    episodeCount: 52,
    posterUrl: "/posters/she-is-mine.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(52), status: "live",
  },
  {
    slug: "the-pendleton-secret",
    title: "The Pendleton Secret",
    logline: "The Pendleton estate holds a fortune, a family of liars, and a secret that could bring down a dynasty.",
    genre: "Family thriller",
    channel: "VERZA Originals",
    categories: ["drama"],
    episodeCount: 54,
    posterUrl: "/posters/the-pendleton-secret.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(54), status: "live",
  },
  {
    slug: "the-perfect-husband",
    title: "The Perfect Husband",
    logline: "He cooks. He cleans. He remembers every anniversary. He also has a second family across town.",
    genre: "Betrayal drama",
    channel: "VERZA Originals",
    categories: ["drama"],
    episodeCount: 50,
    posterUrl: "/posters/the-perfect-husband.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(50), status: "live",
  },
  {
    slug: "the-inheritance-game",
    title: "The Inheritance Game",
    logline: "She came for answers. They have everything to lose. A fortune favors the clever — if she survives the family.",
    genre: "Mystery \u00b7 Thriller",
    channel: "VERZA Originals",
    categories: ["drama", "new"],
    episodeCount: 56,
    posterUrl: "/posters/the-inheritance-game.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(56), status: "live",
  },

  /* ================================================================ */
  /*  COMING SOON                                                      */
  /* ================================================================ */
  {
    slug: "im-obsessed-with-my-boss-2",
    title: "I'm Obsessed with My Boss Part II",
    logline: "She thought leaving the company would end it. He followed her to the new one.",
    genre: "Office romance",
    channel: "VERZA Originals",
    categories: ["drama"],
    episodeCount: 0,
    posterUrl: "/posters/im-obsessed-with-my-boss-2.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: 0, status: "coming_soon",
  },
  {
    slug: "too-much-junk",
    title: "Too Much Junk",
    logline: "When the music stops, the secrets start. A rising artist discovers the industry runs on lies — and her biggest hit is built on one.",
    // TODO(content): confirm genre with Alan — label reads "Music · Drama" but the
    // actual episode may be reality/comedy. Update genre + Music tab framing to match.
    genre: "Music · Drama",
    channel: "VERZA Originals",
    categories: ["music"],
    episodeCount: 1,
    posterUrl: "/posters/too-much-junk.jpg",
    freeEpisodes: 1, coinPerEpisode: 0, seasonPassCoins: 0, status: "live",
  },
  {
    // Red Carpet tab exclusive — NEVER shown in the Drama library grid
    // (BrowsePage filters red-carpet titles out of the Drama tab).
    slug: "exes-premiere",
    title: "Exes Premiere",
    logline: "The Carpet takes you inside the star-studded Los Angeles premiere of Exes — cast interviews, arrivals, and all the red carpet moments.",
    genre: "Red Carpet · Reality",
    channel: "The Carpet",
    categories: ["red-carpet"],
    episodeCount: 12,
    posterUrl: "/posters/exes-premiere.png",
    freeEpisodes: 12, coinPerEpisode: 0, seasonPassCoins: 0, status: "live",
  },
  {
    // Red Carpet tab exclusive — NEVER shown in the Drama library grid.
    slug: "love-awards",
    title: "Love Awards",
    logline: "The 1st Annual Vertical Drama Love Awards — winners, gowns, and backstage interviews from The Carpet, presented by VERZA TV.",
    genre: "Red Carpet · Reality",
    channel: "The Carpet",
    categories: ["red-carpet"],
    episodeCount: 13,
    posterUrl: "/posters/love-awards.png",
    freeEpisodes: 13, coinPerEpisode: 0, seasonPassCoins: 0, status: "live",
  },
  {
    slug: "billionaire-daughters-love-triangle",
    title: "Billionaire Daughter's Love Triangle",
    logline: "An heiress torn between the bodyguard who'd die for her and the rival CEO who'd destroy her family to have her.",
    genre: "Romance \u00b7 Drama",
    channel: "VERZA Originals",
    categories: ["drama", "new"],
    episodeCount: 60,
    posterUrl: "/posters/billionaire-daughters-love-triangle.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(60), status: "live",
  },
  {
    slug: "married-to-my-brothers-ex",
    title: "Married to My Brother's Ex",
    logline: "To save the family company he marries the woman his brother abandoned \u2014 and discovers the wedding was her revenge plan all along.",
    genre: "Romance \u00b7 Revenge",
    channel: "VERZA Originals",
    categories: ["drama", "new"],
    episodeCount: 62,
    posterUrl: "/posters/married-to-my-brothers-ex.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(62), status: "live",
  },
  {
    slug: "tangled-in-desire",
    title: "Tangled in Desire",
    logline: "A forbidden affair binds two families in secrets \u2014 until one night of passion threatens to burn everything down.",
    genre: "Romance \u00b7 Drama",
    channel: "VERZA Originals",
    categories: ["drama", "new"],
    episodeCount: 60,
    posterUrl: "/posters/tangled-in-desire.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(60), status: "live",
  },
  {
    slug: "the-escaping-mistress",
    title: "The Escaping Mistress",
    logline: "She fled his penthouse with his child and a new name. Five years later, the billionaire who owned her heart walks into her office.",
    genre: "Romance \u00b7 Drama",
    channel: "VERZA Originals",
    categories: ["drama", "new"],
    episodeCount: 60,
    posterUrl: "/posters/the-escaping-mistress.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(60), status: "live",
  },
  {
    slug: "trial-marriage-to-a-billionaire-s2",
    title: "Trial Marriage to a Billionaire \u2014 Season 2",
    logline: "The ninety-day contract is over, but the wedding ring won't come off. Season two of the marriage that started as a business deal.",
    genre: "Romance \u00b7 Drama",
    channel: "VERZA Originals",
    categories: ["drama", "new"],
    episodeCount: 60,
    posterUrl: "/posters/trial-marriage-to-a-billionaire-s2.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(60), status: "live",
  },
];

/* ------------------------------------------------------------------ */
/*  Normalize episode counts to the real Mux inventory.                 */
/*  MUX_MAP is the single source of truth for how many episodes         */
/*  actually play. This keeps episodeCount, season-pass pricing, and     */
/*  free-episode ranges honest — no advertised episode without a video,  */
/*  and no uploaded stream left hidden.                                  */
/* ------------------------------------------------------------------ */
for (const s of catalog) {
  if (s.status !== "live") continue;
  const streams = MUX_MAP[s.slug]?.length;
  if (!streams) continue;
  s.episodeCount = streams;
  if (s.freeEpisodes > streams) s.freeEpisodes = streams;
  if (s.coinPerEpisode > 0) s.seasonPassCoins = sp(streams);
}

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

export function getSeriesByCategory(cat: BrowseCategory): Series[] {
  // Hot consolidates Hot + New: the standalone "New" tab was removed, so the
  // Hot (popular) tab shows every live series tagged "popular" OR "new",
  // ranked-popular first (by popularRank), then the newer, unranked titles.
  if (cat === "popular") {
    return catalog
      .filter((s) => s.status === "live" && (s.categories.includes("popular") || s.categories.includes("new")))
      .sort((a, b) => (a.popularRank ?? 99) - (b.popularRank ?? 99));
  }
  return catalog.filter((s) => s.status === "live" && s.categories.includes(cat));
}

export function getSeriesByChannel(channel: string): Series[] {
  return catalog.filter((s) => s.status === "live" && s.channel === channel);
}

export function getSeriesBySlug(slug: string): Series | undefined {
  return catalog.find((s) => s.slug === slug);
}

/** Get series with full detail metadata merged in */
export function getSeriesWithDetail(slug: string): Series | undefined {
  const s = catalog.find((c) => c.slug === slug);
  if (!s) return undefined;
  // Lazy-import detail to keep catalog lightweight
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { SERIES_DETAIL } = require("./series-detail");
    const detail = SERIES_DETAIL[slug];
    if (detail) return { ...s, ...detail };
  } catch { /* detail file optional */ }
  return s;
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
