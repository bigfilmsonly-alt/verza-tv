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
      "The best billionaire romance microdramas on Verza TV, ranked for bingeing — secret heirs, contract marriages, and CEOs who fall hard, all in vertical episodes.",
    intro:
      "If you're searching for the best billionaire romance microdramas, Verza TV is where the genre lives at full volume. We've gathered the originals that nail the fantasy — the secret heir, the cold tycoon, the waitress who inherits an empire and the board that wants her gone. Each one delivers high-stakes love in cinematic 60-second vertical episodes you can binge on a commute or before bed. These picks balance over-the-top wealth with real emotional payoff, which is exactly why they top our charts. Every title starts free with the first five episodes, so you can find your favorite before unlocking the rest with coins.",
    match: (s) => has(s, "billionaire", "ceo", "empire", "heir", "tycoon", "fortune", "trial marriage"),
  },
  {
    slug: "best-revenge-short-dramas",
    title: "What Are the Best Revenge Short Dramas Right Now?",
    blurb:
      "The best revenge short dramas on Verza TV — cunning comebacks, boardroom takedowns, and satisfying payback delivered in addictive 60-second vertical episodes.",
    intro:
      "The best revenge short dramas turn heartbreak into strategy, and Verza TV has the most satisfying collection of them anywhere. These are the stories of women who were left for dead, jilted, or underestimated, then came back with a plan and the nerve to execute it. No melodrama, just methodical payback — boardroom takeovers, weddings that detonate, and enemies who never see it coming. Told in vertical micro-episodes, each comeback lands fast and hits hard. Start any series free with five episodes, then unlock the full arc to watch justice unfold one perfectly timed move at a time. This is catharsis on a phone screen.",
    match: (s) => has(s, "revenge", "vengeance", "payback", "badass", "wronged", "left for dead"),
  },
  {
    slug: "best-ceo-romance-series-to-binge",
    title: "What Are the Best CEO Romance Series to Binge?",
    blurb:
      "The best CEO romance series to binge on Verza TV — cold bosses, secret softies, and office tension that explodes into love, all in vertical micro-episodes.",
    intro:
      "Looking for the best CEO romance series to binge? Verza TV specializes in the corner-office fantasy: the ruthless boss with a hidden heart, the assistant who survives one elevator kiss, the young executive forbidden to fall in love. These picks pair sharp suits with sharper banter and the slow-burn tension that makes 'will the boss notice me' the most addictive question in vertical drama. Each series runs in fast 60-second episodes, perfect for marathoning through a lazy afternoon. Begin free with the first five episodes of any title, then unlock the rest with coins to see the deal sealed. Power has never been this romantic.",
    match: (s) => has(s, "ceo", "boss", "office", "assistant", "executive", "corporate", "company"),
  },
  {
    slug: "best-vertical-dramas-2026",
    title: "What Are the Best Vertical Dramas of 2026?",
    blurb:
      "The best vertical dramas of 2026 on Verza TV — the buzziest new originals and top-ranked hits everyone is swiping through this year, free to start.",
    intro:
      "The best vertical dramas of 2026 are defined by momentum — the new releases generating buzz and the ranked hits viewers can't stop recommending. This list curates Verza TV's freshest originals alongside its most popular titles, giving you a snapshot of exactly what's worth your time right now. From time-loop romances to inheritance games to breakout thrillers, these are the shows shaping the conversation this year. Each is filmed in cinematic 9:16 for phone-first viewing, with full-season arcs told in 60-second episodes. Start any series free with five episodes, then unlock the rest. Consider this your shortlist for staying ahead of the trend.",
    match: (s) => s.categories.includes("new") || (s.popularRank ?? 99) <= 6,
  },
  {
    slug: "best-contract-marriage-dramas",
    title: "What Are the Best Contract Marriage Dramas?",
    blurb:
      "The best contract marriage dramas on Verza TV — arranged deals, fake vows, and twelve-month agreements that turn into real love, all in vertical episodes.",
    intro:
      "The best contract marriage dramas live and die on one delicious tension: a deal that says nothing about love, signed by two people who proceed to fall anyway. Verza TV has perfected the trope. These picks feature billion-dollar arrangements, trial marriages, and strangers bound by paperwork who slowly become each other's whole world. The premise never gets old because the payoff is always worth the wait. Every series here leans hard into the slow burn between duty and desire, told in addictive 60-second vertical episodes. Start free with the first five, then unlock the rest with coins to watch the contract unravel into something real.",
    match: (s) => has(s, "contract", "marriage contract", "trial marriage", "married to a stranger", "arranged"),
  },
  {
    slug: "best-enemies-to-lovers-shows",
    title: "What Are the Best Enemies-to-Lovers Shows?",
    blurb:
      "The best enemies-to-lovers shows on Verza TV — rivals, assassins, and sworn enemies whose hatred slow-burns into irresistible romance, free to start.",
    intro:
      "The best enemies-to-lovers shows understand that nobody falls harder than two people who started out at war. Verza TV's collection delivers exactly that friction — assassins hired to kill each other, rivals battling for the same empire, and reluctant partners whose every argument hides something neither will admit. The push and pull is the entire appeal, and these micro-dramas know how to stretch the tension to its breaking point before the walls finally fall. Each story unfolds in fast vertical episodes built for bingeing. Start any series free with five episodes, then unlock the slow, satisfying conversion from sworn enemy to soulmate.",
    match: (s) =>
      has(s, "rival", "enemy", "enemies", "assassin", "kill", "revenge romance", "conflicted", "blood contract", "killer romance"),
  },
  {
    slug: "best-forbidden-romance-series",
    title: "What Are the Best Forbidden Romance Series to Watch?",
    blurb:
      "The best forbidden romance series on Verza TV — taboo attractions, secret affairs, and impossible love stories that break every rule, in vertical episodes.",
    intro:
      "The best forbidden romance series thrive on one irresistible idea: the love you're not supposed to have is the one you can't resist. Verza TV's collection explores every flavor of taboo — the godfather's daughter, the stepbrother stranger, the commanding officer back home, the professor's husband. Each story turns impossibility into intensity, raising the stakes with every stolen moment. These micro-dramas deliver maximum tension in cinematic 60-second vertical episodes, perfect for bingeing in secret yourself. Start any series free with the first five episodes, then unlock the full arc with coins to see whether forbidden love survives the consequences. Some rules exist to be broken.",
    match: (s) => has(s, "forbidden", "affair", "mistress", "stepmom", "stepbrother", "godfather", "taboo", "escort"),
  },
  {
    slug: "best-reality-shows",
    title: "What Are the Best Reality-Style Shows on Verza TV?",
    blurb:
      "The best reality-style shows on Verza TV — pageants, dynasties, and tabloid-worthy scandals with the confessional-booth energy of unscripted television.",
    intro:
      "The best reality-style shows hit different because they feel like they could be real. This list gathers Verza TV originals with an unscripted pulse — beauty pageants built on blackmail, fashion dynasties imploding on live television, and small-town hopefuls thrown into a glittering world of cameras and cutthroat ambition. They carry the alliance-and-betrayal energy of your favorite reality TV, supercharged with cinematic vertical storytelling. Every title runs in addictive 60-second episodes, so the scandals land fast and hit hard. Start any series free with five episodes, then unlock the rest with coins. If you live for drama that feels a little too close to home, start here.",
    match: (s) =>
      s.categories.includes("reality") ||
      s.categories.includes("red-carpet") ||
      has(s, "reality", "pageant", "crown", "beauty queen", "honey gold", "fashion", "honey"),
  },
  {
    slug: "best-mafia-romance",
    title: "What Is the Best Mafia Romance to Watch Right Now?",
    blurb:
      "The best mafia romance microdramas on Verza TV — crime families, dangerous bodyguards, and forbidden love where loyalty is blood, all in vertical episodes.",
    intro:
      "The best mafia romance lives in the space between loyalty and desire, where one wrong move starts a war. Verza TV's collection drops you inside crime families ruled by blood — the bodyguard sent to kill the woman he falls for, the don's daughter who is the one debt nobody can afford, the mafia son hiding a forbidden obsession. Danger sharpens every glance and raises the cost of every kiss. These micro-dramas pack lethal tension into cinematic 60-second vertical episodes. Start any series free with five episodes, then unlock the full arc with coins to find out whether love can survive a world this dangerous.",
    match: (s) => has(s, "mafia", "crime lord", "godfather", "don", "bodyguard", "crime family", "assassin", "blood contract"),
  },
  {
    slug: "best-short-dramas-for-beginners",
    title: "What Are the Best Short Dramas for Beginners?",
    blurb:
      "The best short dramas for beginners on Verza TV — accessible, instantly addictive micro-series that are the perfect introduction to vertical drama, free to start.",
    intro:
      "New to vertical drama? The best short dramas for beginners are the ones that hook you instantly and don't demand a huge commitment to feel rewarding. This list curates Verza TV's most approachable originals — tightly told stories with clear stakes, irresistible hooks, and satisfying payoffs that show exactly why millions are obsessed with the format. Each runs in 60-second episodes you can sample on a coffee break, with the first five always free. There's no wrong place to start, but these picks make the easiest on-ramp into the world of micro-drama. Try one, and you'll understand the appeal before the first episode ends.",
    match: (s) => s.episodeCount > 0 && s.episodeCount <= 52,
  },
  {
    slug: "best-cliffhanger-series",
    title: "What Are the Best Cliffhanger Series to Binge?",
    blurb:
      "The best cliffhanger series on Verza TV — thrillers and mysteries where every episode ends on a gasp, making 'one more' impossible to resist.",
    intro:
      "The best cliffhanger series weaponize a single promise: the next twist is always sixty seconds away. Verza TV's most relentless thrillers and mysteries are engineered to make stopping impossible — killers who listen to the podcast hunting them, wives who might be murderers, twins quietly living each other's lives. Every episode slams shut on a reveal you didn't see coming, and every reveal demands the next one. Told in fast vertical episodes, these shows are how a quick break becomes a lost evening. Start any series free with five episodes, then brace yourself, because once the hooks land, your thumb won't stop swiping.",
    match: (s) => has(s, "thriller", "suspense", "mystery", "murder", "psycho", "killer", "conspiracy", "secret"),
  },
  {
    slug: "best-free-microdramas",
    title: "What Are the Best Free Microdramas to Start Watching?",
    blurb:
      "The best free microdramas on Verza TV — every series starts with free episodes so you can binge the hottest vertical dramas without spending a coin.",
    intro:
      "Every great Verza TV series starts free, which makes 'the best free microdramas' an easy promise to keep. This list curates the originals worth opening first — the highest-converting hits and most-loved titles that give you the strongest possible sense of the format before you spend anything. The first five episodes of each are completely free, and a few series go even further. It's the no-risk way to discover why vertical drama has taken over phone screens everywhere. Pick a title, watch your free episodes, and decide which world is worth unlocking with coins. There's no better place to start your micro-drama habit.",
    match: (s) => s.freeEpisodes >= 5,
  },
  {
    slug: "best-second-chance-romance",
    title: "What Are the Best Second-Chance Romance Series?",
    blurb:
      "The best second-chance romance series on Verza TV — lost loves reunited, memories rekindled, and couples fighting for the future they almost missed.",
    intro:
      "The best second-chance romance series ask the question we all secretly love: what if you got one more shot? Verza TV's collection reunites lost loves and rekindles buried feelings — the billionaire who lost her once and won't lose her again, the man who erased her from his memory only to feel everything when she returns, the widow who finds love hiding in the past. These are stories of timing, regret, and the kind of love that refuses to stay finished. Told in cinematic vertical episodes, each starts free with five. Unlock the rest with coins to find out whether the second chance becomes forever.",
    match: (s) => has(s, "lost love", "unforgettable", "betrayed", "once", "widow", "second", "reunite", "lost and found"),
  },
  {
    slug: "best-office-romance",
    title: "What Are the Best Office Romance Series to Watch?",
    blurb:
      "The best office romance series on Verza TV — elevator kisses, forbidden workplace tension, and bosses you shouldn't fall for, all in vertical episodes.",
    intro:
      "The best office romance series turn the workplace into the most charged room in the building. Verza TV's collection lives for that tension — the single mom whose new boss is the father who vanished, the assistant undone by one elevator kiss, the affair that complicates every Monday morning. Mixing professional stakes with personal chemistry, these micro-dramas make 'just colleagues' the most loaded phrase in vertical drama. Each story unfolds in addictive 60-second episodes built to binge. Start any series free with the first five episodes, then unlock the rest with coins to see whether the romance survives the org chart. Clock in, fall hard.",
    match: (s) => has(s, "office", "boss", "ceo", "assistant", "corporate", "company", "workplace", "obsessed with my boss"),
  },
  {
    slug: "best-dark-romance",
    title: "What Is the Best Dark Romance to Watch on Verza TV?",
    blurb:
      "The best dark romance microdramas on Verza TV — obsession, danger, and morally grey love stories where desire and destruction blur, in vertical episodes.",
    intro:
      "The best dark romance refuses the easy happy ending, trading sweetness for obsession, danger, and morally grey desire. Verza TV's collection leans into the shadows — the secret kept for five years, the love that always gets what it wants no matter the cost, the obsessions that blur right and wrong until you can't tell them apart. These are intense, possessive, unapologetic love stories for viewers who like their romance with teeth. Told in cinematic vertical episodes, each delivers maximum tension fast. Start any series free with five episodes, then unlock the full arc with coins. Be warned: not every story here ends the way you hope.",
    match: (s) => has(s, "dark romance", "obsess", "she is mine", "mistress", "possessive", "desire", "escaping mistress"),
  },
];

/* ------------------------------------------------------------------ */
/*  Lookup                                                              */
/* ------------------------------------------------------------------ */

export function getBestList(slug: string): BestList | undefined {
  return BEST_LISTS.find((b) => b.slug === slug);
}
