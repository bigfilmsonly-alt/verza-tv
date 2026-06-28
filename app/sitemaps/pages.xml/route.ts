import { allProgrammaticPaths } from "@/lib/data/sitemap";

export function GET() {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://verzatv.com";
  const now = new Date().toISOString().split("T")[0];

  const staticPages = [
    { loc: "/", priority: "1.0", changefreq: "daily" },
    { loc: "/discover", priority: "0.9", changefreq: "daily" },
    { loc: "/channels", priority: "0.8", changefreq: "weekly" },
    { loc: "/shop", priority: "0.7", changefreq: "monthly" },
    { loc: "/press", priority: "0.6", changefreq: "monthly" },
    { loc: "/about", priority: "0.6", changefreq: "monthly" },
    { loc: "/help", priority: "0.5", changefreq: "monthly" },
    { loc: "/search", priority: "0.7", changefreq: "weekly" },
    { loc: "/shorts", priority: "0.7", changefreq: "daily" },
    { loc: "/terms", priority: "0.3", changefreq: "yearly" },
    { loc: "/privacy", priority: "0.3", changefreq: "yearly" },
    { loc: "/refund-policy", priority: "0.3", changefreq: "yearly" },
  ];

  const allPages = [...staticPages, ...allProgrammaticPaths()];

  const urls = allPages.map(
    (page) => `  <url>
    <loc>${baseUrl}${page.loc}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
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
