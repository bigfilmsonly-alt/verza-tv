import { NextRequest, NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// Rate Limiting Middleware for Verza TV API Routes
// ---------------------------------------------------------------------------
// In-memory sliding-window rate limiter. No external dependencies.
// Each IP gets a bucket per rate-limit tier. When the request count exceeds
// the tier limit within a 60-second window the client receives 429.
//
// NOTE: On serverless platforms (Vercel) each isolate has its own Map, so
// limits are per-instance, not globally shared. This is still effective at
// stopping simple abuse and run-away loops. For globally-shared counters
// consider an external store (Redis / Upstash).
// ---------------------------------------------------------------------------

type RateBucket = { count: number; resetAt: number };

const rateLimitMap = new Map<string, RateBucket>();

const WINDOW_MS = 60_000; // 1 minute
const CLEANUP_INTERVAL_MS = 60_000; // purge stale entries every 60 s

// Tier definitions — order matters: first match wins
const RATE_TIERS: { pattern: RegExp; limit: number }[] = [
  // Expensive: Anthropic AI credits
  { pattern: /^\/api\/ai-host/, limit: 5 },

  // Push notifications
  { pattern: /^\/api\/push\/send/, limit: 10 },

  // Stripe payment sessions
  { pattern: /^\/api\/checkout/, limit: 15 },
  { pattern: /^\/api\/unlock/, limit: 15 },
  { pattern: /^\/api\/subscribe/, limit: 15 },

  // Auth routes — brute-force protection
  { pattern: /^\/api\/auth\//, limit: 10 },

  // Catch-all for every other API route
  { pattern: /^\/api\//, limit: 30 },
];

// ---------------------------------------------------------------------------
// Periodic cleanup — remove expired entries so the Map does not grow unbounded
// ---------------------------------------------------------------------------
let lastCleanup = Date.now();

function cleanupStaleEntries() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  for (const [key, bucket] of rateLimitMap) {
    if (now >= bucket.resetAt) {
      rateLimitMap.delete(key);
    }
  }
}

// ---------------------------------------------------------------------------
// Resolve the client IP from standard proxy headers
// ---------------------------------------------------------------------------
function getClientIp(req: NextRequest): string {
  // Vercel / Cloudflare populate these headers
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    // x-forwarded-for can be comma-separated; first entry is the real client
    return forwarded.split(",")[0].trim();
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  // Fallback — should not happen behind a proxy
  return "unknown";
}

// ---------------------------------------------------------------------------
// Determine which tier a pathname belongs to
// ---------------------------------------------------------------------------
function getTierLimit(pathname: string): number {
  for (const tier of RATE_TIERS) {
    if (tier.pattern.test(pathname)) return tier.limit;
  }
  // Should never reach here because the catch-all matches all /api/* routes,
  // and the matcher config only sends /api/* requests to this middleware.
  return 30;
}

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------
export function middleware(req: NextRequest) {
  // Skip non-API routes (belt-and-suspenders — matcher already filters)
  const { pathname } = req.nextUrl;
  if (!pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Let the Stripe webhook through without rate limiting — Stripe retries on
  // failure and we must not block legitimate webhook deliveries.
  if (pathname.startsWith("/api/stripe/webhook")) {
    return NextResponse.next();
  }

  const ip = getClientIp(req);
  const limit = getTierLimit(pathname);
  const now = Date.now();

  // Build a composite key: ip + tier limit so the same IP has separate
  // buckets for different rate-limit tiers.
  const key = `${ip}:${limit}`;

  // Lazy cleanup of expired entries
  cleanupStaleEntries();

  let bucket = rateLimitMap.get(key);

  if (!bucket || now >= bucket.resetAt) {
    // First request in this window or previous window expired
    bucket = { count: 1, resetAt: now + WINDOW_MS };
    rateLimitMap.set(key, bucket);
  } else {
    bucket.count += 1;
  }

  // ---- Exceeded ----
  if (bucket.count > limit) {
    const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
    return NextResponse.json(
      {
        error: "Too Many Requests",
        message: `Rate limit exceeded. Try again in ${retryAfter} second${retryAfter === 1 ? "" : "s"}.`,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter),
          "X-RateLimit-Limit": String(limit),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Math.ceil(bucket.resetAt / 1000)),
        },
      },
    );
  }

  // ---- Allowed ----
  const response = NextResponse.next();
  response.headers.set("X-RateLimit-Limit", String(limit));
  response.headers.set("X-RateLimit-Remaining", String(limit - bucket.count));
  response.headers.set("X-RateLimit-Reset", String(Math.ceil(bucket.resetAt / 1000)));
  return response;
}

// ---------------------------------------------------------------------------
// Matcher — only run middleware on API routes
// ---------------------------------------------------------------------------
export const config = {
  matcher: "/api/:path*",
};
