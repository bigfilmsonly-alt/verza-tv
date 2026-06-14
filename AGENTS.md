<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Verza TV

## Stack
- Next.js 16 App Router + TypeScript + Tailwind v4
- Supabase (auth, database, RLS)
- Mux (video playback, signed URLs)
- Stripe (payments, webhooks)
- Anthropic (AI Host)
- Vercel (deployment)

## Rules
- All request APIs are async: await cookies(), await headers(), await params
- Server-render crawlable content; client components only for interactivity
- Never expose API keys or signed URLs to the client
- Coins are primary monetization; no "$4.99/mo only"
- Preview deploys are noindex; only production indexes

## Key files
- lib/catalog.ts -- 80 series catalog
- lib/products.ts -- 10 merch products
- lib/theme.ts -- design tokens
- lib/schemas.ts -- JSON-LD structured data
- lib/series-detail.ts -- rich metadata per series
- lib/env.ts -- typed environment variable helper
