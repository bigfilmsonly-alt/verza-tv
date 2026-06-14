import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import { CartProvider } from "@/lib/cart";
import CartDrawer from "@/components/CartDrawer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Verza TV — Microdramas, Reality & More",
  description:
    "Stream binge-worthy micro-dramas, reality shows, and original series — all in vertical, all in minutes. The first US-based vertical micro-drama platform.",
  robots: { index: false, follow: false },
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
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <CartProvider>
          <div className="app-shell">
            <main className="flex-1 pb-16">{children}</main>
            <BottomNav />
          </div>
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
