"use client";

import { createBrowserSupabase } from "@/lib/supabase/client";

export type AuthorizedPlaybackSource = {
  url: string;
  poster: string | null;
  policy: "public" | "signed";
  expiresAt: number | null;
};

export class PlaybackAccessError extends Error {
  readonly status: number;

  constructor(status: number, message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "PlaybackAccessError";
    this.status = status;
  }

  /* 401 and 402 are answers: the viewer is not signed in, or has not bought
     this title. Everything else is the pipeline failing, and the difference
     matters because one shows a paywall and the other shows a retry. */
  get isEntitlement(): boolean {
    return this.status === 401 || this.status === 402;
  }
}

type CacheEntry = {
  source: AuthorizedPlaybackSource;
  reusableUntilMs: number;
};

const cache = new Map<string, CacheEntry>();
const pending = new Map<string, Promise<AuthorizedPlaybackSource>>();
const invalidationListeners = new Set<() => void>();
let cacheGeneration = 0;

// Never reuse a signed token close to expiry. The longest catalog episode is
// ~399s, so a newly attached player always receives far more runway than this
// skew; a currently playing source is not proactively interrupted.
const SIGNED_REUSE_SKEW_MS = 90_000;
// During the compatibility deployment paid API responses are still public.
// Keep those briefly so a later signed-mode flag flip converges quickly.
const PUBLIC_COMPAT_CACHE_MS = 5 * 60_000;
/* Long enough that a slow phone connection still succeeds, short enough that a
   dead connection surfaces a retry while the viewer is still watching. */
const PLAYBACK_REQUEST_TIMEOUT_MS = 12_000;

function keyFor(seriesSlug: string, episodeNumber: number): string {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(seriesSlug)) {
    throw new PlaybackAccessError(400, "Invalid series slug");
  }
  if (!Number.isSafeInteger(episodeNumber) || episodeNumber < 1) {
    throw new PlaybackAccessError(400, "Invalid episode number");
  }
  return `${seriesSlug}--${episodeNumber}`;
}

async function cacheContext(): Promise<{
  scope: string;
  authorization: string | null;
}> {
  try {
    const supabase = createBrowserSupabase();
    if (!supabase) return { scope: "anonymous", authorization: null };
    const { data } = await supabase.auth.getSession();
    return {
      scope: data.session?.user.id ?? "anonymous",
      authorization: data.session?.access_token
        ? `Bearer ${data.session.access_token}`
        : null,
    };
  } catch {
    return { scope: "anonymous", authorization: null };
  }
}

export function invalidateAuthorizedPlayback(
  seriesSlug: string,
  episodeNumber: number,
): void {
  const logicalKey = keyFor(seriesSlug, episodeNumber);
  const suffix = `\0${logicalKey}`;
  for (const cacheKey of cache.keys()) {
    if (cacheKey.endsWith(suffix)) cache.delete(cacheKey);
  }
}

export function clearAuthorizedPlaybackCache(): void {
  // Clearing Maps alone is insufficient: an already-started request could
  // otherwise repopulate the old account's cache after sign-out.
  cacheGeneration += 1;
  cache.clear();
  pending.clear();
  for (const listener of invalidationListeners) {
    try {
      listener();
    } catch {
      // One mounted player must not prevent the others from detaching their
      // capability-bearing sources.
    }
  }
}

export function subscribeAuthorizedPlaybackInvalidation(
  listener: () => void,
): () => void {
  invalidationListeners.add(listener);
  return () => invalidationListeners.delete(listener);
}

export async function getAuthorizedPlayback(
  seriesSlug: string,
  episodeNumber: number,
  options: { forceRefresh?: boolean } = {},
): Promise<AuthorizedPlaybackSource> {
  const logicalKey = keyFor(seriesSlug, episodeNumber);
  const requestGeneration = cacheGeneration;
  /* Scope capability caches to the current verified Supabase user. A client-
     side sign-out/account switch cannot inherit another account's paid URL. */
  const context = await cacheContext();
  if (requestGeneration !== cacheGeneration) {
    throw new PlaybackAccessError(401, "Playback session changed");
  }
  const key = `${context.scope}\0${logicalKey}`;
  const now = Date.now();
  if (!options.forceRefresh) {
    const hit = cache.get(key);
    if (hit && hit.reusableUntilMs > now) return hit.source;
    const inflight = pending.get(key);
    if (inflight) return inflight;
  } else {
    cache.delete(key);
  }

  const request = (async () => {
    /* A hanging request must become a handled failure, not an open promise.
       Without a deadline a stalled connection left this promise unsettled
       forever, so the caller never reached its catch, never set an error state,
       and the viewer sat on a black slide with nothing to retry. A timeout
       converts that into an ordinary PlaybackAccessError the UI can render. */
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), PLAYBACK_REQUEST_TIMEOUT_MS);
    let response: Response;
    try {
      response = await fetch(`/api/playback/${encodeURIComponent(logicalKey)}`, {
        credentials: "same-origin",
        cache: "no-store",
        signal: controller.signal,
        headers: {
          Accept: "application/json",
          ...(context.authorization
            ? { Authorization: context.authorization }
            : {}),
        },
      });
    } catch (cause) {
      /* Classify on the error as well as the signal. Reading signal.aborted
         alone misses an abort that reaches us as a rejection without the flag
         being set, and the distinction is not cosmetic: a timeout tells the
         viewer "this is taking longer than usual" while a hard failure tells
         them the episode could not load. Both are retryable, neither is a
         paywall. */
      const timedOut =
        controller.signal.aborted ||
        (cause instanceof Error && cause.name === "AbortError");
      throw new PlaybackAccessError(
        timedOut ? 504 : 503,
        timedOut ? "Playback request timed out" : "Playback request failed",
        { cause },
      );
    } finally {
      clearTimeout(timer);
    }
    const body = (await response.json().catch(() => null)) as {
      playbackUrl?: unknown;
      poster?: unknown;
      policy?: unknown;
      expiresAt?: unknown;
      error?: unknown;
      message?: unknown;
    } | null;

    if (!response.ok) {
      const message =
        typeof body?.error === "string"
          ? body.error
          : typeof body?.message === "string"
            ? body.message
            : "Playback authorization failed";
      throw new PlaybackAccessError(response.status, message);
    }
    if (
      typeof body?.playbackUrl !== "string" ||
      (body.policy !== "public" && body.policy !== "signed")
    ) {
      throw new PlaybackAccessError(502, "Invalid playback response");
    }

    const expiresAt =
      typeof body.expiresAt === "number" && Number.isFinite(body.expiresAt)
        ? body.expiresAt
        : null;
    if (body.policy === "signed" && expiresAt === null) {
      throw new PlaybackAccessError(502, "Signed playback response has no expiry");
    }
    const source: AuthorizedPlaybackSource = {
      url: body.playbackUrl,
      poster: typeof body.poster === "string" ? body.poster : null,
      policy: body.policy,
      expiresAt,
    };
    // Re-resolve identity after the network boundary. An auth transition must
    // make the old request fail before its URL can be cached or attached.
    const currentContext = await cacheContext();
    if (
      requestGeneration !== cacheGeneration ||
      currentContext.scope !== context.scope
    ) {
      throw new PlaybackAccessError(401, "Playback session changed");
    }
    const reusableUntilMs = expiresAt
      ? expiresAt * 1000 - SIGNED_REUSE_SKEW_MS
      : Date.now() + PUBLIC_COMPAT_CACHE_MS;
    if (reusableUntilMs > Date.now()) {
      cache.set(key, { source, reusableUntilMs });
    }
    return source;
  })();

  pending.set(key, request);
  try {
    return await request;
  } finally {
    if (pending.get(key) === request) pending.delete(key);
  }
}

if (typeof window !== "undefined") {
  const authClient = createBrowserSupabase();
  authClient?.auth.onAuthStateChange((event) => {
    if (
      event === "SIGNED_OUT" ||
      event === "SIGNED_IN" ||
      event === "USER_UPDATED" ||
      event === "PASSWORD_RECOVERY"
    ) {
      clearAuthorizedPlaybackCache();
    }
  });
}
