import type { Metadata } from "next";
import { BRAND } from "@/lib/config";
import CreatorDashboard from "@/components/CreatorDashboard";

export const metadata: Metadata = {
  title: `Creator Studio | ${BRAND.name}`,
  description:
    "Apply to the VERZA TV creator program and submit project or channel details for review.",
  robots: { index: false, follow: false },
};

export default function CreatorPage() {
  return <CreatorDashboard />;
}
