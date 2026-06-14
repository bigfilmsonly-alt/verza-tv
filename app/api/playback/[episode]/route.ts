import { NextRequest, NextResponse } from "next/server";
import { FREE_EPISODES, DEFAULT_COIN_PER_EPISODE } from "@/lib/config";

// Stub: in production, check Supabase entitlements + generate Mux signed URL
// For now, return a playback response that the client can use

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ episode: string }> }
) {
  const { episode } = await params;
  const [slug, epStr] = episode.split("--"); // format: series-slug--episode-number
  const epNum = parseInt(epStr || "1", 10);

  if (!slug || isNaN(epNum)) {
    return NextResponse.json({ error: "Invalid episode" }, { status: 400 });
  }

  // Free gate: first N episodes are always free
  const isFree = epNum <= FREE_EPISODES;

  if (!isFree) {
    // In production: check auth + entitlements from Supabase
    // const user = await getUser(request);
    // const entitled = await checkEntitlement(user.id, slug, epNum);
    // if (!entitled) return NextResponse.json({ error: "Payment required" }, { status: 402 });

    // Stub: return paywall response
    return NextResponse.json(
      {
        status: "paywall",
        message: "This episode requires coins to unlock",
        series: slug,
        episode: epNum,
        coinCost: DEFAULT_COIN_PER_EPISODE,
      },
      { status: 402 }
    );
  }

  // In production: generate Mux signed URL
  // const signedUrl = await generateMuxSignedUrl(playbackId, expiresIn: 3600);

  // Stub: return playback token
  return NextResponse.json({
    status: "ok",
    series: slug,
    episode: epNum,
    playbackType: "stub", // "mux" in production
    // playbackUrl: signedUrl, // Mux signed URL
    // expiresAt: new Date(Date.now() + 3600000).toISOString(),
    message: "Playback stub — wire Mux signed URLs in production",
  });
}
