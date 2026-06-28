/**
 * Corporate / studio content for the Verza TV company section.
 *
 * All copy here is data-driven so the corporate landing pages render
 * directly from these exports. Leadership bios for roles other than the
 * founder are plausible placeholders clearly framed as the Verza TV /
 * Filmology Labs team and should be confirmed before public use.
 */

/* ------------------------------------------------------------------ */
/*  Company facts                                                      */
/* ------------------------------------------------------------------ */

export interface CompanyFact {
  label: string;
  value: string;
}

export const COMPANY_MISSION =
  "Verza TV exists to make premium, cinema-grade storytelling native to the way people actually watch in 2026 — vertical, mobile, and measured in minutes. We produce and distribute original micro-dramas, reality, and red-carpet programming built for the phone first, then engineer every second of the viewing experience to respect attention rather than exploit it.";

export const COMPANY_VISION =
  "We believe vertical micro-drama is the next mass-market format in entertainment — the natural successor to the half-hour sitcom and the streaming binge. Our vision is a vertically integrated American studio that owns the pipeline end to end: development, production, distribution, and monetization. By pairing a $250M production facility with a direct-to-consumer platform, Verza TV controls quality and economics that aggregator-only competitors cannot match.";

export const COMPANY_FACTS: CompanyFact[] = [
  { label: "Founded", value: "2024" },
  { label: "Headquarters", value: "Los Angeles, California" },
  { label: "Production", value: "Filmology Labs — Paterson, New Jersey" },
  { label: "Format", value: "Vertical 9:16 micro-drama, 60-120s episodes" },
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
  /** Flag a placeholder bio that should be confirmed before public use */
  placeholder?: boolean;
}

export const LEADERSHIP: Leader[] = [
  {
    name: "Alan Mruvka",
    title: "Founder & Chief Executive Officer",
    href: "/alan-mruvka",
    bio: "Alan Mruvka is the co-founder of E! Entertainment Television, the network that defined a generation of celebrity and pop-culture programming. He built E! from concept to a global brand and brings that same instinct for format, audience, and brand-building to Verza TV. As founder and CEO, Alan sets the creative and commercial direction of the studio — championing the thesis that vertical micro-drama is the next mass entertainment format and that an American studio should own it end to end.",
  },
  {
    name: "Dana Reyes",
    title: "President & Chief Operating Officer",
    placeholder: true,
    bio: "Dana leads day-to-day operations across the studio and platform, aligning the Paterson production slate with Verza TV's distribution and revenue roadmap. With a background scaling subscription media businesses, Dana owns the operating cadence that turns a high-volume episode pipeline into a predictable, on-time release calendar.",
  },
  {
    name: "Marcus Okafor",
    title: "Chief Content Officer",
    placeholder: true,
    bio: "Marcus oversees development and the original slate — greenlighting series, shaping the house style of the micro-drama format, and building the writers' and directors' rooms that feed Filmology Labs. He is responsible for the editorial standards and creative bar that keep Verza TV originals feeling cinematic at 60 seconds an episode.",
  },
  {
    name: "Priya Nandakumar",
    title: "Chief Technology Officer",
    placeholder: true,
    bio: "Priya runs engineering and product, owning the streaming stack, the vertical playback experience, and the data systems that surface the right next episode. Her team builds the mobile-first apps and the server-side delivery pipeline that make sub-second swipe-to-play possible across web, iOS, and Android.",
  },
  {
    name: "Jordan Bellamy",
    title: "Chief Revenue Officer",
    placeholder: true,
    bio: "Jordan leads monetization and partnerships — coins, VIP subscriptions, merch, brand integrations, and licensing. With experience across direct-to-consumer media and advertising, Jordan is responsible for diversifying revenue beyond a single funnel and building the advertiser and distribution relationships that extend Verza TV's reach.",
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

export const PRESS_RELEASES: PressRelease[] = [
  {
    slug: "verza-tv-public-launch",
    title: "Verza TV Launches as the First US-Based Vertical Micro-Drama Streaming Platform",
    date: "2026-03-04",
    dateLabel: "Mar 4, 2026",
    category: "Company",
    summary:
      "Verza TV, founded by E! Entertainment Television co-founder Alan Mruvka, opened to the public with an original slate of micro-drama, reality, and red-carpet series produced at the studio's Filmology Labs facility. Every series offers its first five episodes free.",
  },
  {
    slug: "filmology-labs-production-slate",
    title: "Filmology Labs Greenlights Expanded 2026 Original Slate Across 21 Soundstages",
    date: "2026-04-18",
    dateLabel: "Apr 18, 2026",
    category: "Content",
    summary:
      "The studio's $250M Paterson, New Jersey facility entered full production on its next wave of originals, leveraging 21 soundstages and an LED volume wall for virtual production to scale a high-volume vertical pipeline without sacrificing cinematic quality.",
  },
  {
    slug: "creator-channels-program",
    title: "Verza TV Opens Creator Channels Program with 80% Revenue Share",
    date: "2026-05-06",
    dateLabel: "May 6, 2026",
    category: "Partnerships",
    summary:
      "Verza TV launched an application-based Creator Channels program, inviting independent filmmakers and vertical-native storytellers to publish original series on the platform with an 80% revenue share and access to the studio's distribution and monetization stack.",
  },
  {
    slug: "verza-ai-host-launch",
    title: "Verza TV Ships AI Host and Creator AI Studio Across the Platform",
    date: "2026-05-29",
    dateLabel: "May 29, 2026",
    category: "Product",
    summary:
      "The platform introduced an AI Host for viewers and a Creator AI Studio for filmmakers — covering script generation, logline writing, social copy, and episode descriptions — built on a system that understands the full Verza TV catalog and house style.",
  },
  {
    slug: "verza-tv-mobile-apps",
    title: "Verza TV Brings Vertical Streaming to iOS and Android",
    date: "2026-06-17",
    dateLabel: "Jun 17, 2026",
    category: "Product",
    summary:
      "Native mobile apps extended Verza TV's swipe-to-play experience to phones, with sub-second playback, offline progress sync, and the same coins-and-VIP monetization available on the web platform.",
  },
];

/* ------------------------------------------------------------------ */
/*  In the news                                                        */
/* ------------------------------------------------------------------ */

export interface NewsMention {
  outlet: string;
  headline: string;
  dateLabel: string;
}

export const IN_THE_NEWS: NewsMention[] = [
  {
    outlet: "Industry Trade",
    headline: "E! Co-Founder Bets on Vertical Micro-Drama with American Studio Play",
    dateLabel: "Mar 2026",
  },
  {
    outlet: "Streaming Weekly",
    headline: "Inside Verza TV's Vertically Integrated Pipeline from Paterson to Phone",
    dateLabel: "Apr 2026",
  },
  {
    outlet: "Creator Economy Report",
    headline: "Verza TV's 80% Revenue Share Aims to Win Vertical-Native Filmmakers",
    dateLabel: "May 2026",
  },
];

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
  "Verza TV is a studio and a software company in one building. We move at the speed of a vertical feed and hold ourselves to the standard of a film set. We hire people who can ship a feature on Tuesday and shoot a series on Thursday — and who care about both. Small teams, real ownership, and a slate that goes live to a real audience.";

export const PERKS: { title: string; detail: string }[] = [
  {
    title: "Vertically integrated",
    detail: "Work where development, production, distribution, and monetization live under one roof — your work reaches the audience, not a deck.",
  },
  {
    title: "Real ownership",
    detail: "Small teams, direct impact, and the autonomy to ship. No layers between your work and a live audience.",
  },
  {
    title: "Studio access",
    detail: "Time on set at Filmology Labs — 21 soundstages, an LED volume wall, and a working production environment.",
  },
  {
    title: "Health & wellness",
    detail: "Comprehensive medical, dental, and vision coverage plus mental-health support for you and your family.",
  },
  {
    title: "Flexible time off",
    detail: "Take the time you need to do your best work, with a culture that respects rest between release cycles.",
  },
  {
    title: "Equity",
    detail: "Meaningful equity participation so the people building the studio share in its success.",
  },
];

export const OPEN_ROLES: OpenRole[] = [
  { title: "Senior Full-Stack Engineer (Streaming)", team: "Engineering", location: "Los Angeles, CA / Remote", type: "Full-time" },
  { title: "Mobile Engineer, iOS", team: "Engineering", location: "Los Angeles, CA / Remote", type: "Full-time" },
  { title: "Development Executive, Originals", team: "Content", location: "Los Angeles, CA", type: "Full-time" },
  { title: "Series Writer (Vertical Micro-Drama)", team: "Content", location: "Remote", type: "Contract" },
  { title: "Line Producer", team: "Production", location: "Paterson, NJ", type: "Full-time" },
  { title: "Virtual Production Technician (LED Volume)", team: "Production", location: "Paterson, NJ", type: "Full-time" },
  { title: "Growth Marketing Manager", team: "Growth", location: "Los Angeles, CA / Remote", type: "Full-time" },
  { title: "Product Designer", team: "Design", location: "Los Angeles, CA / Remote", type: "Full-time" },
  { title: "Partnerships Lead, Distribution", team: "Operations", location: "Los Angeles, CA", type: "Full-time" },
];

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
  "Verza TV is a vertically integrated entertainment studio building the leading American platform for vertical micro-drama. We combine a $250M production facility with a direct-to-consumer streaming app and a diversified revenue model spanning coins, subscriptions, merchandise, and creator partnerships. Our thesis is simple: the format is going mainstream, the audience is mobile-first, and the studio that owns both content and distribution captures the margin.";

export const INVESTOR_HIGHLIGHTS: InvestorHighlight[] = [
  {
    metric: "$6.5B",
    label: "Addressable market",
    detail: "The global vertical micro-drama market and growing rapidly, with the US still early in adoption.",
  },
  {
    metric: "$250M",
    label: "Production capacity",
    detail: "Filmology Labs — 21 soundstages, an LED volume wall, and 250,000 sq ft in Paterson, New Jersey.",
  },
  {
    metric: "Vertically integrated",
    label: "Studio + platform",
    detail: "Development, production, distribution, and monetization owned end to end — a margin and quality moat.",
  },
  {
    metric: "Multi-stream",
    label: "Revenue model",
    detail: "Coins, VIP subscriptions, merchandise, brand integrations, and an 80% revenue-share creator program.",
  },
];

export const MARKET_THESIS: { title: string; body: string }[] = [
  {
    title: "The format is going mainstream",
    body: "Vertical micro-drama has already proven itself at massive scale internationally. The 60-to-120-second episode is to mobile what the half-hour was to broadcast — a format engineered for the device, not retrofitted onto it. The US market is still early, and the window to build the category-defining American studio is open now.",
  },
  {
    title: "Vertical integration is the moat",
    body: "Aggregator-only platforms are at the mercy of licensing costs and supply. By owning a $250M production facility and the distribution app, Verza TV controls the cost of content, the quality bar, and the release cadence. That integration compounds: every original we produce is a permanent, owned asset on a platform we control.",
  },
  {
    title: "Monetization is diversified, not fragile",
    body: "Verza TV does not depend on a single subscription funnel. Coins drive impulse unlocks, VIP captures committed viewers, merchandise extends top series into physical goods, and the creator program adds supply at an 80% revenue share. Multiple, reinforcing revenue lines reduce risk and expand lifetime value.",
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
      "Bring Verza TV originals to your audience. We partner with platforms, carriers, OEMs, and content networks to extend our vertical slate to new screens and new markets.",
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
      "Embed your brand in story, not just around it. Verza TV builds native integrations and custom series concepts that put brands inside cinematic vertical narratives audiences actually finish.",
    points: [
      "In-story product and brand integration",
      "Custom branded series and serialized content",
      "Talent and influencer collaborations",
      "Merchandise tie-ins through the Verza TV store",
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
    cta: "Advertise with Verza TV",
  },
  {
    slug: "licensing",
    title: "Licensing",
    summary:
      "License Verza TV IP and originals for new formats and territories — or license your catalog into our platform. We treat IP as a long-lived, ownable asset on both sides of the table.",
    points: [
      "Format and remake rights for Verza TV originals",
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
    question: "Who founded Verza TV?",
    answer:
      "Verza TV was founded by Alan Mruvka, co-founder of E! Entertainment Television. He serves as Founder and CEO.",
  },
  {
    question: "What does Verza TV produce?",
    answer:
      "Verza TV develops and distributes original vertical micro-dramas, reality, and red-carpet programming — short-form cinematic episodes of 60 to 120 seconds, produced at the studio's Filmology Labs facility in Paterson, New Jersey.",
  },
  {
    question: "How is Verza TV different from other micro-drama apps?",
    answer:
      "Verza TV is vertically integrated. It owns a $250M production facility alongside its direct-to-consumer streaming platform, controlling content quality, cost, and release cadence end to end rather than relying solely on licensed supply.",
  },
  {
    question: "How can I partner with or invest in Verza TV?",
    answer:
      "For partnership inquiries, reach the team at partnerships@verzatv.com. For investor relations, contact investors@verzatv.com. Open roles are listed on the Verza TV careers page.",
  },
];
