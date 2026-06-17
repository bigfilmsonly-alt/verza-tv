import type { Metadata } from "next";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://verzatv.com";

/* ------------------------------------------------------------------ */
/*  Shared helpers                                                     */
/* ------------------------------------------------------------------ */

function ogImage(path = "/og-image.png", alt = "Verza TV") {
  return [{ url: `${SITE_URL}${path}`, width: 1200, height: 630, alt }];
}

const twitterDefaults = { card: "summary_large_image" as const, site: "@VerzaTV" };

/* ------------------------------------------------------------------ */
/*  Home                                                               */
/* ------------------------------------------------------------------ */

export function buildHomeMetadata(): Metadata {
  const title = "Verza TV — Microdramas, Reality & More";
  const description =
    "Stream binge-worthy micro-dramas, reality shows, and original series — all in vertical, all in minutes.";

  return {
    title,
    description,
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      siteName: "Verza TV",
      title,
      description,
      url: SITE_URL,
      images: ogImage(),
    },
    twitter: twitterDefaults,
    robots: { index: true, follow: true },
  };
}

/* ------------------------------------------------------------------ */
/*  Show (series) page                                                 */
/* ------------------------------------------------------------------ */

interface ShowMetaInput {
  slug: string;
  title: string;
  synopsis: string;
  posterUrl?: string;
  indexable?: boolean;
}

export function buildShowMetadata(show: ShowMetaInput): Metadata {
  const title = `${show.title} — Verza TV`;
  const url = `${SITE_URL}/series/${show.slug}`;

  return {
    title,
    description: show.synopsis,
    alternates: { canonical: `/series/${show.slug}` },
    openGraph: {
      type: "video.tv_show",
      siteName: "Verza TV",
      title,
      description: show.synopsis,
      url,
      images: show.posterUrl
        ? ogImage(show.posterUrl, show.title)
        : ogImage(),
    },
    twitter: twitterDefaults,
    robots: {
      index: show.indexable !== false,
      follow: true,
    },
  };
}

/* ------------------------------------------------------------------ */
/*  Episode page                                                       */
/* ------------------------------------------------------------------ */

interface EpisodeMetaInput {
  number: number;
  title: string;
}

export function buildEpisodeMetadata(
  show: ShowMetaInput,
  episode: EpisodeMetaInput,
): Metadata {
  const title = `Ep ${episode.number}: ${episode.title} — ${show.title} | Verza TV`;
  const description = show.synopsis;
  const url = `${SITE_URL}/series/${show.slug}/${episode.number}`;

  return {
    title,
    description,
    alternates: { canonical: `/series/${show.slug}/${episode.number}` },
    openGraph: {
      type: "video.episode",
      siteName: "Verza TV",
      title,
      description,
      url,
      images: show.posterUrl
        ? ogImage(show.posterUrl, `${show.title} — Episode ${episode.number}`)
        : ogImage(),
    },
    twitter: twitterDefaults,
    robots: {
      index: show.indexable !== false,
      follow: true,
    },
  };
}

/* ------------------------------------------------------------------ */
/*  Genre page                                                         */
/* ------------------------------------------------------------------ */

export function buildGenreMetadata(
  genre: string,
  description: string,
  count: number,
): Metadata {
  const title = `${genre} Shows — Verza TV`;
  const desc = description || `Watch ${count} ${genre} micro-dramas on Verza TV.`;

  return {
    title,
    description: desc,
    alternates: { canonical: `/genre/${genre.toLowerCase()}` },
    openGraph: {
      type: "website",
      siteName: "Verza TV",
      title,
      description: desc,
      url: `${SITE_URL}/genre/${genre.toLowerCase()}`,
      images: ogImage(),
    },
    twitter: twitterDefaults,
    robots: { index: true, follow: true },
  };
}

/* ------------------------------------------------------------------ */
/*  Article / blog page                                                */
/* ------------------------------------------------------------------ */

interface ArticleMetaInput {
  slug: string;
  title: string;
  excerpt: string;
  imageUrl?: string;
  publishedAt: string;
  updatedAt?: string;
  authorName?: string;
}

export function buildArticleMetadata(article: ArticleMetaInput): Metadata {
  const title = `${article.title} — Verza TV`;
  const url = `${SITE_URL}/blog/${article.slug}`;

  return {
    title,
    description: article.excerpt,
    alternates: { canonical: `/blog/${article.slug}` },
    openGraph: {
      type: "article",
      siteName: "Verza TV",
      title,
      description: article.excerpt,
      url,
      images: article.imageUrl
        ? ogImage(article.imageUrl, article.title)
        : ogImage(),
      publishedTime: article.publishedAt,
      ...(article.updatedAt ? { modifiedTime: article.updatedAt } : {}),
      ...(article.authorName ? { authors: [article.authorName] } : {}),
    },
    twitter: twitterDefaults,
    robots: { index: true, follow: true },
  };
}
