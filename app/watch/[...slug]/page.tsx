import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getServiceClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import CreatorWatch from "@/components/CreatorWatch";

type Props = {
  params: Promise<{ slug: string[] }>;
};

/** Look up a published creator title by its namespaced slug (handle/title). */
async function getPublishedContent(slug: string) {
  const supabase = getServiceClient();
  const { data } = await supabase
    .from("creator_content")
    .select(
      "id, slug, title, description, aspect_ratio, poster_url, mux_playback_id, pricing_type, price_cents, status, creators(handle, display_name)",
    )
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  return data;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const content = await getPublishedContent(slug.join("/"));
  if (!content) return { title: "Not Found" };
  return {
    title: `${content.title} | VERZA TV`,
    description: content.description?.slice(0, 200) || `Watch ${content.title} on VERZA TV.`,
    alternates: { canonical: `/watch/${content.slug}` },
    openGraph: {
      title: content.title,
      type: "video.other",
      images:
        content.pricing_type === "free" && content.mux_playback_id
        ? [`https://image.mux.com/${content.mux_playback_id}/thumbnail.jpg?width=1080`]
        : [],
    },
  };
}

export default async function WatchPage({ params }: Props) {
  const { slug: segments } = await params;
  const slug = segments.join("/");

  const content = await getPublishedContent(slug);
  if (!content || !content.mux_playback_id) notFound();

  // Paid creator playback currently uses public Mux playback IDs. Merely
  // hiding the player would expose that ID in the RSC payload, so paid creator
  // pages stay completely fail-closed until signed playback is implemented.
  if (content.pricing_type !== "free") notFound();

  const creator = Array.isArray(content.creators) ? content.creators[0] : content.creators;
  const isFree = content.pricing_type === "free";

  // Paid access is based only on a server-written entitlement. URL query
  // parameters are never proof of payment.
  let hasAccess = isFree;
  if (!hasAccess) {
    const user = await getUser();
    if (user) {
      const supabase = getServiceClient();
      const { data } = await supabase
        .from("entitlements")
        .select("id")
        .eq("user_id", user.id)
        .eq("series_slug", content.slug)
        .limit(1);
      if (data && data.length > 0) hasAccess = true;
    }
  }

  return (
    <CreatorWatch
      slug={content.slug}
      title={content.title}
      description={content.description ?? ""}
      handle={(creator as { handle?: string } | null)?.handle ?? ""}
      displayName={(creator as { display_name?: string } | null)?.display_name ?? ""}
      playbackId={content.mux_playback_id}
      aspect={content.aspect_ratio}
      priceCents={content.price_cents}
      isFree={isFree}
      hasAccess={hasAccess}
    />
  );
}
