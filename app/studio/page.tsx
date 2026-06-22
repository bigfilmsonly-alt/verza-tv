import type { Metadata } from "next";
import { BRAND } from "@/lib/config";
import CreatorApplicationForm from "@/components/CreatorApplicationForm";
import CreatorAITools from "@/components/CreatorAITools";

export const metadata: Metadata = {
  title: `Apply to Become a Creator | ${BRAND.name}`,
  description:
    "Exclusive VIP: Apply to become a Verza TV creator. Make your own channel, upload content, set pricing, and earn directly from subscribers. Use AI tools to write scripts, loglines, and more.",
};

export default function StudioPage() {
  return (
    <>
      <CreatorApplicationForm />
      <CreatorAITools />
    </>
  );
}
