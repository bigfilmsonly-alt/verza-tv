import "server-only";
import type Stripe from "stripe";
import { SERIES_UNLOCK_PRICE_CENTS } from "@/lib/series-purchase";
import { canonicalCheckoutFinancials } from "@/lib/stripe-tax";

const PAGE_SIZE = 100;
export const MAX_SERIES_CHECKOUT_HISTORY = 500;

export type PriorSeriesCheckout =
  | { kind: "none" }
  | { kind: "open"; session: Stripe.Checkout.Session }
  | { kind: "paid"; session: Stripe.Checkout.Session }
  | {
      kind: "blocked";
      sessionId: string;
      reason:
        | "identity_conflict"
        | "multiple_open_sessions"
        | "noncanonical_open_session"
        | "payment_pending";
    };

type SeriesCheckoutIdentity = {
  customerId: string;
  userId: string;
  seriesSlug: string;
  termsVersion: string;
  tosConsentPolicy: "required" | "not_required";
  checkoutClient: "native_android" | "web";
};

function expandableId(
  value: string | { id: string } | null | undefined,
): string | null {
  return typeof value === "string" ? value : value?.id ?? null;
}

function referencesSeries(
  session: Stripe.Checkout.Session,
  seriesSlug: string,
): boolean {
  return (
    session.metadata?.type === "series_unlock" &&
    session.metadata?.seriesSlug === seriesSlug
  );
}

function hasExactIdentity(
  session: Stripe.Checkout.Session,
  identity: SeriesCheckoutIdentity,
): boolean {
  return (
    session.mode === "payment" &&
    expandableId(session.customer) === identity.customerId &&
    session.metadata?.userId === identity.userId &&
    session.client_reference_id === identity.userId
  );
}

function isReusableOpenSession(
  session: Stripe.Checkout.Session,
  identity: SeriesCheckoutIdentity,
): boolean {
  if (
    !session.url ||
    session.metadata?.termsVersion !== identity.termsVersion ||
    session.metadata?.tosConsentPolicy !== identity.tosConsentPolicy ||
    session.metadata?.checkoutClient !== identity.checkoutClient
  ) {
    return false;
  }
  try {
    canonicalCheckoutFinancials(session, SERIES_UNLOCK_PRICE_CENTS);
    return true;
  } catch {
    return false;
  }
}

/**
 * Search durable Stripe Checkout history before creating another logical
 * series purchase. Stripe idempotency keys have limited retention while the
 * Session records remain provider history, so this closes the later
 * duplicate-charge window when both webhook delivery and the original
 * browser/native return failed.
 *
 * Only complete and open sessions matter. Expired, unpaid sessions cannot be
 * completed and are intentionally omitted. A bounded, incomplete history scan
 * throws before checkout creation instead of guessing that no payment exists.
 */
export async function findPriorSeriesCheckout(
  client: Stripe,
  identity: SeriesCheckoutIdentity,
): Promise<PriorSeriesCheckout> {
  let scanned = 0;

  const scan = async (
    status: "complete" | "open",
    inspect: (session: Stripe.Checkout.Session) => PriorSeriesCheckout | null,
  ): Promise<PriorSeriesCheckout | null> => {
    let startingAfter: string | undefined;
    let blocked: PriorSeriesCheckout | null = null;
    let reusableOpen: PriorSeriesCheckout | null = null;

    for (;;) {
      const page = await client.checkout.sessions.list({
        customer: identity.customerId,
        status,
        limit: PAGE_SIZE,
        ...(startingAfter ? { starting_after: startingAfter } : {}),
      });
      for (const session of page.data) {
        scanned += 1;
        if (scanned > MAX_SERIES_CHECKOUT_HISTORY) {
          throw new Error(
            "Stripe Checkout history exceeds the safe duplicate-payment scan limit",
          );
        }
        const decision = inspect(session);
        if (decision?.kind === "paid") {
          return decision;
        }
        if (decision?.kind === "open") {
          if (reusableOpen) {
            blocked ??= {
              kind: "blocked",
              sessionId: decision.session.id,
              reason: "multiple_open_sessions",
            };
          } else {
            reusableOpen = decision;
          }
        } else {
          blocked ??= decision;
        }
      }
      if (!page.has_more) return blocked ?? reusableOpen;
      const last = page.data.at(-1);
      if (!last) {
        throw new Error("Stripe Checkout pagination returned no continuation row");
      }
      startingAfter = last.id;
    }
  };

  const complete = await scan("complete", (session) => {
    if (!referencesSeries(session, identity.seriesSlug)) return null;
    if (!hasExactIdentity(session, identity)) {
      return {
        kind: "blocked",
        sessionId: session.id,
        reason: "identity_conflict",
      };
    }
    if (session.payment_status === "paid") {
      return { kind: "paid", session };
    }
    return {
      kind: "blocked",
      sessionId: session.id,
      reason: "payment_pending",
    };
  });
  if (complete) return complete;

  const open = await scan("open", (session) => {
    if (!referencesSeries(session, identity.seriesSlug)) return null;
    if (!hasExactIdentity(session, identity)) {
      return {
        kind: "blocked",
        sessionId: session.id,
        reason: "identity_conflict",
      };
    }
    if (!isReusableOpenSession(session, identity)) {
      return {
        kind: "blocked",
        sessionId: session.id,
        reason: "noncanonical_open_session",
      };
    }
    return { kind: "open", session };
  });
  return open ?? { kind: "none" };
}
