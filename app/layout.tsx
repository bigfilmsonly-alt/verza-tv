import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { CartProvider } from "@/lib/cart";
import CartDrawer from "@/components/CartDrawer";
import { LangProvider } from "@/components/LangProvider";
import ServiceWorker from "@/components/ServiceWorker";
import ContentTranslator from "@/components/ContentTranslator";
import AskVerza from "@/components/AskVerza";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Script from "next/script";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://verzatv.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Verza TV — Microdramas, Reality & More",
    template: "%s | Verza TV",
  },
  description:
    "Stream binge-worthy micro-dramas, reality shows, and original series — all in vertical, all in minutes. The first US-based vertical micro-drama platform.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "Verza TV",
    title: "Verza TV — Microdramas, Reality & More",
    description:
      "Stream binge-worthy micro-dramas, reality shows, and original series — all in vertical, all in minutes.",
    url: SITE_URL,
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Verza TV — Microdramas, Reality & More",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@VerzaTV",
    title: "Verza TV — Microdramas, Reality & More",
    description:
      "Stream binge-worthy micro-dramas, reality shows, and original series — all in vertical, all in minutes.",
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Verza TV",
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
    title: "Verza TV",
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
          <AskVerza />
        </LangProvider>
        </CartProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
