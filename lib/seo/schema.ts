import { getLiveSeries } from "@/lib/catalog";

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://verzatv.com";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/*  Organization                                                       */
/* ------------------------------------------------------------------ */

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Verza TV",
    url: BASE_URL,
    logo: `${BASE_URL}/logo.png`,
    description:
      `The first US-based vertical micro-drama streaming app. ${getLiveSeries().length}+ originals.`,
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
/*  WebSite                                                            */
/* ------------------------------------------------------------------ */

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Verza TV",
    url: BASE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${BASE_URL}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/* ------------------------------------------------------------------ */
/*  MobileApplication                                                  */
/* ------------------------------------------------------------------ */

export function mobileApplicationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "MobileApplication",
    name: "Verza TV",
    operatingSystem: "iOS, Android",
    applicationCategory: "EntertainmentApplication",
    description:
      "Stream binge-worthy micro-dramas, reality shows, and original series — all in vertical, all in minutes.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };
}

/* ------------------------------------------------------------------ */
/*  TVSeries                                                           */
/* ------------------------------------------------------------------ */

interface TVSeriesInput {
  slug: string;
  title: string;
  /** Preferred field name */
  synopsis?: string;
  /** Legacy field name — mapped to synopsis */
  logline?: string;
  genre: string;
  episodeCount: number;
  posterUrl: string;
  rating?: string;
  year?: number;
}

export function tvSeriesSchema(show: TVSeriesInput) {
  const description = show.synopsis ?? show.logline ?? "";

  return {
    "@context": "https://schema.org",
    "@type": "TVSeries",
    name: show.title,
    description,
    genre: show.genre,
    numberOfEpisodes: show.episodeCount,
    url: `${BASE_URL}/series/${show.slug}`,
    image: show.posterUrl ? `${BASE_URL}${show.posterUrl}` : undefined,
    ...(show.rating
      ? {
          contentRating: show.rating,
        }
      : {}),
    ...(show.year
      ? {
          datePublished: String(show.year),
        }
      : {}),
    productionCompany: {
      "@type": "Organization",
      name: "Verza TV",
      url: BASE_URL,
    },
  };
}

/* ------------------------------------------------------------------ */
/*  TVEpisode + VideoObject                                            */
/* ------------------------------------------------------------------ */

interface TVEpisodeInput {
  number: number;
  title: string;
  /** Preferred field name */
  durationSeconds?: number;
  /** Legacy field name — mapped to durationSeconds */
  durationS?: number;
  /** Preferred: derive thumbnail from Mux playback ID */
  muxPlaybackId?: string;
  /** Legacy field name — used directly as thumbnail URL */
  thumbUrl?: string;
}

export function tvEpisodeSchema(
  show: TVSeriesInput,
  episode: TVEpisodeInput,
) {
  const description = show.synopsis ?? show.logline ?? "";
  const duration = episode.durationSeconds ?? episode.durationS ?? 0;

  const thumbnailUrl = episode.muxPlaybackId
    ? `https://image.mux.com/${episode.muxPlaybackId}/thumbnail.webp`
    : episode.thumbUrl
      ? episode.thumbUrl
      : show.posterUrl
        ? `${BASE_URL}${show.posterUrl}`
        : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "TVEpisode",
    name: episode.title,
    episodeNumber: episode.number,
    partOfSeries: {
      "@type": "TVSeries",
      name: show.title,
      url: `${BASE_URL}/series/${show.slug}`,
    },
    video: {
      "@type": "VideoObject",
      name: episode.title,
      description,
      ...(thumbnailUrl ? { thumbnailUrl } : {}),
      duration: toIsoDuration(duration),
    },
  };
}

/* ------------------------------------------------------------------ */
/*  BreadcrumbList                                                     */
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
/*  ItemList                                                           */
/* ------------------------------------------------------------------ */

interface ItemListInput {
  name: string;
  description: string;
  items: { name: string; url: string; image?: string; position: number }[];
}

export function itemListSchema(input: ItemListInput) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: input.name,
    description: input.description,
    numberOfItems: input.items.length,
    itemListElement: input.items.map((item) => ({
      "@type": "ListItem",
      position: item.position,
      item: {
        "@type": "TVSeries",
        name: item.name,
        url: item.url,
        ...(item.image ? { image: item.image } : {}),
      },
    })),
  };
}

/* ------------------------------------------------------------------ */
/*  FAQPage                                                            */
/* ------------------------------------------------------------------ */

interface FaqItem {
  question: string;
  answer: string;
}

export function faqPageSchema(items: FaqItem[]) {
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

/* ------------------------------------------------------------------ */
/*  Article                                                            */
/* ------------------------------------------------------------------ */

interface ArticleInput {
  slug: string;
  title: string;
  body: string;
  publishedAt: string;
}

export function articleSchema(article: ArticleInput) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    articleBody: article.body,
    datePublished: article.publishedAt,
    url: `${BASE_URL}/blog/${article.slug}`,
    author: {
      "@type": "Organization",
      name: "Verza TV",
      url: BASE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: "Verza TV",
      url: BASE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${BASE_URL}/logo.png`,
      },
    },
  };
}
