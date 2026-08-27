import { DISCOVER_CATEGORY_SLUGS } from "@/lib/discover-categories";

export function GET() {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.verzatv.com";
  const now = new Date().toISOString().split("T")[0];

  /* Genre slugs matching /genre/[genre] and /discover/[genre] routes */
  const genreSlugs = [
    "romance",
    "thriller",
    "drama",
    "comedy",
    "mystery",
    "billionaire",
    "revenge",
    "forbidden",
  ];

  const genreUrls = genreSlugs.map(
    (g) => `  <url>
    <loc>${baseUrl}/genre/${g}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`,
  );

  const discoverUrls = DISCOVER_CATEGORY_SLUGS.map(
    (g) => `  <url>
    <loc>${baseUrl}/discover/${g}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`,
  );

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${genreUrls.join("\n")}
${discoverUrls.join("\n")}
</urlset>`;

  return new Response(xml.trim(), {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
