# Verza TV

The first US-based vertical micro-drama streaming platform. 80+ originals, all vertical, all in minutes.

**Live:** https://verza-tv.vercel.app
**Production (future):** https://verzatv.com

## Stack
- Next.js 16.2.9 (App Router, Turbopack)
- TypeScript + React 19
- Tailwind CSS v4
- Supabase (auth, database, RLS)
- Mux (HLS video streaming, 4,472 assets)
- Stripe (payments, webhooks)
- Anthropic (AI Host)
- Vercel (deployment)

## Quick Start
```bash
git clone https://github.com/bigfilmsonly-alt/verza-tv.git
cd verza-tv
npm install
cp .env.example .env.local  # fill in your keys
npm run dev                  # http://localhost:3000
```

## Where Things Live
- [Architecture](docs/ARCHITECTURE.md)
- [Routes](docs/ROUTES.md)
- [Data Model](docs/DATA-MODEL.md)
- [Content System](docs/CONTENT.md)
- [Mux Video](docs/MUX.md)
- [Payments](docs/PAYMENTS.md)
- [SEO](docs/SEO.md)
- [Environment](docs/ENV.md)
- [Deployment](docs/DEPLOYMENT.md)
- [Runbook](docs/RUNBOOK.md)
