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
export const VIP_WEEKLY = 1999;
export const VIP_YEARLY = 19900;
