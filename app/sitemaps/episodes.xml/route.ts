import { getLiveSeries, getEpisodesForSeries } from "@/lib/catalog";

export function GET() {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://verzatv.com";
  const now = new Date().toISOString().split("T")[0];

  const liveSeries = getLiveSeries();

  const urls = liveSeries.flatMap((s) => {
    const episodes = getEpisodesForSeries(s.slug);
    return episodes.map(
      (ep) => `  <url>
    <loc>${baseUrl}/series/${s.slug}/episode/${ep.number}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`,
    );
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

  return new Response(xml.trim(), {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
