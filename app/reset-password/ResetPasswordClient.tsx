"use client";

import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { updatePassword } from "@/app/actions/auth";
import { T } from "@/lib/theme";
import { BRAND } from "@/lib/config";

/* ------------------------------------------------------------------ */
/*  Icons                                                              */
/* ------------------------------------------------------------------ */
const ArrowLeft = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 18l-6-6 6-6" />
  </svg>
);

/* ------------------------------------------------------------------ */
/*  Map server-action error codes to friendly copy                     */
/* ------------------------------------------------------------------ */
function errorCopy(code: string | null): string | null {
  if (!code) return null;
  if (code === "mismatch") return "Those passwords do not match. Try again.";
  if (code === "weak_password") return "Use at least 6 characters for your password.";
  return code; // Supabase surfaced a real message — show it as-is.
}

type Status = "verifying" | "ready" | "error";

type Props = {
  tokenHash: string | null;
  type: string | null;
  next: string;
  initialError: string | null;
};

/* ------------------------------------------------------------------ */
/*  Submit button (pending-aware)                                      */
/* ------------------------------------------------------------------ */
function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="w-full rounded-xl px-4 py-3 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-40"
      style={{ background: T.accent, color: "#fff" }}
    >
      {pending ? "Saving..." : "Set New Password"}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function ResetPasswordClient({ tokenHash, type, next, initialError }: Props) {
  const [status, setStatus] = useState<Status>("verifying");
  const [linkError, setLinkError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  // Establish the recovery session from the emailed link.
  useEffect(() => {
    let active = true;

    (async () => {
      const supabase = createBrowserSupabase();
      if (!supabase) {
        if (active) {
          setStatus("error");
          setLinkError("Password reset is temporarily unavailable. Please try again later.");
        }
        return;
      }

      // The emailed token is authoritative — it identifies the exact account
      // being recovered. Verify it FIRST (before trusting any ambient session)
      // so a stale or foreign session left in this browser cannot pre-empt the
      // link. verifyOtp establishes the recovery session in the ssr cookies
      // that the updatePassword server action later reads.
      if (tokenHash) {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: (type ?? "recovery") as "recovery" | "signup" | "invite" | "magiclink" | "email_change" | "email",
        });
        if (!active) return;

        if (error) {
          // The token may have already been consumed while a session was set
          // (e.g. a duplicate effect run or a fast reload).
          const { data: { session: retry } } = await supabase.auth.getSession();
          if (!active) return;
          if (retry) {
            setStatus("ready");
          } else {
            setStatus("error");
            setLinkError("This reset link is invalid or has expired. Request a new one.");
          }
          return;
        }

        setStatus("ready");
        // Strip the one-time token from the URL so a reload cannot reuse it.
        window.history.replaceState(null, "", "/reset-password");
        return;
      }

      // No token in the URL. This is the post-error retry path: the recovery
      // session from the initial verifyOtp still lives in the cookies, so let
      // the user try again without re-clicking the email link.
      const { data: { session } } = await supabase.auth.getSession();
      if (!active) return;
      if (session) {
        setStatus("ready");
        return;
      }

      // No token and no session — nothing to work with.
      setStatus("error");
      setLinkError("This reset link is invalid or has expired. Request a new one.");
    })();

    return () => {
      active = false;
    };
  }, [tokenHash, type]);

  const mismatch = confirm.length > 0 && password !== confirm;
  const canSubmit = status === "ready" && password.length >= 6 && !mismatch;
  const serverError = errorCopy(initialError);

  return (
    <section className="px-4 pt-6 pb-12 max-w-sm mx-auto min-h-[80vh] flex flex-col [padding-bottom:env(safe-area-inset-bottom)]">
      {/* Back link */}
      <Link
        href="/sign-in"
        className="inline-flex items-center gap-1.5 text-sm mb-8"
        style={{ color: T.textMute }}
      >
        {ArrowLeft}
        Back to sign in
      </Link>

      {/* Logo mark */}
      <div className="flex justify-center mb-6">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold"
          style={{ background: T.accent, color: "#fff" }}
        >
          V
        </div>
      </div>

      {status === "verifying" && (
        <div className="text-center mt-6">
          <h1 className="text-2xl font-bold mb-2" style={{ color: T.text }}>
            Checking your link
          </h1>
          <p className="text-sm" style={{ color: T.textDim }}>
            One moment while we verify your reset link.
          </p>
        </div>
      )}

      {status === "error" && (
        <div className="flex flex-col items-center text-center">
          <h1 className="text-2xl font-bold mb-2" style={{ color: T.text }}>
            Link expired
          </h1>
          <p className="text-sm leading-relaxed mb-8" style={{ color: T.textDim }}>
            {linkError}
          </p>
          <Link
            href="/forgot-password"
            className="w-full rounded-xl px-4 py-3 text-sm font-semibold text-center no-underline transition-opacity hover:opacity-90"
            style={{ background: T.accent, color: "#fff" }}
          >
            Request a New Link
          </Link>
        </div>
      )}

      {status === "ready" && (
        <>
          <h1 className="text-2xl font-bold text-center mb-2" style={{ color: T.text }}>
            Set a new password
          </h1>
          <p className="text-sm text-center mb-8" style={{ color: T.textDim }}>
            Choose a new password for your {BRAND.name} account.
          </p>

          {serverError && (
            <p
              className="text-sm text-center rounded-xl px-4 py-3 mb-4"
              style={{ background: "rgba(224,17,95,.12)", border: `1px solid ${T.accent}`, color: T.text }}
            >
              {serverError}
            </p>
          )}

          <form action={updatePassword} className="flex flex-col gap-3 mb-6">
            <input type="hidden" name="next" value={next} />

            <label className="sr-only" htmlFor="password">New password</label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="New password (6+ characters)"
              autoComplete="new-password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl px-4 py-3 text-sm outline-none placeholder:opacity-50"
              style={{ background: T.surface, border: `1px solid ${T.line}`, color: T.text }}
            />

            <label className="sr-only" htmlFor="confirm">Confirm password</label>
            <input
              id="confirm"
              name="confirm"
              type="password"
              placeholder="Confirm password"
              autoComplete="new-password"
              required
              minLength={6}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full rounded-xl px-4 py-3 text-sm outline-none placeholder:opacity-50"
              style={{ background: T.surface, border: `1px solid ${T.line}`, color: T.text }}
            />

            {mismatch && (
              <p className="text-xs" style={{ color: T.accent }}>
                Those passwords do not match.
              </p>
            )}

            <SubmitButton disabled={!canSubmit} />
          </form>
        </>
      )}
    </section>
  );
}
