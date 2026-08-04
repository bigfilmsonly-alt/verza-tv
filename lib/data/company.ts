/**
 * Corporate / studio content for the VERZA TV company section.
 *
 * All copy here is data-driven so the corporate landing pages render
 * directly from these exports. Only verified public identities and neutral,
 * currently supportable company facts belong in this module.
 */

/* ------------------------------------------------------------------ */
/*  Company facts                                                      */
/* ------------------------------------------------------------------ */

export interface CompanyFact {
  label: string;
  value: string;
}

export const COMPANY_MISSION =
  "VERZA TV exists to make premium short-form storytelling native to phone-first viewing. We distribute vertical micro-dramas, reality, and red-carpet programming through web and mobile experiences designed around the vertical screen.";

export const COMPANY_VISION =
  "VERZA TV's vision is to connect short-form production through Filmology Labs with direct-to-consumer distribution across web and mobile. This structure coordinates development, production, playback, and audience access.";

export const COMPANY_FACTS: CompanyFact[] = [
  { label: "Production", value: "Filmology Labs — Paterson, New Jersey" },
  { label: "Format", value: "Short-form vertical 9:16 series" },
  { label: "Platforms", value: "Web, iOS, Android" },
  { label: "Founder", value: "Alan Mruvka, co-founder of E! Entertainment Television" },
];

/* ------------------------------------------------------------------ */
/*  Leadership                                                         */
/* ------------------------------------------------------------------ */

export interface Leader {
  name: string;
  title: string;
  bio: string;
  /** Optional internal hub link (e.g. the founder) */
  href?: string;
}

export const LEADERSHIP: Leader[] = [
  {
    name: "Alan Mruvka",
    title: "Founder & Chief Executive Officer",
    href: "/alan-mruvka",
    bio: "Alan Mruvka co-founded E! Entertainment Television. He is the founder and CEO of VERZA TV, where he leads the company's work in short-form vertical entertainment.",
  },
];

/* ------------------------------------------------------------------ */
/*  Press releases / newsroom                                          */
/* ------------------------------------------------------------------ */

export interface PressRelease {
  slug: string;
  title: string;
  /** ISO date string */
  date: string;
  /** Short human-readable label, e.g. "Mar 4, 2026" */
  dateLabel: string;
  category: "Company" | "Content" | "Product" | "Partnerships";
  summary: string;
}

// Add releases only after they are published through a real company channel.
export const PRESS_RELEASES: PressRelease[] = [];

/* ------------------------------------------------------------------ */
/*  In the news                                                        */
/* ------------------------------------------------------------------ */

export interface NewsMention {
  outlet: string;
  headline: string;
  dateLabel: string;
}

// Add coverage only when a real publication URL and headline can be verified.
export const IN_THE_NEWS: NewsMention[] = [];

/* ------------------------------------------------------------------ */
/*  Careers                                                            */
/* ------------------------------------------------------------------ */

export interface OpenRole {
  title: string;
  team: "Production" | "Engineering" | "Content" | "Growth" | "Operations" | "Design";
  location: string;
  type: "Full-time" | "Contract";
}

export const CAREERS_CULTURE =
  "VERZA TV works across short-form production and streaming software. Confirmed openings, employment terms, and benefits are published only when an active role is available.";

export const PERKS: { title: string; detail: string }[] = [];

export const OPEN_ROLES: OpenRole[] = [];

export const CAREERS_EMAIL = "careers@verzatv.com";

/* ------------------------------------------------------------------ */
/*  Investors                                                          */
/* ------------------------------------------------------------------ */

export interface InvestorHighlight {
  metric: string;
  label: string;
  detail: string;
}

export const INVESTOR_OVERVIEW =
  "VERZA TV is a vertically integrated entertainment studio building an American platform for vertical micro-drama. We combine production through Filmology Labs with a direct-to-consumer streaming app and a revenue model spanning one-time Series Unlocks, VIP subscriptions, merchandise, and creator partnerships. Our thesis is that a mobile-first studio combining content and distribution can control more of its viewer experience.";

export const INVESTOR_HIGHLIGHTS: InvestorHighlight[] = [
  {
    metric: "Studio + platform",
    label: "Operating model",
    detail: "Production through Filmology Labs paired with direct-to-consumer web and mobile distribution.",
  },
  {
    metric: "Multiple options",
    label: "Revenue model",
    detail: "One-time Series Unlocks, VIP subscriptions, merchandise, brand integrations, and creator partnerships.",
  },
];

export const MARKET_THESIS: { title: string; body: string }[] = [
  {
    title: "Phone-first format",
    body: "Vertical micro-drama is a short-form format engineered for phone-first viewing rather than retrofitted onto it. VERZA TV's strategy is to build an American studio and direct-to-consumer platform around that format.",
  },
  {
    title: "Production and distribution",
    body: "Aggregator-only platforms depend on licensing costs and supply. By combining production through Filmology Labs with the distribution app, VERZA TV can coordinate content, quality standards, and release planning while honoring applicable rights and availability windows.",
  },
  {
    title: "Multiple access options",
    body: "VERZA TV does not depend on a single subscription funnel. One-time Series Unlocks provide title-specific access, VIP serves recurring viewers, merchandise covers physical goods, and creator partnerships can add supply. These are distinct revenue lines with different customer needs.",
  },
];

export const INVESTOR_EMAIL = "investors@verzatv.com";

/* ------------------------------------------------------------------ */
/*  Partnerships                                                       */
/* ------------------------------------------------------------------ */

export interface PartnershipCategory {
  slug: string;
  title: string;
  summary: string;
  /** Bullet points describing what the partnership offers */
  points: string[];
  cta: string;
}

export const PARTNERSHIPS: PartnershipCategory[] = [
  {
    slug: "distribution",
    title: "Distribution",
    summary:
      "Bring VERZA TV originals to your audience. We partner with platforms, carriers, OEMs, and content networks to extend our vertical slate to new screens and new markets.",
    points: [
      "Syndication of original micro-drama and reality series",
      "Co-branded channels and curated collections",
      "App pre-loads, carrier bundles, and OEM placements",
      "International windowing and localization",
    ],
    cta: "Discuss distribution",
  },
  {
    slug: "brand",
    title: "Brand Partnerships",
    summary:
      "Embed your brand in story, not just around it. VERZA TV builds native integrations and custom series concepts that put brands inside cinematic vertical narratives audiences actually finish.",
    points: [
      "In-story product and brand integration",
      "Custom branded series and serialized content",
      "Talent and influencer collaborations",
      "Merchandise tie-ins through the VERZA TV store",
    ],
    cta: "Build a brand partnership",
  },
  {
    slug: "advertisers",
    title: "Advertisers",
    summary:
      "Reach a mobile-first, high-intent audience in a premium, brand-safe environment. Our vertical-native ad experiences are designed to perform without breaking the viewing flow.",
    points: [
      "Vertical-native ad formats built for the feed",
      "Sponsorships of series, categories, and collections",
      "Brand-safe, premium original inventory",
      "Performance reporting and audience insights",
    ],
    cta: "Advertise with VERZA TV",
  },
  {
    slug: "licensing",
    title: "Licensing",
    summary:
      "License VERZA TV IP and originals for new formats and territories — or license your catalog into our platform. We treat IP as a long-lived, ownable asset on both sides of the table.",
    points: [
      "Format and remake rights for VERZA TV originals",
      "Territory and platform licensing",
      "Catalog acquisition and content supply deals",
      "Merchandising and consumer-products rights",
    ],
    cta: "Explore licensing",
  },
];

export const PARTNERSHIPS_EMAIL = "partnerships@verzatv.com";

/* ------------------------------------------------------------------ */
/*  Brand assets                                                       */
/* ------------------------------------------------------------------ */

export interface BrandColor {
  name: string;
  hex: string;
  usage: string;
}

export const BRAND_VOICE: { title: string; detail: string }[] = [
  {
    title: "Cinematic, not casual",
    detail: "We write like a studio, not a feed. Confident, vivid, and editorial — every line earns its place the way every second of an episode does.",
  },
  {
    title: "Bold but precise",
    detail: "We make strong claims and back them with specifics. No filler, no hype for its own sake. The drama is in the story, not the adjectives.",
  },
  {
    title: "Audience-first",
    detail: "We respect attention. Copy is tight, scannable, and rewarding — the same standard we hold for the viewing experience itself.",
  },
];

export const TYPOGRAPHY_NOTES: { name: string; role: string; detail: string }[] = [
  {
    name: "Display & headings",
    role: "Bold, high-contrast sans-serif",
    detail: "Headlines run heavy and tight for an editorial, premium feel. Reserve the largest weights for page titles and hero statements.",
  },
  {
    name: "Body",
    role: "Clean, legible sans-serif",
    detail: "Set body copy at relaxed line-height for comfortable mobile reading. Favor short paragraphs and clear hierarchy.",
  },
  {
    name: "Labels & eyebrows",
    role: "Uppercase, letter-spaced",
    detail: "Section labels use uppercase with wide tracking in the brand accent to anchor structure without competing with headings.",
  },
];

/* ------------------------------------------------------------------ */
/*  Frequently asked — corporate / partner inquiries                  */
/* ------------------------------------------------------------------ */

export const COMPANY_FAQ: { question: string; answer: string }[] = [
  {
    question: "Who founded VERZA TV?",
    answer:
      "VERZA TV was founded by Alan Mruvka, co-founder of E! Entertainment Television. He serves as Founder and CEO.",
  },
  {
    question: "What does VERZA TV produce?",
    answer:
      "VERZA TV develops and distributes short-form vertical micro-dramas, reality, and red-carpet programming produced through Filmology Labs in Paterson, New Jersey. Episode lengths vary by title.",
  },
  {
    question: "How is VERZA TV different from other micro-drama apps?",
    answer:
      "VERZA TV connects production work through Filmology Labs with a direct-to-consumer streaming platform across web and mobile, rather than operating only as a third-party catalog aggregator.",
  },
  {
    question: "How can I partner with or invest in VERZA TV?",
    answer:
      "For partnership inquiries, reach the team at partnerships@verzatv.com. For investor relations, contact investors@verzatv.com. Any confirmed openings will be listed on the VERZA TV careers page.",
  },
];
