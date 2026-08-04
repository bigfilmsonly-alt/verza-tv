# Porting the Verza TV Experience Into Another Project

> **Archived web-extraction guide.** This predates the Expo SDK 57 native app
> and the 2026-08-03 paid-capability projection. Do not use it for the App Store
> client, copy the complete Mux map into any runtime, or adopt its old payment
> assumptions. Current truth: [`../LAUNCH-TRUTH.md`](../LAUNCH-TRUTH.md) and
> [`REACT-NATIVE-SYNC.md`](REACT-NATIVE-SYNC.md).

A complete, copy-paste guide to duplicate the Verza TV **browse + video playback**
experience as a "TV" tab inside Alan's separate branded website (a different
Cursor project).

The inventory and shell snippets below are historical architecture notes, not a
safe copy command for current source. In particular, `SummerSaleBadge.tsx` and
`SponsoredProducts.tsx` were deleted, and `lib/mux-map.ts` is a complete audit
anchor that must never enter a browser/client bundle. A current extraction must
start from `lib/mux-public-map.ts` and reimplement paid playback through an
authenticated server boundary.

The full Verza app is ~34k lines across ~90 routes (admin, creator pipeline, SEO
sitemaps, bio pages, Stripe, Supabase, AI host). **You do NOT need all of that**
to get the TV tab. This guide gives you the self-contained **core-TV module**:
the category browse page + all four video players + their foundation.

---

## 1. Stack / dependencies

Target project must be **Next.js App Router (v15+/16) + TypeScript + Tailwind
v4 + React 19**.

`package.json` runtime deps the TV module actually uses:

```jsonc
{
  "dependencies": {
    "next": "16.3.0",
    "react": "19.2.4",
    "react-dom": "19.2.4",
    "hls.js": "^1.6.16"            // Mux HLS playback in Player/EpisodeFeed/etc.
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "tailwindcss": "^4",
    "typescript": "^5",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "@types/node": "^20"
  }
}
```

Everything else in Verza's package.json (Supabase, Stripe, Mux SDK, Resend,
web-push, zod, Vercel analytics) is only needed if you also port paywall,
auth, or server webhooks. For a **playback-only tab you can skip them** and stub
the three API endpoints (see §7).

---

## 2. Config files (copy verbatim)

### `postcss.config.mjs`
```js
const config = { plugins: { "@tailwindcss/postcss": {} } };
export default config;
```

### `tsconfig.json` — the important part is the `@/*` path alias
```jsonc
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "jsx": "react-jsx",
    "module": "esnext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "noEmit": true,
    "paths": { "@/*": ["./*"] }        // <-- REQUIRED: all imports use @/lib, @/components
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules", "scripts"]
}
```

### `next.config.ts` — minimum for Mux images
```ts
import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  reactStrictMode: false, // Verza runs strict off (double-mount breaks muted-first autoplay)
  images: {
    remotePatterns: [{ protocol: "https", hostname: "image.mux.com" }],
  },
};
export default nextConfig;
```
(If you want the full CSP/security headers, copy Verza's `next.config.ts` whole —
the critical line is CSP `https://*.mux.com` so Mux's many CDN subdomains load.)

### Tailwind v4 note
There is **no `tailwind.config.js`** in v4. Tailwind is turned on purely by the
top of `app/globals.css`:
```css
@import "tailwindcss";
```
Copy Verza's `app/globals.css` (704 lines) wholesale — it holds the device-frame,
`.poster-grid`, `.episode-immersive`, tab-slide animations, safe-area rules, and
hero-poster caps the TV components rely on.

---

## 3. The exact file manifest to copy

Copy these files preserving the **same folder paths** (`components/…`, `lib/…`).
The `@/` alias makes them portable as long as paths match.

### Components (17 core + you choose ads/i18n)
```
components/BrowsePage.tsx        # the browse/home tab (category tabs + hero + poster grid)
components/Header.tsx            # top bar (logo + search + lang)
components/BottomNav.tsx         # bottom tab bar
components/Footer.tsx
components/FooterSitemap.tsx     # (Footer imports this — or delete the import)
components/CategoryTabs.tsx      # Drama / New / Hot / Music / Reality / Red Carpet
components/SearchButton.tsx      # header search popover (portal to body)

# --- video players (the heart of the TV experience) ---
components/EpisodeFeed.tsx       # immersive vertical swipe feed (main episode player)
components/Player.tsx            # standalone single-video player w/ controls
components/ShortsFeed.tsx        # horizontal shorts carousel
components/HorizontalFeed.tsx    # 16:9 widescreen list (Storage Pirates)
components/CreatorWatch.tsx      # public creator HLS player (drop if no UGC)
components/VideoWatermark.tsx    # top-left VERZA logo overlay (all players use it)

# --- optional commerce components from the current tree ---
components/CoinPaywall.tsx       # Series Unlock UI (needs authenticated /api/unlock)
components/AmazonProducts.tsx    # web/Android affiliate shop only; not browse-grid UI

# Deleted legacy files — never copy or recreate from history:
# components/SummerSaleBadge.tsx
# components/SponsoredProducts.tsx

# --- i18n + housekeeping (BrowsePage/Header depend on LangProvider) ---
components/LangProvider.tsx      # <LangProvider> context + useTranslation()
components/LangDropdown.tsx
components/ContentTranslator.tsx
components/ScrollToTop.tsx
components/ServiceWorker.tsx     # registers /sw.js (drop if no PWA/push)
components/JsonLd.tsx            # SEO structured data (drop if you don't want it)
```

### Lib (data + helpers)
```
lib/theme.ts            # design tokens T.{bg,accent,gold,text,...}
lib/catalog.ts          # THE 76-series catalog + getSeriesByCategory/getEpisode/etc.
lib/mux-public-map.ts   # client-safe rows; paid playback IDs are withheld
# lib/mux-map.ts is audit-only; mux-private-map.ts/mux-signed-map.ts are server-only
lib/horizontal-map.ts   # widescreen (Storage Pirates) playback map
lib/resume.ts           # continue-watching localStorage + resume URL builder
lib/track.ts            # lightweight client event tracker
lib/i18n.ts             # translation strings + language list
lib/search-index.ts     # SEARCH_TAGS + seriesMatchesQuery()
lib/amazon-sponsors.ts  # Amazon product data + amazonLink()
lib/perf/ttff.ts        # time-to-first-frame perf helper (ShortsFeed imports it)
lib/analytics/          # WHOLE folder — emit()/emitServerEvent() + event types
  index.ts
  emit.ts
  events.ts
  persist.ts            # (server-only; safe to drop if no analytics_events table)
  ...
```

### App routes (the pages that mount the components)
```
app/layout.tsx                          # root layout — the device-frame shell
app/globals.css                         # all the CSS (704 lines)
app/page.tsx                            # home → renders <BrowsePage/>
app/series/[slug]/[episode]/page.tsx    # the immersive episode player route
app/series/[slug]/page.tsx              # series landing page
app/shorts/page.tsx                     # renders <ShortsFeed/>
app/horizontal/page.tsx                 # renders <HorizontalFeed/>
app/watch/[...slug]/page.tsx            # creator catch-all (drop with CreatorWatch)
```

### API routes the client calls (3 endpoints)
```
app/api/watch-progress/route.ts   # GET/POST resume position (EpisodeFeed, Player)
app/api/saved-list/route.ts       # My List (BrowsePage)
app/api/unlock/route.ts           # authenticated Stripe $1.99 Series Unlock
app/api/playback/[episode]/route.ts # authenticated paid-playback capability
app/api/events/route.ts           # analytics sink (emit() beacons here)
```
For a playback-only tab you can replace all four with **no-op stubs** (§7).

### Public assets
```
public/logo.png                 # header lockup
public/watermark.png            # VideoWatermark emblem
public/og-image.png             # share thumbnail
public/favicon.ico, apple-touch-icon*.png, manifest.json, sw.js
public/posters/                 # 83 poster images (the catalog references these)
public/ads/                     # sponsor logos/product images
```

---

## 4. Dependency graph (verified from source)

This is the exact `@/` import graph so you know what pulls in what. Copy a node
and you must copy everything it points to.

```
BrowsePage
 ├─ components/CategoryTabs      ── LangProvider, lib/catalog
 ├─ components/TubiHeroCarousel ── web-only sponsored outbound panel
 ├─ components/CreatorBetaForm  ── /api/creator/beta lead capture
 ├─ components/LangProvider      ── lib/i18n, lib/track
 ├─ lib/catalog
 ├─ lib/mux-public-map
 ├─ lib/resume
 └─ lib/amazon-sponsors

Header
 ├─ components/LangDropdown      ── LangProvider, lib/i18n
 └─ components/SearchButton      ── lib/{catalog,search-index,track}

EpisodeFeed  (default export; mounted by app/series/[slug]/[episode])
 ├─ components/VideoWatermark
 └─ lib/{analytics, checkout-auth, playback-client, resume, track}

Player
 ├─ components/VideoWatermark
 └─ lib/{analytics, catalog, checkout-auth, mux-public-map, resume, theme, track}

ShortsFeed
 ├─ LangProvider, VideoWatermark
 └─ lib/{catalog, mux-public-map, perf/ttff, theme}

HorizontalFeed
 ├─ LangProvider, VideoWatermark
 └─ lib/horizontal-map

CreatorWatch
 ├─ VideoWatermark
 └─ lib/analytics

Footer            ── FooterSitemap, lib/theme
CoinPaywall       ── LangProvider, lib/analytics, lib/theme
lib/search-index  ── lib/catalog
lib/analytics/index ── ./emit ── ./events   (VideoWatermark, ScrollToTop,
                                             ServiceWorker have NO @/ deps)
```

**Relevant leaf/data libs:** theme, catalog, mux-public-map, horizontal-map,
resume, i18n, track, amazon-sponsors, perf/ttff. Re-audit imports in the current
tree before copying; this archived list is not a generated dependency graph.

---

## 5. Data model

### `lib/theme.ts` — design tokens
```ts
export const T = {
  bg: "#07070E", surface: "#12121C", raised: "#1A1A26",
  line: "rgba(255,255,255,.08)",
  text: "#F5F4F8", textDim: "#A0A0B0", textMute: "#6B6B7B",
  accent: "#E0115F", gold: "#F6C800", deepGold: "#946312",
  success: "#2ECC71", live: "#FF3B5C", coin: "#FFC83D",
} as const;
```

### `lib/catalog.ts` — the Series type + accessors
```ts
type BrowseCategory =
  | "drama" | "new" | "popular" | "tubi" | "anime" | "espanol"
  | "bollywood" | "creators" | "music" | "reality" | "red-carpet";

interface Series {
  slug: string; title: string; logline: string; genre: string;
  channel: string; categories: BrowseCategory[]; popularRank?: number;
  episodeCount: number; posterUrl: string; freeEpisodes: number;
  coinPerEpisode: number; seasonPassCoins: number;
  status: "live" | "coming_soon";
  description?: string; cast?: string[]; tags?: string[];
  rating?: string; year?: number; posterMood?: string;
}
// exported functions: getLiveSeries, getComingSoonSeries, getSeriesByCategory,
// getSeriesByChannel, getSeriesBySlug, getSeriesWithDetail, getSeriesByGenre,
// getChannels, getEpisodesForSeries, getEpisode, formatDuration
// exported constants: BROWSE_TABS, catalog (Series[])
```

### `lib/mux-public-map.ts` — client-safe playback projection
```ts
interface MuxEpisode { episode: number; playbackId?: string; duration: number; }
const MUX_MAP: Record<string, MuxEpisode[]>;   // keyed by series slug
// getPlayback(slug, episode), getRandomPlayback()
```
Only intentionally free rows have `playbackId`. Those public URLs are built as:
`https://stream.mux.com/{playbackId}.m3u8` (HLS) and
`https://image.mux.com/{playbackId}/animated.webp?width=240&fps=15&start=0&end=4`
(the looping poster preview — use a plain `<img>`, NOT `next/image`).

Paid rows deliberately contain no client capability. A current port must either
use its own authorized media or call an authenticated, ownership-checked server
endpoint that returns a short-lived signed source. Never copy `lib/mux-map.ts`,
`lib/mux-private-map.ts`, `lib/mux-signed-map.ts`, or legacy paid playback IDs
into the new client.

---

## 6. Layout shell (`app/layout.tsx`)

The whole app lives inside a single "device frame" so desktop shows an iPhone
mockup and mobile is full-bleed. The wrapper chain is:

```tsx
<body className="min-h-full flex flex-col">
  <ServiceWorker />
  <LangProvider>
    <ContentTranslator />
    <ScrollToTop />
    <div className="device-frame">
      <div className="device-screen">
        <div className="app-shell">
          <Header />
          <main className="flex-1 pb-16">{children}</main>
          <Footer />
        </div>
      </div>
      <div className="device-nav-dock"><BottomNav /></div>
    </div>
  </LangProvider>
</body>
```
`.device-frame / .device-screen / .app-shell / .device-nav-dock` are all defined
in `globals.css`. If Alan's site already has its own chrome and you only want the
TV **tab** (not the whole shell), mount `<BrowsePage/>` inside your own page and
copy just the `.poster-grid`, `.episode-immersive`, `.tab-slide*`, hero-poster,
and safe-area rules from globals.css.

Root `<html>`/`<body>` background must be `#07070E` to avoid a flash.

---

## 7. The 3 API contracts (stub these if playback-only)

The client components call these paths. If you don't want Supabase/Stripe, return
harmless JSON so nothing throws.

```ts
// app/api/watch-progress/route.ts
export async function GET()  { return Response.json({ progressSeconds: 0 }); }
export async function POST() { return Response.json({ ok: true }); }

// app/api/saved-list/route.ts
export async function GET()  { return Response.json({ items: [] }); }
export async function POST() { return Response.json({ ok: true }); }

// app/api/events/route.ts   (analytics beacon sink)
export async function POST() { return new Response(null, { status: 204 }); }

// app/api/unlock/route.ts   (only if you keep CoinPaywall)
// → authenticate and return a server-created Checkout URL, or fail closed.

// app/api/playback/[episode]/route.ts
// → authenticate + authorize paid rows and return an expiring signed source.
// Never substitute a client-visible complete Mux map.
```
`emit.ts` posts every client event to `/api/events` — the 204 stub keeps the
console clean. `resume.ts`/EpisodeFeed POST to `/api/watch-progress` every 10s.

---

## 8. Step-by-step port

1. **Scaffold** a Next 16 + TS + Tailwind v4 app in Alan's Cursor project
   (`npx create-next-app@latest --ts --app`), then add `hls.js`.
2. **Config:** overwrite `tsconfig.json` (`@/*` alias), `postcss.config.mjs`,
   `next.config.ts` (Mux image host), and prepend `@import "tailwindcss";` to
   `app/globals.css` — then paste Verza's globals.css over it.
3. **Copy leaf libs first:** `lib/theme.ts`, `catalog.ts`,
   `mux-public-map.ts`, `horizontal-map.ts`, `resume.ts`, `i18n.ts`, `track.ts`,
   `amazon-sponsors.ts`, `perf/ttff.ts`, and the whole `lib/analytics/` folder.
4. **Copy components** from §3 (start with VideoWatermark → LangProvider →
   players → CategoryTabs → BrowsePage → Header/Footer/BottomNav).
5. **Copy public assets:** `public/posters/` (83 files), `public/logo.png`,
   `watermark.png`, `og-image.png`, ad images, favicon/manifest/sw.
6. **Wire routes:** `app/layout.tsx` (shell), `app/page.tsx` (`<BrowsePage/>`),
   `app/series/[slug]/[episode]/page.tsx`, `app/shorts/page.tsx`,
   `app/horizontal/page.tsx` (+ `app/watch/[...slug]` if keeping CreatorWatch).
7. **Add the 4 API routes** — real Supabase/Stripe versions, or the stubs in §7.
8. **Type-check:** `npx tsc --noEmit`. Fix any missing import by copying the file
   it points to (follow the §4 graph). Delete `JsonLd`, `ServiceWorker`,
   `CreatorWatch`, ad components if you don't want them — remove their imports too.
9. **Run** `next dev`, open `/` → the Verza browse tab renders; tap a poster →
   `/series/{slug}/1` immersive player.

---

## 9. Things that will bite you (from Verza's own hard-won notes)

- **Muted-first autoplay (iOS):** always `video.muted = true` → `play()` →
  unmute after success. Call `video.load()` after setting `src`. Use a `mutedRef`
  (ref), not `muted` (state) inside async callbacks — state is stale in closures.
- **`reactStrictMode: false`** on purpose — strict double-mount re-fires the
  autoplay effect and breaks the muted-first sequence.
- **`.device-screen` has NO `overflow` on mobile** — setting it breaks
  `position: fixed` for the immersive players on iOS Safari.
- **Render `{children}` exactly once.** `display:none` on a duplicate does NOT
  stop its video's audio.
- **Animated Mux previews use `<img>`, not `next/image`** (the optimizer
  corrupts animated webp).
- **CSP must use `https://*.mux.com`** (Mux serves from many CDN subdomains).
- **`SITE_URL` / OG image must be the canonical host** (www) or link-preview
  crawlers that don't follow redirects show a blank thumbnail.
- **Posters are 9:16 (1080×1920); hero cards render 2:3.** Verza's final choice:
  render every hero in a centered card `aspectRatio: "2 / 3"`,
  `maxWidth: "min(320px, 80vw)"`; 2:3 reality posters use `object-cover`,
  9:16 drama/new/hot/music use `object-contain` (pillarbox side bars, never
  crops the bottom logo).

---

## 10. What you can safely leave behind

Not needed for the TV tab: `app/admin`, `app/creator`, `app/studio`, all SEO
marketing routes (`about`, `press`, `investors`, `genres`, `collections`,
`compare`, `guides`, `learn`, sitemaps, `llms.txt`, bio pages like
`alan-mruvka`/`founder`), `lib/supabase`, `lib/coins`, `lib/vip*`, `lib/email`,
`lib/creator`, `lib/mux-upload`, Stripe webhooks, and the Ask-Verza AI chatbot —
unless Alan specifically wants those features too.

---

### Quick copy command (from the Verza repo, into Alan's project)

```bash
SRC="/path/to/verza-tv"; DST="/path/to/alans-project"
# leaf libs
mkdir -p "$DST/lib/perf" "$DST/lib/analytics"
cp "$SRC"/lib/{theme,catalog,mux-public-map,horizontal-map,resume,i18n,track,amazon-sponsors,search-index}.ts "$DST/lib/"
cp "$SRC"/lib/perf/ttff.ts "$DST/lib/perf/"
cp "$SRC"/lib/analytics/*.ts "$DST/lib/analytics/"
# components
cp "$SRC"/components/{BrowsePage,Header,BottomNav,Footer,FooterSitemap,CategoryTabs,SearchButton,EpisodeFeed,Player,ShortsFeed,HorizontalFeed,CreatorWatch,VideoWatermark,CoinPaywall,AmazonProducts,LangProvider,LangDropdown,ContentTranslator,ScrollToTop,ServiceWorker,JsonLd}.tsx "$DST/components/"
# public
cp -R "$SRC"/public/posters "$SRC"/public/ads "$DST/public/"
cp "$SRC"/public/{logo.png,watermark.png,og-image.png,favicon.ico,manifest.json,sw.js} "$DST/public/"
cp "$SRC"/public/apple-touch-icon*.png "$DST/public/"
# config + shell
cp "$SRC"/{tsconfig.json,postcss.config.mjs,next.config.ts} "$DST/"
cp "$SRC"/app/globals.css "$DST/app/globals.css"
# routes (recreate app/layout.tsx, app/page.tsx per §6)
```
Then follow §8 (type-check, stub APIs, run).
