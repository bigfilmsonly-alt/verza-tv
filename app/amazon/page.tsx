import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { T } from "@/lib/theme";
import { BRAND } from "@/lib/config";
import { AMAZON_PRODUCTS, AMAZON_STOREFRONT } from "@/lib/amazon-sponsors";
import AmazonTile from "@/components/AmazonProducts";
import AmazonDeepLink from "@/components/AmazonDeepLink";

export const metadata: Metadata = {
  title: `Amazon Picks | ${BRAND.name}`,
  description:
    "Every Amazon product the VERZA TV team is loving right now. Beauty, skincare, dresses and cozy essentials. Add them to your bag and send the whole thing to your Amazon cart in one tap.",
  alternates: { canonical: "/amazon" },
};

export default function AmazonPage() {
  return (
    <section className="px-4 pt-6 pb-10">
      {/* Opens a product when arrived at via /amazon?p=<id> (the footer Shop
          list). Suspense-wrapped because useSearchParams would otherwise force
          this whole page out of static rendering. */}
      <Suspense fallback={null}>
        <AmazonDeepLink />
      </Suspense>

      <div className="mb-5">
        <h1 className="text-2xl font-bold" style={{ color: T.text }}>
          Amazon Picks
        </h1>
        <p className="text-sm mt-1" style={{ color: T.textMute }}>
          Beauty, skincare, dresses and cozy essentials we are loving right now.
        </p>
      </div>

      {/* How the bag works. Says plainly where money changes hands, which the
          FTC requires and which shoppers deserve before the first tap. */}
      <div
        className="rounded-xl px-4 py-3 mb-6"
        style={{ background: "rgba(255,153,0,0.08)", border: "1px solid rgba(255,153,0,0.22)" }}
      >
        <p className="text-[12px] font-semibold" style={{ color: "#FF9900" }}>
          Build your bag here, check out on Amazon
        </p>
        <p className="text-[11px] mt-1 leading-relaxed" style={{ color: "rgba(245,244,248,0.6)" }}>
          Add anything you like without leaving Verza TV. When you are done, one tap sends your
          whole bag to your Amazon cart. As an Amazon Associate, VERZA TV earns from qualifying
          purchases.
        </p>
      </div>

      {AMAZON_PRODUCTS.length === 0 ? (
        <p className="text-sm py-10 text-center" style={{ color: T.textMute }}>
          No products right now. Check back soon.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-x-3 gap-y-5">
          {AMAZON_PRODUCTS.map((p) => (
            <AmazonTile key={p.id} product={p} />
          ))}
        </div>
      )}

      <a
        href={AMAZON_STOREFRONT}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="mt-8 w-full flex items-center justify-center gap-2 no-underline rounded-2xl py-3.5 text-sm font-bold transition-transform active:scale-[0.98]"
        style={{ background: "rgba(255,255,255,0.07)", color: T.text, border: `1px solid ${T.line}` }}
      >
        Visit the full VERZA TV Amazon storefront
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M15 3h6v6M10 14L21 3" />
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
        </svg>
      </a>

      <div className="mt-6 text-center">
        <Link href="/shop" className="text-[12px] font-semibold no-underline" style={{ color: T.accent }}>
          Looking for official VERZA merch? Shop here
        </Link>
      </div>
    </section>
  );
}
