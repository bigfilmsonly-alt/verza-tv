import type { Series } from "@/lib/catalog";

/* ------------------------------------------------------------------ */
/*  Collection model                                                   */
/* ------------------------------------------------------------------ */

export interface Collection {
  slug: string;
  title: string;
  /** 150-160 char meta description, unique per collection */
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
/*  Match helpers — keyword search over title/logline/genre           */
/* ------------------------------------------------------------------ */

function text(s: Series): string {
  return `${s.title} ${s.logline} ${s.genre}`.toLowerCase();
}

function has(s: Series, ...keywords: string[]): boolean {
  const t = text(s);
  return keywords.some((k) => t.includes(k.toLowerCase()));
}

/* ------------------------------------------------------------------ */
/*  Collections                                                        */
/* ------------------------------------------------------------------ */

export const COLLECTIONS: Collection[] = [
  {
    slug: "most-binge-worthy",
    title: "The Most Binge-Worthy Series on Verza TV",
    blurb:
      "The Verza TV series you cannot stop watching — our longest, most addictive micro-dramas with 55+ episodes built to be devoured in one sitting.",
    intro:
      "Some stories grab you in the first sixty seconds and refuse to let go. This collection gathers the deepest, most addictive series on Verza TV — the ones with the longest episode counts and the kind of momentum that turns a quick break into a three-hour marathon. Every title here runs 55 episodes or more, which means a full, satisfying arc with twists stacked on twists. Start free with the first five episodes of any series, then unlock the rest with coins. If you're looking for a show you can lose an entire weekend to, start at the top and work your way down.",
    match: (s) => s.episodeCount >= 55,
  },
  {
    slug: "best-billionaire-romances",
    title: "Best Billionaire Romances on Verza TV",
    blurb:
      "Luxury, power, and forbidden chemistry. The best billionaire romance micro-dramas on Verza TV — secret heirs, corporate empires, and love that costs everything.",
    intro:
      "Private jets, penthouse boardrooms, and a heart that money cannot buy. Verza TV's billionaire romances pair impossible wealth with impossible odds — the cold CEO who melts for one person, the secret heir hiding in plain sight, the waitress who inherits an empire overnight. These are the fantasies that made vertical drama a phenomenon, told in cinematic 60-second episodes you can binge anywhere. Each series starts free with five episodes so you can fall for the slow burn before you commit. Expect contract marriages, dynasty wars, and the kind of will-they-won't-they tension that keeps you swiping until sunrise.",
    match: (s) => has(s, "billionaire", "ceo", "empire", "heir", "tycoon", "fortune"),
  },
  {
    slug: "top-revenge-dramas",
    title: "Top Revenge Dramas on Verza TV",
    blurb:
      "She was wronged — now she's back. The top revenge micro-dramas on Verza TV deliver cunning comebacks, power plays, and satisfying payback in vertical episodes.",
    intro:
      "There is nothing quite as satisfying as a perfectly executed comeback. This collection rounds up Verza TV's most cathartic revenge dramas — stories of women left for dead, jilted at the altar, or underestimated by everyone, who return with a plan and the patience to see it through. No tears, just receipts. From boardroom takedowns to weddings that detonate at exactly the right moment, these micro-dramas turn betrayal into a blueprint for justice. Begin any series free with five episodes, then unlock the full arc to watch every domino fall. Payback has never been this bingeable.",
    match: (s) =>
      has(s, "revenge", "vengeance", "payback", "badass", "left for dead", "wronged") ||
      s.genre.toLowerCase().includes("revenge"),
  },
  {
    slug: "staff-picks",
    title: "Staff Picks: Editor's Favorite Series on Verza TV",
    blurb:
      "Hand-picked by the Verza TV team. Our staff picks spotlight the most talked-about, highest-converting micro-dramas — the series we tell everyone to watch first.",
    intro:
      "When new viewers ask us where to start, this is the shortlist we send. Staff Picks gathers the Verza TV originals our team can't stop recommending — the breakout hits, the cliffhanger machines, and the slow burns that earned a permanent spot in our group chat. These are our most popular ranked titles plus a few hidden gems we think deserve the spotlight. Every series here is live, complete, and built to hook you fast. Start free with five episodes of any pick, then decide which world you want to live in for the next few hours. Consider this your fast pass to the best of Verza TV.",
    match: (s) => (s.popularRank ?? 99) <= 6 || has(s, "mistress", "blackthorne", "ceo"),
  },
  {
    slug: "reality-favorites",
    title: "Reality & Drama Favorites on Verza TV",
    blurb:
      "Real drama, real people, unreal stories. Verza TV's reality-flavored favorites — pageants, dynasties, and scandals that feel ripped from the tabloids.",
    intro:
      "Not every great story is fiction — and the ones that feel real are often the most addictive. This collection celebrates Verza TV series with a reality-TV pulse: beauty pageants built on blackmail, fashion dynasties imploding on live television, and small-town hopefuls thrown into a world of cameras and cutthroat ambition. They've got the confessional-booth energy of your favorite unscripted shows, dialed up with cinematic vertical storytelling. Start free with the first five episodes of any title, then settle in for the scandals, alliances, and betrayals. If you live for drama that feels a little too close to real life, this is your shelf.",
    match: (s) =>
      s.categories.includes("reality") ||
      s.categories.includes("red-carpet") ||
      has(s, "reality", "pageant", "crown", "beauty queen", "honey gold", "fashion"),
  },
  {
    slug: "top-cliffhangers",
    title: "Top Cliffhanger Series on Verza TV",
    blurb:
      "Every episode ends on a gasp. Verza TV's top cliffhanger micro-dramas — thrillers and mysteries engineered to make 'one more episode' impossible to resist.",
    intro:
      "The best vertical dramas are built on a simple promise: the next twist is always sixty seconds away. This collection gathers Verza TV's most relentless cliffhanger machines — psychological thrillers, cold-case mysteries, and suspense stories where every episode slams shut on a reveal you didn't see coming. Killers who listen to the podcast hunting them. Wives who may be murderers. Twins living each other's lives. These are the shows that quietly delete your evening. Start free with five episodes, then brace yourself, because once the hooks land, stopping is not an option. Keep your thumb ready and your expectations subverted.",
    match: (s) =>
      has(s, "thriller", "suspense", "mystery", "murder", "psycho", "killer", "secret", "conspiracy"),
  },
  {
    slug: "new-and-trending",
    title: "New & Trending Series on Verza TV",
    blurb:
      "Fresh off the lineup and climbing fast. Verza TV's new and trending micro-dramas — the latest originals everyone's swiping through right now.",
    intro:
      "The lineup never stops growing, and these are the titles making noise right now. New & Trending pulls together Verza TV's freshest originals alongside the popular ranked series viewers are racing through this week. It's the perfect place to stay ahead of the conversation — the shows that are about to be everywhere, before everyone else catches on. From time-loop romances to inheritance games, every entry is live and ready to binge. Start free with the first five episodes of any series, then jump into whatever's trending. Bookmark this collection and check back often; the freshest drama lands here first.",
    match: (s) => s.categories.includes("new") || (s.popularRank ?? 99) <= 6,
  },
  {
    slug: "steamiest",
    title: "Steamiest Romance Series on Verza TV",
    blurb:
      "Turn up the heat. Verza TV's steamiest romance micro-dramas — one-night stands, dark obsessions, and forbidden desire told in sizzling vertical episodes.",
    intro:
      "For when you want your romance with the temperature dialed all the way up. This collection gathers Verza TV's most intense, pulse-quickening love stories — reckless one-night stands that turn into something dangerous, dark obsessions that blur right and wrong, and forbidden attractions neither character can resist. The chemistry is electric, the stakes are personal, and the slow burns are anything but slow. Every series starts free with five episodes, so you can feel the spark before you unlock the full arc. If you like your micro-dramas with serious heat and emotional payoff in equal measure, you've found your collection.",
    match: (s) =>
      has(
        s,
        "steamy",
        "obsess",
        "desire",
        "one night",
        "affair",
        "mistress",
        "dark romance",
        "escort",
        "tangled",
      ),
  },
  {
    slug: "best-endings",
    title: "Series With the Best Endings on Verza TV",
    blurb:
      "Stories that stick the landing. Verza TV micro-dramas with the most satisfying, full-circle endings — complete arcs worth bingeing all the way through.",
    intro:
      "A great drama earns its final scene. This collection spotlights Verza TV series built on complete, satisfying arcs — the longer originals with enough runway to set up every payoff and deliver a finale that actually lands. These are full-season stories told in vertical episodes, where the slow burns resolve, the villains get what's coming, and the last beat feels earned rather than rushed. With 56 episodes or more, each title has room to breathe and a destination worth reaching. Start free with five episodes, then commit to the journey knowing the ending won't let you down. Perfect for viewers who hate being left hanging.",
    match: (s) => s.episodeCount >= 56,
  },
  {
    slug: "contract-marriage-classics",
    title: "Contract Marriage Classics on Verza TV",
    blurb:
      "Twelve months, no feelings — until there are. Verza TV's contract marriage micro-dramas: arranged deals, fake vows, and love that breaks the agreement.",
    intro:
      "It starts as a transaction and ends as the love story of the year. Contract marriage is the genre that defined vertical drama, and Verza TV has the definitive collection — billion-dollar arrangements, twelve-month deals, and fake vows that turn devastatingly real. The premise is always the same and somehow never gets old: two people sign a contract that says nothing about falling in love, then proceed to fall anyway. Each series here leans into the trope's irresistible tension between duty and desire. Start free with five episodes, then watch the agreement unravel one heartbeat at a time. If 'arranged but in love' is your weakness, settle in.",
    match: (s) =>
      has(s, "contract", "marriage contract", "trial marriage", "married to a stranger", "arranged", "trial"),
  },
  {
    slug: "enemies-to-lovers",
    title: "Enemies-to-Lovers Series on Verza TV",
    blurb:
      "From rivals to romance. Verza TV's best enemies-to-lovers micro-dramas — sparring partners, sworn enemies, and the slow burns that turn hate into heat.",
    intro:
      "Nobody falls harder than two people who started out hating each other. This collection celebrates Verza TV's finest enemies-to-lovers stories — assassins hired to kill one another, rivals fighting for the same empire, and reluctant partners whose every argument crackles with something neither will admit. The push-and-pull is the whole point, and these micro-dramas know exactly how to draw out the tension before the walls finally come down. Start free with five episodes of any series, then savor the slow conversion from sworn enemy to soulmate. If you love a romance that makes you wait, fight, and earn the kiss, this is the shelf for you.",
    match: (s) =>
      has(
        s,
        "rival",
        "enemy",
        "enemies",
        "assassin",
        "kill",
        "revenge romance",
        "conflicted",
        "two worlds",
        "blood contract",
        "killer romance",
      ),
  },
  {
    slug: "ceo-romance",
    title: "CEO Romance Series on Verza TV",
    blurb:
      "Boardroom power meets bedroom chemistry. Verza TV's best CEO romance micro-dramas — cold bosses, secret softies, and the assistants who unravel them.",
    intro:
      "He runs a billion-dollar company and answers to no one — until the right person walks into his office. Verza TV's CEO romances pair corner-office power with the kind of vulnerability money can't manufacture: the rude boss who secretly pays the hospital bills, the assistant who survives one elevator kiss, the young executive forbidden to fall in love. These are workplace fantasies with sharp suits and sharper banter, told in addictive vertical episodes. Each series starts free with five episodes, so you can feel the tension build before the deal is sealed. If 'will the boss notice me' is your favorite question, this collection has the answers.",
    match: (s) =>
      has(s, "ceo", "boss", "office", "assistant", "executive", "corporate", "company", "boardroom"),
  },
];

/* ------------------------------------------------------------------ */
/*  Lookup                                                              */
/* ------------------------------------------------------------------ */

export function getCollection(slug: string): Collection | undefined {
  return COLLECTIONS.find((c) => c.slug === slug);
}
