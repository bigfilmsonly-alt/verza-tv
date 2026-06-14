import type { Metadata } from "next";
import Link from "next/link";
import { T } from "@/lib/theme";
import { BRAND } from "@/lib/config";

export const metadata: Metadata = {
  title: `Sign In | ${BRAND.name}`,
  description: `Sign in to ${BRAND.name} to access your library, purchases, and personalized recommendations.`,
  alternates: { canonical: "/sign-in" },
};

/* ------------------------------------------------------------------ */
/*  SVG icons                                                          */
/* ------------------------------------------------------------------ */
const iconProps = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const Icons = {
  mail: (
    <svg {...iconProps}>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M22 7l-10 7L2 7" />
    </svg>
  ),
  google: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A11.96 11.96 0 001 12c0 1.94.46 3.77 1.18 5.07l3.66-2.98z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  ),
  apple: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  ),
  arrowLeft: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  ),
};

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function SignInPage() {
  return (
    <section className="px-4 pt-6 pb-12 max-w-sm mx-auto min-h-[80vh] flex flex-col">
      {/* Back link */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm mb-8"
        style={{ color: T.textMute }}
      >
        {Icons.arrowLeft}
        Back
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

      {/* Heading */}
      <h1
        className="text-2xl font-bold text-center mb-2"
        style={{ color: T.text }}
      >
        Sign in to {BRAND.name}
      </h1>
      <p
        className="text-sm text-center mb-8"
        style={{ color: T.textDim }}
      >
        Stream micro-dramas, track your library, and more.
      </p>

      {/* Email form */}
      <form className="flex flex-col gap-3 mb-6">
        <label className="sr-only" htmlFor="email">Email address</label>
        <input
          id="email"
          name="email"
          type="email"
          placeholder="Email address"
          autoComplete="email"
          required
          className="w-full rounded-xl px-4 py-3 text-sm outline-none placeholder:opacity-50 transition-colors focus:ring-2"
          style={{
            background: T.surface,
            border: `1px solid ${T.line}`,
            color: T.text,
            // @ts-expect-error -- CSS custom property for focus ring
            "--tw-ring-color": T.accent,
          }}
        />
        <button
          type="submit"
          className="w-full rounded-xl px-4 py-3 text-sm font-semibold transition-opacity hover:opacity-90"
          style={{ background: T.accent, color: "#fff" }}
        >
          Continue with Email
        </button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 h-px" style={{ background: T.line }} />
        <span className="text-xs uppercase tracking-widest" style={{ color: T.textMute }}>
          or
        </span>
        <div className="flex-1 h-px" style={{ background: T.line }} />
      </div>

      {/* Social buttons */}
      <div className="flex flex-col gap-3 mb-8">
        <button
          type="button"
          className="w-full rounded-xl px-4 py-3 text-sm font-semibold flex items-center justify-center gap-3 transition-opacity hover:opacity-90"
          style={{
            background: T.surface,
            border: `1px solid ${T.line}`,
            color: T.text,
          }}
        >
          {Icons.google}
          Continue with Google
        </button>
        <button
          type="button"
          className="w-full rounded-xl px-4 py-3 text-sm font-semibold flex items-center justify-center gap-3 transition-opacity hover:opacity-90"
          style={{
            background: T.surface,
            border: `1px solid ${T.line}`,
            color: T.text,
          }}
        >
          {Icons.apple}
          Continue with Apple
        </button>
      </div>

      {/* Footer links */}
      <div className="mt-auto flex flex-col items-center gap-3">
        <p className="text-sm" style={{ color: T.textDim }}>
          Don&apos;t have an account?{" "}
          <Link
            href="/sign-up"
            className="font-semibold no-underline"
            style={{ color: T.accent }}
          >
            Sign Up
          </Link>
        </p>
        <Link
          href="/"
          className="text-sm no-underline"
          style={{ color: T.textMute }}
        >
          Continue as Guest
        </Link>
      </div>
    </section>
  );
}
