import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { products, getProductBySlug } from "@/lib/products";
import { T } from "@/lib/theme";
import AddToCartButton from "@/components/AddToCartButton";
import ImageCarousel from "@/components/ImageCarousel";

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
      {/* Product Image Carousel */}
      <div className="mb-6">
        <ImageCarousel images={product.images} alt={product.name} />
      </div>

      {/* Info */}
      <h1 className="text-xl font-bold mb-2" style={{ color: T.text }}>
        {product.name}
      </h1>
      <p className="text-2xl font-bold mb-1" style={{ color: T.accent }}>
        ${product.price.toFixed(2)}
      </p>
      <p className="text-xs mb-1" style={{ color: T.textMute }}>
        {product.category} &middot; Free shipping over $100
      </p>
      {product.images.length > 1 && (
        <p className="text-xs mb-4" style={{ color: T.textDim }}>
          {product.images.length} color options available
        </p>
      )}

      <div className="mt-4">
        <AddToCartButton product={product} />
      </div>
    </section>
  );
}
