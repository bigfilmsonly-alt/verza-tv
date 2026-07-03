# Runbook — Verza TV

Common operational tasks for maintaining and updating the Verza TV platform.

---

## Pre-Launch Checklist

### Legal (REQUIRED before production payments)
- [ ] Terms of Service reviewed by attorney (currently draft at /terms)
- [ ] Privacy Policy reviewed by attorney (currently draft at /privacy)
- [ ] Refund Policy reviewed by attorney (currently draft at /refund-policy)
- [ ] COPPA compliance verified (13+ age gate on sign-up)
- [ ] CCPA/GDPR data deletion flow implemented

### Payments
- [ ] Stripe account verified and approved
- [ ] Switch from test keys to live keys (STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET)
- [ ] Webhook endpoint verified: https://verzatv.com/api/stripe/webhook
- [ ] Test purchase → coins → unlock → play loop passes with live keys
- [ ] Refund handling tested

### Authentication
- [ ] Supabase Auth configured (email + Google + Apple)
- [ ] SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY set in Vercel
- [ ] Password reset flow works
- [ ] Account deletion flow works (required for App Store)

### Domain & DNS
- [ ] verzatv.com DNS pointed to Vercel (A record: 76.76.21.21)
- [ ] www.verzatv.com CNAME → cname.vercel-dns.com
- [ ] SSL certificate auto-provisioned by Vercel
- [ ] All 301 redirects verified (old slugs → new)
- [ ] robots.txt switches to index: true on production domain

### Content
- [ ] All 76 series have correct poster art (9:16, 1080x1920)
- [ ] Mux mapping reconciliation shows 0 orphans, 0 duplicates
- [ ] Video playback verified on iOS Safari, Chrome, Firefox
- [ ] Free gate (first 5 episodes) confirmed working

### App Stores (if applicable)
- [ ] iOS App Store listing approved
- [ ] Google Play listing approved
- [ ] apple-itunes-app smart banner with real app ID
- [ ] Deep links tested (Universal Links + App Links)

### Monitoring
- [ ] Error tracking configured (Sentry or similar)
- [ ] Uptime monitoring on key endpoints
- [ ] Stripe webhook delivery monitoring
- [ ] Mux asset health check scheduled

### Final Verification
- [ ] Money loop test passes: sign up → buy coins → unlock → play → logout → login → still unlocked
- [ ] Lighthouse mobile performance ≥ 90
- [ ] View Source shows real content (no empty body)
- [ ] Rich Results Test validates JSON-LD
- [ ] Social share previews work (OG image renders in iMessage/Slack/Twitter)

---

## Add a Series

1. Add the series entry to `lib/catalog.ts` (slug, title, genre, episode count, etc.)
2. Add rich detail to `lib/series-detail.ts` (synopsis, cast, tags, ratings)
3. Add poster image to `public/posters/{slug}.png` (recommended 400x600)
4. Add Mux playback ID mappings to `lib/mux-map.ts` (one entry per episode)
5. Verify the series page renders: `http://localhost:3005/series/{slug}`

## Attach a Transcript

```bash
npx tsx scripts/attach-transcript.ts <slug> <episode-number> <transcript-file>
```

The script reads the transcript file and associates it with the given series slug and episode number.

## Flip to Supabase Content

By default the app serves content from in-code catalogs. To switch to Supabase-backed content:

1. Set `CONTENT_SOURCE=supabase` in your environment (`.env.local` or Vercel dashboard)
2. Apply database migrations: `npx supabase db push`
3. Backfill series and episode data into the Supabase tables
4. Verify by loading any series page and confirming data renders correctly

## Re-verify Mux Mapping

Run the verification script to test that all Mux playback IDs in `lib/mux-map.ts` resolve to valid assets:

```bash
node scripts/verify-mux-map.js
```

Review output for any 404s or expired signing tokens.

## Submit Sitemap

1. Open [Google Search Console](https://search.google.com/search-console)
2. Navigate to Sitemaps and submit: `https://verzatv.com/sitemap.xml`
3. Open [Bing Webmaster Tools](https://www.bing.com/webmasters)
4. Submit the same URL: `https://verzatv.com/sitemap.xml`

The sitemap index at `/sitemap.xml` links to child sitemaps for pages, shows, episodes, and genres.

## Deploy

**Auto-deploy (recommended):**

```bash
git push origin main
```

Vercel auto-deploys on push to `main`. Preview deploys are created for all other branches.

**Manual deploy:**

```bash
npx vercel --prod --yes
```

## Rotate API Keys

1. Generate the new key in the provider dashboard (Supabase, Mux, Stripe, Anthropic)
2. Go to [Vercel Dashboard](https://vercel.com) > Project > Settings > Environment Variables
3. Update the relevant variable with the new value
4. Redeploy: Vercel > Deployments > triple-dot menu > Redeploy (or `npx vercel --prod --yes`)
5. Revoke the old key in the provider dashboard

## Common Issues

| Symptom | Likely cause | Fix |
|---|---|---|
| Black screen on iOS video | hls.js loaded at module scope | Ensure hls.js is dynamically imported |
| Series page 404 | Missing catalog entry | Add to `lib/catalog.ts` |
| Mux 403 on playback | Expired signing key or wrong playback ID | Check `MUX_SIGNING_KEY_*` env vars |
| Supabase RLS denials | Missing policy or wrong role | Review RLS policies in Supabase dashboard |
