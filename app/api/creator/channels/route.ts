import { NextResponse } from "next/server";
import { listPublicChannels } from "@/lib/creator-channel";

/**
 * Public creator channels for the Creators-page showcase.
 *
 * Public by design, but only ever returns approved + published creators who
 * have at least one published title (see lib/creator-channel.ts, which filters
 * on both flags in the query rather than relying on RLS). No draft, pending or
 * unpublished profile can appear here.
 *
 * Cacheable: this is the same for every visitor and changes only when a creator
 * publishes, so it does not need to be private/no-store like the authenticated
 * creator routes.
 */
export const revalidate = 300;

export async function GET() {
  try {
    const channels = await listPublicChannels(12);
    return NextResponse.json(
      { channels },
      { headers: { "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600" } },
    );
  } catch {
    // A showcase failure must never take down the recruitment page; the
    // component renders its empty state instead.
    return NextResponse.json({ channels: [] });
  }
}
