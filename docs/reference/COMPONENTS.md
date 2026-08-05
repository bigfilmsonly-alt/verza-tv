# Component reference

Last reconciled: **2026-08-05**. This is a source inventory, not proof a feature
is deployed or enabled. Inspect the component and its server route/release gate
before changing behavior.

## Layout, navigation, and platform gates

| Components | Role |
| --- | --- |
| `Header`, `Footer`, `FooterSitemap`, `BottomNav` | Web shell/navigation; the footer's creator entry routes to `/studio` |
| `CategoryTabs` | Sticky web category bar: Drama, Hot, Tubi, Anime, Español, Bollywood, Creators, Reality, Red Carpet, Music. New is folded into Hot. Tubi uses the licensed `public/tubi-logo.png` partner mark and opens its dedicated click-through panel; Anime, Español, Bollywood, and Creators remain placeholder categories until releasable catalog content exists. |
| `HideInIOSApp` | Web-wrapper guard that hides unsupported web/Stripe surfaces; native uses `Platform.OS`, route boundaries, and its own StoreKit components instead |
| `ThirdPartyScripts` | Web analytics/third-party loading boundary |
| `ScrollToTop`, `HorizontalBackButton`, `InstallPrompt` | Navigation/install polish |

Web component visibility is not the iOS App Store boundary. Native iOS 2.0
independently allows only its exact StoreKit Series Unlock flow and fails closed
for Stripe/web payment, Amazon, ads/affiliate placements, UGC/admin, and non-
core payment-bearing routes before query/render.

## Catalog, browse, and search

| Components | Role |
| --- | --- |
| `BrowsePage`, `HeroCarousel`, `HeroVideo`, `RedCarpetHero`, `TubiHeroCarousel` | Web discovery and hero surfaces. Hero navigation uses automatic rotation, dots, and tab/swipe interaction; the removed arrow controls must not be documented as current UI. The Tubi surface is an authorized-partner outbound experience, not embedded Tubi playback. |
| `SeriesCard`, `ChannelRow`, `PosterSkeleton`, `ImageCarousel` | Catalog/card presentation |
| `SearchBar`, `SearchButton`, `FeedSearch` | Catalog search variants |

Catalog inputs must be live-filtered where required and import only the
client-safe Mux projection. Search/list surfaces may never expose a protected
playback ID. Native iOS applies its own live-only filtering and redirects
non-live direct links.

## Playback

| Component | Role / invariant |
| --- | --- |
| `EpisodeFeed` | Main immersive web episode feed; active ±1 source window |
| `Player` | Legacy/public-preview HLS player; paid use fails closed |
| `ShortsFeed` | Free episode-one discovery only |
| `HorizontalFeed` | Widescreen presentation |
| `EpisodeDropdown` | Episode selection |
| `SeriesInfoButton`, `SeriesInfoDrawer` | Series metadata |
| `VideoWatermark` | Playback branding |

Web uses `hls.js` where Safari/native HLS is unavailable. Native uses
`expo-video` and has a separate ≤3 attached-player invariant. Paid URLs come
from the server authorization API; components may not persist or log them.

## Payments and account recovery

| Component | Current behavior |
| --- | --- |
| `CoinPaywall` | Legacy name, current canonical $1.99 full-series Checkout on eligible web/Android surfaces; not a coin product |
| `VipCard` | Monthly/yearly UI defaults closed and follows authenticated capability booleans; management requires exact portal configuration |
| `VipCheckoutRecovery` | Provider-backed subscription recovery UI; cannot bypass release or provider gates |
| `ProfileDynamic`, `LibraryPage` | Current account/library/existing status and account actions |
| `OAuthButtons` | Supabase OAuth entry |

`SummerSaleBadge.tsx` and the old TikTok `SponsoredProducts.tsx` no longer
exist. Never reintroduce a global sale badge, coin pack, client Stripe SDK, or
hard-coded “five free” behavior from archived docs.

The iOS StoreKit purchase/restore UI lives in the native repository, not in
these web components. Its product, transaction, and entitlement contract is
documented in [`../guides/APPLE-IAP.md`](../guides/APPLE-IAP.md).

## Commerce

| Components | Boundary |
| --- | --- |
| `AddToCartButton`, `CartButton`, `CartDrawer` | Web official-merch cart; server Checkout remains feature-gated off |
| `AmazonProducts`, `AmazonBag`, `AmazonDeepLink` | Web/retained Android affiliate experience; iOS 2.0 fail-closed |

Official merch and Amazon are distinct providers/policies. Amazon prices are
not hard-coded and Checkout completes at Amazon. Neither web surface should be
mistaken for the native iOS Shop, which is prior physical-order support only.

## Creator and admin

| Components | Role |
| --- | --- |
| `CreatorBetaForm` | Limited name/email contact-PII lead capture for the web profit-sharing beta through `/api/creator/beta`, with an explicit privacy-use disclosure; it does not approve a creator, enable upload ingestion, sell PPV, or grant access |
| `CreatorDashboard`, `CreatorAITools`, `CreatorWatch` | Web creator/UGC pipeline |
| `AdminDashboard`, `AdminReview` | Web creator/financial review operations |

Creator application/dashboard/API code exists, but creator ingestion currently
fails closed while the Mux webhook verification secret is absent, and creator
PPV is disabled. Native iOS 2.0 exposes none of these components or routes; UGC
deep links redirect before query/render.

## Language, structured data, notifications, and diagnostics

| Components | Role |
| --- | --- |
| `LangProvider`, `LangDropdown`, `LanguagePicker`, `ContentTranslator` | Web language context/UI |
| `JsonLd` | Structured-data injection; paid/coming-soon Mux IDs forbidden |
| `ServiceWorker`, `PushNotificationToggle` | Web PWA/push only |
| `PerfHarness` | Controlled performance instrumentation |
| `AskVerza` | Optional AI surface; must degrade/fail safely without provider |
| `ShareRedirect` | Validated share navigation |

See [`../guides/PAYMENTS.md`](../guides/PAYMENTS.md),
[`../guides/MUX.md`](../guides/MUX.md), and
[`../guides/REACT-NATIVE-SYNC.md`](../guides/REACT-NATIVE-SYNC.md) before changing
cross-platform capability behavior.
