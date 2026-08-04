/**
 * JSON response for authenticated or account-derived data.
 *
 * Vercel's default `public, max-age=0, must-revalidate` permits shared storage.
 * These headers prevent account, entitlement, playback, and payment state from
 * entering a browser/CDN cache and separate bearer/cookie variants explicitly.
 */
export function privateJson(
  body: unknown,
  init: ResponseInit = {},
): Response {
  const headers = new Headers(init.headers);
  headers.set("Cache-Control", "private, no-store, max-age=0");

  const requestedVaryTokens = (headers.get("Vary") ?? "")
    .split(",")
    .map((token) => token.trim())
    .filter(Boolean);
  if (requestedVaryTokens.includes("*")) {
    headers.set("Vary", "*");
  } else {
    const varyTokens: string[] = [];
    const seen = new Set<string>();
    for (const token of [
      ...requestedVaryTokens,
      "Authorization",
      "Cookie",
    ]) {
      const normalizedToken = token.toLowerCase();
      if (!seen.has(normalizedToken)) {
        varyTokens.push(token);
        seen.add(normalizedToken);
      }
    }
    headers.set("Vary", varyTokens.join(", "));
  }

  return Response.json(body, { ...init, headers });
}
