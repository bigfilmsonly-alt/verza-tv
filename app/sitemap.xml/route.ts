export function GET() {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://verzatv.com";

  const sitemaps = [
    `${baseUrl}/sitemaps/shows.xml`,
    `${baseUrl}/sitemaps/episodes.xml`,
    `${baseUrl}/sitemaps/genres.xml`,
    `${baseUrl}/sitemaps/pages.xml`,
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps.map((url) => `  <sitemap><loc>${url}</loc></sitemap>`).join("\n")}
</sitemapindex>`;

  return new Response(xml.trim(), {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
