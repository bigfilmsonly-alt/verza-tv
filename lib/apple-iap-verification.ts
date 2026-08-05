import "server-only";

import { createHash } from "node:crypto";
import {
  Environment,
  InAppOwnershipType,
  SignedDataVerifier,
  TransactionReason,
  Type,
  type JWSTransactionDecodedPayload,
  type ResponseBodyV2DecodedPayload,
} from "@apple/app-store-server-library";
import { APPLE_IAP_ROOT_CERTIFICATES } from "@/lib/apple-iap-root-certificates";
import { seriesSlugForAppleProductId } from "@/lib/apple-iap-products";

export const APPLE_BUNDLE_ID = "com.verzatv.app";
export const APPLE_APP_ID = 6752884623;

const ID_PATTERN = /^[0-9]{1,64}$/;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const productionVerifier = new SignedDataVerifier(
  APPLE_IAP_ROOT_CERTIFICATES,
  true,
  Environment.PRODUCTION,
  APPLE_BUNDLE_ID,
  APPLE_APP_ID,
);
const sandboxVerifier = new SignedDataVerifier(
  APPLE_IAP_ROOT_CERTIFICATES,
  true,
  Environment.SANDBOX,
  APPLE_BUNDLE_ID,
);

export interface CanonicalAppleTransaction {
  transactionId: string;
  originalTransactionId: string;
  userId: string;
  productId: string;
  seriesSlug: string;
  environment: Environment.PRODUCTION | Environment.SANDBOX;
  purchaseDate: string;
  signedDate: string;
  revocationDate: string | null;
  priceMilliunits: number | null;
  currency: string | null;
  signedTransactionSha256: string;
}

function isoFromAppleMilliseconds(value: number | undefined, field: string): string {
  if (!Number.isSafeInteger(value) || (value ?? 0) <= 0) {
    throw new Error(`Apple transaction is missing ${field}`);
  }
  const date = new Date(value!);
  if (!Number.isFinite(date.valueOf())) {
    throw new Error(`Apple transaction has invalid ${field}`);
  }
  return date.toISOString();
}

async function verifyWithEitherEnvironment<T>(
  production: () => Promise<T>,
  sandbox: () => Promise<T>,
): Promise<T> {
  try {
    return await production();
  } catch (productionError) {
    try {
      return await sandbox();
    } catch {
      throw productionError;
    }
  }
}

export async function verifyAppleSignedTransaction(
  signedTransaction: string,
): Promise<JWSTransactionDecodedPayload> {
  return verifyWithEitherEnvironment(
    () => productionVerifier.verifyAndDecodeTransaction(signedTransaction),
    () => sandboxVerifier.verifyAndDecodeTransaction(signedTransaction),
  );
}

export async function verifyAppleSignedNotification(
  signedPayload: string,
): Promise<ResponseBodyV2DecodedPayload> {
  return verifyWithEitherEnvironment(
    () => productionVerifier.verifyAndDecodeNotification(signedPayload),
    () => sandboxVerifier.verifyAndDecodeNotification(signedPayload),
  );
}

export function normalizeAppleTransaction(
  transaction: JWSTransactionDecodedPayload,
  signedTransaction: string,
): CanonicalAppleTransaction {
  const transactionId = transaction.transactionId ?? "";
  const originalTransactionId = transaction.originalTransactionId ?? "";
  const productId = transaction.productId ?? "";
  const userId = (transaction.appAccountToken ?? "").toLowerCase();
  const seriesSlug = seriesSlugForAppleProductId(productId);

  if (!ID_PATTERN.test(transactionId) || !ID_PATTERN.test(originalTransactionId)) {
    throw new Error("Apple transaction identifiers are invalid");
  }
  if (!seriesSlug) throw new Error("Apple product is not a canonical series unlock");
  if (!UUID_PATTERN.test(userId)) {
    throw new Error("Apple transaction is missing a valid app account token");
  }
  if (transaction.type !== Type.NON_CONSUMABLE) {
    throw new Error("Apple product is not a non-consumable");
  }
  if (transaction.quantity !== undefined && transaction.quantity !== 1) {
    throw new Error("Apple series unlock quantity must be one");
  }
  if (
    transaction.inAppOwnershipType !== undefined &&
    transaction.inAppOwnershipType !== InAppOwnershipType.PURCHASED
  ) {
    throw new Error("Family-shared Apple purchases are not enabled");
  }
  if (
    transaction.transactionReason !== undefined &&
    transaction.transactionReason !== TransactionReason.PURCHASE
  ) {
    throw new Error("Apple series unlock has an invalid transaction reason");
  }
  if (
    transaction.environment !== Environment.PRODUCTION &&
    transaction.environment !== Environment.SANDBOX
  ) {
    throw new Error("Apple transaction environment is not accepted");
  }

  let priceMilliunits: number | null = null;
  if (transaction.price !== undefined) {
    if (!Number.isSafeInteger(transaction.price) || transaction.price < 0) {
      throw new Error("Apple transaction price is invalid");
    }
    priceMilliunits = transaction.price;
  }

  let currency: string | null = null;
  if (transaction.currency !== undefined) {
    const normalized = transaction.currency.toLowerCase();
    if (!/^[a-z]{3}$/.test(normalized)) {
      throw new Error("Apple transaction currency is invalid");
    }
    currency = normalized;
  }
  if ((priceMilliunits === null) !== (currency === null)) {
    throw new Error("Apple transaction price and currency must travel together");
  }

  const revocationDate =
    transaction.revocationDate === undefined
      ? null
      : isoFromAppleMilliseconds(transaction.revocationDate, "revocationDate");

  return {
    transactionId,
    originalTransactionId,
    userId,
    productId,
    seriesSlug,
    environment: transaction.environment,
    purchaseDate: isoFromAppleMilliseconds(transaction.purchaseDate, "purchaseDate"),
    signedDate: isoFromAppleMilliseconds(transaction.signedDate, "signedDate"),
    revocationDate,
    priceMilliunits,
    currency,
    signedTransactionSha256: createHash("sha256")
      .update(signedTransaction)
      .digest("hex"),
  };
}

export function appleIapEnabled(): boolean {
  return process.env.APPLE_IAP_ENABLED === "true";
}

export function appleSandboxUserAllowed(userId: string): boolean {
  return (process.env.APPLE_IAP_SANDBOX_ALLOWED_USER_IDS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)
    .includes(userId.toLowerCase());
}
