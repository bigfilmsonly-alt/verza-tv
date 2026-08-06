import { NextRequest } from "next/server";
import { Environment } from "@apple/app-store-server-library";
import { getUser } from "@/lib/auth";
import {
  getApplePurchaseBinding,
  recordAppleSeriesTransaction,
} from "@/lib/apple-iap-ledger";
import {
  normalizeAppleTransaction,
  verifyAppleSignedTransaction,
} from "@/lib/apple-iap-verification";
import { appleSandboxUserAllowed } from "@/lib/apple-iap-sandbox-policy";
import { privateJson } from "@/lib/private-json";
import { getServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!/^Bearer [^\s]+$/.test(request.headers.get("authorization") ?? "")) {
    return privateJson(
      { error: "Native Apple verification requires Bearer authentication" },
      { status: 401 },
    );
  }
  const user = await getUser();
  if (!user) {
    return privateJson({ error: "Authentication required" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return privateJson({ error: "Invalid JSON body" }, { status: 400 });
  }
  const record =
    body && typeof body === "object" && !Array.isArray(body)
      ? (body as Record<string, unknown>)
      : null;
  const signedTransaction = record?.signedTransaction;
  const expectedSeriesSlug = record?.expectedSeriesSlug;
  const restoreMode = record?.restoreMode;
  if (
    typeof signedTransaction !== "string" ||
    signedTransaction.length < 64 ||
    signedTransaction.length > 65_536 ||
    signedTransaction.split(".").length !== 3 ||
    typeof expectedSeriesSlug !== "string" ||
    expectedSeriesSlug.length > 100 ||
    (restoreMode !== undefined && typeof restoreMode !== "boolean")
  ) {
    return privateJson({ error: "Invalid Apple transaction body" }, { status: 400 });
  }

  try {
    const decoded = await verifyAppleSignedTransaction(signedTransaction);
    const transaction = normalizeAppleTransaction(decoded, signedTransaction);
    if (transaction.seriesSlug !== expectedSeriesSlug) {
      return privateJson(
        { error: "Apple transaction does not match this series" },
        { status: 403 },
      );
    }
    const exactAccountToken = transaction.userId === user.id.toLowerCase();
    let allowOrphanRebind = false;
    if (!exactAccountToken && restoreMode !== true) {
      return privateJson(
        {
          error: "Apple transaction belongs to another VERZA account",
          differentLiveAccount: true,
        },
        { status: 403 },
      );
    }

    if (!exactAccountToken) {
      const binding = await getApplePurchaseBinding(
        transaction.originalTransactionId,
      );
      if (binding.kind === "orphaned") {
        const serviceClient = getServiceClient();
        const [priorProfile, priorAuthUser] = await Promise.all([
          serviceClient
            .from("profiles")
            .select("id")
            .eq("id", transaction.userId)
            .maybeSingle(),
          serviceClient.auth.admin.getUserById(transaction.userId),
        ]);
        if (priorProfile.error) {
          throw new Error("Could not verify deleted Apple purchase owner");
        }
        const authUserMissing =
          priorAuthUser.error?.status === 404 ||
          priorAuthUser.error?.code === "user_not_found";
        if (priorAuthUser.error && !authUserMissing) {
          throw new Error("Could not verify deleted Apple purchase identity");
        }
        if (priorProfile.data || priorAuthUser.data.user) {
          return privateJson(
            {
              error: "Apple purchase remains linked to another live VERZA account",
              differentLiveAccount: true,
            },
            { status: 403 },
          );
        }
        allowOrphanRebind = true;
      } else if (
        binding.kind !== "live" ||
        binding.userId !== user.id.toLowerCase()
      ) {
        return privateJson(
          {
            error:
              binding.kind === "live"
                ? "Apple purchase belongs to another live VERZA account"
                : "Apple purchase is not eligible for account recovery",
            differentLiveAccount: true,
          },
          { status: 403 },
        );
      }
    }
    if (
      transaction.environment === Environment.SANDBOX &&
      !appleSandboxUserAllowed(user.id)
    ) {
      return privateJson(
        { error: "Sandbox purchases are not enabled for this review account" },
        { status: 403 },
      );
    }

    const result = await recordAppleSeriesTransaction(
      transaction,
      transaction.revocationDate === null ? "active" : "revoked",
      {
        entitlementUserId: user.id,
        allowOrphanRebind,
      },
    );

    // A valid canonical terminal transaction must also be finished so StoreKit
    // does not redeliver it forever. finishAuthorized proves only durable
    // server verification; accessGranted independently controls playback.
    return privateJson({
      verified: true,
      finishAuthorized: true,
      accessGranted: result.purchaseActive && result.accessGranted,
      canonicalStatus: result.canonicalStatus,
      accountRebound: result.accountRebound,
      transactionId: transaction.transactionId,
      seriesSlug: transaction.seriesSlug,
      environment: transaction.environment,
    });
  } catch (error) {
    console.error(
      "[apple-iap] Transaction verification failed:",
      error instanceof Error ? error.message : "unknown error",
    );
    return privateJson(
      { error: "Apple transaction could not be verified" },
      { status: 400 },
    );
  }
}
