import type { Metadata } from "next";
import Link from "next/link";
import { T } from "@/lib/theme";
import { BRAND } from "@/lib/config";
import { requestPasswordReset } from "@/app/actions/auth";

export const metadata: Metadata = {
  title: "Reset Password",
  description: `Reset the password for your ${BRAND.name} account.`,
  alternates: { canonical: "/forgot-password" },
  robots: { index: false, follow: false },
};

/* ------------------------------------------------------------------ */
/*  SVG icons                                                          */
/* ------------------------------------------------------------------ */
const Icons = {
  arrowLeft: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  ),
  check: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  ),
};

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
type Props = {
  searchParams: Promise<{ sent?: string }>;
};

export default async function ForgotPasswordPage({ searchParams }: Props) {
  const { sent } = await searchParams;
  const isSent = sent === "1";

  return (
    <section className="px-4 pt-6 pb-12 max-w-sm mx-auto min-h-[80vh] flex flex-col [padding-bottom:env(safe-area-inset-bottom)]">
      {/* Back link */}
      <Link
        href="/sign-in"
        className="inline-flex items-center gap-1.5 text-sm mb-8"
        style={{ color: T.textMute }}
      >
        {Icons.arrowLeft}
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

      {isSent ? (
        /* -------- Neutral confirmation (no account enumeration) -------- */
        <div className="flex flex-col items-center text-center">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mb-5"
            style={{ background: T.surface, border: `1px solid ${T.line}`, color: T.accent }}
          >
            {Icons.check}
          </div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: T.text }}>
            Check your inbox
          </h1>
          <p className="text-sm leading-relaxed mb-8" style={{ color: T.textDim }}>
            If an account exists for that email, we just sent a link to reset
            your password. It expires soon, so use it while it is fresh.
          </p>
          <Link
            href="/sign-in"
            className="w-full rounded-xl px-4 py-3 text-sm font-semibold text-center no-underline transition-opacity hover:opacity-90"
            style={{ background: T.accent, color: "#fff" }}
          >
            Back to Sign In
          </Link>
        </div>
      ) : (
        <>
          {/* Heading */}
          <h1 className="text-2xl font-bold text-center mb-2" style={{ color: T.text }}>
            Forgot your password?
          </h1>
          <p className="text-sm text-center mb-8" style={{ color: T.textDim }}>
            Enter your email and we will send you a link to set a new one.
          </p>

          {/* Email form */}
          <form action={requestPasswordReset} className="flex flex-col gap-3 mb-6">
            <label className="sr-only" htmlFor="email">Email address</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="Email address"
              autoComplete="email"
              required
              className="w-full rounded-xl px-4 py-3 text-sm outline-none placeholder:opacity-50"
              style={{ background: T.surface, border: `1px solid ${T.line}`, color: T.text }}
            />
            <button
              type="submit"
              className="w-full rounded-xl px-4 py-3 text-sm font-semibold transition-opacity hover:opacity-90"
              style={{ background: T.accent, color: "#fff" }}
            >
              Send Reset Link
            </button>
          </form>

          {/* Footer link */}
          <div className="mt-auto flex flex-col items-center gap-3">
            <p className="text-sm" style={{ color: T.textDim }}>
              Remembered it?{" "}
              <Link
                href="/sign-in"
                className="font-semibold no-underline"
                style={{ color: T.accent }}
              >
                Sign In
              </Link>
            </p>
          </div>
        </>
      )}
    </section>
  );
}
