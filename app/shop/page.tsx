import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { T } from "@/lib/theme";
import { products } from "@/lib/products";
import { BRAND } from "@/lib/config";
import CartButton from "@/components/CartButton";

export const metadata: Metadata = {
  title: `Shop | ${BRAND.name}`,
  description: "Official Verza TV merch — hoodies, mugs, socks, water bottles, and more.",
};

export default function ShopPage() {
  return (
    <section className="px-4 pt-6 pb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: T.text }}>
            Shop
          </h1>
          <p className="text-sm mt-1" style={{ color: T.textMute }}>
            Official Verza TV merch
          </p>
        </div>
        <CartButton />
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-2 gap-3">
        {products.map((product) => (
          <Link
            key={product.id}
            href={`/shop/${product.slug}`}
            className="rounded-xl overflow-hidden no-underline transition-transform active:scale-95"
            style={{ background: T.surface }}
          >
            {/* Product Image */}
            <div
              className="w-full relative overflow-hidden"
              style={{ aspectRatio: "1", background: T.raised }}
            >
              {product.imageUrl ? (
                <Image
                  src={product.imageUrl}
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
                ${product.price.toFixed(2)}
              </p>
              <p className="text-[10px] mt-0.5" style={{ color: T.textMute }}>
                {product.category}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
