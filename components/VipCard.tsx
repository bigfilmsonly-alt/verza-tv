"use client";

import { useState } from "react";
import { T } from "@/lib/theme";
import { emit } from "@/lib/analytics";

interface VipCardProps {
  isVip?: boolean;
  vipExpiresAt?: string | null;
}

export default function VipCard({ isVip = false, vipExpiresAt }: VipCardProps) {
  const [loading, setLoading] = useState<"monthly" | "yearly" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubscribe(plan: "monthly" | "yearly") {
    setLoading(plan);
    setError(null);

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

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(null);
    }
  }

  /* ---- Active VIP state ---- */
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
                All episodes unlocked
              </p>
            </div>
          </div>

          {expiryLabel && (
            <p className="text-xs mb-3" style={{ color: T.textMute }}>
              Renews {expiryLabel}
            </p>
          )}

          <a
            href="https://billing.stripe.com/p/login/test_aEUaEXeXP4cMaYw288"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center py-2.5 rounded-lg text-sm font-semibold no-underline transition-opacity hover:opacity-90"
            style={{
              background: "rgba(255,255,255,0.06)",
              color: T.textDim,
              border: `1px solid ${T.line}`,
            }}
          >
            Manage Subscription
          </a>
        </div>
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
              Verza VIP
            </p>
            <p className="text-xs" style={{ color: T.textDim }}>
              Unlimited episodes, no paywalls
            </p>
          </div>
        </div>

        <p className="text-xs mb-4 ml-[52px]" style={{ color: T.textMute }}>
          Stream every series, every episode — cancel anytime
        </p>

        {/* Plan options */}
        <div className="flex gap-3 mb-4">
          {/* Monthly */}
          <button
            onClick={() => handleSubscribe("monthly")}
            disabled={loading !== null}
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
                  $9.99
                </span>
                <span
                  className="text-xs font-medium"
                  style={{ color: T.textDim }}
                >
                  per month
                </span>
              </>
            )}
          </button>

          {/* Yearly */}
          <button
            onClick={() => handleSubscribe("yearly")}
            disabled={loading !== null}
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
              Save 33%
            </span>

            {loading === "yearly" ? (
              <Spinner />
            ) : (
              <>
                <span
                  className="text-lg font-bold"
                  style={{ color: T.text }}
                >
                  $79.99
                </span>
                <span
                  className="text-xs font-medium"
                  style={{ color: T.textDim }}
                >
                  per year
                </span>
              </>
            )}
          </button>
        </div>

        {/* Features */}
        <div className="flex flex-col gap-2 mb-1">
          {[
            "Every episode, every series",
            "No coin paywalls",
            "New shows on day one",
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

        {/* Error */}
        {error && (
          <p
            className="text-xs text-center mt-3"
            style={{ color: T.accent }}
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
