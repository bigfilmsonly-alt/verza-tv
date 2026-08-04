import { getUser } from "@/lib/auth";
import { getServiceClient } from "@/lib/supabase/server";

/**
 * Server-side VIP check for React Server Components.
 *
 * Reads the Supabase access token from cookies, resolves the user,
 * then checks profiles.is_vip + expiry.
 *
 * Returns provider-synchronized display/access state for the current account.
 * Never throws.
 */
export type VipStatus = {
  isVip: boolean;
  expiresAt: string | null;
  cancelAtPeriodEnd: boolean;
};

const NO_VIP: VipStatus = {
  isVip: false,
  expiresAt: null,
  cancelAtPeriodEnd: false,
};

export async function getVipStatusServer(): Promise<VipStatus> {
  try {
    const user = await getUser();
    if (!user) return NO_VIP;

    const supabase = getServiceClient();

    const { data: profile } = await supabase
      .from("profiles")
      .select(
        "is_vip,vip_expires_at,vip_payment_blocked,vip_cancel_at_period_end",
      )
      .eq("id", user.id)
      .single();

    if (!profile?.is_vip || profile.vip_payment_blocked) return NO_VIP;

    if (profile.vip_expires_at) {
      const expiry = new Date(profile.vip_expires_at);
      if (expiry < new Date()) return NO_VIP;
    }

    return {
      isVip: true,
      expiresAt: profile.vip_expires_at,
      cancelAtPeriodEnd: profile.vip_cancel_at_period_end,
    };
  } catch {
    return NO_VIP;
  }
}

export async function checkVipStatusServer(): Promise<boolean> {
  return (await getVipStatusServer()).isVip;
}
