function getEnv(key: string, required = false): string {
  const val = process.env[key] ?? "";
  if (required && !val) {
    console.warn(`Missing required env: ${key}`);
  }
  return val;
}

export const env = {
  siteUrl: getEnv("NEXT_PUBLIC_SITE_URL") || "https://verzatv.com",
  supabaseUrl: getEnv("SUPABASE_URL"),
  supabaseAnonKey: getEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  supabaseServiceKey: getEnv("SUPABASE_SERVICE_ROLE_KEY"),
  muxTokenId: getEnv("MUX_TOKEN_ID"),
  muxTokenSecret: getEnv("MUX_TOKEN_SECRET"),
  muxSigningKeyId: getEnv("MUX_SIGNING_KEY_ID"),
  muxSigningKeySecret: getEnv("MUX_SIGNING_KEY_SECRET"),
  stripeSecretKey: getEnv("STRIPE_SECRET_KEY"),
  stripeWebhookSecret: getEnv("STRIPE_WEBHOOK_SECRET"),
  anthropicApiKey: getEnv("ANTHROPIC_API_KEY"),
  isProduction: process.env.VERCEL_ENV === "production",
} as const;
