import "server-only";

import type { CanonicalAppleTransaction } from "@/lib/apple-iap-verification";
import { getServiceClient } from "@/lib/supabase/server";

export type ApplePurchaseStatus = "active" | "refunded" | "revoked";

export interface AppleLedgerResult {
  purchaseActive: boolean;
  accessGranted: boolean;
  canonicalStatus: ApplePurchaseStatus;
  accountRebound: boolean;
}

export async function recordAppleSeriesTransaction(
  transaction: CanonicalAppleTransaction,
  status: ApplePurchaseStatus,
  options: {
    entitlementUserId: string | null;
    allowOrphanRebind: boolean;
  },
): Promise<AppleLedgerResult> {
  const revocationDate = status === "active" ? null : transaction.revocationDate;
  if (status !== "active" && revocationDate === null) {
    throw new Error("An adverse Apple transaction needs a revocation date");
  }

  let entitlementUserId = options.entitlementUserId;
  if (entitlementUserId === null) {
    const binding = await getApplePurchaseBinding(
      transaction.originalTransactionId,
    );
    entitlementUserId =
      binding.kind === "unseen"
        ? transaction.userId
        : binding.kind === "live"
          ? binding.userId
          : null;
  }

  const { data, error } = await getServiceClient().rpc(
    "record_apple_series_transaction",
    {
      p_transaction_id: transaction.transactionId,
      p_original_transaction_id: transaction.originalTransactionId,
      p_transaction_app_account_token: transaction.userId,
      p_entitlement_user_id: entitlementUserId,
      p_allow_orphan_rebind: options.allowOrphanRebind,
      p_product_id: transaction.productId,
      p_series_slug: transaction.seriesSlug,
      p_environment: transaction.environment,
      p_status: status,
      p_purchase_date: transaction.purchaseDate,
      p_signed_date: transaction.signedDate,
      p_revocation_date: revocationDate,
      p_price_milliunits: transaction.priceMilliunits,
      p_currency: transaction.currency,
      p_signed_transaction_sha256: transaction.signedTransactionSha256,
    },
  );
  if (error) throw new Error(`Apple purchase ledger failed: ${error.message}`);

  const row = Array.isArray(data) ? data[0] : data;
  if (
    !row ||
    typeof row.purchase_active !== "boolean" ||
    typeof row.access_granted !== "boolean" ||
    !["active", "refunded", "revoked"].includes(row.canonical_status) ||
    typeof row.account_rebound !== "boolean"
  ) {
    throw new Error("Apple purchase ledger returned an invalid result");
  }

  return {
    purchaseActive: row.purchase_active,
    accessGranted: row.access_granted,
    canonicalStatus: row.canonical_status as ApplePurchaseStatus,
    accountRebound: row.account_rebound,
  };
}

export async function getApplePurchaseBinding(
  originalTransactionId: string,
): Promise<
  | { kind: "unseen" }
  | { kind: "orphaned" }
  | { kind: "live"; userId: string }
> {
  const { data, error } = await getServiceClient()
    .from("apple_iap_purchases")
    .select("user_id")
    .eq("original_transaction_id", originalTransactionId)
    .maybeSingle();
  if (error) throw new Error(`Apple purchase owner lookup failed: ${error.message}`);
  if (!data) return { kind: "unseen" };
  return typeof data.user_id === "string"
    ? { kind: "live", userId: data.user_id.toLowerCase() }
    : { kind: "orphaned" };
}

export async function claimAppleNotification(input: {
  notificationUuid: string;
  notificationType: string;
  subtype: string | null;
  environment: string | null;
  signedDate: string | null;
}): Promise<"acquired" | "busy" | "processed"> {
  const { data, error } = await getServiceClient().rpc(
    "claim_apple_iap_notification",
    {
      p_notification_uuid: input.notificationUuid,
      p_notification_type: input.notificationType,
      p_subtype: input.subtype,
      p_environment: input.environment,
      p_signed_date: input.signedDate,
    },
  );
  if (error) throw new Error(`Apple notification claim failed: ${error.message}`);
  if (data !== "acquired" && data !== "busy" && data !== "processed") {
    throw new Error("Apple notification claim returned an invalid result");
  }
  return data;
}

export async function finishAppleNotification(input: {
  notificationUuid: string;
  status: "processed" | "failed";
  originalTransactionId: string | null;
  error: string | null;
}): Promise<void> {
  const { data, error } = await getServiceClient().rpc(
    "finish_apple_iap_notification",
    {
      p_notification_uuid: input.notificationUuid,
      p_status: input.status,
      p_original_transaction_id: input.originalTransactionId,
      p_last_error: input.error,
    },
  );
  if (error || data !== true) {
    throw new Error(
      `Apple notification completion failed: ${error?.message ?? "not updated"}`,
    );
  }
}
