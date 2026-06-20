import type { Metadata } from "next";
import Link from "next/link";
import { T } from "@/lib/theme";
import { BRAND } from "@/lib/config";
import { signUpAction } from "@/app/actions/auth";
import OAuthButtons from "@/components/OAuthButtons";

export const metadata: Metadata = {
  title: `Sign Up | ${BRAND.name}`,
  description: `Create your ${BRAND.name} account to start streaming micro-dramas, earn coins, and build your watchlist.`,
  alternates: { canonical: "/sign-up" },
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
};

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
type Props = {
  searchParams: Promise<{ next?: string; error?: string }>;
};

export default async function SignUpPage({ searchParams }: Props) {
  const { next } = await searchParams;
  const redirectNext = next || "/";

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
        Create your account
      </h1>
      <p
        className="text-sm text-center mb-8"
        style={{ color: T.textDim }}
      >
        Join {BRAND.name} and start streaming.
      </p>

      {/* Registration form */}
      <form action={signUpAction} className="flex flex-col gap-3 mb-6">
        <input type="hidden" name="next" value={redirectNext} />
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

        <label className="sr-only" htmlFor="display-name">Display name</label>
        <input
          id="display-name"
          name="displayName"
          type="text"
          placeholder="Display name"
          autoComplete="name"
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

        <label className="sr-only" htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          placeholder="Password (6+ characters)"
          autoComplete="new-password"
          required
          minLength={6}
          className="w-full rounded-xl px-4 py-3 text-sm outline-none placeholder:opacity-50"
          style={{ background: T.surface, border: `1px solid ${T.line}`, color: T.text }}
        />

        {/* Age gate */}
        <label className="flex items-start gap-3 mt-2 cursor-pointer">
          <input
            type="checkbox"
            name="ageGate"
            required
            className="mt-0.5 w-4 h-4 shrink-0 rounded accent-current"
            style={{ accentColor: T.accent }}
          />
          <span className="text-sm" style={{ color: T.textDim }}>
            I am 13 years or older
          </span>
        </label>

        {/* Terms agreement */}
        <p className="text-xs leading-relaxed mt-1" style={{ color: T.textMute }}>
          By creating an account, you agree to our{" "}
          <Link href="/terms" className="underline" style={{ color: T.textDim }}>
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline" style={{ color: T.textDim }}>
            Privacy Policy
          </Link>
          .
        </p>

        <button
          type="submit"
          className="w-full rounded-xl px-4 py-3 text-sm font-semibold transition-opacity hover:opacity-90 mt-2"
          style={{ background: T.accent, color: "#fff" }}
        >
          Create Account
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
      <OAuthButtons redirectNext={redirectNext} />

      {/* Footer links */}
      <div className="mt-auto flex flex-col items-center gap-3">
        <p className="text-sm" style={{ color: T.textDim }}>
          Already have an account?{" "}
          <Link
            href={`/sign-in${next ? `?next=${encodeURIComponent(next)}` : ""}`}
            className="font-semibold no-underline"
            style={{ color: T.accent }}
          >
            Sign In
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
