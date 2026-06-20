import type { Metadata } from "next";
import AdminDashboard from "@/components/AdminDashboard";

export const metadata: Metadata = {
  title: "Dashboard | Verza TV Admin",
  robots: { index: false, follow: false },
};

export default function AdminDashboardPage() {
  return <AdminDashboard />;
}
