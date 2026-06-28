/**
 * ALAN MRUVKA — entity-authority data for the Founder Hub.
 *
 * Powers /alan-mruvka (hub) and /alan-mruvka/[slug] (subpages).
 * Goal: own the "Alan Mruvka" / "E! co-founder" search entity with
 * Person + sameAs structured data and substantive, accurate biographical copy.
 *
 * Editorial note: biographical claims are kept general and non-defamatory.
 * Forward-looking statements about Verza TV are framed as vision, not fact.
 */

/**
 * Authoritative cross-references for the Alan Mruvka entity.
 * Used as the `sameAs` array on the Person JSON-LD so search engines can
 * reconcile this page with the same person across the web.
 *
 * Where an exact public profile handle is not independently confirmed,
 * we use the canonical site search URL for that platform so the link
 * resolves to the correct entity rather than an unverified profile.
 */
export const ALAN_SAMEAS: string[] = [
  "https://en.wikipedia.org/wiki/E!",
  "https://www.imdb.com/find/?q=Alan%20Mruvka",
  "https://www.linkedin.com/pub/dir/Alan/Mruvka",
  "https://www.crunchbase.com/textsearch?q=Alan%20Mruvka",
  "https://www.instagram.com/verzatv",
  "https://www.verzatv.com/founder",
];

export interface AlanSubpage {
  slug: string;
  /** Used in <h1> and nav links */
  title: string;
  /** 150-160 char meta description */
  blurb: string;
  /** 80-150 word introduction paragraph */
  intro: string;
  /** Substantive content sections */
  sections: { heading: string; body: string }[];
}

export const ALAN_SUBPAGES: AlanSubpage[] = [
  {
    slug: "biography",
    title: "Alan Mruvka — Biography",
    blurb:
      "The biography of Alan Mruvka: co-founder of E! Entertainment Television, media entrepreneur, and founder of Verza TV, the vertical micro-drama platform.",
    intro:
      "Alan Mruvka is an American media entrepreneur best known as a co-founder of E! Entertainment Television, one of the most recognizable names in pop-culture broadcasting. Across a career spent building and backing entertainment ventures, he has consistently looked for the next way audiences want to consume stories — and consistently bet on it early. Today he is the founder of Verza TV, a US-based vertical micro-drama streaming platform. This biography traces the throughline of that career: a founder's instinct for timing, a producer's eye for what audiences actually watch, and a builder's appetite for launching something from nothing.",
    sections: [
      {
        heading: "Early entrepreneurial path",
        body: "Long before streaming, Alan Mruvka was drawn to the business of entertainment — the unglamorous work of structuring deals, raising capital, and turning a programming idea into a channel that real people could tune into. That foundation in the commercial mechanics of media, rather than only its creative side, would define how he approached every venture that followed. He learned early that great content needs a great business around it to reach an audience at scale.",
      },
      {
        heading: "Co-founding E! Entertainment Television",
        body: "Mruvka is widely recognized as a co-founder of E! Entertainment Television, the cable network devoted to celebrity news, red-carpet coverage, and entertainment programming. E! grew from a startup cable concept into a global brand carried in more than 90 countries, helping define how a generation followed pop culture. Being part of that founding story placed Mruvka at the center of one of the defining entertainment launches of the cable era.",
      },
      {
        heading: "A career across media ventures",
        body: "Beyond E!, Mruvka's career has spanned production, real estate around the entertainment industry, and the financing of creative ventures. The common thread is a willingness to operate at the intersection of content and commerce — to see a shift in how audiences behave and to build the company that serves it. That pattern recognition is what drew him to vertical, mobile-first storytelling.",
      },
      {
        heading: "Founding Verza TV",
        body: "With Verza TV, Mruvka returned to the role he knows best: founder. The platform is built around premium vertical micro-dramas — cinematic stories told in 60-to-120-second episodes designed for the phone. As he frames it, the move from linear television to mobile-first short-form is the same kind of audience shift that made E! possible decades ago, and Verza TV is his bet on owning it in the United States.",
      },
    ],
  },
  {
    slug: "e-entertainment-legacy",
    title: "Alan Mruvka and the E! Entertainment Legacy",
    blurb:
      "How Alan Mruvka helped co-found E! Entertainment Television and why that pop-culture legacy informs the way he is building Verza TV today.",
    intro:
      "To understand Alan Mruvka as a founder, start with E! Entertainment Television. As a co-founder, he helped launch a network that turned celebrity culture, red carpets, and entertainment news into appointment viewing — a brand that eventually reached audiences in more than 90 countries. This page looks at what the E! launch represented, the lessons it carries, and how that legacy shapes the editorial DNA of Verza TV, his current venture. The connection is not nostalgia; it is method. The same instinct for where audiences are headed runs through both stories.",
    sections: [
      {
        heading: "What E! changed about entertainment media",
        body: "Before E!, pop culture coverage was scattered across magazines, tabloids, and the occasional broadcast segment. E! Entertainment Television consolidated it into a dedicated channel with its own voice — fast, accessible, and unapologetically obsessed with celebrity and entertainment. It helped normalize the idea that following the entertainment industry was itself a form of entertainment, a premise that now underpins much of social media and streaming.",
      },
      {
        heading: "Building a brand from a startup concept",
        body: "E! did not begin as a giant; it began as a cable startup that had to earn carriage, build an audience, and prove the format. Co-founding a network meant doing the hard early work of convincing operators and advertisers that pop culture deserved its own destination. That experience — launching a media brand into a skeptical market and watching it become a household name — is exactly the kind of zero-to-one challenge Mruvka has taken on again with Verza TV.",
      },
      {
        heading: "From cable carriage to the phone screen",
        body: "The distribution problem has changed shape. Where E! once fought for a slot in the cable lineup, today the battle is for a slot on the home screen and in the scroll. Mruvka frames Verza TV as the same play in a new medium: identify the format audiences are migrating toward — vertical, short, serialized — and build the premium home for it before incumbents adapt.",
      },
      {
        heading: "Why the legacy matters for Verza TV",
        body: "The E! legacy gives Verza TV more than a founder's resume. It supplies a worldview: that entertainment is a consumer business, that timing beats scale, and that a clearly defined brand can outrun better-funded competitors. Those principles, drawn directly from co-founding E!, are the operating assumptions behind how Verza TV approaches content, distribution, and audience.",
      },
    ],
  },
  {
    slug: "vision",
    title: "Alan Mruvka's Vision for Verza TV",
    blurb:
      "Alan Mruvka's vision for Verza TV: premium vertical micro-dramas built for a mobile-first generation, and the future of short-form serialized storytelling.",
    intro:
      "Alan Mruvka's vision for Verza TV is forward-looking by design. Having helped build entertainment for the cable era, he sees the current moment as another inflection point — the migration of audiences from linear, horizontal viewing to vertical, mobile-first consumption. This page lays out that vision as he frames it: where he believes entertainment is heading, what Verza TV is trying to become, and why he believes premium vertical micro-dramas are not a novelty but the next durable format. These are aspirational statements about direction and intent, not guarantees of outcome.",
    sections: [
      {
        heading: "The next audience shift",
        body: "Mruvka's central thesis is that consumption habits, not technology alone, define the next big entertainment opportunity. Audiences increasingly watch in fragments — between tasks, in line, before sleep — and they watch on a phone held vertically. His vision treats that behavior as permanent and asks what premium entertainment built natively for it should look like, rather than retrofitting horizontal content to a vertical world.",
      },
      {
        heading: "Premium, not disposable",
        body: "The vision for Verza TV is explicitly about quality. Short does not have to mean cheap. Mruvka envisions micro-dramas with real production values, cinematic craft, and writing engineered around the hook-per-episode rhythm the format rewards. The aim he describes is to make vertical storytelling something audiences respect, not merely scroll past — to do for micro-dramas what early premium cable did for the half-hour series.",
      },
      {
        heading: "A US-built home for the format",
        body: "Vertical micro-dramas have surged internationally, and Mruvka's stated vision is to build a strong US-based platform purpose-built for that format and an American and global audience. Verza TV is positioned as that home: originals, a defined brand voice, and a viewing experience designed first for the phone rather than ported from television.",
      },
      {
        heading: "Where this is headed",
        body: "Looking ahead, Mruvka frames Verza TV as a long-term play on the way stories are told and monetized on mobile — from how seasons are structured to how creators participate in the economics. He describes a future in which a phone-native, vertical platform sits alongside the streaming giants as a legitimate category of its own. That is the vision; the work is building toward it.",
      },
    ],
  },
  {
    slug: "press",
    title: "Alan Mruvka — Press and Media Resources",
    blurb:
      "Press resources for Alan Mruvka, co-founder of E! Entertainment Television and founder of Verza TV. Background, talking points, and media contact.",
    intro:
      "This page is a reference for journalists, editors, and researchers covering Alan Mruvka or Verza TV. It collects the verified essentials — who he is, what he has built, and how to reach the company — alongside the themes he most often speaks to. For interviews, commentary, or fact-checking, the Verza TV press team is the right starting point. We ask that biographical references stay accurate and general; where details are uncertain, the press team can confirm specifics rather than relying on secondhand sources.",
    sections: [
      {
        heading: "Verified background, in brief",
        body: "Alan Mruvka is an American media entrepreneur, a co-founder of E! Entertainment Television, and the founder of Verza TV, a US-based vertical micro-drama streaming platform. His career spans the cable era's defining entertainment launch and a current venture built around mobile-first, short-form serialized storytelling.",
      },
      {
        heading: "Themes he speaks to",
        body: "Common interview topics include the history and lessons of co-founding E!, the rise of vertical micro-dramas, how audience behavior — not technology alone — drives format shifts, the case for premium short-form content, and what it takes to launch a media brand into a market dominated by incumbents. He is a useful voice on both the entertainment-business and the founder-journey angles.",
      },
      {
        heading: "Usage and accuracy",
        body: "When citing Alan Mruvka, please describe him as a co-founder of E! Entertainment Television and founder of Verza TV. Forward-looking statements about Verza TV should be attributed as his vision or stated goals rather than as established results. For confirmation of any specific date, figure, or claim, contact the press team before publication.",
      },
      {
        heading: "Media contact",
        body: "Press inquiries can be directed to press@verzatv.com. The team can arrange interviews, provide approved background, supply brand assets, and verify details for fact-checking. For company-level context, the Verza TV About and Company pages provide additional approved information.",
      },
    ],
  },
  {
    slug: "interviews",
    title: "Alan Mruvka — Interviews and Talking Points",
    blurb:
      "Interview themes and talking points from Alan Mruvka, E! co-founder and Verza TV founder, on micro-dramas, audience shifts, and building media brands.",
    intro:
      "This page gathers the questions Alan Mruvka is most often asked and the perspectives he returns to in conversation — useful for producers booking him, writers preparing a profile, or anyone trying to understand how he thinks. The framing below reflects his stated views and vision rather than a transcript of any single interview. For an on-the-record conversation, the Verza TV press team can coordinate scheduling and confirm which topics are available for a given outlet.",
    sections: [
      {
        heading: "On co-founding E! Entertainment Television",
        body: "Asked about E!, Mruvka tends to focus less on celebrity and more on the founder mechanics: how a cable startup earned its place, what it took to convince operators and advertisers, and why a clearly defined brand could win against larger players. The recurring lesson he draws is that entertainment is a consumer business, and timing matters as much as budget.",
      },
      {
        heading: "On the rise of vertical micro-dramas",
        body: "On format, he frames vertical micro-dramas as a genuine shift rather than a fad — the storytelling logic of serialized drama married to the runtime and framing of social video. He argues that audiences have already voted with their thumbs, and the open question is who builds the premium, US-based home for the format first.",
      },
      {
        heading: "On building Verza TV",
        body: "Asked about Verza TV, he speaks in terms of vision and intent: a phone-native platform, premium production values, original series, and an experience designed for how people actually watch today. He is careful to frame ambitious statements as goals the company is working toward, not outcomes already achieved.",
      },
      {
        heading: "Booking and coordination",
        body: "To request an interview or confirm available talking points, contact press@verzatv.com. The team can match the conversation to an outlet's angle — entertainment business, the founder journey, or the future of mobile storytelling — and provide approved background to support the piece.",
      },
    ],
  },
];

export function getAlanSubpage(slug: string): AlanSubpage | undefined {
  return ALAN_SUBPAGES.find((p) => p.slug === slug);
}
