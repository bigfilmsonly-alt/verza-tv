import type { Metadata } from "next";
import { BRAND } from "@/lib/config";
import CreatorDashboard from "@/components/CreatorDashboard";
import CreatorAITools from "@/components/CreatorAITools";

export const metadata: Metadata = {
  title: `Creator Studio | ${BRAND.name}`,
  description:
    "Apply to become a Verza TV creator, upload vertical or horizontal titles, set your price, and earn directly from viewers — keep up to 80% of every sale. Plus AI tools for scripts, loglines, and more.",
};

export default function StudioPage() {
  return (
    <>
      <CreatorDashboard />
      <CreatorAITools />
    </>
  );
}
