import { NextRequest, NextResponse } from "next/server";
import { getSeriesBySlug } from "@/lib/catalog";
import { getPlayback } from "@/lib/mux-private-map";
import { checkVipStatus } from "@/lib/vip";
import { getUser } from "@/lib/auth";
import { getServiceClient } from "@/lib/supabase/server";
import {
  MuxPlaybackConfigurationError,
  getPaidPlaybackDelivery,
  getPublicPlaybackDelivery,
} from "@/lib/mux-playback";

function privateJson(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      // Signed URLs are short-lived bearer capabilities and must never enter a
      // shared CDN/browser HTTP cache. The clients own a bounded in-memory
      // cache keyed by logical series+episode instead.
      "Cache-Control": "private, no-store, max-age=0",
      Pragma: "no-cache",
      Vary: "Authorization, Cookie",
    },
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ episode: string }> }
) {
  const { episode } = await params;
  const separator = episode.lastIndexOf("--");
  const slug = separator > 0 ? episode.slice(0, separator) : "";
  const epText = separator > 0 ? episode.slice(separator + 2) : "";
  const epNum = Number(epText);

  if (
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) ||
    !Number.isSafeInteger(epNum) ||
    epNum < 1
  ) {
    return privateJson({ error: "Invalid episode" }, 400);
  }

  const series = getSeriesBySlug(slug);
  if (
    !series ||
    series.status !== "live" ||
    epNum < 1 ||
    epNum > series.episodeCount
  ) {
    return privateJson(
      { error: "Series or episode not found" },
      404,
    );
  }

  const mux = getPlayback(slug, epNum);
  if (!mux) {
    return privateJson({
      status: "not_found",
      message: "No video available for this episode",
    }, 404);
  }

  const isFree = epNum <= series.freeEpisodes;
  const isVip = isFree ? false : await checkVipStatus(request);

  // Check if user has purchased this series
  let hasPurchased = false;
  if (!isFree && !isVip) {
    const user = await getUser();
    if (user) {
      const supabase = getServiceClient();
      const { data: ent } = await supabase
        .from("entitlements")
        .select("id")
        .eq("user_id", user.id)
        .eq("series_slug", slug)
        .maybeSingle();
      if (ent) hasPurchased = true;
    }
  }

  if (!isFree && !isVip && !hasPurchased) {
    return privateJson({
      status: "paywall",
      message: "This episode requires a Series Unlock or active VIP access",
      series: slug,
      episode: epNum,
    }, 402);
  }

  try {
    const delivery = isFree
      ? getPublicPlaybackDelivery(mux.playbackId)
      : await getPaidPlaybackDelivery(mux.playbackId);

    return privateJson({
      status: "ok",
      series: slug,
      episode: epNum,
      // Public IDs remain useful to old/free clients. Never return a paid
      // signed ID separately; the authorized URL is the only capability.
      playbackId: isFree ? mux.playbackId : undefined,
      playbackUrl: delivery.playbackUrl,
      duration: mux.duration,
      poster: delivery.poster,
      policy: delivery.policy,
      expiresAt: delivery.expiresAt,
      vip: isVip || undefined,
    });
  } catch (error) {
    if (error instanceof MuxPlaybackConfigurationError) {
      // Do not leak which ID/key is absent. Operations gets a searchable,
      // non-secret marker and clients get a retryable fail-closed response.
      console.error("[playback] signed catalog configuration incomplete");
      return privateJson({ error: "Playback is temporarily unavailable" }, 503);
    }
    console.error(
      "[playback] token generation failed:",
      error instanceof Error ? error.name : "unknown",
    );
    return privateJson({ error: "Playback is temporarily unavailable" }, 503);
  }
}
