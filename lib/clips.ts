/* ================================================================== */
/*  Clips data model — maps clips to series + episodes + Mux assets    */
/*  Each clip deep-links to its exact episode unlock moment            */
/* ================================================================== */

export type ClipStatus = "draft" | "scheduled" | "live";
export type ClipPlatform = "tiktok" | "reels" | "shorts" | "youtube";

export interface Clip {
  id: string;
  slug: string;
  /* Content source */
  seriesSlug: string;
  episodeNumber: number;
  startSeconds: number;
  endSeconds: number;
  /* Creative */
  hookText: string;
  thumbnailTime?: number;
  /* Attribution */
  faceId?: string;
  faceName?: string;
  campaignId: string;
  /* Platform variants */
  platforms: ClipPlatform[];
  /* Mux */
  muxClipAssetId?: string;
  playbackId?: string;
  /* Lifecycle */
  status: ClipStatus;
  createdAt: string;
  scheduledAt?: string;
}

export interface Campaign {
  id: string;
  name: string;
  seriesSlug: string;
  createdAt: string;
  clipIds: string[];
}

/* ---- In-memory clip store (will migrate to Supabase) ---- */

const CLIPS: Clip[] = [];
const CAMPAIGNS: Campaign[] = [];

export function getClipBySlug(slug: string): Clip | undefined {
  return CLIPS.find((c) => c.slug === slug);
}

export function getClipById(id: string): Clip | undefined {
  return CLIPS.find((c) => c.id === id);
}

export function getLiveClips(): Clip[] {
  return CLIPS.filter((c) => c.status === "live");
}

export function getClipsBySeries(seriesSlug: string): Clip[] {
  return CLIPS.filter((c) => c.seriesSlug === seriesSlug && c.status === "live");
}

export function getClipsByCampaign(campaignId: string): Clip[] {
  return CLIPS.filter((c) => c.campaignId === campaignId && c.status === "live");
}

export function getCampaignById(id: string): Campaign | undefined {
  return CAMPAIGNS.find((c) => c.id === id);
}

export function getAllCampaigns(): Campaign[] {
  return [...CAMPAIGNS];
}

/* ---- Helpers ---- */

export function clipDuration(clip: Clip): number {
  return clip.endSeconds - clip.startSeconds;
}

export function clipDeepLink(clip: Clip): string {
  return `/series/${clip.seriesSlug}/${clip.episodeNumber}`;
}

export function clipWebUrl(clip: Clip): string {
  return `/c/${clip.slug}`;
}

export function clipAppScheme(clip: Clip): string {
  return `verzatv://series/${clip.seriesSlug}/${clip.episodeNumber}`;
}

export function clipMuxThumbnail(clip: Clip, playbackId: string): string {
  const time = clip.thumbnailTime ?? clip.startSeconds + 2;
  return `https://image.mux.com/${playbackId}/thumbnail.jpg?time=${time}&width=1080&height=1920`;
}

/* ---- Campaign link builder ---- */

export function buildTrackingUrl(clip: Clip, platform: ClipPlatform): string {
  const base = typeof window !== "undefined"
    ? window.location.origin
    : process.env.NEXT_PUBLIC_SITE_URL ?? "https://verzatv.com";
  const url = new URL(`/c/${clip.slug}`, base);
  url.searchParams.set("utm_source", platform);
  url.searchParams.set("utm_medium", "clip");
  url.searchParams.set("utm_campaign", clip.campaignId);
  if (clip.faceId) url.searchParams.set("utm_content", clip.faceId);
  return url.toString();
}
