import { NextRequest } from "next/server";
import {
  Environment,
  NotificationTypeV2,
} from "@apple/app-store-server-library";
import {
  claimAppleNotification,
  finishAppleNotification,
  recordAppleSeriesTransaction,
  type ApplePurchaseStatus,
} from "@/lib/apple-iap-ledger";
import {
  appleSandboxUserAllowed,
  normalizeAppleTransaction,
  verifyAppleSignedNotification,
  verifyAppleSignedTransaction,
} from "@/lib/apple-iap-verification";
import { privateJson } from "@/lib/private-json";

export const runtime = "nodejs";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const TRANSACTION_NOTIFICATION_STATUS: Partial<
  Record<NotificationTypeV2, ApplePurchaseStatus>
> = {
  [NotificationTypeV2.ONE_TIME_CHARGE]: "active",
  [NotificationTypeV2.REFUND]: "refunded",
  [NotificationTypeV2.REVOKE]: "revoked",
  [NotificationTypeV2.REFUND_REVERSED]: "active",
};

function optionalIso(milliseconds: number | undefined): string | null {
  if (!Number.isSafeInteger(milliseconds) || (milliseconds ?? 0) <= 0) return null;
  const date = new Date(milliseconds!);
  return Number.isFinite(date.valueOf()) ? date.toISOString() : null;
}

function laterIso(first: string, second: string | null): string {
  if (second === null) return first;
  return Date.parse(second) > Date.parse(first) ? second : first;
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return privateJson({ error: "Invalid JSON body" }, { status: 400 });
  }
  const signedPayload =
    body && typeof body === "object" && !Array.isArray(body)
      ? (body as Record<string, unknown>).signedPayload
      : null;
  if (
    typeof signedPayload !== "string" ||
    signedPayload.length < 64 ||
    signedPayload.length > 131_072 ||
    signedPayload.split(".").length !== 3
  ) {
    return privateJson({ error: "Invalid signedPayload" }, { status: 400 });
  }

  let notificationUuid: string | null = null;
  let originalTransactionId: string | null = null;
  try {
    const notification = await verifyAppleSignedNotification(signedPayload);
    notificationUuid = notification.notificationUUID ?? null;
    const notificationType = notification.notificationType ?? "";
    const environment = notification.data?.environment ?? null;
    const signedDate = optionalIso(notification.signedDate);
    if (
      !notificationUuid ||
      !UUID_PATTERN.test(notificationUuid) ||
      !notificationType ||
      (environment !== Environment.PRODUCTION &&
        environment !== Environment.SANDBOX)
    ) {
      throw new Error("Apple notification identity is incomplete");
    }

    const claim = await claimAppleNotification({
      notificationUuid,
      notificationType,
      subtype: notification.subtype ?? null,
      environment,
      signedDate,
    });
    if (claim === "processed") return privateJson({ ok: true });
    if (claim === "busy") {
      return privateJson({ error: "Notification is already processing" }, { status: 409 });
    }

    const requestedStatus =
      TRANSACTION_NOTIFICATION_STATUS[
        notificationType as NotificationTypeV2
      ];
    if (requestedStatus !== undefined) {
      const signedTransaction = notification.data?.signedTransactionInfo;
      if (!signedTransaction) {
        throw new Error("Apple notification is missing transaction data");
      }
      const decoded = await verifyAppleSignedTransaction(signedTransaction);
      let transaction = normalizeAppleTransaction(decoded, signedTransaction);
      originalTransactionId = transaction.originalTransactionId;
      if (transaction.environment !== environment) {
        throw new Error("Apple notification environments do not match");
      }
      if (
        environment === Environment.SANDBOX &&
        !appleSandboxUserAllowed(transaction.userId)
      ) {
        throw new Error("Sandbox notification account is not allowlisted");
      }

      // The outer notification and inner transaction are both Apple-signed.
      // Use the later signed timestamp as the monotonic provider event clock.
      // REFUND_REVERSED explicitly clears the earlier revocation marker.
      transaction = {
        ...transaction,
        signedDate: laterIso(transaction.signedDate, signedDate),
        revocationDate:
          notificationType === NotificationTypeV2.REFUND_REVERSED
            ? null
            : transaction.revocationDate,
      };
      await recordAppleSeriesTransaction(transaction, requestedStatus, {
        // Provider notifications follow the current live ledger owner. The
        // transaction's purchase-time token may intentionally differ after a
        // deleted-account restore reclaim.
        entitlementUserId: null,
        allowOrphanRebind: false,
      });
    }

    await finishAppleNotification({
      notificationUuid,
      status: "processed",
      originalTransactionId,
      error: null,
    });
    return privateJson({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    console.error("[apple-iap] Notification processing failed:", message);
    if (notificationUuid && UUID_PATTERN.test(notificationUuid)) {
      await finishAppleNotification({
        notificationUuid,
        status: "failed",
        originalTransactionId,
        error: message,
      }).catch(() => {});
    }
    return privateJson({ error: "Apple notification was not processed" }, { status: 500 });
  }
}
