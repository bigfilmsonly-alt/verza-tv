import { getCreatorContext } from "@/lib/creator";
import { isPlaceholderHandle, type DraftSocial } from "@/lib/creator-client";
import { muxConfigured } from "@/lib/mux-upload";
import { privateJson } from "@/lib/private-json";

/**
 * GET /api/creator/me
 * Returns the signed-in user's creator profile + lifecycle state and, for the
 * save-and-resume wizard, every draft value plus the current_step cursor.
 *
 * PII NOTE: this endpoint is owner-only (getCreatorContext reads the signed-in
 * user's OWN row), so returning their own draft PII back to them is fine. Do NOT
 * add payout/tax-id/stripe fields to any PUBLIC endpoint.
 */
export async function GET() {
  const ctx = await getCreatorContext();
  if (!ctx) {
    return privateJson({ authenticated: false }, { status: 401 });
  }
  const c = ctx.creator;
  const social: DraftSocial = {
    instagram: c?.social_links?.instagram ?? "",
    tiktok: c?.social_links?.tiktok ?? "",
    youtube: c?.social_links?.youtube ?? "",
    imdb: c?.social_links?.imdb ?? "",
  };
  // Never surface the auto-stamped placeholder handle back into the resume form.
  const handleForForm = c && !isPlaceholderHandle(c.handle) ? c.handle : "";

  // privateJson (not Response.json) is main's wrapper: this route is
  // authenticated and must stay private/no-store.
  return privateJson({
    authenticated: true,
    email: ctx.email,
    muxReady: muxConfigured(),
    creator: c
      ? {
          status: c.status,
          handle: handleForForm,
          displayName: c.display_name,
          bio: c.bio,
          // Show the reviewer note (changes_requested) or, failing that, the
          // decline reason (declined) so the status screen is never a dead end.
          reviewerNotes: c.reviewer_notes ?? c.rejection_reason ?? null,
          payoutSplit: c.payout_split,
          currentStep: c.current_step ?? 1,
          draft: {
            // Step A
            displayName: c.display_name ?? "",
            realName: c.real_name ?? "",
            country: c.country ?? "",
            bio: c.bio ?? "",
            avatarUrl: c.avatar_url ?? "",
            handle: handleForForm,
            website: c.website ?? "",
            social,
            // Step B
            contentTypes: c.content_types ?? [],
            contentLanguages: c.content_languages ?? [],
            finishedTitles: c.finished_titles != null ? String(c.finished_titles) : "",
            contentLinks: c.content_links ?? [],
            totalRuntimeMinutes:
              c.total_runtime_minutes != null ? String(c.total_runtime_minutes) : "",
            sampleLink: c.sample_link ?? "",
            contentRating: c.content_rating ?? "",
            // Step C
            rightsAttested: !!c.rights_attested,
            territory: (c.territory ?? "") as "" | "worldwide" | "specified",
            territoryDetail: c.territory_detail ?? "",
            exclusivity: (c.exclusivity ?? "") as "" | "exclusive" | "non_exclusive",
            agreementAccepted: !!c.agreement_accepted,
            // Step D
            payoutPreference: c.payout_preference ?? "stripe",
            taxCountry: c.tax_country ?? "",
            paymentAck: !!c.payment_ack,
          },
        }
      : null,
  });
}
