# Verza TV -- Coding Conventions

This document describes the conventions **currently** in use across the Verza TV
codebase. Follow these when adding or modifying code.

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
| Route handlers | `route.ts`         | `app/api/coins/route.ts`   |
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
See `docs/seo.md` for details on switching between the code-based catalog and
the Supabase-backed source.

---

## Git Workflow

- **One commit per logical change.** Do not bundle unrelated modifications into
  a single commit.
- **Build must pass before push.** Run `npm run build` (or the equivalent
  check) and confirm zero errors before pushing to the remote.

---

## Environment Variables

Typed env access is provided by `lib/env.ts`. Add new variables there so they
are validated at startup. Never read `process.env` directly outside of
`lib/env.ts`.
