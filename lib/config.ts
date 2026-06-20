export const BRAND = {
  name: "Verza TV",
  domain: "verzatv.com",
  tagline: "Microdramas, Reality & More.",
  accentHex: "#E0115F", // confirm with Alan
  nameVariant: "Verza", // confirm with Alan: "Versa" vs "Verza"
} as const;

export const COIN_PACKS = [
  { id: "starter", coins: 100, price: 199, bonus: 50, label: "Starter" },
  { id: "fan", coins: 300, price: 499, bonus: 30, label: "Fan" },
  { id: "binge", coins: 700, price: 999, bonus: 100, label: "Binge", popular: true },
  { id: "super", coins: 1500, price: 1999, bonus: 300, label: "Super" },
  { id: "mega", coins: 3500, price: 4999, bonus: 1000, label: "Mega", bestValue: true },
] as const;

export const FREE_EPISODES = 5;
export const DEFAULT_COIN_PER_EPISODE = 49;
export const VIP_MONTHLY_CENTS = 999; // $9.99/mo
export const VIP_YEARLY_CENTS = 7999; // $79.99/yr (save 33%)

// Backward-compatible aliases (used by help, llms.txt)
export const VIP_WEEKLY = VIP_MONTHLY_CENTS; // legacy alias
export const VIP_YEARLY = VIP_YEARLY_CENTS; // legacy alias
export const VIP_PLANS = {
  monthly: {
    id: "monthly" as const,
    label: "Monthly",
    cents: 999,
    interval: "month" as const,
    intervalCount: 1,
  },
  yearly: {
    id: "yearly" as const,
    label: "Yearly",
    cents: 7999,
    interval: "year" as const,
    intervalCount: 1,
    badge: "Save 33%",
  },
} as const;
