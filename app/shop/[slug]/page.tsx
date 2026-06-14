import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { products, getProductBySlug } from "@/lib/products";
import { T } from "@/lib/theme";
import AddToCartButton from "@/components/AddToCartButton";

export async function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) return { title: "Not Found" };
  return {
    title: `${product.name} | Verza TV Shop`,
    description: `Get the ${product.name} for $${product.price.toFixed(2)}`,
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) notFound();

  return (
    <section className="px-4 pt-6 pb-8">
      {/* Product Image */}
      <div
        className="w-full rounded-xl flex items-center justify-center text-base font-bold mb-6"
        style={{
          aspectRatio: "1",
          background: `linear-gradient(135deg, ${T.raised}, ${T.surface})`,
          color: T.textMute,
        }}
      >
        {product.imageUrl ? (
          product.name
        ) : (
          <span className="text-center px-4">{product.name}</span>
        )}
      </div>

      {/* Info */}
      <h1 className="text-xl font-bold mb-2" style={{ color: T.text }}>
        {product.name}
      </h1>
      <p className="text-2xl font-bold mb-1" style={{ color: T.accent }}>
        ${product.price.toFixed(2)}
      </p>
      <p className="text-xs mb-6" style={{ color: T.textMute }}>
        {product.category} &middot; Free shipping over $100
      </p>

      {/* Add to Cart */}
      <AddToCartButton product={product} />
    </section>
  );
}
