import "server-only";

import { getServiceClient } from "@/lib/supabase/server";

/**
 * Public creator channel reads.
 *
 * Deliberately server-only and deliberately explicit about visibility. There is
 * NO public-read RLS policy on `public.creators` (only "Creators read own
 * profile"), which is the correct default: an application in progress is
 * private. Rather than loosen that policy, these reads go through the service
 * client and filter to published+approved in the query itself, so an
 * unpublished profile can never be returned to a public surface.
 *
 * Handles live at /@handle. `/c/<slug>` is NOT available for this: it is the
 * clip share route for social distribution, and sharing that namespace would
 * let a creator handle shadow a clip slug or vice versa.
 */

export interface PublicChannelTitle {
  slug: string;
  title: string;
  posterUrl: string;
  aspectRatio: string;
  durationSeconds: number;
}

export interface PublicChannel {
  handle: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
  bannerUrl: string;
  website: string;
  social: Record<string, string>;
  titles: PublicChannelTitle[];
}

/** Strip a leading @ and lowercase. Accepts "@name" or "name". */
export function normalizeChannelHandle(raw: string): string {
  return raw.replace(/^@+/, "").trim().toLowerCase();
}

/** True when a URL segment is addressing a creator channel (i.e. starts with @). */
export function isHandleSegment(segment: string): boolean {
  // Next gives us the decoded segment, so "/@verza" arrives as "@verza".
  return segment.startsWith("@") && segment.length > 1;
}

export async function getPublicChannel(rawHandle: string): Promise<PublicChannel | null> {
  const handle = normalizeChannelHandle(rawHandle);
  if (!handle) return null;

  const supabase = getServiceClient();

  const { data: creator } = await supabase
    .from("creators")
    .select("id, handle, display_name, bio, avatar_url, banner_url, website, social_links, status, published")
    .eq("handle", handle)
    // Both gates, explicitly. An approved creator who has not published their
    // channel yet is still not public.
    .eq("status", "approved")
    .eq("published", true)
    .maybeSingle();

  if (!creator) return null;

  const { data: content } = await supabase
    .from("creator_content")
    .select("slug, title, poster_url, aspect_ratio, duration_seconds, published_at")
    .eq("creator_id", creator.id)
    .eq("status", "published")
    .order("published_at", { ascending: false });

  return {
    handle: creator.handle as string,
    displayName: (creator.display_name as string) || (creator.handle as string),
    bio: (creator.bio as string) ?? "",
    avatarUrl: (creator.avatar_url as string) ?? "",
    bannerUrl: (creator.banner_url as string) ?? "",
    website: (creator.website as string) ?? "",
    social: (creator.social_links as Record<string, string>) ?? {},
    titles: (content ?? []).map((c) => ({
      slug: c.slug as string,
      title: c.title as string,
      posterUrl: (c.poster_url as string) ?? "",
      aspectRatio: (c.aspect_ratio as string) ?? "9:16",
      durationSeconds: (c.duration_seconds as number) ?? 0,
    })),
  };
}

/**
 * Channels for the public showcase on the Creators page. Same visibility rules;
 * only creators with at least one published title are surfaced, so the shelf
 * never shows an empty channel.
 */
export async function listPublicChannels(limit = 12): Promise<PublicChannel[]> {
  const supabase = getServiceClient();
  const { data: creators } = await supabase
    .from("creators")
    .select("id, handle, display_name, bio, avatar_url, banner_url, website, social_links")
    .eq("status", "approved")
    .eq("published", true)
    .limit(limit);

  if (!creators?.length) return [];

  const ids = creators.map((c) => c.id as string);
  const { data: content } = await supabase
    .from("creator_content")
    .select("creator_id, slug, title, poster_url, aspect_ratio, duration_seconds, published_at")
    .in("creator_id", ids)
    .eq("status", "published")
    .order("published_at", { ascending: false });

  const byCreator = new Map<string, PublicChannelTitle[]>();
  for (const c of content ?? []) {
    const list = byCreator.get(c.creator_id as string) ?? [];
    list.push({
      slug: c.slug as string,
      title: c.title as string,
      posterUrl: (c.poster_url as string) ?? "",
      aspectRatio: (c.aspect_ratio as string) ?? "9:16",
      durationSeconds: (c.duration_seconds as number) ?? 0,
    });
    byCreator.set(c.creator_id as string, list);
  }

  return creators
    .map((c) => ({
      handle: c.handle as string,
      displayName: (c.display_name as string) || (c.handle as string),
      bio: (c.bio as string) ?? "",
      avatarUrl: (c.avatar_url as string) ?? "",
      bannerUrl: (c.banner_url as string) ?? "",
      website: (c.website as string) ?? "",
      social: (c.social_links as Record<string, string>) ?? {},
      titles: byCreator.get(c.id as string) ?? [],
    }))
    .filter((c) => c.titles.length > 0);
}
