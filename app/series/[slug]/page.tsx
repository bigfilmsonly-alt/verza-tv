import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import {
  SERIES,
  getSeriesWithDetail,
  getEpisodesForSeries,
} from "@/lib/catalog";
import { episodeHref } from "@/lib/series-href";
import { MUX_MAP } from "@/lib/mux-public-map";
// Coin pricing is no longer used; Series Unlock has one canonical cash price.
import { seriesSchema, breadcrumbSchema } from "@/lib/schemas";
import { T } from "@/lib/theme";
import { FREE_EPISODES } from "@/lib/config";
import { isSeriesPurchasable } from "@/lib/series-purchase";
import EpisodeDropdown from "@/components/EpisodeDropdown";
import HideInIOSApp from "@/components/HideInIOSApp";
import PlayNowLink from "@/components/PlayNowLink";
import AudioLanguageBadge from "@/components/AudioLanguageBadge";
import { audioLanguageOf } from "@/lib/audio-language";

/* ------------------------------------------------------------------ */
/*  Static params                                                      */
/* ------------------------------------------------------------------ */

export async function generateStaticParams() {
  return SERIES.filter((s) => s.status === "live").map((s) => ({
    slug: s.slug,
  }));
}

/* ------------------------------------------------------------------ */
/*  Metadata                                                           */
/* ------------------------------------------------------------------ */

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const series = getSeriesWithDetail(slug);
  if (!series) return { title: "Not Found" };

  // A coming-soon title has no episodes. Promising "Watch Free" in the tab and
  // in search results is a claim the page cannot honour, and letting a page
  // with nothing to play get indexed is thin content under a false headline.
  const soon = series.status === "coming_soon";

  return {
    // No brand suffix here: the root template in app/layout.tsx already appends
    // " | VERZA TV", so spelling it out produced "… on VERZA TV | VERZA TV" on
    // all 91 series pages. The episode route has always relied on the template
    // and reads correctly, so this matches its convention rather than adding a
    // third one.
    title: soon ? `${series.title} — Coming Soon` : `${series.title} — Watch Free`,
    description: series.logline,
    alternates: { canonical: `/series/${slug}` },
    ...(soon ? { robots: { index: false, follow: true } } : null),
    openGraph: {
      title: series.title,
      description: series.logline,
      url: `/series/${slug}`,
      type: "video.tv_show",
      images: series.posterUrl ? [{ url: series.posterUrl, width: 800, height: 1067, alt: series.title }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: series.title,
      description: series.logline,
      images: series.posterUrl ? [series.posterUrl] : [],
    },
  };
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default async function SeriesPage({ params }: Props) {
  const { slug } = await params;
  const series = getSeriesWithDetail(slug);
  if (!series) notFound();

  const episodes = getEpisodesForSeries(slug);
  const isPurchasable = isSeriesPurchasable(series);
  /* Public playback id for the episode the play CTA opens, so the click can
     start the stream while the route navigation is still in flight — the same
     head start the poster tap used to give before every poster started landing
     here instead. Resolved HERE, on the server, for two reasons: it keeps the
     4,900-row public Mux map out of this page's client bundle, and it puts the
     free-episode guard somewhere it is obvious. A paid episode has no entry in
     the public projection at all (AGENTS.md rule 8); EpisodeFeed obtains an
     authorized, expiring source after navigation instead. */
  const prewarmPlaybackId =
    series.status === "live" && series.freeEpisodes >= 1
      ? MUX_MAP[series.slug]?.find((e) => e.episode === 1)?.playbackId
      : undefined;
  const BASE_URL =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.verzatv.com";

  return (
    <>
      {/* ---- JSON-LD ---- */}
      <JsonLd
        data={[
          seriesSchema({
            slug: series.slug,
            title: series.title,
            logline: series.logline,
            genre: series.genre,
            episodeCount: series.episodeCount,
            posterUrl: series.posterUrl,
          }),
          breadcrumbSchema([
            { name: "Home", url: BASE_URL },
            {
              name: series.title,
              url: `${BASE_URL}/series/${series.slug}`,
            },
          ]),
        ]}
      />

      {/* ---- Hero Poster ---- */}
      <section className="series-hero relative w-full" style={{ aspectRatio: "2 / 3", background: "#07070E" }}>
        {series.posterUrl ? (
          <Image
            src={series.posterUrl}
            alt={series.title}
            fill
            priority
            sizes="100vw"
            className="object-contain"
            style={{ filter: "saturate(1.12) contrast(1.04) brightness(1.02)" }}
          />
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center text-lg font-bold"
            style={{ background: `linear-gradient(135deg, ${T.raised}, ${T.surface})`, color: T.textMute }}
          >
            {series.title}
          </div>
        )}
        {/* Gradient fade to background */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to bottom, transparent 30%, ${T.bg} 100%)`,
          }}
        />
      </section>

      {/* ---- Series Info ---- */}
      <div className="px-4 -mt-12 relative z-10 animate-rise">
        {/* Title */}
        <h1
          className="text-2xl font-bold leading-tight mb-2"
          style={{ color: T.text }}
        >
          {series.title}
        </h1>

        {/* Genre badge + episode count */}
        <div className="flex items-center gap-2 mb-3">
          <span
            className="text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full"
            style={{
              background: T.accent,
              color: T.text,
            }}
          >
            {series.genre}
          </span>
          <span
            className="text-xs font-medium"
            style={{ color: T.textDim }}
          >
            {/* A coming-soon title has no episode count worth printing; "0
                episodes" reads as a broken page rather than an unreleased one. */}
            {series.status === "coming_soon" ? "Episodes announced soon" : `${series.episodeCount} episodes`}
          </span>
        </div>

        {/* What language is this SPOKEN in.
            The Bollywood tab ships six Hindi titles behind English title
            lockups and English loglines — "Falling for Flatmate", "Reset",
            "Salt & Pepper" — and until now no surface in the product said the
            dialogue is in Hindi. A buyer found out after paying. Rendered on
            every title, English ones included: "English audio" is information
            too, and a rule that only labels the exceptions is a rule that
            forgets to label the next exception. Client component because the
            label is translated and this page is a Server Component. */}
        <div className="mb-3">
          <AudioLanguageBadge language={audioLanguageOf(series)} />
        </div>

        {/* Logline */}
        <p
          className="text-sm leading-relaxed mb-3"
          style={{ color: T.textDim }}
        >
          {series.logline}
        </p>

        {/* Published metadata */}
        {(series.year || series.channel) && (
          <div className="flex items-center gap-3 mb-3">
            {series.year && (
              <span className="text-xs" style={{ color: T.textMute }}>
                {series.year}
              </span>
            )}
            {series.channel && (
              <span className="text-xs" style={{ color: T.textMute }}>
                {series.channel}
              </span>
            )}
          </div>
        )}

        {/* Description.

            Suppressed when it merely restates the logline printed above. 22 of
            the 96 rows carry a SERIES_DETAIL.description that opens with the
            catalogue logline verbatim, so those pages printed the same sentence
            twice, one paragraph apart, with the metadata row wedged between
            them. It reads as a rendering fault rather than as editorial detail,
            on the one page whose whole job is to describe the show.

            Compared on normalised text so punctuation and whitespace drift do
            not defeat it, and the longer text wins: where the description is
            the logline PLUS more, that extra is the only new information on the
            page and must survive. */}
        {(() => {
          /* Strip the repeated opening rather than dropping the paragraph.
             All 22 of the affected rows are "logline + genuinely new text", not
             an exact copy, so suppressing the whole paragraph would delete the
             only new information on the page. An equality test suppresses zero
             of them — measured, not assumed. */
          const collapse = (t: string) => t.trim().replace(/\s+/g, " ");
          const key = (t: string) => collapse(t).replace(/[.\u2026]+$/, "").toLowerCase();
          const logline = collapse(series.logline ?? "");
          let description = collapse(series.description ?? "");
          if (!description) return null;

          const dk = key(description);
          const lk = key(logline);
          if (lk && dk === lk) return null;
          if (lk && dk.startsWith(lk)) {
            // Cut at the same offset in the ORIGINAL string: key() lowercases,
            // so its indices are only safe because collapse() already made the
            // two strings character-aligned up to case.
            description = collapse(description.slice(logline.length).replace(/^[\s.,;:\u2014-]+/, ""));
            if (!description) return null;
            description = description.charAt(0).toUpperCase() + description.slice(1);
          }
          return (
            <p
              className="text-sm leading-relaxed mb-4"
              style={{ color: T.textDim }}
            >
              {description}
            </p>
          );
        })()}

        {/* Cast */}
        {series.cast && series.cast.length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-semibold mb-1" style={{ color: T.textMute }}>
              Cast
            </p>
            <p className="text-sm" style={{ color: T.textDim }}>
              {series.cast.join(" \u00b7 ")}
            </p>
          </div>
        )}

        {/* Tags */}
        {series.tags && series.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {series.tags.map((tag) => (
              <span
                key={tag}
                className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                style={{ background: `${T.accent}22`, color: T.accent, border: `1px solid ${T.accent}30` }}
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Title-specific free-preview badge. Live only: for a coming-soon
            title freeEpisodes and episodeCount are both 0, so the >= test below
            is true and this would advertise "All Episodes FREE" on a series
            that has no episodes to give away. */}
        {series.status === "live" && <div
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold mb-6"
          style={{
            background: `${T.accent}33`,
            color: T.accent,
            border: `1px solid ${T.accent}44`,
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
          {series.freeEpisodes >= series.episodeCount
            ? "All Episodes FREE"
            : `First ${series.freeEpisodes} Episodes FREE`}
        </div>}

        {/* THE explicit action. Every poster, hero, category row and search
            result in the app now lands on this page rather than mid-player, so
            this button is where playback begins — and it carries the prewarm
            that used to hang off the poster tap, so the wait from here into the
            first frame is unchanged. */}
        {series.status === "live" && series.episodeCount > 0 ? (
          <PlayNowLink
            href={episodeHref(series, 1)}
            playbackId={prewarmPlaybackId}
            className="glow-pulse inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold no-underline transition-transform active:scale-95 mb-6"
            style={{
              background: "linear-gradient(135deg, #E0115F, #8B5CF6)",
              color: "#fff",
              boxShadow: "0 0 20px rgba(224, 17, 95, 0.3)",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff" stroke="none">
              <polygon points="6 3 20 12 6 21" />
            </svg>
            Watch Episode 1 Free
          </PlayNowLink>
        ) : (
          <div
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold mb-6"
            style={{
              background: "rgba(224, 17, 95, 0.12)",
              color: "#E0115F",
              border: "1px solid rgba(224, 17, 95, 0.3)",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            Coming Soon
          </div>
        )}

        {/* ---- Unlock Full Series Card (brand-gradient frame) ----
             Hidden inside the iOS app (Apple 3.1.1 — no purchase UI). */}
        {isPurchasable && <HideInIOSApp>
        <div
          className="rounded-xl p-[1px] mb-6"
          style={{ background: "linear-gradient(135deg, rgba(224,17,95,0.5), rgba(139,92,246,0.5))" }}
        >
        <div
          className="rounded-[11px] p-4"
          style={{
            background: T.raised,
            boxShadow: "0 0 12px rgba(224, 17, 95, 0.08)",
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p
                className="text-sm font-bold mb-0.5"
                style={{ color: T.text }}
              >
                Series Unlock
              </p>
              <p
                className="text-xs"
                style={{ color: T.textDim }}
              >
                All {series.episodeCount} episodes &middot; one-time purchase
              </p>
            </div>
            <span
              className="text-base font-bold flex items-baseline gap-1.5"
              style={{ color: T.accent }}
            >
              $1.99
            </span>
          </div>
        </div>
        </div>
        </HideInIOSApp>}

        {/* ---- Episode Dropdown ----
             Only where there are episodes. The five coming-soon rows have
             episodeCount 0 and getEpisodesForSeries() returns [], and this
             component was still rendering for them: a button reading
             "EP 1 of 0" with a tappable "All Episodes" control that opened an
             empty list — directly beneath the page's own "Coming Soon" pill and
             the line "Episodes announced soon". Verified in production HTML for
             /series/the-chairmans-revenge. The picker itself (FREE / padlock /
             NOW) is correct and untouched on all 91 live pages; it simply has
             nothing to pick from here. */}
        {episodes.length > 0 ? (
          <EpisodeDropdown
            seriesSlug={series.slug}
            episodes={episodes.map((e) => ({ number: e.number, title: e.title }))}
            currentEpisode={1}
            freeEpisodes={series.freeEpisodes ?? FREE_EPISODES}
            totalEpisodes={series.episodeCount}
          />
        ) : (
          /* Same empty state as the Anime tab (components/BrowsePage.tsx) —
             same neutral slate, same clock glyph, same two-line shape, same
             gradient escape hatch — so the app says "nothing here yet" in one
             voice rather than two. E owns that pattern; this is a match, not a
             second style. */
          <div className="px-4 mt-4 mb-8">
            <div
              className="w-full rounded-2xl px-6 py-10 text-center"
              style={{
                background: "rgba(12,12,20,0.82)",
                border: "1px solid rgba(255,255,255,0.28)",
              }}
            >
              <div
                className="mx-auto mb-4 flex items-center justify-center rounded-full"
                style={{ width: 44, height: 44, background: "rgba(255,255,255,0.08)" }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={T.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <p className="text-base font-bold mb-1.5" style={{ color: T.text }}>
                Episodes are on the way
              </p>
              <p className="text-xs leading-relaxed" style={{ color: "#8A8A9A" }}>
                The footage for this title hasn&rsquo;t landed yet, so there is nothing to
                play and nothing on sale. Everything else on VERZA is ready to watch
                right now.
              </p>
              <Link
                href="/"
                className="mt-5 inline-flex items-center justify-center rounded-full px-5 py-2.5 text-xs font-bold no-underline transition-transform active:scale-95"
                style={{ background: "linear-gradient(135deg, #E0115F, #8B5CF6)", color: "#fff" }}
              >
                Browse VERZA
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Bottom spacer for BottomNav */}
      <div className="h-8" />
    </>
  );
}
