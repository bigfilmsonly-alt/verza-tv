import type { Metadata } from "next";
import AdminReview from "@/components/AdminReview";

export const metadata: Metadata = {
  title: "Review Queue | VERZA TV Admin",
  robots: { index: false, follow: false },
};

export default function AdminReviewPage() {
  return <AdminReview />;
}
