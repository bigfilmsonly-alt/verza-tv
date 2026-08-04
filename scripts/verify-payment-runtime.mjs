#!/usr/bin/env node

import assert from "node:assert/strict";
import process from "node:process";

let requireAuth = false;
let expectedSeriesCheckoutMode = null;
for (const arg of process.argv.slice(2)) {
  if (arg === "--require-auth") {
    if (requireAuth) throw new Error("Duplicate --require-auth argument");
    requireAuth = true;
    continue;
  }
  if (arg.startsWith("--expect-series-checkout=")) {
    if (expectedSeriesCheckoutMode !== null) {
      throw new Error("Duplicate --expect-series-checkout argument");
    }
    expectedSeriesCheckoutMode = arg.slice(
      "--expect-series-checkout=".length,
    );
    if (
      expectedSeriesCheckoutMode !== "compatibility" &&
      expectedSeriesCheckoutMode !== "required"
    ) {
      throw new Error(
        "--expect-series-checkout must be compatibility or required",
      );
    }
    continue;
  }
  throw new Error(`Unsupported argument: ${arg}`);
}
if (requireAuth && expectedSeriesCheckoutMode === null) {
  throw new Error(
    "--require-auth also requires --expect-series-checkout=compatibility or required",
  );
}
if (!requireAuth && expectedSeriesCheckoutMode !== null) {
  throw new Error("--expect-series-checkout requires --require-auth");
}

const configuredBase =
  process.env.PAYMENT_RUNTIME_BASE_URL?.trim() || "https://www.verzatv.com";
const baseUrl = new URL(configuredBase);
if (
  baseUrl.protocol !== "https:" ||
  !["verzatv.com", "www.verzatv.com"].includes(baseUrl.hostname) ||
  baseUrl.username ||
  baseUrl.password ||
  (baseUrl.port && baseUrl.port !== "443") ||
  baseUrl.pathname !== "/" ||
  baseUrl.search ||
  baseUrl.hash
) {
  throw new Error("PAYMENT_RUNTIME_BASE_URL must be a canonical Verza HTTPS origin");
}

function assertCanonicalResponse(response, expectedPath) {
  const finalUrl = new URL(response.url);
  assert.equal(finalUrl.protocol, "https:");
  assert.ok(
    finalUrl.hostname === "verzatv.com" || finalUrl.hostname === "www.verzatv.com",
    `unexpected response host for ${expectedPath}`,
  );
  assert.equal(finalUrl.pathname, expectedPath);
}

function assertPrivatePaymentHeaders(response) {
  const cacheControl = (response.headers.get("cache-control") ?? "").toLowerCase();
  assert.match(cacheControl, /(?:^|,)\s*private(?:\s|,|$)/);
  assert.match(cacheControl, /(?:^|,)\s*no-store(?:\s|,|$)/);
  const vary = new Set(
    (response.headers.get("vary") ?? "")
      .toLowerCase()
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  );
  assert.ok(vary.has("authorization"), "payment response must vary on Authorization");
  assert.ok(vary.has("cookie"), "payment response must vary on Cookie");
}

async function get(path, headers = undefined) {
  return fetch(new URL(path, baseUrl), {
    method: "GET",
    redirect: "follow",
    cache: "no-store",
    ...(headers ? { headers } : {}),
  });
}

const publicPages = [
  {
    path: "/terms",
    fragments: ["August 3, 2026", "support@verzatv.com"],
  },
  {
    path: "/privacy",
    fragments: ["August 3, 2026", "VERZA TV"],
  },
  {
    path: "/refund-policy",
    fragments: ["August 3, 2026", "support@verzatv.com"],
  },
  {
    path: "/support",
    fragments: ["support@verzatv.com", "Series Unlocks"],
  },
];

for (const { path, fragments } of publicPages) {
  const response = await get(path);
  assertCanonicalResponse(response, path);
  assert.equal(response.status, 200, `${path} returned HTTP ${response.status}`);
  const body = await response.text();
  for (const fragment of fragments) {
    assert.ok(body.includes(fragment), `${path} is missing release marker: ${fragment}`);
  }
}
console.log("payment runtime public pages: PASS (Terms/Privacy/Refund/Support)");

const capabilitiesPath = "/api/payments/capabilities";
const unauthorized = await get(capabilitiesPath);
assertCanonicalResponse(unauthorized, capabilitiesPath);
assert.equal(
  unauthorized.status,
  401,
  `unauthenticated capabilities returned HTTP ${unauthorized.status}`,
);
assertPrivatePaymentHeaders(unauthorized);
assert.deepEqual(await unauthorized.json(), { error: "Unauthorized" });
console.log("payment runtime unauthenticated capabilities: PASS (401 + private cache)");

const accessToken = process.env.PAYMENT_CAPABILITIES_ACCESS_TOKEN?.trim() ?? "";
if (!requireAuth) {
  console.log("payment runtime authenticated capabilities: SKIP (public-only gate)");
} else {
  if (!accessToken) {
    throw new Error(
      "PAYMENT_CAPABILITIES_ACCESS_TOKEN is required for the authenticated release gate",
    );
  }
  if (!/^[^.\s]+\.[^.\s]+\.[^.\s]+$/.test(accessToken)) {
    throw new Error("PAYMENT_CAPABILITIES_ACCESS_TOKEN must be a Supabase JWT");
  }
  const authenticated = await get(capabilitiesPath, {
    authorization: `Bearer ${accessToken}`,
  });
  assertCanonicalResponse(authenticated, capabilitiesPath);
  assert.equal(
    authenticated.status,
    200,
    `authenticated capabilities returned HTTP ${authenticated.status}`,
  );
  assertPrivatePaymentHeaders(authenticated);
  const capabilities = await authenticated.json();
  assert.deepEqual(capabilities, {
    seriesUnlock: {
      checkoutConfigured: true,
      livemode: true,
      consentMode: expectedSeriesCheckoutMode,
    },
    vip: {
      monthlyCheckoutEnabled: false,
      yearlyCheckoutEnabled: false,
    },
  });
  console.log(
    `payment runtime authenticated capabilities: PASS (Series ${expectedSeriesCheckoutMode}; monthly + yearly VIP disabled)`,
  );
}
