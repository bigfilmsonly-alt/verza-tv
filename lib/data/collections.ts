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
    title: "The Most Binge-Worthy Series on VERZA TV",
    blurb:
      "A curated shelf of longer VERZA TV micro-dramas with at least 55 episodes and room for layered, season-length arcs.",
    intro:
      "This collection gathers longer VERZA TV series with layered plots and at least 55 episodes. The selection is based on catalog episode counts rather than viewing-time or audience-behavior claims. Free-preview availability varies by title, and each title page shows current access options.",
    match: (s) => s.episodeCount >= 55,
  },
  {
    slug: "best-billionaire-romances",
    title: "Best Billionaire Romances on VERZA TV",
    blurb:
      "Luxury, power, and forbidden chemistry. The best billionaire romance micro-dramas on VERZA TV — secret heirs, corporate empires, and love that costs everything.",
    intro:
      "Private jets, penthouse boardrooms, and a heart that money cannot buy. VERZA TV's billionaire romances pair impossible wealth with impossible odds: cold CEOs, secret heirs, and unexpected inheritances. Contract marriages and dynasty wars unfold in cinematic vertical episodes. Free-preview availability varies by title, with current access details on each page.",
    match: (s) => has(s, "billionaire", "ceo", "empire", "heir", "tycoon", "fortune"),
  },
  {
    slug: "top-revenge-dramas",
    title: "Top Revenge Dramas on VERZA TV",
    blurb:
      "She was wronged — now she's back. The top revenge micro-dramas on VERZA TV deliver cunning comebacks, power plays, and satisfying payback in vertical episodes.",
    intro:
      "This editorial collection rounds up VERZA TV revenge dramas about women left for dead, jilted at the altar, or underestimated, who return with a plan. Boardroom takedowns and explosive weddings turn betrayal into a blueprint for justice. Free-preview availability varies by title, and each title page shows current access options.",
    match: (s) =>
      has(s, "revenge", "vengeance", "payback", "badass", "left for dead", "wronged") ||
      s.genre.toLowerCase().includes("revenge"),
  },
  {
    slug: "staff-picks",
    title: "Staff Picks: Editor's Favorite Series on VERZA TV",
    blurb:
      "Hand-picked by the VERZA TV team from catalog-ranked titles and story-driven favorites.",
    intro:
      "Staff Picks combines VERZA TV's catalog-ranked titles with a few story-driven favorites selected by the editorial team. The list is a curated recommendation, not a real-time most-watched or conversion chart. Open any title to see its episode count, free-preview availability, and current access details.",
    match: (s) => (s.popularRank ?? 99) <= 6 || has(s, "mistress", "blackthorne", "ceo"),
  },
  {
    slug: "reality-favorites",
    title: "Reality & Drama Favorites on VERZA TV",
    blurb:
      "Real drama, real people, unreal stories. VERZA TV's reality-flavored favorites — pageants, dynasties, and scandals that feel ripped from the tabloids.",
    intro:
      "This collection celebrates VERZA TV series with a reality-TV pulse: beauty pageants built on blackmail, fashion dynasties imploding on camera, and small-town hopefuls entering a world of ambition. They bring confessional-booth energy to cinematic vertical storytelling. Free-preview and current access details appear on each title page.",
    match: (s) =>
      s.categories.includes("reality") ||
      s.categories.includes("red-carpet") ||
      has(s, "reality", "pageant", "crown", "beauty queen", "honey gold", "fashion"),
  },
  {
    slug: "top-cliffhangers",
    title: "Top Cliffhanger Series on VERZA TV",
    blurb:
      "VERZA TV thrillers and mysteries selected for cliffhangers, hidden identities, and escalating reveals.",
    intro:
      "This collection gathers VERZA TV psychological thrillers, cold-case mysteries, and suspense stories built around cliffhangers. Killers listen to the podcast hunting them, wives may be murderers, and twins live each other's lives. Free-preview availability varies by title, with current access details on each page.",
    match: (s) =>
      has(s, "thriller", "suspense", "mystery", "murder", "psycho", "killer", "secret", "conspiracy"),
  },
  {
    slug: "new-and-trending",
    title: "New & Trending Series on VERZA TV",
    blurb:
      "A curated mix of titles in VERZA TV's New category and catalog-ranked picks.",
    intro:
      "New & Trending combines titles assigned to VERZA TV's New category with catalog-ranked picks. It is an editorial collection rather than a real-time most-watched chart. From time-loop romances to inheritance games, each title page shows the current episode count, free-preview availability, and access details.",
    match: (s) => s.categories.includes("new") || (s.popularRank ?? 99) <= 6,
  },
  {
    slug: "steamiest",
    title: "Steamiest Romance Series on VERZA TV",
    blurb:
      "Turn up the heat. VERZA TV's steamiest romance micro-dramas — one-night stands, dark obsessions, and forbidden desire told in sizzling vertical episodes.",
    intro:
      "For viewers who want romance with the temperature dialed up, this collection gathers VERZA TV stories about reckless one-night stands, dark obsessions, and forbidden attractions. The chemistry is electric and the stakes are personal. Free-preview availability varies by title, with current access details on each page.",
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
    title: "Long-Form Series on VERZA TV",
    blurb:
      "VERZA TV micro-dramas with at least 56 episodes and room for layered, season-length storytelling.",
    intro:
      "This collection is selected by a verifiable catalog rule: every title currently has at least 56 episodes. The longer format gives each story more room for layered plots and character turns without promising a particular ending or viewing time. Each title page shows its free-preview availability and current access details.",
    match: (s) => s.episodeCount >= 56,
  },
  {
    slug: "contract-marriage-classics",
    title: "Contract Marriage Classics on VERZA TV",
    blurb:
      "Twelve months, no feelings — until there are. VERZA TV's contract marriage micro-dramas: arranged deals, fake vows, and love that breaks the agreement.",
    intro:
      "Contract marriage stories begin with a transaction and follow what happens when fake vows turn real. This VERZA TV collection includes billion-dollar arrangements, twelve-month deals, and marriages of convenience, with each series leaning into the tension between duty and desire. Free-preview availability varies by title.",
    match: (s) =>
      has(s, "contract", "marriage contract", "trial marriage", "married to a stranger", "arranged", "trial"),
  },
  {
    slug: "enemies-to-lovers",
    title: "Enemies-to-Lovers Series on VERZA TV",
    blurb:
      "From rivals to romance. VERZA TV's best enemies-to-lovers micro-dramas — sparring partners, sworn enemies, and the slow burns that turn hate into heat.",
    intro:
      "This enemies-to-lovers collection brings together VERZA TV stories about assassins hired to kill one another, rivals fighting for the same empire, and reluctant partners whose arguments hide something neither will admit. Free-preview availability varies by title, with current access details on each page.",
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
    title: "CEO Romance Series on VERZA TV",
    blurb:
      "Boardroom power meets bedroom chemistry. VERZA TV's best CEO romance micro-dramas — cold bosses, secret softies, and the assistants who unravel them.",
    intro:
      "He runs a billion-dollar company and answers to no one — until the right person walks into his office. VERZA TV's CEO romances pair corner-office power with hidden vulnerability: the rude boss who secretly pays the hospital bills, the assistant changed by one elevator kiss, and the executive forbidden to fall in love. Free-preview availability varies by title.",
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
