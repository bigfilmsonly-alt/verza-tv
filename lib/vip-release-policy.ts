import "server-only";

function exactBoolean(name: string): boolean {
  const value = process.env[name]?.trim().toLowerCase();
  if (!value || value === "false") return false;
  if (value === "true") return true;
  throw new Error(`${name} must be true or false`);
}

export function vipTransactionalNoticesEnabled(): boolean {
  return exactBoolean("VIP_TRANSACTIONAL_NOTICES_ENABLED");
}

export function vipAnnualRenewalNoticesEnabled(): boolean {
  return exactBoolean("VIP_ANNUAL_RENEWAL_NOTICES_ENABLED");
}

function hasNoticeProvider(): boolean {
  return /^re_[A-Za-z0-9_-]+$/.test(process.env.RESEND_API_KEY?.trim() ?? "");
}

function hasSecureCron(): boolean {
  return (process.env.CRON_SECRET?.trim().length ?? 0) >= 16;
}

/** Server-rendered purchase surfaces use this to hide unavailable checkout. */
export function vipSubscriptionCheckoutEnabled(): boolean {
  return vipTransactionalNoticesEnabled() && hasNoticeProvider();
}

export function vipAnnualNoticeDeliveryReady(): boolean {
  return (
    vipSubscriptionCheckoutEnabled() &&
    vipAnnualRenewalNoticesEnabled() &&
    hasSecureCron()
  );
}

/**
 * Annual sales remain fail-closed until the application's own daily reminder
 * path is explicitly enabled and secured. Stripe Dashboard defaults do not
 * satisfy this gate.
 */
export function vipYearlyCheckoutEnabled(): boolean {
  return (
    vipAnnualNoticeDeliveryReady() &&
    exactBoolean("VIP_YEARLY_CHECKOUT_ENABLED")
  );
}

export function assertVipCheckoutReleaseReady(
  plan: "monthly" | "yearly",
): void {
  if (!vipSubscriptionCheckoutEnabled()) {
    throw new Error(
      "VIP Checkout requires the independent transactional notice path",
    );
  }
  if (plan === "yearly" && !vipYearlyCheckoutEnabled()) {
    throw new Error(
      "Yearly VIP Checkout requires the annual renewal reminder path",
    );
  }
}
