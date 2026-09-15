"use client";

import { useState, useEffect, useCallback } from "react";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { trackUnlockClick, trackAuthRequired } from "@/lib/track";
import { unlockReturnPath } from "@/lib/checkout-auth";
import { purchaseCopy } from "@/lib/purchase-copy";
import { WEB_OAUTH_PROVIDERS, type WebOAuthProvider } from "@/lib/oauth-providers";
import { signUpAction } from "@/app/actions/auth";
import type { Locale } from "@/lib/i18n";

/* ------------------------------------------------------------------ */
/*  Provider icons                                                     */
/* ------------------------------------------------------------------ */
const GoogleIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A11.96 11.96 0 001 12c0 1.94.46 3.77 1.18 5.07l3.66-2.98z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);
const AppleIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
  </svg>
);
const PROVIDER_META: Record<string, { icon: React.ReactNode; key: "continueApple" | "continueGoogle" }> = {
  google: { icon: GoogleIcon, key: "continueGoogle" },
  apple: { icon: AppleIcon, key: "continueApple" },
};

const fieldStyle = {
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.18)",
  color: "#fff",
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

/**
 * The paywall IS the checkout.
 *
 * It used to be two screens: a teaser with one button, then a whole separate
 * account page. A viewer in the middle of an episode had to leave the story,
 * land somewhere that did not mention the story, and find their way back. Every
 * one of those steps is a place to lose someone who had already decided to buy.
 *
 * Now everything needed to complete the purchase is on the screen the paywall
 * appears on: who you are and the payment, in one action.
 *
 *  - Signed in: one button, straight to Stripe. Always was.
 *  - Signed out: provider button, or email and password, and the SAME button
 *    both authenticates and starts checkout. No second page, no second tap on
 *    a control they already pressed once.
 *
 * Event semantics are unchanged and deliberate:
 *   series_unlock_click  the buy control was pressed, recorded first
 *   auth_required        that press needed authentication before it could pay
 *   checkout_started     checkout actually began, only after auth succeeded
 * `onUnlock("inline_auth")` is what keeps series_unlock_click from firing a
 * second time, since this component already recorded the press.
 */
export default function PaywallCheckout({
  locale,
  seriesSlug,
  signedIn,
  unlockLoading,
  unlockError,
  ctaLabel,
  loadingLabel,
  onUnlock,
}: {
  locale: Locale;
  seriesSlug: string;
  signedIn: boolean | null;
  unlockLoading: boolean;
  unlockError: string | null;
  ctaLabel: string;
  loadingLabel: string;
  onUnlock: (origin: "tap" | "inline_auth") => void;
}) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  /* Computed in an effect: window is not available while this renders on the
     server, and the value is only needed once the viewer acts. */
  const [returnPath, setReturnPath] = useState("/");

  /* Deferred: window is unavailable during the server render, and setting
     state synchronously inside an effect cascades an extra render. A lazy
     useState initialiser would instead hydrate "/" over the real value and
     warn about the mismatch. */
  useEffect(() => {
    let stale = false;
    queueMicrotask(() => { if (!stale) setReturnPath(unlockReturnPath()); });
    return () => { stale = true; };
  }, []);

  const c = useCallback(
    (key: Parameters<typeof purchaseCopy>[1]) => purchaseCopy(locale, key),
    [locale],
  );

  /* The press is recorded before anything can navigate or fail. This is the
     same ordering rule that the auth guard broke for 35 days: an unlock tap
     recorded after a redirect is an unlock tap nobody ever sees. */
  const recordBuyPress = useCallback(() => {
    trackUnlockClick(seriesSlug);
    trackAuthRequired("episode_feed_inline", seriesSlug);
  }, [seriesSlug]);

  const startOAuth = useCallback(
    async (provider: WebOAuthProvider) => {
      if (busy) return;
      setError(null);
      setNotice(null);
      recordBuyPress();
      const supabase = createBrowserSupabase();
      if (!supabase) { setError(c("signInFailed")); return; }
      setBusy(true);
      /* Returns to THIS episode carrying the resume marker, so checkout starts
         by itself on arrival. The provider round trip is unavoidable, but no
         Verza screen sits in the middle of it. */
      const redirectTo = `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(returnPath)}`;
      const { error: err } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo } });
      if (err) { setError(c("signInFailed")); setBusy(false); }
    },
    [busy, c, recordBuyPress, returnPath],
  );

  const submitSignIn = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (busy || unlockLoading) return;
      setError(null);
      setNotice(null);
      recordBuyPress();
      setBusy(true);
      try {
        const supabase = createBrowserSupabase();
        if (!supabase) { setError(c("signInFailed")); return; }
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) { setError(c("signInFailed")); return; }
        /* The browser client is cookie backed (@supabase/ssr), so the session
           it just wrote is what /api/unlock will read. Prove it exists before
           starting checkout rather than assuming the write landed. */
        const { data } = await supabase.auth.getSession();
        if (!data.session) { setNotice(c("confirmEmailSent")); return; }
        onUnlock("inline_auth");
      } finally {
        setBusy(false);
      }
    },
    [busy, unlockLoading, c, email, password, onUnlock, recordBuyPress],
  );

  const providers = (["apple", "google"] as const).filter((p): p is WebOAuthProvider =>
    (WEB_OAUTH_PROVIDERS as readonly string[]).includes(p),
  );

  const primaryBtn = (label: string, disabled: boolean, onClick?: () => void, type: "button" | "submit" = "button") => (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="glow-pulse w-full py-4 rounded-2xl text-base font-bold border-0 cursor-pointer transition-transform active:scale-[0.97]"
      style={{
        background: "linear-gradient(135deg, #E0115F, #8B5CF6)",
        color: "#fff",
        opacity: disabled ? 0.7 : 1,
        boxShadow: "0 0 40px rgba(224,17,95,0.3)",
      }}
    >
      {label}
    </button>
  );

  const busyLabel = unlockLoading || busy ? loadingLabel : ctaLabel;

  /* Signed in, or auth not resolved yet. The unresolved case keeps the plain
     button on purpose: it routes through the existing guard, which is the safe
     fallback rather than guessing and showing a sign-in form to an owner. */
  if (signedIn !== false) {
    return (
      <>
        {primaryBtn(busyLabel, unlockLoading, () => { void onUnlock("tap"); })}
        {unlockError && <ErrorNote>{unlockError}</ErrorNote>}
      </>
    );
  }

  return (
    <div className="text-left">
      {providers.length > 0 && (
        <div className="flex flex-col gap-2.5 mb-3">
          {providers.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => { void startOAuth(p); }}
              disabled={busy || unlockLoading}
              className="w-full rounded-xl px-4 py-3 text-sm font-semibold flex items-center justify-center gap-2.5 cursor-pointer transition-transform active:scale-[0.98]"
              style={{ ...fieldStyle, opacity: busy || unlockLoading ? 0.6 : 1 }}
            >
              {PROVIDER_META[p].icon}
              {purchaseCopy(locale, PROVIDER_META[p].key)}
            </button>
          ))}
          <div className="flex items-center gap-3 my-0.5">
            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.15)" }} />
            <span className="text-[10px] uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.4)" }}>
              {c("orDivider")}
            </span>
            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.15)" }} />
          </div>
        </div>
      )}

      {mode === "signin" ? (
        /* Existing customer. Authenticated in place, so the purchase continues
           on this screen with no navigation at all. */
        <form onSubmit={submitSignIn} className="flex flex-col gap-2.5">
          <Fields
            locale={locale}
            email={email}
            password={password}
            setEmail={setEmail}
            setPassword={setPassword}
            autoComplete="current-password"
          />
          {primaryBtn(busyLabel, busy || unlockLoading, undefined, "submit")}
        </form>
      ) : (
        /* New customer. This posts to the existing signUpAction rather than
           calling Supabase from the browser, because that action is where the
           18+ gate is enforced server side: the checkbox alone is client only,
           and this screen must not be the one place that boundary gets weaker.
           Supabase has mailer_autoconfirm on, so the account is live
           immediately and `next` brings them back here with the resume marker,
           straight into checkout. */
        <form action={signUpAction} onSubmit={recordBuyPress} className="flex flex-col gap-2.5">
          <input type="hidden" name="next" value={returnPath} />
          <Fields
            locale={locale}
            email={email}
            password={password}
            setEmail={setEmail}
            setPassword={setPassword}
            autoComplete="new-password"
          />
          <label className="flex items-start gap-2 text-[12px] leading-snug cursor-pointer" style={{ color: "rgba(255,255,255,0.65)" }}>
            <input
              type="checkbox"
              name="ageGate"
              required
              className="mt-0.5 shrink-0"
              style={{ accentColor: "#E0115F" }}
            />
            <span>{c("ageConfirm")}</span>
          </label>
          {primaryBtn(busyLabel, busy || unlockLoading, undefined, "submit")}
        </form>
      )}

      {(error || unlockError) && <ErrorNote>{error || unlockError}</ErrorNote>}
      {notice && (
        <p className="mt-2.5 text-[12px] px-3 py-2 rounded-lg" style={{ color: "rgba(255,255,255,0.85)", background: "rgba(255,255,255,0.1)" }}>
          {notice}
        </p>
      )}

      <button
        type="button"
        onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(null); setNotice(null); }}
        className="mt-3 w-full text-center text-[12px] font-semibold bg-transparent border-0 cursor-pointer"
        style={{ color: "rgba(255,255,255,0.6)" }}
      >
        {mode === "signin" ? c("newHere") : c("haveAccount")}
      </button>
    </div>
  );
}

function Fields({
  locale, email, password, setEmail, setPassword, autoComplete,
}: {
  locale: Locale;
  email: string;
  password: string;
  setEmail: (v: string) => void;
  setPassword: (v: string) => void;
  autoComplete: "current-password" | "new-password";
}) {
  return (
    <>
      <label className="sr-only" htmlFor="paywall-email">{purchaseCopy(locale, "emailLabel")}</label>
      <input
        id="paywall-email"
        name="email"
        type="email"
        required
        autoComplete="email"
        placeholder={purchaseCopy(locale, "emailLabel")}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full rounded-xl px-4 py-3 text-sm outline-none placeholder:opacity-50"
        style={fieldStyle}
      />
      <label className="sr-only" htmlFor="paywall-password">{purchaseCopy(locale, "passwordLabel")}</label>
      <input
        id="paywall-password"
        name="password"
        type="password"
        required
        minLength={6}
        autoComplete={autoComplete}
        placeholder={purchaseCopy(locale, "passwordLabel")}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full rounded-xl px-4 py-3 text-sm outline-none placeholder:opacity-50"
        style={fieldStyle}
      />
    </>
  );
}

function ErrorNote({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="mt-2.5 text-xs px-3 py-2 rounded-lg"
      style={{
        color: "#FCA5A5",
        background: "rgba(239,68,68,0.12)",
        border: "1px solid rgba(239,68,68,0.35)",
      }}
      role="alert"
    >
      {children}
    </p>
  );
}
