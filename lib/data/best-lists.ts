import type { Series } from "@/lib/catalog";

/* ------------------------------------------------------------------ */
/*  Best-of list model                                                 */
/* ------------------------------------------------------------------ */

export interface BestList {
  slug: string;
  title: string;
  /** 150-160 char meta description, unique per list */
  blurb: string;
  /** Unique 80-150 word editorial intro */
  intro: string;
  /**
   * Curation predicate over a Series. Lists are built by filtering
   * getLiveSeries() with this, so every link resolves to a real page.
   */
  match: (s: Series) => boolean;
}

/* ------------------------------------------------------------------ */
/*  Match helpers                                                      */
/* ------------------------------------------------------------------ */

function text(s: Series): string {
  return `${s.title} ${s.logline} ${s.genre}`.toLowerCase();
}

function has(s: Series, ...keywords: string[]): boolean {
  const t = text(s);
  return keywords.some((k) => t.includes(k.toLowerCase()));
}

/* ------------------------------------------------------------------ */
/*  Best-of lists                                                      */
/* ------------------------------------------------------------------ */

export const BEST_LISTS: BestList[] = [
  {
    slug: "best-billionaire-romance-microdramas",
    title: "What Are the Best Billionaire Romance Microdramas to Watch?",
    blurb:
      "The best billionaire romance microdramas on VERZA TV, ranked for bingeing — secret heirs, contract marriages, and CEOs who fall hard, all in vertical episodes.",
    intro:
      "If you're searching for billionaire romance microdramas, this editorial list gathers VERZA TV stories built around secret heirs, cold tycoons, contract marriages, and corporate empires. Each one delivers high-stakes love in cinematic vertical episodes built for quick, phone-first viewing. Free-preview availability varies by title, and each title page shows its current access options.",
    match: (s) => has(s, "billionaire", "ceo", "empire", "heir", "tycoon", "fortune", "trial marriage"),
  },
  {
    slug: "best-revenge-short-dramas",
    title: "What Are the Best Revenge Short Dramas in This Editorial List?",
    blurb:
      "The best revenge short dramas on VERZA TV — cunning comebacks, boardroom takedowns, and satisfying payback delivered in short-form vertical episodes.",
    intro:
      "The best revenge short dramas turn heartbreak into strategy. This curated VERZA TV list follows women who were left for dead, jilted, or underestimated, then came back with a plan and the nerve to execute it. Boardroom takeovers, explosive weddings, and methodical payback unfold in compact vertical episodes. Free-preview availability varies by title; current access details appear on each title page.",
    match: (s) => has(s, "revenge", "vengeance", "payback", "badass", "wronged", "left for dead"),
  },
  {
    slug: "best-ceo-romance-series-to-binge",
    title: "What Are the Best CEO Romance Series to Binge?",
    blurb:
      "The best CEO romance series to binge on VERZA TV — cold bosses, secret softies, and office tension that explodes into love, all in vertical micro-episodes.",
    intro:
      "Looking for CEO romance series to binge? These VERZA TV picks explore the corner-office fantasy: the ruthless boss with a hidden heart, the assistant changed by one elevator kiss, and the young executive forbidden to fall in love. Sharp suits, sharper banter, and slow-burn tension unfold in short-form vertical episodes. Free-preview availability varies by title, with current access details on each title page.",
    match: (s) => has(s, "ceo", "boss", "office", "assistant", "executive", "corporate", "company"),
  },
  {
    slug: "best-vertical-dramas-2026",
    title: "What Are the Best Vertical Dramas of 2026?",
    blurb:
      "An editorial 2026 selection of VERZA TV vertical dramas — time-loop romances, inheritance games, thrillers, and catalog-ranked picks.",
    intro:
      "This 2026 editorial list combines titles in VERZA TV's New category with catalog-ranked picks. It spans time-loop romances, inheritance games, and thrillers filmed in cinematic 9:16 for phone-first viewing. The list reflects current catalog labels rather than real-time viewing data. Free-preview availability varies by title, and each page shows current access details.",
    match: (s) => s.categories.includes("new") || (s.popularRank ?? 99) <= 6,
  },
  {
    slug: "best-contract-marriage-dramas",
    title: "What Are the Best Contract Marriage Dramas?",
    blurb:
      "The best contract marriage dramas on VERZA TV — arranged deals, fake vows, and twelve-month agreements that turn into real love, all in vertical episodes.",
    intro:
      "Contract marriage dramas turn on one delicious tension: a deal that says nothing about love, signed by two people who proceed to fall anyway. These VERZA TV picks feature billion-dollar arrangements, trial marriages, and strangers bound by paperwork who slowly become each other's whole world. The slow burn between duty and desire unfolds in compact vertical episodes. Free-preview availability varies by title.",
    match: (s) => has(s, "contract", "marriage contract", "trial marriage", "married to a stranger", "arranged"),
  },
  {
    slug: "best-enemies-to-lovers-shows",
    title: "What Are the Best Enemies-to-Lovers Shows?",
    blurb:
      "The best enemies-to-lovers shows on VERZA TV — rivals, assassins, and sworn enemies whose hatred slow-burns into irresistible romance, free to start.",
    intro:
      "Enemies-to-lovers stories thrive on the friction between people who started out at war. This VERZA TV list brings together assassins hired to kill each other, rivals battling for the same empire, and reluctant partners whose arguments hide something neither will admit. Each story unfolds in short-form vertical episodes. Free-preview availability varies by title, with current access details on each title page.",
    match: (s) =>
      has(s, "rival", "enemy", "enemies", "assassin", "kill", "revenge romance", "conflicted", "blood contract", "killer romance"),
  },
  {
    slug: "best-forbidden-romance-series",
    title: "What Are the Best Forbidden Romance Series to Watch?",
    blurb:
      "The best forbidden romance series on VERZA TV — taboo attractions, secret affairs, and impossible love stories that break every rule, in vertical episodes.",
    intro:
      "Forbidden romance series thrive on one irresistible idea: the love you're not supposed to have is the one you can't resist. This VERZA TV collection explores taboo attractions, secret affairs, and impossible pairings that raise the stakes with every stolen moment. The tension unfolds in cinematic vertical episodes. Free-preview availability varies by title, and each title page shows current access options.",
    match: (s) => has(s, "forbidden", "affair", "mistress", "stepmom", "stepbrother", "godfather", "taboo", "escort"),
  },
  {
    slug: "best-reality-shows",
    title: "What Are the Best Reality-Style Shows on VERZA TV?",
    blurb:
      "The best reality-style shows on VERZA TV — pageants, dynasties, and tabloid-worthy scandals with the confessional-booth energy of unscripted television.",
    intro:
      "Reality-style shows feel different because they borrow the pulse of unscripted television. This list gathers VERZA TV stories about beauty pageants built on blackmail, fashion dynasties imploding on camera, and hopefuls entering a world of ambition and alliances. The scandals unfold through cinematic vertical storytelling. Free-preview availability varies by title, with current access details on each title page.",
    match: (s) =>
      s.categories.includes("reality") ||
      s.categories.includes("red-carpet") ||
      has(s, "reality", "pageant", "crown", "beauty queen", "honey gold", "fashion", "honey"),
  },
  {
    slug: "best-mafia-romance",
    title: "What Mafia Romance Titles Are in This Editorial List?",
    blurb:
      "The best mafia romance microdramas on VERZA TV — crime families, dangerous bodyguards, and forbidden love where loyalty is blood, all in vertical episodes.",
    intro:
      "Mafia romance lives in the space between loyalty and desire, where one wrong move can start a war. This VERZA TV collection enters crime families ruled by blood: bodyguards with divided loyalties, dons' daughters, and forbidden obsessions. Danger sharpens every glance in cinematic vertical episodes. Free-preview availability varies by title, and each title page shows current access options.",
    match: (s) => has(s, "mafia", "crime lord", "godfather", "don", "bodyguard", "crime family", "assassin", "blood contract"),
  },
  {
    slug: "best-short-dramas-for-beginners",
    title: "What Are the Best Short Dramas for Beginners?",
    blurb:
      "A beginner-friendly VERZA TV selection with clear stakes, memorable hooks, and short-form vertical storytelling.",
    intro:
      "New to vertical drama? This editorial list favors shorter VERZA TV series with clear stakes, quick hooks, and compact episodes built for phone-first viewing. It is a practical introduction to the format without claims about audience size or real-time popularity. Free-preview and full-access details are shown on each title page.",
    match: (s) => s.episodeCount > 0 && s.episodeCount <= 52,
  },
  {
    slug: "best-cliffhanger-series",
    title: "What Are the Best Cliffhanger Series to Binge?",
    blurb:
      "VERZA TV thrillers and mysteries built around cliffhangers, hidden identities, and escalating reveals.",
    intro:
      "This cliffhanger collection focuses on VERZA TV thrillers and mysteries with killers listening to the podcast hunting them, wives who might be murderers, and twins living each other's lives. Fast vertical chapters build suspense through secrets and escalating reveals. Free-preview availability varies by title, with current access details on each page.",
    match: (s) => has(s, "thriller", "suspense", "mystery", "murder", "psycho", "killer", "conspiracy", "secret"),
  },
  {
    slug: "best-free-microdramas",
    title: "What Are the Best Free Microdramas to Start Watching?",
    blurb:
      "VERZA TV microdramas with free-preview episodes, including select titles that are wholly free.",
    intro:
      "Every title selected for this list has at least one free episode, and select shorter titles are wholly free. The list is based on current catalog availability rather than conversion or audience-popularity claims. Open any title to see its exact free-episode count and current access details.",
    match: (s) => s.freeEpisodes > 0,
  },
  {
    slug: "best-second-chance-romance",
    title: "What Are the Best Second-Chance Romance Series?",
    blurb:
      "The best second-chance romance series on VERZA TV — lost loves reunited, memories rekindled, and couples fighting for the future they almost missed.",
    intro:
      "Second-chance romance asks one irresistible question: what if you got one more shot? This VERZA TV collection reunites lost loves and rekindles buried feelings through stories of timing, regret, and love that refuses to stay finished. Free-preview availability varies by title, and each title page shows current access options.",
    match: (s) => has(s, "lost love", "unforgettable", "betrayed", "once", "widow", "second", "reunite", "lost and found"),
  },
  {
    slug: "best-office-romance",
    title: "What Are the Best Office Romance Series to Watch?",
    blurb:
      "The best office romance series on VERZA TV — elevator kisses, forbidden workplace tension, and bosses you shouldn't fall for, all in vertical episodes.",
    intro:
      "Office romance turns the workplace into a charged setting. This VERZA TV collection explores vanished partners returning as bosses, elevator kisses, and affairs that complicate every Monday morning. Professional stakes meet personal chemistry in compact vertical episodes. Free-preview availability varies by title, with current access details on each page.",
    match: (s) => has(s, "office", "boss", "ceo", "assistant", "corporate", "company", "workplace", "obsessed with my boss"),
  },
  {
    slug: "best-dark-romance",
    title: "What Is the Best Dark Romance to Watch on VERZA TV?",
    blurb:
      "The best dark romance microdramas on VERZA TV — obsession, danger, and morally grey love stories where desire and destruction blur, in vertical episodes.",
    intro:
      "Dark romance trades sweetness for obsession, danger, and morally gray desire. This VERZA TV collection leans into secrets, possessive relationships, and choices that blur right and wrong. The stories unfold in cinematic vertical episodes. Free-preview availability varies by title, and each title page shows current access options.",
    match: (s) => has(s, "dark romance", "obsess", "she is mine", "mistress", "possessive", "desire", "escaping mistress"),
  },
];

/* ------------------------------------------------------------------ */
/*  Lookup                                                              */
/* ------------------------------------------------------------------ */

export function getBestList(slug: string): BestList | undefined {
  return BEST_LISTS.find((b) => b.slug === slug);
}
