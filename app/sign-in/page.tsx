import type { Metadata } from "next";
import Link from "next/link";
import { T } from "@/lib/theme";
import { BRAND } from "@/lib/config";
import { signInAction } from "@/app/actions/auth";
import OAuthButtons from "@/components/OAuthButtons";

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

      {/* Email + password form */}
      <form action={signInAction} className="flex flex-col gap-3 mb-6">
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
        <label className="sr-only" htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          placeholder="Password"
          autoComplete="current-password"
          required
          minLength={6}
          className="w-full rounded-xl px-4 py-3 text-sm outline-none placeholder:opacity-50"
          style={{ background: T.surface, border: `1px solid ${T.line}`, color: T.text }}
        />
        <button
          type="submit"
          className="w-full rounded-xl px-4 py-3 text-sm font-semibold transition-opacity hover:opacity-90"
          style={{ background: T.accent, color: "#fff" }}
        >
          Sign In
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
      <OAuthButtons />

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
