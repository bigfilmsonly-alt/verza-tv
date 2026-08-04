import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { T } from "@/lib/theme";
import { BRAND } from "@/lib/config";
import { AMAZON_PRODUCTS, AMAZON_STOREFRONT } from "@/lib/amazon-sponsors";
import AmazonTile from "@/components/AmazonProducts";
import AmazonDeepLink from "@/components/AmazonDeepLink";

export const metadata: Metadata = {
  title: `Your Favorite Finds | ${BRAND.name}`,
  description:
    "Your favorite shows, your favorite finds, everything you love in one place. Beauty, skincare, dresses and cozy essentials. Add them to your bag and send the whole thing to your Amazon cart in one tap.",
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
        <div className="headline-oneline">
          <h1 className="font-bold" style={{ color: T.text }}>
            Your favorite shows, your favorite finds
          </h1>
        </div>
        <p className="text-sm mt-1.5" style={{ color: T.textDim }}>
          Everything you love, all in one place.
        </p>
        <p
          className="text-[10px] font-semibold uppercase tracking-wider mt-2"
          style={{ color: "#FF9900" }}
        >
          Sponsored · Ad · Amazon
        </p>
        <p className="mt-1 text-[10px]" style={{ color: T.textMute }}>
          Not personalized
        </p>
        <a
          href="mailto:support@verzatv.com?subject=Report%20an%20Ad%3A%20Amazon&body=Advertiser%3A%20Amazon%0APlacement%3A%20Amazon%20store%0A%0APlease%20describe%20why%20this%20ad%20may%20be%20inappropriate%20or%20age-inappropriate%3A"
          className="inline-block mt-2 text-[11px] underline"
          style={{ color: T.textMute }}
        >
          Report an Ad
        </a>
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
          No products are currently listed.
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
          Browse more sponsored picks
        </Link>
      </div>
    </section>
  );
}
