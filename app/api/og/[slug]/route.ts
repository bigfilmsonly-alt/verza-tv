import { NextRequest, NextResponse } from "next/server";
import { getSeriesBySlug } from "@/lib/catalog";

// Dynamic OG image route — redirects to the series poster for social previews.
// Usage: /api/og/the-blackthornes -> 302 redirect to /posters/the-blackthornes.png
//
// Crawlers (Twitter, Facebook, iMessage, etc.) follow redirects, so the poster
// image becomes the OG card for any series page that sets:
//   openGraph.images = [{ url: `/api/og/${slug}` }]

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://verzatv.com";
const FALLBACK_OG = "/og-image.png";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const series = getSeriesBySlug(slug);

  if (!series) {
    // Unknown slug — redirect to the default site-wide OG image
    return NextResponse.redirect(new URL(FALLBACK_OG, SITE_URL), 302);
  }

  // If the series has no poster (empty string), use the fallback
  const posterPath = series.posterUrl || FALLBACK_OG;

  return NextResponse.redirect(new URL(posterPath, SITE_URL), 302);
}
