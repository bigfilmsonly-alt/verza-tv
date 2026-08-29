import Link from "next/link";
import { T } from "@/lib/theme";

/* ------------------------------------------------------------------ */
/*  Why an auth attempt failed, and what to do about it.                */
/*                                                                      */
/*  BUG THIS FIXES: /sign-in and /sign-up both declared `error?: string` */
/*  in their searchParams type and NEITHER ever read it.                 */
/*  app/actions/auth.ts redirects to `/sign-in?error=...` on every        */
/*  failure, so a customer who mistyped their password watched the form   */
/*  blank itself and say nothing. Combined with the missing               */
/*  forgot-password link, a paying customer who forgot their password had */
/*  no path back to their purchases from anywhere in the product — the    */
/*  reset flow existed at /forgot-password and nothing linked to it.      */
/*                                                                      */
/*  THE MESSAGE IS NEVER ECHOED BACK. `error` is a query parameter, so    */
/*  it is attacker-controlled: a crafted link could otherwise put any     */
/*  sentence — a fake support phone number, say — on our own sign-in page */
/*  in our own type. Known causes map to OUR copy; anything unrecognised  */
/*  gets the generic line. React escapes the value either way, so this is */
/*  about who is allowed to write copy on this page, not about markup.    */
/* ------------------------------------------------------------------ */

type Resolved = { message: string; offerReset: boolean };

function resolve(raw: string): Resolved {
  const e = raw.toLowerCase();

  if (e.includes("invalid login") || e.includes("invalid credentials")) {
    return { message: "That email and password don't match an account.", offerReset: true };
  }
  if (e === "missing_fields") {
    return { message: "Enter both your email address and your password.", offerReset: false };
  }
  if (e === "age_gate") {
    return { message: "You need to confirm you are 18 or older to create an account.", offerReset: false };
  }
  if (e === "missing_code" || e === "auth") {
    return { message: "That sign-in link didn't work. Try again below.", offerReset: false };
  }
  if (e.includes("already registered") || e.includes("already been registered")) {
    return { message: "An account already exists for that email. Sign in instead.", offerReset: true };
  }
  if (e.includes("email not confirmed")) {
    return { message: "Check your inbox and confirm your email address, then sign in.", offerReset: false };
  }
  if (e.includes("password should be") || e.includes("weak_password")) {
    return { message: "Choose a password with at least 6 characters.", offerReset: false };
  }
  if (e.includes("rate limit") || e.includes("too many")) {
    return { message: "Too many attempts. Wait a minute and try again.", offerReset: true };
  }
  return { message: "We couldn't complete that. Check your details and try again.", offerReset: true };
}

export default function AuthErrorNotice({ error }: { error?: string }) {
  if (!error) return null;
  const { message, offerReset } = resolve(error);

  return (
    <div
      role="alert"
      className="rounded-xl px-4 py-3 mb-4"
      style={{ background: "rgba(224, 17, 95, 0.10)", border: "1px solid rgba(224, 17, 95, 0.35)" }}
    >
      <p className="text-sm leading-relaxed" style={{ color: T.text }}>
        {message}
      </p>
      {offerReset && (
        <Link
          href="/forgot-password"
          className="inline-block mt-1.5 text-sm font-semibold no-underline"
          style={{ color: T.accent }}
        >
          Reset your password
        </Link>
      )}
    </div>
  );
}
