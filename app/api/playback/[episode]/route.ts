import { NextRequest } from "next/server";
import { getSignedPlaybackUrl } from "@/lib/mux";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ episode: string }> }
) {
  const { episode } = await params;

  // In production: check auth, then check entitlement in Supabase
  // For now: stub that checks if episode number <= 5 (free)
  const epNum = parseInt(episode);

  if (isNaN(epNum)) {
    return Response.json({ error: "Invalid episode" }, { status: 400 });
  }

  // Free episodes (1-5) always allowed
  // Locked episodes would check entitlements table
  if (epNum > 5) {
    return Response.json(
      { error: "Episode locked. Purchase with coins." },
      { status: 403 }
    );
  }

  // Return signed URL (stub video ID)
  const url = getSignedPlaybackUrl(`episode-${episode}`);
  return Response.json({ url });
}
