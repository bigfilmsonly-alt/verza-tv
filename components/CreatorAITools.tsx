"use client";

import { useState, useCallback } from "react";

/* ───── types ───── */
type ToolId = "script" | "logline" | "social" | "description";

interface ToolResult {
  response: string;
  source: string;
}

/* ───── tool config ───── */
const TOOLS: {
  id: ToolId;
  title: string;
  icon: React.ReactNode;
  placeholder: string;
  secondaryPlaceholder?: string;
  buttonLabel: string;
  buildPrompt: (primary: string, secondary: string) => string;
  mode: "creator" | "marketing";
}[] = [
  {
    id: "script",
    title: "Script Generator",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E0115F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
    placeholder: "Enter your one-line premise (e.g., \"A maid discovers her boss is secretly a billionaire\")",
    buttonLabel: "Generate Script",
    buildPrompt: (premise: string) =>
      `You are a professional screenwriter for a vertical micro-drama platform called Verza TV. Write a short script (approximately 2-3 minutes of screen time) based on this premise:\n\n"${premise}"\n\nFormat the script with:\n- Scene headings (INT./EXT.)\n- Character names in CAPS before dialogue\n- Stage directions in parentheses\n- End with a dramatic cliffhanger that makes viewers want the next episode\n\nKeep it punchy, emotional, and designed for a mobile vertical video format.`,
    mode: "creator",
  },
  {
    id: "logline",
    title: "Logline Writer",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="17" y1="10" x2="3" y2="10" />
        <line x1="21" y1="6" x2="3" y2="6" />
        <line x1="21" y1="14" x2="3" y2="14" />
        <line x1="17" y1="18" x2="3" y2="18" />
      </svg>
    ),
    placeholder: "Series title",
    secondaryPlaceholder: "Brief description of the series",
    buttonLabel: "Write Logline",
    buildPrompt: (title: string, description: string) =>
      `Write a compelling one-sentence logline for a vertical micro-drama series on Verza TV.\n\nTitle: "${title}"\nDescription: ${description}\n\nThe logline should be punchy, create intrigue, hint at conflict, and make someone want to tap "Watch Now" immediately. One sentence only, no more than 30 words. Do not include the title in the logline.`,
    mode: "creator",
  },
  {
    id: "social",
    title: "Social Media Copy",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E0115F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
    ),
    placeholder: "Series name",
    secondaryPlaceholder: "Describe a key scene or moment to promote",
    buttonLabel: "Generate Captions",
    buildPrompt: (seriesName: string, scene: string) =>
      `You are a social media marketing expert for Verza TV, a vertical micro-drama streaming platform. Generate 3 social media captions for promoting this series.\n\nSeries: "${seriesName}"\nScene/Moment: ${scene}\n\nProvide exactly 3 variations, clearly labeled:\n\n**TikTok:**\n(Short, punchy, trending tone, include 3-4 relevant hashtags)\n\n**Instagram:**\n(Slightly longer, emotional hook, include 4-5 hashtags and a CTA to watch on Verza TV)\n\n**Twitter:**\n(Under 280 characters, witty or provocative, 1-2 hashtags)\n\nMake each feel native to its platform.`,
    mode: "marketing",
  },
  {
    id: "description",
    title: "Episode Description",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    ),
    placeholder: "Episode number (e.g., Episode 3)",
    secondaryPlaceholder: "What happens in this episode?",
    buttonLabel: "Write Description",
    buildPrompt: (epNumber: string, summary: string) =>
      `Write an SEO-friendly episode description for a vertical micro-drama on Verza TV.\n\nEpisode: ${epNumber}\nWhat happens: ${summary}\n\nThe description should be:\n- 2-3 sentences long\n- Hook the reader with intrigue in the first sentence\n- Include emotional stakes\n- End with a teaser that encourages binging the next episode\n- Naturally include keywords relevant to the drama genre\n\nDo not use quotation marks around the description. Write it as a direct description.`,
    mode: "creator",
  },
];

/* ───── shimmer skeleton ───── */
function Shimmer() {
  return (
    <div className="flex flex-col gap-2 mt-4">
      {[100, 85, 92, 60].map((w, i) => (
        <div
          key={i}
          className="h-3 rounded"
          style={{
            width: `${w}%`,
            background:
              "linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)",
            backgroundSize: "200% 100%",
            animation: "shimmer 1.5s infinite",
          }}
        />
      ))}
      <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
    </div>
  );
}

/* ───── individual tool card ───── */
function ToolCard({ tool }: { tool: (typeof TOOLS)[number] }) {
  const [primary, setPrimary] = useState("");
  const [secondary, setSecondary] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ToolResult | null>(null);
  const [error, setError] = useState("");

  const generate = useCallback(async () => {
    if (!primary.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const prompt = tool.buildPrompt(primary.trim(), secondary.trim());
      const res = await fetch("/api/ai-host", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, mode: tool.mode }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error((errBody as { error?: string }).error || "Generation failed. Please try again.");
      }

      const data = (await res.json()) as ToolResult;
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, [primary, secondary, tool]);

  const isSocial = tool.id === "social";
  const isScript = tool.id === "script";

  /* Parse social output into platform sections */
  function parseSocialSections(text: string) {
    const sections: { platform: string; content: string; color: string }[] = [];
    const platforms = [
      { label: "TikTok", color: "#E0115F" },
      { label: "Instagram", color: "#8B5CF6" },
      { label: "Twitter", color: "#1DA1F2" },
    ];

    for (let i = 0; i < platforms.length; i++) {
      const p = platforms[i];
      const regex = new RegExp(`\\*\\*${p.label}:?\\*\\*[:\\s]*`, "i");
      const startMatch = text.match(regex);
      if (!startMatch) continue;
      const startIdx = text.indexOf(startMatch[0]) + startMatch[0].length;

      let endIdx = text.length;
      for (let j = i + 1; j < platforms.length; j++) {
        const nextRegex = new RegExp(`\\*\\*${platforms[j].label}:?\\*\\*`, "i");
        const nextMatch = text.match(nextRegex);
        if (nextMatch) {
          endIdx = text.indexOf(nextMatch[0]);
          break;
        }
      }

      sections.push({
        platform: p.label,
        content: text.slice(startIdx, endIdx).trim(),
        color: p.color,
      });
    }

    return sections.length > 0 ? sections : null;
  }

  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-4"
      style={{
        background: "#12121C",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(255,255,255,0.05)" }}
        >
          {tool.icon}
        </div>
        <h3 className="text-base font-bold" style={{ color: "#fff" }}>
          {tool.title}
        </h3>
      </div>

      {/* Inputs */}
      <input
        type="text"
        value={primary}
        onChange={(e) => setPrimary(e.target.value)}
        placeholder={tool.placeholder}
        className="w-full px-4 py-3 rounded-xl text-sm outline-none"
        style={{
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.1)",
          color: "#fff",
        }}
      />

      {tool.secondaryPlaceholder && (
        <textarea
          value={secondary}
          onChange={(e) => setSecondary(e.target.value)}
          placeholder={tool.secondaryPlaceholder}
          rows={3}
          className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "#fff",
          }}
        />
      )}

      {/* Generate button */}
      <button
        onClick={generate}
        disabled={loading || !primary.trim()}
        className="w-full py-3 rounded-xl text-sm font-bold border-0 cursor-pointer transition-all active:scale-[0.97]"
        style={{
          background:
            loading || !primary.trim()
              ? "rgba(255,255,255,0.08)"
              : "linear-gradient(135deg, #E0115F, #8B5CF6)",
          color: loading || !primary.trim() ? "rgba(255,255,255,0.3)" : "#fff",
          boxShadow:
            loading || !primary.trim()
              ? "none"
              : "0 0 20px rgba(224,17,95,0.2)",
        }}
      >
        {loading ? "Generating..." : tool.buttonLabel}
      </button>

      {/* Loading shimmer */}
      {loading && <Shimmer />}

      {/* Error */}
      {error && (
        <p className="text-xs mt-1" style={{ color: "#FF6B6B" }}>
          {error}
        </p>
      )}

      {/* Output */}
      {result && !loading && (
        <div className="mt-1">
          {isSocial && parseSocialSections(result.response) ? (
            <div className="flex flex-col gap-3">
              {parseSocialSections(result.response)!.map((s) => (
                <div
                  key={s.platform}
                  className="rounded-xl p-4"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: `1px solid ${s.color}33`,
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ background: s.color }}
                    />
                    <span
                      className="text-xs font-bold uppercase tracking-wider"
                      style={{ color: s.color }}
                    >
                      {s.platform}
                    </span>
                  </div>
                  <p
                    className="text-sm leading-relaxed whitespace-pre-wrap"
                    style={{ color: "rgba(255,255,255,0.75)" }}
                  >
                    {s.content}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div
              className="rounded-xl p-4 overflow-x-auto"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <pre
                className="text-sm leading-relaxed whitespace-pre-wrap m-0"
                style={{
                  color: "rgba(255,255,255,0.75)",
                  fontFamily: isScript
                    ? "'Courier New', Courier, monospace"
                    : "inherit",
                }}
              >
                {result.response}
              </pre>
            </div>
          )}

          {/* Copy button */}
          <button
            onClick={() => {
              navigator.clipboard.writeText(result.response ?? "");
            }}
            className="mt-3 px-4 py-2 rounded-lg text-xs font-semibold border-0 cursor-pointer transition-all active:scale-[0.97]"
            style={{
              background: "rgba(255,255,255,0.06)",
              color: "rgba(255,255,255,0.5)",
            }}
          >
            Copy to Clipboard
          </button>
        </div>
      )}
    </div>
  );
}

/* ───── main export ───── */
export default function CreatorAITools() {
  return (
    <section className="px-4 pt-12 pb-16 max-w-md mx-auto">
      {/* Section header */}
      <div className="text-center mb-8">
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4"
          style={{
            background: "rgba(139,92,246,0.12)",
            border: "1px solid rgba(139,92,246,0.25)",
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#8B5CF6"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
          <span
            className="text-xs font-bold uppercase tracking-wider"
            style={{ color: "#8B5CF6" }}
          >
            AI Studio
          </span>
        </div>

        <h2
          className="text-2xl font-bold mb-2"
          style={{ color: "#fff" }}
        >
          Creator AI Tools
        </h2>
        <p
          className="text-sm leading-relaxed"
          style={{ color: "rgba(255,255,255,0.5)" }}
        >
          Write scripts, craft loglines, generate social captions, and create
          episode descriptions -- all powered by AI.
        </p>
      </div>

      {/* Tool cards */}
      <div className="flex flex-col gap-4">
        {TOOLS.map((tool) => (
          <ToolCard key={tool.id} tool={tool} />
        ))}
      </div>

      {/* Powered by badge */}
      <div className="flex justify-center mt-8">
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="rgba(255,255,255,0.35)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <span
            className="text-[11px] font-medium"
            style={{ color: "rgba(255,255,255,0.35)" }}
          >
            Powered by Claude AI
          </span>
        </div>
      </div>
    </section>
  );
}
