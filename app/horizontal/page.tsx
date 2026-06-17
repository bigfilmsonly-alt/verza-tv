import type { Metadata } from "next";
import HorizontalFeed from "@/components/HorizontalFeed";
import { organizationSchema } from "@/lib/seo/schema";
import JsonLd from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "Horizontal | Verza TV",
  description:
    "Watch widescreen episodes and clips in full HD landscape format on Verza TV.",
  alternates: { canonical: "/horizontal" },
};

export default function HorizontalPage() {
  return (
    <div style={{ background: "#07070E", minHeight: "100dvh" }}>
      <JsonLd data={organizationSchema()} />
      <HorizontalFeed />
    </div>
  );
}
