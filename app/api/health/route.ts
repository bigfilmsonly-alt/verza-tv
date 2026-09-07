import { getServiceClient } from "@/lib/supabase/server";
import { privateJson } from "@/lib/private-json";

export const runtime = "nodejs";
/* Never cached: a cached health check reports the state of whenever it was
   cached, which is the opposite of what a monitor needs. */
export const dynamic = "force-dynamic";

/**
 * GET /api/health — is Verza able to take money right now?
 *
 * Built after a ~7.5-week outage (2026-07-15 → 2026-09-07) in which the site
 * looked completely healthy while its revenue path was dead: the Supabase
 * project had been paused by free-tier inactivity, so sign-in, entitlement
 * reads and the Stripe webhook's entitlement WRITE all failed. Anonymous
 * browsing and free episodes kept working, so nothing surfaced the failure.
 * No monitor existed that could tell the difference.
 *
 * This endpoint exists to answer one question a homepage ping cannot:
 * CAN THE SERVER STILL REACH THE DATABASE IT WRITES ENTITLEMENTS TO?
 *
 * It deliberately exercises the SERVICE client (SUPABASE_URL +
 * SUPABASE_SERVICE_ROLE_KEY) rather than the browser client, because that is
 * the client `app/api/stripe/webhook/route.ts` uses to grant access after a
 * payment. A green browser-side auth check would NOT have caught this outage.
 *
 * `projectsMatch` is the other half. There are two independent Supabase
 * configurations in this codebase:
 *
 *   browser + middleware (lib/supabase/client.ts, middleware.ts)
 *       -> NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY
 *   service, i.e. every server write (lib/supabase/server.ts)
 *       -> SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY
 *
 * If those point at DIFFERENT projects, the product splits in half silently:
 * a viewer authenticates against one database while their purchases and
 * entitlements are written to another. Checkout would appear to succeed and
 * the content would stay locked. Nothing else in the stack notices, which is
 * why the comparison is checked here on every ping.
 *
 * SECRET DISCIPLINE: this route is public, so it returns BOOLEANS and counts
 * only. No URL, no project ref, no key, no key prefix, ever — `projectsMatch`
 * is enough to diagnose the mismatch without publishing infrastructure names.
 *
 * Status codes are chosen for an external uptime monitor: 200 healthy,
 * 503 when the database is unreachable or misconfigured, so a monitor alerts
 * on "Verza cannot take money" rather than on "the homepage is slow".
 */
export async function GET() {
  const startedAt = Date.now();

  const serverUrl = process.env.SUPABASE_URL ?? "";
  const publicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

  /* Compare only the project ref (the first label of the Supabase hostname).
     Derived here and compared in memory; neither value is returned. */
  const refOf = (raw: string): string | null => {
    try {
      return new URL(raw).hostname.split(".")[0] || null;
    } catch {
      return null;
    }
  };
  const serverRef = refOf(serverUrl);
  const publicRef = refOf(publicUrl);

  const configured = Boolean(serverRef && publicRef && process.env.SUPABASE_SERVICE_ROLE_KEY);
  const projectsMatch = Boolean(serverRef && publicRef && serverRef === publicRef);

  /* A real round trip through the service client. HEAD + count touches no row
     data, so this stays cheap enough to poll on a schedule, and a paused or
     misconfigured project fails it immediately. */
  let canRead = false;
  let dbError: string | null = null;
  if (configured) {
    try {
      const { error } = await getServiceClient()
        .from("entitlements")
        .select("id", { count: "exact", head: true });
      if (error) {
        /* Supabase error messages name tables and roles but never secrets. */
        dbError = error.message.slice(0, 160);
      } else {
        canRead = true;
      }
    } catch (err) {
      dbError = (err instanceof Error ? err.message : String(err)).slice(0, 160);
    }
  } else {
    dbError = "server Supabase configuration is incomplete";
  }

  /* Reaching the right project is not the same as reaching a USABLE one.
     On 2026-09-07 this endpoint returned ok:true while every payment table was
     missing: repointing SUPABASE_URL at the canonical project fixed the split
     brain, but that project had only ever received migrations 001–008, so
     migrations 009–015 were live on the database production had just stopped
     using. `canRead` stayed green because `entitlements` exists in the base
     schema, and /api/unlock returned 500 on every tap.

     So probe the two objects whose absence breaks the money path, chosen
     because they fail at the two DIFFERENT points a payment can die:

       profiles.deletion_requested_at (migration 010)
         /api/unlock selects it before creating a Checkout Session, and
         ensureStripeCustomer selects it again. Missing => 500 before Stripe is
         ever called. Loud, and nobody can pay.

       stripe_webhook_events (migration 010)
         The webhook calls claim_stripe_webhook_event before fulfilling.
         Missing => the payment succeeds and the entitlement is never written.
         SILENT, and the customer is charged for content that stays locked.

     The second is the reason this check exists at all. The first announces
     itself; the second takes money and looks fine. */
  let schemaReady = false;
  let schemaError: string | null = null;
  if (canRead) {
    try {
      const db = getServiceClient();
      const [profileColumn, webhookLedger] = await Promise.all([
        db.from("profiles").select("deletion_requested_at", { count: "exact", head: true }),
        db.from("stripe_webhook_events").select("event_id", { count: "exact", head: true }),
      ]);
      const failure = profileColumn.error ?? webhookLedger.error;
      if (failure) {
        schemaError = failure.message.slice(0, 160);
      } else {
        schemaReady = true;
      }
    } catch (err) {
      schemaError = (err instanceof Error ? err.message : String(err)).slice(0, 160);
    }
  }

  const ok = configured && projectsMatch && canRead && schemaReady;

  return privateJson(
    {
      ok,
      checks: {
        /* Both Supabase configurations are present and parseable. */
        configured,
        /* The browser and the server write to the SAME project. */
        projectsMatch,
        /* The service client — the one the Stripe webhook uses — can reach it. */
        canRead,
        /* That project actually carries the payment schema, not just a name. */
        schemaReady,
      },
      dbError,
      schemaError,
      latencyMs: Date.now() - startedAt,
      checkedAt: new Date().toISOString(),
    },
    { status: ok ? 200 : 503 },
  );
}
