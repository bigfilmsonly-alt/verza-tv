import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getServiceClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import CreatorWatch from "@/components/CreatorWatch";

type Props = {
  params: Promise<{ slug: string[] }>;
  searchParams: Promise<{ unlocked?: string }>;
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
    title: `${content.title} | Verza TV`,
    description: content.description?.slice(0, 200) || `Watch ${content.title} on Verza TV.`,
    alternates: { canonical: `/watch/${content.slug}` },
    openGraph: {
      title: content.title,
      type: "video.other",
      images: content.mux_playback_id
        ? [`https://image.mux.com/${content.mux_playback_id}/thumbnail.jpg?width=1080`]
        : [],
    },
  };
}

export default async function WatchPage({ params, searchParams }: Props) {
  const { slug: segments } = await params;
  const { unlocked } = await searchParams;
  const slug = segments.join("/");

  const content = await getPublishedContent(slug);
  if (!content || !content.mux_playback_id) notFound();

  const creator = Array.isArray(content.creators) ? content.creators[0] : content.creators;
  const isFree = content.pricing_type === "free";

  // Access check: free titles, the just-completed checkout redirect, or an
  // entitlement row (written server-side by the Stripe webhook, keyed by slug).
  let hasAccess = isFree || unlocked === "true";
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
