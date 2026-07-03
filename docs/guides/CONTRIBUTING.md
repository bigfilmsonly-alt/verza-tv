# Contributing to Verza TV

## Getting Started

1. Clone the repo and install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env.local` and fill in your keys.
3. Start the dev server:
   ```bash
   PORT=3005 npm run dev
   ```
4. Open `http://localhost:3005` in your browser.

## Branch Strategy

- `main` is the production branch. Pushes to `main` auto-deploy to Vercel.
- Create feature branches off `main`: `feature/your-feature-name`
- Preview deploys are created automatically for non-main branches.

## Code Style

- **TypeScript** is required for all source files. No `any` types without justification.
- **Tailwind v4** for styling. Theme tokens are defined in `@theme inline` blocks in `globals.css`, not in a config file.
- **Server-first rendering.** Use Server Components by default. Only add `"use client"` when the component genuinely needs browser APIs or interactivity.
- **Async request APIs.** All Next.js request helpers are async: `await cookies()`, `await headers()`, `await params`.
- **No secrets on the client.** Never expose API keys, signing secrets, or signed URLs to client-side code. Only `NEXT_PUBLIC_*` variables are safe for the browser.

## File Naming

- Components: `PascalCase.tsx` (e.g., `VideoPlayer.tsx`)
- Lib modules: `kebab-case.ts` (e.g., `mux-playback.ts`)
- Routes: follow Next.js App Router conventions (`page.tsx`, `layout.tsx`, `route.ts`)

## Adding Content

See `docs/RUNBOOK.md` for step-by-step instructions on adding series, episodes, transcripts, and merch products.

## Commit Messages

Use clear, imperative-mood messages:
- `add series detail page for The Winter Veil`
- `fix iOS black screen on HLS playback`
- `update merch product prices`

Keep the first line under 72 characters. Add a blank line and details below if needed.

## Pull Requests

- Keep PRs focused on a single concern.
- Include a brief description of what changed and why.
- Ensure `npm run build` passes before opening a PR.
- Preview deploy links are generated automatically -- include a note about what to test.

## Testing

- Run `npm run build` to catch type errors and build issues.
- Manually test on both desktop and mobile viewports.
- For video changes, test on Safari (native HLS) and Chrome (hls.js).

## Documentation

- Update `docs/CHANGELOG.md` when shipping user-facing changes.
- Update `docs/RUNBOOK.md` when operational procedures change.
- Do not commit `.env.local` or any file containing real credentials.

## Questions

If something is unclear, check the existing docs in the `docs/` directory or open an issue.
