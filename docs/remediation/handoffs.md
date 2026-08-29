# Phase 1 handoffs

One rule: if two agents need a file, the owning agent makes the change. Everyone
else writes the request here and the owner applies it.

## Ownership

| Area | Owner | Files |
|---|---|---|
| Routing, merchandising | B | `components/BrowsePage.tsx`, `components/SearchButton.tsx` + search result rendering, `lib/catalog.ts` routing helpers |
| Localization, search matching | D | `lib/i18n*`, locale dictionaries, `lib/search-index.ts`, paywall/checkout strings in `components/EpisodeFeed.tsx` |
| Shell, discovery, empty states | E | `components/CategoryTabs.tsx`, empty-state components, `app/**` marketing/footer pages |
| Identity, persistence | F | `lib/storage*`, `app/me/**`, auth routes, list/library pages |

## Contested files

- **`components/BrowsePage.tsx`** — owned by **B**. E needs empty states and the
  category strip container inside it. E writes its requirement below; B applies.
- **`components/EpisodeFeed.tsx`** — shipped in Severity 1. **Nobody edits the
  rail, the observer, the buffer budgets or the entitlement chain.** D may change
  paywall *strings* only. F requests the sign-in state here rather than editing.

## Requests

_(agents append below)_
