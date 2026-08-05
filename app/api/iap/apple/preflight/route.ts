import { NextRequest } from "next/server";
import { getUser } from "@/lib/auth";
import {
  appleSeriesProductId,
  isAppleSeriesProductCurrentlySellable,
  seriesSlugForAppleProductId,
} from "@/lib/apple-iap-products";
import { appleIapEnabled } from "@/lib/apple-iap-verification";
import { getSeriesBySlug } from "@/lib/catalog";
import { privateJson } from "@/lib/private-json";
import { isSeriesPurchasable } from "@/lib/series-purchase";
import { getServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!/^Bearer [^\s]+$/.test(request.headers.get("authorization") ?? "")) {
    return privateJson(
      { error: "Native Apple purchase requires Bearer authentication" },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return privateJson({ error: "Invalid JSON body" }, { status: 400 });
  }
  const seriesSlug =
    body && typeof body === "object" && !Array.isArray(body)
      ? (body as Record<string, unknown>).seriesSlug
      : null;
  if (typeof seriesSlug !== "string" || seriesSlug.length > 100) {
    return privateJson({ error: "seriesSlug is required" }, { status: 400 });
  }

  const user = await getUser();
  if (!user) {
    return privateJson({ error: "Authentication required" }, { status: 401 });
  }
  const series = getSeriesBySlug(seriesSlug);
  if (
    !series ||
    !isSeriesPurchasable(series) ||
    !isAppleSeriesProductCurrentlySellable(series.slug)
  ) {
    return privateJson(
      { error: "Series is not available for purchase" },
      { status: 409 },
    );
  }

  const productId = appleSeriesProductId(series.slug);
  if (seriesSlugForAppleProductId(productId) !== series.slug) {
    return privateJson({ error: "Apple product mapping failed" }, { status: 500 });
  }

  const supabase = getServiceClient();
  const [profileResult, entitlementResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("deletion_requested_at,is_vip,vip_expires_at,vip_payment_blocked")
      .eq("id", user.id)
      .single(),
    supabase
      .from("entitlements")
      .select("id")
      .eq("user_id", user.id)
      .eq("series_slug", series.slug)
      .limit(1),
  ]);
  if (profileResult.error || entitlementResult.error) {
    return privateJson(
      { error: "Could not verify Apple purchase eligibility" },
      { status: 500 },
    );
  }
  if (profileResult.data.deletion_requested_at) {
    return privateJson({ error: "Account deletion is in progress" }, { status: 409 });
  }
  const vipExpiry = profileResult.data.vip_expires_at;
  const vipExpiryMs = typeof vipExpiry === "string" ? Date.parse(vipExpiry) : null;
  const hasCurrentVip =
    profileResult.data.is_vip === true &&
    profileResult.data.vip_payment_blocked !== true &&
    (vipExpiry === null ||
      (Number.isFinite(vipExpiryMs) && (vipExpiryMs ?? 0) > Date.now()));
  if (hasCurrentVip) {
    return privateJson(
      { error: "Your active VIP access already includes this series" },
      { status: 409 },
    );
  }
  if ((entitlementResult.data?.length ?? 0) > 0) {
    return privateJson(
      { error: "You already own this series", alreadyOwned: true },
      { status: 409 },
    );
  }
  if (!appleIapEnabled()) {
    return privateJson(
      { error: "Apple series purchases are temporarily unavailable" },
      { status: 503 },
    );
  }

  return privateJson({
    purchaseAllowed: true,
    productId,
    seriesSlug: series.slug,
  });
}
