import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { T } from "@/lib/theme";
import { getPublicChannel, isHandleSegment, normalizeChannelHandle } from "@/lib/creator-channel";

/*
 * Public creator channel — verzatv.com/@handle
 *
 * WHY A ROOT DYNAMIC SEGMENT, AND WHY NOT app/@handle:
 * In the App Router a folder named `@something` is a PARALLEL ROUTE slot, not a
 * URL segment, so `app/@handle` would never serve /@handle. The URL /@verza has
 * the literal path segment "@verza", so a root dynamic route catches it and we
 * validate the leading @ ourselves.
 *
 * Static routes (/shop, /about, /library, ...) take precedence over a dynamic
 * one, so this only ever sees paths nothing else claimed. Anything without a
 * leading @ falls straight through to notFound(), which renders the same 404 as
 * before.
 *
 * `/c/<slug>` was NOT reused: that is the clip share route for TikTok/Reels/
 * Shorts, and a shared namespace would let a handle shadow a clip slug.
 */

type Props = { params: Promise<{ handle: string }> };

export const revalidate = 300;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  if (!isHandleSegment(handle)) return { title: "Not Found" };
  const channel = await getPublicChannel(handle);
  if (!channel) return { title: "Not Found" };
  const clean = normalizeChannelHandle(handle);
  return {
    title: `${channel.displayName}`,
    description: channel.bio || `Watch ${channel.displayName} on VERZA TV.`,
    alternates: { canonical: `/@${clean}` },
    openGraph: {
      title: `${channel.displayName} on VERZA TV`,
      description: channel.bio || `Watch ${channel.displayName} on VERZA TV.`,
      url: `/@${clean}`,
      images: channel.bannerUrl ? [{ url: channel.bannerUrl }] : [],
    },
  };
}

export default async function ChannelPage({ params }: Props) {
  const { handle } = await params;
  // Not a channel address at all: behave exactly like any other unknown path.
  if (!isHandleSegment(handle)) notFound();

  const channel = await getPublicChannel(handle);
  // Covers unknown, unapproved, and approved-but-unpublished alike. The query
  // itself filters on status+published, so nothing private reaches this point.
  if (!channel) notFound();

  const socials = Object.entries(channel.social).filter(([, v]) => Boolean(v));

  return (
    <div style={{ background: T.bg, minHeight: "100dvh", paddingBottom: "calc(96px + env(safe-area-inset-bottom, 0px))" }}>
      {/* Banner */}
      <div className="relative w-full" style={{ aspectRatio: "3 / 1", background: T.raised }}>
        {channel.bannerUrl && (
          <Image src={channel.bannerUrl} alt="" fill sizes="100vw" className="object-cover" priority />
        )}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{ background: `linear-gradient(to bottom, transparent 40%, ${T.bg})` }}
        />
      </div>

      {/* Identity */}
      <div className="px-5" style={{ marginTop: -28 }}>
        <div className="flex items-end gap-3">
          <div
            className="relative rounded-full overflow-hidden shrink-0"
            style={{ width: 72, height: 72, background: T.raised, border: `3px solid ${T.bg}` }}
          >
            {channel.avatarUrl ? (
              <Image src={channel.avatarUrl} alt="" fill sizes="72px" className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[24px] font-bold" style={{ color: T.textDim }}>
                {channel.displayName.slice(0, 1).toUpperCase()}
              </div>
            )}
          </div>
          <div className="pb-1 min-w-0">
            <h1 className="text-[20px] font-bold leading-tight truncate" style={{ color: T.text }}>
              {channel.displayName}
            </h1>
            <p className="text-[13px]" style={{ color: T.textMute }}>@{channel.handle}</p>
          </div>
        </div>

        {channel.bio && (
          <p className="text-[13px] leading-relaxed mt-3" style={{ color: T.textDim }}>
            {channel.bio}
          </p>
        )}

        {(socials.length > 0 || channel.website) && (
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
            {channel.website && (
              <a
                href={channel.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[12px] font-semibold no-underline"
                style={{ color: T.accent }}
              >
                Website
              </a>
            )}
            {socials.map(([k, v]) => (
              <a
                key={k}
                href={v}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[12px] font-semibold no-underline capitalize"
                style={{ color: T.accent }}
              >
                {k}
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Titles */}
      <section className="px-5 mt-7">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.16em] mb-3" style={{ color: T.textMute }}>
          {channel.titles.length} {channel.titles.length === 1 ? "title" : "titles"}
        </h2>

        <div className="grid grid-cols-3 gap-2">
          {channel.titles.map((t) => (
            <Link key={t.slug} href={`/watch/${t.slug}`} className="block no-underline">
              <div className="relative overflow-hidden rounded-lg" style={{ aspectRatio: "2 / 3", background: T.raised }}>
                {t.posterUrl && <Image src={t.posterUrl} alt={t.title} fill sizes="33vw" className="object-cover" />}
              </div>
              <p className="text-[11px] font-semibold mt-1.5 leading-tight line-clamp-2" style={{ color: T.text }}>
                {t.title}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
