import { getCreatorContext } from "@/lib/creator";
import { muxConfigured } from "@/lib/mux-upload";

/**
 * GET /api/creator/me
 * Returns the signed-in user's creator profile + approval state. Used by the
 * dashboard to decide between the apply screen, the "pending review" gate, and
 * the full creator dashboard.
 */
export async function GET() {
  const ctx = await getCreatorContext();
  if (!ctx) {
    return Response.json({ authenticated: false }, { status: 401 });
  }
  return Response.json({
    authenticated: true,
    email: ctx.email,
    muxReady: muxConfigured(),
    creator: ctx.creator
      ? {
          handle: ctx.creator.handle,
          displayName: ctx.creator.display_name,
          bio: ctx.creator.bio,
          status: ctx.creator.status,
          rejectionReason: ctx.creator.rejection_reason,
          payoutSplit: ctx.creator.payout_split,
        }
      : null,
  });
}
