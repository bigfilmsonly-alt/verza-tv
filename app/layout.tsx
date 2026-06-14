import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Image from "next/image";
import "./globals.css";
import BottomNav from "@/components/BottomNav";

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
        <div className="app-shell">
          {/* Top bar with logo */}
          <header className="flex items-center justify-between px-4 pt-3 pb-2">
            <Image
              src="/logo.png"
              alt="Verza TV"
              width={120}
              height={36}
              priority
              className="h-9 w-auto"
            />
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
              style={{
                background: "rgba(255,200,61,0.1)",
                border: "1px solid rgba(255,200,61,0.2)",
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="#FFC83D"
                stroke="none"
              >
                <circle cx="12" cy="12" r="10" />
              </svg>
              <span
                className="text-xs font-bold"
                style={{ color: "#FFC83D" }}
              >
                0
              </span>
            </div>
          </header>

          <main className="flex-1 pb-20">{children}</main>
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
