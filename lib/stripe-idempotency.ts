import "server-only";
import { createHash } from "node:crypto";
import type Stripe from "stripe";

/**
 * Stable, opaque Stripe idempotency key for a single logical checkout.
 *
 * Stripe retains idempotency results for a limited window. Including the
 * product version/price in `parts` prevents a later catalog change from
 * accidentally reusing a key with different request parameters.
 */
export function stripeIdempotencyKey(...parts: Array<string | number>): string {
  const digest = createHash("sha256")
    .update(parts.map(String).join("\u0000"))
    .digest("hex");
  return `verza:${digest}`;
}

/**
 * Reuses the current logical Checkout while it is open, but walks forward to a
 * deterministic recovery key if Stripe still retains an expired session for
 * the original key. This preserves retry safety without trapping the buyer on
 * a null/expired Checkout URL.
 */
export async function createCheckoutSessionWithRecovery(
  client: Stripe,
  params: Stripe.Checkout.SessionCreateParams,
  logicalKeyParts: Array<string | number>,
): Promise<Stripe.Checkout.Session> {
  let idempotencyKey = stripeIdempotencyKey(...logicalKeyParts);

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const session = await client.checkout.sessions.create(params, {
      idempotencyKey,
    });
    if (session.status !== "expired") return session;
    idempotencyKey = stripeIdempotencyKey(
      "expired-checkout-recovery-v1",
      ...logicalKeyParts,
      session.id,
    );
  }

  throw new Error("Too many retained expired Checkout sessions");
}
