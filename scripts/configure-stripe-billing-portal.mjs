#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import process from "node:process";
import Stripe from "stripe";
import ts from "typescript";

const ROOT = resolve(dirname(new URL(import.meta.url).pathname), "..");

function loadPolicy() {
  const filename = join(ROOT, "lib/billing-portal-policy.ts");
  const output = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
    fileName: filename,
  }).outputText;
  const compiledModule = { exports: {} };
  const evaluate = new Function("require", "module", "exports", output);
  evaluate(
    (specifier) => {
      if (specifier === "server-only") return {};
      throw new Error(`billing portal policy imported ${specifier}`);
    },
    compiledModule,
    compiledModule.exports,
  );
  return compiledModule.exports;
}

async function assertPublicLegalPage(url) {
  const response = await fetch(url, { redirect: "follow" });
  const finalUrl = new URL(response.url);
  if (
    !response.ok ||
    finalUrl.protocol !== "https:" ||
    (finalUrl.hostname !== "verzatv.com" &&
      finalUrl.hostname !== "www.verzatv.com") ||
    !response.headers.get("content-type")?.includes("text/html")
  ) {
    throw new Error(`Public legal page is unavailable: ${url}`);
  }
}

const secretKey = process.env.STRIPE_SECRET_KEY ?? "";
if (!/^(?:sk|rk)_(?:test|live)_/.test(secretKey)) {
  throw new Error("STRIPE_SECRET_KEY is missing or invalid");
}
const liveMode = /^(?:sk|rk)_live_/.test(secretKey);
const policy = loadPolicy();
const stripe = new Stripe(secretKey);

if (process.argv.includes("--apply")) {
  if (!process.argv.includes("--confirm-live") || !liveMode) {
    throw new Error(
      "Creation requires a live key and explicit --apply --confirm-live",
    );
  }
  if (process.env.STRIPE_PUBLIC_DETAILS_TOS_READY !== "true") {
    throw new Error(
      "Set STRIPE_PUBLIC_DETAILS_TOS_READY=true only after Stripe Public details has the production Terms URL",
    );
  }
  await Promise.all([
    assertPublicLegalPage(policy.BILLING_PORTAL_TERMS_URL),
    assertPublicLegalPage(policy.BILLING_PORTAL_PRIVACY_URL),
  ]);

  const configurations = [];
  for await (const configuration of stripe.billingPortal.configurations.list({
    active: true,
    limit: 100,
  })) {
    configurations.push(configuration);
  }
  const managed = configurations.filter(
    (configuration) => configuration.metadata?.policy === "verza-vip-v1",
  );
  if (managed.length > 1) {
    throw new Error("More than one active VERZA portal configuration exists");
  }
  if (managed.length === 1) {
    policy.assertCanonicalBillingPortalConfiguration(
      managed[0],
      managed[0].id,
      true,
    );
    console.log(
      `Canonical portal already exists. Set STRIPE_BILLING_PORTAL_CONFIGURATION_ID=${managed[0].id}`,
    );
  } else {
    const created = await stripe.billingPortal.configurations.create(
      policy.CANONICAL_BILLING_PORTAL_CONFIGURATION,
    );
    policy.assertCanonicalBillingPortalConfiguration(
      created,
      created.id,
      true,
    );
    console.log(
      `Created canonical portal. Set STRIPE_BILLING_PORTAL_CONFIGURATION_ID=${created.id}`,
    );
  }
} else {
  const configurationId = policy.stripeBillingPortalConfigurationId();
  const configuration = await stripe.billingPortal.configurations.retrieve(
    configurationId,
  );
  policy.assertCanonicalBillingPortalConfiguration(
    configuration,
    configurationId,
    liveMode,
  );
  console.log(`Stripe Billing Portal configuration: PASS (${configuration.id})`);
}
