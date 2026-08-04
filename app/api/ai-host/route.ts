import { NextRequest, NextResponse } from "next/server";
import { getLiveSeries } from "@/lib/catalog";
import { VIP_PLANS } from "@/lib/config";
import {
  vipSubscriptionCheckoutEnabled,
  vipYearlyCheckoutEnabled,
} from "@/lib/vip-release-policy";

function releaseCapability(capability: () => boolean): boolean {
  try {
    return capability() === true;
  } catch {
    return false;
  }
}

const MONTHLY_VIP_AVAILABLE = releaseCapability(
  vipSubscriptionCheckoutEnabled,
);
const YEARLY_VIP_AVAILABLE = releaseCapability(vipYearlyCheckoutEnabled);
const VIP_PRICING_FACTS = [
  MONTHLY_VIP_AVAILABLE
    ? `- VIP Monthly: $${(VIP_PLANS.monthly.cents / 100).toFixed(2)}/month for paid-access episodes while active`
    : null,
  YEARLY_VIP_AVAILABLE
    ? `- VIP Yearly: $${(VIP_PLANS.yearly.cents / 100).toFixed(2)}/year for paid-access episodes while active`
    : null,
].filter((fact): fact is string => fact !== null);
const VIP_AVAILABILITY_FACT = VIP_PRICING_FACTS.length
  ? VIP_PRICING_FACTS.join("\n")
  : "- VIP checkout is not currently available; never quote a VIP plan or price unless it is shown on the supported purchase surface";
const VIP_AVAILABILITY_SENTENCE = VIP_PRICING_FACTS.length
  ? ` Available VIP checkout: ${VIP_PRICING_FACTS.map((fact) => fact.slice(2)).join("; ")}. Any displayed VIP plan auto-renews until canceled.`
  : " VIP checkout is not currently available.";

const LIVE_SERIES = getLiveSeries();
const PAID_SERIES = LIVE_SERIES.filter(
  (series) =>
    series.episodeCount > series.freeEpisodes && series.coinPerEpisode > 0,
);
const FULLY_FREE_SERIES = LIVE_SERIES.filter(
  (series) => !PAID_SERIES.some((paid) => paid.slug === series.slug),
);
const TOTAL_LIVE_EPISODES = LIVE_SERIES.reduce(
  (total, series) => total + series.episodeCount,
  0,
);
const EDITORIAL_PICKS = [...LIVE_SERIES]
  .sort(
    (left, right) =>
      (left.popularRank ?? Number.MAX_SAFE_INTEGER) -
      (right.popularRank ?? Number.MAX_SAFE_INTEGER),
  )
  .slice(0, 5);
const CATALOG_CONTEXT = LIVE_SERIES.map((series) => {
  const access =
    series.episodeCount <= series.freeEpisodes || series.coinPerEpisode <= 0
      ? "all episodes currently free"
      : `${series.freeEpisodes} free episodes; remaining episodes require existing access or a $1.99 Series Unlock`;
  return `- ${series.title} (${series.episodeCount} episodes; ${series.genre}; ${access}): ${series.logline}`;
}).join("\n");

// Launch catalog guide. Provider-backed generation is intentionally disabled
// until a complete, tested production integration is configured. The legacy
// specialized modes fail closed instead of returning catalog fallback text as
// if it were generated creator content.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Mode = "chat" | "creator" | "seo" | "marketing" | "moderate";

const VALID_MODES: ReadonlySet<string> = new Set<Mode>([
  "chat",
  "creator",
  "seo",
  "marketing",
  "moderate",
]);

// ---------------------------------------------------------------------------
// System prompts per mode
// ---------------------------------------------------------------------------

const SYSTEM_PROMPTS: Record<Mode, string> = {
  chat:
    `You are VERZA, the catalog assistant for VERZA TV, a US-based short-form streaming service. Be warm, concise, and accurate. Use only the authoritative catalog and product facts below. Never invent rankings, ratings, reviews, view counts, audience reactions, availability, pricing, or features.

PLATFORM BASICS:
- Website: verzatv.com (live, fully operational)
- Founded by Alan Mruvka, co-founder of E! Entertainment Television
- ${LIVE_SERIES.length} live series and ${TOTAL_LIVE_EPISODES.toLocaleString("en-US")} live episodes in the current catalog
- Content includes vertical micro-dramas, reality, music, podcasts, and red-carpet programming; episode counts and formats vary by title
- Categories: Drama, New, Hot, Music, Reality, Red Carpet

PRICING:
- ${PAID_SERIES.length} live paid-access series currently include the free episode count stated in the catalog below
- ${FULLY_FREE_SERIES.length} live titles are currently wholly free
- Full Series Unlock: $1.99 one-time for the remaining available episodes of the selected eligible series
${VIP_AVAILABILITY_FACT}
- The current checkout does not sell or spend coins or tokens

HOW TO WATCH:
- Tap any poster → video plays instantly, full screen
- Swipe up for next episode, swipe down for previous
- Sound: tap the speaker icon (top-right) to unmute
- Auto-advances to next episode when current one ends
- Works on any phone, tablet, or desktop browser

AUTHORITATIVE CURRENT CATALOG:
${CATALOG_CONTEXT}

EDITORIAL STARTING POINTS (curated placement, not audience rankings):
${EDITORIAL_PICKS.map((series) => `- ${series.title}`).join("\n")}

FEATURES:
- Shorts feed: swipe through previews from all series
- Search: search icon in header to find any series
- My List: save series to watch later (bookmark icon)
- Continue Watching: resume where you left off

PHYSICAL SHOP:
- Sponsored physical-product recommendations link to Amazon; Amazon or the identified seller controls price, inventory, fulfillment, checkout, returns, and final product details

SUPPORT:
- Email: support@verzatv.com
- Press: press@verzatv.com
- Help page: verzatv.com/help

ABOUT THE FOUNDER:
Alan Mruvka co-founded E! Entertainment Television and founded VERZA TV. Content is produced by or licensed to VERZA TV.

RULES FOR YOUR RESPONSES:
- Always recommend specific series by name with episode count
- If someone asks "what's good" or "what should I watch", give your top 3 picks based on their mood
- If they mention a genre, recommend 2-3 series from that genre
- Keep responses to 2-3 sentences max unless they ask for details
- Use the series titles exactly as listed above
- If asked about pricing, explain the selected title's catalog-specific free access before paid options
- Never make up series that don't exist — only recommend from the list above
- Be conversational and enthusiastic, like a friend who loves drama`,

  creator:
    "You are the VERZA TV Creator Assistant. Help creators write scripts, episode " +
    "descriptions, loglines, and pitches for vertical micro-drama content. Format: " +
    "1-2 minute episodes, strong cliffhangers, 9:16 vertical video. Keep dialogue " +
    "punchy and visual descriptions cinematic.",

  seo:
    "Generate SEO-optimized metadata for VERZA TV content. Output JSON with: " +
    "title (under 60 chars), description (under 160 chars), keywords (array of " +
    "5-10), ogTitle, ogDescription. Focus on micro-drama, streaming, and " +
    "genre-specific terms.",

  marketing:
    "Write viral social media copy for VERZA TV clips. Output 3 variations: one " +
    "for TikTok (casual, hook-first, with hashtags), one for Instagram (slightly " +
    "polished, with emojis), one for Twitter/X (punchy, under 280 chars). Include " +
    "a call-to-action linking to verzatv.com.",

  moderate:
    "Review the following content for VERZA TV's content policy. Check for: " +
    "explicit violence, hate speech, copyright concerns, misleading claims. " +
    'Output JSON: { approved: boolean, flags: string[], suggestions: string[] }',
};

// ---------------------------------------------------------------------------
// Model selection per mode
// ---------------------------------------------------------------------------

function getModel(mode: Mode): string {
  switch (mode) {
    case "chat":
    case "creator":
    case "marketing":
      return "claude-sonnet-4-6";
    case "seo":
    case "moderate":
      return "claude-haiku-4-5-20251001";
  }
}

// ---------------------------------------------------------------------------
// Max token limits per mode
// ---------------------------------------------------------------------------

function getMaxTokens(mode: Mode): number {
  switch (mode) {
    case "chat":
      return 500;
    case "creator":
      return 1000;
    case "marketing":
      return 600;
    case "seo":
    case "moderate":
      return 300;
  }
}

// ---------------------------------------------------------------------------
// Prompt character limits per mode
// ---------------------------------------------------------------------------

function getPromptLimit(mode: Mode): number {
  switch (mode) {
    case "chat":
      return 500;
    case "creator":
      return 2000;
    default:
      return 1000;
  }
}

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  // --- Parse body ---
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { prompt, context, mode: rawMode } = body as Record<string, unknown>;

  // --- Validate mode ---
  const mode: Mode =
    rawMode === undefined || rawMode === null
      ? "chat"
      : typeof rawMode === "string" && VALID_MODES.has(rawMode)
        ? (rawMode as Mode)
        : ("__invalid__" as Mode);

  if (mode === ("__invalid__" as Mode)) {
    return NextResponse.json(
      {
        error: `Invalid mode. Must be one of: ${Array.from(VALID_MODES).join(", ")}`,
      },
      { status: 400 },
    );
  }

  // --- Validate prompt ---
  if (typeof prompt !== "string" || !prompt.trim()) {
    return NextResponse.json(
      { error: "prompt must be a non-empty string" },
      { status: 400 },
    );
  }

  const promptLimit = getPromptLimit(mode);
  if (prompt.length > promptLimit) {
    return NextResponse.json(
      {
        error: `prompt must be at most ${promptLimit} characters for "${mode}" mode`,
      },
      { status: 400 },
    );
  }

  // --- Validate context ---
  if (context !== undefined && context !== null && typeof context !== "string") {
    return NextResponse.json(
      { error: "context must be a string if provided" },
      { status: 400 },
    );
  }
  if (typeof context === "string" && context.length > 2000) {
    return NextResponse.json(
      { error: "context must be at most 2000 characters" },
      { status: 400 },
    );
  }

  if (mode !== "chat") {
    return NextResponse.json(
      {
        error: "Creator generation tools are not currently available.",
        mode,
      },
      { status: 503 },
    );
  }

  return NextResponse.json({
    response: getScriptedResponse(prompt),
    mode,
    source: "catalog",
  });
}

// ---------------------------------------------------------------------------
// Scripted fallback (chat mode only, no API key / API failure)
// ---------------------------------------------------------------------------

type LiveSeries = (typeof LIVE_SERIES)[number];

function recommendationLine(series: LiveSeries): string {
  const access =
    series.episodeCount <= series.freeEpisodes || series.coinPerEpisode <= 0
      ? "all episodes currently free"
      : `${series.freeEpisodes} episodes free to start`;
  return `${series.title} (${series.episodeCount} episodes, ${access}) — ${series.logline}`;
}

function recommendationsMatching(
  predicate: (series: LiveSeries) => boolean,
  limit = 3,
): LiveSeries[] {
  const matches = LIVE_SERIES.filter(predicate);
  const pool = matches.length >= limit ? matches : LIVE_SERIES;
  return [...pool]
    .sort(
      (left, right) =>
        (left.popularRank ?? Number.MAX_SAFE_INTEGER) -
        (right.popularRank ?? Number.MAX_SAFE_INTEGER),
    )
    .slice(0, limit);
}

function recommendationResponse(
  intro: string,
  predicate: (series: LiveSeries) => boolean,
): string {
  return `${intro}: ${recommendationsMatching(predicate)
    .map(recommendationLine)
    .join(" ")}`;
}

function searchableText(series: LiveSeries): string {
  return `${series.genre} ${series.logline} ${series.categories.join(" ")}`.toLowerCase();
}

function getScriptedResponse(prompt: string): string {
  const lower = prompt.toLowerCase();

  if (lower.includes("recommend") || lower.includes("suggest") || lower.includes("watch") || lower.includes("good") || lower.includes("best")) {
    return recommendationResponse("Three editorial starting points", () => true);
  }

  if (lower.includes("romance") || lower.includes("love")) {
    return recommendationResponse(
      "Romance picks",
      (series) => /romance|love|marriage|bride/.test(searchableText(series)),
    );
  }

  if (lower.includes("thriller") || lower.includes("suspense") || lower.includes("scary")) {
    return recommendationResponse(
      "For thrills",
      (series) => /thriller|suspense|mystery|crime|horror/.test(searchableText(series)),
    );
  }

  if (lower.includes("revenge") || lower.includes("betray")) {
    return recommendationResponse(
      "Revenge and betrayal picks",
      (series) => /revenge|betray|reckoning|vengeance/.test(searchableText(series)),
    );
  }

  if (lower.includes("mystery") || lower.includes("detective")) {
    return recommendationResponse(
      "Mystery picks",
      (series) => /mystery|detective|missing|secret|haunt/.test(searchableText(series)),
    );
  }

  if (lower.includes("billionaire") || lower.includes("ceo") || lower.includes("rich")) {
    return recommendationResponse(
      "Wealth-and-power dramas",
      (series) => /billion|ceo|heir|fortune|dynasty|wealth/.test(searchableText(series)),
    );
  }

  if (lower.includes("price") || lower.includes("cost") || lower.includes("pay") || lower.includes("free") || lower.includes("how much") || lower.includes("subscription")) {
    return `The current catalog has ${PAID_SERIES.length} paid-access series, each with the free episode count shown on its page, plus ${FULLY_FREE_SERIES.length} wholly free titles. An eligible full-series unlock is $1.99 one time.${VIP_AVAILABILITY_SENTENCE} The current checkout does not sell coins.`;
  }

  if (lower.includes("creator") || lower.includes("upload") || lower.includes("channel") || lower.includes("make money")) {
    return "Creator publishing and paid creator-content features are not currently part of the viewer checkout. Contact support@verzatv.com for current creator-program availability; I won’t promise pricing, placement, or revenue terms.";
  }

  if (lower.includes("how") && (lower.includes("work") || lower.includes("use") || lower.includes("start"))) {
    return "Open a series to see its exact episode list and free-access limit, then play an available episode in the native or web player. On supported non-iOS surfaces, an eligible series can be unlocked for $1.99; existing Series Unlock and VIP access follows the signed-in account.";
  }

  if (lower.includes("merch") || lower.includes("shop") || lower.includes("hoodie") || lower.includes("shirt")) {
    return "Browse our sponsored physical-product picks at verzatv.com/shop. Product details, prices, and checkout are handled by Amazon.";
  }

  if (lower.includes("language") || lower.includes("spanish") || lower.includes("french")) {
    return "Use the language control for the interface translations currently shown in your app or browser. Audio, captions, and localized catalog text can vary by title, so I won’t promise a dub or subtitle that the selected episode does not display.";
  }

  if (lower.includes("alan") || lower.includes("founder") || lower.includes("who made") || lower.includes("e!")) {
    return "VERZA TV was founded by Alan Mruvka, co-founder of E! Entertainment Television. VERZA TV says its available content is produced by or licensed to the service.";
  }

  if (lower.includes("hello") || lower.includes("hi") || lower.includes("hey") || lower.includes("sup")) {
    return `Welcome to VERZA TV. The current catalog has ${LIVE_SERIES.length} live series and ${TOTAL_LIVE_EPISODES.toLocaleString("en-US")} live episodes across drama, reality, music, podcasts, red carpet, and more. What are you in the mood for?`;
  }

  if (lower.includes("trending") || lower.includes("hot") || lower.includes("popular")) {
    return recommendationResponse(
      "Current editorial picks (not audience rankings)",
      (series) => series.categories.includes("popular"),
    );
  }

  if (lower.includes("new") || lower.includes("latest") || lower.includes("just dropped")) {
    return recommendationResponse(
      "Titles in the current New shelf",
      (series) => series.categories.includes("new"),
    );
  }

  return `Welcome to VERZA TV. There are ${LIVE_SERIES.length} live series in the current catalog. Tell me a genre or mood and I’ll recommend titles using the catalog’s real episode counts and access terms.`;
}
