# Core Web Vitals + App Store Readiness

## Core Web Vitals Targets

| Metric | Target | Current Tools |
|--------|--------|---------------|
| LCP | < 2.0s | Vercel Speed Insights, Lighthouse |
| CLS | < 0.1 | Vercel Speed Insights |
| INP | < 200ms | Vercel Speed Insights |

### Optimization Checklist

- [x] next/image with sizes + priority on above-fold images
- [x] Inter font with display: swap + variable loading
- [x] Mux HLS with adaptive streaming (auto quality)
- [x] Dynamic import for hls.js (reduces initial JS bundle)
- [x] Vercel Speed Insights installed (@vercel/speed-insights)
- [x] Vercel Analytics installed (@vercel/analytics)
- [ ] Image format audit (convert any remaining PNG posters to WebP)
- [ ] Review JS bundle size (next/bundle-analyzer)
- [ ] Lazy load below-fold browse sections
- [ ] Preconnect to image.mux.com and stream.mux.com
- [ ] Review server response time (target < 200ms TTFB)

### Font Optimization
- Inter loaded via next/font/google with variable subset
- display: swap prevents invisible text

### Image Optimization
- All 76+ poster images at 1080x1920 (2:3 aspect ratio)
- next/image with automatic format conversion (WebP/AVIF)
- sizes attribute set per component context

### Video Optimization
- HLS adaptive streaming via Mux
- Dynamic import of hls.js (not in initial bundle)
- Poster thumbnails displayed until playback starts
- reactStrictMode: false prevents double HLS mount

## App Store Readiness Checklist

### Legal (HUMAN GATE — requires legal review)
- [x] Terms of Service page (/terms)
- [x] Privacy Policy page (/privacy)
- [x] Refund Policy page (/refund-policy)
- [ ] Legal review of all policy pages
- [ ] COPPA compliance review (age gate on sign-up exists)
- [ ] GDPR/CCPA data deletion workflow

### Content Ratings
- [ ] Determine content rating (likely TV-14 or TV-MA)
- [ ] Add content advisory on series with mature themes
- [ ] Age rating metadata for app stores

### Subscription Requirements (Apple/Google)
- [x] Monthly plan: $9.99/mo
- [x] Yearly plan: $79.99/yr (save 33%)
- [x] Stripe Checkout handles web subscriptions
- [ ] Apple In-App Purchase integration (required for iOS)
- [ ] Google Play Billing integration (required for Android)
- [ ] Subscription management page (/me or /settings)

### App Store Metadata
- [ ] App name: Verza TV
- [ ] Short description (30 chars): Micro-Dramas & More
- [ ] Full description (4000 chars): write for each store
- [ ] Screenshots: 6.7" iPhone, 5.5" iPhone, iPad, Android
- [ ] App icon: 1024x1024 (match current favicon/PWA icons)
- [ ] Category: Entertainment
- [ ] Keywords: micro-drama, short series, vertical video, streaming

### PWA (Current State)
- [x] manifest.json with app metadata
- [x] Service worker with offline fallback
- [x] Apple touch icons (180x180, 512x512)
- [x] Theme color: #07070E
- [x] Status bar: black-translucent
- [x] Push notification support (VAPID keys configured)
