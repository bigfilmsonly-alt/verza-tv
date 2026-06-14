import type { Metadata } from "next";
import Link from "next/link";
import { T } from "@/lib/theme";
import { BRAND } from "@/lib/config";
import { catalog } from "@/lib/catalog";

export const metadata: Metadata = {
  title: `Channels | ${BRAND.name}`,
  description:
    "Browse channels on Verza TV. Must-sees, Trending, Drama, and Reality -- curated collections of vertical micro-dramas.",
};

const CHANNEL_INFO: Record<string, { description: string; icon: string }> = {
  "Must-sees": {
    description:
      "Editor-picked series you cannot miss. The most-watched, highest-rated originals on Verza TV.",
    icon: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  },
  Trending: {
    description:
      "The hottest series right now. Updated daily based on views, completions, and community buzz.",
    icon: "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
  },
  Drama: {
    description:
      "Romance, revenge, and raw emotion. Billionaire deals, contract marriages, and love against the odds.",
    icon: "M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z",
  },
  Reality: {
    description:
      "Unscripted drama, real stakes. Reality competitions, behind-the-scenes chaos, and raw confessionals.",
    icon: "M23 7l-7 5 7 5V7zM14 5H3a2 2 0 00-2 2v10a2 2 0 002 2h11a2 2 0 002-2V7a2 2 0 00-2-2z",
  },
  Romance: {
    description:
      "Love stories that break the rules. Forbidden attractions, second chances, and happily-never-afters.",
    icon: "M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z",
  },
  Thriller: {
    description:
      "Dark secrets, dangerous obsessions, and twists you never see coming. Every episode ends on a cliffhanger.",
    icon: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  },
};

function getChannels() {
  const channelMap = new Map<string, number>();
  for (const series of catalog) {
    if (series.status !== "live") continue;
    channelMap.set(series.channel, (channelMap.get(series.channel) ?? 0) + 1);
  }
  return Array.from(channelMap.entries()).map(([name, count]) => ({
    name,
    count,
  }));
}

export default function ChannelsPage() {
  const channels = getChannels();

  return (
    <section className="px-4 pt-6 pb-8">
      <h1
        className="text-2xl font-bold mb-1"
        style={{ color: T.text }}
      >
        Channels
      </h1>
      <p
        className="text-sm mb-6"
        style={{ color: T.textMute }}
      >
        Curated collections of {BRAND.name} originals.
      </p>

      <div className="flex flex-col gap-4">
        {channels.map((ch) => {
          const info = CHANNEL_INFO[ch.name];
          const channelSeries = catalog.filter(
            (s) => s.channel === ch.name && s.status === "live"
          );

          return (
            <div
              key={ch.name}
              className="rounded-xl overflow-hidden"
              style={{
                background: T.surface,
                border: `1px solid ${T.line}`,
              }}
            >
              {/* Channel header */}
              <div className="p-4 pb-3">
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: `${T.accent}18` }}
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={T.accent}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      {info && <path d={info.icon} />}
                    </svg>
                  </div>
                  <div>
                    <h2
                      className="text-base font-semibold"
                      style={{ color: T.text }}
                    >
                      {ch.name}
                    </h2>
                    <p className="text-xs" style={{ color: T.textMute }}>
                      {ch.count} {ch.count === 1 ? "series" : "series"}
                    </p>
                  </div>
                </div>
                {info && (
                  <p
                    className="text-xs leading-relaxed"
                    style={{ color: T.textDim }}
                  >
                    {info.description}
                  </p>
                )}
              </div>

              {/* Series in this channel */}
              <div className="flex flex-col">
                {channelSeries.map((s, i) => (
                  <Link
                    key={s.slug}
                    href={`/series/${s.slug}`}
                    className="flex items-center gap-3 px-4 py-2.5 no-underline transition-colors hover:opacity-80"
                    style={{
                      color: T.text,
                      borderTop: `1px solid ${T.line}`,
                    }}
                  >
                    <div
                      className="w-8 h-11 rounded flex-shrink-0"
                      style={{ background: T.bg }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {s.title}
                      </p>
                      <p
                        className="text-[10px]"
                        style={{ color: T.textMute }}
                      >
                        {s.genre} &middot; {s.episodeCount} episodes
                      </p>
                    </div>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={T.textMute}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
