import type { Metadata } from "next";
import { T } from "@/lib/theme";

export const metadata: Metadata = {
  title: "Shorts | Verza TV",
  description: "Watch short clips and trailers from Verza TV originals.",
};

export default function ShortsPage() {
  return (
    <section className="px-4 pt-6 pb-8 flex flex-col items-center justify-center min-h-[60dvh]">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
        style={{ background: `${T.accent}15` }}
      >
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke={T.accent}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polygon points="6 3 20 12 6 21 6 3" />
        </svg>
      </div>
      <h1
        className="text-xl font-bold mb-2"
        style={{ color: T.text }}
      >
        Shorts
      </h1>
      <p
        className="text-sm text-center max-w-[280px]"
        style={{ color: T.textMute }}
      >
        Short clips, trailers, and behind-the-scenes moments. Coming soon.
      </p>
    </section>
  );
}
