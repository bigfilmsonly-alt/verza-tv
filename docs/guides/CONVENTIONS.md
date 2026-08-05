# Verza TV -- Coding Conventions

This document describes the conventions **currently** in use across the Verza TV
codebase, reconciled **2026-08-05**. Follow these with the stricter payment,
Apple IAP, Mux, deployment, and native-boundary rules in
[`../../AGENTS.md`](../../AGENTS.md).

---

## Folder Structure

```
app/            Next.js App Router pages and API route handlers
components/     Shared React components (one component per file)
lib/            Utility modules, data sources, and configuration
  content/      Content abstraction layer (pluggable source adapter)
  seo/          Metadata builders and JSON-LD schema generators
  supabase/     Supabase client initialization and typed schema
public/         Static assets (posters, shop images, icons)
scripts/        One-off CLI scripts (e.g., transcript attachment)
supabase/       Database migrations
docs/           Project documentation
```

---

## Naming

| Category       | Convention        | Example                    |
|----------------|-------------------|----------------------------|
| Components     | PascalCase `.tsx`  | `SeriesCard.tsx`           |
| Lib modules    | kebab-case `.ts`   | `mux-playback.ts`         |
| Pages          | `page.tsx`         | `app/about/page.tsx`       |
| Route handlers | `route.ts`         | `app/api/unlock/route.ts`  |
| Migrations     | numbered prefix    | `001_schema.sql`           |

---

## Import Alias

The `@/` alias maps to the project root. Always use it for internal imports
instead of relative paths.

```ts
import { catalog } from "@/lib/catalog";
import SeriesCard from "@/components/SeriesCard";
```

---

## Server vs Client Components

All components are **server components by default**. Add `"use client"` only
when the component requires browser APIs, event handlers, or React hooks
(`useState`, `useEffect`, etc.).

```tsx
// Server component (default -- no directive needed)
export default function PosterSkeleton() { ... }

// Client component (interactive)
"use client";
export default function CartDrawer() { ... }
```

---

## Async Request APIs (Next.js 16)

Next.js 16 makes all request-scoped APIs async. Always `await` them:

```ts
const cookieStore = await cookies();
const headerList = await headers();
const { slug } = await params;
```

Never destructure directly from the function call without awaiting.

---

## Theme Tokens

Design tokens (colors, spacing, font references) are defined in
`lib/theme.ts`. Use these tokens when adding new styles or components to keep
the visual language consistent.

Do **not** hard-code hex values in component files. Import from the theme
module instead.

---

## Structured Data (JSON-LD)

- Canonical builders live in `lib/seo/schema.ts`.
- `lib/schemas.ts` re-exports from `lib/seo/schema.ts` for backward
  compatibility (see `docs/AUDIT.md` for details).
- Render structured data with the `<JsonLd />` component.
- One `<script type="application/ld+json">` block per entity per page.

---

## Content Source

The app uses a pluggable content adapter defined in `lib/content/source.ts`.
The code adapter is the only supported production source; the Supabase adapter
is scaffolded and must not be enabled as a simple environment flip. See
[`CONTENT.md`](CONTENT.md).

Client/SEO content imports `mux-public-map.ts`, never the complete map. New
catalog/Mux rows go through the shared AST parser and audited generators, then
sync byte-identically to native.

---

## Git Workflow

- **One commit per logical change.** Do not bundle unrelated modifications into
  a single commit.
- **All applicable gates must pass before push.** At minimum run typecheck,
  lint, build, playback-security, and payment tests; production/provider
  readbacks remain separate.

---

## Environment Variables

General typed env access is provided by `lib/env.ts`. Security/release flags may
use narrow server-only parsers that read `process.env` directly when exact
`true`/`false`, missing, malformed, and compatibility states must be
distinguished. Do not route those through a permissive generic helper. Every
new variable must be documented in [`ENV.md`](ENV.md), kept out of client
modules unless intentionally public, and covered by missing/malformed tests.

Apple product IDs are immutable external identities. Add mappings only through
the reviewed append-only manifest; retirement is an overlay, not deletion.
Apple transaction and notification JWS verification stays server-only, and a
StoreKit success callback never substitutes for the canonical ledger RPC.
