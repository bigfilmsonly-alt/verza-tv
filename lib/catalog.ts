/* ------------------------------------------------------------------ */
/*  Full catalog — live series + coming soon                            */
/* ------------------------------------------------------------------ */

export type BrowseCategory = "drama" | "new" | "popular" | "music" | "reality" | "red-carpet";

export const BROWSE_TABS: { key: BrowseCategory; label: string }[] = [
  { key: "drama", label: "Drama" },
  { key: "new", label: "New" },
  { key: "popular", label: "Popular" },
  { key: "music", label: "Music" },
  { key: "reality", label: "Reality" },
  { key: "red-carpet", label: "Red Carpet" },
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
  /*  DRAMA TAB                                                        */
  /* ================================================================ */
  {
    slug: "the-dumb-billionaire-heiress-in-love",
    title: "The Dumb Billionaire Heiress In Love",
    logline: "She plays the fool so no one suspects her billions — until the one man who sees through it all walks into her life.",
    genre: "Romance \u00b7 Comedy",
    channel: "Verza Originals",
    categories: ["drama"],
    episodeCount: 58,
    posterUrl: "/posters/the-dumb-billionaire-heiress-in-love.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(58), status: "live",
  },
  {
    slug: "do-not-deceive-me",
    title: "Do Not Deceive Me",
    logline: "She married the love of her life — then found his other wife living two floors up.",
    genre: "Thriller \u00b7 Romance",
    channel: "Verza Originals",
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
    channel: "Verza Originals",
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
    channel: "Verza Originals",
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
    channel: "Verza Originals",
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
    channel: "Verza Originals",
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
    channel: "Verza Originals",
    categories: ["drama"],
    episodeCount: 56,
    posterUrl: "/posters/two-worlds-apart.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(56), status: "live",
  },
  {
    slug: "the-blackthornes",
    title: "The Blackthornes",
    logline: "Three siblings. One dynasty. The patriarch is dead and his will names none of them — unless they destroy each other first.",
    genre: "Dynasty \u00b7 Drama",
    channel: "Verza Originals",
    categories: ["drama", "popular"],
    popularRank: 2,
    episodeCount: 60,
    posterUrl: "/posters/the-blackthornes.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(60), status: "live",
  },
  {
    slug: "marry-the-wrong-bride",
    title: "Marry the Wrong Bride",
    logline: "On her sister's wedding day, she takes her place at the altar — and the groom knows.",
    genre: "Deception romance",
    channel: "Verza Originals",
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
    channel: "Verza Originals",
    categories: ["drama"],
    episodeCount: 60,
    posterUrl: "/posters/destined-to-be.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(60), status: "live",
  },
  {
    slug: "the-day-we-got-married",
    title: "The Day We Got Married",
    logline: "The wedding was perfect. The groom was a stranger. She said yes because the alternative was a bullet.",
    genre: "Romance \u00b7 Thriller",
    channel: "Verza Originals",
    categories: ["drama", "popular"],
    popularRank: 3,
    episodeCount: 55,
    posterUrl: "/posters/the-day-we-got-married.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(55), status: "live",
  },
  {
    slug: "the-winter-veil",
    title: "The Winter Veil",
    logline: "A snowbound estate. A missing heiress. The man who loved her is the last person who saw her alive.",
    genre: "Mystery \u00b7 Romance",
    channel: "Verza Originals",
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
    channel: "Verza Originals",
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
    channel: "Verza Originals",
    categories: ["drama"],
    episodeCount: 50,
    posterUrl: "/posters/the-haunted-sisters.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(50), status: "live",
  },
  {
    slug: "the-missing-piece",
    title: "The Missing Piece",
    logline: "A detective's cold case leads to a love letter addressed to her — written twenty years before she was born.",
    genre: "Mystery romance",
    channel: "Verza Originals",
    categories: ["drama", "popular"],
    popularRank: 4,
    episodeCount: 54,
    posterUrl: "/posters/the-missing-piece.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(54), status: "live",
  },
  {
    slug: "mysterious-murder",
    title: "Mysterious Murder",
    logline: "A true-crime podcaster reopens a cold case and realizes the killer has been listening to every episode.",
    genre: "Thriller",
    channel: "Verza Originals",
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
    channel: "Verza Originals",
    categories: ["drama"],
    episodeCount: 62,
    posterUrl: "/posters/married-to-a-stranger.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(62), status: "live",
  },
  {
    slug: "billionaire-daughters-love-triangle",
    title: "Billionaire Daughter's Love Triangle",
    logline: "He will save her father's company for one price — she becomes his wife for a year.",
    genre: "Billionaire romance",
    channel: "Verza Originals",
    categories: ["drama"],
    episodeCount: 62,
    posterUrl: "/posters/billionaire-daughters-love-triangle.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(62), status: "live",
  },
  {
    slug: "blood-contract",
    title: "Blood Contract",
    logline: "She falls for the bodyguard hired to protect her, not knowing he was sent to kill her.",
    genre: "Romantic thriller",
    channel: "Verza Originals",
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
    channel: "Verza Originals",
    categories: ["drama"],
    episodeCount: 61,
    posterUrl: "/posters/cleopatra.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(61), status: "live",
  },
  {
    slug: "im-obsessed-with-my-boss",
    title: "I'm Obsessed with My Boss",
    logline: "One elevator kiss with the CEO upends the assistant's careful life.",
    genre: "Office romance",
    channel: "Verza Originals",
    categories: ["drama"],
    episodeCount: 50,
    posterUrl: "/posters/im-obsessed-with-my-boss.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(50), status: "live",
  },
  {
    slug: "duty-of-desire",
    title: "Duty of Desire",
    logline: "A military wife falls for her husband's commanding officer while he's deployed overseas.",
    genre: "Forbidden romance",
    channel: "Verza Originals",
    categories: ["drama"],
    episodeCount: 58,
    posterUrl: "/posters/duty-of-desire.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(58), status: "live",
  },
  {
    slug: "echo-of-vengeance",
    title: "Echo of Vengeance",
    logline: "She was left for dead on her wedding night. Now she's back — and everyone will pay.",
    genre: "Revenge thriller",
    channel: "Verza Originals",
    categories: ["drama"],
    episodeCount: 56,
    posterUrl: "/posters/echo-of-vengeance.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(56), status: "live",
  },
  {
    slug: "faded-threads",
    title: "Faded Threads",
    logline: "A fashion dynasty crumbles when the eldest daughter leaks the family's darkest secrets on live TV.",
    genre: "Family drama",
    channel: "Verza Originals",
    categories: ["drama"],
    episodeCount: 48,
    posterUrl: "/posters/faded-threads.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(48), status: "live",
  },
  {
    slug: "hidden-agenda",
    title: "Hidden Agenda",
    logline: "An undercover journalist infiltrates a powerful family and falls for the son she's investigating.",
    genre: "Romantic thriller",
    channel: "Verza Originals",
    categories: ["drama"],
    episodeCount: 54,
    posterUrl: "/posters/hidden-agenda.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(54), status: "live",
  },
  {
    slug: "hollywood-stars-fake-girlfriend",
    title: "Hollywood Star's Fake Girlfriend",
    logline: "A struggling actress is hired to play an A-lister's girlfriend — then the cameras stop rolling and the feelings don't.",
    genre: "Celebrity romance",
    channel: "Verza Originals",
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
    channel: "Verza Originals",
    categories: ["reality"],
    episodeCount: 52,
    posterUrl: "/posters/i-think-my-wife-wants-to-kill-me.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(52), status: "live",
  },
  {
    slug: "in-love-with-my-godfathers-daughter",
    title: "In Love with My Godfather's Daughter",
    logline: "He owes the Don everything. Falling for his daughter is the one debt that could cost him his life.",
    genre: "Forbidden romance",
    channel: "Verza Originals",
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
    channel: "Verza Originals",
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
    channel: "Verza Originals",
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
    channel: "Verza Originals",
    categories: ["drama"],
    episodeCount: 60,
    posterUrl: "/posters/mafia-lords-secret-love.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(60), status: "live",
  },
  {
    slug: "married-to-my-brothers-ex",
    title: "Married to My Brother's Ex",
    logline: "He married her to get revenge on his brother. She married him to get closer to the truth.",
    genre: "Revenge romance",
    channel: "Verza Originals",
    categories: ["drama"],
    episodeCount: 52,
    posterUrl: "/posters/married-to-my-brothers-ex.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(52), status: "live",
  },
  {
    slug: "my-celebrity-boyfriend-killed-me",
    title: "My Celebrity Boyfriend Killed Me",
    logline: "She wakes up in a hospital with no memory — and her famous boyfriend is telling the world she's dead.",
    genre: "Psychological thriller",
    channel: "Verza Originals",
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
    channel: "Verza Originals",
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
    channel: "Verza Originals",
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
    channel: "Verza Originals",
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
    channel: "Verza Originals",
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
    channel: "Verza Originals",
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
    channel: "Verza Originals",
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
    channel: "Verza Originals",
    categories: ["new"],
    episodeCount: 52,
    posterUrl: "/posters/an-affair-with-my-boss.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(52), status: "live",
  },
  {
    slug: "a-love-once-betrayed",
    title: "A Love Once Betrayed",
    logline: "A widow discovers the stranger who saved her life is the twin of the husband she buried.",
    genre: "Mystery romance",
    channel: "Verza Originals",
    categories: ["new"],
    episodeCount: 62,
    posterUrl: "/posters/a-love-once-betrayed.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(62), status: "live",
  },
  {
    slug: "in-her-shadow",
    title: "In Her Shadow",
    logline: "A woman discovers her twin sister has been living her life — dating her boyfriend, working her job — for months.",
    genre: "Suspense drama",
    channel: "Verza Originals",
    categories: ["new", "reality"],
    episodeCount: 50,
    posterUrl: "/posters/in-her-shadow.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(50), status: "live",
  },
  {
    slug: "good-for-him",
    title: "Good for Him",
    logline: "After twenty years of marriage, she realizes the perfect husband is living a perfect lie.",
    genre: "Psychological drama",
    channel: "Verza Originals",
    categories: ["new", "reality"],
    episodeCount: 50,
    posterUrl: "/posters/good-for-him.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(50), status: "live",
  },
  {
    slug: "one-night-stand",
    title: "One Night Stand",
    logline: "One night. No names. No strings. Or so they thought — until she discovers he's her new boss.",
    genre: "Steamy romance",
    channel: "Verza Originals",
    categories: ["new"],
    episodeCount: 56,
    posterUrl: "/posters/one-night-stand.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(56), status: "live",
  },
  {
    slug: "if-only-you-were-mine",
    title: "If Only You Were Mine",
    logline: "Best friends since childhood, they swore never to cross the line — until one drunken confession changed everything.",
    genre: "Friends-to-lovers",
    channel: "Verza Originals",
    categories: ["new"],
    episodeCount: 58,
    posterUrl: "/posters/if-only-you-were-mine.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(58), status: "live",
  },
  {
    slug: "one-night-one-forever",
    title: "One Night One Forever",
    logline: "A one-night stand with a stranger becomes a lifetime when she discovers he's her new stepbrother.",
    genre: "Forbidden romance",
    channel: "Verza Originals",
    categories: ["new"],
    episodeCount: 50,
    posterUrl: "/posters/one-night-one-forever.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(50), status: "live",
  },
  {
    slug: "runaway-bride",
    title: "Runaway Bride",
    logline: "She ran from the altar. Fate led her to the stranger who saved her life — and ruined it.",
    genre: "Romantic drama",
    channel: "Verza Originals",
    categories: ["new"],
    episodeCount: 54,
    posterUrl: "/posters/runaway-bride.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(54), status: "live",
  },
  {
    slug: "the-billionaires-lost-love",
    title: "The Billionaire's Lost Love",
    logline: "He lost her once. This time, he'll fight to keep her — even if it means burning his empire down.",
    genre: "Billionaire romance",
    channel: "Verza Originals",
    categories: ["new"],
    episodeCount: 58,
    posterUrl: "/posters/the-billionaires-lost-love.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(58), status: "live",
  },

  /* ================================================================ */
  /*  POPULAR TAB (ranked 1-9)                                         */
  /* ================================================================ */
  {
    slug: "the-mistress-trap",
    title: "The Mistress Trap",
    logline: "She set a honeytrap to catch her husband cheating. She didn't expect the other woman to be her best friend.",
    genre: "Drama \u00b7 Betrayal",
    channel: "Verza Originals",
    categories: ["popular"],
    popularRank: 1,
    episodeCount: 48,
    posterUrl: "/posters/mistress-trap.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(48), status: "live",
  },
  /* The Blackthornes (rank 2) and The Day We Got Married (rank 3) are in Drama above */
  /* The Missing Piece (rank 4) is in Drama above */
  {
    slug: "camouflage",
    title: "Camouflage",
    logline: "A spy posing as a diplomat's wife falls for her target — and the agency orders her to finish the mission anyway.",
    genre: "Spy \u00b7 Romance",
    channel: "Verza Originals",
    categories: ["popular"],
    popularRank: 5,
    episodeCount: 56,
    posterUrl: "/posters/camouflage.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(56), status: "live",
  },
  {
    slug: "killer-romance",
    title: "Killer Romance",
    logline: "Two assassins are hired to eliminate each other. Neither knows the other's face — until their first date.",
    genre: "Romantic thriller",
    channel: "Verza Originals",
    categories: ["popular"],
    popularRank: 6,
    episodeCount: 54,
    posterUrl: "/posters/killer-romance.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(54), status: "live",
  },
  {
    slug: "honey-gold",
    title: "Honey Gold",
    logline: "A small-town waitress wins a reality show and enters a world of wealth where everyone wants a piece — and no one wants her to stay.",
    genre: "Rags-to-riches romance",
    channel: "Verza Originals",
    categories: ["popular"],
    popularRank: 7,
    episodeCount: 58,
    posterUrl: "/posters/honey-gold.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(58), status: "live",
  },
  {
    slug: "revenge-on-my-cheating-fiance",
    title: "Revenge On My Cheating Fianc\u00e9",
    logline: "She found the texts a week before the wedding. Instead of crying, she started planning.",
    genre: "Revenge drama",
    channel: "Verza Originals",
    categories: ["popular"],
    popularRank: 8,
    episodeCount: 52,
    posterUrl: "/posters/revenge-on-my-cheating-fiance.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(52), status: "live",
  },
  {
    slug: "the-escort",
    title: "The Escort",
    logline: "A law student escorts to pay tuition. Her richest client turns out to be her professor's husband.",
    genre: "Forbidden drama",
    channel: "Verza Originals",
    categories: ["popular"],
    popularRank: 9,
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
    channel: "Verza Originals",
    categories: ["reality"],
    episodeCount: 52,
    posterUrl: "/posters/school-hall.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(52), status: "live",
  },
  {
    slug: "conflicted-hearts",
    title: "Conflicted Hearts",
    logline: "A fake engagement to settle a debt becomes a war neither can afford to win or lose.",
    genre: "Romance",
    channel: "Verza Originals",
    categories: ["reality"],
    episodeCount: 60,
    posterUrl: "/posters/conflicted-hearts.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(60), status: "live",
  },
  {
    slug: "my-sister-stole-my-man",
    title: "My Sister Stole My Man",
    logline: "Twin sisters. One fiance. The wrong twin said yes — and the right one wants blood.",
    genre: "Family drama",
    channel: "Verza Originals",
    categories: ["drama"],
    episodeCount: 46,
    posterUrl: "/posters/my-sister-stole-my-man.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(46), status: "live",
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
    channel: "Verza Originals",
    categories: ["drama"],
    episodeCount: 56,
    posterUrl: "/posters/the-phoenix-conspiracy.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(56), status: "live",
  },
  {
    slug: "tangled-in-desire",
    title: "Tangled in Desire",
    logline: "Two strangers share one reckless night. Months later, she's his new business partner — and she's carrying his secret.",
    genre: "Steamy romance",
    channel: "Verza Originals",
    categories: ["drama"],
    episodeCount: 54,
    posterUrl: "/posters/tangled-in-desire.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(54), status: "live",
  },
  {
    slug: "the-escaping-mistress",
    title: "The Escaping Mistress",
    logline: "She was his secret for five years. Now she's running — and he'll burn the city down to bring her back.",
    genre: "Dark romance",
    channel: "Verza Originals",
    categories: ["drama"],
    episodeCount: 52,
    posterUrl: "/posters/the-escaping-mistress.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(52), status: "live",
  },
  {
    slug: "the-chauffeur",
    title: "The Chauffeur",
    logline: "He drives her everywhere. She trusts him with her life. He's been reporting every move to her enemies.",
    genre: "Romantic suspense",
    channel: "Verza Originals",
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
    channel: "Verza Originals",
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
    channel: "Verza Originals",
    categories: ["drama"],
    episodeCount: 56,
    posterUrl: "/posters/the-dumb-billionaire-heiress-pt-2.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(56), status: "live",
  },
  {
    slug: "tied-by-fate",
    title: "Tied By Fate",
    logline: "A red thread connects them across lifetimes. In this one, he's the detective investigating her disappearance.",
    genre: "Supernatural romance",
    channel: "Verza Originals",
    categories: ["new"],
    episodeCount: 54,
    posterUrl: "/posters/tied-by-fate.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(54), status: "live",
  },
  {
    slug: "the-crown",
    title: "The Crown",
    logline: "A beauty queen discovers the pageant world runs on blackmail — and the crown she won was rigged from the start.",
    genre: "Drama \u00b7 Suspense",
    channel: "Verza Originals",
    categories: ["drama"],
    episodeCount: 52,
    posterUrl: "/posters/the-crown.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(52), status: "live",
  },
  {
    slug: "rosy-psycho",
    title: "Rosy Psycho",
    logline: "She's sweet, beautiful, and everyone loves her. Her exes keep disappearing — and no one connects the dots.",
    genre: "Psychological thriller",
    channel: "Verza Originals",
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
    channel: "Verza Originals",
    categories: ["new"],
    episodeCount: 58,
    posterUrl: "/posters/the-unforgettable-love.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(58), status: "live",
  },
  {
    slug: "why-i-did-it",
    title: "Why I Did It",
    logline: "A woman confesses to murder on live television. The real question is: who is she protecting?",
    genre: "Crime \u00b7 Thriller",
    channel: "Verza Originals",
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
    channel: "Verza Originals",
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
    channel: "Verza Originals",
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
    channel: "Verza Originals",
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
    channel: "Verza Originals",
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
    channel: "Verza Originals",
    categories: ["drama"],
    episodeCount: 50,
    posterUrl: "/posters/the-perfect-husband.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(50), status: "live",
  },
  {
    slug: "trial-marriage-to-a-billionaire-s2",
    title: "Trial Marriage to a Billionaire Season 2",
    logline: "The trial is over. The feelings are real. But his first wife is back — and she has receipts.",
    genre: "Billionaire romance",
    channel: "Verza Originals",
    categories: ["new"],
    episodeCount: 58,
    posterUrl: "/posters/trial-marriage-to-a-billionaire-s2.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(58), status: "live",
  },
  {
    slug: "the-inheritance-game",
    title: "The Inheritance Game",
    logline: "She came for answers. They have everything to lose. A fortune favors the clever — if she survives the family.",
    genre: "Mystery \u00b7 Thriller",
    channel: "Verza Originals",
    categories: ["drama"],
    episodeCount: 56,
    posterUrl: "/posters/the-inheritance-game.png",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(56), status: "live",
  },

  /* ================================================================ */
  /*  MUSIC TAB                                                        */
  /* ================================================================ */
  {
    slug: "storageblue-too-much-junk",
    title: "StorageBlue: Too Much Junk",
    logline: "When storage units go to auction, one crew finds more than furniture — they find fame, feuds, and hidden fortunes.",
    genre: "Reality \u00b7 Comedy",
    channel: "StorageBlue",
    categories: ["music"],
    episodeCount: 24,
    posterUrl: "",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(24), status: "live",
  },

  /* ================================================================ */
  /*  REALITY TAB (additional)                                         */
  /* ================================================================ */
  {
    slug: "the-vertical-tea",
    title: "The Vertical Tea",
    logline: "The hottest takes on micro-drama, celebrity scandals, and internet chaos — served piping hot, sixty seconds at a time.",
    genre: "Talk \u00b7 Reality",
    channel: "The Vertical Tea",
    categories: ["reality"],
    episodeCount: 40,
    posterUrl: "",
    freeEpisodes: 5, coinPerEpisode: 49, seasonPassCoins: sp(40), status: "live",
  },

  /* ================================================================ */
  /*  RED CARPET TAB                                                   */
  /* ================================================================ */
  {
    slug: "vertical-drama-love-awards",
    title: "Vertical Drama Love Awards",
    logline: "The biggest stars of micro-drama gather for one unforgettable night of glamour, tears, and surprises.",
    genre: "Event \u00b7 Red Carpet",
    channel: "Verza Originals",
    categories: ["red-carpet"],
    episodeCount: 6,
    posterUrl: "",
    freeEpisodes: 6, coinPerEpisode: 0, seasonPassCoins: 0, status: "live",
  },
  {
    slug: "exes-premiere",
    title: "EXES Premiere",
    logline: "Exclusive red carpet coverage from the premiere of EXES — the stars, the drama, and the moments everyone will be talking about.",
    genre: "Event \u00b7 Red Carpet",
    channel: "Verza Originals",
    categories: ["red-carpet"],
    episodeCount: 4,
    posterUrl: "",
    freeEpisodes: 4, coinPerEpisode: 0, seasonPassCoins: 0, status: "live",
  },

  /* ================================================================ */
  /*  COMING SOON                                                      */
  /* ================================================================ */
  {
    slug: "im-obsessed-with-my-boss-2",
    title: "I'm Obsessed with My Boss Part II",
    logline: "She thought leaving the company would end it. He followed her to the new one.",
    genre: "Office romance",
    channel: "Verza Originals",
    categories: ["drama"],
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

export function getSeriesByCategory(cat: BrowseCategory): Series[] {
  const filtered = catalog.filter(
    (s) => s.status === "live" && s.categories.includes(cat),
  );
  if (cat === "popular") {
    return filtered.sort((a, b) => (a.popularRank ?? 99) - (b.popularRank ?? 99));
  }
  return filtered;
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
