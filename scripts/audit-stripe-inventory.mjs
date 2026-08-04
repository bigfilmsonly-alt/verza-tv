#!/usr/bin/env node

import process from "node:process";
import Stripe from "stripe";

const secretKey = process.env.STRIPE_SECRET_KEY ?? "";
if (!/^(?:sk|rk)_live_/.test(secretKey)) {
  throw new Error("A live-mode Stripe key is required");
}

const stripe = new Stripe(secretKey);

async function collect(iterator) {
  const rows = [];
  for await (const row of iterator) rows.push(row);
  return rows;
}

function group(rows, selector) {
  return rows.reduce((result, row) => {
    const key = String(selector(row));
    result[key] = (result[key] ?? 0) + 1;
    return result;
  }, {});
}

function cents(rows, selector) {
  return rows.reduce((total, row) => total + (selector(row) ?? 0), 0);
}

function countOnly(rows) {
  return { inspected: true, count: rows.length };
}

async function inspect(name, load, summarize) {
  try {
    const rows = await load();
    return [name, summarize(rows)];
  } catch (error) {
    return [
      name,
      {
        inspected: false,
        errorType:
          error && typeof error === "object" && "type" in error
            ? String(error.type)
            : error instanceof Error
              ? error.name
              : "unknown",
      },
    ];
  }
}

const account = await stripe.accounts.retrieve();

const balance = await stripe.balance.retrieve();
const [balanceSettings, taxSettings] = await Promise.all([
  stripe.balanceSettings.retrieve(),
  stripe.tax.settings.retrieve(),
]);
const families = await Promise.all([
  inspect(
    "checkoutSessions",
    () => collect(stripe.checkout.sessions.list({ limit: 100 })),
    (rows) => ({
      inspected: true,
      count: rows.length,
      byMode: group(rows, (row) => row.mode ?? "unset"),
      byStatus: group(rows, (row) => row.status ?? "unset"),
      byPaymentStatus: group(rows, (row) => row.payment_status ?? "unset"),
      paidGrossCents: cents(
        rows.filter((row) => row.payment_status === "paid"),
        (row) => row.amount_total,
      ),
    }),
  ),
  inspect(
    "paymentIntents",
    () => collect(stripe.paymentIntents.list({ limit: 100 })),
    (rows) => ({
      inspected: true,
      count: rows.length,
      byStatus: group(rows, (row) => row.status),
      byCurrency: group(rows, (row) => row.currency),
      amountCents: cents(rows, (row) => row.amount),
      amountReceivedCents: cents(rows, (row) => row.amount_received),
    }),
  ),
  inspect(
    "charges",
    () => collect(stripe.charges.list({ limit: 100 })),
    (rows) => ({
      inspected: true,
      count: rows.length,
      byStatus: group(rows, (row) => row.status),
      grossSucceededCents: cents(
        rows.filter((row) => row.status === "succeeded"),
        (row) => row.amount,
      ),
      refundedCents: cents(rows, (row) => row.amount_refunded),
      disputedCount: rows.filter((row) => row.disputed).length,
    }),
  ),
  inspect(
    "refunds",
    () => collect(stripe.refunds.list({ limit: 100 })),
    (rows) => ({
      inspected: true,
      count: rows.length,
      byStatus: group(rows, (row) => row.status ?? "unset"),
      refundedCents: cents(rows, (row) => row.amount),
    }),
  ),
  inspect(
    "disputes",
    () => collect(stripe.disputes.list({ limit: 100 })),
    (rows) => ({
      inspected: true,
      count: rows.length,
      byStatus: group(rows, (row) => row.status),
      disputedCents: cents(rows, (row) => row.amount),
    }),
  ),
  inspect(
    "subscriptions",
    () => collect(stripe.subscriptions.list({ status: "all", limit: 100 })),
    (rows) => ({
      inspected: true,
      count: rows.length,
      byStatus: group(rows, (row) => row.status),
    }),
  ),
  inspect(
    "invoices",
    () => collect(stripe.invoices.list({ limit: 100 })),
    (rows) => ({
      inspected: true,
      count: rows.length,
      byStatus: group(rows, (row) => row.status ?? "unset"),
      paidCents: cents(rows, (row) => row.amount_paid),
      remainingCents: cents(rows, (row) => row.amount_remaining),
    }),
  ),
  inspect(
    "invoiceItems",
    () => collect(stripe.invoiceItems.list({ limit: 100 })),
    (rows) => ({ inspected: true, count: rows.length }),
  ),
  inspect(
    "creditNotes",
    () => collect(stripe.creditNotes.list({ limit: 100 })),
    (rows) => ({
      inspected: true,
      count: rows.length,
      byStatus: group(rows, (row) => row.status),
      amountCents: cents(rows, (row) => row.amount),
    }),
  ),
  inspect(
    "quotes",
    () => collect(stripe.quotes.list({ limit: 100 })),
    (rows) => ({
      inspected: true,
      count: rows.length,
      byStatus: group(rows, (row) => row.status),
    }),
  ),
  inspect(
    "customers",
    () => collect(stripe.customers.list({ limit: 100 })),
    (rows) => ({
      inspected: true,
      count: rows.length,
      delinquentCount: rows.filter((row) => row.delinquent).length,
    }),
  ),
  inspect(
    "products",
    () => collect(stripe.products.list({ limit: 100 })),
    (rows) => ({
      inspected: true,
      count: rows.length,
      activeCount: rows.filter((row) => row.active).length,
    }),
  ),
  inspect(
    "prices",
    () => collect(stripe.prices.list({ limit: 100 })),
    (rows) => ({
      inspected: true,
      count: rows.length,
      activeCount: rows.filter((row) => row.active).length,
      byType: group(rows, (row) => row.type),
      byCurrency: group(rows, (row) => row.currency),
    }),
  ),
  inspect(
    "plans",
    () => collect(stripe.plans.list({ limit: 100 })),
    (rows) => ({
      inspected: true,
      count: rows.length,
      activeCount: rows.filter((row) => row.active).length,
    }),
  ),
  inspect(
    "paymentLinks",
    () => collect(stripe.paymentLinks.list({ limit: 100 })),
    (rows) => ({
      inspected: true,
      count: rows.length,
      activeCount: rows.filter((row) => row.active).length,
    }),
  ),
  inspect(
    "coupons",
    () => collect(stripe.coupons.list({ limit: 100 })),
    (rows) => ({
      inspected: true,
      count: rows.length,
      validCount: rows.filter((row) => row.valid).length,
    }),
  ),
  inspect(
    "promotionCodes",
    () => collect(stripe.promotionCodes.list({ limit: 100 })),
    (rows) => ({
      inspected: true,
      count: rows.length,
      activeCount: rows.filter((row) => row.active).length,
    }),
  ),
  inspect(
    "setupIntents",
    () => collect(stripe.setupIntents.list({ limit: 100 })),
    (rows) => ({
      inspected: true,
      count: rows.length,
      byStatus: group(rows, (row) => row.status),
    }),
  ),
  inspect(
    "taxRates",
    () => collect(stripe.taxRates.list({ limit: 100 })),
    (rows) => ({
      inspected: true,
      count: rows.length,
      activeCount: rows.filter((row) => row.active).length,
    }),
  ),
  inspect(
    "shippingRates",
    () => collect(stripe.shippingRates.list({ limit: 100 })),
    (rows) => ({
      inspected: true,
      count: rows.length,
      activeCount: rows.filter((row) => row.active).length,
    }),
  ),
  inspect(
    "balanceTransactions",
    () => collect(stripe.balanceTransactions.list({ limit: 100 })),
    (rows) => ({
      inspected: true,
      count: rows.length,
      byType: group(rows, (row) => row.type),
      grossCents: cents(rows, (row) => row.amount),
      feeCents: cents(rows, (row) => row.fee),
      netCents: cents(rows, (row) => row.net),
    }),
  ),
  inspect(
    "payouts",
    () => collect(stripe.payouts.list({ limit: 100 })),
    (rows) => ({
      inspected: true,
      count: rows.length,
      byStatus: group(rows, (row) => row.status),
      amountCents: cents(rows, (row) => row.amount),
    }),
  ),
  inspect(
    "transfers",
    () => collect(stripe.transfers.list({ limit: 100 })),
    (rows) => ({
      inspected: true,
      count: rows.length,
      amountCents: cents(rows, (row) => row.amount),
    }),
  ),
  inspect(
    "applicationFees",
    () => collect(stripe.applicationFees.list({ limit: 100 })),
    (rows) => ({
      inspected: true,
      count: rows.length,
      amountCents: cents(rows, (row) => row.amount),
      refundedCents: cents(rows, (row) => row.amount_refunded),
    }),
  ),
  inspect(
    "topups",
    () => collect(stripe.topups.list({ limit: 100 })),
    (rows) => ({
      inspected: true,
      count: rows.length,
      byStatus: group(rows, (row) => row.status),
      amountCents: cents(rows, (row) => row.amount),
    }),
  ),
  inspect(
    "connectedAccounts",
    () => collect(stripe.accounts.list({ limit: 100 })),
    (rows) => ({
      inspected: true,
      count: rows.length,
      chargesEnabledCount: rows.filter((row) => row.charges_enabled).length,
      payoutsEnabledCount: rows.filter((row) => row.payouts_enabled).length,
    }),
  ),
  inspect(
    "billingPortalConfigurations",
    () => collect(stripe.billingPortal.configurations.list({ limit: 100 })),
    (rows) => ({
      inspected: true,
      count: rows.length,
      activeCount: rows.filter((row) => row.active).length,
    }),
  ),
  inspect(
    "webhookEndpoints",
    () => collect(stripe.webhookEndpoints.list({ limit: 100 })),
    (rows) => ({
      inspected: true,
      count: rows.length,
      enabledCount: rows.filter((row) => row.status === "enabled").length,
      disabledCount: rows.filter((row) => row.status === "disabled").length,
    }),
  ),
  inspect(
    "recentEvents",
    () => collect(stripe.events.list({ limit: 100 })),
    (rows) => ({
      inspected: true,
      countWithinStripeRetention: rows.length,
      byType: group(rows, (row) => row.type),
    }),
  ),
  inspect(
    "radarReviews",
    () => collect(stripe.reviews.list({ limit: 100 })),
    (rows) => ({
      inspected: true,
      count: rows.length,
      byReason: group(rows, (row) => row.reason),
    }),
  ),
  inspect(
    "applePayDomains",
    () => collect(stripe.applePayDomains.list({ limit: 100 })),
    (rows) => ({ inspected: true, count: rows.length }),
  ),
  inspect(
    "paymentMethodDomains",
    () => collect(stripe.paymentMethodDomains.list({ limit: 100 })),
    (rows) => ({
      inspected: true,
      count: rows.length,
      enabledCount: rows.filter((row) => row.enabled).length,
    }),
  ),
  inspect(
    "files",
    () => collect(stripe.files.list({ limit: 100 })),
    (rows) => ({
      inspected: true,
      count: rows.length,
      byPurpose: group(rows, (row) => row.purpose),
    }),
  ),
  inspect(
    "terminalLocations",
    () => collect(stripe.terminal.locations.list({ limit: 100 })),
    (rows) => ({ inspected: true, count: rows.length }),
  ),
  inspect(
    "terminalReaders",
    () => collect(stripe.terminal.readers.list({ limit: 100 })),
    (rows) => ({
      inspected: true,
      count: rows.length,
      byStatus: group(rows, (row) => row.status ?? "unset"),
    }),
  ),
  inspect(
    "paymentAttemptRecords",
    () => collect(stripe.paymentAttemptRecords.list({ limit: 100 })),
    countOnly,
  ),
  inspect(
    "invoicePayments",
    () => collect(stripe.invoicePayments.list({ limit: 100 })),
    countOnly,
  ),
  inspect(
    "setupAttempts",
    () => collect(stripe.setupAttempts.list({ limit: 100 })),
    countOnly,
  ),
  inspect(
    "subscriptionItems",
    () => collect(stripe.subscriptionItems.list({ limit: 100 })),
    countOnly,
  ),
  inspect(
    "subscriptionSchedules",
    () => collect(stripe.subscriptionSchedules.list({ limit: 100 })),
    (rows) => ({
      inspected: true,
      count: rows.length,
      byStatus: group(rows, (row) => row.status),
    }),
  ),
  inspect(
    "taxIds",
    () => collect(stripe.taxIds.list({ limit: 100 })),
    countOnly,
  ),
  inspect(
    "fileLinks",
    () => collect(stripe.fileLinks.list({ limit: 100 })),
    countOnly,
  ),
  inspect(
    "paymentMethodConfigurations",
    () => collect(stripe.paymentMethodConfigurations.list({ limit: 100 })),
    (rows) => ({
      inspected: true,
      count: rows.length,
      activeCount: rows.filter((row) => row.active !== false).length,
    }),
  ),
  inspect(
    "invoiceRenderingTemplates",
    () => collect(stripe.invoiceRenderingTemplates.list({ limit: 100 })),
    countOnly,
  ),
  inspect(
    "unattachedCardPaymentMethods",
    () => collect(stripe.paymentMethods.list({ type: "card", limit: 100 })),
    countOnly,
  ),
  inspect(
    "taxTransactions",
    () => collect(stripe.tax.transactions.list({ limit: 100 })),
    countOnly,
  ),
  inspect(
    "entitlementFeatures",
    () => collect(stripe.entitlements.features.list({ limit: 100 })),
    countOnly,
  ),
  inspect(
    "radarEarlyFraudWarnings",
    () => collect(stripe.radar.earlyFraudWarnings.list({ limit: 100 })),
    countOnly,
  ),
  inspect(
    "radarValueLists",
    () => collect(stripe.radar.valueLists.list({ limit: 100 })),
    countOnly,
  ),
  inspect(
    "identityVerificationSessions",
    () => collect(stripe.identity.verificationSessions.list({ limit: 100 })),
    (rows) => ({
      inspected: true,
      count: rows.length,
      byStatus: group(rows, (row) => row.status),
    }),
  ),
  inspect(
    "issuingAuthorizations",
    () => collect(stripe.issuing.authorizations.list({ limit: 100 })),
    countOnly,
  ),
  inspect(
    "issuingCardholders",
    () => collect(stripe.issuing.cardholders.list({ limit: 100 })),
    countOnly,
  ),
  inspect(
    "issuingCards",
    () => collect(stripe.issuing.cards.list({ limit: 100 })),
    countOnly,
  ),
  inspect(
    "issuingDisputes",
    () => collect(stripe.issuing.disputes.list({ limit: 100 })),
    countOnly,
  ),
  inspect(
    "issuingTransactions",
    () => collect(stripe.issuing.transactions.list({ limit: 100 })),
    countOnly,
  ),
  inspect(
    "treasuryFinancialAccounts",
    () => collect(stripe.treasury.financialAccounts.list({ limit: 100 })),
    countOnly,
  ),
  inspect(
    "treasuryInboundTransfers",
    () => collect(stripe.treasury.inboundTransfers.list({ limit: 100 })),
    countOnly,
  ),
  inspect(
    "treasuryOutboundPayments",
    () => collect(stripe.treasury.outboundPayments.list({ limit: 100 })),
    countOnly,
  ),
  inspect(
    "treasuryOutboundTransfers",
    () => collect(stripe.treasury.outboundTransfers.list({ limit: 100 })),
    countOnly,
  ),
  inspect(
    "treasuryReceivedCredits",
    () => collect(stripe.treasury.receivedCredits.list({ limit: 100 })),
    countOnly,
  ),
  inspect(
    "treasuryReceivedDebits",
    () => collect(stripe.treasury.receivedDebits.list({ limit: 100 })),
    countOnly,
  ),
  inspect(
    "treasuryTransactions",
    () => collect(stripe.treasury.transactions.list({ limit: 100 })),
    countOnly,
  ),
  inspect(
    "financialConnectionsAccounts",
    () => collect(stripe.financialConnections.accounts.list({ limit: 100 })),
    countOnly,
  ),
  inspect(
    "forwardingRequests",
    () => collect(stripe.forwarding.requests.list({ limit: 100 })),
    countOnly,
  ),
  inspect(
    "reportRuns",
    () => collect(stripe.reporting.reportRuns.list({ limit: 100 })),
    countOnly,
  ),
  inspect(
    "climateOrders",
    () => collect(stripe.climate.orders.list({ limit: 100 })),
    countOnly,
  ),
  inspect(
    "billingMeters",
    () => collect(stripe.billing.meters.list({ limit: 100 })),
    countOnly,
  ),
  inspect(
    "billingCreditGrants",
    () => collect(stripe.billing.creditGrants.list({ limit: 100 })),
    countOnly,
  ),
  inspect(
    "sigmaScheduledQueryRuns",
    () => collect(stripe.sigma.scheduledQueryRuns.list({ limit: 100 })),
    countOnly,
  ),
]);

const taxRegistrationStates = {};
for (const status of ["active", "scheduled", "expired"]) {
  try {
    taxRegistrationStates[status] = (
      await collect(stripe.tax.registrations.list({ status, limit: 100 }))
    ).length;
  } catch (error) {
    taxRegistrationStates[status] = {
      inspected: false,
      errorType:
        error && typeof error === "object" && "type" in error
          ? String(error.type)
          : error instanceof Error
            ? error.name
            : "unknown",
    };
  }
}

console.log(
  JSON.stringify(
    {
      account: {
        id: account.id,
        livemode: true,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        country: account.country,
        defaultCurrency: account.default_currency,
        capabilityStatuses: Object.fromEntries(
          Object.entries(account.capabilities ?? {}).sort(([left], [right]) =>
            left.localeCompare(right),
          ),
        ),
      },
      balance: {
        available: balance.available.map(({ amount, currency }) => ({
          amount,
          currency,
        })),
        pending: balance.pending.map(({ amount, currency }) => ({
          amount,
          currency,
        })),
        connectReserved: (balance.connect_reserved ?? []).map(
          ({ amount, currency }) => ({ amount, currency }),
        ),
      },
      balanceSettings: {
        debitNegativeBalances: balanceSettings.payments?.debit_negative_balances,
        payoutScheduleInterval:
          balanceSettings.payments?.payouts?.schedule?.interval ?? null,
        payoutStatementDescriptor:
          balanceSettings.payments?.payouts?.statement_descriptor ?? null,
      },
      taxSettings: {
        status: taxSettings.status,
        defaultTaxCode: taxSettings.defaults?.tax_code ?? null,
        defaultTaxBehavior: taxSettings.defaults?.tax_behavior ?? null,
        headOfficeCountry: taxSettings.head_office?.address?.country ?? null,
      },
      taxRegistrations: taxRegistrationStates,
      families: Object.fromEntries(families),
    },
    null,
    2,
  ),
);
