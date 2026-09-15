/* ==================================================================== */
/*  Which OAuth providers the WEB app may actually offer                 */
/* ==================================================================== */

/**
 * Only providers that are enabled in Supabase belong on a sign-in surface.
 *
 * This list exists because "Continue with Apple" shipped and was a dead
 * control. Supabase reports `apple: false`, and the authorize endpoint answers:
 *
 *     HTTP 400  {"error_code":"validation_failed",
 *                "msg":"Unsupported provider: provider is not enabled"}
 *
 * So every viewer who chose Apple got an error instead of an account. On an
 * ordinary sign-in page that is a bad bug. On the paywall, where it is now one
 * of the controls that takes money, it would be the single most expensive
 * button on the site.
 *
 * Apple is deliberately absent rather than deleted: enabling it is a Supabase
 * dashboard change plus Apple developer credentials, not a code change. When
 * that is done, add "apple" here and it returns everywhere at once.
 * `scripts/test-purchase-ux.mjs` checks this list against the live Supabase
 * settings, so the two cannot drift in either direction unnoticed.
 */
export const WEB_OAUTH_PROVIDERS = ["google"] as const;

export type WebOAuthProvider = (typeof WEB_OAUTH_PROVIDERS)[number];

export function isWebOAuthProvider(value: string): value is WebOAuthProvider {
  return (WEB_OAUTH_PROVIDERS as readonly string[]).includes(value);
}
