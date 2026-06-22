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
    "You are Verza, the AI assistant for Verza TV — the first American vertical " +
    "micro-drama streaming platform. You have 76 original series across genres: " +
    "romance, thriller, revenge, mystery, comedy, billionaire drama. Help users " +
    "discover shows and answer questions. Be warm, enthusiastic, and concise. " +
    "Always recommend specific series by name when possible.",

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

  if (lower.includes("recommend") || lower.includes("suggest")) {
    return (
      "I'd recommend starting with The Blackthornes — it's our #2 most popular series! " +
      "If you love dynasty drama with power plays and forbidden love, it's perfect. " +
      "The Mistress Trap is also a must-watch at #1."
    );
  }

  if (lower.includes("romance")) {
    return (
      "For romance lovers, try Destined To Be for a fate-driven love story, or " +
      "One Night Stand for something steamy. The Day We Got Married is a fan favorite " +
      "fake-marriage romance!"
    );
  }

  if (lower.includes("thriller")) {
    return (
      "If you want thrills, Killer Romance and Camouflage are edge-of-your-seat spy " +
      "romances. I Think My Wife Wants To Kill Me is our most suspenseful series!"
    );
  }

  return (
    `Welcome to Verza TV! We have ${getLiveSeries().length}+ original micro-dramas across romance, thriller, ` +
    "drama, and more. Every series starts with 5 free episodes. What genre are you in " +
    "the mood for?"
  );
}
