import Image from "next/image";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import HeroCarousel from "@/components/HeroCarousel";
import CategoryTabs from "@/components/CategoryTabs";
import FeedSearch from "@/components/FeedSearch";
import {
  catalog,
  getLiveSeries,
} from "@/lib/catalog";
import {
  organizationSchema,
  webSiteSchema,
  mobileAppSchema,
} from "@/lib/schemas";

export default function HomePage() {
  const live = getLiveSeries();
  // Featured carousel: first 4 live series
  const featured = live.slice(0, 4);
  // Thumbnail row: remaining series
  const thumbnails = live.slice(4);

  return (
    <>
      {/* Structured data */}
      <JsonLd
        data={[organizationSchema(), webSiteSchema(), mobileAppSchema()]}
      />

      {/* ---- Search Bar ---- */}
      <FeedSearch series={catalog} />

      {/* ---- Category Tabs ---- */}
      <CategoryTabs />

      {/* ---- Hero Carousel ---- */}
      <HeroCarousel series={featured} />

      {/* ---- Thumbnail Row ---- */}
      <div className="mt-6 px-4">
        <div className="flex gap-3 overflow-x-auto no-scrollbar">
          {thumbnails.map((s) => (
            <Link
              key={s.slug}
              href={`/series/${s.slug}`}
              className="flex-shrink-0 block"
              style={{ width: 150 }}
            >
              <div
                className="relative overflow-hidden rounded-lg"
                style={{ width: 150, aspectRatio: "3 / 4" }}
              >
                <Image
                  src={s.posterUrl}
                  alt={s.title}
                  fill
                  sizes="150px"
                  className="object-cover"
                />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ---- All Series (crawlable SSR content) ---- */}
      <section className="mt-8 px-4 pb-8">
        <h2
          className="text-sm font-semibold uppercase tracking-wider mb-4"
          style={{ color: "#6B6B7B" }}
        >
          All Shows
        </h2>
        <div className="flex flex-col gap-3">
          {live.map((s) => (
            <Link
              key={s.slug}
              href={`/series/${s.slug}`}
              className="flex items-center gap-3 rounded-xl p-3 no-underline"
              style={{ background: "#12121C", color: "#F5F4F8" }}
            >
              <div
                className="w-12 h-16 rounded-lg flex-shrink-0 overflow-hidden relative"
                style={{ background: "#1A1A26" }}
              >
                <Image
                  src={s.posterUrl}
                  alt={s.title}
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate">{s.title}</p>
                <p
                  className="text-xs mt-0.5"
                  style={{ color: "#6B6B7B" }}
                >
                  {s.genre} &middot; {s.episodeCount} ep
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
