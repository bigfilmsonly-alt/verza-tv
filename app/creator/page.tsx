import type { Metadata } from "next";
import { BRAND } from "@/lib/config";
import CreatorDashboard from "@/components/CreatorDashboard";

export const metadata: Metadata = {
  title: `Creator Studio | ${BRAND.name}`,
  description:
    "Apply, upload, price, and manage your titles on Verza TV. Keep up to 80% of every sale.",
  robots: { index: false, follow: false },
};

export default function CreatorPage() {
  return <CreatorDashboard />;
}
