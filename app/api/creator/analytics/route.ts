import { getCreatorContext } from "@/lib/creator";
import { getServiceClient } from "@/lib/supabase/server";

/**
 * GET /api/creator/analytics
 * Per-title performance for the signed-in creator: views (from the analytics
 * event stream, keyed by the content slug as show_id) plus server-verified
 * earnings (from creator_sales, net of refunds). Owner-scoped. Money figures
 * come only from the Stripe-written sales ledger — never from the client.
 */
export async function GET() {
  const ctx = await getCreatorContext();
  if (!ctx?.creator) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getServiceClient();

  // The creator's titles (so we can map slug -> title and scope analytics).
  const { data: titles } = await supabase
    .from("creator_content")
    .select("id, slug, title, status, pricing_type, price_cents, published_at")
    .eq("creator_id", ctx.creator.id);

  const rows = titles ?? [];

  // Per-title view counts from the event stream (best-effort; table may be
  // missing until migration 004 runs — treat any error as zero views).
  const views = new Map<string, number>();
  if (rows.length) {
    const { data: events } = await supabase
      .from("analytics_events")
      .select("show_id")
      .in("show_id", rows.map((r) => r.slug))
      .eq("event", "play_started");
    for (const e of events ?? []) {
      if (e.show_id) views.set(e.show_id, (views.get(e.show_id) ?? 0) + 1);
    }
  }

  // Server-verified earnings from the split ledger.
  const { data: sales } = await supabase
    .from("creator_sales")
    .select("content_id, creator_cents, amount_cents, status")
    .eq("creator_id", ctx.creator.id);

  const earnings = new Map<string, { gross: number; creator: number; sales: number }>();
  let totalCreatorCents = 0;
  let totalGrossCents = 0;
  let totalSales = 0;
  for (const s of sales ?? []) {
    const sign = s.status === "refunded" ? -1 : 1;
    const e = earnings.get(s.content_id) ?? { gross: 0, creator: 0, sales: 0 };
    e.gross += sign * (s.amount_cents ?? 0);
    e.creator += sign * (s.creator_cents ?? 0);
    e.sales += sign;
    earnings.set(s.content_id, e);
    totalCreatorCents += sign * (s.creator_cents ?? 0);
    totalGrossCents += sign * (s.amount_cents ?? 0);
    totalSales += sign;
  }

  const items = rows
    .map((r) => {
      const e = earnings.get(r.id);
      return {
        id: r.id,
        slug: r.slug,
        title: r.title,
        status: r.status,
        pricingType: r.pricing_type,
        priceCents: r.price_cents,
        views: views.get(r.slug) ?? 0,
        sales: e?.sales ?? 0,
        grossCents: e?.gross ?? 0,
        creatorCents: e?.creator ?? 0,
      };
    })
    .sort((a, b) => b.creatorCents - a.creatorCents || b.views - a.views);

  return Response.json({
    payoutSplit: ctx.creator.payout_split,
    payoutEmail: ctx.creator.payout_email,
    totals: {
      titles: rows.length,
      published: rows.filter((r) => r.status === "published").length,
      sales: totalSales,
      grossCents: totalGrossCents,
      creatorCents: totalCreatorCents,
    },
    items,
  });
}
