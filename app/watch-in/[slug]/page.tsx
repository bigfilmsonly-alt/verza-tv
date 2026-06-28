import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getLiveSeries, type Series } from "@/lib/catalog";
import { itemListSchema, breadcrumbSchema, faqSchema } from "@/lib/schemas";
import JsonLd from "@/components/JsonLd";
import { T } from "@/lib/theme";
import { LOCATIONS, getLocation, type LocationPage } from "@/lib/data/locations";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://verzatv.com";

/* ------------------------------------------------------------------ */
/*  Deterministic shuffle so each location surfaces a different mix,    */
/*  but always real, live series — never hardcoded slugs.              */
/* ------------------------------------------------------------------ */

function hashSlug(slug: string): number {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    const char = slug.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

/** Deterministic, location-specific ordering of the live catalog. */
function curateForLocation(slug: string, count: number): Series[] {
  const seed = hashSlug(slug);
  const live = getLiveSeries();
  // Stable sort keyed on a per-series hash mixed with the location seed.
  const ordered = [...live].sort((a, b) => {
    const ha = hashSlug(`${slug}-${a.slug}`) ^ seed;
    const hb = hashSlug(`${slug}-${b.slug}`) ^ seed;
    if (ha !== hb) return ha - hb;
    return a.slug.localeCompare(b.slug);
  });
  return ordered.slice(0, count);
}

/** ~6 other locations to cross-link, deterministic per slug. */
function relatedLocations(current: LocationPage, count: number): LocationPage[] {
  const seed = hashSlug(current.slug);
  const others = LOCATIONS.filter((l) => l.slug !== current.slug);
  // Prefer same-type entries first, then fill with the rest, all shuffled.
  const sameType = others.filter((l) => l.type === current.type);
  const otherType = others.filter((l) => l.type !== current.type);
  const sortByHash = (list: LocationPage[]) =>
    [...list].sort(
      (a, b) =>
        ((hashSlug(a.slug) ^ seed) >>> 0) - ((hashSlug(b.slug) ^ seed) >>> 0),
    );
  return [...sortByHash(sameType), ...sortByHash(otherType)].slice(0, count);
}

/* ------------------------------------------------------------------ */
/*  Static params                                                      */
/* ------------------------------------------------------------------ */

export function generateStaticParams() {
  return LOCATIONS.map((loc) => ({ slug: loc.slug }));
}

/* ------------------------------------------------------------------ */
/*  Metadata                                                           */
/* ------------------------------------------------------------------ */

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const loc = getLocation(slug);
  if (!loc) return { title: "Not Found" };

  const title = `Watch Verza TV in ${loc.name} — Microdramas & Reality`;
  const canonical = `/watch-in/${loc.slug}`;
  const url = `${BASE_URL}${canonical}`;

  return {
    title,
    description: loc.blurb,
    alternates: {
      canonical,
      ...(loc.locale
        ? { languages: { [loc.locale]: url } }
        : {}),
    },
    openGraph: {
      title,
      description: loc.blurb,
      url,
      type: "website",
      siteName: "Verza TV",
      ...(loc.locale ? { locale: loc.locale.replace("-", "_") } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: loc.blurb,
    },
  };
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default async function WatchInLocationPage({ params }: Props) {
  const { slug } = await params;
  const loc = getLocation(slug);
  if (!loc) notFound();

  const curated = curateForLocation(loc.slug, 12);
  const related = relatedLocations(loc, 6);

  const tzNote =
    loc.type === "country"
      ? `Verza TV streams to every region of ${loc.name} with no geographic blackout. The full catalog is available on demand in your local time — open the app and the newest episodes are ready to watch.`
      : `Verza TV is available everywhere in ${loc.name} with no regional blackout. New episodes drop on demand and are ready to stream the moment they go live nationwide.`;

  const faqs = [
    {
      question: `Is Verza TV available in ${loc.name}?`,
      answer: `Yes. Verza TV streams in ${loc.name} with no regional blackout. You can watch all 80+ original micro-drama series on demand in your local time, on any phone, tablet, or computer with a browser.`,
    },
    {
      question: `How much does Verza TV cost in ${loc.name}?`,
      answer:
        "There's no subscription required to start. Every series begins with 5 free episodes. After that you unlock additional episodes with coins, or go all-in with VIP at $9.99/month or $79.99/year for unlimited access to the full catalog.",
    },
    {
      question: `Can I watch Verza TV for free in ${loc.name}?`,
      answer: `Absolutely. The first 5 episodes of every series on Verza TV are free, so viewers in ${loc.name} can sample as many shows as they like at no cost before deciding to unlock the rest with coins.`,
    },
    {
      question: `What devices can I use to watch Verza TV in ${loc.name}?`,
      answer:
        "Verza TV works in any modern web browser on iPhone, Android, iPad, Mac, and PC. The micro-dramas are filmed in vertical 9:16, so they're built for phone-first, one-handed viewing wherever you are.",
    },
  ];

  return (
    <>
      {/* JSON-LD: ItemList + Breadcrumb + FAQ + Place */}
      <JsonLd
        data={[
          itemListSchema({
            name: `Most-Watched Verza TV Series in ${loc.name}`,
            description: loc.blurb,
            items: curated.map((s, i) => ({
              name: s.title,
              url: `${BASE_URL}/series/${s.slug}`,
              image: s.posterUrl ? `${BASE_URL}${s.posterUrl}` : undefined,
              position: i + 1,
            })),
          }),
          breadcrumbSchema([
            { name: "Home", url: BASE_URL },
            { name: "Watch In", url: `${BASE_URL}/watch-in` },
            { name: loc.name, url: `${BASE_URL}/watch-in/${loc.slug}` },
          ]),
          faqSchema(faqs),
          {
            "@context": "https://schema.org",
            "@type": "Place",
            name: loc.name,
          },
        ]}
      />

      {/* Hero / intro section */}
      <section
        className="px-4 pt-8 pb-6"
        style={{
          background: `linear-gradient(180deg, ${T.accent}15 0%, ${T.bg} 100%)`,
        }}
      >
        {/* Breadcrumb back-link */}
        <nav
          className="flex items-center gap-1.5 text-sm mb-4"
          style={{ color: T.textMute }}
          aria-label="Breadcrumb"
        >
          <Link href="/" className="no-underline" style={{ color: T.textMute }}>
            Home
          </Link>
          <span aria-hidden>›</span>
          <Link
            href="/watch-in"
            className="no-underline"
            style={{ color: T.textMute }}
          >
            Watch In
          </Link>
          <span aria-hidden>›</span>
          <span style={{ color: T.textDim }}>{loc.name}</span>
        </nav>

        <h1
          className="text-3xl font-bold leading-tight mb-3"
          style={{ color: T.text }}
        >
          Watch Verza TV in {loc.name}
        </h1>

        <p
          className="text-sm leading-relaxed mb-4 max-w-2xl"
          style={{ color: T.textDim }}
        >
          {loc.intro}
        </p>

        <div className="flex items-center gap-3 flex-wrap">
          <span
            className="text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full"
            style={{ background: T.accent, color: T.text }}
          >
            {curated.length} Series
          </span>
          <span className="text-xs" style={{ color: T.textMute }}>
            {loc.region} &middot; No blackout
          </span>
        </div>
      </section>

      {/* Curated poster grid */}
      <section className="px-4 pt-4 pb-8">
        <h2
          className="text-sm font-semibold uppercase tracking-wider mb-3"
          style={{ color: T.textMute }}
        >
          Most-Watched in {loc.name}
        </h2>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {curated.map((series) => (
            <Link
              key={series.slug}
              href={`/series/${series.slug}`}
              className="group no-underline"
            >
              <div
                className="relative aspect-[3/4] rounded-lg overflow-hidden mb-1.5"
                style={{ background: T.raised }}
              >
                {series.posterUrl ? (
                  <Image
                    src={series.posterUrl}
                    alt={series.title}
                    fill
                    sizes="(min-width: 768px) 20vw, 33vw"
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div
                    className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-center px-2"
                    style={{ color: T.textMute }}
                  >
                    {series.title}
                  </div>
                )}
                {/* Free badge */}
                <div
                  className="absolute bottom-1.5 left-1.5 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded"
                  style={{ background: T.accent, color: T.text }}
                >
                  5 Free
                </div>
              </div>
              <p
                className="text-xs font-medium truncate"
                style={{ color: T.text }}
              >
                {series.title}
              </p>
              <p className="text-[10px] truncate" style={{ color: T.textMute }}>
                {series.genre} &middot; {series.episodeCount} ep
              </p>
            </Link>
          ))}
        </div>

        {/* Timezone / availability note */}
        <div
          className="mt-8 rounded-xl p-4"
          style={{ background: T.surface, border: `1px solid ${T.line}` }}
        >
          <h2
            className="text-sm font-semibold mb-1.5"
            style={{ color: T.textDim }}
          >
            Availability &amp; Timezone in {loc.name}
          </h2>
          <p className="text-xs leading-relaxed" style={{ color: T.textMute }}>
            {tzNote}
          </p>
        </div>

        {/* Related locations rail */}
        <div className="mt-10">
          <h2
            className="text-sm font-semibold uppercase tracking-wider mb-3"
            style={{ color: T.textMute }}
          >
            Also Watching Verza TV
          </h2>
          <div className="flex flex-wrap gap-2">
            {related.map((r) => (
              <Link
                key={r.slug}
                href={`/watch-in/${r.slug}`}
                className="text-xs font-medium px-3 py-1.5 rounded-full no-underline transition-colors"
                style={{
                  background: `${T.accent}15`,
                  color: T.accent,
                  border: `1px solid ${T.accent}30`,
                }}
              >
                {r.name}
              </Link>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-10">
          <h2
            className="text-sm font-semibold mb-3"
            style={{ color: T.textDim }}
          >
            Verza TV in {loc.name}: Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <div key={faq.question}>
                <h3
                  className="text-xs font-semibold mb-1"
                  style={{ color: T.text }}
                >
                  {faq.question}
                </h3>
                <p
                  className="text-xs leading-relaxed"
                  style={{ color: T.textMute }}
                >
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Back-link up the hierarchy */}
        <div className="mt-10">
          <Link
            href="/discover"
            className="text-xs font-medium no-underline"
            style={{ color: T.accent }}
          >
            Browse all Verza TV series &rarr;
          </Link>
        </div>
      </section>
    </>
  );
}
