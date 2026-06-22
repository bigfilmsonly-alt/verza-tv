import { NextRequest, NextResponse } from "next/server";
import { FREE_EPISODES } from "@/lib/config";
import { checkVipStatus } from "@/lib/vip";
import { getUser } from "@/lib/auth";
import { getServiceClient } from "@/lib/supabase/server";

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
      { status: 400 },
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

  // VIP check: if user is VIP, all episodes are entitled
  const isVip = await checkVipStatus(request);
  if (isVip) {
    const res: EntitlementResponse = {
      entitled: true,
      reason: "vip",
      series,
      episode: epNum,
    };
    return NextResponse.json(res);
  }

  // Check if user has purchased this series
  const user = await getUser();
  if (user) {
    const supabase = getServiceClient();
    const { data: ent } = await supabase
      .from("entitlements")
      .select("id")
      .eq("user_id", user.id)
      .eq("series_slug", series)
      .maybeSingle();
    if (ent) {
      const res: EntitlementResponse = {
        entitled: true,
        reason: "purchased",
        series,
        episode: epNum,
      };
      return NextResponse.json(res);
    }
  }

  // Default: not entitled
  const res: EntitlementResponse = {
    entitled: false,
    series,
    episode: epNum,
  };
  return NextResponse.json(res);
}
