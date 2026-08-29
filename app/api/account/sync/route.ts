import { NextRequest } from "next/server";
import { getUser } from "@/lib/auth";
import { getServiceClient } from "@/lib/supabase/server";
import { getSeriesBySlug } from "@/lib/catalog";
import { privateJson } from "@/lib/private-json";
import { MAX_PROGRESS_ROWS } from "@/lib/guest-storage";

/**
 * Guest state -> account.
 *
 * BUG THIS FIXES: nothing a signed-out viewer did survived registration. They
 * watched the free preview, bookmarked a title, created an account at the
 * paywall, and arrived in a brand-new account with an empty Continue Watching
 * rail and an empty My List. The moment a viewer finally registers is the
 * single worst moment to lose their history, and it was the one moment the app
 * guaranteed it.
 *
 * WHAT THIS ROUTE MAY TOUCH: `watch_progress` and `saved_list`. Nothing else.
 * It never writes entitlements, purchases, profiles or VIP state, and it never
 * reads a price. AGENTS.md rule 4 — browser return never grants access — means
 * a client-supplied payload can move a playhead and a bookmark and nothing
 * more; both are things the viewer could already set to any value they liked
 * with no consequence beyond their own home screen.
 *
 * GET  -> { signedIn }        (no account data; lets the client skip the POST)
 * POST -> { merged: {...} }   (auth required)
 */

/** Same cap the device enforces, restated so the server does not trust it. */
const MAX_SAVED_SLUGS = 200;

interface IncomingRow {
  seriesSlug: string;
  episodeNumber: number;
  progressSeconds: number;
  completed: boolean;
  updatedAt: number;
}

/**
 * Bounds copied from app/api/watch-progress/route.ts:27-51. Restated rather
 * than imported because that file exports nothing; if either drifts, this
 * route is the one that must stay strict — its input arrives as a batch, and a
 * batch is where one bad row would otherwise poison nineteen good ones.
 */
function validRow(value: unknown): IncomingRow | null {
  if (!value || typeof value !== "object") return null;
  const r = value as Record<string, unknown>;

  const seriesSlug = r.seriesSlug;
  if (typeof seriesSlug !== "string" || !seriesSlug || seriesSlug.length > 100) return null;
  if (!/^[a-z0-9-]+$/.test(seriesSlug)) return null;

  // A row for a slug that is not in the catalogue can only ever be dropped on
  // read (route.ts:98-110 already does), so refuse to store it at all.
  const series = getSeriesBySlug(seriesSlug);
  if (!series || series.status !== "live") return null;

  const episodeNumber = r.episodeNumber;
  if (
    typeof episodeNumber !== "number" ||
    !Number.isInteger(episodeNumber) ||
    episodeNumber < 1 ||
    episodeNumber > 999 ||
    episodeNumber > series.episodeCount
  ) {
    return null;
  }

  const progressSeconds = r.progressSeconds;
  if (
    typeof progressSeconds !== "number" ||
    !Number.isFinite(progressSeconds) ||
    progressSeconds < 0 ||
    progressSeconds > 36000
  ) {
    return null;
  }

  if (typeof r.completed !== "boolean") return null;

  const updatedAt = r.updatedAt;
  if (typeof updatedAt !== "number" || !Number.isFinite(updatedAt) || updatedAt <= 0) return null;
  // A clock-skewed device must not be able to claim a timestamp far in the
  // future and win every future merge for the life of the account.
  const clamped = Math.min(updatedAt, Date.now());

  return {
    seriesSlug,
    episodeNumber,
    progressSeconds: Math.floor(progressSeconds),
    completed: r.completed,
    updatedAt: clamped,
  };
}

function validSlug(value: unknown): string | null {
  if (typeof value !== "string" || !value || value.length > 100) return null;
  if (!/^[a-z0-9-]+$/.test(value)) return null;
  const series = getSeriesBySlug(value);
  if (!series) return null;
  return value;
}

/**
 * Is the caller signed in? Deliberately returns nothing else — the client uses
 * it to decide whether a merge is even possible, and a session probe is not a
 * place to leak an id or an email.
 */
export async function GET() {
  const user = await getUser();
  return privateJson({ signedIn: Boolean(user) });
}

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) {
    return privateJson({ error: "Not signed in" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return privateJson({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { progress, saved } = (body ?? {}) as Record<string, unknown>;
  if (progress !== undefined && !Array.isArray(progress)) {
    return privateJson({ error: "progress must be an array" }, { status: 400 });
  }
  if (saved !== undefined && !Array.isArray(saved)) {
    return privateJson({ error: "saved must be an array" }, { status: 400 });
  }

  const rows: IncomingRow[] = [];
  const seenRow = new Set<string>();
  for (const candidate of (progress ?? []).slice(0, MAX_PROGRESS_ROWS)) {
    const row = validRow(candidate);
    if (!row) continue;
    const key = `${row.seriesSlug}#${row.episodeNumber}`;
    if (seenRow.has(key)) continue;
    seenRow.add(key);
    rows.push(row);
  }

  const slugs: string[] = [];
  const seenSlug = new Set<string>();
  for (const candidate of (saved ?? []).slice(0, MAX_SAVED_SLUGS)) {
    const slug = validSlug(candidate);
    if (!slug || seenSlug.has(slug)) continue;
    seenSlug.add(slug);
    slugs.push(slug);
  }

  const supabase = getServiceClient();
  let mergedProgress = 0;
  let skippedProgress = 0;
  let mergedSaved = 0;

  /* ---- Watch progress: newer wins, per row ------------------------ */
  /* The account is not empty by definition — someone may have watched on
     another device between creating the account and this device catching up.
     Blind-upserting the local rows would roll that back, which is the exact
     data loss this route exists to prevent, just pointed the other way. */
  if (rows.length > 0) {
    const { data: existing, error: readErr } = await supabase
      .from("watch_progress")
      .select("series_slug, episode_number, updated_at")
      .eq("user_id", user.id)
      .in("series_slug", [...new Set(rows.map((r) => r.seriesSlug))]);

    if (readErr) {
      console.error("[account/sync] progress read error:", readErr.message);
      return privateJson({ error: "Failed to merge" }, { status: 500 });
    }

    const serverAt = new Map<string, number>();
    for (const e of existing ?? []) {
      serverAt.set(
        `${e.series_slug}#${e.episode_number}`,
        new Date(e.updated_at as string).getTime(),
      );
    }

    const toWrite = rows.filter((r) => {
      const server = serverAt.get(`${r.seriesSlug}#${r.episodeNumber}`);
      if (server !== undefined && server >= r.updatedAt) {
        skippedProgress++;
        return false;
      }
      return true;
    });

    if (toWrite.length > 0) {
      const { error } = await supabase.from("watch_progress").upsert(
        toWrite.map((r) => ({
          user_id: user.id,
          series_slug: r.seriesSlug,
          episode_number: r.episodeNumber,
          progress_seconds: r.progressSeconds,
          completed: r.completed,
          updated_at: new Date(r.updatedAt).toISOString(),
        })),
        { onConflict: "user_id,series_slug,episode_number" },
      );
      if (error) {
        console.error("[account/sync] progress write error:", error.message);
        return privateJson({ error: "Failed to merge" }, { status: 500 });
      }
      mergedProgress = toWrite.length;
    }
  }

  /* ---- Saved list: union, never a replacement --------------------- */
  /* `created_at` is the sort key for My List. Upserting an already-saved slug
     would rewrite it and shuffle an existing account's list for no reason, so
     only genuinely new slugs are inserted. */
  if (slugs.length > 0) {
    const { data: existing, error: readErr } = await supabase
      .from("saved_list")
      .select("series_slug")
      .eq("user_id", user.id)
      .in("series_slug", slugs);

    if (readErr) {
      console.error("[account/sync] saved read error:", readErr.message);
      return privateJson({ error: "Failed to merge" }, { status: 500 });
    }

    const have = new Set((existing ?? []).map((e) => e.series_slug as string));
    const insert = slugs.filter((s) => !have.has(s));

    if (insert.length > 0) {
      const { error } = await supabase.from("saved_list").upsert(
        insert.map((series_slug) => ({
          user_id: user.id,
          series_slug,
          created_at: new Date().toISOString(),
        })),
        { onConflict: "user_id,series_slug" },
      );
      if (error) {
        console.error("[account/sync] saved write error:", error.message);
        return privateJson({ error: "Failed to merge" }, { status: 500 });
      }
      mergedSaved = insert.length;
    }
  }

  return privateJson({
    merged: {
      progress: mergedProgress,
      progressSkippedAsStale: skippedProgress,
      saved: mergedSaved,
    },
  });
}
