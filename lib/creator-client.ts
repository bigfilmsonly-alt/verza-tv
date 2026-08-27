/**
 * Client-safe creator helpers + shared types.
 *
 * SAFE to import from client components. Do NOT import lib/creator.ts here or
 * from any client component: lib/creator.ts is marked "server-only" (it pulls
 * in the service-role Supabase client) and importing it into a client bundle is
 * a hard Next.js build error. The wizard's live "verzatv.com/c/<handle>"
 * preview and its per-link validation therefore live here, and lib/creator.ts
 * re-exports normalizeHandle from this file so the two never drift.
 */

/** Reviewed-application lifecycle (migration 010). Single source of truth. */
export type CreatorStatus =
  | "draft"
  | "submitted"
  | "in_review"
  | "changes_requested"
  | "approved"
  | "declined";

export interface DraftSocial {
  instagram: string;
  tiktok: string;
  youtube: string;
  imdb: string;
}

/** camelCase mirror of the 010 columns the multi-step form owns. */
export interface DraftValues {
  // Step A: about you
  displayName: string;
  realName: string;
  country: string;
  bio: string;
  avatarUrl: string;
  handle: string;
  website: string;
  social: DraftSocial;
  // Step B: your content (number-ish fields kept as string in-form, Number()'d on save)
  contentTypes: string[];
  contentLanguages: string[];
  finishedTitles: string;
  contentLinks: string[];
  totalRuntimeMinutes: string;
  sampleLink: string;
  contentRating: string;
  // Step C: rights & terms
  rightsAttested: boolean;
  territory: "" | "worldwide" | "specified";
  territoryDetail: string;
  exclusivity: "" | "exclusive" | "non_exclusive";
  agreementAccepted: boolean;
  // Step D: payment readiness
  payoutPreference: string;
  taxCountry: string;
  paymentAck: boolean;
}

/* ------------------------------------------------------------------ */
/*  Option sets (shared by the pills and the server allowlist)         */
/* ------------------------------------------------------------------ */
export const CONTENT_TYPE_OPTIONS = [
  { value: "microdrama", label: "Microdrama" },
  { value: "short_film", label: "Short film" },
  { value: "series", label: "Series" },
  { value: "reality", label: "Reality" },
  { value: "music", label: "Music" },
  { value: "other", label: "Other" },
] as const;

export const CONTENT_LANGUAGE_OPTIONS = [
  { value: "english", label: "English" },
  { value: "spanish", label: "Spanish" },
  { value: "hindi", label: "Hindi" },
  { value: "korean", label: "Korean" },
  { value: "japanese", label: "Japanese" },
  { value: "chinese", label: "Chinese" },
  { value: "french", label: "French" },
  { value: "portuguese", label: "Portuguese" },
  { value: "arabic", label: "Arabic" },
  { value: "other", label: "Other" },
] as const;

export const CONTENT_RATING_OPTIONS = [
  { value: "all_audiences", label: "All audiences" },
  { value: "teen", label: "Teen" },
  { value: "mature", label: "Mature" },
] as const;

export const CONTENT_TYPE_VALUES = CONTENT_TYPE_OPTIONS.map((o) => o.value);
export const CONTENT_LANGUAGE_VALUES = CONTENT_LANGUAGE_OPTIONS.map((o) => o.value);
export const CONTENT_RATING_VALUES = CONTENT_RATING_OPTIONS.map((o) => o.value);

export const MAX_CONTENT_LINKS = 25;

/* ------------------------------------------------------------------ */
/*  Step metadata                                                      */
/* ------------------------------------------------------------------ */
export const STEP_META: Record<number, { title: string; sub: string }> = {
  1: { title: "About you", sub: "Who you are and where fans find you." },
  2: { title: "Your content", sub: "What you make and where we can watch it." },
  3: { title: "Rights & terms", sub: "Confirm you can license this to VERZA." },
  4: { title: "Payment readiness", sub: "How you'll get paid after approval." },
  5: { title: "Review & submit", sub: "Check everything, then send it to our team." },
};

export const STEP_LABELS = ["About you", "Your content", "Rights", "Payment"];

/* ------------------------------------------------------------------ */
/*  Client-safe primitives                                             */
/* ------------------------------------------------------------------ */

/** Normalize a requested handle into a safe slug fragment. MUST mirror the
 *  server normalizeHandle (lib/creator.ts re-exports this same function). */
export function normalizeHandleClient(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/^@+/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
}

/** Sentinel prefix for the auto-stamped placeholder handle a brand-new draft
 *  row gets before the applicant has typed a real handle. `creators.handle` is
 *  UNIQUE NOT NULL, so two empty drafts saving handle='' would collide; each
 *  draft instead reserves a per-user placeholder. The double dash can never be
 *  produced by normalizeHandleClient (which collapses runs of non-alphanumerics
 *  to a single dash), so a placeholder never collides with a real handle and is
 *  trivially detectable to hide it from the resume form. */
export const DRAFT_HANDLE_PREFIX = "draft--";

/** True for an auto-stamped placeholder handle (never a user-chosen handle). */
export function isPlaceholderHandle(h: string | null | undefined): boolean {
  return !!h && h.startsWith(DRAFT_HANDLE_PREFIX);
}

/** True only for a well-formed http(s) URL. Provider-agnostic (no allowlist). */
export function isHttpUrl(s: string): boolean {
  try {
    const u = new URL(s.trim());
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/** Trim, drop empties, de-dupe (case-insensitive), keep valid http(s) only. */
export function cleanLinks(links: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of links) {
    const v = raw.trim();
    if (!v || !isHttpUrl(v)) continue;
    const key = v.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(v);
    if (out.length >= MAX_CONTENT_LINKS) break;
  }
  return out;
}

/** Which DraftValues keys each step owns (used to POST only that step's data). */
export const STEP_FIELDS: Record<number, (keyof DraftValues)[]> = {
  1: ["displayName", "realName", "country", "bio", "avatarUrl", "handle", "website", "social"],
  2: [
    "contentTypes",
    "contentLanguages",
    "finishedTitles",
    "contentLinks",
    "totalRuntimeMinutes",
    "sampleLink",
    "contentRating",
  ],
  3: ["rightsAttested", "territory", "territoryDetail", "exclusivity", "agreementAccepted"],
  4: ["payoutPreference", "taxCountry", "paymentAck"],
};

/** Pick a subset of DraftValues by key (for the per-step autosave payload). */
export function pick(form: DraftValues, keys: (keyof DraftValues)[]): Partial<DraftValues> {
  const out: Partial<DraftValues> = {};
  for (const k of keys) {
    // Element access on a cast object is a valid assignment target (no `any`).
    (out as Record<string, unknown>)[k] = form[k];
  }
  return out;
}

/**
 * Per-step client validation. Returns a list of human-readable problems (empty
 * means the step passes). MIRRORS the server-side submit checks 1:1 so a user
 * never hits a server 400 they could not preempt.
 */
export function validateStep(n: number, f: DraftValues): string[] {
  const problems: string[] = [];
  if (n === 1) {
    if (!f.displayName.trim()) problems.push("Enter a display name.");
    else if (!normalizeHandleClient(f.handle || f.displayName)) problems.push("Enter a handle with at least one letter or number.");
    if (f.bio.length > 300) problems.push("Bio must be 300 characters or fewer.");
  } else if (n === 2) {
    if (cleanLinks(f.contentLinks).length < 1) {
      problems.push("Add at least one valid link starting with http:// or https://.");
    }
    if (f.contentTypes.length < 1) problems.push("Pick at least one content type.");
  } else if (n === 3) {
    if (!f.rightsAttested) problems.push("Confirm you own or control the rights to your content.");
    if (!f.territory) problems.push("Choose a territory.");
    if (f.territory === "specified" && !f.territoryDetail.trim()) {
      problems.push("List the territories you can license.");
    }
    if (!f.exclusivity) problems.push("Choose an exclusivity option.");
    if (!f.agreementAccepted) problems.push("Accept the VERZA Creator Agreement to continue.");
  } else if (n === 4) {
    if (!f.paymentAck) problems.push("Acknowledge the payment terms to continue.");
  }
  return problems;
}

/** A fully-typed empty draft (used before hydration and by "Start over"). */
export function emptyDraft(): DraftValues {
  return {
    displayName: "",
    realName: "",
    country: "",
    bio: "",
    avatarUrl: "",
    handle: "",
    website: "",
    social: { instagram: "", tiktok: "", youtube: "", imdb: "" },
    contentTypes: [],
    contentLanguages: [],
    finishedTitles: "",
    contentLinks: [],
    totalRuntimeMinutes: "",
    sampleLink: "",
    contentRating: "",
    rightsAttested: false,
    territory: "",
    territoryDetail: "",
    exclusivity: "",
    agreementAccepted: false,
    payoutPreference: "stripe",
    taxCountry: "",
    paymentAck: false,
  };
}

export const AGREEMENT_VERSION = "v0-draft";

/* ------------------------------------------------------------------ */
/*  Shape returned by GET /api/creator/me (shared client type)         */
/* ------------------------------------------------------------------ */
export interface CreatorMeProfile {
  status: CreatorStatus;
  handle: string;
  displayName: string;
  bio: string;
  reviewerNotes: string | null;
  payoutSplit: number;
  currentStep: number;
  draft: DraftValues;
}

export interface CreatorMe {
  authenticated: boolean;
  email?: string;
  muxReady?: boolean;
  creator: CreatorMeProfile | null;
}

/** Merge the API draft (if any) over a fully-typed empty draft. */
export function hydrateDraft(me: CreatorMe): DraftValues {
  const base = emptyDraft();
  const d = me.creator?.draft;
  if (!d) return base;
  return { ...base, ...d, social: { ...base.social, ...d.social } };
}

/** Clamp a saved cursor into the wizard's 1..5 range. */
export function clampStep(v: number | null | undefined): number {
  const n = typeof v === "number" && Number.isFinite(v) ? Math.floor(v) : 1;
  return Math.min(5, Math.max(1, n));
}
