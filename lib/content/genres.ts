/**
 * Genre Hub Definitions
 * Each genre has a slug, display name, description, and related tags.
 * editorialApproved gates indexability per SEO governance.
 *
 * `tags` drive the primary genre match against a series' `genre` string and
 * `tags` array. `matchTerms` (optional) widen the net with a broad title /
 * logline / genre keyword search so no approved hub renders an empty page.
 * `relatedSlugs` (optional) power the related-genre rail for internal linking.
 */

export interface GenreHub {
  slug: string;
  name: string;
  description: string;
  tags: string[];
  editorialApproved: boolean;
  /** Optional broad-match keywords searched across title/logline/genre. */
  matchTerms?: string[];
  /** Optional related hub slugs for the cross-link rail. */
  relatedSlugs?: string[];
}

export const GENRE_HUBS: GenreHub[] = [
  /* ---------------- existing hubs (kept) ---------------- */
  {
    slug: "romance",
    name: "Romance",
    description:
      "Fall into love stories that unfold in minutes. From billionaire affairs to secret marriages, Verza TV delivers cinematic romance in vertical micro-drama format — every episode a new twist.",
    tags: ["romance", "love", "billionaire", "drama"],
    matchTerms: ["love", "romance", "wife", "marry", "heart", "fall in love"],
    relatedSlugs: ["billionaire-romance", "office-romance", "second-chance", "forbidden-romance"],
    editorialApproved: true,
  },
  {
    slug: "billionaire-romance",
    name: "Billionaire Romance",
    description:
      "Luxury, power, and forbidden love. Verza TV's billionaire romance series feature CEO love interests, secret heirs, and glamorous high-stakes settings — all in binge-worthy micro-episodes.",
    tags: ["billionaire", "ceo", "romance", "luxury"],
    matchTerms: ["billionaire", "heiress", "empire", "fortune", "wealth", "ceo"],
    relatedSlugs: ["ceo-romance", "rags-to-riches", "contract-marriage", "celebrity-romance"],
    editorialApproved: true,
  },
  {
    slug: "revenge-drama",
    name: "Revenge Drama",
    description:
      "Betrayal demands justice. Watch wronged heroines plot their comeback in intense revenge dramas packed with twists, deception, and deeply satisfying payoffs — each episode under two minutes.",
    tags: ["revenge", "drama", "thriller", "betrayal"],
    matchTerms: ["revenge", "betray", "pay", "comeback", "vengeance", "left for dead"],
    relatedSlugs: ["revenge", "second-chance", "family-drama", "psychological-thriller"],
    editorialApproved: true,
  },
  {
    slug: "mystery",
    name: "Mystery",
    description:
      "Unravel secrets one episode at a time. Verza TV mystery series keep you guessing with cliffhangers, red herrings, and reveals — cold cases and hidden identities in vertical micro-drama format.",
    tags: ["mystery", "suspense", "thriller", "whodunit"],
    matchTerms: ["mystery", "secret", "missing", "cold case", "detective", "disappear"],
    relatedSlugs: ["gothic", "psychological-thriller", "romantic-thriller", "revenge"],
    editorialApproved: true,
  },
  {
    slug: "thriller",
    name: "Thriller",
    description:
      "Heart-pounding tension in every swipe. From psychological mind-games to crime-soaked suspense, Verza TV delivers edge-of-your-seat micro-dramas with reveals that hit in 60 seconds.",
    tags: ["thriller", "suspense", "action", "drama"],
    matchTerms: ["thriller", "kill", "murder", "suspense", "danger", "deadly"],
    relatedSlugs: ["psychological-thriller", "romantic-thriller", "mystery", "spy-romance"],
    editorialApproved: true,
  },

  /* ---------------- romance verticals ---------------- */
  {
    slug: "ceo-romance",
    name: "CEO Romance",
    description:
      "Cold boardroom tycoons who melt for one woman. Verza TV's CEO romance series pair ruthless executives with sharp heroines in office power-plays that turn into all-consuming love.",
    tags: ["ceo", "billionaire", "office", "boss"],
    matchTerms: ["ceo", "boss", "billion-dollar", "company", "empire", "executive"],
    relatedSlugs: ["billionaire-romance", "office-romance", "contract-marriage", "possessive-romance"],
    editorialApproved: true,
  },
  {
    slug: "contract-marriage",
    name: "Contract Marriage",
    description:
      "Twelve months, no feelings, one ironclad deal — until the heart breaks the contract. Verza TV's contract marriage micro-dramas turn marriages of convenience into undeniable obsession.",
    tags: ["contract", "marriage", "billionaire", "romance"],
    matchTerms: ["contract", "marry", "married", "trial marriage", "wife", "deal"],
    relatedSlugs: ["fake-marriage", "billionaire-romance", "enemies-to-lovers", "ceo-romance"],
    editorialApproved: true,
  },
  {
    slug: "fake-marriage",
    name: "Fake Marriage",
    description:
      "A staged wedding, a borrowed bride, a groom who knows. Verza TV's fake marriage series spin pretend vows and fake engagements into real, unstoppable romance — one cliffhanger at a time.",
    tags: ["marriage", "fake", "wrong bride", "romance"],
    matchTerms: ["fake", "wrong bride", "pretend", "fake girlfriend", "altar", "stand-in"],
    relatedSlugs: ["contract-marriage", "celebrity-romance", "enemies-to-lovers", "office-romance"],
    editorialApproved: true,
  },
  {
    slug: "enemies-to-lovers",
    name: "Enemies to Lovers",
    description:
      "They started a war and ended up in love. Verza TV's enemies-to-lovers micro-dramas pit rivals, exes, and sworn opponents against each other until the line between hate and desire vanishes.",
    tags: ["enemies", "rival", "romance", "betrayal"],
    matchTerms: ["rival", "ex", "war", "enemy", "jilted", "revenge"],
    relatedSlugs: ["second-chance", "ceo-romance", "contract-marriage", "office-romance"],
    editorialApproved: true,
  },
  {
    slug: "second-chance",
    name: "Second Chance Romance",
    description:
      "Lost loves get one more shot at forever. Verza TV's second-chance romances reunite estranged couples, returning exes, and old flames who never stopped loving — with everything on the line.",
    tags: ["second chance", "reunion", "lost love", "romance"],
    matchTerms: ["lost love", "returns", "back", "one year later", "reunite", "again"],
    relatedSlugs: ["enemies-to-lovers", "billionaire-romance", "forbidden-romance", "family-drama"],
    editorialApproved: true,
  },
  {
    slug: "forbidden-romance",
    name: "Forbidden Romance",
    description:
      "Love that breaks every rule. Verza TV's forbidden romance micro-dramas chase taboo attractions, secret affairs, and impossible pairings that could cost the lovers everything they have.",
    tags: ["forbidden", "secret", "affair", "taboo"],
    matchTerms: ["forbidden", "affair", "secret", "stepbrother", "stepmom", "godfather"],
    relatedSlugs: ["dark-romance", "mafia-romance", "steamy-romance", "office-romance"],
    editorialApproved: true,
  },
  {
    slug: "mafia-romance",
    name: "Mafia Romance",
    description:
      "Crime families, blood loyalty, and a love that could start a war. Verza TV's mafia romance series tie don's daughters and dangerous men together in high-stakes, high-heat micro-dramas.",
    tags: ["mafia", "crime", "dark", "romance"],
    matchTerms: ["mafia", "crime lord", "don", "godfather", "crime", "bloodline"],
    relatedSlugs: ["dark-romance", "forbidden-romance", "possessive-romance", "spy-romance"],
    editorialApproved: true,
  },
  {
    slug: "possessive-romance",
    name: "Possessive Romance",
    description:
      "Obsessive devotion that won't let go. Verza TV's possessive romance micro-dramas follow jealous heirs and protective men whose all-consuming love blurs into dangerous obsession.",
    tags: ["possessive", "obsession", "romance", "jealous"],
    matchTerms: ["possessive", "obsess", "mine", "she is mine", "promised", "won't let"],
    relatedSlugs: ["dark-romance", "mafia-romance", "forbidden-romance", "ceo-romance"],
    editorialApproved: true,
  },
  {
    slug: "office-romance",
    name: "Office Romance",
    description:
      "One elevator kiss can upend a career. Verza TV's office romance series turn boardrooms, late nights, and forbidden boss-assistant tension into binge-worthy workplace love stories.",
    tags: ["office", "boss", "workplace", "romance"],
    matchTerms: ["boss", "office", "assistant", "ceo", "elevator", "affair with my boss"],
    relatedSlugs: ["ceo-romance", "billionaire-romance", "enemies-to-lovers", "friends-to-lovers"],
    editorialApproved: true,
  },
  {
    slug: "friends-to-lovers",
    name: "Friends to Lovers",
    description:
      "The best love was standing right there all along. Verza TV's friends-to-lovers micro-dramas turn childhood bonds and lifelong friendships into the slow-burn romances fans crave.",
    tags: ["friends", "slow burn", "romance", "childhood"],
    matchTerms: ["friend", "best friend", "childhood", "if only", "drunken confession"],
    relatedSlugs: ["second-chance", "office-romance", "romance", "steamy-romance"],
    editorialApproved: true,
  },
  {
    slug: "dark-romance",
    name: "Dark Romance",
    description:
      "Love that lives in the shadows. Verza TV's dark romance series pull obsession, danger, and morally gray men into intense micro-dramas where desire and destruction are inseparable.",
    tags: ["dark", "obsession", "romance", "mafia"],
    matchTerms: ["dark", "mistress", "obsess", "mafia", "secret love", "burn the city"],
    relatedSlugs: ["mafia-romance", "possessive-romance", "forbidden-romance", "steamy-romance"],
    editorialApproved: true,
  },
  {
    slug: "steamy-romance",
    name: "Steamy Romance",
    description:
      "High heat, high stakes, no apologies. Verza TV's steamy romance micro-dramas turn one reckless night into a lifetime of tangled desire — sultry chemistry in every 60-second episode.",
    tags: ["steamy", "passion", "romance", "desire"],
    matchTerms: ["steamy", "one night", "desire", "tangled", "reckless night", "passion"],
    relatedSlugs: ["dark-romance", "forbidden-romance", "office-romance", "friends-to-lovers"],
    editorialApproved: true,
  },
  {
    slug: "spy-romance",
    name: "Spy Romance",
    description:
      "Secret agents, deep cover, and a target they were never supposed to love. Verza TV's spy romance series fuse espionage, betrayal, and undercover passion into pulse-racing micro-dramas.",
    tags: ["spy", "undercover", "romance", "agent"],
    matchTerms: ["spy", "undercover", "agent", "assassin", "bodyguard", "mission"],
    relatedSlugs: ["romantic-thriller", "mafia-romance", "forbidden-romance", "thriller"],
    editorialApproved: true,
  },
  {
    slug: "celebrity-romance",
    name: "Celebrity Romance",
    description:
      "Red carpets, fake girlfriends, and feelings that won't stay scripted. Verza TV's celebrity romance micro-dramas pair A-listers and pop stars with the people who see past the spotlight.",
    tags: ["celebrity", "fame", "romance", "star"],
    matchTerms: ["celebrity", "star", "pop star", "hollywood", "fame", "actress"],
    relatedSlugs: ["fake-marriage", "billionaire-romance", "office-romance", "psychological-thriller"],
    editorialApproved: true,
  },

  /* ---------------- thriller / drama verticals ---------------- */
  {
    slug: "romantic-thriller",
    name: "Romantic Thriller",
    description:
      "Love wrapped in danger. Verza TV's romantic thriller series chase assassins, hidden agendas, and deadly secrets where every kiss could be a trap — suspense and passion in equal measure.",
    tags: ["romantic thriller", "thriller", "suspense", "romance"],
    matchTerms: ["romantic thriller", "bodyguard", "assassin", "suspense", "killer", "agenda"],
    relatedSlugs: ["psychological-thriller", "spy-romance", "mystery", "dark-romance"],
    editorialApproved: true,
  },
  {
    slug: "psychological-thriller",
    name: "Psychological Thriller",
    description:
      "Trust no one — least of all yourself. Verza TV's psychological thriller micro-dramas unravel gaslighting spouses, hidden lives, and mind-bending reveals that twist reality in 60 seconds.",
    tags: ["psychological", "thriller", "suspense", "mind"],
    matchTerms: ["psychological", "wife wants to kill", "memory", "control", "lie", "psycho"],
    relatedSlugs: ["romantic-thriller", "mystery", "gothic", "revenge"],
    editorialApproved: true,
  },
  {
    slug: "gothic",
    name: "Gothic",
    description:
      "Crumbling estates, locked wings, and secrets that haunt bloodlines. Verza TV's gothic micro-dramas blend ghostly atmosphere with family mystery for slow-dread, can't-look-away viewing.",
    tags: ["gothic", "haunted", "mystery", "supernatural"],
    matchTerms: ["gothic", "haunted", "ghost", "mansion", "estate", "winter"],
    relatedSlugs: ["mystery", "psychological-thriller", "family-drama", "werewolf-fantasy"],
    editorialApproved: true,
  },
  {
    slug: "family-drama",
    name: "Family Drama",
    description:
      "Dynasties at war and secrets that detonate at dinner. Verza TV's family drama micro-dramas pit siblings, heirs, and rival sisters against each other over love, money, and bloodline truth.",
    tags: ["family", "drama", "dynasty", "sisters"],
    matchTerms: ["family", "sister", "siblings", "dynasty", "bloodline", "inheritance"],
    relatedSlugs: ["rags-to-riches", "revenge", "second-chance", "mystery"],
    editorialApproved: true,
  },
  {
    slug: "rags-to-riches",
    name: "Rags to Riches",
    description:
      "A nobody inherits everything — and the vultures circle. Verza TV's rags-to-riches micro-dramas follow waitresses and underdogs who rise into empires no one wanted them to rule.",
    tags: ["rags-to-riches", "underdog", "fortune", "drama"],
    matchTerms: ["rags-to-riches", "waitress", "inherits", "empire", "broke", "fortune"],
    relatedSlugs: ["billionaire-romance", "family-drama", "revenge", "celebrity-romance"],
    editorialApproved: true,
  },
  {
    slug: "revenge",
    name: "Revenge",
    description:
      "Wronged, written off, and ready to win. Verza TV's revenge micro-dramas deliver cunning comebacks and ice-cold payback as heroines turn betrayal into the ultimate power move.",
    tags: ["revenge", "payback", "betrayal", "comeback"],
    matchTerms: ["revenge", "vengeance", "pay", "badass", "left for dead", "comeback"],
    relatedSlugs: ["revenge-drama", "family-drama", "psychological-thriller", "enemies-to-lovers"],
    editorialApproved: true,
  },
  {
    slug: "time-travel",
    name: "Time Travel",
    description:
      "A second chance through a tear in time. Verza TV's time-travel micro-dramas send heroines back years or lifetimes to rewrite fate, outsmart enemies, and chase a love destiny denied.",
    tags: ["time travel", "sci-fi", "fate", "romance"],
    matchTerms: ["time", "past", "ten years", "twist of time", "lifetimes", "rewind"],
    relatedSlugs: ["werewolf-fantasy", "second-chance", "mystery", "forbidden-romance"],
    editorialApproved: true,
  },
  {
    slug: "werewolf-fantasy",
    name: "Werewolf Fantasy",
    description:
      "Fated mates, red threads, and a bond that defies death. Verza TV's werewolf and fantasy micro-dramas weave supernatural destiny into romance for fans of fated-mate, otherworldly love.",
    tags: ["werewolf", "fantasy", "supernatural", "fated"],
    matchTerms: ["fate", "fated", "supernatural", "lifetimes", "red thread", "tied by fate"],
    relatedSlugs: ["time-travel", "gothic", "forbidden-romance", "dark-romance"],
    editorialApproved: true,
  },
];

export function getGenreHub(slug: string): GenreHub | undefined {
  return GENRE_HUBS.find((g) => g.slug === slug);
}

export function getApprovedGenreHubs(): GenreHub[] {
  return GENRE_HUBS.filter((g) => g.editorialApproved);
}
