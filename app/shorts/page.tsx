import type { Metadata } from "next";
import { getLiveSeries } from "@/lib/catalog";
import ShortsFeed from "@/components/ShortsFeed";
import { websiteSchema } from "@/lib/seo/schema";
import JsonLd from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "Shorts | Verza TV",
  description:
    "Swipe through short cliffhanger previews of Verza TV originals — vertical micro-dramas, reality, and more.",
  alternates: { canonical: "/shorts" },
};

export default function ShortsPage() {
  const series = getLiveSeries();
  return (
    <div style={{ background: "#07070E" }}>
      <JsonLd data={websiteSchema()} />
      <ShortsFeed series={series} />
    </div>
  );
}
