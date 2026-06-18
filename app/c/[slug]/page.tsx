import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { T } from "@/lib/theme";
import { BRAND } from "@/lib/config";
import { getSeriesBySlug, getEpisode } from "@/lib/catalog";
import { getPlayback } from "@/lib/mux-map";
import { getClipBySlug, clipDuration, clipDeepLink, clipAppScheme } from "@/lib/clips";
import JsonLd from "@/components/JsonLd";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://verzatv.com";
const APP_ID = process.env.NEXT_PUBLIC_APPLE_APP_ID ?? "PLACEHOLDER_APP_ID";

/* ------------------------------------------------------------------ */
/*  Metadata                                                           */
/* ------------------------------------------------------------------ */
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const clip = getClipBySlug(slug);

  if (!clip) {
    /* Fallback: treat slug as seriesSlug--episodeNumber */
    const [seriesSlug, epStr] = slug.split("--");
    const series = seriesSlug ? getSeriesBySlug(seriesSlug) : undefined;
    const epNum = parseInt(epStr ?? "1", 10);
    const ep = series ? getEpisode(seriesSlug, epNum) : undefined;

    if (!series) return { title: "Clip Not Found" };

    const mux = getPlayback(seriesSlug, epNum);
    const thumb = mux
      ? `https://image.mux.com/${mux.playbackId}/thumbnail.jpg?time=3&width=1080&height=1920`
      : series.posterUrl;

    return {
      title: `${series.title} — ${ep?.title ?? `Episode ${epNum}`} | ${BRAND.name}`,
      description: `Watch ${series.title} on ${BRAND.name}. ${series.logline}`,
      alternates: { canonical: `/c/${slug}` },
      openGraph: {
        type: "video.other",
        url: `${SITE_URL}/c/${slug}`,
        title: `${series.title} — ${ep?.title ?? `Episode ${epNum}`}`,
        description: series.logline,
        images: thumb ? [{ url: thumb, width: 1080, height: 1920 }] : [],
        siteName: BRAND.name,
      },
      twitter: {
        card: "summary_large_image",
        title: series.title,
        description: series.logline,
        images: thumb ? [thumb] : [],
      },
      itunes: { appId: APP_ID, appArgument: `verzatv://series/${seriesSlug}/${epNum}` },
      other: { "google-play-app": "app-id=com.verzatv.app" },
    };
  }

  /* Clip found in registry */
  const series = getSeriesBySlug(clip.seriesSlug);
  const mux = getPlayback(clip.seriesSlug, clip.episodeNumber);
  const thumb = mux
    ? `https://image.mux.com/${mux.playbackId}/thumbnail.jpg?time=${clip.startSeconds + 2}&width=1080&height=1920`
    : series?.posterUrl;

  return {
    title: `${clip.hookText} | ${series?.title ?? clip.seriesSlug} | ${BRAND.name}`,
    description: `${clip.hookText} — Watch the full episode on ${BRAND.name}.`,
    alternates: { canonical: `/c/${slug}` },
    openGraph: {
      type: "video.other",
      url: `${SITE_URL}/c/${slug}`,
      title: clip.hookText,
      description: `${clip.hookText} — Watch the full episode on ${BRAND.name}.`,
      images: thumb ? [{ url: thumb, width: 1080, height: 1920 }] : [],
      siteName: BRAND.name,
    },
    twitter: { card: "summary_large_image", title: clip.hookText, images: thumb ? [thumb] : [] },
    itunes: { appId: APP_ID, appArgument: clipAppScheme(clip) },
    other: { "google-play-app": "app-id=com.verzatv.app" },
  };
}

/* ------------------------------------------------------------------ */
/*  VideoObject JSON-LD for the clip                                   */
/* ------------------------------------------------------------------ */
function clipVideoSchema(opts: {
  name: string;
  description: string;
  thumbnailUrl: string;
  duration: number;
  seriesSlug: string;
  episodeNumber: number;
  playbackId?: string;
  clipSlug: string;
}) {
  const dur = opts.duration;
  const isoD = `PT${Math.floor(dur / 60)}M${Math.floor(dur % 60)}S`;
  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: opts.name,
    description: opts.description,
    thumbnailUrl: opts.thumbnailUrl,
    duration: isoD,
    uploadDate: new Date().toISOString().split("T")[0],
    contentUrl: opts.playbackId
      ? `https://stream.mux.com/${opts.playbackId}.m3u8`
      : undefined,
    embedUrl: `${SITE_URL}/c/${opts.clipSlug}`,
    publisher: {
      "@type": "Organization",
      name: BRAND.name,
      url: SITE_URL,
      logo: { "@type": "ImageObject", url: `${SITE_URL}/logo.png` },
    },
    potentialAction: {
      "@type": "WatchAction",
      target: `${SITE_URL}/series/${opts.seriesSlug}/${opts.episodeNumber}`,
    },
  };
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default async function ClipPage({ params }: Props) {
  const { slug } = await params;
  const clip = getClipBySlug(slug);

  /* Resolve series + episode (clip registry or fallback slug format) */
  let seriesSlug: string;
  let episodeNumber: number;
  let hookText: string;
  let duration: number;

  if (clip) {
    seriesSlug = clip.seriesSlug;
    episodeNumber = clip.episodeNumber;
    hookText = clip.hookText;
    duration = clipDuration(clip);
  } else {
    const parts = slug.split("--");
    seriesSlug = parts[0];
    episodeNumber = parseInt(parts[1] ?? "1", 10);
    hookText = "";
    duration = 0;
  }

  const series = getSeriesBySlug(seriesSlug);
  if (!series) notFound();

  const ep = getEpisode(seriesSlug, episodeNumber);
  const mux = getPlayback(seriesSlug, episodeNumber);
  const thumb = mux
    ? `https://image.mux.com/${mux.playbackId}/thumbnail.jpg?time=3&width=1080&height=1920`
    : series.posterUrl ?? "";

  if (!hookText) hookText = `Watch ${series.title}`;
  if (!duration && mux) duration = mux.duration;

  const deepLink = clip ? clipDeepLink(clip) : `/series/${seriesSlug}/${episodeNumber}`;

  return (
    <section className="max-w-lg mx-auto pb-24">
      <JsonLd
        data={clipVideoSchema({
          name: hookText,
          description: `${hookText} — Watch the full episode of ${series.title} on ${BRAND.name}.`,
          thumbnailUrl: thumb,
          duration,
          seriesSlug,
          episodeNumber,
          playbackId: mux?.playbackId,
          clipSlug: slug,
        })}
      />

      {/* Hero poster */}
      <div className="relative" style={{ aspectRatio: "9 / 16", background: "#07070E" }}>
        {thumb && (
          <Image
            src={thumb}
            alt={hookText}
            fill
            className="object-cover"
            sizes="(max-width: 512px) 100vw, 512px"
            priority
          />
        )}

        {/* Gradient scrim */}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(to bottom, transparent 40%, rgba(7,7,14,0.95) 100%)",
          }}
        />

        {/* Hook text overlay */}
        <div className="absolute bottom-0 left-0 right-0 px-5 pb-6 z-10">
          {hookText && (
            <p
              className="text-lg font-bold leading-tight mb-3"
              style={{ color: "#fff", textShadow: "0 2px 8px rgba(0,0,0,0.8)" }}
            >
              {hookText}
            </p>
          )}

          {/* CTA — watch the full episode */}
          <Link
            href={deepLink}
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-base font-bold no-underline transition-transform active:scale-[0.97]"
            style={{
              background: `linear-gradient(135deg, ${T.accent}, #8B5CF6)`,
              color: "#fff",
              boxShadow: `0 0 20px ${T.accent}44`,
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff" stroke="none">
              <polygon points="6 3 20 12 6 21" />
            </svg>
            Watch the Full Episode
          </Link>

          {/* App store badges */}
          <div className="flex items-center justify-center gap-3 mt-3">
            <span
              className="text-xs px-3 py-1.5 rounded-lg font-medium"
              style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}
            >
              Available on iOS
            </span>
            <span
              className="text-xs px-3 py-1.5 rounded-lg font-medium"
              style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}
            >
              Available on Android
            </span>
            <span
              className="text-xs px-3 py-1.5 rounded-lg font-medium"
              style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}
            >
              Watch on Web
            </span>
          </div>
        </div>
      </div>

      {/* Series info card */}
      <div className="px-4 mt-4">
        <div
          className="rounded-xl p-4"
          style={{ background: T.surface, border: `1px solid ${T.line}` }}
        >
          <div className="flex gap-3">
            {series.posterUrl && (
              <Link href={`/series/${seriesSlug}`} className="flex-shrink-0">
                <div className="relative w-16 h-24 rounded-lg overflow-hidden">
                  <Image
                    src={series.posterUrl}
                    alt={series.title}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </div>
              </Link>
            )}
            <div className="flex-1 min-w-0">
              <Link
                href={`/series/${seriesSlug}`}
                className="text-base font-bold no-underline block truncate"
                style={{ color: T.text }}
              >
                {series.title}
              </Link>
              <p className="text-xs mt-1 leading-relaxed" style={{ color: T.textMute }}>
                {series.logline}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs font-medium" style={{ color: T.accent }}>
                  {series.episodeCount} episodes
                </span>
                <span style={{ color: T.textMute }}>&middot;</span>
                <span className="text-xs" style={{ color: T.textMute }}>
                  First 5 free
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Episode row */}
      {ep && (
        <div className="px-4 mt-4">
          <h2 className="text-sm font-bold mb-2" style={{ color: T.text }}>
            This Episode
          </h2>
          <Link
            href={deepLink}
            className="flex items-center gap-3 p-3 rounded-xl no-underline transition-colors"
            style={{ background: T.surface, border: `1px solid ${T.line}` }}
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: `${T.accent}18` }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill={T.accent} stroke="none">
                <polygon points="6 3 20 12 6 21" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: T.text }}>
                {ep.title}
              </p>
              <p className="text-xs" style={{ color: T.textMute }}>
                Episode {episodeNumber}
                {mux ? ` · ${Math.floor(mux.duration / 60)}:${String(Math.floor(mux.duration % 60)).padStart(2, "0")}` : ""}
                {episodeNumber <= (series.freeEpisodes ?? 5) ? " · Free" : ""}
              </p>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.textMute} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>
        </div>
      )}

      {/* Browse more */}
      <div className="px-4 mt-6 text-center">
        <Link
          href="/"
          className="text-sm font-semibold no-underline"
          style={{ color: T.accent }}
        >
          Browse All Shows &rarr;
        </Link>
      </div>
    </section>
  );
}
