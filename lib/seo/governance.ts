/**
 * SEO Governance Firewall
 * Enforces indexability rules from docs/seo-governance.md as code.
 * Every content page must pass these checks before being indexable.
 */

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface PageIndexabilityInput {
  /** Page has been reviewed and approved by a human editor */
  editorialApproved: boolean;
  /** Page has unique, substantive content (not just a title) */
  hasUniqueContent: boolean;
  /** Title tag is present and non-empty */
  title: string;
  /** Meta description is present and non-empty */
  description: string;
  /** Canonical URL is set */
  canonical: string;
  /** At least one internal link points to this page */
  hasInternalLinks: boolean;
}

export interface GovernanceResult {
  indexable: boolean;
  reasons: string[];
}

/* ------------------------------------------------------------------ */
/*  Content type policies                                              */
/* ------------------------------------------------------------------ */

/**
 * Content types that require editorial approval before indexing.
 * Catalog-derived pages (series, episodes) are auto-approved since
 * their content comes from the verified catalog.
 */
export type ContentType =
  | "series"        // Auto-approved (catalog data)
  | "episode"       // Auto-approved (catalog data)
  | "genre_hub"     // Requires editorial approval
  | "editorial"     // Requires editorial approval
  | "authority"     // Requires editorial approval (about, founder, etc.)
  | "educational"   // Requires editorial approval
  | "admin"         // Never indexed
  | "auth"          // Never indexed
  | "search";       // Never indexed

const NEVER_INDEX: ContentType[] = ["admin", "auth", "search"];
const AUTO_APPROVED: ContentType[] = ["series", "episode"];

/* ------------------------------------------------------------------ */
/*  Core check                                                         */
/* ------------------------------------------------------------------ */

/**
 * Determines if a page should be indexable.
 * Returns { indexable, reasons } — reasons lists all failures.
 */
export function checkIndexability(
  contentType: ContentType,
  input: PageIndexabilityInput,
): GovernanceResult {
  const reasons: string[] = [];

  // Hard block: admin, auth, search pages are never indexed
  if (NEVER_INDEX.includes(contentType)) {
    return { indexable: false, reasons: [`${contentType} pages are never indexed`] };
  }

  // Editorial approval check
  const needsApproval = !AUTO_APPROVED.includes(contentType);
  if (needsApproval && !input.editorialApproved) {
    reasons.push("Missing editorial approval (editorialApproved must be true)");
  }

  // Unique content check
  if (!input.hasUniqueContent) {
    reasons.push("No unique/substantive content on page");
  }

  // Metadata completeness
  if (!input.title || input.title.length < 5) {
    reasons.push("Title is missing or too short (min 5 chars)");
  }
  if (!input.description || input.description.length < 20) {
    reasons.push("Description is missing or too short (min 20 chars)");
  }
  if (!input.canonical) {
    reasons.push("Canonical URL is not set");
  }

  // Internal links
  if (!input.hasInternalLinks) {
    reasons.push("No internal links point to this page");
  }

  return {
    indexable: reasons.length === 0,
    reasons,
  };
}

/* ------------------------------------------------------------------ */
/*  Helpers for common page types                                      */
/* ------------------------------------------------------------------ */

/**
 * Series pages are auto-approved if catalog data is complete.
 */
export function isSeriesIndexable(series: {
  slug: string;
  title: string;
  logline: string;
  posterUrl: string;
  episodeCount: number;
}): boolean {
  return !!(
    series.slug &&
    series.title &&
    series.logline &&
    series.logline.length >= 20 &&
    series.posterUrl &&
    series.episodeCount > 0
  );
}

/**
 * Episode pages are auto-approved if they have a valid playback ID.
 */
export function isEpisodeIndexable(
  series: { slug: string; title: string; logline: string; posterUrl: string; episodeCount: number },
  episode: { title: string; number: number },
  playbackId?: string,
): boolean {
  return isSeriesIndexable(series) && !!(episode.title && playbackId);
}

/**
 * Returns robots meta value for a page.
 */
export function getRobotsDirective(indexable: boolean): {
  index: boolean;
  follow: boolean;
} {
  return { index: indexable, follow: true };
}

/* ------------------------------------------------------------------ */
/*  Schema compliance checks                                           */
/* ------------------------------------------------------------------ */

/**
 * Validates that schema data doesn't contain fabricated information.
 * Returns list of violations.
 */
export function validateSchemaCompliance(
  schema: Record<string, unknown>,
): string[] {
  const violations: string[] = [];

  // No fake aggregate ratings without real data
  if ("aggregateRating" in schema) {
    const rating = schema.aggregateRating as Record<string, unknown>;
    if (!rating.ratingCount || Number(rating.ratingCount) === 0) {
      violations.push("aggregateRating present without real ratingCount");
    }
  }

  // No fake review counts
  if ("review" in schema && Array.isArray(schema.review)) {
    for (const review of schema.review as Record<string, unknown>[]) {
      if (!review.author || !(review.author as Record<string, unknown>).name) {
        violations.push("Review without a named author");
      }
    }
  }

  return violations;
}

/* ------------------------------------------------------------------ */
/*  Production check                                                   */
/* ------------------------------------------------------------------ */

/**
 * Returns true only on the production domain.
 * Preview deploys should never index.
 */
export function isProductionDeploy(): boolean {
  const url = process.env.NEXT_PUBLIC_SITE_URL || "";
  return url.includes("verzatv.com");
}
