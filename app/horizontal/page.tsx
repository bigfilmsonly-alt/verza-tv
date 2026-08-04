import type { Metadata } from "next";
import HorizontalFeed from "@/components/HorizontalFeed";
import { organizationSchema } from "@/lib/seo/schema";
import JsonLd from "@/components/JsonLd";
import HorizontalBackButton from "@/components/HorizontalBackButton";

export const metadata: Metadata = {
  title: "Storage Pirates",
  description:
    "Watch Storage Pirates widescreen episodes in full HD landscape format on VERZA TV.",
  alternates: { canonical: "/horizontal" },
};

export default function HorizontalPage() {
  return (
    <div style={{ background: "#07070E", minHeight: "100dvh" }}>
      <JsonLd data={organizationSchema()} />
      <HorizontalBackButton />
      <HorizontalFeed />
    </div>
  );
}
