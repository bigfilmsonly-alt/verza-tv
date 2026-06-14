const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://verzatv.com";

/* ------------------------------------------------------------------ */
/*  Organization                                                      */
/* ------------------------------------------------------------------ */

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Verza TV",
    url: BASE_URL,
    logo: `${BASE_URL}/logo.png`,
    description:
      "The first US-based vertical micro-drama streaming app. 80+ originals.",
    founder: {
      "@type": "Person",
      name: "Alan Mruvka",
    },
    sameAs: [
      "https://www.instagram.com/verzatv",
      "https://www.tiktok.com/@verzatv",
      "https://x.com/VerzaTV",
    ],
  };
}

/* ------------------------------------------------------------------ */
/*  WebSite                                                           */
/* ------------------------------------------------------------------ */

export function webSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Verza TV",
    url: BASE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${BASE_URL}/discover?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/* ------------------------------------------------------------------ */
/*  MobileApplication                                                 */
/* ------------------------------------------------------------------ */

export function mobileAppSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "MobileApplication",
    name: "Verza TV",
    operatingSystem: "iOS, Android",
    applicationCategory: "EntertainmentApplication",
    description: "Stream binge-worthy micro-dramas, reality shows, and original series — all in vertical, all in minutes.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };
}

/* ------------------------------------------------------------------ */
/*  TVSeries                                                          */
/* ------------------------------------------------------------------ */

interface SeriesInput {
  slug: string;
  title: string;
  logline: string;
  genre: string;
  episodeCount: number;
  posterUrl: string;
}

export function seriesSchema(series: SeriesInput) {
  return {
    "@context": "https://schema.org",
    "@type": "TVSeries",
    name: series.title,
    description: series.logline,
    genre: series.genre,
    numberOfEpisodes: series.episodeCount,
    url: `${BASE_URL}/series/${series.slug}`,
    image: series.posterUrl ? `${BASE_URL}${series.posterUrl}` : undefined,
    productionCompany: {
      "@type": "Organization",
      name: "Verza TV",
      url: BASE_URL,
    },
  };
}

/* ------------------------------------------------------------------ */
/*  TVEpisode + VideoObject                                           */
/* ------------------------------------------------------------------ */

interface EpisodeInput {
  number: number;
  title: string;
  durationS: number;
  thumbUrl: string;
}

function toIsoDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  let iso = "PT";
  if (h > 0) iso += `${h}H`;
  if (m > 0) iso += `${m}M`;
  if (s > 0 || iso === "PT") iso += `${s}S`;
  return iso;
}

export function episodeSchema(series: SeriesInput, episode: EpisodeInput) {
  return {
    "@context": "https://schema.org",
    "@type": "TVEpisode",
    name: episode.title,
    episodeNumber: episode.number,
    partOfSeries: {
      "@type": "TVSeries",
      name: series.title,
      url: `${BASE_URL}/series/${series.slug}`,
    },
    video: {
      "@type": "VideoObject",
      name: episode.title,
      description: series.logline,
      thumbnailUrl: episode.thumbUrl,
      duration: toIsoDuration(episode.durationS),
    },
  };
}

/* ------------------------------------------------------------------ */
/*  BreadcrumbList                                                    */
/* ------------------------------------------------------------------ */

interface BreadcrumbItem {
  name: string;
  url: string;
}

export function breadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/* ------------------------------------------------------------------ */
/*  FAQPage                                                           */
/* ------------------------------------------------------------------ */

interface FaqItem {
  question: string;
  answer: string;
}

export function faqSchema(items: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}
