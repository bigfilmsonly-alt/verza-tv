"use server";

import { createServerSupabase } from "@/lib/supabase/middleware";
import { redirect } from "next/navigation";
import { sendWelcomeEmail } from "@/lib/email";

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
  const rawNext = (formData.get("next") as string) || "/";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/";

  if (!email || !password) {
    return redirect("/sign-up?error=missing_fields");
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

  // Send welcome email
  sendWelcomeEmail(email, displayName || email.split("@")[0]).catch(() => {});

  // Legacy email-keyed purchases intentionally require manual verification.
  const redirectTo = next !== "/" ? next : "/?welcome=true";
  return redirect(redirectTo);
}

export async function signOutAction() {
  const supabase = await createServerSupabase();
  await supabase.auth.signOut();
  return redirect("/");
}
