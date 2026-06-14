import Image from "next/image";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import ChannelRow from "@/components/ChannelRow";
import {
  catalog,
  getLiveSeries,
  getComingSoonSeries,
  getSeriesByChannel,
} from "@/lib/catalog";
import {
  organizationSchema,
  webSiteSchema,
  mobileAppSchema,
} from "@/lib/schemas";

export default function HomePage() {
  const featured = catalog[0]; // The Missing Piece
  const mustSees = getSeriesByChannel("Must-sees");
  const trending = getSeriesByChannel("Trending");
  const drama = getSeriesByChannel("Drama");
  const comingSoon = getComingSoonSeries();

  return (
    <>
      {/* Structured data */}
      <JsonLd
        data={[organizationSchema(), webSiteSchema(), mobileAppSchema()]}
      />

      {/* ---- Hero Banner ---- */}
      <section className="relative w-full" style={{ height: 420 }}>
        {/* Poster background */}
        <Image
          src={featured.posterUrl}
          alt={featured.title}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />

        {/* Gradient overlay */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(7,7,14,0.25) 0%, rgba(7,7,14,0.6) 50%, #07070E 100%)",
          }}
        />

        {/* Hero content */}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-6">
          <h1
            className="text-2xl font-bold leading-tight mb-1"
            style={{ color: "#F5F4F8" }}
          >
            {featured.title}
          </h1>
          <p
            className="text-sm leading-snug mb-4 line-clamp-2"
            style={{ color: "#A0A0B0" }}
          >
            {featured.logline}
          </p>

          {/* CTA buttons */}
          <div className="flex gap-3">
            <Link
              href={`/series/${featured.slug}`}
              className="flex items-center justify-center rounded-full px-6 py-2.5 text-sm font-semibold"
              style={{
                background: "#E0115F",
                color: "#F5F4F8",
              }}
            >
              Watch Free
            </Link>
            <Link
              href={`/series/${featured.slug}`}
              className="flex items-center justify-center rounded-full px-6 py-2.5 text-sm font-semibold"
              style={{
                background: "rgba(255,255,255,0.08)",
                color: "#F5F4F8",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
            >
              Details
            </Link>
          </div>
        </div>
      </section>

      {/* ---- Channel Rows ---- */}
      <ChannelRow title="Must-sees" series={mustSees} />
      <ChannelRow title="Trending" series={trending} />
      <ChannelRow title="Drama" series={drama} />

      {/* ---- Coming Soon ---- */}
      <ChannelRow title="Coming Soon" series={comingSoon} dimmed />

      {/* Bottom spacer for BottomNav clearance */}
      <div className="h-8" />
    </>
  );
}
