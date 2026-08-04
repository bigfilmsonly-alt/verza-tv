import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { T } from "@/lib/theme";
import { products } from "@/lib/products";
import CartButton from "@/components/CartButton";
import { organizationSchema } from "@/lib/seo/schema";
import JsonLd from "@/components/JsonLd";
import AmazonTile from "@/components/AmazonProducts";
import { AMAZON_PRODUCTS } from "@/lib/amazon-sponsors";

export const metadata: Metadata = {
  title: "Shop",
  description:
    "Browse VERZA TV's sponsored beauty, skincare, entertainment, and cozy picks from Amazon.",
  alternates: { canonical: "/shop" },
};

export default function ShopPage() {
  const merchEnabled = process.env.MERCH_CHECKOUT_ENABLED === "true";

  return (
    <section className="px-4 pt-6 pb-8">
      <JsonLd data={organizationSchema()} />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: T.text }}>
            Shop
          </h1>
          <p className="text-sm mt-1" style={{ color: T.textMute }}>
            {merchEnabled ? "Official VERZA TV merch" : "Sponsored picks from Amazon"}
          </p>
        </div>
        {merchEnabled && <CartButton />}
      </div>

      {/* Product Grid */}
      {merchEnabled && <div className="product-grid grid grid-cols-2 gap-3">
        {products.map((product) => (
          <Link
            key={product.id}
            href={`/shop/${product.slug}`}
            className="rounded-xl overflow-hidden no-underline transition-transform active:scale-[0.97] hover:scale-[1.02]"
            style={{ background: T.surface, border: `1px solid ${T.line}` }}
          >
            {/* Product Image */}
            <div
              className="w-full relative overflow-hidden"
              style={{ aspectRatio: "1", background: T.raised }}
            >
              {product.images[0] ? (
                <Image
                  src={product.images[0]}
                  alt={product.name}
                  fill
                  sizes="(max-width: 440px) 50vw, 220px"
                  className="object-cover"
                />
              ) : (
                <div
                  className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-center px-2"
                  style={{ color: T.textMute }}
                >
                  {product.name.replace("VerzaTV ", "")}
                </div>
              )}
              {product.images.length > 1 && (
                <span
                  className="absolute top-2 right-2 text-[10px] font-bold px-1.5 py-0.5 rounded"
                  style={{ background: "rgba(7,7,14,0.75)", color: "#fff", backdropFilter: "blur(4px)" }}
                >
                  {product.images.length} colors
                </span>
              )}
            </div>

            {/* Info */}
            <div className="p-3">
              <p
                className="text-xs font-semibold leading-tight line-clamp-2 mb-1.5"
                style={{ color: T.text }}
              >
                {product.name}
              </p>
              <p className="text-sm font-bold" style={{ color: T.accent }}>
                ${product.price % 1 === 0 ? product.price.toFixed(0) : product.price.toFixed(2)}
              </p>
              <p
                className="text-[10px] mt-1 inline-block px-1.5 py-0.5 rounded font-medium uppercase tracking-wide"
                style={{ color: T.textMute, background: `${T.text}08` }}
              >
                {product.category}
              </p>
            </div>
          </Link>
        ))}
      </div>}

      {/* The affiliate shop, alongside the merch above. Kept visibly apart on
          purpose: the merch checks out through our own Stripe cart, while these
          settle on Amazon via the Verza bag. Two payment paths on one page is
          only honest if it is obvious which is which, hence its own header, the
          Sponsored label and the disclosure.

          The header sells the connection to the shows rather than naming the
          retailer — "Amazon Picks" read like a filing label. The sponsored
          labelling all stays: its own line here, on every tile, and the
          Associates disclosure below the grid. */}
      {AMAZON_PRODUCTS.length > 0 && (
        <div
          className={merchEnabled ? "mt-10 pt-8" : "mt-2"}
          style={merchEnabled ? { borderTop: `1px solid ${T.line}` } : undefined}
        >
          {/* The headline needs the full width to hold one line, so "View all"
              sits on the sponsored row below rather than beside it. */}
          <div className="headline-oneline">
            <h2 className="font-bold" style={{ color: T.text }}>
              Your favorite shows, your favorite finds
            </h2>
          </div>
          <p className="text-sm mt-1" style={{ color: T.textDim }}>
            Everything you love, all in one place.
          </p>

          <div className="flex items-center justify-between mt-2.5 mb-5">
            <p
              className="text-[10px] font-semibold uppercase tracking-wider m-0"
              style={{ color: "#FF9900" }}
            >
              Sponsored · Ad · Amazon
            </p>
            <Link
              href="/amazon"
              className="no-underline flex items-center gap-1 flex-shrink-0 transition-opacity hover:opacity-80"
              style={{ color: "#FF9900", fontSize: 12, fontWeight: 600 }}
            >
              View all
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>
          </div>

          <div className="-mt-3 mb-5">
            <p className="text-[10px]" style={{ color: T.textMute }}>
              Not personalized
            </p>
            <a
              href="mailto:support@verzatv.com?subject=Report%20an%20Ad%3A%20Amazon&body=Advertiser%3A%20Amazon%0APlacement%3A%20Shop%0A%0APlease%20describe%20why%20this%20ad%20may%20be%20inappropriate%20or%20age-inappropriate%3A"
              className="text-[11px] underline"
              style={{ color: T.textMute }}
            >
              Report an Ad
            </a>
          </div>

          <div className="grid grid-cols-2 gap-x-3 gap-y-5">
            {AMAZON_PRODUCTS.map((p) => (
              <AmazonTile key={p.id} product={p} />
            ))}
          </div>

          <p className="mt-7 text-center text-[11px] leading-relaxed" style={{ color: T.textMute }}>
            Add anything here to your bag without leaving Verza TV, then one tap sends the whole bag
            to your Amazon cart. Checkout completes on Amazon. As an Amazon Associate, VERZA TV earns
            from qualifying purchases.
          </p>
        </div>
      )}
    </section>
  );
}
