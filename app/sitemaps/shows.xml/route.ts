import { getLiveSeries } from "@/lib/catalog";

export function GET() {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://verzatv.com";
  const now = new Date().toISOString().split("T")[0];

  const liveSeries = getLiveSeries();

  const urls = liveSeries.map(
    (s) => `  <url>
    <loc>${baseUrl}/series/${s.slug}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`,
  );

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

  return new Response(xml.trim(), {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
