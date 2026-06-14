import { NextRequest, NextResponse } from "next/server";
import { FREE_EPISODES } from "@/lib/config";

type EntitlementReason = "free" | "purchased" | "season_pass" | "vip";

interface EntitlementResponse {
  entitled: boolean;
  reason?: EntitlementReason;
  series: string;
  episode: number;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const series = searchParams.get("series");
  const epStr = searchParams.get("episode");
  const epNum = parseInt(epStr || "", 10);

  if (!series || isNaN(epNum) || epNum < 1) {
    return NextResponse.json(
      { error: "Missing or invalid series/episode params" },
      { status: 400 }
    );
  }

  // Free gate: first N episodes are always entitled
  if (epNum <= FREE_EPISODES) {
    const res: EntitlementResponse = {
      entitled: true,
      reason: "free",
      series,
      episode: epNum,
    };
    return NextResponse.json(res);
  }

  // In production: extract user from auth token/session
  // const user = await getUser(request);
  // if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // In production: check Supabase entitlements table
  // 1. Check if user has VIP subscription (vip)
  // const vip = await checkVipStatus(user.id);
  // if (vip) return NextResponse.json({ entitled: true, reason: "vip", series, episode: epNum });

  // 2. Check if user has season pass for this series (season_pass)
  // const pass = await checkSeasonPass(user.id, series);
  // if (pass) return NextResponse.json({ entitled: true, reason: "season_pass", series, episode: epNum });

  // 3. Check if user purchased this specific episode (purchased)
  // const purchased = await checkEpisodePurchase(user.id, series, epNum);
  // if (purchased) return NextResponse.json({ entitled: true, reason: "purchased", series, episode: epNum });

  // Stub: no auth wired yet, so locked episodes are never entitled
  const res: EntitlementResponse = {
    entitled: false,
    series,
    episode: epNum,
  };
  return NextResponse.json(res);
}
