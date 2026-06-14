import type { Metadata } from "next";
import { T } from "@/lib/theme";
import { BRAND } from "@/lib/config";

export const metadata: Metadata = {
  title: `AI Creation Studio | ${BRAND.name}`,
  description:
    "Create your own micro-dramas with AI-powered tools. Write scripts, cast voices, direct scenes, and publish to your Verza channel.",
};

const FEATURES = [
  {
    title: "AI Script Writer",
    desc: "Turn a one-line premise into a full micro-drama script with acts, dialogue, and stage directions.",
  },
  {
    title: "Scene Director",
    desc: "Automatic scene breakdowns, shot lists, and camera angles optimized for vertical 9:16 format.",
  },
  {
    title: "Voice Casting",
    desc: "AI-generated voices matched to your characters -- choose tone, accent, and emotion.",
  },
  {
    title: "One-Tap Publish",
    desc: "Render, review, and go live on your Verza channel with a single tap.",
  },
];

export default function StudioPage() {
  return (
    <section className="px-4 pt-10 pb-12 flex flex-col items-center justify-center min-h-[70vh]">
      {/* Sparkle icon */}
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
        style={{ background: `${T.accent}18` }}
      >
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke={T.accent}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2l2.09 6.26L20 10l-4.18 4.18L16.36 20 12 16.09 7.64 20l.54-5.82L4 10l5.91-1.74z" />
        </svg>
      </div>

      <h1
        className="text-3xl font-bold mb-3 text-center"
        style={{ color: T.text }}
      >
        AI Creation Studio
      </h1>

      <p
        className="text-sm text-center max-w-md mb-8 leading-relaxed"
        style={{ color: T.textDim }}
      >
        Create your own vertical micro-dramas with AI-powered tools.
        Write, produce, and publish original short-form content -- all from
        your phone.
      </p>

      {/* Coming Soon badge */}
      <div
        className="rounded-xl px-6 py-4 text-center max-w-sm w-full mb-8"
        style={{
          background: T.surface,
          border: `1px solid ${T.line}`,
        }}
      >
        <p
          className="text-xs font-bold uppercase tracking-widest mb-1"
          style={{ color: T.accent }}
        >
          Coming Soon
        </p>
        <p
          className="text-sm leading-relaxed"
          style={{ color: T.textMute }}
        >
          Script generation, scene blocking, AI voice casting, and
          one-tap publishing to your {BRAND.nameVariant} channel.
        </p>
      </div>

      {/* Waitlist CTA */}
      <button
        className="px-8 py-3 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90"
        style={{
          background: T.accent,
          color: "#fff",
        }}
      >
        Join the Waitlist
      </button>
      <p
        className="text-xs mt-2"
        style={{ color: T.textMute }}
      >
        Be the first to create on {BRAND.name}.
      </p>

      {/* Feature preview cards */}
      <div className="w-full max-w-md mt-10 flex flex-col gap-3">
        <h2
          className="text-xs font-semibold uppercase tracking-wider mb-1"
          style={{ color: T.accent }}
        >
          What You Will Get
        </h2>

        {FEATURES.map((feature) => (
          <div
            key={feature.title}
            className="flex items-start gap-3 rounded-xl px-4 py-3"
            style={{
              background: T.surface,
              border: `1px solid ${T.line}`,
            }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{ background: `${T.accent}18` }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke={T.accent}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2l2.09 6.26L20 10l-4.18 4.18L16.36 20 12 16.09 7.64 20l.54-5.82L4 10l5.91-1.74z" />
              </svg>
            </div>
            <div>
              <p
                className="text-sm font-medium"
                style={{ color: T.text }}
              >
                {feature.title}
              </p>
              <p
                className="text-xs mt-0.5 leading-relaxed"
                style={{ color: T.textMute }}
              >
                {feature.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
