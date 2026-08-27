#!/usr/bin/env node

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import ts from "typescript";

// fileURLToPath, not .pathname: a file:// pathname percent-encodes spaces, so
// any checkout under a directory with a space (e.g. "E! CREATOR ECONOMY")
// resolved to "E!%20CREATOR%20ECONOMY" and every readFileSync ENOENT'd.
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function loadTypeScriptModule(relativePath, requireMap = {}) {
  const filename = join(ROOT, relativePath);
  const source = readFileSync(filename, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
    fileName: filename,
  }).outputText;
  const compiledModule = { exports: {} };
  const localRequire = (specifier) => {
    if (specifier === "server-only") return {};
    if (Object.hasOwn(requireMap, specifier)) return requireMap[specifier];
    throw new Error(`${relativePath} imported unexpected module ${specifier}`);
  };
  // The selected modules contain pure product/financial policy. Evaluating the
  // compiler output lets this test exercise the production implementation
  // without adding a second TypeScript runner to the application dependency set.
  const evaluate = new Function("require", "module", "exports", output);
  evaluate(localRequire, compiledModule, compiledModule.exports);
  return compiledModule.exports;
}

function checkoutSession({ subtotal, tax = 0, automaticTax = tax > 0 }) {
  return {
    currency: "usd",
    amount_subtotal: subtotal,
    amount_total: subtotal + tax,
    total_details: {
      amount_discount: 0,
      amount_shipping: 0,
      amount_tax: tax,
    },
    automatic_tax: {
      enabled: automaticTax,
      status: automaticTax ? "complete" : null,
    },
  };
}

function runCodeAndCatalogSuite() {
  const privateResponse = loadTypeScriptModule("lib/private-json.ts");
  const stripeTax = loadTypeScriptModule("lib/stripe-tax.ts");
  const billingPortalPolicy = loadTypeScriptModule(
    "lib/billing-portal-policy.ts",
  );
  const checkoutConsent = loadTypeScriptModule(
    "lib/stripe-checkout-consent.ts",
  );
  const appleSandboxPolicy = loadTypeScriptModule(
    "lib/apple-iap-sandbox-policy.ts",
  );
  const vipReleasePolicy = loadTypeScriptModule("lib/vip-release-policy.ts");
  assert.equal(checkoutConsent.STRIPE_CHECKOUT_TERMS_VERSION, "2026-08-03");
  const vipSubscriptionState = loadTypeScriptModule(
    "lib/vip-subscription-state.ts",
  );
  const stripeWebhookEvents = loadTypeScriptModule(
    "lib/stripe-webhook-events.ts",
  );
  const mux = loadTypeScriptModule("lib/mux-map.ts");
  const publicMux = loadTypeScriptModule("lib/mux-public-map.ts");
  const catalogModule = loadTypeScriptModule("lib/catalog.ts", {
    "./mux-public-map": publicMux,
  });
  const seriesPurchase = loadTypeScriptModule("lib/series-purchase.ts", {
    "@/lib/stripe-tax": stripeTax,
  });
  const config = loadTypeScriptModule("lib/config.ts");

  const ownerSandboxUserId = "11111111-1111-4111-8111-111111111111";
  const reviewSandboxUserId = "22222222-2222-4222-8222-222222222222";
  const sandboxAllowlistEnvNames = [
    "APPLE_IAP_SANDBOX_ALLOWED_USER_IDS",
    "APPLE_IAP_SANDBOX_REVIEW_ALLOWED_USER_IDS",
  ];
  const originalSandboxAllowlistEnv = Object.fromEntries(
    sandboxAllowlistEnvNames.map((name) => [name, process.env[name]]),
  );
  try {
    for (const name of sandboxAllowlistEnvNames) delete process.env[name];
    assert.equal(appleSandboxPolicy.appleSandboxUserAllowed(ownerSandboxUserId), false);

    process.env.APPLE_IAP_SANDBOX_ALLOWED_USER_IDS = ownerSandboxUserId;
    assert.equal(appleSandboxPolicy.appleSandboxUserAllowed(ownerSandboxUserId), true);
    assert.equal(appleSandboxPolicy.appleSandboxUserAllowed(reviewSandboxUserId), false);

    process.env.APPLE_IAP_SANDBOX_REVIEW_ALLOWED_USER_IDS =
      reviewSandboxUserId.toUpperCase();
    assert.equal(appleSandboxPolicy.appleSandboxUserAllowed(ownerSandboxUserId), true);
    assert.equal(appleSandboxPolicy.appleSandboxUserAllowed(reviewSandboxUserId), true);
    assert.equal(
      appleSandboxPolicy.appleSandboxUserAllowed(reviewSandboxUserId.toUpperCase()),
      true,
    );
    assert.equal(appleSandboxPolicy.appleSandboxUserAllowed("not-a-uuid"), false);

    process.env.APPLE_IAP_SANDBOX_REVIEW_ALLOWED_USER_IDS =
      `${reviewSandboxUserId},invalid`;
    assert.equal(appleSandboxPolicy.appleSandboxUserAllowed(ownerSandboxUserId), false);
    assert.equal(appleSandboxPolicy.appleSandboxUserAllowed(reviewSandboxUserId), false);

    process.env.APPLE_IAP_SANDBOX_REVIEW_ALLOWED_USER_IDS = reviewSandboxUserId;
    process.env.APPLE_IAP_SANDBOX_ALLOWED_USER_IDS = `${ownerSandboxUserId},`;
    assert.equal(appleSandboxPolicy.appleSandboxUserAllowed(ownerSandboxUserId), false);
    assert.equal(appleSandboxPolicy.appleSandboxUserAllowed(reviewSandboxUserId), false);
  } finally {
    for (const name of sandboxAllowlistEnvNames) {
      const value = originalSandboxAllowlistEnv[name];
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }

  const mergedPrivateResponse = privateResponse.privateJson(
    { ok: true },
    {
      status: 202,
      headers: {
        Vary: "Accept-Encoding, accept-encoding, authorization, COOKIE",
        "X-Verza-Test": "preserved",
      },
    },
  );
  assert.equal(mergedPrivateResponse.status, 202);
  assert.equal(
    mergedPrivateResponse.headers.get("cache-control"),
    "private, no-store, max-age=0",
  );
  assert.equal(
    mergedPrivateResponse.headers.get("vary"),
    "Accept-Encoding, authorization, COOKIE",
  );
  assert.equal(mergedPrivateResponse.headers.get("x-verza-test"), "preserved");
  assert.equal(
    privateResponse.privateJson({ ok: true }).headers.get("vary"),
    "Authorization, Cookie",
  );
  assert.equal(
    privateResponse.privateJson(
      { ok: true },
      { headers: { Vary: "X-Push-Api-Key" } },
    ).headers.get("vary"),
    "X-Push-Api-Key, Authorization, Cookie",
  );
  assert.equal(
    privateResponse.privateJson(
      { ok: true },
      { headers: { Vary: "*" } },
    ).headers.get("vary"),
    "*",
  );

  assert.equal(stripeTax.SERIES_UNLOCK_TAX_CODE, "txcd_10402000");
  assert.equal(stripeTax.VIP_SUBSCRIPTION_TAX_CODE, "txcd_10402200");
  assert.equal(
    billingPortalPolicy.canonicalBillingPortalReturnUrl("https://verzatv.com/path"),
    "https://verzatv.com/me",
  );
  assert.throws(() =>
    billingPortalPolicy.canonicalBillingPortalReturnUrl("http://verzatv.com"),
  );
  assert.throws(() =>
    billingPortalPolicy.canonicalBillingPortalReturnUrl("https://example.com"),
  );
  const ownedCustomer = {
    id: "cus_owned",
    livemode: true,
    metadata: { userId: "user_owned" },
  };
  billingPortalPolicy.assertOwnedLiveStripeCustomer(
    ownedCustomer,
    "cus_owned",
    "user_owned",
    true,
  );
  assert.throws(() =>
    billingPortalPolicy.assertOwnedLiveStripeCustomer(
      ownedCustomer,
      "cus_stale",
      "user_owned",
      true,
    ),
  );
  assert.throws(() =>
    billingPortalPolicy.assertOwnedLiveStripeCustomer(
      ownedCustomer,
      "cus_owned",
      "user_other",
      true,
    ),
  );
  assert.throws(() =>
    billingPortalPolicy.assertOwnedLiveStripeCustomer(
      { id: "cus_owned", deleted: true },
      "cus_owned",
      "user_owned",
      true,
    ),
  );
  assert.throws(() =>
    billingPortalPolicy.assertOwnedLiveStripeCustomer(
      ownedCustomer,
      "cus_owned",
      "user_owned",
      false,
    ),
  );
  billingPortalPolicy.assertStripePortalUrl(
    "https://billing.stripe.com/p/session/test",
  );
  assert.throws(() =>
    billingPortalPolicy.assertStripePortalUrl("https://stripe.example.com/p/session/test"),
  );
  const portalConfiguration = {
    id: "bpc_canonical",
    active: true,
    livemode: true,
    business_profile: {
      headline: "Manage your VERZA VIP subscription and billing details.",
      privacy_policy_url: billingPortalPolicy.BILLING_PORTAL_PRIVACY_URL,
      terms_of_service_url: billingPortalPolicy.BILLING_PORTAL_TERMS_URL,
    },
    default_return_url: billingPortalPolicy.BILLING_PORTAL_DEFAULT_RETURN_URL,
    login_page: { enabled: false, url: null },
    metadata: { policy: "verza-vip-v1" },
    features: {
      customer_update: {
        enabled: true,
        allowed_updates: [...billingPortalPolicy.BILLING_PORTAL_ALLOWED_CUSTOMER_UPDATES],
      },
      invoice_history: { enabled: true },
      payment_method_update: {
        enabled: true,
        payment_method_configuration: null,
      },
      subscription_cancel: {
        enabled: true,
        mode: "at_period_end",
        proration_behavior: "none",
        cancellation_reason: {
          enabled: true,
          options: [...billingPortalPolicy.BILLING_PORTAL_CANCELLATION_REASONS],
        },
      },
      subscription_update: { enabled: false },
    },
  };
  billingPortalPolicy.assertCanonicalBillingPortalConfiguration(
    portalConfiguration,
    "bpc_canonical",
    true,
  );
  assert.throws(() =>
    billingPortalPolicy.assertCanonicalBillingPortalConfiguration(
      {
        ...portalConfiguration,
        features: {
          ...portalConfiguration.features,
          subscription_update: { enabled: true },
        },
      },
      "bpc_canonical",
      true,
    ),
  );
  const originalPortalId = process.env.STRIPE_BILLING_PORTAL_CONFIGURATION_ID;
  const originalTosFlag = process.env.STRIPE_CHECKOUT_TOS_CONSENT_REQUIRED;
  try {
    delete process.env.STRIPE_BILLING_PORTAL_CONFIGURATION_ID;
    assert.throws(() => billingPortalPolicy.stripeBillingPortalConfigurationId());
    process.env.STRIPE_BILLING_PORTAL_CONFIGURATION_ID = "bpc_canonical";
    assert.equal(
      billingPortalPolicy.stripeBillingPortalConfigurationId(),
      "bpc_canonical",
    );
    delete process.env.STRIPE_CHECKOUT_TOS_CONSENT_REQUIRED;
    assert.equal(checkoutConsent.stripeCheckoutConsentCollection(), undefined);
    assert.doesNotThrow(() =>
      checkoutConsent.assertStripeCheckoutConsentReady("sk_test_fixture"),
    );
    assert.deepEqual(
      checkoutConsent.stripeCheckoutConsentReadiness("sk_test_fixture"),
      {
        checkoutConfigured: true,
        livemode: false,
        consentMode: "compatibility",
      },
    );
    assert.deepEqual(
      checkoutConsent.stripeCheckoutConsentReadiness("sk_live_fixture"),
      {
        checkoutConfigured: false,
        livemode: true,
        consentMode: "unconfigured",
      },
    );
    assert.throws(() =>
      checkoutConsent.assertStripeCheckoutConsentReady("sk_live_fixture"),
    );

    process.env.STRIPE_CHECKOUT_TOS_CONSENT_REQUIRED = "false";
    assert.equal(checkoutConsent.stripeCheckoutTosConsentRequired(), false);
    assert.equal(checkoutConsent.stripeCheckoutConsentCollection(), undefined);
    assert.doesNotThrow(() =>
      checkoutConsent.assertStripeCheckoutConsentReady("sk_live_fixture"),
    );
    assert.deepEqual(
      checkoutConsent.stripeCheckoutConsentReadiness("sk_live_fixture"),
      {
        checkoutConfigured: true,
        livemode: true,
        consentMode: "compatibility",
      },
    );

    process.env.STRIPE_CHECKOUT_TOS_CONSENT_REQUIRED = "true";
    assert.equal(checkoutConsent.stripeCheckoutTosConsentRequired(), true);
    assert.deepEqual(checkoutConsent.stripeCheckoutConsentCollection(), {
      terms_of_service: "required",
    });
    assert.doesNotThrow(() =>
      checkoutConsent.assertStripeCheckoutConsentReady("sk_live_fixture"),
    );
    assert.deepEqual(
      checkoutConsent.stripeCheckoutConsentReadiness("sk_live_fixture"),
      {
        checkoutConfigured: true,
        livemode: true,
        consentMode: "required",
      },
    );
    assert.deepEqual(
      checkoutConsent.stripeCheckoutConsentReadiness("not_a_stripe_key"),
      {
        checkoutConfigured: false,
        livemode: false,
        consentMode: "unconfigured",
      },
    );
    assert.throws(() =>
      checkoutConsent.assertStripeCheckoutConsentReady("not_a_stripe_key"),
    );
    assert.equal(
      checkoutConsent.stripeCheckoutTermsConsentSatisfied({
        metadata: { tosConsentPolicy: "required" },
        consent: { terms_of_service: "accepted" },
      }),
      true,
    );
    assert.equal(
      checkoutConsent.stripeCheckoutTermsConsentSatisfied({
        metadata: { tosConsentPolicy: "required" },
        consent: null,
      }),
      false,
    );
    assert.equal(
      checkoutConsent.stripeCheckoutTermsConsentSatisfied({
        metadata: { tosConsentPolicy: "not_required" },
        consent: null,
      }),
      true,
      "completed compatibility sessions remain fulfillable after cutover",
    );
    process.env.STRIPE_CHECKOUT_TOS_CONSENT_REQUIRED = "TRUE";
    assert.throws(() => checkoutConsent.stripeCheckoutConsentCollection());
    assert.throws(() =>
      checkoutConsent.stripeCheckoutConsentReadiness("sk_live_fixture"),
    );
    assert.throws(() =>
      checkoutConsent.assertStripeCheckoutConsentReady("sk_live_fixture"),
    );
  } finally {
    if (originalPortalId === undefined) {
      delete process.env.STRIPE_BILLING_PORTAL_CONFIGURATION_ID;
    } else {
      process.env.STRIPE_BILLING_PORTAL_CONFIGURATION_ID = originalPortalId;
    }
    if (originalTosFlag === undefined) {
      delete process.env.STRIPE_CHECKOUT_TOS_CONSENT_REQUIRED;
    } else {
      process.env.STRIPE_CHECKOUT_TOS_CONSENT_REQUIRED = originalTosFlag;
    }
  }
  const releaseEnvNames = [
    "VIP_TRANSACTIONAL_NOTICES_ENABLED",
    "VIP_ANNUAL_RENEWAL_NOTICES_ENABLED",
    "VIP_YEARLY_CHECKOUT_ENABLED",
    "RESEND_API_KEY",
    "CRON_SECRET",
  ];
  const originalReleaseEnv = Object.fromEntries(
    releaseEnvNames.map((name) => [name, process.env[name]]),
  );
  try {
    for (const name of releaseEnvNames) delete process.env[name];
    assert.equal(vipReleasePolicy.vipSubscriptionCheckoutEnabled(), false);
    assert.equal(vipReleasePolicy.vipYearlyCheckoutEnabled(), false);
    assert.throws(() =>
      vipReleasePolicy.assertVipCheckoutReleaseReady("monthly"),
    );

    process.env.VIP_TRANSACTIONAL_NOTICES_ENABLED = "true";
    process.env.RESEND_API_KEY = "re_payment_test";
    assert.equal(vipReleasePolicy.vipSubscriptionCheckoutEnabled(), true);
    assert.doesNotThrow(() =>
      vipReleasePolicy.assertVipCheckoutReleaseReady("monthly"),
    );
    assert.equal(vipReleasePolicy.vipYearlyCheckoutEnabled(), false);
    assert.throws(() =>
      vipReleasePolicy.assertVipCheckoutReleaseReady("yearly"),
    );

    process.env.VIP_ANNUAL_RENEWAL_NOTICES_ENABLED = "true";
    process.env.VIP_YEARLY_CHECKOUT_ENABLED = "true";
    process.env.CRON_SECRET = "0123456789abcdef";
    assert.equal(vipReleasePolicy.vipAnnualNoticeDeliveryReady(), true);
    assert.equal(vipReleasePolicy.vipYearlyCheckoutEnabled(), true);
    assert.doesNotThrow(() =>
      vipReleasePolicy.assertVipCheckoutReleaseReady("yearly"),
    );

    process.env.VIP_YEARLY_CHECKOUT_ENABLED = "typo";
    assert.throws(() => vipReleasePolicy.vipYearlyCheckoutEnabled());
  } finally {
    for (const name of releaseEnvNames) {
      const value = originalReleaseEnv[name];
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
  const activeVip = vipSubscriptionState.deriveVipPaymentState(
    { id: "sub_current", status: "active", cancel_at_period_end: false },
    { stripeSubscriptionId: "sub_current", paymentBlocked: false },
  );
  assert.deepEqual(activeVip, {
    providerIsActive: true,
    sameSubscription: true,
    isVip: true,
    paymentBlocked: false,
    cancelAtPeriodEnd: false,
  });
  assert.equal(
    vipSubscriptionState.deriveVipPaymentState(
      { id: "sub_current", status: "active", cancel_at_period_end: true },
      { stripeSubscriptionId: "sub_current", paymentBlocked: false },
    ).cancelAtPeriodEnd,
    true,
    "scheduled cancellation must display access-through state",
  );
  assert.equal(
    vipSubscriptionState.deriveVipPaymentState(
      { id: "sub_current", status: "active", cancel_at_period_end: false },
      { stripeSubscriptionId: "sub_current", paymentBlocked: false },
    ).cancelAtPeriodEnd,
    false,
    "resumed subscription must return to renew state",
  );
  assert.equal(
    vipSubscriptionState.deriveVipPaymentState(
      { id: "sub_current", status: "canceled", cancel_at_period_end: false },
      { stripeSubscriptionId: "sub_current", paymentBlocked: false },
    ).isVip,
    false,
  );
  assert.equal(
    vipSubscriptionState.deriveVipPaymentState(
      { id: "sub_current", status: "trialing", cancel_at_period_end: false },
      { stripeSubscriptionId: "sub_current", paymentBlocked: false },
    ).isVip,
    true,
    "Stripe trialing is an active subscription state",
  );
  for (const status of [
    "incomplete",
    "incomplete_expired",
    "past_due",
    "paused",
    "unpaid",
  ]) {
    assert.equal(
      vipSubscriptionState.deriveVipPaymentState(
        { id: "sub_current", status, cancel_at_period_end: true },
        { stripeSubscriptionId: "sub_current", paymentBlocked: false },
      ).isVip,
      false,
      `${status} must not grant VIP access`,
    );
  }
  assert.equal(
    vipSubscriptionState.deriveVipPaymentState(
      { id: "sub_current", status: "active", cancel_at_period_end: false },
      { stripeSubscriptionId: "sub_current", paymentBlocked: true },
    ).isVip,
    false,
    "provider activity must not override an adverse payment block",
  );
  assert.deepEqual(
    vipSubscriptionState.deriveVipPaymentState(
      { id: "sub_new", status: "active", cancel_at_period_end: false },
      { stripeSubscriptionId: "sub_old", paymentBlocked: true },
    ),
    {
      providerIsActive: true,
      sameSubscription: false,
      isVip: true,
      paymentBlocked: false,
      cancelAtPeriodEnd: false,
    },
  );
  assert.deepEqual(
    stripeTax.canonicalCheckoutFinancials(checkoutSession({ subtotal: 199 }), 199),
    { subtotalCents: 199, taxCents: 0, totalCents: 199 },
  );
  assert.deepEqual(
    stripeTax.canonicalCheckoutFinancials(
      checkoutSession({ subtotal: 199, tax: 20 }),
      199,
    ),
    { subtotalCents: 199, taxCents: 20, totalCents: 219 },
  );
  assert.deepEqual(
    stripeTax.canonicalCheckoutFinancials(
      {
        currency: "usd",
        amount_subtotal: null,
        amount_total: 199,
        total_details: null,
        automatic_tax: { enabled: false, status: null },
      },
      199,
    ),
    { subtotalCents: 199, taxCents: 0, totalCents: 199 },
  );
  assert.throws(() =>
    stripeTax.canonicalCheckoutFinancials(
      {
        ...checkoutSession({ subtotal: 199, tax: 20 }),
        automatic_tax: { enabled: true, status: "requires_location_inputs" },
      },
      199,
    ),
  );
  assert.throws(() =>
    stripeTax.canonicalCheckoutFinancials(
      {
        ...checkoutSession({ subtotal: 199 }),
        total_details: {
          amount_discount: 1,
          amount_shipping: 0,
          amount_tax: 0,
        },
      },
      199,
    ),
  );
  assert.throws(() =>
    stripeTax.canonicalCheckoutFinancials(
      checkoutSession({ subtotal: 200, tax: 20 }),
      199,
    ),
  );

  assert.deepEqual(
    stripeTax.paidInvoiceFinancials({
      currency: "usd",
      status: "paid",
      amount_paid: 1079,
      total: 1079,
      total_excluding_tax: 999,
      total_discount_amounts: [],
      total_taxes: [{ amount: 80 }],
      shipping_cost: null,
    }),
    { subtotalCents: 999, taxCents: 80, totalCents: 1079 },
  );
  const paidInvoice = {
    currency: "usd",
    status: "paid",
    amount_paid: 1079,
    total: 1079,
    total_excluding_tax: 999,
    total_discount_amounts: [],
    total_taxes: [{ amount: 80 }],
    shipping_cost: null,
  };
  assert.throws(() =>
    stripeTax.paidInvoiceFinancials({ ...paidInvoice, currency: "eur" }),
  );
  assert.throws(() =>
    stripeTax.paidInvoiceFinancials({ ...paidInvoice, status: "open" }),
  );
  assert.throws(() =>
    stripeTax.paidInvoiceFinancials({ ...paidInvoice, amount_paid: 1078 }),
  );
  assert.throws(() =>
    stripeTax.paidInvoiceFinancials({
      ...paidInvoice,
      total_discount_amounts: [{ amount: 1 }],
    }),
  );
  assert.throws(() =>
    stripeTax.paidInvoiceFinancials({
      ...paidInvoice,
      shipping_cost: { amount_subtotal: 1 },
    }),
  );
  assert.throws(() =>
    stripeTax.paidInvoiceFinancials({
      ...paidInvoice,
      total_excluding_tax: 998,
    }),
  );

  const firstRefund = stripeTax.pretaxRefundDeltaCents({
    subtotalCents: 199,
    totalCents: 219,
    totalRefundedCents: 100,
    refundDeltaCents: 100,
  });
  const duplicateRefund = stripeTax.pretaxRefundDeltaCents({
    subtotalCents: 199,
    totalCents: 219,
    totalRefundedCents: 100,
    refundDeltaCents: 0,
  });
  const finalRefund = stripeTax.pretaxRefundDeltaCents({
    subtotalCents: 199,
    totalCents: 219,
    totalRefundedCents: 219,
    refundDeltaCents: 119,
  });
  assert.equal(firstRefund, 91);
  assert.equal(duplicateRefund, 0);
  assert.equal(firstRefund + finalRefund, 199);

  const originalTaxFlag = process.env.STRIPE_AUTOMATIC_TAX_ENABLED;
  try {
    delete process.env.STRIPE_AUTOMATIC_TAX_ENABLED;
    assert.equal(stripeTax.stripeAutomaticTaxEnabled(), false);
    process.env.STRIPE_AUTOMATIC_TAX_ENABLED = "false";
    assert.equal(stripeTax.stripeAutomaticTaxEnabled(), false);
    process.env.STRIPE_AUTOMATIC_TAX_ENABLED = "true";
    assert.equal(stripeTax.stripeAutomaticTaxEnabled(), true);
    process.env.STRIPE_AUTOMATIC_TAX_ENABLED = "yes";
    assert.throws(() => stripeTax.stripeAutomaticTaxEnabled());
  } finally {
    if (originalTaxFlag === undefined) {
      delete process.env.STRIPE_AUTOMATIC_TAX_ENABLED;
    } else {
      process.env.STRIPE_AUTOMATIC_TAX_ENABLED = originalTaxFlag;
    }
  }

  const catalog = catalogModule.catalog;
  const purchasable = catalog.filter(seriesPurchase.isSeriesPurchasable);
  assert.equal(catalog.length, 84, "catalog size changed; review payment SKU policy");
  assert.equal(purchasable.length, 79, "unlock SKU count changed; review checkout coverage");
  assert.equal(new Set(purchasable.map((series) => series.slug)).size, 79);
  for (const series of purchasable) {
    assert.equal(series.status, "live", `${series.slug} is not live`);
    assert.ok(series.episodeCount > series.freeEpisodes, `${series.slug} has no paid episodes`);
    assert.ok(series.coinPerEpisode > 0, `${series.slug} has no paid classification`);
    assert.equal(
      mux.MUX_MAP[series.slug]?.length,
      series.episodeCount,
      `${series.slug} playback inventory does not match its sellable episode count`,
    );
    assert.deepEqual(
      stripeTax.canonicalCheckoutFinancials(
        checkoutSession({ subtotal: seriesPurchase.SERIES_UNLOCK_PRICE_CENTS, tax: 17 }),
        seriesPurchase.SERIES_UNLOCK_PRICE_CENTS,
      ),
      { subtotalCents: 199, taxCents: 17, totalCents: 216 },
    );
  }
  assert.equal(
    catalog.filter(
      (series) =>
        series.status === "live" &&
        series.freeEpisodes === series.episodeCount &&
        series.coinPerEpisode === 0,
    ).length,
    5,
    "fully-free catalog classification changed",
  );

  assert.deepEqual(Object.keys(config.VIP_PLANS).sort(), ["monthly", "yearly"]);
  assert.deepEqual(
    {
      cents: config.VIP_PLANS.monthly.cents,
      interval: config.VIP_PLANS.monthly.interval,
      intervalCount: config.VIP_PLANS.monthly.intervalCount,
    },
    { cents: 999, interval: "month", intervalCount: 1 },
  );
  assert.deepEqual(
    {
      cents: config.VIP_PLANS.yearly.cents,
      interval: config.VIP_PLANS.yearly.interval,
      intervalCount: config.VIP_PLANS.yearly.intervalCount,
    },
    { cents: 7999, interval: "year", intervalCount: 1 },
  );
  for (const plan of Object.values(config.VIP_PLANS)) {
    const tax = plan.id === "monthly" ? 81 : 641;
    assert.deepEqual(
      stripeTax.canonicalCheckoutFinancials(
        checkoutSession({ subtotal: plan.cents, tax }),
        plan.cents,
      ),
      {
        subtotalCents: plan.cents,
        taxCents: tax,
        totalCents: plan.cents + tax,
      },
    );
  }

  const unlockRoute = readFileSync(join(ROOT, "app/api/unlock/route.ts"), "utf8");
  const unlockConfirmRoute = readFileSync(
    join(ROOT, "app/api/unlock/confirm/route.ts"),
    "utf8",
  );
  const privateJsonSource = readFileSync(
    join(ROOT, "lib/private-json.ts"),
    "utf8",
  );
  const privateAuthenticatedRoutes = [
    "app/api/account/delete/route.ts",
    "app/api/unlock/route.ts",
    "app/api/unlock/confirm/route.ts",
    "app/api/subscribe/route.ts",
    "app/api/subscribe/confirm/route.ts",
    "app/api/billing-portal/route.ts",
    "app/api/watch-progress/route.ts",
    "app/api/saved-list/route.ts",
    "app/api/entitlements/route.ts",
    "app/api/entitlements/check/route.ts",
    "app/api/access/route.ts",
    "app/api/admin/stats/route.ts",
    "app/api/admin/creators/route.ts",
    "app/api/admin/review/route.ts",
    "app/api/creator/me/route.ts",
    "app/api/creator/content/route.ts",
    "app/api/creator/content/[id]/route.ts",
    "app/api/creator/content/[id]/submit/route.ts",
    "app/api/creator/analytics/route.ts",
    "app/api/creator/apply/route.ts",
    "app/api/creator/upload/route.ts",
    "app/api/push/subscribe/route.ts",
    "app/api/cron/vip-renewal-reminders/route.ts",
    "app/api/push/send/route.ts",
  ].map((relativePath) => [
    relativePath,
    readFileSync(join(ROOT, relativePath), "utf8"),
  ]);
  const subscribeRoute = readFileSync(join(ROOT, "app/api/subscribe/route.ts"), "utf8");
  const billingPortalRoute = readFileSync(
    join(ROOT, "app/api/billing-portal/route.ts"),
    "utf8",
  );
  const accountDeleteRoute = readFileSync(
    join(ROOT, "app/api/account/delete/route.ts"),
    "utf8",
  );
  const accountDeletePost = accountDeleteRoute.slice(
    accountDeleteRoute.indexOf("export async function POST"),
  );
  const webhookRoute = readFileSync(
    join(ROOT, "app/api/stripe/webhook/route.ts"),
    "utf8",
  );
  const vipPurchaseLedger = readFileSync(
    join(ROOT, "lib/vip-purchase-ledger.ts"),
    "utf8",
  );
  const stripeCustomer = readFileSync(
    join(ROOT, "lib/stripe-customer.ts"),
    "utf8",
  );
  const vipNotices = readFileSync(
    join(ROOT, "lib/vip-payment-notices.ts"),
    "utf8",
  );
  const vipConsentLedger = readFileSync(
    join(ROOT, "lib/vip-checkout-consent-ledger.ts"),
    "utf8",
  );
  const renewalCron = readFileSync(
    join(ROOT, "app/api/cron/vip-renewal-reminders/route.ts"),
    "utf8",
  );
  const pushSendRoute = readFileSync(
    join(ROOT, "app/api/push/send/route.ts"),
    "utf8",
  );
  const paymentCapabilities = readFileSync(
    join(ROOT, "app/api/payments/capabilities/route.ts"),
    "utf8",
  );
  const appleTransactionRoute = readFileSync(
    join(ROOT, "app/api/iap/apple/transactions/route.ts"),
    "utf8",
  );
  const appleNotificationRoute = readFileSync(
    join(ROOT, "app/api/iap/apple/notifications/route.ts"),
    "utf8",
  );
  const llmsRoute = readFileSync(join(ROOT, "app/llms.txt/route.ts"), "utf8");
  const aiHostRoute = readFileSync(
    join(ROOT, "app/api/ai-host/route.ts"),
    "utf8",
  );
  const publicVipCopy = [
    "app/watch-in/[slug]/page.tsx",
    "lib/data/guides.ts",
    "lib/data/compare.ts",
    "lib/content/learn.ts",
  ]
    .map((relativePath) => readFileSync(join(ROOT, relativePath), "utf8"))
    .join("\n");
  const emailSource = readFileSync(join(ROOT, "lib/email.ts"), "utf8");
  const vercelConfig = JSON.parse(
    readFileSync(join(ROOT, "vercel.json"), "utf8"),
  );
  for (const [name, source, taxConstant] of [
    ["unlock", unlockRoute, "SERIES_UNLOCK_TAX_CODE"],
    ["VIP", subscribeRoute, "VIP_SUBSCRIPTION_TAX_CODE"],
  ]) {
    assert.match(source, new RegExp(`tax_code:\\s*${taxConstant}`), `${name} tax code missing`);
    assert.match(source, /tax_behavior:\s*"exclusive"/, `${name} tax behavior missing`);
    assert.match(source, /automatic_tax:\s*\{\s*enabled:\s*true\s*\}/s, `${name} auto-tax gate missing`);
  }
  assert.match(webhookRoute, /revenue_cents:\s*seriesFinancials\.subtotalCents/);
  assert.match(webhookRoute, /revenue_cents:\s*financials\.subtotalCents/);
  assert.match(webhookRoute, /pretaxRefundDeltaCents/);
  assert.match(
    webhookRoute,
    /const providerState = await reconcilePurchaseProviderState\([\s\S]*?if \(providerState\.accessAllowed\) \{\s*await processSubscription\(supabase, subscription, true\)/,
    "VIP must reconcile the current Charge before activation",
  );
  assert.match(
    webhookRoute,
    /if \(!allowActivation && !sameSubscription\)/,
    "subscription lifecycle events must not create unproven access",
  );
  assert.match(webhookRoute, /stripeCheckoutTermsConsentSatisfied\(session\)/);
  assert.match(billingPortalRoute, /deletion_requested_at/);
  assert.match(billingPortalRoute, /assertOwnedLiveStripeCustomer/);
  assert.match(billingPortalRoute, /canonicalBillingPortalReturnUrl/);
  assert.match(billingPortalRoute, /configuration:\s*configurationId/);
  assert.match(billingPortalRoute, /assertCanonicalBillingPortalConfiguration/);
  assert.match(billingPortalRoute, /Billing account changed/);
  assert.match(accountDeletePost, /request\.json\(\)/);
  assert.match(accountDeletePost, /suppliedExpectedUserId !== user\.id/);
  assert.match(accountDeletePost, /status:\s*409/);
  assert.ok(
    accountDeletePost.indexOf("suppliedExpectedUserId !== user.id") <
      accountDeletePost.indexOf("const supabase = getServiceClient()"),
    "account identity mismatch must fail before service-client deletion access",
  );
  assert.ok(
    accountDeletePost.indexOf("suppliedExpectedUserId !== user.id") <
      accountDeletePost.indexOf("deletion_requested_at:"),
    "account identity mismatch must fail before the deletion marker write",
  );
  assert.doesNotMatch(
    accountDeletePost,
    /\.from\(\s*["']entitlements["']\s*\)/,
    "account deletion must leave entitlements to the successful profile FK cascade",
  );
  assert.doesNotMatch(
    accountDeletePost,
    /delete_account_entitlements_for_deletion/,
    "account deletion must not purge entitlements before Auth succeeds",
  );
  assert.ok(
    accountDeletePost.indexOf("deletion_requested_at:") <
      accountDeletePost.indexOf("redactPurchaseIdentity(purchase.metadata)") <
        accountDeletePost.indexOf("auth.admin.deleteUser"),
    "account deletion must set the guard and finish cleanup/redaction before Auth deletion",
  );
  assert.match(unlockRoute, /consent_collection:\s*consentCollection/);
  assert.match(subscribeRoute, /consent_collection:\s*consentCollection/);
  assert.match(unlockRoute, /This is not a subscription and does not renew/);
  assert.match(unlockRoute, /const priorCheckout = await findPriorSeriesCheckout/);
  assert.ok(
    unlockRoute.indexOf("const priorCheckout = await findPriorSeriesCheckout") <
      unlockRoute.indexOf("session = await createCheckoutSessionWithRecovery"),
    "durable Stripe history must be checked before creating a Series Checkout",
  );
  assert.match(unlockRoute, /checkoutClient:\s*nativeAndroid/);
  assert.match(unlockRoute, /priorCheckout\.kind === "blocked"/);
  assert.match(unlockRoute, /paymentReviewRequired:\s*true/);
  assert.match(unlockRoute, /sessionCustomerId !== customerId/);
  assert.match(unlockRoute, /session\.mode !== "payment"/);
  assert.match(
    stripeCustomer,
    /Stored Stripe Customer is unavailable; billing history requires support review/,
    "a missing persisted Customer must not be silently replaced",
  );
  assert.match(unlockConfirmRoute, /const belongsToUser = checkoutUserId === user\.id/);
  assert.match(privateJsonSource, /private, no-store, max-age=0/);
  assert.match(privateJsonSource, /headers\.get\("Vary"\)/);
  assert.match(privateJsonSource, /"Authorization",[\s\S]*?"Cookie"/);
  assert.match(privateJsonSource, /normalizedToken = token\.toLowerCase\(\)/);
  assert.doesNotMatch(
    privateJsonSource,
    /headers\.set\("Vary",\s*"Authorization, Cookie"\)/,
    "privateJson must merge with existing Vary tokens instead of overwriting them",
  );
  assert.match(unlockConfirmRoute, /privateJson\(/);
  for (const [relativePath, source] of privateAuthenticatedRoutes) {
    assert.match(
      source,
      /privateJson\(/,
      `${relativePath} must prevent shared caching of account-derived JSON`,
    );
    assert.doesNotMatch(
      source,
      /(?:Response|NextResponse)\.json\(/,
      `${relativePath} must not bypass private JSON response headers`,
    );
  }
  assert.match(
    unlockConfirmRoute,
    /checkoutCustomerId === profile\.data\.stripe_customer_id/,
  );
  assert.match(unlockConfirmRoute, /stripeCheckoutTermsConsentSatisfied\(session\)/);
  assert.match(unlockConfirmRoute, /getSeriesPaymentState\(stripe, session\)/);
  assert.match(unlockConfirmRoute, /grantSeriesEntitlementForPurchase/);
  assert.match(subscribeRoute, /renews automatically at/);
  assert.match(subscribeRoute, /until canceled/);
  assert.match(subscribeRoute, /recoverVipFromProvider/);
  assert.match(subscribeRoute, /assertVipCheckoutReleaseReady\(plan\)/);
  assert.match(subscribeRoute, /recordVipCheckoutConsent/);
  assert.match(webhookRoute, /assertVipCheckoutConsentRecorded/);
  assert.match(webhookRoute, /recordVipCheckoutConsent/);
  assert.match(webhookRoute, /vip_initial_acknowledgment/);
  assert.match(webhookRoute, /vip_renewal_receipt/);
  assert.match(webhookRoute, /vip_cancellation_confirmation/);
  assert.match(
    webhookRoute,
    /preventVipRenewalForOpenDispute[\s\S]*?stripe\.subscriptions\.update[\s\S]*?cancel_at_period_end:\s*true/,
    "an open VIP dispute must prevent another automatic renewal",
  );
  assert.match(vipConsentLedger, /terms_accepted:\s*true/);
  assert.match(vipConsentLedger, /VIP Checkout consent conflicts/);
  assert.match(vipNotices, /recipient_email_sha256/);
  assert.match(vipNotices, /resendIdempotencyKey/);
  assert.match(vipNotices, /name:\s*"there"/);
  assert.match(emailSource, /\{ idempotencyKey \}/);
  assert.match(emailSource, /Resend rejected purchase confirmation/);
  assert.match(
    webhookRoute,
    /if \(email\)[\s\S]*?verza-series-unlock\/\$\{session\.id\}[\s\S]*?notifyTeam:\s*isNew/,
    "series receipt retries must use a stable provider key after ledger insertion",
  );
  assert.match(vipNotices, /Automatic retry window expired/);
  assert.match(renewalCron, /vip_annual_renewal_reminder/);
  assert.match(renewalCron, /45 \* DAY_MS/);
  assert.match(renewalCron, /15 \* DAY_MS/);
  assert.match(renewalCron, /timingSafeEqual/);
  assert.match(renewalCron, /sendAnnualNoticeWithRetries/);
  assert.match(renewalCron, /attempt <= 3/);
  assert.match(pushSendRoute, /headers\.append\("Vary", "X-Push-Api-Key"\)/);
  assert.match(pushSendRoute, /return privateJson\(body, \{ \.\.\.init, headers \}\)/);
  assert.match(paymentCapabilities, /await getUser\(\)/);
  assert.match(paymentCapabilities, /stripeCheckoutConsentReadiness/);
  assert.match(paymentCapabilities, /seriesUnlock/);
  assert.match(paymentCapabilities, /checkoutConfigured/);
  assert.match(paymentCapabilities, /consentMode/);
  assert.match(paymentCapabilities, /vipYearlyCheckoutEnabled/);
  assert.match(paymentCapabilities, /yearlyCheckoutEnabled/);
  assert.match(paymentCapabilities, /private, no-store/);
  assert.match(
    appleTransactionRoute,
    /transaction\.environment === Environment\.SANDBOX &&\s*!appleSandboxUserAllowed\(user\.id\)/,
    "authenticated Sandbox fulfillment must use the strict union allowlist",
  );
  assert.match(
    appleNotificationRoute,
    /environment === Environment\.SANDBOX &&\s*!appleSandboxUserAllowed\(transaction\.userId\)/,
    "Sandbox notifications must use the strict union allowlist",
  );
  assert.match(llmsRoute, /vipYearlyCheckoutEnabled/);
  assert.match(aiHostRoute, /YEARLY_VIP_AVAILABLE/);
  assert.doesNotMatch(publicVipCopy, /monthly\s*(?:or|\/)\s*yearly VIP/i);
  assert.doesNotMatch(
    publicVipCopy,
    /VIP is \$9\.99\/month or \$79\.99\/year/i,
  );
  assert.deepEqual(vercelConfig.crons, [
    {
      path: "/api/cron/vip-renewal-reminders",
      schedule: "0 16 * * *",
    },
  ]);
  assert.match(
    vipPurchaseLedger,
    /const initial = await verifyVipSubscriptionPayment[\s\S]*?recordVipPurchase[\s\S]*?const current = await verifyVipSubscriptionPayment/,
    "VIP recovery must write its ledger before the final provider-state read",
  );
  assert.match(
    vipPurchaseLedger,
    /restore_vip_access_after_payment_resolution/,
    "VIP recovery must use the row-locking access RPC",
  );
  assert.match(subscribeRoute, /assertCanonicalBillingPortalConfiguration/);
  assert.match(subscribeRoute, /assertStripeCheckoutConsentReady/);
  for (const eventType of stripeWebhookEvents.REQUIRED_STRIPE_WEBHOOK_EVENTS) {
    assert.ok(
      webhookRoute.includes(`case "${eventType}"`),
      `required Stripe event ${eventType} has no handler`,
    );
  }
  assert.match(
    webhookRoute,
    /stripe\.subscriptions\.retrieve\(snapshot\.id\)/,
    "subscription webhooks must reconcile current provider state, not stale snapshots",
  );
  const vipCard = readFileSync(join(ROOT, "components/VipCard.tsx"), "utf8");
  assert.match(vipCard, /cancelAtPeriodEnd \? "Access through" : "Renews"/);
  assert.match(vipCard, /renewing automatically until canceled/);
  assert.match(vipCard, /plus applicable taxes/);
  assert.match(vipCard, /href="\/terms"/);
  assert.match(vipCard, /href="\/privacy"/);
  assert.match(vipCard, /href="\/refund-policy"/);
  assert.match(vipCard, /yearlyCheckoutEnabled \? \(/);

  console.log("payment code/catalog suite: PASS (74 unlock SKUs, 2 VIP plans)");
}

async function runSeriesCheckoutHistorySuite() {
  const stripeTax = loadTypeScriptModule("lib/stripe-tax.ts");
  const seriesPurchase = loadTypeScriptModule("lib/series-purchase.ts", {
    "@/lib/stripe-tax": stripeTax,
  });
  const checkoutRecovery = loadTypeScriptModule(
    "lib/series-checkout-recovery.ts",
    {
      "@/lib/series-purchase": seriesPurchase,
      "@/lib/stripe-tax": stripeTax,
    },
  );
  const identity = {
    customerId: "cus_series_history",
    userId: "user_series_history",
    seriesSlug: "series-history-test",
    termsVersion: "2026-08-03",
    tosConsentPolicy: "required",
    checkoutClient: "native_android",
  };

  function session(overrides = {}) {
    const status = overrides.status ?? "complete";
    return {
      id: overrides.id ?? `cs_${status}`,
      ...checkoutSession({ subtotal: 199 }),
      mode: "payment",
      status,
      payment_status:
        overrides.payment_status ?? (status === "complete" ? "paid" : "unpaid"),
      payment_intent: "pi_series_history",
      customer: identity.customerId,
      client_reference_id: identity.userId,
      metadata: {
        type: "series_unlock",
        seriesSlug: identity.seriesSlug,
        userId: identity.userId,
        termsVersion: identity.termsVersion,
        tosConsentPolicy: identity.tosConsentPolicy,
        checkoutClient: identity.checkoutClient,
      },
      url: status === "open" ? "https://checkout.stripe.com/c/pay/test" : null,
      ...overrides,
    };
  }

  function provider({ complete = [], open = [], error = null } = {}) {
    const byStatus = { complete, open };
    return {
      checkout: {
        sessions: {
          list: async ({ customer, status, limit, starting_after: startingAfter }) => {
            assert.equal(customer, identity.customerId);
            assert.equal(limit, 100);
            if (error) throw error;
            const all = byStatus[status];
            const priorIndex = startingAfter
              ? all.findIndex((item) => item.id === startingAfter)
              : -1;
            const start = priorIndex + 1;
            const data = all.slice(start, start + limit);
            return {
              data,
              has_more: start + data.length < all.length,
            };
          },
        },
      },
    };
  }

  assert.deepEqual(
    await checkoutRecovery.findPriorSeriesCheckout(provider(), identity),
    { kind: "none" },
  );

  const paid = session({ id: "cs_paid_history" });
  assert.deepEqual(
    await checkoutRecovery.findPriorSeriesCheckout(
      provider({ complete: [paid] }),
      identity,
    ),
    { kind: "paid", session: paid },
  );

  const reusableOpen = session({ id: "cs_open_history", status: "open" });
  assert.deepEqual(
    await checkoutRecovery.findPriorSeriesCheckout(
      provider({ open: [reusableOpen] }),
      identity,
    ),
    { kind: "open", session: reusableOpen },
  );
  const secondOpen = session({ id: "cs_second_open_history", status: "open" });
  assert.deepEqual(
    await checkoutRecovery.findPriorSeriesCheckout(
      provider({ open: [reusableOpen, secondOpen] }),
      identity,
    ),
    {
      kind: "blocked",
      sessionId: secondOpen.id,
      reason: "multiple_open_sessions",
    },
    "multiple payable sessions must be reviewed instead of selecting one",
  );

  const pending = session({
    id: "cs_pending_history",
    payment_status: "unpaid",
  });
  assert.deepEqual(
    await checkoutRecovery.findPriorSeriesCheckout(
      provider({ complete: [pending], open: [reusableOpen] }),
      identity,
    ),
    {
      kind: "blocked",
      sessionId: pending.id,
      reason: "payment_pending",
    },
    "a completed but unpaid session must block a second charge",
  );

  const conflicting = session({
    id: "cs_conflicting_history",
    client_reference_id: "user_other",
  });
  assert.deepEqual(
    await checkoutRecovery.findPriorSeriesCheckout(
      provider({ complete: [conflicting] }),
      identity,
    ),
    {
      kind: "blocked",
      sessionId: conflicting.id,
      reason: "identity_conflict",
    },
  );

  const oldOpen = session({
    id: "cs_old_open_history",
    status: "open",
    metadata: {
      ...reusableOpen.metadata,
      checkoutClient: "web",
    },
  });
  assert.deepEqual(
    await checkoutRecovery.findPriorSeriesCheckout(
      provider({ open: [oldOpen] }),
      identity,
    ),
    {
      kind: "blocked",
      sessionId: oldOpen.id,
      reason: "noncanonical_open_session",
    },
    "an open session for another client return path must not be reused",
  );

  const unrelated = Array.from({ length: 100 }, (_, index) =>
    session({
      id: `cs_unrelated_${index}`,
      metadata: {
        ...paid.metadata,
        seriesSlug: `unrelated-${index}`,
      },
    }),
  );
  const paginatedPaid = session({ id: "cs_paid_page_two" });
  assert.equal(
    (
      await checkoutRecovery.findPriorSeriesCheckout(
        provider({ complete: [...unrelated, paginatedPaid] }),
        identity,
      )
    ).kind,
    "paid",
    "paid history must be found beyond Stripe's first page",
  );

  const overLimit = Array.from(
    { length: checkoutRecovery.MAX_SERIES_CHECKOUT_HISTORY + 1 },
    (_, index) =>
      session({
        id: `cs_over_limit_${index}`,
        metadata: {
          ...paid.metadata,
          seriesSlug: `unrelated-over-limit-${index}`,
        },
      }),
  );
  await assert.rejects(() =>
    checkoutRecovery.findPriorSeriesCheckout(
      provider({ complete: overLimit }),
      identity,
    ),
  );
  await assert.rejects(() =>
    checkoutRecovery.findPriorSeriesCheckout(
      provider({ error: new Error("provider unavailable") }),
      identity,
    ),
  );

  console.log(
    "Series Checkout history suite: PASS (paid/open/pending/identity/pagination/fail-closed)",
  );
}

async function runSeriesProviderPaymentSuite() {
  const stripeTax = loadTypeScriptModule("lib/stripe-tax.ts");
  const seriesPurchase = loadTypeScriptModule("lib/series-purchase.ts", {
    "@/lib/stripe-tax": stripeTax,
  });
  const session = {
    id: "cs_series_provider",
    ...checkoutSession({ subtotal: 199, tax: 20 }),
    payment_intent: "pi_series_provider",
  };
  const charge = {
    id: "ch_series_provider",
    paid: true,
    status: "succeeded",
    amount: 219,
    amount_refunded: 0,
    currency: "usd",
    disputed: false,
  };

  function provider(overrides = {}) {
    const currentCharge = { ...charge, ...(overrides.charge ?? {}) };
    const latestCharge = Object.hasOwn(overrides, "latestCharge")
      ? overrides.latestCharge
      : currentCharge;
    return {
      paymentIntents: {
        retrieve: async () => ({
          id: "pi_series_provider",
          status: "succeeded",
          amount_received: 219,
          currency: "usd",
          latest_charge: latestCharge,
          ...(overrides.paymentIntent ?? {}),
        }),
      },
      charges: {
        retrieve: async (chargeId) => {
          assert.equal(chargeId, "ch_series_provider");
          return currentCharge;
        },
      },
    };
  }

  const state = await seriesPurchase.getSeriesPaymentState(provider(), session);
  assert.equal(state.paymentIntentId, "pi_series_provider");
  assert.deepEqual(state.financials, {
    subtotalCents: 199,
    taxCents: 20,
    totalCents: 219,
  });
  assert.equal(state.charge.id, "ch_series_provider");
  assert.equal(state.unrefunded, true);
  assert.equal(
    await seriesPurchase.hasUnrefundedSeriesPayment(
      provider({ latestCharge: "ch_series_provider" }),
      session,
    ),
    true,
    "a non-expanded successful Charge must be verified by retrieval",
  );
  assert.equal(
    await seriesPurchase.hasUnrefundedSeriesPayment(
      provider({ charge: { amount_refunded: 1 } }),
      session,
    ),
    false,
    "even a partial refund must block entitlement recovery",
  );
  assert.equal(
    await seriesPurchase.hasUnrefundedSeriesPayment(
      provider({ charge: { disputed: true } }),
      session,
    ),
    false,
    "a disputed Charge must block entitlement recovery",
  );

  await assert.rejects(() =>
    seriesPurchase.getSeriesPaymentState(provider(), {
      ...session,
      payment_intent: null,
    }),
  );
  for (const paymentIntent of [
    { status: "processing" },
    { amount_received: 218 },
    { currency: "eur" },
  ]) {
    await assert.rejects(() =>
      seriesPurchase.getSeriesPaymentState(
        provider({ paymentIntent }),
        session,
      ),
    );
  }
  await assert.rejects(() =>
    seriesPurchase.getSeriesPaymentState(
      provider({ latestCharge: null }),
      session,
    ),
  );
  for (const chargeOverride of [
    { paid: false },
    { status: "failed" },
    { amount: 218 },
    { currency: "eur" },
  ]) {
    await assert.rejects(() =>
      seriesPurchase.getSeriesPaymentState(
        provider({ charge: chargeOverride }),
        session,
      ),
    );
  }

  console.log(
    "Series provider payment suite: PASS (amount/currency/charge/refund/dispute)",
  );
}

async function runStripeCustomerHistorySuite() {
  const stripeCustomer = loadTypeScriptModule("lib/stripe-customer.ts", {
    "@/lib/supabase/server": { getServiceClient: () => ({}) },
    "@/lib/stripe-idempotency": {
      stripeIdempotencyKey: () => "verza:test-customer-history",
    },
  });
  const existingCustomerId = "cus_persisted_history";
  const supabase = {
    from(table) {
      assert.equal(table, "profiles");
      return {
        select() {
          return this;
        },
        eq(column, value) {
          assert.equal(column, "id");
          assert.equal(value, "user_customer_history");
          return this;
        },
        async maybeSingle() {
          return {
            data: {
              stripe_customer_id: existingCustomerId,
              deletion_requested_at: null,
            },
            error: null,
          };
        },
      };
    },
  };
  const user = {
    id: "user_customer_history",
    email: "payment-history@example.invalid",
  };
  let createCalls = 0;

  await assert.rejects(
    () =>
      stripeCustomer.ensureStripeCustomer(
        supabase,
        {
          customers: {
            retrieve: async () => {
              const error = new Error("missing");
              error.code = "resource_missing";
              throw error;
            },
            create: async () => {
              createCalls += 1;
              throw new Error("must not create");
            },
          },
        },
        user,
        existingCustomerId,
      ),
    /billing history requires support review/,
  );
  await assert.rejects(
    () =>
      stripeCustomer.ensureStripeCustomer(
        supabase,
        {
          customers: {
            retrieve: async () => ({ id: existingCustomerId, deleted: true }),
            create: async () => {
              createCalls += 1;
              throw new Error("must not create");
            },
          },
        },
        user,
        existingCustomerId,
      ),
    /billing history requires support review/,
  );
  assert.equal(createCalls, 0, "a missing persisted Customer must not be replaced");
  console.log(
    "Stripe Customer history suite: PASS (missing/deleted link fails before replacement)",
  );
}

async function runPaymentCapabilitiesSuite() {
  const releasePolicy = loadTypeScriptModule("lib/vip-release-policy.ts");
  const checkoutConsent = loadTypeScriptModule(
    "lib/stripe-checkout-consent.ts",
  );
  let authenticated = false;
  const route = loadTypeScriptModule(
    "app/api/payments/capabilities/route.ts",
    {
      "@/lib/auth": {
        getUser: async () =>
          authenticated ? { id: "user_capabilities", email: "" } : null,
      },
      "@/lib/vip-release-policy": releasePolicy,
      "@/lib/stripe-checkout-consent": checkoutConsent,
    },
  );
  const releaseEnvNames = [
    "STRIPE_SECRET_KEY",
    "STRIPE_CHECKOUT_TOS_CONSENT_REQUIRED",
    "VIP_TRANSACTIONAL_NOTICES_ENABLED",
    "VIP_ANNUAL_RENEWAL_NOTICES_ENABLED",
    "VIP_YEARLY_CHECKOUT_ENABLED",
    "RESEND_API_KEY",
    "CRON_SECRET",
  ];
  const originalReleaseEnv = Object.fromEntries(
    releaseEnvNames.map((name) => [name, process.env[name]]),
  );
  try {
    for (const name of releaseEnvNames) delete process.env[name];
    process.env.STRIPE_SECRET_KEY = "sk_live_capabilities_fixture";
    process.env.STRIPE_CHECKOUT_TOS_CONSENT_REQUIRED = "false";

    const unauthorized = await route.GET();
    assert.equal(unauthorized.status, 401);
    assert.match(unauthorized.headers.get("cache-control") ?? "", /private/);
    assert.match(unauthorized.headers.get("cache-control") ?? "", /no-store/);
    assert.equal(unauthorized.headers.get("vary"), "Authorization, Cookie");

    authenticated = true;
    let response = await route.GET();
    assert.equal(response.status, 200);
    assert.match(response.headers.get("cache-control") ?? "", /private/);
    assert.match(response.headers.get("cache-control") ?? "", /no-store/);
    assert.equal(response.headers.get("vary"), "Authorization, Cookie");
    assert.deepEqual(await response.json(), {
      seriesUnlock: {
        checkoutConfigured: true,
        livemode: true,
        consentMode: "compatibility",
      },
      vip: {
        monthlyCheckoutEnabled: false,
        yearlyCheckoutEnabled: false,
      },
    });

    process.env.STRIPE_CHECKOUT_TOS_CONSENT_REQUIRED = "true";
    response = await route.GET();
    assert.deepEqual(await response.json(), {
      seriesUnlock: {
        checkoutConfigured: true,
        livemode: true,
        consentMode: "required",
      },
      vip: {
        monthlyCheckoutEnabled: false,
        yearlyCheckoutEnabled: false,
      },
    });

    delete process.env.STRIPE_CHECKOUT_TOS_CONSENT_REQUIRED;
    response = await route.GET();
    assert.deepEqual(await response.json(), {
      seriesUnlock: {
        checkoutConfigured: false,
        livemode: true,
        consentMode: "unconfigured",
      },
      vip: {
        monthlyCheckoutEnabled: false,
        yearlyCheckoutEnabled: false,
      },
    });

    process.env.STRIPE_CHECKOUT_TOS_CONSENT_REQUIRED = "malformed";
    let originalConsoleError = console.error;
    let configurationErrors = [];
    console.error = (...args) => configurationErrors.push(args.join(" "));
    try {
      response = await route.GET();
    } finally {
      console.error = originalConsoleError;
    }
    assert.deepEqual(await response.json(), {
      seriesUnlock: {
        checkoutConfigured: false,
        livemode: true,
        consentMode: "unconfigured",
      },
      vip: {
        monthlyCheckoutEnabled: false,
        yearlyCheckoutEnabled: false,
      },
    });
    assert.match(
      configurationErrors.join("\n"),
      /Series Checkout configuration is invalid/i,
    );

    process.env.STRIPE_CHECKOUT_TOS_CONSENT_REQUIRED = "false";
    process.env.VIP_TRANSACTIONAL_NOTICES_ENABLED = "true";
    process.env.RESEND_API_KEY = "re_capabilities_test";
    response = await route.GET();
    assert.deepEqual(await response.json(), {
      seriesUnlock: {
        checkoutConfigured: true,
        livemode: true,
        consentMode: "compatibility",
      },
      vip: {
        monthlyCheckoutEnabled: true,
        yearlyCheckoutEnabled: releasePolicy.vipYearlyCheckoutEnabled(),
      },
    });

    process.env.VIP_ANNUAL_RENEWAL_NOTICES_ENABLED = "true";
    process.env.VIP_YEARLY_CHECKOUT_ENABLED = "true";
    process.env.CRON_SECRET = "0123456789abcdef";
    response = await route.GET();
    assert.deepEqual(await response.json(), {
      seriesUnlock: {
        checkoutConfigured: true,
        livemode: true,
        consentMode: "compatibility",
      },
      vip: {
        monthlyCheckoutEnabled: true,
        yearlyCheckoutEnabled: releasePolicy.vipYearlyCheckoutEnabled(),
      },
    });

    process.env.VIP_YEARLY_CHECKOUT_ENABLED = "malformed";
    originalConsoleError = console.error;
    configurationErrors = [];
    console.error = (...args) => configurationErrors.push(args.join(" "));
    try {
      response = await route.GET();
    } finally {
      console.error = originalConsoleError;
    }
    assert.deepEqual(await response.json(), {
      seriesUnlock: {
        checkoutConfigured: true,
        livemode: true,
        consentMode: "compatibility",
      },
      vip: {
        monthlyCheckoutEnabled: true,
        yearlyCheckoutEnabled: false,
      },
    });
    assert.match(configurationErrors.join("\n"), /configuration is invalid/i);
  } finally {
    for (const name of releaseEnvNames) {
      const value = originalReleaseEnv[name];
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
  console.log(
    "payment capability contract suite: PASS (auth + Series readiness + fail-closed cache-safe response)",
  );
}

async function runVipNoticeEmailSuite() {
  const requests = [];
  let providerError = null;
  class MockResend {
    emails = {
      send: async (...args) => {
        requests.push(args);
        return providerError
          ? { data: null, error: { message: providerError } }
          : { data: { id: `email_${requests.length}` }, error: null };
      },
    };
  }
  const emailModule = loadTypeScriptModule("lib/email.ts", {
    resend: { Resend: MockResend },
  });
  const common = {
    email: "viewer@example.com",
    name: "<Viewer>",
    planLabel: "Yearly",
    recurringAmount: "$79.99",
    chargedAmount: "$79.99",
    renewalDate: "August 3, 2027",
    accessThrough: "August 3, 2027",
    termsVersion: "2026-08-03",
  };

  for (const type of [
    "vip_initial_acknowledgment",
    "vip_renewal_receipt",
    "vip_cancellation_confirmation",
    "vip_annual_renewal_reminder",
  ]) {
    await emailModule.sendVipCustomerNotice(
      {
        ...common,
        type,
        canceledAtPeriodEnd: true,
      },
      `notice/${type}`,
    );
  }
  assert.equal(requests.length, 4);
  for (const [index, [message, options]] of requests.entries()) {
    assert.equal(message.to, common.email);
    assert.equal(message.replyTo, "support@verzatv.com");
    assert.equal(options.idempotencyKey, `notice/${[
      "vip_initial_acknowledgment",
      "vip_renewal_receipt",
      "vip_cancellation_confirmation",
      "vip_annual_renewal_reminder",
    ][index]}`);
    assert.match(message.html, /Manage Subscription/);
    assert.match(message.html, /support@verzatv\.com/);
    assert.match(message.html, /https:\/\/www\.verzatv\.com\/terms/);
    assert.match(message.html, /2026-08-03/);
    assert.doesNotMatch(message.html, /<Viewer>/);
  }
  assert.match(requests[0][0].html, /renews automatically/);
  assert.match(requests[0][0].html, /charged <strong[^>]*>\$79\.99/);
  assert.match(requests[1][0].html, /VIP renewed/);
  assert.match(requests[2][0].html, /will not be charged another automatic renewal/);
  assert.match(requests[3][0].html, /15|annual VERZA VIP subscription/);
  assert.match(requests[3][0].html, /cancel before the renewal date/);

  const seriesMessageId = await emailModule.sendPurchaseConfirmation(
    "buyer@example.com",
    "Buyer",
    "series_unlock",
    { seriesTitle: "Test Series", amount: "$1.99" },
    {
      idempotencyKey: "verza-series-unlock/cs_test",
      notifyTeam: false,
    },
  );
  assert.equal(seriesMessageId, "email_5");
  assert.equal(requests[4][0].to, "buyer@example.com");
  assert.equal(requests[4][0].replyTo, "support@verzatv.com");
  assert.equal(
    requests[4][1].idempotencyKey,
    "verza-series-unlock/cs_test",
  );
  assert.match(requests[4][0].html, /Series Unlocked/);

  providerError = "provider unavailable";
  await assert.rejects(() =>
    emailModule.sendVipCustomerNotice(
      { ...common, type: "vip_renewal_receipt" },
      "notice/failure",
    ),
  );
  await assert.rejects(() =>
    emailModule.sendPurchaseConfirmation(
      "buyer@example.com",
      "Buyer",
      "series_unlock",
      { seriesTitle: "Test Series", amount: "$1.99" },
      {
        idempotencyKey: "verza-series-unlock/cs_failure",
        notifyTeam: false,
      },
    ),
  );
  console.log("payment email suite: PASS (series/VIP idempotency + provider errors)");
}

async function runVipProviderPaymentSuite() {
  const stripeTax = loadTypeScriptModule("lib/stripe-tax.ts");
  const config = loadTypeScriptModule("lib/config.ts");
  const vipProviderPayment = loadTypeScriptModule(
    "lib/vip-provider-payment.ts",
    {
      "@/lib/config": config,
      "@/lib/stripe-tax": stripeTax,
    },
  );
  const subscription = {
    id: "sub_vip",
    latest_invoice: "in_vip",
    customer: "cus_vip",
    livemode: true,
  };
  const invoice = {
    id: "in_vip",
    parent: { subscription_details: { subscription: "sub_vip" } },
    customer: "cus_vip",
    livemode: true,
    currency: "usd",
    status: "paid",
    amount_paid: 999,
    total: 999,
    total_excluding_tax: 999,
    total_discount_amounts: [],
    total_taxes: [],
    shipping_cost: null,
  };
  const invoicePayment = {
    id: "inpay_vip",
    status: "paid",
    amount_paid: 999,
    currency: "usd",
    livemode: true,
    invoice: "in_vip",
    payment: { payment_intent: "pi_vip" },
  };
  const charge = {
    id: "ch_vip",
    status: "succeeded",
    paid: true,
    amount: 999,
    amount_refunded: 0,
    currency: "usd",
    customer: "cus_vip",
    payment_intent: "pi_vip",
    livemode: true,
    disputed: false,
  };
  function provider(overrides = {}) {
    const currentCharge = { ...charge, ...(overrides.charge ?? {}) };
    const currentInvoice = { ...invoice, ...(overrides.invoice ?? {}) };
    const currentPayments = overrides.payments ?? [invoicePayment];
    return {
      invoices: { retrieve: async () => currentInvoice },
      invoicePayments: {
        list: async () => ({
          data: currentPayments,
          has_more: overrides.hasMore ?? false,
        }),
      },
      paymentIntents: {
        retrieve: async () => ({
          id: "pi_vip",
          status: "succeeded",
          amount_received: 999,
          currency: "usd",
          customer: "cus_vip",
          livemode: true,
          latest_charge: currentCharge,
          ...(overrides.paymentIntent ?? {}),
        }),
      },
      charges: { retrieve: async () => currentCharge },
      disputes: {
        list: async () => ({
          data: overrides.disputes ?? [],
          has_more: overrides.disputesHasMore ?? false,
        }),
      },
    };
  }

  await vipProviderPayment.verifyVipSubscriptionPayment(
    provider(),
    subscription,
    "monthly",
  );
  await vipProviderPayment.verifyVipSubscriptionPayment(
    provider({ charge: { amount_refunded: 1 } }),
    subscription,
    "monthly",
  );
  await assert.rejects(() =>
    vipProviderPayment.verifyVipSubscriptionPayment(
      provider({ charge: { amount_refunded: 999 } }),
      subscription,
      "monthly",
    ),
  );
  await assert.rejects(() =>
    vipProviderPayment.verifyVipSubscriptionPayment(
      provider({ charge: { disputed: true } }),
      subscription,
      "monthly",
    ),
  );
  await assert.rejects(() =>
    vipProviderPayment.verifyVipSubscriptionPayment(
      provider({ disputes: [{ status: "lost" }] }),
      subscription,
      "monthly",
    ),
  );
  await assert.rejects(() =>
    vipProviderPayment.verifyVipSubscriptionPayment(
      provider({ paymentIntent: { customer: "cus_other" } }),
      subscription,
      "monthly",
    ),
  );
  await assert.rejects(() =>
    vipProviderPayment.verifyVipSubscriptionPayment(
      provider({ payments: [invoicePayment, { ...invoicePayment, id: "inpay_2" }] }),
      subscription,
      "monthly",
    ),
  );
  console.log("VIP provider payment suite: PASS (paid/partial/full/dispute/owner)");
}

async function runStripeWebhookConfigSuite(releaseMode) {
  assert.ok(
    releaseMode === "cutover" || releaseMode === "vip-launch",
    "Stripe configuration suite requires an explicit release mode",
  );
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("Stripe configuration suite requires STRIPE_SECRET_KEY");
  }
  const Stripe = (await import("stripe")).default;
  const stripeWebhookEvents = loadTypeScriptModule(
    "lib/stripe-webhook-events.ts",
  );
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const endpoints = [];
  for await (const endpoint of stripe.webhookEndpoints.list({ limit: 100 })) {
    let parsed;
    try {
      parsed = new URL(endpoint.url);
    } catch {
      continue;
    }
    if (
      parsed.protocol === "https:" &&
      (parsed.hostname === "verzatv.com" || parsed.hostname === "www.verzatv.com") &&
      parsed.pathname === "/api/stripe/webhook"
    ) {
      endpoints.push(endpoint);
    }
  }
  assert.equal(endpoints.length, 1, "expected one canonical production Stripe endpoint");
  const endpoint = endpoints[0];
  assert.equal(endpoint.status, "enabled", "canonical Stripe endpoint is disabled");
  const required = new Set(stripeWebhookEvents.REQUIRED_STRIPE_WEBHOOK_EVENTS);
  const enabled = new Set(endpoint.enabled_events);
  assert.ok(!enabled.has("*"), "canonical endpoint must use an auditable exact event set");
  const missing = [...required].filter((eventType) => !enabled.has(eventType));
  const extra = [...enabled].filter((eventType) => !required.has(eventType));
  assert.deepEqual(
    missing,
    [],
    `canonical endpoint ${endpoint.id} is missing: ${missing.join(", ")}`,
  );
  assert.deepEqual(
    extra,
    [],
    `canonical endpoint ${endpoint.id} has non-canonical extras: ${extra.join(", ")}`,
  );
  assert.equal(
    process.env.STRIPE_CHECKOUT_TOS_CONSENT_REQUIRED,
    "true",
    "production Checkout must require hosted Terms consent after Dashboard setup",
  );
  const billingPortalPolicy = loadTypeScriptModule(
    "lib/billing-portal-policy.ts",
  );
  const configurationId =
    billingPortalPolicy.stripeBillingPortalConfigurationId();
  const configuration = await stripe.billingPortal.configurations.retrieve(
    configurationId,
  );
  billingPortalPolicy.assertCanonicalBillingPortalConfiguration(
    configuration,
    configurationId,
    /^(?:sk|rk)_live_/.test(process.env.STRIPE_SECRET_KEY),
  );
  const vipReleasePolicy = loadTypeScriptModule("lib/vip-release-policy.ts");
  if (releaseMode === "cutover") {
    for (const name of [
      "VIP_TRANSACTIONAL_NOTICES_ENABLED",
      "VIP_ANNUAL_RENEWAL_NOTICES_ENABLED",
      "VIP_YEARLY_CHECKOUT_ENABLED",
    ]) {
      assert.equal(
        process.env[name],
        "false",
        `${name} must be explicitly false for the payment cutover gate`,
      );
    }
    assert.equal(
      vipReleasePolicy.vipSubscriptionCheckoutEnabled(),
      false,
      "the initial payment cutover must not expose monthly VIP Checkout",
    );
    assert.equal(
      vipReleasePolicy.vipYearlyCheckoutEnabled(),
      false,
      "the initial payment cutover must not expose yearly VIP Checkout",
    );
  } else {
    assert.equal(
      vipReleasePolicy.vipSubscriptionCheckoutEnabled(),
      true,
      "VIP Checkout must have application-owned transactional notices enabled",
    );
    assert.equal(
      vipReleasePolicy.vipYearlyCheckoutEnabled(),
      true,
      "yearly VIP requires the secured annual reminder path",
    );
  }
  console.log(`Stripe webhook configuration suite: PASS (${endpoint.id})`);
  console.log(`Stripe Billing Portal configuration suite: PASS (${configuration.id})`);
  console.log(
    releaseMode === "cutover"
      ? "VIP release gates: PASS (monthly + yearly explicitly disabled)"
      : "VIP notice release gates: PASS (transactional + annual)",
  );
}

function sqlLiteral(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

async function runDatabaseSuite() {
  const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!accessToken || !supabaseUrl) {
    throw new Error(
      "Database suite requires SUPABASE_ACCESS_TOKEN and SUPABASE_URL",
    );
  }
  const projectRef = new URL(supabaseUrl).hostname.split(".")[0];
  if (!/^[a-z0-9]+$/.test(projectRef)) {
    throw new Error("Could not derive a safe Supabase project ref");
  }

  const migrations = ["009", "010", "011", "012", "013", "014", "015"].map((prefix) => {
    const filename = join(
      ROOT,
      "supabase/migrations",
      {
        "009": "009_preserve_sales_ledger.sql",
        "010": "010_payment_integrity.sql",
        "011": "011_rls_least_privilege.sql",
        "012": "012_payment_account_tombstones.sql",
        "013": "013_stripe_dispute_ledger.sql",
        "014": "014_payment_notices_and_content_rls.sql",
        "015": "015_apple_iap_series_unlocks.sql",
      }[prefix],
    );
    return readFileSync(filename, "utf8");
  });

  const suffix = `test_${Date.now()}_${process.pid}`;
  const eventId = `evt_${suffix}`;
  const staleEventId = `evt_stale_${suffix}`;
  const sessionId = `cs_${suffix}`;
  const paymentIntentId = `pi_${suffix}`;
  const appleGuardSessionId = `cs_apple_guard_${suffix}`;
  const appleGuardPaymentIntentId = `pi_apple_guard_${suffix}`;
  const disputeSessionId = `in_${suffix}`;
  const disputePaymentIntentId = `pi_dispute_${suffix}`;
  const disputeId = `dp_${suffix}`;
  const chargeId = `ch_${suffix}`;
  const seriesDisputeSessionId = `cs_series_dispute_${suffix}`;
  const seriesDisputePaymentIntentId = `pi_series_dispute_${suffix}`;
  const seriesDisputeId = `dp_series_${suffix}`;
  const seriesDisputeChargeId = `ch_series_${suffix}`;
  const orphanPaymentIntentId = `pi_orphan_${suffix}`;
  const orphanRefundId = `re_orphan_${suffix}`;
  const orphanDisputeId = `dp_orphan_${suffix}`;
  const orphanChargeId = `ch_orphan_${suffix}`;
  const vipSubscriptionId = `sub_${suffix}`;
  const customerId = `cus_${suffix}`;
  const otherCustomerId = `cus_other_${suffix}`;
  const userId = "10000000-0000-4000-8000-000000000001";
  const otherUserId = "10000000-0000-4000-8000-000000000002";
  const appleOriginalTransactionId = `${Date.now()}${process.pid}`;
  const appleDeleteOriginalTransactionId = `${Date.now()}${process.pid}9`;
  const appleDeleteSessionId = `cs_apple_delete_${suffix}`;
  const appleDeletePaymentIntentId = `pi_apple_delete_${suffix}`;
  const appleAlternateOriginalA = `${Date.now()}${process.pid}11`;
  const appleAlternateOriginalB = `${Date.now()}${process.pid}12`;
  const appleRestoreOriginalTransactionId = `${Date.now()}${process.pid}13`;

  const assertions = `
do $payment_tests$
declare
  claim_result text;
  refund_result record;
  dispute_result record;
  tombstone_result record;
  original_deleted_at timestamptz;
  test_user_id uuid := gen_random_uuid();
  delete_test_user_id uuid := gen_random_uuid();
  restore_test_user_id uuid := gen_random_uuid();
  series_purchase_id uuid;
  apple_guard_purchase_id uuid;
  apple_delete_purchase_id uuid;
  vip_purchase_id uuid;
  series_dispute_purchase_id uuid;
  access_result boolean;
  apple_result record;
  apple_claim_result text;
  apple_notification_id uuid := gen_random_uuid();
  orphan_refund_count integer;
  locked_table text;
begin
  insert into auth.users (
    id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) values (
    test_user_id, 'authenticated', 'authenticated',
    ${sqlLiteral(`payment-integrity-${suffix}@example.invalid`)}, '', now(),
    '{}'::jsonb, '{}'::jsonb, now(), now()
  );
  insert into auth.users (
    id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) values (
    restore_test_user_id, 'authenticated', 'authenticated',
    ${sqlLiteral(`payment-restore-${suffix}@example.invalid`)}, '', now(),
    '{}'::jsonb, '{}'::jsonb, now(), now()
  );
  insert into auth.users (
    id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) values (
    delete_test_user_id, 'authenticated', 'authenticated',
    ${sqlLiteral(`payment-delete-${suffix}@example.invalid`)}, '', now(),
    '{}'::jsonb, '{}'::jsonb, now(), now()
  );

  insert into public.entitlements (
    user_id, series_slug, purchase_id, expires_at
  ) values (
    test_user_id, 'manual-review-entitlement', null, null
  );

  -- A provider event can race the multi-step account-deletion flow after its
  -- guard is set. The guard may then be cleared because a later deletion step
  -- failed. Keep the durable purchase/account binding while the profile still
  -- exists, withhold access during the guard, and prove an exact replay can
  -- recover the entitlement after rollback of the deletion attempt.
  select * into apple_result from public.record_apple_series_transaction(
    ${sqlLiteral(`${appleOriginalTransactionId}01`)},
    ${sqlLiteral(appleOriginalTransactionId)},
    test_user_id, test_user_id, false,
    'com.verzatv.app.series.the_ceo', 'the-ceo', 'Production', 'active',
    now() - interval '5 minutes', now() - interval '4 minutes', null,
    1990, 'usd', repeat('a', 64)
  );
  if not apple_result.purchase_active
     or not apple_result.access_granted
     or apple_result.canonical_status <> 'active'
     or apple_result.account_rebound then
    raise exception 'initial Apple transaction did not grant exact-account access';
  end if;

  update public.profiles
    set deletion_requested_at = now()
    where id = test_user_id;
  select * into apple_result from public.record_apple_series_transaction(
    ${sqlLiteral(`${appleOriginalTransactionId}01`)},
    ${sqlLiteral(appleOriginalTransactionId)},
    test_user_id, test_user_id, false,
    'com.verzatv.app.series.the_ceo', 'the-ceo', 'Production', 'active',
    now() - interval '5 minutes', now() - interval '2 minutes', null,
    1990, 'usd', repeat('b', 64)
  );
  if apple_result.access_granted then
    raise exception 'Apple event granted access while account deletion was guarded';
  end if;
  if (select user_id from public.apple_iap_purchases
      where original_transaction_id = ${sqlLiteral(appleOriginalTransactionId)})
      is distinct from test_user_id then
    raise exception 'deletion guard orphaned the durable Apple account binding';
  end if;

  update public.profiles
    set deletion_requested_at = null
    where id = test_user_id;
  select * into apple_result from public.record_apple_series_transaction(
    ${sqlLiteral(`${appleOriginalTransactionId}01`)},
    ${sqlLiteral(appleOriginalTransactionId)},
    test_user_id, test_user_id, false,
    'com.verzatv.app.series.the_ceo', 'the-ceo', 'Production', 'active',
    now() - interval '5 minutes', now() - interval '1 minute', null,
    1990, 'usd', repeat('c', 64)
  );
  if not apple_result.purchase_active
     or not apple_result.access_granted
     or apple_result.canonical_status <> 'active'
     or not exists (
       select 1 from public.entitlements
       where user_id = test_user_id
         and series_slug = 'the-ceo'
         and apple_original_transaction_id = ${sqlLiteral(appleOriginalTransactionId)}
     ) then
    raise exception 'exact Apple replay did not recover after failed deletion';
  end if;

  -- A Stripe refund can race the same deletion guard. It is provider-specific:
  -- even while deletion is pending, deleting the Stripe source must preserve
  -- the independent Apple source in case a later deletion step fails.
  insert into public.purchases (
    user_id, type, series_slug, amount_cents, subtotal_cents, tax_cents,
    total_cents, currency, status, stripe_session_id, stripe_payment_intent
  ) values (
    test_user_id, 'series_unlock', 'the-ceo', 199, 199, 0,
    199, 'usd', 'completed', ${sqlLiteral(appleGuardSessionId)},
    ${sqlLiteral(appleGuardPaymentIntentId)}
  ) returning id into apple_guard_purchase_id;
  access_result := public.grant_series_entitlement_for_purchase(
    apple_guard_purchase_id, test_user_id, 'the-ceo'
  );
  if not access_result or not exists (
    select 1 from public.entitlements
    where user_id = test_user_id
      and series_slug = 'the-ceo'
      and purchase_id = apple_guard_purchase_id
      and apple_original_transaction_id = ${sqlLiteral(appleOriginalTransactionId)}
  ) then
    raise exception 'mixed Stripe/Apple deletion-race fixture did not grant';
  end if;

  update public.profiles
    set deletion_requested_at = now()
    where id = test_user_id;
  select * into refund_result from public.reconcile_purchase_refund(
    ${sqlLiteral(appleGuardPaymentIntentId)}, 199
  );
  if refund_result.purchase_status <> 'refunded'
     or not exists (
       select 1 from public.entitlements
       where user_id = test_user_id
         and series_slug = 'the-ceo'
         and purchase_id is null
         and apple_original_transaction_id = ${sqlLiteral(appleOriginalTransactionId)}
     ) then
    raise exception 'guarded Stripe refund destroyed independent Apple access';
  end if;
  update public.profiles
    set deletion_requested_at = null
    where id = test_user_id;
  if not exists (
    select 1 from public.entitlements
    where user_id = test_user_id
      and series_slug = 'the-ceo'
      and apple_original_transaction_id = ${sqlLiteral(appleOriginalTransactionId)}
  ) then
    raise exception 'failed deletion did not retain Apple access after Stripe refund';
  end if;

  -- Refund/reversal is monotonic. Neither an older nor equal-clock active
  -- device replay may resurrect a newer refund; a genuinely later reversal may.
  select * into apple_result from public.record_apple_series_transaction(
    ${sqlLiteral(`${appleOriginalTransactionId}01`)},
    ${sqlLiteral(appleOriginalTransactionId)},
    test_user_id, test_user_id, false,
    'com.verzatv.app.series.the_ceo', 'the-ceo', 'Production', 'refunded',
    now() - interval '5 minutes', now(), now(),
    1990, 'usd', repeat('4', 64)
  );
  if apple_result.purchase_active or apple_result.access_granted
     or apple_result.canonical_status <> 'refunded'
     or exists (
       select 1 from public.entitlements
       where user_id = test_user_id and series_slug = 'the-ceo'
     ) then
    raise exception 'Apple refund did not revoke Apple-only access';
  end if;
  select * into apple_result from public.record_apple_series_transaction(
    ${sqlLiteral(`${appleOriginalTransactionId}01`)},
    ${sqlLiteral(appleOriginalTransactionId)},
    test_user_id, test_user_id, false,
    'com.verzatv.app.series.the_ceo', 'the-ceo', 'Production', 'active',
    now() - interval '5 minutes', now() - interval '30 seconds', null,
    1990, 'usd', repeat('5', 64)
  );
  if apple_result.purchase_active or apple_result.access_granted
     or apple_result.canonical_status <> 'refunded' then
    raise exception 'stale Apple active replay resurrected a refund';
  end if;
  select * into apple_result from public.record_apple_series_transaction(
    ${sqlLiteral(`${appleOriginalTransactionId}01`)},
    ${sqlLiteral(appleOriginalTransactionId)},
    test_user_id, test_user_id, false,
    'com.verzatv.app.series.the_ceo', 'the-ceo', 'Production', 'active',
    now() - interval '5 minutes', now(), null,
    1990, 'usd', repeat('6', 64)
  );
  if apple_result.purchase_active or apple_result.access_granted
     or apple_result.canonical_status <> 'refunded' then
    raise exception 'equal-clock Apple active replay resurrected a refund';
  end if;
  select * into apple_result from public.record_apple_series_transaction(
    ${sqlLiteral(`${appleOriginalTransactionId}01`)},
    ${sqlLiteral(appleOriginalTransactionId)},
    test_user_id, test_user_id, false,
    'com.verzatv.app.series.the_ceo', 'the-ceo', 'Production', 'active',
    now() - interval '5 minutes', now() + interval '1 second', null,
    1990, 'usd', repeat('7', 64)
  );
  if not apple_result.purchase_active or not apple_result.access_granted
     or apple_result.canonical_status <> 'active' then
    raise exception 'later Apple refund reversal did not restore access';
  end if;

  -- A manual/support source survives an Apple refund of the same title.
  update public.entitlements
    set manual_grant = true
    where user_id = test_user_id and series_slug = 'the-ceo';
  select * into apple_result from public.record_apple_series_transaction(
    ${sqlLiteral(`${appleOriginalTransactionId}01`)},
    ${sqlLiteral(appleOriginalTransactionId)},
    test_user_id, test_user_id, false,
    'com.verzatv.app.series.the_ceo', 'the-ceo', 'Production', 'refunded',
    now() - interval '5 minutes', now() + interval '2 seconds', now(),
    1990, 'usd', repeat('8', 64)
  );
  if apple_result.purchase_active or not apple_result.access_granted
     or not exists (
       select 1 from public.entitlements
       where user_id = test_user_id
         and series_slug = 'the-ceo'
         and purchase_id is null
         and apple_original_transaction_id is null
         and manual_grant
     ) then
    raise exception 'Apple refund removed an independent manual grant';
  end if;

  -- Two separately verified Apple originals can back the same title. Revoking
  -- the selected source must fall back to the other active purchase.
  select * into apple_result from public.record_apple_series_transaction(
    ${sqlLiteral(`${appleAlternateOriginalA}01`)},
    ${sqlLiteral(appleAlternateOriginalA)},
    test_user_id, test_user_id, false,
    'com.verzatv.app.series.the_crown', 'the-crown', 'Production', 'active',
    now() - interval '5 minutes', now() - interval '4 minutes', null,
    1990, 'usd', repeat('9', 64)
  );
  select * into apple_result from public.record_apple_series_transaction(
    ${sqlLiteral(`${appleAlternateOriginalB}01`)},
    ${sqlLiteral(appleAlternateOriginalB)},
    test_user_id, test_user_id, false,
    'com.verzatv.app.series.the_crown', 'the-crown', 'Production', 'active',
    now() - interval '3 minutes', now() - interval '2 minutes', null,
    1990, 'usd', repeat('a', 64)
  );
  if (select apple_original_transaction_id from public.entitlements
      where user_id = test_user_id and series_slug = 'the-crown')
      <> ${sqlLiteral(appleAlternateOriginalB)} then
    raise exception 'newer independent Apple purchase was not selected';
  end if;
  select * into apple_result from public.record_apple_series_transaction(
    ${sqlLiteral(`${appleAlternateOriginalB}01`)},
    ${sqlLiteral(appleAlternateOriginalB)},
    test_user_id, test_user_id, false,
    'com.verzatv.app.series.the_crown', 'the-crown', 'Production', 'refunded',
    now() - interval '3 minutes', now(), now(),
    1990, 'usd', repeat('b', 64)
  );
  if not apple_result.access_granted
     or (select apple_original_transaction_id from public.entitlements
         where user_id = test_user_id and series_slug = 'the-crown')
        <> ${sqlLiteral(appleAlternateOriginalA)} then
    raise exception 'Apple refund did not fall back to another active original';
  end if;
  begin
    delete from public.apple_iap_purchases
      where original_transaction_id = ${sqlLiteral(appleAlternateOriginalA)};
    raise exception 'referenced Apple ledger row was deleted';
  exception when foreign_key_violation then null;
  end;

  -- A live VERZA owner cannot be displaced. After its profile is actually
  -- deleted, the same signed purchase-time token may be explicitly rebound.
  select * into apple_result from public.record_apple_series_transaction(
    ${sqlLiteral(`${appleRestoreOriginalTransactionId}01`)},
    ${sqlLiteral(appleRestoreOriginalTransactionId)},
    restore_test_user_id, restore_test_user_id, false,
    'com.verzatv.app.series.twist_of_time', 'twist-of-time', 'Production', 'active',
    now() - interval '5 minutes', now() - interval '4 minutes', null,
    1990, 'usd', repeat('c', 64)
  );
  begin
    perform * from public.record_apple_series_transaction(
      ${sqlLiteral(`${appleRestoreOriginalTransactionId}01`)},
      ${sqlLiteral(appleRestoreOriginalTransactionId)},
      restore_test_user_id, test_user_id, true,
      'com.verzatv.app.series.twist_of_time', 'twist-of-time', 'Production', 'active',
      now() - interval '5 minutes', now() - interval '3 minutes', null,
      1990, 'usd', repeat('d', 64)
    );
    raise exception 'live Apple purchase owner was displaced';
  exception when others then
    if sqlerrm = 'live Apple purchase owner was displaced' then raise; end if;
  end;
  delete from auth.users where id = restore_test_user_id;
  if (select user_id from public.apple_iap_purchases
      where original_transaction_id = ${sqlLiteral(appleRestoreOriginalTransactionId)})
      is not null then
    raise exception 'deleted Apple purchase owner was not orphaned';
  end if;
  begin
    perform * from public.record_apple_series_transaction(
      ${sqlLiteral(`${appleRestoreOriginalTransactionId}01`)},
      ${sqlLiteral(appleRestoreOriginalTransactionId)},
      restore_test_user_id, test_user_id, false,
      'com.verzatv.app.series.twist_of_time', 'twist-of-time', 'Production', 'active',
      now() - interval '5 minutes', now() - interval '2 minutes', null,
      1990, 'usd', repeat('e', 64)
    );
    raise exception 'orphaned Apple purchase rebound without explicit restore';
  exception when others then
    if sqlerrm = 'orphaned Apple purchase rebound without explicit restore' then raise; end if;
  end;
  select * into apple_result from public.record_apple_series_transaction(
    ${sqlLiteral(`${appleRestoreOriginalTransactionId}01`)},
    ${sqlLiteral(appleRestoreOriginalTransactionId)},
    restore_test_user_id, test_user_id, true,
    'com.verzatv.app.series.twist_of_time', 'twist-of-time', 'Production', 'active',
    now() - interval '5 minutes', now() - interval '1 minute', null,
    1990, 'usd', repeat('f', 64)
  );
  if not apple_result.account_rebound or not apple_result.access_granted
     or (select user_id from public.apple_iap_purchases
         where original_transaction_id = ${sqlLiteral(appleRestoreOriginalTransactionId)})
        is distinct from test_user_id
     or (select app_account_token_sha256 from public.apple_iap_purchases
         where original_transaction_id = ${sqlLiteral(appleRestoreOriginalTransactionId)})
        <> encode(extensions.digest(lower(restore_test_user_id::text), 'sha256'), 'hex') then
    raise exception 'explicit deleted-account Apple rebind failed or changed token identity';
  end if;

  -- Notification claims are idempotent and retry-safe.
  apple_claim_result := public.claim_apple_iap_notification(
    apple_notification_id, 'ONE_TIME_CHARGE', null, 'Production', now()
  );
  if apple_claim_result <> 'acquired' then
    raise exception 'Apple notification claim was not acquired';
  end if;
  apple_claim_result := public.claim_apple_iap_notification(
    apple_notification_id, 'ONE_TIME_CHARGE', null, 'Production', now()
  );
  if apple_claim_result <> 'busy' then
    raise exception 'concurrent Apple notification claim was not busy';
  end if;
  if not public.finish_apple_iap_notification(
    apple_notification_id, 'processed', ${sqlLiteral(appleOriginalTransactionId)}, null
  ) then
    raise exception 'Apple notification did not finish';
  end if;
  apple_claim_result := public.claim_apple_iap_notification(
    apple_notification_id, 'ONE_TIME_CHARGE', null, 'Production', now()
  );
  if apple_claim_result <> 'processed' then
    raise exception 'processed Apple notification was not idempotent';
  end if;

  -- A successful profile FK cascade is the only all-source deletion path. A
  -- live profile must preserve Apple/manual sources from a provider-specific
  -- DELETE even while deletion_requested_at is set; only actual parent deletion
  -- removes the entitlement and pseudonymizes the retained Apple ledger.
  select * into apple_result from public.record_apple_series_transaction(
    ${sqlLiteral(`${appleDeleteOriginalTransactionId}01`)},
    ${sqlLiteral(appleDeleteOriginalTransactionId)},
    delete_test_user_id, delete_test_user_id, false,
    'com.verzatv.app.series.she_is_mine', 'she-is-mine', 'Production', 'active',
    now() - interval '5 minutes', now() - interval '4 minutes', null,
    1990, 'usd', repeat('d', 64)
  );
  insert into public.purchases (
    user_id, type, series_slug, amount_cents, subtotal_cents, tax_cents,
    total_cents, currency, status, stripe_session_id, stripe_payment_intent
  ) values (
    delete_test_user_id, 'series_unlock', 'she-is-mine', 199, 199, 0,
    199, 'usd', 'completed', ${sqlLiteral(appleDeleteSessionId)},
    ${sqlLiteral(appleDeletePaymentIntentId)}
  ) returning id into apple_delete_purchase_id;
  access_result := public.grant_series_entitlement_for_purchase(
    apple_delete_purchase_id, delete_test_user_id, 'she-is-mine'
  );
  update public.entitlements
    set manual_grant = true
    where user_id = delete_test_user_id
      and series_slug = 'she-is-mine';
  if not access_result or not exists (
    select 1 from public.entitlements
    where user_id = delete_test_user_id
      and series_slug = 'she-is-mine'
      and purchase_id = apple_delete_purchase_id
      and apple_original_transaction_id = ${sqlLiteral(appleDeleteOriginalTransactionId)}
      and manual_grant
  ) then
    raise exception 'all-source account deletion fixture did not grant';
  end if;

  update public.profiles
    set deletion_requested_at = now()
    where id = delete_test_user_id;
  delete from public.entitlements
    where user_id = delete_test_user_id
      and series_slug = 'she-is-mine';
  if not exists (
    select 1 from public.entitlements
    where user_id = delete_test_user_id
      and series_slug = 'she-is-mine'
      and purchase_id is null
      and apple_original_transaction_id = ${sqlLiteral(appleDeleteOriginalTransactionId)}
      and manual_grant
  ) then
    raise exception 'guarded provider delete destroyed independent sources';
  end if;
  update public.profiles
    set deletion_requested_at = null
    where id = delete_test_user_id;
  if not exists (
    select 1 from public.entitlements
    where user_id = delete_test_user_id
      and series_slug = 'she-is-mine'
      and apple_original_transaction_id = ${sqlLiteral(appleDeleteOriginalTransactionId)}
      and manual_grant
  ) then
    raise exception 'failed deletion guard clear did not preserve access sources';
  end if;

  update public.profiles
    set deletion_requested_at = now()
    where id = delete_test_user_id;
  delete from auth.users where id = delete_test_user_id;
  if exists (
       select 1 from public.profiles where id = delete_test_user_id
     ) or exists (
       select 1 from public.entitlements where user_id = delete_test_user_id
     ) then
    raise exception 'successful account deletion did not cascade account-owned access';
  end if;
  if not exists (
    select 1 from public.apple_iap_purchases
    where original_transaction_id = ${sqlLiteral(appleDeleteOriginalTransactionId)}
      and user_id is null
      and status = 'active'
  ) then
    raise exception 'successful account deletion did not retain an orphaned Apple ledger';
  end if;

  select count(*) into orphan_refund_count
    from public.reconcile_purchase_refund(
      ${sqlLiteral(orphanPaymentIntentId)}, 199
    );
  if orphan_refund_count <> 0 then
    raise exception 'unmatched refund unexpectedly reconciled a purchase';
  end if;
  insert into public.stripe_refunds (
    stripe_refund_id, stripe_charge_id, stripe_payment_intent, purchase_id,
    amount_cents, currency, status
  ) values (
    ${sqlLiteral(orphanRefundId)}, ${sqlLiteral(orphanChargeId)},
    ${sqlLiteral(orphanPaymentIntentId)}, null, 199, 'usd', 'succeeded'
  );
  if not exists (
    select 1 from public.stripe_refunds
    where stripe_refund_id = ${sqlLiteral(orphanRefundId)}
      and purchase_id is null
  ) then raise exception 'unmatched refund evidence was not retained'; end if;

  select * into dispute_result from public.reconcile_stripe_dispute(
    ${sqlLiteral(orphanDisputeId)}, ${sqlLiteral(orphanChargeId)},
    ${sqlLiteral(orphanPaymentIntentId)}, 199, 'usd', 'needs_response',
    'fraudulent', true, 0, 10, 'evt_orphan_dispute', true
  );
  if not dispute_result.applied
     or dispute_result.linked_purchase_id is not null
     or dispute_result.linked_purchase_user_id is not null
     or dispute_result.reconciled_purchase_status is not null then
    raise exception 'unmatched dispute incorrectly linked financial access';
  end if;
  if not exists (
    select 1 from public.stripe_disputes
    where stripe_dispute_id = ${sqlLiteral(orphanDisputeId)}
      and purchase_id is null
      and stripe_payment_intent = ${sqlLiteral(orphanPaymentIntentId)}
  ) then raise exception 'unmatched dispute evidence was not retained'; end if;
  if not exists (
    select 1 from public.entitlements
    where user_id = test_user_id
      and series_slug = 'manual-review-entitlement'
      and purchase_id is null
  ) then raise exception 'unmatched provider event changed unrelated access'; end if;

  insert into public.vip_checkout_consents (
    checkout_session_id, subscription_id, stripe_customer_id, user_id,
    terms_version, terms_accepted, provider_session_created_at
  ) values (
    ${sqlLiteral(sessionId)}, ${sqlLiteral(vipSubscriptionId)},
    ${sqlLiteral(customerId)}, test_user_id, '2026-08-03', true, now()
  );
  begin
    insert into public.vip_checkout_consents (
      checkout_session_id, subscription_id, stripe_customer_id, user_id,
      terms_version, terms_accepted, provider_session_created_at
    ) values (
      'cs_bad_consent', 'sub_bad_consent', 'cus_bad_consent', test_user_id,
      '2026-08-03', false, now()
    );
    raise exception 'unaccepted VIP consent was recorded';
  exception when check_violation then null;
  end;

  insert into public.payment_notices (
    notice_type, provider_reference, subscription_id, user_id,
    recipient_email_sha256, amount_cents, currency, period_end,
    terms_version, payload, status, sent_at, provider_message_id
  ) values (
    'vip_initial_acknowledgment', ${sqlLiteral(disputeSessionId)},
    ${sqlLiteral(vipSubscriptionId)}, test_user_id,
    repeat('a', 64), 199, 'usd', now() + interval '1 year',
    '2026-08-03', '{"plan":"yearly"}'::jsonb, 'sent', now(), 'email_fixture'
  );
  begin
    insert into public.payment_notices (
      notice_type, provider_reference, subscription_id, user_id,
      recipient_email_sha256, amount_cents, currency
    ) values (
      'vip_initial_acknowledgment', ${sqlLiteral(disputeSessionId)},
      ${sqlLiteral(vipSubscriptionId)}, test_user_id,
      repeat('a', 64), 199, 'usd'
    );
    raise exception 'duplicate VIP notice was accepted';
  exception when unique_violation then null;
  end;

  claim_result := public.claim_stripe_webhook_event(
    ${sqlLiteral(eventId)}, 'checkout.session.completed', ${sqlLiteral(sessionId)}
  );
  if claim_result <> 'acquired' then raise exception 'event claim was not acquired'; end if;
  claim_result := public.claim_stripe_webhook_event(
    ${sqlLiteral(eventId)}, 'checkout.session.completed', ${sqlLiteral(sessionId)}
  );
  if claim_result <> 'busy' then raise exception 'concurrent duplicate was not busy'; end if;
  update public.stripe_webhook_events
    set status = 'processed', processed_at = now(), updated_at = now()
    where event_id = ${sqlLiteral(eventId)};
  claim_result := public.claim_stripe_webhook_event(
    ${sqlLiteral(eventId)}, 'checkout.session.completed', ${sqlLiteral(sessionId)}
  );
  if claim_result <> 'processed' then raise exception 'processed duplicate was not idempotent'; end if;

  claim_result := public.claim_stripe_webhook_event(
    ${sqlLiteral(staleEventId)}, 'invoice.paid', ${sqlLiteral(disputeSessionId)}
  );
  update public.stripe_webhook_events
    set status = 'failed', updated_at = now() - interval '11 minutes'
    where event_id = ${sqlLiteral(staleEventId)};
  claim_result := public.claim_stripe_webhook_event(
    ${sqlLiteral(staleEventId)}, 'invoice.paid', ${sqlLiteral(disputeSessionId)}
  );
  if claim_result <> 'acquired' then raise exception 'failed event retry was not acquired'; end if;

  insert into public.purchases (
    user_id, type, series_slug, amount_cents, subtotal_cents, tax_cents,
    total_cents, currency, status, stripe_session_id, stripe_payment_intent
  ) values (
    test_user_id, 'series_unlock', 'payment-integrity-test', 219, 199, 20,
    219, 'usd', 'completed', ${sqlLiteral(sessionId)}, ${sqlLiteral(paymentIntentId)}
  ) returning id into series_purchase_id;

  access_result := public.grant_series_entitlement_for_purchase(
    series_purchase_id, test_user_id, 'payment-integrity-test'
  );
  if not access_result or not exists (
    select 1 from public.entitlements where purchase_id = series_purchase_id
  ) then raise exception 'canonical purchase did not grant entitlement'; end if;

  select * into refund_result
    from public.reconcile_purchase_refund(${sqlLiteral(paymentIntentId)}, 100);
  if refund_result.refund_delta_cents <> 100
     or refund_result.total_refunded_cents <> 100
     or refund_result.purchase_subtotal_cents <> 199
     or refund_result.purchase_tax_cents <> 20
     or refund_result.purchase_total_cents <> 219
     or refund_result.purchase_status <> 'partially_refunded' then
    raise exception 'partial tax-aware refund reconciliation failed';
  end if;
  if not exists (
    select 1 from public.entitlements where purchase_id = series_purchase_id
  ) then raise exception 'partial refund incorrectly revoked entitlement'; end if;
  select * into refund_result
    from public.reconcile_purchase_refund(${sqlLiteral(paymentIntentId)}, 100);
  if refund_result.refund_delta_cents <> 0 then
    raise exception 'duplicate cumulative refund was not idempotent';
  end if;
  select * into refund_result
    from public.reconcile_purchase_refund(${sqlLiteral(paymentIntentId)}, 219);
  if refund_result.refund_delta_cents <> 119
     or refund_result.purchase_status <> 'refunded' then
    raise exception 'full refund reconciliation failed';
  end if;
  if exists (
    select 1 from public.entitlements where purchase_id = series_purchase_id
  ) then raise exception 'full refund did not revoke entitlement'; end if;
  access_result := public.grant_series_entitlement_for_purchase(
    series_purchase_id, test_user_id, 'payment-integrity-test'
  );
  if access_result then raise exception 'refunded purchase restored entitlement'; end if;

  begin
    insert into public.purchases (
      type, amount_cents, subtotal_cents, tax_cents, total_cents, currency, status
    ) values ('series_unlock', 220, 199, 20, 220, 'usd', 'completed');
    raise exception 'bad financial arithmetic was accepted';
  exception when check_violation then null;
  end;

  update public.profiles
    set is_vip = true,
        vip_expires_at = now() + interval '30 days',
        stripe_subscription_id = ${sqlLiteral(vipSubscriptionId)},
        vip_payment_blocked = false,
        vip_cancel_at_period_end = false
    where id = test_user_id;

  insert into public.purchases (
    user_id, type, series_slug, amount_cents, subtotal_cents, tax_cents,
    total_cents, currency, status, stripe_session_id, stripe_payment_intent,
    metadata
  ) values (
    test_user_id, 'vip_renewal', null, 199, 199, 0,
    199, 'usd', 'completed', ${sqlLiteral(disputeSessionId)}, ${sqlLiteral(disputePaymentIntentId)},
    jsonb_build_object('subscription_id', ${sqlLiteral(vipSubscriptionId)})
  ) returning id into vip_purchase_id;

  select * into dispute_result from public.reconcile_stripe_dispute(
    ${sqlLiteral(disputeId)}, ${sqlLiteral(chargeId)}, ${sqlLiteral(disputePaymentIntentId)},
    199, 'usd', 'needs_response', 'fraudulent', true, 0, 100, 'evt_dispute_open', false
  );
  if not dispute_result.applied or dispute_result.reconciled_purchase_status <> 'disputed' then
    raise exception 'initial dispute state failed';
  end if;
  if not (select vip_payment_blocked from public.profiles where id = test_user_id)
     or (select is_vip from public.profiles where id = test_user_id) then
    raise exception 'open VIP dispute did not block access';
  end if;
  select * into dispute_result from public.reconcile_stripe_dispute(
    ${sqlLiteral(disputeId)}, ${sqlLiteral(chargeId)}, ${sqlLiteral(disputePaymentIntentId)},
    199, 'usd', 'needs_response', 'fraudulent', true, 0, 100, 'evt_dispute_open', false
  );
  if dispute_result.applied then raise exception 'exact duplicate dispute event reapplied'; end if;
  select * into dispute_result from public.reconcile_stripe_dispute(
    ${sqlLiteral(disputeId)}, ${sqlLiteral(chargeId)}, ${sqlLiteral(disputePaymentIntentId)},
    199, 'usd', 'won', 'fraudulent', false, 0, 99, 'evt_dispute_stale_win', false
  );
  if dispute_result.applied or dispute_result.reconciled_dispute_status <> 'needs_response' then
    raise exception 'older dispute event regressed provider state';
  end if;
  select * into dispute_result from public.reconcile_stripe_dispute(
    ${sqlLiteral(disputeId)}, ${sqlLiteral(chargeId)}, ${sqlLiteral(disputePaymentIntentId)},
    199, 'usd', 'won', 'fraudulent', false, 0, 100, 'evt_dispute_win', false
  );
  if not dispute_result.applied or dispute_result.reconciled_purchase_status <> 'completed' then
    raise exception 'same-second terminal dispute ordering failed';
  end if;
  access_result := public.restore_vip_access_after_payment_resolution(
    vip_purchase_id,
    test_user_id,
    ${sqlLiteral(vipSubscriptionId)},
    now() + interval '30 days',
    true
  );
  if not access_result
     or not (select is_vip from public.profiles where id = test_user_id)
     or (select vip_payment_blocked from public.profiles where id = test_user_id)
     or not (select vip_cancel_at_period_end from public.profiles where id = test_user_id) then
    raise exception 'won VIP dispute did not restore provider-backed cancellation state';
  end if;
  select * into dispute_result from public.reconcile_stripe_dispute(
    ${sqlLiteral(disputeId)}, ${sqlLiteral(chargeId)}, ${sqlLiteral(disputePaymentIntentId)},
    199, 'usd', 'lost', 'fraudulent', false, 0, 101, 'evt_dispute_lost', false
  );
  if dispute_result.reconciled_purchase_status <> 'disputed_lost' then
    raise exception 'lost dispute state failed';
  end if;
  if not (select vip_payment_blocked from public.profiles where id = test_user_id)
     or (select is_vip from public.profiles where id = test_user_id) then
    raise exception 'lost VIP dispute did not block access';
  end if;
  select * into dispute_result from public.reconcile_stripe_dispute(
    ${sqlLiteral(disputeId)}, ${sqlLiteral(chargeId)}, ${sqlLiteral(disputePaymentIntentId)},
    199, 'usd', 'won', 'fraudulent', false, 199, 102, 'evt_dispute_late_win', false
  );
  if dispute_result.reconciled_purchase_status <> 'refunded' then
    raise exception 'late won/refunded dispute state failed';
  end if;
  access_result := public.restore_vip_access_after_payment_resolution(
    vip_purchase_id,
    test_user_id,
    ${sqlLiteral(vipSubscriptionId)},
    now() + interval '30 days',
    false
  );
  if access_result then raise exception 'refunded VIP invoice restored access'; end if;

  insert into public.purchases (
    user_id, type, series_slug, amount_cents, subtotal_cents, tax_cents,
    total_cents, currency, status, stripe_session_id, stripe_payment_intent
  ) values (
    test_user_id, 'series_unlock', 'series-dispute-test', 199, 199, 0,
    199, 'usd', 'completed', ${sqlLiteral(seriesDisputeSessionId)},
    ${sqlLiteral(seriesDisputePaymentIntentId)}
  ) returning id into series_dispute_purchase_id;
  access_result := public.grant_series_entitlement_for_purchase(
    series_dispute_purchase_id, test_user_id, 'series-dispute-test'
  );
  if not access_result then raise exception 'series dispute fixture did not grant'; end if;

  select * into dispute_result from public.reconcile_stripe_dispute(
    ${sqlLiteral(seriesDisputeId)}, ${sqlLiteral(seriesDisputeChargeId)},
    ${sqlLiteral(seriesDisputePaymentIntentId)}, 199, 'usd', 'needs_response',
    'fraudulent', true, 0, 200, 'evt_series_dispute_open', true
  );
  if dispute_result.reconciled_purchase_status <> 'disputed'
     or exists (
       select 1 from public.entitlements
       where purchase_id = series_dispute_purchase_id
     ) then raise exception 'open series dispute did not revoke entitlement'; end if;

  select * into dispute_result from public.reconcile_stripe_dispute(
    ${sqlLiteral(seriesDisputeId)}, ${sqlLiteral(seriesDisputeChargeId)},
    ${sqlLiteral(seriesDisputePaymentIntentId)}, 199, 'usd', 'won',
    'fraudulent', false, 0, 201, 'evt_series_dispute_win', true
  );
  if dispute_result.reconciled_purchase_status <> 'completed'
     or not exists (
       select 1 from public.entitlements
       where purchase_id = series_dispute_purchase_id
     ) then raise exception 'won canonical series dispute did not restore entitlement'; end if;

  select * into dispute_result from public.reconcile_stripe_dispute(
    ${sqlLiteral(seriesDisputeId)}, ${sqlLiteral(seriesDisputeChargeId)},
    ${sqlLiteral(seriesDisputePaymentIntentId)}, 199, 'usd', 'lost',
    'fraudulent', false, 0, 199, 'evt_series_dispute_stale_loss', true
  );
  if dispute_result.applied
     or dispute_result.reconciled_purchase_status <> 'completed' then
    raise exception 'stale series dispute regressed restored access';
  end if;

  select * into tombstone_result
    from public.upsert_payment_account_tombstone(${sqlLiteral(userId)}::uuid, null);
  select deleted_at into original_deleted_at
    from public.payment_account_tombstones where user_id = ${sqlLiteral(userId)}::uuid;
  select * into tombstone_result
    from public.upsert_payment_account_tombstone(
      ${sqlLiteral(userId)}::uuid, ${sqlLiteral(customerId)}
    );
  if tombstone_result.stripe_customer_id <> ${sqlLiteral(customerId)} then
    raise exception 'tombstone did not coalesce Stripe Customer';
  end if;
  if (select deleted_at from public.payment_account_tombstones
      where user_id = ${sqlLiteral(userId)}::uuid) <> original_deleted_at then
    raise exception 'tombstone coalescing changed deletion time';
  end if;
  begin
    perform public.upsert_payment_account_tombstone(
      ${sqlLiteral(userId)}::uuid, ${sqlLiteral(otherCustomerId)}
    );
    raise exception 'conflicting customer was accepted';
  exception when others then
    if sqlerrm = 'conflicting customer was accepted' then raise; end if;
  end;
  begin
    perform public.upsert_payment_account_tombstone(
      ${sqlLiteral(otherUserId)}::uuid, ${sqlLiteral(customerId)}
    );
    raise exception 'cross-user customer reuse was accepted';
  exception when others then
    if sqlerrm = 'cross-user customer reuse was accepted' then raise; end if;
  end;

  if has_table_privilege('anon', 'public.stripe_disputes', 'SELECT')
     or has_table_privilege('authenticated', 'public.payment_account_tombstones', 'SELECT') then
    raise exception 'payment service tables are client-readable';
  end if;
  if has_table_privilege('anon', 'public.apple_iap_purchases', 'SELECT')
     or has_table_privilege('authenticated', 'public.apple_iap_purchases', 'SELECT')
     or has_table_privilege('anon', 'public.apple_iap_notifications', 'SELECT')
     or has_table_privilege('authenticated', 'public.apple_iap_notifications', 'SELECT')
     or has_table_privilege('service_role', 'public.apple_iap_purchases', 'DELETE')
     or has_table_privilege('service_role', 'public.apple_iap_notifications', 'DELETE') then
    raise exception 'Apple purchase/notification ledger privileges are too broad';
  end if;
  if has_table_privilege('anon', 'public.payment_notices', 'SELECT')
     or has_table_privilege('authenticated', 'public.vip_checkout_consents', 'SELECT') then
    raise exception 'VIP consent/notice evidence is client-readable';
  end if;
  if not has_table_privilege('service_role', 'public.payment_notices', 'SELECT')
     or not has_table_privilege('service_role', 'public.payment_notices', 'INSERT')
     or not has_table_privilege('service_role', 'public.payment_notices', 'UPDATE')
     or not has_table_privilege('service_role', 'public.vip_checkout_consents', 'SELECT')
     or not has_table_privilege('service_role', 'public.vip_checkout_consents', 'INSERT') then
    raise exception 'payment service role cannot operate VIP consent/notice ledgers';
  end if;
  foreach locked_table in array array[
    'channels', 'seasons', 'show_people', 'tags', 'show_tags', 'internal_links'
  ] loop
    if to_regclass(format('public.%I', locked_table)) is not null then
      if has_table_privilege('anon', format('public.%I', locked_table), 'SELECT')
         or has_table_privilege('authenticated', format('public.%I', locked_table), 'SELECT')
         or has_table_privilege('anon', format('public.%I', locked_table), 'INSERT')
         or has_table_privilege('authenticated', format('public.%I', locked_table), 'UPDATE')
         or has_table_privilege('authenticated', format('public.%I', locked_table), 'DELETE') then
        raise exception 'unused content table % retains a direct client privilege', locked_table;
      end if;
    end if;
  end loop;
  if not exists (
    select 1 from public.entitlements
    where user_id = test_user_id
      and series_slug = 'manual-review-entitlement'
      and purchase_id is null
  ) then
    raise exception 'nonfinancial review entitlement was deleted';
  end if;
end
$payment_tests$;
`;

  const query = [
    "begin;",
    ...migrations,
    ...migrations,
    assertions,
    "rollback;",
  ].join("\n\n");
  const response = await fetch(
    `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${accessToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ query }),
    },
  );
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`rollback-only database suite failed (${response.status}): ${body}`);
  }
  console.log("payment database suite: PASS (migrations 009-015 twice; transaction rolled back)");
}

runCodeAndCatalogSuite();
await runSeriesCheckoutHistorySuite();
await runSeriesProviderPaymentSuite();
await runStripeCustomerHistorySuite();
await runPaymentCapabilitiesSuite();
await runVipNoticeEmailSuite();
await runVipProviderPaymentSuite();
if (process.argv.includes("--database")) {
  await runDatabaseSuite();
}
const stripeConfigRequested = process.argv.includes("--stripe-config");
const stripeCutoverRequested = process.argv.includes("--stripe-cutover");
if (stripeConfigRequested && stripeCutoverRequested) {
  throw new Error("Choose either --stripe-config or --stripe-cutover, not both");
}
if (stripeConfigRequested) {
  await runStripeWebhookConfigSuite("vip-launch");
}
if (stripeCutoverRequested) {
  await runStripeWebhookConfigSuite("cutover");
}
