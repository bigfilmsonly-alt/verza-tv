#!/usr/bin/env node

/** Focused fail-closed contract for the creator Mux webhook. */

import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import Mux from "@mux/mux-node";

const root = resolve(import.meta.dirname, "..");
const route = await readFile(
  resolve(root, "app/api/mux/webhook/route.ts"),
  "utf8",
);

assert.match(
  route,
  /process\.env\.MUX_WEBHOOK_SECRET\?\.trim\(\)/,
  "Mux webhook secret must reject missing and whitespace-only configuration",
);
assert.match(
  route,
  /Webhook verification unavailable[\s\S]{0,100}status:\s*503/,
  "missing Mux webhook verification must return a non-2xx configuration error",
);
assert.match(
  route,
  /event\s*=\s*await mux\.webhooks\.unwrap\(/,
  "Mux SDK signature verification must be awaited",
);
assert.doesNotMatch(
  route,
  /JSON\.parse\(body\)/,
  "Mux webhook must not contain an unsigned JSON fallback",
);
assert.match(
  route,
  /signature verification failed[\s\S]{0,120}status:\s*400/,
  "invalid Mux signatures must return non-2xx",
);
assert.match(
  route,
  /processing failed; provider should retry[\s\S]{0,140}status:\s*500/,
  "Mux processing failures must ask the provider to retry with non-2xx",
);

const checkedDatabaseErrors = route.match(/if \(error\) throw new Error\(/g) ?? [];
assert.ok(
  checkedDatabaseErrors.length >= 6,
  "every creator-content lookup/update path must check Supabase errors",
);

// Exercise the exact Mux SDK verification primitive used by the route without
// touching a provider or database. These are synthetic non-secret values.
const testSecret = "mux_webhook_contract_test_secret";
const body = JSON.stringify({ type: "video.asset.created", data: { id: "test" } });
const timestamp = Math.floor(Date.now() / 1000);
const signature = createHmac("sha256", testSecret)
  .update(`${timestamp}.${body}`)
  .digest("hex");
const mux = new Mux({ webhookSecret: testSecret });

await assert.rejects(
  mux.webhooks.unwrap(body, {}, testSecret),
  /mux-signature/i,
  "missing signature must be rejected",
);
await assert.rejects(
  mux.webhooks.unwrap(
    body,
    { "mux-signature": `t=${timestamp},v1=invalid` },
    testSecret,
  ),
  /matching the expected signature/i,
  "invalid signature must be rejected",
);
const verified = await mux.webhooks.unwrap(
  body,
  { "mux-signature": `t=${timestamp},v1=${signature}` },
  testSecret,
);
assert.equal(verified.type, "video.asset.created");

console.log("Mux webhook security contract: PASS");
