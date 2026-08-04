import type { Metadata } from "next";
import LibraryPage from "@/components/LibraryPage";

export const metadata: Metadata = {
  title: "Library",
  description:
    "Browse channels, creators, and your saved list — all in one place on VERZA TV.",
};

export default function Library() {
  return <LibraryPage />;
}
