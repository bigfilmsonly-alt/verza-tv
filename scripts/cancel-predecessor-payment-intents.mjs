#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import process from "node:process";
import Stripe from "stripe";

const EXPECTED_COUNT = 41;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PRODUCT_ORDERS = new Map([
  ["Product order: VerzaTV Champion tie-dye hoodie", 9000],
  ["Product order: VerzaTV Men's Premium Tee", 3200],
]);

const secretKey = process.env.STRIPE_SECRET_KEY ?? "";
if (!/^(?:sk|rk)_live_/.test(secretKey)) {
  throw new Error("A live-mode Stripe key is required");
}
const preflightOnly = process.argv.includes("--preflight-only");
const apply =
  process.argv.includes("--apply") &&
  process.argv.includes("--confirm-live") &&
  process.argv.includes(`--expected-count=${EXPECTED_COUNT}`);
if (!preflightOnly && !apply) {
  throw new Error(
    `Cancellation requires --apply --confirm-live --expected-count=${EXPECTED_COUNT}`,
  );
}

const rootCommits = execFileSync(
  "git",
  ["rev-list", "--max-parents=0", "HEAD"],
  { encoding: "utf8" },
)
  .trim()
  .split(/\s+/)
  .filter(Boolean);
if (rootCommits.length === 0) throw new Error("Could not resolve repository root commit");
const repositoryStart = Math.min(
  ...rootCommits.map((commit) =>
    Number(
      execFileSync("git", ["show", "-s", "--format=%ct", commit], {
        encoding: "utf8",
      }).trim(),
    ),
  ),
);
if (!Number.isSafeInteger(repositoryStart) || repositoryStart <= 0) {
  throw new Error("Repository start time is invalid");
}

const stripe = new Stripe(secretKey);

async function collect(iterator) {
  const rows = [];
  for await (const row of iterator) rows.push(row);
  return rows;
}

function exactKeys(metadata, expected) {
  const actual = Object.keys(metadata ?? {}).sort();
  return (
    actual.length === expected.length &&
    actual.every((key, index) => key === expected[index])
  );
}

function classify(intent) {
  if (
    intent.amount === 499 &&
    intent.currency === "usd" &&
    exactKeys(intent.metadata, ["show_id", "user_id"]) &&
    UUID.test(intent.metadata.show_id) &&
    UUID.test(intent.metadata.user_id) &&
    /^Unlock Show: \S/.test(intent.description ?? "")
  ) {
    return "predecessor_show_unlock";
  }

  if (
    intent.currency === "usd" &&
    exactKeys(intent.metadata, ["type", "user_id"]) &&
    intent.metadata.type === "product_order" &&
    UUID.test(intent.metadata.user_id) &&
    PRODUCT_ORDERS.get(intent.description ?? "") === intent.amount
  ) {
    return "predecessor_product_order";
  }

  return null;
}

function assertIntentPreconditions(intent) {
  const family = classify(intent);
  if (
    !family ||
    intent.status !== "requires_payment_method" ||
    intent.created >= repositoryStart ||
    intent.amount_received !== 0 ||
    intent.amount_capturable !== 0 ||
    intent.customer != null ||
    intent.invoice != null ||
    intent.transfer_data != null ||
    intent.transfer_group != null
  ) {
    throw new Error("A predecessor PaymentIntent failed its safety preconditions");
  }
  return family;
}

async function assertNoSuccessfulCharge(intent) {
  const charges = await collect(
    stripe.charges.list({ payment_intent: intent.id, limit: 100 }),
  );
  for (const charge of charges) {
    if (
      charge.status !== "failed" ||
      charge.paid ||
      charge.balance_transaction != null ||
      charge.amount_refunded !== 0 ||
      charge.disputed
    ) {
      throw new Error(
        "A predecessor PaymentIntent has a non-failed, paid, funded, refunded, or disputed Charge",
      );
    }
  }
  return charges.length;
}

const allIntents = await collect(stripe.paymentIntents.list({ limit: 100 }));
const candidates = allIntents.filter(
  (intent) =>
    intent.status === "requires_payment_method" &&
    intent.created < repositoryStart,
);
if (candidates.length !== EXPECTED_COUNT) {
  throw new Error(
    `Expected ${EXPECTED_COUNT} predecessor PaymentIntents; found ${candidates.length}`,
  );
}

const preflight = [];
for (const intent of candidates) {
  const family = assertIntentPreconditions(intent);
  const failedChargeCount = await assertNoSuccessfulCharge(intent);
  preflight.push({ intent, family, failedChargeCount });
}

const familyCounts = preflight.reduce((result, row) => {
  result[row.family] = (result[row.family] ?? 0) + 1;
  return result;
}, {});
const amountCounts = preflight.reduce((result, row) => {
  const key = `usd:${row.intent.amount}`;
  result[key] = (result[key] ?? 0) + 1;
  return result;
}, {});
const failedChargeCount = preflight.reduce(
  (total, row) => total + row.failedChargeCount,
  0,
);
if (
  familyCounts.predecessor_show_unlock !== 38 ||
  familyCounts.predecessor_product_order !== 3 ||
  amountCounts["usd:499"] !== 38 ||
  amountCounts["usd:9000"] !== 2 ||
  amountCounts["usd:3200"] !== 1 ||
  failedChargeCount !== 3
) {
  throw new Error(
    `Predecessor PaymentIntent aggregate did not match the audit: ${JSON.stringify({ familyCounts, amountCounts, failedChargeCount })}`,
  );
}

if (preflightOnly) {
  console.log(
    JSON.stringify(
      {
        preflight: "PASS",
        repositoryStart: new Date(repositoryStart * 1000).toISOString(),
        candidates: preflight.length,
        families: familyCounts,
        amounts: amountCounts,
        intentsWithFailedUnpaidCharges: failedChargeCount,
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

let cancelled = 0;
for (const row of preflight) {
  const current = await stripe.paymentIntents.retrieve(row.intent.id);
  assertIntentPreconditions(current);
  await assertNoSuccessfulCharge(current);

  const result = await stripe.paymentIntents.cancel(current.id, {
    cancellation_reason: "abandoned",
  });
  if (
    result.status !== "canceled" ||
    result.cancellation_reason !== "abandoned" ||
    result.amount_received !== 0
  ) {
    throw new Error("Stripe did not confirm a safe abandoned cancellation");
  }
  cancelled += 1;
}

if (cancelled !== EXPECTED_COUNT) {
  throw new Error(`Cancelled ${cancelled}; expected ${EXPECTED_COUNT}`);
}

const after = await collect(stripe.paymentIntents.list({ limit: 100 }));
const remainingConfirmablePredecessor = after.filter(
  (intent) =>
    intent.status === "requires_payment_method" &&
    intent.created < repositoryStart,
);
const safelyCancelled = after.filter(
  (intent) =>
    intent.status === "canceled" &&
    intent.cancellation_reason === "abandoned" &&
    intent.created < repositoryStart &&
    classify(intent),
);
if (
  remainingConfirmablePredecessor.length !== 0 ||
  safelyCancelled.length !== EXPECTED_COUNT
) {
  throw new Error("Post-cancellation Stripe readback did not match the target set");
}

console.log(
  JSON.stringify(
    {
      repositoryStart: new Date(repositoryStart * 1000).toISOString(),
      cancellationReason: "abandoned",
      cancelled,
      families: familyCounts,
      amounts: amountCounts,
      intentsWithFailedUnpaidCharges: failedChargeCount,
      remainingConfirmablePredecessor: 0,
      succeededIntentsUnchanged: after.filter(
        (intent) => intent.status === "succeeded",
      ).length,
    },
    null,
    2,
  ),
);
