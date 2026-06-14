export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  coin_balance: number;
  is_vip: boolean;
  vip_expires_at: string | null;
  streak_days: number;
  language: string;
}

export interface CoinLedgerEntry {
  id: string;
  user_id: string;
  amount: number;
  reason: string;
  reference_id: string | null;
  balance_after: number;
  created_at: string;
}

export interface Entitlement {
  id: string;
  user_id: string;
  series_slug: string;
  episode_number: number | null;
  granted_at: string;
}

export interface Purchase {
  id: string;
  user_id: string;
  provider: string;
  provider_id: string;
  product_type: string;
  product_id: string;
  amount_cents: number;
  currency: string;
  status: string;
  created_at: string;
}

export interface WatchProgress {
  user_id: string;
  series_slug: string;
  episode_number: number;
  progress_seconds: number;
  completed: boolean;
  updated_at: string;
}

export interface MyListEntry {
  user_id: string;
  series_slug: string;
  added_at: string;
}
