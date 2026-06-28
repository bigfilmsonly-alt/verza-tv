import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PERF_TEST_MODE } from "@/lib/perf/seed";
import PerfHarness from "@/components/PerfHarness";

export const metadata: Metadata = {
  title: "Perf Harness",
  robots: { index: false, follow: false },
};

export default function PerfPage() {
  if (!PERF_TEST_MODE) notFound();
  return <PerfHarness />;
}
