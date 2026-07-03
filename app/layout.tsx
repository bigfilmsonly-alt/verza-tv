import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { CartProvider } from "@/lib/cart";
import CartDrawer from "@/components/CartDrawer";
import InstallPrompt from "@/components/InstallPrompt";
import { LangProvider } from "@/components/LangProvider";
import ServiceWorker from "@/components/ServiceWorker";
import ContentTranslator from "@/components/ContentTranslator";
import ScrollToTop from "@/components/ScrollToTop";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Script from "next/script";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// Must be the canonical host the site is actually served on (www). A non-www
// value makes og:image 308-redirect to www, and many link-preview crawlers
// don't follow redirects on og:image → blank thumbnail.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.verzatv.com";

// Bump this when og-image.png changes so link-preview caches (iMessage,
// WhatsApp, Facebook, Twitter…) are forced to re-fetch the new thumbnail.
const OG_IMAGE = `${SITE_URL}/og-image.png?v=4`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "VERZA TV — Microdramas, Reality & More",
    template: "%s | VERZA TV",
  },
  description:
    "Stream binge-worthy micro-dramas, reality shows, and original series — all in vertical, all in minutes. The first US-based vertical micro-drama platform.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "VERZA TV",
    title: "VERZA TV — Microdramas, Reality & More",
    description:
      "Stream binge-worthy micro-dramas, reality shows, and original series — all in vertical, all in minutes.",
    url: SITE_URL,
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
    description:
      "Stream binge-worthy micro-dramas, reality shows, and original series — all in vertical, all in minutes.",
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "VERZA TV",
      },
    ],
  },
  icons: {
    icon: "/favicon.ico",
    apple: [
      { url: "/apple-touch-icon-180.png", sizes: "180x180", type: "image/png" },
      { url: "/apple-touch-icon.png", sizes: "512x512", type: "image/png" },
    ],
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "VERZA TV",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#07070E",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`} style={{ background: "#07070E" }}>
      <head>
        {/* Connection warming — pay down DNS+TLS to Mux before anyone taps play */}
        <link rel="preconnect" href="https://stream.mux.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://image.mux.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://litix.io" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://stream.mux.com" />
        <link rel="dns-prefetch" href="https://image.mux.com" />
        <link rel="dns-prefetch" href="https://litix.io" />
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-HY8HNR5DQD" strategy="afterInteractive" />
        <Script id="ga4" strategy="afterInteractive">{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-HY8HNR5DQD');
        `}</Script>
      </head>
      <body className="min-h-full flex flex-col" style={{ background: "#07070E" }}>
        <ServiceWorker />
        <CartProvider>
        <LangProvider>
          <ContentTranslator />
          <ScrollToTop />
          {/* Single render — CSS adds iPhone frame on desktop */}
          <div className="device-frame">
            <div className="device-screen">
              <div className="app-shell">
                <Header />
                <main className="flex-1 pb-16">{children}</main>
                <Footer />
              </div>
            </div>
            <div className="device-nav-dock">
              <BottomNav />
            </div>
          </div>

          <CartDrawer />
          <InstallPrompt />
        </LangProvider>
        </CartProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
