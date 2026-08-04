import { NextRequest, NextResponse } from "next/server";
import { getSeriesBySlug } from "@/lib/catalog";
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

  const catalogSeries = getSeriesBySlug(series);
  if (!catalogSeries || catalogSeries.status !== "live" || epNum > catalogSeries.episodeCount) {
    return NextResponse.json(
      { error: "Series or episode not found" },
      { status: 404 },
    );
  }

  // Free access is per-series catalog data. Some live titles are wholly free,
  // so a global five-episode constant would incorrectly paywall them.
  if (epNum <= catalogSeries.freeEpisodes) {
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
