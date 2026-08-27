/**
 * Server-side sanitizer for the creator application intake (migration 010).
 *
 * Pure functions only (no DB, no request context) so both the SAVE and SUBMIT
 * branches of /api/creator/apply reuse one hardened mapping. The server is the
 * source of truth: every value the client sends is re-clamped, re-validated,
 * and coerced here regardless of what the client already checked.
 *
 * Imports only from creator-client (client-safe); never expose this module or
 * its output to the browser (it maps to raw DB column names).
 */
import {
  CONTENT_LANGUAGE_VALUES,
  CONTENT_RATING_VALUES,
  CONTENT_TYPE_VALUES,
  DraftSocial,
  DraftValues,
  MAX_CONTENT_LINKS,
  cleanLinks,
  isHttpUrl,
  normalizeHandleClient,
} from "./creator-client";

/** Row shape written to public.creators. All optional so SAVE can build a
 *  partial update from only the step's present keys (never nulling other steps). */
export interface CreatorRowWrite {
  handle?: string;
  display_name?: string;
  real_name?: string | null;
  country?: string | null;
  bio?: string;
  avatar_url?: string | null;
  website?: string | null;
  social_links?: DraftSocial;
  content_types?: string[];
  content_languages?: string[];
  finished_titles?: number | null;
  content_links?: string[];
  total_runtime_minutes?: number | null;
  sample_link?: string | null;
  content_rating?: string | null;
  rights_attested?: boolean;
  territory?: string | null;
  territory_detail?: string | null;
  exclusivity?: string | null;
  agreement_accepted?: boolean;
  payout_preference?: string;
  tax_country?: string | null;
  payment_ack?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Primitive sanitizers                                               */
/* ------------------------------------------------------------------ */

/** Trim + hard length clamp. Non-strings collapse to "". */
export function str(v: unknown, n = 280): string {
  return typeof v === "string" ? v.slice(0, n).trim() : "";
}

/** A trimmed, length-clamped http(s) URL, or "" if it is not a valid URL. */
export function urlClean(v: unknown): string {
  const s = str(v, 400);
  return s && isHttpUrl(s) ? s : "";
}

/** TS-strict enum guard: returns the value only if it is in the allowlist. */
export function oneOf<T extends string>(list: readonly T[], v: unknown): T | null {
  return typeof v === "string" && (list as readonly string[]).includes(v) ? (v as T) : null;
}

/** A non-negative integer within [0, 100000], or null. */
export function intClamp(v: unknown): number | null {
  if (v === "" || v === null || v === undefined) return null;
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n) || n < 0 || n > 100000) return null;
  return Math.floor(n);
}

/** Sanitize the multi-select arrays against an allowlist, de-duped, capped. */
export function strArrEnum(v: unknown, allowed: readonly string[], max = 20): string[] {
  if (!Array.isArray(v)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const x of v) {
    if (typeof x !== "string") continue;
    if (!(allowed as readonly string[]).includes(x)) continue;
    if (seen.has(x)) continue;
    seen.add(x);
    out.push(x);
    if (out.length >= max) break;
  }
  return out;
}

/** Coerce the social object into the fixed {instagram,tiktok,youtube,imdb} jsonb. */
export function sanitizeSocial(v: unknown): DraftSocial {
  const o = (v && typeof v === "object" ? v : {}) as Record<string, unknown>;
  return {
    instagram: urlClean(o.instagram),
    tiktok: urlClean(o.tiktok),
    youtube: urlClean(o.youtube),
    imdb: urlClean(o.imdb),
  };
}

/** Provider-agnostic content-links: trim, drop empties/invalids, de-dupe, cap. */
export function sanitizeLinks(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return cleanLinks(v.map((x) => (typeof x === "string" ? x.slice(0, 500) : ""))).slice(
    0,
    MAX_CONTENT_LINKS,
  );
}

/* ------------------------------------------------------------------ */
/*  Draft -> DB row mapping                                            */
/* ------------------------------------------------------------------ */

/**
 * Map ONLY the camelCase keys present in `values` to their sanitized snake_case
 * columns. A Step B save therefore never nulls Step A columns. Used verbatim by
 * both intents (submit passes the full object so every key is present).
 */
export function mapDraftToRow(values: Partial<DraftValues>): CreatorRowWrite {
  const has = (k: keyof DraftValues) => Object.prototype.hasOwnProperty.call(values, k);
  const row: CreatorRowWrite = {};

  // Step A
  if (has("displayName")) row.display_name = str(values.displayName, 80);
  if (has("handle") || has("displayName")) {
    row.handle = normalizeHandleClient(str(values.handle, 40) || str(values.displayName, 80));
  }
  if (has("realName")) row.real_name = str(values.realName, 120) || null;
  if (has("country")) row.country = str(values.country, 80) || null;
  if (has("bio")) row.bio = str(values.bio, 300);
  if (has("avatarUrl")) row.avatar_url = urlClean(values.avatarUrl) || null;
  if (has("website")) row.website = urlClean(values.website) || null;
  if (has("social")) row.social_links = sanitizeSocial(values.social);

  // Step B
  if (has("contentTypes")) row.content_types = strArrEnum(values.contentTypes, CONTENT_TYPE_VALUES);
  if (has("contentLanguages")) {
    row.content_languages = strArrEnum(values.contentLanguages, CONTENT_LANGUAGE_VALUES);
  }
  if (has("finishedTitles")) row.finished_titles = intClamp(values.finishedTitles);
  if (has("contentLinks")) row.content_links = sanitizeLinks(values.contentLinks);
  if (has("totalRuntimeMinutes")) row.total_runtime_minutes = intClamp(values.totalRuntimeMinutes);
  if (has("sampleLink")) row.sample_link = urlClean(values.sampleLink) || null;
  if (has("contentRating")) row.content_rating = oneOf(CONTENT_RATING_VALUES, values.contentRating);

  // Step C
  if (has("rightsAttested")) row.rights_attested = values.rightsAttested === true;
  if (has("territory")) row.territory = oneOf(["worldwide", "specified"] as const, values.territory);
  if (has("territoryDetail")) row.territory_detail = str(values.territoryDetail, 500) || null;
  if (has("exclusivity")) {
    row.exclusivity = oneOf(["exclusive", "non_exclusive"] as const, values.exclusivity);
  }
  if (has("agreementAccepted")) row.agreement_accepted = values.agreementAccepted === true;

  // Step D
  if (has("payoutPreference")) row.payout_preference = str(values.payoutPreference, 40) || "stripe";
  if (has("taxCountry")) row.tax_country = str(values.taxCountry, 80) || null;
  if (has("paymentAck")) row.payment_ack = values.paymentAck === true;

  return row;
}

/**
 * Full server-side validation for SUBMIT. Returns { error, step } for the first
 * failing rule (so the client can jumpTo the offending step) or null if valid.
 * `row` is the output of mapDraftToRow(fullValues).
 */
export function validateSubmit(row: CreatorRowWrite): { error: string; step: number } | null {
  if (!row.display_name) return { error: "A display name is required.", step: 1 };
  if (!row.handle) return { error: "A valid handle is required.", step: 1 };

  if (!row.content_links || row.content_links.length < 1) {
    return { error: "Add at least one valid content link.", step: 2 };
  }
  if (!row.content_types || row.content_types.length < 1) {
    return { error: "Pick at least one content type.", step: 2 };
  }

  if (row.rights_attested !== true) {
    return { error: "You must confirm you own or control the rights.", step: 3 };
  }
  if (row.territory !== "worldwide" && row.territory !== "specified") {
    return { error: "Choose a territory.", step: 3 };
  }
  if (row.territory === "specified" && !row.territory_detail) {
    return { error: "List the territories you can license.", step: 3 };
  }
  if (row.exclusivity !== "exclusive" && row.exclusivity !== "non_exclusive") {
    return { error: "Choose an exclusivity option.", step: 3 };
  }
  if (row.agreement_accepted !== true) {
    return { error: "You must accept the VERZA Creator Agreement.", step: 3 };
  }

  if (row.payment_ack !== true) {
    return { error: "You must acknowledge the payment terms.", step: 4 };
  }
  return null;
}
