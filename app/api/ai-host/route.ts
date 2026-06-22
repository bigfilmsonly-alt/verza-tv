import { NextRequest, NextResponse } from "next/server";
import { getLiveSeries } from "@/lib/catalog";

// AI Host — multi-mode server-only endpoint, uses ANTHROPIC_API_KEY
// Modes: chat, creator, seo, marketing, moderate
// Rate limiting handled by middleware

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
    `You are Verza, the AI assistant for Verza TV — the first and only American-owned vertical micro-drama streaming platform. You know EVERYTHING about the platform. Be warm, enthusiastic, concise, and always recommend specific series by name.

PLATFORM BASICS:
- Website: verzatv.com (live, fully operational)
- Founded by Alan Mruvka, co-founder of E! Entertainment Television
- 76 original series, 4,096 episodes, all streaming now
- Content: vertical micro-dramas (1-2 min episodes, 45-65 episodes per series)
- Categories: Drama, New, Hot, Music, Reality, Red Carpet

PRICING:
- First 5 episodes of every series are FREE — no sign-up required
- Full series unlock: $4.99 one-time (all remaining episodes)
- VIP Monthly: $9.99/month (unlocks ALL 76 series)
- VIP Yearly: $79.99/year (save 33%)
- No coins, no tokens, no confusion — simple flat pricing

HOW TO WATCH:
- Tap any poster → video plays instantly, full screen
- Swipe up for next episode, swipe down for previous
- Sound: tap the speaker icon (top-right) to unmute
- Auto-advances to next episode when current one ends
- Works on any phone, tablet, or desktop browser

SERIES BY GENRE (recommend from these):
Romance & Billionaire: "The Dumb Billionaire Heiress In Love" (58 eps, #1 romance), "Destined to Be" (60 eps), "The Day We Got Married" (50 eps), "Billionaire Daughter's Love Triangle" (56 eps), "The CEO" (52 eps), "Help! I'm Falling in Love with My Rude CEO" (65 eps), "One Night Stand" (50 eps), "The Billionaire's Lost Love" (54 eps)
Thriller & Suspense: "Do Not Deceive Me" (55 eps), "Under Her Control" (52 eps), "I Think My Wife Wants to Kill Me" (56 eps), "Blood Contract" (60 eps), "Mysterious Murder" (52 eps), "Hidden Agenda" (55 eps), "The Phoenix Conspiracy" (56 eps)
Revenge & Betrayal: "The Mistress Trap" (48 eps, #1 most watched), "The Billionaire's Betrayal" (55 eps), "Echo of Vengeance" (54 eps), "Revenge On My Cheating Fiance" (52 eps), "Never Mess with a Badass Girl" (55 eps)
Mystery: "The Winter Veil" (55 eps), "The Missing Piece" (50 eps), "The Haunted Sisters" (54 eps), "The Inheritance Game" (50 eps), "Twisted Fates" (52 eps)
Dynasty & Family Drama: "The Blackthornes" (60 eps, #2 most popular), "Love, Lies and Bloodline" (56 eps), "Faded Threads" (58 eps), "The Pendleton Secret" (52 eps)
Dark & Forbidden: "Mafia Lord's Son" (48 eps), "The Escort" (56 eps), "In Love with My Godfather's Daughter" (60 eps), "Duty of Desire" (52 eps)
Office Romance: "I'm Obsessed with My Boss" (58 eps), "An Affair with My Boss" (50 eps)
Contract Marriage: "The Marriage Contract" (50 eps), "Married to a Stranger" (62 eps)
Spy & Action: "Camouflage" (55 eps), "Killer Romance" (54 eps), "Undercovered Heart" (54 eps)
Comedy Romance: "The Dumb Billionaire Heiress In Love" (58 eps), "Hollywood Star's Fake Girlfriend" (52 eps)
Sci-fi: "Twist of Time" (58 eps)
Supernatural: "Tied By Fate" (56 eps)

TOP RECOMMENDATIONS (when asked "what should I watch"):
1. "The Mistress Trap" — Betrayal drama, most-watched series on the platform
2. "The Blackthornes" — Dynasty power plays and forbidden love
3. "The Dumb Billionaire Heiress In Love" — Comedy romance, fan favorite
4. "Do Not Deceive Me" — Thriller romance with constant twists
5. "Destined to Be" — Epic fate-driven love story

FEATURES:
- 20 languages supported (EN, ES, FR, PT, DE, IT, JA, KO, ZH, HI, AR, RU, TR, PL, NL, TH, VI, ID, TL, SW)
- Shorts feed: swipe through previews from all series
- Widescreen section: "Storage Pirates" reality series (S1 + S2)
- Search: search icon in header to find any series
- My List: save series to watch later (bookmark icon)
- Continue Watching: resume where you left off
- Creator Program: apply to create your own channel at /studio

MERCH SHOP (verzatv.com/shop):
- VerzaTV Mug ($15), Embroidered Socks ($30), Water Bottle ($35), Cap ($35), T-Shirt ($45), Joggers ($70), Logo Hoodie ($85), Tie-Dye Hoodie ($90), Champion Hoodie ($95), Columbia Fleece ($110)

SUPPORT:
- Email: support@verzatv.com (24hr response on business days)
- Press: press@verzatv.com
- Help page: verzatv.com/help

ABOUT THE FOUNDER:
Alan Mruvka co-founded E! Entertainment Television and is building Verza TV as the American alternative to Chinese-owned platforms like ReelShort and DramaBox. Content is produced at Filmology Labs.

RULES FOR YOUR RESPONSES:
- Always recommend specific series by name with episode count
- If someone asks "what's good" or "what should I watch", give your top 3 picks based on their mood
- If they mention a genre, recommend 2-3 series from that genre
- Keep responses to 2-3 sentences max unless they ask for details
- Use the series titles exactly as listed above
- If asked about pricing, always mention the 5 free episodes first
- Never make up series that don't exist — only recommend from the list above
- Be conversational and enthusiastic, like a friend who loves drama`,

  creator:
    "You are the Verza TV Creator Assistant. Help creators write scripts, episode " +
    "descriptions, loglines, and pitches for vertical micro-drama content. Format: " +
    "1-2 minute episodes, strong cliffhangers, 9:16 vertical video. Keep dialogue " +
    "punchy and visual descriptions cinematic.",

  seo:
    "Generate SEO-optimized metadata for Verza TV content. Output JSON with: " +
    "title (under 60 chars), description (under 160 chars), keywords (array of " +
    "5-10), ogTitle, ogDescription. Focus on micro-drama, streaming, and " +
    "genre-specific terms.",

  marketing:
    "Write viral social media copy for Verza TV clips. Output 3 variations: one " +
    "for TikTok (casual, hook-first, with hashtags), one for Instagram (slightly " +
    "polished, with emojis), one for Twitter/X (punchy, under 280 chars). Include " +
    "a call-to-action linking to verzatv.com.",

  moderate:
    "Review the following content for Verza TV's content policy. Check for: " +
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

  // --- API key check ---
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    // Scripted fallback when no API key (chat mode only)
    return NextResponse.json({
      response: getScriptedResponse(prompt),
      mode,
      source: "scripted",
    });
  }

  // --- Build user message ---
  const userContent = context
    ? `Context:\n${context}\n\nRequest:\n${prompt}`
    : prompt;

  try {
    // @ts-expect-error -- SDK is optional; installed only when ANTHROPIC_API_KEY is provisioned
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: getModel(mode),
      max_tokens: getMaxTokens(mode),
      system: SYSTEM_PROMPTS[mode],
      messages: [{ role: "user", content: userContent }],
    });

    const text =
      message.content[0].type === "text" ? message.content[0].text : "";

    // For seo/moderate modes, attempt to parse JSON from response
    if (mode === "seo" || mode === "moderate") {
      try {
        const parsed = JSON.parse(text);
        return NextResponse.json({
          response: parsed,
          mode,
          source: "ai",
          model: getModel(mode),
        });
      } catch {
        // Return raw text if JSON parsing fails
        return NextResponse.json({
          response: text,
          mode,
          source: "ai",
          model: getModel(mode),
        });
      }
    }

    return NextResponse.json({
      response: text,
      mode,
      source: "ai",
      model: getModel(mode),
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Anthropic API request failed";

    // Fall back to scripted for chat mode; return error for specialized modes
    if (mode === "chat") {
      return NextResponse.json({
        response: getScriptedResponse(prompt),
        mode,
        source: "scripted-fallback",
      });
    }

    return NextResponse.json(
      { error: message, mode },
      { status: 502 },
    );
  }
}

// ---------------------------------------------------------------------------
// Scripted fallback (chat mode only, no API key / API failure)
// ---------------------------------------------------------------------------

function getScriptedResponse(prompt: string): string {
  const lower = prompt.toLowerCase();

  if (lower.includes("recommend") || lower.includes("suggest") || lower.includes("watch") || lower.includes("good") || lower.includes("best")) {
    return "My top 3 right now: 1) The Mistress Trap — our most-watched series, pure betrayal drama. 2) The Blackthornes — dynasty drama with power plays and forbidden love (60 eps). 3) The Dumb Billionaire Heiress In Love — comedy romance, she plays the fool so no one suspects her billions. All start with 5 free episodes!";
  }

  if (lower.includes("romance") || lower.includes("love")) {
    return "Romance picks: Destined to Be (60 eps, fate-driven epic), The Day We Got Married (50 eps, fan favorite), One Night Stand (50 eps, steamy), or The Dumb Billionaire Heiress In Love (58 eps, comedy romance). All start free!";
  }

  if (lower.includes("thriller") || lower.includes("suspense") || lower.includes("scary")) {
    return "For thrills: I Think My Wife Wants to Kill Me (56 eps, our most suspenseful), Do Not Deceive Me (55 eps, constant twists), Blood Contract (60 eps, dark and intense), and The Phoenix Conspiracy (56 eps, sci-fi thriller). First 5 episodes are free!";
  }

  if (lower.includes("revenge") || lower.includes("betray")) {
    return "Revenge & betrayal: The Mistress Trap (48 eps, #1 most watched), The Billionaire's Betrayal (55 eps), Echo of Vengeance (54 eps), and Never Mess with a Badass Girl (55 eps). These are addictive — first 5 free!";
  }

  if (lower.includes("mystery") || lower.includes("detective")) {
    return "Mystery lovers: The Winter Veil (55 eps, chilling mystery romance), The Haunted Sisters (54 eps, gothic mystery), The Inheritance Game (50 eps), and Twisted Fates (52 eps). Start watching free!";
  }

  if (lower.includes("billionaire") || lower.includes("ceo") || lower.includes("rich")) {
    return "Billionaire drama: The Dumb Billionaire Heiress In Love (58 eps, comedy), The CEO (52 eps), Billionaire Daughter's Love Triangle (56 eps), The Billionaire's Lost Love (54 eps), and Help! I'm Falling in Love with My Rude CEO (65 eps). All free to start!";
  }

  if (lower.includes("price") || lower.includes("cost") || lower.includes("pay") || lower.includes("free") || lower.includes("how much") || lower.includes("subscription")) {
    return "First 5 episodes of every series are completely FREE — no sign-up needed! To unlock a full series, it's just $4.99 one-time. Or get VIP ($9.99/month or $79.99/year) for unlimited access to all 76 series. No coins, no confusion — just simple flat pricing.";
  }

  if (lower.includes("creator") || lower.includes("upload") || lower.includes("channel") || lower.includes("make money")) {
    return "Want to create on Verza TV? Apply at verzatv.com/studio! Creators get their own channel, upload vertical or horizontal content, set their own subscription pricing, and keep 80% of revenue. Early creators get priority placement and promotional support.";
  }

  if (lower.includes("how") && (lower.includes("work") || lower.includes("use") || lower.includes("start"))) {
    return "It's simple: tap any poster and the video plays instantly, full screen. Swipe up for the next episode. First 5 episodes are free. If you're hooked, unlock the full series for $4.99, or go VIP for $9.99/month to get everything. Sound: tap the speaker icon (top-right) to unmute!";
  }

  if (lower.includes("merch") || lower.includes("shop") || lower.includes("hoodie") || lower.includes("shirt")) {
    return "Check out our merch at verzatv.com/shop! We've got the Champion Tie-Dye Hoodie ($90), VerzaTV Mug ($15), Embroidered Socks ($30), Columbia Fleece Jacket ($110), and more. 10 products total!";
  }

  if (lower.includes("language") || lower.includes("spanish") || lower.includes("french")) {
    return "Verza TV supports 20 languages! Tap the language button (top-left of the header) to switch. We have English, Spanish, French, Portuguese, German, Italian, Japanese, Korean, Chinese, Hindi, Arabic, Russian, Turkish, Polish, Dutch, Thai, Vietnamese, Indonesian, Tagalog, and Swahili.";
  }

  if (lower.includes("alan") || lower.includes("founder") || lower.includes("who made") || lower.includes("e!")) {
    return "Verza TV was founded by Alan Mruvka — the co-founder of E! Entertainment Television. He's building the first American vertical micro-drama platform to compete with Chinese-owned apps like ReelShort and DramaBox. Content is produced at Filmology Labs.";
  }

  if (lower.includes("hello") || lower.includes("hi") || lower.includes("hey") || lower.includes("sup")) {
    return `Hey! Welcome to Verza TV! We have ${getLiveSeries().length} original micro-dramas — romance, thriller, mystery, revenge, and more. Every series starts with 5 free episodes. What are you in the mood for?`;
  }

  if (lower.includes("trending") || lower.includes("hot") || lower.includes("popular")) {
    return "Trending right now: The Mistress Trap (#1 most watched), The Blackthornes (#2, dynasty drama), Destined to Be (#3, epic romance), Do Not Deceive Me (#4, thriller), and Undercovered Heart (#5, crime romance). All start free!";
  }

  if (lower.includes("new") || lower.includes("latest") || lower.includes("just dropped")) {
    return "New on Verza TV: Lost and Found (emotional drama), Help! I'm Falling in Love with My Rude CEO (65 eps!), The Inheritance Game (mystery), Twist of Time (sci-fi romance), and The Crown (suspense drama). Check the 'New' tab on the homepage!";
  }

  return `Welcome to Verza TV! We have ${getLiveSeries().length} original micro-dramas across romance, thriller, mystery, revenge, billionaire drama, and more. Every series starts with 5 free episodes — no sign-up needed. What genre are you in the mood for? I can recommend the perfect series for you!`;
}
