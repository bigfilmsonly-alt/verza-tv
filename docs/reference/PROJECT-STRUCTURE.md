# Project structure

Directory map reconciled with the source tree on **2026-08-05**. Source
structure is not production-deployment evidence.

```
verza-tv/
├── app/                      # Next.js 16 App Router (pages + API)
│   ├── actions/              # Server actions
│   ├── admin/                # Admin dashboard + content review
│   │   ├── dashboard/
│   │   └── review/
│   ├── api/                  # Route handlers (see API-REFERENCE.md)
│   │   └── iap/apple/        # StoreKit preflight, signed transaction, V2 notifications
│   ├── series/[slug]/[episode]/   # Episode watch page (immersive feed)
│   ├── creator/  studio/     # Creator dashboard (UGC pipeline)
│   ├── shop/[slug]/          # Merch storefront
│   ├── search/               # Search page
│   ├── shorts/  horizontal/  # Alternate players (vertical shorts / 16:9)
│   ├── discover/  genres/  genre/  best/  compare/  guides/  learn/
│   │                         # SEO landing-page clusters
│   ├── watch-in/[slug]/      # Geo SEO pages
│   ├── sitemaps/             # XML sitemap route handlers
│   ├── llms.txt/             # LLM crawler-manifest route
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
│   ├── catalog.ts            # 80-title catalog (79 live, one coming soon)
│   ├── products.ts           # Merch products
│   ├── amazon-sponsors.ts    # Web/Android Amazon affiliate catalog
│   ├── search-index.ts       # Search tags + matcher
│   ├── mux-public-map.ts     # Client-safe projection (459 public IDs)
│   ├── mux-private-map.ts    # Server-only complete-map gateway
│   ├── mux-signed-map.ts     # 3,753 paid-live signed counterparts
│   ├── mux.ts / mux-*.ts     # Playback authorization/signing + upload
│   ├── series-purchase*.ts   # Canonical $1.99 offer/recovery/ledger logic
│   ├── stripe-*.ts           # Consent, tax, webhook, provider policy
│   ├── apple-iap-*.ts        # Append-only products, JWS trust, ledger, public roots
│   ├── coins.ts / vip*.ts    # Coins dormant; VIP release-gated
│   ├── creator.ts            # Creator pipeline helpers
│   ├── admin.ts              # Admin auth gate
│   ├── theme.ts              # Design tokens (T.*)
│   ├── schemas.ts            # JSON-LD structured data
│   ├── i18n.ts               # Translations
│   ├── email.ts              # Resend transactional email
│   └── env.ts                # Typed env accessor
│
├── supabase/
│   └── migrations/           # Ordered SQL migrations 001–015 (+ seed/history)
├── scripts/                  # Mux/payment audits, generators, guarded ops
├── public/                   # Static assets (posters, /ads, icons, sw)
├── docs/                     # This documentation set
│
├── middleware.ts             # Rate limiting + auth + noindex on previews
├── next.config.ts            # Next config (reactStrictMode: false, CSP, images)
├── tailwind (postcss.config.mjs)
├── tsconfig.json
├── AGENTS.md                 # Shared editing/release rules
├── CLAUDE.md / CODEX.md      # Intentional @AGENTS.md pointers
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
mobile, `absolute` on desktop). See [ARCHITECTURE.md](ARCHITECTURE.md).

## Key conventions

- All request APIs are async: `await cookies()`, `await headers()`, `await params`.
- Server-render crawlable content; client components only for interactivity.
- Never expose API keys, paid playback IDs, or signed URLs to the client.
- Server-side pricing only — never trust client-supplied prices.
- Provider-backed webhook or exact authenticated confirmation may record/recover
  a purchase; browser return and client analytics never do.
- Apple product identity is append-only; StoreKit UI/transaction IDs never
  grant access without backend JWS verification and ledger reconciliation.
- Client runtime imports only `mux-public-map.ts`; complete/private/signed maps
  stay server/audit-only.
- A successful build is not production truth; deploy and read back the canonical
  `https://www.verzatv.com` origin.
