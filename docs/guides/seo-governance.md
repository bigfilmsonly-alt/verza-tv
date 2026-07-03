# SEO Governance

Rules and standards that govern how Verza TV content is indexed, structured, and validated for search engines. Every contributor and automated pipeline must follow these rules.

---

## 1. Indexability Rules

No page may be indexed unless **all five** conditions are met:

| Condition               | Requirement                                                  |
| ----------------------- | ------------------------------------------------------------ |
| Editorial Approved      | Content has been reviewed and approved for public visibility |
| Unique Content          | Page contains substantive, original content (no thin/duplicate pages) |
| Metadata Complete       | `title`, `description`, and `canonical` URL are all present and non-empty |
| Schema Valid             | At least one valid JSON-LD block is present on the page      |
| Internal Links Present  | Page is reachable via at least one internal link from the site |

If **any** condition fails:

- The page MUST include `<meta name="robots" content="noindex">`.
- The page MUST be excluded from all sitemaps.
- The page MUST NOT appear in internal search results as a linkable destination.

---

## 2. Existing Enforcement

The following mechanisms are already built and operational.

### Governance Firewall (lib/seo/governance.ts)

- `checkIndexability()` — master gate: checks editorial approval, content, metadata, links
- `isSeriesIndexable()` / `isEpisodeIndexable()` — catalog-specific checks
- `validateSchemaCompliance()` — prevents fake ratings, reviews, authors in JSON-LD
- `isProductionDeploy()` — ensures only production domain indexes
- Content types: series/episode (auto-approved), genre_hub/editorial/authority/educational (require approval), admin/auth/search (never indexed)

### Indexability Gates

- `lib/content/indexability.ts` exports `isIndexableShow()` and `isIndexableEpisode()`.
- These functions enforce the conditions above at build time and request time.
- Sitemaps (`/sitemap.xml` and all segmented sitemaps) only include content that passes the indexability check.

### Preview and Non-Production Deploys

- `robots.txt` blocks all crawlers on non-production deployments (Vercel preview URLs).
- `X-Robots-Tag: noindex` header is set on all preview deploy responses.
- Production is defined as the `verzatv.com` domain (not yet cut over) and `verza-tv.vercel.app` (current staging).

### Search Results Page

- `/search` is always `noindex` -- search results pages must never be indexed.

---

## 3. Content Standards

### Prohibited Practices

- **No AI-generated content without human review.** Any content produced by AI tooling must be reviewed and approved by a human editor before it goes live.
- **No fake reviews, ratings, authors, or statistics.** All social proof (view counts, trending badges) must be clearly presentational and not represented as factual in structured data.
- **No doorway, city, or location pages.** Pages created solely to rank for geographic or keyword variations are not permitted.
- **No keyword stuffing or hidden text.** All visible text must serve the user. CSS-hidden text intended for crawlers is prohibited.

### Minimum Content Requirements

Every **series** must have:

- Poster image (1080x1920, stored in `/public/posters/`)
- Synopsis / description (non-empty, minimum 50 characters)
- At least 1 published episode

Every **episode** must have:

- Mux asset with a valid playback ID (mapped in `lib/mux-map.ts`)
- Title (non-empty)

Content that does not meet these minimums MUST be gated behind `noindex` until the gaps are filled.

---

## 4. Schema Coverage

Structured data (JSON-LD) is required on every indexable page. The table below defines which schema types belong on which page types.

| Page Type      | Route Pattern              | Required Schemas                                  |
| -------------- | -------------------------- | ------------------------------------------------- |
| Home           | `/`                        | Organization, WebSite, MobileApplication          |
| Series Detail  | `/series/[slug]`           | TVSeries, BreadcrumbList                           |
| Episode        | `/series/[slug]/[episode]` | TVEpisode (with VideoObject), TVSeries, BreadcrumbList |
| Genre / Browse | `/genre/[slug]`            | ItemList, BreadcrumbList                           |
| Help / FAQ     | `/help`                    | FAQPage                                            |

### Universal Requirements (All Pages)

- **Canonical URL** -- every page must have `<link rel="canonical" href="...">` pointing to its single authoritative URL.
- **No schema conflicts** -- a page must not contain multiple conflicting `@type` declarations for the same entity.
- **Valid JSON-LD** -- all structured data must pass the Google Rich Results Test without errors.

---

## 5. Validation Checklist for New Pages

Before any new page type ships to production, verify every item below.

### Metadata

- [ ] `<title>` is unique, descriptive, and under 60 characters
- [ ] `<meta name="description">` is unique, compelling, and under 160 characters
- [ ] `<link rel="canonical">` is present and points to the correct URL
- [ ] Open Graph tags are set (`og:title`, `og:description`, `og:image`, `og:url`)

### Indexability

- [ ] Page passes `isIndexableShow()` or `isIndexableEpisode()` (if applicable)
- [ ] Page is included in the appropriate segmented sitemap
- [ ] Page is reachable via at least one internal link
- [ ] Page does NOT have `noindex` unless intentionally excluded

### Structured Data

- [ ] Correct JSON-LD schema types are present (see table above)
- [ ] JSON-LD validates without errors in Google Rich Results Test
- [ ] No duplicate or conflicting schema blocks

### Content Quality

- [ ] Content is original and substantive (not thin or auto-generated)
- [ ] No hidden text, keyword stuffing, or manipulative patterns
- [ ] All media assets load correctly (posters, video thumbnails)
- [ ] All internal links resolve (no 404s)

### Technical

- [ ] Page renders correctly with JavaScript disabled (SSR content is present)
- [ ] Page loads in under 3 seconds on mobile (Lighthouse check)
- [ ] Dark theme is consistent (no white flash, no `bg-white`)
- [ ] `robots.txt` does not accidentally block the page

### Pre-Launch Sign-Off

- [ ] At least one team member has reviewed the page against this checklist
- [ ] Structured data tested in Rich Results Test
- [ ] Page verified in Google Search Console URL Inspection (post-deploy)
