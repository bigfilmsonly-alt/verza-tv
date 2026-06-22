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
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return redirect(`/sign-in?error=${encodeURIComponent(error.message)}`);
  }

  // Claim pending entitlements on email/password sign-in
  if (data.user?.email) {
    try {
      const { getServiceClient } = await import("@/lib/supabase/server");
      const service = getServiceClient();
      const userEmail = data.user.email.toLowerCase();

      const { data: pending } = await service
        .from("pending_entitlements")
        .select("id, series_slug, purchase_id")
        .eq("email", userEmail);

      if (pending && pending.length > 0) {
        for (const p of pending) {
          await service.from("entitlements").upsert(
            { user_id: data.user.id, series_slug: p.series_slug, purchase_id: p.purchase_id },
            { onConflict: "user_id,series_slug" },
          );
          await service.from("saved_list").upsert(
            { user_id: data.user.id, series_slug: p.series_slug, created_at: new Date().toISOString() },
            { onConflict: "user_id,series_slug" },
          );
        }
        await service.from("pending_entitlements").delete().eq("email", userEmail);
      }
    } catch {}
  }

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
  const { data, error } = await supabase.auth.signUp({
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

  // Claim pending entitlements on sign-up
  if (data.user?.email && data.user?.id) {
    try {
      const { getServiceClient } = await import("@/lib/supabase/server");
      const service = getServiceClient();
      const userEmail = data.user.email.toLowerCase();

      const { data: pending } = await service
        .from("pending_entitlements")
        .select("id, series_slug, purchase_id")
        .eq("email", userEmail);

      if (pending && pending.length > 0) {
        for (const p of pending) {
          await service.from("entitlements").upsert(
            { user_id: data.user.id, series_slug: p.series_slug, purchase_id: p.purchase_id },
            { onConflict: "user_id,series_slug" },
          );
          await service.from("saved_list").upsert(
            { user_id: data.user.id, series_slug: p.series_slug, created_at: new Date().toISOString() },
            { onConflict: "user_id,series_slug" },
          );
        }
        await service.from("pending_entitlements").delete().eq("email", userEmail);
      }
    } catch {}
  }

  const redirectTo = next !== "/" ? next : "/?welcome=true";
  return redirect(redirectTo);
}

export async function signOutAction() {
  const supabase = await createServerSupabase();
  await supabase.auth.signOut();
  return redirect("/");
}
