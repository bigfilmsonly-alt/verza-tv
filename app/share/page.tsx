import type { Metadata } from "next";
import Image from "next/image";
import ShareRedirect from "@/components/ShareRedirect";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.verzatv.com";
const OG_IMAGE = `${SITE_URL}/og-image.png?v=4`;
const DESCRIPTION =
  "Stream binge-worthy micro-dramas, reality shows, and original series — all in vertical, all in minutes.";

// Dedicated, brandable share URL. Serves the large-logo preview card and
// redirects humans to the app. noindex so it isn't treated as a duplicate of
// the homepage. Bump OG_IMAGE's ?v= when the thumbnail changes.
export const metadata: Metadata = {
  title: { absolute: "VERZA TV — Microdramas, Reality & More" },
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  robots: { index: false, follow: true },
  openGraph: {
    type: "website",
    siteName: "VERZA TV",
    title: "VERZA TV — Microdramas, Reality & More",
    description: DESCRIPTION,
    url: `${SITE_URL}/share`,
    images: [
      {
        url: OG_IMAGE,
        secureUrl: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "VERZA TV — Microdramas, Reality & More",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@VerzaTV",
    title: "VERZA TV — Microdramas, Reality & More",
    description: DESCRIPTION,
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: "VERZA TV" }],
  },
};

export default function SharePage() {
  return (
    <main
      className="flex flex-col items-center justify-center gap-4 px-6 text-center"
      style={{ minHeight: "70vh", background: "#07070E" }}
    >
      <ShareRedirect />
      <Image
        src="/logo.png"
        alt="VERZA TV"
        width={240}
        height={65}
        className="object-contain"
        style={{ filter: "brightness(1.4)" }}
        priority
      />
      <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 14 }}>
        Opening VERZA TV…
      </p>
      <noscript>
        <a href="/" style={{ color: "#E0115F" }}>
          Enter VERZA TV
        </a>
      </noscript>
    </main>
  );
}
