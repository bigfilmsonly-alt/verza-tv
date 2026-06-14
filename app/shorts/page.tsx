import type { Metadata } from "next";
import { getLiveSeries } from "@/lib/catalog";
import ShortsFeed from "@/components/ShortsFeed";

export const metadata: Metadata = {
  title: "Shorts | Verza TV",
  description:
    "Swipe through short cliffhanger previews of Verza TV originals — vertical micro-dramas, reality, and more.",
};

export default function ShortsPage() {
  const series = getLiveSeries();
  return (
    <div style={{ margin: "-0px 0 0 0" }}>
      <ShortsFeed series={series} />
    </div>
  );
}
