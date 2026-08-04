import type { Metadata } from "next";
import { BRAND } from "@/lib/config";
import CreatorDashboard from "@/components/CreatorDashboard";

export const metadata: Metadata = {
  title: `Creator Studio | ${BRAND.name}`,
  description:
    "Apply to the VERZA TV creator program and submit project or channel details for review. Upload access and commercial terms are available only to individually approved creators.",
};

export default function StudioPage() {
  // Creator AI generation is intentionally absent from the launch surface.
  // The production environment has no configured provider, so rendering the
  // old controls would advertise a feature whose requests cannot be fulfilled.
  return <CreatorDashboard />;
}
