import { NextRequest, NextResponse } from "next/server";
import { getLiveSeries } from "@/lib/catalog";

// AI Host — server-only, uses ANTHROPIC_API_KEY
// Provides show recommendations, host commentary, and personalized suggestions

export async function POST(request: NextRequest) {
  const { prompt, context } = await request.json();

  if (!prompt) {
    return NextResponse.json({ error: "Prompt required" }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    // Scripted fallback when no API key
    return NextResponse.json({
      response: getScriptedResponse(prompt),
      source: "scripted",
    });
  }

  try {
    // Production: use Anthropic SDK
    // @ts-expect-error -- SDK is optional; installed only when ANTHROPIC_API_KEY is provisioned
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 500,
      system:
        "You are the AI Host of Verza TV, a vertical micro-drama streaming platform. " +
        "You're enthusiastic, knowledgeable about all shows, and help viewers discover " +
        "new series. Keep responses concise and engaging.",
      messages: [{ role: "user", content: prompt }],
    });

    const text =
      message.content[0].type === "text" ? message.content[0].text : "";
    return NextResponse.json({ response: text, source: "ai" });
  } catch {
    return NextResponse.json({
      response: getScriptedResponse(prompt),
      source: "scripted-fallback",
    });
  }
}

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
