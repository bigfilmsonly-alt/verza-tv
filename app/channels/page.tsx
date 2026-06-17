import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { T } from "@/lib/theme";
import { BRAND } from "@/lib/config";
import { getChannels, getSeriesByChannel, type Series } from "@/lib/catalog";
import { organizationSchema } from "@/lib/seo/schema";
import JsonLd from "@/components/JsonLd";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://verzatv.com";

export const metadata: Metadata = {
  title: `Channels | ${BRAND.name}`,
  description:
    "Creators, brands, and studios on Verza TV. Browse channels and discover original micro-dramas, reality shows, and more.",
  alternates: { canonical: `${SITE_URL}/channels` },
};

const CHANNEL_META: Record<
  string,
  { description: string; icon: string; posterLimit: number }
> = {
  "Verza Originals": {
    description:
      "The flagship channel. Romance, thriller, mystery, and revenge \u2014 70+ original micro-dramas produced by Verza TV.",
    icon: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
    posterLimit: 12,
  },
  StorageBlue: {
    description:
      "Reality meets comedy. When abandoned storage units go to auction, one crew finds more than furniture \u2014 they find fame, feuds, and hidden fortunes.",
    icon: "M23 7l-7 5 7 5V7zM14 5H3a2 2 0 00-2 2v10a2 2 0 002 2h11a2 2 0 002-2V7a2 2 0 00-2-2z",
    posterLimit: 20,
  },
  "The Vertical Tea": {
    description:
      "The hottest takes on micro-drama, celebrity scandals, and internet chaos \u2014 served piping hot, sixty seconds at a time.",
    icon: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75",
    posterLimit: 20,
  },
};

function PosterThumb({ series }: { series: Series }) {
  return (
    <Link
      href={`/series/${series.slug}`}
      className="flex-shrink-0 no-underline group"
    >
      <div
        className="w-[100px] h-[140px] rounded-lg overflow-hidden relative"
        style={{ background: T.raised }}
      >
        {series.posterUrl ? (
          <Image
            src={series.posterUrl}
            alt={series.title}
            fill
            sizes="100px"
            className="object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center text-center px-2 gap-1"
            style={{ color: T.textMute }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
              <line x1="7" y1="2" x2="7" y2="22" />
              <line x1="17" y1="2" x2="17" y2="22" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <line x1="2" y1="7" x2="7" y2="7" />
              <line x1="2" y1="17" x2="7" y2="17" />
              <line x1="17" y1="7" x2="22" y2="7" />
              <line x1="17" y1="17" x2="22" y2="17" />
            </svg>
            <span className="text-[9px] font-medium leading-tight">
              {series.title}
            </span>
          </div>
        )}
      </div>
      <p
        className="text-[10px] font-medium mt-1.5 w-[100px] truncate"
        style={{ color: T.textDim }}
      >
        {series.title}
      </p>
    </Link>
  );
}

export default function ChannelsPage() {
  const liveChannelNames = getChannels();

  /* Merge live channels with channels defined in CHANNEL_META so
     pre-launch channels (StorageBlue, The Vertical Tea) still appear */
  const allChannelNames = Array.from(
    new Set([...liveChannelNames, ...Object.keys(CHANNEL_META)])
  );

  /* Sort so Verza Originals appears first */
  const sortedChannels = allChannelNames.sort((a, b) => {
    if (a === "Verza Originals") return -1;
    if (b === "Verza Originals") return 1;
    return a.localeCompare(b);
  });

  return (
    <section className="px-4 pt-6 pb-8">
      <JsonLd data={organizationSchema()} />
      <h1 className="text-2xl font-bold mb-1" style={{ color: T.text }}>
        Channels
      </h1>
      <p className="text-sm mb-8" style={{ color: T.textMute }}>
        Creators, brands, and studios on {BRAND.name}
      </p>

      <div className="flex flex-col gap-6">
        {sortedChannels.map((channelName) => {
          const series = getSeriesByChannel(channelName);
          const meta = CHANNEL_META[channelName];
          const posterLimit = meta?.posterLimit ?? 6;
          const displaySeries = series.slice(0, posterLimit);

          return (
            <div
              key={channelName}
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
                    className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: `${T.accent}18` }}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={T.accent}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      {meta && <path d={meta.icon} />}
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2
                      className="text-lg font-bold"
                      style={{ color: T.text }}
                    >
                      {channelName}
                    </h2>
                    <p
                      className="text-xs"
                      style={{ color: T.textMute }}
                    >
                      {series.length > 0
                        ? `${series.length} ${series.length === 1 ? "show" : "shows"}`
                        : "Coming Soon"}
                    </p>
                  </div>
                </div>
                {meta && (
                  <p
                    className="text-xs leading-relaxed mt-1"
                    style={{ color: T.textDim }}
                  >
                    {meta.description}
                  </p>
                )}
              </div>

              {/* Horizontal scrollable poster row */}
              {displaySeries.length > 0 ? (
                <div
                  className="px-4 pb-4 flex gap-3 overflow-x-auto"
                  style={{
                    scrollbarWidth: "none",
                    msOverflowStyle: "none",
                    WebkitOverflowScrolling: "touch",
                  }}
                >
                  {displaySeries.map((s) => (
                    <PosterThumb key={s.slug} series={s} />
                  ))}
                </div>
              ) : (
                <div className="px-4 pb-4">
                  <div
                    className="rounded-lg py-8 flex flex-col items-center justify-center gap-2"
                    style={{ background: T.raised }}
                  >
                    <span
                      className="text-[11px] font-semibold uppercase tracking-widest"
                      style={{ color: T.accent }}
                    >
                      Coming Soon
                    </span>
                    <p className="text-xs" style={{ color: T.textMute }}>
                      New shows launching soon on this channel
                    </p>
                  </div>
                </div>
              )}

              {/* View All link */}
              {series.length > posterLimit && (
                <div
                  className="px-4 py-3"
                  style={{ borderTop: `1px solid ${T.line}` }}
                >
                  <Link
                    href="/discover"
                    className="text-xs font-semibold no-underline transition-opacity hover:opacity-80"
                    style={{ color: T.accent }}
                  >
                    View All {series.length} Shows &rarr;
                  </Link>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
