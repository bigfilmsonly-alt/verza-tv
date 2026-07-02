# Project Structure

Directory map of the Verza TV codebase. Generated from the live tree.

```
verza-tv/
├── app/                      # Next.js 16 App Router (pages + API)
│   ├── actions/              # Server actions
│   ├── admin/                # Admin dashboard + content review
│   │   ├── dashboard/
│   │   └── review/
│   ├── api/                  # Route handlers (see API-REFERENCE.md)
│   ├── series/[slug]/[episode]/   # Episode watch page (immersive feed)
│   ├── creator/  studio/     # Creator dashboard (UGC pipeline)
│   ├── shop/[slug]/          # Merch storefront
│   ├── search/               # Search page
│   ├── shorts/  horizontal/  # Alternate players (vertical shorts / 16:9)
│   ├── discover/  genres/  genre/  best/  compare/  guides/  learn/
│   │                         # SEO landing-page clusters
│   ├── watch-in/[slug]/      # Geo SEO pages
│   ├── sitemaps/             # XML sitemap route handlers
│   ├── llms.txt              # LLM crawler manifest
│   ├── about/ press/ careers/ contact/ terms/ privacy/ refund-policy/
│   │   founder/ alan-mruvka/ media-kit/ brand-assets/ newsroom/
│   │   partnerships/ editorial-standards/   # Static marketing/legal pages
│   ├── me/  library/         # Signed-in user pages (list, library)
│   └── sign-up/  sign-in     # Auth
│
├── components/               # React components (see COMPONENTS.md)
├── lib/                      # Non-UI logic, data, integrations
│   ├── analytics/            # Event stream (emit + server persist)
│   ├── content/  data/       # Catalog + content data
│   ├── perf/  seo/           # Perf harness, SEO helpers
│   ├── supabase/             # Supabase client factories
│   ├── catalog.ts            # 76-series catalog
│   ├── products.ts           # Merch products
│   ├── sponsors.ts           # TikTok Shop sponsored products
│   ├── search-index.ts       # Search tags + matcher
│   ├── mux.ts / mux-*.ts     # Mux playback + upload + map
│   ├── coins.ts / vip.ts     # Monetization primitives
│   ├── creator.ts            # Creator pipeline helpers
│   ├── admin.ts              # Admin auth gate
│   ├── theme.ts              # Design tokens (T.*)
│   ├── schemas.ts            # JSON-LD structured data
│   ├── i18n.ts               # Translations
│   ├── email.ts              # Resend transactional email
│   └── env.ts                # Typed env accessor
│
├── supabase/
│   └── migrations/           # SQL migrations 001–005 (+ seed)
├── scripts/                  # reconcile-mux.ts, attach-transcript.ts
├── public/                   # Static assets (posters, /ads, icons, sw)
├── docs/                     # This documentation set
│
├── middleware.ts             # Rate limiting + auth + noindex on previews
├── next.config.ts            # Next config (reactStrictMode: false, CSP, images)
├── tailwind (postcss.config.mjs)
├── tsconfig.json
├── AGENTS.md / CLAUDE.md      # Editing rules
└── package.json
```

## Layout shell (rendering model)

Single-render nesting used across the app:

```
.device-frame   (desktop: iPhone frame, overflow:hidden)
  └ .device-screen   (desktop: overflow-y:auto · mobile: NO overflow — keeps position:fixed working on iOS)
      └ .app-shell
          ├ <Header/>
          └ <main>{children}</main>
```

Immersive video uses the `.episode-immersive` class (`position:fixed` on
mobile, `absolute` on desktop). See [ARCHITECTURE.md](../ARCHITECTURE.md).

## Key conventions

- All request APIs are async: `await cookies()`, `await headers()`, `await params`.
- Server-render crawlable content; client components only for interactivity.
- Never expose API keys or signed URLs to the client.
- Server-side pricing only — never trust client-supplied prices.
- Revenue is recorded **only** from the Stripe webhook (single source of truth).
