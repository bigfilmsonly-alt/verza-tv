import { NextRequest, NextResponse } from "next/server";
import { FREE_EPISODES } from "@/lib/config";
import { getPlayback } from "@/lib/mux-map";
import { checkVipStatus } from "@/lib/vip";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ episode: string }> }
) {
  const { episode } = await params;
  const parts = episode.split("--");
  const slug = parts[0];
  const epNum = parseInt(parts[1] || "1", 10);

  if (!slug || isNaN(epNum)) {
    return NextResponse.json({ error: "Invalid episode" }, { status: 400 });
  }

  const isFree = epNum <= FREE_EPISODES;
  const isVip = await checkVipStatus(request);

  if (!isFree && !isVip) {
    return NextResponse.json({
      status: "paywall",
      message: "This episode requires coins to unlock",
      series: slug,
      episode: epNum,
      coinCost: 49,
    }, { status: 402 });
  }

  // Look up real Mux playback
  const mux = getPlayback(slug, epNum);

  if (!mux) {
    return NextResponse.json({
      status: "not_found",
      message: "No video available for this episode",
    }, { status: 404 });
  }

  return NextResponse.json({
    status: "ok",
    series: slug,
    episode: epNum,
    playbackId: mux.playbackId,
    playbackUrl: `https://stream.mux.com/${mux.playbackId}.m3u8`,
    duration: mux.duration,
    poster: `https://image.mux.com/${mux.playbackId}/thumbnail.jpg?time=5&width=720&height=1280`,
    vip: isVip || undefined,
  });
}
