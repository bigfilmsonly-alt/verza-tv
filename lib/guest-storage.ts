/* ------------------------------------------------------------------ */
/*  Guest persistence — the one place the app remembers a signed-out    */
/*  viewer.                                                             */
/*                                                                      */
/*  BUG THIS PREVENTS: a guest watched four free episodes, closed the    */
/*  tab, and the app forgot them completely. Every piece of a working    */
/*  guest-resume path already existed and none of them were connected:   */
/*                                                                      */
/*    - POST /api/watch-progress 401s for a signed-out caller            */
/*      (app/api/watch-progress/route.ts:12-15), so every second of      */
/*      position was discarded at the network boundary.                  */
/*    - lib/resume.ts wrote `verza_last_watching` on every backgrounding  */
/*      and readLastWatching()/clearLastWatching() had ZERO callers       */
/*      repo-wide — a write-only key.                                    */
/*    - The Continue Watching rail reads GET /api/watch-progress, which   */
/*      returns `{items: []}` for a guest, so the rail was invisible to   */
/*      the exact population the free preview is aimed at.               */
/*                                                                      */
/*  The free preview is open to guests. The memory of it has to be too.  */
/*                                                                      */
/*  WHAT THIS MODULE IS NOT. It is not an authority for anything that    */
/*  grants access. AGENTS.md rule 4 and cross-lane invariant 6: a client  */
/*  value never grants entitlement. Nothing here is ever consulted by     */
/*  /api/access, /api/playback/* or the paywall; it holds a playhead and  */
/*  a bookmark list, both of which the viewer could set to anything they  */
/*  liked with no consequence beyond their own home screen. The one      */
/*  purchase-adjacent key on the device, `verza-unlock:<slug>`, is not    */
/*  managed here and stays what it already is: a hint that is always      */
/*  re-verified server-side.                                             */
/*                                                                      */
/*  WHY THE STORAGE OBJECT IS RESOLVED AT CALL TIME, not imported. Two    */
/*  reasons that both bit this codebase already: (1) these functions run  */
/*  during a React render pass on the server as well as the client, and   */
/*  a module-level `localStorage` reference throws at import; (2) making  */
/*  it late-bound is what lets scripts/test-feed-integrity.mjs drive the  */
/*  real module against a fake Storage offline. A persistence layer that  */
/*  cannot be exercised without a browser is a persistence layer nobody   */
/*  ever tests.                                                          */
/* ------------------------------------------------------------------ */

/** A single remembered playhead. Mirrors one `watch_progress` row. */
export interface GuestProgressRow {
  seriesSlug: string;
  episodeNumber: number;
  progressSeconds: number;
  completed: boolean;
  /** Epoch ms. Decides who wins when local and server disagree. */
  updatedAt: number;
}

/** Everything a guest accumulated, in the shape POST /api/account/sync takes. */
export interface GuestSnapshot {
  progress: GuestProgressRow[];
  saved: string[];
}

/* ---- Keys -------------------------------------------------------- */

/**
 * The saved list. NOT renamed, deliberately: components/EpisodeFeed.tsx,
 * components/ShortsFeed.tsx, components/LibraryPage.tsx and
 * components/ProfileDynamic.tsx have all read and written this exact key for
 * months, and a rename would silently empty every existing viewer's list.
 * This module becomes the single implementation those call sites share; the
 * bytes on the device are unchanged.
 */
export const SAVED_KEY = "verza-saved";

/** Guest watch progress. New key — nothing was ever stored here before. */
export const PROGRESS_KEY = "verza.guest.progress.v1";

/** Digest of the last snapshot successfully merged into an account. */
export const MIGRATED_KEY = "verza.guest.migrated.v1";

/**
 * Hard cap on remembered playheads. GET /api/watch-progress returns at most 20
 * rows, so 40 is already twice what any surface can display; the cap exists so
 * a long-running device cannot grow an unbounded JSON blob in a storage area
 * with a ~5 MB quota shared with everything else the app keeps.
 */
export const MAX_PROGRESS_ROWS = 40;

/** Matches the server-side validator in app/api/watch-progress/route.ts:33. */
const SLUG_RE = /^[a-z0-9-]+$/;

/* ---- Storage access ---------------------------------------------- */

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function store(): StorageLike | null {
  try {
    const s = (globalThis as { localStorage?: StorageLike }).localStorage;
    return s ?? null;
  } catch {
    /* Safari private mode and cross-origin frames throw on ACCESS, not on use. */
    return null;
  }
}

function readJson<T>(key: string, fallback: T): T {
  const s = store();
  if (!s) return fallback;
  try {
    const raw = s.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  const s = store();
  if (!s) return;
  try {
    s.setItem(key, JSON.stringify(value));
  } catch {
    /* quota exceeded / storage disabled — the app must keep playing */
  }
}

/* ---- Validation --------------------------------------------------- */

/**
 * The same bounds the two write routes enforce. Applied on the way OUT of
 * storage as well as in, because localStorage is attacker-writable: without
 * this, a hand-edited blob would put a poisoned row into the Continue Watching
 * rail and then into a POST body at migration time.
 */
export function isValidProgressRow(row: unknown): row is GuestProgressRow {
  if (!row || typeof row !== "object") return false;
  const r = row as Record<string, unknown>;
  if (typeof r.seriesSlug !== "string" || !r.seriesSlug) return false;
  if (r.seriesSlug.length > 100 || !SLUG_RE.test(r.seriesSlug)) return false;
  if (
    typeof r.episodeNumber !== "number" ||
    !Number.isInteger(r.episodeNumber) ||
    r.episodeNumber < 1 ||
    r.episodeNumber > 999
  ) {
    return false;
  }
  if (
    typeof r.progressSeconds !== "number" ||
    !Number.isFinite(r.progressSeconds) ||
    r.progressSeconds < 0 ||
    r.progressSeconds > 36000
  ) {
    return false;
  }
  if (typeof r.completed !== "boolean") return false;
  if (typeof r.updatedAt !== "number" || !Number.isFinite(r.updatedAt) || r.updatedAt < 0) {
    return false;
  }
  return true;
}

export function isValidSlug(slug: unknown): slug is string {
  return typeof slug === "string" && slug.length > 0 && slug.length <= 100 && SLUG_RE.test(slug);
}

/* ---- Watch progress ---------------------------------------------- */

/** Every remembered playhead, newest first. Invalid rows are dropped. */
export function readGuestProgress(): GuestProgressRow[] {
  const raw = readJson<unknown>(PROGRESS_KEY, null);
  const rows = Array.isArray(raw) ? raw : null;
  if (!rows) return [];
  return rows.filter(isValidProgressRow).slice(0, MAX_PROGRESS_ROWS);
}

/**
 * Remember (or update) one playhead. Upserts on (slug, episode) and moves the
 * row to the front, so the newest-first order the rail wants is a property of
 * the store rather than something every reader has to re-derive.
 *
 * Returns the rows as written, so a caller can assert the effect rather than
 * trusting that the call happened.
 */
export function saveGuestProgress(input: {
  seriesSlug: string;
  episodeNumber: number;
  progressSeconds: number;
  completed?: boolean;
  updatedAt?: number;
}): GuestProgressRow[] {
  const row: GuestProgressRow = {
    seriesSlug: input.seriesSlug,
    episodeNumber: input.episodeNumber,
    progressSeconds: Math.floor(input.progressSeconds ?? 0),
    completed: input.completed ?? false,
    updatedAt: input.updatedAt ?? Date.now(),
  };
  if (!isValidProgressRow(row)) return readGuestProgress();

  const rest = readGuestProgress().filter(
    (r) => !(r.seriesSlug === row.seriesSlug && r.episodeNumber === row.episodeNumber),
  );
  const next = [row, ...rest].slice(0, MAX_PROGRESS_ROWS);
  writeJson(PROGRESS_KEY, next);
  return next;
}

/**
 * The furthest-along unfinished playhead for one title, or null.
 *
 * `> 2` matches buildResumeUrl (lib/resume.ts:31) and Player.tsx's seek gate:
 * resuming two seconds in is worse than starting over, because it skips the
 * first frame the viewer is waiting to see.
 */
export function readGuestResume(seriesSlug: string): GuestProgressRow | null {
  if (!isValidSlug(seriesSlug)) return null;
  const rows = readGuestProgress().filter(
    (r) => r.seriesSlug === seriesSlug && !r.completed && r.progressSeconds > 2,
  );
  if (rows.length === 0) return null;
  return rows.reduce((best, r) => (r.updatedAt > best.updatedAt ? r : best));
}

/* ---- Saved list --------------------------------------------------- */

export function readSavedSlugs(): string[] {
  const raw = readJson<unknown>(SAVED_KEY, null);
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of raw) {
    if (!isValidSlug(s) || seen.has(s)) continue;
    seen.add(s);
    out.push(s);
  }
  return out;
}

/** Replace the saved list wholesale (used when the server's copy wins). */
export function writeSavedSlugs(slugs: string[]): string[] {
  const seen = new Set<string>();
  const clean = slugs.filter((s) => {
    if (!isValidSlug(s) || seen.has(s)) return false;
    seen.add(s);
    return true;
  });
  writeJson(SAVED_KEY, clean);
  return clean;
}

/** Add or remove one slug. Returns the list as written. */
export function setSavedSlug(seriesSlug: string, saved: boolean): string[] {
  if (!isValidSlug(seriesSlug)) return readSavedSlugs();
  const current = readSavedSlugs();
  const next = saved
    ? current.includes(seriesSlug)
      ? current
      : [seriesSlug, ...current]
    : current.filter((s) => s !== seriesSlug);
  return writeSavedSlugs(next);
}

export function isSavedSlug(seriesSlug: string): boolean {
  return readSavedSlugs().includes(seriesSlug);
}

/* ---- Migration into an account ------------------------------------ */

export function readGuestSnapshot(): GuestSnapshot {
  return { progress: readGuestProgress(), saved: readSavedSlugs() };
}

/**
 * A cheap fingerprint of the snapshot. Comparing it to the stored one answers
 * "is there anything the account has not seen yet" without a network call, so
 * a device with nothing to migrate — every device, most of the time — costs
 * zero requests.
 *
 * It has to change when state is REMOVED as well as added, which is why the
 * counts are in it and not just the newest timestamp.
 */
export function guestSnapshotDigest(snapshot: GuestSnapshot = readGuestSnapshot()): string {
  const newest = snapshot.progress.reduce((max, r) => (r.updatedAt > max ? r.updatedAt : max), 0);
  return `${snapshot.progress.length}:${newest}:${snapshot.saved.length}:${snapshot.saved
    .slice()
    .sort()
    .join(",")}`;
}

/** True when this device holds guest state no account has absorbed yet. */
export function guestStateNeedsMigration(): boolean {
  const snapshot = readGuestSnapshot();
  if (snapshot.progress.length === 0 && snapshot.saved.length === 0) return false;
  const s = store();
  if (!s) return false;
  let stamped: string | null = null;
  try {
    stamped = s.getItem(MIGRATED_KEY);
  } catch {
    return false;
  }
  return stamped !== guestSnapshotDigest(snapshot);
}

/**
 * Record that the current snapshot reached the account.
 *
 * The local rows are deliberately NOT deleted. The device keeps working
 * offline, the same viewer signing out still has their history, and re-running
 * the merge is harmless anyway: the server-side merge is newer-wins per row,
 * so a duplicate POST is a no-op rather than a rollback.
 */
export function markGuestStateMigrated(): void {
  const s = store();
  if (!s) return;
  try {
    s.setItem(MIGRATED_KEY, guestSnapshotDigest());
  } catch {
    /* ignore */
  }
}

/**
 * Erase everything this module owns.
 *
 * Called by account deletion. components/ProfileDynamic.tsx already cleared
 * `verza-saved`, `verza-lang` and the `verza-unlock:` hints there while the
 * button's own copy promised to remove "your account, watch history, saved
 * list, and purchases access" — leaving a full local watch history behind
 * would have made that sentence false.
 */
export function clearGuestState(): void {
  const s = store();
  if (!s) return;
  for (const key of [PROGRESS_KEY, SAVED_KEY, MIGRATED_KEY]) {
    try {
      s.removeItem(key);
    } catch {
      /* ignore */
    }
  }
}
