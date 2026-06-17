import { getLiveSeries, getEpisodesForSeries } from "@/lib/catalog";
import { MUX_MAP } from "@/lib/mux-map";

function esc(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function GET() {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://verzatv.com";
  const now = new Date().toISOString().split("T")[0];

  const liveSeries = getLiveSeries();

  const urls = liveSeries.flatMap((s) => {
    const episodes = getEpisodesForSeries(s.slug);
    const muxEpisodes = MUX_MAP[s.slug] ?? [];

    return episodes.map((ep) => {
      const muxEntry = muxEpisodes.find((m) => m.episode === ep.number);
      const loc = `${baseUrl}/series/${s.slug}/${ep.number}`;

      let videoBlock = "";
      if (muxEntry) {
        const title = esc(`${s.title} - Episode ${ep.number}`);
        const description = esc(
          `Watch Episode ${ep.number} of ${s.title} on Verza TV`,
        );
        const thumbnailLoc = `https://image.mux.com/${muxEntry.playbackId}/thumbnail.jpg?time=3&amp;width=1280&amp;height=720`;
        const contentLoc = `https://stream.mux.com/${muxEntry.playbackId}.m3u8`;

        videoBlock = `
    <video:video>
      <video:thumbnail_loc>${thumbnailLoc}</video:thumbnail_loc>
      <video:title>${title}</video:title>
      <video:description>${description}</video:description>
      <video:content_loc>${contentLoc}</video:content_loc>
      <video:player_loc>${loc}</video:player_loc>
      <video:duration>${muxEntry.duration}</video:duration>
      <video:family_friendly>yes</video:family_friendly>
      <video:live>no</video:live>
    </video:video>`;
      }

      return `  <url>
    <loc>${loc}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>${videoBlock}
  </url>`;
    });
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${urls.join("\n")}
</urlset>`;

  return new Response(xml.trim(), {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
