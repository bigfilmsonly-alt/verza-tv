import { getLiveSeries } from "@/lib/catalog";

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.verzatv.com";

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
    name: "VERZA TV",
    url: BASE_URL,
    logo: `${BASE_URL}/logo.png`,
    legalName: "VERZA TV LLC",
    address: {
      "@type": "PostalAddress",
      streetAddress: "650 E Palisade Ave, Ste 2329",
      addressLocality: "Englewood Cliffs",
      addressRegion: "NJ",
      postalCode: "07632",
      addressCountry: "US",
    },
    description:
      `A phone-first short-form entertainment service with ${getLiveSeries().length} live series in its current catalog.`,
    founder: personSchema(),
    parentOrganization: {
      "@type": "Organization",
      name: "Filmology Labs",
      description: "A production organization working with VERZA TV content.",
    },
    sameAs: [
      "https://www.instagram.com/verzatv",
      "https://www.tiktok.com/@verzatv",
      "https://x.com/VerzaTV",
    ],
  };
}

/* ------------------------------------------------------------------ */
/*  Person (Founder)                                                   */
/* ------------------------------------------------------------------ */

export function personSchema() {
  return {
    "@type": "Person",
    name: "Alan Mruvka",
    jobTitle: "Founder & CEO",
    worksFor: {
      "@type": "Organization",
      name: "VERZA TV",
      url: BASE_URL,
    },
    description:
      "Co-founder of E! Entertainment Television. Founder of VERZA TV.",
  };
}

/* ------------------------------------------------------------------ */
/*  WebSite                                                            */
/* ------------------------------------------------------------------ */

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "VERZA TV",
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
    name: "VERZA TV",
    operatingSystem: "iOS, Android",
    applicationCategory: "EntertainmentApplication",
    description:
      "Stream short-form micro-dramas, reality shows, and other entertainment. Formats and episode lengths vary by title.",
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
    // new URL() is idempotent: it resolves a relative path against BASE_URL and
    // returns an already-absolute one untouched. Two call sites used to prefix
    // BASE_URL themselves before calling in, producing
    // "https://www.verzatv.comhttps://www.verzatv.com/posters/..." on every
    // series and episode page. Hardening here means neither convention breaks it.
    image: show.posterUrl ? new URL(show.posterUrl, BASE_URL).href : undefined,
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
      name: "VERZA TV",
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
      name: "VERZA TV",
      url: BASE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: "VERZA TV",
      url: BASE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${BASE_URL}/logo.png`,
      },
    },
  };
}
