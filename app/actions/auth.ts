"use server";

import { createServerSupabase } from "@/lib/supabase/middleware";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { sendWelcomeEmail, sendPasswordResetEmail, sendVerificationEmail } from "@/lib/email";

// Fixed, non-user-controlled base for links generated server-side.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.verzatv.com";

export async function signInAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const rawNext = (formData.get("next") as string) || "/";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/";

  if (!email || !password) {
    return redirect("/sign-in?error=missing_fields");
  }

  const supabase = await createServerSupabase();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return redirect(`/sign-in?error=${encodeURIComponent(error.message)}`);
  }

  // Do not claim legacy email-keyed purchases here. Historical auto-confirmed
  // accounts are not proof of mailbox ownership; support verifies them.
  return redirect(next);
}

export async function signUpAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const displayName = formData.get("displayName") as string;
  const ageGate = formData.get("ageGate");
  const rawNext = (formData.get("next") as string) || "/";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/";

  if (!email || !password) {
    return redirect("/sign-up?error=missing_fields");
  }

  // Server-side age gate — the checkbox is only `required` client-side, so
  // enforce it here too. Unchecked checkboxes are absent from FormData.
  if (!ageGate) {
    return redirect("/sign-up?error=age_gate");
  }

  const supabase = await createServerSupabase();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName || email.split("@")[0] },
    },
  });

  if (error) {
    return redirect(`/sign-up?error=${encodeURIComponent(error.message)}`);
  }

  // Emails are fire-and-forget (never block the redirect) but must still run
  // to completion after the response is sent. A bare floating promise can be
  // frozen/killed once redirect() ends the serverless invocation, so schedule
  // the work with after(), which keeps the function alive until it finishes.
  after(async () => {
    // Welcome email (in addition to the branded verification email).
    await sendWelcomeEmail(email, displayName || email.split("@")[0]).catch(() => {});

    // Branded, soft email verification — sent IN ADDITION to the welcome email.
    // Soft verification: never hard-gate access, just brand the confirm email.
    try {
      const { getServiceClient } = await import("@/lib/supabase/server");
      const service = getServiceClient();
      const { data: linkData } = await service.auth.admin.generateLink({
        type: "signup",
        email,
        password,
        options: { redirectTo: `${SITE_URL}/` },
      });
      const actionLink = linkData?.properties?.action_link;
      if (actionLink) {
        await sendVerificationEmail(email, actionLink);
      }
    } catch {
      // Soft verification only — swallow all errors.
    }
  });

  // Legacy email-keyed purchases intentionally require manual verification.
  const redirectTo = next !== "/" ? next : "/?welcome=true";
  return redirect(redirectTo);
}

export async function requestPasswordReset(formData: FormData) {
  const email = ((formData.get("email") as string | null) ?? "").trim();

  // Uniform response: we ALWAYS redirect to the same confirmation, whether or
  // not an account exists, so the response BODY cannot be used to enumerate
  // users. The link generation + email send (which only happen for a real
  // account) are deferred to after() so the redirect returns at the SAME speed
  // regardless of whether the email exists — closing the timing side channel.
  if (email) {
    after(async () => {
      try {
        const { getServiceClient } = await import("@/lib/supabase/server");
        const service = getServiceClient();

        // Supabase's own secure, single-use token — we never invent our own.
        const { data } = await service.auth.admin.generateLink({
          type: "recovery",
          email,
          options: { redirectTo: `${SITE_URL}/reset-password` },
        });

        const tokenHash = data?.properties?.hashed_token;
        if (tokenHash) {
          // Land the token on our own branded page, which establishes the
          // recovery session via supabase.auth.verifyOtp({ token_hash }).
          const link = `${SITE_URL}/reset-password?token_hash=${encodeURIComponent(
            tokenHash,
          )}&type=recovery`;
          await sendPasswordResetEmail(email, link);
        }
      } catch {
        // Swallow everything (including "user not found") to avoid enumeration.
      }
    });
  }

  return redirect("/forgot-password?sent=1");
}

export async function updatePassword(formData: FormData) {
  const password = (formData.get("password") as string | null) ?? "";
  const confirm = (formData.get("confirm") as string | null) ?? "";
  const rawNext = (formData.get("next") as string) || "/";
  // Same open-redirect guard used by signInAction.
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/";

  if (!password || password.length < 6) {
    return redirect("/reset-password?error=weak_password");
  }
  if (password !== confirm) {
    return redirect("/reset-password?error=mismatch");
  }

  // The recovery session was established client-side by verifyOtp and lives in
  // the cookies bound to this request, so the cookie-based server client can
  // update the password on the authenticated user.
  const supabase = await createServerSupabase();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return redirect(`/reset-password?error=${encodeURIComponent(error.message)}`);
  }

  // updateUser refreshed the session, so the user is now signed in.
  return redirect(next);
}

export async function signOutAction() {
  const supabase = await createServerSupabase();
  await supabase.auth.signOut();
  return redirect("/");
}
