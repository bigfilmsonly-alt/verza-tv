"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { T } from "@/lib/theme";
import { isIOSApp } from "@/lib/platform";
import { emit } from "@/lib/analytics";
import { requireCheckoutUser } from "@/lib/checkout-auth";
import { VIP_PLANS } from "@/lib/config";

function dollars(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

interface VipCardProps {
  isVip?: boolean;
  vipExpiresAt?: string | null;
  cancelAtPeriodEnd?: boolean;
  checkoutEnabled?: boolean;
  yearlyCheckoutEnabled?: boolean;
}

export default function VipCard({
  isVip = false,
  vipExpiresAt,
  cancelAtPeriodEnd = false,
  checkoutEnabled = false,
  yearlyCheckoutEnabled = false,
}: VipCardProps) {
  // Reader mode (Apple 3.1.1): the iOS app must not show subscription
  // purchase UI. Existing VIPs still see their status (without billing links).
  const [iosApp, setIosApp] = useState(false);
  useEffect(() => {
    if (isIOSApp()) queueMicrotask(() => setIosApp(true));
  }, []);
  const [loading, setLoading] = useState<"monthly" | "yearly" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [portalError, setPortalError] = useState<string | null>(null);

  async function handleSubscribe(plan: "monthly" | "yearly") {
    if (!(await requireCheckoutUser("/me"))) return;
    setLoading(plan);
    setError(null);

    let navigating = false;
    try {
      // Intent signal — tapped subscribe, heading to Stripe (no revenue from client).
      emit("checkout_started", {
        plan_type: plan === "yearly" ? "vip_yearly" : "vip_monthly",
        surface: "vip_card",
      });

      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        url?: unknown;
        error?: unknown;
        alreadySubscribed?: unknown;
      };

      if (!res.ok) {
        setError(
          data.alreadySubscribed
            ? "You already have a VIP subscription. Refresh this page to see its status."
            : typeof data.error === "string"
              ? data.error
              : "Couldn’t start subscription checkout. Please try again.",
        );
        return;
      }

      if (typeof data.url !== "string" || !data.url) {
        setError("Subscription checkout did not open. Please try again.");
        return;
      }
      navigating = true;
      window.location.assign(data.url);
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      if (!navigating) setLoading(null);
    }
  }

  async function handleBillingPortal() {
    setPortalLoading(true);
    setPortalError(null);
    let navigating = false;
    try {
      const res = await fetch("/api/billing-portal", { method: "POST" });
      const data = (await res.json().catch(() => ({}))) as {
        url?: unknown;
        error?: unknown;
      };
      if (!res.ok) {
        setPortalError(
          typeof data.error === "string"
            ? data.error
            : "Couldn’t open subscription management. Please try again.",
        );
        return;
      }
      if (typeof data.url !== "string" || !data.url) {
        setPortalError("Subscription management did not open. Please try again.");
        return;
      }
      navigating = true;
      window.location.assign(data.url);
    } catch {
      setPortalError("Network error. Check your connection and try again.");
    } finally {
      if (!navigating) setPortalLoading(false);
    }
  }

  /* ---- Active VIP state ---- */
  if (!isVip && (iosApp || !checkoutEnabled)) return null;

  if (isVip) {
    const expiryLabel = vipExpiresAt
      ? new Date(vipExpiresAt).toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        })
      : null;

    return (
      <div
        className="rounded-xl overflow-hidden p-[1px]"
        style={{
          background: `linear-gradient(135deg, ${T.accent}, #8B5CF6)`,
        }}
      >
        <div
          className="rounded-[11px] p-5"
          style={{ background: T.surface }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${T.accent}, #8B5CF6)`,
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#fff"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </div>
            <div>
              <p className="text-base font-bold" style={{ color: T.text }}>
                VIP Member
              </p>
              <p className="text-xs" style={{ color: T.textDim }}>
                All currently available episodes unlocked
              </p>
            </div>
          </div>

          {expiryLabel && (
            <p className="text-xs mb-3" style={{ color: T.textMute }}>
              {cancelAtPeriodEnd ? "Access through" : "Renews"} {expiryLabel}
            </p>
          )}

          {iosApp ? null : (
          <button
            onClick={handleBillingPortal}
            disabled={portalLoading}
            className="block w-full text-center py-2.5 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90 cursor-pointer"
            style={{
              background: "rgba(255,255,255,0.06)",
              color: T.textDim,
              border: `1px solid ${T.line}`,
              opacity: portalLoading ? 0.7 : 1,
            }}
          >
            {portalLoading ? "Opening…" : "Manage Subscription"}
          </button>
          )}

          {!iosApp && portalError && (
            <p
              className="text-xs text-center mt-3"
              style={{ color: T.accent }}
              role="alert"
            >
              {portalError}{" "}
              <a
                href="mailto:support@verzatv.com?subject=Manage%20VIP%20Subscription"
                style={{ color: T.text, textDecoration: "underline" }}
              >
                Contact support
              </a>
            </p>
          )}
        </div>

        <p className="mt-3 text-[10px] leading-relaxed text-center" style={{ color: T.textMute }}>
          {cancelAtPeriodEnd
            ? expiryLabel
              ? "Renewal is cancelled. You keep access through the paid period shown above."
              : "Renewal is cancelled. You keep access through the end of the paid period."
            : "Auto-renews at the selected price until cancelled. Cancel anytime via Manage Subscription on your Profile — you keep access until the end of the paid period."}
        </p>
      </div>
    );
  }

  /* ---- Subscribe state ---- */
  return (
    <div
      className="rounded-xl overflow-hidden p-[1px]"
      style={{
        background: `linear-gradient(135deg, ${T.accent}, #8B5CF6)`,
      }}
    >
      <div
        className="rounded-[11px] p-5"
        style={{ background: T.surface }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-1">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${T.accent}33, #8B5CF633)`,
              border: `1px solid ${T.accent}44`,
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke={T.accent}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </div>
          <div>
            <p className="text-base font-bold" style={{ color: T.text }}>
              VERZA VIP
            </p>
            <p className="text-xs" style={{ color: T.textDim }}>
              Currently available episodes with VIP access
            </p>
          </div>
        </div>

        <p className="text-xs mb-4 ml-[52px]" style={{ color: T.textMute }}>
          Stream currently available series and episodes — cancel anytime
        </p>

        {/* Plan options */}
        <div className="flex gap-3 mb-4">
          {/* Monthly */}
          <button
            onClick={() => handleSubscribe("monthly")}
            disabled={loading !== null}
            aria-label={`Subscribe to VERZA VIP for ${dollars(VIP_PLANS.monthly.cents)} per month, renewing automatically until canceled`}
            className="flex-1 flex flex-col items-center gap-1 rounded-xl py-4 border-0 cursor-pointer transition-transform active:scale-[0.97]"
            style={{
              background: T.raised,
              border: `1px solid ${T.line}`,
              opacity: loading === "yearly" ? 0.5 : 1,
            }}
          >
            {loading === "monthly" ? (
              <Spinner />
            ) : (
              <>
                <span
                  className="text-lg font-bold"
                  style={{ color: T.text }}
                >
                  {dollars(VIP_PLANS.monthly.cents)}
                </span>
                <span
                  className="text-xs font-medium"
                  style={{ color: T.textDim }}
                >
                  per {VIP_PLANS.monthly.interval}
                </span>
              </>
            )}
          </button>

          {/* Yearly remains absent until the independent annual reminder gate
              is deployed, configured, and explicitly enabled. */}
          {yearlyCheckoutEnabled ? (
          <button
            onClick={() => handleSubscribe("yearly")}
            disabled={loading !== null}
            aria-label={`Subscribe to VERZA VIP for ${dollars(VIP_PLANS.yearly.cents)} per year, renewing automatically until canceled`}
            className="flex-1 flex flex-col items-center gap-1 rounded-xl py-4 border-0 cursor-pointer transition-transform active:scale-[0.97] relative"
            style={{
              background: `linear-gradient(135deg, ${T.accent}11, #8B5CF611)`,
              border: `1px solid ${T.accent}44`,
              opacity: loading === "monthly" ? 0.5 : 1,
            }}
          >
            {/* Save badge */}
            <span
              className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold"
              style={{
                background: `linear-gradient(90deg, ${T.accent}, #8B5CF6)`,
                color: "#fff",
              }}
            >
              Best Value · {VIP_PLANS.yearly.badge}
            </span>

            {loading === "yearly" ? (
              <Spinner />
            ) : (
              <>
                <span
                  className="text-lg font-bold"
                  style={{ color: T.text }}
                >
                  {dollars(VIP_PLANS.yearly.cents)}
                </span>
                <span
                  className="text-xs font-medium"
                  style={{ color: T.textDim }}
                >
                  per {VIP_PLANS.yearly.interval}
                </span>
                <span className="text-[10px] font-medium" style={{ color: T.textMute }}>
                  just {dollars(Math.round(VIP_PLANS.yearly.cents / 12))}/mo
                </span>
              </>
            )}
          </button>
          ) : null}
        </div>

        {/* Features */}
        <div className="flex flex-col gap-2 mb-1">
          {[
            "Every currently available episode",
            "No coin paywalls",
            "Cancel anytime",
          ].map((feat) => (
            <div key={feat} className="flex items-center gap-2">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke={T.success}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span className="text-xs" style={{ color: T.textDim }}>
                {feat}
              </span>
            </div>
          ))}
        </div>

        <p className="text-[11px] leading-relaxed text-center mt-4" style={{ color: T.textMute }}>
          Your selected plan renews automatically at the displayed price and
          interval, plus applicable taxes, until canceled. Manage or cancel it
          from this card after subscribing; access continues through the paid
          period.
        </p>
        <p className="text-[11px] text-center mt-2" style={{ color: T.textMute }}>
          <Link href="/terms" style={{ color: T.textDim, textDecoration: "underline" }}>
            Terms of Service
          </Link>
          {" · "}
          <Link href="/privacy" style={{ color: T.textDim, textDecoration: "underline" }}>
            Privacy Policy
          </Link>
          {" · "}
          <Link href="/refund-policy" style={{ color: T.textDim, textDecoration: "underline" }}>
            Refund Policy
          </Link>
        </p>

        {/* Error */}
        {error && (
          <p
            className="text-xs text-center mt-3"
            style={{ color: T.accent }}
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <div
      className="w-9 h-9 rounded-full border-[3px] border-transparent animate-spin my-2"
      style={{ borderTopColor: T.accent, borderRightColor: T.accent, borderBottomColor: `${T.accent}44` }}
    />
  );
}
