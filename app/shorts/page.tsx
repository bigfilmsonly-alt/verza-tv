import type { Metadata } from "next";
import { getLiveSeries } from "@/lib/catalog";
import ShortsFeed from "@/components/ShortsFeed";
import { websiteSchema } from "@/lib/seo/schema";
import JsonLd from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "Shorts",
  description:
    "Swipe through short cliffhanger previews of VERZA TV originals — vertical micro-dramas, reality, and more.",
  alternates: { canonical: "/shorts" },
};

export default function ShortsPage() {
  const series = getLiveSeries();
  return (
    <div style={{ background: "var(--t-bg)" }}>
      <JsonLd data={websiteSchema()} />
      <ShortsFeed series={series} />
    </div>
  );
}
