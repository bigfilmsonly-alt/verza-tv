import type { Metadata } from "next";
import HorizontalFeed from "@/components/HorizontalFeed";

export const metadata: Metadata = {
  title: "Horizontal | Verza TV",
  description:
    "Watch widescreen episodes and clips in full HD landscape format on Verza TV.",
};

export default function HorizontalPage() {
  return (
    <div style={{ background: "#07070E", minHeight: "100dvh" }}>
      <HorizontalFeed />
    </div>
  );
}
