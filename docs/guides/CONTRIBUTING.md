# Contributing to Verza TV

Last reconciled: **2026-08-03**. Read [`../../AGENTS.md`](../../AGENTS.md) and
[`../LAUNCH-TRUTH.md`](../LAUNCH-TRUTH.md) first; payment, Mux, catalog, legal,
and native-contract changes have additional release gates.

## Getting Started

1. Clone the repo and install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.local.example` to `.env.local` and fill in approved local values.
3. Start the dev server:
   ```bash
   PORT=3005 npm run dev
   ```
4. Open `http://localhost:3005` in your browser.

## Branch Strategy

- `main` is the production branch. Its integration may create a production-target
  Vercel deployment, but it does not itself promote the canonical live alias in
  the observed project workflow. Release with `npx vercel --prod --yes`, then
  read back the intended deployment at `https://www.verzatv.com`; neither a push
  nor an uploaded deployment is release evidence by itself. See
  [`DEPLOYMENT.md`](DEPLOYMENT.md).
- Create feature branches off `main`: `feature/your-feature-name`
- Preview deploys are created automatically for non-main branches.

## Code Style

- **TypeScript** is required for all source files. No `any` types without justification.
- **Tailwind v4** for styling. Theme tokens are defined in `@theme inline` blocks in `globals.css`, not in a config file.
- **Server-first rendering.** Use Server Components by default. Only add `"use client"` when the component genuinely needs browser APIs or interactivity.
- **Async request APIs.** All Next.js request helpers are async: `await cookies()`, `await headers()`, `await params`.
- **No secrets/capabilities on the client.** Never expose API keys, signing
  secrets, protected Mux IDs, or signed URLs. `NEXT_PUBLIC_*` means visible,
  not automatically safe; only deliberately public values belong there.

## File Naming

- Components: `PascalCase.tsx` (e.g., `VideoPlayer.tsx`)
- Lib modules: `kebab-case.ts` (e.g., `mux-playback.ts`)
- Routes: follow Next.js App Router conventions (`page.tsx`, `layout.tsx`, `route.ts`)

## Adding Content

See [`CONTENT.md`](CONTENT.md) and [`RUNBOOK.md`](RUNBOOK.md). A catalog change
also requires public/signed Mux regeneration, native byte-sync, and client
capability scans; never hand-edit the native copy.

## Commit Messages

Use clear, imperative-mood messages:
- `add series detail page for The Winter Veil`
- `fix iOS black screen on HLS playback`
- `update merch product prices`

Keep the first line under 72 characters. Add a blank line and details below if needed.

## Pull Requests

- Keep PRs focused on a single concern.
- Include a brief description of what changed and why.
- Run the applicable payment/playback gates, typecheck, lint, and build before
  opening a PR.
- Preview deploy links are generated automatically -- include a note about what to test.

## Testing

- Baseline: `npm run test:playback-security`, `npm run test:payments`,
  `npm run test:payments:db`, `npx tsc --noEmit`, `npm run lint`, and
  `npm run build`.
- Manually test on both desktop and mobile viewports.
- For video changes, test on Safari (native HLS) and Chrome (hls.js).

## Documentation

- Update `docs/CHANGELOG.md` when a user-facing change is actually shipped;
  label staged/unreleased work explicitly.
- Update `docs/LAUNCH-TRUTH.md` plus every affected runbook/reference when an
  operational contract or production readback changes.
- Do not commit `.env.local` or any file containing real credentials.

## Questions

If something is unclear, check the existing docs in the `docs/` directory or open an issue.
