export function GET() {
  const baseUrl = "https://verzatv.com";
  const now = new Date().toISOString().split("T")[0];

  const staticPages = [
    { loc: "/", priority: "1.0", changefreq: "daily" },
    { loc: "/discover", priority: "0.9", changefreq: "daily" },
    { loc: "/channels", priority: "0.8", changefreq: "weekly" },
    { loc: "/press", priority: "0.6", changefreq: "monthly" },
    { loc: "/about", priority: "0.6", changefreq: "monthly" },
    { loc: "/help", priority: "0.5", changefreq: "monthly" },
  ];

  // 9 known series slugs — replace with Supabase query when ready
  const seriesSlugs = [
    "the-inheritance-game",
    "i-think-my-wife-wants-to-kill-me",
    "the-winter-veil",
    "the-dumb-billionaire",
    "heiress-in-love",
    "broken-vows",
    "last-seen-online",
    "family-empire",
    "love-in-rewind",
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticPages
  .map(
    (page) => `  <url>
    <loc>${baseUrl}${page.loc}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
  )
  .join("\n")}
${seriesSlugs
  .map(
    (slug) => `  <url>
    <loc>${baseUrl}/series/${slug}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;

  return new Response(xml.trim(), {
    headers: { "Content-Type": "application/xml" },
  });
}
