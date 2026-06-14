import type { Metadata } from "next";
import { T } from "@/lib/theme";

export const metadata: Metadata = {
  title: "My List | Verza TV",
  description: "Your saved shows and watchlist on Verza TV.",
};

export default function MyListPage() {
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
          <path d="M20 6L9 17l-5-5" />
        </svg>
      </div>
      <h1
        className="text-xl font-bold mb-2"
        style={{ color: T.text }}
      >
        My List
      </h1>
      <p
        className="text-sm text-center max-w-[280px]"
        style={{ color: T.textMute }}
      >
        Sign in to save shows to your list and pick up where you left off.
      </p>
    </section>
  );
}
